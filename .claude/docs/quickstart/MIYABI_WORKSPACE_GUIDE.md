# Miyabi Development Workspace Guide

**Version**: 1.0 | **Created**: 2025-11-11 | **Session**: miyabi-full-power

---

## 🎯 Overview

効率的な並列開発のための6ペイン構成のワークスペース。各ペインは特定の役割を持ち、Claude Codeエージェントまたは手動操作に最適化されています。

---

## 📐 Layout Structure

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  %0: Main Control   │  %1: CodeGen       │  %2: Review         │
│  🎯 Coordinator     │  💻 Build/Code     │  🔍 Test/Quality    │
│                     │                     │                     │
├─────────────────────┼─────────────────────┼─────────────────────┤
│  %3: Documentation  │  %4: Observatory   │  %7: Terminal Ops   │
│  📚 Docs/Search     │  📊 Monitor/Logs   │  ⚡ Manual Ops      │
│                     │                     │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

**Window Dimensions**: 210x64 (auto-tiled layout)

---

## 🔧 Pane Descriptions

### %0: 🎯 Main Control
**Purpose**: Coordination and task assignment
**Typical Use**:
- CoordinatorAgent実行
- タスク全体の進行管理
- 他ペインへのコマンド送信
- ステータス監視

**Example Commands**:
```bash
# Start Coordinator
claude

# Send command to other pane
tmux send-keys -t %1 "cargo build" && sleep 0.5 && tmux send-keys -t %1 Enter

# Check all panes status
tmux list-panes -F "#{pane_id}: #{pane_title} - #{pane_current_command}"
```

---

### %1: 💻 CodeGen Agent
**Purpose**: Code generation and compilation
**Typical Use**:
- Rust開発（build, compile）
- コード生成タスク
- 依存関係管理

**Example Commands**:
```bash
# Build project
cargo build --release

# Run specific crate
cargo run -p miyabi-cli

# Update dependencies
cargo update
```

---

### %2: 🔍 Review Agent
**Purpose**: Quality assurance and testing
**Typical Use**:
- テスト実行
- Clippy静的解析
- フォーマットチェック
- PRレビュー

**Example Commands**:
```bash
# Run all tests
cargo test --all

# Run clippy
cargo clippy --all-targets --all-features

# Format check
cargo fmt --all -- --check
```

---

### %3: 📚 Documentation
**Purpose**: Documentation and code search
**Typical Use**:
- ドキュメント生成
- コードベース検索
- API調査
- Context7活用

**Example Commands**:
```bash
# Generate docs
cargo doc --no-deps --open

# Search codebase
rg "pattern" --type rust

# List crates
ls crates/
```

---

### %4: 📊 Observatory
**Purpose**: Monitoring and logging
**Typical Use**:
- ログ監視
- パフォーマンス計測
- ベンチマーク実行
- システムリソース確認

**Example Commands**:
```bash
# Tail logs
tail -f .ai/logs/water-spider.log

# Run benchmarks
cargo bench

# Check system resources
htop
```

---

### %7: ⚡ Terminal Ops
**Purpose**: Manual operations and utilities
**Typical Use**:
- Git操作
- ファイル操作
- 緊急対応
- スクリプト実行

**Example Commands**:
```bash
# Git status
git status

# Create worktree
git worktree add .worktrees/feature-branch

# Run custom script
./scripts/miyabi-task-assignment.sh
```

---

## 🚀 Quick Start

### Option 1: Using Alias (Recommended)
```bash
# Start workspace with default name (miyabi-full-power)
miyabi-workspace

# Or use short alias
mw

# Start with custom session name
miyabi-workspace my-session-name
```

### Option 2: Direct Script Execution
```bash
# From project root
./scripts/start-miyabi-workspace.sh

# With custom session name
./scripts/start-miyabi-workspace.sh my-session-name
```

### Option 3: Attach to Existing Session
```bash
tmux attach -t miyabi-full-power
```

**Note**: The alias is available after sourcing miyabi-aliases.sh (automatically loaded in .zshrc)

### 2. Navigate Between Panes
- **Ctrl-a + Arrow Keys**: ペイン移動
- **Ctrl-a + q**: ペイン番号表示
- **Ctrl-a + z**: ペインズーム（トグル）

### 3. Start Claude Code in Pane
```bash
# Navigate to target pane (e.g., %1)
tmux select-pane -t %1

# Clear session
/clear

# Start new task
[Your task here]
```

### 4. Send Commands from Main Control
```bash
# From %0 (Main Control)
tmux send-keys -t %1 "cargo build" && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## 📋 Common Workflows

### Workflow 1: Full Build & Test
```bash
# %0: Coordinate
tmux send-keys -t %1 "cargo build --release" && sleep 0.5 && tmux send-keys -t %1 Enter

# Wait for build completion, then test
tmux send-keys -t %2 "cargo test --all" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Workflow 2: Parallel Agent Execution
```bash
# %0: Start coordinator
claude

# %1: CodeGen task
tmux send-keys -t %1 "claude" && sleep 0.5 && tmux send-keys -t %1 Enter
# Then send: "Fix issue #123"

# %2: Review task
tmux send-keys -t %2 "claude" && sleep 0.5 && tmux send-keys -t %2 Enter
# Then send: "Review PR #456"
```

