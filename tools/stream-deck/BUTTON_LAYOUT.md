# Stream Deck 32-Button Layout Plan

**Target**: Stream Deck + (32 keys: 8 columns × 4 rows)
**Last Updated**: 2025-10-26

---

## 🎨 32-Button Layout (8×4)

```
Row 1: Basic Navigation & Control
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│  Next  │Continue│  Fix   │  Help  │ Verify │  Test  │ Review │Clippy  │
│   01   │   02   │   03   │   04   │   05   │   06   │   07   │   08   │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Row 2: Git & Development Workflow
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Status │  Diff  │  Add   │ Commit │   PR   │  Push  │  Pull  │ Merge  │
│   09   │   10   │   11   │   12   │   13   │   14   │   15   │   16   │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Row 3: Agent Execution & Automation
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Create │ Agent  │Infinity│  Auto  │  Todos │Security│ Deploy │  Docs  │
│ Issue  │  Run   │ Sprint │  Mode  │        │  Scan  │        │  Gen   │
│   17   │   18   │   19   │   20   │   21   │   22   │   23   │   24   │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘

Row 4: Voice & Notifications
┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ Voice  │Zundamon│Narrate │  Watch │ Daily  │Session │Generate│  Build │
│   ON   │  Mode  │        │ Sprint │ Update │  End   │   LP   │        │
│   25   │   26   │   27   │   28   │   29   │   30   │   31   │   32   │
└────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

---

## 📋 Button Details

### Row 1: Basic Navigation & Control (01-08)

| # | Name | Command | Icon | Color |
|---|------|---------|------|-------|
| 01 | Next | `Next` | ▶️ | Blue |
| 02 | Continue | `Continue` | ⏩ | Blue |
| 03 | Fix | `Fix the build errors and make sure all tests pass` | 🔧 | Orange |
| 04 | Help | `Help` | ❓ | Yellow |
| 05 | Verify | `/verify` | ✅ | Green |
| 06 | Test | `/test` | 🧪 | Green |
| 07 | Review | `/review` | 📊 | Purple |
| 08 | Clippy | `cargo clippy --all` | 📎 | Purple |

### Row 2: Git & Development Workflow (09-16)

| # | Name | Command | Icon | Color |
|---|------|---------|------|-------|
| 09 | Status | `git status` | 📋 | Cyan |
| 10 | Diff | `git diff` | 🔍 | Cyan |
| 11 | Add | `git add .` | ➕ | Cyan |
| 12 | Commit | `Please create a git commit with all changes` | 📝 | Green |
| 13 | PR | `Please create a pull request` | 🚀 | Green |
| 14 | Push | `git push` | ⬆️ | Blue |
| 15 | Pull | `git pull` | ⬇️ | Blue |
| 16 | Merge | `git merge` | 🔀 | Purple |

### Row 3: Agent Execution & Automation (17-24)

| # | Name | Command | Icon | Color |
|---|------|---------|------|-------|
| 17 | Create Issue | `/create-issue` | ➕📋 | Yellow |
| 18 | Agent Run | `/agent-run coordinator --issue <latest>` | 🤖 | Red |
| 19 | Infinity Sprint | `/miyabi-infinity` | ♾️ | Red |
| 20 | Auto Mode | `/miyabi-auto` | 🔄 | Red |
| 21 | Todos | `/miyabi-todos` | ☑️ | Yellow |
| 22 | Security Scan | `/security-scan` | 🔒 | Orange |
| 23 | Deploy | `/deploy` | 🚀 | Green |
| 24 | Docs Gen | `/generate-docs` | 📚 | Blue |

### Row 4: Voice & Notifications (25-32)

| # | Name | Command | Icon | Color |
|---|------|---------|------|-------|
| 25 | Voice ON | `/voicevox "音声システム起動！" 3 1.2` | 🔊 | Pink |
| 26 | Zundamon Mode | `/watch-sprint` | 🎤 | Pink |
| 27 | Narrate | `/narrate` | 🗣️ | Pink |
| 28 | Watch Sprint | `/watch-sprint` | 👁️ | Purple |
| 29 | Daily Update | `/daily-update` | 📊 | Blue |
| 30 | Session End | `/session-end` | 🔔 | Orange |
| 31 | Generate LP | `/generate-lp` | 🌐 | Green |
| 32 | Build | `cargo build --all` | 🏗️ | Orange |

---

## 🎨 Color Scheme

### Category-based Colors

| Category | Color | Hex Code |
|----------|-------|----------|
| Navigation | Blue | `#3B82F6` |
| Git Operations | Cyan | `#06B6D4` |
| Testing/Quality | Green | `#10B981` |
| Agent/Automation | Red | `#EF4444` |
| Voice/Audio | Pink | `#EC4899` |
| Documentation | Blue | `#3B82F6` |
| Warnings | Yellow | `#F59E0B` |
| Build/Deploy | Orange | `#F97316` |
| Analysis | Purple | `#8B5CF6` |

---

## 🔧 Implementation Plan

### Phase 1: Script Reorganization
- [ ] Rename existing scripts to match 01-32 numbering
- [ ] Create missing scripts for buttons 09-32
- [ ] Update all scripts to use `05-send-to-claude.sh` core

### Phase 2: Icon Generation
- [ ] Design 32 icons (72×72px PNG)
- [ ] Use color scheme above
- [ ] Include emoji + text for clarity
- [ ] Export to `tools/stream-deck/icons/`

### Phase 3: Documentation
- [ ] Create quick reference card
- [ ] Update README.md with 32-button layout
- [ ] Add troubleshooting guide

### Phase 4: Testing
- [ ] Test each button individually
- [ ] Verify command execution
- [ ] Check icon visibility
- [ ] Validate color contrast

---

## 📸 Icon Design Guidelines

### Icon Specifications
- **Size**: 72×72 pixels (Stream Deck standard)
- **Format**: PNG with transparency
- **Font**: SF Pro Display Bold (macOS default)
- **Emoji Size**: 48×48 pixels (centered)
- **Text**: 12pt, white, centered below emoji
- **Background**: Solid color with slight gradient
- **Border**: 2px rounded corners (radius: 8px)

### Icon Template Structure
```
┌─────────────────┐
│                 │
│      🔊        │  ← Emoji (48×48)
│                 │
│   Voice ON      │  ← Label (12pt)
│                 │
└─────────────────┘
```

### Color Gradient Examples
```css
/* Blue Gradient */
background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);

/* Red Gradient */
background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);

/* Pink Gradient */
background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%);
```

---

## 🚀 Quick Setup Guide

### 1. Install Scripts
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools/stream-deck
chmod +x *.sh
```

### 2. Configure Stream Deck
1. Open Stream Deck app
2. For each button (01-32):
   - Action: **System > Open**
   - Path: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/XX-name.sh`
   - Icon: `tools/stream-deck/icons/XX-name.png`

### 3. Test
```bash
# Test individual buttons
./01-next.sh
./18-agent-run.sh
./25-voice-on.sh
```

---

## 📊 Usage Metrics

Track button usage to optimize layout:

```bash
# View most used buttons
grep "Success" /tmp/stream-deck-messages.log | \
  cut -d']' -f2 | \
  cut -d':' -f1 | \
  sort | uniq -c | sort -rn | head -10
```

---

**このレイアウトは32ボタンを最大限活用する最適化設計です。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
