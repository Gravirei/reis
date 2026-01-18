# Plan: 2-4 - Implement Report Generation

## Objective
Define comprehensive verification report generation logic in reis_verifier specification, assembling all verification results into structured reports.

## Context
Steps 2 and 3 have collected test results and success criteria validation data. Now we need to assemble everything into a clear, actionable verification report using the VERIFICATION_REPORT.md template (created in Wave 1.2).

**Key Requirements:**
- Populate all sections of VERIFICATION_REPORT.md template
- Generate executive summary with clear pass/fail determination
- Include detailed test results, success criteria validation, and recommendations
- Save reports to `.planning/verification/{phase-name}/` directory
- Generate timestamped filenames for tracking
- Provide actionable recommendations when verification fails

**Report Inputs:**
- Test results (from Step 2)
- Success criteria validation (from Step 3)
- Code quality checks (from Step 4 - will be added in Phase 3)
- Documentation verification (from Step 5 - will be added in Phase 3)
- Plan context (loaded by verify command)

## Dependencies
- Wave 2.2 (Test Execution) - Need test results
- Wave 2.3 (Success Criteria Validation) - Need criteria validation results

## Tasks

<task type="auto">
<name>Add report generation protocol to reis_verifier</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 6: Generate Report" section in the Seven-Step Verification Protocol with comprehensive report generation instructions.

**Location:** Find "Step 6: Generate Report" in the protocol section.

**Replace/Expand with:**

```markdown
### Step 6: Generate Report

Assemble all verification results into a comprehensive verification report using the VERIFICATION_REPORT.md template.

#### Report Assembly Process

**Inputs from previous steps:**
1. Test results (Step 2) - Test metrics, output, pass/fail status
2. Success criteria validation (Step 3) - Criterion-by-criterion results
3. Code quality checks (Step 4) - Syntax, linting, quality metrics
4. Documentation verification (Step 5) - Doc status, completeness

**Output:**
- Populated VERIFICATION_REPORT.md saved to `.planning/verification/{phase-name}/{timestamp}.md`
- Overall pass/fail/partial determination
- Actionable recommendations

#### Overall Status Determination

Calculate overall verification status from all checks:

```javascript
function calculateOverallStatus(testResults, criteriaResults, qualityResults, docResults) {
  const checks = {
    tests: testResults.status,      // 'passed' | 'failed' | 'warning'
    criteria: calculateCriteriaStatus(criteriaResults),
    quality: qualityResults.status,
    documentation: docResults.status,
  };
  
  // Count failures
  const failures = Object.values(checks).filter(s => s === 'failed').length;
  const warnings = Object.values(checks).filter(s => s === 'warning').length;
  
  if (failures > 0) {
    return {
      status: 'FAILED',
      emoji: '❌',
      summary: `${failures} critical issues found`,
    };
  }
  
  if (warnings > 0) {
    return {
      status: 'PARTIAL',
      emoji: '⚠️',
      summary: `${warnings} warnings found`,
    };
  }
  
  return {
    status: 'PASSED',
    emoji: '✅',
    summary: 'All checks passed',
  };
}

