# Plan: 4-2 - Documentation and Project Completion

## Objective
Complete project documentation, update README and CHANGELOG, create verification guide with FR4.1 details, and finalize the REIS Verifier for production use.

## Context
This is the final wave. All verification components are implemented, including FR4.1 Feature Completeness Validation. Now we document everything and prepare for release.

**Key Deliverables:**
- Update README.md with verifier documentation
- Create comprehensive docs/VERIFICATION.md guide
- Document FR4.1 feature completeness validation
- Add examples of verification workflows
- Update CHANGELOG.md
- Final integration testing

## Dependencies
- Wave 4.1 (All tests passing)
- All previous phases complete

## Tasks

<task type="auto">
<name>Update README.md with verifier documentation</name>
<files>README.md</files>
<action>
Add comprehensive documentation about the reis_verifier to the main README.

**Locate:** Find the Commands section or Usage section in README.md

**Add Verification Section:**

```markdown
### Verification

Verify that executed plans meet all success criteria and feature completeness requirements.

```bash
# Verify a phase
reis verify 2
reis verify phase-2
reis verify core-implementation

# Verify specific plan
reis verify path/to/plan.PLAN.md

# Options
reis verify 2 --verbose      # Detailed output
reis verify 2 --strict       # Fail on warnings
```

**What Gets Verified:**

1. **Feature Completeness (FR4.1)** - Critical
   - Verifies ALL planned tasks are implemented
   - Checks files, functions, classes, endpoints exist
   - Reports missing deliverables with evidence
   - **Requires 100% task completion to pass**

2. **Test Results**
   - Runs `npm test`
   - Reports pass/fail counts
   - Shows failing test details

3. **Success Criteria**
   - Validates each criterion from PLAN.md
   - Documents evidence
   - Reports unmet criteria

4. **Code Quality**
   - Syntax validation
   - Linting (if configured)
   - Quality scoring

5. **Documentation**
   - Checks README.md, CHANGELOG.md
   - Reports completeness

**Verification Report:**

Generated at `.planning/verification/{phase}/VERIFICATION_REPORT.md` with:
- Executive summary with overall status
- **Feature Completeness breakdown** (task-by-task)
- Test results and failures
- Success criteria validation
- Code quality metrics
- Actionable recommendations

**FR4.1: Why Feature Completeness Matters:**

Tests passing ≠ features complete. Executors may skip tasks without errors.

FR4.1 catches this by:
- Parsing all tasks from PLAN.md
- Verifying each deliverable exists (files, functions, tests)
- Calculating completion: 100% = PASS, <100% = FAIL

**Example:**

```bash
$ reis verify phase-2

🔍 REIS Verifier
📄 Plan: .planning/phase-2/plan.PLAN.md

Verification Scope:
  Tasks: 3
  Success Criteria: 6

🔄 Running verification...

❌ VERIFICATION FAILED

Issues found:
  - Feature Completeness: 66% (1 task incomplete)
  - Task 2: Build Password Reset - INCOMPLETE
    Missing: src/auth/password-reset.js, sendResetEmail()
  - 1 test failing (related to incomplete task)

Report: .planning/verification/phase-2/VERIFICATION_REPORT.md

Action Required: Complete all tasks before proceeding
```

After fixing:
```bash
$ reis verify phase-2

✅ VERIFICATION PASSED

All checks passed:
  ✅ Feature Completeness: 100% (3/3 tasks)
  ✅ Tests: 18/18 passing
  ✅ Success Criteria: 6/6 met
  ✅ Code Quality: PASS

Ready to proceed to Phase 3
```

**See also:** `docs/VERIFICATION.md` for detailed verification guide.
```

**Integration Note:** Place this after the `execute-plan` section and before the Advanced Usage section.

