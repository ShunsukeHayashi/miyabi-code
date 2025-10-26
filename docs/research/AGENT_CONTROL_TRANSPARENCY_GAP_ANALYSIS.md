# Agent Control & Behavior Transparency Gap Analysis

**Date**: 2025-10-26
**Version**: 1.0.0
**Status**: 🚨 Critical Analysis

---

## 📌 Executive Summary

This document provides a **comprehensive gap analysis** of Miyabi's agent control mechanisms and behavior transparency through VOICEVOX narration. The analysis identifies **10 major gaps** where critical agent behaviors are **not narrated** to users, violating the core principle that "perfect agent control" requires complete behavior transparency.

**Core Finding**: While tool-level narration is excellent (Read, Write, Edit, etc.), **orchestrator-level behaviors** (5-Worlds execution, circuit breakers, dynamic scaling, convergence detection, cost tracking) are **completely silent**.

---

## 🎯 Core Mission Statement

> **"このプロジェクトは、エージェントを完璧にコントロールすることで初めて、正確にこのプロジェクトの価値が発生する"**

**Translation**: "This project's value is realized only through perfect agent control."

**Requirement**: ALL agent behaviors MUST be narrated to users via VOICEVOX for complete transparency.

---

## ✅ Current VOICEVOX Coverage

### 1. Tool-Level Narration (`.claude/hooks/tool-use.sh`)

**Status**: ✅ **Excellent** - Comprehensive coverage

**Narrated Tools**:
- `Read`: "ファイル「{filename}」を読み込み中なのだ！"
- `Write`: "ファイル「{filename}」を新規作成するのだ！"
- `Edit`: "ファイル「{filename}」を編集するのだ！"
- `Bash`: "コマンド実行なのだ！{description}を実行するのだ！"
- `Glob`: "パターン「{pattern}」でファイル検索中なのだ！"
- `Grep`: "「{pattern}」を検索中なのだ！"
- `TodoWrite`: "TODOリストを更新するのだ！"
- `Task`: "サブエージェント起動なのだ！{description}を実行するのだ！"
- `WebFetch`: "ウェブページを取得中なのだ！"

**Coverage**: 9/9 major tools ✅

---

### 2. Agent Completion Narration (`.claude/hooks/agent-complete.sh`)

**Status**: ✅ **Good** - Basic coverage

**Narrated Events**:
- Success: "エージェント完了なのだ！{description}が成功したのだ！"
- Failure: "エージェント失敗なのだ…{description}でエラーが発生したのだ…"

**Coverage**: 2/2 completion states ✅

---

### 3. Notification Narration (`.claude/hooks/notification.sh`)

**Status**: ✅ **Excellent** - Educational messages

**Narrated Events**:
- `task_complete`: "やったのだ！「{message}」のタスクが正常に完了したのだ。これは、書かれたコードが意図通りに動いた証拠なのだ。"
- `error`: "大変なのだ！でも落ち着いてほしいのだ。エラーはプログラミングが上達する最高のチャンスなのだ！"
- `user_input_needed`: "プログラムが君に話しかけているのだ！「{message}」について、君からの応答を待っている状態なのだ。"
- `agent_waiting`: "エージェントの僕、ずんだもんは、今ユーザーさんからの次の指示を待っているのだ。"
- `general`: "システムからのお知らせなのだ！内容は「{message}」なのだ。"

**Coverage**: 5/5 notification types ✅

---

### 4. Dashboard Events (`.claude/hooks/agent-event.sh`)

**Status**: ⚠️ **Not VOICEVOX** - HTTP POST only

**Events Sent** (to `localhost:3001/api/agent-event`):
- `started`: Agent execution started
- `progress`: Progress updates
- `completed`: Agent completion
- `error`: Error events

**Issue**: These events are sent to a dashboard API but **NOT narrated via VOICEVOX**. Users don't hear these critical state changes.

---

## 🚨 Critical Gaps - Missing Narration Points

### Gap 1: 5-Worlds Execution Orchestration

