# Miyabi System Requirements Specification v2.0

**Document Version**: 2.0.0
**Last Updated**: 2025-10-25
**Status**: FINAL - Ready for Implementation

---

## 📋 Executive Summary

本ドキュメントは、Miyabi自律型開発フレームワークの完全な要件定義書です。6つの設計フェーズを経て確定した全仕様を統合しています。

**システム概要**:
- **目的**: GitHub Issueを入力として、コード実装からPR作成まで完全自動化
- **コア技術**: 5-Worlds並列実行戦略による品質保証
- **実装言語**: Rust 2021 Edition
- **アーキテクチャ**: Git Worktree並列分離実行

---

## 🎯 Core Requirements

### CR-1: 5-Worlds Quality Assurance Strategy

**優先度**: ⭐⭐⭐⭐⭐ (CRITICAL)

**要件**:
LLMの確率論的出力特性に対処するため、全てのコード生成タスクは**必ず5つのパラレルワールドで同時実行**し、評価後に最良の1つのみを現実化する。

**詳細仕様**:

```rust
// crates/miyabi-types/src/world.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WorldId {
    Alpha,   // 保守的 (T=0.3)
    Beta,    // バランス (T=0.7)
    Gamma,   // 創造的 (T=1.2)
    Delta,   // 代替プロンプト
    Epsilon, // 代替モデル
}

pub struct WorldConfig {
    pub id: WorldId,
    pub model: String,
    pub temperature: f64,
    pub prompt_variant: PromptVariant,
    pub worktree_path: PathBuf,
}

impl Default for WorldConfig {
    fn default_for(id: WorldId) -> Self {
        match id {
            WorldId::Alpha => Self {
                id,
                model: "gpt-4o".into(),
                temperature: 0.3,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/alpha"),
            },
            WorldId::Beta => Self {
                id,
                model: "gpt-4o".into(),
                temperature: 0.7,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/beta"),
            },
            WorldId::Gamma => Self {
                id,
                model: "gpt-4o".into(),
                temperature: 1.2,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/gamma"),
            },
            WorldId::Delta => Self {
                id,
                model: "gpt-4o".into(),
                temperature: 0.7,
                prompt_variant: PromptVariant::AlternativeA,
                worktree_path: PathBuf::from("worktrees/delta"),
            },
            WorldId::Epsilon => Self {
                id,
                model: "claude-3-5-sonnet".into(),
                temperature: 0.7,
                prompt_variant: PromptVariant::Standard,
                worktree_path: PathBuf::from("worktrees/epsilon"),
            },
        }
    }
}
```

**評価基準** (100点満点):
```rust
pub struct EvaluationScore {
    pub compilation_success: f64,      // 30点: コンパイル成功=30, 失敗=0
    pub test_pass_rate: f64,           // 30点: テスト合格率 × 30
    pub clippy_score: f64,             // 20点: (1 - warnings/100) × 20
    pub code_quality: f64,             // 10点: 可読性・保守性
    pub security_score: f64,           // 10点: セキュリティ分析結果
    pub total: f64,                    // 合計100点
}

impl EvaluationScore {
    pub fn calculate(world: &WorldExecution) -> Self {
        let compilation = if world.build_success { 30.0 } else { 0.0 };
        let tests = (world.tests_passed as f64 / world.tests_total.max(1) as f64) * 30.0;
        let clippy = (1.0 - (world.clippy_warnings as f64 / 100.0).min(1.0)) * 20.0;
        let quality = world.code_quality_metrics.overall_score * 10.0;
        let security = world.security_report.score * 10.0;

        Self {
            compilation_success: compilation,
            test_pass_rate: tests,
            clippy_score: clippy,
            code_quality: quality,
            security_score: security,
            total: compilation + tests + clippy + quality + security,
        }
    }
}
```

**受入条件**:
- [ ] 5つのWorldが独立したWorktreeで並列実行される
- [ ] 各Worldが異なるLLMパラメータで実行される
- [ ] 評価スコアが正確に計算される
- [ ] 最高スコアのWorldのみがmainブランチにマージされる
- [ ] 失敗したWorldは自動クリーンアップされる

---

### CR-2: Git Worktree Isolation

**優先度**: ⭐⭐⭐⭐⭐ (CRITICAL)

**要件**:
各Worldは完全に独立したGit Worktreeで実行され、相互干渉を防ぐ。

**詳細仕様**:

```rust
// crates/miyabi-worktree/src/manager.rs
pub struct WorktreeManager {
    base_path: PathBuf,
    active_worktrees: Arc<Mutex<HashMap<WorldId, WorktreeHandle>>>,
}

impl WorktreeManager {
    pub async fn create_worktree(
        &self,
        world_id: WorldId,
        issue_number: u64,
    ) -> Result<WorktreeHandle> {
        let branch_name = format!("world-{:?}-issue-{}", world_id, issue_number);
        let worktree_path = self.base_path.join(&branch_name);

        // Git worktree作成
        Command::new("git")
            .args(["worktree", "add", worktree_path.to_str().unwrap(), "-b", &branch_name])
            .output()
            .await?;

        let handle = WorktreeHandle {
            world_id,
            path: worktree_path,
            branch: branch_name,
            created_at: Utc::now(),
        };

        self.active_worktrees.lock().await.insert(world_id, handle.clone());

        Ok(handle)
    }

    pub async fn cleanup_worktree(&self, world_id: WorldId) -> Result<()> {
        if let Some(handle) = self.active_worktrees.lock().await.remove(&world_id) {
            // Worktree削除
            Command::new("git")
                .args(["worktree", "remove", "--force", handle.path.to_str().unwrap()])
                .output()
                .await?;

            // ブランチ削除
            Command::new("git")
                .args(["branch", "-D", &handle.branch])
                .output()
                .await?;
        }
        Ok(())
    }
}
```

**受入条件**:
- [ ] 各Worldが独立したWorktreeで実行される
- [ ] Worktree間でファイル変更が干渉しない
- [ ] 失敗時に自動的にWorktreeが削除される
- [ ] 最大同時Worktree数が制限される (リソース制約に従う)

---

## 🛡️ Phase 1: Error Handling Strategy

### REQ-ERR-1: Retry Policy

**詳細仕様**:

```rust
// crates/miyabi-core/src/error_policy.rs
#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_attempts: usize,           // 3回
    pub base_delay: Duration,          // 1秒
    pub max_delay: Duration,           // 60秒
    pub backoff_multiplier: f64,       // 2.0 (指数バックオフ)
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
    let mut attempt = 0;
    let mut delay = config.base_delay;

    loop {
        attempt += 1;

        match operation().await {
            Ok(result) => return Ok(result),
            Err(err) if attempt >= config.max_attempts => return Err(err),
            Err(_) => {
                tokio::time::sleep(delay).await;
                delay = (delay * config.backoff_multiplier as u32)
                    .min(config.max_delay);
            }
        }
    }
}
```

**受入条件**:
- [ ] LLM API呼び出しが3回までリトライされる
- [ ] 待機時間が指数的に増加する (1s → 2s → 4s)
- [ ] 最大60秒を超えない

### REQ-ERR-2: Partial Failure Tolerance

**詳細仕様**:

```rust
pub enum FallbackStrategy {
    // 5つのうち1つが成功すればOK
    AcceptPartialSuccess {
        min_successful_worlds: usize  // デフォルト: 1
    },

    // 温度を下げて再実行
    RetryWithLowerTemperature {
        temperature_reduction: f64    // デフォルト: -0.2
    },

    // 別のモデルに切り替え
    SwitchModel {
        fallback_model: String        // "claude-3-5-sonnet"
    },

    // 人間の介入を待つ
    WaitForHumanIntervention {
        timeout: Duration             // 24時間
    },

    // タスクをスキップ
    SkipTask,
}
```

**受入条件**:
- [ ] 5つのWorldのうち1つでも成功すれば処理続行
- [ ] 全失敗時にフォールバック戦略が適用される
- [ ] フォールバック戦略の選択が適切に行われる

### REQ-ERR-3: Circuit Breaker

**詳細仕様**:

```rust
pub struct CircuitBreaker {
    failure_threshold: usize,          // 5回連続失敗でOPEN
    success_threshold: usize,          // 2回連続成功でCLOSED
    timeout: Duration,                 // 60秒後にHALF_OPEN
    state: Arc<Mutex<CircuitState>>,
    consecutive_failures: Arc<Mutex<usize>>,
    consecutive_successes: Arc<Mutex<usize>>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CircuitState {
    Closed,    // 正常動作
    Open,      // 遮断中
    HalfOpen,  // テスト中
}
```

**受入条件**:
- [ ] 5回連続失敗でサーキットブレーカーが開く
- [ ] 60秒後に半開状態に移行
- [ ] 2回連続成功で正常状態に復帰

---

## 💻 Phase 2: Resource Constraints and Scaling

### REQ-RES-1: Hardware Limits

**詳細仕様**:

```toml
# config/resource_limits.toml
[hardware]
total_memory_gb = 32
total_cpu_cores = 8
total_disk_gb = 500

[per_worktree]
memory_gb = 2
cpu_threads = 2
disk_gb = 5

[calculated]
max_concurrent_worktrees = 4  # min(32/2, 8/2, 500/5) = 4
```

**物理制約**:
- メモリ制約: 32GB / 2GB = 16 Worktrees
- CPU制約: 8 cores / 2 threads = 4 Worktrees ⬅️ **ボトルネック**
- ディスク制約: 500GB / 5GB = 100 Worktrees

**結論**: 最大4つのWorktreeを同時実行可能

**受入条件**:
- [ ] システムがハードウェア制約を正確に検出する
- [ ] 制約を超えるWorktree作成がブロックされる
- [ ] リソース不足時に適切なエラーメッセージが表示される

### REQ-RES-2: Dynamic Scaling

**詳細仕様**:

```rust
// crates/miyabi-scheduler/src/dynamic_scaling.rs
pub struct DynamicScaler {
    resource_monitor: ResourceMonitor,
    current_parallelism: Arc<Mutex<usize>>,
    max_parallelism: usize,
}

impl DynamicScaler {
    pub async fn adjust_parallelism(&self) -> usize {
        let usage = self.resource_monitor.get_current_usage().await;
        let mut parallelism = self.current_parallelism.lock().await;

        // スケールダウン条件
        if usage.memory_percent > 90.0 || usage.cpu_percent > 95.0 || usage.disk_percent > 85.0 {
            *parallelism = (*parallelism - 1).max(1);
            tracing::warn!(
                "Scaling down to {} due to resource pressure: mem={:.1}%, cpu={:.1}%, disk={:.1}%",
                *parallelism, usage.memory_percent, usage.cpu_percent, usage.disk_percent
            );
        }
        // スケールアップ条件
        else if usage.memory_percent < 70.0 && usage.cpu_percent < 75.0 && usage.disk_percent < 70.0 {
            *parallelism = (*parallelism + 1).min(self.max_parallelism);
            tracing::info!("Scaling up to {}", *parallelism);
        }

        *parallelism
    }

    pub async fn monitor_loop(&self) {
        let mut interval = tokio::time::interval(Duration::from_secs(10));
        loop {
            interval.tick().await;
            self.adjust_parallelism().await;
        }
    }
}
```

**受入条件**:
- [ ] 10秒ごとにリソース使用率を監視
- [ ] メモリ90%超過時に並列度を削減
- [ ] CPU95%超過時に並列度を削減
- [ ] リソースに余裕がある時に並列度を増加

### REQ-RES-3: LLM Rate Limiting

**詳細仕様**:

```rust
// crates/miyabi-llm/src/rate_limiter.rs
pub struct RateLimiter {
    requests_per_minute: usize,        // 50
    tokens_per_minute: usize,          // 40,000
    request_history: Arc<Mutex<VecDeque<Instant>>>,
    token_history: Arc<Mutex<VecDeque<(Instant, usize)>>>,
}

impl RateLimiter {
    pub async fn acquire_permit(&self, estimated_tokens: usize) -> Result<()> {
        loop {
            let now = Instant::now();
            let one_minute_ago = now - Duration::from_secs(60);

            // 古いエントリーを削除
            {
                let mut requests = self.request_history.lock().await;
                while requests.front().map_or(false, |t| *t < one_minute_ago) {
                    requests.pop_front();
                }

                let mut tokens = self.token_history.lock().await;
                while tokens.front().map_or(false, |(t, _)| *t < one_minute_ago) {
                    tokens.pop_front();
                }
            }

            // 現在の使用状況を確認
            let current_requests = self.request_history.lock().await.len();
            let current_tokens: usize = self.token_history.lock().await
                .iter()
                .map(|(_, t)| t)
                .sum();

            // 制限内であれば許可
            if current_requests < self.requests_per_minute
                && current_tokens + estimated_tokens < self.tokens_per_minute
            {
                self.request_history.lock().await.push_back(now);
                self.token_history.lock().await.push_back((now, estimated_tokens));
                return Ok(());
            }

            // 制限超過の場合は待機
            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}
```

