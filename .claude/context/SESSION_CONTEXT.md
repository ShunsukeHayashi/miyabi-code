# Miyabi Session Context - Full Sync
# Generated: 2025-12-07T10:30:00+09:00
# Source: Claude Desktop (Opus 4.5) Session
# Purpose: Sync context to local VS Code terminal Claude Code session

---

## 🎯 Current Mission

**Claude Code + Codex並列実行によるパラレルタスク開発**の実現に向けて、システムキャパシティ確認とスキル同期を完了。ローカルターミナルとの独立した指示系統としてモニタリング・実行環境を構築中。

---

## 📊 System Status (Local Mac)

### Resources
| Item | Value | Status |
|------|-------|--------|
| CPU | 10 cores / 30.04% used | ✅ Available |
| Memory | 64GB / 99.24% used (63.51GB) | ⚠️ Critical |
| Disk | 139.56GB free (7.52% used) | ✅ Available |
| Processes | 988 (8 running, 979 sleeping) | ⚠️ High |
| Network | 93 established / 296 total | ✅ Normal |

### Network
- en0 (wireless): 192.168.3.43 @ 167 Mbps
- en25 (wired): 192.168.3.45 @ 1000 Mbps
- Gateway: 192.168.3.1

### Active Tools
- **Claude Code**: 5 sessions (PIDs: 861, 86890, 99744, 6075, 5350)
- **Codex CLI**: v0.63.0 ✅
- **MCP Servers**: 17/17 (100% operational)

---

## 🔧 MCP Servers (All Running)

```
miyabi-git-inspector (7)    miyabi-tmux (2)
miyabi-log-aggregator (7)   miyabi-resource-monitor (7)
miyabi-network-inspector (7) miyabi-process-inspector (7)
miyabi-file-watcher (7)     miyabi-claude-code (7)
miyabi-github (2)           miyabi-rules (2)
miyabi-obsidian (2)         gemini3-adaptive-runtime (2)
gemini3-uiux-designer (2)   lark-wiki-agents (2)
miyabi-commercial-agents (7) miyabi-codex (7)
miyabi-investment-society (7)
```

---

## 📁 Skills Directory Status

### Location
- **Claude Desktop**: `/mnt/skills/user/` (14 skills)
- **miyabi-private**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/Skills/` (37 skills after sync)

### Just Transferred (Claude Desktop → miyabi-private): 12 skills
1. aws-ec2-management
2. ci-cd-pipeline
3. codex-danger-full-access
4. docker-compose-workflow
5. gemini-slide-generator
6. marketing-campaign
7. miyabi-agent-orchestration
8. miyabi-session-recovery
9. miyabi-worktree-management
10. sns-content-creation
11. tmux-a2a-communication
12. youtube-optimization

### miyabi-private Only (not in Claude Desktop): 23 skills
agent-execution, business-strategy-planning, claude-code-x,
content-marketing-strategy, context-eng, debugging-troubleshooting,
dependency-management, documentation-generation, git-workflow,
growth-analytics-dashboard, issue-analysis, market-research-analysis,
paper2agent, performance-analysis, project-setup, rust-development,
sales-crm-management, security-audit, spec-driven-development,
tdd-workflow, tmux-iterm-integration, tmux-multiagent-messaging, voicevox

---

## 🤖 Agent Architecture

### tmux Session: miyabi-oss (10 windows)
Created: 2025-12-07T00:00:36.000Z

### Agent Pane Map
| Agent | Japanese | Role | Pane ID |
|-------|----------|------|---------|
| Conductor | しきるん | Task orchestration | %1 |
| CodeGen 1 | カエデ | Implementation | %2 |
| CodeGen 2 | カエデ | Implementation | %3 |
| CodeGen 3 | カエデ | Implementation | %4 |
| Review | サクラ | Code review | %5 |
| PR | ツバキ | PR management | %6 |
| Deploy | ボタン | Deployment | %7 |
| Issue | みつけるん | Issue analysis | %8 |

### Communication Protocol (P0.2 - MANDATORY)
```bash
# Correct format (ALWAYS use this)
tmux send-keys -t <PANE_ID> '<MESSAGE>' && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# Examples
tmux send-keys -t %1 '[カエデ] 実装完了: Issue #123' && sleep 0.5 && tmux send-keys -t %1 Enter
```

### PUSH Rule
- ✅ Workers proactively report TO Conductor
- ❌ Never poll workers (PULL forbidden)

---

## 🏗️ Parallel Execution Architecture

```
┌─────────────────────────────────────────────────────────┐
│ LOCAL MAC (Memory constrained - 99% used)               │
│ ├── Claude Code × 2-3 sessions (max)                    │
│ └── Codex × 1 session                                   │
├─────────────────────────────────────────────────────────┤
│ EC2 MUGEN (Status: PENDING verification)                │
│ ├── Claude Code × 3-4 sessions                          │
│ └── Build & Test dedicated                              │
├─────────────────────────────────────────────────────────┤
│ EC2 MAJIN (Status: PENDING verification)                │
│ ├── Claude Code × 2-3 sessions                          │
│ └── Review & PR dedicated                               │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Pending Tasks

