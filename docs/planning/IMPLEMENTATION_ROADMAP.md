# Miyabi System Implementation Roadmap

**Document Version**: 1.0.0
**Last Updated**: 2025-10-25
**Status**: Ready for Implementation

---

## 📋 Overview

本ロードマップは、[SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md)で定義した要件を、既存のMiyabi Rust実装に統合するための実装計画です。

**既存実装状況**:
- ✅ 基本的なCargo workspace構成済み (28 crates)
- ✅ Agent実装済み (Coordinator, CodeGen, Review, Workflow, Business)
- ✅ GitHub統合済み (miyabi-github)
- ✅ Worktree管理済み (miyabi-worktree)
- ✅ LLM統合済み (miyabi-llm)
- ✅ Knowledge管理済み (miyabi-knowledge)
- ✅ CLI実装済み (miyabi-cli)

**新規実装が必要な領域**:
1. ✨ 5-Worlds並列実行戦略
2. ✨ エラーハンドリング（Retry, Circuit Breaker）
3. ✨ 動的スケーリング
4. ✨ 状態永続化（SQLite, Checkpoint）
5. ✨ セキュリティ（静的解析, 分離実行）
6. ✨ 観測可能性（Prometheus, OpenTelemetry）
7. ✨ コスト最適化（追跡, キャッシング）

---

## 🗺️ Crate Mapping - 要件定義 vs 既存実装

| 要件定義Crate | 既存Crate | 実装状況 | アクション |
|--------------|-----------|---------|----------|
| `miyabi-types` | ✅ `miyabi-types` | 実装済み | **拡張**: WorldId, WorldConfig追加 |
| `miyabi-core` | ✅ `miyabi-core` | 実装済み | **拡張**: error_policy.rs, resource_limits.rs追加 |
| `miyabi-worktree` | ✅ `miyabi-worktree` | 実装済み | **拡張**: 5-Worlds対応 |
| `miyabi-llm` | ✅ `miyabi-llm` | 実装済み | **拡張**: rate_limiter.rs, cache.rs追加 |
| `miyabi-scheduler` | ✅ `miyabi-orchestrator` | 実装済み | **拡張**: dynamic_scaling.rs追加 |
| `miyabi-persistence` | ❌ **新規** | 未実装 | **作成**: SQLite永続化層 |
| `miyabi-recovery` | ❌ **新規** | 未実装 | **作成**: 復旧システム |
| `miyabi-gc` | ❌ **新規** | 未実装 | **作成**: GC機能 |
| `miyabi-security` | ❌ **新規** | 未実装 | **作成**: セキュリティ層 |
| `miyabi-observability` | ❌ **新規** | 未実装 | **作成**: 観測可能性 |
| `miyabi-cost` | ❌ **新規** | 未実装 | **作成**: コスト管理 |

---

## 📅 Implementation Phases

### Phase 0: 既存システム評価 (Week 0, Day 1-2)

**目的**: 既存実装を評価し、要件定義との差分を明確化

**タスク**:
- [x] 既存crate構成の確認
- [ ] 既存Agent実装のレビュー
- [ ] 既存Worktree管理のレビュー
- [ ] 既存LLM統合のレビュー
- [ ] 差分分析レポート作成

**成果物**:
- `docs/EXISTING_SYSTEM_ANALYSIS.md`
- `docs/GAP_ANALYSIS.md`

---

### Phase 1: Core Types & Error Handling (Week 1, Day 1-5)

**目的**: 5-Worldsコア型定義とエラーハンドリング基盤を実装

#### 1.1 `miyabi-types` 拡張

**ファイル**: `crates/miyabi-types/src/world.rs`

