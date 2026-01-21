# Complex Decision Tree Example

Demonstrates deep nesting, metadata, and all advanced features.

## Decision Tree: Choose Your Tech Stack

```
What type of application are you building?
  ├─ Web Application [weight: 8] [priority: high]
  │   ├─ Static Site
  │   │   ├─ Next.js (SSG) [recommended] → SEO-friendly, fast
  │   │   ├─ Gatsby → GraphQL-powered, plugins
  │   │   └─ Astro → Island architecture, minimal JS
  │   ├─ Single Page App (SPA)
  │   │   ├─ React [weight: 9] → Popular, huge ecosystem
  │   │   ├─ Vue [weight: 7] → Gentle learning curve
  │   │   └─ Svelte [weight: 6] → Compiled, small size
  │   ├─ Server-Side Rendered (SSR)
  │   │   ├─ Next.js (SSR) [recommended] [priority: high]
  │   │   ├─ Remix → Modern routing, data loading
  │   │   └─ SvelteKit → Full-stack Svelte
  │   └─ Full-Stack Framework
  │       ├─ Next.js → React-based, Vercel-optimized
  │       ├─ Nuxt → Vue-based, modular
  │       └─ SolidStart → Solid.js-based, reactive
  ├─ Mobile Application [weight: 7] [priority: medium]
  │   ├─ Native Development
  │   │   ├─ Swift (iOS) [risk: high] → Best performance, iOS only
  │   │   ├─ Kotlin (Android) [risk: high] → Best performance, Android only
  │   │   └─ Both (Separate codebases) [risk: high] → Double development cost
  │   ├─ Cross-Platform
  │   │   ├─ React Native [recommended] [weight: 9] → JavaScript, large community
  │   │   ├─ Flutter [weight: 8] → Dart, beautiful UI
  │   │   ├─ Ionic [weight: 6] → Web tech, hybrid
  │   │   └─ Xamarin [weight: 5] → C#, legacy
  │   └─ Progressive Web App (PWA)
  │       └─ Any web framework + PWA features → Web-based, limited native access
  ├─ Desktop Application [weight: 5] [priority: low]
  │   ├─ Electron [weight: 8] → JavaScript, cross-platform, large bundle
  │   ├─ Tauri [recommended] [weight: 7] → Rust, smaller bundle, modern
  │   ├─ Qt → C++, native performance
  │   └─ .NET MAUI → C#, Windows-first
  └─ Backend/API [weight: 9] [priority: high]
      ├─ Node.js Frameworks
      │   ├─ Express [weight: 8] → Minimal, flexible
      │   ├─ Fastify [weight: 7] → Fast, low overhead
      │   ├─ NestJS [recommended] [weight: 9] → TypeScript, structured
      │   └─ Hono → Edge-first, ultra-fast
      ├─ Python Frameworks
      │   ├─ Django [weight: 8] → Batteries-included, ORM
      │   ├─ FastAPI [recommended] [weight: 9] → Modern, async, OpenAPI
      │   └─ Flask [weight: 6] → Lightweight, flexible
      ├─ Go Frameworks
      │   ├─ Gin [weight: 8] → Fast, minimalist
      │   ├─ Fiber [weight: 7] → Express-like API
      │   └─ Echo [weight: 7] → High performance
      └─ Rust Frameworks
          ├─ Axum [recommended] [weight: 8] → Tokio-based, type-safe
          ├─ Actix Web [weight: 7] → Fast, actor-based
          └─ Rocket [weight: 6] → Ergonomic, type-safe
```

**Expected Output:**
- 4 top-level categories (Web, Mobile, Desktop, Backend)
- 3-4 levels of nesting
- Metadata on most options (weight, priority, risk)
- [recommended] badges on best choices
- Comprehensive coverage of modern tech stack options

**Features Demonstrated:**
- Deep nesting (4 levels)
- All metadata types (weight, priority, risk, recommended)
- Multiple branches at each level
- Outcome descriptions with technical details
- Real-world decision-making scenario

**Usage:**
```bash
# View full tree
reis tree show examples/decision-trees/complex-tree.md

# View with depth limit
reis tree show examples/decision-trees/complex-tree.md --depth 2

# Interactive selection
reis tree show examples/decision-trees/complex-tree.md --interactive

# Export to HTML
reis tree export examples/decision-trees/complex-tree.md --format html
```
