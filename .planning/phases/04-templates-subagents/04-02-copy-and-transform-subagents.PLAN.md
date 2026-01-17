# Plan: 04-02 - Copy and Transform Subagent Files

## Objective
Copy all 3 subagent files from ~/.rovodev/subagents/ to subagents/ directory and transform from gsd_* to reis_*.

## Context
Transform these 3 subagent files:
1. gsd_planner.md → reis_planner.md
2. gsd_executor.md → reis_executor.md
3. gsd_project_mapper.md → reis_project_mapper.md

These are the AI subagent instruction files. All references to GSD methodology, commands, and file paths must be updated to REIS. These files will be copied to ~/.rovodev/subagents/ during installation.

## Dependencies
- Plan 01-01 (subagents/ directory exists)

## Tasks

<task type="auto">
<name>Copy and transform gsd_planner.md to reis_planner.md</name>
<files>subagents/reis_planner.md</files>
<action>
1. Copy ~/.rovodev/subagents/gsd_planner.md to subagents/reis_planner.md

2. Apply transformations:
   - s/GSD/REIS/g (but preserve "GSD Planner Agent" → "REIS Planner Agent" in title)
   - s/gsd:/reis:/g
   - s/gsd_/reis_/g
   - s/Get Shit Done/Roadmap Execution & Implementation System/g
   - s/\.rovodev\/gsd\//\.rovodev\/reis\//g
   - s/\/gsd:/\/reis:/g
   - Update "gsd_executor" → "reis_executor" in references
   - Update "gsd_project_mapper" → "reis_project_mapper" in references

3. Update header:
   - "# GSD Planner Agent" → "# REIS Planner Agent"
   - Update role description to mention REIS

4. Verify planner methodology remains intact:
   - Goal-backward thinking preserved
   - Task breakdown principles unchanged
   - Plan structure template intact
   - PLAN.md template references updated

Use commands:
cp ~/.rovodev/subagents/gsd_planner.md subagents/reis_planner.md
sed -i 's/GSD/REIS/g' subagents/reis_planner.md
sed -i 's/gsd:/reis:/g' subagents/reis_planner.md
sed -i 's/gsd_/reis_/g' subagents/reis_planner.md
(continue with other transformations)
</action>
<verify>ls subagents/reis_planner.md && grep -c "REIS Planner" subagents/reis_planner.md</verify>
<done>reis_planner.md created with all GSD references transformed to REIS, methodology preserved</done>
</task>

<task type="auto">
<name>Copy and transform gsd_executor.md to reis_executor.md</name>
<files>subagents/reis_executor.md</files>
<action>
1. Copy ~/.rovodev/subagents/gsd_executor.md to subagents/reis_executor.md

2. Apply same transformations:
   - s/GSD/REIS/g
   - s/gsd:/reis:/g
   - s/gsd_/reis_/g
   - s/Get Shit Done/Roadmap Execution & Implementation System/g
   - s/\.rovodev\/gsd\//\.rovodev\/reis\//g
   - s/\/gsd:/\/reis:/g
   - Update subagent references: gsd_planner → reis_planner

3. Update header:
   - "# GSD Executor Agent" → "# REIS Executor Agent"

4. Verify executor logic remains intact:
   - Task execution flow preserved
   - Verification steps unchanged
   - File paths updated to .planning/ (should already be correct)
   - STATE.md update logic intact

Note: Executor logic is methodology-agnostic, so transformations are mainly branding.
</action>
<verify>ls subagents/reis_executor.md && grep -c "REIS Executor" subagents/reis_executor.md</verify>
<done>reis_executor.md created with all GSD references transformed to REIS, execution logic preserved</done>
</task>

<task type="auto">
<name>Copy and transform gsd_project_mapper.md to reis_project_mapper.md</name>
<files>subagents/reis_project_mapper.md</files>
<action>
1. Copy ~/.rovodev/subagents/gsd_project_mapper.md to subagents/reis_project_mapper.md

2. Apply same transformations:
   - s/GSD/REIS/g
   - s/gsd:/reis:/g
   - s/gsd_/reis_/g
   - s/Get Shit Done/Roadmap Execution & Implementation System/g
   - s/\.rovodev\/gsd\//\.rovodev\/reis\//g
   - s/\/gsd:/\/reis:/g

3. Update header:
   - "# GSD Project Mapper Agent" → "# REIS Project Mapper Agent"

4. Verify project mapping logic remains intact:
   - Codebase analysis methodology preserved
   - PROJECT.md generation logic intact
   - Tech stack detection unchanged
   - File structure analysis preserved

5. Special attention to output file references:
   - Ensure .planning/PROJECT.md paths are correct
   - Update any command examples in the file
</action>
<verify>ls subagents/reis_project_mapper.md && grep -c "REIS Project Mapper" subagents/reis_project_mapper.md</verify>
<done>reis_project_mapper.md created with all GSD references transformed to REIS, mapping logic preserved</done>
</task>

## Success Criteria
- All 3 subagent files exist in subagents/ directory with correct names (reis_*)
- All GSD references transformed to REIS throughout files
- Subagent methodology and logic preserved
- Headers updated to "REIS [Type] Agent"
- All cross-references between subagents updated
- No broken references or inconsistencies

## Verification
```bash
# Check all files exist with correct names
ls -1 subagents/

# Verify count and naming
ls subagents/ | grep "reis_" | wc -l  # Should be 3

# Verify no gsd_ references in filenames or content
ls subagents/ | grep "gsd_" || echo "No gsd_ files found"
grep -ri "gsd_planner\|gsd_executor\|gsd_project_mapper" subagents/ || echo "No old references"

# Check headers are updated
grep "# REIS" subagents/reis_planner.md
grep "# REIS" subagents/reis_executor.md
grep "# REIS" subagents/reis_project_mapper.md
```
