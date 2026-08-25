# Workflow: Map Existing Codebase

Analyze a brownfield codebase and create the initial REIS structure
(`.planning/` with PROJECT.md and STATE.md) so REIS workflows can run on an
existing project.

## Preconditions

- Current directory is the codebase to map (verify it contains source files)
- If `.planning/` already exists, ask whether to preserve, merge, or start over

## Inputs

- None required; the user may point out areas of special interest or known
  pain points as arguments

## Steps

1. Survey the repository:
   - Package/manifest files (package.json, Cargo.toml, pyproject.toml, …)
     for language, framework, and dependency inventory
   - Directory layout and entry points
   - Build, test, and lint tooling actually configured
   - Code conventions in use (naming, module patterns, error handling)
2. Note architecture: how modules communicate, data flow, external services,
   and any existing docs worth referencing.
3. Create `.planning/` directory.
4. Write `.planning/PROJECT.md` using `templates/PROJECT.md`, capturing:
   - What the project is and its current state
   - Tech stack and key dependencies
   - Architecture overview and important file locations
   - Conventions future work must follow
   - Known constraints and technical debt observed
5. Write `.planning/STATE.md` using `templates/STATE.md`:
   - Active phase: none / mapping complete
   - Record under Recent Progress what was mapped and notable findings
6. Do NOT invent requirements or a roadmap — leave those to the requirements
   and roadmap workflows, which can now run on this project.

## Completion criteria

- `.planning/PROJECT.md` accurately reflects the real tech stack and structure
- `.planning/STATE.md` exists and records the mapping session
- No fabricated features or requirements were introduced

## References

- @templates/PROJECT.md (project description format)
- @templates/STATE.md (state file format per @reis/references/state-format.md)
- @agents/reis_project_mapper (subagent for large repositories)
