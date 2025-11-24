# Lark/Feishu MCP Integration Guide

**Last Updated**: 2025-11-20
**Version**: 1.0.0
**Status**: ✅ Phase 2 Complete

---

## 📊 Overview

This guide documents the 4 Lark/Feishu MCP servers integrated into the Miyabi project, providing comprehensive access to Lark Open Platform APIs for messaging, documents, collaboration, and AI-powered features.

---

## 🔧 MCP Server Catalog

### 1. lark-openapi-mcp-enhanced (Primary - Full-Featured)

**Purpose**: Complete Lark OpenAPI access + Genesis AI system for creating Lark Base applications

**Path**: `mcp-servers/lark-openapi-mcp-enhanced/`

**Status**: ✅ Built and Ready

**Configuration**:
```json
{
  "lark-openapi-mcp-enhanced": {
    "command": "node",
    "args": [
      "mcp-servers/lark-openapi-mcp-enhanced/dist/cli.js",
      "mcp",
      "--mode",
      "stdio",
      "--app-id",
      "${LARK_APP_ID}",
      "--app-secret",
      "${LARK_APP_SECRET}",
      "--domain",
      "https://open.larksuite.com"
    ],
    "disabled": true
  }
}
```

**Environment Variables Required**:
- `LARK_APP_ID`: Your Lark app ID (e.g., `cli_a994d7e3b8789e1a`)
- `LARK_APP_SECRET`: Your Lark app secret

**Key Features**:
- **Full API Access**: 500+ Lark OpenAPI endpoints
- **Genesis AI System**: Create complete Lark Base applications from natural language
- **Multi-Agent Orchestration**: Specialized agents for different workflows
- **Bilingual Support**: English and Chinese tool documentation
- **Auto Permission Management**: Automatic permission handling

**Tool Categories**:
1. **Messaging** (`im.v1.*`): Send messages, create chats, manage groups
2. **Documents** (`docx.v1.*`, `wiki.v2.*`): Create/edit documents, manage wikis
3. **Bitable/Base** (`bitable.v1.*`): Database operations, record management
4. **Calendar** (`calendar.v4.*`): Event management, scheduling
5. **Drive** (`drive.v1.*`): File management, permissions
6. **Genesis AI** (`genesis.*`): AI-powered Base application creation

**When to Use**:
- Primary Lark integration server
- When you need comprehensive API access
- Creating Lark Base applications with AI
- Complex multi-step workflows

---

### 2. lark-mcp-enhanced (Miyabi-Customized)

**Purpose**: Miyabi-customized Lark integration with automatic permission management

**Path**: `mcp-servers/lark-mcp-enhanced/`

**Status**: ⚠️ Requires Setup (thin wrapper over lark-openapi-mcp-enhanced)

**Configuration**:
```json
{
  "lark-mcp-enhanced": {
    "command": "node",
    "args": [
      "mcp-servers/lark-mcp-enhanced/dist/cli.js",
      "mcp",
      "--mode",
      "stdio",
      "--app-id",
      "${LARK_APP_ID}",
      "--app-secret",
      "${LARK_APP_SECRET}",
      "--domain",
      "https://open.larksuite.com",
      "--tools",
      "preset.default,auto.permission.manager"
    ],
    "disabled": true
  }
}
```

**Environment Variables Required**:
- `LARK_APP_ID`: Your Lark app ID
- `LARK_APP_SECRET`: Your Lark app secret

**Key Features**:
- **Auto Permission Manager**: Automatically grants permissions to `hayashi.s@customercloud.ai`
- **Tool Presets**: Pre-configured tool collections (default, base, docs, collab, genesis)
- **Miyabi Integration**: Customized for Miyabi project workflows

**Available Presets**:
- `preset.default`: Default tool collection + auto permission manager
- `preset.base.default`: Base/Bitable operations only
- `preset.doc.default`: Document operations only
- `preset.im.default,preset.calendar.default,preset.task.default`: Collaboration tools
- `preset.genesis.default`: Genesis AI tools

**When to Use**:
- When you need automatic permission management
- Specific tool preset requirements
- Miyabi-specific workflows

**Note**: Currently requires `dist/` directory setup. May need to symlink or use lark-openapi-mcp-enhanced directly.

---

### 3. miyabi-lark-dev-docs-mcp (Documentation Crawler)

**Purpose**: Scrapes official Lark documentation using Chrome DevTools Protocol with authenticated sessions

**Path**: `mcp-servers/miyabi-lark-dev-docs-mcp/`

**Status**: ✅ Ready (ES Module)

**Configuration**:
```json
{
  "miyabi-lark-dev-docs-mcp": {
    "command": "node",
    "args": [
      "mcp-servers/miyabi-lark-dev-docs-mcp/src/index.js"
    ],
    "env": {
      "CHROME_EXECUTABLE_PATH": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    },
    "disabled": true
  }
}
```

**Environment Variables Required**:
- `CHROME_EXECUTABLE_PATH`: Path to Chrome browser executable

