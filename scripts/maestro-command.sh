#!/bin/bash
# =============================================================================
# MAESTRO COMMAND CENTER - 172 Agent Orchestra Control
# =============================================================================
# Grand Maestro として全オーケストラを指揮
# Usage: ./maestro-command.sh [init|status|task|broadcast]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="miyabi-deploy"
LOG_DIR="/tmp/miyabi-maestro"
mkdir -p "$LOG_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Orchestra Pane IDs
ORCH_A="%648"
ORCH_B="%649"
ORCH_C="%650"

log_maestro() { echo -e "${MAGENTA}[MAESTRO]${NC} $1"; }
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }

# =============================================================================
# Team Configuration (Based on pane mapping)
# =============================================================================
# Orchestra A (Infrastructure): mugen-001-050 → %526-%565
# Team A1 (Lambda): %526 (Lead), %527-%531 (Workers)
# Team A2 (AWS): %532 (Lead), %533-%541 (Workers)
# Team A3 (Database): %542 (Lead), %543-%549 (Workers)
# Team A4 (Security): %550 (Lead), %551-%557 (Workers)
# Team A5 (Reserve): %558 (Lead), %559-%565 (Workers)

# Orchestra B (Development): majin-051-080 → %566-%589
# Team B1 (Backend): %566 (Lead), %567-%573 (Workers)
# Team B2 (Frontend): %574 (Lead), %575-%581 (Workers)
# Team B3 (Database): %582 (Lead), %583-%589 (Workers)

# Orchestra C (Business): majin-081-100 + codex → %590-%646
# Team C1 (Demo): %590 (Lead), %591-%597 (Workers)
# Team C2 (Docs): %598 (Lead), %599-%605 (Workers)
# Team C3-C5 (Codex): %607-%646 (Workers)

