#!/bin/bash
# ImageMagickで背景画像を作成
convert -size 1920x1080 gradient:'#1a1a2e'-'#16213e' \
  -gravity center \
  -pointsize 80 -fill white -font "Helvetica-Bold" \
  -annotate +0-200 "Water Spider Orchestrator" \
  -pointsize 50 -fill '#0f3460' \
  -annotate +0-100 "完全非同期並列実行システム" \
  -pointsize 40 -fill white \
  -annotate +0+50 "霊夢 × 魔理沙" \
  -pointsize 30 -fill '#e94560' \
  -annotate +0+150 "ゆっくり解説" \
  background.png

echo "✅ background.png 作成完了"
