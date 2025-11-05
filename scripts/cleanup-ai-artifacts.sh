#!/usr/bin/env bash
# Remove transient AI-generated artifacts (metrics/improvements/state) across the repo.
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
TARGETS=(".ai/metrics" ".ai/improvements" ".ai/state")

for dir in "${TARGETS[@]}"; do
  # remove in root
  rm -rf "${ROOT_DIR}/${dir}"/* 2>/dev/null || true
  # remove in nested packages (e.g., apps embedding their own .ai)
  while IFS= read -r path; do
    rm -rf "${path}"/* 2>/dev/null || true
  done < <(find "${ROOT_DIR}" -path "*/${dir}" -type d 2>/dev/null)

done

echo "✅ Cleaned .ai metrics/improvements/state artifacts"
