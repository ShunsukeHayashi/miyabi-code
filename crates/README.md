# Miyabi Rust Crates

Complete Rust implementation of the Miyabi autonomous development framework.

## Crates Overview

| Crate | Description | Version | Lines | Tests |
|-------|-------------|---------|-------|-------|
| **miyabi-types** | Core type definitions | 0.1.0 | ~2000 | 148 |
| **miyabi-core** | Configuration & logging | 0.1.0 | 826 | 27 |
| **miyabi-worktree** | Git worktree management | 0.1.0 | 489 | 3 |
| **miyabi-github** | GitHub API integration | 0.1.0 | 922 | 10 |
| **miyabi-agents** | Autonomous AI agents | 0.1.0 | 687 | 15 |
| **miyabi-cli** | Command-line interface | 0.1.0 | 1209 | 8 |

**Total**: ~6,100 lines, 211 tests ✅

## Quick Start

```bash
# Build all crates
cargo build --workspace

# Run tests
cargo test --workspace

# Build CLI binary
cargo build --release -p miyabi-cli

# Install CLI
cargo install --path crates/miyabi-cli
```

## Architecture

```
miyabi-cli
    ├── miyabi-agents
    │   ├── miyabi-github
    │   ├── miyabi-worktree
    │   └── miyabi-core
    │       └── miyabi-types
    └── miyabi-types
```

## Development

### Prerequisites

- Rust 1.75.0+
- Git 2.30+

### Environment Variables

```bash
export GITHUB_TOKEN=ghp_xxx        # Required
export DEVICE_IDENTIFIER=MacBook   # Optional
```

### Build Profiles

```bash
# Development (optimized dependencies)
cargo build

# Development with opt-level=1
cargo build --profile dev-opt

# Release (full optimizations)
cargo build --release

# Small binary (size-optimized)
cargo build --profile release-small
```

### Cargo Aliases

```bash
cargo t              # Run tests
cargo c              # Check compilation
cargo clippy-strict  # Strict linting
cargo test-all       # Tests with output
```

## Testing

```bash
# Unit tests
cargo test --workspace --lib

# Integration tests
cargo test --workspace --test '*'

# With coverage (requires tarpaulin)
cargo tarpaulin --workspace --out Html
```

## Code Quality

- **Strict mode**: All crates use `#![warn(clippy::all)]`
- **Error handling**: thiserror-based structured errors
- **Async runtime**: Tokio with minimal features
- **Type safety**: Full type coverage with miyabi-types

## License

Apache-2.0
