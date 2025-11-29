# Miyabi Commands Plugin

**Version**: 2.0.0
**Category**: Productivity
**License**: Apache-2.0

50以上のスラッシュコマンドを提供する Claude Code プラグイン。Agent実行、デプロイ、レビュー、セキュリティスキャン、日次レポートなど、開発ワークフローを高速化します。

## Installation

```bash
# マーケットプレイス追加
/plugin marketplace add customer-cloud/miyabi-private

# プラグインインストール
/plugin install miyabi-commands@miyabi-official-plugins

# Claude Code 再起動
```

## Commands Overview

### コマンド一覧 (50+)

| カテゴリ | コマンド | 説明 |
|---------|---------|------|
| **Agent** | `/agent-run` | Issue自動処理パイプライン |
| **Deploy** | `/deploy` | Firebase/Cloud デプロイ実行 |
| **Review** | `/review` | コードレビュー実行 |
| **Security** | `/security-scan` | セキュリティ脆弱性スキャン |
| **Report** | `/daily-update` | 日次開発進捗レポート生成 |
| **Verify** | `/verify` | システム動作確認 |
| **Issue** | `/create-issue` | GitHub Issue作成支援 |
| **Docs** | `/generate-docs` | ドキュメント自動生成 |
| **Session** | `/session-end` | セッション終了通知 |
| **SSH** | `/ssh-connect` | MUGEN/MAJIN SSH接続 |
| **Tmux** | `/tmux-control` | tmuxセッション管理 |
| **Voice** | `/voicevox` | 音声ガイド生成 |
| **TODO** | `/miyabi-todos` | TODOコメント→Issue化 |
| **Auto** | `/miyabi-auto` | Water Spider全自動モード |

---

## Core Commands

### /agent-run

**説明**: Autonomous Agent実行 - Issue自動処理パイプライン (Rust Edition)

**使用方法**:
```
/agent-run 270
/agent-run --issues=270,240,276 --concurrency=3
```

**機能**:
- Issue内容の解析
- タスク分解 (DAG構築)
- Agent割り当て
- 並行実行
- PR自動作成

**出力**:
```
🎯 Agent Execution Starting...
📋 Issue #270: "Add authentication feature"
🔍 Analyzing issue content...
📊 Task DAG: 3 nodes, 2 edges
⚡ Executing with concurrency: 2
✅ Completed: 3/3 tasks
🔗 PR #42 created
```

---

### /deploy

**説明**: Firebase/Cloud デプロイ実行

**使用方法**:
```
/deploy
/deploy --env=production
/deploy --service=api --env=staging
```

**対応サービス**:
- Firebase Hosting
- Firebase Functions
- AWS S3/CloudFront
- Vercel

**機能**:
- ビルド
- デプロイ
- ヘルスチェック
- 自動Rollback (失敗時)

---

### /review

**説明**: コードレビュー実行

**使用方法**:
```
/review
/review --pr=42
/review --files="src/**/*.rs"
```

**チェック項目**:
- コード品質 (Clippy)
- セキュリティ (audit)
- テストカバレッジ
- ドキュメント

**出力**:
```
📊 Code Review Report
━━━━━━━━━━━━━━━━━━━━━━━━
Quality Score: 85/100
Clippy Warnings: 0
Security Issues: 0
Test Coverage: 82%

✅ Approved with minor suggestions
```

---

### /security-scan

**説明**: セキュリティ脆弱性スキャン実行

**使用方法**:
```
/security-scan
/security-scan --deep
```

**スキャン項目**:
- 依存関係脆弱性 (`cargo audit`)
- unsafe使用
- 秘密情報検出 (`gitleaks`)
- OWASP Top 10

**出力**:
```
🔒 Security Scan Report
━━━━━━━━━━━━━━━━━━━━━━━━
Vulnerabilities: 0 critical, 0 high
Unsafe Blocks: 2 (documented)
Secrets: 0 detected
OWASP: Pass

✅ Security Check Passed
```

---

### /daily-update

**説明**: 毎日の開発進捗レポート自動生成 (note.com投稿用)

**使用方法**:
```
/daily-update
/daily-update --format=markdown
```

**出力内容**:
- 完了Issue/PR
- コミット統計
- 変更ファイル数
- コード行数
- 今日のハイライト

---

### /create-issue

**説明**: GitHub Issue作成支援（Agent実行用・汎用Issue両対応）

**使用方法**:
```
/create-issue
/create-issue --template=bug
/create-issue --template=feature
```

**テンプレート**:
- Bug Report
- Feature Request
- Agent Execution
- Documentation

---

### /generate-docs

**説明**: コードからドキュメント自動生成

**使用方法**:
```
/generate-docs
/generate-docs --crate=miyabi-agents
```

**生成物**:
- Rustdoc
- API Reference
- Architecture Diagram
- README.md

---

### /verify

