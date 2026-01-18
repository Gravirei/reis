# Plan: 2-3 - Implement Success Criteria Validation

## Objective
Define comprehensive success criteria validation logic in reis_verifier specification, enabling automated checking of completion criteria with evidence collection.

## Context
Success criteria from PLAN.md files define "done" for each plan. The verifier must check each criterion systematically and provide evidence. This is Step 3 in the verification protocol and runs in parallel with test execution (Wave 2.2).

**Key Requirements:**
- Parse success criteria from PLAN.md (command already extracts these)
- Validate each criterion independently
- Collect evidence (file existence, command output, grep results)
- Support multiple criterion formats (file existence, test results, functional checks)
- Provide clear ✅/❌/⚠️ status per criterion
- Handle ambiguous criteria gracefully

**Success Criteria Formats to Support:**
- File/directory existence: "✅ File X exists"
- Content checks: "✅ File contains Y"
- Command results: "✅ Command returns Z"
- Test results: "✅ All tests passing"
- Functional checks: "✅ Feature works as expected"
- Documentation: "✅ README updated"

## Dependencies
- Wave 2.1 (verify command) - Need PLAN.md parsing

## Tasks

<task type="auto">
<name>Add success criteria validation protocol to reis_verifier</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 3: Validate Success Criteria" section in the Seven-Step Verification Protocol with comprehensive validation instructions.

**Location:** Find "Step 3: Validate Success Criteria" in the protocol section.

**Replace/Expand with:**

