# Miyabi Worktree Management - Coordination Integration

**Skill**: miyabi-worktree-management
**Category**: Coordination (Development)
**Dependencies**: None
**Dependents**: miyabi-agent-orchestration, codex-danger-full-access, rust-development

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| miyabi-agent-orchestration | New issue assigned | Create worktree |
| ci-cd-pipeline | PR merged | Cleanup worktree |
| codex-danger-full-access | Parallel task requested | Create isolated worktree |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| miyabi-agent-orchestration | Worktree ready | `WORKTREE_READY: {path}` |
| codex-danger-full-access | Worktree ready | `WORKTREE_PATH: {path}` |
| rust-development | Worktree created | `WORKTREE_BUILD_REQ: {path}` |

---

## Resource Sharing

### Produces
```yaml
- type: worktree_path
  data:
    path: "/Users/user/repos/miyabi-worktrees/issue-123"
    branch: "feature/issue-123"
    issue: "123"
    created_at: "2025-12-07T10:00:00Z"
```

### Consumes
```yaml
- type: issue_assignment
  from: miyabi-agent-orchestration
- type: pr_merge_event
  from: ci-cd-pipeline
```

---

## Communication Protocol

### Status Report Format
```
[WORKTREE] {STATUS}: {branch} - {details}
```

### Examples
```bash
# Report worktree creation
tmux send-keys -t %1 '[WORKTREE] CREATED: issue-123 - Ready for development' && sleep 0.5 && tmux send-keys -t %1 Enter

# Report cleanup
tmux send-keys -t %1 '[WORKTREE] REMOVED: issue-456 - PR merged' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Issue to Development
```
miyabi-agent-orchestration [SIGNAL: NEW_ISSUE]
    |
    v
miyabi-worktree-management [START]
    |
    +---> git worktree add ../miyabi-worktrees/issue-XXX -b feature/issue-XXX
    |
    v
[SIGNAL: WORKTREE_READY to orchestration]
    |
    v
codex-danger-full-access [cd to worktree, start work]
```

### Sequence: PR Merge Cleanup
```
ci-cd-pipeline [SIGNAL: PR_MERGED]
    |
    v
miyabi-worktree-management [START]
    |
    +---> git branch -d feature/issue-XXX
    +---> git worktree remove ../miyabi-worktrees/issue-XXX
    +---> git worktree prune
    |
    v
[SIGNAL: WORKTREE_CLEANED]
```

### Sequence: Parallel Development (T-MAX)
```
miyabi-agent-orchestration [Multiple issues]
    |
    +---> miyabi-worktree-management [Issue 1] -> Worktree A
    +---> miyabi-worktree-management [Issue 2] -> Worktree B
    +---> miyabi-worktree-management [Issue 3] -> Worktree C
    |
    v
[All worktrees ready]
    |
    v
[Parallel agent execution in isolated environments]
```

---

## Momentum Multiplier

### Optimization 1: Parallel Worktrees
```bash
# Create N worktrees for N issues
for issue in $issues; do
    git worktree add ../miyabi-worktrees/issue-$issue -b feature/issue-$issue &
done
wait
# Multiplier: All worktrees created in parallel
```

### Optimization 2: Pre-created Worktrees
```bash
# Pre-create worktrees for expected issues
# Reduces wait time when issue is assigned
git worktree add ../miyabi-worktrees/pool-1 -b pool/scratch-1
git worktree add ../miyabi-worktrees/pool-2 -b pool/scratch-2
```

### Optimization 3: Fast Cleanup
```bash
# Batch cleanup of merged branches
git worktree list --porcelain | grep "^worktree" | while read -r line; do
    wt_path=$(echo "$line" | cut -d' ' -f2)
    branch=$(git -C "$wt_path" branch --show-current)
    if git branch --merged main | grep -q "$branch"; then
        git worktree remove "$wt_path" --force &
    fi
done
wait
```

---

## Worktree Structure

### Standard Layout
```
~/repos/miyabi/                    # Main worktree (main branch)
~/repos/miyabi-worktrees/
    issue-123/                    # Feature worktree
    issue-456/                    # Another feature
    hotfix-789/                   # Hotfix worktree
    experiment-alpha/             # Experimental branch
```

### Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Feature | `issue-{number}` | `issue-123` |
| Hotfix | `hotfix-{number}` | `hotfix-789` |
| Experiment | `experiment-{name}` | `experiment-alpha` |
| Release | `release-{version}` | `release-v2.0` |

---

## Health Check Integration

```bash
# Monitor worktree health
check_worktree_health() {
    # Check for stale worktrees
    local stale=$(git worktree list --porcelain | grep "^worktree" | wc -l)
    local branches=$(git branch -r | wc -l)

    # Prune if stale worktrees exist
    git worktree prune

    # Report status
    echo "[WORKTREE] HEALTH: $stale worktrees, $branches remote branches"
}
```

### Periodic Cleanup
```bash
# Weekly cleanup schedule
# Remove worktrees for merged branches
# Prune stale references
```

---

## Error Handling

### Worktree Creation Failure
```
[Worktree already exists]
    |
    v
[Check if in use]
    |
    +--[Not in use]--> Remove and recreate
    +--[In use]--> Use existing worktree
```

### Branch Conflict
```
[Branch already exists remotely]
    |
    v
[Pull latest changes]
    |
    v
[Create worktree from existing branch]
```

---

## Perpetual Activation

### Auto-triggers
- Issue assigned: Create worktree
- PR merged: Cleanup worktree
- Weekly schedule: Prune stale worktrees
- Agent assignment: Verify worktree ready

### Feedback Loop
```
miyabi-worktree-management --> rust-development (build in worktree)
                                  |
                                  v
                              [Tests pass]
                                  |
                                  v
                              ci-cd-pipeline (PR checks)
                                  |
                                  v
                              [PR merged]
                                  |
                                  v
                              miyabi-worktree-management (cleanup)
```

### Isolation Benefits
```
[Each issue in isolated worktree]
    |
    +---> No branch conflicts
    +---> Parallel development
    +---> Easy rollback
    +---> Clean testing environment
```
