# REIS Cycle Workflow - State Machine Design

## Overview

The REIS Cycle Command automates the complete development workflow:

```
PLAN → EXECUTE → VERIFY → GATE → DEBUG (if needed)
```

This document defines the state machine that orchestrates this workflow.

## Cycle Phases

### 1. PLAN
Create or update the execution plan using `reis_planner` subagent.

### 2. EXECUTE
Implement the plan using `reis_executor` subagent.

### 3. VERIFY
Verify implementation completeness using `reis_verifier` subagent.

### 4. GATE (New in v2.5)
Run quality gates to check:
- **Security**: Vulnerabilities, secrets, license compliance
- **Quality**: Test coverage, linting, code complexity
- **Performance**: Bundle size, dependencies (optional)
- **Accessibility**: WCAG compliance (optional)

### 5. DEBUG
If verification or gates fail, analyze issues using `reis_debugger` subagent.

## Gate Phase Details

### When Gates Run
- Automatically after successful verification in `reis cycle`
- Manually with `reis verify --with-gates`
- Controlled by `gates.runOn` in config

### Gate Behavior
- **blockOnFail: true** (default) - Gate failure triggers debug phase
- **blockOnFail: false** - Gate failure shows warning, cycle continues
- **blockOnWarning: true** - Treat warnings as failures

### Skipping Gates
```bash
reis cycle --skip-gates           # Skip all gates
reis cycle --gate-only security   # Run only security gates
```

## Configuration

```javascript
// reis.config.js
module.exports = {
  gates: {
    enabled: true,
    runOn: ['cycle'],        // 'cycle', 'verify', or both
    blockOnFail: true,       // Block cycle on gate failure
    blockOnWarning: false,   // Block on warnings
    timeout: 30000,          // Gate timeout (ms)
    
    security: { enabled: true },
    quality: { enabled: true },
    performance: { enabled: false },
    accessibility: { enabled: false }
  }
};
```

## CLI Commands

```bash
# Full cycle with gates
reis cycle 3

# Cycle without gates
reis cycle 3 --skip-gates

# Cycle with specific gate category
reis cycle 3 --gate-only security

# Verification with gates
reis verify --with-gates

# Resume interrupted cycle
reis cycle --resume
```

## State Machine

### States

| State | Description | Next States |
|-------|-------------|-------------|
| **IDLE** | No cycle running | PLANNING |
| **PLANNING** | Generating or validating plan | EXECUTING, FAILED |
| **EXECUTING** | Running plan tasks | VERIFYING, FAILED |
| **VERIFYING** | Checking completion criteria | GATING, DEBUGGING, FAILED |
| **GATING** | Running quality gates | COMPLETE, DEBUGGING, FAILED |
| **DEBUGGING** | Analyzing failures | FIXING, FAILED |
| **FIXING** | Applying fix plan | VERIFYING, FAILED |
| **COMPLETE** | All tasks successful | IDLE |
| **FAILED** | Unrecoverable error | IDLE |

### State Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                         IDLE                                 │
│                  (No active cycle)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ reis cycle <phase>
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      PLANNING                                │
│           - Check for existing plan                          │
│           - Generate if missing (prompt user)                │
│           - Validate plan structure                          │
└───────────┬─────────────────────────┬───────────────────────┘
            │                         │
            │ Plan valid              │ Plan invalid/error
            ▼                         ▼
┌─────────────────────────────────────────┐      ┌──────────┐
│              EXECUTING                  │      │  FAILED  │
│    - Run plan tasks sequentially        │      └──────────┘
│    - Commit after each task             │
│    - Update progress                    │
└───────────┬────────────────┬────────────┘
            │                │
            │ Success        │ Execution error
            ▼                ▼
┌─────────────────────────────────────────┐      ┌──────────┐
│              VERIFYING                  │      │  FAILED  │
│    - Run verification commands          │      └──────────┘
│    - Check success criteria             │
│    - Calculate completeness %           │
└───┬──────────────────┬──────────────────┘
    │                  │
    │ Pass (100%)      │ Fail (<100%)
    ▼                  ▼
┌─────────────────────────────────────────┐  ┌────────────────┐
│              GATING (v2.5)              │  │   DEBUGGING    │
│    - Run security gates                 │  │ (verification  │
│    - Run quality gates                  │  │  failures)     │
│    - Optional: performance, a11y        │  └───────┬────────┘
└───┬──────────────────┬──────────────────┘          │
    │                  │                             │
    │ Gates pass       │ Gates fail                  │
    ▼                  ▼                             │
