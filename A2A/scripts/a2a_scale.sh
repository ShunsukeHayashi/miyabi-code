#!/usr/bin/env bash
# =============================================================================
# A2A Dynamic Scaling Script
# =============================================================================
# 負荷に応じたワーカーの動的スケーリング
#
# Usage:
#   ./a2a_scale.sh status           # 現在のスケール状態を表示
#   ./a2a_scale.sh up [count]       # ワーカーを増やす
#   ./a2a_scale.sh down [count]     # ワーカーを減らす
#   ./a2a_scale.sh auto             # 自動スケーリングモード
#   ./a2a_scale.sh set <count>      # ワーカー数を指定
# =============================================================================

set -euo pipefail

# Configuration
SESSION_NAME="${A2A_SESSION_NAME:-a2a}"
MIN_WORKERS=2
MAX_WORKERS=8
DEFAULT_WORKERS=4
SCALE_CHECK_INTERVAL=60  # seconds

# Load environment
if [ -f "${HOME}/.miyabi/a2a_env.sh" ]; then
  source "${HOME}/.miyabi/a2a_env.sh"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Worker roles for scaling
WORKER_ROLES=("codegen" "review" "test" "deploy")

# =============================================================================
# Utility Functions
# =============================================================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

session_exists() {
  tmux has-session -t "${SESSION_NAME}" 2>/dev/null
}

get_worker_count() {
  # Count panes minus conductor
  local total
  total=$(tmux list-panes -t "${SESSION_NAME}" 2>/dev/null | wc -l)
  echo $((total - 1))
}

get_current_panes() {
  tmux list-panes -t "${SESSION_NAME}" -F "#{pane_id}" 2>/dev/null
}

get_conductor_pane() {
  echo "${MIYABI_CONDUCTOR_PANE:-$(tmux list-panes -t "${SESSION_NAME}" -F "#{pane_id}" 2>/dev/null | head -1)}"
}

# =============================================================================
# Scaling Functions
# =============================================================================

add_worker() {
  local worker_num=$1
  local role="${WORKER_ROLES[$((worker_num % ${#WORKER_ROLES[@]}))]}"

  log_info "Adding worker ${worker_num} with role: ${role}"

  # Create new pane
  tmux split-window -t "${SESSION_NAME}" -h

  # Get the new pane ID
  local new_pane
  new_pane=$(tmux list-panes -t "${SESSION_NAME}" -F "#{pane_id}" | tail -1)

  # Rebalance layout
  tmux select-layout -t "${SESSION_NAME}" tiled

  # Start Claude in the new pane
  local prompt="あなたはA2A汎用ワーカー #${worker_num} です。現在の役割: ${role}。Conductorからの指示を待ってください。"

  tmux send-keys -t "${new_pane}" "cd $(pwd)" Enter
  sleep 0.3
  tmux send-keys -t "${new_pane}" "claude --dangerously-skip-permissions" Enter
  sleep 2
  tmux send-keys -t "${new_pane}" "${prompt}" Enter

  log_success "Worker ${worker_num} (${role}) added in pane ${new_pane}"

  # Update state file
  update_worker_state "add" "${new_pane}" "${role}"
}