**File**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 201-212 | 5-Worlds execution start | ❌ Silent | "5つの並行世界での実行を開始するのだ！Issue #{issue_number}のタスク「{task_title}」を実行するのだ！" |
| 218-225 | Worktree spawning | ❌ Silent | "5つのWorktreeを生成中なのだ！各世界で異なるパラメータで実行するのだ！" |
| 228-234 | Parallel/Sequential decision | ❌ Silent | "並列実行モードなのだ！全ての世界を同時に実行するのだ！" OR "順次実行モードなのだ！1つずつ実行するのだ！" |
| 327-333 | Dynamic scaling applied | ❌ Silent | "動的スケーリング適用なのだ！システムリソースを確認して、最大{max_concurrency}個の並行実行を許可するのだ！" |
| 382-392 | World execution status | ❌ Silent | "World {world_id}実行中なのだ！開始時刻：{started_at}、ステータス：{status}なのだ！" |
| 410-424 | Timeout monitoring | ❌ Silent | "タイムアウト監視中なのだ！制限時間30分以内に完了予定なのだ！" |
| 240-264 | Winner selection & cleanup | ❌ Silent | "Winner決定なのだ！World {winner_id}が最高スコアで勝利したのだ！負けた世界のWorktreeをクリーンアップ中なのだ！" |
| 266-287 | Execution summary | ❌ Silent | "5-Worlds実行完了なのだ！実行時間：{duration_ms}ms、成功：{successful_count}個、失敗：{failed_count}個なのだ！" |
| 276-283 | Winner details | ❌ Silent | "勝者はWorld {winner}なのだ！スコア：{score}点、内訳：{breakdown}なのだ！" |
| 606-617 | Cost estimation | ❌ Silent | "この実行にかかったコストは${cost_usd}なのだ！モデル：{model}、実行時間：{duration_min}分なのだ！" |

**Impact**: ⚠️ **CRITICAL** - Users have NO VISIBILITY into the most complex part of the system.

---

### Gap 2: Circuit Breaker State Changes

**File**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 148-153 | Circuit breakers initialized | ❌ Silent | "サーキットブレーカーを初期化したのだ！全ての世界に対して障害保護が有効なのだ！" |
| 340-369 | Circuit breaker open (skip world) | ❌ Silent | "World {world_id}のサーキットブレーカーが開いているのだ！最近の失敗が多すぎるから、今回の実行をスキップするのだ！" |
| 402-427 | Executing through circuit breaker | ❌ Silent | "サーキットブレーカー経由で実行中なのだ！障害を検知したら自動的に停止するのだ！" |
| 429-432 | Circuit breaker triggered | ❌ Silent | "サーキットブレーカーが作動したのだ！実行が失敗したため、一時的にこの世界の実行を停止するのだ！" |

**Impact**: ⚠️ **HIGH** - Users don't understand why certain worlds are skipped.

---

### Gap 3: Dynamic Scaling Adjustments

**File**: `crates/miyabi-orchestrator/src/dynamic_scaling.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 75-99 | Scaler initialization | ❌ Silent | "動的スケーラーを初期化したのだ！初期並行数：{initial_limit}、最小：{min}、最大：{max}なのだ！" |
| 106-119 | Monitoring loop started | ❌ Silent | "リソース監視を開始するのだ！{monitor_interval}秒ごとにシステムリソースを確認するのだ！" |
| 131-143 | Scale up | ❌ Silent | "スケールアップなのだ！リソースに余裕があるから、並行実行数を{old_limit}から{new_limit}に増やすのだ！メモリ使用率：{memory_usage}%、CPU使用率：{cpu_usage}%なのだ！" |
| 145-157 | Scale down | ❌ Silent | "スケールダウンなのだ！リソース不足が検知されたから、並行実行数を{old_limit}から{new_limit}に減らすのだ！メモリ使用率：{memory_usage}%、CPU使用率：{cpu_usage}%なのだ！" |
| 158-164 | No scaling needed | ❌ Silent (debug only) | "スケーリング不要なのだ！現在の並行数：{limit}、メモリ：{memory_usage}%、CPU：{cpu_usage}%で安定しているのだ！" |
| 211-239 | Resource stats collection | ❌ Silent | "リソース統計を収集したのだ！メモリ使用率：{memory_usage_ratio}、CPU使用率：{cpu_usage_ratio}、利用可能Worktree数：{available_worktrees}、ボトルネック：{bottleneck_resource}なのだ！" |

**Impact**: ⚠️ **HIGH** - Users don't understand performance adjustments.

---

### Gap 4: Goal Management & Feedback Loops

**File**: `crates/miyabi-orchestrator/src/feedback/goal_manager.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 63-75 | Goal creation | ❌ Silent | "新しいゴール「{id}」を作成したのだ！説明：{description}なのだ！" |
| 92-97 | Goal status update | ❌ Silent | "ゴール「{id}」のステータスを{status}に更新したのだ！進捗を管理するのだ！" |
| 100-104 | Iteration increment | ❌ Silent | "ゴール「{id}」の反復回数を{iteration}に更新したのだ！継続的に改善中なのだ！" |
| 107-112 | Goal refinement | ❌ Silent | "ゴール「{id}」を改善するのだ！フィードバック：{feedback}に基づいて目標を調整するのだ！" |
| 115-124 | Criterion set | ❌ Silent | "ゴール「{id}」の基準「{key}」を{value}に設定したのだ！達成条件を明確化するのだ！" |

