# Model Profiles for REIS

## Overview

REIS supports different execution profiles to balance quality, speed, and cost. Choose the right profile for your task to optimize your development workflow.

**Key Concepts:**
- **Profiles** define preset configurations for execution behavior
- **Quality** prioritizes thoroughness over speed
- **Balanced** provides optimal default behavior
- **Budget** prioritizes speed for non-critical work

## Available Profiles

### Quality Profile

**Use for:** Critical features, complex logic, production releases

| Setting | Value |
|---------|-------|
| Research depth | Comprehensive |
| Verification | Strict (all checks) |
| Review cycles | 2-3 iterations |
| Testing | Full coverage required |
| Stub detection | Strict |
| Documentation | Required |

**When to use:**
- Production deployments
- Security-sensitive code
- Complex algorithms
- Public APIs
- Financial calculations
- Authentication/authorization

**Trade-offs:**
- ⏱️ Slower execution (2-3x balanced)
- ✅ More thorough analysis
- 💰 Higher cost (if using paid APIs)
- 🔒 Maximum reliability

**Example workflow:**
```bash
# Use quality profile for production auth module
reis execute 3 --profile quality

# Quality profile enables:
# - Deep code review
# - All verification checks
# - 90%+ coverage requirement
# - Security scanning
```

### Balanced Profile (Default)

**Use for:** Most development work

| Setting | Value |
|---------|-------|
| Research depth | Targeted |
| Verification | Standard checks |
| Review cycles | 1 iteration |
| Testing | Core paths covered |
| Stub detection | Standard |
| Documentation | Recommended |

**When to use:**
- Feature development
- Bug fixes
- Refactoring
- Internal tools
- Non-critical services
- Most day-to-day work

**Trade-offs:**
- ⏱️ Moderate execution time
- ✅ Good quality/speed balance
- 💰 Reasonable cost
- 🎯 Catches most issues

**Example workflow:**
```bash
# Default profile for feature work
reis execute 3

# Equivalent to:
reis execute 3 --profile balanced
```

### Budget Profile

**Use for:** Prototypes, spikes, non-critical work

| Setting | Value |
|---------|-------|
| Research depth | Minimal |
| Verification | Basic only |
| Review cycles | 0 (direct execution) |
| Testing | Optional |
| Stub detection | Off |
| Documentation | Optional |

**When to use:**
- Proof of concepts
- Throwaway prototypes
- Learning/exploration
- Documentation updates
- Quick scripts
- Internal experiments

**Trade-offs:**
- ⏱️ Fastest execution
- ⚠️ May miss edge cases
- 💰 Lowest cost
- 🔄 May need rework later

**Example workflow:**
```bash
# Quick prototype
reis execute 3 --profile budget

# Budget profile skips:
# - Deep verification
# - Coverage checks
# - Documentation requirements
```

## Configuration

### In reis.config.js

Set default profile and customize settings:

```javascript
// reis.config.js
module.exports = {
  // Default profile for all executions
  profile: 'balanced', // 'quality' | 'balanced' | 'budget'
  
  // Profile-specific overrides
  profiles: {
    quality: {
      research: {
        depth: 'comprehensive',
        timeout: 600,
        iterations: 3
      },
      verification: {
        strict: true,
        coverage: 90,
        stubDetection: 'strict',
        securityScan: true
      },
      review: {
        cycles: 2,
        checklistRequired: true
      },
      testing: {
        required: true,
        coverageThreshold: 90,
        integrationTests: true
      }
    },
    
    balanced: {
      research: {
        depth: 'targeted',
        timeout: 300,
        iterations: 1
      },
      verification: {
        strict: false,
        coverage: 80,
        stubDetection: 'standard',
        securityScan: false
      },
      review: {
        cycles: 1,
        checklistRequired: false
      },
      testing: {
        required: true,
        coverageThreshold: 80,
        integrationTests: false
      }
    },
    
    budget: {
      research: {
        depth: 'minimal',
        timeout: 120,
        iterations: 0
      },
      verification: {
        strict: false,
        coverage: 0,
        stubDetection: 'off',
        securityScan: false
      },
      review: {
        cycles: 0,
        checklistRequired: false
      },
      testing: {
        required: false,
        coverageThreshold: 0,
        integrationTests: false
      }
    }
  }
};
```

