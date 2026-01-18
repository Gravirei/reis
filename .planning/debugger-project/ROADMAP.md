# REIS Debugger Subagent - Roadmap

## Overview

Build the **reis_debugger** subagent to enable deep root cause analysis and systematic problem-solving in the REIS autonomous development cycle.

**Timeline:** 4-5 hours  
**Phases:** 4  
**Waves:** 8  

---

## Milestone: REIS Debugger v1.0

### Phase 1: Design & Specification (1 hour)

**Goal:** Create comprehensive subagent specification and templates

#### Wave 1.1: Subagent Specification (30 min)
**Size:** Small  
**Dependencies:** None

**Tasks:**
- Create `subagents/reis_debugger.md`
- Define 6-step analysis protocol
- Specify input/output formats
- Document integration with verify command
- Add example debug scenarios (test failure, code quality, integration)
- Define knowledge base structure

**Success Criteria:**
- ✅ reis_debugger.md follows existing subagent format
- ✅ 6-step protocol clearly defined
- ✅ Input/output specifications complete
- ✅ At least 3 example scenarios included
- ✅ Integration points documented

#### Wave 1.2: Templates & Report Design (30 min)
**Size:** Small  
**Dependencies:** Wave 1.1

**Tasks:**
- Create `templates/DEBUG_REPORT.md` template
- Create `templates/FIX_PLAN.md` template
- Define report structure (summary, analysis, solutions, recommendations)
- Design fix plan format (compatible with reis execute-plan)
- Create example debug report
- Create example fix plan

**Success Criteria:**
- ✅ DEBUG_REPORT.md template covers all 6 steps
- ✅ FIX_PLAN.md compatible with executor
- ✅ Example reports demonstrate format
- ✅ Clear sections for root cause, solutions, prevention

---

### Phase 2: Core Implementation (1.5 hours)

**Goal:** Implement core debugging functionality

#### Wave 2.1: Debug Command Creation (30 min)
**Size:** Medium  
**Dependencies:** Phase 1

**Tasks:**
- Create `lib/commands/debug.js`
- Implement command-line interface
- Parse phase/context arguments
- Load verification report automatically
- Invoke reis_debugger subagent
- Display debug report summary
- Handle errors gracefully

**Success Criteria:**
- ✅ `reis debug <phase>` command works
- ✅ Loads verification reports correctly
- ✅ Invokes debugger subagent properly
- ✅ Displays clear output
- ✅ Error handling works

#### Wave 2.2: Issue Classification Module (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.1

**Tasks:**
- Create `lib/utils/issue-classifier.js`
- Implement issue type detection (test, quality, docs, integration)
- Implement severity assessment (critical, major, minor)
- Implement scope analysis (isolated, localized, widespread)
- Add classification logic for common patterns
- Export classification utilities

**Success Criteria:**
- ✅ Correctly classifies test failures
- ✅ Correctly classifies code quality issues
- ✅ Assigns appropriate severity
- ✅ Determines scope accurately
- ✅ Handles edge cases

#### Wave 2.3: Root Cause Analysis Engine (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.2

**Tasks:**
- Create `lib/utils/debug-analyzer.js`
- Implement symptom analysis
- Implement root cause investigation
- Implement git diff analysis
- Implement dependency checking
- Add stack trace parsing
- Export analysis functions

**Success Criteria:**
- ✅ Parses test failures correctly
- ✅ Traces root causes effectively
- ✅ Analyzes git changes
- ✅ Identifies dependencies involved
- ✅ Generates actionable insights

---

### Phase 3: Advanced Features (1 hour)

**Goal:** Add intelligent analysis and pattern recognition

#### Wave 3.1: Solution Design Module (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.3

**Tasks:**
- Implement solution generation (3-5 options per issue)
- Add pros/cons analysis for each solution
- Add complexity estimation
- Add risk assessment
- Implement solution ranking
- Generate recommended solution with reasoning

**Success Criteria:**
- ✅ Generates multiple solution options
- ✅ Each solution has pros/cons
- ✅ Complexity estimated accurately
- ✅ Risk assessment reasonable
- ✅ Recommendation well-reasoned

#### Wave 3.2: Pattern Recognition System (30 min)
**Size:** Medium  
**Dependencies:** Wave 2.3

**Tasks:**
- Create `lib/utils/pattern-matcher.js`
- Implement pattern storage (knowledge-base.json)
- Implement pattern matching algorithm
- Add confidence scoring
- Implement pattern learning from successful fixes
- Add "I've seen this before" detection

