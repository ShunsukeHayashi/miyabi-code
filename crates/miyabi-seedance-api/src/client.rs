//! Seedance API Client Implementation

use crate::{error::*, models::*};
use reqwest::{header, Client};
use std::time::Duration;
use tracing::{debug, info, warn};

/// Seedance API client
#[derive(Debug, Clone)]
pub struct SeedanceClient {
    /// HTTP client
    client: Client,
    /// API base URL
    base_url: String,
    /// API key
    #[allow(dead_code)]
    api_key: String,
    /// Polling interval (seconds)
    polling_interval: Duration,
    /// Polling timeout (seconds)
    polling_timeout: Duration,
}

impl SeedanceClient {
    /// Create a new Seedance API client
    ///
    /// # Arguments
    /// * `api_key` - BytePlus API key
    ///
    /// # Returns
    /// * `Result<Self>` - New client instance
    pub fn new(api_key: String) -> Result<Self> {
        if api_key.is_empty() {
            return Err(SeedanceError::MissingApiKey);
        }

        let mut headers = header::HeaderMap::new();
        headers.insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", api_key))
                .map_err(|e| SeedanceError::ApiError(format!("Invalid API key format: {}", e)))?,
        );
        headers.insert(header::CONTENT_TYPE, header::HeaderValue::from_static("application/json"));

        let client = Client::builder()
            .default_headers(headers)
            .timeout(Duration::from_secs(30))
            .build()?;

        Ok(Self {
            client,
            base_url: "https://api.byteplus.com/v1/seedance".to_string(),
            api_key,
            polling_interval: Duration::from_secs(5),
            polling_timeout: Duration::from_secs(300), // 5 minutes
        })
    }

    /// Set custom base URL (for testing)
    pub fn with_base_url(mut self, base_url: String) -> Self {
        self.base_url = base_url;
        self
    }

    /// Set polling interval
    pub fn with_polling_interval(mut self, interval: Duration) -> Self {
        self.polling_interval = interval;
        self
    }

    /// Set polling timeout
    pub fn with_polling_timeout(mut self, timeout: Duration) -> Self {
        self.polling_timeout = timeout;
        self
    }

    /// Create a new video generation task
    ///
    /// # Arguments
    /// * `request` - Task creation request
    ///
    /// # Returns
    /// * `Result<TaskCreateResponse>` - Task creation response with task_id
    pub async fn create_task(&self, request: &TaskCreateRequest) -> Result<TaskCreateResponse> {
        debug!("Creating Seedance task: {:?}", request);

        let url = format!("{}/tasks", self.base_url);
        let response = self.client.post(&url).json(request).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(SeedanceError::TaskCreationFailed(error_text));
        }

        let task_response: TaskCreateResponse = response.json().await?;

        info!(
            "Created Seedance task: {} (status: {:?})",
            task_response.task_id, task_response.status
        );

        Ok(task_response)
    }

    /// Query task status
    ///
    /// # Arguments
    /// * `task_id` - Task ID returned from create_task
    ///
    /// # Returns
    /// * `Result<TaskStatusResponse>` - Current task status and video URL (if completed)
    pub async fn query_task(&self, task_id: &str) -> Result<TaskStatusResponse> {
        debug!("Querying Seedance task: {}", task_id);

        let url = format!("{}/tasks/{}", self.base_url, task_id);
        let response = self.client.get(&url).send().await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(SeedanceError::ApiError(format!(
                "Failed to query task {}: {}",
                task_id, error_text
            )));
        }

        let status_response: TaskStatusResponse = response.json().await?;

        debug!(
            "Task {} status: {:?} (progress: {:?}%)",
            task_id, status_response.status, status_response.progress
        );

        Ok(status_response)
    }

    /// Poll task until completion or timeout
    ///
    /// # Arguments
    /// * `task_id` - Task ID to poll
    ///
    /// # Returns
    /// * `Result<TaskStatusResponse>` - Final task status with video URL
    ///
    /// # Errors
    /// * Returns `PollingTimeout` if task doesn't complete within timeout
    /// * Returns `InvalidTaskStatus` if task enters failed state
    pub async fn poll_task(&self, task_id: &str) -> Result<TaskStatusResponse> {
        info!(
            "Starting to poll task {} (interval: {:?}, timeout: {:?})",
            task_id, self.polling_interval, self.polling_timeout
        );

        let start_time = std::time::Instant::now();

        loop {
            // Check timeout
            if start_time.elapsed() > self.polling_timeout {
                return Err(SeedanceError::PollingTimeout(self.polling_timeout.as_secs()));
            }

            // Query task status
            let response = self.query_task(task_id).await?;

            match response.status {
                TaskStatus::Completed => {
                    info!("Task {} completed successfully", task_id);
                    return Ok(response);
                },
                TaskStatus::Failed => {
                    warn!("Task {} failed: {:?}", task_id, response.error);
                    return Err(SeedanceError::InvalidTaskStatus(format!(
                        "Task failed: {}",
                        response.error.unwrap_or_else(|| "Unknown error".to_string())
                    )));
                },
                TaskStatus::Pending | TaskStatus::Processing => {
                    debug!(
                        "Task {} still in progress ({:?}%, elapsed: {:?})",
                        task_id,
                        response.progress,
                        start_time.elapsed()
                    );
                    tokio::time::sleep(self.polling_interval).await;
                },
            }
        }
    }

    /// Create task and wait for completion
    ///
    /// # Arguments
    /// * `request` - Task creation request
    ///
    /// # Returns
    /// * `Result<String>` - Video URL of completed task
    ///
    /// # Convenience Method
    /// This combines create_task and poll_task into a single call
    pub async fn create_and_wait(&self, request: &TaskCreateRequest) -> Result<String> {
        // Create task
        let create_response = self.create_task(request).await?;

        // Poll until completion
        let status_response = self.poll_task(&create_response.task_id).await?;

        // Extract video URL
        status_response.video_url.ok_or_else(|| {
            SeedanceError::InvalidResponse("Completed task missing video URL".to_string())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let client = SeedanceClient::new("test-api-key".to_string());
        assert!(client.is_ok());
    }

    #[test]
    fn test_client_missing_api_key() {
        let client = SeedanceClient::new("".to_string());
        assert!(matches!(client.err(), Some(SeedanceError::MissingApiKey)));
    }

    #[test]
    fn test_client_with_custom_url() {
        let client = SeedanceClient::new("test-key".to_string())
            .unwrap()
            .with_base_url("https://custom.api.com".to_string());
        assert_eq!(client.base_url, "https://custom.api.com");
    }

    #[test]
    fn test_client_with_polling_config() {
        let client = SeedanceClient::new("test-key".to_string())
            .unwrap()
            .with_polling_interval(Duration::from_secs(10))
            .with_polling_timeout(Duration::from_secs(600));
        assert_eq!(client.polling_interval, Duration::from_secs(10));
        assert_eq!(client.polling_timeout, Duration::from_secs(600));
    }

    #[tokio::test]
    async fn test_task_status_terminal() {
        let status = TaskStatus::Completed;
        assert!(status.is_terminal());
        assert!(!status.is_in_progress());
    }
}
