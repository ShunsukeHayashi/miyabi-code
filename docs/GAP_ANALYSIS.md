# Miyabi Gap Analysis - Requirements vs Implementation

**Document Version**: 1.0.0
**Last Updated**: 2025-10-25
**Status**: Phase 0 - Complete

---

## 📋 Executive Summary

本ドキュメントは、[SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md)で定義した要件と、[EXISTING_SYSTEM_ANALYSIS.md](EXISTING_SYSTEM_ANALYSIS.md)で分析した既存実装の差分を明確化します。

**分析結果**:
- ✅ **実装済み機能**: 65% (基本Agent、Worktree、LLM、GitHub統合)
- 🟡 **拡張必要機能**: 20% (5-Worlds対応、評価スコア)
- ❌ **未実装機能**: 15% (Persistence, Security, Observability, Cost)

---

## 🎯 Core Requirements Gap

### CR-1: 5-Worlds Quality Assurance Strategy

**要件**: 全コード生成タスクで5つのパラレルワールドを並列実行し、評価後に最良の1つを選択

**現状**:
```diff
- 単一実行のみ
- WorldId概念なし
- 評価スコアリングなし
```

**Gap**:
```diff
+ 必要な実装:
+ 1. WorldId型定義 (Alpha, Beta, Gamma, Delta, Epsilon)
+ 2. WorldConfig (model, temperature, prompt_variant)
+ 3. FiveWorldsManager (spawn_all_worlds, cleanup_all_worlds)
+ 4. EvaluationScore (100点満点スコアリング)
+ 5. 勝者選択ロジック
```

**実装優先度**: 🔴 **Critical** (P0)
**実装工数**: 7-10日

---

### CR-2: Git Worktree Isolation

**要件**: 各Worldが完全に独立したGit Worktreeで実行

**現状**:
```diff
+ 基本的なWorktree作成/削除は実装済み
- 5-Worlds専用管理なし
- WorldId対応なし
```

**Gap**:
```diff
+ 必要な実装:
+ 1. FiveWorldsManager (5つのWorktreeを管理)
+ 2. WorldId別のディレクトリ構造
+    - worktrees/world-Alpha/issue-270/
+    - worktrees/world-Beta/issue-270/
+    - ...
+ 3. 並列実行時の干渉防止
```

**実装優先度**: 🔴 **Critical** (P0)
**実装工数**: 3-5日

---

## 🛡️ Phase-by-Phase Gap Analysis

### Phase 1: Error Handling Strategy

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-ERR-1 | Retry Policy (3回, 指数バックオフ) | ❌ なし | retry_with_backoff()実装 | 🟡 P1 | 2日 |
| REQ-ERR-2 | Partial Failure Tolerance | ❌ なし | FallbackStrategy実装 | 🟡 P1 | 2日 |
| REQ-ERR-3 | Circuit Breaker | ❌ なし | CircuitBreaker実装 | 🟡 P1 | 2日 |

**Phase 1 Gap総計**: 6日

**詳細Gap**:

#### REQ-ERR-1: Retry Policy

**現状**:
```rust
// crates/miyabi-core/src/ には存在しない
```

**必要な実装**:
```rust
// crates/miyabi-core/src/error_policy.rs (新規)
pub struct RetryConfig {
    pub max_attempts: usize,       // 3
    pub base_delay: Duration,      // 1s
    pub max_delay: Duration,       // 60s
    pub backoff_multiplier: f64,   // 2.0
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
                delay = (delay * config.backoff_multiplier as u32).min(config.max_delay);
            }
        }
    }
}
```

**受入条件**:
- [ ] 3回までリトライ
- [ ] 待機時間: 1s → 2s → 4s
- [ ] 最大60秒を超えない

---

#### REQ-ERR-2: Partial Failure Tolerance

**現状**:
```diff
- 1つのWorldが失敗したら全体失敗
```

