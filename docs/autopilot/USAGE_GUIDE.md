# Autopilot Codex - Usage Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Purpose**: Codex/Claude Code無人実行システムの使用ガイド

---

## 📋 概要

Autopilot Codexは、外部LLMが利用できない状況でも、Codex/Claude Codeが自律的にタスクを実行できるようにする無人実行システムです。

**主な機能:**
- ✅ Worktree isolation による安全な並列実行
- ✅ YAML形式の宣言的実行計画
- ✅ 構造化ログ・モニタリング
- ✅ セキュリティガードレール（シークレットマスク、環境変数制限）
- ✅ GitHub Issue自動通知
- ✅ 監査スクリプトによる実行検証

---

## 🚀 Quick Start

### 1. 前提条件

```bash
# yq (YAML processor)
brew install yq

# gh (GitHub CLI)
brew install gh
gh auth login
```

### 2. Autopilot Planファイル作成

Issue #646用のプランを作成：

```bash
# プランディレクトリ作成
mkdir -p .ai/plans/646

# サンプルスキーマをコピー
cp .ai/schemas/Autopilot.yaml .ai/plans/646/Autopilot.yaml

# プランを編集
vim .ai/plans/646/Autopilot.yaml
```

### 3. 実行

```bash
# Autopilot実行
./scripts/autopilot/run_codex.sh .ai/plans/646/Autopilot.yaml
```

### 4. 監査

```bash
# 最新実行の監査
./scripts/audit/codex_autopilot_check.sh

# 特定ログファイルの監査
./scripts/audit/codex_autopilot_check.sh .ai/logs/codex/autopilot/autopilot-2025-10-31T22-00-00.log
```

---

## 📝 Autopilot Plan作成ガイド

### 基本構造

```yaml
autopilot:
  version: "1.0.0"
  issue_number: 646
  title: "Your Task Title"

  execution:
    mode: "full-auto"        # full-auto | semi-auto | dry-run
    timeout: 3600            # 秒単位
    max_retries: 3
    abort_on_failure: true

  worktree:
    enabled: true
    branch_prefix: "autopilot/issue-"
    cleanup_on_success: true
    cleanup_on_failure: false

  security:
    mask_secrets: true
    allowed_env_vars:
      - "GITHUB_TOKEN"
      - "ANTHROPIC_API_KEY"

  steps:
    - id: "step-1"
      name: "ステップ名"
      type: "setup | codex_exec | test | format | git"
      commands:
        - "コマンド1"
        - "コマンド2"
      expectations:
        - type: "exit_code"
          value: 0
      on_failure: "abort | retry | continue | report"
```

### ステップタイプ別テンプレート

#### setup ステップ

環境構築やビルド：

```yaml
- id: "setup"
  name: "環境セットアップ"
  type: "setup"
  commands:
    - "cargo build --release"
    - "pnpm install"
  expectations:
    - type: "exit_code"
      value: 0
    - type: "file_exists"
      value: "target/release/miyabi"
  on_failure: "abort"
```

#### codex_exec ステップ

Codex/Claude Code実行：

```yaml
- id: "implement"
  name: "機能実装"
  type: "codex_exec"
  commands:
    - "codex exec --full-auto --prompt 'Implement WelcomeScreen component for miyabi-desktop'"
  expectations:
    - type: "file_exists"
      value: "miyabi-desktop/src/components/WelcomeScreen.tsx"
    - type: "contains"
      file: "miyabi-desktop/src/components/WelcomeScreen.tsx"
      value: "export default function WelcomeScreen"
  post_commands:
    - "pnpm typecheck"
    - "pnpm lint"
  on_failure: "retry"
```

#### test ステップ

テスト実行：

```yaml
- id: "test"
  name: "テスト実行"
  type: "test"
  commands:
    - "cargo test --all"
    - "pnpm test --run"
  expectations:
    - type: "exit_code"
      value: 0
    - type: "output_contains"
      value: "test result: ok"
  on_failure: "abort"
```

#### format ステップ

コード整形：

```yaml
- id: "format"
  name: "コード整形"
  type: "format"
  commands:
    - "cargo fmt"
    - "pnpm format"
  expectations:
    - type: "exit_code"
      value: 0
  on_failure: "continue"
```

#### git ステップ

Git操作とPR作成：

```yaml
- id: "create-pr"
  name: "PR作成"
  type: "git"
  commands:
    - "git add ."
    - "git commit -m 'feat: implement feature\n\nCloses #646'"
    - "git push -u origin HEAD"
    - "gh pr create --title 'feat: Feature Title' --body 'Closes #646'"
  expectations:
    - type: "exit_code"
      value: 0
  on_failure: "report"
```

---

## 🔍 期待値 (Expectations)

### exit_code - 終了コードチェック

```yaml
expectations:
  - type: "exit_code"
    value: 0  # 成功を期待
```

### file_exists - ファイル存在チェック

```yaml
expectations:
  - type: "file_exists"
    value: "path/to/file.tsx"
```

### contains - ファイル内容チェック

```yaml
expectations:
  - type: "contains"
    file: "src/main.rs"
    value: "fn main()"
```

### output_contains - 出力内容チェック

```yaml
expectations:
  - type: "output_contains"
    value: "test result: ok"
```

---

## 🛡️ セキュリティ

### シークレットマスキング

ログに出力されるシークレットは自動的にマスクされます：

```yaml
security:
  mask_secrets: true
```

### 環境変数制限

許可する環境変数を明示的に指定：

