#!/data/data/com.termux/files/usr/bin/bash
# Miyabi - Pixel Termux Setup Script
# Run this on Google Pixel Termux

set -e

echo "================================"
echo "Miyabi Pixel Setup (Layer 1)"
echo "================================"
echo ""

# 1. Update packages
echo "[1/8] Updating packages..."
pkg update -y
pkg upgrade -y

# 2. Install required packages
echo "[2/8] Installing required packages..."
pkg install -y \
  openssh \
  git \
  jq \
  curl \
  termux-api \
  nodejs \
  python

# 3. Setup SSH keys for Mac connection
echo "[3/8] Setting up SSH keys..."
if [ ! -f ~/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
  echo "SSH key generated: ~/.ssh/id_rsa.pub"
  echo "Copy this to Mac's ~/.ssh/authorized_keys"
  cat ~/.ssh/id_rsa.pub
fi

# 4. Create Miyabi directory structure
echo "[4/8] Creating directory structure..."
mkdir -p ~/miyabi/{tasks,logs,shortcuts,notifications}

# 5. Create task submission script
echo "[5/8] Creating task submission script..."
cat > ~/miyabi/shortcuts/submit-task.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Task submission script

TASK_NAME=$1
TASK_TYPE=${2:-general}
MAC_HOST="shunsuke@192.168.3.XXX"  # Update with Mac IP
MAC_TASK_DIR="/Users/shunsuke/Dev/miyabi-private/.claude/tasks/pending"

# Generate task JSON
TASK_ID="task-$(date +%Y%m%d-%H%M%S)"
TASK_FILE="/tmp/${TASK_ID}.json"

cat > "$TASK_FILE" << EOFTASK
{
  "task_id": "${TASK_ID}",
  "created_at": "$(date -Iseconds)",
  "from": "pixel-maestro",
  "to": "orchestrator",
  "priority": "P2",
  "directive": "${TASK_NAME}",
  "execution": {
    "type": "headless",
    "task_type": "${TASK_TYPE}"
  },
  "status": "pending",
  "notification": {
    "device": "pixel",
    "method": "termux-notification"
  }
}
EOFTASK

# Submit to Mac Orchestrator
echo "Submitting task: ${TASK_NAME}..."
scp "$TASK_FILE" "${MAC_HOST}:${MAC_TASK_DIR}/"

if [ $? -eq 0 ]; then
  termux-notification \
    --title "Task Submitted" \
    --content "${TASK_NAME}" \
    --priority high

  echo "✅ Task submitted: ${TASK_ID}"
else
  termux-notification \
    --title "Task Submission Failed" \
    --content "${TASK_NAME}" \
    --priority max

  echo "❌ Failed to submit task"
  exit 1
fi
EOF

chmod +x ~/miyabi/shortcuts/submit-task.sh

# 6. Create notification receiver script
echo "[6/8] Creating notification receiver..."
cat > ~/miyabi/shortcuts/receive-notification.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Notification receiver (run as daemon)

MAC_HOST="shunsuke@192.168.3.XXX"  # Update with Mac IP
NOTIFICATION_DIR="/Users/shunsuke/Dev/miyabi-private/.claude/notifications"

while true; do
  # Poll for new notifications
  ssh "${MAC_HOST}" "ls -1 ${NOTIFICATION_DIR}/*.json 2>/dev/null" | while read notif_file; do
    # Download notification
    temp_file="/tmp/notification_$(date +%s).json"
    scp "${MAC_HOST}:${notif_file}" "$temp_file"

    # Parse and display
    title=$(jq -r '.title' "$temp_file")
    content=$(jq -r '.content' "$temp_file")
    priority=$(jq -r '.priority // "default"' "$temp_file")

    termux-notification \
      --title "$title" \
      --content "$content" \
      --priority "$priority"

    # Mark as delivered
    ssh "${MAC_HOST}" "mv ${notif_file} ${notif_file}.delivered"

    rm "$temp_file"
  done

  sleep 30
done
EOF

chmod +x ~/miyabi/shortcuts/receive-notification.sh

# 7. Create shortcut examples
echo "[7/8] Creating shortcut examples..."

# Weekly report
cat > ~/miyabi/shortcuts/weekly-report.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
~/miyabi/shortcuts/submit-task.sh "週次レポート生成" "report"
EOF
chmod +x ~/miyabi/shortcuts/weekly-report.sh

# Create issues
cat > ~/miyabi/shortcuts/create-issues.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
~/miyabi/shortcuts/submit-task.sh "GitHubイシュー一括作成" "batch"
EOF
chmod +x ~/miyabi/shortcuts/create-issues.sh

# Code quality check
cat > ~/miyabi/shortcuts/code-quality.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
~/miyabi/shortcuts/submit-task.sh "コード品質チェック" "analysis"
EOF
chmod +x ~/miyabi/shortcuts/code-quality.sh

# 8. Setup startup script
echo "[8/8] Creating startup script..."
cat > ~/miyabi/start-maestro.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Miyabi Maestro Startup Script

echo "🌸 Starting Miyabi Maestro (Layer 1)..."

# Start notification receiver in background
nohup ~/miyabi/shortcuts/receive-notification.sh > ~/miyabi/logs/notifications.log 2>&1 &
echo $! > ~/miyabi/.maestro.pid

echo "✅ Maestro started"
echo "PID: $(cat ~/miyabi/.maestro.pid)"
echo ""
echo "Available shortcuts:"
echo "  ~/miyabi/shortcuts/weekly-report.sh"
echo "  ~/miyabi/shortcuts/create-issues.sh"
echo "  ~/miyabi/shortcuts/code-quality.sh"
echo ""
echo "Stop with: kill $(cat ~/miyabi/.maestro.pid)"
EOF

chmod +x ~/miyabi/start-maestro.sh

echo ""
echo "================================"
echo "Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update Mac IP in:"
echo "   - ~/miyabi/shortcuts/submit-task.sh"
echo "   - ~/miyabi/shortcuts/receive-notification.sh"
echo ""
echo "2. Copy SSH public key to Mac:"
echo "   cat ~/.ssh/id_rsa.pub"
echo ""
echo "3. Start Maestro:"
echo "   ~/miyabi/start-maestro.sh"
echo ""
echo "4. Test shortcuts:"
echo "   ~/miyabi/shortcuts/weekly-report.sh"
echo ""
