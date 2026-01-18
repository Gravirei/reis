# Plan: 3-3 - Plan Optimizer & Intelligence

## Objective
Create plan-optimizer utility to analyze plans and suggest improvements for wave sizes, parallelization, and efficiency.

## Context
- Validator checks correctness, optimizer suggests improvements
- Uses historical metrics to make smart recommendations
- Analyzes wave sizes, task distribution, dependencies
- Suggests optimizations: wave splitting, consolidation, parallelization
- Powers `reis optimize` command

## Dependencies
Depends on Plan 3-2 (metrics-tracker) - needs historical data for intelligent suggestions

## Tasks

<task type="auto">
<name>Create plan-optimizer utility with analysis engine</name>
<files>lib/utils/plan-optimizer.js</files>
<action>
Create plan-optimizer.js utility for plan optimization:

1. Module exports:
   - PlanOptimizer class - main optimizer
   - analyzeWaveSizes(waves, config) - analyze wave distribution
   - suggestWaveOptimizations(waves, metrics) - suggest improvements
   - detectParallelizableWaves(waves) - find parallel opportunities
   - assessPlanRisk(waves, metrics) - identify potential blockers

2. PlanOptimizer class:
   ```javascript
   class PlanOptimizer {
     constructor(projectRoot) {
       this.projectRoot = projectRoot;
       this.metricsTracker = new MetricsTracker(projectRoot);
       this.config = loadConfig(projectRoot);
     }
     
     analyzePlan(planPath) { ... }
     generateOptimizationReport() { ... }
   }
   ```

3. Wave size analysis:
   - Count tasks per wave
   - Compare to size configuration (small: ≤4, medium: ≤8, large: ≤15)
   - Detect oversized waves (too many tasks)
   - Detect undersized waves (too few tasks, could merge)
   - Estimate duration based on historical data
   - Suggest wave splits:
     ```
     ⚠️ Wave 2 has 12 tasks (large wave)
     💡 Suggestion: Split into 2 medium waves:
        - Wave 2a: Tasks 1-6 (Core feature)
        - Wave 2b: Tasks 7-12 (Edge cases)
     ```

4. Parallelization analysis:
   - Parse ## Dependencies section
   - Build dependency graph
   - Identify waves with no dependencies (can run parallel)
   - Suggest wave numbering for parallel execution:
     ```
     💡 Optimization: Waves 3, 4, 5 have no dependencies
        Consider using wave="1" attribute for parallel execution:
        <task wave="1" ...> (Wave 3 tasks)
        <task wave="1" ...> (Wave 4 tasks)
        <task wave="1" ...> (Wave 5 tasks)
     ```

5. Task distribution analysis:
   - Check if tasks are evenly distributed across waves
   - Detect bottleneck waves (one huge wave, rest small)
   - Suggest rebalancing:
     ```
     ⚠️ Uneven distribution detected:
        Wave 1: 2 tasks, Wave 2: 15 tasks, Wave 3: 3 tasks
     💡 Suggestion: Redistribute for better balance:
        Wave 1: 6 tasks, Wave 2: 8 tasks, Wave 3: 6 tasks
     ```

6. Risk assessment:
   - Identify high-risk waves (historically slow or failing)
   - Check for vague task descriptions
   - Check for missing checkpoints in long sequences
   - Warn about lack of verification methods
   - Suggest checkpoint placement:
     ```
     ⚠️ No checkpoints in 5-wave sequence
     💡 Suggestion: Add checkpoint after Wave 3 (halfway point)
     ```

7. Historical pattern matching:
   - Compare current plan to historical executions
   - Find similar wave patterns
   - Use historical duration to estimate new waves
   - Warn if similar waves previously failed:
     ```
     ⚠️ Wave 2 similar to "Authentication wave" which failed 2/3 times
     💡 Suggestion: Review task complexity, consider splitting
     ```

8. Generate optimization report:
   ```javascript
   {
     summary: {
       totalWaves: 5,
       totalTasks: 23,
       estimatedDuration: 120, // minutes
       riskScore: 0.3, // 0-1 scale
       parallelizationOpportunities: 2
     },
     optimizations: [
       { type: 'wave-split', wave: 2, reason: '12 tasks exceeds medium size', suggestion: '...' },
       { type: 'parallelization', waves: [3,4], reason: 'No dependencies', suggestion: '...' },
       { type: 'checkpoint', after: 3, reason: 'Long sequence without checkpoint', suggestion: '...' }
     ],
     risks: [
       { wave: 2, severity: 'medium', reason: 'Similar wave failed historically', mitigation: '...' }
     ],
     estimatedSavings: 25 // minutes saved if optimizations applied
   }
   ```

