#!/bin/bash
# Miyabi OpenAI App - Start Servers Script

set -e

echo "🌸 Starting Miyabi OpenAI App Servers"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Warning: server/.env not found${NC}"
    echo "Creating .env file..."
    cat > server/.env << EOF
GITHUB_TOKEN=${GITHUB_TOKEN:-}
MIYABI_REPO_OWNER=customer-cloud
MIYABI_REPO_NAME=miyabi-private
MIYABI_ROOT=${MIYABI_ROOT:-$HOME/miyabi-private}
BASE_URL=${BASE_URL:-http://localhost:4444}
EOF
    echo -e "${YELLOW}Please edit server/.env and add your GITHUB_TOKEN${NC}"
    exit 1
fi

# Check if uvicorn is in PATH
if ! command -v uvicorn &> /dev/null; then
    if [ -f "$HOME/.local/bin/uvicorn" ]; then
        export PATH="$HOME/.local/bin:$PATH"
        echo -e "${GREEN}✅ Added ~/.local/bin to PATH${NC}"
    else
        echo "❌ uvicorn not found. Run: pip3 install -r server/requirements.txt"
        exit 1
    fi
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use${NC}"
        echo "Kill existing process? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            lsof -ti:$1 | xargs kill -9 2>/dev/null || true
            sleep 2
            echo -e "${GREEN}✅ Killed process on port $1${NC}"
        else
            return 1
        fi
    fi
    return 0
}

# Check ports
echo "📡 Checking ports..."
check_port 4444 || exit 1
check_port 8000 || exit 1

# Start in tmux if available
if command -v tmux &> /dev/null; then
    echo ""
    echo -e "${GREEN}Starting servers in tmux session 'miyabi-openai'${NC}"
    echo "Use: tmux attach -t miyabi-openai to view"
    echo "Detach with: Ctrl+b, then d"
    echo ""

    # Kill existing session if exists
    tmux kill-session -t miyabi-openai 2>/dev/null || true

    # Create new session and split window
    tmux new-session -d -s miyabi-openai -n servers

    # Top pane: Asset server
    tmux send-keys -t miyabi-openai:0.0 "cd $(pwd) && npm run serve" C-m

    # Split and start MCP server
    tmux split-window -t miyabi-openai:0 -v
    tmux send-keys -t miyabi-openai:0.1 "cd $(pwd)/server && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" C-m

    echo -e "${GREEN}✅ Servers started in tmux!${NC}"
    echo ""
    echo "Asset Server: http://localhost:4444"
    echo "MCP Server:   http://localhost:8000"
    echo ""
    echo "Attach to session: tmux attach -t miyabi-openai"
    echo "View logs: tmux attach -t miyabi-openai"

else
    # Fallback to nohup
    echo -e "${YELLOW}tmux not available, starting with nohup${NC}"

    # Start asset server
    nohup npm run serve > asset-server.log 2>&1 &
    ASSET_PID=$!
    echo "Asset Server PID: $ASSET_PID"

    # Start MCP server
    cd server
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../mcp-server.log 2>&1 &
    MCP_PID=$!
    echo "MCP Server PID: $MCP_PID"
    cd ..

    echo ""
    echo -e "${GREEN}✅ Servers started in background!${NC}"
    echo ""
    echo "Asset Server: http://localhost:4444 (PID: $ASSET_PID)"
    echo "MCP Server:   http://localhost:8000 (PID: $MCP_PID)"
    echo ""
    echo "View logs:"
    echo "  tail -f asset-server.log"
    echo "  tail -f mcp-server.log"
    echo ""
    echo "Stop servers:"
    echo "  kill $ASSET_PID $MCP_PID"
fi

echo ""
echo "🚀 Next steps:"
echo "1. Test servers:"
echo "   curl http://localhost:4444/"
echo "   curl http://localhost:8000/"
echo ""
echo "2. Expose with ngrok:"
echo "   ngrok http 8000"
echo ""
echo "3. Add to ChatGPT:"
echo "   Settings > Connectors > Add endpoint: https://<your-id>.ngrok-free.app/mcp"
