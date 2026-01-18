# Plan: 2-2 - Implement Test Execution Module

## Objective
Add test execution capabilities to the reis_verifier subagent specification, including framework detection, test running, output parsing, and result collection.

## Context
The verifier needs to automatically run project tests and parse results. This is Step 2 in the verification protocol. Tests validate functionality, while FR4.1 (Step 4) validates completeness.

**Key Requirements:**
- Detect test framework (Jest, Vitest, Node Test, npm test)
- Run test suite with `npm test`
- Capture and parse output
- Extract pass/fail/pending counts
- Handle test failures gracefully
- Support projects without tests (warning, not failure)

**Integration with FR4.1:**
- Tests passing ≠ features complete
- Must also verify all tasks implemented (FR4.1)
- Both test results AND feature completeness required for PASS

## Dependencies
- Wave 2.1 (verify command infrastructure)

## Tasks

<task type="auto">
<name>Add test execution section to reis_verifier subagent</name>
<files>subagents/reis_verifier.md</files>
<action>
Enhance the reis_verifier.md specification with detailed test execution instructions in the verification protocol (Step 2).

**Locate:** Find the "Step 2: Run Test Suite" section in the verification protocol.

**Enhance with:**

```markdown
### Step 2: Run Test Suite

**Objective:** Execute all project tests and collect results.

**Process:**

1. **Detect Test Framework**
   ```bash
   # Check package.json for test script
   cat package.json | grep "\"test\":"
   
   # Common frameworks:
   # - Jest: "jest" in test script or dependencies
   # - Vitest: "vitest" in test script or dependencies
   # - Node Test: "node --test" or "node:test"
   # - Generic: "npm test"
   ```

2. **Run Tests**
   ```bash
   # Always use npm test (respects package.json config)
   npm test 2>&1 | tee test-output.txt
   ```

3. **Parse Test Output**
   
   **Jest/Vitest Format:**
   ```
   Tests:       5 passed, 2 failed, 1 skipped, 8 total
   Time:        2.5s
   ```
   
   **Node Test Format:**
   ```
   ✓ test name (1.2ms)
   ✗ test name (0.5ms)
   tests 10 | passed 8 | failed 2
   ```

   **Parse Logic:**
   ```javascript
   function parseTestOutput(output) {
     // Jest/Vitest pattern
     const jestMatch = output.match(/Tests:\s+(\d+) passed(?:,\s+(\d+) failed)?(?:,\s+(\d+) skipped)?/);
     if (jestMatch) {
       return {
         passed: parseInt(jestMatch[1]),
         failed: parseInt(jestMatch[2] || 0),
         skipped: parseInt(jestMatch[3] || 0),
         total: parseInt(jestMatch[1]) + parseInt(jestMatch[2] || 0) + parseInt(jestMatch[3] || 0)
       };
     }
     
     // Node test pattern
     const nodeMatch = output.match(/tests (\d+).*passed (\d+).*failed (\d+)/);
     if (nodeMatch) {
       return {
         passed: parseInt(nodeMatch[2]),
         failed: parseInt(nodeMatch[3]),
         total: parseInt(nodeMatch[1])
       };
     }
     
     // Fallback: count ✓ and ✗
     const passed = (output.match(/✓|PASS/g) || []).length;
     const failed = (output.match(/✗|FAIL/g) || []).length;
     return { passed, failed, total: passed + failed };
   }
   ```

4. **Extract Failed Test Details**
   ```javascript
   function extractFailedTests(output) {
     const failures = [];
     
     // Look for failure blocks
     const failureBlocks = output.match(/●[^\n]+\n[\s\S]*?(?=●|\n\n|$)/g) || [];
     
     for (const block of failureBlocks) {
       const nameMatch = block.match(/● (.+)/);
       const fileMatch = block.match(/at .+\((.+):(\d+):(\d+)\)/);
       const errorMatch = block.match(/Error: (.+)/);
       
       failures.push({
         name: nameMatch ? nameMatch[1] : 'Unknown test',
         file: fileMatch ? fileMatch[1] : 'Unknown',
         line: fileMatch ? fileMatch[2] : '?',
         error: errorMatch ? errorMatch[1] : 'See output'
       });
     }
     
     return failures;
   }
   ```

5. **Handle No Tests Gracefully**
   ```bash
   # If no test script exists
   if ! grep -q "\"test\":" package.json; then
     echo "⚠️  No tests configured (not a failure, just a warning)"
     return { passed: 0, failed: 0, total: 0, warning: "No tests found" }
   fi
   ```

6. **Collect Results**
   ```javascript
   const testResults = {
     framework: detectFramework(),
     status: failed === 0 ? 'PASS' : 'FAIL',
     metrics: {
       total,
       passed,
       failed,
       skipped: skipped || 0,
       duration: parseDuration(output)
     },
     failures: extractFailedTests(output),
     output: output // Keep full output for debugging
   };
   ```

**Important Notes:**

- **Tests passing ≠ verification passing**
  - Tests validate functionality
  - FR4.1 validates completeness
  - Both required for overall PASS

- **No tests is a warning, not failure**
  - Some projects legitimately have no tests yet
  - Report as warning in verification report
  - Don't block on this alone

- **Timeout handling**
  - Set reasonable timeout (5 minutes default)
  - If tests hang, report timeout and continue
  - Don't let hung tests block verification

**Verification Report Section:**
```markdown
## Test Results

