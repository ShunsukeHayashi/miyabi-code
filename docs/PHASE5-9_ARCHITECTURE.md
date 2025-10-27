# Phase 5-9: Complete Autonomous Workflow Architecture

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: 🚧 In Progress

---

## 概要

Phase 5-9は、コード生成後の品質保証からデプロイまでを完全自動化するフェーズです。

```
Phase 4: Code Generation (5-Worlds) ✅ 完了
    ↓
Phase 5: Code Review & Quality Check 🚧 実装中
    ↓
Phase 6: Test Execution 🚧 実装中
    ↓
Phase 7: PR Creation 🚧 実装中
    ↓
Phase 8: CI/CD Integration 🚧 実装中
    ↓
Phase 9: Auto-Merge & Deploy 🚧 実装中
```

---

## Phase 5: Code Review & Quality Check

### 目的
- 5-Worldsで生成されたコードの品質検証
- 自動的なコードレビュー実行
- 品質スコアリング (0-100点)

### 実装方針

#### 1. ReviewAgent統合
```rust
use miyabi_agent_review::ReviewAgent;

pub async fn run_phase_5_review(
    &mut self,
    issue: &Issue,
    worktrees: &[WorktreeInfo],
    state_machine: &mut StateMachine,
) -> Result<ReviewResult> {
    info!("🔍 Phase 5: Code Review for Issue #{}", issue.number);

    // ReviewAgentを起動
    let review_agent = ReviewAgent::new(self.agent_config.clone());

    // 5-Worldsの結果を統合してレビュー
    let review_result = review_agent
        .review_code_in_worktree(&worktrees[0].path)
        .await?;

    // 品質スコア判定
    if review_result.quality_score >= self.config.auto_merge_quality {
        info!("✅ Quality check passed: {}%", review_result.quality_score);
        state_machine.transition_to(Phase::Review)?;
    } else {
        warn!("⚠️ Quality below threshold: {}%", review_result.quality_score);
        // エスカレーション
        self.escalate_for_manual_review(issue, &review_result).await?;
    }

    Ok(review_result)
}
```

#### 2. 品質チェック項目
- **静的解析**: `cargo clippy`, `cargo fmt --check`
- **セキュリティスキャン**: `cargo audit`
- **複雑度チェック**: Cyclomatic complexity
- **テストカバレッジ**: 最低80%
- **ドキュメント**: 全公開APIにdocコメント

#### 3. ReviewResult構造
```rust
pub struct ReviewResult {
    pub quality_score: f64,           // 0-100
    pub issues_found: Vec<QualityIssue>,
    pub clippy_warnings: usize,
    pub security_vulnerabilities: usize,
    pub test_coverage: f64,           // 0-1
    pub documentation_coverage: f64,  // 0-1
    pub auto_approved: bool,
}
```

---

## Phase 6: Test Execution

### 目的
- 生成されたコードの自動テスト実行
- テスト失敗時の自動修正試行
- テスト結果のレポート生成

### 実装方針

#### 1. TestRunner実装
```rust
pub struct TestRunner {
    worktree_path: PathBuf,
    timeout_secs: u64,
}

impl TestRunner {
    pub async fn run_all_tests(&self) -> Result<TestResult> {
        info!("🧪 Running all tests in {}", self.worktree_path.display());

        // cargo test実行
        let output = Command::new("cargo")
            .args(&["test", "--all"])
            .current_dir(&self.worktree_path)
            .output()
            .await?;

        self.parse_test_output(output)
    }

    fn parse_test_output(&self, output: Output) -> Result<TestResult> {
        // stdout/stderrをパース
        // "test result: ok. X passed; Y failed"を抽出
    }
}
```

#### 2. TestResult構造
```rust
pub struct TestResult {
    pub success: bool,
    pub total_tests: usize,
    pub passed: usize,
    pub failed: usize,
    pub ignored: usize,
    pub duration_secs: u64,
    pub failed_tests: Vec<FailedTest>,
}

pub struct FailedTest {
    pub name: String,
    pub error_message: String,
    pub file_path: Option<PathBuf>,
}
```

#### 3. 自動修正フロー
```
テスト失敗検出
    ↓
CodeGenAgentに再実行依頼（最大3回）
    ↓
3回失敗 → 人間へエスカレーション
```

---

## Phase 7: PR Creation

### 目的
- GitHub Pull Requestの自動作成
- PR説明文の自動生成
- ラベル・レビュアーの自動割り当て

### 実装方針

