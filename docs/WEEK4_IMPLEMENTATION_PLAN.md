# Week 4 Implementation Plan - Phase 13 Agent Integration

**Phase**: 13 - 5-Worlds Quality Assurance Strategy
**Period**: Week 4 (Days 1-5)
**Status**: 🚀 **READY TO START**
**Date**: 2025-10-25

---

## 📋 Executive Summary

Week 4では、Week 3で完成した永続化層とエラーハンドリング機能を基に、**実際のCodeGenAgent/ReviewAgentをFiveWorldsExecutorに統合**します。これにより、Phase 13のend-to-end自動化が完成します。

**目標**:
- ✅ CodeGenAgent統合 - 実際のLLMベースコード生成
- ✅ ReviewAgent統合 - 100点満点の品質評価
- ✅ FiveWorldsManager統合 - 5つのWorktree並列実行
- ✅ End-to-End テスト - Issue → Code → Review → Winner Selection

---

## 🎯 Week 4 Goals

### Day 1: CodeGenAgent Integration ⭐⭐⭐⭐⭐

**Task**: FiveWorldsExecutorのスタブ実装を実際のCodeGenAgentに置き換え

**Current State**:
```rust
// crates/miyabi-orchestrator/src/five_worlds_executor.rs:372-405
async fn execute_single_world_stub(
    world_id: WorldId,
    config: WorldConfig,
    _task: Task,
) -> Result<WorldExecutionResult, MiyabiError> {
    // Simulate execution time
    tokio::time::sleep(Duration::from_millis(100)).await;

    // TODO: Replace with actual implementation
    let score = EvaluationScore::calculate(...);
    Ok(WorldExecutionResult::success(...))
}
```

**Target State**:
```rust
async fn execute_single_world(
    world_id: WorldId,
    config: WorldConfig,
    task: Task,
    worktree_manager: Arc<FiveWorldsManager>,
) -> Result<WorldExecutionResult, MiyabiError> {
    let start_time = Instant::now();

    // Step 1: Create worktree using FiveWorldsManager
    let handle = worktree_manager
        .spawn_world(task.issue_number, &task.id, world_id)
        .await?;

    // Step 2: Execute CodeGenAgent with world-specific config
    let agent_config = build_agent_config(&config);
    let codegen = CodeGenAgent::new(agent_config);
    let code_result = codegen.generate_code(&task, Some(&handle.path)).await?;

    // Step 3: Run ReviewAgent to evaluate code
    let review = ReviewAgent::new(agent_config);
    let review_result = review.review_code_at_path(&handle.path).await?;

    // Step 4: Calculate EvaluationScore from review results
    let score = EvaluationScore::from_review(&review_result);

    // Step 5: Return WorldExecutionResult
    let duration_ms = start_time.elapsed().as_millis() as u64;
    Ok(WorldExecutionResult::success(
        world_id,
        score,
        handle.path,
        duration_ms,
        estimate_cost(&config, duration_ms),
    ))
}
```

**Dependencies to Add**:
```toml
# crates/miyabi-orchestrator/Cargo.toml
[dependencies]
miyabi-agent-codegen = { path = "../miyabi-agent-codegen" }
miyabi-agent-review = { path = "../miyabi-agent-review" }
miyabi-worktree = { path = "../miyabi-worktree" }
```

**Deliverables**:
- [ ] `execute_single_world()` implementation
- [ ] `build_agent_config()` helper
- [ ] `estimate_cost()` helper
- [ ] Unit tests (5+)

**Estimated Time**: 6-8 hours

---

### Day 2: ReviewAgent Integration ⭐⭐⭐⭐

**Task**: ReviewAgentの実行と品質スコア計算の統合

**Implementation Details**:

#### 2.1 ReviewAgent API適応

ReviewAgentの現在のAPI:
```rust
// crates/miyabi-agent-review/src/review.rs:306-379
pub async fn review_code(&self, task: &Task) -> Result<ReviewResult>
```

この`review_code()`は現在のディレクトリをレビューします。Worktree対応に拡張:
```rust
impl ReviewAgent {
    /// Reviews code at a specific path (for worktree support)
    pub async fn review_code_at_path(
        &self,
        path: &Path,
        task: &Task,
    ) -> Result<ReviewResult> {
        tracing::info!("Reviewing code at {:?}", path);

        // Run all checks at the specified path
        let clippy_result = self.run_clippy(path).await?;
        let rustc_result = self.run_rustc_check(path).await?;
        let security_result = self.run_security_audit(path).await?;
        let coverage_result = self.calculate_coverage(path).await?;

        // Generate quality report
        let quality_report = self.generate_quality_report(
            clippy_result,
            rustc_result,
            security_result,
            coverage_result,
        );

        Ok(ReviewResult {
            quality_report,
            approved: quality_report.meets_threshold(),
            escalation_required: quality_report.score < 60,
            escalation_target: if quality_report.score < 60 {
                Some(EscalationTarget::TechLead)
            } else {
                None
            },
            comments: vec![],
        })
    }
}
```

