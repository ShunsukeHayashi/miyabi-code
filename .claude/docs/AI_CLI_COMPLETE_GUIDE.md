# AI CLI完全ガイド - Claude Code / Gemini CLI / OpenAI Codex

## 概要

このドキュメントは、Miyabiプロジェクトで使用する3つのAI CLIツールの完全なガイドです。最新バージョン（2025年10月）に基づき、インストール、設定、使い方、アップデート追従方法を記載しています。

---

## 📋 目次

1. [Claude Code](#1-claude-code)
2. [Gemini CLI](#2-gemini-cli)
3. [OpenAI Codex CLI](#3-openai-codex-cli)
4. [比較表](#4-比較表)
5. [使い分けガイドライン](#5-使い分けガイドライン)
6. [アップデート追従システム](#6-アップデート追従システム)
7. [トラブルシューティング](#7-トラブルシューティング)

---

## 1. Claude Code

### 基本情報

**提供元**: Anthropic
**現在のモデル**: claude-sonnet-4-5-20250929
**公式ドキュメント**: https://docs.claude.com/en/docs/claude-code/

### インストール

```bash
# macOS/Linux
# 公式サイトからダウンロード
# https://claude.com/claude-code

# 確認
claude --version
```

### 設定ファイル

#### `.claude/settings.json` (プロジェクト設定 - コミット対象)

```json
{
  "$schema": "https://docs.claude.com/schemas/settings.json",
  "hooks": {
    "UserPromptSubmit": [...],
    "PreToolUse": [...],
    "PostToolUse": [...],
    "Stop": [...],
    "SessionStart": [...],
    "SessionEnd": [...],
    "Notification": [...],
    "PreCompact": [...]
  },
  "timeout": {
    "default": 60000,
    "perCommand": {}
  },
  "security": {
    "blockedPaths": [".env", ".git/", "*.key"],
    "allowedCommands": ["git", "npm", "cargo"]
  },
  "mcpServers": {}
}
```

#### `~/.claude/settings.json` (ユーザー設定 - グローバル)

全プロジェクトで共通の設定

### Hooks機能（最新仕様 2025年10月）

#### 利用可能なHook Events

1. **PreToolUse** - ツール実行前
   - matcher: 正規表現でツール名を指定（例: `"Edit|Write"`）
   - 用途: ファイル編集前のバリデーション、警告表示

2. **PostToolUse** - ツール実行後
   - matcher: 正規表現でツール名を指定
   - 用途: ツール実行後の自動フォーマット、テスト実行

3. **UserPromptSubmit** - ユーザープロンプト送信時
   - 用途: コマンドログ記録、プロンプト検証

4. **Stop** - Agent応答完了時
   - 用途: セッション継続確認、状態保存

5. **SubagentStop** - サブAgent完了時
   - 用途: サブAgentの結果集約

6. **SessionStart** - セッション開始時
   - 用途: プロジェクト状態表示、環境確認

7. **SessionEnd** - セッション終了時
   - 用途: 統計表示、クリーンアップ

8. **Notification** - 通知発生時
   - 用途: 通知のログ記録

9. **PreCompact** - コンテキスト圧縮前
   - 用途: 圧縮前の警告、重要情報の保存

#### Hooksのセキュリティベストプラクティス

```bash
# ❌ 危険な書き方
command: "rm -rf $USER_INPUT"

# ✅ 安全な書き方
command: "rm -rf \"$USER_INPUT\""

# ✅ パストラバーサル対策
if [[ "$FILE_PATH" =~ \.\. ]]; then
  echo "Error: Path traversal detected"
  exit 2
fi

# ✅ 機密ファイルの除外
if [[ "$FILE_PATH" =~ \.env|\.git/|\.key$ ]]; then
  echo "Error: Sensitive file blocked"
  exit 2
fi
```

#### 環境変数

Hook内で利用可能な環境変数:

- `$CLAUDE_PROJECT_DIR` - プロジェクトルートディレクトリ
- `$PROMPT` - ユーザープロンプト（UserPromptSubmitのみ）
- `$TOOL_NAME` - ツール名（PreToolUse/PostToolUseのみ）
- `$TOOL_INPUT` - ツール入力（PreToolUse/PostToolUseのみ）
- `$NOTIFICATION_MESSAGE` - 通知メッセージ（Notificationのみ）
- `$CONTEXT_SIZE` - コンテキストサイズ（PreCompactのみ）

### MCPサーバー統合

#### 設定例

```json
{
  "mcpServers": {
    "github-enhanced": {
      "command": "node",
      "args": [".claude/mcp-servers/github-enhanced.cjs"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "REPOSITORY": "${GITHUB_REPOSITORY}"
      }
    }
  }
}
```

#### 利用可能なMCPツール（github-enhanced）

- `create_issue_with_labels` - ラベル自動付与してIssue作成
- `get_agent_tasks` - Agent実行可能なIssue一覧取得
- `update_issue_progress` - Issue進捗更新
- `create_pr_from_agent` - Agent生成のPR作成
- `get_pr_review_status` - PRレビュー状態取得

### アップデート確認

```bash
# Claude Codeは自動更新
# アップデート通知が表示されたら指示に従う

# 手動確認（公式サイト）
# https://claude.com/claude-code/releases
```

---

## 2. Gemini CLI

### 基本情報

**提供元**: Google
**現在のバージョン**: v0.9.0 (2025年10月)
**公式ドキュメント**: https://geminicli.com/docs/
**GitHubリポジトリ**: https://github.com/google-gemini/gemini-cli

### インストール

```bash
# NPM経由
npm install -g @google/gemini-cli

# または Homebrew（将来サポート予定）
# brew install gemini-cli

# 確認
gemini --version
```

### 認証

```bash
# 初回認証
gemini auth

# または環境変数で設定
export GEMINI_API_KEY=your_api_key_here
```

### 基本的な使い方

#### インタラクティブモード

```bash
cd /Users/a003/dev/miyabi-private
gemini

# Gemini CLIが起動
> こんにちは

# ファイル参照
> @crates/miyabi-cli/src/main.rs このファイルを要約して

# 複数ファイル参照
> @src/**.rs 全Rustファイルのエラーを確認
```

#### ワンライナー実行

```bash
# 直接質問
gemini "Rustのエラーハンドリングベストプラクティスは？"

# ファイル指定
gemini "@Cargo.toml このプロジェクトの依存関係を説明して"
```

### 最新機能（v0.9.0 - 2025年10月）

#### 1. インタラクティブシェル拡張（2025年10月15日）

```bash
gemini
> vim src/main.rs       # vim直接起動可能
> git rebase -i HEAD~3  # インタラクティブgit操作
> top                   # システム監視
```

#### 2. VS Code深度統合（2025年8月）

```bash
# VS Code統合ターミナルで起動
code .
# ターミナル内でgemini実行
gemini

# コンテキスト自動認識
# - 開いているファイル
# - カーソル位置
# - 選択範囲
```

#### 3. /copyコマンド

```bash
gemini
> 前回のコード生成結果をコピー
> /copy

# クリップボードに最後の出力がコピーされる
```

#### 4. カスタムテーマ

```bash
# テーマ設定
gemini config set theme dark

# カスタムテーマ作成
gemini config theme create my-theme
```

### 設定ファイル

#### `~/.gemini-cli/config.toml`

```toml
[model]
name = "gemini-2.5-pro"
temperature = 0.7

[theme]
name = "dark"
syntax_highlighting = true

[cache]
enabled = true
ttl = 3600

[telemetry]
enabled = false
```

### Gemini CLI専用コンテキスト

#### `GEMINI.md` (プロジェクトルート推奨)

```markdown
# Miyabi Project - Gemini CLI Context

## Quick Reference

- Rust 2021 Edition
- Main CLI: `cargo run --bin miyabi`
- Test: `cargo test --all`
- Build: `cargo build --release`

## Common Issues

1. **Error**: `GITHUB_TOKEN not set`
   **Fix**: `export GITHUB_TOKEN=ghp_xxx`

2. **Error**: `cargo build` fails
   **Fix**: `cargo clean && cargo build`

## File Structure

- `crates/miyabi-cli/` - CLI実装
- `crates/miyabi-agents/` - Agent実装
- `.claude/` - Claude Code設定
```

### アップデート

```bash
# 最新版にアップデート
npm install -g @google/gemini-cli@latest

# または
npm update -g @google/gemini-cli

# バージョン確認
gemini --version

# リリース情報確認
# https://github.com/google-gemini/gemini-cli/releases
```

---

## 3. OpenAI Codex CLI

### 基本情報

**提供元**: OpenAI
**現在のバージョン**: 最新リリース確認要
**公式リポジトリ**: https://github.com/openai/codex
**言語**: Rust (96.6%)

### インストール

```bash
# NPM経由
npm i -g @openai/codex

# または Homebrew
brew install codex

# 確認
codex --version
```

### 認証

```bash
# ChatGPTアカウントでサインイン
codex auth login

# または API Key
export OPENAI_API_KEY=sk-xxx
```

### 基本的な使い方

```bash
# インタラクティブモード
cd /Users/a003/dev/miyabi-private
codex

# ファイル指定
codex @src/main.rs "このファイルをリファクタリング"

# サンドボックスモード
codex --sandbox
```

### 設定ファイル

#### `~/.codex/config.toml`

```toml
[model]
name = "gpt-4"
temperature = 0.7

[sandbox]
enabled = true
approve_before_execution = true

[mcp]
enabled = true
servers = ["github", "filesystem"]
```

### MCP統合

OpenAI Codex CLIもModel Context Protocol (MCP)をサポート:

```toml
# ~/.codex/config.toml
[mcp.servers.github]
command = "node"
args = ["/path/to/github-mcp-server.js"]
env = { GITHUB_TOKEN = "ghp_xxx" }
```

### アップデート

```bash
# NPM経由
npm update -g @openai/codex

# Homebrew経由
brew upgrade codex

# バージョン確認
codex --version

# リリース情報
# https://github.com/openai/codex/releases
```

### Miyabiプロジェクトでの使用状況

**現在**: 未使用
**将来**: Phase 3 (AI CLI統合時) に検討

**検討理由**:
- Rust製でMiyabiプロジェクト（Rust 2021 Edition）と親和性高い
- MCP統合によりGitHub連携がスムーズ
- サンドボックス環境で安全なコード実行

---

## 4. 比較表

| 項目 | Claude Code | Gemini CLI | OpenAI Codex CLI |
|------|-------------|-----------|-----------------|
| **提供元** | Anthropic | Google | OpenAI |
| **現在バージョン** | claude-sonnet-4-5 | v0.9.0 | 要確認 |
| **言語** | - | TypeScript | Rust (96.6%) |
| **インストール** | 公式サイト | `npm i -g` | `npm i -g` / `brew` |
| **認証** | 自動 | API Key / OAuth | ChatGPT / API Key |
| **MCP対応** | ✅ Yes | ⚠️ 限定的 | ✅ Yes |
| **Hooks対応** | ✅ 9種類 | ❌ No | ⚠️ 不明 |
| **サンドボックス** | ❌ No | ❌ No | ✅ Yes |
| **VS Code統合** | ⚠️ 限定的 | ✅ Yes | ⚠️ 不明 |
| **料金** | 従量課金 | 従量課金 | ChatGPT Plus必須 |
| **Miyabiでの使用** | ✅ メイン | ✅ 補助 | ⚠️ 未使用 |

---

## 5. 使い分けガイドライン

### Claude Codeを使うべき場面

✅ **推奨シナリオ**:
- Git Worktreeベースの並列Agent実行
- 複雑なタスク分解（DAG構築）
- GitHub Issue/PR管理
- 長時間セッション（タスク追跡）
- 構造化されたドキュメント生成

❌ **不向きなシナリオ**:
- 即座の単純な質問
- 単一ファイルの迅速な編集

### Gemini CLIを使うべき場面

✅ **推奨シナリオ**:
- 即座の質問・回答
- 単一ファイルの迅速な編集（`@file`記法）
- インタラクティブな試行錯誤
- VS Code統合ターミナルでの作業
- 軽量なコンテキスト使用

❌ **不向きなシナリオ**:
- 複数ファイルの同時編集
- Git操作の自動化
- GitHub API連携

### OpenAI Codex CLIを使うべき場面

✅ **推奨シナリオ**（将来検討）:
- Rust特化のコード生成
- サンドボックス環境での安全な実行
- ChatGPT連携が必要な場合

❌ **不向きなシナリオ**:
- 現時点では導入不要（Claude + Geminiで十分）

---

## 6. アップデート追従システム

### 自動更新チェッカー

#### `.claude/scripts/check-ai-cli-versions.sh`

```bash
#!/bin/bash
# AI CLI バージョンチェッカー

echo "🔍 Checking AI CLI versions..."

# Claude Code
echo "📦 Claude Code:"
echo "  Current: claude-sonnet-4-5-20250929"
echo "  Check: https://claude.com/claude-code/releases"

# Gemini CLI
echo "📦 Gemini CLI:"
GEMINI_VERSION=$(gemini --version 2>/dev/null || echo "Not installed")
echo "  Current: $GEMINI_VERSION"
GEMINI_LATEST=$(npm view @google/gemini-cli version)
echo "  Latest:  $GEMINI_LATEST"

if [ "$GEMINI_VERSION" != "$GEMINI_LATEST" ]; then
  echo "  ⚠️  Update available! Run: npm update -g @google/gemini-cli"
fi

# OpenAI Codex CLI
echo "📦 OpenAI Codex CLI:"
CODEX_VERSION=$(codex --version 2>/dev/null || echo "Not installed")
echo "  Current: $CODEX_VERSION"

if [ "$CODEX_VERSION" == "Not installed" ]; then
  echo "  ℹ️  Not installed (optional)"
else
  echo "  Check: https://github.com/openai/codex/releases"
fi

echo ""
echo "✅ Version check complete"
```

#### 定期実行設定

```bash
# crontabに追加（週次チェック）
crontab -e

# 毎週月曜9時に実行
0 9 * * 1 /Users/a003/dev/miyabi-private/.claude/scripts/check-ai-cli-versions.sh >> /Users/a003/dev/miyabi-private/.ai/logs/version-check.log 2>&1
```

### バージョン情報ファイル

#### `.claude/ai-cli-versions.json`

```json
{
  "lastUpdated": "2025-10-17",
  "tools": {
    "claudeCode": {
      "model": "claude-sonnet-4-5-20250929",
      "releaseUrl": "https://claude.com/claude-code/releases",
      "updateMethod": "Auto (official site)"
    },
    "geminiCli": {
      "version": "0.9.0",
      "installed": true,
      "releaseUrl": "https://github.com/google-gemini/gemini-cli/releases",
      "updateMethod": "npm update -g @google/gemini-cli"
    },
    "openaiCodex": {
      "version": "N/A",
      "installed": false,
      "releaseUrl": "https://github.com/openai/codex/releases",
      "updateMethod": "npm update -g @openai/codex"
    }
  }
}
```

### GitHub Actions統合

#### `.github/workflows/check-ai-cli-versions.yml`

```yaml
name: Check AI CLI Versions

on:
  schedule:
    - cron: '0 9 * * 1' # 毎週月曜9時
  workflow_dispatch:

jobs:
  check-versions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Check Gemini CLI version
        run: |
          CURRENT=$(npm view @google/gemini-cli version)
          echo "Latest Gemini CLI: $CURRENT"
          echo "gemini_version=$CURRENT" >> $GITHUB_OUTPUT
        id: gemini

      - name: Update version file
        run: |
          jq '.tools.geminiCli.version = "${{ steps.gemini.outputs.gemini_version }}"' \
            .claude/ai-cli-versions.json > temp.json
          mv temp.json .claude/ai-cli-versions.json

      - name: Create PR if outdated
        uses: peter-evans/create-pull-request@v5
        with:
          title: "chore: Update AI CLI versions"
          body: "Auto-generated PR to update AI CLI version information"
          branch: "chore/update-ai-cli-versions"
```

---

## 7. トラブルシューティング

### Claude Code

#### 問題1: Hooksが実行されない

**原因**: Hook スクリプトに実行権限がない

**解決策**:
```bash
chmod +x .claude/hooks/*.sh
```

#### 問題2: MCPサーバーが起動しない

**原因**: 環境変数 `GITHUB_TOKEN` が設定されていない

**解決策**:
```bash
# .envファイル確認
cat .env | grep GITHUB_TOKEN

# または直接export
export GITHUB_TOKEN=ghp_xxx
```

#### 問題3: コンテキストウィンドウがすぐに圧縮される

**原因**: 大量のファイルを読み込んでいる

**解決策**:
- `.claude/settings.json` の `blockedPaths` に不要なパスを追加
- `PreCompact` hook で重要情報を保存

### Gemini CLI

#### 問題1: 認証エラー

**原因**: API Keyが無効または期限切れ

**解決策**:
```bash
# 再認証
gemini auth

# または環境変数再設定
export GEMINI_API_KEY=your_new_key
```

#### 問題2: @file記法が機能しない

**原因**: ファイルパスが間違っている

**解決策**:
```bash
# 絶対パスを使用
gemini "@/Users/a003/dev/miyabi-private/src/main.rs"

# または相対パス（プロジェクトルートから）
cd /Users/a003/dev/miyabi-private
gemini "@src/main.rs"
```

#### 問題3: VS Code統合が機能しない

**原因**: Gemini CLIバージョンが古い

**解決策**:
```bash
npm update -g @google/gemini-cli
```

### OpenAI Codex CLI

#### 問題1: ChatGPT認証が失敗する

**原因**: ChatGPT Plus/Proプランが必要

**解決策**:
- ChatGPT Plus/Pro/Team/Edu/Enterpriseプランを契約
- またはAPI Keyを使用

#### 問題2: サンドボックスが起動しない

**原因**: 設定ファイルが正しくない

**解決策**:
```bash
# 設定確認
cat ~/.codex/config.toml

# サンドボックス有効化
codex config set sandbox.enabled true
```

---

## 📚 関連ドキュメント

- [AI_CLI_COMPARISON.md](AI_CLI_COMPARISON.md) - Claude Code vs Gemini CLI比較
- [CODEX_CLARIFICATION.md](CODEX_CLARIFICATION.md) - 3つのCodexの定義明確化
- [reporting-protocol.md](../templates/reporting-protocol.md) - 報告プロトコルテンプレート
- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体のコンテキスト

---

**ドキュメントバージョン**: v1.0.0
**最終更新**: 2025-10-17
**次回更新予定**: 2025-11-01
**作成者**: Claude Code
