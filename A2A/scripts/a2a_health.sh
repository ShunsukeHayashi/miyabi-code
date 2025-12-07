#!/usr/bin/env bash
# =============================================================================
# A2A Health Check Script
# =============================================================================
# エージェントのヘルスチェックと自動復旧
#
# Usage:
#   ./a2a_health.sh              # 一回のヘルスチェック
#   ./a2a_health.sh --watch      # 継続監視 (30秒間隔)
#   ./a2a_health.sh --auto-heal  # 自動復旧モード
#   ./a2a_health.sh --json       # JSON形式で出力
# =============================================================================

set -euo pipefail

# Configuration
SESSION_NAME="${A2A_SESSION_NAME:-a2a}"
STATE_FILE="${A2A_STATE_FILE:-${HOME}/.miyabi/a2a_state.json}"
HEALTH_LOG="${HOME}/.miyabi/logs/health.log"
CHECK_INTERVAL="${A2A_HEALTH_INTERVAL:-30}"
TIMEOUT_THRESHOLD=60  # seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Agent mapping
declare -A AGENT_PANES
declare -A AGENT_STATUS
declare -A AGENT_LAST_SEEN

# =============================================================================
# Utility Functions
# =============================================================================

log_health() {
  local level="$1"
  local message="$2"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" >> "${HEALTH_LOG}"
}

load_env() {
  if [ -f "${HOME}/.miyabi/a2a_env.sh" ]; then
    source "${HOME}/.miyabi/a2a_env.sh"
  fi

  AGENT_PANES=(
    ["shikiroon"]="${MIYABI_CONDUCTOR_PANE:-}"
    ["kaede"]="${MIYABI_CODEGEN_PANE:-}"
    ["sakura"]="${MIYABI_REVIEW_PANE:-}"
    ["tsubaki"]="${MIYABI_PR_PANE:-}"
    ["botan"]="${MIYABI_DEPLOY_PANE:-}"
  )
}

session_exists() {
  tmux has-session -t "${SESSION_NAME}" 2>/dev/null
}

# =============================================================================
# Health Check Functions
# =============================================================================

check_pane_responsive() {
  local pane_id="$1"
  local output

  # Capture last 5 lines of pane
  output=$(tmux capture-pane -t "${pane_id}" -p 2>/dev/null | tail -5 || echo "")

  # Check for responsiveness indicators
  if [[ -z "$output" ]]; then
    echo "empty"
  elif [[ "$output" == *">"* ]] || [[ "$output" == *"$"* ]]; then
    echo "ready"
  elif [[ "$output" == *"⏺"* ]] || [[ "$output" == *"Working"* ]]; then
    echo "busy"
  elif [[ "$output" == *"error"* ]] || [[ "$output" == *"Error"* ]]; then
    echo "error"
  else
    echo "unknown"
  fi
}

check_pane_exists() {
  local pane_id="$1"
  tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${pane_id}$"
}

get_pane_activity() {
  local pane_id="$1"
  # Get pane activity time (seconds since last activity)
  local activity
  activity=$(tmux display-message -t "${pane_id}" -p "#{pane_last_activity}" 2>/dev/null || echo "0")
  local now=$(date +%s)
  echo $((now - activity))
}

check_agent_health() {
  local agent_name="$1"
  local pane_id="${AGENT_PANES[$agent_name]:-}"

  if [ -z "$pane_id" ]; then
    echo "unknown"
    return
  fi

  if ! check_pane_exists "$pane_id"; then
    echo "dead"
    return
  fi

  local responsive
  responsive=$(check_pane_responsive "$pane_id")

  local inactive_time
  inactive_time=$(get_pane_activity "$pane_id")

  if [[ "$responsive" == "error" ]]; then
    echo "error"
  elif [[ "$inactive_time" -gt "$TIMEOUT_THRESHOLD" ]] && [[ "$responsive" != "busy" ]]; then
    echo "stale"
  elif [[ "$responsive" == "ready" ]]; then
    echo "healthy"
  elif [[ "$responsive" == "busy" ]]; then
    echo "busy"
  else
    echo "unknown"
  fi
}

# =============================================================================
# Auto-Heal Functions
# =============================================================================

restart_agent() {
  local agent_name="$1"
  local pane_id="${AGENT_PANES[$agent_name]:-}"

  if [ -z "$pane_id" ]; then
    echo -e "${RED}Cannot restart ${agent_name}: no pane ID${NC}"
    return 1
  fi

  echo -e "${YELLOW}Restarting ${agent_name} in ${pane_id}...${NC}"
  log_health "WARN" "Restarting agent: ${agent_name} (${pane_id})"

  # Send Ctrl+C to stop current process
  tmux send-keys -t "${pane_id}" C-c
  sleep 1

  # Restart Claude
  tmux send-keys -t "${pane_id}" "claude --dangerously-skip-permissions" Enter
  sleep 2

  echo -e "${GREEN}${agent_name} restarted${NC}"
  log_health "INFO" "Agent restarted: ${agent_name}"
}

