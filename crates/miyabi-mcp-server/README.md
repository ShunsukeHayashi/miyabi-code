# miyabi-mcp-server

**Model Context Protocol (MCP) server for language-agnostic Miyabi Agent execution via JSON-RPC 2.0.**

[![Crates.io](https://img.shields.io/crates/v/miyabi-mcp-server.svg)](https://crates.io/crates/miyabi-mcp-server)
[![Documentation](https://docs.rs/miyabi-mcp-server/badge.svg)](https://docs.rs/miyabi-mcp-server)
[![License](https://img.shields.io/crates/l/miyabi-mcp-server.svg)](../../LICENSE)

## 📋 Overview

`miyabi-mcp-server` implements the Model Context Protocol (MCP) via JSON-RPC 2.0, enabling language-agnostic integration with Codex CLI, GitHub Copilot, and other MCP clients. It exposes Miyabi's autonomous agent execution, GitHub operations, and knowledge management capabilities through a standardized RPC interface.

**Key Capabilities**:
- 🤖 **Agent Execution**: Coordinator, CodeGen, Review, Deploy, PR, Issue agents
- 🐙 **GitHub Integration**: Issue fetching, listing, and PR creation
- 🧠 **Knowledge Management**: Vector-based knowledge search
- 📡 **Dual Transport**: stdio (CLI) and HTTP (remote access)
- ⚡ **Performance**: LRU caching and async execution
- 📊 **Observability**: Metrics, health checks, and detailed logging

## 🚀 Features

### Supported RPC Methods

#### Agent Execution
| Method | Description | Parameters |
|--------|-------------|------------|
| `agent.coordinator.execute` | Execute CoordinatorAgent (DAG planning) | `{ "issue_number": 270 }` |
| `agent.codegen.execute` | Execute CodeGenAgent (code generation) | `{ "issue_number": 270 }` |
| `agent.review.execute` | Execute ReviewAgent (code review) | `{ "issue_number": 270 }` |
| `agent.deploy.execute` | Execute DeploymentAgent (CI/CD) | `{ "issue_number": 270 }` |
| `agent.pr.execute` | Execute PRAgent (PR creation) | `{ "issue_number": 270 }` |
| `agent.issue.execute` | Execute IssueAgent (label inference) | `{ "issue_number": 270 }` |

#### GitHub Operations
| Method | Description | Parameters |
|--------|-------------|------------|
| `github.issue.get` | Fetch single issue by number | `{ "issue_number": 270 }` |
| `github.issue.list` | List open issues with filters | `{ "state": "open", "labels": ["bug"] }` |
| `github.pr.create` | Create pull request | `{ "title": "...", "body": "...", "head": "..." }` |

#### Knowledge Management
| Method | Description | Parameters |
|--------|-------------|------------|
| `knowledge.search` | Vector similarity search | `{ "query": "async runtime", "limit": 10 }` |

#### Health & Status
| Method | Description | Returns |
|--------|-------------|---------|
| `server.health` | Check server health | `{ "status": "healthy", "uptime_secs": 12345 }` |
| `server.version` | Get server version | `{ "version": "0.1.0", "build": "..." }` |

### Transport Modes

- **stdio** (default): Standard input/output, ideal for CLI integration
- **HTTP**: HTTP server on configurable port (default: 3030), ideal for remote access

### Performance Features

- **LRU Caching**: Reduce redundant agent executions
- **Async Execution**: Non-blocking agent execution with Tokio
- **Connection Pooling**: Reuse GitHub API connections
- **Metrics Collection**: Track execution time, cache hit rate, error rate

## 📦 Installation

### As a Library
```toml
[dependencies]
miyabi-mcp-server = "0.1.0"
```

### As a Binary
```bash
cargo install miyabi-mcp-server
```

## 🔧 Usage

### Start Server (stdio mode)

```bash
# Default: stdio mode on stdin/stdout
miyabi-mcp-server

# With environment variables
export GITHUB_TOKEN=ghp_xxx
export DEVICE_IDENTIFIER=macbook-pro
miyabi-mcp-server
```

### Start Server (HTTP mode)

```bash
# HTTP mode on port 3030
miyabi-mcp-server --transport http --port 3030

# With custom config
miyabi-mcp-server \
  --transport http \
  --port 8080 \
  --github-token ghp_xxx \
  --repo-owner your-org \
  --repo-name your-repo
```

### Client Example (Python)

```python
import json
import subprocess

# Start MCP server as subprocess
server = subprocess.Popen(
    ["miyabi-mcp-server"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    text=True,
)

# Send JSON-RPC request
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "agent.coordinator.execute",
    "params": {
        "issue_number": 270
    }
}

server.stdin.write(json.dumps(request) + "\n")
server.stdin.flush()

# Read JSON-RPC response
response = json.loads(server.stdout.readline())
print(f"Result: {response['result']}")

# Output:
# Result: {
#   "status": "success",
#   "tasks_created": 5,
#   "execution_time_ms": 1234,
#   "agent_type": "coordinator"
# }
```

### Client Example (curl)

```bash
# Start HTTP server
miyabi-mcp-server --transport http --port 3030 &

# Execute Coordinator Agent
curl -X POST http://localhost:3030 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "agent.coordinator.execute",
    "params": {
      "issue_number": 270
    }
  }'

# Response:
# {
#   "jsonrpc": "2.0",
#   "id": 1,
#   "result": {
#     "status": "success",
#     "tasks_created": 5,
#     "execution_time_ms": 1234,
#     "agent_type": "coordinator"
#   }
# }

# Search knowledge base
curl -X POST http://localhost:3030 \
  -H "Content-Type": application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "knowledge.search",
    "params": {
      "query": "tokio async runtime",
      "limit": 5
    }
  }'
```

### Client Example (TypeScript)

```typescript
import { JsonRpcClient } from 'json-rpc-2.0';
import WebSocket from 'ws';

const client = new JsonRpcClient((request) => {
  const ws = new WebSocket('ws://localhost:3030');
  ws.send(JSON.stringify(request));
  return new Promise((resolve) => {
    ws.on('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
});

// Execute agent
const result = await client.request('agent.coordinator.execute', {
  issue_number: 270,
});

console.log(`Tasks created: ${result.tasks_created}`);
console.log(`Execution time: ${result.execution_time_ms}ms`);

// Search knowledge
const knowledge = await client.request('knowledge.search', {
  query: 'async runtime patterns',
  limit: 10,
});

console.log(`Found ${knowledge.results.length} results`);
```

## 📊 JSON-RPC Protocol

### Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "agent.coordinator.execute",
  "params": {
    "issue_number": 270
  }
}
```

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "success",
    "tasks_created": 5,
    "execution_time_ms": 1234,
    "agent_type": "coordinator"
  }
}
```

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params: issue_number must be positive"
  }
}
```

## 🏗️ Architecture

```
┌─────────────────────────┐
│  MCP Client             │ (Codex CLI, Python, TypeScript, etc.)
│  (JSON-RPC 2.0)         │
└─────────────────────────┘
           ↓ stdio/HTTP
┌─────────────────────────┐
│  miyabi-mcp-server      │
│  - RPC Handler          │
│  - LRU Cache            │
│  - Metrics Collector    │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│  RpcContext             │
│  - Agent Execution      │
│  - GitHub Client        │
│  - Knowledge Search     │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│  Miyabi Agents          │
│  - Coordinator          │
│  - CodeGen              │
│  - Review               │
│  - Deploy, PR, Issue    │
└─────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
export GITHUB_TOKEN=ghp_xxx

# Optional
export DEVICE_IDENTIFIER=macbook-pro
export REPO_OWNER=your-org
export REPO_NAME=your-repo
export CACHE_SIZE=1000
export LOG_LEVEL=info
```

### Command Line Arguments

```bash
miyabi-mcp-server --help

Options:
  -t, --transport <MODE>        Transport mode: stdio | http [default: stdio]
  -p, --port <PORT>             HTTP port [default: 3030]
  -g, --github-token <TOKEN>    GitHub personal access token
  -o, --repo-owner <OWNER>      Repository owner
  -r, --repo-name <NAME>        Repository name
  -c, --cache-size <SIZE>       LRU cache size [default: 1000]
  -v, --verbose                 Verbose logging
  -h, --help                    Print help
```

## 📈 Metrics & Observability

### Available Metrics

- **Request Count**: Total RPC requests received
- **Success Rate**: Percentage of successful requests
- **Error Rate**: Percentage of failed requests
- **Cache Hit Rate**: Percentage of cache hits
- **Avg Response Time**: Average execution time per method
- **Agent Execution Count**: Per-agent execution statistics

### Health Check

```bash
curl -X POST http://localhost:3030 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.health"
  }'

# Response:
# {
#   "jsonrpc": "2.0",
#   "id": 1,
#   "result": {
#     "status": "healthy",
#     "uptime_secs": 12345,
#     "total_requests": 1000,
#     "cache_hit_rate": 0.75,
#     "active_connections": 5
#   }
# }
```

## 🧪 Testing

```bash
# Run all tests
cargo test --package miyabi-mcp-server

# Run integration tests
cargo test --package miyabi-mcp-server --test integration_test

# Test with real GitHub API (requires GITHUB_TOKEN)
GITHUB_TOKEN=ghp_xxx cargo test --package miyabi-mcp-server -- --ignored
```

## 🔗 Dependencies

- **Core**: `miyabi-types`, `miyabi-core`, `miyabi-agents`, `miyabi-github`, `miyabi-worktree`, `miyabi-knowledge`
- **RPC**: `jsonrpc-core`, `jsonrpc-derive`, `jsonrpc-stdio-server`, `jsonrpc-http-server`
- **Runtime**: `tokio`, `async-trait`
- **Serialization**: `serde`, `serde_json`
- **Caching**: `lru`
- **Utilities**: `anyhow`, `thiserror`, `chrono`, `tracing`

## 📚 Related Crates

- [`miyabi-agents`](../miyabi-agents) - Agent implementations
- [`miyabi-github`](../miyabi-github) - GitHub API client
- [`miyabi-knowledge`](../miyabi-knowledge) - Knowledge management and vector search
- [`miyabi-worktree`](../miyabi-worktree) - Isolated execution environment
- [`miyabi-discord-mcp-server`](../miyabi-discord-mcp-server) - Discord-specific MCP server

## 🎯 Integration Examples

### Codex CLI Integration

```yaml
# codex.yaml
mcp_servers:
  - name: miyabi
    command: miyabi-mcp-server
    env:
      GITHUB_TOKEN: ${GITHUB_TOKEN}
      REPO_OWNER: your-org
      REPO_NAME: your-repo
```

### GitHub Copilot Integration

```json
{
  "github.copilot.mcp.servers": {
    "miyabi": {
      "command": "miyabi-mcp-server",
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

Licensed under the MIT License. See [LICENSE](../../LICENSE) for details.

## 🔖 Version History

- **v0.1.0** (2025-10-25): Initial release
  - JSON-RPC 2.0 server implementation
  - stdio and HTTP transport support
  - 6 agent execution methods
  - GitHub operations (issue, PR)
  - Knowledge search
  - LRU caching and metrics

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform
