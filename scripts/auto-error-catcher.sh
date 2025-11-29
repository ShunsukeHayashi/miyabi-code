#!/bin/bash
# ============================================
# 🚨 Miyabi Auto Error Catcher v2
# 馬鹿でもわかるエラー自動検出システム
# 重要なエラーだけをキャッチ
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

LOG_FILE="/tmp/miyabi-errors.log"
SUMMARY_FILE="/tmp/miyabi-error-summary.txt"

clear
echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🔍 Miyabi エラー自動検出システム      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

echo "=== エラーチェック $(date) ===" > "$SUMMARY_FILE"

ERROR_COUNT=0
WARNING_COUNT=0

# 1. MCP サーバー接続チェック
echo -e "${YELLOW}[1/6]${NC} 📡 MCP サーバーチェック..."
cd /home/ubuntu/miyabi-private
MCP_RESULT=$(claude mcp list 2>&1)
FAILED_MCP=$(echo "$MCP_RESULT" | grep -c "Failed to connect")
CONNECTED_MCP=$(echo "$MCP_RESULT" | grep -c "Connected")

# pixel-mcpとsse-gatewayは除外（正常）
REAL_FAILED=$((FAILED_MCP - 2))
if [ "$REAL_FAILED" -gt 0 ]; then
    echo -e "    ${RED}❌ $REAL_FAILED サーバー接続失敗${NC}"
    echo "❌ MCP: $REAL_FAILED サーバー接続失敗" >> "$SUMMARY_FILE"
    echo "$MCP_RESULT" | grep "Failed" | grep -v "pixel\|sse" >> "$SUMMARY_FILE"
    ((ERROR_COUNT++))
else
    echo -e "    ${GREEN}✅ $CONNECTED_MCP サーバー接続中${NC}"
fi

# 2. tmux セッションチェック
echo -e "${YELLOW}[2/6]${NC} 🖥️ tmux セッションチェック..."
TMUX_COUNT=$(tmux list-sessions 2>/dev/null | wc -l)
if [ "$TMUX_COUNT" -eq 0 ]; then
    echo -e "    ${RED}❌ セッションがありません！${NC}"
    echo "❌ tmux: セッションなし" >> "$SUMMARY_FILE"
    ((ERROR_COUNT++))
else
    echo -e "    ${GREEN}✅ $TMUX_COUNT セッション稼働中${NC}"
fi

# 3. ディスク容量チェック
echo -e "${YELLOW}[3/6]${NC} 💾 ディスク容量チェック..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "    ${RED}❌ 危険！${DISK_USAGE}% 使用中${NC}"
    echo "❌ ディスク: ${DISK_USAGE}% (90%超過)" >> "$SUMMARY_FILE"
    ((ERROR_COUNT++))
elif [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "    ${YELLOW}⚠️ ${DISK_USAGE}% 使用中（注意）${NC}"
    ((WARNING_COUNT++))
else
    echo -e "    ${GREEN}✅ ${DISK_USAGE}% 使用中${NC}"
fi

# 4. メモリチェック
echo -e "${YELLOW}[4/6]${NC} 🧠 メモリチェック..."
MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 95 ]; then
    echo -e "    ${RED}❌ 危険！${MEM_USAGE}% 使用中${NC}"
    echo "❌ メモリ: ${MEM_USAGE}% (95%超過)" >> "$SUMMARY_FILE"
    ((ERROR_COUNT++))
else
    echo -e "    ${GREEN}✅ ${MEM_USAGE}% 使用中${NC}"
fi

# 5. GitHub 認証チェック
echo -e "${YELLOW}[5/6]${NC} 🔑 GitHub 認証チェック..."
GH_STATUS=$(gh auth status 2>&1)
if echo "$GH_STATUS" | grep -qi "not logged in"; then
    echo -e "    ${RED}❌ 認証切れ！再ログインが必要${NC}"
    echo "❌ GitHub: 認証失敗" >> "$SUMMARY_FILE"
    ((ERROR_COUNT++))
else
    echo -e "    ${GREEN}✅ ログイン中${NC}"
fi

# 6. 重要なエラーログチェック
echo -e "${YELLOW}[6/6]${NC} 📋 エラーログチェック..."
CRITICAL_ERRORS=0
# 本当に重要なエラーだけチェック（kill, crash, panic）
for session in $(tmux list-sessions -F "#{session_name}" 2>/dev/null | head -5); do
    OUTPUT=$(tmux capture-pane -t "$session" -p 2>/dev/null | tail -20)
    if echo "$OUTPUT" | grep -qi "panic\|crash\|killed\|SIGKILL\|out of memory"; then
        echo -e "    ${RED}❌ $session で重大エラー検出${NC}"
        echo "❌ $session: 重大エラー" >> "$SUMMARY_FILE"
        ((CRITICAL_ERRORS++))
    fi
done
if [ "$CRITICAL_ERRORS" -eq 0 ]; then
    echo -e "    ${GREEN}✅ 重大エラーなし${NC}"
fi

# === 結果サマリー ===
echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}"
    echo "  ╔═══════════════════════════════════╗"
    echo "  ║  🎉 全チェック完了！問題なし！    ║"
    echo "  ╚═══════════════════════════════════╝"
    echo -e "${NC}"
    echo "✅ 全チェック完了 - エラーなし" >> "$SUMMARY_FILE"
else
    echo -e "${RED}"
    echo "  ╔═══════════════════════════════════╗"
    echo "  ║  🚨 $ERROR_COUNT 件のエラーを検出     ║"
    echo "  ╚═══════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${YELLOW}📋 修正が必要なもの:${NC}"
    grep "❌" "$SUMMARY_FILE" | while read line; do
        echo -e "   $line"
    done
    echo ""
    echo -e "${BLUE}💡 自動修復: miyabi-fix を実行${NC}"
fi

if [ "$WARNING_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️ $WARNING_COUNT 件の警告あり（今すぐ対応不要）${NC}"
fi

echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""

# ログ保存
cp "$SUMMARY_FILE" "$LOG_FILE"