#### 2.2 EvaluationScore計算

ReviewResultからEvaluationScoreへの変換:
```rust
// crates/miyabi-types/src/world.rs
impl EvaluationScore {
    /// Creates EvaluationScore from ReviewAgent's ReviewResult
    pub fn from_review_result(review: &ReviewResult) -> Self {
        let quality_report = &review.quality_report;
        let breakdown = &quality_report.breakdown;

        // Map ReviewAgent scores to EvaluationScore
        let build_success = breakdown.rustc_score == 100;
        let tests_passed = if breakdown.test_coverage_score >= 80 { 10 } else { 7 };
        let tests_total = 10;
        let clippy_warnings = calculate_clippy_warnings(&breakdown);
        let code_quality = breakdown.clippy_score as f64 / 100.0;
        let security = breakdown.security_score as f64 / 100.0;

        Self::calculate(
            build_success,
            tests_passed,
            tests_total,
            clippy_warnings,
            code_quality,
            security,
        )
    }
}

fn calculate_clippy_warnings(breakdown: &QualityBreakdown) -> u32 {
    // Reverse engineer warning count from score
    // Score formula: 100 - (warnings * 5)
    let score_loss = 100 - breakdown.clippy_score;
    score_loss as u32 / 5
}
```

**Deliverables**:
- [ ] `review_code_at_path()` implementation in ReviewAgent
- [ ] `EvaluationScore::from_review_result()` implementation
- [ ] Integration tests (3+)

**Estimated Time**: 4-6 hours

---

### Day 3: FiveWorldsManager Integration ⭐⭐⭐⭐

**Task**: Worktreeライフサイクル管理の完全統合

**Implementation Details**:

#### 3.1 FiveWorldsExecutor構造体更新

```rust
// crates/miyabi-orchestrator/src/five_worlds_executor.rs
use miyabi_worktree::FiveWorldsManager;

pub struct FiveWorldsExecutor {
    /// Configuration
    config: FiveWorldsExecutorConfig,
    /// Active world executions (for monitoring)
    active_executions: Arc<Mutex<HashMap<WorldId, WorldExecutionStatus>>>,
    /// Circuit breakers per WorldId (Arc-wrapped for cloning)
    circuit_breakers: Arc<Mutex<HashMap<WorldId, Arc<CircuitBreaker>>>>,
    /// Dynamic scaler for resource management
    dynamic_scaler: Option<Arc<DynamicScaler>>,
    /// Worktree manager for 5-Worlds execution
    worktree_manager: Arc<FiveWorldsManager>, // NEW
}
```

#### 3.2 execute_task_with_five_worlds更新

```rust
pub async fn execute_task_with_five_worlds(
    &self,
    issue_number: u64,
    task: Task,
) -> Result<FiveWorldsResult, MiyabiError> {
    info!(
        issue_number = issue_number,
        task_id = %task.id,
        task_title = %task.title,
        "Starting 5-Worlds execution"
    );

    let start_time = Instant::now();

    // Step 1: Prepare world configs
    let world_configs = self.prepare_world_configs(issue_number, &task);

    // Step 2: Spawn all 5 worktrees
    let _worktree_handles = self.worktree_manager
        .spawn_all_worlds(issue_number, &task.id)
        .await
        .map_err(|e| MiyabiError::Git(e.to_string()))?;

    // Step 3: Execute all worlds (parallel or sequential)
    let results = if self.config.parallel_execution {
        self.execute_worlds_parallel(issue_number, &task, world_configs).await?
    } else {
        self.execute_worlds_sequential(issue_number, &task, world_configs).await?
    };

    // Step 4: Create aggregated result
    let five_worlds_result = FiveWorldsResult::from_results(results);

    // Step 5: Cleanup losing worlds, keep winner
    if let Some(winner_id) = five_worlds_result.winner {
        for world_id in WorldId::all() {
            if world_id != winner_id {
                self.worktree_manager.cleanup_world(world_id).await
                    .map_err(|e| MiyabiError::Git(e.to_string()))?;
            }
        }
        info!(winner = ?winner_id, "Cleaned up losing worlds, kept winner");
    } else {
        // No winner - cleanup all
        self.worktree_manager
            .cleanup_all_worlds_for_issue(issue_number)
            .await
            .map_err(|e| MiyabiError::Git(e.to_string()))?;
        warn!("No successful world - all worlds cleaned up");
    }

    let duration = start_time.elapsed();
    info!(
        duration_ms = duration.as_millis(),
        successful = five_worlds_result.successful_count(),
        failed = five_worlds_result.failed_count(),
        winner = ?five_worlds_result.winner,
        "5-Worlds execution completed"
    );

    Ok(five_worlds_result)
}
```

