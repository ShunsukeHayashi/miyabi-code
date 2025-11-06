#!/bin/bash
# TypeScript validation hook

set -e

FILE_PATH="$1"

echo "[validate-typescript] Checking $FILE_PATH"
npx tsc --noEmit "$FILE_PATH"
