# Codex の定義明確化 - 3つの異なる "Codex"

## 概要

このプロジェクトでは「Codex」という名前が3つの異なる文脈で使用されています。混同を避けるため、各定義を明確化します。

## 1. OpenAI Codex CLI（ツール）

### 基本情報

**提供元**: OpenAI
**リポジトリ**: https://github.com/openai/codex
**インストール方法**:
```bash
npm i -g @openai/codex
# または
brew install codex
```

### 主な機能

- **ターミナルベースのコーディングエージェント**
- **ローカル実行**: ユーザーのコンピュータ上で動作
- **ChatGPT連携**: Plus/Pro/Team/Edu/Enterprise プランで認証
- **MCP (Model Context Protocol) サポート**: 外部サーバーとの統合
- **サンドボックス環境**: 安全なコード実行
- **承認ワークフロー**: ユーザー承認フロー

### 技術スタック

- **言語**: Rust (96.6%)、Python、TypeScript
- **ライセンス**: Apache-2.0
- **設定ファイル**: `~/.codex/config.toml`

### プロジェクトステータス

- ⭐ 47.9k stars
- 🍴 5.8k forks
- ✅ 活発に開発中（1,595 commits）

### Miyabiプロジェクトでの使用

**現在**: 未使用
**将来**: 検討中（Phase 3: AI CLI統合時）

**検討理由**:
- Rust製であり、Miyabiプロジェクト（Rust 2021 Edition）と技術スタック一致
- MCP統合により、GitHub連携がスムーズ
- サンドボックス環境で安全なコード実行

## 2. Codex（別スレッドのCodex）

### 基本情報

**実体**: Codex (Anthropic)
**動作環境**: 別のターミナルセッション
**役割**: Miyabiプロジェクトの補助的な編集タスク

### 識別方法

報告形式で識別可能:

```markdown
📋 Codex からの作業報告

報告者: Codex (AI Assistant)
報告日時: 2025-10-17
セッション: Miyabi プロジェクト初期セットアップ補完
```

### このセッションでの役割

- **AGENTS.md編集**: Agent仕様ドキュメントの更新
- **miyabi.sh改良**: 認証ヘルパースクリプトの改良
- **ドキュメント補完**: クイックスタートガイド等の追記

### なぜ "Codex" という名前？

ユーザーが別のCodexセッションを「Codex」と呼んで区別しているため。

**技術的には**:
- 実体: Codex (claude-sonnet-4-5-20250929)
- ニックネーム: Codex
- 目的: このセッション（Codex）と区別するため

## 3. Codex（Miyabiプロジェクト内のサブプロジェクト）

### 基本情報

**リポジトリ**: https://github.com/ShunsukeHayashi/codex
**役割**: Miyabiプロジェクトの統合ドキュメント管理システム
**ステータス**: 計画中 / 初期開発段階

### 目的

- **統合ドキュメント管理**: Entity-Relationモデルに基づいたドキュメント
- **Miyabi × Codex統合**: [CODEX_MIYABI_INTEGRATION.md](../../docs/CODEX_MIYABI_INTEGRATION.md) 参照
- **ナレッジベース**: プロジェクト全体の知識体系化

### 関連ドキュメント

- `docs/CODEX_MIYABI_INTEGRATION.md` - Codex × Miyabi 統合アーキテクチャ
- `CLAUDE.md:147` - 統合ガイドセクション

## 比較表

| 項目 | OpenAI Codex CLI | Codex（別スレッド） | Codex（サブプロジェクト） |
|------|-----------------|-------------------|---------------------|
| **実体** | OpenAI製ツール | Codex (Anthropic) | Miyabi内部プロジェクト |
| **言語** | Rust (96.6%) | - | - |
| **インストール** | `npm i -g @openai/codex` | 不要（Codex） | 開発中 |
| **役割** | コーディングエージェント | 補助的な編集 | ドキュメント管理 |
| **使用状況** | 未使用 | 使用中（別スレッド） | 計画中 |
| **MCP対応** | ✅ Yes | ✅ Yes（Codex経由） | 計画中 |
| **認証** | ChatGPT アカウント | GITHUB_TOKEN（env） | - |
| **設定ファイル** | `~/.codex/config.toml` | `.codex/` | `docs/CODEX_*` |

## 命名規約の提案

混同を避けるため、以下の命名規約を推奨:

