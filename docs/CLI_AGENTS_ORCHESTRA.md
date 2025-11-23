# CLI Agents Orchestra - Multi-Agent Coordination System

**Version**: 1.0.0
**Created**: 2025-11-19
**Status**: Production Ready

---

## Overview

The CLI Agents Orchestra is a comprehensive multi-agent coordination system that enables Miyabi to orchestrate multiple AI CLI tools simultaneously. This system provides unified control over:

- **Cursor Agent CLI** - AI code editor agent
- **Claude Code CLI** - Anthropic's terminal-based coding agent
- **Gemini CLI** - Google's Gemini 3 Adaptive Runtime
- **Custom MCP Servers** - Model Context Protocol integrations

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Miyabi CLI Orchestra            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Routing Engine                │   │
│  │   - Auto routing                │   │
│  │   - Load balancing              │   │
│  │   - Failover handling           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌──────────┬──────────┬──────────┐   │
│  │  Cursor  │  Claude  │  Gemini  │   │
│  │  Agent   │  Code    │  CLI     │   │
│  └──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────┘
```

---

## Features

### 1. Unified CLI Interface

Access all AI coding agents through a single command:

```bash
miyabi cursor chat "implement authentication"
miyabi orchestra route "review this PR"
miyabi orchestra parallel "find all bugs"
```

### 2. Intelligent Routing

The system automatically routes tasks to the best agent based on:

- **Task type** (editing, reviewing, debugging)
- **Agent capabilities** (context length, model support)
- **Agent availability** (installation status)
- **Load balancing** (round-robin, priority-based)

### 3. Parallel Execution

Execute tasks across multiple agents simultaneously:

```bash
miyabi orchestra parallel "analyze this codebase" \
  --agents cursor,claude,gemini \
  --aggregate
```

### 4. tmux Integration

Run agents in parallel tmux panes for visual monitoring:

```bash
miyabi orchestra start \
  --agents cursor,claude,gemini \
  --panes-per-agent 2 \
  --session miyabi-orchestra
```

---

## Installation

### 1. Cursor Agent CLI

```bash
# Install via Miyabi
miyabi cursor install

# Or install manually
curl https://cursor.com/install -fsSL | bash
```

### 2. Claude Code CLI

```bash
# Install via npm
npm install -g @anthropics/claude-code

# Or via Homebrew (macOS)
brew install claude-code
```

### 3. Gemini CLI

```bash
# Coming soon - Gemini 3 Adaptive Runtime
# Will be integrated as MCP server
```

---

## Usage Guide

### Cursor Agent CLI

#### Chat Mode
```bash
miyabi cursor chat "implement user authentication"
```

#### Bug Fixing
```bash
miyabi cursor fix --scope current
miyabi cursor fix --scope worktree --issue 123
miyabi cursor fix --scope all --dry-run
```

#### Code Review
```bash
miyabi cursor review --issue 123
miyabi cursor review --path src/auth.rs --format markdown
```

#### Code Composition
```bash
miyabi cursor compose "add error handling" --target src/main.rs
```

#### Status & Configuration
```bash
miyabi cursor status
miyabi cursor status --verbose

miyabi cursor config --show
miyabi cursor config --api-key sk-xxx --provider openai
```

### Orchestra Commands

#### Start Orchestra
```bash
# Start with default agents
miyabi orchestra start --agents cursor,claude,gemini

# Start with custom tmux session
miyabi orchestra start \
  --agents cursor,claude \
  --panes-per-agent 3 \
  --session my-coding-session
```

#### Route Tasks
```bash
# Auto-routing (intelligent selection)
miyabi orchestra route "implement OAuth" --strategy auto

# Prefer specific agent
miyabi orchestra route "refactor this code" --prefer cursor

# Round-robin routing
miyabi orchestra route "review PR #123" --strategy round-robin

# Priority-based routing (claude > cursor > gemini)
miyabi orchestra route "design architecture" --strategy priority
```

#### Parallel Execution
```bash
# Run on all installed agents
miyabi orchestra parallel "find security vulnerabilities"

# Run on specific agents
miyabi orchestra parallel "optimize performance" \
  --agents cursor,claude

# Aggregate results
miyabi orchestra parallel "analyze code quality" \
  --agents cursor,claude,gemini \
  --aggregate
```

#### Status & Management
```bash
# Show agent status
miyabi orchestra status
miyabi orchestra status --verbose

# Add agent to running orchestra
miyabi orchestra add gemini --panes 2

# Remove agent
miyabi orchestra remove cursor

