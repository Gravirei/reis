# [DRAFT] npm Publish Command Reference for v2.0.0-beta.1

Complete reference for publishing REIS v2.0.0-beta.1 to npm.

## ⚠️ WARNING

**DO NOT EXECUTE THESE COMMANDS YET**

This document is for reference. Actual publishing happens after:
1. Wave 3.3 manual testing completes
2. Pre-release checklist is 100% complete
3. Team sign-off obtained

## Prerequisites

### 1. Verify npm Login

```bash
# Check if logged in
npm whoami

# If not logged in, login now
npm login

# Verify organization access (if using @gravirei scope)
npm org ls gravirei
```

### 2. Verify Package State

```bash
# Check current version
npm view @gravirei/reis version

# Check all published versions
npm view @gravirei/reis versions

# Check current beta tag (if exists)
npm view @gravirei/reis@beta version
```

### 3. Verify Local State

```bash
# Clean working tree
git status

# Should show: "nothing to commit, working tree clean"

# Verify on correct branch
git branch --show-current

# Should show: "main" or "master"

# Verify version in package.json
grep '"version"' package.json

# Should show: "version": "2.0.0-beta.1"
```

## Pre-Publish Validation

### 1. Test Pack

```bash
# Dry run to see what will be included
npm pack --dry-run

# Expected output should include:
# - bin/reis.js
# - lib/commands/*.js
# - lib/utils/*.js
# - docs/*.md
# - examples/*/
# - subagents/*.md
# - templates/*.md
# - README.md, CHANGELOG.md, LICENSE

# Should NOT include:
# - test/
# - .planning/
# - .git/
# - node_modules/
```

### 2. Create Actual Tarball

```bash
# Create tarball
npm pack

# This creates: gravirei-reis-2.0.0-beta.1.tgz

# List contents
tar -tzf gravirei-reis-2.0.0-beta.1.tgz | head -50

# Verify structure looks correct
```

### 3. Test Tarball Installation

```bash
# Create test directory
mkdir -p /tmp/test-reis-beta
cd /tmp/test-reis-beta

# Install from tarball
npm install /path/to/gravirei-reis-2.0.0-beta.1.tgz

# Test installation
./node_modules/.bin/reis --version
# Should output: 2.0.0-beta.1

./node_modules/.bin/reis --help
# Should show help text

# Test basic commands
./node_modules/.bin/reis new test-project
cd test-project
../node_modules/.bin/reis config init

# Clean up
cd /tmp
rm -rf test-reis-beta
```

### 4. Audit Security

```bash
# Back to project directory
cd /path/to/reis

# Check for vulnerabilities (production only)
npm audit --production

# Should show: "found 0 vulnerabilities"

# If vulnerabilities found, fix before publishing
npm audit fix --production
```

## Publish Commands

### Option 1: Publish with Beta Tag (RECOMMENDED)

This publishes as a beta release, requiring users to explicitly install with `@beta`.

```bash
# Publish to npm with beta tag
npm publish --tag beta

# Users install with:
# npm install -g @gravirei/reis@beta
```

**Why beta tag:**
- Doesn't affect users who run `npm install @gravirei/reis` (they get latest stable)
- Requires opt-in for beta testing
- Safer for first beta release
- Can promote to latest later

### Option 2: Publish as Latest (NOT RECOMMENDED FOR BETA)

This makes v2.0.0-beta.1 the default installation. **Only use if you're very confident.**

```bash
# Publish as latest (NOT RECOMMENDED)
npm publish

# Users install with:
# npm install -g @gravirei/reis
# (gets beta by default)
```

**Why NOT recommended:**
- Existing users auto-upgrade to beta
- Higher risk of breaking user workflows
- Should only be used for stable releases

## Post-Publish Verification

### 1. Verify npm Registry

```bash
# Wait 2-5 minutes for npm to propagate

# Check version published
npm view @gravirei/reis@beta version
# Should output: 2.0.0-beta.1

# Check dist-tags
npm view @gravirei/reis dist-tags
# Should include: beta: '2.0.0-beta.1'

# Check full package info
npm view @gravirei/reis@beta

# Download tarball URL
npm view @gravirei/reis@beta dist.tarball
```

### 2. Test Installation from npm

```bash
# Uninstall local version (if installed)
npm uninstall -g @gravirei/reis

# Install from npm
npm install -g @gravirei/reis@beta

# Verify installation
which reis
# Should show global npm bin path

reis --version
# Should output: 2.0.0-beta.1

reis --help
# Should show help text

# Test basic workflow
cd /tmp
reis new test-beta-install
cd test-beta-install
reis config init
cat reis.config.js
```

### 3. Test npx Execution

```bash
# Test npx (doesn't require global install)
npx @gravirei/reis@beta --version
# Should output: 2.0.0-beta.1

npx @gravirei/reis@beta --help
# Should show help text
```

## Git Tagging

### Create Tag

```bash
# Create annotated tag
git tag -a v2.0.0-beta.1 -m "REIS v2.0.0-beta.1

Wave execution, checkpoints, configuration, metrics, visualization, and plan validation.

First beta release of v2.0 - fully backward compatible with v1.x.

See CHANGELOG.md for complete changes."

# Verify tag created
git tag -l v2.0.0-beta.1

# Show tag details
git show v2.0.0-beta.1

# Push tag to remote
git push origin v2.0.0-beta.1
```

### Verify Tag

```bash
# View on GitHub
# https://github.com/Gravirei/reis/releases/tag/v2.0.0-beta.1

# Clone elsewhere and verify tag
cd /tmp
git clone https://github.com/Gravirei/reis.git test-tag
cd test-tag
git checkout v2.0.0-beta.1
cat package.json | grep version
```

## GitHub Release

### Create Release

