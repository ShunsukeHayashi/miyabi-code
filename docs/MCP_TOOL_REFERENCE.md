# Miyabi MCP Tool Reference

## Quick Status Check

```
Miyabi:get_project_status     # Project info
Miyabi:get_agent_status       # Agent status
Miyabi:system_resources       # CPU/Mem/Disk
Miyabi:tmux_list_sessions     # tmux sessions
```

## Working Tools (✅)

### Project
- `get_project_status` - Branch, crates count, MCP servers count

### Agent (21 agents)
- `list_agents` - Show all 21 agents
- `execute_agent` - Run single agent
- `execute_agents_parallel` - Run multiple agents
- `get_agent_status` - Check running agents
- `get_agent_logs` - Get agent logs
- `stop_agent` - Stop agent

### Git
- `git_status` - Current status
- `git_branch` - List branches
- `git_checkout` - Switch branch
- `git_create_branch` - Create branch
- `git_diff` - Show diff
- `git_log` - Commit history
- `git_pull` - Pull changes
- `git_push` - Push changes
- `git_stash` - Stash changes

### File
- `read_file` - Read file content
- `write_file` - Write file
- `list_files` - Directory listing
- `search_code` - Search in code

### System
- `system_resources` - CPU/Memory/Disk
- `process_list` - Running processes
- `network_status` - Network info
- `get_logs` - Miyabi logs

### tmux
- `tmux_list_sessions` - List sessions
- `tmux_send_keys` - Send command (needs server)

### Obsidian
- `obsidian_search` - Search notes
- `obsidian_create_note` - Create note
- `obsidian_update_note` - Update note

### MCP
- `mcp_docs` - MCP documentation

### UI
- `show_agent_cards` - TCG cards
- `get_agent_tcg_card` - Single card
- `show_agent_collection` - Collection

## Needs Setup (⚠️)

### GitHub (needs GITHUB_TOKEN)
- `list_issues`, `get_issue`, `create_issue`, `update_issue`, `close_issue`
- `list_prs`, `get_pr`, `create_pr`, `merge_pr`

### Build (needs remote execution)
- `cargo_build`, `cargo_test`, `cargo_clippy`
- `npm_install`, `npm_run`

### AI (needs API keys)
- `gemini_analyze_image`, `gemini_generate_image`
- `generate_agent_card_image`

## 21 Agents

| Agent | Japanese | Role |
|-------|----------|------|
| coordinator | シキルーン | Orchestration |
| codegen | ツクルーン | Code gen |
| review | メダマン | Code review |
| issue | ミツケルーン | Issue triage |
| pr | マトメルーン | PR mgmt |
| deploy | ハコブーン | Deploy |
| refresher | ツナグン | Context |
| ai_entrepreneur | AI起業家 | Strategy |
| self_analysis | 自己分析 | Reflection |
| market_research | 市場調査 | Research |
| persona | ペルソナ | Profiles |
| product_concept | 商品企画 | Planning |
| product_design | 商品設計 | Design |
| content_creation | コンテンツ | Content |
| funnel_design | ファネル | Funnel |
| sns_strategy | SNS戦略 | Social |
| marketing | マーケティング | Marketing |
| sales | 営業 | Sales |
| crm | CRM | CRM |
| analytics | 分析 | Analytics |
| youtube | YouTube | Video |

## Setup Commands

```bash
# On MUGEN/MAJIN
bash scripts/quick-bootstrap.sh

# Or manual
cargo build --release -p miyabi-mcp-server
export GITHUB_TOKEN="ghp_xxx"
tmux new-session -d -s miyabi-hub
```
