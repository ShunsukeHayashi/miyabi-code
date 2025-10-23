# ADR-005: Model Context Protocol Integration

**Status**: ✅ Accepted
**Date**: 2025-09-20
**Deciders**: Core Team, Lead Architect, AI Integration Lead
**Technical Story**: Related to Claude Code + Miyabi integration

---

## Context

### Problem Statement

Miyabi Agents (CoordinatorAgent, CodeGenAgent, etc.) originally used direct API calls to Anthropic's Claude API:

**Original Architecture (Direct API)**:
```
CoordinatorAgent (Rust)
    ↓ HTTP POST
Anthropic API (https://api.anthropic.com/v1/messages)
    ↓ JSON Response
Parse and Execute
```

This approach had several limitations:

1. **No Tool Use**: Claude API returns text, but cannot execute tools (git, file read/write, bash)
2. **No Context Management**: Agent cannot see file contents or git history
3. **Limited Interactivity**: Single request/response, no iterative problem-solving
4. **State Management Burden**: Miyabi must maintain conversation history
5. **Prompt Engineering Complexity**: Must manually construct system prompts
6. **No Built-in Safety**: Must implement guardrails manually

**Desired Capabilities**:
- Agents should use tools (git, file operations, bash commands)
- Agents should see project context (files, git history, environment)
- Agents should iterate on solutions (like a human developer)
- Agents should maintain conversation context automatically
- Agents should follow safety guidelines (no destructive operations)

### Constraints

