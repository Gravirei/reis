# [DRAFT] Pre-Release Checklist for v2.0.0-beta.1

Complete this checklist before publishing to npm.

## Code & Tests

- [ ] All 309+ tests passing locally
- [ ] No failing tests in CI (if applicable)
- [ ] Manual test checklist completed (Wave 3.3)
- [ ] No critical bugs outstanding
- [ ] Code reviewed and approved
- [ ] All TODOs addressed or documented
- [ ] No debug/console.log statements in production code
- [ ] Error handling comprehensive

## Documentation

- [ ] README.md updated with v2.0 features
- [ ] CHANGELOG.md complete with all Phase 1-4 changes
- [ ] All 5 new docs created and reviewed:
  - [ ] MIGRATION_GUIDE.md
  - [ ] WAVE_EXECUTION.md
  - [ ] CHECKPOINTS.md
  - [ ] CONFIG_GUIDE.md
  - [ ] V2_FEATURES.md
- [ ] Documentation cross-links verified
- [ ] No broken links in docs
- [ ] Code examples tested and working
- [ ] API documentation accurate
- [ ] Installation instructions tested

## Examples

- [ ] basic-workflow/ tested and working
- [ ] advanced-features/ tested and working
- [ ] migration-example/ tested and working
- [ ] All sample configs validated
- [ ] README files in examples clear and accurate

## Package Configuration

- [ ] package.json version: 2.0.0-beta.1
- [ ] package.json "description" accurate
- [ ] package.json "keywords" updated
- [ ] package.json "files" includes:
  - [ ] bin/
  - [ ] lib/
  - [ ] docs/
  - [ ] examples/
  - [ ] templates/
  - [ ] subagents/
  - [ ] CHANGELOG.md
  - [ ] LICENSE
- [ ] .npmignore excludes:
  - [ ] test/
  - [ ] .planning/
  - [ ] .git/
  - [ ] node_modules/
  - [ ] tmp_* files
- [ ] npm pack --dry-run succeeds
- [ ] Package size reasonable (<5MB)
- [ ] All required files present in pack output
- [ ] No sensitive files in package

## Dependencies

- [ ] npm audit --production shows 0 vulnerabilities
- [ ] All dependencies up to date
- [ ] Dependencies correct versions in package.json
- [ ] No unnecessary dependencies
- [ ] devDependencies separated correctly
- [ ] npm list --depth=0 shows expected packages

## Git Repository

- [ ] All changes committed
- [ ] Clean working tree (git status)
- [ ] On main/master branch
- [ ] Pulled latest from remote
- [ ] No merge conflicts
- [ ] Branch up to date with remote
- [ ] Ready to create tag

## Release Artifacts

- [ ] RELEASE_NOTES.md created and reviewed
- [ ] UPGRADE_GUIDE.md created and reviewed
- [ ] ANNOUNCEMENT.md created and reviewed
- [ ] PRE_RELEASE_CHECKLIST.md (this file) complete
- [ ] PUBLISH_COMMANDS.md created

## Final Verification

- [ ] Installed locally: `npm install -g .`
- [ ] Basic commands work:
  - [ ] `reis --version`
  - [ ] `reis --help`
  - [ ] `reis new test-project`
  - [ ] `reis config init`
- [ ] npx execution works: `npx . --version`
- [ ] Uninstall/reinstall works
- [ ] Backward compatibility verified with v1.x project
- [ ] New features tested:
  - [ ] Wave execution
  - [ ] Checkpoints
  - [ ] Configuration
  - [ ] Visualization
  - [ ] Resume
- [ ] Breaking changes: NONE (verified)

## Pre-Publish Validation

- [ ] npm pack creates tarball successfully
- [ ] Tarball contents verified: `tar -tzf *.tgz`
- [ ] Extracted tarball and tested: 
  ```bash
  npm pack
  mkdir test-package
  cd test-package
  npm install ../gravirei-reis-2.0.0-beta.1.tgz
  ./node_modules/.bin/reis --version
  ```
- [ ] Version number correct everywhere:
  - [ ] package.json
  - [ ] README.md
  - [ ] CHANGELOG.md
  - [ ] Release notes
- [ ] LICENSE file present and correct

## Communication Preparation

- [ ] GitHub release draft prepared
- [ ] Announcement ready for social media
- [ ] Blog post drafted (if applicable)
- [ ] Email to users prepared (if applicable)
- [ ] Documentation site updated (if applicable)

