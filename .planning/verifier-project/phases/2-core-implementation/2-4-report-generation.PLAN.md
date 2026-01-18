# Plan: 2-4 - Implement Report Generation with FR4.1

## Objective
Implement Step 6 of the verification protocol: generate comprehensive VERIFICATION_REPORT.md including the FR4.1 Feature Completeness section.

## Context
The verification report consolidates all verification results (tests, feature completeness, success criteria, quality) into a single, actionable document. The FR4.1 Feature Completeness section is CRITICAL and must be prominently displayed.

**Report Structure:**
1. Executive Summary (overall pass/fail, key metrics including FR4.1)
2. **Feature Completeness (FR4.1) - PROMINENTLY PLACED**
3. Test Results
4. Success Criteria Validation
5. Code Quality
6. Documentation
7. Issues Summary
8. Recommendations
9. Next Steps

**FR4.1 Integration:**
- Feature Completeness section appears SECOND (right after executive summary)
- Task-by-task breakdown with evidence/missing deliverables
- Completion percentage prominently displayed
- Clear impact assessment
- Specific recommendations for incomplete tasks

## Dependencies
- Wave 2.2 (Test execution results)
- Wave 2.3 (Success criteria and FR4.1 completeness data)

## Tasks

<task type="auto">
<name>Add report generation section to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Enhance Step 6 of the verification protocol with comprehensive report generation logic, including FR4.1 Feature Completeness section.

**Locate:** Find "Step 6: Generate Report" in the verification protocol.

**Enhance with:**

