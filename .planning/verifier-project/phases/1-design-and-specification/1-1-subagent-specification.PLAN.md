# Plan: 1-1 - Create reis_verifier Subagent Specification

## Objective
Create comprehensive subagent specification document that defines the reis_verifier's role, protocol, integration points, and behavior patterns, including FR4.1 Feature Completeness Validation.

## Context
We're building the 4th REIS subagent (after planner, executor, gap_analyzer) to complete the autonomous development cycle: Plan → Execute → Verify → Iterate. The verifier must integrate seamlessly with existing REIS infrastructure and follow established subagent patterns.

**CRITICAL ENHANCEMENT:** FR4.1 Feature Completeness Validation ensures the executor didn't skip tasks/features. This is a MUST-HAVE capability that detects missing implementations.

**Key Files to Reference:**
- `subagents/reis_planner.md` - Subagent format and structure
- `subagents/reis_executor.md` - Integration patterns
- `lib/commands/verify.js` - Current verify command (stub)
- `lib/utils/state-manager.js` - STATE.md integration
- `.planning/verifier-project/REQUIREMENTS.md` - Full requirements including FR4.1

**Design Principles:**
- Verification must be automatable (no human-in-loop for basic checks)
- Support both phase-level and plan-level verification
- Clear pass/fail determination with evidence
- Actionable recommendations when verification fails
- Integrates with STATE.md for tracking
- **DETECTS MISSING FEATURES** (FR4.1) - Critical for catching skipped tasks

## Dependencies
None - This is Wave 1.1, first task in the project.

## Tasks

<task type="auto">
<name>Create reis_verifier subagent specification with FR4.1</name>
<files>subagents/reis_verifier.md</files>
<action>
Create a new subagent specification file following the exact format of `reis_planner.md` and `reis_executor.md`.

**Required Structure:**
1. **YAML frontmatter** with name, description, and tools list
2. **Role section** - Define what reis_verifier does (verify execution results against success criteria, detect missing features)
3. **Philosophy section** - Explain verification approach (automated, evidence-based, actionable, completeness-focused)
4. **Seven-Step Verification Protocol** (ENHANCED with FR4.1):
   - Step 1: Load Verification Context (PLAN.md, success criteria, test locations)
   - Step 2: Run Test Suite (npm test, capture output, parse results)
   - Step 3: Validate Code Quality (syntax errors, linting if available)
   - Step 4: **Validate Success Criteria & Feature Completeness** (FR4.1 INTEGRATION)
     * Parse all tasks from PLAN.md waves
     * Extract expected deliverables (files, functions, endpoints, features)
     * Verify each deliverable exists in codebase
     * Check file existence (fs.existsSync, git ls-files)
     * Pattern matching (grep for functions/classes/endpoints)
     * Git diff analysis (what was actually added)
     * Test existence verification
     * Calculate task completion percentage (Tasks completed / Total tasks)
     * Report missing implementations with evidence
     * **RULE: 100% task completion = PASS, <100% = FAIL**
   - Step 5: Verify Documentation (required docs exist, consistency)
   - Step 6: Generate Report (populate VERIFICATION_REPORT.md template with completeness section)
   - Step 7: Update STATE.md (add verification entry, mark phase status)
5. **Input/Output Formats** - Define what verifier receives and produces
6. **Integration Points** - How it works with verify command, STATE.md, wave-executor
7. **Error Handling** - Graceful failures, clear error messages
8. **Examples Section** - At least 3 scenarios:
   - Example 1: Passing verification (all tasks complete, tests pass)
   - Example 2: Failing with test errors
   - Example 3: **Failing with missing features (FR4.1 scenario)** - Shows executor skipped Task 2, verifier detects and reports

**FR4.1 Feature Completeness Section (CRITICAL):**

Add a dedicated section after the protocol steps:

