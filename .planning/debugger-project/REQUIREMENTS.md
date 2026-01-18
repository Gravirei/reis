# REIS Debugger Subagent - Requirements

## Functional Requirements

### FR1: Subagent Specification
**Priority:** Must Have  
**Description:** Create comprehensive reis_debugger subagent specification

**Acceptance Criteria:**
- Subagent markdown file at `subagents/reis_debugger.md`
- 6-step analysis protocol documented
- Input/output specifications clear
- Integration points defined
- Examples of debug sessions included
- Follows existing subagent format (planner, executor, mapper, verifier)

### FR2: Deep Analysis Protocol
**Priority:** Must Have  
**Description:** Implement systematic 6-step analysis process

**Analysis Steps:**
1. **Issue Classification**
   - Categorize issue type (test, quality, docs, regression, integration, **incomplete implementation**)
   - Determine severity (critical, major, minor)
   - Assess scope (isolated, localized, widespread)

2. **Symptom Analysis**
   - What failed? (identify all symptoms)
   - Where did it fail? (file, line, function)
   - When does it fail? (conditions, timing)
   - How does it manifest? (error messages, behavior)

3. **Root Cause Investigation**
   - Why did it fail? (immediate cause)
   - What's the underlying issue? (root cause)
   - What changed recently? (git diff analysis)
   - Are dependencies involved? (package issues)
   - Historical context? (when introduced)

4. **Impact Assessment**
   - Severity level (blocks work? breaking change?)
   - Affected scope (how much code/tests)
   - Dependencies impacted (what else breaks)
   - Urgency (must fix now or can defer)

5. **Solution Design**
   - Generate 3-5 solution options
   - Pros/cons for each approach
   - Complexity estimation
   - Risk assessment
   - Recommended solution with reasoning

6. **Fix Planning**
   - Create executable fix plan (PLAN.md format)
   - Minimal change approach
   - Step-by-step instructions
   - Verification criteria
   - Prevention measures

### FR2.1: Incomplete Implementation Analysis
**Priority:** MUST HAVE (Critical)  
**Description:** Analyze and handle incomplete implementations (missing features) as distinct from bugs

**Problem:** When verifier detects missing features (executor skipped tasks), debugger needs to handle this differently than bugs since nothing is "broken" - it's just incomplete.

**Requirements:**

1. **Incomplete Implementation Classification**
   - Recognize "missing feature" as distinct issue type
   - Distinguish from bugs: No error, no failure, just absence
   - Identify which tasks/features are missing
   - Assess why features were skipped

2. **Root Cause Analysis for Missing Features**
   
   **Common Causes:**
   - **Executor Skip** (Most common, 70%)
     * Task complexity too high for single wave
     * Context refresh happened mid-task
     * Executor encountered blocker and moved on
     * Misinterpreted task as optional
   
   - **Plan Ambiguity** (20%)
     * Unclear task description
     * Acceptance criteria not specific
     * Missing implementation details
   
   - **Dependency Blocker** (10%)
     * Required dependency unavailable
     * External API/service down
     * Environment issue
   
   **Analysis Methods:**
   - Git log analysis (no commits for feature)
   - Task complexity estimation
   - Plan clarity assessment
   - Dependency availability check

3. **Targeted Fix Plan Generation**
   
   **Key Principle:** Only re-implement missing features, don't touch completed ones
   
   **Fix Plan Structure:**
   ```markdown
   ## Wave Fix-X: Implement Missing Feature Y
   Size: [based on complexity]
   
   ### Tasks
   - Task 1: Implement missing deliverable A
   - Task 2: Implement missing deliverable B
   - Task 3: Add tests for new features
   - Task 4: Update documentation
   
   ### Success Criteria
   - ✅ All missing deliverables exist
   - ✅ Tests pass
   - ✅ Feature integrated with existing code
   - ✅ No impact on completed features
   ```

4. **Solution Options for Missing Features**
   
   **Option 1: Targeted Re-execution** (Recommended)
   - Pros: Fast, focused, minimal risk
   - Cons: None significant
   - Time: Based on feature complexity
   - Risk: Low
   
   **Option 2: Re-execute Entire Wave**
   - Pros: Ensures wave completeness
   - Cons: Redundant work, might break working features
   - Time: Original wave time
   - Risk: Medium
   
   **Option 3: Manual Implementation**
   - Pros: Human oversight
   - Cons: Breaks autonomous workflow
   - Time: Variable
   - Risk: Low

