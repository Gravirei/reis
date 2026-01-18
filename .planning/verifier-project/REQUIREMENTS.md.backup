# REIS Verifier Subagent - Requirements

## Functional Requirements

### FR1: Subagent Specification
**Priority:** Must Have  
**Description:** Create comprehensive reis_verifier subagent specification

**Acceptance Criteria:**
- Subagent markdown file at `subagents/reis_verifier.md`
- Clear protocol definition
- Input/output specifications
- Verification workflow documented
- Examples included
- Follows existing subagent format (planner, executor, mapper)

### FR2: Verification Protocol
**Priority:** Must Have  
**Description:** Define systematic verification process

**Verification Steps:**
1. Preparation (load plan, parse criteria)
2. Test Execution (run all tests)
3. Code Quality Checks (linting, types)
4. Success Criteria Validation
5. Documentation Verification
6. Report Generation
7. STATE.md Update

### FR3: Test Execution
**Priority:** Must Have  
**Description:** Automatically run all project tests

**Requirements:**
- Detect test framework (Mocha, Jest, etc.)
- Run test suite with `npm test`
- Capture test results
- Parse pass/fail status
- Collect coverage data (if available)
- Report test failures with details
- Handle test timeouts gracefully

### FR4: Success Criteria Validation
**Priority:** Must Have  
**Description:** Validate all success criteria from PLAN.md

**Requirements:**
- Parse success criteria from plan files
- For each criterion:
  - Check if met
  - Document evidence
  - Flag if unmet
- Support multiple criterion formats
- Provide clear pass/fail per criterion

### FR5: Verification Report Generation
**Priority:** Must Have  
**Description:** Generate comprehensive verification report

**Report Contents:**
- Executive summary (pass/fail)
- Test results
- Success criteria status
- Code quality metrics
- Documentation status
- Issues found
- Recommendations
- Next steps

**Format:** Markdown (VERIFICATION_REPORT.md)

### FR6: STATE.md Integration
**Priority:** Must Have  
**Description:** Update project state with verification results

**Requirements:**
- Read current STATE.md
- Add verification entry
- Mark phase as verified (if passed)
- Track verification history
- Preserve existing state data

### FR7: Command Integration
**Priority:** Must Have  
**Description:** Update `reis verify` command to use verifier

**Requirements:**
- Modify `lib/commands/verify.js`
- Integrate with reis_verifier subagent
- Maintain backward compatibility
- Support both manual and automated modes
- Clear output to user

### FR8: Code Quality Checks
**Priority:** Should Have  
**Description:** Validate code quality standards

**Checks:**
- Run ESLint (if configured)
- Check for syntax errors
- Analyze code complexity (basic)
- Detect common issues
- Report quality score

### FR9: Documentation Verification
**Priority:** Should Have  
**Description:** Verify documentation completeness and accuracy

**Checks:**
- Required docs exist (README, etc.)
- Documentation up-to-date
- Code examples work
- No broken links
- Consistent formatting

### FR10: Regression Detection
**Priority:** Should Have  
**Description:** Detect regressions from previous state

**Checks:**
- Compare test counts (not fewer tests)
- Check for new failures
- Verify no broken features
- Compare with baseline (if exists)

### FR11: Issue Tracking
**Priority:** Should Have  
**Description:** Track and report issues found

**Requirements:**
- List all issues found
- Categorize by severity (critical, warning, info)
- Provide fix recommendations
- Link to relevant code/docs
- Support issue filtering

### FR12: Iteration Support
**Priority:** Must Have  
**Description:** Support Plan → Execute → Verify → Iterate cycle

**Requirements:**
- Detect when re-execution needed
- Suggest what to fix
- Track iteration attempts
- Support manual and auto iteration
- Prevent infinite loops (max iterations)

---

## Non-Functional Requirements

### NFR1: Performance
**Requirement:** Verification completes in <5 minutes for typical projects
**Rationale:** Keep workflow fast and responsive

