# Plan: 4-3-3 - Package Preparation & Quality Assurance

## Objective
Update package.json to v2.0.0-beta.1, verify package contents, run comprehensive QA testing, and ensure backward compatibility.

## Context
- Current version: 1.2.3
- Target version: v2.0.0-beta.1
- 309 tests passing, 4 pending
- All Phase 1-4 Wave 1-2 features complete
- Need to verify npm package includes all necessary files
- Must test installation flows and backward compatibility

## Dependencies
- Depends on: Wave 3.1 (docs), Wave 3.2 (examples)
- Blocks: Wave 3.4 (release preparation needs verified package)

## Tasks

<task type="auto">
<name>Update package.json to v2.0.0-beta.1</name>
<files>package.json</files>
<action>
Update package.json for beta release:

1. **Change version**: `"version": "1.2.3"` → `"version": "2.0.0-beta.1"`

2. **Verify "files" field** includes all necessary directories:
   ```json
   "files": [
     "bin",
     "lib",
     "docs",
     "templates",
     "subagents",
     "examples",
     "README.md",
     "LICENSE",
     "CHANGELOG.md"
   ]
   ```
   - Add "examples" if not present
   - Add "CHANGELOG.md" if not present

3. **Update description** to mention v2.0 features:
   ```json
   "description": "Roadmap Execution & Implementation System v2.0 - Wave-based execution with checkpoints, metrics, and visualization for Atlassian Rovo Dev"
   ```

4. **Verify keywords** include v2.0 relevant terms:
   - Ensure includes: "wave-execution", "checkpoints", "metrics", "visualization"
   - Add if missing

5. **Verify engines**: Should be `"node": ">=18.0.0"` (no change needed)

6. **Verify dependencies** are all necessary:
   - chalk: ^4.1.2 (for colored output) ✓
   - commander: ^11.1.0 (for CLI) ✓
   - inquirer: ^8.2.6 (for interactive prompts) ✓

7. **Keep all other fields unchanged** (repository, bugs, homepage, license, author)

**DO NOT:**
- Change dependency versions (already tested with current versions)
- Modify scripts section
- Change bin or main fields
- Remove any existing fields

**WHY:** Beta version signals major changes while indicating it's pre-release. Package metadata must accurately reflect v2.0 capabilities.
</action>
<verify>
- package.json version is "2.0.0-beta.1"
- "files" field includes "examples" and "CHANGELOG.md"
- Description mentions v2.0 features
- All dependencies intact
- npm pack --dry-run succeeds
</verify>
<done>package.json updated to v2.0.0-beta.1 with complete files list and accurate metadata</done>
</task>

<task type="auto">
<name>Run comprehensive test suite and quality checks</name>
<files>test/, lib/, package.json</files>
<action>
Execute comprehensive quality assurance testing:

1. **Run full test suite**:
   ```bash
   npm test
   ```
   - Verify all 309+ tests pass
   - Note any new pending tests
   - Check for test timeouts or flakiness

2. **Verify test coverage** by checking test counts per module:
   ```bash
   npm test 2>&1 | grep -E "passing|pending|failing"
   ```

3. **Check for console errors** in test output:
   ```bash
   npm test 2>&1 | grep -i "error" | grep -v "showError" | grep -v "error handling"
   ```

4. **Verify package contents** with dry-run:
   ```bash
   npm pack --dry-run 2>&1 | tee /tmp/package-contents.txt
   ```
   - Check output includes all expected directories
   - Verify file count is reasonable (should be 100+ files)
   - Ensure no test files are included

5. **Validate all config files load**:
   ```bash
   node -e "require('./lib/utils/config.js')"
   node -e "require('./lib/utils/state-manager.js')"
   node -e "require('./lib/utils/git-integration.js')"
   node -e "require('./lib/utils/wave-executor.js')"
   node -e "require('./lib/utils/metrics-tracker.js')"
   node -e "require('./lib/utils/visualizer.js')"
   node -e "require('./lib/utils/plan-validator.js')"
   ```

6. **Check for syntax errors** in all JavaScript files:
   ```bash
   find lib -name "*.js" -exec node --check {} \;
   find test -name "*.js" -exec node --check {} \;
   ```

7. **Verify no uncommitted changes** that should be in package:
   ```bash
   git status --short
   ```

**WHY:** Comprehensive testing prevents regression and ensures package quality before release.
</action>
<verify>
- npm test shows 309+ passing tests
- npm pack --dry-run succeeds
- All utility modules load without error
- No syntax errors in any .js files
- Package contents include all required files
- No unexpected test failures
</verify>
<done>Full test suite passing, package contents verified, no quality issues detected</done>
</task>

<task type="auto">
<name>Create and execute manual testing checklist</name>
<files>.planning/phases/phase-4-integration-polish/wave-3/MANUAL_TEST_CHECKLIST.md</files>
<action>
Create comprehensive manual test checklist in .planning/phases/phase-4-integration-polish/wave-3/MANUAL_TEST_CHECKLIST.md

Structure the checklist into sections:

### 1. Installation & Setup (10 items)
- [ ] Install via npm install -g from local package
- [ ] Verify `reis --version` shows 2.0.0-beta.1
- [ ] Run `reis help` and verify all commands listed
- [ ] Check subagents installed in ~/.rovodev/subagents/
- [ ] Verify templates copied correctly
- [ ] Test npx execution without global install
- [ ] Verify uninstall removes all files
- [ ] Re-install after uninstall works
- [ ] Check no permission errors during install
- [ ] Verify docs accessible in installed package

