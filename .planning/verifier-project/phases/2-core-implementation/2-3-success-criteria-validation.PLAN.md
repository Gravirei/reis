# Plan: 2-3 - Implement Success Criteria & Feature Completeness Validation

## Objective
Implement Step 4 of the verification protocol: validate success criteria from PLAN.md AND implement FR4.1 Feature Completeness Validation to detect missing/incomplete tasks.

## Context
This is the MOST CRITICAL wave for FR4.1 integration. The verifier must not only check success criteria but also verify that ALL planned tasks were actually implemented.

**CRITICAL PROBLEM FR4.1 SOLVES:**
Executors may skip tasks without errors. Tests might pass, but features are missing. FR4.1 catches this by:
- Parsing all tasks from PLAN.md
- Extracting expected deliverables per task
- Verifying each deliverable exists in codebase
- Reporting missing features with evidence
- Calculating completion: 100% = PASS, <100% = FAIL

**Key Requirements:**
- Parse PLAN.md for success criteria (existing)
- **Parse PLAN.md for all tasks and deliverables (NEW - FR4.1)**
- **Verify each task's deliverables exist (NEW - FR4.1)**
- **Calculate task completion percentage (NEW - FR4.1)**
- Validate success criteria with evidence
- Report both criteria status AND task completeness

## Dependencies
- Wave 2.1 (verify command infrastructure)
- Wave 2.2 (test execution for comparison)

## Tasks

<task type="auto">
<name>Add FR4.1 Feature Completeness section to reis_verifier spec</name>
<files>subagents/reis_verifier.md</files>
<action>
This is the CRITICAL FR4.1 implementation. Add comprehensive Feature Completeness validation to Step 4 of the verification protocol.

**Locate:** Find "Step 4: Validate Success Criteria" in the verification protocol.

**Rename to:** "Step 4: Validate Success Criteria & Feature Completeness (FR4.1)"

**Replace/Enhance with:**

```markdown
### Step 4: Validate Success Criteria & Feature Completeness (FR4.1)

**Objective:** Verify PLAN.md success criteria are met AND all tasks are completely implemented.

**CRITICAL:** This step has TWO parts:
1. Success Criteria Validation (existing functionality)
2. **Feature Completeness Validation (FR4.1 - NEW)**

---

#### Part A: Feature Completeness Validation (FR4.1) - CRITICAL

**Purpose:** Detect when executor skipped tasks or left features incomplete.

**Process:**

**1. Parse All Tasks from PLAN.md**

```javascript
function parseTasksFromPlan(planContent) {
  const tasks = [];
  const taskRegex = /<task type="[^"]+">[\s\S]*?<\/task>/g;
  const matches = planContent.match(taskRegex) || [];
  
  for (const taskXml of matches) {
    // Extract task metadata
    const name = taskXml.match(/<name>([^<]+)<\/name>/)?.[1]?.trim();
    const files = taskXml.match(/<files>([^<]+)<\/files>/)?.[1]
      ?.split(',').map(f => f.trim()) || [];
    const action = taskXml.match(/<action>([\s\S]*?)<\/action>/)?.[1]?.trim();
    
    tasks.push({
      name: name || 'Unnamed task',
      files: files,
      action: action || '',
      deliverables: extractDeliverables(name, files, action),
      status: 'PENDING',
      evidence: [],
      missing: []
    });
  }
  
  return tasks;
}
```

**2. Extract Expected Deliverables**

```javascript
function extractDeliverables(taskName, files, action) {
  const deliverables = [];
  
  // From <files> tag - explicit file list
  for (const file of files) {
    deliverables.push({
      type: 'file',
      path: file,
      required: true
    });
    
    // Auto-add test file if source file
    if (file.includes('src/') && !file.includes('.test.')) {
      const testPath = file
        .replace('src/', 'test/')
        .replace(/\.(js|ts)$/, '.test.$1');
      deliverables.push({
        type: 'test',
        path: testPath,
        required: false // Optional but recommended
      });
    }
  }
  
  // From action text - parse for patterns
  const patterns = [
    // Functions: "Implement functionName()" or "Create functionName"
    { regex: /(?:Implement|Create|Add|Build)\s+(\w+)\s*\(/gi, type: 'function' },
    
    // Classes: "Create ClassName class" or "Add ClassName"
    { regex: /(?:Create|Add)\s+(\w+)\s+class/gi, type: 'class' },
    
    // Endpoints: "Build POST /api/path" or "Create GET /api/users"
    { regex: /(?:Build|Create|Add)\s+(GET|POST|PUT|DELETE)\s+(\/[^\s]+)/gi, type: 'endpoint' },
    
    // Components: "Create ComponentName component"
    { regex: /Create\s+(\w+)\s+component/gi, type: 'component' }
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(action)) !== null) {
      deliverables.push({
        type: pattern.type,
        name: match[1],
        path: match[2], // For endpoints
        required: true
      });
    }
  }
  
  return deliverables;
}
```

**3. Verify Each Deliverable Exists**

```javascript
async function verifyDeliverables(task) {
  for (const deliverable of task.deliverables) {
    const exists = await checkDeliverable(deliverable);
    
    if (exists) {
      task.evidence.push({
        deliverable,
        status: 'FOUND',
        location: exists.location,
        confidence: exists.confidence
      });
    } else {
      task.missing.push({
        deliverable,
        searchAttempts: exists.searchAttempts
      });
    }
  }
  
  // Calculate task status
  const requiredDeliverables = task.deliverables.filter(d => d.required);
  const foundRequired = task.evidence.filter(e => 
    e.deliverable.required && e.confidence >= 0.7
  ).length;
  
  task.status = foundRequired === requiredDeliverables.length 
    ? 'COMPLETE' 
    : 'INCOMPLETE';
  
  return task;
}
```

**4. Check Individual Deliverable**

```javascript
async function checkDeliverable(deliverable) {
  const searchResults = {
    location: null,
    confidence: 0,
    searchAttempts: []
  };
  
  switch (deliverable.type) {
    case 'file':
      return await checkFile(deliverable, searchResults);
    
    case 'function':
      return await checkFunction(deliverable, searchResults);
    
    case 'class':
      return await checkClass(deliverable, searchResults);
    
    case 'endpoint':
      return await checkEndpoint(deliverable, searchResults);
    
    case 'test':
      return await checkFile(deliverable, searchResults);
    
    default:
      return searchResults;
  }
}