```yaml
security:
  allowed_env_vars:
    - "GITHUB_TOKEN"
    - "ANTHROPIC_API_KEY"
    - "DEVICE_IDENTIFIER"
```

### ネットワーク制限

LLMを使用しない場合はネットワークをブロック可能：

```yaml
security:
  block_network: true
```

---

## 📊 ログとモニタリング

### ログファイル構造

```
.ai/logs/codex/autopilot/
├── autopilot-2025-10-31T22-00-00.log    # 実行ログ
└── FAILED-2025-10-31T22-30-00.log       # 失敗ログ（失敗時のみ）

.ai/logs/autopilot/
├── summary-2025-10-31T22-00-00.md       # サマリー
└── status-2025-10-31T22-00-00.log       # ステータス
```

### ログレベル

```yaml
logging:
  level: "info"  # debug | info | warn | error
  format: "json"  # json | text
```

---

## 🔔 通知

### GitHub Issue通知

成功時：

```yaml
notifications:
  on_success:
    - type: "github_comment"
      template: |
        ## ✅ Autopilot実行完了
        **Duration**: {{duration}}
        🤖 Generated with Autopilot Codex
```

失敗時：

```yaml
notifications:
  on_failure:
    - type: "github_comment"
      template: |
        ## ❌ Autopilot実行失敗
        **Error**: {{error_message}}
    - type: "escalation"
      target: "TechLead"
```

### テンプレート変数

| 変数 | 説明 |
|------|------|
| `{{issue_number}}` | Issue番号 |
| `{{duration}}` | 実行時間（秒） |
| `{{completed_steps}}` | 完了ステップ数 |
| `{{total_steps}}` | 総ステップ数 |
| `{{failed_step}}` | 失敗したステップ |
| `{{error_message}}` | エラーメッセージ |
| `{{worktree_path}}` | Worktreeパス |
| `{{log_path}}` | ログファイルパス |

---

## ✅ 監査

### 監査スクリプト実行

```bash
# 最新実行の監査
./scripts/audit/codex_autopilot_check.sh

# 出力例：
# [AUDIT] Checking log file existence...
# [PASS] Log file exists: .ai/logs/codex/autopilot/autopilot-2025-10-31T22-00-00.log
# [AUDIT] Checking log completeness...
# [PASS] Found keyword: Autopilot Codex Runner
# [AUDIT] Checking worktree cleanup...
# [PASS] No autopilot worktrees found (clean)
# ✅ AUDIT PASSED
```

### 監査チェック項目

| チェック項目 | 説明 |
|-------------|------|
| Log Existence | ログファイルの存在確認 |
| Log Completeness | 必須キーワードの存在確認 |
| Worktree Cleanup | Worktreeが正しく削除されたか |
| Summary File | サマリーファイルの生成確認 |
| Security Issues | シークレット漏洩チェック |
| Exit Status | 実行成功/失敗の判定 |
| Log Size | ログサイズの妥当性確認 |

---

## 🐛 トラブルシューティング

### ステップが失敗する

**症状**: 特定のステップで失敗する

**解決策**:
1. ログを確認: `cat .ai/logs/codex/autopilot/autopilot-*.log`
2. Worktreeを確認: `cd .worktrees/autopilot-issue-646`
3. 手動でコマンドを実行して問題を特定
4. プランファイルを修正して再実行

### Worktreeが削除されない

**症状**: 失敗後もWorktreeが残る

**解決策**:

```bash
# 手動でWorktree削除
cd /Users/shunsuke/Dev/miyabi-private
git worktree remove .worktrees/autopilot-issue-646 --force

# または設定を変更
# cleanup_on_failure: true  # プランファイル内
```

### シークレットがログに出力される

**症状**: ログにトークンやAPIキーが含まれる

**解決策**:

```bash
# 監査スクリプトで検出
./scripts/audit/codex_autopilot_check.sh

# ログファイルを削除
rm .ai/logs/codex/autopilot/autopilot-*.log

# プランファイルで mask_secrets: true を確認
```

### yqがインストールされていない

**症状**: `yq: command not found`

**解決策**:

```bash
brew install yq
```

---

## 📚 参考ドキュメント

| ドキュメント | 説明 |
|------------|------|
| `docs/autopilot/AUTOPILOT_SCHEMA.md` | スキーマ仕様書 |
| `.ai/schemas/Autopilot.yaml` | サンプルスキーマ |
| `AGENTS.md` | Task Execution Protocol |
| `miyabi_def/variables/workflows.yaml` | Workflow定義 (W1-W5) |

---

## 🎯 ベストプラクティス

### 1. 小さく始める

最初は簡単なタスクから：

```yaml
steps:
  - id: "simple-test"
    name: "簡単なテスト"
    type: "test"
    commands:
      - "cargo test --package miyabi-core"
```

### 2. dry-runで検証

本番実行前に検証：

```yaml
execution:
  mode: "dry-run"  # 実際には実行しない
```

### 3. ログレベルをdebugに

デバッグ時は詳細ログを有効化：

```yaml
logging:
  level: "debug"
```

### 4. リトライ設定

不安定なステップにはリトライを設定：

```yaml
execution:
  max_retries: 3

steps:
  - id: "network-step"
    on_failure: "retry"
```

### 5. 段階的クリーンアップ

デバッグ中は失敗時もWorktreeを保持：

```yaml
worktree:
  cleanup_on_success: true
  cleanup_on_failure: false  # デバッグ用に保持
```

---

**Happy Autopiloting! 🚀**

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Maintainer**: Miyabi Team
