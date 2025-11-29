# Miyabi Plugin Marketplace

完全自律型AI開発オペレーションプラットフォーム **Miyabi** の公式プラグインマーケットプレイス

> **"World = Miyabi = Society"** - Agent たちの活動、相互作用、学習の累積が World を構成する

## Quick Start

```bash
# マーケットプレイスの追加
/plugin marketplace add customer-cloud/miyabi-private

# 完全パッケージのインストール (推奨)
/plugin install @miyabi/suite

# または基盤から順番にインストール
/plugin install @miyabi/core    # 必須: 基盤プラグイン
/plugin install @miyabi/dev-agents
/plugin install @miyabi/biz-agents
```

## 利用可能なプラグイン (11個)

### Foundation (基盤) - **必須**

| プラグイン | 説明 | 重要度 |
|-----------|------|--------|
| **@miyabi/core** | Miyabi Society/Operationを再現するための基盤 (Source of Truth, Context, Principles) | **必須** |

### Full Package (完全パッケージ)

| プラグイン | 説明 | カテゴリ |
|-----------|------|----------|
| **@miyabi/suite** | 完全パッケージ (25 Agents + 22 Skills + 50 Commands + MCP + Hooks) | automation |

### Individual Plugins (個別プラグイン)

| プラグイン | 説明 | カテゴリ |
|-----------|------|----------|
| **@miyabi/dev-agents** | 9 Coding Agents | development |
| **@miyabi/biz-agents** | 16 Business Agents | business |
| **@miyabi/skills** | 22 Development Skills | development |
| **@miyabi/cli** | 50+ Slash Commands | productivity |
| **@miyabi/mcp** | MCP Server Configurations | integrations |
| **@miyabi/hooks** | Pre/Post Tool Hooks | automation |
| **@miyabi/honoka** | 穂花 Agent (Udemy コース作成) | education |
| **@miyabi/monitor** | システム監視 Agent | monitoring |
| **@miyabi/guardian** | 障害対応 Agent | security |

## @miyabi/core - The Heart of Miyabi

**@miyabi/core** は Miyabi Society を再現するための**心臓部**です。

### 含まれるもの