</action>
<verify>
```bash
# Check README was updated
grep -q "reis verify\|Verification" README.md && echo "✅ Verification section added to README"

# Verify FR4.1 mentioned
grep -q "FR4.1\|Feature Completeness" README.md && echo "✅ FR4.1 documented in README"

# Check for examples
grep -q "reis verify.*phase" README.md && echo "✅ Verification examples present"

# Verify comprehensive coverage
grep -A50 "### Verification" README.md | grep -q "Test Results\|Success Criteria\|Code Quality" && echo "✅ All verification aspects documented"
```
</verify>
<done>
- README.md updated with comprehensive verification documentation
- Verification command usage and options documented
- All 5 verification aspects explained (FR4.1, tests, criteria, quality, docs)
- FR4.1 Feature Completeness prominently featured
- Example workflows showing failure and success
- Clear explanation of 100% completion requirement
- Links to detailed guide (docs/VERIFICATION.md)
</done>
</task>

<task type="auto">
<name>Create comprehensive VERIFICATION.md guide</name>
<files>docs/VERIFICATION.md</files>
<action>
Create detailed verification guide explaining all aspects including FR4.1.

**Content:**

```markdown
# REIS Verification Guide

## Overview

The REIS Verifier (`reis_verifier` subagent) provides automated verification of execution results against plan specifications. It ensures not only that tests pass, but that **all planned features are actually implemented** (FR4.1).

## Why Verification Matters

**The Problem:** Executors (human or AI) may skip tasks, leaving features unimplemented without errors or test failures.

**The Solution:** FR4.1 Feature Completeness Validation catches incomplete implementations by verifying that ALL planned tasks and deliverables exist in the codebase.

## Verification Protocol

The verifier follows a 7-step protocol:

1. **Load Verification Context** - Parse PLAN.md for tasks and criteria
2. **Run Test Suite** - Execute `npm test`, parse results
3. **Validate Code Quality** - Check syntax, run linter
4. **Validate Success Criteria & Feature Completeness (FR4.1)** - CRITICAL
5. **Verify Documentation** - Check README, CHANGELOG
6. **Generate Report** - Create VERIFICATION_REPORT.md
7. **Update STATE.md** - Record verification results

## FR4.1: Feature Completeness Validation (Critical)

### What It Does

Verifies that ALL tasks from PLAN.md are completely implemented:

1. **Parse Tasks** - Extract all `<task>` blocks from PLAN.md
2. **Extract Deliverables** - Identify expected files, functions, classes, endpoints
3. **Verify Existence** - Check that each deliverable exists in codebase
4. **Calculate Completion** - Tasks completed / Total tasks = %
5. **Report** - Show evidence for complete tasks, missing items for incomplete

### Verification Methods

**File Existence:**
```bash
# Direct check
test -f src/auth/login.js && echo "Found"

# Git ls-files (handles renames)
git ls-files | grep "login.js"
```

**Code Patterns:**
```bash
# Function/class search
grep -r "function authenticateUser" src/
grep -r "class UserModel" src/

# Endpoint search
grep -r "post('/api/login'" routes/
```

**Test Presence:**
```bash
# Check for corresponding test file
test -f test/auth/login.test.js
```

### Completion Calculation

```
Completion % = (Tasks Complete / Total Tasks) × 100

100% = PASS ✅
<100% = FAIL ❌
```

**Why 100% Required:**

Incomplete implementations cause downstream issues:
- Missing features break dependent tasks
- Tests may pass but functionality is absent
- Integration problems in later phases

### Example: Detecting Incomplete Implementation

**PLAN.md:**
```xml
<task type="auto">
<name>Build User Login</name>
<files>src/auth/login.js, test/auth/login.test.js</files>
<action>
Implement authenticateUser() function that validates credentials
and returns JWT token.
</action>
</task>

<task type="auto">
<name>Build Password Reset</name>
<files>src/auth/password-reset.js, test/auth/password-reset.test.js</files>
<action>
Implement sendResetEmail() function that generates reset token
and sends email.
</action>
</task>
```

**Actual Implementation:**
- Task 1: ✅ login.js and authenticateUser() exist
- Task 2: ❌ password-reset.js MISSING, sendResetEmail() NOT FOUND

**FR4.1 Detection:**
```markdown
## Feature Completeness (FR4.1)

