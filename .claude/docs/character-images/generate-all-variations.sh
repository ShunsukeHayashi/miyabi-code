#!/bin/bash

echo "🌸 Miyabi Character Variations - 完全生成スクリプト"
echo "================================================"
echo ""
echo "各キャラクターに対して15種類のバリエーション画像を生成します："
echo "- 5種類の表情"
echo "- 5種類のポーズ"  
echo "- 5種類のシチュエーション"
echo ""

# キャラクターリスト
CHARACTERS=(
    "shikiroon"
    "tsukuroon"
    "medaman"
    "mitsukeroon"
    "matomeroon"
)

# 進捗カウンター
TOTAL_CHARS=${#CHARACTERS[@]}
CURRENT_CHAR=0

# 各キャラクターを処理
for char in "${CHARACTERS[@]}"
do
    CURRENT_CHAR=$((CURRENT_CHAR + 1))
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "[$CURRENT_CHAR/$TOTAL_CHARS] 処理中: $char"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 全バリエーション生成（expression, pose, situation）
    echo "🎯 全バリエーション生成開始..."
    node generate-variations.js $char all
    
    if [ $? -eq 0 ]; then
        echo "✅ $char のバリエーション生成完了！"
    else
        echo "❌ $char のバリエーション生成でエラーが発生"
    fi
    
    # 次のキャラクターの前に少し待機
    if [ $CURRENT_CHAR -lt $TOTAL_CHARS ]; then
        echo "⏳ 次のキャラクターまで5秒待機..."
        sleep 5
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ 全キャラクターのバリエーション生成完了！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 生成されたファイル："
echo "  variations/"
find variations -name "*.png" | wc -l
echo "枚の画像が生成されました"
echo ""
echo "🎯 次のステップ："
echo "1. variation-gallery.html をブラウザで開いて確認"
echo "2. 一貫性チェック"
echo "3. 必要に応じて追加バリエーション生成"