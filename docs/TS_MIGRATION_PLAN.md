# REIS — JavaScript → TypeScript Migration Plan

**Branch:** `migration/js-to-ts`
**Scope:** Full conversion of the shipped CLI source (`bin/`, `lib/`) to TypeScript, with typed tests and a single build pipeline.
**Strategy:** Incremental, phase-driven, compile-compatible at every step (`allowJs` during transition; `tsc` output stays CommonJS so the published npm package keeps working unchanged).

---

## 1. Codebase Analysis (current state)

### 1.1 Inventory

| Area | Files | Notes |
|---|---|---|
| `bin/reis.js` | 1 | CLI entry (commander), ~52 `require()` calls, shebang |
| `lib/index.js` | 1 | Empty placeholder exports |
| `lib/commands/` | 40 | One file per CLI command |
| `lib/utils/` | 42 (+5 in `gates/`) | Core engine: waves, cycles, state, gates, git |
| `lib/install.js` | 1 | Runs via **postinstall** — must stay runnable |
| `templates/`, `examples/` | ~15 | User-facing assets copied into target projects — **do NOT migrate** |
| `package/` | ~60 | Stale snapshot of an older lib — candidate for deletion (separate PR) |
| `src/debugger/__tests__/` | TS + jest | Already-TS test suite with no TS source (tests reference JS utils) |
| `test/` (mocha) | 33 files, ~12.8k lines | Unit/integration/e2e/perf suites for the JS code |

Total shipped source: **~29.4k lines** across `bin/` + `lib/`.

### 1.2 Key constraints discovered

- **CommonJS everywhere**: all modules use `require`/`module.exports`. Runtime deps are CJS-oriented: `chalk@4`, `inquirer@8`, `commander@11`.
- **No build step today**: npm package ships source directly (`files: [bin, lib, ...]`; `main: lib/index.js`; `bin.reis = bin/reis.js`; `postinstall: node lib/install.js --silent`). Any layout change must update these.
- **Two test runners**: mocha for `test/**/*.test.js`, Jest+ts-jest (ESM) for `src/debugger/__tests__`. Consolidation needed.
- **Node >= 18**, global-install CLI, `preferGlobal`. Published artifact correctness is critical (postinstall runs on user machines).
- ~30 lib files use `process.argv/exit/env`; heavy use of `fs/path/os` — needs `@types/node`.
- Dynamic patterns to watch during conversion: lazy `require()` inside functions (e.g., `readline` in `cycle.js`), JSON state files (`.reis/*.json`) needing schema types.

### 1.3 Target decisions (locked for this plan)

1. **Module format:** keep **CommonJS output** (`tsc -p tsconfig.build.json`) — avoids breaking `chalk@4`/`inquirer@8`, `postinstall`, and global installs. ESM is a possible post-migration project, not part of this one.
2. **Layout:** new code lives in `src/**` → compiled to `dist/**`. `main`, `bin`, `files`, and `postinstall` updated once in Phase 6.
3. **Migration style:** incremental `allowJs` — JS and TS coexist and import each other until Phase 8 flips the switch off.
4. **Test runner:** consolidate on **Vitest** (fast, native TS, works with CJS source under transform) in Phase 7 — replaces both mocha and Jest configs. *(Alternative if Vitest is rejected: unify on Jest everywhere.)*
5. **Strictness:** start `strict: false`, enable per-flag ramp-up in Phase 8 ending at full `"strict": true`.

---

## 2. Phase Plan

Each phase ends green: `tsc --noEmit` passes, full test suite passes, CLI smoke-tested (`node bin/reis.js --help` / relevant commands).

### Phase 0 — Baseline & Guardrails (0.5 day)
- Run existing suites (`npm test`, debugger jest suite); record pass/fail baseline in this doc.
- Add CI workflow (lint + typecheck + test) that will gate every subsequent phase.
- Delete or archive stale `package/` snapshot dir (reduces confusion during migration).
- **Exit criteria:** known-green baseline reproducible in CI.

### Phase 1 — Tooling Foundation (0.5–1 day)
- Add devDeps: `typescript`, `@types/node`, `@types/inquirer` (chalk/commander ship types).
- `tsconfig.json`: `allowJs: true`, `checkJs: false`, `strict: false`, `module: commonjs`, `target: ES2022`, `outDir: dist`, `rootDir: src`.
- Scripts: `build` (tsc), `typecheck` (tsc --noEmit), `dev` (tsc --watch).
- ESLint + `typescript-eslint` (type-aware rules off until Phase 8).
- Move nothing yet — verify empty build works.
- **Exit criteria:** `npm run typecheck && npm run build && npm test` all green in CI.

### Phase 2 — Shared Domain Types (1–2 days)
- Create `src/types.ts` (+ focused modules under `src/types/`):
  - `ReisConfig` mirroring `DEFAULT_CONFIG` shape from `lib/utils/config.js`
  - `STATE.md` / `PLAN.md` / `ROADMAP.md` parsed models
  - Wave/task/dependency-graph models, execution-state JSON schemas
  - Gate result types, debug report/issue types
