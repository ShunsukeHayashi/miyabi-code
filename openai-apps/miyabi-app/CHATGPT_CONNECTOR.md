# Miyabi OpenAI App - ChatGPT Connector Setup

**Status**: ✅ **LIVE AND READY**
**Date**: 2025-11-27

---

## 🌐 Public Endpoint (ngrok)

### MCP Server Endpoint

**Add this URL to ChatGPT**:
```
https://792e1c41e9bd.ngrok-free.app/mcp
```

### Connection Details

- **Tunnel Type**: SSH Tunnel + ngrok
- **Path**: MacBook :8080 → SSH → MUGEN :8000
- **Protocol**: HTTPS (ngrok secure tunnel)
- **Status**: ✅ Active and verified

### Architecture

```
ChatGPT
   ↓
ngrok (https://792e1c41e9bd.ngrok-free.app)
   ↓
MacBook localhost:8080
   ↓ SSH Tunnel
MUGEN (44.250.27.197):8000 (MCP Server)
   ↓
Miyabi Agents (A2A Bridge)
```

---

## 🤖 How to Connect to ChatGPT

### Step 1: Open ChatGPT Settings

1. Go to [ChatGPT](https://chatgpt.com)
2. Click your profile in the bottom left
3. Select **Settings**

### Step 2: Add Connector

1. Navigate to **Connectors** section
2. Click **Add Connector**
3. Enter the endpoint URL:
   ```
   https://792e1c41e9bd.ngrok-free.app/mcp
   ```
4. Click **Save** or **Add**

### Step 3: Verify Connection

ChatGPT will test the connection. You should see:
- ✅ Connection successful
- 4 tools available

---

## 🎯 Available Tools in ChatGPT

Once connected, you can use these natural language commands:

### 1. Execute Miyabi Agents (21 agents)

```
"Execute the CodeGen agent on issue #123"
"Run the Review agent to check my latest code"
"Execute the Deploy agent"
"Run the Market Research agent"
```

**Available Agents**:
- **Coding**: coordinator, codegen, review, issue, pr, deploy, refresher
- **Business**: ai_entrepreneur, self_analysis, market_research, persona, product_concept, product_design, content_creation, funnel_design, sns_strategy, marketing, sales, crm, analytics, youtube

### 2. GitHub Issue Management

```
"List all open issues in the Miyabi repository"
"Create an issue titled 'Fix authentication bug' with label 'bug'"
"Show me the last 5 closed issues"
```

### 3. Project Status

```
"Show me the Miyabi project status"
"What's the current branch and latest commit?"
"How many crates and MCP servers are in the project?"
```

---

## ✅ Verification Test

Test the connection with curl:

```bash
# Health check
curl https://792e1c41e9bd.ngrok-free.app/

# List tools
curl -X POST https://792e1c41e9bd.ngrok-free.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Get project status
curl -X POST https://792e1c41e9bd.ngrok-free.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_project_status","arguments":{}}}'
```

**Expected Response**:
```json
{
  "name": "Miyabi MCP Server",
  "version": "1.0.0",
  "status": "running",
  "tools": 4
}
```

---

## 🔧 Troubleshooting

### Connection Failed

**Check if tunnel is running**:
```bash
# On MacBook
ps aux | grep ngrok
curl http://localhost:4040/api/tunnels
```

**Restart tunnel**:
```bash
# Kill existing ngrok
pkill ngrok

# Restart SSH tunnel
ssh -f -N -L 8080:localhost:8000 mugen

# Restart ngrok
ngrok http 8080
```

### Tools Not Showing

1. Verify MCP server is running on MUGEN:
   ```bash
   ssh mugen "curl -s http://localhost:8000/"
   ```

2. Check SSH tunnel:
   ```bash
   curl http://localhost:8080/
   ```

3. Test ngrok endpoint:
   ```bash
   curl https://792e1c41e9bd.ngrok-free.app/
   ```

### ChatGPT Can't Reach Endpoint

- Check ngrok is active: `ps aux | grep ngrok`
- Verify ngrok URL: `curl http://localhost:4040/api/tunnels`
- Test endpoint directly: `curl https://792e1c41e9bd.ngrok-free.app/mcp`

---

## 📊 Example Conversations

### Example 1: Project Status

**You**: "Show me the Miyabi project status"

**ChatGPT** (calls get_project_status tool):
- Shows interactive widget with:
  - Current branch: main
  - 56 Crates
  - 26 MCP Servers
  - 21 Agents (0 running)
  - Latest commit info

### Example 2: List Issues

**You**: "List the latest 5 open issues"

**ChatGPT** (calls list_issues tool):
- Shows interactive issue list widget
- Issue numbers, titles, labels
- Created dates, assignees
- Clickable links to GitHub

### Example 3: Execute Agent

**You**: "Run the Review agent to check the latest code"

**ChatGPT** (calls execute_agent tool):
- Executes ReviewAgent via A2A Bridge
- Shows execution results
- Files changed, output, duration

---

## ⏱️ Tunnel Persistence

### Current Setup

The ngrok tunnel and SSH tunnel are running in the background:

**SSH Tunnel**:
```bash
ssh -f -N -L 8080:localhost:8000 mugen
```

**ngrok**:
```bash
ngrok http 8080
```

### Making Tunnels Persistent

For long-term use, consider:

1. **Use ngrok config file** with auto-restart
2. **systemd service** on MacBook for SSH tunnel
3. **tmux/screen** session to keep tunnels alive
4. **ngrok reserved domain** (paid plan)

### Current Limitations

- ngrok free plan: 1 tunnel at a time
- Tunnel URL changes when ngrok restarts
- Requires MacBook to be running

---

## 🚀 Next Steps

### Required

- [x] Add endpoint to ChatGPT
- [ ] Test all 4 tools in ChatGPT
- [ ] Add GitHub token for issue management

### Optional

- [ ] Set up ngrok reserved domain (paid plan)
- [ ] Create systemd service for persistent tunnel
- [ ] Add monitoring for tunnel status

---

## 📝 Notes

**Important**: The ngrok URL (`https://792e1c41e9bd.ngrok-free.app`) will change if ngrok is restarted. If you need a permanent URL, upgrade to ngrok paid plan for reserved domains.

**Tunnel Chain**: All requests go through:
1. ChatGPT → ngrok HTTPS endpoint
2. ngrok → MacBook localhost:8080
3. SSH tunnel → MUGEN:8000
4. FastAPI MCP Server → A2A Bridge → Rust Agents

**Security**: ngrok provides HTTPS encryption. The SSH tunnel adds another layer of security for the MacBook→MUGEN connection.

---

**Created**: 2025-11-27
**Endpoint**: https://792e1c41e9bd.ngrok-free.app/mcp
**Status**: ✅ Live and ready for ChatGPT integration
