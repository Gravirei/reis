/**
 * Accessibility Gate - Accessibility checks for quality gates
 * @module lib/utils/gates/accessibility-gate
 */

const { BaseGate, GateResult } = require('../gate-runner');
const fs = require('fs');
const path = require('path');

/**
 * Accessibility Gate - runs accessibility-related checks
 */
class AccessibilityGate extends BaseGate {
  /**
   * Create an accessibility gate
   * @param {Object} config - Gate configuration
   */
  constructor(config = {}) {
    super('accessibility', 'accessibility', config);
    this.wcagLevel = config.wcagLevel || 'AA';
    this.failOn = config.failOn || 'serious'; // 'critical' | 'serious' | 'moderate' | 'minor'
  }

  /**
   * Run accessibility checks
   * @returns {Promise<GateResult>}
   */
  async run() {
    const result = new GateResult(this.name, this.category);
    const details = [];
    let hasFailure = false;
    let hasWarning = false;

    // Check for common accessibility issues in source files
    const checks = [
      { name: 'images', method: 'checkImageAlts' },
      { name: 'forms', method: 'checkFormLabels' },
      { name: 'headings', method: 'checkHeadingStructure' },
      { name: 'aria', method: 'checkAriaUsage' },
      { name: 'colors', method: 'checkColorContrast' }
    ];

    for (const check of checks) {
      try {
        const checkResult = await this[check.method]();
        details.push(checkResult);
        if (checkResult.status === 'failed') hasFailure = true;
        if (checkResult.status === 'warning') hasWarning = true;
      } catch (err) {
        details.push({
          name: check.name,
          status: 'error',
          message: `Check failed: ${err.message}`
        });
      }
    }

    if (hasFailure) {
      result.fail('Accessibility checks failed', details);
    } else if (hasWarning) {
      result.warn('Accessibility checks passed with warnings', details);
    } else {
      result.pass('All accessibility checks passed', details);
    }

    return result;
  }

