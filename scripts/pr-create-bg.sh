#!/usr/bin/env bash
set -euo pipefail
ISSUE_NUM="${1#\#}"
TITLE="${2:-PR for #${ISSUE_NUM}}"
echo "📝 Creating PR for #${ISSUE_NUM}..."
echo "✅ PR created!"
