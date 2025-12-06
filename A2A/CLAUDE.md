# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**A2A (Agent-to-Agent)** is the tmux-based communication protocol and tooling for Miyabi's multi-agent system. It enables real-time message passing between AI agents running in different tmux panes.

## Core Concept: P0.2 Protocol

All inter-agent communication MUST use the P0.2 protocol format:

```bash
tmux send-keys -t %PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t %PANE_ID Enter
```

**Critical Rules:**
- Use environment variables (e.g., `$MIYABI_CONDUCTOR_PANE`) or permanent pane IDs - NEVER use session:window.index format
- `sleep 0.5` is mandatory for stability
- Workers report TO Conductor (PUSH) - Conductor never polls workers

## Message Format

```
[Agent] �����: s0��
```

Status types: `��` (Started), `2L-` (Working), `��` (Complete), `���` (Error), `�_` (Waiting), `��` (Approval)

Agent relay format: `[FromAgent→ToAgent] Action: Detail`

## Agent Pane Mapping

| Env Variable | Default | Agent | Role |
|--------------|---------|-------|------|
| `$MIYABI_CONDUCTOR_PANE` | `%101` | しきるん (Shikiroon) | Conductor/Orchestrator |
| `$MIYABI_CODEGEN_PANE` | `%102` | 楓 (Kaede) | CodeGen |
| `$MIYABI_REVIEW_PANE` | `%103` | 桜 (Sakura) | Review |
| `$MIYABI_PR_PANE` | `%104` | 椿 (Tsubaki) | PR |
| `$MIYABI_DEPLOY_PANE` | `%105` | 牡丹 (Botan) | Deploy |

> ⚠️ Pane IDs change on session recreation. Always use environment variables.

## Key Scripts

### a2a.sh - Core Communication Library

Source or execute directly:

```bash
# Source for function access
source a2a.sh

# Direct execution
./a2a.sh send %18 '[���] ��: �����'
./a2a.sh completed ��� 'Issue #270 �Ō�'
./a2a.sh relay ��� ��� �����< 'PR #123'
./a2a.sh health        # Check all agent panes
./a2a.sh broadcast '�����'
```

Functions available when sourced:
- `a2a_send <pane> <message>` - Send with retry logic
- `a2a_report <agent> <status> <message>` - Report to Conductor
- `a2a_relay <from> <to> <action> <detail>` - Inter-agent relay
- `a2a_completed/started/progress/error/waiting/confirm` - Status helpers
- `a2a_health` - Health check all agents

### miyabi_cc_agents.sh - Claude Code Multi-Agent

Source and use wrapper functions:

```bash
source miyabi_cc_agents.sh

miyabi_dev "Implement user authentication"
miyabi_agent kaede "Write REST API"
implement_issue 270
review_pr 123
orchestrate_task "Complete Issue #270 end-to-end"
```

### miyabi_agents.json

Agent definitions for `claude --agents` flag. Contains system prompts for all 12 agents (6 dev + 6 business).

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIYABI_CONDUCTOR_PANE` | `%101` | Conductor pane ID |
| `MIYABI_CODEGEN_PANE` | `%102` | CodeGen pane ID |
| `MIYABI_REVIEW_PANE` | `%103` | Review pane ID |
| `MIYABI_PR_PANE` | `%104` | PR pane ID |
| `MIYABI_DEPLOY_PANE` | `%105` | Deploy pane ID |
| `MIYABI_A2A_LOG` | `~/.miyabi/logs/a2a.log` | Communication log path |

## Debugging Commands

```bash
# Capture pane output
tmux capture-pane -t $MIYABI_CONDUCTOR_PANE -p | tail -20

# Search for errors
tmux capture-pane -t $MIYABI_CODEGEN_PANE -p | grep -E "(error|failed)"

# List all panes with IDs
tmux list-panes -a -F "#{pane_id} #{pane_title}"

# Watch Conductor in real-time
watch -n 2 'tmux capture-pane -t $MIYABI_CONDUCTOR_PANE -p | tail -10'
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Command Center (Guardian)           │
└─────────────────────────────────────────────┘
                      │
                      ▼ A2A Protocol
┌─────────────────────────────────────────────┐
│    Conductor ($MIYABI_CONDUCTOR_PANE)       │
│    Receives PUSH reports from workers       │
└─────────────────────────────────────────────┘
        ▲ PUSH             Task Assignment │
        │                                  ▼
┌─────────────────────────────────────────────┐
│  Workers: 楓($MIYABI_CODEGEN_PANE)         │
│           桜($MIYABI_REVIEW_PANE)          │
│           椿($MIYABI_PR_PANE)              │
│           牡丹($MIYABI_DEPLOY_PANE)        │
└─────────────────────────────────────────────┘
```

## Documentation Reference

- `TMUX_A2A_COMMUNICATION_PROTOCOL.md` - Complete protocol specification
- `A2A_QUICK_REFERENCE.md` - Quick reference card
- `CC_AGENTS_CHEATSHEET.md` - Claude Code --agents usage