```markdown
### Step 6: Generate Verification Report

**Objective:** Consolidate all verification results into VERIFICATION_REPORT.md with clear pass/fail determination.

**Process:**

**1. Load Report Template**

```javascript
const templatePath = 'templates/VERIFICATION_REPORT.md';
const template = fs.readFileSync(templatePath, 'utf8');
```

**2. Prepare Report Data**

Collect all verification results from previous steps:

```javascript
const reportData = {
  metadata: {
    phaseName: extractPhaseName(planPath),
    planName: extractPlanName(planPath),
    timestamp: new Date().toISOString(),
    verifierVersion: '1.0.0'
  },
  
  // Step 2: Test results
  tests: testResults,
  
  // Step 4A: Feature completeness (FR4.1)
  featureCompleteness: {
    status: completenessData.status, // PASS/FAIL
    percentage: completenessData.percentage,
    total: completenessData.total,
    complete: completenessData.complete,
    incomplete: completenessData.incomplete,
    tasks: tasksWithEvidenceAndMissing
  },
  
  // Step 4B: Success criteria
  successCriteria: {
    status: criteriaStatus,
    total: criteria.length,
    met: metCriteria.length,
    unmet: unmetCriteria.length,
    criteria: criteriaWithEvidence
  },
  
  // Step 3: Code quality
  codeQuality: qualityResults,
  
  // Step 5: Documentation
  documentation: docResults,
  
  // Derived: Overall status
  overallStatus: calculateOverallStatus(testResults, completenessData, criteriaStatus, qualityResults)
};
```

**3. Calculate Overall Status**

```javascript
function calculateOverallStatus(tests, completeness, criteria, quality) {
  // CRITICAL: Feature completeness MUST be 100% to pass
  if (completeness.percentage < 100) {
    return {
      status: 'FAIL',
      reason: `Feature completeness: ${completeness.percentage}% (${completeness.incomplete} tasks incomplete)`
    };
  }
  
  // Tests must pass
  if (tests.metrics.failed > 0) {
    return {
      status: 'FAIL',
      reason: `${tests.metrics.failed} tests failing`
    };
  }
  
  // Success criteria must be met
  if (criteria.unmet > 0) {
    return {
      status: 'FAIL',
      reason: `${criteria.unmet} success criteria unmet`
    };
  }
  
  // Code quality failures block
  if (quality.status === 'FAIL') {
    return {
      status: 'FAIL',
      reason: 'Code quality failures detected'
    };
  }
  
  // Warnings don't block (unless strict mode)
  if (quality.status === 'WARNINGS' || tests.metrics.total === 0) {
    return {
      status: 'PASS_WITH_WARNINGS',
      warnings: [
        quality.status === 'WARNINGS' ? 'Code quality warnings' : null,
        tests.metrics.total === 0 ? 'No tests configured' : null
      ].filter(Boolean)
    };
  }
  
  // All checks passed
  return {
    status: 'PASS',
    reason: 'All verification checks passed'
  };
}
```

**4. Generate Executive Summary**

```javascript
function generateExecutiveSummary(reportData) {
  const { overallStatus, tests, featureCompleteness, successCriteria, codeQuality } = reportData;
  
  const emoji = overallStatus.status === 'PASS' ? '✅' : 
                overallStatus.status === 'PASS_WITH_WARNINGS' ? '⚠️' : '❌';
  
  return `
## Executive Summary

Verification ${overallStatus.status === 'PASS' ? 'PASSED' : 'FAILED'} for ${reportData.metadata.phaseName}.

**Overall Status:** ${emoji} ${overallStatus.status}  
**Tests:** ${tests.metrics.passed}/${tests.metrics.total} passed  
**Feature Completeness:** ${featureCompleteness.complete}/${featureCompleteness.total} tasks (${featureCompleteness.percentage}%)  
**Success Criteria:** ${successCriteria.met}/${successCriteria.total} met  
**Code Quality:** ${codeQuality.status}  
**Critical Issues:** ${countCriticalIssues(reportData)}

${overallStatus.reason ? `**Reason:** ${overallStatus.reason}` : ''}

${overallStatus.status !== 'PASS' ? `
**Action Required:** Address issues below and re-verify before proceeding.
` : `
**Result:** All verification checks passed. Ready to proceed to next phase.
`}
`;
}
```

**5. Generate Feature Completeness Section (FR4.1) - CRITICAL**

```javascript
function generateFeatureCompletenessSection(featureCompleteness) {
  const { status, percentage, complete, total, tasks } = featureCompleteness;
  
  const emoji = percentage === 100 ? '✅' : '❌';
  
  let section = `
## Feature Completeness (FR4.1)

**Status:** ${emoji} ${status} (${percentage}%)  
**Tasks Completed:** ${complete}/${total}

### Task-by-Task Analysis

`;

  for (const task of tasks) {
    const taskEmoji = task.status === 'COMPLETE' ? '✅' : '❌';
    
    section += `
#### ${taskEmoji} Task: ${task.name}

**Status:** ${task.status}

`;

    if (task.status === 'COMPLETE') {
      section += `**Evidence:**\n`;
      for (const evidence of task.evidence) {
        const { deliverable, location, confidence } = evidence;
        const confidencePercent = Math.round(confidence * 100);
        section += `- ${deliverable.type}: \`${location}\` (confidence: ${confidencePercent}%)\n`;
      }
    } else {
      section += `**Status:** INCOMPLETE - FEATURE MISSING\n\n`;
      section += `**Missing Deliverables:**\n`;
      
      for (const missing of task.missing) {
        const { deliverable, searchAttempts } = missing;
        const name = deliverable.name || deliverable.path;
        section += `- ${deliverable.type}: \`${name}\` NOT FOUND\n`;
      }
      
      // Add search evidence
      section += `\n**Search Evidence:**\n\`\`\`bash\n`;
      for (const attempt of task.missing[0]?.searchAttempts || []) {
        section += `$ ${attempt.method}: ${attempt.pattern}\n`;
        section += `# ${attempt.result ? 'Found' : 'No matches'}\n`;
      }
      section += `\`\`\`\n\n`;
      
      // Impact assessment
      const impact = assessTaskImpact(task);
      section += `**Impact:** ${impact.level} - ${impact.description}\n`;
      
      // Recommendation
      const recommendation = getTaskRecommendation(task);
      section += `**Recommendation:** ${recommendation}\n`;
    }
    
    section += `\n`;
  }
  
  return section;
}

