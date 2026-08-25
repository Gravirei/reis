# Workflow: Config

Manage REIS configuration for the current project: view effective settings,
create a config file, validate one, or explain configuration options.

## Preconditions

- Working directory is the project whose config is being managed (a custom
  config path may be supplied instead)

## Inputs

- Subcommand (one of `show`, `init`, `validate`, `docs`; defaults to `show`)
- Optional: explicit config path; `--force` for init; JSON output for show

## Steps

### show

1. Read `reis.config.js` from the project root (or the given path).
2. Report the effective configuration by section — waves, git, state,
   planning, output — noting for each value whether it came from the config
   file or from defaults.
3. If no config file exists, say so and suggest the init step.

### init

4. If `reis.config.js` already exists, stop and ask before overwriting
   unless force was requested.
5. Copy `templates/reis.config.template.js` to the target path.
6. Tell the user to edit it and then run validate.

### validate

7. If no config file exists, report that defaults are in effect and valid.
8. Read the config file and check it:
   - Loads without syntax errors
   - Only contains known sections (waves, git, state, planning, output) and
     known keys within them
   - Values are valid (e.g. wave size is small/medium/large, booleans are
     booleans, counts are positive numbers)
9. Report each problem found with its location; validation fails if any
   unknown keys or invalid values remain.

### docs

10. Explain the configuration sections: waves sizing/checkpointing, git
    auto-commit/prefix/clean-tree behavior, state tracking options, planning
    requirements, output preferences. Full details live in
    `docs/CONFIG_GUIDE.md`.

## Completion criteria

- The requested subcommand's outcome is clearly reported
- Validate ends with either "valid" or an itemized list of errors
- Init never silently overwrites an existing config

## References

- @templates/reis.config.template.js (annotated sample config)
- @docs/CONFIG_GUIDE.md (full configuration documentation)
