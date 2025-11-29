#!/bin/bash
# =====================================================
# Miyabi MCP Server - Deploy to AWS Lambda
# Using AWS SAM CLI for deployment
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
STACK_NAME="${STACK_NAME:-miyabi-mcp-server}"
STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-ap-northeast-1}"
S3_BUCKET="${S3_BUCKET:-miyabi-sam-deployments-$REGION}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo "🚀 Miyabi MCP Server - Lambda Deployment"
echo "========================================"
echo ""
echo "Stack Name: $STACK_NAME"
echo "Stage: $STAGE"
echo "Region: $REGION"
echo "S3 Bucket: $S3_BUCKET"
echo ""

# Check prerequisites
log_step "Checking prerequisites..."

if ! command -v sam &> /dev/null; then
    log_error "AWS SAM CLI is not installed"
    log_info "Install with: pip install aws-sam-cli"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    log_info "Install with: pip install awscli"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured"
    log_info "Run: aws configure"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_info "Using AWS Account: $AWS_ACCOUNT_ID"

# Create S3 bucket if it doesn't exist
log_step "Ensuring S3 bucket exists: $S3_BUCKET"
if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 > /dev/null; then
    log_info "Creating S3 bucket: $S3_BUCKET"
    if [ "$REGION" = "us-east-1" ]; then
        aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
    else
        aws s3 mb "s3://$S3_BUCKET" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
    fi
else
    log_info "S3 bucket already exists"
fi

# Prepare environment variables
log_step "Preparing environment variables..."
if [ -f "server/.env" ]; then
    log_info "Loading .env file"
    export $(cat server/.env | grep -v '^#' | xargs)
fi

# Get GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    log_warn "GITHUB_TOKEN not set"
    read -p "Enter GitHub Token (or press Enter to skip): " GITHUB_TOKEN
fi

# Get Miyabi Access Token
if [ -z "$MIYABI_ACCESS_TOKEN" ]; then
    log_warn "MIYABI_ACCESS_TOKEN not set"
    log_info "Generating random access token..."
    MIYABI_ACCESS_TOKEN=$(openssl rand -base64 32)
    log_info "Generated token: $MIYABI_ACCESS_TOKEN"
    log_warn "Save this token! You'll need it to authenticate with the MCP server."
fi

# Build dependencies layer
log_step "Building Python dependencies layer..."
mkdir -p .aws-sam/dependencies/python
pip install -r server/requirements.txt -t .aws-sam/dependencies/python/ --quiet
log_info "Dependencies installed"

# SAM build
log_step "Building SAM application..."
sam build \
    --template-file template.yaml \
    --use-container \
    --region "$REGION"

# SAM deploy
log_step "Deploying to AWS Lambda..."
sam deploy \
    --template-file .aws-sam/build/template.yaml \
    --stack-name "$STACK_NAME" \
    --s3-bucket "$S3_BUCKET" \
    --s3-prefix "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        GitHubToken="$GITHUB_TOKEN" \
        MiyabiAccessToken="$MIYABI_ACCESS_TOKEN" \
        Stage="$STAGE" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

# Get outputs
log_step "Retrieving deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`MiyabiMCPApiUrl`].OutputValue' \
    --output text)

FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`MiyabiMCPFunctionName`].OutputValue' \
    --output text)

# Test deployment
log_step "Testing deployment..."
log_info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL" || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "Miyabi"; then
    log_info "✅ Health check passed!"
else
    log_warn "⚠️ Health check response: $HEALTH_RESPONSE"
fi

# Test MCP endpoint
log_info "Testing MCP endpoint..."
MCP_RESPONSE=$(curl -s -X POST "${API_URL}mcp" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MIYABI_ACCESS_TOKEN" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' || echo "FAILED")

if echo "$MCP_RESPONSE" | grep -q "protocolVersion"; then
    log_info "✅ MCP endpoint working!"
else
    log_warn "⚠️ MCP test response: $MCP_RESPONSE"
fi

# Summary
echo ""
echo "========================================"
echo "🎉 Deployment Complete!"
echo "========================================"
echo ""
echo "API URL:      $API_URL"
echo "Function:     $FUNCTION_NAME"
echo "Region:       $REGION"
echo "Stage:        $STAGE"
echo ""
echo "Access Token: $MIYABI_ACCESS_TOKEN"
echo ""
echo "Endpoints:"
echo "  Health:     ${API_URL}"
echo "  MCP:        ${API_URL}mcp"
echo "  OAuth:      ${API_URL}.well-known/oauth-authorization-server"
echo ""
echo "Test command:"
echo "  curl -X POST ${API_URL}mcp \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'Authorization: Bearer $MIYABI_ACCESS_TOKEN' \\"
echo "    -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'"
echo ""
echo "View logs:"
echo "  aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $REGION"
echo ""
