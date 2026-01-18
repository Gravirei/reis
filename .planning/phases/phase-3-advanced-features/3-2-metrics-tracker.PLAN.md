# Plan: 3-2 - Metrics Tracker & Analytics

## Objective
Create metrics-tracker utility to track execution metrics, performance data, and success rates for execution intelligence.

## Context
- StateManager stores basic metrics in STATE.md
- Need persistent metrics storage in .planning/METRICS.md
- Track wave durations, success rates, deviation patterns
- Historical data enables trend analysis and optimization
- Used by analyze and optimize commands

## Dependencies
None - Can execute in Wave 1 (parallel with other utilities)

## Tasks

<task type="auto">
<name>Create metrics-tracker utility with persistent storage</name>
<files>lib/utils/metrics-tracker.js</files>
<action>
Create metrics-tracker.js utility for execution metrics:

1. Module exports:
   - MetricsTracker class - main metrics manager
   - recordWaveExecution(waveData) - record wave completion
   - recordCheckpoint(checkpointData) - record checkpoint creation
   - getMetricsSummary() - aggregate metrics
   - getHistoricalTrends() - time-series analysis

2. MetricsTracker class:
   ```javascript
   class MetricsTracker {
     constructor(projectRoot) {
       this.projectRoot = projectRoot;
       this.metricsPath = path.join(projectRoot, '.planning', 'METRICS.md');
       this.data = this.loadMetrics();
     }
     
     loadMetrics() { ... }
     saveMetrics() { ... }
     recordWaveExecution(waveData) { ... }
     getMetricsSummary() { ... }
     getHistoricalTrends(days = 30) { ... }
   }
   ```

3. Metrics data structure (stored in METRICS.md):
   ```markdown
   # REIS Execution Metrics
   
   ## Summary
   - Total waves executed: 47
   - Success rate: 94.2%
   - Average wave duration: 23m
   - Total execution time: 18h 5m
   - Last updated: 2026-01-18
   
   ## Wave Executions
   - 2026-01-18 10:30 | Wave 1: Foundation | 15m | ✓ | commit:abc123
   - 2026-01-18 11:00 | Wave 2: Commands | 28m | ✓ | commit:def456
   - 2026-01-18 14:20 | Wave 3: Testing | 42m | ✗ | error:timeout
   
   ## Checkpoints
   - 2026-01-18 11:05 | After Wave 2 | commit:def456
   - 2026-01-18 15:00 | Before refactor | commit:ghi789
   
   ## Performance Trends
   - Average duration (7d): 24m
   - Average duration (30d): 22m
   - Success rate (7d): 95%
   - Success rate (30d): 94%
   ```

4. Wave execution tracking:
   - Wave name, size, start/end time
   - Duration (minutes)
   - Success/failure status
   - Git commit hash
   - Task count and completion
   - Deviation from estimated time
   - Error messages if failed

5. Checkpoint tracking:
   - Checkpoint name and timestamp
   - Associated wave
   - Git commit reference
   - Files changed count

6. Aggregate metrics calculation:
   - Total waves executed (all time)
   - Success rate (percentage)
   - Average wave duration (by size: small/medium/large)
   - Total execution time
   - Most common failure types
   - Deviation patterns (consistently over/under estimate)

7. Historical trend analysis:
   - Group metrics by time period (7d, 30d, 90d, all)
   - Calculate moving averages
   - Detect patterns (improving/degrading performance)
   - Identify bottleneck waves (consistently long duration)

8. Integration points:
   - Called by WaveExecutor on wave completion
   - Called by StateManager on checkpoint creation
   - Queried by analyze and optimize commands
   - Updates in near-real-time (<100ms)

WHY avoid certain approaches:
- Don't use database (keep it simple with markdown)
- Don't store too much detail (keep file size manageable <1MB)
- Don't block execution to record metrics (async if needed)
- Don't calculate expensive analytics on every save (lazy evaluation)
</action>
<verify>
# Test metrics tracker loads
node -e "const m = require('./lib/utils/metrics-tracker'); const t = new m.MetricsTracker(); console.log('OK')"

# Test metrics recording
node -e "const {MetricsTracker} = require('./lib/utils/metrics-tracker'); const t = new MetricsTracker(); t.recordWaveExecution({name: 'Test', duration: 15, status: 'completed'}); console.log(t.getMetricsSummary())"
</verify>
<done>
- MetricsTracker class created
- Persistent storage in .planning/METRICS.md
- Wave execution recording works
- Checkpoint recording works
- Aggregate metrics calculation works
- Historical trend analysis works
- Performance <100ms for save operations
- METRICS.md remains human-readable
</done>
</task>

<task type="auto">
<name>Create tests for metrics-tracker</name>
<files>test/utils/metrics-tracker.test.js</files>
<action>
Create comprehensive test suite for metrics-tracker:

1. Setup test fixtures:
   - Create temp .planning directory
   - Mock wave execution data
   - Mock checkpoint data
   - Sample METRICS.md files (empty, populated)

2. Test MetricsTracker initialization:
   - Creates METRICS.md if not exists
   - Loads existing METRICS.md correctly
   - Handles empty/corrupted METRICS.md gracefully
   - Creates backup on corruption

3. Test wave execution recording:
   - Record single wave execution
   - Record multiple waves
   - Calculate duration correctly
   - Handle success/failure status
   - Store git commit hash
   - Handle missing optional fields

4. Test checkpoint recording:
   - Record checkpoint with wave reference
   - Record checkpoint without wave
   - Track git commits
   - Store timestamp correctly

