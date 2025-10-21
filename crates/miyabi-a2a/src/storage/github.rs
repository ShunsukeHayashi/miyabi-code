//! GitHub Issues-based task storage

use super::{StorageError, TaskFilter, TaskStorage, TaskUpdate};
use crate::task::{A2ATask, TaskStatus, TaskType};
use async_trait::async_trait;
use octocrab::{models::issues::Issue, Octocrab};
use tracing::{debug, info, warn};

/// GitHub Issues task storage implementation
pub struct GitHubTaskStorage {
    client: Octocrab,
    repo_owner: String,
    repo_name: String,
}

impl GitHubTaskStorage {
    /// Create a new GitHub task storage
    ///
    /// # Arguments
    /// * `token` - GitHub personal access token
    /// * `repo_owner` - Repository owner (org or user)
    /// * `repo_name` - Repository name
    pub fn new(token: String, repo_owner: String, repo_name: String) -> Result<Self, StorageError> {
        let client = Octocrab::builder()
            .personal_token(token)
            .build()
            .map_err(|e| StorageError::Auth(e.to_string()))?;

        Ok(Self {
            client,
            repo_owner,
            repo_name,
        })
    }

    /// Convert GitHub Issue to A2ATask
    fn issue_to_task(&self, issue: Issue) -> Result<A2ATask, StorageError> {
        // Extract status from labels
        let status = issue
            .labels
            .iter()
            .find_map(|label| {
                let name = label.name.as_str();
                if name.starts_with("a2a:") {
                    match &name[4..] {
                        "pending" => Some(TaskStatus::Pending),
                        "in-progress" => Some(TaskStatus::InProgress),
                        "completed" => Some(TaskStatus::Completed),
                        "failed" => Some(TaskStatus::Failed),
                        "blocked" => Some(TaskStatus::Blocked),
                        _ => None,
                    }
                } else {
                    None
                }
            })
            .unwrap_or(TaskStatus::Pending);

        // Extract task type from labels
        let task_type = issue
            .labels
            .iter()
            .find_map(|label| {
                let name = label.name.as_str();
                if name.starts_with("a2a:") {
                    match &name[4..] {
                        "codegen" => Some(TaskType::CodeGeneration),
                        "review" => Some(TaskType::CodeReview),
                        "testing" => Some(TaskType::Testing),
                        "deployment" => Some(TaskType::Deployment),
                        "documentation" => Some(TaskType::Documentation),
                        "analysis" => Some(TaskType::Analysis),
                        _ => None,
                    }
                } else {
                    None
                }
            })
            .unwrap_or(TaskType::Analysis);

        // Extract agent from assignee
        let agent = issue.assignee.as_ref().map(|a| a.login.clone());

        Ok(A2ATask {
            id: issue.number,
            title: issue.title,
            description: issue.body.unwrap_or_default(),
            status,
            task_type,
            agent,
            context_id: None, // TODO: Extract from body or custom field
            priority: 3,      // TODO: Extract from labels
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            issue_url: issue.html_url.to_string(),
        })
    }
}

#[async_trait]
impl TaskStorage for GitHubTaskStorage {
    async fn save_task(&self, task: A2ATask) -> Result<u64, StorageError> {
        info!(
            "Creating GitHub Issue for task: {}",
            task.title
        );

        let issue = self
            .client
            .issues(&self.repo_owner, &self.repo_name)
            .create(&task.title)
            .body(&task.description)
            .labels(vec![task.status.to_label(), task.task_type.to_label()])
            .send()
            .await?;

        debug!(
            "Created GitHub Issue #{}: {}",
            issue.number, issue.html_url
        );

        Ok(issue.number)
    }

    async fn get_task(&self, id: u64) -> Result<Option<A2ATask>, StorageError> {
        debug!("Fetching task #{} from GitHub", id);

        match self
            .client
            .issues(&self.repo_owner, &self.repo_name)
            .get(id)
            .await
        {
            Ok(issue) => {
                let task = self.issue_to_task(issue)?;
                Ok(Some(task))
            }
            Err(octocrab::Error::GitHub { source, .. }) if source.message.contains("Not Found") => {
                debug!("Task #{} not found", id);
                Ok(None)
            }
            Err(e) => Err(StorageError::from(e)),
        }
    }

    async fn list_tasks(&self, filter: TaskFilter) -> Result<Vec<A2ATask>, StorageError> {
        debug!("Listing tasks with filter: {:?}", filter);

        // For MVP, we'll fetch all issues and filter in memory
        // In production, this should use GitHub API filters
        let page = self
            .client
            .issues(&self.repo_owner, &self.repo_name)
            .list()
            .per_page(filter.limit.unwrap_or(30) as u8)
            .send()
            .await?;

        // Convert GitHub Issues to A2ATasks
        let all_tasks: Result<Vec<A2ATask>, StorageError> = page
            .items
            .into_iter()
            .map(|issue| self.issue_to_task(issue))
            .collect();

        let mut tasks = all_tasks?;

        // Apply filters in memory (for MVP)
        if let Some(status) = filter.status {
            tasks.retain(|t| t.status == status);
        }

        if let Some(ref context_id) = filter.context_id {
            tasks.retain(|t| t.context_id.as_ref() == Some(context_id));
        }

        if let Some(ref agent) = filter.agent {
            tasks.retain(|t| t.agent.as_ref() == Some(agent));
        }

        if let Some(after) = filter.last_updated_after {
            tasks.retain(|t| t.updated_at > after);
        }

        Ok(tasks)
    }

    async fn update_task(&self, id: u64, update: TaskUpdate) -> Result<(), StorageError> {
        info!("Updating task #{}", id);

        // For now, only support description updates
        // Status updates require more complex label management
        if let Some(description) = update.description {
            self.client
                .issues(&self.repo_owner, &self.repo_name)
                .update(id)
                .body(&description)
                .send()
                .await?;

            debug!("Updated task #{} description", id);
        }

        // Update status (via labels)
        if let Some(_status) = update.status {
            // Note: Label updates require fetching current labels, removing old status labels,
            // and adding new ones. This will be implemented in Phase 2.
            warn!("Status update via labels not yet implemented - use GitHub UI for now");
        }

        Ok(())
    }

    async fn delete_task(&self, id: u64) -> Result<(), StorageError> {
        info!("Closing task #{} (GitHub Issues don't support deletion)", id);

        // GitHub Issues can't be deleted, only closed
        use octocrab::models::IssueState;

        self.client
            .issues(&self.repo_owner, &self.repo_name)
            .update(id)
            .state(IssueState::Closed)
            .send()
            .await?;

        debug!("Closed task #{}", id);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_github_storage_construction() {
        // This test just ensures the struct can be created
        // Actual API tests require a real GitHub token
        let result = GitHubTaskStorage::new(
            "fake_token".to_string(),
            "owner".to_string(),
            "repo".to_string(),
        );
        assert!(result.is_ok());
    }
}
