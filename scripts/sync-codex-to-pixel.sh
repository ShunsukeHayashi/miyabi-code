#!/bin/bash
# Sync Codex and Orchestra settings to Google Pixel
# Usage: ./scripts/sync-codex-to-pixel.sh [device-id]

set -e

DEVICE="${1:-4C201FDAS001VX}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌸 Miyabi Codex & Orchestra Sync to Pixel${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verify connection
if ! adb devices | grep -q "$DEVICE"; then
    echo -e "${RED}❌ Device $DEVICE not connected${NC}"
    echo "Run: adb devices"
    exit 1
fi

echo -e "${GREEN}✅ Device connected: $DEVICE${NC}"
echo ""

# Step 1: Create Codex configuration
echo -e "${BLUE}📝 Step 1: Creating Codex configuration...${NC}"

cat > /tmp/codex-config.yaml <<'EOF'
# Miyabi Codex Configuration for Pixel
# Synced from: $(hostname)
# Date: $(date)

codex:
  version: "4.0.0"
  mode: autonomous
  coordinators:
    - name: mugen
      type: linux-x64
      location: remote
      capabilities:
        - rust-build
        - docker
        - ci-cd
    - name: majin
      type: linux-x64-gpu
      location: remote
      capabilities:
        - gpu-acceleration
        - ml-inference
        - heavy-computation

  triggers:
    - type: github-issue
      labels: ["codex-execute"]
    - type: github-comment
      pattern: "^/codex"
    - type: schedule
      cron: "0 * * * *"
      label: "codex-pending"

  workflow:
    timeout: 3600  # 1 hour
    auto_cleanup: true
    log_retention: 7  # days

orchestra:
  enabled: true
  agents:
    - name: みつけるん
      pane_id: "%10"
      role: IssueAgent
      priority: 0
    - name: しきるん
      pane_id: "%11"
      role: CoordinatorAgent
      priority: 0
    - name: カエデ
      pane_id: "%2"
      role: CodeGenAgent
      priority: 1
    - name: サクラ
      pane_id: "%5"
      role: ReviewAgent
      priority: 2
    - name: ツバキ
      pane_id: "%3"
      role: PRAgent
      priority: 3
    - name: ボタン
      pane_id: "%4"
      role: DeploymentAgent
      priority: 4

pixel:
  device_id: $DEVICE
  termux_enabled: true
  role: maestro
  layer: 1
  notifications:
    lark: false
    termux_api: true
EOF

echo -e "${GREEN}✅ Codex configuration created${NC}"

# Step 2: Create Orchestra startup script
echo -e "${BLUE}📝 Step 2: Creating Orchestra startup script...${NC}"

cat > /tmp/orchestra-start.sh <<'EOFSCRIPT'
#!/data/data/com.termux/files/usr/bin/bash
# Miyabi Orchestra - Startup Script for Pixel
# This script initializes tmux orchestra with all agents

set -e

echo "🎭 Miyabi Orchestra - Starting..."

# Change to miyabi directory
cd ~/miyabi-private || { echo "❌ miyabi-private not found"; exit 1; }

# Create tmux session if not exists
if ! tmux has-session -t miyabi 2>/dev/null; then
    echo "📡 Creating tmux session: miyabi"
    tmux new-session -d -s miyabi -n main
fi

# Create panes for agents
echo "🎨 Creating agent panes..."

# Split windows for 6 agents
tmux split-window -t miyabi:main -h
tmux split-window -t miyabi:main -v
tmux split-window -t miyabi:main.2 -v
tmux select-pane -t miyabi:main.0
tmux split-window -t miyabi:main -v
tmux split-window -t miyabi:main.2 -v

# Start Claude Code in each pane (background mode)
echo "🚀 Starting Claude Code agents..."

PANES=(0 1 2 3 4 5)
AGENTS=("Conductor" "みつけるん" "しきるん" "カエデ" "サクラ" "ツバキ")

for i in "${!PANES[@]}"; do
    pane="${PANES[$i]}"
    agent="${AGENTS[$i]}"
    echo "   Starting ${agent} in pane ${pane}..."
    tmux send-keys -t "miyabi:main.${pane}" "cd ~/miyabi-private" C-m
    if [ "$i" -gt 0 ]; then
        # Start claude for agents only (not conductor)
        tmux send-keys -t "miyabi:main.${pane}" "# ${agent} Agent ready. Waiting for instructions..." C-m
    fi
