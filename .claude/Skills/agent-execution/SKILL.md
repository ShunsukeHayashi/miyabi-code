---
name: Agent Execution with Worktree
description: Execute Miyabi Agents (Coordinator, CodeGen, Review, Deployment, PR, Issue) with Git Worktree isolation for parallel processing. Use when running agents, processing Issues, or managing concurrent tasks.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# Agent Execution with Worktree

Execute Miyabi's 7 Coding Agents with Git Worktree isolation for safe parallel execution and conflict-free development.

## When to Use

- User requests "run coordinator agent on issue #270"
- User asks to "process multiple issues in parallel"
- User wants to "execute codegen agent" or any other agent type
- After Issue creation, to automatically process it
- When managing concurrent development tasks

## Agent Types

### 🔴 Leader Agents (Sequential Only)
1. **CoordinatorAgent (しきるん)** - Task decomposition, DAG construction, Agent assignment
   - Entry point for Issue processing
   - Creates Worktrees for parallel execution
   - Cannot run multiple instances simultaneously

### 🟢 Execution Agents (Parallel OK)
2. **CodeGenAgent (つくるん)** - Code generation with Claude Sonnet 4
   - Implements features, fixes bugs
   - Generates tests and documentation
   - Safe for parallel execution

3. **ReviewAgent (めだまん)** - Code quality review with scoring
   - Runs clippy, cargo check, security scans
   - Generates quality reports (100-point scale)
   - Safe for parallel execution

4. **DeploymentAgent (はこぶん)** - CI/CD deployment automation
   - Firebase/Vercel/AWS deployment
   - Health checks and rollback
   - Conditional execution (after review passes)

5. **PRAgent (まとめるん)** - Pull Request creation
   - Conventional Commits formatting
   - Auto-generates PR descriptions
   - Conditional execution (after code generation)

6. **IssueAgent (みつけるん)** - Issue analysis and labeling
   - AI-powered label inference
   - Priority/severity assignment
   - Safe for parallel execution

7. **RefresherAgent (つなぐん)** - Issue status monitoring
   - Stale issue detection
   - Auto-updates and notifications
   - Background execution

## Execution Methods

### Method 1: Single Agent on Single Issue
```bash
cargo run --bin miyabi -- agent run coordinator --issue 270
```

### Method 2: Multiple Issues in Parallel (via Coordinator)
```bash
cargo run --bin miyabi -- agent run coordinator --issues 270,271,272 --concurrency 3
```

### Method 3: Direct Agent Execution (Development)
```bash
cd crates/miyabi-agents
cargo run --example codegen_agent -- --issue 270
```

## Worktree Lifecycle Protocol

### Phase 1: Worktree Creation
```bash
# Coordinator creates isolated Worktree for each Issue
git worktree add .worktrees/issue-270 -b issue-270-feature
```

### Phase 2: Agent Assignment
```bash
# Based on Task type, auto-assign appropriate Agent
# - type:feature → CodeGenAgent
# - type:bug → CodeGenAgent + ReviewAgent
# - type:docs → ContentCreationAgent (Business Agent)
```

### Phase 3: Execution Context Setup
Each Worktree receives:
- `.agent-context.json` - Machine-readable context
- `EXECUTION_CONTEXT.md` - Human-readable instructions
- Agent-specific prompt from `.claude/agents/prompts/coding/`

### Phase 4: Claude Code Execution
```bash
cd .worktrees/issue-270
# Claude Code reads EXECUTION_CONTEXT.md
# Executes Agent-specific workflow
# Commits changes with Conventional Commits
```

### Phase 5: Merge & Cleanup
```bash
# Push Worktree changes
git -C .worktrees/issue-270 push -u origin issue-270-feature

# Merge back to main (or create PR)
git merge issue-270-feature

# Remove Worktree
git worktree remove .worktrees/issue-270
```

## Parallel Execution Rules

✅ **Safe to Run in Parallel**:
- 🟢 CodeGenAgent + 🟢 ReviewAgent (different Issues)
- 🟢 CodeGenAgent + 🔵 IssueAgent
- 🔵 IssueAgent + 🔵 IssueAgent (different Issues)

❌ **Not Safe to Run in Parallel**:
- 🔴 CoordinatorAgent + 🔴 CoordinatorAgent (sequential only)
- Same Agent on same Issue (race condition)

⚠️ **Conditional Execution**:
- 🟡 DeploymentAgent: After ReviewAgent passes quality checks
- 🟡 PRAgent: After CodeGenAgent completes implementation

## Error Handling

### Worktree Creation Fails
```bash
# Check existing Worktrees
git worktree list

# Remove stale Worktrees
git worktree prune
```

### Merge Conflicts
```bash
# Manual conflict resolution in Worktree
cd .worktrees/issue-270
git status
# Resolve conflicts
git add .
git commit
```

### Agent Execution Fails
```bash
# Check Agent logs
cat .worktrees/issue-270/.agent-context.json
cat .worktrees/issue-270/EXECUTION_CONTEXT.md

# Re-run Agent with --force flag
cargo run --bin miyabi -- agent run codegen --issue 270 --force
```

## Success Criteria

- ✅ Worktree created successfully
- ✅ Agent assigned based on Task type
- ✅ Execution context files generated
- ✅ Claude Code executed workflow
- ✅ Changes committed with Conventional Commits
- ✅ Worktree merged or PR created
- ✅ Worktree cleaned up

## Related Files

- **Worktree Manager**: `crates/miyabi-worktree/src/lib.rs`
- **Agent Specs**: `.claude/agents/specs/coding/*.md`
- **Agent Prompts**: `.claude/agents/prompts/coding/*-agent-prompt.md`
- **Protocol Doc**: `docs/WORKTREE_PROTOCOL.md`

## Related Skills

- **Rust Development**: For building Agents before execution
- **Issue Analysis**: For analyzing Agent execution results
