# Miyabi 完全自律ワークフロー実装プラン

**作成日**: 2025-10-27
**優先度**: 🔴 P0-Critical（最優先）
**基準ドキュメント**: END_TO_END_WORKFLOW.md, MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md

---

## 🎯 なぜこれが最優先なのか

### 現状の問題
1. **ベンチマーク評価の前提が未整備**: SWE-bench評価には完全自律ワークフローが必須
2. **手動オペレーションが多すぎる**: Issue → Agent → PR が手動トリガー
3. **並列実行が未実装**: 5-Worlds戦略が活用できていない
4. **収益化案件の基盤が弱い**: BytePlus/Shinyuの開発自動化に必要

### この実装で解決すること
✅ Issue作成 → 45分後にPRマージ（完全自動）
✅ 5-Worlds並列実行（5倍高速化）
✅ 品質スコア80以上で自動承認
✅ 複雑度7以上で自動エスカレーション

---

## 📊 ワークフロー全体像（9フェーズ）

### Phase 1: Issue Creation & Analysis
**所要時間**: 2-3分
**現状**: ⚠️ 半自動（IssueAgent手動実行）
**目標**: ✅ 完全自動（Webhook → IssueAgent）

### Phase 2: Task Decomposition
**所要時間**: 3-5分
**現状**: ⚠️ 半自動（CoordinatorAgent手動実行）
**目標**: ✅ 完全自動（Label trigger → CoordinatorAgent）

### Phase 3: Worktree Creation
**所要時間**: 30秒
**現状**: ❌ 未実装（手動git worktree add）
**目標**: ✅ 自動化（WorktreeManager）

### Phase 4: Claude Code Execution
**所要時間**: 8-10分
**現状**: ❌ 未実装（手動claude code起動）
**目標**: ✅ 自動化（Headless Mode）

### Phase 5: Parallel Task Execution
**所要時間**: 15-20分（5並列）
**現状**: ❌ 未実装（逐次実行のみ）
**目標**: ✅ 並列実行（5-Worlds同時）

### Phase 6: Quality Checks
**所要時間**: 2-3分
**現状**: ⚠️ 半自動（cargo test手動実行）
**目標**: ✅ 完全自動（自動チェック+修正）

### Phase 7: PR Creation
**所要時間**: 1分
**現状**: ⚠️ 半自動（gh pr create手動実行）
**目標**: ✅ 完全自動（PRAgent）

### Phase 8: Code Review
**所要時間**: 3-5分
**現状**: ❌ 未実装（手動レビュー）
**目標**: ✅ 自動化（ReviewAgent + 人間レビュー併用）

### Phase 9: Auto-Merge & Deployment
**所要時間**: 2-3分
**現状**: ❌ 未実装（手動マージ）
**目標**: ✅ 自動化（Score 80+で自動マージ）

---

## 🎨 画像で示された未実装部分（ピンク色）

### 未実装コンポーネント分析

#### 1. **Headless Orchestrator** 🔴
**現状**: 存在しない
**必要性**: Phase 1-9全体を制御するメインエンジン
**工数**: 5日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/headless.rs
pub struct HeadlessOrchestrator {
    state_machine: StateMachine,
    decision_engine: DecisionEngine,
    safety_monitor: SafetyMonitor,
}

impl HeadlessOrchestrator {
    pub async fn handle_issue_created(&self, issue: &Issue) -> Result<()> {
        // Phase 1: Issue Analysis
        let analysis = self.run_issue_agent(issue).await?;

        // Phase 2: Task Decomposition
        if analysis.requires_coordination() {
            let dag = self.run_coordinator_agent(issue).await?;

            // Phase 3-5: Parallel Execution
            self.execute_dag_parallel(dag).await?;
        }

        Ok(())
    }
}
```

---

#### 2. **Decision Engine** 🔴
**現状**: 存在しない
**必要性**: 複雑度判定・エスカレーション判断
**工数**: 3日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/decision.rs
pub struct DecisionEngine {
    thresholds: DecisionThresholds,
}

pub struct DecisionThresholds {
    complexity_auto_approve: f64,      // 5.0以下: 自動承認
    complexity_notify: f64,             // 7.0以下: 通知後承認
    complexity_escalate: f64,           // 7.0超: エスカレーション
    quality_auto_merge: f64,            // 80以上: 自動マージ
    quality_review: f64,                // 60以上: レビュー必要
}

impl DecisionEngine {
    pub fn should_auto_approve(&self, complexity: f64) -> Decision {
        if complexity < self.thresholds.complexity_auto_approve {
            Decision::AutoApprove
        } else if complexity < self.thresholds.complexity_notify {
            Decision::NotifyAndProceed { delay: Duration::from_secs(300) }
        } else {
            Decision::EscalateToHuman { reason: "High complexity" }
        }
    }
}
```

