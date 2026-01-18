# Plan: 4-2 - Complete Documentation

## Objective
Create comprehensive documentation for the debugger including FR2.1 incomplete implementation handling guide.

## Context
Documentation must cover:
- How to use reis debug
- Understanding debug reports
- **FR2.1:** How incomplete implementations are handled differently than bugs
- Interpreting root cause likelihood (70%/20%/10%)
- Executing fix plans
- Best practices

## Dependencies
- All previous plans (debugger fully implemented)

## Tasks

<task type="auto">
<name>Create user guide with FR2.1 incomplete implementation section</name>
<files>docs/debugger/USER_GUIDE.md</files>
<action>
Create comprehensive user guide:

```markdown
# REIS Debugger - User Guide

## Overview

The REIS Debugger analyzes verification failures and generates executable fix plans. It uses a systematic 6-step protocol to diagnose issues and recommend solutions.

**Key Feature (FR2.1):** The debugger distinguishes between **bugs** (broken code) and **incomplete implementations** (missing features) and handles them differently.

## Quick Start

```bash
# After verification fails
reis verify my-plan.PLAN.md
# ❌ VERIFICATION FAILED

# Run debugger
reis debug

# Review outputs
cat .planning/debug/DEBUG_REPORT.md
cat .planning/debug/FIX_PLAN.md

# Execute fix
reis execute-plan .planning/debug/FIX_PLAN.md
```

## Issue Types

The debugger recognizes 7 types of issues:

### 1. Test Failures
- **What it is:** Tests fail or error
- **Examples:** Assertion failures, test timeouts
- **Typical cause:** Logic errors in implementation

### 2. Quality Issues
- **What it is:** Code quality standards violated
- **Examples:** ESLint errors, TypeScript errors
- **Typical cause:** Syntax errors, linting violations

### 3. Documentation Problems
- **What it is:** Missing or outdated documentation
- **Examples:** Incomplete README, missing API docs
- **Typical cause:** Documentation not updated with code

### 4. Regressions
- **What it is:** Previously working feature now broken
- **Examples:** Feature broke after recent commit
- **Typical cause:** Breaking change introduced

### 5. Integration Issues
- **What it is:** Components don't work together
- **Examples:** API mismatch, incompatible interfaces
- **Typical cause:** Interface contract violations

### 6. Dependency Issues
- **What it is:** Package or dependency problems
- **Examples:** npm install fails, version conflicts
- **Typical cause:** Missing packages, version mismatches

### 7. Incomplete Implementations (FR2.1)
- **What it is:** Features simply not implemented (NOT broken)
- **Examples:** Task 2/3 complete, file NOT FOUND
- **Typical cause:** Executor skipped tasks (70%), plan ambiguity (20%), dependency blockers (10%)
- **Special handling:** Targeted re-execution, not full re-implementation

## FR2.1: Incomplete Implementations Explained

### What Makes It Different?

**Bugs vs Missing Features:**

| Aspect | Bug | Incomplete Implementation |
|--------|-----|---------------------------|
| What's wrong | Something is broken | Nothing broken, just missing |
| Evidence | Errors, test failures | File NOT FOUND, task incomplete |
| Tests | Fail | Pass (if tests exist) |
| Fix approach | Debug and fix broken code | Implement missing features |
| Re-execution | Fix specific bug | Targeted re-execution only |

### Why Features Get Skipped

The debugger analyzes **WHY** features were skipped using likelihood estimation:

**1. Executor Skip (70% of cases)**
- Task complexity too high
- Context refresh happened mid-execution
- Executor encountered blocker and moved on
- Task misinterpreted as optional

**Evidence:**
- No git commits for missing feature
- Adjacent tasks completed successfully
- High task complexity

**2. Plan Ambiguity (20% of cases)**
- Task description unclear or vague
- No specific file paths provided
- Acceptance criteria not measurable

**Evidence:**
- Task description < 3 sentences
- No file paths in <files> tag
- Vague <done> criteria ("works properly")

**3. Dependency Blocker (10% of cases)**
- Required package unavailable
- External API/service unreachable
- Environment configuration missing

**Evidence:**
- MODULE_NOT_FOUND in logs
- Network timeouts
- Environment variables undefined

### Targeted Re-execution

When features are missing, the debugger generates a **targeted fix plan** that:

✅ **ONLY** implements missing features
✅ **DOES NOT** touch completed features
✅ Minimizes risk of regression
✅ Avoids redundant re-implementation

**Example:**

```markdown
Original Plan: 3 tasks
- Task 1: Login ✅ (completed)
- Task 2: Password Reset ❌ (missing)
- Task 3: Session Management ✅ (completed)