```rust
// 新規追加
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum WorldId {
    Alpha,   // T=0.3
    Beta,    // T=0.7
    Gamma,   // T=1.2
    Delta,   // Alternative prompt
    Epsilon, // Alternative model
}

impl WorldId {
    pub fn all() -> [WorldId; 5] {
        [Self::Alpha, Self::Beta, Self::Gamma, Self::Delta, Self::Epsilon]
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldConfig {
    pub id: WorldId,
    pub model: String,
    pub temperature: f64,
    pub prompt_variant: PromptVariant,
    pub worktree_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PromptVariant {
    Standard,
    AlternativeA,  // Delta用
    AlternativeB,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationScore {
    pub compilation_success: f64,  // 30点
    pub test_pass_rate: f64,       // 30点
    pub clippy_score: f64,         // 20点
    pub code_quality: f64,         // 10点
    pub security_score: f64,       // 10点
    pub total: f64,                // 100点
}
```

**受入条件**:
- [ ] WorldId型が5つのWorld全てをサポート
- [ ] WorldConfig::default_for(WorldId)が動作
- [ ] EvaluationScore::calculate()が正確に100点満点で計算

#### 1.2 `miyabi-core` エラーハンドリング拡張

**ファイル**: `crates/miyabi-core/src/error_policy.rs`

```rust
// 新規作成
#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_attempts: usize,           // 3回
    pub base_delay: Duration,          // 1秒
    pub max_delay: Duration,           // 60秒
    pub backoff_multiplier: f64,       // 2.0
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            base_delay: Duration::from_secs(1),
            max_delay: Duration::from_secs(60),
            backoff_multiplier: 2.0,
        }
    }
}

pub async fn retry_with_backoff<F, T, E>(
    config: &RetryConfig,
    mut operation: F,
) -> Result<T, E>
where
    F: FnMut() -> Pin<Box<dyn Future<Output = Result<T, E>>>>,
{
    // 実装: 指数バックオフでリトライ
}

#[derive(Debug, Clone)]
pub enum FallbackStrategy {
    AcceptPartialSuccess { min_successful_worlds: usize },
    RetryWithLowerTemperature { temperature_reduction: f64 },
    SwitchModel { fallback_model: String },
    WaitForHumanIntervention { timeout: Duration },
    SkipTask,
}

#[derive(Debug)]
pub struct CircuitBreaker {
    failure_threshold: usize,      // 5回
    success_threshold: usize,      // 2回
    timeout: Duration,             // 60秒
    state: Arc<Mutex<CircuitState>>,
    consecutive_failures: Arc<Mutex<usize>>,
    consecutive_successes: Arc<Mutex<usize>>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CircuitState {
    Closed,    // 正常
    Open,      // 遮断
    HalfOpen,  // テスト
}
```

**受入条件**:
- [ ] retry_with_backoff()が3回までリトライ
- [ ] 待機時間が指数的に増加 (1s → 2s → 4s)
- [ ] CircuitBreakerが5回連続失敗で開く

**ファイル**: `crates/miyabi-core/src/resource_limits.rs`

```rust
// 新規作成
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareLimits {
    pub total_memory_gb: usize,    // 32GB
    pub total_cpu_cores: usize,    // 8 cores
    pub total_disk_gb: usize,      // 500GB
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerWorktreeLimits {
    pub memory_gb: usize,          // 2GB
    pub cpu_threads: usize,        // 2 threads
    pub disk_gb: usize,            // 5GB
}

impl HardwareLimits {
    pub fn detect() -> Result<Self> {
        // システムから自動検出
    }

    pub fn max_concurrent_worktrees(&self, per_worktree: &PerWorktreeLimits) -> usize {
        let memory_limit = self.total_memory_gb / per_worktree.memory_gb;
        let cpu_limit = self.total_cpu_cores / per_worktree.cpu_threads;
        let disk_limit = self.total_disk_gb / per_worktree.disk_gb;

        memory_limit.min(cpu_limit).min(disk_limit)
    }
}
```

**受入条件**:
- [ ] HardwareLimits::detect()が正確にシステム情報を取得
- [ ] max_concurrent_worktrees()が正しく計算される

**テスト**:
```bash
cargo test --package miyabi-core -- error_policy
cargo test --package miyabi-core -- resource_limits
```

---

### Phase 2: 5-Worlds Worktree Integration (Week 1, Day 6-7 + Week 2, Day 1-3)

