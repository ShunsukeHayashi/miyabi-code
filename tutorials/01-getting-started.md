# Tutorial 1: Getting Started with Miyabi

**Estimated Time**: 30 minutes
**Difficulty**: ⭐ Beginner
**Prerequisites**: Basic Git knowledge, GitHub account

## Learning Objectives

By the end of this tutorial, you will:
- Install Miyabi CLI and all required dependencies
- Configure GitHub integration for autonomous workflows
- Execute your first autonomous Agent
- Understand the Issue-to-PR workflow basics

## Prerequisites

Before starting, ensure you have:
- **Basic Git Knowledge**: Familiarity with `git clone`, `git commit`, `git push`
- **GitHub Account**: With API token access (we'll set this up)
- **Rust 1.70+**: For building Miyabi from source
- **Command Line Proficiency**: Comfortable using Terminal (macOS/Linux) or PowerShell (Windows)

## Introduction

Welcome to Miyabi, the autonomous AI-powered development framework that transforms how you build software. Imagine a world where you create a GitHub Issue describing what you want to build, and an AI Agent automatically decomposes it into tasks, writes the code, tests it, creates a pull request, and even deploys it to production.

That's exactly what Miyabi does.

Miyabi is built on the "GitHub as OS" philosophy, where GitHub Issues drive everything. Labels act as state machines, triggering autonomous Agents that handle the entire development lifecycle. With 21 specialized Agents (7 for coding, 14 for business), Miyabi can handle everything from code generation to market research.

In this tutorial, you'll install Miyabi, run your first Agent, and witness autonomous development in action.

## Installation

### Step 1: Install Rust Toolchain

Miyabi is built with Rust for maximum performance and safety. If you don't have Rust installed:

**macOS/Linux**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**Windows**:
Download and run [rustup-init.exe](https://rustup.rs/) from the official website.

**Verify Installation**:
```bash
rustc --version
cargo --version
```

You should see output like:
```
rustc 1.70.0 (90c541806 2023-05-31)
cargo 1.70.0 (ec8a8a0ca 2023-04-25)
```

### Step 2: Clone the Miyabi Repository

```bash
cd ~/Dev  # or your preferred workspace directory
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi
```

If you don't have access to the repository, you can install Miyabi from crates.io (once published):
```bash
cargo install miyabi-cli
```

### Step 3: Build Miyabi from Source

```bash
cargo build --release
```

This will compile all 23 Miyabi crates (the entire Cargo workspace) and produce a single optimized binary. The build may take 5-10 minutes on first run as Rust compiles dependencies.

**Expected Output**:
```
   Compiling miyabi-types v2.0.0
   Compiling miyabi-core v2.0.0
   Compiling miyabi-github v2.0.0
   ...
   Compiling miyabi-cli v2.0.0
    Finished release [optimized] target(s) in 8m 32s
```

### Step 4: Verify Installation

```bash
./target/release/miyabi --version
```

You should see:
```
miyabi-cli 2.0.0
```

Optionally, add Miyabi to your PATH for convenience:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$HOME/Dev/Miyabi/target/release:$PATH"

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc

# Now you can use miyabi directly
miyabi --version
```

## Configuration

### Step 1: Create a GitHub Personal Access Token

Miyabi needs access to your GitHub repository to create Issues, PRs, and manage Labels.

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name it: `Miyabi Autonomous Agent`
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `read:org` (Read org and team membership)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

The token should look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Set Environment Variables

Create a `.env` file in the Miyabi root directory:

```bash
cd ~/Dev/Miyabi
touch .env
```

Add these variables (replace with your actual values):

```bash
# GitHub Configuration
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_OWNER=YourGitHubUsername
export GITHUB_REPO=Miyabi

# Anthropic API Key (for Agent execution)
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Device Identifier (for multi-machine setups)
export DEVICE_IDENTIFIER=MacBook-Pro
```

**Note**: You'll need an Anthropic API key for AI-powered Agents. Get one at [console.anthropic.com](https://console.anthropic.com/).

Load the environment variables:
```bash
source .env
```

### Step 3: Test GitHub Connection

Verify Miyabi can connect to GitHub:

```bash
miyabi github status
```

**Expected Output**:
```
✅ GitHub connection successful
Repository: YourGitHubUsername/Miyabi
Authenticated as: YourGitHubUsername
Rate limit: 4999/5000 remaining
```

If you see an error, double-check your `GITHUB_TOKEN` and ensure it has the correct scopes.

## First Agent Execution

Now for the exciting part - let's run your first autonomous Agent!

### Step 1: Create a Test Issue

Go to your Miyabi repository on GitHub and create a new Issue:

**Title**: `[Test] Add hello world function`

**Description**:
```markdown
Create a simple hello world function in Rust.

## Requirements
- Function should be named `greet`
- Should accept a name parameter
- Should return a greeting string
- Include unit tests

## Expected Output
```rust
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

This is a test Issue for learning Miyabi.
```

**Labels**: GitHub will auto-assign labels, but you can manually add:
- `type:feature`
- `priority:p3-low`

Note the Issue number (e.g., `#500`). You'll need this for the next step.

### Step 2: Run CoordinatorAgent

CoordinatorAgent is the "orchestrator" Agent that analyzes Issues, decomposes them into tasks, and coordinates execution.

```bash
miyabi agent run coordinator --issue 500
```

**What Happens**:
1. **Issue Analysis**: CoordinatorAgent fetches Issue #500 from GitHub
2. **Task Decomposition**: Breaks the Issue into atomic tasks (T1, T2, T3, etc.)
3. **DAG Construction**: Builds a Directed Acyclic Graph of task dependencies
4. **Plan Generation**: Creates `.ai/plans/issue-500-plans.md` with detailed execution plan
5. **Agent Assignment**: Assigns tasks to appropriate Agents (CodeGenAgent, ReviewAgent, etc.)

**Expected Output**:
```
[INFO] CoordinatorAgent (しきるん) starting execution for Issue #500
[INFO] Analyzing Issue: [Test] Add hello world function
[INFO] Task decomposition: 3 tasks identified
  ├─ T1: Create greet function (assigned: CodeGenAgent)
  ├─ T2: Write unit tests (assigned: CodeGenAgent)
  └─ T3: Quality review (assigned: ReviewAgent)
[INFO] Execution plan saved: .ai/plans/issue-500-plans.md
[INFO] Ready for autonomous execution. Next: Run CodeGenAgent with --issue 500
```

### Step 3: Review the Generated Plan

Open the generated plan file:

```bash
cat .ai/plans/issue-500-plans.md
```

You'll see a comprehensive execution plan including:
- Task breakdown (T1, T2, T3, etc.)
- Agent assignments
- Dependencies (which tasks must complete before others)
- Estimated execution time
- Success criteria

**Example Plan Structure**:
```markdown
# Execution Plan - Issue #500

## Tasks

### T1: Create greet function
- **Agent**: CodeGenAgent (つくるん)
- **Priority**: P1-High
- **Dependencies**: None
- **Estimated Time**: 5 minutes

### T2: Write unit tests
- **Agent**: CodeGenAgent (つくるん)
- **Priority**: P1-High
- **Dependencies**: T1

### T3: Quality review
- **Agent**: ReviewAgent (めだまん)
- **Priority**: P1-High
- **Dependencies**: T1, T2
```

### Step 4: Execute the Plan (Autonomous Mode)

Now let's execute the entire plan autonomously:

```bash
miyabi agent run codegen --issue 500
```

**What Happens**:
1. **Worktree Creation**: Creates `.worktrees/issue-500/` isolated workspace
2. **Code Generation**: CodeGenAgent writes the `greet` function
3. **Test Creation**: CodeGenAgent writes comprehensive unit tests
4. **Compilation**: Verifies code compiles with `cargo build`
5. **Test Execution**: Runs tests with `cargo test`
6. **Commit**: Creates a Git commit following Conventional Commits format

**Expected Output**:
```
[INFO] CodeGenAgent (つくるん) starting execution for Issue #500
[INFO] Creating Worktree: .worktrees/issue-500
[INFO] Generating code for task T1: Create greet function
[INFO] File created: crates/miyabi-core/src/greet.rs
[INFO] Generating tests for task T2: Write unit tests
[INFO] File created: crates/miyabi-core/tests/test_greet.rs
[INFO] Running: cargo build
   Compiling miyabi-core v2.0.0
    Finished dev [unoptimized + debuginfo] target(s) in 2.3s
[INFO] Running: cargo test test_greet
   running 3 tests
test test_greet::test_greet_basic ... ok
test test_greet::test_greet_empty ... ok
test test_greet::test_greet_unicode ... ok
   test result: ok. 3 passed; 0 failed; 0 ignored
[INFO] Creating commit...
[INFO] Commit created: feat: add greet function with tests (#500)
[INFO] CodeGenAgent execution completed successfully
```

### Step 5: Review and Merge

Check the generated code:

```bash
cd .worktrees/issue-500
cat crates/miyabi-core/src/greet.rs
```

If everything looks good, Miyabi can automatically create a Pull Request:

```bash
miyabi agent run pr --issue 500
```

**What Happens**:
1. **PR Creation**: Creates a draft PR with a detailed description
2. **Quality Report**: Includes ReviewAgent score (out of 100)
3. **Link to Issue**: Automatically links to Issue #500 with "Closes #500"

## Understanding the Output

Let's break down what just happened:

### Execution Logs

All Agent execution logs are saved in `.ai/logs/`:

```bash
ls .ai/logs/
```

You'll see files like:
- `2025-10-24_coordinator_issue-500.md` - CoordinatorAgent log
- `2025-10-24_codegen_issue-500.md` - CodeGenAgent log
- `2025-10-24_review_issue-500.md` - ReviewAgent log

These logs are formatted as Markdown for easy reading and are also indexed in Miyabi's knowledge management system for future reference.

### Worktree Structure

The `.worktrees/` directory contains isolated workspaces:

```
.worktrees/
└── issue-500/
    ├── .agent-context.json       # Agent execution context
    ├── EXECUTION_CONTEXT.md      # Human-readable context
    └── (full Miyabi codebase)    # Isolated copy
```

**Why Worktrees?**
- **Isolation**: Multiple Agents can work on different Issues simultaneously without conflicts
- **Safety**: If something goes wrong, the main codebase is untouched
- **Rollback**: Easy to discard changes by removing the Worktree

### Plans and Tasks

The `.ai/plans/` directory contains execution plans:

```
.ai/plans/
├── issue-500-plans.md            # Detailed execution plan
├── issue-500-tasks.json          # Machine-readable task list
└── issue-500-summary.md          # Executive summary
```

These files provide full transparency into Miyabi's decision-making process.

## Common Issues and Troubleshooting

### Issue: "GitHub token invalid"

**Solution**: Verify your token has the correct scopes:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

If you see "Bad credentials", regenerate your token with the correct scopes.

### Issue: "Rust compiler not found"

**Solution**: Ensure Rust is in your PATH:
```bash
rustc --version
```

If not found, run:
```bash
source $HOME/.cargo/env
```

### Issue: "Anthropic API key missing"

**Solution**: Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Or add it to your `.env` file.

### Issue: "Worktree creation failed"

**Solution**: Clean up stale Worktrees:
```bash
git worktree list
git worktree prune
```

Then retry the Agent execution.

## Success Checklist

Before moving to the next tutorial, verify:

- [ ] Miyabi CLI is installed and `miyabi --version` works
- [ ] GitHub integration is configured and `miyabi github status` succeeds
- [ ] You've created a test Issue on GitHub
- [ ] CoordinatorAgent successfully analyzed the Issue and created a plan
- [ ] CodeGenAgent generated code and tests in a Worktree
- [ ] You can view execution logs in `.ai/logs/`
- [ ] You understand the basic Issue → Task → Agent → PR workflow

## Next Steps

Congratulations! You've successfully:
- Installed Miyabi and configured GitHub integration
- Run your first autonomous Agent (CoordinatorAgent)
- Witnessed AI-powered code generation with CodeGenAgent
- Explored Worktree-based isolation

**Next Tutorial**: [Tutorial 2: Understanding Agents - The 21 Characters](./02-understanding-agents.md)

In the next tutorial, you'll learn about all 21 Agents, their specialized roles, and when to use each one. You'll also discover Miyabi's friendly character naming system (like しきるん, つくるん, めだまん) that makes interacting with Agents more intuitive.

## Additional Resources

- **Miyabi Repository**: [github.com/ShunsukeHayashi/Miyabi](https://github.com/ShunsukeHayashi/Miyabi)
- **Landing Page**: [shunsukehayashi.github.io/Miyabi](https://shunsukehayashi.github.io/Miyabi/landing.html)
- **Agent Specifications**: `.claude/agents/specs/` in the repository
- **Architecture Guide**: `.claude/context/architecture.md`
- **Discord Community**: [Join the discussion](https://discord.gg/miyabi) (if available)

---

**Tutorial 1 Complete!** Ready to dive deeper? Proceed to Tutorial 2 to master the Agent system.
