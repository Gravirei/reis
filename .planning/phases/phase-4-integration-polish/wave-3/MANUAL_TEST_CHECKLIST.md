# REIS v2.0.0-beta.1 - Manual Testing Checklist

**Version:** 2.0.0-beta.1  
**Date:** 2025-01-16  
**Tester:** _____________  
**Duration:** ~1-2 hours

## Testing Instructions

- Mark each item with ✓ (pass) or ✗ (fail)
- Document any failures in separate ISSUES.md file with reproduction steps
- Retest all failures after fixes
- Aim for 100% pass rate before release
- **DO NOT skip any tests** - all are critical for beta quality

---

## 1. Installation & Setup (10 items)

### 1.1 Global Installation
- [ ] Install via `npm install -g .` from local package directory
- [ ] Verify `reis --version` shows `2.0.0-beta.1`
- [ ] Run `reis --help` and verify all commands listed (init, roadmap, plan, execute, checkpoint, resume, visualize, config, etc.)

### 1.2 Installation Integrity
- [ ] Check subagents installed/accessible (verify subagents/ directory exists)
- [ ] Verify templates copied correctly (templates/ directory accessible)
- [ ] Verify docs accessible in installed package (docs/ directory present)

### 1.3 npx Execution
- [ ] Test `npx @gravirei/reis --version` (simulate fresh user without global install)
- [ ] Test `npx @gravirei/reis help` works without global install

### 1.4 Uninstall/Reinstall
- [ ] Verify `npm uninstall -g @gravirei/reis` removes all files cleanly
- [ ] Re-install after uninstall works without errors
- [ ] Check no permission errors during install (on Linux/Mac, may need sudo)

---

## 2. Core v2.0 Features (15 items)

### 2.1 Config System
- [ ] `reis config init` creates `reis.config.js` with default template
- [ ] `reis config show` displays merged configuration (defaults + user overrides)
- [ ] `reis config validate` validates config files and shows errors for invalid configs
- [ ] Config file loaded automatically when present in project

### 2.2 Wave Execution
- [ ] `reis execute-plan` runs with wave-based execution model
- [ ] Waves execute sequentially (wave 2 starts after wave 1 completes)
- [ ] Wave progress tracked in STATE.md with timestamps
- [ ] Wave execution pauses at checkpoint tasks

### 2.3 Checkpoint Commands
- [ ] `reis checkpoint "milestone reached"` creates manual checkpoint in STATE.md
- [ ] `reis checkpoint --list` shows all checkpoints with timestamps and metadata
- [ ] `reis checkpoint --show <name>` displays specific checkpoint details
- [ ] Checkpoints include git commit hash when in git repo

### 2.4 Resume Command
- [ ] `reis resume` shows smart recommendations for next steps
- [ ] `reis resume --from <checkpoint>` resumes execution from specific checkpoint
- [ ] Resume command shows git diff since checkpoint
- [ ] Resume detects unfinished waves and suggests continuation

### 2.5 Visualization
- [ ] `reis visualize --type progress` renders progress bar chart
- [ ] `reis visualize --type waves` shows wave timeline
- [ ] `reis visualize --type roadmap` displays phase breakdown
- [ ] `reis visualize --type metrics` shows key statistics (velocity, completion rate, etc.)
- [ ] `reis visualize --watch` auto-refreshes visualization (Ctrl+C to exit)

### 2.6 Plan Validation
- [ ] Plan validator catches invalid PLAN.md format
- [ ] Validator detects missing required sections (Objective, Tasks, etc.)
- [ ] Validator shows helpful error messages with line numbers

---

## 3. Backward Compatibility (12 items)

### 3.1 V1.x Project Support
- [ ] Create v1.x style project (no waves, traditional PLAN.md)
- [ ] Run `reis init` in v1.x project - works without errors
- [ ] Execute `reis roadmap` command in v1.x project
- [ ] Run `reis plan <phase>` command in v1.x project

### 3.2 Legacy Commands
- [ ] Test `reis progress` command (should still work)
- [ ] Verify STATE.md works without wave tracking fields
- [ ] Run `reis execute` (non-wave execution) on old-style plan
- [ ] Test milestone commands (`reis milestone add`, `reis milestone list`)

