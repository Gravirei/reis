# 🔍 Missing Feature Detection - Deep Analysis & Solution

**Date:** 2026-01-18  
**Issue:** Verifier needs to detect incomplete implementations (missing features)  
**Status:** Critical gap identified - Solution designed

---

## 🎯 The Problem: Missing Features Are Invisible

### **Scenario:**
```
PLAN.md says:
  - Task 1: Build Feature 1 (User Login)
  - Task 2: Build Feature 2 (Password Reset)
  - Task 3: Build Feature 3 (Profile Page)

Executor implements:
  - Feature 1: ✅ User Login (complete)
  - Feature 2: ❌ MISSING (executor skipped it)
  - Feature 3: ✅ Profile Page (complete)

Current Verifier checks:
  - Tests pass? ✅ (if no tests for Feature 2)
  - Code quality good? ✅ (existing code is fine)
  - Documentation exists? ✅ (documented what exists)
  
Result: ✅ VERIFICATION PASSED (but Feature 2 is missing!)
```

### **Why This Is Dangerous:**
- ❌ Incomplete implementation goes undetected
- ❌ Users get incomplete features
- ❌ Requirements not fully met
- ❌ Silent failure (no error, no alert)
- ❌ Technical debt accumulates

---

## 🔬 Current State Analysis

### **What Current Plans Check:**

#### **FR4: Success Criteria Validation (Current)**
```markdown
Requirements:
- Parse success criteria from plan files
- For each criterion:
  - Check if met
  - Document evidence
  - Flag if unmet
- Support multiple criterion formats
- Provide clear pass/fail per criterion
```

**Problem:** This is too vague!
- ✅ Checks "criteria" but what ARE the criteria?
- ❌ No explicit feature completeness check
- ❌ No task-by-task verification
- ❌ No implementation coverage check

### **What's Missing:**

1. **Feature-Level Tracking**
   - No mapping: PLAN tasks → Actual implementations
   - No check: "Was Feature 2 implemented?"

2. **Task Completion Validation**
   - No verification: Each PLAN task has corresponding code
   - No check: "Did all tasks get executed?"

3. **Implementation Coverage**
   - No analysis: What was planned vs what exists
   - No diff: Expected features vs actual features

---

## ✅ The Solution: Enhanced Verifier

### **New Requirement: FR4.1 - Feature Completeness Validation**

```markdown
### FR4.1: Feature Completeness Validation
**Priority:** MUST HAVE (Critical)
**Description:** Verify all planned features/tasks are implemented

**Requirements:**

1. Task-Level Verification
   - Parse all tasks from PLAN.md waves
   - For each task:
     * Identify expected deliverables (files, functions, features)
     * Check if deliverables exist in codebase
     * Verify implementation matches task description
     * Flag missing implementations

2. Feature Mapping
   - Extract features from PLAN.md:
     * "Build X" → Expect X to exist
     * "Implement Y" → Expect Y in code
     * "Add Z" → Expect Z functionality
   - Map features to:
     * File existence (new files created?)
     * Function existence (new functions added?)
     * Test existence (tests for feature?)

3. Implementation Coverage
   - Calculate: Tasks completed / Total tasks
   - Report: Which tasks are incomplete
   - Evidence: What's missing and where expected

4. Explicit Deliverable Checking
   - If task says "Create auth.js" → Verify auth.js exists
   - If task says "Add login function" → Verify login function in code
   - If task says "Implement API endpoint /users" → Verify endpoint exists

5. Smart Detection Methods
   - File existence checks (git status --short)
   - Code pattern matching (grep for function names)
   - Git diff analysis (what was actually added?)
   - Test coverage (are new features tested?)
   - Documentation mentions (is feature documented?)

**Success Criteria:**
- ✅ Detects missing features with 95%+ accuracy
- ✅ Maps tasks to implementations correctly
- ✅ Reports incomplete tasks with evidence
- ✅ No false positives for refactoring/renames
- ✅ Clear output: "Task X not completed: Feature Y missing"
```

---

## 🔧 Implementation Strategy

### **Step 1: Parse PLAN.md for Expected Deliverables**

```javascript
// Extract tasks and expected deliverables
function parseExpectedDeliverables(planMd) {
  const tasks = parseTasks(planMd);
  
  return tasks.map(task => ({
    taskId: task.id,
    description: task.description,
    expectedDeliverables: extractDeliverables(task),
    verificationCriteria: task.successCriteria
  }));
}

function extractDeliverables(task) {
  const deliverables = [];
  
  // Pattern matching for common task types
  const patterns = {
    files: /create|add|implement|build.*?([a-z0-9_/-]+\.(js|ts|md|json))/gi,
    functions: /implement|add|create.*?function.*?`?([a-zA-Z_][a-zA-Z0-9_]*)`?/gi,
    features: /feature:?\s*(.+?)(?:\n|$)/gi,
    apis: /endpoint|route|api.*?(\/.+?)(?:\s|$)/gi,
    classes: /class.*?`?([A-Z][a-zA-Z0-9_]*)`?/gi
  };
  
  // Extract each type
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = [...task.description.matchAll(pattern)];
    matches.forEach(m => deliverables.push({ type, value: m[1] }));
  }
  
  return deliverables;
}
```

