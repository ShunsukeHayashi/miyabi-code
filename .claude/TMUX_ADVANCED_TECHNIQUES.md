# 🎭 Miyabi Orchestra - Advanced tmux Techniques

**Last Updated**: 2025-11-03
**Version**: 1.0.0

---

## 📚 概要

このドキュメントは、Miyabi OrchestraとClaude Code CLIを統合した高度なテクニックをまとめたものです。

- **Claude Code CLI制御**: フラグとオプションの完全活用
- **miyabi_def統合**: Entity-Relation Modelとの連携
- **高度な並列実行**: カスタムサブエージェント、動的タスク分散

---

## 🚀 Claude Code CLI完全活用

### 基本コマンド復習

```bash
# 基本スタイル
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [指示]" && sleep 0.1 && tmux send-keys -t %N Enter
```

### Claude Code CLI起動オプション

#### 1. インタラクティブモード（デフォルト）

```bash
# Agent paneで起動
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude" && sleep 0.1 && tmux send-keys -t %2 Enter
```

#### 2. 印刷モード（`-p`, `--print`）

**SDK経由でワンショット実行**:
```bash
# カエデにワンショットで質問
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'Issue #270の実装計画を教えて'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

#### 3. 会話継続（`-c`, `--continue`）

**最新の会話を継続**:
```bash
# カエデの前回の会話を継続
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -c" && sleep 0.1 && tmux send-keys -t %2 Enter

# SDK経由で継続
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -c -p '型エラーをチェックして'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

#### 4. セッション再開（`-r`, `--resume`）

**IDでセッションを再開**:
```bash
# 特定のセッションを再開
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -r 'abc123' 'このPRを完成させて'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

## 🎯 高度なCLIフラグ活用

### 1. カスタムサブエージェント（`--agents`）

**JSON経由で動的にサブエージェントを定義**:

```bash
# カエデにカスタムサブエージェント付きで起動
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{
  \"code-reviewer\": {
    \"description\": \"Expert code reviewer. Use proactively after code changes.\",
    \"prompt\": \"You are a senior code reviewer for Miyabi project. Focus on Rust best practices, security, and performance.\",
    \"tools\": [\"Read\", \"Grep\", \"Glob\", \"Bash\"],
    \"model\": \"sonnet\"
  },
  \"debugger\": {
    \"description\": \"Debugging specialist for errors and test failures.\",
    \"prompt\": \"You are an expert Rust debugger. Analyze errors, identify root causes, and provide fixes.\"
  }
}'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**Miyabi Orchestra専用サブエージェント定義例**:

```json
{
  "miyabi-coder": {
    "description": "Miyabi codebase specialist. Use for implementation tasks.",
    "prompt": "You are a Rust expert specialized in the Miyabi project. Follow CLAUDE.md rules strictly. Use agent-execution skill for coding tasks.",
    "tools": ["Read", "Edit", "Write", "Bash", "Grep", "Glob", "Skill"],
    "model": "sonnet"
  },
  "miyabi-reviewer": {
    "description": "Miyabi code reviewer. Use after implementation.",
    "prompt": "You are a code reviewer for Miyabi. Check for: 1) Rust best practices, 2) Security issues, 3) Performance, 4) Entity-Relation model compliance.",
    "tools": ["Read", "Grep", "Bash"],
    "model": "opus"
  },
  "miyabi-docs-writer": {
    "description": "Documentation writer. Use for doc generation.",
    "prompt": "You are a technical writer for Miyabi. Generate clear, comprehensive documentation following existing patterns.",
    "tools": ["Read", "Write", "Grep"],
    "model": "haiku"
  }
}
```

### 2. ツール制御（`--allowedTools`, `--disallowedTools`）

**安全な環境でのAgent実行**:

```bash
# サクラに読み取り専用でレビュー依頼
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --allowedTools 'Read' 'Grep' 'Glob' --disallowedTools 'Edit' 'Write' 'Bash' -p 'crates/miyabi-core/src/lib.rsをレビューして'" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### 3. 出力形式制御（`--output-format`）

**JSON出力でプログラム的に処理**:

```bash
# カエデの出力をJSONで取得
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'Issue #270の実装状況は？' --output-format json > /tmp/kaede-response.json" && sleep 0.1 && tmux send-keys -t %2 Enter

