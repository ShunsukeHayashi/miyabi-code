#!/bin/bash
# Stream Deck Shortcut: Update Dependencies
# Usage: プロジェクトの依存関係を更新

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "依存関係の更新を実行します"

echo "📦 Updating dependencies..."

# cargo updateを実行
cargo update 2>&1 | tee /tmp/miyabi-update-deps.log

UPDATE_STATUS=$?

if [ $UPDATE_STATUS -eq 0 ]; then
    # 更新された依存関係の数を確認
    UPDATED_COUNT=$(grep -c "Updating" /tmp/miyabi-update-deps.log || echo "0")

    tools/voicevox_enqueue.sh "${UPDATED_COUNT}個の依存関係を更新しました"
    osascript -e "display notification \"Updated $UPDATED_COUNT dependencies\" with title \"Miyabi - Deps Updated\" sound name \"Glass\""
    echo "✅ Updated $UPDATED_COUNT dependencies!"

    # 変更があった場合はCargo.lockを表示
    if [ "$UPDATED_COUNT" -gt 0 ]; then
        echo ""
        echo "Updated packages:"
        grep "Updating" /tmp/miyabi-update-deps.log
    fi
else
    tools/voicevox_enqueue.sh "依存関係の更新中にエラーが発生しました"
    osascript -e 'display notification "Update failed!" with title "Miyabi - Update Error" sound name "Basso"'
    echo "❌ Update failed!"
fi

exit $UPDATE_STATUS
