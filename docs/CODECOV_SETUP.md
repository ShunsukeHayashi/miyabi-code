# Codecov Integration Setup Guide

**Date**: 2025-10-24
**Issue**: #460 - Coverage Report Integration
**Status**: ✅ Workflow Created, Requires Token Configuration

---

## 📋 Overview

This document provides instructions for setting up Codecov integration with the Miyabi project to automatically track code coverage across all Rust crates.

---

## 🚀 Setup Steps

### Step 1: Create Codecov Account

1. Visit https://codecov.io/
2. Sign in with GitHub account
3. Authorize Codecov to access `customer-cloud/miyabi-private` repository

### Step 2: Generate Codecov Token

1. Navigate to repository settings in Codecov
2. Go to **Settings** → **General** → **Repository Upload Token**
3. Copy the upload token (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Add GitHub Secret

1. Go to https://github.com/customer-cloud/miyabi-private/settings/secrets/actions
2. Click **New repository secret**
3. Name: `CODECOV_TOKEN`
4. Value: Paste the token from Step 2
5. Click **Add secret**

### Step 4: Verify Workflow

After adding the token:

```bash
# Push a commit to trigger the coverage workflow
git push origin main

# Check workflow status
gh run list --workflow=coverage.yml --limit 5

# View latest run
gh run view --web
```

---

## 📊 Coverage Workflow Features

### Automatic Triggers
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Pull requests to `main` or `develop`

### Coverage Tools
- **Tool**: `cargo-tarpaulin` (v0.31+)
- **Format**: Cobertura XML
- **Exclusions**: tests/, benches/, examples/ directories

### Quality Gates
- ⚠️ **Threshold**: 80% minimum coverage
- ❌ **CI Fails**: If coverage drops below 80%
- ✅ **Pass**: Coverage ≥ 80%

### Reports
- **Upload**: Automatic to Codecov
- **Badge**: Displayed in README.md
- **Verbose Logging**: Enabled for debugging

---

## 🔧 Workflow Configuration

**File**: `.github/workflows/coverage.yml`

```yaml
name: Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Install cargo-tarpaulin
        run: cargo install cargo-tarpaulin --locked

      - name: Generate coverage report
        run: |
          cargo tarpaulin \
            --all-features \
            --workspace \
            --timeout 300 \
            --out Xml \
            --exclude-files 'crates/*/tests/*' \
            --exclude-files 'crates/*/benches/*' \
            --exclude-files 'crates/*/examples/*'

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./cobertura.xml
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}
          verbose: true

      - name: Check coverage threshold
        run: |
          COVERAGE=$(grep -oP 'line-rate="\K[^"]+' cobertura.xml | head -1)
          COVERAGE_PERCENT=$(awk "BEGIN {print $COVERAGE * 100}")
          echo "Current coverage: ${COVERAGE_PERCENT}%"

          if (( $(awk "BEGIN {print ($COVERAGE_PERCENT < 80)}") )); then
            echo "❌ Coverage is below 80% threshold (current: ${COVERAGE_PERCENT}%)"
            exit 1
          else
            echo "✅ Coverage meets 80% threshold (current: ${COVERAGE_PERCENT}%)"
          fi
```

---

## 📈 Expected Coverage by Crate

| Crate | Expected Coverage | Priority |
|-------|-------------------|----------|
| **miyabi-types** | 90%+ | Critical |
| **miyabi-core** | 85%+ | Critical |
| **miyabi-github** | 80%+ | High |
| **miyabi-agents** | 75%+ | High |
| **miyabi-cli** | 70%+ | Medium |
| **miyabi-worktree** | 85%+ | High |
| **miyabi-llm** | 80%+ | High |
| **miyabi-web-api** | 75%+ | Medium |

**Overall Target**: 80% workspace coverage

---

## 🐛 Troubleshooting

### Issue 1: "Invalid token" Error

**Symptom**:
```
Error: Codecov token is invalid
```

**Solution**:
1. Verify token is correct in Codecov settings
2. Ensure `CODECOV_TOKEN` secret is added to GitHub
3. Check token has not expired

### Issue 2: Coverage Report Not Generated

**Symptom**:
```
Error: cobertura.xml not found
```

**Solution**:
1. Check `cargo tarpaulin` installed successfully
2. Verify Rust stable toolchain is available
3. Check workspace builds without errors

### Issue 3: CI Fails on Coverage Threshold

**Symptom**:
```
❌ Coverage is below 80% threshold (current: 65%)
```

**Solution**:
1. Add more unit tests to under-tested crates
2. Remove dead code (uncovered code)
3. Consider adjusting threshold temporarily (not recommended)

---

## 📋 README Badge

The Codecov badge is automatically updated in README.md:

```markdown
[![codecov](https://codecov.io/gh/customer-cloud/miyabi-private/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/customer-cloud/miyabi-private)
```

**Note**: Replace `YOUR_CODECOV_TOKEN` with the actual badge token from Codecov settings (different from upload token).

---

## ✅ Verification Checklist

After setup:

- [ ] Codecov account created and repository authorized
- [ ] `CODECOV_TOKEN` secret added to GitHub
- [ ] Coverage workflow file exists (`.github/workflows/coverage.yml`)
- [ ] Workflow triggered successfully on push
- [ ] Coverage report uploaded to Codecov
- [ ] Badge displays in README.md
- [ ] Coverage threshold check passes (≥80%)

---

## 🔗 Related Resources

- **Codecov Documentation**: https://docs.codecov.com/docs
- **cargo-tarpaulin**: https://github.com/xd009642/tarpaulin
- **GitHub Actions Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Issue #460**: https://github.com/customer-cloud/miyabi-private/issues/460

---

## 📊 Current Status

**Workflow**: ✅ Created
**Token**: ⏳ Requires user configuration
**Badge**: ✅ Updated in README
**Threshold**: ✅ Set to 80%
**First Run**: ⏳ Pending token setup

---

**Created by**: Water Spider Orchestrator
**Date**: 2025-10-24
**Issue**: #460 - [P2-009] Coverage Report Integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
