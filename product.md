# Miyabi - Product Overview

**Version**: 1.0.0
**Last Updated**: 2026-01-05
**Status**: Active Development

---

## Vision

**Miyabi**は、完全自律型AI開発オペレーションプラットフォームです。GitHub as OSアーキテクチャに基づき、Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

> "開発の未来を、今日から。"

---

## Product Summary

| Attribute | Value |
|-----------|-------|
| **Name** | Miyabi (雅) |
| **Type** | Autonomous AI Development Platform |
| **Language** | Rust 2021 Edition |
| **Architecture** | Multi-Agent + MCP Ecosystem |
| **License** | Apache-2.0 |

---

## Core Components

### 1. Agent System (21 Agents)

#### Coding Agents (7)
| Agent | Role |
|-------|------|
| Coordinator | タスク調整・分配 |
| CodeGen | コード生成 |
| Review | コードレビュー |
| PR | プルリクエスト管理 |
| Deployment | デプロイ自動化 |
| Issue | Issue管理 |
| Refresher | コンテキスト更新 |

#### Business Agents (14)
| Agent | Role |
|-------|------|
| Market Research | 市場調査・分析 |
| Persona | ペルソナ設計 |
| Product Concept | 製品コンセプト策定 |
| Product Design | プロダクトデザイン |
| Content Creation | コンテンツ作成 |
| Funnel Design | ファネル設計 |
| SNS Strategy | SNS戦略立案 |
| Marketing | マーケティング実行 |
| Sales | 営業活動支援 |
| CRM | 顧客関係管理 |
| Analytics | 分析・レポート |
| YouTube | YouTube戦略 |
| Self Analysis | 自己分析 |
| AI Entrepreneur | AI起業家支援 |

### 2. MCP Server Ecosystem (28+ Servers)

#### Core Servers
- `miyabi-mcp` - メインMCPサーバー
- `miyabi-github` - GitHub操作
- `miyabi-tmux` - tmuxセッション管理
- `miyabi-obsidian` - Obsidian Vault操作

#### Integration Servers
- `miyabi-discord` - Discord連携
- `miyabi-oura` - Oura Ring健康データ
- `miyabi-lark` - Feishu/Lark連携
- `miyabi-line` - LINE Messaging
- `miyabi-x` - X (Twitter) API

#### Development Servers
- `miyabi-file-watcher` - ファイル監視
- `miyabi-log-aggregator` - ログ集約
- `miyabi-resource-monitor` - リソース監視
- `miyabi-codex` - Codex統合

### 3. Rust Crates (71 Crates)

```
crates/
├── miyabi-core/           # コア機能
├── miyabi-cli/            # CLIインターフェース
├── miyabi-agent-*/        # エージェント群
├── miyabi-llm-*/          # LLMプロバイダー
├── miyabi-mcp-*/          # MCPサーバー
├── miyabi-workflow/       # ワークフローDSL
├── miyabi-orchestrator/   # オーケストレーション
└── miyabi-tui/            # Terminal UI
```

---

## Key Features

### Autonomous Development
- Issue → Code → PR → Deploy の完全自動化
- Git Worktree による並列タスク実行
- 自己修復・自己改善機能

### Multi-Agent Coordination
- エージェント間通信プロトコル
- タスク依存関係の自動解決
- 分散実行・集約

### MCP First Architecture
- 全ツールをMCPサーバーとして抽象化
- プラグイン式の拡張性
- クロスプラットフォーム対応

### Intelligent Context Management
- コンテキストの自動更新
- 知識ベースとの連携
- 履歴・学習機能

---

## Target Users

| Segment | Use Case |
|---------|----------|
| Solo Developers | 個人開発の自動化・効率化 |
| Startups | 少人数での高速開発 |
| Enterprise | 大規模開発の品質管理 |
| AI Researchers | エージェント研究プラットフォーム |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Language | Rust 2021, TypeScript |
| Runtime | Tokio (async) |
| CLI | Clap, Dialoguer |
| TUI | Ratatui |
| Web | Axum, Tower |
| LLM | Anthropic, OpenAI, Google |
| Database | SQLite, PostgreSQL |
| Messaging | Discord, LINE, Lark |

---

## Roadmap

### Phase 1: Foundation (Completed)
- [x] Core agent architecture
- [x] GitHub integration
- [x] Basic MCP servers
- [x] CLI implementation

### Phase 2: Expansion (In Progress)
- [x] Business agents
- [x] Discord/Oura integration
- [ ] Advanced workflow DSL
- [ ] Cloud deployment

### Phase 3: Scale (Planned)
- [ ] Multi-tenant support
- [ ] Enterprise features
- [ ] Marketplace for agents
- [ ] SaaS offering

---

## Getting Started

```bash
# Build
cargo build --release

# Run CLI
./target/release/miyabi --help

# Run specific agent
miyabi agent run coordinator

# Check status
miyabi status
```

---

## Links

- **Repository**: https://github.com/ShunsukeHayashi/miyabi-private
- **Documentation**: ./docs/
- **API Reference**: ./docs/miyabi-api-reference.txt

---

*Miyabi - 開発の未来を、今日から。*
