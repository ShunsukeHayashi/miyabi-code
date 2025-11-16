# Miyabi - PlantUML Diagrams Index

**Last Updated**: 2025-11-11 | **Version**: 2.0.0

---

## 📊 ディレクトリ構造

```
.ai/diagrams/
├── sequence/           # シーケンス図
├── state/              # 状態遷移図
├── class/              # クラス図
├── component/          # コンポーネント図
├── deployment/         # デプロイメント図
├── activity/           # アクティビティ図
├── usecase/            # ユースケース図
├── mindmap/            # マインドマップ
└── architecture/       # アーキテクチャ図 (全体像)
```

---

## 🗂️ 図の一覧

### 1. Sequence Diagrams (シーケンス図)

**ディレクトリ**: `sequence/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `sequence-issue-to-merge.puml` | Issue→Merge完全フロー | Issue作成からMergeまでの19ステップを時系列で可視化。全参加者 (Developer, GitHub, Orchestrator, Agents, OpenAI, Knowledge Base, CI/CD等) の相互作用を詳細に記載 |

**主要要素**:
- 19ステップの完全自律実行フロー
- 18 Codex並列実行 (MUGEN 12 + MAJIN 6)
- OpenAI API並列呼び出し
- Agent実行 (21種)
- Knowledge Base検索 (Qdrant, Context7, Potpie)
- Multi-channel Notification (Lark/Discord/Telegram)
- VOICEVOX音声ガイド生成
- GitHub Actions CI/CD

---

### 2. State Diagrams (状態遷移図)

**ディレクトリ**: `state/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `state-transitions.puml` | 全状態マシン網羅 | Miyabiシステム内の6つの状態マシンを完全可視化 |

**主要要素**:
- **Issue Lifecycle**: Open → Triaged → Assigned → InProgress → Review → Approved → Merged → Closed
- **Agent Lifecycle**: Idle → Initializing → Ready → Running → Completed/Failed
- **Task Lifecycle**: Pending → Queued → Scheduled → Running → Testing → Success/Failed
- **Worktree Lifecycle**: Creating → Active → Dirty → Committed → Pushed → Removed
- **PR Lifecycle**: Draft → Open → CI_Running → InReview → Approved → Merged
- **Codex Lifecycle**: Booting → Configured → Idle → Executing → Completed/Error

**状態遷移の連鎖**:
```
Issue作成 → Agent割当 → Task生成 → Codex実行 → Code生成
→ Worktree管理 → PR作成 → Merge → Issue完了
```

---

### 3. Class Diagrams (クラス図)

**ディレクトリ**: `class/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `class-diagram.puml` | Framework構造 (15+ Crates) | Miyabi Rust Frameworkの完全なクラス構造 |

**主要要素**:
- **Core Layer**: Config, Executor, Session, TaskMetadata, Logger
- **Agent Layer**:
  - 7 Coding Agents (CodeGen, Review, Deployment, Issue, PR, Refresher, Coordinator)
  - 14 Business Agents (SelfAnalysis, MarketResearch, Persona, ProductConcept, ProductDesign, ContentCreation, FunnelDesign, SNSStrategy, Marketing, Sales, CRM, Analytics, YouTube, AIEntrepreneur)
- **LLM Layer**: LLMClient, 3 Providers (Anthropic/OpenAI/Google)
- **Infrastructure Layer**: WorktreeManager, GitHubClient, KnowledgeBase
- **Integration Layer**: A2AServer, TelegramBot, DiscordClient
- **Workflow Layer**: Orchestrator, DAG, TmuxController
- **Entity-Relation Model**: 14 Entities, 39 Relations

---

### 4. Component Diagrams (コンポーネント図)

**ディレクトリ**: `component/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `component-diagram.puml` | システムコンポーネント関係 | 全コンポーネントとデータフローを可視化 |

**主要要素**:
- **Control Layer**: Master Orchestrator (Local PC), Sub-Orchestrators (MUGEN/MAJIN), tmux Controller
- **Execution Layer**: 18 Codex (MUGEN 12 + MAJIN 6)
- **Agent Layer**: 21 Agents (7 Coding + 14 Business)
- **Framework Layer**: 15+ Rust Crates
- **External Services**: OpenAI API, Anthropic API, Google API, GitHub API, Lark, Discord, Telegram, VOICEVOX
- **Knowledge Layer**: Qdrant Vector DB, Context7, Potpie, Embeddings Model
- **Infrastructure**: MUGEN EC2 (16 vCPU), MAJIN EC2 (8 vCPU), Local PC, GitHub Actions

