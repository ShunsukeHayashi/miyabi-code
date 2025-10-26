# Miyabi × Claude Code Headless Scripts

**作成日**: 2025-10-26
**バージョン**: 1.0.0

Miyabi プロジェクトで Claude Code Headless Mode を活用するためのスクリプト集です。

---

## 📁 スクリプト一覧

| スクリプト | 用途 | モード |
|-----------|------|--------|
| `01-process-issue.sh` | Issue 自動分析 | Headless |
| `02-parallel-agent.sh` | 並列 Agent 実行 | Headless (並列) |
| `03-hybrid-workflow.sh` | ハイブリッドワークフロー | Interactive → Headless |

---

## 🚀 使い方

### 基本的な使用方法

#### 1. Issue 自動分析（Headless Mode）

```bash
# 単一 Issue を分析
./01-process-issue.sh 270

# 実行結果
# - /tmp/miyabi-headless/analysis-270.json （詳細ログ）
# - /tmp/miyabi-headless/report-270.md （レポート）
```

#### 2. 並列 Issue 処理

```bash
# 複数 Issue を並列処理
./02-parallel-agent.sh 270 271 272

# 3つの Issue が同時に Headless Mode で処理される
```

#### 3. ハイブリッドワークフロー

```bash
# Interactive で確認 → Headless で自動実装
./03-hybrid-workflow.sh 270

# フロー:
# 1. Claude Code (Interactive) で Issue 確認
# 2. ユーザー承認
# 3. Headless Mode で自動実装
# 4. Claude Code (Interactive) に結果報告
```

---

## 📋 必要な環境

### 必須

- **Claude Code CLI**: `claude` コマンドがインストール済み
- **GitHub CLI**: `gh` コマンドがインストール済み
- **ANTHROPIC_API_KEY**: 環境変数に設定

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### オプション

- **VS Code**: Interactive Mode 統合用
- **VOICEVOX**: 音声通知用
- **Stream Deck**: ボタン操作用

---

## 🎯 使用例

### 例1: Issue の自動トリアージ

```bash
# Issue をトリアージして優先度を判定
./01-process-issue.sh 270

# レポート確認
cat /tmp/miyabi-headless/report-270.md
```

**出力例**:
```markdown
# Issue #270 分析レポート

**Issue**: Memory leak in logger.rs
**実行時間**: 2500ms
**コスト**: $0.003

## 分析結果

### 優先度
High - メモリリークは重大な問題

### 必要な変更
1. logger.rs の WorkerGuard 管理を修正
2. OnceCell を使用して lifetime 管理を改善
3. mem::forget を削除

### 実装計画
1. once_cell クレートを追加
2. LOGGER_GUARD 静的変数を定義
3. テスト実行
```

### 例2: 複数 Issue の一括処理

```bash
# 朝一番で全 Issue を分析
./02-parallel-agent.sh $(gh issue list --label bug --limit 5 --json number -q '.[].number')

# レポート一覧を確認
ls -l /tmp/miyabi-headless/report-*.md
```

### 例3: Stream Deck との連携

**Stream Deck ボタン設定**:
```
Action: System → Open
Path: /Users/shunsuke/Dev/miyabi-private/tools/claude-headless/03-hybrid-workflow.sh
Arguments: 270
```

ボタンを押すと：
1. Claude Code で Issue 表示
2. ユーザーが確認
3. Headless で自動実装
4. 結果を Claude Code に通知

---

## 📊 出力形式

### JSON出力（01-process-issue.sh）

```json
{
  "type": "result",
  "subtype": "success",
  "total_cost_usd": 0.003,
  "is_error": false,
  "duration_ms": 2500,
  "num_turns": 3,
  "result": "Issue分析結果...",
  "session_id": "abc123"
}
```

### Markdown レポート

```markdown
# Issue #270 分析レポート

**Issue**: タイトル
**分析日時**: 2025-10-26 12:00:00
**実行モード**: Headless (自動)
**実行時間**: 2500ms
**コスト**: $0.003

---

## 分析結果

詳細な分析内容...

---

## メタデータ

- Issue番号: #270
- 分析ログ: `/tmp/miyabi-headless/analysis-270.json`
```

---

## 🔧 カスタマイズ

### プロンプトのカスタマイズ

`01-process-issue.sh` の `PROMPT` 変数を編集：

```bash
PROMPT="Analyze GitHub Issue #${ISSUE_NUM}:

Custom Instructions:
1. ...
2. ...
"
```

### Agent プロンプトの適用

```bash
# Coordinator Agent のプロンプトを使用
claude -p "$PROMPT" \
  --append-system-prompt "$(cat .claude/agents/prompts/coding/coordinator.md)" \
  --output-format json
```

### 許可ツールの変更

```bash
# より多くのツールを許可
claude -p "$PROMPT" \
  --allowedTools "Read,Write,Edit,Grep,Glob,Bash" \
  --output-format json
```

---

## 🚨 トラブルシューティング

### エラー: `claude: command not found`

```bash
# Claude Code CLI をインストール
npm install -g @anthropic-ai/claude-code

# または
brew install claude-code
```

### エラー: `ANTHROPIC_API_KEY not set`

```bash
# API キーを設定
export ANTHROPIC_API_KEY="sk-ant-..."

# または .bashrc/.zshrc に追加
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc
```

### エラー: `Issue #270 not found`

```bash
# GitHub CLI でログイン
gh auth login

# リポジトリを確認
gh repo set-default
```

### デバッグモード

```bash
# 詳細ログを有効化
bash -x ./01-process-issue.sh 270

# または
set -x
./01-process-issue.sh 270
```

---

## 📈 パフォーマンス

### 実行時間の目安

| タスク | 実行時間 | コスト |
|-------|---------|--------|
| 単一 Issue 分析 | 2-5秒 | $0.002-0.005 |
| 並列 3 Issue | 3-7秒 | $0.006-0.015 |
| ハイブリッドワークフロー | 5-10秒 | $0.005-0.010 |

### 並列実行のスケーリング

```bash
# 10 Issue を並列処理
./02-parallel-agent.sh {270..279}

# 実行時間: 単一実行の約 1.2 倍（並列効果）
# コスト: 単一実行の 10 倍
```

---

## 🔗 関連ドキュメント

- [Claude Code Headless Mode 統合戦略](../../docs/CLAUDE_CODE_INTEGRATION_STRATEGY.md)
- [Stream Deck セットアップ](../stream-deck/NO_ARGUMENTS_SETUP.md)
- [Miyabi Agent 仕様](../../.claude/agents/AGENT_CHARACTERS.md)

---

## 📝 ベストプラクティス

1. **コスト管理**: 大量実行前に `--dry-run` オプションを検討
2. **レート制限**: 並列実行は 3-5 プロセスまでに制限
3. **ログ保存**: `/tmp` は再起動で消えるため、重要なログは別途保存
4. **エラーハンドリング**: スクリプトは `set -e` でエラー時に停止

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Claude Code Headless Mode で Miyabi を加速！** 🚀
