# Plan: 3-2 - Add Documentation Verification

## Objective
Implement documentation verification in reis_verifier specification, checking for required docs, completeness, and consistency.

## Context
Code quality checks (Wave 3.1) validate the code itself. Now we add documentation verification (Step 5 in the verification protocol) to ensure README, CHANGELOG, and other docs are present and up-to-date.

**Key Requirements:**
- Check required documents exist (README.md, CHANGELOG.md)
- Verify documentation completeness (sections, examples, up-to-date)
- Detect TODO/FIXME comments in code
- Check for API documentation if applicable
- Validate code comments are adequate
- Include results in verification report

**Documentation Standards:**
- README.md: Project description, installation, usage, examples
- CHANGELOG.md: Version history with dates
- API docs: If project exports APIs/libraries
- Code comments: JSDoc, inline explanations for complex logic

## Dependencies
- Wave 2.4 (Report Generation) - Need report structure to populate documentation section

## Tasks

<task type="auto">
<name>Add documentation verification protocol to reis_verifier</name>
<files>subagents/reis_verifier.md</files>
<action>
Expand the "Step 5: Verify Documentation" section in the Seven-Step Verification Protocol with comprehensive documentation checking instructions.

**Location:** Find "Step 5: Verify Documentation" in the protocol section (should be after Step 4).

**Replace/Expand with:**

```markdown
### Step 5: Verify Documentation

Check that required documentation exists, is complete, and is up-to-date.

#### Required Documents Check

**Check for essential documentation files:**

```bash
# Define required documents
REQUIRED_DOCS=("README.md" "CHANGELOG.md")
OPTIONAL_DOCS=("CONTRIBUTING.md" "LICENSE" "docs/API.md")

# Check required documents
echo "Checking required documentation..."
MISSING_REQUIRED=()
FOUND_REQUIRED=()

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc exists"
    FOUND_REQUIRED+=("$doc")
  else
    echo "❌ $doc missing"
    MISSING_REQUIRED+=("$doc")
  fi
done

# Check optional documents
echo "Checking optional documentation..."
FOUND_OPTIONAL=()

for doc in "${OPTIONAL_DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "✅ $doc exists"
    FOUND_OPTIONAL+=("$doc")
  fi
done

