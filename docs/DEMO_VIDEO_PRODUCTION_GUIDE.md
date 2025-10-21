# Demo Video Production Guide - Issue #344

**Created by**: Claude Code (AI Assistant)
**Date**: 2025-10-22
**Status**: Phase 1 Complete → Phase 2-4 Requires Human Execution

---

## 📊 Overview

This guide provides step-by-step instructions for producing the Miyabi demo video.

**Deliverables**:
1. YouTube video (3 minutes)
2. GIF animation (10 seconds) for README.md
3. Asciinema CLI demo recording

**Timeline**:
- Phase 1: Script & Planning (✅ COMPLETE - by AI)
- Phase 2: Recording (2 days - by Human)
- Phase 3: Editing (2 days - by Human)
- Phase 4: Publishing (1 day - by Human)

**Total**: 5 days (excluding Phase 1)

---

## ✅ Phase 1: Complete (AI-Generated Assets)

### Delivered Files

1. **`DEMO_VIDEO_SCRIPT.md`** - Complete 3-minute script
   - Detailed timeline (0:00-3:00)
   - Japanese + English narration
   - Screen transition instructions
   - Visual element specifications

2. **`DEMO_VIDEO_SUBTITLES_JP.srt`** - Japanese subtitles
   - 30 subtitle entries
   - Timing: 5-second intervals
   - SRT format (standard)

3. **`DEMO_VIDEO_SUBTITLES_EN.srt`** - English subtitles
   - 30 subtitle entries
   - Matching timing with Japanese
   - SRT format (standard)

4. **`DEMO_VIDEO_PRODUCTION_GUIDE.md`** - This file
   - Step-by-step instructions
   - Software recommendations
   - Quality checklists

---

## 🎥 Phase 2: Recording (Human Execution Required)

### 2.1 Preparation

#### Software Installation

**Screen Recording**:
- **macOS**: QuickTime Player (built-in) or OBS Studio
  ```bash
  brew install --cask obs
  ```
- **Windows**: OBS Studio
  ```bash
  winget install OBSProject.OBSStudio
  ```

**Audio Recording**:
- **macOS**: GarageBand (built-in) or Audacity
  ```bash
  brew install --cask audacity
  ```
- **Windows**: Audacity
  ```bash
  winget install Audacity.Audacity
  ```

#### Environment Setup

**Terminal Configuration**:
```bash
# Install JetBrains Mono font
brew tap homebrew/cask-fonts
brew install --cask font-jetbrains-mono

# Set terminal theme (Tokyo Night Storm)
# Copy theme from: https://github.com/tokyo-night/tokyo-night-vscode-theme

# Terminal size: 120x40
# Font size: 16px
# Line height: 1.6
```

**GitHub Token**:
```bash
# Create a new token: https://github.com/settings/tokens/new
# Required scopes: repo, read:org, read:project

export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
```

---

### 2.2 Recording Sessions

#### Session 1: Terminal Recording (0:30-1:00, 1:00-2:00)

**Setup**:
1. Open terminal (full screen, 1920x1080)
2. Set theme to Tokyo Night Storm
3. Font: JetBrains Mono, 16px
4. Start OBS Studio recording

**Commands to Execute**:
```bash
# Navigate to project directory
cd /Users/a003/dev/miyabi-private

# Clear terminal
clear

# Show the command
echo "export GITHUB_TOKEN=\"ghp_xxxxxxxxxxxx\""

# Execute Miyabi
miyabi work-on 270

# Let it run for 2 minutes
# Expected output:
# - Coordinator task breakdown
# - CodeGen execution
# - Reviewer quality check
# - PRAgent PR creation
```

**Recording Settings**:
- Resolution: 1920x1080 (Full HD)
- Frame rate: 30fps
- Bitrate: 5000 kbps
- Format: MP4 (H.264)
- Audio: None (terminal only)

**Duration**: Record 2-3 minutes, will be edited down to 90 seconds

**Save As**: `miyabi_terminal_demo_raw.mp4`

---

#### Session 2: GitHub Screen Recording (1:45-2:00, 2:30-2:40)

**Setup**:
1. Open browser (Chrome/Firefox)
2. Navigate to GitHub repository
3. Window size: 1920x1080
4. Start OBS Studio recording (window capture)

