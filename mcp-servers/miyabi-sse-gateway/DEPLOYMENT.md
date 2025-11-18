# Miyabi Unified MCP Gateway - Deployment Guide

## Overview

The Miyabi Unified MCP Gateway proxies multiple local STDIO MCP servers over HTTP/SSE, enabling remote access from Claude Desktop, Claude.ai Web, and other MCP clients.

## Architecture

```
Client (Claude Desktop/Web) 
    ↓ HTTPS + Bearer Token
AWS App Runner (Unified Gateway)
    ↓ STDIO (JSON-RPC)
├─ Tmux MCP Server (6 tools)
├─ Rules MCP Server (5 tools)  
└─ Obsidian MCP Server (9 tools)
```

## Deployment Steps

### 1. Prerequisites

- AWS Account with App Runner permissions
- GitHub repository for continuous deployment
- Node.js 22+ runtime

### 2. Configure Environment Variables

Update `.env.production`:

```bash
# Generate a secure bearer token
MIYABI_BEARER_TOKEN=$(openssl rand -hex 32)

# Set your App Runner URL (will be provided after first deployment)
BASE_URL=https://YOUR_APP_RUNNER_URL.awsapprunner.com

# Optional: Configure GitHub OAuth for ChatGPT Connector
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### 3. Deploy to AWS App Runner

#### Option A: Using AWS Console

1. Open AWS App Runner console
2. Create new service
3. Choose "Source code repository"
4. Connect your GitHub repository
5. Select the `mcp-servers/miyabi-sse-gateway` directory
6. Configure build settings:
   - Runtime: Node.js 22
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Port: 3000
7. Add environment variables from `.env.production`
8. Create service

#### Option B: Using AWS CLI

```bash
# Create App Runner service
aws apprunner create-service \
  --service-name miyabi-unified-mcp-gateway \
  --source-configuration file://apprunner-config.json \
  --instance-configuration "Cpu=1 vCPU,Memory=2 GB"

# Update environment variables
aws apprunner update-service \
  --service-arn YOUR_SERVICE_ARN \
  --source-configuration "CodeRepository={RepositoryUrl=YOUR_REPO,SourceCodeVersion={Type=BRANCH,Value=main}}"
```

### 4. Verify Deployment

```bash
# Check health endpoint
curl https://YOUR_APP_RUNNER_URL.awsapprunner.com/health

# Check MCP server status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp/status

# List all available tools
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp/tools
```

## Client Configuration

### Claude Desktop

Update `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-unified": {
      "url": "https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp",
      "transport": {
        "type": "sse"
      },
      "headers": {
        "Authorization": "Bearer YOUR_BEARER_TOKEN"
      }
    },
    "miyabi-tmux": {
      "url": "https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp/tmux",
      "transport": {
        "type": "sse"
      },
      "headers": {
        "Authorization": "Bearer YOUR_BEARER_TOKEN"
      }
    },
    "miyabi-rules": {
      "url": "https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp/rules",
      "transport": {
        "type": "sse"
      },
      "headers": {
        "Authorization": "Bearer YOUR_BEARER_TOKEN"
      }
    },
    "miyabi-obsidian": {
      "url": "https://YOUR_APP_RUNNER_URL.awsapprunner.com/mcp/obsidian",
      "transport": {
        "type": "sse"
      },
      "headers": {
        "Authorization": "Bearer YOUR_BEARER_TOKEN"
      }
    }
  }
}
```

### Claude.ai Web (via Custom Connector)

1. Go to Claude.ai Settings → Custom Connectors
2. Create new connector with:
   - Name: "Miyabi Unified Gateway"
   - Base URL: `https://YOUR_APP_RUNNER_URL.awsapprunner.com`
   - Authentication: Bearer Token
   - Token: `YOUR_BEARER_TOKEN`

**Note**: Claude.ai Custom Connectors currently have egress IP restrictions. Check with Anthropic for whitelist.

## Available Endpoints

### Health & Status
- `GET /health` - Health check (no auth)
- `GET /mcp/status` - MCP router status (auth required)
- `GET /mcp/tools` - List all tools from all servers (auth required)

### MCP Servers
- `POST /mcp` - Society MCP Server (Business Agents - 7 tools)
- `POST /mcp/tmux` - Tmux MCP Server (Session Control - 6 tools)
- `POST /mcp/rules` - Rules MCP Server (CLAUDE.md - 5 tools)
- `POST /mcp/obsidian` - Obsidian MCP Server (Knowledge - 9 tools)

## Security Considerations

1. **Bearer Token**: Always use a strong, randomly generated token
2. **HTTPS Only**: Never deploy without HTTPS
3. **CORS**: Restrict to known origins only
4. **Rate Limiting**: 30 requests/minute by default
5. **Audit Logging**: All requests are logged to CloudWatch

## Monitoring

### CloudWatch Logs

- Application logs: `/aws/apprunner/YOUR_SERVICE_NAME/application`
- System logs: `/aws/apprunner/YOUR_SERVICE_NAME/system`

### Key Metrics

- Request rate
- Error rate
- Response time
- MCP server health

## Cost Estimation

- AWS App Runner: ~$25/month (1 vCPU, 2 GB RAM)
- Data transfer: ~$0.09/GB
- CloudWatch Logs: ~$0.50/GB

**Total**: ~$26-30/month for light usage

## Troubleshooting

### MCP Servers Not Starting

Check logs:
```bash
tail -f logs/mcp-adapter.log
tail -f logs/mcp-router.log
```

### Tool Call Timeouts

Increase timeout in `mcp-adapter.ts`:
```typescript
setTimeout(() => {
  // ...
}, 60000); // Increase from 30s to 60s
```

### CORS Errors

Add your origin to `ALLOWED_ORIGINS` environment variable.

## Rollback

To rollback to previous version:

```bash
aws apprunner update-service \
  --service-arn YOUR_SERVICE_ARN \
  --source-configuration "CodeRepository={SourceCodeVersion={Type=BRANCH,Value=main}}"
```

## Support

For issues, refer to:
- [Migration Plan](/docs/obsidian-vault/planning/2025-11-19-all-mcp-remote-migration-plan.md)
- [MCP Integration Guide](/docs/obsidian-vault/guides/mcp-server-integration-complete-guide.md)