┌──────────┐    ┌─────────────────────────────────────────────┐
│ COMPLETE │    │             DEBUGGING                        │
│          │    │    - Analyze verification/gate failures      │
│          │    │    - Classify issues [GATE:category]         │
└──────────┘    │    - Generate fix plan                       │
                └───┬──────────────────────┬───────────────────┘
                    │                      │
                    │ Fix generated        │ Debug failed
                    ▼                      ▼
            ┌─────────────────────┐    ┌──────────┐
            │       FIXING        │    │  FAILED  │
            │  - Show fix plan    │    └──────────┘
            │  - Prompt user      │
            │  - Apply fix        │
            └────────┬────────────┘
                     │
                     │ Fix applied
                     │
                     ▼
            ┌─────────────────────────┐
            │      VERIFYING          │
            │   (Re-verify after fix) │
            └────┬────────────┬───────┘
                 │            │
                 │ Pass       │ Fail (< max attempts)
                 ▼            │
         ┌──────────┐         │
         │  GATING  │         └─→ Back to DEBUGGING
         └────┬─────┘
              │
              │ Gates pass
              ▼
         ┌──────────┐         │ Fail (≥ max attempts)
         │ COMPLETE │         ▼
         └──────────┘    ┌──────────┐
                         │  FAILED  │
                         └──────────┘
```

## State Persistence

### State File Location
`.reis/cycle-state.json`

### State Data Structure

```json
{
  "phase": 1,
  "planPath": ".planning/phase-1.PLAN.md",
  "currentState": "VERIFYING",
  "startTime": "2026-01-18T20:00:00Z",
  "attempts": 1,
  "maxAttempts": 3,
  "options": {
    "autoFix": false,
    "verbose": false,
    "continueOnFail": false
  },
  "history": [
    {
      "state": "PLANNING",
      "timestamp": "2026-01-18T20:00:00Z",
      "duration": 5000,
      "result": "success",
      "details": "Plan validated"
    },
    {
      "state": "EXECUTING",
      "timestamp": "2026-01-18T20:00:05Z",
      "duration": 120000,
      "result": "success",
      "details": "5 tasks completed"
    },
    {
      "state": "VERIFYING",
      "timestamp": "2026-01-18T20:02:05Z",
      "duration": 10000,
      "result": "failure",
      "details": "80% complete, missing test/todo.test.js"
    }
  ],
  "lastError": null,
  "completeness": 80
}
```

### State Fields

- **phase**: Phase number or plan identifier
- **planPath**: Path to PLAN.md file
- **currentState**: Current state in the machine
- **startTime**: ISO timestamp when cycle started
- **attempts**: Number of debug/fix attempts made
- **maxAttempts**: Maximum allowed attempts
- **options**: Command-line options used
- **history**: Array of state transitions with results
- **lastError**: Last error encountered (if any)
- **completeness**: Verification completeness percentage

## State Transitions and Actions

### IDLE → PLANNING

**Trigger:** User runs `reis cycle <phase>`

**Actions:**
1. Initialize state
2. Check for existing plan
3. If plan missing, offer to generate
4. Validate plan structure

**Next State:**
- Success → EXECUTING
- Failure → FAILED

### PLANNING → EXECUTING

**Trigger:** Plan validated

**Actions:**
1. Load plan tasks
2. Initialize progress tracking
3. Execute tasks sequentially
4. Commit after each task
5. Update state after each task

**Next State:**
- Success → VERIFYING
- Failure → FAILED

### EXECUTING → VERIFYING

**Trigger:** All tasks completed

**Actions:**
1. Run verification commands from plan
2. Check success criteria
3. Calculate completeness percentage
4. Collect missing items

**Next State:**
- 100% complete → GATING
- <100% complete → DEBUGGING
- Error → FAILED

### VERIFYING → GATING

**Trigger:** Verification passes (completeness = 100%)

**Actions:**
1. Check if gates enabled (`gates.enabled` and `gates.runOn` includes 'cycle')
2. Skip if `--skip-gates` flag provided
3. Run only specified category if `--gate-only <category>` provided
4. Run all enabled gate categories
5. Collect gate results

**Next State:**
- All gates pass → COMPLETE
- Gates fail and `blockOnFail: true` → DEBUGGING
- Gates fail and `blockOnFail: false` → COMPLETE (with warnings)
- Error → FAILED

### GATING → DEBUGGING

**Trigger:** Gate failure with `blockOnFail: true`

**Actions:**
1. Collect failed gate results
2. Prefix issues with `[GATE:category]` (e.g., `[GATE:security]`)
3. Pass to debugger for analysis
4. Generate gate-specific fix recommendations

**Next State:**
- Fix plan generated → FIXING
- Cannot generate fix → FAILED

### VERIFYING → DEBUGGING

**Trigger:** Verification fails (completeness < 100%)

**Actions:**
1. Analyze verification output
2. Classify issues (missing files, incomplete features, etc.)
3. Generate debug report
4. Create fix plan

**Next State:**
- Success → FIXING
- Failure → FAILED

### DEBUGGING → FIXING

**Trigger:** Fix plan generated

**Actions:**
1. Display fix plan to user
2. Prompt for confirmation (unless --auto-fix)
3. Execute fix plan
4. Commit changes

**Next State:**
- Success → VERIFYING
- User declined → FAILED
- Error → FAILED

### FIXING → VERIFYING

**Trigger:** Fix applied

**Actions:**
1. Re-run verification commands
2. Check if issues resolved
3. Increment attempt counter

**Next State:**
- 100% complete → COMPLETE
- <100% and attempts < max → DEBUGGING
- <100% and attempts ≥ max → FAILED

### Any State → FAILED

**Trigger:** Unrecoverable error or max attempts reached

**Actions:**
1. Save final state
2. Display error summary
3. Provide recovery suggestions
4. Exit with error code

**Recovery Options:**
- Review debug report
- Fix manually
- Increase max attempts
- Skip verification with --continue-on-fail

### Any State → COMPLETE

**Trigger:** All success criteria met

**Actions:**
1. Update STATE.md
2. Display success summary
3. Show next steps
4. Clear cycle state
5. Exit with success code

## User Interruption Handling

### Ctrl+C (SIGINT)

**Actions:**
1. Gracefully stop current operation
2. Save current state to .reis/cycle-state.json
3. Display resume instructions
4. Exit cleanly

**Resume:**
```bash
# Resume from last successful state
reis cycle --resume

