# REIS Cycle Command - Complete Documentation

> **Version:** 2.7.0  
> **Last Updated:** 2026-01-26

The `reis cycle` command is the heart of REIS - it orchestrates the complete automated workflow for implementing features phase by phase with quality assurance at every step.

---

## Table of Contents

1. [Overview](#overview)
2. [Basic Usage](#basic-usage)
3. [Workflow Stages](#workflow-stages)
4. [Command Options](#command-options)
5. [Cycle Modes](#cycle-modes)
6. [Subagent Integration](#subagent-integration)
7. [State Management](#state-management)
8. [Error Handling & Recovery](#error-handling--recovery)
9. [Quality Gates](#quality-gates)
10. [Best Practices](#best-practices)
11. [Examples](#examples)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The REIS cycle automates the complete development workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REIS CYCLE WORKFLOW                          │
│                                                                 │
│   [RESEARCH] → PLAN → REVIEW → EXECUTE → VERIFY → GATE → DEBUG │
│      (opt)                                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

- **Automated Orchestration**: Runs all stages in sequence automatically
- **Quality Assurance**: Built-in verification and quality gates
- **Error Recovery**: Automatic debugging and fix attempts on failure
- **State Persistence**: Can resume interrupted cycles
- **Flexible Modes**: Research, quick, and custom configurations
- **Parallel Execution**: Subagents run with fresh context for optimal performance

---

## Basic Usage

```bash
# Run cycle for a specific phase
reis cycle 1

# Run cycle for a plan file
reis cycle .planning/phases/feature/PLAN.md

# Resume an interrupted cycle
reis cycle --resume

# Quick check of cycle status
reis progress
```

---

## Workflow Stages

### Stage 1: RESEARCH (Optional)

**Triggered by:** `--research` or `--full-research` flags

Research prepares context before planning by analyzing the codebase and gathering information.

```
┌─────────────────────────────────────────────────────────────────┐
│                      RESEARCH STAGE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  --full-research          --research                            │
│        │                       │                                │
│        ▼                       ▼                                │
│  ┌───────────────┐      ┌───────────────┐                       │
│  │ reis_analyst  │      │  reis_scout   │                       │
│  │               │      │               │                       │
│  │ Project-level │      │ Phase-level   │                       │
│  │ analysis      │      │ research      │                       │
│  │               │      │               │                       │
│  │ Output:       │      │ Output:       │                       │
│  │ context.md    │      │ research.md   │                       │
│  └───────┬───────┘      └───────┬───────┘                       │
│          │                      │                               │
│          └──────────┬───────────┘                               │
│                     ▼                                           │
│          ┌───────────────────┐                                  │
│          │ reis_synthesizer  │ (if multiple outputs)            │
│          │                   │                                  │
│          │ Output:           │                                  │
│          │ synthesis.md      │                                  │
│          └───────────────────┘                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Research Subagents:**

| Subagent | Purpose | Output |
|----------|---------|--------|
| `reis_analyst` | Project-wide analysis, architecture review | `context.md` |
| `reis_scout` | Phase-specific research, requirements analysis | `research.md` |
| `reis_synthesizer` | Combines multiple research outputs | `synthesis.md` |

**When to Use Research:**
- New project or unfamiliar codebase
- Complex features requiring architectural decisions
- When you need comprehensive context before planning

### Stage 2: PLANNING

**Subagent:** `reis_planner`

Creates a detailed execution plan for the phase.

```
┌─────────────────────────────────────────────────────────────────┐
│                      PLANNING STAGE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Inputs:                        Output:                         │
│  ├─ ROADMAP.md                  └─ PLAN.md                      │
│  ├─ PROJECT.md                     ├─ Tasks with dependencies   │
│  ├─ research.md (if exists)        ├─ Success criteria          │
│  └─ context.md (if exists)         ├─ Verification steps        │
│                                    └─ Rollback procedures       │
│                                                                 │
│  Enhanced Feature (v2.7):                                       │
│  reis_planner now automatically reads research outputs from     │
│  .planning/research/ directory if they exist, providing         │
│  better context for plan creation.                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 3: REVIEW

**Subagent:** `reis_plan_reviewer`

Validates the plan before execution to catch issues early.

```
┌─────────────────────────────────────────────────────────────────┐
│                       REVIEW STAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Checks performed:                                              │
│  ├─ File path validation (do targets exist?)                    │
│  ├─ Already implemented detection                               │
│  ├─ Dependency analysis                                         │
│  ├─ Naming conflict detection                                   │
│  ├─ Code pattern consistency                                    │
│  └─ Missing import/utility detection                            │
│                                                                 │
│  Options:                                                       │
│  --skip-review     Skip this stage entirely                     │
│  --auto-fix        Automatically fix minor issues               │
│                                                                 │
│  Output: REVIEW_REPORT.md                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 4: EXECUTE

**Subagent:** `reis_executor`

Implements the plan by creating/modifying code.

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXECUTE STAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Execution Flow:                                                │
│  1. Parse PLAN.md tasks                                         │
│  2. Resolve task dependencies                                   │
│  3. Execute tasks in waves (parallel where possible)            │
│  4. Create atomic git commits per task                          │
│  5. Update STATE.md progress                                    │
│                                                                 │
│  Wave Execution:                                                │
│  ┌─────────────────────────────────────────────┐                │
│  │ Wave 1: [Task 1.1] [Task 1.2] [Task 1.3]   │ ← parallel     │
│  │            ↓          ↓          ↓          │                │
│  │ Wave 2:        [Task 2.1] [Task 2.2]       │ ← parallel     │
│  │                   ↓          ↓              │                │
│  │ Wave 3:              [Task 3.1]            │ ← sequential   │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  Options:                                                       │
│  --dry-run       Preview without executing                      │
│  --verbose       Show detailed output                           │
│  --timeout <ms>  Set execution timeout                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 5: VERIFY

**Subagent:** `reis_verifier`

Verifies that execution completed successfully.

```
┌─────────────────────────────────────────────────────────────────┐
│                       VERIFY STAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Verification Checks:                                           │
│  ├─ All deliverables exist                                      │
│  ├─ Tests pass (npm test / configured test command)             │
│  ├─ No syntax errors                                            │
│  ├─ Success criteria from PLAN.md met                           │
│  ├─ Feature completeness (FR4.1)                                │
│  └─ No stub implementations left                                │
│                                                                 │
│  Options:                                                       │
│  --strict        Fail on any warning                            │
│  --verbose       Show detailed verification output              │
│                                                                 │
│  Output: VERIFICATION_REPORT.md                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 6: GATE (Quality Gates)

Runs automated quality checks across multiple categories.

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUALITY GATES STAGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Gate Categories:                                               │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  SECURITY   │  │   QUALITY   │  │ PERFORMANCE │             │
│  │             │  │             │  │             │             │
│  │ • Secrets   │  │ • Linting   │  │ • Bundle    │             │
│  │ • Vulns     │  │ • Coverage  │  │   size      │             │
│  │ • Patterns  │  │ • Complexity│  │ • Memory    │             │
│  │ • Auth      │  │ • Standards │  │ • Speed     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐                                                │
│  │ACCESSIBILITY│                                                │
│  │             │                                                │
│  │ • ARIA      │                                                │
│  │ • Contrast  │                                                │
│  │ • Keyboard  │                                                │
│  └─────────────┘                                                │
│                                                                 │
│  Options:                                                       │
│  --skip-gates           Skip all gates                          │
│  --gate-only <category> Run only specific gate                  │
│                                                                 │
│  Output: GATE_REPORT.md                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 7: DEBUG (On Failure)

**Subagent:** `reis_debugger`

Activated when verification or gates fail.

```
┌─────────────────────────────────────────────────────────────────┐
│                       DEBUG STAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Debugging Flow:                                                │
│                                                                 │
│  1. Analyze failure reports                                     │
│  2. Pattern match against known issues                          │
│  3. Identify root cause                                         │
│  4. Design solution                                             │
│  5. Generate FIX_PLAN.md                                        │
│                                                                 │
│  Then:                                                          │
│  6. reis_executor applies the fix                               │
│  7. Return to VERIFY stage                                      │
│  8. Repeat up to max-attempts (default: 3)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────┐                │
│  │                                             │                │
│  │   FAIL ──► DEBUG ──► FIX ──► VERIFY ──┐    │                │
│  │              ▲                        │    │                │
│  │              └────────────────────────┘    │                │
│  │                  (max 3 attempts)          │                │
│  │                                             │                │
│  └─────────────────────────────────────────────┘                │
│                                                                 │
│  Options:                                                       │
│  --max-attempts <n>  Maximum debug/fix cycles (default: 3)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Command Options

### Full Options Reference

```bash
reis cycle [phase-or-plan] [options]

Arguments:
  phase-or-plan          Phase number or path to PLAN.md file

Research Options:
  --research             Run reis_scout before planning (phase research)
  --full-research        Run reis_analyst + reis_scout (project + phase research)

Skip Options:
  --skip-review          Skip plan review stage
  --skip-gates           Skip quality gates stage
  --quick                Skip research, review, AND gates (fast mode)

Gate Options:
  --gate-only <category> Run only specific gate (security|quality|performance|accessibility)

Recovery Options:
  --resume               Resume an interrupted cycle from last state
  --max-attempts <n>     Maximum debug/fix attempts (default: 3)

Auto-fix Options:
  --auto-fix             Automatically fix minor plan issues during review

Output Options:
  -v, --verbose          Show detailed output
  --dry-run              Preview cycle without executing
  --timeout <ms>         Set stage timeout in milliseconds

Global Options:
  --no-kanban            Disable kanban board display
```

---

## Cycle Modes

### 1. Default Mode (Full Cycle)

```bash
reis cycle 1
```

```
PLAN → REVIEW → EXECUTE → VERIFY → GATE → (DEBUG) → COMPLETE
```

**Use when:** Standard development, all quality checks needed.

### 2. Research Mode

```bash
# Phase research only
reis cycle 1 --research

# Full research (project + phase)
reis cycle 1 --full-research
```

```
RESEARCH → PLAN → REVIEW → EXECUTE → VERIFY → GATE → (DEBUG) → COMPLETE
```

**Use when:**
- Starting a new project
- Complex features requiring architectural decisions
- Unfamiliar codebase
- When you need comprehensive context

### 3. Quick Mode

```bash
reis cycle 1 --quick
```

```
PLAN → EXECUTE → VERIFY → (DEBUG) → COMPLETE
```

**Skips:** Research, Review, Gates

**Use when:**
- Small, low-risk changes
- Bug fixes with clear solutions
- Time-sensitive updates
- Changes you're confident about

⚠️ **Warning:** Quick mode reduces safety checks. Use for small, well-understood changes only.

### 4. Resume Mode

```bash
reis cycle --resume
```

Continues an interrupted cycle from where it stopped.

**Use when:**
- Cycle was interrupted (timeout, crash, manual stop)
- Need to continue from a specific stage
- After fixing external issues

### 5. Custom Mode

```bash
# Skip specific stages
reis cycle 1 --skip-review --skip-gates

# Focus on specific gate
reis cycle 1 --gate-only security

# Research + skip review
reis cycle 1 --research --skip-review
```

---

## Subagent Integration

### Subagents Used in Cycle

| Stage | Subagent | Fresh Context | Purpose |
|-------|----------|---------------|---------|
| Research | `reis_analyst` | ✅ 200K tokens | Project-wide analysis |
| Research | `reis_scout` | ✅ 200K tokens | Phase-specific research |
| Research | `reis_synthesizer` | ✅ 200K tokens | Combine research outputs |
| Planning | `reis_planner` | ✅ 200K tokens | Create execution plan |
| Review | `reis_plan_reviewer` | ✅ 200K tokens | Validate plan |
| Execute | `reis_executor` | ✅ 200K tokens | Implement changes |
| Verify | `reis_verifier` | ✅ 200K tokens | Verify completion |
| Debug | `reis_debugger` | ✅ 200K tokens | Analyze failures |

### Subagents NOT in Cycle

| Subagent | Purpose | How to Use |
|----------|---------|------------|
| `reis_integrator` | Cross-phase wiring verification | `reis audit` command |
| `reis_architect` | Roadmap creation | `reis roadmap` or manual |

---

## State Management

### Cycle States

```
RESEARCHING → PLANNING → REVIEWING → EXECUTING → VERIFYING → GATING → COMPLETE
                                         │           │
                                         └─── DEBUGGING ───► FIXING ───┘
                                                     │
                                                     └───► FAILED (after max attempts)
```

### State File Location

```
.planning/STATE.md
```

### State Tracking

The cycle automatically tracks:
- Current stage
- Completed stages
- Failed attempts
- Timestamps
- Wave progress (for parallel execution)

### Viewing State

```bash
# View current state
reis progress

# View detailed state
reis progress --verbose
```

---

## Error Handling & Recovery

### Automatic Recovery

The cycle includes automatic error recovery:

1. **Stage Failure**: Moves to DEBUG stage
2. **Debug Analysis**: `reis_debugger` analyzes the failure
3. **Fix Generation**: Creates `FIX_PLAN.md`
4. **Fix Application**: `reis_executor` applies the fix
5. **Re-verification**: Returns to VERIFY stage
6. **Repeat**: Up to `max-attempts` (default: 3)

### Manual Recovery

```bash
# Resume from last state
reis cycle --resume

# Check what went wrong
reis debug --input .planning/VERIFICATION_REPORT.md

# Fix manually and re-verify
reis verify
```

### Common Failure Scenarios

| Scenario | Auto-Recovery | Manual Action |
|----------|---------------|---------------|
| Test failure | ✅ reis_debugger analyzes | Review failing tests |
| Syntax error | ✅ reis_debugger fixes | Check generated code |
| Gate failure | ✅ Attempts fix | Review gate report |
| Timeout | ❌ | Resume with `--resume` |
| Network error | ❌ | Retry the cycle |
| Max attempts reached | ❌ | Manual debugging needed |

---

## Quality Gates

### Gate Categories

#### Security Gate
- Secret detection (API keys, passwords)
- Vulnerability scanning
- Security pattern violations
- Authentication issues

#### Quality Gate
- ESLint/linting violations
- Code coverage thresholds
- Complexity metrics
- Coding standards

#### Performance Gate
- Bundle size limits
- Memory usage
- Response time benchmarks

#### Accessibility Gate
- ARIA compliance
- Color contrast
- Keyboard navigation
- Screen reader compatibility

### Configuring Gates

In `reis.config.js`:

```javascript
module.exports = {
  gates: {
    security: {
      enabled: true,
      failOn: 'error',  // 'error', 'warning', or 'never'
    },
    quality: {
      enabled: true,
      coverage: 80,     // Minimum coverage percentage
      complexity: 10,   // Maximum cyclomatic complexity
    },
    performance: {
      enabled: true,
      maxBundleSize: '500kb',
    },
    accessibility: {
      enabled: false,   // Disable if not applicable
    },
  },
};
```

### Running Specific Gates

```bash
# Run only security gate
reis cycle 1 --gate-only security

# Skip all gates
reis cycle 1 --skip-gates

# Run gates manually
reis gate
reis gate --category security
```

---

## Best Practices

### 1. Start with Research for New Projects

```bash
# First phase of a new project
reis cycle 1 --full-research
```

### 2. Use Quick Mode Sparingly

```bash
# Only for small, confident changes
reis cycle 1 --quick
```

### 3. Don't Skip Review for Critical Features

```bash
# Keep review for important code
reis cycle 1  # Default includes review
```

### 4. Set Appropriate Timeouts for Large Features

```bash
# Large feature with many files
reis cycle 1 --timeout 600000  # 10 minutes
```

### 5. Use Resume Instead of Restarting

```bash
# If interrupted, don't start over
reis cycle --resume  # Continues from last state
```

### 6. Review Gate Reports

```bash
# Check gate output before dismissing failures
cat .planning/GATE_REPORT.md
```

### 7. Run Audit at Milestones

```bash
# Before completing a milestone
reis audit v1.0
reis complete-milestone v1.0
```

---

## Examples

### Example 1: Standard Feature Implementation

```bash
# Plan and execute phase 1
reis cycle 1

# Output:
# ✓ Planning complete → PLAN.md
# ✓ Review passed → REVIEW_REPORT.md
# ✓ Execution complete → 5 files changed, 3 commits
# ✓ Verification passed → VERIFICATION_REPORT.md
# ✓ Gates passed → GATE_REPORT.md
# ✓ Phase 1 complete!
```

### Example 2: Complex Feature with Research

```bash
# Research first for complex authentication feature
reis cycle 3 --full-research

# Output:
# ✓ Project analysis complete → context.md
# ✓ Phase research complete → research.md
# ✓ Planning complete (using research) → PLAN.md
# ... rest of cycle
```

### Example 3: Quick Bug Fix

```bash
# Fast fix for a simple bug
reis cycle 5 --quick

# Output:
# ✓ Planning complete → PLAN.md
# ✓ Execution complete → 1 file changed
# ✓ Verification passed
# ✓ Phase 5 complete!
```

### Example 4: Resuming After Interruption

```bash
# Cycle was interrupted during execution
reis cycle --resume

# Output:
# ℹ Resuming from EXECUTING stage
# ✓ Execution complete → 3 files remaining
# ✓ Verification passed
# ✓ Gates passed
# ✓ Phase complete!
```

### Example 5: Custom Gate Configuration

```bash
# Only run security checks for sensitive code
reis cycle 2 --skip-review --gate-only security

# Output:
# ✓ Planning complete
# ✓ Execution complete
# ✓ Verification passed
# ✓ Security gate passed
# ✓ Phase 2 complete!
```

### Example 6: Debugging a Failed Cycle

```bash
# Cycle failed at verification
reis cycle --resume

# Output:
# ℹ Resuming from DEBUGGING stage
# ✓ Debug analysis complete → FIX_PLAN.md
# ✓ Fix applied
# ✓ Verification passed (attempt 2/3)
# ✓ Gates passed
# ✓ Phase complete!
```

---

## Troubleshooting

### Issue: Cycle Stuck at Planning

**Symptoms:** Planning stage takes too long or hangs

**Solutions:**
1. Check if ROADMAP.md exists and is valid
2. Ensure phase number is correct
3. Try with verbose: `reis cycle 1 --verbose`
4. Check available disk space

### Issue: Review Finds Too Many Issues

**Symptoms:** Review stage reports many warnings/errors

**Solutions:**
1. Review REVIEW_REPORT.md for details
2. Use `--auto-fix` for minor issues: `reis cycle 1 --auto-fix`
3. Manually fix critical issues and resume
4. For complex issues, use `reis plan-gaps` to create fix plans

### Issue: Verification Failing Repeatedly

**Symptoms:** Cycle keeps looping through DEBUG/FIX/VERIFY

**Solutions:**
1. Check VERIFICATION_REPORT.md for root cause
2. Run `reis debug` manually for detailed analysis
3. Check if tests require external services
4. Review `--max-attempts` setting

### Issue: Gates Blocking Completion

**Symptoms:** Quality gates failing even for valid code

**Solutions:**
1. Review GATE_REPORT.md for specific failures
2. Adjust gate thresholds in reis.config.js
3. Use `--gate-only <category>` to isolate issues
4. Temporarily use `--skip-gates` (not recommended for production)

### Issue: Resume Not Working

**Symptoms:** `--resume` starts from beginning

**Solutions:**
1. Check if STATE.md exists in .planning/
2. Verify STATE.md isn't corrupted
3. Check file permissions
4. Try `reis progress` to see current state

### Issue: Research Not Being Used

**Symptoms:** Planner ignoring research outputs

**Solutions:**
1. Ensure research files exist in `.planning/research/`
2. Check file names match expected pattern
3. Verify research completed successfully
4. Use `--verbose` to see if planner detects research

---

## Related Commands

| Command | Description |
|---------|-------------|
| `reis plan` | Create plan without executing |
| `reis execute` | Execute without verification |
| `reis verify` | Verify without full cycle |
| `reis debug` | Debug specific issues |
| `reis gate` | Run quality gates only |
| `reis quick <task>` | Quick one-off task |
| `reis audit` | Milestone integration check |
| `reis progress` | View current cycle state |
| `reis checkpoint` | Create/manage checkpoints |

---

## Configuration Reference

### reis.config.js Options for Cycle

```javascript
module.exports = {
  // Cycle behavior
  cycle: {
    maxAttempts: 3,           // Max debug/fix attempts
    autoCommit: true,         // Auto-commit after tasks
    parallelExecution: true,  // Enable wave parallelism
    timeout: 300000,          // Default timeout (5 min)
  },
  
  // Research settings
  research: {
    autoContext: true,        // Auto-create context.md
    synthesize: true,         // Auto-synthesize multiple outputs
  },
  
  // Review settings
  review: {
    autoFix: false,           // Auto-fix minor issues
    strictMode: false,        // Fail on warnings
  },
  
  // Gate settings
  gates: {
    security: { enabled: true },
    quality: { enabled: true, coverage: 80 },
    performance: { enabled: true },
    accessibility: { enabled: false },
  },
  
  // Subagent settings
  subagents: {
    timeout: 300000,          // Subagent timeout
    maxParallel: 4,           // Max parallel subagents
  },
};
```

---

## Version History

| Version | Changes |
|---------|---------|
| 2.7.0 | Added `--research`, `--full-research`, `--quick` flags |
| 2.7.0 | Enhanced reis_planner to read research outputs |
| 2.7.0 | Added RESEARCHING state to cycle |
| 2.6.0 | Added quality gates integration |
| 2.5.0 | Added wave-based parallel execution |
| 2.4.0 | Added `--resume` capability |
| 2.0.0 | Initial cycle command |

---

*For more information, see:*
- [REIS Documentation](../README.md)
- [Quality Gates Guide](./QUALITY_GATES.md)
- [Parallel Execution](./PARALLEL_EXECUTION.md)
- [Verification Patterns](./verification-patterns.md)
