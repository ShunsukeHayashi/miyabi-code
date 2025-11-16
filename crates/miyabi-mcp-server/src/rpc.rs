//! JSON-RPC types and method handlers

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

use miyabi_agents::CoordinatorAgent;
use miyabi_github::GitHubClient;
use miyabi_types::{AgentConfig, Issue};
use octocrab::params::State;

use crate::config::ServerConfig;
use crate::error::{Result, ServerError};

/// Agent execution parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecuteParams {
    /// Issue number to execute on
    pub issue_number: u64,

    /// Optional agent-specific configuration
    #[serde(default)]
    pub config: Option<serde_json::Value>,
}

/// Agent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecuteResult {
    /// Execution status
    pub status: String,

    /// Number of tasks created (for Coordinator)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tasks_created: Option<usize>,

    /// Execution time in milliseconds
    pub execution_time_ms: u64,

    /// Agent type
    pub agent_type: String,

    /// Optional result data (JSON)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,

    /// Optional error message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Issue fetch parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueFetchParams {
    /// Issue number
    pub issue_number: u64,
}

/// Issue list parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueListParams {
    /// Filter by state (open, closed, all)
    #[serde(default = "default_state")]
    pub state: String,

    /// Maximum number of issues to return
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_state() -> String {
    "open".to_string()
}

fn default_limit() -> usize {
    30
}

/// Issue response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueResponse {
    pub number: u64,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub labels: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<&Issue> for IssueResponse {
    fn from(issue: &Issue) -> Self {
        use miyabi_types::issue::IssueStateGithub;

        let state_str = match issue.state {
            IssueStateGithub::Open => "open".to_string(),
            IssueStateGithub::Closed => "closed".to_string(),
        };

        Self {
            number: issue.number,
            title: issue.title.clone(),
            body: Some(issue.body.clone()),
            state: state_str,
            labels: issue.labels.clone(),
            created_at: issue.created_at.to_rfc3339(),
            updated_at: issue.updated_at.to_rfc3339(),
        }
    }
}

/// Health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    /// Server status
    pub status: String,

    /// Server version
    pub version: String,

    /// GitHub connection status
    pub github_connected: bool,

    /// Uptime in seconds
    pub uptime_seconds: u64,
}

/// Knowledge search parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchParams {
    /// Search query
    pub query: String,

    /// Workspace filter (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workspace: Option<String>,

    /// Agent filter (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,

    /// Issue number filter (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<u32>,

    /// Task type filter (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_type: Option<String>,

    /// Outcome filter (optional, "success" or "failed")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outcome: Option<String>,

    /// Maximum number of results (default: 10)
    #[serde(default = "default_search_limit")]
    pub limit: usize,
}

fn default_search_limit() -> usize {
    10
}

/// Knowledge search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSearchResult {
    /// Entry ID
    pub id: String,

    /// Similarity score (0.0-1.0)
    pub score: f32,

    /// Content
    pub content: String,

    /// Metadata
    pub metadata: KnowledgeMetadata,

    /// Timestamp
    pub timestamp: String,
}

/// Knowledge metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeMetadata {
    /// Workspace name
    pub workspace: String,

    /// Worktree (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree: Option<String>,

    /// Agent (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,

    /// Issue number (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<u32>,

    /// Task type (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_type: Option<String>,

    /// Outcome (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outcome: Option<String>,
}

/// RPC handler context
pub struct RpcContext {
    config: Arc<ServerConfig>,
    github_client: Arc<GitHubClient>,
    start_time: std::time::Instant,
}

impl RpcContext {
    /// Create new RPC context
    pub fn new(config: ServerConfig) -> Result<Self> {
        let github_client =
            GitHubClient::new(&config.github_token, &config.repo_owner, &config.repo_name)
                .map_err(|e| ServerError::GitHub(e.to_string()))?;

        Ok(Self {
            config: Arc::new(config),
            github_client: Arc::new(github_client),
            start_time: std::time::Instant::now(),
        })
    }

    /// Execute Coordinator Agent
    pub async fn execute_coordinator(
        &self,
        params: AgentExecuteParams,
    ) -> Result<AgentExecuteResult> {
        let start = std::time::Instant::now();

        tracing::info!("Executing Coordinator Agent on Issue #{}", params.issue_number);

        // Fetch issue
        let issue = self
            .github_client
            .get_issue(params.issue_number)
            .await
            .map_err(|e| ServerError::GitHub(e.to_string()))?;

        // Create agent config
        let agent_config = AgentConfig {
            device_identifier: self
                .config
                .device_identifier
                .clone()
                .unwrap_or_else(|| "mcp-server".to_string()),
            github_token: self.config.github_token.clone(),
            repo_owner: Some(self.config.repo_owner.clone()),
            repo_name: Some(self.config.repo_name.clone()),
            use_task_tool: false,
            use_worktree: true,
            worktree_base_path: Some(PathBuf::from(".worktrees")),
            log_directory: self.config.working_dir.join("logs").to_string_lossy().to_string(),
            report_directory: self.config.working_dir.join("reports").to_string_lossy().to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        };

        // Create and execute agent
        let coordinator = CoordinatorAgent::new(agent_config);

        // Execute coordinator agent - decompose issue into tasks
        let result = coordinator.decompose_issue(&issue).await.map_err(ServerError::Agent)?;

        let execution_time_ms = start.elapsed().as_millis() as u64;

        // Extract tasks created from decomposition result
        let tasks_created = Some(result.tasks.len());

        // Convert result to JSON
        let data = serde_json::to_value(&result).ok();

        Ok(AgentExecuteResult {
            status: "success".to_string(),
            tasks_created,
            execution_time_ms,
            agent_type: "coordinator".to_string(),
            data,
            error: None,
        })
    }

