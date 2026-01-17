# Project: REIS - Roadmap Execution & Implementation System

## Overview
Transform the existing GSD (Get Shit Done) methodology into a publishable NPM package called REIS (Roadmap Execution & Implementation System) for Atlassian Rovo Dev.

## Scope
Convert 8 documentation files, 5 templates, and 3 subagent files from GSD to REIS, create a full-featured CLI with 29 commands, and prepare for NPM publication.

## Key Deliverables
1. NPM package structure (package.json, bin/, lib/, docs/, templates/, subagents/)
2. Beautiful CLI installation with ASCII art and confirmation
3. 29 working commands mapped to REIS
4. 3 transformed subagents (reis_planner, reis_executor, reis_project_mapper)
5. All documentation transformed from GSD → REIS
6. Post-install script that copies files to ~/.rovodev/reis/
7. Ready for NPM publishing

## Source Materials
- Documentation: ~/.rovodev/gsd/ (8 files)
- Templates: ~/.rovodev/gsd/templates/ (5 files)
- Subagents: ~/.rovodev/subagents/ (3 files: gsd_planner.md, gsd_executor.md, gsd_project_mapper.md)

## Target Structure
```
reis/
├── package.json
├── bin/
│   └── reis.js (CLI entry point)
├── lib/
│   ├── install.js (ASCII art + confirmation)
│   ├── commands/ (29 command implementations)
│   └── utils/ (helpers)
├── docs/ (8 transformed documentation files)
├── templates/ (5 template files)
├── subagents/ (3 transformed subagent files)
└── README.md (already exists)
```

## Installation Flow
1. User runs: `npx reis`
2. Shows ASCII art banner
3. Prompts for confirmation
4. Copies files to ~/.rovodev/reis/
5. Shows success message with quick start guide

## Technical Constraints
- Must work with npx (no global install required)
- Must support Node.js 18+
- Must handle ~/.rovodev/reis/ directory creation
- Must preserve all GSD functionality while rebranding
- Must maintain compatibility with Rovo Dev's shortcut system

## Success Metrics
- Package can be installed via `npx reis`
- All 29 commands work correctly
- Files correctly installed to ~/.rovodev/reis/
- Documentation is clear and accessible
- Package is ready for npm publish
