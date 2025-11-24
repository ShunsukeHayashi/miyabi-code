#!/bin/bash

###############################################################################
# Miyabi Console - Manual Deployment Script
#
# Usage:
#   ./scripts/deploy.sh [production|staging]
#
# Prerequisites:
#   - AWS CLI configured with miyabi-production profile
#   - Node.js 20+ installed
#   - Build completed (npm run build)
###############################################################################

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
AWS_PROFILE="miyabi-production"
AWS_REGION="ap-northeast-1"

# Environment-specific variables
if [ "$ENVIRONMENT" == "production" ]; then
  S3_BUCKET="miyabi-console-production"
  DISTRIBUTION_COMMENT="Miyabi Console Production Distribution"
  DOMAIN="miyabi-world.com"
elif [ "$ENVIRONMENT" == "staging" ]; then
  S3_BUCKET="miyabi-console-staging"
  DISTRIBUTION_COMMENT="Miyabi Console Staging Distribution"
  DOMAIN="staging.miyabi-world.com"
else
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Usage: $0 [production|staging]"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Miyabi Console Deployment${NC}"
echo -e "${GREEN}Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ========================================
# 1. Pre-flight Checks
# ========================================
echo -e "${YELLOW}[1/8] Running pre-flight checks...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
  exit 1
fi

# Check if dist/ directory exists
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build directory not found. Run 'npm run build' first.${NC}"
  exit 1
fi

# Verify AWS credentials
echo "Verifying AWS credentials..."
AWS_ACCOUNT=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text 2>/dev/null || echo "")

if [ -z "$AWS_ACCOUNT" ]; then
  echo -e "${RED}❌ AWS credentials not configured for profile: $AWS_PROFILE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT${NC}"

# ========================================
# 2. Build Check
# ========================================
echo ""
echo -e "${YELLOW}[2/8] Checking build output...${NC}"

BUILD_SIZE=$(du -sh dist/ | awk '{print $1}')
echo "Build size: $BUILD_SIZE"

ls -lh dist/

# ========================================
# 3. Backup Current Deployment
# ========================================
echo ""
echo -e "${YELLOW}[3/8] Creating backup of current deployment...${NC}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PREFIX="backups/$TIMESTAMP"

echo "Backing up current deployment to s3://$S3_BUCKET/$BACKUP_PREFIX/"

aws s3 sync s3://$S3_BUCKET/ s3://$S3_BUCKET/$BACKUP_PREFIX/ \
  --profile $AWS_PROFILE \
  --exclude "backups/*" \
  --quiet

echo -e "${GREEN}✅ Backup created${NC}"

# ========================================
# 4. Upload Build Files to S3
# ========================================
echo ""
echo -e "${YELLOW}[4/8] Uploading build files to S3...${NC}"

# Sync all files except index.html (with long cache)
echo "Uploading assets with long cache..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
  --profile $AWS_PROFILE \
  --region $AWS_REGION \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html separately (with no cache)
echo "Uploading index.html with no cache..."
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
  --profile $AWS_PROFILE \
  --region $AWS_REGION \
  --cache-control "public, max-age=0, must-revalidate"

echo -e "${GREEN}✅ Files uploaded to S3${NC}"

# ========================================
# 5. Get CloudFront Distribution ID
# ========================================
echo ""
echo -e "${YELLOW}[5/8] Getting CloudFront distribution ID...${NC}"

DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --profile $AWS_PROFILE \
  --query "DistributionList.Items[?Comment=='$DISTRIBUTION_COMMENT'].Id" \
  --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
  echo -e "${RED}❌ CloudFront distribution not found with comment: $DISTRIBUTION_COMMENT${NC}"
  exit 1
fi

echo "Distribution ID: $DISTRIBUTION_ID"
echo -e "${GREEN}✅ Found distribution${NC}"

# ========================================
# 6. Invalidate CloudFront Cache
# ========================================
echo ""
echo -e "${YELLOW}[6/8] Invalidating CloudFront cache...${NC}"

INVALIDATION_OUTPUT=$(aws cloudfront create-invalidation \
  --profile $AWS_PROFILE \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --output json)

INVALIDATION_ID=$(echo $INVALIDATION_OUTPUT | jq -r '.Invalidation.Id')

echo "Invalidation ID: $INVALIDATION_ID"
echo -e "${GREEN}✅ Cache invalidation created${NC}"

# ========================================
# 7. Wait for Invalidation to Complete
# ========================================
echo ""
echo -e "${YELLOW}[7/8] Waiting for invalidation to complete...${NC}"

echo "This may take 1-3 minutes..."

aws cloudfront wait invalidation-completed \
  --profile $AWS_PROFILE \
  --distribution-id $DISTRIBUTION_ID \
  --id $INVALIDATION_ID

echo -e "${GREEN}✅ Invalidation completed${NC}"

# ========================================
# 8. Verify Deployment
# ========================================
echo ""
echo -e "${YELLOW}[8/8] Verifying deployment...${NC}"

echo "Checking https://$DOMAIN ..."

# Wait a few seconds for DNS propagation
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✅ Deployment successful!${NC}"
else
  echo -e "${RED}❌ Deployment verification failed (HTTP $HTTP_STATUS)${NC}"
  echo ""
  echo -e "${YELLOW}Rollback instructions:${NC}"
  echo "  aws s3 sync s3://$S3_BUCKET/$BACKUP_PREFIX/ s3://$S3_BUCKET/ --profile $AWS_PROFILE --delete"
  echo "  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths \"/*\" --profile $AWS_PROFILE"
  exit 1
fi

# ========================================
# Deployment Summary
# ========================================
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment:    $ENVIRONMENT"
echo "Domain:         https://$DOMAIN"
echo "S3 Bucket:      $S3_BUCKET"
echo "Distribution:   $DISTRIBUTION_ID"
echo "Backup:         s3://$S3_BUCKET/$BACKUP_PREFIX/"
echo "Build Size:     $BUILD_SIZE"
echo "Deployed At:    $(date)"
echo ""
echo -e "${GREEN}✅ All systems operational${NC}"
echo ""

# Optional: Open browser
read -p "Open https://$DOMAIN in browser? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  open "https://$DOMAIN" 2>/dev/null || xdg-open "https://$DOMAIN" 2>/dev/null || echo "Please open manually: https://$DOMAIN"
fi
