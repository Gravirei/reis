# CSS Styling Approach

## Decision Tree: CSS/Styling Solution

```
How should we handle styling in our application?
  ├─ Utility-First CSS [weight: 9] [priority: high] [risk: low] [recommended]
  │   ├─ Tailwind CSS [weight: 9] [recommended]
  │   │   ├─ Philosophy → Utility classes compose styles
  │   │   ├─ Features
  │   │   │   ├─ JIT compiler → On-demand CSS generation
  │   │   │   ├─ PurgeCSS → Tiny production bundles
  │   │   │   ├─ Plugin system → Extend with forms, typography
  │   │   │   ├─ Design tokens → Consistent spacing, colors
  │   │   │   └─ Dark mode → Built-in class-based toggle
  │   │   ├─ Best for
  │   │   │   ├─ Rapid development → No naming, fast iteration
  │   │   │   ├─ Design systems → Consistent constraints
  │   │   │   ├─ Component libraries → Reusable patterns
  │   │   │   └─ Teams → No CSS conflicts
  │   │   ├─ Advantages
  │   │   │   ├─ Small bundle size → Only used utilities
  │   │   │   ├─ No naming fatigue → No BEM/SMACSS needed
  │   │   │   ├─ Responsive → Mobile-first by default
  │   │   │   └─ Customizable → Config-driven
  │   │   └─ Learning Curve: Low (learn utilities)
  │   │
  │   ├─ UnoCSS [weight: 7]
  │   │   ├─ Features
  │   │   │   ├─ Faster than Tailwind → Instant build
  │   │   │   ├─ Fully customizable → Preset system
  │   │   │   └─ Attributify mode → class="text-red-500" vs red-500
  │   │   └─ Best for: Vite projects, performance-critical
  │   │
  │   └─ Tachyons [weight: 5]
  │       ├─ Features: Minimal, functional CSS
  │       └─ Status: Less active, consider Tailwind
  │
  ├─ CSS-in-JS [weight: 7] [priority: medium] [risk: medium]
  │   ├─ Styled Components [weight: 7]
  │   │   ├─ Philosophy → Component-scoped styles
  │   │   ├─ Features
  │   │   │   ├─ Tagged templates → CSS in JS files
  │   │   │   ├─ Dynamic styling → Props-based styles
  │   │   │   ├─ Theming → Context-based themes
  │   │   │   ├─ SSR support → Server-side rendering
  │   │   │   └─ Auto vendor prefixing → Browser compatibility
  │   │   ├─ Best for
  │   │   │   ├─ React apps → Component-based
  │   │   │   ├─ Dynamic themes → Runtime theme switching
  │   │   │   ├─ Complex logic → JS-powered styles
  │   │   │   └─ Styled ecosystem → Familiar to React devs
  │   │   ├─ Challenges
  │   │   │   ├─ Runtime overhead → Styles generated on client
  │   │   │   ├─ Bundle size → Includes runtime
  │   │   │   └─ SSR complexity → Requires setup
  │   │   └─ Learning Curve: Medium
  │   │
  │   ├─ Emotion [weight: 7]
  │   │   ├─ Features
  │   │   │   ├─ Framework agnostic → Works anywhere
  │   │   │   ├─ css prop → JSX-based styling
  │   │   │   ├─ Object styles → JavaScript objects
  │   │   │   └─ Source maps → Debug in DevTools
  │   │   ├─ Best for
  │   │   │   ├─ Flexibility → Multiple APIs
  │   │   │   ├─ Performance → Optimized runtime
  │   │   │   └─ Library authors → Framework agnostic
  │   │   └─ Similar to: Styled Components but more flexible
  │   │
  │   ├─ Vanilla Extract [weight: 8] [recommended]
  │   │   ├─ Philosophy → Zero-runtime CSS-in-JS
  │   │   ├─ Features
  │   │   │   ├─ Build-time extraction → No runtime cost
  │   │   │   ├─ Type-safe → TypeScript contracts
  │   │   │   ├─ Local scoping → No naming conflicts
  │   │   │   └─ Themes → Compile-time themes
  │   │   ├─ Best for
  │   │   │   ├─ Performance → Zero runtime overhead
  │   │   │   ├─ Type safety → Full TypeScript support
  │   │   │   └─ Modern builds → Vite, Next.js
  │   │   └─ New approach: Best of both worlds
  │   │
  │   └─ Linaria [weight: 6]
  │       ├─ Features: Zero-runtime, CSS extraction
  │       └─ Status: Less active community
  │
  ├─ CSS Modules [weight: 7] [priority: medium] [risk: low]
  │   ├─ Philosophy → Locally scoped CSS files
  │   ├─ Features
  │   │   ├─ File-based → .module.css files
  │   │   ├─ Auto-scoping → Unique class names
  │   │   ├─ Composition → @composes from other modules
  │   │   ├─ TypeScript → .d.ts generation
  │   │   └─ Zero runtime → Plain CSS
  │   ├─ Best for
  │   │   ├─ CSS familiarity → Write normal CSS
  │   │   ├─ Component isolation → No global conflicts
  │   │   ├─ Build tool support → Built into most bundlers
  │   │   └─ Migration → Gradual adoption
  │   ├─ Advantages
  │   │   ├─ No new syntax → Just CSS
  │   │   ├─ Small footprint → No library needed
  │   │   ├─ Cacheable → Standard CSS files
  │   │   └─ Fast → No runtime processing
  │   └─ Use with: Sass/SCSS for preprocessing
  │
  ├─ Preprocessors [weight: 6] [priority: low] [risk: low]
  │   ├─ Sass/SCSS [weight: 7]
  │   │   ├─ Features
  │   │   │   ├─ Variables → Reusable values
  │   │   │   ├─ Nesting → Scoped selectors
  │   │   │   ├─ Mixins → Reusable styles
  │   │   │   ├─ Functions → Custom utilities
  │   │   │   └─ Modules → @use imports
  │   │   ├─ Best for
  │   │   │   ├─ Complex stylesheets → Large-scale CSS
  │   │   │   ├─ Design systems → Token management
  │   │   │   └─ Legacy projects → Already using Sass
  │   │   └─ Use with: CSS Modules for scoping
  │   │
  │   ├─ Less [weight: 5]
  │   │   ├─ Features: Similar to Sass
  │   │   └─ Status: Less popular than Sass
  │   │
  │   └─ PostCSS [weight: 7]
  │       ├─ Not a preprocessor → CSS transformation tool
  │       ├─ Features
  │       │   ├─ Autoprefixer → Browser compatibility
  │       │   ├─ CSS nesting → Native CSS nesting
  │       │   ├─ Custom properties → CSS variables
  │       │   └─ Plugin ecosystem → Extensible
  │       └─ Use with: Any approach (Tailwind uses it)
  │
  ├─ Component Libraries [weight: 8] [priority: medium] [risk: low]
  │   ├─ Material UI (MUI) [weight: 8]
  │   │   ├─ Design: Material Design by Google
  │   │   ├─ Features: Comprehensive components, themes
  │   │   └─ Best for: Quick MVP, Material Design apps
  │   ├─ Chakra UI [weight: 9] [recommended]
  │   │   ├─ Design: Modern, accessible
  │   │   ├─ Features: Composable, theme tokens, dark mode
  │   │   └─ Best for: Custom designs, accessibility
  │   ├─ Ant Design [weight: 7]
  │   │   ├─ Design: Enterprise-focused
  │   │   └─ Best for: Admin panels, dashboards
  │   ├─ Radix UI [weight: 8]
  │   │   ├─ Unstyled primitives → Bring your own styles
  │   │   ├─ Best for: Custom design systems
  │   │   └─ Use with: Tailwind or CSS Modules
  │   └─ shadcn/ui [weight: 9]
  │       ├─ Copy-paste components → Not an npm package
  │       ├─ Built on: Radix + Tailwind
  │       └─ Best for: Full control, customization
  │
  └─ Plain CSS [weight: 5] [priority: low] [risk: low]
      ├─ Modern CSS Features
      │   ├─ CSS Variables → Custom properties
      │   ├─ CSS Grid → Layout system
      │   ├─ Container Queries → Responsive components
      │   └─ :has() selector → Parent selection
      ├─ Methodologies
      │   ├─ BEM → Block Element Modifier naming
      │   ├─ SMACSS → Scalable CSS architecture
      │   └─ ITCSS → Inverted triangle CSS
      └─ Best for
          ├─ Small projects → No build step needed
          ├─ Learning → Understand fundamentals
          └─ Static sites → Simple needs
```

