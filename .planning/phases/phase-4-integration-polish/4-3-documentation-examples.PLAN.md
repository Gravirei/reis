# Plan: 4-3 - Documentation & Examples

## Objective
Create comprehensive documentation, example projects, and API references to make REIS v2.0 accessible and easy to adopt.

## Context
REIS v2.0 has significant new features (waves, checkpoints, visualization, validation, optimization) that need clear documentation. Users need examples to understand the full workflow and get started quickly.

Current documentation:
- README.md exists but needs v2.0 feature updates
- No example projects
- No API documentation for utilities

## Dependencies
- Wave 1 complete (visualizer and commands documented)
- Wave 2 complete (integration testing validates documented workflows)

## Wave Assignment
**Wave 3** (depends on Waves 1-2 for accurate documentation)

## Tasks

<task type="auto">
<name>Create example projects (small, medium, large)</name>
<files>examples/small-feature/*, examples/medium-app/*, examples/large-system/*</files>
<action>
Create three example projects demonstrating REIS v2.0 usage at different scales.

**examples/small-feature/** (Simple feature addition)
```
examples/small-feature/
├── README.md
├── .planning/
│   ├── ROADMAP.md
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── STATE.md
│   └── phases/
│       └── phase-1-user-authentication/
│           └── 1-1-basic-auth.PLAN.md
└── reis.config.js
```

**Scenario:** Adding user authentication to existing app
- Single phase: User Authentication
- 2 waves, 6 tasks total
- Demonstrates: basic REIS workflow, wave execution, checkpoints
- Time to complete: ~2 hours

**Content:**
- PROJECT.md: Clear problem statement and goals
- ROADMAP.md: Single-phase roadmap with milestones
- PLAN.md: Well-structured plan with wave annotations
- reis.config.js: Minimal config example
- README.md: Step-by-step guide for running the example

**examples/medium-app/** (Building complete application)
```
examples/medium-app/
├── README.md
├── .planning/
│   ├── ROADMAP.md
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── STATE.md
│   └── phases/
│       ├── phase-1-foundation/
│       │   ├── 1-1-project-setup.PLAN.md
│       │   └── 1-2-database-schema.PLAN.md
│       ├── phase-2-api/
│       │   ├── 2-1-rest-endpoints.PLAN.md
│       │   └── 2-2-authentication.PLAN.md
│       └── phase-3-frontend/
│           ├── 3-1-ui-components.PLAN.md
│           └── 3-2-integration.PLAN.md
└── reis.config.js
```

**Scenario:** Building a task management API from scratch
- 3 phases: Foundation, API, Frontend
- 6 waves, 24 tasks total
- Demonstrates: multi-phase project, dependencies, optimization, visualization
- Time to complete: ~2 days

**Content:**
- PROJECT.md: Detailed vision and success criteria
- ROADMAP.md: Multi-phase roadmap with dependencies
- Multiple PLAN.md files showing different complexity levels
- reis.config.js: Customized wave sizes and git settings
- README.md: Complete walkthrough with best practices

**examples/large-system/** (Enterprise-scale system)
```
examples/large-system/
├── README.md
├── .planning/
│   ├── ROADMAP.md (5 phases)
│   ├── PROJECT.md
│   ├── REQUIREMENTS.md
│   ├── STATE.md
│   ├── ARCHITECTURE.md
│   └── phases/
│       ├── phase-1-infrastructure/
│       │   ├── 1-1-cloud-setup.PLAN.md
│       │   ├── 1-2-networking.PLAN.md
│       │   └── 1-3-security.PLAN.md
│       ├── phase-2-data-layer/
│       │   └── ... (4 plans)
│       ├── phase-3-services/
│       │   └── ... (6 plans)
│       ├── phase-4-integrations/
│       │   └── ... (5 plans)
│       └── phase-5-deployment/
│           └── ... (3 plans)
└── reis.config.js
```

**Scenario:** Building microservices platform
- 5 phases: Infrastructure, Data, Services, Integrations, Deployment
- 21 waves, 100+ tasks
- Demonstrates: large-scale planning, parallel execution, metrics tracking, advanced features
- Time to complete: ~2 weeks

**Content:**
- PROJECT.md: Comprehensive architecture and goals
- ROADMAP.md: Complex multi-phase with parallel waves
- ARCHITECTURE.md: System design and technical decisions
- Multiple PLAN.md files with advanced features (validation, optimization)
- reis.config.js: Full configuration with all options
- README.md: Guide to managing large projects with REIS

**Implementation notes:**
- All examples should be realistic and production-quality
- Include comments explaining REIS concepts
- Show both success scenarios and how to handle issues
- Demonstrate all major v2.0 features
- Each example README should be self-contained tutorial

**README structure for each example:**
```markdown
# [Example Name]

## What This Example Demonstrates
- Feature 1
- Feature 2

## Prerequisites
- Node.js >= 18
- Git
- REIS v2.0

## Step-by-Step Guide

### 1. Setup
...

### 2. Review Planning Documents
...

### 3. Execute the Plan
...

### 4. Monitor Progress
...

### 5. Analyze Results
...

## Key Takeaways
...

## Next Steps
...
```
</action>
<verify>
# Verify example structure
ls -la examples/small-feature/.planning/
ls -la examples/medium-app/.planning/phases/
ls -la examples/large-system/.planning/phases/

# Verify all planning files are valid
node -e "const fs = require('fs'); ['small-feature', 'medium-app', 'large-system'].forEach(ex => { const content = fs.readFileSync(\`examples/\${ex}/.planning/ROADMAP.md\`, 'utf8'); if (!content.includes('Phase')) throw new Error(\`Invalid \${ex}\`); });"

# Test that examples can be executed (dry run)
cd examples/small-feature && node ../../bin/reis.js validate .planning/phases/phase-1-user-authentication/1-1-basic-auth.PLAN.md
cd ../medium-app && node ../../bin/reis.js visualize --type roadmap
cd ../large-system && node ../../bin/reis.js analyze --format json
</verify>
<done>
- 3 example projects created (small, medium, large)
- Each example has complete .planning/ structure
- All PLAN.md files are valid and realistic
- READMEs provide clear tutorials
- Examples demonstrate all v2.0 features
- Examples tested and verified to work
- Different complexity levels for different user needs
</done>
</task>

<task type="auto">
<name>Update README.md with v2.0 features and comprehensive guide</name>
<files>README.md</files>
<action>
Major update to README.md to document all REIS v2.0 features, commands, and workflows.

**New/Updated Sections:**

1. **Quick Start** (updated)
   - Add wave-based execution example
   - Show new visualization commands
   - Include analyze command in quick start

2. **Installation** (updated)
   - Update version to v2.0
   - Add Node.js >= 18 requirement
   - Installation verification steps

3. **Core Concepts** (NEW)
   ```markdown
   ## Core Concepts
   
   ### Wave-Based Execution
   REIS v2.0 organizes work into waves...
   
   ### Checkpoints
   Automatic and manual checkpoints...
   
   ### State Tracking
   Enhanced STATE.md format...
   
   ### Git Integration
   Automatic commits and tagging...
   ```

4. **Configuration** (NEW)
   ```markdown
   ## Configuration
   
   Create `reis.config.js` in your project root:
   
   \`\`\`javascript
   module.exports = {
     waves: {
       small: 2,    // 1-2 tasks
       medium: 5,   // 3-5 tasks
       large: 10    // 6-10 tasks
     },
     git: {
       autoCommit: true,
       commitPrefix: '[REIS]'
     },
     checkpoints: {
       enabled: true,
       afterWaves: true,
       beforeDeviations: true
     },
     metrics: {
       enabled: true,
       metricsDir: '.reis/metrics'
     }
   };
   \`\`\`
   
   All fields are optional. REIS uses sensible defaults.
   ```

5. **Commands** (expanded)
   ```markdown
   ## Commands
   
   ### Planning Commands
   - `reis new` - Initialize new REIS project
   - `reis validate <plan>` - Validate PLAN.md structure
   - `reis optimize <plan>` - Optimize plan for parallel execution
   
   ### Execution Commands
   - `reis execute-plan <plan>` - Execute wave-based plan
   - `reis checkpoint` - Create manual checkpoint
   - `reis resume [checkpoint]` - Resume from checkpoint
   
   ### Analysis Commands
   - `reis analyze [options]` - Analyze execution history
   - `reis visualize [options]` - Visualize project progress
   
   ### Configuration Commands
   - `reis config get <key>` - Get config value
   - `reis config set <key> <value>` - Set config value
   - `reis config list` - Show all config
   
   [Detailed command documentation for each...]
   ```

6. **Wave-Based Execution** (NEW)
   ```markdown
   ## Wave-Based Execution
   
   ### What are Waves?
   Waves group related tasks for sequential execution...
   
   ### Wave Annotations in PLAN.md
   \`\`\`markdown
   <!-- WAVE 1: SMALL -->
   ## Task 1
   ...
   <!-- /WAVE 1 -->
   \`\`\`
   
   ### Automatic Wave Detection
   REIS can auto-detect waves based on task dependencies...
   
   ### Checkpoints Between Waves
   Automatic checkpoints created after each wave...
   ```

7. **Visualization & Analytics** (NEW)
   ```markdown
   ## Visualization & Analytics
   
   ### Real-Time Progress
   \`\`\`bash
   reis visualize --watch
   \`\`\`
   
   ### Execution Analysis
   \`\`\`bash
   reis analyze --type waves
   reis analyze --type performance
   \`\`\`
   
   ### Metrics Tracking
   All executions tracked automatically...
   ```

8. **Best Practices** (NEW)
   ```markdown
   ## Best Practices
   
   ### Plan Organization
   - Break work into 2-3 task waves
   - Use wave annotations for explicit control
   - Define clear task boundaries
   
   ### Checkpoint Strategy
   - Checkpoint after risky changes
   - Use manual checkpoints before experiments
   - Leverage automatic wave checkpoints
   
   ### Performance Optimization
   - Use `reis optimize` before execution
   - Identify parallel execution opportunities
   - Monitor metrics for bottlenecks
   
   ### Error Recovery
   - Always review checkpoints before resuming
   - Use `reis resume --list` to see options
   - Check git diff before continuing
   ```

9. **Troubleshooting** (NEW)
   ```markdown
   ## Troubleshooting
   
   ### Common Issues
   
   **"No waves found in PLAN.md"**
   - Add wave annotations or use auto-detection
   - Run `reis validate` to check format
   
   **"Checkpoint not found"**
   - Use `reis resume --list` to see available checkpoints
   - Check git tag list
   
   [More common issues and solutions...]
   ```

10. **Migration from v1.x** (NEW)
    ```markdown
    ## Migration from v1.x
    
    REIS v2.0 is fully backward compatible. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for details.
    
    Quick upgrade:
    1. Install v2.0: `npm install -g @gravirei/reis@2.0.0`
    2. Run on existing project: `reis execute-plan PLAN.md`
    3. Explore new features: `reis analyze`, `reis visualize`
    ```

11. **Examples** (NEW)
    ```markdown
    ## Examples
    
    See the [examples/](examples/) directory for complete project examples:
    
    - **Small Feature** - Simple authentication feature (2 hours)
    - **Medium App** - Complete task management API (2 days)
    - **Large System** - Microservices platform (2 weeks)
    
    Each example includes complete documentation and step-by-step guides.
    ```

12. **API Documentation** (NEW - link to separate docs)
    ```markdown
    ## API Documentation
    
    For programmatic usage and utility APIs, see [API.md](docs/API.md).
    ```

**Formatting:**
- Use consistent markdown formatting
- Include code examples for every command
- Add screenshots/ASCII art for visualizations (use visualizer output)
- Table of contents at top
- Clear section hierarchy
- Emoji for visual scanning (✨ for new features, 🔥 for highlights)

**Tone:**
- Friendly and approachable
- Practical examples over theory
- Focus on developer productivity
- Highlight time savings
</action>
<verify>
# Verify README structure
grep -c "^## " README.md
# Should show ~15+ sections

# Verify all commands documented
grep -o "reis [a-z-]*" README.md | sort -u
# Should show: analyze, checkpoint, config, execute-plan, new, optimize, resume, validate, visualize

# Verify code blocks are valid
node -e "const fs = require('fs'); const content = fs.readFileSync('README.md', 'utf8'); const blocks = content.match(/\`\`\`javascript[\s\S]*?\`\`\`/g); if (!blocks || blocks.length < 5) throw new Error('Not enough code examples');"

# Check links are valid
grep -o "](.*\.md)" README.md | grep -o "[^)]*\.md" | while read file; do [ -f "$file" ] || [ -f "docs/$file" ] || echo "Missing: $file"; done
</verify>
<done>
- README.md updated with all v2.0 features
- 15+ major sections covering all functionality
- All commands documented with examples
- Best practices and troubleshooting sections added
- Links to examples and API docs
- Migration guide referenced
- Code examples verified for syntax
- Clear, developer-friendly documentation
</done>
</task>

<task type="auto">
<name>Create API documentation for utilities</name>
<files>docs/API.md</files>
<action>
Create comprehensive API documentation for all utility modules for developers who want to use REIS programmatically or extend it.

**docs/API.md Structure:**

```markdown
# REIS v2.0 API Documentation

For CLI usage, see [README.md](../README.md).

## Overview

REIS provides a programmatic API for all its utilities. Use these when:
- Building tools on top of REIS
- Custom workflow automation
- Integrating REIS into other systems

## Utilities

### Config (`lib/utils/config.js`)

Load and manage REIS configuration.

#### `loadConfig(projectRoot)`

Loads reis.config.js from project root and merges with defaults.

**Parameters:**
- `projectRoot` (string, optional) - Path to project root. Default: `process.cwd()`

**Returns:** Promise<Object> - Merged configuration object

**Example:**
\`\`\`javascript
const { loadConfig } = require('@gravirei/reis/lib/utils/config');

const config = await loadConfig('/path/to/project');
console.log(config.waves.small); // 2
\`\`\`

**Configuration Schema:**
\`\`\`javascript
{
  waves: {
    small: number,    // Tasks per small wave (default: 2)
    medium: number,   // Tasks per medium wave (default: 5)
    large: number     // Tasks per large wave (default: 10)
  },
  git: {
    autoCommit: boolean,        // Auto-commit on wave completion (default: true)
    commitPrefix: string,       // Commit message prefix (default: '[REIS]')
    requireClean: boolean,      // Require clean tree (default: true)
    autoCheckpoint: boolean     // Auto-checkpoint on wave complete (default: true)
  },
  checkpoints: {
    enabled: boolean,           // Enable checkpoints (default: true)
    afterWaves: boolean,        // Checkpoint after waves (default: true)
    beforeDeviations: boolean   // Checkpoint before deviation (default: true)
  },
  metrics: {
    enabled: boolean,           // Enable metrics (default: true)
    metricsDir: string         // Metrics directory (default: '.reis/metrics')
  },
  planningDir: string          // Planning directory (default: '.planning')
}
\`\`\`

---

### StateManager (`lib/utils/state-manager.js`)

Manage STATE.md file with wave tracking and checkpoints.

#### Constructor: `new StateManager(config)`

**Parameters:**
- `config` (Object) - Configuration object from loadConfig()

#### Methods

##### `init()`
Initialize STATE.md if it doesn't exist.

**Returns:** Promise<void>

##### `getState()`
Read and parse current STATE.md.

**Returns:** Promise<Object> - State object

**State Schema:**
\`\`\`javascript
{
  currentPhase: string,
  activeWave: {
    name: string,
    status: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETE'|'FAILED',
    startedAt: string,
    progress: { current: number, total: number }
  },
  completedWaves: Array<{name, duration, status}>,
  checkpoints: Array<{timestamp, commit, wave}>,
  recentActivity: Array<{timestamp, message}>,
  nextSteps: Array<string>,
  blockers: Array<string>,
  notes: Array<string>,
  metrics: {
    totalWaves: number,
    completedWaves: number,
    successRate: number,
    avgDuration: number
  }
}
\`\`\`

##### `startWave(waveName, totalTasks)`
Mark wave as started.

**Parameters:**
- `waveName` (string) - Wave identifier
- `totalTasks` (number) - Total tasks in wave

**Returns:** Promise<void>

##### `updateWaveProgress(waveName, current, total)`
Update wave progress.

**Returns:** Promise<void>

##### `completeWave(waveName, status)`
Mark wave as complete.

**Parameters:**
- `status` (string) - 'success' or 'failed'

**Returns:** Promise<void>

##### `addCheckpoint(commit, waveName)`
Add checkpoint to history.

**Returns:** Promise<void>

##### `addActivity(message)`
Add activity log entry.

**Returns:** Promise<void>

**Example:**
\`\`\`javascript
const StateManager = require('@gravirei/reis/lib/utils/state-manager');

const state = new StateManager(config);
await state.init();
await state.startWave('Wave 1: Setup', 5);
await state.updateWaveProgress('Wave 1: Setup', 3, 5);
await state.completeWave('Wave 1: Setup', 'success');

const currentState = await state.getState();
console.log(currentState.metrics.successRate);
\`\`\`

---

### GitIntegration (`lib/utils/git-integration.js`)

Git operations wrapper for REIS workflows.

#### Constructor: `new GitIntegration(config)`

#### Methods

##### `isGitRepository()`
Check if current directory is a git repository.

**Returns:** Promise<boolean>

##### `getStatus()`
Get git status information.

**Returns:** Promise<Object> - `{clean: boolean, branch: string, files: Array}`

##### `createCommit(message, options)`
Create a git commit.

**Parameters:**
- `message` (string) - Commit message
- `options` (Object) - `{wave, phase, metadata}`

**Returns:** Promise<string> - Commit hash

##### `createCheckpoint(waveName)`
Create checkpoint commit and tag.

**Returns:** Promise<Object> - `{commit, tag}`

##### `listCheckpoints()`
List all checkpoint tags.

**Returns:** Promise<Array<Object>> - Checkpoint list

##### `getCommitDiff(commit1, commit2)`
Get diff between two commits.

**Returns:** Promise<string> - Diff output

**Example:**
\`\`\`javascript
const GitIntegration = require('@gravirei/reis/lib/utils/git-integration');

const git = new GitIntegration(config);

if (await git.isGitRepository()) {
  const status = await git.getStatus();
  if (status.clean) {
    const commit = await git.createCommit('Complete wave 1', {
      wave: 'Wave 1',
      phase: 'Phase 1'
    });
    await git.createCheckpoint('Wave 1');
  }
}
\`\`\`

---

### WaveExecutor (`lib/utils/wave-executor.js`)

Parse and execute wave-based plans.

#### Constructor: `new WaveExecutor(config, stateManager, gitIntegration)`

#### Methods

##### `parsePlan(planFile)`
Parse PLAN.md into wave objects.

**Returns:** Promise<Array<Wave>> - Array of wave objects

**Wave Schema:**
\`\`\`javascript
{
  number: number,
  name: string,
  size: 'SMALL'|'MEDIUM'|'LARGE',
  tasks: Array<{name, description, files}>,
  dependencies: Array<number>
}
\`\`\`

##### `startNextWave()`
Start executing next wave in sequence.

**Returns:** Promise<Wave>

##### `completeCurrentWave(status)`
Mark current wave complete and checkpoint.

**Parameters:**
- `status` (string) - 'success' or 'failed'

**Returns:** Promise<void>

##### `executeWaves(planFile)`
Execute all waves in sequence with auto-checkpointing.

**Returns:** Promise<Object> - Execution report

**Example:**
\`\`\`javascript
const WaveExecutor = require('@gravirei/reis/lib/utils/wave-executor');

const executor = new WaveExecutor(config, state, git);
const waves = await executor.parsePlan('PLAN.md');
const report = await executor.executeWaves('PLAN.md');

console.log(\`Completed \${report.completed}/\${report.total} waves\`);
\`\`\`

---

[Continue with PlanValidator, MetricsTracker, PlanOptimizer, and Visualizer utility documentation...]

---

## Command Modules

All commands are also available programmatically:

\`\`\`javascript
const { executeCommand } = require('@gravirei/reis/lib/commands/execute-plan');
const { validateCommand } = require('@gravirei/reis/lib/commands/validate');
// etc.
\`\`\`

See individual command files for detailed API.

## Error Handling

All async functions may throw errors. Always use try/catch:

\`\`\`javascript
try {
  const config = await loadConfig();
  // ... operations
} catch (error) {
  if (error.code === 'ENOENT') {
    // File not found
  } else if (error.code === 'INVALID_CONFIG') {
    // Config validation failed
  }
  console.error(error.message);
}
\`\`\`

## TypeScript Support

Type definitions coming in v2.1. For now, use JSDoc comments for IDE support.

## Examples

See [examples/](../examples/) for complete usage examples.
```

**Implementation notes:**
- Document ALL public functions in ALL utilities
- Include parameter types and return types
- Provide realistic code examples
- Document error conditions
- Schema definitions for complex objects
- Cross-reference related functions
- Keep examples concise but complete
</action>
<verify>
# Verify API.md exists and has content
wc -l docs/API.md
# Should show 500+ lines

# Verify all utilities documented
grep -c "^### " docs/API.md
# Should show 8+ utilities

# Verify code examples
grep -c "```javascript" docs/API.md
# Should show 15+ examples

# Check markdown formatting
node -e "const fs = require('fs'); const content = fs.readFileSync('docs/API.md', 'utf8'); if (!content.includes('##')) throw new Error('Invalid markdown');"
</verify>
<done>
- docs/API.md created with comprehensive utility documentation
- All 8 utility modules documented with examples
- Function signatures, parameters, and return types documented
- Schema definitions for complex objects
- Error handling guidance provided
- Code examples for all major functions
- 500+ lines of API documentation
- Cross-references between related APIs
</done>
</task>

## Success Criteria
- 3 example projects created (small, medium, large) with complete .planning/ structure
- README.md updated with 15+ sections covering all v2.0 features
- docs/API.md created with comprehensive utility API documentation
- All examples tested and functional
- Documentation is clear, accurate, and developer-friendly
- Migration guide integrated into docs
- All code examples in docs are valid and tested

## Verification
```bash
# Verify examples exist
ls -la examples/small-feature/.planning/
ls -la examples/medium-app/.planning/
ls -la examples/large-system/.planning/

# Verify examples are valid
cd examples/small-feature && node ../../bin/reis.js validate .planning/phases/*/1-1-*.PLAN.md

# Verify README updated
grep -c "^## " README.md
# Should show 15+ sections

# Verify API docs
wc -l docs/API.md
# Should show 500+ lines

# Test documentation examples
# Extract and test code examples from docs
node -e "const fs = require('fs'); const content = fs.readFileSync('docs/API.md', 'utf8'); const examples = content.match(/\`\`\`javascript[\s\S]*?require.*?[\s\S]*?\`\`\`/g); console.log(\`Found \${examples?.length || 0} code examples\`);"
```
