# REIS Execution Guide

## Quick Start

To execute this plan using REIS methodology:

```bash
# Start with Wave 1 (can run 2 executors in parallel)
reis execute-plan .planning/phases/01-package-infrastructure/01-01-package-setup.PLAN.md
reis execute-plan .planning/phases/01-package-infrastructure/01-02-cli-entry-point.PLAN.md
reis execute-plan .planning/phases/02-installation-system/02-01-installation-script.PLAN.md

# Continue with Wave 2 (can run 2 executors in parallel)
reis execute-plan .planning/phases/03-docs-transformation/03-01-copy-and-transform-docs.PLAN.md
reis execute-plan .planning/phases/04-templates-subagents/04-01-copy-and-transform-templates.PLAN.md
reis execute-plan .planning/phases/04-templates-subagents/04-02-copy-and-transform-subagents.PLAN.md

# And so on...
```

## All Plans by Wave

### 📦 Wave 1: Foundation (No Dependencies - Run in Parallel)

**Phase 1: Package Infrastructure**
1. `.planning/phases/01-package-infrastructure/01-01-package-setup.PLAN.md`
   - Create package.json with metadata
   - Create .npmignore
   - Create directory structure

2. `.planning/phases/01-package-infrastructure/01-02-cli-entry-point.PLAN.md`
   - Create bin/reis.js executable
   - Create lib/index.js module entry
   - Test basic functionality

**Phase 2: Installation System**
3. `.planning/phases/02-installation-system/02-01-installation-script.PLAN.md`
   - Create lib/install.js with ASCII art
   - Implement file copying functions
   - Add success message

---

### 📝 Wave 2: Content Transformation (Depends on Wave 1)

**Phase 3: Documentation Transformation**
4. `.planning/phases/03-docs-transformation/03-01-copy-and-transform-docs.PLAN.md`
   - Copy and transform 8 documentation files
   - All GSD → REIS transformations
   - Validate shortcuts.json

**Phase 4: Templates & Subagents**
5. `.planning/phases/04-templates-subagents/04-01-copy-and-transform-templates.PLAN.md`
   - Copy and transform 5 template files
   - Verify template integrity

6. `.planning/phases/04-templates-subagents/04-02-copy-and-transform-subagents.PLAN.md`
   - Transform gsd_planner.md → reis_planner.md
   - Transform gsd_executor.md → reis_executor.md
   - Transform gsd_project_mapper.md → reis_project_mapper.md

---

### 🔧 Wave 3: CLI Implementation (Depends on Wave 1 - Run 4 in Parallel)

**Phase 5: CLI Core**
7. `.planning/phases/05-cli-core/05-01-command-infrastructure.PLAN.md`
   - Create command-helpers.js utilities
   - Update bin/reis.js with command router
   - Create command implementation guide

8. `.planning/phases/05-cli-core/05-02-core-commands.PLAN.md`
   - Implement: help, version
   - Implement: new, map
   - Implement: requirements, roadmap
   - Wire to CLI (6 commands)

**Phase 6: Phase Management**
9. `.planning/phases/06-cli-phase-mgmt/06-01-phase-commands.PLAN.md`
   - Implement: plan, discuss, research
   - Implement: assumptions, execute, execute-plan
   - Implement: verify
   - Wire to CLI (7 commands)

**Phase 7: Progress & Roadmap**
10. `.planning/phases/07-cli-progress-roadmap/07-01-progress-and-roadmap-commands.PLAN.md`
    - Implement: progress, pause, resume
    - Implement: add, insert, remove
    - Wire to CLI (6 commands)

**Phase 8: Milestones & Utilities**
11. `.planning/phases/08-cli-milestones-utils/08-01-milestone-commands.PLAN.md`
    - Implement milestone with 3 subcommands
    - Wire to CLI (3 commands)

12. `.planning/phases/08-cli-milestones-utils/08-02-todo-and-debug-commands.PLAN.md`
    - Implement: todo, todos, debug
    - Wire to CLI (3 commands)

13. `.planning/phases/08-cli-milestones-utils/08-03-utility-commands.PLAN.md`
    - Implement: update, whats-new, docs, uninstall
    - Wire to CLI (4 commands)

---

### ✅ Wave 4: Quality & Publishing (Sequential - Depends on All Previous)

**Phase 9: Testing & Polish**
14. `.planning/phases/09-testing-polish/09-01-comprehensive-testing.PLAN.md`
    - Test installation and file copying
    - Test all 29 commands systematically
    - Test error handling and edge cases