```markdown
## Feature Completeness Validation (FR4.1)

### Problem
Executors may skip tasks without errors or test failures, leaving features unimplemented. This validation ensures ALL planned tasks are actually built.

### Detection Strategy

**1. Task Parsing**
Parse PLAN.md to extract all tasks from all waves:
```xml
<task type="auto">
<name>Build User Login</name>
<files>src/auth/login.js, test/auth/login.test.js</files>
...
```

**2. Deliverable Extraction**
From task name, files, and action, extract expected deliverables:
- Files: "Create X.js" → Expect file X.js
- Functions: "Implement authenticateUser()" → Grep for authenticateUser
- Classes: "Add UserModel class" → Search for class UserModel
- Endpoints: "Build POST /api/login" → Check routes for /api/login
- Features: "Login feature" → Validate login code/tests exist

**3. Verification Methods**
- **File existence**: `fs.existsSync(path)`, `git ls-files | grep pattern`
- **Code patterns**: `grep -r "functionName" src/`, `grep -r "class ClassName"`
- **Git diff**: `git diff HEAD~1..HEAD` to see what was actually added
- **Test presence**: Check for corresponding test files
- **Documentation**: Check if feature is documented

**4. Completion Calculation**
```javascript
const completionRate = tasksCompleted / totalTasks * 100;
const status = completionRate === 100 ? 'PASS' : 'FAIL';
```

**5. Evidence Collection**
For each task, collect:
- ✅ COMPLETE: List found files/functions with line numbers
- ❌ INCOMPLETE: List missing deliverables with search evidence

**6. Report Format**
```markdown
## Feature Completeness: ❌ INCOMPLETE (66%)

### Tasks: 2/3 Completed

#### ✅ Task 1: Build User Login
Status: Complete
Evidence:
  - File: src/auth/login.js exists (line 1-45)
  - Function: authenticateUser() found at line 15
  - Test: test/auth/login.test.js exists

#### ❌ Task 2: Build Password Reset
Status: INCOMPLETE - FEATURE MISSING
Missing Deliverables:
  - File: src/auth/password-reset.js NOT FOUND
  - Function: sendResetEmail() NOT FOUND (grep returned 0 matches)
  - Endpoint: POST /api/reset-password NOT FOUND in routes
  - Test: test/auth/password-reset.test.js NOT FOUND
Impact: HIGH - Critical auth feature missing
Recommendation: Executor must implement Task 2 before proceeding

#### ✅ Task 3: Build Profile Page
Status: Complete
Evidence:
  - File: src/pages/profile.js exists
  - Component: ProfilePage found at line 10
```

### Implementation Notes
- Handle refactoring gracefully (renamed files/functions)
- Confidence scoring: 0-100% per deliverable
- False positive prevention: Don't flag legitimate architectural changes
- Context-aware: Understand file moves, renames, consolidation
- Smart matching: Accept close variants (loginUser vs authenticateUser if functionality matches)

### Anti-Patterns
❌ Don't flag every missing file as incomplete (some may be consolidated)
❌ Don't require exact naming matches (accept reasonable variants)
❌ Don't fail on refactored code (detect equivalent implementations)
✅ DO flag completely missing functionality
✅ DO require clear evidence for completion
✅ DO calculate accurate completion percentage
```

**Key Patterns to Follow:**
- Tools list: open_files, create_file, expand_code_chunks, find_and_replace_code, grep, expand_folder, bash
- Use subsections with clear headers (##, ###)
- Include specific code examples in fenced blocks
- Document anti-patterns to avoid
- Write in direct, actionable language (this is a prompt for Claude)

**Critical Details:**
- Verification must work for both individual plans and full phases
- Support test frameworks: Jest, Vitest, Node test runner, npm test
- Parse test output for pass/fail/pending counts
- Handle projects without tests gracefully (report as warning, not failure)
- **FR4.1: Always check task-level completeness (non-negotiable)**
- Generate reports in `.planning/verification/{phase-name}/` directory
- Update STATE.md without corrupting existing content
- Provide clear recommendations when verification fails

**What to Avoid:**
- ❌ Don't make it too rigid (some projects have no tests - that's OK with warning)
- ❌ Don't duplicate planner/executor patterns unnecessarily
- ❌ Don't make verification require human input (automation-first)
- ❌ Don't write documentation-style prose (this is a prompt for Claude)
- ❌ **Don't skip FR4.1 feature completeness checks** (this catches executor shortcuts)

