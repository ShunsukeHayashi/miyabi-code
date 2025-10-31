# Agent System - Autonomous Agents

**Last Updated**: 2025-10-31
**Version**: 2.1.0
**Priority**: ⭐⭐⭐⭐

## 🔒 Agent実行前の必須プロトコル

**全てのAgent実行・タスク開始時に以下を必ず実行**

### ✅ 作業開始チェックリスト

```bash
□ Step 1: gh issue view <number> でIssue確認
□ Step 2: gh issue comment で作業宣言（他Agentとのバッティング防止）
□ Step 3: gh issue edit でラベル変更（Ready → In Progress）
□ Step 4: git worktree作成 & 移動
□ Step 5: 作業開始
```

**詳細**: [CLAUDE.md](../../CLAUDE.md) の「必須作業プロトコル」を参照

---

## 🤖 Agent概要

Miyabiは自律型Agentシステムを提供します：
- **✅ 実装済み** (14個): Business Agents - Rust実装完了
- **📋 計画中** (10個): Spec fileのみ、今後実装予定

## ✅ 実装済みAgent (14個)

### 💼 Business Agents (14個) - Rust実装完了

### 🎯 戦略・企画系 (6個)
- **AIEntrepreneurAgent** (あきんどさん): 包括的ビジネスプラン作成 ❌
- **ProductConceptAgent** (けいかくん): USP・収益モデル設計 ✅
- **ProductDesignAgent** (つくるん2号): サービス詳細設計 ✅
- **FunnelDesignAgent** (みちしるべん): 顧客導線最適化 ✅
- **PersonaAgent** (よみとるん): ターゲット顧客ペルソナ設計 ✅
- **SelfAnalysisAgent** (しらべるん): キャリア・スキル分析 ✅

### 📢 マーケティング系 (5個)
- **MarketResearchAgent** (しらべるん2号): 市場調査・競合分析 ✅
- **MarketingAgent** (ひろめるん): 広告・SEO・SNS戦略 ✅
- **ContentCreationAgent** (かくちゃん): コンテンツ制作計画 ✅
- **SNSStrategyAgent** (つぶやくん): SNS戦略立案 ✅
- **YouTubeAgent** (どうがくん): YouTube運用最適化 ✅

### 💼 営業・顧客管理系 (3個)
- **SalesAgent** (うるん): セールスプロセス最適化 ✅
- **CRMAgent** (ささえるん): 顧客満足度向上 ✅
- **AnalyticsAgent** (かぞえるん): データ分析・PDCA ✅

---

## 📋 計画中Agent (10個 - Spec fileのみ)

### 🔧 Coding Agents (3個)

| Agent | 役割 | ステータス |
|-------|------|-----------|
| **DiscordCommunityAgent** | Discordコミュニティ管理・運営 | 📋 Spec作成済み |
| **HooksIntegrationAgent** | Git Hooks統合・自動化 | 📋 Spec作成済み |
| **ImageGenAgent** | 画像生成（開発用） | 📋 Spec作成済み |

### 💼 Business Agents (7個)

| Agent | 役割 | ステータス |
|-------|------|-----------|
| **HonokaAgent** | AI秘書・タスク管理支援 | 📋 Spec作成済み |
| **JonathanIveDesignAgent** | デザイン戦略・UI/UX設計 | 📋 Spec作成済み |
| **LPGenAgent** | ランディングページ生成 | 📋 Spec作成済み |
| **NoteAgent** | note.com記事生成 | 📋 Spec作成済み |
| **SlideGenAgent** | プレゼンスライド生成 | 📋 Spec作成済み |
| **NarrationAgent** | 音声ナレーション生成（VOICEVOX） | 📋 Spec作成済み |
| **ImageGenAgent** | 画像生成（ビジネス用） | 📋 Spec作成済み |

### 🎯 参考: 過去の7 Coding Agents構想

従来は7個のCoding Agentsを個別crateとして開発する予定でした：

