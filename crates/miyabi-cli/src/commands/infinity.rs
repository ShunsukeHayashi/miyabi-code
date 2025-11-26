//! Miyabi Infinity Mode - Autonomous Continuous Sprint Execution
//!
//! This command implements a fully autonomous mode that processes all open Issues
//! in priority order until completion, without human intervention.
//!
//! # Workflow
//!
//! 1. Fetch all open Issues and prioritize
//! 2. Execute sprints (batch of Issues) in parallel
//! 3. Auto-review and merge PRs (quality score ≥ 80%)
//! 4. Update Issue status and close
//! 5. Repeat until all Issues are processed
//! 6. Generate final report
//!
//! # Example
//!
//! ```bash
//! # Process all Issues
//! miyabi infinity
//!
//! # Process up to 10 Issues
//! miyabi infinity --max-issues 10
//!
//! # Custom concurrency and sprint size
//! miyabi infinity --concurrency 5 --sprint-size 10
//!
//! # Dry run (no actual changes)
//! miyabi infinity --dry-run
//!
//! # Resume from previous run
//! miyabi infinity --resume
//! ```

use crate::error::{CliError, Result};
use chrono::{DateTime, Utc};
use colored::Colorize;
use miyabi_github::client::GitHubClient;
use miyabi_orchestrator::headless::{HeadlessOrchestrator, HeadlessOrchestratorConfig};
use miyabi_types::Issue;
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::time::sleep;

/// Infinity Mode configuration
#[derive(Debug, Clone)]
pub struct InfinityConfig {
    /// Maximum number of Issues to process (None = unlimited)
    pub max_issues: Option<usize>,

    /// Number of concurrent executions
    pub concurrency: usize,

    /// Number of Issues per sprint
    pub sprint_size: usize,

    /// Timeout in hours (default: 4 hours)
    pub timeout_hours: u64,

    /// Dry run mode (no actual changes)
    pub dry_run: bool,

    /// Resume from previous run
    #[allow(dead_code)]
    pub resume: bool,

    /// Output directory for logs
    pub log_dir: PathBuf,
}

impl Default for InfinityConfig {
    fn default() -> Self {
        Self {
            max_issues: None,
            concurrency: 3,
            sprint_size: 5,
            timeout_hours: 4,
            dry_run: false,
            resume: false,
            log_dir: PathBuf::from(".ai/logs"),
        }
    }
}

/// Sprint execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SprintResult {
    /// Issue number
    pub issue_number: u64,

    /// Success flag
    pub success: bool,

    /// Execution duration in seconds
    pub duration_secs: u64,

    /// Error message (if failed)
    pub error: Option<String>,

    /// PR number (if created)
    pub pr_number: Option<u64>,

    /// Quality score (if available)
    pub quality_score: Option<f64>,
}

/// Sprint execution unit
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sprint {
    /// Sprint ID (1-indexed)
    pub id: usize,

    /// Issues in this sprint
    pub issues: Vec<u64>,

    /// Start time
    pub start_time: DateTime<Utc>,

    /// End time
    pub end_time: Option<DateTime<Utc>>,

    /// Results
    pub results: Vec<SprintResult>,
}

/// Final execution report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfinityReport {
    /// Total execution time
    pub total_duration_secs: u64,

    /// Total sprints executed
    pub total_sprints: usize,

    /// Total Issues processed
    pub total_issues: usize,

    /// Successful Issues
    pub successful_issues: usize,

    /// Failed Issues
    pub failed_issues: usize,

    /// Success rate (0.0 - 1.0)
    pub success_rate: f64,

    /// Sprints
    pub sprints: Vec<Sprint>,

    /// Stop reason
    pub stop_reason: StopReason,
}

/// Reason for stopping Infinity Mode
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StopReason {
    /// All Issues processed successfully
    AllCompleted,

    /// Maximum Issues limit reached
    MaxIssuesReached,

    /// Timeout reached
    Timeout,

    /// Consecutive failures (3 sprints)
    ConsecutiveFailures,

    /// Critical error occurred
    CriticalError(String),

    /// User interrupted (Ctrl+C)
    UserInterrupted,
}