**Implementation Notes:**
- Reference existing subagents for format consistency
- The verification protocol should be sequential (7 steps in order)
- Each step should be independently verifiable
- Aim for ~550 lines (includes FR4.1 section, up from ~500)
- FR4.1 adds ~50 lines to specification
</action>
<verify>
```bash
# Check file exists and has correct structure
test -f subagents/reis_verifier.md && echo "✅ File created"

# Verify YAML frontmatter
head -n 15 subagents/reis_verifier.md | grep -q "name: reis_verifier" && echo "✅ YAML frontmatter present"

# Check for key sections
grep -q "## Role" subagents/reis_verifier.md && echo "✅ Role section present"
grep -q "## Philosophy" subagents/reis_verifier.md && echo "✅ Philosophy section present"
grep -q "Seven-Step\|7-Step\|Step 1:" subagents/reis_verifier.md && echo "✅ Protocol defined"
grep -q "## Examples" subagents/reis_verifier.md && echo "✅ Examples section present"

# FR4.1 specific checks
grep -q "Feature Completeness\|FR4.1" subagents/reis_verifier.md && echo "✅ FR4.1 Feature Completeness included"
grep -q "Task Parsing\|Deliverable Extraction" subagents/reis_verifier.md && echo "✅ FR4.1 implementation details present"
grep -q "completionRate\|tasksCompleted" subagents/reis_verifier.md && echo "✅ Completion calculation logic present"

# Verify reasonable length (~550 lines including FR4.1)
LINE_COUNT=$(wc -l < subagents/reis_verifier.md)
echo "Line count: $LINE_COUNT (expected ~500-600 with FR4.1)"
```
</verify>
<done>
- subagents/reis_verifier.md exists with YAML frontmatter
- Contains Role, Philosophy, Seven-Step Protocol, Input/Output, Integration, Error Handling, Examples sections
- Protocol clearly defines 7 sequential verification steps with FR4.1 integrated into Step 4
- FR4.1 Feature Completeness section included with detection strategy, methods, and examples
- At least 3 example scenarios included (passing, failing tests, failing completeness)
- File is ~500-600 lines (includes FR4.1 enhancement)
- Follows same format and style as existing subagents
- FR4.1 task parsing, deliverable extraction, and completion calculation fully documented
</done>
</task>

<task type="auto">
<name>Add reis_verifier to subagent documentation</name>
<files>README.md</files>
<action>
Update the main README.md to include reis_verifier in the list of subagents.

**Location:** Find the section that lists REIS subagents (likely under "Architecture" or "Subagents" heading).

**Add Entry:**
```markdown
- **reis_verifier**: Verifies execution results against success criteria, runs tests, validates quality, detects missing features (FR4.1), and generates verification reports
```

**Placement:** Add after reis_executor and before any examples/usage sections.

**If no subagent list exists**, add a new "Subagents" section after the main introduction:
```markdown
## Subagents

REIS uses specialized subagents for different phases of development:

- **reis_planner**: Creates executable plans with task breakdown and dependency analysis
- **reis_executor**: Executes plans, implementing tasks and tracking progress
- **reis_gap_analyzer**: Analyzes gaps between current state and goals
- **reis_verifier**: Verifies execution results, validates feature completeness, and generates reports
```

**Keep it brief** - This is just a reference list, full details are in subagents/reis_verifier.md.
</action>
<verify>
```bash
# Check that README mentions reis_verifier
grep -q "reis_verifier" README.md && echo "✅ reis_verifier mentioned in README"

# Verify it's in a list with other subagents
grep -B5 -A5 "reis_verifier" README.md | grep -q "reis_planner\|reis_executor" && echo "✅ Listed with other subagents"

# Check for feature completeness mention
grep "reis_verifier" README.md | grep -q "completeness\|FR4.1\|missing features" && echo "✅ Feature completeness capability mentioned"
```
</verify>
<done>
- README.md includes reis_verifier in subagent list
- Listed alongside reis_planner, reis_executor, reis_gap_analyzer
- Brief description included (verification, testing, feature completeness, reporting)
- Mentions FR4.1 capability (detecting missing features)
</done>
</task>

## Success Criteria
- ✅ subagents/reis_verifier.md created with complete specification
- ✅ Seven-step verification protocol clearly defined
- ✅ **FR4.1 Feature Completeness Validation fully integrated into Step 4**
- ✅ Task parsing, deliverable extraction, and completion calculation documented
- ✅ Input/output formats specified
- ✅ Integration points documented
- ✅ At least 3 example scenarios included (passing, failing tests, failing completeness)
- ✅ Follows same format as reis_planner.md and reis_executor.md
- ✅ README.md updated to reference new subagent with FR4.1 capability
- ✅ Specification is actionable (can be executed by Claude directly)
- ✅ FR4.1 detection methods clearly defined (file checks, pattern matching, git diff)

## Verification

```bash
# Verify file structure
ls -lh subagents/reis_verifier.md

# Check content quality
cat subagents/reis_verifier.md | head -50
cat subagents/reis_verifier.md | grep "^## " | head -15

# Verify FR4.1 integration
grep -n "FR4.1\|Feature Completeness\|Task Parsing" subagents/reis_verifier.md | head -10

# Verify README update
grep -A3 "reis_verifier" README.md

# Line count check (~550 lines expected with FR4.1)
wc -l subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
