# Miyabi End-to-End Workflow

**Version**: 1.0.0
**Created**: 2025-10-24
**Status**: Complete Documentation

---

## 📋 Overview

This document describes the complete end-to-end workflow of Miyabi, from Issue creation to Production deployment. The workflow demonstrates **100% autonomous operation** with zero human intervention required.

**Diagram**: [Miyabi End-to-End Workflow - Complete Sequence.png](Miyabi%20End-to-End%20Workflow%20-%20Complete%20Sequence.png)

**Total Duration**: 45 minutes (typical feature implementation)
**Automation Level**: 100%
**Quality Threshold**: 80/100 (auto-approve if exceeded)

---

## 🔄 The 9 Phases

### Phase 1: Issue Creation & Analysis

**Duration**: 2-3 minutes
**Agent**: IssueAgent
**Input**: GitHub Issue
**Output**: Issue analysis with labels

**Flow**:
1. Developer creates Issue #500 with title "Add user authentication"
2. GitHub webhook triggers Water Spider Orchestrator
3. Orchestrator checks for session conflicts in SQLite
4. IssueAgent executes:
   - Fetches issue data from GitHub API
   - Searches Qdrant for similar past issues
   - AI analysis determines:
     - Complexity: 8/10
     - Type: feature
     - Security sensitivity: High
   - Adds labels: `security:high`, `agent:codegen`, `estimated:16h`

**Key Decision Point**:
- Complexity < 5.0: Proceed autonomously
- Complexity 5.0-7.0: Notify human, proceed after 5 min
- Complexity > 7.0: **Escalate to human approval** (with Cline integration)

---

### Phase 2: Task Decomposition & DAG Creation

**Duration**: 3-5 minutes
**Agent**: CoordinatorAgent
**Input**: Issue analysis result
**Output**: Task DAG (Directed Acyclic Graph)

**Flow**:
1. CoordinatorAgent fetches full issue data
2. AI-powered decomposition creates 6 tasks:
   ```
   Task 1: Add User model
   Task 2: Add Auth middleware
   Task 3: Add JWT generation
   Task 4: Add Login endpoint
   Task 5: Add tests
   Task 6: Update docs
   ```
3. Build dependency graph (DAG):
   ```
   1 → (2, 3)  [parallel]
   2, 3 → 4
   4 → 5
   5 → 6
   ```
4. Store tasks in SQLite with metadata:
   - `task_id`, `issue_id`, `dependencies`
   - `estimated_duration`, `agent_type`
5. Post comment to Issue with decomposition summary
6. Update Issue label: `state:pending` → `state:implementing`

**Output**:
- **6 tasks** ready for execution
- **2 tasks** (2 & 3) can run in parallel
- **Critical path**: 1 → 2 → 4 → 5 → 6 (longest path)

---

### Phase 3: Worktree Creation & Agent Assignment

**Duration**: 30 seconds
**Component**: WorktreeManager
**Input**: Issue number
**Output**: Isolated Git worktree

**Flow**:
1. WorktreeManager executes:
   ```bash
   git worktree add .worktrees/issue-500 -b feature/issue-500
   ```
2. Creates context files in worktree:
   - `.agent-context.json` (machine-readable)
     ```json
     {
       "agentType": "CodeGenAgent",
       "task": {
         "id": "task-500-1",
         "title": "Add User model",
         "dependencies": []
       },
       "issue": {
         "number": 500,
         "title": "Add user authentication"
       }
     }
     ```
   - `EXECUTION_CONTEXT.md` (human-readable)
     ```markdown
     # Execution Context for Issue #500

     **Agent**: CodeGenAgent
     **Task**: Add User model (1/6)
     **Issue**: #500 - Add user authentication
     ```

**Benefits of Worktree Isolation**:
- ✅ Multiple tasks execute in parallel without file conflicts
- ✅ Independent debugging per worktree
- ✅ Easy rollback (just remove worktree)
- ✅ Clean separation of concerns

---

### Phase 4: Claude Code Execution (Task 1: User Model)

**Duration**: 8-10 minutes
**Component**: Claude Code + CodeGenAgent
**Input**: Task specification
**Output**: Generated code + tests

