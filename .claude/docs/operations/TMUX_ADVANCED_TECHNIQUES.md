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

## 🎯 W1-W5完全自動化ワークフロー実践例

**🎭 Miyabi Orchestra v2.0完全自動化達成**: 6 Agents配置、100%カバレッジ

このセクションでは、みつけるん（W1）→ しきるん（W2）→ カエデ（W3）→ サクラ（W4）→ ツバキ（W3）→ ボタン（W5）の完全自動化フローの実践例を紹介します。

---

### Example 1: Issue作成から本番デプロイまで完全自動処理

**目標**: Issue作成からデプロイまで完全自動化（手動介入0ステップ）

#### Step 0: Issue作成（手動 - 唯一の人間操作）

```bash
gh issue create \
  --title "Feature: ユーザー認証機能実装" \
  --body "JWTベースの認証機能を実装する。ログイン・ログアウト・トークン更新を含む。"
```

**結果**: Issue #350が作成される

---

#### Step 1: W1 - Issue Triage（みつけるん）

**自動実行**:
```bash
# Water Spiderが新しいIssueを検知して、みつけるんに自動割り当て
# または手動で起動:
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。issue-analysisスキルを使用してIssue #350のトリアージを行ってください。適切なLabel (57-label system) を推定し、優先度を設定し、state:pendingを付与してください。完了したら [みつけるん] トリアージ完了 Issue #350 と発言してください。" && sleep 0.1 && tmux send-keys -t %10 Enter
```

**みつけるんの処理**:
1. Issue #350を読み込み
2. キーワード分析：「認証」「JWT」「ログイン」
3. Label推定：
   - `type:feature`（新機能）
   - `priority:high`（認証は高優先度）
   - `area:security`（セキュリティ関連）
   - `skill:rust-development`（Rust実装必要）
4. 優先度設定：High
5. `state:pending`付与
6. GitHub comment投稿：トリアージ結果サマリー

**出力例**:
```
[みつけるん] トリアージ完了 Issue #350
  - Label: type:feature, priority:high, area:security, skill:rust-development
  - 優先度: High
  - 推定工数: 3-5時間
  - state: pending
```

**推定時間**: 30-60秒

---

#### Step 2: W2 - Task Decomposition（しきるん）

**自動起動**: Water Spiderが「トリアージ完了」を検知し、しきるんを自動起動

```bash
# Water Spiderによる自動中継（R0ルール）
# しきるんに自動送信されるメッセージ:
# "みつけるんがIssue #350トリアージを完了しました。タスク分解を開始してください。"
```

**しきるんの処理**:
1. Issue #350の内容を詳細分析
2. タスク配列に分解:
   ```
   Task 1: JWTライブラリ選定・設定
   Task 2: 認証ミドルウェア実装
   Task 3: ログインエンドポイント実装
   Task 4: トークン更新エンドポイント実装
   Task 5: 単体テスト作成
   Task 6: 統合テスト作成
   ```
3. DAG構築（依存関係グラフ）:
   ```
   Task 1（ライブラリ選定）
      ↓
   Task 2（ミドルウェア）→ Task 3（ログイン）→ Task 5（単体テスト）
      ↓                       ↓
   Task 4（トークン更新）→ Task 6（統合テスト）
   ```
4. Agent割り当て:
   - Task 1-4, 5-6: カエデ（CodeGenAgent）
   - Review: サクラ（ReviewAgent）
   - PR: ツバキ（PRAgent）
   - Deploy: ボタン（DeploymentAgent）
5. 推定時間算出: 3.5時間
6. GitHub comment投稿: 計画全体

**出力例**:
```
[しきるん] タスク分解完了
  - タスク数: 6個
  - DAG: 構築完了（3並列パス）
  - Agent割り当て: カエデ→サクラ→ツバキ→ボタン
  - 推定時間: 3.5時間
  - GitHub: 計画comment投稿完了
```

**推定時間**: 1-2分

---

#### Step 3: W3 - Code Implementation（カエデ）

**自動起動**: Water Spiderが「タスク分解完了」を検知し、カエデを自動起動

```bash
# Water Spiderによる自動中継（R00ルール）
```

