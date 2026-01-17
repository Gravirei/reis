# REIS Quick Reference

## Commands to Ask Rovo Dev

### Project Setup

```
"Initialize a REIS project for [your idea]"
"Map this codebase with REIS"
"Research the project domain"
"Define requirements for this project"
"Create a roadmap with phases"
```

### Execution

```
"Plan phase [N]"
"Execute phase [N]"
"Execute phase [N] plans in parallel"
"Show me the current project state"
```

### Progress & Status

```
"What's the REIS project status?"
"Show me phase [N] progress"
"What are the current blockers?"
"Verify phase [N] work"
```

### Management

```
"Add a new phase for [feature]"
"Insert urgent work before phase [N]"
"Complete this milestone and start next"
"Pause work and create handoff"
"Resume work from last session"
```

## File Structure

```
.planning/
├── PROJECT.md              # Your project vision
├── REQUIREMENTS.md         # What's in/out of scope
├── ROADMAP.md             # Phases to complete
├── STATE.md               # Current state & memory
├── config.json            # Settings
├── research/              # Domain research
│   └── *.RESEARCH.md
└── phases/
    └── 1-foundation/
        ├── 1-01-setup.PLAN.md
        ├── 1-01-setup.SUMMARY.md
        ├── 1-02-core.PLAN.md
        └── 1-02-core.SUMMARY.md
```

## Task Types

| Type | When to Use | Behavior |
|------|-------------|----------|
| `auto` | Claude can do it independently | Fully autonomous |
| `checkpoint:human-verify` | Needs visual/functional check | Pauses for user |
| `checkpoint:decision` | Implementation choice needed | Pauses for user |
| `checkpoint:human-action` | Truly manual work (rare) | Pauses for user |

## Deviation Rules (What Executors Auto-Fix)

✅ **Auto-fix without asking:**
- Bugs (broken behavior, errors, typos)
- Critical gaps (missing validation, error handling)
- Blockers (wrong paths, missing deps)

❓ **Ask before fixing:**
- Architectural decisions (affects multiple components)
- Multiple valid approaches with tradeoffs

⏭️ **Skip and note:**
- Nice-to-haves (not critical for feature)

## Commit Format

```
{type}({date}): {description}

Examples:
feat(01-17): add user authentication endpoint
fix(01-17): correct password hashing logic
docs(01-17): add API documentation
test(01-17): add integration tests for auth
```

## Plan Template

```markdown
# Plan: 1-01 - Setup Database

## Objective
Set up PostgreSQL with Prisma ORM and create User table

## Context
Fresh project, need auth system. Using Prisma for type safety.

## Dependencies
None

## Tasks

<task type="auto">
<name>Initialize Prisma</name>
<files>prisma/schema.prisma, package.json</files>
<action>
Run: npm install prisma @prisma/client
Run: npx prisma init
Configure DATABASE_URL in .env
</action>
<verify>npx prisma validate</verify>
<done>Prisma is initialized and schema validates</done>
</task>

<task type="auto">
<name>Create User model</name>
<files>prisma/schema.prisma</files>
<action>
Add User model with:
- id (String, @id @default(uuid()))
- email (String, @unique)
- password (String)
- createdAt (DateTime, @default(now()))
</action>
<verify>npx prisma validate</verify>
<done>User model exists in schema</done>
</task>

<task type="auto">
<name>Run migration</name>
<files>prisma/migrations/</files>
<action>
Run: npx prisma migrate dev --name init-user
Run: npx prisma generate
</action>
<verify>npx prisma db pull && echo "DB connected"</verify>
<done>Migration applied, User table exists in database</done>
</task>

## Success Criteria
- Prisma is configured
- User model exists
- Migration applied
- Database connection works

## Verification
npx prisma studio # Opens database GUI
```

## State Management

### When to Update STATE.md

✅ After completing a phase
✅ When encountering blockers
✅ After making architectural decisions
✅ Before pausing work for the day

### What to Include

```markdown
## 2026-01-17 - Phase 1 Plan 1 Complete

**Completed:** 1-01-database-setup

**Objective:** Set up PostgreSQL with Prisma

**Status:** ✓ Complete

**Key outcomes:**
- Prisma configured with PostgreSQL
- User model created
- Initial migration applied

**Decisions made:**
- Using UUID for IDs (better for distributed systems)
- bcrypt with 10 rounds for passwords

**Blockers/Issues:** None
```

## Tips

### For Better Plans

✅ Be specific: "Create POST /api/login" not "Add login"
✅ Include verification: "curl returns 200" not "It works"
✅ Explain why: "Use jose (not jsonwebtoken - CommonJS issues)"
✅ Keep small: 2-3 tasks per plan

### For Faster Execution

✅ Minimize dependencies between plans
✅ Automate verification (tests, curl, scripts)
✅ Fix bugs immediately, don't ask
✅ Document deviations in SUMMARY

### For Long-Term Success

✅ Review STATE.md each session
✅ Keep PROJECT.md updated
✅ Archive completed milestones
✅ Refactor when needed, don't accumulate debt

## Common Patterns

### Adding a New Feature

1. "Add phase for [feature] to roadmap"
2. "Plan the new phase"
3. "Execute the new phase plans"
4. "Verify the feature works"

### Fixing Bugs

1. "Add urgent phase for bug fixes before phase [N]"
2. "Plan the bug fix phase"
3. "Execute bug fix plans"

### Refactoring

1. "Add refactoring phase to roadmap"
2. "Research refactoring approach"
3. "Plan refactoring with verification"
4. "Execute refactoring incrementally"

## Keyboard Shortcuts (Mental Model)

Think of these as your REIS commands:

- **New**: Initialize project
- **Map**: Analyze existing code
- **Plan**: Break down phase into tasks
- **Execute**: Run plans with subagents
- **Status**: Check progress
- **Verify**: Test completed work

---

**Pro tip:** Keep this file open in a tab for quick reference while working with REIS!
