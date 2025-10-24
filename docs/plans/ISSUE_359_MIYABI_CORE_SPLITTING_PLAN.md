# Issue #359: Split miyabi-core into Focused Infrastructure Crates

**Status**: Planning Complete
**Priority**: P3 (Medium)
**Milestone**: #34 (Super-Aggressive Execution Mode)
**Estimated Effort**: 2-3 days
**Risk Level**: Medium

---

## Executive Summary

`miyabi-core` has grown to 3,376 lines of code across 9 modules with diverse responsibilities. This violates the Single Responsibility Principle and creates unnecessary coupling. This plan proposes splitting it into 6 focused infrastructure crates.

**Key Benefits**:
- Clearer separation of concerns
- Reduced compile times
- Better testability in isolation
- Improved reusability
- Follows Cargo best practices

---

## Current State Analysis

### Module Breakdown

| Module | Lines | Purpose | Key Dependencies |
|--------|-------|---------|------------------|
| `config.rs` | 537 | Configuration (YAML/TOML/JSON/env) | serde_yaml, toml, dirs |
| `documentation.rs` | 526 | Doc generation, README templates | validator |
| `rules.rs` | 491 | .miyabirules support (Cline-like) | serde_yaml |
| `security.rs` | 490 | cargo-audit integration | - |
| `retry.rs` | 421 | Retry logic with backoff | tokio, futures |
| `logger.rs` | 318 | Structured logging | tracing, tracing-subscriber |
| `git/mod.rs` | 292 | Git utilities | git2 |
| `cache.rs` | 264 | TTL cache for LLM/Agent results | tokio::sync |
| `lib.rs` | 37 | Public API | - |
| **Total** | **3,376** | | |

### Dependency Analysis

**15 crates depend on miyabi-core**:
- `miyabi-agent-codegen` (4 usages)
- `miyabi-agent-review` (4 usages)
- `miyabi-cli` (3 usages)
- `miyabi-worktree` (3 usages)
- `miyabi-agent-core` (2 usages)
- 10+ other crates

**Most used imports**:
- `miyabi_core::logger::*` (logging setup)
- `miyabi_core::config::*` (config loading)
- `miyabi_core::git::*` (repo discovery)
- `miyabi_core::rules::*` (rules loading)

---

## Proposed Architecture

### New Crate Structure

```
crates/
├── miyabi-config/        # Configuration management
├── miyabi-logging/       # Logging infrastructure
├── miyabi-git/           # Git operations (MAY CONFLICT - check existing!)
├── miyabi-cache/         # Caching utilities
├── miyabi-devtools/      # Development tools (docs, security, rules)
└── miyabi-retry/         # Retry logic utilities
```

### Crate Specifications

---

#### 1. miyabi-config

**Purpose**: Configuration management for YAML/TOML/JSON/env variables

**Size**: ~537 lines
**Module Origin**: `config.rs`

**Public API**:
```rust
pub struct Config {
    pub github_token: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub device_identifier: String,
    pub log_level: String,
    // ... other fields
}

impl Config {
    pub fn load() -> Result<Self>
    pub fn from_yaml(path: &Path) -> Result<Self>
    pub fn from_toml(path: &Path) -> Result<Self>
    pub fn from_env() -> Result<Self>
    pub fn with_defaults() -> Self
}
```

**Dependencies**:
```toml
[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
serde = { workspace = true, features = ["derive"] }
serde_yaml = "0.9"
toml = "0.9"
dirs = "6.0"
hostname = "0.4"
validator = { version = "0.20", features = ["derive"] }
```

**Migration Impact**: HIGH (15 crates use this)

---

#### 2. miyabi-logging

**Purpose**: Structured logging with multiple output formats

**Size**: ~318 lines
**Module Origin**: `logger.rs`

**Public API**:
```rust
pub enum LogLevel { Debug, Info, Warn, Error }
pub enum LogFormat { Pretty, Compact, Json }

pub struct LoggerConfig {
    pub level: LogLevel,
    pub format: LogFormat,
    pub log_dir: Option<PathBuf>,
}

pub fn init_logger(level: LogLevel) -> Result<()>
pub fn init_logger_with_config(config: LoggerConfig) -> Result<()>
```

