# Miyabi SSE Gateway - AWS Deployment Guide

**Created**: 2025-11-18
**Status**: Ready for deployment
**Version**: 1.0.0

---

## 📖 Overview

This guide explains how to deploy Miyabi MCP Servers (miyabi-tmux, miyabi-rules) to AWS with SSE (Server-Sent Events) connectivity.

### Architecture

```
┌─────────────────────────────────────┐
│   Claude Desktop / Claude Code      │
│   (MCP Client)                      │
└──────────────┬──────────────────────┘
               │ HTTPS/SSE
               ↓
┌─────────────────────────────────────┐
│   Application Load Balancer (ALB)  │
│   - HTTPS Termination               │
│   - Health Check: /health           │
│   - Idle Timeout: 300s              │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   ECS Fargate Service               │
│   ┌───────────────────────────────┐ │
│   │  miyabi-sse-gateway container │ │
│   │  ├─ Express.js SSE Server     │ │
│   │  ├─ miyabi-tmux-server        │ │
│   │  └─ miyabi-rules-server       │ │
│   └───────────────────────────────┘ │
│   Auto-scaling: 1-3 tasks           │
└─────────────────────────────────────┘
```

### Features

- ✅ SSE long-connection support (300s timeout)
- ✅ Auto-scaling (1-3 tasks)
- ✅ Health checks & auto-recovery
- ✅ CloudWatch Logs integration
- ✅ Container Insights enabled
- ✅ HTTPS support (optional)

---

## 🚀 Deployment Steps

### Prerequisites

1. **AWS CLI configured**
   ```bash
   aws configure
   # Or use environment variables
   export AWS_PROFILE=miyabi
   export AWS_REGION=ap-northeast-1
   ```

2. **VPC & Subnets ready**
   - VPC ID
   - 2+ Public subnets (for ALB)
   - 2+ Private subnets (for ECS tasks)

3. **ACM Certificate (optional, for HTTPS)**
   ```bash
   aws acm list-certificates --region ap-northeast-1
   ```

4. **Docker & Terraform installed**
   ```bash
   docker --version  # >= 20.10
   terraform --version  # >= 1.5
   ```

---

## Step 1: Build & Push Docker Image

### 1.1: Build locally

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers

# Build (context includes all MCP servers)
docker build -t miyabi-sse-gateway:latest \
  -f miyabi-sse-gateway/Dockerfile .
```

### 1.2: Test locally

```bash
# Run container
docker run -p 3000:3000 \
  -e MIYABI_RULES_API_URL="https://api.example.com" \
  -e MIYABI_API_KEY="test-key" \
  miyabi-sse-gateway:latest

# Test in another terminal
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"..."}

# Test SSE endpoint
curl -N http://localhost:3000/sse/tmux
# Should see SSE stream
```

### 1.3: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name miyabi-sse-gateway \
  --region ap-northeast-1 \
  --image-scanning-configuration scanOnPush=true
```

### 1.4: Push to ECR

```bash
# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=ap-northeast-1
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Authenticate Docker to ECR
aws ecr get-login-password --region ${REGION} | \
  docker login --username AWS --password-stdin ${ECR_URL}

# Tag image
docker tag miyabi-sse-gateway:latest \
  ${ECR_URL}/miyabi-sse-gateway:latest

# Push image
docker push ${ECR_URL}/miyabi-sse-gateway:latest
```

---

## Step 2: Deploy Infrastructure with Terraform

### 2.1: Create environment config

Create `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/infrastructure/terraform/environments/dev/mcp-sse.tf`:

