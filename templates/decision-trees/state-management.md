# State Management

## Decision Tree: State Management for React

```
How should we manage state in our React application?
  ├─ Built-in React State [weight: 8] [priority: high] [risk: low] [recommended]
  │   ├─ useState + useReducer [recommended]
  │   │   ├─ Best for
  │   │   │   ├─ Simple apps → Few components sharing state
  │   │   │   ├─ Local state → Component-specific data
  │   │   │   └─ Forms → Input handling
  │   │   ├─ Patterns
  │   │   │   ├─ Lift state up → Share between siblings
  │   │   │   ├─ Composition → Pass props explicitly
  │   │   │   └─ useReducer → Complex state logic
  │   │   └─ Advantages: No dependencies, simple, performant
  │   │
  │   ├─ Context API [weight: 7]
  │   │   ├─ Best for
  │   │   │   ├─ Theme → Dark mode toggle
  │   │   │   ├─ Auth state → User info, permissions
  │   │   │   ├─ Localization → Language settings
  │   │   │   └─ Feature flags → App configuration
  │   │   ├─ Patterns
  │   │   │   ├─ Multiple contexts → Separate concerns
  │   │   │   ├─ Context + useReducer → Predictable updates
  │   │   │   └─ Lazy context → Avoid unnecessary renders
  │   │   ├─ Advantages: Built-in, no library needed
  │   │   └─ Caution: Can cause re-renders if not careful
  │   │
  │   └─ When enough: Small to medium apps, simple state needs
  │
  ├─ Zustand [weight: 9] [priority: high] [risk: low] [recommended]
  │   ├─ Philosophy → Simple, unopinionated, hooks-based
  │   ├─ Features
  │   │   ├─ Minimal boilerplate → Define stores easily
  │   │   ├─ No Provider needed → Direct imports
  │   │   ├─ Selective subscriptions → Optimize renders
  │   │   └─ DevTools support → Time-travel debugging
  │   ├─ Best for
  │   │   ├─ Modern React apps → Hooks-first approach
  │   │   ├─ Medium complexity → More than Context, less than Redux
  │   │   ├─ Global state → Shared across many components
  │   │   └─ TypeScript projects → Excellent TS support
  │   ├─ Code Example
  │   │   └─ create((set) => ({ count: 0, inc: () => set(...) }))
  │   └─ Learning Curve: Very low, similar to useState
  │
  ├─ Redux Toolkit [weight: 7] [priority: medium] [risk: medium]
  │   ├─ Philosophy → Predictable state container, single source of truth
  │   ├─ Features
  │   │   ├─ Redux Toolkit (RTK) → Modern Redux, less boilerplate
  │   │   ├─ RTK Query → Built-in data fetching
  │   │   ├─ DevTools → Best-in-class debugging
  │   │   ├─ Middleware → Redux Thunk, Saga for async
  │   │   └─ Time-travel debugging → Replay state changes
  │   ├─ Best for
  │   │   ├─ Complex state logic → Many interdependencies
  │   │   ├─ Large teams → Predictable patterns
  │   │   ├─ Existing Redux apps → Already invested
  │   │   └─ Strict architecture → Enforced patterns
  │   ├─ Concepts
  │   │   ├─ Store → Single state tree
  │   │   ├─ Actions → Describe what happened
  │   │   ├─ Reducers → How state changes
  │   │   └─ Slices (RTK) → Combined actions + reducers
  │   └─ Learning Curve: Medium, concepts to learn
  │
  ├─ Jotai [weight: 8] [priority: medium] [risk: low]
  │   ├─ Philosophy → Atomic state management
  │   ├─ Features
  │   │   ├─ Atoms → Minimal state units
  │   │   ├─ Derived state → Computed values
  │   │   ├─ Async atoms → Built-in async handling
  │   │   └─ No Provider → Direct usage
  │   ├─ Best for
  │   │   ├─ Bottom-up approach → Start small, compose
  │   │   ├─ Form state → Field-level granularity
  │   │   ├─ Modular apps → Independent state units
  │   │   └─ TypeScript → Excellent type inference
  │   └─ Similar to: Recoil but lighter, more flexible
  │
  ├─ Recoil [weight: 6] [priority: low] [risk: medium]
  │   ├─ Philosophy → Atomic state by Facebook
  │   ├─ Features
  │   │   ├─ Atoms → Shared state units
  │   │   ├─ Selectors → Derived/computed state
  │   │   ├─ Async queries → Built-in loading states
  │   │   └─ React-first → Designed for React
  │   ├─ Best for
  │   │   ├─ Complex derived state → Heavy computations
  │   │   ├─ Graph-like dependencies → State depends on other state
  │   │   └─ Facebook ecosystem → Using React Native
  │   └─ Status: Still experimental, slower updates
  │
  ├─ MobX [weight: 6] [priority: low] [risk: medium]
  │   ├─ Philosophy → Reactive programming, observable state
  │   ├─ Features
  │   │   ├─ Automatic tracking → No manual subscriptions
  │   │   ├─ Computed values → Cached derivations
  │   │   ├─ Actions → Mutate state directly
  │   │   └─ Decorators → Class-based API (or hooks)
  │   ├─ Best for
  │   │   ├─ OOP background → Class-based patterns
  │   │   ├─ Complex state graphs → Automatic updates
  │   │   └─ Less boilerplate → Concise code
  │   └─ Learning Curve: Different mental model
  │
  └─ Server State Management [weight: 7] [priority: high] [risk: low]
      ├─ TanStack Query (React Query) [weight: 9] [recommended]
      │   ├─ Features
      │   │   ├─ Caching → Smart cache management
      │   │   ├─ Background refetch → Keep data fresh
      │   │   ├─ Optimistic updates → Instant UI feedback
      │   │   ├─ Pagination/infinite scroll → Built-in
      │   │   └─ DevTools → Query inspector
      │   ├─ Best for
      │   │   ├─ API data → Server-fetched state
      │   │   ├─ Real-time apps → Auto-refetch
      │   │   └─ Data-heavy apps → Reduce boilerplate
      │   └─ Use with: Zustand/Context for client state
      │
      ├─ SWR [weight: 8]
      │   ├─ Features
      │   │   ├─ Stale-while-revalidate → Show stale, fetch fresh
      │   │   ├─ Lightweight → Smaller bundle
      │   │   ├─ Real-time → Built-in revalidation
      │   │   └─ TypeScript → Great TS support
      │   ├─ Best for
      │   │   ├─ Vercel/Next.js → Same team
      │   │   ├─ Simple data fetching → Less complex than React Query
      │   │   └─ Real-time data → Auto-revalidation
      │   └─ Use with: Zustand/Context for client state
      │
      └─ Apollo Client [weight: 7]
          ├─ Best for GraphQL APIs only
          ├─ Features: Normalized cache, optimistic UI
          └─ Use with: GraphQL backends
```

