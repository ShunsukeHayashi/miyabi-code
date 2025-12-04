#!/bin/bash
#==============================================================================
# MIYABI FIX ALL - Complete Environment Fix Script
# This script fixes all common issues and starts development servers
#==============================================================================

set -e

MIYABI_ROOT="${MIYABI_ROOT:-/home/ubuntu/miyabi-private}"
LOG_DIR="$MIYABI_ROOT/logs"
LOG_FILE="$LOG_DIR/fix-all.log"

mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "MIYABI FIX ALL - Starting"
log "=========================================="

cd "$MIYABI_ROOT"

# ==========================================
# FIX 1: Ensure Rust is installed
# ==========================================
log "[1/6] Checking Rust..."
if command -v cargo &> /dev/null; then
    log "  ✓ Cargo found: $(cargo --version)"
else
    log "  Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    log "  ✓ Rust installed"
fi
export PATH="$HOME/.cargo/bin:$PATH"

# ==========================================
# FIX 2: Build MCP Server Binary
# ==========================================
log "[2/6] Building miyabi-mcp-server..."
if [ -f "target/release/miyabi-mcp-server" ]; then
    log "  ✓ Binary already exists"
else
    log "  Building... (this may take 2-5 minutes)"
    cargo build --release -p miyabi-mcp-server >> "$LOG_FILE" 2>&1
    if [ -f "target/release/miyabi-mcp-server" ]; then
        log "  ✓ Build successful"
    else
        log "  ✗ Build failed! Check $LOG_FILE"
        exit 1
    fi
fi

# ==========================================
# FIX 3: Start tmux session
# ==========================================
log "[3/6] Setting up tmux..."
if command -v tmux &> /dev/null; then
    if tmux has-session -t miyabi-dev 2>/dev/null; then
        log "  ✓ tmux session 'miyabi-dev' already exists"
    else
        log "  Creating tmux session..."
        tmux new-session -d -s miyabi-dev -n main
        tmux new-window -t miyabi-dev:1 -n console
        tmux new-window -t miyabi-dev:2 -n logs
        log "  ✓ tmux session created"
    fi
else
    log "  ✗ tmux not installed"
fi

# ==========================================
# FIX 4: Install miyabi-console dependencies
# ==========================================
log "[4/6] Setting up miyabi-console..."
cd "$MIYABI_ROOT/crates/miyabi-console"
if [ -d "node_modules" ]; then
    log "  ✓ Dependencies already installed"
else
    log "  Installing npm dependencies..."
    npm install >> "$LOG_FILE" 2>&1
    log "  ✓ Dependencies installed"
fi
cd "$MIYABI_ROOT"

# ==========================================
# FIX 5: Start Dev Server
# ==========================================
log "[5/6] Starting miyabi-console dev server..."

# Kill any existing vite process on port 5173
if lsof -i :5173 > /dev/null 2>&1; then
    log "  Stopping existing server on port 5173..."
    kill $(lsof -t -i :5173) 2>/dev/null || true
    sleep 1
fi

# Start via tmux
if tmux has-session -t miyabi-dev 2>/dev/null; then
    tmux send-keys -t miyabi-dev:console "cd $MIYABI_ROOT/crates/miyabi-console && npm run dev" Enter
    log "  ✓ Dev server starting in tmux (miyabi-dev:console)"
else
    # Fallback: start in background
    cd "$MIYABI_ROOT/crates/miyabi-console"
    nohup npm run dev >> "$LOG_DIR/console-dev.log" 2>&1 &
    log "  ✓ Dev server started in background (PID: $!)"
fi

# ==========================================
# FIX 6: Verify
# ==========================================
log "[6/6] Verification..."
sleep 3

# Check if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|304"; then
    log "  ✓ Dev server is responding on http://localhost:5173"
else
    log "  ! Dev server may still be starting..."
fi

log ""
log "=========================================="
log "MIYABI FIX ALL - Complete!"
log "=========================================="
log ""
log "📍 Access Points:"
log "   • miyabi-console: http://localhost:5173"
log "   • tmux session:   tmux attach -t miyabi-dev"
log ""
log "📋 Log file: $LOG_FILE"
