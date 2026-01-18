# Plan: 3-5 - Advanced Commands (validate, optimize, analyze, visualize)

## Objective
Implement four new commands that leverage Phase 3 utilities: validate, optimize, analyze, and visualize.

## Context
- Phase 3 utilities are complete: plan-validator, metrics-tracker, plan-optimizer, visualizer
- Need user-facing commands to access this functionality
- Commands should be intuitive, fast, and provide actionable output
- Should integrate with existing REIS workflow seamlessly

## Dependencies
Depends on Plans 3-1, 3-2, 3-3, 3-4 - All utilities must be implemented

## Tasks

<task type="auto">
<name>Implement reis validate command</name>
<files>lib/commands/validate.js</files>
<action>
Create validate.js command to validate PLAN.md files:

1. Command signature:
   ```
   reis validate <plan-path> [options]
   
   Options:
     --strict         Treat warnings as errors
     --json           Output results as JSON
     --fix            Auto-fix simple issues (future enhancement)
     --quiet          Only show errors, skip warnings
   ```

2. Implementation:
   - Import plan-validator utility
   - Load plan file from path (default: .planning/PLAN.md)
   - Run validatePlan(planPath)
   - Display validation results with formatting

3. Output format (default):
   ```
   Validating: .planning/PLAN.md
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   ✓ Structure valid
   ✓ 3 waves found
   ✓ 12 tasks validated
   
   ⚠️  Warnings (2):
   • Line 45: Wave 2 has 8 tasks (consider splitting)
   • Line 67: Task "Setup auth" is vague, be more specific
   
   💡 Suggestions (1):
   • Consider adding checkpoint after Wave 2
   
   Validation: PASSED (2 warnings)
   Run with --strict to treat warnings as errors
   ```

4. Output format (--json):
   ```json
   {
     "valid": true,
     "errors": [],
     "warnings": [
       {"line": 45, "type": "wave-size", "message": "..."},
       {"line": 67, "type": "vague-task", "message": "..."}
     ],
     "suggestions": [
       {"message": "Consider adding checkpoint after Wave 2"}
     ],
     "summary": {
       "waves": 3,
       "tasks": 12,
       "errors": 0,
       "warnings": 2
     }
   }
   ```

5. Error handling:
   - File not found → helpful error with suggestion
   - Parse errors → show line numbers and context
   - Exit code 0 if valid, 1 if errors, 0 if only warnings (unless --strict)

6. Integration with execute-plan:
   - execute-plan can use validate internally
   - Share validation logic, don't duplicate

7. Help text:
   - Clear examples
   - Explain validation types
   - Link to documentation

WHY:
- Catch errors before execution (save time)
- Educate users on plan format (improve quality)
- JSON output enables tooling integration
- Strict mode for CI/CD pipelines
</action>
<verify>
# Test command loads
node bin/reis.js validate --help

# Test validation
node bin/reis.js validate .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md

# Test JSON output
node bin/reis.js validate test/fixtures/sample.PLAN.md --json | jq .

# Test strict mode
node bin/reis.js validate test/fixtures/warning.PLAN.md --strict
echo "Exit code: $?"
</verify>
<done>
- validate command implemented
- Default output is formatted and readable
- JSON output for tooling
- --strict mode for CI/CD
- --quiet mode for scripting
- Help text clear and comprehensive
- Exit codes correct
- Integration with plan-validator seamless
</done>
</task>

<task type="auto">
<name>Implement reis optimize and analyze commands</name>
<files>lib/commands/optimize.js, lib/commands/analyze.js</files>
<action>
Create optimize.js and analyze.js commands:

## optimize command:

1. Command signature:
   ```
   reis optimize <plan-path> [options]
   
   Options:
     --apply          Apply suggested optimizations (interactive)
     --json           Output as JSON
     --focus=type     Focus on specific optimization type
                      (wave-size, parallelization, distribution, risk)
   ```

2. Implementation:
   - Import plan-optimizer utility
   - Run PlanOptimizer.analyzePlan(planPath)
   - Display optimization report with formatting
   - Show top 3-5 most impactful suggestions

