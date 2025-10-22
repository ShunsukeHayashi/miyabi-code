#!/bin/bash
# VOICEVOXレスポンス詳細確認

set -euo pipefail

echo "🔍 VOICEVOX API詳細デバッグ"
echo "================================"

TEXT="テスト"
SPEAKER_ID=1
VOICEVOX_URL="http://localhost:50021"

# ステップ1: オーディオクエリ
echo ""
echo "📝 ステップ1: オーディオクエリ生成"
echo "URL: ${VOICEVOX_URL}/audio_query?text=${TEXT}&speaker=${SPEAKER_ID}"
echo ""

QUERY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "${VOICEVOX_URL}/audio_query?text=${TEXT}&speaker=${SPEAKER_ID}")

HTTP_STATUS=$(echo "$QUERY_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
QUERY_BODY=$(echo "$QUERY_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "HTTP Status: ${HTTP_STATUS}"
echo "Response Body:"
echo "${QUERY_BODY}" | jq '.' 2>/dev/null || echo "${QUERY_BODY}"

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ エラー: オーディオクエリ失敗"
  exit 1
fi

# 一時ファイルに保存
QUERY_FILE=$(mktemp /tmp/voicevox-query.XXXXXX.json)
echo "${QUERY_BODY}" > "${QUERY_FILE}"

# ステップ2: 音声合成
echo ""
echo "📝 ステップ2: 音声合成"
echo "URL: ${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}"
echo ""

AUDIO_FILE=$(mktemp /tmp/voicevox-audio.XXXXXX.wav)

curl -s -w "\nHTTP_STATUS:%{http_code}\nCONTENT_LENGTH:%{size_download}" \
  -X POST "${VOICEVOX_URL}/synthesis?speaker=${SPEAKER_ID}" \
  -H "Content-Type: application/json" \
  -d @"${QUERY_FILE}" \
  -o "${AUDIO_FILE}" > /tmp/synthesis-debug.txt

HTTP_STATUS=$(grep "HTTP_STATUS:" /tmp/synthesis-debug.txt | cut -d':' -f2)
CONTENT_LENGTH=$(grep "CONTENT_LENGTH:" /tmp/synthesis-debug.txt | cut -d':' -f2)

echo "HTTP Status: ${HTTP_STATUS}"
echo "Content Length: ${CONTENT_LENGTH} bytes"

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ エラー: 音声合成失敗"
  echo "レスポンス内容:"
  cat "${AUDIO_FILE}"
  exit 1
fi

# ファイル詳細
echo ""
echo "📝 生成ファイル詳細:"
ls -lh "${AUDIO_FILE}"
file "${AUDIO_FILE}"

# WAVヘッダー確認
echo ""
echo "📝 WAVヘッダー（最初の44バイト）:"
xxd -l 44 "${AUDIO_FILE}"

# 再生テスト
echo ""
echo "🔊 再生テスト..."
if afplay "${AUDIO_FILE}"; then
  echo "✅ 再生成功！"
else
  echo "❌ 再生失敗"
fi

# クリーンアップ
rm -f "${QUERY_FILE}" "${AUDIO_FILE}" /tmp/synthesis-debug.txt
