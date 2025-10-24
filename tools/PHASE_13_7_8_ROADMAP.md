# Phase 13.7-13.8 Roadmap - YouTube/Twitch Live Streaming & CI/CD Automation

**Issue**: #490
**Status**: Pending (未着手)
**Estimated Effort**: 6-9 hours total
**Priority**: P1-High (Phase 13.7), P2-Medium (Phase 13.8)

---

## Overview

This roadmap outlines the remaining 15% of Phase 13: Social Stream Ninja Integration, focusing on:
- **Phase 13.7**: YouTube/Twitch live streaming configuration
- **Phase 13.8**: CI/CD automation for daily narration publishing

---

## Phase 13.7: YouTube/Twitch Live Streaming Setup

**Estimated Time**: 2-3 hours
**Priority**: P1-High
**Difficulty**: Medium
**Dependencies**: Phase 13.1-13.6 complete (✅ Done)

---

### Objectives

1. Configure YouTube Live streaming
2. Configure Twitch streaming (optional)
3. Optimize OBS output settings
4. Test end-to-end workflow
5. Document platform-specific settings

---

### Task Breakdown

#### Task 13.7.1: YouTube Live Configuration (30 minutes)

**Steps**:

1. **Create YouTube Live Event**
   ```
   YouTube Studio → Create → Go Live
   - Stream Type: "Streaming Software"
   - Title: "Miyabi開発進捗 - ゆっくり解説 LIVE"
   - Description: "AI自律開発プロジェクト Miyabi の進捗を、ゆっくり霊夢・魔理沙が解説します！"
   - Category: Science & Technology
   - Visibility: Public / Unlisted (choose based on preference)
   - Latency: Ultra-low latency
   ```

2. **Get Stream Key**
   ```
   YouTube Studio → Settings → Stream Settings
   - Copy "Stream Key" (keep secret!)
   - Note "Stream URL": rtmp://a.rtmp.youtube.com/live2
   ```

3. **Configure OBS Output**
   ```
   OBS Studio → Settings → Stream
   - Service: YouTube - RTMPS
   - Server: Primary YouTube ingest server
   - Stream Key: (paste from YouTube Studio)
   - Click "Apply"
   ```

4. **Verify Connection**
   ```
   OBS Studio → Start Streaming (test mode)
   - Check YouTube Studio for "Live" indicator
   - Verify preview in YouTube Studio dashboard
   - Stop streaming after confirmation
   ```

**Success Criteria**:
- ✅ Stream Key configured in OBS
- ✅ Test stream appears in YouTube Studio
- ✅ No connection errors in OBS logs

**Deliverable**: YouTube Stream Key (stored in GitHub Secrets)

---

#### Task 13.7.2: OBS Streaming Optimization (60 minutes)

**Objective**: Optimize video/audio quality for live streaming

**Video Settings**:
```
OBS Studio → Settings → Video
- Base (Canvas) Resolution: 1920x1080
- Output (Scaled) Resolution: 1920x1080
- Downscale Filter: Lanczos (best quality)
- FPS: 30 (common for streaming)
```

**Output Settings**:
```
OBS Studio → Settings → Output
- Output Mode: Advanced

[Streaming Tab]
- Encoder:
  - Apple VT H264 Hardware Encoder (M1/M2/M3 Mac)
  - OR x264 (software, better quality but higher CPU)
- Rate Control: CBR (Constant Bitrate)
- Bitrate: 4500 kbps (1080p30 recommended)
- Keyframe Interval: 2 seconds
- Profile: high
- Tune: (none)

[Recording Tab] (optional, for local backup)
- Encoder: Apple VT H264 Hardware Encoder
- Recording Format: mp4
- Recording Quality: Same as stream
```

**Audio Settings**:
```
OBS Studio → Settings → Audio
- Sample Rate: 48 kHz
- Channels: Stereo

OBS Studio → Settings → Output → Audio
- Audio Bitrate: 160 kbps (AAC)
- Encoder: CoreAudio AAC (macOS native)
```

