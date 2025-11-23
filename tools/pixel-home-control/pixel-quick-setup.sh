#!/data/data/com.termux/files/usr/bin/bash
# Pixel/Termux quick setup for home-screen control scripts

set -euo pipefail

echo "🔧 Installing base packages..."
pkg update -y
pkg install -y termux-api git wget

echo "📂 Creating scripts directory..."
TARGET_DIR="$HOME/.shortcuts/pixel-home-control"
mkdir -p "$TARGET_DIR"

echo "⬇️  Fetching latest scripts..."
REPO_DIR="$(pwd)"
cp "$REPO_DIR/tools/pixel-home-control/termux-home-screen-control.sh" "$TARGET_DIR/"

echo "✅ Setup complete."
echo "Next steps:"
echo "1) Long-press home screen -> Widgets -> Termux:Widget -> choose termux-home-screen-control.sh"
echo "2) Tap the widget to open default app (chrome)."
echo "3) Optional: edit $TARGET_DIR/termux-home-screen-control.sh to set APP_DEFAULT."
