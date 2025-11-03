#!/bin/bash
# Miyabi Orchestra - Hook Setup Script
# セッション終了フックを自動設定する

set -euo pipefail

echo "🎭 Miyabi Orchestra - Hook Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIYABI_ROOT="$(dirname "$HOOKS_DIR")"

echo "📂 Hooks directory: $HOOKS_DIR"
echo "📂 Miyabi root: $MIYABI_ROOT"
echo ""

# 実行権限の確認と付与
echo "🔐 Checking execute permissions..."
chmod +x "$HOOKS_DIR"/*.sh 2>/dev/null || true
echo "  ✓ Execute permissions granted"
echo ""

# ログディレクトリの作成
echo "📁 Creating log directories..."
mkdir -p "$MIYABI_ROOT/.ai/logs/hooks"
mkdir -p "$MIYABI_ROOT/.ai/logs/agent-reports"
mkdir -p "$MIYABI_ROOT/.ai/logs/work-sessions"
echo "  ✓ Log directories created"
echo ""

# Claude Code設定ファイルの確認
CLAUDE_CONFIG_DIR="$HOME/.config/claude"
CLAUDE_SETTINGS="$CLAUDE_CONFIG_DIR/settings.json"

echo "⚙️  Configuring Claude Code hooks..."

if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "  Creating Claude config directory..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# 既存の設定を読み込むか、新規作成
if [ -f "$CLAUDE_SETTINGS" ]; then
    echo "  ⚠️  Existing settings.json found"
    echo "  Backing up to settings.json.backup..."
    cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup"
else
    echo "  Creating new settings.json..."
    echo '{}' > "$CLAUDE_SETTINGS"
fi

# jqを使用してhooks設定を追加
if command -v jq &>/dev/null; then
    echo "  Adding sessionEnd hook with jq..."

    # まず、どのpaneで実行されているか判定
    # Pane index 1 = オーケストレーター、それ以外 = エージェント
    HOOK_SCRIPT="$HOOKS_DIR/agent-session-end.sh"

    # 設定を追加
    jq --arg hook "$HOOK_SCRIPT" '.hooks.sessionEnd = $hook' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp"
    mv "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"

    echo "  ✓ Hook configured: $HOOK_SCRIPT"
else
    echo "  ⚠️  jq not found, manual configuration required"
    echo ""
    echo "  Please add the following to $CLAUDE_SETTINGS:"
    echo '  {'
    echo '    "hooks": {'
    echo "      \"sessionEnd\": \"$HOOKS_DIR/agent-session-end.sh\""
    echo '    }'
    echo '  }'
fi

echo ""

# tmux統合設定（オプション）
echo "🔧 tmux Integration (Optional)"
echo ""
echo "To enable automatic hook execution on pane exit, add this to ~/.tmux.conf:"
echo ""
echo "  set-hook -g pane-exited 'run-shell \"$HOOKS_DIR/agent-session-end.sh\"'"
echo ""
read -p "Add to ~/.tmux.conf now? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    TMUX_CONF="$HOME/.tmux.conf"

    if ! grep -q "agent-session-end.sh" "$TMUX_CONF" 2>/dev/null; then
        echo "" >> "$TMUX_CONF"
        echo "# Miyabi Orchestra - Session End Hook" >> "$TMUX_CONF"
        echo "set-hook -g pane-exited 'run-shell \"$HOOKS_DIR/agent-session-end.sh\"'" >> "$TMUX_CONF"
        echo "  ✓ Added to ~/.tmux.conf"
        echo "  Run 'tmux source ~/.tmux.conf' to apply"
    else
        echo "  ⚠️  Hook already exists in ~/.tmux.conf"
    fi
else
    echo "  Skipped tmux integration"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Hook Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Test hooks: $HOOKS_DIR/orchestrator-session-end.sh"
echo "  2. Start Orchestra: ./scripts/miyabi-orchestra.sh coding-ensemble"
echo "  3. End session with /exit or Ctrl+D to trigger hooks"
echo ""
echo "📚 Documentation: $HOOKS_DIR/README.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
