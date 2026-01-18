# REIS Debugger - Execution Guide

## Quick Start

Execute all plans sequentially:

```bash
# Phase 1: Design & Specification
reis execute-plan .planning/phases/phase-1-debugger-design/1-1-debugger-specification.PLAN.md
reis execute-plan .planning/phases/phase-1-debugger-design/1-2-debugger-templates.PLAN.md

# Phase 2: Core Implementation
reis execute-plan .planning/phases/phase-2-debugger-core/2-1-debug-command.PLAN.md
reis execute-plan .planning/phases/phase-2-debugger-core/2-2-issue-classifier.PLAN.md
reis execute-plan .planning/phases/phase-2-debugger-core/2-3-debug-analyzer.PLAN.md

# Phase 3: Advanced Features
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-1-solution-designer.PLAN.md
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-2-pattern-matcher.PLAN.md
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-3-fix-plan-generator.PLAN.md

# Phase 4: Testing & Documentation
reis execute-plan .planning/phases/phase-4-debugger-testing/4-1-test-suite.PLAN.md
reis execute-plan .planning/phases/phase-4-debugger-testing/4-2-documentation.PLAN.md
```

## Parallel Execution (Faster)

If you want to optimize execution time:

### Phase 1 (Sequential - 1 hour)
```bash
reis execute-plan .planning/phases/phase-1-debugger-design/1-1-debugger-specification.PLAN.md
reis execute-plan .planning/phases/phase-1-debugger-design/1-2-debugger-templates.PLAN.md
```

### Phase 2 (Can run in parallel - 1.5 hours → 30 minutes with parallelization)
```bash
# Terminal 1
reis execute-plan .planning/phases/phase-2-debugger-core/2-1-debug-command.PLAN.md

# Terminal 2
reis execute-plan .planning/phases/phase-2-debugger-core/2-2-issue-classifier.PLAN.md

# Terminal 3
reis execute-plan .planning/phases/phase-2-debugger-core/2-3-debug-analyzer.PLAN.md
```

### Phase 3 (Partial parallel - 1 hour → 20 minutes with parallelization)
```bash
# After 2.3 completes:
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-1-solution-designer.PLAN.md

# After 2.2 completes:
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-2-pattern-matcher.PLAN.md

# After 2.1 completes:
reis execute-plan .planning/phases/phase-3-debugger-advanced/3-3-fix-plan-generator.PLAN.md
```

### Phase 4 (Sequential - 1 hour)
```bash
# After all Phase 2 & 3 complete
reis execute-plan .planning/phases/phase-4-debugger-testing/4-1-test-suite.PLAN.md
reis execute-plan .planning/phases/phase-4-debugger-testing/4-2-documentation.PLAN.md
```

## Verification Checkpoints

After each phase, verify progress:

### After Phase 1
```bash
test -f subagents/reis_debugger.md && echo "✓ Specification"
test -f templates/DEBUG_REPORT.md && echo "✓ Report template"
test -f templates/FIX_PLAN.md && echo "✓ Fix plan template"
```

### After Phase 2
```bash
test -f lib/commands/debug.js && echo "✓ Debug command"
test -f lib/utils/issue-classifier.js && echo "✓ Issue classifier"
test -f lib/utils/debug-analyzer.js && echo "✓ Debug analyzer"
npm test -- test/utils/issue-classifier.test.js && echo "✓ Classifier tests pass"
```

### After Phase 3
```bash
grep -q "designSolutionsEnhanced" lib/utils/debug-analyzer.js && echo "✓ Enhanced solutions"
test -f lib/utils/pattern-matcher.js && echo "✓ Pattern matcher"
grep -q "generateTasks" lib/commands/debug.js && echo "✓ Fix plan generation"
npm test -- test/utils/pattern-matcher.test.js && echo "✓ Pattern tests pass"
```

### After Phase 4
```bash
npm test && echo "✓ All tests pass"
test -f docs/DEBUGGING.md && echo "✓ Documentation complete"
grep -q "reis_debugger" README.md && echo "✓ README updated"
grep -q "\[2.1.0\]" CHANGELOG.md && echo "✓ CHANGELOG updated"
```

## Final Validation

After all plans execute:

