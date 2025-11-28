#!/bin/bash
# Miyabi Frontend Deploy Script
# Usage: ./deploy/deploy-frontend.sh

set -e

# Configuration
S3_BUCKET="miyabi-webui-211234825975"
CLOUDFRONT_DISTRIBUTION_ID="E1114G9SW1V5FC"
FRONTEND_DIR="crates/miyabi-console"

echo "=========================================="
echo "[DEPLOY] Miyabi Frontend Deployment"
echo "=========================================="

# Step 1: Build frontend
echo "[1/4] Building frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    npm ci --silent 2>/dev/null || npm install --silent
    npm run build
    cd -
    BUILD_DIR="$FRONTEND_DIR/dist"
else
    echo "ERROR: Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Step 2: Verify build
if [ ! -d "$BUILD_DIR" ]; then
    echo "ERROR: Build directory not found: $BUILD_DIR"
    exit 1
fi

echo "[2/4] Build completed. Files:"
ls -la "$BUILD_DIR"

# Step 3: Upload to S3
echo "[3/4] Uploading to S3..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html with no-cache
aws s3 cp "$BUILD_DIR/index.html" "s3://$S3_BUCKET/index.html" \
    --cache-control "no-cache,no-store,must-revalidate"

# Upload JSON files with short cache
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET/" \
    --exclude "*" \
    --include "*.json" \
    --cache-control "max-age=300,public"

echo "S3 upload completed."

# Step 4: Invalidate CloudFront cache
echo "[4/4] Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)

echo "CloudFront invalidation started: $INVALIDATION_ID"

echo "=========================================="
echo "[DEPLOY] COMPLETED"
echo "=========================================="
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo "URL: https://miyabi-society.com"
echo "=========================================="
