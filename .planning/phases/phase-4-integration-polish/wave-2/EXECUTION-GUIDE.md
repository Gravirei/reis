# Phase 4 Wave 2 Execution Guide

## Overview

This guide provides step-by-step instructions for executing Phase 4 Wave 2: Enhanced Integration Testing.

**Wave 2 delivers:** 64-66 comprehensive tests covering E2E workflows, performance benchmarks, and error recovery scenarios.

## Prerequisites

✅ **Before starting Wave 2:**
- Phase 4 Wave 1 complete (visualizer utility and commands)
- 249 tests passing baseline
- All utilities operational: config, state-manager, git-integration, wave-executor, plan-validator, metrics-tracker, visualizer
- All commands working: execute-plan, checkpoint, resume, config, visualize

## Execution Options

### Option 1: Parallel Execution (Recommended) ⚡

**Fastest approach:** All 3 plans execute simultaneously in separate processes.

**Terminal 1 - E2E Workflows:**
```bash
cd /path/to/reis-v2
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-1-e2e-workflows.PLAN.md
```

**Terminal 2 - Performance Benchmarks:**
```bash
cd /path/to/reis-v2
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-2-performance-benchmarks.PLAN.md
```

**Terminal 3 - Error Recovery:**
```bash
cd /path/to/reis-v2
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-3-error-recovery.PLAN.md
```

**Time Savings:** ~60-70% faster than sequential

---

### Option 2: Sequential Execution (Safe Alternative) 🐌

**Use when:** Parallel execution not available or preferred to monitor progress step-by-step.

```bash
# Step 1: E2E Workflows (~1-2 iterations)
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-1-e2e-workflows.PLAN.md
npm test -- test/e2e/phase4-workflows.test.js  # Verify
reis checkpoint "Completed 4-2-1: E2E workflows"

# Step 2: Performance Benchmarks (~1-2 iterations)
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-2-performance-benchmarks.PLAN.md
npm test -- test/performance/benchmarks.test.js  # Verify
reis checkpoint "Completed 4-2-2: Performance benchmarks"

# Step 3: Error Recovery (~1-2 iterations)
reis execute-plan .planning/phases/phase-4-integration-polish/wave-2/4-2-3-error-recovery.PLAN.md
npm test -- test/integration/error-recovery.test.js  # Verify
reis checkpoint "Completed 4-2-3: Error recovery"
```

**Total Duration:** 4-5 iterations sequential

---

## Manual Execution (Alternative)

If using reis_executor subagents or manual implementation:

### Task 1: E2E Workflows
**File to create:** `test/e2e/phase4-workflows.test.js`

**Implementation steps:**
1. Copy test structure from plan 4-2-1
2. Implement 10 E2E scenarios as specified
3. Add helper functions (createPlanMD, createRoadmapMD, executeWaveAndVerify)
4. Run: `npm test -- test/e2e/phase4-workflows.test.js`
5. Verify: 10-12 new tests passing

**Expected outcome:** 259-261 total tests passing

---

### Task 2: Performance Benchmarks
**Files to create:**
- `test/performance/benchmark-utils.js`
- `test/performance/benchmarks.test.js`

**Implementation steps:**
1. Create benchmark-utils.js with measureTime, measureMemory, assertPerformance functions
2. Create benchmarks.test.js with 20 benchmark tests covering all utilities
3. Run: `npm test -- test/performance/benchmarks.test.js`
4. Verify: All performance targets met (printed in console)

**Expected outcome:** 279-281 total tests passing

---

### Task 3: Error Recovery
**File to create:** `test/integration/error-recovery.test.js`

**Implementation steps:**
1. Copy test structure from plan 4-2-3
2. Implement 9 test suites covering all error scenarios
3. Total: 34 tests covering failures, corruption, edge cases
4. Run: `npm test -- test/integration/error-recovery.test.js`
5. Verify: All error scenarios handled gracefully

**Expected outcome:** 313-315 total tests passing

---

## Verification Checklist

After completing all 3 tasks:

### ✅ Test Verification
```bash
# Run all tests
npm test

# Expected results:
# - 313-315 tests passing (was 249)
# - 0 failing
# - 0 pending
# - Execution time: <60 seconds
```

