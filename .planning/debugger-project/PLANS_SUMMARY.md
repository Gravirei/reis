# REIS Debugger - Plans Summary

## Overview

Complete executable plans for building the reis_debugger subagent across 4 phases and 8 waves.

**Total Deliverable:** ~2,550 lines of code + comprehensive tests + documentation

**Timeline:** 4.5 hours + 0.5 buffer = 5 hours total

---

## Phase 1: Design & Specification (1 hour)

### Wave 1.1: Debugger Specification
**Plan:** `.planning/phases/phase-1-debugger-design/1-1-debugger-specification.PLAN.md`

**Objective:** Create the reis_debugger.md specification document defining the 6-step analysis protocol.

**Deliverables:**
- `subagents/reis_debugger.md` (~600 lines)
- Complete 6-step protocol specification
- Analysis types and techniques
- Integration points with reis_verifier and reis_executor
- Best practices and anti-patterns
- Complete worked example

**Dependencies:** None

**Time:** 30 minutes

---

### Wave 1.2: Debugger Templates
**Plan:** `.planning/phases/phase-1-debugger-design/1-2-debugger-templates.PLAN.md`

**Objective:** Create templates/DEBUG_REPORT.md and templates/FIX_PLAN.md output templates.

**Deliverables:**
- `templates/DEBUG_REPORT.md` (~250 lines)
  * Issue classification structure
  * 6-step analysis sections
  * Solution options format
  * Recommendation section
- `templates/FIX_PLAN.md` (~250 lines)
  * Executor-compatible format
  * Root cause context
  * Atomic tasks with verification
  * Rollback strategies

**Dependencies:** Wave 1.1

**Time:** 30 minutes

---

## Phase 2: Core Implementation (1.5 hours)

### Wave 2.1: Debug Command
**Plan:** `.planning/phases/phase-2-debugger-core/2-1-debug-command.PLAN.md`

**Objective:** Implement lib/commands/debug.js CLI interface for the debugger.

**Deliverables:**
- `lib/commands/debug.js` (~250 lines initially, ~850 final with Wave 3.3)
- Argument parsing (report, error, file, interactive modes)
- Analysis orchestration
- Interactive solution selection
- Report and fix plan generation stubs
- CLI registration in lib/cli.js
- Help documentation in lib/commands/help.js

**Dependencies:** Wave 1.1, 1.2

**Time:** 30 minutes

---

### Wave 2.2: Issue Classifier
**Plan:** `.planning/phases/phase-2-debugger-core/2-2-issue-classifier.PLAN.md`

**Objective:** Implement lib/utils/issue-classifier.js for step 1 of the 6-step protocol.

**Deliverables:**
- `lib/utils/issue-classifier.js` (~350 lines)
  * Type classification (test-failure, build-error, lint-issue, runtime-error, performance, integration, documentation)
  * Severity classification (blocker, critical, major, minor)
  * Scope classification (single-file, module, cross-cutting, systemic)
  * Fingerprint generation for tracking
  * Pattern-based matching with regex
- `test/utils/issue-classifier.test.js` (~150 lines)
  * 10+ test cases covering all dimensions

**Dependencies:** Wave 1.1 (can develop in parallel with 2.1)

**Time:** 30 minutes

---

### Wave 2.3: Debug Analyzer
**Plan:** `.planning/phases/phase-2-debugger-core/2-3-debug-analyzer.PLAN.md`

**Objective:** Implement lib/utils/debug-analyzer.js for steps 2-6 of the protocol.

**Deliverables:**
- `lib/utils/debug-analyzer.js` (~400 lines)
  * Step 2: Symptom Analysis (what, where, when, how)
  * Step 3: Root Cause Investigation (git history, dependencies, patterns)
  * Step 4: Impact Assessment (severity scoring, scope analysis)
  * Step 5: Solution Design (3-5 options per issue type)
  * Step 6: Solution Recommendation (scoring and reasoning)
  * Git integration for history and diffs
  * Dependency analysis with npm
  * Pattern matching hooks

**Dependencies:** Wave 1.1, 2.2 (can develop in parallel with 2.1 and 2.2)

**Time:** 30 minutes

---

## Phase 3: Advanced Features (1 hour)

### Wave 3.1: Solution Designer Enhancement
**Plan:** `.planning/phases/phase-3-debugger-advanced/3-1-solution-designer.PLAN.md`

**Objective:** Enhance solution design with context-aware analysis and trade-off scoring.

