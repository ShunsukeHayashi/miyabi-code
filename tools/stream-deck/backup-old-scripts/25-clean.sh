#!/bin/bash
# Stream Deck Shortcut: Clean Build
# Usage: ビルド成果物をクリーンアップ

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "ビルドクリーンを実行します"

echo "🧹 Cleaning build artifacts..."

# Clean実行
cargo clean 2>&1 | tee /tmp/miyabi-clean.log

CLEAN_STATUS=$?

if [ $CLEAN_STATUS -eq 0 ]; then
    # クリーンされたサイズを計算
    FREED_SPACE=$(du -sh target 2>/dev/null | awk '{print $1}' || echo "N/A")

    tools/voicevox_enqueue.sh "ビルドクリーンが完了しました。"
    osascript -e "display notification \"Freed up space: $FREED_SPACE\" with title \"Miyabi - Clean Success\" sound name \"Glass\""
    echo "✅ Build cleaned! Freed space: $FREED_SPACE"
else
    tools/voicevox_enqueue.sh "クリーン中にエラーが発生しました"
    osascript -e 'display notification "Clean failed!" with title "Miyabi - Clean Error" sound name "Basso"'
    echo "❌ Clean failed!"
fi

exit $CLEAN_STATUS
