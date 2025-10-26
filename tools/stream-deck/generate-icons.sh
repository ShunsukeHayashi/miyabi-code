#!/bin/bash
# Stream Deck Icon Generator using Ark API
# Usage: ARK_API_KEY=your_key ./generate-icons.sh

set -e

# APIキー確認
if [ -z "$ARK_API_KEY" ]; then
    echo "❌ Error: ARK_API_KEY environment variable is not set"
    echo "Please set it before running this script:"
    echo "  export ARK_API_KEY=your_api_key"
    exit 1
fi

# 出力ディレクトリ作成
ICON_DIR="$(dirname "$0")/icons"
mkdir -p "$ICON_DIR"

echo "🎨 Generating Stream Deck icons using Ark API..."
echo "📁 Output directory: $ICON_DIR"
echo ""

# アイコン定義配列
declare -A ICONS=(
    # Row 1: Claude Code基本操作
    ["01-next"]="Minimalist icon: blue right arrow, play button style, clean geometric design, flat design, simple shapes, technology theme, vibrant blue color, white background, modern UI style"
    ["02-continue"]="Minimalist icon: double right arrows, fast forward symbol, clean geometric design, flat design, cyan color, white background, modern UI style"
    ["03-fix"]="Minimalist icon: orange wrench tool, repair symbol, clean geometric design, flat design, bright orange, white background, modern UI style"
    ["04-help"]="Minimalist icon: purple question mark, help symbol, clean geometric design, flat design, vibrant purple, white background, modern UI style"

    # Row 2: ビルド・テスト
    ["05-build"]="Minimalist icon: construction crane, building blocks, clean geometric design, flat design, yellow-orange gradient, white background, modern UI style"
    ["06-test"]="Minimalist icon: green checkmark in circle, test pass symbol, clean geometric design, flat design, bright green, white background, modern UI style"
    ["07-clippy"]="Minimalist icon: paperclip with sparkles, code quality symbol, clean geometric design, flat design, blue-purple gradient, white background, modern UI style"
    ["08-format"]="Minimalist icon: paint roller, code formatting symbol, clean geometric design, flat design, pink-magenta gradient, white background, modern UI style"

    # Row 3: Git操作
    ["09-git"]="Minimalist icon: git branch diagram, version control tree, clean geometric design, flat design, orange color, white background, modern UI style"
    ["10-commit"]="Minimalist icon: chat bubble with checkmark, commit message symbol, clean geometric design, flat design, green-blue gradient, white background, modern UI style"
    ["11-pr"]="Minimalist icon: merge arrows, pull request symbol, clean geometric design, flat design, purple color, white background, modern UI style"
    ["12-push"]="Minimalist icon: rocket launching upward, deployment symbol, clean geometric design, flat design, red-orange gradient, white background, modern UI style"

    # Row 4: Agent実行
    ["13-coordinator"]="Minimalist icon: target with bullseye, coordination symbol, clean geometric design, flat design, red-pink gradient, white background, modern UI style"
    ["14-codegen"]="Minimalist icon: gear with code brackets, code generation symbol, clean geometric design, flat design, blue-cyan gradient, white background, modern UI style"
    ["15-review"]="Minimalist icon: magnifying glass over document, code review symbol, clean geometric design, flat design, purple-blue gradient, white background, modern UI style"
    ["16-deploy"]="Minimalist icon: ship sailing, deployment symbol, clean geometric design, flat design, navy blue color, white background, modern UI style"

    # Row 5: ドキュメント・解析
    ["17-docs"]="Minimalist icon: open book with bookmark, documentation symbol, clean geometric design, flat design, blue color, white background, modern UI style"
    ["18-analyze"]="Minimalist icon: microscope, code analysis symbol, clean geometric design, flat design, teal-green gradient, white background, modern UI style"
    ["19-benchmark"]="Minimalist icon: checkered racing flag, performance benchmark symbol, clean geometric design, flat design, black-white gradient, white background, modern UI style"
    ["20-profile"]="Minimalist icon: lightning bolt with speedometer, performance profiling symbol, clean geometric design, flat design, yellow-orange gradient, white background, modern UI style"

    # Row 6: デプロイ・インフラ
    ["21-deploy-prod"]="Minimalist icon: globe with upload arrow, production deployment symbol, clean geometric design, flat design, green-blue gradient, white background, modern UI style"
    ["22-rollback"]="Minimalist icon: circular arrow pointing left, rollback symbol, clean geometric design, flat design, orange-red gradient, white background, modern UI style"
    ["23-logs"]="Minimalist icon: document with lines, log file symbol, clean geometric design, flat design, gray-blue gradient, white background, modern UI style"
    ["24-monitor"]="Minimalist icon: radar screen with signal waves, monitoring symbol, clean geometric design, flat design, green color, white background, modern UI style"

    # Row 7: ユーティリティ
    ["25-clean"]="Minimalist icon: broom sweeping, cleanup symbol, clean geometric design, flat design, blue-green gradient, white background, modern UI style"
    ["26-cache"]="Minimalist icon: database with refresh arrow, cache management symbol, clean geometric design, flat design, purple color, white background, modern UI style"
    ["27-deps"]="Minimalist icon: package box with arrows, dependency management symbol, clean geometric design, flat design, brown-orange gradient, white background, modern UI style"
    ["28-audit"]="Minimalist icon: shield with lock, security audit symbol, clean geometric design, flat design, red color, white background, modern UI style"

    # Row 8: カスタム・拡張
    ["29-voice"]="Minimalist icon: speaker with sound waves, voice notification symbol, clean geometric design, flat design, blue-purple gradient, white background, modern UI style"
    ["30-infinity"]="Minimalist icon: infinity symbol with glow effect, continuous loop symbol, clean geometric design, flat design, rainbow gradient, white background, modern UI style"
    ["31-session"]="Minimalist icon: circular refresh arrows, session management symbol, clean geometric design, flat design, cyan-blue gradient, white background, modern UI style"
    ["32-custom"]="Minimalist icon: settings gear with star, customization symbol, clean geometric design, flat design, orange-yellow gradient, white background, modern UI style"
)

