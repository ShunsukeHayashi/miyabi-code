#!/bin/bash

# Miyabi Pixel MCP - Deployment Script
# Transfer MCP server to Google Pixel via adb

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVICE_ID="${1:-4C201FDAS001VX}"

echo "🚀 Miyabi Pixel MCP - Deployment to Device"
echo "=========================================="
echo ""

# 1. Check adb connection
echo "📱 Checking device connection..."
adb -s "$DEVICE_ID" get-state > /dev/null 2>&1 || {
    echo "❌ Device not found: $DEVICE_ID"
    echo "Available devices:"
    adb devices
    exit 1
}

MODEL=$(adb -s "$DEVICE_ID" shell getprop ro.product.model | tr -d '\r')
ANDROID=$(adb -s "$DEVICE_ID" shell getprop ro.build.version.release | tr -d '\r')
echo "✅ Connected: $MODEL (Android $ANDROID)"
echo ""

# 2. Create deployment package
echo "📦 Creating deployment package..."
cd "$SCRIPT_DIR"
tar -czf miyabi-pixel-mcp.tar.gz \
    package.json \
    index.js \
    README.md 2>/dev/null || true

echo "✅ Package created: miyabi-pixel-mcp.tar.gz"
echo ""

# 3. Push to device
echo "📤 Pushing to device..."
adb -s "$DEVICE_ID" push miyabi-pixel-mcp.tar.gz /sdcard/Download/
echo "✅ Pushed to /sdcard/Download/"
echo ""

# 4. Extract in Termux home directory
echo "📂 Extracting in Termux..."
adb -s "$DEVICE_ID" shell << 'EOF'
# Check if Termux is installed
if [ ! -d "/data/data/com.termux/files/home" ]; then
    echo "❌ Termux not installed!"
    echo "Install Termux from F-Droid: https://f-droid.org/en/packages/com.termux/"
    exit 1
fi

# Setup Termux storage access
termux-setup-storage 2>/dev/null || true

# Create MCP directory
mkdir -p /data/data/com.termux/files/home/miyabi-mcp

# Copy from Download to Termux home
cp /sdcard/Download/miyabi-pixel-mcp.tar.gz /data/data/com.termux/files/home/miyabi-mcp/

# Extract
cd /data/data/com.termux/files/home/miyabi-mcp
tar -xzf miyabi-pixel-mcp.tar.gz
rm miyabi-pixel-mcp.tar.gz

# Make executable
chmod +x index.js

echo "✅ Extracted to: ~/miyabi-mcp/"
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps on your Pixel device:"
echo "1. Open Termux app"
echo "2. Install Node.js:"
echo "   $ pkg install nodejs"
echo "3. Install Termux:API (from F-Droid)"
echo "   $ pkg install termux-api"
echo "4. Test MCP server:"
echo "   $ cd ~/miyabi-mcp"
echo "   $ node index.js --test"
echo ""
echo "🔗 Setup guide: README.md"

# Cleanup
rm -f miyabi-pixel-mcp.tar.gz
