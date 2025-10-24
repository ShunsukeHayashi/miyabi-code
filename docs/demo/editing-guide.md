# Video Editing Guide - "3分でわかるMiyabi"

**Target Output**: 3:00 YouTube video (1920x1080, 30fps)

**Last Updated**: 2025-10-24

---

## 🎬 Software Selection

### Recommended: iMovie (macOS, Free)

**Pros**:
- Pre-installed on macOS
- User-friendly interface
- Built-in transitions and effects
- Good subtitle support
- Fast export times

**Installation**: Pre-installed on macOS

### Alternative: DaVinci Resolve (Free, Cross-platform)

**Pros**:
- Professional-grade features
- Advanced color grading
- Powerful audio tools
- Available on macOS, Windows, Linux

**Installation**:
```bash
# Download from: https://www.blackmagicdesign.com/products/davinciresolve/
# Free version is sufficient for this project
```

### Alternative: Adobe Premiere Pro (Paid)

**Pros**:
- Industry standard
- Extensive plugin ecosystem
- Advanced features

**Cost**: $20.99/month (Creative Cloud subscription)

---

## 📋 Pre-Editing Checklist

**Organize Assets**:
- [ ] All raw footage in `raw-footage/` directory
- [ ] Audio files in `audio/` directory
- [ ] Visual assets in `assets/` directory
- [ ] Subtitle files ready

**Verify Quality**:
- [ ] All clips playback smoothly
- [ ] Audio sync is correct
- [ ] No corrupted files
- [ ] Backup all raw footage (external drive)

---

## 🎞️ iMovie Editing Workflow

### Step 1: Project Setup

**Create New Project**:
```
1. Open iMovie
2. File > New Movie
3. Project Name: "Miyabi Demo - 3min"
4. Aspect Ratio: 16:9 (Widescreen)
5. Frame Rate: 30 fps
```

**Import Media**:
```
1. File > Import Media
2. Select all files from:
   - raw-footage/
   - audio/
   - assets/
3. Wait for import to complete
4. Organize into Events:
   - "Footage"
   - "Audio"
   - "Graphics"
```

---

### Step 2: Scene Assembly (Timeline Layout)

**Scene 1: Introduction (0:00 - 0:30)**

1. Drag `scene-01-intro.mp4` to timeline
2. Trim to exactly 30 seconds
3. Add overlay: `assets/miyabi-logo.png`
   - Duration: 5 seconds
   - Position: Center
   - Animation: Fade In + Fade Out
4. Add audio: `narration-japanese.wav` (0:00-0:30)
5. Add background music: `bgm-intro.mp3`
   - Volume: -20dB (background level)
   - Fade In: 2 seconds
   - Fade Out: 2 seconds

**Text Overlays**:
```
[0:05] "Miyabi - 完全自律型AI開発フレームワーク"
- Font: Noto Sans JP Bold, 48pt
- Color: White (#FFFFFF)
- Outline: Black, 2px
- Animation: Fade In

[0:15] "GitHub as OS アーキテクチャ"
- Font: Noto Sans JP Medium, 36pt
- Color: White (#FFFFFF)
- Duration: 5 seconds

[0:25] "21個の専門Agent搭載"
- Font: Noto Sans JP Medium, 36pt
- Color: White (#FFFFFF)
- Duration: 5 seconds
```

---

**Scene 2: Installation Demo (0:30 - 1:00)**

1. Drag `scene-02-installation.mp4` to timeline
2. Speed up build section to 2x or 3x (optional)
3. Add audio: `narration-japanese.wav` (0:30-1:00)
4. Add background music: `bgm-demo.mp3` (continue from Scene 1)

**Terminal Output Highlights**:
```
Use iMovie "Picture in Picture" effect to zoom in on:
- [0:35] Rust installation command
- [0:45] Git clone command
- [0:50] Cargo build progress
- [0:58] miyabi --version output

Zoom level: 120%
Duration: 3-5 seconds each
```

**Text Overlays**:
```
[0:52] "インストール時間: 5分"
- Font: Noto Sans JP Medium, 32pt
- Color: Green (#10B981)
- Position: Top Right
```

---

**Scene 3: Agent Execution Demo (1:00 - 2:00)**

1. Drag `scene-03-agent-demo.mp4` to timeline
2. Use **Split Screen** effect for GitHub Issue + Terminal
   - Left side (40%): GitHub Issue #270
   - Right side (60%): Terminal with Agent execution
3. Add audio: `narration-japanese.wav` (1:00-2:00)
4. Continue background music

**Split Screen Timeline**:
```
[1:00-1:10] GitHub Issue only (full screen)
[1:10-1:50] Split screen (Issue + Terminal)
[1:50-2:00] Terminal only (full screen) - PR creation
```

