# Tutorial 5: Worktree-Based Parallel Execution

**Estimated Time**: 50 minutes
**Difficulty**: ⭐⭐ Intermediate
**Prerequisites**: Completed Tutorials 1-4, Intermediate Git knowledge, Understanding of concurrent programming concepts

## Learning Objectives

By the end of this tutorial, you will:
- Understand Git Worktree concepts and isolation benefits
- Execute multiple Agents in parallel using Worktrees
- Manage Worktree lifecycle (create, execute, merge, cleanup)
- Configure concurrency levels for optimal performance
- Troubleshoot and resolve Worktree conflicts

## Prerequisites

Before starting, ensure you have:
- **Completed Previous Tutorials**: Tutorials 1-4 are essential
- **Git Worktree Knowledge**: Familiarity with `git worktree` commands
- **Concurrent Programming Basics**: Understanding of parallel execution concepts
- **Adequate System Resources**: At least 4 CPU cores recommended for parallel execution

## Introduction

Traditional development workflows suffer from a fundamental bottleneck: you can only work on one thing at a time in a single repository. If you're implementing Feature A and need to urgently fix Bug B, you must either:
1. Commit incomplete Feature A code
2. Stash changes (risky with complex work)
3. Clone the repository again (slow and wasteful)

Git Worktrees solve this elegantly by creating isolated working directories that share the same repository history. Miyabi leverages Worktrees to enable true parallel Agent execution: multiple Agents working on different Issues simultaneously, each in their own isolated environment.

In this tutorial, you'll learn how Miyabi's Worktree-based architecture enables you to process 5 Issues in parallel, reducing execution time from 50 minutes to just 10 minutes.

## Why Worktrees?

### The Problem: File-Level Conflicts

Imagine running two Agents simultaneously:
- **Agent 1**: Modifying `crates/miyabi-core/src/config.rs`
- **Agent 2**: Also modifying `crates/miyabi-core/src/config.rs`

**Result**: Race conditions, merge conflicts, corrupted state.

### The Solution: Directory-Level Isolation

With Worktrees, each Agent gets its own directory:

```
miyabi/                          # Main repository
├── crates/                      # Main working tree
├── .worktrees/
│   ├── issue-270/               # Agent 1's isolated environment
│   │   ├── crates/
│   │   │   └── miyabi-core/
│   │   │       └── src/
│   │   │           └── config.rs  # Agent 1's version
│   │   └── EXECUTION_CONTEXT.md
│   └── issue-271/               # Agent 2's isolated environment
│       ├── crates/
│       │   └── miyabi-core/
│       │       └── src/
│       │           └── config.rs  # Agent 2's version
│       └── EXECUTION_CONTEXT.md
```

**Benefits**:
1. **True Parallelism**: Agents work completely independently
2. **No Conflicts**: Each Worktree has its own file system state
3. **Easy Rollback**: Delete a Worktree to discard changes
4. **Independent Debugging**: Inspect each Worktree separately
5. **Efficient Resource Usage**: Shared Git history, isolated working files

## Worktree Architecture

### Directory Structure

```bash
.worktrees/
├── issue-270/                  # Issue #270 Worktree
│   ├── .agent-context.json     # Machine-readable context
│   ├── EXECUTION_CONTEXT.md    # Human-readable context
│   ├── crates/                 # Full project files (isolated)
│   ├── .ai/                    # Agent logs (isolated)
│   └── .git/                   # Git metadata (points to main repo)
├── issue-271/                  # Issue #271 Worktree
└── issue-272/                  # Issue #272 Worktree
```

### Context Files

Each Worktree contains two critical context files:

#### `.agent-context.json` (Machine-Readable)

