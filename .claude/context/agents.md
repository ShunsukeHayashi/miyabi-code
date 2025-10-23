# Agent System - 21 Autonomous Agents

**Priority**: ⭐⭐⭐⭐

## 🤖 Agent概要

Miyabiは21個の自律型Agentを提供します：
- **Coding Agents** (7個): 開発運用・自動化
- **Business Agents** (14個): ビジネス戦略・マーケティング・営業

## 🔧 Coding Agents (7個)

| Agent | キャラクター名 | 役割 | 並列実行 |
|-------|---------------|------|---------|
| **CoordinatorAgent** | しきるん | タスク統括・DAG分解 | ❌ (リーダー) |
| **CodeGenAgent** | つくるん | AI駆動コード生成 | ✅ (実行役) |
| **ReviewAgent** | めだまん | コード品質レビュー | ✅ (実行役) |
| **IssueAgent** | みつけるん | Issue分析・ラベリング | ✅ (分析役) |
| **PRAgent** | まとめるん | Pull Request自動作成 | ⚠️ (サポート役) |
| **DeploymentAgent** | はこぶん | CI/CDデプロイ自動化 | ⚠️ (サポート役) |
| **RefresherAgent** | つなぐん | Issue状態監視・更新 | ✅ (分析役) |

## 💼 Business Agents (14個)

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

## 🎮 キャラクター名システム

技術的な名前の代わりに、親しみやすい日本語のキャラクター名で呼び出せます。

**色分けルール**:
- 🔴 **リーダー** (2キャラ): しきるん、あきんどさん → 同時実行NG
- 🟢 **実行役** (12キャラ): つくるん、めだまん等 → 並列実行OK ✅
- 🔵 **分析役** (5キャラ): みつけるん、しらべるん等 → 並列実行OK ✅
- 🟡 **サポート役** (3キャラ): まとめるん、はこぶん等 → 条件付き実行 ⚠️

**使用例**:
```
「しきるん で Issue #270 を処理」
「つくるん と めだまん を並列実行して」
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

**Coding Agents仕様**: `.claude/agents/specs/coding/*.md` (7ファイル)
- `coordinator-agent.md`, `codegen-agent.md`, `review-agent.md`, etc.

**Business Agents仕様**: `.claude/agents/specs/business/*.md` (14ファイル)
- `ai-entrepreneur-agent.md`, `product-concept-agent.md`, etc.

**実行プロンプト**: `.claude/agents/prompts/coding/*.md` (6ファイル)
- Worktree内での実行ガイド
- ステップバイステップ手順
- 成功基準とチェックリスト

## 🚀 Agent実行

### CLI実行
```bash
# 単一Agent実行
miyabi agent run coordinator --issue 270

# 並列実行（Worktreeベース）
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

### Rust API
```rust
use miyabi_agents::CoordinatorAgent;

let agent = CoordinatorAgent::new(config);
let result = agent.execute(&task).await?;
```

### MCP Server経由
```json
{
  "method": "agents/coordinator/execute",
  "params": { "issue_number": 270 }
}
```

## 🔗 Related Modules

- **Architecture**: [architecture.md](./architecture.md) - Cargo Workspace構造
- **Worktree**: [worktree.md](./worktree.md) - 並列実行プロトコル
- **Labels**: [labels.md](./labels.md) - Agent割り当てLabel

## 📖 Detailed Documentation

- **Agent Operations Manual**: `docs/AGENT_OPERATIONS_MANUAL.md`
- **Rust Implementation**: `crates/miyabi-agents/src/`
- **Type Definitions**: `crates/miyabi-types/src/agent.rs`