**Status:** ❌ INCOMPLETE (50%)
**Tasks Completed:** 1/2

### Task-by-Task Analysis

#### ✅ Task: Build User Login
**Status:** COMPLETE
**Evidence:**
- file: `src/auth/login.js` (confidence: 100%)
- function: `src/auth/login.js:15` (confidence: 90%)
- test: `test/auth/login.test.js` (confidence: 100%)

#### ❌ Task: Build Password Reset
**Status:** INCOMPLETE - FEATURE MISSING
**Missing Deliverables:**
- file: `src/auth/password-reset.js` NOT FOUND
- function: `sendResetEmail` NOT FOUND (0 matches)
- test: `test/auth/password-reset.test.js` NOT FOUND

**Search Evidence:**
```bash
$ git ls-files | grep "password-reset"
# No matches

$ grep -r "sendResetEmail" src/
# No matches
```

**Impact:** HIGH - Critical authentication feature missing
**Recommendation:** Implement src/auth/password-reset.js with sendResetEmail()
```

**Result:** Verification FAILS (50% < 100%)

## Running Verification

### Basic Usage

```bash
# Verify current phase
reis verify 2

# Verify by phase name
reis verify core-implementation

# Verify specific plan
reis verify .planning/phases/2-core/2-1-command.PLAN.md
```

### Options

```bash
--verbose, -v    # Show detailed output
--strict, -s     # Fail on warnings (not just errors)
```

### Interpreting Results

**✅ PASSED:**
- All tasks complete (100%)
- All tests passing
- All success criteria met
- Code quality acceptable

**❌ FAILED:**
- Tasks incomplete (<100%)
- Tests failing
- Success criteria unmet
- Code quality errors

**⚠️ PASSED WITH WARNINGS:**
- All tasks complete (100%)
- Tests passing
- Minor issues (no tests, lint warnings, etc.)

## Verification Report

### Report Location

`.planning/verification/{phase-name}/VERIFICATION_REPORT.md`

### Report Structure

1. **Executive Summary** - Overall status, key metrics
2. **Feature Completeness (FR4.1)** - Task-by-task breakdown
3. **Test Results** - Pass/fail counts, failures
4. **Success Criteria** - Individual criterion status
5. **Code Quality** - Syntax, linting results
6. **Documentation** - Doc completeness
7. **Issues Summary** - Categorized by severity
8. **Recommendations** - Actionable next steps
9. **Next Steps** - Re-verification or proceed

### Key Sections

**Feature Completeness (Most Important):**
- Shows each task's status (COMPLETE/INCOMPLETE)
- Provides evidence for completed tasks
- Lists missing deliverables with search evidence
- Assesses impact (HIGH/MEDIUM/LOW)
- Gives specific recommendations

**Test Results:**
- Framework detected
- Pass/fail/pending counts
- Failed test details (file, line, error)

**Success Criteria:**
- Each criterion validated individually
- Evidence for met criteria
- Explanation for unmet criteria

## STATE.md Integration

Verification results are recorded in `.planning/STATE.md`:

```markdown
### Verification: Phase 2 - Core Implementation
**Date:** 2024-01-15T14:30:00Z
**Status:** FAIL
**Verifier:** reis_verifier v1.0

**Results:**
- Tests: 17/18 passed
- Feature Completeness: 1/2 tasks (50%)
- Success Criteria: 5/6 met
- Code Quality: PASS

**Issues:** 2 critical, 1 major, 0 minor

**Report:** `.planning/verification/phase-2-core-implementation/VERIFICATION_REPORT.md`

**Action Required:** Fix issues and re-verify before proceeding
- **Feature Completeness:** 1 tasks incomplete
```

## Iteration Workflow

### 1. Execute Plan

```bash
reis execute-plan phase-2
```

### 2. Verify Results

```bash
reis verify phase-2
```

### 3A. If Failed - Fix and Re-verify

```bash
# Read report
cat .planning/verification/phase-2/VERIFICATION_REPORT.md