## Context

State management choice depends on:
- App complexity (simple vs. complex)
- State type (client vs. server)
- Team size and experience
- Performance requirements
- Existing tech stack

## Recommendations

**Start with React built-ins** (useState + Context):
- Most apps don't need external state management
- Use Context for theme, auth, localization
- Use prop drilling until it hurts

**Add Zustand** when Context isn't enough:
- Simpler than Redux
- Better performance than Context
- Easy to learn and use
- Great TypeScript support

**Use React Query for server state**:
- Don't mix server state with client state
- React Query handles caching, refetching, etc.
- Focus on client state only in Zustand/Redux

**Avoid Redux unless**:
- Large team needs strict patterns
- Complex state with many interdependencies
- Already heavily invested in Redux

## Mental Model

```
Client State                Server State
(owned by browser)          (owned by server)
├─ UI state                 ├─ User data
├─ Form inputs              ├─ Posts/articles
├─ Theme                    ├─ Comments
├─ Modals open/closed       └─ External API data
└─ Selected items

Tools:                      Tools:
- useState                  - React Query ✅
- Zustand ✅                - SWR
- Redux                     - Apollo Client
```

## Implementation Checklist

- [ ] Identify state types (client vs server)
- [ ] Start with React built-ins
- [ ] Add React Query for API data
- [ ] Add Zustand if global client state needed
- [ ] Set up DevTools
- [ ] Define clear state structure
- [ ] Document state management approach
- [ ] Add TypeScript types for state
- [ ] Write tests for state logic
- [ ] Monitor performance
- [ ] Refactor as app grows

## Common Pitfalls

❌ **Using Redux for everything** → Overengineering
✅ **Use right tool for each state type** → Simpler code

❌ **Putting server data in Redux** → Cache invalidation nightmare
✅ **Use React Query for server data** → Automatic caching

❌ **Context for frequently changing state** → Performance issues
✅ **Use Zustand for granular subscriptions** → Better performance

❌ **Starting with complex state library** → Premature optimization
✅ **Start simple, upgrade when needed** → YAGNI principle
