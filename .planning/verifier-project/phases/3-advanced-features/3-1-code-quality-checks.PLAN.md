# Plan: 3-1 - Implement Code Quality Checks

## Objective
Implement Step 3 of the verification protocol: validate code quality through syntax checks and linting.

## Context
Code quality validation (Step 3) runs BEFORE feature completeness validation (Step 4/FR4.1). This ensures basic code correctness before checking for completeness.

**Quality checks are secondary to FR4.1:** A codebase with perfect quality but missing features still fails verification.

**Key Checks:**
- Syntax validation (node --check)
- Linting (ESLint if configured)
- Common issues detection
- Quality scoring

## Dependencies
- Wave 2.1 (verify command infrastructure)

## Tasks

<task type="auto">
<name>Add code quality validation section to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Enhance Step 3 of the verification protocol with code quality checks.

**Locate:** Find "Step 3: Validate Code Quality" (or "Check Code Quality") in the protocol.

**Enhance with:**

```markdown
### Step 3: Validate Code Quality

**Objective:** Check for syntax errors, linting issues, and common code problems.

**Important:** Quality checks don't replace FR4.1. Code can be high quality but incomplete.

**Process:**

**1. Syntax Validation**

```bash
# Check all JS/TS files for syntax errors
find src lib -name "*.js" -o -name "*.ts" 2>/dev/null | while read file; do
  node --check "$file" 2>&1
done
```

**2. Detect Linter Configuration**

```bash
# Check for ESLint config
if [ -f .eslintrc.js ] || [ -f .eslintrc.json ] || grep -q "eslintConfig" package.json; then
  LINTER="eslint"
elif [ -f .eslintrc ]; then
  LINTER="eslint"
else
  LINTER="none"
fi
```

**3. Run Linter (if available)**

```bash
# Run ESLint if configured
if [ "$LINTER" = "eslint" ]; then
  npx eslint src/ lib/ --format json > lint-results.json 2>&1 || true
fi
```

**4. Parse Linter Output**

```javascript
function parseLintResults(output) {
  try {
    const results = JSON.parse(output);
    const errors = [];
    const warnings = [];
    
    for (const file of results) {
      for (const message of file.messages) {
        const issue = {
          file: file.filePath,
          line: message.line,
          column: message.column,
          rule: message.ruleId,
          message: message.message,
          severity: message.severity // 1=warning, 2=error
        };
        
        if (message.severity === 2) {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }
    
    return { errors, warnings };
  } catch (e) {
    return { errors: [], warnings: [], parseError: true };
  }
}
```

**5. Quality Scoring**

```javascript
function calculateQualityScore(syntaxErrors, lintErrors, lintWarnings) {
  // Syntax errors = critical
  if (syntaxErrors > 0) {
    return { status: 'FAIL', score: 0, reason: 'Syntax errors present' };
  }
  
  // Lint errors = fail
  if (lintErrors > 0) {
    return { status: 'FAIL', score: 30, reason: `${lintErrors} linting errors` };
  }
  
  // Warnings = pass with warnings
  if (lintWarnings > 0) {
    return { status: 'WARNINGS', score: 70, reason: `${lintWarnings} warnings` };
  }
  
  // All clean
  return { status: 'PASS', score: 100, reason: 'No quality issues detected' };
}
```

**6. Report Section**

```markdown
## Code Quality

**Status:** ${status}
**Score:** ${score}/100

### Syntax Validation
${syntaxErrors === 0 ? '✅' : '❌'} No syntax errors (${syntaxErrors} found)

### Linting ${linter ? `(${linter})` : '(not configured)'}
${lintErrors === 0 ? '✅' : '❌'} Lint checks passed
- Errors: ${lintErrors}
- Warnings: ${lintWarnings}

${errors.length > 0 ? `
### Linting Errors
${errors.slice(0, 10).map(e => `
**File:** ${e.file}:${e.line}:${e.column}  
**Rule:** ${e.rule}  
**Message:** ${e.message}
`).join('\n')}
${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}
` : ''}
```

**Integration with Overall Verification:**
- Syntax errors → FAIL verification
- Lint errors → FAIL verification (configurable with --lenient flag)
- Lint warnings → PASS with warnings (don't block)
- No linter configured → PASS (report as info)

**Quality vs Completeness:**
- Perfect quality + missing features (FR4.1) = FAIL
- Some warnings + all features complete = PASS (with warnings)
- Syntax errors always fail regardless of FR4.1
```

Save changes to subagents/reis_verifier.md
</action>
<verify>
```bash
# Check Step 3 exists
grep -q "Step 3.*Code Quality\|Validate Code Quality" subagents/reis_verifier.md && echo "✅ Step 3 quality checks present"

# Verify syntax validation
grep -q "node --check\|Syntax Validation" subagents/reis_verifier.md && echo "✅ Syntax validation included"

# Check linter detection
grep -q "eslint\|Detect Linter" subagents/reis_verifier.md && echo "✅ Linter detection present"

# Verify quality scoring
grep -q "calculateQualityScore\|Quality Scoring" subagents/reis_verifier.md && echo "✅ Quality scoring logic present"
```
</verify>
<done>
- Step 3 enhanced with code quality checks
- Syntax validation (node --check) for all JS/TS files
- Linter detection (ESLint)
- Linter execution and output parsing
- Quality scoring logic (PASS/WARNINGS/FAIL)
- Report section format defined
- Integration with overall verification status
- Clear distinction: quality ≠ completeness
</done>
</task>

## Success Criteria
- ✅ Step 3 of reis_verifier protocol includes code quality checks
- ✅ Syntax validation detects errors
- ✅ Linter detection and execution (ESLint)
- ✅ Parse linting output (errors vs warnings)
- ✅ Quality scoring: PASS/WARNINGS/FAIL
- ✅ Integration with verification report
- ✅ Clear understanding: quality checks don't replace FR4.1
- ✅ Syntax errors fail verification
- ✅ Warnings don't block verification

## Verification

```bash
# Check Step 3 content
grep -A50 "Step 3.*Code Quality" subagents/reis_verifier.md | head -60

# Verify quality scoring
grep -n "calculateQualityScore" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
