# REIS Debugger Subagent - Project Vision

## Overview

Build the **reis_debugger** subagent to enable deep issue analysis and systematic problem-solving in the REIS autonomous development cycle.

## Problem Statement

Currently, REIS has a gap when verification fails:
- ✅ `reis_planner` creates executable plans
- ✅ `reis_executor` implements plans
- ✅ `reis_verifier` detects issues (what failed)
- ❌ **No systematic debugging** - Users must manually analyze WHY it failed and HOW to fix it

**Result:** 
- Trial-and-error fixing
- Multiple failed verification attempts
- No root cause analysis
- Side effects from blind fixes
- Wasted time on symptom treatment

## Solution

Create **reis_debugger** - a specialized subagent that:
1. Performs deep root cause analysis
2. Understands WHY issues occurred
3. Assesses impact and severity
4. Designs systematic solutions
5. Creates targeted fix plans
6. Prevents similar issues in future
7. Builds knowledge base of patterns

## Vision

**Enable truly intelligent autonomous development:**

```
Without Debugger:
Plan → Execute → Verify ❌ → "Manual trial-and-error" → Verify → Verify → ...

With Debugger:
Plan → Execute → Verify ❌ → Debug (deep analysis) → Fix (systematic) → Verify ✅
```

**Example:**
```
Verification: "Test authentication failed"

Without Debugger:
- Try fix 1: Update password hash → Still fails
- Try fix 2: Change encryption → Still fails  
- Try fix 3: Rewrite module → Finally works (but broke other things)
Time: 2-3 hours, introduced side effects

With Debugger:
- Debug analysis: "Root cause: Session token expires before test completes"
- Solution: "Increase token expiry from 3s to 5s in test config"
- Fix: Update 1 line in test/config.js
- Verify: Passes first try
Time: 15 minutes, no side effects
```

## Success Criteria

### Must Have
- ✅ Subagent specification (`subagents/reis_debugger.md`)
- ✅ Deep analysis protocol (6 steps)
- ✅ Root cause identification
- ✅ Systematic solution design
- ✅ Fix plan generation
- ✅ Debug report generation
- ✅ Integration with verify command
- ✅ Complete documentation

### Should Have
- ✅ Pattern recognition (common issues)
- ✅ Knowledge base storage
- ✅ Multiple solution options
- ✅ Risk assessment for fixes
- ✅ Prevention recommendations
- ✅ Historical tracking
- ✅ Comprehensive tests

### Nice to Have
- ⭐ AI-powered pattern matching
- ⭐ Automatic fix execution (optional)
- ⭐ Learning from past debugs
- ⭐ Blame analysis (git history)
- ⭐ Dependency impact analysis
- ⭐ Performance profiling

## Key Features

### 1. Deep Root Cause Analysis

**6-Step Analysis Protocol:**
```
1. Issue Classification
   - Categorize: test failure, quality, docs, regression, etc.
   - Severity: critical, major, minor
   - Scope: isolated, widespread

2. Symptom Analysis
   - What failed? (surface symptoms)
   - Where did it fail? (location)
   - When did it fail? (timing, conditions)

3. Root Cause Investigation
   - Why did it fail? (immediate cause)
   - What's the underlying issue? (root cause)
   - What changed? (diff analysis)
   - Dependencies involved?

4. Impact Assessment
   - Severity (blocks work? breaking?)
   - Scope (how much affected?)
   - Dependencies (what else broken?)
   - Urgency (fix now or later?)

5. Solution Design
   - Multiple options (3-5 approaches)
   - Pros/cons for each
   - Recommended solution (with reasoning)
   - Implementation complexity
   - Risk level

6. Fix Planning
   - Create targeted fix plan
   - Minimal changes approach
   - Verification strategy
   - Prevention measures
```

### 2. Intelligent Analysis Types

**Test Failure Analysis:**
- Parse stack traces
- Identify failing assertions
- Trace execution path
- Find root cause in code
- Suggest fixes

**Code Quality Analysis:**
- Understand linting errors
- Analyze complexity issues
- Identify anti-patterns
- Suggest refactoring
- Provide examples

**Integration Analysis:**
- Dependency conflicts
- API version mismatches
- Configuration errors
- Environment issues

**Performance Analysis:**
- Slow tests identification
- Memory leak detection
- Bottleneck discovery
- Optimization suggestions

**Documentation Analysis:**
- Missing documentation
- Outdated examples
- Broken references
- Consistency issues

### 3. Pattern Recognition

**Common Issue Patterns:**
- "I've seen this before..."
- Similar failure patterns
- Known bug signatures
- Typical root causes
- Effective solutions

**Knowledge Base:**
- Store issue → solution mappings
- Common anti-patterns
- Best practices
- Project-specific patterns

### 4. Solution Options

For each issue, provide:
- **Option 1:** Quick fix (fast, may be temporary)
- **Option 2:** Proper fix (correct, moderate effort)
- **Option 3:** Comprehensive fix (ideal, higher effort)
- **Recommendation:** Best option with reasoning

### 5. Prevention Strategy

Not just fix, but prevent:
- Why this happened
- How to avoid in future
- What checks to add
- Patterns to watch for
- Tests to add

## Target Users

1. **Solo Developers** - Systematic debugging without teammate help
2. **Development Teams** - Consistent debugging approach
3. **REIS Autonomous System** - Enable true autonomy
4. **Learning Developers** - Understand root causes, learn patterns

