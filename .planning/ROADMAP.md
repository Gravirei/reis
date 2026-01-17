# Roadmap: REIS NPM Package

## Milestone 1: Core Package Foundation

### Phase 1: Package Infrastructure & Structure
**Goal:** Create the foundational NPM package structure with all directories and core configuration files.

**Deliverables:**
- package.json with correct metadata and scripts
- Directory structure (bin/, lib/, docs/, templates/, subagents/)
- Basic CLI entry point (bin/reis.js)
- .npmignore file

**Success Criteria:**
- Package structure is valid and complete
- `node bin/reis.js --help` runs without errors
- All directories are created

---

### Phase 2: Installation System
**Goal:** Build the beautiful installation experience with ASCII art, confirmation prompts, and file copying to ~/.rovodev/reis/.

**Deliverables:**
- lib/install.js with ASCII art banner
- Confirmation prompt system
- File copying logic to ~/.rovodev/reis/
- Error handling for installation
- Post-install script configuration

**Success Criteria:**
- Installation displays beautiful ASCII art
- User can confirm/cancel installation
- Files are correctly copied to ~/.rovodev/reis/
- Installation is idempotent (safe to run multiple times)

---

### Phase 3: Content Transformation - Documentation
**Goal:** Transform all 8 GSD documentation files to REIS, updating all references, commands, and branding.

**Deliverables:**
- 8 transformed documentation files in docs/
- All "GSD" → "REIS" transformations complete
- All "gsd:" → "reis:" command references updated
- All file paths updated from gsd/ to reis/

**Success Criteria:**
- All 8 files exist in docs/ directory
- No GSD references remain (except in credits/acknowledgments)
- All command examples use "reis" prefix
- Documentation is clear and accurate

---

### Phase 4: Content Transformation - Templates & Subagents
**Goal:** Transform the 5 template files and 3 subagent files, updating all references and ensuring compatibility with REIS.

**Deliverables:**
- 5 template files in templates/ directory
- 3 transformed subagent files (reis_planner.md, reis_executor.md, reis_project_mapper.md)
- All gsd_ → reis_ transformations
- All file paths and references updated

**Success Criteria:**
- All 8 files are transformed and placed correctly
- Subagents reference REIS, not GSD
- Templates work with REIS file structure
- No broken references or paths

---

### Phase 5: CLI Command System (Part 1: Core)
**Goal:** Implement the command parsing system and core commands (help, version, new, map, requirements, roadmap).

**Deliverables:**
- lib/commands/ directory structure
- Command router in bin/reis.js
- help.js - Show all commands
- version.js - Show version info
- new.js - Initialize new project
- map.js - Map existing codebase
- requirements.js - Define requirements
- roadmap.js - Create roadmap

**Success Criteria:**
- `reis help` displays all 29 commands
- `reis version` shows correct version
- `reis new [idea]` outputs correct prompt
- All 6 core commands work correctly

---

### Phase 6: CLI Command System (Part 2: Phase Management)
**Goal:** Implement phase-related commands (plan, discuss, research, assumptions, execute, execute-plan, verify).

**Deliverables:**
- plan.js - Plan phase N
- discuss.js - Discuss phase N
- research.js - Research phase N
- assumptions.js - List phase assumptions
- execute.js - Execute phase N
- execute-plan.js - Execute specific plan
- verify.js - Verify phase work

**Success Criteria:**
- All 7 phase commands work correctly
- Commands output appropriate prompts for Rovo Dev
- Error handling for invalid phase numbers

---

### Phase 7: CLI Command System (Part 3: Progress & Roadmap)
**Goal:** Implement progress tracking and roadmap modification commands.

**Deliverables:**
- progress.js - Show project progress
- pause.js - Pause work with handoff
- resume.js - Resume from last session
- add.js - Add phase to roadmap
- insert.js - Insert phase at position
- remove.js - Remove phase

**Success Criteria:**
- All 6 commands work correctly
- Progress command shows useful information
- Roadmap modification commands output correct prompts

---

### Phase 8: CLI Command System (Part 4: Milestones & Utilities)
**Goal:** Implement milestone management, TODOs, debugging, and utility commands.

**Deliverables:**
- milestone.js - Handle milestone commands (complete, discuss, new)
- todo.js - Add TODO items
- todos.js - Check TODOs
- debug.js - Systematic debugging
- update.js - Check for updates
- whats-new.js - Show what's new
- docs.js - Open documentation
- uninstall.js - Remove REIS installation

**Success Criteria:**
- All 11 remaining commands work correctly
- Milestone commands handle subcommands properly
- Uninstall command safely removes ~/.rovodev/reis/

---

### Phase 9: Testing & Polish
**Goal:** Test the complete package, ensure all commands work, fix bugs, and polish the user experience.

**Deliverables:**
- Manual testing of all 29 commands
- Bug fixes
- Improved error messages
- Documentation updates
- Final polish on ASCII art and output formatting

**Success Criteria:**
- All 29 commands tested and working
- No critical bugs
- User experience is smooth and intuitive
- Documentation is complete and accurate

---

### Phase 10: Publishing Preparation
**Goal:** Prepare the package for NPM publication with final checks, version tagging, and publishing.

**Deliverables:**
- Final package.json review
- .npmignore configuration
- Version 1.0.0 tag
- NPM publication
- Post-publication verification

**Success Criteria:**
- Package successfully published to NPM
- `npx reis` works from NPM registry
- All files are included in published package
- Installation works correctly from NPM

---

## Summary

**Total Phases:** 10
**Estimated Completion:** Complete package ready for use

**Key Milestones:**
1. ✅ Phase 1-2: Foundation and installation system
2. ✅ Phase 3-4: Content transformation complete
3. ✅ Phase 5-8: All 29 commands implemented
4. ✅ Phase 9-10: Tested, polished, and published
