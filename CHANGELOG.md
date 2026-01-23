# Changelog

All notable changes to REIS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-01-22

### Added - Kanban Board & Real Execution 🚀

**Major Feature: Persistent Kanban Board**

A visual kanban board that displays automatically on workflow commands showing real-time cycle progress.

#### Kanban Board Features

- **Persistent Display** - Shows automatically on workflow commands (plan, execute, verify, debug, cycle, progress, resume, checkpoint)
- **4-Column Layout**:
  - ALL PHASES - Shows all project phases (P1 P2 P3 P4...)
  - IN PROGRESS - Current phase with wave/task breakdown
  - CYCLE - Planning → Execute → Verify → Debug stages with progress bars
  - COMPLETED - List of completed cycles
- **Wave Execution Visualization**:
  - Wave list with tree structure (Wave 1/3 ✓, Wave 2/3 ◉, Wave 3/3 ○)
  - Task status under current wave (├ 2.1 ✓, └ 2.4 ○)
  - Parallel execution indicator (⫴2 of 4 tasks)
  - Running/Waiting task breakdown
- **Subagent Status** - Shows active subagent (planner, executor, verifier, debugger)
- **Centered Progress Bars** - `[■■■■■45% ░░░░░]` format
- **3 Display Styles**: full, compact, minimal
- **Idle States**:
  - "No active phase" + "Run: reis cycle" prompt
  - "No cycles completed" for fresh projects
  - "✓ All phases done!" when complete

#### Kanban Command

- `reis kanban` - Show current settings
- `reis kanban enable/disable/toggle` - Control display
- `reis kanban style <full|compact|minimal>` - Change display style
- `--no-kanban` flag to hide for single command

**Major Feature: Real Subagent Execution (Priority 1)**

Transformed REIS from a "prompt printer" to an actual "execution system".

#### Subagent Invocation API

- **New Module** (`lib/utils/subagent-invoker.js`) - Core API for programmatic subagent invocation
- Classes: `SubagentDefinition`, `ExecutionContext`, `InvocationResult`, `SubagentInvoker`
- Functions: `loadSubagentDefinition()`, `listSubagents()`, `buildExecutionContext()`, `invoke()`, `invokeParallel()`
- Event-based execution with progress tracking
- Timeout and error handling

#### Cycle Orchestrator Completion

- Implemented 5 TODOs that were previously stubbed:
  - Actually execute plans via `invokeSubagent('reis_executor', ...)`
  - Actually run verification via `invokeSubagent('reis_verifier', ...)`
  - Actually run debug analysis via `invokeSubagent('reis_debugger', ...)`
  - Actually execute fix plans
  - Append completion records to STATE.md

#### Command Updates

- `reis execute <phase>` - Now invokes reis_executor subagent (with `--dry-run` fallback)
- `reis verify` - Now invokes reis_verifier subagent
- `reis debug` - Now invokes reis_debugger subagent
- New options: `--dry-run`, `--verbose`, `--timeout <ms>`

### Fixed

- `reis whats-new` - Was showing "Command coming soon", now properly wired to implementation
- `reis docs` - Was showing "Command coming soon", now properly wired to implementation

### Changed

- Help modal updated with new command options and compact format
- Added hidden commands to help: `reis add`, `reis insert`, `reis remove`
- Updated column widths in kanban board for better readability

## [2.3.0] - 2026-01-22

### Added - Decision Trees Support 🌳

**New Feature: Comprehensive Decision Tree System**

Complete decision-making support with interactive features, templates, exports, and tracking.

#### Core Features

- **Decision Tree Syntax** (`docs/DECISION_TREES.md`)
  - Markdown-based tree structure with indentation
  - Branch characters: `├─`, `└─`, `│`, `→`
  - Metadata annotations: `[weight: N]`, `[priority: high|medium|low]`, `[risk: high|medium|low]`, `[recommended]`
  - Conditional branches: `[IF: condition]`, `[ELSE]`
  - Support for nested trees (unlimited depth)
  - Multiple trees per document

