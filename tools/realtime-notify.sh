#!/bin/bash
#
# リアルタイム開発進捗通知スクリプト
#
# Git post-commitフックから呼び出され、最新のコミット情報をOBSに表示します
#

set -e

# 色付きログ
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[REALTIME]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[REALTIME]${NC} $1"
}

# OBSテキストファイルのパス
OBS_TEXT_FILE="$HOME/Documents/MiyabiOBS/narration.txt"

# ディレクトリ作成（存在しない場合）
mkdir -p "$HOME/Documents/MiyabiOBS"

# 最新のコミット情報を取得
COMMIT_HASH=$(git log -1 --format='%h')
COMMIT_TYPE=$(git log -1 --format='%s' | awk -F: '{print $1}')
COMMIT_MSG=$(git log -1 --format='%s' | awk -F: '{print $2}' | sed 's/^ //' | cut -c1-30)
COMMIT_AUTHOR=$(git log -1 --format='%an')
COMMIT_TIME=$(git log -1 --format='%cr')

log_info "新しいコミットを検知: $COMMIT_HASH"

# 通知メッセージを生成（絵文字のみ）
case $COMMIT_TYPE in
    feat)
        MESSAGE="✨ FEAT: $COMMIT_HASH"
        ;;
    fix)
        MESSAGE="🔧 FIX: $COMMIT_HASH"
        ;;
    docs)
        MESSAGE="📚 DOCS: $COMMIT_HASH"
        ;;
    refactor)
        MESSAGE="♻️ REFACTOR: $COMMIT_HASH"
        ;;
    test)
        MESSAGE="🧪 TEST: $COMMIT_HASH"
        ;;
    chore)
        MESSAGE="🔨 CHORE: $COMMIT_HASH"
        ;;
    perf)
        MESSAGE="⚡ PERF: $COMMIT_HASH"
        ;;
    style)
        MESSAGE="💄 STYLE: $COMMIT_HASH"
        ;;
    *)
        MESSAGE="📝 COMMIT: $COMMIT_HASH"
        ;;
esac

# OBSに表示
echo "$MESSAGE" > "$OBS_TEXT_FILE"
log_success "OBS表示を更新: $SPEAKER"

# 5秒後に統計情報を表示
(
    sleep 5

    # 今日のコミット数を取得
    TODAY_COMMITS=$(git log --oneline --since="today" 2>/dev/null | wc -l | xargs)
    TOTAL_COMMITS=$(git rev-list --count HEAD)

    echo "📊 TODAY: $TODAY_COMMITS | TOTAL: $TOTAL_COMMITS" > "$OBS_TEXT_FILE"

    # 10秒後に待機状態に戻す
    sleep 10
    echo "⏸️ READY" > "$OBS_TEXT_FILE"
) &

exit 0