WHY avoid certain approaches:
- Don't auto-modify plans (suggest only, user decides)
- Don't require perfect historical data (work with sparse data)
- Don't make complex ML predictions (keep it rule-based and explainable)
- Don't overwhelm with suggestions (prioritize top 3-5 most impactful)
</action>
<verify>
# Test optimizer loads
node -e "const o = require('./lib/utils/plan-optimizer'); const opt = new o.PlanOptimizer(); console.log('OK')"

# Test with real plan
node -e "const {PlanOptimizer} = require('./lib/utils/plan-optimizer'); const opt = new PlanOptimizer(); const report = opt.analyzePlan('.planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md'); console.log(JSON.stringify(report.summary, null, 2))"
</verify>
<done>
- PlanOptimizer class created
- Wave size analysis works
- Parallelization detection works
- Task distribution analysis works
- Risk assessment works
- Historical pattern matching works
- Generates comprehensive optimization report
- Prioritizes suggestions by impact
- Provides actionable recommendations
</done>
</task>

<task type="auto">
<name>Create tests for plan-optimizer</name>
<files>test/utils/plan-optimizer.test.js</files>
<action>
Create comprehensive test suite for plan-optimizer:

1. Setup test fixtures:
   - Sample plans with various issues (oversized waves, no dependencies, etc.)
   - Mock metrics data (historical executions)
   - Mock config with wave size settings

2. Test wave size analysis:
   - Detect oversized waves (>config max)
   - Detect undersized waves (<2 tasks)
   - Suggest wave splits correctly
   - Suggest wave merges correctly
   - Handle edge cases (1 task wave, 50 task wave)

3. Test parallelization detection:
   - Build dependency graph correctly
   - Identify truly independent waves
   - Don't suggest parallelization when dependencies exist
   - Handle complex dependency chains
   - Handle circular dependencies gracefully

4. Test task distribution analysis:
   - Detect uneven distribution (std deviation)
   - Suggest rebalancing
   - Don't suggest for already balanced plans
   - Handle plans with 1 wave (no rebalancing possible)

5. Test risk assessment:
   - Identify high-risk waves from historical failures
   - Warn about missing verification methods
   - Suggest checkpoint placement appropriately
   - Calculate risk score accurately (0-1 scale)
   - Don't over-warn (balance sensitivity)

6. Test historical pattern matching:
   - Match similar waves by name/size/tasks
   - Use historical duration for estimates
   - Handle no historical data gracefully
   - Handle sparse historical data
   - Don't false-positive on unrelated waves

7. Test optimization report generation:
   - Report includes all sections
   - Suggestions prioritized by impact
   - Estimated savings calculated
   - Risk score makes sense
   - Report is actionable

8. Test with real Phase 2 plans:
   - Analyze existing phase-2 plans
   - Verify no false positives
   - Verify catches actual issues if any exist
   - Performance acceptable (<500ms for typical plan)

9. Test edge cases:
   - Empty plan
   - Single task plan
   - Huge plan (50+ tasks)
   - Plan with only checkpoints
   - Plan with circular dependencies

10. Test integration with MetricsTracker:
    - Mock metrics data
    - Verify historical lookups work
    - Handle missing metrics gracefully

Use mocha/assert pattern.
Use temp directories for test data.
Clean up after tests.
</action>
<verify>
npm test -- test/utils/plan-optimizer.test.js
</verify>
<done>
- All tests pass (40+ test cases)
- Wave size analysis fully tested
- Parallelization detection fully tested
- Task distribution analysis tested
- Risk assessment tested
- Historical pattern matching tested
- Report generation tested
- Real plan analysis tested
- Edge cases covered
- Integration with MetricsTracker tested
</done>
</task>

## Success Criteria
- ✅ PlanOptimizer analyzes wave sizes and suggests splits/merges
- ✅ Detects parallelization opportunities via dependency analysis
- ✅ Assesses task distribution and suggests rebalancing
- ✅ Identifies risks using historical pattern matching
- ✅ Generates comprehensive, actionable optimization reports
- ✅ 40+ tests pass with full coverage
- ✅ Performance <500ms for typical plan analysis
- ✅ Prioritizes suggestions by impact
- ✅ Works with sparse or missing historical data

## Verification
```bash
# Run optimizer tests
npm test -- test/utils/plan-optimizer.test.js

# Test with real plan
node -e "const {PlanOptimizer} = require('./lib/utils/plan-optimizer'); const opt = new PlanOptimizer(); const report = opt.analyzePlan('.planning/phases/phase-2-command-enhancement/2-5-integration-testing.PLAN.md'); console.log(JSON.stringify(report, null, 2))"

# Run all tests
npm test
```
