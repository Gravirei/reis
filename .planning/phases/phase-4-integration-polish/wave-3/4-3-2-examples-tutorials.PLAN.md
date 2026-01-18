# Plan: 4-3-2 - Examples & Tutorials

## Objective
Create comprehensive example projects and tutorials demonstrating REIS v2.0 features in real-world scenarios.

## Context
- Need practical examples showing v2.0 features (waves, checkpoints, config, metrics, visualization)
- Target audience: developers new to REIS and v1.x users exploring v2.0
- Examples should be executable and well-documented
- Should cover basic → advanced progression

## Dependencies
- Depends on: Wave 3.1 (documentation updates) - examples reference the docs
- Blocks: None (examples can be created in parallel with package prep)

## Tasks

<task type="auto">
<name>Create basic-workflow example project</name>
<files>
package/examples/basic-workflow/README.md,
package/examples/basic-workflow/PROJECT.md,
package/examples/basic-workflow/REQUIREMENTS.md,
package/examples/basic-workflow/ROADMAP.md,
package/examples/basic-workflow/STATE.md,
package/examples/basic-workflow/.planning/phases/phase-1-setup/1-1-initial-setup.PLAN.md,
package/examples/basic-workflow/reis.config.js
</files>
<action>
Create a complete example project in package/examples/basic-workflow/ demonstrating basic REIS v2.0 workflow.

**Project:** Building a simple TODO CLI app

**Structure:**
1. **README.md** - Overview of the example
   - What this example demonstrates
   - How to follow along
   - Expected outcomes
   - Commands used

2. **PROJECT.md** - Simple project vision
   ```markdown
   # TODO CLI Application
   
   ## Vision
   Build a command-line TODO application with CRUD operations
   
   ## Goals
   - Simple task management
   - Persistent storage (JSON file)
   - Clean CLI interface
   ```

3. **REQUIREMENTS.md** - Basic requirements
   - Feature requirements (add, list, complete, delete tasks)
   - Technical requirements (Node.js, JSON storage)
   - Non-functional requirements

4. **ROADMAP.md** - 2-phase roadmap
   ```markdown
   # Roadmap
   
   ## Phase 1: Core Functionality [2 waves]
   Wave 1: Project setup & storage
   Wave 2: CRUD operations
   
   ## Phase 2: CLI Polish [1 wave]
   Wave 1: Help text & error handling
   ```

5. **STATE.md** - Initial state (template format)

6. **.planning/phases/phase-1-setup/1-1-initial-setup.PLAN.md** - Complete executable plan
   - Shows proper wave structure
   - Includes wave sizes [S], [M]
   - Has complete task definitions with <files>, <action>, <verify>, <done>

7. **reis.config.js** - Simple config example
   ```javascript
   module.exports = {
     waves: {
       small: { tasks: '1-2', duration: '15-30min' },
       medium: { tasks: '2-4', duration: '30-60min' }
     },
     git: {
       autoCommit: true,
       commitPrefix: '[TODO-CLI]'
     }
   };
   ```

**Include step-by-step instructions** in README.md showing:
```bash
# Step 1: Initialize
cd examples/basic-workflow
reis init

# Step 2: Configure
reis config init

# Step 3: Execute first wave
reis execute-plan .planning/phases/phase-1-setup/1-1-initial-setup.PLAN.md

# Step 4: Create checkpoint
reis checkpoint "Phase 1 Wave 1 complete"

# Step 5: View progress
reis visualize --type progress
```

**WHY:** Basic example shows the complete REIS workflow in a digestible format, perfect for onboarding.
</action>
<verify>
- Directory package/examples/basic-workflow/ exists with all files
- README.md has clear step-by-step instructions
- PLAN.md follows v2.0 format with waves
- reis.config.js is valid and loads without error
- All files are well-formatted and consistent
</verify>
<done>Complete basic-workflow example created with 7 files demonstrating core REIS v2.0 workflow</done>
</task>

<task type="auto">
<name>Create advanced-features example project</name>
<files>
package/examples/advanced-features/README.md,
package/examples/advanced-features/PROJECT.md,
package/examples/advanced-features/ROADMAP.md,
package/examples/advanced-features/.planning/phases/phase-2-api/2-1-rest-endpoints.PLAN.md,
package/examples/advanced-features/reis.config.js,
package/examples/advanced-features/TUTORIAL.md
</files>
<action>
Create advanced example in package/examples/advanced-features/ demonstrating:
- Complex wave dependencies
- Manual checkpoints during development
- Resume after interruption
- Metrics tracking and analysis
- Custom visualization

**Project:** REST API with authentication

**Key Files:**

1. **README.md** - Advanced features overview
   - Prerequisites (completed basic-workflow)
   - What's demonstrated (checkpoints, resume, metrics, complex waves)
   - Quick start commands

2. **PROJECT.md** - REST API project vision

3. **ROADMAP.md** - 3-phase roadmap with wave dependencies
   ```markdown
   ## Phase 1: Database Setup [2 waves]
   Wave 1: Schema design
   Wave 2: Migrations

   ## Phase 2: API Endpoints [3 waves]
   Wave 1: User endpoints (depends: Phase 1)
   Wave 2: Auth endpoints (depends: Phase 2 Wave 1)
   Wave 3: Protected routes (depends: Phase 2 Wave 2)
   ```

4. **.planning/phases/phase-2-api/2-1-rest-endpoints.PLAN.md** - Complex plan
   - Multiple waves with explicit dependencies
   - Different wave sizes [S], [M], [L]
   - Checkpoint recommendations in comments

