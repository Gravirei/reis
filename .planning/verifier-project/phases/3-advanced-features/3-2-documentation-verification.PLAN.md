# Plan: 3-2 - Implement Documentation Verification

## Objective
Implement Step 5 of the verification protocol: verify required documentation exists and is consistent.

## Context
Documentation validation ensures project docs are up-to-date. This is a lower-priority check compared to FR4.1 Feature Completeness.

**Documentation status:**
- Missing docs = WARNING (not failure)
- Incomplete docs = WARNING
- No docs + all features complete (FR4.1) = PASS with warnings

## Dependencies
- Wave 2.4 (report generation infrastructure)

## Tasks

<task type="auto">
<name>Add documentation verification section to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
Enhance Step 5 of the verification protocol with documentation checks.

**Locate:** Find "Step 5: Verify Documentation" in the protocol.

**Enhance with:**

```markdown
### Step 5: Verify Documentation

**Objective:** Check that required documentation exists and is reasonably complete.

**Important:** Missing docs = WARNING, not failure. FR4.1 completeness takes priority.

**Process:**

**1. Check Required Files**

```bash
# Core documentation files
REQUIRED_DOCS=(
  "README.md"
  "CHANGELOG.md"
)

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc exists"
  else
    echo "⚠️  $doc missing"
  fi
done
```

**2. Validate README.md**

```javascript
function validateReadme(content) {
  const checks = {
    exists: content.length > 0,
    hasTitle: /^#\s+.+/m.test(content),
    hasDescription: content.length > 100,
    hasInstallation: /install|setup|getting started/i.test(content),
    hasUsage: /usage|example|how to/i.test(content)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    score: `${score}/${total}`,
    percentage: Math.round((score / total) * 100),
    checks
  };
}
```

**3. Check CHANGELOG.md**

```javascript
function validateChangelog(content) {
  if (!content) {
    return { status: 'MISSING', entries: 0 };
  }
  
  // Count version entries
  const entries = (content.match(/^##\s+\[?\d+\.\d+\.\d+/gm) || []).length;
  
  return {
    status: entries > 0 ? 'PRESENT' : 'EMPTY',
    entries
  };
}
```

**4. Scan for TODO/FIXME**

```bash
# Find TODO/FIXME comments (informational)
grep -r "TODO\|FIXME" src/ lib/ 2>/dev/null | wc -l
```

**5. Documentation Status**

```javascript
function calculateDocStatus(readme, changelog, todos) {
  if (!readme.checks.exists) {
    return {
      status: 'INCOMPLETE',
      message: 'README.md missing'
    };
  }
  
  if (readme.percentage < 60) {
    return {
      status: 'INCOMPLETE',
      message: 'README.md lacks key sections'
    };
  }
  
  if (!changelog || changelog.status === 'MISSING') {
    return {
      status: 'INCOMPLETE',
      message: 'CHANGELOG.md missing'
    };
  }
  
  if (todos > 20) {
    return {
      status: 'WARNINGS',
      message: `${todos} TODO/FIXME comments (consider addressing)`
    };
  }
  
  return {
    status: 'COMPLETE',
    message: 'Documentation is adequate'
  };
}
```

**6. Report Section**

```markdown
## Documentation

**Status:** ${status}

### Required Documentation
- ${readme.checks.exists ? '✅' : '❌'} README.md ${readme.checks.exists ? `(${readme.percentage}% complete)` : 'missing'}
- ${changelog.status !== 'MISSING' ? '✅' : '⚠️'} CHANGELOG.md ${changelog.status !== 'MISSING' ? `(${changelog.entries} entries)` : 'missing'}

### README.md Checklist
- ${readme.checks.hasTitle ? '✅' : '⚠️'} Has title
- ${readme.checks.hasDescription ? '✅' : '⚠️'} Has description
- ${readme.checks.hasInstallation ? '✅' : '⚠️'} Has installation instructions
- ${readme.checks.hasUsage ? '✅' : '⚠️'} Has usage examples

### Code Comments
${todos > 0 ? `⚠️  ${todos} TODO/FIXME comments found (consider addressing)` : '✅ No TODO/FIXME comments'}

${status === 'INCOMPLETE' ? `
**Recommendation:** Update documentation to reflect current implementation.
` : ''}
```

**Integration:**
- Missing/incomplete docs = WARNING (don't fail verification)
- Report status but don't block on docs alone
- FR4.1 feature completeness takes priority
- If FR4.1 passes but docs incomplete = PASS with warnings
```

Save changes to subagents/reis_verifier.md
</action>
<verify>
```bash
# Check Step 5 exists
grep -q "Step 5.*Documentation\|Verify Documentation" subagents/reis_verifier.md && echo "✅ Step 5 documentation checks present"

# Verify README validation
grep -q "validateReadme\|README" subagents/reis_verifier.md && echo "✅ README validation included"

# Check CHANGELOG validation
grep -q "validateChangelog\|CHANGELOG" subagents/reis_verifier.md && echo "✅ CHANGELOG validation included"

# Verify TODO scanning
grep -q "TODO\|FIXME" subagents/reis_verifier.md && echo "✅ TODO/FIXME scanning included"
```
</verify>
<done>
- Step 5 enhanced with documentation verification
- Required files check (README.md, CHANGELOG.md)
- README.md validation (title, description, installation, usage)
- CHANGELOG.md validation (version entries)
- TODO/FIXME comment scanning
- Documentation status calculation
- Report section format defined
- Clear rule: missing docs = WARNING, not failure
</done>
</task>

## Success Criteria
- ✅ Step 5 of reis_verifier protocol includes documentation checks
- ✅ README.md validation (completeness checklist)
- ✅ CHANGELOG.md validation (entry count)
- ✅ TODO/FIXME comment scanning
- ✅ Documentation status: COMPLETE/INCOMPLETE/WARNINGS
- ✅ Integration with verification report
- ✅ Missing docs don't fail verification (warnings only)
- ✅ FR4.1 takes priority over documentation status

## Verification

```bash
# Check Step 5 content
grep -A40 "Step 5.*Documentation" subagents/reis_verifier.md | head -50

# Verify validation functions
grep -n "validateReadme\|validateChangelog" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
