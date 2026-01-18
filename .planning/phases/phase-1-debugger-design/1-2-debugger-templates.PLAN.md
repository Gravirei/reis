# Plan: 1-2 - Debugger Output Templates

## Objective
Create DEBUG_REPORT.md and FIX_PLAN.md templates with FR2.1 incomplete implementation sections.

## Context
Debugger generates two outputs:
1. DEBUG_REPORT.md - Analysis results with root cause
2. FIX_PLAN.md - Executable fix plan in PLAN.md format

Both must support incomplete implementation analysis (FR2.1) with targeted fix plan generation.

## Dependencies
- Plan 1-1 (debugger specification must exist first)

## Tasks

<task type="auto">
<name>Create DEBUG_REPORT.md template with incomplete implementation support</name>
<files>templates/DEBUG_REPORT.md</files>
<action>
Create comprehensive debug report template:

```markdown
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
```

**What to avoid:**
- Generic root cause analysis ("something failed")
- Missing incomplete implementation section when applicable
- Vague prevention strategies
- Fix plans without specific scope

**Why this matters:**
- Incomplete implementations need different handling than bugs
- Targeted fix plans prevent wasted re-implementation effort
- Evidence-based root cause enables accurate solutions
</action>
<verify>
```bash
# Check template exists
test -f templates/DEBUG_REPORT.md && echo "✓ DEBUG_REPORT.md template created"

# Verify incomplete implementation section
grep -i "incomplete implementation" templates/DEBUG_REPORT.md | wc -l
# Should find 10+ occurrences

# Check for likelihood analysis
grep -i "likely cause" templates/DEBUG_REPORT.md && echo "✓ Likelihood analysis included"

# Verify targeted re-execution
grep -i "targeted re-execution" templates/DEBUG_REPORT.md && echo "✓ Targeted solution included"
```
</verify>
<done>
- DEBUG_REPORT.md template created with complete structure
- FR2.1 incomplete implementation sections integrated throughout
- Root cause analysis includes likelihood estimation (70%/20%/10%)
- Solution design includes targeted re-execution as recommended approach
- Prevention strategy specific to incomplete implementations
- Evidence-based analysis sections included
</done>
</task>

<task type="auto">
<name>Create FIX_PLAN.md template for targeted fixes</name>
<files>templates/FIX_PLAN.md</files>
<action>
Create fix plan template optimized for incomplete implementations:

```markdown
# Fix Plan: [Issue Title]

**Generated by:** reis_debugger  
**Date:** [timestamp]  
**Issue Type:** [type]  
**Original Plan:** [path to original PLAN.md]

---

## Objective
[One-sentence fix goal]

**For incomplete implementations:**
Complete the missing deliverables from [original plan name]

## Context

### Original Issue
[Brief description of the problem]

**For incomplete implementations:**
- **Original Plan:** [path]
- **Completeness:** [X]% ([Y]/[Z] tasks)
- **Completed Successfully:**
  - Task 1: [Name] ✅
  - Task 3: [Name] ✅
- **Missing:**
  - Task 2: [Name] ❌
- **Root Cause:** [Executor Skip | Plan Ambiguity | Dependency Blocker]
- **Evidence:** [specific evidence]

### Why This Fix
[Rationale for the approach]

**For incomplete implementations:**
This fix plan implements ONLY the missing features. Completed features will NOT be re-implemented to avoid wasted effort and risk of regression.

### Constraints
- [List any constraints or requirements]

**For incomplete implementations:**
- **DO NOT** modify completed Tasks [1, 3]
- **DO NOT** re-implement working features
- **ONLY** add missing Task 2 deliverables
- Ensure integration with existing code

---

## Dependencies
- [List any dependencies]

**For incomplete implementations:**
- Completed tasks from original plan (Tasks 1, 3)
- Original plan file: [path]

---

## Wave Fix-1: [Fix Description]

**Size:** [SMALL|MEDIUM|LARGE] ([time estimate])  
**Risk:** [LOW|MEDIUM|HIGH]

### Tasks

<task type="auto">
<name>[Specific fix task]</name>
<files>[Exact file paths]</files>
<action>
[Detailed implementation instructions]

**For incomplete implementations:**
Implement the missing [feature name] from original Task [N].

**Specific steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Integration points:**
- Connect with [existing completed feature]
- Use [existing utility/function from completed tasks]
- Follow patterns from [completed task reference]

**What to avoid:**
- Modifying completed Task [X] code
- Duplicating functionality from completed features
- Breaking existing tests

**Why:**
- Maintains stability of working features
- Minimizes risk of regression
- Focused implementation
</action>
<verify>
[Specific verification commands]

**For incomplete implementations:**
```bash
# Verify missing deliverable now exists
test -f [missing-file.js] && echo "✓ Missing file created"

# Verify feature works
[test command for new feature]

