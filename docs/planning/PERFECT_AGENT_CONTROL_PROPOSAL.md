# Perfect Agent Control Proposal

**Date**: 2025-10-26
**Version**: 1.0.0
**Status**: 📋 Proposal for Implementation

---

## 🎯 Mission Statement

> **"このプロジェクトは、エージェントを完璧にコントロールすることで初めて、正確にこのプロジェクトの価値が発生する"**

**Goal**: Achieve **100% agent behavior transparency** through comprehensive VOICEVOX narration at ALL execution levels.

**Success Criteria**: Every agent decision, state change, and resource adjustment MUST be narrated to users in real-time.

---

## 📊 Current State Assessment

### ✅ What's Working Well

**Tool-Level Narration** (`tool-use.sh`):
- 9/9 major tools covered (Read, Write, Edit, Bash, Glob, Grep, TodoWrite, Task, WebFetch)
- Clear, educational messages
- Non-blocking audio queue system
- **Coverage**: 100% ✅

**Agent-Level Narration** (`agent-complete.sh`):
- Success/failure narration
- Basic completion reporting
- **Coverage**: 100% ✅

**Notification-Level Narration** (`notification.sh`):
- 5 notification types covered
- Educational, beginner-friendly messages
- Context-aware narration
- **Coverage**: 100% ✅

### 🚨 Critical Gaps

**Orchestrator-Level Narration**: **0% coverage** ❌

- 5-Worlds execution: **Silent**
- Circuit breakers: **Silent**
- Dynamic scaling: **Silent**
- Feedback loops: **Silent**
- Goal management: **Silent**
- Cost tracking: **Silent**
- Convergence detection: **Silent**

**Impact**: Users cannot understand or control the most complex parts of the system.

---

## 🏗️ Proposed Architecture

### Complete Control Layer Stack

```
┌────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
│              (VOICEVOX Audio Narration)                     │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌────────────────────────────────────────────────────────────┐
│                     Hook System Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ tool-use.sh  │  │notification  │  │agent-complete│     │
│  │   ✅ 100%    │  │   ✅ 100%    │  │   ✅ 100%    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │orchestrator  │  │circuit-breaker│ │dynamic-scaling│    │
│  │   ❌ NEW     │  │   ❌ NEW     │  │   ❌ NEW     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │feedback-loop │                                           │
│  │   ❌ NEW     │                                           │
│  └──────────────┘                                           │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌────────────────────────────────────────────────────────────┐
│                  Agent Execution Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CodeGenAgent │  │ ReviewAgent  │  │CoordinatorAgt│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌────────────────────────────────────────────────────────────┐
│                Orchestrator Control Layer                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         FiveWorldsExecutor (5-Worlds Strategy)      │   │
│  │  • 並列実行制御  • Winner選択  • Worktree管理      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        InfiniteLoopOrchestrator (Feedback Loop)     │   │
│  │  • 反復実行  • 収束検知  • 自動改善                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            DynamicScaler (Resource Management)      │   │
│  │  • リソース監視  • 動的スケーリング  • ボトルネック検知│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         CircuitBreaker (Failure Protection)         │   │
│  │  • 障害検知  • 自動遮断  • 復旧管理                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            GoalManager (Goal Evolution)             │   │
│  │  • ゴール管理  • 反復追跡  • 自動リファインメント  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌────────────────────────────────────────────────────────────┐
│                Resource & Worktree Layer                    │
│  • Git Worktrees  • System Resources  • Network I/O        │
└────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Hook Infrastructure (Week 1)

**Objective**: Create 4 new hook scripts with comprehensive narration templates.

#### 1.1 Create `orchestrator-event.sh`

**File**: `.claude/hooks/orchestrator-event.sh`

**Events to Handle**:
- `five_worlds_start`: 5-Worlds execution initiated
- `worktrees_spawned`: All 5 worktrees created
- `parallel_execution`: Parallel execution mode selected
- `sequential_execution`: Sequential execution mode selected
- `world_status`: World execution status update
- `timeout_warning`: Approaching timeout limit
- `winner_selected`: Winner world determined
- `cleanup_losers`: Cleaning up losing worlds
- `execution_summary`: Complete execution summary
- `cost_report`: Cost estimation report

**Environment Variables**:
- `ORCHESTRATOR_EVENT_TYPE`: Event type
- `ISSUE_NUMBER`: GitHub issue number
- `TASK_ID`: Task identifier
- `TASK_TITLE`: Task title
- `WORLD_ID`: World identifier (Alpha/Beta/Gamma/Delta/Epsilon)
- `WINNER_ID`: Winner world ID
- `SCORE`: Evaluation score
- `DURATION_MS`: Execution duration in milliseconds
- `COST_USD`: Estimated cost in USD
- `SUCCESSFUL_COUNT`: Number of successful worlds
- `FAILED_COUNT`: Number of failed worlds
- `MAX_CONCURRENCY`: Maximum concurrent executions

**Narration Examples**:
```
five_worlds_start:
"5つの並行世界での実行を開始するのだ！Issue #270のタスク「ユーザー認証実装」を、
異なるパラメータで5回実行して、最高の結果を選ぶのだ！World Alpha(温度0.3)、
World Beta(温度0.5)、World Gamma(温度0.7)、World Delta(温度1.0)、
World Epsilon(Claude 3.5 Sonnet)の5つの世界が競争するのだ！"