**Flow**:
1. Orchestrator starts Claude Code session in worktree:
   ```bash
   cd .worktrees/issue-500
   claude code --context .agent-context.json
   ```
2. Claude Code reads:
   - `.agent-context.json` (task details)
   - `.claude/agents/prompts/coding/codegen-agent-prompt.md` (execution instructions)
3. CodeGenAgent executes:
   ```rust
   // crates/miyabi-types/src/user.rs
   #[derive(Debug, Clone, Serialize, Deserialize)]
   pub struct User {
       pub id: Uuid,
       pub email: String,
       pub password_hash: String,
       pub created_at: DateTime<Utc>,
   }

   impl User {
       pub fn new(email: String, password: String) -> Result<Self> {
           // Implementation...
       }
   }

   #[cfg(test)]
   mod tests {
       use super::*;

       #[test]
       fn test_user_creation() {
           // Test implementation...
       }
   }
   ```
4. Run quality checks:
   ```bash
   cargo test --package miyabi-types
   cargo fmt
   cargo clippy
   ```
5. Git commit:
   ```
   feat(types): add User model

   - Define User struct
   - Add authentication fields
   - Implement validation

   Closes #500 (task 1/6)
   ```
6. Index execution log in Qdrant for future RAG queries

**Output**:
- **AgentResult**:
  - Status: Success
  - Files created: 1
  - Tests passed: 5
  - Clippy warnings: 0

---

### Phase 5: Parallel Execution (Tasks 2 & 3)

**Duration**: 10-15 minutes (parallel)
**Component**: Multiple Claude Code sessions
**Input**: Independent tasks
**Output**: Two completed tasks simultaneously

**Flow**:

**Task 2 (Auth Middleware)**:
```bash
# Worktree: .worktrees/issue-500-task2
cd .worktrees/issue-500-task2
# Implement crates/miyabi-core/src/auth.rs
```

**Task 3 (JWT Generation)** (parallel):
```bash
# Worktree: .worktrees/issue-500-task3
cd .worktrees/issue-500-task3
# Implement crates/miyabi-core/src/jwt.rs
```

**Parallelism Benefits**:
- ⚡ **50% faster execution** (2 tasks in parallel vs sequential)
- 🔒 **No file conflicts** (separate worktrees)
- 🎯 **Independent progress tracking** (each task has own status)

**Synchronization**:
- Both tasks must complete before Task 4 can start
- WorktreeManager tracks task dependencies via DAG
- Orchestrator waits for all `WAITING_FOR` dependencies

---

### Phase 6: Review & Quality Check

**Duration**: 3-5 minutes
**Agent**: ReviewAgent
**Input**: All completed tasks in worktree
**Output**: Quality report with 0-100 score

**Flow**:
1. ReviewAgent executes in worktree:
   ```bash
   cargo clippy --all-targets      # Linting
   cargo audit                      # Security scan
   cargo test --all                 # Test suite
   cargo doc --no-deps              # Documentation check
   ```

2. Calculate quality score (100-point scale):
   ```
   Tests coverage:      95% → 35/35 points
   Clippy warnings:     0   → 25/25 points
   Security (CVEs):     0   → 20/20 points
   Documentation:       100%→ 20/20 points
   ─────────────────────────────────────
   Total Score:              100/100 ⭐
   ```

3. Generate quality report:
   ```json
   {
     "score": 100,
     "breakdown": {
       "tests": 35,
       "clippy": 25,
       "security": 20,
       "docs": 20
     },
     "recommendation": "APPROVE",
     "issues": []
   }
   ```

4. Post comment to Issue:
   ```markdown
   ✅ Quality Report #500
   ⭐ Score: 100/100
   ✓ All checks passed
   ✓ No security vulnerabilities
   ✓ 95% test coverage
   ```

5. Add label: `quality:excellent` (score >= 90)

**Decision Logic**:
- Score >= 80: Auto-approve, proceed to PR
- Score 60-79: Request human review (with Cline integration)
- Score < 60: Block PR, re-execute tasks

---

### Phase 7: PR Creation

**Duration**: 2-3 minutes
**Agent**: PRAgent
**Input**: Worktree with completed tasks
**Output**: GitHub Pull Request

