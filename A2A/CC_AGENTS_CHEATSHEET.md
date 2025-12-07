# 🚀 Claude Code --agents Quick Reference

## 基本構文

```bash
claude --dangerously-skip-permissions --agents '<JSON>' "<task>"
```

## Agent JSON フォーマット

```json
{
  "agent_name": {
    "description": "What this agent does",
    "prompt": "System prompt for the agent"
  }
}
```

## 使用例

### 単一Agent
```bash
claude --dangerously-skip-permissions \
  --agents '{"kaede":{"description":"CodeGen","prompt":"Write clean code"}}' \
  "Create a REST API"
```

### 複数Agent
```bash
claude --dangerously-skip-permissions \
  --agents '{
    "shikiroon":{"description":"Conductor","prompt":"Coordinate tasks"},
    "kaede":{"description":"CodeGen","prompt":"Implement features"},
    "sakura":{"description":"Review","prompt":"Review code quality"}
  }' \
  "Implement feature. @shikiroon coordinates, @kaede implements, @sakura reviews"
```

### JSONファイルから
```bash
claude --dangerously-skip-permissions \
  --agents "$(cat miyabi_agents.json)" \
  "Complete the task using all agents"
```

## Agent 呼び出し

タスク内で `@agent_name` を使用:

```bash
claude --agents '...' \
  "@shikiroon: Break down the task
   @kaede: Implement the solution
   @sakura: Review the code"
```

## Miyabi Agents

| Agent | 役割 | Pane |
|-------|------|------|
| `shikiroon` | Conductor | %18 |
| `kaede` | CodeGen | %19 |
| `sakura` | Review | %20 |
| `tsubaki` | PR | %21 |
| `botan` | Deploy | %22 |
| `mitsukeroon` | Issue | %23 |

## A2A 統合

```bash
claude --dangerously-skip-permissions \
  --agents '{"kaede":{"description":"CodeGen","prompt":"Report to %18"}}' \
  "Complete task and report using:
   tmux send-keys -t %18 '[カエデ] 完了: Done' && sleep 0.5 && tmux send-keys -t %18 Enter"
```

## Codex モード

```bash
codex -s danger-full-access "Task with full autonomy"
```

## Tips

1. **Agent名に `@` をつけて呼び出し**
2. **PUSH通信**: Worker → Conductor
3. **レポート形式**: `[Agent名] Status: Detail`
4. **P0.2準拠**: `sleep 0.5` 必須
