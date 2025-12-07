#!/usr/bin/env bash
# =============================================================================
# A2A Auto-Bootstrap Script
# =============================================================================
# 1コマンドで全A2Aマルチエージェントシステムを起動
#
# Usage:
#   ./a2a_bootstrap.sh              # 新規セッション作成・起動
#   ./a2a_bootstrap.sh --attach     # 起動後にアタッチ
#   ./a2a_bootstrap.sh --kill       # 既存セッションを終了
#   ./a2a_bootstrap.sh --restart    # 再起動
# =============================================================================

set -euo pipefail

# Configuration
SESSION_NAME="${A2A_SESSION_NAME:-a2a}"
WORKING_DIR="${A2A_WORKING_DIR:-$(pwd)}"
AGENTS_JSON="${A2A_AGENTS_JSON:-./miyabi_agents.json}"
STATE_FILE="${HOME}/.miyabi/a2a_state.json"
LOG_DIR="${HOME}/.miyabi/logs"

# Agent definitions
declare -a AGENT_NAMES=("shikiroon" "kaede" "sakura" "tsubaki" "botan")
declare -a AGENT_ROLES=("Conductor" "CodeGen" "Review" "PR" "Deploy")
declare -a AGENT_ICONS=("🎭" "👨‍💻" "🔍" "📝" "🚀")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Utility Functions
# =============================================================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ensure_directories() {
  mkdir -p "${LOG_DIR}"
  mkdir -p "$(dirname "${STATE_FILE}")"
}

session_exists() {
  tmux has-session -t "${SESSION_NAME}" 2>/dev/null
}

# =============================================================================
# Session Management
# =============================================================================

kill_session() {
  if session_exists; then
    log_warn "Killing existing session: ${SESSION_NAME}"
    tmux kill-session -t "${SESSION_NAME}"
    log_success "Session killed"
  else
    log_info "No existing session found"
  fi
}

create_session() {
  log_info "Creating tmux session: ${SESSION_NAME}"

  # Create session with first window
  tmux new-session -d -s "${SESSION_NAME}" -n agents -c "${WORKING_DIR}"

  # Create 5 panes (2x3 layout, one unused)
  tmux split-window -h -t "${SESSION_NAME}:0"
  tmux split-window -v -t "${SESSION_NAME}:0.0"
  tmux split-window -v -t "${SESSION_NAME}:0.1"
  tmux split-window -v -t "${SESSION_NAME}:0.2"

  # Apply layout
  tmux select-layout -t "${SESSION_NAME}:0" tiled

  log_success "Session created with 5 panes"
}

get_pane_ids() {
  tmux list-panes -t "${SESSION_NAME}" -F "#{pane_id}" | head -5
}

# =============================================================================
# Agent Spawning
# =============================================================================

spawn_agent() {
  local pane_id="$1"
  local agent_name="$2"
  local agent_role="$3"
  local agent_icon="$4"

  log_info "Spawning ${agent_icon} ${agent_name} (${agent_role}) in ${pane_id}"

  # Set pane title
  tmux select-pane -t "${pane_id}" -T "${agent_icon} ${agent_name}"

  # Build Claude command with agent-specific system prompt
  local claude_cmd="claude --dangerously-skip-permissions"

  # Send command to pane
  tmux send-keys -t "${pane_id}" "cd ${WORKING_DIR}" Enter
  sleep 0.3
  tmux send-keys -t "${pane_id}" "${claude_cmd}" Enter

  # Wait for Claude to initialize
  sleep 2

  # Send initial prompt based on role
  local init_prompt=""
  case "${agent_name}" in
    "shikiroon")
      init_prompt="あなたは指揮郎（しきろう）、A2Aマルチエージェントシステムのコンダクターです。ペインID: ${pane_id}。他のエージェント（楓%102、桜%103、椿%104、牡丹%105）からの報告を待ち、タスクを調整してください。準備完了したら「[指揮郎] 準備完了」と報告してください。"
      ;;
    "kaede")
      init_prompt="あなたは楓（かえで）、コード生成スペシャリストです。ペインID: ${pane_id}。指揮郎（%101）からのタスク指示を待ってください。タスク完了時は tmux send-keys -t %101 で報告してください。準備完了したら報告してください。"
      ;;
    "sakura")
      init_prompt="あなたは桜（さくら）、コードレビュースペシャリストです。ペインID: ${pane_id}。楓からのレビュー依頼を待ってください。レビュー完了時は指揮郎（%101）に報告してください。準備完了したら報告してください。"
      ;;
    "tsubaki")
      init_prompt="あなたは椿（つばき）、PR管理スペシャリストです。ペインID: ${pane_id}。桜からの承認後、PRをマージし、牡丹にデプロイ依頼してください。結果は指揮郎（%101）に報告してください。準備完了したら報告してください。"
      ;;
    "botan")
      init_prompt="あなたは牡丹（ぼたん）、デプロイスペシャリストです。ペインID: ${pane_id}。椿からのデプロイ依頼を待ってください。デプロイ完了時は指揮郎（%101）に報告してください。準備完了したら報告してください。"
      ;;
  esac

  tmux send-keys -t "${pane_id}" "${init_prompt}"
  sleep 0.5
  tmux send-keys -t "${pane_id}" Enter
}

