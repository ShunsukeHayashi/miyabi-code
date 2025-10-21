//! ProductConceptAgent - MVP Design & Product Strategy
//!
//! Designs Minimum Viable Products (MVPs) and product strategies:
//! - MVP feature prioritization
//! - Value proposition design
//! - Differentiation strategy
//! - Success metrics definition
//! - Product roadmap

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// ProductConceptAgent designs MVPs and product strategies
pub struct ProductConceptAgent {
    client: ClaudeClient,
}

impl ProductConceptAgent {
    /// Create a new ProductConceptAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the MVP design system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Product Concept Agent specializing in MVP design and product strategy.

Your role is to create a comprehensive product concept plan based on the provided input:

**MVP Feature Prioritization**
- Core features (must-have for MVP)
- Nice-to-have features (post-MVP)
- Feature dependencies and sequencing
- Development effort estimation

**Value Proposition Design**
- Unique value proposition (UVP)
- Customer pain points addressed
- Key benefits and differentiators
- Competitive advantages

**Differentiation Strategy**
- Market positioning
- Competitive differentiation
- Brand identity
- Pricing strategy

**Success Metrics**
- Key Performance Indicators (KPIs)
- Success criteria for MVP launch
- User engagement metrics
- Revenue and growth targets

**Product Roadmap**
- MVP timeline (90 days)
- Post-MVP iterations (6 months)
- Feature releases schedule
- Scaling plan

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Product Concept Title",
  "summary": "2-3 paragraph executive summary",
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": 1,
      "estimated_cost": 15000,
      "expected_roi": 3.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "KPI name",
      "baseline": 0,
      "target": 5000,
      "unit": "users",
      "frequency": "weekly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Milestone name",
        "target_date": "2026-01-31T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Risk description",
      "severity": 3,
      "probability": 0.6,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Step 1", "Step 2"]
}

Be specific, user-focused, and actionable. Focus on creating a lean MVP that can be validated quickly."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Design a comprehensive product concept and MVP plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please define MVP features, value proposition, differentiation strategy, success metrics, and product roadmap.

Focus on creating a lean MVP that can be built and validated within the budget and timeframe."#,
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
        // Extract JSON from response (Claude might wrap it in markdown)
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

        let title = parsed["title"]
            .as_str()
            .unwrap_or("Product Concept Plan")
            .to_string();
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
impl BusinessAgent for ProductConceptAgent {
    fn agent_type(&self) -> &str {
        "product-concept"
    }

    fn description(&self) -> &str {
        "Designs MVP features, value propositions, and product strategies"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "ProductConceptAgent: Generating MVP plan for {} in {}",
            input.target_market, input.industry
        );

        let system_prompt = self.create_system_prompt();
        let user_prompt = self.create_user_prompt(input);

        let response = self
            .client
            .generate(&system_prompt, &user_prompt)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claude API failed: {}", e)))?;

        debug!("Received response from Claude: {} chars", response.len());

        let plan = self.parse_response(&response)?;

        info!(
            "Generated product concept with {} features, {} KPIs, {} risks",
            plan.recommendations.len(),
            plan.kpis.len(),
            plan.risks.len()
        );

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate MVP features (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No MVP features defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.recommendations.len() < 3 {
            warnings.push("Very few MVP features (expected 3-7)".to_string());
            quality_score = quality_score.saturating_sub(10);
        } else if plan.recommendations.len() > 10 {
            warnings.push("Too many MVP features - consider reducing scope".to_string());
            quality_score = quality_score.saturating_sub(5);
            suggestions.push("Focus on core features only for MVP".to_string());
        }

        // Validate KPIs
        if plan.kpis.is_empty() {
            warnings.push("No success metrics defined".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add measurable KPIs to track MVP success".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No milestones in roadmap".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add MVP milestones with target dates".to_string());
        }

        // Validate risks
        if plan.risks.is_empty() {
            warnings.push("No risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No next steps provided".to_string());
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
        30 // 30 seconds for MVP design
    }
}

impl StrategyAgent for ProductConceptAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_product_concept_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ProductConceptAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "product-concept");
        assert_eq!(agent.estimated_duration(), 30);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ProductConceptAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("MVP"));
        assert!(prompt.contains("Value Proposition"));
        assert!(prompt.contains("Product Roadmap"));
    }

    #[test]
    fn test_user_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ProductConceptAgent::new().unwrap();
        let input = BusinessInput::default();
        let prompt = agent.create_user_prompt(&input);

        assert!(prompt.contains("SaaS"));
        assert!(prompt.contains("MVP"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = ProductConceptAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Core Feature 1".to_string(),
                description: "Essential MVP feature".to_string(),
                priority: 1,
                estimated_cost: Some(5000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Core Feature 2".to_string(),
                description: "Essential MVP feature".to_string(),
                priority: 1,
                estimated_cost: Some(3000),
                expected_roi: Some(3.5),
                dependencies: vec![],
            },
            Recommendation {
                title: "Nice-to-have Feature".to_string(),
                description: "Post-MVP feature".to_string(),
                priority: 2,
                estimated_cost: Some(2000),
                expected_roi: Some(2.0),
                dependencies: vec![],
            },
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.quality_score > 50);
    }
}
