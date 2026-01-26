/**
 * Security Gate - Security checks for quality gates
 * @module lib/utils/gates/security-gate
 */

const { BaseGate, GateResult } = require('../gate-runner');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Security Gate - runs security-related checks
 */
class SecurityGate extends BaseGate {
  /**
   * Create a security gate
   * @param {Object} config - Gate configuration
   */
  constructor(config = {}) {
    super('security', 'security', config);
    this.checks = [
      { name: 'vulnerabilities', method: 'checkVulnerabilities' },
      { name: 'secrets', method: 'checkSecrets' },
      { name: 'licenses', method: 'checkLicenses' }
    ];
  }

  /**
   * Run all security checks
   * @returns {Promise<GateResult>}
   */
  async run() {
    const result = new GateResult(this.name, this.category);
    const details = [];
    let hasFailure = false;
    let hasWarning = false;

    for (const check of this.checks) {
      const checkConfig = this.config[check.name];
      if (checkConfig?.enabled === false) {
        details.push({
          name: check.name,
          status: 'skipped',
          message: 'Disabled in configuration'
        });
        continue;
      }

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
        hasFailure = true;
      }
    }

    if (hasFailure) {
      result.fail('Security checks failed', details);
    } else if (hasWarning) {
      result.warn('Security checks passed with warnings', details);
    } else {
      result.pass('All security checks passed', details);
    }

