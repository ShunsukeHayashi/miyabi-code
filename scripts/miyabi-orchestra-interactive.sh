#!/bin/bash
# 🎭 Miyabi Parallel Orchestra - Interactive Setup
# UI/UX最適化版 - 初心者でも3ステップで使える

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Symbols
CHECK="✓"
CROSS="✗"
ARROW="→"
STAR="★"

clear

cat << "EOF"
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║           🎭  Miyabi Parallel Orchestra  🎭                  ║
    ║                                                              ║
    ║         21のエージェントが奏でる雅なる並列実行                 ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ========================================
# Step 1: 環境チェック
# ========================================
echo -e "${BOLD}Step 1/3: 環境チェック${NC}"
echo ""

# tmux check
if [ -z "$TMUX" ]; then
    echo -e "  ${RED}${CROSS}${NC} tmux session not found"
    echo ""
    echo -e "${YELLOW}  ${ARROW} 解決方法:${NC}"
    echo -e "     ${CYAN}tmux${NC} を実行してから、このスクリプトを再実行してください"
    echo ""
    exit 1
else
    echo -e "  ${GREEN}${CHECK}${NC} tmux session detected"
fi

# Codex check
if ! command -v codex &> /dev/null; then
    echo -e "  ${RED}${CROSS}${NC} codex command not found"
    echo ""
    echo -e "${YELLOW}  ${ARROW} 解決方法:${NC}"
    echo -e "     Codex CLI をセットアップしてください（社内ドキュメント参照）"
    echo ""
    exit 1
else
    echo -e "  ${GREEN}${CHECK}${NC} Codex available"
fi

# Detect tmux prefix
PREFIX_KEY=$(tmux show-options -g prefix 2>/dev/null | awk '{print $2}')
if [[ "$PREFIX_KEY" == "C-a" ]]; then
    DISPLAY_PREFIX="Ctrl-a"
    echo -e "  ${GREEN}${CHECK}${NC} Kamui tmux detected (prefix: ${CYAN}Ctrl-a${NC})"
else
    DISPLAY_PREFIX="Ctrl-b"
    echo -e "  ${GREEN}${CHECK}${NC} Standard tmux (prefix: ${CYAN}Ctrl-b${NC})"
fi

echo ""
echo -e "${GREEN}  すべてのチェックに合格しました！${NC}"
echo ""

# ========================================
# Step 2: Ensemble選択（インタラクティブメニュー）
# ========================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}Step 2/3: Ensembleタイプを選択${NC}"
echo ""

# Menu display
echo -e "  ${MAGENTA}1)${NC} ${BOLD}Coding Ensemble${NC} ${CYAN}(推奨 - 初心者向け)${NC}"
echo -e "     ${ARROW} Conductor + 4 Coding Agents"
echo -e "     ${ARROW} 用途: Issue実装・バグ修正・リファクタリング"
echo -e "     ${ARROW} エージェント: カエデ・サクラ・ツバキ・ボタン"
echo ""

echo -e "  ${MAGENTA}2)${NC} ${BOLD}Hybrid Ensemble${NC} ${YELLOW}(上級者向け)${NC}"
echo -e "     ${ARROW} Conductor + 3 Coding + 3 Business Agents"
echo -e "     ${ARROW} 用途: 技術実装 + ビジネス戦略同時展開"
echo -e "     ${ARROW} エージェント: Coding 3名 + Business 3名"
echo ""

echo -e "  ${MAGENTA}3)${NC} ${BOLD}Quick Demo${NC} ${GREEN}(3分でお試し)${NC}"
echo -e "     ${ARROW} 最小構成で動作確認"
echo -e "     ${ARROW} Conductor + 1 Agent のみ"
echo ""

echo -e "  ${MAGENTA}q)${NC} 終了"
echo ""

