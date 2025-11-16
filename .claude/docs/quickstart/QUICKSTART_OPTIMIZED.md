# Miyabi Optimized Configuration - Quick Start Guide

**Version**: 2.0 | **Updated**: 2025-11-11

---

## 🚀 What's New in v2.0

✅ **Consolidated Configuration**: All settings in one place
✅ **Performance Optimized**: Faster response times
✅ **Enhanced Security**: Better protection mechanisms
✅ **tmux Excellence**: High-quality session management
✅ **Comprehensive Documentation**: Inline comments everywhere

---

## ⚡ 5-Minute Setup

### Step 1: Verify Configuration

```bash
# Check settings.json
jq . .claude/settings.json

# Check mcp.json
jq . .claude/mcp.json
```

### Step 2: Test Core Features

```bash
# Start Claude Code (will trigger SessionStart hook)
claude

# You should see:
# 🚀 Miyabi Session Started
# 📍 /Users/shunsuke/Dev/miyabi-private
# [git status output]
```

### Step 3: Test MCP Servers

```bash
# List connected MCP servers
claude mcp list

# Expected output:
# P0 Servers: ✅ filesystem, ✅ project-context
# P1 Servers: ✅ miyabi, ✅ github-enhanced
# P2 Servers: ✅ ide-integration, ✅ lark-integration
```

### Step 4: Test tmux Integration

```bash
# Test tmux control
/tmux-control session=test mode=status

# Create a new session
.miyabi/scripts/tmux-session-manager.sh claude-code testing
```

---

## 📋 Essential Commands

### Configuration Management

```bash
# Backup current config
cp .claude/settings.json ~/backups/settings.$(date +%Y%m%d).json

# Validate JSON syntax
jq . .claude/settings.json > /dev/null && echo "✅ Valid JSON"

# Edit config
code .claude/settings.json
```

### MCP Server Management

```bash
# List all servers
claude mcp list

# Enable/disable server
# Edit mcp.json -> "disabled": true/false
```

### tmux Session Management

```bash
# Create session
.miyabi/scripts/tmux-session-manager.sh <type> [suffix]

# List sessions
.miyabi/scripts/tmux-session-list.sh

# Cleanup old sessions
.miyabi/scripts/tmux-session-cleanup.sh old

# Open in Terminal.app
.miyabi/scripts/tmux-open-terminal.sh <session-name>
```

---

## 🎯 Key Features

### 1. Smart Timeout Management

```json
// settings.json
{
  "timeout": {
    "default": 300000,          // 5 minutes (was 30 minutes)
    "mcp.connectionTimeout": 180000,  // 3 minutes
    "mcp.requestTimeout": 600000      // 10 minutes
  }
}
```

### 2. Priority-Based MCP Servers

```
P0 (Critical):  Always enabled, essential functionality
P1 (High):      Core development tools
P2 (Medium):    Development helpers
P3 (Low):       Optional services
P4 (Archived):  Deprecated, disabled by default
```

### 3. Enhanced tmux Safety

```bash
# Safe command injection
tmux send-keys -t %2 "command" && sleep 0.1 && tmux send-keys -t %2 Enter

# Automatic recovery on failure
# Retry up to 3 times with escalation
```

### 4. Feature Flags

```json
{
  "features": {
    "enableWorktreeIsolation": true,     // Use git worktrees
    "enableAutoFormat": false,           // Auto-format code
    "enableSessionKeepAlive": false,     // Keep sessions alive
    "enableVoiceNotifications": true     // VOICEVOX notifications
  }
}
```

---

## 🔧 Customization Examples

### Adjust Timeouts for Your Workflow

```json
// For longer-running tasks
{
  "timeout": {
    "default": 600000,  // 10 minutes instead of 5
    "perCommand": {
      ".claude/hooks/long-running-task.sh": 1800000  // 30 minutes
    }
  }
}
```