## Technical Approach

### Architecture

```
Verification fails
    ↓
User runs: reis debug <context>
    ↓
lib/commands/debug.js
    ↓
Invokes: reis_debugger subagent via Rovo Dev
    ↓
Reads:
  - Verification report (.planning/verification/)
  - Test failures and logs
  - Code changes (git diff)
  - Previous debug history
  - Pattern knowledge base
    ↓
Executes: 6-step analysis protocol
    ↓
Generates:
  - .planning/debug/phase-X/DEBUG_REPORT.md
  - .planning/debug/phase-X/FIX_PLAN.md
  - Updates knowledge base
    ↓
User sees:
  - Root cause analysis
  - Solution options
  - Recommended fix
  - Fix plan to execute
```

### Integration Points

**Input:**
- Verification report (VERIFICATION_REPORT.md)
- Test output and logs
- Current codebase state
- Git history (recent changes)
- Previous debug sessions

**Output:**
- DEBUG_REPORT.md (analysis + root cause)
- FIX_PLAN.md (executable fix plan)
- Updated knowledge base
- Prevention recommendations

**Integration:**
- Works with `reis verify` output
- Generates plans for `reis execute-plan`
- Updates STATE.md with debug history
- Stores patterns in knowledge base

### File Structure

```
subagents/
  reis_debugger.md          # Subagent specification

lib/commands/
  debug.js                  # Debug command (new)

lib/utils/
  debug-analyzer.js         # Analysis utilities (new)
  issue-classifier.js       # Issue classification (new)
  pattern-matcher.js        # Pattern recognition (new)

templates/
  DEBUG_REPORT.md           # Debug report template
  FIX_PLAN.md               # Fix plan template

.planning/debug/
  phase-1/
    DEBUG_REPORT.md         # Phase 1 debug session
    FIX_PLAN.md             # Fix plan
  phase-2/
    ...
  knowledge-base.json       # Stored patterns
```

## Timeline

**Estimated:** 4-5 hours
- Phase 1: Design & Specification (1 hour)
- Phase 2: Core Analysis (1.5 hours)
- Phase 3: Advanced Features (1 hour)
- Phase 4: Testing & Documentation (1 hour)

## Constraints

- Must integrate with existing REIS ecosystem
- Works with Rovo Dev (200k context)
- No breaking changes to existing commands
- Handle various programming languages/frameworks
- Fast analysis (<2 minutes typical case)
- Clear, actionable output

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Analysis too complex | Start simple, iterate |
| Incorrect root cause | Multiple solution options |
| Analysis too slow | Focus on common cases first |
| Integration challenges | Clear interfaces, thorough testing |
| Pattern matching inaccurate | Human review loop, confidence scores |

## Metrics for Success

- ✅ Correct root cause 85%+ of time
- ✅ Analysis completes in <2 minutes
- ✅ First fix attempt succeeds 70%+ of time
- ✅ Reduces debug time by 60%+
- ✅ No side effects from recommended fixes
- ✅ User satisfaction >90%

## Out of Scope (v1)

- Automatic code execution
- Multi-repository analysis
- Real-time monitoring
- Visual debugging UI
- Remote debugging
- Binary/compiled code analysis
- Deep performance profiling

## Dependencies

- Existing REIS infrastructure
- Test frameworks (output parsing)
- Git integration (for diff/blame)
- Verification reports
- Node.js 18+

## Stakeholders

- **REIS Users** - Need systematic debugging
- **Verifier** - Provides input (what failed)
- **Executor** - Uses output (fix plans)
- **REIS Maintainers** - System coherence

## Integration with REIS Workflow

### Complete Cycle

```
1. PLAN (reis_planner)
   ↓
2. EXECUTE (reis_executor)
   ↓
3. VERIFY (reis_verifier)
   ↓
   ├─→ ✅ PASSED → Next phase (back to PLAN)
   │
   └─→ ❌ FAILED → Issues found
         ↓
4. DEBUG (reis_debugger) ← NEW!
   - Deep analysis
   - Root cause identified
   - Solution designed
   - Fix plan created
         ↓
5. FIX (reis_executor with fix plan)
   - Execute targeted fix
   - Minimal changes
   - Verification included
         ↓
6. VERIFY (reis_verifier)
   ↓
   ├─→ ✅ PASSED → Next phase
   └─→ ❌ STILL FAILED → DEBUG again (rare)
```

### Command Flow

```bash
# Normal flow with issues
reis plan 1
reis execute-plan phase1.md
reis verify 1
# ❌ FAILED

# Use debugger
reis debug phase1
# Generates: DEBUG_REPORT.md + FIX_PLAN.md

# Review and execute fix
cat .planning/debug/phase-1/DEBUG_REPORT.md
reis execute-plan .planning/debug/phase-1/FIX_PLAN.md

# Verify fix
reis verify 1
# ✅ PASSED

# Continue to next phase
reis plan 2
...
```

## Next Steps

1. Create REQUIREMENTS.md (detailed requirements)
2. Create ROADMAP.md (phase breakdown)
3. Create PLAN.md files (executable plans)
4. Execute using reis_executor
5. Verify using reis_verifier
6. Debug any issues using reis_debugger itself! (ultimate dogfooding)

---

**Project Status:** 🟢 Ready to Start  
**Priority:** 🔴 High (completes autonomous system)  
**Complexity:** 🟡 Medium (4-5 hours)  
**Dependencies:** reis_verifier should be complete first
