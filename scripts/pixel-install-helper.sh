#!/data/data/com.termux/files/usr/bin/bash
# Miyabi Codex & Orchestra - Pixel Installation Helper
# Run this script ON THE PIXEL DEVICE in Termux
#
# Installation steps:
# 1. On Mac: adb push scripts/pixel-install-helper.sh /sdcard/
# 2. On Pixel Termux: termux-setup-storage (grant permission)
# 3. On Pixel Termux: cp ~/storage/shared/pixel-install-helper.sh ~/ && chmod +x ~/pixel-install-helper.sh && ~/pixel-install-helper.sh

set -e

echo "🌸 Miyabi Codex & Orchestra - Pixel Installation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Setup storage access
echo "📁 Step 1: Setting up storage access..."
if [ ! -d ~/storage ]; then
    echo "⚠️  Storage not setup. Please run: termux-setup-storage"
    echo "   Then grant permissions and re-run this script."
    exit 1
fi

echo "✅ Storage access configured"
echo ""

# Step 2: Create directories
echo "📂 Step 2: Creating directories..."
mkdir -p ~/.config/miyabi
mkdir -p ~/miyabi-private/scripts

echo "✅ Directories created"
echo ""

# Step 3: Copy configuration files from sdcard
echo "📋 Step 3: Copying configuration files..."

if [ -f ~/storage/shared/codex-config.yaml ]; then
    cp ~/storage/shared/codex-config.yaml ~/.config/miyabi/
    echo "   ✅ Codex config copied"
else
    echo "   ⚠️  codex-config.yaml not found on sdcard"
fi

if [ -f ~/storage/shared/orchestra-start.sh ]; then
    cp ~/storage/shared/orchestra-start.sh ~/miyabi-private/scripts/
    chmod +x ~/miyabi-private/scripts/orchestra-start.sh
    echo "   ✅ Orchestra script copied"
else
    echo "   ⚠️  orchestra-start.sh not found on sdcard"
fi

if [ -f ~/storage/shared/codex-trigger.sh ]; then
    cp ~/storage/shared/codex-trigger.sh ~/miyabi-private/scripts/
    chmod +x ~/miyabi-private/scripts/codex-trigger.sh
    echo "   ✅ Codex trigger copied"
else
    echo "   ⚠️  codex-trigger.sh not found on sdcard"
fi

if [ -f ~/storage/shared/pixel-bashrc-additions.sh ]; then
    if ! grep -q "Miyabi Orchestra" ~/.bashrc 2>/dev/null; then
        cat ~/storage/shared/pixel-bashrc-additions.sh >> ~/.bashrc
        echo "   ✅ .bashrc updated"
    else
        echo "   ⚠️  .bashrc already configured"
    fi
else
    echo "   ⚠️  pixel-bashrc-additions.sh not found on sdcard"
fi

echo ""

# Step 4: Verify installation
echo "🧪 Step 4: Verifying installation..."

if [ -f ~/.config/miyabi/codex-config.yaml ]; then
    echo "   ✅ Codex config: Installed"
else
    echo "   ❌ Codex config: Not found"
fi

if [ -x ~/miyabi-private/scripts/orchestra-start.sh ]; then
    echo "   ✅ Orchestra script: Installed"
else
    echo "   ❌ Orchestra script: Not found or not executable"
fi

if [ -x ~/miyabi-private/scripts/codex-trigger.sh ]; then
    echo "   ✅ Codex trigger: Installed"
else
    echo "   ❌ Codex trigger: Not found or not executable"
fi

if grep -q "Miyabi Orchestra" ~/.bashrc 2>/dev/null; then
    echo "   ✅ .bashrc: Configured"
else
    echo "   ❌ .bashrc: Not configured"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Installation complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Reload .bashrc: source ~/.bashrc"
echo "2. Test status: miyabi-status"
echo "3. Start Orchestra: orchestra"
echo "4. Attach to session: ms"
echo ""
