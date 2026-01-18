/**
 * Issue Classifier - Categorizes debug issues into types
 * Implements FR2.1: Distinguishes incomplete implementations from bugs
 */

const fs = require('fs');
const path = require('path');

class IssueClassifier {
  constructor() {
    this.patterns = this.loadPatterns();
  }

  /**
   * Load classification patterns
   */
  loadPatterns() {
    return {
      // FR2.1: Incomplete Implementation patterns (check FIRST)
      'incomplete-implementation': {
        keywords: [
          'NOT FOUND',
          'MISSING',
          'does not exist',
          'cannot find',
          'incomplete',
          'tasks:.*complete',
          'completeness:',
          'missing deliverable'
        ],
        indicators: [
          'completion < 100%',
          'file expected but absent',
          'function not exported',
          'task skipped',
          'deliverable missing'
        ],
        severity: {
          critical: ['blocks phase', 'core feature missing', '0% complete'],
          major: ['feature missing', 'functionality absent', '< 50% complete'],
          minor: ['docs missing', 'optional feature absent', '> 80% complete']
        }
      },

      // Test Failures
      'test-failure': {
        keywords: [
          'test failed',
          'assertion error',
          'expected.*but got',
          'expected:',
          'received:',
          'FAIL',
          'test suite',
          'jest',
          'mocha',
          'Error:.*test'
        ],
        indicators: [
          'exit code 1',
          'tests:.*failed',
          '[0-9]+ failed',
          'assertion failed',
          'test timeout'
        ],
        severity: {
          critical: ['all tests fail', 'test suite broken', 'cannot run tests'],
          major: ['multiple tests fail', '[3-9]+ failed'],
          minor: ['single test fails', '1 failed']
        }
      },

      // Quality Issues
      'quality-issue': {
        keywords: [
          'eslint',
          'syntax error',
          'type error',
          'typescript',
          'linting',
          'prettier',
          'compilation error',
          'build failed'
        ],
        indicators: [
          'lint errors',
          'type checking failed',
          'compilation failed',
          'build error'
        ],
        severity: {
          critical: ['cannot build', 'syntax error', 'compilation failed'],
          major: ['multiple lint errors', 'type errors'],
          minor: ['formatting issues', 'single lint warning']
        }
      },

      // Documentation Problems
      'docs-problem': {
        keywords: [
          'readme',
          'documentation',
          'docs missing',
          'api docs',
          'comments',
          'jsdoc',
          'example'
        ],
        indicators: [
          'missing documentation',
          'outdated docs',
          'incomplete readme',
          'no examples'
        ],
        severity: {
          critical: ['no readme', 'api undocumented'],
          major: ['incomplete docs', 'outdated examples'],
          minor: ['missing comments', 'typos in docs']
        }
      },

      // Regression Issues
      'regression': {
        keywords: [
          'regression',
          'used to work',
          'broke',
          'breaking change',
          'git bisect',
          'previously working'
        ],
        indicators: [
          'worked in commit',
          'broke after',
          'breaking commit',
          'git history'
        ],
        severity: {
          critical: ['production broken', 'core feature regressed'],
          major: ['feature broken', 'API changed'],
          minor: ['edge case broken', 'minor behavior change']
        }
      },

      // Integration Issues
      'integration-issue': {
        keywords: [
          'integration',
          'api mismatch',
          'interface',
          'contract',
          'components',
          'modules',
          'incompatible'
        ],
        indicators: [
          'modules incompatible',
          'api contract violated',
          'interface mismatch',
          'integration failed'
        ],
        severity: {
          critical: ['system cannot integrate', 'api broken'],
          major: ['components incompatible', 'interface issues'],
          minor: ['minor mismatch', 'warning in integration']
        }
      },

      // Dependency Issues
      'dependency-issue': {
        keywords: [
          'npm',
          'package',
          'dependency',
          'module not found',
          'cannot resolve',
          'peer dependency',
          'version conflict'
        ],
        indicators: [
          'package missing',
          'version mismatch',
          'peer dependency warning',
          'npm install failed'
        ],
        severity: {
          critical: ['cannot install', 'missing required package'],
          major: ['version conflict', 'peer dependency issue'],
          minor: ['optional dependency missing', 'warning only']
        }
      }
    };
  }