Fix Plan:
- Implement ONLY Task 2
- DO NOT modify Tasks 1, 3
- Verify integration with completed features
```

## Understanding Debug Reports

### Report Structure

```markdown
# Debug Report

## Issue Classification
- Type: [7 issue types]
- Severity: [critical/major/minor]
- Scope: [isolated/localized/widespread]

## Incompleteness Analysis (for incomplete implementations)
- Completeness: 66% (2/3 tasks)
- Missing: Task 2
- Completed: Task 1, Task 3
- Root Cause: executor-skip (75% confidence)

## Root Cause Investigation
- Primary cause: [identified cause]
- Evidence: [specific evidence]
- Confidence: [percentage]

## Solution Recommendation
- Recommended: Targeted Re-execution
- Time estimate: 30 minutes
- Risk: LOW
```

### Reading Likelihood Estimates

For incomplete implementations, the report shows likelihood percentages:

```markdown
Root Cause Likelihood:
- Executor Skip: 75%
- Plan Ambiguity: 15%
- Dependency Blocker: 10%
```

**Interpretation:**
- 75% confidence the executor skipped the task
- Evidence supports this conclusion
- Prevention focuses on task breakdown

## Fix Plans

### Fix Plan Format

Fix plans use standard PLAN.md format and are directly executable:

```bash
reis execute-plan .planning/debug/FIX_PLAN.md
```

### For Incomplete Implementations

Fix plans include:

1. **Context:** What's missing, what's completed
2. **Constraints:** DO NOT modify completed features
3. **Targeted Tasks:** Only missing features
4. **Verification:** Check missing items now exist
5. **Success Criteria:** 100% completion

**Example:**

```markdown
# Fix Plan: Implement Missing Feature: Password Reset

## Context
- Completeness: 66% (2/3 tasks)
- Missing: Task 2 (Password Reset)
- DO NOT modify Tasks 1, 3 (already complete)

## Wave Fix-1: Implement Password Reset
<task type="auto">
<name>Implement Password Reset</name>
...
</task>

## Success Criteria
- ✅ Password reset implemented
- ✅ No impact on completed features
- ✅ Completeness: 100% (3/3 tasks)
```

## Best Practices

### When to Use Debugger

✅ **Use debugger when:**
- Verification fails
- Tests fail unexpectedly
- Quality checks fail
- Features missing after execution

❌ **Don't use debugger when:**
- Planning stage (use planner)
- Design decisions needed
- Exploratory analysis needed

### Interpreting Results

**High confidence (>80%):**
- Trust the recommendation
- Execute fix plan as-is

**Medium confidence (50-80%):**
- Review debug report carefully
- Consider alternative solutions
- May need human judgment

**Low confidence (<50%):**
- Multiple possible causes
- Requires deeper investigation
- Consider manual analysis

### For Incomplete Implementations

**Prevention Strategies:**

1. **Task Decomposition**
   - Break tasks into <45 min units
   - One clear deliverable per task
   - Explicit file paths in <files>

2. **Clear Acceptance Criteria**
   - Measurable <done> criteria
   - File existence checks
   - Specific verification commands

3. **Task-Level Checkpoints**
   - Verify each task before next
   - Add checkpoint:human-verify for critical features
   - Use file existence checks

4. **Complexity Assessment**
   - Assess complexity before wave assignment
   - High complexity = break into sub-tasks
   - Consider dependencies

## Troubleshooting

### Debugger Fails to Run

```bash
# Check DEBUG_INPUT.md exists
test -f .planning/DEBUG_INPUT.md || echo "Run 'reis verify' first"

