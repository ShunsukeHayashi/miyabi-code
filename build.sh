#!/bin/bash
set -e

echo "🚀 Starting Vercel build for Miyabi Docs..."

# Create public directory
mkdir -p public

# Copy root HTML files
echo "📄 Copying root HTML files..."
cp docs/*.html public/ 2>/dev/null || echo "No HTML files in docs root"

# Copy SEKAINOHAJIMARI landing pages
echo "🌸 Copying SEKAINOHAJIMARI landing pages..."
if [ -d "docs/landing-pages/sekai-no-hajimari" ]; then
  mkdir -p public/sekai
  cp docs/landing-pages/sekai-no-hajimari/index-ive.html public/sekai/index.html
  cp docs/landing-pages/sekai-no-hajimari/index.html public/sekai/original.html
  cp docs/landing-pages/sekai-no-hajimari/index-en.html public/sekai/en.html
  echo "✅ Landing pages copied: index.html (Ive), original.html, en.html"
fi

# Copy assets directory
echo "🎨 Copying assets..."
if [ -d "docs/assets" ]; then
  mkdir -p public/assets
  cp -r docs/assets/* public/assets/
fi

# Copy pitch-deck files (HTML only, excluding node_modules and large files)
echo "📊 Copying pitch deck..."
if [ -d "docs/pitch-deck" ]; then
  mkdir -p public/pitch-deck/output
  mkdir -p public/pitch-deck/themes

  # Copy HTML files from output directory
  if [ -d "docs/pitch-deck/output" ]; then
    cp docs/pitch-deck/output/*.html public/pitch-deck/output/ 2>/dev/null || echo "No HTML files in pitch-deck/output"
  fi

  # Copy themes directory
  if [ -d "docs/pitch-deck/themes" ]; then
    cp -r docs/pitch-deck/themes/* public/pitch-deck/themes/ 2>/dev/null || echo "No themes"
  fi

  # Copy assets directory (excluding node_modules)
  if [ -d "docs/pitch-deck/assets" ]; then
    mkdir -p public/pitch-deck/assets
    cp -r docs/pitch-deck/assets/* public/pitch-deck/assets/ 2>/dev/null || echo "No pitch-deck assets"
  fi
fi

# Show build summary
echo ""
echo "✅ Build complete!"
echo "📊 Build summary:"
du -sh public/
echo ""
echo "📁 Directory structure:"
find public -type f | head -20
