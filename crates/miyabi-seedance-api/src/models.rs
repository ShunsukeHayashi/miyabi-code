//! Data models for Seedance API

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Seedance API task creation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCreateRequest {
    /// Model to use (e.g., "seedance-1-0-pro-250528")
    pub model: String,
    /// Prompt for video generation
    pub prompt: String,
    /// Video resolution (e.g., "1080p")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Video duration in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<u32>,
    /// Camera fixed or moving
    #[serde(skip_serializing_if = "Option::is_none")]
    pub camera_fixed: Option<bool>,
    /// Previous frame URL for temporal coherence
    #[serde(skip_serializing_if = "Option::is_none")]
    pub previous_frame_url: Option<String>,
}

impl TaskCreateRequest {
    /// Create a new task request with default settings
    pub fn new(prompt: String) -> Self {
        Self {
            model: "seedance-1-0-pro-250528".to_string(),
            prompt,
            resolution: Some("1080p".to_string()),
            duration: Some(5),
            camera_fixed: Some(false),
            previous_frame_url: None,
        }
    }

    /// Set previous frame URL for temporal coherence
    pub fn with_previous_frame(mut self, url: String) -> Self {
        self.previous_frame_url = Some(url);
        self
    }

    /// Set resolution
    pub fn with_resolution(mut self, resolution: String) -> Self {
        self.resolution = Some(resolution);
        self
    }

    /// Set duration
    pub fn with_duration(mut self, duration: u32) -> Self {
        self.duration = Some(duration);
        self
    }
}

/// Seedance API task creation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskCreateResponse {
    /// Task ID
    pub task_id: String,
    /// Task status
    pub status: TaskStatus,
    /// Error message (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Seedance API task status query response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskStatusResponse {
    /// Task ID
    pub task_id: String,
    /// Task status
    pub status: TaskStatus,
    /// Video URL (when completed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_url: Option<String>,
    /// Progress percentage (0-100)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<u8>,
    /// Error message (if failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Task status enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    /// Task is queued
    Pending,
    /// Task is processing
    Processing,
    /// Task completed successfully
    Completed,
    /// Task failed
    Failed,
}

impl TaskStatus {
    /// Check if task is terminal (completed or failed)
    pub fn is_terminal(&self) -> bool {
        matches!(self, TaskStatus::Completed | TaskStatus::Failed)
    }

    /// Check if task is still in progress
    pub fn is_in_progress(&self) -> bool {
        matches!(self, TaskStatus::Pending | TaskStatus::Processing)
    }
}

/// Video generation task metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoTask {
    /// Internal task ID
    pub id: Uuid,
    /// Seedance API task ID
    pub seedance_task_id: String,
    /// Segment ID (from prompt engine)
    pub segment_id: u32,
    /// Task status
    pub status: TaskStatus,
    /// Prompt used
    pub prompt: String,
    /// Video URL (when completed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_url: Option<String>,
    /// Error message (if failed)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Creation timestamp
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Last update timestamp
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl VideoTask {
    /// Create a new video task
    pub fn new(segment_id: u32, seedance_task_id: String, prompt: String) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4(),
            seedance_task_id,
            segment_id,
            status: TaskStatus::Pending,
            prompt,
            video_url: None,
            error: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Update task status from API response
    pub fn update_from_response(&mut self, response: &TaskStatusResponse) {
        self.status = response.status;
        self.video_url = response.video_url.clone();
        self.error = response.error.clone();
        self.updated_at = chrono::Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_create_request_new() {
        let req = TaskCreateRequest::new("test prompt".to_string());
        assert_eq!(req.model, "seedance-1-0-pro-250528");
        assert_eq!(req.prompt, "test prompt");
        assert_eq!(req.resolution, Some("1080p".to_string()));
        assert_eq!(req.duration, Some(5));
        assert_eq!(req.camera_fixed, Some(false));
        assert!(req.previous_frame_url.is_none());
    }

    #[test]
    fn test_task_create_request_with_previous_frame() {
        let req = TaskCreateRequest::new("test prompt".to_string())
            .with_previous_frame("https://example.com/video.mp4".to_string());
        assert_eq!(
            req.previous_frame_url,
            Some("https://example.com/video.mp4".to_string())
        );
    }

    #[test]
    fn test_task_status_is_terminal() {
        assert!(TaskStatus::Completed.is_terminal());
        assert!(TaskStatus::Failed.is_terminal());
        assert!(!TaskStatus::Pending.is_terminal());
        assert!(!TaskStatus::Processing.is_terminal());
    }

    #[test]
    fn test_task_status_is_in_progress() {
        assert!(TaskStatus::Pending.is_in_progress());
        assert!(TaskStatus::Processing.is_in_progress());
        assert!(!TaskStatus::Completed.is_in_progress());
        assert!(!TaskStatus::Failed.is_in_progress());
    }

    #[test]
    fn test_video_task_new() {
        let task = VideoTask::new(0, "task-123".to_string(), "test prompt".to_string());
        assert_eq!(task.segment_id, 0);
        assert_eq!(task.seedance_task_id, "task-123");
        assert_eq!(task.status, TaskStatus::Pending);
        assert_eq!(task.prompt, "test prompt");
        assert!(task.video_url.is_none());
        assert!(task.error.is_none());
    }

    #[test]
    fn test_video_task_update_from_response() {
        let mut task = VideoTask::new(0, "task-123".to_string(), "test prompt".to_string());

        let response = TaskStatusResponse {
            task_id: "task-123".to_string(),
            status: TaskStatus::Completed,
            video_url: Some("https://example.com/video.mp4".to_string()),
            progress: Some(100),
            error: None,
        };

        task.update_from_response(&response);
        assert_eq!(task.status, TaskStatus::Completed);
        assert_eq!(
            task.video_url,
            Some("https://example.com/video.mp4".to_string())
        );
    }
}
