# Miyabi - Claude Code Project Context

**Last Updated**: 2025-10-26
**Version**: 2.0.1 (Agent数整合性修正)

このファイルは、Claude Codeが自動的に参照するプロジェクトコンテキストファイルです。

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
├── miyabi-cli/            # CLIツール (bin)
├── miyabi-agents/         # Agent実装（14個実装済み + 10個計画中）
├── miyabi-github/         # GitHub API統合（octocrab wrapper）
├── miyabi-worktree/       # Git Worktree管理
├── miyabi-llm/            # LLM抽象化層（GPT-OSS-20B、Groq/vLLM/Ollama）
├── miyabi-knowledge/      # ナレッジ管理システム（NEW v0.1.1）
└── miyabi-mcp-server/     # MCP Server（JSON-RPC 2.0）
```

**詳細**: [architecture.md](.claude/context/architecture.md)

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

### CLI実行
```bash
# ビルド
cargo build --release

# 単一Agent実行
./target/release/miyabi agent run coordinator --issue 270

# 並列実行（Worktreeベース）
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

### テスト
```bash
cargo test --all
cargo clippy -- -D warnings
cargo fmt
```

**詳細**: [rust.md](.claude/context/rust.md) | [development.md](.claude/context/development.md)

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