**Advanced Settings**:
```
OBS Studio → Settings → Advanced
- Process Priority: High
- Renderer: Metal (macOS native)
- Color Format: NV12
- Color Space: 709
- Color Range: Partial (16-235)
```

**Performance Tuning**:
```bash
# Check CPU usage during streaming
top -pid $(pgrep obs)

# Expected CPU usage:
# - M1/M2/M3 (hardware encoding): 10-20%
# - Intel (software encoding): 40-60%

# If CPU usage is high:
# 1. Lower bitrate: 4500 → 3000 kbps
# 2. Lower resolution: 1080p → 720p
# 3. Use hardware encoder if available
```

**Success Criteria**:
- ✅ 1080p30 stream with no dropped frames
- ✅ Audio clear with no clipping
- ✅ CPU usage <30% during streaming
- ✅ Local recording works simultaneously

**Deliverable**: OBS profile export file (`miyabi-streaming-profile.json`)

---

#### Task 13.7.3: Twitch Configuration (30 minutes, Optional)

**Steps**:

1. **Get Twitch Stream Key**
   ```
   Twitch Dashboard → Settings → Stream
   - Copy "Primary Stream Key"
   - Note "Ingest Server": (select closest location)
   ```

2. **Configure OBS for Dual-Platform** (Advanced)
   ```
   # Option 1: Single platform (simpler)
   OBS Studio → Settings → Stream
   - Service: Twitch
   - Server: (select closest)
   - Stream Key: (paste from Twitch)

   # Option 2: Dual-platform (requires plugin)
   # Install "Multiple Output Plugin" for OBS
   # Configure two outputs: YouTube + Twitch
   ```

3. **Test Twitch Stream**
   ```
   OBS Studio → Start Streaming
   - Check Twitch Dashboard for "Live" indicator
   - Verify preview in Twitch Dashboard
   - Stop streaming after confirmation
   ```

**Success Criteria**:
- ✅ Twitch stream key configured
- ✅ Test stream appears on Twitch
- ✅ No connection errors

**Note**: Dual-platform streaming requires higher bitrate (6000+ kbps) and powerful hardware.

---

#### Task 13.7.4: Integration Testing (60 minutes)

**Test Cases**:

**Test 1: Full Workflow - YouTube**
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools

# 1. Start VOICEVOX Engine
cd ~/dev/voicevox_engine
uv run run.py --enable_mock &

# 2. Start OBS streaming
open -a "OBS"
# Manually click "Start Streaming"

# 3. Run miyabi-narrate.sh with streaming
cd /Users/shunsuke/Dev/miyabi-private/tools
./miyabi-narrate.sh -d 1 -s -t -v -l

# 4. Verify in YouTube Studio
# - Check "Live" indicator
# - Verify chat messages appear in OBS Browser Source
# - Check stream quality (1080p30, no buffering)

# 5. Stop streaming
# OBS Studio → Stop Streaming
```

**Expected Result**:
- ✅ Git commits → Script → Audio → Video → Streaming (全フロー成功)
- ✅ Chat messages visible in OBS overlay
- ✅ Stream quality stable (no dropped frames)
- ✅ Audio quality clear (no clipping or distortion)

---

**Test 2: Viewer Chat Integration**
```bash
# 1. Open YouTube Live stream in browser
# 2. Post test comment in live chat
# 3. Verify comment appears in OBS Browser Source (Social Stream Ninja)
# 4. Check latency (expected: 3-10 seconds)
```

**Expected Result**:
- ✅ Viewer comments appear in OBS overlay
- ✅ Latency <10 seconds
- ✅ Emoji and formatting preserved

---

**Test 3: Recording & Archive**
```bash
# 1. Enable recording in OBS
# OBS Studio → Settings → Output → Recording → Enable

# 2. Start streaming + recording
# OBS Studio → Start Streaming + Start Recording

# 3. Run workflow
./miyabi-narrate.sh -d 1 -s -l

# 4. Stop streaming + recording
# OBS Studio → Stop Streaming + Stop Recording

