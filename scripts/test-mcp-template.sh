#!/bin/bash
#
# Test the MCP Template
#
# This script tests that the template compiles and runs correctly
#

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Testing MCP Template${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

echo -e "${BLUE}1. Building template...${NC}"
if cargo build -p miyabi-mcp-template 2>&1 | tee /tmp/mcp-build.log; then
    echo -e "${GREEN}✓ Build succeeded${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    cat /tmp/mcp-build.log
    exit 1
fi

echo
echo -e "${BLUE}2. Running tests...${NC}"
if cargo test -p miyabi-mcp-template 2>&1; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi

echo
echo -e "${BLUE}3. Checking for warnings...${NC}"
if grep -q "warning:" /tmp/mcp-build.log; then
    echo -e "${RED}✗ Build has warnings${NC}"
    grep "warning:" /tmp/mcp-build.log
else
    echo -e "${GREEN}✓ No warnings${NC}"
fi

echo
echo -e "${GREEN}✓ Template is ready!${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo "  - Use this template for new MCP servers"
echo "  - See: crates/miyabi-mcp-template/README.md"
