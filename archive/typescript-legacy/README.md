# ⚠️ DEPRECATED - TypeScript Edition

This directory contains the legacy TypeScript implementation of Miyabi.

**Status**: Archived as of 2025-10-19

**Reason**: Miyabi has migrated to Rust 2021 Edition for:
- **50%+ faster execution** - Native Rust performance
- **30%+ memory reduction** - Zero-cost abstractions
- **Single binary distribution** - No Node.js dependency
- **Compile-time type safety** - Reduced runtime errors

## Migration

**New Implementation**: See `crates/` directory for Rust Edition

**Migration Guide**: [docs/RUST_MIGRATION_REQUIREMENTS.md](../../docs/RUST_MIGRATION_REQUIREMENTS.md)

## Contents

This archive contains:
- `packages/coding-agents/` - TypeScript Agent implementations (7 agents)
- `packages/business-agents/` - Business Agent implementations
- `packages/miyabi-agent-sdk/` - TypeScript SDK
- `packages/miyabi-cli/` - TypeScript CLI (replaced by Rust binary)
- `packages/core/` - Core utilities
- `packages/shared-utils/` - Shared TypeScript utilities
- `packages/github-projects/` - GitHub Projects integration
- `packages/doc-generator/` - Documentation generator
- `packages/context-engineering/` - Context optimization
- `packages/cli/` - Legacy CLI

## Historical Reference

These files are preserved for:
- Historical reference
- Architecture comparison
- Migration verification
- Documentation purposes

**Do not use these implementations for new development.**

---

**Archived by**: Claude Code (Miyabi)
**Date**: 2025-10-19
**Related Issue**: #207 (Documentation & Legacy Cleanup)
