#!/bin/bash
# AI CLI Version Checker
# Checks installed AI CLI tools and compares with latest versions

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🔍 Checking AI CLI versions..."
echo ""

# Claude Code
echo "📦 Claude Code:"
echo "  Model: claude-sonnet-4-5-20250929"
echo "  ${YELLOW}Check manually:${NC} https://claude.com/claude-code/releases"
echo ""

# Gemini CLI
echo "📦 Gemini CLI:"
if command -v gemini &> /dev/null; then
  GEMINI_VERSION=$(gemini --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "Unknown")
  echo "  Current: $GEMINI_VERSION"

  # Check latest version from npm
  GEMINI_LATEST=$(npm view @google/gemini-cli version 2>/dev/null || echo "Unable to check")
  echo "  Latest:  $GEMINI_LATEST"

  if [ "$GEMINI_VERSION" != "$GEMINI_LATEST" ] && [ "$GEMINI_LATEST" != "Unable to check" ]; then
    echo "  ${YELLOW}⚠️  Update available!${NC}"
    echo "  Run: ${GREEN}npm update -g @google/gemini-cli${NC}"
  else
    echo "  ${GREEN}✅ Up to date${NC}"
  fi
else
  echo "  ${RED}❌ Not installed${NC}"
  echo "  Install: ${GREEN}npm install -g @google/gemini-cli${NC}"
fi
echo ""

# OpenAI Codex CLI
echo "📦 OpenAI Codex CLI:"
if command -v codex &> /dev/null; then
  CODEX_VERSION=$(codex --version 2>&1 || echo "Unknown")
  echo "  Current: $CODEX_VERSION"
  echo "  ${YELLOW}Check:${NC} https://github.com/openai/codex/releases"
else
  echo "  ${YELLOW}ℹ️  Not installed (optional)${NC}"
  echo "  Install: ${GREEN}npm install -g @openai/codex${NC}"
fi
echo ""

# Update version file
VERSION_FILE=".claude/ai-cli-versions.json"
if [ -f "$VERSION_FILE" ]; then
  echo "📝 Updating version file..."

  # Use jq if available, otherwise manual update
  if command -v jq &> /dev/null; then
    TEMP_FILE=$(mktemp)
    jq --arg date "$(date +%Y-%m-%d)" \
       --arg gemini_version "$GEMINI_VERSION" \
       --arg gemini_latest "$GEMINI_LATEST" \
       '.lastUpdated = $date | .tools.geminiCli.version = $gemini_version | .tools.geminiCli.latestVersion = $gemini_latest' \
       "$VERSION_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$VERSION_FILE"
    echo "  ${GREEN}✅ Version file updated${NC}"
  else
    echo "  ${YELLOW}⚠️  jq not installed, skipping version file update${NC}"
  fi
fi

echo ""
echo "✅ Version check complete"
echo ""
echo "📊 Summary:"
echo "  - Claude Code: ${GREEN}Active${NC}"
if command -v gemini &> /dev/null; then
  echo "  - Gemini CLI: ${GREEN}Installed${NC}"
else
  echo "  - Gemini CLI: ${RED}Not installed${NC}"
fi
if command -v codex &> /dev/null; then
  echo "  - OpenAI Codex: ${GREEN}Installed${NC}"
else
  echo "  - OpenAI Codex: ${YELLOW}Not installed (optional)${NC}"
fi