**データフロー (典型的)**:
```
GitHub Issue作成 → Webhook → MasterOrch → Task配信 → Codex並列実行
→ Code生成 → Agent処理 → Knowledge検索 → Worktree管理 → PR作成
→ 通知 → Audio生成 → CI/CD → Merge & Issue Close
```

---

### 5. Deployment Diagrams (デプロイメント図)

**ディレクトリ**: `deployment/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `deployment-diagram.puml` | インフラトポロジー | 物理的なインフラ配置と通信経路を詳細可視化 |

**主要要素**:
- **Local PC (MacBook Pro)**:
  - Master Orchestrator, VS Code, SSH Client, Monitor Dashboard
- **MUGEN EC2 (us-east-1a)**:
  - Instance Type: c5.4xlarge
  - 16 vCPU, 124GB RAM, 1TB SSD
  - 12 Codex並列, Heavy Tasks, Business Agents (14)
  - Cost: ~$500/month
- **MAJIN EC2 (us-east-1b)**:
  - Instance Type: c5.2xlarge
  - 8 vCPU, 30GB RAM, 500GB SSD
  - 6 Codex並列, Light Tasks, Issue/PR/Review
  - Cost: ~$250/month
- **External APIs**: OpenAI, Anthropic, Google, GitHub, Lark, Discord, Telegram, VOICEVOX
- **Knowledge Services**: Qdrant Cloud, Context7, Potpie
- **Security Groups**: Inbound/Outbound規則詳細

**Phase Roadmap**:
- Phase 1: 18 Codex (MUGEN 12 + MAJIN 6) - 追加コスト $0
- Phase 2: 100 Codex (+3 EC2) - 追加コスト $2,203/month
- Phase 3: 200 Codex (+5 EC2) - 追加コスト $3,672/month

---

### 6. Activity Diagrams (アクティビティ図)

**ディレクトリ**: `activity/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `activity-diagram.puml` | 完全自律型ワークフロー | Issue→Code→PR→Merge全フローを詳細可視化 |

