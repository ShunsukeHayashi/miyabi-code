# miyabi-cli

**Status**: Stable
**Category**: Tool

## Overview

Miyabi CLI - 一つのコマンドで全てが完結。The command-line interface for the Miyabi autonomous AI development platform. Provides comprehensive workflow automation, agent orchestration, and project management capabilities.

## Features

- **Agent Orchestration**: Execute all 21 Miyabi agents from command line
- **Workflow Automation**: Parallel and sequential task execution
- **Mode Management**: Infinity, parallel, and interactive modes
- **Git Worktree Integration**: Automatic worktree lifecycle management
- **Knowledge Base**: Qdrant-powered knowledge search and retrieval
- **Status Monitoring**: Real-time workflow and agent status tracking
- **Configuration Management**: Flexible YAML/TOML/JSON configuration
- **Interactive UI**: Rich terminal interface with progress bars and tables

## Installation

### From Source

```bash
cd crates/miyabi-cli
cargo install --path .
```

### Binary

```bash
cargo install miyabi-cli
```

## Usage

### Quick Start

```bash
# Initialize new project
miyabi init my-project

# Check system status
miyabi status

# Work on a GitHub Issue
miyabi work-on 123

# Execute agent
miyabi agent coordinator --issue 123

# Parallel execution
miyabi parallel --issues 123,124,125 --concurrency 3

# Infinity mode (process all open issues)
miyabi infinity
```

### Commands

#### `miyabi init`
Initialize a new Miyabi project with configuration wizard.

```bash
miyabi init my-project
# Interactive prompts for:
# - GitHub repository
# - API keys
# - Agent configuration
```

#### `miyabi work-on <issue>`
Start working on a GitHub Issue with automatic worktree creation.

```bash
miyabi work-on 456
# Creates worktree at .worktrees/issue-456
# Switches to feature branch
# Ready for development
```

#### `miyabi agent <type>`
Execute a specific agent.

```bash
# Coordinator agent
miyabi agent coordinator --issue 123

# CodeGen agent
miyabi agent codegen --issue 124 --worktree .worktrees/issue-124

# Review agent
miyabi agent review --pr 125
```

#### `miyabi parallel`
Execute multiple tasks in parallel.

```bash
# Process 3 issues concurrently
miyabi parallel --issues 123,124,125 --concurrency 3

# With specific agents
miyabi parallel --issues 123,124 --agent codegen
```

#### `miyabi infinity`
Process all open GitHub Issues continuously.

```bash
miyabi infinity
# Fetches all open issues
# Assigns to agents based on labels
# Executes in parallel with max concurrency
```

#### `miyabi status`
Display current system status.

```bash
# One-time check
miyabi status

# Watch mode (updates every 5s)
miyabi status --watch
```

#### `miyabi knowledge`
Search and manage knowledge base.

```bash
# Search knowledge
miyabi knowledge search "error handling"

# Add entry
miyabi knowledge add --text "Best practice for..." --tags rust,error
```

#### `miyabi config`
Manage configuration.

```bash
# Show current config
miyabi config show

# Edit config
miyabi config edit

# Validate config
miyabi config validate
```

## Configuration

### Configuration File

Location: `~/.miyabi/config.yaml` or project `.miyabi.yml`

```yaml
# GitHub settings
github:
  token: ${GITHUB_TOKEN}
  repository: owner/repo
  device_identifier: MacBook

# Agent settings
agents:
  max_concurrency: 5
  timeout_seconds: 3600

# LLM settings
llm:
  provider: anthropic
  model: claude-sonnet-4-20250514
  api_key: ${ANTHROPIC_API_KEY}

# Worktree settings
worktree:
  base_path: .worktrees
  cleanup_on_completion: true

# Knowledge settings
knowledge:
  qdrant_url: http://localhost:6333
  collection_name: miyabi-knowledge
```

### Environment Variables

```bash
# Required
export GITHUB_TOKEN="ghp_xxx"
export ANTHROPIC_API_KEY="sk-xxx"

# Optional
export OPENAI_API_KEY="sk-xxx"
export DEVICE_IDENTIFIER="MacBook"
export RUST_LOG="info"
```

## Architecture

```
miyabi-cli
├── commands/          # Command implementations
│   ├── agent.rs       # Agent execution
│   ├── init.rs        # Project initialization
│   ├── parallel.rs    # Parallel execution
│   ├── status.rs      # Status monitoring
│   └── ...
├── agents/            # Agent integrations
├── config.rs          # Configuration management
├── display.rs         # Terminal UI
├── service.rs         # Core service layer
└── main.rs            # CLI entry point
```

## Examples

### Example 1: Complete Workflow

```bash
# 1. Initialize project
miyabi init my-ai-project

# 2. Check status
miyabi status

# 3. Work on issue
miyabi work-on 100

# 4. Generate code
cd .worktrees/issue-100
miyabi agent codegen --issue 100

# 5. Review changes
miyabi agent review --pr 101

# 6. Deploy
miyabi agent deploy --pr 101
```

### Example 2: Parallel Processing

```bash
# Process multiple issues
miyabi parallel \
  --issues 100,101,102,103,104 \
  --concurrency 3 \
  --agent coordinator

# Output:
# ✓ Issue 100: Complete
# ✓ Issue 101: Complete
# ⏳ Issue 102: In Progress
# ...
```

### Example 3: Knowledge Search

```bash
# Search for error handling patterns
miyabi knowledge search "async error handling in Rust"

# Results:
# 1. thiserror crate best practices (relevance: 0.95)
# 2. anyhow vs thiserror comparison (relevance: 0.87)
# 3. Custom error types example (relevance: 0.82)
```

## Dependencies

- `clap`: Command-line argument parsing
- `tokio`: Async runtime
- `dialoguer`: Interactive prompts
- `colored`: Terminal colors
- `indicatif`: Progress bars
- `comfy-table`: Table formatting
- `miyabi-agents`: Agent implementations
- `miyabi-orchestrator`: Task orchestration
- `miyabi-worktree`: Worktree management
- `miyabi-knowledge`: Knowledge base

## Development Status

- [x] Basic functionality
- [x] All commands implemented
- [x] Agent integration
- [x] Parallel execution
- [x] Status monitoring
- [x] Knowledge search
- [x] Configuration management
- [x] Tests
- [x] Documentation
- [ ] Shell completions
- [ ] Plugin system

## Shell Completions

Generate completions for your shell:

```bash
# Bash
miyabi completions bash > /usr/local/etc/bash_completion.d/miyabi

# Zsh
miyabi completions zsh > /usr/local/share/zsh/site-functions/_miyabi

# Fish
miyabi completions fish > ~/.config/fish/completions/miyabi.fish
```

## Troubleshooting

### Issue: Command not found

```bash
# Add cargo bin to PATH
export PATH="$HOME/.cargo/bin:$PATH"
```

### Issue: Configuration not found

```bash
# Initialize configuration
miyabi init

# Or manually create
mkdir -p ~/.miyabi
cp .miyabi.example.yml ~/.miyabi/config.yaml
```

## Related Crates

- `miyabi-agents`: All 21 agent implementations
- `miyabi-orchestrator`: Task orchestration engine
- `miyabi-worktree`: Git worktree management
- `miyabi-knowledge`: Qdrant knowledge base
- `miyabi-core`: Core utilities
- `miyabi-types`: Shared type definitions

## License

Apache-2.0
