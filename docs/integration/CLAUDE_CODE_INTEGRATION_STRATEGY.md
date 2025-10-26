# Miyabi × Claude Code 統合戦略

**作成日**: 2025-10-26
**バージョン**: 1.0.0

## 概要

Miyabi は Claude Code を実装の動力として使用する自律型開発フレームワークです。
Interactive Mode と Headless Mode を適切に使い分け、最大の効率を実現します。

---

## 🎭 モード使い分けの原則

### Interactive Mode（対話型）

**用途**: ユーザーの直接操作、リアルタイム開発

| 使用場面 | 具体例 | Stream Deck ボタン |
|---------|--------|------------------|
| 対話的な開発 | コードレビュー、デバッグ相談 | Next, Continue, Fix, Help |
| 即座の確認 | ビルド結果確認、テスト実行 | Build, Test, Clippy |
| Git 操作 | コミット作成、PR レビュー | Commit, PR, Push |
| 設計相談 | アーキテクチャ検討、実装方針 | - |

**特徴**:
- ✅ 会話履歴が維持される
- ✅ リアルタイムフィードバック
- ✅ 柔軟な対応が可能
- ❌ スクリプト化が困難

### Headless Mode（自動実行型）

**用途**: バックグラウンドタスク、自動化、エージェント実行

| 使用場面 | 具体例 | 実装方法 |
|---------|--------|---------|
| Agent 自動実行 | Issue 自動処理、コード生成 | `claude -p` |
| CI/CD | テスト、デプロイ、品質チェック | GitHub Actions |
| バッチ処理 | ドキュメント生成、リファクタリング | cron / Script |
| 並列実行 | 複数 Issue の同時処理 | Worktree × Headless |

**特徴**:
- ✅ スクリプト化が容易
- ✅ 並列実行可能
- ✅ ログ・結果の自動保存
- ❌ 対話的なやり取りが困難

---

## 🏗️ Miyabi アーキテクチャへの統合

### レイヤー構成

```
┌─────────────────────────────────────────────┐
│  Stream Deck (Interactive Mode)            │
│  - ユーザーの直接操作                          │
│  - リアルタイム開発                            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Miyabi Orchestrator (Hybrid Layer)        │
│  - モード判定・切り替え                         │
│  - セッション管理                              │
└─────────────────────────────────────────────┘
        ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│ Interactive Mode │      │ Headless Mode    │
│ - 開発セッション    │      │ - Agent 実行      │
│ - デバッグ         │      │ - CI/CD          │
│ - レビュー         │      │ - バッチ処理      │
└──────────────────┘      └──────────────────┘
```

---

## 🤖 Agent システムとの連携

### 1. Interactive → Headless 委譲パターン

**シナリオ**: ユーザーが Issue を確認 → Agent に自動処理を委譲

```bash
# Stream Deck: "Coordinator Agent を起動"（Interactive）
# ↓ ユーザーが Issue #123 を指定
# ↓ Interactive Mode で確認・承認
# ↓ Headless Mode で実行開始

# Headless Mode で自動実行
claude -p "Process issue #123 using Coordinator Agent" \
  --append-system-prompt "$(cat .claude/agents/prompts/coding/coordinator.md)" \
  --output-format json \
  --allowedTools "Bash,Read,Write,Edit" \
  > /tmp/agent-coordinator-123.json
```

### 2. Headless 並列実行パターン

**シナリオ**: 複数 Issue を並列処理

```bash
#!/bin/bash
# 並列 Agent 実行

ISSUES=(270 271 272)

for issue in "${ISSUES[@]}"; do
  # 各 Issue を Headless Mode で並列実行
  (
    claude -p "Process issue #$issue" \
      --append-system-prompt "$(cat .claude/agents/prompts/coding/coordinator.md)" \
      --output-format json \
      > "/tmp/agent-issue-$issue.json" &
  )
done

wait
echo "All agents completed"
```

### 3. Headless → Interactive 報告パターン

**シナリオ**: Agent 実行結果をユーザーに報告

```bash
# Agent 実行（Headless）
result=$(claude -p "Generate documentation for crate miyabi-core" \
  --output-format json)

# 結果を Interactive Mode に通知
# Stream Deck の "Voice" ボタン経由
if [ $(echo "$result" | jq -r '.is_error') == "false" ]; then
  tools/stream-deck/29-voice.sh "ドキュメント生成が完了しました"
else
  tools/stream-deck/29-voice.sh "エラーが発生しました"
fi
```

---

## 📋 実装例

### 例1: Issue 処理フロー

```bash
#!/bin/bash
# miyabi-process-issue.sh - Hybrid Mode Issue 処理

ISSUE_NUM="$1"
MODE="${2:-interactive}"  # interactive or headless

if [ "$MODE" == "interactive" ]; then
  # Interactive Mode: ユーザー確認付き
  echo "Issue #$ISSUE_NUM を確認しています..."

  # Stream Deck 経由で Claude Code に送信
  tools/stream-deck/01-next.sh "Issue #$ISSUE_NUM の内容を確認して、処理方針を提案してください"

  read -p "Agent に委譲しますか？ (y/n): " confirm

  if [ "$confirm" == "y" ]; then
    # Headless Mode に切り替え
    echo "Headless Mode で Agent 実行を開始..."
    "$0" "$ISSUE_NUM" headless
  fi
else
  # Headless Mode: 自動実行
  echo "Agent 自動実行中..."

  claude -p "Process GitHub issue #$ISSUE_NUM completely" \
    --append-system-prompt "$(cat .claude/agents/prompts/coding/coordinator.md)" \
    --output-format json \
    --allowedTools "Bash,Read,Write,Edit,Grep,Glob" \
    > "/tmp/agent-issue-$ISSUE_NUM.json"

  # 結果を通知
  if [ $? -eq 0 ]; then
    tools/stream-deck/29-voice.sh "Issue ${ISSUE_NUM} の処理が完了しました"
  else
    tools/stream-deck/29-voice.sh "Issue ${ISSUE_NUM} でエラーが発生しました"
  fi
fi
```

