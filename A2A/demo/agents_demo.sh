#!/bin/bash
# Claude --agents デモスクリプト
# エージェント定義とマルチエージェント起動のデモ

CYAN='\033[1;36m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
BLUE='\033[1;34m'
MAGENTA='\033[1;35m'
RESET='\033[0m'

clear

cat << 'BANNER'

   █████╗ ██████╗  █████╗     ██████╗ ███████╗███╗   ███╗ ██████╗
  ██╔══██╗╚════██╗██╔══██╗    ██╔══██╗██╔════╝████╗ ████║██╔═══██╗
  ███████║ █████╔╝███████║    ██║  ██║█████╗  ██╔████╔██║██║   ██║
  ██╔══██║██╔═══╝ ██╔══██║    ██║  ██║██╔══╝  ██║╚██╔╝██║██║   ██║
  ██║  ██║███████╗██║  ██║    ██████╔╝███████╗██║ ╚═╝ ██║╚██████╔╝
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ╚═════╝ ╚══════╝╚═╝     ╚═╝ ╚═════╝

BANNER

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   Miyabi Multi-Agent System - Claude --agents Demo               ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "   Press ${GREEN}Enter${RESET} to continue each step..."
echo ""
read -r

# Step 1: エージェント一覧
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Step 1: 定義されたエージェント一覧${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${MAGENTA}🎯 shikiroon${RESET}  - Conductor (タスク分配・統括)"
echo -e "  ${GREEN}🍁 kaede${RESET}       - CodeGen (コード生成)"
echo -e "  ${GREEN}🌸 sakura${RESET}      - Review (コードレビュー)"
echo -e "  ${GREEN}🌺 tsubaki${RESET}     - PR (プルリクエスト管理)"
echo -e "  ${GREEN}🌼 botan${RESET}       - Deploy (デプロイ)"
echo -e "  ${GREEN}🔍 mitsukeroon${RESET} - Issue (Issue管理)"
echo ""
read -r

# Step 2: JSON構造
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Step 2: エージェント定義 (JSON)${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BLUE}  {${RESET}"
echo -e "${BLUE}    \"kaede\": {${RESET}"
echo -e "${BLUE}      \"description\": \"CodeGen - コード生成・機能実装\",${RESET}"
echo -e "${BLUE}      \"prompt\": \"あなたは楓、コード生成担当...\"${RESET}"
echo -e "${BLUE}    }${RESET}"
echo -e "${BLUE}  }${RESET}"
echo ""
read -r

# Step 3: 起動コマンド
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Step 3: マルチエージェント起動コマンド${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${GREEN}claude --agents \"\$(cat miyabi_agents_optimized.json)\"${RESET}"
echo ""
echo -e "  これで6つのエージェントが Task tool から呼び出し可能に！"
echo ""
read -r

# Step 4: 通信フロー図
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Step 4: A2A 通信フロー${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${CYAN}┌─────────────────────────────────────────────────────┐${RESET}"
echo -e "  ${CYAN}│              🎯 指揮論 (Conductor)                  │${RESET}"
echo -e "  ${CYAN}│         タスク割当 & 進捗レポート受信               │${RESET}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────┘${RESET}"
echo -e "                    │                    ▲"
echo -e "            ${YELLOW}タスク割当${RESET}              ${GREEN}PUSH報告${RESET}"
echo -e "                    ▼                    │"
echo -e "  ${CYAN}┌─────────────────────────────────────────────────────┐${RESET}"
echo -e "  ${CYAN}│   🍁楓 ──→ 🌸桜 ──→ 🌺椿 ──→ 🌼牡丹              │${RESET}"
echo -e "  ${CYAN}│  CodeGen   Review    PR     Deploy                 │${RESET}"
echo -e "  ${CYAN}└─────────────────────────────────────────────────────┘${RESET}"
echo ""
read -r

# Step 5: 実際の通信デモ
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${YELLOW}  Step 5: リアルタイム通信シミュレーション${RESET}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

sleep 0.5
echo -e "  ${YELLOW}[18:00:00] 📋 指揮論 → 楓${RESET}"
echo "             Issue #42: ログイン機能を実装してください"
echo ""
sleep 1

echo -e "  ${GREEN}[18:00:02] 🚀 楓 → 指揮論${RESET}"
echo "             開始: Issue #42 の実装を開始"
echo ""
sleep 1

echo -e "  ${BLUE}[18:00:30] 🔄 楓 → 指揮論${RESET}"
echo "             進捗: auth.ts 作成完了 (50%)"
echo ""
sleep 1

echo -e "  ${GREEN}[18:01:00] ✅ 楓 → 指揮論${RESET}"
echo "             完了: Issue #42 実装完了"
echo ""
sleep 0.5

echo -e "  ${YELLOW}[18:01:01] 📋 楓 → 桜${RESET}"
echo "             レビュー依頼: PR #100"
echo ""
sleep 1

echo -e "  ${GREEN}[18:01:30] ✅ 桜 → 指揮論${RESET}"
echo "             完了: LGTM! 🎉"
echo ""
sleep 0.5

echo -e "  ${YELLOW}[18:01:31] 📋 桜 → 椿${RESET}"
echo "             マージ依頼: PR #100"
echo ""
sleep 1

echo -e "  ${GREEN}[18:01:45] ✅ 椿 → 指揮論${RESET}"
echo "             完了: main にマージ完了"
echo ""
sleep 0.5

echo -e "  ${YELLOW}[18:01:46] 📋 椿 → 牡丹${RESET}"
echo "             デプロイ依頼: v1.2.0"
echo ""
sleep 1

echo -e "  ${MAGENTA}[18:02:00] ❓ 牡丹 → 指揮論${RESET}"
echo "             確認: 本番デプロイ準備完了。承認をお願いします"
echo ""
sleep 1

echo -e "  ${GREEN}[18:02:30] ✅ 牡丹 → 指揮論${RESET}"
echo "             完了: 本番デプロイ成功！ 🚀"
echo ""

echo ""
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${RESET}"
echo -e "${CYAN}   ✨ Issue #42 完了！ 全エージェントが連携して開発完了           ${RESET}"
echo -e "${CYAN}══════════════════════════════════════════════════════════════════${RESET}"
echo ""
