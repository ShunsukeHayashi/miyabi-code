//! Result aggregation for multiple sessions

use crate::error::Result;
use crate::parser::AgentResult;
use crate::session::SessionId;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{debug, info};

/// Aggregated results from multiple sessions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedResult {
    /// Total number of sessions
    pub total_sessions: usize,
    /// Number of successful sessions
    pub successful_sessions: usize,
    /// Number of failed sessions
    pub failed_sessions: usize,
    /// Success rate (0.0 - 1.0)
    pub success_rate: f64,
    /// Individual session results
    pub session_results: HashMap<SessionId, AgentResult>,
    /// Aggregated error messages
    pub errors: Vec<String>,
    /// All modified files across sessions
    pub modified_files: Vec<String>,
}

impl AggregatedResult {
    /// Create a new empty AggregatedResult
    pub fn new() -> Self {
        Self {
            total_sessions: 0,
            successful_sessions: 0,
            failed_sessions: 0,
            success_rate: 0.0,
            session_results: HashMap::new(),
            errors: Vec::new(),
            modified_files: Vec::new(),
        }
    }

    /// Check if all sessions succeeded
    pub fn all_succeeded(&self) -> bool {
        self.total_sessions > 0 && self.failed_sessions == 0
    }

    /// Check if any session failed
    pub fn any_failed(&self) -> bool {
        self.failed_sessions > 0
    }

    /// Get summary message
    pub fn summary(&self) -> String {
        format!(
            "{}/{} sessions succeeded ({:.1}% success rate)",
            self.successful_sessions,
            self.total_sessions,
            self.success_rate * 100.0
        )
    }
}

impl Default for AggregatedResult {
    fn default() -> Self {
        Self::new()
    }
}

/// Result aggregator for collecting and analyzing multiple session results
pub struct ResultAggregator {
    /// Collected session results
    results: HashMap<SessionId, AgentResult>,
}

impl ResultAggregator {
    /// Create a new ResultAggregator
    pub fn new() -> Self {
        Self {
            results: HashMap::new(),
        }
    }

    /// Add a session result
    ///
    /// # Arguments
    ///
    /// * `session_id` - Session identifier
    /// * `result` - Agent result from the session
    pub fn add_result(&mut self, session_id: SessionId, result: AgentResult) {
        debug!(
            "Adding result for session {}: success={}",
            session_id, result.success
        );
        self.results.insert(session_id, result);
    }

    /// Aggregate all collected results
    ///
    /// # Returns
    ///
    /// Returns an `AggregatedResult` with statistics and combined data
    pub fn aggregate(&self) -> Result<AggregatedResult> {
        info!("Aggregating {} session results", self.results.len());

        let total_sessions = self.results.len();
        let successful_sessions = self.results.values().filter(|r| r.success).count();
        let failed_sessions = total_sessions - successful_sessions;

        let success_rate = if total_sessions > 0 {
            successful_sessions as f64 / total_sessions as f64
        } else {
            0.0
        };

        // Collect all errors
        let mut errors = Vec::new();
        for (session_id, result) in &self.results {
            if let Some(error) = &result.error {
                errors.push(format!("Session {}: {}", session_id, error));
            }
        }

        // Collect all modified files (deduplicated)
        let mut modified_files = Vec::new();
        for result in self.results.values() {
            for file in &result.files {
                if !modified_files.contains(file) {
                    modified_files.push(file.clone());
                }
            }
        }

        let aggregated = AggregatedResult {
            total_sessions,
            successful_sessions,
            failed_sessions,
            success_rate,
            session_results: self.results.clone(),
            errors,
            modified_files,
        };

        info!("Aggregation complete: {}", aggregated.summary());

        Ok(aggregated)
    }

    /// Get number of collected results
    pub fn result_count(&self) -> usize {
        self.results.len()
    }

    /// Clear all collected results
    pub fn clear(&mut self) {
        self.results.clear();
    }
}

impl Default for ResultAggregator {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_success_result() -> AgentResult {
        AgentResult {
            status: 0,
            success: true,
            message: "Success".to_string(),
            error: None,
            files: vec!["file1.rs".to_string(), "file2.rs".to_string()],
        }
    }

