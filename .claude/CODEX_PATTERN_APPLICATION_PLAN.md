# Codex設計パターン適用計画

**作成日**: 2025-10-15
**参照**: `.claude/CODEX_DESIGN_PATTERNS.md`
**目的**: Codexの優れた設計パターンを段階的にMiyabiプロジェクトに適用

---

## 📋 実施サマリー

**全体スコープ**: 6フェーズ、29タスク
**推定期間**: 2-3週間
**優先度**: 高（Rust移行Phase 3-4と並行実施推奨）

---

## 🎯 Phase別実施計画

### Phase 1: Edition 2024アップグレード（1-2時間）

**目的**: 最新のRust Edition 2024にアップグレード

**タスク**:
1. [ ] `Cargo.toml` - workspace.package.edition更新
2. [ ] `rust-toolchain.toml` - stable 1.85+確認
3. [ ] 全cratesのビルド確認
4. [ ] Breaking changes対応

**実施内容**:
```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml

[workspace.package]
version = "0.1.0"
edition = "2024"  # 2021 → 2024
```

```toml
# /Users/shunsuke/Dev/miyabi-private/rust-toolchain.toml (新規作成)

[toolchain]
channel = "stable"
```

**検証**:
```bash
cargo build --all
cargo test --all
cargo clippy --all -- -D warnings
```

**期待される効果**:
- より厳格な型チェック
- 新しい標準ライブラリ機能の利用
- 将来の互換性確保

**リスク**: 低（Edition 2024はほぼ後方互換）

---

### Phase 2: workspace.lints設定（2-3時間）

**目的**: Codexレベルの厳格なLints設定を追加

**タスク**:
1. [ ] workspace.lints.clippyセクション追加（32ルール）
2. [ ] 各crateのlib.rsにlints追加
3. [ ] 既存コードのlint違反修正
4. [ ] CI/CDに `cargo clippy -- -D warnings` 追加

**実施内容**:
```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml

[workspace.lints]
rust = {}

[workspace.lints.clippy]
# エラーハンドリング
expect_used = "deny"
unwrap_used = "deny"

# 出力制御
print_stdout = "deny"
print_stderr = "deny"

# Manual implementations (prefer idiomatic Rust)
manual_clamp = "deny"
manual_filter = "deny"
manual_find = "deny"
manual_flatten = "deny"
manual_map = "deny"
manual_ok_or = "deny"
manual_retain = "deny"
manual_strip = "deny"
manual_unwrap_or = "deny"

# Needless code
needless_borrow = "deny"
needless_collect = "deny"
needless_late_init = "deny"
needless_question_mark = "deny"
needless_update = "deny"

# Redundancy
redundant_clone = "deny"
redundant_closure = "deny"
redundant_closure_for_method_calls = "deny"
redundant_static_lifetimes = "deny"

# Performance
trivially_copy_pass_by_ref = "deny"
uninlined_format_args = "deny"
unnecessary_filter_map = "deny"
unnecessary_lazy_evaluations = "deny"
unnecessary_sort_by = "deny"
unnecessary_to_owned = "deny"
```

**各crateのlib.rs**:
```rust
// crates/miyabi-types/src/lib.rs
#![deny(clippy::print_stdout, clippy::print_stderr)]
#![deny(clippy::expect_used, clippy::unwrap_used)]

// 既存のコード...
```

**例外的なexpect使用**:
```rust
// Serializeが保証されている場合のみ
#[expect(clippy::expect_used)]
serde_json::to_string(&result).expect("AgentResult serialization cannot fail")
```

**検証**:
```bash
cargo clippy --all -- -D warnings
```

**期待される効果**:
- unwrap/expect禁止によるパニック防止
- より安全なエラーハンドリング
- コード品質の向上

**推定違反数**: 50-100箇所（修正必要）
**修正時間**: 2-3時間

---

### Phase 3: profile.release最適化（30分）

**目的**: リリースビルドのパフォーマンス最適化

**タスク**:
1. [ ] profile.release設定追加
2. [ ] ベンチマーク実行（Before/After）
3. [ ] バイナリサイズ確認
4. [ ] ビルド時間計測

