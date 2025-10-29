# 📱 Telegram Bot Setup Guide for Miyabi Web API

**Date**: 2025-10-29
**Status**: ⏳ Ready for Setup
**Deployed Service**: https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/telegram/webhook

---

## 🎯 Overview

The Miyabi Web API includes a fully functional Telegram bot interface that:
- ✅ Receives natural language requests via Telegram
- ✅ Analyzes them using GPT-4
- ✅ Creates GitHub Issues automatically
- ✅ Triggers Miyabi agents for task execution
- ✅ Supports English and Japanese
- ✅ Provides authorization controls

---

## 📋 Prerequisites

Before setting up, ensure you have:
- A Telegram account
- Access to Telegram BotFather (@BotFather)
- The deployed Miyabi API service running
- Access to GCP Secret Manager for this project
- OpenAI API key (for GPT-4 analysis)
- GitHub token (for issue creation)

---

## 🤖 Step 1: Create Telegram Bot via BotFather

### 1.1 Start BotFather
Open Telegram and search for `@BotFather`, then:

```
/start
/newbot
```

### 1.2 Follow the Prompts
BotFather will ask:
1. **Bot name** (display name): e.g., "Miyabi Development Bot"
2. **Bot username** (unique identifier): e.g., "miyabi_dev_bot" (must end with "_bot")

### 1.3 Save Your Token
BotFather will respond with:
```
Congratulations on your new bot. You will find it at t.me/your_bot_username
Use this token to access the HTTP API:
123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF
```

**🔐 IMPORTANT**: Save this token securely. You'll need it for the next steps.

---

## 🔑 Step 2: Configure Cloud Run with Bot Token

### 2.1 Add Token to Secret Manager

```bash
# Authenticate with GCP
gcloud auth login

# Create secret in Secret Manager
echo "123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF" | \
  gcloud secrets create telegram-bot-token \
    --data-file=- \
    --project=miyabi-476308

# Or update existing secret
echo "123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF" | \
  gcloud secrets versions add telegram-bot-token \
    --data-file=- \
    --project=miyabi-476308
```

### 2.2 Grant Cloud Run Service Account Access

```bash
# Get service account
SERVICE_ACCOUNT="41379428694-compute@developer.gserviceaccount.com"

# Grant secretmanager.secretAccessor role
gcloud secrets add-iam-policy-binding telegram-bot-token \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --project=miyabi-476308
```

### 2.3 Update Cloud Run to Inject Token

The `scripts/deploy-gcp.sh` should already include `telegram-bot-token` in secrets. If not:

```bash
# Edit the deployment script and ensure this line includes the token:
--set-secrets="TELEGRAM_BOT_TOKEN=telegram-bot-token:latest,..."
```

Then redeploy:
```bash
bash scripts/deploy-gcp.sh
```

---

## 🌐 Step 3: Register Webhook with Telegram

### 3.1 Set Webhook URL

After the bot is deployed and configured, register the webhook with Telegram:

```bash
# Using curl
curl -X POST "https://api.telegram.org/bot123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/telegram/webhook",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Or using gcloud helper script:

```bash
BOT_TOKEN="123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF"
WEBHOOK_URL="https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/telegram/webhook"

curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"allowed_updates\": [\"message\", \"callback_query\"]}"
```

### 3.2 Verify Webhook is Set

```bash
BOT_TOKEN="123456789:ABCDefGHIJKlmnoPQRSTuvwxyzABC-DEF"

curl -X GET "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "ip_address": "34.x.x.x",
    "last_error_date": null,
    "max_connections": 40,
    "allowed_updates": ["message", "callback_query"]
  }
}
```

---

## 👥 Step 4: Configure Authorized Users

### 4.1 Get Your Chat ID

Send the bot a message:
```
/getid
```

The bot will respond with your Chat ID and user information.

### 4.2 Add to Authorized Users

Set environment variable with authorized chat IDs:

```bash
# Create/update secret
gcloud secrets create authorized-chat-ids \
  --data-file=- \
  --project=miyabi-476308 << 'EOF'
123456789,987654321,555666777
EOF

# Or update existing
echo "123456789,987654321,555666777" | \
  gcloud secrets versions add authorized-chat-ids \
    --data-file=- \
    --project=miyabi-476308
```

### 4.3 Update Cloud Run

Add to deployment script or redeploy with:

```bash
gcloud run deploy miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 \
  --set-env-vars="AUTHORIZED_CHAT_IDS=123456789,987654321,555666777" \
  --image=gcr.io/miyabi-476308/miyabi-web-api:latest
```

---

## 🧪 Step 5: Test the Bot

### 5.1 Open Bot in Telegram

Find your bot via: `t.me/your_bot_username`

### 5.2 Send Test Commands

```
/start
```

Expected response:
```
**Miyabi Bot**

Natural language control for autonomous development

**How it works**
Send a message → GPT-4 analyzes → Issue created → Agent executes → Notification sent

**Examples**
Add Google OAuth to login
Improve dashboard design
Add performance tests

────────────────────────