auto_heal() {
  local agent_name="$1"
  local status="$2"

  case "$status" in
    "dead")
      echo -e "${RED}Agent ${agent_name} is DEAD - attempting respawn${NC}"
      log_health "ERROR" "Agent dead: ${agent_name}"
      # For dead panes, we'd need to recreate - complex, skip for now
      echo -e "${YELLOW}Manual intervention required for dead pane${NC}"
      ;;
    "error")
      echo -e "${RED}Agent ${agent_name} has ERROR - restarting${NC}"
      restart_agent "$agent_name"
      ;;
    "stale")
      echo -e "${YELLOW}Agent ${agent_name} is STALE - sending ping${NC}"
      local pane_id="${AGENT_PANES[$agent_name]:-}"
      tmux send-keys -t "${pane_id}" "# Health check ping - $(date)" Enter
      log_health "WARN" "Agent stale, pinged: ${agent_name}"
      ;;
  esac
}

# =============================================================================
# Output Functions
# =============================================================================

print_status_line() {
  local agent="$1"
  local status="$2"
  local pane="${AGENT_PANES[$agent]:-N/A}"

  local status_icon
  local status_color

  case "$status" in
    "healthy") status_icon="✅"; status_color="${GREEN}" ;;
    "busy")    status_icon="🔄"; status_color="${BLUE}" ;;
    "stale")   status_icon="⚠️"; status_color="${YELLOW}" ;;
    "error")   status_icon="❌"; status_color="${RED}" ;;
    "dead")    status_icon="💀"; status_color="${RED}" ;;
    *)         status_icon="❓"; status_color="${NC}" ;;
  esac

  printf "│ ${status_icon}  %-12s │ %-8s │ %-7s │\n" "$agent" "$pane" "$status"
}

print_header() {
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo ""
  echo "┌────────────────────────────────────────────┐"
  echo "│      A2A Health Check - ${timestamp}       │"
  echo "├────────────────┬──────────┬─────────┤"
  echo "│ Agent          │ Pane     │ Status  │"
  echo "├────────────────┼──────────┼─────────┤"
}

print_footer() {
  echo "└────────────────┴──────────┴─────────┘"
}

print_json() {
  local json="{"
  json+="\"timestamp\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  json+="\"session\":\"${SESSION_NAME}\","
  json+="\"agents\":{"

  local first=true
  for agent in "${!AGENT_PANES[@]}"; do
    local status
    status=$(check_agent_health "$agent")
    if [ "$first" = true ]; then
      first=false
    else
      json+=","
    fi
    json+="\"${agent}\":{\"pane\":\"${AGENT_PANES[$agent]}\",\"status\":\"${status}\"}"
  done

  json+="}}"
  echo "$json"
}

# =============================================================================
# Main Functions
# =============================================================================

run_health_check() {
  local auto_heal_mode="${1:-false}"
  local all_healthy=true

  print_header

  for agent in shikiroon kaede sakura tsubaki botan; do
    local status
    status=$(check_agent_health "$agent")
    print_status_line "$agent" "$status"

    if [[ "$status" != "healthy" && "$status" != "busy" ]]; then
      all_healthy=false
      if [ "$auto_heal_mode" = true ]; then
        auto_heal "$agent" "$status"
      fi
    fi
  done

  print_footer

  if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}All agents healthy${NC}"
  else
    echo -e "${YELLOW}Some agents need attention${NC}"
  fi
}

watch_mode() {
  local auto_heal="${1:-false}"

  echo -e "${CYAN}Starting health monitor (interval: ${CHECK_INTERVAL}s)${NC}"
  echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
  echo ""

  while true; do
    clear
    run_health_check "$auto_heal"
    sleep "$CHECK_INTERVAL"
  done
}

main() {
  load_env

  if ! session_exists; then
    echo -e "${RED}Session '${SESSION_NAME}' not found${NC}"
    echo "Run a2a_bootstrap.sh first"
    exit 1
  fi

  case "${1:-}" in
    --watch|-w)
      watch_mode false
      ;;
    --auto-heal|-a)
      watch_mode true
      ;;
    --json|-j)
      print_json
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --watch, -w      Continuous monitoring (30s interval)"
      echo "  --auto-heal, -a  Auto-heal mode with monitoring"
      echo "  --json, -j       Output in JSON format"
      echo "  --help, -h       Show this help"
      exit 0
      ;;
    *)
      run_health_check false
      ;;
  esac
}

main "$@"
