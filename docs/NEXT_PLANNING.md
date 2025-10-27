# Next Planning - Phase 5-9実装 & Message Queue統合

**Created**: 2025-10-27
**Status**: 🎯 Ready to Execute
**Context**: Phase 1-4は90-95%完成。次はPhase 5-9実装 + Message Queue統合。

---

## 🎯 戦略的判断: 2つの並行トラック

### Track A: Message Queue統合（優先度: ⭐⭐⭐⭐⭐）
**理由**: 既に実装済み（16/16 tests PASS）だが未使用。即座に価値を発揮できる。

### Track B: Phase 5実装（優先度: ⭐⭐⭐⭐）
**理由**: Phase 1-4の自然な延長。アーキテクチャ設計済み。

---

## 📋 Track A: Message Queue統合（1-2時間）

### 目的
HeadlessOrchestratorにSessionManager Message Queueを統合し、Phase間通信を実現。

### 実装タスク

#### Task A1: HeadlessOrchestratorへの統合 ✅
**File**: `crates/miyabi-orchestrator/src/headless.rs`

```rust
pub struct HeadlessOrchestrator {
    // 既存フィールド
    github_client: Option<Arc<dyn GitHubClient>>,
    worktree_manager: Option<WorktreeManager>,
    agent_config: AgentConfig,
    config: HeadlessOrchestratorConfig,

    // 🆕 追加
    session_manager: Option<Arc<SessionManager>>,
}

impl HeadlessOrchestrator {
    pub async fn new(config: HeadlessOrchestratorConfig) -> Result<Self> {
        // SessionManager初期化
        let session_manager = if config.enable_message_queue {
            let temp_dir = std::env::temp_dir().join("miyabi-sessions");
            let manager = SessionManager::new(&temp_dir)
                .await?
                .with_message_queue(true)
                .await?;
            Some(Arc::new(manager))
        } else {
            None
        };

        Ok(Self {
            // ...
            session_manager,
        })
    }
}
```

#### Task A2: Phase完了時のメッセージ送信 ✅
**Priority**: High
**例**: Phase 1完了時

```rust
async fn run_phase_1_issue_analysis(&mut self, issue: &Issue) -> Result<IssueAnalysisResult> {
    // 既存実装
    let result = issue_agent.analyze_issue(issue).await?;

    // 🆕 メッセージ送信
    if let Some(ref manager) = self.session_manager {
        let msg = MessageBuilder::new(self.current_session_id)
            .priority(Priority::Normal)
            .message_type(MessageType::StatusUpdate(StatusUpdateMessage {
                phase: "Phase 1".to_string(),
                status: "completed".to_string(),
                progress: 11, // 1/9 phases
                details: Some(serde_json::json!({
                    "issue_number": issue.number,
                    "labels_count": result.labels.len(),
                })),
            }))
            .build()?;

        manager.send_message(msg).await?;
    }

    Ok(result)
}
```

#### Task A3: エラー発生時のUrgentメッセージ送信 ✅
**Priority**: Urgent
**例**: Phase 4 Code Generation失敗時

```rust
async fn run_phase_4_code_generation(&mut self, task: &Task) -> Result<CodeGenResult> {
    match code_gen_agent.execute_5_worlds(task).await {
        Ok(result) => Ok(result),
        Err(e) => {
            // 🆕 Urgentメッセージ送信
            if let Some(ref manager) = self.session_manager {
                let msg = MessageBuilder::new(self.current_session_id)
                    .priority(Priority::Urgent)
                    .message_type(MessageType::Error(ErrorMessage {
                        code: "CODE_GEN_FAILED".to_string(),
                        message: format!("Code generation failed: {}", e),
                        stack_trace: None,
                        context: Some(serde_json::json!({
                            "task_id": task.id,
                            "phase": "Phase 4",
                        })),
                    }))
                    .build()?;

                manager.send_message(msg).await?;
            }

            Err(e)
        }
    }
}
```

#### Task A4: Message受信ループの追加（オプション） ⭐
**Priority**: Low
**Note**: 現状はPhase実行がシーケンシャルなので、非同期受信ループは不要。将来的にParallel Execution時に実装。