5. Test aggregate metrics:
   - Calculate total waves executed
   - Calculate success rate accurately
   - Calculate average duration overall
   - Calculate average by wave size (small/med/large)
   - Handle edge cases (no data, single data point)

6. Test historical trends:
   - Filter by time period (7d, 30d, all)
   - Calculate moving averages
   - Detect improving/degrading trends
   - Handle sparse data (gaps in timeline)

7. Test METRICS.md format:
   - Markdown is well-formatted
   - Human-readable
   - Machine-parseable
   - Preserves history on updates
   - Limits file size (trim old data if >1000 entries)

8. Test performance:
   - Save operation <100ms
   - Load operation <50ms
   - Summary calculation <200ms
   - Trends calculation <500ms (even with lots of data)

9. Test concurrent access:
   - Multiple saves in quick succession
   - No data loss
   - Last write wins (acceptable for metrics)

10. Test integration points:
    - Mock WaveExecutor calling recordWaveExecution
    - Mock StateManager calling recordCheckpoint
    - Verify data flows correctly

Use mocha/assert pattern.
Use real filesystem in temp directory.
Clean up after tests.
</action>
<verify>
npm test -- test/utils/metrics-tracker.test.js
</verify>
<done>
- All tests pass (35+ test cases)
- MetricsTracker initialization tested
- Wave recording fully tested
- Checkpoint recording fully tested
- Aggregate metrics calculation tested
- Historical trends tested
- Performance benchmarks met
- Concurrent access safe
- Tests clean up completely
</done>
</task>

<task type="auto">
<name>Integrate metrics tracking with WaveExecutor and StateManager</name>
<files>lib/utils/wave-executor.js, lib/utils/state-manager.js</files>
<action>
Integrate metrics tracking into existing utilities:

1. Update WaveExecutor (lib/utils/wave-executor.js):
   - Import MetricsTracker
   - Initialize tracker in constructor
   - Record wave execution on completeCurrentWave():
     ```javascript
     completeCurrentWave(options = {}) {
       // ... existing code ...
       
       // Record metrics
       this.metricsTracker.recordWaveExecution({
         name: currentWave.name,
         size: currentWave.size,
         startTime: currentWave.startTime,
         endTime: currentWave.endTime,
         duration: currentWave.getDuration(),
         status: 'completed',
         taskCount: currentWave.tasks.length,
         commit: commitHash,
         phase: this.stateManager.state.currentPhase
       });
       
       // ... rest of code ...
     }
     ```
   - Record on failCurrentWave() as well
   - Add metrics summary to generateReport()

2. Update StateManager (lib/utils/state-manager.js):
   - Import MetricsTracker
   - Initialize tracker in constructor
   - Record checkpoint on createCheckpoint():
     ```javascript
     createCheckpoint(name, commitHash = null) {
       // ... existing code ...
       
       // Record metrics
       this.metricsTracker.recordCheckpoint({
         name: name,
         timestamp: checkpoint.timestamp,
         commit: commitHash,
         wave: this.state.activeWave?.name
       });
       
       // ... rest of code ...
     }
     ```

3. Add metrics display to StateManager output:
   - Include metrics summary in generateStateMarkdown()
   - Show recent trends (last 7 days)
   - Keep it concise (3-4 lines)

4. Update existing tests:
   - Mock MetricsTracker in WaveExecutor tests
   - Mock MetricsTracker in StateManager tests
   - Verify recordWaveExecution called correctly
   - Verify recordCheckpoint called correctly
   - Tests should still pass with metrics integration

5. Handle errors gracefully:
   - If metrics recording fails, log warning but don't block execution
   - Metrics are nice-to-have, not critical path
   - Try-catch around metrics calls

WHY:
- Seamless integration (no user action required)
- Automatic tracking (no manual recording)
- Non-blocking (execution continues if metrics fail)
- Backward compatible (existing tests still pass)
</action>
<verify>
# Test WaveExecutor still works with metrics
npm test -- test/utils/wave-executor.test.js

# Test StateManager still works with metrics
npm test -- test/utils/state-manager.test.js

# Test metrics are recorded during execution
npm test

# Verify METRICS.md created during test execution
ls -la .planning/METRICS.md 2>/dev/null || echo "METRICS.md not in root (expected)"
</verify>
<done>
- MetricsTracker integrated into WaveExecutor
- Wave completion records metrics
- Wave failure records metrics
- MetricsTracker integrated into StateManager
- Checkpoint creation records metrics
- All existing tests still pass
- Metrics recording is non-blocking
- Error handling prevents execution failures
- Metrics visible in STATE.md summary
</done>
</task>

## Success Criteria
- ✅ MetricsTracker stores data in .planning/METRICS.md
- ✅ Wave executions tracked with duration, status, commits
- ✅ Checkpoints tracked with references
- ✅ Aggregate metrics calculated accurately
- ✅ Historical trends analyzed over time periods
- ✅ Integration with WaveExecutor and StateManager seamless
- ✅ 35+ tests pass with full coverage
- ✅ Performance targets met (<100ms save, <200ms summary)
- ✅ Non-blocking integration (failures don't stop execution)

## Verification
```bash
# Run metrics tests
npm test -- test/utils/metrics-tracker.test.js

# Test integration
npm test

# Verify metrics file created
cat .planning/METRICS.md

# Check metrics summary
node -e "const {MetricsTracker} = require('./lib/utils/metrics-tracker'); const t = new MetricsTracker(); console.log(JSON.stringify(t.getMetricsSummary(), null, 2))"
```
