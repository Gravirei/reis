# REIS NPM Publishing Guide

**Package**: reis  
**Version**: 1.0.0  
**Status**: ✓ Ready for publication (pending user confirmation)

---

## Table of Contents

1. [Pre-Publishing Checklist](#pre-publishing-checklist)
2. [Package Name Availability](#package-name-availability)
3. [NPM Login](#npm-login)
4. [Publishing Process](#publishing-process)
5. [Post-Publish Verification](#post-publish-verification)
6. [Testing Published Package](#testing-published-package)
7. [Rollback Procedures](#rollback-procedures)
8. [Version Management](#version-management)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Publishing Checklist

Before publishing, verify all items in `.planning/PUBLISHING_CHECKLIST.md`:

### Quick Verification
```bash
# 1. Verify package structure
npm pack
tar -tzf reis-1.0.0.tgz | wc -l
# Should show 57 files

# 2. Test package locally
mkdir -p /tmp/reis-final-test
cd /tmp/reis-final-test
npm install /path/to/reis/reis-1.0.0.tgz
npx reis --version
# Should output: 1.0.0

# 3. Verify package.json
node -e "const p=require('./package.json'); console.log('✓ Name:', p.name, '\n✓ Version:', p.version, '\n✓ License:', p.license);"
```

### Critical Items
- ✅ All 29 commands tested and working
- ✅ 65 tests passed (100% pass rate)
- ✅ Documentation complete (8 files)
- ✅ Templates present (5 files)
- ✅ Subagents present (3 files)
- ✅ LICENSE exists (MIT)
- ✅ CHANGELOG.md exists
- ✅ .npmignore configured
- ✅ No temporary files in package

---

## Package Name Availability

### Current Status
The package name **"reis"** exists on NPM:
- **Version**: 0.0.0 (published April 2, 2017)
- **Author**: dgurkaynak
- **Status**: Appears to be a placeholder or abandoned package

### Options

#### Option A: Contact Current Owner (Recommended)
```bash
# Check package details
npm view reis

# Contact package owner to request transfer or deprecation
# Email can often be found in package metadata
npm view reis maintainers
```

**Steps:**
1. Reach out to dgurkaynak via GitHub or email
2. Explain your use case and request name transfer
3. If responsive, follow NPM's package name dispute process
4. If no response after 1-2 weeks, proceed to Option B

#### Option B: Use Scoped Package Name
If the original owner doesn't respond or declines:
```bash
# Update package.json
{
  "name": "@gravirei/reis",
  ...
}
```

**Installation would become:**
```bash
npx @gravirei/reis
```

**Pros**: Immediate availability, no conflicts  
**Cons**: Slightly longer command

#### Option C: Alternative Package Name
Consider alternatives:
- `reis-cli`
- `reis-dev`
- `reis-workflow`
- `roadmap-exec`

### Our Recommendation
**Try Option A first.** The current "reis" package is 8 years old at version 0.0.0, which suggests it may be abandoned. NPM support can help transfer abandoned package names.

---

## NPM Login

### First-Time Setup

1. **Create NPM Account** (if you don't have one):
   - Go to: https://www.npmjs.com/signup
   - Choose username, email, password
   - Verify email address

2. **Login via CLI**:
```bash
npm login
# Or: npm adduser (same thing)
```

You'll be prompted for:
- Username
- Password
- Email (this will be public)
- One-time password (if 2FA enabled)

3. **Verify Login**:
```bash
npm whoami
# Should output your NPM username
```

### Two-Factor Authentication (Recommended)

Enable 2FA for security:
```bash
npm profile enable-2fa auth-and-writes
```

When publishing with 2FA, you'll need to append OTP:
```bash
npm publish --otp=123456
```

---

## Publishing Process

### Step 1: Final Pre-Flight Checks

```bash
# Ensure you're in the project root
cd /home/gravirei/Documents/Projects/reis

# Verify you're logged in
npm whoami

# Check current version
npm version

# Verify git status (should be clean)
git status

# Review what will be published
npm pack --dry-run
```

### Step 2: Publish to NPM

**For first-time publication:**
```bash
npm publish --access public
```

**If you have 2FA enabled:**
```bash
npm publish --access public --otp=YOUR_OTP_CODE
```

**Expected Output:**
```
+ reis@1.0.0
```

### Step 3: Verify Publication

```bash
# Check package exists
npm view reis

# Check specific version
npm view reis version

# Get full package info
npm info reis

# View on web
# Visit: https://www.npmjs.com/package/reis
```

### Step 4: Create Git Tag

```bash
# Create version tag
git tag v1.0.0

# Push tag to remote
git push origin v1.0.0

# Or push all tags
git push --tags
```

---

## Post-Publish Verification

### Automated Verification Script

Create a temporary test script:
```bash
#!/bin/bash
# tmp_rovodev_verify_publish.sh

echo "🔍 Verifying REIS publication..."
echo ""

# Test 1: Package exists
echo "1. Checking package exists on NPM..."
npm view reis version || { echo "❌ Package not found"; exit 1; }
echo "✅ Package exists"
echo ""

# Test 2: Install in clean environment
echo "2. Testing installation in clean environment..."
cd /tmp
rm -rf reis-publish-test
mkdir reis-publish-test
cd reis-publish-test
npm install -g --prefix . reis
echo "✅ Installation successful"
echo ""

# Test 3: Test commands
echo "3. Testing commands..."
./bin/reis --version || { echo "❌ Version command failed"; exit 1; }
echo "✅ Version command works"
./bin/reis help | grep -q "REIS" || { echo "❌ Help command failed"; exit 1; }
echo "✅ Help command works"
echo ""

# Test 4: Check installed files
echo "4. Verifying file installation..."
./bin/reis new "Test" --ci
[ -d ~/.rovodev/reis ] || { echo "❌ Files not installed"; exit 1; }
echo "✅ Files installed to ~/.rovodev/reis/"
echo ""

echo "🎉 All verification checks passed!"
```

Run it:
```bash
chmod +x tmp_rovodev_verify_publish.sh
./tmp_rovodev_verify_publish.sh
```

### Manual Verification

```bash
# Test from fresh terminal in different directory
cd ~
npx reis@1.0.0 --version

# Test full installation
npx reis@1.0.0

# Confirm installation prompt appears
# Accept installation
# Verify files copied

# Test commands
npx reis help
npx reis new "Test Project"
npx reis --version
```

### Check Installed Files

```bash
# Documentation
ls -la ~/.rovodev/reis/
# Should show: 8 documentation files

# Templates
ls -la ~/.rovodev/reis/templates/
# Should show: 5 template files

# Subagents
ls -la ~/.rovodev/subagents/reis_*.md
# Should show: reis_planner.md, reis_executor.md, reis_project_mapper.md
```

---

## Testing Published Package

### Comprehensive Test Suite

```bash
# Create test directory
mkdir -p /tmp/reis-user-test
cd /tmp/reis-user-test

# Test 1: Installation
echo "Test 1: Installation"
npx reis@1.0.0
# Verify ASCII banner appears
# Accept installation prompt
# Check success message

# Test 2: Help system
echo "Test 2: Help system"
npx reis help
npx reis help new
npx reis --version

# Test 3: Project initialization
echo "Test 3: Project initialization"
npx reis new "Test Application"
# Should create .planning/ directory

# Test 4: Basic commands
echo "Test 4: Basic commands"
npx reis map
npx reis requirements
npx reis roadmap
npx reis plan 1

# Test 5: Documentation access
echo "Test 5: Documentation"
npx reis docs
ls ~/.rovodev/reis/*.md

# Test 6: Templates
echo "Test 6: Templates"
ls ~/.rovodev/reis/templates/*.md

# Cleanup
cd ~
rm -rf /tmp/reis-user-test
```

### NPX Usage Patterns

Users can run REIS in multiple ways:

```bash
# One-time execution (downloads if needed)
npx reis help

# Specify version
npx reis@1.0.0 new "My App"

# After first run, npx caches the package
npx reis [command]

# Users can also install globally (optional)
npm install -g reis
reis help
```

---

## Rollback Procedures

### If Issues Found After Publishing

#### Option 1: Quick Patch (Recommended)

```bash
# 1. Fix the issue in code
# 2. Update version
npm version patch
# This updates package.json to 1.0.1 and creates git tag

# 3. Publish patch
npm publish

# 4. Deprecate broken version
npm deprecate reis@1.0.0 "Contains bug, please upgrade to 1.0.1"
```

#### Option 2: Unpublish (Within 72 Hours Only)

```bash
# ⚠️ Use only for critical security issues or major breakage
# ⚠️ Only works within 72 hours of publication

npm unpublish reis@1.0.0

# Note: After unpublishing, you cannot republish the same version
# You must increment the version number
```

#### Option 3: Deprecate Without Fix

```bash
# Mark version as deprecated (users will see warning)
npm deprecate reis@1.0.0 "This version has critical issues"

# Users will see:
# npm WARN deprecated reis@1.0.0: This version has critical issues
```

---

## Version Management

### Semantic Versioning (SemVer)

REIS follows semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features, backwards compatible
- **PATCH** (x.x.1): Bug fixes, backwards compatible

### Updating Versions

#### Patch Release (Bug Fixes)
```bash
# Example: 1.0.0 → 1.0.1
npm version patch
git push && git push --tags
npm publish
```

**Use for:**
- Bug fixes
- Documentation updates
- Performance improvements
- Security patches

#### Minor Release (New Features)
```bash
# Example: 1.0.0 → 1.1.0
npm version minor
git push && git push --tags
npm publish
```

**Use for:**
- New commands
- New features
- Enhancements to existing features
- Non-breaking changes

#### Major Release (Breaking Changes)
```bash
# Example: 1.0.0 → 2.0.0
npm version major
git push && git push --tags
npm publish
```

**Use for:**
- Removing commands
- Changing command syntax
- Modifying file structures
- Changing installation behavior
- Any change that breaks existing workflows

### Pre-Release Versions

For testing:
```bash
# Create beta version
npm version prerelease --preid=beta
# Results in: 1.0.1-beta.0

npm publish --tag beta

# Users can test with:
npx reis@beta
```

### Deprecating Old Versions

```bash
# Deprecate specific version
npm deprecate reis@1.0.0 "Please upgrade to 1.1.0"

# Deprecate version range
npm deprecate reis@"< 1.1.0" "Versions before 1.1.0 contain security vulnerabilities"
```

---

## Troubleshooting

### Issue: "You do not have permission to publish"

**Cause**: Not logged in or insufficient permissions

**Solution**:
```bash
npm logout
npm login
npm whoami  # Verify login
npm publish --access public
```

### Issue: "Cannot publish over existing version"

**Cause**: Version 1.0.0 already published

**Solution**:
```bash
# Increment version
npm version patch  # or minor, or major
npm publish
```

### Issue: "Package name too similar to existing package"

**Cause**: NPM prevents similar names to avoid confusion

**Solution**:
- Use scoped package: `@gravirei/reis`
- Choose different name
- Contact NPM support if you believe it's a false positive

### Issue: "402 Payment Required"

**Cause**: Trying to publish private package without paid account

**Solution**:
```bash
# Publish as public package
npm publish --access public
```

### Issue: "Package name already exists"

**Cause**: "reis" is already taken (version 0.0.0 from 2017)

**Solution**:
1. Contact current owner: dgurkaynak
2. Request name transfer via NPM support
3. Use scoped name: `@gravirei/reis`
4. Choose alternative name

### Issue: "403 Forbidden"

**Cause**: You don't own the package name

**Solution**:
- Verify you're logged in as the correct user
- Check package ownership: `npm owner ls reis`
- Use scoped package or different name

### Issue: Published but `npx reis` doesn't work

**Cause**: NPM registry propagation delay or bin configuration

**Solution**:
```bash
# Wait 1-2 minutes for CDN propagation
# Clear npx cache
npx clear-npx-cache

# Test with specific version
npx reis@1.0.0

# Verify bin field in package.json
npm view reis bin
```

---

## Post-Publication Checklist

After successful publication:

### Immediate Actions
- [ ] Verify package on NPM: https://www.npmjs.com/package/reis
- [ ] Test installation: `npx reis@1.0.0`
- [ ] Test all 29 commands work
- [ ] Verify documentation links work
- [ ] Check package size and file count
- [ ] Update README if needed

### Communication
- [ ] Announce on relevant channels (if applicable)
- [ ] Update project documentation with installation instructions
- [ ] Create GitHub release (optional)
- [ ] Add package badges to README (optional)

### Monitoring
- [ ] Monitor NPM download stats
- [ ] Watch for issues on GitHub
- [ ] Monitor NPM package page for feedback
- [ ] Set up alerts for security vulnerabilities

### Documentation Updates
- [ ] Add "Published to NPM" badge to README
- [ ] Update installation instructions
- [ ] Add link to NPM package page
- [ ] Document version in CHANGELOG.md

---

## Package Statistics

**Current Status**:
- **Package Name**: reis
- **Version**: 1.0.0
- **License**: MIT
- **Package Size**: 43.9 KB (compressed)
- **Unpacked Size**: 146.0 KB
- **Total Files**: 57
- **Dependencies**: 3 (chalk, inquirer, commander)
- **Node Version**: >=18.0.0

**Installation Command**:
```bash
npx reis
```

**Repository**:
- GitHub: https://github.com/Gravirei/reis
- Issues: https://github.com/Gravirei/reis/issues

---

## Support & Maintenance

### Regular Maintenance
- **Dependencies**: Update quarterly or when security vulnerabilities discovered
- **Testing**: Run full test suite before each release
- **Documentation**: Keep synchronized with code changes
- **Changelog**: Update for every release

### Security
- **Vulnerabilities**: Monitor with `npm audit`
- **Updates**: Patch security issues within 48 hours
- **Disclosure**: Follow responsible disclosure practices

### User Support
- **Issues**: Respond within 48 hours
- **Questions**: GitHub Discussions or Issues
- **Bug Reports**: Prioritize based on severity
- **Feature Requests**: Consider for minor/major releases

---

## Next Steps

### Before First Publish
1. ✅ Complete all verification (DONE)
2. ⏳ Resolve package name availability
3. ⏳ Login to NPM: `npm login`
4. ⏳ Publish: `npm publish --access public`
5. ⏳ Verify: `npx reis@1.0.0`
6. ⏳ Test all commands
7. ⏳ Monitor for issues

### After First Publish
1. Monitor downloads and feedback
2. Address any immediate issues
3. Plan for version 1.1.0 features
4. Maintain documentation
5. Respond to user feedback

---

**Status**: 🟢 Package ready for publication  
**Action Required**: User confirmation to proceed with `npm publish`

---

*For detailed checklist, see: `.planning/PUBLISHING_CHECKLIST.md`*
