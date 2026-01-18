# Plan: 3-3 - Implement STATE.md Integration

## Objective
Add STATE.md update functionality to reis_verifier specification, enabling automatic state tracking after verification runs.

## Context
All verification checks are now complete (Steps 2-5). The final protocol step (Step 7) updates STATE.md with verification results so the project state reflects what's been verified. This creates a living memory of verification history.

**Key Requirements:**
- Read existing STATE.md without corruption
- Add verification entry under "Recent Progress"
- Update phase status if verification passed
- Add blockers if verification failed
- Preserve all existing state data
- Use state-manager.js utilities
- Handle missing STATE.md (create if needed)

**Integration Points:**
- Uses lib/utils/state-manager.js for STATE.md manipulation
- Verification report saved before STATE.md update (Step 6)
- STATE.md format defined in Wave 1.2

## Dependencies
- Wave 2.4 (Report Generation) - Need report generated before updating state

## Tasks

<task type="auto">
<name>Add STATE.md update protocol to reis_verifier</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 7: Update STATE.md" section in the Seven-Step Verification Protocol with comprehensive STATE.md integration instructions.

**Location:** Find "Step 7: Update STATE.md" in the protocol section (should be the last step).

**Replace/Expand with:**

```markdown
### Step 7: Update STATE.md

Update project state with verification results to maintain verification history and current status.

#### STATE.md Structure Review

STATE.md follows this structure (see templates/STATE.md):

```markdown
# Project State

## Current Status
**Active Phase**: Phase [N] - [Name]
**Last Verified**: Phase [M] - [Name] (✅ Passed on [Date])
**Last Updated**: [Date]
**Overall Progress**: [X/Y phases complete]

## Recent Progress
[Chronological entries with most recent first]

## Active Blockers
[Current issues blocking progress]

## Open Questions
[Unresolved questions]

## Next Session
[What to work on next]

## Memory
[Long-term project memory]
```

#### Reading STATE.md

**Load existing state without corruption:**

```javascript
const fs = require('fs');
const path = require('path');

function loadStateFile(planningDir) {
  const statePath = path.join(planningDir, 'STATE.md');
  
  if (!fs.existsSync(statePath)) {
    console.log('⚠️ STATE.md not found - will create new one');
    return {
      exists: false,
      content: null,
      sections: {},
    };
  }
  
  const content = fs.readFileSync(statePath, 'utf8');
  
  // Parse sections for easier manipulation
  const sections = parseStateSections(content);
  
  return {
    exists: true,
    content,
    sections,
  };
}

