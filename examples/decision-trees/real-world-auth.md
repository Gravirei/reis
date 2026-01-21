# Real-World Example: Authentication Strategy

A practical decision tree for choosing an authentication strategy in a real project.

## Decision Tree: Choose Authentication Strategy

```
What authentication approach should we use?
  ├─ Self-Hosted Authentication [priority: medium] [risk: high]
  │   ├─ Session-Based (Cookies) [weight: 7]
  │   │   ├─ Pros → Simple, secure, stateful
  │   │   ├─ Cons → Scalability issues, CSRF risks
  │   │   └─ Best for → Traditional web apps, monoliths
  │   ├─ Token-Based (JWT) [weight: 8] [recommended]
  │   │   ├─ Pros → Stateless, scalable, cross-domain
  │   │   ├─ Cons → Token storage security, revocation complexity
  │   │   └─ Best for → SPAs, mobile apps, microservices
  │   ├─ OAuth 2.0 Provider [weight: 6] [risk: high]
  │   │   ├─ Pros → Standard protocol, flexible
  │   │   ├─ Cons → Complex to implement correctly
  │   │   └─ Best for → API platforms, third-party integrations
  │   └─ Passwordless [weight: 7] [priority: medium]
  │       ├─ Magic Links → Email-based, no password
  │       ├─ OTP (One-Time Password) → SMS or authenticator app
  │       └─ WebAuthn/Passkeys → Hardware keys, biometrics
  ├─ Managed Authentication Services [recommended] [priority: high] [risk: low]
  │   ├─ Auth0 [weight: 9] [priority: high]
  │   │   ├─ Pros → Feature-rich, enterprise-ready, great DX
  │   │   ├─ Cons → Expensive at scale, vendor lock-in
  │   │   └─ Best for → Startups to enterprise, B2B apps
  │   ├─ Firebase Authentication [weight: 8] [recommended] [risk: low]
  │   │   ├─ Pros → Free tier, Google integration, easy setup
  │   │   ├─ Cons → Limited customization, Firebase ecosystem
  │   │   └─ Best for → Mobile apps, quick MVPs, Google ecosystem
  │   ├─ Supabase Auth [weight: 8] [priority: medium] [risk: low]
  │   │   ├─ Pros → Open source, PostgreSQL-based, affordable
  │   │   ├─ Cons → Newer platform, smaller community
  │   │   └─ Best for → Modern web apps, Postgres users
  │   ├─ AWS Cognito [weight: 7] [priority: medium] [risk: medium]
  │   │   ├─ Pros → AWS integration, scalable, compliant
  │   │   ├─ Cons → Complex UI, AWS-only, poor DX
  │   │   └─ Best for → AWS-heavy infrastructure, enterprise
  │   └─ Clerk [weight: 9] [recommended] [priority: high] [risk: low]
  │       ├─ Pros → Beautiful UI, modern DX, comprehensive
  │       ├─ Cons → Newer, pricing tiers
  │       └─ Best for → Modern SaaS, B2C apps, Next.js
  ├─ Social Login Only [priority: low] [risk: medium]
  │   ├─ Google Sign-In [weight: 9] [recommended]
  │   │   → Most widely used, trusted, easy integration
  │   ├─ GitHub Sign-In [weight: 7]
  │   │   → Great for developer tools, tech-savvy users
  │   ├─ Microsoft Sign-In [weight: 6]
  │   │   → Best for enterprise, Office 365 users
  │   └─ Apple Sign-In [weight: 7]
  │       → Required for iOS apps, privacy-focused
  └─ [IF: serverless]
      ├─ Next-Auth (Auth.js) [weight: 10] [recommended] [risk: low]
      │   ├─ Pros → Framework-agnostic, free, flexible
      │   ├─ Cons → Self-managed database, security responsibility
      │   └─ Best for → Next.js, Svelte, SolidStart
      └─ Serverless Auth Services
          ├─ Cloudflare Access → Edge authentication
          ├─ AWS Lambda Authorizers → Custom auth logic
          └─ Vercel Auth → Integrated with Vercel platform
```

**Decision Factors:**

1. **Team Size & Expertise**
   - Small team → Managed service (Firebase, Clerk)
   - Large team → Self-hosted or Auth0

2. **Budget**
   - Limited → Supabase, Next-Auth, Firebase free tier
   - Medium → Auth0, Clerk
   - Enterprise → AWS Cognito, self-hosted

3. **Compliance Requirements**
   - HIPAA → AWS Cognito, Auth0 (enterprise)
   - GDPR → Any with proper configuration
   - SOC 2 → Auth0, AWS Cognito

4. **Scale**
   - < 1K users → Any option works
   - 1K-100K → Managed services
   - 100K+ → Auth0, AWS Cognito, or self-hosted

**Implementation Timeline:**

- **Fastest (1-2 days):** Firebase Auth, Clerk, Next-Auth
- **Fast (3-5 days):** Supabase, Social login only
- **Medium (1-2 weeks):** Auth0, AWS Cognito
- **Slow (3-4 weeks):** Self-hosted JWT/session

**Usage:**
```bash
# View full tree
reis tree show examples/decision-trees/real-world-auth.md

# Interactive selection
reis tree show examples/decision-trees/real-world-auth.md --interactive

# With serverless context
reis tree show examples/decision-trees/real-world-auth.md --context '{"serverless": true}'

# Record decision for project
reis tree show examples/decision-trees/real-world-auth.md --interactive
# (Select your choice, then confirm to record)

# View decision history
reis decisions list --tree "Choose Authentication Strategy"
```
