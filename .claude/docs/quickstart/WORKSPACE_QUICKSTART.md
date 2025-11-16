# Miyabi Workspace - Quick Start Guide

**Version**: 1.0 | **Created**: 2025-11-11

---

## 🎯 3-Step Setup

### Step 1: Start Workspace
```bash
miyabi-workspace
```

That's it! The workspace will automatically create a 6-pane layout.

---

## 📐 What You Get

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  %0: 🎯 Main        │  %1: 💻 CodeGen    │  %2: 🔍 Review     │
│  Control            │  Agent              │  Agent              │
├─────────────────────┼─────────────────────┼─────────────────────┤
│  %3: 📚 Docs        │  %4: 📊 Observatory│  %5: ⚡ Terminal   │
│                     │                     │  Ops                │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## ⌨️ Essential Shortcuts

| Action | Shortcut |
|--------|----------|
| Navigate panes | `Ctrl-a` + Arrow Keys |
| Show pane numbers | `Ctrl-a` + `q` |
| Zoom pane | `Ctrl-a` + `z` |
| Detach session | `Ctrl-a` + `d` |

---

## 🚀 Common Tasks

### Start Claude Code in a Pane
1. Navigate to desired pane: `Ctrl-a` + Arrow Keys
2. Clear session: `/clear`
3. Give task: e.g., "Build the project"

### Send Command from Main Control
```bash
# From %0 (Main Control)
tmux send-keys -t %1 "cargo build" && sleep 0.5 && tmux send-keys -t %1 Enter
```

### Attach to Existing Session
```bash
tmux attach -t miyabi-full-power
```

---

## 🆘 Troubleshooting

### Session Already Exists
When you run `miyabi-workspace`, you'll see options:
1. Attach to existing
2. Kill and recreate
3. Create with different name
4. Cancel

### Pane Layout Broken
```bash
# Reapply tiled layout
tmux select-layout tiled
```

### Lost Pane Titles
```bash
# Run the setup script again
./scripts/start-miyabi-workspace.sh
```

---

## 📚 Full Documentation

For detailed information, see:
- **Complete Guide**: `.claude/MIYABI_WORKSPACE_GUIDE.md`
- **tmux Operations**: `.claude/TMUX_OPERATIONS.md`
- **Agent Control**: `.claude/commands/tmux-control.md`

---

## 💡 Tips

1. **Use aliases**: `mw` is short for `miyabi-workspace`
2. **Zoom for focus**: `Ctrl-a` + `z` to maximize current pane
3. **Detach, don't close**: `Ctrl-a` + `d` keeps session running
4. **Name your sessions**: `miyabi-workspace my-feature-work`

---

**Created**: 2025-11-11
**Maintained by**: TmuxControlAgent
**Status**: Production Ready