**Deliverables**:
- [ ] FiveWorldsManager field added to FiveWorldsExecutor
- [ ] Worktree lifecycle integrated (spawn → execute → cleanup)
- [ ] Winner保持ロジック
- [ ] Integration tests (5+)

**Estimated Time**: 6-8 hours

---

### Day 4: End-to-End Integration & Testing ⭐⭐⭐⭐⭐

**Task**: 完全なE2Eフローのテストと検証

**Test Scenarios**:

#### 4.1 Happy Path Test

```rust
#[tokio::test]
async fn test_e2e_five_worlds_execution() {
    // Setup
    let config = FiveWorldsExecutorConfig::default();
    let executor = FiveWorldsExecutor::new(config);

    let task = Task {
        id: "test-task".to_string(),
        title: "Implement authentication feature".to_string(),
        description: "Add JWT authentication to the API".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        // ...
    };

    // Execute
    let result = executor
        .execute_task_with_five_worlds(270, task)
        .await
        .expect("Execution should succeed");

    // Verify
    assert!(result.successful_count() >= 1, "At least one world should succeed");
    assert!(result.winner.is_some(), "Winner should be selected");

    let winner_result = result.winner_result().unwrap();
    assert!(winner_result.score.total > 70.0, "Winner should have high score");

    // Verify only winner worktree exists
    let stats = executor.worktree_manager.get_statistics().await;
    assert_eq!(stats.total_active, 1, "Only winner worktree should remain");
}
```

#### 4.2 Circuit Breaker Test

```rust
#[tokio::test]
async fn test_circuit_breaker_prevents_cascading_failures() {
    let config = FiveWorldsExecutorConfig {
        enable_circuit_breaker: true,
        ..Default::default()
    };
    let executor = FiveWorldsExecutor::new(config);

    // Simulate 5 consecutive failures for Alpha world
    for _ in 0..5 {
        let task = create_failing_task();
        let _ = executor.execute_task_with_five_worlds(270, task).await;
    }

    // Check Alpha's circuit breaker is open
    let cb = executor.circuit_breakers.lock().await;
    let alpha_cb = cb.get(&WorldId::Alpha).unwrap();
    assert_eq!(alpha_cb.state().await, CircuitState::Open);

    // Next execution should skip Alpha
    let task = create_test_task();
    let result = executor.execute_task_with_five_worlds(270, task).await.unwrap();

    // Alpha should have failed immediately (circuit open)
    let alpha_result = result.results.get(&WorldId::Alpha).unwrap();
    assert!(alpha_result.error_message.contains("Circuit breaker open"));
}
```

#### 4.3 Dynamic Scaling Test

```rust
#[tokio::test]
async fn test_dynamic_scaling_adjusts_concurrency() {
    let config = FiveWorldsExecutorConfig {
        enable_dynamic_scaling: true,
        ..Default::default()
    };
    let executor = FiveWorldsExecutor::new(config);

    // Simulate low resource usage
    executor.dynamic_scaler.as_ref().unwrap()
        .set_limit(5).await; // Start with max concurrency

    let task = create_test_task();
    let _ = executor.execute_task_with_five_worlds(270, task).await;

    // Verify max concurrency was used
    let limit = executor.dynamic_scaler.as_ref().unwrap()
        .get_current_limit().await;
    assert!(limit >= 1 && limit <= 5);
}
```

#### 4.4 Persistence Test

```rust
#[tokio::test]
async fn test_results_persisted_to_database() {
    let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());
    let db = Database::new_in_memory().await.unwrap();

    let task = create_test_task();
    let result = executor.execute_task_with_five_worlds(270, task).await.unwrap();

    // Save to database
    db.save_five_worlds_run(&result).await.unwrap();

    // Verify persistence
    let latest_run = db.get_latest_run(270).await.unwrap();
    assert_eq!(latest_run.winner_world_id, result.winner);
    assert_eq!(latest_run.results.len(), 5);
}
```

