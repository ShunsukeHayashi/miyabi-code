//! Issue analysis logic

use miyabi_types::Issue;
use serde::{Deserialize, Serialize};

/// Complexity level of an Issue
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ComplexityLevel {
    /// Low complexity (< 5.0): Can be auto-approved
    Low,
    /// Medium complexity (5.0-7.0): Notify and proceed with monitoring
    Medium,
    /// High complexity (>= 7.0): Escalate to human
    High,
}

impl ComplexityLevel {
    /// Convert to numeric score (0.0-10.0)
    pub fn to_score(&self) -> f64 {
        match self {
            ComplexityLevel::Low => 3.0,
            ComplexityLevel::Medium => 6.0,
            ComplexityLevel::High => 8.0,
        }
    }

    /// Create from numeric score
    pub fn from_score(score: f64) -> Self {
        if score < 5.0 {
            ComplexityLevel::Low
        } else if score < 7.0 {
            ComplexityLevel::Medium
        } else {
            ComplexityLevel::High
        }
    }
}

/// Result of Issue analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueAnalysis {
    /// Issue number
    pub issue_number: u64,

    /// Estimated complexity score (0.0-10.0)
    pub complexity: f64,

    /// Complexity level category
    pub complexity_level: ComplexityLevel,

    /// Suggested labels
    pub labels: Vec<String>,

    /// Estimated duration in hours
    pub estimated_duration_hours: u32,

    /// Reasoning for the complexity estimate
    pub reasoning: String,
}

impl IssueAnalysis {
    /// Analyze an Issue and estimate complexity
    pub fn analyze(issue: &Issue) -> Self {
        let complexity = Self::estimate_complexity(issue);
        let complexity_level = ComplexityLevel::from_score(complexity);
        let labels = Self::suggest_labels(issue);
        let estimated_duration_hours = (complexity * 2.0) as u32;
        let reasoning = Self::generate_reasoning(issue, complexity);

        Self {
            issue_number: issue.number,
            complexity,
            complexity_level,
            labels,
            estimated_duration_hours,
            reasoning,
        }
    }

    /// Estimate complexity (0-10)
    fn estimate_complexity(issue: &Issue) -> f64 {
        let mut complexity: f64 = 3.0; // Base complexity

        // Increase for longer descriptions
        if issue.body.len() > 500 {
            complexity += 1.0;
        }
        if issue.body.len() > 1000 {
            complexity += 1.0;
        }

        // Combine title and body for keyword analysis
        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        // High complexity indicators
        if combined_text.contains("database") || combined_text.contains("migration") {
            complexity += 2.0;
        }
        if combined_text.contains("security") || combined_text.contains("auth") {
            complexity += 1.5;
        }
        if combined_text.contains("refactor") || combined_text.contains("架構") {
            complexity += 1.0;
        }
        if combined_text.contains("breaking change") || combined_text.contains("api change") {
            complexity += 2.0;
        }

        // Medium complexity indicators
        if combined_text.contains("integration") || combined_text.contains("統合") {
            complexity += 1.0;
        }
        if combined_text.contains("performance") || combined_text.contains("optimization") {
            complexity += 1.5;
        }

        // Multiple file changes
        if combined_text.contains("multiple files") || combined_text.contains("複数") {
            complexity += 1.0;
        }

        // Testing requirements
        if combined_text.contains("test") || combined_text.contains("テスト") {
            complexity += 0.5;
        }

        // Cap at 10.0
        complexity.min(10.0)
    }