**受入条件**:
- [ ] 1分間に50リクエストまで制限
- [ ] 1分間に40,000トークンまで制限
- [ ] 制限超過時に自動的に待機
- [ ] スライディングウィンドウで正確に管理

---

## 💾 Phase 3: State Persistence and Recovery

### REQ-PER-1: Database Schema

**詳細仕様**:

```sql
-- schema/miyabi.sql
CREATE TABLE execution_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_number INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'interrupted'
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    total_cost_usd REAL DEFAULT 0.0,
    winning_world_id TEXT,
    final_score REAL
);

CREATE TABLE task_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id)
);

CREATE TABLE world_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    world_id TEXT NOT NULL, -- 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'
    worktree_path TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'terminated'
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    evaluation_score REAL,
    cost_usd REAL DEFAULT 0.0,
    FOREIGN KEY (task_id) REFERENCES task_executions(id)
);

CREATE TABLE checkpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    checkpoint_type TEXT NOT NULL, -- 'worktree_created', 'worlds_spawned', 'world_completed', 'evaluation_done', 'merge_ready'
    world_id TEXT,
    data JSON NOT NULL, -- 任意の状態データ
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(id)
);

CREATE TABLE worktrees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    world_id TEXT NOT NULL,
    path TEXT NOT NULL,
    branch TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL,
    is_orphaned BOOLEAN DEFAULT 0
);

CREATE INDEX idx_checkpoints_run_id ON checkpoints(run_id);
CREATE INDEX idx_checkpoints_type ON checkpoints(checkpoint_type);
CREATE INDEX idx_worktrees_last_accessed ON worktrees(last_accessed_at);
```

**受入条件**:
- [ ] SQLiteデータベースが正常に作成される
- [ ] 全テーブルが定義通りに作成される
- [ ] インデックスが適切に設定される

### REQ-PER-2: Checkpoint System

**詳細仕様**:

```rust
// crates/miyabi-persistence/src/checkpoint.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CheckpointType {
    WorktreeCreated {
        world_id: WorldId,
        path: PathBuf,
        branch: String,
    },
    WorldsSpawned {
        task_id: i64,
        world_ids: Vec<WorldId>,
    },
    WorldCompleted {
        world_id: WorldId,
        score: f64,
        artifacts: Vec<PathBuf>,
    },
    EvaluationDone {
        winning_world: WorldId,
        all_scores: HashMap<WorldId, f64>,
    },
    MergeReady {
        winning_world: WorldId,
        pr_number: Option<u64>,
    },
}

pub struct CheckpointManager {
    db: Arc<SqlitePool>,
    interval: Duration, // 5分
}

impl CheckpointManager {
    pub async fn save_checkpoint(
        &self,
        run_id: i64,
        checkpoint: CheckpointType,
    ) -> Result<()> {
        let data = serde_json::to_string(&checkpoint)?;
        let checkpoint_type_str = checkpoint.type_name();
        let world_id = checkpoint.world_id();

        sqlx::query!(
            "INSERT INTO checkpoints (run_id, checkpoint_type, world_id, data, created_at)
             VALUES (?, ?, ?, ?, ?)",
            run_id,
            checkpoint_type_str,
            world_id,
            data,
            Utc::now()
        )
        .execute(&*self.db)
        .await?;

        Ok(())
    }

    pub async fn get_latest_checkpoint(
        &self,
        run_id: i64,
    ) -> Result<Option<CheckpointType>> {
        let row = sqlx::query!(
            "SELECT data FROM checkpoints
             WHERE run_id = ?
             ORDER BY created_at DESC
             LIMIT 1",
            run_id
        )
        .fetch_optional(&*self.db)
        .await?;

        if let Some(row) = row {
            Ok(Some(serde_json::from_str(&row.data)?))
        } else {
            Ok(None)
        }
    }

    pub async fn auto_checkpoint_loop(&self, run_id: i64) {
        let mut interval = tokio::time::interval(self.interval);
        loop {
            interval.tick().await;
            // 現在の状態を自動保存
            if let Err(e) = self.checkpoint_current_state(run_id).await {
                tracing::error!("Auto checkpoint failed: {}", e);
            }
        }
    }
}
```

**受入条件**:
- [ ] 5分ごとに自動的にチェックポイントが保存される
- [ ] 5種類のチェックポイントタイプが正しく保存される
- [ ] チェックポイントからの復元が正常に動作する

### REQ-PER-3: Recovery System

**詳細仕様**:

```rust
// crates/miyabi-recovery/src/lib.rs
pub struct RecoveryManager {
    db: Arc<SqlitePool>,
    checkpoint_manager: Arc<CheckpointManager>,
}

impl RecoveryManager {
    pub async fn detect_interrupted_runs(&self) -> Result<Vec<i64>> {
        let rows = sqlx::query!(
            "SELECT id FROM execution_runs
             WHERE status = 'running'
             AND started_at < datetime('now', '-5 minutes')"
        )
        .fetch_all(&*self.db)
        .await?;

        Ok(rows.into_iter().map(|r| r.id).collect())
    }

    pub async fn resume_from_checkpoint(&self, run_id: i64) -> Result<()> {
        tracing::info!("Resuming run {} from checkpoint", run_id);

        let checkpoint = self.checkpoint_manager
            .get_latest_checkpoint(run_id)
            .await?
            .ok_or_else(|| anyhow!("No checkpoint found for run {}", run_id))?;

        match checkpoint {
            CheckpointType::WorktreeCreated { world_id, path, branch } => {
                // Worktree再検証
                self.verify_worktree(&path, &branch).await?;
                // World実行を再開
                self.resume_world_execution(run_id, world_id).await?;
            }
            CheckpointType::WorldsSpawned { task_id, world_ids } => {
                // 各Worldの状態を確認
                for world_id in world_ids {
                    self.check_world_status(task_id, world_id).await?;
                }
            }
            CheckpointType::WorldCompleted { world_id, .. } => {
                // 他のWorldの完了を待つ
                self.wait_for_remaining_worlds(run_id).await?;
            }
            CheckpointType::EvaluationDone { winning_world, .. } => {
                // マージ処理を再開
                self.resume_merge_process(run_id, winning_world).await?;
            }
            CheckpointType::MergeReady { winning_world, pr_number } => {
                // PR作成またはマージを完了
                self.complete_merge(run_id, winning_world, pr_number).await?;
            }
        }

        Ok(())
    }
}
```

