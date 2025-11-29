# Miyabi Full Plugin

**Version**: 2.0.0
**Category**: Automation
**License**: Apache-2.0

**Miyabi 完全パッケージ** - 完全自律型AI開発オペレーションプラットフォームの全機能を1つのプラグインで提供。

## Included Components

| コンポーネント | 数量 | 説明 |
|--------------|------|------|
| **Agents** | 25+ | Coding + Business Agents |
| **Skills** | 22 | 開発ワークフロースキル |
| **Commands** | 50+ | スラッシュコマンド |
| **MCP Servers** | 24 | 外部サービス統合 |
| **Hooks** | 10+ | Pre/Post ツールフック |

## Installation

```bash
# マーケットプレイス追加
/plugin marketplace add customer-cloud/miyabi-private

# フルパッケージインストール (推奨)
/plugin install miyabi-full@miyabi-official-plugins

# Claude Code 再起動
```

## Quick Start

### 1. Issue自動処理

```
/agent-run 270
```

GitHub Issue #270 を自動で:
- 解析
- タスク分解
- コード生成
- レビュー
- PR作成

### 2. コードレビュー

```
/review --pr=42
```

### 3. デプロイ

```
/deploy --env=production
```

### 4. セキュリティスキャン

```
/security-scan --deep
```

---

## Agents (25+)

### Coding Agents (9個)

| Agent | キャラクター | 役割 |
|-------|------------|------|
| CoordinatorAgent | 統 (Subaru) 🎯 | タスク統括・並行実行 |
| CodeGenAgent | 源 (Gen) 💻 | AI駆動コード生成 |
| ReviewAgent | 眼 (Medama) 👁️ | コード品質判定 |
| IssueAgent | 探 (Mitsuke) 🔍 | Issue分析・ラベル推論 |
| PRAgent | 纏 (Matome) 📦 | PR自動作成 |
| DeploymentAgent | 運 (Hakobu) 🚀 | CI/CDデプロイ |
| RefresherAgent | 輝 (Pikapika) ✨ | Issue状態監視 |
| TmuxControlAgent | 紡 (Tsumugu) 🧵 | tmux管理 |
| HooksIntegration | 繋 (Tsunagu) 🔗 | イベント監視 |

### Business Agents (16個)

| Agent | キャラクター | フェーズ |
|-------|------------|---------|
| AIEntrepreneurAgent | あきんどさん 🏢 | 全体統括 |
| SelfAnalysisAgent | じぶんさん 🪞 | Phase 1 |
| MarketResearchAgent | しらべるん 🔬 | Phase 2 |
| PersonaAgent | なりきりん 🎭 | Phase 3 |
| ProductConceptAgent | つくろん 💡 | Phase 4 |
| ProductDesignAgent | かくん 🎨 | Phase 5 |
| ContentCreationAgent | かくちゃん ✏️ | Phase 6 |
| FunnelDesignAgent | みちびきん 🛤️ | Phase 7 |
| SNSStrategyAgent | つぶやきん 📱 | Phase 8 |
| MarketingAgent | ひろめるん 📣 | Phase 9 |
| SalesAgent | うるん 🤝 | Phase 10 |
| CRMAgent | おきゃくさま 💚 | Phase 11 |
| AnalyticsAgent | かぞえるん 📊 | Phase 12 |
| YouTubeAgent | どうがん 🎬 | コンテンツ |
| NoteAgent | かきこちゃん 📝 | コンテンツ |
| ImageGenAgent | えがくん 🖼️ | コンテンツ |

---

## Skills (22個)

- agent-execution
- business-strategy-planning
- claude-code-x
- content-marketing-strategy
- context-eng
- debugging-troubleshooting
- dependency-management
- documentation-generation
- git-workflow
- growth-analytics-dashboard
- issue-analysis
- market-research-analysis
- paper2agent
- performance-analysis
- project-setup
- rust-development
- sales-crm-management
- security-audit
- tdd-workflow
- tmux-iterm-integration
- voicevox

