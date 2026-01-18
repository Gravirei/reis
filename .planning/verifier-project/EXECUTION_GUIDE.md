# REIS Verifier - Execution Guide

Quick reference for executing all plans to build the reis_verifier subagent.

## Prerequisites

- REIS CLI installed and working
- Current directory is REIS project root
- .planning/verifier-project/ exists with all plans

## Execution Commands

### Phase 1: Design & Specification (1 hour)

```bash
# Wave 1.1: Subagent Specification (30 min)
reis execute-plan .planning/verifier-project/phases/1-design-and-specification/1-1-subagent-specification.PLAN.md

# Wave 1.2: Template & Report Design (30 min)
reis execute-plan .planning/verifier-project/phases/1-design-and-specification/1-2-template-and-report-design.PLAN.md

# Verify Phase 1
reis verify verifier-phase-1
```

### Phase 2: Core Implementation (2 hours)

```bash
# Wave 2.1: Update verify Command (30 min)
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-1-update-verify-command.PLAN.md

# Wave 2.2 & 2.3: Can run in parallel (30 min each)
# But run sequentially for simplicity
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-2-test-execution-module.PLAN.md
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-3-success-criteria-validation.PLAN.md

# Wave 2.4: Report Generation (30 min)
reis execute-plan .planning/verifier-project/phases/2-core-implementation/2-4-report-generation.PLAN.md

# Verify Phase 2
reis verify verifier-phase-2
```

### Phase 3: Advanced Features (1.5 hours)

```bash
# Wave 3.1, 3.2, 3.3: Can run in parallel (30 min each)
# But run sequentially for simplicity
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-1-code-quality-checks.PLAN.md
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-2-documentation-verification.PLAN.md
reis execute-plan .planning/verifier-project/phases/3-advanced-features/3-3-state-integration.PLAN.md

# Verify Phase 3
reis verify verifier-phase-3
```

### Phase 4: Integration & Polish (1 hour)

```bash
# Wave 4.1: Verifier Testing (30 min)
reis execute-plan .planning/verifier-project/phases/4-integration-and-polish/4-1-verifier-testing.PLAN.md

# Wave 4.2: Documentation & Completion (30 min)
reis execute-plan .planning/verifier-project/phases/4-integration-and-polish/4-2-documentation-and-completion.PLAN.md

# Verify Phase 4
reis verify verifier-phase-4
```

## Quick Execute All

```bash
# Execute all plans in sequence (5.5 hours)
for plan in \
  .planning/verifier-project/phases/1-design-and-specification/1-1-subagent-specification.PLAN.md \
  .planning/verifier-project/phases/1-design-and-specification/1-2-template-and-report-design.PLAN.md \
  .planning/verifier-project/phases/2-core-implementation/2-1-update-verify-command.PLAN.md \
  .planning/verifier-project/phases/2-core-implementation/2-2-test-execution-module.PLAN.md \
  .planning/verifier-project/phases/2-core-implementation/2-3-success-criteria-validation.PLAN.md \
  .planning/verifier-project/phases/2-core-implementation/2-4-report-generation.PLAN.md \
  .planning/verifier-project/phases/3-advanced-features/3-1-code-quality-checks.PLAN.md \
  .planning/verifier-project/phases/3-advanced-features/3-2-documentation-verification.PLAN.md \
  .planning/verifier-project/phases/3-advanced-features/3-3-state-integration.PLAN.md \
  .planning/verifier-project/phases/4-integration-and-polish/4-1-verifier-testing.PLAN.md \
  .planning/verifier-project/phases/4-integration-and-polish/4-2-documentation-and-completion.PLAN.md
do
  echo "Executing: $(basename $plan)"
  reis execute-plan "$plan"
  echo "---"
done
```

## Verification After Completion

```bash
# Verify each phase
reis verify verifier-phase-1
reis verify verifier-phase-2
reis verify verifier-phase-3
reis verify verifier-phase-4

# Or verify specific plans
reis verify .planning/verifier-project/phases/1-design-and-specification/1-1-subagent-specification.PLAN.md
```

## Expected Deliverables

After executing all plans, you should have:

- ✅ subagents/reis_verifier.md (~500 lines)
- ✅ lib/commands/verify.js (~250 lines)
- ✅ templates/VERIFICATION_REPORT.md (~150 lines)
- ✅ docs/VERIFICATION.md (~400 lines)
- ✅ tests/commands/verify.test.js (~300 lines)
- ✅ tests/integration/verification-scenarios.test.js (~200 lines)
- ✅ Updated README.md
- ✅ Updated CHANGELOG.md
- ✅ Example verification report

**Total:** ~1,550 lines of new code and documentation

## Success Criteria

All phases complete when:
- ✅ All 334+ tests passing
- ✅ reis_verifier specification complete
- ✅ verify command fully functional
- ✅ Documentation comprehensive
- ✅ REIS can verify itself (dogfooding)

## Troubleshooting

### Plan Execution Fails
- Check error messages in executor output
- Verify dependencies are met
- Ensure previous plans completed successfully
- Review plan file for clarity

### Verification Fails
- Review verification report in .planning/verification/
- Fix issues identified
- Re-run verification
- Iterate until passed

### Tests Fail
- Run `npm test` to see failures
- Fix failing tests or implementation
- Ensure test fixtures are set up correctly
- Re-run tests after fixes

## Timeline

- **Phase 1:** 1 hour
- **Phase 2:** 2 hours
- **Phase 3:** 1.5 hours
- **Phase 4:** 1 hour
- **Total:** 5.5 hours

## Next Steps After Completion

1. Run final verification: `reis verify 4`
2. Run full test suite: `npm test`
3. Review RELEASE_SUMMARY.md
4. Tag version: `git tag v2.0.0-beta.1`
5. Release and announce

---

**Ready to build?** Start with Phase 1, Wave 1.1!
