# Miyabi MCP - All-in-One Monitoring and Control Server

Complete monitoring and control toolkit for Miyabi development environment.

## 📦 What's Included

**75 Tools across 9 Categories**

### 1. Git Inspector (10 tools)
- `git_status` - Get current git status
- `git_branch_list` - List all branches
- `git_current_branch` - Get current branch
- `git_log` - Get commit history
- `git_worktree_list` - List git worktrees
- `git_diff` - Get unstaged changes
- `git_staged_diff` - Get staged changes
- `git_remote_list` - List remotes
- `git_branch_ahead_behind` - Check branch sync status
- `git_file_history` - Get file commit history

### 2. Tmux Monitor (9 tools)
- `tmux_list_sessions` - List tmux sessions
- `tmux_list_windows` - List windows in session
- `tmux_list_panes` - List panes in window
- `tmux_send_keys` - Send commands to pane
- `tmux_pane_capture` - Capture pane content
- `tmux_pane_search` - Search pane content
- `tmux_pane_tail` - Get last N lines from pane
- `tmux_pane_is_busy` - Check if pane is busy
- `tmux_pane_current_command` - Get current command

### 3. Log Aggregator (6 tools)
- `log_sources` - List all log files
- `log_get_recent` - Get recent log entries
- `log_search` - Search logs
- `log_get_errors` - Get error-level logs
- `log_get_warnings` - Get warning-level logs
- `log_tail` - Tail specific log file

### 4. Resource Monitor (8 tools)
- `resource_cpu` - Get CPU usage
- `resource_memory` - Get memory usage
- `resource_disk` - Get disk usage
- `resource_load` - Get system load
- `resource_overview` - Get resource overview
- `resource_processes` - Get process list
- `resource_uptime` - Get system uptime
- `resource_network_stats` - Get network statistics

### 5. Network Inspector (8 tools)
- `network_interfaces` - List network interfaces
- `network_connections` - List active connections
- `network_listening_ports` - List listening ports
- `network_stats` - Get network statistics
- `network_gateway` - Get default gateway
- `network_ping` - Ping a host
- `network_bandwidth` - Get bandwidth usage
- `network_overview` - Get network overview

### 6. Process Inspector (8 tools)
- `process_info` - Get process details
- `process_list` - List all processes
- `process_search` - Search processes
- `process_tree` - Get process tree
- `process_file_descriptors` - Get file descriptors
- `process_environment` - Get environment variables
- `process_children` - Get child processes
- `process_top` - Get top processes

### 7. File Watcher (6 tools)
- `file_stats` - Get file/directory stats
- `file_recent_changes` - Get recently changed files
- `file_search` - Search files by pattern
- `file_tree` - Get directory tree
- `file_compare` - Compare two files
- `file_changes_since` - Get files changed since timestamp

### 8. Claude Code Monitor (8 tools)
- `claude_config` - Get Claude Desktop config
- `claude_mcp_status` - Get MCP server status
- `claude_session_info` - Get Claude Code session info
- `claude_logs` - Get Claude Code logs
- `claude_log_search` - Search Claude Code logs
- `claude_log_files` - List log files
- `claude_background_shells` - Get background shells
- `claude_status` - Get comprehensive status

### 9. GitHub Integration (12 tools)
- `github_list_issues` - List issues
- `github_get_issue` - Get issue details
- `github_create_issue` - Create new issue
- `github_update_issue` - Update issue
- `github_add_comment` - Add comment
- `github_list_prs` - List pull requests
- `github_get_pr` - Get PR details
- `github_create_pr` - Create pull request
- `github_merge_pr` - Merge pull request
- `github_list_labels` - List labels
- `github_add_labels` - Add labels
- `github_list_milestones` - List milestones

## 🚀 Installation

### 1. Install Dependencies

```bash
cd miyabi-mcp
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Configure Environment Variables

Required environment variables:
- `GITHUB_TOKEN` - GitHub Personal Access Token (for GitHub tools)
- `GITHUB_DEFAULT_OWNER` - Default GitHub owner/org (optional)
- `GITHUB_DEFAULT_REPO` - Default repository name (optional)

Optional environment variables:
- `MIYABI_REPO_PATH` - Path to Miyabi repository (default: current directory)
- `MIYABI_LOG_DIR` - Path to logs directory (default: MIYABI_REPO_PATH)
- `MIYABI_WATCH_DIR` - Path to watch directory (default: MIYABI_REPO_PATH)

### 4. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi": {
      "command": "node",
      "args": ["/path/to/miyabi-mcp/dist/index.js"],
      "env": {
        "MIYABI_REPO_PATH": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private",
        "MIYABI_LOG_DIR": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private",
        "MIYABI_WATCH_DIR": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private",
        "GITHUB_TOKEN": "ghp_your_token_here",
        "GITHUB_DEFAULT_OWNER": "customer-cloud",
        "GITHUB_DEFAULT_REPO": "miyabi-private"
      }
    }
  }
}
```

### 5. Restart Claude Desktop

## 📊 Usage Examples

### Git Operations
```typescript
// Check git status
git_status()

// Get recent commits
git_log({ limit: 10 })

// Check branch status
git_branch_ahead_behind({ branch: "main" })
```

### System Monitoring
```typescript
// Get system overview
resource_overview()

// Check network connections
network_connections()

// Monitor processes
process_top({ limit: 10 })
```

### File Monitoring
```typescript
// Get recent file changes
file_recent_changes({ minutes: 60, limit: 20 })

// Search for files
file_search({ pattern: "**/*.ts" })
```

### GitHub Integration
```typescript
// List open issues
github_list_issues({ state: "open" })

// Create new issue
github_create_issue({
  title: "Bug fix needed",
  body: "Description...",
  labels: ["bug"]
})
```

## 🔧 Development

### Watch Mode
```bash
npm run dev
```

### Rebuild
```bash
npm run build
```

## 📝 Environment Setup

### Getting GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full access)
4. Generate and copy token
5. Add to Claude Desktop config

## 🛡️ Security

- Never commit tokens or sensitive data
- Use environment variables for all secrets
- Rotate tokens regularly
- Follow least privilege principle

## 📄 License

MIT

## 👥 Author

Miyabi Team
