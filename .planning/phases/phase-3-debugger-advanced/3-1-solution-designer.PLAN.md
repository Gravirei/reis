# Plan: 3-1 - Enhanced Solution Design Module

## Objective
Implement SolutionDesigner that enhances solution generation with scoring, trade-off analysis, and FR2.1 targeted re-execution optimization.

## Context
The SolutionDesigner enhances the basic solution generation from DebugAnalyzer with:
- Solution scoring (feasibility, risk, impact)
- Trade-off analysis
- **FR2.1:** Optimization for incomplete implementations (targeted vs full re-execution)
- Complexity estimation
- Time/risk modeling

## Dependencies
- Plan 2-3 (DebugAnalyzer exists)

## Tasks

<task type="auto">
<name>Implement SolutionDesigner with FR2.1 incomplete implementation optimization</name>
<files>lib/utils/solution-designer.js</files>
<action>
Create enhanced solution designer:

```javascript
import fs from 'fs';

/**
 * Solution Designer - Enhances solution options with scoring and optimization
 * FR2.1: Optimizes incomplete implementation solutions (targeted re-execution)
 */
export class SolutionDesigner {
  constructor(analysis) {
    this.analysis = analysis;
  }

  /**
   * Enhance solutions with scoring and recommendations
   */
  enhanceSolutions(solutions) {
    const enhanced = solutions.map(solution => {
      const scored = this.scoreSolution(solution);
      const tradeoffs = this.analyzeTradeoffs(scored);
      const optimized = this.optimizeSolution(scored);

      return {
        ...solution,
        score: scored.totalScore,
        feasibility: scored.feasibility,
        tradeoffs: tradeoffs,
        optimization: optimized
      };
    });

    // Sort by score (descending)
    enhanced.sort((a, b) => b.score - a.score);

    return enhanced;
  }

  /**
   * Score a solution on multiple dimensions
   */
  scoreSolution(solution) {
    const scores = {
      feasibility: this.scoreFeasibility(solution),
      risk: this.scoreRisk(solution),
      impact: this.scoreImpact(solution),
      time: this.scoreTime(solution)
    };

    // FR2.1: Boost score for targeted re-execution on incomplete implementations
    if (this.analysis.classification.type === 'incomplete-implementation' &&
        solution.name === 'Targeted Re-execution') {
      scores.feasibility += 0.2;
      scores.risk += 0.2;  // Lower risk is higher score
      scores.impact += 0.1;
    }

    // Weighted average
    const weights = {
      feasibility: 0.3,
      risk: 0.3,
      impact: 0.2,
      time: 0.2
    };

    const totalScore = 
      scores.feasibility * weights.feasibility +
      scores.risk * weights.risk +
      scores.impact * weights.impact +
      scores.time * weights.time;

    return {
      ...solution,
      scores: scores,
      totalScore: Math.min(totalScore, 1.0)
    };
  }

  /**
   * Score feasibility (0-1, higher is better)
   */
  scoreFeasibility(solution) {
    let score = 0.5;  // Baseline

    // Complexity factor
    if (solution.complexity === 'simple') score += 0.3;
    else if (solution.complexity === 'moderate') score += 0.15;
    
    // Risk factor (lower risk = higher feasibility)
    if (solution.riskLevel === 'LOW') score += 0.2;
    else if (solution.riskLevel === 'MEDIUM') score += 0.1;

    // FR2.1: Targeted re-execution is highly feasible
    if (solution.name === 'Targeted Re-execution') {
      score += 0.15;
    }

    // Re-execution entire wave is less feasible (redundant work)
    if (solution.name === 'Re-execute Entire Wave') {
      score -= 0.15;
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * Score risk (0-1, higher score = lower risk)
   */
  scoreRisk(solution) {
    const riskMap = {
      'LOW': 0.9,
      'MEDIUM': 0.5,
      'HIGH': 0.2,
      'CRITICAL': 0.1
    };

    let score = riskMap[solution.riskLevel] || 0.5;

    // FR2.1: Targeted re-execution has minimal risk (no touching completed work)
    if (solution.name === 'Targeted Re-execution') {
      score = Math.min(score + 0.1, 1.0);
    }

    // Re-executing entire wave has higher risk (might break working features)
    if (solution.name === 'Re-execute Entire Wave') {
      score = Math.max(score - 0.2, 0.1);
    }

    return score;
  }

  /**
   * Score impact (0-1, higher is better)
   */
  scoreImpact(solution) {
    let score = 0.5;

    // Scope consideration
    if (solution.scope) {
      const scopeSize = Array.isArray(solution.scope) ? solution.scope.length : 1;
      
      // Smaller, focused scope is better for incomplete implementations
      if (this.analysis.classification.type === 'incomplete-implementation') {
        if (scopeSize <= 2) score += 0.3;
        else if (scopeSize <= 4) score += 0.15;
      }
    }

    // Pros/cons balance
    if (solution.pros && solution.cons) {
      const balance = solution.pros.length - solution.cons.length;
      score += balance * 0.05;
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * Score time efficiency (0-1, higher is better = faster)
   */
  scoreTime(solution) {
    let score = 0.5;

    if (!solution.timeEstimate) return score;

    const timeStr = solution.timeEstimate.toLowerCase();

    // Parse time estimate
    if (timeStr.includes('minute')) {
      const minutes = parseInt(timeStr);
      if (minutes <= 15) score = 1.0;
      else if (minutes <= 30) score = 0.8;
      else if (minutes <= 60) score = 0.6;
      else score = 0.4;
    } else if (timeStr.includes('hour')) {
      const hours = parseInt(timeStr);
      if (hours <= 1) score = 0.5;
      else if (hours <= 2) score = 0.3;
      else score = 0.2;
    } else if (timeStr.includes('variable') || timeStr.includes('unknown')) {
      score = 0.3;
    }

    // FR2.1: Targeted re-execution is typically fast
    if (solution.name === 'Targeted Re-execution') {
      score = Math.min(score + 0.1, 1.0);
    }

    return score;
  }

  /**
   * Analyze trade-offs for a solution
   */
  analyzeTradeoffs(solution) {
    const tradeoffs = {
      speedVsQuality: this.analyzeSpeedVsQuality(solution),
      riskVsBenefit: this.analyzeRiskVsBenefit(solution),
      effortVsCompleteness: this.analyzeEffortVsCompleteness(solution)
    };

    return tradeoffs;
  }

  /**
   * Speed vs Quality trade-off
   */
  analyzeSpeedVsQuality(solution) {
    const speed = solution.scores.time;
    const quality = solution.scores.feasibility;

    if (speed > 0.7 && quality > 0.7) {
      return 'Optimal - both fast and high quality';
    } else if (speed > quality + 0.2) {
      return 'Speed-optimized - faster but may sacrifice quality';
    } else if (quality > speed + 0.2) {
      return 'Quality-optimized - thorough but slower';
    } else {
      return 'Balanced - reasonable speed and quality';
    }
  }

  /**
   * Risk vs Benefit trade-off
   */
  analyzeRiskVsBenefit(solution) {
    const risk = 1.0 - solution.scores.risk;  // Invert to get risk level
    const benefit = solution.scores.impact;

    if (risk < 0.3 && benefit > 0.6) {
      return 'Excellent - low risk, high benefit';
    } else if (risk > 0.6) {
      return 'Risky - high risk, evaluate if benefit justifies';
    } else if (benefit < 0.3) {
      return 'Low benefit - consider if worth effort';
    } else {
      return 'Acceptable - moderate risk-benefit balance';
    }
  }

  /**
   * FR2.1: Effort vs Completeness trade-off (for incomplete implementations)
   */
  analyzeEffortVsCompleteness(solution) {
    if (this.analysis.classification.type !== 'incomplete-implementation') {
      return 'N/A';
    }

    // Targeted re-execution: low effort, targeted completeness
    if (solution.name === 'Targeted Re-execution') {
      return 'Optimal - minimal effort, completes missing features only';
    }

    // Re-execute entire wave: high effort, ensures completeness
    if (solution.name === 'Re-execute Entire Wave') {
      return 'High effort - redundant work, but ensures wave completeness';
    }

    // Manual implementation: variable effort
    if (solution.name === 'Manual Implementation') {
      return 'Variable effort - depends on feature complexity';
    }

    return 'Unknown';
  }

  /**
   * FR2.1: Optimize solution for incomplete implementations
   */
  optimizeSolution(solution) {
    if (this.analysis.classification.type !== 'incomplete-implementation') {
      return { optimized: false };
    }

    const incompleteness = this.analysis.classification.incompleteness;

    // Optimize targeted re-execution
    if (solution.name === 'Targeted Re-execution') {
      return {
        optimized: true,
        optimization: 'break-into-smaller-tasks',
        recommendation: this.generateTaskBreakdown(incompleteness),
        reasoning: 'Breaking missing features into atomic tasks enables parallel execution and reduces context complexity'
      };
    }

    // Suggest optimization for re-execute entire wave
    if (solution.name === 'Re-execute Entire Wave') {
      return {
        optimized: true,
        optimization: 'use-targeted-instead',
        recommendation: 'Consider targeted re-execution to avoid redundant work',
        reasoning: `${incompleteness.completedTasks?.length || 0} tasks already completed successfully - re-executing them risks regression`,
        alternatives: ['Targeted Re-execution']
      };
    }

    return { optimized: false };
  }

  /**
   * FR2.1: Generate task breakdown for targeted re-execution
   */
  generateTaskBreakdown(incompleteness) {
    const breakdown = [];
    const missing = incompleteness.missing || [];

    missing.forEach((task, index) => {
      // Simple task naming
      const taskName = task.replace(/^Task \d+:?\s*/i, '');
      
      breakdown.push({
        order: index + 1,
        name: `Implement ${taskName}`,
        scope: 'isolated',
        dependencies: index > 0 ? [`Task ${index}`] : [],
        estimated: '30 min',
        deliverables: this.inferDeliverables(taskName)
      });
    });

    return breakdown;
  }

  /**
   * Infer likely deliverables from task name
   */
  inferDeliverables(taskName) {
    const deliverables = [];
    const taskLower = taskName.toLowerCase();

    // Infer implementation files
    if (taskLower.includes('endpoint') || taskLower.includes('route')) {
      deliverables.push('API route file');
    }
    if (taskLower.includes('component')) {
      deliverables.push('React component file');
    }
    if (taskLower.includes('service')) {
      deliverables.push('Service class file');
    }
    if (taskLower.includes('database') || taskLower.includes('model')) {
      deliverables.push('Database model/schema');
    }

    // Always include tests
    deliverables.push('Unit tests');

    // Include docs if appropriate
    if (taskLower.includes('public') || taskLower.includes('api')) {
      deliverables.push('API documentation');
    }

    return deliverables;
  }

  /**
   * Generate solution comparison matrix
   */
  generateComparisonMatrix(enhancedSolutions) {
    const matrix = {
      solutions: enhancedSolutions.map(s => s.name),
      dimensions: ['Feasibility', 'Risk', 'Impact', 'Time', 'Overall'],
      scores: {}
    };

    enhancedSolutions.forEach(solution => {
      matrix.scores[solution.name] = {
        feasibility: solution.scores.feasibility.toFixed(2),
        risk: solution.scores.risk.toFixed(2),
        impact: solution.scores.impact.toFixed(2),
        time: solution.scores.time.toFixed(2),
        overall: solution.score.toFixed(2)
      };
    });

    return matrix;
  }

  /**
   * FR2.1: Generate prevention recommendations based on root cause
   */
  generatePreventionRecommendations() {
    const recommendations = [];

    if (this.analysis.classification.type !== 'incomplete-implementation') {
      return this.generateStandardPrevention();
    }

    // Based on root cause likelihood
    const rootCause = this.analysis.rootCause;

    if (rootCause.likelyCause === 'executor-skip') {
      recommendations.push({
        category: 'Task Decomposition',
        priority: 'HIGH',
        action: 'Break complex tasks into smaller sub-tasks (max 45 min each)',
        reasoning: 'Executor likely skipped due to task complexity'
      });

      recommendations.push({
        category: 'Task Verification',
        priority: 'HIGH',
        action: 'Add task-level verification checkpoints between tasks',
        reasoning: 'Catch incomplete tasks early before moving to next'
      });

      recommendations.push({
        category: 'Deliverables Checklist',
        priority: 'MEDIUM',
        action: 'Add explicit deliverables list in <done> criteria with file checks',
        reasoning: 'Makes completion criteria measurable and verifiable'
      });
    }

    if (rootCause.likelyCause === 'plan-ambiguity') {
      recommendations.push({
        category: 'Task Clarity',
        priority: 'CRITICAL',
        action: 'Provide specific file paths in <files> tag',
        reasoning: 'Vague descriptions led to task being skipped'
      });

      recommendations.push({
        category: 'Implementation Details',
        priority: 'HIGH',
        action: 'Include step-by-step instructions in <action> (5+ steps)',
        reasoning: 'Detailed actions reduce ambiguity'
      });

      recommendations.push({
        category: 'Acceptance Criteria',
        priority: 'HIGH',
        action: 'Make <done> criteria measurable (avoid "works properly")',
        reasoning: 'Measurable criteria enable verification'
      });
    }

    if (rootCause.likelyCause === 'dependency-blocker') {
      recommendations.push({
        category: 'Dependency Check',
        priority: 'CRITICAL',
        action: 'Verify all dependencies available before wave execution',
        reasoning: 'Missing dependencies prevented implementation'
      });

      recommendations.push({
        category: 'Environment Validation',
        priority: 'HIGH',
        action: 'Add pre-execution environment checks (packages, env vars, APIs)',
        reasoning: 'Catch blockers before starting implementation'
      });

      recommendations.push({
        category: 'Fallback Planning',
        priority: 'MEDIUM',
        action: 'Provide alternative approaches if dependencies unavailable',
        reasoning: 'Enables progress even with blockers'
      });
    }

    return recommendations;
  }

  /**
   * Generate standard prevention for bugs
   */
  generateStandardPrevention() {
    return [{
      category: 'General',
      priority: 'MEDIUM',
      action: 'Add verification after implementation',
      reasoning: 'Catch issues early'
    }];
  }
}

export function enhanceSolutions(analysis) {
  const designer = new SolutionDesigner(analysis);
  const enhanced = designer.enhanceSolutions(analysis.solutions);
  const matrix = designer.generateComparisonMatrix(enhanced);
  const prevention = designer.generatePreventionRecommendations();

  return {
    solutions: enhanced,
    comparisonMatrix: matrix,
    prevention: prevention
  };
}
```

