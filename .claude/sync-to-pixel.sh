#!/bin/bash
# Miyabi Pixel Configuration Sync Script
# Syncs optimized settings from MacBook to Pixel/Termux

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
PIXEL_IP="${PIXEL_IP:-}"
PIXEL_SSH="${PIXEL_SSH:-pixel}"
PIXEL_USER="${PIXEL_USER:-u0_a189}" # Default Termux user
PIXEL_PROJECT_DIR="/data/data/com.termux/files/home/Dev/miyabi-private"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Miyabi Pixel Configuration Sync                 ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo ""

# Function: Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"

    # Check ADB
    if ! command -v adb &> /dev/null; then
        echo -e "${RED}✗ ADB not found. Please install Android SDK Platform Tools.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✓ ADB found${NC}"
}

# Function: Detect connection method
detect_connection() {
    echo -e "${YELLOW}[2/5] Detecting connection method...${NC}"

    # Try ADB first
    ADB_DEVICES=$(adb devices -l 2>/dev/null | grep -v "List of devices" | grep "device" || true)

    if [ -n "$ADB_DEVICES" ]; then
        CONNECTION_METHOD="adb"
        echo -e "${GREEN}✓ Connected via ADB${NC}"
        return
    fi

    # Try SSH if PIXEL_IP is set
    if [ -n "$PIXEL_IP" ]; then
        if ssh -o ConnectTimeout=3 "$PIXEL_SSH" "echo ok" &>/dev/null; then
            CONNECTION_METHOD="ssh"
            echo -e "${GREEN}✓ Connected via SSH (Tailscale)${NC}"
            return
        fi
    fi

    echo -e "${RED}✗ No connection to Pixel detected${NC}"
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  1. Connect Pixel via USB and enable USB debugging"
    echo -e "  2. Set PIXEL_IP and use SSH: export PIXEL_IP=<tailscale-ip>${NC}"
    exit 1
}

# Function: Backup existing configs
backup_existing() {
    echo -e "${YELLOW}[3/5] Backing up existing configs on Pixel...${NC}"

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    if [ "$CONNECTION_METHOD" = "adb" ]; then
        adb shell "cd $PIXEL_PROJECT_DIR/.claude && \
            [ -f settings.json ] && cp settings.json settings.json.backup.$TIMESTAMP || true; \
            [ -f mcp.json ] && cp mcp.json mcp.json.backup.$TIMESTAMP || true"
    else
        ssh "$PIXEL_SSH" "cd $PIXEL_PROJECT_DIR/.claude && \
            [ -f settings.json ] && cp settings.json settings.json.backup.$TIMESTAMP || true; \
            [ -f mcp.json ] && cp mcp.json mcp.json.backup.$TIMESTAMP || true"
    fi

    echo -e "${GREEN}✓ Backup created (timestamp: $TIMESTAMP)${NC}"
}

# Function: Push configs
push_configs() {
    echo -e "${YELLOW}[4/5] Pushing optimized configs to Pixel...${NC}"

    FILES_TO_SYNC=(
        "$SCRIPT_DIR/mcp-pixel.json:$PIXEL_PROJECT_DIR/.claude/mcp.json"
        "$SCRIPT_DIR/settings-pixel.json:$PIXEL_PROJECT_DIR/.claude/settings.json"
    )

    for file_pair in "${FILES_TO_SYNC[@]}"; do
        IFS=':' read -r src dst <<< "$file_pair"
        filename=$(basename "$src")

        if [ ! -f "$src" ]; then
            echo -e "${RED}✗ Source file not found: $src${NC}"
            continue
        fi

        if [ "$CONNECTION_METHOD" = "adb" ]; then
            adb push "$src" "$dst"
        else
            scp "$src" "$PIXEL_SSH:$dst"
        fi

        echo -e "${GREEN}  ✓ Synced: $filename${NC}"
    done
}

# Function: Verify sync
verify_sync() {
    echo -e "${YELLOW}[5/5] Verifying sync...${NC}"

    if [ "$CONNECTION_METHOD" = "adb" ]; then
        SETTINGS_EXISTS=$(adb shell "[ -f $PIXEL_PROJECT_DIR/.claude/settings.json ] && echo 1 || echo 0")
        MCP_EXISTS=$(adb shell "[ -f $PIXEL_PROJECT_DIR/.claude/mcp.json ] && echo 1 || echo 0")
    else
        SETTINGS_EXISTS=$(ssh "$PIXEL_SSH" "[ -f $PIXEL_PROJECT_DIR/.claude/settings.json ] && echo 1 || echo 0")
        MCP_EXISTS=$(ssh "$PIXEL_SSH" "[ -f $PIXEL_PROJECT_DIR/.claude/mcp.json ] && echo 1 || echo 0")
    fi

    if [ "$SETTINGS_EXISTS" = "1" ] && [ "$MCP_EXISTS" = "1" ]; then
        echo -e "${GREEN}✓ All configs verified on Pixel${NC}"
    else
        echo -e "${RED}✗ Verification failed${NC}"
        exit 1
    fi
}

# Function: Show next steps
show_next_steps() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Sync Complete! 🎉                                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps on Pixel:${NC}"
    echo -e "  1. Open Termux"
    echo -e "  2. Run: ${GREEN}cd ~/Dev/miyabi-private${NC}"
    echo -e "  3. Run: ${GREEN}claude${NC} (or restart Claude Code)"
    echo -e "  4. Verify MCP servers: ${GREEN}mcp-tools${NC}"
    echo ""
    echo -e "${YELLOW}Monitoring Dashboard:${NC}"
    echo -e "  Access from MacBook: ${GREEN}http://100.112.127.63:5174${NC}"
    echo ""
    echo -e "${YELLOW}Backed up configs:${NC}"
    echo -e "  Location: ${GREEN}$PIXEL_PROJECT_DIR/.claude/*.backup.*${NC}"
    echo ""
}

# Main execution
main() {
    check_prerequisites
    detect_connection
    backup_existing
    push_configs
    verify_sync
    show_next_steps
}

# Run if not sourced
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
