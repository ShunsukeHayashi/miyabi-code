#!/bin/bash
# =============================================================================
# Send Communication Instructions to All Agents
# =============================================================================
# 各エージェントに通信先ペインIDを含むInstructionを送信
# =============================================================================

SESSION="miyabi-deploy"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }

# =============================================================================
# ペインID取得
# =============================================================================
get_panes() {
    # mugen, majin, codex ウィンドウからペインを取得
    MUGEN_PANES=($(tmux list-panes -t $SESSION -a -F "#{window_name}|#{pane_id}" | grep "^mugen" | cut -d'|' -f2))
    MAJIN_PANES=($(tmux list-panes -t $SESSION -a -F "#{window_name}|#{pane_id}" | grep "^majin" | cut -d'|' -f2))
    CODEX_PANES=($(tmux list-panes -t $SESSION -a -F "#{window_name}|#{pane_id}" | grep "^codex" | cut -d'|' -f2))
}

# =============================================================================
# Instruction送信関数
# =============================================================================
send_instruction() {
    local pane_id=$1
    local role=$2
    local agent_id=$3
    local report_to=$4
    local team_members=$5

    local instruction="
# ═══════════════════════════════════════════════════════════════════
# COMMUNICATION PROTOCOL - Agent $agent_id ($role)
# ═══════════════════════════════════════════════════════════════════

あなたは **$role** です。Agent ID: **$agent_id**

## 通信先ペインID
- 報告先: **$report_to** (tmux send-keys -t \"$report_to\" \"message\" Enter)
${team_members:+- 配下メンバー: $team_members}

## メッセージ送信方法
\`\`\`bash
# 報告先に送信
tmux send-keys -t \"$report_to\" \"[$agent_id → 報告先]: TYPE | メッセージ\" Enter
\`\`\`

## 必須報告タイミング
- ACK: タスク受領時
- STATUS: 15分ごと or 50%完了時
- DONE: 完了時
- BLOCKED: 問題発生時
- HELP: 支援要請時

## 作業ログ出力
\`\`\`bash
echo \"[\$(date '+%H:%M:%S')] $agent_id: メッセージ\" >> /tmp/agent-$agent_id.log
\`\`\`

**待機中... タスクを受信したら ACK を送信してください**
# ═══════════════════════════════════════════════════════════════════
"

    # ペインにInstruction送信
    tmux send-keys -t "$pane_id" "$instruction" Enter
    sleep 0.3
    tmux send-keys -t "$pane_id" Enter
}

# =============================================================================
# Team A1 (Lambda) - Test Group
# =============================================================================
send_team_a1_instructions() {
    log_info "Sending instructions to Team A1 (Lambda Squad)..."

    # ペイン取得
    get_panes

    if [ ${#MUGEN_PANES[@]} -lt 7 ]; then
        log_info "Not enough MUGEN panes for Team A1"
        return
    fi

    # Team Lead A1 (Agent-002)
    local lead_pane=${MUGEN_PANES[0]}
    local worker_panes="${MUGEN_PANES[1]} ${MUGEN_PANES[2]} ${MUGEN_PANES[3]} ${MUGEN_PANES[4]} ${MUGEN_PANES[5]}"

    send_instruction "$lead_pane" "TEAM_LEAD_A1" "Agent-002" "GRAND_ORCHESTRATOR" "$worker_panes"
    log_success "Team Lead A1 (Agent-002) → $lead_pane"

    # Workers
    local worker_num=3
    for i in 1 2 3 4 5; do
        local worker_pane=${MUGEN_PANES[$i]}
        local agent_id=$(printf "Agent-%03d" $worker_num)
        send_instruction "$worker_pane" "WORKER" "$agent_id" "$lead_pane" ""
        log_success "$agent_id → $worker_pane (reports to $lead_pane)"
        ((worker_num++))
    done
}

# =============================================================================
# 簡易テスト: 3エージェントのみ
# =============================================================================
send_test_instructions() {
    log_info "Sending TEST instructions to 3 agents..."

    get_panes

    if [ ${#MUGEN_PANES[@]} -lt 3 ]; then
        log_info "Not enough panes"
        return
    fi

    local orchestrator_pane=${MUGEN_PANES[0]}
    local lead_pane=${MUGEN_PANES[1]}
    local worker_pane=${MUGEN_PANES[2]}

    echo ""
    log_info "Test Configuration:"
    echo "  Orchestrator: $orchestrator_pane"
    echo "  Team Lead:    $lead_pane (reports to $orchestrator_pane)"
    echo "  Worker:       $worker_pane (reports to $lead_pane)"
    echo ""

    # Orchestrator
    local orch_inst="
あなたは ORCHESTRATOR-A です。
報告を受けるペイン: $lead_pane (Team Lead)
Team Leadからの報告を待ち、集約してください。
報告フォーマット: [Agent-ID → Orchestrator]: TYPE | message
テストコマンド: tmux send-keys -t \"$lead_pane\" \"[Orchestrator → TeamLead]: TASK | Report status\" Enter
"
    tmux send-keys -t "$orchestrator_pane" "$orch_inst" Enter
    sleep 1
    tmux send-keys -t "$orchestrator_pane" Enter
    log_success "Orchestrator instruction sent to $orchestrator_pane"

    # Team Lead
    local lead_inst="
あなたは TEAM_LEAD_A1 です。
報告先: $orchestrator_pane (Orchestrator)
配下Worker: $worker_pane
Workerからの報告を集約し、Orchestratorへ報告してください。
報告送信: tmux send-keys -t \"$orchestrator_pane\" \"[TeamLead → Orchestrator]: STATUS | message\" Enter
Workerへの指示: tmux send-keys -t \"$worker_pane\" \"[TeamLead → Worker]: TASK | message\" Enter
"
    tmux send-keys -t "$lead_pane" "$lead_inst" Enter
    sleep 1
    tmux send-keys -t "$lead_pane" Enter
    log_success "Team Lead instruction sent to $lead_pane"

    # Worker
    local worker_inst="
あなたは WORKER (Agent-003) です。
報告先: $lead_pane (Team Lead)
タスクを受けたらACKを送信してください。
報告送信: tmux send-keys -t \"$lead_pane\" \"[Agent-003 → TeamLead]: ACK | Task received\" Enter
完了報告: tmux send-keys -t \"$lead_pane\" \"[Agent-003 → TeamLead]: DONE | Task completed\" Enter
"
    tmux send-keys -t "$worker_pane" "$worker_inst" Enter
    sleep 1
    tmux send-keys -t "$worker_pane" Enter
    log_success "Worker instruction sent to $worker_pane"

    echo ""
    log_success "Test instructions sent to 3 agents"
    echo ""
    echo "Pane IDs for manual verification:"
    echo "  Orchestrator: tmux select-pane -t $orchestrator_pane"
    echo "  Team Lead:    tmux select-pane -t $lead_pane"
    echo "  Worker:       tmux select-pane -t $worker_pane"
}

# =============================================================================
# Main
# =============================================================================
case "${1:-test}" in
    test)
        send_test_instructions
        ;;
    team-a1)
        send_team_a1_instructions
        ;;
    all)
        send_team_a1_instructions
        # TODO: Add other teams
        ;;
    *)
        echo "Usage: $0 [test|team-a1|all]"
        ;;
esac
