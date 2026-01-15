# AGENTS.md - Development Guidelines for Miyabi

> Quick reference for agentic coding agents operating in this repository.
> Version: 1.0.0 | Last Updated: 2025-01-15

---

## Build Commands

### Rust Workspace
```bash
# Build all crates
cargo build --workspace

# Build release binary
cargo build --workspace --release

# Check without building (faster)
cargo check --workspace --all-features
```

### TypeScript/Node.js
```bash
# Build Next.js app
npm run build

# Development mode
npm run dev

# Install MCP server dependencies
make mcp-install
```

---

## Test Commands

### Run All Tests
```bash
# Rust: Run all tests
cargo test --workspace

# Rust: Run with output
cargo test --workspace -- --nocapture

# TypeScript: Run Jest
npm run test

# TypeScript: Watch mode
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e
```

### Run Single Test
```bash
# Rust: Run specific test by name
cargo test --workspace test_name

# Rust: Run tests in specific crate
cargo test -p miyabi-core

# Rust: Run tests in specific module
cargo test -p miyabi-core config::tests

# Rust: Run exact test function
cargo test --workspace -- exact test_function_name

# Rust: Run with filter pattern
cargo test --workspace config

# TypeScript: Run specific test file
npm test -- path/to/file.test.ts

# TypeScript: Run specific test name
npm test -- -t "test name"
```

### Test Coverage
```bash
# Rust: Generate coverage (requires cargo-tarpaulin)
cargo tarpaulin --workspace --out Html

# TypeScript: Coverage report
npm run test:coverage
```

---

## Lint & Format

### Rust
```bash
# Format code
cargo fmt --all

# Check formatting
cargo fmt --all -- --check

# Lint with Clippy
cargo clippy --workspace --all-features -- -D warnings

# Fix Clippy warnings
cargo clippy --workspace -- --fix

# Security audit
cargo audit
```

### TypeScript/JavaScript
```bash
# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Type checking
npm run typecheck

# TypeScript strict mode is enforced
# See tsconfig.json: "strict": true
```

### Makefile Shortcuts
```bash
make quick          # fmt + clippy
make full           # fmt + clippy + test
make clippy         # Run clippy
make fmt            # Format check
make fmt-fix        # Apply formatting
make test           # Run all tests
make build          # Build workspace
make build-release   # Build release
make audit          # Security audit
```

---

## Code Style Guidelines

### Rust

#### Naming Conventions
- **Functions/Methods**: `snake_case` (e.g., `get_config`, `parse_json`)
- **Types/Structs/Enums**: `UpperCamelCase` (e.g., `ConfigError`, `AppState`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_PORT`)
- **Modules**: `snake_case` (e.g., `config`, `error_handling`)
- **Variables**: `snake_case` (e.g., `user_token`, `api_client`)

#### Formatting Rules
- **Max line width**: 120 characters (rustfmt.toml)
- **Indentation**: 4 spaces (tabs disabled)
- **Imports**: Grouped by `StdExternalCrate`, merged at crate level
- **Field init shorthand**: Enabled (`Config { field }` not `Config { field: field }`)

#### Error Handling
- Use `thiserror` for custom errors with context
- Use `anyhow::Result<T>` at crate boundaries
- Prefer explicit error types over `String` errors
- Always use `?` operator for error propagation (avoid `.unwrap()` in production)
- Example: `pub type Result<T> = std::result::Result<T, CoreError>;`

#### Imports
```rust
// Preferred: group std, external, internal
use std::path::PathBuf;
use anyhow::{Context, Result};
use crate::config::Config;

// Use `use crate::*` for common re-exports
```

#### Documentation
- Document all public items with `///` doc comments
- Include examples in doc comments for public APIs
- Use `//!` for module-level documentation

### TypeScript

#### Naming Conventions
- **Variables/Functions**: `camelCase` (e.g., `getUserConfig`, `apiClient`)
- **Classes/Interfaces/Types**: `PascalCase` (e.g., `UserConfig`, `ApiClient`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_BASE_URL`)
- **Files**: `kebab-case.ts` (e.g., `user-config.ts`)
- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)

#### ESLint Rules
- **Max line length**: 120 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes (except for template literals)
- **Semicolons**: Required
- **No unused variables**: Error (prefix with `_` if intentional)
- **Explicit return types**: Warned for public functions

#### Type Safety
- **Strict mode**: Enabled in tsconfig.json
- **No implicit any**: Error
- **No unused locals**: Error
- **Prefer `type` imports**: `import type { Type } from './module'`
- **Use `unknown` instead of `any`**: For untyped data

#### Import Style
```typescript
// Preferred: explicit type imports
import type { Config, User } from './types';
import { getUserConfig } from './api';

// Group: external → internal → relative
import { useState } from 'react';
import { Config } from './config';
import { helperFn } from '../utils/helper';
```

#### React/Next.js
- Use functional components with hooks
- Prefer named exports for components
- Use TypeScript for all props
- Default exports discouraged

---

## File Structure

### Rust Workspace
```
crates/
├── miyabi-core/          # Core utilities
│   └── src/
│       ├── lib.rs         # Module declarations
│       ├── config.rs
│       └── error.rs
├── miyabi-types/        # Shared types
├── miyabi-cli/          # Binary entry point
└── tests/               # Integration tests
```

### TypeScript/Next.js
```
src/
├── components/          # React components (PascalCase.tsx)
├── lib/               # Utilities (kebab-case.ts)
├── types/             # Type definitions (PascalCase.ts)
└── index.ts           # Entry point
```

---

## Pre-Commit Workflow

Before committing, run:
```bash
# Quick check
make quick

# Full check
make full

# Or manually:
cargo fmt --all -- --check
cargo clippy --workspace --all-features -- -D warnings
cargo test --workspace
npm run lint
npm run typecheck
```

---

## CI/CD Quality Gates

All PRs must pass:
- ✅ `cargo fmt` check
- ✅ `cargo clippy` (no warnings)
- ✅ `cargo test` (all tests)
- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ Security audit (`cargo audit`)

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `rustfmt.toml` | Rust formatting rules |
| `Cargo.toml` | Workspace definition |
| `.eslintrc.json` | TypeScript lint rules |
| `tsconfig.json` | TypeScript compiler options |
| `Makefile` | Common development tasks |
| `package.json` | Node.js scripts and dependencies |

---

**For detailed protocols and agent workflows, see:**
- `docs/architecture/AGENTS.md` - Agent operations guide
- `CLAUDE.md` - Control document
- `code_quality_standards.md` - Quality standards framework
