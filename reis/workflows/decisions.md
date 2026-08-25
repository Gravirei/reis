# Workflow: Decision Tracking

Record architectural/technical decisions with full context, then list, view,
export, or revert them. Decisions persist in `.reis/decisions.json` so any
agent session can reconstruct why the project is built the way it is.

## Preconditions

- `.planning/` directory exists (if not, this is not a REIS project — run the
  new-project or map-codebase workflow first)
- For add mode: a decision was actually made (e.g. via the tree workflow's
  interactive selection, or an explicit user choice) — do not invent one
- `.reis/decisions.json` may not exist yet; create it as `[]` on first add

## Inputs

- Mode (required): `add`, `list [filters]`, `view <id>`, `export [--format]`
  (also supported: `revert <id> [--reason]`)
- Filters for list/export: `--tree <treeId>`, `--phase <phase>`,
  `--reverted`, `--limit <n>`

### Storage schema

`.reis/decisions.json` is a JSON array of records:

```json
{
  "id": "<uuid>",
  "treeId": "<tree name>",
  "selectedPath": ["<branch>", "..."],
  "metadata": { "weight": null, "priority": null, "risk": null },
  "context": { "phase": null, "task": null },
  "timestamp": "<ISO string>",
  "reverted": false,
  "revertedAt": "<ISO string, only when reverted>",
  "revertReason": "<string, only when reverted>"
}
```

## Steps

### add

1. Gather the inputs: treeId (which decision tree/topic), the selected path as
   an ordered array of branch labels, metadata from the chosen branch
   (weight/priority/risk/recommended), and context (current phase, task).
2. Generate a unique `id` (UUID), set `timestamp` to now (ISO), `reverted` to
   false.
3. Append the record to the array in `.reis/decisions.json` (create the file
   and `.reis/` directory if missing). Confirm to the user with the short id.

### list

4. Load all decisions, apply filters (by treeId, by `context.phase`, by
   `reverted` flag), sort most-recent first, apply `--limit`.
5. Display a table: short id (first 8 chars), tree, selected path joined with
   ` → `, date, Active/Reverted status. Empty result → say so plainly.

### view

6. Find the record by full or prefix-matched id; error if not found.
7. Show full detail: id, tree, timestamp, status (with revert reason/date if
   reverted), the selected path laid out step by step, and all metadata and
   context fields that are set.

### export

8. Apply the same filters as list, then write either JSON (records array,
   pretty-printed) or CSV (columns: ID, Tree ID, Selected Path, Timestamp,
   Reverted, Phase, Task, Weight, Priority, Risk — quote fields containing
   commas/quotes/newlines).
9. Default output filename: `decisions-export-<timestamp>.<ext>` unless
   `--output <path>` was given. Report path, format, and record count, and
   optionally offer summary statistics (total/active/reverted, counts by tree
   and phase, decisions from the last 7 days).

## Completion criteria

- add: a schema-valid record exists in `.reis/decisions.json` with a unique id
- list/view: output reflects exactly what is stored, including reverted status
- export: file written at the reported path with the stated record count

## References

- @reis/workflows/tree.md (interactive selection that usually produces the
  record added here)
- @agents/reis_synthesizer (when several parallel research outcomes must be
  turned into one recorded decision)

<!-- Migration note: from lib/commands/decisions.ts +
lib/utils/decision-tracker.ts. CLI table/banners replaced by plain tables;
delete mode dropped (revert covers undo); stats folded into export mode step. -->
