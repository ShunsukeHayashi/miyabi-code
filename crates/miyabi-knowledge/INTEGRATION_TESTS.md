# Integration Tests for miyabi-knowledge

This document describes the integration test suite for miyabi-knowledge and how to run it locally and in CI/CD.

## Overview

The integration tests verify the full knowledge management system with a real Qdrant vector database instance:

- **Full flow testing**: Index → Search → Cleanup
- **Parallel execution**: 10 agents indexing simultaneously
- **Incremental indexing**: Cache-based deduplication
- **Retention policy**: Automated cleanup

## Prerequisites

- **Docker** or **Docker Desktop** installed
- **Rust toolchain** (cargo)

## Running Tests Locally

### 1. Start Qdrant

```bash
cd crates/miyabi-knowledge
docker-compose -f docker-compose.test.yml up -d
```

This starts a Qdrant instance on `localhost:6333`.

### 2. Wait for Qdrant to be Ready

```bash
# Wait for healthcheck
docker-compose -f docker-compose.test.yml ps

# Or manually check
curl http://localhost:6333/
```

### 3. Run Integration Tests

```bash
# Run all integration tests (they are ignored by default)
cargo test --package miyabi-knowledge --test integration_tests -- --ignored

# Run specific test
cargo test --package miyabi-knowledge --test integration_tests test_full_flow_index_search_cleanup -- --ignored

# Run with output
cargo test --package miyabi-knowledge --test integration_tests -- --ignored --nocapture
```

### 4. Clean Up

```bash
docker-compose -f docker-compose.test.yml down
```

## CI/CD Integration (GitHub Actions)

### GitHub Actions Workflow

Add this to `.github/workflows/rust.yml`:

```yaml
name: Integration Tests

on:
  pull_request:
    paths:
      - 'crates/miyabi-knowledge/**'
  push:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      qdrant:
        image: qdrant/qdrant:v1.15.0
        ports:
          - 6333:6333
        options: >-
          --health-cmd "curl -f http://localhost:6333/ || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: actions-rust-lang/setup-rust-toolchain@v1

      - name: Wait for Qdrant
        run: |
          timeout 30 bash -c 'until curl -f http://localhost:6333/; do sleep 1; done'

      - name: Run Integration Tests
        run: |
          cargo test --package miyabi-knowledge --test integration_tests -- --ignored
```

### Alternative: Docker Compose in CI

```yaml
    steps:
      - uses: actions/checkout@v4

      - name: Start Qdrant
        run: |
          cd crates/miyabi-knowledge
          docker-compose -f docker-compose.test.yml up -d

      - name: Wait for Qdrant
        run: |
          timeout 30 bash -c 'until curl -f http://localhost:6333/; do sleep 1; done'

      - name: Run Integration Tests
        run: |
          cargo test --package miyabi-knowledge --test integration_tests -- --ignored

      - name: Stop Qdrant
        if: always()
        run: |
          cd crates/miyabi-knowledge
          docker-compose -f docker-compose.test.yml down
```

## Test Cases

### 1. Full Flow Test

**Test**: `test_full_flow_index_search_cleanup`

Verifies complete lifecycle:
1. Create KnowledgeManager
2. Index 3 entries
3. Search for entries
4. Filtered search by issue number
5. Retention policy cleanup

**Expected Duration**: <5 seconds

### 2. Parallel Execution Test

**Test**: `test_parallel_execution_10_agents`

Verifies concurrent indexing:
1. Spawn 10 agents
2. Each agent indexes 5 entries (50 total)
3. Verify all 50 entries indexed successfully
4. Search across all entries

**Expected Duration**: <10 seconds

### 3. Incremental Indexing Test

**Test**: `test_incremental_indexing_with_cache`

Verifies cache-based deduplication:
1. Index entries
2. Re-index same entries
3. Verify cache prevents duplicate work

**Expected Duration**: <5 seconds

### 4. Retention Policy Test

**Test**: `test_retention_policy_cleanup`

Verifies cleanup functionality:
1. Index entries
2. Run dry-run cleanup (no deletion)
3. Run actual cleanup
4. Verify entries deleted

**Expected Duration**: <5 seconds

## Success Criteria

✅ All tests pass in CI/CD
✅ Tests complete in <30 seconds total
✅ Code coverage ≥ 80% (measured separately)

## Troubleshooting

### "Qdrant not running" Error

**Solution**: Start Qdrant with Docker Compose:
```bash
docker-compose -f docker-compose.test.yml up -d
```

### Port 6333 Already in Use

**Solution**: Stop conflicting process or change port in `docker-compose.test.yml`:
```yaml
ports:
  - "6334:6333"  # Map host 6334 → container 6333
```

Then update `KnowledgeConfig` in tests to use port 6334.

### Tests Timeout

**Solution**: Increase Qdrant startup time:
```bash
# Wait longer for Qdrant
timeout 60 bash -c 'until curl -f http://localhost:6333/; do sleep 1; done'
```

### Permission Denied on Docker Socket

**Solution**: Ensure Docker daemon is running and user has permissions:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

## Manual Verification

### Check Qdrant Status

```bash
curl http://localhost:6333/collections
```

### View Qdrant Logs

```bash
docker-compose -f docker-compose.test.yml logs qdrant
```

### Access Qdrant Dashboard

Open browser to: http://localhost:6333/dashboard

---

**Last Updated**: 2025-10-27
**Miyabi Version**: 0.1.1
**Qdrant Version**: 1.15.0