**目的**: Worktree管理を5-Worlds戦略に対応

#### 2.1 `miyabi-worktree` 拡張

**ファイル**: `crates/miyabi-worktree/src/five_worlds.rs`

```rust
// 新規作成
pub struct FiveWorldsManager {
    base_path: PathBuf,
    worktree_manager: WorktreeManager,
    active_worlds: Arc<Mutex<HashMap<WorldId, WorktreeHandle>>>,
}

impl FiveWorldsManager {
    pub async fn spawn_all_worlds(
        &self,
        issue_number: u64,
        task_name: &str,
    ) -> Result<HashMap<WorldId, WorktreeHandle>> {
        let mut handles = HashMap::new();

        for world_id in WorldId::all() {
            let handle = self.spawn_world(issue_number, task_name, world_id).await?;
            handles.insert(world_id, handle);
        }

        Ok(handles)
    }

    pub async fn spawn_world(
        &self,
        issue_number: u64,
        task_name: &str,
        world_id: WorldId,
    ) -> Result<WorktreeHandle> {
        let branch_name = format!("world-{:?}-issue-{}-{}", world_id, issue_number, task_name);
        let worktree_path = self.base_path
            .join(format!("world-{:?}", world_id))
            .join(format!("issue-{}", issue_number))
            .join(task_name);

        self.worktree_manager.create_worktree(&worktree_path, &branch_name).await
    }

    pub async fn cleanup_all_worlds(&self, issue_number: u64) -> Result<()> {
        for world_id in WorldId::all() {
            if let Some(handle) = self.active_worlds.lock().await.remove(&world_id) {
                self.worktree_manager.cleanup_worktree(&handle).await?;
            }
        }
        Ok(())
    }
}
```

**受入条件**:
- [ ] spawn_all_worlds()が5つのWorktreeを作成
- [ ] 各Worldが独立したディレクトリで動作
- [ ] cleanup_all_worlds()が全Worktreeを削除

**テスト**:
```bash
cargo test --package miyabi-worktree -- five_worlds
```

---

### Phase 3: LLM Rate Limiting & Caching (Week 2, Day 4-7)

**目的**: LLMコスト最適化基盤を実装

#### 3.1 `miyabi-llm` 拡張

**ファイル**: `crates/miyabi-llm/src/rate_limiter.rs`

```rust
// 新規作成
pub struct RateLimiter {
    requests_per_minute: usize,        // 50
    tokens_per_minute: usize,          // 40,000
    request_history: Arc<Mutex<VecDeque<Instant>>>,
    token_history: Arc<Mutex<VecDeque<(Instant, usize)>>>,
}

impl RateLimiter {
    pub async fn acquire_permit(&self, estimated_tokens: usize) -> Result<()> {
        // スライディングウィンドウ実装
    }
}
```

**ファイル**: `crates/miyabi-llm/src/cache.rs`

```rust
// 新規作成
use lru::LruCache;

pub struct LlmResponseCache {
    cache: Arc<Mutex<LruCache<CacheKey, CachedResponse>>>,
    hit_count: Arc<Mutex<usize>>,
    miss_count: Arc<Mutex<usize>>,
}

#[derive(Hash, Eq, PartialEq)]
struct CacheKey {
    prompt_hash: String,  // SHA256
    model: String,
    temperature: String,  // "0.7"
}

impl LlmResponseCache {
    pub fn new(capacity: usize) -> Self {
        // 1000エントリーのLRUキャッシュ
    }

    pub async fn get(&self, prompt: &str, model: &str, temperature: f64) -> Option<String> {
        // キャッシュヒット判定（7日間有効）
    }

    pub async fn put(&self, prompt: &str, model: &str, temperature: f64, response: String) {
        // キャッシュに保存
    }

    pub async fn hit_rate(&self) -> f64 {
        // ヒット率計算（目標30%）
    }
}
```

**依存関係追加**:
```toml
# crates/miyabi-llm/Cargo.toml
[dependencies]
lru = "0.12"
sha2 = "0.10"
```