### Priority 1: Immediate
- [ ] EC2 MUGEN/MAJIN instance status check (AWS CLI)
- [ ] SSH connectivity test
- [ ] Resource status retrieval

### Priority 2: Memory Optimization
- [ ] Identify unnecessary processes
- [ ] Optimize MCP server process count
- [ ] Clean up Claude Code sessions

### Priority 3: Reverse Sync
- [ ] Transfer 23 skills: miyabi-private → Claude Desktop

---

## 🎮 Miyabi Concept

**新コンセプト**: AIアントレプレナー、企業・会社経営アドバイザー、エージェント集団

- **58 Societies** containing **365+ agents**
- **Target market**: ¥8.5 trillion
- **Key implementations**: Investment Society (9 specialized agents)
- **Economic simulation**: Papillon World concept

---

## 🔑 Key File Paths

```
# Project Root
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/

# Skills
.claude/Skills/

# Context
.claude/context/SESSION_CONTEXT.md

# Pane Map
~/.miyabi/pane_map.txt

# Transcripts
/mnt/transcripts/
```

---

## 🚀 Quick Start Commands

### Start Claude Code Session
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
claude --dangerously-skip-permissions
```

### Initial Prompt
```
Read .claude/context/SESSION_CONTEXT.md to understand the current context.
I am continuing from the Claude Desktop session.
Current focus: Parallel task development with Claude Code + Codex.
```

### Check System Status
```bash
# tmux sessions
tmux list-sessions

# MCP status
ps aux | grep -E "mcp|miyabi" | grep -v grep | wc -l

# Memory
top -l 1 | head -10
```

### Send Message to Agent
```bash
# To Conductor
tmux send-keys -t %1 '[ローカル] セッション開始' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## 📝 Session History Reference

Previous transcripts:
- `/mnt/transcripts/2025-12-07-00-50-17-skill-sync-analysis-mcp-capacity.txt`
- `/mnt/transcripts/2025-12-07-00-35-39-youtube-live-miyabi-oss-multiagent-demo.txt`

Key decisions from previous sessions:
1. YouTube Live配信準備完了
2. tmuxオーケストレーション設計
3. Claude Code新機能活用（--agent, --dangerously-skip-permissions）
4. GitArbor風Gitクライアント開発計画
5. EC2並列実行アーキテクチャ設計

---

## ⚡ Immediate Next Actions

1. **Verify this context is loaded** - Confirm you have access to all information above
2. **Check EC2 status** - Run AWS CLI commands to verify MUGEN/MAJIN
3. **Monitor tmux** - Capture pane outputs to see current agent states
4. **Begin parallel task** - Coordinate between Claude Desktop and local terminal

---

*This context file enables seamless continuation between Claude Desktop and local Claude Code sessions. Update this file when significant state changes occur.*
