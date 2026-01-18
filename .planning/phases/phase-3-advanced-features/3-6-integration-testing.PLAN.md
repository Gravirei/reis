# Plan: 3-6 - Phase 3 Integration & End-to-End Testing

## Objective
Create comprehensive integration tests for Phase 3 features working together and validate the complete REIS v2.0 system end-to-end.

## Context
- Phase 3 adds 4 utilities and 4 commands
- Need integration tests for utilities working together
- Need E2E tests for complete user workflows
- Test full REIS v2.0 feature set (Phases 1-3 combined)
- Validate performance, reliability, and user experience
- Final validation before Phase 4 (polish and release)

## Dependencies
Depends on Plans 3-1, 3-2, 3-3, 3-4, 3-5 - All utilities and commands must be implemented

## Tasks

<task type="auto">
<name>Create Phase 3 utility integration tests</name>
<files>test/integration/phase3-utilities.test.js</files>
<action>
Create integration test suite for Phase 3 utilities working together:

1. Setup test environment:
   - Create temp directory with full REIS project
   - Initialize .planning/ with STATE.md, METRICS.md, ROADMAP.md
   - Create sample PLAN.md files
   - Initialize git repository
   - Mock historical metrics data

2. Test Workflow 1: Validate → Execute → Metrics
   ```
   Scenario: Developer validates plan before execution
   Steps:
   1. Create PLAN.md with intentional issues
   2. Run plan-validator → detect issues
   3. Fix issues in plan
   4. Run plan-validator → passes
   5. Execute plan with WaveExecutor
   6. Verify metrics-tracker records execution
   7. Verify METRICS.md updated
   ```

3. Test Workflow 2: Execute → Track → Optimize
   ```
   Scenario: Developer executes multiple plans, then optimizes
   Steps:
   1. Execute 5 different plans
   2. Metrics-tracker records all executions
   3. Run plan-optimizer on new plan
   4. Verify optimizer uses historical metrics
   5. Verify suggestions are data-driven
   6. Verify risk assessment accurate
   ```

4. Test Workflow 3: Validate → Optimize → Execute → Visualize
   ```
   Scenario: Full planning workflow
   Steps:
   1. Validate new plan → warnings found
   2. Optimize plan → suggestions provided
   3. Apply optimizations to plan
   4. Execute optimized plan
   5. Visualize execution progress
   6. Verify metrics recorded
   7. Analyze results
   ```

5. Test Workflow 4: Historical Data Utilization
   ```
   Scenario: System learns from history
   Steps:
   1. Execute 10 waves with varying success rates
   2. Some waves fail consistently
   3. Run optimizer on similar plan
   4. Verify optimizer warns about risky waves
   5. Verify duration estimates based on history
   6. Verify suggestions improve over time
   ```

6. Test data flow between utilities:
   - WaveExecutor → MetricsTracker (execution data)
   - MetricsTracker → PlanOptimizer (historical data)
   - PlanValidator → PlanOptimizer (validation results)
   - Visualizer ← MetricsTracker (display data)
   - Visualizer ← StateManager (current state)

7. Test error propagation:
   - Invalid plan → validator catches → execution blocked
   - Metrics recording fails → execution continues
   - Optimizer fails → provide default suggestions
   - Visualizer fails → fallback to text output

8. Test performance with integrated utilities:
   - Validate + Optimize together < 1s
   - Execute with metrics tracking (no slowdown >5%)
   - Visualize with large dataset < 500ms
   - Full workflow < 5s overhead

9. Test concurrent utility usage:
   - Multiple processes recording metrics (file locking)
   - Validate while execute running (read-only safe)
   - Visualize during execution (live updates)

10. Test data consistency:
    - METRICS.md remains valid after crashes
    - STATE.md consistency with METRICS.md
    - No data loss on errors
    - Atomic updates where critical

Use mocha/assert pattern.
Use real filesystem for integration fidelity.
Clean up thoroughly after tests.
</action>
<verify>
npm test -- test/integration/phase3-utilities.test.js
</verify>
<done>
- All utility integration tests pass (30+ tests)
- Data flow between utilities verified
- Error propagation tested
- Performance with integration verified
- Concurrent usage safe
- Data consistency maintained
- Tests clean up completely
</done>
</task>

<task type="auto">
<name>Create Phase 3 end-to-end scenario tests</name>
<files>test/e2e/phase3-scenarios.test.js</files>
<action>
Create real-world scenario tests for Phase 3 features:

1. Scenario: First-time user workflow
   ```
   Setup: New REIS project
   Steps:
   1. User runs 'reis new my-project'
   2. User creates first PLAN.md
   3. User runs 'reis validate' → gets helpful feedback
   4. User fixes issues based on warnings
   5. User runs 'reis validate' → passes
   6. User runs 'reis execute-plan --wave'
   7. Metrics start accumulating
   8. User runs 'reis visualize' → sees progress
   9. User completes first wave
   10. User runs 'reis analyze' → sees first metrics
   
   Verify: 
   - All commands work out of box
   - Error messages are helpful
   - Metrics tracking automatic
   - User experience smooth
   ```

