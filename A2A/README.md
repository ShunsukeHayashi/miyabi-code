# A2A (Agent-to-Agent) - Multi-Agent Communication Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![tmux](https://img.shields.io/badge/tmux-required-green)](https://github.com/tmux/tmux)
[![Bash](https://img.shields.io/badge/bash-3.2%2B-blue)](https://www.gnu.org/software/bash/)

**A2A** is a tmux-based real-time communication protocol designed for orchestrating multiple AI agents in parallel. Originally developed for the Miyabi multi-agent system, A2A enables seamless message passing between agents running in different tmux panes.

## 🚀 Quick Start

### Prerequisites

- tmux 2.0+
- bash 3.2+ (macOS compatible)
- Unix-like environment (macOS, Linux)

### Installation

```bash
git clone https://github.com/ShunsukeHayashi/a2a.git
cd a2a
chmod +x a2a-oss.sh
```

### Basic Usage

```bash
# Check if tmux panes are accessible
./a2a-oss.sh health

# Send a message to a specific pane
./a2a-oss.sh send %0 "Hello from A2A!"

# Broadcast to all agents
./a2a-oss.sh broadcast "System maintenance starting"

# Report agent status
./a2a-oss.sh started myagent "Task initialization complete"
```

## 📋 Features

### Core Communication

- **P0.2 Protocol**: Reliable message delivery with retry logic
- **Pane Management**: Automatic pane discovery and validation
- **Status Reporting**: Standardized agent status communication
- **Health Monitoring**: Real-time agent connectivity checks

### Agent Orchestration

- **Multi-Agent Coordination**: Parallel task execution
- **Message Relay**: Inter-agent communication routing
- **Broadcast System**: One-to-many messaging
- **Environment Variables**: Flexible pane mapping

## 🔧 Configuration

### Environment Variables

```bash
export MIYABI_CONDUCTOR_PANE=%101   # Main orchestrator pane
export MIYABI_CODEGEN_PANE=%102     # Code generation agent
export MIYABI_REVIEW_PANE=%103      # Code review agent
export MIYABI_PR_PANE=%104          # Pull request agent
export MIYABI_DEPLOY_PANE=%105      # Deployment agent
export MIYABI_A2A_LOG="$HOME/.miyabi/logs/a2a.log"  # Log file path
```

### Tmux Setup

```bash
# Create a new tmux session for agents
tmux new-session -d -s miyabi-agents

# Create dedicated panes for each agent
tmux new-window -n "conductor"
tmux new-window -n "codegen"
tmux new-window -n "review"
tmux new-window -n "pr"
tmux new-window -n "deploy"

# Get pane IDs for configuration
tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id} #{pane_title}"
```

## 📖 API Reference

### Core Commands

#### `a2a-oss.sh send <pane_id> <message>`
Send a message directly to a specific tmux pane with retry logic.

```bash
./a2a-oss.sh send %0 "Processing task #123"
```

#### `a2a-oss.sh health`
Check connectivity status of all configured agent panes.

```bash
./a2a-oss.sh health
# Output:
# === Miyabi A2A Health Check ===
# ✅ conductor (%101): OK
# ✅ codegen (%102): OK
# ❌ review (%103): NOT_FOUND
```

#### `a2a-oss.sh broadcast <message>`
Send message to all configured agent panes simultaneously.

```bash
./a2a-oss.sh broadcast "Emergency maintenance in 5 minutes"
```

### Status Reporting

#### `a2a-oss.sh started <agent> <message>`
Report task initiation to the conductor.

```bash
./a2a-oss.sh started codegen "Beginning implementation of user authentication"
```

#### `a2a-oss.sh completed <agent> <message>`
Report successful task completion.

```bash
./a2a-oss.sh completed review "Code review passed - ready for merge"
```

#### `a2a-oss.sh error <agent> <message>`
Report error conditions requiring attention.

```bash
./a2a-oss.sh error deploy "Build failed - dependency conflict detected"
```

### Inter-Agent Communication

#### `a2a-oss.sh relay <from_agent> <to_agent> <action> <detail>`
Route messages between specific agents.

```bash
./a2a-oss.sh relay codegen review "review-request" "PR #456 ready for review"
```

## 🎯 Use Cases

### Multi-Agent Development Workflow

```bash
# 1. Start development task
./a2a-oss.sh started conductor "Starting Issue #123 implementation"

# 2. Code generation phase
./a2a-oss.sh started codegen "Implementing authentication module"
./a2a-oss.sh completed codegen "Authentication module ready for review"

# 3. Review phase
./a2a-oss.sh relay codegen review "handoff" "Authentication module in branch feat/auth-123"
./a2a-oss.sh completed review "Code review approved - tests passing"

# 4. Deployment
./a2a-oss.sh relay review deploy "approved" "Ready for staging deployment"
./a2a-oss.sh completed deploy "Successfully deployed to staging environment"
```

### CI/CD Pipeline Coordination

```bash
# Pipeline status updates
./a2a-oss.sh started ci "Running test suite on commit abc1234"
./a2a-oss.sh progress ci "Unit tests: 45/50 passed"
./a2a-oss.sh completed ci "All tests passed - ready for deployment"

# Deployment coordination
./a2a-oss.sh relay ci deploy "trigger" "Deploy commit abc1234 to production"
./a2a-oss.sh waiting deploy "Awaiting production deployment approval"
```

### Monitoring and Alerts

```bash
# System health monitoring
./a2a-oss.sh broadcast "Scheduled health check starting"
./a2a-oss.sh health

# Alert distribution
./a2a-oss.sh error monitor "High CPU usage detected on server-01"
./a2a-oss.sh broadcast "Investigating performance issue - ETA 15 minutes"
```

## 🛠 Troubleshooting

### Common Issues

**Error: "pane not found"**
```bash
# Check pane existence
tmux list-panes -a -F "#{pane_id} #{pane_title}"

# Update environment variables with correct pane IDs
export MIYABI_CONDUCTOR_PANE=%new_pane_id
```

**Error: "Bash 4.0 or higher required"**
The standard `a2a.sh` requires Bash 4+. Use `a2a-oss.sh` for macOS/legacy compatibility.

**Messages not appearing in target pane**
```bash
# Check tmux session attachment
tmux list-sessions

# Verify pane accessibility
tmux send-keys -t %target_pane 'echo test' Enter
```

### Debug Mode

```bash
# Enable verbose logging
export MIYABI_A2A_DEBUG=1
./a2a-oss.sh send %0 "debug test message"

# View communication logs
tail -f ~/.miyabi/logs/a2a.log
```

### Performance Optimization

```bash
# Adjust retry parameters for faster/more reliable delivery
export A2A_RETRY_COUNT=5      # Default: 3
export A2A_RETRY_DELAY=2      # Default: 1 second
```

## 🏗 Architecture

### Protocol Stack

```
┌─────────────────────────────────────────────┐
│           Application Layer                 │
│     (Claude Code, Custom Agents)           │
├─────────────────────────────────────────────┤
│              A2A Protocol                   │
│    (Message Routing, Status Tracking)      │
├─────────────────────────────────────────────┤
│              tmux Layer                     │
│      (Pane Management, IPC)               │
├─────────────────────────────────────────────┤
│             Shell Layer                     │
│        (Bash, Process Control)             │
└─────────────────────────────────────────────┘
```

### Message Flow

1. **Message Creation**: Agent generates status or communication message
2. **Protocol Processing**: A2A formats message with metadata (timestamp, retry count)
3. **Pane Resolution**: Target pane ID resolved from agent name or environment variable
4. **Delivery**: tmux send-keys with configurable retry logic
5. **Logging**: All transactions logged for debugging and audit

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting PRs.

### Development Setup

```bash
git clone https://github.com/ShunsukeHayashi/a2a.git
cd a2a

# Run tests
npm test

# Lint shell scripts
shellcheck *.sh
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the [Miyabi](https://github.com/customer-cloud/miyabi-private) multi-agent development platform
- Inspired by the need for reliable inter-process communication in AI agent orchestration
- tmux community for providing robust terminal multiplexing capabilities

---

**A2A** - Making multi-agent coordination effortless, one message at a time.