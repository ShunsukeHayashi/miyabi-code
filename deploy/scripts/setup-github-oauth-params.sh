#!/bin/bash
# Setup GitHub OAuth parameters in AWS Parameter Store
# Usage: ./setup-github-oauth-params.sh

set -e

REGION="${AWS_REGION:-ap-northeast-1}"
ENVIRONMENT="${ENVIRONMENT:-production}"
PREFIX="/miyabi/${ENVIRONMENT}"

echo "Setting up GitHub OAuth parameters in AWS Parameter Store"
echo "Region: ${REGION}"
echo "Environment: ${ENVIRONMENT}"
echo "Prefix: ${PREFIX}"
echo ""

# Check if required environment variables are set
if [ -z "$GITHUB_CLIENT_ID" ]; then
    echo "Error: GITHUB_CLIENT_ID is not set"
    exit 1
fi

if [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "Error: GITHUB_CLIENT_SECRET is not set"
    exit 1
fi

# Generate JWT secret if not provided
if [ -z "$JWT_SECRET" ]; then
    echo "Generating new JWT secret..."
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
fi

# Store GitHub Client ID
echo "Storing GitHub Client ID..."
aws ssm put-parameter \
    --region "$REGION" \
    --name "${PREFIX}/github-client-id" \
    --value "$GITHUB_CLIENT_ID" \
    --type "SecureString" \
    --overwrite

# Store GitHub Client Secret
echo "Storing GitHub Client Secret..."
aws ssm put-parameter \
    --region "$REGION" \
    --name "${PREFIX}/github-client-secret" \
    --value "$GITHUB_CLIENT_SECRET" \
    --type "SecureString" \
    --overwrite

# Store JWT Secret
echo "Storing JWT Secret..."
aws ssm put-parameter \
    --region "$REGION" \
    --name "${PREFIX}/jwt-secret" \
    --value "$JWT_SECRET" \
    --type "SecureString" \
    --overwrite

# Store GitHub Callback URL
CALLBACK_URL="${GITHUB_CALLBACK_URL:-https://miyabi-society.com/api/v1/auth/github/callback}"
echo "Storing GitHub Callback URL..."
aws ssm put-parameter \
    --region "$REGION" \
    --name "${PREFIX}/github-callback-url" \
    --value "$CALLBACK_URL" \
    --type "String" \
    --overwrite

# Store Frontend URL
FRONTEND_URL="${FRONTEND_URL:-https://miyabi-society.com}"
echo "Storing Frontend URL..."
aws ssm put-parameter \
    --region "$REGION" \
    --name "${PREFIX}/frontend-url" \
    --value "$FRONTEND_URL" \
    --type "String" \
    --overwrite

echo ""
echo "All parameters stored successfully!"
echo ""
echo "Parameters created:"
echo "  ${PREFIX}/github-client-id"
echo "  ${PREFIX}/github-client-secret"
echo "  ${PREFIX}/jwt-secret"
echo "  ${PREFIX}/github-callback-url"
echo "  ${PREFIX}/frontend-url"
echo ""
echo "To verify, run:"
echo "  aws ssm get-parameters-by-path --region $REGION --path $PREFIX --with-decryption"