- Type-only phase: no behavior change; JS modules keep working untouched.
- **Exit criteria:** types exported, consumed by `tsc` without errors; docs comment linking types ↔ config template.

### Phase 3 — Leaf Utilities → TS (2–4 days)
Convert lowest fan-in `lib/utils/*` modules first, one commit each:
`path-sanitizer`, `config`, `state-manager`, `metrics-tracker`, `decision-tracker`, `kanban-renderer`, `gate-reporter`, `code-analyzer`, plus `gates/` (4 gates + index).
- Convert JSDoc → real interfaces; replace ad-hoc objects with domain types from Phase 2.
- Port/verify corresponding `test/utils` cases still pass (tests stay JS for now).
- **Exit criteria:** ≥ half of `lib/utils` is `.ts`; no new `any`s beyond documented escapes.

### Phase 4 — Core Engine → TS (3–5 days)
Highest-risk logic, converted after leaves stabilize:
`cycle-orchestrator`, `cycle-state-manager`, `cycle-ui`, `wave-executor`, `parallel-wave-scheduler`, `parallel-state-tracker`, `wave-dependency-graph`, `wave-conflict-detector`, `conflict-resolver`, `dependency-parser`, `git-integration`, `subagent-invoker`, `plan-validator`, `plan-reviewer`, debugger utils (`debug-analyzer`, `fix-plan-generator`, `issue-classifier`, `pattern-matcher`, `solution-designer`).
- This phase also resolves the `src/debugger` mismatch: TS tests get real TS sources.
- Focus on typing checkpoint/resume flows (crash-recovery paths are the most fragile).
- **Exit criteria:** entire execution engine compiles as TS; integration tests green including resume-from-checkpoint scenarios.

### Phase 5 — Commands Layer → TS (3–4 days)
Convert all 40 `lib/commands/*` + `command-helpers` in small groups (planning group, execution group, progress/tree/config groups…).
- Standardize a typed command context (shared commander option interfaces).
- Watch lazy `require()`s inside functions — hoist or type them explicitly.
- **Exit criteria:** `lib/commands` fully TS; `reis help` and one command per group smoke-tested.

### Phase 6 — Entry Points, Packaging & Install Flow (1–2 days)
- Convert `bin/reis.js` (preserve shebang — add via `tsc` banner or post-build copy) and `lib/install.js`.
- Flip packaging to build output: `main: dist/index.js`, `bin.reis: dist/reis.js`, `files: [dist, docs, templates, subagents, examples]`, `postinstall: node dist/install.js --silent`, add `prepare: npm run build`.
- Verify end-to-end: `npm pack` → global install into a scratch project → `reis --help`, `reis new`, postinstall success for both targets (`~/.rovodev`, `~/.gemini`).
- **Exit criteria:** clean-room install of the packed tarball works on Node 18 and current LTS.

### Phase 7 — Test Suite Consolidation (2–3 days)
- Adopt Vitest; port `test/**` (~12.8k lines, mostly mechanical: `describe/it/assert` map cleanly).
- Fold the `src/debugger` Jest suite into the same runner; delete mocha + ts-jest/jest configs.
- Keep e2e/performance suites but tag them (`test:e2e`) so default `npm test` stays fast.
- **Exit criteria:** single `npm test` covering everything; coverage ≥ pre-migration baseline.

### Phase 8 — Strict Mode & Cleanup (2–3 days)
- Ramp compiler flags in order: `noImplicitAny` → `strictNullChecks` → `strictFunctionTypes` … → `strict: true`; fix fallout per flag.
- Remove `allowJs`; delete remaining `lib/**/*.js` sources; drop `lib/` from repo.
- Eliminate remaining `any`/`@ts-ignore` escapes or document them.
- Update README/docs/AGENTS.md (build instructions, contribution flow), bump minor version, merge `migration/js-to-ts` → `main`.

---

## 3. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Broken published package (postinstall/bin paths) | Phase 6 clean-room `npm pack` install test before any release; CI publishes only from built `dist` |
| Untyped JSON state corruption missed by types | Add runtime validation (zod or hand-rolled guards) at load boundaries in Phase 4 |
| Two-runner drift during Phases 3–6 | CI runs both suites every commit until Phase 7 removes one |
| Long-lived branch divergence from `main` | Merge/rebase weekly; land phases as they complete (each phase is independently shippable thanks to `allowJs`) |
| Dynamic `require()` patterns breaking under tsc | Audit in Phase 5; prefer static imports, else explicit `createRequire` typing |

## 4. Effort Summary

~15–22 working days of focused work across 9 phases (0–8). Phases 0–2 unblock everything; Phases 3–6 can partially overlap (utils before engine before commands) but should land in order.
