#!/bin/bash
# Miyabi Orchestra Real-time Monitoring Dashboard
# Web UI最適化版

SESSION="miyabi-orchestra"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# カラーコード（Web UI表示用）
RESET='\033[0m'
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'

# セッション存在確認
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "❌ セッション '$SESSION' が見つかりません"
    exit 1
fi

# クリア
clear

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                 🎭 Miyabi Orchestra - リアルタイムモニター                  ║"
echo "║                        Last Update: $TIMESTAMP                        ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# セクション1: オーケストレーター状態
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  📊 ORCHESTRATOR STATUS                                                  ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

TOTAL_PANES=$(tmux list-panes -t "$SESSION:0" | wc -l)
ACTIVE_AGENTS=$((TOTAL_PANES - 1))

printf "  %-25s : %s\n" "Session Name" "$SESSION"
printf "  %-25s : %d panes\n" "Total Panes" "$TOTAL_PANES"
printf "  %-25s : %d agents\n" "Active Agents" "$ACTIVE_AGENTS"
printf "  %-25s : ✅ RUNNING\n" "Orchestrator Status"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# セクション2: 各Agentの詳細状態
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  🤖 AGENT STATUS & TASK ASSIGNMENT                                       ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

printf "%-8s %-15s %-12s %-15s %-30s\n" "PANE" "AGENT" "ROLE" "STATUS" "LAST OUTPUT"
echo "────────────────────────────────────────────────────────────────────────────────"

# Pane 0: Conductor
LAST_OUTPUT=$(tmux capture-pane -t "$SESSION:0.0" -p | tail -1 | cut -c1-28)
if [[ -z "$LAST_OUTPUT" ]]; then
    LAST_OUTPUT="(empty)"
fi
printf "%-8s %-15s %-12s %-15s %-30s\n" "0" "Conductor" "Orchestrate" "🟢 READY" "$LAST_OUTPUT"

# Pane 1: カエデ (CodeGen)
LAST_OUTPUT=$(tmux capture-pane -t "$SESSION:0.1" -p | tail -1 | cut -c1-28)
if [[ -z "$LAST_OUTPUT" ]]; then
    LAST_OUTPUT="(empty)"
fi
# ステータス判定
if echo "$LAST_OUTPUT" | grep -q "root@"; then
    STATUS="🟢 IDLE"
elif echo "$LAST_OUTPUT" | grep -q "カエデ"; then
    STATUS="🟡 ACTIVE"
else
    STATUS="🔵 WORKING"
fi
printf "%-8s %-15s %-12s %-15s %-30s\n" "1" "カエデ" "CodeGen" "$STATUS" "$LAST_OUTPUT"

# Pane 2: サクラ (Review)
LAST_OUTPUT=$(tmux capture-pane -t "$SESSION:0.2" -p | tail -1 | cut -c1-28)
if [[ -z "$LAST_OUTPUT" ]]; then
    LAST_OUTPUT="(empty)"
fi
if echo "$LAST_OUTPUT" | grep -q "root@"; then
    STATUS="🟢 IDLE"
elif echo "$LAST_OUTPUT" | grep -q "サクラ"; then
    STATUS="🟡 ACTIVE"
else
    STATUS="🔵 WORKING"
fi
printf "%-8s %-15s %-12s %-15s %-30s\n" "2" "サクラ" "Review" "$STATUS" "$LAST_OUTPUT"

# Pane 3: ツバキ (PR)
LAST_OUTPUT=$(tmux capture-pane -t "$SESSION:0.3" -p | tail -1 | cut -c1-28)
if [[ -z "$LAST_OUTPUT" ]]; then
    LAST_OUTPUT="(empty)"
fi
if echo "$LAST_OUTPUT" | grep -q "root@"; then
    STATUS="🟢 IDLE"
elif echo "$LAST_OUTPUT" | grep -q "ツバキ"; then
    STATUS="🟡 ACTIVE"
else
    STATUS="🔵 WORKING"
fi
printf "%-8s %-15s %-12s %-15s %-30s\n" "3" "ツバキ" "PR" "$STATUS" "$LAST_OUTPUT"

# Pane 4: ボタン (Deployment)
LAST_OUTPUT=$(tmux capture-pane -t "$SESSION:0.4" -p | tail -1 | cut -c1-28)
if [[ -z "$LAST_OUTPUT" ]]; then
    LAST_OUTPUT="(empty)"
