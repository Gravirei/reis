# Metadata Decision Tree Example

Demonstrates all metadata types: weight, priority, risk, and recommended badges.

## Decision Tree: Choose Deployment Platform

```
Where should we deploy our application?
  ├─ Cloud Platforms [priority: high]
  │   ├─ AWS [weight: 9] [priority: high] [risk: medium]
  │   │   → Most comprehensive, steep learning curve
  │   ├─ Google Cloud [weight: 8] [priority: medium] [risk: medium]
  │   │   → Great for data/ML, complex pricing
  │   ├─ Azure [weight: 8] [priority: medium] [risk: medium]
  │   │   → Best for .NET, enterprise-friendly
  │   └─ DigitalOcean [weight: 7] [priority: low] [risk: low]
  │       → Simple, developer-friendly, limited services
  ├─ Serverless Platforms [recommended] [priority: high] [risk: low]
  │   ├─ Vercel [weight: 10] [recommended] [risk: low]
  │   │   → Next.js optimized, excellent DX, free tier
  │   ├─ Netlify [weight: 9] [risk: low]
  │   │   → Great for static sites, edge functions
  │   ├─ Cloudflare Workers [weight: 8] [risk: low]
  │   │   → Edge computing, global distribution
  │   └─ Railway [weight: 7] [risk: low]
  │       → Full-stack hosting, databases included
  ├─ Container Platforms [priority: medium]
  │   ├─ Docker + Kubernetes [weight: 9] [priority: high] [risk: high]
  │   │   → Most control, complex setup
  │   ├─ Docker Swarm [weight: 6] [priority: low] [risk: medium]
  │   │   → Simpler than K8s, less features
  │   ├─ AWS ECS [weight: 8] [priority: medium] [risk: medium]
  │   │   → AWS-native, Fargate option
  │   └─ Google Cloud Run [weight: 8] [recommended] [priority: medium] [risk: low]
  │       → Serverless containers, auto-scaling
  ├─ Platform as a Service (PaaS) [priority: medium] [risk: low]
  │   ├─ Heroku [weight: 7] [priority: medium] [risk: low]
  │   │   → Simple deployment, add-ons ecosystem, expensive
  │   ├─ Render [weight: 8] [recommended] [priority: medium] [risk: low]
  │   │   → Modern Heroku alternative, better pricing
  │   ├─ Fly.io [weight: 8] [priority: medium] [risk: low]
  │   │   → Global deployment, edge computing
  │   └─ Google App Engine [weight: 6] [priority: low] [risk: medium]
  │       → Fully managed, vendor lock-in
  └─ Self-Hosted [priority: low]
      ├─ VPS (DigitalOcean, Linode, etc.) [weight: 6] [risk: high]
      │   → Full control, manual management
      ├─ Bare Metal [weight: 5] [risk: high]
      │   → Maximum performance, highest maintenance
      └─ Home Server [weight: 3] [risk: high]
          → Free, unreliable, security concerns
```

**Metadata Types Explained:**

**[weight: 1-10]**
- Numeric importance score
- Higher = more recommended by the community/data
- Used for algorithmic decision-making

**[priority: high|medium|low]**
- Business/project priority level
- HIGH: Critical for success
- MEDIUM: Important but not critical
- LOW: Nice to have

**[risk: high|medium|low]**
- Risk assessment for choosing this option
- HIGH: Complex, expensive, or difficult to change
- MEDIUM: Moderate learning curve or cost
- LOW: Safe choice, easy to start

**[recommended]**
- Explicitly marked as the best choice for most users
- Based on popularity, stability, and developer experience

**Expected Output:**
- Colored badges for each metadata type
- Risk levels highlighted appropriately
- Recommended options stand out with ★ icon
- Weight values shown for comparison

**Usage:**
```bash
# View with all metadata
reis tree show examples/decision-trees/metadata-tree.md

# Hide metadata
reis tree show examples/decision-trees/metadata-tree.md --no-metadata

# Interactive selection (metadata visible during navigation)
reis tree show examples/decision-trees/metadata-tree.md --interactive

# Export with metadata preserved
reis tree export examples/decision-trees/metadata-tree.md --format html
```

**Metadata in Different Formats:**

**Terminal:** Color-coded badges (green=recommended, red=high risk, etc.)
**HTML Export:** CSS-styled badges with tooltips
**SVG Export:** Colored labels and icons
**Mermaid Export:** Text annotations in nodes
**JSON Export:** Structured metadata objects