**Dependencies**:
```toml
[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
tracing = { workspace = true }
tracing-subscriber = { workspace = true, features = ["env-filter", "json"] }
tracing-appender = "0.2"
once_cell = "1.19"
chrono = { workspace = true }
```

**Migration Impact**: HIGH (logging is used everywhere)

---

#### 3. miyabi-git (⚠️ CONFLICT WARNING)

**Purpose**: Git repository operations and utilities

**Size**: ~292 lines
**Module Origin**: `git/mod.rs`

**⚠️ CRITICAL**: There is already a `miyabi-github` crate at `crates/miyabi-github/`

**Conflict Resolution Options**:

**Option A**: Rename to `miyabi-git-utils` or `miyabi-git-core`
**Option B**: Merge into existing `miyabi-github` as a `local` module
**Option C**: Keep as `miyabi-git` (low-level) vs `miyabi-github` (GitHub API)

**Recommendation**: **Option C** - Keep separate
- `miyabi-git`: Low-level Git operations (git2 wrapper)
- `miyabi-github`: GitHub API integration (octocrab wrapper)

**Public API**:
```rust
pub fn find_git_root(start_path: Option<&Path>) -> Result<PathBuf>
pub fn is_valid_repository(path: impl AsRef<Path>) -> bool
pub fn is_in_git_repo(path: impl AsRef<Path>) -> bool
pub fn get_current_branch(repo_path: impl AsRef<Path>) -> Result<String>
pub fn get_main_branch(repo_path: impl AsRef<Path>) -> Result<String>
pub fn has_uncommitted_changes(repo_path: impl AsRef<Path>) -> Result<bool>
```

**Dependencies**:
```toml
[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
git2 = { workspace = true }
```

**Migration Impact**: MEDIUM (3 crates use git functions)

---

#### 4. miyabi-cache

**Purpose**: TTL-based caching for LLM responses and Agent results

**Size**: ~264 lines
**Module Origin**: `cache.rs`

**Public API**:
```rust
pub struct TTLCache<K, V> { /* ... */ }
pub struct CacheEntry<T> { /* ... */ }
pub struct CacheStats { /* ... */ }

pub type LLMCache = TTLCache<LLMCacheKey, String>;
pub type BusinessAgentCache = TTLCache<BusinessAgentCacheKey, String>;

pub fn create_llm_cache() -> LLMCache
pub fn create_business_agent_cache() -> BusinessAgentCache
```

**Dependencies**:
```toml
[dependencies]
serde = { workspace = true, features = ["derive"] }
tokio = { workspace = true }

[dev-dependencies]
tokio = { workspace = true, features = ["test-util"] }
```

**Migration Impact**: LOW (used mainly in LLM/Agent code)

---

#### 5. miyabi-devtools

**Purpose**: Development tools (documentation, security, rules)

**Size**: ~1,507 lines (documentation.rs + security.rs + rules.rs)
**Module Origins**: `documentation.rs`, `security.rs`, `rules.rs`

**Public API**:
```rust
// Documentation
pub fn generate_readme(config: &DocumentationConfig) -> Result<DocumentationResult>
pub fn generate_rustdoc(config: &DocumentationConfig) -> Result<DocumentationResult>
pub struct CodeExample { /* ... */ }
pub struct ReadmeTemplate { /* ... */ }

// Security
pub fn run_cargo_audit(repo_path: &Path) -> Result<SecurityAuditResult>
pub struct Vulnerability { /* ... */ }
pub enum VulnerabilitySeverity { Critical, High, Medium, Low }

// Rules (.miyabirules support)
pub struct MiyabiRules { /* ... */ }
pub struct RulesLoader { /* ... */ }
pub struct AgentPreferences { /* ... */ }
```

