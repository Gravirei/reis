## REIS Resume Cheat Sheet (Crash / Internet Loss / Power Cut)

### What REIS uses to resume
- Cycle state: `.reis/cycle-state.json`
- Task-level execution state: `.reis/execution-state.json`

---

# 1) Which resume command should I run?

## If you were running the full workflow (`cycle`)
**Best default:**
```bash
reis cycle --resume --resume-execution
```

## If you were only executing a phase (`execute`)
```bash
reis execute <phase> --resume
```

---

# 2) Resume from a specific Wave or Task

## Resume from Wave 2
```bash
reis execute <phase> --resume --from-wave 2
# or
reis cycle --resume --resume-execution --from-wave 2
```

## Resume from a specific Task (task id or task name)
```bash
reis execute <phase> --resume --from-task "<taskIdOrName>"
# or
reis cycle --resume --resume-execution --from-task "<taskIdOrName>"
```

---

# 3) Dirty repo after crash? (partial changes)

## Let REIS stash changes automatically
```bash
reis execute <phase> --resume --auto-stash
# or
reis cycle --resume --resume-execution --auto-stash
```

## Roll back before resuming (choose mode)
```bash
reis execute <phase> --resume --rollback hard
# soft|mixed|hard
```

---

# 4) Using REIS through me (agent mode), not CLI
Just tell me **what stopped** and I’ll run the correct resume:

### If you were in cycle
> “Resume: `reis cycle <phase>` stopped during Wave <n>. Use task-level resume.”

I will run:
```bash
reis cycle --resume --resume-execution --from-wave <n>
```

### If you were in execute
> “Resume: `reis execute <phase>` stopped during Wave <n>.”

I will run:
```bash
reis execute <phase> --resume --from-wave <n>
```

---

# 5) Quick examples

### Example A (cycle died on wave 2, phase 6)
```bash
reis cycle --resume --resume-execution --from-wave 2
```

### Example B (execute died, you don’t know wave)
```bash
reis execute 6 --resume
```

### Example C (resume by task name)
```bash
reis cycle --resume --resume-execution --from-task "Implement execution lock"
```
