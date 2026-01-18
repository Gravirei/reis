# Plan: 2-2 - Issue Classification Module

## Objective
Implement IssueClassifier module that categorizes issues into 7 types including incomplete implementations (FR2.1).

## Context
Issue classification is Step 1 of the 6-step analysis protocol. It must:
- Categorize into 7 types: test-failure, quality-issue, docs-problem, regression, integration, dependency, **incomplete-implementation**
- Determine severity (critical/major/minor)
- Assess scope (isolated/localized/widespread)
- **FR2.1:** Distinguish missing features from bugs

## Dependencies
- Plan 2-1 (debug command exists)

## Tasks

<task type="auto">
<name>Implement IssueClassifier with incomplete implementation detection</name>
<files>lib/utils/issue-classifier.js</files>
<action>
Create comprehensive issue classifier:

```javascript
import fs from 'fs';
import path from 'path';

/**
 * Issue Classifier - Categorizes debug issues into types
 * Implements FR2.1: Distinguishes incomplete implementations from bugs
 */
export class IssueClassifier {
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
          'FAIL',
          'test suite',
          'jest',
          'mocha',
          'Error:.*test'
        ],
        indicators: [
          'exit code 1',
          'tests: [0-9]+ failed',
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

    if (bestMatch.score > 0.3) {
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
        const percentage = Math.round((completedNum / totalNum) * 100);
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

    // Check for "NOT FOUND" or "MISSING" markers
    const notFoundMatches = input.match(/(.+?)\s+(NOT FOUND|MISSING|does not exist)/gi);
    if (notFoundMatches && notFoundMatches.length > 0) {
      evidence.push(...notFoundMatches);
      
      return {
        completeness: 0,  // Unknown percentage
        completed: null,
        total: null,
        missing: notFoundMatches.map(m => m.replace(/\s+(NOT FOUND|MISSING|does not exist)/i, '')),
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
      score += 0.4 * (keywordMatches / pattern.keywords.length);
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

// Export singleton instance
export const issueClassifier = new IssueClassifier();
```

**What to avoid:**
- Checking for bugs before incomplete implementations (order matters!)
- Treating missing features as bugs (different root causes)
- Missing completeness percentage extraction
- Not extracting what's missing vs what's completed

**Why:**
- Incomplete implementations need different analysis than bugs
- Order matters: check incomplete FIRST (most common after verifier)
- Completeness data drives targeted fix planning
- Distinguishing completed from missing prevents redundant work
</action>
<verify>
```bash
# Check file exists
test -f lib/utils/issue-classifier.js && echo "✓ issue-classifier.js created"

# Verify FR2.1 incomplete implementation detection
grep -q "incomplete-implementation" lib/utils/issue-classifier.js && echo "✓ Incomplete implementation type included"

# Check detectIncompleteness method exists
grep -q "detectIncompleteness" lib/utils/issue-classifier.js && echo "✓ FR2.1 detection method exists"

# Verify checks incomplete FIRST
grep -A 5 "classify(" lib/utils/issue-classifier.js | grep -q "detectIncompleteness" && echo "✓ Checks incomplete implementations first"

# Test syntax
node -c lib/utils/issue-classifier.js && echo "✓ Syntax valid"
```
</verify>
<done>
- lib/utils/issue-classifier.js created with complete implementation
- FR2.1 incomplete implementation detection implemented
- Checks for incomplete implementations FIRST (before bugs)
- Extracts completeness percentage, missing tasks, completed tasks
- 7 issue types supported with pattern matching
- Severity and scope classification
- Evidence extraction for all types
</done>
</task>

<task type="auto">
<name>Add issue classifier tests</name>
<files>tests/utils/issue-classifier.test.js</files>
<action>
Create comprehensive tests for IssueClassifier:

```javascript
import { describe, it, expect } from '@jest/globals';
import { IssueClassifier } from '../../lib/utils/issue-classifier.js';

describe('IssueClassifier', () => {
  const classifier = new IssueClassifier();

  describe('FR2.1: Incomplete Implementation Detection', () => {
    it('should detect incomplete implementation from task completion', () => {
      const input = `
VERIFICATION FAILED

Tasks: 2/3 complete (66%)

Completed:
- Task 1: User Login ✓
- Task 3: Session Management ✓

Missing:
- Task 2: Password Reset

Evidence:
- password-reset.js NOT FOUND
- POST /api/auth/reset route missing
      `;

      const result = classifier.classify(input);

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteness.completeness).toBe(66);
      expect(result.incompleteness.completed).toBe(2);
      expect(result.incompleteness.total).toBe(3);
      expect(result.incompleteness.missing).toContain('Task 2: Password Reset');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should detect incomplete from NOT FOUND markers', () => {
      const input = `
VERIFICATION FAILED