# Stop orchestra
miyabi orchestra stop
miyabi orchestra stop --force
```

---

## Agent Capabilities

### Cursor Agent

| Feature | Value |
|---------|-------|
| **Strengths** | Code editing, Refactoring, Bug fixing, IDE integration |
| **Models** | GPT-4o, Claude 3 Opus, Gemini Pro |
| **Max Context** | 128K tokens |
| **MCP Support** | ✅ Yes |
| **Best For** | Interactive code editing, quick fixes |

### Claude Code

| Feature | Value |
|---------|-------|
| **Strengths** | Complex reasoning, Architecture, Documentation, Code review |
| **Models** | Claude Sonnet 4, Claude Opus 4, Claude Haiku 4 |
| **Max Context** | 200K tokens |
| **MCP Support** | ✅ Yes |
| **Best For** | Design decisions, comprehensive reviews |

### Gemini CLI

| Feature | Value |
|---------|-------|
| **Strengths** | Multimodal understanding, Long context, Fast inference |
| **Models** | Gemini 3 Pro, Gemini 3 Ultra, Gemini 3 Flash |
| **Max Context** | 2M tokens |
| **MCP Support** | ✅ Yes |
| **Best For** | Large codebase analysis, multimodal tasks |

---

## Routing Strategies

### Auto Routing

Analyzes the task prompt and selects the best agent:

- **"refactor"** → Cursor (best for editing)
- **"review"** → Claude Code (best for analysis)
- **"multimodal"** → Gemini (handles images/video)

### Round-Robin

Distributes tasks evenly across all available agents:

```
Task 1 → Cursor
Task 2 → Claude
Task 3 → Gemini
Task 4 → Cursor (cycles back)
```

### Priority-Based

Follows a predefined priority order:

```
1. Claude Code (highest quality reasoning)
2. Cursor (best IDE integration)
3. Gemini (fastest inference)
4. Codex (fallback)
```

### Capability-Based

Routes based on specific requirements:

- **Long context (>100K)** → Claude Code or Gemini
- **MCP required** → Any (all support MCP)
- **Fastest response** → Gemini Flash

---

## Integration with Miyabi Workflows

### With Infinity Mode

```bash
# Use orchestra for parallel issue processing
miyabi infinity --concurrency 3 --agent-router orchestra
```

### With Git Worktrees

```bash
# Different agents in different worktrees
miyabi worktree create feat-auth --agent cursor
miyabi worktree create feat-docs --agent claude
```

### With tmux Sessions

```bash
# Full orchestra setup
miyabi orchestra start \
  --agents cursor,claude,gemini \
  --panes-per-agent 2 \
  --session miyabi-dev

# Attach to session
tmux attach -t miyabi-dev
```

---

## Configuration

### Cursor Configuration

Location: `~/.cursor/cli-config.json`

```json
{
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",
  "google_api_key": "AIza...",
  "default_model": "gpt-4o",
  "permissions": {
    "read": ["**/*.rs", "**/*.ts"],
    "write": ["src/**"],
    "execute": ["cargo", "npm"]
  }
}
```

### Orchestra Configuration

Location: `.miyabi/orchestra-config.toml`

```toml
[orchestra]
default_agents = ["cursor", "claude", "gemini"]
default_strategy = "auto"
tmux_session_prefix = "miyabi-orchestra"

[agents.cursor]
enabled = true
priority = 2
max_concurrent = 3

[agents.claude]
enabled = true
priority = 1
max_concurrent = 2

[agents.gemini]
enabled = true
priority = 3
max_concurrent = 5
```

---

## Troubleshooting

### Agent Not Found

```bash
# Check installation status
miyabi orchestra status

# Install missing agent
miyabi cursor install
```

### Command Not Working

```bash
# Verify agent is in PATH
which cursor-agent
which claude

# Check version
cursor-agent --version
claude --version
```

### tmux Session Issues

```bash
# List all sessions
tmux list-sessions

# Kill stuck session
tmux kill-session -t miyabi-orchestra

# Restart orchestra
miyabi orchestra stop --force
miyabi orchestra start --agents cursor,claude
```

---

## Advanced Usage

### Custom Agent Wrapper

Create a wrapper script for unsupported agents:

```bash
#!/bin/bash
# ~/.local/bin/my-agent

# Your custom agent logic here
exec your-ai-cli "$@"
```

### MCP Server Integration

Register custom MCP servers:

```json
{
  "mcpServers": {
    "my-custom-agent": {
      "command": "npx",
      "args": ["-y", "@myorg/my-agent-mcp"]
    }
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/ai-review.yml
name: AI Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Miyabi
        run: cargo install miyabi-cli
      - name: Install Cursor
        run: miyabi cursor install
      - name: Run Review
        run: miyabi cursor review --format json > review.json
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const review = require('./review.json')
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review.summary
            })
```

---

## Roadmap

### Phase 1 (Completed)
- ✅ Cursor Agent CLI integration
- ✅ Orchestra orchestration system
- ✅ Auto-routing and load balancing
- ✅ tmux integration

### Phase 2 (In Progress)
- 🚧 Gemini CLI integration
- 🚧 OpenAI Codex CLI support
- 🚧 Result aggregation and comparison
- 🚧 Performance benchmarking

### Phase 3 (Planned)
- 📋 Custom agent SDK
- 📋 Web dashboard for orchestra
- 📋 Real-time collaboration
- 📋 Agent performance analytics

---

## Contributing

To add a new CLI agent:

1. Define capability in `cli_orchestra.rs`:

```rust
agents.insert(
    "your-agent".to_string(),
    AgentCapability {
        name: "Your Agent".to_string(),
        cli_command: "your-agent-cli".to_string(),
        strengths: vec!["Your strength".to_string()],
        supported_models: vec!["model-name".to_string()],
        max_context: Some(100_000),
        supports_mcp: true,
    },
);
```

2. Create dedicated command module in `commands/`:

```rust
// commands/your_agent.rs
pub struct YourAgentCommand;
```

3. Add to `Commands` enum in `main.rs`

4. Test and document

---

## License

Part of the Miyabi project - MIT License

---

## Support

- **Documentation**: https://miyabi.dev/docs/cli-orchestra
- **Issues**: https://github.com/customer-cloud/miyabi-private/issues
- **Discord**: https://discord.gg/miyabi

---

**Built with ❤️ by the Miyabi Team**
