# Plan: 03-01 - Copy and Transform Documentation Files

## Objective
Copy all 8 documentation files from ~/.rovodev/gsd/ to docs/ directory and transform all GSD references to REIS.

## Context
Transform these 8 files:
1. README.md
2. QUICK_REFERENCE.md
3. INTEGRATION_GUIDE.md
4. GSD_WORKFLOW_EXAMPLES.md (rename to WORKFLOW_EXAMPLES.md)
5. COMPLETE_COMMANDS.md
6. SHORTCUT_GUIDE.md
7. README_DOCS.md
8. shortcuts.json

All transformations:
- GSD → REIS
- gsd: → reis:
- gsd_ → reis_
- Get Shit Done → Roadmap Execution & Implementation System
- ~/.rovodev/gsd/ → ~/.rovodev/reis/
- /gsd: → /reis:

## Dependencies
- Plan 01-01 (docs/ directory exists)

## Tasks

<task type="auto">
<name>Copy and transform core documentation (README, QUICK_REFERENCE, INTEGRATION_GUIDE)</name>
<files>docs/README.md, docs/QUICK_REFERENCE.md, docs/INTEGRATION_GUIDE.md</files>
<action>
For each file (README.md, QUICK_REFERENCE.md, INTEGRATION_GUIDE.md):

1. Copy from ~/.rovodev/gsd/ to docs/
2. Apply transformations using sed or similar:
   - s/GSD/REIS/g
   - s/gsd:/reis:/g
   - s/gsd_/reis_/g
   - s/Get Shit Done/Roadmap Execution & Implementation System/g
   - s/\.rovodev\/gsd\//\.rovodev\/reis\//g
   - s/\/gsd:/\/reis:/g
   
3. Special case for README.md:
   - Keep credits section mentioning GSD (give proper attribution)
   - Update title to "REIS - Roadmap Execution & Implementation System"

4. Verify no remaining GSD references (except in credits/attribution)

Use commands like:
cp ~/.rovodev/gsd/README.md docs/README.md
sed -i 's/GSD/REIS/g' docs/README.md
(repeat for all transformations)
</action>
<verify>ls docs/ | grep -E '(README|QUICK_REFERENCE|INTEGRATION_GUIDE)' && grep -v "Credits" docs/README.md | grep -i "gsd" || echo "No GSD references found"</verify>
<done>Three core documentation files copied and transformed, all GSD references replaced with REIS (except attribution)</done>
</task>

<task type="auto">
<name>Copy and transform workflow and command docs (WORKFLOW_EXAMPLES, COMPLETE_COMMANDS, SHORTCUT_GUIDE)</name>
<files>docs/WORKFLOW_EXAMPLES.md, docs/COMPLETE_COMMANDS.md, docs/SHORTCUT_GUIDE.md</files>
<action>
For each file:

1. Copy GSD_WORKFLOW_EXAMPLES.md to docs/WORKFLOW_EXAMPLES.md (rename, drop GSD_ prefix)
2. Copy COMPLETE_COMMANDS.md to docs/COMPLETE_COMMANDS.md
3. Copy SHORTCUT_GUIDE.md to docs/SHORTCUT_GUIDE.md

Apply same transformations:
- s/GSD/REIS/g
- s/gsd:/reis:/g
- s/gsd_/reis_/g
- s/Get Shit Done/Roadmap Execution & Implementation System/g
- s/\.rovodev\/gsd\//\.rovodev\/reis\//g
- s/\/gsd:/\/reis:/g

Special attention to COMPLETE_COMMANDS.md:
- Update all 29 command examples
- Change "Claude Code: /gsd:command" to "Claude Code: /reis:command"
- Change all shortcut examples from "gsd command" to "reis command"

Verify command transformations are correct.
</action>
<verify>ls docs/ | grep -E '(WORKFLOW_EXAMPLES|COMPLETE_COMMANDS|SHORTCUT_GUIDE)' && grep -c "reis:" docs/COMPLETE_COMMANDS.md</verify>
<done>Three documentation files copied and transformed, all commands updated to use 'reis' prefix</done>
</task>

<task type="auto">
<name>Copy and transform remaining docs (README_DOCS, shortcuts.json)</name>
<files>docs/README_DOCS.md, docs/shortcuts.json</files>
<action>
1. Copy and transform README_DOCS.md:
   - Copy from ~/.rovodev/gsd/README_DOCS.md to docs/README_DOCS.md
   - Apply standard transformations
   - Update file path references

2. Copy and transform shortcuts.json:
   - Copy from ~/.rovodev/gsd/shortcuts.json to docs/shortcuts.json
   - Transform all JSON keys and values:
     * "gsd:command" → "reis:command"
     * "gsd_" → "reis_"
     * "GSD" → "REIS"
   - Ensure valid JSON after transformation
   - Test JSON parsing: node -e "JSON.parse(require('fs').readFileSync('docs/shortcuts.json', 'utf8'))"

Example transformation in shortcuts.json:
"gsd:help" → "reis:help"
"Show GSD help" → "Show REIS help"
"Initialize a GSD project" → "Initialize a REIS project"
</action>
<verify>ls docs/ | grep -E '(README_DOCS|shortcuts\.json)' && node -e "JSON.parse(require('fs').readFileSync('docs/shortcuts.json', 'utf8'))"</verify>
<done>README_DOCS.md and shortcuts.json copied, transformed, and validated (JSON is valid)</done>
</task>

## Success Criteria
- All 8 documentation files exist in docs/ directory
- All GSD references transformed to REIS (except in credits/attribution sections)
- All command examples use "reis" prefix
- All file paths reference ~/.rovodev/reis/
- shortcuts.json is valid JSON with all transformations applied
- No broken references or inconsistencies

## Verification
```bash
# Check all files exist
ls -1 docs/

# Verify no GSD references (except in credits)
grep -ri "gsd" docs/ | grep -v -i "credit\|attribution\|inspired"

# Verify shortcuts.json is valid
node -e "JSON.parse(require('fs').readFileSync('docs/shortcuts.json', 'utf8'))"

# Count REIS references (should be many)
grep -ri "reis" docs/ | wc -l
```