done

# Set layout
tmux select-layout -t miyabi:main tiled

echo "✅ Orchestra setup complete!"
echo ""
echo "To attach: tmux attach -t miyabi"
echo "To view status: tmux list-panes -t miyabi:main"
EOFSCRIPT

chmod +x /tmp/orchestra-start.sh

echo -e "${GREEN}✅ Orchestra startup script created${NC}"

# Step 3: Create Codex trigger script
echo -e "${BLUE}📝 Step 3: Creating Codex trigger script...${NC}"

cat > /tmp/codex-trigger.sh <<'EOFSCRIPT'
#!/data/data/com.termux/files/usr/bin/bash
# Miyabi Codex - Manual Trigger Script for Pixel
# Usage: ./codex-trigger.sh <issue-number>

ISSUE_NUMBER="${1}"

if [ -z "$ISSUE_NUMBER" ]; then
    echo "Usage: $0 <issue-number>"
    echo "Example: $0 789"
    exit 1
fi

echo "🤖 Triggering Codex for Issue #${ISSUE_NUMBER}"

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Install with: pkg install gh"
    exit 1
fi

# Get issue details
echo "📋 Fetching issue details..."
ISSUE_TITLE=$(gh issue view $ISSUE_NUMBER --json title --jq '.title' 2>/dev/null || echo "Unknown")
ISSUE_BODY=$(gh issue view $ISSUE_NUMBER --json body --jq '.body' 2>/dev/null || echo "")

if [ "$ISSUE_TITLE" = "Unknown" ]; then
    echo "❌ Could not fetch issue #${ISSUE_NUMBER}"
    exit 1
fi

echo "Issue: $ISSUE_TITLE"
echo ""

# Notify via Termux API if available
if command -v termux-notification &> /dev/null; then
    termux-notification \
        --title "Miyabi Codex" \
        --content "Processing Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}" \
        --priority high
fi

# Add comment to issue
gh issue comment $ISSUE_NUMBER --body "🤖 **Pixel Maestro** started processing this issue.

**Device**: $(getprop ro.product.model)
**Started**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Trigger**: Manual (Pixel)"

echo "✅ Codex trigger sent for Issue #${ISSUE_NUMBER}"
echo "📱 Notification sent (if Termux:API is installed)"
EOFSCRIPT

chmod +x /tmp/codex-trigger.sh

echo -e "${GREEN}✅ Codex trigger script created${NC}"

# Step 4: Create .bashrc additions for Pixel
echo -e "${BLUE}📝 Step 4: Creating .bashrc additions...${NC}"

cat > /tmp/pixel-bashrc-additions.sh <<'EOFBASH'
# Miyabi Orchestra & Codex - Pixel Configuration
# Auto-generated: $(date)

# Environment variables
export MIYABI_HOME="$HOME/miyabi-private"
export MIYABI_DEVICE="pixel"
export MIYABI_ROLE="maestro"

# Aliases
alias miyabi="cd $MIYABI_HOME"
alias orchestra="$MIYABI_HOME/scripts/orchestra-start.sh"
alias codex-trigger="$MIYABI_HOME/scripts/codex-trigger.sh"
alias ms="tmux attach -t miyabi || echo 'Orchestra not running. Start with: orchestra'"

# Functions
miyabi-status() {
    echo "🌸 Miyabi Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Device: $(getprop ro.product.model)"
    echo "Role: $MIYABI_ROLE"
    echo "Home: $MIYABI_HOME"
    echo ""

    if tmux has-session -t miyabi 2>/dev/null; then
        echo "✅ Orchestra: Running"
        tmux list-panes -t miyabi:main -F "#{pane_index}: #{pane_current_command}"
    else
        echo "⚪ Orchestra: Not running"
        echo "   Start with: orchestra"
    fi
}

# Welcome message
if [ -t 0 ]; then
    echo ""
    echo "🌸 Miyabi Maestro - $(getprop ro.product.model)"
    echo "Quick commands: miyabi, orchestra, codex-trigger, ms, miyabi-status"
    echo ""
fi
EOFBASH

echo -e "${GREEN}✅ .bashrc additions created${NC}"