5. **reis.config.js** - Advanced configuration
   ```javascript
   module.exports = {
     waves: {
       small: { tasks: '1-2', duration: '15-30min', checkpointEvery: 2 },
       medium: { tasks: '2-4', duration: '30-60min', checkpointEvery: 1 },
       large: { tasks: '4-6', duration: '60-120min', checkpointEvery: 1 }
     },
     git: {
       autoCommit: true,
       commitPrefix: '[API]',
       requireCleanTree: true,
       autoTag: true
     },
     execution: {
       pauseOnDeviation: true,
       autoRetry: true,
       maxRetries: 3
     }
   };
   ```

6. **TUTORIAL.md** - Step-by-step advanced tutorial
   - Scenario: Interruption during Phase 2 Wave 2
   - Shows checkpoint creation: `reis checkpoint "Auth basic flow complete"`
   - Shows resume: `reis resume` with context display
   - Shows metrics: `reis visualize --type metrics`
   - Shows deviation handling
   - Demonstrates wave size impact on checkpoints

**WHY:** Advanced example shows real-world complexity and demonstrates power features that differentiate v2.0.
</action>
<verify>
- Directory package/examples/advanced-features/ exists with all files
- TUTORIAL.md walks through interruption → resume scenario
- PLAN.md shows complex wave dependencies
- reis.config.js demonstrates all major config options
- ROADMAP.md has clear phase/wave structure with dependencies
</verify>
<done>Complete advanced-features example created demonstrating checkpoints, resume, metrics, and complex waves</done>
</task>

<task type="auto">
<name>Create migration example and sample configs</name>
<files>
package/examples/migration-example/README.md,
package/examples/migration-example/v1-project/PROJECT.md,
package/examples/migration-example/v1-project/ROADMAP.md,
package/examples/migration-example/v2-project/PROJECT.md,
package/examples/migration-example/v2-project/ROADMAP.md,
package/examples/migration-example/v2-project/reis.config.js,
package/examples/sample-configs/minimal.reis.config.js,
package/examples/sample-configs/team-optimized.reis.config.js,
package/examples/sample-configs/solo-developer.reis.config.js,
package/examples/sample-configs/ci-cd.reis.config.js,
package/examples/sample-configs/README.md
</files>
<action>
Create two example sets:

### A. Migration Example (package/examples/migration-example/)

1. **README.md** - Migration walkthrough
   - Shows v1.x project structure
   - Shows v2.0 project structure (same project, enhanced)
   - Highlights differences
   - Step-by-step migration process
   - What changed, what stayed the same

2. **v1-project/** folder - v1.x style project
   - PROJECT.md, ROADMAP.md without waves
   - Traditional phase-based structure
   - No reis.config.js
   - No wave markers in roadmap

3. **v2-project/** folder - Same project, v2.0 style
   - Same PROJECT.md content
   - ROADMAP.md WITH wave structure
   - Added reis.config.js
   - Wave markers in roadmap: `## Phase 1: Setup [Wave 1: Core, Wave 2: Tests]`

**Show that migration is:**
- Optional (v1.x projects work fine)
- Incremental (adopt features gradually)
- Backward compatible (no forced breaking changes)

### B. Sample Configs (package/examples/sample-configs/)

Create 4 sample reis.config.js files:

1. **minimal.reis.config.js**
   ```javascript
   module.exports = {
     git: { autoCommit: true }
   };
   // Demonstrates: Minimal viable config, rest uses defaults
   ```

2. **team-optimized.reis.config.js**
   ```javascript
   module.exports = {
     waves: {
       small: { tasks: '1-2', duration: '15-30min', checkpointEvery: 3 },
       medium: { tasks: '3-5', duration: '45-90min', checkpointEvery: 1 }
     },
     git: {
       autoCommit: true,
       commitPrefix: '[TEAM]',
       requireCleanTree: true
     },
     execution: {
       pauseOnDeviation: true
     }
   };
   // Demonstrates: Team workflow with strict git requirements
   ```

3. **solo-developer.reis.config.js**
   ```javascript
   module.exports = {
     waves: {
       small: { tasks: '1-3', duration: '30-60min', checkpointEvery: 4 }
     },
     git: {
       autoCommit: false,
       requireCleanTree: false
     },
     execution: {
       pauseOnDeviation: false,
       autoRetry: true
     }
   };
   // Demonstrates: Flexible solo dev workflow with manual commits
   ```

4. **ci-cd.reis.config.js**
   ```javascript
   module.exports = {
     git: {
       autoCommit: true,
       commitPrefix: '[CI]',
       requireCleanTree: true,
       autoTag: false
     },
     execution: {
       pauseOnDeviation: false,
       autoRetry: true,
       maxRetries: 2
     }
   };
   // Demonstrates: CI/CD pipeline config with no pauses
   ```

5. **README.md** - Explains each config scenario and when to use it

**WHY:** Concrete examples make migration less intimidating and configs more discoverable.
</action>
<verify>
- migration-example/ has v1-project and v2-project folders
- Both projects are comparable (same content, different structure)
- README explains migration clearly
- sample-configs/ has 4 config files + README
- Each config has comments explaining the use case
- All configs are valid JavaScript
</verify>
<done>Migration example and 4 sample configs created showing v1→v2 transition and common config patterns</done>
</task>

## Success Criteria
- 3 complete example projects created (basic, advanced, migration)
- 4 sample config files with different scenarios
- All examples are executable and well-documented
- Examples progress from basic → advanced appropriately
- Migration example clearly demonstrates backward compatibility

## Verification
```bash
# Check all examples exist
ls -la package/examples/

# Verify each example has required files
find package/examples -name "README.md" -o -name "reis.config.js"

# Validate all config files load
node -e "require('./package/examples/basic-workflow/reis.config.js')"
node -e "require('./package/examples/advanced-features/reis.config.js')"
node -e "require('./package/examples/sample-configs/minimal.reis.config.js')"

# Count total example files created
find package/examples -type f | wc -l
```
