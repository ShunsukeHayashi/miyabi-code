# Dashboard Design Specification

**Issue**: #891
**Priority**: P0 Critical
**Created**: 2025-11-16

---

## 📊 Overview

The `/dashboard` slash command provides a comprehensive real-time view of Miyabi's operational status, combining GitHub metrics, task queue status, coordinator health, and deployment information.

## 🎯 Display Metrics

### 1. Issues (GitHub API)
**Source**: `miyabi-github` crate + GitHub API

**Metrics**:
- Total open issues
- By state:
  - `state:pending` - Awaiting assignment
  - `state:in_progress` - Currently being worked on
  - `state:review` - Under review
  - `state:blocked` - Blocked by dependencies
- By priority:
  - P0 Critical
  - P1 High
  - P2 Medium
- Recent activity (last 24h)

**Data Collection**:
```rust
let client = GitHubClient::new(token, owner, repo)?;
let issues = client.get_issues_by_state(IssueState::InProgress).await?;
let p0_issues = client.get_issues_by_label("priority:P0").await?;
```

### 2. Task Queue (miyabi CLI)
**Source**: `miyabi task status` command

**Metrics**:
- Pending tasks
- Running tasks
- Completed tasks (today)
- Failed tasks
- Average completion time

**Data Collection**:
```bash
miyabi task status --json
```

### 3. Worktrees (Git + miyabi CLI)
**Source**: `miyabi worktree list` command

**Metrics**:
- Total active worktrees
- By issue number
- Disk usage per worktree
- Stale worktrees (> 7 days old)

**Data Collection**:
```bash
miyabi worktree list --json
git worktree list --porcelain
```

### 4. Pull Requests (GitHub API)
**Source**: `miyabi-github` crate

**Metrics**:
- Open PRs
- Draft PRs
- PRs awaiting review
- Merged PRs (last 7 days)
- Average merge time

**Data Collection**:
```rust
let prs = client.list_pull_requests(Some("open")).await?;
let draft_prs = prs.iter().filter(|pr| pr.draft).count();
```

### 5. Coordinators Health (miyabi CLI)
**Source**: `miyabi coordinator health` command (newly implemented)

**Metrics**:
- MUGEN status (✅/🟡/🔴/⚫)
- MAJIN status
- CPU/Memory/Disk usage
- Active sessions
- Capacity utilization

**Data Collection**:
```bash
miyabi coordinator health --json
```

### 6. Deployment Status (Future)
**Source**: Firebase/Cloud deployment logs

**Metrics**:
- Last deployment time
- Deployment status (success/failed)
- Active environments
- Rollback status

**Data Collection** (placeholder):
```bash
# Future: miyabi deploy status --json
# For now: Check git tags / firebase logs
```

### 7. Quality Metrics (Future)
**Source**: Code analysis tools

**Metrics**:
- Test coverage %
- Clippy warnings
- Build time
- Cargo audit alerts

**Data Collection**:
```bash
cargo test --all -- --test-threads=1 | grep "test result"
cargo clippy --all -- -D warnings 2>&1 | grep warning | wc -l
```

---

## 📐 Dashboard Layout

### Summary View (Default)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎯 Miyabi Dashboard - Summary View               ┃
┃  Updated: 2025-11-16 14:30:45                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📋 ISSUES                              🔄 TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open: 42                               Pending: 8
├─ P0 Critical:  3 ⚠️                  Running: 2
├─ P1 High:     12                     Completed (today): 15
└─ P2 Medium:   27                     Failed: 0

By State:                              Avg Completion: 2.5h
├─ pending:      15
├─ in_progress:  10
├─ review:        8
└─ blocked:       3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌳 WORKTREES                           🔀 PULL REQUESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active: 12                             Open: 8
Disk: 45.2 GB                          ├─ Draft: 3
Stale (>7d): 2 ⚠️                      └─ Ready: 5

Recent:                                Merged (7d): 12
├─ issue-891 (dashboard)               Avg merge time: 4.2h
├─ issue-890 (deploy-exec)
└─ phase-2.1-lark-sync

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏥 COORDINATORS                        🚀 DEPLOYMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MUGEN:  ✅ Healthy (Score: 95)         Status: ✅ Deployed
├─ CPU:    25.3%                       Last: 2h ago
├─ Memory: 45.2%                       Environment: production
└─ Disk:   38.7%                       Version: v2.0.0