**Impact**: ⚠️ **MEDIUM** - Users don't see goal evolution.

---

### Gap 5: Infinite Loop Orchestration

**File**: `crates/miyabi-orchestrator/src/feedback/infinite_loop.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 91-118 | Feedback loop start | ❌ Silent | "フィードバックループを開始するのだ！ゴール「{goal_id}」に対して最大{max_iterations}回の反復を実行するのだ！" |
| 123-130 | Max iterations reached | ❌ Silent | "最大反復回数{max}に到達したのだ！ゴール「{goal_id}」の実行を終了するのだ！" |
| 133-139 | Iteration success | ❌ Silent | "反復{iteration}成功なのだ！スコア：{score}、フィードバック：{feedback}を記録したのだ！" |
| 142-155 | Convergence detected | ❌ Silent | "収束検知なのだ！反復{iteration}で収束を検出したのだ！これ以上の改善は見込めないから、ゴール「{goal_id}」を完了するのだ！分散：{variance}が閾値{threshold}を下回ったのだ！" |
| 157-175 | Consecutive failures | ❌ Silent | "連続失敗{consecutive_failures}回なのだ！あと{remaining}回失敗したら、ゴール「{goal_id}」の実行を中止するのだ！エラー：{error}なのだ！" |
| 168-174 | Max retries exceeded | ❌ Silent | "最大リトライ回数を超えたのだ！ゴール「{goal_id}」の実行を失敗として終了するのだ！" |
| 179-181 | Iteration delay | ❌ Silent | "次の反復まで{iteration_delay_ms}ミリ秒待機するのだ！システムを休ませるのだ！" |
| 184-196 | Loop completion | ❌ Silent | "フィードバックループ完了なのだ！ゴール「{goal_id}」：反復回数{iterations}、ステータス：{status}、総実行時間：{total_duration_ms}ms、収束メトリクス：{convergence_metrics}なのだ！" |

**Impact**: ⚠️ **HIGH** - Users don't see iterative improvement process.

---

### Gap 6: Retry Logic & Error Recovery

**File**: `crates/miyabi-orchestrator/src/feedback/infinite_loop.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 200-230 | Retry attempt | ❌ Silent | "リトライ中なのだ！反復{iteration}の試行{attempts}回目なのだ！あと{remaining}回試せるのだ！エラー：{error}は再試行可能なのだ！" |
| 212-220 | Retryable error detected | ❌ Silent | "再試行可能なエラーを検知したのだ！1秒待機してから再実行するのだ！エラー：{error}なのだ！" |
| 223-227 | Max retries exceeded | ❌ Silent | "最大リトライ回数{max_retries}を超えたのだ！反復{iteration}を失敗として扱うのだ！" |

**Impact**: ⚠️ **MEDIUM** - Users don't understand retry behavior.

---

### Gap 7: Auto-Refinement Triggers

**File**: `crates/miyabi-orchestrator/src/feedback/infinite_loop.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 254-259 | Auto-refinement triggered | ❌ Silent | "自動改善を実行するのだ！スコア{score}が目標85点を下回ったから、ゴール「{goal_id}」を自動調整するのだ！反復{iteration}の結果を元に改善するのだ！" |

**Impact**: ⚠️ **MEDIUM** - Users don't see automatic adjustments.

---

### Gap 8: Convergence Analysis

**File**: `crates/miyabi-orchestrator/src/feedback/infinite_loop.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 273-292 | Convergence check | ❌ Silent (debug only) | "収束チェック中なのだ！直近{n}回の反復の分散を計算するのだ！平均：{mean}、分散：{variance}、閾値：{threshold}なのだ！" |
| 291 | Convergence threshold comparison | ❌ Silent (debug only) | "分散{variance}が閾値{threshold}を{result}しているのだ！{converged}と判定するのだ！" |

**Impact**: ⚠️ **LOW** - Advanced users may want this detail.

---

### Gap 9: Worktree Lifecycle Events

