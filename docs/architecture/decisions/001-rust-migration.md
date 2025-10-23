# ADR-001: Migrate from TypeScript to Rust

**Status**: ✅ Accepted
**Date**: 2025-08-15
**Deciders**: Core Team, Lead Architect
**Technical Story**: Related to Phase 4 - Rust Edition Migration

---

## Context

### Problem Statement

The original Miyabi implementation used TypeScript/Node.js for all components. As the system scaled to handle multiple concurrent agent executions and worktree operations, we encountered several limitations:

1. **Performance**: Node.js single-threaded event loop struggled with CPU-intensive operations (DAG computation, large file parsing)
2. **Memory Usage**: V8 heap limits and garbage collection pauses affected long-running orchestrator daemon
3. **Type Safety**: TypeScript's type system catches many errors, but runtime type coercion still caused production bugs
4. **Distribution**: Requiring Node.js + npm install for CLI was cumbersome for end users
5. **Concurrency**: True parallel execution required worker threads or child processes, adding complexity

### Constraints

- Must maintain backward compatibility with existing `.miyabi.yml` configs
- Must preserve all existing features and Agent specifications
- Migration must be incremental (not a rewrite from scratch)
- Must maintain or improve developer experience

### Assumptions

- Team has Rust experience or willing to learn
- Rust ecosystem has mature libraries for our needs (GitHub API, async runtime, etc.)
- Migration timeline: 12-16 weeks

---

## Decision

**Migrate all Miyabi core components from TypeScript to Rust 2021 Edition.**

### Implementation Details

**Cargo Workspace Structure**:
```
crates/
├── miyabi-types/           # Core type definitions
├── miyabi-core/            # Shared utilities
├── miyabi-cli/             # CLI binary
├── miyabi-agents/          # Agent implementations
├── miyabi-github/          # GitHub API wrapper
├── miyabi-worktree/        # Git worktree management
├── miyabi-llm/             # LLM abstractions
├── miyabi-knowledge/       # Qdrant + RAG
└── miyabi-mcp-server/      # MCP server
```

**Migration Strategy**:
1. **Phase 1**: Core types (`miyabi-types`)
2. **Phase 2**: CLI and utilities (`miyabi-cli`, `miyabi-core`)
3. **Phase 3**: GitHub integration (`miyabi-github`)
4. **Phase 4**: Agent system (`miyabi-agents`)
5. **Phase 5**: Advanced features (knowledge, MCP)

**Technology Choices**:
- **Async Runtime**: Tokio (industry standard, mature ecosystem)
- **GitHub API**: octocrab (most complete GitHub API wrapper)
- **CLI Framework**: clap v4 (derive macros, excellent error messages)
- **Error Handling**: thiserror + anyhow (idiomatic Rust patterns)
- **Serialization**: serde + serde_json (de facto standard)
- **HTTP**: reqwest (built on hyper, works with Tokio)

### Success Criteria

- ✅ All 26+ crates compile without warnings
- ✅ All tests passing (`cargo test --all`)
- ✅ CLI feature parity with TypeScript version
- ✅ Performance improvement ≥ 50% (agent execution time)
- ✅ Memory usage reduction ≥ 30%
- ✅ Single binary distribution (no Node.js required)

---

## Consequences

### Positive

- **🚀 Performance**: 50-60% faster agent execution, 40% faster DAG computation
- **📉 Memory**: 30-40% lower memory footprint, no GC pauses
- **🔒 Type Safety**: Compile-time guarantees eliminate entire classes of bugs
- **📦 Distribution**: Single binary, no dependencies, cross-compilation
- **⚡ Concurrency**: Native async/await with Tokio, true parallelism
- **🛡️ Safety**: Memory safety without GC, no null pointer errors
- **🔧 Tooling**: Cargo ecosystem, clippy, rust-analyzer excellent
- **📊 Observability**: Better control over metrics, tracing integration

### Negative