5. **Prevention Strategy**
   
   For missing features, recommend:
   - **Clearer task descriptions** in future plans
   - **Explicit deliverables list** in acceptance criteria
   - **Task-by-task checkpoints** during execution
   - **Complexity assessment** before wave assignment
   - **Executor monitoring** for task completion

6. **Reporting Format**

   ```markdown
   ## Debug Report: Incomplete Implementation
   
   ### Issue Classification
   - Type: Incomplete Implementation (NOT a bug)
   - Missing: Task 2 "Build Password Reset"
   - Severity: HIGH (critical feature missing)
   - Scope: Isolated (single feature)
   
   ### Root Cause
   - Likely: Executor skipped task (70% confidence)
   - Evidence: No git commits for password-reset
   - Contributing factor: Task complexity moderate
   
   ### Impact
   - Blocks: User password recovery flow
   - Affects: Authentication system completeness
   - Urgency: IMMEDIATE (phase incomplete)
   
   ### Solution: Targeted Re-execution
   - Implement only Task 2 (password reset)
   - Time estimate: 30 minutes
   - Risk: Low (isolated feature)
   - Fix plan: .planning/debug/phase-X/FIX_PLAN.md
   
   ### Prevention
   - Add explicit deliverables to task description
   - Break complex tasks into smaller sub-tasks
   - Add task-level verification checkpoints
   ```

**Success Criteria:**
- ✅ Correctly identifies missing features vs bugs
- ✅ Generates targeted fix plans (no redundant work)
- ✅ Analyzes root cause of incompleteness
- ✅ Recommends prevention strategies
- ✅ 90%+ accuracy in cause identification
- ✅ Fix plans executable with reis execute-plan

### FR3: Test Failure Analysis
**Priority:** Must Have  
**Description:** Deep analysis of test failures

**Capabilities:**
- Parse test output (Mocha, Jest, Vitest, Node test)
- Extract stack traces
- Identify failing assertions
- Trace execution path
- Find relevant code sections
- Suggest specific fixes
- Generate test-specific fix plans

**Example:**
```
Input: Test "user login" failed
Output: 
  - Root cause: Session middleware not initialized before auth check
  - Location: src/middleware/auth.js line 45
  - Fix: Move session.init() before auth.check() in app.js
  - Why: Middleware order matters, session must exist for auth
```

### FR4: Code Quality Issue Analysis
**Priority:** Must Have  
**Description:** Analyze code quality and linting issues

**Capabilities:**
- Parse linter output (ESLint, etc.)
- Understand error messages
- Identify anti-patterns
- Suggest refactoring
- Provide code examples
- Explain best practices

**Example:**
```
Input: ESLint: "no-unused-vars" error
Output:
  - Issue: Variable 'userData' declared but never used
  - Location: src/users.js line 23
  - Root cause: Incomplete refactoring, old variable left behind
  - Solution: Remove unused variable
  - Prevention: Use IDE with unused variable highlighting
```

### FR5: Integration Issue Analysis
**Priority:** Should Have  
**Description:** Analyze integration and dependency issues

**Capabilities:**
- Dependency conflict detection
- Version mismatch identification
- API compatibility checking
- Configuration error analysis
- Environment issue detection

### FR6: Debug Report Generation
**Priority:** Must Have  
**Description:** Generate comprehensive debug reports

**Report Contents:**
- Executive summary (issue + root cause)
- Detailed analysis (6 steps)
- Solution options (3-5 approaches)
- Recommended solution (with reasoning)
- Fix plan (executable)
- Prevention strategy
- Learning notes

**Format:** Markdown (DEBUG_REPORT.md)  
**Location:** `.planning/debug/phase-X/`

### FR7: Fix Plan Generation
**Priority:** Must Have  
**Description:** Generate executable fix plans in PLAN.md format

**Requirements:**
- Compatible with `reis execute-plan`
- Wave-based structure
- Clear tasks and acceptance criteria
- Minimal change approach
- Verification steps included
- Rollback strategy

**Example:**
```markdown
# Fix Plan: Authentication Test Failure

## Wave 1: Fix Session Initialization
Size: small

### Tasks
- Move session.init() before auth.check() in src/app.js
- Add session initialization test
- Verify auth tests pass

### Success Criteria
- ✅ Session initialized before auth middleware
- ✅ All auth tests passing
- ✅ No new test failures
```

### FR8: Command Integration
**Priority:** Must Have  
**Description:** Create `reis debug` command