# Fix issues (implement missing tasks, fix tests, etc.)
# ...

# Re-verify
reis verify phase-2
```

### 3B. If Passed - Proceed

```bash
# Move to next phase
reis plan phase-3
reis execute-plan phase-3
reis verify phase-3
```

## Best Practices

### For Plan Creators

1. **Be Specific in PLAN.md:**
   - List all expected files in `<files>` tags
   - Mention key functions/classes in `<action>`
   - Clear acceptance criteria

2. **Make Tasks Atomic:**
   - One clear responsibility per task
   - Independently verifiable
   - 15-45 minutes of work

3. **Write Verifiable Success Criteria:**
   - Observable outcomes
   - Testable assertions
   - Clear evidence

### For Executors

1. **Complete ALL Tasks:**
   - Don't skip tasks (FR4.1 will catch it)
   - Implement all deliverables
   - Add tests for new features

2. **Test Before Submitting:**
   - Run `npm test` locally
   - Check that files exist
   - Verify functionality

3. **Document Changes:**
   - Update README if needed
   - Add CHANGELOG entry
   - Comment code appropriately

### For Verifiers

1. **Read Full Report:**
   - Don't just check pass/fail
   - Understand what's missing
   - Assess impact

2. **Prioritize Issues:**
   - Fix critical first (incomplete tasks, test failures)
   - Then major (unmet criteria)
   - Then minor (warnings)

3. **Re-verify After Fixes:**
   - Don't assume fixes work
   - Run verification again
   - Confirm 100% completion

## Troubleshooting

### "Feature Completeness: 66%" - Why Did It Fail?

FR4.1 requires 100% task completion. Check the report:
- Which tasks are incomplete?
- What deliverables are missing?
- Implement missing features and re-verify

### "Tests Pass But Verification Fails"

This is exactly what FR4.1 catches:
- Tests might not cover all features
- Some tasks may be unimplemented
- Check Feature Completeness section in report

### "No Tests Found" - Is This a Failure?

No, missing tests = WARNING, not failure:
- Verification can pass without tests
- But tests are recommended
- Add tests in future iterations

### "Linting Errors" - Do They Block Verification?

Yes, by default:
- Syntax errors always fail
- Lint errors fail by default
- Use `--lenient` to allow lint errors (not recommended)

## Advanced Usage

### Custom Verification Criteria

Add project-specific checks by extending reis_verifier.md specification.

### Integration with CI/CD

```yaml
# .github/workflows/verify.yml
name: Verify Implementation
on: [push]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npx reis verify ${{ github.ref_name }}
```

### Batch Verification

```bash
# Verify all phases
for phase in 1 2 3 4; do
  echo "Verifying phase $phase..."
  reis verify $phase
done
```

## FAQ

**Q: Why is 100% completion required?**
A: Incomplete features cause downstream issues and technical debt.

**Q: Can I skip FR4.1 checks?**
A: No, feature completeness is non-negotiable for quality.

**Q: What if a task was refactored?**
A: FR4.1 handles renames/moves with confidence scoring and git history.

**Q: How long does verification take?**
A: 30 seconds to 2 minutes depending on test suite size.

**Q: Can I verify without tests?**
A: Yes, but you'll get a warning. Tests are recommended.

## Summary

REIS Verification ensures:
- ✅ All planned tasks are implemented (FR4.1)
- ✅ Tests pass
- ✅ Success criteria met
- ✅ Code quality acceptable
- ✅ Documentation complete

**Key Takeaway:** Verification is not just about tests. FR4.1 Feature Completeness ensures nothing is missing.

---

For technical details, see `subagents/reis_verifier.md`
```