### ✅ Performance Verification
```bash
# Performance benchmarks should show:
npm test -- test/performance/benchmarks.test.js

# Expected output:
# ✓ Config: Load default <50ms
# ✓ Config: Load complex <100ms
# ✓ STATE: Read <20ms
# ✓ STATE: Update <50ms
# ✓ STATE: 100 sequential updates <2000ms
# ✓ Git: Status check <100ms
# ✓ Git: Create commit <200ms
# ✓ Git: Create checkpoint <300ms
# ✓ Wave: Parse 10 waves <100ms
# ✓ Wave: Parse 50 waves <200ms
# ✓ Metrics: Record execution <10ms
# ✓ Metrics: Load 100 events <50ms
# ✓ Metrics: Generate report <100ms
# ✓ Validation: Small plan <200ms
# ✓ Validation: Large plan <500ms
# ✓ Visualizer: Bar chart <10ms
# ✓ Visualizer: Progress bar <5ms
# ✓ Visualizer: Timeline <10ms
# ✓ Memory: StateManager <5MB
# ✓ Memory: Large plan parsing <10MB
```

### ✅ File Verification
```bash
# Verify all test files created
ls -la test/e2e/phase4-workflows.test.js
ls -la test/performance/benchmark-utils.js
ls -la test/performance/benchmarks.test.js
ls -la test/integration/error-recovery.test.js

# All files should exist
```

### ✅ Git Verification
```bash
# Check git status
git status

# Should show:
# - New test files added
# - No unexpected modifications
# - Clean working tree after commit
```

---

## Troubleshooting

### Issue: Tests timeout
**Solution:** Increase timeout in test files
```javascript
describe('Suite Name', function() {
  this.timeout(30000); // Increase to 30s
  // ...
});
```

### Issue: Git operations fail in tests
**Solution:** Ensure git is configured
```bash
git config user.name "Test User"
git config user.email "test@example.com"
```

### Issue: Permission errors on filesystem tests
**Solution:** Tests automatically skip on Windows if needed
```javascript
if (process.platform === 'win32') {
  this.skip();
}
```

### Issue: Parallel execution conflicts
**Solution:** Switch to sequential execution (Option 2)

### Issue: Performance benchmarks fail on slower machines
**Solution:** Performance targets are generous, but can be adjusted if needed. Check the p95 and max values - if they're consistently high, may indicate system issue rather than code regression.

---

## Post-Completion Steps

### 1. Verify Success
```bash
npm test  # Should show 313-315 passing
```

### 2. Create Checkpoint
```bash
reis checkpoint "Phase 4 Wave 2 Complete: Enhanced Integration Testing"
```

### 3. Update STATE.md
```bash
# Manually update .planning/STATE.md or use:
reis resume  # Will show updated state
```

### 4. Review Performance Report
Check the performance benchmark output for any concerns or trends.

### 5. Commit Changes
```bash
git add test/
git commit -m "Phase 4 Wave 2: Add comprehensive integration testing

- Added 10-12 E2E workflow tests
- Added 20 performance benchmarks with baseline targets
- Added 34 error recovery and edge case tests
- Total: 64-66 new tests (313-315 total)
- All performance targets met
- Production-ready error handling validated"
```

### 6. Proceed to Wave 3
Wave 3 (Documentation & Examples) is now ready to execute:
```bash
.planning/phases/phase-4-integration-polish/4-3-documentation-examples.PLAN.md
```

---

## Success Metrics

### Quantitative
- ✅ 64-66 new tests added
- ✅ 313-315 total tests passing
- ✅ 0 test failures
- ✅ All performance targets met
- ✅ Test execution <60 seconds

### Qualitative
- ✅ Complete project lifecycle covered
- ✅ All error scenarios handled gracefully
- ✅ No data loss or corruption in any scenario
- ✅ Backward compatibility confirmed
- ✅ Performance baseline established

---

## Questions?

**Issue with plan execution?**
- Review the individual PLAN.md files for detailed instructions
- Check WAVE-2-SUMMARY.md for comprehensive overview
- Verify prerequisites are met

**Need to modify plans?**
- Plans are detailed enough to execute as-is
- If adjustments needed, document changes in STATE.md
- Maintain test coverage goals

**Ready to proceed?**
Choose your execution option above and begin! 🚀

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-18  
**Status:** Ready for Use