**Status:** ${status}
**Framework:** ${framework}

**Metrics:**
- Total: ${total}
- Passed: ${passed} ✅
- Failed: ${failed} ❌
- Skipped: ${skipped} ⏸️
- Duration: ${duration}ms

${failures.length > 0 ? `
### Failed Tests

${failures.map(f => `
**Test:** ${f.name}
**File:** ${f.file}:${f.line}
**Error:** ${f.error}
`).join('\n')}
` : ''}
```
```

**Integration Points:**
- This is Step 2 of 7 in verification protocol
- Results feed into final report (Wave 2.4)
- Test failures are critical issues
- But tests passing + features missing (FR4.1) = still FAIL

**Anti-Patterns:**
- ❌ Don't assume tests exist
- ❌ Don't fail verification if no tests (warn only)
- ❌ Don't skip this step even if no tests
- ❌ Don't assume passing tests = complete features
- ✅ DO parse output reliably
- ✅ DO handle timeouts gracefully
- ✅ DO report test failures clearly
</action>
<verify>
```bash
# Check reis_verifier.md was updated
test -f subagents/reis_verifier.md && echo "✅ Subagent spec exists"

# Verify Step 2 content
grep -A20 "Step 2.*Test" subagents/reis_verifier.md | grep -q "npm test\|parseTestOutput" && echo "✅ Test execution section enhanced"

# Check for framework detection
grep -q "Detect.*Framework\|Jest\|Vitest" subagents/reis_verifier.md && echo "✅ Framework detection included"

# Check for parsing logic
grep -q "parseTestOutput\|Parse.*Output" subagents/reis_verifier.md && echo "✅ Parse logic included"

# Verify graceful handling
grep -q "No tests.*warning\|handle.*gracefully" subagents/reis_verifier.md && echo "✅ Graceful handling documented"
```
</verify>
<done>
- subagents/reis_verifier.md Step 2 enhanced with test execution details
- Framework detection logic (Jest, Vitest, Node Test, npm test)
- Test output parsing with multiple format support
- Failed test extraction with file/line/error details
- Graceful handling for projects without tests
- Timeout handling documented
- Integration with verification report format
- Clear distinction: tests ≠ feature completeness
</done>
</task>

<task type="auto">
<name>Add test execution examples to subagent spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Add practical examples of test execution to the Examples section of reis_verifier.md.

**Add to Examples Section:**

```markdown
### Example 2: Test Execution Scenarios

#### Scenario A: All Tests Passing

**Command:**
```bash
npm test
```

**Output:**
```
PASS test/auth/login.test.js
  ✓ authenticates valid user (45ms)
  ✓ rejects invalid password (12ms)
  ✓ handles missing fields (8ms)

Tests: 3 passed, 3 total
Time: 1.234s
```

**Parsed Results:**
```javascript
{
  framework: 'jest',
  status: 'PASS',
  metrics: { total: 3, passed: 3, failed: 0, duration: 1234 },
  failures: []
}
```

**Report Section:**
```markdown
## Test Results ✅

