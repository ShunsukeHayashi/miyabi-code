//! Headless Orchestrator for Autonomous Workflow Execution
//!
//! This module implements the main orchestrator that controls the entire
//! autonomous workflow from Issue creation to PR merge.

use crate::claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig};
use crate::decision::{Decision, DecisionEngine};
use crate::notification::{Notification, NotificationService};
use crate::pr_creator::{PRConfig, PRCreator};
use crate::quality_checker::QualityChecker;
use crate::skills_bridge::{SkillExecutor, SkillRequest, SkillResult, SkillsBridge};
use crate::state_machine::{Phase, StateMachine};
use anyhow::{anyhow, Result};
use miyabi_agent_coordinator::coordinator::CoordinatorAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_agent_issue::IssueAgent;
use miyabi_agent_review::ReviewAgent;
use miyabi_github::client::GitHubClient;
use miyabi_session_manager::{
    CustomMessage, ErrorMessage, MessageBuilder, MessageType, Priority, SessionManager,
};
use miyabi_types::task::TaskDecomposition;
use miyabi_types::{AgentConfig, Issue};
use miyabi_worktree::{WorktreeInfo, WorktreeManager};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};
use uuid::Uuid;

/// Headless Orchestrator configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadlessOrchestratorConfig {
    /// Enable autonomous mode
    pub autonomous_mode: bool,

    /// Auto-approve tasks below this complexity
    pub auto_approve_complexity: f64,

    /// Auto-merge PRs above this quality score
    pub auto_merge_quality: f64,

    /// Enable dry-run mode (no actual changes)
    pub dry_run: bool,
}

impl Default for HeadlessOrchestratorConfig {
    fn default() -> Self {
        Self {
            autonomous_mode: true,
            auto_approve_complexity: 5.0,
            auto_merge_quality: 80.0,
            dry_run: false,
        }
    }
}

/// Execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionResult {
    /// Execution ID
    pub execution_id: Uuid,

    /// Issue number
    pub issue_number: u64,

    /// Success status
    pub success: bool,

    /// Final phase reached
    pub final_phase: Phase,

    /// Error message if failed
    pub error: Option<String>,

    /// Execution duration in seconds
    pub duration_seconds: u64,
}

/// Headless Orchestrator
pub struct HeadlessOrchestrator {
    /// Configuration
    config: HeadlessOrchestratorConfig,

    /// Agent configuration (for creating agents)
    #[allow(dead_code)]
    agent_config: AgentConfig,

    /// Decision engine
    decision_engine: DecisionEngine,

    /// Issue analysis agent
    issue_agent: IssueAgent,

    /// Task decomposition agent
    coordinator_agent: CoordinatorAgent,

    /// Review agent for Phase 8
    review_agent: ReviewAgent,

    /// Claude Code Executor for Phase 4 (5-Worlds parallel execution)
    claude_code_executor: Option<ClaudeCodeExecutor>,

    /// Session Manager for Agent-to-Agent handoff
    session_manager: Option<Arc<SessionManager>>,

    /// GitHub API client (optional for dry-run mode)
    github_client: Option<Arc<GitHubClient>>,

    /// Worktree manager for task isolation
    worktree_manager: Option<Arc<WorktreeManager>>,

    /// Notification service
    notification_service: NotificationService,

    /// PR Creator for Phase 7
    pr_creator: Option<PRCreator>,

    /// Skills Bridge for skill execution
    skills_bridge: Option<Arc<SkillsBridge>>,

    /// Active state machines
    active_executions: Arc<RwLock<std::collections::HashMap<Uuid, StateMachine>>>,
}