**File**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 218-225 | All worktrees spawned | ❌ Silent | "全ての5つのWorktreeを生成完了したのだ！各世界が独立して実行できる状態になったのだ！" |
| 240-253 | Cleanup losing worlds | ❌ Silent | "敗者Worktreeのクリーンアップ中なのだ！World {world_id}を削除するのだ！Winner {winner_id}のWorktreeだけを保持するのだ！" |
| 256-263 | Cleanup all worlds (no winner) | ❌ Silent | "勝者なしなのだ…全てのWorktreeをクリーンアップするのだ…全ての世界が失敗したのだ…" |

**Impact**: ⚠️ **MEDIUM** - Users don't see resource cleanup.

---

### Gap 10: Score Calculation & Evaluation

**File**: `crates/miyabi-orchestrator/src/five_worlds_executor.rs`

**Missing Narration Points**:

| Line | Event | Current State | Required Narration |
|------|-------|---------------|-------------------|
| 620-644 | Review result to evaluation score | ❌ Silent | "ReviewAgentの結果を評価スコアに変換するのだ！ビルド成功：{build_success}、テスト：{tests_passed}/{tests_total}、Clippy警告：{clippy_warnings}個、コード品質：{code_quality}、セキュリティ：{security}なのだ！" |
| 705-706 | Evaluation score calculated | ❌ Silent | "評価スコア計算完了なのだ！総合スコア：{total}点なのだ！" |
| 646-651 | Clippy warnings calculation | ❌ Silent | "Clippy警告数を計算したのだ！スコア{clippy_score}から逆算すると、警告は{warnings}個なのだ！" |

**Impact**: ⚠️ **MEDIUM** - Users don't see quality metrics.

---

## 📊 Gap Summary

### By Severity

| Severity | Count | Examples |
|----------|-------|----------|
| 🚨 CRITICAL | 1 | 5-Worlds execution orchestration |
| ⚠️ HIGH | 3 | Circuit breakers, dynamic scaling, feedback loops |
| ⚠️ MEDIUM | 5 | Goal management, retry logic, auto-refinement, worktree lifecycle, score calculation |
| ⚠️ LOW | 1 | Convergence analysis (debug level) |

### By Module

| Module | Missing Narration Points | Coverage |
|--------|--------------------------|----------|
| `five_worlds_executor.rs` | 10 | 0% ❌ |
| `dynamic_scaling.rs` | 6 | 0% ❌ |
| `feedback/infinite_loop.rs` | 8 | 0% ❌ |
| `feedback/goal_manager.rs` | 5 | 0% ❌ |
| **Total** | **29 critical gaps** | **0% orchestrator coverage** ❌ |

### Tool-Level vs Orchestrator-Level

| Level | Coverage | Status |
|-------|----------|--------|
| Tool-Level (Read, Write, Edit, Bash, etc.) | 9/9 (100%) | ✅ Excellent |
| Agent-Level (completion, errors) | 2/2 (100%) | ✅ Good |
| Notification-Level (user alerts) | 5/5 (100%) | ✅ Excellent |
| **Orchestrator-Level (5-Worlds, scaling, loops)** | **0/29 (0%)** | ❌ **Critical Gap** |

---

## 🎯 Recommended Actions

### Priority 1: CRITICAL (Must Implement)

1. **Create `orchestrator-event.sh` hook** for 5-Worlds execution narration
   - Trigger points: execution start, world status, winner selection, cost tracking
   - Integration: Add `tracing` events in `five_worlds_executor.rs` that call the hook

2. **Create `circuit-breaker-event.sh` hook** for circuit breaker state changes
   - Trigger points: breaker open, breaker closed, execution skipped
   - Integration: Add hook calls in circuit breaker state transitions

### Priority 2: HIGH (Should Implement)

3. **Create `dynamic-scaling-event.sh` hook** for resource adjustments
   - Trigger points: scale up, scale down, resource stats
   - Integration: Add hook calls in `check_and_adjust()` method

4. **Create `feedback-loop-event.sh` hook** for iterative improvement visibility
   - Trigger points: loop start, iteration success/failure, convergence, max iterations
   - Integration: Add hook calls in `InfiniteLoopOrchestrator`

### Priority 3: MEDIUM (Nice to Have)

5. **Enhance `agent-event.sh`** to include VOICEVOX narration
   - Currently only sends HTTP POST
   - Should ALSO narrate events for immediate user feedback

6. **Add goal management narration** to provide context on goal evolution

7. **Add retry/error recovery narration** for transparency in failure handling

### Priority 4: LOW (Future Enhancement)

8. **Add convergence analysis narration** for advanced users

---

## 🔧 Implementation Strategy

### Phase 1: Hook Infrastructure (Week 1)