```json
{
  "agentType": "CodeGenAgent",
  "agentStatus": "executing",
  "task": {
    "id": "T1",
    "title": "Implement custom error handling",
    "type": "feature",
    "dependencies": []
  },
  "issue": {
    "number": 270,
    "title": "Add thiserror-based error handling",
    "url": "https://github.com/ShunsukeHayashi/Miyabi/issues/270",
    "labels": ["type:feature", "priority:P1-High"]
  },
  "config": {
    "reasoning_effort": "medium",
    "max_tokens": 8000
  },
  "promptPath": ".claude/agents/prompts/coding/codegen-agent-prompt.md",
  "worktreeInfo": {
    "path": ".worktrees/issue-270",
    "branch": "worktree/issue-270",
    "sessionId": "wt-270-20251024-153045"
  }
}
```

#### `EXECUTION_CONTEXT.md` (Human-Readable)

```markdown
# Execution Context - Issue #270

## Issue Information
- **Number**: #270
- **Title**: Add thiserror-based error handling
- **URL**: https://github.com/ShunsukeHayashi/Miyabi/issues/270
- **Labels**: `type:feature`, `priority:P1-High`, `agent:codegen`

## Task Information
- **Task ID**: T1
- **Task Type**: Feature Implementation
- **Dependencies**: None
- **Estimated Time**: 2 hours

## Agent Information
- **Agent Type**: CodeGenAgent (つくるん)
- **Status**: executing
- **Prompt Path**: `.claude/agents/prompts/coding/codegen-agent-prompt.md`

## Worktree Information
- **Worktree Path**: `.worktrees/issue-270`
- **Branch**: `worktree/issue-270`
- **Session ID**: `wt-270-20251024-153045`
- **Created At**: 2025-10-24T15:30:45Z

## Execution Instructions

Follow the steps in `.claude/agents/prompts/coding/codegen-agent-prompt.md`.
```

## Worktree Lifecycle Protocol

Miyabi follows a strict 4-phase lifecycle for Worktrees.

### Phase 1: Worktree Creation

**Triggered by**: CoordinatorAgent when decomposing an Issue into Tasks.

```bash
# CoordinatorAgent executes:
git worktree add .worktrees/issue-270 -b worktree/issue-270
```

**What Happens**:
1. Git creates a new branch `worktree/issue-270` from `main`
2. New directory `.worktrees/issue-270` is populated with full project files
3. `.git` in Worktree points to main repository (shared history)
4. CoordinatorAgent generates `.agent-context.json` and `EXECUTION_CONTEXT.md`

**Verification**:

```bash
# List all Worktrees
git worktree list

# Expected output:
# /Users/shunsuke/Dev/miyabi-private        abc1234 [main]
# /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-270  def5678 [worktree/issue-270]
```

### Phase 2: Agent Assignment

**Triggered by**: CoordinatorAgent after analyzing Task type.

```rust
// Pseudo-code (simplified)
match task.task_type {
    TaskType::CodeGeneration => assign_agent(CodeGenAgent),
    TaskType::CodeReview => assign_agent(ReviewAgent),
    TaskType::Deployment => assign_agent(DeploymentAgent),
    // ...
}
```

**What Happens**:
1. Task type determines appropriate Agent
2. Agent-specific prompt is loaded
3. Context files are populated with Agent details
4. Worktree status is set to "executing"

### Phase 3: Execution

**Triggered by**: Agent binary (`miyabi agent run <agent-type>`).

```bash
# Execute within Worktree
cd .worktrees/issue-270

# Agent reads context
cat EXECUTION_CONTEXT.md
cat .agent-context.json

# Agent executes (generates code, runs tests, etc.)
cargo build
cargo test
cargo clippy

# Agent commits (Conventional Commits format)
git add .
git commit -m "feat(core): add thiserror-based error handling

- Implement Error enum with thiserror
- Add context-first error messages
- Generate unit tests for error handling

🤖 Generated with Claude Code
Co-Authored-By: CodeGenAgent <noreply@anthropic.com>"
```

**What Happens**:
1. Agent reads context files for instructions
2. Implements changes (code, tests, docs)
3. Validates changes (build, test, lint)
4. Commits changes with Conventional Commits message
5. Updates `EXECUTION_CONTEXT.md` with results

### Phase 4: Cleanup

**Triggered by**: CoordinatorAgent after successful execution or manual cleanup.