| コンポーネント | 内容 |
|---------------|------|
| **miyabi_def/** | 15 定義ファイル (Entities, Relations, Labels, Workflows, Agents, Skills) |
| **context/** | 31 コンテキストファイル (agents.md, architecture.md, protocols.md, etc.) |
| **principles/** | 15 リーダーシップ原則 (P₁-P₁₅) |
| **AGENT_CARD_TEMPLATE.md** | TCGスタイルのキャラクターカード定義 |
| **AGENT_CHARACTERS.md** | 24キャラクターの詳細設定 |
| **settings.json** | 開発環境設定 |
| **orchestra-config.yaml** | tmuxオーケストレーション設定 |

## Agent Card System (TCG Style)

各 Agent はトレーディングカードゲームのカードとして表現されます:

```
+------------------------------------------+
|  ★★★★★ LEGENDARY          [RED]         |
|                                          |
|              👔                          |
|            しきるん                       |
|                                          |
|  ========================================|
|  SHIKIROON                    Lv.100     |
|  統（すばる） - Task Orchestrator         |
|  ========================================|
|                                          |
|  HP: 9500  ATK: 85  DEF: 90              |
|  SPEED: 95  INT: 98  LUCK: 80            |
|                                          |
|  [SKILL] Task Decomposition              |
|  [SKILL] Agent Dispatch                  |
|  [ULTIMATE] Parallel Orchestration       |
|                                          |
|  "みんな、よろしく！全員で勝つぞ！"        |
|                                          |
|  No. 001 / CODING SERIES                 |
+------------------------------------------+
```

### Rarity Levels

| Rarity | Symbol | 該当Agent |
|--------|--------|-----------|
| **LEGENDARY** | ★★★★★ | CoordinatorAgent, AIEntrepreneurAgent |
| **EPIC** | ★★★★☆ | CodeGenAgent, ReviewAgent, MarketingAgent |
| **RARE** | ★★★☆☆ | PRAgent, SalesAgent, YouTubeAgent |
| **UNCOMMON** | ★★☆☆☆ | DeploymentAgent, NoteAgent |
| **COMMON** | ★☆☆☆☆ | HooksIntegration |

## Coding Agents (9個)

| Agent | キャラクター名 | 役割 | Rarity |
|-------|--------------|------|--------|
| CoordinatorAgent | しきるん | タスク分解・並列実行制御 | ★★★★★ |
| CodeGenAgent | つくるん | AI駆動コード生成 | ★★★★☆ |
| ReviewAgent | めだまん | コード品質レビュー | ★★★★☆ |
| IssueAgent | みつけるん | Issue分析・ラベル推論 | ★★★☆☆ |
| PRAgent | まとめるん | Pull Request作成 | ★★★☆☆ |
| DeploymentAgent | はこぶん | CI/CDデプロイ自動化 | ★★☆☆☆ |
| RefresherAgent | あらたん | Issue状態監視・更新 | ★★☆☆☆ |
| TmuxControlAgent | つばさん | tmuxセッション管理 | ★★☆☆☆ |
| HooksIntegration | つなぐん | イベント監視・統合 | ★☆☆☆☆ |

## Business Agents (16個)

| Agent | キャラクター名 | 役割 | Rarity |
|-------|--------------|------|--------|
| AIEntrepreneurAgent | あきんどさん | 8ステップビジネスプラン | ★★★★★ |
| SelfAnalysisAgent | じぶんさん | SWOT分析 | ★★★☆☆ |
| MarketResearchAgent | しらべるん | 市場調査・競合分析 | ★★★★☆ |
| PersonaAgent | なりきりん | ペルソナ設計 | ★★★☆☆ |
| ProductConceptAgent | つくろん | MVP設計 | ★★★★☆ |
| ProductDesignAgent | かくん | サービス詳細設計 | ★★★☆☆ |
| ContentCreationAgent | かくちゃん | コンテンツ制作 | ★★★☆☆ |
| FunnelDesignAgent | みちびきん | 導線設計 | ★★★☆☆ |
| SNSStrategyAgent | つぶやきん | SNS戦略 | ★★★☆☆ |
| MarketingAgent | ひろめるん | マーケティング施策 | ★★★★☆ |
| SalesAgent | うるん | セールスプロセス | ★★★☆☆ |
| CRMAgent | おきゃくさま | 顧客管理・LTV最大化 | ★★★☆☆ |
| AnalyticsAgent | かぞえるん | データ分析・PDCA | ★★★★☆ |
| YouTubeAgent | どうがん | YouTube最適化 | ★★★☆☆ |
| NoteAgent | かきこちゃん | note.com記事執筆 | ★★☆☆☆ |
| ImageGenAgent | えがくん | 画像生成 | ★★★☆☆ |

## Skills (22個)

| カテゴリ | スキル |
|---------|-------|
| **Coding** | rust-development, debugging-troubleshooting, git-workflow, performance-analysis, security-audit |
| **Agent Ops** | agent-execution, documentation-generation, issue-analysis, project-setup |
| **Business** | business-strategy-planning, content-marketing-strategy, market-research-analysis, sales-crm-management, growth-analytics-dashboard |
| **Integration** | tmux-iterm-integration, voicevox, context-eng, claude-code-x, paper2agent |
| **Quality** | tdd-workflow, dependency-management |

## Miyabi Society Formula

```
Agent_i = (𝒯_i, 𝒰_i, 𝒮_i, 𝒟_i, Ω_i, 𝒫)

where:
  𝒯_i : Tasks      - タスク
  𝒰_i : Tools      - ツール
  𝒮_i : Skills     - スキル
  𝒟_i : Todos      - TODO リスト
  Ω_i : Omega      - Agent 固有の変換関数
  𝒫   : Principles - 15 の原則 (共有)
```

## 15 Leadership Principles

| # | 原則 | 説明 |
|---|------|------|
| P₁ | Customer Obsession | 顧客を起点に考える |
| P₂ | Ownership | 自分の仕事に責任を持つ |
| P₃ | Invent and Simplify | 発明し、シンプルにする |
| P₄ | Are Right, A Lot | 多くの場合、正しい判断をする |
| P₅ | Learn and Be Curious | 学び、好奇心を持つ |
| P₆ | Hire and Develop the Best | 最高の人材を採用・育成する |
| P₇ | Insist on the Highest Standards | 最高水準を追求する |
| P₈ | Think Big | 大きく考える |
| P₉ | Bias for Action | 行動を優先する |
| P₁₀ | Frugality | 倹約する |
| P₁₁ | Earn Trust | 信頼を得る |
| P₁₂ | Dive Deep | 深く潜る |
| P₁₃ | Have Backbone; Disagree and Commit | 反対しても、決まったら従う |
| P₁₄ | Deliver Results | 結果を出す |
| **P₁₅** | **Human-Agent Harmony** | **人間とAgentの調和** |

## Dependency Graph

```
@miyabi/core (required)
    ├── @miyabi/suite ────────┐
    ├── @miyabi/dev-agents    │
    ├── @miyabi/biz-agents    │
    ├── @miyabi/skills        ├── All depend on @miyabi/core
    ├── @miyabi/cli           │
    ├── @miyabi/mcp           │
    ├── @miyabi/hooks         │
    ├── @miyabi/monitor       │
    └── @miyabi/guardian ─────┘

@miyabi/honoka
    ├── @miyabi/core
    └── @miyabi/biz-agents
```

## ライセンス

Apache-2.0

## リンク

- [Miyabi Project](https://github.com/customer-cloud/miyabi-private)
- [Documentation](.claude/README.md)
- [Agent Characters](.claude/agents/AGENT_CHARACTERS.md)
- [Agent Card Template](plugins/@miyabi-core/AGENT_CARD_TEMPLATE.md)

---

**"Collect all agents, build the ultimate team, conquer any task!"**
