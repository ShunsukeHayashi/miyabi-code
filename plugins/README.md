# Miyabi Plugin Marketplace

完全自律型AI開発オペレーションプラットフォーム **Miyabi** の公式プラグインマーケットプレイス

## 🚀 インストール方法

### マーケットプレイスの追加

Claude Code で以下を実行:

```bash
/plugin marketplace add customer-cloud/miyabi-private
```

または、ローカルで:

```bash
/plugin marketplace add ./path/to/miyabi-private
```

### プラグインのインストール

```bash
# 完全パッケージ (推奨)
/plugin install miyabi-full@miyabi-official-plugins

# 個別インストール
/plugin install miyabi-coding-agents@miyabi-official-plugins
/plugin install miyabi-business-agents@miyabi-official-plugins
/plugin install miyabi-skills@miyabi-official-plugins
/plugin install miyabi-commands@miyabi-official-plugins
```

## 📦 利用可能なプラグイン

| プラグイン | 説明 | カテゴリ |
|-----------|------|----------|
| **miyabi-full** | 完全パッケージ (25 Agents + 22 Skills + 50 Commands) | automation |
| **miyabi-coding-agents** | 9 Coding Agents | development |
| **miyabi-business-agents** | 16 Business Agents | business |
| **miyabi-skills** | 22 Development Skills | development |
| **miyabi-commands** | 50+ Slash Commands | productivity |
| **miyabi-mcp-servers** | MCP Server Configurations | integrations |
| **miyabi-hooks** | Pre/Post Tool Hooks | automation |
| **miyabi-honoka** | 穂花 Agent (Udemy コース作成) | education |
| **miyabi-water-spider** | システム監視 Agent | monitoring |
| **miyabi-guardian** | 障害対応 Agent | security |

## 🤖 Coding Agents (9個)

| Agent | キャラクター名 | 役割 |
|-------|--------------|------|
| CoordinatorAgent | しきるん 🔴 | タスク分解・並列実行制御 |
| CodeGenAgent | つくるん 🟢 | AI駆動コード生成 |
| ReviewAgent | めだまん 🔵 | コード品質レビュー |
| IssueAgent | みつけるん 🔵 | Issue分析・ラベル推論 |
| PRAgent | まとめるん 🟡 | Pull Request作成 |
| DeploymentAgent | はこぶん 🟡 | CI/CDデプロイ自動化 |
| RefresherAgent | ぴかぴかん 🟡 | Issue状態監視・更新 |
| TmuxControlAgent | つむっくん 🟡 | tmuxセッション管理 |
| HooksIntegration | つなぐん 🟡 | イベント監視・統合 |

## 💼 Business Agents (16個)

| Agent | キャラクター名 | 役割 |
|-------|--------------|------|
| AIEntrepreneurAgent | あきんどさん 🔴 | 8ステップビジネスプラン |
| SelfAnalysisAgent | じぶんさん 🔵 | SWOT分析 |
| MarketResearchAgent | しらべるん 🔵 | 市場調査・競合分析 |
| PersonaAgent | なりきりん 🔵 | ペルソナ設計 |
| ProductConceptAgent | つくろん 🟢 | MVP設計 |
| ProductDesignAgent | かくん 🟢 | サービス詳細設計 |
| ContentCreationAgent | かくちゃん 🟢 | コンテンツ制作 |
| FunnelDesignAgent | みちびきん 🟢 | 導線設計 |
| SNSStrategyAgent | つぶやきん 🟢 | SNS戦略 |
| MarketingAgent | ひろめるん 🟢 | マーケティング施策 |
| SalesAgent | うるん 🟢 | セールスプロセス |
| CRMAgent | おきゃくさま 🟢 | 顧客管理・LTV最大化 |
| AnalyticsAgent | かぞえるん 🔵 | データ分析・PDCA |
| YouTubeAgent | どうがん 🟢 | YouTube最適化 |
| NoteAgent | かきこちゃん 🟢 | note.com記事執筆 |
| ImageGenAgent | えがくん 🟢 | 画像生成 |

## 🛠️ Skills (22個)

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

## 📜 ライセンス

Apache-2.0

## 🔗 リンク

- [Miyabi Project](https://github.com/customer-cloud/miyabi-private)
- [Documentation](.claude/README.md)
- [Agent Characters](.claude/agents/AGENT_CHARACTERS.md)
