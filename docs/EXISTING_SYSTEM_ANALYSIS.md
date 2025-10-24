# Miyabi Existing System Analysis

**Document Version**: 1.0.0
**Last Updated**: 2025-10-25
**Status**: Phase 0 - In Progress

---

## 📋 Executive Summary

本ドキュメントは、既存のMiyabi Rust実装（v0.1.1）の詳細分析レポートです。[SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md)で定義した要件との差分を明確化します。

**分析対象バージョン**: v0.1.1 (2025-10-25時点)
**Workspace構成**: 28 crates

---

## 🏗️ Current Architecture Overview

### Cargo Workspace Structure

```
miyabi-private/
├── Cargo.toml (workspace root)
└── crates/
    ├── miyabi-core/              ✅ 実装済み
    ├── miyabi-types/             ✅ 実装済み
    ├── miyabi-cli/               ✅ 実装済み
    ├── miyabi-agent-core/        ✅ 実装済み
    ├── miyabi-agent-coordinator/ ✅ 実装済み
    ├── miyabi-agent-codegen/     ✅ 実装済み
    ├── miyabi-agent-review/      ✅ 実装済み
    ├── miyabi-agent-workflow/    ✅ 実装済み
    ├── miyabi-agent-business/    ✅ 実装済み
    ├── miyabi-agent-integrations/✅ 実装済み
    ├── miyabi-agents/            ✅ 実装済み
    ├── miyabi-github/            ✅ 実装済み
    ├── miyabi-worktree/          ✅ 実装済み
    ├── miyabi-llm/               ✅ 実装済み
    ├── miyabi-knowledge/         ✅ 実装済み
    ├── miyabi-mcp-server/        ✅ 実装済み
    ├── miyabi-discord-mcp-server/✅ 実装済み
    ├── miyabi-a2a/               ✅ 実装済み
    ├── miyabi-webhook/           ✅ 実装済み
    ├── miyabi-benchmark/         ✅ 実装済み
    ├── miyabi-web-api/           ✅ 実装済み
    ├── miyabi-orchestrator/      ✅ 実装済み (scheduler + feedback-loop merged)
    ├── miyabi-e2e-tests/         ✅ 実装済み
    └── codex-miyabi/             ✅ 実装済み
```

**Total**: 28 active crates (3 deprecated/merged)

---

## 🔍 Detailed Crate Analysis

### 1. Core Infrastructure Crates

#### 1.1 `miyabi-core` ✅

**Location**: `crates/miyabi-core/`

**Current Implementation**:
```rust
// src/lib.rs
pub mod config;
pub mod logger;
```

**Analysis**:
- ✅ **実装済み**: `config` - 設定管理
- ✅ **実装済み**: `logger` - tracing統合ログ
- ❌ **未実装**: `error_policy` - リトライ、サーキットブレーカー
- ❌ **未実装**: `resource_limits` - ハードウェア制約管理

**Gap**:
```diff
+ 必要な追加実装:
+ - crates/miyabi-core/src/error_policy.rs
+ - crates/miyabi-core/src/resource_limits.rs
+ - crates/miyabi-core/src/retry.rs
+ - crates/miyabi-core/src/circuit_breaker.rs
```

**Dependencies**:
```toml
[dependencies]
tokio = { workspace = true }
serde = { workspace = true }
serde_json = { workspace = true }
anyhow = { workspace = true }
thiserror = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
chrono = { workspace = true }
once_cell = "1.19"  # LoggerGuard管理用
```

**Readiness**: 🟡 **拡張必要** (60% complete)

---

#### 1.2 `miyabi-types` ✅

**Location**: `crates/miyabi-types/`

**Current Implementation**:
```rust
// src/lib.rs
pub mod agent;
pub mod task;
pub mod issue;
pub mod knowledge;
```

**Existing Types**:
```rust
// src/agent.rs
pub struct Agent { /* ... */ }
pub enum AgentType { /* ... */ }

// src/task.rs
pub struct Task { /* ... */ }
pub enum TaskStatus { /* ... */ }

// src/issue.rs
pub struct Issue { /* ... */ }
```