```hcl
module "mcp_sse_gateway" {
  source = "../../modules/mcp-sse-gateway"

  project_name = "miyabi"
  environment  = "dev"
  region       = "ap-northeast-1"

  # VPC Configuration
  vpc_id              = "vpc-XXXXX"  # Your VPC ID
  public_subnet_ids   = ["subnet-AAAA", "subnet-BBBB"]  # ALB subnets
  private_subnet_ids  = ["subnet-CCCC", "subnet-DDDD"]  # ECS subnets

  # ECR Configuration
  ecr_repository_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.ap-northeast-1.amazonaws.com/miyabi-sse-gateway"
  image_tag          = "latest"

  # Task Configuration
  desired_count = 1
  cpu           = 512
  memory        = 1024

  # Environment Variables
  miyabi_rules_api_url = "https://api.example.com"
  miyabi_api_key       = "your-api-key"  # TODO: Move to Secrets Manager

  # Optional: HTTPS Certificate
  # certificate_arn = "arn:aws:acm:ap-northeast-1:XXXXX:certificate/XXXXX"

  # Security: Allow from specific CIDR (default: all)
  # allowed_cidr_blocks = ["YOUR_IP/32"]
}

data "aws_caller_identity" "current" {}

output "sse_endpoints" {
  value = {
    tmux_endpoint  = module.mcp_sse_gateway.sse_tmux_endpoint
    rules_endpoint = module.mcp_sse_gateway.sse_rules_endpoint
    health_check   = module.mcp_sse_gateway.health_check_endpoint
  }
}
```

### 2.2: Deploy

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/infrastructure/terraform/environments/dev

# Initialize Terraform
terraform init

# Plan
terraform plan -out=tfplan-mcp-sse

# Apply
terraform apply tfplan-mcp-sse
```

### 2.3: Get Endpoints

```bash
terraform output sse_endpoints
```

Output example:
```
{
  "health_check" = "http://miyabi-mcp-sse-dev-1234567890.ap-northeast-1.elb.amazonaws.com/health"
  "rules_endpoint" = "http://miyabi-mcp-sse-dev-1234567890.ap-northeast-1.elb.amazonaws.com/sse/rules"
  "tmux_endpoint" = "http://miyabi-mcp-sse-dev-1234567890.ap-northeast-1.elb.amazonaws.com/sse/tmux"
}
```

---

## Step 3: Configure Claude Desktop

### 3.1: Update MCP Server Config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-tmux-sse": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sse-client",
        "https://your-alb-url.ap-northeast-1.elb.amazonaws.com/sse/tmux"
      ]
    },
    "miyabi-rules-sse": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-sse-client",
        "https://your-alb-url.ap-northeast-1.elb.amazonaws.com/sse/rules"
      ]
    }
  }
}
```

### 3.2: Restart Claude Desktop

Completely quit and restart Claude Desktop app.

### 3.3: Verify Connection

In a new Claude Desktop chat:
```
Can you list available MCP tools?
```

Expected tools:
- `tmux_list_sessions`
- `tmux_list_panes`
- `tmux_send_message`
- `tmux_join_commhub`
- `tmux_get_commhub_status`
- `miyabi_list_rules`
- `miyabi_verify_task`
- `miyabi_execute_rule`
- `miyabi_get_context`

---

## 🔍 Monitoring & Troubleshooting

### Check ECS Service Status

```bash
aws ecs describe-services \
  --cluster miyabi-mcp-sse-dev \
  --services miyabi-sse-gateway-dev \
  --region ap-northeast-1
```

### View Logs

```bash
# Get log stream name
aws logs describe-log-streams \
  --log-group-name /ecs/miyabi-sse-gateway-dev \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region ap-northeast-1

# View logs
aws logs tail /ecs/miyabi-sse-gateway-dev \
  --follow \
  --region ap-northeast-1
```

### Test SSE Connection

```bash
# Test from terminal
curl -N https://your-alb-url/sse/tmux

# Should see:
# Miyabi tmux MCP Server running on stdio
# : keep-alive
# ...
```

### Common Issues

#### 1. Health Check Failing

**Symptom**: ECS tasks keep restarting

