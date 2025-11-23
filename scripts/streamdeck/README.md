# 🎮 Miyabi Stream Deck Mobile Control Panel

**Complete smartphone-based control system for Miyabi Orchestra**

---

## 📱 Multi-Profile Architecture

### Profile 1: Main Dashboard (メインダッシュボード)
**15 buttons for core operations**

### Profile 2: Agent Control (エージェント制御)
**15 buttons for agent management**

### Profile 3: Development Tools (開発ツール)
**15 buttons for development workflow**

### Profile 4: Monitoring & Alerts (モニタリング)
**15 buttons for system monitoring**

### Profile 5: Quick Actions (クイックアクション)
**15 buttons for frequently used commands**

**Total: 75 buttons across 5 profiles**

---

## 🎯 Profile 1: Main Dashboard

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🎯 Start │ 🎭 Orch  │ 📊 Status│ 🔄 Sync  │ ⚙️  Next  │
│  Miyabi  │  Mode    │  Check   │   All    │ Profile  │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🌸 Agent │ 🍁 Agent │ 🌺 Agent │ 🌊 MUGEN │ ⚡ MAJIN │
│  Tsubaki │  Kaede   │  Sakura  │  SSH     │  SSH     │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 📝 Issue │ 💬 Lark  │ 🎤 Voice │ 🚀 Deploy│ 🛑 Stop  │
│  Create  │  Notify  │  Input   │   Now    │   All    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Button Actions:

1. **🎯 Start Miyabi** - `cd ~/Dev/miyabi-private && claude`
2. **🎭 Orchestra Mode** - Launch full orchestra (14 agents)
3. **📊 Status Check** - System health + metrics
4. **🔄 Sync All** - Git sync + dependency update
5. **⚙️ Next Profile** - Switch to Profile 2

6. **🌸 Tsubaki Agent** - Message to Tsubaki pane
7. **🍁 Kaede Agent** - Message to Kaede pane
8. **🌺 Sakura Agent** - Message to Sakura pane
9. **🌊 MUGEN Terminal** - SSH to MUGEN (3a coordinator)
10. **⚡ MAJIN Terminal** - SSH to MAJIN (3b coordinator)

11. **📝 Issue Create** - Voice → GitHub Issue
12. **💬 Lark Notify** - Send notification to Lark team
13. **🎤 Voice Input** - Trigger Pixel voice input
14. **🚀 Deploy Now** - Execute deployment pipeline
15. **🛑 Stop All** - Emergency stop all processes

---

## 🎮 Profile 2: Agent Control

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🏢 Strat │ 📣 Market│ 💼 Sales │ 📊 Growth│ ⬅️  Back  │
│  Planner │   Mgr    │   Mgr    │ Analyst  │  Main    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🎨 Brand │ 📝 Content│ 🔍 Market│ 📈 Insight│ 💰 Pricing│
│  Manager │  Creator │ Research │ Analyst  │ Strategist│
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 👥 CRM   │ 📞 Lead  │ 🎯 Campaign│📱 Social│ 🔄 Restart│
│  Manager │  Manager │  Mgr     │  Media   │  Agent   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Button Actions:

1-14. **Individual Business Agents** - Start/Stop/Message specific agent
15. **🔄 Restart Agent** - Restart selected agent

---

## 🛠️ Profile 3: Development Tools

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🏗️  Build │ 🧪 Test  │ 🔍 Lint  │ 📦 Package│ ⬅️  Back │
│   All    │   All    │  Check   │  Release │  Main    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🌿 Branch│ 🔀 Merge │ 📤 Push  │ 📥 Pull  │ 🏷️  Tag  │
│  Create  │    PR    │  Remote  │  Origin  │  Version │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🐛 Debug │ 📊 Profile│ 🔐 Security│ 📚 Docs │ 🧹 Clean │
│   Mode   │    Run   │  Audit   │  Generate│   Build  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Button Actions:

1. **🏗️ Build All** - `cargo build --all --release`
2. **🧪 Test All** - `cargo test --all`
3. **🔍 Lint Check** - `cargo clippy -- -D warnings`
4. **📦 Package Release** - Create release package
5. **⬅️ Back** - Return to Main Dashboard

6. **🌿 Branch Create** - Create new git worktree
7. **🔀 Merge PR** - Merge active PR
8. **📤 Push Remote** - Git push to origin
9. **📥 Pull Origin** - Git pull from origin
10. **🏷️ Tag Version** - Create version tag

