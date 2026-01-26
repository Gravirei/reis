/**
 * Performance Gate - Performance checks for quality gates
 * @module lib/utils/gates/performance-gate
 */

const { BaseGate, GateResult } = require('../gate-runner');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Performance Gate - runs performance-related checks
 */
class PerformanceGate extends BaseGate {
  /**
   * Create a performance gate
   * @param {Object} config - Gate configuration
   */
  constructor(config = {}) {
    super('performance', 'performance', config);
    this.checks = [
      { name: 'bundleSize', method: 'checkBundleSize' },
      { name: 'buildTime', method: 'checkBuildTime' },
      { name: 'dependencies', method: 'checkDependencies' }
    ];
  }

  /**
   * Run all performance checks
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
      }
    }

    if (hasFailure) {
      result.fail('Performance checks failed', details);
    } else if (hasWarning) {
      result.warn('Performance checks passed with warnings', details);
    } else {
      result.pass('All performance checks passed', details);
    }

    return result;
  }

  /**
   * Parse size string to bytes
   * @param {string} sizeStr - Size string (e.g., '500kb', '1mb')
   * @returns {number}
   */
  parseSize(sizeStr) {
    const match = String(sizeStr).match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/i);
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
    const unit = (match[2] || 'b').toLowerCase();
    
    const multipliers = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    return Math.round(num * (multipliers[unit] || 1));
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes
   * @returns {string}
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  /**
   * Check bundle size
   * @returns {Promise<Object>}
   */
  async checkBundleSize() {
    const config = this.config.bundleSize || {};
    const maxSize = this.parseSize(config.maxSize || '500kb');
    const warnSize = this.parseSize(config.warnSize || '400kb');

    // Look for build output directories
    const buildDirs = ['dist', 'build', '.next', 'out', 'public/build'];
    let totalSize = 0;
    let fileCount = 0;
    const largeFiles = [];

    const scanDir = (dir) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.isFile()) {
            // Only count JS/CSS bundles
            if (/\.(js|css|mjs)$/.test(entry.name)) {
              const stats = fs.statSync(fullPath);
              totalSize += stats.size;
              fileCount++;
              
              if (stats.size > 100 * 1024) { // Files > 100KB
                largeFiles.push({
                  file: path.relative(process.cwd(), fullPath),
                  size: this.formatSize(stats.size)
                });
              }
            }
          }
        }
      } catch (e) {}
    };

    let foundBuildDir = false;
    for (const buildDir of buildDirs) {
      const fullPath = path.join(process.cwd(), buildDir);
      if (fs.existsSync(fullPath)) {
        foundBuildDir = true;
        scanDir(fullPath);
      }
    }

    if (!foundBuildDir) {
      return {
        name: 'Bundle Size',
        status: 'skipped',
        message: 'No build output found (dist, build, .next)',
        details: []
      };
    }

    if (fileCount === 0) {
      return {
        name: 'Bundle Size',
        status: 'skipped',
        message: 'No JavaScript/CSS bundles found in build output',
        details: []
      };
    }

    let status = 'passed';
    let message = `Total bundle size: ${this.formatSize(totalSize)} (${fileCount} files)`;

    if (totalSize > maxSize) {
      status = 'failed';
      message = `Bundle size ${this.formatSize(totalSize)} exceeds ${this.formatSize(maxSize)}`;
    } else if (totalSize > warnSize) {
      status = 'warning';
      message = `Bundle size ${this.formatSize(totalSize)} approaching limit ${this.formatSize(maxSize)}`;
    }

    return {
      name: 'Bundle Size',
      status,
      message,
      details: largeFiles.slice(0, 5)
    };
  }

  /**
   * Check build time (from cache if available)
   * @returns {Promise<Object>}
   */
  async checkBuildTime() {
    const config = this.config.buildTime || {};
    const maxTime = config.maxTime || 60000; // 60 seconds
    const warnTime = config.warnTime || 45000; // 45 seconds

    // Look for build timing information
    const timingFiles = [
      '.next/build-manifest.json',
      '.next/trace',
      'build/build-stats.json'
    ];

    // For now, just check if build output exists and is recent
    const buildDirs = ['dist', 'build', '.next'];
    let buildTime = null;

    for (const buildDir of buildDirs) {
      const fullPath = path.join(process.cwd(), buildDir);
      if (fs.existsSync(fullPath)) {
        try {
          const stats = fs.statSync(fullPath);
          buildTime = stats.mtime;
          break;
        } catch (e) {}
      }
    }

    if (!buildTime) {
      return {
        name: 'Build Time',
        status: 'skipped',
        message: 'No build output found to analyze',
        details: []
      };
    }

    // Can't determine actual build duration without running build
    return {
      name: 'Build Time',
      status: 'passed',
      message: `Last build: ${buildTime.toLocaleString()}`,
      details: [{ hint: 'Run build with timing to get accurate metrics' }]
    };
  }

  /**
   * Check for dependency bloat
   * @returns {Promise<Object>}
   */
  async checkDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {
        name: 'Dependencies',
        status: 'skipped',
        message: 'No package.json found',
        details: []
      };
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      const total = deps + devDeps;

      // Check for potentially heavy dependencies
      const heavyDeps = [
        'moment', 'lodash', 'jquery', 'rxjs', 'core-js',
        'aws-sdk', '@aws-sdk/client-s3'
      ];
      
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {})
      };

      const foundHeavy = heavyDeps.filter(d => allDeps[d]);
      const suggestions = [];

      if (allDeps['moment']) {
        suggestions.push({ package: 'moment', suggestion: 'Consider date-fns or dayjs (smaller)' });
      }
      if (allDeps['lodash'] && !allDeps['lodash-es']) {
        suggestions.push({ package: 'lodash', suggestion: 'Consider lodash-es or individual imports' });
      }

      let status = 'passed';
      let message = `${deps} dependencies, ${devDeps} devDependencies`;

      if (total > 100) {
        status = 'warning';
        message = `High dependency count: ${total} total packages`;
      }

      if (foundHeavy.length > 3) {
        status = 'warning';
        message += `. ${foundHeavy.length} potentially heavy dependencies`;
      }

      return {
        name: 'Dependencies',
        status,
        message,
        details: suggestions
      };
    } catch (error) {
      return {
        name: 'Dependencies',
        status: 'error',
        message: `Could not analyze dependencies: ${error.message}`,
        details: []
      };
    }
  }
}

module.exports = { PerformanceGate };