fi
if echo "$LAST_OUTPUT" | grep -q "root@"; then
    STATUS="🟢 IDLE"
elif echo "$LAST_OUTPUT" | grep -q "ボタン"; then
    STATUS="🟡 ACTIVE"
else
    STATUS="🔵 WORKING"
fi
printf "%-8s %-15s %-12s %-15s %-30s\n" "4" "ボタン" "Deployment" "$STATUS" "$LAST_OUTPUT"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# セクション3: タスクアサイン状況
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  📋 CURRENT TASK ASSIGNMENTS                                             ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

printf "%-15s %-60s\n" "AGENT" "ASSIGNED TASK"
echo "────────────────────────────────────────────────────────────────────────────────"

# 各Agentの最新コマンド履歴から判定（簡易版）
for pane in 1 2 3 4; do
    AGENT_NAME=""
    case $pane in
        1) AGENT_NAME="カエデ" ;;
        2) AGENT_NAME="サクラ" ;;
        3) AGENT_NAME="ツバキ" ;;
        4) AGENT_NAME="ボタン" ;;
    esac

    # 最新の出力からタスクを推測
    RECENT_OUTPUT=$(tmux capture-pane -t "$SESSION:0.$pane" -p | grep -v "^root@" | grep -v "^$" | tail -3 | head -1 | cut -c1-58)

    if [[ -z "$RECENT_OUTPUT" ]]; then
        RECENT_OUTPUT="⏸ Waiting for task assignment"
    fi

    printf "%-15s %-60s\n" "$AGENT_NAME" "$RECENT_OUTPUT"
done

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# セクション4: 稼働率メトリクス
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  📈 AGENT UTILIZATION METRICS                                            ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# 簡易的な稼働率（プロンプトが表示されているかで判定）
IDLE_COUNT=0
ACTIVE_COUNT=0

for pane in 1 2 3 4; do
    LAST_LINE=$(tmux capture-pane -t "$SESSION:0.$pane" -p | tail -1)
    if echo "$LAST_LINE" | grep -q "root@.*#"; then
        ((IDLE_COUNT++))
    else
        ((ACTIVE_COUNT++))
    fi
done

TOTAL_AGENTS=4
UTILIZATION=$((ACTIVE_COUNT * 100 / TOTAL_AGENTS))

printf "  %-25s : %d / %d\n" "Idle Agents" "$IDLE_COUNT" "$TOTAL_AGENTS"
printf "  %-25s : %d / %d\n" "Active Agents" "$ACTIVE_COUNT" "$TOTAL_AGENTS"
printf "  %-25s : %d%%\n" "Overall Utilization" "$UTILIZATION"

# プログレスバー
echo ""
echo -n "  Utilization: ["
FILLED=$((UTILIZATION / 5))
for ((i=0; i<20; i++)); do
    if [ $i -lt $FILLED ]; then
        echo -n "█"
    else
        echo -n "░"
    fi
done
echo "] $UTILIZATION%"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# セクション5: 通信ログ（最新5件）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo "┃  💬 RECENT COMMUNICATION LOG (Last 5 outputs per agent)                  ┃"
echo "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

for pane in 1 2 3 4; do
    AGENT_NAME=""
    case $pane in
        1) AGENT_NAME="カエデ (CodeGen)" ;;
        2) AGENT_NAME="サクラ (Review)" ;;
        3) AGENT_NAME="ツバキ (PR)" ;;
        4) AGENT_NAME="ボタン (Deployment)" ;;
    esac

    echo "  ┌─ Pane $pane: $AGENT_NAME"
    tmux capture-pane -t "$SESSION:0.$pane" -p | tail -5 | while read -r line; do
        # 空行スキップ
        if [[ -n "$line" ]]; then
            printf "  │  %s\n" "${line:0:70}"
        fi
    done
    echo "  └─"
    echo ""
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# フッター
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║  💡 COMMANDS                                                               ║"
echo "║  - リアルタイム監視: watch -n 2 ./scripts/miyabi-monitor.sh               ║"
echo "║  - セッション接続: tmux attach -t miyabi-orchestra                         ║"
echo "║  - 詳細ログ確認: ./scripts/miyabi-monitor.sh --detailed                   ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
