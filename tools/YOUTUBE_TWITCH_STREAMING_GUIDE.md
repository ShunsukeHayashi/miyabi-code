# YouTube/Twitch Live Streaming Guide - Miyabi Narration System

**Last Updated**: 2025-10-24
**Phase**: 13.7
**Status**: Production Ready

---

## Overview

This guide provides step-by-step instructions for setting up live streaming of Miyabi AI-generated development progress narration to YouTube Live and Twitch using OBS Studio with Social Stream Ninja integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [YouTube Live Setup](#youtube-live-setup)
3. [Twitch Setup](#twitch-setup-optional)
4. [OBS Streaming Optimization](#obs-streaming-optimization)
5. [Chat Integration](#chat-integration)
6. [Testing & Troubleshooting](#testing--troubleshooting)
7. [Best Practices](#best-practices)

---

## Prerequisites

**Required**:
- ✅ OBS Studio 29.0+ installed ([OBS_SETUP_GUIDE.md](OBS_SETUP_GUIDE.md))
- ✅ BlackHole 2ch audio driver configured ([BLACKHOLE_MANUAL_INSTALL.md](BLACKHOLE_MANUAL_INSTALL.md))
- ✅ Social Stream Ninja integration working ([SOCIAL_STREAM_INTEGRATION.md](SOCIAL_STREAM_INTEGRATION.md))
- ✅ VOICEVOX Engine running
- ✅ Stable internet connection (5+ Mbps upload)

**Recommended**:
- YouTube account with live streaming enabled (1000+ subscribers OR verified account)
- Twitch account (if dual-platform streaming)
- M1/M2/M3 Mac (for hardware encoding)

---

## YouTube Live Setup

### Step 1: Enable Live Streaming

**First-time setup**:
1. Open [YouTube Studio](https://studio.youtube.com)
2. Navigate to: **Settings** → **Channel** → **Feature eligibility**
3. Click **Enable** next to "Live streaming"
4. Complete identity verification if prompted
5. Wait 24 hours for activation (YouTube policy)

**Eligibility Requirements**:
- Channel must have no live stream restrictions
- Either:
  - 1000+ subscribers, OR
  - Phone-verified account

### Step 2: Create Live Event

**Option A: Quick Stream (Recommended for testing)**
```
YouTube Studio → Create → Go Live → Stream
- Title: "Miyabi開発進捗 - ゆっくり解説 LIVE"
- Description: "AI自律開発プロジェクト Miyabi の進捗を、ゆっくり霊夢・魔理沙が解説します！"
- Visibility: Public / Unlisted / Private (choose based on preference)
```

**Option B: Scheduled Stream (Recommended for production)**
```
YouTube Studio → Create → Schedule Stream
- Title: "Miyabi開発進捗 - ゆっくり解説 LIVE"
- Description: "AI自律開発プロジェクト Miyabi の進捗を、ゆっくり霊夢・魔理沙が解説します！

  タイムスタンプ:
  00:00 - オープニング
  01:00 - 今週の開発進捗
  05:00 - コードレビュー
  10:00 - 次週の予定"
- Category: **Science & Technology** (28)
- Tags: Miyabi, AI, 自律開発, ゆっくり解説, プログラミング, GitHub
- Thumbnail: (upload custom thumbnail, see Phase 13.4)
- Visibility: Public
- Schedule: Select date & time
- Latency: **Ultra-low latency** (for real-time chat)
```

### Step 3: Get Stream Key

**Locate Stream Key**:
```
YouTube Studio → Go Live → Stream Settings (top right)
- Server URL: rtmp://a.rtmp.youtube.com/live2
- Stream Key: xxxx-xxxx-xxxx-xxxx (keep secret!)
```

**Security**:
- 🚨 **NEVER share your Stream Key publicly**
- Regenerate if compromised: Click "Reset" → Confirm
- Use GitHub Secrets for CI/CD automation

### Step 4: Configure OBS

**Add YouTube as streaming service**:
```
OBS Studio → Settings → Stream
- Service: YouTube - RTMPS
- Server: Primary YouTube ingest server
- Stream Key: (paste from YouTube Studio)
- Click "Apply"
```

**Test connection**:
```
OBS Studio → Start Streaming (bottom right)
- Check YouTube Studio for "Live" indicator (green dot)
- Preview stream: YouTube Studio → Stream → Live preview
- Verify video/audio quality
- Stop streaming (short test recommended)
```

---

## Twitch Setup (Optional)

### Step 1: Get Stream Key

**Locate Stream Key**:
```
Twitch Dashboard → Settings → Stream
- Stream Key: live_12345678_abcdefghijklmnopqrstuvwx (keep secret!)
- Primary Ingest Server: (select closest location)
```

**Recommended Servers** (Japan):
- `rtmp://live-tyo.twitch.tv/app/` (Tokyo)
- `rtmp://live-sin.twitch.tv/app/` (Singapore)

### Step 2: Configure OBS for Twitch

**Single-platform mode** (YouTube OR Twitch):
```
OBS Studio → Settings → Stream
- Service: Twitch
- Server: Asia: Tokyo, Japan (recommended)
- Stream Key: (paste from Twitch)
- Click "Apply"
```

**Dual-platform mode** (YouTube AND Twitch):
```
# Option 1: Use OBS Multistream Plugin
brew install obs-websocket
# Install "Multiple RTMP Output" plugin from OBS website

# Option 2: Use external service (e.g., Restream.io)
# - Sign up for Restream.io
# - Add YouTube and Twitch as destinations
# - Use Restream RTMP server in OBS
```

---

## OBS Streaming Optimization

### Video Settings

```
OBS Studio → Settings → Video
- Base (Canvas) Resolution: 1920x1080
- Output (Scaled) Resolution: 1920x1080
- Downscale Filter: Lanczos (Sharpened scaling, 36 samples)
- FPS: 30 (common for streaming)
```

**Why 1080p30?**
- Standard for YouTube/Twitch streaming
- Lower bandwidth than 60fps (4500kbps vs 6000kbps)
- Ideal for narration content (not fast-motion gaming)

### Output Settings

```
OBS Studio → Settings → Output
- Output Mode: Advanced

[Streaming Tab]
- Audio Track: 1
- Encoder:
  - Apple VT H264 Hardware Encoder (M1/M2/M3 Mac) ✅ Recommended
  - OR x264 (software, better quality but 40-60% CPU)
- Rate Control: CBR (Constant Bitrate)
- Bitrate: 4500 kbps (1080p30 recommended)
- Keyframe Interval: 2 seconds (YouTube/Twitch requirement)
- Profile: high
- Tune: (none for Apple VT, "zerolatency" for x264)

[Recording Tab] (optional, for local backup)
- Type: Standard
- Recording Path: ~/Movies/OBS/
- Recording Format: mp4
- Encoder: Apple VT H264 Hardware Encoder
- Audio Track: 1
```

**Bitrate Recommendations**:
| Resolution | FPS | Bitrate | Use Case |
|-----------|-----|---------|----------|
| 1920x1080 | 30 | 4500 kbps | Default (narration) |
| 1920x1080 | 60 | 6000 kbps | Gaming/fast-motion |
| 1280x720 | 30 | 3000 kbps | Low bandwidth |

### Audio Settings

```
OBS Studio → Settings → Audio
- Sample Rate: 48 kHz (streaming standard)
- Channels: Stereo

Audio Devices:
- Mic/Auxiliary Audio 1: BlackHole 2ch (VOICEVOX output)
- Mic/Auxiliary Audio 2: (none)
- Desktop Audio: (none, we use BlackHole for routing)
```

**Audio Output Settings**:
```
OBS Studio → Settings → Output → Audio
- Audio Bitrate: 160 kbps (AAC)
- Encoder: CoreAudio AAC (macOS native)
```

### Advanced Settings

```
OBS Studio → Settings → Advanced
- Process Priority: High (ensures OBS gets CPU resources)
- Renderer: Metal (macOS native, best performance)
- Color Format: NV12
- Color Space: 709 (Rec. 709)
- Color Range: Partial (16-235)
```

---

## Chat Integration

### Social Stream Ninja Setup

**Configure OBS Browser Source**:
```
OBS Studio → Sources → Add (+) → Browser
- Name: "Social Stream Ninja - Chat Overlay"
- URL: https://socialstream.ninja/dock.html?session={YOUR_SESSION_ID}&channel=1
- Width: 1920
- Height: 1080
- FPS: 30
- ✅ Shutdown source when not visible
- ✅ Refresh browser when scene becomes active
```

**Get Session ID**:
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools
./miyabi-narrate.sh -l

# Output:
# 📺 OBS Browser Source URL:
#    https://socialstream.ninja/dock.html?session=miyabi-narrate-1761208340&channel=1
```

**Custom CSS** (optional, for branding):
```
OBS Studio → Sources → Browser → Custom CSS
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: "Hiragino Sans", "Meiryo", sans-serif;
}

.chat-message {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  margin: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.chatname {
  font-weight: bold;
  color: #667eea;
}
```

---

## Testing & Troubleshooting

### Full Workflow Test

**Test 1: Local Preview (No Streaming)**
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools

# 1. Start VOICEVOX Engine
cd ~/dev/voicevox_engine
uv run run.py --enable_mock &

# 2. Open OBS (do NOT start streaming)
open -a "OBS"

# 3. Run miyabi-narrate.sh with streaming
cd /Users/shunsuke/Dev/miyabi-private/tools
./miyabi-narrate.sh -d 1 -s -t -v -l

# 4. Check OBS preview
# - Verify video/audio playback
# - Verify chat messages appear in Browser Source
# - Check CPU usage (Activity Monitor)
```

**Expected Result**:
- ✅ Video plays smoothly in OBS preview
- ✅ Audio clear, no clipping
- ✅ Chat messages appear in real-time
- ✅ CPU usage <30% (M1/M2/M3 with hardware encoding)

---

**Test 2: YouTube Live Test (Short Stream)**
```bash
# 1. Open OBS Studio
open -a "OBS"

# 2. Start streaming
# OBS Studio → Start Streaming (bottom right)

# 3. Verify in YouTube Studio
# - Check "Live" indicator (green dot)
# - Open live stream URL in browser
# - Check video/audio quality
# - Test chat (post test message)

# 4. Run miyabi-narrate.sh
cd /Users/shunsuke/Dev/miyabi-private/tools
./miyabi-narrate.sh -d 1 -s -l

# 5. Verify chat integration
# - Post comment in YouTube Live chat
# - Check if comment appears in OBS Browser Source (3-10s delay)

# 6. Stop streaming (short test)
# OBS Studio → Stop Streaming
```

**Expected Result**:
- ✅ Stream appears on YouTube
- ✅ Video quality: 1080p30, no buffering
- ✅ Audio quality: Clear, synchronized
- ✅ Chat integration: Viewer comments appear in OBS
- ✅ Latency: <10 seconds

---

### Common Issues & Solutions

#### Issue 1: Dropped Frames

**Symptoms**:
- OBS shows "Dropped frames: 5.2% (1234/23456)"
- Stream stutters or freezes

**Solutions**:
```
# Solution A: Lower bitrate
OBS Studio → Settings → Output → Streaming
- Bitrate: 4500 → 3000 kbps

# Solution B: Lower resolution
OBS Studio → Settings → Video
- Output Resolution: 1920x1080 → 1280x720

# Solution C: Use hardware encoding
OBS Studio → Settings → Output → Streaming
- Encoder: x264 → Apple VT H264 Hardware Encoder

# Solution D: Check network bandwidth
speedtest-cli  # Install: pip3 install speedtest-cli
# Upload should be 5+ Mbps for 1080p30
```

---

#### Issue 2: Audio Desync

**Symptoms**:
- Audio lags behind video (or vice versa)
- VOICEVOX narration out of sync with visuals

**Solutions**:
```
# Solution A: Add audio delay
OBS Studio → Settings → Audio → Advanced
- Mic/Auxiliary Audio 1 (BlackHole 2ch)
- Sync Offset: +200ms (adjust as needed)

# Solution B: Check VOICEVOX latency
curl http://127.0.0.1:50021/version
# If slow response, restart VOICEVOX Engine

# Solution C: Restart Multi-Output Device
# Audio MIDI Setup → Select "VOICEVOX Output"
# Right-click → Use This Device For Sound Output
```

---

#### Issue 3: Chat Not Appearing

**Symptoms**:
- OBS Browser Source shows blank screen
- Social Stream Ninja connection fails

**Solutions**:
```
# Solution A: Verify session ID
cat .miyabi-stream-session
# Expected: {"session_id": "miyabi-narrate-1761208340", ...}

# Solution B: Refresh Browser Source
OBS Studio → Sources → "Social Stream Ninja" → Right-click
- Select "Refresh"

# Solution C: Check WebSocket connection
python3 social-stream-client.py --info
# Expected: "Status: Connected"

# Solution D: Restart streaming session
python3 social-stream-client.py --stop
./miyabi-narrate.sh -l  # Restart session
```

---

#### Issue 4: High CPU Usage

**Symptoms**:
- CPU usage >80% during streaming
- Mac fans running at high speed
- System slow/unresponsive

**Solutions**:
```
# Check current CPU usage
top -pid $(pgrep obs)

# Solution A: Use hardware encoding (M1/M2/M3 only)
OBS Studio → Settings → Output → Streaming
- Encoder: Apple VT H264 Hardware Encoder
- Expected CPU: 10-20% (down from 40-60%)

# Solution B: Lower preset (if using x264)
OBS Studio → Settings → Output → Streaming
- CPU Usage Preset: veryfast (lower quality but faster)

# Solution C: Close other applications
# - Quit Slack, Discord, browsers
# - Disable Spotlight indexing during streaming
```

---

## Best Practices

### Stream Titles & Descriptions

**Effective Titles**:
```
✅ Good:
- "Miyabi開発進捗 2025-10-24 - Rust自律型Agent実装"
- "ゆっくり解説: AI自律開発システムの実装方法"

❌ Avoid:
- "test"
- "Stream #42"
```

**SEO-Optimized Descriptions**:
```markdown
AI自律開発プロジェクト「Miyabi」の開発進捗をゆっくり霊夢・魔理沙が解説します！

📅 配信日: 2025-10-24
🔧 今日のテーマ: Rust自律型Agent実装

タイムスタンプ:
00:00 - オープニング
01:00 - 今週のコミット履歴レビュー (62 commits)
05:00 - CoordinatorAgent 実装解説
10:00 - 次週の開発予定

🔗 リンク:
- GitHub: https://github.com/ShunsukeHayashi/Miyabi
- ドキュメント: https://shunsukehayashi.github.io/Miyabi/
- Twitter: @YourTwitterHandle

#Miyabi #AI #自律開発 #Rust #ゆっくり解説 #プログラミング
```

### Scheduling Regular Streams

**Consistency is key**:
- Stream at same time/day each week (e.g., Every Wednesday 20:00 JST)
- Announce schedule in community tab/Twitter
- Use YouTube's "Schedule Stream" feature

**Automation with GitHub Actions**:
```yaml
# .github/workflows/weekly-stream-reminder.yml
on:
  schedule:
    - cron: '0 9 * * 3'  # Every Wednesday 9:00 AM UTC (18:00 JST)

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Send Discord notification
        run: |
          curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -d '{
              "content": "📡 Tonight 20:00 JST: Miyabi開発進捗 Live Stream!"
            }'
```

### Interacting with Viewers

**Engagement Tips**:
1. **Respond to chat**: Acknowledge viewer comments during stream
2. **Q&A sessions**: Reserve 5-10 minutes for questions
3. **Polls**: Use YouTube polls for decision-making (e.g., "Which feature next?")
4. **Community posts**: Share highlights/clips after stream

**Social Stream Ninja Features**:
- Display viewer names in OBS overlay
- Highlight super chats / donations
- Filter profanity automatically

### Analytics & Insights

**Track Performance**:
```
YouTube Studio → Analytics
- Key metrics:
  - Average view duration (target: >50% retention)
  - Click-through rate (CTR) (target: >5%)
  - Concurrent viewers (growth indicator)
  - Chat activity (engagement indicator)
```

**Optimization**:
- High CTR but low retention: Improve content pacing
- Low CTR: Improve thumbnail/title
- High retention: Create similar content

---

## Performance Benchmarks

**Expected Metrics** (1080p30, 4500kbps):

| Metric | Target | Notes |
|--------|--------|-------|
| CPU Usage | 10-20% | M1/M2/M3 hardware encoding |
| Memory Usage | 500MB-1GB | OBS + Browser Source |
| Upload Bandwidth | 5 Mbps | Stable connection |
| Dropped Frames | <1% | Network/CPU indicator |
| Stream Latency | 3-10s | Ultra-low latency mode |
| Audio Sync | ±50ms | Imperceptible to viewers |

---

## Next Steps

### Phase 13.8: CI/CD Automation

After successfully testing live streaming, proceed to:
- Automated daily video generation ([CI_CD_AUTOMATION_GUIDE.md](CI_CD_AUTOMATION_GUIDE.md))
- YouTube video upload via API
- Discord/Slack notifications
- Analytics dashboard

---

## Related Documentation

- [OBS_SETUP_GUIDE.md](OBS_SETUP_GUIDE.md) - OBS Studio installation & configuration
- [BLACKHOLE_MANUAL_INSTALL.md](BLACKHOLE_MANUAL_INSTALL.md) - Audio routing setup
- [SOCIAL_STREAM_INTEGRATION.md](SOCIAL_STREAM_INTEGRATION.md) - WebSocket API details
- [PHASE_13_COMPLETION_REPORT.md](PHASE_13_COMPLETION_REPORT.md) - Phase 13 overview
- [PHASE_13_7_8_ROADMAP.md](PHASE_13_7_8_ROADMAP.md) - Remaining work roadmap

---

**Author**: Claude Code (Autonomous Agent)
**Last Updated**: 2025-10-24
**Phase**: 13.7
**Status**: Production Ready
