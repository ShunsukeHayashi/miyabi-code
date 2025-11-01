# AI CLI比較 - Claude Code vs Gemini CLI

## 概要

このドキュメントは、MiyabiプロジェクトでClaude CodeとGemini CLIを併用する際のガイドラインです。

## インストール済みAI CLI

### 1. Claude Code

**提供元**: Anthropic
**バージョン**: claude-sonnet-4-5-20250929
**インストール方法**: 公式サイトからダウンロード

**主な機能**:
- ファイル読み書き（Read, Write, Edit）
- Git操作（commit, push, PR作成）
- Bash実行
- Web検索・Webフェッチ
- MCP (Model Context Protocol) サーバー統合
- タスク管理（TodoWrite）
- 専用エージェント起動（Task tool）

**得意分野**:
- ✅ Rustプロジェクトのビルド・テスト
- ✅ Git Worktree管理
- ✅ Agent並列実行の統括
- ✅ 構造化されたドキュメント生成
- ✅ GitHub API統合（MCP経由）

**コンテキスト設定**:
- `CLAUDE.md` - プロジェクト全体のコンテキスト
- `.claude/commands/*.md` - カスタムコマンド
- `.claude/agents/` - Agent仕様・プロンプト
- `.claude/templates/` - 報告プロトコル等

### 2. Gemini CLI

**提供元**: Google
**バージョン**: gemini-2.5-pro
**インストール方法**: `npm install -g @google/gemini-cli`

**主な機能**:
- 対話型CLI（インタラクティブモード）
- ファイル編集（`@path/to/file`記法でファイル参照）
- コマンド実行
- 100%のコンテキスト上限
- サンドボックスモード（オプション）

**得意分野**:
- ✅ 高速な対話セッション
- ✅ ファイル単位の即座の編集
- ✅ コマンドの実行提案
- ✅ インタラクティブな質問応答

**コンテキスト設定**:
- `GEMINI.md` - Gemini専用のコンテキストファイル
- プロジェクトルートで自動検出

## 使い分けガイドライン

### Claude Codeを使うべき場面

1. **複雑な並列処理が必要な場合**
   - Git Worktreeベースの並列Agent実行
   - 複数Issueの同時処理
   - DAG（タスク依存グラフ）に基づいた実行順序制御

2. **構造化されたドキュメント生成**
   - Entity-Relationモデルに基づいた仕様書
   - 報告プロトコルに準拠したレポート
   - マークダウン形式の大規模ドキュメント

3. **GitHub連携が重要な場合**
   - Issue/PR作成・管理
   - ラベル操作
   - Projects V2連携
   - MCPサーバー経由のGitHub API呼び出し

4. **長時間のセッション**
   - 複数ステップのタスク追跡（TodoWrite）
   - セッション全体の進捗管理
   - エラー時のロールバック・リトライ

### Gemini CLIを使うべき場面

1. **即座の質問・回答が必要な場合**
   - 「このエラーはどういう意味？」
   - 「このコマンドの使い方は？」
   - 「このファイルの内容を要約して」

2. **単一ファイルの迅速な編集**
   - `> @path/to/file このバグを修正して`
   - 即座のフィードバックループ

3. **実験的なコード生成**
   - プロトタイピング
   - 複数案の比較
   - アルゴリズムの試行錯誤

4. **リソース消費を抑えたい場合**
   - 軽量な対話セッション
   - コンテキスト使用量の可視化（100%表示）

## 併用シナリオ

### シナリオ1: Issue処理の全体統括（Claude Code）+ 個別ファイル修正（Gemini）

```bash
# Step 1: Claude Codeで全体統括
# CoordinatorAgentがIssue #270をDAG分解
miyabi agent run coordinator --issue 270

# Step 2: Worktree作成・Agent割り当て
# 各Worktreeで並列実行開始

# Step 3: 個別ファイルの微調整（Gemini CLI）
cd .worktrees/issue-270
gemini
> @src/agents/codegen.rs このエラーを修正して
```

### シナリオ2: ドキュメント生成（Claude Code）+ レビュー（Gemini）

```bash
# Step 1: Claude Codeで大規模ドキュメント生成
# （報告プロトコルに準拠した360行の仕様書）

# Step 2: Geminiでレビュー
gemini
> @.claude/templates/reporting-protocol.md このドキュメントを要約して、改善点を3つ提案して
```

### シナリオ3: Git操作（Claude Code）+ コード解説（Gemini）

```bash
# Step 1: Claude Codeでコミット・PR作成
# （Conventional Commits準拠、自動ラベル付与）

# Step 2: Geminiでコード解説
gemini
> @crates/miyabi-agents/src/coordinator.rs このコードの動作を初心者向けに解説して
```

## コンテキストファイルの設計

### CLAUDE.md（Claude Code専用）

**内容**:
- プロジェクト全体のアーキテクチャ
- Rustクレート構成
- Agent System（21個のAgent）
- Git Worktree並列実行アーキテクチャ
- Entity-Relationモデル
- 報告プロトコル
- タスク管理プロトコル

**更新頻度**: 低頻度（週1-2回、重要な変更時）

