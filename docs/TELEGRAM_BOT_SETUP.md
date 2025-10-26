# Miyabi Telegram Bot Setup Guide

**Last Updated**: 2025-10-27
**Status**: MVP Implementation

## Overview

The Miyabi Telegram Bot enables natural language interaction with the Miyabi autonomous development framework via Telegram. Users can:

- Create GitHub Issues from natural language descriptions
- Receive real-time progress notifications
- Monitor Agent execution status
- Control Miyabi workflows via chat

---

## Prerequisites

1. **Telegram Bot Token**
   - Create a bot via [@BotFather](https://t.me/botfather)
   - Use `/newbot` command and follow instructions
   - Save the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **GitHub Personal Access Token**
   - Generate at: https://github.com/settings/tokens
   - Required scopes: `repo`, `issues`, `workflow`

3. **Anthropic API Key**
   - Sign up at: https://console.anthropic.com
   - Create API key from dashboard

4. **Public HTTPS Endpoint**
   - Telegram webhooks require HTTPS
   - Options:
     - **Production**: Deploy to server with SSL certificate
     - **Development**: Use [ngrok](https://ngrok.com/) for local testing

---

## Installation

### Step 1: Environment Configuration

1. Copy the example environment file:
```bash
cp .env.telegram.example .env.telegram
```

2. Edit `.env.telegram` with your credentials:
```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here  # Optional

# Webhook Configuration
WEBHOOK_URL=https://your-domain.com/webhook
WEBHOOK_PORT=3000

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### Step 2: Build the Bot Binary

```bash
cargo build --release --bin miyabi-telegram-bot --features bot-server
```

### Step 3: Find Your Telegram Chat ID (Optional)

If you want to receive notifications, you need your Telegram chat ID:

1. Start a conversation with your bot in Telegram
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find your `chat.id` in the JSON response
5. Add it to `.env.telegram` as `TELEGRAM_CHAT_ID`

---

## Running the Bot

### Local Development (with ngrok)

1. **Start ngrok**:
```bash
ngrok http 3000
```

2. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

3. **Set WEBHOOK_URL in `.env.telegram`**:
```bash
WEBHOOK_URL=https://abc123.ngrok.io/webhook
```

4. **Load environment variables and run**:
```bash
set -a
source .env.telegram
set +a

./target/release/miyabi-telegram-bot
```

5. **Verify bot is running**:
   - Check logs for: `✅ Connected to Telegram as: @your_bot_name`
   - Visit: `http://localhost:3000/health` (should return `{"status":"ok"}`)

### Production Deployment

1. **Deploy to server with SSL certificate** (e.g., nginx + Let's Encrypt)

2. **Set WEBHOOK_URL to your domain**:
```bash
WEBHOOK_URL=https://yourdomain.com/webhook
```

3. **Run bot as systemd service**:

Create `/etc/systemd/system/miyabi-telegram-bot.service`:
```ini
[Unit]
Description=Miyabi Telegram Bot
After=network.target

[Service]
Type=simple
User=miyabi
WorkingDirectory=/opt/miyabi
EnvironmentFile=/opt/miyabi/.env.telegram
ExecStart=/opt/miyabi/target/release/miyabi-telegram-bot
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable miyabi-telegram-bot
sudo systemctl start miyabi-telegram-bot
sudo systemctl status miyabi-telegram-bot
```

---

## Usage

### Commands

- `/start` - Get started with the bot
- `/help` - Show available commands
- `/status` - Check system status

### Natural Language

Just send a message describing what you want to build:

**Examples**:
- "Add dark mode toggle to the settings page"
- "Fix the authentication bug in login.rs"
- "Implement user search with autocomplete"

**Workflow**:
1. Bot analyzes your message
2. Creates a GitHub Issue
3. Executes Miyabi Agents
4. Sends progress notifications
5. Notifies when complete

---

## Architecture

```
User (Telegram)
    ↓
Telegram API (webhook)
    ↓
miyabi-telegram-bot (Axum server)
    ↓
├─ Natural Language Processing
├─ GitHub Issue Creation (gh CLI)
└─ Miyabi Agent Execution
    ↓
    ├─ CoordinatorAgent (DAG planning)
    ├─ CodeGenAgent (implementation)
    ├─ ReviewAgent (code review)
    └─ PRAgent (pull request)
        ↓
    Real-time Telegram notifications
```

---

## Implementation Status

### ✅ Implemented (MVP)

- [x] Webhook server with Axum
- [x] Telegram API client integration
- [x] Basic command handling (`/start`, `/help`, `/status`)
- [x] Natural language message processing
- [x] GitHub Issue creation via `gh` CLI
- [x] Mock Agent execution workflow
- [x] Real-time notification system

### 🚧 Pending Integration

- [ ] Actual Anthropic Claude API integration for intent analysis
- [ ] Real Miyabi Agent execution pipeline
- [ ] Worktree-based parallel execution
- [ ] Quality score calculation
- [ ] PR creation from bot
- [ ] Entity-Relation flow visualization
- [ ] Callback button handlers for workflow control
- [ ] Error recovery and retry logic

### 📋 Future Enhancements

- [ ] Multi-user support with authentication
- [ ] Conversation history and context
- [ ] Agent progress streaming
- [ ] Interactive workflow approval
- [ ] Voice message support (VOICEVOX integration)
- [ ] Rich media in notifications (images, videos)
- [ ] Inline keyboard for quick actions

---

## Troubleshooting

### Bot doesn't respond

1. Check logs for errors
2. Verify `TELEGRAM_BOT_TOKEN` is correct
3. Ensure webhook URL is publicly accessible via HTTPS
4. Test webhook endpoint: `curl https://your-webhook-url/health`

### "Failed to create GitHub Issue"

1. Verify `GITHUB_TOKEN` has correct permissions
2. Check `gh` CLI is installed: `gh --version`
3. Ensure you're in a GitHub repository directory

### Webhook errors

1. Telegram requires HTTPS (not HTTP)
2. Use ngrok for local development
3. Check webhook status: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

---

## Security Notes

- **Never commit `.env.telegram`** to version control (it's in `.gitignore`)
- Bot token grants full access to your Telegram bot
- GitHub token should have minimal required scopes
- Use HTTPS for all webhook endpoints
- Validate all incoming webhook payloads

---

## References

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Miyabi Agent System](../.claude/context/agents.md)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Status**: 🚧 MVP - Basic functionality working, Agent integration pending
**Next Steps**: Integrate with actual Miyabi Agent execution pipeline
