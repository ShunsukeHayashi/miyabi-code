//! Quality assessment types

use serde::{Deserialize, Serialize};

/// Quality report from ReviewAgent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityReport {
    pub score: u8, // 0-100
    pub passed: bool, // score >= 80
    pub issues: Vec<QualityIssue>,
    pub recommendations: Vec<String>,
    pub breakdown: QualityBreakdown,
}

/// Quality score breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityBreakdown {
    pub eslint_score: u8,
    pub typescript_score: u8,
    pub security_score: u8,
    pub test_coverage_score: u8,
}

/// Quality issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityIssue {
    #[serde(rename = "type")]
    pub issue_type: QualityIssueType,
    pub severity: QualitySeverity,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
    pub score_impact: u8, // Points deducted
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum QualityIssueType {
    Eslint,
    Typescript,
    Security,
    Coverage,
}

/// Quality severity (ordered from lowest to highest for Ord)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum QualitySeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Review comment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewComment {
    pub file: String,
    pub line: u32,
    pub severity: QualitySeverity,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
}

/// Review request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewRequest {
    pub files: Vec<String>,
    pub branch: String,
    pub context: String,
}

/// Review result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewResult {
    pub quality_report: QualityReport,
    pub approved: bool,
    pub escalation_required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub escalation_target: Option<crate::agent::EscalationTarget>,
    pub comments: Vec<ReviewComment>,
}

impl QualityReport {
    /// Check if quality meets threshold (80+)
    pub fn meets_threshold(&self) -> bool {
        self.score >= 80
    }

    /// Get GitHub label based on score
    pub fn to_label(&self) -> &'static str {
        match self.score {
            90..=100 => "⭐ quality:excellent",
            80..=89 => "✅ quality:good",
            60..=79 => "⚠️ quality:needs-improvement",
            _ => "❌ quality:poor",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // QualitySeverity Tests
    // ========================================================================

    #[test]
    fn test_quality_severity_ordering() {
        assert!(QualitySeverity::Critical > QualitySeverity::High);
        assert!(QualitySeverity::High > QualitySeverity::Medium);
        assert!(QualitySeverity::Medium > QualitySeverity::Low);
    }

    #[test]
    fn test_quality_severity_serialization() {
        let sev = QualitySeverity::Critical;
        let json = serde_json::to_string(&sev).unwrap();
        assert_eq!(json, "\"critical\"");

        let sev = QualitySeverity::Low;
        let json = serde_json::to_string(&sev).unwrap();
        assert_eq!(json, "\"low\"");
    }

    #[test]
    fn test_quality_severity_roundtrip() {
        let severities = vec![
            QualitySeverity::Low,
            QualitySeverity::Medium,
            QualitySeverity::High,
            QualitySeverity::Critical,
        ];

        for sev in severities {
            let json = serde_json::to_string(&sev).unwrap();
            let deserialized: QualitySeverity = serde_json::from_str(&json).unwrap();
            assert_eq!(sev, deserialized);
        }
    }

    // ========================================================================
    // QualityIssueType Tests
    // ========================================================================

    #[test]
    fn test_quality_issue_type_serialization() {
        let issue_type = QualityIssueType::Eslint;
        let json = serde_json::to_string(&issue_type).unwrap();
        assert_eq!(json, "\"eslint\"");

        let issue_type = QualityIssueType::Security;
        let json = serde_json::to_string(&issue_type).unwrap();
        assert_eq!(json, "\"security\"");
    }

    #[test]
    fn test_quality_issue_type_roundtrip() {
        let types = vec![
            QualityIssueType::Eslint,
            QualityIssueType::Typescript,
            QualityIssueType::Security,
            QualityIssueType::Coverage,
        ];

        for issue_type in types {
            let json = serde_json::to_string(&issue_type).unwrap();
            let deserialized: QualityIssueType = serde_json::from_str(&json).unwrap();
            assert_eq!(issue_type, deserialized);
        }
    }

    // ========================================================================
    // QualityBreakdown Tests
    // ========================================================================

    #[test]
    fn test_quality_breakdown_serialization() {
        let breakdown = QualityBreakdown {
            eslint_score: 90,
            typescript_score: 85,
            security_score: 95,
            test_coverage_score: 80,
        };

        let json = serde_json::to_string(&breakdown).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["eslint_score"], 90);
        assert_eq!(parsed["security_score"], 95);
    }

    #[test]
    fn test_quality_breakdown_roundtrip() {
        let breakdown = QualityBreakdown {
            eslint_score: 100,
            typescript_score: 95,
            security_score: 90,
            test_coverage_score: 85,
        };

        let json = serde_json::to_string(&breakdown).unwrap();
        let deserialized: QualityBreakdown = serde_json::from_str(&json).unwrap();
        assert_eq!(breakdown.eslint_score, deserialized.eslint_score);
        assert_eq!(breakdown.security_score, deserialized.security_score);
    }

    // ========================================================================
    // QualityIssue Tests
    // ========================================================================

