# Miyabi SSE Gateway

AWS deployment-ready SSE (Server-Sent Events) gateway for Miyabi MCP Servers.

## Overview

This gateway wraps Miyabi MCP servers (miyabi-tmux, miyabi-rules) to provide SSE connectivity, enabling remote access from Claude Desktop or Claude Code over HTTPS.

### Architecture

```
Claude Desktop/Code
       ↓ HTTPS/SSE
   ALB (AWS)
       ↓
  ECS Fargate
  └─ SSE Gateway (this server)
      ├─ /sse/tmux → miyabi-tmux-server
      └─ /sse/rules → miyabi-rules-server
```

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-sse-gateway
npm install
npm run build
```

### Run locally

```bash
npm start
```

Server will start on `http://localhost:3000`

### Test SSE endpoints

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Test tmux SSE endpoint
curl -N http://localhost:3000/sse/tmux

# Terminal 3: Test rules SSE endpoint
curl -N http://localhost:3000/sse/rules
```

## Docker Build

### Build image

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers

# Build with context including MCP servers
docker build -t miyabi-sse-gateway:latest -f miyabi-sse-gateway/Dockerfile .
```

### Run container

```bash
docker run -p 3000:3000 \
  -e MIYABI_RULES_API_URL="https://api.example.com" \
  -e MIYABI_API_KEY="your-api-key" \
  miyabi-sse-gateway:latest
```

### Test

```bash
curl http://localhost:3000/health
```

## Deployment to AWS (ECS Fargate)

### 1. Push to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com

# Tag image
docker tag miyabi-sse-gateway:latest \
  <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-sse-gateway:latest

# Push image
docker push <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-sse-gateway:latest
```

### 2. Deploy with Terraform

```bash
cd ../../infrastructure/terraform/environments/dev
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T15:00:00.000Z"
}
```

### SSE - Miyabi tmux

```
GET /sse/tmux
```

Returns Server-Sent Events stream from miyabi-tmux-server.

### SSE - Miyabi Rules

```
GET /sse/rules
```

Returns Server-Sent Events stream from miyabi-rules-server.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Server port |
| `MIYABI_RULES_API_URL` | Yes (for rules) | - | Miyabi Rules API URL |
| `MIYABI_API_KEY` | Yes (for rules) | - | API authentication key |

## Monitoring

### Health Check

ECS health check is configured to hit `/health` endpoint every 30 seconds.

### Logs

Application logs are sent to CloudWatch Logs:
- Log Group: `/ecs/miyabi-sse-gateway`
- Stream: `{task-id}`

## Troubleshooting

### SSE connection drops

Check ALB connection timeout settings. For SSE, set:
```
alb.connection_idle_timeout = 300
```

### MCP server fails to spawn

Check:
1. MCP server files exist in container (`miyabi-tmux-server/dist`, `miyabi-rules-server/dist`)
2. Node.js version compatibility
3. Container logs in CloudWatch

### CORS issues

Adjust CORS settings in `src/index.ts`:
```typescript
app.use(cors({
  origin: 'https://your-allowed-domain.com'
}));
```

## License

MIT
