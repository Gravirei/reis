# Agent Instructions for REIS Project

## 🎯 CRITICAL: Follow REIS Methodology

**When the user mentions "reis", "REIS", or "REIS methodology" in their request:**

### ✅ ALWAYS Use REIS Workflow & Subagents

1. **For Planning Tasks:**
   - Use `reis_planner` subagent
   - Don't create plans manually
   - Let the planner break down phases into proper task plans
   - Example: "Plan the authentication feature using reis_planner"

2. **For Execution Tasks:**
   - Use `reis_executor` subagent
   - Execute plans created by reis_planner
   - Follow the complete PLAN.md format
   - Example: "Execute this plan using reis_executor"

3. **For Verification Tasks:**
   - Use `reis_verifier` subagent (when available)
   - Verify completion with FR4.1 feature completeness
   - Check ALL deliverables exist
   - Example: "Verify this phase completion using reis_verifier"

4. **For Debugging Tasks:**
   - Use `reis_debugger` subagent (when available)
   - Analyze failures and generate targeted fix plans
   - FR2.1 incomplete implementation detection
   - Example: "Debug this issue using reis_debugger"

5. **For Project Mapping:**
   - Use `reis_project_mapper` subagent
   - Map existing codebases before planning
   - Example: "Map this project using reis_project_mapper"

---

## 📋 REIS Workflow Cycle

When user says "use reis" or "follow reis methodology":

```
1. MAP (if new/existing codebase)
   → reis_project_mapper

2. PLAN
   → reis_planner
   → Creates ROADMAP.md, detailed PLAN.md files

3. EXECUTE
   → reis_executor
   → Implements features from PLAN.md

4. VERIFY
   → reis_verifier
   → FR4.1: Check ALL features implemented
   → Run tests, validate success criteria

5. DEBUG (if verification fails)
   → reis_debugger
   → FR2.1: Detect incomplete implementations
   → Generate targeted FIX_PLAN.md

6. FIX & RE-VERIFY
   → reis_executor (execute fix)
   → reis_verifier (re-verify)
   → Loop until passing
```

---

## 🚫 DON'T Do This:

❌ Manually create plans when user mentions reis  
❌ Execute without using reis_executor subagent  
❌ Skip verification step  
❌ Write plans from scratch instead of using reis_planner  

---

## ✅ DO This:

✅ Always invoke appropriate REIS subagent  
✅ Use parallel execution when possible (multiple reis_executor agents)  
✅ Follow the complete cycle: PLAN → EXECUTE → VERIFY → DEBUG  
✅ Practice what we preach (dogfooding!)  

---

## 💡 Examples:

**User says:** "Plan the decision trees feature using reis"  
**Agent does:** Invoke `reis_planner` subagent with proper context

**User says:** "Execute this plan with reis methodology"  
**Agent does:** Invoke `reis_executor` subagent

**User says:** "Build this feature using reis"  
**Agent does:**
1. Use `reis_planner` to create plan
2. Use `reis_executor` to implement
3. Use `reis_verifier` to check completion

**User says:** "Let's use reis to build X and Y"  
**Agent does:** 
1. Create plans with `reis_planner` for both
2. Execute in parallel with multiple `reis_executor` agents
3. Verify both with `reis_verifier`

---

## 📌 Remember:

- REIS is our own methodology - we must use it ourselves!
- Subagents are designed specifically for these tasks
- Using subagents ensures quality and consistency
- Parallel execution speeds up development
- Always complete the full cycle

---

## 🎯 Trigger Words:

When user mentions any of these, use REIS workflow:
- "reis"
- "REIS"
- "reis methodology"
- "use reis"
- "follow reis"
- "with reis"
- "reis cycle"
- "systematic development"

---

**Last Updated:** 2026-01-19  
**Version:** 2.1.2  
**Purpose:** Ensure consistent use of REIS methodology and subagents
