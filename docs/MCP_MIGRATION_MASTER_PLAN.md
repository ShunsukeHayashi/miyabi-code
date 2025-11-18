# MCP Server Migration Master Plan
# Complete TypeScript → Rust Migration Strategy

**Document Version**: 1.0.0
**Created**: 2025-11-19
**Status**: Planning Phase
**Estimated Duration**: 4-6 weeks (with Orchestra parallelization)

---

## 🎯 Executive Summary

**Mission**: Migrate all 11 MCP servers from TypeScript/legacy Rust to official Rust MCP SDK (`rmcp` v0.8.0)

**Why Now?**
- Official Rust SDK is production-ready
- 10-100x performance improvement
- Type safety and compile-time guarantees
- Direct integration with Miyabi crates
- Single binary deployment (no node_modules)
- Memory safety without GC overhead

**Approach**: Orchestrated parallel migration using Miyabi Orchestra + Git Worktrees

---

## 📊 Current State Inventory

### TypeScript Servers (9) - Node.js + @modelcontextprotocol/sdk

| Server | LoC | Complexity | Priority | Dependencies |
|--------|-----|------------|----------|--------------|
| miyabi-tmux-server | 437 | Medium | P2 🔥 | child_process |
| miyabi-obsidian-server | ~300 | Medium | P2 | gray-matter, fs |
| miyabi-rules-server | ~250 | Low | P1 | axios |
| miyabi-pixel-mcp | ~400 | Medium | P3 | adb, shell |
| miyabi-sse-gateway | ~500 | High | P3 | express, SSE |
| lark-wiki-mcp-agents | ~600 | High | P4 | @larksuiteoapi/node-sdk |
| lark-openapi-mcp-enhanced | ~700 | High | P4 | @larksuiteoapi/node-sdk |
| lark-mcp-enhanced | ~500 | Medium | P4 | @larksuiteoapi/node-sdk |
| context-engineering | ~200 | Low | P1 | minimal |

### Legacy Rust Servers (2) - Using jsonrpc-core v18.0

| Server | LoC | Status | Priority | Action |
|--------|-----|--------|----------|--------|
| miyabi-mcp-server | ~800 | Legacy | P5 | Update to rmcp |
| miyabi-discord-mcp-server | ~600 | Legacy | P5 | Update to rmcp |

**Total Migration Scope**: 11 servers, ~5,000 lines of code

---

## 🏗️ Migration Architecture

### Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│            Miyabi Orchestra Control Layer               │
│  (CoordinatorAgent + 11 Parallel CodeGenAgents)        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   Worktree-1        Worktree-2    ...  Worktree-11
   (rules)           (context)          (discord)
        │                 │                 │
        ▼                 ▼                 ▼
   Rust Crate       Rust Crate        Rust Crate
   rmcp v0.8.0      rmcp v0.8.0       rmcp v0.8.0
```

### Technology Stack

**Source**: TypeScript + @modelcontextprotocol/sdk ^1.0.4
**Target**: Rust + rmcp ^0.8.0
**Build**: Cargo workspace
**Test**: cargo test + MCP Inspector
**Deploy**: Single binary per server

---

## 📅 Migration Phases

### Phase 0: Infrastructure Setup (Days 1-2)

**Tasks**:
- [x] Clone rmcp SDK to `/tmp/mcp-rust-sdk`
- [ ] Create migration template crate
- [ ] Set up CI/CD for MCP servers
- [ ] Create testing harness
- [ ] Document migration pattern

**Deliverables**:
- `crates/miyabi-mcp-template/` - Template crate
- `scripts/migrate-mcp-server.sh` - Migration automation
- `.github/workflows/mcp-servers.yml` - CI/CD pipeline

---

### Phase 1: Simple Servers (Days 3-7)

**Target**: Low-complexity servers for pattern validation

#### Server 1.1: miyabi-rules-server (Day 3-4)
**Complexity**: LOW
**LoC**: ~250
**Dependencies**: axios → reqwest

**Tools**:
```rust
#[tool(description = "Fetch rules from cloud")]
async fn fetch_rules(&self, args: FetchRulesArgs) -> Result<CallToolResult, McpError>

