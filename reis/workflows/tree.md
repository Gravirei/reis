# Workflow: Decision Tree Selection

Walk a structured decision tree with the user to choose between alternatives
(auth strategy, database, state management, etc.), plus lint, diff, and export
modes for tree files. Trees are markdown files where each tree starts with
`## Decision Tree: [Name]`.

## Preconditions

- For show/select: a tree markdown file path (project-local or from the seven
  built-ins under `templates/decision-trees/`: `api-design`, `auth`,
  `database`, `deployment`, `state-management`, `styling`, `testing`)
- For diff: two readable tree files
- No planning directory required — trees work in any repo

## Inputs

- Mode (required, default `list`):
  - `show <file>` — display trees; add `--interactive` to walk one
  - `new <template> [--output <path>]` — copy a built-in template into the
    project (default destination `decision-trees/<name>.md`)
  - `list` — enumerate available templates with their titles
  - `lint <file> [--strict]` — semantic checks per tree
  - `diff <file1> <file2> [--verbose]` — compare two versions of a tree
  - `export <file> --format html|svg|mermaid|json|all [--output <base>]`

## Steps

### show / interactive selection

1. Read the file; parse every `## Decision Tree:` section. None found → report
   the expected heading format and stop.
2. Non-interactive: render each tree as an indented branch outline with
   conditions and metadata visible.
3. Interactive: start at the root question. Present each child branch with its
   description/metadata (weight, priority, risk, recommended marker), ask the
   user to choose, and follow the selected branch until reaching a leaf.
   Evaluate any conditions against provided context before offering branches.
4. Summarize the completed selection: tree name, chosen path, branch rationale.
5. Ask whether to record it; if yes, write the record via the decisions
   workflow (treeId, selectedPath, metadata, context).

### new

6. Copy `templates/decision-trees/<name>.md` to the requested path (create
   parent directories). Suggest next steps: edit the file, then show/lint it.

### list

7. List the seven built-in templates above with their titles; note that any
   project-local tree file works with the other modes too.

### lint

8. For each tree in the file, check structure and semantics (unreachable
   branches, missing descriptions, condition errors, duplicate paths).
9. Report errors and warnings per tree with fix suggestions (`--verbose`).
   Errors → fail. Warnings → pass, unless `--strict`.

### diff

10. Parse both files; match trees by name when multiple exist (warn if names
    differ). Report added/removed/modified branches and changed metadata;
    `--verbose` shows per-field detail. Any change → nonzero exit signal.

### export

11. Export each tree to the requested format(s) using the tree name
    (kebab-cased) as default base filename; `all` produces html + svg + mmd +
    json together. Report every written path.

## Completion criteria

- show/interactive: the user reached a leaf and (if accepted) a decision
  record exists in `.reis/decisions.json`
- lint/diff: every issue found was reported with location and suggestion
- export/new/list: all promised files/entries exist and were listed accurately

## References

- @templates/decision-trees/*.md (the seven built-in trees)
- @reis/workflows/decisions.md (record schema written on confirmation)

<!-- Migration note: from lib/commands/tree.ts +
lib/utils/decision-tree-{parser,interactive,linter,differ,exporter}.ts.
TUI rendering replaced by plain outlines/questions; validate mode merged into
lint (structural checks are part of lint reporting). -->
