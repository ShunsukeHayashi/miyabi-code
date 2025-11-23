# 🌸 Pixel Codex & Orchestra Setup Guide

**Last Updated**: 2025-11-17
**Device**: Google Pixel (4C201FDAS001VX)
**Purpose**: Miyabi Codex autonomous execution on Pixel Maestro device

---

## ✅ Files Transferred

All configuration files have been transferred to Pixel's `/sdcard/`:

- ✅ `codex-config.yaml` - Codex configuration
- ✅ `orchestra-start.sh` - Orchestra startup script
- ✅ `codex-trigger.sh` - Manual Codex trigger script
- ✅ `pixel-bashrc-additions.sh` - Bash environment configuration
- ✅ `pixel-install-helper.sh` - Automated installation script

---

## 📱 Installation Steps on Pixel

### Step 1: Open Termux on Pixel

Launch the Termux app on your Pixel device.

### Step 2: Setup Storage Access

```bash
termux-setup-storage
```

**Important**: Grant storage permission when prompted. This allows Termux to access files in `/sdcard/`.

### Step 3: Run the Installation Helper

```bash
# Copy installer from sdcard to home
cp ~/storage/shared/pixel-install-helper.sh ~/

# Make it executable
chmod +x ~/pixel-install-helper.sh

# Run installation
~/pixel-install-helper.sh
```

### Step 4: Reload Shell Configuration

```bash
source ~/.bashrc
```

---

## 🎯 Available Commands

After installation, the following commands will be available:

### Navigation
- `miyabi` - Change to Miyabi project directory
- `ms` - Attach to tmux Orchestra session (short for "Miyabi Session")

### Orchestra Operations
- `orchestra` - Start Miyabi Orchestra (tmux multi-agent system)
- `miyabi-status` - Display current Miyabi system status

### Codex Operations
- `codex-trigger <issue-number>` - Manually trigger Codex for a GitHub Issue

---

## 🔍 Verify Installation

```bash
# Check system status
miyabi-status
```

**Expected Output**:
```
🌸 Miyabi Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device: Pixel 9 Pro XL (or your model)
Role: maestro
Home: /data/data/com.termux/files/home/miyabi-private

⚪ Orchestra: Not running
   Start with: orchestra
```

---

## 🎭 Starting Orchestra

```bash
# Start Orchestra (creates tmux session with 6 agent panes)
orchestra

# Attach to Orchestra session
ms
# or
tmux attach -t miyabi
```

### Orchestra Layout

Once started, you'll have 6 panes:

| Pane | Agent | Role |
|------|-------|------|
| 0 | Conductor | Main control |
| 1 | みつけるん | IssueAgent |
| 2 | しきるん | CoordinatorAgent |
| 3 | カエデ | CodeGenAgent |
| 4 | サクラ | ReviewAgent |
| 5 | ツバキ | PRAgent |

---

## 🤖 Using Codex

### Manual Trigger

```bash
# Trigger Codex for a specific issue
codex-trigger 789

# This will:
# 1. Fetch issue details from GitHub
# 2. Send notification (if Termux:API installed)
# 3. Add comment to the issue
```

### Automatic Trigger (via GitHub Actions)

Codex can also be triggered automatically:
- When an issue is labeled with `codex-execute`
- When a comment `/codex` is posted on an issue
- Every hour for issues labeled `codex-pending`

---

## 📋 Configuration Files

### Codex Configuration

Location: `~/.config/miyabi/codex-config.yaml`

```yaml
codex:
  version: "4.0.0"
  mode: autonomous
  coordinators:
    - name: mugen
      type: linux-x64
    - name: majin
      type: linux-x64-gpu

orchestra:
  enabled: true
  agents: [6 agents configured]

pixel:
  device_id: 4C201FDAS001VX
  role: maestro
  layer: 1
```

### Orchestra Scripts

Location: `~/miyabi-private/scripts/`

- `orchestra-start.sh` - Initializes tmux session with all agents
- `codex-trigger.sh` - Manual Codex execution trigger

---

## 🔧 Troubleshooting

### Issue: "Permission denied" when running scripts

**Solution**:
```bash
chmod +x ~/miyabi-private/scripts/*.sh
```

### Issue: "Storage not setup" error

**Solution**:
```bash
termux-setup-storage
# Grant permission when prompted
```

### Issue: "miyabi-status: command not found"

**Solution**:
```bash
source ~/.bashrc
```

### Issue: GitHub CLI not authenticated

**Solution**:
```bash
gh auth login
# Follow the prompts to authenticate with GitHub
```

---

## 📱 Optional: Install Termux:API

For enhanced notifications and mobile integration:

1. Install **Termux:API** app from F-Droid or Google Play
2. In Termux, install the package:
   ```bash
   pkg install termux-api
   ```

3. Test notification:
   ```bash
   termux-notification --title "Miyabi" --content "Test notification"
   ```

---

## 🔗 Integration with Mac

### From Mac: Trigger Codex on Pixel

```bash
# Push a new issue to Pixel for processing
adb shell -c "cd ~/miyabi-private && ./scripts/codex-trigger.sh 789"
```

### From Mac: Check Pixel Status

```bash
adb shell -c "source ~/.bashrc && miyabi-status"
```

### From Mac: View Orchestra

```bash
# Attach to Pixel's tmux session via adb
adb shell -t "tmux attach -t miyabi"
```

---

## 📊 System Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Issue Tracker            │
│     (codex-execute / codex-pending)     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼──────┐    ┌────────▼───────┐
│ GitHub       │    │ Pixel Maestro  │
│ Actions      │    │ (Manual)       │
│ (MUGEN/MAJIN)│    │ codex-trigger  │
└──────────────┘    └────────────────┘
        │                    │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  Codex Autonomous  │
        │    Execution       │
        │  (Claude Code)     │
        └────────────────────┘
                  │
        ┌─────────▼──────────┐
        │ Miyabi Orchestra   │
        │ (6 tmux Agents)    │
        └────────────────────┘
```

---

## 🎯 Next Steps

1. **Test Orchestra**: `orchestra` → `ms`
2. **Test Codex**: `codex-trigger 789` (replace with actual issue number)
3. **Monitor Logs**: Check `/data/data/com.termux/files/home/.miyabi/logs/` (if exists)
4. **Setup GitHub CLI**: `gh auth login` for full integration

---

## 📝 Quick Reference Card

```bash
# Navigation
miyabi          # → cd ~/miyabi-private
ms              # → tmux attach -t miyabi

# Status
miyabi-status   # Show system status

# Orchestra
orchestra       # Start tmux orchestra
tmux ls         # List tmux sessions
tmux kill-session -t miyabi  # Stop orchestra

# Codex
codex-trigger 789   # Trigger for issue #789

# Updates
cd ~/miyabi-private
git pull
source ~/.bashrc
```

---

**🌸 Miyabi Maestro - Pixel Edition**
**Ready for autonomous development operations**
