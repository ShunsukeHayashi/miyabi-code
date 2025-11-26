//! Decision Engine for Autonomous Workflow Execution
//!
//! This module implements the decision engine that determines:
//! - Whether to auto-approve tasks based on complexity
//! - Whether to escalate to human review
//! - Whether to auto-merge PRs based on quality score

use serde::{Deserialize, Serialize};
use std::fmt;
use tracing::{debug, info, warn};

/// Decision thresholds for autonomous workflow
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionThresholds {
    /// Complexity below this: auto-approve (default: 5.0)
    pub complexity_auto_approve: f64,

    /// Complexity below this: notify and proceed after delay (default: 7.0)
    pub complexity_notify: f64,

    /// Complexity above this: escalate to human (default: 7.0+)
    pub complexity_escalate: f64,

    /// Quality score above this: auto-merge PR (default: 80.0)
    pub quality_auto_merge: f64,

    /// Quality score above this: human review required (default: 60.0)
    pub quality_review: f64,

    /// Quality score below this: reject (default: 60.0-)
    pub quality_reject: f64,
}

impl Default for DecisionThresholds {
    fn default() -> Self {
        Self {
            complexity_auto_approve: 5.0,
            complexity_notify: 7.0,
            complexity_escalate: 7.0,
            quality_auto_merge: 80.0,
            quality_review: 60.0,
            quality_reject: 60.0,
        }
    }
}

/// Decision result
#[derive(Debug, Clone, PartialEq)]
pub enum Decision {
    /// Automatically approve and proceed
    AutoApprove,

    /// Notify human and proceed after delay
    NotifyAndProceed {
        /// Delay in seconds before proceeding
        delay_seconds: u64,
    },

    /// Escalate to human for approval
    EscalateToHuman {
        /// Reason for escalation
        reason: String,
    },

    /// Automatically merge PR
    AutoMerge,

    /// Require human review
    RequireReview {
        /// Reason for requiring review
        reason: String,
    },

    /// Reject automatically
    Reject {
        /// Reason for rejection
        reason: String,
    },
}

impl fmt::Display for Decision {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Decision::AutoApprove => write!(f, "Auto-Approve"),
            Decision::NotifyAndProceed { delay_seconds } => {
                write!(f, "Notify & Proceed ({}s delay)", delay_seconds)
            }
            Decision::EscalateToHuman { reason } => {
                write!(f, "Escalate to Human: {}", reason)
            }
            Decision::AutoMerge => write!(f, "Auto-Merge"),
            Decision::RequireReview { reason } => {
                write!(f, "Require Review: {}", reason)
            }
            Decision::Reject { reason } => write!(f, "Reject: {}", reason),
        }
    }
}

/// Decision engine
pub struct DecisionEngine {
    /// Decision thresholds
    thresholds: DecisionThresholds,
}

impl DecisionEngine {
    /// Create a new decision engine with default thresholds
    pub fn new() -> Self {
        Self {
            thresholds: DecisionThresholds::default(),
        }
    }

    /// Create with custom thresholds
    pub fn with_thresholds(thresholds: DecisionThresholds) -> Self {
        Self { thresholds }
    }

    /// Get current thresholds
    pub fn thresholds(&self) -> &DecisionThresholds {
        &self.thresholds
    }

    /// Decide whether to auto-approve a task based on complexity
    ///
    /// # Arguments
    /// * `complexity` - Task complexity score (0.0-10.0)
    /// * `issue_number` - GitHub Issue number
    ///
    /// # Returns
    /// Decision on whether to auto-approve, notify, or escalate
    pub fn should_auto_approve(&self, complexity: f64, issue_number: u64) -> Decision {
        debug!(
            "Complexity decision for Issue #{}: score={}",
            issue_number, complexity
        );

        if complexity < self.thresholds.complexity_auto_approve {
            info!(
                "✅ Auto-approving Issue #{} (complexity: {} < {})",
                issue_number, complexity, self.thresholds.complexity_auto_approve
            );
            Decision::AutoApprove
        } else if complexity < self.thresholds.complexity_notify {
            info!(
                "🔔 Notifying for Issue #{} (complexity: {} < {})",
                issue_number, complexity, self.thresholds.complexity_notify
            );
            Decision::NotifyAndProceed {
                delay_seconds: 300, // 5 minutes
            }
        } else {
            warn!(
                "⚠️  Escalating Issue #{} to human (complexity: {} >= {})",
                issue_number, complexity, self.thresholds.complexity_escalate
            );
            Decision::EscalateToHuman {
                reason: format!(
                    "High complexity: {:.1} (threshold: {})",
                    complexity, self.thresholds.complexity_escalate
                ),
            }
        }
    }

    /// Decide whether to auto-merge a PR based on quality score
    ///
    /// # Arguments
    /// * `quality_score` - Quality score (0.0-100.0)
    /// * `pr_number` - Pull Request number
    ///
    /// # Returns
    /// Decision on whether to auto-merge, review, or reject
    pub fn should_auto_merge(&self, quality_score: f64, pr_number: u64) -> Decision {
        debug!(
            "Quality decision for PR #{}: score={}",
            pr_number, quality_score
        );

        if quality_score >= self.thresholds.quality_auto_merge {
            info!(
                "✅ Auto-merging PR #{} (quality: {} >= {})",
                pr_number, quality_score, self.thresholds.quality_auto_merge
            );
            Decision::AutoMerge
        } else if quality_score >= self.thresholds.quality_review {
            info!(
                "👁️  Requiring review for PR #{} (quality: {} < {})",
                pr_number, quality_score, self.thresholds.quality_auto_merge
            );
            Decision::RequireReview {
                reason: format!(
                    "Quality score below auto-merge threshold: {:.1}/100 (need: {})",
                    quality_score, self.thresholds.quality_auto_merge
                ),
            }
        } else {
            warn!(
                "❌ Rejecting PR #{} (quality: {} < {})",
                pr_number, quality_score, self.thresholds.quality_review
            );
            Decision::Reject {
                reason: format!(
                    "Low quality score: {:.1}/100 (minimum: {})",
                    quality_score, self.thresholds.quality_review
                ),
            }
        }
    }

