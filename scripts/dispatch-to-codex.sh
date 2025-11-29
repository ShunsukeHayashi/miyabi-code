#!/bin/bash
# ============================================
# 🎯 Dispatch Task to Codex Workers
# Coordinator → Codex Worker タスク配布
# ============================================

if [ -z "$1" ]; then
    echo "Usage: dispatch-to-codex <worker_id|all> <task>"
    echo ""
    echo "Examples:"
    echo "  dispatch-to-codex 001 'Fix bug in auth module'"
    echo "  dispatch-to-codex all 'Run tests'"
    echo "  dispatch-to-codex 001-010 'Implement feature X'"
    exit 1
fi

WORKER_TARGET=$1
TASK="${@:2}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎯 Dispatching task to Codex workers...${NC}"
echo -e "   Target: ${YELLOW}$WORKER_TARGET${NC}"
echo -e "   Task: $TASK"
echo ""

dispatch_to_worker() {
    local NUM=$1
    local TASK=$2
    local SESSION_NAME="codex-worker-$NUM"
    
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        tmux send-keys -t "$SESSION_NAME" "$TASK" Enter
        echo -e "  ${GREEN}✅${NC} agent-$NUM: Task dispatched"
        return 0
    else
        echo -e "  ${RED}❌${NC} agent-$NUM: Session not running"
        return 1
    fi
}

DISPATCHED=0

if [ "$WORKER_TARGET" == "all" ]; then
    # 全ワーカーに配布
    for i in $(seq 1 100); do
        NUM=$(printf "%03d" $i)
        if dispatch_to_worker "$NUM" "$TASK"; then
            ((DISPATCHED++))
        fi
    done
elif [[ "$WORKER_TARGET" == *"-"* ]]; then
    # 範囲指定 (例: 001-010)
    START=$(echo $WORKER_TARGET | cut -d'-' -f1 | sed 's/^0*//')
    END=$(echo $WORKER_TARGET | cut -d'-' -f2 | sed 's/^0*//')
    for i in $(seq $START $END); do
        NUM=$(printf "%03d" $i)
        if dispatch_to_worker "$NUM" "$TASK"; then
            ((DISPATCHED++))
        fi
    done
else
    # 単一ワーカー
    dispatch_to_worker "$WORKER_TARGET" "$TASK"
    DISPATCHED=$?
fi

echo ""
echo -e "${GREEN}🎉 Dispatched to $DISPATCHED workers${NC}"
