#!/bin/bash
# ローカルVOICEVOX音声テスト（URL エンコーディング修正版）

set -euo pipefail

echo "🎤 ローカルVOICEVOX音声テスト開始..."

# テキスト設定
TEXT="こんにちは、ほのかです！音声テスト実行中！"
SPEAKER_ID=1
VOICEVOX_URL="http://localhost:50021"

# 一時ファイル
QUERY_FILE=$(mktemp /tmp/voicevox-query.XXXXXX.json)
AUDIO_FILE=$(mktemp /tmp/voicevox-audio.XXXXXX.wav)

echo "📝 テキスト: ${TEXT}"
echo "🎵 スピーカーID: ${SPEAKER_ID}"

# ステップ1: オーディオクエリ生成（--data-urlencodeを使用）
echo ""
echo "🔄 VOICEVOX APIへリクエスト中..."
curl -s -X POST \
  "${VOICEVOX_URL}/audio_query" \
  --data-urlencode "text=${TEXT}" \
  --data-urlencode "speaker=${SPEAKER_ID}" \
  -o "${QUERY_FILE}"

if [ ! -s "${QUERY_FILE}" ]; then
  echo "❌ エラー: オーディオクエリの生成に失敗"
  cat "${QUERY_FILE}"
  exit 1
fi

echo "✅ オーディオクエリ生成完了"

# クエリ内容確認
QUERY_SIZE=$(stat -f%z "${QUERY_FILE}")
echo "   クエリサイズ: ${QUERY_SIZE} bytes"

# ステップ2: 音声合成
echo "🔄 音声合成中..."
curl -s -X POST \
  "${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}" \
  -H "Content-Type: application/json" \
  -d @"${QUERY_FILE}" \
  -o "${AUDIO_FILE}"

if [ ! -s "${AUDIO_FILE}" ]; then
  echo "❌ エラー: 音声合成に失敗"
  cat "${AUDIO_FILE}"
  exit 1
fi

AUDIO_SIZE=$(stat -f%z "${AUDIO_FILE}")
echo "✅ 音声合成完了 (ファイルサイズ: ${AUDIO_SIZE} bytes)"

# ファイル形式確認
echo "   ファイル形式: $(file -b "${AUDIO_FILE}")"

# ステップ3: ローカル再生（macOS afplay使用）
echo ""
echo "🔊 ローカル再生開始..."
if afplay "${AUDIO_FILE}"; then
  echo "✅ 再生完了！"
else
  echo "❌ 再生エラー"
  exit 1
fi

# クリーンアップ
rm -f "${QUERY_FILE}" "${AUDIO_FILE}"
echo "🧹 一時ファイル削除完了"

echo ""
echo "🎉 テスト成功！VOICEVOXからローカル音声出力が動作しています。"
echo ""
echo "✅ 確認完了:"
echo "   - VOICEVOX API: 正常動作"
echo "   - 音声合成: 正常動作"
echo "   - ローカル再生: 正常動作"
