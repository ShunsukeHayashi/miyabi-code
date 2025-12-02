#!/bin/bash
# AntiGravity - GitHub Authentication Setup Script
# Run this on your local Mac: /Users/shunsuke/Dev/AntiGravity

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 AntiGravity GitHub Authentication Setup${NC}"
echo "============================================"
echo ""

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_DIR="$HOME/.config/Claude"
else
    echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
ANTIGRAVITY_ROOT="/Users/shunsuke/Dev/AntiGravity"

echo -e "📁 Claude Config: ${YELLOW}$CONFIG_FILE${NC}"
echo -e "📦 AntiGravity Root: ${YELLOW}$ANTIGRAVITY_ROOT${NC}"
echo ""

# Check for existing token in environment
if [ -n "$GITHUB_TOKEN" ]; then
    echo -e "${GREEN}✅ GITHUB_TOKEN found in environment${NC}"
    TOKEN="$GITHUB_TOKEN"
else
    echo -e "${YELLOW}⚠️  GITHUB_TOKEN not found in environment${NC}"
    echo ""
    echo "Please enter your GitHub Personal Access Token:"
    echo -e "(Get one at: ${BLUE}https://github.com/settings/tokens/new${NC})"
    echo ""
    echo "Required scopes:"
    echo "  - repo (Full control of private repositories)"
    echo "  - read:user (Read user profile data)"
    echo "  - user:email (Access user email addresses)"
    echo ""
    read -s -p "Token (ghp_...): " TOKEN
    echo ""
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ No token provided. Exiting.${NC}"
    exit 1
fi

# Validate token format
if [[ ! "$TOKEN" =~ ^ghp_ ]] && [[ ! "$TOKEN" =~ ^ghs_ ]] && [[ ! "$TOKEN" =~ ^github_pat_ ]]; then
    echo -e "${YELLOW}⚠️  Warning: Token doesn't match expected format${NC}"
    read -p "Continue anyway? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

# Build MCP servers
echo ""
echo -e "${BLUE}🔨 Building MCP servers...${NC}"

MCP_SERVERS=(
    "miyabi-github"
    "miyabi-tmux"
    "miyabi-git-inspector"
    "miyabi-file-watcher"
    "miyabi-log-aggregator"
    "miyabi-resource-monitor"
)

for server in "${MCP_SERVERS[@]}"; do
    server_dir="$ANTIGRAVITY_ROOT/mcp-servers/$server"
    if [ -d "$server_dir" ] && [ -f "$server_dir/package.json" ]; then
        echo -e "  Building ${YELLOW}$server${NC}..."
        cd "$server_dir"
        npm install --silent 2>/dev/null || npm install
        npm run build --silent 2>/dev/null || npm run build
        echo -e "  ${GREEN}✅ $server${NC}"
    else
        echo -e "  ${YELLOW}⚠️  $server: Not found, skipping${NC}"
    fi
done

# Backup existing config
echo ""
mkdir -p "$CONFIG_DIR"
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo -e "${YELLOW}📦 Existing config backed up to: $BACKUP_FILE${NC}"
fi

# Generate new config
echo ""
echo -e "${BLUE}📝 Generating Claude Desktop config...${NC}"

cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "miyabi-github": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "$TOKEN",
        "GITHUB_DEFAULT_OWNER": "ShunsukeHayashi",
        "GITHUB_DEFAULT_REPO": "AntiGravity_miyabi_edition"
      }
    },
    "miyabi-tmux": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-tmux/dist/index.js"],
      "env": {
        "MIYABI_ROOT": "$ANTIGRAVITY_ROOT"
      }
    },
    "miyabi-git-inspector": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-git-inspector/dist/index.js"],
      "env": {
        "MIYABI_ROOT": "$ANTIGRAVITY_ROOT"
      }
    },
    "miyabi-file-watcher": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-file-watcher/dist/index.js"],
      "env": {
        "MIYABI_ROOT": "$ANTIGRAVITY_ROOT"
      }
    },
    "miyabi-log-aggregator": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-log-aggregator/dist/index.js"],
      "env": {
        "MIYABI_ROOT": "$ANTIGRAVITY_ROOT"
      }
    },
    "miyabi-resource-monitor": {
      "command": "node",
      "args": ["$ANTIGRAVITY_ROOT/mcp-servers/miyabi-resource-monitor/dist/index.js"]
    }
  }
}
EOF

echo -e "${GREEN}✅ Config written to: $CONFIG_FILE${NC}"

# Restart Claude Desktop
echo ""
echo -e "${BLUE}🔄 Restarting Claude Desktop...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell application "Claude" to quit' 2>/dev/null || true
    sleep 2
    open -a "Claude" 2>/dev/null || echo -e "${YELLOW}Please manually restart Claude Desktop${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ GitHub Authentication Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Open Claude Desktop"
echo -e "  2. Test with: ${YELLOW}Show my GitHub issues${NC}"
echo ""