**Usage:**
```bash
reis debug <phase>           # Debug phase verification failure
reis debug <context>         # Debug specific context
reis debug --last            # Debug last verification failure
reis debug --report <path>   # Debug specific report
```

**Requirements:**
- Load verification report automatically
- Parse test failures and errors
- Invoke reis_debugger subagent
- Display debug report summary
- Generate fix plan
- Update STATE.md with debug session

### FR9: Pattern Recognition
**Priority:** Should Have  
**Description:** Recognize common issue patterns

**Capabilities:**
- Store issue → solution patterns
- Match current issue against known patterns
- Suggest solutions based on similar past issues
- Confidence scores for pattern matches
- Learn from successful fixes

**Knowledge Base:**
```json
{
  "patterns": [
    {
      "signature": "Session token expires",
      "symptoms": ["auth test timeout", "token invalid"],
      "rootCause": "Token expiry < test duration",
      "solution": "Increase token expiry in test config",
      "confidence": 0.95
    }
  ]
}
```

### FR10: Multiple Solution Options
**Priority:** Must Have  
**Description:** Provide multiple solution approaches for each issue

**For Each Solution:**
- Description (what it does)
- Pros (benefits)
- Cons (drawbacks)
- Complexity (simple, moderate, complex)
- Risk (low, medium, high)
- Time estimate

**Example:**
```
Option 1: Quick Fix
  - Update timeout from 3s to 10s
  - Pros: Fast, simple
  - Cons: Hides underlying slowness
  - Complexity: Simple (1 line change)
  - Risk: Low
  - Time: 2 minutes

Option 2: Proper Fix
  - Optimize slow test, keep 3s timeout
  - Pros: Addresses root cause, tests remain fast
  - Cons: More work
  - Complexity: Moderate (refactor test)
  - Risk: Medium
  - Time: 20 minutes

Recommended: Option 2 (proper fix)
Reasoning: Tests should be fast, timeout increase masks the problem
```

### FR11: Impact Assessment
**Priority:** Must Have  
**Description:** Assess impact of issues and fixes

**Assessment Criteria:**
- Severity (critical, major, minor)
- Scope (isolated, multiple files, widespread)
- Dependencies (what else affected)
- Urgency (blocking, important, can defer)
- Fix risk (safe, moderate, risky)

### FR12: Prevention Strategy
**Priority:** Should Have  
**Description:** Provide strategies to prevent similar issues

**Includes:**
- Why this happened
- How to avoid in future
- What checks to add (linting rules, tests)
- Patterns to watch for
- Best practices to follow

**Example:**
```
Prevention Strategy:
- Why: Session middleware not properly ordered
- Avoid: Use explicit middleware ordering in config
- Add: Test for middleware initialization order
- Pattern: Always initialize session before auth
- Practice: Document middleware dependencies
```

### FR13: Historical Tracking
**Priority:** Should Have  
**Description:** Track debug sessions and build knowledge

**Track:**
- All debug sessions
- Issues encountered
- Solutions applied
- Success/failure of fixes
- Time spent debugging
- Pattern evolution

**Benefits:**
- Learn from past debugs
- Improve pattern matching
- Identify recurring issues
- Track debugging efficiency

---

## Non-Functional Requirements

### NFR1: Performance
**Requirement:** Analysis completes in <2 minutes for typical issues  
**Rationale:** Keep debugging fast, don't slow down workflow

### NFR2: Accuracy
**Requirement:** Correct root cause identification 85%+ of time  
**Rationale:** Users must trust the analysis

### NFR3: Clarity
**Requirement:** Reports are clear, actionable, and understandable  
**Rationale:** Users need to understand analysis and execute fixes

### NFR4: Integration
**Requirement:** Seamless integration with verify command and workflow  
**Rationale:** Should feel like natural part of REIS

### NFR5: Reliability
**Requirement:** Handles edge cases gracefully, no crashes  
**Rationale:** Debug tool must be reliable when things are broken

### NFR6: Extensibility
**Requirement:** Easy to add new analysis types and patterns  
**Rationale:** Different projects have different needs

### NFR7: Compatibility
**Requirement:** Works with multiple languages/frameworks  
**Rationale:** REIS supports various project types

---

## Technical Requirements

