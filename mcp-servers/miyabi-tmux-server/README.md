# Miyabi tmux MCP Server

MCP Server for multithread communication aggregation across Miyabi tmux sessions.

## Overview

This MCP server provides tools to:
- List and monitor all tmux sessions in the Miyabi environment
- Send messages to specific panes using CLAUDE.md P0.2 protocol
- Join the CommHub session for centralized communication
- Broadcast messages to all Miyabi sessions
- Check CommHub synchronization status

## Installation

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server
npm install
npm run build
```

## Usage

### Add to Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-tmux": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-tmux-server/dist/index.js"
      ]
    }
  }
}
```

### Available Tools

#### 1. `tmux_list_sessions`

List all tmux sessions in the Miyabi environment.

**Example:**
```
Use tmux_list_sessions to get all active sessions
```

**Returns:**
```json
[
  {
    "name": "miyabi",
    "windows": 8,
    "created": "2025-11-15T08:58:04.000Z"
  },
  {
    "name": "miyabi-orchestra",
    "windows": 2,
    "created": "2025-11-16T14:28:56.000Z"
  }
]
```

#### 2. `tmux_list_panes`

List all panes across sessions. Optionally filter by session name.

**Parameters:**
- `session` (optional): Session name to filter

**Example:**
```
Use tmux_list_panes with session "miyabi-orchestra"
```

**Returns:**
```json
[
  {
    "sessionName": "miyabi-orchestra",
    "windowIndex": 1,
    "paneIndex": 1,
    "paneId": "%50",
    "command": "zsh",
    "path": "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
  }
]
```

#### 3. `tmux_send_message`

Send a message to a specific pane using CLAUDE.md P0.2 protocol.

**Parameters:**
- `pane_id`: Target pane ID (e.g., '%50')
- `message`: Message to send

**Example:**
```
Use tmux_send_message with pane_id "%50" and message "[MCP→CommHub] Test message from MCP client"
```

**Returns:**
```json
{
  "success": true,
  "pane_id": "%50",
  "message": "Message sent successfully"
}
```

#### 4. `tmux_join_commhub`

Join the Miyabi CommHub session for multithread communication aggregation.

**Example:**
```
Use tmux_join_commhub to connect to CommHub
```

**Returns:**
```json
{
  "success": true,
  "message": "Successfully joined CommHub",
  "paneId": "%50"
}
```

#### 5. `tmux_get_commhub_status`

Get current status of the CommHub.

**Example:**
```
Use tmux_get_commhub_status to check sync status
```

**Returns:**
```json
{
  "active": true,
  "panes": [...],
  "messageCount": 42,
  "lastSync": "2025-11-17T12:00:00.000Z"
}
```

#### 6. `tmux_broadcast`

Broadcast a message to all Miyabi tmux sessions.

**Parameters:**
- `message`: Message to broadcast
- `from_source` (optional): Source identifier (default: 'MCP')

**Example:**
```
Use tmux_broadcast with message "All agents: Switch to high priority mode" and from_source "Orchestrator"
```

**Returns:**
```json
{
  "success": true,
  "sent_count": 4,
  "failed_count": 0,
  "message": "Broadcast to 4 sessions (0 failed)"
}
```

## Architecture

### P0.2 Protocol Compliance

All message sending follows CLAUDE.md P0.2 strict syntax:

```bash
tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

This ensures:
- Message delivery is atomic
- No race conditions between message and Enter key
- Consistent behavior across all agents

### CommHub Integration

The server integrates with the `miyabi-orchestra:CommHub` window which has:
- **Pane 1 (%50)**: Message aggregator
- **Pane 2 (%52)**: Event log
- **Pane 3 (%51)**: Consistency monitor

### Multithread Safety

The server ensures thread-safe communication by:
1. Using strict tmux send-keys syntax with sleep
2. Serializing broadcasts to prevent message interleaving
3. Tracking message delivery status
4. Providing synchronization primitives via CommHub

## Development

```bash
# Watch mode for development
npm run dev

# Build
npm run build

# Start server
npm start
```

## License

Part of the Miyabi project. See main project LICENSE.
