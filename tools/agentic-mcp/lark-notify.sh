#!/data/data/com.termux/files/usr/bin/bash
#
# Claude Code → Lark Webhook 通知 Hook
#
# 全てのClaude Code実行完了時にLarkグループチャットに通知
# キーワード: "shunsuke" 必須（Larkボット設定）
#
# Environment: Pixel 9 Pro XL (pixel-9-pro-xl-termux)

WEBHOOK_URL="https://open.larksuite.com/open-apis/bot/v2/hook/558fe6b3-5e3e-4aa2-9d00-0225d8d8d116"

# 環境変数から情報取得
HOOK_TYPE="${HOOK_TYPE:-Stop}"
TOOL_NAME="${TOOL_NAME:-unknown}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
CURRENT_DIR=$(pwd)
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")
PROJECT_NAME=$(basename "$CURRENT_DIR")

# Hook種類に応じたメッセージ
case "$HOOK_TYPE" in
  "PreToolUse")
    ICON="🔧"
    ACTION="ツール実行開始"
    ;;
  "PostToolUse")
    ICON="✅"
    ACTION="ツール実行完了"
    ;;
  "UserPromptSubmit")
    ICON="💬"
    ACTION="プロンプト受信"
    ;;
  "Stop")
    ICON="🏁"
    ACTION="応答完了"
    ;;
  *)
    ICON="ℹ️"
    ACTION="イベント"
    ;;
esac

# メッセージ作成（必ずキーワード "shunsuke" を含める）
MESSAGE="${ICON} Claude Code ${ACTION} - shunsuke

📁 プロジェクト: ${PROJECT_NAME}
🌿 ブランチ: ${GIT_BRANCH}
🔧 ツール: ${TOOL_NAME}
⏰ 時刻: ${TIMESTAMP}"

# Lark通知送信（エラーは無視）
curl -s -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"${MESSAGE}\"}}" \
  > /dev/null 2>&1

exit 0