    fn create_failure_result() -> AgentResult {
        AgentResult {
            status: 1,
            success: false,
            message: "Failed".to_string(),
            error: Some("Test error".to_string()),
            files: vec![],
        }
    }

    #[test]
    fn test_aggregator_creation() {
        let aggregator = ResultAggregator::new();
        assert_eq!(aggregator.result_count(), 0);
    }

    #[test]
    fn test_add_result() {
        let mut aggregator = ResultAggregator::new();
        let result = create_success_result();

        aggregator.add_result("session-1".to_string(), result);
        assert_eq!(aggregator.result_count(), 1);
    }

    #[test]
    fn test_aggregate_all_success() {
        let mut aggregator = ResultAggregator::new();

        aggregator.add_result("session-1".to_string(), create_success_result());
        aggregator.add_result("session-2".to_string(), create_success_result());

        let result = aggregator.aggregate().unwrap();
        assert_eq!(result.total_sessions, 2);
        assert_eq!(result.successful_sessions, 2);
        assert_eq!(result.failed_sessions, 0);
        assert_eq!(result.success_rate, 1.0);
        assert!(result.all_succeeded());
        assert!(!result.any_failed());
    }

    #[test]
    fn test_aggregate_mixed() {
        let mut aggregator = ResultAggregator::new();

        aggregator.add_result("session-1".to_string(), create_success_result());
        aggregator.add_result("session-2".to_string(), create_failure_result());
        aggregator.add_result("session-3".to_string(), create_success_result());

        let result = aggregator.aggregate().unwrap();
        assert_eq!(result.total_sessions, 3);
        assert_eq!(result.successful_sessions, 2);
        assert_eq!(result.failed_sessions, 1);
        assert!((result.success_rate - 0.666).abs() < 0.01);
        assert!(!result.all_succeeded());
        assert!(result.any_failed());
        assert_eq!(result.errors.len(), 1);
        assert!(result.errors[0].contains("Test error"));
    }

    #[test]
    fn test_aggregate_all_failure() {
        let mut aggregator = ResultAggregator::new();

        aggregator.add_result("session-1".to_string(), create_failure_result());
        aggregator.add_result("session-2".to_string(), create_failure_result());

        let result = aggregator.aggregate().unwrap();
        assert_eq!(result.total_sessions, 2);
        assert_eq!(result.successful_sessions, 0);
        assert_eq!(result.failed_sessions, 2);
        assert_eq!(result.success_rate, 0.0);
        assert!(!result.all_succeeded());
        assert!(result.any_failed());
    }

    #[test]
    fn test_modified_files_deduplication() {
        let mut aggregator = ResultAggregator::new();

        let result1 = AgentResult {
            status: 0,
            success: true,
            message: "Success".to_string(),
            error: None,
            files: vec!["file1.rs".to_string(), "file2.rs".to_string()],
        };

        let result2 = AgentResult {
            status: 0,
            success: true,
            message: "Success".to_string(),
            error: None,
            files: vec!["file2.rs".to_string(), "file3.rs".to_string()],
        };

        aggregator.add_result("session-1".to_string(), result1);
        aggregator.add_result("session-2".to_string(), result2);

        let result = aggregator.aggregate().unwrap();
        assert_eq!(result.modified_files.len(), 3);
        assert!(result.modified_files.contains(&"file1.rs".to_string()));
        assert!(result.modified_files.contains(&"file2.rs".to_string()));
        assert!(result.modified_files.contains(&"file3.rs".to_string()));
    }

    #[test]
    fn test_summary() {
        let mut aggregator = ResultAggregator::new();

        aggregator.add_result("session-1".to_string(), create_success_result());
        aggregator.add_result("session-2".to_string(), create_failure_result());

        let result = aggregator.aggregate().unwrap();
        let summary = result.summary();
        assert!(summary.contains("1/2"));
        assert!(summary.contains("50.0"));
    }

    #[test]
    fn test_clear() {
        let mut aggregator = ResultAggregator::new();

        aggregator.add_result("session-1".to_string(), create_success_result());
        assert_eq!(aggregator.result_count(), 1);

        aggregator.clear();
        assert_eq!(aggregator.result_count(), 0);
    }
}
