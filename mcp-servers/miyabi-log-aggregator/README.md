# miyabi-log-aggregator

**Version**: 1.0.0
**Status**: ✅ Production Ready

Centralized log aggregation and search for Miyabi project via Model Context Protocol (MCP).

---

## 🎯 Purpose

Provides comprehensive log management across the entire Miyabi ecosystem:
- Aggregate logs from all sources
- Full-text search with filters
- Real-time log monitoring
- Level-based filtering (ERROR, WARN, INFO, DEBUG)

---

## 📦 Installation

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-log-aggregator
npm install
npm run build
```

---

## ⚙️ Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-log-aggregator": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-log-aggregator/dist/index.js"
      ],
      "env": {
        "MIYABI_LOG_DIR": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MIYABI_LOG_DIR` | Base directory for log search | `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private` |

---

## 📂 Log File Discovery

The server automatically discovers log files in:
- `**/logs/**/*.log`
- `**/*.log`
- `.ai/logs/**/*.log`
- `crates/**/logs/**/*.log`

---

## 🛠️ Available Tools

### 1. `log_list_sources`

List all discovered log files.

**Returns**:
```json
{
  "sources": [
    {
      "name": "miyabi-cli",
      "path": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/crates/miyabi-cli/miyabi.log",
      "size": 1024000
    },
    {
      "name": "agent-execution",
      "path": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.ai/logs/agent.log",
      "size": 512000
    }
  ]
}
```

**Example**:
```
Use log_list_sources to see all available logs
```

---

### 2. `log_search`

Search logs with optional filters.

**Parameters**:
- `query` (required): Search query (regex supported)
- `source` (optional): Filter by log source name
- `level` (optional): Filter by log level (ERROR, WARN, INFO, DEBUG)

**Returns**:
```json
{
  "entries": [
    {
      "source": "miyabi-cli",
      "level": "ERROR",
      "timestamp": "2025-11-19T10:00:00Z",
      "message": "Failed to connect to database",
      "line": 42
    }
  ]
}
```

**Examples**:
```
Use log_search with query "ERROR" to find all errors
Use log_search with query "database" and level "ERROR"
Use log_search with query ".*timeout.*" and source "miyabi-cli"
```

---

### 3. `log_recent`

Get recent log entries.

**Parameters**:
- `source` (optional): Filter by log source
- `level` (optional): Filter by log level
- `minutes` (optional): Time range in minutes (default: 60)
- `limit` (optional): Max number of entries (default: 100)

**Returns**:
```json
{
  "entries": [
    {
      "source": "agent-execution",
      "level": "INFO",
      "timestamp": "2025-11-19T10:05:00Z",
      "message": "Agent started successfully"
    }
  ]
}
```

**Examples**:
```
Use log_recent to get last 60 minutes of logs
Use log_recent with level "ERROR" and minutes 30
Use log_recent with source "miyabi-cli" and limit 50
```

---

### 4. `log_tail`

Tail a specific log file (like `tail -f`).

**Parameters**:
- `source` (required): Log source name
- `lines` (required): Number of lines to retrieve

**Returns**:
```json
{
  "lines": [
    "2025-11-19 10:00:00 [INFO] Starting miyabi-cli",
    "2025-11-19 10:00:01 [INFO] Loading configuration",
    "2025-11-19 10:00:02 [INFO] Ready"
  ]
}
```

**Examples**:
```
Use log_tail with source "miyabi-cli" and lines 100
Use log_tail with source "agent-execution" and lines 50
```

---

### 5. `log_filter_by_level`

Filter logs by severity level.

**Parameters**:
- `level` (required): Log level (ERROR, WARN, INFO, DEBUG)
- `source` (optional): Filter by log source
- `limit` (optional): Max number of entries (default: 100)

**Returns**:
```json
{
  "entries": [
    {
      "source": "miyabi-cli",
      "level": "ERROR",
      "timestamp": "2025-11-19T10:00:00Z",
      "message": "Connection timeout"
    }
  ]
}
```

**Examples**:
```
Use log_filter_by_level with level "ERROR"
Use log_filter_by_level with level "WARN" and source "agent-execution"
```

---

## ✅ Verification

### Test Manually

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-log-aggregator
MIYABI_LOG_DIR=/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private npm start
# Press Ctrl+C to exit
```

**Expected Output**:
```
Miyabi Log Aggregator MCP Server running on stdio
Log base directory: /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
```

### Test in Claude

```
Use log_list_sources to see all log files
Use log_search with query "ERROR" to find errors
```

---

## 🐛 Troubleshooting

### No Logs Found

**Check log directory**:
```bash
find /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private -name "*.log" | head -10
```

**Verify MIYABI_LOG_DIR**:
```bash
echo $MIYABI_LOG_DIR
```

### Search Returns Nothing

- Ensure log files contain text
- Try broader search query
- Check log file permissions

### Performance Issues

For large log files:
- Use `limit` parameter to reduce results
- Use `source` parameter to narrow search
- Use `level` parameter to filter by severity

---

## 📝 Log Format

The aggregator expects log lines in common formats:
- `[LEVEL] message`
- `YYYY-MM-DD HH:MM:SS [LEVEL] message`
- `timestamp [LEVEL] message`

**Example**:
```
2025-11-19 10:00:00 [ERROR] Database connection failed
[WARN] Retrying connection...
[INFO] Connection established
```

---

## 🔗 Related

- **Main Quickstart**: `../MIYABI_MCP_QUICKSTART.md`
- **Miyabi CLAUDE.md**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/CLAUDE.md`

---

**Project**: Miyabi
**Last Updated**: 2025-11-19