# Or start fresh
reis cycle <phase>
```

### Resume Logic

1. Check for .reis/cycle-state.json
2. If exists and currentState ≠ COMPLETE/FAILED:
   - Prompt user to resume
   - If yes, continue from currentState
   - If no, start fresh cycle
3. If not exists, start new cycle

## Error Recovery Strategies

### Transient Errors
- Network timeouts
- Temporary file locks
- Rate limits

**Strategy:** Retry with exponential backoff (max 3 retries)

### Validation Errors
- Invalid plan format
- Missing required fields
- Syntax errors

**Strategy:** Fail fast with clear error message

### Execution Errors
- Task failures
- Build errors
- Test failures

**Strategy:** Save state, offer debug cycle

### Verification Errors
- Incomplete features
- Missing files
- Failed tests

**Strategy:** Enter debug/fix loop

## Best Practices

### State Management
1. Save state after every transition
2. Use atomic file writes (write to temp, then rename)
3. Handle corrupted state files gracefully
4. Clean up state on successful completion

### Error Messages
1. Always explain what went wrong
2. Suggest concrete next steps
3. Provide relevant context
4. Include relevant file paths/commands

### Performance
1. Cache verification results when possible
2. Skip redundant checks
3. Parallelize independent operations
4. Use progress indicators for long operations

### User Experience
1. Show clear progress at each step
2. Provide time estimates
3. Allow graceful interruption
4. Make resume obvious and easy

## Testing Considerations

### States to Test
- All state transitions (success paths)
- All error paths
- Resume from each state
- User interruption at each state
- Max attempts boundary

### Edge Cases
- Plan doesn't exist
- Empty plan
- Malformed state file
- Concurrent cycle attempts
- Disk full during state save
- Permission errors

### Performance Tests
- Large plans (50+ tasks)
- Long-running verifications
- Multiple debug/fix cycles
- Memory usage over time

## Future Enhancements

### Potential Additions
1. **Parallel Execution**: Execute independent tasks in parallel
2. **Dry Run Mode**: Preview cycle without executing
3. **Checkpoint Mode**: Pause at specific states for review
4. **Rollback**: Undo last cycle step
5. **History**: View past cycle executions
6. **Notifications**: Alert on completion/failure
7. **Metrics**: Track cycle performance over time

### State Machine Extensions
- Add PAUSED state for manual checkpoints
- Add ROLLBACK state for undo operations
- Add PREVIEW state for dry runs

---

**Version:** 2.0.0  
**Last Updated:** 2026-01-26  
**Status:** Design Complete (Updated for Gate Integration)
