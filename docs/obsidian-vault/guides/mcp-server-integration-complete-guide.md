---
title: "Miyabi MCP Server Integration - Complete Guide"
created: 2025-11-19
updated: 2025-11-19
author: "Claude Code"
category: "guides"
tags: ["miyabi", "mcp", "integration", "claude-desktop", "remote-servers", "architecture"]
status: "published"
version: "1.0.0"
---

# 🌐 Miyabi MCP Server Integration - Complete Guide

Complete guide for integrating Miyabi's MCP servers with Claude Desktop, Claude.ai, and Claude Code.

---

## 📊 Overview

### What is MCP?

**Model Context Protocol (MCP)** is a standard for connecting AI applications to external tools, data sources, and services. MCP servers expose three main capabilities:

1. **Resources** - File-like data sources
2. **Tools** - Callable functions
3. **Prompts** - Pre-written templates

### Miyabi MCP Ecosystem

Miyabi provides **4 specialized MCP servers** with **26+ tools** total:

| Server | Type | Tools | Purpose |
|--------|------|-------|---------|
| **miyabi-tmux** | Local (STDIO) | 6 | tmux session management |
| **miyabi-rules** | Local (STDIO) | ~3 | Rule validation |
| **miyabi-obsidian** | Local (STDIO) | 9 | Knowledge base management |
| **miyabi-society-aws** | Remote (SSE) | 7 | AWS-hosted orchestration |

---

## 🏗️ Architecture

### Transport Types

#### **STDIO (Local)**
```
Claude Desktop/Code ←→ STDIO ←→ Local MCP Server (Node.js)
```

**Characteristics**:
- Runs on local machine
- Uses standard input/output for JSON-RPC messages
- Requires absolute file paths in config
- **Critical**: Never write to stdout (corrupts JSON-RPC)

**Use Cases**: miyabi-tmux, miyabi-rules, miyabi-obsidian

---

#### **SSE/HTTP (Remote)**
```
Claude Desktop/Web ←→ HTTPS ←→ Remote MCP Server (AWS App Runner)
```

**Characteristics**:
- Hosted on internet (AWS, GCP, etc.)
- Uses Server-Sent Events (SSE) for streaming
- Requires authentication (Bearer Token, OAuth)
- Accessible from any MCP client

**Use Cases**: miyabi-society-aws

---

## 🚀 Setup Guide

### 1. Claude Desktop Configuration

**Config File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Complete Configuration

```json
{
  "mcpServers": {
    "miyabi-tmux": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js"
      ]
    },
    "miyabi-rules": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js"
      ],
      "env": {
        "MIYABI_RULES_API_URL": "https://miyabi-rules-api.example.com",
        "MIYABI_API_KEY": "your-api-key-here"
      }
    },
    "miyabi-obsidian": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-obsidian-server/dist/index.js"
      ]
    },
    "miyabi-society-aws": {
      "url": "https://peehmbqw9f.us-east-1.awsapprunner.com/mcp",
      "transport": {
        "type": "sse"
      },
      "headers": {
        "Authorization": "Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d"
      }
    }
  },
  "preferences": {
    "quickEntryShortcut": "off"
  }
}
```

#### Restart Claude Desktop

```bash
# Quit Claude Desktop
osascript -e 'tell application "Claude" to quit'

# Wait 2 seconds
sleep 2

# Restart
open -a Claude
```

---

### 2. Claude Code (CLI) Configuration

**Config File**: `.mcp.json` (project root)

#### Project-Specific Configuration

```json
{
  "mcpServers": {
    "miyabi-obsidian": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-obsidian-server/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

**Note**: Claude Code CLI only supports local STDIO servers in `.mcp.json`.

#### Restart Claude Code

```bash
# Exit current session
/quit

# Restart in project directory
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
claude