### NFR2: Reliability
**Requirement:** 95%+ success rate in verification accuracy
**Rationale:** Users must trust verification results

### NFR3: Usability
**Requirement:** Clear, actionable verification reports
**Rationale:** Users need to understand what passed/failed

### NFR4: Compatibility
**Requirement:** Works with existing REIS projects (v1.x and v2.0)
**Rationale:** Backward compatibility essential

### NFR5: Maintainability
**Requirement:** Well-documented code, follows REIS patterns
**Rationale:** Future maintenance and extensions

### NFR6: Scalability
**Requirement:** Handles projects with 10K+ files
**Rationale:** Enterprise-ready

### NFR7: Extensibility
**Requirement:** Easy to add new verification checks
**Rationale:** Future enhancements

---

## Technical Requirements

### TR1: File Structure
```
subagents/
  reis_verifier.md          # Subagent specification

lib/commands/
  verify.js                 # Updated command

.planning/verification/
  phase-1/
    VERIFICATION_REPORT.md  # Phase 1 verification
  phase-2/
    VERIFICATION_REPORT.md  # Phase 2 verification

templates/
  VERIFICATION_REPORT.md    # Report template
```

### TR2: Dependencies
- No new npm dependencies required
- Use existing REIS utilities
- Leverage built-in Node.js modules
- Compatible with Node.js 18+

### TR3: Integration
- Works with existing `reis verify <phase>` command
- Integrates with STATE.md format
- Uses PLAN.md parsing from wave-executor
- Compatible with git-integration utilities

### TR4: Error Handling
- Graceful failure on missing files
- Clear error messages
- Recoverable from partial failures
- No data corruption

---

## User Stories

### US1: Basic Verification
**As a** REIS user  
**I want to** run automated verification  
**So that** I can confirm phase completion without manual checks

**Acceptance:**
- Run `reis verify 1`
- Verifier runs all checks automatically
- Receive clear pass/fail report
- STATE.md updated

### US2: Iteration on Failure
**As a** REIS user  
**I want to** automatically re-execute when verification fails  
**So that** I can fix issues and continue

**Acceptance:**
- Verification fails with clear issues list
- User or system fixes issues
- Re-run verification
- Eventually passes
- Track iteration history

### US3: CI/CD Integration
**As a** team lead  
**I want to** use reis verify in CI/CD  
**So that** we have automated quality gates

**Acceptance:**
- Run `reis verify` in CI script
- Gets exit code (0 = pass, 1 = fail)
- Report available as artifact
- Fast enough for CI (<5 min)

### US4: Historical Tracking
**As a** project manager  
**I want to** see verification history  
**So that** I can track quality over time

**Acceptance:**
- All verifications stored
- Easy to compare versions
- See quality trends
- Identify regression points

---

## Acceptance Criteria (Overall)

### Phase Verification Complete When:
1. ✅ All tests passing
2. ✅ All success criteria met
3. ✅ Code quality acceptable
4. ✅ Documentation complete
5. ✅ No critical issues
6. ✅ STATE.md updated
7. ✅ Report generated

### System Ready for Release When:
1. ✅ reis_verifier subagent complete
2. ✅ verify command updated
3. ✅ All verifier tests passing
4. ✅ Documentation complete
5. ✅ Example verification successful
6. ✅ Dogfooding complete (REIS verified with REIS)

---

## Constraints

1. Must complete within 4-6 hours
2. No breaking changes to existing commands
3. Works within Rovo Dev 200k context limit
4. No external service dependencies
5. Follows REIS code standards

---

## Assumptions

1. Projects have test suites (npm test)
2. PLAN.md files have clear success criteria
3. STATE.md format is consistent
4. Users have Node.js 18+ installed
5. Git repository is initialized

---

## Out of Scope

- Visual dashboards
- Real-time monitoring
- Cloud-based verification
- Performance profiling (detailed)
- Security scanning (deep)
- Dependency vulnerability scanning
- Automated issue fixing (v1)

---

**Requirements Status:** ✅ Complete  
**Next Step:** Create ROADMAP.md