**受入条件**:
- [ ] RateLimiterが50 req/min, 40K tokens/minを厳守
- [ ] Cacheが1000エントリーまで保持
- [ ] キャッシュヒット率が測定可能

**テスト**:
```bash
cargo test --package miyabi-llm -- rate_limiter
cargo test --package miyabi-llm -- cache
```

---

### Phase 4: Persistence & Recovery (Week 3, Day 1-7)

**目的**: SQLite永続化とチェックポイント/復旧システム実装

#### 4.1 新規crate: `miyabi-persistence`

**作成**:
```bash
cargo new --lib crates/miyabi-persistence
```

**ファイル**: `crates/miyabi-persistence/Cargo.toml`

```toml
[package]
name = "miyabi-persistence"
version.workspace = true
edition.workspace = true

[dependencies]
tokio.workspace = true
async-trait.workspace = true
serde.workspace = true
serde_json.workspace = true
anyhow.workspace = true
thiserror.workspace = true
chrono.workspace = true

sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite", "chrono", "json"] }
miyabi-types = { path = "../miyabi-types" }

[dev-dependencies]
tempfile.workspace = true
```

**ファイル**: `crates/miyabi-persistence/src/schema.rs`

```rust
// SQLスキーマ定義
pub const SCHEMA_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS execution_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    total_cost_usd REAL DEFAULT 0.0,
    winning_world_id TEXT,
    final_score REAL
);

CREATE TABLE IF NOT EXISTS task_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id)
);

CREATE TABLE IF NOT EXISTS world_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    world_id TEXT NOT NULL,
    worktree_path TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    evaluation_score REAL,
    cost_usd REAL DEFAULT 0.0,
    FOREIGN KEY (task_id) REFERENCES task_executions(id)
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    checkpoint_type TEXT NOT NULL,
    world_id TEXT,
    data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id)
);

CREATE TABLE IF NOT EXISTS worktrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL,
    path TEXT NOT NULL,
    branch TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL,
    is_orphaned BOOLEAN DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_run_id ON checkpoints(run_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_type ON checkpoints(checkpoint_type);
CREATE INDEX IF NOT EXISTS idx_worktrees_last_accessed ON worktrees(last_accessed_at);
"#;
```

**ファイル**: `crates/miyabi-persistence/src/checkpoint.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CheckpointType {
    WorktreeCreated { world_id: WorldId, path: PathBuf, branch: String },
    WorldsSpawned { task_id: i64, world_ids: Vec<WorldId> },
    WorldCompleted { world_id: WorldId, score: f64, artifacts: Vec<PathBuf> },
    EvaluationDone { winning_world: WorldId, all_scores: HashMap<WorldId, f64> },
    MergeReady { winning_world: WorldId, pr_number: Option<u64> },
}

pub struct CheckpointManager {
    db: Arc<SqlitePool>,
    interval: Duration,  // 5分
}

impl CheckpointManager {
    pub async fn save_checkpoint(&self, run_id: i64, checkpoint: CheckpointType) -> Result<()> {
        // 実装
    }

    pub async fn get_latest_checkpoint(&self, run_id: i64) -> Result<Option<CheckpointType>> {
        // 実装
    }

    pub async fn auto_checkpoint_loop(&self, run_id: i64) {
        // 5分ごとに自動保存
    }
}
```

**受入条件**:
- [ ] SQLiteデータベースが正常に作成される
- [ ] 5分ごとに自動チェックポイントが保存される
- [ ] 5種類のCheckpointTypeが全てサポートされる

#### 4.2 新規crate: `miyabi-recovery`

**作成**:
```bash
cargo new --lib crates/miyabi-recovery
```

**ファイル**: `crates/miyabi-recovery/src/lib.rs`

```rust
pub struct RecoveryManager {
    db: Arc<SqlitePool>,
    checkpoint_manager: Arc<CheckpointManager>,
}

impl RecoveryManager {
    pub async fn detect_interrupted_runs(&self) -> Result<Vec<i64>> {
        // 中断されたrun_idを検出
    }

    pub async fn resume_from_checkpoint(&self, run_id: i64) -> Result<()> {
        // チェックポイントから復旧
    }
}
```

