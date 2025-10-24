# Tutorial 7: MCP Integration - Extending Miyabi with Model Context Protocol

**Estimated Time**: 60 minutes
**Difficulty**: ⭐⭐⭐ Advanced
**Prerequisites**: Completed Tutorials 1-6, Understanding of APIs and protocols, Node.js/npm installed

## Learning Objectives

By the end of this tutorial, you will:
- Understand the Model Context Protocol (MCP) architecture
- Install and configure MCP servers for Miyabi
- Integrate external tools via MCP (GitHub, filesystem, databases)
- Create your own custom MCP server
- Implement MCP-first development workflow
- Leverage MCP for powerful workflow automation

## Prerequisites

Before starting, ensure you have:
- **Completed Tutorials 1-6**: Strong foundation in Miyabi basics
- **Node.js 18+**: For running MCP servers (`node --version`)
- **npm or npx**: Package management (`npm --version`)
- **Python 3.8+**: For Python-based MCP servers (optional)
- **GitHub Token**: For GitHub MCP integration
- **Claude Code**: Configured and running

## Introduction

"First, check if MCP can do it. Then, build it yourself."

This is the golden rule of Miyabi development: the **MCP-First Approach**. Every task, before implementation, should first evaluate whether an existing MCP server can handle it. This prevents duplicate code, leverages community tools, and ensures maintainability.

Model Context Protocol (MCP) is an open standard created by Anthropic that enables Claude to connect to external data sources and tools. Think of MCP as a universal plugin system where:

- **MCP Servers** = Plugins that expose capabilities (tools, resources, prompts)
- **MCP Clients** = Applications that use these capabilities (Claude Code, Claude Desktop)
- **JSON-RPC 2.0** = Communication protocol between client and server

In Miyabi's "GitHub as OS" architecture, MCP servers act as system daemons that extend Claude's capabilities beyond code generation. With MCP, your Agents can:

- Query GitHub repositories and manage Issues/PRs
- Read and write files with proper permissions
- Execute database queries
- Call external APIs
- Fetch documentation from 20,000+ libraries

In this tutorial, you'll master MCP integration, install essential servers, and even build your own custom MCP server.

## Understanding MCP Architecture

### MCP Component Model

```
┌─────────────────────────────────────────────────┐
│              Claude Code (MCP Client)           │
│  ┌───────────────────────────────────────────┐  │
│  │  AI Agent (CoordinatorAgent, etc.)       │  │
│  └───────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────┘
                    │ JSON-RPC 2.0
                    │ (stdio transport)
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐      ┌────────▼────────┐
│ MCP Server 1 │      │  MCP Server 2   │
│  (GitHub)    │      │  (Filesystem)   │
└───────┬──────┘      └────────┬────────┘
        │                      │
┌───────▼──────┐      ┌────────▼────────┐
│ GitHub API   │      │  Local Files    │
└──────────────┘      └─────────────────┘
```

### MCP Server Capabilities

Each MCP server can expose three types of capabilities:

1. **Tools**: Functions that Claude can invoke (e.g., `create_issue`, `search_files`)
2. **Resources**: Data sources Claude can read (e.g., file contents, database records)
3. **Prompts**: Pre-configured prompts for specific tasks

**Example**: The GitHub MCP server provides tools like:
- `create_issue` - Create a new GitHub Issue
- `get_issue` - Fetch Issue details
- `list_issues` - List Issues with filters
- `update_issue` - Update Issue metadata

## Installing Essential MCP Servers

### MCP Server 1: GitHub Integration

The GitHub MCP server is essential for Miyabi's autonomous workflow.

#### Step 1: Verify Claude Code Configuration

Claude Code automatically detects MCP servers from its config file:

```bash
# Check existing MCP servers
claude mcp list
```

If the GitHub MCP server isn't listed, let's add it.

#### Step 2: Configure GitHub MCP Server

Edit your Claude Code config file:

**macOS/Linux**:
```bash
vi ~/.config/claude/claude_desktop_config.json
```

**Windows**:
```powershell
notepad $env:APPDATA\Claude\claude_desktop_config.json
```

Add the GitHub MCP server:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

**Important**: Replace `ghp_xxx` with your actual GitHub token (created in Tutorial 1).

#### Step 3: Test GitHub MCP Server

Restart Claude Code (if running as a desktop app), then verify:

```bash
# List MCP servers
claude mcp list

# Should show:
# - github (@modelcontextprotocol/server-github)
```