**受入条件**:
- [ ] 起動時に中断されたタスクが自動検出される
- [ ] 最新のチェックポイントから正常に復元される
- [ ] 復元後の実行が正しく継続される

### REQ-PER-4: Garbage Collection

**詳細仕様**:

```rust
// crates/miyabi-gc/src/lib.rs
pub struct GarbageCollector {
    db: Arc<SqlitePool>,
    worktree_manager: Arc<WorktreeManager>,
    worktree_lifetime: Duration, // 24時間
}

impl GarbageCollector {
    pub async fn collect_orphaned_worktrees(&self) -> Result<usize> {
        let threshold = Utc::now() - chrono::Duration::hours(24);

        let rows = sqlx::query!(
            "SELECT id, world_id, path, branch
             FROM worktrees
             WHERE last_accessed_at < ?
             AND is_orphaned = 0",
            threshold
        )
        .fetch_all(&*self.db)
        .await?;

        let mut cleaned = 0;
        for row in rows {
            tracing::info!("Cleaning up orphaned worktree: {:?}", row.path);

            // Worktree削除
            if let Err(e) = self.worktree_manager.cleanup_worktree_by_path(&row.path).await {
                tracing::error!("Failed to cleanup worktree {}: {}", row.path, e);
                continue;
            }

            // DBから削除
            sqlx::query!("DELETE FROM worktrees WHERE id = ?", row.id)
                .execute(&*self.db)
                .await?;

            cleaned += 1;
        }

        Ok(cleaned)
    }

    pub async fn gc_loop(&self) {
        let mut interval = tokio::time::interval(Duration::from_secs(3600)); // 1時間
        loop {
            interval.tick().await;
            match self.collect_orphaned_worktrees().await {
                Ok(count) if count > 0 => {
                    tracing::info!("Garbage collected {} orphaned worktrees", count);
                }
                Err(e) => {
                    tracing::error!("Garbage collection failed: {}", e);
                }
                _ => {}
            }
        }
    }
}
```

**受入条件**:
- [ ] 24時間アクセスされていないWorktreeが削除される
- [ ] 1時間ごとにGCが自動実行される
- [ ] GC実行ログが適切に記録される

---

## 🔐 Phase 4: Security Model

### REQ-SEC-1: Threat Model

**詳細仕様**:

```rust
// crates/miyabi-security/src/threat_model.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ThreatSeverity {
    Critical, // 即座に停止
    High,     // 実行ブロック
    Medium,   // 警告
    Low,      // ログのみ
}

#[derive(Debug, Clone)]
pub enum ThreatType {
    MaliciousCodeGeneration {
        pattern: String,
        severity: ThreatSeverity,
    },
    UnsafeRustUsage {
        location: String,
        severity: ThreatSeverity,
    },
    SecretLeakage {
        secret_type: SecretType,
        severity: ThreatSeverity,
    },
    UnauthorizedNetworkAccess {
        destination: String,
        severity: ThreatSeverity,
    },
    FileSystemAttack {
        target_path: PathBuf,
        severity: ThreatSeverity,
    },
}

#[derive(Debug, Clone, Copy)]
pub enum SecretType {
    ApiKey,
    Password,
    PrivateKey,
    Token,
    Certificate,
}
```

**受入条件**:
- [ ] 全ての脅威タイプが定義されている
- [ ] 脅威の重大度が適切に設定されている
- [ ] Critical脅威検出時に即座に停止する

### REQ-SEC-2: Static Analysis

**詳細仕様**:

```rust
// crates/miyabi-security/src/static_analysis.rs
pub struct StaticAnalyzer {
    unsafe_detector: UnsafeDetector,
    dependency_checker: DependencyChecker,
    secret_scanner: SecretScanner,
    geiger_runner: GeigerRunner,
    semgrep_runner: SemgrepRunner,
}

impl StaticAnalyzer {
    pub async fn analyze_generated_code(
        &self,
        code: &str,
        world_id: WorldId,
    ) -> Result<SecurityReport> {
        let mut report = SecurityReport::default();

        // 1. Unsafe Rust検出
        report.unsafe_blocks = self.unsafe_detector.scan(code)?;

        // 2. 依存関係チェック
        report.external_dependencies = self.dependency_checker.check_cargo_toml(code)?;

        // 3. シークレット漏洩検出
        report.leaked_secrets = self.secret_scanner.scan(code)?;

        // 4. cargo-geiger (放射線スコア)
        report.radiation_score = self.geiger_runner.run().await?;

        // 5. Semgrep実行
        report.semgrep_findings = self.semgrep_runner.run(code).await?;

        // リスクレベル計算
        report.risk_level = self.calculate_risk_level(&report);

        // High以上の場合は実行ブロック
        if report.risk_level >= RiskLevel::High {
            return Err(SecurityError::HighRiskCodeDetected { report }.into());
        }

        Ok(report)
    }

    fn calculate_risk_level(&self, report: &SecurityReport) -> RiskLevel {
        let mut score = 0;

        // Unsafeブロック
        score += report.unsafe_blocks.len() * 10;

        // 外部依存 (未検証)
        score += report.external_dependencies.iter()
            .filter(|d| !d.is_trusted)
            .count() * 5;

        // シークレット漏洩
        score += report.leaked_secrets.len() * 50;

        // Geiger放射線スコア
        if report.radiation_score > 80.0 {
            score += 30;
        }

        // Semgrep findings
        score += report.semgrep_findings.len() * 8;

        match score {
            0..=20 => RiskLevel::Low,
            21..=50 => RiskLevel::Medium,
            51..=100 => RiskLevel::High,
            _ => RiskLevel::Critical,
        }
    }
}
```

**受入条件**:
- [ ] 5種類の静的解析が実行される
- [ ] Unsafe Rust使用箇所が検出される
- [ ] シークレット漏洩が検出される
- [ ] リスクレベルが正確に計算される
- [ ] High以上のリスクで実行がブロックされる

### REQ-SEC-3: Container Isolation

**詳細仕様**:

