# Code Coverage Guide - Miyabi Rust Project

## Overview

Miyabi uses **cargo-tarpaulin** for code coverage analysis and **Codecov.io** for coverage reporting and tracking.

## Quick Start

### Local Coverage Generation

```bash
# Install cargo-tarpaulin (if not installed)
cargo install cargo-tarpaulin

# Generate coverage report for all workspace crates
cargo tarpaulin --workspace --all-features --out Html --output-dir coverage

# Open HTML report
open coverage/tarpaulin-report.html
```

### Coverage Requirements

- **Minimum Coverage**: 80%
- **Enforcement**: CI/CD pipeline fails if coverage drops below 80%
- **Measurement**: Line coverage across all workspace crates

## CI/CD Integration

### Automated Coverage Workflow

The coverage workflow runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Workflow Steps

1. **Setup**: Install Rust toolchain and cargo-tarpaulin
2. **Generate**: Run coverage analysis with multiple output formats (XML, HTML, JSON)
3. **Parse**: Extract coverage percentage from JSON report
4. **Check**: Verify coverage meets 80% threshold
5. **Upload**: Send coverage data to Codecov.io
6. **Report**: Generate CI summary with coverage metrics

### Coverage Threshold Enforcement

```bash
# Coverage check in CI
COVERAGE=$(jq -r '.coverage' coverage/tarpaulin-report.json)
THRESHOLD=80.0

if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
  echo "❌ Coverage below threshold"
  exit 1
fi
```

## Codecov Integration

### Setup

1. **Get Codecov Token**:
   - Visit https://codecov.io/gh/ShunsukeHayashi/miyabi-private
   - Navigate to Settings → General
   - Copy the repository upload token

2. **Add GitHub Secret**:
   ```bash
   # Add CODECOV_TOKEN to repository secrets
   gh secret set CODECOV_TOKEN
   ```

3. **Badge Configuration**:
   ```markdown
   [![codecov](https://codecov.io/gh/ShunsukeHayashi/miyabi-private/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/ShunsukeHayashi/miyabi-private)
   ```

### Coverage Reports

- **Dashboard**: https://codecov.io/gh/ShunsukeHayashi/miyabi-private
- **Pull Request Comments**: Codecov automatically comments on PRs with coverage changes
- **GitHub Checks**: Coverage status displayed in PR checks

## Configuration Files

### codecov.yml

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%
```

**Key Settings**:
- `target: 80%` - Minimum coverage requirement
- `threshold: 2%` - Allow up to 2% coverage decrease
- `precision: 2` - Round coverage to 2 decimal places

### .github/workflows/rust.yml

```yaml
- name: Generate coverage
  run: |
    cargo tarpaulin \
      --workspace \
      --all-features \
      --timeout 300 \
      --out Xml --out Html --out Json \
      --output-dir ./coverage \
      --exclude-files 'target/*' \
      --exclude-files '*/tests/*' \
      --exclude-files '*/examples/*'
```

**Key Options**:
- `--workspace` - Run coverage on all crates
- `--all-features` - Enable all feature flags
- `--timeout 300` - Set 5-minute timeout per test
- `--exclude-files` - Ignore test files and examples

## Local Development

### Running Coverage Locally

```bash
# Full workspace coverage
cargo tarpaulin --workspace --all-features --out Html

# Single crate coverage
cargo tarpaulin --package miyabi-types --out Html

# Fast mode (skip clean build)
cargo tarpaulin --workspace --skip-clean --out Html

# With verbose output
cargo tarpaulin --workspace --verbose --out Html
```

### Viewing Coverage Reports

```bash
# HTML report (most detailed)
open coverage/tarpaulin-report.html

# JSON report (for scripting)
cat coverage/tarpaulin-report.json | jq

# XML report (for Codecov)
cat coverage/cobertura.xml
```

## Best Practices

### Writing Testable Code

1. **Unit Tests**:
   ```rust
   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_function_name() {
           // Test implementation
       }
   }
   ```

2. **Integration Tests**:
   ```rust
   // tests/integration_test.rs
   #[test]
   fn test_feature_integration() {
       // Test implementation
   }
   ```

3. **Async Tests**:
   ```rust
   #[tokio::test]
   async fn test_async_function() {
       // Async test implementation
   }
   ```

### Improving Coverage

1. **Identify Uncovered Code**:
   - Open HTML report in browser
   - Red lines indicate uncovered code
   - Focus on critical paths first

2. **Add Missing Tests**:
   - Cover error cases
   - Test edge cases
   - Add integration tests

3. **Remove Dead Code**:
   - Delete unused functions
   - Remove unreachable code
   - Simplify complex logic

### Coverage Exclusions

Use `#[cfg(not(tarpaulin_include))]` to exclude code from coverage:

```rust
#[cfg(not(tarpaulin_include))]
fn debug_only_function() {
    // This won't count towards coverage
}
```

## Troubleshooting

### Common Issues

1. **Compilation Errors**:
   ```bash
   # Clean build before running tarpaulin
   cargo clean
   cargo tarpaulin --workspace
   ```

2. **Timeout Errors**:
   ```bash
   # Increase timeout
   cargo tarpaulin --workspace --timeout 600
   ```

3. **Out of Memory**:
   ```bash
   # Run on single crate at a time
   for crate in crates/*/; do
       cargo tarpaulin --manifest-path $crate/Cargo.toml
   done
   ```

4. **Flaky Tests**:
   ```bash
   # Run tests with single thread
   cargo tarpaulin --workspace -- --test-threads=1
   ```

### CI/CD Issues

1. **Coverage Upload Fails**:
   - Check CODECOV_TOKEN is set correctly
   - Verify network connectivity
   - Check Codecov service status

2. **Threshold Check Fails**:
   - Review coverage report
   - Add missing tests
   - Adjust threshold if appropriate

3. **Slow CI Builds**:
   - Use `--skip-clean` for faster builds
   - Cache cargo-tarpaulin installation
   - Parallelize crate coverage

## Resources

- **cargo-tarpaulin**: https://github.com/xd009642/tarpaulin
- **Codecov Docs**: https://docs.codecov.com/
- **Rust Testing**: https://doc.rust-lang.org/book/ch11-00-testing.html

## Metrics

### Current Coverage Status

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | 80%+ | [![codecov](https://codecov.io/gh/ShunsukeHayashi/miyabi-private/branch/main/graph/badge.svg)](https://codecov.io/gh/ShunsukeHayashi/miyabi-private) |
| Crate Count | 23 | 23 |
| Test Count | 577+ | ✅ |

### Coverage by Crate

View detailed per-crate coverage on the [Codecov Dashboard](https://codecov.io/gh/ShunsukeHayashi/miyabi-private).

---

**Last Updated**: 2025-10-24
**Maintained By**: DeploymentAgent
