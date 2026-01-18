### Verification: {Phase/Plan Name}
**Date:** {ISO timestamp}  
**Status:** {PASSED | FAILED | PASSED_WITH_WARNINGS}  
**Verifier:** reis_verifier v{version}

**Results:**
- Tests: {X/Y passed}
- Feature Completeness: {X/Y tasks ({Z%})}
- Success Criteria: {X/Y met}
- Code Quality: {PASS | WARNINGS | FAIL}

**Issues:** {count} critical, {count} major, {count} minor

**Report:** `.planning/verification/{phase_name}/VERIFICATION_REPORT.md`

{If FAILED:}
**Action Required:** Fix issues and re-verify before proceeding

{If PASSED:}
**Next Phase:** Ready for {next_phase}

---

## Example Usage in STATE.md

### Verification: Phase 2 - Core Implementation
**Date:** 2024-01-15T14:30:00Z  
**Status:** FAILED  
**Verifier:** reis_verifier v1.0

**Results:**
- Tests: 15/18 passed
- Feature Completeness: 2/3 tasks (66%)
- Success Criteria: 4/6 met
- Code Quality: WARNINGS

**Issues:** 1 critical, 2 major, 3 minor

**Report:** `.planning/verification/phase-2-core-implementation/VERIFICATION_REPORT.md`

**Action Required:** Fix issues and re-verify before proceeding

---

### Verification: Phase 2 - Core Implementation (Re-verification)
**Date:** 2024-01-15T16:45:00Z  
**Status:** PASSED  
**Verifier:** reis_verifier v1.0

**Results:**
- Tests: 18/18 passed
- Feature Completeness: 3/3 tasks (100%)
- Success Criteria: 6/6 met
- Code Quality: PASS

**Issues:** 0 critical, 0 major, 1 minor

**Report:** `.planning/verification/phase-2-core-implementation/VERIFICATION_REPORT_2.md`

**Next Phase:** Ready for Phase 3