**実施内容**:
```toml
# /Users/shunsuke/Dev/miyabi-private/Cargo.toml

[profile.release]
lto = "fat"             # Link Time Optimization
codegen-units = 1       # 並列コンパイル無効化（最適化優先）
strip = "symbols"       # シンボル情報削除
opt-level = 3           # 最大最適化

[profile.release.package."*"]
opt-level = 3           # 依存cratesも最適化
```

**検証**:
```bash
# Before
cargo build --release
ls -lh target/release/miyabi
time cargo build --release

# After（設定追加後）
cargo clean
cargo build --release
ls -lh target/release/miyabi
time cargo build --release
```

**期待される効果**:
- 実行速度: +10-15%
- バイナリサイズ: -15-20%
- ビルド時間: +30-50%（トレードオフ）

**ベンチマーク目標** (RUST_MIGRATION_REQUIREMENTS.md参照):
- バイナリサイズ: 30MB以下
- ビルド時間: 3分以内
- Agent実行時間: 50%以上削減（TypeScript比較）

---

### Phase 4: テストインフラ整備（3-4時間）

**目的**: Snapshot testing + 統合テストインフラ構築

**タスク**:
1. [ ] insta (snapshot testing) 導入
2. [ ] pretty_assertions導入
3. [ ] tests/common/ヘルパー作成
4. [ ] tests/integration/統合テスト作成
5. [ ] CIにsnapshot確認追加

**実施内容**:

#### 4.1 依存関係追加
```toml
# crates/miyabi-agents/Cargo.toml

[dev-dependencies]
insta = { version = "1.43.2", features = ["json"] }
pretty_assertions = "1.4.1"
tokio-test = "0.4"
```

#### 4.2 ディレクトリ構造
```
crates/miyabi-agents/
├── src/
├── tests/
│   ├── common/
│   │   ├── mod.rs
│   │   ├── fixtures.rs         # テストデータ
│   │   └── github_mock.rs      # GitHub API mock
│   ├── unit/
│   │   ├── coordinator_test.rs
│   │   └── codegen_test.rs
│   ├── integration/
│   │   ├── worktree_test.rs
│   │   └── parallel_execution_test.rs
│   └── snapshots/               # instaが自動生成
│       ├── unit__coordinator_test__*.snap
│       └── integration__worktree_test__*.snap
└── Cargo.toml
```

#### 4.3 テスト例
```rust
// crates/miyabi-agents/tests/unit/codegen_test.rs
use insta::assert_json_snapshot;
use pretty_assertions::assert_eq;
use miyabi_agents::CodeGenAgent;

#[tokio::test]
async fn test_codegen_output_structure() {
    let agent = CodeGenAgent::new(config);
    let result = agent.execute(task, context).await.unwrap();

    // JSON構造をスナップショット比較
    assert_json_snapshot!(result, @r###"
    {
      "status": "success",
      "files_created": [
        "agents/new_agent.rs",
        "tests/new_agent_test.rs"
      ],
      "test_results": {
        "passed": 10,
        "failed": 0
      }
    }
    "###);
}

#[tokio::test]
async fn test_coordinator_task_decomposition() {
    let coordinator = CoordinatorAgent::new(config);
    let tasks = coordinator.decompose(issue).await.unwrap();

    // pretty_assertionsで詳細diff
    assert_eq!(tasks.len(), 3);
    assert_eq!(tasks[0].task_type, TaskType::CodeGeneration);
}
```

**検証**:
```bash
# テスト実行
cargo test -p miyabi-agents

# スナップショット確認
cargo insta pending-snapshots -p miyabi-agents

# スナップショット承認
cargo insta accept -p miyabi-agents
```

**期待される効果**:
- JSON出力の構造検証が容易
- リグレッション検出が自動化
- 統合テストの整備

**カバレッジ目標**: 80%以上

---

### Phase 5: 並列実行エンジン設計（1-2日）

**目的**: Codexのparallel.rsを参考に並列Agent実行エンジン作成

**タスク**:
1. [ ] crates/miyabi-agents/src/executor/mod.rs作成
2. [ ] crates/miyabi-agents/src/executor/parallel.rs作成
3. [ ] crates/miyabi-agents/src/executor/router.rs作成
4. [ ] 並列実行テスト作成
5. [ ] ベンチマーク実行

