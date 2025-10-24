# GIF Animation Plan for README.md
# 10-Second Demo GIF - "miyabi work-on 1" Execution

**Purpose**: Provide an immediate visual demonstration of Miyabi in action at the top of README.md
**Target Duration**: 10 seconds (repeating loop)
**Target File Size**: < 5MB (GitHub recommendation)
**Placement**: README.md hero section (below badges, above Quick Start)

---

## GIF Specifications

### Technical Requirements
- **Resolution**: 800x600px (readable on all devices)
- **Frame Rate**: 15 fps (smooth but not too large)
- **Duration**: 10 seconds (7-8 seconds content + 2-3 seconds pause before loop)
- **Format**: GIF (animated)
- **File Size**: < 5MB (ideally 2-3MB)
- **Colors**: 256 colors (GIF limit, optimized palette)
- **Loop**: Infinite

### Visual Requirements
- **Background**: Terminal with dark theme
- **Font**: Monospace, 14-16pt (readable at 800px width)
- **Contrast**: High (white/green text on dark background)
- **Margins**: 20px padding around terminal content
- **Cursor**: Blinking cursor visible during pauses

---

## GIF Content: 10-Second Script

### Scene Breakdown

#### 0:00-0:01 | Opening (1 second)
**Visual**: Empty terminal prompt
```bash
$ ▊
```
**Animation**: Blinking cursor

---

#### 0:01-0:03 | Command Typing (2 seconds)
**Visual**: Command being typed (with typing animation)
```bash
$ m▊
$ mi▊
$ miy▊
$ miya▊
$ miyab▊
$ miyabi▊
$ miyabi ▊
$ miyabi w▊
$ miyabi wo▊
$ miyabi wor▊
$ miyabi work▊
$ miyabi work-▊
$ miyabi work-o▊
$ miyabi work-on▊
$ miyabi work-on ▊
$ miyabi work-on 1▊
```
**Speed**: 20 characters/second (realistic typing speed)
**Cursor**: Visible and moving

---

#### 0:03-0:04 | Command Execution (1 second)
**Visual**: Press Enter, command executes
```bash
$ miyabi work-on 1⏎

[2025-10-24 12:00:00] [しきるん] 🎯 Analyzing Issue #1...
```
**Animation**:
- Enter key press (cursor disappears)
- Brief pause (0.3s)
- First log line appears

---

#### 0:04-0:08 | Execution Output (4 seconds)
**Visual**: Rapid agent output (simulated)
```bash
$ miyabi work-on 1

[12:00:00] [しきるん] 🎯 Analyzing Issue #1...
[12:00:01] [しきるん]    Title: Add user authentication
[12:00:02] [しきるん] ✓ Decomposed into 3 tasks
[12:00:03] [つくるん] ✍️ Implementing Task 1...
[12:00:04] [つくるん] ✓ Created auth.ts
[12:00:05] [つくるん] 🧪 Running tests... ✓ 285 passed
[12:00:06] [めだまん] 🔍 Quality Score: 92/100
[12:00:07] [まとめるん] 📋 Creating PR #108... ✓
[12:00:08] [しきるん] 🎉 Complete! (8 seconds)
```
**Speed**: Lines appear at 1-2 lines/second (fast but readable)
**Colors**:
- Timestamps: Gray
- Agent names: Color-coded (red, green, blue, yellow)
- Emojis: Preserved (for visual appeal)
- Status: Green checkmarks

---

#### 0:08-0:10 | Closing (2 seconds)
**Visual**: Final state + prompt
```bash
[12:00:08] [しきるん] 🎉 Complete! (8 seconds)

$ ▊
```
**Animation**:
- Hold on final output (1.5s)
- Show prompt with blinking cursor (0.5s)
- Fade to beginning of loop (smooth transition)

---

## Production Steps

### Step 1: Record Terminal Session
**Tool**: Asciinema or OBS Studio
**Duration**: 15 seconds (including pre/post buffer)

**Terminal Setup**:
```bash
# Terminal configuration
export PS1="$ "  # Simple prompt
clear
```

