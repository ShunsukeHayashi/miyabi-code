#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Validating environment variables..."

REQUIRED_VARS=(
  "LARK_ESCALATION_EMAIL"
  "LARK_APP_ID"
  "LARK_APP_SECRET"
  "GITHUB_TOKEN"
)

MISSING=0

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "❌ Missing: $var"
    MISSING=1
  else
    echo "✅ Set: $var"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  echo "❌ Some required environment variables are missing!"
  echo "Please set them in ~/.bashrc or ~/.profile"
  exit 1
fi

echo ""
echo "✅ All required environment variables are set!"