```rust
// crates/miyabi-security/src/isolation.rs
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
    Process {
        chroot: bool,
        namespace: bool,
    },
    None, // 開発時のみ
}

impl Default for IsolationStrategy {
    fn default() -> Self {
        Self::Docker {
            image: "rust:1.75".to_string(),
            network: NetworkMode::None,
            cpu_limit: 2.0,
            memory_limit: "2g".to_string(),
            read_only_fs: true,
        }
    }
}

impl IsolationManager {
    pub async fn execute_in_container(
        &self,
        world_id: WorldId,
        command: &str,
        worktree_path: &Path,
    ) -> Result<Output> {
        match &self.strategy {
            IsolationStrategy::Docker {
                image, network, cpu_limit, memory_limit, read_only_fs, ..
            } => {
                let mut cmd = Command::new("docker");
                cmd.args([
                    "run",
                    "--rm",
                    "--cpus", &cpu_limit.to_string(),
                    "--memory", memory_limit,
                    "--network", network.as_str(),
                    "-v", &format!("{}:/workspace", worktree_path.display()),
                    "-w", "/workspace",
                ]);

                if *read_only_fs {
                    cmd.arg("--read-only");
                }

                cmd.arg(image)
                   .arg("sh")
                   .arg("-c")
                   .arg(command);

                let output = cmd.output().await?;
                Ok(output)
            }
            IsolationStrategy::Process { .. } => {
                // Process分離実装
                unimplemented!("Process isolation not yet implemented")
            }
            IsolationStrategy::None => {
                // 分離なし (開発時のみ)
                let output = Command::new("sh")
                    .arg("-c")
                    .arg(command)
                    .current_dir(worktree_path)
                    .output()
                    .await?;
                Ok(output)
            }
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub enum NetworkMode {
    None,       // --network=none
    Host,       // --network=host
    Bridge,     // デフォルト
}

impl NetworkMode {
    fn as_str(&self) -> &str {
        match self {
            Self::None => "none",
            Self::Host => "host",
            Self::Bridge => "bridge",
        }
    }
}
```

**受入条件**:
- [ ] デフォルトでDocker分離が有効
- [ ] ネットワークアクセスが無効化される
- [ ] CPU/メモリ制限が適用される
- [ ] 読み取り専用ファイルシステムが強制される

### REQ-SEC-4: Runtime Monitoring

**詳細仕様**:

```rust
// crates/miyabi-security/src/runtime_monitor.rs
pub struct RuntimeMonitor {
    file_access_log: Arc<Mutex<Vec<FileAccessEvent>>>,
    network_access_log: Arc<Mutex<Vec<NetworkAccessEvent>>>,
    process_spawn_log: Arc<Mutex<Vec<ProcessSpawnEvent>>>,
}

#[derive(Debug, Clone)]
pub struct FileAccessEvent {
    pub world_id: WorldId,
    pub path: PathBuf,
    pub operation: FileOperation,
    pub timestamp: DateTime<Utc>,
    pub allowed: bool,
}

#[derive(Debug, Clone, Copy)]
pub enum FileOperation {
    Read,
    Write,
    Delete,
    Execute,
}

impl RuntimeMonitor {
    pub async fn log_file_access(
        &self,
        world_id: WorldId,
        path: PathBuf,
        operation: FileOperation,
    ) -> Result<()> {
        let allowed = self.is_file_access_allowed(&path, operation);

        let event = FileAccessEvent {
            world_id,
            path: path.clone(),
            operation,
            timestamp: Utc::now(),
            allowed,
        };

        self.file_access_log.lock().await.push(event.clone());

        if !allowed {
            return Err(SecurityError::UnauthorizedFileAccess { event }.into());
        }

        Ok(())
    }

    fn is_file_access_allowed(&self, path: &Path, operation: FileOperation) -> bool {
        // Worktree内のみ許可
        let worktree_pattern = Regex::new(r"^worktrees/").unwrap();
        if !worktree_pattern.is_match(&path.display().to_string()) {
            return false;
        }

        // 削除は禁止
        if matches!(operation, FileOperation::Delete) {
            return false;
        }

        true
    }
}
```

**受入条件**:
- [ ] 全てのファイルアクセスが記録される
- [ ] Worktree外へのアクセスがブロックされる
- [ ] ファイル削除操作が禁止される
- [ ] ログが適切に保存される

---

## 📊 Phase 5: Observability

### REQ-OBS-1: Structured Logging

**詳細仕様**:

```rust
// crates/miyabi-observability/src/logging.rs
use tracing::{info, warn, error, instrument, Span};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn init_logging() -> Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer()
            .json()
            .with_target(true)
            .with_level(true)
            .with_span_list(true)
        )
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    Ok(())
}

pub struct IssueLogger {
    span: Span,
}

impl IssueLogger {
    #[instrument(skip(self), fields(issue_number = %issue_number))]
    pub fn new(issue_number: u64) -> Self {
        let span = tracing::info_span!("issue", issue_number = %issue_number);
        Self { span }
    }

    pub fn task_logger(&self, task_name: &str) -> TaskLogger {
        let _guard = self.span.enter();
        TaskLogger::new(task_name)
    }
}

pub struct TaskLogger {
    span: Span,
}

impl TaskLogger {
    #[instrument(skip(self), fields(task_name = %task_name))]
    pub fn new(task_name: &str) -> Self {
        let span = tracing::info_span!("task", task_name = %task_name);
        Self { span }
    }

    pub fn world_logger(&self, world_id: WorldId) -> WorldLogger {
        let _guard = self.span.enter();
        WorldLogger::new(world_id)
    }
}

pub struct WorldLogger {
    span: Span,
}

impl WorldLogger {
    #[instrument(skip(self), fields(world_id = ?world_id))]
    pub fn new(world_id: WorldId) -> Self {
        let span = tracing::info_span!("world", world_id = ?world_id);
        Self { span }
    }

    pub fn log_compilation(&self, success: bool, duration_ms: u64) {
        let _guard = self.span.enter();
        info!(
            compilation_success = success,
            duration_ms = duration_ms,
            "Compilation completed"
        );
    }

    pub fn log_test_results(&self, passed: usize, total: usize) {
        let _guard = self.span.enter();
        info!(
            tests_passed = passed,
            tests_total = total,
            pass_rate = (passed as f64 / total as f64),
            "Tests completed"
        );
    }
}
```

**ログ出力例**:
```json
{
  "timestamp": "2025-10-25T12:34:56.789Z",
  "level": "INFO",
  "target": "miyabi_observability::logging",
  "spans": [
    {"name": "issue", "issue_number": 270},
    {"name": "task", "task_name": "implement_feature"},
    {"name": "world", "world_id": "Alpha"}
  ],
  "fields": {
    "compilation_success": true,
    "duration_ms": 4523
  },
  "message": "Compilation completed"
}
```

