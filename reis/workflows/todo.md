# Workflow: Todo Management

Add TODO items to and list TODO items from the project's planning state so
small follow-up work is never lost between phases.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- For add mode: a non-empty description is provided (if absent, ask for one —
  never create empty TODO entries)
- A TODOs section exists in `.planning/STATE.md`; create one if missing

## Inputs

- Mode (required): `add <description>` or `list [area]`
- For list: an optional area name to filter by

## Steps

### add

1. Confirm the description with the user if it is ambiguous (one line is fine).
2. Decide context worth recording: which phase/task surfaced the item, and any
   priority (high/medium/low).
3. Append to the TODOs section of `.planning/STATE.md`:

   ```markdown
   - [ ] <description> (added: YYYY-MM-DD, phase: <N|->, priority: <level>)
   ```

4. Keep existing entries untouched; do not reorder or reformat other content.

### list

5. Read the TODOs section of `.planning/STATE.md`.
6. If no area argument was given, group TODOs by area (phase, or topic inferred
   from the description) and display each with its status indicator:
   `- [ ]` pending, `- [x]` done.
7. If an area argument was given, display only TODOs matching that area
   (match against phase reference or keywords in the description), showing
   status and priority for each.
8. If there are no matching TODOs, say so explicitly.
9. Offer to promote any TODO into a proper roadmap phase (`reis add`) when it
   looks too large to remain a TODO.

## Completion criteria

- add: the new entry appears exactly once in STATE.md's TODOs section with a
  date and context, and no unrelated content changed
- list: every TODO (or every TODO in the requested area) was reported with
  correct status indicators and priorities

## References

- @reis/references/state-format.md (where the TODOs section lives)
- @reis/workflows/roadmap-edit.md (promoting a TODO into a real phase)

<!-- Migration note: from lib/commands/todo.ts + lib/commands/todos.ts.
Both printed canned prompts; expanded into the concrete read/write steps above.
TODOs live in .planning/STATE.md, not a separate file. -->