/// Miyabi Infinity Mode executor
pub struct InfinityMode {
    config: InfinityConfig,
    github_client: Arc<GitHubClient>,
    orchestrator: HeadlessOrchestrator,
    start_time: Instant,
    sprints: Vec<Sprint>,
    consecutive_failures: usize,
}

impl InfinityMode {
    /// Create a new Infinity Mode executor
    pub fn new(config: InfinityConfig, github_client: GitHubClient) -> Self {
        let orchestrator_config = HeadlessOrchestratorConfig {
            autonomous_mode: true,
            auto_approve_complexity: 5.0,
            auto_merge_quality: 80.0,
            dry_run: config.dry_run,
        };

        let orchestrator =
            HeadlessOrchestrator::with_github_client(orchestrator_config, github_client.clone());

        Self {
            config,
            github_client: Arc::new(github_client),
            orchestrator,
            start_time: Instant::now(),
            sprints: Vec::new(),
            consecutive_failures: 0,
        }
    }

    /// Execute Infinity Mode
    pub async fn execute(&mut self) -> Result<InfinityReport> {
        println!("🚀 Starting Miyabi Infinity Mode");
        println!("   Max Issues: {:?}", self.config.max_issues);
        println!("   Concurrency: {}", self.config.concurrency);
        println!("   Sprint Size: {}", self.config.sprint_size);
        println!("   Timeout: {} hours", self.config.timeout_hours);
        println!("   Dry Run: {}", self.config.dry_run);

        // Create log directory
        fs::create_dir_all(&self.config.log_dir)?;

        // Step 1: Fetch all open Issues
        let mut issues = self.fetch_and_prioritize_issues().await?;

        if issues.is_empty() {
            println!("✅ No open Issues found. Nothing to do.");
            return Ok(InfinityReport {
                total_duration_secs: self.start_time.elapsed().as_secs(),
                total_sprints: 0,
                total_issues: 0,
                successful_issues: 0,
                failed_issues: 0,
                success_rate: 1.0,
                sprints: vec![],
                stop_reason: StopReason::AllCompleted,
            });
        }

        println!("📋 Found {} open Issues", issues.len());

        // Filter out processed issues if resuming
        if self.config.resume {
            if let Ok(Some(processed)) = InfinityCommand::load_previous_state(&self.config.log_dir)
            {
                let before_count = issues.len();
                issues.retain(|issue| !processed.contains(&issue.number));
                let after_count = issues.len();
                println!(
                    "   Filtered out {} already completed Issues (resume mode)",
                    before_count - after_count
                );
            }
        }

        // Apply max_issues limit
        if let Some(max) = self.config.max_issues {
            if issues.len() > max {
                println!("   Limiting to {} Issues (max_issues)", max);
                issues.truncate(max);
            }
        }

        // Step 2: Execute sprints until completion or stop condition
        let mut sprint_id = 1;
        let stop_reason = loop {
            // Check stop conditions
            if let Some(reason) = self.check_stop_conditions(&issues) {
                break reason;
            }

            // Get next sprint batch
            let sprint_issues: Vec<Issue> = issues
                .iter()
                .take(self.config.sprint_size)
                .cloned()
                .collect();

            if sprint_issues.is_empty() {
                break StopReason::AllCompleted;
            }

            println!();
            println!(
                "🏃 Sprint {} - Processing {} Issues",
                sprint_id,
                sprint_issues.len()
            );

            // Execute sprint
            let sprint_result = self.execute_sprint(sprint_id, sprint_issues).await?;

            // Record sprint
            self.sprints.push(sprint_result.clone());

            // Remove processed Issues
            let processed_count = sprint_result.results.len();
            issues.drain(0..processed_count.min(issues.len()));

            // Check consecutive failures
            let sprint_success_count = sprint_result.results.iter().filter(|r| r.success).count();

            if sprint_success_count == 0 {
                self.consecutive_failures += 1;
                eprintln!(
                    "⚠️  Sprint {} had zero successes (consecutive failures: {})",
                    sprint_id, self.consecutive_failures
                );
            } else {
                self.consecutive_failures = 0;
            }

            if self.consecutive_failures >= 3 {
                break StopReason::ConsecutiveFailures;
            }

            sprint_id += 1;

            // Small delay between sprints
            sleep(Duration::from_secs(2)).await;
        };

        // Step 3: Generate final report
        let report = self.generate_report(stop_reason);

        // Step 4: Save report to file
        self.save_report(&report)?;

        // Step 5: Display summary
        self.display_summary(&report);

        Ok(report)
    }