#[tool(description = "Validate rule format")]
async fn validate_rule(&self, args: ValidateRuleArgs) -> Result<CallToolResult, McpError>
```

**Migration Steps**:
1. Create `crates/miyabi-mcp-rules/`
2. Define tool schemas
3. Implement HTTP client with `reqwest`
4. Add stdio transport
5. Test with MCP Inspector
6. Update Claude Code config

**Risk**: LOW
**Blocker**: None

---

#### Server 1.2: context-engineering (Day 5)
**Complexity**: LOW
**LoC**: ~200
**Dependencies**: Minimal

**Tools**: TBD (need to read source)

**Migration Steps**:
1. Read TypeScript source
2. Create Rust crate
3. Implement tools
4. Test and validate

**Risk**: LOW
**Blocker**: None

---

### Phase 2: Core Miyabi Servers (Days 8-14)

**Target**: Critical infrastructure for Miyabi Orchestra

#### Server 2.1: miyabi-tmux-server (Days 8-10) 🔥 CRITICAL
**Complexity**: MEDIUM
**LoC**: 437
**Dependencies**: child_process → tokio::process

**Tools** (6 total):
```rust
#[tool(description = "List all tmux sessions")]
async fn tmux_list_sessions(&self) -> Result<CallToolResult, McpError>

#[tool(description = "List panes with optional session filter")]
async fn tmux_list_panes(&self, args: ListPanesArgs) -> Result<CallToolResult, McpError>

#[tool(description = "Send message using CLAUDE.md P0.2 protocol")]
async fn tmux_send_message(&self, args: SendMessageArgs) -> Result<CallToolResult, McpError>

#[tool(description = "Join Miyabi CommHub session")]
async fn tmux_join_commhub(&self) -> Result<CallToolResult, McpError>

#[tool(description = "Get CommHub status")]
async fn tmux_get_commhub_status(&self) -> Result<CallToolResult, McpError>

#[tool(description = "Broadcast to all Miyabi sessions")]
async fn tmux_broadcast(&self, args: BroadcastArgs) -> Result<CallToolResult, McpError>
```

**Key Implementation Details**:
- P0.2 Protocol: `tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter`
- Session filtering and discovery
- CommHub integration
- Broadcast with retry logic

**Migration Steps**:
1. Create `crates/miyabi-mcp-tmux/`
2. Implement tmux command executor with `tokio::process::Command`
3. Add session/pane parsing logic
4. Implement 6 tool handlers
5. Add comprehensive error handling
6. Test with live miyabi-orchestra session
7. Validate P0.2 protocol compliance

**Risk**: MEDIUM (critical path)
**Blocker**: Requires running tmux session for testing

---

#### Server 2.2: miyabi-obsidian-server (Days 11-12)
**Complexity**: MEDIUM
**LoC**: ~300
**Dependencies**: gray-matter, fs → gray_matter, std::fs

**Tools**:
```rust
#[tool(description = "Search Obsidian vault")]
async fn search_vault(&self, args: SearchArgs) -> Result<CallToolResult, McpError>

#[tool(description = "Read note with frontmatter")]
async fn read_note(&self, args: ReadNoteArgs) -> Result<CallToolResult, McpError>

#[tool(description = "List notes by tag")]
async fn list_notes_by_tag(&self, args: ListByTagArgs) -> Result<CallToolResult, McpError>
```

**Migration Steps**:
1. Create `crates/miyabi-mcp-obsidian/`
2. Add gray_matter crate (or implement frontmatter parser)
3. Implement vault scanner
4. Add tag indexing
5. Implement search with regex
6. Test with actual Obsidian vault

**Risk**: LOW
**Blocker**: Need gray_matter Rust equivalent (may need to implement)

---

### Phase 3: Integration Servers (Days 15-21)

#### Server 3.1: miyabi-pixel-mcp (Days 15-17)
**Complexity**: MEDIUM
**LoC**: ~400
**Dependencies**: adb, shell → tokio::process

**Tools**: Device control, screenshot, automation

**Risk**: MEDIUM
**Blocker**: Requires Pixel device for testing

---

#### Server 3.2: miyabi-sse-gateway (Days 18-21)
**Complexity**: HIGH
**LoC**: ~500
**Dependencies**: express, SSE → axum, tower-http

**Features**:
- SSE transport
- OAuth2 integration
- Request proxying
- Connection management

**Migration Steps**:
1. Create `crates/miyabi-mcp-sse-gateway/`
2. Implement SSE transport with axum
3. Add OAuth2 middleware (use rmcp examples)
4. Implement proxy logic
5. Add connection pooling
6. Test with multiple clients

**Risk**: HIGH
**Blocker**: Complex OAuth2 flow

---

### Phase 4: Lark Ecosystem (Days 22-28)

**Note**: All Lark servers use `@larksuiteoapi/node-sdk` → Need Rust Lark SDK

#### Server 4.1: lark-mcp-enhanced (Days 22-24)
**Complexity**: MEDIUM
**LoC**: ~500

**Strategy**: Use `reqwest` + manual API calls OR find Rust Lark SDK

---

#### Server 4.2: lark-openapi-mcp-enhanced (Days 25-26)
**Complexity**: HIGH
**LoC**: ~700

---

#### Server 4.3: lark-wiki-mcp-agents (Days 27-28)
**Complexity**: HIGH
**LoC**: ~600

**Risk**: HIGH
**Blocker**: No official Rust Lark SDK (may need to create bindings)

---

### Phase 5: Legacy Rust Updates (Days 29-30)

#### Server 5.1: miyabi-mcp-server (Day 29)
**Action**: Update jsonrpc-core → rmcp
**Complexity**: MEDIUM
**LoC**: ~800

**Migration**:
- Replace `jsonrpc-core` with `rmcp`
- Convert RPC handlers to `#[tool]` macros
- Update transport layer
- Maintain backward compatibility

