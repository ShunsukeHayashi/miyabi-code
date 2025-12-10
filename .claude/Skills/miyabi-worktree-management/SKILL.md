---
name: miyabi-worktree-management
description: Manage Git worktrees for parallel development in Miyabi projects. Use when creating, switching, or cleaning up worktrees. Triggers include "create worktree", "switch worktree", "list worktrees", "cleanup worktree", "parallel branch development", or when working on multiple issues simultaneously in isolated environments.
---

# Miyabi Worktree Management

Efficient Git worktree operations for parallel multi-issue development.

## Worktree Structure

```
~/repos/miyabi/           # Main worktree (main branch)
~/repos/miyabi-worktrees/
├── issue-123/            # Feature worktree
├── issue-456/            # Another feature
├── hotfix-789/           # Hotfix worktree
└── experiment-alpha/     # Experimental branch
```

## Quick Commands

### Create Worktree
```bash
# From issue number
git worktree add ../miyabi-worktrees/issue-123 -b feature/issue-123

# From existing branch
git worktree add ../miyabi-worktrees/hotfix-789 hotfix/urgent-fix
```

### List Worktrees
```bash
git worktree list
# Output:
# /home/user/repos/miyabi              abc1234 [main]
# /home/user/repos/miyabi-worktrees/issue-123  def5678 [feature/issue-123]
```

### Remove Worktree
```bash
# Safe remove (checks for uncommitted changes)
git worktree remove ../miyabi-worktrees/issue-123

# Force remove
git worktree remove --force ../miyabi-worktrees/issue-123
```

### Prune Stale
```bash
git worktree prune
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `issue-{number}` | `issue-123` |
| Hotfix | `hotfix-{number}` | `hotfix-789` |
| Experiment | `experiment-{name}` | `experiment-alpha` |
| Release | `release-{version}` | `release-v2.0` |

## Integration with Agents

### Assign Worktree to Agent
```bash
# CodeGen agent works in dedicated worktree
cd ~/repos/miyabi-worktrees/issue-123
codex -s danger-full-access "implement feature from issue #123"
```

### Parallel Development
```bash
# Agent 1: issue-123
tmux send-keys -t miyabi:%2 "cd ~/repos/miyabi-worktrees/issue-123 && codex ..." Enter

# Agent 2: issue-456
tmux send-keys -t miyabi:%3 "cd ~/repos/miyabi-worktrees/issue-456 && codex ..." Enter
```

## Cleanup Workflow

### After PR Merge
```bash
# 1. Switch to main
cd ~/repos/miyabi
git checkout main
git pull

# 2. Delete branch
git branch -d feature/issue-123

# 3. Remove worktree
git worktree remove ../miyabi-worktrees/issue-123

# 4. Prune if needed
git worktree prune
```

### Batch Cleanup
```bash
# List merged branches
git branch --merged main | grep -v main

# Remove all merged worktrees
for wt in $(git worktree list --porcelain | grep "^worktree" | cut -d' ' -f2); do
    branch=$(git -C "$wt" branch --show-current)
    if git branch --merged main | grep -q "$branch"; then
        git worktree remove "$wt"
    fi
done
```

## Best Practices

1. One worktree per issue/task
2. Always create from updated main
3. Use consistent naming conventions
4. Clean up after PR merge
5. Run `git worktree prune` periodically