```rust
// 将来的な実装例
async fn message_receiver_loop(&self, session_id: Uuid) {
    while let Ok(Some(msg)) = self.session_manager.as_ref().unwrap().receive_message(session_id).await {
        match msg.priority {
            Priority::Urgent => {
                // エラーハンドリング
                error!("Urgent message received: {:?}", msg);
            }
            Priority::High => {
                // 重要な状態更新
                warn!("High priority message: {:?}", msg);
            }
            _ => {
                // 通常ログ
                info!("Message received: {:?}", msg);
            }
        }
    }
}
```

#### Task A5: 統合テスト作成 ✅
**File**: `crates/miyabi-orchestrator/tests/message_queue_integration_test.rs`

```rust
#[tokio::test]
async fn test_message_queue_in_orchestrator() {
    let config = HeadlessOrchestratorConfig {
        enable_message_queue: true,
        ..Default::default()
    };

    let mut orchestrator = HeadlessOrchestrator::new(config).await.unwrap();
    let issue = create_test_issue(123, "Test", "Body");

    // Phase 1実行
    orchestrator.handle_issue_created(&issue).await.unwrap();

    // メッセージ確認
    let stats = orchestrator.get_queue_stats().await.unwrap();
    assert!(stats.total_enqueued > 0);
}
```

### 完了条件
- [ ] HeadlessOrchestratorにSessionManager統合
- [ ] Phase 1-4の各Phase完了時にStatusUpdateメッセージ送信
- [ ] エラー発生時にUrgentメッセージ送信
- [ ] 統合テスト5個追加（全PASS）
- [ ] `miyabi infinity --dry-run`実行時にメッセージキュー動作確認

---

## 📋 Track B: Phase 5実装（3-5時間）

### 目的
Code Review & Quality Checkフェーズを実装し、自動品質保証を実現。

### アーキテクチャ
**Reference**: `docs/PHASE5-9_ARCHITECTURE.md` (L101-160)

### 実装タスク

#### Task B1: QualityChecker構造体実装 ✅
**File**: `crates/miyabi-orchestrator/src/quality_checker.rs` (新規作成)

```rust
use anyhow::Result;
use std::path::PathBuf;
use tracing::{info, warn};

pub struct QualityChecker {
    worktree_path: PathBuf,
    min_quality_score: u8,
}

#[derive(Debug, Clone)]
pub struct QualityCheckResult {
    pub success: bool,
    pub quality_score: u8,
    pub clippy_warnings: usize,
    pub clippy_errors: usize,
    pub test_coverage: f64,
    pub lines_of_code: usize,
    pub cyclomatic_complexity: Option<f64>,
}

impl QualityChecker {
    pub fn new(worktree_path: PathBuf, min_quality_score: u8) -> Self {
        Self {
            worktree_path,
            min_quality_score,
        }
    }

    pub async fn check_quality(&self) -> Result<QualityCheckResult> {
        info!("🔍 Running quality checks in {}", self.worktree_path.display());

        // 1. Clippy実行
        let clippy_result = self.run_clippy().await?;

        // 2. テストカバレッジ計測（tarpaulin）
        let coverage = self.measure_coverage().await?;

        // 3. スコア計算
        let quality_score = self.calculate_score(&clippy_result, coverage);

        Ok(QualityCheckResult {
            success: quality_score >= self.min_quality_score,
            quality_score,
            clippy_warnings: clippy_result.warnings,
            clippy_errors: clippy_result.errors,
            test_coverage: coverage,
            lines_of_code: 0, // TODO
            cyclomatic_complexity: None, // TODO
        })
    }

    async fn run_clippy(&self) -> Result<ClippyResult> {
        // cargo clippy実行
        let output = tokio::process::Command::new("cargo")
            .args(&["clippy", "--all", "--", "-D", "warnings"])
            .current_dir(&self.worktree_path)
            .output()
            .await?;

        // stdout/stderrをパース
        // "warning: ..." と "error: ..." をカウント
        self.parse_clippy_output(output)
    }

    async fn measure_coverage(&self) -> Result<f64> {
        // cargo-tarpaulin実行（インストール済みの場合）
        // 未インストール時は80%を返す（仮値）
        Ok(80.0)
    }

    fn calculate_score(&self, clippy: &ClippyResult, coverage: f64) -> u8 {
        // スコア計算ロジック
        // - Clippy errors: -10点/個
        // - Clippy warnings: -2点/個
        // - Coverage < 80%: -20点

        let mut score = 100;
        score -= clippy.errors * 10;
        score -= clippy.warnings * 2;
        if coverage < 80.0 {
            score -= 20;
        }

        score.max(0).min(100) as u8
    }
}
```

