# Basic Decision Tree Example

This is a simple 2-level decision tree for beginners.

## Decision Tree: Choose a Frontend Framework

```
Which frontend framework should I use?
  ├─ React → Component-based, large ecosystem
  ├─ Vue → Progressive framework, easy to learn
  ├─ Angular → Full-featured, enterprise-ready
  └─ Svelte → Compiled framework, small bundle size
```

**Expected Output:**
- 4 top-level options
- Each with a simple outcome description
- No nesting, no metadata
- Perfect for quick decisions

**Usage:**
```bash
reis tree show examples/decision-trees/basic-tree.md
reis tree show examples/decision-trees/basic-tree.md --interactive
```
