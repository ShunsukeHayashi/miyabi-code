---
description: プロジェクト全体のテストを実行
---

# テスト実行

プロジェクト全体のRustコンパイル確認とテストスイートを実行します。

## 実行内容

1. **Rust型チェック・コンパイル確認**
   ```bash
   cargo check --all
   cargo clippy --all-targets
   ```
   - Rust 2021 Edition準拠
   - 全クレート検証（8クレート）
   - エラー・警告0件が目標

2. **cargo testスイート**
   ```bash
   cargo test --all
   ```
   - CoordinatorAgentテスト
   - DAG構築テスト
   - 循環依存検出テスト
   - Worktree管理テスト

## 期待される結果

✅ **cargo check**: エラー0件
✅ **cargo clippy**: 警告0件
✅ **Tests**: 36/36 passing
✅ **Duration**: <5秒

## テスト対象

- `crates/miyabi-agents/src/coordinator.rs #[cfg(test)] mod tests`
  - Task decomposition
  - DAG construction
  - Circular dependency detection
  - Agent assignment
  - Execution plan

- `crates/miyabi-worktree/src/manager.rs #[cfg(test)] mod tests`
  - Worktree creation
  - Concurrency control
  - Telemetry tracking

## カバレッジ確認

```bash
# tarpaulinを使用（要インストール: cargo install cargo-tarpaulin）
cargo tarpaulin --all

# またはllvm-covを使用
cargo llvm-cov
```

## 失敗時の対処

### コンパイルエラー
```bash
# エラー詳細確認
cargo check --all --verbose

# 型定義確認
cat crates/miyabi-types/src/task.rs
```

### テスト失敗
```bash
# 詳細モードで実行
cargo test --all -- --nocapture

# 特定のクレートのみ
cargo test -p miyabi-agents

# 特定のテストのみ
cargo test -p miyabi-agents test_coordinator
```

## CI/CD統合

GitHub Actionsで自動実行されます：

```yaml
- name: Run Rust compilation check
  run: cargo check --all

- name: Run Clippy
  run: cargo clippy --all-targets -- -D warnings

- name: Run tests
  run: cargo test --all
```

---

実行完了後、全テストが合格していることを確認してください。
