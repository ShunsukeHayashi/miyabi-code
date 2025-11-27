# Miyabi OpenAI App - MUGEN Deployment Guide

## Quick Start on MUGEN

### 1. Set Environment Variables

SSH to MUGEN and set the required environment variables:

```bash
ssh mugen

# Export environment variables (add to ~/.bashrc for persistence)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"  # Your GitHub token
export MIYABI_REPO_OWNER="customer-cloud"
export MIYABI_REPO_NAME="miyabi-private"
export MIYABI_ROOT="$HOME/miyabi-private"
export BASE_URL="http://44.250.27.197:4444"  # MUGEN public IP

# Optional: Add to ~/.bashrc
echo 'export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"' >> ~/.bashrc
echo 'export BASE_URL="http://44.250.27.197:4444"' >> ~/.bashrc
```

### 2. Create .env File

```bash
cd ~/miyabi-private/openai-apps/miyabi-app/server

cat > .env << EOF
GITHUB_TOKEN=${GITHUB_TOKEN}
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private
MIYABI_ROOT=$HOME/miyabi-private
BASE_URL=http://44.250.27.197:4444
EOF
```

### 3. Start Servers in tmux

#### Option A: Using tmux (Recommended)

```bash
cd ~/miyabi-private/openai-apps/miyabi-app

# Create tmux session
tmux new -s miyabi-openai

# Split pane horizontally (Ctrl+b, then ")
# Top pane: Asset server
npm run serve

# Switch to bottom pane (Ctrl+b, then down arrow)
# Bottom pane: MCP server
cd server
~/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000

# Detach from tmux: Ctrl+b, then d
# Reattach: tmux attach -t miyabi-openai
```

#### Option B: Using screen

```bash
# Asset server
screen -dmS miyabi-assets bash -c "cd ~/miyabi-private/openai-apps/miyabi-app && npm run serve"

# MCP server
screen -dmS miyabi-mcp bash -c "cd ~/miyabi-private/openai-apps/miyabi-app/server && ~/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000"

# View logs
screen -r miyabi-assets  # Ctrl+a, d to detach
screen -r miyabi-mcp     # Ctrl+a, d to detach
```

#### Option C: Using nohup (Background)

```bash
cd ~/miyabi-private/openai-apps/miyabi-app

# Start asset server
nohup npm run serve > asset-server.log 2>&1 &

# Start MCP server
cd server
nohup ~/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > mcp-server.log 2>&1 &

# View logs
tail -f ~/miyabi-private/openai-apps/miyabi-app/asset-server.log
tail -f ~/miyabi-private/openai-apps/miyabi-app/server/mcp-server.log
```

### 4. Test Servers

```bash
# Test asset server
curl http://localhost:4444/

# Test MCP server
curl http://localhost:8000/
```

### 5. Expose with ngrok (for ChatGPT Integration)

On your local machine or MUGEN:

```bash
# Install ngrok if not already installed
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Authenticate ngrok (get token from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken <YOUR_TOKEN>

# Start ngrok tunnel
ngrok http 8000

# Copy the https URL (e.g., https://abc123.ngrok-free.app)
```

### 6. Add to ChatGPT

1. Go to ChatGPT Settings > Connectors
2. Add endpoint: `https://abc123.ngrok-free.app/mcp`
3. Test with: "Show me the Miyabi project status"

## Server Management

### Check Server Status

```bash
# Check if servers are running
ps aux | grep -E "vite|uvicorn"

# Check ports
netstat -tlnp | grep -E "4444|8000"
```

### Stop Servers

```bash
# If using tmux
tmux kill-session -t miyabi-openai

# If using screen
screen -X -S miyabi-assets quit
screen -X -S miyabi-mcp quit

# If using nohup/background
pkill -f "vite preview"
pkill -f "uvicorn main:app"
```

### Restart Servers

```bash
# Stop first
pkill -f "vite preview"
pkill -f "uvicorn main:app"

# Then start again (choose Option A, B, or C above)
```

## Troubleshooting

### uvicorn: command not found

The uvicorn binary is in `~/.local/bin/`. Add to PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

### Port already in use

```bash
# Kill process on port 4444
lsof -ti:4444 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### GITHUB_TOKEN not set

Make sure the .env file exists and has the correct token:

```bash
cat ~/miyabi-private/openai-apps/miyabi-app/server/.env
```

### Cannot connect to MCP server

Check firewall rules on MUGEN:

```bash
# Check current rules
sudo iptables -L -n

# Allow port 8000 (if needed)
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT

# Or use AWS Security Group to allow port 8000
```

## Production Deployment

For production, consider using systemd services:

### Create systemd service files

**Asset Server: `/etc/systemd/system/miyabi-assets.service`**

```ini
[Unit]
Description=Miyabi OpenAI App - Asset Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miyabi-private/openai-apps/miyabi-app
ExecStart=/usr/bin/npm run serve
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**MCP Server: `/etc/systemd/system/miyabi-mcp.service`**

```ini
[Unit]
Description=Miyabi OpenAI App - MCP Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/miyabi-private/openai-apps/miyabi-app/server
Environment="PATH=/home/ubuntu/.local/bin:/usr/bin"
EnvironmentFile=/home/ubuntu/miyabi-private/openai-apps/miyabi-app/server/.env
ExecStart=/home/ubuntu/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Enable and start services

```bash
sudo systemctl daemon-reload
sudo systemctl enable miyabi-assets miyabi-mcp
sudo systemctl start miyabi-assets miyabi-mcp

# Check status
sudo systemctl status miyabi-assets
sudo systemctl status miyabi-mcp

# View logs
sudo journalctl -u miyabi-assets -f
sudo journalctl -u miyabi-mcp -f
```

## Monitoring

```bash
# Check logs
tail -f ~/miyabi-private/openai-apps/miyabi-app/asset-server.log
tail -f ~/miyabi-private/openai-apps/miyabi-app/server/mcp-server.log

# Monitor resource usage
htop
```

---

**Last Updated**: 2025-11-27
**Maintainer**: Claude Code