**What to avoid:**
- Treating all solutions equally (targeted re-execution should score higher for incomplete implementations)
- Missing trade-off analysis
- No optimization for incomplete implementations
- Generic prevention recommendations

**Why:**
- FR2.1 targeted re-execution is optimal for missing features
- Scoring helps select best solution objectively
- Trade-off analysis explains solution implications
- Prevention recommendations improve future executions
</action>
<verify>
```bash
# Check file exists
test -f lib/utils/solution-designer.js && echo "✓ solution-designer.js created"

# Verify FR2.1 incomplete implementation optimization
grep -q "incomplete-implementation" lib/utils/solution-designer.js && echo "✓ FR2.1 optimization included"

# Check for targeted re-execution boost
grep -q "Targeted Re-execution" lib/utils/solution-designer.js && echo "✓ Targeted re-execution support exists"

# Verify prevention recommendations
grep -q "generatePreventionRecommendations" lib/utils/solution-designer.js && echo "✓ Prevention recommendations included"

# Test syntax
node -c lib/utils/solution-designer.js && echo "✓ Syntax valid"
```
</verify>
<done>
- lib/utils/solution-designer.js created with solution enhancement
- FR2.1 optimization for incomplete implementations
- Solution scoring: feasibility, risk, impact, time
- Targeted re-execution gets boosted scores
- Trade-off analysis: speed vs quality, risk vs benefit, effort vs completeness
- Task breakdown generation for targeted fixes
- Prevention recommendations based on root cause
- Comparison matrix generation
</done>
</task>

## Success Criteria
- ✅ SolutionDesigner enhances solutions with scoring
- ✅ FR2.1 targeted re-execution optimization works
- ✅ Trade-off analysis provides decision support
- ✅ Prevention recommendations are cause-specific
- ✅ Comparison matrix enables solution selection

## Verification
```bash
# Module exists
test -f lib/utils/solution-designer.js && echo "✓ SolutionDesigner implemented"

# Has FR2.1 support
grep -c "incomplete-implementation" lib/utils/solution-designer.js
# Should find 8+ occurrences

# Syntax valid
node -c lib/utils/solution-designer.js && echo "✓ Valid JavaScript"

# Can be imported
node -e "import('./lib/utils/solution-designer.js').then(() => console.log('✓ Module loads'))"
```
