# Verification Patterns

## Overview

This guide covers patterns for detecting incomplete implementations, stub code, and integration issues in REIS workflows. These patterns help ensure that planned features are actually implemented, not just scaffolded.

**Key Concepts:**
- **Stub Detection** - Finding placeholder code that needs implementation
- **Wiring Verification** - Ensuring modules connect correctly
- **Integration Checks** - Validating end-to-end functionality

## Stub Detection Patterns

### Code-Level Stubs

Common patterns that indicate incomplete implementation:

| Pattern | Example | Detection Method |
|---------|---------|------------------|
| TODO comments | `// TODO: implement this` | grep for TODO, FIXME, XXX |
| Throw not implemented | `throw new Error('Not implemented')` | AST search for throw statements |
| Empty function bodies | `function validate() {}` | Check function body length |
| Placeholder returns | `return null; // placeholder` | Return statement analysis |
| Console placeholders | `console.log('TODO: implement')` | grep for console in production |
| Pass statements | `pass  # Python placeholder` | grep for bare pass statements |

### Detection Commands

```bash
# Find TODO/FIXME/XXX comments
grep -rn "TODO\|FIXME\|XXX" src/ --include="*.ts" --include="*.js"

# Find "not implemented" throws
grep -rn "Not implemented\|NotImplemented\|TODO" src/ --include="*.ts"

# Find empty function bodies (JavaScript/TypeScript)
grep -Pzo "function\s+\w+\s*\([^)]*\)\s*\{\s*\}" src/

# Find placeholder returns
grep -rn "return null.*placeholder\|return undefined.*TODO" src/
```

### File-Level Stubs

Signs of incomplete files:

| Indicator | Detection | Threshold |
|-----------|-----------|-----------|
| Minimal content | Line count | < 10 lines |
| Export-only files | No implementation | Only exports |
| Empty test files | No assertions | 0 expect/assert calls |
| Scaffold comments | Template markers | "Add your code here" |

```bash
# Find small files (potential stubs)
find src/ -name "*.ts" -exec wc -l {} \; | awk '$1 < 10 {print}'

# Find test files without assertions
for f in $(find test/ -name "*.test.ts"); do
  if ! grep -q "expect\|assert" "$f"; then
    echo "No assertions: $f"
  fi
done

# Find files with only exports
grep -l "^export" src/*.ts | while read f; do
  if [ $(grep -v "^export\|^import\|^$\|^//" "$f" | wc -l) -lt 3 ]; then
    echo "Export-only: $f"
  fi
done
```

### Integration Stubs

API and service-level placeholders:

| Pattern | Example | Impact |
|---------|---------|--------|
| 501 responses | `res.status(501).send('Not implemented')` | Broken endpoints |
| Mock data returns | `return MOCK_USERS;` | Fake functionality |
| Commented service calls | `// await emailService.send()` | Missing integration |
| Hardcoded values | `return 'TODO_TOKEN';` | Security/functionality issues |

```bash
# Find 501 Not Implemented responses
grep -rn "501\|Not Implemented" src/api/ src/routes/

# Find mock data patterns
grep -rn "MOCK_\|mockData\|fakeData\|testData" src/ --include="*.ts"

# Find commented-out service calls
grep -rn "// await\|// fetch\|// axios" src/
```

## Wiring Verification

### Import/Export Checks

Ensure modules are properly connected:

```bash
# Find exports without imports (unused code)
for export in $(grep -rh "export.*function\|export.*class\|export.*const" src/ | \
  sed 's/export.*\(function\|class\|const\) \(\w\+\).*/\2/'); do
  if ! grep -rq "import.*$export\|require.*$export" src/; then
    echo "Unused export: $export"
  fi
done

# Find imports from non-existent files
grep -rh "from '\./\|from '\.\.\/" src/ | while read line; do
  path=$(echo "$line" | sed "s/.*from '\([^']*\)'.*/\1/")
  # Check if file exists (with .ts/.js extension)
  if [ ! -f "src/${path}.ts" ] && [ ! -f "src/${path}.js" ]; then
    echo "Missing import: $path"
  fi
done
```