**Pages to Record**:
1. **Issue #270** (15 seconds)
   - URL: https://github.com/ShunsukeHayashi/miyabi-private/issues/270
   - Show: Title, description, labels

2. **Pull Request #271** (15 seconds)
   - URL: https://github.com/ShunsukeHayashi/miyabi-private/pulls/271
   - Show: Title, Files changed, Commits

3. **Repository Main Page** (10 seconds)
   - URL: https://github.com/ShunsukeHayashi/Miyabi
   - Show: README, Star button, description

**Recording Settings**:
- Resolution: 1920x1080
- Frame rate: 30fps
- Bitrate: 5000 kbps
- Format: MP4 (H.264)

**Save As**: `miyabi_github_demo_raw.mp4`

---

#### Session 3: Narration Recording

**Setup**:
1. Open Audacity or GarageBand
2. Connect microphone (Blue Yeti / AT2020 recommended)
3. Set sample rate: 48kHz, 24bit
4. Create quiet environment (minimize background noise)

**Recording Process**:

1. **Japanese Narration** (3 minutes)
   - Read from: `DEMO_VIDEO_SCRIPT.md` (Japanese sections)
   - Speak clearly and slowly
   - Pause 1 second between sections
   - Save as: `narration_jp_raw.wav`

2. **English Narration** (3 minutes) - Optional
   - Read from: `DEMO_VIDEO_SCRIPT.md` (English sections)
   - Save as: `narration_en_raw.wav`

**Audio Processing** (in Audacity):
1. Effect → Noise Reduction (2-pass)
2. Effect → Normalize (-3.0 dB)
3. Effect → Compressor (Threshold: -20dB, Ratio: 3:1)
4. Export as: `narration_jp_final.mp3` (320kbps)

---

#### Session 4: BGM Selection

**Free BGM Sources**:
- YouTube Audio Library: https://www.youtube.com/audiolibrary
- Incompetech: https://incompetech.com/music/
- Free Music Archive: https://freemusicarchive.org/

**Criteria**:
- Genre: Electronic / Tech / Upbeat
- Tempo: 120-140 BPM
- Length: 3+ minutes
- License: Royalty-free (Creative Commons)

**Recommended Tracks** (YouTube Audio Library):
1. "Cipher" by Kevin MacLeod
2. "Pixels" by Jeff Kaale
3. "Fluffing a Duck" by Kevin MacLeod

**Save As**: `bgm_final.mp3`

---

## 🎬 Phase 3: Editing (Human Execution Required)

### 3.1 Software Setup

**Video Editing Software**:
- **macOS**: iMovie (free) or DaVinci Resolve (free)
  ```bash
  # iMovie: Pre-installed
  # DaVinci Resolve: Download from https://www.blackmagicdesign.com/
  ```
- **Windows**: DaVinci Resolve (free)
  ```bash
  # Download from https://www.blackmagicdesign.com/
  ```

**GIF Creation**:
- Online: https://ezgif.com/ (no install)
- CLI: ffmpeg
  ```bash
  brew install ffmpeg
  ```

---

### 3.2 Video Editing Timeline

#### Import Assets

1. **Video Clips**:
   - `miyabi_terminal_demo_raw.mp4`
   - `miyabi_github_demo_raw.mp4`

2. **Audio Files**:
   - `narration_jp_final.mp3`
   - `bgm_final.mp3`

3. **Subtitle Files**:
   - `DEMO_VIDEO_SUBTITLES_JP.srt`
   - `DEMO_VIDEO_SUBTITLES_EN.srt` (optional)

4. **Image Assets** (to be created):
   - `title_card.png` (1920x1080) - Intro slide
   - `agent_gallery.png` (1920x1080) - 21 agents overview
   - `end_card.png` (1920x1080) - CTA slide

---

#### Timeline Construction (in iMovie / DaVinci Resolve)

