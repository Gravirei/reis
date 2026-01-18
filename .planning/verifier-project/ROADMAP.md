# REIS Verifier Subagent - Roadmap

## Overview

Build the **reis_verifier** subagent to enable autonomous "Plan → Execute → Verify → Iterate" cycles.

**Timeline:** 4-6 hours  
**Phases:** 4  
**Waves:** 8  

---

## Milestone: REIS Verifier v1.0

### Phase 1: Design & Specification (1 hour)

**Goal:** Create comprehensive subagent specification and design

#### Wave 1.1: Subagent Specification (30 min)
**Size:** Small  
**Dependencies:** None

**Tasks:**
- Create `subagents/reis_verifier.md`
- Define verification protocol (7 steps)
- Specify input/output formats
- Document integration with REIS commands
- Add examples of verification scenarios

**Success Criteria:**
- ✅ reis_verifier.md follows planner/executor format
- ✅ Protocol clearly defined with 7 steps
- ✅ Input/output specifications complete
- ✅ At least 2 example scenarios included

#### Wave 1.2: Template & Report Design (30 min)
**Size:** Small  
**Dependencies:** Wave 1.1

**Tasks:**
- Create `templates/VERIFICATION_REPORT.md` template
- Define report structure (summary, tests, quality, criteria, issues)
- Design STATE.md verification entry format
- Create example verification report
- Document report sections

**Success Criteria:**
- ✅ Report template covers all verification aspects
- ✅ Clear sections for tests, quality, criteria
- ✅ Example report demonstrates format
- ✅ STATE.md format defined

---

### Phase 2: Core Implementation (2 hours)

**Goal:** Implement core verification functionality

#### Wave 2.1: Update verify Command (30 min)
**Size:** Small  
**Dependencies:** Phase 1

**Tasks:**
- Update `lib/commands/verify.js`
- Add reis_verifier subagent invocation
- Parse phase number/plan file
- Load PLAN.md and success criteria
- Generate verification prompt for Rovo Dev
- Handle subagent response

**Success Criteria:**
- ✅ Command loads reis_verifier subagent
- ✅ Correctly parses phase/plan input
- ✅ Loads success criteria from PLAN.md
- ✅ Generates proper verification prompt

#### Wave 2.2: Test Execution Module (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.1

**Tasks:**
- Implement test execution in verifier spec
- Detect test framework (npm test)
- Run test suite and capture output
- Parse test results (pass/fail/pending)
- Extract test count and coverage
- Handle test failures gracefully

**Success Criteria:**
- ✅ Runs `npm test` successfully
- ✅ Parses test output correctly
- ✅ Extracts pass/fail/pending counts
- ✅ Handles missing tests gracefully

#### Wave 2.3: Success Criteria Validation (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.1

**Tasks:**
- Parse success criteria from PLAN.md
- Implement criterion checking logic
- Validate each criterion (✅/❌)
- Document evidence for each check
- Support multiple criterion formats
- Handle missing/malformed criteria

**Success Criteria:**
- ✅ Parses criteria from PLAN.md
- ✅ Validates each criterion
- ✅ Documents evidence
- ✅ Clear pass/fail per criterion

#### Wave 2.4: Report Generation (30 min)
**Size:** Medium  
**Dependencies:** Waves 2.2, 2.3

**Tasks:**
- Implement report generation logic
- Populate VERIFICATION_REPORT.md template
- Include test results section
- Include success criteria section
- Add executive summary
- Generate recommendations
- Write report to `.planning/verification/phase-X/`

**Success Criteria:**
- ✅ Report generated in correct location
- ✅ All sections populated
- ✅ Clear pass/fail determination
- ✅ Actionable recommendations included

---

### Phase 3: Advanced Features & Testing (1.5 hours)

**Goal:** Add advanced checks and comprehensive testing

#### Wave 3.1: Code Quality Checks (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.4

**Tasks:**
- Add code quality validation to verifier
- Check for syntax errors (node --check)
- Run linter if available (eslint)
- Detect common issues
- Generate quality score
- Include in verification report

**Success Criteria:**
- ✅ Syntax validation works
- ✅ Runs linter if configured
- ✅ Reports quality issues
- ✅ Includes in report

#### Wave 3.2: Documentation Verification (30 min)
**Size:** Small  
**Dependencies:** Wave 2.4

**Tasks:**
- Verify required docs exist (README, CHANGELOG)
- Check documentation consistency
- Validate code examples (if extractable)
- Check for TODO/FIXME comments
- Include doc status in report

**Success Criteria:**
- ✅ Checks required docs exist
- ✅ Reports doc completeness
- ✅ Flags TODO/FIXME if found
- ✅ Includes in report

#### Wave 3.3: STATE.md Integration (30 min)
**Size:** Small  
**Dependencies:** Wave 2.4

**Tasks:**
- Read current STATE.md
- Add verification entry
- Include verification timestamp
- Mark phase as verified (if passed)
- Preserve existing state data
- Handle missing STATE.md

**Success Criteria:**
- ✅ Reads STATE.md without corruption
- ✅ Adds verification entry
- ✅ Updates phase status if passed
- ✅ Creates STATE.md if missing

---

### Phase 4: Integration, Documentation & Polish (1 hour)

**Goal:** Complete integration, testing, and documentation

#### Wave 4.1: Verifier Testing (30 min)
**Size:** Medium  
**Dependencies:** Phase 3