**Analysis**:
- ✅ **実装済み**: 基本型定義（Agent, Task, Issue）
- ❌ **未実装**: `WorldId` - 5-Worlds戦略用
- ❌ **未実装**: `WorldConfig` - World設定
- ❌ **未実装**: `EvaluationScore` - 評価スコア（100点満点）

**Gap**:
```diff
+ 必要な追加実装:
+ - crates/miyabi-types/src/world.rs (新規)
+   - WorldId enum (Alpha, Beta, Gamma, Delta, Epsilon)
+   - WorldConfig struct
+   - PromptVariant enum
+   - EvaluationScore struct
```

**Readiness**: 🟡 **拡張必要** (70% complete)

---

#### 1.3 `miyabi-cli` ✅

**Location**: `crates/miyabi-cli/`

**Current Implementation**:
```rust
// src/main.rs
use clap::{Parser, Subcommand};

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Agent { /* ... */ },
    Worktree { /* ... */ },
    Knowledge { /* ... */ },
    Status,
    // ...
}
```

**Analysis**:
- ✅ **実装済み**: `agent` サブコマンド
- ✅ **実装済み**: `worktree` サブコマンド
- ✅ **実装済み**: `status` サブコマンド
- ❌ **未実装**: `parallel` サブコマンド（5-Worlds並列実行用）
- ❌ **未実装**: `work-on` エイリアス

**Gap**:
```diff
+ 必要な追加実装:
+ - miyabi parallel --issues N1,N2,N3 --concurrency 3
+ - miyabi work-on <ISSUE_NUMBER> (agent coordinator エイリアス)
```

**Readiness**: 🟢 **ほぼ完成** (85% complete)

---

### 2. Agent Crates

#### 2.1 `miyabi-agent-coordinator` ✅

**Location**: `crates/miyabi-agent-coordinator/`

**Current Implementation**:
```rust
// src/lib.rs
pub struct CoordinatorAgent {
    github_client: Arc<GithubClient>,
    task_analyzer: TaskAnalyzer,
    dag_builder: DagBuilder,
}

impl CoordinatorAgent {
    pub async fn execute(&self, issue: Issue) -> Result<()> {
        // 1. タスク分解
        let tasks = self.decompose_into_tasks(&issue).await?;

        // 2. DAG構築
        let dag = self.build_dag(&tasks)?;

        // 3. 実行順序決定
        let execution_order = dag.topological_sort()?;

        // 4. タスク実行
        for task in execution_order {
            self.execute_task(task).await?;
        }

        Ok(())
    }
}
```

**Analysis**:
- ✅ **実装済み**: タスク分解ロジック
- ✅ **実装済み**: DAG構築
- ✅ **実装済み**: トポロジカルソート
- ❌ **未実装**: 5-Worlds並列実行統合
- ❌ **未実装**: チェックポイント保存

**Gap**:
```diff
+ 必要な追加実装:
+ - execute_with_five_worlds() メソッド
+ - FiveWorldsExecutor統合
+ - CheckpointManager統合
```

**Readiness**: 🟡 **拡張必要** (75% complete)

---

#### 2.2 `miyabi-agent-codegen` ✅

**Location**: `crates/miyabi-agent-codegen/`

**Current Implementation**:
```rust
pub struct CodeGenAgent {
    llm_client: Arc<LlmClient>,
}

impl CodeGenAgent {
    pub async fn generate_code(&self, task: &Task) -> Result<String> {
        let prompt = self.build_prompt(task)?;
        let code = self.llm_client.generate(&prompt).await?;
        Ok(code)
    }
}
```

**Analysis**:
- ✅ **実装済み**: LLMコード生成
- ✅ **実装済み**: プロンプト構築
- ❌ **未実装**: 5-Worlds対応（温度、モデル切り替え）
- ❌ **未実装**: コスト追跡

**Readiness**: 🟡 **拡張必要** (70% complete)

---

#### 2.3 `miyabi-agent-review` ✅

**Location**: `crates/miyabi-agent-review/`