function parseStateSections(content) {
  const sections = {
    currentStatus: '',
    recentProgress: '',
    activeBlockers: '',
    openQuestions: '',
    nextSession: '',
    memory: '',
  };
  
  // Extract each section
  const currentStatusMatch = content.match(/## Current Status\s+([\s\S]*?)(?=\n## |$)/);
  if (currentStatusMatch) sections.currentStatus = currentStatusMatch[1].trim();
  
  const recentProgressMatch = content.match(/## Recent Progress\s+([\s\S]*?)(?=\n## |$)/);
  if (recentProgressMatch) sections.recentProgress = recentProgressMatch[1].trim();
  
  const activeBlockersMatch = content.match(/## Active Blockers\s+([\s\S]*?)(?=\n## |$)/);
  if (activeBlockersMatch) sections.activeBlockers = activeBlockersMatch[1].trim();
  
  const openQuestionsMatch = content.match(/## Open Questions\s+([\s\S]*?)(?=\n## |$)/);
  if (openQuestionsMatch) sections.openQuestions = openQuestionsMatch[1].trim();
  
  const nextSessionMatch = content.match(/## Next Session\s+([\s\S]*?)(?=\n## |$)/);
  if (nextSessionMatch) sections.nextSession = nextSessionMatch[1].trim();
  
  const memoryMatch = content.match(/## Memory\s+([\s\S]*?)$/);
  if (memoryMatch) sections.memory = memoryMatch[1].trim();
  
  return sections;
}
```

#### Creating Verification Entry

**Generate verification entry for Recent Progress:**

```javascript
function createVerificationEntry(verificationData, overallStatus) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const statusEmoji = overallStatus.emoji;
  const statusText = overallStatus.status;
  
  const entry = `### ${date} - Verification: ${verificationData.phaseName}

**Status**: ${statusEmoji} ${statusText}

**Verified**:
${generateVerifiedList(verificationData)}

**Test Results**: ${verificationData.testResults.metrics.passed}/${verificationData.testResults.metrics.total} tests passing
**Success Criteria**: ${verificationData.criteriaResults.passed}/${verificationData.criteriaResults.totalCriteria} criteria met
**Code Quality**: ${generateQualityStatus(verificationData.qualityResults)}

**Report**: \`${verificationData.reportPath}\`
${overallStatus.status === 'FAILED' || overallStatus.status === 'PARTIAL' ? 
  '\n**Issues Found**:\n' + generateIssuesList(verificationData) : ''}
**Next Action**: ${generateNextAction(overallStatus)}
`;
  
  return entry;
}

function generateVerifiedList(verificationData) {
  const items = [];
  
  // Add key accomplishments from success criteria
  const passedCriteria = verificationData.criteriaResults.criteria
    .filter(c => c.status === 'pass')
    .slice(0, 3); // Top 3
  
  passedCriteria.forEach(criterion => {
    items.push(`- ${criterion.criterion}`);
  });
  
  // Add generic items if few criteria
  if (items.length < 2) {
    if (verificationData.testResults.metrics.passed > 0) {
      items.push(`- Test suite passing (${verificationData.testResults.metrics.passed} tests)`);
    }
    if (verificationData.qualityResults.issueCount === 0) {
      items.push('- Code quality checks passed');
    }
  }
  
  return items.join('\n');
}

function generateQualityStatus(qualityResults) {
  if (qualityResults.issueCount === 0) {
    return 'No issues found';
  } else if (qualityResults.syntax.passed === false) {
    return `${qualityResults.issueCount} issues (syntax errors present)`;
  } else {
    return `${qualityResults.issueCount} issues found`;
  }
}

function generateIssuesList(verificationData) {
  const issues = [];
  
  // Failed tests
  if (verificationData.testResults.metrics.failed > 0) {
    issues.push(`- ${verificationData.testResults.metrics.failed} tests failing`);
  }
  
  // Failed criteria
  const failedCriteria = verificationData.criteriaResults.criteria.filter(c => c.status === 'fail');
  failedCriteria.slice(0, 3).forEach(criterion => {
    issues.push(`- Criterion not met: ${criterion.criterion}`);
  });
  
  // Quality issues
  if (verificationData.qualityResults.syntax.passed === false) {
    issues.push('- Syntax errors in code');
  }
  
  return issues.slice(0, 5).join('\n'); // Max 5 issues
}

function generateNextAction(overallStatus) {
  switch (overallStatus.status) {
    case 'PASSED':
      return 'Proceed to next phase/plan';
    case 'FAILED':
      return 'Fix critical issues and re-verify';
    case 'PARTIAL':
      return 'Review warnings and decide whether to proceed';
    default:
      return 'Review verification report';
  }
}
```

#### Updating Current Status

**Update phase status if verification passed:**

```javascript
function updateCurrentStatus(sections, verificationData, overallStatus) {
  const date = new Date().toISOString().split('T')[0];
  let currentStatus = sections.currentStatus;
  
  if (overallStatus.status === 'PASSED') {
    // Update "Last Verified" line
    const lastVerifiedPattern = /\*\*Last Verified\*\*:.*$/m;
    const lastVerifiedLine = `**Last Verified**: ${verificationData.phaseName} (✅ Passed on ${date})`;
    
    if (lastVerifiedPattern.test(currentStatus)) {
      currentStatus = currentStatus.replace(lastVerifiedPattern, lastVerifiedLine);
    } else {
      // Add Last Verified line after Active Phase
      const activePhasePattern = /(\*\*Active Phase\*\*:.*$)/m;
      if (activePhasePattern.test(currentStatus)) {
        currentStatus = currentStatus.replace(
          activePhasePattern,
          `$1\n${lastVerifiedLine}`
        );
      } else {
        // Add at beginning if no Active Phase line
        currentStatus = `${lastVerifiedLine}\n${currentStatus}`;
      }
    }
  }
  
  // Always update Last Updated
  const lastUpdatedPattern = /\*\*Last Updated\*\*:.*$/m;
  const lastUpdatedLine = `**Last Updated**: ${date}`;
  
  if (lastUpdatedPattern.test(currentStatus)) {
    currentStatus = currentStatus.replace(lastUpdatedPattern, lastUpdatedLine);
  } else {
    currentStatus = `${currentStatus}\n${lastUpdatedLine}`;
  }
  
  return currentStatus;
}
```

#### Adding to Recent Progress

**Prepend verification entry to Recent Progress:**

```javascript
function updateRecentProgress(sections, verificationEntry) {
  // Add new entry at the top (most recent first)
  if (sections.recentProgress) {
    return `${verificationEntry}\n\n${sections.recentProgress}`;
  } else {
    return verificationEntry;
  }
}
```

#### Managing Blockers

**Add or remove blockers based on verification status:**

```javascript
function updateBlockers(sections, verificationData, overallStatus) {
  let blockers = sections.activeBlockers;
  
  if (overallStatus.status === 'FAILED') {
    // Add blocker for failed verification
    const blockerEntry = `- [ ] **${verificationData.phaseName} Verification Failed**: ${overallStatus.summary} - See \`${verificationData.reportPath}\``;
    
    // Check if blocker already exists for this phase
    const phasePattern = new RegExp(`${verificationData.phaseName}.*Verification Failed`, 'i');
    if (!phasePattern.test(blockers)) {
      // Add new blocker
      if (blockers) {
        blockers = `${blockerEntry}\n${blockers}`;
      } else {
        blockers = blockerEntry;
      }
    }
  } else if (overallStatus.status === 'PASSED') {
    // Remove blocker if it exists for this phase
    const phasePattern = new RegExp(`^- \\[ \\] \\*\\*${verificationData.phaseName}.*Verification Failed.*$`, 'gm');
    blockers = blockers.replace(phasePattern, '').trim();
    
    // Clean up empty lines
    blockers = blockers.replace(/\n\n+/g, '\n\n');
  }
  
  return blockers;
}
```

#### Reconstructing STATE.md

**Rebuild STATE.md with updated sections:**

```javascript
function rebuildStateFile(sections) {
  const stateContent = `# Project State

## Current Status

${sections.currentStatus}

## Recent Progress

${sections.recentProgress}

## Active Blockers

${sections.activeBlockers || '*No active blockers*'}

## Open Questions

${sections.openQuestions || '*No open questions*'}

## Next Session

${sections.nextSession || '*To be determined*'}

## Memory

${sections.memory || '*No memory entries yet*'}

---

*This is your living memory. Update it frequently.*
`;
  
  return stateContent;
}
```

#### Creating New STATE.md

**If STATE.md doesn't exist, create initial version:**

```javascript
function createInitialState(verificationData, overallStatus) {
  const date = new Date().toISOString().split('T')[0];
  const statusEmoji = overallStatus.emoji;
  
  const verificationEntry = createVerificationEntry(verificationData, overallStatus);
  
  const stateContent = `# Project State

## Current Status

**Active Phase**: ${verificationData.phaseName}
**Last Verified**: ${overallStatus.status === 'PASSED' ? `${verificationData.phaseName} (${statusEmoji} Passed on ${date})` : 'None'}
**Last Updated**: ${date}
**Overall Progress**: Initial verification

## Recent Progress

${verificationEntry}

## Active Blockers

${overallStatus.status === 'FAILED' ? 
  `- [ ] **${verificationData.phaseName} Verification Failed**: ${overallStatus.summary} - See \`${verificationData.reportPath}\`` : 
  '*No active blockers*'}

## Open Questions

*No open questions*

## Next Session

**Focus**: ${generateNextAction(overallStatus)}

**Context Needed**:
- Review verification report: \`${verificationData.reportPath}\`

## Memory

### Technical Decisions
- ${date}: Initial verification completed

### Patterns to Follow
- Run verification after completing each phase

---

*This is your living memory. Update it frequently.*
`;
  
  return stateContent;
}
```

#### Writing STATE.md

**Save updated STATE.md:**

```bash
# Backup existing STATE.md before updating
if [ -f .planning/STATE.md ]; then
  cp .planning/STATE.md .planning/STATE.md.backup
  echo "✅ Backed up existing STATE.md"
fi

# Write updated STATE.md
cat > .planning/STATE.md << 'EOF'
[new state content]
EOF

echo "✅ STATE.md updated with verification results"

# Verify the update
if [ -f .planning/STATE.md ]; then
  echo "STATE.md size: $(wc -l < .planning/STATE.md) lines"
else
  echo "⚠️ Warning: STATE.md write may have failed"
fi
```

#### Complete Update Function

**Full STATE.md update workflow:**

```javascript
async function updateStateWithVerification(verificationData, overallStatus) {
  const planningDir = verificationData.planningDir;
  
  // Load existing state
  const state = loadStateFile(planningDir);
  
  // Create verification entry
  const verificationEntry = createVerificationEntry(verificationData, overallStatus);
  
  let newStateContent;
  
  if (state.exists) {
    // Update existing STATE.md
    const sections = state.sections;
    
    // Update sections
    sections.currentStatus = updateCurrentStatus(sections, verificationData, overallStatus);
    sections.recentProgress = updateRecentProgress(sections, verificationEntry);
    sections.activeBlockers = updateBlockers(sections, verificationData, overallStatus);
    
    // Rebuild STATE.md
    newStateContent = rebuildStateFile(sections);
  } else {
    // Create new STATE.md
    newStateContent = createInitialState(verificationData, overallStatus);
  }
  
  // Write STATE.md
  const statePath = path.join(planningDir, 'STATE.md');
  
  // Backup if exists
  if (fs.existsSync(statePath)) {
    fs.copyFileSync(statePath, `${statePath}.backup`);
    console.log('✅ Backed up existing STATE.md');
  }
  
  fs.writeFileSync(statePath, newStateContent, 'utf8');
  console.log('✅ STATE.md updated with verification results');
  
  // Verify write succeeded
  if (fs.existsSync(statePath)) {
    const lines = fs.readFileSync(statePath, 'utf8').split('\n').length;
    console.log(`STATE.md size: ${lines} lines`);
    return { success: true, path: statePath };
  } else {
    console.error('⚠️ Warning: STATE.md write may have failed');
    return { success: false, path: statePath };
  }
}
```

#### Using state-manager.js

**Leverage existing state-manager utilities:**

```javascript
// If lib/utils/state-manager.js has relevant utilities, use them
const stateManager = require('../lib/utils/state-manager');

// Example: Use state-manager functions if available
// stateManager.readState()
// stateManager.updateState()
// stateManager.addEntry()

// Check state-manager.js for available functions and integrate
// This ensures consistency with other REIS commands
```

#### Best Practices

1. **Always backup** - Create STATE.md.backup before updates
2. **Preserve content** - Don't overwrite unrelated sections
3. **Chronological order** - Recent Progress newest first
4. **Clean formatting** - Consistent spacing, proper markdown
5. **Atomic updates** - Write complete file, don't partial update
6. **Verify writes** - Check file exists and is reasonable size
7. **Use state-manager** - Leverage existing utilities when available

#### Error Handling

| Error | Response |
|-------|----------|
| Cannot read STATE.md | Create new STATE.md |
| Cannot write STATE.md | Error and abort (keep backup) |
| Malformed STATE.md | Create new STATE.md (backup old) |
| Backup fails | Warning but continue |
| Section not found | Add section to STATE.md |

#### Example STATE.md After Update

```markdown
# Project State

## Current Status

**Active Phase**: Phase 2 - Core Implementation
**Last Verified**: Phase 1 - Design (✅ Passed on 2024-01-18)
**Last Updated**: 2024-01-18
**Overall Progress**: 1/4 phases complete

## Recent Progress

### 2024-01-18 - Verification: Phase 1 - Design & Specification

**Status**: ✅ PASSED

**Verified**:
- Subagent specification complete and follows format
- Template created with all required sections
- Documentation updated

**Test Results**: 10/10 tests passing
**Success Criteria**: 7/7 criteria met
**Code Quality**: No issues found

**Report**: `.planning/verification/phase-1-design/2024-01-18T15-30-00.md`

**Next Action**: Proceed to next phase/plan

### 2024-01-18 - Completed Phase 1 Tasks

Completed specification and template design.

...

## Active Blockers

*No active blockers*

...
```

#### Integration Check

After updating STATE.md, verify integration:

```bash
# Verify STATE.md is valid markdown
cat .planning/STATE.md | head -20

# Check verification entry was added
grep -q "Verification:" .planning/STATE.md && echo "✅ Verification entry added"

# Check Last Verified updated (if passed)
grep "Last Verified" .planning/STATE.md

# Verify backup exists
[ -f .planning/STATE.md.backup ] && echo "✅ Backup created"
```
```

**Key Points:**
- Complete STATE.md manipulation workflow
- Preserve existing content while adding verification entry
- Update phase status on successful verification
- Manage blockers based on verification results
- Create new STATE.md if missing
- Always backup before updating
- Use state-manager.js utilities when available

</action>
<verify>
```bash
# Verify Step 7 section added
grep -q "### Step 7: Update STATE.md" subagents/reis_verifier.md && echo "✅ Step 7 section present"

# Check for key components
grep -q "STATE.md Structure" subagents/reis_verifier.md && echo "✅ Structure documented"
grep -q "Reading STATE.md" subagents/reis_verifier.md && echo "✅ Reading logic present"
grep -q "Creating Verification Entry" subagents/reis_verifier.md && echo "✅ Entry creation included"
grep -q "Updating Current Status" subagents/reis_verifier.md && echo "✅ Status update logic present"
grep -q "Managing Blockers" subagents/reis_verifier.md && echo "✅ Blocker management included"

# Verify functions
grep -q "loadStateFile\|createVerificationEntry\|updateStateWithVerification" subagents/reis_verifier.md && echo "✅ Key functions present"

# Check for backup logic
grep -q "backup\|.backup" subagents/reis_verifier.md && echo "✅ Backup logic included"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive STATE.md integration
- STATE.md Structure Review section
- Reading STATE.md with section parsing
- Creating Verification Entry with formatted output
- Updating Current Status with Last Verified field
- Adding to Recent Progress (chronological, newest first)
- Managing Blockers (add on failure, remove on success)
- Reconstructing STATE.md with all sections preserved
- Creating New STATE.md if missing
- Writing STATE.md with backup functionality
- Complete Update Function with full workflow
- Using state-manager.js utilities integration
- Best Practices and Error Handling
- Example STATE.md After Update
- Integration Check verification
- Section is ~250-300 lines with executable code
</done>
</task>

## Success Criteria
- ✅ Step 7 (Update STATE.md) in reis_verifier.md fully documented
- ✅ STATE.md reading without corruption
- ✅ Verification entry creation with proper formatting
- ✅ Current status updates (Last Verified field)
- ✅ Recent Progress updates (chronological order)
- ✅ Blocker management (add on failure, remove on success)
- ✅ STATE.md reconstruction preserving all sections
- ✅ New STATE.md creation if missing
- ✅ Backup before updating
- ✅ Complete JavaScript functions and bash commands provided
- ✅ Integration with state-manager.js utilities

## Verification

```bash
# Check Step 7 section
grep -A100 "### Step 7: Update STATE.md" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "loadStateFile" subagents/reis_verifier.md && echo "✅ State loading function"
grep -q "createVerificationEntry" subagents/reis_verifier.md && echo "✅ Entry creation function"
grep -q "updateStateWithVerification" subagents/reis_verifier.md && echo "✅ Main update function"
grep -q "backup" subagents/reis_verifier.md && echo "✅ Backup logic present"

# Verify all 7 steps documented
grep "^### Step" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
