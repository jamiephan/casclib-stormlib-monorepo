# Release Workflow Guide

This document explains how to create releases for the packages in this monorepo.

## 🔄 Automated Workflows

### 1. Pull Request Testing (`build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

**What it does:**
- Runs tests on Linux, Windows, and macOS
- Tests with Node.js 18, 20, and 22
- Generates code coverage reports
- Uploads coverage to Codecov (requires `CODECOV_TOKEN` secret)
- Archives coverage reports as artifacts (30 day retention)

**View Results:**
- Coverage badges will appear on your README (after Codecov setup)
- Coverage reports are available in PR checks
- Download detailed reports from GitHub Actions artifacts

---

### 2. Package Publishing (`publish.yml`)

**Triggers:**
- Git tags matching `casclib/v*.*.*` or `stormlib/v*.*.*`

**What it does:**
1. **Detects Package**: Determines which package to publish from tag name
2. **Builds Native Modules**: Compiles for all supported platforms:
   - Linux x64 (Node 18, 20, 22)
   - Windows x64 (Node 18, 20, 22)
   - macOS Intel x64 (Node 18, 20, 22)
   - macOS Apple Silicon arm64 (Node 18, 20, 22)
3. **Runs Tests**: Ensures all builds pass tests
4. **Publishes to npm**: Releases package with prebuilt binaries
5. **Creates GitHub Release**: With release notes and downloadable binaries
6. **Notifies**: Comments on recent PRs about the new release

---

## 📦 Publishing a Release

### Prerequisites

Set up these GitHub secrets in your repository settings:

1. **`NPM_TOKEN`**: Your npm authentication token
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Generate a "Automation" token
   - Add it to GitHub repository secrets

2. **`CODECOV_TOKEN`** (optional): For coverage reports
   - Go to https://codecov.io/ and sign up
   - Add your repository
   - Copy the upload token
   - Add it to GitHub repository secrets

### Step-by-Step Release Process

#### Option 1: Release @jamiephan/casclib

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Update version in package.json (if needed)
cd packages/casclib
# Edit package.json version field
git add package.json
git commit -m "chore: bump casclib to v1.0.0"

# 3. Create and push the tag
git tag casclib/v1.0.0
git push origin casclib/v1.0.0

# 4. Watch the workflow
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

#### Option 2: Release @jamiephan/stormlib

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Update version in package.json (if needed)
cd packages/stormlib
# Edit package.json version field
git add package.json
git commit -m "chore: bump stormlib to v1.0.0"

# 3. Create and push the tag
git tag stormlib/v1.0.0
git push origin stormlib/v1.0.0

# 4. Watch the workflow
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

---

## 🔧 What Happens During Release

### 1. Package Detection (1 minute)
```
Tag: casclib/v1.0.0
↓
Determines: package=casclib, version=1.0.0
```

### 2. Multi-Platform Builds (15-20 minutes)
Runs in parallel across 12 jobs:
```
┌─────────────┬────────────────────────────────────┐
│   OS        │   Node Versions                    │
├─────────────┼────────────────────────────────────┤
│ Linux       │ 18, 20, 22                         │
│ Windows     │ 18, 20, 22                         │
│ macOS Intel │ 18, 20, 22                         │
│ macOS ARM64 │ 18, 20, 22                         │
└─────────────┴────────────────────────────────────┘
```

Each job:
- ✅ Builds native module
- ✅ Runs test suite
- ✅ Creates prebuild binary
- ✅ Uploads as artifact

### 3. Publish & Release (5 minutes)
```
1. Download all prebuild artifacts
2. Organize into prebuilds/ directory
3. Update package.json version
4. Build TypeScript
5. Create npm tarball
6. Publish to npm registry ✓
7. Generate release notes
8. Create GitHub release ✓
9. Upload binaries to release
10. Comment on related PRs
```

---

## 📝 Release Notes Format

Auto-generated release notes include:

```markdown
# @jamiephan/casclib v1.0.0

## 📦 Installation
npm install @jamiephan/casclib@1.0.0

## 🔧 Supported Platforms
- Linux (x64) - Node.js 18, 20, 22
- Windows (x64) - Node.js 18, 20, 22
- macOS Intel (x64) - Node.js 18, 20, 22
- macOS Apple Silicon (arm64) - Node.js 18, 20, 22

## 📝 Usage
[Code examples]

## 🚀 What's Included
- Native module binaries
- TypeScript definitions
- ES Module & CommonJS support
```