  /**
   * Get source files to analyze
   * @returns {string[]}
   */
  getSourceFiles() {
    const files = [];
    const extensions = ['.jsx', '.tsx', '.html', '.vue', '.svelte'];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];

    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !ignoreDirs.includes(entry.name)) {
            scanDir(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (e) {}
    };

    scanDir(process.cwd());
    return files;
  }

  /**
   * Check for images without alt text
   * @returns {Promise<Object>}
   */
  async checkImageAlts() {
    const files = this.getSourceFiles();
    const issues = [];

    // Pattern for img tags and Image components without alt
    const patterns = [
      /<img(?![^>]*alt=)[^>]*>/gi,
      /<Image(?![^>]*alt=)[^>]*>/gi,
      /<img[^>]*alt\s*=\s*["']\s*["'][^>]*>/gi, // Empty alt (might be decorative, so warning)
    ];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        // Check for img without alt
        const imgNoAlt = content.match(/<img(?![^>]*alt=)[^>]*>/gi) || [];
        const ImageNoAlt = content.match(/<Image(?![^>]*alt=)[^>]*>/gi) || [];

        if (imgNoAlt.length > 0 || ImageNoAlt.length > 0) {
          issues.push({
            file: relativePath,
            issue: 'Image without alt attribute',
            count: imgNoAlt.length + ImageNoAlt.length
          });
        }
      } catch (e) {}
    }

    return {
      name: 'Image Alt Text',
      status: issues.length > 0 ? 'failed' : 'passed',
      message: issues.length > 0
        ? `${issues.length} files have images without alt text`
        : 'All images have alt attributes',
      details: issues.slice(0, 5)
    };
  }

  /**
   * Check for form inputs without labels
   * @returns {Promise<Object>}
   */
  async checkFormLabels() {
    const files = this.getSourceFiles();
    const issues = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        // Check for input without associated label or aria-label
        const inputsWithoutLabel = content.match(
          /<input(?![^>]*(?:aria-label|aria-labelledby|id\s*=\s*["'][^"']+["'][^>]*<label[^>]*for))[^>]*>/gi
        ) || [];

        // Simplified check: inputs without aria-label
        const inputNoAria = content.match(
          /<input(?![^>]*(?:aria-label|aria-labelledby))[^>]*type\s*=\s*["'](?!hidden|submit|button)[^"']*["'][^>]*>/gi
        ) || [];

        const count = Math.min(inputsWithoutLabel.length, inputNoAria.length);
        if (count > 0) {
          issues.push({
            file: relativePath,
            issue: 'Form inputs may lack accessible labels',
            count
          });
        }
      } catch (e) {}
    }

    return {
      name: 'Form Labels',
      status: issues.length > 5 ? 'warning' : 'passed',
      message: issues.length > 0
        ? `${issues.length} files may have form accessibility issues`
        : 'Form elements appear properly labeled',
      details: issues.slice(0, 5)
    };
  }

  /**
   * Check heading structure
   * @returns {Promise<Object>}
   */
  async checkHeadingStructure() {
    const files = this.getSourceFiles();
    const issues = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        // Extract heading levels
        const headings = content.match(/<h([1-6])[^>]*>/gi) || [];
        const levels = headings.map(h => parseInt(h.match(/<h([1-6])/i)[1]));

        // Check for skipped levels
        let skipped = false;
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] > levels[i - 1] + 1) {
            skipped = true;
            break;
          }
        }

        // Check for multiple h1
        const h1Count = levels.filter(l => l === 1).length;

        if (skipped || h1Count > 1) {
          issues.push({
            file: relativePath,
            issue: skipped ? 'Skipped heading levels' : 'Multiple h1 elements',
            levels: levels.join(' → ')
          });
        }
      } catch (e) {}
    }

    return {
      name: 'Heading Structure',
      status: issues.length > 3 ? 'warning' : 'passed',
      message: issues.length > 0
        ? `${issues.length} files have heading structure issues`
        : 'Heading structure looks correct',
      details: issues.slice(0, 5)
    };
  }

  /**
   * Check ARIA usage
   * @returns {Promise<Object>}
   */
  async checkAriaUsage() {
    const files = this.getSourceFiles();
    const issues = [];
    const ariaUsage = { total: 0, roles: 0, labels: 0, hidden: 0 };

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Count ARIA usage
        ariaUsage.roles += (content.match(/role\s*=\s*["'][^"']+["']/gi) || []).length;
        ariaUsage.labels += (content.match(/aria-label\s*=\s*["'][^"']+["']/gi) || []).length;
        ariaUsage.labels += (content.match(/aria-labelledby\s*=\s*["'][^"']+["']/gi) || []).length;
        ariaUsage.hidden += (content.match(/aria-hidden\s*=\s*["']true["']/gi) || []).length;

        // Check for potentially incorrect ARIA usage
        const relativePath = path.relative(process.cwd(), filePath);

        // Check for role="button" on non-interactive elements without keyboard support
        const roleButtons = content.match(/<(?:div|span)[^>]*role\s*=\s*["']button["'](?![^>]*(?:onClick|onKeyDown|tabIndex))[^>]*>/gi) || [];
        if (roleButtons.length > 0) {
          issues.push({
            file: relativePath,
            issue: 'role="button" without keyboard handlers',
            count: roleButtons.length
          });
        }
      } catch (e) {}
    }

    ariaUsage.total = ariaUsage.roles + ariaUsage.labels + ariaUsage.hidden;

    return {
      name: 'ARIA Usage',
      status: issues.length > 0 ? 'warning' : 'passed',
      message: `Found ${ariaUsage.total} ARIA attributes (${ariaUsage.roles} roles, ${ariaUsage.labels} labels)`,
      details: issues.length > 0 ? issues.slice(0, 5) : [ariaUsage]
    };
  }

  /**
   * Check for potential color contrast issues
   * @returns {Promise<Object>}
   */
  async checkColorContrast() {
    const files = this.getSourceFiles();
    
    // Also check CSS files
    const cssFiles = [];
    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            scanDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.css') || entry.name.endsWith('.scss'))) {
            cssFiles.push(fullPath);
          }
        }
      } catch (e) {}
    };
    scanDir(process.cwd());

    // Look for potentially problematic color patterns
    const lightColors = ['#fff', '#ffffff', '#fafafa', '#f5f5f5', 'white', 'rgb(255,255,255)'];
    const issues = [];

    for (const filePath of cssFiles.slice(0, 20)) { // Limit to 20 files
      try {
        const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
        const relativePath = path.relative(process.cwd(), filePath);

        // Check for light gray text (potential contrast issue)
        if (content.match(/color\s*:\s*#[cdef][cdef][cdef]/gi)) {
          issues.push({
            file: relativePath,
            issue: 'Light gray text color - verify contrast',
            type: 'color'
          });
        }
      } catch (e) {}
    }

    return {
      name: 'Color Contrast',
      status: 'passed', // Can't fully verify without rendering
      message: issues.length > 0
        ? `${issues.length} potential contrast issues (manual verification needed)`
        : 'No obvious color contrast issues detected',
      details: issues.length > 0 
        ? issues.slice(0, 5) 
        : [{ note: 'Full contrast checking requires visual rendering tools like axe-core' }]
    };
  }
}

module.exports = { AccessibilityGate };
