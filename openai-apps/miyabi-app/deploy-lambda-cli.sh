#!/bin/bash
# =====================================================
# Miyabi MCP Server - Deploy to AWS Lambda (Pure AWS CLI)
# Manual deployment without SAM CLI
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
FUNCTION_NAME="${FUNCTION_NAME:-miyabi-mcp-server}"
STAGE="${STAGE:-prod}"
REGION="${AWS_REGION:-ap-northeast-1}"
RUNTIME="python3.11"
HANDLER="lambda_handler.lambda_handler"
TIMEOUT=900
MEMORY=2048

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "=================================================="
echo "🚀 Miyabi MCP Server - Lambda Deployment (AWS CLI)"
echo "=================================================="
echo ""
echo "Function Name: $FUNCTION_NAME"
echo "Stage: $STAGE"
echo "Region: $REGION"
echo "Runtime: $RUNTIME"
echo ""

# Check prerequisites
log_step "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed"
    log_info "Install with: pip install awscli"
    exit 1
fi

if ! command -v zip &> /dev/null; then
    log_error "zip command not found"
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

# Create IAM role for Lambda
log_step "Creating/updating IAM role..."
ROLE_NAME="miyabi-mcp-lambda-role"

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" 2>&1 > /dev/null; then
    log_info "IAM role already exists: $ROLE_NAME"
else
    log_info "Creating IAM role: $ROLE_NAME"

    # Trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "IAM role for Miyabi MCP Lambda function"

    # Attach basic execution policy
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

    log_info "Waiting for IAM role to propagate..."
    sleep 10
fi

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"

# Build deployment package
log_step "Building deployment package..."
BUILD_DIR="/tmp/miyabi-lambda-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy source code
log_info "Copying source code..."
cp -r server/* "$BUILD_DIR/"

# Install dependencies
log_info "Installing Python dependencies..."
pip install -r server/requirements.txt -t "$BUILD_DIR/" --quiet

# Create deployment zip
log_info "Creating deployment package..."
cd "$BUILD_DIR"
zip -r /tmp/miyabi-lambda-deployment.zip . -q
cd "$SCRIPT_DIR"

PACKAGE_SIZE=$(du -h /tmp/miyabi-lambda-deployment.zip | cut -f1)
log_info "Package size: $PACKAGE_SIZE"

# Create or update Lambda function
log_step "Deploying Lambda function..."

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>&1 > /dev/null; then
    log_info "Updating existing Lambda function: $FUNCTION_NAME"

    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb:///tmp/miyabi-lambda-deployment.zip \
        --region "$REGION" \
        > /dev/null

    # Update configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --environment "Variables={
            MIYABI_ROOT=/tmp/miyabi-private,
            GITHUB_TOKEN=$GITHUB_TOKEN,
            MIYABI_REPO_OWNER=customer-cloud,
            MIYABI_REPO_NAME=miyabi-private,
            MIYABI_ACCESS_TOKEN=$MIYABI_ACCESS_TOKEN,
            OBSIDIAN_VAULT=/tmp/obsidian,
            AWS_DEFAULT_REGION=$REGION
        }" \
        --region "$REGION" \
        > /dev/null

else
    log_info "Creating new Lambda function: $FUNCTION_NAME"

    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --zip-file fileb:///tmp/miyabi-lambda-deployment.zip \
        --environment "Variables={
            MIYABI_ROOT=/tmp/miyabi-private,
            GITHUB_TOKEN=$GITHUB_TOKEN,
            MIYABI_REPO_OWNER=customer-cloud,
            MIYABI_REPO_NAME=miyabi-private,
            MIYABI_ACCESS_TOKEN=$MIYABI_ACCESS_TOKEN,
            OBSIDIAN_VAULT=/tmp/obsidian,
            AWS_DEFAULT_REGION=$REGION
        }" \
        --region "$REGION" \
        > /dev/null
fi

log_info "Waiting for function to be active..."
aws lambda wait function-active \
    --function-name "$FUNCTION_NAME" \
    --region "$REGION"

# Create or update API Gateway
log_step "Setting up API Gateway..."
API_NAME="miyabi-mcp-api"

# Check if API exists
API_ID=$(aws apigatewayv2 get-apis --region "$REGION" --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -z "$API_ID" ]; then
    log_info "Creating HTTP API: $API_NAME"

    API_ID=$(aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type HTTP \
        --region "$REGION" \
        --query 'ApiId' \
        --output text)
else
    log_info "Using existing API: $API_ID"
fi

# Create integration
log_info "Creating Lambda integration..."

# Get Lambda ARN
LAMBDA_ARN="arn:aws:lambda:${REGION}:${AWS_ACCOUNT_ID}:function:${FUNCTION_NAME}"

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" \
    --payload-format-version 2.0 \
    --region "$REGION" \
    --query 'IntegrationId' \
    --output text 2>/dev/null || \
    aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" --query 'Items[0].IntegrationId' --output text)

# Create routes
log_info "Creating API routes..."

# Root route
aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key 'ANY /' \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    2>/dev/null || log_info "Root route already exists"

# Proxy route
aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key 'ANY /{proxy+}' \
    --target "integrations/$INTEGRATION_ID" \
    --region "$REGION" \
    2>/dev/null || log_info "Proxy route already exists"

# Create stage
log_info "Creating API stage: $STAGE"
aws apigatewayv2 create-stage \
    --api-id "$API_ID" \
    --stage-name "$STAGE" \
    --auto-deploy \
    --region "$REGION" \
    2>/dev/null || log_info "Stage already exists"

# Add Lambda permission for API Gateway
log_info "Adding Lambda permission for API Gateway..."
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${AWS_ACCOUNT_ID}:${API_ID}/*/*" \
    --region "$REGION" \
    2>/dev/null || log_info "Permission already exists"

# Get API URL
API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/"

# Test deployment
log_step "Testing deployment..."
log_info "Waiting for API to be ready..."
sleep 5

log_info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL" || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "Miyabi"; then
    log_info "✅ Health check passed!"
else
    log_warn "⚠️ Health check response: $HEALTH_RESPONSE"
fi

# Cleanup
log_step "Cleaning up temporary files..."
rm -rf "$BUILD_DIR"
rm -f /tmp/miyabi-lambda-deployment.zip
rm -f /tmp/trust-policy.json

# Summary
echo ""
echo "========================================"
echo "🎉 Deployment Complete!"
echo "========================================"
echo ""
echo "Function Name: $FUNCTION_NAME"
echo "API ID:        $API_ID"
echo "API URL:       $API_URL"
echo "Region:        $REGION"
echo "Stage:         $STAGE"
echo ""
echo "Access Token:  $MIYABI_ACCESS_TOKEN"
echo ""
echo "Endpoints:"
echo "  Health:      ${API_URL}"
echo "  MCP:         ${API_URL}mcp"
echo "  OAuth:       ${API_URL}.well-known/oauth-authorization-server"
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
echo "Update function:"
echo "  ./deploy-lambda-cli.sh"
echo ""
echo "Delete function:"
echo "  aws lambda delete-function --function-name $FUNCTION_NAME --region $REGION"
echo "  aws apigatewayv2 delete-api --api-id $API_ID --region $REGION"
echo ""
