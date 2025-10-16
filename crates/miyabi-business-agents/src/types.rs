//! Business Agent data types
//!
//! Core data structures used across all business agents.

use serde::{Deserialize, Serialize};
use validator::Validate;

/// Business input parameters for plan generation
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct BusinessInput {
    /// Industry or market segment (e.g., "SaaS", "E-commerce", "FinTech")
    #[validate(length(min = 1, max = 100))]
    pub industry: String,

    /// Target market description (e.g., "SMB developers", "Enterprise CIOs")
    #[validate(length(min = 1, max = 200))]
    pub target_market: String,

    /// Initial budget in USD
    #[validate(range(min = 0, max = 10_000_000))]
    pub budget: u64,

    /// Geographic focus (optional)
    pub geography: Option<String>,

    /// Timeframe for plan execution (in months)
    #[validate(range(min = 1, max = 60))]
    pub timeframe_months: Option<u32>,

    /// Additional context or constraints
    pub context: Option<String>,
}

impl Default for BusinessInput {
    fn default() -> Self {
        Self {
            industry: "SaaS".to_string(),
            target_market: "SMB developers".to_string(),
            budget: 50_000,
            geography: Some("North America".to_string()),
            timeframe_months: Some(12),
            context: None,
        }
    }
}

/// Generated business plan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessPlan {
    /// Plan title
    pub title: String,

    /// Executive summary (1-2 paragraphs)
    pub summary: String,

    /// Detailed recommendations (structured list)
    pub recommendations: Vec<Recommendation>,

    /// Key performance indicators
    pub kpis: Vec<KPI>,

    /// Estimated timeline
    pub timeline: Timeline,

    /// Risk assessment
    pub risks: Vec<Risk>,

    /// Next steps
    pub next_steps: Vec<String>,

    /// Generated timestamp
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

impl Default for BusinessPlan {
    fn default() -> Self {
        Self {
            title: "Business Plan".to_string(),
            summary: String::new(),
            recommendations: Vec::new(),
            kpis: Vec::new(),
            timeline: Timeline::default(),
            risks: Vec::new(),
            next_steps: Vec::new(),
            generated_at: chrono::Utc::now(),
        }
    }
}

/// Individual recommendation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recommendation {
    /// Recommendation title
    pub title: String,

    /// Detailed description
    pub description: String,

    /// Priority (1-5, 1 = highest)
    pub priority: u8,

    /// Estimated cost
    pub estimated_cost: Option<u64>,

    /// Expected ROI (as percentage)
    pub expected_roi: Option<f64>,

    /// Dependencies (other recommendations)
    pub dependencies: Vec<String>,
}

/// Key Performance Indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KPI {
    /// KPI name (e.g., "Monthly Recurring Revenue")
    pub name: String,

    /// Current baseline value
    pub baseline: f64,

    /// Target value
    pub target: f64,

    /// Unit (e.g., "USD", "%", "users")
    pub unit: String,

    /// Measurement frequency
    pub frequency: MeasurementFrequency,
}

/// Measurement frequency for KPIs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MeasurementFrequency {
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

/// Timeline with milestones
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Timeline {
    /// Start date
    pub start_date: chrono::DateTime<chrono::Utc>,

    /// End date
    pub end_date: chrono::DateTime<chrono::Utc>,

    /// Milestones
    pub milestones: Vec<Milestone>,
}

impl Default for Timeline {
    fn default() -> Self {
        let now = chrono::Utc::now();
        let one_year = chrono::Duration::days(365);

        Self {
            start_date: now,
            end_date: now + one_year,
            milestones: Vec::new(),
        }
    }
}

/// Timeline milestone
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    /// Milestone name
    pub name: String,

    /// Target date
    pub target_date: chrono::DateTime<chrono::Utc>,

    /// Deliverables
    pub deliverables: Vec<String>,

    /// Success criteria
    pub success_criteria: Vec<String>,
}

/// Business risk
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Risk {
    /// Risk description
    pub description: String,

    /// Severity (1-5, 5 = most severe)
    pub severity: u8,

    /// Probability (0.0-1.0)
    pub probability: f64,

    /// Mitigation strategies
    pub mitigation: Vec<String>,
}

/// Validation result for business plans
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    /// Overall validation status
    pub is_valid: bool,

    /// Quality score (0-100)
    pub quality_score: u8,

    /// Warnings (non-blocking issues)
    pub warnings: Vec<String>,

    /// Errors (blocking issues)
    pub errors: Vec<String>,

    /// Improvement suggestions
    pub suggestions: Vec<String>,

    /// Validation timestamp
    pub validated_at: chrono::DateTime<chrono::Utc>,
}

impl Default for ValidationResult {
    fn default() -> Self {
        Self {
            is_valid: true,
            quality_score: 100,
            warnings: Vec::new(),
            errors: Vec::new(),
            suggestions: Vec::new(),
            validated_at: chrono::Utc::now(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_business_input_default() {
        let input = BusinessInput::default();
        assert_eq!(input.industry, "SaaS");
        assert_eq!(input.budget, 50_000);
        assert!(input.geography.is_some());
    }

    #[test]
    fn test_business_input_validation() {
        use validator::Validate;

        let valid_input = BusinessInput::default();
        assert!(valid_input.validate().is_ok());

        let invalid_input = BusinessInput {
            industry: "".to_string(), // Empty industry (invalid)
            ..Default::default()
        };
        assert!(invalid_input.validate().is_err());
    }

    #[test]
    fn test_business_plan_default() {
        let plan = BusinessPlan::default();
        assert_eq!(plan.title, "Business Plan");
        assert!(plan.recommendations.is_empty());
        assert!(plan.kpis.is_empty());
    }

    #[test]
    fn test_validation_result_default() {
        let result = ValidationResult::default();
        assert!(result.is_valid);
        assert_eq!(result.quality_score, 100);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_timeline_default() {
        let timeline = Timeline::default();
        assert!(timeline.end_date > timeline.start_date);
        assert!(timeline.milestones.is_empty());
    }

    #[test]
    fn test_recommendation() {
        let recommendation = Recommendation {
            title: "Implement MVP".to_string(),
            description: "Build minimum viable product".to_string(),
            priority: 1,
            estimated_cost: Some(25_000),
            expected_roi: Some(2.5),
            dependencies: vec!["Market Research".to_string()],
        };

        assert_eq!(recommendation.priority, 1);
        assert_eq!(recommendation.estimated_cost, Some(25_000));
    }

    #[test]
    fn test_kpi() {
        let kpi = KPI {
            name: "Monthly Recurring Revenue".to_string(),
            baseline: 10_000.0,
            target: 50_000.0,
            unit: "USD".to_string(),
            frequency: MeasurementFrequency::Monthly,
        };

        assert_eq!(kpi.baseline, 10_000.0);
        assert_eq!(kpi.target, 50_000.0);
    }

    #[test]
    fn test_risk() {
        let risk = Risk {
            description: "Market competition".to_string(),
            severity: 4,
            probability: 0.7,
            mitigation: vec!["Differentiate product".to_string()],
        };

        assert_eq!(risk.severity, 4);
        assert_eq!(risk.probability, 0.7);
        assert_eq!(risk.mitigation.len(), 1);
    }
}