### 3.3 Graceful Degradation
- [ ] Verify todo commands work (`reis todo add`, `reis todo list`)
- [ ] Check docs/help commands function without config file
- [ ] Test `reis update` command (self-update functionality)
- [ ] Confirm no errors/crashes with missing `reis.config.js`

---

## 4. Git Integration (8 items)

### 4.1 Auto-Commit Features
- [ ] Auto-commit after wave completion (when `autoCommit: true` in config)
- [ ] Checkpoint creates git commit with proper message format
- [ ] Commit messages include wave context and metadata

### 4.2 Git State Detection
- [ ] Git status checked before wave operations
- [ ] Dirty working tree handled appropriately (warning shown)
- [ ] Branch detection works (shows current branch in status)

### 4.3 Git Operations
- [ ] Tags created for milestones (when milestone command used)
- [ ] Git diff shown during `reis resume` (shows changes since checkpoint)

---

## 5. Error Handling & Edge Cases (10 items)

### 5.1 Invalid Input Handling
- [ ] Invalid PLAN.md shows helpful error message (not just stack trace)
- [ ] Missing dependencies detected and reported clearly
- [ ] Circular dependencies caught with clear explanation

### 5.2 Config Errors
- [ ] Invalid config syntax shows validation errors with line numbers
- [ ] Missing required config fields detected
- [ ] Invalid config values (wrong types) reported clearly

### 5.3 Operational Errors
- [ ] Resume without checkpoints handled gracefully (shows appropriate message)
- [ ] `execute-plan` without PLAN.md errors clearly with instructions
- [ ] Visualize without STATE.md handled (shows empty state message)

### 5.4 Robustness
- [ ] Git errors reported clearly (e.g., not in git repo when git operation expected)
- [ ] Interrupted wave execution recoverable (can resume after crash)
- [ ] Deviation detection works (detects when execution differs from plan)

---

## 6. Documentation & Help (8 items)

### 6.1 Core Documentation
- [ ] README.md renders correctly (check on GitHub or local markdown viewer)
- [ ] CHANGELOG.md has all phases and wave summaries
- [ ] All docs/ files accessible and properly formatted

### 6.2 Migration & Guides
- [ ] MIGRATION_GUIDE.md makes sense (can follow to upgrade v1 to v2)
- [ ] V2_FEATURES.md accurately describes new features
- [ ] WAVE_EXECUTION.md explains wave model clearly

### 6.3 Examples & Help
- [ ] Examples load and run (check examples/basic-workflow, examples/advanced-features)
- [ ] Sample configs are valid (examples/*/reis.config.js)
- [ ] Help text for all commands accurate (`reis <command> --help`)

---

## 7. Performance & Stability (7 items)

### 7.1 Performance Benchmarks
- [ ] Config loads in <50ms (run `time reis config show`)
- [ ] STATE.md updates in <100ms (time checkpoint creation)
- [ ] Wave parsing completes in <150ms (observe execute-plan startup time)
- [ ] Visualization renders in <10ms (observe visualize command response)

### 7.2 Stability Tests
- [ ] No memory leaks during long operations (run multiple waves in sequence)
- [ ] Large PLAN.md files handled (test with 50+ tasks)
- [ ] Multiple waves execute without slowdown (performance consistent across waves)

---

## Test Summary

**Total Items:** 70  
**Passed:** _____ / 70  
**Failed:** _____ / 70  
**Pass Rate:** _____% 

**Critical Issues Found:** _____

**Blocker Issues (must fix before release):**
- _________________
- _________________

**Minor Issues (can defer to patch release):**
- _________________
- _________________

**Notes:**
_________________________________________________________________________________
_________________________________________________________________________________
_________________________________________________________________________________

---

## Sign-Off

**Tester:** _____________  
**Date Completed:** _____________  
**Recommendation:** ☐ Ready for Beta Release  ☐ Needs Fixes  ☐ Not Ready  

**Next Steps:**
_________________________________________________________________________________