# Verify MCP servers loaded
# (Check for "miyabi-obsidian" in MCP server list)
```

---

### 3. Claude.ai Web (Custom Connectors)

#### Step 1: Navigate to Settings

1. Open [Claude.ai](https://claude.ai/)
2. Click profile icon → **Settings**
3. Select **Connectors** in sidebar

#### Step 2: Add Custom Connector

1. Scroll to bottom
2. Click **"Add custom connector"**
3. Enter server URL:
   ```
   https://peehmbqw9f.us-east-1.awsapprunner.com/mcp
   ```
4. Click **"Add"**

#### Step 3: Complete Authentication

1. Follow OAuth/Bearer Token prompts
2. Enter Bearer Token if required:
   ```
   c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
   ```
3. Grant permissions

#### Step 4: Configure Tool Permissions

1. Go back to **Connectors** settings
2. Click on **miyabi-society-aws**
3. Enable/disable specific tools
4. Set usage limits

#### ⚠️ Known Limitation

**egress proxy restriction**: Claude.ai Web may block `awsapprunner.com` domain.

**Workaround**: Use Claude Desktop instead (no restrictions).

---

## 🛠️ Available Tools

### miyabi-tmux (6 tools)

#### `tmux_list_sessions`
List all tmux sessions in Miyabi environment.

**Returns**: Session names, window counts, creation timestamps.

#### `tmux_list_panes`
List all panes across sessions.

**Parameters**:
- `session` (optional): Filter by session name

**Returns**: Pane IDs, commands, paths.

#### `tmux_send_message`
Send message to specific pane using CLAUDE.md P0.2 protocol.

**Parameters**:
- `pane_id` (required): Target pane ID (e.g., `%50`)
- `message` (required): Message content

**Protocol**: `tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter`

#### `tmux_join_commhub`
Join Miyabi CommHub session for multithread communication.

**Returns**: Success status, pane ID.

#### `tmux_get_commhub_status`
Get current CommHub status.

**Returns**: Active status, panes, message count, last sync time.

#### `tmux_broadcast`
Broadcast message to all Miyabi sessions.

**Parameters**:
- `message` (required): Broadcast content
- `from_source` (optional): Source identifier

**Returns**: Sent count, failed count.

---

### miyabi-rules (~3 tools)

Rule validation and governance system.

**Environment Variables**:
- `MIYABI_RULES_API_URL`: Rules API endpoint
- `MIYABI_API_KEY`: Authentication key

---

### miyabi-obsidian (9 tools)

#### `obsidian_list_documents`
List all documents in Obsidian vault.

**Parameters**:
- `category` (optional): Filter by category
- `tags` (optional): Filter by tags (all must match)
- `path` (optional): Filter by path prefix

**Returns**: Array of documents with metadata.

#### `obsidian_read_document`
Read document content with frontmatter.

**Parameters**:
- `path` (required): Relative path to document

**Returns**: Frontmatter, content, full path.

#### `obsidian_create_document`
Create new document with auto-generated frontmatter.

**Parameters**:
- `path` (required): Path for new document
- `content` (required): Markdown content
- `frontmatter` (optional): Custom frontmatter fields

**Auto-generated**:
- `title`, `created`, `updated`, `author`, `category`, `tags`, `status`

#### `obsidian_update_document`
Update existing document (content and/or frontmatter).

**Parameters**:
- `path` (required): Document path
- `content` (optional): New content
- `frontmatter` (optional): Frontmatter updates (merged)

**Auto-updated**: `updated` timestamp.

#### `obsidian_search`
Full-text search with regex support.

**Parameters**:
- `query` (required): Search query (regex)
- `case_sensitive` (optional): Case sensitivity (default: false)
- `category` (optional): Limit to category
- `tags` (optional): Limit to documents with tags

**Returns**: Matching documents with context (max 5 matches per document).

#### `obsidian_get_backlinks`
Find all documents linking to specific document.

**Parameters**:
- `path` (required): Document to find backlinks for

**Returns**: Documents with backlinks and context.

#### `obsidian_get_tags`
Get all unique tags in vault.

**Returns**: Sorted array of tags.

#### `obsidian_get_categories`
Get all unique categories in vault.

**Returns**: Sorted array of categories.

#### `obsidian_get_directory_tree`
Get vault directory structure.

**Parameters**:
- `base_path` (optional): Start from specific path

**Returns**: Tree structure with files and directories.

---

### miyabi-society-aws (7 tools)

Remote MCP server hosted on AWS App Runner.

**Endpoint**: `https://peehmbqw9f.us-east-1.awsapprunner.com/mcp`

**Authentication**: Bearer Token

#### `list_miyabi_agents`
List all Miyabi agents in the system.

**Returns**: Agent IDs, names, types, statuses.

#### `get_agent_details`
Get detailed information about specific agent.

**Parameters**:
- `agent_id` (required): Agent identifier

**Returns**: Full agent configuration, capabilities, status.

#### `list_tmux_sessions`
List tmux sessions (remote).

**Returns**: Session information from remote orchestration system.

#### `create_tmux_session`
Create new tmux session remotely.

**Parameters**:
- `session_name` (required): Name for new session
- `working_directory` (optional): Starting directory

**Returns**: Session ID, connection info.