### Workflow 3: Documentation & Search
```bash
# %3: Generate docs
cargo doc --no-deps

# %3: Search for implementation
rg "struct Agent" --type rust -A 5
```

### Workflow 4: Monitoring & Debugging
```bash
# %4: Start monitoring
tail -f .ai/logs/conductor-control.log

# %7: Debug with gdb
rust-gdb target/debug/miyabi
```

---

## ⌨️ Keyboard Shortcuts

### tmux General
| Shortcut | Action |
|----------|--------|
| `Ctrl-a + c` | 新しいウィンドウ作成 |
| `Ctrl-a + ,` | ウィンドウ名変更 |
| `Ctrl-a + d` | セッションデタッチ |
| `Ctrl-a + [` | スクロールモード |

### Pane Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl-a + Up/Down/Left/Right` | ペイン移動 |
| `Ctrl-a + q` | ペイン番号表示 |
| `Ctrl-a + z` | ペインズーム |
| `Ctrl-a + x` | ペイン閉じる |

### Pane Resizing
| Shortcut | Action |
|----------|--------|
| `Ctrl-Up/Down/Left/Right` | ペインサイズ変更 |
| `Ctrl-a + Space` | レイアウト切替 |

---

## 🛡️ Safety & Best Practices

### 1. Before Running Destructive Commands
```bash
# Always verify current pane
tmux display-message -p "#{pane_id}: #{pane_title}"

# Use dry-run when possible
cargo build --dry-run
```

### 2. Agent Communication
```bash
# Use proper command format
tmux send-keys -t <PANE_ID> "<COMMAND>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

### 3. Session Recovery
```bash
# If session crashes
tmux attach -t miyabi-full-power || tmux new -s miyabi-full-power

# Restore layout
tmux source-file ~/.tmux.conf
```

### 4. Log Management
```bash
# Clear logs before new task
> .ai/logs/water-spider.log

# Rotate logs
mv .ai/logs/conductor-control.log .ai/logs/conductor-control.log.bak
```

---

## 📊 Performance Tips

### 1. Optimize Pane Count
- **6ペイン**: 最適バランス（現在の構成）
- **9ペイン**: 複雑すぎ、画面が小さくなる
- **4ペイン**: シンプルだが並列度不足

### 2. Use Layout Presets
```bash
# Tiled (current)
tmux select-layout tiled

# Main-vertical (1 main + others)
tmux select-layout main-vertical

# Even-horizontal
tmux select-layout even-horizontal
```

### 3. Terminal Size Optimization
```bash
# Minimum recommended: 180x50
# Optimal: 210x64 (current)
# Large display: 280x80+
```

---

## 🔗 Integration with Miyabi

### Agent Execution
```bash
# Use agent-execution Skill
/agent-run agent=CodeGen pane=%1 task="Fix issue #123"
```

### Worktree Management
```bash
# Create worktree from %7
git worktree add .worktrees/issue-123 -b fix/issue-123

# Work in isolated environment
cd .worktrees/issue-123
```

### VOICEVOX Notifications
```bash
# Notify on task completion
echo "Task completed" | voicevox-queue
```

---

## 📝 Customization

### Change Pane Titles
```bash
tmux select-pane -t %0 -T "Custom Title"
```

### Resize Specific Pane
```bash
tmux resize-pane -t %1 -R 10  # Expand right by 10
tmux resize-pane -t %2 -D 5   # Expand down by 5
```

### Save Current Layout
```bash
# Get current layout string
tmux list-windows -F "#{window_layout}"

# Apply saved layout
tmux select-layout "layout-string-here"
```

---

## 🚨 Troubleshooting

### Issue: Pane Not Responding
```bash
# Check pane process
tmux list-panes -F "#{pane_id}: #{pane_pid} - #{pane_current_command}"

# Kill and restart
tmux kill-pane -t %X
tmux split-window -t miyabi-full-power:1
```

### Issue: Layout Broken
```bash
# Reapply tiled layout
tmux select-layout tiled

# Manual resize
tmux resize-pane -t %0 -x 70 -y 32
```

### Issue: Claude Code Session Lost
```bash
# Navigate to pane
tmux select-pane -t %1

# Clear and restart
/clear
claude
```

---

## 📚 Related Documentation

- **tmux Control**: `.claude/commands/tmux-control.md`
- **Agent Specs**: `.claude/agents/specs/`
- **Miyabi Operations**: `.claude/TMUX_OPERATIONS.md`
- **Orchestra Guide**: `.claude/MIYABI_PARALLEL_ORCHESTRA.md`

---

## 📈 Metrics

| Metric | Value |
|--------|-------|
| Total Panes | 6 |
| Window Size | 210x64 |
| Avg Pane Size | ~35x10 |
| Layout Type | Tiled |
| Claude Sessions | 4/6 active |

---

**Created**: 2025-11-11
**Maintained by**: TmuxControlAgent（つむっくん）
**Status**: Production Ready
**Last Updated**: 2025-11-11
