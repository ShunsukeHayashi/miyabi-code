#!/usr/bin/env bash
# 🎭 Miyabi Full Orchestra - 21 Agents Full Power Parallel Execution
# 21エージェントをフルパワーでパラレル実行

set -euo pipefail

VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIYABI_ROOT="$(dirname "$SCRIPT_DIR")"

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

# Symbols
CHECK="✓"
CROSS="✗"
STAR="★"
ROCKET="🚀"

clear

cat << "EOF"
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║         🎭  Miyabi Full Orchestra - 21 Agents  🎭            ║
    ║                                                              ║
    ║              フルパワーでパラレル実行！                         ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

#=============================================================================
# Environment Check
#=============================================================================
echo -e "${BOLD}Step 1/4: 環境チェック${RESET}"
echo ""

# tmux check
if [ -z "$TMUX" ]; then
    echo -e "  ${RED}${CROSS}${NC} tmux session not found"
    echo ""
    echo -e "${YELLOW}  → 解決方法:${RESET}"
    echo -e "     ${CYAN}tmux${RESET} を実行してから、このスクリプトを再実行してください"
    echo ""
    exit 1
else
    echo -e "  ${GREEN}${CHECK}${RESET} tmux session detected"
fi

# Claude Code check
if ! command -v cc &> /dev/null && ! command -v claude &> /dev/null; then
    echo -e "  ${RED}${CROSS}${RESET} claude command not found"
    echo ""
    echo -e "${YELLOW}  → 解決方法:${RESET}"
    echo -e "     https://claude.com/claude-code からインストール"
    echo ""
    exit 1
else
    echo -e "  ${GREEN}${CHECK}${RESET} Claude Code available"
fi

# Detect Claude Code command
CC_CMD="cc"
if ! command -v cc &> /dev/null; then
    CC_CMD="claude"
fi

echo ""
echo -e "${GREEN}  すべてのチェックに合格しました！${RESET}"
echo ""

#=============================================================================
# 21-Agent Configuration
#=============================================================================

# Agent definitions: name|type|color|emoji
AGENTS=(
    # Row 1: Coding Team (7 agents)
    "しきるん|Coordinator|blue|🔴"
    "つくるん|CodeGen|green|🟢"
    "めだまん|Review|yellow|🔵"
    "みつけるん|Issue|cyan|🔵"
    "まとめるん|PR|magenta|🟡"
    "はこぶん|Deployment|red|🟡"
    "つなぐん|Refresher|white|🟡"
    # Row 2: Business Team Part 1 (7 agents)
    "あきんどさん|AIEntrepreneur|blue|🔴"
    "つくろん|ProductConcept|green|🟢"
    "かくん|ProductDesign|green|🟢"
    "みちびきん|FunnelDesign|green|🟢"
    "なりきりん|Persona|cyan|🔵"
    "じぶんさん|SelfAnalysis|cyan|🔵"
    "しらべるん|MarketResearch|cyan|🔵"
    # Row 3: Business Team Part 2 (7 agents)
    "ひろめるん|Marketing|green|🟢"
    "かくちゃん|ContentCreation|green|🟢"
    "つぶやきん|SNSStrategy|green|🟢"
    "どうがん|YouTube|green|🟢"
    "うるん|Sales|green|🟢"
    "おきゃくさま|CRM|green|🟢"
    "かぞえるん|Analytics|cyan|🔵"
)

#=============================================================================
# Create 3x7 Grid Layout (21 panes)
#=============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}Step 2/4: 3x7 グリッドレイアウト作成（21 panes）${RESET}"
echo ""

# Get current session and window
SESSION=$(tmux display-message -p '#S')
WINDOW=$(tmux display-message -p '#I')

echo -e "  ${CYAN}${ROCKET}${RESET} Creating 21-pane grid layout..."
echo ""

# Kill existing panes except first
for i in {2..30}; do
    tmux kill-pane -t "${SESSION}:${WINDOW}.${i}" 2>/dev/null || true
done

# Create 7 columns (horizontal splits)
for i in {1..6}; do
    tmux split-window -t "${SESSION}:${WINDOW}" -h
done

# Balance columns
tmux select-layout -t "${SESSION}:${WINDOW}" even-horizontal