**カエデの処理**:
1. しきるんの計画を読み込み
2. Git worktree作成:
   ```bash
   git worktree add /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-350 -b feature/issue-350
   cd /Users/shunsuke/Dev/miyabi-private/.worktrees/issue-350
   ```
3. Task 1実行: JWTライブラリ選定
   - `Cargo.toml`に`jsonwebtoken`追加
4. Task 2実行: 認証ミドルウェア実装
   - `src/middleware/auth.rs`作成
5. Task 3実行: ログインエンドポイント
   - `src/routes/auth.rs`にログイン実装
6. Task 4実行: トークン更新
   - リフレッシュトークン機能追加
7. Task 5-6実行: テスト作成
   - 単体テスト・統合テスト実装
8. 全てのテスト実行:
   ```bash
   cargo test --all
   ```
9. Git commit:
   ```bash
   git add .
   git commit -m "feat(auth): implement JWT authentication system

   - Add jsonwebtoken dependency
   - Implement auth middleware
   - Add login/logout endpoints
   - Add token refresh functionality
   - Add comprehensive tests

   Issue #350"
   ```

**出力例**:
```
[カエデ] 実装完了
  - ファイル数: 8個作成・変更
  - コード行数: +450行
  - テスト: 15個（全てPass）
  - Commit: feature/issue-350ブランチ
```

**推定時間**: 2-3時間

---

#### Step 4: W4 - Code Review（サクラ）

**自動起動**: Water Spiderが「実装完了」を検知し、サクラを自動起動

```bash
# Water Spiderによる自動中継（R1ルール）
```

**サクラの処理**:
1. 実装コードを全て読み込み
2. セキュリティ監査:
   - `security-audit`スキル実行
   - SQL injection, XSS, CSRF, Token漏洩チェック
3. コード品質チェック:
   - `cargo clippy -- -D warnings`実行
   - Rust best practices確認
4. パフォーマンスチェック:
   - `performance-analysis`スキル実行
   - 不要なクローン、非効率なループ検出
5. Entity-Relation Model準拠確認:
   - E1_Issue, E3_Agent, E12_Worktreeとの整合性
6. レビューレポート作成:
   ```yaml
   quality_score: 92/100
   security_issues: 0 critical, 1 minor
   performance_issues: 0
   best_practices: 8/10
   recommendations:
     - JWTシークレットを環境変数から読み込むべき（現在ハードコード）
   ```
7. GitHub comment投稿: レビュー結果

**出力例**:
```
[サクラ] レビュー完了
  - 品質スコア: 92/100
  - セキュリティ: 1個のMinor issue（シークレット管理）
  - パフォーマンス: 問題なし
  - 改善推奨: 1件
  - 総合判定: ✅ 承認（Minor issueは後で修正可能）
```

**推定時間**: 10-15分

---

#### Step 5: W3 - PR Creation（ツバキ）

**自動起動**: Water Spiderが「レビュー完了」を検知し、ツバキを自動起動

```bash
# Water Spiderによる自動中継（R3ルール）
```

**ツバキの処理**:
1. サクラのレビュー結果を読み込み
2. Minor issueを修正:
   - `src/config/mod.rs`にシークレット環境変数読み込み追加
3. Git commit（修正）:
   ```bash
   git commit -am "fix(auth): load JWT secret from environment variable

   Addresses security review feedback."
   ```
4. ブランチをpush:
   ```bash
   git push origin feature/issue-350
   ```
5. PR作成:
   ```bash
   gh pr create --title "feat: JWT authentication system (#350)" \
     --body "$(cat <<'EOF'
   ## Summary
   - Implemented JWT-based authentication
   - Added login/logout endpoints
   - Implemented token refresh functionality
   - All tests passing (15/15)
   - Security review: 92/100 (Minor issue fixed)

   ## Changes
   - `Cargo.toml`: Add jsonwebtoken dependency
   - `src/middleware/auth.rs`: Auth middleware
   - `src/routes/auth.rs`: Login/logout endpoints
   - `src/config/mod.rs`: JWT secret from env
   - `tests/`: 15 comprehensive tests

   ## Review
   - Security: ✅ (Minor issue addressed)
   - Performance: ✅
   - Code quality: 92/100

   Closes #350

   🤖 Generated by Miyabi Orchestra
   EOF
   )"
   ```

