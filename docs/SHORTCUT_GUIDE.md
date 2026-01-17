# REIS Shortcut Commands for Rovo Dev

Since Rovo Dev doesn't support `/reis:*` slash commands like Claude Code, you can use these **shortcut phrases** instead. I'll recognize them and execute the equivalent REIS workflow.

---

## How It Works

### In Claude Code:
```
/reis:plan-phase 1
```

### In Rovo Dev (any of these work):
```
"gsd plan phase 1"
"Plan phase 1"
"reis:plan-phase 1"
```

**I'll recognize all three formats!** Use whichever feels natural.

---

## Quick Command List

### 🆘 Help & Info

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd help` | "Show REIS help" | Display all commands |
| `gsd status` | "What's the project status?" | Show progress |
| `gsd whats-new` | "What's new in REIS?" | Show changelog |

### 🚀 Project Setup

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd new [idea]` | "Initialize REIS project for [idea]" | Start new project |
| `gsd map` | "Map this codebase" | Analyze existing code |
| `gsd requirements` | "Define requirements" | Create REQUIREMENTS.md |
| `gsd roadmap` | "Create roadmap" | Create ROADMAP.md |

### 📋 Planning

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd plan N` | "Plan phase N" | Create phase plans |
| `gsd discuss N` | "Discuss phase N" | Gather context first |
| `gsd research N` | "Research phase N" | Research before planning |
| `gsd assumptions N` | "List assumptions for phase N" | Show planning assumptions |

### ⚙️ Execution

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd execute N` | "Execute phase N" | Run phase plans |
| `gsd verify N` | "Verify phase N" | Test completed work |

### 📊 Progress

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd progress` | "Show project progress" | Status + next actions |
| `gsd pause` | "Pause work" | Create handoff |
| `gsd resume` | "Resume work" | Continue from last session |

### 🔧 Phase Management

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd add [feature]` | "Add phase for [feature]" | Add phase to roadmap |
| `gsd insert N [feature]` | "Insert phase N for [feature]" | Insert urgent phase |
| `gsd remove N` | "Remove phase N" | Delete phase |

### 🎯 Milestones

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `gsd complete` | "Complete milestone" | Archive and prepare next |
| `gsd milestone [name]` | "Create milestone [name]" | Start new milestone |

---

## Usage Examples

### Example 1: Starting a Project

**Short form:**
```
gsd new recipe app
gsd requirements
gsd roadmap
gsd plan 1
gsd execute 1
```

**Natural language:**
```
"Initialize REIS project for a recipe app"
"Define requirements"
"Create roadmap"
"Plan phase 1"
"Execute phase 1"
```

**Mixed (both work!):**
```
gsd new recipe app
"Define requirements and create roadmap"
gsd plan 1
"Execute phase 1"
```

---

### Example 2: Checking Progress

**Short form:**
```
gsd status
gsd progress
```

**Natural language:**
```
"What's the project status?"
"Show me the progress"
"Where are we in the roadmap?"
```

---

### Example 3: Phase Management

**Short form:**
```
gsd plan 1
gsd execute 1
gsd verify 1
gsd plan 2
```

**Natural language:**
```
"Plan phase 1"
"Execute phase 1"
"Verify phase 1 work"
"Plan phase 2"
```

---

### Example 4: Research Before Planning

**Short form:**
```
gsd research 2
gsd discuss 2
gsd assumptions 2
gsd plan 2
```

**Natural language:**
```
"Research phase 2 implementation"
"Discuss phase 2 and gather context"
"What are your assumptions about phase 2?"
"Plan phase 2"
```

---

## Pattern Recognition

I'll recognize these patterns:

### Format 1: Shortcut Style (Claude Code-like)
```
gsd [command] [args]
reis:command [args]
```

### Format 2: Natural Language
```
"[Command description]"
```

### Format 3: Mixed
```
"gsd plan phase 1 with focus on performance"
```

**All work the same!** Choose what's comfortable.

---

## Complete Shortcut Reference

### Core Commands

```bash
# Help
gsd help
gsd whats-new

# Project Setup
gsd new [idea]
gsd map
gsd requirements
gsd roadmap

# Planning
gsd plan [N]
gsd discuss [N]
gsd research [N]
gsd assumptions [N]

# Execution
gsd execute [N]
gsd verify [N]

# Progress
gsd status
gsd progress
gsd pause
gsd resume

# Phase Management
gsd add [feature]
gsd insert [N] [feature]
gsd remove [N]

# Milestones
gsd complete
gsd milestone [name]

# Debug
gsd debug [issue]
gsd todos
gsd todos [area]
```

---

## Aliases (Even Shorter!)

```bash
# These work too:
help          → gsd help
status        → gsd status
map           → gsd map
plan [N]      → gsd plan [N]
execute [N]   → gsd execute [N]
verify [N]    → gsd verify [N]
pause         → gsd pause
resume        → gsd resume
```

---

## Tips

### ✅ Do:

**Use shortcuts for quick commands:**
```
gsd plan 1
gsd execute 1
gsd status
```

**Use natural language for complex requests:**
```
"Plan phase 2 with focus on security and performance"
"Execute phase 1 plans in parallel and notify me when complete"
```

**Mix and match:**
```
gsd plan 1
"Review the plans and make them more specific"
gsd execute 1
```

### 💡 Pro Tips:

**Chain commands:**
```
"gsd plan 1 and execute it"
"Map codebase and create improvement roadmap"
```

**Add context:**
```
"gsd plan 2 with focus on performance optimization"
"Execute phase 1 - we need this for tomorrow's demo"
```

**Ask for help:**
```
"gsd help"
"Show me all REIS commands"
"How do I use gsd plan?"
```

---

## Comparison: Claude Code vs Rovo Dev

| Claude Code | Rovo Dev Shortcut | Rovo Dev Natural |
|-------------|-------------------|------------------|
| `/reis:help` | `gsd help` | "Show REIS help" |
| `/reis:plan-phase 1` | `gsd plan 1` | "Plan phase 1" |
| `/reis:execute-phase 1` | `gsd execute 1` | "Execute phase 1" |
| `/reis:progress` | `gsd status` | "What's the project status?" |
| `/reis:pause-work` | `gsd pause` | "Pause work" |
| `/reis:map-codebase` | `gsd map` | "Map this codebase" |

**Key Difference:** Rovo Dev is more flexible - you can use shortcuts OR natural language OR both!

---

## Implementation Note

These shortcuts are **patterns I recognize** in your messages. You don't need to install anything - just use them naturally in our conversation!

**Behind the scenes:**
- When you say `gsd plan 1`, I recognize it as "Plan phase 1"
- When you say `gsd execute 2`, I recognize it as "Execute phase 2"
- When you say `gsd status`, I recognize it as "Show project progress"

---

## Testing Your Shortcuts

Try these now:

```
gsd help
gsd status
```

I should respond with the appropriate information!

---

## Full Command Map

For a complete mapping of Claude Code commands to Rovo Dev equivalents, see:
`~/.rovodev/reis/COMMANDS.md`

---

**Quick Reference:**
- Use `gsd [command]` for Claude Code-style shortcuts
- Use natural language for complex requests
- Mix and match as you prefer
- All work the same way!

Start with: `gsd help` 🚀
