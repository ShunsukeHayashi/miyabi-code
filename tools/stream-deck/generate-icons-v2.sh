#!/bin/bash
# Stream Deck Icon Generator v2 - Fixed version

API_KEY="fdc9e681-e525-4122-9ed1-2d896f2cb11c"
ICON_DIR="$(dirname "$0")/icons"
mkdir -p "$ICON_DIR"

echo "🎨 Generating Stream Deck icons (Row 1 - Claude Code operations)..."

generate_icon() {
    local id="$1"
    local name="$2"
    local prompt="$3"

    echo "[$id/32] Generating $name..."

    # API呼び出し
    response=$(curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $API_KEY" \
        -d "{
            \"model\": \"seedream-4-0-250828\",
            \"prompt\": \"$prompt\",
            \"size\": \"1K\",
            \"watermark\": false
        }")

    # URLを抽出
    url=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['data'][0]['url'])" 2>/dev/null)

    if [ -n "$url" ]; then
        # 画像をダウンロード
        curl -s -o "$ICON_DIR/$name.jpeg" "$url"
        echo "   ✅ Saved: $ICON_DIR/$name.jpeg"
    else
        echo "   ❌ Failed to generate $name"
    fi

    sleep 2
}

# Row 1: Claude Code基本操作
generate_icon "01" "01-next" "Minimalist icon: blue right arrow, play button style, clean geometric design, flat design, simple shapes, technology theme, vibrant blue color, white background, modern UI style"
generate_icon "02" "02-continue" "Minimalist icon: double right arrows, fast forward symbol, clean geometric design, flat design, cyan color, white background, modern UI style"
generate_icon "03" "03-fix" "Minimalist icon: orange wrench tool, repair symbol, clean geometric design, flat design, bright orange, white background, modern UI style"
generate_icon "04" "04-help" "Minimalist icon: purple question mark, help symbol, clean geometric design, flat design, vibrant purple, white background, modern UI style"

echo ""
echo "✅ Row 1 icons generated!"
echo "📁 Location: $ICON_DIR"
ls -lh "$ICON_DIR"/*.jpeg 2>/dev/null | tail -4
