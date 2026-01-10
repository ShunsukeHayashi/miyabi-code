#!/data/data/com.termux/files/usr/bin/bash

# Termux Search Helper - MCP Glob/Grep Alternative
# Android Termux環境でのファイル検索・テキスト検索支援ツール

function termux_glob() {
    local pattern="$1"
    local path="${2:-.}"

    echo "🔍 Termux Glob: $pattern in $path"
    find "$path" -name "$pattern" -type f | sort -t/ -k$(echo "$path" | tr -cd '/' | wc -c) | head -20
}

function termux_grep() {
    local pattern="$1"
    local glob_pattern="$2"
    local path="${3:-.}"
    local limit="${4:-10}"

    echo "🔍 Termux Grep: '$pattern' in files matching '$glob_pattern'"

    if [ -n "$glob_pattern" ]; then
        find "$path" -name "$glob_pattern" -type f -exec grep -l "$pattern" {} \; | head -"$limit"
    else
        grep -r -l "$pattern" "$path" | head -"$limit"
    fi
}

function termux_grep_content() {
    local pattern="$1"
    local glob_pattern="$2"
    local path="${3:-.}"
    local limit="${4:-5}"

    echo "🔍 Termux Grep Content: '$pattern' in files matching '$glob_pattern'"

    if [ -n "$glob_pattern" ]; then
        find "$path" -name "$glob_pattern" -type f -exec grep -n -H "$pattern" {} \; | head -"$limit"
    else
        grep -r -n -H "$pattern" "$path" | head -"$limit"
    fi
}

# Test functionality
echo "🧪 Android Termux Search Helper Tests"
echo "====================================="

echo ""
echo "1. Markdown files in current directory:"
termux_glob "*.md" .

echo ""
echo "2. Files containing 'Miyabi':"
termux_grep "Miyabi" "*.md" . 3

echo ""
echo "3. Content containing 'MCP':"
termux_grep_content "MCP" "*.md" . 3

echo ""
echo "✨ Termux Search Helper ready!"
echo "Usage:"
echo "  termux_glob '*.rs'           # Find Rust files"
echo "  termux_grep 'function' '*.js' # Find JS files with 'function'"
echo "  termux_grep_content 'TODO' '*.md' # Show TODO content"