# Reference: STATE.md Format

`.planning/STATE.md`, written/parsed by `lib/utils/state-manager.ts`.
Sections match exact `## <heading>` prefixes; order below is canonical.

```markdown
# REIS v2.0 Development State

## Current Phase
**Phase 2: Core Implementation**

## Active Wave
**Wave 1: Data Layer**
- Status: IN_PROGRESS
- Started: 2026-08-26
- Items: 3 tasks
- Progress: 1/3 complete

## Completed Waves
- **Wave 1: Data Layer** (2026-08-25)
  - Commit: `a1b2c3d`

## Checkpoints
- **checkpoint-auth** (2026-08-25T14:30:00.000Z)
  - Commit: `e4f5g6h`
  - Wave: Wave 1: Data Layer

## Recent Activity
- 2026-08-26 09:42: Started wave: Wave 1: Data Layer

## Next Steps
1. Execute Wave 2

## Blockers / Notes (each)
_None_

## Metrics
- Total waves planned: 6
- Waves completed: 2
- Success rate: 100%
- Average wave duration: 45m
```


## Skeleton & section semantics

| Section | Content |
|---|---|
| Current Phase | Single bold `**...**` line, parsed verbatim with markers; `_Not set_` when null |
| Active Wave | Bold name + Status / Started / Items (`N tasks`) / Progress (`c/t complete`); `_No active wave_` when idle |
| Completed Waves | Bullet per wave, optional `- Commit: \`hash\`` sub-bullet; `_None yet_` if empty |
| Checkpoints | Last 5 written (10 kept); `_None yet_` if empty — format below |
| Recent Activity | Last 10 bullets (20 kept), oldest first; `_No recent activity_` if empty |
| Next Steps | Numbered list matching `/^\d+\.\s+/`; `_None defined_` if empty |
| Blockers / Notes | Bullets; parser skips `_None_` placeholder lines |
| Metrics | Fixed 4-line block; only `Total waves planned` and `Waves completed` parsed back |

## Parse/write rules

- Parser keys off `line.startsWith('## <Heading>')`; extra sections ignored.
  Current Phase value must start with `**` to be captured.
- Active Wave parsed from a 10-line window starting at the `**Wave...**` line.
- Checkpoints: regex `\*\*(.+?)\*\*\s*\((.+?)\)` captures name + timestamp;
  a 5-line look-ahead collects `Commit:` (backticks stripped) and `Wave:`.
- Placeholders are literal italic text: `_Not set_`, `_No active wave_`,
  `_None yet_`, `_No recent activity_`, `_None defined_`, `_None_` — never
  invent others. Writing always regenerates the whole file.

Formats: activity timestamps are `YYYY-MM-DD HH:MM` local
(e.g. `2026-08-26 09:42: ...`); wave/completion dates are `YYYY-MM-DD`;
checkpoint timestamps are full ISO 8601 UTC (`2026-08-25T14:30:00.000Z`).

```markdown
- **<name>** (<ISO timestamp>)
  - Commit: `<hash>`
  - Wave: <active wave name or omitted>
```

Checkpoint names: letters, digits, dashes, underscores; auto-generated as
`checkpoint-<YYYY-MM-DD>-<HHMMSS>`. Keep at most 10 entries.