**受入条件**:
- [ ] 階層的なログ構造が実装される (Issue → Task → World)
- [ ] JSON形式でログが出力される
- [ ] Spanコンテキストが正しく伝播する

### REQ-OBS-2: Prometheus Metrics

**詳細仕様**:

```rust
// crates/miyabi-observability/src/metrics.rs
use prometheus::{
    Counter, Gauge, Histogram, HistogramOpts, Registry,
    register_counter, register_gauge, register_histogram,
};

lazy_static! {
    // Counters
    pub static ref ISSUES_TOTAL: Counter = register_counter!(
        "miyabi_issues_total",
        "Total number of issues processed"
    ).unwrap();

    pub static ref TASKS_TOTAL: Counter = register_counter!(
        "miyabi_tasks_total",
        "Total number of tasks executed"
    ).unwrap();

    pub static ref WORLDS_TOTAL: Counter = register_counter!(
        "miyabi_worlds_total",
        "Total number of worlds spawned"
    ).unwrap();

    pub static ref WORLDS_FAILED: Counter = register_counter!(
        "miyabi_worlds_failed_total",
        "Total number of failed worlds"
    ).unwrap();

    pub static ref LLM_REQUESTS_TOTAL: Counter = register_counter!(
        "miyabi_llm_requests_total",
        "Total number of LLM API requests"
    ).unwrap();

    pub static ref LLM_TOKENS_TOTAL: Counter = register_counter!(
        "miyabi_llm_tokens_total",
        "Total number of LLM tokens used"
    ).unwrap();

    // Gauges
    pub static ref ACTIVE_WORKTREES: Gauge = register_gauge!(
        "miyabi_active_worktrees",
        "Current number of active worktrees"
    ).unwrap();

    pub static ref MEMORY_USAGE_BYTES: Gauge = register_gauge!(
        "miyabi_memory_usage_bytes",
        "Current memory usage in bytes"
    ).unwrap();

    pub static ref CPU_USAGE_PERCENT: Gauge = register_gauge!(
        "miyabi_cpu_usage_percent",
        "Current CPU usage percentage"
    ).unwrap();

    pub static ref DISK_USAGE_BYTES: Gauge = register_gauge!(
        "miyabi_disk_usage_bytes",
        "Current disk usage in bytes"
    ).unwrap();

    // Histograms
    pub static ref TASK_DURATION: Histogram = register_histogram!(
        "miyabi_task_duration_seconds",
        "Task execution duration in seconds",
        vec![1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0]
    ).unwrap();

    pub static ref WORLD_DURATION: Histogram = register_histogram!(
        "miyabi_world_duration_seconds",
        "World execution duration in seconds",
        vec![10.0, 30.0, 60.0, 120.0, 300.0, 600.0, 1200.0]
    ).unwrap();

    pub static ref LLM_LATENCY: Histogram = register_histogram!(
        "miyabi_llm_latency_seconds",
        "LLM API call latency in seconds",
        vec![0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
    ).unwrap();

    pub static ref EVALUATION_SCORE: Histogram = register_histogram!(
        "miyabi_evaluation_score",
        "World evaluation scores (0-100)",
        vec![0.0, 20.0, 40.0, 60.0, 80.0, 90.0, 100.0]
    ).unwrap();
}

// メトリクスエクスポート用HTTPサーバー
pub async fn serve_metrics(port: u16) -> Result<()> {
    use warp::Filter;

    let metrics_route = warp::path("metrics").map(|| {
        use prometheus::Encoder;
        let encoder = prometheus::TextEncoder::new();
        let metric_families = prometheus::gather();
        let mut buffer = vec![];
        encoder.encode(&metric_families, &mut buffer).unwrap();
        String::from_utf8(buffer).unwrap()
    });

    warp::serve(metrics_route)
        .run(([0, 0, 0, 0], port))
        .await;

    Ok(())
}
```

**受入条件**:
- [ ] 20個以上のメトリクスが定義される
- [ ] カウンター、ゲージ、ヒストグラムが正しく実装される
- [ ] `/metrics`エンドポイントでメトリクスが公開される
- [ ] Prometheusでスクレイピング可能

### REQ-OBS-3: Distributed Tracing

**詳細仕様**:

```rust
// crates/miyabi-observability/src/tracing_setup.rs
use opentelemetry::{
    global,
    sdk::{trace as sdktrace, Resource},
    KeyValue,
};
use opentelemetry_otlp::WithExportConfig;
use tracing_opentelemetry::OpenTelemetryLayer;

pub fn init_tracing(otlp_endpoint: &str) -> Result<()> {
    // OpenTelemetry OTLP exporter
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(otlp_endpoint)
        )
        .with_trace_config(
            sdktrace::config()
                .with_resource(Resource::new(vec![
                    KeyValue::new("service.name", "miyabi"),
                    KeyValue::new("service.version", env!("CARGO_PKG_VERSION")),
                ]))
        )
        .install_batch(opentelemetry::runtime::Tokio)?;

    // Tracing subscriber
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(OpenTelemetryLayer::new(tracer))
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    Ok(())
}

// トレースコンテキストの伝播
#[instrument(skip(self))]
pub async fn execute_issue(&self, issue_number: u64) -> Result<()> {
    let span = Span::current();
    span.set_attribute(KeyValue::new("issue.number", issue_number as i64));

    // Task実行
    for task in self.generate_tasks(issue_number).await? {
        self.execute_task(task).await?;
    }

    Ok(())
}

#[instrument(skip(self))]
pub async fn execute_task(&self, task: Task) -> Result<()> {
    let span = Span::current();
    span.set_attribute(KeyValue::new("task.name", task.name.clone()));

    // 5 Worlds実行
    let mut handles = vec![];
    for world_id in WorldId::all() {
        let handle = self.execute_world(task.clone(), world_id);
        handles.push(handle);
    }

    // 全World完了を待機
    let results = futures::future::join_all(handles).await;

    Ok(())
}

#[instrument(skip(self))]
pub async fn execute_world(&self, task: Task, world_id: WorldId) -> Result<WorldResult> {
    let span = Span::current();
    span.set_attribute(KeyValue::new("world.id", format!("{:?}", world_id)));

    // LLM呼び出し
    let code = self.llm_client.generate_code(&task).await?;

    // コンパイル & テスト
    let result = self.compile_and_test(&code).await?;

    Ok(result)
}
```

