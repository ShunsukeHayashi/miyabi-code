# 🎭 Miyabi Orchestra Advanced - Complete Guide

**Version**: 2.0.0
**Last Updated**: 2025-11-03
**Status**: ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Features](#core-features)
4. [Command Reference](#command-reference)
5. [Layout Presets](#layout-presets)
6. [Agent Management](#agent-management)
7. [Session End Hooks](#session-end-hooks)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)
10. [Practical Use Cases](#practical-use-cases) ⭐ NEW
11. [Best Practices](#best-practices) ⭐ NEW
12. [Anti-Patterns (Avoid These)](#anti-patterns-avoid-these) ⭐ NEW
13. [API Reference](#api-reference)

---

## Overview

### What is Miyabi Orchestra Advanced?

Miyabi Orchestra Advanced is a comprehensive tmux-based orchestration system that enables:

- ✅ **Parallel Agent Execution**: Run multiple Claude Code instances simultaneously
- ✅ **Dynamic Layout Management**: 6 predefined layouts + custom resizing
- ✅ **Visual Customization**: Color-coded pane borders for different agent types
- ✅ **Agent Cloning**: Run multiple instances of the same agent role
- ✅ **Environment Switching**: Toggle between Claude Code, Codex, and Cursor
- ✅ **Session End Hooks**: Automatic bidirectional communication on session end
- ✅ **Multi-Session Support**: Manage multiple orchestra sessions
- ✅ **Interactive Dashboard**: Real-time status monitoring

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Miyabi Orchestra Advanced                     │
│                         (Master Script)                          │
└────────────┬────────────────────────────────────────────────────┘
             │
        ┌────┴───────────────────────────────────────┐
        │                                            │
   ┌────▼─────┐                              ┌──────▼──────┐
   │  Layout  │                              │    Agent    │
   │ Manager  │                              │  Manager    │
   └────┬─────┘                              └──────┬──────┘
        │                                           │
   ┌────▼─────────────────┐              ┌─────────▼──────────────┐
   │ - grid-2x2           │              │ - add (new agent)      │
   │ - grid-2x3           │              │ - clone (duplicate)    │
   │ - main-side          │              │ - switch (env)         │
   │ - coding             │              │ - status               │
   │ - business           │              │                        │
   │ - hybrid             │              │                        │
   └──────────────────────┘              └────────────────────────┘
             │                                           │
        ┌────▼───────────────────────────────────────────▼─────┐
        │              tmux Session (1-N)                       │
        │  ┌─────────┬─────────┬─────────┬─────────┬──────┐   │
        │  │ Pane %1 │ Pane %2 │ Pane %3 │ Pane %4 │  ... │   │
        │  │ (カエデ) │ (サクラ) │ (ツバキ) │ (ボタン) │      │   │
        │  │  blue   │  green  │ yellow  │ magenta │      │   │
        │  └─────────┴─────────┴─────────┴─────────┴──────┘   │
        └───────────────────────────────────────────────────────┘
```

### Key Differences from Basic Orchestra

| Feature | Basic Orchestra | Advanced Orchestra |
|---------|----------------|-------------------|
| Layout Presets | 2 (5-pane, 7-pane) | 6 (grid-2x2, grid-2x3, main-side, coding, business, hybrid) |
| Agent Cloning | ❌ No | ✅ Yes |
| Environment Switching | ❌ No | ✅ Yes (claude/codex/cursor) |
| Color Customization | ⚠️ Basic | ✅ Full (7 colors) |
| Session Management | ⚠️ Limited | ✅ Multi-session |
| Interactive Dashboard | ❌ No | ✅ Yes |
| bash Compatibility | ❌ bash 4+ only | ✅ bash 3.2+ (macOS compatible) |

---

## Installation & Setup

### Prerequisites

```bash
# Required
- tmux 3.0+
- Claude Code (cc command)
- bash 3.2+ (pre-installed on macOS)

# Optional
- codex (OpenAI Codex)
- cursor (Cursor AI)
```

### Installation

```bash
# 1. Navigate to Miyabi project
cd /Users/shunsuke/Dev/miyabi-private

# 2. Ensure script is executable
chmod +x scripts/miyabi-orchestra-advanced.sh

# 3. Verify installation
./scripts/miyabi-orchestra-advanced.sh --help
```

### Session End Hooks Setup

```bash
# Run setup script to install hooks
.hooks/setup-hooks.sh

# Verify hooks are installed
cat ~/.config/claude/settings.json
```

Expected output:
```json
{
  "hooks": {
    "sessionEnd": "/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh"
  }
}
```

---

## Core Features

### 1. Layout Management

Apply predefined layouts to organize your panes efficiently.

**Available Presets**:

1. **grid-2x2**: 4 panes in 2×2 grid (balanced)
2. **grid-2x3**: 6 panes in 2×3 grid (medium scale)
3. **main-side**: 1 main pane + 4 side panes (focused)
4. **coding**: 5 panes optimized for coding agents
5. **business**: 5 panes optimized for business agents
6. **hybrid**: 7 panes for mixed coding + business

**Visual Preview**:

```
grid-2x2:           grid-2x3:              main-side:
┌─────┬─────┐      ┌────┬────┬────┐      ┌─────────┬──┐
│  1  │  2  │      │ 1  │ 2  │ 3  │      │         │ 2│
├─────┼─────┤      ├────┼────┼────┤      │    1    ├──┤
│  3  │  4  │      │ 4  │ 5  │ 6  │      │         │ 3│
└─────┴─────┘      └────┴────┴────┘      └─────────┴──┘

coding:             business:             hybrid:
┌─────────┬──┐      ┌─────────┬──┐      ┌────┬────┬────┐
│         │ 2│      │         │ 2│      │ 1  │ 2  │ 3  │
│    1    ├──┤      │    1    ├──┤      ├────┼────┼────┤
│         │ 3│      │         │ 3│      │ 4  │ 5  │ 6  │
├─────────┼──┤      ├─────────┼──┤      ├─────────────┤
│    4    │ 5│      │    4    │ 5│      │      7      │
└─────────┴──┘      └─────────┴──┘      └─────────────┘
```

### 2. Color Scheme

Each agent type has a unique color for easy identification:

| Agent Type | Color | Purpose |
|------------|-------|---------|
| orchestrator | 🔵 Blue | Coordination & oversight |
| codegen | 🟢 Green | Code generation |
| review | 🟡 Yellow | Code review |
| pr | 🟣 Magenta | Pull request management |
| deployment | 🔴 Red | Deployment operations |
| issue | 🔷 Cyan | Issue analysis |
| documentation | ⚪ White | Documentation |

**Applying Colors**:
```bash
./scripts/miyabi-orchestra-advanced.sh colorize
```

### 3. Agent Management

#### Add New Agent
```bash
# Basic usage
./scripts/miyabi-orchestra-advanced.sh agent add <TYPE>

# Examples
./scripts/miyabi-orchestra-advanced.sh agent add codegen
./scripts/miyabi-orchestra-advanced.sh agent add review
```

#### Clone Agent (Multiple Instances)
```bash
# Creates 2nd instance with numbered name
./scripts/miyabi-orchestra-advanced.sh agent clone codegen

# Result: サクラ2 (CodeGenAgent instance #2)
```

#### Switch Environment
```bash
# Switch pane to different AI environment
./scripts/miyabi-orchestra-advanced.sh switch %3 codex

# Available environments: claude, codex, cursor
```

### 4. Session Management

#### Create New Session
```bash
# Create new session with specific layout
./scripts/miyabi-orchestra-advanced.sh session new my-project coding

# Attach to session
tmux attach -t my-project
```

#### List Sessions
```bash
tmux ls
```

### 5. Status Monitoring

```bash
# Show current orchestra status
./scripts/miyabi-orchestra-advanced.sh status

# Launch interactive dashboard
./scripts/miyabi-orchestra-advanced.sh dashboard
```

---

## Command Reference

### Full Command List

```bash
Usage: miyabi-orchestra-advanced.sh [COMMAND] [OPTIONS]

Commands:
  layout [PRESET]       Apply predefined layout
  resize PANE SIZE      Resize specific pane
  colorize              Apply color scheme to all panes
  session new NAME      Create new Orchestra session
  agent add TYPE        Add new agent to current session
  agent clone TYPE      Clone existing agent (multiple instances)
  switch PANE ENV       Switch pane execution environment
  status                Show current Orchestra status
  dashboard             Launch interactive dashboard
  --help                Show this help message
  --version             Show version information
```

### Examples

```bash
# 1. Apply 2x3 grid layout
./scripts/miyabi-orchestra-advanced.sh layout grid-2x3

# 2. Resize pane %2 to 80 columns × 30 rows
./scripts/miyabi-orchestra-advanced.sh resize %2 80x30

# 3. Apply color scheme
./scripts/miyabi-orchestra-advanced.sh colorize

# 4. Create new session
./scripts/miyabi-orchestra-advanced.sh session new project-x hybrid

# 5. Add CodeGenAgent
./scripts/miyabi-orchestra-advanced.sh agent add codegen

# 6. Clone CodeGenAgent (create 2nd instance)
./scripts/miyabi-orchestra-advanced.sh agent clone codegen

# 7. Switch pane %3 to Codex
./scripts/miyabi-orchestra-advanced.sh switch %3 codex

# 8. Show status
./scripts/miyabi-orchestra-advanced.sh status

# 9. Launch dashboard
./scripts/miyabi-orchestra-advanced.sh dashboard
```

---

## Layout Presets

### Detailed Layout Descriptions

#### 1. grid-2x2 (Balanced)

**Best for**: Small teams (4 agents), quick prototyping

```
┌──────────────┬──────────────┐
│   Pane 1     │   Pane 2     │
│ Orchestrator │   CodeGen    │
│   (カエデ)    │   (サクラ)    │
│     blue     │    green     │
├──────────────┼──────────────┤
│   Pane 3     │   Pane 4     │
│   Review     │      PR      │
│  (ツバキ)     │   (ボタン)    │
│   yellow     │   magenta    │
└──────────────┴──────────────┘
```

#### 2. grid-2x3 (Medium Scale)

**Best for**: Medium teams (6 agents), balanced workflow

```
┌─────────┬─────────┬─────────┐
│ Pane 1  │ Pane 2  │ Pane 3  │
│  Orch   │ CodeGen │ Review  │
│ (カエデ)  │ (サクラ)  │(ツバキ)  │
│  blue   │  green  │ yellow  │
├─────────┼─────────┼─────────┤
│ Pane 4  │ Pane 5  │ Pane 6  │
│   PR    │ Deploy  │  Issue  │
│(ボタン)  │(スミレ)   │(アサガオ) │
│magenta  │   red   │  cyan   │
└─────────┴─────────┴─────────┘
```

#### 3. main-side (Focused)

**Best for**: Single focus task with support agents

```
┌─────────────────────┬──────┐
│                     │Pane 2│
│                     │(サクラ)│
│      Pane 1         │green │
│   Orchestrator      ├──────┤
│     (カエデ)         │Pane 3│
│       blue          │(ツバキ)│
│                     │yellow│
├─────────────────────┼──────┤
│      Pane 4         │Pane 5│
│     (ボタン)         │(スミレ)│
│     magenta         │ red  │
└─────────────────────┴──────┘
```

#### 4. coding (Optimized)

**Best for**: Pure coding tasks (Bug fixes, feature development)

**Agents**: Orchestrator, CodeGen, Review, Issue, PR

#### 5. business (Optimized)

**Best for**: Business strategy, marketing, planning

**Agents**: Orchestrator, Strategy, Marketing, Sales, Analytics

#### 6. hybrid (Mixed)

**Best for**: Complex projects requiring both coding and business

**Agents**: Orchestrator + 3 Coding + 3 Business

---

## Agent Management

### Supported Agent Types

#### Coding Agents (7 types)

| Type | Name | Color | Purpose |
|------|------|-------|---------|
| orchestrator | カエデ | Blue | Coordination & oversight |
| codegen | サクラ | Green | Code generation & implementation |
| review | ツバキ | Yellow | Code review & quality assurance |
| pr | ボタン | Magenta | Pull request management |
| deployment | スミレ | Red | Deployment & CI/CD |
| issue | アサガオ | Cyan | Issue analysis & triage |
| documentation | フジ | White | Documentation generation |

#### Business Agents (17 types)

See [.claude/agents/AGENT_CHARACTERS.md](../.claude/agents/AGENT_CHARACTERS.md) for full list.

### Agent Lifecycle

```
┌───────────────┐
│  Add Agent    │ ← miyabi-orchestra-advanced.sh agent add <TYPE>
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Create Pane   │ ← tmux split-window
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  Set Color    │ ← get_agent_color()
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Start Claude  │ ← cc command
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  Assign Role  │ ← Send role message
└───────┬───────┘
        │
        ▼
┌───────────────┐
│   Working     │ ← Agent performs tasks
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Session End   │ ← Hook triggered
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Final Report  │ ← Sent to orchestrator
└───────────────┘
```

### Cloning Workflow

```bash
# Initial state: 1 CodeGenAgent (サクラ)
./scripts/miyabi-orchestra-advanced.sh agent add codegen

# Clone #1: Creates サクラ2
./scripts/miyabi-orchestra-advanced.sh agent clone codegen

# Clone #2: Creates サクラ3
./scripts/miyabi-orchestra-advanced.sh agent clone codegen

# Result: 3 independent CodeGen instances
```

**Use Cases for Cloning**:
- Multiple feature branches
- Parallel bug fixes
- A/B testing implementations
- Independent code experiments

---

## Session End Hooks

### Overview

Session end hooks enable automatic bidirectional communication between the orchestrator and agents.

### Hook Types

#### 1. Orchestrator Hook

**File**: `.hooks/orchestrator-session-end.sh`
**Triggered**: When orchestrator (pane %1) exits

**Actions**:
1. Detects all agent panes
2. Sends final instruction to each agent
3. Requests status reports
4. Saves orchestration state to `.ai/orchestra-state.json`

**Message Format**:
```
オーケストレーターがセッション終了します。あなた（[Agent名]）の作業状況を簡潔に報告してください。未完了タスクがあれば、その内容と進捗を記載してください。完了したら「[[Agent名]] セッション終了報告完了」と発言してください。
```

#### 2. Agent Hook

**File**: `.hooks/agent-session-end.sh`
**Triggered**: When any agent pane exits

**Actions**:
1. Identifies agent name from pane index
2. Finds orchestrator pane (%1)
3. Sends completion report to orchestrator
4. Saves work log to `.ai/logs/work-sessions/[Agent名]-[timestamp].json`

**Message Format**:
```
[[Agent名]] セッション終了報告: 作業完了しました。詳細はログを参照してください。(Pane: [pane_id])
```

### Hook Configuration

**File**: `~/.config/claude/settings.json`

```json
{
  "hooks": {
    "sessionEnd": "/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh"
  }
}
```

### Hook Execution Flow

```
┌───────────────────────────────────────────────────────────┐
│               Orchestrator Exits (Ctrl+D)                  │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────┐
│       orchestrator-session-end.sh triggered                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. List all panes (%1, %2, %3, %4, %5)              │  │
│  │ 2. For each pane (except %1):                        │  │
│  │    a. Get agent name (カエデ, サクラ, ツバキ...)     │  │
│  │    b. Send final instruction                         │  │
│  │    c. Wait 0.3s before Enter key                     │  │
│  │ 3. Save state to orchestra-state.json                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Agents receive message and prepare reports          │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Agent Exits (Ctrl+D or /exit)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          agent-session-end.sh triggered                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Detect current pane ID and index                   │  │
│  │ 2. Map index to agent name (サクラ, ツバキ, etc.)     │  │
│  │ 3. Find orchestrator pane (%1)                        │  │
│  │ 4. Send completion report to orchestrator             │  │
│  │ 5. Wait 0.3s before Enter key                         │  │
│  │ 6. Save work log to .ai/logs/work-sessions/           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Log Files

```
.ai/
├── orchestra-state.json                          # Latest orchestrator state
└── logs/
    ├── hooks/
    │   ├── orchestrator-session-end-*.log        # Orchestrator hook logs
    │   └── agent-session-end-*.log               # Agent hook logs
    ├── agent-reports/
    │   └── [Agent名]-*.txt                       # Agent reports (fallback)
    └── work-sessions/
        └── [Agent名]-*.json                      # Work session records
```

### Troubleshooting Hooks

**Problem**: Hooks not executing

**Solution**:
```bash
# 1. Check hook permissions
ls -la .hooks/*.sh

# 2. Verify Claude Code settings
cat ~/.config/claude/settings.json

# 3. Re-run setup
.hooks/setup-hooks.sh

# 4. Test manually
.hooks/orchestrator-session-end.sh
```

**Problem**: Messages not appearing in panes

**Solution**:
```bash
# 1. Check hook logs
tail -f .ai/logs/hooks/*.log

# 2. Verify tmux session
tmux list-panes -t 1:1

# 3. Test send-keys manually
tmux send-keys -t %1 "test" Enter
```

---

## Troubleshooting

### Common Issues

#### 1. "bash: declare: -A: invalid option"

**Cause**: macOS default bash is 3.2 (no associative arrays)

**Solution**: Script now uses functions instead - no action needed (fixed in v2.0.0)

#### 2. Enter key creates line break instead of sending

**Cause**: Missing sleep before Enter key

**Solution**: Script now includes `sleep 0.3` - no action needed (fixed in v2.0.0)

#### 3. Japanese characters garbled

**Cause**: Encoding issues with `set -u`

**Solution**: Script temporarily disables `set -u` for messages - no action needed (fixed in v2.0.0)

#### 4. Pane colors not applying

**Solution**:
```bash
# Reapply colors
./scripts/miyabi-orchestra-advanced.sh colorize

# Verify tmux version (need 3.0+)
tmux -V
```

#### 5. Agent not responding

**Solution**:
```bash
# 1. Check pane status
tmux list-panes -t 1:1

# 2. Check if Claude Code is running
tmux send-keys -t %2 "" C-c

# 3. Restart agent
./scripts/miyabi-orchestra-advanced.sh agent add codegen
```

---

## Advanced Usage

### Custom Layouts

Create your own layout by directly using tmux commands:

```bash
# Create base layout
tmux new-session -d -s custom -c /path/to/miyabi

# Split horizontally (50%)
tmux split-window -t custom:1 -h -p 50

# Split vertically (33%)
tmux split-window -t custom:1.2 -v -p 33

# Apply colors
./scripts/miyabi-orchestra-advanced.sh colorize
```

### Scripting Integration

```bash
#!/bin/bash
# automated-orchestra.sh

# Create session
./scripts/miyabi-orchestra-advanced.sh session new auto-session hybrid

# Add agents
./scripts/miyabi-orchestra-advanced.sh agent add codegen
./scripts/miyabi-orchestra-advanced.sh agent add review

# Apply colors
./scripts/miyabi-orchestra-advanced.sh colorize

# Attach
tmux attach -t auto-session
```

### Monitoring Multiple Sessions

```bash
# List all sessions
tmux ls

# Show status for each
for session in $(tmux list-sessions -F '#{session_name}'); do
    echo "=== $session ==="
    tmux list-panes -t "$session" -F '#{pane_id} #{pane_current_command}'
done
```

---

## Practical Use Cases

### Overview

This section provides real-world scenarios demonstrating how to effectively use Miyabi Orchestra Advanced for various development and business tasks.

### Scenario 1: Parallel Issue Processing

**Goal**: Process multiple GitHub Issues simultaneously with different agents

**Setup**:
```bash
# Create session with grid-2x3 layout
./scripts/miyabi-orchestra-advanced.sh session new issue-sprint grid-2x3

# Layout: 6 panes (1 Orchestrator + 5 Workers)
# Orchestrator assigns one Issue per agent
```

**Workflow**:
```bash
# Pane 1 (Orchestrator - カエデ)
tmux send-keys -t %2 "あなたはサクラ（CodeGenAgent）です。Issue #270を処理してください。完了したら [サクラ] Issue #270完了 と報告してください。" Enter

tmux send-keys -t %3 "あなたはツバキ（ReviewAgent）です。Issue #271を処理してください。完了したら [ツバキ] Issue #271完了 と報告してください。" Enter

tmux send-keys -t %4 "あなたはボタン（PRAgent）です。Issue #272を処理してください。完了したら [ボタン] Issue #272完了 と報告してください。" Enter

# Monitor progress from Orchestrator pane
tmux capture-pane -t %2 -p | tail -10
tmux capture-pane -t %3 -p | tail -10
tmux capture-pane -t %4 -p | tail -10
```

**Expected Outcome**:
- 3-5 Issues processed in parallel
- Completion time: 30-60 minutes (vs 2-3 hours sequential)
- Full audit trail in `.ai/logs/`

### Scenario 2: Emergency Bug Fix

**Goal**: Quickly identify, fix, and deploy a critical bug

**Setup**:
```bash
# Use main-side layout for focused work
./scripts/miyabi-orchestra-advanced.sh layout main-side
```

**Team Composition**:
- Pane 1 (Main): Orchestrator - coordinates the fix
- Pane 2: CodeGenAgent - implements the fix
- Pane 3: ReviewAgent - validates the fix
- Pane 4: PRAgent - creates emergency PR
- Pane 5: DeploymentAgent - deploys to production

**Workflow**:
```bash
# Step 1: Orchestrator assigns investigation
tmux send-keys -t %2 "緊急バグ: ユーザー認証が失敗しています。原因を調査してください。" Enter

# Step 2: After investigation, assign fix
tmux send-keys -t %2 "認証トークンの有効期限チェックを修正してください。" Enter

# Step 3: Parallel review while fixing
tmux send-keys -t %3 "サクラが認証修正を完了したら、セキュリティレビューを実施してください。" Enter

# Step 4: PR creation
tmux send-keys -t %4 "レビュー完了後、hotfix PRを作成してください。ラベル: 🔥hotfix, 🐛bug" Enter

# Step 5: Deployment
tmux send-keys -t %5 "PR #XXX がマージされたら、production環境にデプロイしてください。" Enter
```

**Expected Outcome**:
- Bug identified in 5-10 minutes
- Fix implemented and reviewed in 15-20 minutes
- Deployed to production in 30 minutes total

### Scenario 3: Feature Development with Multiple Reviews

**Goal**: Develop a new feature with thorough code review

**Setup**:
```bash
# Use coding layout
./scripts/miyabi-orchestra-advanced.sh layout coding

# Clone ReviewAgent for multiple perspectives
./scripts/miyabi-orchestra-advanced.sh agent clone review
```

**Team Composition**:
- Pane 1: Orchestrator
- Pane 2: CodeGenAgent (implementation)
- Pane 3: ReviewAgent #1 (architecture review)
- Pane 4: ReviewAgent #2 (security review)
- Pane 5: PRAgent

**Workflow**:
```bash
# Implementation
tmux send-keys -t %2 "Feature: ユーザーダッシュボードに分析グラフを追加してください。agent-executionスキルを使用。" Enter

# Architecture review (parallel)
tmux send-keys -t %3 "サクラの実装を、アーキテクチャの観点からレビューしてください。特にスケーラビリティに注目。" Enter

# Security review (parallel)
tmux send-keys -t %4 "サクラの実装を、セキュリティの観点からレビューしてください。XSS、CSRF、SQLインジェクションに注目。" Enter

# PR creation after both reviews pass
tmux send-keys -t %5 "両方のレビューが完了したら、PR作成してください。" Enter
```

**Expected Outcome**:
- Feature implementation: 1-2 hours
- Dual review (parallel): 30 minutes
- Higher code quality through specialized reviews

### Scenario 4: Business Strategy Planning

**Goal**: Create comprehensive business strategy with market research

**Setup**:
```bash
# Use business layout
./scripts/miyabi-orchestra-advanced.sh layout business
```

**Team Composition**:
- Pane 1: Orchestrator
- Pane 2: AIEntrepreneurAgent
- Pane 3: MarketResearchAgent
- Pane 4: PersonaAgent
- Pane 5: FunnelDesignAgent

**Workflow**:
```bash
# Market research (starts first)
tmux send-keys -t %3 "AI SaaS市場の調査を開始してください。20社以上の競合分析を含めてください。market-research-analysisスキルを使用。" Enter

# Business plan (parallel)
tmux send-keys -t %2 "AI駆動型プロジェクト管理ツールのビジネスプランを作成してください。business-strategy-planningスキルを使用。" Enter

# Persona development (waits for market research)
tmux send-keys -t %4 "市場調査が完了したら、ターゲットペルソナを3-5人作成してください。" Enter

# Funnel design (waits for persona)
tmux send-keys -t %5 "ペルソナが完成したら、カスタマージャーニーと導線設計を行ってください。" Enter
```

**Expected Outcome**:
- Complete business strategy: 2-3 hours
- Market research: 20+ competitors analyzed
- 3-5 detailed personas
- Full customer journey map

### Scenario 5: Hybrid Workflow (Coding + Marketing)

**Goal**: Launch a new feature with simultaneous marketing campaign

**Setup**:
```bash
# Use hybrid layout
./scripts/miyabi-orchestra-advanced.sh layout hybrid
```

**Team Composition**:
- Pane 1: Orchestrator
- Panes 2-4: Coding team (CodeGen, Review, PR)
- Panes 5-7: Marketing team (Content, SNS, Analytics)

**Workflow**:
```bash
# Coding team: Feature implementation
tmux send-keys -t %2 "Feature: AI自動レポート生成機能を実装してください。" Enter
tmux send-keys -t %3 "実装完了後、レビューしてください。" Enter
tmux send-keys -t %4 "レビュー完了後、PR作成してください。" Enter

# Marketing team: Parallel campaign preparation
tmux send-keys -t %5 "新機能「AI自動レポート」のブログ記事を作成してください。content-creation-strategyスキルを使用。" Enter
tmux send-keys -t %6 "SNS投稿計画を作成してください。Twitter, LinkedIn, Instagram用。sns-strategy-agentスキルを使用。" Enter
tmux send-keys -t %7 "ローンチKPI設定とトラッキングを準備してください。growth-analytics-dashboardスキルを使用。" Enter
```

**Expected Outcome**:
- Feature ready: 3-4 hours
- Marketing materials ready: 3-4 hours (parallel)
- Coordinated launch on same day
- Pre-configured analytics tracking

### Scenario 6: Code Refactoring with Multiple Reviewers

**Goal**: Large-scale refactoring with safety checks

**Setup**:
```bash
# Use grid-2x3 layout
./scripts/miyabi-orchestra-advanced.sh layout grid-2x3

# Clone ReviewAgent twice for different perspectives
./scripts/miyabi-orchestra-advanced.sh agent clone review
./scripts/miyabi-orchestra-advanced.sh agent clone review
```

**Team Composition**:
- Pane 1: Orchestrator
- Pane 2: CodeGenAgent (refactoring)
- Pane 3: ReviewAgent #1 (performance review)
- Pane 4: ReviewAgent #2 (maintainability review)
- Pane 5: ReviewAgent #3 (test coverage review)
- Pane 6: PRAgent

**Workflow**:
```bash
# Refactoring
tmux send-keys -t %2 "crates/miyabi-core/の認証モジュールを完全リファクタリングしてください。rust-developmentスキルを使用。" Enter

# Multi-perspective reviews (parallel)
tmux send-keys -t %3 "リファクタリング完了後、パフォーマンスの観点からレビューしてください。performance-analysisスキルを使用。" Enter

tmux send-keys -t %4 "リファクタリング完了後、保守性の観点からレビューしてください。コード複雑度、ドキュメント、命名規則に注目。" Enter

tmux send-keys -t %5 "リファクタリング完了後、テストカバレッジを確認してください。カバレッジ80%以上を目標。" Enter

# PR only after all reviews pass
tmux send-keys -t %6 "全てのレビューが完了し、問題がなければPR作成してください。" Enter
```

**Expected Outcome**:
- Refactoring: 2-3 hours
- Triple review (parallel): 45 minutes
- High confidence in changes
- 80%+ test coverage

### Scenario 7: Documentation Sprint

**Goal**: Generate comprehensive documentation for entire codebase

**Setup**:
```bash
# Use grid-2x3 layout
./scripts/miyabi-orchestra-advanced.sh session new doc-sprint grid-2x3
```

**Team Composition**:
- Pane 1: Orchestrator
- Panes 2-6: 5 DocumentationAgents (cloned)

**Workflow**:
```bash
# Assign different modules to each agent
tmux send-keys -t %2 "crates/miyabi-coreのドキュメントを生成してください。documentation-generationスキルを使用。" Enter

tmux send-keys -t %3 "crates/miyabi-agentsのドキュメントを生成してください。" Enter

tmux send-keys -t %4 "crates/miyabi-githubのドキュメントを生成してください。" Enter

tmux send-keys -t %5 "crates/miyabi-worktreeのドキュメントを生成してください。" Enter

tmux send-keys -t %6 "APIリファレンスドキュメントを生成してください。" Enter
```

**Expected Outcome**:
- 5 modules documented in 1-2 hours
- vs 5-10 hours if done sequentially
- Consistent documentation style
- Complete API reference

---

## Best Practices

### 1. Orchestrator Role and Responsibility

**DO**:
- ✅ Always designate Pane 1 as Orchestrator
- ✅ Orchestrator monitors all agent progress
- ✅ Orchestrator resolves conflicts and blockers
- ✅ Orchestrator makes final decisions on task priority

**Code Example**:
```bash
# Good: Orchestrator coordinates
tmux send-keys -t %2 "タスクA を実行してください。" Enter
tmux send-keys -t %3 "タスクB を実行してください。" Enter

# Orchestrator monitors both
tmux capture-pane -t %2 -p | grep "完了"
tmux capture-pane -t %3 -p | grep "完了"
```

### 2. Token Management

**DO**:
- ✅ Regularly clear context with `/clear` command
- ✅ Monitor token usage with `ccusage` command
- ✅ Clear after each major task completion
- ✅ Use focused instructions to minimize token consumption

**Code Example**:
```bash
# Clear all agents after task completion
for pane in %2 %3 %4 %5; do
    tmux send-keys -t $pane "/clear" Enter
    sleep 0.5
done
```

**Timing**:
- After each Issue completion
- After each PR merge
- Before starting new major task
- Every 30-60 minutes in long sessions

### 3. Agent Communication Patterns

**DO**:
- ✅ Use consistent naming format: `[Agent名] ステータス: 詳細`
- ✅ Include completion markers: `[Agent名] 完了`
- ✅ Report errors immediately: `[Agent名] エラー: 詳細`
- ✅ Use structured reporting

**Code Example**:
```bash
# Good: Structured reporting
[サクラ] 完了: Issue #270の実装が完了しました
[サクラ] 進行中: コードレビューを実施中です（進捗50%）
[サクラ] エラー: PR作成に失敗しました。GitHub APIエラー
[サクラ] 待機: ツバキのレビュー完了を待機中
```

### 4. Effective Pane Layouts

**DO**:
- ✅ Choose layout based on team size and task type
- ✅ Use `grid-2x2` for small teams (2-3 agents)
- ✅ Use `coding` for development-focused work
- ✅ Use `hybrid` for mixed coding + business tasks
- ✅ Apply colors for quick visual identification

**Decision Matrix**:
| Team Size | Task Type | Recommended Layout |
|-----------|-----------|-------------------|
| 2-3 agents | Any | grid-2x2 |
| 4-5 agents | Coding | coding |
| 4-5 agents | Business | business |
| 6-7 agents | Mixed | hybrid |
| 6+ agents | Documentation | grid-2x3 |

### 5. Session Cleanup

**DO**:
- ✅ Always run session end hooks
- ✅ Save important outputs before closing
- ✅ Clear all `/tmp` files
- ✅ Export logs to persistent storage

**Code Example**:
```bash
# Before closing session
# 1. Save important outputs
tmux capture-pane -t %2 -p > .ai/logs/sakura-final-$(date +%Y%m%d-%H%M%S).log

# 2. Clear agents
for pane in %2 %3 %4 %5; do
    tmux send-keys -t $pane "/clear" Enter
done

# 3. Exit gracefully (triggers session end hooks)
tmux send-keys -t %1 "exit" Enter
```

### 6. Error Handling

**DO**:
- ✅ Implement retry logic for failed tasks
- ✅ Use debugging-troubleshooting skill for persistent errors
- ✅ Escalate to Orchestrator when blocked
- ✅ Document error resolutions

**Code Example**:
```bash
# Agent self-healing
tmux send-keys -t %2 "エラーが発生した場合、debugging-troubleshootingスキルで調査してください。解決できない場合のみOrchestratorに報告してください。" Enter
```

### 7. Task Prioritization

**DO**:
- ✅ Use labels to indicate priority (🔥 for urgent)
- ✅ Assign high-priority tasks to multiple agents for redundancy
- ✅ Monitor high-priority tasks more frequently

**Code Example**:
```bash
# High-priority task with monitoring
tmux send-keys -t %2 "🔥 緊急: 本番環境のメモリリークを修正してください。15分ごとに進捗報告をお願いします。" Enter

# Monitor every 5 minutes
watch -n 300 'tmux capture-pane -t %2 -p | tail -10'
```

---

## Anti-Patterns (Avoid These)

### ❌ Anti-Pattern 1: Too Many Agents in One Session

**Problem**: Running 10+ agents in one session

**Why Bad**:
- System resource exhaustion
- Difficult to monitor
- Increased chance of conflicts
- Token limit issues

**Solution**:
```bash
# Instead: Use multiple sessions
./scripts/miyabi-orchestra-advanced.sh session new team-a coding
./scripts/miyabi-orchestra-advanced.sh session new team-b business

# Max 7 agents per session
```

### ❌ Anti-Pattern 2: No Orchestrator Coordination

**Problem**: All agents work independently without coordination

**Why Bad**:
- Duplicate work
- Conflicting changes
- No prioritization
- Lost context

**Bad Example**:
```bash
# Bad: No coordination
tmux send-keys -t %2 "Issue #270を処理してください" Enter
tmux send-keys -t %3 "Issue #270を処理してください" Enter
# Result: 2 agents work on same Issue!
```

**Good Example**:
```bash
# Good: Orchestrator assigns unique tasks
tmux send-keys -t %2 "Issue #270を処理してください" Enter
tmux send-keys -t %3 "Issue #271を処理してください" Enter
```

### ❌ Anti-Pattern 3: Ignoring Agent Reports

**Problem**: Orchestrator doesn't monitor agent outputs

**Why Bad**:
- Miss error messages
- Don't know when tasks complete
- Can't provide help when blocked

**Bad Example**:
```bash
# Bad: Fire and forget
tmux send-keys -t %2 "タスク実行してください" Enter
# ... Orchestrator does nothing else ...
```

**Good Example**:
```bash
# Good: Active monitoring
tmux send-keys -t %2 "タスク実行してください。完了したら [サクラ] 完了 と報告してください。" Enter

# Monitor regularly
while true; do
    tmux capture-pane -t %2 -p | grep "\[サクラ\] 完了" && break
    sleep 30
done
```

### ❌ Anti-Pattern 4: Mixed Responsibilities

**Problem**: Assigning multiple unrelated tasks to one agent

**Why Bad**:
- Context confusion
- Inefficient token usage
- Quality degradation

**Bad Example**:
```bash
# Bad: Too many responsibilities
tmux send-keys -t %2 "Issue #270を実装して、コードレビューして、PRを作成して、デプロイもしてください。" Enter
```

**Good Example**:
```bash
# Good: Single responsibility principle
tmux send-keys -t %2 "Issue #270を実装してください。" Enter
tmux send-keys -t %3 "サクラの実装をレビューしてください。" Enter
tmux send-keys -t %4 "レビュー完了後、PRを作成してください。" Enter
```

### ❌ Anti-Pattern 5: No Session Cleanup

**Problem**: Never running `/clear`, letting context grow indefinitely

**Why Bad**:
- Token limit reached
- Slow response times
- High API costs
- Context confusion

**Bad Example**:
```bash
# Bad: Never clear context
# ... 3 hours of work ...
# Agent context: 50,000+ tokens
# Response time: 2-3 minutes
```

**Good Example**:
```bash
# Good: Regular cleanup
# After each major task
tmux send-keys -t %2 "/clear" Enter

# Or automated
for pane in %2 %3 %4 %5; do
    tmux send-keys -t $pane "/clear" Enter
    sleep 0.5
done
```

### ❌ Anti-Pattern 6: No Error Reporting

**Problem**: Agents silently fail without reporting to Orchestrator

**Why Bad**:
- Orchestrator doesn't know about failures
- No opportunity for intervention
- Wasted time on failed tasks

**Bad Example**:
```bash
# Bad: No error handling instruction
tmux send-keys -t %2 "タスクを実行してください。" Enter
# Agent encounters error → says nothing → Orchestrator waits forever
```

**Good Example**:
```bash
# Good: Explicit error reporting
tmux send-keys -t %2 "タスクを実行してください。エラーが発生したら必ず [サクラ] エラー: 詳細 と報告してください。" Enter
```

### ❌ Anti-Pattern 7: Wrong Layout for Task

**Problem**: Using grid layout for focused work, or main-side for parallel work

**Why Bad**:
- Inefficient screen space
- Difficult navigation
- Reduced productivity

**Examples**:
| Task Type | Wrong Layout | Right Layout |
|-----------|-------------|--------------|
| Single focus bug fix | grid-2x3 | main-side |
| 6 parallel Issues | main-side | grid-2x3 |
| Coding only | hybrid | coding |
| Business only | coding | business |

### ❌ Anti-Pattern 8: Hardcoded Pane IDs

**Problem**: Using hardcoded pane IDs (`%22`, `%27`) in scripts

**Why Bad**:
- Breaks when panes are recreated
- Not portable across sessions
- Fails after tmux restart

**Bad Example**:
```bash
# Bad: Hardcoded pane ID
tmux send-keys -t %22 "command" Enter
# Breaks if pane %22 no longer exists
```

**Good Example**:
```bash
# Good: Use pane index or dynamic lookup
tmux send-keys -t 0 "command" Enter

# Or: Find pane by name
PANE_ID=$(tmux list-panes -F "#{pane_id} #{pane_current_command}" | grep "claude" | head -1 | cut -d' ' -f1)
tmux send-keys -t "$PANE_ID" "command" Enter
```

---

## API Reference

### Core Functions

#### `get_agent_color(agent_type)`

Returns the color for a given agent type.

**Parameters**:
- `agent_type`: Agent type (orchestrator, codegen, review, etc.)

**Returns**: Color name (blue, green, yellow, etc.)

**Example**:
```bash
color=$(get_agent_color "codegen")
echo "$color"  # Output: green
```

#### `get_agent_name(agent_type)`

Returns the Japanese name for a given agent type.

**Parameters**:
- `agent_type`: Agent type

**Returns**: Japanese name (カエデ, サクラ, ツバキ, etc.)

**Example**:
```bash
name=$(get_agent_name "codegen")
echo "$name"  # Output: サクラ
```

#### `get_exec_command(exec_env)`

Returns the command for a given execution environment.

**Parameters**:
- `exec_env`: Environment name (claude, codex, cursor)

**Returns**: Command (cc, codex, cursor)

**Example**:
```bash
cmd=$(get_exec_command "claude")
echo "$cmd"  # Output: cc
```

#### `check_exec_env(exec_env)`

Validates if an execution environment is supported.

**Parameters**:
- `exec_env`: Environment name to check

**Returns**: 0 (true) if valid, 1 (false) if invalid

**Example**:
```bash
if check_exec_env "claude"; then
    echo "Valid environment"
fi
```

### Layout Functions

#### `apply_layout(preset, session)`

Applies a predefined layout to a session.

**Parameters**:
- `preset`: Layout name (grid-2x2, grid-2x3, main-side, coding, business, hybrid)
- `session`: Session name (default: 1)

**Example**:
```bash
apply_layout "grid-2x3" "1"
```

#### `colorize_panes(session)`

Applies color scheme to all panes in a session.

**Parameters**:
- `session`: Session name (default: 1)

**Example**:
```bash
colorize_panes "1"
```

### Agent Functions

#### `add_agent(agent_type, session, exec_env)`

Adds a new agent to the session.

**Parameters**:
- `agent_type`: Agent type
- `session`: Session name (default: 1)
- `exec_env`: Execution environment (default: claude)

**Returns**: New pane ID

**Example**:
```bash
pane=$(add_agent "codegen" "1" "claude")
echo "Created pane: $pane"
```

#### `clone_agent(agent_type, session, exec_env)`

Clones an existing agent (creates numbered instance).

**Parameters**:
- `agent_type`: Agent type to clone
- `session`: Session name (default: 1)
- `exec_env`: Execution environment (default: claude)

**Example**:
```bash
clone_agent "codegen" "1" "claude"
# Creates サクラ2, サクラ3, etc.
```

---

## Version History

### v2.0.0 (2025-11-03)

**Major Changes**:
- ✅ bash 3.2 compatibility (macOS support)
- ✅ Fixed Enter key timing issues
- ✅ Added 6 layout presets
- ✅ Agent cloning support
- ✅ Environment switching
- ✅ Session end hooks integration
- ✅ Interactive dashboard

**Bug Fixes**:
- Fixed associative array incompatibility
- Fixed Enter key line break issues
- Fixed Japanese character encoding

### v1.0.0 (2025-11-02)

**Initial Release**:
- Basic layout management
- Color scheme support
- Agent management
- Multi-session support

---

## Related Documentation

- **Main Index**: [.claude/TMUX_INTEGRATION_INDEX.md](../.claude/TMUX_INTEGRATION_INDEX.md)
- **Basic Orchestra**: [.claude/MIYABI_PARALLEL_ORCHESTRA.md](../.claude/MIYABI_PARALLEL_ORCHESTRA.md)
- **Session Hooks**: [.hooks/IMPLEMENTATION_SUMMARY.md](../.hooks/IMPLEMENTATION_SUMMARY.md)
- **Agent Characters**: [.claude/agents/AGENT_CHARACTERS.md](../.claude/agents/AGENT_CHARACTERS.md)
- **Quick Start**: [docs/QUICK_START_3STEPS.md](./QUICK_START_3STEPS.md)

---

## Support & Feedback

- **Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **Discussions**: https://github.com/ShunsukeHayashi/Miyabi/discussions
- **Documentation**: https://shunsukehayashi.github.io/Miyabi/

---

**🎭 Miyabi Orchestra Advanced - Orchestrating AI Agents with Grace and Power**

**Version**: 2.0.0 | **Status**: ✅ Production Ready | **Compatibility**: macOS bash 3.2+