  /**
   * Main classification method
   * FR2.1: Checks for incomplete implementations FIRST (different handling)
   */
  classify(debugInput) {
    const result = {
      type: 'unknown',
      severity: 'minor',
      scope: 'isolated',
      confidence: 0,
      evidence: [],
      incompleteness: null  // FR2.1: For incomplete implementations
    };

    // FR2.1: Check for incomplete implementation FIRST
    // This is NOT a bug, it's missing features - different handling required
    const incompleteness = this.detectIncompleteness(debugInput);
    if (incompleteness) {
      result.type = 'incomplete-implementation';
      result.incompleteness = incompleteness;
      result.severity = this.classifySeverity(result.type, debugInput);
      result.scope = this.classifyScope(debugInput, incompleteness);
      result.confidence = 0.95;  // High confidence if verifier detected it
      result.evidence = incompleteness.evidence;
      return result;
    }

    // Check other issue types
    const scores = {};
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (type === 'incomplete-implementation') continue;  // Already checked
      
      scores[type] = this.scoreType(type, pattern, debugInput);
    }

    // Select type with highest score
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) => {
      return score > best.score ? { type, score } : best;
    }, { type: 'unknown', score: 0 });

    if (bestMatch.score > 0.1) {  // Lower threshold to catch more issues
      result.type = bestMatch.type;
      result.confidence = bestMatch.score;
      result.severity = this.classifySeverity(result.type, debugInput);
      result.scope = this.classifyScope(debugInput);
      result.evidence = this.extractEvidence(result.type, debugInput);
    }

    return result;
  }

  /**
   * FR2.1: Detect incomplete implementations
   * Returns null if not incomplete, object with details if incomplete
   */
  detectIncompleteness(input) {
    const evidence = [];
    
    // Check for task completion percentage
    const taskMatch = input.match(/Tasks:\s*(\d+)\/(\d+)\s+complete/i);
    if (taskMatch) {
      const [_, completed, total] = taskMatch;
      const completedNum = parseInt(completed);
      const totalNum = parseInt(total);
      
      if (completedNum < totalNum) {
        const percentage = Math.floor((completedNum / totalNum) * 100);  // Use floor for consistency
        evidence.push(`Only ${completedNum}/${totalNum} tasks complete (${percentage}%)`);
        
        // Extract missing tasks
        const missing = this.extractMissingTasks(input);
        const completedTasks = this.extractCompletedTasks(input);
        
        return {
          completeness: percentage,
          completed: completedNum,
          total: totalNum,
          missing: missing,
          completedTasks: completedTasks,
          evidence: evidence
        };
      }
    }

    // Check for "NOT FOUND" or "MISSING" markers (but not in error messages)
    // Look for file/task markers, not generic "missing" in error descriptions
    const notFoundMatches = input.match(/^[\s-]*(.+?)\s+(NOT FOUND|MISSING)$/gmi);
    if (notFoundMatches && notFoundMatches.length > 0) {
      evidence.push(...notFoundMatches);
      
      return {
        completeness: 0,  // Unknown percentage
        completed: null,
        total: null,
        missing: notFoundMatches.map(m => m.replace(/\s+(NOT FOUND|MISSING)$/i, '').trim().replace(/^[-\s]+/, '')),
        completedTasks: [],
        evidence: evidence
      };
    }
    
    // Check for "does not exist" patterns
    const doesNotExistMatches = input.match(/(.+?)\s+does not exist/gi);
    if (doesNotExistMatches && doesNotExistMatches.length > 0) {
      evidence.push(...doesNotExistMatches);
      
      return {
        completeness: 0,
        completed: null,
        total: null,
        missing: doesNotExistMatches.map(m => m.replace(/\s+does not exist/i, '')),
        completedTasks: [],
        evidence: evidence
      };
    }

    // Check for verifier-reported incompleteness
    if (input.includes('VERIFICATION FAILED') && input.includes('complete')) {
      const percentMatch = input.match(/(\d+)%\s+complete/i);
      if (percentMatch && parseInt(percentMatch[1]) < 100) {
        evidence.push(`Verification shows ${percentMatch[1]}% complete`);
        
        return {
          completeness: parseInt(percentMatch[1]),
          completed: null,
          total: null,
          missing: this.extractMissingTasks(input),
          completedTasks: [],
          evidence: evidence
        };
      }
    }

    // Check if there's a Missing: section with items (even without task count)
    const missing = this.extractMissingTasks(input);
    const completedTasks = this.extractCompletedTasks(input);
    
    if (missing.length > 0 || (completedTasks.length > 0 && input.match(/Missing:/i))) {
      evidence.push(`Found ${missing.length} missing items`);
      
      return {
        completeness: null,
        completed: null,
        total: null,
        missing: missing,
        completedTasks: completedTasks,
        evidence: evidence
      };
    }

    return null;
  }

  /**
   * Extract missing tasks from input
   */
  extractMissingTasks(input) {
    const missing = [];
    
    // Look for "Missing:" section
    const missingSection = input.match(/Missing:?\s*\n([\s\S]+?)(?=\n\n|Completed:|Evidence:|$)/i);
    if (missingSection) {
      const lines = missingSection[1].split('\n');
      lines.forEach(line => {
        line = line.trim();
        if (line && line.startsWith('-')) {
          missing.push(line.substring(1).trim());
        }
      });
    }

    // Look for "NOT FOUND" items
    const notFoundItems = input.match(/(.+?)\s+NOT FOUND/gi);
    if (notFoundItems) {
      notFoundItems.forEach(item => {
        const cleaned = item.replace(/\s+NOT FOUND/i, '').trim();
        if (!missing.includes(cleaned)) {
          missing.push(cleaned);
        }
      });
    }

    return missing;
  }

  /**
   * Extract completed tasks from input
   */
  extractCompletedTasks(input) {
    const completed = [];
    
    // Look for "Completed:" section
    const completedSection = input.match(/Completed:?\s*\n([\s\S]+?)(?=\n\n|Missing:|Evidence:|$)/i);
    if (completedSection) {
      const lines = completedSection[1].split('\n');
      lines.forEach(line => {
        line = line.trim();
        if (line && (line.startsWith('-') || line.startsWith('✓') || line.startsWith('✅'))) {
          completed.push(line.replace(/^[-✓✅]\s*/, '').trim());
        }
      });
    }

    return completed;
  }

  /**
   * Score a specific issue type against input
   */
  scoreType(type, pattern, input) {
    let score = 0;
    const inputLower = input.toLowerCase();

    // Keyword matching
    let keywordMatches = 0;
    pattern.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'i');
      if (regex.test(input)) {
        keywordMatches++;
      }
    });

    if (keywordMatches > 0) {
      // Give higher weight if multiple keywords match
      const keywordRatio = keywordMatches / pattern.keywords.length;
      score += 0.4 * keywordRatio;
      
      // Bonus for multiple matches (strong signal)
      if (keywordMatches >= 3) {
        score += 0.3;
      } else if (keywordMatches >= 2) {
        score += 0.2;
      }
    }

    // Indicator matching
    let indicatorMatches = 0;
    pattern.indicators.forEach(indicator => {
      const regex = new RegExp(indicator, 'i');
      if (regex.test(input)) {
        indicatorMatches++;
      }
    });

    if (indicatorMatches > 0) {
      score += 0.6 * (indicatorMatches / pattern.indicators.length);
    }

    return Math.min(score, 1.0);
  }

  /**
   * Classify severity based on type and input
   */
  classifySeverity(type, input) {
    const pattern = this.patterns[type];
    if (!pattern || !pattern.severity) return 'minor';

    const inputLower = input.toLowerCase();

    // Check critical markers
    for (const marker of pattern.severity.critical) {
      if (inputLower.includes(marker.toLowerCase())) {
        return 'critical';
      }
    }

    // Check major markers
    for (const marker of pattern.severity.major) {
      if (inputLower.includes(marker.toLowerCase())) {
        return 'major';
      }
    }

    return 'minor';
  }

  /**
   * Classify scope of issue
   * FR2.1: For incomplete implementations, scope based on how many tasks missing
   */
  classifyScope(input, incompleteness = null) {
    // FR2.1: Incomplete implementation scope
    if (incompleteness) {
      if (incompleteness.completeness === 0) return 'widespread';
      if (incompleteness.completeness < 50) return 'localized';
      return 'isolated';  // > 50% complete, just a few missing
    }

    // File count analysis
    const fileMatches = input.match(/[a-zA-Z0-9_-]+\.(js|ts|jsx|tsx|py|java|go)/gi);
    if (fileMatches) {
      const uniqueFiles = new Set(fileMatches);
      if (uniqueFiles.size > 5) return 'widespread';
      if (uniqueFiles.size > 2) return 'localized';
    }

    // Error count analysis
    const errorMatches = input.match(/error|fail|✗/gi);
    if (errorMatches) {
      if (errorMatches.length > 10) return 'widespread';
      if (errorMatches.length > 3) return 'localized';
    }

    return 'isolated';
  }

  /**
   * Extract evidence for classification
   */
  extractEvidence(type, input) {
    const evidence = [];
    const pattern = this.patterns[type];

    // Extract matching keywords
    pattern.keywords.forEach(keyword => {
      const regex = new RegExp(`(.{0,50}${keyword}.{0,50})`, 'gi');
      const matches = input.match(regex);
      if (matches) {
        matches.slice(0, 3).forEach(match => {
          evidence.push(match.trim());
        });
      }
    });

    return evidence.slice(0, 5);  // Limit to 5 pieces of evidence
  }
}

// Export class and singleton instance
module.exports = {
  IssueClassifier,
  issueClassifier: new IssueClassifier()
};
