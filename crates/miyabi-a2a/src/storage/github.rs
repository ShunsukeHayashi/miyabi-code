//! GitHub Issues-based task storage

use super::{StorageError, TaskFilter, TaskStorage, TaskUpdate};
use crate::task::{A2ATask, TaskStatus, TaskType};
use async_trait::async_trait;
use octocrab::{models::issues::Issue, Octocrab};
use tracing::{debug, info};

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
    ///
    /// Extracts task information from GitHub Issue metadata:
    /// - Status: From `a2a:pending`, `a2a:in-progress`, etc. labels
    /// - Task Type: From `a2a:codegen`, `a2a:review`, etc. labels
    /// - Agent: From Issue assignee
    /// - Timestamps: From Issue created_at/updated_at
    ///
    /// # Arguments
    /// * `issue` - GitHub Issue to convert
    ///
    /// # Returns
    /// Converted A2ATask with metadata extracted from labels and fields
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
    /// Save a new task by creating a GitHub Issue
    ///
    /// Creates a GitHub Issue with:
    /// - Title and description from task
    /// - Status label (e.g., `a2a:pending`)
    /// - Task type label (e.g., `a2a:codegen`)
    ///
    /// # Arguments
    /// * `task` - The task to save
    ///
    /// # Returns
    /// GitHub Issue number (task ID)
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

    /// Get a task by ID (GitHub Issue number)
    ///
    /// # Arguments
    /// * `id` - GitHub Issue number
    ///
    /// # Returns
    /// - `Some(task)` if found
    /// - `None` if not found (404)
    /// - `Err` for other errors
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

    /// List tasks with optional filtering
    ///
    /// Uses GitHub API label filtering for status, combined with
    /// in-memory filtering for other criteria.
    ///
    /// # Arguments
    /// * `filter` - Filter criteria (status, context_id, agent, updated_after, limit)
    ///
    /// # Returns
    /// List of tasks matching the filter
    ///
    /// # Performance
    /// - Status filtering: API-level (reduces network transfer)
    /// - Other filters: In-memory (applied after fetch)
    async fn list_tasks(&self, filter: TaskFilter) -> Result<Vec<A2ATask>, StorageError> {
        debug!("Listing tasks with filter: {:?}", filter);

        // Build GitHub API query with label filtering
        let issues = self.client.issues(&self.repo_owner, &self.repo_name);
        let per_page = filter.limit.unwrap_or(30) as u8;

        // Apply status filter at API level via labels
        let page = if let Some(status) = filter.status {
            let label = status.to_label();
            let labels = vec![label.clone()];
            debug!("Applying API-level status filter: {}", label);

            issues
                .list()
                .labels(&labels)
                .per_page(per_page)
                .send()
                .await?
        } else {
            issues
                .list()
                .per_page(per_page)
                .send()
                .await?
        };

        // Convert GitHub Issues to A2ATasks
        let all_tasks: Result<Vec<A2ATask>, StorageError> = page
            .items
            .into_iter()
            .map(|issue| self.issue_to_task(issue))
            .collect();

        let mut tasks = all_tasks?;

        // Apply remaining filters in memory
        // (Status already filtered at API level)

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

    /// Update an existing task
    ///
    /// Updates task fields via GitHub Issue API:
    /// - **Description**: Updates Issue body
    /// - **Status**: Updates labels (removes old status label, adds new one)
    ///
    /// Status update process:
    /// 1. Fetch current Issue to get existing labels
    /// 2. Filter out old status labels (a2a:pending, a2a:in-progress, etc.)
    /// 3. Add new status label
    /// 4. Update Issue with new label set
    ///
    /// # Arguments
    /// * `id` - GitHub Issue number
    /// * `update` - Fields to update
    ///
    /// # Returns
    /// Ok(()) on success
    async fn update_task(&self, id: u64, update: TaskUpdate) -> Result<(), StorageError> {
        info!("Updating task #{}", id);

        // Update description if provided
        if let Some(description) = update.description {
            self.client
                .issues(&self.repo_owner, &self.repo_name)
                .update(id)
                .body(&description)
                .send()
                .await?;

            debug!("Updated task #{} description", id);
        }

        // Update status via labels
        if let Some(new_status) = update.status {
            // Fetch current issue to get existing labels
            let issue = self
                .client
                .issues(&self.repo_owner, &self.repo_name)
                .get(id)
                .await?;

            // Filter out old status labels (a2a:pending, a2a:in-progress, etc.)
            let mut new_labels: Vec<String> = issue
                .labels
                .iter()
                .filter(|label| {
                    !label.name.starts_with("a2a:pending")
                        && !label.name.starts_with("a2a:in-progress")
                        && !label.name.starts_with("a2a:completed")
                        && !label.name.starts_with("a2a:failed")
                        && !label.name.starts_with("a2a:blocked")
                })
                .map(|label| label.name.clone())
                .collect();

            // Add new status label
            new_labels.push(new_status.to_label());

            // Update issue labels
            self.client
                .issues(&self.repo_owner, &self.repo_name)
                .update(id)
                .labels(&new_labels)
                .send()
                .await?;

            debug!("Updated task #{} status to {:?}", id, new_status);
        }

        Ok(())
    }

    /// Delete a task (closes GitHub Issue)
    ///
    /// GitHub Issues cannot be permanently deleted, so this method
    /// closes the Issue instead. Closed Issues remain in the repository
    /// for audit trail purposes.
    ///
    /// # Arguments
    /// * `id` - GitHub Issue number
    ///
    /// # Returns
    /// Ok(()) on success
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