| Agent | 役割 | 現状 |
|-------|------|------|
| CoordinatorAgent (しきるん) | タスク統括・DAG分解 | 🔄 統合Agent設計に移行中 |
| CodeGenAgent (つくるん) | AI駆動コード生成 | 🔄 統合Agent設計に移行中 |
| ReviewAgent (めだまん) | コード品質レビュー | 🔄 統合Agent設計に移行中 |
| IssueAgent (みつけるん) | Issue分析・ラベリング | 🔄 統合Agent設計に移行中 |
| PRAgent (まとめるん) | PR自動作成 | 🔄 統合Agent設計に移行中 |
| DeploymentAgent (はこぶん) | CI/CDデプロイ | 🔄 統合Agent設計に移行中 |
| RefresherAgent (つなぐん) | Issue状態監視 | 🔄 統合Agent設計に移行中 |

**設計変更の理由**:
- 個別crateよりも統合Agentの方が柔軟性が高い
- 役割の境界が曖昧で、統合した方が効率的
- Business Agentsの成功パターンを適用

---

## 🎮 キャラクター名システム

実装済みのBusiness Agentsは、親しみやすい日本語のキャラクター名で呼び出せます。

**色分けルール**:
- 🔴 **リーダー** (1キャラ): あきんどさん → 同時実行NG
- 🟢 **実行役** (10キャラ): けいかくん、つくるん2号、かくちゃん等 → 並列実行OK ✅
- 🔵 **分析役** (3キャラ): しらべるん、しらべるん2号、かぞえるん → 並列実行OK ✅

**使用例**:
```
「あきんどさん でビジネスプラン作成」
「かくちゃん と どうがくん を並列実行してコンテンツ制作」
```

**詳細**: [AGENT_CHARACTERS.md](../agents/AGENT_CHARACTERS.md)

## 🏗️ BaseAgent Pattern

全AgentはRust `BaseAgent` traitを実装:

```rust
use miyabi_agents::BaseAgent;
use miyabi_types::{Task, AgentResult, MiyabiError};
use async_trait::async_trait;

#[async_trait]
impl BaseAgent for MyAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
        // Implementation
        Ok(AgentResult::success(data))
    }
}
```

## 📚 Agent仕様ドキュメント

**実装済みAgent仕様**: `.claude/agents/specs/business/*.md` (14ファイル)
- `ai-entrepreneur-agent.md`, `product-concept-agent.md`, `analytics-agent.md`, etc.

**計画中Agent仕様**:
- Coding: `.claude/agents/specs/coding/*.md` (10 specs: 7基本 + 3計画中)
- Business: `.claude/agents/specs/business/*.md` (7 specs: 追加Agent)

**実行プロンプト**: `.claude/agents/prompts/` (Business/Coding)
- Worktree内での実行ガイド
- ステップバイステップ手順
- 成功基準とチェックリスト

## 🚀 Agent実行

### CLI実行
```bash
# Business Agent実行
miyabi agent run ai-entrepreneur --issue 270

# 並列実行（Worktreeベース）
miyabi agent run market-research --issues 270,271,272 --concurrency 3
```

### Rust API
```rust
use miyabi_agent_business::AIEntrepreneurAgent;
use miyabi_agent_core::BaseAgent;

let agent = AIEntrepreneurAgent::new(config);
let result = agent.execute(&task).await?;
```

### MCP Server経由
```json
{
  "method": "agents/ai-entrepreneur/execute",
  "params": { "issue_number": 270 }
}
```

## 🔗 Related Modules

- **Architecture**: [architecture.md](./architecture.md) - Cargo Workspace構造
- **Worktree**: [worktree.md](./worktree.md) - 並列実行プロトコル
- **Labels**: [labels.md](./labels.md) - Agent割り当てLabel

## 📖 Detailed Documentation

- **Agent Operations Manual**: `docs/AGENT_OPERATIONS_MANUAL.md`
- **Rust Implementation**:
  - Business Agents: `crates/miyabi-agent-business/src/`
  - Agent Core: `crates/miyabi-agent-core/src/`
- **Type Definitions**: `crates/miyabi-types/src/agent.rs`

## 📊 実装ロードマップ

**Phase 1: Business Agents** (✅ 完了 v1.0.0)
- 14個のBusiness Agents実装完了
- Rust crateとして提供

**Phase 2: Coding Agents** (📋 計画中 v1.2.0)
- 統合Agent設計に移行
- 3個の追加Agent（Discord, Hooks, ImageGen）

**Phase 3: Advanced Business Agents** (📋 計画中 v1.3.0)
- 7個の高度なBusiness Agents
- AI秘書、デザイン戦略、コンテンツ生成等