---

#### 3. **Claude Code Headless Integration** 🔴
**現状**: Interactive Modeのみ
**必要性**: Phase 4での自動コード生成
**工数**: 4日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/claude_headless.rs
pub struct ClaudeHeadlessExecutor {
    worktree_path: PathBuf,
}

impl ClaudeHeadlessExecutor {
    pub async fn execute_task(&self, task: &Task) -> Result<AgentResult> {
        // 1. Worktree内でClaude Code Headless起動
        let output = Command::new("claude")
            .arg("code")
            .arg("--headless")
            .arg("--context")
            .arg(self.worktree_path.join(".agent-context.json"))
            .current_dir(&self.worktree_path)
            .output()
            .await?;

        // 2. 結果をパース
        let result: AgentResult = serde_json::from_slice(&output.stdout)?;

        // 3. 品質チェック
        self.run_quality_checks(&result).await?;

        Ok(result)
    }
}
```

---

#### 4. **Parallel Task Executor** 🔴
**現状**: 逐次実行のみ
**必要性**: Phase 5での並列実行
**工数**: 3日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/parallel.rs
pub struct ParallelExecutor {
    max_concurrency: usize,  // 5 (5-Worlds)
}

impl ParallelExecutor {
    pub async fn execute_dag(&self, dag: &TaskDAG) -> Result<Vec<AgentResult>> {
        let mut results = Vec::new();
        let mut current_level = dag.get_root_tasks();

        while !current_level.is_empty() {
            // 同レベルのタスクを並列実行
            let level_results = self.execute_level_parallel(current_level).await?;
            results.extend(level_results);

            // 次のレベルを取得
            current_level = dag.get_next_level();
        }

        Ok(results)
    }

    async fn execute_level_parallel(&self, tasks: Vec<Task>) -> Result<Vec<AgentResult>> {
        let mut handles = Vec::new();

        for task in tasks {
            let handle = tokio::spawn(async move {
                // 各タスクを別Worktreeで実行
                let executor = ClaudeHeadlessExecutor::new(task.worktree_path);
                executor.execute_task(&task).await
            });
            handles.push(handle);
        }

        // 全タスク完了を待つ
        let results = futures::future::join_all(handles).await;

        // エラーチェック
        let mut success_results = Vec::new();
        for result in results {
            match result {
                Ok(Ok(agent_result)) => success_results.push(agent_result),
                Ok(Err(e)) => return Err(e),
                Err(e) => return Err(anyhow!("Task execution failed: {}", e)),
            }
        }

        Ok(success_results)
    }
}
```

---

#### 5. **Auto-Merge Engine** 🔴
**現状**: 存在しない
**必要性**: Phase 9での自動マージ
**工数**: 2日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/auto_merge.rs
pub struct AutoMergeEngine {
    quality_threshold: f64,  // 80
}

impl AutoMergeEngine {
    pub async fn handle_pr_ready(&self, pr: &PullRequest) -> Result<()> {
        // 1. ReviewAgentで品質スコア取得
        let review_result = self.run_review_agent(pr).await?;

        // 2. スコア判定
        if review_result.quality_score >= self.quality_threshold {
            // 自動マージ
            self.merge_pr(pr).await?;

            // 成功通知
            self.notify_success(pr).await?;
        } else {
            // 人間レビューにエスカレーション
            self.escalate_to_human(pr, review_result).await?;
        }

        Ok(())
    }
}
```

---

#### 6. **Safety Monitor** 🔴
**現状**: 存在しない
**必要性**: エラー検知・自動ロールバック
**工数**: 3日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/safety.rs
pub struct SafetyMonitor {
    checkpoints: Vec<Checkpoint>,
}

pub struct Checkpoint {
    pub phase: Phase,
    pub timestamp: DateTime<Utc>,
    pub state: ExecutionState,
}

impl SafetyMonitor {
    pub async fn monitor_execution(&self, execution_id: Uuid) -> Result<()> {
        loop {
            tokio::time::sleep(Duration::from_secs(10)).await;

            // 1. 実行状態チェック
            let state = self.get_execution_state(execution_id).await?;

            // 2. 異常検知
            if state.is_stuck() {
                warn!("Execution {} is stuck, rolling back", execution_id);
                self.rollback_to_last_checkpoint(execution_id).await?;
                break;
            }

            // 3. タイムアウトチェック
            if state.exceeded_timeout() {
                error!("Execution {} timed out", execution_id);
                self.escalate_to_human(execution_id, "Timeout").await?;
                break;
            }

            // 4. 完了チェック
            if state.is_completed() {
                info!("Execution {} completed successfully", execution_id);
                break;
            }
        }

        Ok(())
    }
}
```