# Check for syntax errors
node -c lib/commands/debug.js
```

### Incomplete Implementation Not Detected

If verifier shows missing features but debugger doesn't detect:

1. Check DEBUG_INPUT.md format
2. Ensure "Tasks: X/Y complete" line present
3. Verify "NOT FOUND" markers exist

### Fix Plan Not Executable

If `reis execute-plan` fails:

1. Check FIX_PLAN.md format
2. Verify <task> tags properly closed
3. Ensure file paths are correct

## Advanced Usage

### Interactive Mode

```bash
reis debug --interactive
```

Allows conversational debugging with the agent.

### Custom Focus

```bash
reis debug --focus "authentication system"
```

Focuses analysis on specific area.

### Custom Input

```bash
reis debug --input custom-debug-input.md
```

Uses custom debug input file.

## Examples

### Example 1: Incomplete Implementation

**Scenario:** Task 2/3 complete, password reset missing

```bash
$ reis verify auth-plan.PLAN.md
❌ VERIFICATION FAILED
  - Tasks: 2/3 complete (66%)
  - Missing: Task 2 (Password Reset)

$ reis debug
🔍 REIS Debugger
Issue type detected: incomplete-implementation
⚠️  Missing features detected (not a bug)

✅ Analysis complete!
📄 Debug Report: .planning/debug/DEBUG_REPORT.md
🔧 Fix Plan: .planning/debug/FIX_PLAN.md

$ cat .planning/debug/DEBUG_REPORT.md
# Debug Report: Incomplete Implementation

## Root Cause
- Likely: Executor Skip (70% confidence)
- Evidence: No git commits for password-reset
- Task complexity: moderate

## Solution: Targeted Re-execution
- Implement ONLY Task 2
- Time: 30 minutes
- Risk: LOW

$ reis execute-plan .planning/debug/FIX_PLAN.md
# Implements missing feature only

$ reis verify auth-plan.PLAN.md
✅ VERIFICATION PASSED
  - Tasks: 3/3 complete (100%)
```

### Example 2: Test Failure

**Scenario:** Tests fail after implementation

```bash
$ reis verify feature-plan.PLAN.md
❌ VERIFICATION FAILED
  - Tests: 2 failed, 5 passed

$ reis debug
Issue type detected: test-failure

✅ Analysis complete!

# Review report, execute fix plan
$ reis execute-plan .planning/debug/FIX_PLAN.md

$ reis verify feature-plan.PLAN.md
✅ VERIFICATION PASSED
```

## Summary

The REIS Debugger provides systematic analysis of verification failures with special handling for incomplete implementations. Key points:

1. **7 issue types** recognized (including incomplete implementations)
2. **6-step analysis protocol** for thorough diagnosis
3. **FR2.1: Incomplete implementation handling** with targeted re-execution
4. **Likelihood estimation** for root cause (70%/20%/10%)
5. **Executable fix plans** in PLAN.md format
6. **Prevention strategies** to improve future executions

**Remember:** Incomplete implementations are NOT bugs. They require targeted re-execution, not debugging.
```

**What to avoid:**
- Missing FR2.1 incomplete implementation section
- Not explaining likelihood percentages
- Vague examples
- No troubleshooting guide

