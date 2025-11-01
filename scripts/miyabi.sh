#!/bin/bash
# Miyabi CLI Helper Script
# - Loads GITHUB_TOKEN from .env if available
# - Falls back to gh CLI authentication

set -euo pipefail

# shellcheck source=/dev/null
if [[ -f .env ]]; then
    set -a
    . ./.env
    set +a
fi

# Ensure token available, otherwise try gh CLI
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    if ! command -v gh &> /dev/null; then
        echo "❌ Error: gh CLI is not installed"
        echo "Install: brew install gh"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        echo "❌ Error: GitHub authentication required"
        echo "Run: gh auth login"
        exit 1
    fi

    GITHUB_TOKEN="$(gh auth token)"
    export GITHUB_TOKEN
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
    echo "❌ Error: GITHUB_TOKEN not set"
    echo "Add it to .env or authenticate via gh CLI"
    exit 1
fi

# Add cargo bin to PATH if needed
export PATH="$HOME/.cargo/bin:$PATH"

# Run miyabi with all arguments
exec ./target/release/miyabi "$@"
