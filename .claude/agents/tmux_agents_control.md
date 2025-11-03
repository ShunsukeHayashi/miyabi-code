# 🎭 Miyabi Orchestra - Agent Control Quick Reference

**Quick access guide for controlling the 4 Miyabi Orchestra agents via tmux**

---

## 🎯 Agent Configuration

| Agent | Pane ID | Role | Working Dir |
|-------|---------|------|-------------|
| 🎼 **Conductor** | `%1` | Main control | `/Users/shunsuke/Dev/miyabi-private` |
| 🎹 **カエデ** | `%2` | CodeGen | `/Users/shunsuke/Dev/miyabi-private` |
| 🎺 **サクラ** | `%5` | Review | `/Users/shunsuke/Dev/miyabi-private` |
| 🥁 **ツバキ** | `%3` | PR | `/Users/shunsuke/Dev/miyabi-private` |
| 🎷 **ボタン** | `%4` | Deploy | `/Users/shunsuke/Dev/miyabi-private` |

---

## ⚡ Quick Start Commands

### Start All Agents (Parallel Launch)

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.1 && tmux send-keys -t %2 Enter & \
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.1 && tmux send-keys -t %5 Enter & \
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.1 && tmux send-keys -t %3 Enter & \
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.1 && tmux send-keys -t %4 Enter & \
wait
```

### Test All Agents (Confirm Readiness)

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。[カエデ] 準備OK！ と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。[サクラ] 準備OK！ と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。[ツバキ] 準備OK！ と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。[ボタン] 準備OK！ と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

---

## 📖 Table of Contents

1. [🎹 カエデ (CodeGen)](#kaede)
2. [🎺 サクラ (Review)](#sakura)
3. [🥁 ツバキ (PR)](#tsubaki)
4. [🎷 ボタン (Deploy)](#botan)
5. [📊 Monitoring & Status](#monitoring)
6. [🔄 Token Management](#token-management)
7. [🎯 Common Workflows](#workflows)
8. [🚨 Troubleshooting](#troubleshooting)
9. [⌨️ Navigation](#navigation)
10. [📝 Communication Protocol](#communication)
11. [🎨 Custom Behaviors](#custom-behaviors)

---

<a name="kaede"></a>

## 🎹 カエデ (CodeGen) - Pane %2

### Basic Task Assignment

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装をagent-executionスキルで行ってください。完了したら [カエデ] 完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### With Error Reporting

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装を行ってください。エラー時は [カエデ] エラー: {詳細} と発言してください。完了したら [カエデ] 完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### With Conductor Reporting

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- pane2です。Issue #270の実装を行ってください。エラー時は[カエデ]を付けてtmux send-keys -t %1でConductorに報告してください。完了したら同様に報告してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### Check Status

```bash
tmux capture-pane -t %2 -p | tail -10
```

### Check for Completion

```bash
tmux capture-pane -t %2 -p | grep "\[カエデ\]"
```

### Clear Context

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

<a name="sakura"></a>
## 🎺 サクラ (Review) - Pane %5

### Basic Review Task

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。最新のコミットをレビューしてください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### Wait for カエデ Then Review

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### Review Specific Files

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。crates/miyabi-cli/src/commands/agent.rs をレビューしてください。品質スコアと改善点を報告してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### Check Status

```bash
tmux capture-pane -t %5 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %5 Enter
```

---

<a name="tsubaki"></a>
## 🥁 ツバキ (PR) - Pane %3

### Basic PR Creation

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。現在のブランチでPR作成を行ってください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

### Wait for サクラ Then Create PR

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

### Create PR with Specific Title

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。タイトル「feat: Issue #270実装」でPRを作成してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

### Check Status

```bash
tmux capture-pane -t %3 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %3 Enter
```

---

<a name="botan"></a>
## 🎷 ボタン (Deploy) - Pane %4

### Basic Deploy Task

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。デプロイを実行してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### Wait for ツバキ Then Deploy

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### Check Status

```bash
tmux capture-pane -t %4 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %4 Enter
```

---

<a name="monitoring"></a>
## 📊 Monitoring & Status

### Dashboard (All Agents)

```bash
./scripts/miyabi-dashboard.sh
```

### Check All Agents Status

```bash
for pane in %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | tail -5
    echo ""
done
```

### Search for Completions

```bash
for pane in %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | grep "完了"
    echo ""
done
```

### Search for Errors

```bash
for pane in %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | grep -i "error\|エラー"
    echo ""
done
```

### Search for Specific Agent Messages

```bash
# カエデの発言
tmux capture-pane -t %2 -p | grep "\[カエデ\]"

# サクラの発言
tmux capture-pane -t %5 -p | grep "\[サクラ\]"

# ツバキの発言
tmux capture-pane -t %3 -p | grep "\[ツバキ\]"

# ボタンの発言
tmux capture-pane -t %4 -p | grep "\[ボタン\]"
```

---

<a name="token-management"></a>
## 🔄 Token Management

### Clear Individual Agent

```bash
# カエデ
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### Clear All Agents (Sequential)

```bash
for pane in %2 %5 %3 %4; do
    tmux send-keys -t $pane "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t $pane Enter
    sleep 0.5
done
```

### Check Token Usage

```bash
# Run in Conductor pane
ccusage
```

---

<a name="workflows"></a>
## 🎯 Common Workflows

### Workflow 1: Full Pipeline (Issue → Implementation → Review → PR → Deploy)