**Key Features**:
- **Chrome DevTools Protocol**: Uses puppeteer-core for authenticated scraping
- **Session Persistence**: Maintains login session for accessing protected docs
- **Content Extraction**: Parses documentation structure with Cheerio
- **Offline Storage**: Saves crawled data to JSON for offline access

**Tool Capabilities**:
- `crawl_documentation`: Scrape Lark API Explorer, Client Docs, Server Docs
- `get_api_structure`: Extract API Explorer structure and query parameters
- `search_docs`: Search within crawled documentation

**When to Use**:
- Need to access latest Lark documentation
- Building context for AI agents about Lark APIs
- Analyzing API Explorer structure

**Previous Crawl Data**:
- Location: `mcp-servers/miyabi-lark-dev-docs-mcp/crawled-data/`
- Latest: `lark-docs-hierarchy-2025-11-20T02-43-55-272Z.json`

---

### 4. lark-wiki-mcp-agents (Wiki Administration)

**Purpose**: Wiki space administration and content management with Bitable integration

**Path**: `mcp-servers/lark-wiki-mcp-agents/`

**Status**: ✅ Built and Ready

**Configuration**:
```json
{
  "lark-wiki-mcp-agents": {
    "command": "node",
    "args": [
      "mcp-servers/lark-wiki-mcp-agents/dist/cli.js"
    ],
    "env": {
      "LARK_APP_ID": "${LARK_APP_ID}",
      "LARK_APP_SECRET": "${LARK_APP_SECRET}"
    },
    "disabled": true
  }
}
```

**Environment Variables Required**:
- `LARK_APP_ID`: Your Lark app ID
- `LARK_APP_SECRET`: Your Lark app secret

**Key Features**:
- **Wiki Space Control**: Create, move, delete wiki nodes
- **Permission Management**: Hierarchical permission control with "Stopper Pages"
- **Bitable Integration**: Link wiki pages to Bitable apps via obj_token
- **Security Controls**: Public/private access management
- **Content Operations**: Search, retrieve, export wiki content

**Agent Commands** (from CLAUDE.md):
- `C1`: Wiki Space Operations (initialize, security control, public exposure)
- `C2`: Node Management (create, move, delete nodes)
- `C3`: Permission Management (member permissions, sharing control)
- `C4`: Content Operations (search, Bitable integration)
- `C5`: Automation (scheduled tasks, event triggers)

**Critical Workflow**:
```
1. Get wiki node → wiki_v2_space_getNode(wiki_node_token)
2. Extract obj_token from response
3. Use obj_token as app_token for Bitable operations
4. Perform Bitable operations → bitable_v1_appTable_*(obj_token, ...)
```

**When to Use**:
- Wiki space administration
- Linking wiki pages to Bitable apps
- Hierarchical permission management
- Wiki content automation

---

## 🚀 Quick Start

### Step 1: Set Environment Variables

Create or update `.env` file:
```bash
# Lark Application Credentials
LARK_APP_ID=cli_a994d7e3b8789e1a
LARK_APP_SECRET=your_app_secret_here

# Optional: Chrome path for docs crawler
CHROME_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Step 2: Enable MCP Server(s)

Edit `.claude/mcp.json` and set `"disabled": false` for the server(s) you want to use.

**Recommended Primary Server**: `lark-openapi-mcp-enhanced`

```json
{
  "lark-openapi-mcp-enhanced": {
    "disabled": false  // Change from true to false
  }
}
```

### Step 3: Restart Claude Code

After enabling MCP servers, restart Claude Code to load the tools.

### Step 4: Verify Tools Available

```bash
# In Claude Code session
claude mcp list | grep lark
```

You should see tools like:
- `im_v1_message_create`
- `docx_v1_document_create`
- `bitable_v1_appTableRecord_create`
- etc.

---

## 📖 Tool Naming Convention

All Lark MCP tools follow this pattern:
```
{project}.{version}.{resource}.{method}
```

**Examples**:
- `im.v1.message.create` - Create a message (Messaging)
- `bitable.v1.appTableRecord.list` - List Bitable records (Database)
- `docx.v1.document.rawContent` - Get document content (Documents)
- `wiki.v2.space.getNode` - Get wiki node (Wiki)
- `calendar.v4.calendarEvent.create` - Create calendar event (Calendar)

**API Explorer URL Pattern**:
```
https://open.larksuite.com/api-explorer/{app_id}?apiName={method}&project={project}&resource={resource}&version={version}
```

---

## 🔐 Authentication Flows

### Tenant Access Token (App-Level)
**Usage**: Most Lark API operations
**Scope**: Application-wide access
**Provided by**: `LARK_APP_ID` + `LARK_APP_SECRET`

```javascript
// MCP automatically handles tenant token
// No manual token management needed
```

### User Access Token (OAuth 2.0)
**Usage**: User-specific operations (personal calendar, tasks, etc.)
**Scope**: Individual user permissions
**Provided by**: OAuth 2.0 flow

```javascript
// For user-level operations, use:
params: {
  user_access_token: "${USER_ACCESS_TOKEN}"
}
```

---

## 💡 Common Integration Patterns

### Pattern 1: Send Notification to Lark Group

```javascript
// Tool: im.v1.message.create
{
  data: {
    receive_id: "oc_abc123",  // Group chat ID
    msg_type: "text",
    content: JSON.stringify({
      text: "🎉 Deployment successful!"
    })
  },
  params: {
    receive_id_type: "chat_id"
  }
}
```

### Pattern 2: Create Interactive Card

```javascript
// Tool: im.v1.message.create
{
  data: {
    receive_id: "oc_abc123",
    msg_type: "interactive",
    content: JSON.stringify({
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: "**Issue #123** has been completed\n\nClick button to review:"
          }
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "Review PR" },
              url: "https://github.com/..."
            }
          ]
        }
      ]
    })
  },
  params: {
    receive_id_type: "chat_id"
  }
}
```

### Pattern 3: Create Lark Doc with Content

```javascript
// Step 1: Create document
// Tool: docx.v1.document.create
{
  data: {
    folder_token: "fldcn_abc123",
    title: "Daily Report 2025-11-20"
  }
}