**Flow**:
1. WorktreeManager pushes branch:
   ```bash
   git push origin feature/issue-500
   ```

2. PRAgent creates PR via GitHub API:
   ```markdown
   **Title**: feat: Add user authentication (#500)

   ## Summary
   - Added User model with validation
   - Implemented JWT authentication
   - Added Auth middleware
   - 100% test coverage
   - Zero security vulnerabilities

   ## Quality Report
   ⭐ Score: 100/100
   ✓ Security audit passed
   ✓ All tests passing

   ## Checklist
   - [x] Tests added
   - [x] Documentation updated
   - [x] Clippy warnings fixed
   - [x] Security scan passed

   Closes #500
   ```

3. Link PR to Issue:
   ```
   POST /repos/{owner}/{repo}/issues/500/comments
   {
     "body": "🎉 Pull Request created: #501"
   }
   ```

**PR Labels** (auto-applied):
- `type:feature`
- `priority:P1-High`
- `quality:excellent`
- `ready-to-merge`

---

### Phase 8: CI/CD & Deployment

**Duration**: 10-15 minutes
**Agent**: DeploymentAgent
**Input**: Merged PR
**Output**: Production deployment

**Flow**:

#### CI Checks (GitHub Actions)
```yaml
- cargo test --all
- cargo clippy -- -D warnings
- cargo audit
- cargo build --release
```
**Result**: All checks passed ✅

#### Auto-Merge
- Quality score >= 90 → **Auto-merge enabled**
- PR #501 merged to main branch

#### Deployment to Staging
```bash
# DeploymentAgent executes:
cargo build --release
docker build -t miyabi:latest .
docker push ghcr.io/miyabi/miyabi:latest
kubectl apply -f k8s/staging/
```

**Health Check**:
```bash
curl https://staging.miyabi.dev/health
# Response: 200 OK
```

#### Deployment to Production
```bash
kubectl apply -f k8s/production/
kubectl rollout status deployment/miyabi-api
```

**Health Check**:
```bash
curl https://miyabi.dev/health
# Response: 200 OK
```

**Rollback Preparation**:
- Previous version tagged: `v1.2.3` → `v1.2.4`
- Rollback command ready: `kubectl rollout undo deployment/miyabi-api`

---

### Phase 9: Cleanup & Notification

**Duration**: 1 minute
**Component**: Orchestrator + WorktreeManager
**Input**: Successful deployment
**Output**: Closed issue, cleaned worktree

**Flow**:

1. **Close Issue**:
   ```
   PATCH /repos/{owner}/{repo}/issues/500
   {
     "state": "closed",
     "labels": ["state:done"]
   }
   ```

2. **Post Summary Comment**:
   ```markdown
   ✅ Deployed to production

   **Metrics**:
   - ⏱ Total time: 45 minutes
   - 🎯 Quality score: 100/100
   - 🚀 Deployments: Staging + Production
   - ✓ Health checks: Passed

   **Timeline**:
   - Issue created: 2025-10-24 10:00
   - Tasks completed: 10:30
   - PR merged: 10:35
   - Deployed: 10:45
   ```

3. **Cleanup Worktree**:
   ```bash
   git worktree remove .worktrees/issue-500
   git branch -d feature/issue-500  # Local cleanup
   ```

4. **Update Database**:
   ```sql
   UPDATE sessions
   SET status='completed',
       completion_time=NOW(),
       duration_sec=2700  -- 45 minutes
   WHERE issue_number=500;
   ```

5. **Send Notification**:
   - Email to developer
   - Slack notification (if configured)
   - GitHub notification (automatic)

**Final State**:
- ✅ Issue closed
- ✅ PR merged
- ✅ Deployed to production
- ✅ Worktree cleaned up
- ✅ Knowledge base updated

---

## 🎯 Success Metrics

### Time Metrics

| Phase | Duration | % of Total |
|-------|----------|------------|
| 1. Issue Analysis | 2-3 min | 5% |
| 2. Task Decomposition | 3-5 min | 8% |
| 3. Worktree Creation | 30 sec | 1% |
| 4. Code Generation (Task 1) | 8-10 min | 20% |
| 5. Parallel Execution (Tasks 2-3) | 10-15 min | 30% |
| 6. Quality Review | 3-5 min | 8% |
| 7. PR Creation | 2-3 min | 5% |
| 8. CI/CD & Deployment | 10-15 min | 30% |
| 9. Cleanup | 1 min | 2% |
| **Total** | **~45 min** | **100%** |

