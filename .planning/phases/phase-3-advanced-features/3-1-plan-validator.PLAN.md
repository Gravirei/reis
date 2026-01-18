# Plan: 3-1 - PLAN.md Validator

## Objective
Create plan-validator utility to validate PLAN.md structure, wave format, dependencies, and detect common issues.

## Context
- Phase 1 & 2 utilities provide parsing foundation (WaveExecutor.parsePlan)
- Need validation before execution to catch errors early
- Should validate structure, wave sizes, task formats, dependency chains
- Validation results should be actionable and specific
- Used by new `reis validate` command and optionally in execute-plan

## Dependencies
None - Can execute in Wave 1 (parallel with other utilities)

## Tasks

<task type="auto">
<name>Create plan-validator utility with structure validation</name>
<files>lib/utils/plan-validator.js</files>
<action>
Create plan-validator.js utility that validates PLAN.md files:

1. Module exports:
   - validatePlan(planPath, options) - main validation function
   - ValidationResult class - structured validation results
   - validators object - individual validation functions

2. ValidationResult class:
   ```javascript
   class ValidationResult {
     constructor() {
       this.valid = true;
       this.errors = [];
       this.warnings = [];
       this.suggestions = [];
     }
     
     addError(type, message, line) { ... }
     addWarning(type, message, line) { ... }
     addSuggestion(message) { ... }
     hasErrors() { return this.errors.length > 0; }
   }
   ```