Save to `docs/VERIFICATION.md`
</action>
<verify>
```bash
# Check guide was created
test -f docs/VERIFICATION.md && echo "✅ Verification guide created"

# Verify FR4.1 coverage
grep -q "FR4.1.*Feature Completeness" docs/VERIFICATION.md && echo "✅ FR4.1 documented"

# Check for examples
grep -c "Example\|```bash" docs/VERIFICATION.md

# Verify comprehensive coverage
grep -q "Why Verification Matters\|Verification Protocol\|Iteration Workflow" docs/VERIFICATION.md && echo "✅ Comprehensive guide"

wc -l docs/VERIFICATION.md
```
</verify>
<done>
- docs/VERIFICATION.md created with comprehensive guide (~500+ lines)
- Explains why verification matters (FR4.1 problem/solution)
- Documents 7-step verification protocol
- FR4.1 Feature Completeness extensively covered
- Detection methods explained (file existence, code patterns, tests)
- Completion calculation (100% requirement)
- Example of incomplete task detection
- Usage instructions and options
- Report structure explained
- STATE.md integration documented
- Iteration workflow (execute → verify → fix → re-verify)
- Best practices for plan creators, executors, verifiers
- Troubleshooting section
- FAQ section
</done>
</task>

<task type="auto">
<name>Update CHANGELOG.md with verifier release</name>
<files>CHANGELOG.md</files>
<action>
Add comprehensive changelog entry for the REIS Verifier release.

**Add to Top of CHANGELOG.md:**

```markdown
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
```

**Placement:** Add at the very top of CHANGELOG.md, before any existing entries.
</action>
<verify>
```bash
# Check CHANGELOG was updated
grep -q "2.0.0-beta.1\|REIS Verifier\|reis verify" CHANGELOG.md && echo "✅ CHANGELOG updated"

# Verify FR4.1 mentioned
grep -q "FR4.1.*Feature Completeness" CHANGELOG.md && echo "✅ FR4.1 in CHANGELOG"

# Check for comprehensive entry
grep -A50 "2.0.0-beta.1" CHANGELOG.md | grep -q "Why FR4.1 Matters\|Example" && echo "✅ Comprehensive entry"
```
</verify>
<done>
- CHANGELOG.md updated with 2.0.0-beta.1 release entry
- REIS Verifier feature documented
- FR4.1 Feature Completeness Validation highlighted
- All components listed (command, subagent, templates, docs, tests)
- "Why FR4.1 Matters" section explains value
- Example workflow included
- Technical details documented
- Breaking changes and migration sections included
</done>
</task>

<task type="auto">
<name>Final integration verification</name>
<files>bin/reis.js, lib/commands/verify.js, subagents/reis_verifier.md</files>
<action>
Perform final checks to ensure all components are properly integrated.

**Checklist:**

1. **CLI Integration:**
```bash
# Verify command is registered
node bin/reis.js --help | grep verify

# Test help text
node bin/reis.js verify --help
```

2. **File Structure:**
```bash
# Verify all files exist
test -f subagents/reis_verifier.md && echo "✅ Subagent spec"
test -f lib/commands/verify.js && echo "✅ Verify command"
test -f templates/VERIFICATION_REPORT.md && echo "✅ Report template"
test -f templates/STATE_VERIFICATION_ENTRY.md && echo "✅ STATE template"
test -f docs/VERIFICATION.md && echo "✅ Verification guide"
test -f test/commands/verify.test.js && echo "✅ Test suite"
```

3. **Content Verification:**
```bash
# Check reis_verifier.md completeness
grep -q "FR4.1\|Feature Completeness" subagents/reis_verifier.md
grep -q "Step 1:\|Step 2:\|Step 3:\|Step 4:\|Step 5:\|Step 6:\|Step 7:" subagents/reis_verifier.md
grep -q "parseTasksFromPlan\|extractDeliverables\|verifyDeliverables" subagents/reis_verifier.md

# Check verify command
grep -q "function verify\|resolvePlanPath\|parsePlan" lib/commands/verify.js
grep -q "FR4.1\|Feature Completeness" lib/commands/verify.js

