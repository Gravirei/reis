# Real-World Example: Software Architecture

A practical decision tree for choosing software architecture patterns.

## Decision Tree: Choose Software Architecture

```
What architecture pattern should we use?
  ├─ Monolithic [weight: 7] [priority: medium] [risk: low]
  │   ├─ Traditional Monolith
  │   │   ├─ Pros → Simple deployment, easy debugging, fast development
  │   │   ├─ Cons → Scaling challenges, tight coupling, long build times
  │   │   └─ Best for → MVPs, small teams, simple domains
  │   ├─ Modular Monolith [recommended] [weight: 9] [risk: low]
  │   │   ├─ Pros → Clear boundaries, easier refactoring, single deployment
  │   │   ├─ Cons → Discipline required, can become messy
  │   │   └─ Best for → Most projects, growing teams, clear domains
  │   └─ Monorepo Monolith [weight: 8]
  │       ├─ Pros → Shared code, atomic commits, consistent tooling
  │       ├─ Cons → Build complexity, repo size
  │       └─ Best for → Multiple related apps, shared libraries
  ├─ Microservices [priority: high] [risk: high]
  │   ├─ Pure Microservices [weight: 6] [risk: high]
  │   │   ├─ Pros → Independent scaling, tech diversity, fault isolation
  │   │   ├─ Cons → Complexity, distributed debugging, network overhead
  │   │   └─ Best for → Large teams (50+), complex domains, high scale
  │   ├─ Microfrontends [weight: 5] [priority: low] [risk: high]
  │   │   ├─ Pros → Independent frontend teams, tech flexibility
  │   │   ├─ Cons → Performance overhead, shared state complexity
  │   │   └─ Best for → Large orgs, multiple frontend teams
  │   ├─ Domain-Driven Microservices [recommended] [weight: 8] [risk: medium]
  │   │   ├─ Pros → Clear boundaries, business-aligned, scalable
  │   │   ├─ Cons → Requires DDD expertise, upfront design
  │   │   └─ Best for → Complex domains, experienced teams
  │   └─ [IF: kubernetes]
  │       ├─ Service Mesh (Istio, Linkerd) → Advanced networking, observability
  │       └─ Sidecar Pattern → Service-to-service communication
  ├─ Serverless [recommended] [priority: high] [risk: low]
  │   ├─ Functions-as-a-Service (FaaS) [weight: 8]
  │   │   ├─ AWS Lambda [weight: 9] [priority: high]
  │   │   │   → Mature, feature-rich, cold start issues
  │   │   ├─ Cloudflare Workers [weight: 8] [recommended]
  │   │   │   → Edge computing, fast cold starts, limited runtime
  │   │   └─ Vercel Functions [weight: 7]
  │   │       → Integrated with frontend, great DX
  │   ├─ Backend-as-a-Service (BaaS) [weight: 7] [risk: low]
  │   │   ├─ Firebase → Real-time DB, auth, hosting
  │   │   ├─ Supabase [recommended] → Open source, PostgreSQL
  │   │   └─ AWS Amplify → AWS services, mobile-first
  │   └─ Serverless Containers [weight: 8] [priority: medium]
  │       ├─ AWS Fargate → Container orchestration without servers
  │       ├─ Google Cloud Run [recommended] → Auto-scaling containers
  │       └─ Azure Container Instances → Simple container hosting
  ├─ Event-Driven Architecture [priority: medium] [risk: medium]
  │   ├─ Event Sourcing [weight: 7] [risk: high]
  │   │   ├─ Pros → Full audit trail, temporal queries, replay events
  │   │   ├─ Cons → Complex queries, eventual consistency, storage
  │   │   └─ Best for → Financial systems, audit requirements
  │   ├─ CQRS (Command Query Responsibility Segregation) [weight: 7] [risk: medium]
  │   │   ├─ Pros → Optimized reads/writes, scalable, clear separation
  │   │   ├─ Cons → Eventual consistency, complexity
  │   │   └─ Best for → High-read apps, complex domains
  │   ├─ Message Queue Architecture [weight: 8] [recommended]
  │   │   ├─ RabbitMQ → Flexible routing, reliable
  │   │   ├─ Apache Kafka → High throughput, event streaming
  │   │   └─ AWS SQS/SNS → Managed, scalable, AWS integration
  │   └─ Pub/Sub Pattern [weight: 8]
  │       ├─ Google Pub/Sub → Global, scalable
  │       ├─ Redis Pub/Sub → Simple, fast, in-memory
  │       └─ MQTT → IoT-focused, lightweight
  └─ Hybrid Approaches [recommended] [priority: high] [risk: medium]
      ├─ Modular Monolith → Microservices [weight: 9] [recommended]
      │   → Start simple, extract services as needed
      ├─ Serverless + Monolith [weight: 8]
      │   → Core in monolith, async tasks in functions
      ├─ Event-Driven Monolith [weight: 8]
      │   → Internal events, easy to split later
      └─ BFF (Backend for Frontend) Pattern [weight: 7]
          → API gateway per client type (web, mobile, etc.)
```

**Architecture Decision Matrix:**

| Factor | Monolith | Microservices | Serverless | Event-Driven |
|--------|----------|---------------|------------|--------------|
| **Team Size** | 1-20 | 20+ | Any | 10+ |
| **Complexity** | Low | High | Low-Med | Medium |
| **Time to Market** | Fast | Slow | Fast | Medium |
| **Scalability** | Limited | Excellent | Excellent | Excellent |
| **Cost (Small)** | Low | High | Low | Medium |
| **Cost (Large)** | Medium | Medium | High | Medium |
| **Operational** | Simple | Complex | Managed | Medium |

**Migration Paths:**

```
Monolith → Modular Monolith → Domain Services → Microservices
   ↓
   └→ Serverless Functions (async tasks)
```

**Common Pitfalls:**

1. **Starting with Microservices** → Start modular monolith instead
2. **Premature Optimization** → Wait for real scale problems
3. **Ignoring Team Size** → Architecture must match team capacity
4. **Following Hype** → Choose based on requirements, not trends

**Usage:**
```bash
# View full architecture tree
reis tree show examples/decision-trees/real-world-architecture.md

# Interactive selection
reis tree show examples/decision-trees/real-world-architecture.md --interactive

# With Kubernetes context
reis tree show examples/decision-trees/real-world-architecture.md --context '{"kubernetes": true}'

# Export for documentation
reis tree export examples/decision-trees/real-world-architecture.md --format html --output docs/architecture-decision.html

# Record architecture decision
reis tree show examples/decision-trees/real-world-architecture.md --interactive
# (Make selection, confirm to record in project history)
```

**Follow-up Questions:**

After making initial decision, consider:
1. How will we handle database transactions?
2. What's our deployment strategy?
3. How do we manage shared code/libraries?
4. What's our observability/monitoring plan?
5. How will we handle inter-service communication?
