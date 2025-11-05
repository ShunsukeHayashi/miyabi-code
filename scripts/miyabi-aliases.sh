#!/usr/bin/env bash
# Convenience aliases/functions for running Miyabi commands.
# Usage: source this file from your shell (e.g. `source scripts/miyabi-aliases.sh`).

_miyabi_repo_root() {
  git rev-parse --show-toplevel 2>/dev/null
}

_miyabi_require_git_root() {
  local root
  root=$(_miyabi_repo_root) || {
    echo "❌ Not inside a Miyabi repository" >&2
    return 1
  }
  echo "$root"
}

miyabi_orchestra() {
  local root
  root=$(_miyabi_require_git_root) || return 1

  if [ -z "${TMUX:-}" ]; then
    # Start or attach to tmux session automatically.
    if tmux has-session -t miyabi-orchestra 2>/dev/null; then
      echo "⚙️  Attaching to existing tmux session 'miyabi-orchestra'"
      tmux attach-session -t miyabi-orchestra
    else
      echo "🚀 Starting tmux session 'miyabi-orchestra'"
      tmux new-session -s miyabi-orchestra -c "$root" "./scripts/miyabi-orchestra.sh coding-ensemble"
    fi
  else
    (cd "$root" && ./scripts/miyabi-orchestra.sh coding-ensemble)
  fi
}

alias miyabi-orchestra=miyabi_orchestra