**ディレクトリ構造**:
```
crates/miyabi-agents/src/
├── lib.rs
├── base_agent.rs
├── coordinator.rs
├── codegen.rs
├── review.rs
└── executor/
    ├── mod.rs
    ├── parallel.rs    # ⭐ Codex参考
    └── router.rs
```

**実装例**:
```rust
// crates/miyabi-agents/src/executor/parallel.rs
use futures::stream::{FuturesUnordered, StreamExt};
use std::sync::Arc;
use miyabi_types::{Task, AgentResult, AgentContext, MiyabiError};
use crate::BaseAgent;

pub struct ParallelExecutor {
    max_concurrency: usize,
}

impl ParallelExecutor {
    pub fn new(max_concurrency: usize) -> Self {
        Self { max_concurrency }
    }

    pub async fn execute_agents<A: BaseAgent>(
        &self,
        agents: Vec<Arc<A>>,
        tasks: Vec<Task>,
        context: Arc<AgentContext>,
    ) -> Result<Vec<AgentResult>, MiyabiError> {
        let mut futures = FuturesUnordered::new();
        let mut results = Vec::new();

        for (agent, task) in agents.iter().zip(tasks.iter()) {
            let agent_clone = Arc::clone(agent);
            let task_clone = task.clone();
            let context_clone = Arc::clone(&context);

            futures.push(async move {
                agent_clone.execute(task_clone, context_clone).await
            });

            // 並列数制限に達したら1つ完了を待つ
            if futures.len() >= self.max_concurrency {
                if let Some(result) = futures.next().await {
                    results.push(result?);
                }
            }
        }

        // 残りの全タスク完了を待つ
        while let Some(result) = futures.next().await {
            results.push(result?);
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_parallel_execution_respects_concurrency() {
        let executor = ParallelExecutor::new(3);
        // テスト実装...
    }
}
```

**検証**:
```bash
cargo test -p miyabi-agents executor::parallel
```

**期待される効果**:
- 並列Agent実行の効率化
- concurrency制限による安定性
- Codex実績のあるパターン適用

**ベンチマーク目標**:
- 3並列実行: 50%時間削減
- 5並列実行: 70%時間削減

---

### Phase 6: コーディング規約文書化（2-3時間）

**目的**: Codex準拠のコーディング規約を文書化

**タスク**:
1. [ ] `.claude/CODING_STANDARDS.md`作成
2. [ ] `justfile`または`Makefile`作成
3. [ ] CI/CDに規約チェック追加
4. [ ] 既存コードのリファクタリング

**実施内容**:

#### 6.1 CODING_STANDARDS.md作成
```markdown
# Miyabi Rust コーディング規約

**参照**: Codex (https://github.com/ShunsukeHayashi/codex.git)

## 必須ルール

### 1. format!のインライン変数
```rust
// ✅ Good
format!("Error: {error}")

// ❌ Bad
format!("Error: {}", error)
```

### 2. if文の折りたたみ
```rust
// ✅ Good
if condition1 && condition2 {
    // ...
}

// ❌ Bad
if condition1 {
    if condition2 {
        // ...
    }
}
```

### 3. メソッド参照
```rust
// ✅ Good
items.iter().map(Item::process)

// ❌ Bad
items.iter().map(|item| item.process())
```

### 4. unwrap/expect禁止
```rust
// ✅ Good
let value = result?;

// ❌ Bad
let value = result.unwrap();

// 例外（コンパイラ保証がある場合のみ）
#[expect(clippy::expect_used)]
serde_json::to_string(&data).expect("serialization cannot fail")
```

### 5. stdout/stderr直接書き込み禁止
```rust
// ✅ Good
tracing::info!("Processing task: {task_id}");

// ❌ Bad
println!("Processing task: {task_id}");
```

## フォーマット・Lint

```bash
# 自動フォーマット（常に実行）
cargo fmt --all

# Lint確認
cargo clippy --all -- -D warnings

# テスト実行
cargo test --all

# 全チェック
cargo fmt --all && cargo clippy --all -- -D warnings && cargo test --all
```
```