**Why:**
- Users need to understand the distinction between bugs and missing features
- Likelihood interpretation helps users trust recommendations
- Examples demonstrate real usage
- Troubleshooting prevents frustration
</action>
<verify>
```bash
# Check file exists
test -f docs/debugger/USER_GUIDE.md && echo "✓ User guide created"

# Verify FR2.1 content
grep -c "FR2.1" docs/debugger/USER_GUIDE.md
# Should find 3+ occurrences

# Check for incomplete implementation section
grep -q "Incomplete Implementation" docs/debugger/USER_GUIDE.md && echo "✓ FR2.1 section included"

# Verify examples exist
grep -c "Example" docs/debugger/USER_GUIDE.md
# Should find 2+ examples
```
</verify>
<done>
- docs/debugger/USER_GUIDE.md created with comprehensive content
- FR2.1 incomplete implementation section included
- Explains bugs vs missing features distinction
- Documents likelihood estimation (70%/20%/10%)
- Targeted re-execution explained with examples
- Best practices for prevention
- Troubleshooting guide
- Real-world usage examples
</done>
</task>

<task type="auto">
<name>Create API reference documentation</name>
<files>docs/debugger/API_REFERENCE.md</files>
<action>
Create API reference for debugger modules:

```markdown
# REIS Debugger - API Reference

## Core Modules

### IssueClassifier

Classifies issues into 7 types including incomplete implementations.

```javascript
import { IssueClassifier } from './lib/utils/issue-classifier.js';

const classifier = new IssueClassifier();
const result = classifier.classify(debugInput);

// Returns:
{
  type: 'incomplete-implementation',
  severity: 'major',
  scope: 'localized',
  confidence: 0.95,
  evidence: [...],
  incompleteness: {
    completeness: 66,
    completed: 2,
    total: 3,
    missing: ['Task 2: Password Reset'],
    completedTasks: ['Task 1', 'Task 3']
  }
}
```

**Methods:**

- `classify(input: string)` - Classify issue from DEBUG_INPUT.md content
- `detectIncompleteness(input: string)` - FR2.1: Detect missing features
- `extractMissingTasks(input: string)` - Extract list of missing tasks
- `extractCompletedTasks(input: string)` - Extract list of completed tasks

### DebugAnalyzer

Performs 6-step analysis protocol with FR2.1 incomplete implementation support.

```javascript
import { DebugAnalyzer } from './lib/utils/debug-analyzer.js';

const analyzer = new DebugAnalyzer(debugInput, projectContext);
const analysis = await analyzer.analyze();

// Returns:
{
  classification: {...},
  symptoms: {...},
  rootCause: {
    likelyCause: 'executor-skip',
    confidence: 0.75,
    likelihood: {
      executorSkip: 0.75,
      planAmbiguity: 0.15,
      dependencyBlocker: 0.10
    },
    evidence: [...],
    contributingFactors: [...]
  },
  impact: {...},
  solutions: [...],
  recommendation: {...}
}
```

**Methods:**

- `analyze()` - Run complete 6-step analysis
- `classifyIssue()` - Step 1: Issue classification
- `analyzeSymptoms()` - Step 2: Symptom analysis
- `investigateRootCause()` - Step 3: Root cause (bugs)
- `analyzeIncompleteImplementation()` - Step 3: Root cause (FR2.1)
- `analyzeExecutorSkip(incompleteness)` - FR2.1: Analyze executor skip (70%)
- `analyzePlanAmbiguity(incompleteness)` - FR2.1: Analyze plan ambiguity (20%)
- `analyzeDependencyBlocker(incompleteness)` - FR2.1: Analyze dependency blocker (10%)
- `assessImpact()` - Step 4: Impact assessment
- `designSolutions()` - Step 5: Solution design (bugs)
- `designIncompleteImplementationSolutions()` - Step 5: Solutions (FR2.1)
- `selectRecommendedSolution()` - Step 6: Select best solution

### SolutionDesigner

Enhances solutions with scoring and optimization for incomplete implementations.

```javascript
import { SolutionDesigner } from './lib/utils/solution-designer.js';

