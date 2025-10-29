# 🤖 Telegram Bot Setup - Complete Step-by-Step Guide

**Version**: 1.0.0
**Date**: 2025-10-29
**Estimated Time**: 10 minutes total
**Difficulty**: ⭐ Easy

---

## Overview

This guide walks you through setting up your Telegram bot for the Miyabi Web API. This is the final task to reach 100% production readiness.

**Current Status**: ⏳ Pending (requires manual Telegram interaction)
**After Completion**: ✅ 100% Production Ready (8/8 tasks complete)

---

## Prerequisites Checklist

Before you start, verify you have:

- [ ] Telegram app installed on your phone or computer
- [ ] Access to create Telegram bots
- [ ] Terminal access to run the setup script
- [ ] gcloud CLI authenticated and configured
- [ ] Miyabi Web API deployed on Cloud Run

---

## Step 1: Create Bot via BotFather (Manual - 5 minutes)

### What is BotFather?
BotFather is Telegram's official bot for creating and managing Telegram bots. It's the only way to get a bot token.

### Instructions:

1. **Open Telegram**
   - Desktop: https://web.telegram.org
   - Mobile: Open the Telegram app

2. **Search for @BotFather**
   - Use the search function to find BotFather
   - It's the official Telegram account (blue checkmark)
   - Tap to open the chat

3. **Create New Bot**
   - Send the command: `/newbot`
   - BotFather will respond with setup instructions

4. **Name Your Bot**
   - When prompted, enter a display name
   - Example: "Miyabi Bot" or "Miyabi Web API Bot"
   - This is what users see when they interact with your bot

5. **Choose Bot Username**
   - Must be unique
   - Must end with "bot"
   - Examples: `miyabi_bot`, `miyabi_web_api_bot`, `my_miyabi_bot`
   - This is used as the handle (@username)

6. **Copy Your Bot Token**
   - BotFather sends you a token that looks like:
     ```
     123456789:ABCdefGHIjklMNOpqrSTUvwxyz-1234567890
     ```
   - This is your API token for the bot
   - **SAVE THIS - you'll need it in Step 2**
   - ⚠️ **IMPORTANT**: Keep this token secret! Don't share it publicly.

### Example Bot Creation Dialog

```
You: /newbot

BotFather: Alright, a new bot. How are we going to call it?
           Please choose a name for your bot.

You: Miyabi Bot

BotFather: Good. Now let's choose a username for your bot.
           It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.

You: miyabi_bot

BotFather: Done! Congratulations on your new bot.
           You will find it at t.me/miyabi_bot.
           You can now add a description, about section and profile picture for your bot, see /help for a list of commands.
           By the way, when you've finished creating your cool bot, ping our Bot Support if you want a better username for the bot.
           Just make sure all the following conditions are met:

           - incoming messages have no forwards from public channels
           - 0 or 1 forward per 5 messages
           - forwards are related to bot functionality
           - 2+ requests per telegram user
           - good odds that users won't move to another bot

           Here's your token:
           123456789:ABCdefGHIjklMNOpqrSTUvwxyz-1234567890

           Use this token to access the HTTP API.
```

**✅ Task Complete**: You now have a bot token. Move to Step 2.

---

## Step 2: Run Setup Script (Automated - 2 minutes)

Now that you have your bot token, the setup script will automatically:
1. Add the token to Google Secret Manager
2. Grant Cloud Run service account access
3. Redeploy Cloud Run with the token
4. Verify everything works

### Instructions:

1. **Open Terminal**
   - macOS/Linux: Terminal app
   - Windows: PowerShell or WSL

2. **Navigate to Repository**
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private
   ```

3. **Run Setup Script**
   ```bash
   ./TELEGRAM_BOT_FINAL_SETUP.sh "YOUR_BOT_TOKEN_HERE"
   ```

   Replace `YOUR_BOT_TOKEN_HERE` with the actual token from BotFather.

   **Example**:
   ```bash
   ./TELEGRAM_BOT_FINAL_SETUP.sh "123456789:ABCdefGHIjklMNOpqrSTUvwxyz-1234567890"
   ```

4. **Wait for Completion**
   - Script will output status for each step
   - Green checkmarks (✅) = success
   - Yellow warnings (⚠️) = non-critical issues
   - Red errors (❌) = problems to fix

5. **Verify Output**
   - Look for final summary with:
     - "✅ TELEGRAM BOT SETUP COMPLETE"
     - Service URL confirmation
     - Health check: HTTP 200 OK

### Example Script Output

```
→ Verifying GCP configuration...
✅ GCP configuration verified (project: miyabi-476308)
→ Adding bot token to Secret Manager...
✅ Bot token added to Secret Manager
→ Granting Cloud Run service account access to secret...
✅ Service account granted access to telegram-bot-token secret
→ Redeploying Cloud Run service with bot token...
✅ Cloud Run service redeployed with Telegram bot token
→ Verifying deployment...
→ Service URL: https://miyabi-web-api-ycw7g3zkva-an.a.run.app
→ Testing health endpoint...
✅ Health endpoint responding: HTTP 200