# Verify no regression on completed features
npm test -- [completed-feature].test.js
```
</verify>
<done>
[Acceptance criteria]

**For incomplete implementations:**
- Missing deliverable [file/feature] now exists
- Tests pass for new feature
- Integration with completed features verified
- No regression on Tasks [1, 3]
- Overall plan completeness now 100%
</done>
</task>

---

## Success Criteria

**For bugs:**
- ✅ [Specific outcome 1]
- ✅ [Specific outcome 2]
- ✅ Tests pass
- ✅ No regressions

**For incomplete implementations:**
- ✅ All missing deliverables implemented
- ✅ Feature completeness: 100% ([Z]/[Z] tasks)
- ✅ New features integrated with completed work
- ✅ No impact on completed Tasks [1, 3]
- ✅ All tests pass (new + existing)
- ✅ Original plan verification now succeeds

---

## Verification

### Overall Checks
```bash
# Run full test suite
npm test

# Verify specific fix
[fix-specific verification commands]
```

**For incomplete implementations:**
```bash
# Verify missing items now exist
test -f [missing-file-1.js] && echo "✓ File 1 exists"
test -f [missing-file-2.js] && echo "✓ File 2 exists"

# Run verifier on original plan
reis verify [original-plan-path]
# Should now show 100% complete

# Verify no regression on completed features
npm test -- [completed-features].test.js

# Check git diff - should only show new files for missing features
git diff --name-only | grep -v [new-feature-files]
# Should be empty (no changes to completed features)
```

### Regression Checks
```bash
# Ensure existing features still work
[regression test commands]
```

---

## Notes

### Implementation Guidance
[Additional notes for executor]

**For incomplete implementations:**
- Focus ONLY on missing Task [N]
- Reference completed tasks for patterns/utilities
- Do not refactor or optimize completed code
- Keep changes isolated to new feature

### Edge Cases
[Any edge cases to handle]

### References
- Original plan: [path]
- Related patterns: [if any]
- Debug report: [path]

---

## Prevention Measures

**For incomplete implementations:**

### For This Plan
1. **Clearer Task Description**
   - Original Task [N] description was: "[original]"
   - Should include: Explicit file paths, acceptance criteria with file existence checks
   
2. **Complexity Assessment**
   - Task estimated complexity: [simple|moderate|high]
   - Should break into sub-tasks if > 45 min

3. **Verification Checkpoint**
   - Add task-level verification: `test -f [deliverable.js]`
   - Prevent moving to next task until verified

### For Future Plans
1. All tasks include explicit deliverables list
2. File existence checks in verification
3. Task complexity scoring in wave assignment
4. Checkpoints for multi-file tasks
```

**What to avoid:**
- Re-implementing completed features (for incomplete implementations)
- Vague scope ("fix the feature")
- Missing integration verification with existing code
- No regression checks

**Why:**
- Targeted fixes prevent wasted effort
- Clear scope prevents scope creep
- Integration checks ensure compatibility
- Regression checks maintain quality
</action>
<verify>
```bash
# Check template exists
test -f templates/FIX_PLAN.md && echo "✓ FIX_PLAN.md template created"

# Verify incomplete implementation sections
grep -i "incomplete implementation" templates/FIX_PLAN.md | wc -l
# Should find 8+ occurrences

# Check for "DO NOT" constraints
grep "DO NOT" templates/FIX_PLAN.md | wc -l
# Should find 3+ occurrences

# Verify targeted approach
grep -i "only.*missing" templates/FIX_PLAN.md | wc -l
# Should find 5+ occurrences
```
</verify>
<done>
- FIX_PLAN.md template created with PLAN.md format
- FR2.1 incomplete implementation sections throughout
- Targeted fix approach (only missing features)
- Clear "DO NOT" constraints to prevent re-implementation
- Integration verification with completed features
- Regression checks included
- Prevention measures specific to incompleteness
</done>
</task>

## Success Criteria
- ✅ DEBUG_REPORT.md template comprehensive and structured
- ✅ FIX_PLAN.md template follows PLAN.md format
- ✅ FR2.1 incomplete implementation sections integrated
- ✅ Templates support both bugs and missing features
- ✅ Targeted fix approach clearly specified
- ✅ Prevention strategies included

## Verification
```bash
# Both templates exist
test -f templates/DEBUG_REPORT.md && echo "✓ DEBUG_REPORT.md exists"
test -f templates/FIX_PLAN.md && echo "✓ FIX_PLAN.md exists"

# Templates have appropriate content for incomplete implementations
grep -q "incomplete implementation" templates/DEBUG_REPORT.md && \
grep -q "incomplete implementation" templates/FIX_PLAN.md && \
echo "✓ FR2.1 content in both templates"

# Targeted approach specified
grep -q "ONLY" templates/FIX_PLAN.md && echo "✓ Targeted fix approach specified"
```