while true; do
    echo -ne "${YELLOW}選択してください [1/2/3/q]: ${NC}"
    read -r choice

    case "$choice" in
        1)
            ENSEMBLE_TYPE="coding"
            ENSEMBLE_NAME="Coding Ensemble"
            NUM_AGENTS=4
            break
            ;;
        2)
            ENSEMBLE_TYPE="hybrid"
            ENSEMBLE_NAME="Hybrid Ensemble"
            NUM_AGENTS=6
            break
            ;;
        3)
            ENSEMBLE_TYPE="demo"
            ENSEMBLE_NAME="Quick Demo"
            NUM_AGENTS=1
            break
            ;;
        q|Q)
            echo ""
            echo -e "${YELLOW}終了しました${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}無効な選択です。1, 2, 3, または q を入力してください${NC}"
            ;;
    esac
done

echo ""
echo -e "${GREEN}${CHECK} ${ENSEMBLE_NAME} を選択しました${NC}"
echo ""

# ========================================
# Step 3: レイアウト作成
# ========================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}Step 3/3: Orchestra Stageを準備中...${NC}"
echo ""

# Create panes based on selection
case "$ENSEMBLE_TYPE" in
    coding)
        echo -e "  ${CYAN}${ARROW}${NC} 5つのpaneを作成中..."
        tmux split-window -h 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux select-pane -t 0 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux select-pane -t 2 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux select-layout tiled 2>/dev/null || true
        ;;
    hybrid)
        echo -e "  ${CYAN}${ARROW}${NC} 7つのpaneを作成中..."
        tmux split-window -h 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux select-pane -t 0 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux split-window -v 2>/dev/null || true
        tmux select-pane -t 0 2>/dev/null || true
        tmux select-layout tiled 2>/dev/null || true
        ;;
    demo)
        echo -e "  ${CYAN}${ARROW}${NC} 2つのpaneを作成中（Demo用）..."
        tmux split-window -h 2>/dev/null || true
        ;;
esac

sleep 1
echo -e "  ${GREEN}${CHECK}${NC} レイアウト作成完了"
echo ""

# Get current pane info
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
PANE_LIST=$(tmux list-panes -F "#{pane_index}:#{pane_id}")

# Display layout
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}🎭 Orchestra Stage Layout:${NC}"
echo ""

# Visual layout display
echo "$PANE_LIST" | while IFS=: read -r index id; do
    if [[ "$id" == "$CURRENT_PANE" ]]; then
        echo -e "  ${MAGENTA}★ Pane $index ($id)${NC} ${GREEN}← あなた (Conductor)${NC}"
    else
        AGENT_NUM=$((index))
        case "$AGENT_NUM" in
            1) AGENT_NAME="🎹 カエデ (CodeGen)" ;;
            2) AGENT_NAME="🎺 サクラ (Review)" ;;
            3) AGENT_NAME="🥁 ツバキ (PR)" ;;
            4) AGENT_NAME="🎷 ボタン (Deploy)" ;;
            5) AGENT_NAME="📊 Analytics" ;;
            6) AGENT_NAME="✍️  Content" ;;
            *) AGENT_NAME="🎭 Agent" ;;
        esac
        echo -e "  ${CYAN}  Pane $index ($id)${NC} - $AGENT_NAME"
    fi
done

echo ""

# ========================================
# Agent起動確認
# ========================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}🎼 Agentを起動しますか？${NC}"
echo ""
echo -e "  ${GREEN}y)${NC} はい - すべてのAgent paneでCodexを起動"
echo -e "  ${YELLOW}n)${NC} いいえ - 手動で起動する"
echo ""