---

#### 7. **Webhook Handler** 🟠
**現状**: 部分実装（miyabi-webhook crate存在）
**必要性**: Phase 1のトリガー
**工数**: 2日（拡張）

**実装内容**:
```rust
// crates/miyabi-webhook/src/handlers/issue.rs
pub async fn handle_issue_opened(payload: IssuePayload) -> Result<()> {
    let issue = payload.issue;

    // Headless Orchestratorを起動
    let orchestrator = HeadlessOrchestrator::new().await?;

    // Issue処理開始
    tokio::spawn(async move {
        if let Err(e) = orchestrator.handle_issue_created(&issue).await {
            error!("Failed to handle issue {}: {}", issue.number, e);
        }
    });

    Ok(())
}
```

---

#### 8. **State Machine** 🔴
**現状**: 存在しない
**必要性**: Phase遷移管理
**工数**: 2日

**実装内容**:
```rust
// crates/miyabi-orchestrator/src/state_machine.rs
#[derive(Debug, Clone)]
pub enum Phase {
    IssueAnalysis,
    TaskDecomposition,
    WorktreeCreation,
    CodeGeneration,
    ParallelExecution,
    QualityCheck,
    PRCreation,
    CodeReview,
    AutoMerge,
}

pub struct StateMachine {
    current_phase: Phase,
    execution_id: Uuid,
}

impl StateMachine {
    pub fn transition(&mut self, to: Phase) -> Result<()> {
        // 状態遷移の妥当性チェック
        if !self.is_valid_transition(&self.current_phase, &to) {
            return Err(anyhow!("Invalid state transition: {:?} -> {:?}",
                self.current_phase, to));
        }

        info!("State transition: {:?} -> {:?}", self.current_phase, to);
        self.current_phase = to;

        // SQLiteに状態保存
        self.persist_state().await?;

        Ok(())
    }
}
```

---

## 🗓️ 修正された実装プラン（Week 1-3）

### Week 1: 基盤整備 + Phase 1-3実装

#### Day 1 (月): Critical Blockers解消
**タスク**:
1. テストコンパイルエラー修正（30分）
2. Telegram Bot変更コミット（15分）
3. テスト100%達成（1時間）

**成果物**: ✅ クリーンなmainブランチ

---

#### Day 2 (火): Headless Orchestrator基盤
**タスク**:
1. **State Machine実装** (4時間)
   - Phase定義
   - 状態遷移ロジック
   - SQLite永続化

2. **Decision Engine実装** (4時間)
   - 閾値設定
   - 判定ロジック
   - エスカレーション機構

**成果物**:
- `crates/miyabi-orchestrator/src/state_machine.rs`
- `crates/miyabi-orchestrator/src/decision.rs`

---

#### Day 3 (水): Phase 1実装
**タスク**:
1. **Webhook Handler拡張** (3時間)
   - issue.opened イベント処理
   - Orchestrator起動

2. **IssueAgent自動実行** (3時間)
   - Label自動付与
   - 複雑度分析
   - Issue更新

3. **統合テスト** (2時間)

**成果物**:
- Issue作成 → 2分後にLabel自動付与（完全自動）

---

#### Day 4 (木): Phase 2実装
**タスク**:
1. **CoordinatorAgent自動トリガー** (4時間)
   - Label `trigger:agent-execute` 検知
   - DAG自動生成
   - Task分解

2. **複雑度判定実装** (4時間)
   - Decision Engine統合
   - エスカレーション通知

**成果物**:
- Label付与 → 3分後にDAG生成（複雑度5以下は自動承認）

---

#### Day 5 (金): Phase 3実装 + Week 1レビュー
**タスク**:
1. **WorktreeManager自動化** (4時間)
   - Worktree自動作成
   - Context file生成

2. **Week 1レビュー** (2時間)
3. **Week 2計画** (2時間)

**成果物**:
- DAG生成 → 30秒後にWorktree作成（完全自動）

**Week 1 KPI**:
- [ ] Phase 1-3完全自動化
- [ ] Issue → Worktree作成: 6分以内

---

### Week 2: Phase 4-6実装（コア機能）

#### Day 1-2 (月火): Claude Code Headless統合
**タスク**:
1. **ClaudeHeadlessExecutor実装** (1日)
   - Headless Mode起動
   - Context file渡し
   - 結果パース

