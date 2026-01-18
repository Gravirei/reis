# Plan: 3-4 - Progress Visualizer

## Objective
Create visualizer utility for ASCII-based progress visualization, charts, and execution dashboards.

## Context
- CLI-based tool needs terminal-friendly visualizations
- ASCII charts for metrics trends
- Progress bars for wave execution
- Dashboard view for overall project status
- Keep dependencies minimal (avoid heavy charting libraries)
- Used by analyze, visualize, and execute-plan commands

## Dependencies
Depends on Plan 3-2 (metrics-tracker) - needs metrics data to visualize

## Tasks

<task type="auto">
<name>Create visualizer utility with ASCII charts and progress bars</name>
<files>lib/utils/visualizer.js</files>
<action>
Create visualizer.js utility for terminal visualization:

1. Module exports:
   - Visualizer class - main visualizer
   - renderProgressBar(current, total, width) - progress bar
   - renderBarChart(data, options) - ASCII bar chart
   - renderTrendChart(data, options) - ASCII line chart
   - renderTable(data, columns) - formatted table
   - renderDashboard(summary) - full status dashboard

2. Progress bar rendering:
   ```javascript
   renderProgressBar(current, total, width = 40) {
     const percent = Math.round((current / total) * 100);
     const filled = Math.round((current / total) * width);
     const empty = width - filled;
     return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${percent}% (${current}/${total})`;
   }
   // Output: [████████████████            ] 60% (3/5)
   ```

3. Bar chart for metrics:
   ```javascript
   renderBarChart(data, options = {}) {
     // data = [{label: 'Wave 1', value: 15}, {label: 'Wave 2', value: 28}, ...]
     // Options: title, maxValue, width, showValues
     // Output:
     // Wave Durations (minutes)
     // Wave 1  ████████        15m
     // Wave 2  ██████████████  28m
     // Wave 3  ██████          12m
   }
   ```

4. Trend chart for historical data:
   ```javascript
   renderTrendChart(data, options = {}) {
     // data = [{date: '2026-01-15', value: 23}, ...]
     // Options: title, height, width
     // Output:
     // Success Rate (Last 30 Days)
     // 100% ┤     ╭─╮
     //  90% ┤   ╭─╯ ╰╮
     //  80% ┤ ╭─╯    ╰─╮
     //  70% ┼─────────────
     //      └─────────────
     //      Jan15    Jan18
   }
   ```

5. Table rendering:
   ```javascript
   renderTable(data, columns) {
     // data = [{wave: 'Wave 1', duration: '15m', status: '✓'}, ...]
     // columns = [{key: 'wave', label: 'Wave', width: 20}, ...]
     // Output:
     // ┌──────────────────┬──────────┬────────┐
     // │ Wave             │ Duration │ Status │
     // ├──────────────────┼──────────┼────────┤
     // │ Wave 1: Setup    │ 15m      │ ✓      │
     // │ Wave 2: Commands │ 28m      │ ✓      │
     // └──────────────────┴──────────┴────────┘
   }
   ```

6. Dashboard rendering:
   ```javascript
   renderDashboard(summary) {
     // Full project status dashboard
     // ┌─────────────────────────────────────────┐
     // │  REIS Project Status                     │
     // ├─────────────────────────────────────────┤
     // │  Phase: Phase 2 - Command Enhancement   │
     // │  Progress: [████████████      ] 60%     │
     // │  Waves: 3/5 completed                   │
     // │  Success Rate: 94.2%                    │
     // │  Avg Duration: 23m                      │
     // ├─────────────────────────────────────────┤
     // │  Recent Activity:                       │
     // │  • Wave 3 completed (28m) - 2h ago      │
     // │  • Checkpoint created - 3h ago          │
     // ├─────────────────────────────────────────┤
     // │  Next Steps:                            │
     // │  1. Resume Wave 4: Testing              │
     // │  2. Review checkpoint history           │
     // └─────────────────────────────────────────┘
   }
   ```

7. Execution progress display:
   - Real-time wave execution progress
   - Task completion indicators
   - Duration tracking
   - ETA calculation based on historical data
   ```
   Executing Wave 2: Commands
   ──────────────────────────
   [████████                  ] 40% (2/5 tasks)
   
   ✓ Task 1: Create execute-plan.js (5m)
   ✓ Task 2: Add tests (8m)
   ⧗ Task 3: Integration... (3m elapsed)
   ○ Task 4: Documentation
   ○ Task 5: Manual verification
   
   Elapsed: 16m | ETA: 14m | Total: ~30m
   ```

8. Chart utilities:
   - Auto-scale values to fit terminal width
   - Handle empty data gracefully
   - Color support using chalk (already a dependency)
   - Unicode box-drawing characters for clean look
   - Responsive to terminal size (detect with process.stdout.columns)

9. Helper functions:
   - truncateText(text, maxLength) - ellipsis for long text
   - formatDuration(minutes) - human-readable duration
   - formatTimestamp(date) - relative time (2h ago)
   - alignText(text, width, align) - left/right/center alignment

WHY avoid certain approaches:
- Don't use heavy dependencies (cli-table3, blessed, etc.) - keep it simple
- Don't require terminal emulator features (keep compatibility high)
- Don't use complex animations (can cause rendering issues)
- Don't assume color support (graceful degradation for no-color terminals)
</action>
<verify>
# Test visualizer loads
node -e "const v = require('./lib/utils/visualizer'); const viz = new v.Visualizer(); console.log('OK')"

# Test progress bar
node -e "const {Visualizer} = require('./lib/utils/visualizer'); const viz = new Visualizer(); console.log(viz.renderProgressBar(3, 5))"

# Test bar chart
node -e "const {Visualizer} = require('./lib/utils/visualizer'); const viz = new Visualizer(); const data = [{label: 'W1', value: 15}, {label: 'W2', value: 28}]; console.log(viz.renderBarChart(data, {title: 'Wave Durations'}))"
</verify>
<done>
- Visualizer class created
- Progress bar rendering works
- Bar chart rendering works
- Trend chart rendering works
- Table rendering works
- Dashboard rendering works
- Execution progress display works
- Auto-scales to terminal width
- Color support with graceful degradation
- Unicode box-drawing for clean output
</done>
</task>

<task type="auto">
<name>Create tests for visualizer</name>
<files>test/utils/visualizer.test.js</files>
<action>
Create comprehensive test suite for visualizer:

1. Test progress bar rendering:
   - Various percentages (0%, 50%, 100%)
   - Different widths (20, 40, 80)
   - Edge cases (0/0, 5/5, 1/100)
   - Output format correct
   - Unicode characters render

2. Test bar chart rendering:
   - Empty data → returns empty message
   - Single bar
   - Multiple bars with different values
   - Auto-scaling to max value
   - Label truncation for long labels
   - Optional value display
   - Title rendering

3. Test trend chart rendering:
   - Time series data (dates + values)
   - Auto-scaling Y-axis
   - Line rendering with Unicode
   - Sparse data (gaps in timeline)
   - Single data point
   - Empty data

4. Test table rendering:
   - Empty table
   - Single row
   - Multiple rows
   - Column alignment (left/right/center)
   - Column width enforcement
   - Text truncation in columns
   - Unicode box-drawing

5. Test dashboard rendering:
   - Full dashboard with all sections
   - Missing sections (graceful handling)
   - Long text in sections
   - Progress bar in dashboard
   - Recent activity list
   - Next steps list

6. Test execution progress display:
   - Task list with various statuses (✓, ⧗, ○)
   - Duration tracking
   - ETA calculation
   - Progress bar integration
   - Updates over time (mock time progression)

7. Test helper functions:
   - truncateText various lengths
   - formatDuration (minutes → human readable)
   - formatTimestamp (date → relative time)
   - alignText (left/right/center)

8. Test terminal width adaptation:
   - Mock different terminal widths (80, 120, 160)
   - Charts scale appropriately
   - No overflow past terminal width
   - Minimum width handling (small terminals)

9. Test color handling:
   - With color support (chalk enabled)
   - Without color support (NO_COLOR env)
   - Color codes don't affect layout
   - Graceful degradation

10. Test Unicode handling:
    - Box-drawing characters render correctly
    - Progress bar characters (█)
    - Chart characters (╭╮╰╯─│)
    - Fallback for non-Unicode terminals (optional)

11. Test with real data:
    - Use sample metrics data
    - Render dashboard with StateManager data
    - Render charts with MetricsTracker data
    - Verify output is readable and useful

12. Test performance:
    - Rendering <10ms for typical visualizations
    - Large datasets (100+ data points) <100ms
    - No memory leaks with repeated renders

Use mocha/assert pattern.
Test both output format and content.
Mock terminal width for consistency.
Clean up after tests.
</action>
<verify>
npm test -- test/utils/visualizer.test.js
</verify>
<done>
- All tests pass (50+ test cases)
- Progress bar rendering fully tested
- Bar chart rendering fully tested
- Trend chart rendering fully tested
- Table rendering fully tested
- Dashboard rendering fully tested
- Helper functions fully tested
- Terminal width adaptation tested
- Color handling tested
- Unicode handling tested
- Real data rendering tested
- Performance benchmarks met
</done>
</task>

<task type="auto">
<name>Integrate visualizer with execute-plan for progress display</name>
<files>lib/commands/execute-plan.js</files>
<action>
Add progress visualization to execute-plan command:

1. Import Visualizer:
   ```javascript
   const { Visualizer } = require('../utils/visualizer');
   ```

2. Add visualization during plan parsing:
   - Show wave structure as table before execution
   ```
   📋 Plan Structure
   
   ┌────────┬─────────────────────┬───────┬──────────┐
   │ Wave   │ Description         │ Tasks │ Est Time │
   ├────────┼─────────────────────┼───────┼──────────┤
   │ Wave 1 │ Foundation Setup    │ 3     │ ~20m     │
   │ Wave 2 │ Command Development │ 5     │ ~35m     │
   │ Wave 3 │ Testing & Validation│ 4     │ ~25m     │
   └────────┴─────────────────────┴───────┴──────────┘
   
   Total: 3 waves, 12 tasks, estimated ~80m
   ```

3. Add progress bar during wave execution:
   - Update progress bar as tasks complete
   - Show current task with spinner/indicator
   - Display elapsed time and ETA
   ```javascript
   // During wave execution
   console.log(`\nWave ${waveNumber}: ${wave.name}`);
   console.log(visualizer.renderProgressBar(completedTasks, totalTasks));
   console.log(`Elapsed: ${elapsed}m | ETA: ${eta}m\n`);
   ```

4. Add summary visualization at end:
   - Bar chart of wave durations
   - Overall progress
   - Success summary
   ```
   ✨ Execution Complete!
   
   Wave Durations
   Wave 1  ████████████      18m
   Wave 2  ████████████████  32m
   Wave 3  ██████████        22m
   
   Total time: 72m (vs estimated 80m, 10% faster!)
   Success rate: 100%
   Commits: 3 auto-commits created
   ```

5. Add --progress flag options:
   - `--progress=simple` - basic text output (default)
   - `--progress=detailed` - full visualization with charts
   - `--progress=minimal` - just essential info
   - `--no-progress` - no progress display (for scripting)

6. Handle terminal size:
   - Detect terminal width
   - Scale visualizations appropriately
   - Fallback to simple text if terminal too narrow (<60 cols)

7. Update help text:
   - Document --progress flag options
   - Show example visualizations in help

WHY:
- Visual feedback improves user experience
- Progress indication reduces anxiety during long executions
- Charts make metrics actionable at a glance
- Optional flags allow customization for different use cases
</action>
<verify>
# Test visualization integration
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --dry-run

# Test different progress modes
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --progress=detailed --dry-run
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --progress=minimal --dry-run

# Verify help text updated
node bin/reis.js execute-plan --help | grep progress
</verify>
<done>
- Visualizer integrated into execute-plan
- Plan structure displayed as table
- Progress bar shows during execution
- Wave durations displayed as chart
- Summary visualization at completion
- --progress flag with multiple modes
- Terminal width detection works
- Help text updated
- User experience significantly improved
</done>
</task>

## Success Criteria
- ✅ Visualizer renders progress bars, charts, tables, dashboards
- ✅ ASCII-based visualizations work in any terminal
- ✅ Auto-scales to terminal width
- ✅ Color support with graceful degradation
- ✅ 50+ tests pass with comprehensive coverage
- ✅ Integration with execute-plan enhances UX
- ✅ Performance <10ms for typical renders
- ✅ Multiple progress modes for different use cases
- ✅ Output is clean, professional, and informative

## Verification
```bash
# Run visualizer tests
npm test -- test/utils/visualizer.test.js

# Test visualizations
node -e "const {Visualizer} = require('./lib/utils/visualizer'); const viz = new Visualizer(); console.log(viz.renderProgressBar(7, 10, 50)); console.log(viz.renderBarChart([{label: 'Test', value: 42}]))"

# Test integrated visualization
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --progress=detailed --dry-run

# Run all tests
npm test
```