## Context

Styling choice depends on:
- Team CSS expertise
- Project complexity
- Performance requirements
- Design system needs
- Maintenance considerations

## Recommendations

**Tailwind CSS is recommended** for most projects because:
- Fastest development speed
- Smallest production bundles (with PurgeCSS)
- No naming conventions needed
- Built-in design system
- Great documentation and community

**Use CSS Modules** if:
- Team prefers writing traditional CSS
- Migrating from plain CSS
- Want zero runtime overhead
- Need gradual adoption

**Use Vanilla Extract** if:
- Want CSS-in-JS benefits without runtime cost
- TypeScript is a priority
- Performance is critical

**Use Component Library** if:
- Need to ship quickly
- Don't have a designer
- Want consistent UI patterns
- Building admin/dashboard

## Decision Matrix

| Approach | Learning Curve | Bundle Size | DX | Performance |
|----------|---------------|-------------|-----|-------------|
| Tailwind | Low | Small | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| CSS Modules | Very Low | Small | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Styled Components | Medium | Medium | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Vanilla Extract | Medium | Small | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Component Library | Low | Large | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Plain CSS | Very Low | Small | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Tailwind Example

```jsx
// Button component with Tailwind
<button className="
  px-4 py-2 
  bg-blue-500 hover:bg-blue-600 
  text-white font-semibold 
  rounded-lg shadow-md 
  transition duration-200
">
  Click me
</button>
```

## CSS Modules Example

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border-radius: 0.5rem;
}
```

```jsx
// Button.jsx
import styles from './Button.module.css';

<button className={styles.button}>Click me</button>
```

## Implementation Checklist

- [ ] Choose styling approach
- [ ] Set up build configuration
- [ ] Define design tokens (colors, spacing)
- [ ] Create component examples
- [ ] Set up dark mode (if needed)
- [ ] Configure responsive breakpoints
- [ ] Add CSS reset/normalize
- [ ] Document styling guidelines
- [ ] Set up Storybook (optional)
- [ ] Test across browsers
- [ ] Optimize for production
- [ ] Measure bundle size

## Common Pitfalls

❌ **Using multiple approaches** → Inconsistent codebase
✅ **Pick one and stick to it** → Consistent patterns

❌ **Not using design tokens** → Inconsistent spacing/colors
✅ **Define tokens upfront** → Consistent design

❌ **Inline styles everywhere** → Hard to maintain
✅ **Use proper styling solution** → Reusable patterns

❌ **Over-abstracting early** → Premature optimization
✅ **Start simple, refactor later** → Pragmatic approach