**Commands to Execute**:
```bash
# Pre-create mock output (for consistency)
cat > mock_output.txt << 'EOF'
[12:00:00] [しきるん] 🎯 Analyzing Issue #1...
[12:00:01] [しきるん]    Title: Add user authentication
[12:00:02] [しきるん] ✓ Decomposed into 3 tasks
[12:00:03] [つくるん] ✍️ Implementing Task 1...
[12:00:04] [つくるん] ✓ Created auth.ts
[12:00:05] [つくるん] 🧪 Running tests... ✓ 285 passed
[12:00:06] [めだまん] 🔍 Quality Score: 92/100
[12:00:07] [まとめるん] 📋 Creating PR #108... ✓
[12:00:08] [しきるん] 🎉 Complete! (8 seconds)
EOF

# Use 'pv' to simulate real-time output
cat mock_output.txt | pv -qL 200
```

**Recording Settings**:
- Resolution: 1600x1200 (will be resized to 800x600)
- Frame Rate: 30 fps (will be reduced to 15 fps)
- Background: Terminal dark theme (One Dark Pro)
- Font: JetBrains Mono, 16pt

---

### Step 2: Edit Video
**Tool**: DaVinci Resolve, iMovie, or FFmpeg

**Editing Tasks**:
1. Trim to exactly 10 seconds
2. Resize to 800x600px
3. Reduce frame rate to 15 fps
4. Add 2-second pause at end (before loop)
5. Crop to terminal content only (remove menu bar, dock)
6. Adjust colors (increase contrast if needed)

**FFmpeg Commands**:
```bash
# Resize and reduce frame rate
ffmpeg -i terminal-recording.mp4 \
  -vf "scale=800:600:flags=lanczos,fps=15" \
  -c:v libx264 \
  terminal-10s.mp4

# Add 2-second pause at end
ffmpeg -i terminal-10s.mp4 \
  -filter_complex "[0:v]trim=duration=8,setpts=PTS-STARTPTS[v1]; \
    [0:v]trim=start=8:duration=2,setpts=PTS-STARTPTS[v2]; \
    [v1][v2]concat=n=2:v=1[outv]" \
  -map "[outv]" \
  terminal-10s-pause.mp4
```

---

### Step 3: Convert to GIF
**Tool**: FFmpeg or ezgif.com

**Conversion Settings**:
- Resolution: 800x600px
- Frame Rate: 15 fps
- Colors: 256 (optimized palette)
- Loop: Infinite
- Dithering: Floyd-Steinberg (best quality)

**FFmpeg Command** (Recommended):
```bash
# Generate optimized palette
ffmpeg -i terminal-10s-pause.mp4 \
  -vf "fps=15,scale=800:600:flags=lanczos,palettegen=stats_mode=diff" \
  -y palette.png

# Convert to GIF using palette
ffmpeg -i terminal-10s-pause.mp4 -i palette.png \
  -lavfi "fps=15,scale=800:600:flags=lanczos[x];[x][1:v]paletteuse=dither=floyd_steinberg" \
  -loop 0 \
  miyabi-demo.gif
```

**Alternative** (Online Tool):
1. Upload `terminal-10s-pause.mp4` to ezgif.com
2. Set frame rate: 15 fps
3. Set resolution: 800x600px
4. Optimize: Yes (reduce file size)
5. Download GIF

---

### Step 4: Optimize File Size
**Target**: < 3MB

**Optimization Tools**:
1. **Gifsicle** (CLI)
   ```bash
   gifsicle -O3 --lossy=80 miyabi-demo.gif -o miyabi-demo-optimized.gif
   ```

2. **ImageMagick** (CLI)
   ```bash
   convert miyabi-demo.gif -fuzz 10% -layers Optimize miyabi-demo-optimized.gif
   ```

3. **ezgif.com** (Online)
   - Upload GIF
   - Optimize → Compression level: 35
   - Download optimized GIF