async function checkFile(deliverable, results) {
  // Method 1: Direct file existence
  const exists = fs.existsSync(deliverable.path);
  results.searchAttempts.push({
    method: 'fs.existsSync',
    path: deliverable.path,
    result: exists
  });
  
  if (exists) {
    results.location = deliverable.path;
    results.confidence = 1.0;
    return results;
  }
  
  // Method 2: Git ls-files (handles renames)
  const gitFiles = execSync('git ls-files').toString();
  const baseName = path.basename(deliverable.path);
  const found = gitFiles.split('\n').find(f => f.includes(baseName));
  
  results.searchAttempts.push({
    method: 'git ls-files',
    pattern: baseName,
    result: !!found
  });
  
  if (found) {
    results.location = found;
    results.confidence = 0.8; // Good but not exact match
    return results;
  }
  
  return null;
}

async function checkFunction(deliverable, results) {
  // Grep for function definition
  const patterns = [
    `function ${deliverable.name}`,
    `const ${deliverable.name} =`,
    `${deliverable.name}:`,
    `${deliverable.name}(`
  ];
  
  for (const pattern of patterns) {
    const grepCmd = `grep -r "${pattern}" src/ lib/ 2>/dev/null || true`;
    const output = execSync(grepCmd).toString();
    
    results.searchAttempts.push({
      method: 'grep',
      pattern,
      result: output.length > 0
    });
    
    if (output.length > 0) {
      const match = output.split('\n')[0];
      const [file, line] = match.split(':');
      results.location = `${file}:${line}`;
      results.confidence = 0.9;
      return results;
    }
  }
  
  return null;
}

async function checkClass(deliverable, results) {
  // Similar to checkFunction but for class patterns
  const patterns = [
    `class ${deliverable.name}`,
    `export class ${deliverable.name}`
  ];
  
  for (const pattern of patterns) {
    const grepCmd = `grep -r "${pattern}" src/ lib/ 2>/dev/null || true`;
    const output = execSync(grepCmd).toString();
    
    results.searchAttempts.push({
      method: 'grep',
      pattern,
      result: output.length > 0
    });
    
    if (output.length > 0) {
      const match = output.split('\n')[0];
      const [file, line] = match.split(':');
      results.location = `${file}:${line}`;
      results.confidence = 0.9;
      return results;
    }
  }
  
  return null;
}

async function checkEndpoint(deliverable, results) {
  // Check for route definitions
  const method = deliverable.name; // GET, POST, etc.
  const path = deliverable.path;
  
  const patterns = [
    `${method.toLowerCase()}('${path}'`,
    `${method.toLowerCase()}("${path}"`,
    `.${method.toLowerCase()}('${path}'`,
    `method: '${method}'.*path: '${path}'`
  ];
  
  for (const pattern of patterns) {
    const grepCmd = `grep -r "${pattern}" src/ lib/ routes/ 2>/dev/null || true`;
    const output = execSync(grepCmd).toString();
    
    results.searchAttempts.push({
      method: 'grep',
      pattern,
      result: output.length > 0
    });
    
    if (output.length > 0) {
      const match = output.split('\n')[0];
      const [file, line] = match.split(':');
      results.location = `${file}:${line}`;
      results.confidence = 0.85;
      return results;
    }
  }
  
  return null;
}
```

**5. Calculate Completion Percentage**

```javascript
function calculateCompleteness(tasks) {
  const totalTasks = tasks.length;
  const completeTasks = tasks.filter(t => t.status === 'COMPLETE').length;
  const completionRate = (completeTasks / totalTasks) * 100;
  
  return {
    total: totalTasks,
    complete: completeTasks,
    incomplete: totalTasks - completeTasks,
    percentage: Math.round(completionRate),
    status: completionRate === 100 ? 'PASS' : 'FAIL'
  };
}
```

**6. Generate Feature Completeness Report Section**

See template in VERIFICATION_REPORT.md for full format. Key elements:

```markdown
## Feature Completeness (FR4.1)

