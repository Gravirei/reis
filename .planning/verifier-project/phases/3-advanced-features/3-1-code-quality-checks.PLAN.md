# Plan: 3-1 - Add Code Quality Checks

## Objective
Implement comprehensive code quality validation in reis_verifier specification, including syntax checking, linting, and common issue detection.

## Context
Phase 2 implemented test execution, success criteria validation, and report generation. Now we add code quality checks (Step 4 in the verification protocol) to catch syntax errors, linting issues, and common problems.

**Key Requirements:**
- Syntax validation for all code files (node --check)
- Linting integration (ESLint if configured)
- Detect common issues (unused variables, console.logs in production, etc.)
- Generate quality score/summary
- Include results in verification report
- Handle projects without linters gracefully (warn, don't fail)

**Reference Files:**
- `subagents/reis_verifier.md` - Add Step 4 details
- Common linters: ESLint, StandardJS, Prettier
- Node.js syntax checking: `node --check`

## Dependencies
- Wave 2.4 (Report Generation) - Need report structure to populate quality section

## Tasks

<task type="auto">
<name>Add code quality validation protocol to reis_verifier</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 4: Check Code Quality" section in the Seven-Step Verification Protocol with comprehensive quality checking instructions.

**Location:** Find "Step 4: Check Code Quality" in the protocol section (should be after Step 3).

**Replace/Expand with:**

```markdown
### Step 4: Check Code Quality

Validate code quality through syntax checking, linting, and common issue detection.

#### Syntax Validation

**Check all JavaScript/TypeScript files for syntax errors:**

```bash
# Find all JS/TS files (excluding node_modules)
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.next/*" > /tmp/code-files.txt

# Check syntax of each file
SYNTAX_ERRORS=0
while IFS= read -r file; do
  if [[ "$file" == *.ts* ]]; then
    # TypeScript files - try tsc if available
    if command -v tsc &> /dev/null; then
      tsc --noEmit --skipLibCheck "$file" 2>&1 | grep -i error && SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
    else
      echo "⚠️ TypeScript file but tsc not available: $file"
    fi
  else
    # JavaScript files - use node --check
    if ! node --check "$file" 2>/dev/null; then
      echo "❌ Syntax error in $file"
      SYNTAX_ERRORS=$((SYNTAX_ERRORS + 1))
    fi
  fi
done < /tmp/code-files.txt

if [ $SYNTAX_ERRORS -eq 0 ]; then
  echo "✅ No syntax errors found"
  SYNTAX_STATUS="pass"
else
  echo "❌ $SYNTAX_ERRORS syntax errors found"
  SYNTAX_STATUS="fail"
fi
```

**Syntax Check Result:**
```javascript
{
  "passed": true/false,
  "filesChecked": 42,
  "errors": [
    { "file": "path/to/file.js", "line": 15, "error": "Unexpected token" }
  ],
  "details": "Checked 42 files, 0 errors found"
}
```

#### Linter Detection and Execution

**Detect available linters:**

```bash
# Check package.json for linter dependencies and scripts
HAS_ESLINT=false
HAS_LINT_SCRIPT=false

if [ -f package.json ]; then
  # Check for ESLint dependency
  if grep -q '"eslint"' package.json; then
    HAS_ESLINT=true
  fi
  
  # Check for lint script
  if grep -q '"lint"' package.json | head -1 | grep -q 'scripts'; then
    HAS_LINT_SCRIPT=true
  fi
fi

# Check for .eslintrc files
if [ -f .eslintrc.js ] || [ -f .eslintrc.json ] || [ -f .eslintrc.yml ]; then
  HAS_ESLINT=true
fi
```

**Run linter if available:**

```bash
if [ "$HAS_ESLINT" = true ] || [ "$HAS_LINT_SCRIPT" = true ]; then
  echo "Running linter..."
  
  # Try npm run lint first (respects project config)
  if [ "$HAS_LINT_SCRIPT" = true ]; then
    npm run lint 2>&1 | tee /tmp/lint-output.txt
    LINT_EXIT_CODE=${PIPESTATUS[0]}
  elif [ "$HAS_ESLINT" = true ]; then
    # Run eslint directly
    npx eslint . --ext .js,.jsx,.ts,.tsx 2>&1 | tee /tmp/lint-output.txt
    LINT_EXIT_CODE=${PIPESTATUS[0]}
  fi
  
  # Parse linting results
  LINT_OUTPUT=$(cat /tmp/lint-output.txt)
  
  # Extract issue count (ESLint format)
  PROBLEM_COUNT=$(echo "$LINT_OUTPUT" | grep -oP '\d+(?= problems?)' | head -1)
  ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -oP '\d+(?= errors?)' | head -1)
  WARNING_COUNT=$(echo "$LINT_OUTPUT" | grep -oP '\d+(?= warnings?)' | head -1)
  
  if [ -z "$PROBLEM_COUNT" ]; then
    PROBLEM_COUNT=0
  fi
  
  if [ $LINT_EXIT_CODE -eq 0 ]; then
    echo "✅ Linting passed"
    LINT_STATUS="pass"
  else
    echo "❌ Linting failed: $PROBLEM_COUNT issues"
    LINT_STATUS="fail"
  fi
else
  echo "⚠️ No linter configured"
  LINT_STATUS="warning"
  LINT_OUTPUT="No linter detected in project"
fi
```

**Linting Result:**
```javascript
{
  "tool": "eslint" | "none",
  "status": "pass" | "fail" | "warning",
  "issueCount": 12,
  "errors": 3,
  "warnings": 9,
  "summary": "3 errors, 9 warnings found",
  "output": "...", // Full linter output
  "topIssues": [
    { "file": "src/app.js", "line": 42, "rule": "no-unused-vars", "message": "..." },
    // Top 5 most severe issues
  ]
}
```

#### Parse Linting Issues

**Extract top issues from linter output:**

```javascript
function parseLintingIssues(lintOutput) {
  const issues = [];
  
  // ESLint format: "  15:10  error  'foo' is not defined  no-undef"
  const eslintPattern = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+([\w-]+)$/gm;
  
  let match;
  while ((match = eslintPattern.exec(lintOutput)) !== null) {
    const [, line, col, severity, message, rule] = match;
    issues.push({
      line: parseInt(line),
      column: parseInt(col),
      severity,
      message: message.trim(),
      rule,
    });
  }
  
  // Also extract file paths
  const filePattern = /^([^\s]+\.(?:js|ts|jsx|tsx))$/gm;
  let currentFile = null;
  
  const lines = lintOutput.split('\n');
  const issuesWithFiles = [];
  
  for (const line of lines) {
    const fileMatch = line.match(filePattern);
    if (fileMatch) {
      currentFile = fileMatch[1];
    } else if (currentFile) {
      const issueMatch = line.match(eslintPattern);
      if (issueMatch) {
        const [, lineNum, col, severity, message, rule] = issueMatch;
        issuesWithFiles.push({
          file: currentFile,
          line: parseInt(lineNum),
          column: parseInt(col),
          severity,
          message: message.trim(),
          rule,
        });
      }
    }
  }
  
  // Sort by severity (errors first)
  issuesWithFiles.sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (a.severity !== 'error' && b.severity === 'error') return 1;
    return 0;
  });
  
  return issuesWithFiles.slice(0, 10); // Top 10 issues
}
```

#### Common Issue Detection

**Check for common code problems:**

```bash
# Check for console.log in production code
echo "Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=test --exclude-dir=tests \
  . | wc -l)

if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "⚠️ Found $CONSOLE_LOGS console.log statements (consider removing for production)"
fi

# Check for debugger statements
echo "Checking for debugger statements..."
DEBUGGERS=$(grep -r "debugger" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist . | wc -l)

if [ $DEBUGGERS -gt 0 ]; then
  echo "⚠️ Found $DEBUGGERS debugger statements"
fi

# Check for TODO comments
echo "Checking for TODO comments..."
TODOS=$(grep -ri "TODO\|FIXME\|HACK\|XXX" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist . | wc -l)

if [ $TODOS -gt 0 ]; then
  echo "ℹ️ Found $TODOS TODO/FIXME comments"
fi

# Check for large files (>1000 lines - potential refactoring candidates)
echo "Checking for large files..."
LARGE_FILES=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/dist/*" \
  -exec wc -l {} \; | awk '$1 > 1000 {print $2}' | wc -l)

if [ $LARGE_FILES -gt 0 ]; then
  echo "ℹ️ Found $LARGE_FILES files over 1000 lines (consider refactoring)"
fi
```

**Common Issues Result:**
```javascript
{
  "consoleLogs": 5,
  "debuggers": 0,
  "todos": 12,
  "largeFiles": 2,
  "summary": [
    "5 console.log statements found",
    "12 TODO/FIXME comments",
    "2 large files (>1000 lines)"
  ]
}
```

#### Quality Score Calculation

**Generate an overall quality score:**

```javascript
function calculateQualityScore(syntaxResults, lintingResults, commonIssues) {
  let score = 100;
  const deductions = [];
  
  // Syntax errors are critical (-20 per error, max -60)
  if (!syntaxResults.passed) {
    const deduction = Math.min(syntaxResults.errors.length * 20, 60);
    score -= deduction;
    deductions.push(`-${deduction} (syntax errors)`);
  }
  
  // Linting errors (-2 per error, max -20)
  if (lintingResults.errors > 0) {
    const deduction = Math.min(lintingResults.errors * 2, 20);
    score -= deduction;
    deductions.push(`-${deduction} (linting errors)`);
  }
  
  // Linting warnings (-1 per warning, max -10)
  if (lintingResults.warnings > 0) {
    const deduction = Math.min(lintingResults.warnings * 1, 10);
    score -= deduction;
    deductions.push(`-${deduction} (linting warnings)`);
  }
  
  // Console.logs in production (-1 per occurrence, max -5)
  if (commonIssues.consoleLogs > 0) {
    const deduction = Math.min(commonIssues.consoleLogs * 1, 5);
    score -= deduction;
    deductions.push(`-${deduction} (console.logs)`);
  }
  
  // Debugger statements (-5 per occurrence)
  if (commonIssues.debuggers > 0) {
    const deduction = commonIssues.debuggers * 5;
    score -= deduction;
    deductions.push(`-${deduction} (debugger statements)`);
  }
  
  score = Math.max(score, 0); // Don't go below 0
  
  return {
    score,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
    deductions,
  };
}
```

#### Quality Check Result Object

Return structured quality results for report:

```javascript
{
  "status": "passed" | "failed" | "warning",
  "issueCount": 15,
  "syntax": {
    "passed": true,
    "filesChecked": 42,
    "errors": [],
    "details": "Checked 42 files, 0 errors found"
  },
  "linting": {
    "tool": "eslint",
    "status": "fail",
    "issueCount": 12,
    "errors": 3,
    "warnings": 9,
    "summary": "3 errors, 9 warnings found",
    "topIssues": [...]
  },
  "commonIssues": {
    "consoleLogs": 5,
    "debuggers": 0,
    "todos": 12,
    "largeFiles": 2
  },
  "qualityScore": {
    "score": 78,
    "grade": "C",
    "deductions": ["-6 (linting errors)", "-9 (linting warnings)", "-5 (console.logs)"]
  },
  "issues": [
    "5 console.log statements in production code",
    "12 TODO/FIXME comments need resolution"
  ]
}
```

#### Error Handling

| Error | Response |
|-------|----------|
| No code files found | ⚠️ WARNING - No code to check |
| Syntax checker unavailable | ⚠️ WARNING - Cannot validate syntax |
| Linter not configured | ℹ️ INFO - Suggest adding linter |
| Linter crashes | ⚠️ WARNING - Linter error, include output |
| TypeScript without tsc | ⚠️ WARNING - Cannot check TS syntax |

#### Best Practices

1. **Don't fail on missing linter** - It's a suggestion, not requirement
2. **Prioritize syntax errors** - These prevent code from running
3. **Provide context** - Show file paths, line numbers for issues
4. **Limit output** - Include top 10 issues, not all 500
5. **Suggest fixes** - When possible, recommend how to address issues
6. **Check production code only** - Exclude test files, node_modules, build dirs
7. **Be defensive** - Handle missing tools gracefully

#### Example Execution Flow

```bash
# 1. Syntax check
echo "Step 4.1: Checking syntax..."
./check_syntax.sh

# 2. Linting
echo "Step 4.2: Running linter..."
./run_linter.sh

# 3. Common issues
echo "Step 4.3: Detecting common issues..."
./detect_issues.sh

# 4. Calculate score
echo "Step 4.4: Calculating quality score..."
# JavaScript function from above

# 5. Generate summary
echo "Code Quality: $QUALITY_SCORE ($QUALITY_GRADE)"
echo "Issues: $TOTAL_ISSUES"
```

#### Integration with Report

Quality results populate the "Code Quality" section of the verification report (see Step 6).
```

**Key Points:**
- Complete syntax checking with node --check
- Linter detection and execution (ESLint primarily)
- Common issue detection (console.logs, debuggers, TODOs)
- Quality score calculation with grading
- Structured output for report generation
- Graceful handling of missing tools

</action>
<verify>
```bash
# Verify Step 4 section added
grep -q "### Step 4: Check Code Quality" subagents/reis_verifier.md && echo "✅ Step 4 section present"

# Check for key components
grep -q "Syntax Validation" subagents/reis_verifier.md && echo "✅ Syntax checking documented"
grep -q "Linter Detection" subagents/reis_verifier.md && echo "✅ Linter detection present"
grep -q "Common Issue Detection" subagents/reis_verifier.md && echo "✅ Issue detection included"
grep -q "Quality Score Calculation" subagents/reis_verifier.md && echo "✅ Scoring logic present"

# Verify code examples
grep -c "node --check" subagents/reis_verifier.md
grep -c "eslint" subagents/reis_verifier.md

# Check for quality result structure
grep -q "calculateQualityScore" subagents/reis_verifier.md && echo "✅ Score calculation function present"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive code quality validation
- Syntax Validation section with node --check for JS/TS files
- Linter Detection and Execution for ESLint and other tools
- Parse Linting Issues with top issue extraction
- Common Issue Detection (console.logs, debuggers, TODOs, large files)
- Quality Score Calculation with grading system (A-F)
- Quality Check Result Object format defined
- Error Handling for missing tools
- Best Practices for quality checking
- Example Execution Flow included
- Integration with report generation documented
- Section is ~200-250 lines with executable code
</done>
</task>

## Success Criteria
- ✅ Step 4 (Check Code Quality) in reis_verifier.md fully documented
- ✅ Syntax validation for JavaScript and TypeScript files
- ✅ Linter detection and execution (ESLint primarily)
- ✅ Linting issue parsing with top issues extracted
- ✅ Common issue detection (console.logs, debuggers, TODOs, large files)
- ✅ Quality score calculation with A-F grading
- ✅ Structured quality result object for report generation
- ✅ Graceful handling of missing linters (warning, not failure)
- ✅ Error handling for various scenarios
- ✅ Complete bash commands and JavaScript functions provided

## Verification

```bash
# Check Step 4 section
grep -A100 "### Step 4: Check Code Quality" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "node --check" subagents/reis_verifier.md && echo "✅ Syntax checking command"
grep -q "eslint" subagents/reis_verifier.md && echo "✅ ESLint integration"
grep -q "calculateQualityScore" subagents/reis_verifier.md && echo "✅ Score calculation"
grep -q "console\.log" subagents/reis_verifier.md && echo "✅ Common issue detection"

# Count code blocks
echo "Code blocks in Step 4:"
grep -A200 "### Step 4:" subagents/reis_verifier.md | grep -c "^```"

# Verify structure
grep "^### Step" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
