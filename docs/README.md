# REIS (Roadmap Execution & Implementation System) for Rovo Dev

This directory contains the REIS (Roadmap Execution & Implementation System) methodology integrated into Rovo Dev.

## What is REIS?

REIS is a **meta-prompting, context engineering, and spec-driven development system** that solves context rot by using fresh subagents for each task, maintaining structured documentation, and executing work in atomic, verifiable chunks.

## Key Benefits

✅ **No Context Degradation** - Fresh 200k context per task via subagents
✅ **Atomic Execution** - Each task gets its own git commit
✅ **Parallel Execution** - Independent plans run simultaneously  
✅ **Structured Documentation** - Always-loaded context files guide execution
✅ **Traceable Work** - Every decision, blocker, and change is documented

## Architecture

### Subagents

Three specialized subagents power the REIS workflow:

1. **reis_planner** - Creates executable phase plans with task breakdown
2. **reis_executor** - Executes plans with atomic commits and deviation handling
3. **reis_project_mapper** - Maps existing codebases and bootstraps REIS structure

### Documentation Structure

REIS maintains these files in `.planning/`:

```
.planning/
├── PROJECT.md              # Project vision (always loaded)
├── REQUIREMENTS.md         # Scoped requirements with traceability
├── ROADMAP.md             # Phases and progress
├── STATE.md               # Living memory across sessions
├── config.json            # Project configuration
├── research/              # Ecosystem knowledge
│   └── *.RESEARCH.md
└── phases/
    └── {phase}-{name}/
        ├── {phase}-{plan}-{slug}.PLAN.md
        └── {phase}-{plan}-{slug}.SUMMARY.md
```

## Workflows

### New Project (Greenfield)

```bash
# 1. Initialize project
"Create a new REIS project for [your idea]"
# → Spawns reis_project_mapper to create PROJECT.md

# 2. Research domain (optional but recommended)
"Research the project domain"
# → Spawns subagent to create research/ directory

# 3. Define requirements
"Define requirements for this project"
# → Creates REQUIREMENTS.md with v1/v2 scope

# 4. Create roadmap
"Create a roadmap for this project"
# → Creates ROADMAP.md with phases

# 5. Plan phase
"Plan phase 1"
# → Spawns reis_planner to create PLAN.md files

# 6. Execute phase
"Execute phase 1"
# → Spawns reis_executor for each plan in parallel
```

### Existing Project (Brownfield)

```bash
# 1. Map codebase first
"Map this codebase with REIS"
# → Creates STACK.md, ARCHITECTURE.md, etc.

# 2. Then continue with project initialization
"Create a REIS project for improving [feature]"
# → Uses mapped docs to create PROJECT.md

# 3-6. Same as greenfield workflow
```

## Usage Examples

### Ask Rovo Dev:

**Initialize REIS:**
```
"Initialize a REIS project for a habit tracking app with timer functionality"
```

**Map existing code:**
```
"Map this codebase with REIS methodology"
```

**Plan a phase:**
```
"Plan phase 1 of the roadmap"
```

**Execute work:**
```
"Execute phase 1 plans"
```

**Check progress:**
```
"What's the current REIS project status?"
```

## How It Works

### 1. Context Engineering

REIS creates structured documentation that's always available:
- `PROJECT.md` - Vision and goals
- `REQUIREMENTS.md` - What's in scope
- `ROADMAP.md` - Phases to complete
- `STATE.md` - Memory across sessions

### 2. Atomic Planning

Work is broken into small plans (2-3 tasks each):
- Each task is independently committable
- Verification is built into each task
- Dependencies are explicitly mapped

### 3. Parallel Execution

Plans without dependencies run simultaneously:
```
Wave 1 (parallel):
- Setup database schema
- Create design system
- Setup testing framework

Wave 2 (parallel, depends on Wave 1):
- Implement auth (needs schema)
- Build UI (needs design)
- Write tests (needs test framework)
```

### 4. Fresh Context

Each plan executes in a fresh subagent:
- 200k tokens per execution
- No accumulated context garbage
- Consistent quality throughout

### 5. Deviation Handling

Executors automatically:
- Fix bugs without asking
- Fill critical gaps
- Handle blockers
- Document all changes

## Integration Points

### With Rovo Dev Features

REIS integrates with existing Rovo Dev capabilities:

✅ **Subagents** - Uses `invoke_subagents` for parallel execution
✅ **File Operations** - Creates/edits code and documentation
✅ **Git Integration** - Atomic commits per task
✅ **Bash Commands** - Verification and testing
✅ **MCP Tools** - Can integrate Jira, Confluence for tracking

### With Your Workflow

REIS complements your process:
- **Planning** - Breaks down large features systematically
- **Execution** - Maintains quality as work scales
- **Documentation** - Auto-generates project context
- **State Management** - Never lose progress between sessions

## Best Practices

### For Planning

✅ Keep plans small (2-3 tasks)
✅ Make verification automatable
✅ Specify exact file paths
✅ Include "why" for non-obvious decisions

### For Execution

✅ Run verification after each task
✅ Commit atomically (one task = one commit)
✅ Fix bugs automatically
✅ Document deviations in SUMMARY.md

### For Long-Term Success

✅ Update STATE.md after each phase
✅ Review CONCERNS.md periodically
✅ Keep PROJECT.md current
✅ Archive completed milestones

## Troubleshooting

**"Plans aren't executing correctly"**
- Check if dependencies are met
- Review STATE.md for blockers
- Verify verification commands work

**"Too many deviations from plan"**
- Plans might be too vague
- Add more specificity to tasks
- Include more context in <action>

**"Execution is slow"**
- Check if plans are running in parallel
- Reduce task dependencies
- Break large tasks into smaller ones

**"Lost context between sessions"**
- Always read STATE.md first
- Update STATE.md before pausing
- Use "Resume work" workflow

## Philosophy

REIS is built on these principles:

1. **Claude automates everything automatable**
2. **Plans are prompts, not documentation**
3. **Context rot kills quality - avoid it with fresh agents**
4. **Ship fast, iterate continuously**
5. **No enterprise theater - just build**

## Resources

- Original REIS: https://github.com/glittercowboy/get-shit-done
- Subagents: `~/.rovodev/subagents/reis_*.md`
- This guide: `~/.rovodev/reis/README.md`

---

**Remember:** REIS is a methodology, not a rigid framework. Adapt it to your needs, skip steps that don't add value, and always prioritize shipping working software.