**Deliverables**:
- [ ] E2E happy path test
- [ ] Circuit breaker integration test
- [ ] Dynamic scaling integration test
- [ ] Persistence integration test
- [ ] Test documentation

**Estimated Time**: 8-10 hours

---

### Day 5: Performance Optimization & Documentation ⭐⭐⭐

**Task**: パフォーマンス最適化とドキュメント作成

**Optimization Targets**:

#### 5.1 Parallel Execution Optimization

```rust
// Before: Sequential worktree spawning
for world_id in WorldId::all() {
    worktree_manager.spawn_world(issue_number, task_id, world_id).await?;
}

// After: Parallel worktree spawning (if safe)
let spawn_handles: Vec<_> = WorldId::all().into_iter()
    .map(|world_id| {
        let manager = worktree_manager.clone();
        let task_id = task_id.clone();
        tokio::spawn(async move {
            manager.spawn_world(issue_number, &task_id, world_id).await
        })
    })
    .collect();

let results = futures::future::join_all(spawn_handles).await;
```

#### 5.2 Caching LLM Provider Instances

```rust
// Add to FiveWorldsExecutor
pub struct FiveWorldsExecutor {
    // ... existing fields
    /// Cached LLM providers per model
    llm_providers: Arc<Mutex<HashMap<String, Arc<GPTOSSProvider>>>>,
}

impl FiveWorldsExecutor {
    async fn get_or_create_llm_provider(
        &self,
        model: &str,
    ) -> Result<Arc<GPTOSSProvider>, MiyabiError> {
        let mut providers = self.llm_providers.lock().await;

        if let Some(provider) = providers.get(model) {
            return Ok(provider.clone());
        }

        let provider = Arc::new(GPTOSSProvider::new_for_model(model)?);
        providers.insert(model.to_string(), provider.clone());

        Ok(provider)
    }
}
```

#### 5.3 Documentation Creation

**Files to Create/Update**:
1. `docs/AGENT_INTEGRATION_GUIDE.md` - Agent統合ガイド
2. `docs/FIVE_WORLDS_ARCHITECTURE.md` - 5-Worlds アーキテクチャドキュメント
3. `docs/WEEK4_COMPLETION_REPORT.md` - Week 4完了レポート
4. Update `docs/SYSTEM_REQUIREMENTS_V2.md` with actual implementation details

**Deliverables**:
- [ ] Parallel worktree spawning
- [ ] LLM provider caching
- [ ] Architecture documentation
- [ ] Integration guide
- [ ] Week 4 completion report

**Estimated Time**: 6-8 hours

---

## 📊 Progress Tracking

### Phase 13 Overall Progress (After Week 4)

```
[██████████████████████████████████] 100% Complete

Week 1: ✅ Foundation (miyabi-types, WorldConfig, EvaluationScore)
Week 2: ✅ Core Implementation (FiveWorldsExecutor, DynamicScaling, CircuitBreaker)
Week 3: ✅ Persistence & Integration (miyabi-persistence, Error Handling)
Week 4: 🔄 Agent Integration (CodeGenAgent, ReviewAgent, FiveWorldsManager)
```

### Daily Checklist

**Day 1** (CodeGenAgent Integration):
- [ ] Add dependencies to miyabi-orchestrator
- [ ] Implement `execute_single_world()`
- [ ] Implement `build_agent_config()`
- [ ] Implement `estimate_cost()`
- [ ] Write unit tests (5+)
- [ ] Run `cargo test --package miyabi-orchestrator`

**Day 2** (ReviewAgent Integration):
- [ ] Implement `review_code_at_path()` in ReviewAgent
- [ ] Implement `EvaluationScore::from_review_result()`
- [ ] Update `execute_single_world()` to use ReviewAgent
- [ ] Write integration tests (3+)
- [ ] Run `cargo test --package miyabi-types`

**Day 3** (FiveWorldsManager Integration):
- [ ] Add FiveWorldsManager field to FiveWorldsExecutor
- [ ] Update `execute_task_with_five_worlds()` with worktree lifecycle
- [ ] Implement winner preservation logic
- [ ] Write integration tests (5+)
- [ ] Run `cargo test --package miyabi-orchestrator`

**Day 4** (E2E Testing):
- [ ] Write E2E happy path test
- [ ] Write Circuit Breaker integration test
- [ ] Write Dynamic Scaling integration test
- [ ] Write Persistence integration test
- [ ] Run full test suite: `cargo test --all`

