//! Development Issue Tracking
//!
//! This module provides structures for tracking development issues,
//! including bugs, errors, and other problems encountered during development.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Severity level of an issue
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    /// Low severity - minor issues, cosmetic problems
    Low,
    /// Medium severity - functionality issues that have workarounds
    Medium,
    /// High severity - significant functionality issues
    High,
    /// Critical severity - system-breaking issues, security vulnerabilities
    Critical,
}

/// Status of an issue
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    /// Issue is being drafted locally
    Draft,
    /// Issue is queued to be posted
    Queued,
    /// Issue has been posted to GitHub
    Posted,
}

/// Source information for an issue
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Source {
    /// Application or component that generated the issue
    pub app: String,
    /// Environment where the issue occurred (e.g., "development", "production")
    pub environment: String,
    /// Session ID when the issue was detected
    pub session_id: String,
    /// Tool name that encountered the issue
    pub tool_name: Option<String>,
    /// Raw error message or details
    pub raw_error: Option<String>,
}

/// GitHub-related information for an issue
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GitHub {
    /// GitHub issue number (if posted)
    pub issue_number: Option<u64>,
    /// Repository name (e.g., "owner/repo")
    pub repo: String,
}

/// Timestamps for issue lifecycle events
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Timestamps {
    /// When the issue was created
    pub created_at: DateTime<Utc>,
    /// When the issue was last updated
    pub updated_at: DateTime<Utc>,
    /// When the issue was posted to GitHub (if applicable)
    pub posted_at: Option<DateTime<Utc>>,
}

/// A development issue representing a bug, error, or problem
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DevIssue {
    /// Issue title
    pub title: String,
    /// Detailed description of the issue
    pub description: String,
    /// Steps to reproduce the issue
    pub steps_to_reproduce: Vec<String>,
    /// Expected behavior
    pub expected: String,
    /// Actual behavior observed
    pub actual: String,
    /// Severity level of the issue
    pub severity: Severity,
    /// Category or type of issue (e.g., "bug", "performance", "security")
    pub category: String,
    /// Source information
    pub source: Source,
    /// Current status of the issue
    pub status: Status,
    /// GitHub-related information
    pub github: GitHub,
    /// Timestamps for the issue lifecycle
    pub timestamps: Timestamps,
}

impl DevIssue {
    /// Create a new development issue
    pub fn new(
        title: String,
        description: String,
        severity: Severity,
        category: String,
        source: Source,
        github_repo: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            title,
            description,
            steps_to_reproduce: Vec::new(),
            expected: String::new(),
            actual: String::new(),
            severity,
            category,
            source,
            status: Status::Draft,
            github: GitHub {
                issue_number: None,
                repo: github_repo,
            },
            timestamps: Timestamps {
                created_at: now,
                updated_at: now,
                posted_at: None,
            },
        }
    }

    /// Update the issue status
    pub fn set_status(&mut self, status: Status) {
        self.status = status;
        self.timestamps.updated_at = Utc::now();

        if status == Status::Posted && self.timestamps.posted_at.is_none() {
            self.timestamps.posted_at = Some(Utc::now());
        }
    }

    /// Set the GitHub issue number
    pub fn set_issue_number(&mut self, issue_number: u64) {
        self.github.issue_number = Some(issue_number);
        self.timestamps.updated_at = Utc::now();
    }

    /// Add a step to reproduce
    pub fn add_reproduction_step(&mut self, step: String) {
        self.steps_to_reproduce.push(step);
        self.timestamps.updated_at = Utc::now();
    }

    /// Set expected behavior
    pub fn set_expected(&mut self, expected: String) {
        self.expected = expected;
        self.timestamps.updated_at = Utc::now();
    }

    /// Set actual behavior
    pub fn set_actual(&mut self, actual: String) {
        self.actual = actual;
        self.timestamps.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_severity_ordering() {
        assert!(Severity::Low < Severity::Medium);
        assert!(Severity::Medium < Severity::High);
        assert!(Severity::High < Severity::Critical);
    }

    #[test]
    fn test_dev_issue_creation() {
        let source = Source {
            app: "test-app".to_string(),
            environment: "development".to_string(),
            session_id: "session-123".to_string(),
            tool_name: Some("bash".to_string()),
            raw_error: Some("Error: command not found".to_string()),
        };

        let issue = DevIssue::new(
            "Test Issue".to_string(),
            "This is a test issue".to_string(),
            Severity::Medium,
            "bug".to_string(),
            source,
            "owner/repo".to_string(),
        );

        assert_eq!(issue.title, "Test Issue");
        assert_eq!(issue.severity, Severity::Medium);
        assert_eq!(issue.status, Status::Draft);
        assert_eq!(issue.github.repo, "owner/repo");
        assert!(issue.github.issue_number.is_none());
    }

    #[test]
    fn test_status_update() {
        let source = Source {
            app: "test-app".to_string(),
            environment: "development".to_string(),
            session_id: "session-123".to_string(),
            tool_name: None,
            raw_error: None,
        };

        let mut issue = DevIssue::new(
            "Test".to_string(),
            "Desc".to_string(),
            Severity::Low,
            "bug".to_string(),
            source,
            "owner/repo".to_string(),
        );

        assert_eq!(issue.status, Status::Draft);
        assert!(issue.timestamps.posted_at.is_none());

        issue.set_status(Status::Posted);
        assert_eq!(issue.status, Status::Posted);
        assert!(issue.timestamps.posted_at.is_some());
    }

    #[test]
    fn test_serde_serialization() {
        let source = Source {
            app: "test-app".to_string(),
            environment: "development".to_string(),
            session_id: "session-123".to_string(),
            tool_name: Some("bash".to_string()),
            raw_error: Some("Error message".to_string()),
        };

        let issue = DevIssue::new(
            "Test Issue".to_string(),
            "Description".to_string(),
            Severity::High,
            "bug".to_string(),
            source,
            "owner/repo".to_string(),
        );

        // Test JSON serialization
        let json = serde_json::to_string(&issue).expect("Failed to serialize");
        let deserialized: DevIssue = serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(issue.title, deserialized.title);
        assert_eq!(issue.severity, deserialized.severity);
        assert_eq!(issue.status, deserialized.status);
    }
}