- **📚 Learning Curve**: Steeper for developers unfamiliar with Rust (estimated 2-4 weeks ramp-up)
- **⏱️ Compile Time**: Rust compilation slower than TypeScript (2-5 minutes for full rebuild)
- **🧩 Ecosystem**: Some TypeScript libraries don't have Rust equivalents (had to implement custom solutions)
- **🔧 Debugging**: Different debugging tools, some IDE integrations less mature
- **📝 Code Verbosity**: More boilerplate for some patterns (especially error handling)

### Neutral

- **🔄 Migration Effort**: 12-16 weeks estimated, actual: 14 weeks (within range)
- **📦 Binary Size**: Larger binaries (~20MB) vs Node.js scripts, but acceptable
- **🌍 Cross-Compilation**: Complex but worth it for multi-platform support

---

## Alternatives Considered

### Option 1: Stay with TypeScript

**Description**: Continue with TypeScript/Node.js, optimize performance

**Pros**:
- No migration cost
- Team already proficient
- Large ecosystem

**Cons**:
- Performance ceiling (V8 limits)
- Runtime type coercion bugs
- Distribution complexity (Node.js dependency)
- Concurrency limitations

**Why rejected**: Performance and safety improvements justify migration cost

### Option 2: Go

**Description**: Migrate to Go instead of Rust

**Pros**:
- Excellent concurrency (goroutines)
- Fast compilation
- Simple language, easy to learn
- Good GitHub API libraries

**Cons**:
- No enum pattern matching
- Weaker type system than Rust
- Garbage collection (though better than Node.js)
- No trait system (harder to design generic Agent interfaces)

**Why rejected**: Rust's type system better fits our domain model

### Option 3: Hybrid Approach

**Description**: Keep TypeScript for some components, Rust for performance-critical parts

**Pros**:
- Incremental migration
- Use best tool for each job

**Cons**:
- FFI complexity
- Two toolchains to maintain
- Harder to onboard developers
- Split ecosystem

**Why rejected**: Complexity outweighs benefits for our project size

---

## References

- **Migration Plan**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Performance Benchmarks**: `benchmarks/rust-vs-typescript.md`
- **Rust Book**: https://doc.rust-lang.org/book/
- **Tokio Tutorial**: https://tokio.rs/tokio/tutorial
- **Octocrab Docs**: https://docs.rs/octocrab/

---

## Notes

### Migration Timeline (Actual)

| Phase | Component | Weeks | Status |
|-------|-----------|-------|--------|
| 1 | Core Types | 2 | ✅ Complete |
| 2 | CLI + Utilities | 3 | ✅ Complete |
| 3 | GitHub Integration | 2 | ✅ Complete |
| 4 | Agent System | 4 | ✅ Complete |
| 5 | Advanced Features | 3 | ✅ Complete |
| **Total** | | **14 weeks** | ✅ Complete |

### Performance Improvements

**Agent Execution**:
- TypeScript: 52 seconds (average)
- Rust: 22 seconds (average)
- **Improvement**: 58% faster ✅

**Memory Usage**:
- TypeScript: 450 MB (orchestrator + 3 concurrent agents)
- Rust: 180 MB (orchestrator + 3 concurrent agents)
- **Improvement**: 60% reduction ✅

**Binary Size**:
- Rust release binary: 18.7 MB
- Node.js + dependencies: ~200 MB
- **Distribution**: 91% smaller package ✅

### Lessons Learned

1. **Start with Types**: Getting `miyabi-types` right was crucial, all other crates depend on it
2. **Tokio Ecosystem**: Using Tokio-compatible libraries (octocrab, reqwest) avoided many issues
3. **Error Handling**: Unified `MiyabiError` type from the start saved refactoring later
4. **Testing**: Property-based testing with `proptest` caught edge cases TypeScript tests missed
5. **Documentation**: Rustdoc comments forced better documentation than JSDoc

### Future Considerations

- ✅ **Compile Time**: Consider `sccache` for faster incremental compilation
- ✅ **Binary Size**: Investigate `strip` and `upx` for smaller binaries
- ⏳ **WASM**: Potential future target for browser-based tooling
- ⏳ **Async Traits**: Stabilized in Rust 1.75, can remove `async-trait` dependency

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, Senior Rust Developer, DevOps Lead
**Actual Outcome**: ✅ All success criteria met or exceeded
