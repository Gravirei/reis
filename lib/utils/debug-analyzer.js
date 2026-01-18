const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { issueClassifier } = require('./issue-classifier.js');

/**
 * Debug Analyzer - Implements 6-step analysis protocol
 * FR2.1: Special handling for incomplete implementations
 */
class DebugAnalyzer {
  constructor(debugInput, projectContext) {
    this.input = debugInput;
    this.context = projectContext;
    this.analysis = {};
  }

  /**
   * Run complete 6-step analysis
   */
  async analyze() {
    console.log('Running 6-step analysis protocol...\n');

    // Step 1: Issue Classification
    console.log('Step 1: Issue Classification');
    this.analysis.classification = await this.classifyIssue();

    // Step 2: Symptom Analysis
    console.log('Step 2: Symptom Analysis');
    this.analysis.symptoms = await this.analyzeSymptoms();

    // Step 3: Root Cause Investigation
    console.log('Step 3: Root Cause Investigation');
    if (this.analysis.classification.type === 'incomplete-implementation') {
      // FR2.1: Special root cause analysis for missing features
      this.analysis.rootCause = await this.analyzeIncompleteImplementation();
    } else {
      // Standard root cause for bugs
      this.analysis.rootCause = await this.investigateRootCause();
    }

    // Step 4: Impact Assessment
    console.log('Step 4: Impact Assessment');
    this.analysis.impact = await this.assessImpact();

    // Step 5: Solution Design
    console.log('Step 5: Solution Design');
    if (this.analysis.classification.type === 'incomplete-implementation') {
      // FR2.1: Targeted re-execution solutions
      this.analysis.solutions = await this.designIncompleteImplementationSolutions();
    } else {
      // Standard bug fix solutions
      this.analysis.solutions = await this.designSolutions();
    }

    // Step 6: Solution Recommendation
    console.log('Step 6: Solution Recommendation');
    this.analysis.recommendation = this.selectRecommendedSolution();

    return this.analysis;
  }

  /**
   * Step 1: Issue Classification
   */
  async classifyIssue() {
    const classification = issueClassifier.classify(this.input);
    
    return {
      type: classification.type,
      severity: classification.severity,
      scope: classification.scope,
      confidence: classification.confidence,
      evidence: classification.evidence,
      incompleteness: classification.incompleteness  // FR2.1
    };
  }

  /**
   * Step 2: Symptom Analysis
   */
  async analyzeSymptoms() {
    const symptoms = {
      what: [],
      where: [],
      when: [],
      how: []
    };

    // Extract what failed
    symptoms.what = this.extractFailures();

    // For incomplete implementations, what = missing deliverables
    if (this.analysis.classification.type === 'incomplete-implementation') {
      const incompleteness = this.analysis.classification.incompleteness;
      symptoms.what = incompleteness.missing.map(item => `Missing: ${item}`);
    }

    // Extract where (file locations)
    symptoms.where = this.extractLocations();

    // Extract when (conditions)
    symptoms.when = this.extractConditions();

    // Extract how (manifestation)
    symptoms.how = this.extractManifestation();

    return symptoms;
  }

  /**
   * Step 3: Root Cause Investigation (Standard)
   */
  async investigateRootCause() {
    const rootCause = {
      primaryCause: '',
      evidence: [],
      contributingFactors: [],
      timeline: null
    };

    // Git history analysis
    try {
      const gitLog = execSync('git log --oneline -20', { encoding: 'utf-8' });
      rootCause.timeline = this.analyzeGitHistory(gitLog);
    } catch (error) {
      console.log('  ⚠️  Could not analyze git history');
    }

    // Analyze based on issue type
    switch (this.analysis.classification.type) {
      case 'test-failure':
        rootCause.primaryCause = this.analyzeTestFailure();
        break;
      case 'quality-issue':
        rootCause.primaryCause = this.analyzeQualityIssue();
        break;
      case 'regression':
        rootCause.primaryCause = this.analyzeRegression();
        break;
      default:
        rootCause.primaryCause = 'Unknown - requires manual investigation';
    }

    return rootCause;
  }