2. Scenario: Planning optimization workflow
   ```
   Setup: Experienced user with history
   Steps:
   1. User has executed 20+ waves over 2 weeks
   2. User creates new ambitious plan (8 waves, 40 tasks)
   3. User runs 'reis validate' → passes structure
   4. User runs 'reis optimize' → multiple suggestions
      - Split oversized waves
      - Parallelize independent waves
      - Add checkpoints
   5. User applies suggestions
   6. User runs 'reis optimize' again → fewer suggestions
   7. User executes optimized plan
   8. Verify: Execution faster than original estimate
   
   Verify:
   - Optimizer learns from history
   - Suggestions are actionable
   - Optimizations improve performance
   - Metrics validate improvements
   ```

3. Scenario: Long-running project with analytics
   ```
   Setup: Multi-phase project
   Steps:
   1. Execute Phase 1 (5 plans, 20 waves, 2 weeks)
   2. Run 'reis analyze --period=all'
   3. See trends: improving success rate
   4. Execute Phase 2 (7 plans, 30 waves, 3 weeks)
   5. Run 'reis analyze' → compare phases
   6. Identify bottlenecks (large waves slow)
   7. Start Phase 3 with optimizations
   8. Run 'reis optimize' on each plan
   9. Execute Phase 3 (faster due to learning)
   10. Final 'reis analyze' shows improvements
   
   Verify:
   - Historical data accumulates correctly
   - Trends are accurate
   - Insights are actionable
   - System improves over time
   ```

4. Scenario: Live monitoring during execution
   ```
   Setup: Long-running execution
   Steps:
   1. Start executing large plan (10 waves, ~2 hours)
   2. In separate terminal: 'reis visualize --refresh=5'
   3. Watch real-time progress updates
   4. Wave 3 takes longer than expected
   5. Visualizer shows deviation
   6. User checks 'reis analyze' mid-execution
   7. Sees current wave performance
   8. Execution completes
   9. Final visualize shows summary
   
   Verify:
   - Live updates work correctly
   - No corruption from concurrent access
   - Deviation detection works
   - User can monitor long executions
   ```

5. Scenario: Error recovery and learning
   ```
   Setup: Plan with problematic wave
   Steps:
   1. Execute plan, Wave 3 fails consistently (3 attempts)
   2. Metrics record failures
   3. User creates new similar plan
   4. 'reis optimize' warns about similar wave to failed one
   5. User splits problematic wave based on suggestion
   6. New execution succeeds
   7. Metrics show improved success rate
   
   Verify:
   - Failure patterns detected
   - Warnings prevent repeat failures
   - System learns from mistakes
   - Success rate improves over time
   ```

6. Scenario: Integration with existing tools
   ```
   Setup: CI/CD pipeline
   Steps:
   1. Git pre-commit hook runs 'reis validate --strict --json'
   2. Validation fails → commit blocked
   3. Fix issues, validation passes → commit succeeds
   4. CI runs 'reis execute-plan --wave --no-progress'
   5. Execution completes, metrics recorded
   6. CI exports 'reis analyze --json --export=metrics.json'
   7. Dashboard ingests metrics for visualization
   
   Verify:
   - JSON output is parseable
   - Exit codes correct for automation
   - Commands work non-interactively
   - Integration with tooling seamless
   ```

Each scenario should:
- Use real command-line invocations
- Verify output and side effects
- Check files (STATE.md, METRICS.md)
- Test full user experience
- Capture performance metrics
- Clean up completely

Use separate temp directory per scenario.
Use real git operations.
Simulate realistic timing (small delays).
</action>
<verify>
npm test -- test/e2e/phase3-scenarios.test.js
</verify>
<done>
- All E2E scenarios pass (6 major scenarios)
- Real-world workflows validated
- User experience tested end-to-end
- Live monitoring tested
- Error recovery tested
- Tool integration tested
- Performance verified
- Tests are reproducible
</done>
</task>

<task type="auto">
<name>Create comprehensive Phase 3 test suite and performance benchmarks</name>
<files>test/integration/phase3-full-system.test.js, test/performance/phase3-benchmarks.test.js</files>
<action>
Create full system test and performance benchmark suite:

## Full System Integration Tests (phase3-full-system.test.js):

1. Test complete REIS v2.0 feature set:
   - All Phase 1 features (config, state, git, waves)
   - All Phase 2 features (execute, checkpoint, resume, config)
   - All Phase 3 features (validate, optimize, analyze, visualize)
   - All features working together harmoniously

2. Test complete project lifecycle:
   ```
   1. reis new test-project
   2. reis config init
   3. Create multi-phase ROADMAP.md
   4. Create phase plans with PLAN.md files
   5. reis validate (all plans)
   6. reis optimize (all plans)
   7. reis execute-plan (Phase 1 plans with --wave)
   8. reis checkpoint (between phases)
   9. reis analyze (Phase 1 metrics)
   10. reis execute-plan (Phase 2 plans)
   11. reis resume (from checkpoint)
   12. reis visualize (project status)
   13. reis analyze (full project metrics)
   14. Verify: Complete project tracked correctly
   ```