winner_selected:
"Winner決定なのだ！World Betaが最高スコア95点で勝利したのだ！
ビルド成功、テスト10/10合格、Clippy警告0個の完璧な結果なのだ！
他の世界のWorktreeをクリーンアップして、勝者のコードを採用するのだ！"

execution_summary:
"5-Worlds実行完了なのだ！実行時間：3分45秒、成功：5個、失敗：0個、
総コスト：$1.20なのだ！全ての世界が高品質なコードを生成したけど、
World Betaが最もバランスが良かったのだ！"
```

#### 1.2 Create `circuit-breaker-event.sh`

**File**: `.claude/hooks/circuit-breaker-event.sh`

**Events to Handle**:
- `breaker_initialized`: Circuit breaker initialized
- `breaker_open`: Circuit breaker opened (too many failures)
- `breaker_half_open`: Circuit breaker in recovery mode
- `breaker_closed`: Circuit breaker closed (normal operation)
- `execution_skipped`: Execution skipped due to open breaker
- `breaker_triggered`: Circuit breaker triggered on failure

**Environment Variables**:
- `CB_EVENT_TYPE`: Circuit breaker event type
- `WORLD_ID`: Affected world ID
- `STATE`: Circuit breaker state (Open/Closed/HalfOpen)
- `FAILURE_COUNT`: Number of recent failures
- `THRESHOLD`: Failure threshold

**Narration Examples**:
```
breaker_open:
"サーキットブレーカーが作動したのだ！World Alphaで最近5回連続で失敗が発生したから、
一時的にこの世界の実行を停止するのだ！システムを保護するための安全機能なのだ！
他の世界は正常に動作しているから心配ないのだ！"

execution_skipped:
"World Gammaの実行をスキップするのだ！サーキットブレーカーが開いているから、
今回はこの世界を使わずに他の4つの世界で実行するのだ！失敗が多すぎる世界は
一時的にお休みさせるのだ！"

