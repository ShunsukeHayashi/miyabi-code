# Discord MCP Integration Guide

**Version**: 1.0.0
**Created**: 2025-12-24
**Status**: Complete

This document describes the integration of the Discord MCP server into the Miyabi ecosystem.

## Overview

The Discord MCP server (`miyabi-discord`) provides comprehensive Discord integration for the Miyabi Multi-Agent System, enabling:

- **Bot Operations**: Send, edit, delete messages; manage reactions
- **Webhook Integration**: Send notifications via Discord webhooks
- **Server Management**: Channel and guild information retrieval
- **Miyabi Notifications**: Formatted system notifications with agent context

## Features Implemented

### ✅ Core Discord Operations
- `discord_send_message` - Send messages to channels with rich embed support
- `discord_edit_message` - Edit existing messages
- `discord_delete_message` - Delete messages
- `discord_add_reaction` - Add emoji reactions to messages

### ✅ Information Retrieval
- `discord_get_channel_info` - Get detailed channel information
- `discord_get_guild_info` - Get server (guild) information
- `discord_list_channels` - List all channels in a server

### ✅ Webhook Integration
- `discord_webhook_send` - Send messages via Discord webhooks
- Custom username and avatar support
- Rich embed support

### ✅ Miyabi System Integration
- `discord_miyabi_notification` - Specialized Miyabi system notifications
- Four notification types: info, success, warning, error
- Agent and task context support
- Automatic timestamp and branding

## Installation and Setup

### 1. Navigate to the Discord MCP Server
```bash
cd mcp-servers/miyabi-discord
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Server
```bash
npm run build
```

### 4. Configuration

Create a `.env` file based on `.env.example`:

```bash
# Required for bot operations
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Optional defaults
DISCORD_DEFAULT_GUILD_ID=your_default_server_id
DISCORD_DEFAULT_CHANNEL_ID=your_default_channel_id
```

### 5. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token and set it as `DISCORD_BOT_TOKEN`
5. Enable the following bot permissions:
   - Send Messages
   - Manage Messages
   - Read Message History
   - Add Reactions
   - Use Slash Commands
   - Manage Webhooks

6. Invite the bot to your server with the required permissions

## Usage Examples

### Basic Message Sending

```json
{
  "tool": "discord_send_message",
  "arguments": {
    "channel_id": "123456789012345678",
    "content": "Hello from Miyabi!"
  }
}
```

### Rich Embed Notification

```json
{
  "tool": "discord_send_message",
  "arguments": {
    "channel_id": "123456789012345678",
    "embeds": [
      {
        "title": "System Status Update",
        "description": "All 21 agents are operational",
        "color": 2,
        "fields": [
          {
            "name": "Active Agents",
            "value": "21/21",
            "inline": true
          },
          {
            "name": "Status",
            "value": "All Systems Green",
            "inline": true
          }
        ],
        "footer": {
          "text": "Miyabi Multi-Agent System"
        },
        "timestamp": "2025-12-24T10:30:00.000Z"
      }
    ]
  }
}
```

### Miyabi System Notification

```json
{
  "tool": "discord_miyabi_notification",
  "arguments": {
    "type": "success",
    "title": "Task Completed",
    "message": "Agent CodeGen has successfully completed the implementation",
    "agent": "CodeGen",
    "task": "implement-discord-mcp",
    "details": "All 9 tools implemented with full functionality",
    "channel_id": "123456789012345678"
  }
}
```

### Webhook Notification

```json
{
  "tool": "discord_webhook_send",
  "arguments": {
    "webhook_url": "https://discord.com/api/webhooks/...",
    "content": "Automated deployment completed!",
    "username": "Miyabi Deploy Bot",
    "avatar_url": "https://example.com/deploy-bot-avatar.png"
  }
}
```

## Integration with Miyabi Agents

### Agent Status Updates

```typescript
// When an agent starts a task
await discord_miyabi_notification({
  type: "info",
  title: "Agent Started",
  message: "CodeGen agent is processing new task",
  agent: "CodeGen",
  task: "feature-implementation-#456"
});

// When an agent completes a task
await discord_miyabi_notification({
  type: "success",
  title: "Task Completed",
  message: "Feature implementation completed successfully",
  agent: "CodeGen",
  task: "feature-implementation-#456",
  details: "PR #789 created and ready for review"
});

