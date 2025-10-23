# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Miyabi project. An ADR is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

```markdown
# ADR-NNN: Title

**Status**: Proposed | Accepted | Deprecated | Superseded
**Date**: YYYY-MM-DD
**Deciders**: List of people involved
**Technical Story**: Related issue/epic

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

## Alternatives Considered

What other options were evaluated?
```

## Index of ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-rust-migration.md) | Migrate from TypeScript to Rust | ✅ Accepted | 2025-08-15 |
| [002](002-github-os-architecture.md) | Use GitHub as Operating System | ✅ Accepted | 2025-08-20 |
| [003](003-worktree-based-isolation.md) | Git Worktree-Based Parallel Execution | ✅ Accepted | 2025-09-01 |
| [004](004-qdrant-vector-database.md) | Qdrant for Knowledge Management | ✅ Accepted | 2025-09-10 |
| [005](005-mcp-protocol.md) | Model Context Protocol Integration | ✅ Accepted | 2025-09-20 |
| [006](006-claude-code-integration.md) | Claude Code as Execution Engine | ✅ Accepted | 2025-10-01 |
| [007](007-53-label-system.md) | 53-Label State Management System | ✅ Accepted | 2025-10-05 |
| [008](008-quality-threshold.md) | 80/100 Quality Threshold for Auto-Merge | ✅ Accepted | 2025-10-10 |

## Creating a New ADR

```bash
# 1. Create new ADR file
cp decisions/template.md decisions/009-your-title.md

# 2. Edit the ADR
vim decisions/009-your-title.md

# 3. Update this index
vim decisions/README.md

# 4. Commit
git add decisions/
git commit -m "docs(adr): add ADR-009 Your Title"
```

## ADR Lifecycle

1. **Proposed**: Initial draft, under discussion
2. **Accepted**: Decision approved and implemented
3. **Deprecated**: No longer recommended, but still in use
4. **Superseded**: Replaced by another ADR (link to replacement)

## References

- **ADR GitHub Org**: https://adr.github.io/
- **Michael Nygard's ADR**: http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions
- **ADR Tools**: https://github.com/npryce/adr-tools

---

**Last Updated**: 2025-10-24
**Total ADRs**: 8
**Active**: 8 | Deprecated: 0 | Superseded: 0