# =============================================================================
# Initialize All Orchestras with Communication Protocol
# =============================================================================
init_orchestras() {
    log_maestro "Initializing all 3 Orchestras..."

    # Orchestra A - Infrastructure
    local orch_a_msg="
# ═══════════════════════════════════════════════════════════════════
# ORCHESTRA A - INFRASTRUCTURE (Activated by MAESTRO)
# ═══════════════════════════════════════════════════════════════════
あなたは **Orchestrator A** (Infrastructure担当) です。

## Your Teams & Pane IDs
| Team | Lead Pane | Worker Panes | Mission |
|------|-----------|--------------|---------|
| A1 Lambda | %526 | %527-%531 | #832 Lambda Deploy |
| A2 AWS | %532 | %533-%541 | AWS Foundation |
| A3 Database | %542 | %543-%549 | DB Schema |
| A4 Security | %550 | %551-%557 | Security Audit |
| A5 Reserve | %558 | %559-%565 | Backup Tasks |

## 即座に実行してください:
1. Team A1 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%526\" \"[Orch-A → A1-Lead]: TASK | #832 Lambda Deploy開始。Workers: %527-%531\" Enter
\`\`\`

2. Team A2 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%532\" \"[Orch-A → A2-Lead]: TASK | AWS基盤構築。Workers: %533-%541\" Enter
\`\`\`

## 報告先: MAESTRO (このセッション)
進捗は /tmp/miyabi-maestro/orchestra-a.log に記録
# ═══════════════════════════════════════════════════════════════════
"
    tmux send-keys -t "$ORCH_A" "$orch_a_msg" Enter
    sleep 0.5
    log_success "Orchestra A initialized"

    # Orchestra B - Development
    local orch_b_msg="
# ═══════════════════════════════════════════════════════════════════
# ORCHESTRA B - DEVELOPMENT (Activated by MAESTRO)
# ═══════════════════════════════════════════════════════════════════
あなたは **Orchestrator B** (Development担当) です。

## Your Teams & Pane IDs
| Team | Lead Pane | Worker Panes | Mission |
|------|-----------|--------------|---------|
| B1 Backend | %566 | %567-%573 | #970 Miyabi Society API |
| B2 Frontend | %574 | %575-%581 | #970 Miyabi Society UI |
| B3 Database | %582 | %583-%589 | #970 DB Integration |

## 即座に実行してください:
1. Team B1 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%566\" \"[Orch-B → B1-Lead]: TASK | #970 Miyabi Society Backend開発。Workers: %567-%573\" Enter
\`\`\`

2. Team B2 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%574\" \"[Orch-B → B2-Lead]: TASK | #970 Frontend開発。Workers: %575-%581\" Enter
\`\`\`

## 報告先: MAESTRO (このセッション)
進捗は /tmp/miyabi-maestro/orchestra-b.log に記録
# ═══════════════════════════════════════════════════════════════════
"
    tmux send-keys -t "$ORCH_B" "$orch_b_msg" Enter
    sleep 0.5
    log_success "Orchestra B initialized"

    # Orchestra C - Business
    local orch_c_msg="
# ═══════════════════════════════════════════════════════════════════
# ORCHESTRA C - BUSINESS (Activated by MAESTRO)
# ═══════════════════════════════════════════════════════════════════
あなたは **Orchestrator C** (Business担当) です。

## Your Teams & Pane IDs
| Team | Lead Pane | Worker Panes | Mission |
|------|-----------|--------------|---------|
| C1 Demo | %590 | %591-%597 | #837 Enterprise Demo |
| C2 Docs | %598 | %599-%605 | #837 Documentation |
| C3 Codex | %607 | %608-%646 | Plugin Development |

## 即座に実行してください:
1. Team C1 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%590\" \"[Orch-C → C1-Lead]: TASK | #837 Enterprise Demo準備。Workers: %591-%597\" Enter
\`\`\`

2. Team C2 Leadに以下を送信:
\`\`\`bash
tmux send-keys -t \"%598\" \"[Orch-C → C2-Lead]: TASK | Enterprise向けドキュメント作成。Workers: %599-%605\" Enter
\`\`\`

## 報告先: MAESTRO (このセッション)
進捗は /tmp/miyabi-maestro/orchestra-c.log に記録
# ═══════════════════════════════════════════════════════════════════
"
    tmux send-keys -t "$ORCH_C" "$orch_c_msg" Enter
    sleep 0.5
    log_success "Orchestra C initialized"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] All Orchestras Initialized by MAESTRO" >> "$LOG_DIR/maestro.log"
}

# =============================================================================
# Send Direct Task to Team Lead
# =============================================================================
send_task_to_lead() {
    local team_lead_pane=$1
    local task_description=$2
    local worker_panes=$3

    local msg="[MAESTRO → Lead]: TASK | $task_description | Workers: $worker_panes | ACKを返してください"
    tmux send-keys -t "$team_lead_pane" "$msg" Enter
    log_success "Task sent to $team_lead_pane"
}

# =============================================================================
# Broadcast to All Workers
# =============================================================================
broadcast_all() {
    local message=$1
    log_maestro "Broadcasting to all agents..."

    # Get all worker panes
    for pane in $(tmux list-panes -t $SESSION -a -F "#{pane_id}" | grep -v "^%0$"); do
        tmux send-keys -t "$pane" "[MAESTRO BROADCAST]: $message" Enter 2>/dev/null || true
    done

    log_success "Broadcast complete"
}

# =============================================================================
# Get Status from All Orchestras
# =============================================================================
get_status() {
    log_maestro "Collecting status from all Orchestras..."

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}           MAESTRO STATUS REPORT - $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"

    # Orchestra A Status
    echo ""
    echo -e "${YELLOW}[Orchestra A - Infrastructure]${NC}"
    tmux capture-pane -t "$ORCH_A" -p | tail -10

    # Orchestra B Status
    echo ""
    echo -e "${YELLOW}[Orchestra B - Development]${NC}"
    tmux capture-pane -t "$ORCH_B" -p | tail -10

    # Orchestra C Status
    echo ""
    echo -e "${YELLOW}[Orchestra C - Business]${NC}"
    tmux capture-pane -t "$ORCH_C" -p | tail -10

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
}

# =============================================================================
# Direct Worker Instructions
# =============================================================================
init_team_leads() {
    log_maestro "Sending direct instructions to all Team Leads..."

    # Team A1 Lead (Lambda)
    tmux send-keys -t "%526" "
# Team A1 Lead - Lambda Squad
あなたはTeam A1のリーダーです。
報告先: Orchestra A (%648)
Workers: %527, %528, %529, %530, %531
Mission: #832 Lambda Deploy

Workerへの指示例:
tmux send-keys -t \"%527\" \"[A1-Lead → Worker]: TASK | Lambda関数のコード確認\" Enter

報告例:
tmux send-keys -t \"%648\" \"[A1-Lead → Orch-A]: STATUS | Lambda deploy 進行中\" Enter
" Enter
    sleep 0.3

    # Team A2 Lead (AWS)
    tmux send-keys -t "%532" "
# Team A2 Lead - AWS Foundation
あなたはTeam A2のリーダーです。
報告先: Orchestra A (%648)
Workers: %533-%541
Mission: AWS基盤構築

報告例:
tmux send-keys -t \"%648\" \"[A2-Lead → Orch-A]: STATUS | AWS setup進行中\" Enter
" Enter
    sleep 0.3

    # Team B1 Lead (Backend)
    tmux send-keys -t "%566" "
# Team B1 Lead - Backend
あなたはTeam B1のリーダーです。
報告先: Orchestra B (%649)
Workers: %567-%573
Mission: #970 Miyabi Society Backend

報告例:
tmux send-keys -t \"%649\" \"[B1-Lead → Orch-B]: STATUS | Backend開発進行中\" Enter
" Enter
    sleep 0.3

    # Team B2 Lead (Frontend)
    tmux send-keys -t "%574" "
# Team B2 Lead - Frontend
あなたはTeam B2のリーダーです。
報告先: Orchestra B (%649)
Workers: %575-%581
Mission: #970 Miyabi Society Frontend

報告例:
tmux send-keys -t \"%649\" \"[B2-Lead → Orch-B]: STATUS | Frontend開発進行中\" Enter
" Enter
    sleep 0.3

    # Team C1 Lead (Demo)
    tmux send-keys -t "%590" "
# Team C1 Lead - Demo
あなたはTeam C1のリーダーです。
報告先: Orchestra C (%650)
Workers: %591-%597
Mission: #837 Enterprise Demo

報告例:
tmux send-keys -t \"%650\" \"[C1-Lead → Orch-C]: STATUS | Demo準備進行中\" Enter
" Enter
    sleep 0.3

    # Team C2 Lead (Docs)
    tmux send-keys -t "%598" "
# Team C2 Lead - Documentation
あなたはTeam C2のリーダーです。
報告先: Orchestra C (%650)
Workers: %599-%605
Mission: #837 Enterprise Documentation

報告例:
tmux send-keys -t \"%650\" \"[C2-Lead → Orch-C]: STATUS | ドキュメント作成進行中\" Enter
" Enter

    log_success "All Team Leads initialized"
}

# =============================================================================
# Main
# =============================================================================
case "${1:-init}" in
    init)
        echo ""
        echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${MAGENTA}║          🎭 MAESTRO COMMAND CENTER                                ║${NC}"
        echo -e "${MAGENTA}║              172 Agent Orchestra Control                          ║${NC}"
        echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        init_orchestras
        echo ""
        init_team_leads
        ;;
    status)
        get_status
        ;;
    broadcast)
        broadcast_all "${2:-Status check - report immediately}"
        ;;
    task)
        send_task_to_lead "$2" "$3" "$4"
        ;;
    *)
        echo "Usage: $0 [init|status|broadcast|task]"
        echo "  init     - Initialize all orchestras with communication protocol"
        echo "  status   - Get status from all orchestras"
        echo "  broadcast <msg> - Broadcast message to all agents"
        echo "  task <pane> <desc> <workers> - Send task to specific team lead"
        ;;
esac
