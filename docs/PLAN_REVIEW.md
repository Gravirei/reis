# Plan Review

The Plan Reviewer validates REIS plans against your codebase before execution, catching issues early.

## Overview

The review step runs automatically in the REIS cycle:

```
PLAN → REVIEW → EXECUTE → VERIFY → GATE → DEBUG
```

## Quick Start

```bash
# Review all plans in .planning directory
reis review

# Review specific plan
reis review .planning/phases/feature/PLAN.md

# Review with auto-fix
reis review --auto-fix

# Review with strict mode (fail on warnings)
reis review --strict
```

## What Gets Checked

| Check | Description |
|-------|-------------|
| File Existence | Target files exist in codebase |
| Function Detection | Functions already implemented |
| Export Verification | Exports already in place |
| Dependency Analysis | npm packages available |
| Path Correctness | File paths valid |

## Status Codes

| Status | Icon | Meaning |
|--------|------|---------|
| `ok` | ✅ | Task valid, ready for execution |
| `already_complete` | ✅ | Target already implemented |
| `path_error` | ⚠️ | File path incorrect |
| `missing_dependency` | ❌ | Required dependency missing |
| `conflict` | ❌ | Conflicts with existing code |

## Configuration

```javascript
// reis.config.js
module.exports = {
  review: {
    enabled: true,
    autoFix: false,
    strict: false,
    checks: {
      fileExists: true,
      functionExists: true,
      exportExists: true,
      dependencyExists: true
    }
  }
};
```

## CLI Options

| Option | Description |
|--------|-------------|
| `--auto-fix` | Automatically fix simple issues |
| `--strict` | Fail on warnings |
| `--report [file]` | Save report to file |
| `-v, --verbose` | Show detailed output |

## Cycle Integration

```bash
# Full cycle includes review
reis cycle 3

# Skip review for faster iteration
reis cycle 3 --skip-review
```

## Review Report

The reviewer generates a detailed report:

```markdown
# Plan Review Report

## Summary
- Plans Reviewed: 5
- Plans OK: 3
- Plans with Issues: 2
- Auto-Fixed: 1

## Plan Details
### plan-1-1.PLAN.md
| Task | Status | Issue |
|------|--------|-------|
| Task 1 | ✅ ok | - |
| Task 2 | ⚠️ path_error | Fixed: lib/util → lib/utils |
```

## Best Practices

1. **Run review before execution** - Catch issues early
2. **Use auto-fix for simple issues** - Saves manual corrections
3. **Review warnings carefully** - May indicate design issues
4. **Don't skip in CI/CD** - Ensures plan quality

## Subagent: reis_plan_reviewer

For AI-assisted plan review, use the `reis_plan_reviewer` subagent:

```
"Review this plan using reis_plan_reviewer"
```

The subagent:
- Analyzes plan tasks against codebase
- Detects already-implemented features
- Suggests path corrections
- Validates dependencies
- Generates fix recommendations

## Troubleshooting

### Common Issues

**"File not found" errors:**
- Check file paths in plan match actual structure
- Use `--auto-fix` to attempt path correction

**"Function already exists" warnings:**
- Plan may be outdated; regenerate with `reis plan`
- Or mark task as `skip` in plan

**"Missing dependency" errors:**
- Run `npm install <package>` before review
- Or add to `package.json` dependencies

### Debug Mode

```bash
# Verbose output for debugging
reis review --verbose

# Generate detailed report
reis review --report review-debug.md
```

## See Also

- [Cycle Command](CYCLE_COMMAND.md) - Full cycle automation
- [Verification](VERIFICATION.md) - Post-execution verification
- [Quality Gates](QUALITY_GATES.md) - Gate checks after verification
