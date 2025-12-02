#!/bin/bash

# Miyabi GitHub MCP Server Setup Script
# This script helps configure GITHUB_TOKEN for Claude Desktop

set -e

echo "🔐 Miyabi GitHub MCP Server Setup"
echo "=================================="
echo ""

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Config location: $CONFIG_FILE"
echo "📦 Server location: $SCRIPT_DIR"
echo ""

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not found in environment"
    echo ""
    echo "Please enter your GitHub Personal Access Token:"
    echo "(Get one at: https://github.com/settings/tokens)"
    echo ""
    read -s -p "Token: " GITHUB_TOKEN
    echo ""
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Validate token format
if [[ ! "$GITHUB_TOKEN" =~ ^gh[ps]_ ]]; then
    echo "⚠️  Warning: Token doesn't match expected format (ghp_* or ghs_*)"
    read -p "Continue anyway? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

# Build the server
echo ""
echo "🔨 Building miyabi-github server..."
cd "$SCRIPT_DIR"
npm install --silent
npm run build --silent
echo "✅ Build complete"

# Create config directory if needed
mkdir -p "$CONFIG_DIR"

# Check if config file exists
if [ -f "$CONFIG_FILE" ]; then
    echo ""
    echo "📝 Existing config found. Backing up..."
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
    
    # Check if miyabi-github already exists
    if grep -q '"miyabi-github"' "$CONFIG_FILE" 2>/dev/null; then
        echo "⚠️  miyabi-github already in config."
        echo "   Please manually update GITHUB_TOKEN in:"
        echo "   $CONFIG_FILE"
        echo ""
        echo "   Or delete the existing entry and re-run this script."
        exit 0
    fi
fi

# Get default owner/repo
echo ""
read -p "Default GitHub owner (e.g., customer-cloud): " GITHUB_OWNER
read -p "Default GitHub repo (e.g., miyabi-private): " GITHUB_REPO

GITHUB_OWNER=${GITHUB_OWNER:-"customer-cloud"}
GITHUB_REPO=${GITHUB_REPO:-"miyabi-private"}

# Create or update config
if [ ! -f "$CONFIG_FILE" ] || [ ! -s "$CONFIG_FILE" ]; then
    # Create new config
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "miyabi-github": {
      "command": "node",
      "args": ["$SCRIPT_DIR/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "$GITHUB_TOKEN",
        "GITHUB_DEFAULT_OWNER": "$GITHUB_OWNER",
        "GITHUB_DEFAULT_REPO": "$GITHUB_REPO"
      }
    }
  }
}
EOF
    echo "✅ Created new config file"
else
    # Add to existing config using jq if available, otherwise manual
    if command -v jq &> /dev/null; then
        jq --arg token "$GITHUB_TOKEN" \
           --arg owner "$GITHUB_OWNER" \
           --arg repo "$GITHUB_REPO" \
           --arg path "$SCRIPT_DIR/dist/index.js" \
           '.mcpServers["miyabi-github"] = {
             "command": "node",
             "args": [$path],
             "env": {
               "GITHUB_TOKEN": $token,
               "GITHUB_DEFAULT_OWNER": $owner,
               "GITHUB_DEFAULT_REPO": $repo
             }
           }' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        echo "✅ Updated existing config file"
    else
        echo ""
        echo "⚠️  jq not installed. Please manually add to $CONFIG_FILE:"
        echo ""
        cat << EOF
"miyabi-github": {
  "command": "node",
  "args": ["$SCRIPT_DIR/dist/index.js"],
  "env": {
    "GITHUB_TOKEN": "$GITHUB_TOKEN",
    "GITHUB_DEFAULT_OWNER": "$GITHUB_OWNER",
    "GITHUB_DEFAULT_REPO": "$GITHUB_REPO"
  }
}
EOF
    fi
fi

echo ""
echo "🔄 Restarting Claude Desktop..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell application "Claude" to quit' 2>/dev/null || true
    sleep 2
    open -a "Claude"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Available tools:"
echo "  - github_list_issues"
echo "  - github_get_issue"
echo "  - github_create_issue"
echo "  - github_update_issue"
echo "  - github_list_prs"
echo "  - github_get_pr"
echo "  - github_create_pr"
echo "  - github_merge_pr"
echo ""
echo "Try: 'List open issues in $GITHUB_OWNER/$GITHUB_REPO'"