**トレース階層**:
```
execute_issue (span_id: abc123)
├── execute_task (span_id: def456, parent: abc123)
│   ├── execute_world [Alpha] (span_id: ghi789, parent: def456)
│   │   ├── llm_generate_code (span_id: jkl012, parent: ghi789)
│   │   └── compile_and_test (span_id: mno345, parent: ghi789)
│   ├── execute_world [Beta] (span_id: pqr678, parent: def456)
│   ├── execute_world [Gamma] (span_id: stu901, parent: def456)
│   ├── execute_world [Delta] (span_id: vwx234, parent: def456)
│   └── execute_world [Epsilon] (span_id: yz0567, parent: def456)
└── evaluate_worlds (span_id: abc890, parent: abc123)
```

**受入条件**:
- [ ] OpenTelemetry OTLP exporterが実装される
- [ ] 全実行階層がトレースされる (Issue → Task → World)
- [ ] SpanコンテキストがWorld間で正しく伝播する
- [ ] JaegerまたはZipkinで可視化可能

### REQ-OBS-4: Grafana Dashboard

**詳細仕様**:

```json
{
  "dashboard": {
    "title": "Miyabi System Dashboard",
    "panels": [
      {
        "title": "Active Worktrees",
        "type": "graph",
        "targets": [{"expr": "miyabi_active_worktrees"}]
      },
      {
        "title": "World Success Rate",
        "type": "graph",
        "targets": [{
          "expr": "rate(miyabi_worlds_total[5m]) - rate(miyabi_worlds_failed_total[5m])"
        }]
      },
      {
        "title": "Task Duration (p50, p95, p99)",
        "type": "graph",
        "targets": [
          {"expr": "histogram_quantile(0.50, miyabi_task_duration_seconds_bucket)"},
          {"expr": "histogram_quantile(0.95, miyabi_task_duration_seconds_bucket)"},
          {"expr": "histogram_quantile(0.99, miyabi_task_duration_seconds_bucket)"}
        ]
      },
      {
        "title": "LLM API Latency",
        "type": "graph",
        "targets": [{"expr": "miyabi_llm_latency_seconds"}]
      },
      {
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {"expr": "miyabi_memory_usage_bytes / 1024 / 1024 / 1024", "legend": "Memory (GB)"},
          {"expr": "miyabi_cpu_usage_percent", "legend": "CPU %"},
          {"expr": "miyabi_disk_usage_bytes / 1024 / 1024 / 1024", "legend": "Disk (GB)"}
        ]
      },
      {
        "title": "Evaluation Score Distribution",
        "type": "heatmap",
        "targets": [{"expr": "miyabi_evaluation_score_bucket"}]
      }
    ]
  }
}
```

**受入条件**:
- [ ] Grafanaダッシュボード定義が作成される
- [ ] 6個以上のパネルが定義される
- [ ] リソース使用率、成功率、レイテンシが可視化される

---

## 💰 Phase 6: Cost Optimization

### REQ-COST-1: Budget Management

**詳細仕様**:

```toml
# config/cost_limits.toml
[budget]
monthly_limit_usd = 1000.0
per_issue_target_usd = 5.0
max_issues_per_month = 200

[thresholds]
warning_percent = 75.0   # 750ドル到達で警告
pause_percent = 90.0     # 900ドル到達で一時停止
stop_percent = 100.0     # 1000ドル到達で完全停止

[alerts]
email = "admin@example.com"
slack_webhook = "https://hooks.slack.com/services/xxx"
```

**受入条件**:
- [ ] 月額予算上限が設定される
- [ ] Issue単価目標が設定される
- [ ] 予算しきい値が適切に設定される

### REQ-COST-2: Cost Tracking

**コスト計算式**:

```rust
impl CostTracker {
    fn calculate_cost(&self, model: &str, input_tokens: usize, output_tokens: usize) -> f64 {
        let pricing = match model {
            "gpt-4o" => (0.005, 0.015),           // $5/$15 per 1M tokens
            "gpt-4o-mini" => (0.00015, 0.0006),   // $0.15/$0.60 per 1M tokens
            "claude-3-5-sonnet" => (0.003, 0.015), // $3/$15 per 1M tokens
            "claude-3-haiku" => (0.00025, 0.00125), // $0.25/$1.25 per 1M tokens
            _ => (0.001, 0.002),                   // デフォルト
        };

        (input_tokens as f64 / 1_000_000.0) * pricing.0 +
        (output_tokens as f64 / 1_000_000.0) * pricing.1
    }
}
```

**受入条件**:
- [ ] 全LLM呼び出しでコストが記録される
- [ ] 月間累積コストが追跡される
- [ ] コスト計算が正確である

### REQ-COST-3: Early Termination

**詳細仕様**:

```rust
impl Default for EarlyTerminationPolicy {
    fn default() -> Self {
        Self {
            rules: vec![
                TerminationRule::TestFailureTimeout {
                    duration: Duration::from_secs(5 * 60),  // 5分
                    min_pass_rate: 0.0,                     // 0%
                },
                TerminationRule::CompilationFailureTimeout {
                    duration: Duration::from_secs(10 * 60), // 10分
                },
                TerminationRule::PerIssueCostExceeded {
                    threshold_usd: 10.0,                    // $10 (目標の2倍)
                },
                TerminationRule::RepeatedFailurePattern {
                    max_repeats: 3,
                },
            ],
        }
    }
}
```

**受入条件**:
- [ ] 5分でテスト0%のWorldが停止される
- [ ] 10分でコンパイル失敗のWorldが停止される
- [ ] $10超過時に全Worldが停止される
- [ ] 3回連続同一エラーで停止される

### REQ-COST-4: Response Caching

**詳細仕様**:

```rust
pub struct LlmResponseCache {
    cache: Arc<Mutex<LruCache<CacheKey, CachedResponse>>>,
    capacity: usize, // 1000エントリー
    ttl: Duration,   // 7日間
}

#[derive(Hash, Eq, PartialEq)]
struct CacheKey {
    prompt_hash: String,      // SHA256(prompt)
    model: String,
    temperature: String,      // "0.7" (小数点1桁)
}
```

**キャッシュ戦略**:
- 容量: 1000エントリー (LRU方式)
- 有効期限: 7日間
- キーの正規化: temperature小数点1桁に丸める
- **目標ヒット率: 30%**

