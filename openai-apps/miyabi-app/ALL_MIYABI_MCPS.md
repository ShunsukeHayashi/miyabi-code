# 🔌 ALL Miyabi MCP Servers - Complete Directory

**Complete catalog of all Model Context Protocol servers in the Miyabi ecosystem**

Total Servers: **32+**
Active in Config: **13**
Status: Operational ✅

Last Updated: 2025-11-28

---

## 📊 Quick Stats

```
Total MCP Servers:        32+
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By Category:
├─ Core (Always On):       5  ████░░░░░░░░░░░░░░░░
├─ Gemini Series:          4  ███░░░░░░░░░░░░░░░░░
├─ Lark Integration:       3  ██░░░░░░░░░░░░░░░░░░
├─ Miyabi Tools:          18  ████████████░░░░░░░░
└─ Development:            2  █░░░░░░░░░░░░░░░░░░░

By Status:
├─ Active (in mcp.json):  13  ████████░░░░░░░░░░░░
├─ Available (installed): 19  ████████████░░░░░░░░
└─ Disabled/Legacy:        1  ░░░░░░░░░░░░░░░░░░░░
```

---

## 🎯 Active Servers (Currently Configured)

These servers are **enabled in `.claude/mcp.json`**:

### 1. **filesystem** 🗂️
- **Type**: Core
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Status**: ✅ Active
- **Purpose**: Standard MCP filesystem access
- **Location**: npm global package
- **Command**: `npx -y @modelcontextprotocol/server-filesystem .`

---

### 2. **miyabi** (Rust MCP Server) ⭐
- **Type**: Core - Main Agent Server
- **Binary**: `target/release/miyabi-mcp-server`
- **Status**: ✅ Active
- **Purpose**: **21 autonomous agents via A2A Bridge**
- **Features**:
  - 7 Coding Agents (Coordinator, CodeGen, Review, Issue, PR, Deploy, Refresher)
  - 14 Business Agents (Entrepreneur, Market, Sales, CRM, Analytics, YouTube, etc.)
  - GitHub integration
  - JSON-RPC 2.0 protocol
