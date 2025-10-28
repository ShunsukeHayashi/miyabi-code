# 📚 .claude Directory - Master Index

**Version**: 2.0.0
**Date**: 2025-10-27
**Purpose**: Central navigation hub for all Claude Code resources

---

## 🚀 Quick Start

- **New to Miyabi?** → [QUICK_START.md](QUICK_START.md)
- **Project Overview** → [README.md](README.md)
- **Core Rules** → [context/core-rules.md](context/core-rules.md)
- **Optimization Plan** → [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md)

---

## 📖 Documentation by Topic

### 🎯 Core Concepts

| Document | Purpose | Priority |
|----------|---------|----------|
| [context/core-rules.md](context/core-rules.md) | MCP First, Benchmark Protocol, Context7 | ⭐⭐⭐⭐⭐ |
| [context/architecture.md](context/architecture.md) | Cargo Workspace, GitHub OS, Worktree | ⭐⭐⭐⭐ |
| [context/agents.md](context/agents.md) | 14 Agents + 10 planned | ⭐⭐⭐⭐ |
| [context/entity-relation.md](context/entity-relation.md) | 12 Entities, 27 Relations | ⭐⭐⭐ |

### 🤖 Agent System

| Document | Purpose | Priority |
|----------|---------|----------|
| [agents/README.md](agents/README.md) | Agent system overview | ⭐⭐⭐⭐ |
| [agents/AGENT_CHARACTERS.md](agents/AGENT_CHARACTERS.md) | Agent personalities and roles | ⭐⭐⭐ |
| [agents/WORKFLOW_INDEX.md](agents/WORKFLOW_INDEX.md) | Agent workflow patterns | ⭐⭐⭐ |
| [agents/specs/business/](agents/specs/business/) | Business agent specifications (14 specs) | ⭐⭐⭐ |
| [agents/specs/coding/](agents/specs/coding/) | Coding agent specifications (10 specs) | ⭐⭐ |

### ⚡ Commands & Slash Commands

| Command | Purpose | File |
|---------|---------|------|
| `/claude-code-x` | Autonomous Claude Code executor | [commands/claude-code-x.md](commands/claude-code-x.md) |
| `/codex` | Codex X integration | [commands/codex.md](commands/codex.md) |
| `/agent-run` | Run Miyabi agents | [commands/agent-run.md](commands/agent-run.md) |
| `/miyabi-infinity` | Infinity mode workflow | [commands/miyabi-infinity.md](commands/miyabi-infinity.md) |
| `/create-issue` | Create GitHub issues | [commands/create-issue.md](commands/create-issue.md) |
| `/verify` | System verification | [commands/verify.md](commands/verify.md) |
| `/session-end` | Session end notification | [commands/session-end.md](commands/session-end.md) |
| `/voicevox` | Voice synthesis | [commands/voicevox.md](commands/voicevox.md) |

**Full List**: [commands/INDEX.md](commands/INDEX.md)

### 🛠️ Development

| Document | Purpose | Priority |
|----------|---------|----------|
| [context/rust.md](context/rust.md) | Rust 2021 development guide | ⭐⭐⭐⭐ |
| [context/development.md](context/development.md) | Testing, CI/CD, conventions | ⭐⭐⭐ |
| [context/worktree.md](context/worktree.md) | Git worktree usage | ⭐⭐⭐ |
| [HOOKS_IMPLEMENTATION_GUIDE.md](HOOKS_IMPLEMENTATION_GUIDE.md) | Hook system implementation | ⭐⭐ |

### 🔧 Integration & Protocols

| Document | Purpose | Priority |
|----------|---------|----------|
| [MCP_INTEGRATION_PROTOCOL.md](MCP_INTEGRATION_PROTOCOL.md) | MCP integration guide | ⭐⭐⭐⭐ |
| [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](BENCHMARK_IMPLEMENTATION_CHECKLIST.md) | Benchmark implementation | ⭐⭐⭐⭐ |
| [context/external-deps.md](context/external-deps.md) | External dependencies | ⭐⭐⭐ |
| [context/protocols.md](context/protocols.md) | Task management protocols | ⭐⭐ |