  /**
   * FR2.1: Root Cause Analysis for Incomplete Implementations
   * Analyze WHY features were skipped using likelihood estimation
   */
  async analyzeIncompleteImplementation() {
    const rootCause = {
      likelyCause: '',
      confidence: 0,
      evidence: [],
      contributingFactors: [],
      likelihood: {
        executorSkip: 0,
        planAmbiguity: 0,
        dependencyBlocker: 0
      }
    };

    const incompleteness = this.analysis.classification.incompleteness;

    // Analyze Executor Skip (70% base likelihood)
    const executorSkipAnalysis = await this.analyzeExecutorSkip(incompleteness);
    rootCause.likelihood.executorSkip = executorSkipAnalysis.score;
    rootCause.evidence.push(...executorSkipAnalysis.evidence);

    // Analyze Plan Ambiguity (20% base likelihood)
    const planAmbiguityAnalysis = await this.analyzePlanAmbiguity(incompleteness);
    rootCause.likelihood.planAmbiguity = planAmbiguityAnalysis.score;
    rootCause.evidence.push(...planAmbiguityAnalysis.evidence);

    // Analyze Dependency Blocker (10% base likelihood)
    const dependencyBlockerAnalysis = await this.analyzeDependencyBlocker(incompleteness);
    rootCause.likelihood.dependencyBlocker = dependencyBlockerAnalysis.score;
    rootCause.evidence.push(...dependencyBlockerAnalysis.evidence);

    // Normalize likelihoods to sum to 1.0
    const total = rootCause.likelihood.executorSkip + 
                  rootCause.likelihood.planAmbiguity + 
                  rootCause.likelihood.dependencyBlocker;
    
    rootCause.likelihood.executorSkip /= total;
    rootCause.likelihood.planAmbiguity /= total;
    rootCause.likelihood.dependencyBlocker /= total;

    // Select most likely cause
    if (rootCause.likelihood.executorSkip >= rootCause.likelihood.planAmbiguity &&
        rootCause.likelihood.executorSkip >= rootCause.likelihood.dependencyBlocker) {
      rootCause.likelyCause = 'executor-skip';
      rootCause.confidence = rootCause.likelihood.executorSkip;
      rootCause.contributingFactors.push(...executorSkipAnalysis.factors);
    } else if (rootCause.likelihood.planAmbiguity >= rootCause.likelihood.dependencyBlocker) {
      rootCause.likelyCause = 'plan-ambiguity';
      rootCause.confidence = rootCause.likelihood.planAmbiguity;
      rootCause.contributingFactors.push(...planAmbiguityAnalysis.factors);
    } else {
      rootCause.likelyCause = 'dependency-blocker';
      rootCause.confidence = rootCause.likelihood.dependencyBlocker;
      rootCause.contributingFactors.push(...dependencyBlockerAnalysis.factors);
    }

    return rootCause;
  }

  /**
   * FR2.1: Analyze Executor Skip likelihood (70% base)
   */
  async analyzeExecutorSkip(incompleteness) {
    let score = 0.70;  // Base likelihood
    const evidence = [];
    const factors = [];

    // Check git log for missing commits
    try {
      const gitLog = execSync('git log --oneline -50', { encoding: 'utf-8' });
      
      // Check if missing features have any commits
      const missingFeatures = incompleteness.missing || [];
      for (const feature of missingFeatures) {
        const featureName = feature.toLowerCase().replace(/task \d+:?\s*/i, '');
        
        if (!gitLog.toLowerCase().includes(featureName)) {
          score += 0.10;
          evidence.push(`No git commits found for "${featureName}"`);
          factors.push('No implementation attempt detected');
        }
      }
    } catch (error) {
      console.log('  ⚠️  Could not check git history');
    }

    // Assess task complexity
    const complexity = this.assessTaskComplexity(incompleteness);
    if (complexity === 'high') {
      score += 0.10;
      evidence.push('Missing task has high complexity');
      factors.push('Task complexity may have deterred implementation');
    } else if (complexity === 'moderate') {
      score += 0.05;
      factors.push('Task complexity moderate');
    }

    // Check if adjacent tasks completed
    if (incompleteness.completedTasks && incompleteness.completedTasks.length > 0) {
      score += 0.05;
      evidence.push(`Adjacent tasks completed successfully (${incompleteness.completedTasks.length} tasks)`);
      factors.push('Executor was functioning, likely skipped specific task');
    }

    // Context refresh detection (harder to detect, add modest boost)
    if (incompleteness.completed && incompleteness.total) {
      const position = incompleteness.completed / incompleteness.total;
      if (position > 0.3 && position < 0.7) {
        // Middle tasks more likely to be affected by context refresh
        score += 0.03;
        factors.push('Task position suggests possible context refresh');
      }
    }

    return {
      score: Math.min(score, 0.95),  // Cap at 95%
      evidence,
      factors
    };
  }

