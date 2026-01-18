# Plan: 2-4 - Config Command

## Objective
Implement `reis config` command for configuration management, initialization, validation, and documentation.

## Context
- Phase 1 config.js utility loads and validates reis.config.js
- No CLI command exists for config management yet
- Users need easy way to:
  - Initialize sample config
  - View current config
  - Validate config
  - Understand config options
- Config system supports: wave sizes, git settings, LLM preferences, checkpoints

## Dependencies
None - Can execute in Wave 1 (parallel with other commands)

## Tasks

<task type="auto">
<name>Create config command implementation</name>
<files>lib/commands/config.js</files>
<action>
Create new config.js command that:

1. Import Phase 1 utilities:
   - loadConfig, validateConfig, DEFAULT_CONFIG from '../utils/config.js'
   - Command helpers for output formatting

2. Support multiple subcommands:
   - `reis config show` - Display current config (formatted)
   - `reis config init` - Create sample reis.config.js
   - `reis config validate` - Validate config file
   - `reis config docs` - Show config documentation
   - `reis config` (no args) - Alias for show

3. Show config flow:
   - Load config using loadConfig() from project root
   - Display formatted config with colors:
     - Sections: waves, git, checkpoints, llm
     - Highlight non-default values
     - Show source: "(default)" or "(from reis.config.js)"
   - Format:
     ```
     REIS Configuration
     
     Waves:
       Default size: medium (from reis.config.js)
       Small: 3 tasks, ~30 min
       Medium: 5 tasks, ~60 min
       Large: 8 tasks, ~90 min
     
     Git:
       Auto-commit: enabled (default)
       Commit template: "REIS: {wave} - {task}"
     
     Checkpoints:
       Auto-checkpoint: true
       Checkpoint interval: per wave
     
     LLM:
       Provider: claude
       Model: claude-3-5-sonnet-20241022
     
     Source: ./reis.config.js
     ```
   - If no config file: show "(using defaults)"
   - Add --json flag for machine-readable output

4. Init config flow:
   - Check if reis.config.js already exists
   - If exists: prompt to overwrite (unless --force flag)
   - Create reis.config.js with:
     - Well-commented template
     - All available options documented
     - Sensible defaults
     - Examples for common customizations
   - Template content:
     ```javascript
     /**
      * REIS v2.0 Configuration
      * 
      * Customize your REIS workflow with these settings.
      * All fields are optional - defaults will be used if omitted.
      */
     
     module.exports = {
       // Wave execution settings
       waves: {
         defaultSize: 'medium', // 'small' | 'medium' | 'large'
         sizes: {
           small: { maxTasks: 3, estimatedMinutes: 30 },
           medium: { maxTasks: 5, estimatedMinutes: 60 },
           large: { maxTasks: 8, estimatedMinutes: 90 }
         }
       },
       
       // Git integration settings
       git: {
         autoCommit: true, // Auto-commit on wave completion
         commitTemplate: 'REIS: {wave} - {task}',
         requireCleanTree: false // Warn but don't block on dirty tree
       },
       
       // Checkpoint settings
       checkpoints: {
         autoCheckpoint: true, // Auto-checkpoint between waves
         interval: 'per-wave' // 'per-wave' | 'per-task' | 'manual'
       },
       
       // LLM preferences
       llm: {
         provider: 'claude', // 'claude' | 'openai' | 'custom'
         model: 'claude-3-5-sonnet-20241022',
         maxTokens: 200000
       }
     };
     ```
   - Display success message with next steps

5. Validate config flow:
   - Load reis.config.js from project root
   - Run validateConfig() from config utility
   - Display validation results:
     - If valid: "✓ Configuration is valid"
     - If invalid: Show all errors with context
   - Error format:
     ```
     ✗ Configuration has 2 errors:
     
     1. waves.defaultSize: Invalid value 'xlarge'
        Expected: 'small', 'medium', or 'large'
        Location: reis.config.js:5
     
     2. git.autoCommit: Invalid type 'string'
        Expected: boolean
        Location: reis.config.js:12
     ```
   - Exit code: 0 if valid, 1 if invalid

6. Docs flow:
   - Display comprehensive config documentation:
     - All available options
     - Data types and valid values
     - Default values
     - Examples
     - Common use cases
   - Use pager if output is long (more command)
   - Format as markdown for readability

7. Add helpful flags:
   - --json - JSON output (for show command)
   - --force / -f - Overwrite existing config (for init)
   - --path <path> - Custom config path (advanced)

WHY avoid certain approaches:
- Don't modify config programmatically (users should edit manually)
- Don't store config in STATE.md (separation of concerns)
- Don't validate on every command (performance impact)
- Don't require config file (defaults should work)
</action>
<verify>
# Test command loads
node bin/reis.js config --help

# Test show (should use defaults)
node bin/reis.js config show

# Test init
cd /tmp/test-reis-config
node bin/reis.js config init --dry-run

