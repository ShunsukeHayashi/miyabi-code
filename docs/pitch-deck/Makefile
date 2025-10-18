# Miyabi Pitch Deck - Makefile

.PHONY: help install build html pdf pptx jony jony-html jony-pdf jony-pptx all watch watch-jony preview preview-jony clean

# デフォルトターゲット
.DEFAULT_GOAL := help

# ヘルプ
help:
	@echo "Miyabi Pitch Deck - ビルドコマンド"
	@echo ""
	@echo "使用方法: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  install      - 必要なNode.js依存関係をインストール"
	@echo ""
	@echo "  [Original Theme]"
	@echo "  build        - すべての形式（HTML, PDF, PPTX）をビルド"
	@echo "  html         - HTML形式をビルド"
	@echo "  pdf          - PDF形式をビルド"
	@echo "  pptx         - PowerPoint形式をビルド"
	@echo ""
	@echo "  [Jony Ive Theme]"
	@echo "  jony         - Jony Iveテーマですべての形式をビルド"
	@echo "  jony-html    - Jony IveテーマでHTML形式をビルド"
	@echo "  jony-pdf     - Jony IveテーマでPDF形式をビルド"
	@echo "  jony-pptx    - Jony IveテーマでPPTX形式をビルド"
	@echo ""
	@echo "  [Other]"
	@echo "  all          - オリジナル + Jony Ive 両方をビルド"
	@echo "  watch        - ファイルを監視して自動リビルド（Original）"
	@echo "  watch-jony   - ファイルを監視して自動リビルド（Jony Ive）"
	@echo "  preview      - ブラウザでプレビュー（Original）"
	@echo "  preview-jony - ブラウザでプレビュー（Jony Ive）"
	@echo "  clean        - 生成ファイルを削除"
	@echo ""

# 依存関係のインストール
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Dependencies installed"

# 出力ディレクトリの作成
output:
	@mkdir -p output

# すべての形式をビルド
build: output
	@echo "🏗️  Building all formats..."
	npm run build
	@echo "✅ Build complete!"
	@echo "📂 Output files:"
	@ls -lh output/

# HTML形式をビルド
html: output
	@echo "🌐 Building HTML..."
	npm run build:html
	@echo "✅ HTML built: output/miyabi-pitch-deck.html"

# PDF形式をビルド
pdf: output
	@echo "📄 Building PDF..."
	npm run build:pdf
	@echo "✅ PDF built: output/miyabi-pitch-deck.pdf"

# PPTX形式をビルド
pptx: output
	@echo "📊 Building PPTX..."
	npm run build:pptx
	@echo "✅ PPTX built: output/miyabi-pitch-deck.pptx"

# Jony Iveテーマですべての形式をビルド
jony: output
	@echo "🎨 Building all formats (Jony Ive Theme)..."
	npm run build:jony
	@echo "✅ Jony Ive build complete!"
	@echo "📂 Output files:"
	@ls -lh output/*jony*

# Jony IveテーマでHTML形式をビルド
jony-html: output
	@echo "🌐 Building HTML (Jony Ive Theme)..."
	npm run build:jony:html
	@echo "✅ HTML built: output/miyabi-pitch-deck-jony.html"

# Jony IveテーマでPDF形式をビルド
jony-pdf: output
	@echo "📄 Building PDF (Jony Ive Theme)..."
	npm run build:jony:pdf
	@echo "✅ PDF built: output/miyabi-pitch-deck-jony.pdf"

# Jony IveテーマでPPTX形式をビルド
jony-pptx: output
	@echo "📊 Building PPTX (Jony Ive Theme)..."
	npm run build:jony:pptx
	@echo "✅ PPTX built: output/miyabi-pitch-deck-jony.pptx"

# すべて実行（オリジナル + Jony Ive）
all: install
	@echo "🏗️  Building both themes..."
	npm run build:all
	@echo "✅ All builds complete!"
	@echo "📂 Output files:"
	@ls -lh output/

# ファイル監視モード（Original）
watch:
	@echo "👀 Watching for changes (Original Theme)..."
	npm run watch

# ファイル監視モード（Jony Ive）
watch-jony:
	@echo "👀 Watching for changes (Jony Ive Theme)..."
	npm run watch:jony

# ブラウザでプレビュー（Original）
preview:
	@echo "🔍 Opening preview (Original Theme)..."
	npm run preview

# ブラウザでプレビュー（Jony Ive）
preview-jony:
	@echo "🔍 Opening preview (Jony Ive Theme)..."
	npm run preview:jony

# クリーンアップ
clean:
	@echo "🧹 Cleaning output directory..."
	npm run clean
	@echo "✅ Clean complete"