# Split each column into 3 rows (vertical splits)
for col in {1..7}; do
    # Split into 3 rows
    tmux split-window -t "${SESSION}:${WINDOW}.${col}" -v
    tmux split-window -t "${SESSION}:${WINDOW}.$((col * 2))" -v
done

# Final tiled layout
tmux select-layout -t "${SESSION}:${WINDOW}" tiled

echo -e "  ${GREEN}${CHECK}${RESET} 21-pane grid created successfully"
echo ""

# Get all pane IDs
PANE_IDS=($(tmux list-panes -t "${SESSION}:${WINDOW}" -F '#{pane_id}'))

if [ ${#PANE_IDS[@]} -ne 21 ]; then
    echo -e "  ${RED}${CROSS}${RESET} Expected 21 panes, got ${#PANE_IDS[@]}"
    exit 1
fi

echo -e "  ${GREEN}${CHECK}${RESET} Verified: 21 panes ready"
echo ""

#=============================================================================
# Initialize All 21 Agents
#=============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}Step 3/4: 21エージェント初期化${RESET}"
echo ""

for i in {0..20}; do
    PANE_ID="${PANE_IDS[$i]}"
    AGENT_INFO="${AGENTS[$i]}"

    IFS='|' read -r NAME TYPE COLOR EMOJI <<< "$AGENT_INFO"

    echo -e "  ${EMOJI} Initializing ${BOLD}${NAME}${RESET} (${TYPE}Agent) in ${PANE_ID}..."

    # Set pane border color
    tmux set -p -t "$PANE_ID" pane-border-style "fg=${COLOR}"
    tmux set -p -t "$PANE_ID" pane-active-border-style "fg=${COLOR},bold"

    # Start Claude Code
    tmux send-keys -t "$PANE_ID" "cd '${MIYABI_ROOT}'" C-m
    sleep 0.3
    tmux send-keys -t "$PANE_ID" "${CC_CMD}" C-m
    sleep 1.5

    # Send agent role assignment
    ROLE_MESSAGE="あなたは「${NAME}」です。Miyabi ${TYPE}Agent として活動してください。準備完了したら [${NAME}] 準備完了 と発言してください。"

    tmux send-keys -t "$PANE_ID" "${ROLE_MESSAGE}" && sleep 0.5 && tmux send-keys -t "$PANE_ID" Enter

    sleep 0.3
done

echo ""
echo -e "  ${GREEN}${CHECK}${RESET} All 21 agents initialized"
echo ""

#=============================================================================
# Display Agent Map
#=============================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}Step 4/4: エージェントマップ${RESET}"
echo ""

cat << "EOF"
┌─────────────────────────────────────────────────────────────────┐
│                    🎭 21-Agent Orchestra Map                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【Row 1: Coding Team】                                         │
│  🔴しきるん 🟢つくるん 🔵めだまん 🔵みつけるん                  │
│  🟡まとめるん 🟡はこぶん 🟡つなぐん                             │
│                                                                 │
│  【Row 2: Business Team Part 1】                                │
│  🔴あきんどさん 🟢つくろん 🟢かくん 🟢みちびきん                │
│  🔵なりきりん 🔵じぶんさん 🔵しらべるん                        │
│                                                                 │
│  【Row 3: Business Team Part 2】                                │
│  🟢ひろめるん 🟢かくちゃん 🟢つぶやきん 🟢どうがん              │
│  🟢うるん 🟢おきゃくさま 🔵かぞえるん                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
EOF

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${GREEN}${BOLD}🎉 Full Orchestra Ready!${RESET}"
echo ""
echo -e "${YELLOW}使い方:${RESET}"
echo -e "  ${CYAN}Ctrl-b + Arrow Keys${RESET}    - Navigate between panes"
echo -e "  ${CYAN}Ctrl-b + z${RESET}             - Zoom/unzoom current pane"
echo -e "  ${CYAN}Ctrl-b + q${RESET}             - Show pane numbers"
echo -e "  ${CYAN}Ctrl-b + d${RESET}             - Detach from session"
echo ""
echo -e "${YELLOW}推奨ワークフロー:${RESET}"
echo -e "  1. 各エージェントが準備完了するまで待つ（1-2分）"
echo -e "  2. 「しきるん」（左上）にタスクを指示"
echo -e "  3. 他のエージェントが自動的に連携して処理"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
