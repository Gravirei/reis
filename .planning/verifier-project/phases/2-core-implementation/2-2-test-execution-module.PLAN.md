# Plan: 2-2 - Implement Test Execution Module

## Objective
Add comprehensive test execution capabilities to reis_verifier specification, including test framework detection, execution, and result parsing.

## Context
The verify command (Wave 2.1) can now load context and generate prompts. Now we need to define how reis_verifier actually runs tests and interprets results. This goes in the subagent specification as detailed instructions that Claude will follow.

**Key Requirements:**
- Auto-detect test framework (Jest, Vitest, Node test runner, generic npm test)
- Execute tests and capture stdout/stderr
- Parse test results for pass/fail/pending counts
- Extract coverage information if available
- Handle missing tests gracefully (warn, don't fail)
- Support projects without test configurations

**Reference Files:**
- `subagents/reis_verifier.md` - Add test execution details here
- Common test frameworks: Jest, Vitest, Node --test, Mocha, Tape
- Test output formats vary by framework

## Dependencies
- Wave 2.1 (verify command) - Need command to invoke verifier

## Tasks

<task type="auto">
<name>Add test execution protocol to reis_verifier specification</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 2: Run Test Suite" section in the Seven-Step Verification Protocol with comprehensive test execution instructions.

**Location:** Find "Step 2: Run Test Suite" in the protocol section (should already exist from Wave 1.1).

**Replace/Expand with:**

```markdown
### Step 2: Run Test Suite

Execute the project's test suite and capture results for verification.

#### Test Framework Detection

**Priority order** (check package.json scripts):
1. `npm test` - Standard Node.js test command
2. `package.json` "test" script - Project-defined test command
3. Detect by dependencies:
   - `jest` → Use Jest
   - `vitest` → Use Vitest  
   - `mocha` → Use Mocha
   - Node 18+ → Try `node --test`

**Detection Steps:**
```bash
# Check if package.json exists
if [ -f package.json ]; then
  # Read test script
  TEST_SCRIPT=$(node -p "require('./package.json').scripts?.test || ''")
  
  if [ -n "$TEST_SCRIPT" ]; then
    echo "✅ Test script found: $TEST_SCRIPT"
  else
    echo "⚠️ No test script in package.json"
  fi
fi
```

#### Test Execution

**Run tests with output capture:**
```bash
# Run npm test and capture output
npm test 2>&1 | tee /tmp/test-output.txt

# Capture exit code
TEST_EXIT_CODE=$?
```

**Timeout:** Set 5-minute timeout to prevent hanging:
```bash
timeout 300 npm test 2>&1 | tee /tmp/test-output.txt
```

**Handle failures gracefully:**
- Exit code 0 → All tests passed ✅
- Exit code 1 → Tests failed ❌
- Exit code 127 → Test command not found ⚠️
- Timeout → Tests hung (mark as failure) ❌

#### Result Parsing

Parse test output to extract metrics. Format varies by framework:

**Jest/Vitest Format:**
```
Tests:       23 passed, 2 failed, 25 total
Snapshots:   0 total
Time:        3.142s
```

**Node Test Runner Format:**
```
✔ test 1 (1.234ms)
✔ test 2 (0.567ms)
✖ test 3 (0.891ms)
---
tests 23
pass 21
fail 2
```

**Generic Parser:**
```javascript
// Parse test results from output
function parseTestResults(output) {
  const results = {
    framework: 'unknown',
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
    duration: null,
    coverage: null,
  };
  
  // Jest/Vitest pattern
  const jestMatch = output.match(/Tests:\s+(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+total/);
  if (jestMatch) {
    results.framework = 'jest/vitest';
    results.passed = parseInt(jestMatch[1]);
    results.failed = parseInt(jestMatch[2]);
    results.total = parseInt(jestMatch[3]);
    return results;
  }
  
  // Node test runner pattern
  const nodeMatch = output.match(/tests\s+(\d+).*?pass\s+(\d+).*?fail\s+(\d+)/s);
  if (nodeMatch) {
    results.framework = 'node';
    results.total = parseInt(nodeMatch[1]);
    results.passed = parseInt(nodeMatch[2]);
    results.failed = parseInt(nodeMatch[3]);
    return results;
  }
  
  // Mocha pattern
  const mochaMatch = output.match(/(\d+)\s+passing.*?(\d+)\s+failing/);
  if (mochaMatch) {
    results.framework = 'mocha';
    results.passed = parseInt(mochaMatch[1]);
    results.failed = parseInt(mochaMatch[2]);
    results.total = results.passed + results.failed;
    return results;
  }
  
  // Generic fallback - count ✓ and ✗
  const passCount = (output.match(/✓|✔|PASS/g) || []).length;
  const failCount = (output.match(/✗|✖|FAIL/g) || []).length;
  if (passCount > 0 || failCount > 0) {
    results.framework = 'generic';
    results.passed = passCount;
    results.failed = failCount;
    results.total = passCount + failCount;
  }
  
  return results;
}
```

#### Coverage Extraction

**If coverage is available** (usually in output or coverage/ directory):

```bash
# Check for coverage output
if [ -d coverage ]; then
  # Jest/Vitest usually output coverage summary
  COVERAGE=$(grep -oP 'Statements\s+:\s+\K[\d.]+(?=%)' /tmp/test-output.txt | head -1)
  if [ -n "$COVERAGE" ]; then
    echo "Code coverage: $COVERAGE%"
  fi
fi
```

Extract coverage from common formats:
- Jest: "Statements: 85.7%"
- Vitest: Similar to Jest
- Istanbul/NYC: Coverage summary in terminal or JSON

#### Handling Missing Tests

**If no tests found:**
```javascript
if (results.total === 0 && exitCode !== 0) {
  // No tests configured
  return {
    status: 'warning',
    message: '⚠️ No tests found or configured',
    recommendation: 'Add tests to improve verification confidence',
    details: 'Test suite is empty or test command not configured in package.json',
  };
}
```

**This is a WARNING, not a FAILURE** - Projects can be functional without tests (though not recommended).

#### Test Result Object

Return structured test results:
```javascript
{
  "status": "passed" | "failed" | "warning" | "error",
  "framework": "jest" | "vitest" | "node" | "mocha" | "generic" | "unknown",
  "metrics": {
    "total": 25,
    "passed": 23,
    "failed": 2,
    "pending": 0,
    "skipped": 0
  },
  "duration": "3.142s",
  "coverage": "85.7%",
  "exitCode": 1,
  "output": "...", // Captured stdout/stderr
  "timestamp": "2024-01-18T15:30:00Z"
}
```

#### Error Handling

**Common errors and responses:**

| Error | Response |
|-------|----------|
| Test command not found | ⚠️ WARNING - No tests configured |
| Tests timeout | ❌ FAILURE - Tests hung, investigate |
| Tests crash | ❌ FAILURE - Test runner error |
| Parse failure | ⚠️ WARNING - Could not parse output, manual review needed |
| No package.json | ⚠️ WARNING - Not a Node project or no test config |

**Always include raw output** in verification report for debugging.

#### Best Practices

1. **Always capture full output** - Needed for debugging failed tests
2. **Set reasonable timeout** - 5 minutes max
3. **Don't fail on missing tests** - Warn instead
4. **Parse defensively** - Handle variations in test output format
5. **Extract failed test names** - Help developers identify issues quickly
6. **Include in report** - Full test results in verification report

#### Example Execution Flow

```bash
# 1. Detect test framework
echo "Detecting test framework..."
TEST_CMD=$(node -p "require('./package.json').scripts?.test || 'not found'")

# 2. Run tests with timeout
echo "Running tests: $TEST_CMD"
timeout 300 npm test 2>&1 | tee /tmp/test-output.txt
EXIT_CODE=${PIPESTATUS[0]}

# 3. Parse results
echo "Parsing test results..."
TEST_OUTPUT=$(cat /tmp/test-output.txt)
# Parse with JavaScript function above

# 4. Generate summary
echo "Test Results:"
echo "  Total: $TOTAL_TESTS"
echo "  Passed: $PASSED_TESTS"
echo "  Failed: $FAILED_TESTS"
echo "  Status: $TEST_STATUS"

# 5. Include in verification report
# (Step 6 in protocol)
```
```

**Key Points:**
- Provide complete bash commands Claude can execute
- Include JavaScript parsing functions Claude can use
- Handle all common test frameworks
- Graceful degradation for missing tests
- Clear error handling with specific responses
- Return structured data for report generation

**Integration:**
This section provides Claude with everything needed to execute tests autonomously. The output feeds into the verification report (Step 6).

</action>
<verify>
```bash
# Verify test execution section added
grep -q "### Step 2: Run Test Suite" subagents/reis_verifier.md && echo "✅ Step 2 section present"

# Check for key components
grep -q "Test Framework Detection" subagents/reis_verifier.md && echo "✅ Framework detection documented"
grep -q "Test Execution" subagents/reis_verifier.md && echo "✅ Execution instructions present"
grep -q "Result Parsing" subagents/reis_verifier.md && echo "✅ Parsing logic included"
grep -q "Coverage Extraction" subagents/reis_verifier.md && echo "✅ Coverage handling documented"
grep -q "Handling Missing Tests" subagents/reis_verifier.md && echo "✅ Missing test handling defined"

# Verify code examples included
grep -c "```bash" subagents/reis_verifier.md
grep -c "```javascript" subagents/reis_verifier.md

# Check for error handling table
grep -q "| Error | Response |" subagents/reis_verifier.md && echo "✅ Error handling table present"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive test execution protocol
- Test Framework Detection section with priority order and detection steps
- Test Execution section with timeout and output capture
- Result Parsing section with multi-framework support (Jest, Vitest, Node, Mocha, generic)
- Coverage Extraction logic included
- Handling Missing Tests with warning (not failure) approach
- Test Result Object format defined
- Error Handling table with common scenarios
- Best Practices and Example Execution Flow included
- Complete bash commands and JavaScript functions provided
- Section is ~150-200 lines with executable instructions
</done>
</task>

## Success Criteria
- ✅ Step 2 (Run Test Suite) in reis_verifier.md fully documented
- ✅ Test framework detection supports Jest, Vitest, Node, Mocha, generic npm test
- ✅ Test execution includes timeout, output capture, and exit code handling
- ✅ Result parsing handles multiple test output formats
- ✅ Coverage extraction logic included
- ✅ Missing tests handled gracefully (warning, not failure)
- ✅ Structured test result object format defined
- ✅ Error handling covers common scenarios
- ✅ Complete executable code provided (bash commands, JavaScript functions)
- ✅ Integration with verification report generation clear

## Verification

```bash
# Check Step 2 section
grep -A100 "### Step 2: Run Test Suite" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "parseTestResults" subagents/reis_verifier.md && echo "✅ Parser function included"
grep -q "timeout 300" subagents/reis_verifier.md && echo "✅ Timeout handling present"
grep -q "jest/vitest\|node\|mocha" subagents/reis_verifier.md && echo "✅ Multiple frameworks supported"
grep -q "⚠️ WARNING - No tests" subagents/reis_verifier.md && echo "✅ Graceful missing test handling"

# Count code blocks (should have several)
echo "Code blocks:"
grep -c "^```" subagents/reis_verifier.md

# Verify structure
grep "^### Step" subagents/reis_verifier.md | head -5
```

---

*This plan will be executed by reis_executor in a fresh context.*
