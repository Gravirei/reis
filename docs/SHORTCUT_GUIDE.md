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
"reis plan phase 1"
"Plan phase 1"
"reis:plan-phase 1"
```

**I'll recognize all three formats!** Use whichever feels natural.

---

## Quick Command List

### 🆘 Help & Info

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis help` | "Show REIS help" | Display all commands |
| `reis status` | "What's the project status?" | Show progress |
| `reis whats-new` | "What's new in REIS?" | Show changelog |

### 🚀 Project Setup

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis new [idea]` | "Initialize REIS project for [idea]" | Start new project |
| `reis map` | "Map this codebase" | Analyze existing code |
| `reis requirements` | "Define requirements" | Create REQUIREMENTS.md |
| `reis roadmap` | "Create roadmap" | Create ROADMAP.md |

### 📋 Planning

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis plan N` | "Plan phase N" | Create phase plans |
| `reis discuss N` | "Discuss phase N" | Gather context first |
| `reis research N` | "Research phase N" | Research before planning |
| `reis assumptions N` | "List assumptions for phase N" | Show planning assumptions |

### ⚙️ Execution

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis execute N` | "Execute phase N" | Run phase plans |
| `reis verify N` | "Verify phase N" | Test completed work |

### 📊 Progress

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis progress` | "Show project progress" | Status + next actions |
| `reis pause` | "Pause work" | Create handoff |
| `reis resume` | "Resume work" | Continue from last session |

### 🔧 Phase Management

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis add [feature]` | "Add phase for [feature]" | Add phase to roadmap |
| `reis insert N [feature]` | "Insert phase N for [feature]" | Insert urgent phase |
| `reis remove N` | "Remove phase N" | Delete phase |

### 🎯 Milestones

| Shortcut | Natural Language | What It Does |
|----------|------------------|--------------|
| `reis complete` | "Complete milestone" | Archive and prepare next |
| `reis milestone [name]` | "Create milestone [name]" | Start new milestone |

---

## Usage Examples

### Example 1: Starting a Project

**Short form:**
```
reis new recipe app
reis requirements
reis roadmap
reis plan 1
reis execute 1
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
reis new recipe app
"Define requirements and create roadmap"
reis plan 1
"Execute phase 1"
```

---

### Example 2: Checking Progress

**Short form:**
```
reis status
reis progress
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
reis plan 1
reis execute 1
reis verify 1
reis plan 2
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
reis research 2
reis discuss 2
reis assumptions 2
reis plan 2
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
reis [command] [args]
reis:command [args]
```

### Format 2: Natural Language
```
"[Command description]"
```

### Format 3: Mixed
```
"reis plan phase 1 with focus on performance"
```

**All work the same!** Choose what's comfortable.

---

## Complete Shortcut Reference

### Core Commands

```bash
# Help
reis help
reis whats-new

# Project Setup
reis new [idea]
reis map
reis requirements
reis roadmap

# Planning
reis plan [N]
reis discuss [N]
reis research [N]
reis assumptions [N]

# Execution
reis execute [N]
reis verify [N]

# Progress
reis status
reis progress
reis pause
reis resume

# Phase Management
reis add [feature]
reis insert [N] [feature]
reis remove [N]

# Milestones
reis complete
reis milestone [name]

# Debug
reis debug [issue]
reis todos
reis todos [area]
```

---

## Aliases (Even Shorter!)

```bash
# These work too:
help          → reis help
status        → reis status
map           → reis map
plan [N]      → reis plan [N]
execute [N]   → reis execute [N]
verify [N]    → reis verify [N]
pause         → reis pause
resume        → reis resume
```

---

## Tips

### ✅ Do:

**Use shortcuts for quick commands:**
```
reis plan 1
reis execute 1
reis status
```

**Use natural language for complex requests:**
```
"Plan phase 2 with focus on security and performance"
"Execute phase 1 plans in parallel and notify me when complete"
```

**Mix and match:**
```
reis plan 1
"Review the plans and make them more specific"
reis execute 1
```

### 💡 Pro Tips:

**Chain commands:**
```
"reis plan 1 and execute it"
"Map codebase and create improvement roadmap"
```

**Add context:**
```
"reis plan 2 with focus on performance optimization"
"Execute phase 1 - we need this for tomorrow's demo"
```

**Ask for help:**
```
"reis help"
"Show me all REIS commands"
"How do I use reis plan?"
```

---

## Comparison: Claude Code vs Rovo Dev

| Claude Code | Rovo Dev Shortcut | Rovo Dev Natural |
|-------------|-------------------|------------------|
| `/reis:help` | `reis help` | "Show REIS help" |
| `/reis:plan-phase 1` | `reis plan 1` | "Plan phase 1" |
| `/reis:execute-phase 1` | `reis execute 1` | "Execute phase 1" |
| `/reis:progress` | `reis status` | "What's the project status?" |
| `/reis:pause-work` | `reis pause` | "Pause work" |
| `/reis:map-codebase` | `reis map` | "Map this codebase" |

**Key Difference:** Rovo Dev is more flexible - you can use shortcuts OR natural language OR both!

---

## Implementation Note

These shortcuts are **patterns I recognize** in your messages. You don't need to install anything - just use them naturally in our conversation!

**Behind the scenes:**
- When you say `reis plan 1`, I recognize it as "Plan phase 1"
- When you say `reis execute 2`, I recognize it as "Execute phase 2"
- When you say `reis status`, I recognize it as "Show project progress"

---

## Testing Your Shortcuts

Try these now:

```
reis help
reis status
```

I should respond with the appropriate information!

---

## Full Command Map

For a complete mapping of Claude Code commands to Rovo Dev equivalents, see:
`~/.rovodev/reis/COMMANDS.md`

---

**Quick Reference:**
- Use `reis [command]` for Claude Code-style shortcuts
- Use natural language for complex requests
- Mix and match as you prefer
- All work the same way!

Start with: `reis help` 🚀