### Per-Command Override

Override profile for specific executions:

```bash
# Use quality profile for this execution
reis execute 3 --profile quality

# Use budget profile for quick task
reis execute 3 --profile budget

# Override specific setting
reis execute 3 --profile balanced --coverage 90

# Combine profile with other flags
reis execute 3 --profile quality --verbose --dry-run
```

### Environment Variable

Set profile via environment:

```bash
# Set default profile for session
export REIS_PROFILE=quality
reis execute 3  # Uses quality profile

# Override in command
REIS_PROFILE=budget reis execute 3
```

## Profile Selection Guide

### Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│                  Choose Your Profile                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Is this production-critical?                                │
│    YES → Quality Profile                                     │
│    NO  ↓                                                     │
│                                                              │
│  Does this handle sensitive data (auth, payments, PII)?      │
│    YES → Quality Profile                                     │
│    NO  ↓                                                     │
│                                                              │
│  Is this a throwaway/prototype?                              │
│    YES → Budget Profile                                      │
│    NO  ↓                                                     │
│                                                              │
│  Is this documentation-only or config changes?               │
│    YES → Budget Profile                                      │
│    NO  → Balanced Profile                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Quick Reference Table

| Scenario | Recommended Profile |
|----------|-------------------|
| Production API | Quality |
| Authentication | Quality |
| Payment processing | Quality |
| User data handling | Quality |
| Feature development | Balanced |
| Bug fixes | Balanced |
| Refactoring | Balanced |
| Internal tools | Balanced |
| Proof of concept | Budget |
| Learning/exploration | Budget |
| Documentation | Budget |
| Quick scripts | Budget |

## Subagent Behavior by Profile

### reis_planner

| Profile | Behavior |
|---------|----------|
| Quality | Detailed task breakdown, explicit verification steps, edge case coverage, documentation tasks |
| Balanced | Standard task breakdown, verification included |
| Budget | Minimal planning, combined tasks, skip optional steps |

**Example - Quality planning:**
```xml
<task type="auto">
<name>Implement password validation</name>
<files>src/auth/validation.ts, src/auth/__tests__/validation.test.ts</files>
<action>
Implement comprehensive password validation:
1. Minimum 8 characters
2. At least one uppercase
3. At least one lowercase
4. At least one number
5. At least one special character
6. No common passwords (check against list)
7. No user info in password

Include edge cases:
- Unicode characters
- Whitespace handling
- Maximum length
</action>
<verify>npm test -- validation && npm run lint</verify>
<done>All validation tests pass, 95%+ coverage</done>
</task>
```

**Example - Budget planning:**
```xml
<task type="auto">
<name>Add password validation</name>
<files>src/auth/validation.ts</files>
<action>Basic password validation (min 8 chars, mixed case, number)</action>
<verify>npm test</verify>
<done>Validation works</done>
</task>
```

### reis_executor

| Profile | Behavior |
|---------|----------|
| Quality | Thorough implementation, all edge cases, comprehensive error handling, detailed comments |
| Balanced | Core implementation, common edge cases, standard error handling |
| Budget | Minimal viable implementation, happy path focus |

### reis_verifier

| Profile | Behavior |
|---------|----------|
| Quality | All checks, strict thresholds, security scan, performance check |
| Balanced | Standard checks, moderate thresholds |
| Budget | Basic existence checks only, skip coverage |

**Verification checks by profile:**

| Check | Quality | Balanced | Budget |
|-------|---------|----------|--------|
| File existence | ✅ | ✅ | ✅ |
| Tests pass | ✅ | ✅ | ⚪ |
| Coverage threshold | 90% | 80% | Skip |
| Stub detection | Strict | Standard | Skip |
| Lint errors | ✅ | ✅ | ⚪ |
| Type errors | ✅ | ✅ | ⚪ |
| Security scan | ✅ | ⚪ | ⚪ |
| Performance check | ✅ | ⚪ | ⚪ |
| Documentation | ✅ | ⚪ | ⚪ |

### reis_debugger

