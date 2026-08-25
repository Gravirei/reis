# Debugger Test Suite (aspirational - NOT in default `npm test`)

These tests target a planned TypeScript debugger API (constructor signatures,
`getAllPatterns()`, structured `DebugAnalysis` results) that does not match the
current `lib/utils/*` implementation (~550 type mismatches). They were never
part of the historical mocha `npm test` run.

They are excluded from the root Jest config until the debugger API is aligned
with these specs (or the tests are updated to the real API).

To typecheck them standalone:
    npx tsc -p <(see migration notes)
