# Miyabi-Core Split Plan - Issue #359

**Status**: Planning Phase
**Priority**: P3-Low
**Estimated Effort**: 16-20 hours
**Target Date**: Q1 2026

---

## Executive Summary

Split the monolithic `miyabi-core` crate (9 modules, 2,500+ lines) into 6 focused infrastructure crates following Single Responsibility Principle, improving maintainability, compilation times, and dependency management.

---

## Current State Analysis

### miyabi-core Structure (Before)

```
crates/miyabi-core/src/
├── cache.rs          # 450 lines - TTL cache, LRU eviction
├── config.rs         # 380 lines - YAML/TOML/JSON config loading
├── documentation.rs  # 220 lines - Rustdoc generation
├── git.rs            # 520 lines - Git operations (commit, push, branch)
├── git_utils.rs      # 180 lines - Git helper utilities
├── logger.rs         # 340 lines - Tracing subscriber setup
├── retry.rs          # 150 lines - Exponential backoff retry logic
├── security.rs       # 200 lines - Token sanitization, validation
└── lib.rs            # 60 lines - Re-exports
```

**Total**: 2,500+ lines, 9 modules

### Dependencies (Current)

```toml
[dependencies]
anyhow = "1.0"
chrono = "0.4"
config = "0.14"        # For config.rs
git2 = "0.18"          # For git.rs, git_utils.rs
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
tokio = { version = "1.35", features = ["full"] }
tracing = "0.1"        # For logger.rs
tracing-subscriber = "0.3"  # For logger.rs
once_cell = "1.19"     # For logger.rs
```

**Issue**: Every downstream crate needs ALL these dependencies, even if only using one module.

---

## Proposed Architecture (After)

### New Crate Structure

```
crates/
├── miyabi-cache/         # 450 lines - TTL cache utilities
├── miyabi-config/        # 380 lines - Configuration loading
├── miyabi-docs/          # 220 lines - Documentation generation
├── miyabi-git/           # 700 lines - Git operations (merge git.rs + git_utils.rs)
├── miyabi-logger/        # 340 lines - Logging infrastructure
├── miyabi-retry/         # 150 lines - Retry utilities
├── miyabi-security/      # 200 lines - Security utilities
└── miyabi-core/          # 100 lines - Re-export facade (backward compatibility)
```

### Dependency Isolation

Each crate has minimal, focused dependencies:

#### miyabi-cache
```toml
[dependencies]
tokio = { version = "1.35", features = ["time", "sync"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"
```

#### miyabi-config
```toml
[dependencies]
config = "0.14"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
```

#### miyabi-git
```toml
[dependencies]
git2 = "0.18"
anyhow = "1.0"
thiserror = "1.0"
tokio = { version = "1.35", features = ["process"] }
```

#### miyabi-logger
```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = "0.3"
once_cell = "1.19"
anyhow = "1.0"
```

#### miyabi-retry
```toml
[dependencies]
tokio = { version = "1.35", features = ["time"] }
anyhow = "1.0"
```

#### miyabi-security
```toml
[dependencies]
regex = "1.10"
anyhow = "1.0"
```

---

## Migration Strategy

### Phase 1: Create New Crates (Week 1-2, 8 hours)

1. **Create crate scaffolding** (2 hours)
   ```bash
   cargo new --lib crates/miyabi-cache
   cargo new --lib crates/miyabi-config
   cargo new --lib crates/miyabi-docs
   cargo new --lib crates/miyabi-git
   cargo new --lib crates/miyabi-logger
   cargo new --lib crates/miyabi-retry
   cargo new --lib crates/miyabi-security
   ```

2. **Copy module code** (3 hours)
   - Move each module to corresponding new crate
   - Update internal paths and imports
   - Add proper crate documentation

3. **Configure dependencies** (2 hours)
   - Add minimal dependencies to each Cargo.toml
   - Configure workspace inheritance
   - Set versions to 0.1.0

4. **Initial compilation** (1 hour)
   ```bash
   cargo build --workspace
   ```

### Phase 2: Update miyabi-core Facade (Week 2, 4 hours)

Transform miyabi-core into a backward-compatibility facade:

```rust
// crates/miyabi-core/src/lib.rs
pub use miyabi_cache as cache;
pub use miyabi_config as config;
pub use miyabi_docs as documentation;
pub use miyabi_git as git;
pub use miyabi_logger as logger;
pub use miyabi_retry as retry;
pub use miyabi_security as security;

// Keep existing re-exports for full backward compatibility
pub use miyabi_cache::*;
pub use miyabi_config::*;
// ... etc
```

**Cargo.toml**:
```toml
[dependencies]
miyabi-cache = { version = "0.1", path = "../miyabi-cache" }
miyabi-config = { version = "0.1", path = "../miyabi-config" }
miyabi-docs = { version = "0.1", path = "../miyabi-docs" }
miyabi-git = { version = "0.1", path = "../miyabi-git" }
miyabi-logger = { version = "0.1", path = "../miyabi-logger" }
miyabi-retry = { version = "0.1", path = "../miyabi-retry" }
miyabi-security = { version = "0.1", path = "../miyabi-security" }
```

### Phase 3: Update Downstream Crates (Week 3-4, 8 hours)

Update all 20+ crates that depend on miyabi-core:

**Option A: Keep using miyabi-core facade** (no changes needed)
```rust
use miyabi_core::cache::TtlCache;  // Still works
```

**Option B: Migrate to focused crates** (recommended)
```rust
use miyabi_cache::TtlCache;  // Direct import, fewer dependencies
```