**Track 1 (Video)**:
```
0:00-0:10 → title_card.png (10s)
0:10-0:20 → miyabi_github_demo_raw.mp4 (Issue screen) (10s)
0:20-0:30 → miyabi_github_demo_raw.mp4 (PR screen) (10s)
0:30-1:00 → miyabi_terminal_demo_raw.mp4 (Installation) (30s)
1:00-2:00 → miyabi_terminal_demo_raw.mp4 (Agent execution) (60s)
2:00-2:30 → agent_gallery.png (30s)
2:30-2:40 → miyabi_github_demo_raw.mp4 (Repository) (10s)
2:40-2:50 → miyabi_github_demo_raw.mp4 (README) (10s)
2:50-3:00 → end_card.png (10s)
```

**Track 2 (Audio - Narration)**:
```
0:00-3:00 → narration_jp_final.mp3 (full length)
```

**Track 3 (Audio - BGM)**:
```
0:00-3:00 → bgm_final.mp3 (volume: -20dB, fade in/out)
```

**Track 4 (Subtitles)**:
```
0:00-3:00 → DEMO_VIDEO_SUBTITLES_JP.srt (import as text)
```

---

#### Editing Steps

1. **Trim Clips** (remove unnecessary parts)
   - Terminal recording: Keep only relevant commands and output
   - GitHub recording: Cut loading times

2. **Add Transitions** (between scenes)
   - Crossfade: 0.5 seconds
   - Between terminal and GitHub screens

3. **Adjust Audio Levels**
   - Narration: -3dB (primary)
   - BGM: -20dB (background)
   - Fade in: 0-5 seconds
   - Fade out: 2:55-3:00

4. **Add Subtitles**
   - Import SRT file
   - Font: Noto Sans JP Bold (Japanese)
   - Size: 36px
   - Position: Bottom (10% from edge)
   - Background: Semi-transparent black (80%)

5. **Color Correction** (optional)
   - Brightness: +5%
   - Contrast: +10%
   - Saturation: +5%

---

### 3.3 Create Static Images

#### Title Card (0:00-0:10)

**Content**:
```
【大きく】3分でわかるMiyabi
【中くらい】完全自律型AI開発フレームワーク

Background: Blue-to-purple gradient
Add: Miyabi logo (if available)
```

