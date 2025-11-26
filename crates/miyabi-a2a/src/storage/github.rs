//! GitHub Issues-based task storage

use super::{
    cursor::{PaginatedResult, PaginationCursor},
    StorageError, TaskFilter, TaskStorage, TaskUpdate,
};
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
                name.strip_prefix("a2a:").and_then(|status| {
                    match status {
                        "submitted" => Some(TaskStatus::Submitted),
                        "working" => Some(TaskStatus::Working),
                        "completed" => Some(TaskStatus::Completed),
                        "failed" => Some(TaskStatus::Failed),
                        "cancelled" => Some(TaskStatus::Cancelled),
                        // Legacy label compatibility
                        "pending" => Some(TaskStatus::Submitted),
                        "in-progress" => Some(TaskStatus::Working),
                        _ => None,
                    }
                })
            })
            .unwrap_or(TaskStatus::Submitted);

        // Extract task type from labels
        let task_type = issue
            .labels
            .iter()
            .find_map(|label| {
                let name = label.name.as_str();
                name.strip_prefix("a2a:")
                    .and_then(|task_type| match task_type {
                        "codegen" => Some(TaskType::CodeGeneration),
                        "review" => Some(TaskType::CodeReview),
                        "testing" => Some(TaskType::Testing),
                        "deployment" => Some(TaskType::Deployment),
                        "documentation" => Some(TaskType::Documentation),
                        "analysis" => Some(TaskType::Analysis),
                        _ => None,
                    })
            })
            .unwrap_or(TaskType::Analysis);

        // Extract agent from assignee
        let agent = issue.assignee.as_ref().map(|a| a.login.clone());

        // Extract retry_count from label (format: "retry:N")
        let retry_count = issue
            .labels
            .iter()
            .find_map(|label| {
                label
                    .name
                    .strip_prefix("retry:")
                    .and_then(|count_str| count_str.parse::<u32>().ok())
            })
            .unwrap_or(0);

        Ok(A2ATask {
            id: issue.number,
            title: issue.title,
            description: issue.body.unwrap_or_default(),
            status,
            task_type,
            agent,
            context_id: None, // TODO: Extract from body or custom field
            priority: 3,      // TODO: Extract from labels
            retry_count,
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
        info!("Creating GitHub Issue for task: {}", task.title);

        let issue = self
            .client
            .issues(&self.repo_owner, &self.repo_name)
            .create(&task.title)
            .body(&task.description)
            .labels(vec![task.status.to_label(), task.task_type.to_label()])
            .send()
            .await?;

        debug!("Created GitHub Issue #{}: {}", issue.number, issue.html_url);

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
            issues.list().per_page(per_page).send().await?
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

    /// List tasks with cursor-based pagination
    ///
    /// Implements cursor-based pagination for efficient navigation through large task lists.
    /// Cursors encode the (id, updated_at) of the last item, ensuring stable pagination.
    ///
    /// # Arguments
    /// * `filter` - Filter criteria including optional cursor
    ///
    /// # Returns
    /// PaginatedResult with items, next_cursor, previous_cursor, and has_more flag
    ///
    /// # Pagination Strategy
    /// - **Forward**: Fetch limit+1 items after cursor to determine if has_more
    /// - **Backward**: Fetch limit+1 items before cursor
    /// - **First page**: No cursor provided, start from beginning
    ///
    /// # Examples
    ///
    /// ```no_run
    /// use miyabi_a2a::{GitHubTaskStorage, TaskStorage, TaskFilter};
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let storage = GitHubTaskStorage::new("token".into(), "owner".into(), "repo".into())?;
    ///
    /// // First page (50 items)
    /// let filter = TaskFilter { limit: Some(50), ..Default::default() };
    /// let page1 = storage.list_tasks_paginated(filter).await?;
    ///
    /// // Navigate to next page
    /// if let Some(cursor) = page1.next_cursor {
    ///     let filter = TaskFilter { cursor: Some(cursor), limit: Some(50), ..Default::default() };
    ///     let page2 = storage.list_tasks_paginated(filter).await?;
    /// }
    /// # Ok(())
    /// # }
    /// ```
    async fn list_tasks_paginated(
        &self,
        filter: TaskFilter,
    ) -> Result<PaginatedResult<A2ATask>, StorageError> {
        debug!("Listing tasks with pagination: {:?}", filter);

        // Default limit: 50, max: 100
        let limit = filter.limit.unwrap_or(50).min(100);

        // Decode cursor if provided
        let cursor = filter
            .cursor
            .as_ref()
            .map(|c| PaginationCursor::decode(c))
            .transpose()
            .map_err(|e| StorageError::Other(format!("Invalid cursor: {}", e)))?;

        // Build GitHub API query
        let issues = self.client.issues(&self.repo_owner, &self.repo_name);

        // Fetch limit+1 items to determine has_more
        let fetch_count = (limit + 1) as u8;

        // Apply status filter at API level
        let page = if let Some(status) = filter.status {
            let label = status.to_label();
            let labels = vec![label.clone()];
            debug!("Applying API-level status filter: {}", label);

            issues
                .list()
                .labels(&labels)
                .per_page(fetch_count)
                .send()
                .await?
        } else {
            issues.list().per_page(fetch_count).send().await?
        };

        // Convert to tasks
        let all_tasks: Result<Vec<A2ATask>, StorageError> = page
            .items
            .into_iter()
            .map(|issue| self.issue_to_task(issue))
            .collect();

        let mut tasks = all_tasks?;

        // Apply cursor filtering if present
        if let Some(ref c) = cursor {
            match c.direction {
                super::cursor::Direction::Forward => {
                    // Forward: Keep tasks with (updated_at, id) > cursor
                    tasks.retain(|t| {
                        t.updated_at > c.last_updated
                            || (t.updated_at == c.last_updated && t.id > c.last_id)
                    });
                }
                super::cursor::Direction::Backward => {
                    // Backward: Keep tasks with (updated_at, id) < cursor
                    tasks.retain(|t| {
                        t.updated_at < c.last_updated
                            || (t.updated_at == c.last_updated && t.id < c.last_id)
                    });
                    // Reverse order for backward pagination
                    tasks.reverse();
                }
            }
        }

        // Apply remaining filters in memory
        if let Some(ref context_id) = filter.context_id {
            tasks.retain(|t| t.context_id.as_ref() == Some(context_id));
        }

        if let Some(ref agent) = filter.agent {
            tasks.retain(|t| t.agent.as_ref() == Some(agent));
        }

        if let Some(after) = filter.last_updated_after {
            tasks.retain(|t| t.updated_at > after);
        }

        // Sort by (updated_at DESC, id DESC) for stable ordering
        tasks.sort_by(|a, b| {
            b.updated_at
                .cmp(&a.updated_at)
                .then_with(|| b.id.cmp(&a.id))
        });

        // Determine has_more and trim to limit
        let has_more = tasks.len() > limit;
        if has_more {
            tasks.truncate(limit);
        }

        // Generate cursors
        let next_cursor =
            if has_more && !tasks.is_empty() {
                let last = tasks.last().unwrap();
                let cursor = PaginationCursor::forward(last.id, last.updated_at);
                Some(cursor.encode().map_err(|e| {
                    StorageError::Other(format!("Failed to encode next cursor: {}", e))
                })?)
            } else {
                None
            };

        let previous_cursor = if !tasks.is_empty() && cursor.is_some() {
            let first = tasks.first().unwrap();
            let cursor = PaginationCursor::backward(first.id, first.updated_at);
            Some(cursor.encode().map_err(|e| {
                StorageError::Other(format!("Failed to encode previous cursor: {}", e))
            })?)
        } else {
            None
        };

        Ok(PaginatedResult::new(
            tasks,
            next_cursor,
            previous_cursor,
            has_more,
        ))
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

        // Update status or retry_count via labels
        if update.status.is_some() || update.retry_count.is_some() {
            // Fetch current issue to get existing labels
            let issue = self
                .client
                .issues(&self.repo_owner, &self.repo_name)
                .get(id)
                .await?;

            // Filter out old status labels and retry labels
            let mut new_labels: Vec<String> = issue
                .labels
                .iter()
                .filter(|label| {
                    !label.name.starts_with("a2a:pending")
                        && !label.name.starts_with("a2a:in-progress")
                        && !label.name.starts_with("a2a:completed")
                        && !label.name.starts_with("a2a:failed")
                        && !label.name.starts_with("a2a:blocked")
                        && !label.name.starts_with("retry:")
                })
                .map(|label| label.name.clone())
                .collect();

            // Add new status label if provided
            if let Some(new_status) = update.status {
                new_labels.push(new_status.to_label());
                debug!("Updated task #{} status to {:?}", id, new_status);
            }

            // Add new retry_count label if provided
            if let Some(retry_count) = update.retry_count {
                new_labels.push(format!("retry:{}", retry_count));
                debug!("Updated task #{} retry_count to {}", id, retry_count);
            }

            // Update issue labels
            self.client
                .issues(&self.repo_owner, &self.repo_name)
                .update(id)
                .labels(&new_labels)
                .send()
                .await?;
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
        info!(
            "Closing task #{} (GitHub Issues don't support deletion)",
            id
        );

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
    use crate::storage::cursor::{Direction, PaginationCursor};
    use chrono::Utc;

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

    #[test]
    fn test_cursor_encode_decode_roundtrip() {
        let timestamp = Utc::now();
        let cursor = PaginationCursor::forward(123, timestamp);

        let encoded = cursor.encode().unwrap();
        let decoded = PaginationCursor::decode(&encoded).unwrap();

        assert_eq!(cursor.last_id, decoded.last_id);
        assert_eq!(cursor.last_updated, decoded.last_updated);
        assert_eq!(cursor.direction, decoded.direction);
    }

    #[test]
    fn test_forward_cursor_creation() {
        let timestamp = Utc::now();
        let cursor = PaginationCursor::forward(456, timestamp);

        assert_eq!(cursor.last_id, 456);
        assert_eq!(cursor.last_updated, timestamp);
        assert_eq!(cursor.direction, Direction::Forward);
    }

    #[test]
    fn test_backward_cursor_creation() {
        let timestamp = Utc::now();
        let cursor = PaginationCursor::backward(789, timestamp);

        assert_eq!(cursor.last_id, 789);
        assert_eq!(cursor.last_updated, timestamp);
        assert_eq!(cursor.direction, Direction::Backward);
    }

    #[test]
    fn test_paginated_result_structure() {
        let result = PaginatedResult::new(
            vec![1, 2, 3],
            Some("next_cursor".to_string()),
            Some("prev_cursor".to_string()),
            true,
        );

        assert_eq!(result.items.len(), 3);
        assert!(result.next_cursor.is_some());
        assert!(result.previous_cursor.is_some());
        assert!(result.has_more);
    }

    #[test]
    fn test_paginated_result_last_page() {
        let result: PaginatedResult<i32> = PaginatedResult::new(vec![1, 2], None, None, false);

        assert_eq!(result.items.len(), 2);
        assert!(result.next_cursor.is_none());
        assert!(result.previous_cursor.is_none());
        assert!(!result.has_more);
    }
}
