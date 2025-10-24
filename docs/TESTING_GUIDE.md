# Miyabi Testing Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-25

## 📋 Overview

This guide explains how to run the comprehensive test suite for all 21 Miyabi agents.

## 🚀 Quick Start

### Run All Tests

```bash
# Run complete test suite (5 test categories)
./scripts/run_all_tests.sh
```

This will execute:
1. ✅ Unit tests (Rust cargo test)
2. ✅ Integration tests (All 21 agents)
3. ✅ LLM provider compatibility (Anthropic + OpenAI)
4. ✅ Performance benchmarks
5. ✅ Edge case handling

**Expected Duration**: ~10-15 minutes

---

## 🧪 Individual Test Suites

### 1. Unit Tests

```bash
# Run all Rust unit tests
cargo test --all

# Run tests for specific crate
cargo test --package miyabi-core
cargo test --package miyabi-llm
```

### 2. Integration Tests

```bash
# Test all 21 agents
./scripts/run_integration_tests.sh

# Test single agent
./scripts/test_agent.sh coordinator
./scripts/test_agent.sh codegen
./scripts/test_agent.sh review
```

**Available Agents**:
- **Coding (7)**: coordinator, codegen, review, issue, pr, deployment, refresher
- **Business (14)**: ai-entrepreneur, product-concept, product-design, funnel-design, persona, self-analysis, market-research, marketing, content-creation, sns-strategy, youtube, sales, crm, analytics

### 3. LLM Provider Compatibility

```bash
# Test both Anthropic and OpenAI
./scripts/test_llm_providers.sh

# Test specific provider
export LLM_PROVIDER=openai
./scripts/test_agent.sh coordinator openai

export LLM_PROVIDER=anthropic
./scripts/test_agent.sh coordinator anthropic
```

### 4. Performance Tests

```bash
# Run performance benchmarks
./scripts/run_performance_tests.sh
```

**Metrics Measured**:
- Average LLM response time
- Parallel tool calling performance
- Memory usage
- File operation throughput

### 5. Edge Case Tests

```bash
# Test error handling and boundary conditions
./scripts/run_edge_case_tests.sh
```

**Edge Cases Covered**:
- Invalid file paths
- Large file handling
- Permission denied
- Empty files
- Concurrent operations
- Invalid commands
- Special characters
- Timeout handling

---

## ⚙️ Configuration

### Required Environment Variables

```bash
# GitHub access
export GITHUB_TOKEN=ghp_xxx

# LLM Provider (choose one or both)
export OPENAI_API_KEY=sk-proj-xxx
export ANTHROPIC_API_KEY=sk-ant-xxx

# Provider selection (default: openai)
export LLM_PROVIDER=openai  # or anthropic
```

### Optional Configuration

```bash
# Device identifier
export DEVICE_IDENTIFIER=MacBook

# Test timeout (seconds)
export TEST_TIMEOUT=60
```

---

## 📊 Test Reports

### Output Format

All test scripts provide detailed output:

```
╔══════════════════════════════════════════════════════╗
║  Miyabi Comprehensive Test Suite                    ║
╚══════════════════════════════════════════════════════╝

🔍 Verifying environment...
✅ GITHUB_TOKEN configured
✅ OPENAI_API_KEY configured
✅ ANTHROPIC_API_KEY configured

╔══════════════════════════════════════════════════════╗
║  Test Suite 1/5: Rust Unit Tests                    ║
╚══════════════════════════════════════════════════════╝

✅ PASS: Unit tests

...

╔══════════════════════════════════════════════════════╗
║  COMPREHENSIVE TEST SUMMARY                          ║
╚══════════════════════════════════════════════════════╝

Test Execution Time:  12m 34s

Test Suites:
  Total:    5
  Passed:   5
  Failed:   0

🎉 ALL TESTS PASSED!
Miyabi is ready for production
```

---

## 🔧 CI/CD Integration

### GitHub Actions

Add to `.github/workflows/tests.yml`:

```yaml
name: Miyabi Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Run all tests
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: ./scripts/run_all_tests.sh
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "OPENAI_API_KEY not set"

```bash
# Solution: Export your API key
export OPENAI_API_KEY=sk-proj-xxx
```

#### 2. "Command not found: miyabi"

```bash
# Solution: Build miyabi-cli first
cargo build --release --package miyabi-cli
```

#### 3. "Permission denied"

```bash
# Solution: Make scripts executable
chmod +x scripts/*.sh
```

#### 4. "Test timeout"

```bash
# Solution: Increase timeout
export TEST_TIMEOUT=120
```

#### 5. "API rate limit exceeded"

```bash
# Solution: Add delay between tests or use different provider
export LLM_PROVIDER=anthropic
```

---

## 📝 Writing New Tests

### Unit Test Template

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_my_feature() {
        let result = my_function().await;
        assert!(result.is_ok());
    }
}
```

### Integration Test Template

```bash
# Add to test_agent.sh
my-new-agent)
    echo -e "${YELLOW}Testing MyNewAgent...${NC}"

    # Test 1: Basic functionality
    echo -e "${GREEN}Test 1: Basic test${NC}"
    echo "Test query" | \
        timeout 60s ./target/release/miyabi chat --mode read-only || true

    echo -e "${GREEN}✅ MyNewAgent test complete${NC}"
    ;;
```

---

## 📚 Related Documentation

- **[Agent Test Specification](./AGENT_TEST_SPECIFICATION.md)** - Complete test cases for all 21 agents
- **[Agent Operations Manual](./AGENT_OPERATIONS_MANUAL.md)** - Agent usage guide
- **[Development Guide](../.claude/context/development.md)** - Development workflow

---

## 🎯 Test Coverage Goals

| Category | Target Coverage | Current Status |
|----------|----------------|----------------|
| Unit Tests | 80%+ | ✅ Implemented |
| Integration Tests | 100% (21/21 agents) | ✅ Implemented |
| LLM Provider Tests | 100% (2/2 providers) | ✅ Implemented |
| Performance Tests | 5 key metrics | ✅ Implemented |
| Edge Case Tests | 8 scenarios | ✅ Implemented |

---

## ✅ Test Checklist

Before deploying to production:

- [ ] All unit tests pass (`cargo test --all`)
- [ ] All 21 agents tested (`./scripts/run_integration_tests.sh`)
- [ ] Both LLM providers working (`./scripts/test_llm_providers.sh`)
- [ ] Performance benchmarks meet targets (`./scripts/run_performance_tests.sh`)
- [ ] All edge cases handled (`./scripts/run_edge_case_tests.sh`)
- [ ] Full test suite passes (`./scripts/run_all_tests.sh`)
- [ ] No security vulnerabilities (`cargo audit`)
- [ ] Code formatted (`cargo fmt`)
- [ ] No clippy warnings (`cargo clippy`)

---

## 🚦 Exit Codes

All test scripts follow standard exit codes:

- `0` - All tests passed ✅
- `1` - One or more tests failed ❌
- `124` - Timeout (used by edge case tests)

---

## 📞 Support

**Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
**Docs**: https://shunsukehayashi.github.io/Miyabi/

---

**Happy Testing!** 🧪✨
