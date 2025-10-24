#!/bin/bash
# Miyabi Master Test Runner
# Runs all test suites: unit, integration, LLM providers, performance, and edge cases

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Banner
clear
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║  ${BOLD}Miyabi Comprehensive Test Suite${NC}${CYAN}                   ║${NC}"
echo -e "${CYAN}║  ${BOLD}All 21 Agents - Full Validation${NC}${CYAN}                   ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify environment
echo -e "${YELLOW}🔍 Verifying environment...${NC}"

ERRORS=0

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo -e "${RED}❌ GITHUB_TOKEN not set${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ GITHUB_TOKEN configured${NC}"
fi

if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo -e "${RED}❌ OPENAI_API_KEY not set${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ OPENAI_API_KEY configured${NC}"
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set (Anthropic tests will be skipped)${NC}"
else
    echo -e "${GREEN}✅ ANTHROPIC_API_KEY configured${NC}"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Environment not properly configured. Please set missing variables.${NC}"
    exit 1
fi

echo ""

# Test execution tracking
TOTAL_SUITES=5
PASSED_SUITES=0
FAILED_SUITES=0
START_TIME=$(date +%s)

# Test Suite 1: Unit Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite 1/5: Rust Unit Tests                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT"

if cargo test --all --quiet; then
    echo -e "${GREEN}✅ PASS: Unit tests${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ FAIL: Unit tests${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
sleep 2

# Test Suite 2: Integration Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite 2/5: Agent Integration Tests            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

if "$SCRIPT_DIR/run_integration_tests.sh"; then
    echo -e "${GREEN}✅ PASS: Integration tests${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ FAIL: Integration tests${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
sleep 2

# Test Suite 3: LLM Provider Compatibility
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite 3/5: LLM Provider Compatibility         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

if "$SCRIPT_DIR/test_llm_providers.sh"; then
    echo -e "${GREEN}✅ PASS: LLM provider tests${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ FAIL: LLM provider tests${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
sleep 2

# Test Suite 4: Performance Tests
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite 4/5: Performance Benchmarks             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

if "$SCRIPT_DIR/run_performance_tests.sh"; then
    echo -e "${GREEN}✅ PASS: Performance tests${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ FAIL: Performance tests${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
sleep 2

# Test Suite 5: Edge Cases
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite 5/5: Edge Case Handling                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

if "$SCRIPT_DIR/run_edge_case_tests.sh"; then
    echo -e "${GREEN}✅ PASS: Edge case tests${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    echo -e "${RED}❌ FAIL: Edge case tests${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Final summary
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}║  ${BOLD}COMPREHENSIVE TEST SUMMARY${NC}${CYAN}                        ║${NC}"
echo -e "${CYAN}║                                                      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Test Execution Time:${NC}  ${MINUTES}m ${SECONDS}s"
echo ""
echo -e "${BOLD}Test Suites:${NC}"
echo -e "  Total:    ${TOTAL_SUITES}"
echo -e "  ${GREEN}Passed:   ${PASSED_SUITES}${NC}"
echo -e "  ${RED}Failed:   ${FAILED_SUITES}${NC}"
echo ""

# Detailed breakdown
echo -e "${BOLD}Test Categories:${NC}"
echo -e "  [1/5] Unit Tests:          $([ $PASSED_SUITES -ge 1 ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo -e "  [2/5] Integration Tests:   $([ $PASSED_SUITES -ge 2 ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo -e "  [3/5] LLM Provider Tests:  $([ $PASSED_SUITES -ge 3 ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo -e "  [4/5] Performance Tests:   $([ $PASSED_SUITES -ge 4 ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo -e "  [5/5] Edge Case Tests:     $([ $PASSED_SUITES -ge 5 ] && echo -e "${GREEN}✅${NC}" || echo -e "${RED}❌${NC}")"
echo ""

# Pass/fail status
if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                      ║${NC}"
    echo -e "${GREEN}║  ${BOLD}🎉 ALL TESTS PASSED!${NC}${GREEN}                              ║${NC}"
    echo -e "${GREEN}║  ${BOLD}Miyabi is ready for production${NC}${GREEN}                   ║${NC}"
    echo -e "${GREEN}║                                                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                      ║${NC}"
    echo -e "${RED}║  ${BOLD}❌ SOME TESTS FAILED${NC}${RED}                                ║${NC}"
    echo -e "${RED}║  ${BOLD}Please review failures above${NC}${RED}                       ║${NC}"
    echo -e "${RED}║                                                      ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
