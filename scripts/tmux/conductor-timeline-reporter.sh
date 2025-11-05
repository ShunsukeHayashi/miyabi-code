#!/usr/bin/env bash
# Combined tmux pane status and agent timeline reporter for conductors.
#
# Usage:
#   scripts/tmux/conductor-timeline-reporter.sh [options]
#     --session <name>          tmux session to inspect (default: miyabi-refactor)
#     --window-minutes <mins>   trailing window for agent summary (default: 10)
#     --interval-seconds <sec>  loop interval seconds when --loop is set (default: 600)
#     --loop                    continuously output updates
#     --help                    print this message

set -euo pipefail

SESSION="miyabi-refactor"
WINDOW_MINUTES=10
LOOP=0
INTERVAL_SECONDS=600

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANE_STATUS_SCRIPT="${SCRIPT_DIR}/pane-status.sh"
SUMMARY_SCRIPT="${SCRIPT_DIR}/../reporting/agent_timeline_summary.py"

usage() {
  sed -n '3,11p' "${BASH_SOURCE[0]}"
}

is_positive_int() {
  [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --session)
      [[ $# -ge 2 ]] || { echo "Missing value for --session" >&2; exit 2; }
      SESSION="$2"
      shift 2
      ;;
    --window-minutes)
      [[ $# -ge 2 ]] || { echo "Missing value for --window-minutes" >&2; exit 2; }
      if ! is_positive_int "$2"; then
        echo "--window-minutes must be a positive integer." >&2
        exit 2
      fi
      WINDOW_MINUTES="$2"
      shift 2
      ;;
    --interval-seconds)
      [[ $# -ge 2 ]] || { echo "Missing value for --interval-seconds" >&2; exit 2; }
      if ! is_positive_int "$2"; then
        echo "--interval-seconds must be a positive integer." >&2
        exit 2
      fi
      INTERVAL_SECONDS="$2"
      shift 2
      ;;
    --loop)
      LOOP=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -x "${PANE_STATUS_SCRIPT}" ]]; then
  echo "Required script not executable: ${PANE_STATUS_SCRIPT}" >&2
  exit 1
fi

if [[ ! -x "${SUMMARY_SCRIPT}" ]]; then
  echo "Required script not executable: ${SUMMARY_SCRIPT}" >&2
  exit 1
fi

collapse_whitespace() {
  local raw="$1"
  printf '%s' "${raw}" | tr '\r\n\t' '   ' | tr -s ' ' | sed 's/^ //;s/ $//'
}

emit_report() {
  local timestamp pane_status agent_summary
  timestamp="$(date +"%Y-%m-%dT%H:%M:%S%z")"

  if ! pane_status="$("${PANE_STATUS_SCRIPT}" --brief "${SESSION}" 2>&1)"; then
    pane_status="pane-status error: $(collapse_whitespace "${pane_status}")"
  else
    pane_status="$(collapse_whitespace "${pane_status}")"
  fi

  if ! agent_summary="$("${SUMMARY_SCRIPT}" --window-minutes "${WINDOW_MINUTES}" 2>&1)"; then
    agent_summary="timeline-summary error: $(collapse_whitespace "${agent_summary}")"
  else
    agent_summary="$(collapse_whitespace "${agent_summary}")"
  fi

  printf "[Conductor] タイムライン更新: %s | %s | %s\n" \
    "${timestamp}" "${pane_status}" "${agent_summary}"
}

if [[ "${LOOP}" -eq 1 ]]; then
  while true; do
    emit_report
    sleep "${INTERVAL_SECONDS}"
  done
else
  emit_report
fi
