# ADB Quick Reference - Pixel Maestro Control

**Quick commands you can run from your Mac right now**

---

## 🚀 Setup (One-time)

```bash
cd ~/Dev/01-miyabi/_core/miyabi-private

# On Pixel: Enable "Wireless debugging" and get pairing code
# Then run:
./scripts/connect-pixel-adb.sh 123456  # Replace with your code
```

---

## 📊 Daily Commands

### Check Pixel Status
```bash
./scripts/pixel-maestro-control.sh status
```

### Execute Command on Pixel
```bash
# Check what's running
./scripts/pixel-maestro-control.sh termux "ps aux | grep miyabi"

# Check battery
./scripts/pixel-maestro-control.sh termux "termux-battery-status"

# Run Miyabi status
./scripts/pixel-maestro-control.sh miyabi status
```

### Send Notification to Pixel
```bash
./scripts/pixel-maestro-control.sh notify "Test" "Hello from Mac!"
```

### Take Screenshot
```bash
./scripts/pixel-maestro-control.sh screenshot my-screen.png
open my-screen.png  # View it
```

### Open Apps
```bash
./scripts/pixel-maestro-control.sh open-lark    # Open Lark
./scripts/pixel-maestro-control.sh open-termux  # Open Termux
```

### Monitor Real-time
```bash
./scripts/pixel-maestro-control.sh monitor
# Updates every 5 seconds
# Press Ctrl-C to stop
```

---

## 🔧 Advanced

### Get Pixel Logs
```bash
./scripts/pixel-maestro-control.sh logs
ls logs/pixel/  # View collected logs
```

### Run Script on Pixel
```bash
./scripts/pixel-maestro-control.sh termux "
    cd ~/miyabi-private
    git status
    miyabi status
    echo 'All done!'
"
```

### Check if Connected
```bash
adb devices

# Output should show:
# 192.168.3.9:43215   device
```

### Reconnect
```bash
./scripts/connect-pixel-adb.sh
```

---

## 🎯 Real Examples

### Example 1: Check Everything
```bash
./scripts/pixel-maestro-control.sh status && \
./scripts/pixel-maestro-control.sh miyabi status
```

### Example 2: Notify + Screenshot
```bash
./scripts/pixel-maestro-control.sh notify "Taking Screenshot" "Capturing Pixel screen now" && \
sleep 2 && \
./scripts/pixel-maestro-control.sh screenshot pixel-state.png
```

### Example 3: Monitor While Working
```bash
# Terminal 1: Monitor Pixel
./scripts/pixel-maestro-control.sh monitor

# Terminal 2: Your work
miyabi execute 1030
```

---

## 🆘 Troubleshooting

```bash
# Not connected?
./scripts/connect-pixel-adb.sh

# Still not working?
adb kill-server
adb start-server
./scripts/connect-pixel-adb.sh

# Check devices
adb devices -l
```

---

## 🌸 Integration with Workflows

```bash
# Before running workflow, notify Pixel:
./scripts/pixel-maestro-control.sh notify "Workflow Starting" "Issue #1030"

# Run workflow
gh workflow run codex-autonomous-coordinator.yml -f issue_number=1030

# After 30 seconds, screenshot result
sleep 30 && ./scripts/pixel-maestro-control.sh screenshot result-1030.png
```

---

**Tip**: Add alias to your `~/.zshrc`:

```bash
alias pixel='cd ~/Dev/01-miyabi/_core/miyabi-private && ./scripts/pixel-maestro-control.sh'

# Then use:
# pixel status
# pixel screenshot
# pixel notify "Title" "Message"
```

🌸 **Quick, Easy, Powerful** 🌸