    /// Fetch issue by number
    pub async fn fetch_issue(&self, params: IssueFetchParams) -> Result<IssueResponse> {
        let issue = self
            .github_client
            .get_issue(params.issue_number)
            .await
            .map_err(|e| ServerError::GitHub(e.to_string()))?;

        Ok(IssueResponse::from(&issue))
    }

    /// List issues
    pub async fn list_issues(&self, params: IssueListParams) -> Result<Vec<IssueResponse>> {
        let state = match params.state.as_str() {
            "open" => Some(State::Open),
            "closed" => Some(State::Closed),
            "all" => Some(State::All),
            _ => Some(State::Open),
        };

        // Fetch all issues (no label filter for now)
        let issues = self
            .github_client
            .list_issues(state, vec![])
            .await
            .map_err(|e| ServerError::GitHub(e.to_string()))?;

        // Apply limit
        let limited_issues: Vec<_> = issues.into_iter().take(params.limit).collect();

        Ok(limited_issues.iter().map(IssueResponse::from).collect())
    }

    /// Health check
    pub async fn health_check(&self) -> Result<HealthCheckResult> {
        // Test GitHub connection by trying to get an issue
        let github_connected = self.github_client.get_issue(1).await.is_ok();

        let uptime_seconds = self.start_time.elapsed().as_secs();

        Ok(HealthCheckResult {
            status: "healthy".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            github_connected,
            uptime_seconds,
        })
    }

    /// Search knowledge base
    pub async fn search_knowledge(
        &self,
        params: KnowledgeSearchParams,
    ) -> Result<Vec<KnowledgeSearchResult>> {
        use miyabi_knowledge::searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter};
        use miyabi_knowledge::KnowledgeConfig;

        tracing::info!("Searching knowledge base: {}", params.query);

        // Load config
        let config = KnowledgeConfig::default();

        // Initialize searcher
        let searcher = QdrantSearcher::new(config)
            .await
            .map_err(|e| ServerError::Knowledge(e.to_string()))?;

        // Build filter
        let mut filter = SearchFilter::new();
        if let Some(w) = params.workspace {
            filter = filter.with_workspace(w);
        }
        if let Some(a) = params.agent {
            filter = filter.with_agent(a);
        }
        if let Some(i) = params.issue_number {
            filter = filter.with_issue_number(i);
        }
        if let Some(t) = params.task_type {
            filter = filter.with_task_type(t);
        }
        if let Some(o) = params.outcome {
            filter = filter.with_outcome(o);
        }

        // Search
        let results = searcher
            .search_filtered(&params.query, filter)
            .await
            .map_err(|e| ServerError::Knowledge(e.to_string()))?;

        // Convert to MCP result format
        let mcp_results: Vec<KnowledgeSearchResult> = results
            .into_iter()
            .take(params.limit)
            .map(|r| KnowledgeSearchResult {
                id: r.id.to_string(),
                score: r.score,
                content: r.content,
                metadata: KnowledgeMetadata {
                    workspace: r.metadata.workspace,
                    worktree: r.metadata.worktree,
                    agent: r.metadata.agent,
                    issue_number: r.metadata.issue_number,
                    task_type: r.metadata.task_type,
                    outcome: r.metadata.outcome,
                },
                timestamp: r.timestamp.to_rfc3339(),
            })
            .collect();

        tracing::info!("Found {} results", mcp_results.len());

        Ok(mcp_results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_execute_params_deserialization() {
        let json = r#"{"issue_number": 270}"#;
        let params: AgentExecuteParams = serde_json::from_str(json).unwrap();
        assert_eq!(params.issue_number, 270);
        assert!(params.config.is_none());
    }

    #[test]
    fn test_issue_list_params_defaults() {
        let json = r#"{}"#;
        let params: IssueListParams = serde_json::from_str(json).unwrap();
        assert_eq!(params.state, "open");
        assert_eq!(params.limit, 30);
    }

    #[test]
    fn test_agent_execute_result_serialization() {
        let result = AgentExecuteResult {
            status: "success".to_string(),
            tasks_created: Some(5),
            execution_time_ms: 1234,
            agent_type: "coordinator".to_string(),
            data: None,
            error: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("success"));
        assert!(json.contains("1234"));
    }
}
