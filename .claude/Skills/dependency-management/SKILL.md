---
name: Dependency Management for Cargo and npm
description: Comprehensive dependency management including updates, vulnerability resolution, version conflict resolution, and workspace coordination. Use when managing dependencies, resolving version conflicts, or updating packages.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# Dependency Management for Cargo and npm

Complete dependency management workflow for Rust (Cargo) and TypeScript/JavaScript (npm) projects.

## When to Use

- User requests "update dependencies"
- User asks "why is there a version conflict?"
- User wants to "add a new dependency"
- Weekly/monthly dependency updates
- After security audit (vulnerabilities found)
- When resolving build errors related to dependencies

## Dependency Management Workflow

### Step 1: Audit Current Dependencies

```bash
# Cargo
cargo tree
cargo outdated
cargo audit

# npm (if TypeScript project)
npm outdated
npm audit
```

### Step 2: Plan Updates

| Update Type | Risk | Approach |
|-------------|------|----------|
| **Patch** (0.1.X) | Low | Auto-update |
| **Minor** (0.X.0) | Medium | Review changelog |
| **Major** (X.0.0) | High | Test thoroughly, check breaking changes |

## Cargo Dependency Management

### 1. Adding Dependencies

**Basic dependency**:
```bash
# Add to Cargo.toml
cargo add tokio --features full

# Add dev dependency
cargo add --dev criterion

# Add build dependency
cargo add --build cc
```

**Specific version**:
```bash
# Exact version
cargo add serde --version "=1.0.193"

# Minimum version
cargo add tokio --version ">=1.35"

# Version range
cargo add reqwest --version ">=0.11, <0.12"
```

**From git**:
```bash
# Main branch
cargo add my-crate --git https://github.com/user/repo

# Specific branch
cargo add my-crate --git https://github.com/user/repo --branch feature

# Specific commit
cargo add my-crate --git https://github.com/user/repo --rev abc123
```

**Local path** (for development):
```bash
cargo add my-crate --path ../my-crate
```

### 2. Updating Dependencies

**Update all dependencies**:
```bash
# Update to latest compatible versions
cargo update

# Dry run (preview updates)
cargo update --dry-run

# Update specific crate
cargo update -p tokio

# Update to latest (even breaking changes)
cargo update --aggressive
```

**Install cargo-outdated**:
```bash
cargo install cargo-outdated

# Check for outdated dependencies
cargo outdated

# Show only direct dependencies
cargo outdated --root-deps-only

# Show detailed information
cargo outdated --verbose
```

### 3. Dependency Tree Analysis

```bash
# View full dependency tree
cargo tree

# Show duplicates
cargo tree --duplicates

# Specific crate's dependencies
cargo tree -p tokio

# Reverse dependencies (what depends on this?)
cargo tree -i serde

# Show features
cargo tree --format "{p} {f}"

# Prune dev dependencies
cargo tree --no-dev-dependencies
```

### 4. Resolving Version Conflicts

**Identify conflicts**:
```bash
cargo tree --duplicates

# Example output:
# serde v1.0.193
# serde v1.0.180  # Conflict!
```

**Resolution strategies**:

**Option 1: Update to common version**:
```bash
# Update all to latest
cargo update -p serde
```

**Option 2: Force specific version** (use carefully):
```toml
# Cargo.toml
[patch.crates-io]
serde = { version = "=1.0.193" }
```

**Option 3: Use workspace dependency**:
```toml
# Root Cargo.toml
[workspace.dependencies]
serde = "1.0.193"

# Member Cargo.toml
[dependencies]
serde = { workspace = true }
```

### 5. Workspace Dependency Management

**Centralize versions**:
```toml
# Root Cargo.toml
[workspace]
members = ["crates/*"]
resolver = "2"

[workspace.dependencies]
# Define versions once
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"

[workspace.package]
version = "0.1.0"
edition = "2021"
license = "MIT OR Apache-2.0"
```

**Use in member crates**:
```toml
# crates/my-crate/Cargo.toml
[dependencies]
tokio = { workspace = true }
serde = { workspace = true }
anyhow = { workspace = true }

# Override features if needed
tokio = { workspace = true, features = ["time"] }
```

