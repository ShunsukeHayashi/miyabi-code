#!/bin/bash
# Stream Deck Shortcut: Clear Cache
# Usage: 各種キャッシュをクリア

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "キャッシュクリアを実行します"

echo "💾 Clearing caches..."

# Cargoキャッシュクリア
echo "🗑️ Clearing Cargo incremental cache..."
rm -rf target/debug/incremental target/release/incremental

# 一時ファイルクリア
echo "🗑️ Clearing Miyabi temp files..."
rm -f /tmp/miyabi-*.log /tmp/miyabi-*.json

# VOICEVOXキュークリア
echo "🗑️ Clearing VOICEVOX queue..."
rm -f /tmp/voicevox_queue/*.json 2>/dev/null

tools/voicevox_enqueue.sh "キャッシュクリアが完了しました"
osascript -e 'display notification "All caches cleared!" with title "Miyabi - Cache Clear" sound name "Glass"'

echo "✅ Caches cleared successfully!"
