# 🔄 Agent Reset Procedure - Standard Operating Procedure

**Document Version**: 1.0.0
**Last Updated**: $(date '+%Y-%m-%d')
**Category**: Operations / Maintenance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 Purpose

This document describes the standard procedure for resetting all Agent instances (Claude Code) running in tmux panes within the Miyabi Orchestra environment.

## 🎯 When to Use

- All Agents need to be restarted with fresh sessions
- Agent instances are stuck or unresponsive
- Memory needs to be cleared across all Agents
- After major configuration changes
- As part of routine maintenance

## ⚠️ Prerequisites

- Access to Miyabi tmux session
- Admin/operator permissions
- Understanding of Miyabi Orchestra configuration
- VOICEVOX worker running (optional, for narration)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔧 Standard Procedure

### Step 1: Identify All Running Agent Instances

```bash
# List all tmux panes and their processes
tmux list-panes -t Miyabi:1 -a -F '#{session_name}:#{window_index}.#{pane_index} (#{pane_id}) - #{pane_current_command}'

# Filter for Claude Code instances (node processes)
tmux list-panes -t Miyabi:1 -a -F '#{session_name}:#{window_index}.#{pane_index} (#{pane_id}) - #{pane_current_command}' | grep node
```

**Expected Output**: List of panes running `node` (Claude Code instances)

### Step 2: Stop All Claude Code Instances

**IMPORTANT**: Do NOT use `/clear` command or `exit` command, as they may close panes.

**Correct Method**: Send Ctrl+C twice to gracefully stop Claude Code

```bash
# For each pane, send Ctrl+C twice
tmux send-keys -t PANE_ID C-c
sleep 0.2
tmux send-keys -t PANE_ID C-c
sleep 0.5
```

**Example for Window 1 (9 panes)**:
```bash
for pane in 1 2 3 4 5 6 7 8 9; do
  echo "Stopping Pane $pane..."
  tmux send-keys -t Miyabi:1.$pane C-c
  sleep 0.2
  tmux send-keys -t Miyabi:1.$pane C-c
  sleep 0.5
done
```

**Example for Window 2 (2 panes)**:
```bash
for pane in 1 2; do
  echo "Stopping Window 2, Pane $pane..."
  tmux send-keys -t Miyabi:2.$pane C-c
  sleep 0.2
  tmux send-keys -t Miyabi:2.$pane C-c
  sleep 0.5
done
```

### Step 3: Verify All Instances Stopped

```bash
# Check for remaining node processes
tmux list-panes -t Miyabi:1 -a -F '#{session_name}:#{window_index}.#{pane_index} - #{pane_current_command}' | grep node

# If empty, all instances stopped successfully
```

### Step 4: Check for Stubborn Instances

Some instances may not stop immediately. Check each pane:

```bash
# Window 1
for pane in 1 2 3 4 5 6 7 8 9; do
  echo "=== Pane $pane ==="
  tmux capture-pane -t Miyabi:1.$pane -p | tail -5
done

# Window 2
for pane in 1 2; do
  echo "=== Window 2, Pane $pane ==="
  tmux capture-pane -t Miyabi:2.$pane -p | tail -5
done
```

Look for:
- `ctrl + c again to quit` - Needs another Ctrl+C
- Claude Code prompt still visible - Still running

For stubborn instances, send Ctrl+C multiple times:

```bash
tmux send-keys -t PANE_ID C-c
sleep 0.2
tmux send-keys -t PANE_ID C-c
sleep 0.2
tmux send-keys -t PANE_ID C-c
```

### Step 5: Restart Claude Code (Optional)

**Note**: Determine the correct command for starting Claude Code in your environment.

Common commands:
- `cc` (if aliased correctly)
- `codex`
- `npx claude-code`

**CAUTION**: Verify `cc` is NOT the C compiler (clang). Test first:
```bash
which cc
# If it shows /usr/bin/cc, use alternative command
```

**Restart Command Template**:
```bash
cd '/Users/shunsuke/Dev/miyabi-private' && <CLAUDE_CODE_COMMAND>
```

