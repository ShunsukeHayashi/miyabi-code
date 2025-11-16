#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Validating SSH connections..."

HOSTS=("mugen" "macbook")
ALL_OK=1

for host in "${HOSTS[@]}"; do
  echo -n "Testing ${host}... "
  if ssh -o ConnectTimeout=5 -o BatchMode=yes "${host}" "echo OK" &>/dev/null; then
    echo "✅ Connected"
  else
    echo "❌ Failed"
    ALL_OK=0
  fi
done

if [ $ALL_OK -eq 0 ]; then
  echo ""
  echo "❌ Some SSH connections failed!"
  echo "Please check ~/.ssh/config and SSH keys"
  exit 1
fi

echo ""
echo "✅ All SSH connections working!"
