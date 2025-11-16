# Issue #2 Preparation - Phase 1 Full Workflow Test (18 Agents)

**Issue**: https://github.com/ShunsukeHayashi/multi_codex_Mugen_miyabi-orchestra/issues/2
**Depends On**: Issue #1 (API Rate Limiting System)
**Estimated Time**: 2-3 hours
**Priority**: P1

## 📋 Requirements Analysis

### Test Scope
- **Total Agents**: 18
  - MUGEN: 12 agents
  - MAJIN: 6 agents
- **Test Duration**: Minimum 1 hour continuous operation
- **Test File**: `tests/e2e/test_full_workflow_18.sh`

### Prerequisites (Must Complete First)
1. ✅ Issue #1 完了 (API Rate Limiting System)
2. ⏳ MUGEN SSH接続確認
3. ⏳ MAJIN SSH接続確認
4. ⏳ tmux設定確認
5. ⏳ モニタリングダッシュボード起動

## 🏗️ Test Architecture

### Infrastructure Layout
```
Local PC (Orchestrator)
    │
    ├─ SSH → MUGEN (12 agents)
    │   ├─ tmux session: miyabi-mugen
    │   ├─ Agent 1-6: Coding Agents
    │   └─ Agent 7-12: Business Agents
    │
    └─ SSH → MAJIN (6 agents)
        ├─ tmux session: miyabi-majin
        ├─ Agent 1-3: Coding Agents
        └─ Agent 4-6: Business Agents
```

### Test Phases
```
Phase 1: Setup (5 min)
├─ Verify SSH connectivity
├─ Create tmux sessions
├─ Setup monitoring
└─ Initialize cost tracking

Phase 2: Agent Startup (10 min)
├─ Start 12 agents on MUGEN
├─ Start 6 agents on MAJIN
└─ Verify all agents healthy

Phase 3: Load Test (60 min)
├─ Monitor API rate limits
├─ Track cost accumulation
├─ Collect metrics
└─ Watch for errors

Phase 4: Shutdown (5 min)
├─ Graceful agent termination
├─ Cleanup tmux sessions
├─ Generate test report
└─ Verify no orphan processes
```

## 🧪 Test Script Template

### Main Test Flow
```bash
#!/usr/bin/env bash
# tests/e2e/test_full_workflow_18.sh

set -euo pipefail

# Configuration
MUGEN_HOST="mugen.example.com"
MAJIN_HOST="majin.example.com"
MUGEN_AGENTS=12
MAJIN_AGENTS=6
TEST_DURATION=3600  # 1 hour

# Phase 1: Setup
setup_infrastructure() {
    echo "Phase 1: Infrastructure Setup..."
    verify_ssh_connectivity
    create_tmux_sessions
    initialize_monitoring
    initialize_cost_tracking
}

# Phase 2: Agent Startup
start_agents() {
    echo "Phase 2: Starting Agents..."
    start_mugen_agents "${MUGEN_AGENTS}"
    start_majin_agents "${MAJIN_AGENTS}"
    verify_all_agents_healthy
}

# Phase 3: Load Test
run_load_test() {
    echo "Phase 3: Running Load Test..."
    local start_time=$(date +%s)
    local end_time=$((start_time + TEST_DURATION))

    while [ $(date +%s) -lt ${end_time} ]; do
        monitor_api_limits
        track_costs
        collect_metrics
        check_for_errors
        sleep 60
    done
}

# Phase 4: Shutdown
cleanup() {
    echo "Phase 4: Cleanup..."
    terminate_agents
    cleanup_tmux_sessions
    generate_report
    verify_no_orphans
}

# Main execution
main() {
    setup_infrastructure
    start_agents
    run_load_test
    cleanup
}

main "$@"
```

## 📊 Success Criteria Checklist

### Infrastructure
- [ ] SSH connectivity to MUGEN: ✅
- [ ] SSH connectivity to MAJIN: ✅
- [ ] tmux sessions created: 2/2
- [ ] Monitoring dashboard active: ✅

### Agent Operations
- [ ] Agents started on MUGEN: 12/12
- [ ] Agents started on MAJIN: 6/6
- [ ] All agents healthy: 18/18
- [ ] Agents running > 1 hour: ✅

### API & Rate Limiting
- [ ] No 429 errors: ✅
- [ ] Rate limiting functional: ✅
- [ ] Request queueing works: ✅
- [ ] Key rotation works: ✅

### Monitoring & Costs
- [ ] Dashboard shows all agents: 18/18
- [ ] Metrics collected: ✅
- [ ] Cost tracking accurate: ✅
- [ ] Budget within limits: ✅

### Cleanup
- [ ] All agents terminated: 18/18
- [ ] tmux sessions cleaned: 2/2
- [ ] No orphan processes: ✅
- [ ] Test report generated: ✅

## 🚀 Execution Plan

### When Issue #1 Completes
1. Worker1 reports completion
2. Leader assigns Issue #2 to Worker1
3. Worker1 creates Worktree: `.worktrees/issue-2-phase1-test`
4. Worker1 implements test script
5. Worker1 verifies prerequisites
6. Worker1 executes test
7. Worker1 generates report
8. Worker1 creates PR

### Timeline Estimate
- Implementation: 1 hour
- Testing: 1-1.5 hours
- Documentation: 30 minutes
- **Total**: 2.5-3 hours

## 📝 Test Report Template

```markdown
# Phase 1 Full Workflow Test Report

**Date**: YYYY-MM-DD
**Duration**: X hours
**Status**: PASS/FAIL

## Summary
- Total Agents: 18 (MUGEN: 12, MAJIN: 6)
- Test Duration: X hours
- API Requests: XXX
- Total Cost: $XX.XX

## Results
### Infrastructure
- SSH Connectivity: ✅/❌
- tmux Sessions: ✅/❌
- Monitoring: ✅/❌

### Agents
- Startup Success: XX/18
- Runtime Errors: X
- Shutdown Success: XX/18

### API Operations
- Total Requests: XXX
- 429 Errors: X
- Rate Limit Hits: X
- Average Queue Time: X ms

### Costs
- Total API Cost: $XX.XX
- Cost per Agent: $X.XX
- Budget Utilization: XX%

## Issues Found
1. [List any issues]

## Recommendations
1. [List recommendations]
```

## 🔗 Dependencies

### From Issue #1
- scripts/api-rate-limiter.sh
- lib/api-monitor.sh
- lib/request-queue.sh
- config/api-limits.conf

### Existing Infrastructure
- scripts/master-orchestrator-200.sh
- scripts/health-monitor.sh
- lib/ssh-utils.sh
- lib/tmux-utils.sh

## 📚 References

- Project: multi_codex_Mugen_miyabi-orchestra
- Issue: #2
- Docs: PHASE1_CHECKLIST.md
- Docs: IMPLEMENTATION_GUIDE.md

---

**Status**: Preparation Complete, Waiting for Issue #1 | **Last Updated**: 2025-11-11