```bash
# Step 1: カエデ - Implementation
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装をagent-executionスキルで行ってください。完了したら [カエデ] Issue #270実装完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# Step 2: サクラ - Review (wait for カエデ)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter

# Step 3: ツバキ - PR Creation (wait for サクラ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter

# Step 4: ボタン - Deploy (wait for ツバキ)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### Workflow 2: Parallel Review (Multiple Reviewers)

```bash
# カエデ - Implementation
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装を行ってください。完了したら [カエデ] 実装完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ - Code Quality Review (wait for カエデ)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが 実装完了 と発言したら、コード品質レビューを開始してください。完了したら [サクラ] 品質レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ - Security Review (wait for カエデ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。カエデが 実装完了 と発言したら、セキュリティレビューを開始してください。完了したら [ツバキ] セキュリティレビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン - Performance Review (wait for カエデ)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。カエデが 実装完了 と発言したら、パフォーマンスレビューを開始してください。完了したら [ボタン] パフォーマンスレビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### Workflow 3: Emergency Hotfix

```bash
# カエデ - Quick fix
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。緊急バグ修正を行ってください。Issue #280。完了したら [カエデ] 修正完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ - Quick review (parallel start)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが 修正完了 と発言したら、クイックレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ - Immediate PR (wait for サクラ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、即座にPR作成してください。完了したら [ツバキ] PR完了 と発言してください。" && sleep 0.1 && tmux send-keys -t %3 Enter
```

---

<a name="troubleshooting"></a>
## 🚨 Troubleshooting Quick Fixes

### Agent Not Responding

```bash
# Check what agent is doing
tmux capture-pane -t %2 -p | tail -20

# If stuck, clear and restart
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t %2 Enter
sleep 2
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。準備できましたか？" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### Agent Reported Error

```bash
# Check error details
tmux capture-pane -t %2 -p | grep -A 5 "エラー\|error"

# Ask agent to self-resolve
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && 発生したエラーを調査して解決を試みてください。解決できない場合のみ報告してください。" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### Agent Waiting Forever

```bash
# Check what agent is waiting for
tmux capture-pane -t %5 -p | tail -10

# Send manual trigger
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && 待機を終了して、タスクを開始してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### Command Not Executing

```bash
# Verify basic style is used
# ✅ Correct:
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && [instruction]" && sleep 0.1 && tmux send-keys -t %2 Enter

# ❌ Incorrect:
tmux send-keys -t %2 '[instruction]' Enter  # Wrong quotes, no cd, no sleep
```

---

<a name="navigation"></a>
## ⌨️ Navigation Quick Reference

| Action | Command |
|--------|---------|
| Move to Conductor | `Ctrl-a + 1` |
| Move to カエデ | `Ctrl-a + 2` |
| Move to サクラ | `Ctrl-a + 3` |
| Move to ツバキ | `Ctrl-a + 4` |
| Move to ボタン | `Ctrl-a + 5` |
| Show pane numbers | `Ctrl-a + q` |
| Maximize/restore pane | `Ctrl-a + z` |
| Previous pane | `Ctrl-a + o` |

---

<a name="communication"></a>
## 📝 Agent Communication Protocol

### Standard Reporting Format

```
[Agent名] {ステータス}: {詳細}
```

**Examples**:
- `[カエデ] 完了: Issue #270の実装が完了しました`
- `[サクラ] 進行中: コードレビューを実施中です（進捗50%）`
- `[ツバキ] エラー: PR作成に失敗しました。GitHub APIエラー`
- `[ボタン] 待機: ツバキのPR完了を待機中`

### Agent-to-Conductor Reporting

```bash
# Agent sends message to Conductor (%1)
tmux send-keys -t %1 '[カエデ] タスク完了しました' && sleep 0.1 && tmux send-keys -t %1 Enter
```

### Agent-to-Agent Communication

```bash
# サクラ waits for カエデ's message
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが 完了 と発言したら、次のタスクを開始してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

---

<a name="custom-behaviors"></a>
## 🎨 Custom Agent Behaviors

### カエデ with Custom Sub-Agent

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"miyabi-coder\": {\"description\": \"Miyabi specialist\", \"prompt\": \"You are Kaede, CodeGenAgent. Follow CLAUDE.md.\", \"tools\": [\"Read\", \"Edit\", \"Write\", \"Bash\", \"Grep\", \"Skill\"], \"model\": \"sonnet\"}}'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### サクラ with JSON Output

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'Issue #270のレビュー結果は？' --output-format json > /tmp/sakura-review.json" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### ツバキ with Context Injection

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --append-system-prompt 'Miyabi PR規約: Conventional Commits準拠、57ラベル体系使用'" && sleep 0.1 && tmux send-keys -t %3 Enter
```

---

## 📚 Related Documentation

- **Comprehensive Guide**: `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`
- **Advanced Techniques**: `.claude/TMUX_ADVANCED_TECHNIQUES.md`
- **Command Reference**: `docs/CLAUDE_CODE_COMMANDS.md`
- **Visual Guide**: `docs/VISUAL_GUIDE.md`
- **Full Index**: `.claude/TMUX_INTEGRATION_INDEX.md`

---

## 💡 Tips

1. **Always use the basic style**: `tmux send-keys -t %N "cd '/path' && [instruction]" && sleep 0.1 && tmux send-keys -t %N Enter`
2. **Double quotes required**: Single quotes won't work in Claude Code interactive mode
3. **Include `cd` command**: Ensures agents work in correct directory
4. **Add `sleep 0.1`**: Critical for proper command execution
5. **Clear context regularly**: Use `/clear` after major tasks to manage tokens
6. **Monitor with Dashboard**: `./scripts/miyabi-dashboard.sh` for overall status
7. **Use grep for filtering**: `tmux capture-pane -t %2 -p | grep "pattern"` to find specific messages
8. **Test agents first**: Send simple "準備OK" messages before complex tasks

---

**🎭 Miyabi Orchestra - Agent Control Quick Reference**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Location**: `/Users/shunsuke/Dev/miyabi-private/.claude/agents/tmux_agents_control.md`