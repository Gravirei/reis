# Phase 2: Command Enhancement - Overview

## Objective
Implement 4 enhanced commands that leverage Phase 1 utilities for wave-based execution, checkpoints, and configuration management.

## Wave Structure

### Wave 1 (Parallel Execution) - All 4 Commands
All commands can be developed in parallel as they have no dependencies on each other:

- **Plan 2-1**: Enhanced Execute-Plan Command
- **Plan 2-2**: Checkpoint Command
- **Plan 2-3**: Enhanced Resume Command (depends on Plan 2-2)
- **Plan 2-4**: Config Command

**Note**: Plan 2-3 has a soft dependency on Plan 2-2 (checkpoint infrastructure), so it should be executed in Wave 2.

### Corrected Wave Structure

#### Wave 1 (Parallel) - 3 Plans
- Plan 2-1: Execute-Plan Command
- Plan 2-2: Checkpoint Command  
- Plan 2-4: Config Command

#### Wave 2 (Sequential) - 1 Plan
- Plan 2-3: Resume Command (depends on checkpoint infrastructure from 2-2)

## Commands Summary

### 1. reis execute-plan (Plan 2-1)
**Purpose**: Execute PLAN.md files using WaveExecutor

**Key Features**:
- `--wave` flag enables wave-based execution
- Backward compatibility (no flag = old behavior)
- Sequential wave execution with checkpoints
- Auto-commit on wave completion
- Progress tracking and STATE.md updates

**Integration Points**:
- WaveExecutor (Phase 1)
- StateManager (Phase 1)
- GitIntegration (Phase 1)
- Config system (Phase 1)

### 2. reis checkpoint (Plan 2-2)
**Purpose**: Manual checkpoint creation and management

**Key Features**:
- `create [name]` - Create checkpoint with optional name
- `list` - Show all checkpoints in table format
- `show <name>` - Display checkpoint details
- Git integration with `--commit` flag
- Timestamp and context tracking

**Integration Points**:
- StateManager (Phase 1)
- GitIntegration (Phase 1)
- Config system (Phase 1)

### 3. reis resume (Plan 2-3)
**Purpose**: Resume work from checkpoints or last state

**Key Features**:
- Smart resume with context analysis
- `--checkpoint <name>` - Resume from specific checkpoint
- `--list` - Show all resume points
- `--continue` - Continue incomplete wave
- Git diff display when resuming

**Integration Points**:
- StateManager (Phase 1)
- WaveExecutor (Phase 1)
- GitIntegration (Phase 1)
- Checkpoint command (Plan 2-2)

**Dependencies**: Plan 2-2 (checkpoint infrastructure)

### 4. reis config (Plan 2-4)
**Purpose**: Configuration management

**Key Features**:
- `show` - Display current config (formatted)
- `init` - Create sample reis.config.js
- `validate` - Check config correctness
- `docs` - Show configuration documentation
- JSON output support

**Integration Points**:
- Config system (Phase 1)
- Template system (new)

## Testing Strategy

### Unit Tests
Each command gets comprehensive unit tests:
- Test files: `test/commands/<command>.test.js`
- Mock Phase 1 utilities to isolate command logic
- Test all subcommands and flags
- Test error cases and edge cases
- Use mocha/assert pattern

### Integration Tests
After all commands complete:
- Test files: `test/integration/phase2-integration.test.js`
- Test commands working together:
  - execute-plan → checkpoint → resume flow
  - config → execute-plan with custom config
  - checkpoint → resume from checkpoint
- Test real PLAN.md execution
- Test git integration end-to-end

### Manual Verification
Each command has manual verification checkpoint:
- Real-world usage testing
- User experience validation
- Error message clarity
- Output formatting
- Backward compatibility check

## Risk Assessment

### Low Risk
- **Config command** - Simple CRUD operations, no execution
- **Checkpoint command** - Primarily STATE.md updates

### Medium Risk
- **Execute-plan command** - Complex integration but well-tested Phase 1 utilities
- **Resume command** - Depends on checkpoint infrastructure

### Mitigation Strategies
1. **Comprehensive testing** - Unit + integration + manual
2. **Feature flags** - New features behind `--wave`, `--checkpoint` flags
3. **Backward compatibility** - Old behavior preserved
4. **Gradual rollout** - Test with v1.x projects first
5. **Error handling** - Graceful degradation on failures

## Success Metrics

### Code Quality
- ✅ 100% of unit tests passing
- ✅ 100% of integration tests passing
- ✅ All manual verifications complete
- ✅ No regressions in existing commands

### User Experience
- ✅ Commands are intuitive and discoverable
- ✅ Error messages are helpful and actionable
- ✅ Output is clear and well-formatted
- ✅ Documentation is comprehensive

### Functionality
- ✅ Wave-based execution works reliably
- ✅ Checkpoints save and restore correctly
- ✅ Config system is flexible and validated
- ✅ Resume command provides smart suggestions

### Integration
- ✅ All commands work together seamlessly
- ✅ Git integration is smooth
- ✅ STATE.md updates are accurate
- ✅ Backward compatibility maintained

## Timeline Estimate

### Wave 1 (Parallel - 3 commands)
- **Duration**: 2-3 days
- **Effort**: Each command ~6-8 hours
- **Parallelizable**: Yes (3 developers could do simultaneously)

### Wave 2 (Sequential - 1 command)
- **Duration**: 1 day
- **Effort**: ~6-8 hours
- **Depends on**: Wave 1 completion (specifically Plan 2-2)

### Integration & Testing
- **Duration**: 1 day
- **Activities**: 
  - Integration tests
  - Manual verification
  - Documentation updates
  - Bug fixes

### Total Phase 2
- **Estimated**: 4-5 days
- **With 1 developer**: 4-5 days sequential
- **With 3 developers**: 2-3 days (Wave 1 parallel)

## Deliverables

### Code
- ✅ lib/commands/execute-plan.js (enhanced)
- ✅ lib/commands/checkpoint.js (new)
- ✅ lib/commands/resume.js (enhanced)
- ✅ lib/commands/config.js (new)

### Tests
- ✅ test/commands/execute-plan.test.js
- ✅ test/commands/checkpoint.test.js
- ✅ test/commands/resume.test.js
- ✅ test/commands/config.test.js
- ✅ test/integration/phase2-integration.test.js

### Templates
- ✅ templates/reis.config.template.js
- ✅ templates/CONFIG_DOCS.md

### Documentation
- ✅ Updated help text for all commands
- ✅ Config documentation
- ✅ Migration guide (if needed)
- ✅ Example workflows

## Next Steps After Phase 2

1. **Beta Testing**: Test with real REIS projects
2. **User Feedback**: Gather feedback on new commands
3. **Performance Tuning**: Optimize wave execution
4. **Documentation**: Update README and docs
5. **Phase 3 Planning**: Advanced features (validation, optimization)

## Notes

- All commands maintain backward compatibility
- New features are opt-in via flags
- Comprehensive error handling throughout
- Git integration is optional (works without git)
- Config system uses sensible defaults
- Manual verification ensures quality
