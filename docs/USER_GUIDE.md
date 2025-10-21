# 📘 Miyabi User Guide - Complete Reference

**Version**: 2.0 (Rust Edition)
**Target Audience**: All users (beginners to advanced)
**Reading Time**: 30-45 minutes

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Agent System](#agent-system)
4. [Advanced Features](#advanced-features)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)
8. [Best Practices](#best-practices)

---

## 🚀 Getting Started

### Prerequisites

Before using Miyabi, ensure you have:

- **Rust toolchain** (>= 1.75.0) or **curl/wget** for binary installation
- **Git** (latest version)
- **GitHub account** with API access
- **gh CLI** (optional, recommended for authentication)

### Quick Installation

Choose the installation method that best suits your needs:

#### 🌟 Option 1: One-Command Install (Recommended)

```bash
# macOS / Linux / Windows (WSL2)
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash

# Or with wget
wget -qO- https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
```

**What it does**:
- Detects your OS and architecture automatically
- Downloads the pre-compiled binary
- Installs to `~/.local/bin`
- Configures PATH
- Verifies installation

#### 🦀 Option 2: Cargo Install

```bash
# From git (current method)
cargo install --git https://github.com/ShunsukeHayashi/miyabi-private miyabi-cli

# From crates.io (coming soon)
cargo install miyabi-cli
```

#### 🐳 Option 3: Docker

```bash
# Pull image
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest

# Create alias
alias miyabi='docker run --rm -v $(pwd):/workspace -w /workspace ghcr.io/shunsukehayashi/miyabi-private:latest'

# Use it
miyabi --version
```

**See also**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed installation instructions

### First-Time Setup

After installation, configure GitHub authentication:

#### Method 1: gh CLI (Recommended)

```bash
# Install gh CLI
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Authenticate
gh auth login

# Miyabi will automatically use gh CLI token
miyabi status
```

#### Method 2: Environment Variable

```bash
# Create GitHub token: https://github.com/settings/tokens/new
# Required scopes: repo, workflow, write:packages

export GITHUB_TOKEN=ghp_your_token_here

# Or add to .env file
echo "GITHUB_TOKEN=ghp_your_token_here" > .env
```

### Verify Installation

```bash
# Check version
miyabi --version
# Output: miyabi 2.0.0

# Check help
miyabi --help

# Test GitHub connection
miyabi status
```

---

## 💡 Basic Usage

### Project Initialization

#### Create New Project

```bash
# Initialize new project
miyabi init my-awesome-project

# What it does:
# 1. Creates GitHub repository
# 2. Clones locally
# 3. Installs 53-label system
# 4. Sets up GitHub Actions workflows
# 5. Configures Projects V2
```

#### Add to Existing Project

```bash
# Navigate to existing project
cd existing-project

# Install Miyabi
miyabi install

# What it does:
# 1. Detects project structure
# 2. Adds 53-label system
# 3. Installs GitHub Actions workflows
# 4. Creates .miyabi.yml config
# 5. Sets up git hooks (optional)
```

### Core Commands

#### 1. Status Check

```bash
# Check current status
miyabi status

# Output example:
# ╔════════════════════════════════════╗
# ║   📊 Miyabi Status                 ║
# ╚════════════════════════════════════╝
#
# GitHub Connection: ✓ Connected
# Repository: ShunsukeHayashi/my-project
# Open Issues: 5
# - Pending: 2
# - In Progress: 3
# - Done: 15

# Watch mode (auto-refresh)
miyabi status --watch
```

#### 2. Agent Execution

```bash
# Execute agent on specific issue
miyabi agent run coordinator --issue 270

# What it does:
# 1. Analyzes Issue #270
# 2. Decomposes into subtasks (DAG)
# 3. Assigns specialist agents
# 4. Creates git worktrees for parallel execution
# 5. Generates code, tests, and documentation
# 6. Creates pull request

# Dry-run (show plan without execution)
miyabi agent run coordinator --issue 270 --dry-run
```

#### 3. Parallel Execution

```bash
# Execute multiple issues in parallel
miyabi agent run coordinator --issues 270,271,272 --concurrency 3

# With custom worktree directory
miyabi agent run coordinator --issues 270,271,272 --worktree-dir .worktrees
```

### Workflow Example

Here's a complete workflow from Issue to PR:

```bash
# 1. Create Issue on GitHub
# Go to: https://github.com/your-username/your-repo/issues/new
# Title: "Add user authentication"
# Body: "Implement JWT-based authentication with refresh tokens"

# 2. Run Miyabi Agent
miyabi agent run coordinator --issue 273

# 3. Wait for completion (10-15 minutes)
# Miyabi will:
# - Analyze requirements
# - Create implementation plan (DAG)
# - Generate Rust code
# - Write tests (80%+ coverage)
# - Generate documentation (Rustdoc)
# - Create pull request

# 4. Review PR on GitHub
# Go to: https://github.com/your-username/your-repo/pulls

# 5. Merge when satisfied
```

---

## 🤖 Agent System

Miyabi includes **7 coding agents** that work together to automate development:

### Agent Overview

| Agent | Role | Trigger | Output |
|-------|------|---------|--------|
| **CoordinatorAgent** | Task orchestration | `miyabi agent run coordinator` | Task DAG, Agent assignments |
| **IssueAgent** | Issue analysis | Automatic (on Issue create) | Labels, Priority, Severity |
| **CodeGenAgent** | Code generation | Assigned by Coordinator | Rust code, Tests |
| **ReviewAgent** | Quality review | After CodeGen | Quality score (0-100) |
| **PRAgent** | PR creation | After Review (score >= 80) | Pull Request |
| **DeploymentAgent** | Deployment | Manual or trigger label | Deployment status |
| **TestAgent** | Testing | After CodeGen | Test results, Coverage |

### Agent Execution Details

#### CoordinatorAgent

**Purpose**: Orchestrates all other agents, decomposes Issues into Tasks

**Usage**:
```bash
miyabi agent run coordinator --issue <number>
```

**What it does**:
1. Analyzes Issue content and labels
2. Decomposes into subtasks (DAG - Directed Acyclic Graph)
3. Identifies dependencies
4. Assigns specialist agents
5. Creates git worktrees for parallel execution
6. Monitors progress

**Output**:
- Task breakdown (JSON)
- DAG visualization
- Agent assignments

#### CodeGenAgent

**Purpose**: Generates Rust code using AI assistance

**Usage** (triggered by Coordinator):
```bash
# Executed in worktree
# .worktrees/issue-270/
```

**What it does**:
1. Analyzes task requirements
2. Generates Rust structs, enums, traits
3. Creates unit tests (`#[cfg(test)]`)
4. Adds Rustdoc comments (`///`)
5. Follows Rust best practices
6. Commits changes

**Output**:
- Rust source files
- Test files
- Documentation comments

#### ReviewAgent

**Purpose**: Reviews code quality and security

**Usage** (triggered by Coordinator):
```bash
# Executed in worktree
```

**What it does**:
1. Runs `cargo clippy` (linter)
2. Runs `cargo check` (type check)
3. Runs `cargo audit` (security)
4. Checks test coverage
5. Calculates quality score (0-100)
6. Generates review report

**Quality Score Criteria**:
- **90-100**: Excellent (⭐⭐⭐)
- **80-89**: Good (⭐⭐)
- **70-79**: Fair (⭐)
- **< 70**: Needs improvement (❌)

**Merge threshold**: 80 points

#### PRAgent

**Purpose**: Creates pull requests with formatted descriptions

**Usage** (triggered by Coordinator):
```bash
# Executed after ReviewAgent passes
```

**What it does**:
1. Collects all commits from worktree
2. Generates PR description (Conventional Commits)
3. Adds metadata (Labels, Reviewers, Milestones)
4. Links to original Issue
5. Includes quality report
6. Creates PR on GitHub

**Output**:
- Pull Request URL
- PR metadata (title, body, labels)

### Agent Execution Context

Each agent runs in an isolated git worktree with context files:

**`.agent-context.json`** (machine-readable):
```json
{
  "agentType": "CodeGenAgent",
  "agentStatus": "executing",
  "task": {
    "id": "task-270-1",
    "title": "Implement authentication",
    "dependencies": []
  },
  "issue": {
    "number": 270,
    "title": "Add user authentication",
    "url": "https://github.com/..."
  },
  "worktreeInfo": {
    "path": ".worktrees/issue-270",
    "branch": "issue-270",
    "sessionId": "uuid-here"
  }
}
```

**`EXECUTION_CONTEXT.md`** (human-readable):
```markdown
# Agent Execution Context

## Issue Information
- **Issue**: #270
- **Title**: Add user authentication
- **URL**: https://github.com/...

## Task Information
- **Task ID**: task-270-1
- **Description**: Implement JWT authentication
- **Dependencies**: None

## Agent Information
- **Type**: CodeGenAgent
- **Status**: executing
- **Prompt**: .claude/agents/prompts/coding/codegen-agent-prompt.md

## Worktree Information
- **Path**: .worktrees/issue-270
- **Branch**: issue-270
- **Session ID**: uuid-here
```

---

## 🎛️ Advanced Features

### Parallel Execution with Worktrees

Miyabi uses git worktrees for true parallel execution:

**Architecture**:
```
┌─────────────────────────────────────────┐
│ Main Branch (main)                      │
└─────────────────────────────────────────┘
              │
      ┌───────┼───────┐
      │       │       │
      ▼       ▼       ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Worktree1│ │Worktree2│ │Worktree3│
│Issue#270│ │Issue#271│ │Issue#272│
└─────────┘ └─────────┘ └─────────┘
```

> ℹ️ **Windows パスについて**  
> 本ドキュメントでは例として `.worktrees/...` を使用していますが、Windows の既定値は `%LOCALAPPDATA%\Miyabi\wt` です。`miyabi setup` / `miyabi install` で生成される設定ファイルや `.env` に出力される `WORKTREE_BASE_DIR` を確認し、必要に応じてパスを読み替えてください。

**Benefits**:
- True parallel execution (no conflicts)
- Isolated environments
- Easy rollback (remove worktree)
- Independent debugging

**Manual Worktree Management**:
```bash
# List all worktrees
git worktree list

# Remove worktree
git worktree remove .worktrees/issue-270

# Cleanup stale worktrees
git worktree prune
```

### Label System (53 Labels)

Miyabi uses a structured 53-label system for state management:

**10 Categories**:

1. **STATE** (8 labels): Lifecycle management
   - `📥 state:pending` - Waiting to start
   - `🔍 state:analyzing` - Being analyzed
   - `🏗️ state:implementing` - Code being written
   - `👀 state:reviewing` - Under review
   - `✅ state:done` - Completed

2. **AGENT** (6 labels): Agent assignment
   - `🤖 agent:coordinator` - Orchestration
   - `🤖 agent:codegen` - Code generation
   - `🤖 agent:review` - Quality review

3. **PRIORITY** (4 labels): Urgency
   - `🔥 priority:P0-Critical` - Drop everything
   - `⚡ priority:P1-High` - ASAP
   - `📝 priority:P2-Medium` - Normal
   - `📝 priority:P3-Low` - When possible

4. **TYPE** (7 labels): Issue classification
   - `✨ type:feature` - New feature
   - `🐛 type:bug` - Bug fix
   - `📚 type:docs` - Documentation

5. **SEVERITY** (4 labels): Business impact
   - `🚨 severity:Sev.1-Critical` - Production down
   - `⚠️ severity:Sev.2-High` - Major impact
   - `📊 severity:Sev.3-Medium` - Minor impact
   - `📝 severity:Sev.4-Low` - Cosmetic

6. **PHASE** (5 labels): Project phase
   - `🎯 phase:planning`
   - `🏗️ phase:development`
   - `🚀 phase:deployment`

7. **SPECIAL** (7 labels): Special flags
   - `🔐 security` - Security-related
   - `💰 cost-watch` - Budget monitoring
   - `🔄 dependencies` - Dependency update

8. **TRIGGER** (4 labels): Automation triggers
   - `🤖 trigger:agent-execute` - Run agent
   - `🚀 trigger:deploy-staging` - Deploy to staging

9. **QUALITY** (4 labels): Quality score
   - `⭐ quality:excellent` (90-100)
   - `⭐ quality:good` (80-89)
   - `⭐ quality:fair` (70-79)

10. **COMMUNITY** (4 labels): Community engagement
    - `👋 good-first-issue`
    - `🙏 help-wanted`

**See also**: [LABEL_SYSTEM_GUIDE.md](./LABEL_SYSTEM_GUIDE.md)

### Custom Agents (Advanced)

You can create custom agents using the Agent SDK:

```rust
use miyabi_agents::BaseAgent;
use miyabi_types::{Task, AgentResult, MiyabiError};
use async_trait::async_trait;

pub struct CustomAgent {
    config: AgentConfig,
}

#[async_trait]
impl BaseAgent for CustomAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
        // Your custom logic here
        Ok(AgentResult::success("Custom agent executed"))
    }
}
```

**See also**: [Agent Development Guide](.claude/agents/README.md)

---

## ⚙️ Configuration

### `.miyabi.yml` File

Create a `.miyabi.yml` file in your project root:

```yaml
# GitHub Configuration
github:
  token: ${GITHUB_TOKEN}  # Use environment variable
  owner: YourUsername
  repo: your-repo

# Anthropic Configuration (optional, for custom agents)
anthropic:
  api_key: ${ANTHROPIC_API_KEY}

# Agent Configuration
agents:
  coordinator:
    enabled: true
    max_retries: 3
    timeout_seconds: 300

  codegen:
    enabled: true
    model: "claude-sonnet-4"  # AI model to use
    temperature: 0.7

  review:
    enabled: true
    quality_threshold: 80  # Minimum score for merge

# Logging Configuration
logging:
  level: info  # debug, info, warn, error
  format: json  # json, pretty

# Cache Configuration
cache:
  enabled: true
  ttl_seconds: 3600

# Worktree Configuration
worktree:
  base_dir: .worktrees
  auto_cleanup: true
  cleanup_on_error: false
```

### Environment Variables

**Required**:
```bash
export GITHUB_TOKEN=ghp_xxxxx
```

**Optional**:
```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx  # For custom agents
export RUST_LOG=info                    # Logging level
export RUST_BACKTRACE=1                 # Error backtraces
export MIYABI_PARALLEL_AGENTS=3         # Max parallel agents
```

### GitHub Token Scopes

Your GitHub token needs these scopes:

- `repo` - Full control of repositories
- `workflow` - Update GitHub Actions workflows
- `write:packages` - Upload packages to GitHub Packages
- `read:project`, `write:project` - Access Projects V2

**Create token**: https://github.com/settings/tokens/new

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Command not found

```bash
# Symptom
bash: miyabi: command not found

# Solution
# Check installation
which miyabi

# If not found, add to PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

# Make permanent
echo 'export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 2. GitHub authentication failed

```bash
# Symptom
Error: GitHub API authentication failed

# Solution 1: Use gh CLI (recommended)
gh auth login
gh auth status

# Solution 2: Check token
echo $GITHUB_TOKEN
# Should output: ghp_xxxxx

# Verify token scopes
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
```

#### 3. Binary incompatible

```bash
# Symptom
Error: cannot execute binary file: Exec format error

# Solution
# Check your architecture
uname -m  # Output: x86_64 or aarch64

# Download correct binary for your architecture
# See: DEPLOYMENT_GUIDE.md
```

#### 4. Worktree stuck

```bash
# Symptom
Error: Worktree already exists

# Solution
# List worktrees
git worktree list

# Remove stuck worktree
git worktree remove .worktrees/issue-270 --force

# Cleanup stale worktrees
git worktree prune
```

#### 5. Agent execution hangs

```bash
# Symptom
Agent execution stops responding

# Solution
# Check logs
tail -f ~/.miyabi/logs/miyabi.log

# Kill hung process
ps aux | grep miyabi
kill -9 <PID>

# Cleanup worktree
git worktree remove .worktrees/issue-270 --force
```

### Debug Mode

Enable verbose logging:

```bash
# Set log level to debug
export RUST_LOG=debug

# Run with backtraces
export RUST_BACKTRACE=full

# Run agent
miyabi agent run coordinator --issue 270
```

### Getting Help

If you're still stuck:

1. **GitHub Issues**: [Report a bug](https://github.com/ShunsukeHayashi/miyabi-private/issues)
2. **GitHub Discussions**: [Ask a question](https://github.com/ShunsukeHayashi/miyabi-private/discussions)
3. **Documentation**: Check [TROUBLESHOOTING.md](.claude/TROUBLESHOOTING.md)

---

## ❓ FAQ

### General

**Q: What is Miyabi?**
A: Miyabi is a complete autonomous AI development operations platform built on the "GitHub as OS" architecture. It automates the entire development workflow from Issue to Pull Request.

**Q: Is Miyabi free?**
A: Yes, Miyabi is open-source under Apache 2.0 license. However, you may incur costs from:
- GitHub API usage (if exceeding free tier)
- Anthropic API usage (if using custom agents with Claude)

**Q: What languages does Miyabi support?**
A: Miyabi v2.0 focuses on Rust development. TypeScript/JavaScript support is available in v1.x (legacy).

**Q: Can I use Miyabi for private repositories?**
A: Yes, Miyabi works with both public and private repositories.

### Installation

**Q: Which installation method should I use?**
A: For most users, the one-command installer is recommended:
```bash
curl -sSL https://raw.githubusercontent.com/ShunsukeHayashi/miyabi-private/main/scripts/install.sh | bash
```

**Q: Do I need Node.js?**
A: No. Miyabi v2.0 (Rust Edition) is a single binary with no runtime dependencies.

**Q: Can I install on Windows?**
A: Yes, using WSL2 (Windows Subsystem for Linux). Native Windows support is planned.

**Q: Can I install on Android (Termux)?**
A: Yes, but you'll need to install via cargo:
```bash
pkg install rust git
cargo install --git https://github.com/ShunsukeHayashi/miyabi-private miyabi-cli
```

### Usage

**Q: How long does agent execution take?**
A: Typically 10-15 minutes for a medium-complexity issue. Complex issues may take 30+ minutes.

**Q: Can I run multiple agents simultaneously?**
A: Yes! Use the `--concurrency` flag:
```bash
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

**Q: What happens if an agent fails?**
A: The worktree is preserved for debugging. You can:
1. Review logs in `.worktrees/issue-270/`
2. Fix issues manually
3. Re-run the agent
4. Or remove the worktree and start over

**Q: Can I customize agent behavior?**
A: Yes, through `.miyabi.yml` configuration and custom agent development. See [Agent Development Guide](.claude/agents/README.md).

### Performance

**Q: How fast is Miyabi compared to manual development?**
A: Benchmarks show:
- 50% faster execution (vs TypeScript version)
- 72% efficiency gain (parallel vs sequential execution)
- 10-15 minutes (Issue → PR) vs hours manually

**Q: How much memory does Miyabi use?**
A: Typical usage: 50-100MB RAM. Peak during build: 200-300MB.

**Q: Can I use Miyabi on a low-spec machine?**
A: Yes, but reduce concurrency:
```bash
miyabi agent run coordinator --issue 270 --concurrency 1
```

### Security

**Q: Is my GitHub token secure?**
A: Yes. Best practices:
- Use `gh CLI` for automatic token management
- Never commit `.env` files
- Use environment variables
- Rotate tokens regularly

**Q: Does Miyabi scan my code for vulnerabilities?**
A: Yes, ReviewAgent runs:
- `cargo clippy` (linter)
- `cargo audit` (security vulnerabilities)
- CodeQL (if configured in GitHub Actions)

**Q: Can I use Miyabi in production?**
A: Miyabi is production-ready, but:
- **Always review AI-generated code**
- Test thoroughly before merging
- Use deployment safeguards (staging → production)

### Migration

**Q: How do I migrate from TypeScript version?**
A: Follow the migration guide:
```bash
./scripts/migrate-to-rust.sh
```
See [RUST_MIGRATION_GUIDE.md](./RUST_MIGRATION_GUIDE.md)

**Q: Will my existing configurations work?**
A: Most configurations are compatible. You'll need to convert camelCase to snake_case in `.miyabi.yml`. The migration script handles this automatically.

---

## 🎯 Best Practices

### Issue Writing

**Good Issue**:
```markdown
# Title: Implement JWT authentication

## Description
Implement JWT-based authentication with:
- Access token (15min expiry)
- Refresh token (7 days expiry)
- Token rotation on refresh

## Acceptance Criteria
- [ ] Users can login with email/password
- [ ] JWT tokens are generated and validated
- [ ] Refresh token endpoint works
- [ ] 80%+ test coverage
- [ ] API documentation updated

## Technical Notes
- Use `jsonwebtoken` crate
- Store tokens in Redis
- Follow OAuth2 best practices
```

**Bad Issue**:
```markdown
# Title: Auth

Add authentication
```

**Tips**:
- Be specific and detailed
- Include acceptance criteria
- Mention technical constraints
- Link to related issues/PRs

### Agent Execution

**Before running agents**:
1. ✅ Write clear, detailed Issue
2. ✅ Ensure GitHub token is valid
3. ✅ Check disk space (worktrees need ~100MB each)
4. ✅ Review `.miyabi.yml` configuration

**During execution**:
1. ✅ Monitor progress: `miyabi status --watch`
2. ✅ Check logs if issues occur
3. ✅ Don't interrupt (unless emergency)

**After execution**:
1. ✅ Review generated code thoroughly
2. ✅ Run tests locally
3. ✅ Check quality score (should be >= 80)
4. ✅ Review and merge PR

### Code Review

**Reviewing AI-generated code**:

✅ **DO**:
- Read every line carefully
- Run tests locally
- Check for security issues
- Verify logic correctness
- Test edge cases

❌ **DON'T**:
- Auto-merge without review
- Skip testing
- Ignore clippy warnings
- Deploy directly to production

**Quality Checklist**:
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Test coverage >= 80%
- [ ] No clippy warnings
- [ ] Documentation is clear
- [ ] Security best practices followed
- [ ] Performance acceptable

### Git Workflow

**Branch Strategy**:
```bash
main (protected)
  ├── issue-270  (feature branch)
  ├── issue-271  (feature branch)
  └── issue-272  (feature branch)
```

**Commit Messages**:
Follow Conventional Commits:
```bash
feat: Add JWT authentication
fix: Correct token expiry logic
docs: Update API documentation
test: Add authentication tests
refactor: Simplify token validation
```

**PR Merge Strategy**:
- Use "Squash and Merge" for clean history
- Delete branch after merge
- Link PR to Issue (use "Closes #270")

### Configuration Management

**Secret Management**:
```bash
# ❌ BAD: Hardcoded tokens
GITHUB_TOKEN=ghp_xxxxx

# ✅ GOOD: Environment variables
export GITHUB_TOKEN=$(gh auth token)

# ✅ BEST: gh CLI (automatic)
gh auth login
```

**Configuration Files**:
```bash
# Never commit these
.env
.miyabi.yml  # if contains secrets

# Add to .gitignore
echo ".env" >> .gitignore
echo ".miyabi.yml" >> .gitignore

# Commit template instead
.miyabi.yml.example
```

### Performance Optimization

**Parallel Execution**:
```bash
# Low-spec machine (2 cores, 4GB RAM)
miyabi agent run coordinator --issues 270,271 --concurrency 1

# Mid-spec machine (4 cores, 8GB RAM)
miyabi agent run coordinator --issues 270,271,272 --concurrency 2

# High-spec machine (8+ cores, 16GB+ RAM)
miyabi agent run coordinator --issues 270,271,272,273,274 --concurrency 5
```

**Cache Management**:
```yaml
# .miyabi.yml
cache:
  enabled: true
  ttl_seconds: 3600  # 1 hour
```

**Log Rotation**:
```bash
# Cleanup old logs
find ~/.miyabi/logs -name "*.log" -mtime +7 -delete
```

---

## 📚 Additional Resources

### Documentation

- **[Quick Start Guide](.claude/QUICK_START.md)** - 3-minute setup
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Installation methods
- **[Container Guide](./CONTAINER_GUIDE.md)** - Docker usage
- **[Migration Guide](./RUST_MIGRATION_GUIDE.md)** - TypeScript → Rust
- **[Label System Guide](./LABEL_SYSTEM_GUIDE.md)** - 53-label system
- **[Troubleshooting](.claude/TROUBLESHOOTING.md)** - Common issues
- **[API Documentation](./API_REFERENCE.md)** - Rust API reference (coming soon)

### Community

- **GitHub Issues**: [Report bugs](https://github.com/ShunsukeHayashi/miyabi-private/issues)
- **GitHub Discussions**: [Ask questions](https://github.com/ShunsukeHayashi/miyabi-private/discussions)
- **Discord**: [Join community](https://discord.gg/miyabi)
- **X (Twitter)**: [@The_AGI_WAY](https://x.com/The_AGI_WAY)

### Development

- **[Agent Development](.claude/agents/README.md)** - Create custom agents
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines
- **[Changelog](../CHANGELOG.md)** - Release notes

---

## 📝 Changelog

### v2.0.0 (2025-10-15) - Rust Edition

**Major Changes**:
- ✅ Complete rewrite in Rust
- ✅ 50% faster execution
- ✅ 30% less memory usage
- ✅ Single binary distribution
- ✅ 347 tests (vs 180 in TypeScript)

**New Features**:
- ✅ Universal installer script
- ✅ Multi-platform binaries
- ✅ Docker container (GHCR)
- ✅ Comprehensive documentation

**Breaking Changes**:
- Configuration: camelCase → snake_case
- CLI: Some flags renamed
- API: Rust-specific types

**Migration**: See [RUST_MIGRATION_GUIDE.md](./RUST_MIGRATION_GUIDE.md)

---

## 📞 Support

If you need help:

1. **Check Documentation**: Most questions are answered in this guide or other docs
2. **Search Issues**: Someone may have had the same problem
3. **Ask in Discussions**: Community members can help
4. **Report Bug**: If you found a bug, create an Issue

---

**Last Updated**: 2025-10-16
**Version**: 2.0 (Rust Edition)
**Maintained by**: [Shunsuke Hayashi](https://github.com/ShunsukeHayashi)

**License**: Apache 2.0
**Repository**: https://github.com/ShunsukeHayashi/miyabi-private
