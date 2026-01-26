# 🛡️ Quality Gates

Quality Gates are automated checks that run before phase completion to ensure your code meets security, quality, performance, and accessibility standards.

## Quick Start

```bash
# Run all configured gates
reis gate

# Run specific category
reis gate security
reis gate quality

# Show configuration status
reis gate status

# Generate detailed report
reis gate report --format markdown
```

## Features

- **🔒 Security Gates**: Vulnerability scanning, secrets detection, license compliance
- **📊 Quality Gates**: Code coverage, lint errors, complexity analysis, documentation
- **⚡ Performance Gates**: Bundle size limits, build time tracking, dependency analysis
- **♿ Accessibility Gates**: WCAG compliance, image alt text, form labels, ARIA usage

## Configuration

Configure gates in your `reis.config.js`:

```javascript
module.exports = {
  gates: {
    enabled: true,
    blockOnFail: true,      // Block phase completion on gate failure
    timeout: 30000,         // Gate timeout in milliseconds

    security: {
      enabled: true,
      vulnerabilities: {
        enabled: true,
        failOn: 'high',     // 'critical' | 'high' | 'moderate' | 'low'
        allowedAdvisories: []  // Advisory IDs to ignore
      },
      secrets: {
        enabled: true,
        allowedFiles: ['.env.example', '.env.sample']
      },
      licenses: {
        enabled: true,
        allowed: ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'],
        forbidden: ['GPL-3.0', 'AGPL-3.0']
      }
    },

    quality: {
      enabled: true,
      coverage: {
        enabled: false,     // Enable if you have coverage reports
        minimum: 80,        // Target coverage percentage
        failOn: 60          // Fail if below this
      },
      lint: {
        enabled: true,
        failOnError: true,
        failOnWarning: false
      },
      complexity: {
        enabled: false,
        maxCyclomaticComplexity: 10
      },
      documentation: {
        enabled: false,
        minimumCoverage: 50
      }
    },

    performance: {
      enabled: false,       // Opt-in
      bundleSize: {
        enabled: true,
        maxSize: '500kb',
        warnSize: '400kb'
      },
      dependencies: {
        enabled: true
      }
    },

    accessibility: {
      enabled: false,       // Opt-in
      wcagLevel: 'AA',      // 'A' | 'AA' | 'AAA'
      failOn: 'serious'     // 'critical' | 'serious' | 'moderate' | 'minor'
    }
  }
};
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `reis gate` | Run all configured gates |
| `reis gate check` | Same as above |
| `reis gate security` | Run security gates only |
| `reis gate quality` | Run quality gates only |
| `reis gate performance` | Run performance gates only |
| `reis gate accessibility` | Run accessibility gates only |
| `reis gate status` | Show gate configuration |
| `reis gate report` | Generate detailed report file |

### Options

| Option | Description |
|--------|-------------|
| `--verbose`, `-v` | Show detailed check output |
| `--format <fmt>` | Output format: `ascii` (default), `json`, `markdown` |
| `--output <file>` | Output file for report command |

## Gate Report

When you run `reis gate`, you'll see a beautiful report:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🛡️  QUALITY GATE REPORT                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SECURITY                                            ✅ PASSED          │
│  ├─ Vulnerabilities    ✅ No high/critical vulnerabilities             │
│  ├─ Secrets Detection  ✅ No hardcoded secrets detected                │
│  └─ License Compliance ✅ All licenses compliant                       │
│                                                                         │
│  QUALITY                                             ⚠️  WARNING        │
│  ├─ Code Coverage      ⏭️  Skipped (disabled)                          │
│  ├─ Lint Errors        ✅ No lint errors                               │
│  ├─ Code Complexity    ⚠️  2 functions may need refactoring            │
│  └─ Documentation      ⏭️  Skipped (disabled)                          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  Overall: ⚠️  WARNING - PASSED WITH WARNINGS                           │
│  Gate checks: 4 passed, 1 warning, 0 failed, 2 skipped                 │
│  Duration: 2.34s                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Gates

### Vulnerabilities
Runs `npm audit` to check for known vulnerabilities in dependencies.

- Configurable severity threshold (`failOn`)
- Ability to allowlist specific advisories
- Shows vulnerability counts by severity

### Secrets Detection
Scans source files for hardcoded secrets, API keys, and tokens.

**Detected Patterns:**
- API keys and tokens
- AWS access keys
- GitHub tokens
- JWT tokens
- Database connection strings
- Passwords in code

**Excluded by Default:**
- `node_modules/`
- `.git/`
- `.env` files (except `.env.example`)
- Test files

### License Compliance
Checks that all dependencies use approved licenses.

**Default Allowed Licenses:**
- MIT
- Apache-2.0
- BSD-3-Clause
- BSD-2-Clause
- ISC
- 0BSD
- Unlicense

## Quality Gates

### Code Coverage
Checks test coverage against minimum thresholds.

**Requirements:**
- Run tests with coverage first (`npm test -- --coverage`)
- Coverage report in `coverage/` directory

### Lint Errors
Runs ESLint to check for code quality issues.

**Requirements:**
- ESLint configured (`.eslintrc.*` or `eslint.config.js`)

### Code Complexity
Analyzes code for high complexity functions.

**Metrics:**
- Nesting depth (proxy for cyclomatic complexity)
- Function length

### Documentation
Checks JSDoc coverage for exported functions.

## Performance Gates

### Bundle Size
Checks build output size against limits.

**Requirements:**
- Build output in `dist/`, `build/`, or `.next/`

### Dependencies
Analyzes dependency count and identifies potentially heavy packages.

**Flagged Packages:**
- `moment` → Consider `date-fns` or `dayjs`
- `lodash` → Consider `lodash-es` or individual imports

## Accessibility Gates

### Checks Performed
- **Image Alt Text**: Ensures all images have alt attributes
- **Form Labels**: Checks form inputs have associated labels
- **Heading Structure**: Validates heading hierarchy (h1-h6)
- **ARIA Usage**: Analyzes ARIA attribute usage
- **Color Contrast**: Flags potential contrast issues

**Requirements:**
- JSX/TSX, HTML, Vue, or Svelte files

## Integration with Verification

Gates can automatically run during the verification step:

```javascript
// reis.config.js
module.exports = {
  gates: {
    enabled: true,
    runOn: ['verify'],      // Run gates during reis verify
    blockOnFail: true       // Fail verification if gates fail
  }
};
```

## Cycle Integration

### Automatic Gates in Cycle

Quality gates run automatically as part of the REIS cycle after successful verification:

```
PLAN → EXECUTE → VERIFY → GATE → DEBUG (if needed)
```

The gate phase ensures code quality before marking a phase complete.

### Configuration

```javascript
// reis.config.js
module.exports = {
  gates: {
    enabled: true,
    runOn: ['cycle'],      // Auto-run in cycle
    blockOnFail: true,     // Fail cycle if gates fail
    blockOnWarning: false  // Continue on warnings
  }
};
```

### CLI Options

| Flag | Description |
|------|-------------|
| `--skip-gates` | Skip gate phase entirely |
| `--gate-only <cat>` | Run only specific category |
| `--with-gates` | Force gates in verify command |

### Gate Failures in Cycle

When gates fail during a cycle:

1. Cycle enters DEBUG phase
2. Issues are prefixed with `[GATE:category]` (e.g., `[GATE:security]`)
3. Debug recommendations focus on the specific gate category
4. Fix and resume with `reis cycle --resume`

**Example output:**
```
❌ Gate check failed

