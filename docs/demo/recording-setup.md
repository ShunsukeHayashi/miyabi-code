# Recording Setup Guide - Miyabi Demo Video

**Target**: "3分でわかるMiyabi" YouTube Demo Video

**Last Updated**: 2025-10-24

---

## 🎥 Recording Environment

### Hardware Requirements

**Minimum Specs**:
- CPU: Intel Core i5 / Apple M1 or higher
- RAM: 8GB minimum (16GB recommended)
- Storage: 10GB free space
- Display: 1920x1080 resolution minimum

**Optional Equipment**:
- External USB microphone (Recommended: Blue Yeti, Audio-Technica AT2020)
- Headphones for audio monitoring
- Second monitor for script/notes reference

---

## 🔧 Software Setup

### 1. Screen Recording Software

#### Option A: OBS Studio (Free, Cross-platform)

**Installation**:
```bash
# macOS (Homebrew)
brew install --cask obs

# Linux (Ubuntu/Debian)
sudo apt install obs-studio

# Windows
# Download from: https://obsproject.com/
```

**OBS Configuration**:
```
Scene Setup:
1. Create Scene: "Miyabi Demo"
2. Add Source: Display Capture (Full Screen)
3. Add Source: Audio Input Capture (Microphone)

Video Settings:
- Base Resolution: 1920x1080
- Output Resolution: 1920x1080
- FPS: 30

Output Settings:
- Recording Format: MP4
- Encoder: x264
- Rate Control: CBR
- Bitrate: 8000 Kbps
- Preset: veryfast
- Audio Bitrate: 192 Kbps
```

**Recording Hotkeys**:
- Start Recording: `Cmd+Shift+R` (macOS) / `Ctrl+Shift+R` (Windows/Linux)
- Stop Recording: Same as above
- Pause Recording: `Cmd+Shift+P` / `Ctrl+Shift+P`

#### Option B: QuickTime Player (macOS Only)

**Steps**:
```
1. Open QuickTime Player
2. File > New Screen Recording
3. Options:
   - Microphone: Select your microphone
   - Show Mouse Clicks: Enabled
   - Quality: Maximum
4. Click Record button
5. Select full screen or drag to select area
6. Click "Start Recording"
```

**Pros**:
- Pre-installed on macOS
- Simple interface
- High quality output

**Cons**:
- Limited editing features
- No scene management
- macOS only

---

## 🖥️ Terminal Setup

### Shell Configuration

**Use Oh My Zsh with Theme**:
```bash
# Install Oh My Zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Set theme (Recommended: agnoster or powerlevel10k)
sed -i '' 's/ZSH_THEME=".*"/ZSH_THEME="agnoster"/' ~/.zshrc
source ~/.zshrc
```

**Terminal Preferences**:
```
Font:
- Name: JetBrains Mono / Fira Code
- Size: 16pt (for recording)
- Line Spacing: 1.2

Colors:
- Theme: Solarized Dark / Dracula
- Background Opacity: 90%

Window:
- Columns: 100
- Rows: 30
```

### Demo Environment Setup

**Create Clean Demo Directory**:
```bash
# Create temporary demo workspace
mkdir -p ~/miyabi-demo
cd ~/miyabi-demo

# Clone Miyabi
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi

# Build release version
cargo build --release

# Verify build
./target/release/miyabi --version
```

**Pre-configure GitHub CLI**:
```bash
# Authenticate GitHub CLI
gh auth login

# Test GitHub connection
gh repo view ShunsukeHayashi/Miyabi
```

**Set Environment Variables**:
```bash
# Add to ~/.zshrc or run before recording
export GITHUB_TOKEN="your_token_here"
export ANTHROPIC_API_KEY="your_api_key_here"
export DEVICE_IDENTIFIER="MacBook Pro Demo"
export RUST_LOG=info
```

---

## 🎬 Recording Checklist

### Pre-Recording Setup

