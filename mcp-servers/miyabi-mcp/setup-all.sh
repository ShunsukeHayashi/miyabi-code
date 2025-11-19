#!/bin/bash
# Miyabi MCP - All-in-One Setup Script
# Installs and builds all 9 MCP servers

set -e

echo "🚀 Miyabi MCP - All-in-One Setup"
echo "================================"
echo ""

BASEDIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers"

SERVERS=(
  "miyabi-git-inspector"
  "miyabi-tmux-server"
  "miyabi-log-aggregator"
  "miyabi-resource-monitor"
  "miyabi-network-inspector"
  "miyabi-process-inspector"
  "miyabi-file-watcher"
  "miyabi-claude-code"
  "miyabi-github"
)

SUCCESS_COUNT=0
FAIL_COUNT=0

for SERVER in "${SERVERS[@]}"; do
  echo "📦 Processing: $SERVER"

  if [ -d "$BASEDIR/$SERVER" ]; then
    cd "$BASEDIR/$SERVER"

    # Install dependencies
    echo "   ├─ Installing dependencies..."
    if npm install > /dev/null 2>&1; then
      echo "   ├─ ✅ Dependencies installed"
    else
      echo "   ├─ ❌ Failed to install dependencies"
      FAIL_COUNT=$((FAIL_COUNT + 1))
      continue
    fi

    # Build
    echo "   ├─ Building TypeScript..."
    if npm run build > /dev/null 2>&1; then
      echo "   └─ ✅ Build successful"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "   └─ ❌ Build failed"
      FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
  else
    echo "   └─ ❌ Directory not found"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo ""
done

echo "================================"
echo "📊 Setup Summary"
echo "   ✅ Success: $SUCCESS_COUNT"
echo "   ❌ Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo "🎉 All servers built successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Update Claude Desktop config:"
  echo "   ~/Library/Application Support/Claude/claude_desktop_config.json"
  echo "2. Use the template in: $BASEDIR/miyabi-mcp/claude-config-template.json"
  echo "3. Restart Claude Desktop"
else
  echo "⚠️  Some servers failed to build. Check errors above."
fi
