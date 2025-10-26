#!/bin/bash
# Stream Deck Shortcut: Run Tests
# Usage: 全テストを実行

cd "$(dirname "$0")/../.." || exit 1

tools/voicevox_enqueue.sh "全テストを実行します"

cargo test --all 2>&1 | tee /tmp/miyabi-test.log

TEST_STATUS=$?

if [ $TEST_STATUS -eq 0 ]; then
    tools/voicevox_enqueue.sh "全テストが成功しました"
    osascript -e 'display notification "All tests passed!" with title "Miyabi - Test Success" sound name "Glass"'
else
    tools/voicevox_enqueue.sh "テストが失敗しました。ログを確認してください"
    osascript -e 'display notification "Tests failed! Check logs." with title "Miyabi - Test Failure" sound name "Basso"'
fi

exit $TEST_STATUS