#### Task B2: HeadlessOrchestratorへの統合 ✅
**File**: `crates/miyabi-orchestrator/src/headless.rs`

```rust
async fn run_phase_5_quality_check(
    &mut self,
    issue: &Issue,
    worktree: &WorktreeInfo,
    state_machine: &mut StateMachine,
) -> Result<QualityCheckResult> {
    info!("🔍 Phase 5: Quality Check for Issue #{}", issue.number);

    let checker = QualityChecker::new(
        worktree.path.clone(),
        self.config.auto_merge_quality_threshold,
    );

    let result = checker.check_quality().await?;

    if result.success {
        info!("✅ Quality check passed: {}%", result.quality_score);
        state_machine.transition_to(Phase::QualityCheck)?;

        // 🆕 メッセージ送信
        if let Some(ref manager) = self.session_manager {
            let msg = MessageBuilder::new(self.current_session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::StatusUpdate(StatusUpdateMessage {
                    phase: "Phase 5".to_string(),
                    status: "completed".to_string(),
                    progress: 55, // 5/9 phases
                    details: Some(serde_json::json!({
                        "quality_score": result.quality_score,
                        "clippy_warnings": result.clippy_warnings,
                    })),
                }))
                .build()?;
            manager.send_message(msg).await?;
        }
    } else {
        warn!("⚠️ Quality below threshold: {}%", result.quality_score);

        // 🆕 Urgentメッセージ送信
        if let Some(ref manager) = self.session_manager {
            let msg = MessageBuilder::new(self.current_session_id)
                .priority(Priority::Urgent)
                .message_type(MessageType::Error(ErrorMessage {
                    code: "QUALITY_CHECK_FAILED".to_string(),
                    message: format!("Quality score {}% < threshold {}%",
                        result.quality_score, self.config.auto_merge_quality_threshold),
                    stack_trace: None,
                    context: Some(serde_json::json!(result)),
                }))
                .build()?;
            manager.send_message(msg).await?;
        }

        // 自動修正トライ（最大3回）
        self.escalate_for_manual_review(issue, &result).await?;
    }

    Ok(result)
}
```

#### Task B3: Phase 5統合テスト作成 ✅
**File**: `crates/miyabi-orchestrator/tests/phase5_integration_test.rs`

```rust
#[tokio::test]
async fn test_phase5_quality_check_pass() {
    // テストプロジェクトでQuality Check実行
    // 品質スコア >= 閾値 → PASS
}

#[tokio::test]
async fn test_phase5_quality_check_fail() {
    // 意図的にwarning/errorを含むコードでテスト
    // 品質スコア < 閾値 → FAIL → エスカレーション
}

#[tokio::test]
async fn test_phase5_message_queue_integration() {
    // Phase 5実行後、StatusUpdateメッセージが送信されることを確認
}
```

#### Task B4: Cargo.toml依存関係追加 ✅
**File**: `crates/miyabi-orchestrator/Cargo.toml`

```toml
[dependencies]
# 既存依存関係
# ...

# Phase 5用（オプション）
# cargo-tarpaulin = "0.27" # カバレッジ計測用（バイナリ依存なのでOptional）
```

### 完了条件
- [ ] `quality_checker.rs`実装（Clippy + Coverage計測）
- [ ] HeadlessOrchestratorにPhase 5統合
- [ ] Phase 5テスト3個追加（全PASS）
- [ ] Message Queue統合（StatusUpdate + Error送信）
- [ ] E2Eテスト: Phase 1→2→3→4→5の連続実行

