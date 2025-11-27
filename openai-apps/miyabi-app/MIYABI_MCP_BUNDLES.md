# 🔌 Miyabi MCP Bundles - Complete Catalog

**Complete inventory of all Model Context Protocol servers in the Miyabi ecosystem**

Last Updated: 2025-11-28
Total Servers: 31+

---

## 📊 Quick Stats

- **Core Servers**: 5 (Always enabled)
- **Gemini 3 Series**: 4 servers
- **Lark Integration**: 3 servers
- **Miyabi Tools**: 18 servers
- **Development Tools**: 2 servers
- **Status**: Operational ✅

---

## 🎯 Core Servers (Always Enabled)

### 1. **miyabi** (Rust MCP Server) ⭐
**Path**: `target/release/miyabi-mcp-server`
**Status**: ✅ Active
**Description**: Main Miyabi Rust MCP Server - Agent execution via JSON-RPC 2.0

**Features**:
- 21 autonomous agents via A2A Bridge
- Coding agents: Coordinator, CodeGen, Review, Issue, PR, Deployment, Refresher
- Business agents: 14 agents for market research, sales, CRM, analytics, etc.
- GitHub integration
- RUST_LOG support

**Crate**: `crates/miyabi-mcp-server/`

---

### 2. **filesystem**
**Package**: `@modelcontextprotocol/server-filesystem`
**Status**: ✅ Active
**Description**: Standard MCP filesystem access for project files

---

### 3. **github-enhanced**
**Path**: `.claude/mcp-servers/github-enhanced.cjs`
**Status**: ✅ Active
**Description**: Enhanced GitHub operations for Issue/PR management

**Features**:
- Issue CRUD operations
- PR management
- Repository operations
- Enhanced query capabilities

---

### 4. **project-context**
**Path**: `.claude/mcp-servers/project-context.cjs`
**Status**: ✅ Active
**Description**: Project-specific context and dependency information

---

### 5. **ide-integration**
**Path**: `.claude/mcp-servers/ide-integration.cjs`
**Status**: ✅ Active
**Description**: VS Code diagnostics and Jupyter execution integration

---

## 🤖 Gemini 3 Series (4 Servers)

### 6. **gemini3-uiux-designer**
**Path**: `mcp-servers/gemini3-uiux-designer/`
**Status**: ✅ Active
**Description**: UI/UX design review and optimization (Jonathan Ive design philosophy)

**Features**:
- Design review and feedback
- UI/UX best practices
- Accessibility audits
- Design system recommendations

---

### 7. **gemini3-adaptive-runtime**
**Path**: `mcp-servers/gemini3-adaptive-runtime/`
**Status**: ✅ Active
**Description**: Adaptive runtime with dynamic model selection

---

### 8. **gemini3-image-gen**
**Path**: `mcp-servers/gemini3-image-gen/`
**Status**: ✅ Active
**Description**: Gemini 3 Pro Preview (Nano Banana Pro) image generation

**API**: GEMINI_API_KEY required

---

### 9. **gemini-image-generation** (Legacy)
**Path**: `.claude/mcp-servers/image-generation.js`
**Status**: ✅ Active
**Description**: Gemini 2.5 Flash Image - Text-to-image generation (for note.com articles)

---

## 🐦 Lark Integration (3 Servers)

### 10. **lark-openapi**
**Package**: `lark-openapi-mcp-enhanced`
**Status**: ✅ Active
**Description**: Lark OpenAPI MCP - Bitable/Base + IM tools (optimized selection)

**Tools**:
- Bitable operations (CRUD, search)
- Message creation/listing
- Chat management
- Member operations

**Credentials**:
- App ID: `cli_a8d2fdb1f1f8d02d`
- App Secret: Configured

---

### 11. **lark-mcp-enhanced**
**Path**: `mcp-servers/lark-mcp-enhanced/`
**Version**: 0.4.0
**Status**: ✅ Active
**Description**: Enhanced Lark MCP with workspace bot deployment

