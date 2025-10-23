# Plans for Issue #487

**Title**: [P2-001-1] miyabi-agents hooks.rs Unit Tests

**URL**: https://github.com/customer-cloud/miyabi-private/issues/487

---

## 📋 Summary

- **Total Tasks**: 4
- **Estimated Duration**: 60 minutes
- **Execution Levels**: 4
- **Has Cycles**: ✅ No

## 📝 Task Breakdown

### 1. Analyze requirements for #487

- **ID**: `task-487-analysis`
- **Type**: Docs
- **Assigned Agent**: IssueAgent
- **Priority**: 0
- **Estimated Duration**: 5 min

**Description**: Analyze issue requirements and create detailed specification

### 2. Implement solution for #487

- **ID**: `task-487-impl`
- **Type**: Refactor
- **Assigned Agent**: CodeGenAgent
- **Priority**: 1
- **Estimated Duration**: 30 min
- **Dependencies**: task-487-analysis

**Description**: ## 📋 タスク概要

**親Issue**: #451  
**タスクID**: P2-001-1  
**Phase**: Phase 2 - テストカバレッジ向上  
**優先度**: **P1 - High**  
**推定工数**: 2時間  
**担当Agent**: @codegen-agent

## 🎯 目的

`crates/miyabi-agents/src/hooks.rs` (31行) の Unit Tests を作成し、100%カバレッジを達成する。

---

## 🔍 現状分析

**現在のカバレッジ**: 0/31 lines (0%)

**対象ファイル**: `crates/miyabi-agents/src/hooks.rs`

**主要コンポーネント**:
- `AgentHook` trait - Agent実行前後のライフサイクルフック
- `HookedAgent<A>` - BaseAgent wrapper with hook support
- Built-in hooks:
  - `EnvironmentCheckHook` - 環境変数検証
  - `MetricsHook` - 実行メトリクス記録
  - `AuditLogHook` - `.ai/logs/` への実行ログ追記

---

## 📝 作業内容

### Phase 1: Test Setup (15分)

```rust
// crates/miyabi-agents/tests/hooks_test.rs
use miyabi_agents::{HookedAgent, AgentHook, MetricsHook, AuditLogHook};
use miyabi_agent_core::BaseAgent;
use miyabi_types::{AgentConfig, Task, AgentResult};
use async_trait::async_trait;
use tempfile::TempDir;

// Mock Agent for testing
struct MockAgent {
    execution_count: Arc<Mutex<usize>>,
}

#[async_trait]
impl BaseAgent for MockAgent {
    async fn execute(&self, task: &Task) -> Result<AgentResult, MiyabiError> {
        let mut count = self.execution_count.lock().unwrap();
        *count += 1;
        Ok(AgentResult::success(serde_json::json!({"executed": true})))
    }
}
```

### Phase 2: Hook Trait Tests (30分)

```rust
#[tokio::test]
async fn test_hook_lifecycle() {
    // Test on_pre_execute
    // Test on_post_execute
    // Test on_error
}

#[tokio::test]
async fn test_multiple_hooks_execution_order() {
    // Verify hooks execute in registration order
}
```

### Phase 3: Built-in Hooks Tests (45分)

```rust
#[tokio::test]
async fn test_environment_check_hook() {
    // Test with missing env vars
    // Test with present env vars
}

#[tokio::test]
async fn test_metrics_hook() {
    // Test metrics recording
    // Test tracing output
}

#[tokio::test]
async fn test_audit_log_hook() {
    let temp_dir = TempDir::new().unwrap();
    let log_path = temp_dir.path().join("logs");
    
    // Test log file creation
    // Test log entry format
    // Test concurrent writes
}
```

### Phase 4: HookedAgent Tests (30分)

```rust
#[tokio::test]
async fn test_hooked_agent_wrapper() {
    // Test agent wrapping
    // Test hook registration
    // Test execution with hooks
}

#[tokio::test]
async fn test_hook_error_handling() {
    // Test hook failure doesn't break agent execution
    // Test error propagation
}
```

---

## ✅ 完了条件

- [ ] `hooks.rs` カバレッジ 100% (31/31 lines)
- [ ] 全 public API にテスト
- [ ] エッジケースのテスト:
  - [ ] 空のフック登録
  - [ ] 複数フック同時実行
  - [ ] フックエラー時の挙動
  - [ ] 並行実行時の安全性
- [ ] `cargo test --package miyabi-agents --test hooks_test` 成功
- [ ] `cargo tarpaulin --package miyabi-agents --test hooks_test` で100%確認

---

## 📊 テスト計画

**テストファイル**: `crates/miyabi-agents/tests/hooks_test.rs`

**テストケース数**: 約15個

**カバレッジ目標**: 100% (31/31 lines)

---

## 🚀 実装手順

1. テストファイル作成: `tests/hooks_test.rs`
2. Mock Agent実装
3. Hook Trait テスト実装
4. Built-in Hooks テスト実装
5. HookedAgent Wrapper テスト実装
6. カバレッジ確認: `cargo tarpaulin --test hooks_test`
7. 全テスト実行: `cargo test --package miyabi-agents`

---

## 📚 参考資料

- **実装ファイル**: `crates/miyabi-agents/src/hooks.rs`
- **既存テスト**: `crates/miyabi-agents/tests/agent_integration.rs`
- **Codex Playbook**: `.codex/agents/hooks-playbook.md`

---

**作成日**: 2025-10-23  
**親Issue**: #451  
**推定工数**: 2時間

### 3. Add tests for #487

- **ID**: `task-487-test`
- **Type**: Test
- **Assigned Agent**: CodeGenAgent
- **Priority**: 2
- **Estimated Duration**: 15 min
- **Dependencies**: task-487-impl

**Description**: Create comprehensive test coverage

### 4. Review code quality for #487

- **ID**: `task-487-review`
- **Type**: Refactor
- **Assigned Agent**: ReviewAgent
- **Priority**: 3
- **Estimated Duration**: 10 min
- **Dependencies**: task-487-test

**Description**: Run quality checks and code review

## 🔄 Execution Plan (DAG Levels)

Tasks can be executed in parallel within each level:

### Level 0 (Parallel Execution)

- `task-487-analysis` - Analyze requirements for #487

### Level 1 (Parallel Execution)

- `task-487-impl` - Implement solution for #487

### Level 2 (Parallel Execution)

- `task-487-test` - Add tests for #487

### Level 3 (Parallel Execution)

- `task-487-review` - Review code quality for #487

## 📊 Dependency Graph

```mermaid
graph TD
    task_487_analysis["Analyze requirements for #487"]
    task_487_impl["Implement solution for #487"]
    task_487_test["Add tests for #487"]
    task_487_review["Review code quality for #487"]
    task_487_analysis --> task_487_impl
    task_487_impl --> task_487_test
    task_487_test --> task_487_review
```

## ⏱️ Timeline Estimation

- **Sequential Execution**: 60 minutes (1.0 hours)
- **Parallel Execution (Critical Path)**: 10 minutes (0.2 hours)
- **Estimated Speedup**: 6.0x

---

*Generated by CoordinatorAgent on 2025-10-23 06:44:13 UTC*