**使用方法**:
```
skill: "rust-development"
```

---

## Commands (50+)

### Core Commands

| コマンド | 説明 |
|---------|------|
| `/agent-run` | Issue自動処理 |
| `/deploy` | デプロイ実行 |
| `/review` | コードレビュー |
| `/security-scan` | セキュリティスキャン |
| `/daily-update` | 日次レポート |
| `/verify` | システム検証 |
| `/create-issue` | Issue作成 |
| `/generate-docs` | ドキュメント生成 |

**全コマンド一覧**: `/help` で確認

---

## MCP Servers (24個)

### AI Integration
- gemini3-uiux-designer
- gemini3-adaptive-runtime
- miyabi-codex
- miyabi-openai-assistant

### Communication
- lark-openapi-enhanced
- lark-wiki-agents
- lark-mcp-enhanced
- miyabi-sse-gateway

### DevOps
- miyabi-github
- miyabi-tmux
- miyabi-git-inspector

### Monitoring
- miyabi-log-aggregator
- miyabi-network-inspector
- miyabi-process-inspector
- miyabi-resource-monitor

### Knowledge
- miyabi-obsidian

### Core
- miyabi-mcp (Rust A2A Bridge)

---

## Hooks

### Pre-Tool Hooks
- Permission Check
- Git Status Check
- Dangerous Command Block

### Post-Tool Hooks
- Completion Notification
- Execution Logging
- Metrics Update

### Session Hooks
- MCP Environment Init
- Session Start/End

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Miyabi Full Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Claude Code                           │   │
│  │              (Plugin Host Environment)                    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────────────┐    │
│  │                        │                                 │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ Agents  │  │ Skills  │  │Commands │  │  Hooks  │    │    │
│  │  │  (25+)  │  │  (22)   │  │  (50+)  │  │  (10+)  │    │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │    │
│  │       │            │            │            │          │    │
│  │       └────────────┴────────────┴────────────┘          │    │
│  │                           │                              │    │
│  │  ┌────────────────────────▼────────────────────────┐    │    │
│  │  │              MCP Servers (24)                    │    │    │
│  │  │   Gemini 3 | Lark | GitHub | Obsidian | tmux    │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │                                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    External Services                      │   │
│  │   GitHub | Lark | Firebase | AWS | Vercel | VOICEVOX     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Plugin Directory Structure

```
plugins/miyabi-full/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   ├── coordinator-agent.md
│   ├── codegen-agent.md
│   └── ... (25+ agents)
├── skills/
│   ├── rust-development/
│   ├── tdd-workflow/
│   └── ... (22 skills)
├── commands/
│   ├── agent-run.md
│   ├── deploy.md
│   └── ... (50+ commands)
├── hooks/
│   └── hooks.json
├── .mcp.json
└── README.md
```

---

## Environment Variables

必須環境変数:

```bash
# Claude API
export ANTHROPIC_API_KEY="sk-ant-..."

# GitHub
export GITHUB_TOKEN="ghp_..."

# Gemini (オプション)
export GEMINI_API_KEY="..."

# Lark (オプション)
export LARK_APP_ID="..."
export LARK_APP_SECRET="..."
```

---

## Comparison with Individual Plugins

| 機能 | miyabi-full | 個別プラグイン |
|------|------------|---------------|
| 全Agent | ✅ | 分割インストール |
| 全Skills | ✅ | 分割インストール |
| 全Commands | ✅ | 分割インストール |
| MCP統合 | ✅ | 別途インストール |
| Hooks統合 | ✅ | 別途インストール |
| インストール数 | 1 | 6-10 |
| 推奨 | **開発チーム** | 特定機能のみ必要な場合 |

---

## Support

- **GitHub Issues**: [miyabi-private/issues](https://github.com/customer-cloud/miyabi-private/issues)
- **Documentation**: [.claude/README.md](../../.claude/README.md)
- **Lark**: hayashi.s@customercloud.ai

---

**Author**: Shunsuke Hayashi
**Created**: 2025-11-29
**Version**: 2.0.0
