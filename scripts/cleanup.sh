#!/bin/bash
#==============================================================================
# MIYABI CLEANUP SCRIPT
# ディスク使用量を削減するためのクリーンアップスクリプト
#==============================================================================

set -e

MIYABI_ROOT="${MIYABI_ROOT:-/home/ubuntu/miyabi-private}"

echo "🧹 Miyabi Cleanup Script"
echo "========================"
echo ""

# 現在のディスク使用量
echo "📊 Current disk usage:"
df -h / | tail -1
echo ""

cd "$MIYABI_ROOT"

# DRY RUN モード
DRY_RUN=${1:-"--dry-run"}
if [ "$DRY_RUN" = "--execute" ]; then
    echo "⚠️  EXECUTE MODE - Files will be deleted!"
    echo ""
else
    echo "ℹ️  DRY RUN MODE - No files will be deleted"
    echo "   Run with --execute to actually delete files"
    echo ""
fi

# 削減予想サイズ
TOTAL_SIZE=0

# 1. Cargo target directory (release builds are large)
echo "1️⃣  Checking Cargo target directory..."
if [ -d "target" ]; then
    SIZE=$(du -sh target 2>/dev/null | cut -f1)
    echo "   target/: $SIZE"
    if [ "$DRY_RUN" = "--execute" ]; then
        echo "   Cleaning debug builds (keeping release)..."
        rm -rf target/debug
        cargo clean --release -p miyabi-mcp-server 2>/dev/null || true
    fi
fi
echo ""

# 2. Duplicate node_modules
echo "2️⃣  Checking node_modules directories..."
NODE_MODULES=$(find . -name "node_modules" -type d -prune 2>/dev/null | head -20)
for dir in $NODE_MODULES; do
    SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
    echo "   $dir: $SIZE"
done
if [ "$DRY_RUN" = "--execute" ]; then
    echo "   Cleaning non-essential node_modules..."
    # Keep only essential ones
    find . -path "./crates/miyabi-console/node_modules" -prune -o \
           -path "./mcp-servers/*/node_modules" -prune -o \
           -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
fi
echo ""

# 3. Log files
echo "3️⃣  Checking log files..."
LOG_SIZE=$(find . -name "*.log" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
echo "   Total log files: $LOG_SIZE"
if [ "$DRY_RUN" = "--execute" ]; then
    echo "   Removing old logs (keeping last 7 days)..."
    find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
fi
echo ""

# 4. Temporary files
echo "4️⃣  Checking temporary files..."
TEMP_PATTERNS=("*.tmp" "*.swp" "*.swo" ".DS_Store" "Thumbs.db" "*~")
for pattern in "${TEMP_PATTERNS[@]}"; do
    COUNT=$(find . -name "$pattern" -type f 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        echo "   $pattern: $COUNT files"
        if [ "$DRY_RUN" = "--execute" ]; then
            find . -name "$pattern" -type f -delete 2>/dev/null || true
        fi
    fi
done
echo ""

# 5. Old backup files
echo "5️⃣  Checking backup files..."
BACKUP_SIZE=$(find . -name "*.bak" -o -name "*.backup" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
echo "   Backup files: ${BACKUP_SIZE:-0}"
if [ "$DRY_RUN" = "--execute" ]; then
    find . \( -name "*.bak" -o -name "*.backup" \) -type f -mtime +30 -delete 2>/dev/null || true
fi
echo ""

# 6. npm/yarn cache
echo "6️⃣  Checking npm cache..."
if [ -d "$HOME/.npm" ]; then
    NPM_CACHE=$(du -sh "$HOME/.npm" 2>/dev/null | cut -f1)
    echo "   npm cache: $NPM_CACHE"
    if [ "$DRY_RUN" = "--execute" ]; then
        npm cache clean --force 2>/dev/null || true
    fi
fi
echo ""

# 7. Git objects
echo "7️⃣  Optimizing Git repository..."
if [ "$DRY_RUN" = "--execute" ]; then
    echo "   Running git gc..."
    git gc --prune=now 2>/dev/null || true
    git remote prune origin 2>/dev/null || true
fi
echo ""

# 最終ディスク使用量
if [ "$DRY_RUN" = "--execute" ]; then
    echo ""
    echo "📊 Final disk usage:"
    df -h / | tail -1
fi

echo ""
echo "✅ Cleanup analysis complete!"
if [ "$DRY_RUN" != "--execute" ]; then
    echo ""
    echo "To actually clean up, run:"
    echo "  bash scripts/cleanup.sh --execute"
fi
