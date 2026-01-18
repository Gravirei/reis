# Plan: 4-4 - Polish & UX Improvements

## Objective
Improve error messages, add progress indicators, enhance color-coded output, and polish user experience across all commands.

## Context
REIS v2.0 has all core functionality but needs UX polish to make it delightful to use. Error messages should be helpful, progress should be visible, and output should be scannable.

Areas needing improvement:
- Generic error messages
- No progress feedback during long operations
- Inconsistent color usage
- Minimal help text

## Dependencies
- Wave 1 complete (visualizer provides color utilities)
- Wave 2 complete (integration tests validate UX improvements)
- Wave 3 complete (documentation references improved UX)

## Wave Assignment
**Wave 4** (depends on Waves 1-3)

## Tasks

<task type="auto">
<name>Improve error messages across all commands with actionable guidance</name>
<files>lib/utils/command-helpers.js, lib/commands/*.js</files>
<action>
Enhance error handling across all commands to provide clear, actionable error messages.

**Error Message Principles:**
1. **What happened** - Clear description of the error
2. **Why it happened** - Root cause if known
3. **How to fix it** - Specific actions user can take
4. **Related commands** - Suggest helpful commands

**Error Categories:**

1. **File Not Found Errors**
```javascript
// Before:
throw new Error('PLAN.md not found');

// After:
throw new Error(`
❌ PLAN.md not found

The plan file doesn't exist at the expected location.

Possible causes:
  • Wrong directory - are you in the project root?
  • File not created yet
  • Incorrect file path

Try this:
  $ cd /path/to/project
  $ reis new          # Create project structure
  $ ls .planning/     # Verify files exist

Need help? Run: reis --help
`);
```

2. **Validation Errors**
```javascript
// Before:
throw new Error('Invalid wave format');

// After:
throw new Error(`
❌ Invalid wave format in PLAN.md

Wave annotations must follow this format:
  <!-- WAVE 1: SMALL -->
  ...
  <!-- /WAVE 1 -->

Found on line 42: <!-- WAVE 1 SMALL --> (missing colon)

Fix it:
  $ reis validate PLAN.md    # See all validation errors
  
Documentation: https://github.com/Gravirei/reis#wave-annotations
`);
```

3. **Git Errors**
```javascript
// After:
throw new Error(`
❌ Git repository not clean

You have uncommitted changes:
  M  lib/utils/config.js
  ?? temp-file.txt

REIS requires a clean working tree for checkpoints.

Fix it:
  $ git add -A && git commit -m "WIP"
  # or
  $ git stash
  
Then retry: reis execute-plan PLAN.md

To disable this check, add to reis.config.js:
  git: { requireClean: false }
`);
```

4. **Configuration Errors**
```javascript
// After:
throw new Error(`
❌ Invalid configuration in reis.config.js

Error: waves.small must be a positive number
Found: waves.small = "2" (string instead of number)

Fix in reis.config.js:
  waves: {
    small: 2,  // Remove quotes
    medium: 5,
    large: 10
  }

View current config: reis config list
`);
```

**Implementation in lib/utils/command-helpers.js:**
```javascript
/**
 * Enhanced error formatting utilities
 */

function showError(message, context = {}) {
  const chalk = require('chalk');
  
  console.error(chalk.red('❌ Error\n'));
  console.error(message);
  
  if (context.suggestion) {
    console.error(chalk.yellow('\n💡 Suggestion:'));
    console.error(context.suggestion);
  }
  
  if (context.docs) {
    console.error(chalk.blue('\n📚 Docs:'), context.docs);
  }
}

function createFileNotFoundError(filename, suggestions = []) {
  return `File not found: ${filename}

Possible solutions:
${suggestions.map(s => `  • ${s}`).join('\n')}

Current directory: ${process.cwd()}
`;
}

function createValidationError(file, errors) {
  return `Validation failed for ${file}

Found ${errors.length} issue(s):
${errors.map((e, i) => `  ${i + 1}. ${e.message} (line ${e.line})`).join('\n')}

Fix these issues and run: reis validate ${file}
`;
}