**Status:** ${status} (${percentage}%)
**Tasks Completed:** ${complete}/${total}

### Task-by-Task Analysis

${tasks.map(task => `
#### ${task.status === 'COMPLETE' ? '✅' : '❌'} Task: ${task.name}

**Status:** ${task.status}

${task.status === 'COMPLETE' ? `
**Evidence:**
${task.evidence.map(e => `- ${e.deliverable.type}: \`${e.location}\` (confidence: ${e.confidence * 100}%)`).join('\n')}
` : `
**Missing Deliverables:**
${task.missing.map(m => `- ${m.deliverable.type}: \`${m.deliverable.name || m.deliverable.path}\` NOT FOUND
  Search attempts: ${m.searchAttempts.length}
  Methods tried: ${m.searchAttempts.map(s => s.method).join(', ')}
`).join('\n')}

**Impact:** ${assessImpact(task)}
**Recommendation:** ${getRecommendation(task)}
`}
`).join('\n')}
```

---

#### Part B: Success Criteria Validation

(Keep existing success criteria validation logic here - parse criteria from PLAN.md, validate each one, provide evidence)

**Integration:** Both Feature Completeness AND Success Criteria must pass for Step 4 to pass.
```

**Key Implementation Notes:**

1. **Confidence Scoring:** Not all matches are 100% certain
   - Exact file path match: 1.0
   - Git found with different path: 0.8
   - Function/class found: 0.9
   - Endpoint pattern match: 0.85
   - Accept >= 0.7 as "found"

2. **False Positive Prevention:**
   - Check multiple patterns per deliverable
   - Record all search attempts
   - Distinguish between renamed vs missing

3. **Performance:**
   - Cache git ls-files output
   - Batch grep searches where possible
   - Set reasonable timeouts

4. **Error Handling:**
   - If grep fails, try alternative methods
   - If git unavailable, use fs only
   - Never crash on search failure

Save changes to subagents/reis_verifier.md
</action>
<verify>
```bash
# Check Step 4 was enhanced
grep -q "Step 4.*Feature Completeness\|FR4.1" subagents/reis_verifier.md && echo "✅ Step 4 includes FR4.1"

# Verify task parsing logic
grep -q "parseTasksFromPlan\|extractDeliverables" subagents/reis_verifier.md && echo "✅ Task parsing logic present"

# Check deliverable verification
grep -q "verifyDeliverables\|checkDeliverable" subagents/reis_verifier.md && echo "✅ Deliverable verification present"

# Verify completion calculation
grep -q "calculateCompleteness\|completion.*percentage" subagents/reis_verifier.md && echo "✅ Completion calculation present"

# Check for file/function/class/endpoint checking
grep -q "checkFile\|checkFunction\|checkClass\|checkEndpoint" subagents/reis_verifier.md && echo "✅ All deliverable types covered"

wc -l subagents/reis_verifier.md
```
</verify>
<done>
- Step 4 enhanced with FR4.1 Feature Completeness Validation
- Task parsing logic: extracts all tasks from PLAN.md
- Deliverable extraction: files, functions, classes, endpoints from task metadata
- Verification methods: file existence, grep patterns, git ls-files
- Confidence scoring: 0.7-1.0 scale for match quality
- Completion calculation: tasks complete / total tasks
- Report generation: task-by-task status with evidence or missing items
- Integration with existing success criteria validation
- Performance optimizations and error handling documented
</done>
</task>

## Success Criteria
- ✅ Step 4 of reis_verifier protocol enhanced with FR4.1
- ✅ Task parsing extracts all tasks from PLAN.md waves
- ✅ Deliverable extraction identifies files, functions, classes, endpoints
- ✅ Verification methods check file existence, code patterns, git history
- ✅ Confidence scoring prevents false positives
- ✅ Completion percentage calculated accurately
- ✅ Report format includes task-by-task breakdown
- ✅ Evidence provided for complete tasks
- ✅ Missing deliverables listed for incomplete tasks
- ✅ Integration with success criteria validation
- ✅ Clear PASS/FAIL determination: 100% = PASS, <100% = FAIL

## Verification

```bash
# Check Step 4 content
grep -A100 "Step 4.*Feature Completeness" subagents/reis_verifier.md | head -120

# Verify task parsing
grep -n "parseTasksFromPlan" subagents/reis_verifier.md

# Check deliverable types
grep -n "checkFile\|checkFunction\|checkClass\|checkEndpoint" subagents/reis_verifier.md

# Verify completion logic
grep -n "calculateCompleteness" subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