**Features**:
- Workspace bot integration
- Chat agent support
- Docker deployment
- Development/production modes

---

### 12. **lark-wiki-mcp-agents**
**Path**: `mcp-servers/lark-wiki-mcp-agents/`
**Status**: ✅ Active
**Description**: Lark Wiki control agents using MCP tools

**Features**:
- Wiki management
- Topic indexing
- Automated documentation

---

## 🛠️ Miyabi Tools (18 Servers)

### 13. **miyabi-mcp** (Main)
**Path**: `mcp-servers/miyabi-mcp/`
**Status**: ✅ Active
**Description**: Central Miyabi MCP server bundle

---

### 14. **miyabi-claude-code**
**Path**: `mcp-servers/miyabi-claude-code/`
**Status**: ✅ Active
**Description**: Claude Code integration for Miyabi

---

### 15. **miyabi-codex**
**Path**: `mcp-servers/miyabi-codex/`
**Status**: ✅ Active
**Description**: Codex integration for code generation

---

### 16. **miyabi-commercial-agents**
**Path**: `mcp-servers/miyabi-commercial-agents/`
**Status**: ✅ Active
**Description**: Commercial agent bundle (business automation)

---

### 17. **miyabi-file-access**
**Path**: `mcp-servers/miyabi-file-access/`
**Status**: ✅ Active
**Description**: Enhanced file access with permissions

---

### 18. **miyabi-file-watcher**
**Path**: `mcp-servers/miyabi-file-watcher/`
**Status**: ✅ Active
**Description**: Real-time file system monitoring

---

### 19. **miyabi-git-inspector**
**Path**: `mcp-servers/miyabi-git-inspector/`
**Status**: ✅ Active
**Description**: Git repository inspection and analysis

---

### 20. **miyabi-github**
**Path**: `mcp-servers/miyabi-github/`
**Status**: ✅ Active
**Description**: GitHub API integration

---

### 21. **miyabi-log-aggregator**
**Path**: `mcp-servers/miyabi-log-aggregator/`
**Status**: ✅ Active
**Description**: Centralized log collection and analysis

---

### 22. **miyabi-network-inspector**
**Path**: `mcp-servers/miyabi-network-inspector/`
**Status**: ✅ Active
**Description**: Network traffic monitoring and analysis

---

### 23. **miyabi-obsidian-server**
**Path**: `mcp-servers/miyabi-obsidian-server/`
**Status**: ✅ Active
**Description**: Obsidian vault integration

**Features**:
- Note creation/update
- Search and indexing
- Graph navigation
- Tag management

---

### 24. **miyabi-openai-assistant**
**Path**: `mcp-servers/miyabi-openai-assistant/`
**Status**: ✅ Active
**Description**: OpenAI Assistant API integration

---

### 25. **miyabi-pixel-mcp**
**Path**: `mcp-servers/miyabi-pixel-mcp/`
**Status**: ✅ Active
**Description**: Pixel-specific MCP server (Termux optimized)

---

### 26. **miyabi-process-inspector**
**Path**: `mcp-servers/miyabi-process-inspector/`
**Status**: ✅ Active
**Description**: System process monitoring

---

### 27. **miyabi-resource-monitor**
**Path**: `mcp-servers/miyabi-resource-monitor/`
**Status**: ✅ Active
**Description**: CPU, memory, disk monitoring

---

### 28. **miyabi-rules-server**
**Path**: `mcp-servers/miyabi-rules-server/`
**Status**: ✅ Active
**Description**: Rule engine for automation

---

### 29. **miyabi-sse-gateway**
**Path**: `mcp-servers/miyabi-sse-gateway/`
**Status**: ✅ Active
**Description**: Server-Sent Events gateway for real-time updates

**Features**:
- SSE transport
- Real-time streaming
- Security middleware
- Rate limiting

---

### 30. **miyabi-tmux**
**Path**: `mcp-servers/miyabi-tmux-server/`
**Status**: ✅ Active
**Description**: Miyabi tmux MCP Server - Multithread communication aggregation & CommHub

