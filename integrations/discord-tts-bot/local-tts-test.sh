#!/bin/bash
# ローカルVOICEVOX音声テスト（Discord不要）

set -euo pipefail

echo "🎤 ローカルVOICEVOX音声テスト開始..."

# テキスト設定
TEXT="こんにちは、ほのかです！音声テスト実行中！"
SPEAKER_ID=1  # ずんだもん（かわいい声）
VOICEVOX_URL="http://localhost:50021"

# 一時ファイル
QUERY_FILE=$(mktemp /tmp/voicevox-query.XXXXXX.json)
AUDIO_FILE=$(mktemp /tmp/voicevox-audio.XXXXXX.wav)

echo "📝 テキスト: ${TEXT}"
echo "🎵 スピーカーID: ${SPEAKER_ID}"

# ステップ1: オーディオクエリ生成
echo ""
echo "🔄 VOICEVOX APIへリクエスト中..."
curl -s -X POST \
  "${VOICEVOX_URL}/audio_query?text=${TEXT}&speaker=${SPEAKER_ID}" \
  -o "${QUERY_FILE}"

if [ ! -s "${QUERY_FILE}" ]; then
  echo "❌ エラー: オーディオクエリの生成に失敗"
  exit 1
fi

echo "✅ オーディオクエリ生成完了"

# ステップ2: 音声合成
echo "🔄 音声合成中..."
curl -s -X POST \
  "${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}" \
  -H "Content-Type: application/json" \
  -d @"${QUERY_FILE}" \
  -o "${AUDIO_FILE}"

if [ ! -s "${AUDIO_FILE}" ]; then
  echo "❌ エラー: 音声合成に失敗"
  exit 1
fi

AUDIO_SIZE=$(stat -f%z "${AUDIO_FILE}")
echo "✅ 音声合成完了 (ファイルサイズ: ${AUDIO_SIZE} bytes)"

# ステップ3: ローカル再生（macOS afplay使用）
echo ""
echo "🔊 ローカル再生開始..."
afplay "${AUDIO_FILE}"

echo "✅ 再生完了！"

# クリーンアップ
rm -f "${QUERY_FILE}" "${AUDIO_FILE}"
echo "🧹 一時ファイル削除完了"

echo ""
echo "🎉 テスト成功！VOICEVOXからローカル音声出力が動作しています。"