module.exports = {
  showError,
  createFileNotFoundError,
  createValidationError
};
```

**Update all commands to use enhanced error messages:**
- execute-plan.js
- checkpoint.js
- resume.js
- validate.js
- optimize.js
- analyze.js
- visualize.js
- config.js

**Testing:**
Create test/error-messages.test.js to verify error quality:
```javascript
describe('Error Messages', () => {
  it('should provide actionable file not found error', () => {
    // Trigger error and verify message quality
  });
  
  it('should include fix suggestions in validation errors', () => {
    // Test validation error messages
  });
});
```
</action>
<verify>
# Test error messages by triggering various errors
node bin/reis.js execute-plan nonexistent.PLAN.md 2>&1 | grep -q "Possible causes" && echo "✓ File not found error improved"
node bin/reis.js validate test/fixtures/invalid-plan.md 2>&1 | grep -q "Fix these issues" && echo "✓ Validation error improved"

# Run error message tests
npm test -- test/error-messages.test.js
</verify>
<done>
- command-helpers.js enhanced with error formatting utilities
- All commands updated with actionable error messages
- Error messages include what/why/how-to-fix structure
- Suggestions and documentation links included
- 15+ tests for error message quality
- All errors are user-friendly and helpful
</done>
</task>

<task type="auto">
<name>Add progress indicators for long-running operations</name>
<files>lib/utils/progress-indicator.js, lib/commands/execute-plan.js, lib/commands/analyze.js, lib/commands/optimize.js</files>
<action>
Create progress indicator utility and integrate into long-running operations.

**Create lib/utils/progress-indicator.js:**
```javascript
const chalk = require('chalk');

class ProgressIndicator {
  constructor(total, label = 'Progress') {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.startTime = Date.now();
    this.interval = null;
  }
  
  start() {
    this.render();
    this.interval = setInterval(() => this.render(), 100);
  }
  
  update(current, message = '') {
    this.current = current;
    this.message = message;
    this.render();
  }
  
  increment(message = '') {
    this.update(this.current + 1, message);
  }
  
  complete(message = 'Complete') {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.current = this.total;
    this.message = message;
    this.render();
    console.log(); // New line after completion
  }
  
  render() {
    const percent = Math.floor((this.current / this.total) * 100);
    const barWidth = 30;
    const filled = Math.floor((this.current / this.total) * barWidth);
    const empty = barWidth - filled;
    
    const bar = chalk.green('█'.repeat(filled)) + 
                chalk.gray('░'.repeat(empty));
    
    const elapsed = Date.now() - this.startTime;
    const rate = this.current / (elapsed / 1000);
    const remaining = rate > 0 ? (this.total - this.current) / rate : 0;
    
    const eta = remaining > 0 ? ` ETA: ${Math.ceil(remaining)}s` : '';
    
    process.stdout.write('\r' + 
      `${this.label}: [${bar}] ${percent}% (${this.current}/${this.total})${eta} ${this.message || ''}`
    );
  }
}

class SpinnerIndicator {
  constructor(message = 'Working...') {
    this.message = message;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.current = 0;
    this.interval = null;
  }
  
  start() {
    this.interval = setInterval(() => {
      this.current = (this.current + 1) % this.frames.length;
      process.stdout.write('\r' + 
        chalk.cyan(this.frames[this.current]) + ' ' + this.message
      );
    }, 80);
  }
  
  update(message) {
    this.message = message;
  }
  
  stop(finalMessage = '') {
    if (this.interval) {
      clearInterval(this.interval);
    }
    process.stdout.write('\r' + chalk.green('✓') + ' ' + (finalMessage || this.message) + '\n');
  }
}

module.exports = {
  ProgressIndicator,
  SpinnerIndicator
};
```

**Integrate into execute-plan command:**
```javascript
const { ProgressIndicator } = require('../utils/progress-indicator');

async function executeCommand(planFile, options) {
  const waves = await executor.parsePlan(planFile);
  
  console.log(chalk.blue(`\n📋 Executing ${waves.length} waves from ${planFile}\n`));
  
  const progress = new ProgressIndicator(waves.length, 'Overall Progress');
  progress.start();
  
  for (let i = 0; i < waves.length; i++) {
    progress.update(i, `Wave ${i + 1}: ${waves[i].name}`);
    await executor.executeWave(waves[i]);
    progress.increment(`✓ Wave ${i + 1} complete`);
  }
  
  progress.complete('All waves complete! 🎉');
}
```

**Integrate into analyze command:**
```javascript
const { SpinnerIndicator } = require('../utils/progress-indicator');