**Tools**: Canva (https://www.canva.com/) or Figma
**Size**: 1920x1080px
**Save As**: `title_card.png`

---

#### Agent Gallery (2:00-2:30)

**Content**:
```
【タイトル】Miyabi Agent Gallery (21キャラクター)

【左側 - Coding Agents (7個)】
🔴 しきるん (Coordinator)
🟢 つくるん (CodeGen)
🔵 めだまん (Reviewer)
🟡 まとめるん (PRAgent)
🟣 イシュまる (IssueAgent)
🟠 デプろう (DeployAgent)
🔵 フックマン (HookIntegration)

【右側 - Business Agents (14個)】
💼 起業ちゃん (AIEntrepreneur)
📊 データ子 (Analytics)
📝 コンテンツ君 (ContentCreation)
... (and 11 more)
```

**Tools**: Canva or PowerPoint
**Size**: 1920x1080px
**Save As**: `agent_gallery.png`

---

#### End Card (2:50-3:00)

**Content**:
```
【大きく】Star & Fork on GitHub!

【ボタン風デザイン】
🌟 Star on GitHub
👉 github.com/ShunsukeHayashi/Miyabi

【小さく】
📚 Docs | 🚀 Quick Start | 💬 Discord

Background: Same gradient as title card
```

**Tools**: Canva
**Size**: 1920x1080px
**Save As**: `end_card.png`

---

### 3.4 Export Final Video

**Export Settings** (iMovie):
1. File → Share → File
2. Resolution: 1080p (1920x1080)
3. Quality: High (or Best)
4. Format: H.264
5. Frame rate: 30fps

**Export Settings** (DaVinci Resolve):
1. Deliver → YouTube (preset)
2. Resolution: 1920x1080
3. Frame rate: 30fps
4. Codec: H.264
5. Bitrate: 8000 kbps (VBR)

**Save As**: `miyabi_demo_3min_final.mp4`

**File Size**: ~50-100 MB (for 3 minutes at 1080p)

---

### 3.5 Create GIF Animation (README.md)

**Source**: Use first 10 seconds of terminal recording

**Method 1: Online (ezgif.com)**:
1. Upload `miyabi_terminal_demo_raw.mp4`
2. Trim to 0:30-0:40 (10 seconds)
3. Resize to 800x600px
4. Reduce frame rate to 15fps (for smaller file size)
5. Optimize (lossy GIF, compression level: 35)
6. Download as `miyabi_demo.gif`

**Method 2: CLI (ffmpeg)**:
```bash
# Extract 10-second clip
ffmpeg -i miyabi_terminal_demo_raw.mp4 -ss 00:00:30 -t 10 -vf "scale=800:600" temp.mp4

# Convert to GIF
ffmpeg -i temp.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" -c:v gif miyabi_demo.gif

# Optimize GIF size
gifsicle -O3 --colors 128 miyabi_demo.gif -o miyabi_demo_optimized.gif
```

**Target File Size**: < 5 MB
**Dimensions**: 800x600px
**Frame Rate**: 15fps
**Duration**: 10 seconds

---

## 📤 Phase 4: Publishing (Human Execution Required)

### 4.1 YouTube Upload

#### Preparation

1. **Create YouTube Account** (if not already)
   - Channel Name: "Miyabi Framework" or personal channel

2. **Prepare Thumbnail**:
   - Use Canva: https://www.canva.com/
   - Template: YouTube Thumbnail (1280x720px)
   - Content:
     ```
     【大きく】AI が勝手に
     【大きく】コード書く時代
     【小さく】3分でわかるMiyabi
     ```
   - Save As: `thumbnail.png`

---

#### Upload Details

**Title (Japanese)**:
```
3分でわかるMiyabi - 完全自律型AI開発フレームワーク
```

**Title (English)**:
```
Miyabi in 3 Minutes - Fully Autonomous AI Development Framework
```

**Description**:
```
Miyabiは、GitHub as OSアーキテクチャに基づく完全自律型AI開発フレームワークです。
Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

🎯 特徴:
• 21個の専門Agentが自律実行
• Git Worktreeベースの並列処理
• Claude Code統合でLLM活用
• GitHub Projects V2でデータ永続化

🚀 デモ: Issue #270 (TypeScript strict mode有効化) を自動処理

📚 リンク:
• GitHub: https://github.com/ShunsukeHayashi/Miyabi
• Docs: https://github.com/ShunsukeHayashi/Miyabi/docs
• Quick Start: https://github.com/ShunsukeHayashi/Miyabi/QUICK_START.md

⏱️ タイムスタンプ:
0:00 イントロ
0:30 インストール実演
1:00 Agent実行デモ
2:00 21キャラクター紹介
2:30 まとめ + CTA

#AI #Automation #GitHub #Development #Claude #Rust #OpenSource #DevOps

---

Miyabi is a fully autonomous AI development framework based on GitHub as OS architecture.
It automates everything from Issue creation to code implementation, PR creation, and deployment.

🎯 Features:
• 21 specialized agents working autonomously
• Parallel processing with Git Worktrees
• LLM integration with Claude Code
• Data persistence with GitHub Projects V2

🚀 Demo: Automatically processing Issue #270 (Enable TypeScript strict mode)

📚 Links:
• GitHub: https://github.com/ShunsukeHayashi/Miyabi
• Docs: https://github.com/ShunsukeHayashi/Miyabi/docs
• Quick Start: https://github.com/ShunsukeHayashi/Miyabi/QUICK_START.md
```

**Tags** (20 tags max):
```
AI, Automation, GitHub, Development, Claude, Rust, OpenSource, DevOps,
Framework, Coding, Agent, LLM, CI/CD, Programming, Software, Tool,
Productivity, Developer, TypeScript, JavaScript
```

**Category**: Science & Technology

**Language**: Japanese (Primary), English (Subtitles)

---

#### YouTube Settings

**Visibility**: Public

**Age Restriction**: No

**Comments**: Enabled

**Subtitles**: Upload `DEMO_VIDEO_SUBTITLES_JP.srt` and `DEMO_VIDEO_SUBTITLES_EN.srt`

**End Screen** (last 20 seconds):
- Subscribe button
- Link to GitHub repository
- Link to documentation

**Cards** (add throughout video):
- 0:30 → "GitHub Repository" link
- 1:00 → "Quick Start Guide" link
- 2:00 → "Agent Documentation" link

---

### 4.2 Update README.md

**Add GIF Animation** (at the top of README):

```markdown
# Miyabi - 完全自律型AI開発フレームワーク

![Miyabi Demo](https://github.com/ShunsukeHayashi/Miyabi/raw/main/docs/miyabi_demo.gif)

**3分でわかる動画**: 👉 [YouTube](https://www.youtube.com/watch?v=XXXXXXXXXXX)

Miyabiは、GitHub as OSアーキテクチャに基づく完全自律型AI開発フレームワークです...
```

**Commit & Push**:
```bash
git add docs/miyabi_demo.gif README.md
git commit -m "docs: add demo GIF and YouTube video link to README

Added:
- miyabi_demo.gif (10-second terminal demo)
- YouTube video link (3-minute demo)

Part of Issue #344: Demo video creation"
git push origin main
```

---

### 4.3 Asciinema CLI Demo (Bonus)

**Record Terminal Session**:
```bash
# Install asciinema
brew install asciinema

# Start recording
asciinema rec miyabi_cli_demo.cast

# Execute commands
clear
echo "Demo: Miyabi CLI"
miyabi work-on 270

# Stop recording (Ctrl+D)
```

**Upload to Asciinema**:
```bash
# Upload (requires account)
asciinema upload miyabi_cli_demo.cast

# Get embed URL
# Example: https://asciinema.org/a/XXXXXX
```

**Add to Documentation**:
```markdown
## 📺 CLI Demo

<script src="https://asciinema.org/a/XXXXXX.js" id="asciicast-XXXXXX" async></script>

Or watch on Asciinema: https://asciinema.org/a/XXXXXX
```

---

## ✅ Quality Checklist

### Video Quality
- [ ] Resolution: 1920x1080 (Full HD)
- [ ] Frame rate: 30fps (smooth)
- [ ] Audio: Clear, no background noise
- [ ] Subtitles: Accurate, synced
- [ ] Duration: 3:00 ±5 seconds

### Content Quality
- [ ] Intro: Clear explanation of Miyabi
- [ ] Demo: Actual agent execution shown
- [ ] Agents: All 21 agents mentioned
- [ ] CTA: Clear call-to-action at end

### Technical Quality
- [ ] File size: < 100 MB
- [ ] Codec: H.264 (YouTube compatible)
- [ ] Audio: AAC, 192kbps
- [ ] Thumbnail: 1280x720px, < 2 MB

### Publishing Checklist
- [ ] YouTube: Video uploaded, public
- [ ] README: GIF animation added
- [ ] README: YouTube link added
- [ ] Asciinema: CLI demo recorded (optional)
- [ ] Social: Tweet/post about video (optional)

---

## 📊 Success Metrics

**Target Metrics** (1 month after publication):
- YouTube Views: 500+ views
- GitHub Stars: 150+ stars (3x increase from current ~50)
- README Engagement: 30% increase
- Issue Reports: 5+ usability-related issues closed

**Tracking**:
- YouTube Analytics: Views, Watch time, Engagement
- GitHub Insights: Stars, Forks, Traffic
- Google Analytics: README.md views

---

## 🚀 Next Steps After Publication

1. **Share on Social Media**:
   - Twitter: Tweet with video link
   - Reddit: Post on r/programming, r/rust, r/devops
   - Hacker News: Submit "Show HN: Miyabi..."
   - Dev.to: Write blog post with embedded video

2. **Update Documentation**:
   - Link video from all relevant docs
   - Add "Watch Video" badges

3. **Monitor Feedback**:
   - YouTube comments: Respond within 24h
   - GitHub issues: Address video-related questions

4. **Iterate**:
   - Create follow-up videos (5-minute deep dive, etc.)
   - Update video if major features added

---

**Production Guide Complete**

This guide provides all necessary instructions for human execution of Phases 2-4.
All Phase 1 assets (script, subtitles, production guide) have been prepared by Claude Code.

**Estimated Total Time**: 5-7 days (Phases 2-4)

---

**Created by**: Claude Code (AI Assistant)
**Date**: 2025-10-22
**Status**: Ready for Human Execution (Phases 2-4)
