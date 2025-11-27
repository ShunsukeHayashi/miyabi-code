#!/bin/bash
# Build Lambda deployment package for Miyabi API
# Requirements: cargo-lambda, zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/target/lambda"
OUTPUT_DIR="$PROJECT_ROOT/dist/lambda"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
ARCH="${1:-arm64}"
PROFILE="${2:-release}"

log_info "Building Lambda package..."
log_info "Architecture: $ARCH"
log_info "Profile: $PROFILE"

# Check for cargo-lambda
if ! command -v cargo-lambda &> /dev/null; then
    log_warn "cargo-lambda not found, installing..."
    cargo install cargo-lambda
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Build Lambda binary
cd "$PROJECT_ROOT"
log_info "Building Lambda binary..."

if [ "$ARCH" == "arm64" ]; then
    cargo lambda build --release --arm64 --package miyabi-web-api --bin lambda-api --features lambda
else
    cargo lambda build --release --package miyabi-web-api --bin lambda-api --features lambda
fi

# Find the built binary
BINARY_PATH="$TARGET_DIR/lambda-api/bootstrap"
if [ ! -f "$BINARY_PATH" ]; then
    # Try alternate path
    BINARY_PATH="$PROJECT_ROOT/target/lambda/lambda-api/bootstrap"
fi

if [ ! -f "$BINARY_PATH" ]; then
    log_error "Binary not found at expected locations"
    log_error "Searched: $TARGET_DIR/lambda-api/bootstrap"
    exit 1
fi

log_info "Binary found at: $BINARY_PATH"

# Get binary size
BINARY_SIZE=$(du -h "$BINARY_PATH" | cut -f1)
log_info "Binary size: $BINARY_SIZE"

# Create ZIP package
ZIP_FILE="$OUTPUT_DIR/miyabi-api-$ARCH.zip"
log_info "Creating deployment package: $ZIP_FILE"

cd "$(dirname "$BINARY_PATH")"
zip -j "$ZIP_FILE" bootstrap

# Verify ZIP
ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
log_info "Package size: $ZIP_SIZE"

# Output for CI/CD
echo ""
log_info "Build complete!"
echo "LAMBDA_ZIP_PATH=$ZIP_FILE"
echo "LAMBDA_ZIP_SIZE=$ZIP_SIZE"
echo "LAMBDA_ARCH=$ARCH"