**必要な実装**:
```rust
#[derive(Debug, Clone)]
pub enum FallbackStrategy {
    AcceptPartialSuccess { min_successful_worlds: usize },  // 1/5でOK
    RetryWithLowerTemperature { temperature_reduction: f64 },
    SwitchModel { fallback_model: String },
    WaitForHumanIntervention { timeout: Duration },
    SkipTask,
}

pub async fn handle_partial_failure(
    results: Vec<Result<WorldResult>>,
    strategy: FallbackStrategy,
) -> Result<WorldResult> {
    match strategy {
        FallbackStrategy::AcceptPartialSuccess { min_successful_worlds } => {
            let successful = results.iter().filter(|r| r.is_ok()).count();
            if successful >= min_successful_worlds {
                // 成功したWorldの中から最良を選択
                Ok(select_best_world(results)?)
            } else {
                Err(anyhow!("Not enough successful worlds"))
            }
        }
        // ... 他の戦略
    }
}
```

**受入条件**:
- [ ] 5つ中1つでも成功すれば継続
- [ ] 全失敗時にフォールバック戦略適用
- [ ] 温度を下げて再試行可能

---

#### REQ-ERR-3: Circuit Breaker

**現状**:
```diff
- サーキットブレーカー機構なし
```

**必要な実装**:
```rust
pub struct CircuitBreaker {
    failure_threshold: usize,          // 5回
    success_threshold: usize,          // 2回
    timeout: Duration,                 // 60秒
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

impl CircuitBreaker {
    pub async fn call<F, T>(&self, operation: F) -> Result<T>
    where
        F: Future<Output = Result<T>>,
    {
        match *self.state.lock().await {
            CircuitState::Open => {
                // タイムアウト経過後にHalfOpenへ
                if self.should_attempt_reset().await {
                    *self.state.lock().await = CircuitState::HalfOpen;
                } else {
                    return Err(anyhow!("Circuit breaker is open"));
                }
            }
            _ => {}
        }

        match operation.await {
            Ok(result) => {
                self.on_success().await;
                Ok(result)
            }
            Err(err) => {
                self.on_failure().await;
                Err(err)
            }
        }
    }

    async fn on_failure(&self) {
        let mut failures = self.consecutive_failures.lock().await;
        *failures += 1;
        *self.consecutive_successes.lock().await = 0;

        if *failures >= self.failure_threshold {
            *self.state.lock().await = CircuitState::Open;
            tracing::warn!("Circuit breaker opened after {} failures", failures);
        }
    }

    async fn on_success(&self) {
        let mut successes = self.consecutive_successes.lock().await;
        *successes += 1;
        *self.consecutive_failures.lock().await = 0;

        if *successes >= self.success_threshold {
            *self.state.lock().await = CircuitState::Closed;
            tracing::info!("Circuit breaker closed after {} successes", successes);
        }
    }
}
```

**受入条件**:
- [ ] 5回連続失敗で開く
- [ ] 60秒後に半開状態へ
- [ ] 2回連続成功で閉じる

---

### Phase 2: Resource Constraints and Scaling

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-RES-1 | Hardware Limits検出 | ❌ なし | HardwareLimits::detect()実装 | 🟡 P1 | 2日 |
| REQ-RES-2 | Dynamic Scaling | ❌ なし | DynamicScaler実装 | 🟡 P1 | 3日 |
| REQ-RES-3 | LLM Rate Limiting | ❌ なし | RateLimiter実装 | 🟠 P2 | 3日 |

**Phase 2 Gap総計**: 8日

**詳細Gap**:

#### REQ-RES-1: Hardware Limits

**現状**:
```diff
- ハードウェア制約の自動検出なし
- 並列度は固定値
```