remove_worker() {
  local panes
  panes=($(get_current_panes))

  if [ ${#panes[@]} -le 2 ]; then
    log_error "Cannot remove worker: minimum ${MIN_WORKERS} workers required"
    return 1
  fi

  # Remove last pane (not conductor)
  local target_pane="${panes[-1]}"
  local conductor_pane
  conductor_pane=$(get_conductor_pane)

  if [ "$target_pane" = "$conductor_pane" ]; then
    target_pane="${panes[-2]}"
  fi

  log_info "Removing worker in pane ${target_pane}"

  # Send exit command
  tmux send-keys -t "${target_pane}" "/exit" Enter
  sleep 1

  # Kill the pane
  tmux kill-pane -t "${target_pane}"

  # Rebalance layout
  tmux select-layout -t "${SESSION_NAME}" tiled

  log_success "Worker removed"

  # Update state file
  update_worker_state "remove" "${target_pane}"
}

scale_to() {
  local target_count=$1
  local current_count
  current_count=$(get_worker_count)

  if [ "$target_count" -lt "$MIN_WORKERS" ]; then
    log_warn "Target count ${target_count} is below minimum ${MIN_WORKERS}, using ${MIN_WORKERS}"
    target_count=$MIN_WORKERS
  fi

  if [ "$target_count" -gt "$MAX_WORKERS" ]; then
    log_warn "Target count ${target_count} exceeds maximum ${MAX_WORKERS}, using ${MAX_WORKERS}"
    target_count=$MAX_WORKERS
  fi

  log_info "Scaling from ${current_count} to ${target_count} workers"

  if [ "$target_count" -gt "$current_count" ]; then
    local to_add=$((target_count - current_count))
    for i in $(seq 1 $to_add); do
      add_worker $((current_count + i))
      sleep 2
    done
  elif [ "$target_count" -lt "$current_count" ]; then
    local to_remove=$((current_count - target_count))
    for i in $(seq 1 $to_remove); do
      remove_worker
      sleep 1
    done
  else
    log_info "Already at target scale"
  fi
}

# =============================================================================
# Auto-Scaling Logic
# =============================================================================

calculate_load() {
  # Calculate system load based on:
  # 1. Number of pending tasks
  # 2. Worker utilization (busy vs idle)

  local busy_count=0
  local total_count=0

  for pane in $(get_current_panes); do
    local output
    output=$(tmux capture-pane -t "$pane" -p 2>/dev/null | tail -3 || echo "")

    total_count=$((total_count + 1))

    if [[ "$output" == *"⏺"* ]] || [[ "$output" == *"Working"* ]]; then
      busy_count=$((busy_count + 1))
    fi
  done

  if [ $total_count -eq 0 ]; then
    echo "0"
    return
  fi

  # Return utilization percentage
  echo $((busy_count * 100 / total_count))
}

get_pending_tasks() {
  local state_file="${HOME}/.miyabi/a2a_state.json"
  if [ -f "$state_file" ]; then
    grep -c '"status": "pending"' "$state_file" 2>/dev/null || echo "0"
  else
    echo "0"
  fi
}

determine_target_scale() {
  local utilization=$1
  local pending_tasks=$2
  local current_workers=$3

  local target=$current_workers

  # Scale up if high utilization or many pending tasks
  if [ "$utilization" -gt 80 ] || [ "$pending_tasks" -gt 5 ]; then
    target=$((current_workers + 2))
  elif [ "$utilization" -gt 60 ] || [ "$pending_tasks" -gt 2 ]; then
    target=$((current_workers + 1))
  # Scale down if low utilization and no pending tasks
  elif [ "$utilization" -lt 20 ] && [ "$pending_tasks" -eq 0 ]; then
    target=$((current_workers - 1))
  fi

  # Clamp to min/max
  if [ "$target" -lt "$MIN_WORKERS" ]; then
    target=$MIN_WORKERS
  elif [ "$target" -gt "$MAX_WORKERS" ]; then
    target=$MAX_WORKERS
  fi

  echo "$target"
}

auto_scale_loop() {
  log_info "Starting auto-scaling mode (interval: ${SCALE_CHECK_INTERVAL}s)"
  log_info "Workers range: ${MIN_WORKERS} - ${MAX_WORKERS}"
  echo ""

  while true; do
    local current_workers
    current_workers=$(get_worker_count)

    local utilization
    utilization=$(calculate_load)

    local pending_tasks
    pending_tasks=$(get_pending_tasks)

    local target_workers
    target_workers=$(determine_target_scale "$utilization" "$pending_tasks" "$current_workers")

    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} Workers: ${current_workers}/${MAX_WORKERS} | Util: ${utilization}% | Pending: ${pending_tasks} | Target: ${target_workers}"

    if [ "$target_workers" -ne "$current_workers" ]; then
      log_info "Auto-scaling: ${current_workers} → ${target_workers}"
      scale_to "$target_workers"
    fi

    sleep "$SCALE_CHECK_INTERVAL"
  done
}

# =============================================================================
# State Management
# =============================================================================

update_worker_state() {
  local action=$1
  local pane_id=$2
  local role=${3:-"generic"}

  local state_file="${HOME}/.miyabi/a2a_state.json"

  if [ ! -f "$state_file" ]; then
    return
  fi

  # This is a simplified update - in production, use proper JSON tools
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  case "$action" in
    "add")
      log_info "State: Added worker ${pane_id} with role ${role}"
      ;;
    "remove")
      log_info "State: Removed worker ${pane_id}"
      ;;
  esac
}

# =============================================================================
# Status Display
# =============================================================================

show_status() {
  if ! session_exists; then
    log_error "Session '${SESSION_NAME}' not found"
    exit 1
  fi

  local workers
  workers=$(get_worker_count)
  local utilization
  utilization=$(calculate_load)
  local pending
  pending=$(get_pending_tasks)

  echo ""
  echo "┌────────────────────────────────────────┐"
  echo "│       A2A Scale Status                 │"
  echo "├────────────────────────────────────────┤"
  printf "│ Session:       %-22s │\n" "${SESSION_NAME}"
  printf "│ Workers:       %-22s │\n" "${workers}/${MAX_WORKERS}"
  printf "│ Utilization:   %-22s │\n" "${utilization}%"
  printf "│ Pending Tasks: %-22s │\n" "${pending}"
  echo "├────────────────────────────────────────┤"
  echo "│ Panes:                                 │"

  for pane in $(get_current_panes); do
    local output
    output=$(tmux capture-pane -t "$pane" -p 2>/dev/null | tail -1 | head -c 30 || echo "N/A")
    printf "│   %-6s │ %-27s │\n" "$pane" "${output:0:27}"
  done

  echo "└────────────────────────────────────────┘"
  echo ""
}

# =============================================================================
# Main
# =============================================================================

show_help() {
  echo "A2A Dynamic Scaling"
  echo ""
  echo "Usage: $0 <command> [options]"
  echo ""
  echo "Commands:"
  echo "  status          Show current scale status"
  echo "  up [count]      Scale up by count (default: 1)"
  echo "  down [count]    Scale down by count (default: 1)"
  echo "  set <count>     Set exact worker count"
  echo "  auto            Start auto-scaling mode"
  echo "  help            Show this help"
  echo ""
  echo "Configuration:"
  echo "  MIN_WORKERS=${MIN_WORKERS}"
  echo "  MAX_WORKERS=${MAX_WORKERS}"
  echo "  SCALE_CHECK_INTERVAL=${SCALE_CHECK_INTERVAL}s"
}

main() {
  case "${1:-help}" in
    status|-s)
      show_status
      ;;
    up)
      local count=${2:-1}
      local current
      current=$(get_worker_count)
      scale_to $((current + count))
      ;;
    down)
      local count=${2:-1}
      local current
      current=$(get_worker_count)
      scale_to $((current - count))
      ;;
    set)
      if [ -z "${2:-}" ]; then
        log_error "Usage: $0 set <count>"
        exit 1
      fi
      scale_to "$2"
      ;;
    auto|-a)
      auto_scale_loop
      ;;
    help|-h|--help)
      show_help
      ;;
    *)
      log_error "Unknown command: $1"
      show_help
      exit 1
      ;;
  esac
}

main "$@"