const designer = new SolutionDesigner(analysis);
const enhanced = designer.enhanceSolutions(analysis.solutions);

// Returns enhanced solutions with scores and optimization
```

**Methods:**

- `enhanceSolutions(solutions)` - Add scoring and optimization
- `scoreSolution(solution)` - Score on multiple dimensions
- `analyzeTradeoffs(solution)` - Analyze trade-offs
- `optimizeSolution(solution)` - FR2.1: Optimize for incomplete implementations
- `generateTaskBreakdown(incompleteness)` - FR2.1: Break missing features into tasks
- `generatePreventionRecommendations()` - FR2.1: Cause-specific prevention

### PatternMatcher

Recognizes common patterns including incomplete implementation patterns.

```javascript
import { PatternMatcher } from './lib/utils/pattern-matcher.js';

const matcher = new PatternMatcher();
const matches = matcher.findMatches(analysis);
```

**Methods:**

- `findMatches(analysis)` - Find matching patterns
- `scoreMatch(pattern, analysis)` - Score pattern match
- `recordIncompletePattern(analysis, resolution)` - FR2.1: Record for learning
- `getPreventionStrategies(matches)` - Get prevention from patterns
- `getRecommendedSolutions(matches)` - Get solutions from patterns

### FixPlanGenerator

Generates executable FIX_PLAN.md files with FR2.1 targeted fix plans.

```javascript
import { FixPlanGenerator, generateFixPlan } from './lib/utils/fix-plan-generator.js';

const generator = new FixPlanGenerator(analysis);
const plan = generator.generate();