[GATE:security] 2 high vulnerabilities found
  - lodash@4.17.15 - Prototype Pollution (CVE-2020-8203)
  - minimist@1.2.5 - Prototype Pollution (CVE-2021-44906)

Entering debug phase...
```

### Skipping Gates

```bash
# Skip all gates
reis cycle 3 --skip-gates

# Run only security gates
reis cycle 3 --gate-only security

# Run only quality gates  
reis cycle 3 --gate-only quality
```

## Extending Gates

You can create custom gates by extending `BaseGate`:

```javascript
const { BaseGate, GateResult } = require('@gravirei/reis/lib/utils/gate-runner');

class CustomGate extends BaseGate {
  constructor(config) {
    super('custom', 'custom-category', config);
  }

  async run() {
    const result = new GateResult(this.name, this.category);
    
    // Your custom checks here
    const issues = await this.performChecks();
    
    if (issues.length > 0) {
      result.fail('Custom checks failed', issues);
    } else {
      result.pass('All custom checks passed');
    }
    
    return result;
  }
}
```

## Best Practices

1. **Start with Security**: Enable security gates first, they're low-noise
2. **Gradual Adoption**: Enable one category at a time
3. **Tune Thresholds**: Adjust based on your project's needs
4. **CI Integration**: Run gates in CI pipeline
5. **Fix, Don't Ignore**: Address issues rather than disabling checks

## Troubleshooting

### "npm audit not available"
Ensure you have npm 6+ installed and run `npm install` first.

### "ESLint not found"
Install ESLint: `npm install --save-dev eslint`

### "No coverage report found"
Run tests with coverage: `npm test -- --coverage`

### Gates taking too long
Increase timeout in config or disable slow checks.

---

**See Also:**
- [Configuration Guide](CONFIG_GUIDE.md)
- [Verification](VERIFICATION.md)
- [Parallel Execution](PARALLEL_EXECUTION.md)
