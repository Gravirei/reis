# Plan: 1-1 - Debugger Subagent Specification

## Objective
Create the `subagents/reis_debugger.md` specification defining the debugger's deep analysis protocol, including FR2.1 incomplete implementation handling.

## Context
The debugger subagent performs post-verification failure analysis. It must:
- Use systematic 6-step analysis protocol
- Handle 7 issue types (test failures, quality issues, docs, regressions, integration, **incomplete implementations**, dependencies)
- Generate executable fix plans
- Distinguish between bugs (broken code) and missing features (incomplete work)
- Create targeted fix plans that avoid redundant re-implementation

**Key Enhancement (FR2.1):** Missing features are NOT bugs. They require different analysis and targeted re-execution, not debugging.

## Dependencies
- Verifier already implemented (FR4.1 detects missing features)
- Planning system (PLAN.md format established)

## Tasks

<task type="auto">
<name>Create debugger subagent specification with FR2.1 incomplete implementation analysis</name>
<files>subagents/reis_debugger.md</files>
<action>
Create comprehensive debugger specification following the structure:

**1. Role & Purpose** (~50 lines)
- Post-verification failure analyst
- Systematic deep analysis using 6-step protocol
- Generates executable fix plans, not just reports
- Handles both bugs AND incomplete implementations

**2. When Spawned** (~30 lines)
- After `reis verify` failures
- After executor completion with issues
- On user request for specific problems
- When pattern analysis needed

**3. Issue Type Classification** (~100 lines)

Define 7 issue types with detection patterns:

```markdown
### Issue Types

1. **Test Failures**
   - Detection: Test output shows failures/errors
   - Examples: Unit tests fail, integration tests error
   - Analysis focus: Why test fails, what changed

2. **Code Quality Issues**
   - Detection: Linter errors, type errors, build failures
   - Examples: ESLint violations, TypeScript errors
   - Analysis focus: Code standards, syntax issues

3. **Documentation Problems**
   - Detection: Missing docs, outdated examples
   - Examples: README incomplete, API docs wrong
   - Analysis focus: Documentation completeness

4. **Regression Issues**
   - Detection: Previously working feature now broken
   - Examples: git bisect shows breaking commit
   - Analysis focus: What changed, when, why

5. **Integration Issues**
   - Detection: Components don't work together
   - Examples: API mismatch, incompatible versions
   - Analysis focus: Interface contracts, dependencies

6. **Dependency Issues**
   - Detection: Package errors, version conflicts
   - Examples: npm install fails, peer dependency warnings
   - Analysis focus: Package resolution, compatibility

7. **Incomplete Implementation** (FR2.1 - NEW)
   - Detection: Verifier reports completion < 100%, missing deliverables
   - Examples: Task 2/3 complete, password-reset.js NOT FOUND
   - Analysis focus: WHY skipped, targeted fix plan
   - **KEY DIFFERENCE:** Nothing is broken, just missing
```

**4. Six-Step Analysis Protocol** (~250 lines)

