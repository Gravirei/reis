# Migration Example: REIS v1.x → v2.0

## Overview

This example demonstrates how to migrate an existing REIS v1.x project to v2.0, highlighting the differences and showing that migration is **optional, incremental, and backward compatible**.

**Key Message**: REIS v2.0 doesn't break your v1.x projects. You can adopt new features gradually at your own pace.

---

## What's Inside

- **v1-project/** - Traditional REIS v1.x project structure
- **v2-project/** - Same project enhanced with v2.0 features
- **Migration guide** - Step-by-step transition process

---

## Quick Comparison

### v1.x Project Structure
```
v1-project/
├── PROJECT.md           # Project vision (no changes)
├── ROADMAP.md           # Phase-based only
└── .planning/
    └── phases/
        └── phase-1/
            └── plan.md  # Traditional plans
```

### v2.0 Project Structure (Enhanced)
```
v2-project/
├── PROJECT.md           # Same content (backward compatible)
├── ROADMAP.md           # Enhanced with wave markers
├── reis.config.js       # NEW: Configuration file
└── .planning/
    └── phases/
        └── phase-1/
            └── plan.md  # Enhanced with wave structure
```

**Notice**: v2.0 is additive, not destructive. Your existing files still work.

---

## Key Differences

### 1. ROADMAP.md Structure

**v1.x**: Phase-based only
```markdown
## Phase 1: Core Features
- Build user authentication
- Create dashboard
- Add data export
```

**v2.0**: Phase + Wave structure
```markdown
## Phase 1: Core Features [3 waves]

### Wave 1: Authentication [M]
- Build login system
- Add JWT tokens

### Wave 2: Dashboard [L]
- Create dashboard UI
- Add data visualization

### Wave 3: Export [S]
- Add CSV export
- Add PDF export
```

### 2. Configuration

**v1.x**: No configuration file (hardcoded defaults)

**v2.0**: Optional `reis.config.js`
```javascript
module.exports = {
  waves: {
    small: { tasks: '1-2', duration: '15-30min' },
    medium: { tasks: '2-4', duration: '30-60min' }
  },
  git: {
    autoCommit: true
  }
};
```

### 3. STATE.md Tracking

**v1.x**: Manual state updates

**v2.0**: Automatic state tracking with checkpoints
- Wave completion times recorded
- Checkpoint history maintained
- Metrics automatically collected

### 4. Checkpoint System

**v1.x**: Manual git commits only

**v2.0**: Built-in checkpoint system
```bash
reis checkpoint "Feature X complete"
reis resume  # Resume from last checkpoint
```

---

## Migration Path

### Option 1: Stay on v1.x (No Migration Needed)

**When**: Your current workflow works great, no need for new features

**Action**: Nothing! v1.x projects continue working in v2.0

**Compatibility**: 100% - no breaking changes

---

### Option 2: Gradual Enhancement (Recommended)

**When**: Want to adopt v2.0 features incrementally

**Steps**:

1. **Add reis.config.js** (Optional - use defaults if skipped)
   ```bash
   reis config init
   ```

2. **Enhance ROADMAP.md with waves** (when planning new phases)
   - Add wave markers to new phases only
   - Keep existing phases as-is

3. **Use new commands as needed**
   ```bash
   reis checkpoint "Important milestone"
   reis visualize --type progress
   ```

4. **Update plans gradually**
   - New plans can use wave structure
   - Old plans still execute fine

**Timeline**: At your own pace (days to months)

---

### Option 3: Full Migration

**When**: Want to fully leverage v2.0 features across entire project

**Steps**:

1. **Create reis.config.js**
   ```bash
   reis config init
   # Customize for your team/workflow
   ```

2. **Enhance ROADMAP.md**
   - Add wave structure to all phases
   - Mark wave sizes [S], [M], [L]
   - Note wave dependencies

3. **Update existing plans**
   - Add wave markers to tasks
   - Specify dependencies
   - Add wave size indicators

4. **Adopt checkpoint workflow**
   ```bash
   # Create checkpoints at phase/wave boundaries
   reis checkpoint "Phase 1 complete"
   ```

5. **Use visualization**
   ```bash
   reis visualize --type progress
   reis visualize --type metrics
   ```

**Timeline**: 1-2 hours for small projects, 1 day for large projects

---

## Migration Examples

### Example 1: Enhance ROADMAP.md

**Before (v1.x)**:
```markdown
## Phase 2: API Development

Build REST API with the following features:
- User endpoints
- Authentication
- Data endpoints
- Error handling
```

**After (v2.0)**:
```markdown
## Phase 2: API Development [3 waves]

### Wave 1: User Endpoints [M]
**Size**: Medium (3 tasks, 45-60 min)
- Create user CRUD routes
- Add validation
- Write tests

### Wave 2: Authentication [L]
**Size**: Large (5 tasks, 90 min)
**Dependencies**: Wave 1 complete
- Implement JWT
- Add login/register
- Create auth middleware

### Wave 3: Error Handling [S]
**Size**: Small (2 tasks, 30 min)
- Add global error handler
- Improve error messages
```

### Example 2: Add Configuration

**Create reis.config.js**:
```javascript
module.exports = {
  waves: {
    small: { tasks: '1-2', duration: '20-30min' },
    medium: { tasks: '2-4', duration: '45-60min' },
    large: { tasks: '4-6', duration: '90-120min' }
  },
  git: {
    autoCommit: true,
    commitPrefix: '[PROJECT]'
  }
};
```

---

## Backward Compatibility

### What Still Works

✅ **Existing PROJECT.md** - No changes needed
✅ **Existing ROADMAP.md** - Phase-only structure still valid
✅ **Old plans** - Execute perfectly in v2.0
✅ **Old commands** - `reis plan`, `reis execute` unchanged
✅ **File structure** - No reorganization required

### What's New (Optional)

🆕 **reis.config.js** - Add when ready
🆕 **Wave markers** - Enhance roadmaps incrementally
🆕 **Checkpoints** - Use `reis checkpoint` as needed
🆕 **Visualization** - Use `reis visualize` anytime
🆕 **Metrics** - Automatically collected if waves present

---

## Should I Migrate?

### Stick with v1.x if:
- ✅ Current workflow is smooth
- ✅ Project is nearly complete
- ✅ Team is comfortable with current approach
- ✅ No need for advanced features

### Migrate to v2.0 if:
- ✅ Want better progress visibility (checkpoints)
- ✅ Need to pause/resume work frequently
- ✅ Working on complex multi-phase projects
- ✅ Want automatic metrics tracking
- ✅ Team needs better coordination

---

## Common Questions

**Q: Will v2.0 break my existing project?**
A: No. v2.0 is 100% backward compatible. Existing projects work without changes.

**Q: Do I need to migrate all at once?**
A: No. Migrate incrementally - adopt features as you need them.

**Q: What if I don't create reis.config.js?**
A: REIS uses sensible defaults. Config is optional.

**Q: Can I mix v1.x and v2.0 styles in the same project?**
A: Yes! Some phases can use waves, others can stay phase-only.

**Q: How long does migration take?**
A: 15 minutes for basic enhancement, 1-2 hours for full migration.

**Q: What if I migrate and don't like it?**
A: Just delete reis.config.js and remove wave markers. Back to v1.x style.

---

## Side-by-Side Comparison

| Feature | v1.x | v2.0 |
|---------|------|------|
| PROJECT.md | ✅ Yes | ✅ Yes (same) |
| ROADMAP.md | ✅ Phases only | ✅ Phases + Waves |
| Configuration | ❌ Hardcoded | ✅ reis.config.js |
| Checkpoints | ❌ Manual git | ✅ Built-in system |
| Resume | ❌ Manual | ✅ Automatic |
| Metrics | ❌ None | ✅ Automatic |
| Visualization | ❌ None | ✅ Built-in |
| State tracking | 📝 Manual | ✅ Automatic |
| Git integration | ✅ Basic | ✅ Enhanced |
| Wave dependencies | ❌ No | ✅ Yes |

---

## Next Steps

1. **Review** both v1-project/ and v2-project/ folders
2. **Compare** the ROADMAP.md files side-by-side
3. **Decide** on migration approach (none, gradual, or full)
4. **Try it** on a small project first

---

## Learn More

- [v2.0 User Guide](../../docs/USER_GUIDE.md)
- [Configuration Reference](../../docs/CONFIGURATION.md)
- [Checkpoint System](../../docs/CHECKPOINTS.md)
- [Basic Workflow Example](../basic-workflow/)
- [Advanced Features Example](../advanced-features/)
