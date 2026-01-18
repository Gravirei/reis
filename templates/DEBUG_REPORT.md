# Debug Report: [Issue Title]

**Generated:** [timestamp]  
**Phase:** [phase-number]  
**Plan:** [plan-file]  
**Issue Type:** [test-failure|quality-issue|docs-problem|regression|integration|dependency|incomplete-implementation]

---

## Issue Classification

### Type & Severity
- **Type:** [one of 7 types]
- **Severity:** [CRITICAL|MAJOR|MINOR]
- **Scope:** [Isolated|Localized|Widespread]

### Incompleteness Analysis (if type = incomplete-implementation)
- **Completeness:** [X]% ([Y]/[Z] tasks complete)
- **Missing Features:**
  - Task [N]: [Task Name]
  - Task [M]: [Task Name]
- **Completed Features:**
  - Task [1]: [Task Name] ✅
  - Task [3]: [Task Name] ✅
- **Evidence:**
  - [file.js NOT FOUND]
  - [function missing from module.js]
  - [No git commits for feature X]

---

## Symptom Analysis

### What Failed?
[Describe all observed symptoms]

**For incomplete implementations:**
- Missing deliverables: [list files/functions/features]
- Expected but absent: [specific items]
- Partial implementations: [if any]

### Where & When?
- **Location:** [file:line or scope]
- **Conditions:** [when it occurs]
- **Frequency:** [always|sometimes|edge-case]

### Error Output
```
[paste relevant error messages, test failures, or missing file evidence]
```

---

## Root Cause Investigation

### Primary Cause
[Identified root cause with confidence level]

**For incomplete implementations:**
- **Likely Cause:** [Executor Skip (70%) | Plan Ambiguity (20%) | Dependency Blocker (10%)]
- **Confidence:** [percentage based on evidence]

### Evidence
[Specific evidence supporting root cause]

**For Executor Skip (if applicable):**
- Git log shows no commits for [feature name]
- Task complexity: [simple|moderate|high]
- Adjacent tasks completed successfully
- Context refresh may have occurred during execution

**For Plan Ambiguity (if applicable):**
- Task description lacks specific file paths
- Acceptance criteria vague ("works properly")
- Implementation details missing

**For Dependency Blocker (if applicable):**
- Error logs show package/API unavailable
- Network timeouts detected
- Environment variables missing

### Contributing Factors
- [Factor 1]
- [Factor 2]

### Timeline
[When issue was introduced, if known]

---

## Impact Assessment

### Severity Analysis
- **Blocks Work:** [Yes|No] - [explanation]
- **Breaking Change:** [Yes|No] - [explanation]
- **Affected Scope:** [list files, tests, features]

**For incomplete implementations:**
- **Phase Completeness:** Cannot mark phase complete until resolved
- **Downstream Impact:** [does it block other phases?]
- **Deferability:** [can this be deferred?]

### Dependencies Impacted
- [List other features/tests affected]

### Urgency
- **Priority:** [IMMEDIATE|HIGH|MEDIUM|LOW]
- **Rationale:** [why this priority]

---

## Solution Design

### Recommended Solution: [Solution Name]

**For incomplete implementations, recommended: Targeted Re-execution**

**Approach:** [detailed description]

**Rationale:** [why this solution is best]

**Time Estimate:** [duration]

**Risk Level:** [LOW|MEDIUM|HIGH]

**For incomplete implementations:**
- **Scope:** Implement ONLY missing features [list]
- **No Impact:** Completed features remain untouched
- **Quick Fix:** [15-45 min per missing feature]

### Alternative Solutions

#### Option 1: [Name]
- **Pros:** [list]
- **Cons:** [list]
- **Time:** [estimate]
- **Risk:** [level]

#### Option 2: [Name]
- **Pros:** [list]
- **Cons:** [list]
- **Time:** [estimate]
- **Risk:** [level]

**For incomplete implementations, alternatives:**

#### Option 2: Re-execute Entire Wave
- **Pros:** Ensures wave completeness
- **Cons:** Redundant re-implementation, wasted effort, risk to working features
- **Time:** Original wave duration
- **Risk:** MEDIUM
- **When to use:** Multiple features missing or unclear state

#### Option 3: Manual Implementation
- **Pros:** Human oversight, quality control
- **Cons:** Breaks autonomous workflow, slower
- **Time:** Variable
- **Risk:** LOW
- **When to use:** Complex or ambiguous features requiring judgment

### Trade-offs Analysis
[Compare approaches, explain recommendation]

---

## Fix Plan

**Location:** `.planning/debug/[phase]/FIX_PLAN.md`

**Scope:**
- [List what will be changed]

**For incomplete implementations:**
- Implement missing Task [N]: [Task Name]
- Add tests for new features
- Verify integration with completed features
- **DO NOT** re-implement Tasks [1, 3] (already complete)

**Verification:**
- [How to verify fix works]

**For incomplete implementations:**
- All missing deliverables exist (file checks)
- Tests pass
- Feature integrates with existing code
- No regression on completed features

---

## Prevention Strategy

### Immediate Measures
[Steps to prevent this specific issue]

**For incomplete implementations:**
1. **Clearer Task Descriptions**
   - Add explicit deliverables list
   - Specify exact file paths
   - Include acceptance criteria with measurable outcomes

2. **Task Complexity Assessment**
   - Break tasks > 45 min into smaller sub-tasks
   - Add checkpoints for multi-file changes
   - Consider wave assignment based on complexity

3. **Executor Monitoring**
   - Verify each task completion before moving to next
   - Add task-level verification commands
   - Use checkpoint:human-verify for critical features

### Long-term Improvements
[Systemic changes to prevent similar issues]

**For incomplete implementations:**
1. Task decomposition guidelines (max 45 min per task)
2. Mandatory deliverables checklist in task descriptions
3. Executor progress tracking between tasks
4. Complexity scoring for wave assignment

---

## Appendix

### Related Files
- [List relevant files examined]

### Commands Used
```bash
[commands used for diagnosis]
```

### References
- [Links to docs, issues, similar patterns]
