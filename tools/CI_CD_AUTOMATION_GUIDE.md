# CI/CD Automation Guide - Miyabi Daily Narration

**Last Updated**: 2025-10-24
**Phase**: 13.8
**Status**: Production Ready

---

## Overview

This guide provides comprehensive instructions for automating daily Miyabi development progress narration generation and YouTube upload using GitHub Actions.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [GitHub Secrets Configuration](#github-secrets-configuration)
5. [Workflow Configuration](#workflow-configuration)
6. [Testing & Troubleshooting](#testing--troubleshooting)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Best Practices](#best-practices)

---

## Architecture

### Workflow Overview

```
GitHub Actions (Daily Cron)
    ↓
1. Clone repository
    ↓
2. Setup Python + Install dependencies
    ↓
3. Setup VOICEVOX Engine (mock mode)
    ↓
4. Run miyabi-narrate.sh -d 1 -s -t -v
    ↓
5. Upload video to YouTube via API
    ↓
6. Send Discord notification
    ↓
7. Cleanup & archive artifacts
```

### Components

**Workflow File**: `.github/workflows/daily-narration.yml`
**Upload Script**: `tools/youtube-upload.py`
**Test Suite**: `tools/test-streaming-integration.sh`

---

## Prerequisites

### GitHub Repository Settings

**Required Features**:
- ✅ GitHub Actions enabled
- ✅ Workflow permissions: Read repository contents
- ✅ Secrets management access

### External Services

**YouTube Account**:
- YouTube channel with upload privileges
- YouTube Data API v3 enabled
- OAuth 2.0 credentials

**Discord (Optional)**:
- Discord webhook URL for notifications

**BytePlus ARK API (Optional)**:
- API key for thumbnail generation

---

## Setup Instructions

### Step 1: Enable YouTube Data API v3

1. **Open Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Create new project** (or select existing):
   ```
   Project name: miyabi-narration
   ```

3. **Enable YouTube Data API v3**:
   ```
   APIs & Services → Library
   Search: "YouTube Data API v3"
   Click "Enable"
   ```

4. **Create OAuth 2.0 credentials**:
   ```
   APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   Application type: Desktop app
   Name: miyabi-narration-desktop
   Click "Create"
   ```

5. **Download credentials**:
   ```
   Click "Download JSON"
   Save as: credentials.json
   ```

### Step 2: Authenticate YouTube API (Local)

**Run authentication flow locally**:
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools

# Install dependencies
pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2

# Run upload script (will open browser for OAuth)
python3 youtube-upload.py --channel-info
```

**Expected Flow**:
1. Browser opens with Google OAuth consent screen
2. Sign in with your YouTube account
3. Grant permissions to "miyabi-narration"
4. Authorization complete
5. `token.json` created in current directory

**Verify authentication**:
```bash
cat token.json
# Expected: JSON with access_token, refresh_token, etc.

python3 youtube-upload.py --channel-info
# Expected: Channel information displayed
```

### Step 3: Configure GitHub Secrets

**Add secrets to repository**:
```bash
# YouTube credentials (OAuth 2.0 client)
gh secret set YOUTUBE_CREDENTIALS < credentials.json

# YouTube token (refresh token for API)
gh secret set YOUTUBE_TOKEN < token.json

# Discord webhook (optional)
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/..."

# BytePlus ARK API (optional, for thumbnails)
gh secret set BYTEPLUS_ACCESS_KEY --body "your-access-key"
gh secret set BYTEPLUS_SECRET_KEY --body "your-secret-key"
```

**Verify secrets**:
```bash
gh secret list
# Expected:
# YOUTUBE_CREDENTIALS    Updated 2025-10-24
# YOUTUBE_TOKEN          Updated 2025-10-24
# DISCORD_WEBHOOK_URL    Updated 2025-10-24
```

### Step 4: Enable Workflow

**Verify workflow file**:
```bash
cat .github/workflows/daily-narration.yml
```

**Test manual trigger**:
```bash
# Trigger workflow manually
gh workflow run daily-narration.yml

# Monitor execution
gh run list --workflow=daily-narration.yml

# View logs
gh run view --log
```

**Expected Output**:
```
✅ Workflow completed successfully
📤 Video uploaded to YouTube
🔔 Discord notification sent
```

---

## GitHub Secrets Configuration

### Required Secrets

#### YOUTUBE_CREDENTIALS (Required)

**Format**: JSON
**Source**: Google Cloud Console OAuth 2.0 credentials

**Example**:
```json
{
  "installed": {
    "client_id": "123456789-abcdefg.apps.googleusercontent.com",
    "project_id": "miyabi-narration",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-...",
    "redirect_uris": ["http://localhost"]
  }
}
```

**Add to GitHub**:
```bash
gh secret set YOUTUBE_CREDENTIALS < credentials.json
```

---

#### YOUTUBE_TOKEN (Required)

**Format**: JSON
**Source**: Local authentication (Step 2)

**Example**:
```json
{
  "token": "ya29.a0AfB_...",
  "refresh_token": "1//0gXX...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "123456789-abcdefg.apps.googleusercontent.com",
  "client_secret": "GOCSPX-...",
  "scopes": ["https://www.googleapis.com/auth/youtube.upload"],
  "expiry": "2025-10-24T12:00:00Z"
}
```

**Add to GitHub**:
```bash
gh secret set YOUTUBE_TOKEN < token.json
```

**Token Refresh**:
- Access token expires after 1 hour
- Refresh token used to get new access token automatically
- Refresh token valid for 6 months (Google policy)
- Re-authenticate if refresh token expires

---

#### DISCORD_WEBHOOK_URL (Optional)

**Format**: URL
**Source**: Discord Server Settings

**Setup**:
```
Discord Server → Server Settings → Integrations → Webhooks
Click "New Webhook"
Name: Miyabi Narration Bot
Channel: #development-updates
Copy Webhook URL
```

**Example**:
```
https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz
```

**Add to GitHub**:
```bash
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/..."
```

---

### Optional Secrets

#### BYTEPLUS_ACCESS_KEY / BYTEPLUS_SECRET_KEY

**Purpose**: AI-powered thumbnail generation
**Required**: Only if using `-t` flag in miyabi-narrate.sh

**Setup**: See [BytePlus ARK API documentation](https://www.volcengine.com/docs/6459/69788)

---

## Workflow Configuration

### Schedule Configuration

**Default**: Daily at 9:00 AM JST (00:00 UTC)

**Edit schedule**:
```yaml
# .github/workflows/daily-narration.yml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at 00:00 UTC (09:00 JST)
```

**Other schedules**:
```yaml
# Every 6 hours
- cron: '0 */6 * * *'

# Every Monday at 9:00 AM JST
- cron: '0 0 * * 1'

# Twice daily: 9:00 AM and 9:00 PM JST
- cron: '0 0,12 * * *'
```

**Timezone Reference**:
- GitHub Actions uses UTC
- JST = UTC + 9 hours
- Example: 9:00 AM JST = 00:00 UTC

### Workflow Parameters

**Edit narration parameters**:
```yaml
# .github/workflows/daily-narration.yml
- name: Generate narration
  run: |
    cd tools
    ./miyabi-narrate.sh -d 1 -s -t -v
    #                    ^^^ Change days here
```

**Parameters**:
- `-d N`: Past N days of commits (default: 3)
- `-s`: Auto-start VOICEVOX Engine
- `-t`: Generate thumbnail
- `-v`: Generate video (MP4)
- `-l`: Enable streaming (not used in CI/CD)

---

## Testing & Troubleshooting

### Manual Workflow Trigger

**Trigger via CLI**:
```bash
gh workflow run daily-narration.yml
```

**Trigger via Web UI**:
```
GitHub → Actions → Daily Narration & YouTube Upload → Run workflow
```

### View Logs

**CLI**:
```bash
# List recent runs
gh run list --workflow=daily-narration.yml --limit 5

# View specific run logs
gh run view 1234567890 --log

# Download logs
gh run download 1234567890
```

**Web UI**:
```
GitHub → Actions → Select run → View logs
```

### Common Issues

#### Issue 1: YouTube Upload Failed (401 Unauthorized)

**Symptom**:
```
❌ HTTP Error: 401
   Reason: Invalid Credentials
```

**Cause**: Token expired or invalid

**Solution**:
```bash
# Re-authenticate locally
cd tools
rm token.json
python3 youtube-upload.py --channel-info
# (Browser opens for OAuth)

# Update GitHub secret
gh secret set YOUTUBE_TOKEN < token.json
```

---

#### Issue 2: Workflow Timeout

**Symptom**:
```
❌ The job was canceled because it exceeded the maximum execution time of 30 minutes.
```

**Cause**: VOICEVOX Engine slow to start or video generation taking too long

**Solution**:
```yaml
# Increase timeout
jobs:
  narration:
    timeout-minutes: 60  # Increase from 30 to 60
```

---

#### Issue 3: VOICEVOX Engine Failed to Start

**Symptom**:
```
❌ curl: (7) Failed to connect to 127.0.0.1 port 50021: Connection refused
```

**Cause**: Engine didn't start within 30 seconds

**Solution**:
```yaml
# Increase wait time
- name: Setup VOICEVOX Engine
  run: |
    # ... (engine setup)
    for i in {1..60}; do  # Increase from 30 to 60 attempts
      if curl -s http://127.0.0.1:50021/version > /dev/null; then
        break
      fi
      sleep 2
    done
```

---

#### Issue 4: Discord Notification Failed

**Symptom**:
```
❌ curl: (22) The requested URL returned error: 404 Not Found
```

**Cause**: Invalid webhook URL

**Solution**:
```bash
# Verify webhook URL in Discord
Discord Server → Integrations → Webhooks
Copy correct URL

# Update GitHub secret
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/..."
```

---

## Monitoring & Analytics

### GitHub Actions Dashboard

**View workflow status**:
```
GitHub → Actions → Daily Narration & YouTube Upload
```

**Key Metrics**:
- Success rate (target: 95%+)
- Execution time (target: <15 minutes)
- Failure reasons

### YouTube Analytics

**View video performance**:
```
YouTube Studio → Analytics
```

**Key Metrics**:
- View count
- Watch time
- Average view duration (target: >50% retention)
- Click-through rate (CTR) (target: >5%)

### Discord Notifications

**Success Notification**:
```
✅ Daily Narration Published
Miyabi開発進捗 2025-10-24 が公開されました！

📊 Commits: 15
⏱️ Duration: 02:34
📦 Size: 12.3 MB
🎬 Video: [Watch on YouTube](https://youtu.be/abcdefg)
```

**Failure Notification**:
```
❌ Daily Narration Failed
Miyabi開発進捗の自動生成に失敗しました

Job: narration
Run ID: #123
```

---

## Best Practices

### 1. Token Management

**Refresh Token Expiration**:
- YouTube refresh tokens expire after 6 months of inactivity
- Set calendar reminder to re-authenticate every 5 months
- Automate token refresh in future version

**Security**:
- Never commit `credentials.json` or `token.json` to git
- Add to `.gitignore`
- Use GitHub Secrets for CI/CD

### 2. Error Handling

**Retry Logic**:
```yaml
# Add retry for transient failures
- name: Upload to YouTube
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: |
      python3 youtube-upload.py ...
```

**Graceful Degradation**:
- If thumbnail generation fails, continue with video upload
- If Discord notification fails, don't fail entire workflow

### 3. Cost Optimization

**Reduce GitHub Actions minutes**:
```yaml
# Run only on weekdays (skip weekends)
on:
  schedule:
    - cron: '0 0 * * 1-5'  # Monday-Friday only
```

**YouTube API Quota**:
- Free tier: 10,000 units/day
- Video upload: 1,600 units
- Max uploads: 6 videos/day
- Daily narration: 1 video/day (well within quota)

### 4. Monitoring

**Set up alerts**:
```yaml
# Add to workflow
- name: Send alert if failed 3 days in a row
  if: failure()
  run: |
    # Check failure count
    FAILURES=$(gh run list --workflow=daily-narration.yml --status failure --limit 3 | wc -l)
    if [ $FAILURES -ge 3 ]; then
      # Send critical alert (e.g., PagerDuty, Slack)
      curl -X POST "https://events.pagerduty.com/v2/enqueue" ...
    fi
```

---

## Performance Benchmarks

**Expected Execution Time** (macOS runner):

| Phase | Time | Notes |
|-------|------|-------|
| Setup (Python, dependencies) | 1-2 min | Cached after first run |
| VOICEVOX Engine setup | 2-3 min | Mock mode, no model download |
| Narration generation | 3-5 min | 1 day of commits (~10-20 commits) |
| Video generation | 2-3 min | 1080p H.264 encoding |
| YouTube upload | 1-2 min | ~10MB video |
| **Total** | **10-15 min** | Well within 30-minute timeout |

**Resource Usage**:
- CPU: 2 cores (GitHub Actions standard)
- Memory: 7 GB available
- Storage: 14 GB available
- Network: 5 Mbps+ upload

---

## Future Enhancements

### Phase 13.9: Advanced Automation

**Planned Features**:
1. **Auto-scheduling**: Analyze commit activity and schedule narration only on active days
2. **Multi-language**: Generate English narration for international audience
3. **Analytics dashboard**: Web UI showing video performance trends
4. **Cost tracking**: Monitor GitHub Actions minutes and YouTube API quota
5. **A/B testing**: Experiment with different video titles/thumbnails

---

## Related Documentation

- [YOUTUBE_TWITCH_STREAMING_GUIDE.md](YOUTUBE_TWITCH_STREAMING_GUIDE.md) - Live streaming setup
- [PHASE_13_COMPLETION_REPORT.md](PHASE_13_COMPLETION_REPORT.md) - Phase 13 overview
- [PHASE_13_7_8_ROADMAP.md](PHASE_13_7_8_ROADMAP.md) - Remaining work roadmap
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

## Support

**Issues & Questions**:
- GitHub Issues: https://github.com/ShunsukeHayashi/Miyabi/issues
- Discussions: https://github.com/ShunsukeHayashi/Miyabi/discussions

**Contributing**:
- Pull requests welcome
- Follow [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines

---

**Author**: Claude Code (Autonomous Agent)
**Last Updated**: 2025-10-24
**Phase**: 13.8
**Status**: Production Ready
