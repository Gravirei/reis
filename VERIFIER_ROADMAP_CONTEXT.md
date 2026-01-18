# 🔍 REIS Verifier Subagent - Complete Roadmap & Context

**Date:** 2026-01-18  
**Status:** ✅ All planning complete - Ready to build!  
**Timeline:** 5.5 hours (4 phases, 8 waves)  
**Deliverable:** 4th REIS subagent to complete autonomous development cycle

---

## 🎯 Vision: Complete the Cycle

### Current State (Missing Link):
```
Plan → Execute → ??? (manual verification)
  ↓        ↓        
planner  executor   verifier ← MISSING!
```

### Target State (Autonomous):
```
Plan → Execute → Verify → (iterate if issues)
  ↓        ↓        ↓
planner  executor  verifier ← BUILDING NOW!
```

**Goal:** Enable fully autonomous development with automatic quality assurance and iterative refinement.

---

## 📦 What We're Building

### reis_verifier Subagent
A specialized Rovo Dev subagent that:
- ✅ Runs automated tests and checks
- ✅ Validates success criteria from plans
- ✅ Checks code quality and documentation
- ✅ Detects regressions and issues
- ✅ Generates comprehensive reports
- ✅ Updates project state
- ✅ **Enables iteration until perfect**

### The Iteration Cycle
```
1. Plan (reis_planner)
   ↓
2. Execute (reis_executor)
   ↓
3. Verify (reis_verifier)
   ↓
4. Issues found? → Fix → Verify again (loop)
   ↓
5. All passed? → Next phase!
```

---

## 📋 Complete Project Documentation

### Planning Documents Created (16 files, 6,210 lines):

#### **Foundation (4 docs)**
- `.planning/verifier-project/PROJECT.md` - Vision, goals, success criteria
- `.planning/verifier-project/REQUIREMENTS.md` - 12 functional + 7 non-functional requirements
- `.planning/verifier-project/ROADMAP.md` - 4 phases, 8 waves, dependencies
- `.planning/verifier-project/README.md` - Quick reference

#### **Executable Plans (8 PLAN.md files, 6,210 lines)**

**Phase 1: Design & Specification (1 hour)**
1. `1-1-subagent-specification.PLAN.md` (181 lines)
2. `1-2-template-and-report-design.PLAN.md` (492 lines)

**Phase 2: Core Implementation (2 hours)**
3. `2-1-update-verify-command.PLAN.md` (508 lines)
4. `2-2-test-execution-module.PLAN.md` (364 lines)
5. `2-3-success-criteria-validation.PLAN.md` (550 lines)
6. `2-4-report-generation.PLAN.md` (606 lines)

**Phase 3: Advanced Features (1.5 hours)**
7. `3-1-code-quality-checks.PLAN.md` (523 lines)
8. `3-2-documentation-verification.PLAN.md` (614 lines)
9. `3-3-state-integration.PLAN.md` (695 lines)

**Phase 4: Integration & Polish (1 hour)**
10. `4-1-verifier-testing.PLAN.md` (759 lines)
11. `4-2-documentation-and-completion.PLAN.md` (918 lines)

#### **Execution Guides (2 docs)**
- `PLANS_SUMMARY.md` - Overview of all plans
- `EXECUTION_GUIDE.md` - Step-by-step execution commands

---

## 🏗️ Architecture Overview

### 7-Step Verification Protocol

```markdown
1. Preparation
   - Load phase plan
   - Parse success criteria
   - Initialize report

2. Test Execution
   - Detect test framework
   - Run test suite
   - Parse results
   - Collect coverage

3. Code Quality Checks
   - Syntax validation
   - Linting (if configured)
   - Complexity analysis
   - Quality scoring (A-F)

4. Success Criteria Validation
   - Check each criterion
   - Document evidence
   - Flag unmet criteria

5. Documentation Verification
   - Check required docs
   - Validate examples
   - Find TODOs/FIXMEs

6. Regression Detection
   - Compare with baseline
   - Check test counts
   - Verify no breakage

7. Report Generation
   - Create VERIFICATION_REPORT.md
   - Update STATE.md
   - List action items
   - Provide recommendations
```

### Integration Points

