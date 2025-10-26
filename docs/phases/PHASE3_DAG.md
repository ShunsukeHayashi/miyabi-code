# Phase 3: コア型定義移植 - タスクDAG

**しきるん（CoordinatorAgent）によるタスク分解結果**

## 📊 DAG構造

```
Level 0 (並列実行可能):
├─ Task 3.1: agent.rs単体テスト
├─ Task 3.2: task.rs単体テスト
├─ Task 3.3: issue.rs単体テスト
├─ Task 3.4: quality.rs単体テスト
├─ Task 3.5: workflow.rs単体テスト
└─ Task 3.6: error.rs単体テスト

↓ (すべて完了後)

Level 1 (依存関係あり):
└─ Task 3.7: serdeシリアライゼーション検証
    └─ 依存: Task 3.1-3.6の完了

↓

Level 2 (並列実行可能):
├─ Task 3.8: Clippy警告解決
└─ Task 3.9: カバレッジ測定

```

## 🎯 タスク詳細

### Level 0: 単体テスト実装（6タスク - 並列実行可）

#### Task 3.1: agent.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/agent.rs` にテスト追加
  - AgentType, AgentStatus, Severity等のテスト
  - シリアライゼーション/デシリアライゼーションテスト
- **成功基準**: `cargo test -p miyabi-types agent` が通る

#### Task 3.2: task.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/task.rs` にテスト追加
  - Task, TaskDecomposition, TaskGroup等のテスト
- **成功基準**: `cargo test -p miyabi-types task` が通る

#### Task 3.3: issue.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/issue.rs` にテスト追加
  - Issue, IssueTraceLog, StateTransition等のテスト
- **成功基準**: `cargo test -p miyabi-types issue` が通る

#### Task 3.4: quality.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/quality.rs` にテスト追加
  - QualityReport, QualityIssue等のテスト
- **成功基準**: `cargo test -p miyabi-types quality` が通る

#### Task 3.5: workflow.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/workflow.rs` にテスト追加
  - DAG, ExecutionPlan, ProgressStatus等のテスト
- **成功基準**: `cargo test -p miyabi-types workflow` が通る

#### Task 3.6: error.rs単体テスト
- **推定時間**: 30分
- **担当Agent**: つくるん（CodeGenAgent）
- **成果物**:
  - `crates/miyabi-types/src/error.rs` にテスト追加
  - MiyabiError, AgentError, EscalationError等のテスト
- **成功基準**: `cargo test -p miyabi-types error` が通る

### Level 1: シリアライゼーション検証（1タスク）

#### Task 3.7: serdeシリアライゼーション検証
- **推定時間**: 20分
- **担当Agent**: つくるん（CodeGenAgent）
- **依存**: Task 3.1-3.6完了
- **成果物**:
  - `crates/miyabi-types/tests/serde_integration.rs` 作成
  - すべての型のJSON往復テスト
- **成功基準**: `cargo test --test serde_integration` が通る

### Level 2: 品質チェック（2タスク - 並列実行可）

#### Task 3.8: Clippy警告解決
- **推定時間**: 15分
- **担当Agent**: めだまん（ReviewAgent）
- **成果物**:
  - dead_code警告の修正（`#[allow(dead_code)]` or 使用箇所追加）
  - その他Clippy警告の解決
- **成功基準**: `cargo clippy -p miyabi-types -- -D warnings` が通る

#### Task 3.9: カバレッジ測定
- **推定時間**: 10分
- **担当Agent**: かぞえるん（AnalyticsAgent）
- **成果物**:
  - カバレッジレポート生成
  - カバレッジ率確認（目標: 80%+）
- **実行コマンド**:
  ```bash
  cargo install cargo-tarpaulin
  cargo tarpaulin -p miyabi-types --out Html --output-dir coverage
  ```
- **成功基準**: カバレッジ80%以上

## 📈 実行計画

### 🟢 並列実行フェーズ1（Level 0）
**推定時間**: 30分（最長タスクが基準）

同時実行可能（6タスク）:
```bash
# Terminal 1
cargo test -p miyabi-types agent

# Terminal 2
cargo test -p miyabi-types task

# Terminal 3
cargo test -p miyabi-types issue

# Terminal 4
cargo test -p miyabi-types quality

# Terminal 5
cargo test -p miyabi-types workflow

# Terminal 6
cargo test -p miyabi-types error
```

### 🔵 逐次実行フェーズ2（Level 1）
**推定時間**: 20分

```bash
cargo test --test serde_integration
```

### 🟢 並列実行フェーズ3（Level 2）
**推定時間**: 15分（最長タスクが基準）

```bash
# Terminal 1
cargo clippy -p miyabi-types -- -D warnings

# Terminal 2
cargo tarpaulin -p miyabi-types --out Html --output-dir coverage
```

## ⏱️ 総推定時間

- Level 0: 30分
- Level 1: 20分
- Level 2: 15分
- **合計**: 約65分（並列実行により最適化済み）

逐次実行の場合: 3時間（180分） → **並列実行により64%削減**

## ✅ Phase 3完了基準

- [ ] すべての単体テストが通る（`cargo test -p miyabi-types`）
- [ ] serdeシリアライゼーション検証が通る
- [ ] Clippy警告が0件
- [ ] カバレッジが80%以上
- [ ] ドキュメント生成が成功（`cargo doc -p miyabi-types --no-deps`）

---

**しきるん**: タスク分解完了！次は実行フェーズに移ります 👔✨