# 画像生成関数
generate_icon() {
    local icon_id="$1"
    local prompt="$2"
    local output_file="$ICON_DIR/${icon_id}.png"

    echo "🎨 Generating: $icon_id"
    echo "   Prompt: ${prompt:0:80}..."

    # API呼び出し
    response=$(curl -s -X POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ARK_API_KEY" \
        -d "{
            \"model\": \"seedream-4-0-250828\",
            \"prompt\": \"$prompt\",
            \"sequential_image_generation\": \"disabled\",
            \"response_format\": \"url\",
            \"size\": \"1K\",
            \"stream\": false,
            \"watermark\": false
        }")

    # URLを抽出
    image_url=$(echo "$response" | grep -o '"url":"[^"]*"' | head -1 | sed 's/"url":"//;s/"//')

    if [ -n "$image_url" ]; then
        # 画像をダウンロード
        curl -s -o "$output_file" "$image_url"
        echo "   ✅ Saved: $output_file"
    else
        echo "   ❌ Failed to generate image"
        echo "   Response: $response"
    fi

    # API rate limitを避けるため待機
    sleep 2
}

# 全アイコンを生成
total=${#ICONS[@]}
current=0

for icon_id in "${!ICONS[@]}"; do
    current=$((current + 1))
    echo ""
    echo "[$current/$total] Processing $icon_id"
    generate_icon "$icon_id" "${ICONS[$icon_id]}"
done

echo ""
echo "✅ Icon generation completed!"
echo "📁 Icons saved to: $ICON_DIR"
echo ""
echo "Generated $(ls -1 "$ICON_DIR"/*.png 2>/dev/null | wc -l) icons"
