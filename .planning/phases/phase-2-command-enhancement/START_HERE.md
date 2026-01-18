# Phase 2: Command Enhancement - START HERE

## 🎯 What This Phase Does

This phase implements **4 production-ready commands** that bring REIS v2.0's wave-based execution to life:

1. **`reis execute-plan`** (enhanced) - Execute PLAN.md files with wave-based automation
2. **`reis checkpoint`** (new) - Manual checkpoint creation and management
3. **`reis resume`** (enhanced) - Smart resume from checkpoints or last state
4. **`reis config`** (new) - Configuration management and validation

## 🚀 Quick Start (For Executors)

### Option 1: Using REIS v2.0 (Recommended)
```bash
# Wave 1 - Execute in parallel (3 terminals or 3 developers)
reis execute-plan .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-2-checkpoint-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-4-config-command.PLAN.md

# Wave 2 - Execute after Wave 1 complete
reis execute-plan .planning/phases/phase-2-command-enhancement/2-3-resume-command.PLAN.md

# Wave 3 - Execute after Wave 2 complete
reis execute-plan .planning/phases/phase-2-command-enhancement/2-5-integration-testing.PLAN.md
```

### Option 2: Manual Execution (Solo Developer)
Execute plans in this order:
1. Read `2-2-checkpoint-command.PLAN.md` → Implement → Test
2. Read `2-4-config-command.PLAN.md` → Implement → Test
3. Read `2-1-execute-plan-command.PLAN.md` → Implement → Test
4. Read `2-3-resume-command.PLAN.md` → Implement → Test (requires Plan 2-2 done)
5. Read `2-5-integration-testing.PLAN.md` → Test → Verify

## 📖 Documentation Guide

### Read First (5 minutes)
- **This file** (START_HERE.md) - You are here
- **README.md** - Quick overview and success criteria

### Read Before Execution (15 minutes)
- **WAVE_EXECUTION_GUIDE.md** - Detailed execution strategies and troubleshooting
- **EXECUTION_SUMMARY.md** - Complete implementation details

### Read for Context (Optional)
- **PHASE-2-OVERVIEW.md** - Strategic overview, architecture, risk assessment

### Execution Plans (Read as needed)
- **2-1-execute-plan-command.PLAN.md** - Execute-plan enhancement (Wave 1)
- **2-2-checkpoint-command.PLAN.md** - Checkpoint command (Wave 1)
- **2-3-resume-command.PLAN.md** - Resume enhancement (Wave 2)
- **2-4-config-command.PLAN.md** - Config command (Wave 1)
- **2-5-integration-testing.PLAN.md** - Integration tests (Wave 3)

## ⚡ Key Facts

- **Total Plans**: 5
- **Total Tasks**: 15 (12 automated, 3 manual verification)
- **Estimated Time**: 4-5 days solo, 2-3 days with team of 3
- **Dependencies**: Phase 1 complete (✅), Plan 2-3 depends on Plan 2-2
- **Risk Level**: Low-Medium (well-tested foundation)
- **Test Coverage**: ~100+ tests (unit + integration + E2E)

## 🎨 What You'll Build

### New Commands
```bash
# Checkpoint management
reis checkpoint create my-checkpoint
reis checkpoint list
reis checkpoint show my-checkpoint

# Config management
reis config show
reis config init
reis config validate
reis config docs
```

### Enhanced Commands
```bash
# Wave-based execution (new --wave flag)
reis execute-plan path/to/plan.PLAN.md --wave

# Smart resume (new checkpoint support)
reis resume
reis resume --checkpoint my-checkpoint
reis resume --continue
```

### New Files Created
- `lib/commands/checkpoint.js` (new)
- `lib/commands/config.js` (new)
- `lib/commands/execute-plan.js` (enhanced)
- `lib/commands/resume.js` (enhanced)
- 6 test files
- 2 template files

## ✅ Success Criteria Checklist

Before marking Phase 2 complete, verify:

- [ ] All 5 plans executed successfully
- [ ] All 4 commands work (execute-plan, checkpoint, resume, config)
- [ ] 100% of automated tests passing
- [ ] Manual verification checklist complete
- [ ] No regressions in Phase 1 (48 tests still passing)
- [ ] Backward compatibility confirmed (v1.x projects work)
- [ ] Documentation complete (help text, templates)
- [ ] Performance acceptable (<5s for operations)
- [ ] STATE.md updated with Phase 2 completion
- [ ] Ready to bump version to v2.0.0-alpha.2

## 🔄 Execution Workflow

### Step 1: Preparation (5 minutes)
```bash
# Verify Phase 1 complete
npm test  # Should see 48 tests passing

# Create checkpoint before starting
git checkout -b phase-2-command-enhancement
reis checkpoint create phase-2-start
```