### Quality Metrics

- **Quality Score**: 100/100
- **Test Coverage**: 95%
- **Clippy Warnings**: 0
- **Security Vulnerabilities**: 0
- **Documentation Coverage**: 100%

### Automation Metrics

- **Human Intervention**: 0 (zero-touch)
- **Manual Steps**: 0
- **Auto-Merge Rate**: 100% (score >= 90)
- **Deployment Success Rate**: 100%

---

## 🔄 Parallel Execution Details

### Example: 3 Issues in Parallel

```
Issue #500 (Auth)          → Worktree: .worktrees/issue-500
Issue #501 (Dashboard)     → Worktree: .worktrees/issue-501
Issue #502 (API Endpoint)  → Worktree: .worktrees/issue-502
```

**Timeline** (all running simultaneously):
```
Time    | Issue #500        | Issue #501        | Issue #502
--------|-------------------|-------------------|-------------------
10:00   | Analysis          | Analysis          | Analysis
10:03   | Decomposition     | Decomposition     | Decomposition
10:08   | Task 1 exec       | Task 1 exec       | Task 1 exec
10:18   | Tasks 2&3 exec    | Tasks 2&3 exec    | Tasks 2&3 exec
10:33   | Review            | Review            | Review
10:38   | PR creation       | PR creation       | PR creation
10:41   | Deployment        | Deployment        | Deployment
10:56   | Done ✅           | Done ✅           | Done ✅
```

**Benefits**:
- ⚡ **3x throughput** (3 issues in same time as 1)
- 🔒 **No conflicts** (separate worktrees)
- 🎯 **Independent tracking** (per-issue status)

---

## 🛡️ Error Handling & Recovery

### Automatic Retry Logic

**Transient Errors** (3 retries):
- Network timeouts
- API rate limits
- Temporary service unavailability

**Example**:
```rust
pub async fn execute_with_retry(task: Task) -> Result<AgentResult> {
    for attempt in 1..=3 {
        match execute_task(task).await {
            Ok(result) => return Ok(result),
            Err(e) if e.is_transient() => {
                sleep(Duration::from_secs(2_u64.pow(attempt))).await;
                continue;
            }
            Err(e) => return Err(e),
        }
    }
}
```

### Escalation Triggers

**Automatic Escalation** (to human via Cline):
- Complexity score > 7.0
- Quality score < 60
- Security vulnerability detected (Critical/High)
- Deployment failure (after 3 retries)
- Compilation errors (after 3 attempts)

**Escalation Format**:
```json
{
  "type": "escalation",
  "severity": "high",
  "issue": 500,
  "reason": "Quality score below threshold (58/100)",
  "context": {
    "failing_checks": ["clippy: 12 warnings", "tests: 2 failures"],
    "recommendation": "Manual code review required"
  },
  "actions": [
    {"id": "approve_anyway", "label": "Approve & Continue (override)"},
    {"id": "manual_fix", "label": "Open in Cline for manual fix"},
    {"id": "reject", "label": "Reject & Close Issue"}
  ]
}
```

### Rollback Scenarios

**Automatic Rollback** triggers:
- Health check failure (3 consecutive failures)
- Error rate > 5% (within 5 minutes of deployment)
- Response time > 2x baseline

**Rollback Process**:
```bash
# 1. Detect issue
curl https://miyabi.dev/health | grep "500 Internal Server Error"

# 2. Automatic rollback
kubectl rollout undo deployment/miyabi-api

# 3. Verify rollback
kubectl rollout status deployment/miyabi-api
curl https://miyabi.dev/health  # Should return 200 OK

# 4. Notify team
gh issue comment 500 "⚠️ Rolled back due to health check failure"
```

---

## 📊 Observability & Monitoring

### Metrics Collected

**Per-Phase Metrics**:
- Execution time (seconds)
- Success rate (%)
- Error count
- Retry count