**Highlight Key Moments** (use iMovie "Ken Burns" effect to zoom):
```
[1:15] CoordinatorAgent starting
[1:30] CodeGenAgent code generation
[1:45] ReviewAgent quality score (98/100)
[1:55] PRAgent PR creation success
```

**Text Overlays**:
```
[1:12] "しきるん (Coordinator) → タスク分解"
[1:28] "つくるん (CodeGen) → コード実装"
[1:42] "めだまん (Review) → 品質チェック: 98/100"
[1:52] "まとめるん (PR) → PR #280 作成"

Font: Noto Sans JP Medium, 30pt
Color: White with Black outline
Position: Bottom third
Duration: 5-8 seconds each
```

**Animation**:
```
Use "Agent Flow" animation:
1. Arrow graphic: しきるん → つくるん → めだまん → まとめるん
2. Each agent icon lights up as narration mentions them
3. Create in Keynote, export as MOV with alpha channel
4. Overlay on timeline
```

---

**Scene 4: 21 Character Introduction (2:00 - 2:30)**

1. Drag `scene-04-characters.mp4` to timeline
2. Add audio: `narration-japanese.wav` (2:00-2:30)
3. Continue background music

**Character Grid Animation**:
```
[2:00-2:15] Coding Agents (7 characters)
- Grid layout: 3x3 with 7 filled
- Each character fades in sequentially (0.5s each)
- Highlight current agent being narrated

[2:15-2:30] Business Agents (14 characters)
- Grid layout: 4x4 with 14 filled
- Fade in all at once
- Brief overview only
```

**Text Overlays**:
```
[2:05] "Coding Agents (7)"
- Font: Noto Sans JP Bold, 40pt
- Color: Blue (#1D76DB)

[2:18] "Business Agents (14)"
- Font: Noto Sans JP Bold, 40pt
- Color: Orange (#F59E0B)
```

---

**Scene 5: Summary + CTA (2:30 - 3:00)**

1. Drag `scene-05-summary.mp4` to timeline
2. Add audio: `narration-japanese.wav` (2:30-3:00)
3. Fade out background music starting at 2:50

**Statistics Animation**:
```
[2:32] Show metrics one by one (animated counters):
- "生産性向上: 200%+"
- "Agent数: 21個"
- "成功率: 95%+"
- "平均実行時間: 10分"
- "GitHub Stars: 500+"

Use iMovie "Slide" transition between each stat
Duration: 3-4 seconds each
```

**Call to Action**:
```
[2:45] Main CTA
"GitHub: ShunsukeHayashi/Miyabi"
- Font: Roboto Bold, 48pt
- Color: White
- Background: Blue gradient
- Animation: Scale up from center

[2:50] QR Code
- Position: Center
- Size: 400x400px
- Duration: 10 seconds (until end)

[2:52] "今すぐスター⭐をつけよう"
- Font: Noto Sans JP Bold, 36pt
- Color: Yellow (#FBBF24)
- Animation: Pulse effect

[2:55] Landing page URL
"https://shunsukehayashi.github.io/Miyabi/"
- Font: Roboto Medium, 28pt
- Color: Light Blue
```

---

### Step 3: Transitions

**Transition Guidelines**:
```
Scene 1 → Scene 2: Cross Dissolve (1 second)
Scene 2 → Scene 3: Fade to Black + Fade from Black (0.5s each)
Scene 3 → Scene 4: Cross Dissolve (0.5 second)
Scene 4 → Scene 5: Fade to Black + Fade from Black (0.5s each)
```

**Apply in iMovie**:
```
1. Click between two clips in timeline
2. Click "Transitions" browser
3. Select transition type
4. Drag to timeline between clips
5. Adjust duration in Inspector
```

---

### Step 4: Audio Editing

**Narration Track**:
```
1. Drag `narration-japanese.wav` to timeline
2. Split audio at scene boundaries
3. Adjust volume to -6dB (comfortable listening level)
4. Add fade in/out at cuts (0.1s)
```

**Background Music (BGM)**:
```
1. Drag BGM to timeline below narration
2. Set volume to -20dB to -25dB
3. Duck audio during narration:
   - Select BGM clip
   - Effects > Audio > Ducking
   - Amount: 50%
4. Fade out completely at 2:50 (10 second fade)
```

**Audio Mixing Levels**:
```
Peak Levels (dBFS):
- Narration: -6dB to -3dB
- BGM: -25dB to -20dB
- Sound effects: -12dB to -9dB
- Overall mix: Do not exceed -3dB (prevent clipping)
```

---

### Step 5: Color Correction (Optional)

**Basic Color Grading**:
```
1. Select clip in timeline
2. Click "Color" button
3. Adjust:
   - Brightness: +5% (if footage is dark)
   - Contrast: +10%
   - Saturation: +5%
4. Apply to all similar clips
```

