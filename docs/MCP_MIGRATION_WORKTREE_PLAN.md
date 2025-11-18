# MCP Migration Worktree Allocation Plan
# Git Worktree Strategy for Parallel Development

**Version**: 1.0.0
**Created**: 2025-11-19
**Purpose**: Worktree isolation strategy for parallel MCP server migration

---

## 🌳 Worktree Architecture

### Overview

Each MCP server migration gets its own isolated git worktree:
- **Parallel Development**: 11 agents work simultaneously
- **Merge Isolation**: No conflicts during development
- **Clean History**: Each server has its own commit chain
- **Easy Rollback**: Individual rollback per server

---

## 📋 Worktree Allocation Table

| ID | Server | Worktree Name | Agent | Branch | Directory |
|----|--------|--------------|-------|--------|-----------|
| 01 | miyabi-rules-server | mcp-rules | Agent-01 | feature/mcp-rules-rust | `.worktrees/mcp-rules` |
| 02 | context-engineering | mcp-context | Agent-02 | feature/mcp-context-rust | `.worktrees/mcp-context` |
| 03 | miyabi-tmux-server | mcp-tmux | Agent-03 | feature/mcp-tmux-rust | `.worktrees/mcp-tmux` |
| 04 | miyabi-obsidian-server | mcp-obsidian | Agent-04 | feature/mcp-obsidian-rust | `.worktrees/mcp-obsidian` |
| 05 | miyabi-pixel-mcp | mcp-pixel | Agent-05 | feature/mcp-pixel-rust | `.worktrees/mcp-pixel` |
| 06 | miyabi-sse-gateway | mcp-sse | Agent-06 | feature/mcp-sse-rust | `.worktrees/mcp-sse` |
| 07 | lark-mcp-enhanced | mcp-lark1 | Agent-07 | feature/mcp-lark1-rust | `.worktrees/mcp-lark1` |
| 08 | lark-openapi-mcp-enhanced | mcp-lark2 | Agent-08 | feature/mcp-lark2-rust | `.worktrees/mcp-lark2` |
| 09 | lark-wiki-mcp-agents | mcp-lark3 | Agent-09 | feature/mcp-lark3-rust | `.worktrees/mcp-lark3` |
| 10 | miyabi-mcp-server | mcp-miyabi | Agent-10 | feature/mcp-miyabi-update | `.worktrees/mcp-miyabi` |
| 11 | miyabi-discord-mcp-server | mcp-discord | Agent-11 | feature/mcp-discord-update | `.worktrees/mcp-discord` |

---

## 🚀 Setup Commands

### Phase 0: Worktree Creation

```bash
#!/bin/bash
# scripts/setup-mcp-worktrees.sh

# Create worktree directory
mkdir -p .worktrees

# Server 01: miyabi-rules-server
git worktree add -b feature/mcp-rules-rust .worktrees/mcp-rules

# Server 02: context-engineering
git worktree add -b feature/mcp-context-rust .worktrees/mcp-context

# Server 03: miyabi-tmux-server 🔥
git worktree add -b feature/mcp-tmux-rust .worktrees/mcp-tmux

# Server 04: miyabi-obsidian-server
git worktree add -b feature/mcp-obsidian-rust .worktrees/mcp-obsidian

# Server 05: miyabi-pixel-mcp
git worktree add -b feature/mcp-pixel-rust .worktrees/mcp-pixel

# Server 06: miyabi-sse-gateway
git worktree add -b feature/mcp-sse-rust .worktrees/mcp-sse

# Server 07: lark-mcp-enhanced
git worktree add -b feature/mcp-lark1-rust .worktrees/mcp-lark1

# Server 08: lark-openapi-mcp-enhanced
git worktree add -b feature/mcp-lark2-rust .worktrees/mcp-lark2

# Server 09: lark-wiki-mcp-agents
git worktree add -b feature/mcp-lark3-rust .worktrees/mcp-lark3

# Server 10: miyabi-mcp-server
git worktree add -b feature/mcp-miyabi-update .worktrees/mcp-miyabi

# Server 11: miyabi-discord-mcp-server
git worktree add -b feature/mcp-discord-update .worktrees/mcp-discord

echo "✅ All 11 worktrees created"
git worktree list
```

---

