# Requirements: REIS NPM Package

## Functional Requirements

### FR1: Package Structure
- **FR1.1** Create valid package.json with correct metadata
- **FR1.2** Set up bin/ directory with executable CLI entry point
- **FR1.3** Create lib/ directory for all implementation code
- **FR1.4** Include docs/, templates/, and subagents/ directories
- **FR1.5** Configure post-install script

### FR2: Installation Experience
- **FR2.1** Display ASCII art banner on first run
- **FR2.2** Prompt user for installation confirmation
- **FR2.3** Create ~/.rovodev/reis/ directory if not exists
- **FR2.4** Copy all files (docs, templates, subagents) to target directory
- **FR2.5** Show success message with next steps
- **FR2.6** Handle errors gracefully (permissions, disk space, etc.)

### FR3: CLI Commands (29 total)
- **FR3.1** `reis help` - Show all commands and usage
- **FR3.2** `reis new [idea]` - Initialize new project
- **FR3.3** `reis map` - Map existing codebase
- **FR3.4** `reis requirements` - Define project requirements
- **FR3.5** `reis roadmap` - Generate project roadmap
- **FR3.6** `reis plan [N]` - Plan phase N
- **FR3.7** `reis discuss [N]` - Discuss phase N
- **FR3.8** `reis research [N]` - Research phase N implementation
- **FR3.9** `reis assumptions [N]` - List phase N assumptions
- **FR3.10** `reis execute [N]` - Execute phase N
- **FR3.11** `reis execute-plan [path]` - Execute specific plan file
- **FR3.12** `reis verify [N]` - Verify phase N work
- **FR3.13** `reis progress` - Show project progress
- **FR3.14** `reis pause` - Pause work with handoff
- **FR3.15** `reis resume` - Resume from last session
- **FR3.16** `reis add [feature]` - Add phase to roadmap
- **FR3.17** `reis insert [N] [feature]` - Insert phase at position N
- **FR3.18** `reis remove [N]` - Remove phase N
- **FR3.19** `reis milestone complete [name]` - Complete milestone
- **FR3.20** `reis milestone discuss` - Discuss next milestone
- **FR3.21** `reis milestone new [name]` - Create new milestone
- **FR3.22** `reis todo [description]` - Add TODO item
- **FR3.23** `reis todos [area]` - Check TODOs for area
- **FR3.24** `reis debug [issue]` - Systematic debugging
- **FR3.25** `reis update` - Check for updates
- **FR3.26** `reis whats-new` - Show what's new
- **FR3.27** `reis version` - Show version
- **FR3.28** `reis docs` - Open documentation
- **FR3.29** `reis uninstall` - Remove REIS installation

### FR4: Content Transformation
- **FR4.1** Transform all "GSD" references to "REIS" in documentation
- **FR4.2** Transform all "gsd_" prefixes to "reis_" in subagents
- **FR4.3** Update all file paths from gsd/ to reis/
- **FR4.4** Update command references from gsd:* to reis:*
- **FR4.5** Preserve all functionality and methodology
- **FR4.6** Update terminology: "Get Shit Done" → "Roadmap Execution & Implementation System"

### FR5: File Copying
- **FR5.1** Copy 8 documentation files to ~/.rovodev/reis/
- **FR5.2** Copy 5 template files to ~/.rovodev/reis/templates/
- **FR5.3** Copy 3 subagent files to ~/.rovodev/subagents/
- **FR5.4** Preserve file structure and permissions
- **FR5.5** Handle file conflicts (prompt or skip)

## Non-Functional Requirements

### NFR1: Compatibility
- Node.js 18+ support
- Works on Linux, macOS, Windows
- Compatible with Rovo Dev's shortcut system
- Works with npx (no global install required)

### NFR2: User Experience
- Clear, friendly CLI output
- Helpful error messages
- Progress indicators for long operations
- Beautiful ASCII art and formatting

### NFR3: Code Quality
- Well-structured, maintainable code
- Clear separation of concerns
- Comprehensive error handling
- Comments for complex logic

### NFR4: Documentation
- Clear README with installation instructions
- Complete command reference
- Integration guide for Rovo Dev
- Workflow examples

### NFR5: Publishing Readiness
- Valid package.json with all required fields
- Proper licensing (MIT)
- .npmignore for excluding unnecessary files
- Version 1.0.0 ready for publication

## Constraints
- Must preserve all GSD methodology and functionality
- Must work with Rovo Dev's existing shortcut system
- Cannot require manual configuration after install
- Must handle missing ~/.rovodev/ directory
- File copying must be idempotent (safe to run multiple times)
