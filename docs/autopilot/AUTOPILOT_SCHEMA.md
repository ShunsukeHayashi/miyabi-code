# Autopilot Plan Schema Documentation

**Version**: 1.0.0
**Created**: 2025-10-31
**Purpose**: Codex/Claude Code無人実行プランの定義仕様

---

## 📋 概要

Autopilot Plan Schemaは、外部LLMが利用できない状況でも、Codex/Claude Codeが自律的にタスクを実行できるようにするためのYAML形式の実行計画定義です。

**参照元**: `miyabi_def/variables/workflows.yaml` (W1-W5 Workflow定義)

---

## 🏗️ スキーマ構造

### トップレベル

```yaml
autopilot:
  version: string           # スキーマバージョン (例: "1.0.0")
  issue_number: integer     # GitHub Issue番号
  title: string             # タイトル
  created_at: string        # ISO8601形式の作成日時
  execution: {...}          # 実行設定
  worktree: {...}           # Worktree設定
  security: {...}           # セキュリティ設定
  steps: [...]              # 実行ステップ配列
  logging: {...}            # ログ設定
  notifications: {...}      # 通知設定
  audit: {...}              # 監査設定
```

---

## ⚙️ セクション詳細

### 1. `execution` - 実行設定

実行モードとタイムアウトを定義します。

```yaml
execution:
  mode: "full-auto"         # full-auto | semi-auto | dry-run
  timeout: 3600             # 秒単位（デフォルト: 3600 = 1時間）
  max_retries: 3            # ステップ失敗時の最大リトライ回数
  abort_on_failure: true    # 失敗時に即座に中止するか
```

**mode値:**
- `full-auto`: 完全自動実行（承認なし）
- `semi-auto`: ステップ毎に確認
- `dry-run`: 実行せず検証のみ

---

### 2. `worktree` - Worktree設定

Git Worktreeの利用設定。並列実行の安全性を確保します。

```yaml
worktree:
  enabled: true                    # Worktree使用の有無
  branch_prefix: "autopilot/issue-" # ブランチ名プレフィックス
  cleanup_on_success: true         # 成功時にWorktree削除
  cleanup_on_failure: false        # 失敗時にWorktree保持（デバッグ用）
```

**参照**: `miyabi_def/variables/entities.yaml` - E12_Worktree定義

---

### 3. `security` - セキュリティ設定

セキュリティガードレール定義。

```yaml
security:
  mask_secrets: true               # ログ内のシークレットをマスク
  allowed_env_vars:                # 許可する環境変数リスト
    - "GITHUB_TOKEN"
    - "ANTHROPIC_API_KEY"
  block_network: false             # ネットワークアクセスをブロック
  sandbox_mode: false              # サンドボックスモード
```

**セキュリティ原則:**
- シークレットは常にマスク
- 必要最小限の環境変数のみ許可
- LLM不要の場合はネットワーク遮断

---

### 4. `steps` - 実行ステップ

実行するステップの配列。**miyabi_def/variables/workflows.yaml**のステージ構造を踏襲。

```yaml
steps:
  - id: "step-1"                   # ユニークID
    name: "環境セットアップ"        # ステップ名
    type: "setup"                  # ステップタイプ
    commands: [...]                # 実行コマンド配列
    expectations: [...]            # 期待値配列
    rollback: [...]                # ロールバックコマンド（オプション）
    post_commands: [...]           # 後処理コマンド（オプション）
    on_failure: "abort"            # 失敗時動作
```

#### ステップタイプ

| Type | 説明 | 例 |
|------|------|-----|
| `setup` | 環境セットアップ | `cargo build`, `pnpm install` |
| `codex_exec` | Codex実行 | `codex exec --full-auto` |
| `test` | テスト実行 | `cargo test`, `pnpm test` |
| `format` | コード整形 | `cargo fmt`, `pnpm format` |
| `git` | Git操作 | `git commit`, `gh pr create` |

#### 期待値 (expectations)

各ステップの成功条件を定義：

```yaml
expectations:
  # 終了コードチェック
  - type: "exit_code"
    value: 0

  # ファイル存在チェック
  - type: "file_exists"
    value: "target/release/miyabi"

  # ファイル内容チェック
  - type: "contains"
    file: "src/main.rs"
    value: "fn main()"

  # 出力内容チェック
  - type: "output_contains"
    value: "test result: ok"
```

#### 失敗時動作 (on_failure)