**Quality Check**:
- [ ] File size < 5MB (ideally 2-3MB)
- [ ] Text readable at 800px width
- [ ] Colors preserved (agent names color-coded)
- [ ] Smooth animation (no stuttering)
- [ ] Loop transition smooth

---

## README.md Integration

### Placement (Option 1): Hero Section
```markdown
<div align="center">

# 🌸 Miyabi

### *Beauty in Autonomous Development*

**一つのコマンドで全てが完結する自律型開発フレームワーク**

![Miyabi Demo](docs/demo-video/assets/miyabi-demo.gif)

[🚀 Get Started](#quick-start) • [📖 Docs](https://miyabi-docs.com) • [💬 Discord](https://discord.gg/miyabi)

</div>
```

### Placement (Option 2): After Badges
```markdown
## ✨ See It In Action

![Miyabi Demo - Issue to PR in 10 seconds](docs/demo-video/assets/miyabi-demo.gif)

*From Issue to Pull Request in seconds - watch Miyabi's AI agents work their magic*
```

### Placement (Option 3): Quick Start Section
```markdown
## 🚀 Quick Start

![Miyabi Demo](docs/demo-video/assets/miyabi-demo.gif)

### Installation

\```bash
cargo install miyabi-cli
\```
```

**Recommendation**: Option 1 (Hero Section) - Maximum visibility

---

## GIF Variations (A/B Testing)

### Variation A: Full Workflow (10 seconds)
- Shows complete Issue → PR flow
- Best for: First-time visitors
- File size: 2-3MB

### Variation B: Quick Demo (5 seconds)
- Shows only key moments (command → result)
- Best for: Mobile users, slow connections
- File size: 1-2MB

### Variation C: Loop Focus (8 seconds)
- Focuses on agent execution (no typing animation)
- Best for: Technical audience
- File size: 2-3MB

**Initial Launch**: Use Variation A (full workflow)
**Monitor**: GitHub Analytics (README views, click-through)
**Iterate**: Switch to Variation B if mobile traffic > 60%

---

## Mobile Optimization

### Considerations
- Many GitHub visitors on mobile (40-50%)
- Mobile screens: 375px - 428px width
- GIF should remain readable at 375px

### Mobile Testing
1. View GIF on iPhone SE (375px width)
2. View GIF on iPhone 14 Pro (393px width)
3. View GIF on iPad (768px width)
4. Ensure text remains readable

### Fallback (if GIF too large)
- Create static image (PNG) for mobile
- Use `<picture>` element with media queries
```html
<picture>
  <source media="(min-width: 768px)" srcset="docs/demo-video/assets/miyabi-demo.gif">
  <img src="docs/demo-video/assets/miyabi-demo-static.png" alt="Miyabi Demo">
</picture>
```

---

## Production Checklist

### Pre-Production
- [ ] Install required tools (FFmpeg, Gifsicle)
- [ ] Set up terminal (dark theme, font, size)
- [ ] Prepare mock output (for consistency)
- [ ] Test recording (2-3 practice runs)

### Production
- [ ] Record terminal session (10-15 seconds)
- [ ] Review recording (quality check)
- [ ] Edit video (trim, resize, adjust colors)
- [ ] Convert to GIF (using optimized palette)
- [ ] Optimize file size (< 3MB target)

### Post-Production
- [ ] Test GIF on multiple devices (desktop, mobile)
- [ ] Verify loop smoothness
- [ ] Check text readability
- [ ] Upload to `/docs/demo-video/assets/`
- [ ] Update README.md with GIF embed
- [ ] Commit and push to GitHub
- [ ] Verify GIF displays correctly on GitHub

### Quality Assurance
- [ ] File size: < 5MB ✓
- [ ] Resolution: 800x600px ✓
- [ ] Frame rate: 15 fps ✓
- [ ] Text readable on mobile ✓
- [ ] Colors accurate (agent names) ✓
- [ ] Loop transition smooth ✓
- [ ] No artifacts or compression issues ✓

---

## Alternative Approaches