**Dependencies**:
```toml
[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
serde = { workspace = true, features = ["derive"] }
serde_yaml = "0.9"
serde_json = { workspace = true }
validator = { version = "0.20", features = ["derive"] }
thiserror = { workspace = true }

[dev-dependencies]
tempfile = "3.8"
```

**Migration Impact**: LOW (developer-focused tools)

---

#### 6. miyabi-retry

**Purpose**: Retry logic with exponential backoff

**Size**: ~421 lines
**Module Origin**: `retry.rs`

**Public API**:
```rust
pub struct RetryConfig {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
    pub jitter: bool,
}

pub async fn retry_with_backoff<F, T, E>(
    config: &RetryConfig,
    operation: F,
) -> Result<T, E>
where
    F: Fn() -> futures::future::BoxFuture<'static, Result<T, E>>;

pub fn is_retryable(error: &impl std::error::Error) -> bool
```

**Dependencies**:
```toml
[dependencies]
tokio = { workspace = true }
futures = "0.3"
tracing = { workspace = true }
```

**Migration Impact**: MEDIUM (network operations, LLM calls)

---

## Migration Strategy

### Phase 1: Create miyabi-config (Day 1, Morning)

**Estimated Time**: 2 hours

1. Create `crates/miyabi-config/`
2. Copy `config.rs` → `src/lib.rs`
3. Set up Cargo.toml with dependencies
4. Run tests: `cargo test -p miyabi-config`
5. Update documentation

**Files to Modify**: 15 crates that import `miyabi_core::config::*`

**Migration Command**:
```rust
// Old
use miyabi_core::{Config};

// New
use miyabi_config::Config;
```

---

### Phase 2: Create miyabi-logging (Day 1, Afternoon)

**Estimated Time**: 2 hours

1. Create `crates/miyabi-logging/`
2. Copy `logger.rs` → `src/lib.rs`
3. Set up Cargo.toml with dependencies
4. Run tests: `cargo test -p miyabi-logging`
5. Update documentation

**Files to Modify**: 15+ crates (logging is used everywhere)

**Migration Command**:
```rust
// Old
use miyabi_core::{init_logger, LogLevel};

// New
use miyabi_logging::{init_logger, LogLevel};
```

---

### Phase 3: Create miyabi-git, miyabi-cache, miyabi-retry (Day 2, Morning)

**Estimated Time**: 3 hours

1. Create all 3 crates simultaneously
2. Copy source files
3. Set up Cargo.toml files
4. Run tests: `cargo test -p miyabi-git -p miyabi-cache -p miyabi-retry`
5. Update documentation

**Files to Modify**: ~8 crates

**Migration Commands**:
```rust
// Old
use miyabi_core::git::{find_git_root, get_current_branch};
use miyabi_core::cache::{create_llm_cache};
use miyabi_core::retry::{retry_with_backoff};

// New
use miyabi_git::{find_git_root, get_current_branch};
use miyabi_cache::create_llm_cache;
use miyabi_retry::retry_with_backoff;
```

---

### Phase 4: Create miyabi-devtools (Day 2, Afternoon)

**Estimated Time**: 2 hours

1. Create `crates/miyabi-devtools/`
2. Create module structure:
   ```
   src/
   ├── lib.rs
   ├── documentation.rs
   ├── security.rs
   └── rules.rs
   ```
3. Copy source files
4. Set up Cargo.toml with dependencies
5. Run tests: `cargo test -p miyabi-devtools`
6. Update documentation

**Files to Modify**: ~5 crates (mostly developer tools)

**Migration Commands**:
```rust
// Old
use miyabi_core::{generate_readme, run_cargo_audit, MiyabiRules};

// New
use miyabi_devtools::{generate_readme, run_cargo_audit, MiyabiRules};
```

---

### Phase 5: Update All Dependents (Day 3, Morning)

**Estimated Time**: 3 hours

**Affected Crates** (15 total):
1. miyabi-agent-codegen
2. miyabi-agent-review
3. miyabi-cli
4. miyabi-worktree
5. miyabi-agent-core
6. miyabi-agent-coordinator
7. miyabi-agent-deployment
8. miyabi-agent-issue
9. miyabi-agent-pr
10. miyabi-agent-refresher
11. miyabi-mcp-server
12. miyabi-knowledge
13. miyabi-benchmarks
14. miyabi-web-api
15. miyabi-orchestrator