### **Step 2: Verify Each Deliverable Exists**

```javascript
function verifyDeliverables(expectedDeliverables, codebase) {
  const results = [];
  
  for (const task of expectedDeliverables) {
    const taskResult = {
      taskId: task.taskId,
      description: task.description,
      status: 'complete',
      missingDeliverables: [],
      evidence: []
    };
    
    for (const deliverable of task.expectedDeliverables) {
      const exists = checkDeliverableExists(deliverable, codebase);
      
      if (!exists) {
        taskResult.status = 'incomplete';
        taskResult.missingDeliverables.push(deliverable);
      } else {
        taskResult.evidence.push({
          deliverable,
          found: exists.location,
          confidence: exists.confidence
        });
      }
    }
    
    results.push(taskResult);
  }
  
  return results;
}

function checkDeliverableExists(deliverable, codebase) {
  switch (deliverable.type) {
    case 'files':
      return checkFileExists(deliverable.value);
      
    case 'functions':
      return searchForFunction(deliverable.value, codebase);
      
    case 'classes':
      return searchForClass(deliverable.value, codebase);
      
    case 'apis':
      return searchForEndpoint(deliverable.value, codebase);
      
    case 'features':
      return searchForFeature(deliverable.value, codebase);
  }
}
```

### **Step 3: Generate Missing Features Report**

```markdown
# Verification Report

## Feature Completeness: ❌ INCOMPLETE

### Tasks: 2/3 Completed (66%)

#### ✅ Task 1: Build User Login
**Status:** Complete
**Evidence:**
- File: `src/auth/login.js` exists
- Function: `authenticateUser()` found in src/auth/login.js:15
- Test: `test/auth/login.test.js` exists
- Documentation: Mentioned in README.md

#### ❌ Task 2: Build Password Reset
**Status:** INCOMPLETE - FEATURE MISSING
**Missing Deliverables:**
- File: `src/auth/password-reset.js` NOT FOUND
- Function: `sendResetEmail()` NOT FOUND
- Endpoint: `/api/reset-password` NOT FOUND
- Test: `test/auth/password-reset.test.js` NOT FOUND

**Impact:** HIGH - Critical feature missing
**Recommendation:** Implement missing feature before proceeding

#### ✅ Task 3: Build Profile Page
**Status:** Complete
**Evidence:**
- File: `src/pages/profile.js` exists
- Component: `ProfilePage` found in src/pages/profile.js:10
- Test: `test/pages/profile.test.js` exists

---

## Verdict: ❌ VERIFICATION FAILED
**Reason:** Task 2 (Password Reset) not implemented
**Action Required:** Implement missing feature
```

---

## 🐛 How Debugger Handles This

### **Current Challenge:**
"Missing feature" is NOT a bug, it's an **incompleteness issue**

### **Debugger Analysis for Missing Features:**

```markdown
# Debug Report: Task 2 Not Completed

## Issue Classification
- **Type:** Incomplete Implementation (not a bug)
- **Severity:** High (blocks phase completion)
- **Scope:** Isolated (single feature)

## Symptom Analysis
- **What failed:** Task 2 "Build Password Reset" not implemented
- **Where:** Expected in src/auth/password-reset.js
- **When:** During Wave 2 execution
- **Evidence:** File doesn't exist, no related code found

## Root Cause Investigation
**Why did this happen?**

Possible reasons (ordered by likelihood):

1. **Executor Skip (70% confidence)**
   - Executor misinterpreted task
   - Task complexity too high for single wave
   - Executor encountered blocker and moved on
   - Context refresh happened mid-task

2. **Plan Ambiguity (20% confidence)**
   - Task description unclear
   - Acceptance criteria not specific enough
   - Missing implementation details

3. **Dependency Issue (10% confidence)**
   - Required dependency not available
   - Blocker prevented implementation

**Evidence from git log:**
```bash
git log --since="2 hours ago" --grep="password" --grep="reset"
# No commits found related to password reset
```

## Impact Assessment
- **Severity:** HIGH - Critical auth feature missing
- **Blocks:** User password recovery flow
- **Dependencies:** Profile page may link to reset (broken link)
- **Urgency:** IMMEDIATE - must fix before phase complete

## Solution Design

### Option 1: Re-execute Task 2 Only (Recommended)
**Approach:** Create targeted plan for missing feature only

**Pros:**
- ✅ Focused, minimal work
- ✅ Fast (1 wave, ~30 min)
- ✅ No risk to existing features

**Cons:**
- ❌ None significant

**Implementation:**
```markdown
## Wave Fix-1: Implement Password Reset
Size: small