1. Create 4 new hook scripts:
   - `.claude/hooks/orchestrator-event.sh`
   - `.claude/hooks/circuit-breaker-event.sh`
   - `.claude/hooks/dynamic-scaling-event.sh`
   - `.claude/hooks/feedback-loop-event.sh`

2. Each hook should:
   - Accept event type and parameters via environment variables
   - Generate appropriate VOICEVOX narration (ずんだもん, Speaker ID 3)
   - Enqueue to VOICEVOX via `tools/voicevox_enqueue.sh`
   - Log events to hook log for debugging

### Phase 2: Orchestrator Integration (Week 2)

1. Add hook call infrastructure to orchestrator modules:
   - Utility function: `call_hook(event_type: &str, params: &HashMap<String, String>)`
   - Environment variable setup for hook communication

2. Insert hook calls at all 29 identified narration points

### Phase 3: Testing & Refinement (Week 3)

1. End-to-end testing with actual 5-Worlds execution
2. Verify narration timing (non-blocking, appropriate verbosity)
3. Collect user feedback on narration quality
4. Refine narration text for clarity and educational value

---

## 📝 Sample Hook Implementation

### Example: `orchestrator-event.sh`

```bash
#!/bin/bash
# VOICEVOX Orchestrator Event Narration Hook

set -euo pipefail

VOICEVOX_ENQUEUE="${VOICEVOX_ENQUEUE:-tools/voicevox_enqueue.sh}"
SPEAKER_ID="${VOICEVOX_SPEAKER:-3}"  # ずんだもん
SPEED="${VOICEVOX_SPEED:-1.1}"

EVENT_TYPE="${ORCHESTRATOR_EVENT_TYPE:-unknown}"
ISSUE_NUMBER="${ISSUE_NUMBER:-0}"
TASK_TITLE="${TASK_TITLE:-}"
WORLD_ID="${WORLD_ID:-}"
WINNER_ID="${WINNER_ID:-}"
SCORE="${SCORE:-0}"
DURATION_MS="${DURATION_MS:-0}"
COST_USD="${COST_USD:-0.0}"

generate_narration() {
    case "$EVENT_TYPE" in
        five_worlds_start)
            echo "5つの並行世界での実行を開始するのだ！Issue #${ISSUE_NUMBER}のタスク「${TASK_TITLE}」を、異なるパラメータで5回実行して、最高の結果を選ぶのだ！"
            ;;
        worktrees_spawned)
            echo "5つのWorktreeを生成完了したのだ！各世界が独立して実行できる状態になったのだ！"
            ;;
        winner_selected)
            echo "Winner決定なのだ！World ${WINNER_ID}が最高スコア${SCORE}点で勝利したのだ！"
            ;;
        execution_complete)
            local duration_sec=$((DURATION_MS / 1000))
            echo "5-Worlds実行完了なのだ！実行時間：${duration_sec}秒、コスト：${COST_USD}ドルなのだ！"
            ;;
        *)
            echo "オーケストレーターイベント：${EVENT_TYPE}なのだ！"
            ;;
    esac
}

NARRATION=$(generate_narration)

if [ -f "$VOICEVOX_ENQUEUE" ]; then
    "$VOICEVOX_ENQUEUE" "$NARRATION" "$SPEAKER_ID" "$SPEED" > /dev/null 2>&1 &
fi

exit 0
```

---

## 🎓 Educational Value

By implementing complete orchestrator narration, users will:

1. **Understand 5-Worlds Strategy**: Learn how parallel execution with different parameters produces better results
2. **Learn Resource Management**: See how dynamic scaling optimizes performance
3. **Grasp Failure Handling**: Understand circuit breakers and retry logic
4. **Observe Iterative Improvement**: Watch feedback loops converge to optimal solutions
5. **Track Costs**: Become aware of computational costs for different models

**Educational Principle**: "プログラムの挙動を全て音声で伝えることで、初心者でもシステムの動作を理解できる"

---

## 🔍 Conclusion

**Current State**: Miyabi has **excellent tool-level narration** but **zero orchestrator-level narration**, creating a critical transparency gap.

**Required State**: **100% behavior transparency** at ALL levels (tools, agents, orchestration) to achieve "perfect agent control".

**Action Required**: Implement **29 missing narration points** across 4 new hooks to complete the transparency architecture.

**Estimated Effort**: 3 weeks (1 week per phase)

**Business Impact**: ⚠️ **CRITICAL** - Core value proposition ("perfect agent control") is **incomplete** without orchestrator transparency.

---

**Document Owner**: Miyabi Core Team
**Review Cycle**: Every sprint
**Next Review**: 2025-11-02