---

## 📋 Phase 6-9 ロードマップ（将来タスク）

### Phase 6: Test Execution（2-3時間）
**Priority**: ⭐⭐⭐
- TestRunner実装
- `cargo test --all`実行 + 出力パース
- 失敗時の自動リトライ（最大3回）

### Phase 7: PR Creation（1-2時間）
**Priority**: ⭐⭐⭐
- GitHub API `create_pull_request`統合
- PR説明文自動生成（Template利用）
- Label自動付与

### Phase 8: CI/CD Integration（2-3時間）
**Priority**: ⭐⭐
- GitHub Checks API統合
- CI Status監視ループ
- CI失敗時の自動対応

### Phase 9: Auto-Merge & Deploy（2-3時間）
**Priority**: ⭐⭐
- 自動マージ条件チェック
- `merge_pull_request` API呼び出し
- Issue自動クローズ
- デプロイトリガー（GitHub Actions）

---

## 🎯 推奨実行順序

### Week 1: Message Queue統合 + Phase 5実装
1. **Day 1-2**: Track A（Message Queue統合）- 1-2時間
2. **Day 3-4**: Track B（Phase 5実装）- 3-5時間
3. **Day 5**: E2Eテスト + ドキュメント更新

### Week 2: Phase 6-7実装
4. **Day 1-2**: Phase 6（Test Execution）- 2-3時間
5. **Day 3-4**: Phase 7（PR Creation）- 1-2時間
6. **Day 5**: 統合テスト

### Week 3: Phase 8-9実装
7. **Day 1-2**: Phase 8（CI/CD Integration）- 2-3時間
8. **Day 3-4**: Phase 9（Auto-Merge & Deploy）- 2-3時間
9. **Day 5**: Full E2E Test（Issue作成 → PR Merge → Deploy）

---

## ✅ 次のアクション

**即座に開始できるタスク**:

### Option 1: Message Queue統合（推奨）
```bash
# 理由: 既に実装済み、即座に価値発揮、リスク低

# Step 1: HeadlessOrchestratorにSessionManager追加
# Step 2: Phase 1-4にメッセージ送信追加
# Step 3: テスト実行
# 所要時間: 1-2時間
```

### Option 2: Phase 5実装（段階的アプローチ）
```bash
# 理由: Phase 1-4の自然な延長、アーキテクチャ明確

# Step 1: quality_checker.rs実装（Clippy部分のみ）
# Step 2: HeadlessOrchestratorに統合
# Step 3: テスト追加
# 所要時間: 3-5時間（Coverage計測除く）
```

### Option 3: 並行実行（リソースあれば）
```bash
# Track A: Message Queue統合（優先）
# Track B: Phase 5実装（並行）

# メリット: 最速で両方完成
# デメリット: 複雑度増加
```

---

## 🎬 実行開始コマンド

### Message Queue統合を開始する場合:
```bash
# ファイル作成
touch crates/miyabi-orchestrator/tests/message_queue_orchestrator_test.rs

# 実装開始
# 1. HeadlessOrchestrator::new()を修正
# 2. run_phase_1_issue_analysis()にメッセージ送信追加
# 3. テスト実装
```

### Phase 5実装を開始する場合:
```bash
# ファイル作成
touch crates/miyabi-orchestrator/src/quality_checker.rs
touch crates/miyabi-orchestrator/tests/phase5_integration_test.rs

# 実装開始
# 1. QualityChecker構造体実装
# 2. run_clippy()メソッド実装
# 3. HeadlessOrchestratorに統合
```

---

**どちらを優先しますか？**

1. **Message Queue統合** - 短時間で完成、即座に価値発揮
2. **Phase 5実装** - より大きな機能追加、段階的に進められる
3. **両方並行** - 最速だが複雑度が高い

**推奨**: Message Queue統合 → Phase 5実装の順で進めることで、リスクを最小化しながら段階的に価値を提供できます。
