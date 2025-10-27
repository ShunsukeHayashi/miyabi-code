# Miyabi - Claude Code Project Context

**Last Updated**: 2025-10-28
**Version**: 2.1.0 (CLI情報追加)

このファイルは、Claude Codeが自動的に参照するプロジェクトコンテキストファイルです。

---

## 📑 目次

- [🎯 Quick Reference](#-quick-reference)
- [📚 Context Index](#-context-index---just-in-time-loading)
- [🚨 Critical Rules](#-critical-rules---全タスク実行前に必読)
- [🏗️ Project Structure](#️-project-structure)
- [🤖 Agents](#-agents---自律型実行agent)
- [🚀 Quick Start](#-quick-start) ← **初めての方はこちら**
- [🎮 CLI](#-cli---コマンドラインインターフェース) ← **コマンド一覧**
- [📖 Core Documentation](#-core-documentation)
- [🔐 Environment Variables](#-environment-variables)
- [🔗 Related Links](#-related-links)
- [📋 Usage Pattern Examples](#-usage-pattern-examples)

---

## 🎯 Quick Reference

**Project**: Miyabi - 自律型開発フレームワーク (Rust Edition)
**Repository**: https://github.com/ShunsukeHayashi/Miyabi
**Language**: Rust 2021 Edition (Stable)

**概要**: 完全自律型AI開発オペレーションプラットフォーム。GitHub as OS アーキテクチャに基づき、Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

---

## 📚 Context Index - Just-In-Time Loading

**必要なコンテキストを動的にロード**

### Category List

| Category | File | Priority | Description |
|----------|------|----------|-------------|
| **Core Rules** | [core-rules.md](.claude/context/core-rules.md) | ⭐⭐⭐⭐⭐ | MCP First, Benchmark Protocol, Context7 |
| **Agents** | [agents.md](.claude/context/agents.md) | ⭐⭐⭐⭐ | 14 Agents実装済み + 10 Agents計画中 |
| **Architecture** | [architecture.md](.claude/context/architecture.md) | ⭐⭐⭐⭐ | Cargo Workspace, GitHub OS, Worktree |
| **Development** | [development.md](.claude/context/development.md) | ⭐⭐⭐ | Rust/TypeScript規約、テスト、CI/CD |
| **Entity-Relation** | [entity-relation.md](.claude/context/entity-relation.md) | ⭐⭐⭐ | 12 Entities, 27 Relations, N1/N2/N3記法 |
| **Labels** | [labels.md](.claude/context/labels.md) | ⭐⭐⭐ | 53 Label体系、10カテゴリ |
| **Worktree** | [worktree.md](.claude/context/worktree.md) | ⭐⭐⭐ | Worktreeライフサイクル、並列実行 |
| **Rust** | [rust.md](.claude/context/rust.md) | ⭐⭐⭐ | Rust 2021 Edition開発ガイド |
| **TypeScript** | [typescript.md](.claude/context/typescript.md) | ⭐ | レガシーTypeScript参考 |
| **Protocols** | [protocols.md](.claude/context/protocols.md) | ⭐⭐ | タスク管理、報告プロトコル |
| **External Deps** | [external-deps.md](.claude/context/external-deps.md) | ⭐⭐ | Context7、MCP Servers |

**完全Index**: [.claude/context/INDEX.md](.claude/context/INDEX.md)

---

## 🚨 Critical Rules - 全タスク実行前に必読

### Rule 1: MCP First Approach ⭐⭐⭐⭐⭐

**"全てのタスク実行前に、まずMCPの活用可能性を検討する"**

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**詳細**: [core-rules.md](.claude/context/core-rules.md) | [MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md)

### Rule 2: Benchmark Implementation Protocol ⭐⭐⭐⭐⭐

**"公式ハーネス必須 - 独自実装禁止"**

```bash
# 実装前チェック（必須）
cat .claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md
```

**適用対象**: SWE-bench Pro, AgentBench, HAL, Galileo等の公式ベンチマーク

**詳細**: [core-rules.md](.claude/context/core-rules.md) | [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md)

### Rule 3: Context7 Usage ⭐⭐⭐⭐⭐

**"外部ライブラリ参照時は必ずContext7使用"**

```
"Use context7 to get the latest Tokio async runtime documentation"
```

**詳細**: [core-rules.md](.claude/context/core-rules.md) | [external-deps.md](.claude/context/external-deps.md)

---

## 🏗️ Project Structure

```
crates/
├── miyabi-types/          # コア型定義（Agent, Task, Issue等）
├── miyabi-core/           # 共通ユーティリティ（config, logger）
├── miyabi-cli/            # CLIツール (bin) - 15コマンド実装
├── miyabi-agents/         # Agent実装（14個実装済み + 10個計画中）
├── miyabi-github/         # GitHub API統合（octocrab wrapper）
├── miyabi-worktree/       # Git Worktree管理
├── miyabi-llm/            # LLM抽象化層（GPT-OSS-20B、Groq/vLLM/Ollama）
├── miyabi-knowledge/      # ナレッジ管理システム（NEW v0.1.1）
├── miyabi-voice-guide/    # VOICEVOX音声ガイダンス
└── miyabi-mcp-server/     # MCP Server（JSON-RPC 2.0）
```

**詳細**: [architecture.md](.claude/context/architecture.md) | [CLI詳細](#-cli---)

---

## 🤖 Agents - 自律型実行Agent

### ✅ 実装済みAgent (14個)

**💼 Business Agents (14個) - Rust実装完了**
- **戦略・企画系** (6個): AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
- **マーケティング系** (5個): MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
- **営業・顧客管理系** (3個): Sales, CRM, Analytics

### 📋 計画中Agent (10個 - Spec fileのみ)

**🔧 Coding Agents (3個)**
- **DiscordCommunityAgent**: Discordコミュニティ管理
- **HooksIntegrationAgent**: Git Hooks統合
- **ImageGenAgent**: 画像生成Agent

**💼 Business Agents (7個)**
- **HonokaAgent**: AI秘書Agent
- **JonathanIveDesignAgent**: デザイン戦略Agent
- **LPGenAgent**: ランディングページ生成
- **NoteAgent**: note.com記事生成
- **SlideGenAgent**: スライド生成
- **NarrationAgent**: 音声ナレーション生成
- **ImageGenAgent**: ビジネス向け画像生成

### 🎯 参考: 過去の7 Coding Agents構想
- CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent
- **現状**: 個別crateではなく、統合Agent設計に移行中

**詳細**: [agents.md](.claude/context/agents.md) | [AGENT_CHARACTERS.md](.claude/agents/AGENT_CHARACTERS.md)

---

## 🚀 Quick Start

### 🎬 初回セットアップ（3ステップ）

```bash
# 1. ビルド
cargo build --release

# 2. セットアップウィザード起動
miyabi setup

# 3. プロジェクトステータス確認
miyabi status
```

**環境変数設定**（セットアップで自動設定される）:
- `GITHUB_TOKEN` - GitHubアクセストークン
- `ANTHROPIC_API_KEY` - Claude APIキー（Agent実行用）
- `DEVICE_IDENTIFIER` - デバイス識別子

### CLI実行
```bash
# ビルド
cargo build --release

# 単一Agent実行
miyabi agent coordinator --issue 270

# 並列実行（Worktreeベース）
miyabi parallel --issues 270,271,272 --concurrency 3

# シンプルエイリアス（推奨）
miyabi work-on 270

# Infinity Mode（全Issue自動処理）
miyabi infinity --concurrency 3 --sprint-size 5

# 初回セットアップ
miyabi setup
```

### テスト
```bash
cargo test --all
cargo clippy -- -D warnings
cargo fmt
```

**詳細**: [rust.md](.claude/context/rust.md) | [development.md](.claude/context/development.md) | [CLI完全ガイド](#-cli---)

---

## 🎮 CLI - コマンドラインインターフェース

**実装**: `crates/miyabi-cli/src/` (Rust 2021 Edition)

### 📋 主要コマンド（全15コマンド）

#### 🏗️ プロジェクト管理
- **`miyabi init <name>`** - 新規プロジェクト作成
  - 💡 使用シーン: 新しいプロジェクトをMiyabi対応で立ち上げる
- **`miyabi install`** - 既存プロジェクトへのインストール
  - 💡 使用シーン: 既存Gitリポジトリに後からMiyabiを導入
- **`miyabi setup`** - インタラクティブ設定ウィザード
  - 💡 使用シーン: 環境変数・APIキーの初回設定
- **`miyabi status`** - プロジェクトステータス確認
  - 💡 使用シーン: Agent実行状況やWorktreeの健全性チェック

#### 🤖 Agent実行
- **`miyabi agent <type> --issue <num>`** - 単一Agent実行
  - 💡 使用シーン: 特定のAgentタイプを明示的に指定して実行
- **`miyabi parallel --issues <nums> --concurrency <n>`** - 並列Agent実行
  - 💡 使用シーン: 複数Issueを同時に処理して時間短縮
- **`miyabi work-on <issue>`** - タスク実行（最もシンプル・推奨）
  - 💡 使用シーン: Issue番号だけ指定して即座に作業開始
- **`miyabi exec <task>`** - LLM駆動自律タスク実行
  - 💡 使用シーン: Issueを作らず、自然言語でタスクを実行

#### 📊 データ管理
- **`miyabi knowledge <cmd>`** - ナレッジベース管理
  - 💡 使用シーン: コードベース検索・RAG統合
- **`miyabi worktree <cmd>`** - Worktree管理
  - 💡 使用シーン: 孤立Worktreeのクリーンアップ
- **`miyabi session <cmd>`** - セッション管理
  - 💡 使用シーン: 過去のAgent実行履歴を分析

#### ♾️ 高度な機能
- **`miyabi infinity`** - 完全自律連続実行
  - 💡 使用シーン: リポジトリ内の全Issueを自動処理
- **`miyabi loop <cmd>`** - 無限フィードバックループ
  - 💡 使用シーン: 継続的な品質改善サイクル
- **`miyabi mode <cmd>`** - アダプティブモードシステム
  - 💡 使用シーン: タスク特性に応じたAgent動作切り替え

#### 💬 対話機能
- **`miyabi chat`** - 対話型REPLチャット
  - 💡 使用シーン: Claudeと対話しながらタスクを進める

### 🎛️ グローバルオプション

```bash
# JSON形式出力（AIエージェント向け）
miyabi --json <command>

# 詳細ログ出力
miyabi --verbose <command>

# バージョン確認
miyabi --version

# ヘルプ表示
miyabi --help
miyabi <command> --help  # コマンド別ヘルプ
```

### 📖 よく使うパターン

```bash
# 🎬 パターン1: 新規Issue対応
miyabi work-on 270           # Issueに取り組む
miyabi status --watch        # 進捗監視

# 🚀 パターン2: 複数Issue一括処理
miyabi parallel --issues 270,271,272 --concurrency 3

# ♾️ パターン3: 全自動モード
miyabi infinity              # リポジトリ内全Issue処理

# 🔍 パターン4: トラブルシューティング
miyabi status               # 現状確認
miyabi worktree list        # Worktree一覧
miyabi session list         # セッション履歴
miyabi worktree prune       # クリーンアップ
```

### 🎤 音声ガイダンス（VOICEVOX統合）
- プロジェクト作成完了時: "プロジェクト{name}を作成しました"
- Issue処理開始時: "Issue #{num}の処理を開始します"
- Issue処理完了時: "Issue #{num}が完了しました"
- Infinity Mode開始時: "Infinity Modeを開始します"
- 初回起動時: "Welcome to Miyabi"

### 🛡️ セーフティ機能
- **Worktree保護**: 削除時の自動ディレクトリチェック
- **自動リカバリ**: エラー時にリポジトリルートへ自動移動
- **クラッシュ防止**: Bashセッション保護機構
- **エラーハンドリング**: 分かりやすいエラーメッセージと復旧ガイド

**詳細**: `crates/miyabi-cli/src/main.rs:1-543`

---

## 📖 Core Documentation

**Entity-Relation Model**:
- [ENTITY_RELATION_MODEL.md](docs/ENTITY_RELATION_MODEL.md) - 12種類のEntity定義と27の関係性マップ

**Templates**:
- [TEMPLATE_MASTER_INDEX.md](docs/TEMPLATE_MASTER_INDEX.md) - 88ファイルの統合テンプレートインデックス

**Labels**:
- [LABEL_SYSTEM_GUIDE.md](docs/LABEL_SYSTEM_GUIDE.md) - 53ラベル体系完全ガイド

**Agent Specs**:
- Coding: `.claude/agents/specs/coding/*.md` (10 specs: 7基本 + 3計画中)
- Business: `.claude/agents/specs/business/*.md` (21 specs: 14実装済み + 7計画中)

**Agent Prompts**:
- `.claude/agents/prompts/coding/*.md` (6ファイル)

---

## 🔐 Environment Variables

```bash
export GITHUB_TOKEN=ghp_xxx        # GitHubアクセストークン
export ANTHROPIC_API_KEY=sk-xxx    # Anthropic APIキー（Agent実行時）
export DEVICE_IDENTIFIER=MacBook   # デバイス識別子
```

---

## 🔗 Related Links

**Project**:
- **Repository**: https://github.com/ShunsukeHayashi/Miyabi
- **Landing Page**: https://shunsukehayashi.github.io/Miyabi/landing.html

**NPM Packages** (レガシー):
- **CLI**: https://www.npmjs.com/package/miyabi
- **SDK**: https://www.npmjs.com/package/miyabi-agent-sdk

---

## 📋 Usage Pattern Examples

### Pattern 1: Agent開発タスク
```
必要なContext Module:
1. core-rules.md (MCP確認)
2. agents.md (Agent仕様)
3. rust.md (Rust規約)
4. development.md (テスト規約)
```

### Pattern 2: Issue処理タスク
```
必要なContext Module:
1. core-rules.md (MCP確認)
2. labels.md (Label体系)
3. worktree.md (並列実行)
4. protocols.md (報告プロトコル)
```

### Pattern 3: ベンチマーク実装タスク
```
必要なContext Module:
1. core-rules.md (Benchmark Protocol)
2. external-deps.md (Context7)
3. development.md (CI/CD)
```

---

**このファイルはClaude Codeが自動参照します。詳細なコンテキストは`.claude/context/*.md`を動的にロードしてください。**


Output ALL ：日本語で書くこと