#### `kill_tmux_session`
Terminate tmux session remotely.

**Parameters**:
- `session_id` (required): Session to terminate

**Returns**: Success status.

#### `generate_daily_report`
Generate comprehensive daily report.

**Returns**: Markdown report with:
- Tasks completed
- Agents active
- System metrics
- Recommendations

#### `get_system_status`
Get current system status.

**Returns**: Health metrics, resource usage, alerts.

---

## 📖 Usage Examples

### Example 1: List and Read Documents

**Scenario**: Find all planning documents and read GTM strategy.

```
User: "Show me all documents in the planning directory"

Claude uses: miyabi-obsidian/obsidian_list_documents
Parameters: { "path": "planning/" }

Returns: [
  {
    "path": "planning/2025-11-17-gtm-release-milestones.md",
    "title": "Miyabi - Go-to-Market Strategy",
    "category": "planning",
    "tags": ["gtm", "strategy", "roadmap"]
  },
  ...
]

User: "Read the GTM strategy document"

Claude uses: miyabi-obsidian/obsidian_read_document
Parameters: { "path": "planning/2025-11-17-gtm-release-milestones.md" }

Returns: Full document with frontmatter and content
```

---

### Example 2: Search and Create

**Scenario**: Search for "agent" references, then create summary document.

```
User: "Search for 'agent' in architecture documents and create a summary"

Step 1: Claude uses miyabi-obsidian/obsidian_search
Parameters: {
  "query": "agent",
  "category": "architecture"
}

Returns: List of documents with "agent" mentions

Step 2: Claude uses miyabi-obsidian/obsidian_create_document
Parameters: {
  "path": "reports/2025-11-19-agent-summary.md",
  "content": "# Agent Summary\n\n...",
  "frontmatter": {
    "title": "Agent References Summary",
    "category": "reports",
    "tags": ["agents", "summary"]
  }
}

Returns: Success, document created
```

---

### Example 3: Cross-Server Integration

**Scenario**: Generate daily report from AWS, save to Obsidian.

```
User: "Generate today's report and save it to Obsidian"

Step 1: Claude uses miyabi-society-aws/generate_daily_report
Returns: Markdown report content

Step 2: Claude uses miyabi-obsidian/obsidian_create_document
Parameters: {
  "path": "reports/2025-11-19-daily-report.md",
  "content": <report from step 1>,
  "frontmatter": {
    "title": "Daily Report - 2025-11-19",
    "category": "reports",
    "tags": ["daily", "automated"]
  }
}

Returns: Success, report saved to Obsidian vault
```

---

### Example 4: tmux Communication

**Scenario**: Send message to specific tmux pane.

```
User: "Send message to pane %50: 'Task completed'"

Claude uses: miyabi-tmux/tmux_send_message
Parameters: {
  "pane_id": "%50",
  "message": "Task completed"
}

Executes: tmux send-keys -t %50 "Task completed" && sleep 0.5 && tmux send-keys -t %50 Enter

Returns: Success status
```

---

## 🔧 Troubleshooting

### Issue 1: Server Not Loading

**Symptoms**: MCP server not appearing in Claude Desktop.

**Checks**:
1. Verify config file syntax (valid JSON)
2. Check file paths are absolute
3. Ensure Node.js binary is in PATH
4. Restart Claude Desktop

**Debug**:
```bash
# Test server manually
node /path/to/server/dist/index.js

# Check logs
~/Library/Logs/Claude/mcp-*.log
```

---

### Issue 2: Authentication Failure

**Symptoms**: "Unauthorized" or "403 Forbidden" errors.

**Checks**:
1. Verify Bearer Token is correct
2. Check token hasn't expired
3. Ensure Authorization header format:
   ```json
   "headers": {
     "Authorization": "Bearer <token>"
   }
   ```

**Solution**: Regenerate token if expired.

---

### Issue 3: Tool Not Working

**Symptoms**: Tool execution fails or returns errors.

**Checks**:
1. Verify required parameters provided
2. Check parameter types match schema
3. Ensure environment variables set (for miyabi-rules)
4. Test tool in isolation

**Debug**:
```bash
# Enable debug logging
export DEBUG=mcp:*

# Test specific tool
echo '{"tool":"tool_name","params":{...}}' | node server.js
```

---

### Issue 4: Remote Server Unreachable

**Symptoms**: "Connection refused" or timeout errors.

