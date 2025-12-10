#!/bin/bash
# iTerm2 インライン画像プレビュー用スクリプト
# imgcat を使用して画像をターミナルに表示

# imgcat function for iTerm2
imgcat() {
    local file="$1"
    if [[ -z "$file" ]]; then
        echo "Usage: imgcat <file>"
        return 1
    fi

    if [[ ! -f "$file" ]]; then
        echo "File not found: $file"
        return 1
    fi

    local filename=$(basename "$file")
    local base64_data=$(base64 < "$file")

    printf '\033]1337;File=name=%s;inline=1;width=auto;height=auto:%s\a\n' \
        "$(echo -n "$filename" | base64)" \
        "$base64_data"
}

# メイン処理
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <image_file>"
    echo "       $0 --all  (show all diagrams)"
    exit 1
fi

if [[ "$1" == "--all" ]]; then
    DIAGRAM_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A/demo/diagrams"

    for txt_file in "$DIAGRAM_DIR"/*.txt; do
        if [[ -f "$txt_file" ]]; then
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "📄 $(basename "$txt_file")"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            cat "$txt_file"
            echo ""
            read -p "Press Enter for next diagram..."
        fi
    done
else
    imgcat "$1"
fi
