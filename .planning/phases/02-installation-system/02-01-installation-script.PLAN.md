# Plan: 02-01 - Installation Script with ASCII Art

## Objective
Create lib/install.js with beautiful ASCII art banner, confirmation prompts, and file copying logic to ~/.rovodev/reis/.

## Context
This script runs after npm install (via postinstall). It provides:
- Beautiful ASCII art welcome banner
- Interactive confirmation prompt
- Directory creation for ~/.rovodev/reis/
- File copying from package to user's home directory
- Success message with next steps

Must be idempotent (safe to run multiple times) and handle errors gracefully.

## Dependencies
- Plan 01-01 (package.json with postinstall script)
- Plan 01-02 (directory structure exists)

## Tasks

<task type="auto">
<name>Create installation script with ASCII art and prompts</name>
<files>lib/install.js</files>
<action>
Create lib/install.js with:

1. Requires:
   - fs and path (built-in)
   - chalk for colors (use require, not import)
   - inquirer for prompts (use require, not import)

2. ASCII art banner for REIS:
```
╦═╗╔═╗╦╔═╗
╠╦╝║╣ ║╚═╗
╩╚═╚═╝╩╚═╝
Roadmap Execution & Implementation System
```
Use chalk to make it cyan/blue

3. Main installation flow:
   - Show ASCII banner
   - Display: "This will install REIS files to ~/.rovodev/reis/"
   - Prompt: "Continue with installation? (Y/n)"
   - If no: exit gracefully with "Installation cancelled"
   - If yes: proceed with installation

4. Installation steps:
   - Create ~/.rovodev/reis/ directory (fs.mkdirSync with recursive: true)
   - Create ~/.rovodev/reis/templates/ subdirectory
   - Create ~/.rovodev/subagents/ directory
   - Copy files (implement in next task)
   - Show success message

5. Error handling:
   - Wrap in try/catch
   - Show friendly error messages
   - Exit with proper codes

6. Silent mode check:
   - If CI environment (process.env.CI), skip prompts and install directly
   - Check for --silent flag

Note: Use CommonJS (module.exports, require) not ESM, to match dependencies.
</action>
<verify>node lib/install.js --help 2>&1 || echo "Script exists"</verify>
<done>lib/install.js exists with ASCII art, prompts, and directory creation logic</done>
</task>

<task type="auto">
<name>Implement file copying functions</name>
<files>lib/install.js</files>
<action>
Add file copying functions to lib/install.js:

1. copyFile(src, dest) function:
   - Check if source exists
   - Create destination directory if needed
   - Copy file using fs.copyFileSync
   - Handle errors (permissions, disk space)

2. copyDirectory(srcDir, destDir) function:
   - Recursively copy directory contents
   - Preserve file structure
   - Skip if file already exists (idempotent)
   - Log each file copied

3. Main copy operations:
   - Copy docs/* to ~/.rovodev/reis/
   - Copy templates/* to ~/.rovodev/reis/templates/
   - Copy subagents/* to ~/.rovodev/subagents/
   
4. File tracking:
   - Count files copied
   - Show progress: "Copying documentation... (1/8)"
   - Report total: "✓ Installed 16 files successfully"

5. Handle edge cases:
   - Source directory doesn't exist (package structure issue)
   - Destination is not writable
   - File already exists (skip, don't error)
</action>
<verify>grep -E '(copyFile|copyDirectory)' lib/install.js</verify>
<done>File copying functions implemented with error handling and progress reporting</done>
</task>

<task type="auto">
<name>Add success message and next steps</name>
<files>lib/install.js</files>
<action>
Add completion message to lib/install.js:

After successful installation, display:

1. Success banner (green):
   "✓ REIS installed successfully!"

2. Installation summary:
   "Files installed to:"
   "  • Documentation: ~/.rovodev/reis/"
   "  • Templates: ~/.rovodev/reis/templates/"
   "  • Subagents: ~/.rovodev/subagents/"

3. Quick start instructions:
   "Get started:"
   "  reis help              # Show all commands"
   "  reis new [your idea]   # Start a new project"
   "  reis map               # Map existing codebase"

4. Documentation link:
   "Documentation: ~/.rovodev/reis/README.md"

Use chalk.green, chalk.cyan for colors.
Make it visually appealing and informative.
</action>
<verify>grep -E '(installed successfully|Quick start|Get started)' lib/install.js</verify>
<done>Success message displays installation summary and helpful next steps</done>
</task>

## Success Criteria
- lib/install.js displays beautiful ASCII art banner
- User is prompted for confirmation before installation
- Directories are created: ~/.rovodev/reis/, ~/.rovodev/reis/templates/, ~/.rovodev/subagents/
- File copying logic is implemented with error handling
- Success message shows helpful next steps
- Script is idempotent (safe to run multiple times)
- Works in CI environments (silent mode)

## Verification
```bash
# Test the installation script (will prompt for confirmation)
node lib/install.js

# Check directories were created
ls -la ~/.rovodev/reis/
ls -la ~/.rovodev/reis/templates/
ls -la ~/.rovodev/subagents/

# Verify script can run in silent mode (for CI)
CI=true node lib/install.js
```