function calculateCriteriaStatus(criteriaResults) {
  const failed = criteriaResults.criteria.filter(c => c.status === 'fail').length;
  const warnings = criteriaResults.criteria.filter(c => c.status === 'warning').length;
  
  if (failed > 0) return 'failed';
  if (warnings > 0) return 'warning';
  return 'passed';
}
```

#### Executive Summary Generation

Create a concise 2-3 sentence summary at the top of the report:

```javascript
function generateExecutiveSummary(overallStatus, testResults, criteriaResults, qualityResults) {
  const parts = [];
  
  // Overall status
  parts.push(`Verification ${overallStatus.status.toLowerCase()}.`);
  
  // Test summary
  if (testResults.metrics.total > 0) {
    if (testResults.metrics.failed === 0) {
      parts.push(`All ${testResults.metrics.passed} tests passed.`);
    } else {
      parts.push(`${testResults.metrics.failed} of ${testResults.metrics.total} tests failed.`);
    }
  } else {
    parts.push('No tests found (warning).');
  }
  
  // Criteria summary
  const criteriaPassed = criteriaResults.criteria.filter(c => c.status === 'pass').length;
  const criteriaTotal = criteriaResults.criteria.length;
  parts.push(`${criteriaPassed}/${criteriaTotal} success criteria met.`);
  
  // Quality issues
  if (qualityResults.issueCount > 0) {
    parts.push(`${qualityResults.issueCount} code quality issues found.`);
  }
  
  return parts.join(' ');
}
```

#### Report Population

Load template and populate all sections:

```javascript
async function generateVerificationReport(verificationData, projectInfo) {
  const fs = require('fs');
  const path = require('path');
  
  // Load template
  const templatePath = path.join(projectInfo.reisRoot, 'templates/VERIFICATION_REPORT.md');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Calculate overall status
  const overallStatus = calculateOverallStatus(
    verificationData.testResults,
    verificationData.criteriaResults,
    verificationData.qualityResults,
    verificationData.docResults
  );
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(
    overallStatus,
    verificationData.testResults,
    verificationData.criteriaResults,
    verificationData.qualityResults
  );
  
  // Replace template variables
  const timestamp = new Date().toISOString();
  const report = template
    .replace(/\[Phase\/Plan Name\]/g, projectInfo.phaseName)
    .replace(/\[ISO 8601 timestamp\]/g, timestamp)
    .replace(/\[Phase number and name\]/g, projectInfo.phaseName)
    .replace(/\[Plan file path\]/g, projectInfo.planPath)
    .replace(/✅ PASSED \| ❌ FAILED \| ⚠️ PARTIAL/g, `${overallStatus.emoji} ${overallStatus.status}`)
    .replace(/\[2-3 sentence summary of verification results\]/g, executiveSummary)
    .replace(/\[Pass\/Fail\/Partial with explanation\]/g, overallStatus.summary);
  
  // Populate Test Results section
  report = populateTestResults(report, verificationData.testResults);
  
  // Populate Success Criteria section
  report = populateSuccessCriteria(report, verificationData.criteriaResults);
  
  // Populate Code Quality section
  report = populateCodeQuality(report, verificationData.qualityResults);
  
  // Populate Documentation section
  report = populateDocumentation(report, verificationData.docResults);
  
  // Generate Recommendations section
  report = generateRecommendations(report, verificationData, overallStatus);
  
  // Add Next Steps
  report = addNextSteps(report, overallStatus);
  
  // Add metadata
  report = addMetadata(report, verificationData, timestamp);
  
  return report;
}
```

#### Section Population Functions

**Test Results Section:**
```javascript
function populateTestResults(report, testResults) {
  const testSection = `
**Test Framework**: ${testResults.framework}
**Tests Run**: ${testResults.metrics.total}
**Tests Passed**: ${testResults.metrics.passed}
**Tests Failed**: ${testResults.metrics.failed}
**Tests Pending**: ${testResults.metrics.pending}
**Coverage**: ${testResults.coverage || 'Not available'}

### Test Output

\`\`\`
${testResults.output.substring(0, 2000)}${testResults.output.length > 2000 ? '...\n[truncated]' : ''}
\`\`\`

### Failed Tests

${testResults.metrics.failed > 0 ? formatFailedTests(testResults.failedTests) : '*No failed tests*'}

**Status**: ${testResults.metrics.failed === 0 ? '✅ All tests pass' : `❌ ${testResults.metrics.failed} tests failing`}
`;
  
  return report.replace(/## Test Results[\s\S]*?(?=\n## )/m, `## Test Results\n\n${testSection}\n`);
}

function formatFailedTests(failedTests) {
  if (!failedTests || failedTests.length === 0) {
    return '*No failed tests*';
  }
  
  return failedTests.map(test => 
    `- ❌ **${test.name}**: ${test.error || 'Failed'}`
  ).join('\n');
}
```

**Success Criteria Section:**
```javascript
function populateSuccessCriteria(report, criteriaResults) {
  const criteriaSection = criteriaResults.criteria.map((criterion, index) => {
    const statusEmoji = criterion.status === 'pass' ? '✅' : criterion.status === 'fail' ? '❌' : '⚠️';
    const statusText = criterion.status.toUpperCase();
    
    return `
### Criterion ${index + 1}: ${criterion.criterion}
**Status**: ${statusEmoji} ${statusText}
**Evidence**: ${criterion.evidence}
**Notes**: ${criterion.notes || 'None'}
`;
  }).join('\n');
  
  const summary = `**Overall**: ${criteriaResults.passed === criteriaResults.totalCriteria ? 
    '✅ All criteria met' : 
    `❌ ${criteriaResults.totalCriteria - criteriaResults.passed} criteria not met`}`;
  
  return report.replace(
    /## Success Criteria Validation[\s\S]*?(?=\n## )/m,
    `## Success Criteria Validation\n\n${criteriaSection}\n${summary}\n`
  );
}
```

**Code Quality Section:**
```javascript
function populateCodeQuality(report, qualityResults) {
  const qualitySection = `
### Syntax Check
**Status**: ${qualityResults.syntax.passed ? '✅ PASS' : '❌ FAIL'}
**Details**: ${qualityResults.syntax.details}

### Linting
**Tool**: ${qualityResults.linting.tool || 'None detected'}
**Status**: ${qualityResults.linting.status || '⚠️ Not configured'}
**Issues Found**: ${qualityResults.linting.issueCount || 0}
**Details**: ${qualityResults.linting.summary || 'N/A'}

### Common Issues
${qualityResults.issues.length > 0 ? qualityResults.issues.map(i => `- ${i}`).join('\n') : '*No issues found*'}

**Overall**: ${qualityResults.issueCount === 0 ? '✅ No quality issues' : `❌ ${qualityResults.issueCount} issues found`}
`;
  
  return report.replace(/## Code Quality[\s\S]*?(?=\n## )/m, `## Code Quality\n\n${qualitySection}\n`);
}
```

**Documentation Section:**
```javascript
function populateDocumentation(report, docResults) {
  const docSection = `
### Required Documents
- ${docResults.readme.exists ? '✅' : '❌'} README.md exists and up-to-date
- ${docResults.changelog.exists ? '✅' : '❌'} CHANGELOG.md updated
- ${docResults.api.exists ? '✅' : '❌'} API documentation (if applicable)
- ${docResults.comments.adequate ? '✅' : '❌'} Code comments adequate

### Documentation Issues
${docResults.issues.length > 0 ? docResults.issues.map(i => `- ${i}`).join('\n') : '*No issues found*'}

### TODO/FIXME Comments
**Found**: ${docResults.todos.count}
**Critical**: ${docResults.todos.critical}
${docResults.todos.critical > 0 ? '\n' + docResults.todos.list.slice(0, 5).map(t => `- ${t}`).join('\n') : ''}

**Overall**: ${docResults.complete ? '✅ Documentation complete' : docResults.issues.length > 0 ? '❌ Missing required docs' : '⚠️ Needs improvement'}
`;
  
  return report.replace(/## Documentation[\s\S]*?(?=\n## )/m, `## Documentation\n\n${docSection}\n`);
}
```

#### Recommendations Generation

Generate actionable recommendations based on findings:

```javascript
function generateRecommendations(report, verificationData, overallStatus) {
  if (overallStatus.status === 'PASSED') {
    // No recommendations needed for passed verification
    return report.replace(/## Recommendations[\s\S]*?(?=\n## )/m, '## Recommendations\n\n*Verification passed - no issues to address.*\n\n');
  }
  
  const recommendations = {
    critical: [],
    warnings: [],
    suggestions: [],
  };
  
  // Failed tests
  if (verificationData.testResults.metrics.failed > 0) {
    recommendations.critical.push(
      `Fix ${verificationData.testResults.metrics.failed} failing tests - see Test Results section for details`
    );
  }
  
  // Failed criteria
  const failedCriteria = verificationData.criteriaResults.criteria.filter(c => c.status === 'fail');
  failedCriteria.forEach(criterion => {
    recommendations.critical.push(`Address criterion: "${criterion.criterion}" - ${criterion.evidence}`);
  });
  
  // Quality issues
  if (verificationData.qualityResults.issueCount > 0) {
    if (verificationData.qualityResults.syntax.passed === false) {
      recommendations.critical.push('Fix syntax errors - code will not run');
    } else {
      recommendations.warnings.push(`Address ${verificationData.qualityResults.issueCount} linting issues`);
    }
  }
  
  // Missing tests
  if (verificationData.testResults.metrics.total === 0) {
    recommendations.warnings.push('Add test coverage to improve verification confidence');
  }
  
  // Documentation issues
  if (!verificationData.docResults.complete) {
    recommendations.warnings.push('Update required documentation (README, CHANGELOG)');
  }
  
  // Partial criteria
  const partialCriteria = verificationData.criteriaResults.criteria.filter(c => c.status === 'warning');
  partialCriteria.forEach(criterion => {
    recommendations.suggestions.push(`Review criterion: "${criterion.criterion}" - ${criterion.notes}`);
  });
  
  const recSection = `
### Critical Issues (Must Fix)
${recommendations.critical.length > 0 ? recommendations.critical.map((r, i) => `${i + 1}. ${r}`).join('\n') : '*None*'}

### Warnings (Should Fix)
${recommendations.warnings.length > 0 ? recommendations.warnings.map((r, i) => `${i + 1}. ${r}`).join('\n') : '*None*'}

### Suggestions (Nice to Have)
${recommendations.suggestions.length > 0 ? recommendations.suggestions.map((r, i) => `${i + 1}. ${r}`).join('\n') : '*None*'}
`;
  
  return report.replace(/## Recommendations[\s\S]*?(?=\n## )/m, `## Recommendations\n\n${recSection}\n`);
}
```

#### Next Steps Section

```javascript
function addNextSteps(report, overallStatus) {
  let nextSteps = '';
  
  if (overallStatus.status === 'PASSED') {
    nextSteps = `
- ✅ Phase/Plan verified successfully
- → Proceed to next phase/plan
- → Update STATE.md with verification status
`;
  } else if (overallStatus.status === 'FAILED') {
    nextSteps = `
- ❌ Verification failed
- → Review and fix critical issues listed above
- → Re-run verification after fixes: \`reis verify <phase/plan>\`
- → Consider running \`reis gap-analyze\` if stuck
`;
  } else {
    nextSteps = `
- ⚠️ Verification partially passed
- → Review warnings and suggestions
- → Decide whether to proceed or fix issues
- → Document decision in STATE.md
`;
  }
  
  return report.replace(/## Next Steps[\s\S]*?(?=\n## )/m, `## Next Steps\n\n${nextSteps}\n`);
}
```

#### Report Saving

Save the report to the correct location with timestamp:

```bash
# Create verification directory
PHASE_NAME=$(echo "$PLAN_PATH" | grep -oP 'phase-\d+-[a-z-]+' | head -1)
VERIFICATION_DIR=".planning/verification/$PHASE_NAME"
mkdir -p "$VERIFICATION_DIR"

# Generate timestamp filename
TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
REPORT_FILE="$VERIFICATION_DIR/$TIMESTAMP.md"

# Write report
cat > "$REPORT_FILE" << 'EOF'
[populated report content]
EOF

echo "✅ Verification report saved to: $REPORT_FILE"
```

#### Report Validation

Verify the generated report is complete:

```javascript
function validateReport(report) {
  const requiredSections = [
    '# Verification Report:',
    '## Executive Summary',
    '## Test Results',
    '## Success Criteria Validation',
    '## Code Quality',
    '## Documentation',
    '## Recommendations',
    '## Next Steps',
    '## Verification Metadata',
  ];
  
  const missing = requiredSections.filter(section => !report.includes(section));
  
  if (missing.length > 0) {
    console.error('⚠️ Report missing sections:', missing);
    return false;
  }
  
  // Check for placeholder variables
  if (report.includes('[') && report.includes(']')) {
    const placeholders = report.match(/\[[^\]]+\]/g);
    if (placeholders) {
      console.warn('⚠️ Unpopulated placeholders:', placeholders);
    }
  }
  
  return true;
}
```

#### Metadata Addition

Add verification metadata at the end:

```javascript
function addMetadata(report, verificationData, timestamp) {
  const duration = verificationData.endTime - verificationData.startTime;
  const durationSeconds = (duration / 1000).toFixed(1);
  
  const metadata = `
**Verifier Version**: REIS v${verificationData.reisVersion}
**Generated By**: reis_verifier
**Verification Duration**: ${durationSeconds}s
**Report Location**: \`${verificationData.reportPath}\`
`;
  
  return report.replace(
    /## Verification Metadata[\s\S]*?(?=\n---|\z)/m,
    `## Verification Metadata\n\n${metadata}\n`
  );
}
```

#### Best Practices

1. **Clear status indicators** - Use ✅/❌/⚠️ consistently
2. **Actionable recommendations** - Tell developers exactly what to fix
3. **Evidence-based** - Include specific file paths, line numbers, counts
4. **Scannable format** - Use headers, bullets, short paragraphs
5. **Complete but concise** - Include all data but truncate very long outputs
6. **Timestamped filenames** - Enable tracking multiple verification runs
7. **Link to sources** - Reference test output, files checked, commands run

#### Example Complete Report

See `.planning/verifier-project/examples/example-verification-report.md` for a complete example of a populated report.
```

**Key Points:**
- Complete report generation pipeline from data to saved file
- All template sections populated with real data
- Overall status calculation from multiple checks
- Actionable recommendations generated automatically
- Reports saved with timestamps for tracking
- Report validation ensures completeness
- Integration with all previous steps (2, 3, 4, 5)

</action>
<verify>
```bash
# Verify Step 6 section added
grep -q "### Step 6: Generate Report" subagents/reis_verifier.md && echo "✅ Step 6 section present"

# Check for key components
grep -q "Report Assembly Process" subagents/reis_verifier.md && echo "✅ Assembly process documented"
grep -q "Overall Status Determination" subagents/reis_verifier.md && echo "✅ Status calculation present"
grep -q "Executive Summary Generation" subagents/reis_verifier.md && echo "✅ Summary generation included"
grep -q "generateVerificationReport" subagents/reis_verifier.md && echo "✅ Main function present"

# Verify section population functions
grep -q "populateTestResults\|populateSuccessCriteria\|populateCodeQuality" subagents/reis_verifier.md && echo "✅ Population functions included"

# Check for recommendations generation
grep -q "generateRecommendations" subagents/reis_verifier.md && echo "✅ Recommendations logic present"

# Verify report saving logic
grep -q "VERIFICATION_DIR\|mkdir -p" subagents/reis_verifier.md && echo "✅ Report saving documented"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive report generation protocol
- Report Assembly Process with inputs from all verification steps
- Overall Status Determination logic (PASSED/FAILED/PARTIAL)
- Executive Summary Generation with concise summaries
- Report Population with complete generateVerificationReport function
- Section Population Functions for tests, criteria, quality, documentation
- Recommendations Generation with critical/warnings/suggestions categories
- Next Steps Section with context-specific guidance
- Report Saving with timestamped filenames and directory creation
- Report Validation to ensure completeness
- Metadata Addition for tracking
- Best Practices and complete example reference
- Section is ~250-300 lines with executable code
</done>
</task>

## Success Criteria
- ✅ Step 6 (Generate Report) in reis_verifier.md fully documented
- ✅ Overall status determination from multiple checks (tests, criteria, quality, docs)
- ✅ Executive summary generation with clear pass/fail determination
- ✅ All template sections populated (tests, criteria, quality, docs, recommendations, next steps)
- ✅ Actionable recommendations generated based on findings
- ✅ Reports saved to `.planning/verification/{phase-name}/{timestamp}.md`
- ✅ Report validation ensures completeness
- ✅ Metadata tracking included (version, duration, location)
- ✅ Complete JavaScript functions and bash commands provided
- ✅ Integration with all previous verification steps (2, 3, 4, 5)

## Verification

```bash
# Check Step 6 section
grep -A100 "### Step 6: Generate Report" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "calculateOverallStatus" subagents/reis_verifier.md && echo "✅ Status calculation function"
grep -q "generateExecutiveSummary" subagents/reis_verifier.md && echo "✅ Summary generation function"
grep -q "generateVerificationReport" subagents/reis_verifier.md && echo "✅ Main generation function"
grep -q "populateTestResults" subagents/reis_verifier.md && echo "✅ Test results population"
grep -q "generateRecommendations" subagents/reis_verifier.md && echo "✅ Recommendations generation"

# Count functions
grep -c "^function " subagents/reis_verifier.md

# Verify structure
grep "^### Step" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
