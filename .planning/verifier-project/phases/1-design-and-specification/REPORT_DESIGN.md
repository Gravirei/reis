# Verification Report Design

## Overview
This document explains the structure and usage of verification reports, including the critical FR4.1 Feature Completeness validation.

## Report Structure

### 1. Executive Summary
**Purpose:** Quick pass/fail determination  
**Audience:** Developers, CI/CD systems  
**Key Metrics:** Overall status, completion %, critical issues

### 2. Feature Completeness (FR4.1) - CRITICAL
**Purpose:** Detect missing/incomplete tasks  
**Method:** Parse PLAN.md, verify all deliverables exist  
**Output:** Task-by-task status with evidence

**Why This Matters:**
Executors may skip tasks without errors. This section catches incomplete implementations before they cause downstream issues.

**Detection:**
- File existence checks
- Code pattern matching (grep for functions/classes)
- Git diff analysis
- Test presence verification
- Documentation mentions

**Report Format:**
```
✅ Task 1: Complete (evidence: files, functions, tests found)
❌ Task 2: INCOMPLETE (missing: X.js, functionY(), test Z)
✅ Task 3: Complete
Result: 66% complete → FAIL
```

### 3. Test Results
**Purpose:** Validate functionality  
**Method:** Run npm test, parse output  
**Output:** Pass/fail counts, failed test details

### 4. Success Criteria Validation
**Purpose:** Verify PLAN.md acceptance criteria  
**Method:** Check each criterion individually  
**Output:** Per-criterion pass/fail with evidence

### 5. Code Quality
**Purpose:** Catch syntax errors, linting issues  
**Method:** node --check, eslint if configured  
**Output:** Quality score, issue list

### 6. Documentation
**Purpose:** Ensure docs are complete  
**Method:** Check required files, consistency  
**Output:** Doc completeness status

### 7. Recommendations
**Purpose:** Provide actionable next steps  
**Method:** Analyze all results, prioritize issues  
**Output:** Immediate actions, requirements, improvements

## FR4.1 Implementation Details

### Task Parsing
```javascript
// Extract tasks from PLAN.md
const tasks = parsePlanTasks(planContent);
// tasks = [
//   { name: 'Task 1', files: ['a.js', 'b.js'], ... },
//   { name: 'Task 2', files: ['c.js'], ... }
// ]
```

### Deliverable Extraction
```javascript
// From task, extract expected deliverables
const deliverables = extractDeliverables(task);
// deliverables = [
//   { type: 'file', path: 'src/auth/login.js' },
//   { type: 'function', name: 'authenticateUser' },
//   { type: 'test', path: 'test/auth/login.test.js' }
// ]
```

### Verification
```javascript
// Check each deliverable
for (const deliverable of deliverables) {
  const exists = await verifyDeliverable(deliverable);
  if (!exists) {
    task.status = 'INCOMPLETE';
    task.missing.push(deliverable);
  }
}
```

### Completion Calculation
```javascript
const completedTasks = tasks.filter(t => t.status === 'COMPLETE').length;
const completionRate = (completedTasks / tasks.length) * 100;
const overallStatus = completionRate === 100 ? 'PASS' : 'FAIL';
```

## Template Usage

### During Verification
1. Load `templates/VERIFICATION_REPORT.md`
2. Replace template variables with actual values
3. Populate each section with verification results
4. Calculate FR4.1 completion percentage
5. Generate recommendations based on issues found
6. Save to `.planning/verification/{phase}/VERIFICATION_REPORT.md`

### STATE.md Integration
1. Load `templates/STATE_VERIFICATION_ENTRY.md`
2. Replace variables with verification summary
3. Append to STATE.md under "Verification History"
4. Preserve existing STATE.md content
5. Update phase status if verification passed

## Example Workflow

```bash
# Run verification
reis verify phase-2

# Verifier:
# 1. Load PLAN.md
# 2. Run tests → 17/18 passed
# 3. Check feature completeness → 2/3 tasks (66%)
# 4. Validate criteria → 5/6 met
# 5. Check quality → WARNINGS
# 6. Generate report → FAILED
# 7. Update STATE.md

# Output:
❌ Verification FAILED
- Task 2 incomplete (missing password-reset.js)
- 1 test failing
- See: .planning/verification/phase-2/VERIFICATION_REPORT.md

# Developer fixes issues, re-verifies
reis verify phase-2

# Output:
✅ Verification PASSED
- All 3 tasks complete (100%)
- All tests passing (18/18)
- Ready for Phase 3
```

## Critical Success Factors

### FR4.1 Must:
- ✅ Parse ALL tasks from PLAN.md
- ✅ Verify ALL deliverables exist
- ✅ Report missing items with evidence
- ✅ Calculate accurate completion %
- ✅ FAIL if any task incomplete (<100%)

### Report Must:
- ✅ Be clear and actionable
- ✅ Provide evidence for all claims
- ✅ Prioritize issues by severity
- ✅ Give specific recommendations
- ✅ Enable quick re-verification

## Anti-Patterns

❌ Don't report pass if any task incomplete  
❌ Don't skip FR4.1 checks (critical)  
❌ Don't generate vague recommendations  
❌ Don't corrupt STATE.md on updates  
✅ DO fail fast on missing features  
✅ DO provide clear evidence  
✅ DO make reports actionable  