## Publish Steps (DO NOT EXECUTE YET - FOR REFERENCE ONLY)

### 1. Create Git Tag

```bash
# Verify clean state
git status

# Create annotated tag
git tag -a v2.0.0-beta.1 -m "REIS v2.0.0-beta.1 - Wave execution, checkpoints, visualization"

# Verify tag created
git tag -l v2.0.0-beta.1

# Push tag to remote
git push origin v2.0.0-beta.1
```

### 2. Publish to npm

```bash
# Verify you're logged in
npm whoami

# Verify package contents one more time
npm pack --dry-run

# Publish with beta tag (NOT latest)
npm publish --tag beta

# Verify publish succeeded
npm view @gravirei/reis@beta version
```

### 3. Create GitHub Release

- Go to: https://github.com/Gravirei/reis/releases/new
- Select tag: v2.0.0-beta.1
- Title: "REIS v2.0.0-beta.1 - Wave Execution, Checkpoints & Visualization"
- Copy content from RELEASE_NOTES.md
- Mark as "pre-release"
- Publish release

### 4. Post Announcement

- [ ] Post to Twitter/X
- [ ] Post to Reddit (r/programming, r/devtools)
- [ ] Post to Dev.to
- [ ] Post to LinkedIn
- [ ] Post to GitHub Discussions
- [ ] Email mailing list (if applicable)

### 5. Update Documentation Site

- [ ] Deploy updated docs (if separate site)
- [ ] Update version in site header
- [ ] Add announcement banner

### 6. Post-Publish Verification

```bash
# Wait 5 minutes for npm to propagate

# Install from npm
npm install -g @gravirei/reis@beta

# Verify version
reis --version
# Should output: 2.0.0-beta.1

# Test basic functionality
reis new test-beta
cd test-beta
reis config init
reis --help

# Uninstall test
npm uninstall -g @gravirei/reis
```

## Rollback Plan

If critical issues discovered after publish:

### Option 1: npm deprecate (for serious issues)

```bash
# Deprecate the beta version
npm deprecate @gravirei/reis@2.0.0-beta.1 "Critical bug found, use v1.2.3 or wait for v2.0.0-beta.2"

# Users installing will see deprecation warning
# Existing installations continue working
```

### Option 2: Publish fix (for minor issues)

```bash
# Fix the issue
# Update version to 2.0.0-beta.2
# Publish new beta

npm publish --tag beta
```

### Option 3: Remove from npm (nuclear option, avoid if possible)

```bash
# Only within 72 hours of publish
npm unpublish @gravirei/reis@2.0.0-beta.1

# ONLY use if critical security issue
# Breaks anyone who installed
```

## Post-Release Tasks

After successful publish:

- [ ] Monitor GitHub issues for bug reports
- [ ] Respond to social media comments/questions
- [ ] Track npm download stats
- [ ] Collect feedback for v2.0.0 stable
- [ ] Update project board/roadmap
- [ ] Thank contributors and testers
- [ ] Plan v2.0.0-beta.2 if needed
- [ ] Start v2.0.0 stable planning

## Beta Testing Period

**Duration:** 2-4 weeks minimum

**Goals:**
- Collect user feedback on new features
- Identify edge cases and bugs
- Refine documentation based on questions
- Validate configuration system works for different project types
- Ensure wave execution scales to large projects

**Success Criteria for v2.0.0 Stable:**
- No critical bugs reported
- Positive feedback on new features
- Documentation covers common questions
- Performance acceptable in production use
- At least 50 beta installations (track via npm stats)

## Notes

- This is a **beta release** - expect some rough edges
- Mark as pre-release on GitHub
- Use `--tag beta` for npm publish (not latest)
- Encourage feedback from users
- Be responsive to issues
- Plan for beta.2 if needed

## Sign-Off

Before publishing, get sign-off from:

- [ ] Lead developer
- [ ] Documentation reviewer
- [ ] QA tester
- [ ] Product owner (if applicable)

## Final Check

- [ ] I have read and completed ALL items above
- [ ] I understand this is a beta release
- [ ] I am ready to support beta users
- [ ] I have time to address issues if found
- [ ] Rollback plan is clear and understood

**Ready to publish:** YES / NO

**Date prepared:** _____________

**Prepared by:** _____________

---

*This is a DRAFT checklist. Final version will be used for actual publish decision after Wave 3.3 manual testing completes.*