#### Step 4: Use GitHub MCP in Miyabi

Now Miyabi Agents can use the GitHub MCP server automatically:

```rust
// In CoordinatorAgent (simplified pseudo-code)
let issue = mcp_client.call_tool("github", "get_issue", json!({
    "owner": "ShunsukeHayashi",
    "repo": "Miyabi",
    "issue_number": 500
})).await?;
```

### MCP Server 2: Filesystem Integration

The filesystem MCP server allows safe file operations with sandboxing.

#### Step 1: Add Filesystem MCP Server

Edit Claude Code config:

```json
{
  "mcpServers": {
    "github": { /* ... existing config ... */ },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/shunsuke/Dev/miyabi-private"
      ]
    }
  }
}
```

**Security Note**: The filesystem MCP server is sandboxed to the specified directory. It cannot access files outside `/Users/shunsuke/Dev/miyabi-private`.

#### Step 2: Verify Filesystem Access

```bash
# List MCP servers
claude mcp list

# Should now show:
# - github (@modelcontextprotocol/server-github)
# - filesystem (@modelcontextprotocol/server-filesystem)
```

#### Step 3: Use Filesystem MCP

Now Agents can read/write files via MCP:

```rust
// Read file via MCP
let content = mcp_client.call_tool("filesystem", "read_file", json!({
    "path": "Cargo.toml"
})).await?;

// Write file via MCP
mcp_client.call_tool("filesystem", "write_file", json!({
    "path": ".ai/plans/issue-500-plan.md",
    "content": "# Execution Plan\n..."
})).await?;
```

### MCP Server 3: Context7 (Documentation Fetcher)

Context7 is a powerful MCP server that fetches up-to-date documentation for 20,000+ libraries.

#### Step 1: Get Context7 API Key

1. Go to [context7.com](https://context7.com/)
2. Sign up for a free account
3. Copy your API key from the dashboard

#### Step 2: Add Context7 MCP Server

Edit Claude Code config:

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "filesystem": { /* ... */ },
    "context7": {
      "command": "npx",
      "args": [
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "c7_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

#### Step 3: Use Context7 in Development

When implementing features with external libraries, use Context7:

```bash
# In Claude Code prompt:
"Use context7 to get the latest Tokio async runtime documentation"

# Context7 fetches:
# - Tokio API docs
# - Usage examples
# - Best practices
# - Recent updates
```

**Example Scenario**: Implementing async Agent execution

```
You: "Implement async task scheduling with Tokio"

Claude Code (with Context7):
1. Calls context7 MCP server to fetch Tokio docs
2. Analyzes latest async/await patterns
3. Generates code using current best practices
4. Includes proper error handling based on latest Tokio patterns
```

### MCP Server 4: Miyabi Custom MCP Server

Miyabi includes a custom MCP server for Agent execution.

#### Step 1: Build Miyabi MCP Server

```bash
cd ~/Dev/Miyabi
cargo build --release --bin miyabi-mcp-server
```

#### Step 2: Add to Claude Code Config

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "filesystem": { /* ... */ },
    "context7": { /* ... */ },
    "miyabi": {
      "command": "/Users/shunsuke/Dev/Miyabi/target/release/miyabi-mcp-server",
      "args": [],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx",
        "ANTHROPIC_API_KEY": "sk-ant-xxx"
      }
    }
  }
}
```

#### Step 3: Use Miyabi MCP Server

```bash
# Execute CoordinatorAgent via MCP
claude code "Execute CoordinatorAgent for Issue 500 via MCP"

# Claude Code calls:
# - mcp_client.call_tool("miyabi", "execute_agent", {...})
```

## MCP-First Development Workflow

Now that MCP servers are configured, let's implement the MCP-First Approach.

### The Phase 0 Protocol

Every task begins with **Phase 0: MCP Evaluation**.

```
Task Received
    ↓
┌────────────────────┐
│ Phase 0: MCP Check │ ← MANDATORY FIRST STEP
└────────────────────┘
    ↓
[Q1] Can existing MCP handle this?
    ├─ Yes → Use existing MCP → Implementation
    └─ No → [Q2]
    ↓
[Q2] Should we create a new MCP server?
    ├─ Yes → Create MCP server → Implementation
    └─ No → Regular implementation