### 1. OpenAI Codex CLI → 「OpenAI Codex」

```bash
# インストール
npm i -g @openai/codex

# 実行
openai-codex
```

### 2. 別スレッドのCodex → 「Codex Session」または「Codex (Codex)」

```markdown
## 📋 Codex (Codex) からの作業報告

**報告者**: Codex (AI Assistant) - Session: Codex
**報告日時**: 2025-10-17
```

### 3. サブプロジェクト → 「Miyabi Codex」

```
Repository: https://github.com/ShunsukeHayashi/codex
Name: Miyabi Codex
Purpose: Integrated Documentation System for Miyabi
```

## 推奨される使い方

### シナリオ1: OpenAI Codex CLIを追加する場合

```bash
# インストール
npm i -g @openai/codex

# 設定
codex config set model gpt-4

# Miyabiプロジェクトで使用
cd /Users/a003/dev/miyabi-private
codex
```

**使用場面**:
- Rust特化のコード生成（Rustで書かれたツールのため親和性高い）
- サンドボックス環境での安全なコード実行
- ChatGPT連携が必要な場合

### シナリオ2: 現在の「Codex」（別スレッド）を使用

```bash
# 別のターミナルで Codex を起動
# セッション名を「Codex」として運用

# 報告形式で明示
📋 Codex (Codex) からの作業報告
```

**使用場面**:
- 並列実行が必要な編集タスク
- このセッション（メインのCodex）と独立した作業
- AGENTS.md等の特定ファイル編集

### シナリオ3: Miyabi Codex（サブプロジェクト）開発

```bash
# 将来的な統合ドキュメントシステム
# Entity-Relationモデルに基づいた知識管理
```

**使用場面**:
- プロジェクト全体のドキュメント統合
- ナレッジベースの構築
- Miyabi × Codex統合アーキテクチャ実装

## AI CLIツールの全体像

Miyabiプロジェクトで使用可能なAI CLIツール:

1. **Codex** (メイン)
   - 提供元: Anthropic
   - 役割: プロジェクト統括、Agent並列実行
   - このセッション: ✅ 実行中

2. **Codex (Codex)** (補助)
   - 提供元: Anthropic
   - 役割: 並列実行タスク、特定ファイル編集
   - 別セッション: ✅ 実行中

3. **Gemini CLI**
   - 提供元: Google
   - 役割: インタラクティブ編集、即座の質問応答
   - ステータス: ✅ インストール済み
   - 詳細: [AI_CLI_COMPARISON.md](AI_CLI_COMPARISON.md)

4. **OpenAI Codex CLI**
   - 提供元: OpenAI
   - 役割: Rust特化コード生成、サンドボックス実行
   - ステータス: ⚠️ 未インストール（検討中）

## トラブルシューティング

### Q1: 「Codex」と言ったらどれを指す？

**コンテキストで判断**:

- ターミナルで `codex` コマンド → **OpenAI Codex CLI**
- 報告形式で「Codex」 → **別スレッドのCodex**
- ドキュメント内で「Codex」 → **Miyabi Codex（サブプロジェクト）**

### Q2: OpenAI Codex CLIを使うべき？

**現時点での推奨**: 保留

**理由**:
- Codex + Gemini CLI で現在の要件は満たしている
- OpenAI Codex CLI追加によるツール複雑化のリスク
- 将来（Phase 3: AI CLI統合）で再評価

### Q3: 別スレッドの「Codex」の名前を変えるべき？

**推奨**: 報告形式で明示すれば混同は避けられる

```markdown
## 📋 Codex (Codex Session) からの作業報告
```

または

```markdown
## 📋 Codex からの作業報告

**報告者**: Codex (AI Assistant)
**セッション識別子**: Codex
**Worktree**: N/A（メインブランチで作業）
```

## 参考リンク

- **OpenAI Codex CLI**: https://github.com/openai/codex
- **Codex公式**: https://claude.com/claude-code
- **Miyabi Codexリポジトリ**: https://github.com/ShunsukeHayashi/codex
- **Codex × Miyabi統合**: [CODEX_MIYABI_INTEGRATION.md](../../docs/CODEX_MIYABI_INTEGRATION.md)
- **AI CLI比較**: [AI_CLI_COMPARISON.md](AI_CLI_COMPARISON.md)

---

**ドキュメントバージョン**: v1.0.0
**最終更新**: 2025-10-17
**作成者**: Codex