# Test validate
node bin/reis.js config validate
</verify>
<done>
- config.js created and loads without errors
- Show subcommand displays formatted config
- Init subcommand creates sample config file
- Validate subcommand checks config correctness
- Docs subcommand shows comprehensive documentation
- Flags work: --json, --force, --path
- Error messages are clear and actionable
</done>
</task>

<task type="auto">
<name>Create config command tests</name>
<files>test/commands/config.test.js</files>
<action>
Create comprehensive test suite:

1. Setup test fixtures:
   - Temp directory for config file testing
   - Sample valid reis.config.js
   - Sample invalid reis.config.js (various errors)
   - Mock filesystem for isolated testing

2. Test show subcommand:
   - Show with default config (no file)
   - Show with custom config file
   - Show with partial config (merged with defaults)
   - Show with --json flag
   - Verify formatted output
   - Verify source annotation (default vs. file)

3. Test init subcommand:
   - Init in empty directory
   - Init with existing config (should prompt/error)
   - Init with --force flag (should overwrite)
   - Verify created file is valid JavaScript
   - Verify created file has all sections
   - Verify created file is well-commented

4. Test validate subcommand:
   - Validate valid config
   - Validate invalid config (multiple errors)
   - Validate missing config (should use defaults = valid)
   - Validate with specific error types:
     - Invalid wave size
     - Invalid git.autoCommit type
     - Invalid llm.provider
     - Missing required fields (if any)
   - Verify exit codes (0 = valid, 1 = invalid)
   - Verify error messages are helpful

5. Test docs subcommand:
   - Display documentation
   - Verify all sections documented
   - Verify examples present
   - Verify markdown formatting

6. Test flags:
   - --json flag on show command
   - --force flag on init command
   - --path flag for custom config location

7. Test error cases:
   - Config file not readable
   - Config file has syntax errors
   - Invalid JavaScript in config file
   - Permission errors on init

8. Test integration with config utility:
   - Mock loadConfig, validateConfig
   - Verify correct utility functions called
   - Verify proper error handling

Use mocha/assert consistent with existing tests.
Mock filesystem where possible to avoid side effects.
</action>
<verify>
npm test -- test/commands/config.test.js
</verify>
<done>
- All tests pass
- Test coverage includes all subcommands
- Test coverage includes all flags
- Test coverage includes error cases
- Tests verify output formatting
- Tests verify file operations
- Tests are independent and clean up
</done>
</task>

<task type="auto">
<name>Register config command and create template</name>
<files>bin/reis.js, templates/reis.config.template.js</files>
<action>
1. Register config command in bin/reis.js:
   - Import config command
   - Add command definition with commander:
     ```javascript
     program
       .command('config')
       .description('Manage REIS configuration')
       .argument('[subcommand]', 'Subcommand: show, init, validate, docs')
       .option('--json', 'Output as JSON (for show)')
       .option('-f, --force', 'Force overwrite (for init)')
       .option('--path <path>', 'Custom config path')
       .action((subcommand, options) => {
         config({ subcommand, ...options });
       });
     ```

2. Create config template file at templates/reis.config.template.js:
   - Comprehensive template with all options
   - Well-documented with JSDoc comments
   - Examples for common scenarios
   - Links to documentation
   - Can be copied verbatim by init command
   
3. Ensure template is included in npm package:
   - Verify templates/ in package.json "files" array
   - Template should be accessible at runtime

4. Add config docs to templates/CONFIG_DOCS.md:
   - Comprehensive reference documentation
   - All options explained in detail
   - Examples for each section
   - Migration guide from v1.x (if applicable)
   - Used by `reis config docs` command

WHY this approach:
- Separate template file = easier maintenance
- Template in templates/ = standard location
- Included in npm = available after install
- Markdown docs = readable and linkable
</action>
<verify>
# Test command registration
node bin/reis.js --help | grep config

# Test command works
node bin/reis.js config --help

# Verify template exists
ls -la templates/reis.config.template.js
ls -la templates/CONFIG_DOCS.md
</verify>
<done>
- config command registered in bin/reis.js
- Command appears in help text
- Template file created and accessible
- Config docs created
- Template included in npm package files
- All subcommands work
</done>
</task>

## Success Criteria
- ✅ `reis config show` displays current configuration
- ✅ `reis config init` creates sample reis.config.js
- ✅ `reis config validate` validates config file
- ✅ `reis config docs` shows comprehensive documentation
- ✅ Output is well-formatted and colorized
- ✅ Template file is comprehensive and well-documented
- ✅ Validation provides helpful error messages
- ✅ All tests pass
- ✅ Command registered in CLI

## Verification
```bash
# Run tests
npm test -- test/commands/config.test.js

# Test show
reis config show
reis config show --json

# Test init
cd /tmp/test-project
reis config init
cat reis.config.js

# Test validate
reis config validate

# Test docs
reis config docs | head -20

# Test help
reis config --help
```