#### 6.2 justfile作成
```makefile
# /Users/shunsuke/Dev/miyabi-private/justfile

# Format all code
fmt:
    cargo fmt --all

# Run clippy lints
clippy:
    cargo clippy --all -- -D warnings

# Run tests
test:
    cargo test --all

# Fix lints for specific package
fix package:
    cargo clippy --fix -p {{package}} --allow-dirty

# Run all checks
check: fmt clippy test

# Build release binary
release:
    cargo build --release

# Clean build artifacts
clean:
    cargo clean
```

**使用例**:
```bash
# インストール
cargo install just

# 実行
just fmt
just clippy
just test
just check
just fix miyabi-agents
```

**検証**:
```bash
just check
```

**期待される効果**:
- 一貫したコーディングスタイル
- CI/CDでの自動チェック
- 開発者オンボーディングの簡素化

---

## 📊 実施優先度マトリクス

| Phase | 優先度 | 工数 | 影響度 | 依存関係 |
|-------|--------|------|--------|----------|
| Phase 1: Edition 2024 | 🔴 高 | 1-2h | 中 | なし |
| Phase 2: Lints設定 | 🔴 高 | 2-3h | 高 | Phase 1 |
| Phase 3: Release最適化 | 🟡 中 | 30m | 中 | Phase 1 |
| Phase 4: テストインフラ | 🔴 高 | 3-4h | 高 | なし |
| Phase 5: 並列実行エンジン | 🟡 中 | 1-2日 | 高 | Phase 2,4 |
| Phase 6: コーディング規約 | 🟢 低 | 2-3h | 中 | なし |

**推奨実施順序**:
1. Phase 1 + Phase 3（基盤整備）
2. Phase 2 + Phase 4（品質向上）
3. Phase 6（文書化）
4. Phase 5（並列実行エンジン）

---

## ✅ 全体チェックリスト

### Phase 1: Edition 2024アップグレード
- [ ] Cargo.toml - edition = "2024"
- [ ] rust-toolchain.toml作成
- [ ] cargo build --all 成功
- [ ] cargo test --all 成功

### Phase 2: workspace.lints設定
- [ ] workspace.lints.clippy追加（32ルール）
- [ ] 各crate lib.rsにlints追加
- [ ] cargo clippy --all -- -D warnings 成功
- [ ] 既存違反修正完了

### Phase 3: profile.release最適化
- [ ] profile.release設定追加
- [ ] ベンチマーク実行（Before/After）
- [ ] バイナリサイズ30MB以下達成
- [ ] ビルド時間3分以内確認

### Phase 4: テストインフラ整備
- [ ] insta導入
- [ ] pretty_assertions導入
- [ ] tests/common/作成
- [ ] tests/integration/作成
- [ ] カバレッジ80%以上達成

### Phase 5: 並列実行エンジン設計
- [ ] executor/parallel.rs作成
- [ ] executor/router.rs作成
- [ ] 並列実行テスト作成
- [ ] ベンチマーク50%削減達成

### Phase 6: コーディング規約文書化
- [ ] CODING_STANDARDS.md作成
- [ ] justfile作成
- [ ] CI/CDに規約チェック追加
- [ ] 既存コードリファクタリング

---

## 🚀 次のアクション

### 即座に実施可能
1. **Phase 1開始**: Edition 2024アップグレード（1-2時間）
2. **Phase 3開始**: Release最適化設定（30分）

### 準備が必要
3. **Phase 2開始**: Lints設定（既存コード修正含む2-3時間）
4. **Phase 4開始**: テストインフラ整備（3-4時間）

### 長期タスク
5. **Phase 5開始**: 並列実行エンジン設計（1-2日）
6. **Phase 6開始**: コーディング規約文書化（2-3時間）

---

## 🔗 関連ドキュメント

- **CODEX_DESIGN_PATTERNS.md**: Codex設計パターン詳細分析
- **RUST_MIGRATION_REQUIREMENTS.md**: Rust移行要件定義
- **RUST_MIGRATION_SPRINT_PLAN.md**: 全力スプリント計画
- **Codexリポジトリ**: https://github.com/ShunsukeHayashi/codex.git

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0
**次回レビュー**: Phase 1-3完了時