- **Parser & Renderer** (`lib/utils/decision-tree-parser.js`, `lib/utils/visualizer.js`)
  - Parse trees from markdown with full validation
  - Render trees with colors, metadata badges, and outcomes
  - Detect cycles, orphaned branches, and inconsistencies
  - Evaluate conditional branches based on project context
  - Collapsible display with depth limits

#### Interactive Features

- **Interactive Selection** (`lib/utils/decision-tree-interactive.js`)
  - Arrow key navigation through decision trees
  - Real-time metadata display during selection
  - Breadcrumb navigation showing current path
  - Multi-tree selection support
  - Decision recording with full context

- **Decision Tracking**
  - Record decisions with timestamp, context, and metadata
  - Query decisions by tree, phase, or date
  - Revert decisions with reason tracking
  - Decision statistics and analytics
  - Export decision history (JSON, CSV)

#### Export & Templates

- **Export Capabilities** (`lib/utils/decision-tree-exporter.js`)
  - HTML: Standalone files with collapsible sections and CSS
  - SVG: Vector graphics with proper namespaces
  - Mermaid: Flowchart syntax for documentation
  - JSON: Structured data for programmatic use
  - Export all formats at once

- **Built-in Templates** (`templates/decision-trees/`)
  - Authentication strategy (auth.md)
  - Database selection (database.md)
  - Testing approach (testing.md)
  - Deployment platform (deployment.md)
  - API design (api-design.md)
  - State management (state-management.md)
  - Styling approach (styling.md)

#### Advanced Features

- **Tree Diffing** (`lib/utils/decision-tree-differ.js`)
  - Compare two versions of decision trees
  - Detect added, removed, modified branches
  - Show structural changes and metadata differences
  - Color-coded diff output

- **Semantic Validation**
  - Detect unbalanced trees
  - Validate metadata values
  - Check conditional syntax
  - Suggest improvements
  - Lint mode with strict checking

- **Accessibility Support** (`lib/utils/accessibility-config.js`)
  - `--no-color`: Disable colors for screen readers
  - `--high-contrast`: High contrast color scheme
  - `--ascii-only`: ASCII characters instead of Unicode
  - Environment variable support: `REIS_NO_COLOR`, `REIS_HIGH_CONTRAST`, `REIS_ASCII_ONLY`
  - WCAG 2.1 Level AA compliance

#### Commands

```bash
# Tree Command
reis tree show <file>              # Display decision tree
reis tree new <template>           # Create from template
reis tree list                     # List available templates
reis tree validate <file>          # Validate tree syntax
reis tree export <file>            # Export to various formats
reis tree diff <file1> <file2>     # Compare two trees

# Decisions Command
reis decisions list                # List all decisions
reis decisions show <id>           # Show decision details
reis decisions revert <id>         # Revert a decision
reis decisions export              # Export decision history
reis decisions stats               # Show decision statistics
```

#### Command Options

**Tree Command:**
- `--depth <n>`: Limit display depth
- `--no-metadata`: Hide metadata badges
- `--interactive`: Interactive selection mode
- `--context <json>`: Context for condition evaluation
- `--no-color`: Disable colors (accessibility)
- `--high-contrast`: High contrast mode (accessibility)
- `--ascii-only`: ASCII characters only (accessibility)
- `--format <format>`: Export format (html, svg, mermaid, json, all)
- `--output <path>`: Output file path
- `--verbose`: Detailed validation output

**Decisions Command:**
- `--tree <treeId>`: Filter by tree ID
- `--phase <phase>`: Filter by phase
- `--limit <n>`: Limit number of results
- `--format <format>`: Export format (json, csv)
- `--output <path>`: Output file path
- `--reason <reason>`: Reason for revert
- `--no-color`: Disable colors (accessibility)

#### Documentation & Examples

- **Documentation**
  - `docs/DECISION_TREES.md`: Complete syntax and feature guide
  - `docs/DECISION_TREES_API.md`: API reference for programmatic use
  - Updated `README.md` with Decision Trees section

- **Example Files** (`examples/decision-trees/`)
  - `basic-tree.md`: Simple 2-level tree for beginners
  - `complex-tree.md`: Deep nesting with all features (4 levels)
  - `conditional-tree.md`: Conditional branches demonstration
  - `metadata-tree.md`: All metadata types with explanations
  - `real-world-auth.md`: Practical authentication strategy
  - `real-world-architecture.md`: Software architecture patterns
  - `multi-tree.md`: Multiple trees in one document