### API Contract Verification

Validate request/response schemas:

```typescript
// Example: Verify API contracts match
import { validateSchema } from './utils/schema';

describe('API Contract Verification', () => {
  it('should match request schema', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' })
    });
    
    const data = await response.json();
    expect(validateSchema(data, UserResponseSchema)).toBe(true);
  });
});
```

### Configuration Consistency

Check for configuration mismatches:

```bash
# Find env vars referenced but not in .env.example
grep -roh "process\.env\.\w\+" src/ | sort -u | while read env; do
  var=$(echo "$env" | sed 's/process.env.//')
  if ! grep -q "^$var=" .env.example 2>/dev/null; then
    echo "Missing from .env.example: $var"
  fi
done

# Find feature flags without implementation
grep -rh "FEATURE_\|feature\." src/config/ | while read flag; do
  flagName=$(echo "$flag" | grep -o "FEATURE_\w\+\|feature\.\w\+")
  if ! grep -rq "$flagName" src/ --exclude-dir=config; then
    echo "Unused feature flag: $flagName"
  fi
done
```

## Verification Automation

### Pre-commit Hooks

Block commits with incomplete code:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for TODO in staged files
if git diff --cached --name-only | xargs grep -l "TODO\|FIXME" 2>/dev/null; then
  echo "❌ Commit blocked: TODO/FIXME found in staged files"
  echo "   Remove or resolve these before committing."
  exit 1
fi

# Check for stub patterns
if git diff --cached | grep -E "Not implemented|throw.*TODO|return null.*placeholder"; then
  echo "❌ Commit blocked: Stub patterns detected"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

### CI Integration

Add stub detection to CI pipeline:

```yaml
# .github/workflows/verify.yml
name: Verification

on: [push, pull_request]

jobs:
  stub-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check for TODO/FIXME
        run: |
          if grep -rn "TODO\|FIXME" src/; then
            echo "::warning::TODO/FIXME comments found"
          fi
      
      - name: Check for stub patterns
        run: |
          if grep -rn "Not implemented\|throw.*Error.*TODO" src/; then
            echo "::error::Stub patterns found - implementation incomplete"
            exit 1
          fi
      
      - name: Verify test coverage
        run: |
          npm test -- --coverage
          # Fail if coverage below threshold
```

### REIS Verifier Integration

The `reis_verifier` subagent automatically performs stub detection:

```bash
# Run verification with stub detection
reis verify --strict

# Output includes:
# - File existence checks
# - Stub pattern detection
# - Test coverage analysis
# - Feature completeness (FR4.1)
```

## Handling False Positives

### Intentional Placeholders

Some stubs are intentional:

| Type | Example | How to Mark |
|------|---------|-------------|
| Abstract methods | Base class methods for override | `// @abstract` |
| Future features | Planned but not this phase | `// STUB:planned-v2` |
| Deprecation stubs | Backward compatibility | `// @deprecated` |
| Test fixtures | Intentional mock data | Place in `__fixtures__/` |

### Marker Convention

Use markers to distinguish intentional stubs:

```typescript
// Intentional stub - will be overridden by subclass
// STUB:intentional - Abstract base method
protected abstract validate(): boolean;

// Planned for future release
// STUB:planned-v2.1 - Advanced filtering
function advancedFilter() {
  throw new Error('Planned for v2.1');
}

// Deprecation stub - maintained for backward compatibility
// @deprecated Use newMethod() instead
function oldMethod() {
  console.warn('oldMethod is deprecated');
  return newMethod();
}
```

### Excluding from Detection

Configure stub detection to skip intentional stubs:

```javascript
// reis.config.js
module.exports = {
  verification: {
    stubDetection: {
      // Patterns to ignore
      ignorePatterns: [
        'STUB:intentional',
        'STUB:planned',
        '@abstract',
        '@deprecated'
      ],
      // Directories to skip
      ignorePaths: [
        '__fixtures__',
        '__mocks__',
        'test/helpers'
      ]
    }
  }
};
```