**Terminal Footage**:
```
1. Increase brightness slightly for better readability
2. Increase contrast for sharper text
3. Avoid over-saturation (keep natural look)
```

---

### Step 6: Subtitles

**Add Japanese Subtitles**:
```
1. File > Import > Subtitles
2. Select `subtitles/subtitle-ja.srt`
3. iMovie automatically syncs to timeline
4. Adjust subtitle style:
   - Font: Noto Sans JP Medium, 32pt
   - Color: White
   - Outline: Black, 2px
   - Position: Bottom (safe zone)
   - Background: Semi-transparent black box
```

**Add English Subtitles** (separate version):
```
1. Duplicate project: "Miyabi Demo - 3min (EN)"
2. Replace Japanese subtitles with English
3. File > Import > Subtitles
4. Select `subtitles/subtitle-en.srt`
5. Use same style settings
```

**Manual Subtitle Adjustment**:
```
If SRT import doesn't work:
1. Window > Show Titles
2. Drag "Lower Third" title to timeline
3. Edit text for each subtitle manually
4. Adjust duration to match narration
5. Repeat for all subtitle sections
```

---

### Step 7: Final Review

**Quality Checklist**:
- [ ] Total duration: Exactly 3:00 (±2 seconds acceptable)
- [ ] Audio levels consistent throughout
- [ ] No audio clipping (peaks < -3dB)
- [ ] Subtitles match narration timing
- [ ] All text is readable (no overlap)
- [ ] Transitions are smooth
- [ ] No abrupt cuts
- [ ] Color is consistent across scenes
- [ ] QR code is scannable (test with phone)

**Playback Testing**:
```
1. Watch full video at least 3 times:
   - Once for content flow
   - Once for audio quality
   - Once for visual errors
2. Check on different displays:
   - Desktop monitor
   - Laptop screen
   - Mobile device (YouTube app)
3. Test subtitle readability on all devices
```

---

### Step 8: Export Settings

**iMovie Export (Recommended)**:
```
1. File > Share > File
2. Settings:
   - Resolution: 1080p (1920x1080)
   - Quality: High
   - Compress: Better Quality
3. Export to: `miyabi-demo-final.mp4`
4. Wait for export (5-10 minutes)
```

**Advanced Export Settings** (if available):
```
Video:
- Codec: H.264
- Bitrate: 10-12 Mbps (high quality)
- Frame Rate: 30 fps
- Color Space: Rec. 709

Audio:
- Codec: AAC
- Bitrate: 192 Kbps
- Sample Rate: 48 kHz
- Channels: Stereo
```

---

## 🎨 DaVinci Resolve Workflow (Alternative)

### Step 1: Project Setup

**Create New Project**:
```
1. Open DaVinci Resolve
2. File > New Project
3. Project Name: "Miyabi Demo 3min"
4. Project Settings:
   - Timeline Resolution: 1920x1080 HD
   - Timeline Frame Rate: 30 fps
   - Playback Frame Rate: 30 fps
```

**Import Media**:
```
1. File > Import Media
2. Drag files to Media Pool
3. Organize into Bins:
   - "Footage"
   - "Audio"
   - "Graphics"
```

---

### Step 2: Edit Page

**Timeline Assembly**:
```
1. Switch to "Edit" page (bottom tabs)
2. Drag clips to timeline in order
3. Use Blade Tool (B) to trim clips
4. Use Selection Tool (A) to move clips
```

**Transitions**:
```
1. Effects Library > Video Transitions
2. Drag "Cross Dissolve" between clips
3. Adjust duration in Inspector (right panel)
```

**Titles & Text**:
```
1. Effects Library > Titles
2. Drag "Lower Third" to timeline
3. Edit text in Inspector
4. Adjust font, size, color, position
```

---

### Step 3: Fairlight Page (Audio Mixing)

**Switch to Fairlight** (bottom tabs):
```
1. Click "Fairlight" page
2. View audio tracks in mixer
3. Adjust levels:
   - Narration: -6dB
   - BGM: -22dB
4. Add audio effects:
   - Dynamics > Compressor (narration)
   - EQ > Parametric EQ (remove low rumble)
```

**Audio Ducking**:
```
1. Select BGM track
2. Right-click > Auto Ducking
3. Select narration track as trigger
4. Amount: -12dB
```

---

### Step 4: Color Page (Color Grading)

**Switch to Color** (bottom tabs):
```
1. Click "Color" page
2. Select clip in timeline
3. Use Color Wheels:
   - Lift: Adjust shadows
   - Gamma: Adjust midtones
   - Gain: Adjust highlights
4. Apply LUT (optional):
   - Right-click on node > LUT > Browse
   - Select cinematic LUT
```

**Basic Correction**:
```
1. Primaries > Contrast: +10
2. Primaries > Saturation: +5
3. Apply to all similar clips:
   - Right-click node > Copy
   - Select other clips
   - Right-click node > Paste
```

