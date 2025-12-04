---
name: miyabi-orchestrator
description: |
  Comprehensive orchestration skill for Miyabi platform. Provides unified control over 33+ MCP servers, 
  21 AI agents, EC2 MUGEN/MAJIN environments, and all development operations.
triggers:
  - "miyabi"
  - "雅"
  - "agent"
  - "orchestrate"
  - "MCP"
---

# Miyabi Orchestrator Skill

## Quick Reference

### Start Miyabi
```bash
Miyabi:get_project_status
Miyabi:get_agent_status
Miyabi:execute_agent agent="coordinator"
```

### MCP Servers (33)
- Core: miyabi-mcp-server, miyabi-github, miyabi-file-access, miyabi-tmux-server
- AI: gemini3-adaptive-runtime, miyabi-ollama, miyabi-openai-assistant
- Monitor: miyabi-health-check, miyabi-log-aggregator, miyabi-resource-monitor
- Business: miyabi-commercial-agents, lark-mcp-enhanced

### Agents (21)
| Agent | Role |
|-------|------|
| coordinator | Orchestration |
| codegen | Code generation |
| review | Code review |
| issue | Issue triage |
| pr | PR management |
| deploy | Deployment |

### Tools (63+)
- Git: git_status, git_commit, git_push, git_pull
- GitHub: list_issues, create_issue, create_pr, merge_pr
- Build: cargo_build, cargo_test, cargo_clippy
- File: read_file, write_file, list_files, search_code
- Agent: execute_agent, get_agent_status, stop_agent

### Troubleshooting

**A2A Bridge Unavailable:**
```bash
cargo build --release -p miyabi-mcp-server
```

**GitHub Auth Error:**
```bash
export GITHUB_TOKEN=$(gh auth token)
```

## Full Documentation
See `/mnt/user-data/outputs/SKILL-miyabi-orchestrator.md`
