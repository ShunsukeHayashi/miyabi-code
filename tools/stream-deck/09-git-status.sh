#!/bin/bash
# Stream Deck Shortcut: Git Status
# Usage: Git状態を確認して通知

cd "$(dirname "$0")/../.." || exit 1

# Git status取得
STATUS=$(git status --short)
BRANCH=$(git branch --show-current)
COMMIT_COUNT=$(git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')

if [ -z "$STATUS" ]; then
    MESSAGE="ブランチ${BRANCH}、変更なし、コミット待機${COMMIT_COUNT}件"
else
    CHANGED=$(echo "$STATUS" | wc -l | tr -d ' ')
    MESSAGE="ブランチ${BRANCH}、変更ファイル${CHANGED}件、コミット待機${COMMIT_COUNT}件"
fi

tools/voicevox_enqueue.sh "$MESSAGE"
osascript -e "display notification \"$MESSAGE\" with title \"Miyabi - Git Status\""

# 詳細をログファイルに保存
echo "=== Git Status ===" > /tmp/miyabi-git-status.log
echo "Branch: $BRANCH" >> /tmp/miyabi-git-status.log
echo "Commits ahead: $COMMIT_COUNT" >> /tmp/miyabi-git-status.log
echo "" >> /tmp/miyabi-git-status.log
git status >> /tmp/miyabi-git-status.log

echo "📊 Git Status saved to /tmp/miyabi-git-status.log"
