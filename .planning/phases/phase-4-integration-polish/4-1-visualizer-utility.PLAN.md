# Plan: 4-1 - Visualizer Utility & Commands

## Objective
Create visualizer utility for ASCII charts and implement analyze/visualize commands for execution history and progress visualization.

## Context
Phase 3 created plan-validator, metrics-tracker, and plan-optimizer utilities with validate/optimize commands (271 tests passing). We now need visualization capabilities to make metrics actionable and provide better progress feedback.

Links:
- Phase 3 Plan 3-4 (visualizer) was planned but not executed
- Phase 3 Plan 3-5 (analyze/visualize commands) was planned but not executed
- metrics-tracker.js already tracks execution history and metrics
- state-manager.js tracks wave progress and checkpoints

## Dependencies
- None (independent implementation)

## Wave Assignment
**Wave 1** (no dependencies)

## Tasks

<task type="auto">
<name>Create visualizer.js utility with ASCII chart capabilities</name>
<files>lib/utils/visualizer.js, test/visualizer.test.js</files>
<action>
Create lib/utils/visualizer.js with the following features:

**Chart Types:**
1. Bar Chart - horizontal bars for metric comparison
2. Timeline - show execution history over time
3. Progress Bar - simple percentage-based progress
4. Distribution - histogram-style metric distribution
5. Table - formatted text table for structured data

**Core Functions:**
- `createBarChart(data, options)` - horizontal bars with labels and values
  - data: [{label, value}] 
  - options: {width, showValues, maxValue, colors}
  - Use chalk for color-coding (green for high, yellow for medium, red for low)
  
- `createTimeline(events, options)` - chronological event display
  - events: [{timestamp, label, status}]
  - options: {width, showDates, groupBy}
  - Show timestamps, event names, and status indicators (✓, ✗, ⧗)
  
- `createProgressBar(current, total, options)` - visual progress indicator
  - options: {width, showPercent, style: 'bar'|'blocks'|'dots'}
  - Include percentage and ETA if available
  
- `createDistribution(data, options)` - histogram for metric ranges
  - data: [values] (array of numbers)
  - options: {bins, width, showStats}
  - Show mean, median, min/max
  
- `createTable(headers, rows, options)` - formatted text table
  - headers: [strings]
  - rows: [[values]]
  - options: {alignments, borders, columnWidths}

**Utilities:**
- `formatDuration(ms)` - convert milliseconds to human-readable (e.g., "2h 15m")
- `formatTimestamp(date)` - consistent timestamp formatting
- `truncateText(text, maxLength)` - smart truncation with ellipsis
- `colorizeStatus(status)` - apply chalk colors based on status
- `calculateStats(values)` - mean, median, std dev, min/max

**Implementation notes:**
- Use chalk for colors (already in dependencies)
- Default width: 60 characters (terminal-safe)
- Support both light and dark terminal themes
- All functions should handle empty data gracefully
- Include JSDoc comments for all public functions

**Example output:**
```
Bar Chart:
Wave 1  ████████████████████ 45 tasks
Wave 2  ████████████ 28 tasks
Wave 3  ████████ 19 tasks

Timeline:
2024-01-18 10:00 ✓ Phase 1 Complete
2024-01-18 11:30 ✓ Phase 2 Complete
2024-01-18 14:00 ⧗ Phase 3 In Progress

Progress: [████████████░░░░░░░░] 60% (12/20 waves)
```
</action>
<verify>
node -e "const v = require('./lib/utils/visualizer.js'); console.log(v.createProgressBar(6, 10)); console.log(v.createBarChart([{label:'Test', value:50}]));"

npm test -- test/visualizer.test.js
</verify>
<done>
- visualizer.js exports all chart creation functions
- All chart types render correctly with sample data
- Edge cases handled (empty data, zero values, long labels)
- 25+ tests passing covering all chart types and utilities
- No errors with npm test
</done>
</task>

<task type="auto">
<name>Implement analyze command for execution history and metrics</name>
<files>lib/commands/analyze.js, test/commands/analyze.test.js</files>
<action>
Create lib/commands/analyze.js to display execution history and metrics analysis.