/help for more information
```

### 5.3 Test Natural Language

Try sending:
```
Add dark mode toggle to dashboard
```

Bot should:
1. ✅ Acknowledge the request
2. ✅ Analyze with GPT-4
3. ✅ Create a GitHub Issue
4. ✅ Trigger Miyabi agent
5. ✅ Send completion notification

---

## 📊 Configuration Summary

| Component | Status | Value |
|-----------|--------|-------|
| Bot Token | ⏳ Pending | `telegram-bot-token` (Secret Manager) |
| Webhook URL | ✅ Ready | `https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/telegram/webhook` |
| Authorized Chat IDs | ⏳ Pending | `authorized-chat-ids` (Secret Manager) |
| OpenAI API Key | ⚠️ Required | Needed for GPT-4 analysis |
| GitHub Token | ⚠️ Required | Already configured |

---

## 🔧 Bot Features

### Commands
- `/start` - Welcome message with feature overview
- `/help` - Help and documentation
- `/getid` - Get your Chat ID for authorization

### Natural Language Processing
The bot analyzes any message using GPT-4 to:
- Extract task/feature description
- Suggest GitHub labels
- Determine priority (P0-P3)
- Select appropriate agent (coordinator, codegen, review, deployment)
- Create issue with full context

### Language Support
Automatically detects user language:
- ✅ English (default)
- ✅ Japanese (when user's Telegram language is set to ja)

### Authorization
- ✅ All users can use `/getid` and `/help`
- ⚠️ Other commands require authorization (Chat ID in AUTHORIZED_CHAT_IDS)
- ✅ Prevents unauthorized access with clear error messages

---

## 🐛 Troubleshooting

### Issue: "Bot does not respond to messages"

**Causes & Solutions:**

1. **Webhook not registered**
   ```bash
   # Check webhook status
   curl -X GET "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

   # Should have "url" field set to your endpoint
   ```

2. **Service is offline**
   ```bash
   # Check Cloud Run service
   curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health
   ```

3. **Bot token not in environment**
   ```bash
   # Check Cloud Run revision environment variables
   gcloud run revisions list --service=miyabi-web-api --region=asia-northeast1 \
     --format="table(name,status.conditions[0].status)"

   # Check logs for TELEGRAM_BOT_TOKEN error
   gcloud run logs read miyabi-web-api --limit=50
   ```

4. **User not authorized**
   - Get Chat ID with `/getid`
   - Add to AUTHORIZED_CHAT_IDS
   - Redeploy Cloud Run

### Issue: "GPT-4 analysis fails"

**Causes & Solutions:**

1. **OpenAI API key not set**
   ```bash
   # Add to Cloud Run secrets
   echo "sk-..." | gcloud secrets versions add openai-api-key --data-file=-
   ```

2. **OpenAI API rate limit**
   - Wait a moment and retry
   - Check OpenAI account usage at https://platform.openai.com/account/usage

3. **Malformed request**
   - Ensure message text is properly formed
   - Try with simpler language

### Issue: "Issue creation fails"

**Causes & Solutions:**

1. **GitHub token not valid**
   ```bash
   # Verify token works
   curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/user
   ```

2. **Repository not accessible**
   - Check GITHUB_OWNER and GITHUB_REPO environment variables
   - Ensure token has repo write permissions

---

## 📈 Monitoring & Logging

### View Bot Requests

```bash
# Check recent webhook requests
gcloud run logs read miyabi-web-api --region=asia-northeast1 --limit=20 \
  --filter="resource.type=cloud_run_revision AND protoPayload.methodName=handle_webhook"
```

### Monitor Bot Activity

Watch for these log patterns:
- ✅ `Received Telegram update` - Message received
- ✅ `Message from chat_id=` - Message processed
- ✅ `GPT-4 analysis complete` - Analysis successful
- ✅ `GitHub Issue created` - Issue created
- ❌ `Telegram client error` - Bot token issue
- ❌ `Unauthorized access attempt` - Authorization failed

---

## 🚀 Next Steps

1. **Complete Bot Setup**
   - [ ] Create bot via BotFather
   - [ ] Add token to Secret Manager
   - [ ] Register webhook with Telegram
   - [ ] Configure authorized users
   - [ ] Test with /start command

2. **Integration Testing**
   - [ ] Test natural language processing
   - [ ] Verify GitHub issue creation
   - [ ] Test agent execution workflow
   - [ ] Verify notifications

3. **Production Hardening**
   - [ ] Set up Cloud Logging alerts for errors
   - [ ] Monitor API rate limits
   - [ ] Add database persistence for processed updates
   - [ ] Implement message rate limiting

4. **Enhancement** (Future)
   - [ ] Add callback buttons for agent selection
   - [ ] Implement message editing for status updates
   - [ ] Add file upload support for code context
   - [ ] Create admin dashboard for bot management

---

## 📚 Helpful Resources

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **BotFather Documentation**: https://t.me/BotFather (send /help)
- **Webhook Setup Guide**: https://core.telegram.org/bots/webhooks
- **Long Polling Alternative**: https://core.telegram.org/bots/api#getupdates

---

## 🔐 Security Considerations

- ✅ Bot token stored in Secret Manager (encrypted at rest)
- ✅ Service account has minimal IAM permissions (secretmanager.secretAccessor only)
- ✅ HTTPS-only webhook (Cloud Run enforces HTTPS)
- ✅ Authorization controls prevent unauthorized access
- ⚠️ Webhook URL publicly accessible (by design for webhook callbacks)
- ⚠️ Consider adding API key validation in future versions

---

## 📞 Support

If bot setup issues occur:

1. Check logs: `gcloud run logs read miyabi-web-api --limit=50`
2. Verify webhook: `curl -X GET "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"`
3. Test service: `curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health`
4. Review this guide for troubleshooting section

---

**Status**: ⏳ Ready for Setup
**Last Updated**: 2025-10-29
**Next Phase**: Complete bot setup and authorization