**管理者**: Claude Code（自動参照・自動更新）

### GEMINI.md（Gemini CLI専用・将来追加予定）

**内容案**:
- クイックリファレンス（よく使うコマンド）
- ファイル構造の簡易マップ
- コーディング規約（簡潔版）
- デバッグTips
- エラーメッセージ解説

**更新頻度**: 高頻度（日次、実験的な情報追加）

**管理者**: Gemini CLI + 人間のユーザー

## 実行例

### Claude Code: Agent並列実行

```bash
# 3つのIssueを並列処理（concurrency=2）
miyabi agent run coordinator --issues 270,271,272 --concurrency 2

# 各Worktreeで独立したClaude Codeセッションが起動
# - .worktrees/issue-270/ → CodeGenAgent
# - .worktrees/issue-271/ → ReviewAgent
# - .worktrees/issue-272/ → DeploymentAgent
```

### Gemini CLI: インタラクティブ編集

```bash
gemini
> @crates/miyabi-cli/src/main.rs
> この関数にエラーハンドリングを追加して

# Geminiが即座に修正案を提示
# ユーザーが承認すればファイルを直接編集
```

## 報告形式の違い

### Claude Code: 構造化レポート

```markdown
## 📋 Claude Code からの作業報告

**報告者**: Claude Code (AI Assistant)
**報告日時**: 2025-10-17
**セッション**: Issue #270処理

---

### ✅ 完了した作業
[詳細な作業ログ]

### 📊 変更統計
[コミット情報]

### 🎯 動作確認結果
[テスト結果]

---

**報告終了**
Claude Code
```

### Gemini CLI: 簡潔なサマリー

```
✓ ファイル修正完了: src/agents/codegen.rs
✓ テスト追加: #[cfg(test)] mod tests
✓ ドキュメント更新: /// Generates code from task description

次のステップ: cargo test を実行して確認してください。
```

## セキュリティ・プライバシー

### 環境変数の共有

両CLIで以下の環境変数を共有:

```bash
# .env ファイル（共通）
GITHUB_TOKEN=ghp_xxx
GITHUB_REPOSITORY=ShunsukeHayashi/miyabi-private
DEVICE_IDENTIFIER=003noMac-mini.local
```

### 機密情報の扱い

- ✅ Claude Code: MCPサーバー経由でトークンを安全に管理
- ✅ Gemini CLI: ローカルキャッシュ（`~/.gemini-cli/`）で認証情報管理
- ❌ 両CLI共通: トークンをコマンドライン引数に直接指定しない

## トラブルシューティング

### Claude Codeが応答しない

```bash
# セッションを再起動
# Ctrl+C で終了
# 新しいターミナルで再起動
```

### Gemini CLIが起動しない

```bash
# キャッシュクリア
rm -rf ~/.gemini-cli/cache

# 再インストール
npm uninstall -g @google/gemini-cli
npm install -g @google/gemini-cli

# 認証情報再設定
gemini --auth
```

### 両CLIでコンフリクト

```bash
# Claude CodeがWorktreeを作成中の場合
# → Geminiでは読み取り専用で使用
gemini
> @.worktrees/issue-270/src/main.rs ファイル内容を確認
# （編集はしない）

# Geminiでファイル編集中の場合
# → Claude Codeのセッションは一時停止
# → Geminiの編集が完了してからClaude Code再開
```

## ベストプラクティス

### 1. タスクの性質で使い分ける

- **構造化された長期タスク** → Claude Code
- **即座の質問・短期タスク** → Gemini CLI

### 2. ログを残す

- Claude Code: 報告プロトコルに準拠したレポート自動生成
- Gemini CLI: セッションログを手動で記録（重要な決定事項のみ）

### 3. コンテキストを分離する

- `CLAUDE.md`: 包括的なプロジェクトコンテキスト
- `GEMINI.md`: 日常的なクイックリファレンス

### 4. バージョン管理

- Claude Codeで生成したファイル: 必ずGitコミット
- Gemini CLIで実験的に編集: 動作確認後にコミット

## 将来の統合計画

### Phase 1: 現在（v1.0.0）
- Claude Code: メイン開発環境
- Gemini CLI: 補助ツール

### Phase 2: 連携強化（v1.1.0）
- Claude Code → Gemini CLI: タスク移譲機能
- Gemini CLI → Claude Code: 実験結果のフィードバック
- 共通のタスクキュー（Redis等）

### Phase 3: 完全統合（v2.0.0）
- 統合CLI: `miyabi ai <command>`
- バックエンド自動選択（タスクの性質に応じてClaude/Geminiを選択）
- 統一報告形式

## 参考リンク

- **Claude Code公式**: https://claude.com/claude-code
- **Gemini CLI公式**: https://github.com/google-gemini/gemini-cli
- **Miyabi CLAUDE.md**: `/Users/a003/dev/miyabi-private/CLAUDE.md`
- **報告プロトコル**: `.claude/templates/reporting-protocol.md`

---

**ドキュメントバージョン**: v1.0.0
**最終更新**: 2025-10-17
**作成者**: Claude Code