**Command signature:**
```
reis analyze [options]

Options:
  --type <type>     Analysis type: waves|tasks|timeline|performance|all (default: all)
  --period <days>   Limit to last N days (default: all time)
  --format <fmt>    Output format: text|json (default: text)
  --detailed        Show detailed breakdown
```

**Features:**

1. **Wave Analysis** (--type waves)
   - Total waves executed
   - Success/failure rate bar chart
   - Average wave duration
   - Waves by size (small/medium/large) distribution
   - Top 5 longest waves

2. **Task Analysis** (--type tasks)
   - Total tasks completed
   - Task completion rate
   - Average task duration
   - Tasks by type distribution
   - Common failure patterns

3. **Timeline Analysis** (--type timeline)
   - Chronological execution history
   - Show checkpoints and milestones
   - Highlight deviations and failures
   - Phase completion markers

4. **Performance Analysis** (--type performance)
   - Execution velocity (tasks/day)
   - Trend analysis (improving/declining)
   - Bottleneck identification
   - Checkpoint frequency

5. **All Analysis** (--type all, default)
   - Summary of all above categories
   - Key insights and recommendations
   - Overall project health score

**Data Sources:**
- Use metrics-tracker.js to load execution history
- Use state-manager.js for current state and checkpoints
- Use git-integration.js for commit history correlation

**Output format:**
- Use visualizer.js for all charts and progress bars
- Colorized output using chalk
- JSON format option for programmatic access
- Group related metrics with clear headers

**Implementation:**
```javascript
const { loadConfig } = require('../utils/config.js');
const MetricsTracker = require('../utils/metrics-tracker.js');
const StateManager = require('../utils/state-manager.js');
const visualizer = require('../utils/visualizer.js');

async function analyzeCommand(options) {
  const config = await loadConfig();
  const metrics = new MetricsTracker(config);
  const state = new StateManager(config);
  
  // Load data
  const history = await metrics.getExecutionHistory(options.period);
  const currentState = await state.getState();
  
  // Generate analysis based on type
  if (options.type === 'all' || options.type === 'waves') {
    // Show wave analysis with bar charts
  }
  
  // ... other analysis types
  
  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    // Pretty text output with visualizations
  }
}
```

**Error handling:**
- Gracefully handle missing metrics data
- Show helpful message if no execution history exists
- Validate --type and --format options

</action>
<verify>
# Create test metrics data
node -e "const mt = require('./lib/utils/metrics-tracker.js'); const m = new mt({metricsDir: './.reis/metrics'}); m.recordWaveStart('test-1', 1); m.recordWaveComplete('test-1', 1, 'success');"

# Test analyze command
node bin/reis.js analyze
node bin/reis.js analyze --type waves
node bin/reis.js analyze --type performance
node bin/reis.js analyze --format json

# Run tests
npm test -- test/commands/analyze.test.js
</verify>
<done>
- analyze command registered in bin/reis.js
- All analysis types render correctly with visualizations
- JSON output format works
- Handles empty metrics gracefully
- 20+ tests passing for all command options
- Command integrates with metrics-tracker and visualizer
</done>
</task>

<task type="auto">
<name>Implement visualize command for progress visualization</name>
<files>lib/commands/visualize.js, test/commands/visualize.test.js</files>
<action>
Create lib/commands/visualize.js to provide real-time progress visualization.

**Command signature:**
```
reis visualize [options]

Options:
  --type <type>     Visualization: progress|waves|roadmap|metrics (default: progress)
  --watch           Auto-refresh every 5 seconds
  --compact         Compact output mode
  --no-color        Disable colors
```

**Visualization Types:**

1. **Progress** (--type progress, default)
   - Overall project progress bar
   - Current phase/wave status
   - Recent activity timeline (last 5 events)
   - Next steps preview
   - Estimated completion (if available)

2. **Waves** (--type waves)
   - All waves in current phase
   - Wave status indicators (✓ complete, ⧗ in progress, ○ pending, ✗ failed)
   - Task count per wave
   - Wave execution timeline
   - Dependencies visualization

