//! PersonaAgent - Customer Persona & Segmentation Analysis
//!
//! Creates detailed customer personas and segmentation strategies:
//! - Demographics & psychographics
//! - Behavioral patterns
//! - Needs & pain points
//! - Customer journey mapping
//! - Segmentation strategies

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// PersonaAgent creates customer personas and segmentation
pub struct PersonaAgent {
    client: ClaudeClient,
}

impl PersonaAgent {
    /// Create a new PersonaAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the persona analysis system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Persona Agent specializing in customer persona creation and market segmentation.

Your role is to create comprehensive customer personas and segmentation strategies:

**Demographics**
- Age range, gender distribution
- Income level, education
- Geographic location
- Occupation and industry
- Family status

**Psychographics**
- Values and beliefs
- Lifestyle and interests
- Personality traits
- Attitudes and opinions
- Goals and aspirations

**Behavioral Patterns**
- Buying behavior and decision-making process
- Technology adoption (early adopter, mainstream, laggard)
- Brand loyalty and switching patterns
- Information sources and influencers
- Shopping preferences (online vs offline)

**Needs & Pain Points**
- Primary needs and desires
- Current frustrations and challenges
- Unmet needs in the market
- Jobs to be done (JTBD framework)
- Success criteria and desired outcomes

**Customer Journey Mapping**
- Awareness stage (how they discover solutions)
- Consideration stage (evaluation criteria)
- Decision stage (purchase triggers)
- Usage stage (adoption and engagement)
- Advocacy stage (referral behavior)

**Segmentation Strategy**
- Primary segments (3-5 key personas)
- Secondary segments
- Niche opportunities
- Segment prioritization
- Targeting strategy

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Customer Persona Analysis",
  "summary": "2-3 paragraph persona overview",
  "recommendations": [
    {
      "title": "Persona or segment name",
      "description": "Detailed persona profile",
      "priority": 1,
      "estimated_cost": 5000,
      "expected_roi": 3.5,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Segmentation KPI",
      "baseline": 0,
      "target": 10000,
      "unit": "users",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Persona milestone",
        "target_date": "2026-04-30T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Segmentation risk",
      "severity": 3,
      "probability": 0.3,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Research step 1"]
}

Be specific, data-driven, and empathetic. Focus on deep customer understanding."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Create comprehensive customer personas and segmentation analysis for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Demographics: Age, income, education, location
2. Psychographics: Values, lifestyle, personality
3. Behavioral patterns: Buying behavior, technology adoption
4. Needs & pain points: Primary needs, frustrations, JTBD
5. Customer journey: Awareness → Decision → Advocacy
6. Segmentation strategy: 3-5 key personas with prioritization

Focus on actionable insights that inform product, marketing, and sales strategies."#,
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

        let title = parsed["title"].as_str().unwrap_or("Customer Persona Analysis").to_string();
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
impl BusinessAgent for PersonaAgent {
    fn agent_type(&self) -> &str {
        "persona"
    }

    fn description(&self) -> &str {
        "Creates customer personas and market segmentation strategies"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("PersonaAgent: Generating customer personas for {} in {}",
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

        info!("Generated {} personas, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate personas (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No customer personas defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 2 {
            warnings.push("Only one persona (expected 3-5)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Create multiple personas for different segments".to_string());
        } else if plan.recommendations.len() > 7 {
            warnings.push("Too many personas - consider consolidation".to_string());
            quality_score = quality_score.saturating_sub(5);
        }

        // Validate KPIs
        if plan.kpis.is_empty() {
            warnings.push("No segmentation metrics defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add metrics to track persona engagement".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No persona research milestones".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate risks
        if plan.risks.is_empty() {
            warnings.push("No segmentation risks identified".to_string());
            quality_score = quality_score.saturating_sub(5);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No research steps provided".to_string());
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
        25 // 25 seconds for persona analysis
    }
}

impl StrategyAgent for PersonaAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_persona_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = PersonaAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "persona");
        assert_eq!(agent.estimated_duration(), 25);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = PersonaAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Persona"));
        assert!(prompt.contains("Demographics"));
        assert!(prompt.contains("Psychographics"));
        assert!(prompt.contains("Customer Journey"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = PersonaAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Persona 1: Tech-Savvy SMB Owner".to_string(),
                description: "Early adopter, values efficiency".to_string(),
                priority: 1,
                estimated_cost: Some(3000),
                expected_roi: Some(4.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Persona 2: Traditional Enterprise Manager".to_string(),
                description: "Risk-averse, values reliability".to_string(),
                priority: 2,
                estimated_cost: Some(2000),
                expected_roi: Some(2.5),
                dependencies: vec![],
            },
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.quality_score > 50);
    }
}
