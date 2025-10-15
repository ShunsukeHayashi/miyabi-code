# Miyabi Versioning Strategy

Version numbering strategy for Miyabi project (TypeScript & Rust editions).

## Current Situation

**TypeScript Edition** (Legacy):
- npm package: `miyabi`
- Versions released: v0.1.0 → v0.15.0
- Status: Active development, npm published

**Rust Edition** (New):
- crates.io packages: `miyabi-types`, `miyabi-core`, `miyabi-github`, `miyabi-worktree`, `miyabi-agents`, `miyabi-cli`
- Current version: 0.1.0 (not yet published)
- Status: Production ready (Phase 1-9 complete)

## Versioning Conflict

**Problem**: v0.1.0 is already used by TypeScript edition in git tags.

**Options**:

### Option 1: Use v1.0.0 for Rust Edition (RECOMMENDED) ✅

**Rationale**:
- Signifies production readiness
- Major milestone (complete rewrite)
- Clear distinction from TypeScript edition
- Follows semantic versioning (1.0.0 = first stable release)

**Git Tags**:
- TypeScript: v0.1.0 → v0.15.0
- Rust: v1.0.0 → v1.x.x

**crates.io Versions**:
- All 6 crates: 1.0.0

**Pros**:
- ✅ Clear separation
- ✅ Indicates production stability
- ✅ Aligns with Rust community standards (1.0.0 = stable API)
- ✅ No version conflicts

**Cons**:
- ⚠️ Might confuse users about "major version jump"

---

### Option 2: Use v0.2.0 for Rust Edition

**Rationale**:
- Continues from TypeScript version numbering
- Indicates evolutionary improvement

**Git Tags**:
- TypeScript: v0.1.0 → v0.15.0
- Rust: v0.2.0 → v0.x.x

**crates.io Versions**:
- All 6 crates: 0.2.0

**Pros**:
- ✅ Logical continuation
- ✅ Indicates not yet "1.0 stable"

**Cons**:
- ❌ Doesn't reflect production readiness
- ❌ Less clear distinction from TypeScript

---

### Option 3: Use Suffix Tags (v0.1.0-rust)

**Rationale**:
- Keeps version number same as TypeScript
- Uses suffix to distinguish editions

**Git Tags**:
- TypeScript: v0.1.0, v0.2.0, ...
- Rust: v0.1.0-rust, v0.2.0-rust, ...

**crates.io Versions**:
- All 6 crates: 0.1.0

**Pros**:
- ✅ Parallel versioning possible
- ✅ Clear edition distinction

**Cons**:
- ❌ Suffix tags less common in Rust ecosystem
- ❌ More complex to manage

---

## RECOMMENDED STRATEGY: v1.0.0 ✅

### Justification

1. **Production Ready**: All 9 phases complete, 347 tests passing, comprehensive documentation
2. **Stable API**: All public APIs are well-designed and documented
3. **Rust Community Standards**: 1.0.0 signals stable, production-ready crates
4. **Clear Messaging**: "Miyabi 1.0 Rust Edition" is a strong launch message
5. **No Conflicts**: TypeScript uses 0.x.x, Rust uses 1.x.x

### Implementation Plan

**Step 1**: Update workspace version to 1.0.0
```toml
[workspace.package]
version = "1.0.0"
```

**Step 2**: Create git tag
```bash
git tag -a v1.0.0 -m "Release v1.0.0 - Miyabi Rust Edition Production Release"
git push origin v1.0.0
```

**Step 3**: Publish to crates.io (all crates at 1.0.0)
```bash
cd crates/miyabi-types && cargo publish
cd ../miyabi-core && cargo publish
cd ../miyabi-worktree && cargo publish
cd ../miyabi-github && cargo publish
cd ../miyabi-agents && cargo publish
cd ../miyabi-cli && cargo publish
```

**Step 4**: Create GitHub Release
- Title: "v1.0.0 - Miyabi Rust Edition - Production Release"
- Binaries for Linux/macOS/Windows

---

## Future Versioning

### Rust Edition (1.x.x)

Following Semantic Versioning 2.0.0:

**Patch releases (1.0.x)**:
- Bug fixes
- Documentation updates
- Performance improvements
- No API changes

**Minor releases (1.x.0)**:
- New features (backward compatible)
- New agents
- Enhanced functionality
- API additions (no breaking changes)

**Major releases (x.0.0)**:
- Breaking API changes
- Major architectural changes
- Incompatible updates

### TypeScript Edition (0.x.x)

**Status**: Maintenance mode after Rust 1.0.0 release

- Bug fixes only
- Security updates
- No new features
- Eventual deprecation (12-month timeline)

---

## Migration Communication

### For Users

**Message**: "Miyabi 1.0 Rust Edition is the future of Miyabi. TypeScript edition remains supported for 12 months."

**Migration Path**:
1. TypeScript: v0.15.0 (current)
2. Rust: v1.0.0 (recommended for new projects)
3. Migration guide available: [RUST_MIGRATION_GUIDE.md](RUST_MIGRATION_GUIDE.md)

### For Contributors

**Message**: "All new development happens in Rust edition (1.x.x branch)."

**Contribution Target**:
- TypeScript: Bug fixes only (0.x.x branch)
- Rust: New features + bug fixes (1.x.x branch, main)

---

## Version Compatibility Matrix

| TypeScript | Rust | Status | Recommendation |
|------------|------|--------|----------------|
| v0.1.0 - v0.15.0 | - | Legacy | Migrate to Rust 1.0.0 |
| - | v1.0.0+ | Current | **Use for all new projects** |

---

## Decision: Use v1.0.0 ✅

**Date**: 2025-10-15
**Approved by**: Miyabi Development Team
**Rationale**: Production ready, stable API, Rust community standards

**Action Items**:
1. ✅ Update Cargo.toml workspace version to 1.0.0
2. ⏳ Create git tag v1.0.0
3. ⏳ Publish to crates.io
4. ⏳ Create GitHub Release
5. ⏳ Update documentation
6. ⏳ Announce on social media

---

**Last Updated**: 2025-10-15
**Status**: ✅ **APPROVED**
**Next Version**: 1.0.0