## 📁 Directory Structure

```
miyabi-private/
├── .worktrees/
│   ├── mcp-rules/          # Agent-01
│   ├── mcp-context/        # Agent-02
│   ├── mcp-tmux/           # Agent-03 🔥
│   ├── mcp-obsidian/       # Agent-04
│   ├── mcp-pixel/          # Agent-05
│   ├── mcp-sse/            # Agent-06
│   ├── mcp-lark1/          # Agent-07
│   ├── mcp-lark2/          # Agent-08
│   ├── mcp-lark3/          # Agent-09
│   ├── mcp-miyabi/         # Agent-10
│   └── mcp-discord/        # Agent-11
├── crates/                 # Main repo crates
├── .git/
└── ...
```

Each worktree contains full repo:
```
.worktrees/mcp-rules/
├── crates/
│   ├── miyabi-mcp-rules/   ← New crate created here
│   └── ...                 ← All other crates available
├── Cargo.toml              ← Workspace manifest
├── .git                    ← Points to main .git
└── ...
```

---

## 🔄 Workflow Per Agent

### Agent Task Flow

```bash
# Agent-01 working on miyabi-rules-server

# Step 1: Enter worktree
cd .worktrees/mcp-rules

# Step 2: Create new crate
cargo new crates/miyabi-mcp-rules --bin

# Step 3: Update workspace Cargo.toml
# Add "crates/miyabi-mcp-rules" to members

# Step 4: Implement server
# ... develop code ...

# Step 5: Test locally
cargo build -p miyabi-mcp-rules
cargo test -p miyabi-mcp-rules

# Step 6: Commit
git add crates/miyabi-mcp-rules
git add Cargo.toml
git commit -m "feat(mcp): implement miyabi-rules-server in Rust

- Migrate from TypeScript to Rust using rmcp v0.8.0
- Add fetch_rules and validate_rule tools
- Use reqwest for HTTP client
- Add comprehensive tests
- Update documentation

🤖 Generated with Claude Code
Co-Authored-By: Agent-01 <agent01@miyabi.dev>"

# Step 7: Push branch
git push -u origin feature/mcp-rules-rust

# Step 8: Create PR (via gh CLI)
gh pr create \
  --title "feat(mcp): Migrate miyabi-rules-server to Rust" \
  --body "$(cat <<EOF
## Summary
Migrates miyabi-rules-server from TypeScript to Rust using rmcp v0.8.0

## Changes
- New crate: crates/miyabi-mcp-rules
- Tools: fetch_rules, validate_rule
- HTTP client: reqwest
- Transport: stdio

## Testing
- Unit tests: ✅
- Integration tests: ✅
- MCP Inspector: ✅

## Performance
- Startup: 200ms → 15ms (13.3x faster)
- Memory: 80MB → 8MB (10x reduction)

## Migration Notes
Part of the comprehensive MCP migration plan.
See: docs/MCP_MIGRATION_MASTER_PLAN.md

🤖 Generated with Claude Code
EOF
)" \
  --base main \
  --draft

# Step 9: Request review from CoordinatorAgent
gh pr ready  # Convert from draft when ready
```

---

## 🔀 Merge Strategy

### Option A: Sequential Merge (Safe)

CoordinatorAgent enforces merge queue:

```bash
# Phase 1 servers merge first
1. merge: feature/mcp-rules-rust
2. merge: feature/mcp-context-rust

# Phase 2
3. merge: feature/mcp-tmux-rust 🔥
4. merge: feature/mcp-obsidian-rust

# ... etc
```

### Option B: Parallel Merge (Risky but Faster)

All agents create PRs simultaneously:
- CoordinatorAgent reviews for conflicts
- Auto-merge if no conflicts detected
- Manual resolution if conflicts exist

**Risk**: Potential workspace Cargo.toml conflicts

**Mitigation**:
- CoordinatorAgent pre-allocates crate names
- Each agent updates only their section
- CI/CD validates no conflicts

---

## 🛡️ Conflict Prevention

### Workspace Cargo.toml Strategy

Pre-allocate all crate entries in main branch:

```toml
# Cargo.toml (main branch - Phase 0)
[workspace]
members = [
    # Existing crates
    "crates/miyabi-core",
    "crates/miyabi-cli",
    # ... existing ...

    # MCP Migration - Phase 1
    "crates/miyabi-mcp-rules",
    "crates/miyabi-mcp-context",

    # MCP Migration - Phase 2
    "crates/miyabi-mcp-tmux",
    "crates/miyabi-mcp-obsidian",

    # MCP Migration - Phase 3
    "crates/miyabi-mcp-pixel",
    "crates/miyabi-mcp-sse",

    # MCP Migration - Phase 4
    "crates/miyabi-mcp-lark-enhanced",
    "crates/miyabi-mcp-lark-openapi",
    "crates/miyabi-mcp-lark-wiki",
]
```

Each worktree starts with these entries already present:
- ✅ No Cargo.toml conflicts
- ✅ Parallel merges possible
- ✅ Clean git history

---

## 🧹 Cleanup After Merge

```bash
#!/bin/bash
# scripts/cleanup-mcp-worktrees.sh

# After successful merge and deployment

# Remove worktree 01
git worktree remove .worktrees/mcp-rules
git branch -d feature/mcp-rules-rust

# Remove worktree 02
git worktree remove .worktrees/mcp-context
git branch -d feature/mcp-context-rust

# ... repeat for all 11 ...

# Remove worktree directory
rmdir .worktrees  # Only if empty

echo "✅ All worktrees cleaned up"
```

---

## 📊 Worktree Status Dashboard

### Command to Check All Worktrees

```bash
#!/bin/bash
# scripts/check-mcp-worktree-status.sh

echo "🌳 MCP Migration Worktree Status"
echo "=================================="
echo ""

for wt in .worktrees/mcp-*; do
    if [ -d "$wt" ]; then
        name=$(basename "$wt")
        cd "$wt"

        # Get branch name
        branch=$(git branch --show-current)

        # Get status
        if git diff-index --quiet HEAD --; then
            status="✅ Clean"
        else
            status="🔄 Changes"
        fi

        # Get commit count
        commits=$(git rev-list --count HEAD ^main)

        # Get last commit message
        last_commit=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commits")

        echo "[$name]"
        echo "  Branch: $branch"
        echo "  Status: $status"
        echo "  Commits: $commits"
        echo "  Last: $last_commit"
        echo ""

        cd - > /dev/null
    fi
done
```

### Sample Output

```
🌳 MCP Migration Worktree Status
==================================

[mcp-rules]
  Branch: feature/mcp-rules-rust
  Status: ✅ Clean
  Commits: 5
  Last: feat(mcp): add comprehensive tests

[mcp-tmux]
  Branch: feature/mcp-tmux-rust
  Status: 🔄 Changes
  Commits: 8
  Last: feat(mcp): implement P0.2 protocol

...
```

---

## 🎯 Success Metrics

### Per-Worktree Checklist

- [ ] Worktree created successfully
- [ ] Agent assigned and working
- [ ] New crate builds without errors
- [ ] Tests passing
- [ ] PR created
- [ ] Code review passed
- [ ] Merged to main
- [ ] Worktree cleaned up

### Project-Level Metrics

- **Total Worktrees**: 11
- **Active Worktrees**: _track in real-time_
- **Merged PRs**: _track progress_
- **Cleanup Complete**: _final step_

---

## 🚨 Emergency Procedures

### If Worktree Gets Corrupted

```bash
# Step 1: Remove corrupted worktree
git worktree remove --force .worktrees/mcp-rules

# Step 2: Delete branch (if needed)
git branch -D feature/mcp-rules-rust

# Step 3: Recreate
git worktree add -b feature/mcp-rules-rust .worktrees/mcp-rules

# Step 4: Restore work (if commits exist on remote)
cd .worktrees/mcp-rules
git fetch origin feature/mcp-rules-rust
git reset --hard origin/feature/mcp-rules-rust
```

### If Main Repo Gets Locked

```bash
# Check what's using the worktree
git worktree list

# Force unlock if needed
rm .git/worktrees/*/locked
```

---

## 📚 References

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Miyabi Worktree Module](../crates/miyabi-worktree/)
- [MCP Migration Master Plan](./MCP_MIGRATION_MASTER_PLAN.md)

---

**Status**: ✅ Worktree Plan Complete
**Next**: Execute setup script