while true; do
    echo -ne "${YELLOW}選択 [y/n]: ${NC}"
    read -r start_agents

    case "$start_agents" in
        y|Y)
            echo ""
            echo -e "${GREEN}${ARROW} Agentを起動中...${NC}"
            echo ""

            AGENT_CMD="codex"

            # Start agents
            AGENT_PANES=$(tmux list-panes -F "#{pane_id}" | grep -v "^$CURRENT_PANE$")
            AGENT_COUNT=0

            for pane_id in $AGENT_PANES; do
                AGENT_COUNT=$((AGENT_COUNT + 1))
                case "$AGENT_COUNT" in
                    1) AGENT_NAME="🎹 カエデ" ;;
                    2) AGENT_NAME="🎺 サクラ" ;;
                    3) AGENT_NAME="🥁 ツバキ" ;;
                    4) AGENT_NAME="🎷 ボタン" ;;
                    5) AGENT_NAME="📊 Analytics" ;;
                    6) AGENT_NAME="✍️  Content" ;;
                    *) AGENT_NAME="🎭 Agent $AGENT_COUNT" ;;
                esac

                echo -e "  ${CYAN}${ARROW}${NC} $AGENT_NAME を起動中... ($pane_id)"
                tmux send-keys -t "$pane_id" "cd $PROJECT_ROOT" C-m 2>/dev/null || true
                sleep 0.3
                tmux send-keys -t "$pane_id" "$AGENT_CMD" C-m 2>/dev/null || true
                sleep 0.8
            done

            echo ""
            echo -e "${GREEN}${CHECK} すべてのAgentが起動しました！${NC}"
            break
            ;;
        n|N)
            echo ""
            echo -e "${YELLOW}${ARROW} 手動起動を選択しました${NC}"
            echo ""
            echo -e "  各paneで以下のコマンドを実行してください:"
            echo -e "  ${CYAN}cd $PROJECT_ROOT && codex${NC}"
            break
            ;;
        *)
            echo -e "${RED}y または n を入力してください${NC}"
            ;;
    esac
done

# ========================================
# 完了・次のステップガイド
# ========================================
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}${BOLD}${CHECK} Miyabi Orchestra Setup完了！${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Quick Start Guide
cat << EOF
${BOLD}🎼 Conductor's Quick Guide${NC}

${YELLOW}【基本操作】${NC}
  ${DISPLAY_PREFIX} + 矢印キー  : pane移動
  ${DISPLAY_PREFIX} + q         : pane番号表示
  ${DISPLAY_PREFIX} + z         : paneフルスクリーン切替

${YELLOW}【Agent操作の型】${NC}

  ${GREEN}1) Agentにタスクを依頼する${NC}
     ${CYAN}tmux send-keys -t [pane_id] "指示内容" Enter${NC}

     例: カエデ（最初のAgent pane）にタスク
     ${CYAN}tmux send-keys -t %2 "Issue #270を実装してください" Enter${NC}

  ${GREEN}2) Agentの状態を確認する${NC}
     ${CYAN}tmux capture-pane -t [pane_id] -p | tail -10${NC}

  ${GREEN}3) Agentの記憶をリセットする${NC}
     ${CYAN}tmux send-keys -t [pane_id] "/clear" Enter${NC}

${YELLOW}【クイックスタートExample】${NC}

  # カエデ（Agent 1）にテストタスク
  $(echo "$PANE_LIST" | head -2 | tail -1 | while IFS=: read -r idx id; do
    echo "tmux send-keys -t $id \"あなたは「カエデ」です。自己紹介をして、tmux send-keys -t $CURRENT_PANE '[カエデ] 準備OK!' && sleep 0.5 && tmux send-keys -t $CURRENT_PANE Enter で報告してください\" Enter"
  done)

${YELLOW}【詳細ドキュメント】${NC}
  ${MAGENTA}.claude/MIYABI_PARALLEL_ORCHESTRA.md${NC} - 哲学とパターン
  ${CYAN}.claude/TMUX_OPERATIONS.md${NC}           - 技術詳細

${YELLOW}【トラブルシューティング】${NC}
  - Agentが反応しない → ${CYAN}$DISPLAY_PREFIX + [番号]${NC} で該当paneに移動して確認
  - pane IDが分からない → ${CYAN}tmux list-panes -F "#{pane_index}: #{pane_id}"${NC}
  - 最初からやり直す → ${CYAN}$DISPLAY_PREFIX + &${NC} でwindow終了 → 再実行

EOF

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${MAGENTA}${BOLD}🎭 Miyabi Orchestra - Where 21 Agents Dance in Harmony${NC}"
echo ""
