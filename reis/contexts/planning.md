# Context: Planning Primer

Load this before creating or revising PLAN.md files.

## Read before planning — always, in this order

1. `.planning/ROADMAP.md` — the phase's Goal and Delivers define scope
2. `.planning/STATE.md` — prior progress, decisions, open questions, blockers
3. `.planning/PROJECT.md` + `.planning/REQUIREMENTS.md` — constraints
4. Existing research: `.planning/phases/phase-N/RESEARCH.md` and/or
   `.planning/research/*.md` (phase-{N}-research.md, context.md,
   tech-recommendations.md)

Never plan from memory of the roadmap alone; plans must be research-informed.
If no research exists for a complex/ambiguous phase, recommend running the
research workflow first.

## Wave sizing rules

| Size | Max tasks | Estimate | Use for |
|---|---|---|---|
| small | 3 | ~30 min | quick focused tasks |
| medium | 5 | ~60 min | standard development tasks |
| large | 8 | ~120 min | complex multi-step tasks |

Default is `medium` (`waves.defaultSize`). Prefer several small waves over one
large wave; split anything that would exceed its size cap.

## Dependency ordering

- Independent tasks share a wave; dependent tasks go in later waves
- The dependency graph must be acyclic — validate before writing the plan
- Every task not in wave 1 must name what it depends on
- With `--parallel`, up to 4 waves run concurrently; waves sharing files are
  NOT independent — sequence them

## What makes a good task

Every `<task>` block needs all four elements, concretely:

```xml
<task type="auto">
<name>Clear, specific task name</name>
<files>Exact file paths that will be touched</files>
<action>Specific instructions: commands, APIs, libraries;
        include what to avoid and WHY</action>
<verify>Command(s) proving it works</verify>
<done>Observable acceptance criteria</done>
</task>
```

A task fails review if any of these hold:

- Files are vague ("utils module") instead of real paths
- No runnable verify command (the executor will run it verbatim)
- "Done" is subjective ("works well") rather than observable
- It duplicates something already in the codebase (plan reviewer flags
  `already_complete`) or conflicts with an existing export

## Plan file format

Use `templates/PLAN.md`: Objective, Context, Dependencies (or "None"), Tasks,
Success Criteria, Verification (commands for the whole plan). Write to
`.planning/phases/<N>-<name>/PLAN.md`.

## After planning

Update STATE.md: set the active phase, note what was planned, record open
questions from discuss/assumptions modes. A plan should decompose a phase into
2–3 executable task plans with explicit dependencies between them.
