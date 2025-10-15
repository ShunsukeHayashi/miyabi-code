#!/usr/bin/env bash
# ==============================================================================
# Miyabi TypeScript → Rust Migration Script
# ==============================================================================
#
# Purpose: Automate migration from TypeScript (v1.x) to Rust (v2.x)
# Usage: ./scripts/migrate-to-rust.sh
# Requirements: bash, cargo, git
#
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 not found. Please install it first."
        return 1
    fi
    log_success "$1 found: $(command -v $1)"
}

# ==============================================================================
# Phase 1: Preparation
# ==============================================================================

log_info "=== Phase 1: Preparation ==="

# Check prerequisites
log_info "Checking prerequisites..."
check_command rustc || exit 1
check_command cargo || exit 1
check_command git || exit 1

# Check Rust version
RUST_VERSION=$(rustc --version | awk '{print $2}')
log_info "Rust version: $RUST_VERSION"

if [[ "$RUST_VERSION" < "1.75.0" ]]; then
    log_warn "Rust version $RUST_VERSION is older than recommended 1.75.0"
    log_info "Updating Rust..."
    rustup update stable
fi

# Backup existing configuration
log_info "Backing up existing configuration..."
if [ -f ".miyabi.yml" ]; then
    cp .miyabi.yml .miyabi.yml.backup
    log_success "Backed up .miyabi.yml → .miyabi.yml.backup"
fi

if [ -f ".env" ]; then
    cp .env .env.backup
    log_success "Backed up .env → .env.backup"
fi

# ==============================================================================
# Phase 2: Build Rust Edition
# ==============================================================================

log_info "=== Phase 2: Build Rust Edition ==="

# Build release binary
log_info "Building Rust binary (this may take 5-10 minutes on first build)..."
cargo build --release --bin miyabi

# Check build success
if [ -f "target/release/miyabi" ]; then
    log_success "Binary built successfully: target/release/miyabi"

    # Show binary size
    BINARY_SIZE=$(ls -lh target/release/miyabi | awk '{print $5}')
    log_info "Binary size: $BINARY_SIZE"
else
    log_error "Binary build failed"
    exit 1
fi

# ==============================================================================
# Phase 3: Configuration Migration
# ==============================================================================

log_info "=== Phase 3: Configuration Migration ==="

# Convert camelCase to snake_case in .miyabi.yml
if [ -f ".miyabi.yml" ]; then
    log_info "Converting .miyabi.yml to Rust format (camelCase → snake_case)..."

    # Create temporary file
    TMP_FILE=$(mktemp)

    # Convert common camelCase patterns
    sed 's/apiKey/api_key/g' .miyabi.yml | \
    sed 's/maxRetries/max_retries/g' | \
    sed 's/timeoutMs/timeout_ms/g' > "$TMP_FILE"

    # Show diff
    log_info "Configuration changes:"
    diff .miyabi.yml "$TMP_FILE" || true

    # Prompt for confirmation
    read -p "Apply these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv "$TMP_FILE" .miyabi.yml
        log_success "Configuration updated"
    else
        rm "$TMP_FILE"
        log_warn "Configuration changes skipped"
    fi
fi

# Update .env if needed
if [ -f ".env" ]; then
    log_info "Checking .env file..."

    # Add Rust-specific variables if missing
    if ! grep -q "RUST_LOG" .env; then
        echo "" >> .env
        echo "# Rust-specific settings" >> .env
        echo "RUST_LOG=info" >> .env
        log_success "Added RUST_LOG to .env"
    fi

    if ! grep -q "RUST_BACKTRACE" .env; then
        echo "RUST_BACKTRACE=1" >> .env
        log_success "Added RUST_BACKTRACE to .env"
    fi
fi

# ==============================================================================
# Phase 4: Installation
# ==============================================================================

log_info "=== Phase 4: Installation ==="

