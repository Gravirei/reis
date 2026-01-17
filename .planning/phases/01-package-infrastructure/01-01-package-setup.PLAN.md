# Plan: 01-01 - Package Setup & Configuration

## Objective
Create package.json with correct metadata, dependencies, and scripts for the REIS NPM package.

## Context
This is the foundation of the NPM package. We need a valid package.json that:
- Defines the package name as "reis"
- Sets up the CLI bin entry point
- Includes all necessary metadata for NPM publication
- Configures post-install script for file copying

## Dependencies
None - this is Wave 1

## Tasks

<task type="auto">
<name>Create package.json with complete metadata</name>
<files>package.json</files>
<action>
Create package.json with:
- name: "reis"
- version: "1.0.0"
- description: "Roadmap Execution & Implementation System - Systematic development with parallel subagent execution for Atlassian Rovo Dev"
- main: "lib/index.js"
- bin: { "reis": "bin/reis.js" }
- keywords: ["reis", "roadmap", "execution", "implementation", "rovo", "dev", "systematic", "development", "gsd", "workflow"]
- author: Your name/organization
- license: "MIT"
- repository: { type: "git", url: "git+https://github.com/YOUR_USERNAME/reis.git" }
- bugs: { url: "https://github.com/YOUR_USERNAME/reis/issues" }
- homepage: "https://github.com/YOUR_USERNAME/reis#readme"
- engines: { node: ">=18.0.0" }
- scripts: {
    "postinstall": "node lib/install.js",
    "test": "echo \"Error: no test specified\" && exit 0"
  }
- dependencies: {
    "chalk": "^4.1.2",
    "inquirer": "^8.2.6",
    "commander": "^11.1.0"
  }

Note: Use specific versions that work with CommonJS (chalk 4.x, inquirer 8.x, not latest ESM-only versions)
</action>
<verify>cat package.json | grep -E '(name|version|bin|engines)'</verify>
<done>package.json exists with valid structure, all required fields present, CommonJS-compatible dependencies specified</done>
</task>

<task type="auto">
<name>Create .npmignore file</name>
<files>.npmignore</files>
<action>
Create .npmignore to exclude:
- .planning/
- .git/
- .gitignore
- generated-diagrams/
- node_modules/ (redundant but explicit)
- *.log
- .DS_Store
- tmp_rovodev_*

This ensures only necessary files are published to NPM.
</action>
<verify>cat .npmignore</verify>
<done>.npmignore file exists and excludes planning, git, and temporary files</done>
</task>

<task type="auto">
<name>Create directory structure</name>
<files>bin/, lib/, lib/commands/, lib/utils/, docs/, templates/, subagents/</files>
<action>
Create the complete directory structure:
- bin/ (CLI entry point)
- lib/ (implementation code)
- lib/commands/ (29 command implementations)
- lib/utils/ (helper functions)
- docs/ (8 documentation files)
- templates/ (5 template files)
- subagents/ (3 subagent files)

Use: mkdir -p bin lib/commands lib/utils docs templates subagents
</action>
<verify>ls -la | grep -E '(bin|lib|docs|templates|subagents)' && ls -la lib/ | grep -E '(commands|utils)'</verify>
<done>All directories exist: bin/, lib/, lib/commands/, lib/utils/, docs/, templates/, subagents/</done>
</task>

## Success Criteria
- package.json is valid and contains all required metadata
- .npmignore properly excludes development files
- Directory structure is complete and organized
- npm install would work (dependencies are valid)

## Verification
```bash
# Validate package.json
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
# Check directory structure
ls -R | grep -E '(bin|lib|docs|templates|subagents)'
```