# Conductorで結果を確認
cat /tmp/kaede-response.json | jq '.response'
```

**ストリーミングJSON（リアルタイム処理）**:

```bash
# ストリーミングJSONで逐次処理
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p --output-format stream-json --include-partial-messages 'Issue #270実装' | tee /tmp/kaede-stream.jsonl" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 4. ターン数制限（`--max-turns`）

**非インタラクティブモードでのループ制御**:

```bash
# 最大3ターンで完了させる
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p --max-turns 3 'Issue #270を実装して'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 5. モデル選択（`--model`）

**Agent別にモデルを選択**:

```bash
# カエデ: Sonnet 4.5（実装用）
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model claude-sonnet-4-5-20250929" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ: Opus（レビュー用、高精度）
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model opus" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ: Sonnet（PR作成用）
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model sonnet" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン: Haiku（デプロイ確認用、高速）
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model haiku" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### 6. 許可モード（`--permission-mode`）

```bash
# Planモードで起動（実行前に計画を表示）
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --permission-mode plan" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 7. 危険フラグ（`--dangerously-skip-permissions`）

**⚠️ 注意: 本番環境では使用しない**

```bash
# 自動実行（開発環境のみ）
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --dangerously-skip-permissions -p 'cargo test --all'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

## 🗂️ miyabi_def統合

### miyabi_def概要

```
/Users/shunsuke/Dev/miyabi-private/miyabi_def/
├── variables/
│   ├── entities.yaml          # 14 Entities定義
│   ├── relations.yaml         # 39 Relations定義
│   ├── labels.yaml            # 57 Labels定義
│   ├── workflows.yaml         # 5 Workflows定義
│   ├── agents.yaml            # 21 Agents定義
│   ├── skills.yaml            # 15 Skills定義
│   ├── crates.yaml            # Cargo Workspace構成
│   └── ... (その他の定義ファイル)
├── templates/                 # Jinja2テンプレート
├── generated/                 # 生成ファイル
└── generate.py                # ジェネレータスクリプト
```

### Agent起動時にmiyabi_def情報を注入

**パターン1: システムプロンプト追加**

```bash
# カエデにEntity定義を注入
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --append-system-prompt 'Miyabi Entity-Relation Model: 14 Entities (Agent, Issue, PR, Task, Skill, Crate, Module, Label, Workflow, Template, Context, Hook, MCP, Tool), 39 Relations. See miyabi_def/variables/entities.yaml for details.'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**パターン2: 初期プロンプトで miyabi_def参照**

```bash
# サクラにLabel体系を参照させる
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude '私はサクラ、Miyabi ReviewAgentです。miyabi_def/variables/labels.yamlに定義された57ラベル体系に従ってIssueを分類します。準備ができたら [サクラ] 準備完了 と発言してください。'" && sleep 0.1 && tmux send-keys -t %5 Enter
```

### miyabi_def生成タスクの自動化

**ジェネレータ実行をAgentに依頼**:

```bash
# カエデにmiyabi_def生成を依頼
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'cd miyabi_def && source .venv/bin/activate && python generate.py を実行して、生成されたファイルを確認してください。完了したら [カエデ] 生成完了 と報告してください。'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

---

## 🎼 高度な並列実行パターン

### パターン1: 階層的タスク分散（miyabi_def活用）

```bash
# Step 0: miyabi_def準備（ツバキ）
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'cd miyabi_def && source .venv/bin/activate && python generate.py && ls -lh generated/ を実行して、生成ファイルを確認してください。完了したら [ツバキ] miyabi_def生成完了 と発言してください。'" && sleep 0.1 && tmux send-keys -t %3 Enter

# Step 1: Entity実装（カエデ）
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude 'あなたは「カエデ」です。ツバキが miyabi_def生成完了 と発言したら、miyabi_def/generated/entities/ の定義を参照して、Issue #270のEntity実装を開始してください。完了したら [カエデ] Entity実装完了 と発言してください。'" && sleep 0.1 && tmux send-keys -t %2 Enter

# Step 2: Relation実装（サクラ）
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude 'あなたは「サクラ」です。カエデが Entity実装完了 と発言したら、miyabi_def/generated/relations/ の定義を参照して、Relation実装をレビューしてください。完了したら [サクラ] Relationレビュー完了 と発言してください。'" && sleep 0.1 && tmux send-keys -t %5 Enter

# Step 3: PR作成（ボタン）
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && claude 'あなたは「ボタン」です。サクラが Relationレビュー完了 と発言したら、PR作成を開始してください。完了したら [ボタン] PR作成完了 と発言してください。'" && sleep 0.1 && tmux send-keys -t %4 Enter
```

