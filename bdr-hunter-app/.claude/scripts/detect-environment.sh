#!/bin/bash
# Miyabi Environment Detection Helper
# Version: 1.0.0

echo "🔍 Miyabi Environment Detection"
echo "================================"

# Detect environment type
detect_environment() {
    # Check if running in Claude.ai sandbox
    if [[ -d "/home/claude" ]] && [[ ! -d "/Users" ]]; then
        echo "claude-ai-sandbox"
        return
    fi
    
    # Check if running on macOS (MacBook)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
        return
    fi
    
    # Check if running on EC2 (MUGEN/MAJIN)
    if [[ -f "/etc/os-release" ]]; then
        if grep -q "Ubuntu" /etc/os-release; then
            # Check hostname or instance metadata
            if curl -s --connect-timeout 1 http://169.254.169.254/latest/meta-data/instance-id &> /dev/null; then
                echo "aws-ec2"
                return
            fi
        fi
    fi
    
    # Check if running in Termux (Android)
    if [[ -d "/data/data/com.termux" ]]; then
        echo "termux"
        return
    fi
    
    # Default to linux
    echo "linux"
}

# Get environment
ENV_TYPE=$(detect_environment)

echo "Environment: $ENV_TYPE"
echo ""

# Environment-specific recommendations
case $ENV_TYPE in
    "claude-ai-sandbox")
        echo "📋 Recommendations for Claude.ai Sandbox:"
        echo "  - Use MCP tools: Miyabi:read_file, Miyabi:write_file"
        echo "  - Build/Git: Delegate to Orchestra Agent"
        echo "  - Feedback: Use Miyabi:obsidian_create_note"
        echo ""
        echo "⚠️  Limitations:"
        echo "  - Cannot access /Users/... paths directly"
        echo "  - bash_tool runs in isolated container"
        ;;
    
    "macos")
        echo "📋 Recommendations for macOS:"
        echo "  - Full bash access available"
        echo "  - Direct file system access"
        echo "  - Can run npm/git commands directly"
        echo ""
        echo "🔧 Ensure these are configured:"
        echo "  - GITHUB_TOKEN environment variable"
        echo "  - tmux session 'miyabi-orchestra'"
        ;;
    
    "aws-ec2")
        echo "📋 Recommendations for AWS EC2:"
        echo "  - Full bash access available"
        echo "  - High performance builds"
        echo "  - Can run parallel agents"
        echo ""
        echo "🔧 Check tmux sessions:"
        echo "  tmux ls"
        ;;
    
    "termux")
        echo "📋 Recommendations for Termux:"
        echo "  - Use MCP aliases (mcp-github, mcp-lark, etc.)"
        echo "  - Delegate heavy tasks to MUGEN/MAJIN"
        echo "  - Use voice input for quick notes"
        ;;
    
    *)
        echo "📋 Generic Linux environment"
        echo "  - Check available tools with 'which'"
        ;;
esac

echo ""
echo "================================"

# Output environment variables for scripting
echo "# Export for use in scripts:"
echo "export MIYABI_ENV=$ENV_TYPE"

# Check for Orchestra connectivity
echo ""
echo "🔌 Orchestra Connectivity:"
if tmux has-session -t miyabi-orchestra 2>/dev/null; then
    echo "  ✅ miyabi-orchestra session found"
    tmux list-panes -t miyabi-orchestra -F "  - Pane #{pane_index}: #{pane_current_command}"
else
    echo "  ❌ miyabi-orchestra session not found"
    echo "  → Start with: ./scripts/orchestra-full-start.sh"
fi

# Check GitHub authentication
echo ""
echo "🔐 GitHub Authentication:"
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        echo "  ✅ GitHub CLI authenticated"
    else
        echo "  ❌ GitHub CLI not authenticated"
        echo "  → Run: ./scripts/setup-github-auth.sh"
    fi
else
    echo "  ❌ GitHub CLI not installed"
fi