**Update Process**:
1. Update `Cargo.toml` dependencies
2. Update `use` statements
3. Run `cargo check` after each crate
4. Run `cargo test` for integration tests

**Automated Migration Script**:
```bash
#!/bin/bash
# migrate_imports.sh

# Replace imports across all crates
find crates -name "*.rs" -type f -exec sed -i '' \
  -e 's/use miyabi_core::Config/use miyabi_config::Config/g' \
  -e 's/use miyabi_core::{init_logger/use miyabi_logging::{init_logger/g' \
  -e 's/use miyabi_core::git::/use miyabi_git::/g' \
  -e 's/use miyabi_core::cache::/use miyabi_cache::/g' \
  -e 's/use miyabi_core::retry::/use miyabi_retry::/g' \
  -e 's/use miyabi_core::{generate_readme/use miyabi_devtools::{generate_readme/g' \
  -e 's/use miyabi_core::{run_cargo_audit/use miyabi_devtools::{run_cargo_audit/g' \
  -e 's/use miyabi_core::{MiyabiRules/use miyabi_devtools::{MiyabiRules/g' \
  {} \;

echo "Import migration complete. Run 'cargo check --all' to verify."
```

---

### Phase 6: Deprecate miyabi-core (Day 3, Afternoon)

**Estimated Time**: 1 hour

1. Update `crates/miyabi-core/Cargo.toml`:
   ```toml
   [package]
   name = "miyabi-core"
   version = "0.2.0"  # Bump version
   deprecated = true
   ```

2. Update `crates/miyabi-core/src/lib.rs`:
   ```rust
   #![deprecated(
       since = "0.2.0",
       note = "miyabi-core has been split into focused crates. \
               Use miyabi-config, miyabi-logging, miyabi-git, \
               miyabi-cache, miyabi-devtools, or miyabi-retry instead."
   )]

   // Re-export for backward compatibility (temporary)
   pub use miyabi_config as config;
   pub use miyabi_logging as logger;
   pub use miyabi_git as git;
   pub use miyabi_cache as cache;
   pub use miyabi_devtools as devtools;
   pub use miyabi_retry as retry;
   ```

3. Add migration guide: `docs/migrations/MIYABI_CORE_SPLIT.md`

4. Update CHANGELOG.md

5. **Keep crate for 2 releases** (v0.2.0, v0.3.0) then remove in v0.4.0

---

### Phase 7: CI/CD Updates (Day 3, Final)

**Estimated Time**: 1 hour

1. Update `.github/workflows/rust.yml`:
   ```yaml
   - name: Test all infrastructure crates
     run: |
       cargo test -p miyabi-config
       cargo test -p miyabi-logging
       cargo test -p miyabi-git
       cargo test -p miyabi-cache
       cargo test -p miyabi-devtools
       cargo test -p miyabi-retry
   ```

2. Update Clippy checks to include new crates

3. Update coverage reporting

4. Update documentation generation

---

## Dependency Graph

```
miyabi-types (base types)
    ↓
┌───┴────┬────────┬─────────┬─────────┬──────────┐
│        │        │         │         │          │
config   logging  git      cache    devtools   retry
│        │        │         │         │          │
└────────┴────────┴─────────┴─────────┴──────────┘
                    ↓
          All Agent crates, CLI, etc.
```

**Key Points**:
- All new crates depend on `miyabi-types` only
- No circular dependencies
- Clean separation of concerns

---

## Testing Strategy

### Unit Tests
- Each crate maintains its existing tests
- All tests must pass: `cargo test -p <crate-name>`

### Integration Tests
- Create `tests/integration/core_split.rs` to test cross-crate integration
- Test common patterns:
  ```rust
  #[tokio::test]
  async fn test_full_stack() {
      let config = miyabi_config::Config::load().unwrap();
      miyabi_logging::init_logger(LogLevel::Info).unwrap();
      let repo_root = miyabi_git::find_git_root(None).unwrap();
      // ... etc
  }
  ```

