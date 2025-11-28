#!/bin/bash
# Miyabi Lambda API Build Script
# Issue #1169 - AWS Lambda + API Gateway デプロイ環境構築
#
# Usage:
#   ./scripts/build-lambda.sh          # Build for arm64 (recommended)
#   ./scripts/build-lambda.sh x86_64   # Build for x86_64

set -euo pipefail

ARCH="${1:-arm64}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRATE_DIR="${PROJECT_ROOT}/crates/miyabi-web-api"
DIST_DIR="${PROJECT_ROOT}/dist/lambda"

echo "🚀 Building Miyabi Lambda API"
echo "   Architecture: ${ARCH}"
echo "   Project Root: ${PROJECT_ROOT}"
echo ""

# Check if cargo-lambda is installed
if ! command -v cargo-lambda &> /dev/null; then
    echo "❌ cargo-lambda not found. Installing..."
    cargo install cargo-lambda
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

# Build Lambda binary
echo "🔨 Building Lambda binary..."
cd "${PROJECT_ROOT}"

if [ "${ARCH}" = "arm64" ]; then
    cargo lambda build \
        --release \
        --arm64 \
        --package miyabi-web-api \
        --bin lambda-api \
        --features lambda
else
    cargo lambda build \
        --release \
        --package miyabi-web-api \
        --bin lambda-api \
        --features lambda
fi

# Copy bootstrap binary
echo "📦 Packaging Lambda deployment..."
BOOTSTRAP_PATH="${PROJECT_ROOT}/target/lambda/lambda-api/bootstrap"

if [ ! -f "${BOOTSTRAP_PATH}" ]; then
    echo "❌ Bootstrap binary not found at ${BOOTSTRAP_PATH}"
    exit 1
fi

cp "${BOOTSTRAP_PATH}" "${DIST_DIR}/bootstrap"

# Create ZIP file
cd "${DIST_DIR}"
zip -j "miyabi-api-${ARCH}.zip" bootstrap

# Verify
echo ""
echo "✅ Build complete!"
echo "   ZIP: ${DIST_DIR}/miyabi-api-${ARCH}.zip"
echo "   Size: $(du -h "miyabi-api-${ARCH}.zip" | cut -f1)"
echo ""
echo "📋 Next steps:"
echo "   1. Update infrastructure/terraform/environments/dev/terraform.tfvars:"
echo "      lambda_zip_path = \"${DIST_DIR}/miyabi-api-${ARCH}.zip\""
echo ""
echo "   2. Run Terraform:"
echo "      cd infrastructure/terraform/environments/dev"
echo "      terraform plan"
echo "      terraform apply"

