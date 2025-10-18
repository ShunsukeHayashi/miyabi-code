//! Miyabi integration layer for Codex CLI.
//! This crate provides a thin facade (`MiyabiClient`) to interact with
//! Miyabi Rust Edition crates from external callers (e.g., Codex CLI).

use miyabi_agents::{BaseAgent, coordinator::CoordinatorAgent};
use miyabi_github::GitHubClient;
use miyabi_types::{AgentConfig, AgentType, Task};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Config {
    /// Optional working directory for operations.
    pub workdir: Option<String>,
    /// GitHub token used by downstream components.
    pub github_token: Option<String>,
    /// GitHub repository owner
    pub repo_owner: Option<String>,
    /// GitHub repository name
    pub repo_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Status {
    pub ok: bool,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentKind {
    Coordinator,
    CodeGen,
    Review,
    Issue,
    PR,
    Deployment,
    Test,
    #[serde(untagged)]
    Custom(String),
}

impl From<AgentKind> for AgentType {
    fn from(kind: AgentKind) -> Self {
        match kind {
            AgentKind::Coordinator => AgentType::CoordinatorAgent,
            AgentKind::CodeGen => AgentType::CodeGenAgent,
            AgentKind::Review => AgentType::ReviewAgent,
            AgentKind::Issue => AgentType::IssueAgent,
            AgentKind::PR => AgentType::PRAgent,
            AgentKind::Deployment => AgentType::DeploymentAgent,
            AgentKind::Test => AgentType::TestAgent,
            AgentKind::Custom(_) => AgentType::CoordinatorAgent, // Default
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionReport {
    pub agent: AgentKind,
    pub issue: Option<u64>,
    pub message: String,
}

#[derive(Debug, Error)]
pub enum IntegrationError {
    #[error("not implemented: {0}")]
    NotImplemented(&'static str),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

pub struct MiyabiClient {
    config: Config,
}

impl MiyabiClient {
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    /// Return basic health/status information.
    pub async fn status(&self) -> Result<Status, IntegrationError> {
        Ok(Status {
            ok: true,
            version: env!("CARGO_PKG_VERSION").to_string(),
        })
    }

    /// Execute a Miyabi agent with optional issue number.
    pub async fn execute_agent(
        &self,
        agent_kind: AgentKind,
        issue: Option<u64>,
    ) -> Result<ExecutionReport, IntegrationError> {
        // Convert AgentKind to AgentType
        let agent_type: AgentType = agent_kind.clone().into();

        // Require GitHub token for agent execution
        let token = self.config.github_token.as_ref().ok_or_else(|| {
            IntegrationError::Other(anyhow::anyhow!(
                "GitHub token is required for agent execution"
            ))
        })?;

        // Require repo_owner and repo_name
        let (owner, repo) = match (&self.config.repo_owner, &self.config.repo_name) {
            (Some(o), Some(r)) => (o.clone(), r.clone()),
            _ => {
                return Err(IntegrationError::Other(anyhow::anyhow!(
                    "repo_owner and repo_name are required for agent execution"
                )));
            }
        };

        // Create agent config
        let config = AgentConfig {
            agent_type,
            github_token: token.clone(),
            repo_owner: owner,
            repo_name: repo,
            issue_number: issue,
        };

        // Initialize GitHub client
        let github_client = GitHubClient::new(token.clone())
            .map_err(|e| IntegrationError::Other(anyhow::anyhow!("GitHub client error: {}", e)))?;

        // Create coordinator agent (for now, always use Coordinator)
        let coordinator = CoordinatorAgent::new(config.clone(), github_client);

        // Execute agent with a dummy task (Task is created internally by CoordinatorAgent)
        let dummy_task = Task::default();
        let result = coordinator
            .execute(dummy_task)
            .await
            .map_err(|e| IntegrationError::Other(anyhow::anyhow!("Agent execution failed: {}", e)))?;

        Ok(ExecutionReport {
            agent: agent_kind,
            issue,
            message: format!("Agent executed successfully: {:?}", result),
        })
    }
}

// -------- Worktree (Mock) --------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub name: String,
    pub issue: Option<u64>,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeActionResult {
    pub ok: bool,
    pub message: String,
    pub issue: Option<u64>,
    pub worktree: Option<WorktreeInfo>,
}

impl MiyabiClient {
    pub async fn worktree_list(&self) -> Result<Vec<WorktreeInfo>, IntegrationError> {
        let base = self
            .config
            .workdir
            .clone()
            .unwrap_or_else(|| ".".to_string());
        let wt = WorktreeInfo {
            name: "example-issue-123".to_string(),
            issue: Some(123),
            path: format!("{}/.worktrees/issue-123", base),
        };
        Ok(vec![wt])
    }

    pub async fn worktree_create(&self, issue: u64) -> Result<WorktreeActionResult, IntegrationError> {
        let base = self
            .config
            .workdir
            .clone()
            .unwrap_or_else(|| ".".to_string());
        let wt = WorktreeInfo {
            name: format!("issue-{}", issue),
            issue: Some(issue),
            path: format!("{}/.worktrees/issue-{}", base, issue),
        };
        Ok(WorktreeActionResult {
            ok: true,
            message: "created (mock)".to_string(),
            issue: Some(issue),
            worktree: Some(wt),
        })
    }

    pub async fn worktree_cleanup(&self, issue: u64) -> Result<WorktreeActionResult, IntegrationError> {
        Ok(WorktreeActionResult {
            ok: true,
            message: "cleanup scheduled (mock)".to_string(),
            issue: Some(issue),
            worktree: None,
        })
    }
}
