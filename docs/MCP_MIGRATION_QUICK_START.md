# MCP Migration Quick Start Guide
# Get Started in 5 Minutes

**Version**: 1.0.0
**Created**: 2025-11-19
**Audience**: Miyabi Agents & Developers

---

## 🎯 TL;DR

```bash
# 1. Review the plan
cat docs/MCP_MIGRATION_MASTER_PLAN.md

# 2. Set up worktrees (one-time setup)
./scripts/setup-mcp-worktrees.sh

# 3. Assign yourself a server and start coding
cd .worktrees/mcp-rules
cargo new crates/miyabi-mcp-rules --bin

# 4. Follow the template and implement
# See: crates/miyabi-mcp-template/

# 5. Test, commit, PR
cargo test
git commit -m "feat(mcp): implement rules-server"
gh pr create
```

---

## 📚 Essential Documents

### Planning Documents (Read First)
1. **[Master Plan](./MCP_MIGRATION_MASTER_PLAN.md)** - Complete migration strategy
2. **[Task Breakdown](./MCP_MIGRATION_TASK_BREAKDOWN.md)** - Detailed task list
3. **[Worktree Plan](./MCP_MIGRATION_WORKTREE_PLAN.md)** - Git worktree strategy

### Reference Documents
4. **[RMCP SDK Examples](/tmp/mcp-rust-sdk/examples/)** - Official Rust examples
5. **[MCP Spec](https://spec.modelcontextprotocol.io/)** - MCP protocol specification

---

## 🚀 Agent Assignment Table

| Agent | Server | Worktree | Priority | Start Date | Status |
|-------|--------|----------|----------|------------|--------|
| Agent-01 | miyabi-rules-server | `.worktrees/mcp-rules` | P1 | TBD | ⏳ Pending |
| Agent-02 | context-engineering | `.worktrees/mcp-context` | P1 | TBD | ⏳ Pending |
| Agent-03 | miyabi-tmux-server 🔥 | `.worktrees/mcp-tmux` | P2 | TBD | ⏳ Pending |
| Agent-04 | miyabi-obsidian-server | `.worktrees/mcp-obsidian` | P2 | TBD | ⏳ Pending |
| Agent-05 | miyabi-pixel-mcp | `.worktrees/mcp-pixel` | P3 | TBD | ⏳ Pending |
| Agent-06 | miyabi-sse-gateway | `.worktrees/mcp-sse` | P3 | TBD | ⏳ Pending |
| Agent-07 | lark-mcp-enhanced | `.worktrees/mcp-lark1` | P4 | TBD | ⏳ Pending |
| Agent-08 | lark-openapi-mcp-enhanced | `.worktrees/mcp-lark2` | P4 | TBD | ⏳ Pending |
| Agent-09 | lark-wiki-mcp-agents | `.worktrees/mcp-lark3` | P4 | TBD | ⏳ Pending |
| Agent-10 | miyabi-mcp-server | `.worktrees/mcp-miyabi` | P5 | TBD | ⏳ Pending |
| Agent-11 | miyabi-discord-mcp-server | `.worktrees/mcp-discord` | P5 | TBD | ⏳ Pending |

**Status Legend**: ⏳ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## 📋 Migration Checklist (Per Agent)

### Phase 1: Preparation
- [ ] Read assigned TypeScript server source
- [ ] Document all tools and their signatures
- [ ] List external dependencies
- [ ] Review RMCP SDK examples

### Phase 2: Setup
- [ ] Create worktree and crate
- [ ] Set up Cargo.toml with rmcp dependencies
- [ ] Create basic structure (main.rs, lib.rs)

### Phase 3: Implementation
- [ ] Define tool schemas with `#[derive]` macros
- [ ] Implement tool handlers with `#[tool]` macro
- [ ] Add error handling
- [ ] Add logging with `tracing`

### Phase 4: Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Test with MCP Inspector
- [ ] Performance testing

### Phase 5: Integration
- [ ] Build release binary
- [ ] Update Claude Code config
- [ ] Create PR with detailed description
- [ ] Request review from CoordinatorAgent

### Phase 6: Deployment
- [ ] Merge PR after approval
- [ ] Verify deployment
- [ ] Mark TypeScript version deprecated
- [ ] Clean up worktree

---

## 🛠️ Common Commands

### Setup

```bash
# Check MCP Rust SDK
ls /tmp/mcp-rust-sdk/

# List all worktrees
git worktree list

# Check worktree status
./scripts/check-mcp-worktree-status.sh
```

### Development

```bash
# Enter your worktree
cd .worktrees/mcp-<name>

# Create new crate
cargo new crates/miyabi-mcp-<name> --bin

# Build
cargo build -p miyabi-mcp-<name>

# Test
cargo test -p miyabi-mcp-<name>

# Run
cargo run -p miyabi-mcp-<name>
```

### Testing with MCP Inspector

```bash
# Build release binary first
cargo build --release -p miyabi-mcp-<name>

# Start MCP Inspector
npx @modelcontextprotocol/inspector

# In Inspector UI, connect to:
# Command: ./target/release/miyabi-mcp-<name>
# Args: (none for stdio)

# Test your tools interactively
```

### Git Workflow

```bash
# Stage changes
git add crates/miyabi-mcp-<name>
git add Cargo.toml

# Commit with Conventional Commits
git commit -m "feat(mcp): implement <server-name>

- Migrate from TypeScript to Rust using rmcp v0.8.0
- Add <tool1>, <tool2> tools
- Dependencies: reqwest, tokio, etc.
- Comprehensive tests added

🤖 Generated with Claude Code
Co-Authored-By: <AgentName> <agent@miyabi.dev>"

# Push to remote
git push -u origin feature/mcp-<name>-rust

# Create PR
gh pr create --draft \
  --title "feat(mcp): Migrate <server-name> to Rust" \
  --body "See MCP_MIGRATION_MASTER_PLAN.md"
```

---

## 📖 Code Templates

### Minimal Server Template

```rust
// crates/miyabi-mcp-<name>/src/main.rs
use anyhow::Result;
use rmcp::{ServiceExt, transport::stdio};
use tracing_subscriber::{EnvFilter, fmt};

mod server;
use server::MyServer;

#[tokio::main]
async fn main() -> Result<()> {
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();

    tracing::info!("Starting MCP Server");

    let service = MyServer::new().serve(stdio()).await?;
    service.waiting().await?;
    Ok(())
}
```

```rust
// crates/miyabi-mcp-<name>/src/server.rs
use rmcp::{
    ErrorData as McpError,
    handler::server::router::tool::ToolRouter,
    model::*,
    schemars,
    tool, tool_router,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, JsonSchema)]
struct MyToolArgs {
    name: String,
    count: i32,
}

#[derive(Clone)]
pub struct MyServer {
    tool_router: ToolRouter<MyServer>,
}

#[tool_router]
impl MyServer {
    pub fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }

    #[tool(description = "My example tool")]
    async fn my_tool(&self, args: MyToolArgs) -> Result<CallToolResult, McpError> {
        tracing::info!("my_tool called: {:?}", args);

        let response = format!("Hello {} (count: {})", args.name, args.count);

        Ok(CallToolResult::success(vec![
            Content::text(response)
        ]))
    }
}
```

### Cargo.toml Template

```toml
[package]
name = "miyabi-mcp-<name>"
version = "0.1.0"
edition.workspace = true
authors.workspace = true

[[bin]]
name = "miyabi-mcp-<name>"
path = "src/main.rs"

[dependencies]
rmcp = { version = "0.8.0", features = ["server"] }
tokio = { workspace = true, features = ["full"] }
serde = { workspace = true, features = ["derive"] }
serde_json = { workspace = true }
schemars = "0.8"
anyhow = { workspace = true }
thiserror = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }

# Add server-specific dependencies here
```

---

## 🎯 Success Criteria

Your migration is complete when:

- ✅ All tools from TypeScript are implemented
- ✅ `cargo build` succeeds with no warnings
- ✅ `cargo test` passes 100%
- ✅ MCP Inspector can connect and call all tools
- ✅ Performance ≥ TypeScript version
- ✅ Documentation is complete
- ✅ PR is approved and merged

---

## 🆘 Help & Support

### Common Issues

**Q: "rmcp not found"**
```bash
# Add to Cargo.toml
rmcp = { version = "0.8.0", features = ["server"] }
```

**Q: "Tool not appearing in Inspector"**
```rust
// Make sure you have:
#[tool_router]  // On impl block
#[tool(description = "...")]  // On each tool method
```

**Q: "Schema validation errors"**
```rust
// Ensure all arg types derive:
#[derive(Debug, Deserialize, JsonSchema)]
```

### Getting Help

1. **Check Examples**: `/tmp/mcp-rust-sdk/examples/`
2. **Read Docs**: `docs/MCP_MIGRATION_*.md`
3. **Ask CoordinatorAgent**: tmux broadcast
4. **GitHub Issues**: Report blockers

---

## 📊 Progress Tracking

Update this section as you complete tasks:

```markdown
## My Progress (Agent-XX)

**Server**: <server-name>
**Started**: <date>
**Status**: <In Progress | Complete>

### Completed
- [x] Read TypeScript source
- [x] Created worktree
- [ ] Implemented tools
- [ ] Tests passing
- [ ] PR created

### Blockers
- None

### Notes
- <any important notes>
```

---

## 🎓 Learning Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [Tokio Tutorial](https://tokio.rs/tokio/tutorial)
- [Serde Guide](https://serde.rs/)
- [RMCP Documentation](https://github.com/modelcontextprotocol/rust-sdk)

---

**Ready to start?** Pick your server and dive in! 🚀

**Questions?** Check the planning docs or ask CoordinatorAgent.

---

**Last Updated**: 2025-11-19
**Status**: ✅ Ready for Execution
