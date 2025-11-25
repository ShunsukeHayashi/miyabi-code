#!/bin/bash
# Pantheon Webapp Deployment Script
# Issue: #852 - GitHub Actions CI/CD パイプライン構築
#
# Usage:
#   ./scripts/deploy-pantheon.sh [staging|production]
#
# Environment variables required:
#   AWS_PROFILE or AWS credentials
#   S3_BUCKET (optional, will use default based on environment)
#   CLOUDFRONT_DISTRIBUTION_ID (optional, will use default based on environment)

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
WEBAPP_DIR="${PROJECT_ROOT}/apps/pantheon-webapp"

# Environment
ENVIRONMENT="${1:-staging}"

# Validate environment
if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'.${NC}"
    exit 1
fi

echo -e "${BLUE}=== Pantheon Webapp Deployment ===${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Set defaults based on environment
if [[ "${ENVIRONMENT}" == "production" ]]; then
    S3_BUCKET="${S3_BUCKET:-pantheon-webapp-production}"
    CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
    API_URL="${API_URL:-https://api.pantheon.example.com}"
    WS_URL="${WS_URL:-wss://api.pantheon.example.com/ws}"
else
    S3_BUCKET="${S3_BUCKET:-pantheon-webapp-staging}"
    CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
    API_URL="${API_URL:-https://api.staging.pantheon.example.com}"
    WS_URL="${WS_URL:-wss://api.staging.pantheon.example.com/ws}"
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    exit 1
fi

# Check if webapp directory exists
if [[ ! -d "${WEBAPP_DIR}" ]]; then
    echo -e "${RED}Error: Webapp directory not found at ${WEBAPP_DIR}${NC}"
    exit 1
fi

# Change to webapp directory
cd "${WEBAPP_DIR}"

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1/5: Installing dependencies...${NC}"
npm ci

# Step 2: Run linting
echo -e "${YELLOW}Step 2/5: Running linting...${NC}"
npm run lint || {
    echo -e "${RED}Linting failed. Please fix errors before deploying.${NC}"
    exit 1
}

# Step 3: Build
echo -e "${YELLOW}Step 3/5: Building for ${ENVIRONMENT}...${NC}"
NEXT_PUBLIC_API_URL="${API_URL}" \
NEXT_PUBLIC_WS_URL="${WS_URL}" \
npm run build

# Check if build output exists
if [[ ! -d "out" && ! -d ".next" ]]; then
    echo -e "${RED}Error: Build output not found.${NC}"
    exit 1
fi

# Determine build output directory
if [[ -d "out" ]]; then
    BUILD_DIR="out"
else
    BUILD_DIR=".next"
fi

# Step 4: Deploy to S3
echo -e "${YELLOW}Step 4/5: Deploying to S3 (${S3_BUCKET})...${NC}"

# Sync static assets with long cache
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET}/" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "_next/data/*"

# Sync HTML files with no-cache
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET}/" \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html"

echo -e "${GREEN}S3 sync completed.${NC}"

# Step 5: Invalidate CloudFront
if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID}" ]]; then
    echo -e "${YELLOW}Step 5/5: Invalidating CloudFront cache...${NC}"

    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)

    echo -e "${GREEN}CloudFront invalidation created: ${INVALIDATION_ID}${NC}"

    # Wait for invalidation to complete (optional)
    echo "Waiting for invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
        --id "${INVALIDATION_ID}"

    echo -e "${GREEN}CloudFront invalidation completed.${NC}"
else
    echo -e "${YELLOW}Step 5/5: Skipping CloudFront invalidation (no distribution ID provided).${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "S3 Bucket: ${S3_BUCKET}"
echo -e "CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID:-N/A}"
echo -e "API URL: ${API_URL}"
echo -e "Deployed at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
