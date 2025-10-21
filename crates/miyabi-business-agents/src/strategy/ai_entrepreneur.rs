//! AIEntrepreneurAgent - 8-Phase Business Plan Generation
//!
//! Generates comprehensive business plans using an 8-phase framework:
//! 1. Market Opportunity Analysis
//! 2. Value Proposition Design
//! 3. Business Model Canvas
//! 4. Go-to-Market Strategy
//! 5. Financial Projections
//! 6. Team & Organization
//! 7. Risk Assessment
//! 8. Implementation Roadmap

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// AIEntrepreneurAgent generates 8-phase business plans
pub struct AIEntrepreneurAgent {
    client: ClaudeClient,
}

impl AIEntrepreneurAgent {
    /// Create a new AIEntrepreneurAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the 8-phase business plan prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert AI Entrepreneur Agent specializing in generating comprehensive business plans.

Your role is to create an 8-phase business plan based on the provided input:

**Phase 1: Market Opportunity Analysis**
- Market size (TAM, SAM, SOM)
- Market trends and growth projections
- Competitive landscape analysis
- Market gaps and opportunities

**Phase 2: Value Proposition Design**
- Unique value proposition
- Customer pain points addressed
- Key differentiators
- Benefits and features

**Phase 3: Business Model Canvas**
- Revenue streams
- Cost structure
- Key resources and activities
- Customer segments and relationships

**Phase 4: Go-to-Market Strategy**
- Customer acquisition channels
- Marketing and sales tactics
- Pricing strategy
- Distribution channels

**Phase 5: Financial Projections**
- Revenue forecast (3-year)
- Expense breakdown
- Break-even analysis
- Funding requirements

**Phase 6: Team & Organization**
- Key roles and responsibilities
- Hiring plan
- Advisory board
- Organizational structure

**Phase 7: Risk Assessment**
- Market risks
- Operational risks
- Financial risks
- Mitigation strategies

**Phase 8: Implementation Roadmap**
- 90-day milestones
- 1-year roadmap
- Success metrics
- Key dependencies

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Business Plan Title",
  "summary": "2-3 paragraph executive summary",
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": 1,
      "estimated_cost": 25000,
      "expected_roi": 2.5,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "KPI name",
      "baseline": 0,
      "target": 100000,
      "unit": "USD",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Milestone name",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Risk description",
      "severity": 4,
      "probability": 0.7,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Step 1", "Step 2"]
}

Be specific, data-driven, and actionable. Focus on practical recommendations that can be implemented immediately."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Generate a comprehensive 8-phase business plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please analyze the market opportunity, design a value proposition, create a business model, define go-to-market strategy, project financials, plan team structure, assess risks, and provide an implementation roadmap.

Focus on actionable recommendations with specific timelines, costs, and success metrics."#,
            input.industry,
            input.target_market,
            input.budget,
            input.geography.as_deref().unwrap_or("Global"),
            input.timeframe_months.unwrap_or(12),
            input.context.as_deref().unwrap_or("None")
        )
    }

    /// Parse Claude's JSON response into BusinessPlan
    fn parse_response(&self, response: &str) -> Result<BusinessPlan, MiyabiError> {
        // Extract JSON from response (Claude might wrap it in markdown)
        let json_str = if response.contains("```json") {
            // Extract JSON from markdown code block
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

        // Parse JSON into a temporary structure
        let parsed: serde_json::Value = serde_json::from_str(json_str)?;

        // Extract fields with defaults
        let title = parsed["title"]
            .as_str()
            .unwrap_or("Business Plan")
            .to_string();
        let summary = parsed["summary"].as_str().unwrap_or("").to_string();

        // Parse recommendations
        let recommendations = parsed["recommendations"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        // Parse KPIs
        let kpis = parsed["kpis"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|k| serde_json::from_value(k.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        // Parse timeline
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
                end_date: chrono::Utc::now() + chrono::Duration::days(365),
                milestones,
            }
        } else {
            Timeline::default()
        };

        // Parse risks
        let risks = parsed["risks"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|r| serde_json::from_value(r.clone()).ok())
                    .collect()
            })
            .unwrap_or_default();

        // Parse next steps
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
impl BusinessAgent for AIEntrepreneurAgent {
    fn agent_type(&self) -> &str {
        "ai-entrepreneur"
    }

    fn description(&self) -> &str {
        "Generates comprehensive 8-phase business plans for SaaS and startup ventures"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "AIEntrepreneurAgent: Generating business plan for {} in {}",
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
            "Generated business plan with {} recommendations, {} KPIs, {} risks",
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

        // Validate recommendations
        if plan.recommendations.is_empty() {
            errors.push("No recommendations provided".to_string());
            quality_score = quality_score.saturating_sub(20);
        } else if plan.recommendations.len() < 3 {
            warnings.push("Only a few recommendations provided (expected 5+)".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate KPIs
        if plan.kpis.is_empty() {
            warnings.push("No KPIs defined".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add specific KPIs to track progress".to_string());
        }

        // Validate risks
        if plan.risks.is_empty() {
            warnings.push("No risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Identify potential risks and mitigation strategies".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No milestones in timeline".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add specific milestones with dates".to_string());
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
        45 // 45 seconds for comprehensive business plan
    }
}

impl StrategyAgent for AIEntrepreneurAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ai_entrepreneur_agent_creation() {
        // Skip if API key not set
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = AIEntrepreneurAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "ai-entrepreneur");
        assert_eq!(agent.estimated_duration(), 45);
    }

    #[test]
    fn test_system_prompt_generation() {
        // Skip if API key not set
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = AIEntrepreneurAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("8-phase"));
        assert!(prompt.contains("Market Opportunity Analysis"));
        assert!(prompt.contains("Financial Projections"));
    }

    #[test]
    fn test_user_prompt_generation() {
        // Skip if API key not set
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = AIEntrepreneurAgent::new().unwrap();
        let input = BusinessInput::default();
        let prompt = agent.create_user_prompt(&input);

        assert!(prompt.contains("SaaS"));
        assert!(prompt.contains("$50,000"));
        assert!(prompt.contains("SMB developers"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = AIEntrepreneurAgent::new();
        if agent.is_err() {
            return; // Skip if API key not set
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![Recommendation {
            title: "Test".to_string(),
            description: "Test recommendation".to_string(),
            priority: 1,
            estimated_cost: Some(10000),
            expected_roi: Some(2.0),
            dependencies: vec![],
        }];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.quality_score > 0);
    }
}