**受入条件**:
- [ ] 起動時に中断タスクが自動検出される
- [ ] 最新チェックポイントから復旧できる

#### 4.3 新規crate: `miyabi-gc`

**作成**:
```bash
cargo new --lib crates/miyabi-gc
```

**ファイル**: `crates/miyabi-gc/src/lib.rs`

```rust
pub struct GarbageCollector {
    db: Arc<SqlitePool>,
    worktree_manager: Arc<WorktreeManager>,
    worktree_lifetime: Duration,  // 24時間
}

impl GarbageCollector {
    pub async fn collect_orphaned_worktrees(&self) -> Result<usize> {
        // 24時間以上古いWorktreeを削除
    }

    pub async fn gc_loop(&self) {
        // 1時間ごとに実行
    }
}
```

**受入条件**:
- [ ] 24時間後に孤児Worktreeが削除される
- [ ] 1時間ごとにGCが自動実行される

**Workspace更新**:
```toml
# Cargo.toml
[workspace]
members = [
    # ...既存...
    "crates/miyabi-persistence",
    "crates/miyabi-recovery",
    "crates/miyabi-gc",
]
```

**テスト**:
```bash
cargo test --package miyabi-persistence
cargo test --package miyabi-recovery
cargo test --package miyabi-gc
```

---

### Phase 5: Security Layer (Week 4, Day 1-7)

**目的**: 4層防御セキュリティシステム実装

#### 5.1 新規crate: `miyabi-security`

**作成**:
```bash
cargo new --lib crates/miyabi-security
```

**依存関係**:
```toml
# crates/miyabi-security/Cargo.toml
[dependencies]
syn = { version = "2.0", features = ["full", "parsing", "visit"] }
regex = "1.10"
sha2 = "0.10"
```

**ファイル**: `crates/miyabi-security/src/threat_model.rs`

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ThreatSeverity {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone)]
pub enum ThreatType {
    MaliciousCodeGeneration { pattern: String, severity: ThreatSeverity },
    UnsafeRustUsage { location: String, severity: ThreatSeverity },
    SecretLeakage { secret_type: SecretType, severity: ThreatSeverity },
    UnauthorizedNetworkAccess { destination: String, severity: ThreatSeverity },
    FileSystemAttack { target_path: PathBuf, severity: ThreatSeverity },
}
```

**ファイル**: `crates/miyabi-security/src/static_analysis.rs`

```rust
pub struct StaticAnalyzer {
    unsafe_detector: UnsafeDetector,
    dependency_checker: DependencyChecker,
    secret_scanner: SecretScanner,
}

impl StaticAnalyzer {
    pub async fn analyze_generated_code(
        &self,
        code: &str,
        world_id: WorldId,
    ) -> Result<SecurityReport> {
        let mut report = SecurityReport::default();

        // 1. Unsafe検出
        report.unsafe_blocks = self.unsafe_detector.scan(code)?;

        // 2. 依存関係チェック
        report.external_dependencies = self.dependency_checker.check_cargo_toml(code)?;

        // 3. シークレット漏洩検出
        report.leaked_secrets = self.secret_scanner.scan(code)?;

        // リスクレベル計算
        report.risk_level = self.calculate_risk_level(&report);

        if report.risk_level >= RiskLevel::High {
            return Err(SecurityError::HighRiskCodeDetected { report }.into());
        }

        Ok(report)
    }
}
```

**ファイル**: `crates/miyabi-security/src/isolation.rs`

```rust
pub struct IsolationManager {
    strategy: IsolationStrategy,
}

#[derive(Debug, Clone)]
pub enum IsolationStrategy {
    Docker {
        image: String,
        network: NetworkMode,
        cpu_limit: f64,
        memory_limit: String,
        read_only_fs: bool,
    },
    Process { chroot: bool, namespace: bool },
    None,
}

