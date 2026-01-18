import fs from 'fs';
import path from 'path';

/**
 * Pattern Matcher - Recognizes common issue patterns
 * FR2.1: Tracks incomplete implementation patterns for learning
 */
export class PatternMatcher {
  constructor() {
    this.patternsDir = 'patterns/debug';
    this.patterns = this.loadPatterns();
  }

  /**
   * Load all pattern files from knowledge base
   */
  loadPatterns() {
    const patterns = [];

    if (!fs.existsSync(this.patternsDir)) {
      fs.mkdirSync(this.patternsDir, { recursive: true });
      this.initializeDefaultPatterns();
    }

    const files = fs.readdirSync(this.patternsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.patternsDir, file), 'utf-8');
        patterns.push(JSON.parse(content));
      } catch (error) {
        console.warn(`Could not load pattern: ${file}`);
      }
    }

    return patterns;
  }

  /**
   * Initialize default patterns including FR2.1 incomplete implementation
   */
  initializeDefaultPatterns() {
    const defaultPatterns = [
      // FR2.1: Incomplete Implementation Patterns
      {
        id: 'incomplete-executor-skip',
        name: 'Incomplete Implementation - Executor Skip',
        type: 'incomplete-implementation',
        cause: 'executor-skip',
        signatures: [
          'no git commits for feature',
          'task complexity high',
          'adjacent tasks completed'
        ],
        frequency: 0.70,
        solutions: ['Targeted Re-execution'],
        prevention: [
          'Break tasks into smaller sub-tasks',
          'Add task-level verification checkpoints',
          'Assess complexity before wave assignment'
        ]
      },
      {
        id: 'incomplete-plan-ambiguity',
        name: 'Incomplete Implementation - Plan Ambiguity',
        type: 'incomplete-implementation',
        cause: 'plan-ambiguity',
        signatures: [
          'task description brief',
          'no specific file paths',
          'vague acceptance criteria'
        ],
        frequency: 0.20,
        solutions: ['Targeted Re-execution', 'Clarify task description'],
        prevention: [
          'Add explicit file paths in <files>',
          'Provide step-by-step instructions',
          'Make <done> criteria measurable'
        ]
      },
      {
        id: 'incomplete-dependency-blocker',
        name: 'Incomplete Implementation - Dependency Blocker',
        type: 'incomplete-implementation',
        cause: 'dependency-blocker',
        signatures: [
          'MODULE_NOT_FOUND',
          'network timeout',
          'environment variable undefined'
        ],
        frequency: 0.10,
        solutions: ['Install dependencies', 'Fix environment', 'Targeted Re-execution'],
        prevention: [
          'Pre-execution dependency checks',
          'Environment validation',
          'Provide dependency installation steps'
        ]
      },

      // Standard bug patterns
      {
        id: 'test-assertion-failure',
        name: 'Test Assertion Failure',
        type: 'test-failure',
        signatures: [
          'expected.*but got',
          'assertion failed',
          'test.*fail'
        ],
        frequency: 0.30,
        solutions: ['Fix implementation logic', 'Update test expectations'],
        prevention: ['TDD approach', 'Better test coverage']
      },
      {
        id: 'eslint-violations',
        name: 'ESLint Violations',
        type: 'quality-issue',
        signatures: [
          'eslint',
          'no-undef',
          'missing semicolon'
        ],
        frequency: 0.15,
        solutions: ['Run eslint --fix', 'Manual corrections'],
        prevention: ['Pre-commit hooks', 'IDE linting']
      }
    ];

    defaultPatterns.forEach(pattern => {
      const filename = `${pattern.id}.json`;
      fs.writeFileSync(
        path.join(this.patternsDir, filename),
        JSON.stringify(pattern, null, 2)
      );
    });
  }

  /**
   * Find matching patterns for current issue
   */
  findMatches(analysis) {
    const matches = [];

    for (const pattern of this.patterns) {
      const score = this.scoreMatch(pattern, analysis);
      
      if (score > 0.3) {
        matches.push({
          pattern: pattern,
          score: score,
          confidence: this.calculateConfidence(score, pattern)
        });
      }
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Score how well a pattern matches the analysis
   */
  scoreMatch(pattern, analysis) {
    let score = 0;

    // Type match (most important)
    if (pattern.type === analysis.classification.type) {
      score += 0.4;

      // FR2.1: For incomplete implementations, check cause match
      if (pattern.type === 'incomplete-implementation' && 
          analysis.rootCause && 
          pattern.cause === analysis.rootCause.likelyCause) {
        score += 0.3;
      }
    }

    // Signature matching
    const evidence = this.extractEvidence(analysis);
    let signatureMatches = 0;

    for (const signature of pattern.signatures) {
      if (evidence.some(e => e.toLowerCase().includes(signature.toLowerCase()))) {
        signatureMatches++;
      }
    }

    if (signatureMatches > 0) {
      score += 0.3 * (signatureMatches / pattern.signatures.length);
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract evidence from analysis
   */
  extractEvidence(analysis) {
    const evidence = [];

    if (analysis.classification.evidence) {
      evidence.push(...analysis.classification.evidence);
    }

    if (analysis.rootCause && analysis.rootCause.evidence) {
      evidence.push(...analysis.rootCause.evidence);
    }

    if (analysis.symptoms) {
      evidence.push(...analysis.symptoms.what);
    }

    return evidence;
  }

  /**
   * Calculate confidence based on match score and pattern frequency
   */
  calculateConfidence(score, pattern) {
    // Weight by pattern frequency (how common it is)
    const frequencyWeight = pattern.frequency || 0.5;
    return score * 0.7 + frequencyWeight * 0.3;
  }

  /**
   * FR2.1: Record incomplete implementation pattern for learning
   */
  recordIncompletePattern(analysis, resolution) {
    if (analysis.classification.type !== 'incomplete-implementation') {
      return;
    }

    const patternId = `incomplete-${Date.now()}`;
    const pattern = {
      id: patternId,
      name: `Incomplete Implementation - ${analysis.rootCause.likelyCause}`,
      type: 'incomplete-implementation',
      cause: analysis.rootCause.likelyCause,
      signatures: analysis.rootCause.evidence.slice(0, 5),
      frequency: analysis.rootCause.confidence,
      solutions: [analysis.recommendation.name],
      prevention: this.extractPrevention(analysis),
      recorded: new Date().toISOString(),
      resolution: resolution
    };

    const filename = `${patternId}.json`;
    fs.writeFileSync(
      path.join(this.patternsDir, filename),
      JSON.stringify(pattern, null, 2)
    );

    console.log(`✓ Recorded new incomplete implementation pattern: ${patternId}`);
  }

  /**
   * Extract prevention strategies from analysis
   */
  extractPrevention(analysis) {
    const prevention = [];

    if (analysis.rootCause.likelyCause === 'executor-skip') {
      prevention.push('Break complex tasks into smaller units');
      prevention.push('Add task-level verification');
    } else if (analysis.rootCause.likelyCause === 'plan-ambiguity') {
      prevention.push('Add specific file paths');
      prevention.push('Provide detailed step-by-step instructions');
    } else if (analysis.rootCause.likelyCause === 'dependency-blocker') {
      prevention.push('Pre-execution dependency validation');
      prevention.push('Environment checks before starting');
    }

    return prevention;
  }

  /**
   * Get prevention strategies from matched patterns
   */
  getPreventionStrategies(matches) {
    const strategies = new Set();

    matches.forEach(match => {
      if (match.pattern.prevention) {
        match.pattern.prevention.forEach(s => strategies.add(s));
      }
    });

    return Array.from(strategies);
  }

  /**
   * Get recommended solutions from matched patterns
   */
  getRecommendedSolutions(matches) {
    const solutions = new Map();

    matches.forEach(match => {
      if (match.pattern.solutions) {
        match.pattern.solutions.forEach(solution => {
          const count = solutions.get(solution) || 0;
          solutions.set(solution, count + match.score);
        });
      }
    });

    // Sort by weighted score
    return Array.from(solutions.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([solution, score]) => ({ solution, score }));
  }

  /**
   * Generate pattern summary for report
   */
  generatePatternSummary(matches) {
    if (matches.length === 0) {
      return 'No matching patterns found - this appears to be a novel issue.';
    }

    const topMatch = matches[0];
    let summary = `Matches pattern: **${topMatch.pattern.name}** (${(topMatch.score * 100).toFixed(0)}% confidence)\n\n`;

    if (topMatch.pattern.type === 'incomplete-implementation') {
      summary += `**Cause:** ${topMatch.pattern.cause}\n`;
      summary += `**Frequency:** ${(topMatch.pattern.frequency * 100).toFixed(0)}% of incomplete implementations\n\n`;
    }

    if (matches.length > 1) {
      summary += `\nOther potential matches:\n`;
      matches.slice(1, 3).forEach(match => {
        summary += `- ${match.pattern.name} (${(match.score * 100).toFixed(0)}%)\n`;
      });
    }

    return summary;
  }
}

export const patternMatcher = new PatternMatcher();
