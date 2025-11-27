# Miyabi OpenAI App - Production Status

**Status**: ✅ **DEPLOYED AND RUNNING**
**Server**: MUGEN (EC2 44.250.27.197)
**Date**: 2025-11-27

---

## 🚀 Live Servers

### Asset Server (Vite Preview)
- **URL**: `http://44.250.27.197:4444/`
- **Status**: ✅ Running
- **Process**: `node .../vite preview --port 4444 --host`
- **Log**: `/tmp/miyabi-asset-server.log`

### MCP Server (FastAPI/Uvicorn)
- **URL**: `http://44.250.27.197:8000/`
- **Status**: ✅ Running
- **Process**: `/usr/bin/python3 .../uvicorn main:app --host 0.0.0.0 --port 8000`
- **Log**: `/tmp/miyabi-mcp-server.log`

---

## 📊 Server Test Results

### Health Check
```bash
curl http://44.250.27.197:8000/
```
**Response**:
```json
{
  "name": "Miyabi MCP Server",
  "version": "1.0.0",
  "status": "running",
  "tools": 4
}
```

### MCP Tools List
```bash
curl -X POST http://44.250.27.197:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Available Tools**:
1. `execute_agent` - Execute Miyabi agents (21 agents available)
2. `create_issue` - Create GitHub issues
3. `list_issues` - List GitHub issues
4. `get_project_status` - Get Miyabi project status

### Project Status Test
```bash
curl -X POST http://44.250.27.197:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_project_status","arguments":{}}}'
```

**Response Summary**:
- ✅ Branch: `main`
- ✅ Crates: `56`
- ✅ MCP Servers: `26`
- ✅ Agents Total: `21`
- ✅ Latest Commit: `cdf9c20a93a45f14a4082993abea1b2539b3ca3c`
- ✅ Widget HTML Generated: Yes (with proper asset URLs)

---

## 🌐 Expose to ChatGPT

### Option 1: Local ngrok (Recommended)

Run ngrok on your local machine:

```bash
# Install ngrok if needed
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Authenticate (get token from https://dashboard.ngrok.com/get-started/your-authtoken)
ngrok config add-authtoken <YOUR_TOKEN>

# Create tunnel to MUGEN's MCP server
ngrok http 44.250.27.197:8000
```

Copy the `https://` URL (e.g., `https://abc123.ngrok-free.app`)

### Option 2: ngrok on MUGEN

Install and run ngrok directly on MUGEN:

```bash
ssh mugen

# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Authenticate
ngrok config add-authtoken <YOUR_TOKEN>

# Start tunnel
ngrok http 8000
```

### Option 3: Public IP (Less Secure, Testing Only)

⚠️ **Warning**: Only for testing. Requires AWS Security Group to allow port 8000.

Direct URL: `http://44.250.27.197:8000/mcp`

---

## 🤖 Add to ChatGPT

1. Go to **ChatGPT Settings > Connectors**
2. Click **Add Connector**
3. Enter endpoint:
   - If using ngrok: `https://<your-id>.ngrok-free.app/mcp`
   - If using public IP: `http://44.250.27.197:8000/mcp`
4. Save

### Test Commands in ChatGPT

Once connected, try these:

**Project Status**:
```
Show me the Miyabi project status
What's the current branch and latest commit?
```

**GitHub Issues**:
```
List open issues in the Miyabi repository
Create an issue titled "Test from ChatGPT" with body "Testing MCP integration"
```

**Agent Execution**:
```
Execute the Review agent
Run the CodeGen agent on issue #123
```

---

## 🔧 Server Management

### Check Status
```bash
# Check if servers are running
ssh mugen "ps aux | grep -E 'vite preview|uvicorn main:app' | grep -v grep"

# Check logs
ssh mugen "tail -f /tmp/miyabi-asset-server.log"
ssh mugen "tail -f /tmp/miyabi-mcp-server.log"

# Test endpoints
curl http://44.250.27.197:4444/
curl http://44.250.27.197:8000/
```

### Restart Servers
```bash
ssh mugen

# Kill existing servers
pkill -f 'vite preview'
pkill -f 'uvicorn main:app'

# Restart using script
cd ~/miyabi-private/openai-apps/miyabi-app
./start-servers.sh
```

### Stop Servers
```bash
ssh mugen "pkill -f 'vite preview' && pkill -f 'uvicorn main:app'"
```

---

## ⚙️ Configuration

### Environment Variables

Location: `~/miyabi-private/openai-apps/miyabi-app/server/.env`

```env
GITHUB_TOKEN=          # Add your token here
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private
MIYABI_ROOT=/home/ubuntu/miyabi-private
BASE_URL=http://44.250.27.197:4444
```

**Note**: The `GITHUB_TOKEN` is currently empty. To use GitHub features (create/list issues), you need to add a valid token.

### Generate GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (optional, for workflow management)
4. Copy the token
5. Update `.env` file on MUGEN:
   ```bash
   ssh mugen
   nano ~/miyabi-private/openai-apps/miyabi-app/server/.env
   # Add token to GITHUB_TOKEN= line
   # Restart MCP server for changes to take effect
   ```

---

## 📈 Performance

### Resource Usage (Current)

Asset Server:
- CPU: ~0.2%
- Memory: ~80 MB

MCP Server:
- CPU: ~0.6%
- Memory: ~61 MB

Total: **~141 MB RAM**, negligible CPU when idle

### Ports
- **4444**: Asset server (Vite preview)
- **8000**: MCP server (FastAPI/Uvicorn)

---

## 🎯 Next Steps

### Required for Production Use

1. **Add GitHub Token**: Update `.env` with valid `GITHUB_TOKEN`
2. **Set up ngrok**: For ChatGPT integration
3. **Test in ChatGPT**: Verify all 4 tools work

### Optional Improvements

1. **systemd Services**: Auto-restart on server reboot
2. **HTTPS**: Use proper SSL certificate instead of ngrok
3. **Monitoring**: Set up uptime monitoring and alerts
4. **Logging**: Configure proper log rotation

### For Pixel/Termux

The same setup can be replicated on Pixel:

```bash
# On Pixel
cd ~/Dev/miyabi-private/openai-apps/miyabi-app

# Update .env for Pixel
nano server/.env
# MIYABI_ROOT=/data/data/com.termux/files/home/Dev/miyabi-private
# BASE_URL=http://localhost:4444

# Install and start
./setup.sh
./start-servers.sh

# Expose with Termux:API + ngrok (if available on Android)
```

---

## 📚 Documentation

- **README.md** - General usage guide
- **DEPLOY_MUGEN.md** - Detailed deployment guide
- **start-servers.sh** - Automated server startup script
- **PRODUCTION_STATUS.md** - This file

---

## ✅ Verification Checklist

- [x] Asset server running on port 4444
- [x] MCP server running on port 8000
- [x] Health check endpoint responding
- [x] Tools/list endpoint working
- [x] get_project_status tool tested and working
- [x] Environment variables loaded correctly (.env)
- [x] Widget HTML generation working
- [x] Logs accessible
- [ ] GitHub token configured (PENDING - user action required)
- [ ] ngrok tunnel set up (PENDING - user action required)
- [ ] ChatGPT integration tested (PENDING - user action required)

---

**Deployment completed by**: Claude Code
**Last updated**: 2025-11-27 16:35 UTC
**Commit**: cdf9c20a93a45f14a4082993abea1b2539b3ca3c
