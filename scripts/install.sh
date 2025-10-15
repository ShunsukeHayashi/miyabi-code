#!/usr/bin/env bash
# ==============================================================================
# Miyabi Universal Installer
# ==============================================================================
#
# Purpose: One-command installation of Miyabi CLI
# Usage: curl -sSL https://raw.githubusercontent.com/.../install.sh | bash
# Supports: Linux (x86_64, aarch64), macOS (Intel, Apple Silicon), Termux
#
# ==============================================================================

set -euo pipefail

# Configuration
REPO="ShunsukeHayashi/miyabi-private"
BINARY_NAME="miyabi"
INSTALL_DIR="${HOME}/.local/bin"

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

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)
            if [ -n "${TERMUX_VERSION:-}" ] || [ -d "/data/data/com.termux" ]; then
                OS="termux"
            else
                OS="linux"
            fi
            ;;
        Darwin*)
            OS="darwin"
            ;;
        MINGW*|MSYS*|CYGWIN*)
            OS="windows"
            ;;
        *)
            log_error "Unsupported OS: $(uname -s)"
            exit 1
            ;;
    esac
    log_info "Detected OS: $OS"
}

# Detect Architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)
            ARCH="x86_64"
            ;;
        aarch64|arm64)
            ARCH="aarch64"
            ;;
        armv7l)
            ARCH="armv7"
            ;;
        *)
            log_error "Unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac
    log_info "Detected architecture: $ARCH"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    # Check for curl or wget
    if command -v curl &> /dev/null; then
        DOWNLOADER="curl"
        log_success "curl found"
    elif command -v wget &> /dev/null; then
        DOWNLOADER="wget"
        log_success "wget found"
    else
        log_error "Neither curl nor wget found. Please install one of them."
        exit 1
    fi
}

# Download binary
download_binary() {
    log_info "Downloading Miyabi binary..."

    # Construct release URL
    local RELEASE_URL="https://github.com/${REPO}/releases/latest/download"
    local BINARY_URL="${RELEASE_URL}/${BINARY_NAME}-${OS}-${ARCH}"

    # Create temp directory
    TMP_DIR=$(mktemp -d)
    TMP_FILE="${TMP_DIR}/${BINARY_NAME}"

    # Download
    if [ "$DOWNLOADER" = "curl" ]; then
        if ! curl -fsSL "$BINARY_URL" -o "$TMP_FILE"; then
            log_error "Download failed. Binary may not be available for ${OS}-${ARCH}"
            log_info "Falling back to cargo install..."
            install_via_cargo
            return
        fi
    else
        if ! wget -q "$BINARY_URL" -O "$TMP_FILE"; then
            log_error "Download failed. Binary may not be available for ${OS}-${ARCH}"
            log_info "Falling back to cargo install..."
            install_via_cargo
            return
        fi
    fi

    log_success "Binary downloaded to $TMP_FILE"

    # Make executable
    chmod +x "$TMP_FILE"

    # Move to install directory
    mkdir -p "$INSTALL_DIR"
    mv "$TMP_FILE" "${INSTALL_DIR}/${BINARY_NAME}"

    log_success "Installed to ${INSTALL_DIR}/${BINARY_NAME}"

    # Cleanup
    rm -rf "$TMP_DIR"
}

# Install via cargo (fallback)
install_via_cargo() {
    log_info "Installing via cargo..."

    if ! command -v cargo &> /dev/null; then
        log_error "cargo not found. Installing Rust toolchain..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    fi

    cargo install --git "https://github.com/${REPO}" miyabi-cli

    log_success "Installed via cargo to ~/.cargo/bin/${BINARY_NAME}"

    # Update INSTALL_DIR for PATH check
    INSTALL_DIR="$HOME/.cargo/bin"
}

# Add to PATH
add_to_path() {
    log_info "Checking PATH configuration..."

    # Check if already in PATH
    if echo "$PATH" | grep -q "$INSTALL_DIR"; then
        log_success "$INSTALL_DIR already in PATH"
        return
    fi

    log_warn "$INSTALL_DIR not in PATH. Adding..."

    # Detect shell
    SHELL_NAME=$(basename "$SHELL")
    case "$SHELL_NAME" in
        bash)
            SHELL_RC="$HOME/.bashrc"
            ;;
        zsh)
            SHELL_RC="$HOME/.zshrc"
            ;;
        fish)
            SHELL_RC="$HOME/.config/fish/config.fish"
            ;;
        *)
            SHELL_RC="$HOME/.profile"
            ;;
    esac

    # Add to shell RC
    if [ "$SHELL_NAME" = "fish" ]; then
        echo "set -gx PATH $INSTALL_DIR \$PATH" >> "$SHELL_RC"
    else
        echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$SHELL_RC"
    fi

    log_success "Added $INSTALL_DIR to $SHELL_RC"
    log_info "Run: source $SHELL_RC (or restart your shell)"
}

# Verify installation
verify_installation() {
    log_info "Verifying installation..."

    # Add to current PATH temporarily
    export PATH="$INSTALL_DIR:$PATH"

    # Check if binary exists
    if ! command -v "$BINARY_NAME" &> /dev/null; then
        log_error "Installation failed. Binary not found in PATH."
        exit 1
    fi

    # Check version
    VERSION=$("$BINARY_NAME" --version 2>&1 || echo "unknown")
    log_success "Installed version: $VERSION"

    # Test help command
    if "$BINARY_NAME" --help > /dev/null 2>&1; then
        log_success "Binary is functional"
    else
        log_warn "Binary may have issues. Try running: $BINARY_NAME --help"
    fi
}

# Main installation
main() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║   Miyabi Universal Installer v2.0     ║"
    echo "║   Rust Edition - One Command Setup    ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""

    detect_os
    detect_arch
    check_dependencies

    echo ""
    log_info "Installing Miyabi ${OS}-${ARCH}..."
    echo ""

    download_binary
    add_to_path
    verify_installation

    echo ""
    log_success "========================================="
    log_success "Installation Complete!"
    log_success "========================================="
    echo ""
    log_info "Quick Start:"
    echo "  1. Restart your shell or run: source ~/.bashrc"
    echo "  2. Verify: $BINARY_NAME --version"
    echo "  3. Initialize: $BINARY_NAME init my-project"
    echo "  4. Check status: $BINARY_NAME status"
    echo ""
    log_info "Documentation:"
    echo "  - Deployment Guide: docs/DEPLOYMENT_GUIDE.md"
    echo "  - User Guide: docs/USER_GUIDE.md"
    echo "  - Migration Guide: docs/RUST_MIGRATION_GUIDE.md"
    echo ""
    log_info "Support:"
    echo "  - Issues: https://github.com/${REPO}/issues"
    echo "  - Discussions: https://github.com/${REPO}/discussions"
    echo ""
    log_success "🦀 Welcome to Miyabi Rust Edition!"
    echo ""
}

# Run main
main
