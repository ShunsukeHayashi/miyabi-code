#!/bin/bash
#==============================================================================
# MIYABI ENVIRONMENT SETUP
# 環境変数の永続化設定
#==============================================================================

set -e

echo "🔧 Miyabi Environment Setup"
echo "============================"
echo ""

# デフォルト値
DEFAULT_OWNER="ShunsukeHayashi"
DEFAULT_REPO="miyabi-private"

# インタラクティブモードチェック
if [ -t 0 ]; then
    INTERACTIVE=true
else
    INTERACTIVE=false
fi

# 環境変数ファイルのパス
ENV_FILE="$HOME/.miyabi-env"
BASHRC="$HOME/.bashrc"
ZSHRC="$HOME/.zshrc"

echo "📋 Setting up environment variables..."
echo ""

# 既存の設定を読み込み
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    echo "✓ Found existing config: $ENV_FILE"
fi

# GitHub Token
if [ -z "$GITHUB_TOKEN" ]; then
    if [ "$INTERACTIVE" = true ]; then
        echo ""
        echo "🔐 GitHub Personal Access Token"
        echo "   Get one at: https://github.com/settings/tokens"
        echo "   Required scopes: repo, workflow, read:org"
        read -p "   Enter GITHUB_TOKEN: " GITHUB_TOKEN
    else
        echo "⚠️  GITHUB_TOKEN not set (required for GitHub operations)"
    fi
fi

# Repo Owner
if [ -z "$REPO_OWNER" ]; then
    if [ "$INTERACTIVE" = true ]; then
        read -p "   Enter REPO_OWNER [$DEFAULT_OWNER]: " REPO_OWNER
        REPO_OWNER=${REPO_OWNER:-$DEFAULT_OWNER}
    else
        REPO_OWNER=$DEFAULT_OWNER
    fi
fi

# Repo Name  
if [ -z "$REPO_NAME" ]; then
    if [ "$INTERACTIVE" = true ]; then
        read -p "   Enter REPO_NAME [$DEFAULT_REPO]: " REPO_NAME
        REPO_NAME=${REPO_NAME:-$DEFAULT_REPO}
    else
        REPO_NAME=$DEFAULT_REPO
    fi
fi

# Anthropic API Key
if [ -z "$ANTHROPIC_API_KEY" ] && [ "$INTERACTIVE" = true ]; then
    echo ""
    echo "🤖 Anthropic API Key (optional, for AI agents)"
    read -p "   Enter ANTHROPIC_API_KEY (or press Enter to skip): " ANTHROPIC_API_KEY
fi

# Gemini API Key
if [ -z "$GEMINI_API_KEY" ] && [ "$INTERACTIVE" = true ]; then
    echo ""
    echo "✨ Gemini API Key (optional, for Gemini-based tools)"
    read -p "   Enter GEMINI_API_KEY (or press Enter to skip): " GEMINI_API_KEY
fi

# 環境変数ファイルを作成
echo ""
echo "📝 Writing to $ENV_FILE..."

cat > "$ENV_FILE" << EOF
# Miyabi Environment Variables
# Generated: $(date)

# GitHub Configuration (Required)
export GITHUB_TOKEN="${GITHUB_TOKEN}"
export REPO_OWNER="${REPO_OWNER}"
export REPO_NAME="${REPO_NAME}"

# Miyabi Configuration
export MIYABI_ROOT="\$HOME/miyabi-private"
export MIYABI_ENV="development"

# API Keys (Optional)
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export GEMINI_API_KEY="${GEMINI_API_KEY}"

# Path
export PATH="\$HOME/.cargo/bin:\$PATH"
EOF

chmod 600 "$ENV_FILE"
echo "✓ Created $ENV_FILE (permissions: 600)"

# シェル設定に追加
add_to_shell_config() {
    local config_file=$1
    local source_line="[ -f \$HOME/.miyabi-env ] && source \$HOME/.miyabi-env"
    
    if [ -f "$config_file" ]; then
        if ! grep -q ".miyabi-env" "$config_file" 2>/dev/null; then
            echo "" >> "$config_file"
            echo "# Miyabi Environment" >> "$config_file"
            echo "$source_line" >> "$config_file"
            echo "✓ Added to $config_file"
        else
            echo "✓ Already configured in $config_file"
        fi
    fi
}

add_to_shell_config "$BASHRC"
add_to_shell_config "$ZSHRC"

# 現在のセッションに適用
source "$ENV_FILE"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Environment Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Configured Variables:"
echo "   GITHUB_TOKEN:      ${GITHUB_TOKEN:0:10}... (hidden)"
echo "   REPO_OWNER:        $REPO_OWNER"
echo "   REPO_NAME:         $REPO_NAME"
echo "   ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+set}${ANTHROPIC_API_KEY:-not set}"
echo "   GEMINI_API_KEY:    ${GEMINI_API_KEY:+set}${GEMINI_API_KEY:-not set}"
echo ""
echo "🔄 To apply in current shell:"
echo "   source ~/.miyabi-env"
echo ""