---

### Step 5: Deliver Page (Export)

**Switch to Deliver** (bottom tabs):
```
1. Click "Deliver" page
2. Select preset: "YouTube 1080p"
3. Custom settings:
   - Format: MP4
   - Codec: H.264
   - Resolution: 1920x1080
   - Frame Rate: 30 fps
   - Quality: Automatic (or 10000 Kbps)
4. Filename: `miyabi-demo-final.mp4`
5. Click "Add to Render Queue"
6. Click "Render All"
```

---

## 🎬 Advanced Techniques

### Animated Agent Flow Diagram

**Create in Apple Keynote** (or PowerPoint):
```
1. Create slide with agent icons:
   しきるん → つくるん → めだまん → まとめるん
2. Add animated arrows between icons
3. Use "Build In" animations:
   - Appear sequentially
   - Duration: 0.5s each
4. Export as MOV (1920x1080):
   File > Export To > Movie
5. Check "Transparency" option
6. Import into video editor as overlay
```

---

### Terminal Output Time-Lapse

**Speed Up Long Commands**:
```
1. Select terminal footage clip
2. Right-click > Retime > Fast (2x or 3x)
3. Keep audio muted during speed-up
4. Return to normal speed for key output
```

**Alternative (DaVinci Resolve)**:
```
1. Select clip
2. Change Speed % in Inspector
3. Use "Optical Flow" for smooth playback
```

---

### Picture-in-Picture Effect

**iMovie**:
```
1. Drag overlay clip above main clip in timeline
2. Click overlay clip
3. Select "Picture in Picture" button
4. Adjust:
   - Position: Drag on preview
   - Size: Pinch gesture or percentage
   - Border: Optional (white, 2px)
```

**DaVinci Resolve**:
```
1. Place overlay clip on higher video track
2. Use Transform tools in Inspector:
   - Position X/Y
   - Scale
3. Add drop shadow (optional):
   Effects > Open FX > Shadow
```

---

### Animated Statistics Counter

**Create Animated Numbers** (After Effects or Keynote):
```
1. Use "Numbers" animation preset
2. Count from 0 to target value
3. Duration: 2 seconds
4. Export as MOV with transparency
5. Overlay on video
```

**Alternative (Manual in iMovie)**:
```
1. Use multiple title clips
2. Quickly fade between different numbers
3. Creates illusion of counting animation
4. Example: 0% → 50% → 100% → 200%
```

---

## 📊 Export Quality Comparison

| Setting | File Size | Quality | Upload Time | Recommended |
|---------|-----------|---------|-------------|-------------|
| 720p, 5 Mbps | ~110 MB | Good | Fast | No |
| 1080p, 8 Mbps | ~180 MB | Very Good | Medium | Yes |
| 1080p, 12 Mbps | ~270 MB | Excellent | Slow | Yes (final) |
| 4K, 20 Mbps | ~900 MB | Overkill | Very Slow | No |

**Recommendation**: Use 1080p at 10-12 Mbps for best quality/size balance

---

## 🚨 Common Issues & Solutions

**Issue**: Audio and video out of sync
**Solution**:
- Re-import audio file
- Use "Detach Audio" to separate and re-sync manually
- Check frame rate matches (30fps)

**Issue**: Choppy playback during editing
**Solution**:
- Generate proxy media (lower resolution for editing)
- Close other applications
- Render preview files

**Issue**: Text not visible on dark backgrounds
**Solution**:
- Add black outline (2-3px)
- Add semi-transparent background box
- Increase text brightness

**Issue**: Exported video looks washed out
**Solution**:
- Export in Rec. 709 color space
- Avoid over-exposure during filming
- Apply basic color correction

**Issue**: File size too large
**Solution**:
- Reduce bitrate to 8-10 Mbps
- Use H.264 codec (not H.265)
- Export at 1080p (not 4K)

---

## ✅ Final Export Checklist

- [ ] Video duration: 3:00 (±2 seconds)
- [ ] Resolution: 1920x1080
- [ ] Frame rate: 30 fps
- [ ] Audio: No clipping, balanced levels
- [ ] Subtitles: Accurate timing, readable
- [ ] Quality: No pixelation or artifacts
- [ ] File size: < 500 MB
- [ ] Format: MP4 (H.264 + AAC)
- [ ] Tested playback on multiple devices

---

## 🔗 Additional Resources

**Video Editing Tutorials**:
- iMovie User Guide: https://support.apple.com/guide/imovie/
- DaVinci Resolve Training: https://www.blackmagicdesign.com/products/davinciresolve/training

**Free Assets**:
- Music: YouTube Audio Library, Artlist
- Sound Effects: Freesound.org
- Fonts: Google Fonts, JetBrains Mono

---

**Version**: 1.0.0
**Created**: 2025-10-24
**Last Updated**: 2025-10-24
