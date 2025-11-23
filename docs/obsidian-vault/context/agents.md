---
title: "Agent System - Autonomous Agents"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Team"
category: "context"
tags: ['agents', 'autonomous', 'context', 'miyabi']
status: "published"
---

# Agent System - Autonomous Agents

**Last Updated**: 2025-11-03
**Version**: 3.0.0
**Priority**: ⭐⭐⭐⭐⭐

**🎭 Miyabi Orchestra v2.0 Deployed**: 6 Coding Agents + 14 Business Agents
**✅ W1-W5 Complete Coverage**: 100% Workflow Automation Achieved

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
- **✅ 実装済み** (20個):
  - **Coding Agents** (6個) - tmux Orchestra v2.0でデプロイ済み ⭐ NEW
  - **Business Agents** (14個) - Rust実装完了
- **📋 計画中** (4個): Spec fileのみ、今後実装予定

## ✅ 実装済みAgent (20個)

### 🎭 Coding Agents (6個) - tmux Orchestra v2.0デプロイ済み ⭐ NEW

**Deployment**: Miyabi Orchestra v2.0 (tmux-based parallel execution)
**Coverage**: W1-W5 Complete Workflow (100% automation)

| Agent | Character | Pane | Workflow | Status |
|-------|-----------|------|----------|--------|
| **IssueAgent** | みつけるん | %10 | W1: Issue Triage | ✅ Active |
| **CoordinatorAgent** | しきるん | %11 | W2: Task Decomposition | ✅ Active |
| **CodeGenAgent** | カエデ | %2 | W3: Code Implementation | ✅ Active |
| **ReviewAgent** | サクラ | %5 | W4: Code Review | ✅ Active |
| **PRAgent** | ツバキ | %3 | W3: Pull Request | ✅ Active |
| **DeploymentAgent** | ボタン | %4 | W5: Deployment | ✅ Active |

**Quick Access**: `.claude/agents/tmux_agents_control.md` - tmux操作リファレンス

**Workflow Chain**:
```
みつけるん (W1: Triage)
    ↓
しきるん (W2: Task Decomposition)
    ↓
カエデ (W3: Implementation)
    ↓
サクラ (W4: Review)
    ↓
ツバキ (W3: PR Creation)
    ↓
ボタン (W5: Deployment)
```

**Auto-Relay**: Water Spider v2.0が自動でメッセージ中継・タスク割り当て実行

---

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

## 📋 計画中Agent (4個 - Spec fileのみ)

### 🔧 Coding Agents (4個)

| Agent | 役割 | ステータス |
|-------|------|-----------|
| **RefresherAgent** | Issue状態監視・自動更新 | 📋 Spec作成済み |
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

### ✅ Coding Agents実装履歴

| Agent | Character | 従来名 | 実装方式 | Status |
|-------|-----------|--------|----------|--------|
| IssueAgent | みつけるん | みつけるん | tmux Orchestra v2.0 | ✅ Deployed |
| CoordinatorAgent | しきるん | しきるん | tmux Orchestra v2.0 | ✅ Deployed |
| CodeGenAgent | カエデ | つくるん | tmux Orchestra v2.0 | ✅ Deployed |
| ReviewAgent | サクラ | めだまん | tmux Orchestra v2.0 | ✅ Deployed |
| PRAgent | ツバキ | まとめるん | tmux Orchestra v2.0 | ✅ Deployed |
| DeploymentAgent | ボタン | はこぶん | tmux Orchestra v2.0 | ✅ Deployed |
| RefresherAgent | アサガオ | つなぐん | - | 📋 Planned |

**実装方針の転換** (2025-11-03):
- ❌ **旧**: 個別Rust crateとして実装
- ✅ **新**: Claude Code + tmux Orchestraで実装
  - より柔軟な実行環境
  - リアルタイムモニタリング可能
  - Water Spider v2.0による自動管理
  - 100% W1-W5カバレッジ達成

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

**Phase 2: Coding Agents** (✅ 完了 v2.0.0) ⭐ NEW
- 6個のCoding AgentsをtmuxOrchestraとしてデプロイ完了
- W1-W5完全自動化達成（100%カバレッジ）
- Water Spider v2.0による自動管理実現

**Phase 3: Additional Agents** (📋 計画中 v2.1.0)
- RefresherAgent実装
- 3個の追加Coding Agent（Discord, Hooks, ImageGen）

**Phase 4: Advanced Business Agents** (📋 計画中 v2.2.0)
- 7個の高度なBusiness Agents
- AI秘書、デザイン戦略、コンテンツ生成等

---

## 📚 Related Documents

- [[core-rules]]
- [[worktree]]
- [[miyabi-definition]]
- [[development]]