```

### Decision Matrix

**Use Existing MCP** if:
- ✅ External API interaction (GitHub, Slack, Notion)
- ✅ Database operations (PostgreSQL, MongoDB)
- ✅ File system operations
- ✅ Standard protocol available

**Create New MCP** if:
- ✅ Reusable across multiple projects
- ✅ Standard API exists
- ✅ High usage frequency expected
- ✅ Community value (shareable)
- ✅ ROI > 2.0 (ROI = (Reuses × Time Saved) / Creation Time)

**Regular Implementation** if:
- ❌ Project-specific business logic
- ❌ Performance-critical code
- ❌ Low reusability
- ❌ No standard API available

### Example: Implementing Issue Triage

**Task**: Automatically triage new Issues based on content analysis.

**Phase 0: MCP Evaluation**:

```bash
# Q1: Can existing MCP handle this?
claude mcp list | grep github
# → @modelcontextprotocol/server-github exists

# Q2: Does it have the required tools?
# - get_issue ✅
# - update_issue ✅
# - add_labels ✅

# Decision: ✅ Use existing GitHub MCP
```

**Implementation**:

```rust
// In IssueAgent
pub async fn triage_issue(&self, issue_number: u64) -> Result<()> {
    // Fetch Issue via GitHub MCP
    let issue = self.mcp_client.call_tool("github", "get_issue", json!({
        "owner": &self.config.github_owner,
        "repo": &self.config.github_repo,
        "issue_number": issue_number
    })).await?;

    // Analyze with AI
    let labels = self.analyze_issue_content(&issue).await?;

    // Update via GitHub MCP
    self.mcp_client.call_tool("github", "update_issue", json!({
        "owner": &self.config.github_owner,
        "repo": &self.config.github_repo,
        "issue_number": issue_number,
        "labels": labels
    })).await?;

    Ok(())
}
```

**Result**: Issue triage implemented in 30 minutes using existing MCP (vs. 2-3 hours implementing GitHub API client).

## Creating a Custom MCP Server

Let's create a custom MCP server for Qdrant vector search (knowledge base).

### Use Case: Miyabi Knowledge Search

Miyabi stores execution logs, plans, and documentation in a knowledge base powered by Qdrant. We'll create an MCP server to search this knowledge base.

### Step 1: Initialize MCP Server Project

```bash
cd ~/Dev
npx @modelcontextprotocol/create-server miyabi-mcp-qdrant
cd miyabi-mcp-qdrant
```

This creates a TypeScript MCP server template:

```
miyabi-mcp-qdrant/
├── src/
│   └── index.ts          # Main server implementation
├── package.json
├── tsconfig.json
└── README.md
```

### Step 2: Implement Qdrant MCP Server

Edit `src/index.ts`:

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { QdrantClient } from "@qdrant/js-client-rest";

// Qdrant client setup
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = "miyabi_knowledge";

// MCP Server setup
const server = new Server(
  {
    name: "miyabi-mcp-qdrant",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: Search knowledge base
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_knowledge",
        description: "Search Miyabi knowledge base for relevant information",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (natural language)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results",
              default: 5,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_document",
        description: "Retrieve a specific document by ID",
        inputSchema: {
          type: "object",
          properties: {
            document_id: {
              type: "string",
              description: "Document ID",
            },
          },
          required: ["document_id"],
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_knowledge") {
    const { query, limit = 5 } = args as { query: string; limit?: number };

    try {
      // Generate embedding (simplified - use actual embedding model)
      const embedding = await generateEmbedding(query);

      // Search Qdrant
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: embedding,
        limit: limit,
        with_payload: true,
      });

      // Format results
      const formatted = results.map((result) => ({
        id: result.id,
        score: result.score,
        title: result.payload?.title,
        content: result.payload?.content,
        source: result.payload?.source,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching knowledge base: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  if (name === "get_document") {
    const { document_id } = args as { document_id: string };

    try {
      const result = await qdrant.retrieve(COLLECTION_NAME, {
        ids: [document_id],
        with_payload: true,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result[0]?.payload || {}, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving document: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Helper: Generate embedding (simplified)
async function generateEmbedding(text: string): Promise<number[]> {
  // In production, use actual embedding model (OpenAI, Cohere, etc.)
  // For demo purposes, return dummy embedding
  return Array(384).fill(0).map(() => Math.random());
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Miyabi Qdrant MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

### Step 3: Install Dependencies

```bash
npm install @modelcontextprotocol/sdk @qdrant/js-client-rest
npm install --save-dev typescript @types/node
```

Update `package.json`:

```json
{
  "name": "miyabi-mcp-qdrant",
  "version": "1.0.0",
  "description": "MCP server for Miyabi knowledge base search (Qdrant)",
  "type": "module",
  "bin": {
    "miyabi-mcp-qdrant": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "@qdrant/js-client-rest": "^1.7.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 4: Build and Test

```bash
# Build TypeScript
npm run build

# Test MCP server with Inspector
npx @modelcontextprotocol/inspector npx -y miyabi-mcp-qdrant
```

The MCP Inspector opens in your browser, showing available tools:
- `search_knowledge`
- `get_document`

Try invoking `search_knowledge` with:
```json
{
  "query": "How to implement CoordinatorAgent",
  "limit": 3
}
```

### Step 5: Integrate with Claude Code

Add to Claude Code config:

```json
{
  "mcpServers": {
    "github": { /* ... */ },
    "filesystem": { /* ... */ },
    "context7": { /* ... */ },
    "miyabi": { /* ... */ },
    "miyabi-qdrant": {
      "command": "npx",
      "args": ["-y", "miyabi-mcp-qdrant"],
      "env": {
        "QDRANT_URL": "http://localhost:6333",
        "QDRANT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Step 6: Use in Miyabi Agents

Now CoordinatorAgent can search knowledge base:

```rust
// In CoordinatorAgent
pub async fn find_similar_implementations(&self, query: &str) -> Result<Vec<Document>> {
    let results = self.mcp_client.call_tool("miyabi-qdrant", "search_knowledge", json!({
        "query": query,
        "limit": 5
    })).await?;

    // Parse results
    let docs: Vec<Document> = serde_json::from_str(&results)?;
    Ok(docs)
}
```

**Example Usage**:

```bash
# CoordinatorAgent processing Issue #500
# → Searches: "How to implement authentication in Rust"
# → Finds: Previous auth implementations, best practices, test patterns
# → Generates better code using historical knowledge
```

## Advanced MCP Patterns

### Pattern 1: MCP Server Chaining

Chain multiple MCP servers for complex workflows.

**Scenario**: Automatically create GitHub Issue from Slack message.

```rust
// 1. Receive Slack message via Slack MCP
let message = mcp_client.call_tool("slack", "get_message", json!({
    "channel": "C123456",
    "timestamp": "1234567890.123456"
})).await?;

// 2. Analyze content with AI
let issue_data = analyze_message(&message).await?;

// 3. Create GitHub Issue via GitHub MCP
mcp_client.call_tool("github", "create_issue", json!({
    "owner": "ShunsukeHayashi",
    "repo": "Miyabi",
    "title": issue_data.title,
    "body": issue_data.body,
    "labels": issue_data.labels
})).await?;
```

### Pattern 2: MCP Resource Subscriptions

Monitor resources for changes (e.g., watch file system).

```typescript
// In MCP server
server.setRequestHandler(SubscribeResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Watch file for changes
  fs.watch(uri, (event, filename) => {
    // Notify client of changes
    server.sendNotification({
      method: "resource_updated",
      params: { uri, event },
    });
  });

  return { success: true };
});
```

### Pattern 3: MCP Prompt Templates

Provide pre-configured prompts for common tasks.

```typescript
// In MCP server
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "create_agent",
        description: "Scaffold a new Miyabi Agent",
        arguments: [
          {
            name: "agent_name",
            description: "Name of the Agent (e.g., 'SecurityAgent')",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "create_agent") {
    const { agent_name } = args;

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a new Miyabi Agent named ${agent_name}.

Include:
- Rust implementation in crates/miyabi-agents/src/${agent_name.toLowerCase()}.rs
- Agent specification in .claude/agents/specs/coding/${agent_name.toLowerCase()}-agent.md
- Unit tests
- Integration with BaseAgent trait

Follow Miyabi coding standards.`,
          },
        },
      ],
    };
  }
});
```

Usage in Claude Code:

```bash
# Use prompt template
claude code "Use MCP prompt 'create_agent' with agent_name='SecurityAgent'"
```

## MCP Security Best Practices

### 1. API Key Management

**Bad**:
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "ghp_hardcoded_token_bad"
      }
    }
  }
}
```

**Good**:
```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Then:
```bash
# In shell profile (.bashrc, .zshrc)
export GITHUB_TOKEN="ghp_xxx"
```

