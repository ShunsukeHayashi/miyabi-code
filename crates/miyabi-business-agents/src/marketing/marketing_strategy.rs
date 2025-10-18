//! MarketingAgent - Marketing Strategy & Campaign Planning
//!
//! Develops comprehensive marketing strategies and campaigns:
//! - Marketing mix (4Ps: Product, Price, Place, Promotion)
//! - Campaign planning and execution roadmap
//! - Channel strategy and budget allocation
//! - Brand positioning and messaging
//! - Customer acquisition and retention marketing

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// MarketingAgent develops marketing strategies and campaigns
pub struct MarketingStrategyAgent {
    client: ClaudeClient,
}

impl MarketingStrategyAgent {
    /// Create a new MarketingStrategyAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the marketing strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Marketing Strategy Agent specializing in marketing planning and campaign execution.

Your role is to develop comprehensive marketing strategies:

**Marketing Mix (4Ps)**
- Product: Product positioning, features, benefits, differentiation
- Price: Pricing strategy, discounts, value perception
- Place: Distribution channels, sales channels, partnerships
- Promotion: Advertising, PR, content marketing, events

**Campaign Planning**
- Campaign objectives (awareness, consideration, conversion, retention)
- Target audience segmentation and personas
- Key messaging and value propositions
- Creative concepts and content themes
- Campaign timeline and phases (launch, growth, optimization)
- Success metrics and KPIs

**Channel Strategy**
- Digital channels: SEO, SEM, social media, email, display ads
- Traditional channels: Print, radio, TV, outdoor
- Emerging channels: Influencer, podcast, community, partnerships
- Channel budget allocation and ROI expectations
- Multi-channel attribution modeling

**Brand Positioning & Messaging**
- Brand identity and personality
- Unique selling proposition (USP)
- Brand story and narrative
- Messaging hierarchy (primary, secondary, supporting)
- Tone of voice and communication style
- Visual identity guidelines

**Customer Acquisition Marketing**
- Lead generation strategies
- Conversion funnel optimization
- Customer acquisition cost (CAC) targets
- Lead nurturing and scoring
- Sales enablement and alignment

**Customer Retention Marketing**
- Lifecycle marketing campaigns
- Email marketing automation
- Loyalty programs and rewards
- Customer success and advocacy
- Retention metrics (churn rate, LTV)

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Marketing Strategy & Campaign Plan",
  "summary": "2-3 paragraph marketing overview",
  "recommendations": [
    {
      "title": "Marketing campaign recommendation",
      "description": "Detailed campaign strategy",
      "priority": 1,
      "estimated_cost": 15000,
      "expected_roi": 5.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Marketing KPI",
      "baseline": 0,
      "target": 10000,
      "unit": "leads",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Campaign milestone",
        "target_date": "2026-05-31T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Marketing risk",
      "severity": 3,
      "probability": 0.4,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Campaign step 1"]
}

Be creative, strategic, and results-oriented. Focus on measurable marketing outcomes."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive marketing strategy and campaign plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Marketing Mix (4Ps): Product positioning, pricing, distribution, promotion
2. Campaign Planning: Objectives, audience, messaging, creative, timeline
3. Channel Strategy: Digital/traditional channels with budget allocation
4. Brand Positioning: USP, brand story, messaging hierarchy
5. Acquisition & Retention: Lead generation, nurturing, loyalty programs

Focus on actionable campaigns with clear ROI targets and measurement plans."#,
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

        let title = parsed["title"].as_str().unwrap_or("Marketing Strategy & Campaign Plan").to_string();
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
impl BusinessAgent for MarketingStrategyAgent {
    fn agent_type(&self) -> &str {
        "marketing-strategy"
    }

    fn description(&self) -> &str {
        "Develops marketing strategies and campaign plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("MarketingStrategyAgent: Developing marketing strategy for {} in {}",
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

        info!("Generated marketing strategy with {} campaigns, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate marketing campaigns (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No marketing campaigns defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 4 {
            warnings.push("Few marketing campaigns (expected 5-10 covering 4Ps and channels)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add campaigns for each marketing channel (SEO, SEM, social, content)".to_string());
        }

        // Validate marketing KPIs
        if plan.kpis.is_empty() {
            errors.push("No marketing metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 4 {
            warnings.push("Few marketing KPIs (expected 6-10 covering CAC, LTV, conversion rates)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add metrics for each funnel stage (awareness, consideration, conversion, retention)".to_string());
        }

        // Validate campaign timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No campaign milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add campaign launch, optimization, and scaling milestones".to_string());
        }

        // Validate marketing risks
        if plan.risks.is_empty() {
            warnings.push("No marketing risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No campaign action steps provided".to_string());
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
        35 // 35 seconds for comprehensive marketing strategy
    }
}

impl MarketingAgent for MarketingStrategyAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_marketing_strategy_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = MarketingStrategyAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "marketing-strategy");
        assert_eq!(agent.estimated_duration(), 35);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = MarketingStrategyAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Marketing"));
        assert!(prompt.contains("4Ps"));
        assert!(prompt.contains("Campaign"));
        assert!(prompt.contains("Channel Strategy"));
        assert!(prompt.contains("Brand Positioning"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = MarketingStrategyAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "SEO Campaign: Organic Growth".to_string(),
                description: "Content-driven SEO strategy".to_string(),
                priority: 1,
                estimated_cost: Some(8000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "SEM Campaign: Paid Acquisition".to_string(),
                description: "Google Ads campaign".to_string(),
                priority: 1,
                estimated_cost: Some(12000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Social Media Campaign".to_string(),
                description: "Multi-platform social strategy".to_string(),
                priority: 2,
                estimated_cost: Some(6000),
                expected_roi: Some(3.5),
                dependencies: vec![],
            },
            Recommendation {
                title: "Content Marketing Campaign".to_string(),
                description: "Blog and thought leadership".to_string(),
                priority: 2,
                estimated_cost: Some(5000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "CAC (Customer Acquisition Cost)".to_string(),
                baseline: 0.0,
                target: 50.0,
                unit: "dollars".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Conversion Rate".to_string(),
                baseline: 0.0,
                target: 3.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Weekly,
            },
        ];

        plan.next_steps = vec![
            "Launch SEO campaign".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
