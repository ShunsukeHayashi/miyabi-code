# 🚀 Stream Deck 32-Button Quick Setup Card

**Version**: 1.0 | **Date**: 2025-10-26

---

## 📋 3-Step Setup

### Step 1: Verify Scripts ✅
```bash
cd /Users/shunsuke/Dev/miyabi-private/tools/stream-deck
ls -1 [0-9][0-9]-*.sh | wc -l
# Should show: 32
```

### Step 2: Verify Icons ⏳
```bash
ls -1 icons/*.jpeg | wc -l
# Should show: 32
```

### Step 3: Configure Stream Deck App 🎛️
For each button (01-32):
1. **Action**: System > Open
2. **Path**: `/Users/shunsuke/Dev/miyabi-private/tools/stream-deck/XX-name.sh`
3. **Icon**: `tools/stream-deck/icons/XX-name.jpeg`

---

## 🎯 Button Quick Reference

### Row 1: Navigation (01-08)
| # | Name | Function |
|---|------|----------|
| 01 | Next | `Next` |
| 02 | Continue | `Continue` |
| 03 | Fix | Fix build + test |
| 04 | Help | `Help` |
| 05 | Verify | `/verify` system check |
| 06 | Test | `/test` run all tests |
| 07 | Review | `/review` code quality |
| 08 | Clippy | Clippy warnings |

### Row 2: Git (09-16)
| # | Name | Function |
|---|------|----------|
| 09 | Status | `git status` |
| 10 | Diff | `git diff` |
| 11 | Add | `git add .` |
| 12 | Commit | Git commit |
| 13 | PR | Create PR |
| 14 | Push | `git push` |
| 15 | Pull | `git pull` |
| 16 | Merge | Git merge |

### Row 3: Agents (17-24)
| # | Name | Function |
|---|------|----------|
| 17 | Issue | `/create-issue` |
| 18 | Agent | `/agent-run` (latest) |
| 19 | Infinity | `/miyabi-infinity` |
| 20 | Auto | `/miyabi-auto` |
| 21 | Todos | `/miyabi-todos` |
| 22 | Security | `/security-scan` |
| 23 | Deploy | `/deploy` |
| 24 | Docs | `/generate-docs` |

### Row 4: Voice (25-32)
| # | Name | Function |
|---|------|----------|
| 25 | Voice ON | `/voicevox` start |
| 26 | Zundamon | `/watch-sprint` voice |
| 27 | Narrate | `/narrate` commits |
| 28 | Watch | `/watch-sprint` monitor |
| 29 | Daily | `/daily-update` report |
| 30 | Session | `/session-end` notify |
| 31 | LP | `/generate-lp` |
| 32 | Build | `cargo build --all` |

---

## 🔧 Troubleshooting

### Buttons Not Working?
```bash
# 1. Check script permissions
chmod +x /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/*.sh

# 2. Test manually
./01-next.sh

# 3. Check logs
tail -f /tmp/stream-deck-messages.log
```

### VS Code Not Activating?
- System Preferences > Security & Privacy > Privacy > Accessibility
- Add "Stream Deck" or "Terminal"
- Enable checkbox

### Icons Not Showing?
```bash
# Check icon directory
ls -la /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/icons/

# Regenerate if needed
./generate-new-icons.sh
```

---

## ⚡ Most Used Buttons

**Top 5 Recommended:**
1. **01 - Next**: Continue workflow
2. **18 - Agent Run**: Execute latest Issue
3. **12 - Commit**: Create git commit
4. **13 - PR**: Create pull request
5. **25 - Voice ON**: Start voice notifications

**Power User Combo:**
- `17 Create Issue` → `18 Agent Run` → `26 Zundamon Mode` (watch progress with voice)

---

## 📊 Color Code

| Color | Category | Buttons |
|-------|----------|---------|
| 🔵 Blue | Navigation | 01, 02, 14, 15, 24, 29 |
| 🟢 Green | Success/Test | 05, 06, 12, 13, 23, 31 |
| 🟣 Purple | Analysis | 07, 08, 16, 28 |
| 🟡 Yellow | Warning/Info | 04, 17, 21 |
| 🟠 Orange | Build/Fix | 03, 22, 30, 32 |
| 🔴 Red | Agents | 18, 19, 20 |
| 🟤 Cyan | Git | 09, 10, 11 |
| 🩷 Pink | Voice | 25, 26, 27 |

---

## 🎨 Visual Layout (Print This!)

```
Stream Deck 32-Button Layout (8×4)

┌─────────────────────────────────────────────────────────────────┐
│ ROW 1: NAVIGATION & CONTROL                                     │
├────┬────┬────┬────┬────┬────┬────┬────┐
│ ▶️  │ ⏩ │ 🔧 │ ❓ │ ✅ │ 🧪 │ 📊 │ 📎 │
│ 01 │ 02 │ 03 │ 04 │ 05 │ 06 │ 07 │ 08 │
├────┴────┴────┴────┴────┴────┴────┴────┤
│ ROW 2: GIT WORKFLOW                    │
├────┬────┬────┬────┬────┬────┬────┬────┐
│ 📋 │ 🔍 │ ➕ │ 📝 │ 🚀 │ ⬆️  │ ⬇️  │ 🔀 │
│ 09 │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │ 16 │
├────┴────┴────┴────┴────┴────┴────┴────┤
│ ROW 3: AGENTS & AUTOMATION             │
├────┬────┬────┬────┬────┬────┬────┬────┐
│ ➕📋│ 🤖 │ ♾️  │ 🔄 │ ☑️  │ 🔒 │ 🚀 │ 📚 │
│ 17 │ 18 │ 19 │ 20 │ 21 │ 22 │ 23 │ 24 │
├────┴────┴────┴────┴────┴────┴────┴────┤
│ ROW 4: VOICE & NOTIFICATIONS           │
├────┬────┬────┬────┬────┬────┬────┬────┐
│ 🔊 │ 🎤 │ 🗣️  │ 👁️  │ 📊 │ 🔔 │ 🌐 │ 🏗️  │
│ 25 │ 26 │ 27 │ 28 │ 29 │ 30 │ 31 │ 32 │
└────┴────┴────┴────┴────┴────┴────┴────┘
```

---

## 💡 Pro Tips

1. **Muscle Memory**: Use Row 1 for daily tasks (Next, Continue, Fix)
2. **Git Flow**: Row 2 follows git workflow (Status → Diff → Add → Commit → PR → Push)
3. **Automation**: Row 3 is for autonomous execution (Issue → Agent → Infinity)
4. **Voice Feedback**: Row 4 enables audio notifications for long tasks

---

## 📱 Next Steps

1. ✅ Scripts created (32/32)
2. ⏳ Icons generating (18/32 completed)
3. ⏸️  Configure Stream Deck app
4. ⏸️  Test all buttons

**Wait for icons to finish, then:**
```bash
open /Users/shunsuke/Dev/miyabi-private/tools/stream-deck/icons/
```

**Then configure Stream Deck app with scripts + icons!**

---

🤖 **Generated with Claude Code** | 📁 `/tools/stream-deck/QUICK_SETUP_CARD.md`