**Status:** All tests pass
**Framework:** Jest

**Metrics:**
- Total: 3
- Passed: 3 ✅
- Failed: 0
- Duration: 1234ms
```

#### Scenario B: Tests Failing

**Output:**
```
FAIL test/auth/password-reset.test.js
  ✗ sends reset email (156ms)
  
    Error: Function 'sendResetEmail' is not defined
    at test/auth/password-reset.test.js:15:5

Tests: 2 passed, 1 failed, 3 total
```

**Parsed Results:**
```javascript
{
  framework: 'jest',
  status: 'FAIL',
  metrics: { total: 3, passed: 2, failed: 1 },
  failures: [{
    name: 'sends reset email',
    file: 'test/auth/password-reset.test.js',
    line: '15',
    error: "Function 'sendResetEmail' is not defined"
  }]
}
```

**Report Section:**
```markdown
## Test Results ❌

**Status:** 1 test failing
**Framework:** Jest

**Metrics:**
- Total: 3
- Passed: 2 ✅
- Failed: 1 ❌
- Duration: 2345ms

### Failed Tests

**Test:** sends reset email
**File:** test/auth/password-reset.test.js:15
**Error:** Function 'sendResetEmail' is not defined

**Analysis:** This failure indicates Task 2 (Password Reset) may be incomplete.
See Feature Completeness section for full analysis.
```

#### Scenario C: No Tests Configured

**Check:**
```bash
$ cat package.json | grep "\"test\":"
# No match
```

**Result:**
```javascript
{
  status: 'WARNING',
  message: 'No tests configured',
  metrics: { total: 0, passed: 0, failed: 0 }
}
```

**Report Section:**
```markdown
## Test Results ⚠️

**Status:** No tests found
**Framework:** None

**Note:** This project has no test suite configured. This is not a verification 
failure, but tests are recommended for production code.

**Recommendation:** Add tests in future iterations.
```
```

**Key Learning Points:**
1. Parse output reliably across frameworks
2. Extract failure details for debugging
3. Handle missing tests gracefully (warning, not failure)
4. Link test failures to feature completeness analysis
</action>
<verify>
```bash
# Check examples were added
grep -q "Example.*Test Execution\|Scenario A.*Tests Passing" subagents/reis_verifier.md && echo "✅ Test execution examples added"

# Verify multiple scenarios
grep -c "Scenario [A-C]:" subagents/reis_verifier.md | grep -q "3" && echo "✅ All 3 scenarios present"

# Check for warning handling example
grep -q "No tests.*WARNING\|No tests configured" subagents/reis_verifier.md && echo "✅ No-tests scenario included"
```
</verify>
<done>
- Test execution examples added to reis_verifier.md
- Scenario A: All tests passing (shows successful parse)
- Scenario B: Tests failing (shows failure extraction)
- Scenario C: No tests configured (shows graceful warning)
- Examples show input, parsing, and report output
- Demonstrates framework detection and error handling
</done>
</task>

## Success Criteria
- ✅ reis_verifier.md Step 2 enhanced with test execution details
- ✅ Framework detection logic documented (Jest, Vitest, Node Test)
- ✅ Test output parsing with multiple format support
- ✅ Failed test extraction (name, file, line, error)
- ✅ Graceful handling for projects without tests (warning, not failure)
- ✅ Timeout handling documented
- ✅ Integration with report format specified
- ✅ Test execution examples added (passing, failing, no tests)
- ✅ Clear distinction: test pass ≠ feature completeness

## Verification

```bash
# Check Step 2 in protocol
grep -A50 "Step 2.*Test" subagents/reis_verifier.md | head -60

# Verify parsing logic
grep -n "parseTestOutput\|Parse.*Output" subagents/reis_verifier.md

# Check examples
grep -A30 "Example.*Test Execution" subagents/reis_verifier.md | head -40

# Verify framework detection
grep -n "Jest\|Vitest\|Node Test" subagents/reis_verifier.md | head -10
```

---

*This plan will be executed by reis_executor in a fresh context.*
