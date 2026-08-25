# Reference: Context Budgets

Guidance for keeping REIS sessions within a healthy context budget.
Cold-start cost is dominated by installed command descriptions; per-task
cost is dominated by how many workflows/references are loaded at once.

## Budget table

| Artifact | Approx cost | Loading rule |
|---|---|---|
| Command description (frontmatter) | ~30–50 tokens | Always loaded (skill/command listing) |
| Dispatcher body | ~200–400 tokens | On invocation |
| Workflow file | ~1–2k tokens | On invocation via @-reference |
| Reference file | ~0.8–1.5k tokens | Only when the workflow cites it |
| Context primer | ~1k tokens | Once per phase boundary |
| STATE.md | ~300–800 tokens | When reading/updating state |

## Rules

1. A command loads its own workflow plus at most 2 supporting files.
   Anything more is a signal the workflow is too thin.
2. Never load all references "just in case" — cite exactly what's needed.
3. Workflows must not inline other workflows; @-reference them instead so
   content loads once, on demand.
4. Profiles exist to cap cold start: `core` ≈ 11 command descriptions,
   `full` = 30. Prefer core on token-limited setups
   (`reis install --profile=core`).
5. Large generated artifacts (reports) are written to disk, not echoed in
   full; summarize in chat, keep details in the file.