3. Output format:
   ```
   Optimizing: .planning/PLAN.md
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   📊 Current Plan:
   • 5 waves, 23 tasks
   • Estimated duration: 120m
   • Risk score: 0.3 (Medium)
   
   🎯 Optimization Opportunities:
   
   1. Split Wave 2 (High Impact - Save ~15m)
      Wave 2 has 12 tasks (exceeds medium size)
      💡 Suggestion: Split into:
         - Wave 2a: Core feature (6 tasks, ~25m)
         - Wave 2b: Edge cases (6 tasks, ~20m)
   
   2. Parallelize Waves 3-4 (Medium Impact - Save ~10m)
      Waves 3 and 4 have no dependencies
      💡 Suggestion: Execute in parallel using wave="1" attribute
   
   3. Add Checkpoint (Low Impact - Improve safety)
      No checkpoint in 5-wave sequence
      💡 Suggestion: Add checkpoint after Wave 3
   
   Estimated time savings: ~25m (21% faster)
   
   Run with --apply to interactively apply these optimizations
   ```

## analyze command:

1. Command signature:
   ```
   reis analyze [options]
   
   Options:
     --period=30d     Time period (7d, 30d, 90d, all)
     --metrics=type   Show specific metrics (duration, success, waves)
     --json           Output as JSON
     --export=file    Export metrics to file
   ```

2. Implementation:
   - Import metrics-tracker and visualizer utilities
   - Load metrics for specified period
   - Generate summary and trends
   - Display with charts and tables

3. Output format:
   ```
   REIS Execution Analytics
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Period: Last 30 days
   
   📈 Summary:
   • Total waves: 47
   • Success rate: 94.2%
   • Avg duration: 23m
   • Total time: 18h 5m
   
   📊 Wave Duration Trend (Last 30d):
   30m ┤      ╭──╮
   25m ┤    ╭─╯  ╰╮
   20m ┤  ╭─╯     ╰─╮
   15m ┤╭─╯         ╰──
       └─────────────────
       Jan 1      Jan 30
   
   🎯 Success Rate by Wave Size:
   Small   ████████████████ 98% (23/24)
   Medium  ███████████████  96% (18/19)
   Large   ████████         78% (6/8)
   
   ⚡ Performance Insights:
   • Small waves consistently fastest (avg 12m)
   • Large waves have higher failure rate (22%)
   • Recent trend: Improving (97% success last 7d)
   
   💡 Recommendations:
   • Consider splitting large waves
   • Success rate improving - keep current approach
   ```

4. Both commands:
   - Support JSON output for tooling
   - Handle missing data gracefully
   - Performance <500ms
   - Clear, actionable output
   - Integration with existing utilities

WHY:
- optimize: Proactive improvement suggestions before execution
- analyze: Retrospective insights to improve planning
- Both commands provide value solo developers need
- Visual output makes data actionable
</action>
<verify>
# Test optimize command
node bin/reis.js optimize --help
node bin/reis.js optimize .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md

# Test analyze command
node bin/reis.js analyze --help
node bin/reis.js analyze --period=30d

# Test JSON outputs
node bin/reis.js optimize test/fixtures/sample.PLAN.md --json | jq .
node bin/reis.js analyze --json | jq .
</verify>
<done>
- optimize command implemented
- analyze command implemented
- Both commands have clear, formatted output
- JSON output for tooling integration
- Charts and visualizations integrated
- Help text comprehensive
- Performance targets met
- Integration with utilities seamless
</done>
</task>

<task type="auto">
<name>Implement reis visualize command and create integration tests</name>
<files>lib/commands/visualize.js, test/commands/phase3-commands.test.js</files>
<action>
Create visualize command and comprehensive tests:

## visualize command:

1. Command signature:
   ```
   reis visualize [options]
   
   Options:
     --type=dashboard   Visualization type (dashboard, progress, metrics, waves)
     --refresh=5        Auto-refresh interval (seconds)
     --export=png       Export visualization (future: image export)
   ```

2. Implementation:
   - Import visualizer, state-manager, metrics-tracker
   - Load current project state
   - Render appropriate visualization
   - Support live updates with --refresh

