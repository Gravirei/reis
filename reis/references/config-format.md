# Reference: reis.config.js Format

Location: `reis.config.js` in the project root. All fields optional; defaults apply.

## Known sections and keys

- **waves**: defaultSize ('small'|'medium'|'large'), sizes.{small,medium,large}
  (.maxTasks, .estimatedMinutes), autoCheckpoint (bool), continueOnError (bool),
  parallel {enabled, maxConcurrent>=1, strategy ('dependency'|'group'|'auto'),
  conflictResolution ('fail'|'queue'|'merge'|'branch'), isolatedBranches}
- **git**: autoCommit (bool), commitMessagePrefix (string), requireCleanTree (bool),
  createBranch (bool), branchPrefix (string)
- **state**: trackMetrics (bool), saveCheckpoints (bool), maxCheckpoints >= 1
- **planning**: requirePlan (bool), validateWaves (bool), autoOptimize (bool)
- **output**: verbose (bool), showProgress (bool), colorize (bool)
- **kanban**: enabled (bool), style ('full'|'compact'|'minimal')
- **gates**: enabled (bool), runOn (array of 'cycle'|'verify'), blockOnFail (bool),
  blockOnWarning (bool), timeout >= 0 (ms)
- **review**: enabled (bool), autoFix (bool), strict (bool),
  checks {fileExists, functionExists, exportExists, dependencyExists, patternMatch}

## Validation rules

- Unknown sections: warn, keep.
- Unknown keys inside known sections: warn, keep.
- Type mismatches or out-of-range values: error, refuse to load (fall back to defaults).
- The legacy `llm` section is tolerated but ignored.

## Precedence

Defaults <- user reis.config.js (deep merge). Config lives only at project root;
there is no global REIS config.