    /// Suggest labels based on issue content
    fn suggest_labels(issue: &Issue) -> Vec<String> {
        let mut labels = Vec::new();

        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        // Type detection
        if combined_text.contains("bug") || combined_text.contains("fix") || combined_text.contains("バグ") {
            labels.push("type:bug".to_string());
        } else if combined_text.contains("feature") || combined_text.contains("add") || combined_text.contains("機能")
        {
            labels.push("type:feature".to_string());
        } else if combined_text.contains("refactor") || combined_text.contains("リファクタ") {
            labels.push("type:refactor".to_string());
        } else if combined_text.contains("docs") || combined_text.contains("documentation") {
            labels.push("type:docs".to_string());
        } else if combined_text.contains("test") || combined_text.contains("テスト") {
            labels.push("type:test".to_string());
        } else {
            // Default to feature if unclear
            labels.push("type:feature".to_string());
        }

        // Priority detection
        if combined_text.contains("urgent") || combined_text.contains("critical") || combined_text.contains("緊急") {
            labels.push("priority:P0-Critical".to_string());
        } else if combined_text.contains("important")
            || combined_text.contains("high")
            || combined_text.contains("重要")
        {
            labels.push("priority:P1-High".to_string());
        } else if combined_text.contains("low") || combined_text.contains("nice to have") {
            labels.push("priority:P3-Low".to_string());
        } else {
            labels.push("priority:P2-Medium".to_string());
        }

        // Component detection
        if combined_text.contains("agent") || combined_text.contains("エージェント") {
            labels.push("component:agent".to_string());
        }
        if combined_text.contains("webhook") {
            labels.push("component:webhook".to_string());
        }
        if combined_text.contains("orchestrator") || combined_text.contains("オーケストレーター") {
            labels.push("component:orchestrator".to_string());
        }

        // State label
        labels.push("state:pending".to_string());

        labels
    }

    /// Generate reasoning for complexity estimate
    fn generate_reasoning(issue: &Issue, complexity: f64) -> String {
        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        let mut reasons = Vec::new();

        if complexity < 5.0 {
            reasons.push("Relatively straightforward implementation");
        }

        if combined_text.contains("database") {
            reasons.push("Database changes require careful migration planning");
        }
        if combined_text.contains("security") {
            reasons.push("Security implications require thorough review");
        }
        if combined_text.contains("refactor") {
            reasons.push("Refactoring may affect multiple components");
        }
        if combined_text.contains("breaking change") {
            reasons.push("Breaking changes require version bump and documentation");
        }
        if issue.body.len() > 1000 {
            reasons.push("Detailed description suggests substantial scope");
        }

        if reasons.is_empty() {
            format!("Complexity score: {:.1}/10.0 based on keyword analysis", complexity)
        } else {
            format!("Complexity score: {:.1}/10.0. {}", complexity, reasons.join(". "))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::issue::IssueStateGithub;

    fn create_test_issue(number: u64, title: &str, body: &str) -> Issue {
        Issue {
            number,
            title: title.to_string(),
            body: body.to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/test/repo/issues/{}", number),
        }
    }

    #[test]
    fn test_low_complexity() {
        let issue = create_test_issue(123, "Add button", "Simple UI change");
        let analysis = IssueAnalysis::analyze(&issue);

        assert_eq!(analysis.complexity_level, ComplexityLevel::Low);
        assert!(analysis.complexity < 5.0);
    }

    #[test]
    fn test_high_complexity_database() {
        let issue =
            create_test_issue(123, "Database migration", "Add new database table for users with migration scripts");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.complexity >= 5.0);
        assert!(analysis.labels.contains(&"type:feature".to_string()));
    }

    #[test]
    fn test_bug_label_detection() {
        let issue = create_test_issue(123, "Fix login bug", "Users cannot login");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.labels.contains(&"type:bug".to_string()));
    }

    #[test]
    fn test_priority_detection() {
        let issue = create_test_issue(123, "Urgent fix needed", "Critical production issue");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.labels.contains(&"priority:P0-Critical".to_string()));
    }

    #[test]
    fn test_complexity_level_from_score() {
        assert_eq!(ComplexityLevel::from_score(3.0), ComplexityLevel::Low);
        assert_eq!(ComplexityLevel::from_score(6.0), ComplexityLevel::Medium);
        assert_eq!(ComplexityLevel::from_score(8.0), ComplexityLevel::High);
    }
}