Evidence:
- src/api/auth/reset.ts NOT FOUND
- tests/auth/reset.test.js NOT FOUND
      `;

      const result = classifier.classify(input);

      expect(result.type).toBe('incomplete-implementation');
      expect(result.incompleteness.missing.length).toBeGreaterThan(0);
    });

    it('should distinguish incomplete from test failures', () => {
      const incompleteteInput = `Tasks: 2/3 complete`;
      const testFailureInput = `Test failed: expected true but got false`;

      const incomplete = classifier.classify(incompleteteInput);
      const testFail = classifier.classify(testFailureInput);

      expect(incomplete.type).toBe('incomplete-implementation');
      expect(testFail.type).toBe('test-failure');
    });

    it('should extract completed tasks', () => {
      const input = `
Completed:
- Task 1: Login endpoint ✓
- Task 3: Session management ✅

Missing:
- Task 2: Password reset
      `;

      const result = classifier.classify(input);

      expect(result.incompleteness.completedTasks).toContain('Task 1: Login endpoint');
      expect(result.incompleteness.completedTasks).toContain('Task 3: Session management');
    });
  });

  describe('Test Failure Classification', () => {
    it('should detect test failures', () => {
      const input = `
npm test

FAIL tests/auth/login.test.js
  ✓ should accept valid credentials
  ✗ should reject invalid credentials
    Expected: 401
    Received: 500

Tests: 1 failed, 1 passed, 2 total
      `;

      const result = classifier.classify(input);

      expect(result.type).toBe('test-failure');
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Quality Issue Classification', () => {
    it('should detect ESLint errors', () => {
      const input = `
ESLint errors:
  src/api/auth.js
    10:5  error  'password' is not defined  no-undef
    15:3  error  Missing semicolon  semi
      `;

      const result = classifier.classify(input);

      expect(result.type).toBe('quality-issue');
    });
  });

  describe('Severity Classification', () => {
    it('should classify incomplete as critical if core features missing', () => {
      const input = `Tasks: 0/3 complete - core features missing`;
      const result = classifier.classify(input);

      expect(result.severity).toBe('critical');
    });

    it('should classify incomplete as major if some features missing', () => {
      const input = `Tasks: 1/3 complete - features missing`;
      const result = classifier.classify(input);

      expect(result.severity).toBe('major');
    });

    it('should classify incomplete as minor if mostly complete', () => {
      const input = `Tasks: 4/5 complete`;
      const result = classifier.classify(input);

      expect(result.severity).toBe('minor');
    });
  });

  describe('Scope Classification', () => {
    it('should classify incomplete scope based on completeness', () => {
      const widespread = `Tasks: 0/5 complete`;
      const localized = `Tasks: 2/5 complete`;
      const isolated = `Tasks: 4/5 complete`;

      expect(classifier.classify(widespread).scope).toBe('widespread');
      expect(classifier.classify(localized).scope).toBe('localized');
      expect(classifier.classify(isolated).scope).toBe('isolated');
    });
  });
});
```

**What to avoid:**
- Missing incomplete implementation test cases
- Not testing the distinction between bugs and missing features
- Skipping completeness percentage tests
- Missing edge cases

**Why:**
- FR2.1 is critical - must be thoroughly tested
- Distinction between bugs/incomplete drives different handling
- Test coverage ensures reliability
</action>
<verify>
```bash
# Check test file exists
test -f tests/utils/issue-classifier.test.js && echo "✓ Tests created"

# Verify FR2.1 test cases exist
grep -c "Incomplete Implementation" tests/utils/issue-classifier.test.js
# Should find 1+ occurrences

# Count test cases
grep -c "it('should" tests/utils/issue-classifier.test.js
# Should find 10+ test cases

# Run tests
npm test -- issue-classifier.test.js
```
</verify>
<done>
- tests/utils/issue-classifier.test.js created
- FR2.1 incomplete implementation tests included
- Tests verify distinction between bugs and missing features
- Completeness percentage extraction tested
- Severity and scope classification tested
- Edge cases covered
</done>
</task>

## Success Criteria
- ✅ IssueClassifier module implemented
- ✅ FR2.1 incomplete implementation detection works
- ✅ Distinguishes 7 issue types correctly
- ✅ Checks incomplete implementations FIRST
- ✅ Extracts completeness, missing, and completed tasks
- ✅ Comprehensive test coverage

## Verification
```bash
# Module exists
test -f lib/utils/issue-classifier.js && echo "✓ IssueClassifier implemented"

# Has FR2.1 support
grep -c "incomplete-implementation" lib/utils/issue-classifier.js
# Should find 10+ occurrences

# Tests exist and pass
npm test -- issue-classifier.test.js

# Can be imported
node -e "import('./lib/utils/issue-classifier.js').then(() => console.log('✓ Module loads'))"
```