```markdown
## Analysis Protocol

### Step 1: Issue Classification
**Purpose:** Categorize and scope the problem

**Process:**
- Identify issue type from 7 categories
- Determine severity (critical/major/minor)
- Assess scope (isolated/localized/widespread)
- **NEW:** Distinguish bugs vs incomplete implementations

**For Incomplete Implementations:**
- Extract which tasks/features are missing
- Identify what was completed successfully
- Quantify incompleteness percentage

**Output:**
```json
{
  "type": "incomplete-implementation",
  "missing": ["Task 2: Password Reset"],
  "completed": ["Task 1: Login", "Task 3: Session Management"],
  "completeness": "66%",
  "severity": "high"
}
```

### Step 2: Symptom Analysis
**Purpose:** Document what failed and how

**Process:**
- What failed? (identify all symptoms)
- Where did it fail? (file, line, function)
- When does it fail? (conditions, timing)
- How does it manifest? (error messages, behavior)

**For Incomplete Implementations:**
- What deliverables are missing?
- What evidence shows incompleteness? (file not found, function missing)
- Are there partial implementations?

### Step 3: Root Cause Investigation
**Purpose:** Determine WHY the issue occurred

**For Bugs:**
- Analyze git history (what changed)
- Check dependencies (version conflicts)
- Review code logic (implementation errors)
- Trace execution flow

**For Incomplete Implementations (FR2.1):**

Analyze WHY features were skipped using likelihood estimation:

**Cause 1: Executor Skip (70% of cases)**
- Task complexity too high for single execution
- Context refresh happened mid-task
- Executor encountered blocker and moved on
- Misinterpreted task as optional

**Evidence checks:**
- `git log --oneline` shows no commits for feature
- Task has high complexity indicators (multiple files, API calls)
- Adjacent tasks completed successfully

**Cause 2: Plan Ambiguity (20% of cases)**
- Task description unclear or vague
- Acceptance criteria not specific
- Missing implementation details

**Evidence checks:**
- Task description < 3 sentences
- No specific file paths mentioned
- Vague acceptance criteria ("works properly")

**Cause 3: Dependency Blocker (10% of cases)**
- Required dependency unavailable
- External API/service unreachable
- Environment configuration missing

**Evidence checks:**
- Error logs mention missing packages
- Network timeouts in logs
- Environment variable issues

**Output likelihood estimates:**
```json
{
  "likelyCause": "executor-skip",
  "confidence": 0.70,
  "evidence": [
    "No git commits for password-reset feature",
    "Task involves 3 files and external email API",
    "Adjacent tasks (login, session) completed successfully"
  ],
  "contributingFactors": [
    "Task complexity: moderate-high",
    "Plan clarity: adequate"
  ]
}
```

### Step 4: Impact Assessment
**Purpose:** Understand severity and urgency

**Process:**
- Severity level (blocks work? breaking change?)
- Affected scope (how much code/tests)
- Dependencies impacted (what else breaks)
- Urgency (must fix now or can defer)

**For Incomplete Implementations:**
- Does missing feature block other work?
- Is phase considered complete without it?
- Can it be deferred to next phase?

### Step 5: Solution Design
**Purpose:** Generate actionable solutions

**For Bugs:**
- Generate 3-5 solution options
- Pros/cons for each approach
- Complexity estimation
- Risk assessment
- Recommended solution with reasoning

**For Incomplete Implementations (FR2.1):**

Generate solution options with clear recommendation:

**Option 1: Targeted Re-execution** (RECOMMENDED)
```markdown
- Description: Create fix plan implementing ONLY missing features
- Scope: Single wave, isolated tasks
- Time: 15-45 min per missing feature
- Risk: LOW (no impact on completed features)
- Pros: Fast, focused, minimal risk, no redundant work
- Cons: None significant
- Recommendation: Use this for isolated missing features
```

**Option 2: Re-execute Entire Wave**
```markdown
- Description: Re-run the original wave completely
- Scope: All wave tasks
- Time: Original wave duration
- Risk: MEDIUM (might break working features)
- Pros: Ensures wave completeness, catches edge cases
- Cons: Redundant re-implementation, wasted effort
- Recommendation: Only if multiple features missing or unclear state
```

**Option 3: Manual Implementation**
```markdown
- Description: Human developer implements missing feature
- Scope: Manual work
- Time: Variable
- Risk: LOW (human oversight)
- Pros: Quality control, learning opportunity
- Cons: Breaks autonomous workflow, slower
- Recommendation: Only for truly complex or ambiguous features
```

### Step 6: Fix Planning
**Purpose:** Create executable fix plan

**For Bugs:**
- Generate PLAN.md in .planning/debug/phase-X/
- Minimal change approach
- Step-by-step instructions
- Verification criteria
- Prevention measures

**For Incomplete Implementations:**

Generate targeted fix plan:

**Structure:**
```markdown
# Fix Plan: Implement Missing Feature X

## Objective
Complete the missing deliverables from [original plan]

## Context
- Original plan: [path]
- Completed: Tasks 1, 3
- Missing: Task 2 (Password Reset)
- Reason: Executor skip (likely complexity)

## Wave Fix-1: Implement Password Reset
Size: SMALL (30 min)

### Task 1: Create Password Reset Endpoint
Files: src/app/api/auth/reset-password/route.ts
Action:
- Implement POST endpoint accepting {email}
- Generate secure reset token (crypto.randomBytes)
- Store token with expiry in database
- Send reset email via SendGrid
- Return 200 on success

Verify: curl -X POST localhost:3000/api/auth/reset-password
Done: Endpoint returns 200, email sent, token in DB

### Task 2: Add Password Reset Tests
Files: tests/auth/reset-password.test.js
Action:
- Test valid email sends reset link
- Test invalid email returns 404
- Test token expiry after 1 hour

Verify: npm test -- reset-password.test.js
Done: All 3 tests pass

## Success Criteria
- ✅ Password reset endpoint exists and works
- ✅ Tests pass
- ✅ Feature integrates with existing auth system
- ✅ No impact on completed login/session features

## Prevention
- Break complex tasks into smaller sub-tasks
- Add explicit deliverables list in task descriptions
- Use task-level verification checkpoints
```

**Key Principles for Incomplete Implementation Fix Plans:**
- Scope ONLY missing features (no touching completed work)
- Clear success criteria (what makes it complete)
- Low risk approach (isolated implementation)
- Quick execution (15-45 min per feature)
```

