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
use std::fs;
use std::path::PathBuf;
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

        let orchestrator = HeadlessOrchestrator::with_github_client(
            orchestrator_config,
            github_client.clone(),
        );

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

            println!("");
            println!("🏃 Sprint {} - Processing {} Issues", sprint_id, sprint_issues.len());

            // Execute sprint
            let sprint_result = self.execute_sprint(sprint_id, sprint_issues).await?;

            // Record sprint
            self.sprints.push(sprint_result.clone());

            // Remove processed Issues
            let processed_count = sprint_result.results.len();
            issues.drain(0..processed_count.min(issues.len()));

            // Check consecutive failures
            let sprint_success_count = sprint_result
                .results
                .iter()
                .filter(|r| r.success)
                .count();

            if sprint_success_count == 0 {
                self.consecutive_failures += 1;
                eprintln!("⚠️  Sprint {} had zero successes (consecutive failures: {})",
                          sprint_id, self.consecutive_failures);
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

        // Execute each Issue sequentially (for now)
        // TODO: Parallel execution with semaphore
        for issue in &issues {
            println!("   Processing Issue #{}...", issue.number);
            let issue_start = Instant::now();

            let result = match self.orchestrator.handle_issue_created(issue).await {
                Ok(exec_result) => {
                    let duration = issue_start.elapsed().as_secs();
                    println!("     ✅ Success in {}s", duration);

                    SprintResult {
                        issue_number: issue.number,
                        success: exec_result.success,
                        duration_secs: duration,
                        error: exec_result.error,
                        pr_number: None, // TODO: Extract from execution result
                        quality_score: None,
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

    /// Save report to file
    fn save_report(&self, report: &InfinityReport) -> Result<()> {
        let timestamp = Utc::now().format("%Y-%m-%d-%H%M%S");
        let filename = format!("infinity-sprint-{}.json", timestamp);
        let path = self.config.log_dir.join(&filename);

        let json = serde_json::to_string_pretty(report)?;
        fs::write(&path, json)?;

        println!("📝 Report saved to: {}", path.display());

        Ok(())
    }

    /// Display summary
    fn display_summary(&self, report: &InfinityReport) {
        println!("");
        println!("{}", "========================================".bright_cyan());
        println!("{}", "🏁 Miyabi Infinity Mode - Final Report".bright_cyan().bold());
        println!("{}", "========================================".bright_cyan());
        println!("");

        println!("{}", "📊 Execution Summary".bright_yellow().bold());
        println!("   Total Duration: {} seconds", report.total_duration_secs);
        println!("   Total Sprints: {}", report.total_sprints);
        println!("   Total Issues: {}", report.total_issues);
        println!("   Successful: {} ✅", report.successful_issues.to_string().bright_green());
        println!("   Failed: {} ❌", report.failed_issues.to_string().bright_red());
        println!("   Success Rate: {:.1}%", report.success_rate * 100.0);
        println!("");

        println!("{}", "🛑 Stop Reason".bright_yellow().bold());
        match &report.stop_reason {
            StopReason::AllCompleted => {
                println!("   {} All Issues completed successfully", "✅".bright_green());
            }
            StopReason::MaxIssuesReached => {
                println!("   ⏹️  Maximum Issues limit reached");
            }
            StopReason::Timeout => {
                println!("   {} Timeout reached ({}h)", "⏱️", self.config.timeout_hours);
            }
            StopReason::ConsecutiveFailures => {
                println!("   {} 3 sprints failed consecutively", "❌".bright_red());
            }
            StopReason::CriticalError(err) => {
                println!("   {} Critical error: {}", "🔴".bright_red(), err);
            }
            StopReason::UserInterrupted => {
                println!("   {} User interrupted (Ctrl+C)", "🛑");
            }
        }
        println!("");

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
        println!("");
        println!("{}", "========================================".bright_cyan());
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

        // Create and execute Infinity Mode
        let mut infinity = InfinityMode::new(config, github_client);
        let _report = infinity.execute().await?;

        Ok(())
    }
}

/// Detect repository owner and name from git remote
fn detect_repository_simple() -> Result<(String, String)> {
    use std::process::Command;

    let output = Command::new("git")
        .args(&["remote", "get-url", "origin"])
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
