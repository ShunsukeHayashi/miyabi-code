#!/bin/bash
# AntiGravity Miyabi - MCP Server Launcher
# Starts all configured MCP servers

set -e

MIYABI_ROOT="${MIYABI_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
MCP_DIR="$MIYABI_ROOT/mcp-servers"
LOG_DIR="$MIYABI_ROOT/logs/mcp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create log directory
mkdir -p "$LOG_DIR"

echo -e "${BLUE}🔌 Starting MCP Servers...${NC}"
echo ""

# MCP Server definitions
declare -A SERVERS=(
    ["miyabi-mcp"]="3100"
    ["miyabi-github"]="3101"
    ["miyabi-tmux"]="3102"
    ["miyabi-git-inspector"]="3103"
    ["miyabi-file-watcher"]="3104"
    ["miyabi-log-aggregator"]="3105"
    ["miyabi-resource-monitor"]="3106"
)

start_server() {
    local name=$1
    local port=$2
    local server_dir="$MCP_DIR/$name"
    
    if [ ! -d "$server_dir" ]; then
        echo -e "${YELLOW}⚠️  $name: Directory not found, skipping${NC}"
        return 0
    fi
    
    # Check if already running
    if lsof -i ":$port" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  $name: Already running on port $port${NC}"
        return 0
    fi
    
    # Start server
    cd "$server_dir"
    
    if [ -f "package.json" ]; then
        # Node.js server
        nohup npm start > "$LOG_DIR/$name.log" 2>&1 &
    elif [ -f "Cargo.toml" ]; then
        # Rust server
        nohup cargo run --release > "$LOG_DIR/$name.log" 2>&1 &
    else
        echo -e "${RED}❌ $name: Unknown server type${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ $name: Started on port $port${NC}"
}

stop_server() {
    local name=$1
    local port=$2
    
    local pid=$(lsof -t -i ":$port" 2>/dev/null)
    if [ -n "$pid" ]; then
        kill "$pid" 2>/dev/null || true
        echo -e "${YELLOW}⏹️  $name: Stopped${NC}"
    fi
}

status() {
    echo -e "${BLUE}📊 MCP Server Status${NC}"
    echo "========================"
    
    for name in "${!SERVERS[@]}"; do
        port=${SERVERS[$name]}
        if lsof -i ":$port" >/dev/null 2>&1; then
            echo -e "${GREEN}● $name${NC} - Port $port (running)"
        else
            echo -e "${RED}○ $name${NC} - Port $port (stopped)"
        fi
    done
}

case "${1:-start}" in
    start)
        for name in "${!SERVERS[@]}"; do
            start_server "$name" "${SERVERS[$name]}"
        done
        echo ""
        echo -e "${GREEN}✅ MCP Servers started!${NC}"
        ;;
    stop)
        for name in "${!SERVERS[@]}"; do
            stop_server "$name" "${SERVERS[$name]}"
        done
        echo ""
        echo -e "${YELLOW}⏹️  MCP Servers stopped${NC}"
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