# Determine status
if [ ${#MISSING_REQUIRED[@]} -eq 0 ]; then
  DOC_STATUS="pass"
  echo "✅ All required documentation present"
else
  DOC_STATUS="fail"
  echo "❌ Missing required documentation: ${MISSING_REQUIRED[*]}"
fi
```

#### README.md Completeness Check

**Verify README contains essential sections:**

```javascript
function checkReadmeCompleteness(readmeContent) {
  const requiredSections = [
    { name: 'Title/Project Name', pattern: /^#\s+.+/m },
    { name: 'Description', pattern: /description|about|overview/i },
    { name: 'Installation', pattern: /##\s*install/i },
    { name: 'Usage', pattern: /##\s*usage|##\s*getting started/i },
  ];
  
  const optionalSections = [
    { name: 'Examples', pattern: /##\s*example/i },
    { name: 'API Documentation', pattern: /##\s*api/i },
    { name: 'Contributing', pattern: /##\s*contribut/i },
    { name: 'License', pattern: /##\s*license/i },
    { name: 'Tests', pattern: /##\s*test/i },
  ];
  
  const results = {
    required: [],
    optional: [],
    missing: [],
    score: 0,
  };
  
  // Check required sections
  for (const section of requiredSections) {
    if (section.pattern.test(readmeContent)) {
      results.required.push(section.name);
    } else {
      results.missing.push(section.name);
    }
  }
  
  // Check optional sections
  for (const section of optionalSections) {
    if (section.pattern.test(readmeContent)) {
      results.optional.push(section.name);
    }
  }
  
  // Calculate completeness score
  const requiredScore = (results.required.length / requiredSections.length) * 70;
  const optionalScore = (results.optional.length / optionalSections.length) * 30;
  results.score = Math.round(requiredScore + optionalScore);
  
  return results;
}

// Check README exists and analyze
let readmeResult = {
  exists: false,
  complete: false,
  score: 0,
  missing: [],
  recentlyUpdated: false,
};

if (fs.existsSync('README.md')) {
  readmeResult.exists = true;
  const readmeContent = fs.readFileSync('README.md', 'utf8');
  const completeness = checkReadmeCompleteness(readmeContent);
  
  readmeResult.score = completeness.score;
  readmeResult.missing = completeness.missing;
  readmeResult.complete = completeness.missing.length === 0;
  
  // Check if recently updated (within 30 days)
  const stats = fs.statSync('README.md');
  const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
  readmeResult.recentlyUpdated = ageInDays < 30;
  
  if (readmeResult.complete) {
    console.log('✅ README.md is complete');
  } else {
    console.log(`⚠️ README.md missing sections: ${readmeResult.missing.join(', ')}`);
  }
} else {
  console.log('❌ README.md not found');
}
```

#### CHANGELOG.md Validation

**Check changelog format and recency:**

```javascript
function validateChangelog(changelogContent) {
  const results = {
    exists: true,
    hasVersions: false,
    hasDates: false,
    recentEntry: false,
    format: 'unknown',
    issues: [],
  };
  
  // Check for version entries
  const versionPattern = /##?\s*\[?\d+\.\d+\.\d+\]?/;
  results.hasVersions = versionPattern.test(changelogContent);
  
  if (!results.hasVersions) {
    results.issues.push('No version entries found');
  }
  
  // Check for dates
  const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/;
  results.hasDates = datePattern.test(changelogContent);
  
  if (!results.hasDates) {
    results.issues.push('No dates in changelog');
  }
  
  // Detect format (Keep a Changelog vs simple)
  if (changelogContent.includes('### Added') || changelogContent.includes('### Changed')) {
    results.format = 'keepachangelog';
  } else if (versionPattern.test(changelogContent)) {
    results.format = 'simple';
  }
  
  // Check for recent entry (within 30 days)
  const lines = changelogContent.split('\n');
  for (const line of lines.slice(0, 50)) { // Check first 50 lines
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const entryDate = new Date(dateMatch[1]);
      const ageInDays = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) {
        results.recentEntry = true;
        break;
      }
    }
  }
  
  return results;
}

let changelogResult = {
  exists: false,
  valid: false,
  issues: [],
};

if (fs.existsSync('CHANGELOG.md')) {
  changelogResult.exists = true;
  const changelogContent = fs.readFileSync('CHANGELOG.md', 'utf8');
  const validation = validateChangelog(changelogContent);
  
  changelogResult.valid = validation.hasVersions && validation.hasDates;
  changelogResult.issues = validation.issues;
  changelogResult.format = validation.format;
  changelogResult.recentEntry = validation.recentEntry;
  
  if (changelogResult.valid) {
    console.log('✅ CHANGELOG.md is properly formatted');
  } else {
    console.log(`⚠️ CHANGELOG.md issues: ${changelogResult.issues.join(', ')}`);
  }
} else {
  console.log('❌ CHANGELOG.md not found');
  changelogResult.issues.push('File does not exist');
}
```

#### TODO/FIXME Detection

**Find and categorize TODO comments in code:**

```bash
# Find all TODO/FIXME/HACK/XXX comments
echo "Scanning for TODO/FIXME comments..."

# Search for TODO comments
grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" \
  --include="*.py" --include="*.rb" --include="*.go" --include="*.java" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build \
  . > /tmp/todos.txt 2>/dev/null

# Count TODOs by type
TODO_COUNT=$(grep -ci "TODO" /tmp/todos.txt 2>/dev/null || echo "0")
FIXME_COUNT=$(grep -ci "FIXME" /tmp/todos.txt 2>/dev/null || echo "0")
HACK_COUNT=$(grep -ci "HACK" /tmp/todos.txt 2>/dev/null || echo "0")
XXX_COUNT=$(grep -ci "XXX" /tmp/todos.txt 2>/dev/null || echo "0")

TOTAL_TODOS=$((TODO_COUNT + FIXME_COUNT + HACK_COUNT + XXX_COUNT))

echo "Found $TOTAL_TODOS comments:"
echo "  TODO: $TODO_COUNT"
echo "  FIXME: $FIXME_COUNT"
echo "  HACK: $HACK_COUNT"
echo "  XXX: $XXX_COUNT"

# Identify critical TODOs (in critical files or marked as urgent)
grep -i "TODO.*critical\|FIXME.*urgent\|TODO.*important" /tmp/todos.txt > /tmp/critical-todos.txt 2>/dev/null
CRITICAL_TODOS=$(wc -l < /tmp/critical-todos.txt 2>/dev/null || echo "0")

if [ $CRITICAL_TODOS -gt 0 ]; then
  echo "⚠️ $CRITICAL_TODOS critical TODOs found"
  cat /tmp/critical-todos.txt | head -5
fi
```

**TODO Result Object:**
```javascript
{
  "count": 15,
  "byType": {
    "TODO": 10,
    "FIXME": 3,
    "HACK": 1,
    "XXX": 1
  },
  "critical": 2,
  "list": [
    { "file": "src/app.js", "line": 42, "type": "TODO", "text": "Implement error handling" },
    { "file": "lib/utils.js", "line": 15, "type": "FIXME", "text": "This is a temporary hack" },
    // Top 10 TODOs
  ]
}
```

#### Code Comments Analysis

**Check for adequate code comments:**

```bash
# Analyze comment density in code files
echo "Analyzing code comments..."

# Find all code files
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) \
  -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/build/*" \
  > /tmp/code-files-for-comments.txt

TOTAL_LINES=0
COMMENT_LINES=0
FILES_WITHOUT_COMMENTS=0

while IFS= read -r file; do
  # Count total lines
  LINES=$(wc -l < "$file")
  TOTAL_LINES=$((TOTAL_LINES + LINES))
  
  # Count comment lines (simple heuristic: lines with // or /* or *)
  COMMENTS=$(grep -c "^\s*//\|^\s*/\*\|^\s*\*" "$file" 2>/dev/null || echo "0")
  COMMENT_LINES=$((COMMENT_LINES + COMMENTS))
  
  if [ $COMMENTS -eq 0 ] && [ $LINES -gt 50 ]; then
    FILES_WITHOUT_COMMENTS=$((FILES_WITHOUT_COMMENTS + 1))
  fi
done < /tmp/code-files-for-comments.txt

# Calculate comment ratio
if [ $TOTAL_LINES -gt 0 ]; then
  COMMENT_RATIO=$(awk "BEGIN {printf \"%.1f\", ($COMMENT_LINES / $TOTAL_LINES) * 100}")
else
  COMMENT_RATIO=0
fi

echo "Comment density: $COMMENT_RATIO%"
echo "Files without comments (>50 lines): $FILES_WITHOUT_COMMENTS"

# Determine if comments are adequate (>10% is good, >5% is acceptable)
if (( $(echo "$COMMENT_RATIO > 10" | bc -l) )); then
  COMMENTS_ADEQUATE=true
  echo "✅ Code comments are adequate"
elif (( $(echo "$COMMENT_RATIO > 5" | bc -l) )); then
  COMMENTS_ADEQUATE=true
  echo "⚠️ Code comments are minimal but acceptable"
else
  COMMENTS_ADEQUATE=false
  echo "❌ Code comments are insufficient (<5%)"
fi
```

#### API Documentation Check

**Check for API documentation (if applicable):**

```javascript
function checkApiDocumentation(projectRoot) {
  const apiDocLocations = [
    'docs/API.md',
    'docs/api.md',
    'API.md',
    'api.md',
    'docs/index.md',
  ];
  
  const result = {
    exists: false,
    location: null,
    format: null,
  };
  
  // Check if project exports APIs (has index.js, exports, etc.)
  let isLibrary = false;
  
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    // Library indicators
    if (pkg.main || pkg.exports || pkg.module) {
      isLibrary = true;
    }
  }
  
  if (!isLibrary) {
    result.notApplicable = true;
    return result;
  }
  
  // Check for API documentation
  for (const location of apiDocLocations) {
    if (fs.existsSync(location)) {
      result.exists = true;
      result.location = location;
      
      const content = fs.readFileSync(location, 'utf8');
      
      // Detect format
      if (content.includes('```')) {
        result.format = 'markdown with examples';
      } else {
        result.format = 'markdown';
      }
      
      break;
    }
  }
  
  return result;
}
```

#### Documentation Result Object

Return structured documentation results:

```javascript
{
  "status": "passed" | "failed" | "warning",
  "complete": true,
  "readme": {
    "exists": true,
    "complete": true,
    "score": 85,
    "missing": [],
    "recentlyUpdated": true
  },
  "changelog": {
    "exists": true,
    "valid": true,
    "format": "keepachangelog",
    "recentEntry": true,
    "issues": []
  },
  "api": {
    "exists": true,
    "location": "docs/API.md",
    "format": "markdown with examples"
  },
  "comments": {
    "adequate": true,
    "density": 12.5,
    "filesWithoutComments": 2
  },
  "todos": {
    "count": 15,
    "critical": 2,
    "byType": { "TODO": 10, "FIXME": 3, "HACK": 1, "XXX": 1 },
    "list": [...]
  },
  "issues": [
    "2 files over 50 lines lack comments",
    "2 critical TODOs need attention"
  ]
}
```

#### Overall Documentation Status

**Calculate overall documentation status:**

```javascript
function calculateDocumentationStatus(docResults) {
  const checks = {
    readme: docResults.readme.exists && docResults.readme.complete,
    changelog: docResults.changelog.exists && docResults.changelog.valid,
    api: docResults.api.notApplicable || docResults.api.exists,
    comments: docResults.comments.adequate,
  };
  
  const failed = Object.values(checks).filter(v => v === false).length;
  
  if (failed === 0) {
    return { status: 'passed', emoji: '✅', message: 'Documentation complete' };
  } else if (failed === 1) {
    return { status: 'warning', emoji: '⚠️', message: 'Documentation needs improvement' };
  } else {
    return { status: 'failed', emoji: '❌', message: 'Missing required documentation' };
  }
}
```

#### Best Practices

1. **Required vs Optional** - Distinguish between must-have and nice-to-have docs
2. **Check recency** - Documentation should be updated with code changes
3. **Suggest formats** - Recommend Keep a Changelog format for CHANGELOG.md
4. **Context matters** - Libraries need API docs, apps may not
5. **Comment quality over quantity** - 10% well-written comments > 30% noise
6. **Actionable feedback** - Tell developers exactly what's missing
7. **Don't block on TODOs** - Note them but don't fail verification

#### Error Handling

| Error | Response |
|-------|----------|
| No README | ❌ FAIL - Required document missing |
| README incomplete | ⚠️ WARNING - List missing sections |
| No CHANGELOG | ⚠️ WARNING - Recommended but not required |
| No comments | ⚠️ WARNING - Suggest adding comments |
| Many critical TODOs | ⚠️ WARNING - List critical items |
| Cannot read file | ❌ FAIL - File permissions issue |

#### Example Output

For verification report:

```markdown
### Required Documents
- ✅ README.md exists and up-to-date (score: 85/100)
- ✅ CHANGELOG.md updated (Keep a Changelog format)
- ✅ API documentation (docs/API.md)
- ⚠️ Code comments minimal (7.5% density)

### Documentation Issues
- 2 files over 50 lines lack comments
- README missing "Examples" section

### TODO/FIXME Comments
**Found**: 15
**Critical**: 2
- src/app.js:42 - TODO: Implement error handling (CRITICAL)
- lib/utils.js:15 - FIXME: Temporary hack needs proper solution (CRITICAL)

**Overall**: ⚠️ Documentation needs improvement
```
```

**Key Points:**
- Check required documents (README, CHANGELOG) and optional (API, CONTRIBUTING)
- Validate README completeness with scoring
- Check CHANGELOG format and recency
- Detect and categorize TODO/FIXME comments
- Analyze code comment density
- Provide structured output for report generation

</action>
<verify>
```bash
# Verify Step 5 section added
grep -q "### Step 5: Verify Documentation" subagents/reis_verifier.md && echo "✅ Step 5 section present"

# Check for key components
grep -q "Required Documents Check" subagents/reis_verifier.md && echo "✅ Required docs check documented"
grep -q "README.md Completeness" subagents/reis_verifier.md && echo "✅ README validation present"
grep -q "CHANGELOG.md Validation" subagents/reis_verifier.md && echo "✅ CHANGELOG validation included"
grep -q "TODO/FIXME Detection" subagents/reis_verifier.md && echo "✅ TODO detection present"
grep -q "Code Comments Analysis" subagents/reis_verifier.md && echo "✅ Comment analysis included"

# Verify functions
grep -q "checkReadmeCompleteness\|validateChangelog" subagents/reis_verifier.md && echo "✅ Validation functions present"
```
</verify>
<done>
- subagents/reis_verifier.md updated with comprehensive documentation verification
- Required Documents Check for README, CHANGELOG, and optional docs
- README.md Completeness Check with scoring system
- CHANGELOG.md Validation with format detection
- TODO/FIXME Detection with categorization and critical flagging
- Code Comments Analysis with density calculation
- API Documentation Check for library projects
- Documentation Result Object format defined
- Overall Documentation Status calculation
- Best Practices and Error Handling included
- Example Output for verification report
- Section is ~200-250 lines with executable code
</done>
</task>

## Success Criteria
- ✅ Step 5 (Verify Documentation) in reis_verifier.md fully documented
- ✅ Required documents check (README.md, CHANGELOG.md)
- ✅ README completeness validation with scoring
- ✅ CHANGELOG format validation and recency check
- ✅ TODO/FIXME detection with critical flagging
- ✅ Code comment density analysis
- ✅ API documentation check for libraries
- ✅ Structured documentation result object for report generation
- ✅ Overall status calculation (passed/warning/failed)
- ✅ Complete bash commands and JavaScript functions provided

## Verification

```bash
# Check Step 5 section
grep -A100 "### Step 5: Verify Documentation" subagents/reis_verifier.md | head -50

# Verify completeness
echo "Checking for key components:"
grep -q "checkReadmeCompleteness" subagents/reis_verifier.md && echo "✅ README check function"
grep -q "validateChangelog" subagents/reis_verifier.md && echo "✅ CHANGELOG validation"
grep -q "TODO.*FIXME.*HACK" subagents/reis_verifier.md && echo "✅ TODO detection"
grep -q "comment.*density\|Comment.*Analysis" subagents/reis_verifier.md && echo "✅ Comment analysis"

# Verify structure
grep "^### Step" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