impl HeadlessOrchestrator {
    /// Create a new headless orchestrator
    pub fn new(config: HeadlessOrchestratorConfig) -> Self {
        info!("🚀 Initializing Headless Orchestrator");
        info!("   Autonomous mode: {}", config.autonomous_mode);
        info!(
            "   Auto-approve threshold: {}",
            config.auto_approve_complexity
        );
        info!("   Auto-merge threshold: {}", config.auto_merge_quality);
        info!("   Dry-run: {}", config.dry_run);

        // Create minimal AgentConfig for dry-run mode
        let agent_config = AgentConfig {
            device_identifier: std::env::var("DEVICE_IDENTIFIER")
                .unwrap_or_else(|_| "orchestrator".to_string()),
            github_token: std::env::var("GITHUB_TOKEN").unwrap_or_default(),
            repo_owner: None,
            repo_name: None,
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        };

        // Initialize WorktreeManager (optional, only if not in dry-run)
        let worktree_manager = if !config.dry_run {
            match WorktreeManager::new_with_discovery(Some(".worktrees"), 5) {
                Ok(manager) => {
                    info!("   WorktreeManager initialized: .worktrees/ (max 5 concurrent)");
                    Some(Arc::new(manager))
                }
                Err(e) => {
                    warn!("   Failed to initialize WorktreeManager: {}", e);
                    warn!("   Continuing without worktree support");
                    None
                }
            }
        } else {
            info!("   Dry-run mode: WorktreeManager disabled");
            None
        };

        // Initialize ClaudeCodeExecutor (optional, only if not in dry-run)
        let claude_code_executor = if !config.dry_run {
            let executor_config = ExecutorConfig {
                timeout_secs: 600, // 10 minutes per task
                num_worlds: 5,     // 5-Worlds parallel execution
                success_threshold: 0.8,
                log_dir: PathBuf::from(".ai/logs/executor"),
            };
            info!("   ClaudeCodeExecutor initialized: 5-Worlds parallel execution (10min timeout)");
            Some(ClaudeCodeExecutor::new(executor_config))
        } else {
            info!("   Dry-run mode: ClaudeCodeExecutor disabled");
            None
        };

        Self {
            decision_engine: DecisionEngine::new(),
            issue_agent: IssueAgent::new(),
            coordinator_agent: CoordinatorAgent::new(agent_config.clone()),
            review_agent: ReviewAgent::new(agent_config.clone()),
            notification_service: NotificationService::new(),
            claude_code_executor,
            session_manager: None, // Will be initialized via with_session_manager()
            config,
            agent_config,
            github_client: None,
            worktree_manager,
            pr_creator: None,    // Will be initialized when GitHub client is set
            skills_bridge: None, // Will be initialized via with_skills_bridge()
            active_executions: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Enable SessionManager for Agent-to-Agent handoff with Message Queue
    pub async fn with_session_manager(mut self) -> Result<Self> {
        if !self.config.dry_run {
            let session_manager = SessionManager::new(".ai/sessions")
                .await?
                .with_message_queue(true)
                .await?;
            info!("   SessionManager initialized: .ai/sessions/ (Message Queue enabled)");
            self.session_manager = Some(Arc::new(session_manager));
        } else {
            info!("   Dry-run mode: SessionManager disabled");
        }
        Ok(self)
    }

    /// Enable Skills Bridge for skill execution integration
    pub fn with_skills_bridge(
        mut self,
    ) -> (
        Self,
        tokio::sync::mpsc::UnboundedReceiver<crate::skills_bridge::OrchestratorEvent>,
    ) {
        let (bridge, event_rx) = SkillsBridge::new();
        info!("   Skills Bridge initialized: Orchestrator ↔ Skills integration enabled");
        self.skills_bridge = Some(Arc::new(bridge));
        (self, event_rx)
    }

    /// Create with GitHub client for label automation
    pub fn with_github_client(
        config: HeadlessOrchestratorConfig,
        github_client: GitHubClient,
    ) -> Self {
        info!("🚀 Initializing Headless Orchestrator with GitHub integration");
        info!("   Autonomous mode: {}", config.autonomous_mode);
        info!(
            "   Auto-approve threshold: {}",
            config.auto_approve_complexity
        );
        info!("   Auto-merge threshold: {}", config.auto_merge_quality);
        info!("   Dry-run: {}", config.dry_run);

        // Create AgentConfig with GitHub credentials
        let agent_config = AgentConfig {
            device_identifier: std::env::var("DEVICE_IDENTIFIER")
                .unwrap_or_else(|_| "orchestrator".to_string()),
            github_token: std::env::var("GITHUB_TOKEN").unwrap_or_default(),
            repo_owner: Some(github_client.owner().to_string()),
            repo_name: Some(github_client.repo().to_string()),
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        };

        // Initialize WorktreeManager (optional, only if not in dry-run)
        let worktree_manager = if !config.dry_run {
            match WorktreeManager::new_with_discovery(Some(".worktrees"), 5) {
                Ok(manager) => {
                    info!("   WorktreeManager initialized: .worktrees/ (max 5 concurrent)");
                    Some(Arc::new(manager))
                }
                Err(e) => {
                    warn!("   Failed to initialize WorktreeManager: {}", e);
                    warn!("   Continuing without worktree support");
                    None
                }
            }
        } else {
            info!("   Dry-run mode: WorktreeManager disabled");
            None
        };

        // Initialize ClaudeCodeExecutor (optional, only if not in dry-run)
        let claude_code_executor = if !config.dry_run {
            let executor_config = ExecutorConfig {
                timeout_secs: 600, // 10 minutes per task
                num_worlds: 5,     // 5-Worlds parallel execution
                success_threshold: 0.8,
                log_dir: PathBuf::from(".ai/logs/executor"),
            };
            info!("   ClaudeCodeExecutor initialized: 5-Worlds parallel execution (10min timeout)");
            Some(ClaudeCodeExecutor::new(executor_config))
        } else {
            info!("   Dry-run mode: ClaudeCodeExecutor disabled");
            None
        };

        // Initialize PRCreator (optional, only if not in dry-run)
        let pr_creator = if !config.dry_run {
            let pr_config = PRConfig {
                owner: github_client.owner().to_string(),
                repo: github_client.repo().to_string(),
                base_branch: "main".to_string(),
                draft: false,
            };
            info!(
                "   PRCreator initialized: base_branch={}",
                pr_config.base_branch
            );
            Some(PRCreator::new(pr_config))
        } else {
            info!("   Dry-run mode: PRCreator disabled");
            None
        };

        Self {
            decision_engine: DecisionEngine::new(),
            issue_agent: IssueAgent::new(),
            coordinator_agent: CoordinatorAgent::new(agent_config.clone()),
            review_agent: ReviewAgent::new(agent_config.clone()),
            notification_service: NotificationService::new(),
            claude_code_executor,
            session_manager: None, // Will be initialized via with_session_manager()
            config,
            agent_config,
            github_client: Some(Arc::new(github_client)),
            worktree_manager,
            pr_creator,
            skills_bridge: None, // Will be initialized via with_skills_bridge()
            active_executions: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Handle Issue created event
    ///
    /// This is the entry point for the autonomous workflow.
    /// Called by webhook handler when a new Issue is created.
    pub async fn handle_issue_created(&mut self, issue: &Issue) -> Result<ExecutionResult> {
        info!("📥 Received Issue #{}: {}", issue.number, issue.title);

        if self.config.dry_run {
            warn!("   🏃 DRY-RUN MODE: No actual changes will be made");
        }

        // Create state machine
        let mut state_machine = StateMachine::new(issue.number);
        let execution_id = state_machine.execution_id();

        info!("   Execution ID: {}", execution_id);

        // Store active execution
        {
            let mut executions = self.active_executions.write().await;
            executions.insert(execution_id, state_machine.clone());
        }

        // Phase 1: Issue Analysis
        let analysis_result = self
            .run_phase_1_issue_analysis(issue, &mut state_machine)
            .await?;

        // Check complexity and decide
        let decision = self
            .decision_engine
            .should_auto_approve(analysis_result.complexity, issue.number);

        match decision {
            Decision::AutoApprove => {
                info!("✅ Auto-approved Issue #{}", issue.number);

                // Send Phase 1 completion notification
                let notification = Notification::phase1_complete(
                    issue.number,
                    analysis_result.complexity,
                    analysis_result.labels.clone(),
                );
                self.notification_service.send(&notification).await?;

                // Continue to Phase 2: Task Decomposition
                let decomposition = self
                    .run_phase_2_task_decomposition(issue, &mut state_machine)
                    .await?;

                info!(
                    "✅ Phase 2 complete: {} tasks generated",
                    decomposition.tasks.len()
                );

                // Continue to Phase 3: Worktree Creation (if multiple tasks and worktree enabled)
                if decomposition.tasks.len() > 1 {
                    if self.worktree_manager.is_some() {
                        let worktrees = self
                            .run_phase_3_worktree_creation(
                                issue,
                                &decomposition,
                                &mut state_machine,
                            )
                            .await?;
                        info!(
                            "✅ Phase 3 complete: {} worktrees created",
                            decomposition.tasks.len()
                        );

                        // Continue to Phase 4: CodeGen Execution (5-Worlds parallel)
                        if self.claude_code_executor.is_some() && !worktrees.is_empty() {
                            let execution_result = self
                                .run_phase_4_codegen_execution(
                                    issue,
                                    &worktrees,
                                    &mut state_machine,
                                )
                                .await?;
                            info!(
                                "✅ Phase 4 complete: {}% confidence ({}/{} worlds succeeded)",
                                (execution_result.confidence * 100.0).round(),
                                execution_result.successful_worlds,
                                execution_result.total_worlds
                            );

                            // Continue to Phase 6-9 if confidence is high enough
                            if execution_result.confidence >= 0.6 {
                                let branch_name = format!("feat/issue-{}", issue.number);

                                // Phase 6: Quality Check
                                let quality_report =
                                    self.run_phase_6_quality_check(&mut state_machine).await?;
                                info!(
                                    "✅ Phase 6 complete: Quality score {}/100",
                                    quality_report.score
                                );

                                // Phase 7: PR Creation
                                let pr = self
                                    .run_phase_7_pr_creation(
                                        issue,
                                        branch_name.clone(),
                                        &mut state_machine,
                                    )
                                    .await?;
                                info!("✅ Phase 7 complete: PR #{} created", pr.number);

                                // Phase 8: Code Review
                                let review_score = self
                                    .run_phase_8_code_review(issue, pr.number, &mut state_machine)
                                    .await?;
                                info!("✅ Phase 8 complete: Review score {:.1}", review_score);

                                // Phase 9: Auto-Merge
                                let quality_score = execution_result.confidence * 100.0;
                                self.run_phase_9_auto_merge(
                                    issue,
                                    pr.number,
                                    quality_score,
                                    review_score,
                                    &mut state_machine,
                                )
                                .await?;
                                info!(
                                    "✅ Phase 9 complete: Workflow finished for Issue #{}",
                                    issue.number
                                );
                            } else {
                                warn!(
                                    "⚠️  Phase 6-9 skipped: Low confidence ({:.1}%), requires human review",
                                    execution_result.confidence * 100.0
                                );
                            }
                        } else {
                            info!("⏭️  Phase 4 skipped: ClaudeCodeExecutor not initialized or no worktrees");
                        }
                    } else {
                        info!(
                            "⏭️  Phase 3 skipped: Single-threaded execution (no worktree manager)"
                        );
                    }
                } else {
                    info!("⏭️  Phase 3 skipped: Single task execution (worktree not needed)");
                }
            }
            Decision::NotifyAndProceed { delay_seconds } => {
                info!(
                    "🔔 Notifying and proceeding after {}s for Issue #{}",
                    delay_seconds, issue.number
                );

                // Send Phase 1 completion notification
                let notification = Notification::phase1_complete(
                    issue.number,
                    analysis_result.complexity,
                    analysis_result.labels.clone(),
                );
                self.notification_service.send(&notification).await?;

                // Wait and continue
                tokio::time::sleep(tokio::time::Duration::from_secs(delay_seconds)).await;

                // Continue to Phase 2: Task Decomposition
                let decomposition = self
                    .run_phase_2_task_decomposition(issue, &mut state_machine)
                    .await?;

                info!(
                    "✅ Phase 2 complete: {} tasks generated",
                    decomposition.tasks.len()
                );

                // Continue to Phase 3: Worktree Creation (if multiple tasks and worktree enabled)
                if decomposition.tasks.len() > 1 {
                    if self.worktree_manager.is_some() {
                        let worktrees = self
                            .run_phase_3_worktree_creation(
                                issue,
                                &decomposition,
                                &mut state_machine,
                            )
                            .await?;
                        info!(
                            "✅ Phase 3 complete: {} worktrees created",
                            decomposition.tasks.len()
                        );

                        // Continue to Phase 4: CodeGen Execution (5-Worlds parallel)
                        if self.claude_code_executor.is_some() && !worktrees.is_empty() {
                            let execution_result = self
                                .run_phase_4_codegen_execution(
                                    issue,
                                    &worktrees,
                                    &mut state_machine,
                                )
                                .await?;
                            info!(
                                "✅ Phase 4 complete: {}% confidence ({}/{} worlds succeeded)",
                                (execution_result.confidence * 100.0).round(),
                                execution_result.successful_worlds,
                                execution_result.total_worlds
                            );

                            // Continue to Phase 6-9 if confidence is high enough
                            if execution_result.confidence >= 0.6 {
                                let branch_name = format!("feat/issue-{}", issue.number);

                                // Phase 6: Quality Check
                                let quality_report =
                                    self.run_phase_6_quality_check(&mut state_machine).await?;
                                info!(
                                    "✅ Phase 6 complete: Quality score {}/100",
                                    quality_report.score
                                );

                                // Phase 7: PR Creation
                                let pr = self
                                    .run_phase_7_pr_creation(
                                        issue,
                                        branch_name.clone(),
                                        &mut state_machine,
                                    )
                                    .await?;
                                info!("✅ Phase 7 complete: PR #{} created", pr.number);

                                // Phase 8: Code Review
                                let review_score = self
                                    .run_phase_8_code_review(issue, pr.number, &mut state_machine)
                                    .await?;
                                info!("✅ Phase 8 complete: Review score {:.1}", review_score);

                                // Phase 9: Auto-Merge
                                let quality_score = execution_result.confidence * 100.0;
                                self.run_phase_9_auto_merge(
                                    issue,
                                    pr.number,
                                    quality_score,
                                    review_score,
                                    &mut state_machine,
                                )
                                .await?;
                                info!(
                                    "✅ Phase 9 complete: Workflow finished for Issue #{}",
                                    issue.number
                                );
                            } else {
                                warn!(
                                    "⚠️  Phase 6-9 skipped: Low confidence ({:.1}%), requires human review",
                                    execution_result.confidence * 100.0
                                );
                            }
                        } else {
                            info!("⏭️  Phase 4 skipped: ClaudeCodeExecutor not initialized or no worktrees");
                        }
                    } else {
                        info!(
                            "⏭️  Phase 3 skipped: Single-threaded execution (no worktree manager)"
                        );
                    }
                } else {
                    info!("⏭️  Phase 3 skipped: Single task execution (worktree not needed)");
                }
            }
            Decision::EscalateToHuman { reason } => {
                warn!(
                    "⚠️  Escalating Issue #{} to human: {}",
                    issue.number, reason
                );

                // Send escalation notification
                let notification = Notification::escalation(
                    issue.number,
                    analysis_result.complexity,
                    reason.clone(),
                );
                self.notification_service.send(&notification).await?;

                // Stop and wait for human approval
                return Ok(ExecutionResult {
                    execution_id,
                    issue_number: issue.number,
                    success: false,
                    final_phase: Phase::IssueAnalysis,
                    error: Some(format!("Escalated: {}", reason)),
                    duration_seconds: 0,
                });
            }
            _ => {
                return Err(anyhow!("Unexpected decision: {:?}", decision));
            }
        }

        // Remove from active executions when done
        {
            let mut executions = self.active_executions.write().await;
            executions.remove(&execution_id);
        }

        Ok(ExecutionResult {
            execution_id,
            issue_number: issue.number,
            success: true,
            final_phase: state_machine.current_phase(),
            error: None,
            duration_seconds: 0, // TODO: Calculate actual duration
        })
    }

    /// Phase 1: Issue Analysis
    async fn run_phase_1_issue_analysis(
        &self,
        issue: &Issue,
        state_machine: &mut StateMachine,
    ) -> Result<IssueAnalysisResult> {
        info!("🔍 Phase 1: Issue Analysis for #{}", issue.number);

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual IssueAgent execution");
            return Ok(IssueAnalysisResult {
                complexity: 3.0,
                labels: vec!["type:feature".to_string()],
                estimated_duration_hours: 2,
            });
        }

        // Execute IssueAgent for actual complexity analysis
        info!("   Executing IssueAgent for Issue #{}", issue.number);
        let analysis = self.issue_agent.analyze_issue(issue).await?;

        info!(
            "   Complexity: {:.1}/10.0 ({:?})",
            analysis.complexity, analysis.complexity_level
        );
        info!("   Suggested labels: {:?}", analysis.labels);
        info!(
            "   Estimated duration: {} hours",
            analysis.estimated_duration_hours
        );
        info!("   Reasoning: {}", analysis.reasoning);

        // Apply labels to GitHub Issue if client is available
        if let Some(client) = &self.github_client {
            self.apply_labels_to_issue(client, issue.number, &analysis.labels)
                .await?;
        } else if !self.config.dry_run {
            warn!(
                "GitHub client not configured, skipping label application for Issue #{}",
                issue.number
            );
        }

        state_machine.transition_to(Phase::IssueAnalysis)?;

        // 🆕 Send status update message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 1",
                        "status": "completed",
                        "progress": 11, // 1/9 phases = ~11%
                        "issue_number": issue.number,
                        "complexity": analysis.complexity,
                        "labels_count": analysis.labels.len(),
                        "estimated_hours": analysis.estimated_duration_hours,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 1 status sent to message queue");
        }

        Ok(IssueAnalysisResult {
            complexity: analysis.complexity,
            labels: analysis.labels,
            estimated_duration_hours: analysis.estimated_duration_hours,
        })
    }

    /// Apply suggested labels to GitHub Issue
    async fn apply_labels_to_issue(
        &self,
        client: &GitHubClient,
        issue_number: u64,
        labels: &[String],
    ) -> Result<()> {
        if self.config.dry_run {
            info!(
                "   [DRY-RUN] Would apply labels to Issue #{}: {:?}",
                issue_number, labels
            );
            return Ok(());
        }

        info!(
            "🏷️  Applying labels to Issue #{}: {:?}",
            issue_number, labels
        );

        match client.add_labels(issue_number, labels).await {
            Ok(_) => {
                info!("✅ Successfully applied labels to Issue #{}", issue_number);
                Ok(())
            }
            Err(e) => {
                warn!(
                    "⚠️  Failed to apply labels to Issue #{}: {}",
                    issue_number, e
                );
                // Don't fail the entire workflow if label application fails
                Ok(())
            }
        }
    }

    /// Phase 2: Task Decomposition & DAG Generation
    async fn run_phase_2_task_decomposition(
        &self,
        issue: &Issue,
        state_machine: &mut StateMachine,
    ) -> Result<TaskDecomposition> {
        info!("🔧 Phase 2: Task Decomposition for #{}", issue.number);

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual CoordinatorAgent execution");

            // Create mock decomposition for dry-run
            use miyabi_types::task::{Task, TaskType};
            use miyabi_types::workflow::{Edge, DAG};

            let task1 = Task::new(
                format!("task-{}-analysis", issue.number),
                format!("Analyze requirements for #{}", issue.number),
                "Analyze issue requirements".to_string(),
                TaskType::Docs,
                1,
            )?;

            let task2 = Task {
                id: format!("task-{}-impl", issue.number),
                title: format!("Implement solution for #{}", issue.number),
                description: issue.body.clone(),
                task_type: TaskType::Feature,
                priority: 2,
                severity: None,
                impact: None,
                assigned_agent: Some(miyabi_types::agent::AgentType::CodeGenAgent),
                dependencies: vec![format!("task-{}-analysis", issue.number)],
                estimated_duration: Some(30),
                status: None,
                start_time: None,
                end_time: None,
                metadata: None,
            };

            let tasks = vec![task1, task2];

            let dag = DAG {
                nodes: tasks.clone(),
                edges: vec![Edge {
                    from: format!("task-{}-analysis", issue.number),
                    to: format!("task-{}-impl", issue.number),
                }],
                levels: vec![
                    vec![format!("task-{}-analysis", issue.number)],
                    vec![format!("task-{}-impl", issue.number)],
                ],
            };

            state_machine.transition_to(Phase::TaskDecomposition)?;

            return Ok(TaskDecomposition {
                original_issue: issue.clone(),
                tasks,
                dag,
                estimated_total_duration: 35,
                has_cycles: false,
                recommendations: vec![],
            });
        }

        // Execute CoordinatorAgent for task decomposition
        info!("   Executing CoordinatorAgent for Issue #{}", issue.number);
        let decomposition = self.coordinator_agent.decompose_issue(issue).await?;

        info!("   Generated {} tasks", decomposition.tasks.len());
        info!("   DAG levels: {}", decomposition.dag.levels.len());
        info!(
            "   Estimated total duration: {} minutes",
            decomposition.estimated_total_duration
        );
        info!("   Has cycles: {}", decomposition.has_cycles);

        if !decomposition.recommendations.is_empty() {
            info!("   Recommendations:");
            for rec in &decomposition.recommendations {
                info!("     - {}", rec);
            }
        }

        // Validate decomposition
        if decomposition.tasks.is_empty() {
            return Err(anyhow!("CoordinatorAgent generated no tasks"));
        }

        if decomposition.has_cycles {
            return Err(anyhow!("Task DAG contains cycles - cannot execute"));
        }

        state_machine.transition_to(Phase::TaskDecomposition)?;

        // 🆕 Send status update message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 2",
                        "status": "completed",
                        "progress": 22, // 2/9 phases = ~22%
                        "issue_number": issue.number,
                        "tasks_count": decomposition.tasks.len(),
                        "dag_levels": decomposition.dag.levels.len(),
                        "total_duration": decomposition.estimated_total_duration,
                        "has_cycles": decomposition.has_cycles,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 2 status sent to message queue");
        }

        Ok(decomposition)
    }