// When an agent encounters an error
await discord_miyabi_notification({
  type: "error",
  title: "Agent Error",
  message: "CodeGen agent encountered an unexpected error",
  agent: "CodeGen",
  task: "feature-implementation-#456",
  details: "TypeError: Cannot read property 'length' of undefined"
});
```

### Deployment Notifications

```typescript
// Deployment start
await discord_miyabi_notification({
  type: "warning",
  title: "Deployment Started",
  message: "Starting deployment to production environment",
  agent: "Deployment",
  task: "deploy-v1.2.0"
});

// Deployment success
await discord_miyabi_notification({
  type: "success",
  title: "Deployment Complete",
  message: "Successfully deployed v1.2.0 to production",
  agent: "Deployment",
  task: "deploy-v1.2.0",
  details: "All health checks passed, monitoring active"
});
```

### Issue and PR Notifications

```typescript
// New issue created
await discord_miyabi_notification({
  type: "info",
  title: "New Issue Created",
  message: "Critical bug reported in authentication system",
  agent: "Issue",
  task: "issue-#123",
  details: "Priority: P0-Critical, Assigned: @developer"
});

// PR ready for review
await discord_miyabi_notification({
  type: "info",
  title: "PR Ready for Review",
  message: "Fix authentication bug - ready for review",
  agent: "PR",
  task: "pr-#456",
  details: "All tests passing, 3 files changed"
});
```

## Integration with MCP Configuration

Add to your Claude Code MCP configuration:

```json
{
  "servers": {
    "miyabi-discord": {
      "command": "node",
      "args": ["./mcp-servers/miyabi-discord/dist/index.js"],
      "env": {
        "DISCORD_BOT_TOKEN": "your_token_here",
        "DISCORD_DEFAULT_GUILD_ID": "your_guild_id",
        "DISCORD_DEFAULT_CHANNEL_ID": "your_channel_id"
      }
    }
  }
}
```

## Error Handling and Troubleshooting

### Common Issues

1. **Bot not responding**
   - Verify `DISCORD_BOT_TOKEN` is correct
   - Check bot permissions in Discord server
   - Ensure bot is online in Discord

2. **Permission errors**
   - Bot needs "Send Messages" permission in target channel
   - Check if channel/server is accessible to the bot
   - Verify bot role has required permissions

3. **Webhook errors**
   - Verify webhook URL is active and correct
   - Check if webhook has been deleted or regenerated
   - Ensure webhook has permission to post in the channel

### Debug Mode

Enable debug logging:
```bash
DEBUG=discord* npm start
```

## Security Considerations

1. **Token Security**: Never commit Discord bot tokens to version control
2. **Webhook Security**: Keep webhook URLs secure and regenerate if compromised
3. **Permissions**: Use minimal required permissions for the bot
4. **Rate Limiting**: Be aware of Discord's rate limits when sending messages

## Available Tools Summary

| Tool | Description | Required Parameters |
|------|-------------|-------------------|
| `discord_send_message` | Send message to channel | `content` or `embeds` |
| `discord_edit_message` | Edit existing message | `message_id` |
| `discord_delete_message` | Delete message | `message_id` |
| `discord_add_reaction` | Add reaction to message | `message_id`, `emoji` |
| `discord_get_channel_info` | Get channel information | `channel_id` |
| `discord_get_guild_info` | Get server information | `guild_id` |
| `discord_list_channels` | List server channels | `guild_id` |
| `discord_webhook_send` | Send via webhook | `webhook_url` |
| `discord_miyabi_notification` | Send Miyabi notification | `title`, `message` |

## Future Enhancements

### Planned Features (P2)
- Role management operations
- Member management
- Slash command support
- Message threading support
- Voice channel integration

### Integration Opportunities
- GitHub workflow notifications
- CI/CD pipeline alerts
- Monitoring system alerts
- Agent performance metrics
- Task queue status updates

## Development

### Project Structure
```
miyabi-discord/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Built JavaScript files
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
├── .gitignore           # Git ignore rules
└── README.md            # Detailed documentation
```

### Building and Testing
```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Production start
npm start
```

---

**Status**: ✅ Complete and Ready for Production
**Maintainer**: Miyabi Development Team
**Last Updated**: 2025-12-24