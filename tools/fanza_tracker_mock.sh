#!/bin/bash
# FANZA新着作品トラッキング（モックデータ版）
# APIキー不要・スクレイピング不要でシステムの動作確認が可能
#
# Usage: ./fanza_tracker_mock.sh [count]

set -euo pipefail

COUNT="${1:-10}"
OUTPUT_DIR="data/fanza"
OUTPUT_FILE="${OUTPUT_DIR}/new_releases_$(date +%Y%m%d).md"
JSON_FILE="${OUTPUT_DIR}/new_releases_$(date +%Y%m%d).json"

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

echo "🔍 FANZA新着作品をトラッキング中（モックデータ版）..."
echo "   生成件数: $COUNT"
echo "   出力先: $OUTPUT_FILE"
echo ""

# モックデータ生成関数
generate_mock_item() {
  local index=$1
  local date_offset=$((index - 1))
  local release_date=$(date -v-${date_offset}d +%Y-%m-%d 2>/dev/null || date -d "${date_offset} days ago" +%Y-%m-%d)
  local product_id="MOCK-$(printf '%04d' $index)"
  local price=$((2980 + RANDOM % 3000))
  local review_count=$((RANDOM % 100))
  local review_avg=$(awk -v seed="$RANDOM" 'BEGIN{srand(seed); printf "%.1f", 3.0 + rand()*2.0}')

  cat <<EOF
{
  "product_id": "$product_id",
  "title": "サンプル作品タイトル #${index}",
  "release_date": "$release_date",
  "price": $price,
  "review": {
    "count": $review_count,
    "average": $review_avg
  },
  "url": "https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=${product_id}/",
  "thumbnail": "https://placehold.jp/300x200.png?text=MOCK${index}"
}
EOF
}

# JSON生成
echo "{" > "$JSON_FILE"
echo "  \"date\": \"$(date -Iseconds)\"," >> "$JSON_FILE"
echo "  \"count\": $COUNT," >> "$JSON_FILE"
echo "  \"mock\": true," >> "$JSON_FILE"
echo "  \"items\": [" >> "$JSON_FILE"

for i in $(seq 1 $COUNT); do
  generate_mock_item $i >> "$JSON_FILE"
  if [ $i -lt $COUNT ]; then
    echo "," >> "$JSON_FILE"
  fi
done

echo "  ]" >> "$JSON_FILE"
echo "}" >> "$JSON_FILE"

echo "✅ JSON生成完了: $JSON_FILE"

# Markdown生成
cat > "$OUTPUT_FILE" <<EOF
# FANZA 新着作品 - $(date +%Y年%m月%d日) 【モックデータ】

**取得日時**: $(date '+%Y-%m-%d %H:%M:%S')
**取得件数**: ${COUNT}件
**データソース**: モックデータ（デモ用）

> ⚠️ **注意**: これはデモ用のモックデータです。
> 実際のFANZA作品情報を取得するには、APIキーの設定またはスクレイピング実装が必要です。

---

EOF

# 各作品をMarkdownに追記
for i in $(seq 1 $COUNT); do
  date_offset=$((i - 1))
  release_date=$(date -v-${date_offset}d +%Y-%m-%d 2>/dev/null || date -d "${date_offset} days ago" +%Y-%m-%d)
  product_id="MOCK-$(printf '%04d' $i)"
  price=$((2980 + RANDOM % 3000))
  review_count=$((RANDOM % 100))
  review_avg=$(awk -v seed="$RANDOM" 'BEGIN{srand(seed); printf "%.1f", 3.0 + rand()*2.0}')

  cat >> "$OUTPUT_FILE" <<EOF
## サンプル作品タイトル #${i}

- **品番**: ${product_id}
- **発売日**: ${release_date}
- **価格**: ¥${price}
- **レビュー**: ${review_count}件 (平均: ${review_avg}点)
- **URL**: https://www.dmm.co.jp/digital/videoa/-/detail/=/cid=${product_id}/

![サムネイル](https://placehold.jp/300x200.png?text=MOCK${i})

---

EOF
done

echo "✅ Markdown生成完了: $OUTPUT_FILE"
echo ""
echo "📊 生成作品数: $COUNT"
echo "📄 ファイルサイズ:"
echo "   JSON: $(ls -lh "$JSON_FILE" | awk '{print $5}')"
echo "   Markdown: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
echo ""
echo "🎉 完了！"
echo ""
echo "📖 確認方法:"
echo "   cat $OUTPUT_FILE"
echo "   cat $JSON_FILE | jq ."
echo ""
echo "💡 次のステップ:"
echo "   1. 実際のAPI実装: DMM API ID/Affiliate IDを設定"
echo "   2. スクレイピング実装: Pythonスクリプトの改善"
echo "   3. cron/GitHub Actions設定: 自動実行"
