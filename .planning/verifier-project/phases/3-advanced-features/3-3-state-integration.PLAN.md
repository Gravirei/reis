# Plan: 3-3 - Implement STATE.md Integration

## Objective
Implement Step 7 of the verification protocol: update STATE.md with verification results including FR4.1 feature completeness metrics.

## Context
STATE.md tracking is the final step in verification. It records verification history, including FR4.1 task completion percentages, for project tracking and iteration planning.

**Key Requirements:**
- Read current STATE.md without corruption
- Add verification entry with FR4.1 metrics
- Update phase status if verification passed
- Preserve existing state data
- Handle missing STATE.md

## Dependencies
- Wave 2.4 (Report generation with FR4.1 data)

## Tasks

<task type="auto">
<name>Add STATE.md integration section to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Enhance Step 7 of the verification protocol with STATE.md update logic.

**Locate:** Find "Step 7: Update STATE.md" in the protocol.

**Enhance with:**

```markdown
### Step 7: Update STATE.md

**Objective:** Record verification results in STATE.md for project tracking and history.

**Process:**

**1. Read Current STATE.md**

```javascript
function readStateFile() {
  const statePath = '.planning/STATE.md';
  
  if (!fs.existsSync(statePath)) {
    // Create new STATE.md
    return {
      exists: false,
      content: generateNewState(),
      verificationHistory: []
    };
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  
  return {
    exists: true,
    content: content,
    verificationHistory: parseVerificationHistory(content)
  };
}

function generateNewState() {
  return `# Project State

## Current Phase
Phase: TBD
Status: In Progress

## Verification History

(No verifications yet)

---
*STATE.md tracks project progress and verification results*
`;
}
```

**2. Parse Existing Verification History**

```javascript
function parseVerificationHistory(content) {
  const history = [];
  const historySection = content.match(/## Verification History\n([\s\S]*?)(?=\n##|$)/);
  
  if (!historySection) {
    return history;
  }
  
  const entries = historySection[1].match(/### Verification:[\s\S]*?(?=\n###|\n---|\n##|$)/g) || [];
  
  for (const entry of entries) {
    const dateMatch = entry.match(/\*\*Date:\*\* (.+)/);
    const statusMatch = entry.match(/\*\*Status:\*\* (.+)/);
    
    history.push({
      date: dateMatch ? dateMatch[1] : 'Unknown',
      status: statusMatch ? statusMatch[1] : 'Unknown',
      entry: entry
    });
  }
  
  return history;
}
```

**3. Load Verification Entry Template**

```javascript
const entryTemplate = fs.readFileSync('templates/STATE_VERIFICATION_ENTRY.md', 'utf8');
```

**4. Populate Template with Results**

```javascript
function generateVerificationEntry(verificationResults) {
  const { metadata, overallStatus, tests, featureCompleteness, successCriteria, codeQuality, issues } = verificationResults;
  
  let entry = `### Verification: ${metadata.phaseName}\n`;
  entry += `**Date:** ${metadata.timestamp}\n`;
  entry += `**Status:** ${overallStatus.status}\n`;
  entry += `**Verifier:** reis_verifier v${metadata.verifierVersion}\n\n`;
  
  entry += `**Results:**\n`;
  entry += `- Tests: ${tests.metrics.passed}/${tests.metrics.total} passed\n`;
  entry += `- Feature Completeness: ${featureCompleteness.complete}/${featureCompleteness.total} tasks (${featureCompleteness.percentage}%)\n`;
  entry += `- Success Criteria: ${successCriteria.met}/${successCriteria.total} met\n`;
  entry += `- Code Quality: ${codeQuality.status}\n\n`;
  
  const criticalCount = issues.critical.length;
  const majorCount = issues.major.length;
  const minorCount = issues.minor.length;
  entry += `**Issues:** ${criticalCount} critical, ${majorCount} major, ${minorCount} minor\n\n`;
  
  const reportPath = `.planning/verification/${metadata.phaseName}/VERIFICATION_REPORT.md`;
  entry += `**Report:** \`${reportPath}\`\n\n`;
  
  if (overallStatus.status === 'FAIL') {
    entry += `**Action Required:** Fix issues and re-verify before proceeding\n`;
    
    // Highlight FR4.1 issues if present
    if (featureCompleteness.percentage < 100) {
      entry += `- **Feature Completeness:** ${featureCompleteness.incomplete} tasks incomplete\n`;
    }
  } else if (overallStatus.status === 'PASS') {
    entry += `**Next Phase:** Ready to proceed\n`;
  } else if (overallStatus.status === 'PASS_WITH_WARNINGS') {
    entry += `**Note:** Passed with warnings (see report)\n`;
  }
  
  return entry;
}
```

**5. Insert Entry into STATE.md**

```javascript
function insertVerificationEntry(stateContent, newEntry) {
  // Find Verification History section
  const historyMarker = '## Verification History';
  
  if (!stateContent.includes(historyMarker)) {
    // Add section if missing
    stateContent += `\n\n${historyMarker}\n\n`;
  }
  
  // Find insertion point (after "## Verification History")
  const sections = stateContent.split(/\n##\s+/);
  let updated = '';
  
  for (let i = 0; i < sections.length; i++) {
    if (i > 0) updated += '\n## ';
    
    if (sections[i].startsWith('Verification History')) {
      // Insert new entry at top of this section
      const existingContent = sections[i].replace(/^Verification History\n+/, '');
      updated += 'Verification History\n\n';
      updated += newEntry + '\n\n';
      updated += (existingContent.trim() === '(No verifications yet)' ? '' : existingContent);
    } else {
      updated += sections[i];
    }
  }
  
  return updated;
}
```

**6. Update Phase Status (if verification passed)**

```javascript
function updatePhaseStatus(stateContent, phaseName, verificationPassed) {
  if (!verificationPassed) {
    return stateContent; // Don't update if verification failed
  }
  
  // Find Current Phase section
  const phaseRegex = /## Current Phase\n([\s\S]*?)(?=\n##|$)/;
  const match = stateContent.match(phaseRegex);
  
  if (!match) {
    return stateContent; // No phase section to update
  }
  
  let phaseSection = match[1];
  
  // Update status to "Verified"
  phaseSection = phaseSection.replace(
    /Status: .+/,
    `Status: Verified ✅`
  );
  
  // Add verified timestamp
  if (!phaseSection.includes('Verified:')) {
    phaseSection += `\nVerified: ${new Date().toISOString()}\n`;
  }
  
  return stateContent.replace(phaseRegex, `## Current Phase\n${phaseSection}\n`);
}
```

**7. Write Updated STATE.md**

```javascript
function updateStateFile(verificationResults) {
  // Read current state
  const state = readStateFile();
  
  // Generate verification entry
  const entry = generateVerificationEntry(verificationResults);
  
  // Insert entry
  let updatedContent = state.exists ? state.content : generateNewState();
  updatedContent = insertVerificationEntry(updatedContent, entry);
  
  // Update phase status if passed
  if (verificationResults.overallStatus.status === 'PASS') {
    updatedContent = updatePhaseStatus(
      updatedContent,
      verificationResults.metadata.phaseName,
      true
    );
  }
  
  // Write back
  fs.writeFileSync('.planning/STATE.md', updatedContent, 'utf8');
  
  console.log('✅ STATE.md updated with verification results');
}
```

**Integration Notes:**

- Always preserve existing STATE.md content
- Add new verification entries at TOP of history (most recent first)
- Include FR4.1 task completion percentage in entry
- Only update phase status to "Verified" if verification PASSED
- Handle missing STATE.md by creating new one
- Never corrupt or lose existing state data

**FR4.1 in STATE.md:**

Each verification entry MUST include feature completeness metrics:
```
**Results:**
- Tests: 17/18 passed
- Feature Completeness: 2/3 tasks (66%)  ← FR4.1 metric
- Success Criteria: 5/6 met
- Code Quality: PASS
```

This allows tracking completion progress across iterations.

**Example STATE.md Entry:**

```markdown
### Verification: Phase 2 - Core Implementation
**Date:** 2024-01-15T14:30:00Z  
**Status:** FAIL  
**Verifier:** reis_verifier v1.0

**Results:**
- Tests: 17/18 passed
- Feature Completeness: 2/3 tasks (66%)
- Success Criteria: 5/6 met
- Code Quality: PASS

**Issues:** 2 critical, 1 major, 3 minor

**Report:** `.planning/verification/phase-2-core-implementation/VERIFICATION_REPORT.md`

**Action Required:** Fix issues and re-verify before proceeding
- **Feature Completeness:** 1 tasks incomplete

---

### Verification: Phase 2 - Core Implementation (Re-verification)
**Date:** 2024-01-15T16:45:00Z  
**Status:** PASS  
**Verifier:** reis_verifier v1.0

**Results:**
- Tests: 18/18 passed
- Feature Completeness: 3/3 tasks (100%)
- Success Criteria: 6/6 met
- Code Quality: PASS

**Issues:** 0 critical, 0 major, 1 minor

**Report:** `.planning/verification/phase-2-core-implementation/VERIFICATION_REPORT_2.md`

**Next Phase:** Ready to proceed
```
```

Save changes to subagents/reis_verifier.md
</action>
<verify>
```bash
# Check Step 7 exists
grep -q "Step 7.*STATE\|Update STATE" subagents/reis_verifier.md && echo "✅ Step 7 STATE.md integration present"

# Verify read/write functions
grep -q "readStateFile\|updateStateFile" subagents/reis_verifier.md && echo "✅ STATE.md read/write logic present"

# Check entry generation
grep -q "generateVerificationEntry\|insertVerificationEntry" subagents/reis_verifier.md && echo "✅ Entry generation logic present"

# Verify FR4.1 metrics included
grep -q "Feature Completeness.*tasks.*%" subagents/reis_verifier.md && echo "✅ FR4.1 metrics in STATE.md entries"
```
</verify>
<done>
- Step 7 enhanced with STATE.md integration
- Read current STATE.md without corruption
- Parse existing verification history
- Generate verification entry with FR4.1 metrics
- Insert entry at top of history (most recent first)
- Update phase status if verification passed
- Write updated STATE.md preserving all data
- Handle missing STATE.md gracefully
- FR4.1 task completion percentage included in entries
- Example STATE.md entry format documented
</done>
</task>

## Success Criteria
- ✅ Step 7 of reis_verifier protocol includes STATE.md integration
- ✅ Read STATE.md without corrupting existing content
- ✅ Parse verification history
- ✅ Generate verification entry with all metrics including FR4.1
- ✅ Insert entry at top of history section
- ✅ Update phase status to "Verified" if passed
- ✅ Handle missing STATE.md by creating new one
- ✅ FR4.1 task completion percentage prominently displayed
- ✅ Example entry format documented

## Verification

```bash
# Check Step 7 content
grep -A60 "Step 7.*STATE" subagents/reis_verifier.md | head -70

# Verify entry generation
grep -n "generateVerificationEntry" subagents/reis_verifier.md

# Check FR4.1 integration
grep -n "Feature Completeness.*tasks" subagents/reis_verifier.md | head -5
```

---

*This plan will be executed by reis_executor in a fresh context.*