function assessTaskImpact(task) {
  // Heuristics for impact assessment
  const keywords = task.name.toLowerCase();
  
  if (keywords.includes('auth') || keywords.includes('security') || keywords.includes('login')) {
    return { level: 'HIGH', description: 'Critical security/authentication feature missing' };
  }
  
  if (keywords.includes('api') || keywords.includes('endpoint') || keywords.includes('route')) {
    return { level: 'HIGH', description: 'Core API functionality missing' };
  }
  
  if (keywords.includes('test') || keywords.includes('validation')) {
    return { level: 'MEDIUM', description: 'Testing/validation incomplete' };
  }
  
  if (keywords.includes('doc') || keywords.includes('readme')) {
    return { level: 'LOW', description: 'Documentation incomplete' };
  }
  
  return { level: 'MEDIUM', description: 'Planned feature not implemented' };
}

function getTaskRecommendation(task) {
  const missingTypes = [...new Set(task.missing.map(m => m.deliverable.type))];
  
  if (missingTypes.includes('file')) {
    return `Implement missing file(s): ${task.missing.filter(m => m.deliverable.type === 'file').map(m => m.deliverable.path).join(', ')}`;
  }
  
  if (missingTypes.includes('function')) {
    return `Implement missing function(s): ${task.missing.filter(m => m.deliverable.type === 'function').map(m => m.deliverable.name).join(', ')}`;
  }
  
  return `Complete task implementation as specified in PLAN.md`;
}
```

**6. Generate Other Sections**

(Test Results, Success Criteria, Code Quality, Documentation sections follow similar pattern - populate template with data)

**7. Generate Issues Summary**

```javascript
function generateIssuesSummary(reportData) {
  const issues = {
    critical: [],
    major: [],
    minor: []
  };
  
  // Feature completeness issues (CRITICAL)
  if (reportData.featureCompleteness.percentage < 100) {
    for (const task of reportData.featureCompleteness.tasks) {
      if (task.status === 'INCOMPLETE') {
        issues.critical.push({
          type: 'INCOMPLETE_TASK',
          description: `Task incomplete: ${task.name}`,
          impact: assessTaskImpact(task).level,
          task: task
        });
      }
    }
  }
  
  // Test failures (CRITICAL)
  if (reportData.tests.metrics.failed > 0) {
    for (const failure of reportData.tests.failures) {
      issues.critical.push({
        type: 'TEST_FAILURE',
        description: `Test failing: ${failure.name}`,
        file: failure.file,
        error: failure.error
      });
    }
  }
  
  // Unmet success criteria (MAJOR)
  for (const criterion of reportData.successCriteria.criteria) {
    if (!criterion.met) {
      issues.major.push({
        type: 'UNMET_CRITERION',
        description: criterion.text,
        evidence: criterion.evidence
      });
    }
  }
  
  // Code quality issues
  if (reportData.codeQuality.errors?.length > 0) {
    issues.major.push(...reportData.codeQuality.errors.map(e => ({
      type: 'QUALITY_ERROR',
      description: e
    })));
  }
  
  if (reportData.codeQuality.warnings?.length > 0) {
    issues.minor.push(...reportData.codeQuality.warnings.map(w => ({
      type: 'QUALITY_WARNING',
      description: w
    })));
  }
  
  return issues;
}
```

**8. Generate Recommendations**

```javascript
function generateRecommendations(reportData, issues) {
  const recommendations = {
    immediate: [],
    beforeNext: [],
    optional: []
  };
  
  // Immediate: Fix incomplete tasks
  if (issues.critical.filter(i => i.type === 'INCOMPLETE_TASK').length > 0) {
    recommendations.immediate.push(
      'Complete all planned tasks before proceeding (Feature Completeness: 100% required)'
    );
    
    for (const issue of issues.critical.filter(i => i.type === 'INCOMPLETE_TASK')) {
      recommendations.immediate.push(
        `- ${issue.description}: ${getTaskRecommendation(issue.task)}`
      );
    }
  }
  
  // Immediate: Fix test failures
  if (issues.critical.filter(i => i.type === 'TEST_FAILURE').length > 0) {
    recommendations.immediate.push('Fix all failing tests');
  }
  
  // Before next: Meet success criteria
  if (issues.major.filter(i => i.type === 'UNMET_CRITERION').length > 0) {
    recommendations.beforeNext.push('Satisfy all success criteria from PLAN.md');
  }
  
  // Optional: Address warnings
  if (issues.minor.length > 0) {
    recommendations.optional.push('Address code quality warnings');
  }
  
  if (reportData.tests.metrics.total === 0) {
    recommendations.optional.push('Add test suite for better validation');
  }
  
  return recommendations;
}
```

**9. Write Report to File**

```javascript
function writeReport(reportContent, reportData) {
  // Create directory if needed
  const reportDir = `.planning/verification/${reportData.metadata.phaseName}`;
  fs.mkdirSync(reportDir, { recursive: true });
  
  // Generate filename
  const timestamp = reportData.metadata.timestamp.replace(/:/g, '-').split('.')[0];
  const reportPath = `${reportDir}/VERIFICATION_REPORT_${timestamp}.md`;
  
  // Write file
  fs.writeFileSync(reportPath, reportContent, 'utf8');
  
  // Also create/update latest symlink
  const latestPath = `${reportDir}/VERIFICATION_REPORT.md`;
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath);
  }
  fs.writeFileSync(latestPath, reportContent, 'utf8');
  
  return reportPath;
}
```

**Report Generation Order:**
1. Executive Summary (with FR4.1 metrics)
2. **Feature Completeness (FR4.1) - SECOND, PROMINENT**
3. Test Results
4. Success Criteria Validation
5. Code Quality
6. Documentation
7. Issues Summary
8. Recommendations
9. Next Steps

**Critical Rules:**
- ✅ Feature Completeness appears EARLY (right after summary)
- ✅ Task-by-task breakdown with evidence
- ✅ Missing deliverables clearly listed
- ✅ Impact assessment for incomplete tasks
- ✅ Specific, actionable recommendations
- ✅ Clear PASS/FAIL determination
- ❌ Don't bury FR4.1 results at end
- ❌ Don't pass if any task incomplete
```