**Current Implementation**:
```rust
pub struct ReviewAgent {
    compiler: RustCompiler,
    test_runner: TestRunner,
}

impl ReviewAgent {
    pub async fn review(&self, code: &str) -> Result<ReviewReport> {
        let mut report = ReviewReport::default();

        // cargo check
        report.compilation_success = self.compiler.check(code).await?;

        // cargo test
        report.test_results = self.test_runner.run_tests().await?;

        // cargo clippy
        report.clippy_warnings = self.run_clippy().await?;

        Ok(report)
    }
}
```

**Analysis**:
- ✅ **実装済み**: コンパイルチェック
- ✅ **実装済み**: テスト実行
- ✅ **実装済み**: Clippy実行
- ❌ **未実装**: 100点満点スコアリング
- ❌ **未実装**: セキュリティ分析統合

**Gap**:
```diff
+ 必要な追加実装:
+ - EvaluationScore計算ロジック
+   - コンパイル: 30点
+   - テスト: 30点
+   - Clippy: 20点
+   - コード品質: 10点
+   - セキュリティ: 10点
```

**Readiness**: 🟡 **拡張必要** (65% complete)

---

### 3. Infrastructure Crates

#### 3.1 `miyabi-worktree` ✅

**Location**: `crates/miyabi-worktree/`

**Current Implementation**:
```rust
pub struct WorktreeManager {
    base_path: PathBuf,
}

impl WorktreeManager {
    pub async fn create_worktree(
        &self,
        path: &Path,
        branch: &str,
    ) -> Result<WorktreeHandle> {
        Command::new("git")
            .args(["worktree", "add", path.to_str().unwrap(), "-b", branch])
            .output()
            .await?;

        Ok(WorktreeHandle { path: path.to_path_buf(), branch: branch.to_string() })
    }

    pub async fn cleanup_worktree(&self, handle: &WorktreeHandle) -> Result<()> {
        Command::new("git")
            .args(["worktree", "remove", "--force", handle.path.to_str().unwrap()])
            .output()
            .await?;

        Ok(())
    }
}
```

**Analysis**:
- ✅ **実装済み**: 基本的なWorktree作成/削除
- ❌ **未実装**: 5-Worlds専用マネージャー
- ❌ **未実装**: WorldId対応
- ❌ **未実装**: 並列実行管理

**Gap**:
```diff
+ 必要な追加実装:
+ - crates/miyabi-worktree/src/five_worlds.rs (新規)
+   - FiveWorldsManager struct
+   - spawn_all_worlds() メソッド
+   - cleanup_all_worlds() メソッド
```

**Readiness**: 🟡 **拡張必要** (60% complete)

---

#### 3.2 `miyabi-llm` ✅

**Location**: `crates/miyabi-llm/`

**Current Implementation**:
```rust
pub struct LlmClient {
    api_key: String,
    model: String,
}

impl LlmClient {
    pub async fn generate(&self, prompt: &str) -> Result<String> {
        // async-openai統合
        let response = self.call_api(prompt).await?;
        Ok(response.text)
    }
}
```

**Analysis**:
- ✅ **実装済み**: LLM API呼び出し
- ✅ **実装済み**: async-openai統合
- ❌ **未実装**: Rate Limiter
- ❌ **未実装**: Response Cache
- ❌ **未実装**: コスト計算

**Gap**:
```diff
+ 必要な追加実装:
+ - crates/miyabi-llm/src/rate_limiter.rs (新規)
+ - crates/miyabi-llm/src/cache.rs (新規)
+ - crates/miyabi-llm/src/model_selector.rs (新規)
```

**Readiness**: 🟡 **拡張必要** (55% complete)

---

#### 3.3 `miyabi-orchestrator` ✅

**Location**: `crates/miyabi-orchestrator/`

**Note**: `miyabi-scheduler` と `miyabi-feedback-loop` がマージされたcrate

**Current Implementation**:
```rust
pub struct Orchestrator {
    agents: Vec<Box<dyn Agent>>,
}

impl Orchestrator {
    pub async fn execute_issue(&self, issue: Issue) -> Result<()> {
        // タスクスケジューリング
    }
}
```

**Analysis**:
- ✅ **実装済み**: 基本的なオーケストレーション
- ❌ **未実装**: 動的スケーリング
- ❌ **未実装**: リソース監視
- ❌ **未実装**: FiveWorldsExecutor