**Solution**:
```bash
# Check task logs
aws logs tail /ecs/miyabi-sse-gateway-dev --follow

# Verify health endpoint
curl https://your-alb-url/health
```

#### 2. SSE Connection Drops

**Symptom**: Connection closes after ~60 seconds

**Solution**: Check ALB idle timeout
```bash
aws elbv2 describe-load-balancers \
  --names miyabi-mcp-sse-dev \
  --query 'LoadBalancers[0].Attributes' \
  --region ap-northeast-1

# Should show: idle_timeout.timeout_seconds = 300
```

#### 3. MCP Tools Not Available

**Symptom**: Claude doesn't recognize MCP tools

**Solution**:
1. Verify Claude Desktop config is valid JSON
2. Check SSE endpoint is accessible
3. Restart Claude Desktop completely
4. Check browser console for MCP connection errors

---

## 🔐 Security Best Practices

### 1. Use AWS Secrets Manager for API Keys

Instead of hardcoding `miyabi_api_key`:

```hcl
# Store secret
resource "aws_secretsmanager_secret" "miyabi_api_key" {
  name = "miyabi-api-key-${var.environment}"
}

resource "aws_secretsmanager_secret_version" "miyabi_api_key" {
  secret_id     = aws_secretsmanager_secret.miyabi_api_key.id
  secret_string = var.miyabi_api_key
}

# Reference in ECS task
environment = [
  {
    name  = "MIYABI_API_KEY"
    valueFrom = aws_secretsmanager_secret.miyabi_api_key.arn
  }
]
```

### 2. Restrict CIDR Access

```hcl
allowed_cidr_blocks = ["YOUR_OFFICE_IP/32"]
```

### 3. Enable HTTPS with ACM Certificate

```hcl
certificate_arn = "arn:aws:acm:ap-northeast-1:XXXXX:certificate/XXXXX"
```

### 4. Enable VPC Flow Logs

```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-XXXXX \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs
```

---

## 💰 Cost Estimation

### Monthly Costs (Tokyo Region)

| Resource | Spec | Cost/month (USD) |
|----------|------|------------------|
| ECS Fargate | 0.5 vCPU, 1GB RAM, 1 task | ~$14 |
| ALB | 1 instance | ~$18 |
| CloudWatch Logs | 1GB/month | ~$0.50 |
| Data Transfer | 10GB/month | ~$1 |
| **Total** | - | **~$33.50/month** |

**Note**: Actual costs may vary based on usage.

---

## 🔄 Update Procedure

### Update Docker Image

```bash
# 1. Build new image
docker build -t miyabi-sse-gateway:v1.1.0 \
  -f miyabi-sse-gateway/Dockerfile .

# 2. Push to ECR
docker tag miyabi-sse-gateway:v1.1.0 \
  ${ECR_URL}/miyabi-sse-gateway:v1.1.0
docker push ${ECR_URL}/miyabi-sse-gateway:v1.1.0

# 3. Update Terraform
# Edit environments/dev/mcp-sse.tf
# image_tag = "v1.1.0"

# 4. Apply
terraform apply

# 5. Force new deployment
aws ecs update-service \
  --cluster miyabi-mcp-sse-dev \
  --service miyabi-sse-gateway-dev \
  --force-new-deployment \
  --region ap-northeast-1
```

---

## 📊 Next Steps

1. ✅ Setup Route53 for custom domain
2. ✅ Enable auto-scaling based on CPU/memory
3. ✅ Add CloudWatch alarms for monitoring
4. ✅ Implement CI/CD pipeline (GitHub Actions)
5. ✅ Add authentication layer (API Gateway + Cognito)

---

## 📞 Support

For issues or questions:
- Check CloudWatch Logs first
- Review ECS service events
- Consult this documentation
- Contact Miyabi team

---

**Deployment Status**: ⚪ Ready to Deploy
**Last Updated**: 2025-11-18
**Maintainer**: Miyabi Team