### 例2: CI/CD パイプライン

```yaml
# .github/workflows/miyabi-auto-review.yml
name: Miyabi Auto Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run Review Agent (Headless)
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # Headless Mode でコードレビュー
          claude -p "Review this PR for code quality, security, and best practices" \
            --append-system-prompt "$(cat .claude/agents/prompts/coding/review.md)" \
            --output-format json \
            --allowedTools "Read,Grep,Bash(cargo test)" \
            > review-result.json

      - name: Post Review Comment
        run: |
          # レビュー結果を PR コメントとして投稿
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "$(jq -r '.result' review-result.json)"
```

### 例3: 定期実行（Cron）

```bash
#!/bin/bash
# cron-daily-tasks.sh - 毎日の自動タスク

# 1. ドキュメント更新（Headless）
claude -p "Update documentation for all crates" \
  --output-format json \
  --allowedTools "Read,Write,Bash(cargo doc)" \
  > /tmp/doc-update.json

# 2. 依存関係チェック（Headless）
claude -p "Check for outdated dependencies and security vulnerabilities" \
  --output-format json \
  --allowedTools "Bash(cargo outdated),Bash(cargo audit)" \
  > /tmp/deps-check.json

# 3. 結果を Slack 通知（Headless → External）
if [ $(jq -r '.is_error' /tmp/deps-check.json) == "false" ]; then
  slack-notify "Daily check completed successfully"
else
  slack-notify "Daily check found issues - please review"
fi
```

---

## 🔄 ハイブリッド実行パターン

### パターン1: インタラクティブ開始 → 自動継続

```bash
# 開発者が Interactive Mode で作業開始
# Stream Deck: "Next" → "Fix build errors"

# Claude Code が修正を提案
# ↓
# 開発者が承認
# ↓
# Headless Mode で自動適用・テスト

claude -p "Apply the suggested fixes and run tests" \
  --resume $SESSION_ID \  # 既存セッション継続
  --output-format json
```

### パターン2: 定期監視 → インタラクティブ介入

```bash
# Headless Mode で定期監視
while true; do
  status=$(claude -p "Check build status" --output-format json)

  if [ $(echo "$status" | jq -r '.is_error') == "true" ]; then
    # エラー検出 → Interactive Mode に通知
    tools/stream-deck/29-voice.sh "ビルドエラーを検出しました"
    tools/stream-deck/03-fix.sh  # Fix ボタンをトリガー
    break
  fi

  sleep 300  # 5分ごと
done
```

---

## 📊 セッション管理戦略

### セッション種別

| セッション種別 | 用途 | 保持期間 | 管理方法 |
|------------|-----|---------|---------|
| Main Session | 日常開発 | 無期限 | Interactive (Stream Deck) |
| Agent Session | 自動タスク | タスク完了まで | Headless (一時) |
| CI/CD Session | パイプライン | ビルド完了まで | Headless (自動削除) |
| Review Session | コードレビュー | PR マージまで | Headless (保存) |

### セッション連携

```bash
# Main Session ID を保存
MAIN_SESSION=$(claude --list-sessions | jq -r '.[0].id')

# Agent が Main Session のコンテキストを参照
claude -p "Implement the feature we just discussed" \
  --resume $MAIN_SESSION \
  --output-format json
```

---

## 🛠️ 実装ロードマップ

### Phase 1: 基盤整備（現在）
- [x] Stream Deck Interactive Mode 統合
- [x] 32ボタンレイアウト
- [ ] Headless Mode スクリプト作成

### Phase 2: Agent 統合
- [ ] Coordinator Agent Headless 実行
- [ ] CodeGen Agent 並列実行
- [ ] Review Agent CI/CD 統合

### Phase 3: ハイブリッド実行
- [ ] Interactive → Headless 委譲
- [ ] セッション管理システム
- [ ] 結果通知システム

### Phase 4: 完全自動化
- [ ] Issue 自動処理パイプライン
- [ ] 定期タスク自動実行
- [ ] 監視・アラートシステム

---

## 📝 ベストプラクティス

### DO ✅
- Interactive Mode は開発・レビュー・相談に使用
- Headless Mode は自動化・バッチ・CI/CD に使用
- セッション ID を適切に管理
- エラーハンドリングを実装
- ログを適切に保存

### DON'T ❌
- Interactive で長時間バッチ処理を実行しない
- Headless で対話的なやり取りを試みない
- セッションを無制限に作成しない
- エラーを無視しない

---

## 🔗 関連ドキュメント

- [Claude Code Headless Mode 公式ドキュメント](https://docs.claude.com/en/docs/claude-code/headless-mode)
- [Miyabi Agent 仕様](.claude/agents/AGENT_CHARACTERS.md)
- [Stream Deck セットアップガイド](../tools/stream-deck/NO_ARGUMENTS_SETUP.md)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Claude Code を Miyabi の動力源として最大限活用！** 🚀