**説明**: システム動作確認 - 環境・コンパイル・テストを全チェック

**使用方法**:
```
/verify
/verify --quick
```

**チェック項目**:
- 環境変数
- 依存関係
- ビルド
- テスト
- Clippy
- Doc生成

**出力**:
```
🔍 System Verification
━━━━━━━━━━━━━━━━━━━━━━━━
[✅] Environment variables
[✅] Dependencies up-to-date
[✅] cargo build (32s)
[✅] cargo test (45s)
[✅] cargo clippy (0 warnings)
[✅] cargo doc

✅ All checks passed
```

---

### /session-end

**説明**: セッション終了通知 - macOS通知＋牛の鳴き声🐮

**使用方法**:
```
/session-end
/session-end --message="作業完了"
```

**機能**:
- macOS通知
- VOICEVOX音声
- 作業サマリー

---

### /ssh-connect

**説明**: MUGEN/MAJIN SSH接続・リソース監視・Claude Code リモート実行

**使用方法**:
```
/ssh-connect mugen
/ssh-connect majin --gpu
/ssh-connect mugen --tmux
```

**対応マシン**:
| マシン | IP | 用途 |
|--------|-----|------|
| MUGEN | 44.250.27.197 | 高負荷ビルド |
| MAJIN | 54.92.67.11 | GPU処理 |

---

### /tmux-control

**説明**: TmuxControlAgentでtmuxセッションを管制

**使用方法**:
```
/tmux-control list
/tmux-control create miyabi-dev
/tmux-control send-keys "cargo build"
```

**機能**:
- セッション作成/削除
- ペイン分割
- send-keys
- ログキャプチャ

---

### /voicevox

**説明**: VOICEVOX音声生成

**使用方法**:
```
/voicevox "開発が完了しました"
/voicevox --from-git-log
```

**話者**:
- ずんだもん
- 四国めたん
- 他多数

---

### /miyabi-todos

**説明**: TODOコメント自動検出・Issue化

**使用方法**:
```
/miyabi-todos
/miyabi-todos --create-issues
```

**検出パターン**:
```rust
// TODO: 〇〇を実装
// FIXME: バグ修正が必要
// HACK: 一時的な回避策
```

---

### /miyabi-auto

**説明**: Miyabi Water Spider全自動モード起動

**使用方法**:
```
/miyabi-auto
/miyabi-auto --interval=60
```

**自動実行内容**:
- Issue監視
- ラベル自動更新
- Agent自動実行
- 進捗レポート

---

## Additional Commands

### Worktree系

| コマンド | 説明 |
|---------|------|
| `/worktree-create` | Git Worktree作成 |
| `/worktree-list` | Worktree一覧 |
| `/worktree-cleanup` | 不要Worktree削除 |
| `/worktree-dashboard` | Worktree状態表示 |

### Issue/PR系

| コマンド | 説明 |
|---------|------|
| `/issue-analyze` | Issue分析 |
| `/issue-batch` | Issue一括作成 |
| `/pr-create` | PR作成 |
| `/pr-list` | PR一覧 |
| `/pr-auto-merge` | 自動マージ |

### Deploy系

| コマンド | 説明 |
|---------|------|
| `/deploy-status` | デプロイ状態確認 |
| `/deploy-rollback` | ロールバック |

### Monitoring系

| コマンド | 説明 |
|---------|------|
| `/health-check` | ヘルスチェック |
| `/logs` | ログ表示 |
| `/dashboard` | ダッシュボード |

### Content系

| コマンド | 説明 |
|---------|------|
| `/note-create` | note.com記事作成 |
| `/generate-lp` | LP生成 |
| `/narrate` | ナレーション生成 |

### Quality系

| コマンド | 説明 |
|---------|------|
| `/quality-score` | 品質スコア計算 |
| `/check-benchmark` | ベンチマーク実行 |

---

## Command File Structure

```
plugins/miyabi-commands/commands/
├── agent-run.md
├── deploy.md
├── review.md
├── security-scan.md
├── daily-update.md
├── create-issue.md
├── generate-docs.md
├── verify.md
├── session-end.md
├── ssh-connect.md
├── tmux-control.md
├── voicevox.md
├── miyabi-todos.md
├── miyabi-auto.md
└── ... (50+ commands)
```

---

## Creating Custom Commands

### 新規コマンド作成

1. `.claude/commands/my-command.md` を作成
2. フロントマター + プロンプトを記述

```markdown
---
name: my-command
description: カスタムコマンドの説明
---

# My Command

以下の処理を実行してください:
1. 〇〇を確認
2. △△を実行
3. 結果を報告
```

---

## Related Plugins

- [miyabi-skills](../miyabi-skills/) - スキルセット
- [miyabi-hooks](../miyabi-hooks/) - フック設定

---

**Author**: Shunsuke Hayashi
**Created**: 2025-11-29
**Version**: 2.0.0