  /**
   * FR2.1: Analyze Plan Ambiguity likelihood (20% base)
   */
  async analyzePlanAmbiguity(incompleteness) {
    let score = 0.20;  // Base likelihood
    const evidence = [];
    const factors = [];

    // Try to read original plan
    const planPath = this.findOriginalPlan();
    if (!planPath) {
      factors.push('Could not locate original plan for analysis');
      return { score, evidence, factors };
    }

    try {
      const planContent = fs.readFileSync(planPath, 'utf-8');
      
      // Check for missing task in plan
      const missingTasks = incompleteness.missing || [];
      for (const task of missingTasks) {
        const taskMatch = planContent.match(new RegExp(`<name>(.*)${task.substring(0, 20)}`, 'i'));
        
        if (taskMatch) {
          // Found task, analyze its clarity
          const taskSection = this.extractTaskSection(planContent, taskMatch.index);
          
          // Check for specific file paths
          if (!taskSection.includes('<files>') || taskSection.match(/<files>\s*<\/files>/)) {
            score += 0.15;
            evidence.push('Task missing specific file paths');
            factors.push('No explicit file paths provided');
          }

          // Check for vague action description
          const actionMatch = taskSection.match(/<action>([\s\S]+?)<\/action>/);
          if (actionMatch) {
            const action = actionMatch[1];
            if (action.length < 200) {
              score += 0.10;
              evidence.push('Task action description brief (<200 chars)');
              factors.push('Implementation details lacking');
            }

            // Check for vague terms
            const vagueTerms = ['implement', 'add', 'create', 'build', 'make'];
            const vagueCount = vagueTerms.filter(term => 
              action.toLowerCase().includes(term)
            ).length;
            
            if (vagueCount > 2 && action.split('\n').length < 5) {
              score += 0.10;
              evidence.push('Task uses vague terms without specifics');
              factors.push('Action description lacks concrete steps');
            }
          }

          // Check for vague acceptance criteria
          const doneMatch = taskSection.match(/<done>([\s\S]+?)<\/done>/);
          if (doneMatch && doneMatch[1].toLowerCase().includes('works')) {
            score += 0.10;
            evidence.push('Acceptance criteria vague ("works properly")');
            factors.push('Success criteria not measurable');
          }
        }
      }
    } catch (error) {
      console.log('  ⚠️  Could not analyze plan content');
    }

    return {
      score: Math.min(score, 0.90),  // Cap at 90%
      evidence,
      factors
    };
  }

