//! Task Service
//!
//! Provides task management with DAG dependencies, CRUD operations, and execution state management.

use crate::error::ApiError;
use crate::models::{CreateTaskRequest, Task, TaskDependency, TaskQueryFilters, UpdateTaskRequest};
use chrono::Utc;
use sqlx::PgPool;
use std::collections::{HashMap, HashSet, VecDeque};
use uuid::Uuid;

/// Task service for managing tasks and dependencies
pub struct TaskService {
    pool: PgPool,
}

impl TaskService {
    /// Create a new task service
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new task
    pub async fn create_task(
        &self,
        user_id: Uuid,
        request: CreateTaskRequest,
    ) -> Result<Task, ApiError> {
        // Validate request
        if request.name.trim().is_empty() {
            return Err(ApiError::Validation("Task name cannot be empty".to_string()));
        }

        let priority = request.priority.unwrap_or_else(|| "P2".to_string());
        if !["P0", "P1", "P2"].contains(&priority.as_str()) {
            return Err(ApiError::Validation("Invalid priority. Must be P0, P1, or P2".to_string()));
        }

        let task = sqlx::query_as::<_, Task>(
            r#"
            INSERT INTO tasks (user_id, repository_id, name, description, priority, agent_type, issue_number, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(request.repository_id)
        .bind(request.name)
        .bind(request.description)
        .bind(priority)
        .bind(request.agent_type)
        .bind(request.issue_number)
        .bind(request.metadata.unwrap_or_else(|| serde_json::json!({})))
        .fetch_one(&self.pool)
        .await
        ?;

        Ok(task)
    }

    /// Get task by ID
    pub async fn get_task(&self, task_id: Uuid, user_id: Uuid) -> Result<Task, ApiError> {
        let task = sqlx::query_as::<_, Task>(
            r#"
            SELECT * FROM tasks
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(task_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| ApiError::NotFound("Task not found".to_string()))?;

        Ok(task)
    }

    /// List tasks with filters and pagination
    pub async fn list_tasks(
        &self,
        user_id: Uuid,
        filters: TaskQueryFilters,
    ) -> Result<(Vec<Task>, i64), ApiError> {
        let offset = (filters.page - 1) * filters.limit;

        let mut query = String::from("SELECT * FROM tasks WHERE user_id = $1");
        let mut count_query = String::from("SELECT COUNT(*) FROM tasks WHERE user_id = $1");
        let mut param_index = 2;
        let mut params: Vec<String> = vec![];

        // Build dynamic query based on filters
        if let Some(status) = &filters.status {
            query.push_str(&format!(" AND status = ${}", param_index));
            count_query.push_str(&format!(" AND status = ${}", param_index));
            params.push(status.clone());
            param_index += 1;
        }

        if let Some(repository_id) = filters.repository_id {
            query.push_str(&format!(" AND repository_id = ${}", param_index));
            count_query.push_str(&format!(" AND repository_id = ${}", param_index));
            params.push(repository_id.to_string());
            param_index += 1;
        }

        if let Some(agent_type) = &filters.agent_type {
            query.push_str(&format!(" AND agent_type = ${}", param_index));
            count_query.push_str(&format!(" AND agent_type = ${}", param_index));
            params.push(agent_type.clone());
            param_index += 1;
        }

        if let Some(priority) = &filters.priority {
            query.push_str(&format!(" AND priority = ${}", param_index));
            count_query.push_str(&format!(" AND priority = ${}", param_index));
            params.push(priority.clone());
            param_index += 1;
        }

        query.push_str(&format!(" ORDER BY created_at DESC LIMIT ${} OFFSET ${}", param_index, param_index + 1));

        // Execute count query
        let mut count_q = sqlx::query_scalar(&count_query).bind(user_id);
        for param in &params {
            count_q = count_q.bind(param);
        }
        let total: i64 = count_q.fetch_one(&self.pool).await?;

        // Execute list query
        let mut list_q = sqlx::query_as::<_, Task>(&query).bind(user_id);
        for param in &params {
            list_q = list_q.bind(param);
        }
        list_q = list_q.bind(filters.limit).bind(offset);
        let tasks = list_q.fetch_all(&self.pool).await?;

        Ok((tasks, total))
    }

    /// Update task
    pub async fn update_task(
        &self,
        task_id: Uuid,
        user_id: Uuid,
        request: UpdateTaskRequest,
    ) -> Result<Task, ApiError> {
        // Check task exists and belongs to user
        let existing = self.get_task(task_id, user_id).await?;

        // Validate status transition if updating status
        if let Some(ref new_status) = request.status {
            self.validate_status_transition(&existing.status, new_status)?;
        }

        // Build update query dynamically
        let mut updates = vec![];
        let mut param_index = 1;

        if request.name.is_some() {
            updates.push(format!("name = ${}", param_index));
            param_index += 1;
        }
        if request.description.is_some() {
            updates.push(format!("description = ${}", param_index));
            param_index += 1;
        }
        if request.status.is_some() {
            updates.push(format!("status = ${}", param_index));
            param_index += 1;
        }
        if request.priority.is_some() {
            updates.push(format!("priority = ${}", param_index));
            param_index += 1;
        }
        if request.metadata.is_some() {
            updates.push(format!("metadata = ${}", param_index));
            param_index += 1;
        }

        if updates.is_empty() {
            return Ok(existing);
        }

        let query = format!(
            "UPDATE tasks SET {} WHERE id = ${} AND user_id = ${} RETURNING *",
            updates.join(", "),
            param_index,
            param_index + 1
        );

        let mut q = sqlx::query_as::<_, Task>(&query);
        if let Some(name) = request.name {
            q = q.bind(name);
        }
        if let Some(description) = request.description {
            q = q.bind(description);
        }
        if let Some(status) = request.status {
            q = q.bind(status);
        }
        if let Some(priority) = request.priority {
            q = q.bind(priority);
        }
        if let Some(metadata) = request.metadata {
            q = q.bind(metadata);
        }
        q = q.bind(task_id).bind(user_id);

        let task = q.fetch_one(&self.pool).await?;

        Ok(task)
    }

    /// Delete task (soft delete by marking as cancelled)
    pub async fn delete_task(&self, task_id: Uuid, user_id: Uuid) -> Result<(), ApiError> {
        // Check task exists
        self.get_task(task_id, user_id).await?;

        // Delete dependencies first
        sqlx::query("DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1")
            .bind(task_id)
            .execute(&self.pool)
            .await
            ?;

        // Delete task
        sqlx::query("DELETE FROM tasks WHERE id = $1 AND user_id = $2")
            .bind(task_id)
            .bind(user_id)
            .execute(&self.pool)
            .await
            ?;

        Ok(())
    }

    /// Add task dependency
    pub async fn add_dependency(
        &self,
        task_id: Uuid,
        depends_on_task_id: Uuid,
        user_id: Uuid,
    ) -> Result<TaskDependency, ApiError> {
        // Verify both tasks exist and belong to user
        self.get_task(task_id, user_id).await?;
        self.get_task(depends_on_task_id, user_id).await?;

        // Cannot depend on self
        if task_id == depends_on_task_id {
            return Err(ApiError::Validation("Task cannot depend on itself".to_string()));
        }

        // Try to add dependency (will fail if cycle detected due to DB trigger)
        let dependency = sqlx::query_as::<_, TaskDependency>(
            r#"
            INSERT INTO task_dependencies (task_id, depends_on_task_id)
            VALUES ($1, $2)
            ON CONFLICT (task_id, depends_on_task_id) DO NOTHING
            RETURNING *
            "#,
        )
        .bind(task_id)
        .bind(depends_on_task_id)
        .fetch_optional(&self.pool)
        .await;

        match dependency {
            Ok(Some(dep)) => Ok(dep),
            Ok(None) => Err(ApiError::Validation("Dependency already exists".to_string())),
            Err(e) => {
                if e.to_string().contains("Circular dependency") {
                    Err(ApiError::Validation("Circular dependency detected".to_string()))
                } else {
                    Err(ApiError::Database(e))
                }
            }
        }
    }

    /// Remove task dependency
    pub async fn remove_dependency(
        &self,
        task_id: Uuid,
        depends_on_task_id: Uuid,
        user_id: Uuid,
    ) -> Result<(), ApiError> {
        // Verify task belongs to user
        self.get_task(task_id, user_id).await?;

        sqlx::query("DELETE FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2")
            .bind(task_id)
            .bind(depends_on_task_id)
            .execute(&self.pool)
            .await
            ?;

        Ok(())
    }

    /// Get task dependencies (upstream)
    pub async fn get_dependencies(&self, task_id: Uuid, user_id: Uuid) -> Result<Vec<Task>, ApiError> {
        // Verify task belongs to user
        self.get_task(task_id, user_id).await?;

        let tasks = sqlx::query_as::<_, Task>(
            r#"
            SELECT t.* FROM tasks t
            INNER JOIN task_dependencies td ON t.id = td.depends_on_task_id
            WHERE td.task_id = $1 AND t.user_id = $2
            ORDER BY t.created_at
            "#,
        )
        .bind(task_id)
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        ?;

        Ok(tasks)
    }

    /// Get task dependents (downstream)
    pub async fn get_dependents(&self, task_id: Uuid, user_id: Uuid) -> Result<Vec<Task>, ApiError> {
        // Verify task belongs to user
        self.get_task(task_id, user_id).await?;

        let tasks = sqlx::query_as::<_, Task>(
            r#"
            SELECT t.* FROM tasks t
            INNER JOIN task_dependencies td ON t.id = td.task_id
            WHERE td.depends_on_task_id = $1 AND t.user_id = $2
            ORDER BY t.created_at
            "#,
        )
        .bind(task_id)
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        ?;

        Ok(tasks)
    }

    /// Get topologically sorted tasks (for execution order)
    pub async fn get_execution_order(&self, user_id: Uuid, repository_id: Uuid) -> Result<Vec<Task>, ApiError> {
        // Get all tasks for this repository
        let tasks = sqlx::query_as::<_, Task>(
            "SELECT * FROM tasks WHERE user_id = $1 AND repository_id = $2 AND status != 'completed' AND status != 'cancelled'"
        )
        .bind(user_id)
        .bind(repository_id)
        .fetch_all(&self.pool)
        .await
        ?;

        // Get all dependencies
        let dependencies = sqlx::query_as::<_, TaskDependency>(
            r#"
            SELECT td.* FROM task_dependencies td
            INNER JOIN tasks t ON td.task_id = t.id
            WHERE t.user_id = $1 AND t.repository_id = $2
            "#,
        )
        .bind(user_id)
        .bind(repository_id)
        .fetch_all(&self.pool)
        .await
        ?;

        // Perform topological sort
        let sorted = self.topological_sort(tasks, dependencies)?;
        Ok(sorted)
    }

    /// Topological sort using Kahn's algorithm
    fn topological_sort(&self, tasks: Vec<Task>, dependencies: Vec<TaskDependency>) -> Result<Vec<Task>, ApiError> {
        let mut task_map: HashMap<Uuid, Task> = tasks.into_iter().map(|t| (t.id, t)).collect();
        let mut in_degree: HashMap<Uuid, usize> = task_map.keys().map(|&id| (id, 0)).collect();
        let mut adjacency: HashMap<Uuid, Vec<Uuid>> = HashMap::new();

        // Build adjacency list and calculate in-degrees
        for dep in dependencies {
            adjacency.entry(dep.depends_on_task_id).or_insert_with(Vec::new).push(dep.task_id);
            *in_degree.entry(dep.task_id).or_insert(0) += 1;
        }

        // Start with tasks that have no dependencies
        let mut queue: VecDeque<Uuid> = in_degree
            .iter()
            .filter(|(_, &degree)| degree == 0)
            .map(|(&id, _)| id)
            .collect();

        let mut sorted = Vec::new();

        while let Some(task_id) = queue.pop_front() {
            if let Some(task) = task_map.remove(&task_id) {
                sorted.push(task);
            }

            if let Some(dependents) = adjacency.get(&task_id) {
                for &dependent_id in dependents {
                    if let Some(degree) = in_degree.get_mut(&dependent_id) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push_back(dependent_id);
                        }
                    }
                }
            }
        }

        // If not all tasks are sorted, there's a cycle (shouldn't happen due to DB constraint)
        if sorted.len() != task_map.len() + sorted.len() {
            return Err(ApiError::Internal("Cycle detected in task dependencies".to_string()));
        }

        Ok(sorted)
    }

    /// Start task execution
    pub async fn start_task(&self, task_id: Uuid, user_id: Uuid) -> Result<Task, ApiError> {
        let task = self.get_task(task_id, user_id).await?;

        // Check if task is in pending state
        if task.status != "pending" {
            return Err(ApiError::Validation(format!("Task cannot be started from {} state", task.status)));
        }

        // Check if all dependencies are completed
        let dependencies = self.get_dependencies(task_id, user_id).await?;
        for dep in dependencies {
            if dep.status != "completed" {
                return Err(ApiError::Validation(format!("Dependency {} is not completed", dep.name)));
            }
        }

        // Update task to running
        let task = sqlx::query_as::<_, Task>(
            "UPDATE tasks SET status = 'running', started_at = $1 WHERE id = $2 AND user_id = $3 RETURNING *"
        )
        .bind(Utc::now())
        .bind(task_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        ?;

        Ok(task)
    }

    /// Complete task
    pub async fn complete_task(&self, task_id: Uuid, user_id: Uuid, result: Option<serde_json::Value>) -> Result<Task, ApiError> {
        let task = self.get_task(task_id, user_id).await?;

        if task.status != "running" {
            return Err(ApiError::Validation(format!("Task cannot be completed from {} state", task.status)));
        }

        let task = sqlx::query_as::<_, Task>(
            "UPDATE tasks SET status = 'completed', completed_at = $1, result = $2 WHERE id = $3 AND user_id = $4 RETURNING *"
        )
        .bind(Utc::now())
        .bind(result)
        .bind(task_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        ?;

        Ok(task)
    }

    /// Fail task
    pub async fn fail_task(&self, task_id: Uuid, user_id: Uuid, error_message: String) -> Result<Task, ApiError> {
        let task = self.get_task(task_id, user_id).await?;

        // Check if we should retry
        if task.retry_count < task.max_retries {
            // Increment retry count and reset to pending
            let task = sqlx::query_as::<_, Task>(
                "UPDATE tasks SET status = 'pending', retry_count = retry_count + 1, error_message = $1 WHERE id = $2 AND user_id = $3 RETURNING *"
            )
            .bind(error_message)
            .bind(task_id)
            .bind(user_id)
            .fetch_one(&self.pool)
            .await
            ?;

            return Ok(task);
        }

        // Max retries exceeded, mark as failed
        let task = sqlx::query_as::<_, Task>(
            "UPDATE tasks SET status = 'failed', failed_at = $1, error_message = $2 WHERE id = $3 AND user_id = $4 RETURNING *"
        )
        .bind(Utc::now())
        .bind(error_message)
        .bind(task_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        ?;

        Ok(task)
    }

    /// Cancel task
    pub async fn cancel_task(&self, task_id: Uuid, user_id: Uuid) -> Result<Task, ApiError> {
        let task = self.get_task(task_id, user_id).await?;

        if task.status == "completed" || task.status == "cancelled" {
            return Err(ApiError::Validation(format!("Cannot cancel task in {} state", task.status)));
        }

        let task = sqlx::query_as::<_, Task>(
            "UPDATE tasks SET status = 'cancelled', cancelled_at = $1 WHERE id = $2 AND user_id = $3 RETURNING *"
        )
        .bind(Utc::now())
        .bind(task_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        ?;

        Ok(task)
    }

    /// Validate status transition
    fn validate_status_transition(&self, from: &str, to: &str) -> Result<(), ApiError> {
        let valid_transitions = [
            ("pending", "running"),
            ("pending", "cancelled"),
            ("running", "completed"),
            ("running", "failed"),
            ("running", "cancelled"),
            ("failed", "pending"), // Retry
        ];

        if valid_transitions.contains(&(from, to)) {
            Ok(())
        } else {
            Err(ApiError::Validation(format!("Invalid status transition from {} to {}", from, to)))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_status_transition_valid() {
        let service = TaskService::new(PgPool::connect_lazy("").unwrap());
        assert!(service.validate_status_transition("pending", "running").is_ok());
        assert!(service.validate_status_transition("running", "completed").is_ok());
    }

    #[test]
    fn test_validate_status_transition_invalid() {
        let service = TaskService::new(PgPool::connect_lazy("").unwrap());
        assert!(service.validate_status_transition("completed", "pending").is_err());
        assert!(service.validate_status_transition("pending", "completed").is_err());
    }
}