```bash
# Return to main repository
cd /Users/shunsuke/Dev/miyabi-private

# Merge Worktree branch
git merge worktree/issue-270

# Remove Worktree
git worktree remove .worktrees/issue-270

# Delete remote branch (if pushed)
git branch -d worktree/issue-270
```

**What Happens**:
1. Changes from Worktree branch are merged to `main`
2. Worktree directory is deleted
3. Branch is removed (locally and optionally remotely)
4. Git internal state is cleaned up

**Verification**:

```bash
# Verify Worktree is removed
git worktree list

# Should only show main repository
```

## Parallel Execution Demo

Now let's see Worktrees in action with a real parallel execution scenario.

### Scenario: Process 3 Issues Simultaneously

**Issues**:
- **Issue #270**: Add custom error handling (CodeGenAgent, ~10 min)
- **Issue #271**: Improve ReviewAgent scoring (CodeGenAgent, ~8 min)
- **Issue #272**: Update deployment script (DeploymentAgent, ~5 min)

**Without Worktrees**: 23 minutes (sequential execution)
**With Worktrees**: 10 minutes (parallel execution, bottleneck is longest task)

### Step 1: Create Test Issues

```bash
# Create 3 Issues for testing
gh issue create --title "Add custom error handling" --body "Implement thiserror-based error handling" --label "type:feature,priority:P1-High"
gh issue create --title "Improve ReviewAgent scoring" --body "Refine scoring algorithm" --label "type:enhancement,priority:P2-Medium"
gh issue create --title "Update deployment script" --body "Add staging environment support" --label "type:feature,priority:P2-Medium"

# Expected output:
# https://github.com/ShunsukeHayashi/Miyabi/issues/270
# https://github.com/ShunsukeHayashi/Miyabi/issues/271
# https://github.com/ShunsukeHayashi/Miyabi/issues/272
```

### Step 2: Execute Coordinator in Parallel Mode

```bash
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

**What Happens**:
1. CoordinatorAgent reads all 3 Issues
2. Creates 3 Worktrees simultaneously:
   - `.worktrees/issue-270`
   - `.worktrees/issue-271`
   - `.worktrees/issue-272`
3. Assigns appropriate Agents based on Issue labels
4. Spawns 3 parallel Agent processes
5. Monitors execution status in real-time
6. Merges completed Worktrees as they finish
7. Cleans up all Worktrees

### Step 3: Monitor Execution

In a separate terminal, monitor progress:

```bash
# Watch Worktree status
watch -n 2 'git worktree list'

# Output:
# /Users/shunsuke/Dev/miyabi-private        abc1234 [main]
# /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-270  def5678 [worktree/issue-270] executing
# /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-271  ghi9012 [worktree/issue-271] executing
# /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-272  jkl3456 [worktree/issue-272] completed

# Monitor Agent logs
tail -f .ai/logs/agent-execution-$(date +%Y-%m-%d).json | jq .
```

### Step 4: Review Results

```bash
# View execution summary
cat .ai/parallel-reports/parallel-execution-$(date +%Y-%m-%d).json | jq .

# Expected output:
{
  "session_id": "parallel-20251024-153045",
  "start_time": "2025-10-24T15:30:45Z",
  "end_time": "2025-10-24T15:40:32Z",
  "duration_seconds": 587,
  "issues_processed": 3,
  "concurrency": 3,
  "results": [
    {
      "issue_number": 270,
      "status": "completed",
      "agent": "CodeGenAgent",
      "duration_seconds": 587,
      "worktree": ".worktrees/issue-270",
      "commits": 1,
      "files_changed": 4
    },
    {
      "issue_number": 271,
      "status": "completed",
      "agent": "CodeGenAgent",
      "duration_seconds": 456,
      "worktree": ".worktrees/issue-271",
      "commits": 1,
      "files_changed": 2
    },
    {
      "issue_number": 272,
      "status": "completed",
      "agent": "DeploymentAgent",
      "duration_seconds": 289,
      "worktree": ".worktrees/issue-272",
      "commits": 1,
      "files_changed": 1
    }
  ],
  "efficiency_gain": "60%",
  "time_saved_seconds": 813
}
```

## Understanding DAG-Based Task Scheduling

Miyabi uses Directed Acyclic Graph (DAG) scheduling to optimize parallel execution.

### Task Dependencies

Some tasks depend on others:

```
Issue #273: Implement Feature X
  ├─ T1: Design architecture (no dependencies)
  ├─ T2: Implement core logic (depends: T1)
  ├─ T3: Add tests (depends: T2)
  └─ T4: Update documentation (depends: T1)