- **Crate**: `crates/miyabi-mcp-server/`
- **Agents**: See [A2A Bridge section](#-a2a-bridge-agents-21)

---

### 3. **github-enhanced** 🐙
- **Type**: Core
- **Path**: `.claude/mcp-servers/github-enhanced.cjs`
- **Status**: ✅ Active
- **Purpose**: Enhanced GitHub operations
- **Features**:
  - Issue CRUD
  - PR management
  - Repository operations
  - Advanced queries

---

### 4. **project-context** 📋
- **Type**: Core
- **Path**: `.claude/mcp-servers/project-context.cjs`
- **Status**: ✅ Active
- **Purpose**: Project-specific context and dependency info

---

### 5. **ide-integration** 💻
- **Type**: Development
- **Path**: `.claude/mcp-servers/ide-integration.cjs`
- **Status**: ✅ Active
- **Purpose**: VS Code diagnostics & Jupyter execution integration

---

### 6. **context-engineering** 🧠
- **Type**: Development
- **Path**: `external/context-engineering-mcp/mcp-server/index.js`
- **Status**: ✅ Active
- **Purpose**: AI-powered context analysis
- **Requirements**: External API at `http://localhost:8888`

---

### 7. **gemini-image-generation** 🎨
- **Type**: Gemini Series
- **Path**: `.claude/mcp-servers/image-generation.js`
- **Status**: ✅ Active
- **Purpose**: Gemini 2.5 Flash Image - Text-to-image (note.com articles)
- **Env**: `GOOGLE_API_KEY`

---

### 8. **discord-community** 💬
- **Type**: Community
- **Path**: `.claude/mcp-servers/discord-integration.js`
- **Status**: ✅ Active
- **Purpose**: Discord community management
- **Features**:
  - Bot management
  - Channel operations
  - GitHub integration
  - Support channels (JP/EN)
- **Env**: `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, channels

---

### 9. **lark-openapi** 🐦
- **Type**: Lark Integration
- **Package**: `lark-openapi-mcp-enhanced`
- **Path**: `mcp-servers/lark-openapi-mcp-enhanced/dist/cli.js`
- **Status**: ✅ Active
- **Purpose**: Lark OpenAPI MCP - Bitable/Base + IM
- **Tools**: 22 tools (Bitable CRUD, messages, chats, members)
- **App**: `cli_a8d2fdb1f1f8d02d`

---

### 10. **miyabi-tmux** 📺
- **Type**: Miyabi Tools
- **Path**: `mcp-servers/miyabi-tmux-server/dist/index.js`
- **Status**: ✅ Active
- **Purpose**: tmux multithread communication aggregation & CommHub
- **Features**:
  - Session management
  - Pane/window control
  - Multi-agent communication

---

### 11. **gemini3-image-gen** 🌟
- **Type**: Gemini Series
- **Path**: `mcp-servers/gemini3-image-gen/dist/simple-server.js`
- **Status**: ✅ Active
- **Purpose**: Gemini 3 Pro Preview (Nano Banana Pro) image generation
- **Env**: `GEMINI_API_KEY`

---

### 12. **miyabi-legacy** 🗂️
- **Type**: Legacy
- **Path**: `.claude/mcp-servers/miyabi-integration.js`
- **Status**: ❌ Disabled
- **Purpose**: Node.js版 Miyabi統合 (deprecated)
- **Note**: Use Rust version instead

---

## 📦 Available MCP Servers (Installed)

These servers are **installed but not currently active** in config:

### Gemini 3 Series

#### **gemini3-uiux-designer** 🎨
- **Path**: `mcp-servers/gemini3-uiux-designer/`
- **Purpose**: UI/UX design review (Jonathan Ive philosophy)
- **Features**: Design review, best practices, accessibility audits

#### **gemini3-adaptive-runtime** ⚙️
- **Path**: `mcp-servers/gemini3-adaptive-runtime/`
- **Purpose**: Adaptive runtime with dynamic model selection

#### **gemini3-general** 🤖
- **Path**: `mcp-servers/gemini3-general/`
- **Purpose**: General-purpose Gemini integration
- **Features**: Code generation, analysis, problem solving

---

### Lark Integration

#### **lark-mcp-enhanced** 🐦
- **Path**: `mcp-servers/lark-mcp-enhanced/`
- **Version**: 0.4.0
- **Purpose**: Enhanced Lark MCP with workspace bot
- **Features**: Workspace bot, chat agent, Docker deployment

#### **lark-wiki-mcp-agents** 📚
- **Path**: `mcp-servers/lark-wiki-mcp-agents/`
- **Purpose**: Lark Wiki control agents
- **Features**: Wiki management, topic indexing, automated docs

---

### Miyabi Tools Suite (18 servers)

#### **miyabi-mcp** 🌸
- **Path**: `mcp-servers/miyabi-mcp/`
- **Purpose**: Central Miyabi MCP server bundle

#### **miyabi-claude-code** 💻
- **Path**: `mcp-servers/miyabi-claude-code/`
- **Purpose**: Claude Code integration

#### **miyabi-codex** 📝
- **Path**: `mcp-servers/miyabi-codex/`
- **Purpose**: Codex integration for code generation

#### **miyabi-commercial-agents** 💼
- **Path**: `mcp-servers/miyabi-commercial-agents/`
- **Purpose**: Commercial agent bundle (business automation)

#### **miyabi-file-access** 📂
- **Path**: `mcp-servers/miyabi-file-access/`
- **Purpose**: Enhanced file access with permissions

#### **miyabi-file-watcher** 👁️
- **Path**: `mcp-servers/miyabi-file-watcher/`
- **Purpose**: Real-time file system monitoring

#### **miyabi-git-inspector** 🔍
- **Path**: `mcp-servers/miyabi-git-inspector/`
- **Purpose**: Git repository inspection and analysis

#### **miyabi-github** 🐙
- **Path**: `mcp-servers/miyabi-github/`
- **Purpose**: GitHub API integration

#### **miyabi-log-aggregator** 📊
- **Path**: `mcp-servers/miyabi-log-aggregator/`
- **Purpose**: Centralized log collection and analysis

#### **miyabi-network-inspector** 🌐
- **Path**: `mcp-servers/miyabi-network-inspector/`
- **Purpose**: Network traffic monitoring

#### **miyabi-obsidian-server** 📓
- **Path**: `mcp-servers/miyabi-obsidian-server/`
- **Purpose**: Obsidian vault integration
- **Features**: Note CRUD, search, graph navigation, tags

#### **miyabi-openai-assistant** 🤖
- **Path**: `mcp-servers/miyabi-openai-assistant/`
- **Purpose**: OpenAI Assistant API integration

#### **miyabi-pixel-mcp** 📱
- **Path**: `mcp-servers/miyabi-pixel-mcp/`
- **Purpose**: Pixel-specific MCP server (Termux optimized)

#### **miyabi-process-inspector** 🔧
- **Path**: `mcp-servers/miyabi-process-inspector/`
- **Purpose**: System process monitoring

#### **miyabi-resource-monitor** 📈
- **Path**: `mcp-servers/miyabi-resource-monitor/`
- **Purpose**: CPU, memory, disk monitoring

#### **miyabi-rules-server** 📜
- **Path**: `mcp-servers/miyabi-rules-server/`
- **Purpose**: Rule engine for automation

#### **miyabi-sse-gateway** 🌊
- **Path**: `mcp-servers/miyabi-sse-gateway/`
- **Purpose**: Server-Sent Events gateway
- **Features**: SSE transport, real-time streaming, security, rate limiting

#### **miyabi-lark-dev-docs-mcp** 📖
- **Path**: `mcp-servers/miyabi-lark-dev-docs-mcp/`
- **Purpose**: Lark developer documentation MCP

---

## 🤖 A2A Bridge Agents (21)

Accessed through the **miyabi** Rust MCP server:

### Coding Agents (7)

1. **CoordinatorAgent** - `coordinator`
   - Task coordination and parallel execution
   - DAG-based orchestration
   - Agent selection and routing

2. **CodeGenAgent** - `codegen`
   - AI-driven code generation
   - Claude Sonnet 4 powered
   - Issue-based implementation

3. **ReviewAgent** - `review`
   - Code quality review
   - Security scanning
   - Quality scoring

4. **IssueAgent** - `issue`
   - Issue analysis and label management
   - 57-label system
   - Hierarchical issue management

5. **PRAgent** - `pr`
   - Pull request automation
   - Conventional Commits
   - Draft PR generation

6. **DeploymentAgent** - `deploy`
   - CI/CD deployment automation
   - Firebase/AWS deployment
   - Health checks
   - Auto rollback

7. **RefresherAgent** - `refresher`
   - Issue status monitoring
   - Auto-update
   - Project status refresh

### Business Agents (14)

8. **AIEntrepreneurAgent** - `ai_entrepreneur`
   - Comprehensive business planning
   - Startup strategy

9. **SelfAnalysisAgent** - `self_analysis`
   - Career/skill analysis
   - Achievement tracking

10. **MarketResearchAgent** - `market_research`
    - Market research
    - Competitive analysis
    - 20+ competitor analysis

11. **PersonaAgent** - `persona`
    - Persona development
    - Customer journey design
    - 3-5 detailed personas

12. **ProductConceptAgent** - `product_concept`
    - USP design
    - Revenue model
    - Business model canvas

13. **ProductDesignAgent** - `product_design`
    - Service detailed design
    - 6-month content plan
    - Technical stack
    - MVP definition

14. **ContentCreationAgent** - `content_creation`
    - Video/article/material creation
    - Content production plan

15. **FunnelDesignAgent** - `funnel_design`
    - Customer journey optimization
    - Awareness → Purchase → LTV

16. **SNSStrategyAgent** - `sns_strategy`
    - SNS strategy (Twitter/Instagram/YouTube)
    - Posting calendar

17. **MarketingAgent** - `marketing`
    - Marketing execution
    - Ad/SEO/SNS campaigns

18. **SalesAgent** - `sales`
    - Sales management
    - Lead → Customer conversion
    - Sales process optimization

19. **CRMAgent** - `crm`
    - Customer management
    - Customer satisfaction improvement
    - LTV maximization

20. **AnalyticsAgent** - `analytics`
    - Data analysis
    - PDCA cycle
    - Continuous improvement

21. **YouTubeAgent** - `youtube`
    - YouTube channel optimization
    - Content strategy
    - 13 workflows

---

## 📋 MCP Server Management

### Check Active Servers

```bash
# View configuration
cat .claude/mcp.json | jq '.mcpServers | keys[]'

# Check if Rust MCP server is built
ls -lh target/release/miyabi-mcp-server

# Check Node.js MCP servers
ls -la mcp-servers/
```

### Enable a Server

Edit `.claude/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["path/to/server.js"],
      "disabled": false  // Set to false to enable
    }
  }
}
```

### Test a Server

```bash
# Test Rust MCP server
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | ./target/release/miyabi-mcp-server