# 5. Verify local recording
ls ~/Movies/OBS/
# Expected: miyabi-narrate-YYYY-MM-DD-HH-MM-SS.mp4
```

**Expected Result**:
- ✅ Local recording created
- ✅ File size reasonable (1080p30: ~100MB/10min)
- ✅ Playback smooth (no dropped frames)

---

**Test 4: Error Handling**
```bash
# Test 1: Network disconnection
# - Start streaming
# - Disconnect Wi-Fi
# - Verify OBS auto-reconnects
# - Check stream continuity

# Test 2: VOICEVOX Engine crash
# - Kill VOICEVOX Engine mid-stream
# - Verify miyabi-narrate.sh fails gracefully
# - Verify streaming continues (no audio)

# Test 3: Social Stream Ninja timeout
# - Block wss://io.socialstream.ninja
# - Verify miyabi-narrate.sh continues without streaming
```

**Expected Result**:
- ✅ Network disconnection: Auto-reconnect within 30s
- ✅ VOICEVOX crash: Graceful error message
- ✅ WebSocket timeout: Workflow continues (no streaming)

---

#### Task 13.7.5: Documentation (60 minutes)

**Create**: `tools/YOUTUBE_TWITCH_STREAMING_GUIDE.md` (~10KB)

**Structure**:
```markdown
# YouTube/Twitch Live Streaming Guide

## Overview
- Platform comparison (YouTube vs Twitch)
- Use cases for each platform
- Requirements & prerequisites

## YouTube Live Setup
- Create Live Event
- Get Stream Key
- Configure OBS
- Test streaming
- Troubleshooting

## Twitch Setup (Optional)
- Get Stream Key
- Configure OBS
- Test streaming
- Troubleshooting

## OBS Optimization
- Video settings (resolution, FPS, bitrate)
- Audio settings (sample rate, bitrate)
- Performance tuning (CPU usage, dropped frames)
- Advanced settings (encoder, color space)

## Chat Integration
- Social Stream Ninja setup
- OBS Browser Source configuration
- Custom CSS styling
- Troubleshooting

## Best Practices
- Stream titles and descriptions
- Scheduling regular streams
- Interacting with viewers
- Analytics and insights

## Troubleshooting
- Dropped frames
- Audio desync
- Buffering issues
- Connection errors
```

**Deliverable**: `YOUTUBE_TWITCH_STREAMING_GUIDE.md` (completed)

---

### Phase 13.7 Success Criteria

**Technical**:
- ✅ YouTube Live streaming works end-to-end
- ✅ OBS settings optimized (1080p30, 4500kbps, <3% dropped frames)
- ✅ Chat integration works (viewer comments visible in OBS)
- ✅ Recording works simultaneously

**Quality**:
- ✅ Video quality meets standards (sharp, no artifacts)
- ✅ Audio quality clear (no clipping, balanced levels)
- ✅ Stream stability >99% (minimal disconnections)

**Documentation**:
- ✅ YouTube/Twitch setup guide complete
- ✅ OBS settings documented
- ✅ Troubleshooting guide complete

---

## Phase 13.8: CI/CD Automation

**Estimated Time**: 4-6 hours
**Priority**: P2-Medium
**Difficulty**: Medium-High
**Dependencies**: Phase 13.7 complete

---

### Objectives

1. Automate daily narration generation
2. Automate YouTube video upload
3. Implement error handling & notifications
4. Set up monitoring & analytics
5. Document CI/CD workflow

---

### Task Breakdown

#### Task 13.8.1: GitHub Actions Workflow (2 hours)

**Objective**: Automate daily execution of miyabi-narrate.sh

**Create**: `.github/workflows/daily-narration.yml`

```yaml
name: Daily Narration & YouTube Upload