#### 1. PRAgent統合
```rust
use miyabi_github::PullRequestBuilder;

pub async fn run_phase_7_pr_creation(
    &mut self,
    issue: &Issue,
    worktree: &WorktreeInfo,
    review_result: &ReviewResult,
    test_result: &TestResult,
) -> Result<PullRequest> {
    info!("📝 Phase 7: Creating PR for Issue #{}", issue.number);

    // PR説明文を生成
    let pr_body = self.generate_pr_description(
        issue,
        review_result,
        test_result,
    );

    // GitHub APIでPR作成
    let github = self.github_client.as_ref().unwrap();
    let pr = github
        .create_pull_request(
            &format!("feat: {}", issue.title),
            &pr_body,
            &worktree.branch_name,
            "main",
        )
        .await?;

    // ラベル追加
    github.add_labels_to_pr(pr.number, &["automated", "needs-review"]).await?;

    info!("✅ PR #{} created", pr.number);
    Ok(pr)
}
```

#### 2. PR説明文テンプレート
```markdown
## Summary
<!-- IssueAgentの分析結果を記載 -->

## Changes
<!-- CoordinatorAgentのタスク一覧 -->

## Quality Metrics
- **Quality Score**: {review_result.quality_score}%
- **Tests**: {test_result.passed}/{test_result.total_tests} passed
- **Coverage**: {review_result.test_coverage}%

## 5-Worlds Execution
- **Confidence**: {execution_result.confidence}%
- **Successful Worlds**: {execution_result.successful_worlds}/5

## Checklist
- [x] Code generated via 5-Worlds
- [x] Quality check passed
- [x] All tests passed
- [x] Documentation updated

Closes #{issue.number}

🤖 Generated with [Miyabi](https://github.com/ShunsukeHayashi/Miyabi)
```

---

## Phase 8: CI/CD Integration

### 目的
- GitHub ActionsのCI実行を待機
- CI結果の自動チェック
- CI失敗時の自動対応

### 実装方針

#### 1. CI Status Checker
```rust
pub struct CIStatusChecker {
    github_client: Arc<GitHubClient>,
    check_interval_secs: u64,
    max_wait_secs: u64,
}

impl CIStatusChecker {
    pub async fn wait_for_ci(&self, pr_number: u64) -> Result<CIStatus> {
        let start = Instant::now();

        loop {
            // GitHub Checks APIでCI状態を取得
            let checks = self.github_client
                .get_pr_checks(pr_number)
                .await?;

            let status = self.evaluate_checks(&checks);

            match status {
                CIStatus::Success => return Ok(status),
                CIStatus::Failed => return Ok(status),
                CIStatus::Pending => {
                    if start.elapsed().as_secs() > self.max_wait_secs {
                        return Ok(CIStatus::Timeout);
                    }
                    tokio::time::sleep(Duration::from_secs(self.check_interval_secs)).await;
                }
            }
        }
    }
}
```

#### 2. CIStatus構造
```rust
pub enum CIStatus {
    Success,
    Failed,
    Pending,
    Timeout,
}
```

#### 3. CI失敗時の対応
```
CI失敗検出
    ↓
ログ解析 → 原因特定
    ↓
CodeGenAgentに修正依頼
    ↓
新しいコミットをプッシュ
    ↓
CI再実行
```

---

## Phase 9: Auto-Merge & Deploy

### 目的
- 品質基準を満たしたPRの自動マージ
- 本番環境への自動デプロイ
- Issue自動クローズ

### 実装方針

#### 1. Auto-Merge Logic
```rust
pub async fn run_phase_9_auto_merge(
    &mut self,
    issue: &Issue,
    pr: &PullRequest,
    ci_status: &CIStatus,
) -> Result<MergeResult> {
    info!("🚀 Phase 9: Auto-Merge for PR #{}", pr.number);

    // 自動マージ条件チェック
    if self.can_auto_merge(pr, ci_status) {
        // PRをマージ
        let github = self.github_client.as_ref().unwrap();
        github.merge_pull_request(pr.number, "squash").await?;

        info!("✅ PR #{} merged automatically", pr.number);

        // Issueをクローズ
        github.close_issue(issue.number).await?;

        // デプロイトリガー
        self.trigger_deployment(pr).await?;

        Ok(MergeResult::Success)
    } else {
        warn!("⚠️ Auto-merge conditions not met");
        Ok(MergeResult::ManualReviewRequired)
    }
}
```