impl IsolationManager {
    pub async fn execute_in_container(
        &self,
        world_id: WorldId,
        command: &str,
        worktree_path: &Path,
    ) -> Result<Output> {
        // Docker分離実行
    }
}
```

**受入条件**:
- [ ] 5種類の静的解析が実行される
- [ ] High以上のリスクで実行がブロックされる
- [ ] Docker分離がデフォルトで有効

**テスト**:
```bash
cargo test --package miyabi-security
```

---

### Phase 6: Observability (Week 5, Day 1-7)

**目的**: 構造化ログ、メトリクス、トレーシング実装

#### 6.1 新規crate: `miyabi-observability`

**作成**:
```bash
cargo new --lib crates/miyabi-observability
```

**依存関係**:
```toml
# crates/miyabi-observability/Cargo.toml
[dependencies]
tracing.workspace = true
tracing-subscriber = { workspace = true, features = ["json"] }
prometheus = { version = "0.13", features = ["process"] }
opentelemetry = { version = "0.27", features = ["trace"] }
opentelemetry-otlp = { version = "0.27", features = ["trace", "tonic"] }
tracing-opentelemetry = "0.28"
```

**ファイル**: `crates/miyabi-observability/src/logging.rs`

```rust
pub fn init_logging() -> Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().json())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();
    Ok(())
}

pub struct IssueLogger { span: Span }
pub struct TaskLogger { span: Span }
pub struct WorldLogger { span: Span }
```

**ファイル**: `crates/miyabi-observability/src/metrics.rs`

```rust
use prometheus::{Counter, Gauge, Histogram};

lazy_static! {
    pub static ref ISSUES_TOTAL: Counter = register_counter!("miyabi_issues_total", "...").unwrap();
    pub static ref ACTIVE_WORKTREES: Gauge = register_gauge!("miyabi_active_worktrees", "...").unwrap();
    pub static ref TASK_DURATION: Histogram = register_histogram!("miyabi_task_duration_seconds", "...").unwrap();
}
```

**ファイル**: `crates/miyabi-observability/src/tracing_setup.rs`

```rust
pub fn init_tracing(otlp_endpoint: &str) -> Result<()> {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(/* ... */)
        .install_batch(opentelemetry::runtime::Tokio)?;

    tracing_subscriber::registry()
        .with(OpenTelemetryLayer::new(tracer))
        .init();

    Ok(())
}
```

**受入条件**:
- [ ] JSON構造化ログが出力される
- [ ] 20+個のPrometheusメトリクスが定義される
- [ ] OpenTelemetryトレースが動作する

**テスト**:
```bash
cargo test --package miyabi-observability
```

---

### Phase 7: Cost Optimization (Week 6, Day 1-7)

**目的**: コスト追跡、早期打ち切り、モデル選択実装

#### 7.1 新規crate: `miyabi-cost`

**作成**:
```bash
cargo new --lib crates/miyabi-cost
```

**ファイル**: `crates/miyabi-cost/src/tracker.rs`

```rust
pub struct CostTracker {
    db: Arc<SqlitePool>,
    current_month_cost: Arc<Mutex<f64>>,
}

impl CostTracker {
    pub async fn record_llm_call(
        &self,
        world_id: WorldId,
        model: &str,
        input_tokens: usize,
        output_tokens: usize,
    ) -> Result<f64> {
        let cost = self.calculate_cost(model, input_tokens, output_tokens);
        // DBに記録
        Ok(cost)
    }

    fn calculate_cost(&self, model: &str, input_tokens: usize, output_tokens: usize) -> f64 {
        let pricing = match model {
            "gpt-4o" => (0.005, 0.015),
            "gpt-4o-mini" => (0.00015, 0.0006),
            "claude-3-5-sonnet" => (0.003, 0.015),
            _ => (0.001, 0.002),
        };

        (input_tokens as f64 / 1_000_000.0) * pricing.0 +
        (output_tokens as f64 / 1_000_000.0) * pricing.1
    }
}
```

**ファイル**: `crates/miyabi-cost/src/early_termination.rs`

```rust
pub struct EarlyTerminationPolicy {
    rules: Vec<TerminationRule>,
}