on:
  schedule:
    # Run daily at 9:00 AM JST (00:00 UTC)
    - cron: '0 0 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  narration:
    runs-on: macos-latest
    timeout-minutes: 30

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install websocket-client requests pillow numpy
          brew install ffmpeg imagemagick

      - name: Setup VOICEVOX Engine (Mock Mode)
        run: |
          git clone https://github.com/VOICEVOX/voicevox_engine.git ~/voicevox_engine
          cd ~/voicevox_engine
          curl -LsSf https://astral.sh/uv/install.sh | sh
          export PATH="$HOME/.local/bin:$PATH"
          uv sync
          uv run run.py --enable_mock --host 127.0.0.1 --port 50021 &
          sleep 10 # Wait for engine startup

      - name: Generate narration
        id: narration
        run: |
          cd tools
          ./miyabi-narrate.sh -d 1 -s -t -v
          echo "video_path=./tools/output/miyabi-progress.mp4" >> $GITHUB_OUTPUT
          echo "thumbnail_path=./tools/output/thumbnail.png" >> $GITHUB_OUTPUT

      - name: Upload to YouTube
        id: youtube
        uses: actions/upload-artifact@v4
        with:
          name: narration-video
          path: |
            ${{ steps.narration.outputs.video_path }}
            ${{ steps.narration.outputs.thumbnail_path }}

      - name: Publish to YouTube (via API)
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
          YOUTUBE_CHANNEL_ID: ${{ secrets.YOUTUBE_CHANNEL_ID }}
        run: |
          python3 tools/youtube-upload.py \
            --file "${{ steps.narration.outputs.video_path }}" \
            --title "Miyabi開発進捗 $(date +%Y-%m-%d)" \
            --description "AI自律開発プロジェクト Miyabi の進捗報告" \
            --category 28 \
            --thumbnail "${{ steps.narration.outputs.thumbnail_path }}" \
            --privacy public

      - name: Send Discord notification (Success)
        if: success()
        env:
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: |
          curl -X POST "$DISCORD_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
              "content": "✅ Daily narration published successfully!",
              "embeds": [{
                "title": "Miyabi開発進捗 $(date +%Y-%m-%d)",
                "url": "${{ steps.youtube.outputs.video_url }}",
                "color": 5814783,
                "fields": [
                  {"name": "Duration", "value": "${{ steps.narration.outputs.duration }}"},
                  {"name": "Commits", "value": "${{ steps.narration.outputs.commit_count }}"}
                ]
              }]
            }'

      - name: Send Discord notification (Failure)
        if: failure()
        env:
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: |
          curl -X POST "$DISCORD_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d '{
              "content": "❌ Daily narration failed!",
              "embeds": [{
                "title": "Workflow Failure",
                "color": 15158332,
                "fields": [
                  {"name": "Job", "value": "${{ github.job }}"},
                  {"name": "Run ID", "value": "${{ github.run_id }}"}
                ]
              }]
            }'
```

**Success Criteria**:
- ✅ Workflow triggers daily at 9:00 AM JST
- ✅ Manual trigger works (`workflow_dispatch`)
- ✅ All steps execute successfully
- ✅ Video uploaded to YouTube automatically

---

#### Task 13.8.2: YouTube Upload Script (1 hour)

**Create**: `tools/youtube-upload.py`

```python
#!/usr/bin/env python3
"""
youtube-upload.py - Automated YouTube video upload via API v3
"""

import argparse
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

def upload_video(file_path, title, description, category, thumbnail, privacy):
    """Upload video to YouTube"""

    # Authenticate
    creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/youtube.upload'])
    youtube = build('youtube', 'v3', credentials=creds)

    # Video metadata
    body = {
        'snippet': {
            'title': title,
            'description': description,
            'categoryId': category,
            'tags': ['Miyabi', 'AI', '自律開発', 'ゆっくり解説']
        },
        'status': {
            'privacyStatus': privacy,
            'selfDeclaredMadeForKids': False
        }
    }

    # Upload video
    media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(
        part='snippet,status',
        body=body,
        media_body=media
    )

    response = request.execute()
    video_id = response['id']

    # Upload thumbnail
    if thumbnail and os.path.exists(thumbnail):
        youtube.thumbnails().set(
            videoId=video_id,
            media_body=MediaFileUpload(thumbnail)
        ).execute()

    print(f"✅ Video uploaded: https://youtu.be/{video_id}")
    return video_id

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Upload video to YouTube')
    parser.add_argument('--file', required=True, help='Video file path')
    parser.add_argument('--title', required=True, help='Video title')
    parser.add_argument('--description', default='', help='Video description')
    parser.add_argument('--category', default='28', help='Category ID (28=Science & Technology)')
    parser.add_argument('--thumbnail', help='Thumbnail image path')
    parser.add_argument('--privacy', default='public', choices=['public', 'unlisted', 'private'])

    args = parser.parse_args()
    upload_video(args.file, args.title, args.description, args.category, args.thumbnail, args.privacy)