Save changes to subagents/reis_verifier.md
</action>
<verify>
```bash
# Check Step 6 was enhanced
grep -q "Step 6.*Generate Report\|Generate.*Report" subagents/reis_verifier.md && echo "✅ Step 6 report generation present"

# Verify FR4.1 section generation
grep -q "generateFeatureCompletenessSection\|Feature Completeness.*FR4.1" subagents/reis_verifier.md && echo "✅ FR4.1 section generation present"

# Check overall status calculation
grep -q "calculateOverallStatus\|overallStatus" subagents/reis_verifier.md && echo "✅ Overall status calculation present"

# Verify executive summary
grep -q "generateExecutiveSummary\|Executive Summary" subagents/reis_verifier.md && echo "✅ Executive summary generation present"

# Check recommendations logic
grep -q "generateRecommendations\|recommendations" subagents/reis_verifier.md && echo "✅ Recommendations logic present"

wc -l subagents/reis_verifier.md
```
</verify>
<done>
- Step 6 enhanced with comprehensive report generation
- Executive Summary includes FR4.1 metrics
- Feature Completeness section generates task-by-task breakdown
- Evidence display for complete tasks
- Missing deliverables list for incomplete tasks
- Impact assessment and recommendations per task
- Overall status calculation (100% completeness required)
- Issues summary categorizes by severity
- Recommendations are specific and actionable
- Report written to .planning/verification/{phase}/ directory
- FR4.1 section prominently placed (second, after exec summary)
</done>
</task>