    /// Fetch all open Issues and prioritize
    async fn fetch_and_prioritize_issues(&self) -> Result<Vec<Issue>> {
        println!("🔍 Fetching open Issues...");

        // Fetch all open Issues from GitHub
        // Note: We can't use State::Open directly in miyabi-cli, so we'll fetch all and filter
        let all_issues = self
            .github_client
            .list_issues(None, vec![])
            .await
            .map_err(|e| CliError::ExecutionError(e.to_string()))?;

        // Filter only open issues
        let issues: Vec<Issue> = all_issues
            .into_iter()
            .filter(|issue| matches!(issue.state, miyabi_types::issue::IssueStateGithub::Open))
            .collect();

        println!("   Found {} open Issues", issues.len());

        // Prioritize by labels (P0 > P1 > P2 > P3 > unlabeled)
        let mut prioritized = issues;
        prioritized.sort_by(|a, b| {
            let priority_a = Self::extract_priority(&a.labels);
            let priority_b = Self::extract_priority(&b.labels);
            priority_a.cmp(&priority_b)
        });

        println!("   Prioritized Issues:");
        for (idx, issue) in prioritized.iter().enumerate().take(10) {
            println!("     {}. #{} - {}", idx + 1, issue.number, issue.title);
        }

        Ok(prioritized)
    }

    /// Extract priority from labels (0 = highest, 3 = lowest, 99 = unlabeled)
    fn extract_priority(labels: &[String]) -> u8 {
        for label in labels {
            if label.contains("P0") || label.contains("priority:P0") {
                return 0;
            } else if label.contains("P1") || label.contains("priority:P1") {
                return 1;
            } else if label.contains("P2") || label.contains("priority:P2") {
                return 2;
            } else if label.contains("P3") || label.contains("priority:P3") {
                return 3;
            }
        }
        99 // Unlabeled (lowest priority)
    }

    /// Execute a single sprint
    async fn execute_sprint(&mut self, sprint_id: usize, issues: Vec<Issue>) -> Result<Sprint> {
        let start_time = Utc::now();
        let issue_numbers: Vec<u64> = issues.iter().map(|i| i.number).collect();

        println!("   Issues: {:?}", issue_numbers);

        let mut results = Vec::new();

        // Execute each Issue sequentially
        // Note: HeadlessOrchestrator requires &mut self, so parallel execution
        // would require creating multiple orchestrator instances or using a pool
        for issue in &issues {
            println!("   Processing Issue #{}...", issue.number);
            let issue_start = Instant::now();

            let result = match self.orchestrator.handle_issue_created(issue).await {
                Ok(exec_result) => {
                    let duration = issue_start.elapsed().as_secs();
                    println!("     ✅ Success in {}s", duration);

                    // Try to extract PR number from GitHub (if PR was created)
                    let pr_number = Self::try_get_pr_for_issue(&issue.number).await?;

                    // If PR was created and merged, update Issue status
                    if let Some(pr_num) = pr_number {
                        if Self::is_pr_merged(pr_num).await? {
                            println!(
                                "     🔗 PR #{} was merged, updating Issue #{}...",
                                pr_num, issue.number
                            );
                            Self::update_issue_after_merge(&self.github_client, issue.number)
                                .await?;
                        }
                    }

                    SprintResult {
                        issue_number: issue.number,
                        success: exec_result.success,
                        duration_secs: duration,
                        error: exec_result.error,
                        pr_number,
                        quality_score: None, // TODO: Extract from execution result
                    }
                }
                Err(e) => {
                    let duration = issue_start.elapsed().as_secs();
                    eprintln!("     ❌ Failed in {}s: {}", duration, e);

                    SprintResult {
                        issue_number: issue.number,
                        success: false,
                        duration_secs: duration,
                        error: Some(e.to_string()),
                        pr_number: None,
                        quality_score: None,
                    }
                }
            };

            results.push(result);
        }

        let end_time = Utc::now();

        Ok(Sprint {
            id: sprint_id,
            issues: issue_numbers,
            start_time,
            end_time: Some(end_time),
            results,
        })
    }