| Value | 動作 |
|-------|------|
| `abort` | 即座に実行中止 |
| `retry` | max_retries回までリトライ |
| `continue` | 次のステップへ継続 |
| `report` | エラー報告して継続 |

---

### 5. `logging` - ログ設定

実行ログの出力設定。

```yaml
logging:
  level: "info"                              # debug | info | warn | error
  output_dir: ".ai/logs/codex/autopilot"     # ログ出力ディレクトリ
  format: "json"                             # json | text
  capture_stdout: true                       # 標準出力キャプチャ
  capture_stderr: true                       # 標準エラーキャプチャ
```

**ログファイル構造:**
```
.ai/logs/codex/autopilot/
├── autopilot-2025-10-31T22-00-00.log       # 実行ログ
├── summary-2025-10-31T22-00-00.md          # サマリー
└── status-2025-10-31T22-00-00.log          # ステータス
```

---

### 6. `notifications` - 通知設定

実行結果の通知設定。

```yaml
notifications:
  on_success:
    - type: "github_comment"
      template: |
        ## ✅ Autopilot実行完了
        **Duration**: {{duration}}
        🤖 Generated with Autopilot Codex

  on_failure:
    - type: "github_comment"
      template: |
        ## ❌ Autopilot実行失敗
        **Error**: {{error_message}}
    - type: "escalation"
      target: "TechLead"
```

**通知タイプ:**
- `github_comment`: GitHub Issueにコメント投稿
- `escalation`: 人間へのエスカレーション（E8_Escalation）

**テンプレート変数:**
- `{{issue_number}}`: Issue番号
- `{{duration}}`: 実行時間
- `{{completed_steps}}`: 完了ステップ数
- `{{total_steps}}`: 総ステップ数
- `{{failed_step}}`: 失敗したステップ
- `{{error_message}}`: エラーメッセージ
- `{{error_log}}`: エラーログ
- `{{worktree_path}}`: Worktreeパス
- `{{log_path}}`: ログファイルパス

---

### 7. `audit` - 監査設定

実行後の監査設定。

```yaml
audit:
  enabled: true                    # 監査の有効化
  check_worktree_cleanup: true     # Worktreeクリーンアップ確認
  validate_logs: true              # ログ検証
  summary_required: true           # サマリー生成必須
```

---

## 📝 使用例

### 例1: シンプルなセットアップタスク

```yaml
autopilot:
  version: "1.0.0"
  issue_number: 646
  title: "Setup Wizard - Welcome Screen"

  execution:
    mode: "full-auto"
    timeout: 1800

  worktree:
    enabled: true

  steps:
    - id: "step-1"
      name: "Welcome画面実装"
      type: "codex_exec"
      commands:
        - "codex exec --full-auto --prompt 'Implement WelcomeScreen component'"
      expectations:
        - type: "file_exists"
          value: "src/components/WelcomeScreen.tsx"
```

### 例2: 複雑なビルド＆テストパイプライン

```yaml
autopilot:
  version: "1.0.0"
  issue_number: 650
  title: "Error Handling Improvement"

  execution:
    mode: "full-auto"
    timeout: 3600
    max_retries: 3

  steps:
    - id: "build"
      type: "setup"
      commands:
        - "cargo build --release"
      expectations:
        - type: "exit_code"
          value: 0
      on_failure: "abort"

    - id: "implement"
      type: "codex_exec"
      commands:
        - "codex exec --full-auto --prompt 'Improve error handling in miyabi-core'"
      post_commands:
        - "cargo clippy -- -D warnings"
        - "cargo fmt"
      on_failure: "retry"

    - id: "test"
      type: "test"
      commands:
        - "cargo test --all"
      expectations:
        - type: "output_contains"
          value: "test result: ok"
      on_failure: "abort"
```

---

## 🔗 関連ドキュメント

| ドキュメント | 説明 |
|------------|------|
| `miyabi_def/variables/workflows.yaml` | Workflow定義（W1-W5） |
| `miyabi_def/variables/entities.yaml` | Entity定義（E12_Worktree等） |
| `AGENTS.md` | Task Execution Protocol |
| `.codex/context/core-rules.md` | MCP First Approach |

---

## 🚀 次のステップ

1. **スクリプト実装**: `scripts/autopilot/run_codex.sh` 作成
2. **監査スクリプト**: `scripts/audit/codex_autopilot_check.sh` 作成
3. **テスト実行**: Issue #646で実証
4. **ドキュメント完成**: 使用例とトラブルシューティング追加

---

**Version**: 1.0.0
**Last Updated**: 2025-10-31
**Maintainer**: Miyabi Team
