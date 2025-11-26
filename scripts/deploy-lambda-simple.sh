#!/bin/bash
# Simplified Lambda Deployment Script
# Uses pre-built bootstrap.zip from MUGEN
# Created: 2025-11-26

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    exit 1
}

# Configuration
ENVIRONMENT="${1:-production}"
AWS_REGION="us-east-1"
FUNCTION_NAME="miyabi-api-${ENVIRONMENT}"
LAMBDA_ROLE_NAME="miyabi-lambda-execution-role"
LAMBDA_ZIP="target/lambda/bootstrap.zip"

# Check if bootstrap.zip exists
if [ ! -f "$LAMBDA_ZIP" ]; then
    error "Lambda package not found: $LAMBDA_ZIP"
fi

# Load DATABASE_URL
if [ ! -f "config/.database-url-prod.txt" ]; then
    error "DATABASE_URL not found. Run RDS provisioning first."
fi

DATABASE_URL=$(cat config/.database-url-prod.txt)

# Load JWT secret
if [ ! -f "config/.jwt-secret-${ENVIRONMENT}.txt" ]; then
    error "JWT secret not found"
fi

JWT_SECRET=$(cat "config/.jwt-secret-${ENVIRONMENT}.txt")

log "🚀 Starting Miyabi Lambda Deployment"
log "Environment: $ENVIRONMENT"
log "Region: $AWS_REGION"
log "Function: $FUNCTION_NAME"
log "Package: $LAMBDA_ZIP ($(ls -lh $LAMBDA_ZIP | awk '{print $5}'))"

# Step 1: Check if IAM role exists, create if needed
log "🔐 Step 1: Checking IAM execution role..."

ROLE_ARN=$(aws iam get-role --role-name $LAMBDA_ROLE_NAME --query 'Role.Arn' --output text 2>/dev/null || echo "")

if [ -z "$ROLE_ARN" ]; then
    log "Creating IAM role: $LAMBDA_ROLE_NAME"

    # Create trust policy
    cat > /tmp/lambda-trust-policy.json <<EOF
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

    ROLE_ARN=$(aws iam create-role \
        --role-name $LAMBDA_ROLE_NAME \
        --assume-role-policy-document file:///tmp/lambda-trust-policy.json \
        --query 'Role.Arn' \
        --output text)

    # Attach basic Lambda execution policy
    aws iam attach-role-policy \
        --role-name $LAMBDA_ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

    log "✅ Created IAM role: $ROLE_ARN"
    log "⏳ Waiting 10 seconds for IAM propagation..."
    sleep 10
else
    log "✅ IAM role exists: $ROLE_ARN"
fi

# Step 2: Create or update Lambda function
log "🚀 Step 2: Deploying Lambda function..."

FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION 2>/dev/null || echo "")

if [ -z "$FUNCTION_EXISTS" ]; then
    log "Creating new Lambda function: $FUNCTION_NAME"

    aws lambda create-function \
        --region $AWS_REGION \
        --function-name $FUNCTION_NAME \
        --runtime provided.al2 \
        --handler bootstrap \
        --zip-file fileb://$LAMBDA_ZIP \
        --role $ROLE_ARN \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables="{DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,RUST_LOG=info}" \
        --description "Miyabi Web API ($ENVIRONMENT)" || error "Failed to create Lambda function"

    log "✅ Lambda function created"
else
    log "Updating existing Lambda function: $FUNCTION_NAME"

    aws lambda update-function-code \
        --region $AWS_REGION \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://$LAMBDA_ZIP || error "Failed to update Lambda code"

    # Wait for update to complete
    aws lambda wait function-updated \
        --region $AWS_REGION \
        --function-name $FUNCTION_NAME

    # Update environment variables
    aws lambda update-function-configuration \
        --region $AWS_REGION \
        --function-name $FUNCTION_NAME \
        --environment Variables="{DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,RUST_LOG=info}" || warn "Failed to update Lambda config"

    log "✅ Lambda function updated"
fi