// Step 2: Add content blocks
// Tool: docx.v1.documentBlock.batchUpdate
{
  path: {
    document_id: "{document_id_from_step1}"
  },
  data: {
    requests: [
      {
        create_text: {
          text: "## Summary\n\nCompleted 5 tasks today..."
        }
      }
    ]
  }
}
```

### Pattern 4: Sync GitHub Issues to Lark Base

```javascript
// Step 1: Get Bitable app_token from wiki node
// Tool: wiki.v2.space.getNode
{
  params: {
    token: "JkKnwgeSViU4QWkj7FPj3dUGpVh"  // Wiki node token
  }
}
// Response: { obj_token: "N4p3bChGhajodqs96chj5UDXpRb" }

// Step 2: Create record in Bitable
// Tool: bitable.v1.appTableRecord.create
{
  path: {
    app_token: "N4p3bChGhajodqs96chj5UDXpRb",  // Use obj_token from Step 1
    table_id: "tblEshOhj7lctWxJ"  // Task management table
  },
  data: {
    fields: {
      "タスク名": "Fix authentication bug",
      "ステータス": "進行中",
      "担当者": ["ou_abc123"]
    }
  }
}
```

---

## 🛠️ Troubleshooting

See [MCP_LARK_TROUBLESHOOTING.md](./MCP_LARK_TROUBLESHOOTING.md) for detailed troubleshooting guide.

### Quick Fixes

#### MCP Server Not Loading
```bash
# Check if server is disabled
cat .claude/mcp.json | grep -A10 "lark-openapi-mcp-enhanced"

# Verify build status
ls mcp-servers/lark-openapi-mcp-enhanced/dist/
```

#### "NOTEXIST" Error with Bitable
```
Problem: Using wiki_node_token directly as app_token
Solution: Get obj_token from wiki.v2.space.getNode first, then use as app_token
```

#### Permission Denied
```
Problem: Insufficient app permissions
Solution:
1. Go to Lark Open Platform console
2. Navigate to App > Permissions
3. Add required scopes (e.g., bitable:record:write)
4. Regenerate app secret if needed
```

---

## 📚 Related Documentation

### Miyabi Context
- **Lark Platform Context**: `.claude/context/04-integrations/lark-platform.md` (~2,000 tokens)
- **Complete Architecture**: `.lark/LARK_PLATFORM_COMPLETE_ARCHITECTURE.md` (46KB)

### MCP Server Documentation
- **lark-openapi-mcp-enhanced**: `mcp-servers/lark-openapi-mcp-enhanced/CLAUDE.md`
- **lark-wiki-mcp-agents**: `mcp-servers/lark-wiki-mcp-agents/CLAUDE.md`

### External Resources
- **Lark Open Platform**: https://open.larksuite.com
- **API Explorer**: https://open.larksuite.com/api-explorer/
- **Developer Docs**: https://open.larksuite.com/document/

---

## 📊 Server Selection Matrix

| Use Case | Recommended Server | Alternative |
|----------|-------------------|-------------|
| Send messages/notifications | lark-openapi-mcp-enhanced | lark-mcp-enhanced (preset.im) |
| Create/manage documents | lark-openapi-mcp-enhanced | lark-mcp-enhanced (preset.doc) |
| Bitable/Base operations | lark-openapi-mcp-enhanced | lark-mcp-enhanced (preset.base) |
| Wiki administration | lark-wiki-mcp-agents | lark-openapi-mcp-enhanced |
| AI-powered Base creation | lark-openapi-mcp-enhanced (Genesis) | - |
| Documentation research | miyabi-lark-dev-docs-mcp | - |
| Auto permission management | lark-mcp-enhanced | lark-openapi-mcp-enhanced + manual |

---

## ✅ Phase 2 Completion Checklist

- ✅ mcp.json updated with all 4 Lark servers
- ✅ Environment variable requirements documented
- ✅ Tool capabilities cataloged
- ✅ Integration patterns documented
- ✅ Quick start guide provided
- ✅ Troubleshooting section created
- ✅ Server selection matrix provided

**Status**: ✅ Phase 2 Complete

**Next Phase**: Phase 3 - Skills & Commands Creation
