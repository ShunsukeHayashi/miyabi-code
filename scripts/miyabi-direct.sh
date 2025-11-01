#!/bin/bash
# Miyabi CLI Direct Token Script
# Uses GITHUB_TOKEN directly from environment or prompts for it

set -e

# Check if GITHUB_TOKEN is already set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN is not set"
    echo ""
    echo "Please set it using one of these methods:"
    echo ""
    echo "Method 1: Environment variable (recommended)"
    echo "  export GITHUB_TOKEN=ghp_your_token_here"
    echo "  ./miyabi-direct.sh status"
    echo ""
    echo "Method 2: Use gh CLI"
    echo "  gh auth login"
    echo "  ./miyabi.sh status"
    echo ""
    echo "Method 3: Create .env.local file"
    echo "  echo 'GITHUB_TOKEN=ghp_your_token_here' > .env.local"
    echo "  source .env.local"
    echo "  ./miyabi-direct.sh status"
    echo ""
    exit 1
fi

# Verify token format
if [[ ! "$GITHUB_TOKEN" =~ ^(ghp_|gho_|ghu_|ghs_|ghr_) ]]; then
    echo "⚠️  Warning: GITHUB_TOKEN doesn't look like a valid GitHub token"
    echo "Expected format: ghp_*, gho_*, ghu_*, ghs_*, or ghr_*"
    echo "Current value: ${GITHUB_TOKEN:0:10}..."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Using GITHUB_TOKEN: ${GITHUB_TOKEN:0:10}...${GITHUB_TOKEN: -4}"

# Add cargo bin to PATH if needed
export PATH="$HOME/.cargo/bin:$PATH"

# Run miyabi with all arguments
exec ./target/release/miyabi "$@"
