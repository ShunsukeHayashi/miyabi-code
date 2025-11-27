#!/bin/bash
# Setup systemd services on MUGEN

set -e

echo "🔧 Setting up systemd services for Miyabi OpenAI App"
echo "===================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  This script should NOT be run as root"
  echo "Run it as the deployment user (ubuntu)"
  exit 1
fi

USER=$(whoami)
HOME_DIR=$(eval echo ~$USER)
APP_DIR="$HOME_DIR/miyabi-private/openai-apps/miyabi-app"

echo "User: $USER"
echo "Home: $HOME_DIR"
echo "App:  $APP_DIR"
echo ""

# Create asset server service
echo "Creating miyabi-assets.service..."
sudo tee /etc/systemd/system/miyabi-assets.service > /dev/null << EOF
[Unit]
Description=Miyabi OpenAI App - Asset Server (Vite)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run serve
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=miyabi-assets

[Install]
WantedBy=multi-user.target
EOF

# Create MCP server service
echo "Creating miyabi-mcp.service..."
sudo tee /etc/systemd/system/miyabi-mcp.service > /dev/null << EOF
[Unit]
Description=Miyabi OpenAI App - MCP Server (FastAPI)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/server
Environment="PATH=$HOME_DIR/.local/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$APP_DIR/server/.env
ExecStart=$HOME_DIR/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=miyabi-mcp

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable services
echo "Enabling services..."
sudo systemctl enable miyabi-assets miyabi-mcp

echo ""
echo "✅ Systemd services created and enabled!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start services:"
echo "   sudo systemctl start miyabi-assets miyabi-mcp"
echo ""
echo "2. Check status:"
echo "   sudo systemctl status miyabi-assets"
echo "   sudo systemctl status miyabi-mcp"
echo ""
echo "3. View logs:"
echo "   sudo journalctl -u miyabi-assets -f"
echo "   sudo journalctl -u miyabi-mcp -f"
echo ""
echo "4. Restart services:"
echo "   sudo systemctl restart miyabi-assets miyabi-mcp"
echo ""
