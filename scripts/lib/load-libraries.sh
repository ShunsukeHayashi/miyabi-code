#!/bin/bash
# Miyabi Orchestra - Library Loader
# Purpose: Load all Miyabi library functions in correct order
# Usage: source /path/to/load-libraries.sh

set -euo pipefail

# Get the directory where this script resides
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load libraries in dependency order
# 1. Basic utilities (no dependencies)
source "$LIB_DIR/agent-registry.sh"
source "$LIB_DIR/tmux-helpers.sh"
source "$LIB_DIR/voicevox.sh"
source "$LIB_DIR/task-queue.sh"

# Mark that libraries are loaded
export MIYABI_LIBRARIES_LOADED=1

# Optional: Print load confirmation (only if verbose mode)
if [ "${MIYABI_VERBOSE:-0}" = "1" ]; then
    echo "[Miyabi Libraries] ✅ All libraries loaded from: $LIB_DIR" >&2
fi
