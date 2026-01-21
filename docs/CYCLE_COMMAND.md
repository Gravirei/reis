# Complete Cycle Command Guide

## Overview

The `reis cycle` command automates the entire REIS workflow: PLAN → EXECUTE → VERIFY → DEBUG → FIX. It's a "power user" feature that handles 90% of development scenarios automatically.

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Command Reference](#command-reference)
- [Options](#options)
- [State Management](#state-management)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Quick Start

### Basic Usage

```bash
# Run complete cycle for phase 1
reis cycle 1

# Run with auto-fix enabled
reis cycle 1 --auto-fix

# Run with increased retry attempts
reis cycle 1 --max-attempts 5
```

### Resume Interrupted Cycle

```bash
# Resume from where you left off
reis cycle --resume

# Or just run cycle again (it will prompt to resume)
reis cycle 1
```

## How It Works

The cycle command follows this workflow:

```
┌─────────────┐
│  PLANNING   │ ─→ Validate plan exists and is correct
└──────┬──────┘
       ↓
┌─────────────┐
│  EXECUTING  │ ─→ Run all tasks in the plan
└──────┬──────┘
       ↓
┌─────────────┐
│  VERIFYING  │ ─→ Check completeness and success criteria
└──────┬──────┘
       ↓
    Success? ─→ YES ─→ ✅ COMPLETE
       ↓
      NO
       ↓
┌─────────────┐
│  DEBUGGING  │ ─→ Analyze what's missing/broken
└──────┬──────┘
       ↓
┌─────────────┐
│   FIXING    │ ─→ Apply fix plan
└──────┬──────┘
       ↓
    Loop back to VERIFYING (until success or max attempts)
```

### State Machine

The cycle maintains state throughout execution:

- **IDLE**: No cycle running
- **PLANNING**: Validating plan
- **EXECUTING**: Running plan tasks
- **VERIFYING**: Checking completion
- **DEBUGGING**: Analyzing failures
- **FIXING**: Applying fixes
- **COMPLETE**: All done ✅
- **FAILED**: Unrecoverable error ❌

State is persisted to `.reis/cycle-state.json` and survives interruptions.

## Command Reference

### Basic Syntax

```bash
reis cycle [phase-or-plan] [options]
```

### Arguments

- `phase-or-plan`: (Optional) Phase number (e.g., `1`) or path to PLAN.md file
  - If omitted and resumable state exists, prompts to resume
  - Examples: `reis cycle 1`, `reis cycle .planning/phase-2.PLAN.md`

### Exit Codes

- `0`: Cycle completed successfully
- `1`: Cycle failed (see error message for details)
- `130`: User interrupted (Ctrl+C)

## Options

### `--max-attempts <n>`

Maximum number of debug/fix attempts before giving up.

```bash
reis cycle 1 --max-attempts 5
```

**Default**: 3  
**Range**: 1-10  
**Use when**: You expect multiple iterations to fix complex issues

### `--auto-fix`

Automatically apply fixes without user confirmation.

```bash
reis cycle 1 --auto-fix
```

**Default**: false  
**Use when**: You trust the debugger and want unattended execution

### `--resume`

Resume an interrupted cycle from its last state.

```bash
reis cycle --resume
```

**Default**: false  
**Use when**: Cycle was interrupted (Ctrl+C, crash, etc.)

### `--continue-on-fail`

Continue cycle even if verification fails.

```bash
reis cycle 1 --continue-on-fail
```

**Default**: false  
**Use when**: You want to proceed despite incomplete features (not recommended)

### `-v, --verbose`

Show detailed output at each step.

```bash
reis cycle 1 --verbose
```

**Default**: false  
**Use when**: Debugging cycle issues or wanting full transparency

## State Management

### State File

Cycle state is saved to `.reis/cycle-state.json`:

```json
{
  "phase": 1,
  "planPath": ".planning/phase-1.PLAN.md",
  "currentState": "VERIFYING",
  "startTime": "2026-01-21T20:00:00Z",
  "attempts": 1,
  "maxAttempts": 3,
  "options": {
    "autoFix": false,
    "verbose": false
  },
  "history": [
    {
      "state": "PLANNING",
      "timestamp": "2026-01-21T20:00:00Z",
      "duration": 5000,
      "result": "success"
    }
  ],
  "completeness": 80
}
```

### Resume Capability

If a cycle is interrupted, state is preserved:

1. **Ctrl+C**: Gracefully saves state and exits
2. **Crash**: Last saved state is preserved
3. **Next run**: Prompts to resume or start fresh

```bash
$ reis cycle 1
⚠️  Interrupted cycle detected
   Phase: 1
   State: VERIFYING
   Attempts: 1/3

Resume cycle? (Y/n): y

🔄 Resuming cycle from VERIFYING
```

### State Cleanup

State is automatically cleared on:
- Successful completion
- User starting a new cycle (with confirmation)

To manually clear state:
```bash
rm .reis/cycle-state.json
```

## Examples

### Example 1: Simple Phase Execution

```bash
$ reis cycle 1

╔═══════════════════════════════════════════════════════════╗
║  🔄 REIS Complete Cycle - Phase 1                         ║
╚═══════════════════════════════════════════════════════════╝

⏳ Step 1/4: Planning
   ✓ Plan validated

⚙️  Step 2/4: Executing
   ✓ Plan executed (5 tasks)

✓ Step 3/4: Verifying
   ✓ Verification passed (100% complete)

╔═══════════════════════════════════════════════════════════╗
║  ✅ Cycle Complete!                                       ║
╚═══════════════════════════════════════════════════════════╝

Duration: 8m 30s
Attempts: 0
Next: reis cycle 2
```

### Example 2: Cycle with Debug/Fix Loop

```bash
$ reis cycle 2

╔═══════════════════════════════════════════════════════════╗
║  🔄 REIS Complete Cycle - Phase 2                         ║
╚═══════════════════════════════════════════════════════════╝

⏳ Step 1/4: Planning
   ✓ Plan validated

⚙️  Step 2/4: Executing
   ✓ Plan executed (8 tasks)

✓ Step 3/4: Verifying
   ❌ Verification failed (75% complete)
   
   Issues found:
   - Missing: src/auth/password-reset.js
   - Missing: test/auth/password-reset.test.js
   - Feature completeness: 6/8 tasks

🔍 Step 4/4: Debugging
   ⏳ Analyzing failures...
   ✓ Debug report: .planning/debug/DEBUG_REPORT.md
   ✓ Fix plan: .planning/debug/FIX_PLAN.md
   
   Apply fix? (Y/n): y
   
   ⏳ Applying fix...
   ✓ Fix applied

Re-verifying...
   ✓ Verification passed (100% complete)

╔═══════════════════════════════════════════════════════════╗
║  ✅ Cycle Complete!                                       ║
╚═══════════════════════════════════════════════════════════╝

Duration: 15m 45s
Attempts: 1
Next: reis cycle 3
```

### Example 3: Auto-Fix Mode

```bash
$ reis cycle 2 --auto-fix

# Same flow but skips "Apply fix? (Y/n)" prompts
# Automatically applies all fixes
```

### Example 4: Resume After Interruption

```bash
$ reis cycle 3
# ... working ...
^C  # User presses Ctrl+C

⚠️  Cycle interrupted by user
State saved. Resume with: reis cycle --resume

$ reis cycle --resume

🔄 Resuming cycle from VERIFYING
⏳ Step 3/4: Verifying
   ✓ Verification passed (100% complete)
...
```

### Example 5: Custom Plan Path

```bash
$ reis cycle .planning/hotfix/fix-auth.PLAN.md

╔═══════════════════════════════════════════════════════════╗
║  🔄 REIS Complete Cycle - Custom Plan                     ║
╚═══════════════════════════════════════════════════════════╝
...
```

### Example 6: Max Attempts Reached

```bash
$ reis cycle 2 --max-attempts 2

...
⏳ Step 3/4: Verifying (Attempt 1)
   ❌ Verification failed (80% complete)

🔍 Debugging...
🔧 Applying fix...

Re-verifying...
   ❌ Verification failed (85% complete)

🔍 Debugging...
🔧 Applying fix...

Re-verifying...
   ❌ Verification failed (90% complete)

❌ Max attempts reached (2)

Options:
  1. Review verification output
  2. Fix issues manually
  3. Increase max attempts: reis cycle 2 --max-attempts 5
  4. Skip verification: reis cycle 2 --continue-on-fail
```

## Best Practices

### 1. Start with Default Settings

```bash
# Try default first
reis cycle 1

# Only adjust if needed
reis cycle 1 --max-attempts 5
```

### 2. Use Verbose Mode for First Run

```bash
# See what's happening
reis cycle 1 --verbose
```

### 3. Review Debug Reports

When verification fails:
```bash
# Check what went wrong
cat .planning/debug/DEBUG_REPORT.md

# Review fix plan before applying
cat .planning/debug/FIX_PLAN.md
```

### 4. Handle Interruptions Gracefully

```bash
# Don't worry about Ctrl+C
# State is saved automatically

# Just resume later
reis cycle --resume
```

### 5. Trust the Process

- Let the cycle complete without interference
- Review outputs after completion
- Trust the debugger's fix plans (90%+ accuracy)

### 6. Use Auto-Fix for Routine Tasks

```bash
# For well-tested phases
reis cycle 1 --auto-fix

# For complex/new phases, review fixes manually
reis cycle 2
```

## Troubleshooting

### Plan Not Found

**Error:**
```
Error: Plan not found: .planning/phase-1.PLAN.md
```

**Solution:**
```bash
reis plan 1
reis cycle 1
```

### Invalid Plan Format

**Error:**
```
Error: Plan does not contain any tasks
```

**Solution:**
- Ensure plan follows REIS PLAN.md format
- Check for `## Task` or `<task>` sections

### Verification Keeps Failing

**Symptoms:**
- Cycle reaches max attempts
- Completeness stuck at <100%

**Solutions:**
1. Review debug report:
   ```bash
   cat .planning/debug/DEBUG_REPORT.md
   ```

2. Fix manually:
   ```bash
   # Fix issues
   # Then verify
   reis verify .planning/phase-1.PLAN.md
   ```

3. Increase attempts:
   ```bash
   reis cycle 1 --max-attempts 5
   ```

### State Corruption

**Symptoms:**
- "Invalid state file" errors
- Resume doesn't work

**Solution:**
```bash
# Clear corrupted state
rm .reis/cycle-state.json

# Start fresh
reis cycle 1
```

### Execution Hangs

**Symptoms:**
- Cycle appears stuck
- No progress for >5 minutes

**Solution:**
1. Press Ctrl+C to interrupt
2. Check logs/outputs
3. Resume with verbose:
   ```bash
   reis cycle --resume --verbose
   ```

## FAQ

### Q: How is this different from running commands manually?

**A:** Cycle automates the entire workflow including error recovery. Manual execution requires you to run plan → execute → verify → debug → fix → verify in sequence, handling errors yourself.

### Q: Can I use cycle for all phases?

**A:** Yes! Use it for any phase or custom plan.

### Q: What happens if I run cycle twice on the same phase?

**A:** It will prompt to resume the existing cycle or start fresh.

### Q: Is state shared between phases?

**A:** No. Each cycle has its own state. Running `reis cycle 2` doesn't affect `reis cycle 1` state.

### Q: Can I run multiple cycles in parallel?

**A:** No. Only one cycle can run at a time. State would conflict.

### Q: How do I skip verification?

**A:** Use `--continue-on-fail`:
```bash
reis cycle 1 --continue-on-fail
```
(Not recommended except for testing)

### Q: Can I customize the debug/fix behavior?

**A:** Not directly, but you can:
- Review fix plans before applying (default)
- Use `--auto-fix` for automatic application
- Adjust `--max-attempts` to control retry count

### Q: What if the fix plan is wrong?

**A:** 
1. Decline the fix (type 'n')
2. Fix manually
3. Resume cycle
4. Or run verify/debug separately

### Q: Does cycle work with custom plans?

**A:** Yes! Pass the plan path:
```bash
reis cycle ./my-custom-plan.PLAN.md
```

### Q: How much time does cycle save?

**A:** Typically 30-50% compared to manual execution, especially when dealing with verification failures.

---

## Related Documentation

- [CYCLE_WORKFLOW.md](CYCLE_WORKFLOW.md) - State machine design
- [VERIFICATION.md](VERIFICATION.md) - Verification guide
- [DEBUG.md](DEBUG.md) - Debug command guide
- [README.md](../README.md) - Main documentation

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-21  
**Command:** `reis cycle`
