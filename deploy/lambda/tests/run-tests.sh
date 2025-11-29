#!/bin/bash
# Lambda Function Test Runner
#
# This script runs all Lambda-related tests for miyabi-web-api
# Usage: ./deploy/lambda/tests/run-tests.sh [options]

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CRATE_DIR="${PROJECT_ROOT}/crates/miyabi-web-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
TEST_TYPE="all"
VERBOSE=false
COVERAGE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --config)
            TEST_TYPE="config"
            shift
            ;;
        --handler)
            TEST_TYPE="handler"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --all)
            TEST_TYPE="all"
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --config        Run config tests only"
            echo "  --handler       Run handler tests only"
            echo "  --integration   Run integration tests only"
            echo "  --all           Run all tests (default)"
            echo "  --verbose, -v   Show verbose output"
            echo "  --coverage      Generate coverage report"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Lambda Function Test Runner${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo not found. Please install Rust.${NC}"
    exit 1
fi

# Navigate to crate directory
cd "${CRATE_DIR}"

# Set up test environment variables
export DATABASE_URL="${DATABASE_URL:-postgresql://test:test@localhost:5432/miyabi_test}"
export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-must-be-32-bytes!!}"
export GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-test-github-client-id}"
export GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-test-github-client-secret}"
export ENVIRONMENT="test"

echo -e "${YELLOW}Test Environment:${NC}"
echo "  Project Root: ${PROJECT_ROOT}"
echo "  Crate Dir: ${CRATE_DIR}"
echo "  Database: ${DATABASE_URL}"
echo "  Test Type: ${TEST_TYPE}"
echo "  Coverage: ${COVERAGE}"
echo ""

# Build command
CARGO_CMD="cargo test --features lambda"

if [ "$VERBOSE" = true ]; then
    CARGO_CMD="${CARGO_CMD} -- --nocapture"
fi

# Run tests based on type
case $TEST_TYPE in
    config)
        echo -e "${YELLOW}Running Config Tests...${NC}"
        ${CARGO_CMD} lambda_config_tests
        ;;
    handler)
        echo -e "${YELLOW}Running Handler Tests...${NC}"
        ${CARGO_CMD} lambda_handler_tests
        ;;
    integration)
        echo -e "${YELLOW}Running Integration Tests...${NC}"
        ${CARGO_CMD} lambda_integration_tests
        ;;
    all)
        echo -e "${YELLOW}Running All Lambda Tests...${NC}"
        ${CARGO_CMD}
        ;;
esac

TEST_RESULT=$?

# Run coverage if requested
if [ "$COVERAGE" = true ]; then
    echo ""
    echo -e "${YELLOW}Generating Coverage Report...${NC}"

    if ! command -v cargo-tarpaulin &> /dev/null; then
        echo -e "${YELLOW}Installing cargo-tarpaulin...${NC}"
        cargo install cargo-tarpaulin
    fi

    cargo tarpaulin \
        --features lambda \
        --out Html \
        --output-dir "${PROJECT_ROOT}/coverage/lambda" \
        --exclude-files "target/*" \
        --exclude-files "tests/*"

    echo -e "${GREEN}Coverage report generated: ${PROJECT_ROOT}/coverage/lambda/index.html${NC}"
fi

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo -e "${GREEN}======================================${NC}"
else
    echo -e "${RED}======================================${NC}"
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${RED}======================================${NC}"
    exit 1
fi