**Success Criteria:**
- ✅ Stores patterns in knowledge base
- ✅ Matches current issues to past patterns
- ✅ Provides confidence scores
- ✅ Learns from successful fixes
- ✅ Improves over time

#### Wave 3.3: Fix Plan Generation (30 min)
**Size:** Medium  
**Dependencies:** Waves 3.1, 3.2

**Tasks:**
- Implement fix plan generator
- Generate PLAN.md format compatible with executor
- Create wave-based fix structure
- Add verification steps to fix plans
- Include rollback strategy
- Add prevention measures

**Success Criteria:**
- ✅ Fix plans compatible with `reis execute-plan`
- ✅ Wave structure correct
- ✅ Clear tasks and acceptance criteria
- ✅ Verification steps included
- ✅ Prevention measures documented

---

### Phase 4: Testing & Documentation (1 hour)

**Goal:** Comprehensive testing, documentation, and integration

#### Wave 4.1: Debugger Testing (30 min)
**Size:** Medium  
**Dependencies:** Phase 3

**Tasks:**
- Create `test/commands/debug.test.js`
- Test debug command with various inputs
- Test issue classification
- Test root cause analysis
- Test solution generation
- Test pattern matching
- Test fix plan generation
- Create integration test scenarios

**Success Criteria:**
- ✅ All debugger tests passing
- ✅ Tested with 5+ scenarios
- ✅ Edge cases handled
- ✅ Integration tests pass
- ✅ No regressions in existing tests

#### Wave 4.2: Documentation & Completion (30 min)
**Size:** Small  
**Dependencies:** Wave 4.1

**Tasks:**
- Create `docs/DEBUGGING.md` user guide
- Update main README.md with debugger
- Add debugger to workflow examples
- Document all command options
- Add troubleshooting section
- Update CHANGELOG.md with debugger entry
- Create example debug sessions

**Success Criteria:**
- ✅ DEBUGGING.md comprehensive
- ✅ README includes debugger
- ✅ Workflow examples updated
- ✅ Help text complete
- ✅ CHANGELOG entry added
- ✅ Examples demonstrate usage

---

## Wave Dependencies

```
Wave 1.1 (Spec)
    ↓
Wave 1.2 (Templates)
    ↓
Wave 2.1 (Command)
    ↓
Wave 2.2 (Classifier)
    ↓
Wave 2.3 (Analyzer)
    ↓  ↘
Wave 3.1  Wave 3.2 (Solutions & Patterns)
    ↓  ↙
Wave 3.3 (Fix Plans)
    ↓
Wave 4.1 (Testing)
    ↓
Wave 4.2 (Documentation)
```

**Parallel Opportunities:**
- Waves 3.1 & 3.2 can run simultaneously
- Other waves are sequential

---

## Complete REIS Autonomous Cycle

### Integration with Verifier

```bash
# Full autonomous cycle with debugger

# Phase 1
reis plan 1                  # planner creates plan
reis execute-plan phase1.md  # executor implements
reis verify 1                # verifier checks
# ❌ FAILED: 3 tests, 1 criterion

# Debug (automatic deep analysis)
reis debug 1                 # debugger analyzes
# Output:
# - Root cause: Session middleware order
# - Solution: Move session.init() before auth
# - Fix plan: .planning/debug/phase-1/FIX_PLAN.md

# Fix (execute targeted fix)
reis execute-plan .planning/debug/phase-1/FIX_PLAN.md

# Verify fix
reis verify 1
# ✅ PASSED

# Continue to Phase 2
reis plan 2
# ... repeat cycle
```

---

## Iteration Strategy

### For Building Debugger

Use REIS itself (dogfooding):

```bash
# Phase 1: Design
reis execute-plan .planning/debugger-project/phases/1-design/1-1-spec.PLAN.md
reis execute-plan .planning/debugger-project/phases/1-design/1-2-templates.PLAN.md
# Manual verify (verifier exists, debugger doesn't yet)

# Phase 2: Core
reis execute-plan .planning/debugger-project/phases/2-core/2-1-command.PLAN.md
reis execute-plan .planning/debugger-project/phases/2-core/2-2-classifier.PLAN.md
reis execute-plan .planning/debugger-project/phases/2-core/2-3-analyzer.PLAN.md
reis verify debugger-phase-2
# If fails: manual debug (debugger not complete yet)

# Phase 3: Advanced
reis execute-plan .planning/debugger-project/phases/3-advanced/3-1-solutions.PLAN.md
reis execute-plan .planning/debugger-project/phases/3-advanced/3-2-patterns.PLAN.md
reis execute-plan .planning/debugger-project/phases/3-advanced/3-3-fix-plans.PLAN.md
reis verify debugger-phase-3
# Can use basic debugger now!
# If fails: reis debug debugger-phase-3

# Phase 4: Finish
reis execute-plan .planning/debugger-project/phases/4-finish/4-1-testing.PLAN.md
reis execute-plan .planning/debugger-project/phases/4-finish/4-2-docs.PLAN.md
reis verify debugger-phase-4
reis debug debugger-phase-4  # If needed - use debugger on itself!
```