**受入条件**:
- [ ] LRUキャッシュが実装される
- [ ] 7日間でキャッシュが期限切れになる
- [ ] ヒット率が追跡される
- [ ] 目標ヒット率30%を達成する

### REQ-COST-5: Model Selection

**詳細仕様**:

```rust
impl Task {
    fn complexity(&self) -> TaskComplexity {
        // LOC、依存数、テスト数で判定
        if self.estimated_loc < 50 && self.dependencies.len() < 3 {
            TaskComplexity::Simple
        } else if self.estimated_loc < 200 && self.dependencies.len() < 10 {
            TaskComplexity::Medium
        } else {
            TaskComplexity::Complex
        }
    }
}

impl ModelSelector {
    pub fn select_model_for_task(task: &Task) -> ModelConfig {
        match task.complexity() {
            TaskComplexity::Simple => ModelConfig {
                model: "gpt-4o-mini".to_string(),
                temperature: 0.5,
                max_tokens: 2000,
                // コスト: ~$0.10/タスク
            },
            TaskComplexity::Medium => ModelConfig {
                model: "gpt-4o".to_string(),
                temperature: 0.7,
                max_tokens: 4000,
                // コスト: ~$1.00/タスク
            },
            TaskComplexity::Complex => ModelConfig {
                model: "claude-3-5-sonnet".to_string(),
                temperature: 0.7,
                max_tokens: 8000,
                // コスト: ~$2.50/タスク
            },
        }
    }
}
```

**コスト推定**:
```
1 Issue = 3 Tasks (平均)
1 Task = 5 Worlds × 2 LLM calls = 10 LLM calls

内訳:
- Simple Task (60%): $0.10 × 10 × 1.8 = $1.80
- Medium Task (30%): $1.00 × 10 × 0.9 = $9.00
- Complex Task (10%): $2.50 × 10 × 0.3 = $7.50

平均: $4.53 ✅
キャッシュヒット30%想定: $4.53 × 0.7 = $3.17 ✅✅
```

**受入条件**:
- [ ] タスクの複雑度が正しく計算される
- [ ] Simple/Medium/Complexで異なるモデルが選択される
- [ ] Issue単価が目標$5.00以内に収まる

---

## 🎯 Acceptance Criteria Summary

### システム全体の受入条件

1. **機能要件**:
   - [ ] GitHub Issueを入力として受け付ける
   - [ ] 5つのWorlds (α, β, γ, δ, ε) で並列実行される
   - [ ] 各Worldが独立したGit Worktreeで動作する
   - [ ] 評価スコア100点満点で最良のWorldを選択する
   - [ ] 勝者のみがmainブランチにマージされる

2. **品質要件**:
   - [ ] コンパイル成功率 > 80%
   - [ ] テスト合格率 > 70%
   - [ ] Clippy警告数 < 10
   - [ ] セキュリティリスク < High
   - [ ] 評価スコア平均 > 70点

3. **性能要件**:
   - [ ] Issue処理時間 < 30分 (平均)
   - [ ] 同時Worktree数: 最大4個
   - [ ] LLMレイテンシ < 10秒 (p95)
   - [ ] メモリ使用率 < 90%
   - [ ] CPU使用率 < 95%

4. **信頼性要件**:
   - [ ] 5分ごとにチェックポイント保存
   - [ ] クラッシュ後の自動復旧
   - [ ] 24時間後の孤児Worktree自動削除
   - [ ] リトライ成功率 > 80%
   - [ ] 部分失敗時の継続実行

5. **セキュリティ要件**:
   - [ ] 4層防御が実装される
   - [ ] 静的解析合格率 100%
   - [ ] コンテナ分離がデフォルト有効
   - [ ] ランタイム監視が動作
   - [ ] シークレット漏洩検出率 100%

6. **コスト要件**:
   - [ ] 月額予算 $1000以内
   - [ ] Issue単価 $5.00以内
   - [ ] キャッシュヒット率 > 30%
   - [ ] 早期打ち切り成功率 > 50%

7. **観測可能性要件**:
   - [ ] 構造化ログがJSON形式で出力される
   - [ ] 20個以上のPrometheusメトリクスが公開される
   - [ ] OpenTelemetryトレースが正常に動作する
   - [ ] Grafanaダッシュボードが表示される

---

## 📦 Deliverables

### Phase 1: Core Implementation (Week 1-2)
- [ ] `miyabi-types` crate: 全型定義
- [ ] `miyabi-worktree` crate: Worktree管理
- [ ] `miyabi-core` crate: エラーハンドリング、リソース管理
- [ ] `miyabi-scheduler` crate: 動的スケーリング

### Phase 2: LLM Integration (Week 3)
- [ ] `miyabi-llm` crate: LLM抽象化層、Rate Limiter、キャッシュ

### Phase 3: Persistence & Recovery (Week 4)
- [ ] `miyabi-persistence` crate: SQLite永続化
- [ ] `miyabi-recovery` crate: 復旧システム
- [ ] `miyabi-gc` crate: ガベージコレクション

### Phase 4: Security (Week 5)
- [ ] `miyabi-security` crate: 静的解析、分離、監視

### Phase 5: Observability (Week 6)
- [ ] `miyabi-observability` crate: ログ、メトリクス、トレース
- [ ] Grafanaダッシュボード定義

### Phase 6: Cost Optimization (Week 7)
- [ ] `miyabi-cost` crate: コスト追跡、早期打ち切り

### Phase 7: Integration & Testing (Week 8)
- [ ] 統合テスト
- [ ] エンドツーエンドテスト
- [ ] ベンチマークテスト

---

## 📚 References

- [ENTITY_RELATION_MODEL.md](ENTITY_RELATION_MODEL.md) - Entity定義と関係性
- [LABEL_SYSTEM_GUIDE.md](LABEL_SYSTEM_GUIDE.md) - Label体系
- [AGENT_CHARACTERS.md](../.claude/agents/AGENT_CHARACTERS.md) - Agent仕様
- [MCP_INTEGRATION_PROTOCOL.md](../.claude/MCP_INTEGRATION_PROTOCOL.md) - MCP統合
- [BENCHMARK_IMPLEMENTATION_CHECKLIST.md](../.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md) - ベンチマーク実装

---

**Document Status**: ✅ FINAL - Ready for Implementation
**Next Phase**: 実装フェーズ開始 (Week 1)

**Approved by**: System Architect
**Date**: 2025-10-25
