# Plan: 04-01 - Copy and Transform Template Files

## Objective
Copy all 5 template files from ~/.rovodev/gsd/templates/ to templates/ directory and transform GSD references to REIS.

## Context
Transform these 5 templates:
1. PLAN.md
2. PROJECT.md
3. REQUIREMENTS.md
4. ROADMAP.md
5. STATE.md

These are planning templates that users will copy to their projects. All references to GSD file paths and commands must be updated to REIS.

## Dependencies
- Plan 01-01 (templates/ directory exists)

## Tasks

<task type="auto">
<name>Copy and transform all template files</name>
<files>templates/PLAN.md, templates/PROJECT.md, templates/REQUIREMENTS.md, templates/ROADMAP.md, templates/STATE.md</files>
<action>
For each template file (PLAN.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md):

1. Copy from ~/.rovodev/gsd/templates/ to templates/
2. Apply transformations:
   - s/GSD/REIS/g
   - s/gsd:/reis:/g
   - s/gsd_/reis_/g
   - s/Get Shit Done/Roadmap Execution & Implementation System/g
   - s/\.rovodev\/gsd\//\.rovodev\/reis\//g
   - s/\/gsd:/\/reis:/g

3. Special attention to PLAN.md template:
   - Update any command examples
   - Update file path references in verification commands
   - Ensure task XML structure remains intact

4. Verify each file after transformation:
   - Check markdown is still valid
   - Ensure no broken references
   - Confirm GSD is replaced (except in attribution if any)

Use commands:
for file in PLAN.md PROJECT.md REQUIREMENTS.md ROADMAP.md STATE.md; do
  cp ~/.rovodev/gsd/templates/$file templates/$file
  sed -i 's/GSD/REIS/g' templates/$file
  sed -i 's/gsd:/reis:/g' templates/$file
  sed -i 's/gsd_/reis_/g' templates/$file
  sed -i 's/Get Shit Done/Roadmap Execution & Implementation System/g' templates/$file
  sed -i 's/\.rovodev\/gsd\//\.rovodev\/reis\//g' templates/$file
  sed -i 's/\/gsd:/\/reis:/g' templates/$file
done
</action>
<verify>ls templates/ | wc -l && grep -ri "gsd" templates/ | grep -v -i "credit\|attribution" || echo "No GSD references found"</verify>
<done>All 5 template files copied and transformed, no GSD references remain</done>
</task>

<task type="auto">
<name>Verify template integrity</name>
<files>templates/*.md</files>
<action>
Verify each template file's integrity:

1. Check PLAN.md:
   - Verify task XML structure is intact: <task type="auto">...</task>
   - Check all XML tags are present: <name>, <files>, <action>, <verify>, <done>
   - Ensure no malformed markdown

2. Check PROJECT.md:
   - Verify structure sections are intact
   - Ensure example content is coherent

3. Check REQUIREMENTS.md:
   - Verify requirement numbering format
   - Ensure sections are properly formatted

4. Check ROADMAP.md:
   - Verify phase structure
   - Ensure milestone sections are intact

5. Check STATE.md:
   - Verify status tracking sections
   - Ensure checklist format is intact

Run quick validation:
for file in templates/*.md; do
  echo "Checking $file..."
  grep -q "# " $file && echo "✓ Has headers" || echo "✗ Missing headers"
done
</action>
<verify>grep -l "<task type=" templates/PLAN.md && head -5 templates/PROJECT.md</verify>
<done>All template files verified for structural integrity, markdown is valid</done>
</task>

## Success Criteria
- All 5 template files exist in templates/ directory
- All GSD references transformed to REIS
- Template structure and formatting preserved
- No broken markdown or malformed content
- Templates are ready to be copied by users

## Verification
```bash
# Check all files exist
ls -1 templates/

# Verify count
ls templates/ | wc -l  # Should be 5

# Verify no GSD references
grep -ri "gsd" templates/ | grep -v -i "credit\|attribution"

# Check template integrity
head -10 templates/PLAN.md
head -10 templates/PROJECT.md
```