async function analyzeCommand(options) {
  const spinner = new SpinnerIndicator('Loading execution history...');
  spinner.start();
  
  const history = await metrics.loadHistory();
  spinner.update('Analyzing metrics...');
  
  const analysis = await analyzeMetrics(history);
  spinner.update('Generating report...');
  
  const report = await generateReport(analysis);
  spinner.stop('Analysis complete');
  
  console.log(report);
}
```

**Add progress to optimize command:**
```javascript
const { ProgressIndicator } = require('../utils/progress-indicator');

async function optimizeCommand(planFile, options) {
  console.log(chalk.blue('🔍 Analyzing plan for optimizations...\n'));
  
  const steps = [
    'Parsing plan structure',
    'Analyzing dependencies',
    'Identifying parallelization opportunities',
    'Calculating wave sizes',
    'Generating optimized plan'
  ];
  
  const progress = new ProgressIndicator(steps.length, 'Optimization');
  progress.start();
  
  for (let i = 0; i < steps.length; i++) {
    progress.update(i, steps[i]);
    await performStep(i);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
    progress.increment();
  }
  
  progress.complete('Optimization complete');
}
```

**Testing:**
Create test/progress-indicator.test.js:
```javascript
describe('ProgressIndicator', () => {
  it('should render progress bar correctly', () => {
    const progress = new ProgressIndicator(10, 'Test');
    progress.start();
    progress.update(5);
    progress.complete();
  });
  
  it('should calculate ETA', () => {
    // Test ETA calculation
  });
});
```
</action>
<verify>
# Test progress indicators
node bin/reis.js execute-plan examples/small-feature/.planning/phases/*/1-1-*.PLAN.md 2>&1 | grep -q "Overall Progress" && echo "✓ Progress indicator working"

# Test spinner
node bin/reis.js analyze 2>&1 | grep -q "✓" && echo "✓ Spinner indicator working"

# Run tests
npm test -- test/progress-indicator.test.js
</verify>
<done>
- progress-indicator.js utility created with ProgressIndicator and SpinnerIndicator classes
- execute-plan shows progress bar during wave execution
- analyze shows spinner during analysis
- optimize shows progress during optimization steps
- All long operations provide visual feedback
- Progress bars show ETA when possible
- 10+ tests for progress indicators
</done>
</task>

<task type="auto">
<name>Enhance color-coded output and visual consistency</name>
<files>lib/utils/output-formatter.js, lib/commands/*.js</files>
<action>
Create consistent color scheme and formatting across all command output.

**Color Scheme Standards:**
- 🔵 Blue: Informational messages, headers
- 🟢 Green: Success, completion, checkmarks
- 🟡 Yellow: Warnings, suggestions, attention needed
- 🔴 Red: Errors, failures
- ⚪ Gray: Secondary info, timestamps, metadata
- 🟣 Magenta: Highlights, important metrics
- 🔵 Cyan: Interactive prompts, loading states

**Create lib/utils/output-formatter.js:**
```javascript
const chalk = require('chalk');

const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  arrow: '→',
  bullet: '•',
  checkbox: '☑',
  pending: '⧗'
};

const colors = {
  header: chalk.blue.bold,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  muted: chalk.gray,
  highlight: chalk.magenta.bold,
  code: chalk.yellow
};

function formatHeader(text) {
  const line = '═'.repeat(60);
  return colors.header(`\n${line}\n${text}\n${line}\n`);
}

function formatSection(title) {
  return colors.info(`\n${title}\n${'─'.repeat(title.length)}\n`);
}

function formatSuccess(message) {
  return colors.success(`${symbols.success} ${message}`);
}

function formatError(message) {
  return colors.error(`${symbols.error} ${message}`);
}

function formatWarning(message) {
  return colors.warning(`${symbols.warning} ${message}`);
}

function formatList(items, indent = 2) {
  const prefix = ' '.repeat(indent);
  return items.map(item => `${prefix}${symbols.bullet} ${item}`).join('\n');
}

function formatKeyValue(key, value, keyWidth = 20) {
  const paddedKey = key.padEnd(keyWidth);
  return `${colors.muted(paddedKey)} ${value}`;
}

function formatMetric(label, value, unit = '', good = null) {
  let coloredValue = value;
  if (good !== null) {
    coloredValue = good ? colors.success(value) : colors.error(value);
  } else {
    coloredValue = colors.highlight(value);
  }
  return formatKeyValue(label, `${coloredValue}${unit}`);
}

