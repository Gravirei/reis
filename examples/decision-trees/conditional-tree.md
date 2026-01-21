# Conditional Decision Tree Example

Demonstrates conditional branches that evaluate based on project context.

## Decision Tree: Choose Database Strategy

```
How should we handle data persistence?
  ├─ [IF: has_database]
  │   ├─ Use connection pooling → Better performance with existing DB
  │   │   ├─ PgBouncer (PostgreSQL) [recommended] → Lightweight, efficient
  │   │   ├─ ProxySQL (MySQL) → Advanced routing, caching
  │   │   └─ Built-in pooling → Framework-provided solution
  │   └─ Optimize queries
  │       ├─ Add indexes → Faster lookups
  │       ├─ Use materialized views → Pre-computed results
  │       └─ Enable query caching → Reduce DB load
  ├─ [IF: serverless]
  │   ├─ Serverless Database
  │   │   ├─ Aurora Serverless [recommended] → Auto-scaling, pay-per-use
  │   │   ├─ Neon → Serverless Postgres
  │   │   └─ PlanetScale → Serverless MySQL
  │   └─ Database Proxy
  │       ├─ RDS Proxy → Managed connection pooling
  │       └─ Connection pooling service → Handle lambda connections
  ├─ [IF: microservices]
  │   ├─ Database per service [recommended] → Service isolation
  │   ├─ Shared database → Simpler but coupled
  │   └─ Event sourcing → Audit trail, temporal queries
  ├─ [ELSE]
  │   ├─ Start with SQLite [recommended] [priority: high] → Simple, file-based
  │   ├─ Use in-memory storage → Fast development, no persistence
  │   └─ PostgreSQL → Production-ready from start
  └─ Consider caching layer
      ├─ Redis [weight: 9] → Fast, versatile
      ├─ Memcached [weight: 7] → Simple, distributed
      └─ In-memory cache [weight: 5] → Application-level
```

**Context Variables Supported:**
- `has_database` - Project already has a database
- `serverless` - Running on serverless platform (Lambda, Vercel, etc.)
- `microservices` - Microservices architecture
- `typescript` - TypeScript project
- `monorepo` - Monorepo structure

**Expected Output:**
- Conditional branches shown with [IF: condition] prefix
- [ELSE] branches as fallback
- Only relevant branches shown when context is provided
- All branches shown when no context

**Usage:**
```bash
# Show all branches (no context)
reis tree show examples/decision-trees/conditional-tree.md

# Show with context (existing database)
reis tree show examples/decision-trees/conditional-tree.md --context '{"has_database": true}'

# Show with context (serverless)
reis tree show examples/decision-trees/conditional-tree.md --context '{"serverless": true}'

# Show with multiple conditions
reis tree show examples/decision-trees/conditional-tree.md --context '{"serverless": true, "microservices": true}'

# Interactive with context
reis tree show examples/decision-trees/conditional-tree.md --interactive --context '{"has_database": true}'
```

**How Conditions Work:**
1. Conditions are evaluated against the provided context
2. If condition is TRUE, branch is shown
3. If condition is FALSE, branch is hidden
4. [ELSE] branches are shown when no IF condition matched
5. Without context, all branches are visible
