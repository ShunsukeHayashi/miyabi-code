# Miyabi Discord MCP Server

A comprehensive Discord API MCP server for the Miyabi Multi-Agent System. Provides bot operations, webhook messaging, server management, and specialized Miyabi notifications.

## Features

### Bot Operations
- Send, edit, and delete messages
- Add reactions to messages
- Channel and guild information retrieval
- Channel listing

### Webhook Integration
- Send messages via webhooks
- Custom username and avatar support
- Rich embed support

### Miyabi Integration
- Specialized Miyabi system notifications
- Formatted agent status reports
- Task completion notifications
- Error and warning alerts

## Installation

1. Navigate to the server directory:
```bash
cd mcp-servers/miyabi-discord
```

2. Install dependencies:
```bash
npm install
```

3. Build the server:
```bash
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Required for bot operations
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# Optional - Default server and channel
DISCORD_DEFAULT_GUILD_ID=your_default_server_id
DISCORD_DEFAULT_CHANNEL_ID=your_default_channel_id
```

### Setting up Discord Bot

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

### Setting up Webhooks (Optional)

1. In Discord, go to Server Settings → Integrations → Webhooks
2. Create a new webhook
3. Copy the webhook URL for use in webhook operations

## Usage

### Starting the Server

```bash
# Production
npm start

# Development
npm run dev
```

## Available Tools

### Bot Operations

#### `discord_send_message`
Send a message to a Discord channel.

```json
{
  "channel_id": "123456789012345678",
  "content": "Hello from Miyabi!",
  "embeds": [
    {
      "title": "System Status",
      "description": "All agents operational",
      "color": 2,
      "fields": [
        {
          "name": "Active Agents",
          "value": "21",
          "inline": true
        }
      ]
    }
  ]
}
```

#### `discord_edit_message`
Edit an existing message.

```json
{
  "channel_id": "123456789012345678",
  "message_id": "987654321098765432",
  "content": "Updated message content"
}
```

#### `discord_delete_message`
Delete a message.

```json
{
  "channel_id": "123456789012345678",
  "message_id": "987654321098765432"
}
```

#### `discord_add_reaction`
Add a reaction to a message.

```json
{
  "channel_id": "123456789012345678",
  "message_id": "987654321098765432",
  "emoji": "✅"
}
```

### Information Retrieval

#### `discord_get_channel_info`
Get detailed information about a channel.

```json
{
  "channel_id": "123456789012345678"
}
```

#### `discord_get_guild_info`
Get detailed information about a guild (server).

```json
{
  "guild_id": "123456789012345678"
}
```

#### `discord_list_channels`
List all channels in a guild.

```json
{
  "guild_id": "123456789012345678"
}
```

### Webhook Operations

#### `discord_webhook_send`
Send a message via Discord webhook.

```json
{
  "webhook_url": "https://discord.com/api/webhooks/...",
  "content": "Message via webhook",
  "username": "Custom Bot Name",
  "avatar_url": "https://example.com/avatar.png",
  "embeds": [...]
}
```

### Miyabi Integration

#### `discord_miyabi_notification`
Send a formatted Miyabi system notification.

```json
{
  "type": "success",
  "title": "Task Completed",
  "message": "Agent CodeGen has successfully completed the implementation",
  "agent": "CodeGen",
  "task": "implement-discord-mcp",
  "details": "All 9 tools implemented with full functionality",
  "webhook_url": "https://discord.com/api/webhooks/...",
  "channel_id": "123456789012345678"
}
```

#### Notification Types:
- `info` - Blue (default)
- `success` - Green
- `warning` - Orange
- `error` - Red

## Integration with Miyabi

This MCP server integrates seamlessly with the Miyabi ecosystem:

### Agent Notifications
```typescript
// Send agent status update
await discord_miyabi_notification({
  type: "info",
  title: "Agent Status Update",
  message: "CodeGen agent has started processing new task",
  agent: "CodeGen",
  task: "feature-implementation-#123"
});
```

### Task Completion
```typescript
// Send task completion notification
await discord_miyabi_notification({
  type: "success",
  title: "Task Completed",
  message: "Feature implementation has been completed successfully",
  agent: "CodeGen",
  task: "feature-implementation-#123",
  details: "All tests passing, PR created: #456"
});
```

### Error Reporting
```typescript
// Send error notification
await discord_miyabi_notification({
  type: "error",
  title: "Agent Error",
  message: "CodeGen agent encountered an error during execution",
  agent: "CodeGen",
  task: "feature-implementation-#123",
  details: "TypeError: Cannot read property 'length' of undefined"
});
```

## Development

### Project Structure
```
miyabi-discord/
├── src/
│   └── index.ts      # Main server implementation
├── dist/             # Built JavaScript files
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

## Security Considerations

1. **Token Security**: Never commit your Discord bot token to version control
2. **Webhook URLs**: Keep webhook URLs secure and regenerate if compromised
3. **Permissions**: Use minimal required permissions for the bot
4. **Rate Limiting**: Be aware of Discord's rate limits when sending messages

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if `DISCORD_BOT_TOKEN` is set correctly
   - Verify bot has required permissions in the Discord server
   - Check if bot is online in Discord

2. **Webhook errors**
   - Verify webhook URL is correct and active
   - Check if webhook has been deleted or regenerated

3. **Permission errors**
   - Ensure bot has required permissions in the target channel
   - Check if channel/server is accessible to the bot

### Debug Mode

Set `DEBUG=discord*` environment variable to enable debug logging:

```bash
DEBUG=discord* npm start
```

## License

MIT License - see the main project license for details.

## Contributing

This is part of the Miyabi Multi-Agent System. Please follow the project's contribution guidelines.