### 2. Principle of Least Privilege

Grant MCP servers minimal required permissions:

```json
{
  "mcpServers": {
    "filesystem": {
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/shunsuke/Dev/miyabi-private",
        "--read-only"
      ]
    }
  }
}
```

### 3. Audit MCP Server Code

Before installing third-party MCP servers:

```bash
# Review source code
git clone https://github.com/example/mcp-server
cd mcp-server
cat src/index.ts  # Review implementation

# Check for suspicious patterns:
# - Unexpected network requests
# - File system access outside scope
# - Credential exfiltration
```

### 4. Rate Limiting

Implement rate limiting in custom MCP servers:

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

// Apply to MCP tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  await limiter.check(request);
  // ... tool implementation
});
```

## Troubleshooting MCP Issues

### Issue 1: MCP Server Not Listed

**Symptom**: `claude mcp list` doesn't show your server.

**Solution**:
```bash
# 1. Check config file syntax
cat ~/.config/claude/claude_desktop_config.json | jq .

# 2. Verify command exists
which npx
npx -y @modelcontextprotocol/server-github --version

# 3. Restart Claude Code
# (Desktop app: Quit and relaunch)

# 4. Check Claude Code logs
tail -f ~/.local/state/claude/logs/mcp.log
```

### Issue 2: Authentication Failures

**Symptom**: "Unauthorized" or "Invalid credentials" errors.

**Solution**:
```bash
# 1. Verify environment variable is set
echo $GITHUB_TOKEN

