#!/usr/bin/env bash
# Quick tmux pane health summary for Miyabi orchestration.
#
# Usage:
#   scripts/tmux/pane-status.sh [--brief] [session-name]
#     --brief   Output compact summary (RUN/IDLE/DEAD counts only)
#     session   Defaults to "miyabi-auto-dev"

set -euo pipefail

BRIEF=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --brief)
      BRIEF=1
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

SESSION="${1:-miyabi-auto-dev}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux command not found." >&2
  exit 1
fi

if ! tmux has-session -t "${SESSION}" 2>/dev/null; then
  echo "Session '${SESSION}' not found." >&2
  exit 1
fi

fmt='#{pane_id}|#{session_name}|#{window_name}|#{pane_index}|#{pane_title}|#{pane_current_command}|#{pane_active}|#{pane_dead}|#{pane_silence}'

if [[ $BRIEF -eq 0 ]]; then
  printf "%-26s %-6s %-25s %-8s %s\n" "Window" "Pane" "Title" "State" "Command"
  printf "%-26s %-6s %-25s %-8s %s\n" "--------------------------" "------" "-------------------------" "--------" "------------------------------"
fi

total=0
run=0
idle=0
dead=0

while IFS='|' read -r pane_id sess win idx title cmd active dead_flag silence; do
  total=$((total + 1))
  window_label="${sess}:${win}"
  pane_label="${idx}"

  state="RUN"
  case "${cmd}" in
    ""|-|"sleep"|"zsh"|"bash")
      state="IDLE"
      ;;
  esac

  if [[ "${dead_flag}" == "1" ]]; then
    state="DEAD"
    dead=$((dead + 1))
  elif [[ "${state}" == "IDLE" ]]; then
    idle=$((idle + 1))
  else
    run=$((run + 1))
  fi

  if [[ "${active}" == "1" ]]; then
    state="${state}*"
  elif [[ "${silence}" =~ ^[0-9]+$ && "${silence}" -gt 300 ]]; then
    state="${state}!"
  fi

  if [[ $BRIEF -eq 0 ]]; then
    printf "%-26s %-6s %-25s %-8s %s\n" "${window_label}" "${pane_label}" "${title}" "${state}" "${cmd}"
  fi
done < <(tmux list-panes -t "${SESSION}" -F "${fmt}")

if [[ $BRIEF -eq 1 ]]; then
  printf "RUN:%d IDLE:%d DEAD:%d" "${run}" "${idle}" "${dead}"
  exit 0
fi

printf "\nTotal: %d  Run: %d  Idle: %d  Dead: %d\n" "${total}" "${run}" "${idle}" "${dead}"
printf "Tip: tmux popup -E \"scripts/tmux/pane-status.sh %s\"  # Quick status overlay\n" "${SESSION}"