### TR1: File Structure
```
subagents/
  reis_debugger.md          # Subagent specification

lib/commands/
  debug.js                  # Debug command (new)

lib/utils/
  debug-analyzer.js         # Analysis engine (new)
  issue-classifier.js       # Issue classification (new)
  pattern-matcher.js        # Pattern matching (new)

templates/
  DEBUG_REPORT.md           # Report template
  FIX_PLAN.md              # Fix plan template

.planning/debug/
  phase-1/
    DEBUG_REPORT.md         # Debug session report
    FIX_PLAN.md            # Generated fix plan
  phase-2/
    ...
  knowledge-base.json       # Pattern storage
```

### TR2: Dependencies
- No new npm dependencies (use built-in)
- Leverage existing REIS utilities
- Compatible with Node.js 18+
- Works within Rovo Dev 200k context

### TR3: Integration Points

**Input Sources:**
- Verification reports (`.planning/verification/`)
- Test output (stdout/stderr)
- Git history (`git diff`, `git log`)
- Code files (for analysis)
- Knowledge base (past patterns)

**Output Destinations:**
- DEBUG_REPORT.md (`.planning/debug/`)
- FIX_PLAN.md (`.planning/debug/`)
- STATE.md (debug history)
- knowledge-base.json (patterns)

**Command Integration:**
```bash
# After verification fails
reis verify 1               # ❌ FAILED
reis debug 1                # Analyze failures
# Review DEBUG_REPORT.md
reis execute-plan .planning/debug/phase-1/FIX_PLAN.md
reis verify 1               # ✅ PASSED
```

### TR4: Error Handling
- Graceful handling of missing files
- Clear error messages
- Fallback to basic analysis if advanced fails
- No data corruption
- Safe to run multiple times

---

## User Stories

### US1: Basic Debugging
**As a** REIS user  
**I want to** understand why verification failed  
**So that** I can fix issues systematically

**Acceptance:**
- Run `reis debug <phase>`
- Receive clear root cause analysis
- Get actionable fix plan
- Execute fix and verify

### US2: Multiple Solutions
**As a** developer  
**I want to** see multiple solution options  
**So that** I can choose the best approach

**Acceptance:**
- Debug report shows 3-5 solutions
- Each has pros/cons
- Recommended solution highlighted
- Can execute any option

### US3: Learning from Past Issues
**As a** REIS user  
**I want** debugger to recognize similar issues  
**So that** fixes are faster over time

**Acceptance:**
- Debugger matches current issue to past patterns
- Shows "I've seen this before..."
- Suggests known working solution
- Improves accuracy over time

### US4: Prevention Guidance
**As a** developer  
**I want to** know how to prevent similar issues  
**So that** I don't repeat mistakes

**Acceptance:**
- Debug report includes prevention section
- Explains why issue happened
- Suggests checks to add
- Recommends best practices

### US5: Integration with Workflow
**As a** REIS user  
**I want** debugging to fit naturally in workflow  
**So that** I don't context switch

**Acceptance:**
- `reis verify` failure → suggest `reis debug`
- Debug generates fix plan compatible with `reis execute-plan`
- All reports in `.planning/` structure
- STATE.md tracks debug sessions

---

## Acceptance Criteria (Overall)

### Debugger Complete When:
1. ✅ reis_debugger subagent specification complete
2. ✅ `reis debug` command working
3. ✅ 6-step analysis protocol implemented
4. ✅ Debug reports generated correctly
5. ✅ Fix plans executable with reis execute-plan
6. ✅ Pattern recognition functional
7. ✅ All tests passing
8. ✅ Documentation complete

### System Ready When:
1. ✅ Can debug test failures
2. ✅ Can debug code quality issues
3. ✅ Can debug integration issues
4. ✅ Multiple solution options provided
5. ✅ Prevention strategies included
6. ✅ Knowledge base working
7. ✅ Debugger verified using REIS (dogfooding)

---

## Constraints

1. Must complete within 4-5 hours
2. No breaking changes to existing commands
3. Works within Rovo Dev context limits
4. No external service dependencies
5. Follows REIS code standards
6. Backward compatible

---

## Assumptions

1. Verification reports exist before debugging
2. Projects have test suites
3. Git repository initialized
4. Node.js 18+ installed
5. Standard project structure

---

## Out of Scope (v1)

- Automatic fix execution without review
- Visual debugging UI
- Remote debugging
- Multi-repository analysis
- Real-time monitoring
- Binary code analysis
- Deep performance profiling
- Automatic test generation

---

**Requirements Status:** ✅ Complete  
**Next Step:** Create ROADMAP.md