| Profile | Behavior |
|---------|----------|
| Quality | Deep root cause analysis, comprehensive fix plan, regression prevention |
| Balanced | Standard analysis, targeted fixes |
| Budget | Quick fix suggestions, minimal analysis |

## Cost Optimization Strategies

### Progressive Profile Strategy

Start with budget, upgrade as needed:

```bash
# 1. Prototype with budget
reis execute 3 --profile budget

# 2. Refine with balanced
reis execute 3 --profile balanced

# 3. Finalize with quality
reis execute 3 --profile quality
```

### Selective Quality

Use quality only for critical paths:

```bash
# Budget for setup tasks
reis execute 1 --profile budget  # Project setup

# Balanced for features
reis execute 2 --profile balanced  # Core features

# Quality for auth
reis execute 3 --profile quality  # Authentication

# Budget for docs
reis execute 4 --profile budget  # Documentation
```

### Cache and Reuse

Profiles affect caching behavior:

```javascript
// reis.config.js
module.exports = {
  caching: {
    // Quality profile doesn't use cache (fresh analysis)
    quality: { useCache: false },
    
    // Balanced uses cache with validation
    balanced: { useCache: true, validateCache: true },
    
    // Budget uses cache aggressively
    budget: { useCache: true, validateCache: false }
  }
};
```

## Monitoring and Metrics

### Track Profile Usage

```bash
# View profile usage statistics
reis stats --profiles

# Example output:
# Profile Usage (last 30 days):
# ├─ quality:  12 executions (18%)
# ├─ balanced: 45 executions (67%)
# └─ budget:   10 executions (15%)
```

### Measure Effectiveness

| Metric | Quality | Balanced | Budget |
|--------|---------|----------|--------|
| Avg execution time | 45 min | 20 min | 8 min |
| Bug rate (post-deploy) | 2% | 8% | 25% |
| Rework rate | 5% | 15% | 40% |
| Coverage achieved | 92% | 83% | 45% |

### Profile Selection Analytics

```javascript
// reis.config.js
module.exports = {
  analytics: {
    trackProfiles: true,
    reportInterval: 'weekly',
    
    alerts: {
      // Alert if budget profile used for sensitive paths
      budgetOnSensitive: true,
      sensitivePaths: ['src/auth/', 'src/payment/']
    }
  }
};
```

## Best Practices

### Do's

✅ **Match profile to task criticality**
```bash
# Critical auth feature
reis execute auth-phase --profile quality

# Quick documentation fix
reis execute docs-phase --profile budget
```

✅ **Document profile choices in plans**
```markdown
## Execution Notes
- Phases 1-2: budget (setup, scaffolding)
- Phase 3: quality (authentication)
- Phase 4: balanced (features)
```

✅ **Review profile metrics regularly**
```bash
# Weekly review of profile effectiveness
reis stats --profiles --last-week
```

### Don'ts

❌ **Don't use budget for production code**
```bash
# Bad: Budget for user-facing feature
reis execute user-dashboard --profile budget
```

❌ **Don't use quality for everything**
```bash
# Bad: Quality for simple config change
reis execute update-readme --profile quality
```

❌ **Don't ignore profile warnings**
```bash
# Warning: Budget profile on sensitive path
# [!] src/auth/login.ts modified with budget profile
# Consider re-running with --profile quality
```

## Quick Reference

### Profile Comparison

| Aspect | Quality | Balanced | Budget |
|--------|---------|----------|--------|
| Speed | Slow | Medium | Fast |
| Thoroughness | High | Medium | Low |
| Cost | High | Medium | Low |
| Coverage req | 90% | 80% | None |
| Review cycles | 2-3 | 1 | 0 |
| Best for | Production | Features | Prototypes |

### Command Examples

```bash
# Quality for critical work
reis execute 3 --profile quality

# Balanced (default)
reis execute 3

# Budget for quick tasks
reis execute 3 --profile budget

# Check current profile
reis config show | grep profile

# Override single setting
reis execute 3 --profile balanced --coverage 90
```

---

*Model profile configuration for REIS. See also: [CONFIG_GUIDE.md](CONFIG_GUIDE.md), [VERIFICATION.md](VERIFICATION.md)*
