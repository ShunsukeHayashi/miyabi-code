#!/bin/bash
# Stream Deck Shortcut: Release Build
# Usage: リリースビルドを実行

cd "$(dirname "$0")/../.." || exit 1

# 通知送信
tools/voicevox_enqueue.sh "リリースビルドを開始します"

# ビルド実行
cargo build --release 2>&1 | tee /tmp/miyabi-build.log

BUILD_STATUS=$?

if [ $BUILD_STATUS -eq 0 ]; then
    tools/voicevox_enqueue.sh "リリースビルドが成功しました"
    osascript -e 'display notification "Build completed successfully!" with title "Miyabi - Build Success" sound name "Glass"'
else
    tools/voicevox_enqueue.sh "ビルドエラーが発生しました。ログを確認してください"
    osascript -e 'display notification "Build failed! Check logs." with title "Miyabi - Build Error" sound name "Basso"'
fi

exit $BUILD_STATUS