### 2. Core v2.0 Features (15 items)
- [ ] `reis config init` creates reis.config.js
- [ ] `reis config show` displays merged config
- [ ] `reis config validate` validates config files
- [ ] `reis execute-plan` runs with wave execution
- [ ] Waves execute sequentially with checkpoints
- [ ] `reis checkpoint "message"` creates manual checkpoint
- [ ] `reis checkpoint --list` shows all checkpoints
- [ ] `reis resume` shows smart recommendations
- [ ] `reis resume --from <checkpoint>` works
- [ ] `reis visualize --type progress` renders chart
- [ ] `reis visualize --type waves` shows timeline
- [ ] `reis visualize --type roadmap` displays phases
- [ ] `reis visualize --type metrics` shows statistics
- [ ] `reis visualize --watch` auto-refreshes
- [ ] Plan validator catches invalid PLAN.md

### 3. Backward Compatibility (12 items)
- [ ] Create v1.x style project (no waves)
- [ ] Run `reis init` in v1.x project
- [ ] Execute `reis roadmap` command
- [ ] Run `reis plan` command
- [ ] Test `reis progress` command
- [ ] Verify STATE.md works without wave tracking
- [ ] Run `reis execute` (non-wave execution)
- [ ] Test all milestone commands
- [ ] Verify todo commands work
- [ ] Check docs/help commands function
- [ ] Test update command
- [ ] Confirm no errors with missing reis.config.js

### 4. Git Integration (8 items)
- [ ] Auto-commit after wave completion
- [ ] Checkpoint creates git commit
- [ ] Commit messages include wave context
- [ ] Git status checked before operations
- [ ] Dirty tree handled appropriately
- [ ] Branch detection works
- [ ] Tags created for milestones
- [ ] Git diff shown during resume

### 5. Error Handling & Edge Cases (10 items)
- [ ] Invalid PLAN.md shows helpful error
- [ ] Missing dependencies detected
- [ ] Circular dependencies caught
- [ ] Invalid config shows validation errors
- [ ] Resume without checkpoints handled
- [ ] Execute-plan without PLAN.md errors clearly
- [ ] Visualize without STATE.md handled
- [ ] Git errors reported clearly
- [ ] Interrupted wave execution recoverable
- [ ] Deviation detection works

### 6. Documentation & Help (8 items)
- [ ] README.md renders correctly on GitHub
- [ ] CHANGELOG.md has all phases
- [ ] All docs/ files accessible
- [ ] Migration guide makes sense
- [ ] Examples load and run
- [ ] Sample configs are valid
- [ ] Help text for all commands accurate
- [ ] Links in docs work

### 7. Performance & Stability (7 items)
- [ ] Config loads in <50ms
- [ ] STATE.md updates in <100ms
- [ ] Wave parsing completes in <150ms
- [ ] Visualization renders in <10ms
- [ ] No memory leaks during long operations
- [ ] Large PLAN.md files handled
- [ ] Multiple waves execute without slowdown

**Testing Instructions:**
- Mark each item as you test
- Note any failures in separate ISSUES.md file
- Retest after any fixes
- Aim for 100% pass rate before release

**DO NOT:**
- Skip any tests (all are critical)
- Test in production environment
- Ignore edge cases

**WHY:** Manual testing catches UX issues and real-world scenarios that automated tests miss.
</action>
<verify>
- MANUAL_TEST_CHECKLIST.md created with 70 test items
- Checklist organized into 7 logical sections
- Each item is clear and testable
- Testing instructions included
</verify>
<done>Comprehensive 70-item manual test checklist created covering installation, features, compatibility, errors, docs, and performance</done>
</task>

<task type="checkpoint:human-verify">
<name>Execute manual testing and verify all items pass</name>
<files>.planning/phases/phase-4-integration-polish/wave-3/MANUAL_TEST_CHECKLIST.md</files>
<action>
**Human verification required**: Execute the manual testing checklist.

This checkpoint requires human interaction to:
1. Go through each item in MANUAL_TEST_CHECKLIST.md
2. Test each feature manually
3. Mark items as complete or note failures
4. Document any issues discovered

**Testing approach:**
- Use fresh terminal sessions for installation tests
- Test on clean project directories
- Simulate real developer workflows
- Try to break things intentionally

**Expected duration:** 1-2 hours for thorough testing

**When complete:**
- All 70 items should be marked with ✓ or ✗
- Any failures documented with reproduction steps
- Critical issues fixed before proceeding to release prep
- Report back on completion status

**Note:** This is the final quality gate before beta release.
</action>
<verify>
Manual testing checklist completed with results documented
</verify>
<done>Manual testing complete with 90%+ pass rate and all critical issues addressed</done>
</task>

## Success Criteria
- package.json updated to v2.0.0-beta.1
- All 309+ automated tests passing
- npm pack --dry-run succeeds
- 70-item manual test checklist created
- Manual testing executed with high pass rate
- Backward compatibility verified
- No critical bugs detected

## Verification
```bash
# Verify version updated
grep "version" package.json

# Run full test suite
npm test

# Verify package contents
npm pack --dry-run

# Check package includes examples and docs
npm pack --dry-run | grep -E "(examples|docs|CHANGELOG)"

# Validate syntax of all JS files
find lib test -name "*.js" -exec node --check {} \; 2>&1 | grep -v "Syntax OK"
```
