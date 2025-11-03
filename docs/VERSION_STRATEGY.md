# Miyabi Version Strategy

## Current Situation

Your crates.io profile has 8 published crates:
- 6 crates at v1.0.0 (types, core, github, worktree, agents, cli)
- 2 crates at v0.1.1 (llm, potpie)

Your local workspace is at v0.1.1.

## Options

### Option A: Continue from 1.0.0 (Recommended)

**Bump all local crates to 1.0.1 or 1.1.0**

Pros:
- ✅ Semantic versioning continuity
- ✅ Existing users get updates
- ✅ Clear version progression

Steps:
```bash
# Update root Cargo.toml
sed -i '' 's/version = "0.1.1"/version = "1.0.1"/' Cargo.toml

# Verify
cargo check --all

# Publish updates
./scripts/publish-to-cratesio.sh all
```

Version decision:
- **1.0.1**: Bug fixes only since 1.0.0
- **1.1.0**: New features added (backward compatible)
- **2.0.0**: Breaking API changes

### Option B: Fresh Start with 0.x

**Yank old versions and restart at 0.1.1**

Pros:
- ✅ Start fresh with proper pre-1.0 development cycle
- ✅ Signal "work in progress"
- ✅ More flexibility for breaking changes

Cons:
- ❌ Breaks existing users
- ❌ Requires yanking 8 crate versions

Steps:
```bash
# Yank old versions
cargo yank miyabi-types@1.0.0
cargo yank miyabi-core@1.0.0
cargo yank miyabi-github@1.0.0
cargo yank miyabi-worktree@1.0.0
cargo yank miyabi-agents@1.0.0
cargo yank miyabi-cli@1.0.0

# Publish new 0.1.1 versions
./scripts/publish-to-cratesio.sh all
```

### Option C: Dual Track

**Maintain 1.0.x for stable, develop in 0.x**

Keep published 1.0.0 versions, but develop new features in 0.x series.

Not recommended - confusing for users.

## Recommendation: Option A (1.0.1 or 1.1.0)

Since you've already published 1.0.0, it's best to continue from there.

### Decision Tree:

**Since 1.0.0, have you made:**
- Bug fixes only? → Use 1.0.1
- New features (backward compatible)? → Use 1.1.0
- Breaking changes? → Use 2.0.0

## Quick Commands

### Check Changes Since 1.0.0
```bash
# If you have git tags
git log v1.0.0..HEAD --oneline

# Check current version
grep "^version" Cargo.toml
```

### Bump to 1.0.1 (Bug fixes)
```bash
sed -i '' 's/version = "0.1.1"/version = "1.0.1"/' Cargo.toml
cargo check --all
git commit -am "chore: bump version to 1.0.1"
git tag v1.0.1
```

### Bump to 1.1.0 (New features)
```bash
sed -i '' 's/version = "0.1.1"/version = "1.1.0"/' Cargo.toml
cargo check --all
git commit -am "chore: bump version to 1.1.0"
git tag v1.1.0
```

### Publish Updated Versions
```bash
# Dry run first
./scripts/publish-to-cratesio.sh all --dry-run

# Actual publish
./scripts/publish-to-cratesio.sh all
```

## Remaining Crates to Publish

These 20 crates need initial publishing:
- miyabi-knowledge
- miyabi-agent-core
- miyabi-agent-coordinator
- miyabi-agent-codegen
- miyabi-agent-review
- miyabi-agent-workflow
- miyabi-agent-business
- miyabi-agent-integrations
- miyabi-agent-issue
- miyabi-orchestrator
- miyabi-modes
- miyabi-webhook
- miyabi-mcp-server
- miyabi-discord-mcp-server
- miyabi-web-api
- miyabi-a2a
- miyabi-benchmark
- miyabi-session-manager
- miyabi-claudable
- miyabi-e2e-tests
- miyabi-agent-swml

---

**Your profile**: https://crates.io/users/ShunsukeHayashi
**Search**: https://crates.io/search?q=miyabi