3. Output format (dashboard):
   ```
   ┌─────────────────────────────────────────────────────┐
   │  REIS Project Status                    [Live View] │
   ├─────────────────────────────────────────────────────┤
   │  Phase: Phase 3 - Advanced Features                 │
   │  Progress: [████████████████          ] 75%         │
   │  Waves: 12/16 completed                             │
   │  Success Rate: 94.2%                                │
   │  Avg Duration: 23m per wave                         │
   ├─────────────────────────────────────────────────────┤
   │  Current Wave: Wave 13 - Testing                    │
   │  [██████                ] 30% (2/6 tasks)           │
   │  Elapsed: 8m | ETA: 18m                             │
   ├─────────────────────────────────────────────────────┤
   │  Recent Activity:                                   │
   │  • ✓ Wave 12 completed (22m) - 15m ago              │
   │  • ⚠ Wave 11 took 35m (15m over estimate)           │
   │  • ✓ Checkpoint created - 1h ago                    │
   ├─────────────────────────────────────────────────────┤
   │  Next Steps:                                        │
   │  1. Complete Wave 13 testing                        │
   │  2. Review Wave 11 for optimization                 │
   │  3. Create checkpoint before Wave 14                │
   ├─────────────────────────────────────────────────────┤
   │  Metrics (Last 7 Days):                             │
   │  Success: 97% | Avg Time: 24m | Total: 28 waves    │
   └─────────────────────────────────────────────────────┘
   
   Press Ctrl+C to exit | Refreshing every 5s
   ```

4. Live refresh mode:
   - Clear screen and redraw (when --refresh specified)
   - Update metrics in real-time
   - Show timestamp of last update
   - Exit cleanly on Ctrl+C

## Integration tests:

1. Test file: test/commands/phase3-commands.test.js
   - Test all 4 new commands (validate, optimize, analyze, visualize)
   - Test command help text
   - Test JSON output modes
   - Test error handling
   - Test integration with utilities

2. Test scenarios:
   - validate: valid plan, invalid plan, missing file, JSON output
   - optimize: plan with issues, perfect plan, --focus flag, JSON output
   - analyze: with metrics, without metrics, different periods, JSON output
   - visualize: dashboard, with/without active wave, different types

3. Test integration:
   - Commands work with real .planning/ data
   - Commands update STATE.md appropriately
   - Commands interact with git correctly
   - Commands handle missing data gracefully

4. Performance tests:
   - All commands complete <1s for typical data
   - analyze handles large datasets (1000+ waves)
   - visualize refresh doesn't flicker

Use mocha/assert pattern.
Use real filesystem in temp directories.
Clean up after tests.
</action>
<verify>
# Test visualize command
node bin/reis.js visualize --help
node bin/reis.js visualize --type=dashboard

# Test all Phase 3 commands
npm test -- test/commands/phase3-commands.test.js

# Integration test
node bin/reis.js validate .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
node bin/reis.js optimize .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
node bin/reis.js analyze --period=7d
node bin/reis.js visualize --type=dashboard
</verify>
<done>
- visualize command implemented
- Dashboard visualization works
- Live refresh mode works
- All Phase 3 commands tested (40+ tests)
- Integration tests cover command interactions
- Error handling comprehensive
- Performance benchmarks met
- Help text for all commands clear
- JSON output modes work
- Commands ready for production use
</done>
</task>

## Success Criteria
- ✅ validate command validates plans and provides actionable feedback
- ✅ optimize command suggests improvements with impact estimates
- ✅ analyze command shows metrics, trends, and insights
- ✅ visualize command renders dashboard with live updates
- ✅ All commands support JSON output for tooling
- ✅ 40+ integration tests pass
- ✅ Commands integrate seamlessly with Phase 3 utilities
- ✅ Performance targets met (<1s typical execution)
- ✅ Help text comprehensive and clear
- ✅ User experience polished and professional

## Verification
```bash
# Test all commands
node bin/reis.js validate --help
node bin/reis.js optimize --help
node bin/reis.js analyze --help
node bin/reis.js visualize --help

# Run integration tests
npm test -- test/commands/phase3-commands.test.js

# Test with real data
node bin/reis.js validate .planning/phases/phase-2-command-enhancement/2-1-execute-plan-command.PLAN.md
node bin/reis.js optimize .planning/phases/phase-2-command-enhancement/2-5-integration-testing.PLAN.md
node bin/reis.js analyze --period=30d
node bin/reis.js visualize --type=dashboard

# Run all tests
npm test
```