<task type="auto">
<name>Add report generation example to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Add a comprehensive example showing full report generation with FR4.1 to the Examples section.

**Add to Examples Section:**

```markdown
### Example 3: Complete Verification with FR4.1

**Scenario:** Verify Phase 2 plan with 3 tasks, 2 complete, 1 incomplete

**Input:** PLAN.md with tasks:
1. Task 1: Build User Login (COMPLETE)
2. Task 2: Build Password Reset (INCOMPLETE - FR4.1 DETECTS)
3. Task 3: Build Profile Page (COMPLETE)

**Verification Results:**

**Tests:**
- Total: 17/18 passed (1 failing: password reset test)

**Feature Completeness (FR4.1):**
- Task 1: ✅ COMPLETE
  - File: src/auth/login.js found
  - Function: authenticateUser() found at line 15
  - Test: test/auth/login.test.js found
  
- Task 2: ❌ INCOMPLETE
  - File: src/auth/password-reset.js NOT FOUND
  - Function: sendResetEmail() NOT FOUND
  - Test: test/auth/password-reset.test.js NOT FOUND
  
- Task 3: ✅ COMPLETE
  - File: src/pages/profile.js found
  - Component: ProfilePage found at line 10

**Completion:** 2/3 tasks (66%) → FAIL

**Generated Report:**

\`\`\`markdown
# Verification Report: Phase 2 - Core Implementation

**Date:** 2024-01-15T14:30:00Z  
**Verified By:** reis_verifier v1.0  
**Status:** ❌ FAILED

---

## Executive Summary

Verification FAILED for Phase 2 - Core Implementation.

**Overall Status:** ❌ FAIL  
**Tests:** 17/18 passed  
**Feature Completeness:** 2/3 tasks (66%)  
**Success Criteria:** 5/6 met  
**Code Quality:** PASS  
**Critical Issues:** 2

**Reason:** Feature completeness: 66% (1 task incomplete)

**Action Required:** Address issues below and re-verify before proceeding.

---

## Feature Completeness (FR4.1)

**Status:** ❌ INCOMPLETE (66%)  
**Tasks Completed:** 2/3

### Task-by-Task Analysis

#### ✅ Task: Build User Login

**Status:** COMPLETE

**Evidence:**
- file: \`src/auth/login.js\` (confidence: 100%)
- function: \`src/auth/login.js:15\` (confidence: 90%)
- test: \`test/auth/login.test.js\` (confidence: 100%)

#### ❌ Task: Build Password Reset

**Status:** INCOMPLETE - FEATURE MISSING

**Missing Deliverables:**
- file: \`src/auth/password-reset.js\` NOT FOUND
- function: \`sendResetEmail\` NOT FOUND
- test: \`test/auth/password-reset.test.js\` NOT FOUND

**Search Evidence:**
\`\`\`bash
$ fs.existsSync: src/auth/password-reset.js
# No matches

$ grep -r "sendResetEmail" src/
# No matches

$ git ls-files | grep "password-reset"
# No matches
\`\`\`

**Impact:** HIGH - Critical authentication feature missing  
**Recommendation:** Implement missing file: src/auth/password-reset.js

#### ✅ Task: Build Profile Page

**Status:** COMPLETE

**Evidence:**
- file: \`src/pages/profile.js\` (confidence: 100%)
- component: \`src/pages/profile.js:10\` (confidence: 90%)

---

## Test Results

**Status:** ❌ 1 test failing  
**Framework:** Jest

**Metrics:**
- Total: 18
- Passed: 17 ✅
- Failed: 1 ❌

### Failed Tests

**Test:** sends reset email  
**File:** test/auth/password-reset.test.js:15  
**Error:** Function 'sendResetEmail' is not defined

**Analysis:** This test failure is directly related to incomplete Task 2 (FR4.1 detected).

---

## Issues Summary

### Critical Issues (2)

1. **INCOMPLETE_TASK:** Task incomplete: Build Password Reset
   - Impact: HIGH
   - Missing: src/auth/password-reset.js, sendResetEmail()

2. **TEST_FAILURE:** Test failing: sends reset email
   - Related to incomplete Task 2

---

## Recommendations

**Immediate Actions Required:**
1. Complete all planned tasks before proceeding (Feature Completeness: 100% required)
   - Build Password Reset: Implement missing file: src/auth/password-reset.js

2. Fix all failing tests
   - The test failure is caused by incomplete Task 2

**Before Proceeding to Next Phase:**
- All 3 tasks must be 100% complete
- All 18 tests must pass
- Verify password reset functionality works end-to-end

---

## Next Steps

❌ FAILED → Fix issues above and re-verify

**Re-verification Command:**
\`\`\`bash
reis verify phase-2
\`\`\`

After implementing password reset feature, re-run verification to confirm 100% task completion.

---

**Verification Complete**  
*Report generated by reis_verifier v1.0*
\`\`\`

**Key Takeaways:**
1. FR4.1 detected missing feature (Task 2 incomplete)
2. Test failure correlated with missing feature
3. Clear 66% vs 100% completion shown
4. Specific recommendations provided
5. Verification correctly failed (<100% completeness)
```

