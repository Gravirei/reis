# REIS NPM Publishing Checklist

## Pre-Publish Verification

### Package Structure
- [x] All 29 commands implemented and working
- [x] Installation script tested (interactive and CI mode)
- [x] All files copy correctly to ~/.rovodev/reis/
- [x] Documentation transformed (GSD → REIS)
- [x] Templates transformed
- [x] Subagents transformed (gsd_* → reis_*)

### Testing
- [x] All commands tested individually
- [x] Error handling tested
- [x] Edge cases handled
- [x] npm pack tested
- [x] Installation from tarball tested
- [x] Files included/excluded correctly

### Documentation
- [x] README.md accurate and clear
- [x] All docs/ files verified
- [x] COMPLETE_COMMANDS.md lists all 29 commands
- [x] WORKFLOW_EXAMPLES.md has realistic examples
- [x] LICENSE file exists
- [x] CHANGELOG.md exists

### Package.json
- [x] Version is 1.0.0
- [x] Name is "reis"
- [x] Description is compelling
- [x] Keywords are comprehensive
- [x] Repository URL is correct
- [x] Dependencies are correct versions
- [x] bin points to bin/reis.js
- [x] postinstall script configured
- [x] files array specifies included directories
- [x] preferGlobal is set to true
- [x] engines specifies Node.js >=18.0.0

### Publishing Requirements
- [ ] NPM account exists and logged in
- [ ] Package name "reis" is available on NPM
- [ ] All changes committed
- [ ] Tag created: v1.0.0

## Publishing Steps

### 1. Pre-Flight Check
```bash
# Verify you're logged in
npm whoami

# Check package name availability
npm search reis --long

# Verify package.json
cat package.json | jq '.name, .version, .license'

# Final verification
npm pack
tar -tzf reis-1.0.0.tgz | wc -l
```

### 2. Publish to NPM
```bash
# Publish (first time, use --access public for scoped or initial packages)
npm publish --access public

# Or if already published before
npm publish
```

### 3. Verify Publication
```bash
# Check package exists
npm view reis

# Check version
npm view reis version

# Check package details
npm info reis
```

## Post-Publish Verification

### Installation Testing
- [ ] Test installation: `npx reis@1.0.0`
- [ ] Verify installation prompt and ASCII art display
- [ ] Confirm files copied to ~/.rovodev/reis/
- [ ] Verify all commands work

### Commands to Test
```bash
# In a clean directory (not the project folder)
npx reis --version
npx reis help
npx reis new "Test Project"
npx reis map
npx reis plan 1
```

### NPM Package Page
- [ ] Visit: https://www.npmjs.com/package/reis
- [ ] Verify README displays correctly
- [ ] Check package details are accurate
- [ ] Verify all metadata is correct

### Documentation Verification
```bash
# Check installed files
ls -la ~/.rovodev/reis/
ls -la ~/.rovodev/reis/templates/
ls -la ~/.rovodev/subagents/reis_*.md
```

### GitHub Release (Optional)
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Create GitHub release with changelog

## Rollback Procedure

If issues are discovered after publishing:

### Option 1: Publish Patch Version
```bash
# Fix the issue
# Update version in package.json to 1.0.1
npm version patch
npm publish
```

### Option 2: Deprecate Version (if seriously broken)
```bash
npm deprecate reis@1.0.0 "This version has critical issues, please use 1.0.1"
```

### Option 3: Unpublish (only within 72 hours)
```bash
# Only use if absolutely necessary
npm unpublish reis@1.0.0
```

## Future Version Updates

### Patch Release (1.0.x) - Bug fixes
```bash
npm version patch
git push && git push --tags
npm publish
```

### Minor Release (1.x.0) - New features, backwards compatible
```bash
npm version minor
git push && git push --tags
npm publish
```

### Major Release (x.0.0) - Breaking changes
```bash
npm version major
git push && git push --tags
npm publish
```

## Support & Maintenance

### Monitoring
- Check NPM download stats: https://npm-stat.com/charts.html?package=reis
- Monitor issues: https://github.com/Gravirei/reis/issues
- Watch for user feedback

### Updates
- Keep dependencies updated
- Address security vulnerabilities promptly
- Respond to user issues and PRs

## Notes

- **Package Size**: 43.9 KB (compressed), 146.0 KB (unpacked) - within reasonable limits
- **Total Files**: 57 files included in package
- **Node Version**: Requires Node.js 18.0.0 or higher
- **Dependencies**: chalk, inquirer, commander (all stable versions)

---

**Status**: ✓ Ready for publication pending user confirmation