1. Go to: https://github.com/Gravirei/reis/releases/new
2. **Choose tag**: v2.0.0-beta.1
3. **Release title**: REIS v2.0.0-beta.1 - Wave Execution, Checkpoints & Visualization
4. **Description**: Copy from RELEASE_NOTES.md
5. **Checkboxes**:
   - ✅ Set as a pre-release (IMPORTANT!)
   - ❌ Set as latest release (unchecked for beta)
6. Click "Publish release"

### Verify Release

- Visit: https://github.com/Gravirei/reis/releases
- Verify v2.0.0-beta.1 shows "Pre-release" badge
- Verify release notes formatted correctly
- Verify download links work

## Rollback Procedures

### If Critical Bug Found Immediately (within 1 hour)

```bash
# Option 1: Unpublish (only works within 72 hours)
npm unpublish @gravirei/reis@2.0.0-beta.1

# WARNING: This breaks anyone who already installed
# Only use for critical security issues
```

### If Bug Found After Some Time (recommended approach)

```bash
# Option 2: Deprecate version
npm deprecate @gravirei/reis@2.0.0-beta.1 "Critical bug found in wave execution. Please use v1.2.3 or wait for v2.0.0-beta.2. See issue #123 for details."

# Users will see deprecation warning on install
# Existing installations continue working
# Gives you time to fix and release beta.2
```

### Publishing Fix

```bash
# Fix the bug
# Update package.json version to 2.0.0-beta.2
# Run tests
# Update CHANGELOG.md

# Publish new beta
npm publish --tag beta

# Update GitHub release notes
# Announce the fix
```

### Moving Beta Tag to New Version

```bash
# If you publish beta.2, the beta tag automatically updates
# But you can manually move it too:

npm dist-tag add @gravirei/reis@2.0.0-beta.2 beta

# Verify
npm view @gravirei/reis dist-tags
```

## Promoting Beta to Latest

After beta testing period (2-4 weeks), if all goes well:

```bash
# Remove -beta.1 suffix from version
# Update package.json to 2.0.0
# Update CHANGELOG.md

# Publish as latest
npm publish

# Or if already published as beta, move tag:
npm dist-tag add @gravirei/reis@2.0.0 latest

# Verify
npm view @gravirei/reis dist-tags
# Should show: latest: '2.0.0', beta: '2.0.0-beta.1'
```

## Post-Publish Announcements

### 1. Social Media

**Twitter/X:**
```
🎉 REIS v2.0.0-beta.1 is live!

🌊 Wave execution
💾 Checkpoints
⚙️ Config system
📊 Metrics
📈 Visualization

Install: npm install -g @gravirei/reis@beta

Docs: https://github.com/Gravirei/reis
Feedback welcome! 🚀

#REIS #DevTools #AI
```

**LinkedIn/Dev.to:**
- Post ANNOUNCEMENT.md (medium version)
- Include link to GitHub release
- Encourage feedback

### 2. GitHub

- Create discussion in Discussions tab
- Pin announcement issue
- Update README badge if needed

### 3. npm Package Page

- npm package page automatically updates
- Verify README displays correctly: https://www.npmjs.com/package/@gravirei/reis

## Monitoring Post-Publish

### Track Downloads

```bash
# Check download stats (after 24 hours)
npm info @gravirei/reis

# Or use: https://npm-stat.com/charts.html?package=@gravirei/reis
```

### Monitor Issues

- Watch GitHub issues: https://github.com/Gravirei/reis/issues
- Set up notifications for new issues
- Respond within 24 hours to beta feedback
- Label beta-related issues appropriately

### Collect Feedback

- Monitor Discussions: https://github.com/Gravirei/reis/discussions
- Check social media mentions
- Track user questions and pain points
- Document common issues for beta.2 or v2.0.0 stable

## Troubleshooting

### "npm publish" fails with authentication error

```bash
# Re-login
npm logout
npm login

# Verify
npm whoami

# Try again
npm publish --tag beta
```

### "npm publish" fails with version already exists

```bash
# Check existing versions
npm view @gravirei/reis versions

# If version exists, you have two options:

# Option 1: Increment version (recommended)
# Change package.json to 2.0.0-beta.2
npm publish --tag beta

# Option 2: Unpublish and republish (risky, avoid)
npm unpublish @gravirei/reis@2.0.0-beta.1
npm publish --tag beta
```

### Package size too large

```bash
# Check size
npm pack --dry-run | grep "package size"

# If too large (>5MB), check what's included:
npm pack
tar -tzf *.tgz

# Update .npmignore to exclude large files
# Verify test/, .planning/, etc. are excluded
```

### Git tag already exists

```bash
# Delete local tag
git tag -d v2.0.0-beta.1

# Delete remote tag
git push origin :refs/tags/v2.0.0-beta.1

# Recreate tag
git tag -a v2.0.0-beta.1 -m "..."
git push origin v2.0.0-beta.1
```

## Emergency Contacts

If something goes seriously wrong:

1. **Stop and assess** - Don't panic publish fixes
2. **Check npm status** - https://status.npmjs.org
3. **Review logs** - Check what actually happened
4. **Consider deprecate** - Safer than unpublish
5. **Communicate** - Tell users what's happening
6. **Fix properly** - Test fix thoroughly before beta.2

## Checklist Summary

Before running any command:

- [ ] Pre-release checklist 100% complete
- [ ] Team sign-off obtained
- [ ] Logged into npm
- [ ] Clean working tree
- [ ] All tests passing
- [ ] Tarball tested
- [ ] Security audit clean
- [ ] Announcements prepared
- [ ] Monitoring tools ready

**Only then**: Run `npm publish --tag beta`

---

*This is a DRAFT command reference. Use only after Wave 3.3 testing completes and pre-release checklist is signed off.*
