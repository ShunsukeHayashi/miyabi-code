//\! Priority Calculator for Task Scheduling
//\!
//\! Calculates priority scores for GitHub Issues based on labels and dependencies.

use crate::error::{Result, SchedulerError};
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Priority score (0-100)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub struct PriorityScore(u8);

impl PriorityScore {
    /// Maximum priority score
    pub const MAX: Self = Self(100);

    /// Minimum priority score
    pub const MIN: Self = Self(0);

    /// Create a new priority score
    pub fn new(value: u8) -> Result<Self> {
        if value > 100 {
            return Err(SchedulerError::InvalidPriority(value));
        }
        Ok(Self(value))
    }

    /// Get the inner value
    pub fn value(&self) -> u8 {
        self.0
    }
}

/// Priority level from labels
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PriorityLevel {
    /// P0 - Critical (Score: 100)
    P0Critical,
    /// P1 - High (Score: 80)
    P1High,
    /// P2 - Medium (Score: 50)
    P2Medium,
    /// P3 - Low (Score: 20)
    P3Low,
}

impl PriorityLevel {
    /// Parse from label string
    pub fn from_label(label: &str) -> Option<Self> {
        match label {
            "priority:P0-Critical" | "P0-Critical" | "P0" => Some(Self::P0Critical),
            "priority:P1-High" | "P1-High" | "P1" => Some(Self::P1High),
            "priority:P2-Medium" | "P2-Medium" | "P2" => Some(Self::P2Medium),
            "priority:P3-Low" | "P3-Low" | "P3" => Some(Self::P3Low),
            _ => None,
        }
    }

    /// Get base score for this priority level
    pub fn base_score(&self) -> u8 {
        match self {
            Self::P0Critical => 100,
            Self::P1High => 80,
            Self::P2Medium => 50,
            Self::P3Low => 20,
        }
    }
}

/// Issue representation for priority calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub number: u64,
    pub title: String,
    pub labels: Vec<String>,
    pub dependencies: Vec<u64>,
    pub body: Option<String>,
}

/// Priority Calculator
#[derive(Debug, Default)]
pub struct PriorityCalculator;

impl PriorityCalculator {
    /// Create a new priority calculator
    pub fn new() -> Self {
        Self
    }

    /// Calculate priority score for an issue
    ///
    /// Priority is determined by:
    /// - Priority label (P0-P3): base score
    /// - No dependencies: +0 (ready to execute)
    /// - Has dependencies: score remains but blocked
    pub fn calculate(&self, issue: &Issue) -> Result<PriorityScore> {
        // Find priority label
        let priority_level = issue
            .labels
            .iter()
            .find_map(|l| PriorityLevel::from_label(l))
            .unwrap_or(PriorityLevel::P2Medium); // Default to P2

        let base_score = priority_level.base_score();

        PriorityScore::new(base_score)
    }

    /// Check if issue has unresolved dependencies
    pub fn has_dependencies(&self, issue: &Issue) -> bool {
        !issue.dependencies.is_empty()
    }

    /// Estimate completion time based on issue type and complexity
    pub fn estimate_time(&self, issue: &Issue) -> Duration {
        // Parse labels for type and complexity
        let is_feature = issue.labels.iter().any(|l| l.contains("feature"));
        let is_bug = issue.labels.iter().any(|l| l.contains("bug"));
        let is_refactor = issue.labels.iter().any(|l| l.contains("refactor"));
        let is_docs = issue.labels.iter().any(|l| l.contains("docs"));
        let is_test = issue.labels.iter().any(|l| l.contains("test"));

        // Base estimates (in minutes)
        let base_minutes = if is_feature {
            45 // Features take longer
        } else if is_refactor {
            30 // Refactoring is medium
        } else if is_bug {
            20 // Bugs are usually quicker
        } else if is_test {
            15 // Tests are quick
        } else if is_docs {
            10 // Docs are fastest
        } else {
            30 // Default
        };

        Duration::from_secs(base_minutes * 60)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_priority_level_parsing() {
        assert_eq!(
            PriorityLevel::from_label("priority:P0-Critical"),
            Some(PriorityLevel::P0Critical)
        );
        assert_eq!(
            PriorityLevel::from_label("P1-High"),
            Some(PriorityLevel::P1High)
        );
        assert_eq!(
            PriorityLevel::from_label("P2"),
            Some(PriorityLevel::P2Medium)
        );
        assert_eq!(PriorityLevel::from_label("invalid"), None);
    }

    #[test]
    fn test_base_scores() {
        assert_eq!(PriorityLevel::P0Critical.base_score(), 100);
        assert_eq!(PriorityLevel::P1High.base_score(), 80);
        assert_eq!(PriorityLevel::P2Medium.base_score(), 50);
        assert_eq!(PriorityLevel::P3Low.base_score(), 20);
    }

    #[test]
    fn test_priority_calculation() {
        let calc = PriorityCalculator::new();

        // P0 issue
        let issue_p0 = Issue {
            number: 123,
            title: "Critical bug".to_string(),
            labels: vec!["P0-Critical".to_string(), "type:bug".to_string()],
            dependencies: vec![],
            body: None,
        };
        let score = calc.calculate(&issue_p0).unwrap();
        assert_eq!(score.value(), 100);

        // P1 issue
        let issue_p1 = Issue {
            number: 456,
            title: "New feature".to_string(),
            labels: vec!["P1-High".to_string(), "type:feature".to_string()],
            dependencies: vec![],
            body: None,
        };
        let score = calc.calculate(&issue_p1).unwrap();
        assert_eq!(score.value(), 80);
    }

    #[test]
    fn test_dependency_check() {
        let calc = PriorityCalculator::new();

        let issue_no_deps = Issue {
            number: 1,
            title: "Independent task".to_string(),
            labels: vec![],
            dependencies: vec![],
            body: None,
        };
        assert!(!calc.has_dependencies(&issue_no_deps));

        let issue_with_deps = Issue {
            number: 2,
            title: "Dependent task".to_string(),
            labels: vec![],
            dependencies: vec![1],
            body: None,
        };
        assert!(calc.has_dependencies(&issue_with_deps));
    }

    #[test]
    fn test_time_estimation() {
        let calc = PriorityCalculator::new();

        // Feature
        let feature = Issue {
            number: 1,
            title: "Feature".to_string(),
            labels: vec!["type:feature".to_string()],
            dependencies: vec![],
            body: None,
        };
        assert_eq!(calc.estimate_time(&feature), Duration::from_secs(45 * 60));

        // Bug
        let bug = Issue {
            number: 2,
            title: "Bug fix".to_string(),
            labels: vec!["type:bug".to_string()],
            dependencies: vec![],
            body: None,
        };
        assert_eq!(calc.estimate_time(&bug), Duration::from_secs(20 * 60));
    }
}
