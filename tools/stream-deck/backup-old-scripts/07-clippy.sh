#!/bin/bash
# Stream Deck Shortcut: Run Clippy
# Usage: cargo clippyを実行してコード品質チェック

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "Clippyを実行します"

# Clippy実行
echo "🔍 Running Clippy..."
cargo clippy --all-targets --all-features -- -D warnings 2>&1 | tee /tmp/miyabi-clippy.log

CLIPPY_STATUS=$?

if [ $CLIPPY_STATUS -eq 0 ]; then
    # 成功
    tools/voicevox_enqueue.sh "Clippyチェックが成功しました。問題は見つかりませんでした"
    osascript -e 'display notification "All checks passed!" with title "Miyabi - Clippy Success" sound name "Glass"'
    echo "✅ Clippy check passed!"
else
    # 警告またはエラー
    tools/voicevox_enqueue.sh "Clippyで問題が見つかりました。ログを確認してください"
    osascript -e 'display notification "Issues found! Check /tmp/miyabi-clippy.log" with title "Miyabi - Clippy Issues" sound name "Basso"'
    echo "⚠️ Clippy found issues. Check /tmp/miyabi-clippy.log"
fi

exit $CLIPPY_STATUS