3. Test data integrity across all operations:
   - STATE.md remains valid throughout
   - METRICS.md accumulates correctly
   - Checkpoints reference correct commits
   - No data loss or corruption
   - Concurrent operations safe

4. Test backward compatibility:
   - REIS v1.x projects still work
   - Old commands function
   - New commands degrade gracefully
   - Migration path clear

5. Test edge cases at system level:
   - Very large project (50+ plans, 200+ waves)
   - Very long-running execution (hours)
   - Many concurrent operations
   - Disk full scenarios (graceful degradation)
   - Git conflicts during execution

## Performance Benchmarks (phase3-benchmarks.test.js):

1. Baseline benchmarks (Phase 1 & 2):
   - Config load: < 50ms
   - STATE.md parse: < 100ms
   - Wave parse: < 200ms
   - Wave execution overhead: < 500ms

2. Phase 3 utility benchmarks:
   - Plan validation: < 100ms (typical plan)
   - Metrics recording: < 50ms
   - Metrics summary: < 200ms
   - Plan optimization: < 500ms
   - Visualization render: < 100ms

3. Command benchmarks:
   - reis validate: < 500ms
   - reis optimize: < 1s
   - reis analyze: < 1s
   - reis visualize: < 500ms

4. Integration overhead benchmarks:
   - Execute with validation: +100ms overhead
   - Execute with metrics: +50ms overhead
   - Execute with visualization: +100ms overhead
   - Full integration: < 300ms total overhead

5. Scalability benchmarks:
   - 10 waves: all operations < 1s
   - 50 waves: all operations < 3s
   - 100 waves: all operations < 10s
   - 1000 metrics entries: analysis < 5s

6. Memory benchmarks:
   - Memory usage < 100MB typical
   - No memory leaks over 100 operations
   - Large dataset handling (10MB METRICS.md)

7. Performance regression detection:
   - Compare against Phase 2 baseline
   - Ensure no significant slowdown (>10%)
   - Identify any bottlenecks
   - Document performance characteristics

8. Benchmark reporting:
   ```
   REIS v2.0 Phase 3 Performance Benchmarks
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Utilities:
   ✓ Plan validation: 87ms (target: <100ms)
   ✓ Metrics recording: 32ms (target: <50ms)
   ✓ Plan optimization: 423ms (target: <500ms)
   ✓ Visualization: 76ms (target: <100ms)
   
   Commands:
   ✓ reis validate: 412ms (target: <500ms)
   ✓ reis optimize: 856ms (target: <1s)
   ✓ reis analyze: 734ms (target: <1s)
   ✓ reis visualize: 398ms (target: <500ms)
   
   Integration Overhead:
   ✓ Execute + validation: +92ms (target: <100ms)
   ✓ Execute + metrics: +38ms (target: <50ms)
   ✓ Full integration: +234ms (target: <300ms)
   
   All benchmarks PASSED ✓
   ```

Use mocha with --slow and --timeout settings.
Run benchmarks multiple times for accuracy.
Report averages and standard deviations.
Fail if targets exceeded by >20%.
</action>
<verify>
# Run full system tests
npm test -- test/integration/phase3-full-system.test.js

# Run performance benchmarks
npm test -- test/performance/phase3-benchmarks.test.js

# Run all Phase 3 tests
npm test -- test/integration/phase3-*.test.js test/e2e/phase3-*.test.js test/performance/phase3-*.test.js

# Run complete test suite
npm test
</verify>
<done>
- Full system integration tests pass (25+ tests)
- Complete project lifecycle tested
- Data integrity verified across operations
- Backward compatibility confirmed
- Edge cases at system level covered
- Performance benchmarks pass (all targets met)
- No performance regression from Phase 2
- Memory usage acceptable
- Scalability verified
- Benchmark report generated
- Complete REIS v2.0 system validated
</done>
</task>

## Success Criteria
- ✅ All utility integration tests pass (30+ tests)
- ✅ All E2E scenarios pass (6 major scenarios)
- ✅ Full system integration tests pass (25+ tests)
- ✅ All performance benchmarks meet targets
- ✅ No performance regression from Phase 2
- ✅ Data integrity maintained across all operations
- ✅ Concurrent operations safe
- ✅ Backward compatibility confirmed
- ✅ Complete REIS v2.0 system validated
- ✅ Ready for Phase 4 (polish and release)

## Verification
```bash
# Run all Phase 3 integration tests
npm test -- test/integration/phase3-*.test.js

# Run all E2E scenarios
npm test -- test/e2e/phase3-*.test.js

# Run performance benchmarks
npm test -- test/performance/phase3-benchmarks.test.js

# Run complete test suite (Phases 1-3)
npm test

# Verify test count
npm test 2>&1 | grep "passing" | tail -1
# Should show 250+ tests passing (48 Phase 1 + 109 Phase 2 + 90+ Phase 3)

# Performance check
time npm test
# Should complete in < 30 seconds
```