### Add Custom Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "command": ".claude/hooks/validate-write.sh",
        "description": "Validate before writing files",
        "timeout": 5000
      }
    ]
  }
}
```

### Add Custom MCP Server

```json
{
  "mcpServers": {
    "my-service": {
      "command": "node",
      "args": [".claude/mcp-servers/my-service.js"],
      "disabled": false,
      "priority": "P2",
      "description": "My custom MCP server"
    }
  }
}
```

---

## 🛡️ Security Best Practices

### 1. Review Blocked Paths

```json
// settings.json -> security.blockedPaths
[
  ".env", ".env.*",
  "**/*.key", "**/*.pem",
  "**/secrets/**"
]
```

### 2. Limit Allowed Commands

```json
// settings.json -> security.allowedCommands
[
  "git", "cargo", "rustc", "npm", "gh",
  ".claude/hooks/*.sh"
]
```

### 3. Use Feature Flags Carefully

```json
// Disable risky features in production
{
  "features": {
    "enableAutoFormat": false,  // Manual review preferred
    "enableSessionKeepAlive": false  // Explicit control
  }
}
```

---

## 📊 Monitoring & Debugging

### Check Logs

```bash
# View session logs
tail -f .ai/logs/user-prompts.log

# View MCP logs
tail -f .ai/logs/mcp-*.log

# View hook execution logs
tail -f .ai/logs/hooks.log
```

### Performance Metrics

```bash
# Check session duration
# View .ai/logs/ for timestamps

# Monitor MCP connection health
claude mcp list | grep "✅\|❌"
```

### Debug Mode

```bash
# Start Claude Code with debug logging
claude --debug
```

---

## 🚨 Troubleshooting

### Common Issues

#### Issue: SessionStart hook not running

**Solution**:
```bash
# Check hook file permissions
chmod +x .claude/hooks/*.sh

# Verify hook configuration
jq '.hooks.SessionStart' .claude/settings.json
```

#### Issue: MCP server connection failed

**Solution**:
```bash
# Check environment variables
env | grep -E "GITHUB_TOKEN|REPOSITORY|GOOGLE_API_KEY"

# Restart Claude Code session
/clear
# Exit and restart
```

#### Issue: tmux command timeout

**Solution**:
```bash
# Increase timeout
jq '.timeout.perCommand[".claude/hooks/agent-worktree-pre.sh"] = 120000' \
  .claude/settings.json > /tmp/settings.json && \
  mv /tmp/settings.json .claude/settings.json
```

---

## 📚 Further Reading

### Essential Documentation

- **`OPTIMIZATION_SUMMARY.md`** - Comprehensive optimization guide
- **`settings.json`** - Main configuration (with inline comments)
- **`mcp.json`** - MCP server configuration

### tmux Documentation

- **`commands/tmux-control.md`** - tmux control command v2.0
- **`Skills/tmux-session-bundle/SKILL.md`** - Session management v2.0
- **`TMUX_OPERATIONS.md`** - Operations guide

### Other Resources

- **`CLAUDE.md`** - Agent operating manual
- **`context/INDEX.md`** - Context module index
- **`commands/INDEX.md`** - Command reference

---

## 🎯 Next Steps

1. ✅ **Read this guide** (you're here!)
2. ⚡ **Test core features** (Step 2 above)
3. 🔧 **Customize for your workflow** (see examples)
4. 📊 **Monitor performance** (check logs)
5. 📖 **Read detailed docs** (OPTIMIZATION_SUMMARY.md)

---

## 🔗 Quick Links

```bash
# Configuration files
.claude/settings.json           # Main config
.claude/mcp.json               # MCP servers

# Documentation
.claude/OPTIMIZATION_SUMMARY.md # Optimization guide
.claude/QUICKSTART_OPTIMIZED.md # This file

# Scripts
.miyabi/scripts/tmux-*          # tmux utilities
.claude/hooks/*.sh              # Hook scripts

# Logs
.ai/logs/                       # All logs
```

---

## 🎉 You're Ready!

Your Miyabi configuration is now optimized for:
- ⚡ **Performance**: Fast response times
- 🔐 **Security**: Enhanced protection
- 🛠️ **Maintainability**: Easy to customize
- 📖 **Documentation**: Clear and comprehensive

**Enjoy your optimized development environment!**

---

**Questions?** Check `OPTIMIZATION_SUMMARY.md` or open an issue.

**Version**: 2.0.0 | **Status**: Production Ready | **Updated**: 2025-11-11