**Gap**:
```diff
+ 必要な追加実装:
+ - crates/miyabi-orchestrator/src/dynamic_scaling.rs (新規)
+ - crates/miyabi-orchestrator/src/resource_monitor.rs (新規)
+ - crates/miyabi-orchestrator/src/five_worlds_executor.rs (新規)
```

**Readiness**: 🟡 **拡張必要** (50% complete)

---

#### 3.4 `miyabi-github` ✅

**Location**: `crates/miyabi-github/`

**Current Implementation**:
```rust
pub struct GithubClient {
    octocrab: Octocrab,
}

impl GithubClient {
    pub async fn get_issue(&self, number: u64) -> Result<Issue> {
        // octocrab統合
    }

    pub async fn create_pr(&self, /* ... */) -> Result<PullRequest> {
        // PR作成
    }
}
```

**Analysis**:
- ✅ **実装済み**: Issue取得
- ✅ **実装済み**: PR作成
- ✅ **実装済み**: Label管理
- ✅ **完成度高い**

**Readiness**: 🟢 **完成** (95% complete)

---

### 4. Missing Crates (要新規作成)

#### 4.1 `miyabi-persistence` ❌

**Status**: **未実装**

**Required Implementation**:
- SQLiteデータベース統合
- 5テーブル作成（execution_runs, task_executions, world_executions, checkpoints, worktrees）
- CheckpointManager
- データアクセス層

**Estimated Effort**: 5-7日

---

#### 4.2 `miyabi-recovery` ❌

**Status**: **未実装**

**Required Implementation**:
- 中断タスク検出
- チェックポイントからの復旧
- Worktree再検証

**Estimated Effort**: 3-4日

---

#### 4.3 `miyabi-gc` ❌

**Status**: **未実装**

**Required Implementation**:
- 孤児Worktree検出
- 自動クリーンアップ
- 1時間ごとのGCループ

**Estimated Effort**: 2-3日

---

#### 4.4 `miyabi-security` ❌

**Status**: **未実装**

**Required Implementation**:
- 脅威モデル定義
- 静的解析（Unsafe検出、シークレットスキャン）
- Docker分離実行
- ランタイム監視

**Estimated Effort**: 5-7日

---

#### 4.5 `miyabi-observability` ❌

**Status**: **未実装**

**Required Implementation**:
- 構造化ログ（IssueLogger, TaskLogger, WorldLogger）
- Prometheusメトリクス（20+個）
- OpenTelemetryトレーシング
- Grafanaダッシュボード定義

**Estimated Effort**: 5-7日

---

#### 4.6 `miyabi-cost` ❌

**Status**: **未実装**

**Required Implementation**:
- コスト追跡（LLM API呼び出し）
- 早期打ち切りポリシー
- モデル選択（Simple/Medium/Complex）
- 月額予算管理

**Estimated Effort**: 4-5日

---

## 📊 Summary - Implementation Readiness

### Existing Crates Status

| Crate | Status | Readiness | Required Work |
|-------|--------|-----------|---------------|
| `miyabi-core` | 実装済み | 🟡 60% | error_policy.rs, resource_limits.rs追加 |
| `miyabi-types` | 実装済み | 🟡 70% | world.rs追加 |
| `miyabi-cli` | 実装済み | 🟢 85% | parallelサブコマンド追加 |
| `miyabi-agent-coordinator` | 実装済み | 🟡 75% | 5-Worlds統合 |
| `miyabi-agent-codegen` | 実装済み | 🟡 70% | WorldId対応 |
| `miyabi-agent-review` | 実装済み | 🟡 65% | EvaluationScore追加 |
| `miyabi-worktree` | 実装済み | 🟡 60% | FiveWorldsManager追加 |
| `miyabi-llm` | 実装済み | 🟡 55% | rate_limiter, cache追加 |
| `miyabi-orchestrator` | 実装済み | 🟡 50% | FiveWorldsExecutor追加 |
| `miyabi-github` | 実装済み | 🟢 95% | ほぼ完成 |

### New Crates Required

