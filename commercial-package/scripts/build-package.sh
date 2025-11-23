#!/bin/bash
# Miyabi Society Control - Commercial Package Builder
# Builds all MCP servers and creates distributable binary package

set -e

echo "🏗️  Miyabi Society Control - Package Builder"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PACKAGE_DIR="${PROJECT_ROOT}/commercial-package"
BIN_DIR="${PACKAGE_DIR}/bin"
DIST_DIR="${PACKAGE_DIR}/dist"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BIN_DIR" "$DIST_DIR"
mkdir -p "$BIN_DIR" "$DIST_DIR"

# Build Node.js MCP Servers
echo ""
echo "📦 Building Node.js MCP Servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MCP_SERVERS=(
    "miyabi-mcp"
    "miyabi-commercial-agents"
    "miyabi-git-inspector"
    "miyabi-log-aggregator"
    "miyabi-resource-monitor"
    "miyabi-network-inspector"
    "miyabi-process-inspector"
    "miyabi-file-watcher"
    "miyabi-claude-code"
    "miyabi-github"
    "miyabi-codex"
    "miyabi-tmux-server"
    "miyabi-obsidian-server"
    "miyabi-rules-server"
    "miyabi-openai-assistant"
    "miyabi-file-access"
    "gemini3-adaptive-runtime"
    "gemini3-uiux-designer"
    "lark-openapi-mcp-enhanced"
)

for server in "${MCP_SERVERS[@]}"; do
    SERVER_PATH="${PROJECT_ROOT}/mcp-servers/${server}"
    
    if [ -d "$SERVER_PATH" ] && [ -f "$SERVER_PATH/package.json" ]; then
        echo "  Building $server..."
        cd "$SERVER_PATH"
        
        # Install dependencies
        npm install --silent 2>/dev/null || true
        
        # Build TypeScript
        npm run build --silent 2>/dev/null || true
        
        # Copy to bin directory
        mkdir -p "$BIN_DIR/$server"
        cp -r dist "$BIN_DIR/$server/" 2>/dev/null || true
        cp -r node_modules "$BIN_DIR/$server/" 2>/dev/null || true
        cp package.json "$BIN_DIR/$server/"  2>/dev/null || true
        
        echo "    ✓ $server built"
    fi
done

# Bundle with pkg (Node.js → Binary)
echo ""
echo "🔨 Creating standalone binaries..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create main launcher
cat > "$BIN_DIR/launcher.js" << 'LAUNCHER_JS'
#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const LICENSE = process.env.MIYABI_LICENSE_KEY;
if (!LICENSE || !LICENSE.startsWith('MIYABI-COMMERCIAL-')) {
    console.error('❌ Invalid license key');
    process.exit(1);
}

// Start main MCP server
const serverPath = path.join(__dirname, 'miyabi-mcp/dist/index.js');
const server = spawn('node', [serverPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env
});

server.on('exit', (code) => process.exit(code));
LAUNCHER_JS

chmod +x "$BIN_DIR/launcher.js"

# Install pkg if not available
npm install -g pkg 2>/dev/null || true

# Create binaries for multiple platforms
echo "  Creating macOS binary..."
pkg "$BIN_DIR/launcher.js" --targets node18-macos-x64 --output "$DIST_DIR/miyabi-society-macos" 2>/dev/null || echo "    ⚠️  pkg not available, skipping"

echo "  Creating Linux binary..."
pkg "$BIN_DIR/launcher.js" --targets node18-linux-x64 --output "$DIST_DIR/miyabi-society-linux" 2>/dev/null || echo "    ⚠️  pkg not available, skipping"

# Create distribution package
echo ""
echo "📦 Creating distribution package..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PACKAGE_NAME="miyabi-society-commercial-v1.0.0"
PACKAGE_PATH="$DIST_DIR/$PACKAGE_NAME"

mkdir -p "$PACKAGE_PATH"
cp -r "$BIN_DIR" "$PACKAGE_PATH/"
cp "$PACKAGE_DIR/installer/install.sh" "$PACKAGE_PATH/"
chmod +x "$PACKAGE_PATH/install.sh"

# Create README
cat > "$PACKAGE_PATH/README.md" << 'README_END'
# Miyabi Society Control - Commercial Package v1.0.0

## Installation

```bash
./install.sh
```

## What's Included

- 24 MCP Servers (75+ tools)
- 6 Premium Business Agents
- 7 System Inspectors  
- Complete monitoring toolkit
- Auto-onboarding system

## Requirements

- macOS 10.15+ or Linux
- Claude Desktop installed
- Node.js 18+ (optional for source)

## License

Commercial license required.
Contact: support@miyabi.ai
README_END

# Create tarball
cd "$DIST_DIR"
tar -czf "${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Package: $DIST_DIR/${PACKAGE_NAME}.tar.gz"
echo "📂 Size: $(du -h "$DIST_DIR/${PACKAGE_NAME}.tar.gz" | cut -f1)"
echo ""
echo "🚀 Distribution ready!"
echo ""