```
User runs: reis verify <phase>
    ↓
lib/commands/verify.js
    ↓
Invokes: reis_verifier subagent via Rovo Dev
    ↓
Reads:
  - .planning/phases/phase-X/PLAN.md
  - Current codebase
  - Test suite
  - STATE.md
    ↓
Executes: 7-step protocol
    ↓
Generates:
  - .planning/verification/phase-X/VERIFICATION_REPORT.md
  - Updates STATE.md
  - Exit code (0=pass, 1=fail)
    ↓
User sees: Report summary + recommendations
```

---

## 📊 Deliverables Breakdown

### Files to Create (8 new/modified):
1. **subagents/reis_verifier.md** (~500 lines)
   - Complete subagent specification
   - 7-step verification protocol
   - Input/output formats
   - Examples

2. **lib/commands/verify.js** (~250 lines modified/added)
   - Updated command logic
   - Subagent integration
   - Report display
   - Error handling

3. **templates/VERIFICATION_REPORT.md** (~150 lines)
   - Report template
   - All sections defined
   - Example content

4. **docs/VERIFICATION.md** (~400 lines)
   - User guide
   - Verification concepts
   - Best practices
   - Troubleshooting

5. **test/commands/verify.test.js** (~300 lines)
   - Command tests
   - Integration tests
   - Edge cases

6. **test/integration/verification-scenarios.test.js** (~200 lines)
   - End-to-end scenarios
   - Passing/failing cases
   - Iteration testing

7. **README.md** (updated)
   - Add verifier section
   - Update workflow examples

8. **CHANGELOG.md** (updated)
   - Document reis_verifier addition
   - v2.0.0-beta.1 entry

**Total:** ~1,550 lines of new code and documentation

---

## ⏱️ Timeline & Phases

### Phase 1: Design & Specification (1 hour)
**Goal:** Create specifications and templates

**Wave 1.1:** Subagent Specification (30 min)
- Create complete reis_verifier.md specification
- Define 7-step protocol
- Document input/output formats

**Wave 1.2:** Template Design (30 min)
- Create VERIFICATION_REPORT.md template
- Design report structure
- Create example report

### Phase 2: Core Implementation (2 hours)
**Goal:** Build core verification functionality

**Wave 2.1:** Update verify Command (30 min)
- Integrate subagent invocation
- Parse phase/plan input
- Handle response

**Wave 2.2:** Test Execution (30 min)
- Multi-framework support
- Result parsing
- Coverage collection

**Wave 2.3:** Success Criteria Validation (30 min)
- Parse criteria from plans
- Validation logic
- Evidence documentation

**Wave 2.4:** Report Generation (30 min)
- Generate comprehensive reports
- Include all verification data
- Clear recommendations

### Phase 3: Advanced Features (1.5 hours)
**Goal:** Add quality checks and integrations

**Wave 3.1:** Code Quality Checks (30 min)
- Syntax validation
- Linting integration
- Quality scoring

**Wave 3.2:** Documentation Verification (30 min)
- Check required docs
- Validate examples
- Find TODOs

**Wave 3.3:** STATE.md Integration (30 min)
- Update state with results
- Track verification history
- Handle edge cases

### Phase 4: Integration & Polish (1 hour)
**Goal:** Test, document, and finalize

**Wave 4.1:** Testing (30 min)
- Unit tests for verifier
- Integration scenarios
- Edge case coverage

**Wave 4.2:** Documentation (30 min)
- Complete user guide
- Update main docs
- Add examples

---

## 🚀 Execution Strategy

### Using REIS to Build REIS (Dogfooding!)

We'll use REIS itself to build the verifier:

