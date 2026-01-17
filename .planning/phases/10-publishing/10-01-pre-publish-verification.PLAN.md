# Plan: 10-01 - Pre-Publish Verification and Testing

## Objective
Perform final verification that the package is ready for NPM publication, including local installation testing and npm pack testing.

## Context
Before publishing to NPM, we need to verify the package works correctly when installed as a real package. Test with npm pack to simulate the published package.

## Dependencies
- Phase 09 complete (all testing and polish done)
- All bugs fixed
- Documentation finalized

## Tasks

<task type="auto">
<name>Test package with npm pack</name>
<files>package.json, .npmignore</files>
<action>
Test the package as it will appear on NPM:

1. Create package tarball:
   - Run: npm pack
   - This creates reis-1.0.0.tgz

2. Verify package contents:
   - Extract: tar -tzf reis-1.0.0.tgz
   - Check included files:
     * bin/ directory with reis.js
     * lib/ directory with all commands and utils
     * docs/ with all 8 documentation files
     * templates/ with all 5 template files
     * subagents/ with all 3 subagent files
     * README.md
     * package.json
     * LICENSE (if exists)
   - Verify excluded files:
     * .planning/ should NOT be in tarball
     * .git/ should NOT be in tarball
     * node_modules/ should NOT be in tarball
     * tmp_rovodev_* files should NOT be in tarball

3. Check tarball size:
   - Should be reasonable (<1MB ideally)
   - If too large, investigate why

4. Test installation from tarball:
   - Create test directory: mkdir /tmp/reis-test && cd /tmp/reis-test
   - Install from tarball: npm install ~/path/to/reis-1.0.0.tgz
   - Test command works: npx reis --version
   - Verify files installed correctly

Document any issues found.
</action>
<verify>npm pack && tar -tzf reis-1.0.0.tgz | wc -l</verify>
<done>Package tested with npm pack, contents verified, installation from tarball successful</done>
</task>

<task type="auto">
<name>Verify package.json completeness</name>
<files>package.json</files>
<action>
Final package.json verification checklist:

Required fields:
- ✓ name: "reis"
- ✓ version: "1.0.0"
- ✓ description: Clear and compelling
- ✓ main: "lib/index.js"
- ✓ bin: { "reis": "bin/reis.js" }
- ✓ scripts: Including postinstall
- ✓ keywords: Comprehensive list
- ✓ author: Set correctly
- ✓ license: "MIT"
- ✓ engines: { node: ">=18.0.0" }
- ✓ dependencies: chalk@4.x, inquirer@8.x, commander@11.x

Recommended fields:
- ✓ repository: Git URL (update if placeholder)
- ✓ bugs: Issue tracker URL
- ✓ homepage: Package homepage URL
- ✓ files: Array of included files/directories
- ✓ preferGlobal: true (for CLI tools)

Verify:
1. All URLs are correct (not placeholders)
2. Version is 1.0.0 (initial release)
3. Dependencies use correct versions
4. No devDependencies needed for published package
5. Scripts work correctly

If repository URL is still placeholder, note that it needs to be updated before publishing or removed.
</action>
<verify>node -e "const pkg = require('./package.json'); console.log('Name:', pkg.name); console.log('Version:', pkg.version); console.log('Bin:', pkg.bin); console.log('Files:', pkg.files); console.log('Engines:', pkg.engines);"</verify>
<done>package.json verified complete with all required and recommended fields</done>
</task>

<task type="auto">
<name>Create final pre-publish checklist</name>
<files>.planning/PUBLISHING_CHECKLIST.md</files>
<action>
Create .planning/PUBLISHING_CHECKLIST.md with comprehensive checklist:

# REIS NPM Publishing Checklist

## Pre-Publish Verification

### Package Structure
- [ ] All 29 commands implemented and working
- [ ] Installation script tested (interactive and CI mode)
- [ ] All files copy correctly to ~/.rovodev/reis/
- [ ] Documentation transformed (GSD → REIS)
- [ ] Templates transformed
- [ ] Subagents transformed (gsd_* → reis_*)

### Testing
- [ ] All commands tested individually
- [ ] Error handling tested
- [ ] Edge cases handled
- [ ] npm pack tested
- [ ] Installation from tarball tested
- [ ] Files included/excluded correctly

### Documentation
- [ ] README.md accurate and clear
- [ ] All docs/ files verified
- [ ] COMPLETE_COMMANDS.md lists all 29 commands
- [ ] WORKFLOW_EXAMPLES.md has realistic examples
- [ ] LICENSE file exists

### Package.json
- [ ] Version is 1.0.0
- [ ] Name is "reis"
- [ ] Description is compelling
- [ ] Keywords are comprehensive
- [ ] Repository URL is correct (or removed)
- [ ] Dependencies are correct versions
- [ ] bin points to bin/reis.js
- [ ] postinstall script configured

### Publishing Requirements
- [ ] NPM account exists and logged in
- [ ] Package name "reis" is available on NPM
- [ ] Git repository created (if needed)
- [ ] All changes committed
- [ ] Tag created: v1.0.0

## Publishing Steps
1. npm login (if not already)
2. npm publish
3. Test: npx reis@1.0.0
4. Verify on npmjs.com/package/reis

## Post-Publish
- [ ] Test installation: npx reis
- [ ] Verify all commands work
- [ ] Check package page on NPM
- [ ] Update any external documentation

This checklist guides the final publishing process.
</action>
<verify>cat .planning/PUBLISHING_CHECKLIST.md | grep -c "\[ \]"</verify>
<done>Publishing checklist created with comprehensive verification steps</done>
</task>

## Success Criteria
- npm pack successfully creates tarball
- Tarball contents verified (correct files included/excluded)
- Installation from tarball works correctly
- package.json has all required fields
- Publishing checklist created and comprehensive
- Package is ready for npm publish

## Verification
```bash
# Create and inspect package
npm pack
tar -tzf reis-1.0.0.tgz | head -20
ls -lh reis-1.0.0.tgz

# Test installation
mkdir -p /tmp/reis-test
cd /tmp/reis-test
npm install ~/Documents/Projects/reis/reis-1.0.0.tgz
npx reis --version

# Review checklist
cat .planning/PUBLISHING_CHECKLIST.md
```