#[derive(Debug)]
pub enum TerminationRule {
    TestFailureTimeout { duration: Duration, min_pass_rate: f64 },
    CompilationFailureTimeout { duration: Duration },
    PerIssueCostExceeded { threshold_usd: f64 },
    RepeatedFailurePattern { max_repeats: usize },
}
```

**ファイル**: `crates/miyabi-cost/src/model_selector.rs`

```rust
pub struct ModelSelector;

impl ModelSelector {
    pub fn select_model_for_task(task: &Task) -> ModelConfig {
        match task.complexity() {
            TaskComplexity::Simple => ModelConfig {
                model: "gpt-4o-mini".to_string(),
                temperature: 0.5,
                max_tokens: 2000,
            },
            TaskComplexity::Medium => ModelConfig {
                model: "gpt-4o".to_string(),
                temperature: 0.7,
                max_tokens: 4000,
            },
            TaskComplexity::Complex => ModelConfig {
                model: "claude-3-5-sonnet".to_string(),
                temperature: 0.7,
                max_tokens: 8000,
            },
        }
    }
}
```

**受入条件**:
- [ ] 全LLM呼び出しでコストが記録される
- [ ] 早期打ち切り条件が動作する
- [ ] モデル選択が複雑度に応じて変わる

**テスト**:
```bash
cargo test --package miyabi-cost
```

---

### Phase 8: Integration & Agent Enhancement (Week 7, Day 1-7)

**目的**: 既存Agentと新システムの統合

#### 8.1 `miyabi-orchestrator` 拡張

**ファイル**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

```rust
// 新規作成
pub struct FiveWorldsExecutor {
    worktree_manager: Arc<FiveWorldsManager>,
    llm_client: Arc<LlmClient>,
    cost_tracker: Arc<CostTracker>,
    checkpoint_manager: Arc<CheckpointManager>,
}

impl FiveWorldsExecutor {
    pub async fn execute_task_with_five_worlds(
        &self,
        issue_number: u64,
        task: Task,
    ) -> Result<WorldExecutionResult> {
        // 1. 5つのWorktree作成
        let worktrees = self.worktree_manager.spawn_all_worlds(issue_number, &task.name).await?;

        // 2. チェックポイント保存
        self.checkpoint_manager.save_checkpoint(
            run_id,
            CheckpointType::WorldsSpawned {
                task_id: task.id,
                world_ids: WorldId::all().to_vec(),
            },
        ).await?;

        // 3. 5つのWorldを並列実行
        let mut handles = vec![];
        for (world_id, worktree) in worktrees {
            let handle = self.execute_single_world(world_id, worktree, task.clone());
            handles.push(handle);
        }

        let results = futures::future::join_all(handles).await;

        // 4. 評価
        let scores = self.evaluate_all_worlds(&results).await?;

        // 5. 勝者選択
        let winner = scores.iter()
            .max_by(|a, b| a.1.total.partial_cmp(&b.1.total).unwrap())
            .map(|(id, _)| *id)
            .ok_or_else(|| anyhow!("No winner"))?;

        // 6. チェックポイント保存
        self.checkpoint_manager.save_checkpoint(
            run_id,
            CheckpointType::EvaluationDone {
                winning_world: winner,
                all_scores: scores.clone(),
            },
        ).await?;

        Ok(WorldExecutionResult { winner, scores, results })
    }
}
```

**受入条件**:
- [ ] 5つのWorldが並列実行される
- [ ] 評価スコアが正確に計算される
- [ ] 最高スコアのWorldが選択される

#### 8.2 `miyabi-agent-coordinator` 統合

**ファイル**: `crates/miyabi-agent-coordinator/src/lib.rs`

```rust
// 既存コードに統合
use miyabi_orchestrator::FiveWorldsExecutor;

