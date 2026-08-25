# Reference: Runtime State Files (.reis/)

`cycle-state.json` is written by `lib/utils/cycle-state-manager.ts`,
`parallel-state.json` by `lib/utils/parallel-state-tracker.ts`;
`execution-state.json` is agent-maintained during execution workflows.

## .reis/cycle-state.json

```json
{
  "phase": 2, "planPath": ".planning/phases/phase-2-core/PLAN.md",
  "currentState": "VERIFYING",
  "startTime": "2026-08-26T09:00:00.000Z",
  "attempts": 1, "maxAttempts": 3,
  "options": { "skipGates": false },
  "history": [{ "state": "EXECUTING", "timestamp": "...", "duration": 720000,
                "result": "success", "details": "" }],
  "lastError": { "message": "...", "code": "UNKNOWN", "stack": null, "timestamp": "..." },
  "completeness": 60,
  "gateResult": null, "executionResult": null, "reviewResult": null,
  "verificationResult": { "success": false, "completeness": 60, "issues": [],
    "missing": ["src/auth/login.ts"], "timestamp": "..." },
  "lastUpdated": "..."
}
```

- `currentState` — exactly one of `IDLE`, `PLANNING`, `REVIEWING`,
  `EXECUTING`, `VERIFYING`, `GATING`, `DEBUGGING`, `FIXING`, `COMPLETE`, `FAILED`
- `attempts`/`maxAttempts` — debug/fix counter (default max 3); `DEBUGGING`
  → `FAILED` when `attempts >= maxAttempts`
- `history[]` — appended on EVERY transition: PREVIOUS state, ISO timestamp,
  ms duration since prior entry, `result` (`success`|`failure`|`pending`),
  optional details
- `gateResult` / `executionResult` / `verificationResult` / `reviewResult` —
  stage outputs; execution output truncated to 1000 chars
- Writes are atomic (tmp + rename); DELETED on COMPLETE, kept on FAILED.
  Resumable states: `RESEARCHING` (resume logic only), `PLANNING`,
  `REVIEWING`, `EXECUTING`, `VERIFYING`, `GATING`, `DEBUGGING`, `FIXING`;
  terminal states (`IDLE`/`COMPLETE`/`FAILED`) are not resumable.

## .reis/execution-state.json (task cursor)

Agent-written crash-recovery cursor, updated after EVERY task (never lag
behind actual work):

```json
{
  "phase": 2,
  "planPath": ".planning/phases/phase-2-core/PLAN.md",
  "lastCompletedWave": 1, "lastCompletedTask": "2.1-parse-config",
  "currentWave": 2, "status": "in_progress", "error": null,
  "updatedAt": "2026-08-26T10:15:00.000Z"
}
```

Record wave number, task id/name, status, timestamp per task. On failure:
write failing wave/task + error, keep completed commits intact. DELETE when
all waves finish so a stale cursor cannot mislead later resumes; presence
without `--resume` prompts resume-vs-restart.

## .reis/parallel-state.json

Persisted by ParallelStateTracker (epoch-ms timestamps):

```json
{
  "waves": [["wave-1", { "status": "completed", "startTime": 1724664000000,
             "endTime": 1724664300000, "error": null, "metadata": {} }]],
  "batches": [[1, { "waveIds": ["wave-1"], "startTime": 1724664000000,
              "endTime": 1724664300000, "status": "completed" }]],
  "currentBatchId": 1,
  "history": [{ "type": "wave_complete", "data": {}, "timestamp": 1724664300000 }],
  "executionStartTime": 1724664000000, "executionEndTime": null,
  "isExecuting": false, "savedAt": "2026-08-26T10:05:00.000Z"
}
```

- Wave status: `pending`|`running`|`completed`|`failed`; batch status:
  `running`|`completed`|`partial` (= any wave failed)
- `waves`/`batches` are serialized Map entries; history capped at 1000
