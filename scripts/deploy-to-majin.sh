#!/bin/bash
# Deploy script for MAJIN
# Run on: Mac Local (will SCP and SSH to MAJIN)

set -e

echo "🚀 Deploying Lark Event Handler to MAJIN..."

MAJIN_HOST="majin"
REMOTE_DIR="/home/ubuntu/miyabi-events"
LOCAL_SCRIPT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/scripts/lark-event-handler.js"

# 1. Create remote directory
echo "📁 Creating remote directory..."
ssh $MAJIN_HOST "mkdir -p $REMOTE_DIR"

# 2. Copy event handler script
echo "📤 Copying event handler script..."
scp $LOCAL_SCRIPT $MAJIN_HOST:$REMOTE_DIR/

# 3. Create SSH config on MAJIN for Mac Local connection
echo "🔑 Setting up SSH config on MAJIN..."
ssh $MAJIN_HOST << 'REMOTE_SCRIPT'
# Add Mac Local to SSH config
if ! grep -q "miyabi-mac" ~/.ssh/config 2>/dev/null; then
    cat >> ~/.ssh/config << 'EOF'

# Mac Local (Miyabi Command Center)
Host miyabi-mac
    HostName 100.112.127.63
    User shunsuke
    StrictHostKeyChecking no
    UserKnownHostsFile=/dev/null
    ServerAliveInterval 60
    ConnectTimeout 10
EOF
    echo "   ✅ Added miyabi-mac to SSH config"
else
    echo "   ℹ️  miyabi-mac already in SSH config"
fi
chmod 600 ~/.ssh/config
REMOTE_SCRIPT

# 4. Create systemd service file
echo "⚙️  Creating systemd service..."
ssh $MAJIN_HOST << 'REMOTE_SCRIPT'
sudo tee /etc/systemd/system/miyabi-lark-events.service > /dev/null << 'EOF'
[Unit]
Description=Miyabi Lark Event Handler
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miyabi-events
ExecStart=/usr/bin/node /home/ubuntu/miyabi-events/lark-event-handler.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

# Load environment variables from file
EnvironmentFile=-/home/ubuntu/miyabi-events/.env

[Install]
WantedBy=multi-user.target
EOF

echo "   ✅ Created systemd service file"
REMOTE_SCRIPT

# 5. Create environment file template
echo "📝 Creating environment template..."
ssh $MAJIN_HOST << 'REMOTE_SCRIPT'
if [ ! -f /home/ubuntu/miyabi-events/.env ]; then
    cat > /home/ubuntu/miyabi-events/.env << 'EOF'
# Lark App credentials
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
LARK_VERIFICATION_TOKEN=your_verification_token
LARK_ENCRYPT_KEY=your_encrypt_key
EOF
    echo "   ⚠️  Created .env template - please update with actual credentials"
else
    echo "   ℹ️  .env already exists"
fi
REMOTE_SCRIPT

# 6. Reload and restart service
echo "🔄 Reloading systemd and starting service..."
ssh $MAJIN_HOST << 'REMOTE_SCRIPT'
sudo systemctl daemon-reload
sudo systemctl enable miyabi-lark-events
sudo systemctl restart miyabi-lark-events
sleep 2
sudo systemctl status miyabi-lark-events --no-pager
REMOTE_SCRIPT

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Verify:"
echo "   ssh majin 'sudo journalctl -u miyabi-lark-events -f'"
