//! FunnelDesignAgent - AARRR Metrics & Conversion Optimization
//!
//! Designs customer funnels and conversion strategies:
//! - Acquisition: Customer acquisition channels
//! - Activation: First user experience optimization
//! - Retention: User engagement and retention strategies
//! - Referral: Viral growth mechanisms
//! - Revenue: Monetization and upsell strategies

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// FunnelDesignAgent designs AARRR funnels
pub struct FunnelDesignAgent {
    client: ClaudeClient,
}

impl FunnelDesignAgent {
    /// Create a new FunnelDesignAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the AARRR funnel system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Funnel Design Agent specializing in AARRR metrics and conversion optimization.

Your role is to design comprehensive customer funnel strategies:

**Acquisition (How do users find us?)**
- Customer acquisition channels (SEO, SEM, social, content, partnerships)
- Channel-specific conversion rates
- Customer acquisition cost (CAC) targets
- Traffic sources and attribution
- A/B testing strategies

**Activation (Do users have a great first experience?)**
- Onboarding flow optimization
- First-time user experience (FTUE)
- Aha moment identification
- Time-to-value metrics
- Activation rate targets

**Retention (Do users come back?)**
- Engagement loops and triggers
- Email/push notification strategies
- Feature adoption tracking
- Churn prediction and prevention
- Cohort retention analysis

**Referral (Do users tell others?)**
- Viral mechanisms (referral programs, social sharing)
- Word-of-mouth optimization
- Viral coefficient (K-factor) targets
- Incentive structures
- Community building

**Revenue (How do we monetize?)**
- Pricing strategy and tiers
- Upsell and cross-sell opportunities
- Lifetime value (LTV) optimization
- Revenue per user targets
- Payment optimization

**Output Format**: Return a JSON object with the following structure:
{
  "title": "AARRR Funnel Design",
  "summary": "2-3 paragraph funnel overview",
  "recommendations": [
    {
      "title": "Funnel optimization recommendation",
      "description": "Detailed strategy",
      "priority": 1,
      "estimated_cost": 10000,
      "expected_roi": 4.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Funnel KPI",
      "baseline": 0,
      "target": 25,
      "unit": "percent",
      "frequency": "weekly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Funnel milestone",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Funnel risk",
      "severity": 3,
      "probability": 0.4,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Implementation step 1"]
}

Be data-driven, measurable, and focused on conversion optimization."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Design a comprehensive AARRR funnel and conversion optimization strategy for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please design:
1. Acquisition: Customer acquisition channels and CAC targets
2. Activation: Onboarding flow and first-time user experience
3. Retention: Engagement loops and churn prevention
4. Referral: Viral mechanisms and word-of-mouth strategies
5. Revenue: Pricing tiers and monetization strategies

Focus on measurable metrics and data-driven optimization strategies."#,
            input.industry,
            input.target_market,
            input.budget,
            input.geography.as_deref().unwrap_or("Global"),
            input.timeframe_months.unwrap_or(6),
            input.context.as_deref().unwrap_or("None")
        )
    }

    /// Parse Claude's JSON response into BusinessPlan
    fn parse_response(&self, response: &str) -> Result<BusinessPlan, MiyabiError> {
        let json_str = if response.contains("```json") {
            response
                .split("```json")
                .nth(1)
                .and_then(|s| s.split("```").next())
                .unwrap_or(response)
                .trim()
        } else {
            response.trim()
        };

        debug!("Parsing JSON response: {} chars", json_str.len());

        let parsed: serde_json::Value = serde_json::from_str(json_str)?;

        let title = parsed["title"].as_str().unwrap_or("AARRR Funnel Design").to_string();
        let summary = parsed["summary"].as_str().unwrap_or("").to_string();

        let recommendations = parsed["recommendations"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let kpis = parsed["kpis"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|k| serde_json::from_value(k.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let timeline = if let Some(timeline_obj) = parsed["timeline"].as_object() {
            let milestones = timeline_obj["milestones"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|m| serde_json::from_value(m.clone()).ok())
                        .collect()
                })
                .unwrap_or_default();

            Timeline {
                start_date: chrono::Utc::now(),
                end_date: chrono::Utc::now() + chrono::Duration::days(180),
                milestones,
            }
        } else {
            Timeline::default()
        };

        let risks = parsed["risks"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        let next_steps = parsed["next_steps"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|s| s.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        Ok(BusinessPlan {
            title,
            summary,
            recommendations,
            kpis,
            timeline,
            risks,
            next_steps,
            generated_at: chrono::Utc::now(),
        })
    }
}

#[async_trait]
impl BusinessAgent for FunnelDesignAgent {
    fn agent_type(&self) -> &str {
        "funnel-design"
    }

    fn description(&self) -> &str {
        "Designs AARRR metrics and conversion optimization strategies"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("FunnelDesignAgent: Generating AARRR funnel for {} in {}",
              input.target_market, input.industry);

        let system_prompt = self.create_system_prompt();
        let user_prompt = self.create_user_prompt(input);

        let response = self
            .client
            .generate(&system_prompt, &user_prompt)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claude API failed: {}", e)))?;

        debug!("Received response from Claude: {} chars", response.len());

        let plan = self.parse_response(&response)?;

        info!("Generated funnel design with {} strategies, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate AARRR strategies
        if plan.recommendations.is_empty() {
            errors.push("No AARRR strategies defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 5 {
            warnings.push("Should have at least 5 strategies (one per AARRR stage)".to_string());
            quality_score = quality_score.saturating_sub(15);
        }

        // Validate conversion KPIs
        if plan.kpis.is_empty() {
            errors.push("No conversion metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push("Few conversion KPIs (expected 5-10)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add KPIs for each AARRR stage".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No optimization milestones".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate risks
        if plan.risks.is_empty() {
            warnings.push("No funnel risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No implementation steps provided".to_string());
            quality_score = quality_score.saturating_sub(15);
        }

        let is_valid = errors.is_empty();

        Ok(ValidationResult {
            is_valid,
            quality_score,
            warnings,
            errors,
            suggestions,
            validated_at: chrono::Utc::now(),
        })
    }

    fn estimated_duration(&self) -> u64 {
        30 // 30 seconds for funnel design
    }
}

impl StrategyAgent for FunnelDesignAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_funnel_design_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = FunnelDesignAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "funnel-design");
        assert_eq!(agent.estimated_duration(), 30);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = FunnelDesignAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("AARRR"));
        assert!(prompt.contains("Acquisition"));
        assert!(prompt.contains("Retention"));
        assert!(prompt.contains("Revenue"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = FunnelDesignAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Acquisition: SEO Strategy".to_string(),
                description: "Organic search optimization".to_string(),
                priority: 1,
                estimated_cost: Some(5000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Activation: Onboarding Flow".to_string(),
                description: "Optimize first-time user experience".to_string(),
                priority: 1,
                estimated_cost: Some(3000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.quality_score > 40);
    }
}
