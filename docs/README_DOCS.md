# REIS Documentation Guide

Quick reference for all REIS documentation files.

---

## 📚 Documentation Files

### For Daily Use

**QUICK_REFERENCE.md** (5.7 KB)
- Command cheat sheet
- Most common workflows
- Quick tips
- **Use this daily!**

**SHORTCUT_GUIDE.md** (7.1 KB)
- How shortcuts work
- Pattern recognition
- Examples for all formats
- **Read once, reference as needed**

---

### Complete References

**COMPLETE_COMMANDS.md** (11 KB)
- All 29 REIS commands
- Detailed descriptions
- Multiple formats for each
- Command categories
- **Complete reference guide**

**REIS_WORKFLOW_EXAMPLES.md** (21 KB)
- 6 real project examples
- Complete workflows from start to finish
- Different project types
- **Learn by example**

---

### Integration & Setup

**INTEGRATION_GUIDE.md** (9.6 KB)
- How REIS works in Rovo Dev
- Integration with other tools
- Configuration options
- **Technical deep dive**

**README.md** (6.4 KB)
- REIS overview
- Core concepts
- Philosophy and approach
- **Understand the "why"**

---

### Templates

**templates/** directory
- PROJECT.md
- REQUIREMENTS.md
- ROADMAP.md
- STATE.md
- PLAN.md

Copy these to start new projects.

---

## 🎯 Which File Should I Read?

### "I'm brand new to REIS"
→ Start with: **README.md** then **QUICK_REFERENCE.md**

### "I need a specific command"
→ Use: **COMPLETE_COMMANDS.md** or **QUICK_REFERENCE.md**

### "I want to see real examples"
→ Read: **REIS_WORKFLOW_EXAMPLES.md**

### "I need to know shortcuts"
→ Read: **SHORTCUT_GUIDE.md**

### "I want technical details"
→ Read: **INTEGRATION_GUIDE.md**

### "Starting a new project"
→ Copy files from: **templates/**

---

## 📖 Reading Order (Recommended)

**Day 1:**
1. README.md (10 min)
2. QUICK_REFERENCE.md (5 min)
3. Try a command!

**Day 2:**
1. SHORTCUT_GUIDE.md (10 min)
2. Try shortcuts
3. Skim COMPLETE_COMMANDS.md

**Day 3:**
1. Pick one example from REIS_WORKFLOW_EXAMPLES.md
2. Follow it step by step
3. Try on your own project

**Ongoing:**
- Keep QUICK_REFERENCE.md handy
- Reference COMPLETE_COMMANDS.md when needed

---

## 🔍 Quick Lookups

### Find a command
```bash
grep -i "plan phase" ~/.rovodev/reis/COMPLETE_COMMANDS.md
```

### See all shortcuts
```bash
grep "^reis" ~/.rovodev/reis/COMPLETE_COMMANDS.md
```

### List all files
```bash
ls -lh ~/.rovodev/reis/*.md
```

---

## 📁 File Structure

```
~/.rovodev/reis/
├── README.md                    (Overview)
├── README_DOCS.md              (This file)
├── QUICK_REFERENCE.md          (Daily cheat sheet)
├── SHORTCUT_GUIDE.md           (How shortcuts work)
├── COMPLETE_COMMANDS.md        (All 29 commands)
├── REIS_WORKFLOW_EXAMPLES.md    (Real examples)
├── INTEGRATION_GUIDE.md        (Technical details)
├── shortcuts.json              (Command definitions)
└── templates/                  (Project templates)
```

---

## 💡 Pro Tips

**Bookmark these:**
- QUICK_REFERENCE.md - for daily use
- COMPLETE_COMMANDS.md - when you need details

**Search efficiently:**
```bash
# Find command
grep -A 5 "reis plan" ~/.rovodev/reis/COMPLETE_COMMANDS.md

# See categories
grep "^###" ~/.rovodev/reis/COMPLETE_COMMANDS.md
```

**Learn by doing:**
- Don't read everything upfront
- Learn commands as you need them
- Try the examples

---

## 🆘 Still Confused?

Just ask:
```
"Show me REIS documentation"
"Which REIS file should I read?"
"How do I [what you want to do]?"
```

---

**Quick Start:**
```
reis help
```

or read:
```bash
cat ~/.rovodev/reis/QUICK_REFERENCE.md
```