```

**Success Criteria**:
- ✅ Script authenticates with YouTube API
- ✅ Video uploads successfully
- ✅ Thumbnail uploads successfully
- ✅ Returns video URL

---

#### Task 13.8.3: Secret Management (1 hour)

**GitHub Secrets to Configure**:

```bash
# Add secrets via GitHub UI or CLI
gh secret set YOUTUBE_API_KEY --body "AIza..."
gh secret set YOUTUBE_CHANNEL_ID --body "UCxx..."
gh secret set DISCORD_WEBHOOK_URL --body "https://discord.com/api/webhooks/..."
gh secret set BYTEPLUS_ACCESS_KEY --body "..."
gh secret set BYTEPLUS_SECRET_KEY --body "..."
```

**Secret Rotation Policy**:
- API keys: Rotate every 90 days
- Webhook URLs: Regenerate if compromised
- OAuth tokens: Refresh automatically (expires 7 days)

**Access Control**:
- Secrets only accessible to GitHub Actions
- Use environment scopes for production vs development
- Audit secret usage in Actions logs

---

#### Task 13.8.4: Monitoring & Analytics (2 hours)

**Metrics to Track**:

1. **Execution Metrics**
   - Workflow success rate
   - Execution time (per phase)
   - Error frequency by type

2. **Video Metrics** (via YouTube Analytics API)
   - View count
   - Watch time
   - Audience retention
   - Click-through rate (CTR)

3. **System Metrics**
   - CPU usage during execution
   - Memory usage
   - Network bandwidth

**Create**: `tools/analytics-dashboard.py`

```python
#!/usr/bin/env python3
"""
analytics-dashboard.py - Aggregate metrics from GitHub Actions and YouTube
"""

import json
import requests
from datetime import datetime, timedelta

def fetch_github_actions_metrics():
    """Fetch workflow execution metrics"""
    # GitHub API: List workflow runs
    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{WORKFLOW_ID}/runs"
    response = requests.get(url, headers={'Authorization': f'token {GITHUB_TOKEN}'})

    runs = response.json()['workflow_runs']
    success_count = sum(1 for r in runs if r['conclusion'] == 'success')
    total_count = len(runs)

    return {
        'success_rate': success_count / total_count * 100,
        'total_runs': total_count,
        'avg_duration': sum(r['run_duration_ms'] for r in runs) / total_count / 1000
    }

def fetch_youtube_analytics():
    """Fetch video performance metrics"""
    # YouTube Analytics API: Get video statistics
    # ... (implementation)
    pass

if __name__ == '__main__':
    github_metrics = fetch_github_actions_metrics()
    youtube_metrics = fetch_youtube_analytics()

    print(json.dumps({
        'github': github_metrics,
        'youtube': youtube_metrics
    }, indent=2))