---

#### Server 5.2: miyabi-discord-mcp-server (Day 30)
**Action**: Update jsonrpc-core → rmcp
**Complexity**: MEDIUM
**LoC**: ~600

---

### Phase 6: Integration & Testing (Days 31-35)

**Tasks**:
- [ ] Integration tests for all servers
- [ ] MCP Inspector validation
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Documentation review
- [ ] Claude Code config updates

**Deliverables**:
- Test reports
- Performance comparison (TypeScript vs Rust)
- Updated documentation

---

### Phase 7: Deployment & Deprecation (Days 36-42)

**Tasks**:
- [ ] Build release binaries
- [ ] Update Claude Code config globally
- [ ] Deprecate TypeScript servers
- [ ] Archive old mcp-servers/
- [ ] Update CI/CD pipelines
- [ ] Migration retrospective

---

## 🎭 Orchestration Strategy

### Option A: Sequential (Conservative)
- 1 server at a time
- Thorough validation between migrations
- **Duration**: 8-10 weeks
- **Risk**: LOW

### Option B: Parallel (Aggressive) ⭐ RECOMMENDED
- Use Miyabi Orchestra
- 11 CodeGenAgents in parallel
- Git worktrees for isolation
- **Duration**: 4-6 weeks
- **Risk**: MEDIUM

### Option C: Hybrid (Balanced)
- Phases 1-2: Sequential (validate pattern)
- Phases 3-5: Parallel (proven pattern)
- **Duration**: 6-7 weeks
- **Risk**: LOW-MEDIUM

---

## 🚀 Parallel Execution Plan (Option B)

### Orchestra Setup

```bash
# Step 1: Create worktrees for all servers
miyabi worktree create mcp-migration-rules
miyabi worktree create mcp-migration-context
miyabi worktree create mcp-migration-tmux
miyabi worktree create mcp-migration-obsidian
miyabi worktree create mcp-migration-pixel
miyabi worktree create mcp-migration-sse
miyabi worktree create mcp-migration-lark1
miyabi worktree create mcp-migration-lark2
miyabi worktree create mcp-migration-lark3
miyabi worktree create mcp-migration-miyabi
miyabi worktree create mcp-migration-discord

# Step 2: Launch CoordinatorAgent
miyabi agent run CoordinatorAgent \
  --task "MCP Server Migration Orchestration" \
  --mode parallel \
  --workers 11

# Step 3: Assign tasks to CodeGenAgents
# CoordinatorAgent distributes servers to agents
```

### Agent Task Distribution

| Agent | Server | Worktree | Priority | ETA |
|-------|--------|----------|----------|-----|
| Agent-01 | rules-server | worktree-1 | P1 | Day 3 |
| Agent-02 | context-engineering | worktree-2 | P1 | Day 3 |
| Agent-03 | tmux-server 🔥 | worktree-3 | P2 | Day 5 |
| Agent-04 | obsidian-server | worktree-4 | P2 | Day 5 |
| Agent-05 | pixel-mcp | worktree-5 | P3 | Day 7 |
| Agent-06 | sse-gateway | worktree-6 | P3 | Day 10 |
| Agent-07 | lark-mcp-enhanced | worktree-7 | P4 | Day 12 |
| Agent-08 | lark-openapi | worktree-8 | P4 | Day 12 |
| Agent-09 | lark-wiki | worktree-9 | P4 | Day 12 |
| Agent-10 | miyabi-mcp-server | worktree-10 | P5 | Day 7 |
| Agent-11 | discord-mcp | worktree-11 | P5 | Day 7 |

---

## 📋 Migration Template

### Rust Crate Structure