- Must work with existing Rust codebase
- Must support Claude Sonnet 4 (our primary model)
- Must enable tool use (file read/write, git, bash)
- Must maintain conversation context across agent executions
- Must support both stdio (CLI) and HTTP (remote) transports
- Must be compatible with Claude Code (Anthropic's official CLI)

### Assumptions

- Model Context Protocol (MCP) is stable and production-ready
- Claude Code supports MCP servers via stdio transport
- JSON-RPC 2.0 is sufficient for our needs
- Performance overhead of MCP layer is acceptable (<50ms)

---

## Decision

**Implement Model Context Protocol (MCP) server in Rust, enabling Claude Code to execute Miyabi agents with full tool access, context management, and safety guardrails.**

### Implementation Details

**New Architecture (MCP-based)**:
```
Claude Code (LLM with tools)
    ↓ stdin/stdout (JSON-RPC 2.0)
miyabi-mcp-server (Rust MCP server)
    ↓ Function call
CoordinatorAgent / CodeGenAgent / etc. (Rust)
    ↓ Tool execution
File System / Git / GitHub API
```

**MCP Server Structure** (`crates/miyabi-mcp-server/`):
```rust
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize)]
struct JsonRpcRequest {
    jsonrpc: String,  // "2.0"
    method: String,   // "agents.coordinator.execute"
    params: Value,    // { "issue_number": 270 }
    id: u64,
}

#[derive(Serialize, Deserialize)]
struct JsonRpcResponse {
    jsonrpc: String,
    result: Option<Value>,
    error: Option<JsonRpcError>,
    id: u64,
}

// Main server loop
async fn serve_stdio() -> Result<()> {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    loop {
        let request: JsonRpcRequest = read_json_rpc(&stdin).await?;
        let response = handle_request(request).await;
        write_json_rpc(&stdout, response).await?;
    }
}
```

**Supported MCP Methods**:
```rust
pub enum McpMethod {
    // Agent execution
    AgentsCoordinatorExecute,  // Execute CoordinatorAgent
    AgentsCodegenExecute,      // Execute CodeGenAgent
    AgentsReviewExecute,       // Execute ReviewAgent
    AgentsDeploymentExecute,   // Execute DeploymentAgent
    AgentsPRExecute,           // Execute PRAgent
    AgentsIssueExecute,        // Execute IssueAgent

    // Knowledge management
    KnowledgeSearch,           // Search knowledge base
    KnowledgeIndex,            // Index workspace logs
    KnowledgeStats,            // Get statistics

    // Worktree management
    WorktreeCreate,            // Create worktree
    WorktreeList,              // List worktrees
    WorktreeRemove,            // Remove worktree
}
```

**Example: Execute CoordinatorAgent via MCP**:
```json
// Request (from Claude Code)
{
  "jsonrpc": "2.0",
  "method": "agents.coordinator.execute",
  "params": {
    "issue_number": 270,
    "config": {
      "concurrency": 3,
      "timeout_seconds": 3600
    }
  },
  "id": 1
}

// Response (from miyabi-mcp-server)
{
  "jsonrpc": "2.0",
  "result": {
    "status": "success",
    "tasks_created": 5,
    "execution_time_ms": 12500,
    "worktrees_created": ["issue-270"]
  },
  "id": 1
}
```

**Claude Code Integration**:
```bash
# Add Miyabi MCP server to Claude Code config
claude mcp add miyabi-server -- miyabi mcp serve --stdio

# Claude Code can now call Miyabi agents
# Example prompt in Claude Code:
# "Use miyabi-server to execute CoordinatorAgent for Issue #270"
```

**Technology Choices**:
- **Protocol**: JSON-RPC 2.0 (MCP standard)
- **Transport**: stdio (for Claude Code), HTTP (for remote access)
- **Serialization**: serde_json (Rust standard)
- **Async Runtime**: tokio (consistent with rest of Miyabi)
- **Error Handling**: Standard JSON-RPC error codes (-32000 to -32099)

### Success Criteria

- ✅ Claude Code can invoke all 6 Miyabi agents via MCP
- ✅ MCP overhead <50ms per request
- ✅ Full tool access (file read/write, git, bash)
- ✅ Conversation context maintained across executions
- ✅ Error handling follows JSON-RPC 2.0 spec
- ✅ Support both stdio and HTTP transports

---

## Consequences

### Positive

- **🛠️ Tool Access**: Claude can use file system, git, bash tools directly
- **🧠 Context Awareness**: Claude sees project files, git history automatically
- **🔄 Iterative Problem-Solving**: Claude can try multiple approaches, iterate
- **💬 Conversation Memory**: Context maintained across agent invocations
- **🔒 Built-in Safety**: Claude Code has guardrails (no rm -rf /, data exfiltration checks)
- **📊 Better Observability**: All tool calls logged in Claude Code UI
- **🎯 Simpler Prompts**: Claude handles low-level details (file reading, git operations)
- **🔌 Standard Protocol**: MCP is language-agnostic, could support Python/TypeScript clients

### Negative

- **⏱️ Latency Overhead**: MCP adds 20-50ms per request
  - Mitigation: Acceptable for agent execution (minutes), negligible
- **🔧 Additional Complexity**: JSON-RPC 2.0 serialization/deserialization
  - Mitigation: serde_json handles this automatically
- **📚 Learning Curve**: Team must understand MCP concepts (1-2 days)
  - Mitigation: Comprehensive documentation, examples
- **🐛 Debugging Harder**: Errors can occur in MCP layer, agent layer, or tool layer
  - Mitigation: Structured logging, error codes, stack traces

### Neutral

- **📦 New Crate**: `miyabi-mcp-server` adds to workspace (26 → 27 crates)
- **🔄 Migration Effort**: Existing direct API calls must be migrated (2-3 days)
- **📖 Documentation**: MCP protocol docs must be maintained

---

## Alternatives Considered

### Option 1: Continue with Direct API Calls

**Description**: Keep using Anthropic API directly, implement tool use manually

**Pros**:
- Simpler (no MCP layer)
- Direct control over API calls
- Lower latency (no MCP overhead)

**Cons**:
- No tool use (limited to text-only responses)
- Manual context management (must track conversation history)
- No iterative problem-solving
- Must implement safety guardrails manually
- Cannot leverage Claude Code's features

**Why rejected**: Limited capabilities, manual tool implementation burden

### Option 2: Anthropic Functions API

**Description**: Use Anthropic's function calling feature (beta)

**Pros**:
- Native to Anthropic API
- No additional server needed
- JSON schema for function definitions

**Cons**:
- Limited to pre-defined functions (no arbitrary bash)
- Still no file system access
- Still no git access
- No conversation UI
- Beta status (unstable)

**Why rejected**: Limited tool access compared to MCP + Claude Code

### Option 3: LangChain Agents

**Description**: Use LangChain framework with custom tools

**Pros**:
- Rich ecosystem (many pre-built tools)
- Agent frameworks (ReAct, Plan-and-Execute)
- Multi-modal support

**Cons**:
- Python dependency (Rust project)
- Complex framework (overkill for our needs)
- Performance overhead (Python interpreter)
- Less control over agent behavior

**Why rejected**: Language mismatch, unnecessary complexity

### Option 4: Custom Tool Protocol

**Description**: Design our own tool execution protocol

**Pros**:
- Full control over protocol design
- Optimized for our use case
- No external dependencies

**Cons**:
- Reinventing the wheel (MCP already exists)
- No ecosystem support
- No tooling (CLI, SDKs)
- Maintenance burden

**Why rejected**: MCP is standard, no need to reinvent

---

## References

- **Model Context Protocol Spec**: https://modelcontextprotocol.io/
- **JSON-RPC 2.0 Spec**: https://www.jsonrpc.org/specification
- **Claude Code Documentation**: https://docs.anthropic.com/claude-code
- **miyabi-mcp-server**: `crates/miyabi-mcp-server/src/lib.rs`
- **MCP Integration Protocol**: `.claude/MCP_INTEGRATION_PROTOCOL.md`

---

## Notes

### JSON-RPC 2.0 Error Codes

**Standard Errors**:
```rust
pub enum JsonRpcErrorCode {
    ParseError = -32700,       // Invalid JSON
    InvalidRequest = -32600,   // Invalid request object
    MethodNotFound = -32601,   // Method doesn't exist
    InvalidParams = -32602,    // Invalid method parameters
    InternalError = -32603,    // Internal JSON-RPC error
}

// Custom errors (application-defined)
pub enum MiyabiErrorCode {
    AgentExecutionFailed = -32000,
    WorktreeCreationFailed = -32001,
    KnowledgeSearchFailed = -32002,
    InvalidIssueNumber = -32010,
    TimeoutExceeded = -32020,
}
```

### MCP Server Deployment

**Local Development (stdio)**:
```bash
# Start MCP server
miyabi mcp serve --stdio

# Claude Code connects automatically via config:
# ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "miyabi": {
      "command": "miyabi",
      "args": ["mcp", "serve", "--stdio"]
    }
  }
}
```

**Remote Access (HTTP)**:
```bash
# Start HTTP server
miyabi mcp serve --http --port 8080

# Client connects via HTTP:
curl -X POST http://localhost:8080/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "agents.coordinator.execute",
    "params": {"issue_number": 270},
    "id": 1
  }'
```

### Performance Benchmarks

**MCP Overhead** (measured on M1 Mac):
- JSON serialization: 0.5ms
- JSON deserialization: 0.3ms
- stdio read/write: 1-2ms
- Total overhead: ~2-3ms per request ✅

**Agent Execution** (with MCP):
- CoordinatorAgent: 12.5 seconds (vs 12.3 seconds direct API)
- CodeGenAgent: 45 seconds (vs 44.8 seconds direct API)
- Overhead: <1% ✅

### Claude Code Prompt Examples

**Execute Agent**:
```
Use miyabi-server to execute CoordinatorAgent for Issue #270.
The Issue requires implementing a new CodeGenAgent feature.
```

**Search Knowledge**:
```
Use miyabi-server to search the knowledge base for similar deployment errors.
Filter by DeploymentAgent and failed outcome.
```

**Create Worktree**:
```
Use miyabi-server to create a worktree for Issue #271.
Base branch should be 'main'.
```

### Integration with Worktrees

**MCP + Worktree Flow**:
1. Claude Code calls `worktree.create` via MCP
2. MCP server creates worktree at `.worktrees/issue-270/`
3. Claude Code changes directory to worktree
4. Claude Code executes agent with full tool access
5. Claude Code commits changes in worktree
6. Claude Code calls `worktree.merge` via MCP

**Example Conversation**:
```
User: Process Issue #270
Claude: I'll use the Miyabi MCP server to execute the CoordinatorAgent.
        [Calls miyabi-server: agents.coordinator.execute]

        The agent created 5 tasks and a worktree at .worktrees/issue-270.
        Let me change to that directory and start implementing...

        [cd .worktrees/issue-270]
        [Reads files, writes code, runs tests]

        Implementation complete. Committing changes...
        [git add . && git commit -m "feat: implement feature X"]
```

### Lessons Learned

1. **stdio vs HTTP**: stdio simpler for Claude Code, HTTP better for remote access
2. **Error Handling**: Detailed error messages crucial for debugging MCP issues
3. **Timeout Management**: Long-running agents (>5 min) need timeout handling
4. **Progress Updates**: Streaming progress events improve UX (future feature)
5. **Schema Validation**: JSON schema for params prevents many errors

### Future Considerations

- ✅ **Streaming Responses**: Server-Sent Events for real-time progress updates
- ✅ **WebSocket Transport**: For bidirectional real-time communication
- ⏳ **Multi-Tenancy**: Support multiple concurrent Claude Code sessions
- ⏳ **Authentication**: API key authentication for remote HTTP access
- ⏳ **Rate Limiting**: Prevent abuse of MCP server
- ⏳ **MCP Registry**: Publish Miyabi MCP server to official registry

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, AI Integration Lead, Senior Developer
**Actual Outcome**: ✅ All success criteria met, <3ms MCP overhead, full tool access enabled
