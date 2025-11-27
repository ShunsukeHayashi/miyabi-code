#!/bin/bash

echo "🌸 Miyabi Character Image Generation Setup"
echo "=========================================="

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY is not set!"
    echo ""
    echo "Please set your API key:"
    echo "export GEMINI_API_KEY='your-api-key-here'"
    exit 1
fi

echo "✅ GEMINI_API_KEY is set"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create output directories
echo ""
echo "📁 Creating directories..."
mkdir -p generated
mkdir -p descriptions

# Menu for model selection
echo ""
echo "🎨 Select generation model:"
echo "1) Gemini 2.5 Flash Image (Fast, 1024x1024)"
echo "2) Gemini 3 Pro Image Preview (High quality, up to 4K)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        MODEL="gemini-2.5-flash-image"
        echo "Selected: Gemini 2.5 Flash Image"
        ;;
    2)
        MODEL="gemini-3-pro-image-preview"
        echo "Selected: Gemini 3 Pro Image Preview"
        echo ""
        echo "Select resolution:"
        echo "1) 1K (1024x1024)"
        echo "2) 2K (2048x2048)"
        echo "3) 4K (4096x4096)"
        read -p "Enter choice (1-3): " res_choice
        case $res_choice in
            1) RESOLUTION="1K" ;;
            2) RESOLUTION="2K" ;;
            3) RESOLUTION="4K" ;;
            *) RESOLUTION="1K" ;;
        esac
        ;;
    *)
        echo "Invalid choice. Using default (Flash)"
        MODEL="gemini-2.5-flash-image"
        ;;
esac

# Confirm generation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ready to generate 24 character images"
echo "Model: $MODEL"
if [ "$MODEL" = "gemini-3-pro-image-preview" ]; then
    echo "Resolution: $RESOLUTION"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

# Run generation
echo ""
echo "🚀 Starting generation..."
if [ "$MODEL" = "gemini-3-pro-image-preview" ]; then
    MODEL=$MODEL RESOLUTION=$RESOLUTION node generate-all-characters.js
else
    MODEL=$MODEL node generate-all-characters.js
fi

# Open gallery if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✨ Generation complete!"
    echo ""
    echo "Would you like to open the gallery in your browser?"
    read -p "(y/n): " open_gallery
    if [ "$open_gallery" = "y" ]; then
        open gallery.html 2>/dev/null || xdg-open gallery.html 2>/dev/null || echo "Please open gallery.html manually"
    fi
fi