  /**
   * FR2.1: Analyze Dependency Blocker likelihood (10% base)
   */
  async analyzeDependencyBlocker(incompleteness) {
    let score = 0.10;  // Base likelihood
    const evidence = [];
    const factors = [];

    // Check for error logs
    const logFiles = ['.planning/executor.log', 'error.log', 'npm-debug.log'];
    
    for (const logFile of logFiles) {
      if (fs.existsSync(logFile)) {
        try {
          const logContent = fs.readFileSync(logFile, 'utf-8');
          
          // Check for package errors
          if (logContent.includes('MODULE_NOT_FOUND') || logContent.includes('Cannot find module')) {
            score += 0.30;
            evidence.push('Module not found errors in logs');
            factors.push('Missing npm package prevented implementation');
          }

          // Check for network errors
          if (logContent.includes('ENOTFOUND') || logContent.includes('ETIMEDOUT')) {
            score += 0.25;
            evidence.push('Network errors in logs');
            factors.push('External API/service unreachable');
          }

          // Check for environment errors
          if (logContent.includes('env') && logContent.includes('undefined')) {
            score += 0.20;
            evidence.push('Environment variable issues in logs');
            factors.push('Missing environment configuration');
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    }

    // Check package.json for missing dependencies
    if (fs.existsSync('package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        // Check if feature name suggests external dependency
        const missingFeatures = incompleteness.missing || [];
        for (const feature of missingFeatures) {
          const featureLower = feature.toLowerCase();
          
          // Common external services
          const externalServices = ['stripe', 'sendgrid', 'twilio', 'aws', 's3', 'auth0'];
          const requiresExternal = externalServices.some(service => 
            featureLower.includes(service)
          );
          
          if (requiresExternal) {
            const hasPackage = Object.keys(allDeps).some(dep => 
              featureLower.includes(dep.toLowerCase())
            );
            
            if (!hasPackage) {
              score += 0.15;
              evidence.push(`Feature "${feature}" suggests external service, but no package found`);
              factors.push('Missing required SDK/package for external service');
            }
          }
        }
      } catch (error) {
        // Ignore parse errors
      }
    }

    return {
      score: Math.min(score, 0.85),  // Cap at 85%
      evidence,
      factors
    };
  }

  /**
   * Assess task complexity
   */
  assessTaskComplexity(incompleteness) {
    const missing = incompleteness.missing || [];
    
    // Simple heuristic based on task description
    for (const task of missing) {
      const taskLower = task.toLowerCase();
      
      // High complexity indicators
      if (taskLower.includes('integration') || 
          taskLower.includes('api') ||
          taskLower.includes('database') ||
          taskLower.includes('authentication')) {
        return 'high';
      }

      // Moderate complexity indicators
      if (taskLower.includes('endpoint') ||
          taskLower.includes('validation') ||
          taskLower.includes('service')) {
        return 'moderate';
      }
    }

    return 'simple';
  }

  /**
   * Step 4: Impact Assessment
   */
  async assessImpact() {
    const impact = {
      severity: this.analysis.classification.severity,
      blocksWork: false,
      breakingChange: false,
      affectedScope: [],
      dependenciesImpacted: [],
      urgency: 'medium'
    };

    // For incomplete implementations, assess based on what's missing
    if (this.analysis.classification.type === 'incomplete-implementation') {
      const incompleteness = this.analysis.classification.incompleteness;
      
      impact.blocksWork = incompleteness.completeness < 50;
      impact.urgency = incompleteness.completeness === 0 ? 'immediate' : 
                       incompleteness.completeness < 50 ? 'high' : 'medium';
      
      impact.affectedScope = incompleteness.missing || [];
    }

    return impact;
  }

  /**
   * Step 5: Solution Design (Standard)
   */
  async designSolutions() {
    const solutions = [];

    // Generate 3-5 solutions based on issue type
    switch (this.analysis.classification.type) {
      case 'test-failure':
        solutions.push(...this.generateTestFailureSolutions());
        break;
      case 'quality-issue':
        solutions.push(...this.generateQualitySolutions());
        break;
      default:
        solutions.push(this.generateGenericSolution());
    }

    return solutions;
  }

  /**
   * FR2.1: Solution Design for Incomplete Implementations
   */
  async designIncompleteImplementationSolutions() {
    const solutions = [];
    const incompleteness = this.analysis.classification.incompleteness;

    // Option 1: Targeted Re-execution (RECOMMENDED)
    solutions.push({
      name: 'Targeted Re-execution',
      description: 'Create fix plan implementing ONLY missing features',
      approach: 'Generate focused plan with missing tasks only, leave completed work untouched',
      pros: [
        'Fast - only implements what\'s missing',
        'Focused - no scope creep',
        'Low risk - no impact on completed features',
        'No redundant work'
      ],
      cons: [
        'Requires identifying exact missing deliverables'
      ],
      timeEstimate: this.estimateIncompleteFixTime(incompleteness),
      riskLevel: 'LOW',
      complexity: 'simple',
      recommended: true,
      scope: incompleteness.missing
    });

    // Option 2: Re-execute Entire Wave
    solutions.push({
      name: 'Re-execute Entire Wave',
      description: 'Re-run the original wave completely',
      approach: 'Execute original plan again from start',
      pros: [
        'Ensures wave completeness',
        'May catch missed edge cases'
      ],
      cons: [
        'Redundant re-implementation of completed features',
        'Wasted effort',
        'Risk of breaking working features',
        'Longer execution time'
      ],
      timeEstimate: 'Original wave duration',
      riskLevel: 'MEDIUM',
      complexity: 'moderate',
      recommended: false,
      useWhen: 'Multiple features missing or state unclear'
    });

    // Option 3: Manual Implementation
    solutions.push({
      name: 'Manual Implementation',
      description: 'Human developer implements missing features',
      approach: 'Developer manually codes missing deliverables',
      pros: [
        'Human oversight',
        'Quality control',
        'Learning opportunity'
      ],
      cons: [
        'Breaks autonomous workflow',
        'Slower than automated approach',
        'Requires developer time'
      ],
      timeEstimate: 'Variable (1-4 hours)',
      riskLevel: 'LOW',
      complexity: 'variable',
      recommended: false,
      useWhen: 'Complex or ambiguous features requiring judgment'
    });

    return solutions;
  }

  /**
   * Estimate fix time for incomplete implementation
   */
  estimateIncompleteFixTime(incompleteness) {
    const missing = incompleteness.missing || [];
    const baseTimePerTask = 30;  // minutes
    
    const complexity = this.assessTaskComplexity(incompleteness);
    const multiplier = complexity === 'high' ? 1.5 : complexity === 'moderate' ? 1.2 : 1.0;
    
    const totalMinutes = missing.length * baseTimePerTask * multiplier;
    
    if (totalMinutes < 60) return `${Math.round(totalMinutes)} minutes`;
    return `${Math.round(totalMinutes / 60)} hours`;
  }

  /**
   * Step 6: Select Recommended Solution
   */
  selectRecommendedSolution() {
    const recommendedSolution = this.analysis.solutions.find(s => s.recommended);
    
    if (!recommendedSolution) {
      // Fallback: select lowest risk solution
      return this.analysis.solutions.reduce((best, current) => {
        return current.riskLevel === 'LOW' ? current : best;
      });
    }

    return recommendedSolution;
  }

  // Helper methods
  extractFailures() {
    const failures = [];
    const lines = this.input.split('\n');
    
    for (const line of lines) {
      if (line.includes('FAIL') || line.includes('ERROR') || line.includes('✗')) {
        failures.push(line.trim());
      }
    }

    return failures;
  }

  extractLocations() {
    const locations = [];
    const filePattern = /([a-zA-Z0-9_/-]+\.(js|ts|jsx|tsx|py|java|go))/g;
    const matches = this.input.match(filePattern);
    
    if (matches) {
      return [...new Set(matches)];
    }

    return locations;
  }

  extractConditions() {
    return ['During verification'];  // Simplified
  }

  extractManifestation() {
    return ['See debug input for details'];  // Simplified
  }

  findOriginalPlan() {
    // Try to find plan reference in debug input
    const planMatch = this.input.match(/Plan:\s*(.+\.PLAN\.md)/i);
    if (planMatch && fs.existsSync(planMatch[1])) {
      return planMatch[1];
    }

    return null;
  }

  extractTaskSection(planContent, startIndex) {
    const taskStart = planContent.indexOf('<task', startIndex);
    const taskEnd = planContent.indexOf('</task>', taskStart);
    
    if (taskStart >= 0 && taskEnd >= 0) {
      return planContent.substring(taskStart, taskEnd + 7);
    }

    return '';
  }

  analyzeGitHistory(gitLog) {
    return { recentCommits: gitLog.split('\n').slice(0, 5) };
  }

  analyzeTestFailure() {
    return 'Test assertion failure - logic error in implementation';
  }

  analyzeQualityIssue() {
    return 'Code quality standards violated';
  }

  analyzeRegression() {
    return 'Recent change broke previously working feature';
  }

  generateTestFailureSolutions() {
    return [{
      name: 'Fix Test Logic',
      description: 'Correct implementation to match test expectations',
      timeEstimate: '30 minutes',
      riskLevel: 'LOW',
      recommended: true
    }];
  }

  generateQualitySolutions() {
    return [{
      name: 'Apply Linter Fixes',
      description: 'Run auto-fix and correct remaining issues',
      timeEstimate: '15 minutes',
      riskLevel: 'LOW',
      recommended: true
    }];
  }

  generateGenericSolution() {
    return {
      name: 'Manual Investigation',
      description: 'Requires deeper investigation',
      timeEstimate: 'Unknown',
      riskLevel: 'MEDIUM',
      recommended: true
    };
  }
}

// Export class and singleton instance
module.exports = {
  DebugAnalyzer
};