**必要な実装**:
```rust
// crates/miyabi-core/src/resource_limits.rs (新規)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareLimits {
    pub total_memory_gb: usize,
    pub total_cpu_cores: usize,
    pub total_disk_gb: usize,
}

impl HardwareLimits {
    pub fn detect() -> Result<Self> {
        use sysinfo::{System, SystemExt};
        let mut sys = System::new_all();
        sys.refresh_all();

        Ok(Self {
            total_memory_gb: (sys.total_memory() / 1024 / 1024 / 1024) as usize,
            total_cpu_cores: sys.cpus().len(),
            total_disk_gb: Self::get_disk_total()?,
        })
    }

    pub fn max_concurrent_worktrees(&self, per_worktree: &PerWorktreeLimits) -> usize {
        let memory_limit = self.total_memory_gb / per_worktree.memory_gb;
        let cpu_limit = self.total_cpu_cores / per_worktree.cpu_threads;
        let disk_limit = self.total_disk_gb / per_worktree.disk_gb;

        memory_limit.min(cpu_limit).min(disk_limit)
    }
}
```

**依存関係追加**:
```toml
# Cargo.toml
[workspace.dependencies]
sysinfo = "0.30"
```

**受入条件**:
- [ ] システムから正確にメモリ、CPU、ディスクを検出
- [ ] max_concurrent_worktrees()が正しく計算される
- [ ] 想定環境(32GB, 8cores, 500GB)で4を返す

---

#### REQ-RES-2: Dynamic Scaling

**現状**:
```diff
- リソース監視なし
- 並列度の動的調整なし
```

**必要な実装**:
```rust
// crates/miyabi-orchestrator/src/dynamic_scaling.rs (新規)
pub struct DynamicScaler {
    resource_monitor: ResourceMonitor,
    current_parallelism: Arc<Mutex<usize>>,
    max_parallelism: usize,
}

impl DynamicScaler {
    pub async fn adjust_parallelism(&self) -> usize {
        let usage = self.resource_monitor.get_current_usage().await;
        let mut parallelism = self.current_parallelism.lock().await;

        // スケールダウン
        if usage.memory_percent > 90.0 || usage.cpu_percent > 95.0 || usage.disk_percent > 85.0 {
            *parallelism = (*parallelism - 1).max(1);
            tracing::warn!(
                "Scaling down to {} due to resource pressure: mem={:.1}%, cpu={:.1}%, disk={:.1}%",
                *parallelism, usage.memory_percent, usage.cpu_percent, usage.disk_percent
            );
        }
        // スケールアップ
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

pub struct ResourceMonitor {
    system: Arc<Mutex<System>>,
}

impl ResourceMonitor {
    pub async fn get_current_usage(&self) -> ResourceUsage {
        let mut sys = self.system.lock().await;
        sys.refresh_memory();
        sys.refresh_cpu();

        ResourceUsage {
            memory_percent: (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0,
            cpu_percent: sys.global_cpu_info().cpu_usage() as f64,
            disk_percent: Self::get_disk_usage_percent(),
        }
    }
}
```

**受入条件**:
- [ ] 10秒ごとにリソース使用率を監視
- [ ] メモリ90%超過時にスケールダウン
- [ ] CPU95%超過時にスケールダウン
- [ ] リソース余裕時にスケールアップ

---

#### REQ-RES-3: LLM Rate Limiting

**現状**:
```diff
- Rate Limitingなし
- API制限超過の可能性
```

**必要な実装**:
```rust
// crates/miyabi-llm/src/rate_limiter.rs (新規)
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

            // 古いエントリー削除
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

            // 現在の使用状況確認
            let current_requests = self.request_history.lock().await.len();
            let current_tokens: usize = self.token_history.lock().await
                .iter()
                .map(|(_, t)| t)
                .sum();

            // 制限内なら許可
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
- [ ] スライディングウィンドウで正確に管理
- [ ] 制限超過時に自動待機

---

### Phase 3: State Persistence and Recovery

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-PER-1 | SQLiteデータベース | ❌ なし | 全テーブル作成 | 🟠 P2 | 3日 |
| REQ-PER-2 | Checkpoint System | ❌ なし | CheckpointManager実装 | 🟠 P2 | 3日 |
| REQ-PER-3 | Recovery System | ❌ なし | RecoveryManager実装 | 🟠 P2 | 2日 |
| REQ-PER-4 | Garbage Collection | ❌ なし | GarbageCollector実装 | 🟢 P3 | 2日 |

**Phase 3 Gap総計**: 10日

**詳細Gap**:

#### REQ-PER-1: Database Schema

**現状**:
```diff
- SQLite統合なし
- 永続化なし
```

**必要な実装**:
```rust
// crates/miyabi-persistence/src/schema.rs (新規crate)
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