function formatTable(headers, rows, alignments = []) {
  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxContent = Math.max(...rows.map(r => String(r[i]).length));
    return Math.max(h.length, maxContent);
  });
  
  // Format header
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join(' │ ');
  const separator = widths.map(w => '─'.repeat(w)).join('─┼─');
  
  // Format rows
  const formattedRows = rows.map(row => 
    row.map((cell, i) => String(cell).padEnd(widths[i])).join(' │ ')
  );
  
  return colors.header(headerRow) + '\n' + 
         colors.muted(separator) + '\n' + 
         formattedRows.join('\n');
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function formatTimestamp(date) {
  return colors.muted(new Date(date).toLocaleString());
}

function formatStatus(status) {
  const statusMap = {
    'success': colors.success(`${symbols.success} Success`),
    'failed': colors.error(`${symbols.error} Failed`),
    'in_progress': colors.warning(`${symbols.pending} In Progress`),
    'pending': colors.muted(`○ Pending`)
  };
  return statusMap[status] || status;
}

module.exports = {
  symbols,
  colors,
  formatHeader,
  formatSection,
  formatSuccess,
  formatError,
  formatWarning,
  formatList,
  formatKeyValue,
  formatMetric,
  formatTable,
  formatDuration,
  formatTimestamp,
  formatStatus
};
```

**Update all commands to use consistent formatting:**

Example for execute-plan.js:
```javascript
const fmt = require('../utils/output-formatter');

async function executeCommand(planFile) {
  console.log(fmt.formatHeader('REIS Wave Execution'));
  console.log(fmt.formatKeyValue('Plan file', planFile));
  console.log(fmt.formatKeyValue('Started', fmt.formatTimestamp(new Date())));
  
  const waves = await executor.parsePlan(planFile);
  console.log(fmt.formatKeyValue('Total waves', waves.length));
  
  console.log(fmt.formatSection('Execution Progress'));
  
  for (const wave of waves) {
    console.log(`\n${fmt.colors.info(`Wave ${wave.number}: ${wave.name}`)}`);
    // Execute wave
    console.log(fmt.formatSuccess(`Wave ${wave.number} complete`));
  }
  
  console.log(fmt.formatHeader('✓ Execution Complete'));
}
```

Example for visualize.js:
```javascript
const fmt = require('../utils/output-formatter');

function displayProgress(state) {
  console.log(fmt.formatHeader('REIS Project Progress'));
  
  console.log(fmt.formatSection('Current Status'));
  console.log(fmt.formatKeyValue('Phase', state.currentPhase));
  console.log(fmt.formatKeyValue('Wave', state.activeWave.name));
  console.log(fmt.formatKeyValue('Status', fmt.formatStatus(state.activeWave.status)));
  
  console.log(fmt.formatSection('Metrics'));
  console.log(fmt.formatMetric('Success Rate', `${state.metrics.successRate}%`, '', state.metrics.successRate >= 90));
  console.log(fmt.formatMetric('Avg Duration', fmt.formatDuration(state.metrics.avgDuration)));
  
  console.log(fmt.formatSection('Recent Activity'));
  console.log(fmt.formatList(state.recentActivity.slice(0, 5)));
}
```

**Testing:**
Test visual output in test/output-formatter.test.js
</action>
<verify>
npm test -- test/output-formatter.test.js

# Visual verification
node bin/reis.js visualize
node bin/reis.js analyze
node bin/reis.js execute-plan --help
</verify>
<done>
- output-formatter.js created with consistent formatting utilities
- All commands use consistent color scheme
- Visual hierarchy improved with headers, sections, and formatting
- Symbols used consistently across commands
- Tables, lists, and key-value pairs formatted uniformly
- 15+ tests for output formatting
- Commands have professional, scannable output
</done>
</task>

## Success Criteria
- All error messages provide clear what/why/how-to-fix guidance
- Progress indicators show during all long operations
- Consistent color scheme and formatting across all commands
- Visual output is scannable and professional
- 40+ new tests for UX improvements
- User experience is significantly improved

## Verification
```bash
# Test error messages
npm test -- test/error-messages.test.js

# Test progress indicators
npm test -- test/progress-indicator.test.js

# Test output formatting
npm test -- test/output-formatter.test.js

# Visual verification
node bin/reis.js execute-plan examples/small-feature/.planning/phases/*/1-1-*.PLAN.md
node bin/reis.js analyze
node bin/reis.js visualize --watch

# All tests
npm test
# Should show ~460+ tests passing
```