### Tasks
- Create src/auth/password-reset.js with sendResetEmail()
- Add /api/reset-password endpoint in routes
- Create test/auth/password-reset.test.js
- Update documentation

### Success Criteria
- ✅ password-reset.js exists with sendResetEmail function
- ✅ Endpoint /api/reset-password responds
- ✅ Tests pass
- ✅ Documented in README
```

**Risk:** Low  
**Time:** 30 minutes  
**Confidence:** 95%

### Option 2: Re-execute Entire Wave 2
**Approach:** Re-run wave that contained Task 2

**Pros:**
- ✅ Ensures everything in wave is correct
- ✅ May catch other issues

**Cons:**
- ❌ Redundant work (re-implements Task 1 & 3)
- ❌ Risk of breaking working features
- ❌ Slow (1 hour)

**Risk:** Medium  
**Time:** 60 minutes  
**Confidence:** 90%

### Option 3: Manual Implementation
**Approach:** Developer implements manually

**Pros:**
- ✅ Human oversight
- ✅ Can handle complex edge cases

**Cons:**
- ❌ Breaks autonomous workflow
- ❌ Requires manual work

**Risk:** Low  
**Time:** Variable (20-60 min)  
**Confidence:** 100%

## Recommended Solution: Option 1

**Fix Plan Generated:** `.planning/debug/phase-X/FIX_PLAN.md`

Execute with:
```bash
reis execute-plan .planning/debug/phase-X/FIX_PLAN.md
reis verify phase-X
# Should pass this time
```

## Prevention Strategy

**Why this happened:**
- Task skipped during execution (executor error)

**How to prevent:**
1. **Enhanced executor monitoring:** Track task-by-task completion
2. **Explicit task tracking:** Executor updates STATE.md per task
3. **Checkpoint per task:** Auto-checkpoint after each task
4. **Clearer acceptance criteria:** Be more specific about deliverables

**Pattern to watch for:**
- Silent task skips
- Complex multi-file tasks in single wave
- Missing git commits for planned tasks
```

---

## 🔄 Updated Workflow

### **With Enhanced Verifier + Debugger:**

```bash
# Phase 1
reis plan 1
reis execute-plan phase1.md

# Verify (with feature completeness check)
reis verify 1
# ❌ FAILED: Task 2 not completed
#    Missing: src/auth/password-reset.js
#    Impact: HIGH

# Debug (analyzes WHY missing)
reis debug 1
# Root cause: Executor skipped task
# Solution: Re-execute Task 2 only
# Fix plan: .planning/debug/phase-1/FIX_PLAN.md

# Review debug report
cat .planning/debug/phase-1/DEBUG_REPORT.md

# Execute targeted fix
reis execute-plan .planning/debug/phase-1/FIX_PLAN.md

# Verify again
reis verify 1
# ✅ PASSED: All tasks complete, all features present

# Continue to Phase 2
reis plan 2
...
```

---

## 📝 Enhanced Requirements

### **For Verifier:**

**New:** `FR4.1: Feature Completeness Validation`
- Parse PLAN.md tasks
- Extract expected deliverables
- Verify each deliverable exists
- Report missing implementations
- Calculate task completion percentage

### **For Debugger:**

**Enhanced:** `FR2.1: Incomplete Implementation Analysis`
- Classify "missing feature" as distinct from "bug"
- Analyze WHY feature was skipped
- Recommend targeted re-execution
- Generate fix plan for missing features only
- Prevent re-work on completed features

---

## 🎯 Implementation Priority

**CRITICAL:** This must be added before building verifier/debugger

**Update Required:**
1. ✅ Enhance verifier REQUIREMENTS.md with FR4.1
2. ✅ Update verifier PLAN.md files to include completeness checks
3. ✅ Enhance debugger REQUIREMENTS.md with incompleteness analysis
4. ✅ Update debugger PLAN.md files to handle missing features

---

## ✅ Success Criteria

### **Verifier Success:**
```
PLAN says: Build A, B, C
Executor builds: A, C (missing B)

Verifier detects:
❌ VERIFICATION FAILED
  - Tasks: 2/3 complete (66%)
  - Missing: Task B
  - Evidence: Expected files/functions not found
  - Impact: HIGH
```

### **Debugger Success:**
```
Missing feature detected

Debugger analyzes:
- Root cause: Why B was skipped
- Solution: Re-execute B only (targeted fix)
- Fix plan: Single wave to implement B
- Prevention: How to avoid skips

Output: Executable FIX_PLAN.md
```

---

## 🚀 Next Steps

**I need to:**
1. Update verifier requirements with FR4.1
2. Update verifier plans to include completeness checks
3. Update debugger requirements to handle missing features
4. Update debugger plans to analyze incompleteness
5. Regenerate affected PLAN.md files

**Estimated time:** 30-45 minutes to update all documents

---

**Should I proceed with these enhancements?** This is a critical addition that makes the system truly robust! 🎯