**Day 5** (Optimization & Docs):
- [ ] Implement parallel worktree spawning
- [ ] Implement LLM provider caching
- [ ] Create AGENT_INTEGRATION_GUIDE.md
- [ ] Create FIVE_WORLDS_ARCHITECTURE.md
- [ ] Create WEEK4_COMPLETION_REPORT.md
- [ ] Final review and cleanup

---

## 🎓 Implementation Notes

### Agent Configuration

```rust
fn build_agent_config(world_config: &WorldConfig) -> AgentConfig {
    AgentConfig {
        device_identifier: "miyabi-five-worlds".to_string(),
        github_token: std::env::var("GITHUB_TOKEN").unwrap_or_default(),
        repo_owner: Some("ShunsukeHayashi".to_string()),
        repo_name: Some("Miyabi".to_string()),
        use_task_tool: false,
        use_worktree: true, // Enable worktree support
        worktree_base_path: Some(world_config.worktree_path.clone()),
        log_directory: "./logs".to_string(),
        report_directory: "./reports".to_string(),
        tech_lead_github_username: None,
        ciso_github_username: None,
        po_github_username: None,
        firebase_production_project: None,
        firebase_staging_project: None,
        production_url: None,
        staging_url: None,
    }
}
```

### Cost Estimation

```rust
fn estimate_cost(config: &WorldConfig, duration_ms: u64) -> f64 {
    // Rough cost estimation based on model and duration
    let base_cost_per_min = match config.model.as_str() {
        "gpt-4o" => 0.10,           // $0.10/min
        "claude-3-5-sonnet" => 0.08, // $0.08/min
        "gpt-oss-20b" => 0.02,      // $0.02/min (self-hosted)
        _ => 0.05,                  // Default
    };

    let duration_min = duration_ms as f64 / 1000.0 / 60.0;
    base_cost_per_min * duration_min
}
```

### Error Handling Best Practices

1. **Worktree Cleanup on Failure**: Always clean up worktrees in error paths
2. **Circuit Breaker Integration**: Let circuit breakers handle retries automatically
3. **Graceful Degradation**: Accept partial success (e.g., 1/5 worlds succeeded)
4. **Detailed Error Context**: Include world_id, task_id, and error details in logs

---

## 🔗 Related Documents

- [SYSTEM_REQUIREMENTS_V2.md](./SYSTEM_REQUIREMENTS_V2.md) - Phase 13完全仕様
- [WEEK1_COMPLETION_REPORT.md](./WEEK1_COMPLETION_REPORT.md) - Week 1完了レポート
- [WEEK2_COMPLETION_REPORT.md](./WEEK2_COMPLETION_REPORT.md) - Week 2完了レポート
- [WEEK3_COMPLETION_REPORT.md](./WEEK3_COMPLETION_REPORT.md) - Week 3完了レポート
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - 実装ロードマップ

---

## 🚨 Risk Mitigation

### Risk 1: LLM API Rate Limits

**Mitigation**:
- Implement exponential backoff in CodeGenAgent
- Use Circuit Breaker to prevent cascading retries
- Cache LLM provider instances
- Consider fallback to lower-tier models

### Risk 2: Git Worktree Conflicts

**Mitigation**:
- Sequential worktree spawning (avoid parallel Git operations)
- Comprehensive cleanup in error paths
- Retry logic with backoff for Git lock file conflicts

### Risk 3: Long Execution Times

**Mitigation**:
- Set reasonable timeouts (default: 30 minutes per world)
- Implement progress tracking and logging
- Use Dynamic Scaler to adjust concurrency based on resources

### Risk 4: Test Environment Dependencies

**Mitigation**:
- Mock LLM providers for unit tests
- Use `#[ignore]` for tests requiring external services
- Create integration test suite with proper setup/teardown

---

## 📈 Success Metrics

**Week 4 Goals**:
- ✅ 100% Agent Integration (CodeGen + Review)
- ✅ 100% Worktree Lifecycle (Spawn → Execute → Cleanup)
- ✅ 90%+ Test Coverage (Unit + Integration)
- ✅ E2E Flow Working (Issue → Code → Review → Winner)

**Performance Targets**:
- Single World Execution: < 5 minutes
- 5-Worlds Parallel Execution: < 10 minutes
- Worktree Cleanup: < 10 seconds
- Database Persistence: < 100ms

---

**Plan Created**: 2025-10-25
**Target Completion**: 2025-10-30 (5 days)
**Status**: 🚀 READY TO START

🤖 Generated with [Claude Code](https://claude.com/claude-code)
