#!/bin/bash
# FANZA新着作品スクレイピング（APIキー不要版）
# Usage: ./fanza_scrape_new_releases.sh [pages]

set -euo pipefail

# デフォルト設定
PAGES="${1:-1}"
OUTPUT_DIR="data/fanza"
OUTPUT_FILE="${OUTPUT_DIR}/new_releases_$(date +%Y%m%d).md"
JSON_FILE="${OUTPUT_DIR}/new_releases_$(date +%Y%m%d).json"
COOKIE_FILE="/tmp/fanza_cookies.txt"

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

echo "🔍 FANZA新着作品をスクレイピング中..."
echo "   取得ページ数: $PAGES"
echo "   出力先: $OUTPUT_FILE"
echo ""

# 年齢確認クッキーを設定
cat > "$COOKIE_FILE" <<EOF
.dmm.co.jp	TRUE	/	FALSE	9999999999	age_check_done	1
.dmm.co.jp	TRUE	/	FALSE	9999999999	ckcy	1
EOF

# Markdown生成（ヘッダー）
cat > "$OUTPUT_FILE" <<EOF
# FANZA 新着作品 - $(date +%Y年%m月%d日)

**取得日時**: $(date '+%Y-%m-%d %H:%M:%S')
**取得ページ数**: ${PAGES}ページ

---

EOF

# JSON初期化
echo '{"date":"'$(date -Iseconds)'","items":[]}' > "$JSON_FILE"

# ページごとに取得
for page in $(seq 1 "$PAGES"); do
  echo "📄 ページ ${page}/${PAGES} を取得中..."

  URL="https://www.dmm.co.jp/digital/videoa/-/list/=/article=keyword/id=6529/sort=date/page=${page}/"

  # HTML取得
  HTML=$(curl -s -b "$COOKIE_FILE" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    -H "Accept-Language: ja,en-US;q=0.9,en;q=0.8" \
    "$URL")

  # タイトル抽出（例: <p class="tmb">タイトル</p>）
  # 実際のHTML構造に応じて調整が必要

  # 簡易的にタイトルとURLを抽出（HTMLの構造解析が必要）
  echo "$HTML" | grep -oP '(?<=<p class="tmb">).*?(?=</p>)' | while read -r title; do
    echo "## $title" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "- **取得日**: $(date +%Y-%m-%d)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  done

  sleep 2  # サーバー負荷軽減のための待機
done

# クッキーファイル削除
rm -f "$COOKIE_FILE"

echo "✅ スクレイピング完了"
echo ""
echo "📊 取得作品数: $(grep -c "^## " "$OUTPUT_FILE" || echo "0")"
echo "📄 ファイルサイズ:"
echo "   Markdown: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
echo ""
echo "🎉 完了！"
echo ""
echo "⚠️  注意: このスクリプトは簡易実装です"
echo "   より正確な抽出には pup や htmlq などのHTMLパーサーが必要です"