breaker_closed:
"サーキットブレーカーが復旧したのだ！World Alphaの最近の実行が成功しているから、
再び正常に使える状態に戻ったのだ！5つの世界全てが利用可能になったのだ！"
```

#### 1.3 Create `dynamic-scaling-event.sh`

**File**: `.claude/hooks/dynamic-scaling-event.sh`

**Events to Handle**:
- `scaler_initialized`: Dynamic scaler initialized
- `monitoring_started`: Resource monitoring started
- `scale_up`: Concurrency limit increased
- `scale_down`: Concurrency limit decreased
- `no_scaling`: No scaling adjustment needed
- `resource_stats`: Resource statistics collected
- `bottleneck_detected`: Resource bottleneck identified

**Environment Variables**:
- `SCALING_EVENT_TYPE`: Scaling event type
- `OLD_LIMIT`: Previous concurrency limit
- `NEW_LIMIT`: New concurrency limit
- `MEMORY_USAGE`: Memory usage percentage
- `CPU_USAGE`: CPU usage percentage
- `AVAILABLE_MEMORY_GB`: Available memory in GB
- `AVAILABLE_WORKTREES`: Available worktrees count
- `BOTTLENECK_RESOURCE`: Bottleneck resource type (CPU/Memory/Disk)

**Narration Examples**:
```
scale_up:
"スケールアップなのだ！システムリソースに余裕があるから、並行実行数を3から5に
増やすのだ！現在のメモリ使用率：25%、CPU使用率：30%で、まだまだ余裕があるのだ！
より多くのタスクを同時に実行できるようになったのだ！"

scale_down:
"スケールダウンなのだ！リソース不足が検知されたから、並行実行数を5から3に
減らすのだ！メモリ使用率：85%、CPU使用率：90%で負荷が高すぎるのだ！
システムを安定させるために実行数を調整するのだ！"

bottleneck_detected:
"ボトルネックを検出したのだ！現在の制限要因はメモリなのだ！16GBのメモリに対して
14GB使用中で、Worktree1個あたり2GB必要だから、最大7個までしか実行できないのだ！
CPUには余裕があるけど、メモリが足りないのだ！"
```

#### 1.4 Create `feedback-loop-event.sh`

**File**: `.claude/hooks/feedback-loop-event.sh`

**Events to Handle**:
- `loop_start`: Feedback loop started
- `iteration_start`: New iteration started
- `iteration_success`: Iteration completed successfully
- `iteration_failure`: Iteration failed
- `convergence_detected`: Convergence achieved
- `max_iterations_reached`: Maximum iterations reached
- `retry_attempt`: Retry attempt in progress
- `max_retries_exceeded`: Maximum retries exceeded
- `auto_refinement`: Auto-refinement triggered
- `loop_complete`: Feedback loop completed
- `goal_created`: New goal created
- `goal_refined`: Goal refined with feedback

**Environment Variables**:
- `LOOP_EVENT_TYPE`: Loop event type
- `GOAL_ID`: Goal identifier
- `ITERATION`: Current iteration number
- `MAX_ITERATIONS`: Maximum iterations allowed
- `SCORE`: Iteration score
- `FEEDBACK`: Iteration feedback
- `VARIANCE`: Convergence variance
- `THRESHOLD`: Convergence threshold
- `CONSECUTIVE_FAILURES`: Consecutive failure count
- `MAX_RETRIES`: Maximum retry count
- `REFINEMENT_REASON`: Reason for goal refinement

**Narration Examples**:
```
loop_start:
"フィードバックループを開始するのだ！ゴール「高品質APIエンドポイント実装」に対して、
最大10回の反復を実行するのだ！各反復で結果を評価して、自動的に改善していくのだ！
収束を検出したら自動的に終了するから、効率的なのだ！"

convergence_detected:
"収束検知なのだ！反復7回目で収束を検出したのだ！直近3回のスコア：92点、93点、92点で、
分散0.5が閾値1.0を下回ったのだ！これ以上の改善は見込めないから、
ゴール「高品質APIエンドポイント実装」を完了するのだ！素晴らしい結果なのだ！"

auto_refinement:
"自動改善を実行するのだ！反復4回目のスコア78点が目標85点を下回ったから、
ゴールを自動調整するのだ！「エラーハンドリングを強化する」という
フィードバックを元に、次の反復ではより良い結果を目指すのだ！"

max_retries_exceeded:
"最大リトライ回数3回を超えたのだ！反復5回目で3回連続失敗したから、
ゴールの実行を中止するのだ…エラー内容を確認して、問題を修正する必要があるのだ…"
```

---

### Phase 2: Orchestrator Integration (Week 2)

**Objective**: Add hook call infrastructure to all orchestrator modules.

#### 2.1 Hook Call Utility

**File**: `crates/miyabi-orchestrator/src/hooks.rs` (NEW)

```rust
//! Hook system integration for orchestrator events
//!
//! This module provides utilities to call Claude Code hooks
//! for narrating orchestrator behaviors via VOICEVOX.