11. **🐛 Debug Mode** - Enable verbose logging
12. **📊 Profile Run** - Performance profiling
13. **🔐 Security Audit** - Run cargo audit
14. **📚 Docs Generate** - Generate documentation
15. **🧹 Clean Build** - Clean artifacts

---

## 📊 Profile 4: Monitoring & Alerts

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 💻 CPU   │ 🧠 Memory│ 💾 Disk  │ 🌐 Network│ ⬅️  Back │
│  Usage   │  Usage   │  Usage   │  Status  │  Main    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 📈 Metrics│ 📉 Logs  │ 🚨 Alerts│ 🔔 Notify│ 📧 Email │
│  Dashboard│  View    │  Check   │  Team    │  Report  │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🔥 P0    │ 🟡 P1    │ 🟢 P2    │ 🔵 Info  │ 📊 Export│
│  Issues  │  Issues  │  Issues  │  Log     │  Data    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Button Actions:

1. **💻 CPU Usage** - Display CPU metrics
2. **🧠 Memory Usage** - Display memory metrics
3. **💾 Disk Usage** - Display disk usage
4. **🌐 Network Status** - Network connectivity check
5. **⬅️ Back** - Return to Main Dashboard

6. **📈 Metrics Dashboard** - Open metrics dashboard
7. **📉 Logs View** - Tail system logs
8. **🚨 Alerts Check** - Check active alerts
9. **🔔 Notify Team** - Send team notification
10. **📧 Email Report** - Send status report

11-13. **Priority Issues** - Filter by priority
14. **🔵 Info Log** - View info logs
15. **📊 Export Data** - Export metrics

---

## ⚡ Profile 5: Quick Actions

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ ♻️  Restart│ 🔄 Reload│ 🔧 Repair│ 🆘 SOS   │ ⬅️  Back │
│  System  │  Config  │  Fix     │  Mode    │  Main    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 📸 Screen│ 🎥 Record│ 📋 Copy  │ 📎 Paste │ 💾 Save  │
│   Shot   │  Session │  Output  │  Cmd     │  State   │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🔊 Voice │ 🔇 Mute  │ 🎵 Alert │ 📱 Phone │ 💬 Chat  │
│  On      │  All     │  Sound   │  Call    │  Open    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Button Actions:

1. **♻️ Restart System** - Graceful restart
2. **🔄 Reload Config** - Reload all configs
3. **🔧 Repair Fix** - Auto-repair common issues
4. **🆘 SOS Mode** - Emergency contact + diagnostics
5. **⬅️ Back** - Return to Main Dashboard

6-10. **Media Controls** - Screenshot, recording, clipboard
11-15. **Communication** - Voice, chat, phone integration

---

## 📝 Installation Instructions

1. **Copy all scripts to Mac:**
   ```bash
   cd ~/Dev/miyabi-private/scripts/streamdeck
   chmod +x *.sh
   ```

2. **Open Stream Deck App**

3. **Create 5 Profiles:**
   - Right-click device → Create Profile
   - Name: `Miyabi-Main`, `Miyabi-Agents`, `Miyabi-Dev`, `Miyabi-Monitor`, `Miyabi-Quick`

4. **Configure Each Button:**
   - Drag "System → Open" action
   - Path: `/path/to/script.sh`
   - Icon: Choose from library or custom

5. **Add Profile Switch Buttons:**
   - Use "Stream Deck → Switch Profile" action
   - Link profiles together

---

## 🎨 Visual Design Guidelines

### Color Coding:
- 🔴 **Red**: Critical/Stop/Delete
- 🟢 **Green**: Start/Success/Safe
- 🔵 **Blue**: Information/Status
- 🟡 **Yellow**: Warning/Caution
- ⚫ **Black**: System/Admin

### Icon Strategy:
- Use emoji for quick recognition
- Consistent icon families per category
- High contrast for readability

---

## 🔧 Customization

Edit individual scripts in:
```
~/Dev/miyabi-private/scripts/streamdeck/
```

Each script is self-contained and can be modified independently.

---

## 🚨 Emergency Protocol

**If something goes wrong:**
1. Press **🛑 Stop All** (Main Profile, Button 15)
2. Check **📊 Status** (Main Profile, Button 3)
3. Review **📉 Logs** (Monitor Profile, Button 7)
4. If critical: Press **🆘 SOS Mode** (Quick Profile, Button 4)

---

**Total Control at Your Fingertips** 🎮✨