    /// Check if a feature is security-sensitive and requires special handling
    pub fn is_security_sensitive(&self, labels: &[String]) -> bool {
        labels.iter().any(|label| {
            label.contains("security")
                || label.contains("auth")
                || label.contains("crypto")
                || label.contains("permission")
        })
    }

    /// Check if a task requires special approval based on labels
    pub fn requires_special_approval(&self, labels: &[String]) -> bool {
        self.is_security_sensitive(labels)
            || labels.iter().any(|label| {
                label.contains("breaking")
                    || label.contains("database")
                    || label.contains("migration")
                    || label.contains("deploy")
            })
    }
}

impl Default for DecisionEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_thresholds() {
        let thresholds = DecisionThresholds::default();
        assert_eq!(thresholds.complexity_auto_approve, 5.0);
        assert_eq!(thresholds.complexity_notify, 7.0);
        assert_eq!(thresholds.quality_auto_merge, 80.0);
        assert_eq!(thresholds.quality_review, 60.0);
    }

    #[test]
    fn test_auto_approve_simple_task() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_approve(3.0, 123);

        assert_eq!(decision, Decision::AutoApprove);
    }

    #[test]
    fn test_notify_medium_complexity() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_approve(6.0, 123);

        match decision {
            Decision::NotifyAndProceed { delay_seconds } => {
                assert_eq!(delay_seconds, 300); // 5 minutes
            }
            _ => panic!("Expected NotifyAndProceed"),
        }
    }

    #[test]
    fn test_escalate_high_complexity() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_approve(8.0, 123);

        match decision {
            Decision::EscalateToHuman { reason } => {
                assert!(reason.contains("High complexity"));
            }
            _ => panic!("Expected EscalateToHuman"),
        }
    }

    #[test]
    fn test_auto_merge_high_quality() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_merge(85.0, 456);

        assert_eq!(decision, Decision::AutoMerge);
    }

    #[test]
    fn test_require_review_medium_quality() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_merge(70.0, 456);

        match decision {
            Decision::RequireReview { reason } => {
                assert!(reason.contains("Quality score below"));
            }
            _ => panic!("Expected RequireReview"),
        }
    }

    #[test]
    fn test_reject_low_quality() {
        let engine = DecisionEngine::new();
        let decision = engine.should_auto_merge(50.0, 456);

        match decision {
            Decision::Reject { reason } => {
                assert!(reason.contains("Low quality score"));
            }
            _ => panic!("Expected Reject"),
        }
    }

    #[test]
    fn test_custom_thresholds() {
        let thresholds = DecisionThresholds {
            complexity_auto_approve: 3.0,
            complexity_notify: 5.0,
            complexity_escalate: 5.0,
            quality_auto_merge: 90.0,
            quality_review: 70.0,
            quality_reject: 70.0,
        };

        let engine = DecisionEngine::with_thresholds(thresholds);

        // Should escalate with lower threshold
        let decision = engine.should_auto_approve(6.0, 123);
        assert!(matches!(decision, Decision::EscalateToHuman { .. }));

        // Should require review with higher threshold
        let decision = engine.should_auto_merge(85.0, 456);
        assert!(matches!(decision, Decision::RequireReview { .. }));
    }

    #[test]
    fn test_security_sensitivity_detection() {
        let engine = DecisionEngine::new();

        assert!(engine
            .is_security_sensitive(&["type:feature".to_string(), "security:high".to_string(),]));

        assert!(engine.is_security_sensitive(&["auth:required".to_string(),]));

        assert!(!engine
            .is_security_sensitive(&["type:feature".to_string(), "priority:high".to_string(),]));
    }

    #[test]
    fn test_special_approval_required() {
        let engine = DecisionEngine::new();

        // Security-sensitive
        assert!(engine.requires_special_approval(&["security:high".to_string(),]));

        // Breaking change
        assert!(engine.requires_special_approval(&["breaking:change".to_string(),]));

        // Database migration
        assert!(engine.requires_special_approval(&["database:migration".to_string(),]));

        // Regular feature
        assert!(!engine.requires_special_approval(&["type:feature".to_string(),]));
    }

    #[test]
    fn test_boundary_values() {
        let engine = DecisionEngine::new();

        // Just below threshold should auto-approve
        let decision = engine.should_auto_approve(4.9, 123);
        assert_eq!(decision, Decision::AutoApprove);

        // Exactly at threshold should notify
        let decision = engine.should_auto_approve(5.0, 123);
        assert!(matches!(decision, Decision::NotifyAndProceed { .. }));

        // Exactly at quality threshold should auto-merge
        let decision = engine.should_auto_merge(80.0, 456);
        assert_eq!(decision, Decision::AutoMerge);
    }
}