**主要要素**:
- **Issue作成**: Developer/PO作成 → Label自動推論 → Priority設定
- **Agent選択**: feature/* → CodeGen, bug/* → Review, business/* → Business Agents
- **Task配信**: Heavy Task → MUGEN (12並列), Light Task → MAJIN (6並列)
- **Codex実行**: OpenAI API並列呼び出し → Rate Limit処理
- **Agent処理**: 21種のAgent実行 → Framework利用 → Knowledge検索
- **Worktree管理**: 1 Issue = 1 Worktree → Branch作成 → Code書込
- **Test & Lint**: cargo test → cargo clippy → cargo fmt
- **Commit & Push**: Conventional Commits形式 → GitHub Push
- **PR作成**: Draft PR → Ready for Review → CI/CD実行
- **Review & Merge**: Code Review → Approve → Squash Merge → Issue Close
- **Notification**: Lark/Discord/Telegram通知 + VOICEVOX音声ガイド

**意思決定ポイント**:
- Signature Valid?
- Heavy Task?
- Rate Limited?
- Tests Pass?
- Lint Pass?
- CI/CD Pass?
- Approve?

---

### 7. Use Case Diagrams (ユースケース図)

**ディレクトリ**: `usecase/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `usecase-diagram.puml` | ユーザーインタラクション | 全てのユーザーとシステムの相互作用を可視化 |

**主要要素**:
- **Actors (5種)**:
  - Developer (水蜘蛛): Issue作成, Code Review, PR Merge, Monitor, VS Code接続
  - Product Owner: Issue作成 (Business), Persona定義, Product Concept決定
  - Business Analyst: 市場調査依頼, 自己分析実施, Content作成依頼, KPI分析
  - DevOps Engineer: Codex環境構築, Agent監視, Deploy実行, モニタリング
  - Reviewer: Code Review実施, PR承認, Quality Gate判定

- **Use Case Packages (9種)**:
  1. **Development Workflow** (8 use cases): Create Issue, Assign Labels, Review Code, Approve PR, Merge PR, Deploy, Monitor, View Logs
  2. **Agent Management** (6 use cases): Start/Stop/Configure Agent, Monitor Health, View Metrics, Trigger Manual Run
  3. **Codex Orchestration** (5 use cases): Setup Environment, Distribute Tasks, Monitor Instances, Collect Results, Handle Failures
  4. **Business Planning** (8 use cases): Self Analysis, Market Research, Create Personas, Design Concept, Plan Marketing, Design Funnel, Create Content, Analyze Data
  5. **Knowledge Management** (5 use cases): Search Knowledge Base, Index Codebase, Query Context7, Retrieve Library Docs, Semantic Search
  6. **Communication** (4 use cases): Receive Lark/Discord/Telegram Notification, Listen to Audio Guide
  7. **Git Operations** (4 use cases): Create Worktree, Commit Changes, Push to Remote, Cleanup Worktree
  8. **VS Code Integration** (4 use cases): Connect to MUGEN/MAJIN, Sync Settings, View Remote Terminal
  9. **Monitoring & Observability** (4 use cases): View Dashboard, Check Resource Usage, Review Error Logs, Track Performance Metrics

**合計**: 48 Use Cases

---

### 8. Mind Maps (マインドマップ)

**ディレクトリ**: `mindmap/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `mindmap.puml` | プロジェクトコンセプト全体像 | Miyabiの全コンセプトを階層的に可視化 |

**主要要素**:
- **Core Concept**: GitHub as OS, 完全自律実行, 水蜘蛛システム
- **Architecture**: 3層制御システム, Entity-Relation Model (14 Entities, 39 Relations), Framework (15+ Crates)
- **Execution Environment**: Local PC, MUGEN (16 vCPU), MAJIN (8 vCPU), Phase Roadmap (18→100→200 Codex)
- **Agents (21種)**:
  - Coding Agents (7): CodeGen, Review, Deployment, Issue, PR, Refresher, Coordinator
  - Business Agents (14): Phase 1-4 戦略企画, Phase 5-8 コンテンツ戦略, Phase 9-12 営業・成長
- **External Services**:
  - LLM Providers (OpenAI GPT-5/o3, Anthropic Claude, Google Gemini)
  - Knowledge Base (Qdrant, Context7, Potpie)
  - Communication (Lark, Discord, Telegram)
  - Audio (VOICEVOX)
  - CI/CD (GitHub Actions)
- **Key Features**: tmux Orchestra, Git Worktree, VS Code Integration, Monitoring, Notification
- **Workflow**: Issue作成 → Code生成 → PR作成 → Review & Merge → Notification
- **Technology Stack**: Rust, Node.js, Shell Script, AWS EC2, Ubuntu 22.04, tmux, VS Code
- **Benefits**: Speed (18並列), Quality (自動Lint/Test), Scalability (段階的スケール), Automation (完全自動化)

---

### 9. Architecture Diagrams (アーキテクチャ図)

**ディレクトリ**: `architecture/`

| ファイル | 説明 | 内容 |
|---------|------|------|
| `18-codex-architecture.puml` | 18 Codex詳細アーキテクチャ | Phase 1 の18並列実行環境の詳細設計 |
| `miyabi-complete-architecture.puml` | 完全統合アーキテクチャ | Miyabiプロジェクト全コンテキストを統合した全体アーキテクチャ |

**18-codex-architecture.puml の主要要素**:
- **3-Layer Control System**:
  - Layer 1: Master Control (Local PC)
  - Layer 2: Sub-Orchestrators (MUGEN/MAJIN)
  - Layer 3: Execution Units (18 Codex)
- **Component Details**: Control Scripts, Dev Tools, Configuration
- **Runtime Environment**: Installed software, Directory structure
- **Real-time Metrics**: CPU, Memory, Disk, Network

**miyabi-complete-architecture.puml の主要要素**:
- **GitHub Ecosystem**: 57 Label System, Issue Management, PR Automation
- **Local PC Master Control**: 3-layer (Codex/Agent/tmux)
- **MUGEN EC2**: 12 Codex, Heavy Agents, 16 vCPU
- **MAJIN EC2**: 6 Codex, Light Agents, 8 vCPU
- **OpenAI API**: GPT-5/o3, Rate Limits
- **Communication Services**: Lark, Discord, Telegram
- **Audio Services**: VOICEVOX
- **Knowledge Base**: Qdrant, Context7, Potpie
- **Miyabi Framework**: 15+ Rust crates
- **Entity-Relation Model**: 14 Entities, 39 Relations
- **Complete 19-step execution flow**

---

## 🎨 既存の図 (ルートディレクトリ)

以下の図は既存のもので、ルートディレクトリに配置されています:

| ファイル | 説明 |
|---------|------|
| `agent-workflow.puml` | Agent実行ワークフロー |
| `issue-distribution.puml` | Issue配分図 |
| `milestone-timeline.puml` | マイルストーンタイムライン |
| `priority-matrix.puml` | Priority Matrix |

---

## 📝 図の利用方法

### PlantUMLのレンダリング

**VS Code**:
```bash
# PlantUML拡張機能をインストール
code --install-extension jebbs.plantuml

# プレビュー表示: Alt+D (macOS: Option+D)
```

**コマンドライン** (要: Graphviz, PlantUML):
```bash
# PNG生成
plantuml sequence/sequence-issue-to-merge.puml

# SVG生成
plantuml -tsvg state/state-transitions.puml

# 全て生成
find . -name "*.puml" -exec plantuml {} \;
```

**オンライン**:
- [PlantUML Online Server](http://www.plantuml.com/plantuml/uml/)
- ファイル内容をコピー&ペースト

---

## 🔄 図の更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-11-11 | 8つの新規図作成 (Sequence, State, Class, Component, Deployment, Activity, UseCase, MindMap) | Claude Code |
| 2025-11-11 | ディレクトリ構造再編成 (種類別に分類) | Claude Code |
| 2025-11-11 | INDEX.md作成 | Claude Code |
| 2025-11-08 | 初期アーキテクチャ図作成 | Miyabi Team |

---

## 📊 図の統計

| カテゴリ | ファイル数 | 説明 |
|---------|-----------|------|
| Sequence | 1 | 時系列フロー |
| State | 1 | 状態遷移 (6種のマシン) |
| Class | 1 | クラス構造 (15+ Crates) |
| Component | 1 | コンポーネント関係 |
| Deployment | 1 | インフラトポロジー |
| Activity | 1 | ワークフロー詳細 |
| UseCase | 1 | ユーザーインタラクション (48 use cases) |
| MindMap | 1 | コンセプト全体像 |
| Architecture | 2 | 全体アーキテクチャ |
| **合計** | **10** | **全方向からの可視化** |

---

## 🎯 次のステップ

### Phase 2: PNG/SVG生成
```bash
# 全図をPNG形式で生成
cd .ai/diagrams
find . -name "*.puml" -exec plantuml {} \;
```

### Phase 3: ドキュメントサイト統合
- Docusaurus / MkDocs への組み込み
- インタラクティブな図の閲覧環境構築

### Phase 4: 自動更新
- コード変更時の図の自動更新
- CI/CDパイプラインへの統合

---

## 🆕 AWS Platform Diagrams (2025-11-12追加)

### 10. Miyabi AWS Platform - System Overview
**File**: `architecture/miyabi-aws-overview.puml`

**Type**: Architecture Diagram

**Description**: Miyabi AWS Platform の完全な3層アーキテクチャ

**Contents**:
- **Layer 3: Application (SaaS)**: CloudFront, S3 Static Site, API Gateway, Lambda, Cognito
- **Layer 2: Platform (Miyabi Engine)**: EventBridge, SQS, ECS Fargate (Orchestrator + Workers), DynamoDB, RDS, EFS, Qdrant
- **Layer 1: Infrastructure (AWS Foundation)**: VPC, Security (WAF, GuardDuty, Secrets Manager), Monitoring (CloudWatch, X-Ray)
- 外部連携: GitHub, VOICEVOX, Discord

**Key Elements**:
- Auto-scaling: 1-100 tasks
- 6-phase AWS Agent (θ₁-θ₆)
- Event-driven architecture

---

### 11. AWS Agent 6-Phase Optimization Cycle
**File**: `architecture/aws-agent-cycle.puml`

**Type**: State Diagram

**Description**: AWS Agent の最適化サイクル（World₀ → World_∞）

**Contents**:
- **θ₁: Understand (理解)**: AWS リソース発見
- **θ₂: Generate (生成)**: 計画作成、IaC生成
- **θ₃: Allocate (配分)**: Right-sizing、リソース配分
- **θ₄: Execute (実行)**: Terraform/CloudFormation デプロイ
- **θ₅: Integrate (統合)**: モニタリングセットアップ
- **θ₆: Learn (学習)**: 継続的改善

**World State Progression**:
- World₀: $280/month, Security: 72
- World₁: $250/month, Security: 85
- World₂: $220/month, Security: 88
- World_∞: $180/month, Security: 95

---

### 12. Task Execution Flow
**File**: `sequence/task-execution-flow.puml`

**Type**: Sequence Diagram

**Description**: Issue作成から完了までのタスク実行フロー（AWS Platform版）

**Contents**:
- Issue作成 (GitHub)
- イベント処理 (EventBridge, SQS)
- タスクオーケストレーション (Orchestrator)
- Agent実行 (6フェーズ)
- デプロイ (Terraform)
- モニタリング＆通知 (CloudWatch, VOICEVOX, Discord)

**Execution Time**: 14-25分（θ₁-θ₆ 合計）

---

### 13. AWS Multi-Account Architecture
**File**: `deployment/aws-multi-account.puml`

**Type**: Deployment Diagram

**Description**: AWS Organizations マルチアカウント構造

**Contents**:
- **Management Account**: Organizations, CloudTrail, AWS SSO
- **Security Account**: GuardDuty, Security Hub, CloudTrail Logs
- **Production Account**: Multi-region (us-east-1, ap-northeast-1), DynamoDB Global Table, Aurora Global DB
- **Staging Account**: 検証環境
- **Development Account**: 開発環境、LocalStack

**Multi-Region Strategy**:
- Primary: us-east-1 (100% traffic)
- Secondary: ap-northeast-1 (Failover target)
- Route 53 Geolocation Routing

---

### 14. Historical Agents - Service-as-Agent Model
**File**: `component/historical-agents.puml`

**Type**: Component Diagram

**Description**: 7人の偉人がAWSサービスを管理するモデル

**Historical Agents**:
- **Bill Gates**: EC2, Lambda, ECS (Compute)
- **Steve Jobs**: S3, CloudFront (Frontend/UX)
- **Napoleon**: Auto Scaling, Load Balancer (Strategy)
- **Hannibal**: Lambda@Edge, CloudFront Functions (Tactics)
- **Peter Drucker**: CloudWatch, X-Ray (Management)
- **Philip Kotler**: API Gateway, SNS, EventBridge (Communication)
- **Hideyo Noguchi**: RDS, DynamoDB (Data/Research)

**Decision Flow**: Resource Request → Agent Assignment → Decision → Execution

---

### 15. Rust Architecture - Class Diagram
**File**: `class/rust-architecture.puml`

**Type**: Class Diagram

**Description**: Miyabi AWS Agent の Rust 実装クラス構造

**Packages**:
- **miyabi-types**: Core types (AwsAccount, AwsResource, AwsTask, HistoricalAgent)
- **miyabi-aws-agent**: Agent implementations
  - DiscoveryAgent (θ₁)
  - PlanningAgent (θ₂)
  - OptimizationAgent (θ₃)
  - DeploymentAgent (θ₄)
  - MonitoringAgent (θ₅)
  - LearningAgent (θ₆)
  - PythonBridge (Phase 1 統合)
- **miyabi-agent-core**: Base traits (AgentExecutor, Observable, Observer)

**Supporting Classes**: TerraformExecutor, WorldState, CostPlan, SecurityPlan

---

## 📊 図の統計 (更新)

| カテゴリ | ファイル数 | 説明 |
|---------|-----------|------|
| Sequence | 2 | 時系列フロー (既存1 + AWS Platform 1) |
| State | 1 | 状態遷移 (6種のマシン) |
| Class | 2 | クラス構造 (既存1 + AWS Agent 1) |
| Component | 2 | コンポーネント関係 (既存1 + Historical Agents 1) |
| Deployment | 2 | インフラトポロジー (既存1 + Multi-Account 1) |
| Activity | 1 | ワークフロー詳細 |
| UseCase | 1 | ユーザーインタラクション (48 use cases) |
| MindMap | 1 | コンセプト全体像 |
| Architecture | 4 | 全体アーキテクチャ (既存2 + AWS 2) |
| **合計** | **16** | **全方向からの可視化** |

---

## 🔗 関連ドキュメント (AWS Platform)

- **Master Plan**: `.ai/plans/MIYABI_AWS_MASTER_PLAN.md`
- **Architecture**: `.ai/plans/MIYABI_AWS_PLATFORM_ARCHITECTURE.md`
- **Implementation Guide**: `.ai/plans/MIYABI_AWS_IMPLEMENTATION_GUIDE.md`
- **Integration Strategy**: `.ai/plans/MIYABI_AWS_INTEGRATION_STRATEGY.md`

---

**管理者**: Miyabi Team
**最終更新**: 2025-11-12
**ステータス**: ✅ Complete - All Views Documented (AWS Platform追加)
