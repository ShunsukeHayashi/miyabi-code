---
name: Rust Development Workflow
description: Execute comprehensive Rust development workflow including cargo build, test, clippy, and fmt. Use when compiling, testing, or checking Rust code quality in the Miyabi project.
allowed-tools: Bash, Read, Grep, Glob
---

# Rust Development Workflow

Complete Rust development workflow for the Miyabi project, ensuring code quality, type safety, and comprehensive testing.

## When to Use

- User requests "build the project", "run tests", "check code quality"
- Before committing Rust code changes
- After implementing new features in Rust crates
- When troubleshooting compilation or test failures

## Workflow Steps

### 1. Clean Build
```bash
cargo clean
cargo build --workspace
```

### 2. Run All Tests
```bash
cargo test --workspace --all-features
```

### 3. Lint with Clippy
```bash
cargo clippy --workspace --all-targets --all-features -- -D warnings
```

### 4. Format Check
```bash
cargo fmt --all -- --check
```

If format check fails, apply formatting:
```bash
cargo fmt --all
```

### 5. Release Build (optional)
```bash
cargo build --release --workspace
```

### 6. Check Documentation
```bash
cargo doc --workspace --no-deps --all-features
```

## Project-Specific Considerations

### Workspace Structure
The Miyabi project uses Cargo workspace with these crates:
- `miyabi-types`: Core type definitions
- `miyabi-core`: Common utilities
- `miyabi-cli`: CLI binary
- `miyabi-agents`: Agent implementations
- `miyabi-github`: GitHub API integration
- `miyabi-worktree`: Git Worktree management
- `miyabi-llm`: LLM provider abstraction

### Dependencies to Check
- `tokio`: Async runtime (ensure features match)
- `async-trait`: Trait async methods
- `serde`: Serialization (ensure derive feature)
- `octocrab`: GitHub API
- `tracing`: Logging

### Common Issues

**Issue**: Compilation fails with trait errors
**Solution**: Check `async-trait` usage and ensure all async traits are properly annotated

**Issue**: Test failures in parallel execution
**Solution**: Use `cargo test -- --test-threads=1` for sequential tests

**Issue**: Clippy warnings about unused dependencies
**Solution**: Review `Cargo.toml` dependencies and remove unused ones

## Success Criteria

All checks must pass:
- ✅ `cargo build` succeeds with 0 errors
- ✅ `cargo test` passes 100% of tests
- ✅ `cargo clippy` reports 0 warnings
- ✅ `cargo fmt --check` reports no formatting issues
- ✅ `cargo doc` generates documentation without warnings

## Output Format

Report results in this format:

```
🦀 Rust Development Workflow Results

✅ Build: Success (X crates compiled)
✅ Tests: XX/XX passed (XXX assertions)
✅ Clippy: 0 warnings
✅ Format: All files properly formatted
✅ Docs: Generated successfully

Ready to commit ✓
```

## Related Skills

- **Agent Execution**: For running Agents after code changes
- **Issue Analysis**: For analyzing build/test failures as Issues