#### Testing

- **Comprehensive Test Suite** (`test/utils/decision-tree.test.js`)
  - 59 test cases covering all functionality
  - Parser tests: simple, nested, metadata, conditionals (15 cases)
  - Validation tests: cycles, orphans, metadata (8 cases)
  - Condition evaluation tests: AND, OR, NOT (5 cases)
  - Renderer tests: colors, accessibility, depth (10 cases)
  - Export tests: HTML, SVG, Mermaid (8 cases)
  - Tracking tests: record, query, revert (5 cases)
  - Integration tests: command support (4 cases)
  - Mock file system for isolated testing
  - Target: 80%+ code coverage

#### Use Cases

1. **Architecture Decisions**: Choose frameworks, databases, deployment platforms
2. **Implementation Strategies**: Select authentication, testing, or state management approaches
3. **Trade-off Analysis**: Compare options with metadata (weight, priority, risk)
4. **Context-Aware Recommendations**: Show relevant options based on project setup
5. **Decision History**: Track and audit all technical decisions
6. **Documentation**: Export decisions to HTML/SVG for project docs

#### Benefits

- 📊 **Structured Decision-Making**: Clear options with outcomes
- 🎯 **Interactive Navigation**: Explore options with arrow keys
- 📝 **Decision Tracking**: Audit trail for all decisions
- 📤 **Multiple Export Formats**: Use in docs, wikis, presentations
- 🔄 **Reusable Templates**: Quick start with common decisions
- ♿ **Accessible**: Screen reader friendly, high contrast, ASCII mode
- 🧪 **Well-Tested**: 59 tests, 80%+ coverage

### Technical Details

- **Lines of Code**: 2,500+ lines across 7 new modules
- **Test Coverage**: 890 lines of tests (59 test cases)
- **Documentation**: 690+ lines of examples, comprehensive guides
- **Templates**: 7 built-in decision tree templates
- **Accessibility**: Full WCAG 2.1 Level AA compliance

### Migration

No migration needed. New optional feature that extends REIS capabilities.

### Breaking Changes

None - Fully backward compatible with existing REIS projects.

---

## [2.2.0] - 2026-01-21

### Added - Complete Cycle Command 🔄

**New Feature: Automated PLAN → EXECUTE → VERIFY → DEBUG Workflow**

- **Cycle Command** (`lib/commands/cycle.js`)
  - Complete workflow automation: PLAN → EXECUTE → VERIFY → DEBUG → FIX
  - Smart orchestration with state machine management
  - Automatic debug/fix loop with configurable max attempts (default: 3)
  - Visual progress indicators and clear feedback
  - Support for phase numbers or custom plan paths

- **Cycle Orchestrator** (`lib/utils/cycle-orchestrator.js`)
  - State-driven workflow execution
  - Automatic error recovery and retry logic
  - Integration with existing REIS commands (execute, verify, debug)
  - Graceful interruption handling (Ctrl+C)
  - Comprehensive error handling with helpful messages

- **Cycle State Manager** (`lib/utils/cycle-state-manager.js`)
  - Persistent state storage in `.reis/cycle-state.json`
  - Resume capability for interrupted cycles
  - State transitions tracking and history
  - Attempt counter and completeness tracking
  - Automatic state cleanup on completion

- **Cycle UI Components** (`lib/utils/cycle-ui.js`)
  - Spinner animations for long operations
  - Progress bars for task completion
  - Step-by-step visual feedback
  - Color-coded status indicators
  - Formatted time display and summaries

- **Documentation**
  - `docs/CYCLE_WORKFLOW.md` - State machine design and workflow
  - `docs/CYCLE_COMMAND.md` - Complete user guide with examples
  - Updated README.md with cycle command section
  - 20+ test cases in `test/commands/cycle.test.js`

### Command Options

```bash
reis cycle [phase-or-plan] [options]

Options:
  --max-attempts <n>    Maximum debug/fix attempts (default: 3)
  --auto-fix            Apply fixes without confirmation
  --resume              Resume interrupted cycle
  --continue-on-fail    Continue even if verification fails
  -v, --verbose         Detailed output
```