╔════════════════════════════════════════════════════════╗
║  ✅ TELEGRAM BOT SETUP COMPLETE                        ║
╚════════════════════════════════════════════════════════╝

Summary of Changes:
  ✅ Bot token stored in Secret Manager
  ✅ Service account granted access
  ✅ Cloud Run service redeployed
  ✅ Health endpoint verified

Service Details:
  Service Name:  miyabi-web-api
  Region:        asia-northeast1
  Project:       miyabi-476308
  Service URL:   https://miyabi-web-api-ycw7g3zkva-an.a.run.app
  Health Check:  HTTP 200 OK
```

**✅ Task Complete**: Your bot is now connected to the API. Move to Step 3.

---

## Step 3: Verify Bot Integration (Manual - 3 minutes)

Now verify that your bot works end-to-end with the API.

### Test 1: Bot Health Check

```bash
# Check that the service is healthy
curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "0.1.1",
  "timestamp": "2025-10-29T21:35:00Z"
}
```

✅ If you see this → API is healthy

### Test 2: Verify Bot Secret in Cloud Run

```bash
# Check that bot token is loaded in environment
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 \
  --format='value(spec.template.spec.containers[0].env)'
```

Look for `TELEGRAM_BOT_TOKEN` in the output.

✅ If you see `TELEGRAM_BOT_TOKEN` → Secret is loaded

### Test 3: Send Test Message to Bot (Mobile App Required)

To fully test the bot, you need to actually message it:

1. **Open Telegram App**
   - Search for your bot: `@miyabi_bot` (or your chosen username)
   - Tap to open chat

2. **Send Test Message**
   - Type: `Hello` or any text message
   - Send the message

3. **Check Logs**
   ```bash
   # View recent logs for webhook messages
   gcloud logging read \
     'resource.type=cloud_run_revision AND jsonPayload.webhook_type=telegram' \
     --limit=10 \
     --project=miyabi-476308
   ```

   Look for log entries showing your message was received.

✅ If you see logs with your message → Bot integration works!

---

## Troubleshooting

### Issue #1: "Invalid bot token format"

**Error Message**:
```
Invalid bot token format!
Token should be in format: numbers:alphanumeric-characters
```

**Fix**:
1. Copy the token from BotFather again
2. Make sure you copied the entire token (it's usually long)
3. Check for extra spaces or line breaks
4. Paste in terminal exactly as BotFather provided it

---

### Issue #2: "gcloud CLI not found"

**Error Message**:
```
gcloud CLI not found. Please install Google Cloud SDK.
```

**Fix**:
```bash
# Install Google Cloud SDK
brew install google-cloud-sdk  # macOS
# or
apt-get install google-cloud-sdk  # Linux

# Initialize gcloud
gcloud init
gcloud auth login
```

---

### Issue #3: "Health endpoint returned HTTP XXX"

**Error Message**:
```
Health endpoint returned HTTP 502 (expected 200)
```

**Causes & Fixes**:

| HTTP Code | Cause | Fix |
|-----------|-------|-----|
| 502 | Service not responding | Wait 2 min for deployment to stabilize, then retry |
| 503 | Service unavailable | Check if database is accessible |
| 500 | Server error | Check logs: `gcloud logging read --limit=50` |
| 404 | Endpoint not found | Verify URL is correct |

---

### Issue #4: "Secret token mismatch"

**Error Message**:
```
Bot token mismatch in Secret Manager
```

**Fix**:
1. The token you provided doesn't match what was stored
2. This usually means the first run failed
3. Try running the script again with the correct token

---

### Issue #5: "Service account not found"

**Error Message**:
```
ERROR: (gcloud.secrets.add-iam-policy-binding) FAILED_PRECONDITION
Service account not found
```

**Fix**:
```bash
# Create the service account
gcloud iam service-accounts create miyabi-web-api \
  --display-name="Miyabi Web API Service Account" \
  --project=miyabi-476308