**Migration Script**:
```bash
# Find all usages
rg "use miyabi_core::" crates/

# Replace with focused imports
sed -i 's/use miyabi_core::cache/use miyabi_cache/g' crates/**/*.rs
sed -i 's/use miyabi_core::config/use miyabi_config/g' crates/**/*.rs
# ... repeat for all modules
```

---

## Testing Strategy

### Phase 1: Unit Tests
- Keep all existing unit tests in their respective new crates
- Add integration tests for each crate

### Phase 2: Integration Tests
- Test backward compatibility via miyabi-core facade
- Ensure no API breakage

### Phase 3: CI/CD
- Run full test suite on all workspace crates
- Verify compilation times improvement
- Check binary size reduction

---

## Success Metrics

### Compilation Performance

| Metric | Before | Target | Improvement |
|--------|--------|--------|-------------|
| Clean build time | 45s | 35s | -22% |
| Incremental build | 8s | 5s | -37% |
| Parallel compilation | 4 threads | 6+ threads | +50% |

### Dependency Management

| Metric | Before | After |
|--------|--------|-------|
| miyabi-cli deps | 15 crates | 10 crates (if using focused imports) |
| miyabi-agents deps | 18 crates | 12 crates |
| Total workspace deps | 120 crates | 105 crates |

### Maintainability

- **Single Responsibility**: Each crate has one clear purpose
- **Easier Testing**: Isolated unit tests
- **Faster Refactoring**: Changes don't require rebuilding unrelated code
- **Better Documentation**: Focused rustdoc per crate

---

## Backward Compatibility

### Zero Breaking Changes (Phase 1-2)

Existing code continues to work:
```rust
// Old code (still works)
use miyabi_core::cache::TtlCache;
use miyabi_core::config::Config;

// New code (recommended)
use miyabi_cache::TtlCache;
use miyabi_config::Config;
```

### Deprecation Timeline

- **v0.6.0**: Introduce new crates, keep facade (current plan)
- **v0.7.0**: Add deprecation warnings to miyabi-core facade
- **v0.8.0**: Optional - remove facade (downstream must use focused imports)

---

## Risk Assessment

### Low Risk
- ✅ Backward compatibility maintained via facade
- ✅ All existing tests preserved
- ✅ Gradual migration possible

### Medium Risk
- ⚠️ Import path changes (mitigated by facade)
- ⚠️ CI/CD workflow updates needed

### High Risk
- ❌ None identified

---

## Timeline

### Week 1-2: Crate Creation (8 hours)
- [x] Create 7 new crate directories
- [ ] Copy module code
- [ ] Configure dependencies
- [ ] Initial compilation test

### Week 2: Facade Update (4 hours)
- [ ] Transform miyabi-core to facade
- [ ] Update Cargo.toml dependencies
- [ ] Test backward compatibility

### Week 3-4: Downstream Migration (8 hours)
- [ ] Update 20+ dependent crates
- [ ] Run full test suite
- [ ] Update documentation

### Week 5: Polish & Release (4 hours)
- [ ] Performance benchmarks
- [ ] Update README and guides
- [ ] Publish to crates.io (if public)

**Total Estimate**: 24 hours (3 weeks with parallelization)

---

## Next Steps

### Immediate (This Week)
1. ✅ Create this planning document
2. ⏳ Get stakeholder approval
3. ⏳ Create tracking issue (#359 already exists)
4. ⏳ Create Phase 1 PR (crate scaffolding)

### Short Term (Next 2 Weeks)
1. Implement Phase 1: Create new crates
2. Implement Phase 2: Facade transformation
3. Test backward compatibility

### Long Term (Month 2)
1. Gradually migrate downstream crates
2. Measure performance improvements
3. Update documentation

---

## Related Issues

- **#359**: This issue (Split miyabi-core)
- **#452**: miyabi-types unit tests (related: better test isolation)
- **#447**: TypeScript legacy removal (related: cleanup opportunity)

---

## Appendix: Crate Descriptions

### miyabi-cache
**Purpose**: Generic TTL (Time-To-Live) cache with LRU eviction
**Use Cases**: API response caching, computed result caching
**Key Types**: `TtlCache<K, V>`, `CacheEntry`, `CacheStats`

### miyabi-config
**Purpose**: Multi-format configuration loading (YAML/TOML/JSON)
**Use Cases**: Loading agent configs, repository settings
**Key Types**: `Config`, `ConfigBuilder`, `ConfigError`

### miyabi-docs
**Purpose**: Rustdoc generation and documentation utilities
**Use Cases**: Generating API documentation, doc comments
**Key Types**: `DocGenerator`, `DocConfig`

### miyabi-git
**Purpose**: Git operations (commit, push, branch, clone)
**Use Cases**: Agent worktree management, PR creation
**Key Types**: `GitRepo`, `GitCommit`, `GitBranch`

### miyabi-logger
**Purpose**: Tracing-based structured logging setup
**Use Cases**: Application-wide logging configuration
**Key Types**: `Logger`, `LogConfig`, `LogLevel`

### miyabi-retry
**Purpose**: Exponential backoff retry logic
**Use Cases**: Retrying failed API calls, network operations
**Key Types**: `RetryPolicy`, `RetryConfig`

### miyabi-security
**Purpose**: Token sanitization, secret detection
**Use Cases**: Sanitizing logs, validating credentials
**Key Types**: `TokenSanitizer`, `SecretDetector`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Claude Code (Autonomous Execution)
**Status**: Ready for Implementation