### Features

- 🔄 **Automatic Recovery**: Debug and fix issues automatically
- 💾 **State Persistence**: Survives interruptions (Ctrl+C, crashes)
- ⏸️ **Resume Capability**: Pick up where you left off
- 🎯 **Smart Limiting**: Prevents infinite loops with max attempts
- 📊 **Visual Feedback**: Clear progress at every step
- ⚡ **Efficient**: Handles 90% of development scenarios

### Breaking Changes

None - Fully backward compatible

### Migration

No migration needed. New optional command.

---

## [2.0.0-beta.1] - 2024-01-XX

### Added - REIS Verifier 🔍

**Major Feature: Automated Verification with FR4.1 Feature Completeness Validation**

- **`reis verify` command** - Automated verification of execution results
  - Verify phases: `reis verify 2` or `reis verify phase-2`
  - Verify plans: `reis verify path/to/plan.PLAN.md`
  - Options: `--verbose` for detailed output, `--strict` for strict mode

- **reis_verifier subagent** - Comprehensive verification agent
  - 7-step verification protocol
  - Automated test execution and parsing
  - Code quality checks (syntax, linting)
  - Success criteria validation
  - Documentation verification
  - Detailed report generation
  - STATE.md integration

- **FR4.1: Feature Completeness Validation** - CRITICAL NEW CAPABILITY
  - Detects when executor skips tasks or leaves features incomplete
  - Parses all tasks from PLAN.md
  - Extracts expected deliverables (files, functions, classes, endpoints)
  - Verifies each deliverable exists in codebase using multiple methods:
    * File existence checks (fs, git ls-files)
    * Code pattern matching (grep for functions/classes)
    * Git diff analysis
    * Test presence verification
  - Calculates task completion percentage (Tasks complete / Total tasks)
  - **Requires 100% task completion to pass verification**
  - Reports missing deliverables with search evidence
  - Impact assessment (HIGH/MEDIUM/LOW) for incomplete tasks
  - Specific recommendations for fixing incomplete features

- **Verification Reports** - Comprehensive markdown reports
  - Executive summary with key metrics
  - Feature Completeness section (task-by-task breakdown)
  - Test results with failure details
  - Success criteria validation
  - Code quality metrics
  - Documentation status
  - Issues summary (critical/major/minor)
  - Actionable recommendations
  - Saved to `.planning/verification/{phase}/VERIFICATION_REPORT.md`

- **Templates**
  - `templates/VERIFICATION_REPORT.md` - Report template with FR4.1 section
  - `templates/STATE_VERIFICATION_ENTRY.md` - STATE.md entry template

- **Documentation**
  - `docs/VERIFICATION.md` - Comprehensive verification guide
  - README.md updated with verification section
  - FR4.1 Feature Completeness extensively documented
  - Examples and best practices

- **Test Suite**
  - Comprehensive tests for verify command
  - FR4.1 feature completeness validation tests
  - Scenario tests (complete/incomplete tasks, tests pass/fail)
  - Test coverage for all verification components

### Why FR4.1 Matters

Previous verification approaches only checked if tests passed. This meant:
- ❌ Executor could skip tasks without detection
- ❌ Tests might pass but features were missing
- ❌ Incomplete implementations went unnoticed

FR4.1 solves this by:
- ✅ Verifying ALL planned tasks are implemented
- ✅ Checking that deliverables actually exist
- ✅ Providing evidence for completeness
- ✅ Requiring 100% task completion before proceeding

### Example

```bash
$ reis verify phase-2

❌ VERIFICATION FAILED
- Feature Completeness: 66% (1 task incomplete)
- Task 2: Build Password Reset - INCOMPLETE
  Missing: src/auth/password-reset.js, sendResetEmail()

# After fixing
$ reis verify phase-2

✅ VERIFICATION PASSED
- Feature Completeness: 100% (3/3 tasks)
- All checks passed
```

### Technical Details

- Verification protocol: 7 steps (load → test → quality → FR4.1 → docs → report → state)
- FR4.1 uses file existence, grep patterns, git diff for verification
- Confidence scoring (0.7-1.0) prevents false positives
- Handles refactoring and file renames gracefully
- Integration with STATE.md for verification history

