#!/bin/bash
# Stream Deck Shortcut: Git Push
# Usage: 現在のブランチをリモートにプッシュ

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "Gitプッシュを実行します"

# 現在のブランチを取得
BRANCH=$(git branch --show-current)

echo "🚀 Pushing to origin/$BRANCH..."

# プッシュ実行
git push origin "$BRANCH" 2>&1 | tee /tmp/miyabi-git-push.log

PUSH_STATUS=$?

if [ $PUSH_STATUS -eq 0 ]; then
    # 成功
    COMMIT_COUNT=$(git log origin/"$BRANCH"..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
    tools/voicevox_enqueue.sh "プッシュが成功しました。${COMMIT_COUNT}個のコミットをプッシュしました"
    osascript -e "display notification \"Pushed $COMMIT_COUNT commits to origin/$BRANCH\" with title \"Miyabi - Push Success\" sound name \"Glass\""
    echo "✅ Pushed $COMMIT_COUNT commits successfully!"
else
    # エラー
    tools/voicevox_enqueue.sh "プッシュに失敗しました。ログを確認してください"
    osascript -e 'display notification "Push failed! Check /tmp/miyabi-git-push.log" with title "Miyabi - Push Error" sound name "Basso"'
    echo "❌ Push failed! Check /tmp/miyabi-git-push.log"
fi

exit $PUSH_STATUS
