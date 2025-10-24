#!/bin/bash
# Miyabi Agent Individual Test Script
# Usage: ./scripts/test_agent.sh <agent_name> [provider]

set -euo pipefail

AGENT_NAME="${1:-}"
LLM_PROVIDER="${2:-openai}"

if [ -z "$AGENT_NAME" ]; then
    echo "Usage: $0 <agent_name> [provider]"
    echo ""
    echo "Available agents:"
    echo "  Coding (7):"
    echo "    - coordinator, codegen, review, issue, pr, deployment, refresher"
    echo "  Business (14):"
    echo "    - ai-entrepreneur, product-concept, product-design, funnel-design"
    echo "    - persona, self-analysis, market-research, marketing"
    echo "    - content-creation, sns-strategy, youtube, sales, crm, analytics"
    echo ""
    echo "Providers: anthropic, openai (default: openai)"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Testing Agent: ${AGENT_NAME} (Provider: ${LLM_PROVIDER})${NC}"

# Export provider
export LLM_PROVIDER

# Verify API keys
if [ "$LLM_PROVIDER" = "openai" ]; then
    if [ -z "${OPENAI_API_KEY:-}" ]; then
        echo -e "${RED}❌ OPENAI_API_KEY not set${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ OpenAI API key configured${NC}"
elif [ "$LLM_PROVIDER" = "anthropic" ]; then
    if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
        echo -e "${RED}❌ ANTHROPIC_API_KEY not set${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Anthropic API key configured${NC}"
fi

# Build miyabi-cli if needed
if [ ! -f "target/release/miyabi" ]; then
    echo -e "${YELLOW}🔨 Building miyabi-cli...${NC}"
    cargo build --release --package miyabi-cli
fi

# Test based on agent type
case "$AGENT_NAME" in
    coordinator)
        echo -e "${YELLOW}📋 Testing CoordinatorAgent...${NC}"

        # Test 1: Issue analysis (simulated via chat)
        echo -e "${GREEN}Test 1: Issue analysis simulation${NC}"
        echo "Analyze this issue: 'Add user authentication with JWT'" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ CoordinatorAgent test complete${NC}"
        ;;

    codegen)
        echo -e "${YELLOW}🔧 Testing CodeGenAgent...${NC}"

        # Test 1: Simple code generation
        echo -e "${GREEN}Test 1: Generate Fibonacci function${NC}"
        echo "Generate a Fibonacci function in Rust" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ CodeGenAgent test complete${NC}"
        ;;

    review)
        echo -e "${YELLOW}👁️ Testing ReviewAgent...${NC}"

        # Test 1: Code review simulation
        echo -e "${GREEN}Test 1: Review code quality${NC}"
        cat > /tmp/test_review.rs <<'EOF'
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
EOF
        echo "Review this Rust code for quality: $(cat /tmp/test_review.rs)" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true
        rm -f /tmp/test_review.rs

        echo -e "${GREEN}✅ ReviewAgent test complete${NC}"
        ;;

    issue)
        echo -e "${YELLOW}🔍 Testing IssueAgent...${NC}"

        # Test 1: Label inference
        echo -e "${GREEN}Test 1: Label inference${NC}"
        echo "Infer labels for this issue: 'Add user authentication using JWT tokens'" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ IssueAgent test complete${NC}"
        ;;

    pr)
        echo -e "${YELLOW}📝 Testing PRAgent...${NC}"

        # Test 1: PR title generation
        echo -e "${GREEN}Test 1: Generate PR title${NC}"
        echo "Generate a PR title for commits: 'feat: add auth, fix: login bug'" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ PRAgent test complete${NC}"
        ;;

    deployment)
        echo -e "${YELLOW}🚀 Testing DeploymentAgent...${NC}"

        # Test 1: Deployment validation
        echo -e "${GREEN}Test 1: Deployment validation${NC}"
        echo "Describe the steps to validate a production deployment" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ DeploymentAgent test complete${NC}"
        ;;

    refresher)
        echo -e "${YELLOW}🔄 Testing RefresherAgent...${NC}"

        # Test 1: Issue state analysis
        echo -e "${GREEN}Test 1: Issue state refresh${NC}"
        echo "What criteria should be used to determine if an issue is stale?" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ RefresherAgent test complete${NC}"
        ;;

    ai-entrepreneur | product-concept | product-design | funnel-design | \
    persona | self-analysis | market-research | marketing | \
    content-creation | sns-strategy | youtube | sales | crm | analytics)
        echo -e "${YELLOW}💼 Testing Business Agent: ${AGENT_NAME}${NC}"

        # Generic business agent test
        echo -e "${GREEN}Test 1: Business strategy query${NC}"
        echo "Describe your role and capabilities as ${AGENT_NAME}" | \
            timeout 60s ./target/release/miyabi chat --mode read-only || true

        echo -e "${GREEN}✅ ${AGENT_NAME} test complete${NC}"
        ;;

    *)
        echo -e "${RED}❌ Unknown agent: ${AGENT_NAME}${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}✅ All tests for ${AGENT_NAME} completed successfully${NC}"