MAJIN:  ✅ Healthy (Score: 92)
├─ CPU:    18.5%
├─ Memory: 52.1%
└─ Disk:   42.3%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Quick Actions:
  1. /dashboard --detailed   - Show detailed metrics
  2. /dashboard --watch      - Watch mode (refresh every 10s)
  3. miyabi status --watch   - Full system status
```

### Detailed View (`--detailed` flag)

Shows expanded information for each section with:
- Individual issue list (top 10 by priority)
- Detailed task queue with task IDs
- Worktree details with branches and commit info
- PR details with review status
- Coordinator metrics with load averages
- Historical trends (if available)

### Watch Mode (`--watch` flag)

Continuously refreshes dashboard every 10 seconds in terminal.

---

## 🔧 Implementation Plan

### Phase 1: Slash Command ✅
**File**: `.claude/commands/dashboard.md`

Create MCP slash command that:
1. Accepts flags: `--detailed`, `--watch`, `--json`
2. Calls background script
3. Formats output

### Phase 2: Background Script ✅
**File**: `scripts/dashboard-bg.sh`

Bash script that:
1. Collects data from all sources
2. Aggregates into JSON structure
3. Outputs formatted display
4. Handles errors gracefully

**Data Collection Functions**:
```bash
collect_issues() {
  # Use gh CLI or miyabi-github
  gh issue list --json number,title,state,labels --limit 100
}

collect_tasks() {
  miyabi task status --json
}

collect_worktrees() {
  miyabi worktree list --json
}

collect_prs() {
  gh pr list --json number,title,state,isDraft,createdAt
}

collect_coordinator_health() {
  miyabi coordinator health --json
}

collect_deployment_status() {
  # Placeholder - check git tags
  git describe --tags --abbrev=0
}
```

### Phase 3: Termux Shortcut (Optional)
**File**: `~/termux-shortcuts/dashboard.sh`

Termux shortcut widget for quick access on Android.

---

## 📦 Data Structure (JSON)

```json
{
  "timestamp": "2025-11-16T14:30:45Z",
  "issues": {
    "total_open": 42,
    "by_priority": {
      "P0": 3,
      "P1": 12,
      "P2": 27
    },
    "by_state": {
      "pending": 15,
      "in_progress": 10,
      "review": 8,
      "blocked": 3
    },
    "recent_24h": 5
  },
  "tasks": {
    "pending": 8,
    "running": 2,
    "completed_today": 15,
    "failed": 0,
    "avg_completion_hours": 2.5
  },
  "worktrees": {
    "total": 12,
    "disk_gb": 45.2,
    "stale_count": 2,
    "recent": [
      {"path": ".worktrees/issue-891", "issue": 891},
      {"path": ".worktrees/issue-890", "issue": 890}
    ]
  },
  "pull_requests": {
    "open": 8,
    "draft": 3,
    "ready_for_review": 5,
    "merged_7d": 12,
    "avg_merge_hours": 4.2
  },
  "coordinators": {
    "mugen": {
      "status": "healthy",
      "score": 95,
      "cpu_percent": 25.3,
      "memory_percent": 45.2,
      "disk_percent": 38.7
    },
    "majin": {
      "status": "healthy",
      "score": 92,
      "cpu_percent": 18.5,
      "memory_percent": 52.1,
      "disk_percent": 42.3
    }
  },
  "deployment": {
    "status": "deployed",
    "last_deployment": "2h ago",
    "environment": "production",
    "version": "v2.0.0"
  }
}
```

---

## ✅ Success Criteria

1. **Functional**:
   - ✅ `/dashboard` command executes without errors
   - ✅ All metrics display correctly
   - ✅ JSON output is valid and parseable
   - ✅ Watch mode refreshes properly

2. **Performance**:
   - ✅ Dashboard loads in < 3 seconds
   - ✅ No hanging on network failures
   - ✅ Graceful degradation if data unavailable

3. **Usability**:
   - ✅ Clear, readable output
   - ✅ Color-coded status indicators
   - ✅ Actionable quick actions suggested
   - ✅ Works on both Mac and Termux

---

## 🔄 Future Enhancements

1. **Historical Trends**: Store metrics in SQLite, show 7-day trends
2. **Alerts**: Notify when P0 issues increase or coordinators degrade
3. **Custom Views**: Filter by agent, priority, or time range
4. **Web Dashboard**: Host as web page with live updates
5. **Notifications**: Lark/LINE integration for critical status changes

---

**Status**: Design Complete ✅
**Next**: Implement Phase 2 (Slash Command)