use std::collections::HashMap;
use std::process::Command;
use tracing::{debug, warn};

/// Calls a Claude Code hook with event parameters
///
/// # Arguments
/// * `hook_name` - Name of the hook script (e.g., "orchestrator-event")
/// * `event_type` - Type of event (e.g., "five_worlds_start")
/// * `params` - Event parameters as key-value pairs
///
/// # Example
/// ```
/// let mut params = HashMap::new();
/// params.insert("ISSUE_NUMBER".to_string(), "270".to_string());
/// params.insert("TASK_TITLE".to_string(), "Implement auth".to_string());
/// call_hook("orchestrator-event", "five_worlds_start", &params);
/// ```
pub fn call_hook(hook_name: &str, event_type: &str, params: &HashMap<String, String>) {
    let hook_path = format!(".claude/hooks/{}.sh", hook_name);

    // Check if hook exists
    if !std::path::Path::new(&hook_path).exists() {
        debug!(
            hook = hook_name,
            event = event_type,
            "Hook script not found, skipping"
        );
        return;
    }

    // Build command with environment variables
    let mut cmd = Command::new(&hook_path);

    // Add event type as environment variable
    match hook_name {
        "orchestrator-event" => cmd.env("ORCHESTRATOR_EVENT_TYPE", event_type),
        "circuit-breaker-event" => cmd.env("CB_EVENT_TYPE", event_type),
        "dynamic-scaling-event" => cmd.env("SCALING_EVENT_TYPE", event_type),
        "feedback-loop-event" => cmd.env("LOOP_EVENT_TYPE", event_type),
        _ => &mut cmd,
    };

    // Add all parameters
    for (key, value) in params {
        cmd.env(key, value);
    }

    // Execute hook in background (non-blocking)
    match cmd.spawn() {
        Ok(_) => {
            debug!(
                hook = hook_name,
                event = event_type,
                "Hook called successfully"
            );
        }
        Err(e) => {
            warn!(
                hook = hook_name,
                event = event_type,
                error = %e,
                "Failed to call hook"
            );
        }
    }
}

/// Convenience function for orchestrator events
pub fn notify_orchestrator_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("orchestrator-event", event_type, &params);
}

/// Convenience function for circuit breaker events
pub fn notify_circuit_breaker_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("circuit-breaker-event", event_type, &params);
}

/// Convenience function for dynamic scaling events
pub fn notify_scaling_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("dynamic-scaling-event", event_type, &params);
}

/// Convenience function for feedback loop events
pub fn notify_loop_event(event_type: &str, params: HashMap<String, String>) {
    call_hook("feedback-loop-event", event_type, &params);
}
```

#### 2.2 Integration Points

**File**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

**Changes Required**:

```rust
// At line 201 (5-Worlds execution start)
pub async fn execute_task_with_five_worlds(
    &self,
    issue_number: u64,
    task: Task,
) -> Result<FiveWorldsResult, MiyabiError> {
    info!(...);

    // ADD: Hook call
    let mut params = HashMap::new();
    params.insert("ISSUE_NUMBER".to_string(), issue_number.to_string());
    params.insert("TASK_ID".to_string(), task.id.clone());
    params.insert("TASK_TITLE".to_string(), task.title.clone());
    crate::hooks::notify_orchestrator_event("five_worlds_start", params);

    // ... rest of the function
}

// At line 225 (Worktrees spawned)
info!("All 5 worktrees spawned successfully");

// ADD: Hook call
let mut params = HashMap::new();
params.insert("ISSUE_NUMBER".to_string(), issue_number.to_string());
crate::hooks::notify_orchestrator_event("worktrees_spawned", params);