**System Preparation**:
- [ ] Close all unnecessary applications
- [ ] Disable notifications (Do Not Disturb mode)
- [ ] Set desktop wallpaper to solid color or Miyabi branding
- [ ] Hide desktop icons
- [ ] Clear terminal history: `clear && history -c`
- [ ] Check microphone levels
- [ ] Test screen recording with 10-second sample

**Browser Setup** (for GitHub scenes):
- [ ] Open GitHub repository: https://github.com/ShunsukeHayashi/Miyabi
- [ ] Zoom to 125% for better visibility
- [ ] Clear browser cache and cookies
- [ ] Use Incognito/Private mode for clean UI
- [ ] Pin relevant tabs (GitHub repo, Issue #270)

**Terminal Preparation**:
- [ ] Increase font size to 16pt
- [ ] Set prompt to simple format (hide system info)
- [ ] Position terminal window center screen
- [ ] Set window size to 100x30 characters

---

## 📝 Scene-by-Scene Recording Plan

### Scene 1: Introduction (0:00 - 0:30)
**Recording Elements**:
- Miyabi logo (use assets/logo.png)
- GitHub repository screenshot
- Code editor with automated commits

**Commands**: None (visual assets only)

---

### Scene 2: Installation Demo (0:30 - 1:00)
**Recording Elements**:
- Terminal full screen
- Real-time command execution

**Script**:
```bash
# Scene 2a: Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# [Wait for completion - use time-lapse if too long]

# Scene 2b: Clone Miyabi
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi

# Scene 2c: Build
cargo build --release
# [Use time-lapse for long build - show progress]

# Scene 2d: Verify
./target/release/miyabi --version
# Output: miyabi 2.0.0
```

**Recording Tips**:
- Use `pv` command to simulate typing: `echo "git clone ..." | pv -qL 30`
- Speed up build time in editing (2-3x speed)
- Show clear progress indicators

---

### Scene 3: Agent Execution Demo (1:00 - 2:00)
**Recording Elements**:
- Split screen: GitHub Issue + Terminal
- Real-time Agent execution
- Code diff preview

**Setup**:
```bash
# Create Issue #270 (if not exists)
gh issue create \
  --title "Enable TypeScript strict mode" \
  --body "Update tsconfig.json to enable strict mode compilation"

# Verify issue created
gh issue view 270
```

**Main Command**:
```bash
# Execute Agent pipeline
./target/release/miyabi work-on 270

# [Record full execution output - no edits]
```

**Expected Output Duration**: 5-10 minutes
**Editing Note**: Speed up by 2x during long waits, show key moments at normal speed

---

### Scene 4: 21 Character Introduction (2:00 - 2:30)
**Recording Elements**:
- Character grid visual (create in Keynote/PowerPoint)
- Smooth transitions between agents

**Assets Needed**:
- 21 character icons (create from .claude/agents/AGENT_CHARACTERS.md)
- Grid layout template
- Animation transitions

**Recording**: Capture screen recording of presentation slides

---

### Scene 5: Summary + CTA (2:30 - 3:00)
**Recording Elements**:
- Metrics animation
- GitHub repository stats
- QR code overlay

**Commands**:
```bash
# Show GitHub stats
gh repo view ShunsukeHayashi/Miyabi --json stargazersCount,forksCount,watchersCount

# Show project structure
tree -L 2 crates/

# Show available agents
./target/release/miyabi agent list
```

---

## 🎤 Audio Recording Tips

### Microphone Setup
```
Position:
- Distance: 6-12 inches from mouth
- Angle: 45 degrees off-axis (reduce plosives)
- Height: At mouth level

Environment:
- Record in quiet room
- Use soft furnishings to reduce echo
- Close windows (reduce outside noise)
- Record early morning or late evening (less ambient noise)
```

### Recording Software
```bash
# macOS: Use QuickTime or Audacity
# Install Audacity (optional)
brew install --cask audacity
```

### Audio Settings
```
Sample Rate: 48000 Hz
Bit Depth: 24-bit
Format: WAV (lossless)
Mono/Stereo: Mono (for narration)
```

### Recording Process
1. Record 5 seconds of room tone (silence)
2. Record full narration script
3. Leave 2 seconds of silence at end
4. Save as WAV file
5. Apply noise reduction in post-production

---

## 🔊 Audio Post-Processing

### Noise Reduction (Audacity)
```
1. Select room tone (silent section)
2. Effect > Noise Reduction > Get Noise Profile
3. Select entire track
4. Effect > Noise Reduction > Apply
   - Noise Reduction: 12 dB
   - Sensitivity: 6.00
   - Frequency Smoothing: 3
```

### Normalization
```
1. Select entire track
2. Effect > Normalize
   - Peak amplitude: -3.0 dB
   - Normalize stereo channels independently: Unchecked
```

### Equalization (Optional)
```
1. Effect > Filter Curve EQ
2. Apply voice enhancement preset
3. Boost: 100-200 Hz (warmth)
4. Cut: 200-500 Hz (muddiness)
5. Boost: 2-5 kHz (clarity)
```

---

## 📁 File Organization

### Directory Structure
```
miyabi-demo-recording/
├── raw-footage/
│   ├── scene-01-intro.mp4
│   ├── scene-02-installation.mp4
│   ├── scene-03-agent-demo.mp4
│   ├── scene-04-characters.mp4
│   └── scene-05-summary.mp4
├── audio/
│   ├── narration-japanese.wav
│   ├── narration-english.wav
│   ├── bgm-intro.mp3
│   └── bgm-demo.mp3
├── assets/
│   ├── miyabi-logo.png
│   ├── character-grid.png
│   ├── thumbnail.png
│   └── qr-code.png
└── subtitles/
    ├── subtitle-ja.srt
    └── subtitle-en.srt
```

---

## ✅ Quality Control Checklist

**Video Quality**:
- [ ] Resolution: 1920x1080 minimum
- [ ] Frame rate: 30fps consistent
- [ ] No frame drops or stuttering
- [ ] Clear text visibility (no blur)
- [ ] Proper color balance

**Audio Quality**:
- [ ] No background noise
- [ ] Consistent volume levels
- [ ] No clipping or distortion
- [ ] Clear speech (no mumbling)
- [ ] Proper pacing (not too fast/slow)

**Content Quality**:
- [ ] All commands executed successfully
- [ ] Terminal output is complete
- [ ] No errors or warnings shown
- [ ] Timing matches script
- [ ] All assets visible clearly

---

## 🚨 Troubleshooting

### Common Issues

**Issue**: Screen recording lag
**Solution**: Close other applications, reduce output resolution to 720p

**Issue**: Audio sync problems
**Solution**: Record audio separately, sync in post using audio waveform

**Issue**: Terminal output too fast
**Solution**: Use `script` command to replay session at controlled speed

**Issue**: Long build times
**Solution**: Pre-build project, use cached build for recording

**Issue**: Microphone noise
**Solution**: Use Audacity noise reduction, record in quieter environment

---

## 📊 Expected File Sizes

```
Raw Footage:
- Scene 1-5: ~2GB (3 minutes at 8000 Kbps)

Audio:
- Narration (WAV): ~100MB (3 minutes, 48kHz, 24-bit)
- Narration (MP3): ~5MB (compressed)

Final Export:
- YouTube (1080p): ~500MB (H.264, recommended bitrate)
```

---

## 🔗 Additional Resources

**Screen Recording**:
- OBS Studio Documentation: https://obsproject.com/wiki/
- Screenflow (macOS paid): https://www.telestream.net/screenflow/

**Audio Recording**:
- Audacity Manual: https://manual.audacityteam.org/
- Audio recording best practices: https://www.youtube.com/audioguide

**Font Downloads**:
- JetBrains Mono: https://www.jetbrains.com/lp/mono/
- Fira Code: https://github.com/tonsky/FiraCode

---

**Version**: 1.0.0
**Created**: 2025-10-24
**Last Updated**: 2025-10-24
