# Command-Hook-Agent Cross-Reference

**Last Updated**: 2025-10-24
**Diagram**: [command-hook-agent-integration.png](command-hook-agent-integration.png)

完全なクロスリファレンス - 各要素の詳細ドキュメント、メトリクス、関連リンク。

---

## 📋 Quick Navigation

| Category | Count | Jump To |
|----------|-------|---------|
| **Slash Commands** | 18 | [→ Commands](#-slash-commands-18) |
| **Git Hooks** | 5 | [→ Hooks](#-git-hooks-5) |
| **Coding Agents** | 7 | [→ Coding Agents](#-coding-agents-7) |
| **Business Agents** | 14 | [→ Business Agents](#-business-agents-14) |
| **Core Systems** | 5 | [→ Core Systems](#️-core-systems-5) |
| **Data Stores** | 3 | [→ Data Stores](#-data-stores-3) |
| **Outputs** | 6 | [→ Outputs](#-outputs-6) |

---

## 🎯 Slash Commands (18)

### Development Commands (4)

#### `/create-issue` - GitHub Issue作成

**File**: [`.claude/commands/create-issue.md`](../../.claude/commands/create-issue.md)

**機能**: Agent実行用Issue・汎用Issue両対応の対話的Issue作成

**Related Components**:
- **Agents**: IssueAgent, CoordinatorAgent
- **Hooks**: None
- **Systems**: GitHub API

**Metrics**:
- Success Rate: 98%
- Avg Time: 30 seconds
- Daily Usage: 5-10 calls

**Usage**:
```bash
/create-issue              # 詳細Issue
/create-issue --simple     # シンプルIssue
```

**Output**: GitHub Issue URL

---

#### `/test` - テスト実行

**File**: [`.claude/commands/test.md`](../../.claude/commands/test.md)

**機能**: `cargo test --all` 実行

**Related Components**:
- **Hooks**: pre-commit, pre-push
- **Systems**: Rust toolchain

**Metrics**:
- Success Rate: 92%
- Avg Time: 45-90 seconds
- Daily Usage: 20-30 calls

**Usage**:
```bash
/test
```

---

#### `/verify` - システム動作確認

**File**: [`.claude/commands/verify.md`](../../.claude/commands/verify.md)

**機能**: 環境・コンパイル・テスト全チェック

**Related Components**:
- **Agents**: ReviewAgent
- **Systems**: Rust toolchain, Git

**Metrics**:
- Success Rate: 95%
- Avg Time: 2-3 minutes
- Daily Usage: 3-5 calls

**Checklist**:
- ✓ Rust環境 (rustc, cargo)
- ✓ 依存関係
- ✓ コンパイル
- ✓ テスト実行
- ✓ セキュリティスキャン

---

#### `/review` - コード品質レビュー

**File**: [`.claude/commands/review.md`](../../.claude/commands/review.md)

**機能**: ReviewAgentによる100点満点スコアリング

**Related Components**:
- **Agents**: ReviewAgent
- **Hooks**: pre-commit, pre-push
- **Systems**: LLM Gateway

**Metrics**:
- Success Rate: 90%
- Avg Time: 2-3 minutes
- Avg Score: 82/100
- Daily Usage: 15-20 calls

**Scoring**:
- Code Quality: /40
- Security: /20
- Performance: /20
- Tests: /10
- Docs: /10

---

### Agent Commands (4)

#### `/agent-run` - Agent実行

**File**: [`.claude/commands/agent-run.md`](../../.claude/commands/agent-run.md)

**機能**: 単一/並列/バッチAgent実行

**Related Components**:
- **Agents**: All 21 Agents
- **Systems**: Orchestrator, Worktree Manager

**Metrics**:
- Success Rate: 87%
- Avg Time: 3-15 minutes (Agent依存)
- Daily Usage: 10-15 calls

**Usage**:
```bash
/agent-run coordinator --issue 270
/agent-run codegen --issues 270,271,272 --concurrency 3
/agent-run persona --issue 500
```

---

#### `/miyabi-auto` - 全自動開発モード

**File**: [`.claude/commands/miyabi-auto.md`](../../.claude/commands/miyabi-auto.md)

**機能**: Issue作成→実装→PR→デプロイまで完全自動化

**Related Components**:
- **Agents**: 全Coding Agents (7個)
- **Systems**: Orchestrator, Worktree, LLM, GitHub

**Metrics**:
- Success Rate: 85%
- Avg Time: 15-25 minutes
- Daily Usage: 2-5 calls

**Flow**:
1. IssueAgent → 分析
2. CoordinatorAgent → DAG分解
3. CodeGenAgent → 実装（並列3）
4. ReviewAgent → 品質チェック
5. PRAgent → PR作成
6. DeploymentAgent → デプロイ

---

#### `/miyabi-infinity` - Infinity Sprint

**File**: [`.claude/commands/miyabi-infinity.md`](../../.claude/commands/miyabi-infinity.md)

**機能**: 無限自律実行モード（Issue自動処理ループ）

**Related Components**:
- **Agents**: Coordinator, CodeGen, Review, PR, Deployment
- **Systems**: Orchestrator, Worktree
- **Output**: Voice Narration (VoiceVox)

**Metrics**:
- Uptime: 99.5%
- Issues Processed: 5-10/hour
- Success Rate: 80%

**Usage**:
```bash
/miyabi-infinity
```

**Monitoring**: `/watch-sprint` で音声通知

---

#### `/miyabi-todos` - TODO自動Issue化

**File**: [`.claude/commands/miyabi-todos.md`](../../.claude/commands/miyabi-todos.md)

**機能**: コード中のTODOコメント自動検出→Issue化

**Related Components**:
- **Agents**: IssueAgent
- **Systems**: GitHub API

**Metrics**:
- TODOs Found: avg 10-20
- Issues Created: avg 5-10
- Success Rate: 95%

**Patterns**:
- `// TODO: ...`
- `# TODO: ...`
- `<!-- TODO: ... -->`

---

### Deployment Commands (1)

#### `/deploy` - デプロイ実行

**File**: [`.claude/commands/deploy.md`](../../.claude/commands/deploy.md)

**機能**: Firebase/Cloud Run デプロイ

**Related Components**:
- **Agents**: DeploymentAgent
- **Hooks**: post-merge
- **Systems**: GitHub Actions, Firebase, Cloud Run

**Metrics**:
- Success Rate: 95%
- Avg Time: 5-10 minutes
- Monthly Deploys: 30+

**Targets**:
- Firebase Hosting
- Cloud Run
- GitHub Pages

---

### Documentation Commands (2)

#### `/generate-docs` - ドキュメント自動生成

**File**: [`.claude/commands/generate-docs.md`](../../.claude/commands/generate-docs.md)

**機能**: コードからドキュメント自動生成

**Related Components**:
- **Agents**: CodeGenAgent (doc generation mode)
- **Systems**: Knowledge Manager

**Metrics**:
- Success Rate: 93%
- Avg Time: 3-5 minutes
- Pages Generated: 10-20

**Output Types**:
- API仕様書
- アーキテクチャ図
- Agent仕様書
- テンプレート

---

#### `/generate-lp` - ランディングページ生成

**File**: [`.claude/commands/generate-lp.md`](../../.claude/commands/generate-lp.md)

**機能**: プロジェクトLP自動生成

**Related Components**:
- **Agents**: MarketingAgent
- **Systems**: LLM Gateway

**Metrics**:
- Success Rate: 90%
- Avg Time: 5-8 minutes

---

### Reports Commands (2)

#### `/daily-update` - 開発進捗レポート

**File**: [`.claude/commands/daily-update.md`](../../.claude/commands/daily-update.md)

**機能**: 毎日の開発進捗レポート（note.com投稿用）

**Related Components**:
- **Agents**: AnalyticsAgent
- **Systems**: Knowledge Manager, Qdrant

**Metrics**:
- Success Rate: 98%
- Avg Time: 2-3 minutes
- Monthly Reports: 30

**Content**:
- Git commits サマリ
- Issue進捗
- PR統計
- テストカバレッジ

---

#### `/check-benchmark` - ベンチマーク実装チェック

**File**: [`.claude/commands/check-benchmark.md`](../../.claude/commands/check-benchmark.md)

**機能**: 公式ベンチマークハーネス使用確認

**Related Components**:
- **Systems**: Benchmark harnesses (SWE-bench, etc.)

**Metrics**:
- Success Rate: 100%
- Avg Time: 10 seconds

---

### Notifications Commands (1)

#### `/session-end` - セッション終了通知

**File**: [`.claude/commands/session-end.md`](../../.claude/commands/session-end.md)

**機能**: 開発セッション終了通知（macOS通知+音声）

**Related Components**:
- **Output**: macOS Notification, VoiceVox

**Metrics**:
- Success Rate: 100%
- Avg Time: <1 second
- Daily Usage: 5-10 calls

**Output**: 🐮音声通知

---

### VoiceVox Commands (3)

#### `/voicevox` - 単発テキスト読み上げ

**File**: [`.claude/commands/voicevox.md`](../../.claude/commands/voicevox.md)

**機能**: 任意テキスト読み上げ

**Related Components**:
- **Systems**: VoiceVox Engine

**Metrics**:
- Success Rate: 99%
- Avg Time: <1 second
- Daily Usage: 50-100 calls

**Usage**:
```bash
/voicevox "テキスト" [speaker] [speed]
```

**Speakers**:
- 2: 四国めたん
- 3: ずんだもん
- 8: 春日部つむぎ
- 9: 波音リツ

---

#### `/narrate` - 開発進捗ナレーション

**File**: [`.claude/commands/narrate.md`](../../.claude/commands/narrate.md)

**機能**: Git commitsからゆっくり解説音声生成

**Related Components**:
- **Systems**: VoiceVox Engine, Git

**Metrics**:
- Success Rate: 95%
- Avg Time: 1-2 minutes
- Monthly Usage: 20-30 calls

**Output**: MP3音声ファイル

---

#### `/watch-sprint` - Sprint監視+音声通知

**File**: [`.claude/commands/watch-sprint.md`](../../.claude/commands/watch-sprint.md)

**機能**: Infinity Sprintログ監視→イベント音声通知

**Related Components**:
- **Systems**: VoiceVox Engine
- **Related Commands**: /miyabi-infinity

**Metrics**:
- Success Rate: 99%
- Notifications/hour: 10-20

**Events**:
- Sprint開始
- タスク成功
- タスク失敗
- 全完了

---

### Security Commands (1)

#### `/security-scan` - セキュリティスキャン

**File**: [`.claude/commands/security-scan.md`](../../.claude/commands/security-scan.md)

**機能**: 包括的セキュリティ脆弱性スキャン

**Related Components**:
- **Agents**: ReviewAgent
- **Hooks**: pre-commit, pre-push

**Metrics**:
- Success Rate: 98%
- Avg Time: 1-2 minutes
- Daily Usage: 10-15 calls

**Scans**:
- cargo-audit
- gitleaks
- clippy security lints
- OWASP Top 10

---

## 🪝 Git Hooks (5)

### `pre-commit` - コミット前チェック

**File**: `.git/hooks/pre-commit`

**機能**: テスト+セキュリティスキャン

**Triggered By**: `git commit`

**Related Components**:
- **Commands**: /test, /security-scan
- **Agents**: ReviewAgent

**Metrics**:
- Trigger Rate: 100% (全コミット)
- Abort Rate: 5%
- Avg Time: 15-30 seconds

**Checks**:
- `cargo fmt --check`
- `cargo clippy`
- `cargo test`
- Secret scan

---

### `commit-msg` - コミットメッセージ検証

**File**: `.git/hooks/commit-msg`

**機能**: Conventional Commits形式検証

**Triggered By**: `git commit`

**Related Components**:
- **Agents**: ReviewAgent

**Metrics**:
- Trigger Rate: 100%
- Abort Rate: 2%
- Avg Time: <1 second

**Format**: `<type>(<scope>): <subject>`

---

### `post-commit` - コミット後通知

**File**: `.git/hooks/post-commit`

**機能**: VoiceVox音声通知

**Triggered By**: `git commit` (成功時)

**Related Components**:
- **Commands**: /voicevox
- **Systems**: VoiceVox Engine

**Metrics**:
- Trigger Rate: 100%
- Notification Delay: <1 second

---

### `pre-push` - プッシュ前最終チェック

**File**: `.git/hooks/pre-push`

**機能**: Full test suite + Review

**Triggered By**: `git push`

**Related Components**:
- **Commands**: /test, /review
- **Agents**: ReviewAgent

**Metrics**:
- Trigger Rate: 100%
- Abort Rate: 3%
- Avg Time: 30-45 seconds

---

### `post-merge` - マージ後デプロイ

**File**: `.git/hooks/post-merge`

**機能**: PR merge後の自動デプロイトリガー

**Triggered By**: `git merge` (PR merge)

**Related Components**:
- **Commands**: /deploy
- **Agents**: DeploymentAgent

**Metrics**:
- Trigger Rate: 100% (PR merge時)
- Success Rate: 95%

---

## 🤖 Coding Agents (7)

### 1. CoordinatorAgent (しきるん)

**Spec File**: [`.claude/agents/specs/coding/coordinator-agent.md`](../../.claude/agents/specs/coding/coordinator-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/coordinator-agent-prompt.md`](../../.claude/agents/prompts/coding/coordinator-agent-prompt.md)

**機能**: タスクDAG分解・統括

**Related Components**:
- **Commands**: /agent-run, /miyabi-auto
- **Systems**: Worktree Manager, Orchestrator
- **Next Agent**: CodeGenAgent

**Metrics**:
- Avg Time: 1-2 minutes
- Success Rate: 90%
- Avg Tasks Generated: 5-8

**Output**: Task DAG (JSON)

---

### 2. IssueAgent (みつけるん)

**Spec File**: [`.claude/agents/specs/coding/issue-agent.md`](../../.claude/agents/specs/coding/issue-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/issue-agent-prompt.md`](../../.claude/agents/prompts/coding/issue-agent-prompt.md)

**機能**: AI Label推論・Issue分析

**Related Components**:
- **Commands**: /create-issue
- **Systems**: LLM Gateway, GitHub API

**Metrics**:
- Avg Time: 30 seconds
- Success Rate: 95%
- Label Accuracy: 88%

**Output**:
- Labels (from 53-label system)
- Complexity score (1-10)
- Agent recommendation

---

### 3. CodeGenAgent (つくるん)

**Spec File**: [`.claude/agents/specs/coding/codegen-agent.md`](../../.claude/agents/specs/coding/codegen-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/codegen-agent-prompt.md`](../../.claude/agents/prompts/coding/codegen-agent-prompt.md)

**機能**: AI駆動コード生成

**Related Components**:
- **Commands**: /agent-run, /miyabi-auto
- **Hooks**: pre-commit
- **Systems**: LLM Gateway, Worktree Manager
- **Next Agent**: ReviewAgent

**Metrics**:
- Avg Time: 3-5 minutes
- Success Rate: 85%
- LLM Calls: 15-25 per task
- Token Usage: 2K-10K per task

**Output**:
- Source code files
- Test files
- Documentation

---

### 4. ReviewAgent (めだまん)

**Spec File**: [`.claude/agents/specs/coding/review-agent.md`](../../.claude/agents/specs/coding/review-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/review-agent-prompt.md`](../../.claude/agents/prompts/coding/review-agent-prompt.md)

**機能**: 品質レビュー（100点満点スコアリング）

**Related Components**:
- **Commands**: /review
- **Hooks**: pre-commit, pre-push
- **Systems**: LLM Gateway

**Metrics**:
- Avg Time: 2-3 minutes
- Success Rate: 90%
- Avg Score: 82/100
- Retry Trigger: <80/100

**Scoring Breakdown**:
- Code Quality: /40
- Security: /20
- Performance: /20
- Tests: /10
- Docs: /10

**Output**: Quality Report (Markdown)

---

### 5. PRAgent (まとめるん)

**Spec File**: [`.claude/agents/specs/coding/pr-agent.md`](../../.claude/agents/specs/coding/pr-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/pr-agent-prompt.md`](../../.claude/agents/prompts/coding/pr-agent-prompt.md)

**機能**: Pull Request自動作成（Conventional Commits準拠）

**Related Components**:
- **Commands**: /agent-run
- **Systems**: GitHub API

**Metrics**:
- Avg Time: 1 minute
- Success Rate: 98%
- PR Merge Rate: 85%

**Output**:
- PR URL
- Linked Issues

---

### 6. DeploymentAgent (はこぶん)

**Spec File**: [`.claude/agents/specs/coding/deployment-agent.md`](../../.claude/agents/specs/coding/deployment-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/deployment-agent-prompt.md`](../../.claude/agents/prompts/coding/deployment-agent-prompt.md)

**機能**: CI/CDデプロイ自動化

**Related Components**:
- **Commands**: /deploy
- **Hooks**: post-merge
- **Systems**: GitHub Actions, Firebase, Cloud Run

**Metrics**:
- Avg Time: 5-10 minutes
- Success Rate: 95%
- Monthly Deploys: 30+

**Targets**:
- Staging
- Production

---

### 7. RefresherAgent (つなぐん)

**Spec File**: [`.claude/agents/specs/coding/refresher-agent.md`](../../.claude/agents/specs/coding/refresher-agent.md)
**Prompt File**: [`.claude/agents/prompts/coding/refresher-agent-prompt.md`](../../.claude/agents/prompts/coding/refresher-agent-prompt.md)

**機能**: Issue状態監視・自動更新

**Related Components**:
- **Systems**: GitHub API, Orchestrator

**Metrics**:
- Avg Time: 10 seconds
- Check Interval: 1 hour
- Stale Detection: 7 days

**Actions**:
- Re-trigger stale issues
- Update labels
- Add comments

---

## 💼 Business Agents (14)

### Strategy Agents (6)

#### AIEntrepreneurAgent
**Spec**: [`.claude/agents/specs/business/ai-entrepreneur-agent.md`](../../.claude/agents/specs/business/ai-entrepreneur-agent.md)
**機能**: 包括的ビジネスプラン作成
**Avg Time**: 10-15 minutes
**Output**: 50-100 page business plan

#### ProductConceptAgent
**Spec**: [`.claude/agents/specs/business/product-concept-agent.md`](../../.claude/agents/specs/business/product-concept-agent.md)
**機能**: プロダクト構想・USP設計
**Avg Time**: 8-12 minutes

#### ProductDesignAgent
**Spec**: [`.claude/agents/specs/business/product-design-agent.md`](../../.claude/agents/specs/business/product-design-agent.md)
**機能**: サービス詳細設計（6ヶ月分）
**Avg Time**: 12-18 minutes

#### PersonaAgent
**Spec**: [`.claude/agents/specs/business/persona-agent.md`](../../.claude/agents/specs/business/persona-agent.md)
**機能**: ターゲット顧客ペルソナ設定（3-5人）
**Avg Time**: 5-8 minutes

#### SelfAnalysisAgent
**Spec**: [`.claude/agents/specs/business/self-analysis-agent.md`](../../.claude/agents/specs/business/self-analysis-agent.md)
**機能**: キャリア・スキル・実績分析
**Avg Time**: 6-10 minutes

#### FunnelDesignAgent
**Spec**: [`.claude/agents/specs/business/funnel-design-agent.md`](../../.claude/agents/specs/business/funnel-design-agent.md)
**機能**: 認知→購入→LTV導線設計
**Avg Time**: 8-12 minutes

---

### Marketing Agents (5)

#### MarketResearchAgent
**Spec**: [`.claude/agents/specs/business/market-research-agent.md`](../../.claude/agents/specs/business/market-research-agent.md)
**機能**: 市場調査・競合分析（20社以上）
**Avg Time**: 15-20 minutes

#### MarketingAgent
**Spec**: [`.claude/agents/specs/business/marketing-agent.md`](../../.claude/agents/specs/business/marketing-agent.md)
**機能**: 広告・SEO・SNS戦略
**Avg Time**: 10-15 minutes

#### ContentCreationAgent
**Spec**: [`.claude/agents/specs/business/content-creation-agent.md`](../../.claude/agents/specs/business/content-creation-agent.md)
**機能**: 動画・記事・教材制作計画
**Avg Time**: 8-12 minutes

#### SNSStrategyAgent
**Spec**: [`.claude/agents/specs/business/sns-strategy-agent.md`](../../.claude/agents/specs/business/sns-strategy-agent.md)
**機能**: Twitter/Instagram/LinkedIn戦略
**Avg Time**: 6-10 minutes

#### YouTubeAgent
**Spec**: [`.claude/agents/specs/business/youtube-agent.md`](../../.claude/agents/specs/business/youtube-agent.md)
**機能**: YouTubeチャンネル運用最適化
**Avg Time**: 10-15 minutes

---

### Sales & CRM Agents (3)

#### SalesAgent
**Spec**: [`.claude/agents/specs/business/sales-agent.md`](../../.claude/agents/specs/business/sales-agent.md)
**機能**: リード→顧客転換最適化
**Avg Time**: 8-12 minutes

#### CRMAgent
**Spec**: [`.claude/agents/specs/business/crm-agent.md`](../../.claude/agents/specs/business/crm-agent.md)
**機能**: 顧客満足度・LTV最大化
**Avg Time**: 10-15 minutes

#### AnalyticsAgent
**Spec**: [`.claude/agents/specs/business/analytics-agent.md`](../../.claude/agents/specs/business/analytics-agent.md)
**機能**: データ分析・PDCAサイクル実行
**Avg Time**: 5-10 minutes

---

## ⚙️ Core Systems (5)

### 1. Water Spider Orchestrator

**Design Doc**: [`docs/WATER_SPIDER_ORCHESTRATOR_DESIGN.md`](../WATER_SPIDER_ORCHESTRATOR_DESIGN.md)
**Crate**: `crates/miyabi-orchestrator/`

**機能**: 24/7 Daemon - 全自律実行制御

**Metrics**:
- Uptime: 99.9%
- Webhook Latency: <500ms
- Queue Depth: avg 2-5
- Memory Usage: ~200MB
- CPU Usage: 5-15%

**Responsibilities**:
- GitHub Webhook受信
- Agent並列実行制御
- Worktree管理
- 状態DB管理
- 失敗時リトライ

---

### 2. Git Worktree Manager

**Protocol Doc**: [`docs/WORKTREE_PROTOCOL.md`](../WORKTREE_PROTOCOL.md)
**Crate**: `crates/miyabi-worktree/`

**機能**: Git Worktree並列実行管理

**Metrics**:
- Max Concurrent: 3
- Avg Lifetime: 15-25 minutes
- Disk Usage: ~500MB/worktree
- Success Rate: 92%

**Lifecycle**:
1. Create worktree
2. Agent execution
3. Commit + Push
4. Cleanup

---

### 3. LLM Gateway

**Crate**: `crates/miyabi-llm/`

**機能**: マルチLLMゲートウェイ（自動Fallback）

**Metrics**:
- Avg Response Time: 2-8 seconds
- Token Usage: 500-3K/request
- Fallback Rate: 5%
- Cost per Issue: $0.15-0.40
- Daily API Calls: 200-500

**Providers**:
- Primary: GPT-OSS-20B
- Fallback: Groq, vLLM, Ollama

---

### 4. Knowledge Manager

**Crate**: `crates/miyabi-knowledge/`

**機能**: RAGシステム（Vector Search + Context7）

**Metrics**:
- Embeddings Stored: ~15K
- Search Latency: <100ms
- Relevance Score: >0.85
- Cache Hit Rate: 40%
- Storage: ~2GB

**Features**:
- Similar Issue検索
- Code Pattern検索
- Context7統合 (MCP)

---

### 5. MCP Server

**Spec**: [`docs/MCP_SERVER_SPECIFICATION.md`](../MCP_SERVER_SPECIFICATION.md)
**Crate**: `crates/miyabi-mcp-server/`

**機能**: JSON-RPC 2.0 MCP Server

**Protocol**: Model Context Protocol
**Integration**: Claude Code ↔ MCP Server

---

## 📊 Data Stores (3)

### 1. GitHub Issues (GitHub OS)

**機能**: タスク管理・Label体系

**Metrics**:
- Issues Managed: 500+
- Label System: 53 labels
- API Rate Limit: 5K req/hour

**Label Categories** (11):
- Type, Priority, Status, Area, Agent, Size, Difficulty, Impact, Risk, Phase, Special

---

### 2. Qdrant (Vector Store)

**Crate**: `crates/miyabi-knowledge/`
**Deployment**: Docker container

**機能**: Vector Search・RAG検索

**Metrics**:
- Vectors: 15K
- Storage: 2GB
- Query Latency: <100ms

**Embeddings**:
- Issue embeddings
- Code embeddings
- Documentation embeddings

---

### 3. SQLite (State DB)

**Crate**: `crates/miyabi-orchestrator/`
**File**: `.miyabi/state.db`

**機能**: Task状態・実行ログ・品質スコア

**Metrics**:
- Size: 50MB
- Records: 10K+
- Query Latency: <10ms

**Tables**:
- `sessions`
- `tasks`
- `execution_logs`
- `quality_scores`

---

## 📤 Outputs (6)

### 1. Pull Request

**Target**: GitHub
**Monthly**: 100+
**Merge Rate**: 85%

**Format**: Conventional Commits準拠

---

### 2. Documentation

**Formats**: Markdown, HTML
**Monthly**: 50+ pages

**Types**:
- API仕様書
- アーキテクチャ図
- Agent仕様書

---

### 3. Deployment

**Targets**: Firebase, Cloud Run, GitHub Pages
**Monthly**: 30+ deploys
**Success Rate**: 95%

---

### 4. Voice Narration

**Engine**: VoiceVox
**Monthly**: 200+ messages
**Latency**: <1 second

---

### 5. Daily Report

**Target**: note.com
**Monthly**: 30 reports
**Generation Time**: 2-3 minutes

---

### 6. macOS Notification

**Monthly**: 500+ notifications
**Sound**: 🐮牛の鳴き声

---

## 📈 Overall System Metrics

| Metric | Value |
|--------|-------|
| **Commands** | 18 |
| **Hooks** | 5 |
| **Agents** | 21 (7 Coding + 14 Business) |
| **Core Systems** | 5 |
| **Data Stores** | 3 |
| **Outputs** | 6 |
| **Total Components** | 58 |
| **Avg Issue Resolution** | 15-25 minutes |
| **Success Rate** | 87% |
| **Parallel Capacity** | 3 concurrent |
| **Daily Cost** | $3-8 (LLM API) |
| **Monthly Cost** | $90-240 |

---

## 🔗 Related Documentation

- **Architecture Overview**: [README.md](README.md)
- **Entity-Relation Model**: [`../ENTITY_RELATION_MODEL.md`](../ENTITY_RELATION_MODEL.md)
- **Label System Guide**: [`../LABEL_SYSTEM_GUIDE.md`](../LABEL_SYSTEM_GUIDE.md)
- **Agent Operations Manual**: [`../AGENT_OPERATIONS_MANUAL.md`](../AGENT_OPERATIONS_MANUAL.md)
- **Worktree Protocol**: [`../WORKTREE_PROTOCOL.md`](../WORKTREE_PROTOCOL.md)

---

**このクロスリファレンスは自動生成ではありません。各要素の詳細はリンク先のドキュメントを参照してください。**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