**Benefits**:
- Single source of truth for versions
- Easier updates (change once)
- Prevents version conflicts
- Shared metadata

### 6. Feature Management

**Define features**:
```toml
[features]
default = ["std"]
std = []
async = ["tokio"]
full = ["std", "async", "serde"]

[dependencies]
tokio = { version = "1.35", optional = true }
serde = { version = "1.0", optional = true }
```

**Use features**:
```bash
# Build with specific features
cargo build --features async

# Build with all features
cargo build --all-features

# Build with no features
cargo build --no-default-features
```

### 7. Cargo Check Commands

```bash
# Check if project compiles
cargo check

# Check all workspace members
cargo check --workspace

# Check with all features
cargo check --all-features

# Check examples
cargo check --examples

# Check tests
cargo check --tests
```

## npm Dependency Management (TypeScript/Legacy)

### 1. Adding Dependencies

```bash
# Production dependency
npm install package-name

# Dev dependency
npm install --save-dev package-name

# Specific version
npm install package-name@1.2.3

# Latest version
npm install package-name@latest
```

### 2. Updating Dependencies

```bash
# Check outdated
npm outdated

# Update all to latest compatible
npm update

# Update specific package
npm update package-name

# Update to latest (even breaking)
npm install package-name@latest
```

### 3. Security Audits

```bash
# Run audit
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (may cause breaking changes)
npm audit fix --force

# View detailed report
npm audit --json
```

### 4. Lock File Management

```bash
# Regenerate package-lock.json
rm package-lock.json
npm install

# Update lock file only
npm install --package-lock-only

# Verify integrity
npm ci
```

## Version Constraint Syntax

### Cargo (SemVer)

| Constraint | Meaning | Example |
|-----------|---------|---------|
| `1.2.3` | Compatible (^1.2.3) | `>= 1.2.3, < 2.0.0` |
| `^1.2.3` | Caret (default) | `>= 1.2.3, < 2.0.0` |
| `~1.2.3` | Tilde | `>= 1.2.3, < 1.3.0` |
| `>= 1.2` | Greater or equal | `>= 1.2.0` |
| `1.2.*` | Wildcard | `>= 1.2.0, < 1.3.0` |
| `=1.2.3` | Exact | Exactly `1.2.3` |

### npm (SemVer)

| Constraint | Meaning | Example |
|-----------|---------|---------|
| `^1.2.3` | Caret (default) | `>= 1.2.3, < 2.0.0` |
| `~1.2.3` | Tilde | `>= 1.2.3, < 1.3.0` |
| `1.2.x` | X-range | `>= 1.2.0, < 1.3.0` |
| `>= 1.2.3` | Greater or equal | `>= 1.2.3` |
| `1.2.3` | Exact | Exactly `1.2.3` |

## Dependency Update Strategy

### 1. Regular Updates (Low Risk)

**Weekly**:
```bash
# Patch updates only
cargo update --workspace

# Review changes
git diff Cargo.lock

# Test
cargo test --workspace

# Commit
git commit -am "chore(deps): update dependencies (patch)"
```

### 2. Minor Updates (Medium Risk)

**Monthly**:
```bash
# Check for minor updates
cargo outdated

# Update specific crates
cargo update -p tokio -p serde

# Review changelogs
# https://github.com/tokio-rs/tokio/blob/master/CHANGELOG.md

# Test thoroughly
cargo test --workspace
cargo clippy --workspace

# Commit with details
git commit -am "chore(deps): update tokio 1.35 → 1.36

Breaking changes: None
New features:
- Feature X
- Feature Y"
```

### 3. Major Updates (High Risk)

**Quarterly or as-needed**:
```bash
# Research breaking changes
# Read migration guides

# Update one crate at a time
cargo update -p crate-name --aggressive

# Fix compilation errors
cargo check --workspace

# Fix tests
cargo test --workspace

# Fix clippy warnings
cargo clippy --workspace

# Update documentation
# Update CHANGELOG

# Create PR with detailed notes
git commit -am "feat(deps): upgrade crate-name 1.x → 2.x

BREAKING CHANGES:
- API X changed to Y
- Feature Z removed

Migration:
- Replace old_function() with new_function()
- Update configuration format

Testing: All tests pass"
```

## Handling Common Issues

