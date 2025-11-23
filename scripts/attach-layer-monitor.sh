#!/bin/bash
# ============================================
# Quick Layer Monitor Attach
# Attaches to the layer-monitor window
# ============================================

tmux attach -t miyabi-orchestrator:layer-monitor 2>/dev/null || {
    echo "Layer monitor not found. Creating..."
    ~/Dev/01-miyabi/_core/miyabi-private/scripts/setup-layer-monitoring.sh
    tmux attach -t miyabi-orchestrator:layer-monitor
}
