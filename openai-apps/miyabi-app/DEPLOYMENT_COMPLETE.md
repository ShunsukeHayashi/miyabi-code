# 🚀 Miyabi OpenAI App - Complete Deployment Guide

**Production-Ready Deployment to EC2 MUGEN**

Last Updated: 2025-11-28
Status: Ready for Deployment ✅

---

## 🎯 Quick Deploy to MUGEN

### One-Command Deployment

```bash
./deploy-to-mugen.sh
```

This will:
1. ✅ Sync code to MUGEN EC2
2. ✅ Install dependencies
3. ✅ Build frontend assets
4. ✅ Set up environment template

---

## 📋 Deployment Checklist

### Pre-Deployment

- [x] **Bugs Fixed**
  - [x] Function name mismatch (`get_client` → `get_a2a_client`)
  - [x] Type union syntax (`int | str` → `Union[int, str]`)
- [x] **Features Added**
  - [x] MCP-compliant OAuth 2.1 authentication
  - [x] Parallel agent execution (`execute_agents_parallel`)
- [x] **Documentation Created**
  - [x] `.env.example` - Environment template
  - [x] `README_AUTH.md` - Authentication guide
  - [x] `CHANGELOG.md` - Change log
  - [x] `MIYABI_MCP_BUNDLES.md` - MCP server catalog

### Deployment Steps

1. **Deploy Code** ✅
   ```bash
   ./deploy-to-mugen.sh
   ```

2. **Configure Environment**
   ```bash
   ssh mugen
   cd ~/miyabi-private/openai-apps/miyabi-app/server
   nano .env
   ```

   Required variables:
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
   MIYABI_ACCESS_TOKEN=<generate-with-secrets.token_urlsafe(32)>
   ```

3. **Setup Systemd** (Production)
   ```bash
   cd ~/miyabi-private/openai-apps/miyabi-app
   ./setup-systemd.sh
   sudo systemctl start miyabi-assets miyabi-mcp
   ```

4. **Verify Services**
   ```bash
   sudo systemctl status miyabi-assets
   sudo systemctl status miyabi-mcp
   ```

---

## 🔐 Security Setup

### Generate Access Token

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add to `server/.env`:
```bash
MIYABI_ACCESS_TOKEN=<your_generated_token>
```

### Test Authentication

```bash
# Should fail without token
curl -X POST http://localhost:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Should succeed with token
curl -X POST http://localhost:8000/mcp \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## 🌐 Public URL Setup

### Option 1: ngrok (Development/Testing)

```bash
# On MUGEN
ngrok http 8000

# Copy HTTPS URL (e.g., https://abc123.ngrok-free.app)
```

### Option 2: AWS ALB + SSL (Production)

```bash
# Create Application Load Balancer
# - Target: MUGEN:8000
# - SSL Certificate: ACM
# - Domain: miyabi-mcp.yourdomain.com
```

### Option 3: Cloudflare Tunnel (Recommended)

```bash
# Install cloudflared on MUGEN
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Login and create tunnel
cloudflared tunnel login
cloudflared tunnel create miyabi-mcp
cloudflared tunnel route dns miyabi-mcp mcp.yourdomain.com

# Run tunnel
cloudflared tunnel --config ~/.cloudflared/config.yml run miyabi-mcp
```

---

## 🔧 Server Management

### Start Servers

```bash
# Development (tmux)
./start-servers.sh

# Production (systemd)
sudo systemctl start miyabi-assets miyabi-mcp
```

### Stop Servers

```bash
# Development
tmux kill-session -t miyabi-openai

# Production
sudo systemctl stop miyabi-assets miyabi-mcp
```

### Restart After Updates

```bash
# Deploy new code
./deploy-to-mugen.sh

# Restart services
ssh mugen "sudo systemctl restart miyabi-assets miyabi-mcp"
```

### View Logs

```bash
# Systemd logs
sudo journalctl -u miyabi-mcp -f
sudo journalctl -u miyabi-assets -f

# Application logs (if using nohup)
tail -f ~/miyabi-private/openai-apps/miyabi-app/mcp-server.log
tail -f ~/miyabi-private/openai-apps/miyabi-app/asset-server.log
```

