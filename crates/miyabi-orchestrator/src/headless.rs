//! Headless Orchestrator for Autonomous Workflow Execution
//!
//! This module implements the main orchestrator that controls the entire
//! autonomous workflow from Issue creation to PR merge.

use crate::claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig};
use crate::decision::{Decision, DecisionEngine};
use crate::notification::{Notification, NotificationService};
use crate::state_machine::{Phase, StateMachine};
use anyhow::{anyhow, Result};
use miyabi_agent_coordinator::coordinator::CoordinatorAgent;
use miyabi_agent_issue::IssueAgent;
use miyabi_github::client::GitHubClient;
use miyabi_session_manager::{SessionManager, SessionContext};
use miyabi_worktree::{WorktreeInfo, WorktreeManager};
use miyabi_types::{AgentConfig, Issue};
use miyabi_types::task::TaskDecomposition;
use serde::{Deserialize, Serialize};
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

    /// Active state machines
    active_executions: Arc<RwLock<std::collections::HashMap<Uuid, StateMachine>>>,
}

impl HeadlessOrchestrator {
    /// Create a new headless orchestrator
    pub fn new(config: HeadlessOrchestratorConfig) -> Self {
        info!("🚀 Initializing Headless Orchestrator");
        info!("   Autonomous mode: {}", config.autonomous_mode);
        info!("   Auto-approve threshold: {}", config.auto_approve_complexity);
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
            notification_service: NotificationService::new(),
            claude_code_executor,
            session_manager: None, // Will be initialized via with_session_manager()
            config,
            agent_config,
            github_client: None,
            worktree_manager,
            active_executions: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Enable SessionManager for Agent-to-Agent handoff
    pub async fn with_session_manager(mut self) -> Result<Self> {
        if !self.config.dry_run {
            let session_manager = SessionManager::new(".ai/sessions").await?;
            info!("   SessionManager initialized: .ai/sessions/");
            self.session_manager = Some(Arc::new(session_manager));
        } else {
            info!("   Dry-run mode: SessionManager disabled");
        }
        Ok(self)
    }

    /// Create with GitHub client for label automation
    pub fn with_github_client(
        config: HeadlessOrchestratorConfig,
        github_client: GitHubClient,
    ) -> Self {
        info!("🚀 Initializing Headless Orchestrator with GitHub integration");
        info!("   Autonomous mode: {}", config.autonomous_mode);
        info!("   Auto-approve threshold: {}", config.auto_approve_complexity);
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

        Self {
            decision_engine: DecisionEngine::new(),
            issue_agent: IssueAgent::new(),
            coordinator_agent: CoordinatorAgent::new(agent_config.clone()),
            notification_service: NotificationService::new(),
            claude_code_executor,
            session_manager: None, // Will be initialized via with_session_manager()
            config,
            agent_config,
            github_client: Some(Arc::new(github_client)),
            worktree_manager,
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
        let analysis_result = self.run_phase_1_issue_analysis(issue, &mut state_machine).await?;

        // Check complexity and decide
        let decision = self.decision_engine.should_auto_approve(
            analysis_result.complexity,
            issue.number,
        );

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
                let decomposition = self.run_phase_2_task_decomposition(issue, &mut state_machine).await?;

                info!("✅ Phase 2 complete: {} tasks generated", decomposition.tasks.len());

                // Continue to Phase 3: Worktree Creation (if multiple tasks and worktree enabled)
                if decomposition.tasks.len() > 1 {
                    if self.worktree_manager.is_some() {
                        let worktrees = self.run_phase_3_worktree_creation(issue, &decomposition, &mut state_machine).await?;
                        info!("✅ Phase 3 complete: {} worktrees created", decomposition.tasks.len());

                        // Continue to Phase 4: CodeGen Execution (5-Worlds parallel)
                        if self.claude_code_executor.is_some() && !worktrees.is_empty() {
                            let execution_result = self.run_phase_4_codegen_execution(issue, &worktrees, &mut state_machine).await?;
                            info!("✅ Phase 4 complete: {}% confidence ({}/{} worlds succeeded)",
                                  (execution_result.confidence * 100.0).round(),
                                  execution_result.successful_worlds,
                                  execution_result.total_worlds);
                        } else {
                            info!("⏭️  Phase 4 skipped: ClaudeCodeExecutor not initialized or no worktrees");
                        }
                    } else {
                        info!("⏭️  Phase 3 skipped: Single-threaded execution (no worktree manager)");
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
                let decomposition = self.run_phase_2_task_decomposition(issue, &mut state_machine).await?;

                info!("✅ Phase 2 complete: {} tasks generated", decomposition.tasks.len());

                // Continue to Phase 3: Worktree Creation (if multiple tasks and worktree enabled)
                if decomposition.tasks.len() > 1 {
                    if self.worktree_manager.is_some() {
                        let worktrees = self.run_phase_3_worktree_creation(issue, &decomposition, &mut state_machine).await?;
                        info!("✅ Phase 3 complete: {} worktrees created", decomposition.tasks.len());

                        // Continue to Phase 4: CodeGen Execution (5-Worlds parallel)
                        if self.claude_code_executor.is_some() && !worktrees.is_empty() {
                            let execution_result = self.run_phase_4_codegen_execution(issue, &worktrees, &mut state_machine).await?;
                            info!("✅ Phase 4 complete: {}% confidence ({}/{} worlds succeeded)",
                                  (execution_result.confidence * 100.0).round(),
                                  execution_result.successful_worlds,
                                  execution_result.total_worlds);
                        } else {
                            info!("⏭️  Phase 4 skipped: ClaudeCodeExecutor not initialized or no worktrees");
                        }
                    } else {
                        info!("⏭️  Phase 3 skipped: Single-threaded execution (no worktree manager)");
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

        info!("   Complexity: {:.1}/10.0 ({:?})", analysis.complexity, analysis.complexity_level);
        info!("   Suggested labels: {:?}", analysis.labels);
        info!("   Estimated duration: {} hours", analysis.estimated_duration_hours);
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

        info!("🏷️  Applying labels to Issue #{}: {:?}", issue_number, labels);

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
        info!("   Estimated total duration: {} minutes", decomposition.estimated_total_duration);
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

        Ok(decomposition)
    }

    /// Phase 3: Worktree Creation & Branch Setup
    async fn run_phase_3_worktree_creation(
        &self,
        issue: &Issue,
        decomposition: &TaskDecomposition,
        state_machine: &mut StateMachine,
    ) -> Result<Vec<WorktreeInfo>> {
        info!("🌳 Phase 3: Worktree Creation for {} tasks", decomposition.tasks.len());

        let worktree_manager = self.worktree_manager.as_ref()
            .ok_or_else(|| anyhow!("WorktreeManager not initialized"))?;

        if self.config.dry_run {
            info!("   [DRY-RUN] Skipping actual worktree creation");
            state_machine.transition_to(Phase::WorktreeCreation)?;
            return Ok(vec![]);
        }

        let mut worktrees = Vec::new();

        // Create a worktree for each task
        for (idx, task) in decomposition.tasks.iter().enumerate() {
            info!("   Creating worktree {}/{}: {}", idx + 1, decomposition.tasks.len(), task.title);

            // Create worktree for this task
            let worktree = worktree_manager.create_worktree(issue.number).await?;

            info!("     ✅ Worktree created: {:?}", worktree.path);
            info!("     📍 Branch: {}", worktree.branch_name);

            // TODO: Inject task context (.agent-context.json)
            // self.inject_task_context(&worktree, task, decomposition).await?;

            worktrees.push(worktree);
        }

        state_machine.transition_to(Phase::WorktreeCreation)?;

        Ok(worktrees)
    }

    /// Phase 4: CodeGen Execution & 5-Worlds Parallel Implementation
    async fn run_phase_4_codegen_execution(
        &mut self,
        issue: &Issue,
        worktrees: &[WorktreeInfo],
        state_machine: &mut StateMachine,
    ) -> Result<crate::claude_code_executor::ExecutionResult> {
        info!("🚀 Phase 4: CodeGen Execution (5-Worlds Parallel) for #{}", issue.number);
        info!("   Worktrees: {:?}", worktrees.iter().map(|w| &w.path).collect::<Vec<_>>());

        let executor = self.claude_code_executor.as_mut()
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
        let base_worktree = worktrees.first()
            .ok_or_else(|| anyhow!("No worktrees available for Phase 4"))?;

        info!("   Base worktree: {:?}", base_worktree.path);
        info!("   Executing 5-Worlds parallel execution...");

        // Execute agent run with 5-Worlds parallel execution
        let execution_result = executor
            .execute_agent_run(issue.number as u32, base_worktree.path.clone())
            .await?;

        info!("   5-Worlds execution complete:");
        info!("     Success: {}", execution_result.success);
        info!("     Confidence: {}%", (execution_result.confidence * 100.0).round());
        info!("     Successful worlds: {}/{}", execution_result.successful_worlds, execution_result.total_worlds);

        // Display individual world results
        for world_result in &execution_result.world_results {
            let status_icon = if world_result.success { "✅" } else { "❌" };
            info!("     {} World {}: {}", status_icon, world_result.world_id, world_result.message);
        }

        if execution_result.success {
            info!("   ✅ Phase 4 succeeded: Confidence threshold met ({}% >= 80%)",
                  (execution_result.confidence * 100.0).round());
            state_machine.transition_to(Phase::CodeGeneration)?;
        } else {
            warn!("   ⚠️  Phase 4 failed: Confidence threshold not met ({}% < 80%)",
                  (execution_result.confidence * 100.0).round());
            warn!("   Escalating to human review");

            // Send escalation notification
            let notification = Notification::escalation(
                issue.number,
                0.0, // No complexity score for Phase 4 failures
                format!("5-Worlds execution failed: {}% confidence ({}/{} worlds succeeded)",
                       (execution_result.confidence * 100.0).round(),
                       execution_result.successful_worlds,
                       execution_result.total_worlds),
            );
            self.notification_service.send(&notification).await?;
        }

        Ok(execution_result)
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
        let orchestrator = HeadlessOrchestrator::new(config);

        let issue = create_test_issue(123, "Test issue", "Test body");
        let result = orchestrator.handle_issue_created(&issue).await;

        // Should succeed in dry-run mode
        assert!(result.is_ok());
    }
}