```markdown
### Step 3: Validate Success Criteria

Systematically check each success criterion from PLAN.md and collect evidence.

#### Loading Success Criteria

Success criteria are loaded by the verify command and passed in the prompt. They appear in this format:

```markdown
## Success Criteria
- ✅ File subagents/reis_verifier.md exists
- ✅ All tests passing
- ✅ Documentation updated in README.md
- ✅ No syntax errors in code
```

**Parse criteria:**
```javascript
function parseSuccessCriteria(planContent) {
  const criteriaSection = planContent.match(/## Success Criteria\s+([\s\S]*?)(?=\n##|\n---|\z)/);
  if (!criteriaSection) {
    return [];
  }
  
  const criteriaText = criteriaSection[1];
  const criteria = criteriaText.match(/^[-*]\s+(.+)$/gm);
  
  if (!criteria) {
    return [];
  }
  
  return criteria.map(c => {
    // Remove bullet and checkbox markers
    const text = c.replace(/^[-*]\s+/, '').replace(/^✅\s+/, '').trim();
    return {
      description: text,
      status: 'pending',
      evidence: [],
      notes: '',
    };
  });
}
```

#### Criterion Classification

Classify each criterion by type to determine validation approach:

| Type | Pattern | Validation Method |
|------|---------|-------------------|
| File Existence | "File/Directory X exists" | Check with `test -f` or `test -d` |
| Content Check | "File contains Y" | Use `grep` or file reading |
| Command Success | "Command returns Z" | Execute and check output/exit code |
| Test Results | "Tests passing/pass" | Use test results from Step 2 |
| Count/Metric | "X items/files/tests" | Count and compare |
| Documentation | "README/docs updated/includes" | Check file existence and content |
| Generic | Everything else | Manual evidence gathering |

**Classification Function:**
```javascript
function classifyCriterion(description) {
  const lower = description.toLowerCase();
  
  if (lower.match(/file.*exists?|directory.*exists?/)) {
    return { type: 'file_existence', extractPath: extractPathFromCriterion(description) };
  }
  
  if (lower.match(/contains?|includes?/)) {
    return { type: 'content_check', file: extractPathFromCriterion(description) };
  }
  
  if (lower.match(/tests?.*pass|pass.*tests?|all tests/)) {
    return { type: 'test_result', dependency: 'step2' };
  }
  
  if (lower.match(/\d+.*tests?|tests?.*\d+/)) {
    return { type: 'test_count', dependency: 'step2' };
  }
  
  if (lower.match(/readme|changelog|documentation|docs/)) {
    return { type: 'documentation', file: extractPathFromCriterion(description) };
  }
  
  if (lower.match(/command|returns?|outputs?|curl/)) {
    return { type: 'command_result', command: extractCommandFromCriterion(description) };
  }
  
  if (lower.match(/no.*errors?|syntax.*valid/)) {
    return { type: 'quality_check', dependency: 'step4' };
  }
  
  return { type: 'generic' };
}

function extractPathFromCriterion(text) {
  // Extract file/directory paths from criterion text
  const pathMatch = text.match(/[`']?([a-zA-Z0-9._/-]+\.[a-zA-Z0-9]+|[a-zA-Z0-9._/-]+\/)[`']?/);
  return pathMatch ? pathMatch[1] : null;
}

function extractCommandFromCriterion(text) {
  // Extract command from criterion text
  const cmdMatch = text.match(/`([^`]+)`/);
  return cmdMatch ? cmdMatch[1] : null;
}
```

#### Validation Methods

**File Existence Validation:**
```bash
# Check if file exists
if [ -f "path/to/file.js" ]; then
  echo "✅ File exists"
  STATUS="pass"
  EVIDENCE="File found at path/to/file.js ($(wc -l < path/to/file.js) lines)"
else
  echo "❌ File not found"
  STATUS="fail"
  EVIDENCE="File path/to/file.js does not exist"
fi
```

**Content Check Validation:**
```bash
# Check if file contains specific text
FILE="README.md"
SEARCH="reis_verifier"

if [ -f "$FILE" ]; then
  if grep -q "$SEARCH" "$FILE"; then
    echo "✅ Content found"
    STATUS="pass"
    LINE=$(grep -n "$SEARCH" "$FILE" | head -1)
    EVIDENCE="Found '$SEARCH' in $FILE: $LINE"
  else
    echo "❌ Content not found"
    STATUS="fail"
    EVIDENCE="'$SEARCH' not found in $FILE"
  fi
else
  echo "❌ File not found"
  STATUS="fail"
  EVIDENCE="File $FILE does not exist"
fi
```

**Test Result Validation:**
```javascript
// Use test results from Step 2
function validateTestCriterion(criterion, testResults) {
  const lower = criterion.description.toLowerCase();
  
  if (lower.includes('all tests pass')) {
    if (testResults.metrics.failed === 0 && testResults.metrics.passed > 0) {
      return {
        status: 'pass',
        evidence: `All ${testResults.metrics.passed} tests passed`,
        notes: `Test framework: ${testResults.framework}`,
      };
    } else {
      return {
        status: 'fail',
        evidence: `${testResults.metrics.failed} tests failed out of ${testResults.metrics.total}`,
        notes: 'Check test output for details',
      };
    }
  }
  
  // Check for specific test count
  const countMatch = lower.match(/(\d+).*tests?.*pass/);
  if (countMatch) {
    const expectedCount = parseInt(countMatch[1]);
    if (testResults.metrics.passed >= expectedCount) {
      return {
        status: 'pass',
        evidence: `${testResults.metrics.passed} tests passed (expected ${expectedCount})`,
        notes: 'Met or exceeded expected test count',
      };
    } else {
      return {
        status: 'fail',
        evidence: `Only ${testResults.metrics.passed} tests passed (expected ${expectedCount})`,
        notes: 'Fewer tests passing than expected',
      };
    }
  }
  
  // Generic test criterion
  if (testResults.metrics.failed === 0) {
    return { status: 'pass', evidence: 'Tests passing', notes: '' };
  } else {
    return { status: 'fail', evidence: 'Tests failing', notes: '' };
  }
}
```

**Documentation Validation:**
```bash
# Check documentation exists and is updated
check_documentation() {
  FILE=$1
  REQUIRED_CONTENT=$2
  
  if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    return 1
  fi
  
  # Check if file was recently modified (within last week)
  MTIME=$(stat -c %Y "$FILE" 2>/dev/null || stat -f %m "$FILE" 2>/dev/null)
  NOW=$(date +%s)
  AGE=$((NOW - MTIME))
  WEEK=604800
  
  if [ $AGE -lt $WEEK ]; then
    echo "✅ Recently updated (within 7 days)"
  fi
  
  # Check for required content if specified
  if [ -n "$REQUIRED_CONTENT" ]; then
    if grep -q "$REQUIRED_CONTENT" "$FILE"; then
      echo "✅ Contains required content"
      return 0
    else
      echo "⚠️ File exists but missing expected content"
      return 2
    fi
  fi
  
  return 0
}
```

**Command Result Validation:**
```bash
# Execute command and validate output
validate_command() {
  CMD=$1
  EXPECTED=$2
  
  echo "Running: $CMD"
  OUTPUT=$(eval "$CMD" 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    if [ -n "$EXPECTED" ]; then
      if echo "$OUTPUT" | grep -q "$EXPECTED"; then
        echo "✅ Command succeeded with expected output"
        return 0
      else
        echo "⚠️ Command succeeded but output doesn't match"
        return 2
      fi
    else
      echo "✅ Command succeeded"
      return 0
    fi
  else
    echo "❌ Command failed with exit code $EXIT_CODE"
    return 1
  fi
}
```

**Generic Criterion Validation:**
```javascript
// For criteria that don't fit patterns, gather evidence manually
function validateGenericCriterion(criterion) {
  // Attempt to gather relevant evidence
  const evidence = [];
  
  // Check for related files
  const words = criterion.description.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (word.length > 4 && word.match(/^[a-z]+$/)) {
      // Try to find related files
      try {
        const result = execSync(`find . -name "*${word}*" -type f | head -5`, { encoding: 'utf8' });
        if (result.trim()) {
          evidence.push(`Related files: ${result.trim()}`);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  return {
    status: 'warning',
    evidence: evidence.length > 0 ? evidence.join('; ') : 'Manual verification required',
    notes: 'This criterion requires human judgment or more context',
  };
}
```

#### Validation Execution Flow

```javascript
async function validateAllCriteria(criteria, testResults, projectRoot) {
  const results = [];
  
  for (const criterion of criteria) {
    const classification = classifyCriterion(criterion.description);
    let validation;
    
    switch (classification.type) {
      case 'file_existence':
        validation = await validateFileExistence(classification.extractPath, projectRoot);
        break;
      case 'content_check':
        validation = await validateContent(classification.file, criterion.description, projectRoot);
        break;
      case 'test_result':
        validation = validateTestCriterion(criterion, testResults);
        break;
      case 'documentation':
        validation = await validateDocumentation(classification.file, criterion.description, projectRoot);
        break;
      case 'command_result':
        validation = await validateCommand(classification.command, criterion.description);
        break;
      case 'generic':
      default:
        validation = validateGenericCriterion(criterion);
        break;
    }
    
    results.push({
      criterion: criterion.description,
      type: classification.type,
      status: validation.status,
      evidence: validation.evidence,
      notes: validation.notes,
    });
  }
  
  return results;
}
```

#### Success Criteria Report Format

Generate structured output for the verification report:

```javascript
{
  "totalCriteria": 5,
  "passed": 4,
  "failed": 0,
  "warnings": 1,
  "criteria": [
    {
      "criterion": "File subagents/reis_verifier.md exists",
      "type": "file_existence",
      "status": "pass",
      "evidence": "File found at subagents/reis_verifier.md (527 lines)",
      "notes": ""
    },
    {
      "criterion": "All tests passing",
      "type": "test_result",
      "status": "pass",
      "evidence": "All 23 tests passed",
      "notes": "Test framework: jest"
    },
    {
      "criterion": "README mentions verifier",
      "type": "content_check",
      "status": "pass",
      "evidence": "Found 'reis_verifier' in README.md: line 42",
      "notes": ""
    },
    {
      "criterion": "No syntax errors",
      "type": "quality_check",
      "status": "pass",
      "evidence": "node --check passed for all JS files",
      "notes": "Checked 15 files"
    },
    {
      "criterion": "Feature works as expected",
      "type": "generic",
      "status": "warning",
      "evidence": "Manual verification required",
      "notes": "This criterion requires human judgment"
    }
  ],
  "overallStatus": "pass" // pass if no failures, partial if warnings, fail if any failed
}
```

#### Best Practices

1. **Check dependencies** - Some criteria depend on previous steps (tests, quality checks)
2. **Gather evidence** - Always provide specific evidence, not just "checked"
3. **Be precise** - Use exact file paths, line numbers, counts
4. **Handle ambiguity** - Use ⚠️ WARNING for criteria that need human judgment
5. **Cross-reference** - Link criteria to test results, file changes, etc.
6. **Fail gracefully** - If validation method fails, mark as warning with explanation
7. **Include raw data** - Provide command output, grep results, file contents snippets

#### Error Handling

| Error | Response |
|-------|----------|
| Criterion too vague | ⚠️ WARNING - Manual verification needed |
| File not found | ❌ FAIL - Provide exact path checked |
| Command not available | ⚠️ WARNING - Cannot execute validation command |
| Parsing error | ⚠️ WARNING - Could not parse criterion format |
| Circular dependency | ❌ FAIL - Criterion depends on unchecked step |

#### Example Output

For verification report:

```markdown
### Criterion 1: File subagents/reis_verifier.md exists
**Status**: ✅ PASS
**Evidence**: File found at subagents/reis_verifier.md (527 lines, modified 2024-01-18)
**Notes**: File structure matches expected subagent format

### Criterion 2: All tests passing
**Status**: ✅ PASS
**Evidence**: All 23 tests passed (Jest framework, 3.2s)
**Notes**: Test results from Step 2

### Criterion 3: Feature works as expected
**Status**: ⚠️ PARTIAL
**Evidence**: Manual verification required
**Notes**: This criterion requires functional testing or human judgment - recommend adding specific testable criteria
```
```

**Key Points:**
- Provide complete validation logic for all criterion types
- Include classification, validation methods, and error handling
- Return structured data for report generation
- Handle ambiguous criteria gracefully
- Cross-reference with test results from Step 2

</action>
<verify>
```bash
# Verify Step 3 section added
grep -q "### Step 3: Validate Success Criteria" subagents/reis_verifier.md && echo "✅ Step 3 section present"

# Check for key components
grep -q "Loading Success Criteria" subagents/reis_verifier.md && echo "✅ Loading logic documented"
grep -q "Criterion Classification" subagents/reis_verifier.md && echo "✅ Classification system present"
grep -q "Validation Methods" subagents/reis_verifier.md && echo "✅ Validation methods included"
grep -q "file_existence\|content_check\|test_result" subagents/reis_verifier.md && echo "✅ Multiple criterion types supported"

# Verify code examples
grep -c "```javascript" subagents/reis_verifier.md
grep -c "```bash" subagents/reis_verifier.md

# Check for classification table
grep -q "| Type | Pattern | Validation Method |" subagents/reis_verifier.md && echo "✅ Classification table present"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive success criteria validation
- Loading Success Criteria section with parsing logic
- Criterion Classification with type detection (7 types supported)
- Validation Methods for each criterion type (file existence, content check, test result, documentation, command result, generic)
- Validation Execution Flow with async processing
- Success Criteria Report Format defined
- Best Practices and Error Handling included
- Example Output format for verification report
- Complete JavaScript functions and bash commands provided
- Section is ~200-250 lines with executable instructions
</done>
</task>

## Success Criteria
- ✅ Step 3 (Validate Success Criteria) in reis_verifier.md fully documented
- ✅ Criterion classification system supports 7+ types (file existence, content check, test result, documentation, command result, quality check, generic)
- ✅ Validation methods provided for each criterion type
- ✅ Evidence collection logic included
- ✅ Cross-references test results from Step 2
- ✅ Handles ambiguous criteria with warnings (not failures)
- ✅ Structured output format defined for report generation
- ✅ Error handling covers common scenarios
- ✅ Complete executable code provided (JavaScript functions, bash commands)
- ✅ Best practices and example output included

## Verification

```bash
# Check Step 3 section
grep -A100 "### Step 3: Validate Success Criteria" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "classifyCriterion" subagents/reis_verifier.md && echo "✅ Classification function included"
grep -q "validateFileExistence\|validateContent\|validateTestCriterion" subagents/reis_verifier.md && echo "✅ Validation methods present"
grep -q "file_existence.*content_check.*test_result" subagents/reis_verifier.md && echo "✅ Multiple types supported"
grep -q "overallStatus" subagents/reis_verifier.md && echo "✅ Report format defined"

# Count validation methods
grep -c "Validation:" subagents/reis_verifier.md

# Verify structure
grep "^### Step" subagents/reis_verifier.md | head -5
```

---

*This plan will be executed by reis_executor in a fresh context.*