### Issue 1: Dependency Hell

**Symptom**: Multiple versions of same crate

**Solution**:
```bash
# Identify duplicates
cargo tree --duplicates

# Try updating
cargo update

# If persists, use patch
[patch.crates-io]
problematic-crate = { version = "=1.2.3" }

# Or wait for dependencies to update
```

### Issue 2: Yanked Crate Version

**Symptom**: `error: no matching package named X found`

**Solution**:
```bash
# Update to non-yanked version
cargo update -p problematic-crate

# Or specify different version in Cargo.toml
problematic-crate = "1.2.4"  # Instead of yanked 1.2.3
```

### Issue 3: Conflicting Features

**Symptom**: Features enabled by multiple dependencies conflict

**Solution**:
```toml
# Explicitly set features
[dependencies]
tokio = { version = "1.35", features = ["full"], default-features = false }
```

### Issue 4: Build Script Failures

**Symptom**: Build script fails during dependency compilation

**Solution**:
```bash
# Clean build
cargo clean

# Check system dependencies
# Example: openssl requires libssl-dev on Ubuntu
sudo apt install libssl-dev pkg-config

# Try updating
cargo update -p failing-crate

# Check for platform-specific issues
```

## Dependency Hygiene

### Regular Maintenance

```bash
# Weekly
- [ ] cargo update
- [ ] cargo audit
- [ ] cargo test

# Monthly
- [ ] cargo outdated
- [ ] Review changelogs
- [ ] Update minor versions
- [ ] Clean unused dependencies

# Quarterly
- [ ] Major version updates
- [ ] Dependency tree audit
- [ ] Remove deprecated crates
- [ ] Optimize build times
```

### Remove Unused Dependencies

```bash
# Install cargo-udeps
cargo install cargo-udeps

# Find unused dependencies (nightly only)
cargo +nightly udeps

# Remove from Cargo.toml
```

### Minimize Dependency Count

**Before adding a dependency, ask**:
1. Is this really needed?
2. Can I implement this myself easily?
3. Is the crate well-maintained?
4. What are the transitive dependencies?

**Example**:
```bash
# Check what adding a crate brings
cargo tree -p proposed-crate

# If it brings 50 dependencies, reconsider
```

## Advanced: Cargo Patch

**Override dependencies**:

```toml
# Use forked version
[patch.crates-io]
tokio = { git = "https://github.com/your-fork/tokio", branch = "fix-issue" }

# Use local version
[patch.crates-io]
my-crate = { path = "../my-crate" }

# Override specific version
[patch.'https://github.com/org/repo']
crate-name = { path = "../crate-name" }
```

## Dependency CI/CD

### GitHub Actions

```yaml
name: Dependency Check

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  pull_request:
    paths:
      - 'Cargo.toml'
      - 'Cargo.lock'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install cargo tools
        run: |
          cargo install cargo-audit
          cargo install cargo-outdated

      - name: Check outdated
        run: cargo outdated --exit-code 1

      - name: Security audit
        run: cargo audit

      - name: Check for duplicates
        run: |
          cargo tree --duplicates | tee duplicates.txt
          [ ! -s duplicates.txt ] || exit 1
```

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "cargo"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "your-team"
    labels:
      - "dependencies"
      - "rust"

  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

## Dependency Documentation

**Document important dependencies**:

```markdown
# Dependencies

## Core
- **tokio** (1.35): Async runtime
- **serde** (1.0): Serialization
- **anyhow** (1.0): Error handling

## Security
- **rustls** (0.21): TLS implementation (instead of openssl)
- **argon2** (0.5): Password hashing

## Development
- **criterion** (0.5): Benchmarking
- **proptest** (1.0): Property testing

## Rationale

### Why rustls over openssl?
- Pure Rust (no C dependencies)
- Easier cross-compilation
- Better security track record
```

## Related Files

- **Cargo Config**: `Cargo.toml`, `Cargo.lock`
- **Workspace Config**: Root `Cargo.toml`
- **Package Config**: `package.json`, `package-lock.json`
- **Dependency Policy**: `deny.toml`

## Related Skills

- **Security Audit**: For vulnerability scanning
- **Rust Development**: For testing after updates
- **Project Setup**: For initial dependency setup