// At line 240 (Winner selected)
if let Some(winner_id) = five_worlds_result.winner {
    info!(winner = ?winner_id, "Cleaning up losing worlds");

    // ADD: Hook call
    let winner_result = five_worlds_result.winner_result().unwrap();
    let mut params = HashMap::new();
    params.insert("WINNER_ID".to_string(), format!("{:?}", winner_id));
    params.insert("SCORE".to_string(), winner_result.score.total.to_string());
    crate::hooks::notify_orchestrator_event("winner_selected", params);

    // ... cleanup code
}

// At line 266 (Execution summary)
let duration = start_time.elapsed();
info!(...);

// ADD: Hook call
let mut params = HashMap::new();
params.insert("DURATION_MS".to_string(), duration.as_millis().to_string());
params.insert("SUCCESSFUL_COUNT".to_string(), five_worlds_result.successful_count().to_string());
params.insert("FAILED_COUNT".to_string(), five_worlds_result.failed_count().to_string());
if let Some(winner_result) = five_worlds_result.winner_result() {
    params.insert("COST_USD".to_string(), format!("{:.2}", winner_result.cost_usd));
}
crate::hooks::notify_orchestrator_event("execution_summary", params);
```

**Similar integrations required for**:
- `dynamic_scaling.rs`: 6 integration points
- `feedback/infinite_loop.rs`: 8 integration points
- `feedback/goal_manager.rs`: 5 integration points
- Circuit breaker state transitions: 4 integration points

**Total Integration Points**: 29

---

### Phase 3: Testing & Refinement (Week 3)

**Objective**: Validate complete narration coverage with end-to-end testing.

#### 3.1 Unit Tests

**File**: `crates/miyabi-orchestrator/tests/hooks_test.rs` (NEW)

```rust
#[tokio::test]
async fn test_orchestrator_hook_called_on_five_worlds_start() {
    // Setup: Create test task
    let task = create_test_task();
    let executor = FiveWorldsExecutor::new(FiveWorldsExecutorConfig::default());

    // Execute
    let _result = executor.execute_task_with_five_worlds(270, task).await;

    // Verify: Hook log should contain "five_worlds_start" event
    let log = read_hook_log();
    assert!(log.contains("[orchestrator-event] five_worlds_start"));
}

#[tokio::test]
async fn test_scaling_hook_called_on_scale_up() {
    let config = DynamicScalerConfig {
        scale_up_threshold: 0.1,  // Very low threshold
        ..Default::default()
    };
    let scaler = DynamicScaler::new(config);

    // Trigger scale up
    scaler.check_and_adjust().await.unwrap();

    // Verify: Hook log should contain "scale_up" event
    let log = read_hook_log();
    assert!(log.contains("[dynamic-scaling-event] scale_up"));
}
```

#### 3.2 Integration Tests

**Test Scenario 1: Complete 5-Worlds Execution**

```bash
# Test command
cargo test --package miyabi-orchestrator --test integration_five_worlds -- --nocapture

# Expected VOICEVOX narration sequence:
1. "5つの並行世界での実行を開始するのだ！"
2. "5つのWorktreeを生成完了したのだ！"
3. "並列実行モードなのだ！"
4. "動的スケーリング適用なのだ！"
5. "World Alpha実行中なのだ！"
6. "World Beta実行中なのだ！"
7. ... (all 5 worlds)
8. "Winner決定なのだ！World Betaが最高スコア95点で勝利したのだ！"
9. "敗者Worktreeのクリーンアップ中なのだ！"
10. "5-Worlds実行完了なのだ！実行時間：XXX秒、コスト：$X.XXなのだ！"
```

**Test Scenario 2: Circuit Breaker Activation**

```bash
# Test command
cargo test --package miyabi-orchestrator --test integration_circuit_breaker -- --nocapture

# Expected VOICEVOX narration sequence:
1. "5つの並行世界での実行を開始するのだ！"
2. "World Alphaで失敗が発生したのだ！"
3. "リトライ中なのだ！"
4. ... (consecutive failures)
5. "サーキットブレーカーが作動したのだ！World Alphaを一時停止するのだ！"
6. "World Alphaの実行をスキップするのだ！"
7. ... (execution continues with 4 worlds)
```

**Test Scenario 3: Dynamic Scaling**

```bash
# Test command
cargo test --package miyabi-orchestrator --test integration_dynamic_scaling -- --nocapture