---

## Success Metrics

### Phase 1 Success
- ✅ Specification complete (reis_debugger.md)
- ✅ Templates created (DEBUG_REPORT.md, FIX_PLAN.md)
- ✅ Design approved

### Phase 2 Success
- ✅ debug command functional
- ✅ Issue classification working
- ✅ Root cause analysis accurate
- ✅ Reports generated

### Phase 3 Success
- ✅ Multiple solutions provided
- ✅ Pattern recognition working
- ✅ Fix plans generated correctly

### Phase 4 Success
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Debugger debugs itself (ultimate dogfooding!)
- ✅ Ready for v2.0.0-beta.1

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Analysis too complex | Slow debugging | Start simple, iterate |
| Incorrect root causes | Wrong fixes | Multiple solutions, confidence scores |
| Takes longer than 5 hours | Delays beta.1 | Keep scope tight, defer nice-to-haves |
| Pattern matching inaccurate | Bad suggestions | Human review loop, gradual learning |
| Integration issues | Workflow breaks | Thorough testing, backward compat |

---

## Deliverables Summary

### Files Created/Modified
- ✅ `subagents/reis_debugger.md` (new, ~600 lines)
- ✅ `lib/commands/debug.js` (new, ~250 lines)
- ✅ `lib/utils/debug-analyzer.js` (new, ~300 lines)
- ✅ `lib/utils/issue-classifier.js` (new, ~200 lines)
- ✅ `lib/utils/pattern-matcher.js` (new, ~250 lines)
- ✅ `templates/DEBUG_REPORT.md` (new, ~150 lines)
- ✅ `templates/FIX_PLAN.md` (new, ~100 lines)
- ✅ `docs/DEBUGGING.md` (new, ~400 lines)
- ✅ `test/commands/debug.test.js` (new, ~300 lines)
- ✅ `.planning/debug/` directory structure (new)
- ✅ README.md, CHANGELOG.md (updated)

### Lines of Code
- Subagent spec: ~600 lines
- Commands: ~250 lines
- Utilities: ~750 lines (analyzer, classifier, matcher)
- Templates: ~250 lines
- Tests: ~300 lines
- Documentation: ~400 lines
- **Total: ~2,550 lines**

---

## Timeline Overview

```
Phase 1: Design (1 hour)
  Wave 1.1: Spec (30 min)
  Wave 1.2: Templates (30 min)

Phase 2: Core (1.5 hours)
  Wave 2.1: Command (30 min)
  Wave 2.2: Classifier (30 min)
  Wave 2.3: Analyzer (30 min)

Phase 3: Advanced (1 hour)
  Wave 3.1: Solutions (30 min)
  Wave 3.2: Patterns (30 min)
  Wave 3.3: Fix Plans (30 min)

Phase 4: Finish (1 hour)
  Wave 4.1: Testing (30 min)
  Wave 4.2: Docs (30 min)

Total: 4.5 hours
Buffer: 0.5 hours
Target: 5 hours ✅
```

---

## Dependencies

### Build Order:
1. **reis_verifier** must be complete first (provides input)
2. **reis_debugger** uses verifier output
3. Both included in v2.0.0-beta.1

### Project Dependencies:
```
verifier (5.5 hours)
    ↓
debugger (4.5 hours)
    ↓
Total: 10 hours for complete autonomous system
```

---

## Next Steps

1. ✅ Review this roadmap
2. → Generate detailed PLAN.md for each phase
3. → **Get user confirmation before execution**
4. → Execute Phase 1 using reis_executor
5. → Verify and debug each phase
6. → Include both verifier + debugger in v2.0.0-beta.1

---

**Roadmap Status:** ✅ Complete  
**Next Step:** Generate executable PLAN.md files using reis_planner  
**Awaiting:** User confirmation before execution
