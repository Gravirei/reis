# Plan: 10-02 - NPM Publication

## Objective
Publish the REIS package to NPM registry and verify it works correctly when installed by users.

## Context
Final step: publish to NPM so users can run `npx reis` globally. This requires NPM account, package name availability check, and careful publishing process.

## Dependencies
- Plan 10-01 (pre-publish verification complete)
- All previous phases complete
- Package tested with npm pack

## Tasks

<task type="checkpoint:human-verify">
<name>Verify NPM account and package name availability</name>
<files>package.json</files>
<action>
Before publishing, verify prerequisites:

1. NPM account:
   - Check if logged in: npm whoami
   - If not logged in: npm login
   - Verify account has publishing rights

2. Package name availability:
   - Check if "reis" is available: npm search reis
   - If name is taken, need to choose alternative or contact owner
   - Verify current package.json has correct name

3. Repository setup (if needed):
   - If repository URL is in package.json, ensure repo exists
   - Ensure code is pushed to repository
   - Consider creating release tag: git tag v1.0.0

4. Final review:
   - Review .planning/PUBLISHING_CHECKLIST.md
   - Ensure all checkboxes can be checked
   - Any blockers identified?

Note: This is a checkpoint for human verification before proceeding with publish.
</action>
<verify>npm whoami && echo "Ready to publish"</verify>
<done>NPM account verified, package name available, ready to publish</done>
</task>

<task type="checkpoint:human-action">
<name>Publish to NPM registry</name>
<files>package.json</files>
<action>
Publish the package to NPM:

1. Final checks before publish:
   - Ensure you're in project root directory
   - Verify package.json version is 1.0.0
   - Check node_modules exists (npm install if needed)
   - Review files one last time

2. Publish command:
   - Run: npm publish
   - If first time publishing as public package: npm publish --access public
   - Monitor output for any errors

3. Verify publish succeeded:
   - Check NPM: https://www.npmjs.com/package/reis
   - Should show version 1.0.0
   - README should display correctly
   - Check package files tab

4. If publish fails:
   - Review error message
   - Common issues: name conflict, authentication, version already published
   - Fix issue and retry

Note: This is a human action step as it requires NPM credentials and confirmation.
</action>
<verify>npm view reis version</verify>
<done>Package successfully published to NPM as reis@1.0.0</done>
</task>

<task type="checkpoint:human-verify">
<name>Post-publish verification and testing</name>
<files>None - testing published package</files>
<action>
Verify the published package works correctly:

1. Test fresh installation:
   - In a new terminal/directory (not project folder)
   - Run: npx reis@1.0.0
   - Should trigger installation with ASCII art
   - Confirm installation when prompted
   - Verify files copied to ~/.rovodev/reis/

2. Test commands:
   - Run: npx reis help
   - Run: npx reis version
   - Run: npx reis new "test app"
   - Verify all commands work correctly

3. Check NPM package page:
   - Visit: https://www.npmjs.com/package/reis
   - Verify README displays correctly
   - Check download stats (should be 0 initially)
   - Verify package details are correct

4. Test from different location:
   - From a different directory
   - Run: npx reis
   - Should work globally

5. Verify documentation:
   - Check ~/.rovodev/reis/ has all docs
   - Check ~/.rovodev/reis/templates/ has templates
   - Check ~/.rovodev/subagents/ has reis_*.md files

6. Create GitHub release (if using GitHub):
   - Tag: v1.0.0
   - Title: "REIS v1.0.0 - Initial Release"
   - Include changelog/release notes

Document any issues found and address them in a patch release if needed.
</action>
<verify>npx reis@1.0.0 --version && ls ~/.rovodev/reis/ | wc -l</verify>
<done>Published package verified working correctly, all commands functional, documentation installed</done>
</task>

## Success Criteria
- NPM account verified and logged in
- Package name "reis" is available (or alternative chosen)
- Package successfully published to NPM
- Package appears on npmjs.com/package/reis
- npx reis works from any directory
- All 29 commands function correctly
- Files install to ~/.rovodev/reis/ correctly
- Documentation is accessible
- Package is ready for users

## Verification
```bash
# Check NPM status
npm whoami

# Publish (when ready)
npm publish --access public

# Verify published package
npm view reis
npm view reis version

# Test installation
cd /tmp
npx reis@1.0.0

# Test commands
npx reis help
npx reis version

# Check installed files
ls -la ~/.rovodev/reis/
ls -la ~/.rovodev/subagents/reis_*.md
```