**依存関係**:
```toml
# crates/miyabi-persistence/Cargo.toml
[dependencies]
sqlx = { version = "0.8", features = ["runtime-tokio-rustls", "sqlite", "chrono", "json"] }
```

**受入条件**:
- [ ] SQLiteデータベースが正常に作成される
- [ ] 5テーブルが全て作成される
- [ ] 外部キー制約が動作する
- [ ] インデックスが適用される

---

#### REQ-PER-2: Checkpoint System

**現状**:
```diff
- チェックポイント機構なし
- クラッシュ時の復旧不可
```

**必要な実装**:
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
    interval: Duration,  // 5分
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

    pub async fn auto_checkpoint_loop(&self, run_id: i64) {
        let mut interval = tokio::time::interval(self.interval);
        loop {
            interval.tick().await;
            if let Err(e) = self.checkpoint_current_state(run_id).await {
                tracing::error!("Auto checkpoint failed: {}", e);
            }
        }
    }
}
```

**受入条件**:
- [ ] 5分ごとに自動保存される
- [ ] 5種類のCheckpointTypeが全てサポートされる
- [ ] JSON形式でデータが保存される

---

### Phase 4: Security Model

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-SEC-1 | Threat Model | ❌ なし | 脅威定義 | 🟠 P2 | 1日 |
| REQ-SEC-2 | Static Analysis | ❌ なし | 5種類の解析実装 | 🟠 P2 | 4日 |
| REQ-SEC-3 | Container Isolation | ❌ なし | Docker分離実装 | 🟢 P3 | 2日 |
| REQ-SEC-4 | Runtime Monitoring | ❌ なし | 監視実装 | 🟢 P3 | 2日 |

**Phase 4 Gap総計**: 9日

---

### Phase 5: Observability

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-OBS-1 | Structured Logging | 🟡 部分的 | 階層ロガー実装 | 🟠 P2 | 2日 |
| REQ-OBS-2 | Prometheus Metrics | ❌ なし | 20+メトリクス実装 | 🟠 P2 | 3日 |
| REQ-OBS-3 | Distributed Tracing | ❌ なし | OpenTelemetry統合 | 🟢 P3 | 3日 |
| REQ-OBS-4 | Grafana Dashboard | ❌ なし | ダッシュボード定義 | 🟢 P3 | 1日 |

**Phase 5 Gap総計**: 9日

---

### Phase 6: Cost Optimization

| 要件ID | 要件 | 現状 | Gap | 優先度 | 工数 |
|--------|------|------|-----|--------|------|
| REQ-COST-1 | Budget Management | ❌ なし | 予算設定 | 🟠 P2 | 1日 |
| REQ-COST-2 | Cost Tracking | ❌ なし | コスト計算実装 | 🟠 P2 | 2日 |
| REQ-COST-3 | Early Termination | ❌ なし | 打ち切りポリシー実装 | 🟡 P1 | 2日 |
| REQ-COST-4 | Response Caching | ❌ なし | LRUキャッシュ実装 | 🟠 P2 | 2日 |
| REQ-COST-5 | Model Selection | ❌ なし | 複雑度ベース選択実装 | 🟢 P3 | 2日 |

**Phase 6 Gap総計**: 9日

---

## 📊 Overall Gap Summary

### 実装Gap総計

| Phase | 工数 | 優先度分布 | 新規Crate |
|-------|------|-----------|----------|
| Phase 0 | 完了 | - | - |
| Phase 1 | 6日 | P1×3 | なし（拡張のみ） |
| Phase 2 | 8日 | P1×2, P2×1 | なし（拡張のみ） |
| Phase 3 | 10日 | P2×3, P3×1 | 3個 |
| Phase 4 | 9日 | P2×2, P3×2 | 1個 |
| Phase 5 | 9日 | P2×2, P3×2 | 1個 |
| Phase 6 | 9日 | P1×1, P2×3, P3×1 | 1個 |
| **合計** | **51日** | **P0×2, P1×6, P2×13, P3×7** | **6個** |

### 優先度別実装順序

#### 🔴 P0 (Critical) - 2項目

1. **5-Worlds Strategy** (CR-1)
   - WorldId型定義
   - FiveWorldsManager
   - EvaluationScore
   - 工数: 7-10日

2. **Worktree Isolation** (CR-2)
   - 5-Worlds対応Worktree管理
   - 工数: 3-5日

**P0合計**: 10-15日

---

#### 🟡 P1 (High) - 6項目

1. REQ-ERR-1: Retry Policy (2日)
2. REQ-ERR-2: Partial Failure (2日)
3. REQ-ERR-3: Circuit Breaker (2日)
4. REQ-RES-1: Hardware Limits (2日)
5. REQ-RES-2: Dynamic Scaling (3日)
6. REQ-COST-3: Early Termination (2日)

**P1合計**: 13日

---

#### 🟠 P2 (Medium) - 13項目

Phase 2-6の大部分

**P2合計**: 23日

---

#### 🟢 P3 (Low) - 7項目

ObservabilityとSecurityの一部

**P3合計**: 14日

---

## 🎯 Recommended Implementation Order

### Week 1: P0 Core Foundation

**目標**: 5-Worlds戦略の基盤実装

```
Day 1-2: miyabi-types拡張 (WorldId, WorldConfig, EvaluationScore)
Day 3-4: miyabi-worktree拡張 (FiveWorldsManager)
Day 5-7: miyabi-orchestrator拡張 (FiveWorldsExecutor骨組み)
```

**成果物**:
- WorldId型が使用可能
- 5つのWorktreeが作成可能
- 基本的な並列実行が動作

---

### Week 2: P1 Error Handling & Scaling

**目標**: エラー処理と動的スケーリング実装

```
Day 1-2: miyabi-core拡張 (RetryConfig, retry_with_backoff)
Day 3-4: miyabi-core拡張 (CircuitBreaker, FallbackStrategy)
Day 5-6: miyabi-core拡張 (HardwareLimits, ResourceMonitor)
Day 7: miyabi-orchestrator拡張 (DynamicScaler)
```

**成果物**:
- リトライ機構が動作
- サーキットブレーカーが動作
- リソース監視が動作
- 動的スケーリングが動作

---

### Week 3: P1+P2 LLM & Cost (Part 1)

**目標**: LLM最適化とコスト管理基盤

```
Day 1-2: miyabi-llm拡張 (RateLimiter)
Day 3-4: miyabi-llm拡張 (LlmResponseCache)
Day 5-7: miyabi-cost新規 (CostTracker, EarlyTerminationPolicy)
```

**成果物**:
- Rate Limiting動作
- Cacheヒット率測定可能
- コスト追跡が動作
- 早期打ち切りが動作

---

### Week 4: P2 Persistence

**目標**: 永続化と復旧システム実装

```
Day 1-3: miyabi-persistence新規 (SQLite, CheckpointManager)
Day 4-5: miyabi-recovery新規 (RecoveryManager)
Day 6-7: miyabi-gc新規 (GarbageCollector)
```

**成果物**:
- SQLiteデータベースが動作
- 5分ごとにチェックポイント保存
- クラッシュ後の復旧が可能
- 孤児Worktreeが自動削除

---

### Week 5: P2 Security

**目標**: セキュリティ層実装

```
Day 1: miyabi-security新規 (Threat Model)
Day 2-4: miyabi-security拡張 (StaticAnalyzer - 5種類)
Day 5-6: miyabi-security拡張 (IsolationManager - Docker)
Day 7: miyabi-security拡張 (RuntimeMonitor)
```

**成果物**:
- 静的解析が動作
- Docker分離が動作
- セキュリティリスク検出

---

### Week 6: P2+P3 Observability

**目標**: 観測可能性実装

```
Day 1-2: miyabi-observability新規 (IssueLogger, TaskLogger, WorldLogger)
Day 3-4: miyabi-observability拡張 (Prometheus Metrics - 20+個)
Day 5-6: miyabi-observability拡張 (OpenTelemetry Tracing)
Day 7: miyabi-observability拡張 (Grafana Dashboard)
```

**成果物**:
- JSON構造化ログ
- Prometheusメトリクス公開
- 分散トレーシング動作
- Grafanaダッシュボード表示

---

### Week 7: P3 Cost & Integration

**目標**: コスト最適化完成とAgent統合

```
Day 1-2: miyabi-cost拡張 (ModelSelector, BudgetManager)
Day 3-4: miyabi-agent-coordinator統合 (FiveWorldsExecutor統合)
Day 5-6: miyabi-agent-review統合 (EvaluationScore統合)
Day 7: miyabi-cli拡張 (parallel サブコマンド)
```

**成果物**:
- モデル選択が動作
- 月額予算管理が動作
- CoordinatorAgentが5-Worlds使用
- `miyabi parallel`コマンドが動作

---

### Week 8: Testing & Validation

**目標**: 統合テスト、E2E、ベンチマーク

```
Day 1-3: 統合テスト実装
Day 4-5: E2Eテスト実行
Day 6-7: ベンチマークテスト & 性能チューニング
```

**成果物**:
- 全統合テストが合格
- E2Eテストが成功
- ベンチマーク結果が目標値内

---

## 📈 Success Metrics

### 実装完了基準

#### Phase 1-2 完了基準

- [ ] WorldIdが5つのWorldで動作
- [ ] FiveWorldsManagerが5つのWorktreeを並列作成
- [ ] EvaluationScoreが100点満点で計算
- [ ] 最高スコアのWorldが選択される
- [ ] リトライが3回まで実行される
- [ ] サーキットブレーカーが5回連続失敗で開く
- [ ] 動的スケーリングがリソース使用率に応じて調整

#### Phase 3-4 完了基準

- [ ] SQLiteデータベースが作成される
- [ ] 5分ごとにチェックポイントが保存される
- [ ] クラッシュ後に自動復旧できる
- [ ] 24時間後に孤児Worktreeが削除される
- [ ] 静的解析が5種類動作する
- [ ] Docker分離がデフォルトで有効

#### Phase 5-6 完了基準

- [ ] JSON構造化ログが出力される
- [ ] 20+個のPrometheusメトリクスが公開される
- [ ] OpenTelemetryトレースが動作する
- [ ] 全LLM呼び出しでコストが記録される
- [ ] キャッシュヒット率が測定可能
- [ ] 月額予算が管理される

#### 総合受入基準

- [ ] Issue処理時間 < 30分
- [ ] コンパイル成功率 > 80%
- [ ] テスト合格率 > 70%
- [ ] 評価スコア平均 > 70点
- [ ] Issue単価 < $5.00
- [ ] キャッシュヒット率 > 30%
- [ ] メモリ使用率 < 90%
- [ ] CPU使用率 < 95%

---

## 🔗 Related Documents

- [SYSTEM_REQUIREMENTS_V2.md](SYSTEM_REQUIREMENTS_V2.md) - 要件定義
- [EXISTING_SYSTEM_ANALYSIS.md](EXISTING_SYSTEM_ANALYSIS.md) - 既存システム分析
- [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) - 実装ロードマップ

---

**Document Status**: ✅ Phase 0 - Complete
**Next Action**: Phase 1 開始 - Week 1 Day 1

**Analyzed by**: System Architect
**Date**: 2025-10-25
**Total Implementation Effort**: 51日 (約10-11週間)
