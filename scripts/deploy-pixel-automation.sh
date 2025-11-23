#!/bin/bash
# Pixel Full Automation Deployment Script
# Run this on MacBook to deploy all scripts to Pixel

set -e

PIXEL_HOST="pixel"  # SSH config で設定されているホスト名

echo "🚀 Deploying Miyabi Full Automation to Pixel..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# スクリプトファイルをPixelに転送
echo "📁 Creating directories on Pixel..."
ssh $PIXEL_HOST "mkdir -p ~/.termux/tasker ~/.miyabi/automation/{services,triggers,monitors,logs,pids,state} ~/.shortcuts"

echo "📤 Uploading scripts..."

# 1. Miyabi Auto-start
scp /tmp/pixel-miyabi-autostart.sh $PIXEL_HOST:~/.termux/tasker/miyabi-autostart.sh
echo "  ✅ miyabi-autostart.sh"

# 2. Battery Monitor
scp /tmp/pixel-battery-monitor.sh $PIXEL_HOST:~/.miyabi/automation/services/battery-monitor.sh
echo "  ✅ battery-monitor.sh"

# 3. GitHub Monitor
scp /tmp/pixel-github-monitor.sh $PIXEL_HOST:~/.miyabi/automation/services/github-monitor.sh
echo "  ✅ github-monitor.sh"

# 4. Master Control
scp /tmp/pixel-automation-master.sh $PIXEL_HOST:~/.termux/tasker/automation-master.sh
echo "  ✅ automation-master.sh"

# 実行権限付与
echo "🔐 Setting execute permissions..."
ssh $PIXEL_HOST "chmod +x ~/.termux/tasker/*.sh ~/.miyabi/automation/services/*.sh"

# Termux:Widget用ショートカット作成
echo "🎨 Creating widget shortcuts..."
ssh $PIXEL_HOST 'cat > ~/.shortcuts/miyabi-start.sh << "EOF"
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/miyabi-autostart.sh
EOF'

ssh $PIXEL_HOST 'cat > ~/.shortcuts/automation-status.sh << "EOF"
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/automation-master.sh status
EOF'

ssh $PIXEL_HOST "chmod +x ~/.shortcuts/*.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo ""
echo "Next steps on Pixel:"
echo ""
echo "1. Install Tasker apps from Google Play:"
echo "   - Tasker"
echo "   - Termux:API"
echo "   - Termux:Tasker"
echo "   - Termux:Widget (optional)"
echo ""
echo "2. Install Termux packages:"
echo "   pkg install termux-api jq"
echo ""
echo "3. Test scripts:"
echo "   ~/.termux/tasker/miyabi-autostart.sh"
echo "   ~/.termux/tasker/automation-master.sh status"
echo ""
echo "4. Configure Tasker profiles (see guide below)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