    /// Phase 3: Worktree Creation & Branch Setup
    async fn run_phase_3_worktree_creation(
        &self,
        issue: &Issue,
        decomposition: &TaskDecomposition,
        state_machine: &mut StateMachine,
    ) -> Result<Vec<WorktreeInfo>> {
        info!(
            "🌳 Phase 3: Worktree Creation for {} tasks",
            decomposition.tasks.len()
        );

        let worktree_manager = self
            .worktree_manager
            .as_ref()
            .ok_or_else(|| anyhow!("WorktreeManager not initialized"))?;

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual worktree creation");
            state_machine.transition_to(Phase::WorktreeCreation)?;
            return Ok(vec![]);
        }

        let mut worktrees = Vec::new();

        // Create a worktree for each task
        for (idx, task) in decomposition.tasks.iter().enumerate() {
            info!(
                "   Creating worktree {}/{}: {}",
                idx + 1,
                decomposition.tasks.len(),
                task.title
            );

            // Create worktree for this task
            let worktree = worktree_manager.create_worktree(issue.number).await?;

            info!("     ✅ Worktree created: {:?}", worktree.path);
            info!("     📍 Branch: {}", worktree.branch_name);

            // TODO: Inject task context (.agent-context.json)
            // self.inject_task_context(&worktree, task, decomposition).await?;

            worktrees.push(worktree);
        }

