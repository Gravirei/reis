# Multiple Decision Trees in One Document

This example shows how to include multiple decision trees in a single markdown file.
Each tree is independent and can be navigated separately.

## Decision Tree: Choose Database Type

```
What type of database do we need?
  ├─ Relational (SQL) [recommended] [weight: 9]
  │   ├─ PostgreSQL [recommended] → Feature-rich, ACID, JSON support
  │   ├─ MySQL → Popular, fast, simpler than Postgres
  │   └─ SQLite → Embedded, zero-config, file-based
  ├─ Document (NoSQL) [weight: 7]
  │   ├─ MongoDB → Flexible schema, popular, easy to start
  │   ├─ CouchDB → Offline-first, replication
  │   └─ Firebase Firestore → Real-time, managed, mobile-friendly
  ├─ Key-Value Store [weight: 6]
  │   ├─ Redis [recommended] → In-memory, caching, pub/sub
  │   ├─ Memcached → Simple caching
  │   └─ DynamoDB → AWS-native, serverless, scalable
  ├─ Graph Database [weight: 5] [priority: low]
  │   ├─ Neo4j → Mature, Cypher query language
  │   ├─ ArangoDB → Multi-model, flexible
  │   └─ Amazon Neptune → Managed, AWS integration
  └─ Time-Series [weight: 5] [priority: low]
      ├─ InfluxDB → Purpose-built, high performance
      ├─ TimescaleDB → PostgreSQL extension
      └─ Prometheus → Metrics-focused, monitoring
```

---

## Decision Tree: Choose Testing Strategy

```
What testing approach should we implement?
  ├─ Unit Testing [recommended] [priority: high] [weight: 10]
  │   ├─ Jest [recommended] → JavaScript/TypeScript, fast, snapshot testing
  │   ├─ Vitest → Vite-native, fast, Jest-compatible API
  │   ├─ Mocha + Chai → Flexible, modular
  │   └─ pytest → Python, simple, powerful
  ├─ Integration Testing [priority: high] [weight: 9]
  │   ├─ Supertest → API testing, Express-friendly
  │   ├─ Testing Library → React/Vue components
  │   ├─ Testcontainers → Docker-based dependencies
  │   └─ Database fixtures → Test with real DB
  ├─ End-to-End Testing [priority: medium] [weight: 7]
  │   ├─ Playwright [recommended] [weight: 9] → Modern, cross-browser, fast
  │   ├─ Cypress [weight: 8] → Developer-friendly, time-travel debugging
  │   ├─ Selenium [weight: 5] → Mature, verbose, slower
  │   └─ Puppeteer [weight: 6] → Chrome-only, good for scraping
  ├─ Visual Regression Testing [priority: low] [weight: 5]
  │   ├─ Percy → Cloud-based, CI integration
  │   ├─ Chromatic → Storybook integration
  │   └─ BackstopJS → Self-hosted, screenshot comparison
  └─ Performance Testing [priority: medium] [weight: 6]
      ├─ k6 [recommended] → Modern, JavaScript, cloud/local
      ├─ Apache JMeter → Java-based, GUI, comprehensive
      ├─ Lighthouse → Web performance, Google
      └─ Artillery → Load testing, simple config
```

---

## Decision Tree: Choose CI/CD Platform

```
Where should we run our CI/CD pipelines?
  ├─ Cloud CI/CD [recommended] [priority: high]
  │   ├─ GitHub Actions [recommended] [weight: 10] [risk: low]
  │   │   → Free for open source, integrated with GitHub
  │   ├─ GitLab CI [weight: 9] [risk: low]
  │   │   → Built-in, powerful, great for self-hosted
  │   ├─ CircleCI [weight: 7] [risk: low]
  │   │   → Fast, good caching, credit-based pricing
  │   └─ Travis CI [weight: 5] [priority: low]
  │       → Declining, limited features
  ├─ Enterprise CI/CD [priority: medium] [risk: medium]
  │   ├─ Jenkins [weight: 7] [risk: high]
  │   │   → Self-hosted, powerful, complex setup
  │   ├─ TeamCity [weight: 6]
  │   │   → JetBrains product, good Java support
  │   ├─ Bamboo [weight: 5]
  │   │   → Atlassian product, Jira integration
  │   └─ Azure DevOps [weight: 7]
  │       → Microsoft ecosystem, comprehensive
  ├─ Modern Platforms [recommended] [priority: high] [risk: low]
  │   ├─ Vercel [weight: 9] [recommended]
  │   │   → Automatic deploys, preview URLs, Next.js optimized
  │   ├─ Netlify [weight: 9]
  │   │   → Jamstack-focused, edge functions, split testing
  │   ├─ Railway [weight: 8]
  │   │   → Full-stack hosting, simple config
  │   └─ Render [weight: 8]
  │       → Modern PaaS, preview environments
  └─ Self-Hosted [priority: low] [risk: high]
      ├─ Drone CI → Lightweight, container-native
      ├─ Buildkite → Hybrid (cloud + self-hosted agents)
      └─ GoCD → Advanced pipelines, visualization
```

---

## How Multiple Trees Work

**Navigation:**
- When viewing this file, all trees are displayed sequentially
- In interactive mode, you can select which tree to navigate
- Each tree maintains its own decision history

**Usage Examples:**

```bash
# View all trees in document
reis tree show examples/decision-trees/multi-tree.md

# Interactive mode (select which tree to navigate)
reis tree show examples/decision-trees/multi-tree.md --interactive

# Export all trees to HTML
reis tree export examples/decision-trees/multi-tree.md --format html

# Validate all trees
reis tree validate examples/decision-trees/multi-tree.md
```

**Benefits of Multiple Trees:**

1. **Related Decisions:** Keep related decision trees together
2. **Project Context:** Document all major technical decisions in one file
3. **Version Control:** Track changes to multiple related decisions
4. **Easy Reference:** Single file for comprehensive decision documentation

**Example Use Cases:**

- **Tech Stack Document:** Database + Framework + Hosting decisions
- **Architecture Doc:** Architecture + Testing + Deployment decisions  
- **Project Kickoff:** All initial technical decisions in one place
- **RFCs:** Proposal with multiple interconnected decisions

**Best Practices:**

1. Keep trees focused on related topics
2. Use consistent metadata across trees
3. Add context sections between trees
4. Consider splitting if file gets too large (>1000 lines)
5. Use horizontal rules (`---`) to separate trees visually
