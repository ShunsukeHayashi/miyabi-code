#!/bin/bash
# AntiGravity - Quick GitHub Setup (Pre-configured)
# Run on Mac: /Users/shunsuke/Dev/AntiGravity

set -e

ANTIGRAVITY_ROOT="/Users/shunsuke/Dev/AntiGravity"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
GITHUB_TOKEN="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"

echo "🔐 AntiGravity GitHub Setup"
echo "==========================="

# Create config directory
mkdir -p "$CONFIG_DIR"

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
    echo "📦 Existing config backed up"
fi

# Build miyabi-github if exists
if [ -d "$ANTIGRAVITY_ROOT/mcp-servers/miyabi-github" ]; then
    echo "🔨 Building miyabi-github..."
    cd "$ANTIGRAVITY_ROOT/mcp-servers/miyabi-github"
    npm install 2>/dev/null || true
    npm run build 2>/dev/null || true
    echo "✅ Build complete"
fi

# Write config
cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "miyabi-github": {
      "command": "node",
      "args": ["/Users/shunsuke/Dev/AntiGravity/mcp-servers/miyabi-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "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",
        "GITHUB_DEFAULT_OWNER": "ShunsukeHayashi",
        "GITHUB_DEFAULT_REPO": "AntiGravity_miyabi_edition"
      }
    }
  }
}
EOF

echo "✅ Config written: $CONFIG_FILE"

# Restart Claude
echo "🔄 Restarting Claude Desktop..."
osascript -e 'tell application "Claude" to quit' 2>/dev/null || true
sleep 2
open -a "Claude"

echo ""
echo "✅ Setup Complete!"
echo "Test with: 'Show my GitHub issues'"
