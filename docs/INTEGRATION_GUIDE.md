# REIS Integration with Rovo Dev

This guide explains how REIS methodology has been integrated into Rovo Dev and how to use it.

## What Was Integrated

### 1. Specialized Subagents

Three REIS-specific subagents have been added to `~/.rovodev/subagents/`:

- **reis_planner.md** - Creates executable phase plans with atomic tasks
- **reis_executor.md** - Executes plans with git commits and verification
- **reis_project_mapper.md** - Maps codebases and initializes REIS structure

### 2. Documentation & Templates

Created in `~/.rovodev/reis/`:

- **README.md** - Complete REIS overview and philosophy
- **QUICK_REFERENCE.md** - Cheat sheet for daily use
- **templates/** - Project templates (PROJECT.md, PLAN.md, etc.)

### 3. Workflow Integration

REIS workflows are available through natural language commands to Rovo Dev.

## How to Use REIS with Rovo Dev

### Method 1: Natural Language Commands

Just ask Rovo Dev! Examples:

```
"Initialize a REIS project for a habit tracking app"
"Map this codebase with REIS methodology"
"Plan phase 1 of the roadmap"
"Execute phase 1 plans in parallel"
"Show me the current REIS project status"
```

### Method 2: Direct Subagent Invocation

Rovo Dev will automatically invoke the appropriate subagent based on your request.

**Behind the scenes:**
- "Map this codebase" → Invokes `reis_project_mapper`
- "Plan phase 1" → Invokes `reis_planner`
- "Execute phase 1" → Invokes `reis_executor` (multiple times in parallel)

### Method 3: Manual Workflow

If you want more control:

1. **Create project structure manually:**
   ```bash
   mkdir -p .planning/phases
   cp ~/.rovodev/reis/templates/PROJECT.md .planning/
   ```

2. **Ask Rovo Dev to fill it in:**
   ```
   "Help me fill out the PROJECT.md for [your idea]"
   ```

3. **Continue with natural commands**

## Example Workflows

### Greenfield Project (New App)

**Session 1: Setup**
```
You: "Initialize a REIS project for a task management app with Kanban boards"

Rovo Dev: [Creates .planning/ structure, PROJECT.md]

You: "Define requirements - must have: tasks, boards, drag-drop. Should have: labels. Won't have: teams"

Rovo Dev: [Creates REQUIREMENTS.md]

You: "Create a roadmap with 3 phases: foundation, core features, polish"

Rovo Dev: [Creates ROADMAP.md with phases]
```

**Session 2: Planning**
```
You: "Plan phase 1"

Rovo Dev: [Invokes reis_planner subagent]
          [Creates PLAN.md files in .planning/phases/1-foundation/]
          
Output: ✓ Created 3 plans for Phase 1: Foundation
        Wave 1: 1-01-setup.PLAN.md, 1-02-database.PLAN.md
        Wave 2: 1-03-api.PLAN.md
```

**Session 3: Execution**
```
You: "Execute phase 1"

Rovo Dev: [Invokes reis_executor for each plan]
          [Plans in Wave 1 run in parallel]
          [Each task gets atomic git commit]
          [Creates SUMMARY.md for each plan]
          
Output: ✓ Phase 1 complete!
        - 1-01-setup: ✓ Complete (3 tasks, 3 commits)
        - 1-02-database: ✓ Complete (2 tasks, 2 commits)
        - 1-03-api: ✓ Complete (3 tasks, 3 commits)
```

### Brownfield Project (Existing Code)

**Session 1: Discovery**
```
You: "Map this codebase with REIS"

Rovo Dev: [Invokes reis_project_mapper]
          [Analyzes your code]
          [Creates STACK.md, ARCHITECTURE.md, etc.]
          
Output: ✓ Codebase mapped!
        Created: STACK.md, ARCHITECTURE.md, STRUCTURE.md,
                 CONVENTIONS.md, TESTING.md, INTEGRATIONS.md,
                 CONCERNS.md
```

**Session 2: Planning Improvements**
```
You: "Create a REIS project for improving the timer system based on the mapped code"

Rovo Dev: [Reads mapped docs]
          [Creates PROJECT.md focused on timer improvements]

You: "Define requirements for timer improvements"

Rovo Dev: [Creates REQUIREMENTS.md]

You: "Create roadmap"

Rovo Dev: [Creates ROADMAP.md]
```

**Session 3+: Same as greenfield from planning onwards**

## Tips for Success

### 1. Start with Good Project Definition

The quality of PROJECT.md determines the quality of everything else.

✅ Be specific about what you're building
✅ Clearly define what's out of scope
✅ Document key technical decisions
✅ Include constraints (timeline, team size, etc.)

### 2. Keep Plans Small

Plans should be 2-3 tasks each:

✅ Allows parallel execution
✅ Fits in one context window
✅ Reduces chance of deviation
✅ Makes verification easier

### 3. Trust Automation

Let executors fix bugs and gaps automatically:

✅ Executors will auto-fix broken code
✅ Executors will fill critical gaps
✅ Executors will document deviations

❓ Only pause for architectural decisions

### 4. Update STATE.md Regularly

STATE.md is your memory across sessions:

✅ Update after completing phases
✅ Document decisions and why
✅ Track blockers immediately
✅ Note lessons learned

### 5. Verify Everything

Build verification into plans:

✅ Include test commands
✅ Use curl for API verification
✅ Check for specific outputs
✅ Automate verification (no "looks good")

## Integration with Existing Rovo Dev Features

### Git Integration

REIS creates atomic commits:

```bash
# Each task gets its own commit
git log --oneline
abc123f feat(01-17): add user authentication endpoint
def456g feat(01-17): create login form component
hij789k test(01-17): add auth integration tests
```

Benefits:
- `git bisect` finds exact failing task
- Each task independently revertable
- Clear history for debugging

### MCP Tools Integration

REIS can leverage Rovo Dev's MCP tools:

**Jira Integration:**
```
You: "Create Jira issues for Phase 1 tasks"

Rovo Dev: [Reads PLAN.md files]
          [Creates Jira tasks with appropriate details]
```

**Confluence Integration:**
```
You: "Document Phase 1 architecture in Confluence"

Rovo Dev: [Reads ARCHITECTURE.md and SUMMARY.md files]
          [Creates Confluence page with diagrams]
```

**Diagram Generation:**
```
You: "Generate architecture diagram from ARCHITECTURE.md"

Rovo Dev: [Uses diagram MCP tools]
          [Creates C4, Mermaid, or other diagram formats]
```

### Supabase Integration

For Supabase projects:

```
You: "Execute phase 1 and deploy edge functions to Supabase"

Rovo Dev: [Executes plans]
          [Uses Supabase MCP to deploy]
          [Updates STATE.md with deployment status]
```

## Troubleshooting

### "Subagent not found"

Check that subagent files exist:
```bash
ls ~/.rovodev/subagents/reis_*.md
```

Should see: reis_planner.md, reis_executor.md, reis_project_mapper.md

### "Plans aren't executing"

1. Check `.planning/` exists and has correct structure
2. Verify PLAN.md files are in correct format
3. Check STATE.md for blockers
4. Try executing one plan at a time

### "Too many deviations"

Plans might be too vague:
1. Add more specificity to `<action>` sections
2. Include more context about why
3. Add better verification commands
4. Break large tasks into smaller ones

### "Context issues"

If you think context is filling up:
1. Each subagent gets fresh 200k context
2. Check that plans are small (2-3 tasks)
3. Ensure executors are finishing and exiting
4. Review STATE.md to confirm progress

## Advanced Usage

### Custom Planning

```
You: "Plan phase 2 with focus on performance optimization"

Rovo Dev: [Invokes reis_planner with performance context]
          [Creates plans with performance verification]
```

### Gap Closure

```
You: "Phase 1 verification found issues with auth timeout. Create gap closure plan"

Rovo Dev: [Invokes reis_planner in gap closure mode]
          [Creates targeted fix plans]
```

### Research Integration

```
You: "Research best practices for WebSocket implementation before planning phase 3"

Rovo Dev: [Spawns research subagent]
          [Creates RESEARCH.md in .planning/research/]
          [Uses research context for planning]
```

### Milestone Management

```
You: "Complete v1.0 milestone and archive"

Rovo Dev: [Verifies all phases complete]
          [Creates MILESTONE_v1.0.md summary]
          [Archives to .planning/milestones/]
          [Prepares for v2.0]
```

## Configuration

### Custom Subagent Tools

You can customize which tools each subagent has access to by editing:

```bash
~/.rovodev/subagents/reis_planner.md     # Planning tools
~/.rovodev/subagents/reis_executor.md    # Execution tools
~/.rovodev/subagents/reis_project_mapper.md  # Analysis tools
```

### Project-Specific Config

Create `.planning/config.json`:

```json
{
  "commitFormat": "conventional",
  "branchPrefix": "reis/",
  "verificationRequired": true,
  "parallelExecution": true,
  "maxPlansPerWave": 3
}
```

## Best Practices Summary

✅ **Do:**
- Keep PROJECT.md current
- Update STATE.md frequently
- Make plans small (2-3 tasks)
- Automate verification
- Trust executor deviations
- Review CONCERNS.md periodically

❌ **Don't:**
- Let context fill up (use subagents)
- Make vague plans
- Skip verification
- Batch commits
- Ignore technical debt
- Forget to update STATE.md

## Getting Help

**Documentation:**
- Main guide: `~/.rovodev/reis/README.md`
- Quick reference: `~/.rovodev/reis/QUICK_REFERENCE.md`
- This guide: `~/.rovodev/reis/INTEGRATION_GUIDE.md`

**Templates:**
- `~/.rovodev/reis/templates/` - All project templates

**Subagent Configs:**
- `~/.rovodev/subagents/reis_*.md` - Subagent definitions

**Ask Rovo Dev:**
```
"How do I [X] with REIS?"
"Show me an example of [Y]"
"What's the current REIS project status?"
```

---

## Next Steps

1. **Try a small project first** - Start with something simple to learn the workflow
2. **Review the Quick Reference** - Keep it handy while working
3. **Map your existing code** - If working on existing project
4. **Start planning** - Break down your first feature with REIS

**Ready to get started?** Ask Rovo Dev:
```
"Initialize a REIS project for [your idea]"
```

Happy building! 🚀
