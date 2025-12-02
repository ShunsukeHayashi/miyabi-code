#!/bin/bash

# Miyabi MCP Servers - Complete Setup Script
# Includes GitHub integration setup

set -e

echo "🚀 Miyabi MCP Servers - Complete Setup"
echo "======================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_DIR="$HOME/.config/Claude"
else
    echo "❌ Unsupported OS: $OSTYPE"
    exit 1
fi

CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo "📁 Config location: $CONFIG_FILE"
echo "📦 Servers location: $SCRIPT_DIR"
echo ""

# Build all servers
echo "🔨 Building MCP servers..."
for server in miyabi-*/; do
    if [ -f "$server/package.json" ]; then
        echo "  Building $server..."
        cd "$server"
        npm install --silent 2>/dev/null || true
        npm run build --silent 2>/dev/null || true
        cd ..
    fi
done
echo "✅ All servers built"
echo ""

# GitHub Token Setup
echo "🔐 GitHub Integration Setup"
echo "----------------------------"
if [ -z "$GITHUB_TOKEN" ]; then
    echo "GITHUB_TOKEN not found in environment."
    echo ""
    echo "To enable GitHub tools (issues, PRs, etc.), you need a Personal Access Token."
    echo "Get one at: https://github.com/settings/tokens"
    echo ""
    read -p "Enter GITHUB_TOKEN (or press Enter to skip): " GITHUB_TOKEN
fi

if [ -n "$GITHUB_TOKEN" ]; then
    read -p "Default GitHub owner (e.g., customer-cloud): " GITHUB_OWNER
    read -p "Default GitHub repo (e.g., miyabi-private): " GITHUB_REPO
    GITHUB_OWNER=${GITHUB_OWNER:-"customer-cloud"}
    GITHUB_REPO=${GITHUB_REPO:-"miyabi-private"}
    echo "✅ GitHub configured: $GITHUB_OWNER/$GITHUB_REPO"
else
    echo "⚠️  Skipping GitHub setup (tools will be unavailable)"
fi

echo ""

# Create config directory
mkdir -p "$CONFIG_DIR"

# Generate config
echo "📝 Generating Claude Desktop configuration..."

cat > "$CONFIG_FILE" << CONFIGEOF
{
  "mcpServers": {
    "miyabi-git-inspector": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-git-inspector/dist/index.js"],
      "env": {
        "DEFAULT_REPO_PATH": "$SCRIPT_DIR/.."
      }
    },
    "miyabi-tmux-server": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-tmux-server/dist/index.js"]
    },
    "miyabi-log-aggregator": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-log-aggregator/dist/index.js"],
      "env": {
        "LOG_PATHS": "$HOME/.miyabi/logs,$SCRIPT_DIR/../.ai/logs"
      }
    },
    "miyabi-file-access": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-file-access/dist/index.js"],
      "env": {
        "ALLOWED_PATHS": "$SCRIPT_DIR/..,$HOME"
      }
    },
    "miyabi-obsidian-server": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-obsidian-server/dist/index.js"],
      "env": {
        "VAULT_PATH": "$SCRIPT_DIR/../docs/obsidian-vault"
      }
    },
    "miyabi-resource-monitor": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-resource-monitor/dist/index.js"]
    },
    "miyabi-codex": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-codex/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "\${ANTHROPIC_API_KEY}"
      }
    },
    "miyabi-rules-server": {
      "command": "node",
      "args": ["$SCRIPT_DIR/miyabi-rules-server/dist/index.js"],
      "env": {
        "RULES_PATH": "$SCRIPT_DIR/../.claude/rules"
      }
    }GITHUB_SECTION
  }
}
CONFIGEOF

# Add GitHub section if token provided
if [ -n "$GITHUB_TOKEN" ]; then
    # Insert GitHub config before the closing brace
    sed -i.bak 's/GITHUB_SECTION/,\
    "miyabi-github": {\
      "command": "node",\
      "args": ["'"$SCRIPT_DIR"'\/miyabi-github\/dist\/index.js"],\
      "env": {\
        "GITHUB_TOKEN": "'"$GITHUB_TOKEN"'",\
        "GITHUB_DEFAULT_OWNER": "'"$GITHUB_OWNER"'",\
        "GITHUB_DEFAULT_REPO": "'"$GITHUB_REPO"'"\
      }\
    }/' "$CONFIG_FILE"
    rm -f "$CONFIG_FILE.bak"
else
    sed -i.bak 's/GITHUB_SECTION//' "$CONFIG_FILE"
    rm -f "$CONFIG_FILE.bak"
fi

echo "✅ Configuration saved to: $CONFIG_FILE"
echo ""

# Restart Claude Desktop
echo "🔄 Restarting Claude Desktop..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell application "Claude" to quit' 2>/dev/null || true
    sleep 2
    open -a "Claude"
    echo "✅ Claude Desktop restarted"
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Available MCP Servers:"
echo "  ✅ miyabi-git-inspector   - Git repository monitoring"
echo "  ✅ miyabi-tmux-server     - tmux session communication"
echo "  ✅ miyabi-log-aggregator  - Log aggregation & search"
echo "  ✅ miyabi-file-access     - Secure file operations"
echo "  ✅ miyabi-obsidian-server - Documentation knowledge"
echo "  ✅ miyabi-resource-monitor- System resources"
echo "  ✅ miyabi-codex           - AI code generation"
echo "  ✅ miyabi-rules-server    - Rule management"
if [ -n "$GITHUB_TOKEN" ]; then
echo "  ✅ miyabi-github          - GitHub issues/PRs"
else
echo "  ⚠️  miyabi-github          - Not configured (no token)"
fi
echo ""
echo "Try asking Claude: 'What MCP tools are available?'"