# Step 3: Create API Gateway HTTP API
log "🌐 Step 3: Setting up API Gateway..."

API_NAME="miyabi-api-${ENVIRONMENT}"
API_ID=$(aws apigatewayv2 get-apis --region $AWS_REGION --query "Items[?Name=='$API_NAME'].ApiId" --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ]; then
    log "Creating API Gateway: $API_NAME"

    # Get Lambda ARN
    LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION --query 'Configuration.FunctionArn' --output text)

    # Create API
    API_ID=$(aws apigatewayv2 create-api \
        --region $AWS_REGION \
        --name $API_NAME \
        --protocol-type HTTP \
        --target $LAMBDA_ARN \
        --query 'ApiId' \
        --output text)

    log "✅ API Gateway created: $API_ID"

    # Grant API Gateway permission to invoke Lambda
    aws lambda add-permission \
        --region $AWS_REGION \
        --function-name $FUNCTION_NAME \
        --statement-id apigateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${AWS_REGION}:*:${API_ID}/*/*" || warn "Permission already exists"

else
    log "✅ API Gateway exists: $API_ID"
fi

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-apis --region $AWS_REGION --query "Items[?ApiId=='$API_ID'].ApiEndpoint" --output text)

log "📍 API Endpoint: $API_ENDPOINT"

# Step 4: Test Lambda function
log "🧪 Step 4: Testing Lambda function..."

TEST_RESULT=$(aws lambda invoke \
    --region $AWS_REGION \
    --function-name $FUNCTION_NAME \
    --payload '{"rawPath":"/api/v1/health","requestContext":{"http":{"method":"GET"}}}' \
    /tmp/lambda-test-response.json 2>&1 || echo "")

if grep -q "200" /tmp/lambda-test-response.json 2>/dev/null; then
    log "✅ Lambda health check passed"
else
    warn "⚠️  Lambda test may have failed. Check logs:"
    cat /tmp/lambda-test-response.json 2>/dev/null || echo "(no response)"
fi

# Step 5: Save configuration
log "💾 Step 5: Saving deployment configuration..."

CONFIG_FILE="config/lambda-${ENVIRONMENT}.env"

cat > $CONFIG_FILE <<EOF
# Miyabi Lambda Deployment Configuration - $ENVIRONMENT
# Generated: $(date)
# DO NOT COMMIT THIS FILE

# Lambda Configuration
LAMBDA_FUNCTION_NAME="$FUNCTION_NAME"
LAMBDA_ARN="$(aws lambda get-function --function-name $FUNCTION_NAME --region $AWS_REGION --query 'Configuration.FunctionArn' --output text)"
LAMBDA_ROLE_ARN="$ROLE_ARN"

# API Gateway Configuration
API_GATEWAY_ID="$API_ID"
API_ENDPOINT="$API_ENDPOINT"

# Application Configuration
DATABASE_URL="$DATABASE_URL"
JWT_SECRET="$JWT_SECRET"
RUST_LOG="info"

# AWS Configuration
AWS_REGION="$AWS_REGION"
EOF

log "✅ Configuration saved to: $CONFIG_FILE"

# Summary
log "🎉 Lambda Deployment Complete!"
log ""
log "📋 Summary:"
log "   Function Name: $FUNCTION_NAME"
log "   API Endpoint: $API_ENDPOINT"
log "   Region: $AWS_REGION"
log ""
log "🔗 Test your API:"
log "   curl $API_ENDPOINT/api/v1/health"
log ""
log "📊 Monitor logs:"
log "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region $AWS_REGION"
log ""
log "💰 Estimated Monthly Cost:"
log "   Lambda (1M requests): ~$0-5"
log "   API Gateway: ~$1"
log "   Total: ~$1-6/month"
log ""
log "🚀 Next Steps:"
log "   1. Test API endpoints: curl $API_ENDPOINT/api/v1/health"
log "   2. Update CloudFront API_BASE: $API_ENDPOINT"
log "   3. Deploy frontend with new API_BASE"