# 2. Test token manually
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# 3. Check token scopes
# Go to GitHub Settings → Developer settings → Tokens
# Verify scopes include: repo, workflow

# 4. Regenerate token if needed
```

### Issue 3: MCP Server Crashes

**Symptom**: MCP server exits immediately or returns errors.

**Solution**:
```bash
# 1. Run MCP server directly to see errors
npx -y @modelcontextprotocol/server-github

# 2. Check for missing dependencies
npm install -g @modelcontextprotocol/server-github

# 3. Verify Node.js version
node --version  # Should be 18+

# 4. Check MCP server logs
# (Most MCP servers log to stderr)
```

### Issue 4: Slow MCP Response

**Symptom**: MCP tools take a long time to respond.

**Solution**:
```bash
# 1. Check network connectivity (for API-based MCP servers)
ping api.github.com

# 2. Implement caching in custom MCP servers
# (Cache API responses for 5-10 minutes)

# 3. Use connection pooling for database MCP servers

# 4. Monitor rate limits
# (GitHub API: 5000 requests/hour)
```

## Success Checklist

Before considering yourself an MCP integration master:

- [ ] Installed and configured GitHub MCP server
- [ ] Installed and configured filesystem MCP server
- [ ] Installed and configured Context7 MCP server
- [ ] Created a custom MCP server from scratch
- [ ] Tested MCP server with MCP Inspector
- [ ] Integrated custom MCP server with Miyabi
- [ ] Implemented MCP-First workflow in your development process
- [ ] Secured MCP servers with proper authentication and sandboxing
- [ ] Successfully chained multiple MCP servers in a workflow

## Next Steps

Congratulations! You've mastered MCP integration and extended Miyabi's capabilities beyond code generation. Here's what to explore next:

1. **Tutorial 8: Testing Strategies** - Learn comprehensive testing approaches for Miyabi Agents
2. **Tutorial 9: CI/CD and Deployment** - Automate testing and deployment with GitHub Actions
3. **Explore MCP Ecosystem** - Browse [MCP Server Directory](https://github.com/modelcontextprotocol/servers) for more integrations

## Additional Resources

- **MCP Official Docs**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **MCP TypeScript SDK**: [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- **MCP Python SDK**: [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- **MCP Server Directory**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **Miyabi MCP Integration Protocol**: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- **Context7 Documentation**: [context7.com/docs](https://context7.com/docs)

## Appendix: MCP Server Checklist

### Before Publishing Your MCP Server

- [ ] **README.md**: Installation, configuration, examples
- [ ] **LICENSE**: MIT or Apache 2.0 recommended
- [ ] **package.json**: Complete metadata (name, version, description, keywords)
- [ ] **Security Audit**: No hardcoded credentials, proper input validation
- [ ] **Error Handling**: Graceful error messages, no stack traces to client
- [ ] **Logging**: Structured logs to stderr (not stdout)
- [ ] **Rate Limiting**: Prevent abuse
- [ ] **Tests**: Unit tests for all tools
- [ ] **CI/CD**: Automated testing on GitHub Actions
- [ ] **Documentation**: JSDoc comments for all exported functions
- [ ] **Versioning**: Semantic versioning (semver)

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)
