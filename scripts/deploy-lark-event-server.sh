#!/bin/bash
# Deploy Lark Event Server to AWS EC2

set -e

# Configuration
SERVER="majin"  # or "mugen"
REMOTE_DIR="/home/ubuntu/miyabi-lark-event-server"
LOCAL_FILE="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/lark-mcp-enhanced/event-server.js"
PORT=3001

echo "🚀 Deploying Lark Event Server to $SERVER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create remote directory
echo "📁 Creating remote directory..."
ssh $SERVER "mkdir -p $REMOTE_DIR"

# Copy event server
echo "📤 Copying event server..."
scp $LOCAL_FILE $SERVER:$REMOTE_DIR/

# Create package.json
echo "📦 Creating package.json..."
ssh $SERVER "cat > $REMOTE_DIR/package.json << 'EOF'
{
  \"name\": \"miyabi-lark-event-server\",
  \"version\": \"1.0.0\",
  \"description\": \"Miyabi Lark Event Subscription Server\",
  \"main\": \"event-server.js\",
  \"scripts\": {
    \"start\": \"node event-server.js\"
  },
  \"dependencies\": {
    \"express\": \"^4.18.2\"
  }
}
EOF"

# Install dependencies
echo "📦 Installing dependencies..."
ssh $SERVER "cd $REMOTE_DIR && npm install"

# Create systemd service
echo "⚙️ Creating systemd service..."
ssh $SERVER "sudo tee /etc/systemd/system/miyabi-lark-events.service > /dev/null << 'EOF'
[Unit]
Description=Miyabi Lark Event Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miyabi-lark-event-server
ExecStart=/usr/bin/node event-server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=miyabi-lark-events
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF"

# Enable and start service
echo "🔄 Enabling and starting service..."
ssh $SERVER "sudo systemctl daemon-reload"
ssh $SERVER "sudo systemctl enable miyabi-lark-events"
ssh $SERVER "sudo systemctl restart miyabi-lark-events"

# Check status
echo "✅ Checking service status..."
ssh $SERVER "sudo systemctl status miyabi-lark-events --no-pager"

# Get public IP
PUBLIC_IP=$(ssh $SERVER "curl -s http://169.254.169.254/latest/meta-data/public-ipv4")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo ""
echo "📡 Event Server URL:"
echo "   http://$PUBLIC_IP:$PORT/webhook/events"
echo ""
echo "🔧 Lark Event Subscription設定:"
echo "   Request URL: http://$PUBLIC_IP:$PORT/webhook/events"
echo ""
echo "📋 Useful commands:"
echo "   ssh $SERVER 'sudo journalctl -u miyabi-lark-events -f'  # View logs"
echo "   ssh $SERVER 'sudo systemctl restart miyabi-lark-events' # Restart"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
