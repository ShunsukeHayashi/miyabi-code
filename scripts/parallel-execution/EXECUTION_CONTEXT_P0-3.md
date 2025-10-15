# P0-3: CodeGenAgent Worktree統合 - Execution Context

**タスクID**: P0-3
**見積もり**: 6時間
**優先度**: P0 (最高)
**Worktree**: `.worktrees/p0-3-worktree`
**ブランチ**: `feat/p0-3-worktree-integration`

---

## 🎯 タスク概要

CodeGenAgentにWorktree機能を統合し、Issue単位で独立したWorktreeを作成・管理できるようにする。

**目標**:
- ✅ WorktreeManagerクレート統合
- ✅ Worktree作成・削除・切り替え機能実装
- ✅ CodeGenAgent::execute()でWorktree利用
- ✅ テスト作成 (3+テスト)

---

## 📂 対象ファイル

### 主要実装ファイル
- `crates/miyabi-agents/src/codegen.rs` - CodeGenAgent実装
- `crates/miyabi-worktree/src/manager.rs` - WorktreeManager (既存)
- `crates/miyabi-worktree/src/lib.rs` - Worktreeクレートエントリポイント

### テストファイル
- `crates/miyabi-agents/src/codegen.rs` - 単体テスト (#[cfg(test)])
- `crates/miyabi-agents/tests/worktree_integration.rs` - 統合テスト (新規)

---

## 📋 実装手順

### Step 1: WorktreeManager統合 (2h)

`crates/miyabi-agents/src/codegen.rs`に追加:

```rust
use miyabi_worktree::WorktreeManager;

impl CodeGenAgent {
    /// Setup Worktree for task execution
    async fn setup_worktree(&self, task: &Task) -> Result<PathBuf> {
        let worktree_base = self.config.worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        let manager = WorktreeManager::new(&worktree_base)?;

        // Worktree作成 (branch: task-{task_id})
        let branch_name = format!("task-{}", task.id);
        let worktree_path = manager.create_worktree(&branch_name).await?;

        tracing::info!("Created worktree for task {} at {:?}", task.id, worktree_path);

        Ok(worktree_path)
    }

    /// Cleanup Worktree after task completion
    async fn cleanup_worktree(&self, task: &Task) -> Result<()> {
        let worktree_base = self.config.worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        let manager = WorktreeManager::new(&worktree_base)?;

        let branch_name = format!("task-{}", task.id);
        manager.remove_worktree(&branch_name).await?;

        tracing::info!("Removed worktree for task {}", task.id);

        Ok(())
    }
}
```

### Step 2: execute()メソッド更新 (2h)

Worktreeセットアップ → コード生成 → クリーンアップのフロー実装:

```rust
async fn execute(&self, task: &Task) -> Result<AgentResult> {
    let start_time = chrono::Utc::now();

    // Validate task type
    self.validate_task_type(task)?;

    // Setup Worktree
    let worktree_path = if self.config.use_worktree {
        Some(self.setup_worktree(task).await?)
    } else {
        None
    };

    // Generate code (in worktree if enabled)
    let result = self.generate_code(task, worktree_path.as_ref()).await?;

    // Cleanup Worktree
    if self.config.use_worktree {
        self.cleanup_worktree(task).await?;
    }

    let end_time = chrono::Utc::now();
    let duration_ms = (end_time - start_time).num_milliseconds() as u64;

    // Create metrics
    let metrics = AgentMetrics {
        task_id: task.id.clone(),
        agent_type: AgentType::CodeGenAgent,
        duration_ms,
        quality_score: None,
        lines_changed: Some(result.lines_added + result.lines_removed),
        tests_added: Some(result.tests_added),
        coverage_percent: None,
        errors_found: None,
        timestamp: end_time,
    };

    Ok(AgentResult {
        status: ResultStatus::Success,
        data: Some(serde_json::to_value(result)?),
        error: None,
        metrics: Some(metrics),
        escalation: None,
    })
}
```

### Step 3: テスト実装 (2h)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[tokio::test]
    async fn test_setup_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;
        config.worktree_base_path = Some(".worktrees/test".to_string());

        let agent = CodeGenAgent::new(config);
        let task = create_test_task("task-123");

        let worktree_path = agent.setup_worktree(&task).await.unwrap();

        assert!(worktree_path.exists());
        assert!(worktree_path.to_str().unwrap().contains("task-123"));

        // Cleanup
        agent.cleanup_worktree(&task).await.unwrap();
        assert!(!worktree_path.exists());
    }

    #[tokio::test]
    async fn test_execute_with_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;

        let agent = CodeGenAgent::new(config);
        let task = create_test_task("task-456");

        let result = agent.execute(&task).await;

        assert!(result.is_ok());
        let agent_result = result.unwrap();
        assert_eq!(agent_result.status, ResultStatus::Success);
    }

    #[tokio::test]
    async fn test_cleanup_worktree_on_error() {
        // エラー時のWorktreeクリーンアップをテスト
        let mut config = create_test_config();
        config.use_worktree = true;

        let agent = CodeGenAgent::new(config);
        let task = create_invalid_task(); // 意図的に失敗させる

        let result = agent.execute(&task).await;

        assert!(result.is_err());
        // Worktreeがクリーンアップされていることを確認
        // (実装に応じて検証ロジックを追加)
    }
}
```

---

## ✅ 完成基準

1. **機能実装**:
   - ✅ `setup_worktree()` メソッド実装
   - ✅ `cleanup_worktree()` メソッド実装
   - ✅ `execute()` メソッドでWorktree使用

2. **テスト**:
   - ✅ 3+テストケース作成
   - ✅ 全テストパス (`cargo test --package miyabi-agents`)
   - ✅ Clippy警告0件 (`cargo clippy`)

3. **ドキュメント**:
   - ✅ Rustdocコメント追加 (各public関数)
   - ✅ 使用例をコメントに記載

---

## 📊 想定される出力

**実行例**:
```bash
$ cargo test --package miyabi-agents

running 7 tests
test codegen::tests::test_codegen_agent_creation ... ok
test codegen::tests::test_generate_code ... ok
test codegen::tests::test_execute ... ok
test codegen::tests::test_invalid_task_type ... ok
test codegen::tests::test_setup_worktree ... ok
test codegen::tests::test_execute_with_worktree ... ok
test codegen::tests::test_cleanup_worktree_on_error ... ok

test result: ok. 7 passed; 0 failed
```

**Clippy**:
```bash
$ cargo clippy --package miyabi-agents -- -D warnings

Checking miyabi-agents v0.1.0
    Finished dev [unoptimized + debuginfo] target(s) in 0.5s
```

---

## 🔗 依存関係

**使用クレート**:
- `miyabi-worktree` - Worktree管理 (既存)
- `miyabi-types` - Task, AgentResult等
- `tokio` - 非同期実行
- `tracing` - ログ

**前提条件**:
- ✅ miyabi-worktreeクレート実装済み
- ✅ WorktreeManager::create_worktree() 動作確認済み

**ブロック要因**:
- なし (完全独立タスク)

---

## 🚀 次のタスク (Level 1)

P0-3完了後、以下のタスクが実行可能になります:

- **P0-4: CodeGenAgent Claude Code統合** (12h) - Worktree内でClaude Code実行

---

🦀 **Rust 2021 Edition - Worktree Integration**
