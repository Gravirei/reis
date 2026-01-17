# REIS Workflow Examples

Real-world examples showing exactly how to use REIS for different types of projects.

---

## Table of Contents

1. [Simple Todo App](#example-1-simple-todo-app)
2. [Blog Platform](#example-2-blog-platform)
3. [E-commerce Dashboard](#example-3-e-commerce-dashboard)
4. [Improving Existing Project](#example-4-improving-existing-project)
5. [Bug Fix Sprint](#example-5-bug-fix-sprint)
6. [Performance Optimization](#example-6-performance-optimization)

---

## Example 1: Simple Todo App

### Project: Personal Task Manager

**Goal:** Build a simple todo app with local storage in 1 week.

### Session 1: Initialization (15 minutes)

**You:**
```
Initialize a REIS project for a personal task manager app.

Must have:
- Add/edit/delete tasks
- Mark tasks complete
- Filter by status (all/active/completed)
- Local storage persistence

Nice to have:
- Due dates
- Categories/tags

Not building:
- Multi-user support
- Cloud sync
- Mobile apps

Tech: React + TypeScript + Vite
Timeline: Ship in 1 week
```

**Me:**
```
✓ Created .planning/PROJECT.md

Great! Your task manager app is initialized.

Key decisions I've documented:
- Single-page app with local storage
- React hooks for state management
- No backend needed (localStorage only)

Next steps:
1. "Define detailed requirements"
2. "Create roadmap"

Ready to continue?
```

**You:**
```
Define requirements and create roadmap
```

**Me:**
```
✓ Created .planning/REQUIREMENTS.md
✓ Created .planning/ROADMAP.md

## Roadmap Summary:

Phase 1: Foundation (Day 1-2)
- Project setup with Vite + TypeScript
- Basic component structure
- localStorage utility

Phase 2: Core Features (Day 3-4)
- Task CRUD operations
- Complete/uncomplete functionality
- Filter controls

Phase 3: Polish (Day 5-6)
- Styling with TailwindCSS
- Keyboard shortcuts
- Tests

Phase 4: Deployment (Day 7)
- Production build
- Deploy to Vercel
- Documentation

Ready to plan Phase 1?
```

### Session 2: Planning Phase 1 (10 minutes)

**You:**
```
Plan phase 1
```

**Me (invokes reis_planner subagent):**
```
✓ Created 2 plans for Phase 1: Foundation

Wave 1 (parallel):
- 1-01-project-setup.PLAN.md: Initialize Vite project with TypeScript
- 1-02-component-structure.PLAN.md: Create basic component layout

Plans saved to: .planning/phases/1-foundation/

Each plan contains:
- 2-3 atomic tasks
- Verification commands
- Success criteria

Ready to execute? Say "Execute phase 1"
```

### Session 3: Execution (30 minutes)

**You:**
```
Execute phase 1
```

**Me (invokes reis_executor for each plan in parallel):**
```
⚡ Executing Phase 1 Plans...

Plan 1-01: Project Setup
  ✓ Task 1: Initialize Vite project (commit: feat(01-17): initialize vite project)
  ✓ Task 2: Add TypeScript config (commit: feat(01-17): configure typescript)
  ✓ Task 3: Install dependencies (commit: feat(01-17): add base dependencies)
  ✓ Verification passed
  ✓ Summary created

Plan 1-02: Component Structure
  ✓ Task 1: Create App layout (commit: feat(01-17): create app layout)
  ✓ Task 2: Add TaskList component (commit: feat(01-17): add task list component)
  ✓ Task 3: Add TaskForm component (commit: feat(01-17): add task form)
  ✓ Verification passed
  ✓ Summary created

✅ Phase 1 Complete!

**What was built:**
- Vite + React + TypeScript project structure
- Basic component layout (App, TaskList, TaskForm)
- localStorage utility module
- Development server running

**Next steps:**
- Plan phase 2: "plan phase 2"
- Verify functionality: "npm run dev"

Git commits: 6 total (1 per task)
```

### Session 4-6: Continue Pattern

Same pattern for phases 2-4:
1. "Plan phase [N]"
2. "Execute phase [N]"
3. "Verify phase [N] work"

### Final Result (End of Week)

```
You: "What's the project status?"

Me:
✓ All 4 phases complete!

Phase 1: Foundation - ✓ Complete
Phase 2: Core Features - ✓ Complete
Phase 3: Polish - ✓ Complete
Phase 4: Deployment - ✓ Complete

**Deliverables:**
- Working task manager app
- 24 git commits (all atomic)
- Deployed to Vercel
- README documentation

**Stats:**
- Total time: 6 days
- Lines of code: ~800
- Test coverage: 75%
- Bundle size: 145 KB

Ship it! 🚀
```

---

## Example 2: Blog Platform

### Project: Markdown Blog with Admin

**Goal:** Build a blog platform with authentication and markdown support in 2 weeks.

### Session 1: Initialization

**You:**
```
Initialize a REIS project for a markdown blog platform.

Must have:
- Markdown editor for posts
- Authentication (email/password)
- Public blog view
- Admin dashboard for managing posts
- SEO-friendly URLs

Nice to have:
- Image uploads
- Comments
- Categories/tags

Not building:
- Multi-author support
- Custom themes
- E-commerce features

Tech: Next.js + TypeScript + Supabase + TailwindCSS
Timeline: 2 weeks
```

**Me:**
```
✓ Created .planning/PROJECT.md

Excellent choice! Next.js is perfect for SEO and Supabase handles auth/database.

Key architectural decisions:
- Server-side rendering for blog posts (SEO)
- Supabase Auth for authentication
- Supabase Storage for images
- Edge functions for API logic

Questions before we continue:
1. Should posts be published immediately or have draft state?
2. Rich markdown (images, code blocks) or basic?
3. Any specific SEO requirements (meta tags, sitemap)?

Answer these or say "continue with defaults"
```

**You:**
```
1. Draft state with publish action
2. Rich markdown with code syntax highlighting
3. Generate sitemap.xml and meta tags for each post

Continue with these requirements
```

**Me:**
```
✓ Updated PROJECT.md with your answers
✓ Created REQUIREMENTS.md
✓ Created ROADMAP.md

## Roadmap (6 phases over 2 weeks):

Phase 1: Foundation (Day 1-2)
- Next.js setup with TypeScript
- Supabase integration
- Database schema

Phase 2: Authentication (Day 3-4)
- Sign up / Login
- Protected routes
- Session management

Phase 3: Post Management (Day 5-7)
- Create/edit posts
- Markdown editor
- Draft/publish workflow

Phase 4: Public Blog (Day 8-9)
- Blog list page
- Individual post pages
- SEO optimization

Phase 5: Admin Dashboard (Day 10-11)
- Post management UI
- Analytics
- User management

Phase 6: Launch Prep (Day 12-14)
- Testing
- Performance optimization
- Deployment
- Documentation

Research needs:
- Best markdown editors for React
- Next.js 14 SSR patterns
- Supabase RLS policies

Ready to research? Say "research the project"
```

### Session 2: Research (Optional but Recommended)

**You:**
```
Research the project
```

**Me (spawns research subagent):**
```
📚 Researching blog platform ecosystem...

✓ Created research files:
- .planning/research/markdown-editors.RESEARCH.md
- .planning/research/nextjs-ssr-patterns.RESEARCH.md
- .planning/research/supabase-security.RESEARCH.md

## Key Findings:

**Markdown Editors:**
- Recommended: react-markdown + react-syntax-highlighter
- Alternative: MDXEditor (more features)
- Avoid: Heavy WYSIWYG editors (bundle size)

**Next.js SSR:**
- Use App Router (Next.js 14)
- generateStaticParams for blog posts
- Incremental Static Regeneration for updates

**Supabase Security:**
- Enable Row Level Security (RLS)
- Policies: users can only edit their own posts
- Service role key only in edge functions

This research will inform planning. Ready to plan phase 1?
```

### Session 3-8: Execute Phases

Same pattern as Todo App:

```
Day 1-2:  Plan phase 1 → Execute phase 1
Day 3-4:  Plan phase 2 → Execute phase 2
Day 5-7:  Plan phase 3 → Execute phase 3
Day 8-9:  Plan phase 4 → Execute phase 4
Day 10-11: Plan phase 5 → Execute phase 5
Day 12-14: Plan phase 6 → Execute phase 6
```

### Example of Phase 3 Execution

**You:**
```
Execute phase 3
```

**Me:**
```
⚡ Executing Phase 3: Post Management

Wave 1 (parallel):
- 3-01-database-schema.PLAN.md
- 3-02-markdown-editor.PLAN.md

Wave 2 (depends on Wave 1):
- 3-03-post-crud-api.PLAN.md
- 3-04-draft-publish-workflow.PLAN.md

[Executes all plans with fresh subagents]

✅ Phase 3 Complete!

**What was built:**
- Posts table in Supabase (id, title, content, status, user_id)
- RLS policies (users can CRUD their own posts)
- Markdown editor with preview
- Draft/publish workflow with confirmation
- API routes for post management

**Commits:** 12 atomic commits

**Tests:** 
- API endpoints: ✓ Tested
- UI components: ✓ Tested
- Auth flows: ✓ Tested

**Next:** Plan phase 4 (Public blog pages)
```

---

## Example 3: E-commerce Dashboard

### Project: Admin Dashboard for E-commerce

**Goal:** Analytics dashboard for an existing e-commerce API.

### Initialization

**You:**
```
Initialize a REIS project for an e-commerce admin dashboard.

Context: We have an existing REST API for our e-commerce platform.
Need a dashboard for admins to view sales, manage products, track inventory.

Must have:
- Sales analytics (revenue, orders, trends)
- Product management (CRUD)
- Inventory tracking
- Order management
- Real-time updates

Nice to have:
- Customer analytics
- Export to CSV
- Push notifications

Not building:
- Customer-facing store
- Payment processing
- Shipping integration

Tech: React + TypeScript + TailwindCSS + Chart.js
API: Existing REST API (will provide docs)
Timeline: 3 weeks
```

**Me:**
```
✓ Created .planning/PROJECT.md

Great! Since you have an existing API, I'll need:

1. API documentation or base URL
2. Authentication method (JWT, API key?)
3. Key endpoints we'll integrate with
4. Any specific chart types needed?
5. Real-time via WebSockets or polling?

Please provide or say "I'll add details to PROJECT.md manually"
```

**You:**
```
1. API base: https://api.mystore.com
2. Auth: JWT bearer tokens
3. Endpoints: /products, /orders, /analytics, /inventory
4. Charts: Line charts for trends, pie charts for categories
5. Real-time: WebSocket connection for order updates

Continue
```

**Me:**
```
✓ Updated PROJECT.md
✓ Created REQUIREMENTS.md
✓ Created ROADMAP.md

## Roadmap (8 phases over 3 weeks):

Phase 1: Foundation (Day 1-2)
- Project setup
- API client with auth
- Layout structure

Phase 2: Authentication (Day 3)
- Login page
- Token management
- Protected routes

Phase 3: Sales Dashboard (Day 4-6)
- Revenue metrics
- Order statistics
- Trend charts
- Date range filters

Phase 4: Product Management (Day 7-9)
- Product list with search
- Create/edit product form
- Image upload
- Bulk operations

Phase 5: Inventory Tracking (Day 10-11)
- Stock levels
- Low stock alerts
- Restock history

Phase 6: Order Management (Day 12-13)
- Order list and filters
- Order details
- Status updates
- Real-time notifications

Phase 7: Additional Features (Day 14-15)
- Customer analytics
- Export functionality
- Settings

Phase 8: Launch (Day 16-21)
- Testing
- Performance optimization
- Deployment
- Documentation

Ready to start? Say "plan phase 1"
```

---

## Example 4: Improving Existing Project

### Project: Refactor HabitFlow Timer

**Goal:** Improve the timer system in existing HabitFlow app.

### Session 1: Map Existing Code

**You:**
```
Map this codebase with REIS
```

**Me (invokes reis_project_mapper):**
```
📊 Analyzing codebase...

✓ Created .planning/STACK.md
✓ Created .planning/ARCHITECTURE.md
✓ Created .planning/STRUCTURE.md
✓ Created .planning/CONVENTIONS.md
✓ Created .planning/TESTING.md
✓ Created .planning/INTEGRATIONS.md
✓ Created .planning/CONCERNS.md

## Summary:

**Stack:** React 18 + TypeScript + Vite + Supabase

**Architecture:** 
- Monolithic SPA
- Zustand for state
- Component-based structure

**Key Findings:**

Strengths:
- ✅ Good TypeScript coverage
- ✅ Well-organized components
- ✅ Decent test coverage on timer

Issues:
- ⚠️ TimerContainer.tsx too large (850 lines)
- ⚠️ Complex timer state logic
- ⚠️ No E2E tests
- ⚠️ Performance: frequent re-renders

**Technical Debt:**
- Timer component needs refactoring
- Inconsistent error handling
- Missing integration tests

Review the files in .planning/ and then we can create an improvement roadmap.

Ready to continue? Say "create improvement roadmap"
```

### Session 2: Create Improvement Roadmap

**You:**
```
Initialize a REIS project for refactoring the timer system based on the mapped code
```

**Me:**
```
✓ Created .planning/PROJECT.md (Timer Refactoring)

Using insights from codebase mapping:

**Objective:**
Refactor timer system for better maintainability, performance, and testing.

**Scope:**
- Break down TimerContainer (850 lines → <300 per file)
- Extract timer logic to hooks
- Improve performance (reduce re-renders)
- Add E2E tests
- Improve error handling

**Out of Scope:**
- Adding new timer features
- Changing UI design
- Modifying other app areas

Ready to create roadmap? Say "create roadmap"
```

**You:**
```
Create roadmap
```

**Me:**
```
✓ Created .planning/ROADMAP.md

## Roadmap (4 phases):

Phase 1: Preparation (Day 1)
- Document current timer architecture
- Create test baseline
- Set up test environment

Phase 2: Extract Logic (Day 2-3)
- Extract hooks (useCountdown, useStopwatch, useIntervals)
- Move utilities to separate files
- Add unit tests for hooks

Phase 3: Component Refactoring (Day 4-5)
- Break TimerContainer into smaller components
- Optimize render performance
- Add component tests

Phase 4: Integration & Testing (Day 6-7)
- Add E2E tests
- Performance testing
- Error handling improvements
- Documentation

Each change will be backward compatible and tested before merging.

Ready to start? Say "plan phase 1"
```

### Session 3-6: Execute Refactoring

Same pattern - plan and execute each phase:

```
You: "Plan phase 1"
Me:  [Creates plans for documenting and baselining]

You: "Execute phase 1"
Me:  [Executes plans, creates baseline]

You: "Plan phase 2"
Me:  [Creates plans for extracting hooks]

You: "Execute phase 2"
Me:  [Extracts hooks with tests, verifies nothing breaks]

And so on...
```

### Example Phase 2 Execution

**You:**
```
Execute phase 2
```

**Me:**
```
⚡ Executing Phase 2: Extract Logic

Plan 2-01: Extract useCountdown Hook
  ✓ Task 1: Create useCountdown.ts (commit: refactor(01-17): extract useCountdown hook)
  ✓ Task 2: Add tests (commit: test(01-17): add useCountdown tests)
  ✓ Task 3: Update TimerContainer to use hook (commit: refactor(01-17): use useCountdown in TimerContainer)
  ✓ Verification: All existing tests pass ✓

Plan 2-02: Extract useStopwatch Hook
  [Similar structure...]

Plan 2-03: Extract Timer Utilities
  [Similar structure...]

✅ Phase 2 Complete!

**What changed:**
- Created: useCountdown.ts, useStopwatch.ts, useIntervals.ts
- Tests: 24 new tests for extracted logic
- TimerContainer.tsx: 850 lines → 450 lines (-47%)
- All existing functionality preserved (regression tests pass)

**Performance:**
- Re-renders reduced by 40% (measured)
- Hook reusability improved

**Next:** Plan phase 3 (component breakdown)
```

---

## Example 5: Bug Fix Sprint

### Project: Emergency Bug Fixes

**Goal:** Fix critical bugs before launch.

**You:**
```
I have 3 critical bugs to fix before tomorrow's launch:

1. Users can't reset password (email not sending)
2. Timer doesn't save when user closes tab
3. Performance issue: habit list loads slowly with 100+ habits

Can you help me fix these with REIS?
```

**Me:**
```
Absolutely! Let's create an urgent bug fix phase.

✓ Created .planning/PROJECT.md (Critical Bug Fixes)

**Approach:**
Since these are urgent, I'll create a single "critical-fixes" phase
with 3 parallel plans (one per bug).

Ready? Say "create bug fix roadmap"
```

**You:**
```
Create bug fix roadmap
```

**Me:**
```
✓ Created .planning/ROADMAP.md

## Roadmap (1 urgent phase):

Phase 0: Critical Bug Fixes (Today)
- Fix password reset email
- Fix timer persistence
- Optimize habit list loading

All 3 can be fixed in parallel since they're independent.

Ready to plan? Say "plan phase 0"
```

**You:**
```
Plan phase 0
```

**Me:**
```
✓ Created 3 plans for Phase 0: Critical Bug Fixes

All Wave 1 (parallel):
- 0-01-password-reset-fix.PLAN.md
- 0-02-timer-persistence-fix.PLAN.md
- 0-03-habit-list-optimization.PLAN.md

Each plan includes:
- Root cause investigation
- Fix implementation
- Testing
- Verification

Estimated time: 2-3 hours total (plans run in parallel)

Ready to execute? Say "execute phase 0"
```

**You:**
```
Execute phase 0
```

**Me:**
```
⚡ Executing Phase 0: Critical Bug Fixes (parallel execution)

Plan 0-01: Password Reset Fix
  🔍 Task 1: Investigate email sending
     → Found: Supabase SMTP not configured in .env
  ✓ Task 2: Add SMTP config (commit: fix(01-17): add SMTP configuration)
  ✓ Task 3: Test password reset flow (commit: test(01-17): add password reset test)
  ✓ Verification: Email sent successfully ✓

Plan 0-02: Timer Persistence Fix
  🔍 Task 1: Debug persistence issue
     → Found: beforeunload event not saving state
  ✓ Task 2: Add beforeunload handler (commit: fix(01-17): save timer state on tab close)
  ✓ Task 3: Test persistence (commit: test(01-17): add tab close test)
  ✓ Verification: Timer state persists ✓

Plan 0-03: Habit List Optimization
  🔍 Task 1: Profile performance
     → Found: N+1 query fetching progress for each habit
  ✓ Task 2: Optimize query with join (commit: perf(01-17): optimize habit list query)
  ✓ Task 3: Add pagination (commit: feat(01-17): add pagination to habit list)
  ✓ Verification: Page loads in <500ms ✓

✅ All Critical Bugs Fixed!

**Time taken:** 2 hours 15 minutes
**Commits:** 6 atomic commits
**All tests passing:** ✓

**Verification Results:**
- Password reset: Email delivers in 5-10 seconds ✓
- Timer persistence: Works across browser close/reopen ✓
- Habit list: Loads 100 habits in 350ms (was 4.2s) ✓

Ready to deploy! 🚀
```

---

## Example 6: Performance Optimization

### Project: Improve App Performance

**You:**
```
Map this codebase and create a performance optimization roadmap
```

**Me:**
```
📊 Mapping codebase...
✓ Created architecture docs

🔍 Running performance analysis...

## Performance Issues Found:

🔴 Critical:
- Bundle size: 2.3 MB (should be <1 MB)
- Timer component re-renders 60x/second
- N+1 queries in habit progress calculation

🟡 High:
- No code splitting on routes
- Large images not optimized
- No service worker for caching

🟢 Medium:
- Unused dependencies (moment, lodash)
- Console.logs in production
- Unoptimized assets

✓ Created .planning/PROJECT.md (Performance Optimization)
✓ Created .planning/ROADMAP.md

## Roadmap (3 phases):

Phase 1: Quick Wins (Day 1)
- Remove unused dependencies (-200 KB)
- Add route-based code splitting
- Optimize images

Phase 2: Component Optimization (Day 2-3)
- Memoize timer component
- Fix unnecessary re-renders
- Lazy load heavy components

Phase 3: Data & Caching (Day 4-5)
- Fix N+1 queries
- Add React Query for caching
- Implement service worker

Expected improvements:
- Bundle size: 2.3 MB → 800 KB (-65%)
- Load time: 3.5s → 1.2s (-66%)
- Time to interactive: 5s → 1.8s (-64%)

Ready to start? Say "plan phase 1"
```

---

## Common Patterns

### Pattern 1: New Feature

```
1. "Add phase for [feature] to roadmap"
2. "Research [feature] best practices"  # Optional
3. "Plan the new phase"
4. "Execute the phase plans"
5. "Verify the feature works"
```

### Pattern 2: Refactoring

```
1. "Map this codebase"
2. "Create improvement roadmap from analysis"
3. "Plan phase 1"
4. "Execute with backward compatibility"
5. "Verify nothing breaks"
```

### Pattern 3: Bug Fixes

```
1. "Create urgent bug fix phase before phase [N]"
2. "Plan the bug fix phase"
3. "Execute bug fixes"
4. "Verify fixes"
```

### Pattern 4: Optimization

```
1. "Analyze performance bottlenecks"
2. "Create optimization roadmap"
3. "Plan quick wins first"
4. "Execute and measure improvements"
```

---

## Tips from Real Usage

### Start Small
Your first REIS project should be simple:
- ✅ Todo app, calculator, markdown editor
- ❌ Full e-commerce platform with payment processing

### Trust the Process
- Let executors fix bugs automatically
- Review SUMMARY.md after execution
- Update STATE.md regularly

### Iterate Quickly
- Don't overthink PROJECT.md initially
- Refine as you learn
- Ship early, improve continuously

### Use Research
- Research before complex phases
- Saves time in execution
- Reduces rework

### Leverage Parallelism
- Design phases to minimize dependencies
- More plans can run simultaneously
- Faster completion

---

**Ready to try REIS on your project?** Start with:
```
"Initialize a REIS project for [your simple idea]"
```

Or map your existing code:
```
"Map this codebase with REIS"
```