### 📊 Workflows & Patterns

| Document | Purpose | Priority |
|----------|---------|----------|
| [CODEX_DESIGN_PATTERNS.md](CODEX_DESIGN_PATTERNS.md) | Codex X design patterns | ⭐⭐⭐ |
| [CODEX_PATTERN_APPLICATION_PLAN.md](CODEX_PATTERN_APPLICATION_PLAN.md) | Pattern application guide | ⭐⭐⭐ |
| [NEXT_PHASE_PLANNING.md](NEXT_PHASE_PLANNING.md) | Future planning | ⭐⭐ |

### 🏷️ Labels & Issues

| Document | Purpose | Priority |
|----------|---------|----------|
| [context/labels.md](context/labels.md) | 53 label system | ⭐⭐⭐ |
| [LABEL_USAGE_GUIDE.md](LABEL_USAGE_GUIDE.md) | Label usage guide | ⭐⭐ |

### 🐛 Troubleshooting

| Document | Purpose | Priority |
|----------|---------|----------|
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions | ⭐⭐⭐ |

---

## 🔌 Skills & Extensions

### Claude Code Skills

Located in `Skills/` directory:

| Skill | Purpose |
|-------|---------|
| **agent-execution** | Execute Miyabi Agents with Git Worktree |
| **business-strategy-planning** | Business planning and strategy |
| **content-marketing-strategy** | Content marketing and SNS |
| **debugging-troubleshooting** | Systematic debugging |
| **dependency-management** | Dependency updates and conflicts |
| **documentation-generation** | Auto-generate documentation |
| **git-workflow** | Git operations and PR management |
| **growth-analytics-dashboard** | Data analysis and KPI tracking |
| **issue-analysis** | GitHub Issue analysis and labeling |
| **market-research-analysis** | Market research and competitor analysis |
| **performance-analysis** | Performance profiling and optimization |
| **project-setup** | New project initialization |
| **rust-development** | Rust development workflow |
| **sales-crm-management** | Sales and CRM |
| **security-audit** | Security scanning and auditing |
| **voicevox** | Voice narration generation |

**Full List**: [Skills/README.md](Skills/README.md)

### MCP Servers

Located in `mcp-servers/` directory:

| Server | Purpose |
|--------|---------|
| **discord-integration.js** | Discord bot integration |
| **github-enhanced.cjs** | Enhanced GitHub operations |
| **ide-integration.cjs** | IDE integration |
| **image-generation.js** | Image generation (DALL-E, etc.) |
| **miyabi-integration.js** | Miyabi system integration |
| **ollama-integration.cjs** | Ollama LLM integration |
| **project-context.cjs** | Project context management |

---

## 🪝 Hooks

Located in `hooks/` directory:

| Hook | Trigger | Purpose |
|------|---------|---------|
| **agent-complete.sh** | Agent completion | Post-agent actions |
| **agent-event.sh** | Agent events | Agent event handling |
| **auto-format.sh** | Code changes | Auto-format code |
| **autocompact-manager.sh** | Periodic | Session compaction |
| **circuit-breaker-event.sh** | Circuit breaker | Error handling |
| **dynamic-scaling-event.sh** | Scaling events | Resource scaling |
| **feedback-loop-event.sh** | Feedback loops | Loop detection |
| **log-commands.sh** | Command execution | Command logging |
| **notification.sh** | Events | Notifications |
| **orchestrator-event.sh** | Orchestrator | Workflow events |
| **session-continue.sh** | Session resume | Session continuation |
| **session-keepalive.sh** | Periodic | Session keepalive |
| **session-start.sh** | Session start | Session initialization |
| **tool-use.sh** | Tool usage | Tool execution tracking |
| **validate-rust.sh** | Rust code | Rust validation |
| **validate-typescript.sh** | TypeScript code | TS validation |

**Full Guide**: [hooks/README.md](hooks/README.md)

---

## 📝 Templates & Prompts

### Templates

Located in `templates/` directory:

- **reporting-protocol.md** - Standard reporting format

### Prompts

Located in `prompts/` directory:

- **task-management-protocol.md** - Task management guidelines
- **worktree-agent-execution.md** - Worktree agent patterns

---

## 🧪 Testing & Results

### Test Results

Located in `test-results/` directory:

| Report | Purpose |
|--------|---------|
| **AI_CLI_INTEGRATION_TEST_REPORT.md** | AI CLI integration testing |
| **codex-test-result.md** | Codex X test results |
| **gemini-test-result.md** | Gemini test results |

### Test Instructions

- **TEST_INSTRUCTIONS_FOR_CODEX.md** - Codex X testing guide
- **TEST_INSTRUCTIONS_FOR_GEMINI.md** - Gemini testing guide

---

## ⚙️ Configuration

### Settings Files

| File | Purpose |
|------|---------|
| **settings.json** | Main settings |
| **settings.example.json** | Example configuration |
| **settings.local.json** | Local overrides |
| **mcp-config.json** | MCP configuration |
| **mcp.json** | MCP server list |
| **ai-cli-versions.json** | AI CLI version tracking |

### Agent Configuration

| File | Purpose |
|------|---------|
| **agent-name-mapping.json** | Agent name mappings |
| **triggers.json** | Agent triggers |

---

## 📚 AI CLI Documentation

Located in `docs/` directory:

| Document | Purpose |
|----------|---------|
| **AI_CLI_COMPARISON.md** | AI CLI comparison |
| **AI_CLI_COMPLETE_GUIDE.md** | Complete AI CLI guide |
| **AI_CLI_INTEGRATION_TEST_PLAN.md** | Integration test plan |
| **CODEX_CLARIFICATION.md** | Codex clarification |

---

## 🔍 Quick Reference

### By Use Case

**Starting a new task?**
1. Read [QUICK_START.md](QUICK_START.md)
2. Check [context/core-rules.md](context/core-rules.md)
3. Use appropriate slash command from [commands/INDEX.md](commands/INDEX.md)

**Debugging an issue?**
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review [context/development.md](context/development.md)
3. Use `/verify` command

**Running an agent?**
1. Review [agents/README.md](agents/README.md)
2. Check agent spec in [agents/specs/](agents/specs/)
3. Use `/agent-run` command

**Integrating external tool?**
1. Read [MCP_INTEGRATION_PROTOCOL.md](MCP_INTEGRATION_PROTOCOL.md)
2. Check [context/external-deps.md](context/external-deps.md)
3. Add MCP server to `mcp-servers/`

### By Priority

**⭐⭐⭐⭐⭐ Essential** (Read first):
- [context/core-rules.md](context/core-rules.md)
- [QUICK_START.md](QUICK_START.md)
- [README.md](README.md)

**⭐⭐⭐⭐ High** (Read next):
- [context/architecture.md](context/architecture.md)
- [context/agents.md](context/agents.md)
- [agents/README.md](agents/README.md)
- [context/rust.md](context/rust.md)
- [MCP_INTEGRATION_PROTOCOL.md](MCP_INTEGRATION_PROTOCOL.md)
- [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](BENCHMARK_IMPLEMENTATION_CHECKLIST.md)

**⭐⭐⭐ Medium** (As needed):
- All other context files
- Agent specifications
- Command documentation

**⭐⭐ Low** (Reference):
- Test results
- Configuration examples
- Legacy documentation

---

## 🔄 Recent Updates

### 2025-10-27
- ✅ Added Claude Code X implementation
- ✅ Added optimal workflow documentation
- ✅ Added Codex X integration framework
- ✅ Created this master INDEX

### See Also
- [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) - Future directory optimizations
- [NEXT_PHASE_PLANNING.md](NEXT_PHASE_PLANNING.md) - Planned features

---

## 📊 Statistics

- **Total Files**: 104
- **Directories**: 31
- **Slash Commands**: 20+
- **Skills**: 16
- **MCP Servers**: 7
- **Hooks**: 16
- **Agent Specs**: 24 (14 business, 10 coding)

---

**Maintained by**: Claude Code (Sonnet 4.5)
**Last Updated**: 2025-10-27
**Status**: ✅ Active