# Prompt for installation
read -p "Install globally to ~/.cargo/bin? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Installing miyabi CLI..."
    cargo install --path crates/miyabi-cli --force
    log_success "Installed to $(which miyabi || echo '~/.cargo/bin/miyabi')"
else
    log_info "Skipping global installation"
    log_info "You can run: ./target/release/miyabi"
fi

# ==============================================================================
# Phase 5: Verification
# ==============================================================================

log_info "=== Phase 5: Verification ==="

# Determine which binary to use
if command -v miyabi &> /dev/null; then
    MIYABI_BIN="miyabi"
else
    MIYABI_BIN="./target/release/miyabi"
fi

# Test 1: Version check
log_info "Test 1: Version check"
VERSION=$($MIYABI_BIN --version)
log_success "Version: $VERSION"

# Test 2: Help command
log_info "Test 2: Help command"
$MIYABI_BIN --help > /dev/null
log_success "Help command works"

# Test 3: Status check (if configured)
if [ -f ".miyabi.yml" ] && [ -f ".env" ]; then
    log_info "Test 3: Status check"
    if $MIYABI_BIN status > /dev/null 2>&1; then
        log_success "Status command works"
    else
        log_warn "Status command failed (may need configuration)"
    fi
fi

# Run tests
log_info "Running Rust test suite..."
if cargo test --all --quiet; then
    log_success "All tests passed"
else
    log_warn "Some tests failed (check output above)"
fi

# ==============================================================================
# Phase 6: Performance Benchmark
# ==============================================================================

log_info "=== Phase 6: Performance Benchmark ==="

# Startup time benchmark
log_info "Benchmarking startup time..."
START_TIME=$(date +%s%N)
$MIYABI_BIN --version > /dev/null
END_TIME=$(date +%s%N)
STARTUP_MS=$(( (END_TIME - START_TIME) / 1000000 ))
log_success "Startup time: ${STARTUP_MS}ms"

if [ $STARTUP_MS -lt 100 ]; then
    log_success "Excellent startup time (<100ms)"
elif [ $STARTUP_MS -lt 200 ]; then
    log_info "Good startup time (<200ms)"
else
    log_warn "Slow startup time (>${STARTUP_MS}ms)"
fi

# ==============================================================================
# Phase 7: Cleanup (Optional)
# ==============================================================================

log_info "=== Phase 7: Cleanup (Optional) ==="

# Ask about TypeScript cleanup
read -p "Remove TypeScript dependencies (node_modules, package.json)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warn "This will remove:"
    log_warn "  - node_modules/"
    log_warn "  - package.json (backed up to package.json.backup)"
    log_warn "  - package-lock.json"

    read -p "Are you sure? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        [ -d "node_modules" ] && rm -rf node_modules && log_success "Removed node_modules/"
        [ -f "package.json" ] && mv package.json package.json.backup && log_success "Backed up package.json"
        [ -f "package-lock.json" ] && rm package-lock.json && log_success "Removed package-lock.json"
    fi
else
    log_info "Skipping TypeScript cleanup"
fi

# ==============================================================================
# Summary
# ==============================================================================

echo ""
log_success "========================================="
log_success "Migration Complete!"
log_success "========================================="
echo ""
log_info "Next steps:"
echo "  1. Test agent execution: $MIYABI_BIN agent run coordinator --issue 1 --dry-run"
echo "  2. Run benchmarks: cargo bench"
echo "  3. Update CI/CD pipelines: Use Docker image or compiled binary"
echo "  4. Read docs: docs/RUST_MIGRATION_GUIDE.md"
echo ""
log_info "Backup files created:"
[ -f ".miyabi.yml.backup" ] && echo "  - .miyabi.yml.backup"
[ -f ".env.backup" ] && echo "  - .env.backup"
[ -f "package.json.backup" ] && echo "  - package.json.backup"
echo ""
log_success "🦀 Welcome to Rust Edition!"