#### 2. 自動マージ条件
```rust
fn can_auto_merge(&self, pr: &PullRequest, ci_status: &CIStatus) -> bool {
    // 1. CIが全て成功
    if !matches!(ci_status, CIStatus::Success) {
        return false;
    }

    // 2. 品質スコアが閾値以上
    if pr.quality_score < self.config.auto_merge_quality {
        return false;
    }

    // 3. レビュー承認済み（人間のレビューが必要な場合）
    if self.config.require_human_review && pr.approved_reviews == 0 {
        return false;
    }

    // 4. コンフリクトなし
    if pr.has_conflicts {
        return false;
    }

    true
}
```

#### 3. デプロイフロー
```
PR Merge完了
    ↓
GitHub Actions: Deploy workflow triggered
    ↓
Staging環境へデプロイ
    ↓
Smoke Test実行
    ↓
成功 → Production環境へデプロイ
    ↓
Slack/Discord通知
```

---

## 全体フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    Autonomous Workflow                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: Issue Analysis (IssueAgent)                      │
│      ↓ complexity < threshold → auto-approve               │
│  Phase 2: Task Decomposition (CoordinatorAgent)            │
│      ↓ DAG generation                                       │
│  Phase 3: Worktree Creation (WorktreeManager)              │
│      ↓ git worktree add                                     │
│  Phase 4: Code Generation (5-Worlds)                       │
│      ↓ 80% confidence threshold                            │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Phase 5: Code Review (ReviewAgent)                    │  │
│ │     ↓ quality_score >= 80%                            │  │
│ │ Phase 6: Test Execution (TestRunner)                  │  │
│ │     ↓ all tests passed                                │  │
│ │ Phase 7: PR Creation (PRAgent)                        │  │
│ │     ↓ PR #123 created                                 │  │
│ │ Phase 8: CI/CD (CIStatusChecker)                      │  │
│ │     ↓ CI success                                      │  │
│ │ Phase 9: Auto-Merge (GitHubClient)                    │  │
│ │     ↓ PR merged, Issue closed                         │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Result: Issue resolved, Code deployed                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## エラーハンドリング & エスカレーション

### エスカレーション条件

| Phase | 条件 | アクション |
|-------|------|-----------|
| Phase 5 | quality_score < 80% | 人間レビュー依頼 |
| Phase 6 | tests failed (3回) | CodeGenAgentに問題報告 |
| Phase 7 | PR作成失敗 | GitHub API権限確認 |
| Phase 8 | CI timeout (30分) | CIログ確認、再実行 |
| Phase 9 | マージ条件未達 | レビュアー通知 |

### エスカレーション通知

```rust
pub async fn escalate_to_human(
    &self,
    issue: &Issue,
    phase: Phase,
    reason: &str,
) -> Result<()> {
    // 1. GitHub Issue Comment
    self.github_client
        .add_comment(
            issue.number,
            &format!("🚨 Escalation required at {:?}: {}", phase, reason),
        )
        .await?;

    // 2. Discord/Slack通知
    self.notification_service
        .send_escalation(issue, phase, reason)
        .await?;

    // 3. Tech Leadにメンション
    if let Some(tech_lead) = &self.agent_config.tech_lead_github_username {
        self.github_client
            .mention_user(issue.number, tech_lead)
            .await?;
    }

    Ok(())
}
```

---

## 実装スケジュール

### Week 1: Phase 5-6
- [ ] ReviewAgent統合
- [ ] 品質チェックロジック実装
- [ ] TestRunner実装
- [ ] 自動修正フロー実装

### Week 2: Phase 7-8
- [ ] PRAgent統合
- [ ] PR説明文生成
- [ ] CI Status Checker実装
- [ ] CI失敗対応ロジック

### Week 3: Phase 9
- [ ] Auto-Merge Logic実装
- [ ] デプロイトリガー実装
- [ ] エスカレーション通知実装

### Week 4: 統合テスト & ドキュメント
- [ ] E2Eテスト作成
- [ ] パフォーマンステスト
- [ ] ドキュメント完成

---

## 関連ドキュメント

- [Phase 4 Implementation](./PHASE4_IMPLEMENTATION.md)
- [Session Manager Guide](./SESSION_MANAGER_GUIDE.md)
- [HeadlessOrchestrator Guide](./HEADLESS_ORCHESTRATOR.md)

---

**Status**: 🚧 Architecture Design Complete - Ready for Implementation
**Next Step**: Implement Phase 5 (Code Review)