### Option A: Video with Play Button (Recommended for v2)
- Use MP4 instead of GIF
- Add custom play button overlay
- Reduces file size by 50-70%
- Requires JavaScript (less compatible)

```html
<video autoplay loop muted playsinline width="800">
  <source src="docs/demo-video/assets/miyabi-demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>
```

### Option B: Asciinema Embed
- Use Asciinema for interactive terminal recording
- Allows users to copy/paste commands
- Requires external service (asciinema.org)

```markdown
[![asciicast](https://asciinema.org/a/xxxxx.svg)](https://asciinema.org/a/xxxxx)
```

### Option C: Static Screenshots + Carousel
- Use 3-4 static screenshots
- Add "▶ Watch Full Video" CTA
- Best for: Extremely slow connections
- File size: < 500KB

**Recommendation**: Start with GIF (Option A), evaluate video embed (Option A v2) after 1 month

---

## Success Metrics

### Primary KPIs
- GitHub README views: +30% (with GIF vs. without)
- Click-through to Quick Start: +20%
- Average time on README: +15 seconds
- Star conversion rate: +10%

### Secondary KPIs
- GIF load time: < 2 seconds (on 4G connection)
- Mobile bounce rate: < 50%
- GIF views: Track via GitHub Insights

### Tracking Setup
- Use GitHub Analytics (native)
- Add UTM parameters to external links (if tracking externally)
- Monitor GitHub Star growth weekly

---

## Maintenance & Updates

### When to Update GIF
- Major version release (v1.0 → v2.0)
- Significant UI changes
- New flagship feature added
- User feedback indicates confusion

### Update Process
1. Record new terminal session
2. Follow production steps (same pipeline)
3. A/B test old vs. new GIF (if possible)
4. Replace GIF in README.md
5. Archive old GIF (for reference)

### Version Control
- Name GIFs with version: `miyabi-demo-v1.0.gif`
- Keep old versions in `/docs/demo-video/archive/`
- Document changes in CHANGELOG.md

---

## Tools & Resources

### Recording Tools
- **Asciinema** (Free): https://asciinema.org/
- **OBS Studio** (Free): https://obsproject.com/
- **QuickTime** (macOS, Free): Built-in screen recorder

### Conversion Tools
- **FFmpeg** (Free): https://ffmpeg.org/
- **Gifsicle** (Free): https://www.lcdf.org/gifsicle/
- **ezgif.com** (Free, Online): https://ezgif.com/

### Optimization Tools
- **ImageMagick** (Free): https://imagemagick.org/
- **TinyPNG** (Free/Paid): https://tinypng.com/
- **Squoosh** (Free, Web): https://squoosh.app/

### Inspiration
- **GitHub Copilot Demo**: Simple, clear, shows value immediately
- **Cursor Demo GIF**: 10 seconds, auto-completion showcase
- **Aider Demo**: Terminal-focused, clean execution

---

## File Locations

### Source Files
- Terminal recording: `/docs/demo-video/assets/terminal/miyabi-demo-recording.mp4`
- Edited video: `/docs/demo-video/assets/terminal/miyabi-demo-edited.mp4`
- Palette: `/docs/demo-video/assets/terminal/palette.png`

### Final Output
- Main GIF: `/docs/demo-video/assets/miyabi-demo.gif`
- Optimized GIF: `/docs/demo-video/assets/miyabi-demo-optimized.gif`
- Mobile fallback: `/docs/demo-video/assets/miyabi-demo-static.png`

### Archive
- Old versions: `/docs/demo-video/archive/miyabi-demo-v*.gif`

---

## Next Steps

1. **Day 1**: Record terminal session (2 hours)
2. **Day 1**: Edit and convert to GIF (1 hour)
3. **Day 1**: Optimize file size (30 minutes)
4. **Day 2**: Test on multiple devices (30 minutes)
5. **Day 2**: Update README.md (15 minutes)
6. **Day 2**: Commit and push to GitHub (5 minutes)
7. **Day 2**: Monitor analytics (ongoing)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Miyabi Team
**Status**: Ready for Production
