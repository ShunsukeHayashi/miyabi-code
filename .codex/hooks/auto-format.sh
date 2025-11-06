#!/bin/bash
# Auto-format hook - Rust/TypeScript formatter

set -e

FILE_PATH="$1"

if [[ "$FILE_PATH" == *.rs ]]; then
    echo "[auto-format] Formatting Rust file: $FILE_PATH"
    rustfmt "$FILE_PATH"
elif [[ "$FILE_PATH" == *.ts ]] || [[ "$FILE_PATH" == *.tsx ]]; then
    echo "[auto-format] Formatting TypeScript file: $FILE_PATH"
    npx prettier --write "$FILE_PATH"
fi
