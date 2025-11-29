#!/bin/bash
# =====================================================
# Miyabi OpenAI App - Deploy to MUGEN (v2.0)
# =====================================================

set -e

echo "🚀 Miyabi OpenAI App v2.0 - Deployment Starting..."

# Configuration
MUGEN_HOST="mugen"
REMOTE_PATH="~/miyabi-private/openai-apps/miyabi-app"
LOCAL_PATH="$(dirname "$0")"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Step 1: Sync files to MUGEN
log_info "Step 1: Syncing files to MUGEN..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '.env' \
    --exclude '*.pyc' \
    --exclude 'dist' \
    --exclude '.git' \
    "$LOCAL_PATH/" "$MUGEN_HOST:$REMOTE_PATH/"

# Step 2: Install dependencies
log_info "Step 2: Installing Python dependencies..."
ssh "$MUGEN_HOST" "cd $REMOTE_PATH/server && pip3 install -r requirements.txt --user -q"

# Step 3: Stop existing services
log_info "Step 3: Stopping existing MCP server..."
ssh "$MUGEN_HOST" "pkill -f 'uvicorn.*main' || true"
sleep 2

# Step 4: Start new v2 server
log_info "Step 4: Starting v2 MCP server..."
ssh "$MUGEN_HOST" "cd $REMOTE_PATH/server && \
    nohup python3 -m uvicorn main_v2:app --host 0.0.0.0 --port 8000 \
    > /tmp/miyabi-mcp-v2.log 2>&1 &"

# Step 5: Wait and verify
log_info "Step 5: Waiting for server to start..."
sleep 5

# Step 6: Health check
log_info "Step 6: Running health check..."
HEALTH_RESPONSE=$(ssh "$MUGEN_HOST" "curl -s http://localhost:8000/health" || echo "FAILED")

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    log_info "✅ Health check passed!"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    log_error "❌ Health check failed!"
    log_warn "Checking logs..."
    ssh "$MUGEN_HOST" "tail -50 /tmp/miyabi-mcp-v2.log"
    exit 1
fi

# Step 7: Test MCP endpoint
log_info "Step 7: Testing MCP endpoint..."
MCP_RESPONSE=$(ssh "$MUGEN_HOST" "curl -s -X POST http://localhost:8000/mcp \
    -H 'Content-Type: application/json' \
    -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'" || echo "FAILED")

if echo "$MCP_RESPONSE" | grep -q "tools"; then
    log_info "✅ MCP endpoint working!"
    TOOL_COUNT=$(echo "$MCP_RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['result']['tools']))" 2>/dev/null || echo "?")
    log_info "Available tools: $TOOL_COUNT"
else
    log_warn "⚠️ MCP endpoint test inconclusive"
fi

# Summary
echo ""
echo "========================================"
echo "🎉 Deployment Complete!"
echo "========================================"
echo ""
echo "Server: http://44.250.27.197:8000"
echo "Health: http://44.250.27.197:8000/health"
echo "MCP:    http://44.250.27.197:8000/mcp"
echo ""
echo "Logs: ssh mugen 'tail -f /tmp/miyabi-mcp-v2.log'"
echo ""