```
crates/miyabi-mcp-<name>/
├── Cargo.toml
├── src/
│   ├── main.rs          # Entry point with transport
│   ├── lib.rs           # Server implementation
│   ├── tools/           # Tool handlers
│   │   ├── mod.rs
│   │   ├── tool1.rs
│   │   └── tool2.rs
│   ├── types.rs         # Schemas and types
│   └── error.rs         # Error handling
├── tests/
│   ├── integration.rs
│   └── tool_tests.rs
└── README.md
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
# MCP SDK
rmcp = { version = "0.8.0", features = ["server"] }

# Async runtime
tokio = { workspace = true, features = ["full"] }
async-trait = { workspace = true }

# Serialization
serde = { workspace = true, features = ["derive"] }
serde_json = { workspace = true }

# Schema generation
schemars = "0.8"

# Error handling
anyhow = { workspace = true }
thiserror = { workspace = true }

# Logging
tracing = { workspace = true }
tracing-subscriber = { workspace = true }

# Add server-specific deps here

[dev-dependencies]
tokio-test = "0.4"
```

### main.rs Template

```rust
use anyhow::Result;
use rmcp::{ServiceExt, transport::stdio};
use tracing_subscriber::{EnvFilter, fmt};

mod server;
use server::MiyabiServer;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_writer(std::io::stderr)
        .with_ansi(false)
        .init();

    tracing::info!("Starting Miyabi MCP Server");

    // Create server and connect
    let service = MiyabiServer::new()
        .serve(stdio())
        .await?;

    service.waiting().await?;
    Ok(())
}
```

### Server Implementation Template

```rust
use rmcp::{
    ErrorData as McpError,
    handler::server::router::tool::ToolRouter,
    model::*,
    tool, tool_router,
};

#[derive(Clone)]
pub struct MiyabiServer {
    tool_router: ToolRouter<MiyabiServer>,
    // Add state here
}

#[tool_router]
impl MiyabiServer {
    pub fn new() -> Self {
        Self {
            tool_router: Self::tool_router(),
        }
    }

    #[tool(description = "Example tool")]
    async fn example_tool(
        &self,
        args: ExampleArgs,
    ) -> Result<CallToolResult, McpError> {
        // Implementation
        Ok(CallToolResult::success(vec![
            Content::text("Success")
        ]))
    }
}
```

---

## ✅ Success Criteria

### Per-Server Checklist

- [ ] Rust crate compiles without warnings
- [ ] All tools implemented and tested
- [ ] MCP Inspector validation passes
- [ ] Integration tests pass
- [ ] Performance ≥ TypeScript version
- [ ] Documentation complete
- [ ] Claude Code config updated
- [ ] TypeScript version marked deprecated

### Project-Level Criteria

- [ ] All 11 servers migrated
- [ ] Zero regression in functionality
- [ ] Performance improvement documented
- [ ] CI/CD pipeline updated
- [ ] Deployment documentation complete
- [ ] Migration retrospective written

---

## 🎯 Risk Management

### High-Risk Items

1. **Lark SDK Dependency**
   - **Risk**: No official Rust Lark SDK
   - **Mitigation**: Create minimal bindings OR use HTTP API directly

2. **tmux-server Critical Path**
   - **Risk**: Breaks Miyabi Orchestra if broken
   - **Mitigation**: Thorough testing, rollback plan

3. **OAuth2 in sse-gateway**
   - **Risk**: Complex authentication flow
   - **Mitigation**: Use rmcp OAuth examples as reference

4. **Parallel Merge Conflicts**
   - **Risk**: 11 worktrees merging simultaneously
   - **Mitigation**: Coordinator enforces merge queue

### Rollback Strategy

Each phase has a rollback plan:
- Keep TypeScript servers running in parallel
- Feature flag for Rust vs TypeScript selection
- Gradual Claude Code config migration

---

## 📊 Success Metrics

### Performance Targets

| Metric | TypeScript | Rust Target | Improvement |
|--------|-----------|-------------|-------------|
| Startup Time | 200-500ms | <50ms | 4-10x |
| Memory Usage | 50-100MB | 5-20MB | 5-10x |
| Request Latency | 10-50ms | 1-5ms | 10x |
| Binary Size | N/A (node_modules) | 5-15MB | N/A |

### Quality Targets

- **Code Coverage**: >80% for all new crates
- **Zero Critical Bugs**: Before deprecating TypeScript
- **Documentation**: 100% public API documented
- **Examples**: 1 example per server

---

## 📚 References

- [RMCP SDK Documentation](https://github.com/modelcontextprotocol/rust-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Miyabi CLAUDE.md](../CLAUDE.md)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

---

## 🎬 Next Steps

**Immediate Actions**:
1. Review and approve this plan
2. Choose orchestration strategy (Sequential/Parallel/Hybrid)
3. Set up migration infrastructure (Phase 0)
4. Begin Phase 1 migration

**Decision Required**:
- Which orchestration strategy? (Recommend: **Option B - Parallel**)
- Resource allocation (11 CodeGenAgents available?)
- Timeline constraints (4-6 weeks acceptable?)

---

**Status**: ✅ Planning Complete - Awaiting Approval

**Last Updated**: 2025-11-19
**Next Review**: Start of Phase 0