**Checks**:
1. Verify server URL is correct
2. Check server is running (AWS App Runner status)
3. Test endpoint with curl:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        https://peehmbqw9f.us-east-1.awsapprunner.com/mcp
   ```
4. Check firewall/network restrictions

**Known Issue**: Claude.ai Web may block certain domains (e.g., awsapprunner.com).

**Workaround**: Use Claude Desktop instead.

---

### Issue 5: Obsidian Vault Not Found

**Symptoms**: "File not found" or "ENOENT" errors.

**Checks**:
1. Verify vault path exists:
   ```bash
   ls -la /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/
   ```
2. Check file permissions (read/write access)
3. Ensure path is absolute (not relative)

**Solution**: Update VAULT_PATH in server configuration.

---

## 🔐 Security Best Practices

### 1. API Key Management

- **Never commit API keys to git**
- Store in environment variables or secure vaults
- Rotate keys regularly (every 90 days)
- Use different keys for dev/prod

### 2. Bearer Token Security

- Generate secure tokens (32+ bytes random)
- Use HTTPS only (never HTTP)
- Implement token expiration
- Monitor token usage

### 3. Tool Permissions

- Enable only necessary tools
- Review tool capabilities before enabling
- Use least-privilege principle
- Audit tool usage regularly

### 4. Network Security

- Use VPN for remote server access
- Implement rate limiting
- Enable CORS restrictions
- Monitor for suspicious activity

---

## 📊 Monitoring & Logs

### Claude Desktop Logs

**Location**: `~/Library/Logs/Claude/`

**Files**:
- `mcp-<server-name>.log` - Server-specific logs
- `main.log` - Claude Desktop main log

**Viewing**:
```bash
# Tail specific server log
tail -f ~/Library/Logs/Claude/mcp-miyabi-obsidian.log

# View all MCP logs
ls -l ~/Library/Logs/Claude/mcp-*.log
```

---

### Server Logs

**STDIO Servers**: Write to stderr or file (never stdout)

```typescript
// ✅ Correct
console.error('Server started');

// ❌ Incorrect (corrupts JSON-RPC)
console.log('Server started');
```

**Remote Servers**: Use CloudWatch or similar service.

---

### Metrics

Track these key metrics:
- Tool call latency (p50, p95, p99)
- Success/failure rates
- Authentication failures
- Network errors
- Resource usage (CPU, memory)

---

## 🔄 Maintenance

### Regular Tasks

**Weekly**:
- Review logs for errors
- Check tool usage patterns
- Verify all servers online

**Monthly**:
- Rotate API keys/tokens
- Update dependencies
- Review permissions
- Archive old logs

**Quarterly**:
- Security audit
- Performance review
- Capacity planning
- Documentation updates

---

## 📚 Related Documentation

### Internal
- [[miyabi-tmux-server-architecture|Miyabi tmux Server Architecture]]
- [[miyabi-obsidian-vault-structure|Obsidian Vault Structure]]
- [[miyabi-society-aws-deployment|AWS Society Server Deployment]]

### External
- [MCP Official Docs](https://modelcontextprotocol.io/)
- [Build MCP Server](https://modelcontextprotocol.io/docs/develop/build-server)
- [Connect Remote Servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)
- [Claude Desktop Config](https://support.anthropic.com/en/articles/11175166)

---

## 🎯 Quick Reference

### Config File Locations

| Environment | Config File |
|-------------|-------------|
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Claude Code** | `.mcp.json` (project root) |
| **Claude.ai Web** | Settings → Connectors (UI) |

### Server Endpoints

| Server | Endpoint |
|--------|----------|
| miyabi-tmux | Local STDIO |
| miyabi-rules | Local STDIO |
| miyabi-obsidian | Local STDIO |
| miyabi-society-aws | `https://peehmbqw9f.us-east-1.awsapprunner.com/mcp` |

### Bearer Token (miyabi-society-aws)

```
c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d
```

**Note**: Rotate regularly for security.

---

## ✅ Checklist: New Server Setup

- [ ] Implement server with MCP SDK
- [ ] Add tool definitions with schemas
- [ ] Test locally with stdio transport
- [ ] Add to Claude Desktop config
- [ ] Restart Claude Desktop
- [ ] Verify tools appear
- [ ] Test each tool individually
- [ ] Deploy to production (if remote)
- [ ] Configure authentication
- [ ] Set up monitoring/logs
- [ ] Document usage examples
- [ ] Update this guide

---

**Version**: 1.0.0
**Last Updated**: 2025-11-19
**Maintainer**: Miyabi Team
**Status**: Published

---

**🚀 Happy Integrating!**
