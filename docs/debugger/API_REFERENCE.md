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