**Deliverables:**
- Enhanced `lib/utils/debug-analyzer.js` (+150 lines, total ~550)
  * Context-aware solution enhancement
  * Risk mitigation strategies
  * Comprehensive scoring system
  * Trade-off analysis and explanation
  * Enhanced recommendations with reasoning
  * Backward compatibility maintained

**Dependencies:** Wave 2.3

**Time:** 20 minutes

---

### Wave 3.2: Pattern Matcher
**Plan:** `.planning/phases/phase-3-debugger-advanced/3-2-pattern-matcher.PLAN.md`

**Objective:** Create lib/utils/pattern-matcher.js with knowledge base and learning.

**Deliverables:**
- `lib/utils/pattern-matcher.js` (~350 lines)
  * 8+ built-in patterns (missing-dependency, async-not-awaited, null-undefined-access, circular-dependency, version-conflict, test-setup-missing, eslint-config-issue, slow-test)
  * Fingerprint, symptom, and type-based matching
  * Knowledge base persistence (.planning/knowledge-base.json)
  * Learning from successful resolutions
  * Pattern statistics and success rates
- Integration into `lib/utils/debug-analyzer.js` (~50 lines added)
  * Pattern-based solutions prioritized
  * Match results in analysis output
- `test/utils/pattern-matcher.test.js` (~300 lines)
  * 12+ test cases

**Dependencies:** Wave 2.2 (can develop in parallel with 3.1 and 3.3)

**Time:** 20 minutes

---

### Wave 3.3: Fix Plan Generator
**Plan:** `.planning/phases/phase-3-debugger-advanced/3-3-fix-plan-generator.PLAN.md`

**Objective:** Implement comprehensive fix plan generation in lib/commands/debug.js.

**Deliverables:**
- Enhanced `lib/commands/debug.js` (+600 lines, total ~850)
  * Type-specific task generation (test-failure, build-error, lint-issue, runtime-error, integration, generic)
  * Atomic tasks with root cause context
  * Verification tasks with rollback strategies
  * Success criteria generation
  * Post-fix actions (documentation, knowledge base updates)
  * Executor-compatible PLAN.md format

**Dependencies:** Wave 2.1, 1.2 (can develop in parallel with 3.1 and 3.2)

**Time:** 20 minutes

---

## Phase 4: Testing & Documentation (1 hour)

### Wave 4.1: Test Suite
**Plan:** `.planning/phases/phase-4-debugger-testing/4-1-test-suite.PLAN.md`

**Objective:** Create comprehensive tests for all debugger components.

**Deliverables:**
- Expanded `test/utils/issue-classifier.test.js` (~200 lines total)
  * 15+ test cases covering type, severity, scope, fingerprint, confidence
  * Input handling and edge cases
- `test/utils/pattern-matcher.test.js` (~300 lines)
  * 12+ test cases for patterns, matching, learning
  * Knowledge base management tests
- `test/commands/debug.test.js` (~100 lines)
  * Integration tests for command workflow
  * Argument parsing and error handling

**Total:** ~300 lines of new tests, 30+ test cases

**Dependencies:** All of Phase 2 and 3

**Time:** 30 minutes

---

### Wave 4.2: Documentation
**Plan:** `.planning/phases/phase-4-debugger-testing/4-2-documentation.PLAN.md`

**Objective:** Create comprehensive documentation for users and maintainers.

**Deliverables:**
- `docs/DEBUGGING.md` (~500 lines)
  * Complete user guide
  * 6-step protocol explained
  * Pattern recognition guide
  * Integration with other subagents
  * Best practices and troubleshooting
  * Quick start and advanced usage
- Updated `README.md`
  * Debug command documentation
  * Subagent listing updated
  * Links to debugging guide
- Updated `CHANGELOG.md`
  * Complete 2.1.0 release notes
  * Feature descriptions
  * Technical details
- `docs/examples/debugging-workflow.md` (~400 lines)
  * 5 complete workflow examples
  * Real-world scenarios
  * Best practices from examples

**Total:** ~900 lines of documentation

**Dependencies:** All previous waves

**Time:** 30 minutes

---

## Summary Statistics

### Code Deliverables
- `subagents/reis_debugger.md`: ~600 lines
- `lib/commands/debug.js`: ~850 lines
- `lib/utils/issue-classifier.js`: ~350 lines
- `lib/utils/debug-analyzer.js`: ~600 lines
- `lib/utils/pattern-matcher.js`: ~350 lines
- `templates/DEBUG_REPORT.md`: ~250 lines
- `templates/FIX_PLAN.md`: ~250 lines

**Total Production Code:** ~3,250 lines

### Test Deliverables
- `test/utils/issue-classifier.test.js`: ~200 lines
- `test/utils/pattern-matcher.test.js`: ~300 lines
- `test/commands/debug.test.js`: ~100 lines

