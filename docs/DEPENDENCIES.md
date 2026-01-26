# REIS Dependency Strategy

> **Last Updated:** 2026-01-26  
> **Version:** 2.7.0

## Overview

REIS uses CommonJS module format for maximum compatibility with Node.js environments. This document explains our dependency versioning strategy.

## Current Dependencies

| Package | Version | Latest | Reason for Version |
|---------|---------|--------|-------------------|
| `chalk` | ^4.1.2 | 5.6.2 | Chalk 5+ is ESM-only |
| `commander` | ^11.1.0 | 14.0.2 | Commander 12+ requires Node 20+ |
| `inquirer` | ^8.2.6 | 13.2.1 | Inquirer 9+ is ESM-only |
| `mocha` | ^11.7.5 | 11.7.5 | Dev dependency (latest) |

## Why Not ESM?

REIS intentionally uses CommonJS (`require()`) instead of ESM (`import`) for several reasons:

1. **Broader Compatibility**: CommonJS works with all Node.js versions and build tools
2. **Simpler Installation**: No special configuration or `type: module` required
3. **Existing Ecosystem**: Many tools and scripts expect CommonJS
4. **Avoid Breaking Changes**: Migrating to ESM would require changes to:
   - All `require()` statements → `import`
   - All `module.exports` → `export`
   - package.json (`"type": "module"`)
   - Test configuration
   - User scripts that import REIS

## Version Pinning Strategy

### Production Dependencies (chalk, commander, inquirer)

We pin to the **last CommonJS-compatible major version** to ensure:
- ✅ CommonJS `require()` support
- ✅ Node.js 18+ compatibility
- ✅ Security patches within major version
- ✅ Stable API without breaking changes

### Development Dependencies (mocha)

We use the **latest version** since dev dependencies:
- Only affect development/testing
- Don't impact end users
- Can be updated freely

## Known Vulnerabilities

### Low Severity (Dev Dependencies Only)

| Package | Issue | Impact | Status |
|---------|-------|--------|--------|
| `diff` (mocha dep) | DoS in parsePatch | Dev only, not exploitable | Waiting for mocha fix |

These vulnerabilities:
- ❌ Do NOT affect production usage of REIS
- ❌ Do NOT affect end users
- ✅ Only affect development environment
- ✅ Will be fixed when upstream releases patches

## Future Migration Path

If we decide to migrate to ESM in the future (e.g., REIS v4.0):

1. **Phase 1**: Update package.json with `"type": "module"`
2. **Phase 2**: Convert all `require()` to `import`
3. **Phase 3**: Convert all `module.exports` to `export`
4. **Phase 4**: Update dependencies to latest versions
5. **Phase 5**: Update documentation and tests

This would be a **major version bump** (breaking change).

## Checking for Updates

```bash
# Check outdated packages
npm outdated

# Check for vulnerabilities
npm audit

# Update within version constraints
npm update
```

## Security Contact

If you discover a security vulnerability in REIS, please report it to:
- Email: security@gravirei.com
- GitHub: Create a private security advisory

---

*This document is maintained as part of the REIS codebase. See [CODEBASE_ANALYSIS_REPORT.md](../CODEBASE_ANALYSIS_REPORT.md) for the full analysis.*