```bash
# Phase 1: Design
reis execute-plan .planning/verifier-project/phases/1-design-and-specification/1-1-subagent-specification.PLAN.md
reis execute-plan .planning/verifier-project/phases/1-design-and-specification/1-2-template-and-report-design.PLAN.md
# Manual verify (verifier not ready yet)

# Phase 2: Core
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-1-update-verify-command.PLAN.md
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-2-test-execution-module.PLAN.md
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-3-success-criteria-validation.PLAN.md
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-4-report-generation.PLAN.md
# Can use reis verify now! (basic functionality)

# Phase 3: Advanced
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-1-code-quality-checks.PLAN.md
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-2-documentation-verification.PLAN.md
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-3-state-integration.PLAN.md
reis verify verifier-phase-3  # Full verification!

# Phase 4: Finish
reis execute-plan .planning/verifier-project/phases/4-integration-and-polish/4-1-verifier-testing.PLAN.md
reis execute-plan .planning/verifier-project/phases/4-integration-and-polish/4-2-documentation-and-completion.PLAN.md
reis verify verifier-phase-4  # Final verification!

# Verify the whole REIS project using REIS!
reis verify 4
```

### Parallel Execution Option

Some waves can run in parallel to speed up:

**Parallel Set 1 (Phase 2):**
- Wave 2.2 (Test Execution) + Wave 2.3 (Criteria) simultaneously

**Parallel Set 2 (Phase 3):**
- Wave 3.1 (Quality) + Wave 3.2 (Docs) + Wave 3.3 (State) simultaneously

**Time Savings:** ~1-1.5 hours if executed in parallel

---

## 🎯 Success Criteria

### Phase Complete When:
- ✅ All waves executed
- ✅ All tests passing
- ✅ Success criteria met
- ✅ Documentation complete
- ✅ Verification successful

### Project Complete When:
- ✅ reis_verifier subagent working
- ✅ verify command integrated
- ✅ All 334+ tests passing (309 existing + 25 new)
- ✅ Documentation comprehensive
- ✅ **REIS can verify itself**
- ✅ Ready for v2.0.0-beta.1 release

---

## 🔄 Iteration Support

### When Verification Fails:

```
reis verify 1
  ↓
❌ FAILED: 2 tests failing, 1 criterion unmet
  ↓
Report shows:
- Test X failing: reason Y
- Criterion Z not met: needs feature W
  ↓
Developer fixes issues
  ↓
reis verify 1
  ↓
✅ PASSED: All checks successful
  ↓
Proceed to Phase 2
```

### Automatic Iteration (Future):
```
reis verify 1 --auto-fix
  ↓
Verifier finds issues
  ↓
Automatically fixes common issues
  ↓
Re-verifies
  ↓
Reports remaining manual fixes
```

---

## 📚 Key Features

### Multi-Framework Test Support
- Jest, Vitest, Mocha, Node test runner
- Automatic framework detection
- Unified result parsing

### Success Criteria Types
- File existence checks
- Command execution checks
- Test count checks
- Code pattern checks
- Documentation checks
- Custom validation scripts
- Dependency checks

### Code Quality Grading
- A: Excellent (no issues)
- B: Good (minor warnings)
- C: Acceptable (some issues)
- D: Needs improvement (multiple issues)
- F: Failing (critical issues)

### Comprehensive Reports
- Executive summary
- Test results breakdown
- Success criteria status
- Code quality metrics
- Documentation status
- Issues list (by severity)
- Actionable recommendations
- Next steps

---

## 🎉 Impact on REIS Workflow

### Before (Manual):
```
reis plan 1
reis execute-plan ...
Manual testing (1-2 hours)
Manual code review
Manual doc check
Hope everything works
```

### After (Autonomous):
```
reis plan 1
reis execute-plan ...
reis verify 1
(automatic: tests, quality, criteria, docs)
Clear pass/fail + report
Iterate if needed
```

**Time Saved:** 80% of verification time  
**Quality Improvement:** Consistent, comprehensive checks  
**Confidence:** Clear evidence of completion

---

## 🚀 Ready to Build!

All planning is complete. We have:
- ✅ Clear vision and requirements
- ✅ Detailed roadmap (4 phases, 8 waves)
- ✅ Executable plans (6,210 lines)
- ✅ Step-by-step execution guide
- ✅ Success criteria defined

**Next Step:** Start executing Phase 1, Wave 1.1

**Options:**
1. **Sequential execution** - One wave at a time (5.5 hours)
2. **Parallel execution** - Some waves simultaneously (4 hours)
3. **Review first** - Examine plans before starting

---

**What would you like to do?**
1. Start executing Phase 1 now?
2. Use parallel REIS executors to speed up?
3. Review specific plans first?
4. Something else?
