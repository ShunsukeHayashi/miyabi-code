#!/bin/bash
# PlantUML図をPNG画像に変換するスクリプト

set -e

IMAGE_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/daily-updates/images/2025-12-07"

echo "🎨 PlantUML図をPNG画像に変換中..."

# PlantUMLがインストールされているか確認
if ! command -v plantuml &> /dev/null; then
    echo "❌ PlantUMLがインストールされていません"
    echo "インストール方法: brew install plantuml"
    exit 1
fi

# 各PUMLファイルをPNGに変換
cd "$IMAGE_DIR"

for puml_file in *.puml; do
    echo "  変換中: $puml_file"
    plantuml -tpng "$puml_file"

    # 生成されたPNGファイル名を確認
    png_file="${puml_file%.puml}.png"
    if [ -f "$png_file" ]; then
        echo "  ✅ 生成完了: $png_file"
    else
        echo "  ❌ 生成失敗: $png_file"
    fi
done

echo ""
echo "🎉 すべての画像生成が完了しました！"
echo ""
echo "生成されたファイル:"
ls -lh *.png 2>/dev/null || echo "  (PNG生成失敗)"
