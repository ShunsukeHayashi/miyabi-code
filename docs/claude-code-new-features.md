# Claude Code 最新機能 - YouTube Live デモ用

## 🆕 新しいCLIフラグ

### 1. `--agent` - メインエージェント指定
```bash
# カスタムエージェントをセッションのメインとして使用
claude --agent my-custom-agent
```

### 2. `--agents` - サブエージェントをJSON定義
```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer. Focus on code quality, security, and best practices.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  },
  "debugger": {
    "description": "Debugging specialist for errors and test failures.",
    "prompt": "You are an expert debugger. Analyze errors, identify root causes, and provide fixes."
  }
}'
```

### 3. `--append-system-prompt` - 既存機能を保持しつつ指示追加
```bash
claude --append-system-prompt "Always use TypeScript and include JSDoc comments"
```

### 4. `--system-prompt` - システムプロンプト完全置換
```bash
claude --system-prompt "You are a Python expert who only writes type-annotated code"
```

---

## 📋 エージェント定義フォーマット

```json
{
  "agent-name": {
    "description": "When this agent should be invoked (必須)",
    "prompt": "System prompt for the agent (必須)",
    "tools": ["Read", "Edit", "Bash"],  // オプション
    "model": "sonnet"  // sonnet, opus, haiku
  }
}
```

---

## 🎬 YouTube Live デモコマンド

### Step 1: 基本的なエージェント起動
```bash
claude --append-system-prompt "You are a Rust expert. Follow Miyabi conventions."
```

### Step 2: サブエージェント付きで起動
```bash
claude --agents '{
  "reviewer": {
    "description": "Code review specialist",
    "prompt": "Review Rust code for safety and performance",
    "tools": ["Read", "Grep"]
  }
}'
```

### Step 3: フルオーケストレーション
```bash
# Conductorとして起動（他エージェントを統括）
claude --agent shikiroon --agents '{...}' \
  --append-system-prompt "Conductor panes: CodeGen=%1, Review=%4"
```

---

## 🔑 ポイント

1. **`--agent`**: `.claude/agents/` のカスタムエージェントを指定
2. **`--agents`**: コマンドラインでサブエージェントを動的に定義
3. **`--append-system-prompt`**: デフォルト機能を維持しつつカスタマイズ
4. **自動委譲**: Claudeがタスクに応じて適切なサブエージェントを自動選択

---

## 📁 エージェントファイルの配置

```
~/.claude/agents/          # ユーザースコープ（全プロジェクト共通）
.claude/agents/            # プロジェクトスコープ（優先される）
```

### エージェントファイル例 (.claude/agents/shikiroon.md)
```markdown
---
name: shikiroon
description: Conductor agent for task orchestration
tools: Read, Grep, Glob, Bash
model: opus
---

You are しきるん (Shikiroon), the Conductor agent.

## Responsibilities
- Receive tasks and break into subtasks
- Assign to worker agents
- Monitor progress
- Aggregate results

## Communication Protocol
- PUSH pattern only
- Workers report to Conductor
```

---

*Claude Code v1.0.60+ で利用可能*