spawn_all_agents() {
  local pane_ids=($(get_pane_ids))

  log_info "Starting agent spawn sequence..."

  for i in "${!AGENT_NAMES[@]}"; do
    if [ $i -lt ${#pane_ids[@]} ]; then
      spawn_agent "${pane_ids[$i]}" "${AGENT_NAMES[$i]}" "${AGENT_ROLES[$i]}" "${AGENT_ICONS[$i]}"
      sleep 1
    fi
  done

  log_success "All agents spawned"
}

# =============================================================================
# State Management
# =============================================================================

init_state() {
  local pane_ids=($(get_pane_ids))
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  cat > "${STATE_FILE}" << EOF
{
  "session": "${SESSION_NAME}",
  "startedAt": "${timestamp}",
  "currentCycle": 0,
  "agents": {
    "shikiroon": { "paneId": "${pane_ids[0]:-}", "status": "initializing", "role": "conductor" },
    "kaede": { "paneId": "${pane_ids[1]:-}", "status": "initializing", "role": "codegen" },
    "sakura": { "paneId": "${pane_ids[2]:-}", "status": "initializing", "role": "review" },
    "tsubaki": { "paneId": "${pane_ids[3]:-}", "status": "initializing", "role": "pr" },
    "botan": { "paneId": "${pane_ids[4]:-}", "status": "initializing", "role": "deploy" }
  },
  "tasks": {},
  "eventLog": []
}
EOF

  log_success "State file initialized: ${STATE_FILE}"
}

# =============================================================================
# Environment Variables Export
# =============================================================================

export_env_vars() {
  local pane_ids=($(get_pane_ids))

  echo ""
  echo -e "${CYAN}Export these environment variables:${NC}"
  echo ""
  echo "export MIYABI_CONDUCTOR_PANE=\"${pane_ids[0]:-}\""
  echo "export MIYABI_CODEGEN_PANE=\"${pane_ids[1]:-}\""
  echo "export MIYABI_REVIEW_PANE=\"${pane_ids[2]:-}\""
  echo "export MIYABI_PR_PANE=\"${pane_ids[3]:-}\""
  echo "export MIYABI_DEPLOY_PANE=\"${pane_ids[4]:-}\""
  echo ""

  # Also save to a sourceable file
  cat > "${HOME}/.miyabi/a2a_env.sh" << EOF
#!/bin/bash
export MIYABI_CONDUCTOR_PANE="${pane_ids[0]:-}"
export MIYABI_CODEGEN_PANE="${pane_ids[1]:-}"
export MIYABI_REVIEW_PANE="${pane_ids[2]:-}"
export MIYABI_PR_PANE="${pane_ids[3]:-}"
export MIYABI_DEPLOY_PANE="${pane_ids[4]:-}"
export A2A_SESSION_NAME="${SESSION_NAME}"
export A2A_STATE_FILE="${STATE_FILE}"
EOF

  log_success "Environment saved to ~/.miyabi/a2a_env.sh"
  echo -e "${YELLOW}Run: source ~/.miyabi/a2a_env.sh${NC}"
}

# =============================================================================
# Main
# =============================================================================

show_banner() {
  echo -e "${CYAN}"
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║           A2A Multi-Agent Bootstrap System                    ║"
  echo "║                   🎭 Miyabi Edition                           ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

show_status() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                    System Status                              ║${NC}"
  echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════╣${NC}"

  local pane_ids=($(get_pane_ids))
  for i in "${!AGENT_NAMES[@]}"; do
    if [ $i -lt ${#pane_ids[@]} ]; then
      printf "${GREEN}║${NC} ${AGENT_ICONS[$i]} %-12s │ %-8s │ Pane: %-6s ${GREEN}║${NC}\n" \
        "${AGENT_NAMES[$i]}" "${AGENT_ROLES[$i]}" "${pane_ids[$i]}"
    fi
  done

  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

main() {
  show_banner
  ensure_directories

  case "${1:-}" in
    --kill|-k)
      kill_session
      exit 0
      ;;
    --restart|-r)
      kill_session
      sleep 1
      ;;
    --status|-s)
      if session_exists; then
        show_status
        export_env_vars
      else
        log_error "Session not found: ${SESSION_NAME}"
        exit 1
      fi
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --attach, -a    Attach to session after creation"
      echo "  --kill, -k      Kill existing session"
      echo "  --restart, -r   Restart (kill + create)"
      echo "  --status, -s    Show current status"
      echo "  --help, -h      Show this help"
      exit 0
      ;;
  esac

  # Check if session already exists
  if session_exists; then
    log_warn "Session '${SESSION_NAME}' already exists"
    echo -n "Kill and recreate? [y/N] "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      kill_session
      sleep 1
    else
      log_info "Attaching to existing session..."
      tmux attach-session -t "${SESSION_NAME}"
      exit 0
    fi
  fi

  # Create and setup
  create_session
  init_state
  spawn_all_agents
  show_status
  export_env_vars

  # Attach if requested
  if [[ "${1:-}" == "--attach" || "${1:-}" == "-a" ]]; then
    log_info "Attaching to session..."
    tmux attach-session -t "${SESSION_NAME}"
  else
    echo ""
    echo -e "${YELLOW}To attach: tmux attach -t ${SESSION_NAME}${NC}"
  fi
}

main "$@"
