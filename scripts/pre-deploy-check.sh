#!/bin/bash
# Pre-Deployment Check Script for Miyabi Autonomous Workflow
# Version: 1.0.0
# Description: Validates environment before production deployment

set -e

echo "🔍 Miyabi Autonomous Workflow - Pre-Deployment Check"
echo "======================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Status tracking
ERRORS=0
WARNINGS=0

# Function to check environment variable
check_env_var() {
    local var_name=$1
    local required=$2

    if [ -z "${!var_name}" ]; then
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $var_name: NOT SET (required)${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${YELLOW}⚠️  $var_name: NOT SET (optional)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        # Mask the value for security
        local masked_value="${!var_name:0:10}..."
        echo -e "${GREEN}✅ $var_name: SET ($masked_value)${NC}"
    fi
}

echo "## 1. Environment Variables Check"
echo "-----------------------------------"

check_env_var "GITHUB_TOKEN" "true"
check_env_var "ANTHROPIC_API_KEY" "true"
check_env_var "DEVICE_IDENTIFIER" "false"
check_env_var "DISCORD_WEBHOOK_URL" "false"
check_env_var "SLACK_WEBHOOK_URL" "false"

echo ""
echo "## 2. Rust Toolchain Check"
echo "-----------------------------------"

# Check Rust version
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    echo -e "${GREEN}✅ rustc: $RUST_VERSION${NC}"
else
    echo -e "${RED}❌ rustc: NOT FOUND${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check cargo version
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version | awk '{print $2}')
    echo -e "${GREEN}✅ cargo: $CARGO_VERSION${NC}"
else
    echo -e "${RED}❌ cargo: NOT FOUND${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check clippy
if rustup component list | grep -q "clippy.*installed"; then
    echo -e "${GREEN}✅ clippy: installed${NC}"
else
    echo -e "${RED}❌ clippy: NOT INSTALLED${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "## 3. Build Check"
echo "-----------------------------------"

# Check if binary exists
if [ -f "target/release/miyabi" ]; then
    BINARY_SIZE=$(ls -lh target/release/miyabi | awk '{print $5}')
    echo -e "${GREEN}✅ miyabi binary: EXISTS ($BINARY_SIZE)${NC}"
else
    echo -e "${YELLOW}⚠️  miyabi binary: NOT FOUND (need to run cargo build --release)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "## 4. Test Suite Check"
echo "-----------------------------------"

# Run quick test suite validation (just count tests, don't run them)
TEST_COUNT=$(cargo test --all --no-run 2>&1 | grep -c "test " || echo "0")
echo -e "${GREEN}✅ Test suite: $TEST_COUNT tests available${NC}"

echo ""
echo "## 5. GitHub CLI Check"
echo "-----------------------------------"

if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n 1)
    echo -e "${GREEN}✅ GitHub CLI: $GH_VERSION${NC}"

    # Check gh authentication
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub Auth: authenticated${NC}"
    else
        echo -e "${RED}❌ GitHub Auth: NOT AUTHENTICATED${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌ GitHub CLI: NOT FOUND${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "## 6. Git Status Check"
echo "-----------------------------------"

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ Git status: clean${NC}"
else
    echo -e "${YELLOW}⚠️  Git status: uncommitted changes${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}✅ Current branch: $CURRENT_BRANCH${NC}"

echo ""
echo "## 7. Configuration File Check"
echo "-----------------------------------"

# Check for config file
if [ -f "$HOME/.config/miyabi/config.toml" ]; then
    echo -e "${GREEN}✅ config.toml: EXISTS${NC}"
else
    echo -e "${YELLOW}⚠️  config.toml: NOT FOUND (optional)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "======================================================"
echo "## Summary"
echo "-----------------------------------"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Pre-deployment check: PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. cargo build --release"
    echo "2. cargo test --all"
    echo "3. Configure GitHub Webhook"
    echo "4. Create test Issue"
    exit 0
else
    echo -e "${RED}❌ Pre-deployment check: FAILED${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