```bash
# Check all files created
echo "=== Checking Production Code ==="
test -f subagents/reis_debugger.md && echo "✓ Specification"
test -f lib/commands/debug.js && echo "✓ Debug command"
test -f lib/utils/issue-classifier.js && echo "✓ Issue classifier"
test -f lib/utils/debug-analyzer.js && echo "✓ Debug analyzer"
test -f lib/utils/pattern-matcher.js && echo "✓ Pattern matcher"
test -f templates/DEBUG_REPORT.md && echo "✓ Report template"
test -f templates/FIX_PLAN.md && echo "✓ Fix plan template"

echo ""
echo "=== Checking Tests ==="
test -f test/utils/issue-classifier.test.js && echo "✓ Classifier tests"
test -f test/utils/pattern-matcher.test.js && echo "✓ Pattern tests"
test -f test/commands/debug.test.js && echo "✓ Command tests"

echo ""
echo "=== Checking Documentation ==="
test -f docs/DEBUGGING.md && echo "✓ Debugging guide"
test -f docs/examples/debugging-workflow.md && echo "✓ Examples"

echo ""
echo "=== Running All Tests ==="
npm test

echo ""
echo "=== Checking Command Registration ==="
node lib/cli.js debug --help 2>&1 | grep -q "debug" && echo "✓ Command registered"

echo ""
echo "=== Line Counts ==="
echo "Specification: $(wc -l < subagents/reis_debugger.md) lines"
echo "Debug command: $(wc -l < lib/commands/debug.js) lines"
echo "Issue classifier: $(wc -l < lib/utils/issue-classifier.js) lines"
echo "Debug analyzer: $(wc -l < lib/utils/debug-analyzer.js) lines"
echo "Pattern matcher: $(wc -l < lib/utils/pattern-matcher.js) lines"
echo "Report template: $(wc -l < templates/DEBUG_REPORT.md) lines"
echo "Fix plan template: $(wc -l < templates/FIX_PLAN.md) lines"
echo ""
echo "Total production code: ~3,250 lines (target)"
echo "Total test code: ~600 lines (target)"
echo "Total documentation: ~1,050 lines (target)"
```

## Dogfooding Test

Test the debugger on itself:

```bash
# 1. Create a deliberate test failure
echo "// Temporary test" >> test/commands/debug.test.js
echo "it('should fail deliberately', () => { expect(true).to.equal(false); });" >> test/commands/debug.test.js

# 2. Run tests to trigger failure
npm test

# 3. Use debugger to analyze
reis debug

# 4. Review outputs
cat .planning/DEBUG_REPORT.md
cat .planning/FIX_PLAN.md

# 5. Fix using debugger's plan
reis execute-plan .planning/FIX_PLAN.md

# 6. Verify fix
npm test

# Expected: Debugger correctly identifies test failure, generates fix plan, fix works
```

## Troubleshooting

### Issue: Plan execution fails on syntax
```bash
# Check the plan file syntax
node -c <plan-file>

# Re-execute the specific wave
reis execute-plan <plan-file>
```

### Issue: Tests fail after implementation
```bash
# Check specific test file
npm test -- <test-file>

# Review implementation
cat <implementation-file>

# Use debugger itself to analyze
reis debug
```

### Issue: Missing files
```bash
# Check which phase completed
ls -la subagents/reis_debugger.md  # Phase 1
ls -la lib/commands/debug.js       # Phase 2
ls -la lib/utils/pattern-matcher.js # Phase 3
ls -la docs/DEBUGGING.md            # Phase 4

# Re-execute missing phase
reis execute-plan <phase-plan>
```

## Success Criteria

All checks should pass:

- [ ] All 8 plans executed successfully
- [ ] All production files created (~3,250 lines)
- [ ] All test files created (~600 lines)
- [ ] All documentation created (~1,050 lines)
- [ ] All tests pass (npm test returns 0)
- [ ] Command registered (reis debug --help works)
- [ ] Dogfooding test passes
- [ ] No syntax errors in any file
- [ ] README and CHANGELOG updated

## Timeline Tracking

Estimated times per phase:
- Phase 1: 1 hour
- Phase 2: 1.5 hours (or 30 min with parallel)
- Phase 3: 1 hour (or 20 min with parallel)
- Phase 4: 1 hour

**Total:** 4.5 hours sequential, ~3 hours with parallelization

## Next Steps After Completion

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Add reis_debugger subagent with 6-step analysis protocol"
   ```

2. **Test in Real Scenarios**
   - Use on actual REIS issues
   - Verify pattern recognition
   - Check knowledge base learning

3. **Update Version**
   ```bash
   # Update version in package.json to 2.1.0
   npm version minor
   ```

4. **Release**
   ```bash
   git tag v2.1.0
   git push origin main --tags
   ```

5. **Documentation**
   - Announce new feature
   - Update main docs
   - Share examples

---

**Ready to execute?** Start with Phase 1 Wave 1.1:
```bash
reis execute-plan .planning/phases/phase-1-debugger-design/1-1-debugger-specification.PLAN.md
```