**5. Output Format** (~80 lines)

Specify DEBUG_REPORT.md structure with incomplete implementation section:

```markdown
## Debug Report Template

### Issue Classification
- Type: [one of 7 types]
- Severity: [critical/major/minor]
- Scope: [isolated/localized/widespread]

**If type = incomplete-implementation:**
- Missing: [list of missing tasks/features]
- Completed: [list of completed tasks]
- Completeness: [percentage]

### Root Cause
- Primary cause: [identified root cause]
- Contributing factors: [list]
- Confidence: [percentage]

**If incomplete-implementation:**
- Likely reason: [executor-skip/plan-ambiguity/dependency-blocker]
- Evidence: [specific evidence from git log, task analysis]
- Confidence: [70%/20%/10% based on cause type]

### Solution Recommendation
- Recommended approach: [solution name]
- Rationale: [why this solution]
- Time estimate: [duration]
- Risk level: [low/medium/high]

**If incomplete-implementation:**
- Recommended: Targeted Re-execution
- Scope: [specific missing features]
- Fix plan: [path to FIX_PLAN.md]

### Prevention
- [specific measures to prevent recurrence]

**If incomplete-implementation:**
- Improve task descriptions (add explicit deliverables)
- Break complex tasks into smaller units
- Add task-level checkpoints
- Assess task complexity before wave assignment
```

**6. Integration Points** (~50 lines)
- Input: DEBUG_INPUT.md from verifier
- Output: DEBUG_REPORT.md + FIX_PLAN.md
- Spawning: Via `reis debug` command
- Knowledge base: patterns/debug/ directory

**7. Behavioral Guidelines** (~40 lines)
- Systematic: Always follow 6-step protocol
- Evidence-based: Cite specific evidence (git commits, logs)
- Actionable: Every report must include executable fix plan
- Targeted: For incomplete implementations, avoid redundant re-work
- Prevention-focused: Always include measures to prevent recurrence

**What to avoid:**
- Skipping steps in analysis protocol
- Vague root cause analysis ("something is wrong")
- Generic solutions without pros/cons
- Fix plans that re-implement completed work (incomplete implementations)
- Missing likelihood estimation for incomplete implementations
- Confusing bugs with missing features

**Why these matter:**
- Systematic protocol ensures consistent quality
- Evidence-based analysis enables accurate diagnosis
- Targeted fix plans prevent wasted effort on re-implementation
- Prevention measures improve future execution quality
</action>
<verify>
```bash
# Check file exists and has content
cat subagents/reis_debugger.md | wc -l
# Should be ~650 lines

# Verify FR2.1 incomplete implementation content
grep -i "incomplete implementation" subagents/reis_debugger.md | wc -l
# Should find 15+ occurrences

# Check for 7 issue types
grep -c "Issue Types" subagents/reis_debugger.md
# Should be 1

# Check for targeted re-execution
grep -i "targeted re-execution" subagents/reis_debugger.md | wc -l
# Should find 3+ occurrences

# Verify likelihood estimation section exists
grep -i "likelihood" subagents/reis_debugger.md | wc -l
# Should find 3+ occurrences
```
</verify>
<done>
- File `subagents/reis_debugger.md` created with ~650 lines
- FR2.1 incomplete implementation analysis fully integrated
- 7 issue types defined (including incomplete implementation)
- 6-step protocol includes incomplete implementation handling
- Targeted fix plan generation specified
- Root cause analysis with likelihood estimation (70%/20%/10%)
- Clear distinction between bugs and missing features
- Prevention strategies included
</done>
</task>

## Success Criteria
- ✅ Debugger specification is comprehensive and actionable
- ✅ FR2.1 incomplete implementation analysis fully integrated
- ✅ 7 issue types clearly defined with detection patterns
- ✅ 6-step protocol includes special handling for missing features
- ✅ Targeted fix plan generation prevents redundant work
- ✅ Root cause analysis includes likelihood estimation
- ✅ Clear behavioral guidelines for executors

## Verification
```bash
# Full specification exists
test -f subagents/reis_debugger.md && echo "✓ Specification created"

# Has appropriate length
lines=$(cat subagents/reis_debugger.md | wc -l)
if [ $lines -ge 600 ] && [ $lines -le 700 ]; then
  echo "✓ Specification length appropriate ($lines lines)"
fi

# FR2.1 content integrated
if grep -q "Incomplete Implementation" subagents/reis_debugger.md; then
  echo "✓ FR2.1 incomplete implementation included"
fi

# Likelihood estimation included
if grep -q "likelihood" subagents/reis_debugger.md; then
  echo "✓ Root cause likelihood estimation included"
fi
```
