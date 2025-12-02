#!/bin/bash
# GitHub Authentication Setup Script for Miyabi Orchestra
# Version: 1.0.0

set -e

echo "🔐 Miyabi GitHub Authentication Setup"
echo "======================================"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not found. Installing..."
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install gh
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt update && sudo apt install gh -y
    else
        echo "Please install gh manually: https://cli.github.com/"
        exit 1
    fi
fi

echo "✅ GitHub CLI installed: $(gh --version | head -1)"

# Check authentication status
if gh auth status &> /dev/null; then
    echo "✅ Already authenticated with GitHub"
    gh auth status
else
    echo "🔑 Starting GitHub authentication..."
    echo ""
    echo "Choose authentication method:"
    echo "  1. Login with browser (recommended)"
    echo "  2. Login with token"
    read -p "Enter choice [1/2]: " choice
    
    case $choice in
        1)
            gh auth login --web
            ;;
        2)
            echo "Enter your GitHub Personal Access Token:"
            echo "(Create at: https://github.com/settings/tokens)"
            read -s token
            echo $token | gh auth login --with-token
            ;;
        *)
            echo "Invalid choice. Using browser login..."
            gh auth login --web
            ;;
    esac
fi

# Verify authentication
echo ""
echo "📋 Verification:"
gh auth status

# Set GITHUB_TOKEN environment variable
GITHUB_TOKEN=$(gh auth token)
echo ""
echo "🔧 To use in current session, run:"
echo "   export GITHUB_TOKEN=$GITHUB_TOKEN"
echo ""
echo "🔧 To persist, add to your shell config:"
echo "   echo 'export GITHUB_TOKEN=\$(gh auth token)' >> ~/.bashrc"
echo "   # or"
echo "   echo 'export GITHUB_TOKEN=\$(gh auth token)' >> ~/.zshrc"

# Test API access
echo ""
echo "🧪 Testing GitHub API access..."
if gh api user &> /dev/null; then
    echo "✅ API access confirmed!"
    gh api user --jq '.login'
else
    echo "❌ API access failed. Please check your authentication."
    exit 1
fi

echo ""
echo "🎉 GitHub authentication setup complete!"
echo "   You can now use Miyabi GitHub tools."
