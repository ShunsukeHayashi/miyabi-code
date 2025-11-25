# Tmux Layout Configurations

Issue: #876 - tmuxレイアウト自動最適化

## Overview

This directory contains pre-configured tmux layouts optimized for different Miyabi development tasks.

## Available Layouts

| Layout | Description | Use Case |
|--------|-------------|----------|
| `coding.conf` | Editor + Test + Log | Development workflow |
| `monitoring.conf` | Multi-coordinator status | System monitoring |
| `debugging.conf` | Log-focused 3-way split | Bug investigation |
| `coordination.conf` | All coordinators view | Multi-agent orchestration |
| `agent.conf` | Multi-agent dashboard | Agent management |

## Usage

### Via CLI (Recommended)

```bash
# Optimize layout for a specific task
miyabi tmux optimize --for=coding
miyabi tmux optimize --for=monitoring
miyabi tmux optimize --for=debugging
miyabi tmux optimize --for=coordination
miyabi tmux optimize --for=agent

# List available layouts
miyabi tmux list

# Show current tmux status
miyabi tmux status

# Apply a layout file directly
miyabi tmux apply .claude/tmux-layouts/coding.conf

# Save current layout
miyabi tmux save ~/my-layout.conf

# Reset to default
miyabi tmux reset
```

### Manual Usage

```bash
# Source a layout file directly
tmux source-file .claude/tmux-layouts/coding.conf

# Or start a new session with layout
tmux new-session -d \; source-file .claude/tmux-layouts/monitoring.conf \; attach
```

## Layout Details

### Coding Layout

```
┌────────────────────────────────────────────┐
│                                            │
│              Editor Window                 │
│                                            │
├────────────────────────────────────────────┤
│           Test Window                      │
│  ┌──────────────────────────────────────┐  │
│  │        cargo watch -x test           │  │
│  ├──────────────────────────────────────┤  │
│  │           Log tail                   │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│              Git Window                    │
└────────────────────────────────────────────┘
```

### Monitoring Layout

```
┌────────────────────────────────────────────┐
│           Status Window                    │
│  ┌──────────────────────────────────────┐  │
│  │        miyabi status (watch)         │  │
│  ├──────────────────────────────────────┤  │
│  │              htop                    │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│            Logs Window                     │
│  ┌──────────────────────────────────────┐  │
│  │       Coordinator logs               │  │
│  ├──────────────────────────────────────┤  │
│  │         Agent logs                   │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

### Coordination Layout

```
┌────────────────────────────────────────────┐
│         Coordinators Window                │
│  ┌──────────────────────────────────────┐  │
│  │        MUGEN (Coordinator 1)         │  │
│  ├──────────────────────────────────────┤  │
│  │        MAJIN (Coordinator 2)         │  │
│  ├──────────────────────────────────────┤  │
│  │        Local (Coordinator 3)         │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│         Orchestrator Window                │
│  ┌──────────────────────────────────────┐  │
│  │        Loop status                   │  │
│  ├──────────────────────────────────────┤  │
│  │        Issue list (watch)            │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Customization

Create your own layout files following the tmux conf format:

```conf
# My Custom Layout
new-session -d -s miyabi -n main

# Create windows and panes
new-window -t miyabi -n secondary
split-window -v -t miyabi:secondary -p 50

# Send commands to panes
send-keys -t miyabi:main 'my-command' Enter

# Select starting window
select-window -t miyabi:main
```

## Related

- Issue #876: tmuxレイアウト自動最適化
- CLI: `crates/miyabi-cli/src/commands/tmux.rs`
