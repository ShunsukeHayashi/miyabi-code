# Miyabi Rules MCP Server

MCP Server for interacting with Miyabi Rules service - both local CLAUDE.md rules and cloud-based rule enforcement.

## Overview

This MCP server provides:
- **Rule Discovery**: List all P0/P1/P2/P3 rules from CLAUDE.md
- **Task Validation**: Validate tasks against Miyabi protocols before execution
- **Rule Execution**: Programmatic enforcement of specific rules
- **Cloud Sync**: Synchronize local rules to cloud API
- **Context Access**: Retrieve detailed context module documentation

## Features

### Automatic Fallback
- Tries cloud API first
- Falls back to local CLAUDE.md if cloud unavailable
- Operates fully offline when needed

### Rule Priority System
- **P0**: Critical Operating Principles (must never be violated)
- **P1**: Essential Procedures (required for success)
- **P2**: Standard Operating Procedures (recommended)
- **P3**: Best Practices (nice to have)

### Dual Source Support
- **Local**: Parses CLAUDE.md and .claude/context/ modules
- **Cloud**: Fetches from remote Miyabi Rules API

## Installation

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server
npm install
npm run build
```

## Configuration

### Environment Variables

```bash
# Optional: Cloud API endpoint (falls back to local if not set)
export MIYABI_RULES_API_URL="https://miyabi-rules-api.example.com"

# Optional: API key for cloud service
export MIYABI_API_KEY="your-api-key-here"
```

### Add to Claude Desktop Config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "miyabi-rules": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-rules-server/dist/index.js"
      ],
      "env": {
        "MIYABI_RULES_API_URL": "https://your-cloud-api.com",
        "MIYABI_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### 1. `miyabi_rules_list`

List all available Miyabi rules.

**Parameters:**
- `priority` (optional): Filter by priority ("P0", "P1", "P2", "P3")
- `category` (optional): Filter by category

**Example:**
```
Use miyabi_rules_list with priority "P0"
```

**Returns:**
```json
{
  "total": 3,
  "rules": [
    {
      "id": "P0.1",
      "name": "Task Delegation Protocol",
      "priority": "P0",
      "category": "Critical Operating Principles",
      "source": "local"
    }
  ]
}
```

### 2. `miyabi_rules_validate`

Validate a task description against Miyabi rules.

**Parameters:**
- `task_description`: Description of the task to validate
- `rule_ids` (optional): Specific rules to check (default: all P0/P1)

**Example:**
```
Use miyabi_rules_validate with task_description "Run cargo build to compile the project"
```

**Returns:**
```json
{
  "valid": false,
  "violations_count": 1,
  "suggestions_count": 1,
  "results": [
    {
      "valid": false,
      "rule": {
        "id": "P0.1",
        "name": "Task Delegation Protocol"
      },
      "violations": [
        "Direct cargo build detected. Use rust-development Skill instead."
      ],
      "suggestions": [
        "Use: Skill tool with command 'rust-development'"
      ]
    }
  ]
}
```

### 3. `miyabi_rules_execute`

Execute a specific rule enforcement action.

**Parameters:**
- `rule_id`: Rule ID to execute (e.g., "P0.1", "P1.1")
- `context` (optional): Execution context

**Example:**
```
Use miyabi_rules_execute with rule_id "P0.2"
```

**Returns:**
```json
{
  "success": true,
  "rule": {
    "id": "P0.2",
    "name": "Inter-Agent Communication Protocol"
  },
  "output": "Enforcing Inter-Agent Communication Protocol: Using strict tmux syntax with sleep 0.5.",
  "errors": []
}
```

### 4. `miyabi_rules_sync`

Synchronize local rules to cloud API.

**Example:**
```
Use miyabi_rules_sync
```

**Returns:**
```json
{
  "success": true,
  "synced": 15,
  "failed": 0,
  "message": "Synced 15 rules to cloud (0 failed)"
}
```

### 5. `miyabi_rules_get_context`

Retrieve specific context module content.

**Parameters:**
- `module_name`: Context module name (e.g., "agents", "worktree")

**Example:**
```
Use miyabi_rules_get_context with module_name "agents"
```

**Returns:** Full markdown content of `.claude/context/agents.md`

**Available Modules:**
- agents
- architecture
- business-agents
- coding-agents
- core-rules
- development
- Entity-Relation
- git-workflow
- labels
- miyabi-definition
- orchestration
- protocols
- rust
- worktree

## Rule Validation Examples

### Example 1: Detecting P0.1 Violation

```bash
# Task: "Execute cargo build"
# Result: VIOLATION - Must use rust-development Skill
```

### Example 2: Detecting P0.2 Violation

```bash
# Task: "Send message with tmux send-keys -t %50 'Hello'"
# Result: VIOLATION - Missing sleep 0.5
# Suggestion: Use tmux send-keys -t %50 "Hello" && sleep 0.5 && tmux send-keys -t %50 Enter
```

### Example 3: P1.1 Suggestion

```bash
# Task: "Install axios library"
# Result: SUGGESTION - Consider checking MCP availability first
```

## Architecture

### Local Rules Source
```
CLAUDE.md
├── P0: Critical Operating Principles
├── P1: Essential Procedures
└── P2: Standard Operating Procedures

.claude/context/*.md
└── Detailed documentation modules
```

### Cloud Rules API
```
GET  /api/rules          - List all rules
POST /api/rules          - Create/update rule
GET  /api/rules/:id      - Get specific rule
POST /api/rules/validate - Validate task
```

### Fallback Strategy
1. Try cloud API (5s timeout)
2. If unavailable → Use local CLAUDE.md
3. Dedup cloud + local rules (cloud overrides local)

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start server
npm start
```

## Integration with Agents

Agents can use this MCP server to:
1. **Pre-flight Check**: Validate tasks before execution
2. **Rule Enforcement**: Execute rule-specific actions
3. **Documentation**: Retrieve context modules on-demand
4. **Compliance**: Ensure all operations follow Miyabi protocols

## License

Part of the Miyabi project. See main project LICENSE.
