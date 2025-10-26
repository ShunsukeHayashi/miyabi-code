#!/bin/bash
# FANZA新着作品取得スクリプト
# Usage: ./fanza_fetch_new_releases.sh [hits] [output_file]

set -euo pipefail

# デフォルト設定
HITS="${1:-20}"
OUTPUT_DIR="data/fanza"
OUTPUT_FILE="${2:-$OUTPUT_DIR/new_releases_$(date +%Y%m%d).md}"
JSON_FILE="${OUTPUT_DIR}/new_releases_$(date +%Y%m%d).json"

# 環境変数チェック
if [ -z "${DMM_API_ID:-}" ]; then
  echo "❌ エラー: DMM_API_ID が設定されていません"
  echo "   export DMM_API_ID=your_api_id"
  exit 1
fi

if [ -z "${DMM_AFFILIATE_ID:-}" ]; then
  echo "❌ エラー: DMM_AFFILIATE_ID が設定されていません"
  echo "   export DMM_AFFILIATE_ID=your_affiliate_id"
  exit 1
fi

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

echo "🔍 FANZA新着作品を取得中..."
echo "   取得件数: $HITS"
echo "   出力先: $OUTPUT_FILE"
echo ""

# API呼び出し
API_URL="https://api.dmm.com/affiliate/v3/ItemList"
PARAMS="api_id=${DMM_API_ID}&affiliate_id=${DMM_AFFILIATE_ID}&site=FANZA&service=digital&floor=videoa&hits=${HITS}&sort=date&output=json"

RESPONSE=$(curl -s "${API_URL}?${PARAMS}")

# レスポンス保存
echo "$RESPONSE" > "$JSON_FILE"
echo "✅ JSON保存完了: $JSON_FILE"

# エラーチェック
if echo "$RESPONSE" | jq -e '.result.status' > /dev/null 2>&1; then
  STATUS=$(echo "$RESPONSE" | jq -r '.result.status')
  if [ "$STATUS" != "OK" ]; then
    echo "❌ APIエラー: $(echo "$RESPONSE" | jq -r '.result.message // "Unknown error"')"
    exit 1
  fi
else
  echo "❌ APIレスポンスが不正です"
  exit 1
fi

# Markdown生成
cat > "$OUTPUT_FILE" <<EOF
# FANZA 新着作品 - $(date +%Y年%m月%d日)

**取得日時**: $(date '+%Y-%m-%d %H:%M:%S')
**取得件数**: ${HITS}件

---

EOF

# 作品情報を抽出してMarkdownに追記
echo "$RESPONSE" | jq -r '.result.items[] |
"## \(.title)

- **品番**: \(.content_id)
- **発売日**: \(.date)
- **価格**: ¥\(.prices.price // "N/A")
- **レビュー**: \(.review.count // 0)件 (平均: \(.review.average // "N/A")点)
- **URL**: \(.affiliateURL)

![サムネイル](\(.imageURL.large))

---

"' >> "$OUTPUT_FILE"

echo "✅ Markdown保存完了: $OUTPUT_FILE"
echo ""
echo "📊 取得作品数: $(echo "$RESPONSE" | jq '.result.items | length')"
echo "📄 ファイルサイズ:"
echo "   JSON: $(ls -lh "$JSON_FILE" | awk '{print $5}')"
echo "   Markdown: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
echo ""
echo "🎉 完了！"
