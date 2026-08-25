---
name: reis:requirements
description: Define or refine numbered, testable requirements in .planning/REQUIREMENTS.md with milestone/priority grouping and traceability. Use when capturing scope or changing requirements in a REIS project.
argument-hint: "[change description]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---
<objective>
Create or update `.planning/REQUIREMENTS.md` with stable, verifiable
requirement IDs (grouped by milestone and Must/Should/Won't Have) that plans
and verification can trace back to.
</objective>

<execution_context>
@~/.claude/reis/workflows/requirements.md
@~/.claude/reis/references/state-format.md
@~/.claude/reis/contexts/planning.md
</execution_context>

<process>
Read `$ARGUMENTS` as the requested feature additions or scope changes (may be
empty for an initial pass).

Then follow the referenced workflow end-to-end.
- If `.planning/` does not exist, this is not a REIS project yet — recommend
  `/reis:new-project` (greenfield) or `/reis:map` (existing codebase).
- Preserve existing REQ IDs; ask when requirements are ambiguous or untestable;
  never invent scope silently.
- After requirements are set, suggest `/reis:roadmap` to phase them.
</process>
