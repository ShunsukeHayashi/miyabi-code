#!/bin/bash

# VOICEVOXキューにテキストを追加するスクリプト
# 使い方: voicevox_enqueue.sh "テキスト" [speaker_id] [speed_scale]

TEXT="$1"
SPEAKER="${2:-3}"  # デフォルト: ずんだもん
SPEED="${3:-1.2}"  # デフォルト: 1.2倍速

if [ -z "$TEXT" ]; then
  echo "Error: テキストが指定されていません"
  echo "使い方: $0 \"テキスト\" [speaker_id] [speed_scale]"
  exit 1
fi

# キューディレクトリ作成
mkdir -p /tmp/voicevox_queue

# タイムスタンプ付きファイル名生成
TIMESTAMP=$(date +%s%N)
QUEUE_FILE="/tmp/voicevox_queue/${TIMESTAMP}.json"

# JSONキューファイル作成
cat > "$QUEUE_FILE" <<EOF
{
  "text": "$TEXT",
  "speaker": $SPEAKER,
  "speedScale": $SPEED,
  "timestamp": $TIMESTAMP
}
EOF

echo "✅ キューに追加しました: $QUEUE_FILE"
echo "   テキスト: $TEXT"
echo "   話者ID: $SPEAKER"
echo "   速度: ${SPEED}x"
