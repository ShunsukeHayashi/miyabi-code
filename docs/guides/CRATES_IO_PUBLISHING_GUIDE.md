# crates.io Publishing Guide - Miyabi v1.0.0

**Status**: Ready to publish (dry-run passed ✅)
**Version**: 1.0.0
**Tag**: v1.0.0 (pushed to GitHub)
**Date**: 2025-10-15

## Prerequisites

### 1. crates.io Account Setup

If you don't have a crates.io account yet:

1. Visit https://crates.io
2. Click "Log in with GitHub"
3. Authorize the crates.io application

### 2. Generate API Token

1. Go to https://crates.io/me
2. Click "Account Settings"
3. Scroll to "API Tokens"
4. Click "New Token"
5. Name it (e.g., "miyabi-publishing")
6. Copy the token (you won't see it again!)

### 3. Configure Cargo

```bash
cargo login <your-token-here>
```

This creates `~/.cargo/credentials.toml` with your token.

## Publishing Order

**IMPORTANT**: Publish in this exact order due to dependencies.

```
miyabi-types (root - no dependencies)
    ↓
├── miyabi-core
├── miyabi-worktree
└── miyabi-github
    ↓
miyabi-agents (depends on all above)
    ↓
miyabi-cli (depends on everything)
```

## Publishing Commands

### Step 1: miyabi-types (root crate)

```bash
cd crates/miyabi-types
cargo publish
# Wait 1-2 minutes for crates.io indexing
```

**Verification**:
```bash
cargo search miyabi-types
# Should show: miyabi-types = "1.0.0"
```

### Step 2: miyabi-core

```bash
cd ../miyabi-core
cargo publish
# Wait 1-2 minutes
```

### Step 3: miyabi-worktree

```bash
cd ../miyabi-worktree
cargo publish
# Wait 1-2 minutes
```

### Step 4: miyabi-github

```bash
cd ../miyabi-github
cargo publish
# Wait 1-2 minutes
```

### Step 5: miyabi-agents

```bash
cd ../miyabi-agents
cargo publish
# Wait 1-2 minutes
```

### Step 6: miyabi-cli (final crate)

```bash
cd ../miyabi-cli
cargo publish
```

## Full Automation Script

Once credentials are configured, you can use this script:

```bash
#!/bin/bash
set -e

CRATES=("miyabi-types" "miyabi-core" "miyabi-worktree" "miyabi-github" "miyabi-agents" "miyabi-cli")

for crate in "${CRATES[@]}"; do
  echo "📦 Publishing $crate..."
  cd "crates/$crate"
  cargo publish
  cd ../..

  if [ "$crate" != "miyabi-cli" ]; then
    echo "⏳ Waiting 2 minutes for crates.io indexing..."
    sleep 120
  fi
done

echo "✅ All crates published successfully!"
```

Save as `scripts/publish-crates.sh`, make executable with `chmod +x scripts/publish-crates.sh`.

## Dry-Run Verification

Before publishing, verify each crate:

```bash
cd crates/miyabi-types && cargo publish --dry-run
cd ../miyabi-core && cargo publish --dry-run
cd ../miyabi-worktree && cargo publish --dry-run
cd ../miyabi-github && cargo publish --dry-run
cd ../miyabi-agents && cargo publish --dry-run
cd ../miyabi-cli && cargo publish --dry-run
```

**Status**: ✅ miyabi-types dry-run passed (2025-10-15)

## Post-Publishing Verification

After all crates are published:

### 1. Search Verification

```bash
cargo search miyabi
```

Expected output:
```
miyabi-types = "1.0.0"    # Core type definitions
miyabi-core = "1.0.0"     # Core utilities
miyabi-worktree = "1.0.0" # Git worktree management
miyabi-github = "1.0.0"   # GitHub API integration
miyabi-agents = "1.0.0"   # Autonomous AI agents
miyabi-cli = "1.0.0"      # Miyabi CLI
```

### 2. Installation Test

```bash
# Test installing the CLI
cargo install miyabi-cli

# Verify version
miyabi --version
# Expected: miyabi 1.0.0
```

### 3. Documentation Verification

Visit:
- https://crates.io/crates/miyabi-types
- https://crates.io/crates/miyabi-core
- https://crates.io/crates/miyabi-worktree
- https://crates.io/crates/miyabi-github
- https://crates.io/crates/miyabi-agents
- https://crates.io/crates/miyabi-cli

Check that:
- ✅ README renders correctly
- ✅ Keywords are visible
- ✅ Categories are correct
- ✅ License is Apache-2.0
- ✅ Repository link works

### 4. docs.rs Verification

After publishing, docs.rs automatically builds documentation.

Visit:
- https://docs.rs/miyabi-types/1.0.0
- https://docs.rs/miyabi-core/1.0.0
- https://docs.rs/miyabi-worktree/1.0.0
- https://docs.rs/miyabi-github/1.0.0
- https://docs.rs/miyabi-agents/1.0.0
- https://docs.rs/miyabi-cli/1.0.0

Check that:
- ✅ All docs build successfully
- ✅ Rustdoc comments render correctly
- ✅ Code examples work

## Crate Metadata Summary

### miyabi-types (1.0.0)

- **Description**: Core type definitions for Miyabi
- **Keywords**: types, agents, github, ai, automation
- **Categories**: data-structures, api-bindings
- **Size**: ~26 KiB compressed
- **Files**: 13 files
- **Tests**: 149 tests

### miyabi-core (1.0.0)

- **Description**: Core utilities for Miyabi
- **Keywords**: config, logging, retry, utilities, core
- **Categories**: config, development-tools
- **Dependencies**: miyabi-types

### miyabi-worktree (1.0.0)

- **Description**: Git worktree management for Miyabi
- **Keywords**: git, worktree, parallel, execution, automation
- **Categories**: development-tools
- **Dependencies**: miyabi-types, git2

### miyabi-github (1.0.0)

- **Description**: GitHub API integration for Miyabi
- **Keywords**: github, api, octocrab, automation, integration
- **Categories**: api-bindings, web-programming
- **Dependencies**: miyabi-types, octocrab

### miyabi-agents (1.0.0)

- **Description**: Autonomous AI agents
- **Keywords**: agents, ai, automation, github, cicd
- **Categories**: development-tools, web-programming
- **Dependencies**: miyabi-types, miyabi-core, miyabi-github, miyabi-worktree

### miyabi-cli (1.0.0)

- **Description**: Miyabi CLI - 一つのコマンドで全てが完結
- **Keywords**: cli, automation, ai, github, devops
- **Categories**: command-line-utilities, development-tools
- **Binary**: `miyabi`
- **Dependencies**: All miyabi-* crates

## Troubleshooting

### Error: "crate not found in registry"

**Cause**: Dependency not yet indexed on crates.io
**Solution**: Wait 2-3 minutes and retry

### Error: "token not found"

**Cause**: Not logged in to crates.io
**Solution**: Run `cargo login <token>`

### Error: "crate already exists"

**Cause**: Version 1.0.0 already published
**Solution**: This is permanent. Version numbers cannot be reused.
**Next Step**: Bump to 1.0.1 or 1.1.0 for next release

### Error: "package size too large"

**Cause**: Package exceeds 10 MB limit
**Solution**: Add files to `.cargo-ignore` or exclude in Cargo.toml

### Build fails on docs.rs

**Cause**: Missing features or dependencies
**Solution**: Add `[package.metadata.docs.rs]` section to Cargo.toml

## Version Yanking (Emergency Only)

If you need to yank a version (makes it unavailable for new users):

```bash
cargo yank --version 1.0.0 miyabi-types
```

**Note**: Yanking does NOT delete the crate. Use only for critical bugs.

## Next Steps After Publishing

1. ✅ Update README.md with crates.io badges
2. ✅ Create GitHub Release v1.0.0
3. ✅ Announce on social media
4. ✅ Update documentation links

---

**Publishing Checklist**:

- [ ] crates.io account created
- [ ] API token generated
- [ ] `cargo login` configured
- [ ] Dry-run passed for all crates
- [ ] Git tag v1.0.0 pushed
- [ ] Publish miyabi-types
- [ ] Publish miyabi-core
- [ ] Publish miyabi-worktree
- [ ] Publish miyabi-github
- [ ] Publish miyabi-agents
- [ ] Publish miyabi-cli
- [ ] Verify all crates on crates.io
- [ ] Verify docs.rs builds
- [ ] Test `cargo install miyabi-cli`
- [ ] Update README.md badges
- [ ] Create GitHub Release

**Reference**: See `PRODUCTION_DEPLOYMENT_CHECKLIST.md` for full deployment workflow.
