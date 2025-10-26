#!/bin/bash
# Stream Deck Shortcut: Run Benchmarks
# Usage: ベンチマークを実行してパフォーマンス計測

cd "$(dirname "$0")/../.." || exit 1

# 音声通知: 開始
tools/voicevox_enqueue.sh "ベンチマークを実行します"

echo "🏁 Running benchmarks..."

# ベンチマーク実行（cargoベンチマークまたはカスタムベンチマーク）
if cargo bench --help >/dev/null 2>&1; then
    cargo bench 2>&1 | tee /tmp/miyabi-benchmark.log
    BENCH_STATUS=$?
else
    # cargo benchが利用できない場合は、Claude Codeに依頼
    MESSAGE="Run benchmarks and analyze performance"
    $(dirname "$0")/05-send-to-claude.sh "$MESSAGE"
    BENCH_STATUS=0
fi

if [ $BENCH_STATUS -eq 0 ]; then
    tools/voicevox_enqueue.sh "ベンチマークが完了しました"
    osascript -e 'display notification "Benchmark completed!" with title "Miyabi - Benchmark" sound name "Glass"'
    echo "✅ Benchmark completed!"
else
    tools/voicevox_enqueue.sh "ベンチマークでエラーが発生しました"
    osascript -e 'display notification "Benchmark failed!" with title "Miyabi - Benchmark Error" sound name "Basso"'
    echo "❌ Benchmark failed!"
fi

exit $BENCH_STATUS
