#!/bin/bash

# VOICEVOXキュー処理ワーカー（バックグラウンド常駐）
# 使い方: voicevox_worker.sh &

QUEUE_DIR="/tmp/voicevox_queue"
LOCK_FILE="$QUEUE_DIR/worker.lock"
LOG_FILE="$QUEUE_DIR/worker.log"
VOICEVOX_HOST="http://localhost:50021"

# ロックファイル確認（多重起動防止）
if [ -f "$LOCK_FILE" ]; then
  WORKER_PID=$(cat "$LOCK_FILE")
  if ps -p "$WORKER_PID" > /dev/null 2>&1; then
    echo "Error: ワーカーはすでに起動中です (PID: $WORKER_PID)"
    exit 1
  else
    echo "古いロックファイルを削除します"
    rm -f "$LOCK_FILE"
  fi
fi

# ロックファイル作成
echo $$ > "$LOCK_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') ワーカー起動 (PID: $$)" >> "$LOG_FILE"

# クリーンアップ関数
cleanup() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') ワーカー終了 (PID: $$)" >> "$LOG_FILE"
  rm -f "$LOCK_FILE"
  exit 0
}

trap cleanup SIGINT SIGTERM

# メインループ
while true; do
  # キューファイルを古い順に取得
  QUEUE_FILE=$(ls -1 "$QUEUE_DIR"/*.json 2>/dev/null | head -n 1)

  if [ -z "$QUEUE_FILE" ]; then
    # キューが空の場合は1秒待機
    sleep 1
    continue
  fi

  # キューファイル読み込み
  TEXT=$(jq -r '.text' "$QUEUE_FILE")
  SPEAKER=$(jq -r '.speaker' "$QUEUE_FILE")
  SPEED=$(jq -r '.speedScale' "$QUEUE_FILE")

  echo "$(date '+%Y-%m-%d %H:%M:%S') 処理開始: $TEXT (話者:$SPEAKER, 速度:${SPEED}x)" >> "$LOG_FILE"

  # 1. 音声合成クエリ生成（URLエンコード）
  TEXT_ENCODED=$(echo -n "$TEXT" | jq -sRr @uri)
  QUERY=$(curl -s -X POST "$VOICEVOX_HOST/audio_query?text=$TEXT_ENCODED&speaker=$SPEAKER")

  if [ $? -ne 0 ] || [ -z "$QUERY" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') エラー: 音声クエリ生成失敗" >> "$LOG_FILE"
    rm -f "$QUEUE_FILE"
    continue
  fi

  # 速度変更
  QUERY=$(echo "$QUERY" | jq ".speedScale = $SPEED")

  # 2. 音声合成実行（一時ファイルにユニークなタイムスタンプ使用）
  AUDIO_FILE="/tmp/voicevox_audio_$(date +%s%N).wav"
  curl -s -X POST "$VOICEVOX_HOST/synthesis?speaker=$SPEAKER" \
    -H "Content-Type: application/json" \
    -d "$QUERY" \
    -o "$AUDIO_FILE"

  if [ $? -ne 0 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') エラー: 音声合成失敗" >> "$LOG_FILE"
    rm -f "$QUEUE_FILE"
    rm -f "$AUDIO_FILE"
    continue
  fi

  # 3. 音声再生（macOS: afplay, Linux: aplay/paplay）
  if command -v afplay > /dev/null; then
    afplay "$AUDIO_FILE" 2>> "$LOG_FILE"
  elif command -v aplay > /dev/null; then
    aplay "$AUDIO_FILE" 2>> "$LOG_FILE"
  elif command -v paplay > /dev/null; then
    paplay "$AUDIO_FILE" 2>> "$LOG_FILE"
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') エラー: 音声再生コマンドが見つかりません" >> "$LOG_FILE"
  fi

  # クリーンアップ
  rm -f "$AUDIO_FILE"
  rm -f "$QUEUE_FILE"

  echo "$(date '+%Y-%m-%d %H:%M:%S') 処理完了: $TEXT" >> "$LOG_FILE"
done