# Check templates
grep -q "Feature Completeness.*FR4.1" templates/VERIFICATION_REPORT.md
grep -q "Task-by-Task Analysis" templates/VERIFICATION_REPORT.md

# Check documentation
grep -q "FR4.1" README.md
grep -q "Feature Completeness" docs/VERIFICATION.md
```

4. **Line Count Verification:**
```bash
# Verify expected sizes
wc -l subagents/reis_verifier.md  # ~550 lines
wc -l lib/commands/verify.js      # ~250 lines
wc -l docs/VERIFICATION.md         # ~500 lines
wc -l test/commands/verify.test.js # ~200 lines
```

5. **FR4.1 Integration Check:**
```bash
# Count FR4.1 mentions (should be substantial)
grep -c "FR4.1\|Feature Completeness" subagents/reis_verifier.md
grep -c "FR4.1\|Feature Completeness" docs/VERIFICATION.md
grep -c "FR4.1\|Feature Completeness" README.md
```

**If any checks fail, document in verification report for fixing.**

**Success Indicators:**
- ✅ All files present and non-empty
- ✅ FR4.1 extensively documented in subagent spec
- ✅ Verify command includes FR4.1 prompts
- ✅ Templates include Feature Completeness section
- ✅ Documentation covers FR4.1 thoroughly
- ✅ Tests cover FR4.1 scenarios
- ✅ CLI help text mentions feature completeness
</action>
<verify>
```bash
# Run all integration checks
echo "=== File Existence ==="
ls -lh subagents/reis_verifier.md lib/commands/verify.js templates/*.md docs/VERIFICATION.md test/commands/verify.test.js

echo "=== FR4.1 Coverage ==="
echo "Subagent spec:" && grep -c "FR4.1\|Feature Completeness" subagents/reis_verifier.md
echo "Verify command:" && grep -c "FR4.1\|Feature Completeness" lib/commands/verify.js
echo "Docs:" && grep -c "FR4.1\|Feature Completeness" docs/VERIFICATION.md
echo "README:" && grep -c "FR4.1" README.md

echo "=== Line Counts ==="
wc -l subagents/reis_verifier.md lib/commands/verify.js docs/VERIFICATION.md

echo "=== Protocol Steps ==="
grep "Step [1-7]:" subagents/reis_verifier.md | head -7
```
</verify>
<done>
- All files exist and are properly structured
- FR4.1 integrated throughout all components
- Subagent spec includes FR4.1 in Step 4 with full implementation
- Verify command includes FR4.1 in prompts and instructions
- Templates include Feature Completeness section
- Documentation comprehensively covers FR4.1
- Tests cover FR4.1 scenarios
- CLI integration complete
- Line counts match expected sizes (~550, ~250, ~500 lines)
- FR4.1 mentioned extensively (50+ times across files)
</done>
</task>

## Success Criteria
- ✅ README.md updated with comprehensive verification documentation
- ✅ FR4.1 Feature Completeness prominently featured in README
- ✅ docs/VERIFICATION.md created with ~500 lines of detailed guide
- ✅ FR4.1 extensively documented with examples
- ✅ CHANGELOG.md updated with 2.0.0-beta.1 entry
- ✅ All verification components documented
- ✅ "Why FR4.1 Matters" explained
- ✅ Final integration checks passed
- ✅ All files present and properly integrated
- ✅ FR4.1 coverage verified across all components

## Verification

```bash
# Verify documentation
cat README.md | grep -A30 "### Verification"
cat docs/VERIFICATION.md | head -100
cat CHANGELOG.md | head -100

# Check integration
ls -lh subagents/reis_verifier.md lib/commands/verify.js templates/*.md docs/VERIFICATION.md

# Verify FR4.1 coverage
grep -c "FR4.1" subagents/reis_verifier.md docs/VERIFICATION.md README.md CHANGELOG.md

# Test command availability
node bin/reis.js verify --help
```

---

*This plan will be executed by reis_executor in a fresh context.*
