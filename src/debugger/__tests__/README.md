# Debugger Test Suite

Comprehensive test suite for REIS v2.0 debugger functionality.

## Structure

```
__tests__/
├── unit/                          # Unit tests for individual modules
│   ├── issue-classifier.test.ts   # IssueClassifier tests (all 7 types)
│   ├── debug-analyzer.test.ts     # DebugAnalyzer tests
│   ├── solution-designer.test.ts  # SolutionDesigner tests
│   ├── pattern-matcher.test.ts    # PatternMatcher tests (FR2.1)
│   └── fix-plan-generator.test.ts # FixPlanGenerator tests
├── integration/                   # Integration tests
│   └── debug-command.test.ts      # End-to-end debug command tests
├── fixtures/                      # Test data and utilities
│   ├── test-issues.ts            # Issue fixtures for all 7 types
│   ├── mock-fs.ts                # Mock filesystem utilities
│   └── mock-git.ts               # Mock git utilities
├── jest.config.js                # Jest configuration
├── setup.ts                      # Test setup and global config
└── README.md                     # This file
```

## Running Tests

### All tests
```bash
npm test -- src/debugger/__tests__
```

### Unit tests only
```bash
npm test -- src/debugger/__tests__/unit
```

### Integration tests only
```bash
npm test -- src/debugger/__tests__/integration
```

### Specific test file
```bash
npm test -- src/debugger/__tests__/unit/issue-classifier.test.ts
```

### With coverage
```bash
npm test -- --coverage src/debugger/__tests__
```

### Watch mode
```bash
npm test -- --watch src/debugger/__tests__
```

## Test Coverage

### Unit Tests

#### IssueClassifier (issue-classifier.test.ts)
- ✅ All 7 issue types classification
- ✅ Confidence scoring
- ✅ FR2.1 incomplete implementation detection
- ✅ Edge cases and error handling

**7 Issue Types:**
1. Syntax Errors - TypeError, ReferenceError, etc.
2. Logic Errors - Inverted conditions, wrong calculations
3. Integration Issues - API mismatches, cross-component issues
4. Environment Issues - Missing config, env-specific failures
5. Performance Issues - N+1 queries, slow operations
6. Dependency Conflicts - Version mismatches, peer dependencies
7. Incomplete Implementations - Executor skip, plan ambiguity, dependency blockers

#### DebugAnalyzer (debug-analyzer.test.ts)
- ✅ Root cause analysis for all issue types
- ✅ Solution recommendations
- ✅ Context enrichment
- ✅ Edge cases

#### SolutionDesigner (solution-designer.test.ts)
- ✅ Solution design for all issue types
- ✅ Implementation step generation
- ✅ Effort estimation
- ✅ Manual intervention detection
- ✅ Prevention strategies

#### PatternMatcher (pattern-matcher.test.ts)
- ✅ Pattern matching with confidence scoring
- ✅ FR2.1 incomplete implementation patterns
  - Executor-skip (70% frequency)
  - Plan-ambiguity (20% frequency)
  - Dependency-blocker (10% frequency)
- ✅ Pattern learning and persistence
- ✅ Pattern statistics

#### FixPlanGenerator (fix-plan-generator.test.ts)
- ✅ PLAN.md format generation
- ✅ Task XML structure
- ✅ Task type assignment
- ✅ Manual intervention checkpoints
- ✅ Verification steps

### Integration Tests

#### Debug Command (debug-command.test.ts)
- ✅ End-to-end flow for all 7 issue types
- ✅ Multi-module coordination
- ✅ Pattern matching integration
- ✅ FR2.1 incomplete implementation handling
- ✅ Error handling and edge cases

## Test Fixtures

### test-issues.ts
Provides test data for all 7 issue types with expected outcomes:
- `testIssues.syntaxError`
- `testIssues.logicError`
- `testIssues.integrationIssue`
- `testIssues.environmentIssue`
- `testIssues.performanceIssue`
- `testIssues.dependencyConflict`
- `testIssues.incompleteImplementation`
- `testIssues.incompleteImplementationPlanAmbiguity`
- `testIssues.incompleteImplementationDependencyBlocker`

### mock-fs.ts
Mock filesystem for testing file operations without touching real disk.

### mock-git.ts
Mock git repository for testing git integration without real commits.

## Coverage Goals

- **Branches**: 70%+
- **Functions**: 75%+
- **Lines**: 75%+
- **Statements**: 75%+

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { YourModule } from '../../your-module.js';

describe('YourModule', () => {
  let module: YourModule;

  beforeEach(() => {
    module = new YourModule();
  });

  describe('Feature Name', () => {
    it('should do something', () => {
      const result = module.doSomething();
      expect(result).toBeDefined();
    });
  });
});
```

### Integration Test Template
```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Module1 } from '../../module1.js';
import { Module2 } from '../../module2.js';

describe('Integration Test', () => {
  let module1: Module1;
  let module2: Module2;

  beforeEach(() => {
    module1 = new Module1();
    module2 = new Module2();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should integrate modules correctly', () => {
    const result1 = module1.process();
    const result2 = module2.handle(result1);
    expect(result2).toBeDefined();
  });
});
```

## FR2.1 Incomplete Implementation Testing

Special focus on testing incomplete implementation detection:

### Three Causes
1. **Executor-skip**: Tasks skipped during execution (70% of cases)
   - Indicators: TODO comments, stub implementations, 501 responses
   
2. **Plan-ambiguity**: Unclear plan requirements (20% of cases)
   - Indicators: Vague specifications, missing details
   
3. **Dependency-blocker**: External dependencies blocking completion (10% of cases)
   - Indicators: Missing API keys, blocked checkpoints

### Testing Approach
- Unit tests verify detection of each cause
- Integration tests verify end-to-end handling
- Pattern matcher tests verify learning and matching

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:
- Pre-commit: Run affected tests
- PR: Full test suite with coverage report
- Main branch: Full suite + coverage upload

## Debugging Tests

### Run single test
```bash
npm test -- -t "should classify TypeError as syntax-error"
```

### Debug with Node inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand src/debugger/__tests__/unit/issue-classifier.test.ts
```

### View coverage report
```bash
npm test -- --coverage src/debugger/__tests__
open coverage/lcov-report/index.html
```

## Maintenance

- Add tests for new features immediately
- Update fixtures when issue types change
- Keep test coverage above thresholds
- Review and refactor tests during code reviews
