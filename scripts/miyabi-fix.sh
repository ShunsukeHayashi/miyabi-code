#!/bin/bash
# ============================================
# 🔧 Miyabi Auto Fix
# エラーを自動で直すスクリプト
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Miyabi 自動修復を開始...${NC}"
echo ""

FIXED=0

# 1. MCP サーバーパス修正
echo -e "${YELLOW}📡 MCP設定を修正中...${NC}"
MCP_FILE="/home/ubuntu/miyabi-private/.mcp.json"
if [ -f "$MCP_FILE" ]; then
    if grep -q "termux" "$MCP_FILE"; then
        sed -i 's|/data/data/com.termux/files/home/Dev/miyabi-private|/home/ubuntu/miyabi-private|g' "$MCP_FILE"
        echo -e "${GREEN}  ✅ .mcp.json のパス修正完了${NC}"
        ((FIXED++))
    else
        echo -e "${GREEN}  ✅ .mcp.json は既に正しい${NC}"
    fi
fi

# 2. MCPサーバービルド
echo -e "\n${YELLOW}📦 MCPサーバーをビルド中...${NC}"
for dir in /home/ubuntu/miyabi-private/mcp-servers/miyabi-*/; do
    if [ -f "$dir/package.json" ] && [ ! -d "$dir/dist" ]; then
        NAME=$(basename "$dir")
        echo -e "  Building $NAME..."
        cd "$dir" && npm install --silent && npm run build 2>/dev/null
        ((FIXED++))
    fi
done
echo -e "${GREEN}  ✅ MCPビルド確認完了${NC}"

# 3. Claude Code 設定修正
echo -e "\n${YELLOW}⚙️ Claude Code設定を修正中...${NC}"
CONFIG_FILE="$HOME/.config/claude/claude_code_config.json"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "/Users/shunsuke" "$CONFIG_FILE"; then
        sed -i 's|/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private|/home/ubuntu/miyabi-private|g' "$CONFIG_FILE"
        echo -e "${GREEN}  ✅ claude_code_config.json 修正完了${NC}"
        ((FIXED++))
    else
        echo -e "${GREEN}  ✅ 設定は既に正しい${NC}"
    fi
fi

# 4. GitHub認証リフレッシュ
echo -e "\n${YELLOW}🔑 GitHub認証を確認中...${NC}"
GH_STATUS=$(gh auth status 2>&1)
if echo "$GH_STATUS" | grep -qi "Logged in"; then
    echo -e "${GREEN}  ✅ GitHub認証OK${NC}"
else
    echo -e "${RED}  ⚠️ GitHub再認証が必要です${NC}"
    echo -e "${BLUE}  実行: gh auth login${NC}"
fi

# 5. node_modules確認
echo -e "\n${YELLOW}📦 依存関係を確認中...${NC}"
cd /home/ubuntu/miyabi-private
if [ ! -d "node_modules" ]; then
    echo -e "  npm install 実行中..."
    npm install --silent
    echo -e "${GREEN}  ✅ npm install 完了${NC}"
    ((FIXED++))
else
    echo -e "${GREEN}  ✅ node_modules 存在${NC}"
fi

# 6. ディスククリーンアップ
echo -e "\n${YELLOW}🗑️ キャッシュクリーンアップ中...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    # npm cache clean
    npm cache clean --force 2>/dev/null
    # 古いログ削除
    find /tmp -name "*.log" -mtime +7 -delete 2>/dev/null
    find ~/.claude/debug -mtime +3 -delete 2>/dev/null
    echo -e "${GREEN}  ✅ キャッシュクリア完了${NC}"
    ((FIXED++))
else
    echo -e "${GREEN}  ✅ ディスク容量OK (${DISK_USAGE}%)${NC}"
fi

# 結果
echo ""
echo "============================================"
echo -e "${GREEN}🎉 自動修復完了！${NC}"
echo -e "   修復した項目: ${FIXED} 件"
echo ""
echo -e "${BLUE}📋 次のステップ:${NC}"
echo -e "   1. miyabi-check でエラーチェック"
echo -e "   2. claude mcp list で接続確認"
echo "============================================"