### Regression Tests
- Run full test suite: `cargo test --all`
- Run benchmarks: `cargo bench`
- Verify no performance degradation

---

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback** (< 1 hour):
   - Revert all Cargo.toml changes
   - Keep new crates but don't use them
   - Use `miyabi-core` backward compatibility exports

2. **Partial Rollback** (< 2 hours):
   - Keep successfully migrated crates
   - Rollback problematic crates
   - Update dependency graph

3. **Full Rollback** (< 4 hours):
   - Delete new crate directories
   - Restore original `miyabi-core`
   - Revert all import changes
   - Run `cargo clean && cargo build --all`

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Compilation errors during migration | Medium | High | Automated import migration script, incremental testing |
| Circular dependencies | Low | High | Careful dependency graph design, no cross-crate imports |
| Performance regression | Low | Medium | Benchmark before/after, inlining critical paths |
| Test failures | Medium | Medium | Comprehensive test suite, integration tests |
| CI/CD pipeline breakage | Low | High | Update CI config first, test in PR |
| Documentation gaps | Medium | Low | Generate docs for each crate, update guides |

---

## Success Criteria

- [ ] All 6 new crates created with proper structure
- [ ] All tests pass: `cargo test --all`
- [ ] No Clippy warnings: `cargo clippy --all-targets`
- [ ] Documentation complete for each crate
- [ ] All 15 dependent crates migrated successfully
- [ ] CI/CD pipeline green
- [ ] No performance regression (< 5% slower)
- [ ] Backward compatibility maintained in miyabi-core v0.2.0
- [ ] Migration guide published

---

## Post-Migration Benefits

### Compile Time Improvements
**Before**: Building miyabi-core compiles all 9 modules
**After**: Only compile what you need

**Example**:
- Agent using only config: 537 lines instead of 3,376 lines (-84%)
- Agent using only logging: 318 lines instead of 3,376 lines (-91%)

### Test Execution Time
**Before**: Test miyabi-core runs all 9 module tests
**After**: `cargo test -p miyabi-config` runs only config tests

### Maintainability
- Each crate has single responsibility
- Easier to onboard new contributors
- Clear ownership boundaries

### Reusability
- External projects can depend on specific crates
- Example: Use `miyabi-retry` in non-Miyabi projects

---

## Timeline Summary

| Day | Phase | Tasks | Duration |
|-----|-------|-------|----------|
| **Day 1 AM** | Phase 1 | Create miyabi-config | 2h |
| **Day 1 PM** | Phase 2 | Create miyabi-logging | 2h |
| **Day 2 AM** | Phase 3 | Create miyabi-git, cache, retry | 3h |
| **Day 2 PM** | Phase 4 | Create miyabi-devtools | 2h |
| **Day 3 AM** | Phase 5 | Migrate all dependents | 3h |
| **Day 3 PM** | Phase 6 & 7 | Deprecate core, update CI | 2h |
| **Total** | | | **14 hours** |

**Estimated Calendar Time**: 2-3 days (accounting for testing, reviews, breaks)

---

## Next Steps

1. **Approval**: Get stakeholder approval for this plan
2. **Branch**: Create feature branch `feat/split-miyabi-core-#359`
3. **Execution**: Follow phases 1-7 sequentially
4. **PR**: Create PR with comprehensive description
5. **Review**: Code review by team
6. **Merge**: Merge to main after CI passes
7. **Release**: Publish new crates to crates.io (if public)

---

## References

- Issue: #359
- Milestone: #34 (Super-Aggressive Execution Mode)
- Related Issues: None (foundational refactoring)
- Rust Best Practices: https://doc.rust-lang.org/cargo/guide/project-layout.html
- Cargo Workspace: https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html

---

**Plan Created**: 2025-10-24
**Plan Status**: Ready for Execution
**Estimated Completion**: 2025-10-27 (3 days from start)
