#!/bin/bash
# Stream Deck Shortcut: Format Code
# Usage: cargo fmtを実行してコードフォーマット

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "コードフォーマットを実行します"

# Format実行
echo "💅 Formatting code..."
cargo fmt --all 2>&1 | tee /tmp/miyabi-format.log

FMT_STATUS=$?

if [ $FMT_STATUS -eq 0 ]; then
    # 成功
    tools/voicevox_enqueue.sh "コードフォーマットが完了しました"
    osascript -e 'display notification "Code formatted successfully!" with title "Miyabi - Format Success" sound name "Glass"'
    echo "✅ Code formatted!"

    # 変更があったか確認
    if git diff --quiet; then
        echo "   No changes needed"
    else
        echo "   Files were reformatted:"
        git diff --name-only
    fi
else
    # エラー
    tools/voicevox_enqueue.sh "フォーマット中にエラーが発生しました"
    osascript -e 'display notification "Format failed!" with title "Miyabi - Format Error" sound name "Basso"'
    echo "❌ Format failed!"
fi

exit $FMT_STATUS