| Crate | Status | Estimated Effort |
|-------|--------|------------------|
| `miyabi-persistence` | ❌ 未実装 | 5-7日 |
| `miyabi-recovery` | ❌ 未実装 | 3-4日 |
| `miyabi-gc` | ❌ 未実装 | 2-3日 |
| `miyabi-security` | ❌ 未実装 | 5-7日 |
| `miyabi-observability` | ❌ 未実装 | 5-7日 |
| `miyabi-cost` | ❌ 未実装 | 4-5日 |

**Total New Implementation**: 24-33日

---

## 🔄 Dependencies & Integration Points

### Dependency Graph

```
miyabi-cli
  ↓
miyabi-orchestrator (FiveWorldsExecutor)
  ↓
├─ miyabi-worktree (FiveWorldsManager)
│   └─ miyabi-types (WorldId, WorldConfig)
├─ miyabi-llm (RateLimiter, Cache)
│   └─ miyabi-cost (CostTracker)
├─ miyabi-persistence (CheckpointManager)
│   └─ miyabi-recovery (RecoveryManager)
├─ miyabi-security (StaticAnalyzer, IsolationManager)
└─ miyabi-observability (IssueLogger, Metrics, Tracing)
```

### Critical Integration Points

1. **CoordinatorAgent ↔ FiveWorldsExecutor**
   - CoordinatorがFiveWorldsExecutorを呼び出し
   - タスクごとに5つのWorldを並列実行

2. **FiveWorldsExecutor ↔ CheckpointManager**
   - 5分ごとに自動チェックポイント保存
   - クラッシュ時の復旧に使用

3. **LlmClient ↔ CostTracker**
   - 全LLM呼び出しでコスト記録
   - 月額予算チェック

4. **ReviewAgent ↔ SecurityAnalyzer**
   - コードレビュー時にセキュリティ分析実行
   - High以上のリスクで実行ブロック

---

## 🎯 Recommendations

### Phase 0 完了後の優先順位

1. **Phase 1 (Week 1)**: Core拡張 - miyabi-types, miyabi-core
   - WorldId型定義
   - error_policy実装
   - **理由**: 全システムの基盤

2. **Phase 2 (Week 1-2)**: Worktree拡張 - FiveWorldsManager
   - **理由**: 5-Worlds戦略の中核

3. **Phase 3 (Week 2)**: LLM拡張 - RateLimiter, Cache
   - **理由**: コスト最適化の基盤

4. **Phase 4 (Week 3)**: Persistence - 新規3 crates
   - **理由**: 信頼性向上

5. **Phase 5 (Week 4)**: Security - 新規crate
   - **理由**: 安全性確保

6. **Phase 6 (Week 5)**: Observability - 新規crate
   - **理由**: 運用監視

7. **Phase 7 (Week 6)**: Cost - 新規crate
   - **理由**: 予算管理

8. **Phase 8 (Week 7)**: Integration - Agent統合
   - **理由**: 全体統合

9. **Phase 9 (Week 8)**: Testing - E2E, ベンチマーク
   - **理由**: 品質保証

---

## 📈 Risk Assessment

### High Risk Items

1. **5-Worlds並列実行の複雑性**
   - リスク: デッドロック、リソース枯渇
   - 対策: 段階的実装、徹底的なテスト

2. **SQLite永続化のパフォーマンス**
   - リスク: 5分ごとのチェックポイントで遅延
   - 対策: 非同期書き込み、バッチ処理

3. **Docker分離のオーバーヘッド**
   - リスク: 実行速度低下
   - 対策: プロセス分離オプション提供

### Medium Risk Items

1. **LLMレート制限の正確性**
   - リスク: API制限超過でブロック
   - 対策: 安全マージン追加

2. **キャッシュヒット率30%達成**
   - リスク: 目標未達でコスト増
   - 対策: キャッシュキー最適化

---

## 🔗 Related Documents

- [SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md) - 要件定義
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - 実装ロードマップ
- [GAP_ANALYSIS.md](GAP_ANALYSIS.md) - 差分分析（次のドキュメント）

---

**Document Status**: ✅ Phase 0 - Analysis Complete
**Next Action**: GAP_ANALYSIS.md作成 → Phase 1開始

**Analyzed by**: System Architect
**Date**: 2025-10-25
