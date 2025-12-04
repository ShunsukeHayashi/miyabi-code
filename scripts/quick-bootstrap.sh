#!/bin/bash
#==============================================================================
# Miyabi Quick Bootstrap
# 最小限のコマンドで環境を整える
#==============================================================================

set -e

echo "🚀 Miyabi Quick Bootstrap"
echo ""

MIYABI_ROOT="${MIYABI_ROOT:-/home/ubuntu/miyabi-private}"

# 1. Check if on remote server
if [[ ! -d "$MIYABI_ROOT" ]]; then
    echo "⚠️  Not on MUGEN/MAJIN. This script should run on EC2."
    exit 1
fi

cd "$MIYABI_ROOT"

# 2. Ensure Rust
if ! command -v cargo &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# 3. Build MCP server
echo "🔨 Building miyabi-mcp-server..."
cargo build --release -p miyabi-mcp-server

# 4. Start tmux
echo "📺 Setting up tmux..."
tmux kill-session -t miyabi-hub 2>/dev/null || true
tmux new-session -d -s miyabi-hub -n main
tmux new-window -t miyabi-hub:1 -n agents

# 5. Summary
echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Binary: $MIYABI_ROOT/target/release/miyabi-mcp-server"
echo "tmux:   tmux attach -t miyabi-hub"
echo ""
echo "Next steps:"
echo "  1. Set GITHUB_TOKEN in ~/.bashrc"
echo "  2. Set GEMINI_API_KEY in ~/.bashrc"
echo "  3. source ~/.bashrc"
