# 🚀 Miyabi MCP Servers - Complete Quickstart Guide

**Last Updated**: 2025-11-19
**Version**: 2.0.0
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [MCP Configuration](#mcp-configuration)
4. [Available Servers](#available-servers)
5. [Troubleshooting](#troubleshooting)
6. [Next Steps](#next-steps)

---

## 🎯 Overview

Miyabi provides **10 specialized MCP servers** for comprehensive system integration:

| Server | Purpose | Status |
|--------|---------|--------|
| **miyabi-git-inspector** | Git repository monitoring | ✅ Ready |
| **miyabi-tmux-server** | tmux session communication | ✅ Ready |
| **miyabi-log-aggregator** | Log aggregation & search | ✅ Ready |
| **miyabi-file-access** | Secure file operations | ✅ Ready |
| **miyabi-obsidian-server** | Documentation knowledge system | ✅ Ready |
| **miyabi-resource-monitor** | System resource monitoring | ✅ Ready |
| **miyabi-codex** | AI code generation & analysis | ✅ Ready |
| **miyabi-rules-server** | Rule & policy management | ✅ Ready |
| **miyabi-sse-gateway** | SSE gateway for remote access | ✅ Ready |
| **miyabi-pixel-mcp** | Android Pixel integration | ✅ Ready |

---

## 📦 Installation

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Claude Desktop** or **Claude Code** installed

### Quick Install (All Servers)

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers

# Install all Miyabi MCP servers
for server in miyabi-*; do
  if [ -d "$server" ]; then
    echo "Installing $server..."
    cd "$server"
    npm install
    npm run build
    cd ..
  fi
done
```

### Individual Server Install

```bash
# Example: Install miyabi-git-inspector
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector
npm install
npm run build
```

---

## ⚙️ MCP Configuration

### Configuration File Location

**macOS**:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux**:
```
~/.config/Claude/claude_desktop_config.json
```

### Complete Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-git-inspector": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector/dist/index.js"
      ],
      "env": {
        "MIYABI_REPO_PATH": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
      }
    },
    "miyabi-tmux": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js"
      ]
    },
    "miyabi-log-aggregator": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-log-aggregator/dist/index.js"
      ],
      "env": {
        "MIYABI_LOG_DIR": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
      }
    },
    "miyabi-file-access": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-file-access/dist/index.js"
      ],
      "env": {
        "MIYABI_FILE_ACCESS_BASE_PATH": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private",
        "MIYABI_FILE_ACCESS_ALLOW_OUTSIDE": "false",
        "MIYABI_FILE_ACCESS_MAX_SIZE": "10485760"
      }
    },
    "miyabi-obsidian": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-obsidian-server/dist/index.js"
      ]
    },
    "miyabi-resource-monitor": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-resource-monitor/dist/index.js"
      ]
    },
    "miyabi-codex": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-codex/dist/index.js"
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
    }
  }
}
```

### 🔄 Apply Configuration

After editing the configuration:

1. **Claude Desktop**: Quit and restart the app
2. **Claude Code**: Reload the window or restart the session

---

## 🛠️ Available Servers

### 1. miyabi-git-inspector

**Purpose**: Real-time Git repository monitoring

**Tools**:
- `git_status` - Get repository status
- `git_branch_list` - List all branches
- `git_current_branch` - Get current branch
- `git_worktree_list` - List all worktrees
- `git_log` - View commit history
- `git_staged_files` - List staged files
- `git_unstaged_files` - List modified files
- `git_untracked_files` - List untracked files

**Example Usage**:
```
Use git_status to check repository status
```

**Environment Variables**:
- `MIYABI_REPO_PATH`: Repository path (default: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private`)

---

### 2. miyabi-tmux-server

**Purpose**: Multithread communication across tmux sessions

**Tools**:
- `tmux_list_sessions` - List all tmux sessions
- `tmux_list_panes` - List all panes
- `tmux_send_message` - Send message to specific pane
- `tmux_broadcast` - Broadcast to all panes
- `tmux_join_commhub` - Join CommHub session
- `tmux_commhub_status` - Check CommHub sync status

**Example Usage**:
```
Use tmux_list_sessions to see all active sessions
Use tmux_send_message to send "[From→To] Action: Details" to pane %8
```

**CLAUDE.md Protocol**: Uses P0.2 inter-agent communication protocol

---

### 3. miyabi-log-aggregator

**Purpose**: Centralized log aggregation and search

**Tools**:
- `log_list_sources` - List all log files
- `log_search` - Search logs by query
- `log_recent` - Get recent log entries
- `log_tail` - Tail specific log file
- `log_filter_by_level` - Filter by log level (ERROR, WARN, INFO, DEBUG)

**Example Usage**:
```
Use log_list_sources to see all available logs
Use log_search with query "ERROR" to find all errors
```

**Environment Variables**:
- `MIYABI_LOG_DIR`: Log base directory (default: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private`)

---

### 4. miyabi-file-access

**Purpose**: Secure local file system operations

**Tools**:
- `read_file` - Read file content
- `write_file` - Write file content
- `delete_file` - Delete file/directory
- `copy_file` - Copy file
- `move_file` - Move/rename file
- `list_directory` - List directory contents
- `search_files` - Search files by pattern
- `get_file_info` - Get file metadata

**Security Features**:
- Base path restriction
- File size limits
- Path sanitization

**Environment Variables**:
- `MIYABI_FILE_ACCESS_BASE_PATH`: Allowed directory
- `MIYABI_FILE_ACCESS_ALLOW_OUTSIDE`: Allow outside base path (default: `false`)
- `MIYABI_FILE_ACCESS_MAX_SIZE`: Max file size in bytes (default: `10485760` = 10MB)

---

### 5. miyabi-obsidian-server

**Purpose**: Access Miyabi Obsidian documentation vault

**Vault Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault/`

**Tools**:
- `obsidian_list_documents` - List all documents
- `obsidian_read_document` - Read document
- `obsidian_create_document` - Create new document
- `obsidian_update_document` - Update document
- `obsidian_search` - Full-text search
- `obsidian_get_backlinks` - Find backlinks
- `obsidian_get_tags` - Get all tags
- `obsidian_get_categories` - Get all categories
- `obsidian_get_directory_tree` - Get vault structure

**Example Usage**:
```
Use obsidian_list_documents with path "agents/" to list all agent docs
Use obsidian_search with query "worktree" to find related docs
```

---

### 6. miyabi-resource-monitor

**Purpose**: Real-time system resource monitoring

**Tools**:
- `resource_cpu` - Get CPU usage (overall and per-core)
- `resource_memory` - Get memory usage (RAM and swap)
- `resource_disk` - Get disk usage for all filesystems
- `resource_load` - Get system load average and OS info
- `resource_overview` - Comprehensive resource snapshot
- `resource_processes` - Top processes by CPU usage
- `resource_uptime` - System uptime and boot time
- `resource_network_stats` - Network interface statistics

**Example Usage**:
```
Use resource_overview for a quick system snapshot
Use resource_processes with limit 20 to see top 20 processes
Use resource_memory to check if memory is running low
```

**Use Cases**:
- **MUGEN/MAJIN Monitoring**: Track remote server resources during parallel Agent execution
- **Development Monitoring**: Monitor local resource consumption
- **Agent Coordination**: Resource-aware task scheduling
- **Performance Debugging**: Identify resource bottlenecks

**Environment Variables**: None required

---

### 7. miyabi-codex

**Purpose**: MCP wrapper for Claude Code CLI (`codex` command)

**Prerequisites**:
- Install Claude Code CLI: `npm install -g codex-cli`
- Verify: `codex --version` (should show v0.58.0 or higher)

**Tools**:
- `codex_exec` - Execute codex task with options
- `codex_exec_yolo` - 🚨 DANGEROUS: Execute without approvals or sandboxing
- `codex_resume` - Resume previous codex session
- `codex_version` - Get codex CLI version
- `codex_login` - Login to codex

**Example Usage**:
```
Use codex_exec with prompt "Fix all TypeScript errors in src/"
Use codex_exec with prompt "Refactor this function" and model "opus"
Use codex_resume to continue previous work
```

**codex_exec Options**:
- `prompt` (required): Task description
- `model` (optional): `sonnet`, `opus`, or `haiku`
- `cd` (optional): Working directory
- `search` (optional): Enable web search
- `full_auto` (optional): Run without approvals (limited sandboxing)

**⚠️ YOLO Mode Warning** (`codex_exec_yolo`):
- Runs ALL commands without approval
- NO sandboxing protection
- Can cause irreversible damage
- Requires `confirm_danger: true` parameter
- **ONLY use in isolated, hardened environments**

**Use Cases**:
- **Automated Code Fixes**: Fix linting/build errors in full_auto mode
- **Batch Refactoring**: Refactor multiple files systematically
- **Documentation**: Auto-generate JSDoc/comments
- **Test Generation**: Create unit test suites
- **CI/CD Integration**: YOLO mode in Docker containers only

**Environment Variables**: None required (wraps existing `codex` CLI)

**Safety Comparison**:
- `codex_exec`: ✅ User approval, ✅ Sandboxed, Safe for production
- `codex_exec` + `full_auto`: ⚠️ No approval, ⚠️ Limited sandbox, Use with caution
- `codex_exec_yolo`: 🚨 No approval, 🚨 No sandbox, Extremely dangerous

**Note**: See `mcp-servers/miyabi-codex/README.md` for detailed safety guidelines

---

### 8. miyabi-rules-server

**Purpose**: Rule and policy management

**Tools**: See individual README for details

---

### 9. miyabi-sse-gateway

**Purpose**: SSE gateway for remote MCP access

**Tools**: See individual README for details

---

### 10. miyabi-pixel-mcp

**Purpose**: Android Pixel device integration

**Tools**: See individual README for details

---

## 🔍 Troubleshooting

### Server Won't Start

**Check Node.js version**:
```bash
node --version  # Should be v20.x or higher
```

**Rebuild the server**:
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/<server-name>
rm -rf node_modules dist
npm install
npm run build
```

### Claude Doesn't Recognize Tools

1. **Check JSON syntax** in `claude_desktop_config.json`
2. **Restart Claude** completely
3. **Test server manually**:
   ```bash
   cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/<server-name>
   npm start
   # Press Ctrl+C to exit
   ```

### Path Issues

**Verify paths exist**:
```bash
ls -la /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-git-inspector/dist/index.js
```

### Permission Denied

```bash
chmod +x /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/*/dist/index.js
```

---

## ✅ Verification

### Test All Servers

```bash
# Quick test script
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers

for server in miyabi-*/dist/index.js; do
  echo "Testing $server..."
  timeout 2 node "$server" 2>&1 | head -3
  echo "---"
done
```

### Expected Output

Each server should output:
```
<Server Name> MCP Server running on stdio
```

---

## 🎯 Next Steps

### For Development

1. **Explore Tools**: Try each tool in Claude Chat
2. **Read Individual READMEs**: Check server-specific documentation
3. **Integrate Workflows**: Combine tools for powerful workflows

### Example Workflow

```
1. Use git_status to check repository state
2. Use log_search to find recent errors
3. Use tmux_list_panes to see active agents
4. Use obsidian_search to find relevant documentation
```

### Advanced Usage

- **Agent Communication**: Use `tmux_send_message` for agent coordination
- **Documentation**: Use `obsidian_create_document` for reports
- **Monitoring**: Use `log_tail` for real-time log monitoring
- **File Operations**: Use `file_access` tools for automated file management

---

## 📚 Documentation

### Server-Specific Docs

- **miyabi-git-inspector**: `mcp-servers/miyabi-git-inspector/README.md`
- **miyabi-tmux-server**: `mcp-servers/miyabi-tmux-server/README.md`
- **miyabi-log-aggregator**: `mcp-servers/miyabi-log-aggregator/README.md`
- **miyabi-file-access**: `mcp-servers/miyabi-file-access/README.md`
- **miyabi-obsidian-server**: `mcp-servers/miyabi-obsidian-server/README.md`
- **miyabi-resource-monitor**: `mcp-servers/miyabi-resource-monitor/README.md`
- **miyabi-codex**: `mcp-servers/miyabi-codex/README.md`
- **miyabi-rules-server**: `mcp-servers/miyabi-rules-server/README.md`
- **miyabi-sse-gateway**: `mcp-servers/miyabi-sse-gateway/README.md`
- **miyabi-pixel-mcp**: `mcp-servers/miyabi-pixel-mcp/README.md`

### Miyabi Core Docs

- **CLAUDE.md**: Main agent operating manual
- **MCP_INTEGRATION_PROTOCOL.md**: MCP integration guidelines
- **TMUX_OPERATIONS.md**: tmux orchestration guide

---

## 🤝 Contributing

Found a bug or want to add a feature? Check the individual server directories for contribution guidelines.

---

**Project**: Miyabi
**Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/`
**Maintainer**: Miyabi Team