3. Structure validation:
   - File exists and readable
   - Has required sections: ## Objective, ## Tasks
   - Has at least one task or wave
   - Task format validation (XML or markdown)
   - Wave format validation (## Wave N: Name)
   - Section ordering makes sense

4. Task format validation:
   - XML tasks: <task type="...">...</task>
   - Required elements: <name>, <action>, <verify>, <done>
   - Optional elements: <files>, <dependencies>
   - Valid task types: auto, checkpoint:human-verify, checkpoint:decision, checkpoint:human-action
   - Warn on missing <files> (makes execution harder)
   - Warn on vague <action> (too short, no specifics)

5. Wave format validation:
   - Wave numbering is sequential (1, 2, 3...)
   - Wave names are descriptive (not just "Wave 1")
   - Wave sizes if specified: small, medium, large
   - Tasks within waves are reasonable count
   - Warn if wave has too many tasks (>8 for small, >12 for medium, >20 for large)

6. Dependency validation:
   - Parse ## Dependencies section
   - Check for circular dependencies (basic check)
   - Warn if dependencies reference non-existent plans
   - Suggest parallel execution if no dependencies

7. Common issues detection:
   - Tasks with no verification method
   - Vague task descriptions ("implement feature X")
   - Missing file paths in <files>
   - Success criteria not measurable
   - Wave size mismatch with task count

8. Return structured ValidationResult with:
   - errors: blocking issues that prevent execution
   - warnings: issues that should be fixed but not blocking
   - suggestions: improvements for better execution

WHY avoid certain approaches:
- Don't fail on warnings (allow flexibility in plan formats)
- Don't enforce strict XML schema (be lenient with format variations)
- Don't validate file existence (files may not exist yet)
- Don't make validation too slow (should complete in <100ms for typical plans)
</action>
<verify>
# Test validator loads
node -e "const v = require('./lib/utils/plan-validator'); console.log(v.validatePlan ? 'OK' : 'FAIL')"

# Test with sample plan
node -e "const v = require('./lib/utils/plan-validator'); const r = v.validatePlan('.planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md'); console.log(r.valid ? 'VALID' : 'INVALID', r.errors.length, 'errors', r.warnings.length, 'warnings')"
</verify>
<done>
- plan-validator.js exports validatePlan function
- ValidationResult class provides structured results
- Structure validation catches malformed plans
- Task format validation catches XML errors
- Wave format validation catches numbering issues
- Dependency validation catches circular refs
- Returns actionable errors, warnings, suggestions
- Performance <100ms for typical plans
</done>
</task>

<task type="auto">
<name>Create comprehensive tests for plan-validator</name>
<files>test/utils/plan-validator.test.js</files>
<action>
Create test suite for plan-validator:

1. Setup test fixtures:
   - Create temp directory for test plans
   - Sample valid plans (XML tasks, markdown waves, mixed)
   - Sample invalid plans (various error types)
   - Edge case plans (empty, minimal, huge)

2. Test ValidationResult class:
   - Test error/warning/suggestion collection
   - Test hasErrors() logic
   - Test result serialization

3. Test structure validation:
   - Valid plan passes all checks
   - Missing required sections → errors
   - Malformed sections → errors
   - No tasks → error
   - Invalid section order → warning

4. Test task format validation:
   - Valid XML task passes
   - Missing <name> → error
   - Missing <action> → error
   - Missing <verify> → warning
   - Missing <done> → warning
   - Invalid task type → error
   - Missing <files> → warning (should specify paths)

5. Test wave format validation:
   - Sequential numbering (1,2,3) passes
   - Non-sequential (1,3,5) → warning
   - Wave size validation (small/medium/large)
   - Too many tasks for wave size → warning
   - Missing wave name → warning

6. Test dependency validation:
   - No dependencies → pass
   - Valid dependencies → pass
   - Circular dependencies → error
   - Invalid dependency format → warning

7. Test common issues detection:
   - Vague task name ("implement feature") → warning
   - Missing file paths → warning
   - No verification method → warning
   - Non-measurable success criteria → suggestion

8. Test edge cases:
   - Empty file → error
   - Very large plan (50+ tasks) → pass with suggestions
   - Mixed task formats → pass
   - Unicode in task names → pass
   - Windows line endings → pass

9. Test performance:
   - Validation completes <100ms for typical plan
   - Large plans (20+ tasks) complete <500ms

Use mocha/assert pattern.
Clean up temp files after tests.
Test both success and failure paths.
</action>
<verify>
npm test -- test/utils/plan-validator.test.js
</verify>
<done>
- All tests pass (30+ test cases)
- ValidationResult class fully tested
- Structure validation fully tested
- Task format validation fully tested
- Wave format validation fully tested
- Dependency validation fully tested
- Edge cases covered
- Performance benchmarks met
- Tests clean up completely
</done>
</task>

<task type="auto">
<name>Integrate validator with execute-plan command</name>
<files>lib/commands/execute-plan.js</files>
<action>
Add optional validation to execute-plan command:

1. Import plan-validator:
   ```javascript
   const { validatePlan } = require('../utils/plan-validator');
   ```

2. Add validation before execution (when --wave flag used):
   - Run validatePlan(planPath) before parsing
   - Display validation results if errors or warnings
   - Block execution if hasErrors()
   - Show warnings but allow continuation
   - Add --skip-validation flag to bypass (for advanced users)

3. Display validation results:
   ```
   📋 Validating plan...
   
   ✓ Structure valid
   ✓ 3 waves, 8 tasks
   ⚠ Wave 2 has 6 tasks (recommended max for small: 4)
   ⚠ Task "Setup authentication" is vague, consider more specific name
   
   2 warnings found. Continue? (Y/n)
   ```

4. Error display format:
   ```
   ❌ Plan validation failed:
   
   Errors:
   - Line 45: Missing <name> element in task
   - Line 67: Invalid task type "manual" (use checkpoint:human-action)
   
   Warnings:
   - Wave 1 has no size specified, using default (medium)
   
   Fix these errors before executing.
   ```

5. Add validation stats to execution summary:
   - Show validation passed in dry-run mode
   - Include validation time in metrics

WHY:
- Catch errors before execution starts (save time)
- Educate users on plan format (improve plan quality)
- Allow bypass for advanced users (--skip-validation)
- Don't make validation mandatory yet (breaking change)
</action>
<verify>
# Test validation integration
node bin/reis.js execute-plan test/fixtures/invalid.PLAN.md --wave 2>&1 | grep -i "validation failed"

# Test skip validation
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --skip-validation --dry-run
</verify>
<done>
- Validator integrated into execute-plan
- Validation runs before execution
- Errors block execution
- Warnings displayed but don't block
- --skip-validation flag works
- Validation results well-formatted
- Adds <50ms to execution time
</done>
</task>

## Success Criteria
- ✅ plan-validator.js validates structure, tasks, waves, dependencies
- ✅ ValidationResult provides actionable feedback
- ✅ Common issues detected and reported
- ✅ 30+ tests pass with comprehensive coverage
- ✅ Integration with execute-plan command works
- ✅ Performance target met (<100ms typical validation)
- ✅ Errors block execution, warnings inform user
- ✅ Validation improves plan quality over time

## Verification
```bash
# Run validator tests
npm test -- test/utils/plan-validator.test.js

# Test validation with real plans
node -e "const v = require('./lib/utils/plan-validator'); const r = v.validatePlan('.planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md'); console.log(JSON.stringify(r, null, 2))"

# Test integrated validation
node bin/reis.js execute-plan test/fixtures/sample.PLAN.md --wave --dry-run

# Run all tests
npm test
```