15. `.planning/phases/09-testing-polish/09-02-polish-and-documentation.PLAN.md`
    - Polish CLI output and formatting
    - Verify and polish documentation
    - Final package.json review

**Phase 10: Publishing**
16. `.planning/phases/10-publishing/10-01-pre-publish-verification.PLAN.md`
    - Test package with npm pack
    - Verify package.json completeness
    - Create publishing checklist

17. `.planning/phases/10-publishing/10-02-npm-publish.PLAN.md`
    - Verify NPM account and package name (checkpoint)
    - Publish to NPM registry (checkpoint)
    - Post-publish verification (checkpoint)

---

## Execution Tips

### Using REIS Executors

Since REIS isn't published yet, you'll need to manually execute plans. Once REIS is published, you can use:

```bash
# Execute a single plan
reis execute-plan .planning/phases/01-package-infrastructure/01-01-package-setup.PLAN.md

# Execute an entire phase
reis execute 1  # Executes all plans in Phase 1
```

### Manual Execution

For now, manually execute each plan by:
1. Opening the .PLAN.md file
2. Following the tasks sequentially
3. Running verification commands
4. Checking done criteria
5. Updating .planning/STATE.md

### Parallel Execution Strategy

**Maximum parallelism:**
- Wave 1: 2 simultaneous executors
- Wave 2: 2 simultaneous executors  
- Wave 3: 4 simultaneous executors (one per phase 5-8)
- Wave 4: Sequential (testing must complete before publishing)

### Tracking Progress

Update `.planning/STATE.md` after each plan:
- Mark phase status
- Update completed work
- Note any blockers
- Track decisions made

## Command Implementation Checklist

Use this to track which commands are implemented:

**Core (6):**
- [ ] help
- [ ] version
- [ ] new
- [ ] map
- [ ] requirements
- [ ] roadmap

**Phase Management (7):**
- [ ] plan
- [ ] discuss
- [ ] research
- [ ] assumptions
- [ ] execute
- [ ] execute-plan
- [ ] verify

**Progress & Roadmap (6):**
- [ ] progress
- [ ] pause
- [ ] resume
- [ ] add
- [ ] insert
- [ ] remove

**Milestones & Utilities (10):**
- [ ] milestone complete
- [ ] milestone discuss
- [ ] milestone new
- [ ] todo
- [ ] todos
- [ ] debug
- [ ] update
- [ ] whats-new
- [ ] docs
- [ ] uninstall

**Total: 29 commands**

## File Transformation Checklist

**Documentation (8):**
- [ ] README.md
- [ ] QUICK_REFERENCE.md
- [ ] INTEGRATION_GUIDE.md
- [ ] WORKFLOW_EXAMPLES.md (renamed from GSD_WORKFLOW_EXAMPLES.md)
- [ ] COMPLETE_COMMANDS.md
- [ ] SHORTCUT_GUIDE.md
- [ ] README_DOCS.md
- [ ] shortcuts.json

**Templates (5):**
- [ ] PLAN.md
- [ ] PROJECT.md
- [ ] REQUIREMENTS.md
- [ ] ROADMAP.md
- [ ] STATE.md

**Subagents (3):**
- [ ] reis_planner.md (from gsd_planner.md)
- [ ] reis_executor.md (from gsd_executor.md)
- [ ] reis_project_mapper.md (from gsd_project_mapper.md)

**Total: 16 files**

## Quick Reference

**Source locations:**
- Docs: `~/.rovodev/gsd/`
- Templates: `~/.rovodev/gsd/templates/`
- Subagents: `~/.rovodev/subagents/`

**Target locations:**
- Docs: `docs/` (in package)
- Templates: `templates/` (in package)
- Subagents: `subagents/` (in package)

**Installation targets:**
- Docs: `~/.rovodev/reis/`
- Templates: `~/.rovodev/reis/templates/`
- Subagents: `~/.rovodev/subagents/`

**Key transformations:**
- `GSD` → `REIS`
- `gsd:` → `reis:`
- `gsd_` → `reis_`
- `Get Shit Done` → `Roadmap Execution & Implementation System`
- `~/.rovodev/gsd/` → `~/.rovodev/reis/`

## Success Metrics

- [ ] Package published to NPM
- [ ] `npx reis` works globally
- [ ] All 29 commands functional
- [ ] All 16 files transformed
- [ ] Documentation accessible at ~/.rovodev/reis/
- [ ] Beautiful CLI with ASCII art
- [ ] Comprehensive help system
- [ ] Zero GSD references (except attribution)

---

**Ready to build REIS!** 🚀

Start with Phase 1, Plan 01-01, and work through the waves systematically.