---

## 🧪 Testing Deployment

### 1. Test Asset Server

```bash
curl http://localhost:4444/
# Expected: HTML page or "OK" response
```

### 2. Test MCP Server Health

```bash
curl http://localhost:8000/
# Expected: {"name":"Miyabi MCP Server","version":"1.0.0","status":"running","tools":8}
```

### 3. Test MCP Endpoint

```bash
curl http://localhost:8000/mcp
# Expected: MCP endpoint info with usage instructions
```

### 4. Test Tool Execution

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Authorization: Bearer $MIYABI_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_project_status",
      "arguments": {}
    }
  }'
```

### 5. Test Parallel Execution

```bash
curl -X POST http://localhost:8000/mcp \
  -H "Authorization: Bearer $MIYABI_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "execute_agents_parallel",
      "arguments": {
        "agents": [
          {"agent": "codegen", "task": "Test task 1"},
          {"agent": "review", "task": "Test task 2"}
        ]
      }
    }
  }'
```

---

## 📊 Available Tools (8)

1. **execute_agent** - Execute single Miyabi agent
2. **create_issue** - Create GitHub issue
3. **list_issues** - List GitHub issues
4. **get_project_status** - Get project status
5. **list_agents** - Show all 21 agents
6. **show_agent_cards** - Display agent TCG cards
7. **execute_agents_parallel** - ✨ Parallel execution (NEW)

---

## 🔗 ChatGPT Integration

### Register MCP Endpoint

1. Go to ChatGPT Settings > Connectors
2. Add endpoint:
   - **Development**: `https://<your-id>.ngrok-free.app/mcp`
   - **Production**: `https://mcp.yourdomain.com/mcp`
3. Authentication: Include `Authorization: Bearer <token>` header

### Test in ChatGPT

```
Show me the Miyabi project status
```

```
Execute CodeGen and Review agents in parallel for Issue #123
```

```
List all available Miyabi agents
```

---

## 🚨 Troubleshooting

### Services Won't Start

```bash
# Check if ports are available
sudo lsof -i :4444
sudo lsof -i :8000

# Kill processes on ports
sudo lsof -ti:4444 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
```

### uvicorn Command Not Found

```bash
# Add to PATH
export PATH="$HOME/.local/bin:$PATH"
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
```

### Authentication Errors

```bash
# Check .env file
cat ~/miyabi-private/openai-apps/miyabi-app/server/.env

# Verify token format
echo $MIYABI_ACCESS_TOKEN
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules assets dist
npm install
npm run build
```

---

## 📈 Monitoring

### Resource Usage

```bash
# CPU and Memory
htop

# Disk Usage
df -h

# Process Status
ps aux | grep -E "vite|uvicorn"
```

### Performance Metrics

```bash
# Request rate
sudo journalctl -u miyabi-mcp --since "1 hour ago" | grep "POST /mcp" | wc -l

# Error rate
sudo journalctl -u miyabi-mcp --since "1 hour ago" | grep "ERROR" | wc -l
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to MUGEN

on:
  push:
    branches: [main]
    paths:
      - 'openai-apps/miyabi-app/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to MUGEN
        uses: appleboy/ssh-action@master
        with:
          host: 44.250.27.197
          username: ubuntu
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/miyabi-private
            git pull
            cd openai-apps/miyabi-app
            npm install
            npm run build
            sudo systemctl restart miyabi-assets miyabi-mcp
```

---

## 📚 Related Documentation

- [README_AUTH.md](./README_AUTH.md) - Authentication guide
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [MIYABI_MCP_BUNDLES.md](./MIYABI_MCP_BUNDLES.md) - All MCP servers
- [DEPLOY_MUGEN.md](./DEPLOY_MUGEN.md) - Detailed MUGEN setup

---

**🎯 Deployment Status**: ✅ Ready
**🔐 Security**: ✅ OAuth 2.1 Compliant
**📦 Features**: 8 Tools, 21 Agents, Parallel Execution
**🚀 Next**: Deploy with `./deploy-to-mugen.sh`