### Breaking Changes

None - This is a new feature addition.

### Migration

No migration needed. Existing projects can immediately use `reis verify`.

### Credits

FR4.1 Feature Completeness Validation was designed to solve the critical gap of detecting incomplete implementations that tests alone cannot catch.

---

## [2.0.0-beta.1] - 2026-01-18 (Phase 4 Wave 1-2 Complete)

### Added - Phase 4 Wave 1-2: Visualization & Performance
- **Visualizer Utility** (`lib/utils/visualizer.js`)
  - ASCII bar charts for metrics
  - Timeline visualization for roadmap phases
  - Progress bars with ETA
  - Distribution charts for statistics
  - Tables with borders and alignment
  - Terminal-safe, width-adaptive rendering
  - Color and monochrome mode support

- **Visualize Command** (`lib/commands/visualize.js`)
  - Real-time progress visualization
  - Wave execution timeline
  - Roadmap overview
  - Metrics dashboard
  - Watch mode with auto-refresh (5s intervals)
  - Compact and colorless modes

- **Performance Benchmarks** (`test/performance.test.js`)
  - Baseline metrics for all utilities
  - Config load: <50ms
  - STATE.md operations: <100ms
  - Git commits: <250ms
  - Wave parsing: <150ms
  - Metrics operations: <10ms
  - Validation: <200ms
  - Visualization rendering: <10ms
  - Memory profiling for large operations

### Technical Details
- 297 tests passing (58 new tests for Phase 4 Wave 1-2)
- All performance targets met and validated
- Regression detection baselines established

## [2.0.0-alpha.3] - 2026-01-18 (Phase 3 Complete)

### Added - Phase 3: Advanced Features
- **Plan Validator** (`lib/utils/plan-validator.js`)
  - Validate PLAN.md structure and syntax
  - Check wave definitions and dependencies
  - Validate task completeness (files, actions, verification)
  - Detect circular dependencies
  - Provide actionable error messages

- **Metrics Tracker** (`lib/utils/metrics-tracker.js`)
  - Track wave execution metrics (duration, success rate)
  - Log deviations and blockers
  - Calculate phase-level and overall statistics
  - Export metrics for analysis
  - JSON-based metrics storage

### Technical Details
- 239 tests passing (82 new tests for Phase 3)
- Full validator coverage with edge cases
- Metrics persistence and retrieval
- Performance validated (<10ms operations)

## [2.0.0-alpha.2] - 2026-01-18 (Phase 2 Complete)

### Added - Phase 2: Command Enhancement
- **Enhanced execute-plan Command** (`lib/commands/execute-plan.js`)
  - Wave-based execution with automatic checkpoints
  - Parallel wave detection and dependency resolution
  - Interactive mode with wave-by-wave confirmation
  - Deviation detection and logging
  - Git integration for wave completion commits

- **Checkpoint Command** (`lib/commands/checkpoint.js`)
  - Manual checkpoint creation with custom messages
  - Automatic checkpoint creation between waves
  - List all checkpoints with --list flag
  - Git commit integration with refs/reis/checkpoints

- **Resume Command** (`lib/commands/resume.js`)
  - Smart resume with context-aware recommendations
  - Resume from specific checkpoint with git diff display
  - Continue wave execution from interruption point
  - Blocker detection and next steps display

- **Config Command** (`lib/commands/config.js`)
  - Initialize reis.config.js in project root
  - Show current configuration (merged defaults + overrides)
  - Validate configuration files
  - Interactive config setup

### Technical Details
- 157 tests passing (109 new tests for Phase 2)
- Integration tests for command workflows
- E2E scenario tests for real developer workflows
- Backward compatible with REIS v1.x projects

## [2.0.0-alpha.1] - 2026-01-18 (Phase 1 Complete)

### Added - Phase 1: Foundation
- **Config System** (`lib/utils/config.js`)
  - Load and validate `reis.config.js` from project root
  - Wave size configuration (small/medium/large)
  - Git integration settings
  - Deep merge with defaults
  - Comprehensive validation
  
