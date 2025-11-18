#!/bin/bash
# Pixel Maestro Control via ADB
# Usage: ./scripts/pixel-maestro-control.sh [command] [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if device is connected
check_connection() {
    if ! adb devices | grep -q "device$"; then
        echo -e "${RED}❌ No device connected${NC}"
        echo "Run: ./scripts/connect-pixel-adb.sh"
        exit 1
    fi
}

# Commands
cmd_status() {
    echo -e "${BLUE}📊 Pixel Maestro Status${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Device info
    MODEL=$(adb shell getprop ro.product.model)
    ANDROID=$(adb shell getprop ro.build.version.release)
    BATTERY=$(adb shell dumpsys battery | grep level | awk '{print $2}')
    CHARGING=$(adb shell dumpsys battery | grep "AC powered" | awk '{print $3}')

    echo "Device: $MODEL"
    echo "Android: $ANDROID"
    echo "Battery: $BATTERY%"
    [ "$CHARGING" = "true" ] && echo "Status: 🔌 Charging" || echo "Status: 🔋 On Battery"

    # Network
    IP=$(adb shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    echo "IP: $IP"

    # Termux status
    if adb shell pgrep -f com.termux > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Termux: Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Termux: Not running${NC}"
    fi

    # Lark status
    if adb shell pgrep -f com.ss.android.lark > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Lark: Running${NC}"
    else
        echo -e "${YELLOW}⚠️  Lark: Not running${NC}"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

cmd_termux() {
    local command="${@:2}"
    echo -e "${BLUE}🔧 Executing in Termux: $command${NC}"

    # Execute command in Termux
    adb shell "am broadcast \
        --user 0 \
        -a com.termux.RUN_COMMAND \
        --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
        --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,$command' \
        --ez com.termux.RUN_COMMAND_BACKGROUND false"

    echo -e "${GREEN}✅ Command sent${NC}"
}

cmd_screenshot() {
    local filename="${2:-pixel-screenshot-$(date +%Y%m%d-%H%M%S).png}"
    echo -e "${BLUE}📸 Taking screenshot...${NC}"

    # Take screenshot
    adb shell screencap -p /sdcard/screenshot.png

    # Pull to Mac
    adb pull /sdcard/screenshot.png "$filename"

    # Clean up
    adb shell rm /sdcard/screenshot.png

    echo -e "${GREEN}✅ Screenshot saved: $filename${NC}"
}

cmd_logs() {
    echo -e "${BLUE}📜 Fetching Pixel logs...${NC}"

    # Create logs directory
    mkdir -p logs/pixel

    # Get logcat
    adb logcat -d > "logs/pixel/logcat-$(date +%Y%m%d-%H%M%S).log"

    # Get Termux logs if available
    if adb shell '[ -f /data/data/com.termux/files/home/.termux/shell-startup.log ]'; then
        adb pull /data/data/com.termux/files/home/.termux/shell-startup.log \
            "logs/pixel/termux-$(date +%Y%m%d-%H%M%S).log" 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Logs saved to logs/pixel/${NC}"
}

cmd_open_lark() {
    echo -e "${BLUE}📱 Opening Lark...${NC}"
    adb shell am start -n com.ss.android.lark/.main.app.MainActivity
    echo -e "${GREEN}✅ Lark opened${NC}"
}

cmd_open_termux() {
    echo -e "${BLUE}💻 Opening Termux...${NC}"
    adb shell am start -n com.termux/.HomeActivity
    echo -e "${GREEN}✅ Termux opened${NC}"
}

cmd_notify() {
    local title="${2:-Miyabi Society}"
    local message="${3:-Notification from Mac Orchestrator}"

    echo -e "${BLUE}🔔 Sending notification...${NC}"

    # Use Termux API if available
    adb shell "am broadcast \
        --user 0 \
        -a com.termux.RUN_COMMAND \
        --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/termux-notification' \
        --esa com.termux.RUN_COMMAND_ARGUMENTS '--title,$title,--content,$message' \
        --ez com.termux.RUN_COMMAND_BACKGROUND false" 2>/dev/null || \
    echo -e "${YELLOW}⚠️  termux-api not installed${NC}"
}

cmd_miyabi() {
    local subcmd="${2:-status}"
    echo -e "${BLUE}🌸 Running Miyabi CLI on Pixel: $subcmd${NC}"

    adb shell "am broadcast \
        --user 0 \
        -a com.termux.RUN_COMMAND \
        --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/bash' \
        --esa com.termux.RUN_COMMAND_ARGUMENTS '-c,cd ~/miyabi-private && miyabi $subcmd' \
        --ez com.termux.RUN_COMMAND_BACKGROUND false"
}

cmd_monitor() {
    echo -e "${BLUE}👁️  Monitoring Pixel (Ctrl-C to stop)...${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    while true; do
        clear
        cmd_status
        sleep 5
    done
}

cmd_help() {
    cat << EOF
${BLUE}Pixel Maestro Control via ADB${NC}

Usage: $0 [command] [args...]

Commands:
  status              Show Pixel status
  termux <command>    Execute command in Termux
  screenshot [file]   Take screenshot
  logs                Fetch device logs
  open-lark           Open Lark app
  open-termux         Open Termux app
  notify <title> <msg> Send notification
  miyabi <command>    Run miyabi CLI on Pixel
  monitor             Monitor Pixel in real-time
  help                Show this help

Examples:
  $0 status
  $0 termux "ls -la"
  $0 screenshot my-screen.png
  $0 notify "Alert" "Task completed"
  $0 miyabi "status"
  $0 monitor

EOF
}

# Main
check_connection

case "${1:-help}" in
    status)      cmd_status ;;
    termux)      cmd_termux "$@" ;;
    screenshot)  cmd_screenshot "$@" ;;
    logs)        cmd_logs ;;
    open-lark)   cmd_open_lark ;;
    open-termux) cmd_open_termux ;;
    notify)      cmd_notify "$@" ;;
    miyabi)      cmd_miyabi "$@" ;;
    monitor)     cmd_monitor ;;
    help|*)      cmd_help ;;
esac
