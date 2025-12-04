#!/bin/bash
#==============================================================================
# Miyabi Sandbox Environment Setup Script
# サンドボックス環境からMiyabiプラットフォームを制御するための完全セットアップ
#
# Usage: bash sandbox-setup.sh [options]
# Options:
#   --full        完全セットアップ（Rust, Node, Python含む）
#   --minimal     最小セットアップ（必須ツールのみ）
#   --check       環境チェックのみ
#   --help        ヘルプ表示
#==============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${CYAN}[→]${NC} $1"; }

#==============================================================================
# Configuration
#==============================================================================

MIYABI_VERSION="1.0.0"
SETUP_MODE="${1:-full}"

# Required tools
REQUIRED_TOOLS=(
    "curl"
    "git"
    "node"
    "npm"
    "jq"
)

# Optional but recommended
OPTIONAL_TOOLS=(
    "cargo"
    "rustc"
    "python3"
    "pip3"
    "gh"
    "tmux"
    "ssh"
)

# Environment variables template
ENV_TEMPLATE='
# Miyabi Environment Configuration
export MIYABI_ROOT="${MIYABI_ROOT:-/home/ubuntu/miyabi-private}"
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"

# API Keys
export GITHUB_TOKEN="${GITHUB_TOKEN:-}"
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"
export GEMINI_API_KEY="${GEMINI_API_KEY:-}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"

# MCP Server Configuration
export MCP_SERVER_PORT="${MCP_SERVER_PORT:-3030}"
export MCP_LOG_LEVEL="${MCP_LOG_LEVEL:-info}"

# Remote Server Configuration
export MUGEN_HOST="${MUGEN_HOST:-}"
export MAJIN_HOST="${MAJIN_HOST:-}"
export SSH_KEY_PATH="${SSH_KEY_PATH:-~/.ssh/miyabi-key.pem}"

# Feature Flags
export MIYABI_ENABLE_A2A="${MIYABI_ENABLE_A2A:-true}"
export MIYABI_ENABLE_GEMINI="${MIYABI_ENABLE_GEMINI:-true}"
'

#==============================================================================
# Functions
#==============================================================================

check_command() {
    command -v "$1" &> /dev/null
}

install_rust() {
    log_step "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    export PATH="$HOME/.cargo/bin:$PATH"
    log_success "Rust installed"
}

setup_environment() {
    log_step "Setting up environment variables..."
    echo "$ENV_TEMPLATE" > ~/.miyabi-env
    grep -q "source ~/.miyabi-env" ~/.bashrc 2>/dev/null || echo "[ -f ~/.miyabi-env ] && source ~/.miyabi-env" >> ~/.bashrc
    source ~/.miyabi-env 2>/dev/null || true
    log_success "Environment configured"
}

create_utility_scripts() {
    log_step "Creating utility scripts..."
    mkdir -p ~/bin
    
    # miyabi-status
    cat > ~/bin/miyabi-status << 'SCRIPT'
#!/bin/bash
echo "=== Miyabi System Status ==="
echo "Node: $(node --version 2>/dev/null || echo 'not installed')"
echo "Rust: $(rustc --version 2>/dev/null || echo 'not installed')"
[ -n "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN: ✓" || echo "GITHUB_TOKEN: ✗"
[ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY: ✓" || echo "ANTHROPIC_API_KEY: ✗"
SCRIPT
    chmod +x ~/bin/miyabi-status
    
    export PATH="$HOME/bin:$PATH"
    log_success "Utility scripts created"
}

check_environment() {
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           Miyabi Sandbox Environment Check                       ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    
    for tool in "${REQUIRED_TOOLS[@]}"; do
        check_command "$tool" && log_success "$tool" || log_error "$tool: NOT FOUND"
    done
    
    for tool in "${OPTIONAL_TOOLS[@]}"; do
        check_command "$tool" && log_success "$tool" || log_warn "$tool: not installed"
    done
}

run_full_setup() {
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           Miyabi Sandbox Full Setup v${MIYABI_VERSION}                       ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    
    check_command cargo || install_rust
    setup_environment
    create_utility_scripts
    
    echo ""
    log_success "Setup Complete! Run 'source ~/.bashrc' to load environment"
}

#==============================================================================
# Main
#==============================================================================

case "$SETUP_MODE" in
    --full|full)    run_full_setup ;;
    --minimal)      setup_environment; create_utility_scripts ;;
    --check|check)  check_environment ;;
    --help|-h)      echo "Usage: $0 [--full|--minimal|--check|--help]" ;;
    *)              run_full_setup ;;
esac