    #[test]
    fn test_quality_issue_serialization() {
        let issue = QualityIssue {
            issue_type: QualityIssueType::Eslint,
            severity: QualitySeverity::High,
            message: "Missing semicolon".to_string(),
            file: Some("src/main.ts".to_string()),
            line: Some(42),
            column: Some(10),
            score_impact: 5,
        };

        let json = serde_json::to_string(&issue).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["type"], "eslint");
        assert_eq!(parsed["severity"], "high");
        assert_eq!(parsed["file"], "src/main.ts");
        assert_eq!(parsed["line"], 42);
        assert_eq!(parsed["score_impact"], 5);
    }

    #[test]
    fn test_quality_issue_minimal() {
        let issue = QualityIssue {
            issue_type: QualityIssueType::Security,
            severity: QualitySeverity::Critical,
            message: "Potential XSS vulnerability".to_string(),
            file: None,
            line: None,
            column: None,
            score_impact: 20,
        };

        let json = serde_json::to_string(&issue).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("file").is_none());
        assert!(parsed.get("line").is_none());
        assert_eq!(parsed["score_impact"], 20);
    }

    // ========================================================================
    // QualityReport Tests
    // ========================================================================

    #[test]
    fn test_quality_report_threshold() {
        let report = QualityReport {
            score: 85,
            passed: true,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 90,
                typescript_score: 85,
                security_score: 80,
                test_coverage_score: 85,
            },
        };
        assert!(report.meets_threshold());

        let report_fail = QualityReport {
            score: 75,
            passed: false,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 75,
                typescript_score: 75,
                security_score: 75,
                test_coverage_score: 75,
            },
        };
        assert!(!report_fail.meets_threshold());
    }

    #[test]
    fn test_quality_report_to_label() {
        let report_excellent = QualityReport {
            score: 95,
            passed: true,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 95,
                typescript_score: 95,
                security_score: 95,
                test_coverage_score: 95,
            },
        };
        assert_eq!(report_excellent.to_label(), "⭐ quality:excellent");

        let report_good = QualityReport {
            score: 85,
            passed: true,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 85,
                typescript_score: 85,
                security_score: 85,
                test_coverage_score: 85,
            },
        };
        assert_eq!(report_good.to_label(), "✅ quality:good");

        let report_needs_improvement = QualityReport {
            score: 70,
            passed: false,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 70,
                typescript_score: 70,
                security_score: 70,
                test_coverage_score: 70,
            },
        };
        assert_eq!(
            report_needs_improvement.to_label(),
            "⚠️ quality:needs-improvement"
        );

        let report_poor = QualityReport {
            score: 50,
            passed: false,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 50,
                typescript_score: 50,
                security_score: 50,
                test_coverage_score: 50,
            },
        };
        assert_eq!(report_poor.to_label(), "❌ quality:poor");
    }

    #[test]
    fn test_quality_report_with_issues() {
        let issue = QualityIssue {
            issue_type: QualityIssueType::Typescript,
            severity: QualitySeverity::Medium,
            message: "Type mismatch".to_string(),
            file: Some("src/types.ts".to_string()),
            line: Some(10),
            column: Some(5),
            score_impact: 3,
        };

        let report = QualityReport {
            score: 82,
            passed: true,
            issues: vec![issue],
            recommendations: vec!["Fix type annotations".to_string()],
            breakdown: QualityBreakdown {
                eslint_score: 90,
                typescript_score: 75,
                security_score: 85,
                test_coverage_score: 80,
            },
        };

        let json = serde_json::to_string(&report).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["score"], 82);
        assert_eq!(parsed["issues"].as_array().unwrap().len(), 1);
        assert_eq!(parsed["recommendations"].as_array().unwrap().len(), 1);
    }

    // ========================================================================
    // ReviewComment Tests
    // ========================================================================

    #[test]
    fn test_review_comment_serialization() {
        let comment = ReviewComment {
            file: "src/app.ts".to_string(),
            line: 15,
            severity: QualitySeverity::High,
            message: "Consider using const instead of let".to_string(),
            suggestion: Some("const myVar = ...".to_string()),
        };

        let json = serde_json::to_string(&comment).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["file"], "src/app.ts");
        assert_eq!(parsed["line"], 15);
        assert_eq!(parsed["severity"], "high");
        assert_eq!(parsed["suggestion"], "const myVar = ...");
    }

    #[test]
    fn test_review_comment_without_suggestion() {
        let comment = ReviewComment {
            file: "src/utils.ts".to_string(),
            line: 20,
            severity: QualitySeverity::Low,
            message: "Minor style issue".to_string(),
            suggestion: None,
        };

        let json = serde_json::to_string(&comment).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("suggestion").is_none());
    }

    // ========================================================================
    // ReviewRequest Tests
    // ========================================================================

    #[test]
    fn test_review_request_serialization() {
        let request = ReviewRequest {
            files: vec!["src/main.ts".to_string(), "src/utils.ts".to_string()],
            branch: "feature/new-feature".to_string(),
            context: "Adding new feature".to_string(),
        };

        let json = serde_json::to_string(&request).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["files"].as_array().unwrap().len(), 2);
        assert_eq!(parsed["branch"], "feature/new-feature");
    }

    // ========================================================================
    // ReviewResult Tests
    // ========================================================================

    #[test]
    fn test_review_result_approved() {
        let report = QualityReport {
            score: 90,
            passed: true,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 90,
                typescript_score: 90,
                security_score: 90,
                test_coverage_score: 90,
            },
        };

        let result = ReviewResult {
            quality_report: report,
            approved: true,
            escalation_required: false,
            escalation_target: None,
            comments: vec![],
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["approved"], true);
        assert_eq!(parsed["escalation_required"], false);
    }

    #[test]
    fn test_review_result_with_escalation() {
        let report = QualityReport {
            score: 50,
            passed: false,
            issues: vec![],
            recommendations: vec![],
            breakdown: QualityBreakdown {
                eslint_score: 50,
                typescript_score: 50,
                security_score: 40,
                test_coverage_score: 60,
            },
        };

        let result = ReviewResult {
            quality_report: report,
            approved: false,
            escalation_required: true,
            escalation_target: Some(crate::agent::EscalationTarget::TechLead),
            comments: vec![],
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["approved"], false);
        assert_eq!(parsed["escalation_target"], "TechLead");
    }
}