**Total Test Code:** ~600 lines

### Documentation Deliverables
- `docs/DEBUGGING.md`: ~500 lines
- `docs/examples/debugging-workflow.md`: ~400 lines
- `README.md`: +50 lines
- `CHANGELOG.md`: +100 lines

**Total Documentation:** ~1,050 lines

### Grand Total: ~4,900 lines

---

## Execution Order

### Wave Execution Strategy

**Phase 1 (Sequential):**
1. Wave 1.1 → Wave 1.2

**Phase 2 (Parallel opportunities):**
- Waves 2.1, 2.2, 2.3 can be developed in parallel after Phase 1

**Phase 3 (Parallel opportunities):**
- Wave 3.1 depends on Wave 2.3
- Wave 3.2 depends on Wave 2.2 (can run parallel with 3.1 and 3.3)
- Wave 3.3 depends on Wave 2.1 (can run parallel with 3.1 and 3.2)

**Phase 4 (Sequential):**
1. Wave 4.1 (requires all of Phase 2 and 3)
2. Wave 4.2 (requires all previous waves)

### Recommended Execution

**If executing sequentially:**
1. Phase 1: Waves 1.1 → 1.2
2. Phase 2: Waves 2.1 → 2.2 → 2.3
3. Phase 3: Waves 3.1 → 3.2 → 3.3
4. Phase 4: Waves 4.1 → 4.2

**If executing in parallel:**
- Phase 1: 1.1 → 1.2 (must be sequential)
- Phase 2: 2.1 || 2.2 || 2.3 (all parallel)
- Phase 3: (3.1 after 2.3) || (3.2 after 2.2) || (3.3 after 2.1)
- Phase 4: 4.1 → 4.2 (must be sequential, after all previous)

---

## Key Features

### 6-Step Analysis Protocol
1. **Issue Classification** - Type, severity, scope, fingerprint
2. **Symptom Analysis** - What, where, when, how
3. **Root Cause Investigation** - Why, changes, dependencies, patterns
4. **Impact Assessment** - Severity score, scope, urgency, risk
5. **Solution Design** - 3-5 options with pros/cons/effort/risk
6. **Fix Planning** - Executable PLAN.md for reis_executor

### Pattern Recognition
- 8+ built-in patterns for common issues
- Success rates from 75-98%
- Knowledge base learns from resolutions
- Automatic pattern matching in analysis

### Integration
- **Input:** VERIFICATION_REPORT.md from reis_verifier
- **Output:** DEBUG_REPORT.md (analysis) + FIX_PLAN.md (executable fix)
- **Workflow:** VERIFY → DEBUG → FIX → VERIFY

### Quality Targets
- ✅ 85%+ classification accuracy
- ✅ 90%+ pattern match success rate
- ✅ <2 minute analysis time
- ✅ 80%+ test coverage
- ✅ Self-dogfooding capability

---

## Files Created

### Phase 1 Plans
- `.planning/phases/phase-1-debugger-design/1-1-debugger-specification.PLAN.md`
- `.planning/phases/phase-1-debugger-design/1-2-debugger-templates.PLAN.md`

### Phase 2 Plans
- `.planning/phases/phase-2-debugger-core/2-1-debug-command.PLAN.md`
- `.planning/phases/phase-2-debugger-core/2-2-issue-classifier.PLAN.md`
- `.planning/phases/phase-2-debugger-core/2-3-debug-analyzer.PLAN.md`

### Phase 3 Plans
- `.planning/phases/phase-3-debugger-advanced/3-1-solution-designer.PLAN.md`
- `.planning/phases/phase-3-debugger-advanced/3-2-pattern-matcher.PLAN.md`
- `.planning/phases/phase-3-debugger-advanced/3-3-fix-plan-generator.PLAN.md`

### Phase 4 Plans
- `.planning/phases/phase-4-debugger-testing/4-1-test-suite.PLAN.md`
- `.planning/phases/phase-4-debugger-testing/4-2-documentation.PLAN.md`

**Total:** 8 comprehensive executable plans

---

## Next Steps

1. **Review Plans:** Ensure all plans are clear and executable
2. **Execute Phase 1:** Start with specification and templates
3. **Execute Phase 2-3:** Implement core and advanced features
4. **Execute Phase 4:** Add tests and documentation
5. **Verify:** Run full test suite and validate functionality
6. **Dogfood:** Use debugger to debug REIS itself
7. **Deploy:** Release as REIS v2.1.0

---

*All plans are executable by reis_executor with fresh context per plan (~2-3 tasks each).*