    /// Try to get PR number for an issue (if PR was created)
    async fn try_get_pr_for_issue(issue_number: &u64) -> Result<Option<u64>> {
        // Try to find PR associated with this issue
        // This is a best-effort attempt - PR might not exist yet
        use std::process::Command;

        let output = Command::new("gh")
            .args(["pr", "list", "--state", "all", "--json", "number,body"])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                if let Ok(json_str) = String::from_utf8(output.stdout) {
                    if let Ok(prs) = serde_json::from_str::<Vec<serde_json::Value>>(&json_str) {
                        for pr in prs {
                            if let Some(body) = pr.get("body").and_then(|b| b.as_str()) {
                                if body.contains(&format!("#{}", issue_number))
                                    || body.contains(&format!("Issue #{}", issue_number))
                                {
                                    if let Some(num) = pr.get("number").and_then(|n| n.as_u64()) {
                                        return Ok(Some(num));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Ok(None)
    }

    /// Check if a PR has been merged
    async fn is_pr_merged(pr_number: u64) -> Result<bool> {
        use std::process::Command;

        let output = Command::new("gh")
            .args([
                "pr",
                "view",
                &pr_number.to_string(),
                "--json",
                "state,merged",
            ])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                if let Ok(json_str) = String::from_utf8(output.stdout) {
                    if let Ok(pr) = serde_json::from_str::<serde_json::Value>(&json_str) {
                        if let Some(merged) = pr.get("merged").and_then(|m| m.as_bool()) {
                            return Ok(merged);
                        }
                        // Fallback: check state
                        if let Some(state) = pr.get("state").and_then(|s| s.as_str()) {
                            return Ok(state == "MERGED");
                        }
                    }
                }
            }
        }

        Ok(false)
    }

    /// Update Issue status after PR merge
    async fn update_issue_after_merge(
        github_client: &Arc<GitHubClient>,
        issue_number: u64,
    ) -> Result<()> {
        // Remove state:pending label and add state:done label
        let remove_label = "📥 state:pending";
        let add_label = "✅ state:done";

        // Remove old state label (best effort, might not exist)
        let _ = github_client.remove_label(issue_number, remove_label).await;

        // Add new state label
        github_client
            .add_labels(issue_number, &[add_label.to_string()])
            .await?;

        // Close the issue
        github_client.close_issue(issue_number).await?;

        println!(
            "     ✅ Updated Issue #{}: {} → {}, closed",
            issue_number, remove_label, add_label
        );

        Ok(())
    }

    /// Check stop conditions
    fn check_stop_conditions(&self, remaining_issues: &[Issue]) -> Option<StopReason> {
        // Check timeout
        if self.start_time.elapsed() > Duration::from_secs(self.config.timeout_hours * 3600) {
            return Some(StopReason::Timeout);
        }

        // Check max_issues
        if let Some(max) = self.config.max_issues {
            let processed = self.sprints.iter().map(|s| s.results.len()).sum::<usize>();
            if processed >= max {
                return Some(StopReason::MaxIssuesReached);
            }
        }

        // Check if no remaining Issues
        if remaining_issues.is_empty() {
            return Some(StopReason::AllCompleted);
        }

        None
    }

    /// Generate final report
    fn generate_report(&self, stop_reason: StopReason) -> InfinityReport {
        let total_issues: usize = self.sprints.iter().map(|s| s.results.len()).sum();
        let successful_issues: usize = self
            .sprints
            .iter()
            .flat_map(|s| &s.results)
            .filter(|r| r.success)
            .count();
        let failed_issues = total_issues - successful_issues;
        let success_rate = if total_issues > 0 {
            successful_issues as f64 / total_issues as f64
        } else {
            0.0
        };

        InfinityReport {
            total_duration_secs: self.start_time.elapsed().as_secs(),
            total_sprints: self.sprints.len(),
            total_issues,
            successful_issues,
            failed_issues,
            success_rate,
            sprints: self.sprints.clone(),
            stop_reason,
        }
    }

    /// Save report to file (both JSON and Markdown)
    fn save_report(&self, report: &InfinityReport) -> Result<()> {
        let timestamp = Utc::now().format("%Y-%m-%d-%H%M%S");

        // Save JSON report
        let json_filename = format!("infinity-sprint-{}.json", timestamp);
        let json_path = self.config.log_dir.join(&json_filename);
        let json = serde_json::to_string_pretty(report)?;
        fs::write(&json_path, json)?;

        // Save Markdown report
        let md_filename = format!("infinity-sprint-{}.md", timestamp);
        let md_path = self.config.log_dir.join(&md_filename);
        let markdown = self.generate_markdown_report(report);
        fs::write(&md_path, markdown)?;

        println!("📝 Reports saved:");
        println!("   JSON: {}", json_path.display());
        println!("   Markdown: {}", md_path.display());

        Ok(())
    }

    /// Generate Markdown report
    fn generate_markdown_report(&self, report: &InfinityReport) -> String {
        let mut md = String::new();

        // Header
        md.push_str("# 🏁 Miyabi Infinity Mode - 完了報告\n\n");
        md.push_str(&format!(
            "**実行日時**: {}\n\n",
            Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
        ));

        // Summary
        md.push_str("## 📊 実行サマリー\n\n");
        let hours = report.total_duration_secs / 3600;
        let minutes = (report.total_duration_secs % 3600) / 60;
        let seconds = report.total_duration_secs % 60;
        md.push_str(&format!(
            "- **総実行時間**: {}時間{}分{}秒\n",
            hours, minutes, seconds
        ));
        md.push_str(&format!("- **総スプリント数**: {}\n", report.total_sprints));
        md.push_str(&format!("- **総Issue処理数**: {}\n", report.total_issues));
        md.push_str(&format!(
            "- **成功率**: {:.1}%\n",
            report.success_rate * 100.0
        ));
        md.push_str(&format!("- **成功**: {} ✅\n", report.successful_issues));
        md.push_str(&format!("- **失敗**: {} ❌\n\n", report.failed_issues));

        // Stop reason
        md.push_str("## 🛑 停止理由\n\n");
        match &report.stop_reason {
            StopReason::AllCompleted => {
                md.push_str("✅ **全Issue処理完了**\n\n");
            }
            StopReason::MaxIssuesReached => {
                md.push_str("⏹️  **最大Issue数に到達**\n\n");
            }
            StopReason::Timeout => {
                md.push_str(&format!(
                    "⏱️  **タイムアウト** ({}時間経過)\n\n",
                    self.config.timeout_hours
                ));
            }
            StopReason::ConsecutiveFailures => {
                md.push_str("❌ **3スプリント連続失敗**\n\n");
            }
            StopReason::CriticalError(err) => {
                md.push_str(&format!("🔴 **重大エラー**: {}\n\n", err));
            }
            StopReason::UserInterrupted => {
                md.push_str("🛑 **ユーザー中断** (Ctrl+C)\n\n");
            }
        }

        // Sprint details
        md.push_str("## 📈 スプリント別実績\n\n");
        for sprint in &report.sprints {
            let success_count = sprint.results.iter().filter(|r| r.success).count();
            let total_count = sprint.results.len();
            let start_str = sprint.start_time.format("%H:%M:%S");
            let end_str = sprint
                .end_time
                .map(|e| e.format("%H:%M:%S").to_string())
                .unwrap_or_else(|| "進行中".to_string());

            md.push_str(&format!(
                "### Sprint {} ({} - {})\n\n",
                sprint.id, start_str, end_str
            ));

            for result in &sprint.results {
                let status_icon = if result.success { "✅" } else { "❌" };
                let duration_str = format!("{:.1}秒", result.duration_secs);
                let pr_info = if let Some(pr_num) = result.pr_number {
                    format!(" (PR #{})", pr_num)
                } else {
                    String::new()
                };

                md.push_str(&format!(
                    "- Issue #{}: {} {} {}\n",
                    result.issue_number, status_icon, duration_str, pr_info
                ));

                if let Some(ref error) = result.error {
                    md.push_str(&format!("  - エラー: {}\n", error));
                }
            }
            md.push_str(&format!(
                "\n**結果**: {}/{} 成功\n\n",
                success_count, total_count
            ));
        }

        // Performance metrics
        md.push_str("## ⚡ パフォーマンス\n\n");
        if report.total_issues > 0 {
            let avg_duration = report.total_duration_secs as f64 / report.total_issues as f64;
            md.push_str(&format!(
                "- **平均処理時間**: {:.1}秒/Issue\n",
                avg_duration
            ));
        }

        // Generated artifacts
        md.push_str("## 🎨 生成された成果物\n\n");
        let pr_count = report
            .sprints
            .iter()
            .flat_map(|s| &s.results)
            .filter(|r| r.pr_number.is_some())
            .count();
        md.push_str(&format!("- **PR作成数**: {}\n", pr_count));
        md.push_str(&format!("- **Issue処理数**: {}\n", report.total_issues));

        md
    }

    /// Display summary
    fn display_summary(&self, report: &InfinityReport) {
        println!();
        println!(
            "{}",
            "========================================".bright_cyan()
        );
        println!(
            "{}",
            "🏁 Miyabi Infinity Mode - Final Report"
                .bright_cyan()
                .bold()
        );
        println!(
            "{}",
            "========================================".bright_cyan()
        );
        println!();

        println!("{}", "📊 Execution Summary".bright_yellow().bold());
        println!("   Total Duration: {} seconds", report.total_duration_secs);
        println!("   Total Sprints: {}", report.total_sprints);
        println!("   Total Issues: {}", report.total_issues);
        println!(
            "   Successful: {} ✅",
            report.successful_issues.to_string().bright_green()
        );
        println!(
            "   Failed: {} ❌",
            report.failed_issues.to_string().bright_red()
        );
        println!("   Success Rate: {:.1}%", report.success_rate * 100.0);
        println!();

        println!("{}", "🛑 Stop Reason".bright_yellow().bold());
        match &report.stop_reason {
            StopReason::AllCompleted => {
                println!(
                    "   {} All Issues completed successfully",
                    "✅".bright_green()
                );
            }
            StopReason::MaxIssuesReached => {
                println!("   ⏹️  Maximum Issues limit reached");
            }
            StopReason::Timeout => {
                println!("   ⏱️ Timeout reached ({}h)", self.config.timeout_hours);
            }
            StopReason::ConsecutiveFailures => {
                println!("   {} 3 sprints failed consecutively", "❌".bright_red());
            }
            StopReason::CriticalError(err) => {
                println!("   {} Critical error: {}", "🔴".bright_red(), err);
            }
            StopReason::UserInterrupted => {
                println!("   🛑 User interrupted (Ctrl+C)");
            }
        }
        println!();

        println!("{}", "📈 Sprint Details".bright_yellow().bold());
        for sprint in &report.sprints {
            let success_count = sprint.results.iter().filter(|r| r.success).count();
            let total_count = sprint.results.len();

            println!(
                "   Sprint {}: {}/{} succeeded",
                sprint.id,
                success_count.to_string().bright_green(),
                total_count
            );
        }
        println!();
        println!(
            "{}",
            "========================================".bright_cyan()
        );
    }
}

/// CLI command structure
pub struct InfinityCommand {
    /// Maximum number of Issues to process
    pub max_issues: Option<usize>,

    /// Number of concurrent executions
    pub concurrency: usize,

    /// Number of Issues per sprint
    pub sprint_size: usize,

    /// Dry run mode
    pub dry_run: bool,

    /// Resume from previous run
    pub resume: bool,
}

impl InfinityCommand {
    /// Execute Infinity Mode
    pub async fn execute(&self) -> Result<()> {
        // Load GitHub token
        let github_token = std::env::var("GITHUB_TOKEN")
            .map_err(|_| CliError::ExecutionError("GITHUB_TOKEN not set".to_string()))?;

        // Detect repository from git remote (simple implementation)
        let (owner, repo) = detect_repository_simple()?;

        println!("🔗 Repository: {}/{}", owner, repo);

        // Create GitHub client
        let github_client = GitHubClient::new(github_token, owner, repo)
            .map_err(|e| CliError::ExecutionError(e.to_string()))?;

        // Create Infinity Mode config
        let config = InfinityConfig {
            max_issues: self.max_issues,
            concurrency: self.concurrency,
            sprint_size: self.sprint_size,
            timeout_hours: 4,
            dry_run: self.dry_run,
            resume: self.resume,
            log_dir: PathBuf::from(".ai/logs"),
        };

        // Handle resume mode
        if self.resume {
            println!("🔄 Resume mode: Loading previous execution state...");
            if let Some(processed_issues) = Self::load_previous_state(&config.log_dir)? {
                println!(
                    "   Found {} completed Issues from previous run",
                    processed_issues.len()
                );
                println!("   Will skip these Issues and continue from remaining ones");
            } else {
                println!("   No previous state found, starting fresh");
            }
        }

        // Create and execute Infinity Mode
        let mut infinity = InfinityMode::new(config, github_client);
        let report = infinity.execute().await?;

        // Save state for potential resume
        Self::save_state(&infinity.config.log_dir, &report)?;

        Ok(())
    }

    /// Load previous execution state (processed Issue numbers)
    fn load_previous_state(log_dir: &PathBuf) -> Result<Option<Vec<u64>>> {
        // Find the most recent report
        let entries = match fs::read_dir(log_dir) {
            Ok(entries) => entries,
            Err(_) => return Ok(None),
        };
        let mut reports: Vec<(PathBuf, std::time::SystemTime)> = Vec::new();

        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json")
                && path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .map(|s| s.starts_with("infinity-sprint-"))
                    .unwrap_or(false)
            {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        reports.push((path, modified));
                    }
                }
            }
        }

        if reports.is_empty() {
            return Ok(None);
        }

        // Sort by modification time (most recent first)
        reports.sort_by(|a, b| b.1.cmp(&a.1));

        // Load the most recent report
        if let Some((path, _)) = reports.first() {
            let content = fs::read_to_string(path)?;
            let report: InfinityReport = serde_json::from_str(&content)?;

            // Extract successfully completed Issue numbers
            let processed_set: BTreeSet<u64> = report
                .sprints
                .iter()
                .flat_map(|s| &s.results)
                .filter(|r| r.success)
                .map(|r| r.issue_number)
                .collect();

            let processed: Vec<u64> = processed_set.into_iter().collect();
            Ok(Some(processed))
        } else {
            Ok(None)
        }
    }

    /// Save current state for potential resume
    fn save_state(log_dir: &Path, report: &InfinityReport) -> Result<()> {
        // Save a resume checkpoint file
        let checkpoint_path = log_dir.join("infinity-checkpoint.json");
        let processed_issues: Vec<u64> = report
            .sprints
            .iter()
            .flat_map(|s| &s.results)
            .filter(|r| r.success)
            .map(|r| r.issue_number)
            .collect::<BTreeSet<_>>()
            .into_iter()
            .collect();

        let checkpoint = serde_json::json!({
            "timestamp": Utc::now().to_rfc3339(),
            "processed_issues": processed_issues,
            "total_sprints": report.total_sprints,
            "total_issues": report.total_issues,
        });
        fs::write(&checkpoint_path, serde_json::to_string_pretty(&checkpoint)?)?;
        Ok(())
    }
}

/// Detect repository owner and name from git remote
fn detect_repository_simple() -> Result<(String, String)> {
    use std::process::Command;

    let output = Command::new("git")
        .args(["remote", "get-url", "origin"])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to run git command: {}", e)))?;

    if !output.status.success() {
        return Err(CliError::NotGitRepository);
    }

    let url = String::from_utf8_lossy(&output.stdout);
    let url = url.trim();

    // Parse GitHub URL (supports both https and ssh)
    // Examples:
    //   https://github.com/owner/repo.git
    //   git@github.com:owner/repo.git
    let parts: Vec<&str> = if url.contains("github.com:") {
        url.split("github.com:").collect()
    } else if url.contains("github.com/") {
        url.split("github.com/").collect()
    } else {
        return Err(CliError::ExecutionError(
            "Not a GitHub repository".to_string(),
        ));
    };

    if parts.len() != 2 {
        return Err(CliError::ExecutionError(
            "Invalid GitHub URL format".to_string(),
        ));
    }

    let repo_part = parts[1].trim_end_matches(".git");
    let repo_parts: Vec<&str> = repo_part.split('/').collect();

    if repo_parts.len() != 2 {
        return Err(CliError::ExecutionError(
            "Invalid GitHub repository path".to_string(),
        ));
    }

    Ok((repo_parts[0].to_string(), repo_parts[1].to_string()))
}
