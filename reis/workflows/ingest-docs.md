# Workflow: Ingest Existing Docs

Bootstrap `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` drafts from
documents that already exist in the repo — ADRs, PRDs/specs, README
architecture sections — extracting only what the documents actually evidence.
This is the document-side sibling of the map-codebase workflow (map reads
code, ingest reads documents).

## Preconditions

- Repository root identifiable with document sources available: `docs/adr/`
  (or similar ADR directories), PRD/spec files (`docs/prd*`, `*spec*.md`,
  `REQUIREMENTS*`), README architecture sections
- No requirement may be invented: if a claim is not written in a source
  document, it does not enter the draft

## Inputs

- Optional flags:
  - `--docs-dir <path>` — root directory to scan (default: repo root, probing
    `docs/`, `adr/`, `doc/`, and top-level markdown)
- Existing `.planning/` files, if any — treated as protected (see step 6)
- Coordination input: results of a prior `/reis:map` run, when
  `.planning/PROJECT.md` already reflects code observations

## Steps

1. Inventory candidate documents: glob for ADRs (e.g. `docs/adr/*.md`,
   numbered `NNNN-title` files), PRD/spec files, README(s); list what was
   found before reading deeply.
2. **ADRs** → extract decided architecture constraints: each ADR yields its
   decision, status (accepted/superseded matters — superseded ones are noted,
   not enforced), and consequences.
3. **PRD/spec files** → extract stated goals, scope, functional requirements.
   Quote-or-paraphrase faithfully; record the source file per requirement.
4. **README architecture sections** → extract component structure, stack
   choices, integration points described in prose.
5. Draft outputs, each item annotated with a confidence note:
   - **High** — explicit statement in a current (non-superseded) source
   - **Medium** — implied or from older docs that may be stale
   - **Low** — single ambiguous mention; flagged, not asserted
   End REQUIREMENTS.md draft with an explicit **Open Questions** list for the
   user: ambiguities, contradictions between documents, gaps where a
   requirement seems expected but no document states one.
6. **Never overwrite without asking**: if `.planning/PROJECT.md` or
   `.planning/REQUIREMENTS.md` already exists, propose either a merge into
   the existing file (preferred) or a side-by-side draft
   (`*.draft.md`) — wait for the user's choice.
7. **Merge with reis:map when both ran**: if PROJECT.md already contains
   code-observed facts, reconcile — code evidence and document evidence that
   agree become High confidence; conflicts become Open Questions (never
   silently pick a winner).
8. Present the drafts: summary of extracted items per confidence level, full
   Open Questions list, and suggested next steps (`/reis:requirements` to
   firm up, answer Open Questions, or run `/reis:map` if code wasn't mapped).

## Completion criteria

- Every drafted requirement/decision traces to a named source document
- Confidence notes and the Open Questions list exist on every draft
- No existing `.planning/` file was overwritten without explicit approval
- Overlap with a prior map-codebase run was reconciled or explicitly flagged

## References

- @reis/workflows/map-codebase.md (code-side counterpart; merge rules)
- @reis/references/artifact-paths.md (where drafts live)
- @reis/workflows/requirements.md (next step after drafts are approved)
