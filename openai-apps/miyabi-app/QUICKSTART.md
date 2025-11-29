# Miyabi MCP Server - Quick Start Guide

Get the Miyabi MCP Server running on AWS Lambda in under 10 minutes.

## TL;DR

```bash
cd openai-apps/miyabi-app
export GITHUB_TOKEN=ghp_your_token_here
./deploy-lambda.sh
```

That's it! ✨

---

## Step-by-Step Guide

### Step 1: Prerequisites (2 minutes)

Install required tools:

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., ap-northeast-1)

# Install AWS SAM CLI
pip install aws-sam-cli

# Verify installations
aws --version
sam --version
```

### Step 2: Get GitHub Token (1 minute)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `read:user`
4. Copy the token (starts with `ghp_`)

### Step 3: Deploy (5 minutes)

```bash
# Navigate to app directory
cd openai-apps/miyabi-app

# Set your GitHub token
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Deploy!
./deploy-lambda.sh
```

The script will:
- ✅ Check prerequisites
- ✅ Build application
- ✅ Deploy to AWS Lambda
- ✅ Set up API Gateway
- ✅ Test endpoints
- ✅ Display access token

### Step 4: Test (1 minute)

Copy the API URL and access token from the deployment output:

```bash
# Test health endpoint
curl https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/

# Test MCP endpoint
curl -X POST https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Alternative: Pure AWS CLI Method

If you don't want to install SAM CLI:

```bash
cd openai-apps/miyabi-app
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
./deploy-lambda-cli.sh
```

---

## What You Get

After deployment, you'll have:

- **Lambda Function**: Running FastAPI with 21 MCP agents
- **API Gateway**: HTTPS endpoint for your function
- **CloudWatch Logs**: Automatic logging and monitoring
- **OAuth Support**: Authentication endpoints
- **MCP Tools**: 24+ tools for GitHub, system monitoring, Obsidian, etc.

---

## Common Use Cases

### 1. Execute an Agent

```bash
curl -X POST $API_URL/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "execute_agent",
      "arguments": {
        "agent": "codegen",
        "issue_number": 123
      }
    }
  }'
```

### 2. Create GitHub Issue

```bash
curl -X POST $API_URL/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_issue",
      "arguments": {
        "title": "New feature request",
        "body": "Description of the feature"
      }
    }
  }'
```

### 3. Get Project Status

```bash
curl -X POST $API_URL/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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

---

## Environment Variables

Optional environment variables for deployment:

```bash
# Deployment configuration
export STACK_NAME=my-miyabi-stack        # CloudFormation stack name
export STAGE=prod                        # Deployment stage (dev/staging/prod)
export AWS_REGION=ap-northeast-1         # AWS region

# Application configuration
export GITHUB_TOKEN=ghp_xxx              # Required: GitHub access token
export MIYABI_ACCESS_TOKEN=xxx           # Optional: Will auto-generate if not set

# Deploy with custom configuration
./deploy-lambda.sh
```

---

## Monitoring

View logs in real-time:

```bash
aws logs tail /aws/lambda/miyabi-mcp-server-prod --follow
```

Check function metrics:

```bash
# Open AWS Console
open "https://console.aws.amazon.com/lambda/home?region=ap-northeast-1#/functions/miyabi-mcp-server-prod"
```

---

## Updating

To update your deployment with code changes:

```bash
# Make your changes to the code
# Then re-run deployment
./deploy-lambda.sh
```

SAM will automatically detect changes and update only what's necessary.

---

## Troubleshooting

### "SAM CLI not found"

```bash
pip install aws-sam-cli
```

### "AWS credentials not configured"

```bash
aws configure
# Enter your AWS credentials
```

### "Access Denied" errors

Make sure your AWS user has these permissions:
- Lambda: Full access
- API Gateway: Full access
- IAM: Create roles and policies
- CloudFormation: Full access
- S3: Create and write to buckets

### "Deployment failed"

Check the detailed logs:

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name miyabi-mcp-server \
  --max-items 20
```

---

## Cost

**Estimated monthly cost for low-medium usage:**
- Free tier (first 12 months): **$0/month**
- After free tier: **~$7-70/month** depending on usage

See [DEPLOYMENT.md](./DEPLOYMENT.md#cost-estimation) for detailed cost breakdown.

---

## Next Steps

1. **Read the full documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Set up custom domain**: Use Route 53 + ACM
3. **Add monitoring**: CloudWatch Alarms
4. **Implement CI/CD**: GitHub Actions
5. **Scale up**: Increase Lambda memory/timeout as needed

---

## Support

- **Full documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: https://github.com/customer-cloud/miyabi-private/issues
- **Logs**: `aws logs tail /aws/lambda/miyabi-mcp-server-prod --follow`

---

**Happy deploying! 🚀**