**出力例**:
```
[ツバキ] PR作成完了
  - PR番号: #351
  - ブランチ: feature/issue-350 → main
  - Commits: 2個
  - Files changed: 8個
  - CI/CD: ✅ Running
  - URL: https://github.com/owner/repo/pull/351
```

**推定時間**: 2-3分

---

#### Step 6: W5 - Deployment（ボタン）

**自動起動**: Water Spiderが「PR作成完了」を検知し、ボタンを自動起動

```bash
# Water Spiderによる自動中継（R5ルール）
```

**ボタンの処理**:
1. CI/CDステータス確認:
   ```bash
   gh pr view 351 --json statusCheckRollup
   ```
   - 全てのテスト: ✅ Pass
   - Linter: ✅ Pass
   - Security scan: ✅ Pass
2. PR自動マージ:
   ```bash
   gh pr merge 351 --auto --squash
   ```
3. 本番環境デプロイ:
   ```bash
   # Firebaseデプロイ
   firebase deploy --only functions:auth
   ```
4. デプロイ確認:
   - ヘルスチェック実行
   - ログ監視（最初の5分）
5. Issue自動クローズ:
   ```bash
   gh issue close 350 --comment "✅ デプロイ完了

   - PR: #351
   - Deployment: Success
   - Health check: ✅ Pass
   - 所要時間: 3.5時間（見積もり通り）

   🤖 Miyabi Orchestra v2.0 - Fully Automated"
   ```

**出力例**:
```
[ボタン] デプロイ完了
  - PR: #351マージ済み
  - Deployment: Production ✅
  - Health: All systems operational
  - Issue #350: Closed
  - Total time: 3.5時間（見積もり通り）
```

**推定時間**: 5-10分

---

### 📊 完全自動化フロー総括

| Step | Agent | Workflow | 推定時間 | 手動介入 |
|------|-------|----------|----------|----------|
| 0 | Human | - | 1分 | ✅ 必須 |
| 1 | みつけるん | W1 | 30-60秒 | ❌ なし |
| 2 | しきるん | W2 | 1-2分 | ❌ なし |
| 3 | カエデ | W3 | 2-3時間 | ❌ なし |
| 4 | サクラ | W4 | 10-15分 | ❌ なし |
| 5 | ツバキ | W3 | 2-3分 | ❌ なし |
| 6 | ボタン | W5 | 5-10分 | ❌ なし |
| **Total** | - | **W1-W5** | **3-3.5時間** | **1回のみ** |

**手動介入**: Issue作成のみ（ステップ0）
**自動化率**: 99% (6/7ステップ)
**人間の作業時間**: 1分
**システムの作業時間**: 3.5時間

---

### Example 2: バグ修正の緊急フロー

**シナリオ**: 本番環境で認証バグ発見 → 30分以内に修正デプロイ

#### 緊急Issue作成

```bash
gh issue create \
  --title "URGENT: JWT token expiration bug" \
  --body "Tokens expire after 5 minutes instead of 24 hours" \
  --label "priority:critical,type:bug"
```

#### W1-W5高速実行

```bash
# みつけるん: 緊急トリアージ（10秒）
# Label: priority:critical, type:bug, area:security
# 自動的に最優先でキューイング

# しきるん: 高速タスク分解（30秒）
# Task 1: バグ原因特定
# Task 2: 修正実装
# Task 3: テスト
# DAG: 1→2→3（直列、並列なし）

# カエデ: 緊急実装（10分）
# - `src/middleware/auth.rs`のTTL修正（5分→24時間）
# - テスト実行・確認
# - Commit

# サクラ: 緊急レビュー（2分）
# - 変更箇所のみレビュー（1ファイル、3行変更）
# - 承認

# ツバキ: 緊急PR作成（1分）
# - Hotfix PR作成
# - CI/CD: Fast track

# ボタン: 緊急デプロイ（5分）
# - PR即マージ
# - Hotfixデプロイ
# - 本番確認
```

**総時間**: 18-20分
**手動介入**: Issue作成のみ

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