**Example for Window 1**:
```bash
for pane in 1 2 3 4 5 6 7 8 9; do
  echo "Starting Pane $pane..."
  tmux send-keys -t Miyabi:1.$pane "cd '/Users/shunsuke/Dev/miyabi-private' && codex"
  sleep 0.1
  tmux send-keys -t Miyabi:1.$pane Enter
  sleep 1
done
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚫 Common Mistakes to Avoid

### ❌ DO NOT Use `/clear` Command

```bash
# WRONG - May cause unexpected behavior
tmux send-keys -t PANE_ID "/clear" && sleep 0.1 && tmux send-keys -t PANE_ID Enter
```

**Why**: `/clear` is a Claude Code command that may not properly terminate the process.

### ❌ DO NOT Use `exit` Command

```bash
# WRONG - Will close the pane
tmux send-keys -t PANE_ID "exit" && sleep 0.1 && tmux send-keys -t PANE_ID Enter
```

**Why**: `exit` closes the shell, which closes the tmux pane entirely.

### ❌ DO NOT Send Only One Ctrl+C

```bash
# WRONG - May not fully stop Claude Code
tmux send-keys -t PANE_ID C-c
```

**Why**: Claude Code requires two Ctrl+C signals to fully terminate.

### ✅ CORRECT Method

```bash
# RIGHT - Send Ctrl+C twice with delay
tmux send-keys -t PANE_ID C-c
sleep 0.2
tmux send-keys -t PANE_ID C-c
sleep 0.5
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 Typical Configuration

### Miyabi Orchestra Standard Setup

```
Window 1 (Conductor): 9 panes
  Panes 1-9: Coding Agents

Window 2 (Business): 2 panes
  Panes 1-2: Business/Strategy Agents

Window 3 (Monitor): 3 panes
  Panes 1-3: Monitoring dashboards

Total: 14 panes (11 Agent instances + 3 monitors)
```

### Pane Identification

```bash
# List all panes with IDs
tmux list-panes -t Miyabi -a -F 'Window #{window_index}, Pane #{pane_index}: #{pane_id} - #{pane_current_command}'

# Example output:
# Window 1, Pane 1: %2 - node
# Window 1, Pane 2: %10 - node
# Window 2, Pane 1: %4 - node
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔍 Troubleshooting

### Issue: Panes Disappeared After Reset

**Symptom**: Some panes are no longer visible after running reset commands

**Cause**: Likely used `exit` command which closed the pane

**Solution**:
1. Check remaining panes: `tmux list-panes -t Miyabi:1`
2. Recreate missing panes if needed
3. Follow correct procedure (Ctrl+C only, no exit)

### Issue: "ctrl + c again to quit" Message

**Symptom**: Pane shows this message after first Ctrl+C

**Cause**: This is normal - Claude Code requires confirmation

**Solution**: Send another Ctrl+C immediately

### Issue: `cc` Command Starts C Compiler

**Symptom**: Error: "clang: error: no input files"

**Cause**: `cc` is aliased to C language compiler, not Claude Code

**Solution**: Use correct command (`codex` or `npx claude-code`)

### Issue: Some Panes Still Running After Reset

**Symptom**: `grep node` still shows active processes

**Cause**: Incomplete Ctrl+C sequence or timing issues

**Solution**:
1. Identify specific pane: `tmux list-panes | grep node`
2. Send multiple Ctrl+C: 3-4 times with delays
3. Verify stopped: Check pane output

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📝 Checklist

Use this checklist for each reset operation:

- [ ] List all running Claude Code instances
- [ ] Send Ctrl+C twice to each pane (with delays)
- [ ] Verify all instances stopped (no `node` processes)
- [ ] Check for "ctrl + c again to quit" messages
- [ ] Send additional Ctrl+C to stubborn instances
- [ ] Verify all panes still exist (no closures)
- [ ] (Optional) Restart Claude Code in each pane
- [ ] Document any issues encountered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Success Criteria

A successful reset operation should result in:

1. ✅ All Claude Code instances terminated
2. ✅ All tmux panes intact (none closed)
3. ✅ Clean shell prompt in each pane
4. ✅ No `node` processes when checking with `grep`
5. ✅ Ready for new Claude Code sessions to start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📚 Related Documents

- [MIYABI_PARALLEL_ORCHESTRA.md](.claude/MIYABI_PARALLEL_ORCHESTRA.md) - Orchestra philosophy
- [TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md) - tmux technical details
- [KAMUI_TMUX_GUIDE.md](.claude/KAMUI_TMUX_GUIDE.md) - Kamui integration
- [QUICK_START_3STEPS.md](QUICK_START_3STEPS.md) - Quick start guide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📅 Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0   | $(date '+%Y-%m-%d') | Initial document based on actual reset operation |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Maintained by**: Miyabi Operations Team
**Last Validated**: $(date '+%Y-%m-%d')