```

**Deliverable**: Weekly metrics report (automated)

---

### Phase 13.8 Success Criteria

**Technical**:
- ✅ GitHub Actions workflow executes daily
- ✅ 95%+ success rate over 30 days
- ✅ YouTube videos upload automatically
- ✅ Error notifications sent to Discord

**Quality**:
- ✅ Execution time <10 minutes (average)
- ✅ Zero manual intervention required
- ✅ Comprehensive error logs

**Documentation**:
- ✅ CI/CD setup guide complete
- ✅ Troubleshooting guide complete
- ✅ Monitoring dashboard accessible

---

## Timeline & Milestones

### Week 1: Phase 13.7 (2-3 hours)

**Day 1** (1 hour):
- ✅ Task 13.7.1: YouTube Live configuration
- ✅ Task 13.7.2: OBS optimization (partial)

**Day 2** (1 hour):
- ✅ Task 13.7.2: OBS optimization (complete)
- ✅ Task 13.7.4: Integration testing (partial)

**Day 3** (1 hour):
- ✅ Task 13.7.4: Integration testing (complete)
- ✅ Task 13.7.5: Documentation

---

### Week 2: Phase 13.8 (4-6 hours)

**Day 1** (2 hours):
- ✅ Task 13.8.1: GitHub Actions workflow
- ✅ Task 13.8.2: YouTube upload script

**Day 2** (2 hours):
- ✅ Task 13.8.3: Secret management
- ✅ Task 13.8.4: Monitoring & analytics (partial)

**Day 3** (2 hours):
- ✅ Task 13.8.4: Monitoring & analytics (complete)
- ✅ Integration testing & documentation

---

## Risk Assessment

### High Risks 🔴

1. **YouTube API Quota Limits**
   - **Impact**: Daily upload may fail if quota exceeded
   - **Mitigation**: Monitor quota usage, implement retry with exponential backoff
   - **Fallback**: Manual upload with notification

2. **OAuth Token Expiration**
   - **Impact**: Automated upload fails after 7 days
   - **Mitigation**: Implement automatic token refresh
   - **Fallback**: Manual re-authentication with alert

3. **Network Instability in GitHub Actions**
   - **Impact**: Video upload may timeout
   - **Mitigation**: Implement chunked upload with resume capability
   - **Fallback**: Retry up to 3 times, then notify

### Medium Risks 🟡

4. **VOICEVOX Engine Instability in CI**
   - **Impact**: Audio generation may fail randomly
   - **Mitigation**: Use mock mode, add health check before execution
   - **Fallback**: Retry once, then fail gracefully with notification

5. **OBS Automation Complexity**
   - **Impact**: Live streaming cannot be fully automated (OBS requires GUI)
   - **Mitigation**: Focus on video generation + upload, manual streaming
   - **Acceptance**: Phase 13.7 is semi-automated (OBS manual)

---

## Success Metrics

### Phase 13.7

| Metric | Target | Measurement |
|--------|--------|-------------|
| Stream uptime | 99%+ | YouTube Analytics |
| Dropped frames | <3% | OBS stats |
| Audio quality | Clear, no clipping | Manual review |
| Chat latency | <10s | Manual testing |

### Phase 13.8

| Metric | Target | Measurement |
|--------|--------|-------------|
| Workflow success rate | 95%+ | GitHub Actions logs |
| Execution time | <10min | GitHub Actions duration |
| YouTube upload success | 100% | API response |
| Error notification latency | <1min | Discord timestamp |

---

## Documentation Deliverables

### Phase 13.7
- `YOUTUBE_TWITCH_STREAMING_GUIDE.md` (~10KB)

### Phase 13.8
- `CI_CD_AUTOMATION_GUIDE.md` (~8KB)
- `.github/workflows/daily-narration.yml` (GitHub Actions workflow)
- `tools/youtube-upload.py` (YouTube upload script)
- `tools/analytics-dashboard.py` (Metrics aggregation)

---

## Next Steps (Immediate Actions)

### For Phase 13.7
1. Create YouTube Live event
2. Configure OBS stream settings
3. Test full workflow with live streaming
4. Document YouTube/Twitch setup

### For Phase 13.8
1. Enable YouTube Data API v3
2. Create OAuth credentials
3. Write GitHub Actions workflow
4. Test CI/CD pipeline end-to-end

---

## Conclusion

Phase 13.7-13.8 completes the final 15% of Social Stream Ninja integration, enabling:
- **Phase 13.7**: Live streaming to YouTube/Twitch (semi-automated)
- **Phase 13.8**: Daily automated video publishing (fully automated)

**Total Effort**: 6-9 hours over 2 weeks
**Impact**: Enables daily AI-narrated development progress publishing
**Priority**: P1-High (Phase 13.7), P2-Medium (Phase 13.8)

---

**Last Updated**: 2025-10-24
**Author**: Claude Code (Autonomous Agent)
**Issue**: #490
**Status**: Ready for Implementation
