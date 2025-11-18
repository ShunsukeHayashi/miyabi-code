#!/data/data/com.termux/files/usr/bin/bash

# Miyabi Pixel MCP - Termux Setup Script
# Run this script INSIDE Termux on your Pixel device

set -e

echo "🚀 Miyabi Pixel MCP - Termux Setup"
echo "===================================="
echo ""

# 1. Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script must be run inside Termux!"
    exit 1
fi

echo "✅ Running in Termux"
echo ""

# 2. Check Node.js installation
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    pkg install nodejs -y
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js already installed: $NODE_VERSION"
fi
echo ""

# 3. Install Termux:API (optional but recommended)
echo "🔧 Checking Termux:API..."
if ! command -v termux-battery-status &> /dev/null; then
    echo "📥 Installing Termux:API..."
    pkg install termux-api -y
    echo "⚠️  Don't forget to install Termux:API app from F-Droid!"
    echo "   https://f-droid.org/en/packages/com.termux.api/"
else
    echo "✅ Termux:API already installed"
fi
echo ""

# 4. Setup storage access
echo "📂 Setting up storage access..."
if [ ! -d "$HOME/storage" ]; then
    echo "⚠️  Please grant storage permission when prompted..."
    termux-setup-storage
    sleep 2
else
    echo "✅ Storage access already configured"
fi
echo ""

# 5. Create MCP directory
echo "📁 Creating MCP directory..."
mkdir -p "$HOME/miyabi-mcp"
echo "✅ Created: $HOME/miyabi-mcp"
echo ""

# 6. Check if package exists in Download folder
PACKAGE_PATH="/sdcard/Download/miyabi-pixel-mcp.tar.gz"
if [ -f "$PACKAGE_PATH" ]; then
    echo "📦 Found package: $PACKAGE_PATH"

    # Copy to Termux home
    echo "📋 Copying to Termux home..."
    cp "$PACKAGE_PATH" "$HOME/miyabi-mcp/"

    # Extract
    echo "📂 Extracting..."
    cd "$HOME/miyabi-mcp"
    tar -xzf miyabi-pixel-mcp.tar.gz
    rm miyabi-pixel-mcp.tar.gz

    # Make executable
    chmod +x index.js

    echo "✅ Extraction complete!"
else
    echo "❌ Package not found: $PACKAGE_PATH"
    echo "   Please transfer the package using:"
    echo "   adb push miyabi-pixel-mcp.tar.gz /sdcard/Download/"
    exit 1
fi
echo ""

# 7. Test MCP server
echo "🧪 Testing MCP server..."
cd "$HOME/miyabi-mcp"
node index.js --test

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Quick Start:"
echo "   cd ~/miyabi-mcp"
echo "   node index.js --test"
echo ""
echo "🔗 Full documentation: cat ~/miyabi-mcp/README.md"