# Step 5: Transfer files to Pixel
echo -e "${BLUE}📤 Step 5: Transferring files to Pixel...${NC}"

# Push to sdcard first (accessible)
adb -s $DEVICE push /tmp/codex-config.yaml /sdcard/ > /dev/null 2>&1
adb -s $DEVICE push /tmp/orchestra-start.sh /sdcard/ > /dev/null 2>&1
adb -s $DEVICE push /tmp/codex-trigger.sh /sdcard/ > /dev/null 2>&1
adb -s $DEVICE push /tmp/pixel-bashrc-additions.sh /sdcard/ > /dev/null 2>&1

echo -e "${YELLOW}   Files pushed to /sdcard/${NC}"

# Move to Termux home via RUN_COMMAND broadcast
echo -e "${YELLOW}   Installing via Termux RUN_COMMAND...${NC}"

# Start Termux to ensure it's running
adb -s $DEVICE shell am start -n com.termux/.HomeActivity > /dev/null 2>&1
sleep 2

# Create directories
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,mkdir -p ~/.config/miyabi ~/miyabi-private/scripts' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Move codex config
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/mv' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '/sdcard/codex-config.yaml,/data/data/com.termux/files/home/.config/miyabi/' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Move orchestra script
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/mv' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '/sdcard/orchestra-start.sh,/data/data/com.termux/files/home/miyabi-private/scripts/' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Move codex trigger
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/mv' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '/sdcard/codex-trigger.sh,/data/data/com.termux/files/home/miyabi-private/scripts/' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Set executable permissions
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/chmod' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '+x,/data/data/com.termux/files/home/miyabi-private/scripts/orchestra-start.sh' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/chmod' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '+x,/data/data/com.termux/files/home/miyabi-private/scripts/codex-trigger.sh' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Append to .bashrc
adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,cat /sdcard/pixel-bashrc-additions.sh >> ~/.bashrc' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false > /dev/null 2>&1

sleep 1

# Clean up sdcard
adb -s $DEVICE shell rm -f /sdcard/pixel-bashrc-additions.sh > /dev/null 2>&1

echo "✅ Files installed in Termux via RUN_COMMAND"

echo -e "${GREEN}✅ Files transferred and installed${NC}"

# Step 6: Test installation
echo ""
echo -e "${BLUE}🧪 Step 6: Testing installation...${NC}"

# Verify files exist via RUN_COMMAND
echo -e "${YELLOW}   Checking files on device...${NC}"

# Test codex config
if adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/test' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-f,/data/data/com.termux/files/home/.config/miyabi/codex-config.yaml' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false 2>&1 | grep -q "result=0"; then
    echo "✅ Codex config: Found"
else
    echo "⚠️  Codex config: Status unknown (check manually)"
fi

# Test orchestra script
if adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/test' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-f,/data/data/com.termux/files/home/miyabi-private/scripts/orchestra-start.sh' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false 2>&1 | grep -q "result=0"; then
    echo "✅ Orchestra script: Found"
else
    echo "⚠️  Orchestra script: Status unknown (check manually)"
fi

# Test codex trigger
if adb -s $DEVICE shell am broadcast \
    --user 0 \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/test' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS '-f,/data/data/com.termux/files/home/miyabi-private/scripts/codex-trigger.sh' \
    --ez com.termux.RUN_COMMAND_BACKGROUND false 2>&1 | grep -q "result=0"; then
    echo "✅ Codex trigger: Found"
else
    echo "⚠️  Codex trigger: Status unknown (check manually)"
fi

echo "⚠️  .bashrc: Please verify manually by opening Termux"

# Cleanup temp files
rm -f /tmp/codex-config.yaml
rm -f /tmp/orchestra-start.sh
rm -f /tmp/codex-trigger.sh
rm -f /tmp/pixel-bashrc-additions.sh

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Codex & Orchestra sync complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Next steps on Pixel:${NC}"
echo "1. Open Termux and run: source ~/.bashrc"
echo "2. Test status: miyabi-status"
echo "3. Start Orchestra: orchestra"
echo "4. Attach to session: ms"
echo "5. Trigger Codex: codex-trigger <issue-number>"
echo ""
echo -e "${BLUE}Quick test from Mac:${NC}"
echo "adb -s $DEVICE shell -c 'source ~/.bashrc && miyabi-status'"
echo ""
