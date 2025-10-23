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
COMMIT_MSG=$(git log -1 --format='%s' | awk -F: '{print $2}' | sed 's/^ //')
COMMIT_AUTHOR=$(git log -1 --format='%an')
COMMIT_TIME=$(git log -1 --format='%cr')

log_info "新しいコミットを検知: $COMMIT_HASH"

# 通知メッセージを生成（ゆっくり風）
case $COMMIT_TYPE in
    feat)
        SPEAKER="霊夢"
        MESSAGE="✨ 新機能を追加したわ！「$COMMIT_MSG」"
        ;;
    fix)
        SPEAKER="魔理沙"
        MESSAGE="🔧 バグを修正したぜ！「$COMMIT_MSG」"
        ;;
    docs)
        SPEAKER="霊夢"
        MESSAGE="📚 ドキュメントを更新したわ。「$COMMIT_MSG」"
        ;;
    refactor)
        SPEAKER="魔理沙"
        MESSAGE="♻️ コードをリファクタリングしたぜ！「$COMMIT_MSG」"
        ;;
    test)
        SPEAKER="霊夢"
        MESSAGE="🧪 テストを追加したわ。「$COMMIT_MSG」"
        ;;
    chore)
        SPEAKER="魔理沙"
        MESSAGE="🔨 雑務を片付けたぜ！「$COMMIT_MSG」"
        ;;
    perf)
        SPEAKER="霊夢"
        MESSAGE="⚡ パフォーマンスを改善したわ！「$COMMIT_MSG」"
        ;;
    style)
        SPEAKER="魔理沙"
        MESSAGE="💄 スタイルを調整したぜ！「$COMMIT_MSG」"
        ;;
    *)
        SPEAKER="霊夢"
        MESSAGE="📝 コミット: $COMMIT_TYPE - $COMMIT_MSG"
        ;;
esac

# OBSに表示
echo "🎤 $SPEAKER: $MESSAGE" > "$OBS_TEXT_FILE"
log_success "OBS表示を更新: $SPEAKER"

# 5秒後に統計情報を表示
(
    sleep 5

    # 今日のコミット数を取得
    TODAY_COMMITS=$(git log --oneline --since="today" 2>/dev/null | wc -l | xargs)
    TOTAL_COMMITS=$(git rev-list --count HEAD)

    echo "📊 リアルタイム統計: 今日${TODAY_COMMITS}件 / 合計${TOTAL_COMMITS}件のコミット（$COMMIT_TIME）" > "$OBS_TEXT_FILE"

    # 10秒後に待機状態に戻す
    sleep 10
    echo "⏸️ 待機中...（次のコミットを待っています）" > "$OBS_TEXT_FILE"
) &

exit 0
