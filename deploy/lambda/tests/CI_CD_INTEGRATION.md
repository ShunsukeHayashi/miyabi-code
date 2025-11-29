# Lambda Tests - CI/CD Integration Guide

## Overview

This guide explains how to integrate Lambda function tests into your CI/CD pipeline.

## GitHub Actions Integration

### Test Workflow Example

Create `.github/workflows/lambda-tests.yml`:

```yaml
name: Lambda Function Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'crates/miyabi-web-api/**'
      - 'deploy/lambda/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'crates/miyabi-web-api/**'
      - 'deploy/lambda/**'

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  lambda-tests:
    name: Lambda Function Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: miyabi_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Cache Rust dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/bin/
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-lambda-${{ hashFiles('**/Cargo.lock') }}

      - name: Install cargo-lambda
        run: |
          cargo install cargo-lambda || true

      - name: Set up test environment
        run: |
          echo "DATABASE_URL=postgresql://test:test@localhost:5432/miyabi_test" >> $GITHUB_ENV
          echo "JWT_SECRET=github-actions-test-secret-32b!!" >> $GITHUB_ENV
          echo "GITHUB_CLIENT_ID=test-client-id" >> $GITHUB_ENV
          echo "GITHUB_CLIENT_SECRET=test-client-secret" >> $GITHUB_ENV
          echo "ENVIRONMENT=test" >> $GITHUB_ENV

      - name: Run database migrations
        working-directory: crates/miyabi-web-api
        run: |
          cargo install sqlx-cli --no-default-features --features postgres || true
          sqlx migrate run

      - name: Run Lambda config tests
        run: ./deploy/lambda/tests/run-tests.sh --config

      - name: Run Lambda handler tests
        run: ./deploy/lambda/tests/run-tests.sh --handler

      - name: Run Lambda integration tests
        run: ./deploy/lambda/tests/run-tests.sh --integration

      - name: Generate coverage report
        if: github.event_name == 'pull_request'
        run: |
          cargo install cargo-tarpaulin || true
          cd crates/miyabi-web-api
          cargo tarpaulin --features lambda --out Xml

      - name: Upload coverage to Codecov
        if: github.event_name == 'pull_request'
        uses: codecov/codecov-action@v3
        with:
          files: ./crates/miyabi-web-api/cobertura.xml
          flags: lambda-tests
          name: lambda-coverage

  lint:
    name: Lint Lambda Code
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy, rustfmt

      - name: Run clippy
        working-directory: crates/miyabi-web-api
        run: cargo clippy --features lambda -- -D warnings

      - name: Check formatting
        working-directory: crates/miyabi-web-api
        run: cargo fmt -- --check

  build-lambda:
    name: Build Lambda Binary
    runs-on: ubuntu-latest
    needs: [lambda-tests, lint]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install cargo-lambda
        run: cargo install cargo-lambda

      - name: Build Lambda for ARM64
        run: ./scripts/build-lambda.sh arm64

      - name: Upload Lambda artifact
        uses: actions/upload-artifact@v4
        with:
          name: lambda-binary-arm64
          path: dist/lambda/miyabi-api-arm64.zip
          retention-days: 7
```

## Local Testing

### Quick Test
```bash
./deploy/lambda/tests/run-tests.sh
```

### Specific Test Types
```bash
# Config tests only
./deploy/lambda/tests/run-tests.sh --config

# Handler tests only
./deploy/lambda/tests/run-tests.sh --handler

# Integration tests only
./deploy/lambda/tests/run-tests.sh --integration

# With coverage
./deploy/lambda/tests/run-tests.sh --coverage
```

### Direct Cargo Commands
```bash
cd crates/miyabi-web-api

# All Lambda tests
cargo test --features lambda

# Specific test module
cargo test --features lambda lambda_config_tests

# With output
cargo test --features lambda -- --nocapture

# Single test
cargo test --features lambda test_lambda_config_loads_in_production_env
```

## Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Pre-commit hook for Lambda tests

echo "Running Lambda tests..."

# Run quick tests (config + handler)
./deploy/lambda/tests/run-tests.sh --config --handler

if [ $? -ne 0 ]; then
    echo "❌ Lambda tests failed. Commit aborted."
    exit 1
fi

echo "✅ Lambda tests passed."
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## AWS CodeBuild Integration

Create `buildspec.yml`:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      rust: latest
    commands:
      - curl -L https://github.com/cargo-lambda/cargo-lambda/releases/latest/download/cargo-lambda-x86_64-unknown-linux-musl.tar.gz | tar xz -C /usr/local/bin

  pre_build:
    commands:
      - echo "Setting up test environment..."
      - export DATABASE_URL=$TEST_DATABASE_URL
      - export JWT_SECRET=$TEST_JWT_SECRET
      - export GITHUB_CLIENT_ID=$TEST_GITHUB_CLIENT_ID
      - export GITHUB_CLIENT_SECRET=$TEST_GITHUB_CLIENT_SECRET

  build:
    commands:
      - echo "Running Lambda tests..."
      - ./deploy/lambda/tests/run-tests.sh --all
      - echo "Building Lambda binary..."
      - ./scripts/build-lambda.sh arm64

  post_build:
    commands:
      - echo "Tests completed successfully"

artifacts:
  files:
    - dist/lambda/miyabi-api-arm64.zip
  name: lambda-deployment-package

cache:
  paths:
    - '/root/.cargo/**/*'
    - 'target/**/*'
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Config Tests**: 90%
- **Handler Tests**: 85%
- **Integration Tests**: 80%
- **Overall**: 85%

### Coverage Reports
```bash
# Generate HTML coverage report
cargo tarpaulin --features lambda --out Html --output-dir coverage/

# View report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Environment Variables for CI/CD

Required environment variables for test execution:

```bash
# Database
DATABASE_URL=postgresql://test:test@localhost:5432/miyabi_test

# JWT
JWT_SECRET=test-jwt-secret-32-bytes-minimum!!

# GitHub OAuth
GITHUB_CLIENT_ID=test-client-id
GITHUB_CLIENT_SECRET=test-client-secret

# Optional
ENVIRONMENT=test
RUST_LOG=debug  # For verbose test output
```

## Troubleshooting

### Test Database Connection Failed
```bash
# Ensure PostgreSQL is running
docker run -d \
  --name miyabi-test-db \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=miyabi_test \
  -p 5432:5432 \
  postgres:15
```

### cargo-lambda Not Found
```bash
cargo install cargo-lambda
```

### Permission Denied on run-tests.sh
```bash
chmod +x deploy/lambda/tests/run-tests.sh
```

## Best Practices

1. **Run tests locally before pushing**
2. **Keep test database clean** - Use transactions or cleanup helpers
3. **Mock external services** - Don't call real GitHub/AWS APIs in tests
4. **Use meaningful test names** - Describe what is being tested
5. **Test both success and failure cases**
6. **Keep tests fast** - Unit tests < 1s, Integration tests < 5s

## Related Documentation

- [Lambda Deployment Guide](../../docs/LAMBDA_DEPLOYMENT.md)
- [Test Organization](./README.md)
- [GitHub Actions Workflows](../../../.github/workflows/)