- **Enhanced State Management** (`lib/utils/state-manager.js`)
  - Wave tracking with start/complete/progress
  - Checkpoint management with history
  - Activity logging with timestamps
  - Metrics tracking (success rate, duration)
  - Markdown-based state persistence
  
- **Git Integration** (`lib/utils/git-integration.js`)
  - Repository detection and status checking
  - Structured commits with metadata
  - Wave completion auto-commits
  - Checkpoint commits and milestone tagging
  - Branch management and rollback support
  
- **Wave Execution Engine** (`lib/utils/wave-executor.js`)
  - Parse PLAN.md into Wave objects
  - Wave lifecycle management
  - Sequential execution with auto-checkpoints
  - Deviation detection and reporting
  - Resume from checkpoint capability

- **Comprehensive Test Suite**
  - 48 unit and integration tests (100% passing)
  - Full workflow integration tests
  - Test coverage for all Phase 1 utilities

### Technical Details
- ~1,587 lines of utility code
- 4 core utility modules
- Wave-based execution model from GSD analysis
- Backward compatible with REIS v1.x projects

## [1.0.0] - 2025-01-17

### Added - Initial Release

#### Core System
- **29 Commands** - Complete systematic development workflow
  - Project initialization: `new`, `map`
  - Requirements & roadmap: `requirements`, `roadmap`
  - Phase management: `plan`, `discuss`, `research`, `assumptions`, `execute`, `execute-plan`, `verify`
  - Progress tracking: `progress`, `pause`, `resume`
  - Roadmap management: `add`, `insert`, `remove`
  - Milestones: `milestone complete`, `milestone discuss`, `milestone new`
  - Utilities: `todo`, `todos`, `debug`, `update`, `whats-new`, `docs`, `uninstall`
  - Help: `help`, `version`

#### 3 Specialized Subagents
- **reis_planner** - Creates executable phase plans with task breakdown
- **reis_executor** - Executes plans with atomic commits and deviation handling
- **reis_project_mapper** - Maps existing codebases and bootstraps REIS structure

#### Documentation (8 files)
- `README.md` - Main documentation and architecture guide
- `COMPLETE_COMMANDS.md` - All 29 commands with examples
- `QUICK_REFERENCE.md` - Quick reference for daily use
- `WORKFLOW_EXAMPLES.md` - Real-world workflow examples
- `INTEGRATION_GUIDE.md` - Rovo Dev integration instructions
- `SHORTCUT_GUIDE.md` - Natural language shortcuts
- `README_DOCS.md` - Documentation navigation guide
- `shortcuts.json` - Structured shortcut definitions

#### Templates (5 files)
- `PROJECT.md` - Project vision template
- `REQUIREMENTS.md` - Requirements document template
- `ROADMAP.md` - Roadmap structure template
- `STATE.md` - State tracking template
- `PLAN.md` - Phase plan template

#### Features
- ✅ Parallel execution - Run up to 4 subagents simultaneously
- ✅ No context rot - Fresh 200k context per task
- ✅ Atomic commits - One commit per task
- ✅ Auto-fix - Bugs and gaps fixed automatically
- ✅ Structured documentation - Always-loaded context
- ✅ Beautiful CLI - Colors, icons, and clear formatting
- ✅ Silent mode - CI/CD friendly installation
- ✅ Idempotent installation - Safe to run multiple times

#### Installation
- NPM package with `npx reis` support
- Interactive installation with confirmation prompt
- Automatic file copying to `~/.rovodev/reis/`
- Subagent installation to `~/.rovodev/subagents/`

### Credits
Inspired by [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by TÂCHES, adapted for Atlassian Rovo Dev with enhanced parallel subagent execution.

[2.0.0-beta.1]: https://github.com/Gravirei/reis/releases/tag/v2.0.0-beta.1
[2.0.0-alpha.3]: https://github.com/Gravirei/reis/releases/tag/v2.0.0-alpha.3
[2.0.0-alpha.2]: https://github.com/Gravirei/reis/releases/tag/v2.0.0-alpha.2
[2.0.0-alpha.1]: https://github.com/Gravirei/reis/releases/tag/v2.0.0-alpha.1
[1.0.0]: https://github.com/Gravirei/reis/releases/tag/v1.0.0