```

---

## What Happens Behind the Scenes

### The Setup Script Does These Steps

1. **Validates token format**
   - Checks format: `numbers:alphanumeric`
   - Prevents mistakes early

2. **Checks GCP authentication**
   - Verifies gcloud CLI is installed
   - Sets correct project

3. **Stores token securely**
   - Adds token to Google Secret Manager
   - Token is encrypted at rest
   - Access is role-based

4. **Grants service account access**
   - Gives Cloud Run permission to read token
   - Uses `secretmanager.secretAccessor` role

5. **Redeploys Cloud Run**
   - Uses current running service
   - Adds environment variable: `TELEGRAM_BOT_TOKEN`
   - Points to secret in Secret Manager

6. **Verifies deployment**
   - Tests health endpoint
   - Confirms service is healthy
   - Verifies secret was stored correctly

### Why Each Step is Important

```
Secure Storage ← Prevents token leaks
        ↓
IAM Permissions ← Only authorized service can access
        ↓
Environment Variable ← Application can read token
        ↓
Verification ← Confirms everything works
```

---

## After Setup Complete

### What Now Works

✅ Your Telegram bot is connected to the API
✅ Webhook messages from Telegram arrive at the API
✅ API can send responses back to Telegram
✅ All messages are logged and monitored
✅ Alerts fire if webhook processing fails

### Monitoring Bot Integration

**View bot-related logs**:
```bash
gcloud logging read \
  'jsonPayload.webhook_type=telegram' \
  --limit=50 \
  --project=miyabi-476308
```

**Check for errors**:
```bash
gcloud logging read \
  'severity>=ERROR AND jsonPayload.webhook_type=telegram' \
  --limit=50 \
  --project=miyabi-476308
```

**View summary**:
```bash
# Count webhook messages by type
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --limit=1000 \
  --format='value(jsonPayload.webhook_type)' \
  --project=miyabi-476308 | sort | uniq -c
```

---

## Final Checklist

Once you complete all steps, verify:

```
TELEGRAM BOT SETUP COMPLETION CHECKLIST
═══════════════════════════════════════

Manual Steps (Telegram):
  [ ] Created bot via @BotFather
  [ ] Copied bot token
  [ ] Saved token somewhere safe

Script Execution:
  [ ] Ran TELEGRAM_BOT_FINAL_SETUP.sh
  [ ] Script completed with "✅ TELEGRAM BOT SETUP COMPLETE"
  [ ] Health endpoint returned HTTP 200

Verification:
  [ ] Health check curl succeeded
  [ ] Secret token is loaded in Cloud Run
  [ ] Sent test message to bot
  [ ] Saw bot message in logs

Production Ready:
  [ ] All above items completed
  [ ] System is 100% production ready
  [ ] Team is trained on operations
```

---

## Quick Reference Commands

```bash
# Check bot token is in Secret Manager
gcloud secrets describe telegram-bot-token --project=miyabi-476308

# View bot token (for verification only)
gcloud secrets versions access latest \
  --secret=telegram-bot-token \
  --project=miyabi-476308

# Check if service has bot token in environment
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 | grep -A 20 "secretVolumes"

# View recent bot messages in logs
gcloud logging read 'jsonPayload.webhook_type=telegram' \
  --limit=20 \
  --project=miyabi-476308

# Test bot webhook (manual, from Telegram)
# Just send a message to your bot @miyabi_bot
# It will appear in the logs above
```

---

## Support & Questions

**For issues**:
1. Check the Troubleshooting section above
2. Review logs: `gcloud logging read --limit=100 --project=miyabi-476308`
3. Check alert policies: `gcloud monitoring policies list --project=miyabi-476308`

**For more information**:
- TEAM_TRAINING_GUIDE.md - How to operate the system
- SESSION_3_COMPREHENSIVE_SUMMARY.md - Complete system overview
- MONITORING_OPTIMIZATION_GUIDE.md - How to monitor and optimize

---

## Next Steps After Telegram Bot Setup

### Immediate (After setup)
1. Test bot by sending messages
2. Verify messages appear in logs
3. Confirm no errors in Cloud Run logs

### Day 1-2
- Monitor real traffic from bot users
- Verify webhook processing is reliable
- Check alert policies are appropriate

### Week 1
- Collect performance metrics
- Review webhook processing patterns
- Adjust if needed

### Ongoing
- Monitor bot uptime and reliability
- Track bot usage metrics
- Optimize based on real patterns

---

**Status After Completion**: ✅ 8/8 Tasks Complete - 100% Production Ready

---

**Last Updated**: 2025-10-29
**Next Review**: After first week of production traffic
**Document Version**: 1.0.0

