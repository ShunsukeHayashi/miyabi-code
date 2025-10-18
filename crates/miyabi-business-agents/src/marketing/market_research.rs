//! MarketResearchAgent - Market Analysis & Competitive Intelligence
//!
//! Conducts comprehensive market research and competitive analysis:
//! - Market size estimation (TAM/SAM/SOM)
//! - Competitive landscape analysis
//! - Industry trends and growth projections
//! - Customer needs analysis
//! - Market entry strategy

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// MarketResearchAgent conducts market analysis and competitive intelligence
pub struct MarketResearchAgent {
    client: ClaudeClient,
}

impl MarketResearchAgent {
    /// Create a new MarketResearchAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the market research system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Market Research Agent specializing in market analysis and competitive intelligence.

Your role is to conduct comprehensive market research:

**Market Size Estimation**
- TAM (Total Addressable Market): Maximum market opportunity
- SAM (Serviceable Addressable Market): Target market segment
- SOM (Serviceable Obtainable Market): Realistic market share in 1-3 years
- Market growth rate (CAGR) projections
- Revenue potential and market dynamics

**Competitive Landscape Analysis**
- Direct competitors (same product/service, same market)
- Indirect competitors (different approach, same need)
- Substitute products/services
- Competitive positioning matrix (features, pricing, quality)
- Market share distribution
- Competitive advantages and differentiators
- Barriers to entry

**Industry Trends & Analysis**
- Emerging technologies and innovations
- Regulatory changes and compliance requirements
- Economic factors and market drivers
- Consumer behavior shifts
- Industry consolidation and M&A activity
- Future market predictions (3-5 years)

**Customer Needs Analysis**
- Unmet needs and pain points
- Willingness to pay analysis
- Purchase decision criteria
- Customer acquisition channels
- Customer lifetime value potential
- Adoption barriers

**Market Entry Strategy**
- Go-to-market recommendations
- Timing and phasing strategy
- Geographic market prioritization
- Partnership and channel opportunities
- Pricing strategy recommendations
- Positioning and messaging guidance

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Market Research & Competitive Analysis",
  "summary": "2-3 paragraph market overview",
  "recommendations": [
    {
      "title": "Market research recommendation",
      "description": "Detailed market analysis insight",
      "priority": 1,
      "estimated_cost": 12000,
      "expected_roi": 4.5,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Market KPI",
      "baseline": 0,
      "target": 1000000,
      "unit": "dollars",
      "frequency": "quarterly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Market research milestone",
        "target_date": "2026-04-30T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Market risk",
      "severity": 4,
      "probability": 0.4,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Research step 1"]
}

Be data-driven, analytical, and evidence-based. Focus on actionable market insights."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Conduct comprehensive market research and competitive analysis for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please analyze:
1. Market Size: TAM, SAM, SOM estimation with growth projections
2. Competitive Landscape: Direct/indirect competitors, market positioning
3. Industry Trends: Emerging technologies, regulatory changes, future predictions
4. Customer Needs: Pain points, willingness to pay, adoption barriers
5. Market Entry Strategy: Go-to-market plan, timing, geographic prioritization

Focus on data-driven insights and actionable recommendations."#,
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

        let title = parsed["title"].as_str().unwrap_or("Market Research & Competitive Analysis").to_string();
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
impl BusinessAgent for MarketResearchAgent {
    fn agent_type(&self) -> &str {
        "market-research"
    }

    fn description(&self) -> &str {
        "Conducts market analysis and competitive intelligence"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("MarketResearchAgent: Analyzing market for {} in {}",
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

        info!("Generated market research with {} insights, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate market insights (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No market insights provided".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 5 {
            warnings.push("Few market insights (expected 7-12 covering TAM/SAM/SOM, competitors, trends)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add more detailed competitive and trend analysis".to_string());
        }

        // Validate market KPIs
        if plan.kpis.is_empty() {
            errors.push("No market metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push("Few market KPIs (expected 5-8 covering market size, share, growth)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add TAM/SAM/SOM metrics and market share targets".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No market research milestones".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add market entry and expansion milestones".to_string());
        }

        // Validate competitive risks
        if plan.risks.is_empty() {
            errors.push("No market risks identified".to_string());
            quality_score = quality_score.saturating_sub(20);
        } else if plan.risks.len() < 3 {
            warnings.push("Few market risks (expected 5-10 covering competition, regulation, market changes)".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No research action steps provided".to_string());
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
        40 // 40 seconds for comprehensive market research
    }
}

impl MarketingAgent for MarketResearchAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_market_research_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = MarketResearchAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "market-research");
        assert_eq!(agent.estimated_duration(), 40);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = MarketResearchAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Market Research"));
        assert!(prompt.contains("TAM"));
        assert!(prompt.contains("SAM"));
        assert!(prompt.contains("SOM"));
        assert!(prompt.contains("Competitive Landscape"));
        assert!(prompt.contains("Industry Trends"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = MarketResearchAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "TAM: $50B Market Opportunity".to_string(),
                description: "Total addressable market analysis".to_string(),
                priority: 1,
                estimated_cost: Some(5000),
                expected_roi: Some(10.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "SAM: $5B Target Segment".to_string(),
                description: "Serviceable addressable market".to_string(),
                priority: 1,
                estimated_cost: Some(3000),
                expected_roi: Some(8.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "SOM: $50M Year 1 Target".to_string(),
                description: "Serviceable obtainable market".to_string(),
                priority: 1,
                estimated_cost: Some(2000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Competitor Analysis: 5 Key Players".to_string(),
                description: "Competitive landscape mapping".to_string(),
                priority: 1,
                estimated_cost: Some(4000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Market Growth: 25% CAGR".to_string(),
                description: "Industry growth projections".to_string(),
                priority: 2,
                estimated_cost: Some(1000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Market Share".to_string(),
                baseline: 0.0,
                target: 5.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Quarterly,
            },
        ];

        plan.risks = vec![
            Risk {
                description: "Intense competition".to_string(),
                severity: 4,
                probability: 0.6,
                mitigation: vec!["Differentiation strategy".to_string()],
            },
        ];

        plan.next_steps = vec![
            "Conduct detailed competitor analysis".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 60);
    }
}
