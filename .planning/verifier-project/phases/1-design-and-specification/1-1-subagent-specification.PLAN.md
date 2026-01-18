# Plan: 1-1 - Create reis_verifier Subagent Specification

## Objective
Create comprehensive subagent specification document that defines the reis_verifier's role, protocol, integration points, and behavior patterns.

## Context
We're building the 4th REIS subagent (after planner, executor, gap_analyzer) to complete the autonomous development cycle: Plan → Execute → Verify → Iterate. The verifier must integrate seamlessly with existing REIS infrastructure and follow established subagent patterns.

**Key Files to Reference:**
- `subagents/reis_planner.md` - Subagent format and structure
- `subagents/reis_executor.md` - Integration patterns
- `lib/commands/verify.js` - Current verify command (stub)
- `lib/utils/state-manager.js` - STATE.md integration
- `.planning/verifier-project/REQUIREMENTS.md` - Full requirements

**Design Principles:**
- Verification must be automatable (no human-in-loop for basic checks)
- Support both phase-level and plan-level verification
- Clear pass/fail determination with evidence
- Actionable recommendations when verification fails
- Integrates with STATE.md for tracking

## Dependencies
None - This is Wave 1.1, first task in the project.

## Tasks

<task type="auto">
<name>Create reis_verifier subagent specification</name>
<files>subagents/reis_verifier.md</files>
<action>
Create a new subagent specification file following the exact format of `reis_planner.md` and `reis_executor.md`.

**Required Structure:**
1. **YAML frontmatter** with name, description, and tools list
2. **Role section** - Define what reis_verifier does (verify execution results against success criteria)
3. **Philosophy section** - Explain verification approach (automated, evidence-based, actionable)
4. **Seven-Step Verification Protocol**:
   - Step 1: Load Verification Context (PLAN.md, success criteria, test locations)
   - Step 2: Run Test Suite (npm test, capture output, parse results)
   - Step 3: Validate Success Criteria (check each criterion with evidence)
   - Step 4: Check Code Quality (syntax errors, linting if available)
   - Step 5: Verify Documentation (required docs exist, consistency)
   - Step 6: Generate Report (populate VERIFICATION_REPORT.md template)
   - Step 7: Update STATE.md (add verification entry, mark phase status)
5. **Input/Output Formats** - Define what verifier receives and produces
6. **Integration Points** - How it works with verify command, STATE.md, wave-executor
7. **Error Handling** - Graceful failures, clear error messages
8. **Examples Section** - At least 2 scenarios (passing verification, failing with recommendations)

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
- Generate reports in `.planning/verification/{phase-name}/` directory
- Update STATE.md without corrupting existing content
- Provide clear recommendations when verification fails

**What to Avoid:**
- ❌ Don't make it too rigid (some projects have no tests - that's OK with warning)
- ❌ Don't duplicate planner/executor patterns unnecessarily
- ❌ Don't make verification require human input (automation-first)
- ❌ Don't write documentation-style prose (this is a prompt for Claude)

**Implementation Notes:**
- Reference existing subagents for format consistency
- The verification protocol should be sequential (7 steps in order)
- Each step should be independently verifiable
- Aim for ~500 lines (similar to planner/executor specs)
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

# Verify reasonable length (~500 lines)
wc -l subagents/reis_verifier.md
```
</verify>
<done>
- subagents/reis_verifier.md exists with YAML frontmatter
- Contains Role, Philosophy, Seven-Step Protocol, Input/Output, Integration, Error Handling, Examples sections
- Protocol clearly defines 7 sequential verification steps
- At least 2 example scenarios included (passing and failing)
- File is ~400-600 lines (similar scope to planner/executor)
- Follows same format and style as existing subagents
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
- **reis_verifier**: Verifies execution results against success criteria, runs tests, validates quality, and generates verification reports
```

**Placement:** Add after reis_executor and before any examples/usage sections.

**If no subagent list exists**, add a new "Subagents" section after the main introduction:
```markdown
## Subagents

REIS uses specialized subagents for different phases of development:

- **reis_planner**: Creates executable plans with task breakdown and dependency analysis
- **reis_executor**: Executes plans, implementing tasks and tracking progress
- **reis_gap_analyzer**: Analyzes gaps between current state and goals
- **reis_verifier**: Verifies execution results against success criteria
```

**Keep it brief** - This is just a reference list, full details are in subagents/reis_verifier.md.
</action>
<verify>
```bash
# Check that README mentions reis_verifier
grep -q "reis_verifier" README.md && echo "✅ reis_verifier mentioned in README"

# Verify it's in a list with other subagents
grep -B5 -A5 "reis_verifier" README.md | grep -q "reis_planner\|reis_executor" && echo "✅ Listed with other subagents"
```
</verify>
<done>
- README.md includes reis_verifier in subagent list
- Listed alongside reis_planner, reis_executor, reis_gap_analyzer
- Brief description included (verification, testing, reporting)
</done>
</task>

## Success Criteria
- ✅ subagents/reis_verifier.md created with complete specification
- ✅ Seven-step verification protocol clearly defined
- ✅ Input/output formats specified
- ✅ Integration points documented
- ✅ At least 2 example scenarios included
- ✅ Follows same format as reis_planner.md and reis_executor.md
- ✅ README.md updated to reference new subagent
- ✅ Specification is actionable (can be executed by Claude directly)

## Verification

```bash
# Verify file structure
ls -lh subagents/reis_verifier.md

# Check content quality
cat subagents/reis_verifier.md | head -50
cat subagents/reis_verifier.md | grep "^## " | head -10

# Verify README update
grep -A3 "reis_verifier" README.md

# Line count check (~500 lines expected)
wc -l subagents/reis_verifier.md
```

---

*This plan will be executed by reis_executor in a fresh context.*