2. **品質チェック自動化** (1日)
   - cargo test/clippy自動実行
   - 自動修正試行

**成果物**:
- Worktree作成 → 10分後にコード生成完了

---

#### Day 3-4 (水木): 並列実行実装
**タスク**:
1. **ParallelExecutor実装** (1.5日)
   - DAGレベル別並列実行
   - 5-Worlds同時実行
   - 結果集約

2. **統合テスト** (0.5日)

**成果物**:
- 5タスクを2分で並列実行（従来10分 → 2分）

---

#### Day 5 (金): Phase 6実装 + Week 2レビュー
**タスク**:
1. **自動品質チェック** (4時間)
2. **Week 2レビュー** (2時間)
3. **Week 3計画** (2時間)

**Week 2 KPI**:
- [ ] Phase 4-6完全自動化
- [ ] コード生成速度5倍向上

---

### Week 3: Phase 7-9実装（完全自律化）

#### Day 1-2 (月火): PR自動作成
**タスク**:
1. **PRAgent実装** (1日)
   - PR自動作成
   - コミット整形
   - 説明文自動生成

2. **統合テスト** (1日)

**成果物**:
- 品質チェック完了 → 1分後にPR作成

---

#### Day 3-4 (水木): 自動レビュー実装
**タスク**:
1. **ReviewAgent自動実行** (1日)
   - コード品質分析
   - スコア算出
   - レビューコメント生成

2. **Auto-Merge Engine実装** (1日)
   - スコア判定
   - 自動マージ
   - 通知

**成果物**:
- PR作成 → 5分後にレビュー完了 → スコア80+で自動マージ

---

#### Day 5 (金): Safety Monitor + Week 3レビュー
**タスク**:
1. **SafetyMonitor実装** (4時間)
2. **E2Eテスト** (2時間)
3. **Week 3総括** (2時間)

**Week 3 KPI**:
- [ ] Phase 7-9完全自動化
- [ ] **Issue → PRマージ: 45分以内**
- [ ] **自動化率: 100%（複雑度5以下）**

---

## 🎯 成功基準

### 技術的成功基準
1. ✅ Issue作成 → 45分でPRマージ（複雑度5以下）
2. ✅ 並列実行速度5倍向上（5-Worlds）
3. ✅ 品質スコア80以上で自動承認率 >90%
4. ✅ エスカレーション率 <10%（複雑度7超）

### ビジネス成功基準
1. ✅ SWE-bench評価の前提整備完了
2. ✅ 開発速度3倍向上
3. ✅ 人的工数50%削減

---

## 🚨 リスクと緩和策

### High Risk

**1. Claude Code Headless Modeの不安定性**
- **確率**: 40%
- **影響**: Phase 4完全停止
- **緩和策**: Interactive Modeフォールバック実装

**2. 並列実行のデッドロック**
- **確率**: 30%
- **影響**: Week 2延長
- **緩和策**: タイムアウト機構 + 自動ロールバック

**3. Auto-Mergeの誤判定**
- **確率**: 20%
- **影響**: バグのマージ
- **緩和策**: スコア閾値を保守的に設定（80 → 85）

---

## 📊 期待される効果

### Before（現状）
```
Issue作成 → 手動Label → 手動Agent実行 → 手動テスト → 手動PR → 手動レビュー → 手動マージ
所要時間: 3-5時間（人的工数）
```

### After（Week 3完了後）
```
Issue作成 → 【完全自動】 → PRマージ
所要時間: 45分（人的工数ゼロ）
```

### ROI
- **工数削減**: 5時間 → 0時間（100%削減）
- **速度向上**: 5時間 → 45分（6.7倍高速化）
- **品質向上**: 人的ミス削減、一貫性向上

---

## 🚀 次のアクション

**今すぐ実行**:

```bash
# Step 1: Blocker解消
cd /Users/shunsuke/Dev/miyabi-private
sed -i '' 's/let _agent =/let agent =/g' crates/miyabi-agent-codegen/tests/claudable_integration.rs
cargo test --package miyabi-agent-codegen

# Step 2: Telegram Bot変更コミット
git add crates/miyabi-telegram/src/bin/miyabi-telegram-bot.rs
git commit -m "feat(telegram): improve Japanese UX with interactive buttons"
git push

# Step 3: Week 1 Day 2開始
mkdir -p crates/miyabi-orchestrator/src
touch crates/miyabi-orchestrator/src/state_machine.rs
touch crates/miyabi-orchestrator/src/decision.rs
```

この実装を完了すれば、**SWE-bench評価は自動的に実行可能**になります。

**プラン承認していただけますか？**
