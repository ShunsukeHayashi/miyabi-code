# CI/CD Pipeline - Coordination Integration

**Skill**: ci-cd-pipeline
**Category**: Development
**Dependencies**: docker-compose-workflow, rust-development
**Dependents**: aws-ec2-management (deploy), objective-observation-reporting

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| rust-development | Build/test pass | Run CI workflow |
| docker-compose-workflow | Container ready | Deploy workflow |
| miyabi-worktree-management | PR merged | Release workflow |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| docker-compose-workflow | Build artifacts ready | `CI_BUILD_READY: {commit}` |
| aws-ec2-management | Deploy starting | `CI_DEPLOY_START: {env}` |
| objective-observation-reporting | Pipeline complete | `CI_COMPLETE: {status}` |

---

## Resource Sharing

### Produces
```yaml
- type: build_artifact
  data:
    commit: "abc123"
    artifacts: ["target/release/miyabi", "dist/*.tar.gz"]
    status: "success"
```

### Consumes
```yaml
- type: test_results
  from: rust-development
- type: container_image
  from: docker-compose-workflow
```

---

## Communication Protocol

### Status Report Format
```
[CI-CD] {STATUS}: {workflow_name} - {details}
```

### Examples
```bash
# Report to coordination layer
tmux send-keys -t %1 '[CI-CD] COMPLETE: rust-ci - All checks passed' && sleep 0.5 && tmux send-keys -t %1 Enter

# Signal to dependent skills
tmux send-keys -t %1 '[CI-CD->DOCKER] BUILD_READY: abc123' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Full CI/CD Pipeline
```
rust-development [SIGNAL: TESTS_PASS]
    |
    v
ci-cd-pipeline [START]
    |
    +---> Lint check
    +---> Security scan
    +---> Build artifacts
    |
    v
docker-compose-workflow [SIGNAL: CI_BUILD_READY]
    |
    v
aws-ec2-management [SIGNAL: CI_DEPLOY_START]
    |
    v
objective-observation-reporting [SIGNAL: CI_COMPLETE]
```

### Sequence: PR Validation
```
miyabi-worktree-management [PR created]
    |
    v
ci-cd-pipeline [PR checks]
    |
    +--[Pass]--> [Ready for merge]
    +--[Fail]--> objective-observation-reporting
```

---

## Momentum Multiplier

### Optimization 1: Matrix Builds
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    rust: [stable, nightly]
# Multiplier: 4x test coverage
```

### Optimization 2: Parallel Jobs
```yaml
jobs:
  build: ...
  test: ...
  lint: ...
# Run concurrently for 3x faster completion
```

### Optimization 3: Caching
```yaml
- uses: Swatinem/rust-cache@v2
# Reduces build time by 50-70%
```

---

## Health Check Integration

```bash
# Monitor workflow status
check_ci_health() {
    local status=$(gh run list --limit 1 --json status -q '.[0].status')
    if [ "$status" = "failure" ]; then
        # Trigger recovery
        echo "[CI-CD] HEALTH_FAIL: Last workflow failed"
        # Signal to objective-observation-reporting
    fi
}
```

---

## Perpetual Activation

### Auto-triggers
- On git push to main/develop: Full CI pipeline
- On PR open/sync: PR validation pipeline
- On tag push: Release pipeline
- On schedule (daily): Security scan pipeline

### Feedback Loop
```
ci-cd-pipeline --> rust-development (quality metrics)
                       |
                       v
                   [Improve code quality]
                       |
                       v
                   ci-cd-pipeline (revalidate)
```
