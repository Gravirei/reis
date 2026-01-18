# REIS Verifier Subagent - Project Vision

## Overview

Build the **reis_verifier** subagent to complete the autonomous REIS development cycle: Plan → Execute → Verify → Iterate.

## Problem Statement

Currently, REIS has a gap in its autonomous workflow:
- ✅ `reis_planner` creates executable plans
- ✅ `reis_executor` implements plans
- ❌ `reis verify` only generates manual prompts (no automation)

**Result:** Users must manually verify completion, breaking the autonomous cycle.

## Solution

Create **reis_verifier** - a specialized subagent that:
1. Automatically runs all verification checks
2. Validates success criteria from plans
3. Detects regressions and issues
4. Generates comprehensive verification reports
5. Enables autonomous "Plan → Execute → Verify → Iterate" cycles

## Vision

**Enable fully autonomous development:**
```bash
# Today (manual):
reis plan 1 && reis execute-plan && "manual verification"

# Tomorrow (autonomous):
reis plan 1 && reis execute-plan && reis verify 1
# If verification fails → auto-fix → verify again
# If verification passes → proceed to next phase
```

## Success Criteria

### Must Have
- ✅ Subagent specification (`subagents/reis_verifier.md`)
- ✅ Updated `verify` command integration
- ✅ Automated test execution
- ✅ Success criteria validation from PLAN.md
- ✅ Verification report generation
- ✅ STATE.md updates
- ✅ Complete documentation

### Should Have
- ✅ Code quality checks (linting, types)
- ✅ Documentation validation
- ✅ Regression detection
- ✅ Issue tracking and recommendations
- ✅ Example verification scenarios
- ✅ Comprehensive tests

### Nice to Have
- ⭐ Performance benchmarking
- ⭐ Security scanning
- ⭐ Dependency audits
- ⭐ Visual verification reports

## Key Features

### 1. Autonomous Verification Cycle
```
Plan → Execute → Verify
         ↑          ↓
         ← (if issues found)
         → (if passed)
```

### 2. Comprehensive Checks
- Test execution (unit, integration, e2e)
- Code quality (linting, types, complexity)
- Success criteria validation
- Documentation verification
- Regression detection

### 3. Intelligent Iteration
- Detects what's incomplete/broken
- Suggests fixes
- Can trigger re-execution
- Tracks iteration history

### 4. Professional Reporting
- Detailed VERIFICATION_REPORT.md
- Pass/Fail with evidence
- Action items for fixes
- Historical tracking

## Target Users

1. **REIS Users** - Automated quality assurance
2. **Development Teams** - Consistent verification standards
3. **CI/CD Pipelines** - Automated gate checks
4. **Solo Developers** - Confidence in completion

## Technical Approach

### Architecture
```
reis verify <phase>
    ↓
lib/commands/verify.js
    ↓
Invokes Rovo Dev with reis_verifier subagent
    ↓
reis_verifier reads:
  - .planning/phases/phase-X/PLAN.md
  - Current codebase state
  - Previous verification baselines
    ↓
Executes verification protocol:
  1. Test execution
  2. Code quality checks
  3. Success criteria validation
  4. Documentation verification
  5. Regression detection
    ↓
Generates:
  - VERIFICATION_REPORT.md
  - Updates STATE.md
  - Issue list (if any)
    ↓
Returns: PASS ✅ or FAIL ❌ with details
```

### Integration Points
- **Input:** Phase number, PLAN.md, codebase
- **Output:** Verification report, updated STATE.md
- **Tools:** Test runners, linters, analyzers
- **Storage:** `.planning/verification/` directory

## Timeline

**Estimated:** 4-6 hours
- Phase 1: Design & Specification (1 hour)
- Phase 2: Core Implementation (2 hours)
- Phase 3: Testing & Documentation (1.5 hours)
- Phase 4: Integration & Polish (1 hour)

## Constraints

- Must integrate with existing REIS commands
- Must work with Rovo Dev (200k context)
- Must handle various project types
- Must be backward compatible
- Should complete verification in <5 minutes for typical projects

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Verification too slow | Parallel checks, smart caching |
| False positives | Configurable thresholds |
| Complex integration | Phased rollout, clear interfaces |
| Subagent complexity | Clear protocol, examples |

## Metrics for Success

- ✅ Verifier completes in <5 minutes
- ✅ Catches 90%+ of real issues
- ✅ <5% false positive rate
- ✅ 100% of REIS codebase verified
- ✅ User satisfaction >90%

## Out of Scope (v1)

- Visual UI for reports
- Real-time monitoring
- Cloud-based verification
- Multi-repository verification
- Performance profiling (detailed)

## Dependencies

- Existing REIS infrastructure
- Test frameworks (Mocha, etc.)
- Linting tools (ESLint, etc.)
- Git integration
- Rovo Dev platform

## Stakeholders

- **REIS Users** - End users who need verification
- **REIS Maintainers** - Need quality standards
- **Rovo Dev Team** - Platform integration

## Next Steps

1. Create REQUIREMENTS.md (detailed requirements)
2. Create ROADMAP.md (phase breakdown)
3. Create PLAN.md (executable plan)
4. Execute using reis_planner and reis_executor
5. Verify using reis_verifier itself! (dogfooding)

---

**Project Status:** 🟢 Ready to Start  
**Priority:** 🔴 Critical (completes v2.0.0-beta.1)  
**Complexity:** 🟡 Medium (4-6 hours)
