#!/bin/bash

# スマートVOICEVOX通知エンキュー
# 重要な情報のみを、わかりやすい言葉で通知

QUEUE_DIR="/tmp/voicevox_queue"
mkdir -p "$QUEUE_DIR"

# 引数チェック
if [ $# -lt 2 ]; then
  echo "Usage: $0 <event_type> <context>"
  echo "event_type: session_start|task_complete|error|milestone"
  exit 1
fi

EVENT_TYPE="$1"
CONTEXT="$2"
SPEAKER="${3:-3}"  # デフォルト: ずんだもん (3)
SPEED="${4:-1.0}"

# イベントタイプに応じてメッセージを生成
generate_message() {
  case "$EVENT_TYPE" in
    session_start)
      echo "作業を開始します。今日も頑張りましょう。"
      ;;

    task_complete)
      # コンテキストから具体的な内容を抽出
      if echo "$CONTEXT" | grep -q "Phase 9"; then
        echo "Phase 9の実装が完了しました。自動デプロイ機能が使えるようになります。"
      elif echo "$CONTEXT" | grep -q "test"; then
        echo "テストが完了しました。全て正常です。"
      elif echo "$CONTEXT" | grep -q "build"; then
        echo "ビルドが完了しました。"
      else
        echo "タスクが完了しました。"
      fi
      ;;

    error)
      echo "エラーが発生しました。確認が必要です。"
      ;;

    milestone)
      # マイルストーン達成時の特別なメッセージ
      case "$CONTEXT" in
        "5_tasks")
          echo "5つのタスクが完了しました。順調に進んでいます。"
          ;;
        "10_tasks")
          echo "10タスク達成！素晴らしいペースです。"
          ;;
        "phase_complete")
          echo "フェーズが完了しました。次のステップに進めます。"
          ;;
        *)
          echo "重要なマイルストーンを達成しました。"
          ;;
      esac
      ;;

    summary)
      # 定期的なサマリー (5分ごとなど)
      echo "$CONTEXT"
      ;;

    *)
      # 不明なイベントはスキップ
      exit 0
      ;;
  esac
}

MESSAGE=$(generate_message)

# メッセージが空の場合はスキップ
if [ -z "$MESSAGE" ]; then
  exit 0
fi

# 重複チェック（直近3件に同じメッセージがあればスキップ）
RECENT_MESSAGES=$(find "$QUEUE_DIR" -name "*.json" -type f -exec cat {} \; | jq -r '.text' | tail -3)
if echo "$RECENT_MESSAGES" | grep -Fxq "$MESSAGE"; then
  echo "Skipping duplicate message: $MESSAGE"
  exit 0
fi

# キューファイル作成
TIMESTAMP=$(date +%s%N)
QUEUE_FILE="$QUEUE_DIR/${TIMESTAMP}.json"

cat > "$QUEUE_FILE" <<EOF
{
  "text": "$MESSAGE",
  "speaker": $SPEAKER,
  "speedScale": $SPEED,
  "timestamp": "$(date -Iseconds)",
  "event_type": "$EVENT_TYPE"
}
EOF

echo "✅ Enqueued: $MESSAGE"
