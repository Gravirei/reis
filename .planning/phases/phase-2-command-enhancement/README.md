# Phase 2: Command Enhancement

## Quick Start

### For Executors
Execute plans in wave order:

**Wave 1 (Parallel)** - Can run simultaneously:
```bash
reis execute-plan .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-2-checkpoint-command.PLAN.md
reis execute-plan .planning/phases/phase-2-command-enhancement/2-4-config-command.PLAN.md
```

**Wave 2 (Sequential)** - After Wave 1 complete:
```bash
reis execute-plan .planning/phases/phase-2-command-enhancement/2-3-resume-command.PLAN.md
```

**Wave 3 (Integration)** - After Wave 2 complete:
```bash
reis execute-plan .planning/phases/phase-2-command-enhancement/2-5-integration-testing.PLAN.md
```

### For Reviewers
Key documents:
- **EXECUTION_SUMMARY.md** - Complete implementation guide
- **PHASE-2-OVERVIEW.md** - Strategic overview and risk assessment
- **Individual PLAN.md files** - Detailed task breakdowns

## Plan Files

| Plan | File | Wave | Dependencies | Tasks | Estimated Time |
|------|------|------|--------------|-------|----------------|
| 2-1 | 2-1-execute-plan-command.PLAN.md | 1 | None | 3 | 6-8 hours |
| 2-2 | 2-2-checkpoint-command.PLAN.md | 1 | None | 3 | 6-8 hours |
| 2-4 | 2-4-config-command.PLAN.md | 1 | None | 3 | 6-8 hours |
| 2-3 | 2-3-resume-command.PLAN.md | 2 | Plan 2-2 | 3 | 6-8 hours |
| 2-5 | 2-5-integration-testing.PLAN.md | 3 | All above | 3 | 6-8 hours |

**Total Estimated Time**: 30-40 hours (4-5 days solo, 2-3 days with 3 developers)

## What Gets Built

### Commands
1. **reis execute-plan** (enhanced) - Wave-based PLAN.md execution
2. **reis checkpoint** (new) - Manual checkpoint management
3. **reis resume** (enhanced) - Smart resume from checkpoints
4. **reis config** (new) - Configuration management

### Tests
- 4 unit test files (one per command)
- 1 integration test file
- 1 E2E test file
- 1 manual test checklist

### Templates
- reis.config.template.js
- CONFIG_DOCS.md

## Success Criteria

- ✅ All 4 commands implemented and tested
- ✅ Wave-based execution working reliably
- ✅ Checkpoint system functional
- ✅ Configuration management complete
- ✅ 100% test pass rate
- ✅ Backward compatibility maintained
- ✅ Manual verification complete

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 REIS Phase 2 Commands               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  execute-plan    checkpoint    resume    config    │
│       │              │            │         │      │
│       └──────────────┴────────────┴─────────┘      │
│                      │                              │
│              Phase 1 Utilities                      │
│         (config, state, git, wave-executor)        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Key Features

### Wave-Based Execution
- Sequential wave execution with checkpoints
- Progress tracking and STATE.md updates
- Auto-commit on wave completion
- Error recovery and rollback

### Checkpoint System
- Manual checkpoint creation
- Automatic checkpoints between waves
- Git integration (optional)
- Checkpoint listing and details

### Smart Resume
- Context-aware resume suggestions
- Resume from specific checkpoint
- Continue incomplete waves
- Git diff display

### Configuration Management
- Initialize sample config
- Validate config files
- Display current settings
- Comprehensive documentation

## Risk Assessment

### Low Risk ✅
- Config command (simple CRUD)
- Checkpoint command (STATE.md updates)

### Medium Risk ⚠️
- Execute-plan enhancement (complex integration)
- Resume enhancement (depends on checkpoints)

### Mitigation ✅
- Comprehensive testing (unit + integration + E2E)
- Feature flags (--wave, --checkpoint are opt-in)
- Backward compatibility (old behavior preserved)
- Manual verification checkpoints
- Graceful error handling

## Testing Strategy

### Unit Tests (~60-80 tests)
Each command tested in isolation:
- All subcommands and flags
- Error cases and edge cases
- Mock Phase 1 utilities
- Independent and deterministic

### Integration Tests (~20-30 tests)
Commands working together:
- Config → Execute → Checkpoint flow
- Execute → Interrupt → Resume flow
- Checkpoint → Resume from checkpoint
- STATE.md consistency
- Git integration

### E2E Tests (~5-10 scenarios)
Real-world workflows:
- Solo developer building feature
- Interrupted development session
- Configuration experimentation
- Checkpoint-driven development
- Multi-phase project

### Manual Tests (~40 items)
Human verification:
- User experience
- Error message clarity
- Output formatting
- Performance
- Backward compatibility

## Integration with Phase 1

Phase 2 commands leverage all Phase 1 utilities:

| Phase 1 Utility | Used By Commands |
|-----------------|------------------|
| config.js | All commands |
| state-manager.js | All commands |
| git-integration.js | execute-plan, checkpoint, resume |
| wave-executor.js | execute-plan, resume |

## Backward Compatibility

### Breaking Changes
**None** - All new features are opt-in

### Migration Path
1. Existing `reis execute-plan` → Works as before (prompt-based)
2. Opt-in to wave execution with `--wave` flag
3. Existing `reis resume` → Works as before (prompt-based)
4. Enhanced with checkpoint support (automatic)

### Version Support
- v1.x projects → Full support with graceful degradation
- v2.0 projects → Full feature set

## Documentation

### For Users
- Command help text (--help)
- CONFIG_DOCS.md (comprehensive config reference)
- Examples in EXECUTION_SUMMARY.md
- Migration guide (coming in Phase 4)

### For Developers
- Inline code comments (JSDoc)
- Test files as usage examples
- PHASE-2-OVERVIEW.md (architecture)
- Individual PLAN.md files (task details)

## Performance Targets

- Config load: < 50ms ✅
- STATE.md update: < 100ms ✅
- Checkpoint create: < 200ms ✅
- Wave execution: ~5-15 min per wave (varies by task complexity)
- Git operations: < 500ms ✅
- Command help: < 50ms ✅

## Known Limitations

1. **No concurrent execution** - Waves execute sequentially
2. **No checkpoint compression** - All checkpoints kept indefinitely
3. **Limited git conflict resolution** - Manual resolution required
4. **No remote sync** - Checkpoints are local only

These are intentional simplifications for v2.0. Future phases may address.

## FAQ

**Q: Can I use new commands in v1.x projects?**
A: Yes, they gracefully degrade and use defaults.

**Q: Do I need git for checkpoints?**
A: No, checkpoints work with STATE.md alone. Git is optional.

**Q: Will this break my existing workflows?**
A: No, backward compatibility is maintained. New features are opt-in.

**Q: How do I migrate from v1.x to v2.0?**
A: No migration needed. Your project works as-is with added features.

**Q: Can I customize wave sizes?**
A: Yes, via `reis config init` and editing reis.config.js.

**Q: What happens if execution fails mid-wave?**
A: State is saved, and `reis resume` can continue from last checkpoint.

## Support

- Issues: GitHub Issues
- Documentation: ~/.rovodev/reis/
- Examples: test/ directory
- Community: Coming in Phase 4

## Next Steps

After Phase 2 completion:
1. Update package.json → v2.0.0-alpha.2
2. Update CHANGELOG.md
3. Beta testing with select users
4. Gather feedback
5. Plan Phase 3 (Advanced Features)

---

**Created**: 2026-01-18
**Status**: Ready for execution
**Estimated Completion**: 4-5 days (solo), 2-3 days (team of 3)