**Learning Points:**
- FR4.1 catches incomplete implementations
- Tests alone don't guarantee completeness
- Report clearly shows what's missing
- Actionable recommendations guide fixes
- Re-verification validates fixes
</action>
<verify>
```bash
# Check example was added
grep -q "Example 3.*Complete Verification\|Verification with FR4.1" subagents/reis_verifier.md && echo "✅ FR4.1 example added"

# Verify it shows incomplete task
grep -A50 "Example 3" subagents/reis_verifier.md | grep -q "INCOMPLETE\|66%" && echo "✅ Shows incomplete scenario"

# Check for full report
grep -A100 "Example 3" subagents/reis_verifier.md | grep -q "Feature Completeness.*FR4.1" && echo "✅ Full report example present"
```
</verify>
<done>
- Example 3 added showing complete verification with FR4.1
- Demonstrates 3-task scenario with 1 incomplete
- Shows full report generation with all sections
- Feature Completeness section prominently displayed
- Task-by-task breakdown with evidence and missing items
- Correlates test failure with incomplete task
- Shows 66% completion triggering FAIL status
- Includes actionable recommendations
- Demonstrates re-verification workflow
</done>
</task>

## Success Criteria
- ✅ Step 6 enhanced with comprehensive report generation
- ✅ Executive Summary includes FR4.1 completeness metrics
- ✅ Feature Completeness section generates second (prominently placed)
- ✅ Task-by-task breakdown with evidence for complete tasks
- ✅ Missing deliverables list with search evidence for incomplete tasks
- ✅ Impact assessment logic (HIGH/MEDIUM/LOW)
- ✅ Recommendation generation per incomplete task
- ✅ Overall status calculation requires 100% task completion
- ✅ Issues summary categorizes by severity
- ✅ Report written to .planning/verification/{phase}/ directory
- ✅ Complete example demonstrates FR4.1 detection of incomplete task

## Verification

```bash
# Check Step 6 content
grep -A80 "Step 6.*Generate Report" subagents/reis_verifier.md | head -100

# Verify FR4.1 section generation
grep -n "generateFeatureCompletenessSection" subagents/reis_verifier.md

# Check overall status calculation
grep -n "calculateOverallStatus" subagents/reis_verifier.md

# Verify example
grep -A150 "Example 3.*Complete Verification" subagents/reis_verifier.md | head -160
```

---

*This plan will be executed by reis_executor in a fresh context.*