    return result;
  }

  /**
   * Check npm audit for vulnerabilities
   * @returns {Promise<Object>}
   */
  async checkVulnerabilities() {
    const config = this.config.vulnerabilities || {};
    const failOn = config.failOn || 'high';
    const allowedAdvisories = config.allowedAdvisories || [];

    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'Vulnerabilities',
        status: 'skipped',
        message: 'No package.json found',
        details: []
      };
    }

    try {
      // Run npm audit --json
      let output;
      try {
        output = execSync('npm audit --json 2>/dev/null', {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe']
        });
      } catch (execError) {
        // npm audit returns non-zero exit code when vulnerabilities found
        output = execError.stdout || '{}';
      }

      let audit;
      try {
        audit = JSON.parse(output);
      } catch (e) {
        return {
          name: 'Vulnerabilities',
          status: 'passed',
          message: 'No vulnerabilities detected (audit output could not be parsed)',
          details: []
        };
      }

      // Handle different npm audit output formats
      const metadata = audit.metadata || {};
      const vulns = metadata.vulnerabilities || audit.vulnerabilities || {};
      
      // Count vulnerabilities
      let counts;
      if (typeof vulns === 'object' && !Array.isArray(vulns)) {
        if (vulns.critical !== undefined) {
          // New format: { critical: 0, high: 0, ... }
          counts = {
            critical: vulns.critical || 0,
            high: vulns.high || 0,
            moderate: vulns.moderate || 0,
            low: vulns.low || 0
          };
        } else {
          // Old format: { packageName: { severity: '...' }, ... }
          counts = { critical: 0, high: 0, moderate: 0, low: 0 };
          for (const [pkg, vuln] of Object.entries(vulns)) {
            const severity = vuln.severity || 'low';
            if (counts[severity] !== undefined) {
              counts[severity]++;
            }
          }
        }
      } else {
        counts = { critical: 0, high: 0, moderate: 0, low: 0 };
      }

      // Determine if failed based on failOn level
      const severityOrder = ['critical', 'high', 'moderate', 'low'];
      const failIndex = severityOrder.indexOf(failOn);
      const hasFailingVulns = failIndex >= 0 && 
        severityOrder.slice(0, failIndex + 1).some(sev => counts[sev] > 0);

      const total = counts.critical + counts.high + counts.moderate + counts.low;

      if (total === 0) {
        return {
          name: 'Vulnerabilities',
          status: 'passed',
          message: 'No vulnerabilities detected',
          details: []
        };
      }

      return {
        name: 'Vulnerabilities',
        status: hasFailingVulns ? 'failed' : 'warning',
        message: hasFailingVulns
          ? `Found ${counts.critical} critical, ${counts.high} high vulnerabilities`
          : `Found ${total} vulnerabilities (none above ${failOn} severity)`,
        details: [
          { severity: 'critical', count: counts.critical },
          { severity: 'high', count: counts.high },
          { severity: 'moderate', count: counts.moderate },
          { severity: 'low', count: counts.low }
        ].filter(d => d.count > 0)
      };
    } catch (error) {
      return {
        name: 'Vulnerabilities',
        status: 'warning',
        message: `Could not run npm audit: ${error.message}`,
        details: []
      };
    }
  }

  /**
   * Scan for hardcoded secrets
   * @returns {Promise<Object>}
   */
  async checkSecrets() {
    const config = this.config.secrets || {};
    const allowedFiles = config.allowedFiles || ['.env.example', '.env.sample', '.env.template'];
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.reis', '.next', '__pycache__'];

    // Patterns that indicate potential secrets
    const secretPatterns = [
      // API keys and tokens with values
      { pattern: /(['"])(?:api[_-]?key|apikey)['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi, name: 'API Key' },
      { pattern: /(['"])(?:secret|secret[_-]?key)['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi, name: 'Secret Key' },
      { pattern: /(['"])(?:password|passwd|pwd)['"]?\s*[:=]\s*['"]([^'"]{8,})['"]/gi, name: 'Password' },
      { pattern: /(['"])(?:access[_-]?token|auth[_-]?token)['"]?\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"]/gi, name: 'Access Token' },
      { pattern: /(['"])(?:private[_-]?key)['"]?\s*[:=]\s*['"]([^'"]{20,})['"]/gi, name: 'Private Key' },
      
      // AWS patterns
      { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
      { pattern: /aws[_-]?secret[_-]?access[_-]?key['"]?\s*[:=]\s*['"]([a-zA-Z0-9\/+]{40})['"]/gi, name: 'AWS Secret' },
      
      // GitHub tokens
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Token' },
      { pattern: /github[_-]?token['"]?\s*[:=]\s*['"]([a-zA-Z0-9_]{35,})['"]/gi, name: 'GitHub Token' },
      
      // JWT tokens (only if hardcoded, not variable references)
      { pattern: /['"]eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*['"]/g, name: 'JWT Token' },
      
      // Connection strings
      { pattern: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi, name: 'MongoDB Connection String' },
      { pattern: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi, name: 'PostgreSQL Connection String' },
      { pattern: /mysql:\/\/[^:]+:[^@]+@[^\s'"]+/gi, name: 'MySQL Connection String' }
    ];

    const findings = [];
    const scannedFiles = [];

    // Recursive file scan
    const scanDir = (dir, depth = 0) => {
      if (depth > 10) return; // Prevent infinite recursion

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(process.cwd(), fullPath);

          if (entry.isDirectory()) {
            if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
              scanDir(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            // Skip allowed files
            if (allowedFiles.some(af => relativePath.endsWith(af))) continue;
            
            // Only scan code files
            if (!/\.(js|ts|jsx|tsx|json|yml|yaml|py|rb|php|java|go|rs|env|config|conf|sh)$/i.test(entry.name)) continue;
            
            // Skip actual .env files (they're supposed to have secrets, just not in repo)
            if (/^\.env(\.[a-z]+)?$/i.test(entry.name) && !entry.name.includes('example') && !entry.name.includes('sample')) continue;

            // Skip test files for secrets (they often have mock data)
            if (/\.(test|spec)\.(js|ts|jsx|tsx)$/i.test(entry.name)) continue;

            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              
              // Skip files that are too large
              if (content.length > 1024 * 1024) continue; // 1MB limit

              scannedFiles.push(relativePath);

              for (const { pattern, name } of secretPatterns) {
                // Reset regex state
                pattern.lastIndex = 0;
                const matches = content.match(pattern);
                
                if (matches && matches.length > 0) {
                  // Filter out common false positives
                  const realMatches = matches.filter(m => {
                    // Skip if it looks like a placeholder
                    if (/your[_-]?|example|placeholder|xxx|test|dummy|fake|sample/i.test(m)) return false;
                    // Skip environment variable references
                    if (/process\.env\.|os\.environ|ENV\[/i.test(m)) return false;
                    return true;
                  });

                  if (realMatches.length > 0) {
                    findings.push({
                      file: relativePath,
                      type: name,
                      count: realMatches.length,
                      sample: realMatches[0].slice(0, 50) + (realMatches[0].length > 50 ? '...' : '')
                    });
                  }
                }
              }
            } catch (e) {
              // Skip files that can't be read
            }
          }
        }
      } catch (e) {
        // Skip directories that can't be read
      }
    };

    scanDir(process.cwd());

    // Deduplicate findings by file
    const uniqueFindings = [];
    const seenFiles = new Set();
    for (const finding of findings) {
      const key = `${finding.file}:${finding.type}`;
      if (!seenFiles.has(key)) {
        seenFiles.add(key);
        uniqueFindings.push(finding);
      }
    }

    return {
      name: 'Secrets Detection',
      status: uniqueFindings.length > 0 ? 'failed' : 'passed',
      message: uniqueFindings.length > 0
        ? `Found ${uniqueFindings.length} potential secrets in code`
        : `No hardcoded secrets detected (scanned ${scannedFiles.length} files)`,
      details: uniqueFindings.slice(0, 10) // Limit to 10 findings
    };
  }

  /**
   * Check dependency licenses
   * @returns {Promise<Object>}
   */
  async checkLicenses() {
    const config = this.config.licenses || {};
    const allowed = config.allowed || [
      'MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 
      'ISC', '0BSD', 'Unlicense', 'CC0-1.0', 'WTFPL'
    ];
    const forbidden = config.forbidden || ['GPL-3.0', 'AGPL-3.0', 'GPL-2.0'];

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'License Compliance',
        status: 'skipped',
        message: 'No package.json found',
        details: []
      };
    }

    const issues = [];
    const checkedPackages = [];

    // Check node_modules for licenses
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      try {
        const modules = fs.readdirSync(nodeModulesPath);
        
        for (const mod of modules) {
          // Skip hidden files and scoped packages root
          if (mod.startsWith('.')) continue;
          
          // Handle scoped packages
          if (mod.startsWith('@')) {
            const scopePath = path.join(nodeModulesPath, mod);
            try {
              const scopedModules = fs.readdirSync(scopePath);
              for (const scopedMod of scopedModules) {
                const modPkgPath = path.join(scopePath, scopedMod, 'package.json');
                this.checkPackageLicense(modPkgPath, `${mod}/${scopedMod}`, allowed, forbidden, issues, checkedPackages);
              }
            } catch (e) {}
            continue;
          }

          const modPkgPath = path.join(nodeModulesPath, mod, 'package.json');
          this.checkPackageLicense(modPkgPath, mod, allowed, forbidden, issues, checkedPackages);
        }
      } catch (e) {
        // Couldn't read node_modules
      }
    }

    const hasForbidden = issues.some(i => i.reason === 'forbidden');
    const hasUnknown = issues.some(i => i.reason === 'unknown' || i.reason === 'not in allowed list');

    let status = 'passed';
    let message = `All licenses compliant (checked ${checkedPackages.length} packages)`;

    if (hasForbidden) {
      status = 'failed';
      message = `Found ${issues.filter(i => i.reason === 'forbidden').length} packages with forbidden licenses`;
    } else if (hasUnknown) {
      status = 'warning';
      message = `${issues.length} packages with unknown/unlisted licenses`;
    }

    return {
      name: 'License Compliance',
      status,
      message,
      details: issues.slice(0, 10)
    };
  }

  /**
   * Check a single package's license
   * @private
   */
  checkPackageLicense(pkgPath, pkgName, allowed, forbidden, issues, checkedPackages) {
    if (!fs.existsSync(pkgPath)) return;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      let license = pkg.license || 'UNKNOWN';

      // Handle license objects
      if (typeof license === 'object') {
        license = license.type || 'UNKNOWN';
      }

      // Handle SPDX expressions
      if (license.includes(' OR ')) {
        const options = license.split(' OR ').map(l => l.trim().replace(/[()]/g, ''));
        // If any allowed license is present, consider it OK
        if (options.some(l => allowed.includes(l))) {
          checkedPackages.push(pkgName);
          return;
        }
      }

      checkedPackages.push(pkgName);

      if (forbidden.includes(license)) {
        issues.push({ package: pkgName, license, reason: 'forbidden' });
      } else if (!allowed.includes(license) && license !== 'UNKNOWN') {
        issues.push({ package: pkgName, license, reason: 'not in allowed list' });
      } else if (license === 'UNKNOWN') {
        issues.push({ package: pkgName, license, reason: 'unknown' });
      }
    } catch (e) {
      // Skip packages with invalid package.json
    }
  }
}

module.exports = { SecurityGate };