Execution Plan:
  Level 0: T1 (execute immediately)
  Level 1: T2, T4 (execute after T1 completes, in parallel)
  Level 2: T3 (execute after T2 completes)
```

### DAG Construction

```rust
// Pseudo-code for DAG construction
let mut dag = DAG::new();

dag.add_task(T1, dependencies: []);
dag.add_task(T2, dependencies: [T1]);
dag.add_task(T3, dependencies: [T2]);
dag.add_task(T4, dependencies: [T1]);

// Topological sort
let execution_order = dag.topological_sort();
// Result: [[T1], [T2, T4], [T3]]
//         Level 0  Level 1    Level 2
```

### Parallel Execution with Dependencies

```bash
# CoordinatorAgent automatically handles dependencies
miyabi agent run coordinator --issue 273 --concurrency 3

# Execution sequence:
# 1. Level 0: T1 executes in .worktrees/issue-273-t1
# 2. Level 1: T2 and T4 execute in parallel
#    - .worktrees/issue-273-t2
#    - .worktrees/issue-273-t4
# 3. Level 2: T3 executes after T2 completes
#    - .worktrees/issue-273-t3
```

## Concurrency Tuning

Optimal concurrency depends on your hardware and workload.

### CPU Core Detection

Miyabi automatically detects available CPU cores:

```rust
use num_cpus;

let cores = num_cpus::get();
let default_concurrency = (cores - 1).max(1); // Leave 1 core for OS

println!("Detected {} CPU cores, using concurrency: {}", cores, default_concurrency);
```

### Manual Concurrency Configuration

Override default concurrency:

```bash
# Low-spec machine (2 cores): Sequential execution
miyabi agent run coordinator --issues 270,271,272 --concurrency 1

# Medium-spec machine (4 cores): Moderate parallelism
miyabi agent run coordinator --issues 270,271,272 --concurrency 2

# High-spec machine (8+ cores): High parallelism
miyabi agent run coordinator --issues 270,271,272,273,274 --concurrency 5
```

### Maximum Concurrency Limits

Miyabi enforces a maximum concurrency of 5 to prevent:
- Resource exhaustion
- API rate limiting (GitHub, Anthropic)
- System instability

```toml
# miyabi.toml
[worktree]
max_concurrency = 5  # Hard limit
```

### Performance Benchmarks

**Test Setup**: MacBook Pro M2, 8 cores, 16GB RAM

| Issues | Sequential (min) | Parallel (concurrency=3) | Parallel (concurrency=5) | Speedup |
|--------|-----------------|--------------------------|--------------------------|---------|
| 1      | 10              | 10                       | 10                       | 1.0x    |
| 3      | 30              | 12                       | 12                       | 2.5x    |
| 5      | 50              | 18                       | 12                       | 4.2x    |
| 10     | 100             | 35                       | 22                       | 4.5x    |

**Recommendation**: Use concurrency=3 for most workloads (optimal balance).

## Troubleshooting

### Issue: Stuck Worktree After Agent Crash

**Symptom**: Worktree remains after Agent fails.

```bash
git worktree list
# Output shows:
# /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-270  def5678 [worktree/issue-270]
```

**Solution**:

```bash
# 1. Inspect Worktree state
cd .worktrees/issue-270
git status

# 2. If changes are valuable, commit them
git add .
git commit -m "WIP: Partial implementation before crash"

# 3. Return to main repo
cd ../..

# 4. Merge if desired (or skip if discarding)
git merge worktree/issue-270

# 5. Remove Worktree
git worktree remove .worktrees/issue-270