### Step 2: Wave 1 Execution (1-2 days)
Execute Plans 2-1, 2-2, 2-4 (parallel or sequential)

**Checkpoint after Wave 1:**
```bash
npm test  # Verify tests passing
reis checkpoint create phase-2-wave-1-complete
```

### Step 3: Wave 2 Execution (1 day)
Execute Plan 2-3 (requires Plan 2-2 complete)

**Checkpoint after Wave 2:**
```bash
npm test  # Verify tests passing
reis checkpoint create phase-2-wave-2-complete
```

### Step 4: Wave 3 Execution (1 day)
Execute Plan 2-5 (integration testing)

**Checkpoint after Wave 3:**
```bash
npm test  # Should see ~100+ tests passing
reis checkpoint create phase-2-complete
```

### Step 5: Release (1 hour)
```bash
# Update version
npm version 2.0.0-alpha.2

# Update STATE.md
# Update CHANGELOG.md

# Commit and tag
git commit -am "Phase 2 complete: Command Enhancement"
git tag v2.0.0-alpha.2
```

## 🐛 Troubleshooting

### Problem: Plan 2-3 fails due to missing checkpoint infrastructure
**Solution**: Ensure Plan 2-2 is fully complete. Run `npm test -- test/commands/checkpoint.test.js` to verify.

### Problem: Tests fail with "Cannot find module '../utils/wave-executor'"
**Solution**: Verify Phase 1 is complete. Check that lib/utils/wave-executor.js exists.

### Problem: Manual verification checkpoint is blocking
**Solution**: Human checkpoints can be handled async. Continue with other plans while waiting.

### Problem: Integration tests fail
**Solution**: Ensure all Wave 1 and Wave 2 plans complete before starting Wave 3.

### Problem: Git integration tests fail
**Solution**: Check that test fixtures initialize git repos. See test/integration/phase1-integration.test.js for examples.

## 📊 Progress Tracking

Update `.planning/STATE.md` after each plan:

```markdown
## Completed Waves
- **Wave 1.1: Execute-Plan Command** (YYYY-MM-DD) ✅
- **Wave 1.2: Checkpoint Command** (YYYY-MM-DD) ✅
- **Wave 1.3: Config Command** (YYYY-MM-DD) ✅
- **Wave 2.1: Resume Command** (YYYY-MM-DD) ✅
- **Wave 3.1: Integration Testing** (YYYY-MM-DD) ✅
```

## 🎓 Learning Resources

### Understanding Wave-Based Execution
Read: `lib/utils/wave-executor.js` (Phase 1)
See: `2-1-execute-plan-command.PLAN.md` for integration example

### Understanding Checkpoints
Read: `lib/utils/state-manager.js` (Phase 1)
See: `2-2-checkpoint-command.PLAN.md` for implementation

### Understanding Config System
Read: `lib/utils/config.js` (Phase 1)
See: `2-4-config-command.PLAN.md` for CLI wrapper

## 💡 Pro Tips

1. **Parallel Execution**: Wave 1 plans are truly independent. Run simultaneously if you have the resources.

2. **Test Early, Test Often**: Run `npm test` after each task completion, not just at plan end.

3. **Use Checkpoints**: Create checkpoints before risky changes. Easy rollback if needed.

4. **Read the WHY**: Each task has "WHY avoid certain approaches" - read these to avoid common pitfalls.

5. **Manual Verification Matters**: Don't skip human checkpoints. They catch UX issues automated tests miss.

## 🎉 After Phase 2

Once Phase 2 is complete:

1. **Celebrate!** You've built a production-ready wave execution system
2. **Beta Test**: Try commands on real projects
3. **Gather Feedback**: What works? What needs improvement?
4. **Plan Phase 3**: Advanced features (validation, optimization, dependency analysis)

## 📞 Need Help?

- **Stuck on a task?** Read the task's `<action>` section carefully - it has specific instructions
- **Test failing?** Check the `<verify>` section for debugging steps
- **Unclear requirement?** Read the plan's "Context" and "Objective" sections
- **Design question?** Read PHASE-2-OVERVIEW.md for architecture rationale

## 🚦 Ready to Start?

If you've read this far, you're ready! Here's your first command:

```bash
# Option A: Using REIS v2.0 (automated)
reis execute-plan .planning/phases/phase-2-command-enhancement/2-2-checkpoint-command.PLAN.md

# Option B: Manual (read and implement)
cat .planning/phases/phase-2-command-enhancement/2-2-checkpoint-command.PLAN.md
```

Good luck! 🚀

---

**Phase**: 2 of 4 (Command Enhancement)
**Status**: Ready for Execution ✅
**Created**: 2026-01-18
**Target Version**: v2.0.0-alpha.2