**Features**:
- Tmux session management
- Pane/window control
- Multi-agent communication
- Command execution

---

## 🔧 Development Tools (2 Servers)

### 31. **context-engineering**
**Path**: `external/context-engineering-mcp/mcp-server/`
**Status**: ✅ Active
**Description**: Context Engineering - AI-powered context analysis

**Requirements**: External API at `http://localhost:8888`

---

### 32. **discord-community**
**Path**: `.claude/mcp-servers/discord-integration.js`
**Status**: ✅ Active
**Description**: Miyabi Discord community management

**Features**:
- Bot management
- Channel operations
- Community announcements
- GitHub integration
- Support channels (JP/EN)

**Credentials**:
- Bot token configured
- Guild ID configured
- Multiple channel integrations

---

## 🗄️ Legacy/Deprecated Servers

### miyabi-legacy
**Status**: ❌ Disabled
**Description**: Node.js版 Miyabi統合 (deprecated, use Rust version)

---

## 📦 Installation & Usage

### Install All Dependencies

```bash
# Install Node.js servers
cd mcp-servers
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    (cd "$dir" && npm install)
  fi
done

# Build Rust MCP server
cargo build --release -p miyabi-mcp-server
```

### Configuration

All servers are configured in `.claude/mcp.json`. Environment variables:

```bash
# Core
GITHUB_TOKEN=          # GitHub API access
MIYABI_ROOT=          # Project root path

# Gemini
GEMINI_API_KEY=       # Gemini API access
GOOGLE_API_KEY=       # Google API access

# Lark
LARK_APP_ID=          # Lark app ID
LARK_APP_SECRET=      # Lark app secret

# Discord
DISCORD_BOT_TOKEN=    # Discord bot token
DISCORD_GUILD_ID=     # Discord guild ID
```

### Testing Individual Servers

```bash
# Test Rust MCP server
./target/release/miyabi-mcp-server

# Test Node.js server
node mcp-servers/<server-name>/dist/index.js

# Test with MCP client
npx @modelcontextprotocol/inspector
```

---

## 🚀 Agent-to-Agent (A2A) Bridge

The Rust MCP server exposes 21 agents through the A2A Bridge:

### Coding Agents (7)
1. CoordinatorAgent - Task coordination
2. CodeGenAgent - Code generation
3. ReviewAgent - Code review
4. IssueAgent - Issue management
5. PRAgent - Pull request automation
6. DeploymentAgent - CI/CD deployment
7. RefresherAgent - Issue status updates

### Business Agents (14)
1. AIEntrepreneurAgent - Business planning
2. SelfAnalysisAgent - Self analysis
3. MarketResearchAgent - Market research
4. PersonaAgent - Persona development
5. ProductConceptAgent - Product concept
6. ProductDesignAgent - Product design
7. ContentCreationAgent - Content creation
8. FunnelDesignAgent - Funnel design
9. SNSStrategyAgent - SNS strategy
10. MarketingAgent - Marketing execution
11. SalesAgent - Sales management
12. CRMAgent - Customer management
13. AnalyticsAgent - Data analysis
14. YouTubeAgent - YouTube optimization

---

## 📊 Server Distribution

```
Core Servers:      5 (16%)
Gemini Series:     4 (13%)
Lark Integration:  3 (10%)
Miyabi Tools:     18 (58%)
Development:       2 (6%)
━━━━━━━━━━━━━━━━━━━━━━
Total:            32 (100%)
```

---

## 🔗 Related Documentation

- [Miyabi MCP Quickstart](../../mcp-servers/MIYABI_MCP_QUICKSTART.md)
- [Lark Wiki Integration](../../mcp-servers/LARK_WIKI_INTEGRATION.md)
- [A2A Bridge Guide](../../.claude/agents/RUST_TOOL_USE_GUIDE.md)
- [MCP Configuration](../../.claude/mcp.json)

---

**Maintained by**: Miyabi Development Team
**Last Audit**: 2025-11-28
**Next Review**: On feature additions