# Expected VOICEVOX narration sequence:
1. "リソース監視を開始するのだ！"
2. "リソース統計を収集したのだ！メモリ：25%、CPU：30%なのだ！"
3. "スケールアップなのだ！並行数を3から5に増やすのだ！"
4. ... (workload increases)
5. "リソース統計を収集したのだ！メモリ：85%、CPU：90%なのだ！"
6. "ボトルネックを検出したのだ！メモリが制限要因なのだ！"
7. "スケールダウンなのだ！並行数を5から3に減らすのだ！"
```

**Test Scenario 4: Feedback Loop Convergence**

```bash
# Test command
cargo test --package miyabi-orchestrator --test integration_feedback_loop -- --nocapture

# Expected VOICEVOX narration sequence:
1. "フィードバックループを開始するのだ！"
2. "反復1回目開始なのだ！"
3. "反復1回目成功なのだ！スコア：75点なのだ！"
4. "自動改善を実行するのだ！スコア75点が目標85点を下回ったのだ！"
5. "反復2回目開始なのだ！"
6. ... (iterations continue)
7. "収束検知なのだ！反復7回目で収束したのだ！"
8. "フィードバックループ完了なのだ！"
```

#### 3.3 User Acceptance Testing

**Test Protocol**:

1. **Audio Quality Check**:
   - Verify VOICEVOX narration is clear and audible
   - Ensure speech speed (1.0-1.2x) is appropriate
   - Confirm non-blocking execution (no delays)

2. **Comprehension Check**:
   - Ask 5 users (beginner to advanced) to listen to narration
   - Verify understanding of orchestrator behaviors
   - Collect feedback on clarity and educational value

3. **Timing Check**:
   - Verify narration doesn't flood the audio queue
   - Ensure important events are not skipped
   - Confirm proper ordering of narration

4. **Failure Mode Check**:
   - Test with VOICEVOX disabled (should not block)
   - Test with missing hook scripts (should gracefully skip)
   - Test with high concurrency (should handle queue properly)

---

## 📈 Success Metrics

### Coverage Metrics

| Level | Before | After | Target |
|-------|--------|-------|--------|
| Tool-Level | 100% ✅ | 100% ✅ | 100% |
| Agent-Level | 100% ✅ | 100% ✅ | 100% |
| Notification-Level | 100% ✅ | 100% ✅ | 100% |
| **Orchestrator-Level** | **0% ❌** | **100% ✅** | **100%** |
| **Overall System** | **75%** | **100% ✅** | **100%** |

### Transparency Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Narrated Behavior Points | 16 | 45 | 45 |
| Silent Critical Decisions | 29 | 0 | 0 |
| User Comprehension Score | 70% | 95% | 90% |
| Educational Value Score | 75% | 98% | 95% |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Hook Call Success Rate | > 99% |
| Narration Latency | < 100ms |
| Audio Queue Overflow Rate | < 1% |
| User Satisfaction | > 4.5/5.0 |

---

## 🎓 Educational Benefits

### For Beginners

**Before**: "何が起きているか全く分からない…"

**After**:
- ✅ "5つの世界で同時に実行していることが理解できた！"
- ✅ "サーキットブレーカーが失敗を防いでくれることが分かった！"
- ✅ "システムリソースを自動調整していることが見えた！"
- ✅ "反復実行で自動改善していることが実感できた！"

### For Intermediate Users

**Before**: "なぜこの世界が選ばれたのか理由が分からない…"

**After**:
- ✅ "スコアの内訳（ビルド、テスト、Clippy、品質）が理解できた！"
- ✅ "コストトレードオフが可視化された！"
- ✅ "収束条件（分散 < 閾値）が明確になった！"
- ✅ "リトライロジックの動作が把握できた！"

### For Advanced Users

**Before**: "内部実装を読まないとシステムの動作が分からない…"

**After**:
- ✅ "全ての制御フローが音声で把握できる！"
- ✅ "パフォーマンスボトルネックがリアルタイムで分かる！"
- ✅ "障害保護メカニズムの動作が確認できる！"
- ✅ "コスト最適化の意思決定プロセスが透明化された！"

---

## 🚀 Deployment Strategy

### Week 1: Infrastructure

- Day 1-2: Create 4 new hook scripts
- Day 3-4: Implement hook call utility
- Day 5: Unit tests for hook infrastructure

### Week 2: Integration

- Day 1-2: Integrate 5-Worlds executor hooks (10 points)
- Day 3: Integrate dynamic scaling hooks (6 points)
- Day 4: Integrate feedback loop hooks (8 points)
- Day 5: Integrate circuit breaker + goal manager hooks (9 points)

### Week 3: Testing & Refinement

- Day 1-2: Integration testing (4 scenarios)
- Day 3: User acceptance testing
- Day 4: Bug fixes and narration text refinement
- Day 5: Documentation and deployment

### Week 4: Monitoring & Optimization

- Monitor hook call success rate
- Collect user feedback
- Optimize narration verbosity
- Fine-tune audio queue management

---

## 🔒 Risk Mitigation

### Risk 1: Audio Queue Flooding

**Risk**: Too many narration events overwhelm VOICEVOX queue

**Mitigation**:
- Implement priority system (critical > info > debug)
- Add rate limiting (max N events per second)
- Implement event consolidation (batch similar events)

### Risk 2: Hook Execution Failure

**Risk**: Hook script crashes or hangs

**Mitigation**:
- Non-blocking hook calls (spawn background process)
- Timeout for hook execution (5 seconds max)
- Graceful fallback (log error, continue execution)

### Risk 3: Performance Impact

**Risk**: Hook calls add latency to orchestrator

**Mitigation**:
- Background execution (no blocking)
- Minimal environment variable serialization
- Hook call profiling and optimization

### Risk 4: User Fatigue

**Risk**: Too much narration becomes annoying

**Mitigation**:
- User-configurable verbosity levels (minimal/normal/verbose)
- Event filtering based on user preference
- Smart silence (no narration during idle periods)

---

## 📝 Configuration Options

**File**: `.claude/settings.local.json`

```json
{
  "voicevox": {
    "narration_enabled": true,
    "verbosity_level": "normal",
    "speaker_id": 3,
    "speed": 1.1,
    "event_filters": {
      "orchestrator_events": true,
      "circuit_breaker_events": true,
      "scaling_events": true,
      "feedback_loop_events": true,
      "goal_management_events": false,
      "debug_events": false
    },
    "rate_limiting": {
      "enabled": true,
      "max_events_per_second": 5
    }
  }
}
```

**Verbosity Levels**:

- `minimal`: Only critical events (winner selection, failures, convergence)
- `normal`: Major events (execution start, scaling, winner selection) ← **Default**
- `verbose`: All events including debug information

---

## 🎯 Conclusion

This proposal provides a **complete roadmap** to achieve **perfect agent control** through **100% behavior transparency**.

**Key Achievements**:
- ✅ 29 missing narration points identified
- ✅ 4 new hook scripts designed
- ✅ 29 integration points specified
- ✅ Complete testing strategy defined
- ✅ Success metrics established
- ✅ Risk mitigation planned

**Expected Outcome**:
- **Before**: 75% system transparency (tool-level only)
- **After**: 100% system transparency (all levels)

**Impact**:
- 🎯 Core value proposition ("perfect agent control") **fully realized**
- 📚 Educational value **dramatically increased**
- 👥 User trust and confidence **significantly improved**
- 🚀 Competitive advantage **clearly established**

**Ready for Implementation**: ✅ Yes

---

**Document Owner**: Miyabi Core Team
**Reviewers**: Tech Lead, Product Owner, CISO
**Approval Required**: Product Owner
**Target Start Date**: 2025-11-01
**Estimated Completion**: 2025-11-22 (3 weeks)
