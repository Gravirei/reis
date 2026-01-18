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