// Or use helper
const path = generateFixPlan(analysis, '.planning/debug/FIX_PLAN.md');
```

**Methods:**

- `generate()` - Generate complete FIX_PLAN.md
- `generateHeader()` - Plan header
- `generateObjective()` - Objective section
- `generateContext()` - Context with FR2.1 incompleteness details
- `generateWaves()` - Wave(s) with tasks
- `generateIncompleteImplementationWave()` - FR2.1: Targeted fix wave
- `generateIncompleteTask(task, number)` - FR2.1: Task for missing feature
- `generateSuccessCriteria()` - Success criteria with 100% target
- `generateVerification()` - Verification commands

## CLI Command

### reis debug

```bash
reis debug [options]
```

**Options:**

- `-i, --input <path>` - Path to DEBUG_INPUT.md (default: .planning/DEBUG_INPUT.md)
- `--interactive` - Run in interactive mode
- `--focus <area>` - Focus analysis on specific area

**Outputs:**

- `.planning/debug/DEBUG_REPORT.md` - Analysis report
- `.planning/debug/FIX_PLAN.md` - Executable fix plan

## Data Structures

### Classification Result

```typescript
{
  type: string,  // 7 types including 'incomplete-implementation'
  severity: 'critical' | 'major' | 'minor',
  scope: 'isolated' | 'localized' | 'widespread',
  confidence: number,  // 0-1
  evidence: string[],
  incompleteness?: {  // FR2.1: Only for incomplete implementations
    completeness: number,  // 0-100
    completed: number,
    total: number,
    missing: string[],
    completedTasks: string[],
    evidence: string[]
  }
}
```

### Root Cause (FR2.1)

```typescript
{
  likelyCause: 'executor-skip' | 'plan-ambiguity' | 'dependency-blocker',
  confidence: number,  // 0-1
  evidence: string[],
  contributingFactors: string[],
  likelihood: {
    executorSkip: number,  // ~0.70
    planAmbiguity: number,  // ~0.20
    dependencyBlocker: number  // ~0.10
  }
}
```

### Solution

```typescript
{
  name: string,
  description: string,
  approach: string,
  pros: string[],
  cons: string[],
  timeEstimate: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  complexity: 'simple' | 'moderate' | 'high',
  recommended: boolean,
  scope?: string[],  // FR2.1: For incomplete implementations
  score?: number,  // Added by SolutionDesigner
  tradeoffs?: object  // Added by SolutionDesigner
}
```

## Pattern Files

Pattern files stored in `patterns/debug/*.json`:

```json
{
  "id": "incomplete-executor-skip",
  "name": "Incomplete Implementation - Executor Skip",
  "type": "incomplete-implementation",
  "cause": "executor-skip",
  "signatures": [
    "no git commits for feature",
    "task complexity high",
    "adjacent tasks completed"
  ],
  "frequency": 0.70,
  "solutions": ["Targeted Re-execution"],
  "prevention": [
    "Break tasks into smaller sub-tasks",
    "Add task-level verification checkpoints"
  ]
}
```

## Extension Points

### Adding New Issue Types

1. Add pattern to IssueClassifier.patterns
2. Add analysis logic to DebugAnalyzer
3. Add solution generation to SolutionDesigner
4. Add pattern file to patterns/debug/
5. Update tests

### Custom Analysis Steps

Extend DebugAnalyzer:

```javascript
class CustomDebugAnalyzer extends DebugAnalyzer {
  async customAnalysis() {
    // Your analysis logic
  }
}
```

## FR2.1 Specific APIs

### Incomplete Implementation Detection

```javascript
const incompleteness = classifier.detectIncompleteness(input);
if (incompleteness) {
  console.log(`Completeness: ${incompleteness.completeness}%`);
  console.log(`Missing: ${incompleteness.missing.join(', ')}`);
}
```

### Root Cause Likelihood Analysis

```javascript
const rootCause = await analyzer.analyzeIncompleteImplementation();
console.log(`Executor Skip: ${(rootCause.likelihood.executorSkip * 100).toFixed(0)}%`);
console.log(`Plan Ambiguity: ${(rootCause.likelihood.planAmbiguity * 100).toFixed(0)}%`);
console.log(`Dependency Blocker: ${(rootCause.likelihood.dependencyBlocker * 100).toFixed(0)}%`);
```

### Targeted Fix Plan Generation

```javascript
if (analysis.classification.type === 'incomplete-implementation') {
  const generator = new FixPlanGenerator(analysis);
  const plan = generator.generate();
  
  // Plan includes DO NOT constraints
  // Only missing features targeted
  // 100% completion success criteria
}
```
```

**What to avoid:**
- Missing FR2.1-specific APIs
- No type definitions
- Missing examples
- No extension points

**Why:**
- Developers need clear API documentation
- FR2.1 features need explicit documentation
- Examples demonstrate usage
- Extension points enable customization
</action>
<verify>
```bash
# Check file exists
test -f docs/debugger/API_REFERENCE.md && echo "✓ API reference created"

# Verify FR2.1 API documentation
grep -c "FR2.1" docs/debugger/API_REFERENCE.md
# Should find 10+ occurrences

# Check for code examples
grep -c "```" docs/debugger/API_REFERENCE.md
# Should find 10+ code blocks
```
</verify>
<done>
- docs/debugger/API_REFERENCE.md created with complete API documentation
- FR2.1-specific APIs documented
- All core modules covered
- Data structures defined
- Pattern file format documented
- Extension points explained
- Code examples for all major features
</done>
</task>

## Success Criteria
- ✅ User guide comprehensive and accessible
- ✅ FR2.1 incomplete implementation handling well documented
- ✅ API reference complete with examples
- ✅ Troubleshooting guide included
- ✅ Real-world usage examples provided
- ✅ Best practices documented

## Verification
```bash
# Both docs exist
test -f docs/debugger/USER_GUIDE.md && echo "✓ User guide exists"
test -f docs/debugger/API_REFERENCE.md && echo "✓ API reference exists"

# Adequate FR2.1 coverage
grep -c "FR2.1" docs/debugger/*.md
# Should find 15+ occurrences total

# Check for examples
grep -c "Example" docs/debugger/USER_GUIDE.md
# Should find 2+ examples
```