impl CoordinatorAgent {
    pub async fn execute_with_five_worlds(&self, issue: Issue) -> Result<()> {
        // 既存のタスク分解ロジック
        let tasks = self.decompose_into_tasks(&issue).await?;

        // 5-Worlds実行
        let executor = FiveWorldsExecutor::new(/* ... */);

        for task in tasks {
            let result = executor.execute_task_with_five_worlds(issue.number, task).await?;
            tracing::info!("Task completed with winner: {:?}", result.winner);
        }

        Ok(())
    }
}
```

**受入条件**:
- [ ] CoordinatorAgentが5-Worlds戦略を使用
- [ ] タスク分解が正常に動作
- [ ] 勝者のみがマージされる

---

### Phase 9: Testing & Validation (Week 8, Day 1-7)

**目的**: 統合テスト、E2Eテスト、ベンチマークテスト

#### 9.1 統合テスト

**ファイル**: `crates/miyabi-e2e-tests/tests/five_worlds_integration.rs`

```rust
#[tokio::test]
async fn test_five_worlds_execution() {
    // 5-Worlds戦略の統合テスト
}

#[tokio::test]
async fn test_checkpoint_recovery() {
    // チェックポイント復旧テスト
}

#[tokio::test]
async fn test_cost_tracking() {
    // コスト追跡テスト
}
```

#### 9.2 E2Eテスト

```bash
# 実際のIssueでテスト
miyabi agent coordinator --issue 500  # テスト用Issue
```

#### 9.3 ベンチマークテスト

**ファイル**: `crates/miyabi-benchmark/benches/five_worlds.rs`

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_five_worlds_spawn(c: &mut Criterion) {
    c.bench_function("spawn_all_worlds", |b| {
        b.iter(|| {
            // ベンチマーク
        });
    });
}
```

**実行**:
```bash
cargo bench --package miyabi-benchmark
```

**受入条件**:
- [ ] 全統合テストが合格
- [ ] E2Eテストが成功
- [ ] ベンチマーク結果が目標値内

---

## 📊 Progress Tracking

### Week 0: Planning & Analysis
- [x] 既存システム評価開始
- [ ] 差分分析完了
- [ ] 実装優先順位確定

### Week 1: Core Types & Error Handling
- [ ] miyabi-types拡張完了
- [ ] miyabi-core拡張完了
- [ ] miyabi-worktree拡張開始

### Week 2: Worktree & LLM
- [ ] miyabi-worktree拡張完了
- [ ] miyabi-llm拡張完了

### Week 3: Persistence
- [ ] miyabi-persistence実装完了
- [ ] miyabi-recovery実装完了
- [ ] miyabi-gc実装完了

### Week 4: Security
- [ ] miyabi-security実装完了

### Week 5: Observability
- [ ] miyabi-observability実装完了

### Week 6: Cost
- [ ] miyabi-cost実装完了

### Week 7: Integration
- [ ] Agent統合完了

### Week 8: Testing
- [ ] 全テスト合格

---

## 🎯 Success Criteria

### 機能要件
- [ ] 5つのWorldが並列実行される
- [ ] 評価スコア100点満点で計算される
- [ ] 勝者のみがmainにマージされる

### 品質要件
- [ ] コンパイル成功率 > 80%
- [ ] テスト合格率 > 70%
- [ ] Clippy警告数 < 10

### 性能要件
- [ ] Issue処理時間 < 30分
- [ ] LLMレイテンシ < 10秒 (p95)
- [ ] メモリ使用率 < 90%

### コスト要件
- [ ] 月額予算 $1000以内
- [ ] Issue単価 $5.00以内
- [ ] キャッシュヒット率 > 30%

---

## 🔗 Related Documents

- [SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md) - 要件定義
- [ENTITY_RELATION_MODEL.md](ENTITY_RELATION_MODEL.md) - Entity定義
- [LABEL_SYSTEM_GUIDE.md](LABEL_SYSTEM_GUIDE.md) - Label体系
- [VERIFICATION_REPORT.md](../VERIFICATION_REPORT.md) - システム検証レポート

---

**Document Status**: ✅ Ready for Implementation
**Next Action**: Week 0 - 既存システム分析開始

**Approved by**: System Architect
**Date**: 2025-10-25
