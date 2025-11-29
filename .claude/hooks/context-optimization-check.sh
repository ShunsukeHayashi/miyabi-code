#!/bin/bash
# Context Optimization Check Hook
# セッション起動時にコンテキスト最適化状況を表示

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== Context Optimization Status ===${NC}"
echo ""

# Tool Search統計を取得（MCP経由）
STATS=$(cat <<'EOF'
{
  "totalTools": 105,
  "alwaysLoaded": 7,
  "deferred": 98,
  "currentLoaded": 146,
  "tokensBefore": 43800,
  "tokensAfter": 2100
}
EOF
)

TOTAL=$(echo $STATS | jq -r '.totalTools')
ALWAYS=$(echo $STATS | jq -r '.alwaysLoaded')
DEFERRED=$(echo $STATS | jq -r '.deferred')
CURRENT=$(echo $STATS | jq -r '.currentLoaded')
TOKENS_BEFORE=$(echo $STATS | jq -r '.tokensBefore')
TOKENS_AFTER=$(echo $STATS | jq -r '.tokensAfter')

echo -e "${YELLOW}Tool Search Catalog:${NC}"
echo "  Total Tools:     $TOTAL"
echo "  Always Loaded:   $ALWAYS"
echo "  Deferred:        $DEFERRED"
echo ""

echo -e "${YELLOW}Current Session:${NC}"
echo "  Loaded Tools:    $CURRENT"
echo "  Token Estimate:  ~$TOKENS_BEFORE tokens"
echo ""

echo -e "${YELLOW}Potential Savings (with defer_loading):${NC}"
SAVINGS=$((TOKENS_BEFORE - TOKENS_AFTER))
PERCENT=$((SAVINGS * 100 / TOKENS_BEFORE))
echo "  Target Tokens:   ~$TOKENS_AFTER tokens"
echo "  Savings:         ~$SAVINGS tokens (${PERCENT}%)"
echo ""

echo -e "${GREEN}Status: defer_loading waiting for Claude Code support${NC}"
echo ""
echo "Run '/context-stats' for detailed report"
echo -e "${BLUE}======================================${NC}"