**Tasks:**
- Create test suite for verify command
- Test verifier with sample projects
- Test with passing and failing scenarios
- Test report generation
- Test STATE.md updates
- Test error handling

**Success Criteria:**
- ✅ All verifier tests passing
- ✅ Tested with 3+ scenarios
- ✅ Error handling works
- ✅ No regressions in existing tests

#### Wave 4.2: Documentation & Examples (30 min)
**Size:** Small  
**Dependencies:** Wave 4.1

**Tasks:**
- Update main README.md with verifier
- Create docs/VERIFICATION.md guide
- Add verifier examples
- Document iteration workflow
- Update command help text
- Add to CHANGELOG.md

**Success Criteria:**
- ✅ README includes verifier
- ✅ Verification guide complete
- ✅ Examples demonstrate usage
- ✅ Help text updated
- ✅ CHANGELOG entry added

---

## Wave Dependencies

```
Wave 1.1 (Spec)
    ↓
Wave 1.2 (Templates)
    ↓
Wave 2.1 (Command)
    ↓  ↘
Wave 2.2  Wave 2.3 (Tests & Criteria)
    ↓  ↙
Wave 2.4 (Reports)
    ↓  ↘  ↘
Wave 3.1  Wave 3.2  Wave 3.3 (Quality, Docs, State)
    ↓  ↙  ↙
Wave 4.1 (Testing)
    ↓
Wave 4.2 (Documentation)
```

---

## Iteration Strategy

### Plan → Execute → Verify → Iterate

For this project, we'll use REIS itself:

```bash
# Phase 1
reis plan verifier-phase-1
reis execute-plan .planning/verifier-project/phases/phase-1/PLAN.md
reis verify verifier-phase-1  # Manual for now
# If issues → fix → verify again
# If passed → proceed

# Phase 2
reis plan verifier-phase-2
reis execute-plan .planning/verifier-project/phases/phase-2/PLAN.md
reis verify verifier-phase-2  # Can use new verifier!
# If issues → fix → verify again
# If passed → proceed

# Phase 3
reis plan verifier-phase-3
reis execute-plan .planning/verifier-project/phases/phase-3/PLAN.md
reis verify verifier-phase-3  # Using verifier
# If issues → fix → verify again
# If passed → proceed

# Phase 4
reis plan verifier-phase-4
reis execute-plan .planning/verifier-project/phases/phase-4/PLAN.md
reis verify verifier-phase-4  # Final verification
# If issues → fix → verify again
# If passed → COMPLETE! 🎉
```

---

## Success Metrics

### Phase 1 Success
- ✅ Specification complete (reis_verifier.md)
- ✅ Templates created
- ✅ Design approved

### Phase 2 Success
- ✅ verify command updated
- ✅ Tests run automatically
- ✅ Criteria validated
- ✅ Reports generated

### Phase 3 Success
- ✅ Code quality checks work
- ✅ Documentation verified
- ✅ STATE.md updated correctly

### Phase 4 Success
- ✅ All tests passing (309+)
- ✅ Documentation complete
- ✅ REIS verified using REIS (dogfooding!)
- ✅ Ready for v2.0.0-beta.1

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Takes longer than 6 hours | Delays beta.1 | Keep scope tight, defer nice-to-haves |
| Verification too complex | Breaks automation | Start simple, iterate |
| Integration issues | Command conflicts | Careful testing, backward compat |
| Test parsing fails | Incomplete verification | Graceful fallback, clear errors |

---

## Deliverables Summary

### Files Created/Modified
- ✅ `subagents/reis_verifier.md` (new)
- ✅ `lib/commands/verify.js` (updated)
- ✅ `templates/VERIFICATION_REPORT.md` (new)
- ✅ `docs/VERIFICATION.md` (new)
- ✅ `.planning/verification/` (new directory)
- ✅ Tests for verify command (new)
- ✅ README.md, CHANGELOG.md (updated)

### Lines of Code
- Subagent spec: ~500 lines
- verify command: ~200 lines (additions)
- Templates: ~150 lines
- Tests: ~300 lines
- Documentation: ~400 lines
- **Total: ~1,550 lines**

---

## Timeline Overview

```
Phase 1: Design (1 hour)
  Wave 1.1: Spec (30 min)
  Wave 1.2: Templates (30 min)

Phase 2: Core (2 hours)
  Wave 2.1: Command (30 min)
  Wave 2.2: Tests (30 min)
  Wave 2.3: Criteria (30 min)
  Wave 2.4: Reports (30 min)

Phase 3: Advanced (1.5 hours)
  Wave 3.1: Quality (30 min)
  Wave 3.2: Docs (30 min)
  Wave 3.3: State (30 min)

Phase 4: Finish (1 hour)
  Wave 4.1: Testing (30 min)
  Wave 4.2: Docs (30 min)

Total: 5.5 hours
Buffer: 0.5 hours
Target: 6 hours ✅
```

---

## Next Steps

1. ✅ Review this roadmap
2. → Generate detailed PLAN.md for each phase
3. → Execute Phase 1 using reis_planner
4. → Execute Phase 2 using reis_executor
5. → Verify using reis_verifier (once built)
6. → Iterate until complete
7. → Include in v2.0.0-beta.1

---

**Roadmap Status:** ✅ Complete  
**Next Step:** Generate executable PLAN.md files