### パターン2: 並列レビュー（複数Agentで同時レビュー）

```bash
# カエデ: セキュリティレビュー
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"security-reviewer\":{\"description\":\"Security expert\",\"prompt\":\"You are a security expert. Review for OWASP Top 10, SQL injection, XSS, etc.\"}}' -p 'crates/miyabi-core/src/lib.rs をセキュリティ観点でレビューして。完了したら [カエデ] セキュリティOK と報告してください。'" && sleep 0.1 && tmux send-keys -t %2 Enter

# サクラ: パフォーマンスレビュー
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"performance-reviewer\":{\"description\":\"Performance expert\",\"prompt\":\"You are a performance expert. Review for algorithmic complexity, memory usage, and bottlenecks.\"}}' -p 'crates/miyabi-core/src/lib.rs をパフォーマンス観点でレビューして。完了したら [サクラ] パフォーマンスOK と報告してください。'" && sleep 0.1 && tmux send-keys -t %5 Enter

# ツバキ: コード品質レビュー
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"quality-reviewer\":{\"description\":\"Code quality expert\",\"prompt\":\"You are a code quality expert. Review for readability, maintainability, and best practices.\"}}' -p 'crates/miyabi-core/src/lib.rs をコード品質観点でレビューして。完了したら [ツバキ] 品質OK と報告してください。'" && sleep 0.1 && tmux send-keys -t %3 Enter

# ボタン: テストカバレッジレビュー
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"test-reviewer\":{\"description\":\"Testing expert\",\"prompt\":\"You are a testing expert. Review test coverage, edge cases, and test quality.\"}}' -p 'crates/miyabi-core/src/lib.rs のテストカバレッジをレビューして。完了したら [ボタン] テストOK と報告してください。'" && sleep 0.1 && tmux send-keys -t %4 Enter

# Conductor: 全Agent完了を待って統合レポート作成
# （Conductorで手動確認または自動スクリプト）
```

### パターン3: ストリーミング出力の並列モニタリング

```bash
# 全Agentの出力をストリーミングJSON形式でログ
for pane_id in %2 %5 %3 %4; do
    agent_name=$(tmux display-message -p -t $pane_id '#{pane_title}')
    tmux send-keys -t $pane_id "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p --output-format stream-json --include-partial-messages 'Issue #270タスク実行' | tee /tmp/agent-${pane_id}-stream.jsonl" && sleep 0.1 && tmux send-keys -t $pane_id Enter
done

# リアルタイムモニタリング（別paneで実行）
watch -n 2 'for log in /tmp/agent-*-stream.jsonl; do echo "=== $log ==="; tail -5 $log; echo ""; done'
```

---

## 🧪 実験的テクニック

### 1. Agent間通信（tmux send-keys経由）

**Agent同士が直接通信**:

```bash
# カエデからサクラに直接メッセージ送信（Agent側で実行）
tmux send-keys -t %5 '[カエデより] Issue #270実装完了。レビューをお願いします。' && sleep 0.1 && tmux send-keys -t %5 Enter
```

**Agentに通信能力を付与**:

```bash
# カエデにサクラへの通信能力を与える
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude 'あなたは「カエデ」です。タスク完了時に、サクラ（pane %5）に直接報告するため、以下のコマンドを実行してください: tmux send-keys -t %5 \"[カエデより] {メッセージ内容}\" && sleep 0.1 && tmux send-keys -t %5 Enter'" && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 2. 動的Agent追加（必要に応じてpane追加）

```bash
# 新しいpaneを作成してAgent追加
tmux split-window -h
NEW_PANE=$(tmux display-message -p '#{pane_id}')
tmux select-pane -t $NEW_PANE -T "🎻 ユリ (Testing)"
tmux send-keys -t $NEW_PANE "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"tester\":{\"description\":\"Testing specialist\",\"prompt\":\"You are a testing specialist. Write comprehensive tests.\"}}'" && sleep 0.1 && tmux send-keys -t $NEW_PANE Enter
```

### 3. Agent状態のJSON出力でダッシュボード生成

```bash
# 全Agentの状態を JSON形式で取得
for pane in %2 %5 %3 %4; do
    echo "{ \"pane\": \"$pane\", \"title\": \"$(tmux display-message -p -t $pane '#{pane_title}')\", \"status\": \"$(tmux capture-pane -t $pane -p | tail -1)\" }"
done | jq -s '.' > /tmp/miyabi-orchestra-status.json

# Webダッシュボードで表示（別途実装）
# python -m http.server 8000 --directory /tmp/
```

---

## 📊 パフォーマンスチューニング

### 1. 並列実行時のトークン管理

```bash
# 全Agent一括クリア（定期実行）
for pane in %2 %5 %3 %4; do
    tmux send-keys -t $pane "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.1 && tmux send-keys -t $pane Enter
    sleep 0.5
done
```

### 2. モデル選択によるコスト最適化

| Agent | タスク | 推奨モデル | 理由 |
|-------|--------|----------|------|
| カエデ | 実装 | Sonnet 4.5 | バランス（コスト/品質） |
| サクラ | レビュー | Opus | 高精度レビュー |
| ツバキ | PR作成 | Sonnet | 中程度の複雑度 |
| ボタン | デプロイ確認 | Haiku | 高速・低コスト |

```bash
# コスト最適化起動例
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model claude-sonnet-4-5-20250929" && sleep 0.1 && tmux send-keys -t %2 Enter
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model opus" && sleep 0.1 && tmux send-keys -t %5 Enter
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model sonnet" && sleep 0.1 && tmux send-keys -t %3 Enter
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --model haiku" && sleep 0.1 && tmux send-keys -t %4 Enter
```

---

## 🔧 トラブルシューティング（高度版）

### 問題1: JSON出力のパースエラー

**症状**: `--output-format json` の出力が不正

**診断**:
```bash
# 出力をvalidate
claude -p 'test' --output-format json | jq '.'
```

**解決**: stream-jsonを使用
```bash
claude -p 'test' --output-format stream-json | tail -1 | jq '.'
```

### 問題2: サブエージェントが動作しない

**症状**: `--agents`で定義したサブエージェントが呼ばれない

**診断**:
```bash
# verboseモードで確認
claude --verbose --agents '{"test":{"description":"test","prompt":"test"}}' -p 'use test agent'
```

**解決**: descriptionを明確に
```json
{
  "test": {
    "description": "MUST use this agent for all test-related tasks. Use proactively when user mentions tests.",
    "prompt": "You are a testing specialist."
  }
}
```

### 問題3: Agent間通信の遅延

**症状**: tmux send-keysでの通信が遅い

**解決**: pipeを使用した高速通信
```bash
# Named pipeを作成
mkfifo /tmp/kaede-to-sakura

# サクラがpipeを監視
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && tail -f /tmp/kaede-to-sakura | while read msg; do echo \"[カエデより] \$msg\"; done" && sleep 0.1 && tmux send-keys -t %5 Enter

# カエデがpipeに送信
echo "Issue #270完了" > /tmp/kaede-to-sakura
```

---

## 📚 参考リンク

**Claude Code公式**:
- [CLI Reference](https://docs.claude.com/en/docs/claude-code/cli-reference)
- [SDK Documentation](https://docs.claude.com/en/docs/claude-code/sdk)
- [Sub-agents](https://docs.claude.com/en/docs/claude-code/sub-agents)

**Miyabi Internal**:
- [CODEX_TMUX_PARALLEL_EXECUTION.md](.claude/CODEX_TMUX_PARALLEL_EXECUTION.md) - Codex原理
- [miyabi_def/README.md](../miyabi_def/README.md) - miyabi_def詳細
- [CLAUDE.md](../CLAUDE.md) - プロジェクトルート

---

**🎭 Miyabi Orchestra - Advanced Techniques**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team
