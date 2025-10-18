#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$ROOT_DIR"

echo "[miyabi] building codex-miyabi (release=false)"
cargo build -p codex-miyabi >/dev/null

echo "[miyabi] status"
cargo run -q -p codex-miyabi -- status --json | tee /dev/stderr | jq -e '.ok == true' >/dev/null

echo "[miyabi] agent run (should be NotImplemented)"
out=$(cargo run -q -p codex-miyabi -- agent run --type coordinator --json || true)
echo "$out" | jq -e '.ok == false and (.error|ascii_downcase|contains("not implemented"))' >/dev/null

echo "[miyabi] worktree list"
cargo run -q -p codex-miyabi -- worktree list --json | jq -e 'type == "array"' >/dev/null

echo "[miyabi] worktree create/cleanup"
cargo run -q -p codex-miyabi -- worktree create --issue 270 --json | jq -e '.ok == true and .issue == 270' >/dev/null
cargo run -q -p codex-miyabi -- worktree cleanup --issue 270 --json | jq -e '.ok == true and .issue == 270' >/dev/null

echo "[miyabi] smoke OK"