3. **Roadmap** (--type roadmap)
   - All phases with status
   - Phase progress bars
   - Milestone markers
   - Critical path visualization

4. **Metrics** (--type metrics)
   - Key metrics dashboard
   - Success rate gauge
   - Velocity trend chart
   - Recent performance indicators

**Watch Mode:**
- When --watch enabled, clear screen and refresh every 5 seconds
- Show "Last updated: [timestamp]" at bottom
- Ctrl+C to exit
- Use ANSI escape codes for screen clearing

**Output format:**
```
╔════════════════════════════════════════════════════════════╗
║              REIS v2.0 - Project Progress                  ║
╚════════════════════════════════════════════════════════════╝

Phase 3: Advanced Features [████████████████████░] 85%

Current Wave: Wave 3-6 (Integration Testing)
Status: IN_PROGRESS
Progress: [████████░░░░░░░░] 2/4 tasks complete

Recent Activity:
  2024-01-18 14:23 ✓ Completed plan-optimizer tests
  2024-01-18 14:15 ✓ Completed metrics-tracker tests
  2024-01-18 13:45 ⧗ Started integration testing

Next Steps:
  → Complete integration test suite
  → Run full test battery
  → Update documentation

Metrics:
  Waves Completed: 5/6 (83%)
  Tasks Completed: 18/24 (75%)
  Success Rate: 100%
  Avg Wave Duration: 45 min
```

**Implementation:**
```javascript
const { loadConfig } = require('../utils/config.js');
const StateManager = require('../utils/state-manager.js');
const MetricsTracker = require('../utils/metrics-tracker.js');
const visualizer = require('../utils/visualizer.js');
const fs = require('fs').promises;

async function visualizeCommand(options) {
  const config = await loadConfig();
  const state = new StateManager(config);
  const metrics = new MetricsTracker(config);
  
  async function render() {
    const currentState = await state.getState();
    const recentMetrics = await metrics.getRecentMetrics(10);
    
    // Generate visualization based on type
    if (options.type === 'progress') {
      displayProgress(currentState, recentMetrics, options);
    }
    // ... other types
  }
  
  if (options.watch) {
    setInterval(async () => {
      console.clear();
      await render();
      console.log(`\nLast updated: ${new Date().toLocaleTimeString()}`);
    }, 5000);
  } else {
    await render();
  }
}
```

**Key features:**
- Use visualizer.js for all charts and bars
- Color-coded status indicators
- Box drawing characters for borders (╔═╗║╚╝)
- Compact mode removes borders and extra spacing
- Watch mode updates automatically
</action>
<verify>
# Test visualize command with different types
node bin/reis.js visualize
node bin/reis.js visualize --type waves
node bin/reis.js visualize --type roadmap
node bin/reis.js visualize --type metrics
node bin/reis.js visualize --compact
node bin/reis.js visualize --no-color

# Test watch mode (run in background and kill after 15 seconds)
timeout 15 node bin/reis.js visualize --watch || true

# Run tests
npm test -- test/commands/visualize.test.js
</verify>
<done>
- visualize command registered in bin/reis.js
- All visualization types render correctly
- Watch mode works and updates every 5 seconds
- Compact and no-color modes work
- Box drawing characters display properly
- 20+ tests passing for all command options
- Graceful handling of missing state/metrics data
</done>
</task>

## Success Criteria
- visualizer.js utility created with 5+ chart types
- analyze command shows comprehensive execution analysis
- visualize command provides real-time progress visualization
- All visualization features use consistent formatting
- 65+ new tests passing (25 visualizer + 20 analyze + 20 visualize)
- Commands integrated into bin/reis.js
- Color-coded, terminal-friendly output

## Verification
```bash
# Test visualizer utility
npm test -- test/visualizer.test.js

# Test commands
npm test -- test/commands/analyze.test.js
npm test -- test/commands/visualize.test.js

# Manual testing
node bin/reis.js analyze
node bin/reis.js visualize --type progress
node bin/reis.js visualize --watch

# Full test suite
npm test
# Should show ~336 tests passing (271 + 65 new)
```