## Examples

### Good: Complete Verification Output

```
┌─────────────────────────────────────────────────────────────┐
│                   VERIFICATION REPORT                        │
├─────────────────────────────────────────────────────────────┤
│ Status: ✅ PASS                                              │
│ Completion: 100% (5/5 tasks)                                │
├─────────────────────────────────────────────────────────────┤
│ Stub Detection:                                             │
│   ├ TODO comments: 0 found                                  │
│   ├ Empty functions: 0 found                                │
│   ├ Placeholder returns: 0 found                            │
│   └ Not implemented throws: 0 found                         │
├─────────────────────────────────────────────────────────────┤
│ Wiring Verification:                                        │
│   ├ Unused exports: 0                                       │
│   ├ Missing imports: 0                                      │
│   └ Config consistency: ✅                                  │
├─────────────────────────────────────────────────────────────┤
│ Test Results:                                               │
│   ├ Tests: 45 passed, 0 failed                              │
│   └ Coverage: 87% (threshold: 80%)                          │
└─────────────────────────────────────────────────────────────┘
```

### Bad: Incomplete Detection

```
┌─────────────────────────────────────────────────────────────┐
│                   VERIFICATION REPORT                        │
├─────────────────────────────────────────────────────────────┤
│ Status: ❌ FAIL                                              │
│ Completion: 60% (3/5 tasks)                                 │
├─────────────────────────────────────────────────────────────┤
│ Stub Detection:                                             │
│   ├ TODO comments: 3 found                                  │
│   │   └ src/auth/password-reset.ts:15                       │
│   │   └ src/api/users.ts:45                                 │
│   │   └ src/services/email.ts:22                            │
│   ├ Empty functions: 1 found                                │
│   │   └ src/utils/validate.ts:validateEmail()               │
│   └ Not implemented throws: 2 found                         │
│       └ src/auth/password-reset.ts:sendResetEmail()         │
│       └ src/services/email.ts:sendEmail()                   │
├─────────────────────────────────────────────────────────────┤
│ Missing Deliverables:                                       │
│   ├ ❌ src/auth/password-reset.ts - INCOMPLETE              │
│   └ ❌ src/services/email.ts - INCOMPLETE                   │
├─────────────────────────────────────────────────────────────┤
│ Recommended Actions:                                        │
│   1. Implement sendResetEmail() in password-reset.ts        │
│   2. Implement sendEmail() in email.ts                      │
│   3. Remove TODO comments after implementation              │
└─────────────────────────────────────────────────────────────┘
```

## Quick Reference

### Detection Commands Cheatsheet

```bash
# All stub patterns in one command
grep -rn \
  -e "TODO\|FIXME\|XXX" \
  -e "Not implemented" \
  -e "throw.*Error.*implement" \
  -e "return null.*placeholder" \
  src/ --include="*.ts" --include="*.js"

# Verification summary
echo "=== Stub Detection Summary ==="
echo "TODOs: $(grep -rc 'TODO' src/ | awk -F: '{s+=$2} END {print s}')"
echo "FIXMEs: $(grep -rc 'FIXME' src/ | awk -F: '{s+=$2} END {print s}')"
echo "Not Implemented: $(grep -rc 'Not implemented' src/ | awk -F: '{s+=$2} END {print s}')"
```

### Verification Checklist

- [ ] No TODO/FIXME in production code
- [ ] No empty function bodies
- [ ] No placeholder returns
- [ ] No "not implemented" throws
- [ ] All exports are imported somewhere
- [ ] All imports resolve to existing files
- [ ] All env vars documented in .env.example
- [ ] Test coverage meets threshold
- [ ] All planned features have implementations

---

*Reference documentation for REIS verification patterns. See also: [VERIFICATION.md](VERIFICATION.md), [QUALITY_GATES.md](QUALITY_GATES.md)*