---

## 🎯 User Experience

### With Prebuilds (Fast!)
```bash
npm install @jamiephan/casclib
# ✓ Found prebuild: casclib-win32-x64-node20.node
# ✓ Installed prebuild to build/Release/casclib.node
# ✓ casclib installed successfully (using prebuild)
# 
# Time: ~5 seconds
```

### Without Prebuilds (Source Build)
```bash
npm install @jamiephan/casclib
# No prebuild found for linux-arm64-node18
# Building from source...
# Running node-gyp rebuild...
# [compilation output]
# ✓ casclib built successfully from source
# 
# Time: ~2 minutes
```

---

## 🔍 Troubleshooting

### Workflow Fails to Trigger

**Issue**: Tagged but workflow didn't run

**Solutions**:
1. Check tag format: Must be exactly `casclib/v1.0.0` or `stormlib/v1.0.0`
2. Ensure tag is pushed: `git push origin casclib/v1.0.0`
3. Check workflow file is on main branch
4. Verify GitHub Actions are enabled for your repo

### NPM Publish Fails

**Issue**: "npm publish" step fails with 401 error

**Solutions**:
1. Verify `NPM_TOKEN` secret is set correctly
2. Check token has "Automation" or "Publish" permissions
3. Ensure package name is available on npm
4. Check if version already exists on npm

### Build Failures on Specific Platform

**Issue**: One platform build fails, others succeed

**Solutions**:
1. Check the build logs for specific errors
2. Platform-specific dependencies might be missing
3. Update the workflow to install required system packages
4. Consider skipping that platform if not critical

### GitHub Release Already Exists

**Issue**: "Release already exists" error

**Solutions**:
```bash
# Delete the tag locally and remotely
git tag -d casclib/v1.0.0
git push origin :refs/tags/casclib/v1.0.0

# Delete the release on GitHub UI
# Re-create with new changes
git tag casclib/v1.0.0
git push origin casclib/v1.0.0
```

---

## 📊 Monitoring Releases

### Check Release Status

1. **GitHub Actions**: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
   - Shows workflow progress live
   - Download logs and artifacts
   - Re-run failed jobs

2. **npm Registry**: https://www.npmjs.com/package/@jamiephan/casclib
   - Verify package published
   - Check version number
   - View download stats

3. **GitHub Releases**: https://github.com/YOUR_USERNAME/YOUR_REPO/releases
   - See release notes
   - Download prebuilt binaries
   - Check release assets

### Rollback a Release

If you need to rollback:

```bash
# 1. Deprecate the npm version
npm deprecate @jamiephan/casclib@1.0.0 "This version has issues, use 0.9.0 instead"

# 2. Delete the GitHub release (in UI or via CLI)
gh release delete casclib/v1.0.0

# 3. Delete the git tag
git tag -d casclib/v1.0.0
git push origin :refs/tags/casclib/v1.0.0

# 4. Fix the issue and re-release
```

---

## ✅ Pre-Release Checklist

Before creating a release tag:

- [ ] All tests passing locally (`pnpm test`)
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated (if you maintain one)
- [ ] Breaking changes documented
- [ ] Dependencies updated
- [ ] npm credentials valid (`NPM_TOKEN` secret)
- [ ] Tag format correct (`casclib/v1.0.0` or `stormlib/v1.0.0`)
- [ ] Main branch is up to date

---

## 🚀 Quick Commands

```bash
# Test locally before release
pnpm test
pnpm run -r test:coverage

# Check what will be included in npm package
cd packages/casclib
npm pack --dry-run

# View current tags
git tag -l "*/*"

# Delete a local tag
git tag -d casclib/v1.0.0

# Delete a remote tag
git push origin :refs/tags/casclib/v1.0.0

# Create and push release tag
git tag casclib/v1.0.0 -m "Release casclib v1.0.0"
git push origin casclib/v1.0.0
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🎯 Summary

The release workflow is fully automated. Simply create and push a tag with the correct format, and the workflow will:

✅ Build for all platforms and Node versions  
✅ Test everything  
✅ Publish to npm with prebuilds  
✅ Create GitHub release with binaries  
✅ Notify contributors  

**Time to release**: ~20-25 minutes from tag push to npm availability! 🚀
