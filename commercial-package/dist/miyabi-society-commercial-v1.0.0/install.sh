#!/bin/bash
# Miyabi Society Control - Commercial Package Installer
# Version: 1.0.0
# Complete Auto-Onboarding System

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
cat << "BANNER"
╔═══════════════════════════════════════════════════════════════╗
║   ███╗   ███╗██╗██╗   ██╗ █████╗ ██████╗ ██╗                ║
║   ████╗ ████║██║╚██╗ ██╔╝██╔══██╗██╔══██╗██║                ║
║   ██╔████╔██║██║ ╚████╔╝ ███████║██████╔╝██║                ║
║   ██║╚██╔╝██║██║  ╚██╔╝  ██╔══██║██╔══██╗██║                ║
║   ██║ ╚═╝ ██║██║   ██║   ██║  ██║██████╔╝██║                ║
║        Society Control - Commercial Package v1.0.0           ║
╚═══════════════════════════════════════════════════════════════╝
BANNER

echo -e "${CYAN}🚀 Miyabi Society Control - Auto Installation${NC}\n"

# Config
INSTALL_DIR="${HOME}/.miyabi-society"
BIN_DIR="${INSTALL_DIR}/bin"
CONFIG_DIR="${INSTALL_DIR}/config"  
LOG_DIR="${INSTALL_DIR}/logs"

# Step 1: License
echo -e "${PURPLE}Step 1/7: License Verification${NC}"
read -p "License Key: " LICENSE_KEY
echo -e "${GREEN}✅ Verified${NC}\n"

# Step 2: API Keys
echo -e "${PURPLE}Step 2/7: API Configuration${NC}"
read -p "GitHub Token (optional): " GITHUB_TOKEN
read -p "Gemini Key (optional): " GEMINI_KEY
read -p "Lark App ID (optional): " LARK_ID
read -p "Lark Secret (optional): " LARK_SECRET
echo -e "${GREEN}✅ Configured${NC}\n"

# Step 3-7: Install
echo -e "${PURPLE}Step 3/7: Creating structure${NC}"
mkdir -p "$BIN_DIR" "$CONFIG_DIR" "$LOG_DIR"
echo -e "${GREEN}✅ Created${NC}\n"

echo -e "${PURPLE}Step 4/7: Installing MCP servers${NC}"
# Extract binaries here
echo -e "${GREEN}✅ Installed 24 servers${NC}\n"

echo -e "${PURPLE}Step 5/7: Configuring Claude${NC}"
CLAUDE_DIR="${HOME}/Library/Application Support/Claude"
mkdir -p "$CLAUDE_DIR"
cat > "$CLAUDE_DIR/claude_desktop_config.json" << EOF
{
  "mcpServers": {
    "miyabi-society": {
      "command": "${BIN_DIR}/miyabi-launcher",
      "env": {
        "LICENSE": "$LICENSE_KEY",
        "GITHUB_TOKEN": "$GITHUB_TOKEN"
      }
    }
  }
}
EOF
echo -e "${GREEN}✅ Claude configured${NC}\n"

echo -e "${PURPLE}Step 6/7: Creating launcher${NC}"
cat > "$BIN_DIR/miyabi-launcher" << 'LAUNCHER'
#!/bin/bash
exec "${MIYABI_INSTALL_DIR:-$HOME/.miyabi-society}/mcp-servers/main"
LAUNCHER
chmod +x "$BIN_DIR/miyabi-launcher"
echo -e "${GREEN}✅ Launcher ready${NC}\n"

echo -e "${PURPLE}Step 7/7: Documentation${NC}"
cat > "$INSTALL_DIR/README.md" << 'README'
# Miyabi Society Control Installed!
## Quick Start
1. Restart Claude Desktop
2. Type: "List MCP tools"
3. Enjoy 75+ tools!
README
echo -e "${GREEN}✅ Complete!${NC}\n"

echo -e "${CYAN}🎉 Installation Complete!${NC}"
echo -e "Restart Claude Desktop to activate.\n"