**Agent Metrics**:
- Agent type distribution
- Average execution time per agent
- Success rate by agent
- Quality scores by agent

**System Metrics**:
- Concurrent sessions (active worktrees)
- Queue depth (pending tasks)
- Throughput (issues/hour)
- Resource utilization (CPU, memory, disk)

### Logging & Tracing

**Log Levels**:
```
DEBUG: Detailed execution steps
INFO:  Phase completions, agent results
WARN:  Retry attempts, degraded performance
ERROR: Failures, escalations, rollbacks
```

**Log Storage**:
- `.ai/logs/YYYY-MM-DD.md` (markdown format)
- Indexed in Qdrant (vector search)
- Searchable via `miyabi knowledge search`

**Example Log Entry**:
```markdown
## 2025-10-24 10:18:32 - Task Execution

**Agent**: CodeGenAgent
**Task**: task-500-1 (Add User model)
**Status**: Success
**Duration**: 8m 23s
**Quality**: 100/100

### Actions
- Created: crates/miyabi-types/src/user.rs (234 lines)
- Tests: 5 passed, 0 failed
- Clippy: 0 warnings
- Commit: feat(types): add User model
```

---

## 🔗 Related Documentation

- **Crates Architecture**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md)
- **Water Spider Orchestrator**: [WATER_SPIDER_INDEX.md](WATER_SPIDER_INDEX.md)
- **Agent Specifications**: `.claude/agents/specs/coding/*.md`
- **Worktree Protocol**: [WORKTREE_PROTOCOL.md](../../WORKTREE_PROTOCOL.md)
- **Entity-Relation Model**: [ENTITY_RELATION_INDEX.md](ENTITY_RELATION_INDEX.md)
- **Cline Integration**: [CLINE_INTEGRATION_ROADMAP.md](CLINE_INTEGRATION_ROADMAP.md)

---

## 🎨 Diagram Legend

**Sequence Diagram Notation**:
- `→` Synchronous call (wait for response)
- `-->` Asynchronous response
- `||` Parallel execution
- `activate/deactivate` Lifeline activation

**Components**:
- **Actor** (stick figure): Human user
- **Participant** (box): Service/Agent
- **Database** (cylinder): Persistent storage
- **Note**: Explanatory text

---

## 🔄 Variations & Customization

### High-Complexity Issues (Score > 7.0)

**Modified Flow**:
1. Phase 1-2: Same as standard flow
2. **Phase 2.5: Human Approval** (NEW)
   - Escalation notification sent
   - Cline UI opens automatically (if installed)
   - Human reviews task decomposition
   - Approves/rejects/modifies tasks
3. Phase 3-9: Continue as standard

**Timeline**: +5-30 minutes (depending on human response time)

### Low-Complexity Issues (Score < 3.0)

**Optimized Flow**:
- Skip task decomposition (single task)
- Skip parallel execution (no need)
- Auto-approve without ReviewAgent (if score > 90)

**Timeline**: ~20 minutes (55% faster)

### Emergency Hotfixes

**Fast-Track Flow**:
- Priority: P0-Critical
- Skip parallelization (focus on single fix)
- Deploy to production immediately (skip staging)
- Human notification: Immediate (Slack ping)

**Timeline**: ~15 minutes (67% faster)

---

## 📝 Conclusion

The Miyabi end-to-end workflow demonstrates:

**100% Automation**:
- Zero human intervention required
- Quality-driven decision making
- Automatic error recovery

**High Throughput**:
- 45 minutes per feature (average)
- Unlimited parallel execution
- 3x faster with worktree isolation

**Production-Ready**:
- Comprehensive quality checks
- Automated deployment
- Health monitoring & rollback

**Knowledge-Driven**:
- Learn from past executions (Qdrant RAG)
- Improve over time (ML-based thresholds)
- Context-aware decision making

**Human-in-the-Loop** (optional, via Cline integration):
- Escalate complex decisions
- Interactive debugging
- Manual override capability

---

**Last Updated**: 2025-10-24
**Diagram**: Miyabi End-to-End Workflow - Complete Sequence.png (414 KB)
**Total Phases**: 9
**Average Duration**: 45 minutes
**Automation Level**: 100%