# 6. Delete branch
git branch -d worktree/issue-270
```

### Issue: Merge Conflicts

**Symptom**: Worktree merge fails with conflicts.

```bash
git merge worktree/issue-270
# Auto-merging crates/miyabi-core/src/config.rs
# CONFLICT (content): Merge conflict in crates/miyabi-core/src/config.rs
```

**Solution**:

```bash
# 1. Identify conflicting files
git status

# 2. Resolve conflicts manually
code crates/miyabi-core/src/config.rs  # or your preferred editor

# 3. Mark as resolved
git add crates/miyabi-core/src/config.rs

# 4. Complete merge
git commit -m "Merge worktree/issue-270 (resolved conflicts)"

# 5. Cleanup Worktree
git worktree remove .worktrees/issue-270
```

### Issue: Stale Worktrees (Disk Space)

**Symptom**: Many old Worktrees consuming disk space.

```bash
du -sh .worktrees/*
# 1.2G    .worktrees/issue-250
# 1.1G    .worktrees/issue-251
# ...
```

**Solution**:

```bash
# 1. List all Worktrees
git worktree list

# 2. Prune stale Worktrees (safe cleanup)
git worktree prune

# 3. Force remove specific Worktrees
git worktree remove --force .worktrees/issue-250

# 4. Automate cleanup in miyabi.toml
[worktree]
auto_cleanup = true
max_age_hours = 24  # Remove Worktrees older than 24 hours
```

### Issue: Worktree on Different Branch

**Symptom**: Worktree is on wrong branch.

```bash
cd .worktrees/issue-270
git branch
# * main  # Should be worktree/issue-270
```

**Solution**:

```bash
# Switch to correct branch
git checkout worktree/issue-270

# If branch doesn't exist, create it
git checkout -b worktree/issue-270
```

## Advanced: Custom Worktree Workflows

### Workflow 1: Manual Worktree Management

For fine-grained control:

```bash
# 1. Create Worktree manually
git worktree add .worktrees/custom-feature -b feature/custom

# 2. Work in Worktree
cd .worktrees/custom-feature
# ... make changes ...
git commit -m "feat: custom feature"

# 3. Return and merge
cd ../..
git merge feature/custom

# 4. Cleanup
git worktree remove .worktrees/custom-feature
```

### Workflow 2: Long-Running Worktrees

For feature branches that span days/weeks:

```toml
# miyabi.toml
[worktree]
auto_cleanup = false  # Disable automatic cleanup
persistent_worktrees = [
  ".worktrees/feature-long-term",
  ".worktrees/experiment-branch"
]
```

### Workflow 3: Nested Worktrees

For complex multi-Agent workflows:

```bash
# Main Worktree for Issue
.worktrees/issue-300/

# Sub-Worktrees for Tasks
.worktrees/issue-300-task-1/
.worktrees/issue-300-task-2/
.worktrees/issue-300-task-3/

# Each Task has isolated environment
```

## Success Checklist

Before considering yourself proficient with Worktree-based parallel execution:

- [ ] Successfully executed 3+ Issues in parallel
- [ ] Understood DAG-based task scheduling
- [ ] Configured optimal concurrency for your machine
- [ ] Resolved at least one Worktree conflict
- [ ] Cleaned up stale Worktrees
- [ ] Monitored parallel execution logs
- [ ] Achieved 2x+ speedup with parallel execution

## Next Steps

Congratulations! You've mastered Worktree-based parallel execution. Here's what to explore next:

1. **Tutorial 6: Label System Mastery** - Use Labels to trigger parallel workflows automatically
2. **Tutorial 7: MCP Integration** - Integrate external tools for even more powerful workflows
3. **Tutorial 8: Entity-Relation Model** - Deep dive into Worktree Entity relationships

## Resources

- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md` (Complete specification)
- **Rust Implementation**: `crates/miyabi-worktree/src/lib.rs`
- **DAG Scheduler**: `crates/miyabi-core/src/dag.rs`
- **Git Worktree Docs**: https://git-scm.com/docs/git-worktree

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)