# Test Node.js server
node mcp-servers/server-name/dist/index.js

# Test with MCP inspector
npx @modelcontextprotocol/inspector
```

---

## 🚀 Installation Guide

### Install All MCP Servers

```bash
# Navigate to project root
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# Build Rust MCP server
cargo build --release -p miyabi-mcp-server

# Install Node.js MCP servers
cd mcp-servers
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    echo "Installing $dir..."
    (cd "$dir" && npm install)
  fi
done
```

### Environment Variables

Required for various servers:

```bash
# Core
export GITHUB_TOKEN="ghp_..."
export MIYABI_ROOT="/path/to/miyabi-private"

# Gemini
export GEMINI_API_KEY="..."
export GOOGLE_API_KEY="..."

# Lark
export LARK_APP_ID="..."
export LARK_APP_SECRET="..."

# Discord
export DISCORD_BOT_TOKEN="..."
export DISCORD_GUILD_ID="..."

# XAI
export XAI_API_KEY="..."
```

---

## 📊 Usage Examples

### Execute Agent via Rust MCP

```bash
# List available tools
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | \
  ./target/release/miyabi-mcp-server

# Execute CodeGen agent
echo '{
  "jsonrpc":"2.0",
  "method":"a2a.execute",
  "id":1,
  "params":{
    "tool_name":"a2a.code_generation_agent.generate_code",
    "input":{"issue_number":123}
  }
}' | ./target/release/miyabi-mcp-server
```

### Use Lark MCP

```bash
# Start Lark MCP server
node mcp-servers/lark-openapi-mcp-enhanced/dist/cli.js mcp \
  --mode stdio \
  --app-id "$LARK_APP_ID" \
  --app-secret "$LARK_APP_SECRET"

# Create message
# (Send via MCP client)
```

### Use Gemini Image Generation

```bash
# Start server
node mcp-servers/gemini3-image-gen/dist/simple-server.js

# Generate image
# (Send via MCP client with image prompt)
```

---

## 🔗 Related Files

- `.claude/mcp.json` - Active server configuration
- `mcp-servers/` - All MCP server implementations
- `crates/miyabi-mcp-server/` - Rust MCP server source
- `.claude/mcp-servers/` - Additional MCP servers

---

## 📚 Documentation

- [MIYABI_MCP_BUNDLES.md](./MIYABI_MCP_BUNDLES.md) - Detailed catalog
- [.claude/agents/RUST_TOOL_USE_GUIDE.md](../../.claude/agents/RUST_TOOL_USE_GUIDE.md) - A2A Bridge guide
- [MCP Specification](https://modelcontextprotocol.io/) - Official MCP docs

---

**Total: 32+ MCP Servers | 21 AI Agents | 13 Active Servers**

Last Updated: 2025-11-28
