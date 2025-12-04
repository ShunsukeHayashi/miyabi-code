#!/bin/bash
# Miyabi MCP Server Build Script
# This script builds the miyabi-mcp-server binary in release mode

set -e

echo "🔨 Building Miyabi MCP Server..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Cargo not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Build the MCP server
echo "📦 Building miyabi-mcp-server (release mode)..."
cargo build --release -p miyabi-mcp-server

# Verify the binary exists
BINARY_PATH="target/release/miyabi-mcp-server"
if [ -f "$BINARY_PATH" ]; then
    echo "✅ Build successful!"
    echo "📍 Binary location: $(pwd)/$BINARY_PATH"
    echo ""
    echo "🚀 To start the server, run:"
    echo "   ./$BINARY_PATH"
    echo ""
    echo "   Or with options:"
    echo "   ./$BINARY_PATH --transport http --port 3030"
else
    echo "❌ Build failed - binary not found"
    exit 1
fi