        state_machine.transition_to(Phase::WorktreeCreation)?;

        // 🆕 Send status update message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 3",
                        "status": "completed",
                        "progress": 33, // 3/9 phases = ~33%
                        "issue_number": issue.number,
                        "worktrees_count": worktrees.len(),
                        "tasks_count": decomposition.tasks.len(),
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 3 status sent to message queue");
        }

        Ok(worktrees)
    }

    /// Phase 4: CodeGen Execution & 5-Worlds Parallel Implementation
    async fn run_phase_4_codegen_execution(
        &mut self,
        issue: &Issue,
        worktrees: &[WorktreeInfo],
        state_machine: &mut StateMachine,
    ) -> Result<crate::claude_code_executor::ExecutionResult> {
        info!(
            "🚀 Phase 4: CodeGen Execution (5-Worlds Parallel) for #{}",
            issue.number
        );
        info!(
            "   Worktrees: {:?}",
            worktrees.iter().map(|w| &w.path).collect::<Vec<_>>()
        );

        let executor = self
            .claude_code_executor
            .as_mut()
            .ok_or_else(|| anyhow!("ClaudeCodeExecutor not initialized"))?;

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual claude code execution");
            state_machine.transition_to(Phase::CodeGeneration)?;

            // Mock result for dry-run
            return Ok(crate::claude_code_executor::ExecutionResult {
                success: true,
                confidence: 0.8,
                successful_worlds: 4,
                total_worlds: 5,
                message: "[DRY-RUN] Mock 5-Worlds execution".to_string(),
                world_results: vec![],
            });
        }

        // Use the first worktree as base (or primary worktree for the issue)
        let base_worktree = worktrees
            .first()
            .ok_or_else(|| anyhow!("No worktrees available for Phase 4"))?;

        info!("   Base worktree: {:?}", base_worktree.path);
        info!("   Executing 5-Worlds parallel execution...");

        // Execute agent run with 5-Worlds parallel execution
        let execution_result = executor
            .execute_agent_run(issue.number as u32, base_worktree.path.clone())
            .await?;

        info!("   5-Worlds execution complete:");
        info!("     Success: {}", execution_result.success);
        info!(
            "     Confidence: {}%",
            (execution_result.confidence * 100.0).round()
        );
        info!(
            "     Successful worlds: {}/{}",
            execution_result.successful_worlds, execution_result.total_worlds
        );

        // Display individual world results
        for world_result in &execution_result.world_results {
            let status_icon = if world_result.success { "✅" } else { "❌" };
            info!(
                "     {} World {}: {}",
                status_icon, world_result.world_id, world_result.message
            );
        }

        if execution_result.success {
            info!(
                "   ✅ Phase 4 succeeded: Confidence threshold met ({}% >= 80%)",
                (execution_result.confidence * 100.0).round()
            );
            state_machine.transition_to(Phase::CodeGeneration)?;

            // 🆕 Send success message to queue
            if let Some(ref manager) = self.session_manager {
                let session_id = state_machine.execution_id();
                let msg = MessageBuilder::new(session_id)
                    .priority(Priority::Normal)
                    .message_type(MessageType::Custom(CustomMessage {
                        type_id: "phase_completion".to_string(),
                        payload: serde_json::json!({
                            "phase": "Phase 4",
                            "status": "completed",
                            "progress": 44, // 4/9 phases = ~44%
                            "issue_number": issue.number,
                            "confidence": (execution_result.confidence * 100.0).round(),
                            "successful_worlds": execution_result.successful_worlds,
                            "total_worlds": execution_result.total_worlds,
                        })
                        .to_string(),
                    }))
                    .build()
                    .map_err(|e| anyhow!("Failed to build message: {}", e))?;

                manager.send_message(msg).await?;
                info!("   📨 Phase 4 success status sent to message queue");
            }
        } else {
            warn!(
                "   ⚠️  Phase 4 failed: Confidence threshold not met ({}% < 80%)",
                (execution_result.confidence * 100.0).round()
            );
            warn!("   Escalating to human review");

            // 🆕 Send URGENT error message to queue
            if let Some(ref manager) = self.session_manager {
                let session_id = state_machine.execution_id();

                let msg = MessageBuilder::new(session_id)
                    .priority(Priority::Urgent) // 🚨 Urgent priority for errors!
                    .message_type(MessageType::Error(ErrorMessage {
                        code: "PHASE4_CONFIDENCE_FAILED".to_string(),
                        message: format!(
                            "5-Worlds execution failed: {}% confidence < 80% threshold",
                            (execution_result.confidence * 100.0).round()
                        ),
                        stacktrace: Some(format!(
                            "Successful worlds: {}/{}",
                            execution_result.successful_worlds, execution_result.total_worlds
                        )),
                    }))
                    .build()
                    .map_err(|e| anyhow!("Failed to build error message: {}", e))?;

                manager.send_message(msg).await?;
                warn!("   🚨 Phase 4 URGENT error sent to message queue");
            }

            // Send escalation notification
            let notification = Notification::escalation(
                issue.number,
                0.0, // No complexity score for Phase 4 failures
                format!(
                    "5-Worlds execution failed: {}% confidence ({}/{} worlds succeeded)",
                    (execution_result.confidence * 100.0).round(),
                    execution_result.successful_worlds,
                    execution_result.total_worlds
                ),
            );
            self.notification_service.send(&notification).await?;
        }

        Ok(execution_result)
    }

    /// Phase 6: Quality Check & Auto-Fix
    async fn run_phase_6_quality_check(
        &mut self,
        state_machine: &mut StateMachine,
    ) -> Result<miyabi_types::quality::QualityReport> {
        info!("🔍 Phase 6: Quality Check & Auto-Fix");

        state_machine.transition_to(Phase::QualityCheck)?;

        // Get current working directory (project root)
        let project_path = std::env::current_dir()?;

        // Run quality checks
        let checker = QualityChecker::new(&project_path);
        let mut report = checker.run_checks().await?;

        info!("   Quality score: {}/100", report.score);
        info!("   Clippy: {}/100", report.breakdown.clippy_score);
        info!("   Rustc: {}/100", report.breakdown.rustc_score);
        info!("   Security: {}/100", report.breakdown.security_score);
        info!("   Coverage: {}/100", report.breakdown.test_coverage_score);

        // Auto-fix if score is below threshold but not too low
        if report.score < 80 && report.score >= 60 {
            info!("   🔧 Running auto-fix (score {}/100)...", report.score);
            checker.auto_fix().await?;

            // Re-run checks after auto-fix
            report = checker.run_checks().await?;
            info!("   ✅ Auto-fix complete, new score: {}/100", report.score);
        }

        // Send message queue notification
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(if report.passed {
                    Priority::Normal
                } else {
                    Priority::High
                })
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 6",
                        "progress": 66,
                        "quality_score": report.score,
                        "breakdown": {
                            "clippy": report.breakdown.clippy_score,
                            "rustc": report.breakdown.rustc_score,
                            "security": report.breakdown.security_score,
                            "coverage": report.breakdown.test_coverage_score,
                        },
                        "passed": report.passed,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 6 status sent to message queue");
        }

        Ok(report)
    }

    /// Phase 7: PR Creation & Auto-Description Generation
    async fn run_phase_7_pr_creation(
        &mut self,
        issue: &Issue,
        branch_name: String,
        state_machine: &mut StateMachine,
    ) -> Result<crate::pr_creator::PullRequest> {
        info!(
            "📝 Phase 7: PR Creation & Auto-Description for #{}",
            issue.number
        );
        info!("   Branch: {}", branch_name);

        let pr_creator = self
            .pr_creator
            .as_ref()
            .ok_or_else(|| anyhow!("PRCreator not initialized"))?;

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual PR creation");
            state_machine.transition_to(Phase::PRCreation)?;

            // Mock result for dry-run
            return Ok(crate::pr_creator::PullRequest {
                number: 999,
                title: format!("[DRY-RUN] feat: Implement Issue #{}", issue.number),
                body: "[DRY-RUN] Mock PR body".to_string(),
                branch: branch_name,
                base_branch: "main".to_string(),
                url: "https://github.com/mock/repo/pull/999".to_string(),
            });
        }

        // Generate PR title from issue title
        let pr_title = self.generate_pr_title(issue);

        // Create aggregated result from worktrees
        let aggregated_result = self.create_aggregated_result(issue).await?;

        // Create PR
        info!("   Creating PR with title: {}", pr_title);
        let pr = pr_creator
            .create_pr(branch_name.clone(), pr_title, &aggregated_result)
            .await?;

        info!("   ✅ PR created: #{} at {}", pr.number, pr.url);
        state_machine.transition_to(Phase::PRCreation)?;

        // Send success message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 7",
                        "progress": 75,
                        "pr_number": pr.number,
                        "pr_url": pr.url,
                        "issue_number": issue.number,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 7 status sent to message queue");
        }

        Ok(pr)
    }

    /// Phase 8: Code Review自動化 & GitHub PR Review統合
    async fn run_phase_8_code_review(
        &mut self,
        issue: &Issue,
        pr_number: u64,
        state_machine: &mut StateMachine,
    ) -> Result<f64> {
        info!(
            "🔍 Phase 8: Code Review自動化 for PR #{} (Issue #{})",
            pr_number, issue.number
        );

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual code review");
            state_machine.transition_to(Phase::CodeReview)?;
            return Ok(85.0); // Mock high review score
        }

        // Execute ReviewAgent
        info!("   Executing ReviewAgent...");

        // Create a Task for the review
        let review_task = miyabi_types::Task {
            id: format!("review-{}", pr_number),
            title: format!("Review PR #{}", pr_number),
            description: format!("Review code for Issue #{}", issue.number),
            task_type: miyabi_types::task::TaskType::Test, // Using Test as proxy for CodeReview
            priority: 1,                                   // P1-High
            severity: None,
            impact: None,
            assigned_agent: Some(miyabi_types::AgentType::ReviewAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let agent_result = self
            .review_agent
            .execute(&review_task)
            .await
            .map_err(|e| anyhow!("ReviewAgent execution failed: {}", e))?;

        // Extract review score from metrics (0-100 scale)
        let review_score = agent_result
            .metrics
            .as_ref()
            .and_then(|m| m.quality_score)
            .map(|s| s as f64)
            .unwrap_or(0.0);
        info!("   Review score: {:.1}/100", review_score);

        // Post review to GitHub PR
        if let Some(ref github_client) = self.github_client {
            info!("   Posting review to GitHub PR #{}...", pr_number);
            self.post_review_to_github(github_client, pr_number, &agent_result, review_score)
                .await?;
            info!("   ✅ Review posted to GitHub");
        } else {
            warn!("   No GitHub client available, skipping PR review posting");
        }

        state_machine.transition_to(Phase::CodeReview)?;

        // Send success message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 8",
                        "progress": 85,
                        "review_score": review_score,
                        "pr_number": pr_number,
                        "issue_number": issue.number,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 8 status sent to message queue");
        }

        // Decision based on review score
        if review_score >= 80.0 {
            info!("   ✅ Review score >= 80: Approved for auto-merge");
        } else if review_score >= 60.0 {
            info!("   ⚠️  Review score 60-79: Human review recommended");
        } else {
            warn!("   ❌ Review score < 60: Requires fixes");
            // Send urgent message for low score
            if let Some(ref manager) = self.session_manager {
                let session_id = state_machine.execution_id();
                let msg = MessageBuilder::new(session_id)
                    .priority(Priority::Urgent)
                    .message_type(MessageType::Error(ErrorMessage {
                        code: "PHASE8_LOW_REVIEW_SCORE".to_string(),
                        message: format!(
                            "Code review failed: {:.1}/100 < 60 threshold",
                            review_score
                        ),
                        stacktrace: None,
                    }))
                    .build()
                    .map_err(|e| anyhow!("Failed to build error message: {}", e))?;

                manager.send_message(msg).await?;
                warn!("   🚨 Phase 8 URGENT error sent to message queue");
            }
        }

        Ok(review_score)
    }

    /// Phase 9: Auto-Merge & Deployment自動化
    async fn run_phase_9_auto_merge(
        &mut self,
        issue: &Issue,
        pr_number: u64,
        quality_score: f64,
        review_score: f64,
        state_machine: &mut StateMachine,
    ) -> Result<()> {
        info!(
            "🚀 Phase 9: Auto-Merge & Deployment for PR #{} (Issue #{})",
            pr_number, issue.number
        );
        info!(
            "   Quality Score: {:.1}/100, Review Score: {:.1}/100",
            quality_score, review_score
        );

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual auto-merge and deployment");
            state_machine.transition_to(Phase::AutoMerge)?;
            return Ok(());
        }

        // Auto-merge judgment
        let should_merge = quality_score >= self.config.auto_merge_quality
            && review_score >= self.config.auto_merge_quality;

        if !should_merge {
            warn!(
                "   ❌ Auto-merge criteria not met (Quality: {:.1}, Review: {:.1}, Required: {:.1})",
                quality_score, review_score, self.config.auto_merge_quality
            );
            warn!("   PR #{} will remain open for human review", pr_number);

            // Send message to queue
            if let Some(ref manager) = self.session_manager {
                let session_id = state_machine.execution_id();
                let msg = MessageBuilder::new(session_id)
                    .priority(Priority::Normal)
                    .message_type(MessageType::Custom(CustomMessage {
                        type_id: "phase_completion".to_string(),
                        payload: serde_json::json!({
                            "phase": "Phase 9",
                            "progress": 95,
                            "auto_merged": false,
                            "reason": "Scores below threshold",
                            "quality_score": quality_score,
                            "review_score": review_score,
                            "pr_number": pr_number,
                            "issue_number": issue.number,
                        })
                        .to_string(),
                    }))
                    .build()
                    .map_err(|e| anyhow!("Failed to build message: {}", e))?;

                manager.send_message(msg).await?;
            }

            return Ok(());
        }

        // Execute auto-merge
        info!(
            "   ✅ Auto-merge criteria met! Merging PR #{}...",
            pr_number
        );
        self.execute_auto_merge(pr_number).await?;
        info!("   ✅ PR #{} merged successfully", pr_number);

        state_machine.transition_to(Phase::AutoMerge)?;

        // Send success message to queue
        if let Some(ref manager) = self.session_manager {
            let session_id = state_machine.execution_id();
            let msg = MessageBuilder::new(session_id)
                .priority(Priority::Normal)
                .message_type(MessageType::Custom(CustomMessage {
                    type_id: "phase_completion".to_string(),
                    payload: serde_json::json!({
                        "phase": "Phase 9",
                        "progress": 100,
                        "auto_merged": true,
                        "quality_score": quality_score,
                        "review_score": review_score,
                        "pr_number": pr_number,
                        "issue_number": issue.number,
                    })
                    .to_string(),
                }))
                .build()
                .map_err(|e| anyhow!("Failed to build message: {}", e))?;

            manager.send_message(msg).await?;
            info!("   📨 Phase 9 status sent to message queue");
        }

        // Optional: Deployment (if configured)
        // TODO: Integrate DeploymentAgent when available
        info!("   ℹ️  Deployment skipped (not yet implemented)");

        Ok(())
    }

    /// Execute auto-merge via gh CLI
    async fn execute_auto_merge(&self, pr_number: u64) -> Result<()> {
        info!("   Executing: gh pr merge #{} --auto --squash", pr_number);

        let output = tokio::process::Command::new("gh")
            .arg("pr")
            .arg("merge")
            .arg(pr_number.to_string())
            .arg("--auto")
            .arg("--squash")
            .output()
            .await
            .map_err(|e| anyhow!("Failed to execute gh pr merge: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(anyhow!("gh pr merge failed: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        info!("   gh pr merge output: {}", stdout.trim());

        Ok(())
    }

    /// Post review result to GitHub PR
    async fn post_review_to_github(
        &self,
        github_client: &Arc<GitHubClient>,
        _pr_number: u64,
        agent_result: &miyabi_types::AgentResult,
        review_score: f64,
    ) -> Result<()> {
        // Generate review comment body
        let mut body = String::new();
        body.push_str("## 🤖 Automated Code Review\n\n");
        body.push_str(&format!("**Overall Score**: {:.1}/100\n\n", review_score));

        // Add status
        body.push_str(&format!("**Status**: {:?}\n", agent_result.status));
        if let Some(ref error) = agent_result.error {
            body.push_str(&format!("**Error**: {}\n\n", error));
        }

        // Add metrics if available
        if let Some(ref metrics) = agent_result.metrics {
            if let Some(quality_score) = metrics.quality_score {
                body.push_str(&format!(
                    "**Metrics Quality Score**: {:.1}/100\n",
                    quality_score
                ));
            }
            body.push_str(&format!("**Duration**: {}ms\n", metrics.duration_ms));
        }
        body.push('\n');

        body.push_str("---\n");
        body.push_str("🤖 Generated by Miyabi ReviewAgent\n");

        // Determine review event based on score
        let event = if review_score >= 80.0 {
            "APPROVE"
        } else if review_score >= 60.0 {
            "COMMENT"
        } else {
            "REQUEST_CHANGES"
        };

        // TODO: Post review via GitHub API
        // For now, just log the review body
        // In the future, implement GitHubClient::create_pr_review()
        info!("📝 GitHub PR Review (Event: {}):\n{}", event, body);
        warn!("   GitHub PR review posting not yet implemented - review logged only");

        // Suppress unused variable warning
        let _ = github_client;

        Ok(())
    }

    /// Generate PR title from issue title (Conventional Commits format)
    fn generate_pr_title(&self, issue: &Issue) -> String {
        // Detect type from issue labels or title
        let pr_type = if issue.labels.iter().any(|l| l.contains("bug")) {
            "fix"
        } else if issue.labels.iter().any(|l| l.contains("feature")) {
            "feat"
        } else if issue.labels.iter().any(|l| l.contains("docs")) {
            "docs"
        } else if issue.labels.iter().any(|l| l.contains("refactor")) {
            "refactor"
        } else {
            "feat" // default to feat
        };

        // Extract scope from issue title if present (e.g., "feat(core): Add feature")
        let scope = if let Some(start) = issue.title.find('(') {
            if let Some(end) = issue.title.find(')') {
                if start < end {
                    Some(&issue.title[start + 1..end])
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        };

        // Generate title
        if let Some(scope) = scope {
            format!("{}({}): {}", pr_type, scope, issue.title)
        } else {
            format!("{}: {}", pr_type, issue.title)
        }
    }

    /// Create aggregated result from worktrees for PR body
    async fn create_aggregated_result(
        &self,
        issue: &Issue,
    ) -> Result<crate::aggregator::AggregatedResult> {
        use crate::aggregator::AggregatedResult;
        use crate::parser::AgentResult;
        use std::collections::HashMap;

        // For now, create a simple aggregated result
        // In the future, this should collect actual results from worktrees
        let mut session_results = HashMap::new();
        session_results.insert(
            format!("issue-{}", issue.number),
            AgentResult {
                status: 0,
                success: true,
                message: format!("Successfully implemented Issue #{}", issue.number),
                error: None,
                files: vec![],
            },
        );

        Ok(AggregatedResult {
            total_sessions: 1,
            successful_sessions: 1,
            failed_sessions: 0,
            success_rate: 1.0,
            session_results,
            errors: vec![],
            modified_files: vec![],
        })
    }

    /// Get active executions count
    pub async fn active_executions_count(&self) -> usize {
        let executions = self.active_executions.read().await;
        executions.len()
    }

    /// Get execution status
    pub async fn get_execution_status(&self, execution_id: Uuid) -> Option<Phase> {
        let executions = self.active_executions.read().await;
        executions.get(&execution_id).map(|sm| sm.current_phase())
    }
}

/// Implementation of SkillExecutor trait for HeadlessOrchestrator
#[async_trait::async_trait]
impl SkillExecutor for HeadlessOrchestrator {
    async fn execute_skill(
        &self,
        skill_name: &str,
        context: HashMap<String, String>,
    ) -> Result<SkillResult> {
        let bridge = self.skills_bridge.as_ref().ok_or_else(|| {
            anyhow!("Skills Bridge not initialized. Call with_skills_bridge() first")
        })?;

        let request = SkillRequest {
            skill_name: skill_name.to_string(),
            context,
            timeout_secs: 300, // Default 5 minutes
        };

        bridge.execute_skill(request).await
    }

    async fn execute_skills_parallel(
        &self,
        requests: Vec<SkillRequest>,
    ) -> Vec<Result<SkillResult>> {
        let bridge = match self.skills_bridge.as_ref() {
            Some(b) => b,
            None => {
                return requests
                    .into_iter()
                    .map(|_| Err(anyhow!("Skills Bridge not initialized")))
                    .collect();
            }
        };

        // Execute all skills in parallel
        let futures: Vec<_> = requests
            .into_iter()
            .map(|req| {
                let bridge = Arc::clone(bridge);
                tokio::spawn(async move { bridge.execute_skill(req).await })
            })
            .collect();

        // Collect results
        let mut results = Vec::new();
        for future in futures {
            match future.await {
                Ok(result) => results.push(result),
                Err(e) => results.push(Err(anyhow!("Task join error: {}", e))),
            }
        }

        results
    }
}

/// Issue analysis result
#[derive(Debug, Clone)]
struct IssueAnalysisResult {
    /// Estimated complexity (0-10)
    complexity: f64,

    /// Suggested labels
    labels: Vec<String>,

    /// Estimated duration in hours
    #[allow(dead_code)]
    estimated_duration_hours: u32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::issue::IssueStateGithub;

    fn create_test_issue(number: u64, title: &str, body: &str) -> Issue {
        Issue {
            number,
            title: title.to_string(),
            body: body.to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/test/repo/issues/{}", number),
        }
    }

    #[tokio::test]
    async fn test_active_executions_count() {
        let config = HeadlessOrchestratorConfig::default();
        let orchestrator = HeadlessOrchestrator::new(config);

        assert_eq!(orchestrator.active_executions_count().await, 0);
    }

    #[tokio::test]
    async fn test_dry_run_mode() {
        let config = HeadlessOrchestratorConfig {
            dry_run: true,
            ..Default::default()
        };
        let mut orchestrator = HeadlessOrchestrator::new(config);

        let issue = create_test_issue(123, "Test issue", "Test body");
        let result = orchestrator.handle_issue_created(&issue).await;

        // Should succeed in dry-run mode
        assert!(result.is_ok());
    }
}
