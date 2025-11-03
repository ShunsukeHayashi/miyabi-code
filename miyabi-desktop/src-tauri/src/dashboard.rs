use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Worktree information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub total: usize,
    pub active: usize,
    pub stale: usize,
    pub names: Vec<String>,
}

/// Agent execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecution {
    pub name: String,
    pub status: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub issue_number: Option<u32>,
}

/// Agent statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStats {
    pub total: usize,
    pub running: usize,
    pub completed: usize,
    pub failed: usize,
    pub recent: Vec<AgentExecution>,
}

/// Issue information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueInfo {
    pub number: u32,
    pub title: String,
    pub state: String,
    pub labels: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Issue statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueStats {
    pub open: usize,
    pub in_progress: usize,
    pub completed_today: usize,
    pub recent: Vec<IssueInfo>,
}

/// Activity record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityRecord {
    pub r#type: String,
    pub description: String,
    pub timestamp: String,
    pub related_id: Option<String>,
}

/// History information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryInfo {
    pub commits_today: usize,
    pub prs_today: usize,
    pub issues_closed_today: usize,
    pub recent_activities: Vec<ActivityRecord>,
}

/// System resource information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub cpu_usage: f64,
    pub memory_usage_mb: f64,
    pub total_memory_mb: f64,
    pub disk_usage: f64,
    pub uptime_seconds: u64,
}

/// Complete dashboard snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSnapshot {
    pub worktrees: WorktreeInfo,
    pub agents: AgentStats,
    pub issues: IssueStats,
    pub history: HistoryInfo,
    pub system: SystemInfo,
    pub timestamp: String,
}

/// Dashboard service for aggregating system information
pub struct DashboardService {
    cache: Arc<RwLock<Option<DashboardSnapshot>>>,
}

impl DashboardService {
    /// Create a new dashboard service
    pub fn new() -> Self {
        Self {
            cache: Arc::new(RwLock::new(None)),
        }
    }

    /// Get a dashboard snapshot
    pub async fn get_snapshot(&self) -> Result<DashboardSnapshot, String> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(snapshot) = cache.as_ref() {
                // Return cached snapshot if it's less than 10 seconds old
                if let Ok(elapsed) = Self::parse_timestamp(&snapshot.timestamp) {
                    if elapsed.as_secs() < 10 {
                        return Ok(snapshot.clone());
                    }
                }
            }
        }

        // Generate new snapshot
        let snapshot = self.generate_snapshot().await?;

        // Update cache
        {
            let mut cache = self.cache.write().await;
            *cache = Some(snapshot.clone());
        }

        Ok(snapshot)
    }

    /// Generate a new dashboard snapshot
    async fn generate_snapshot(&self) -> Result<DashboardSnapshot, String> {
        let timestamp = chrono::Utc::now().to_rfc3339();

        // Collect worktree info
        let worktrees = self.get_worktree_info().await?;

        // Collect agent stats
        let agents = self.get_agent_stats().await?;

        // Collect issue stats
        let issues = self.get_issue_stats().await?;

        // Collect history info
        let history = self.get_history_info().await?;

        // Collect system info
        let system = self.get_system_info().await?;

        Ok(DashboardSnapshot {
            worktrees,
            agents,
            issues,
            history,
            system,
            timestamp,
        })
    }

    /// Get worktree information
    async fn get_worktree_info(&self) -> Result<WorktreeInfo, String> {
        // TODO: Implement actual worktree detection
        // For now, return mock data
        Ok(WorktreeInfo {
            total: 3,
            active: 2,
            stale: 1,
            names: vec![
                "phase1-accessibility-perf".to_string(),
                "phase2-visual-consistency".to_string(),
                "feat-678-dashboard-snapshot".to_string(),
            ],
        })
    }

    /// Get agent statistics
    async fn get_agent_stats(&self) -> Result<AgentStats, String> {
        // TODO: Implement actual agent tracking
        // For now, return mock data
        Ok(AgentStats {
            total: 21,
            running: 1,
            completed: 18,
            failed: 2,
            recent: vec![
                AgentExecution {
                    name: "CodeGenAgent".to_string(),
                    status: "running".to_string(),
                    started_at: chrono::Utc::now().to_rfc3339(),
                    ended_at: None,
                    issue_number: Some(678),
                },
                AgentExecution {
                    name: "ReviewAgent".to_string(),
                    status: "completed".to_string(),
                    started_at: (chrono::Utc::now() - chrono::Duration::hours(1)).to_rfc3339(),
                    ended_at: Some(
                        (chrono::Utc::now() - chrono::Duration::minutes(30)).to_rfc3339(),
                    ),
                    issue_number: Some(677),
                },
            ],
        })
    }

    /// Get issue statistics
    async fn get_issue_stats(&self) -> Result<IssueStats, String> {
        // TODO: Implement actual GitHub API integration
        // For now, return mock data
        Ok(IssueStats {
            open: 20,
            in_progress: 5,
            completed_today: 3,
            recent: vec![IssueInfo {
                number: 678,
                title: "feat: Dashboard snapshot service and UI".to_string(),
                state: "open".to_string(),
                labels: vec!["enhancement".to_string(), "priority:P1-High".to_string()],
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
            }],
        })
    }

    /// Get history information
    async fn get_history_info(&self) -> Result<HistoryInfo, String> {
        // TODO: Implement actual git history analysis
        // For now, return mock data
        Ok(HistoryInfo {
            commits_today: 8,
            prs_today: 3,
            issues_closed_today: 2,
            recent_activities: vec![
                ActivityRecord {
                    r#type: "commit".to_string(),
                    description: "feat(desktop): implement Phase 3 component updates".to_string(),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    related_id: Some("a78ab2d".to_string()),
                },
                ActivityRecord {
                    r#type: "pr".to_string(),
                    description: "Phase 3 - Component Updates with Design System".to_string(),
                    timestamp: (chrono::Utc::now() - chrono::Duration::hours(2)).to_rfc3339(),
                    related_id: Some("686".to_string()),
                },
            ],
        })
    }

    /// Get system information
    async fn get_system_info(&self) -> Result<SystemInfo, String> {
        // TODO: Implement actual system monitoring
        // For now, return mock data
        Ok(SystemInfo {
            cpu_usage: 12.5,
            memory_usage_mb: 2304.0,
            total_memory_mb: 16384.0,
            disk_usage: 45.2,
            uptime_seconds: 86400,
        })
    }

    /// Parse timestamp and calculate elapsed time
    fn parse_timestamp(timestamp: &str) -> Result<std::time::Duration, String> {
        let parsed = chrono::DateTime::parse_from_rfc3339(timestamp)
            .map_err(|e| format!("Failed to parse timestamp: {}", e))?;
        let now = chrono::Utc::now();
        let elapsed = now.signed_duration_since(parsed.with_timezone(&chrono::Utc));

        Ok(std::time::Duration::from_secs(elapsed.num_seconds() as u64))
    }
}

impl Default for DashboardService {
    fn default() -> Self {
        Self::new()
    }
}
