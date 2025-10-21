//! SelfAnalysisAgent - SWOT Analysis & Business Strategy
//!
//! Conducts comprehensive self-analysis and strategic planning:
//! - SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
//! - Skill inventory and capability assessment
//! - Resource evaluation
//! - Risk tolerance assessment
//! - Strategic recommendations

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// SelfAnalysisAgent conducts SWOT analysis and strategic planning
pub struct SelfAnalysisAgent {
    client: ClaudeClient,
}

impl SelfAnalysisAgent {
    /// Create a new SelfAnalysisAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the SWOT analysis system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Self-Analysis Agent specializing in SWOT analysis and business strategy.

Your role is to conduct comprehensive self-analysis and strategic planning:

**SWOT Analysis**
- Strengths: Core competencies, unique advantages, resources
- Weaknesses: Skill gaps, resource limitations, competitive disadvantages
- Opportunities: Market trends, emerging technologies, partnerships
- Threats: Competition, market risks, regulatory changes

**Skill Inventory**
- Technical skills (programming, design, marketing, etc.)
- Business skills (sales, finance, operations, strategy)
- Soft skills (communication, leadership, negotiation)
- Domain expertise and industry knowledge
- Certifications and credentials

**Resource Evaluation**
- Financial resources (budget, funding, revenue)
- Human resources (team size, expertise, availability)
- Technology resources (tools, platforms, infrastructure)
- Network resources (connections, partnerships, advisors)
- Time resources (availability, constraints, priorities)

**Risk Tolerance Assessment**
- Financial risk tolerance (investment capacity, loss acceptance)
- Market risk tolerance (competition, volatility)
- Operational risk tolerance (scalability, complexity)
- Innovation risk tolerance (experimentation, failure acceptance)
- Timeline risk tolerance (speed vs quality tradeoffs)

**Strategic Recommendations**
- Short-term actions (0-3 months): Quick wins, immediate priorities
- Medium-term actions (3-12 months): Capability building, market positioning
- Long-term actions (1-3 years): Scaling, expansion, transformation
- Risk mitigation strategies
- Resource allocation priorities
- Success metrics and milestones

**Output Format**: Return a JSON object with the following structure:
{
  "title": "SWOT Analysis & Business Strategy",
  "summary": "2-3 paragraph strategic overview",
  "recommendations": [
    {
      "title": "Strategic recommendation",
      "description": "Detailed strategy description",
      "priority": 1,
      "estimated_cost": 8000,
      "expected_roi": 3.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Strategic KPI",
      "baseline": 0,
      "target": 100,
      "unit": "points",
      "frequency": "quarterly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Strategic milestone",
        "target_date": "2026-05-31T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Strategic risk",
      "severity": 3,
      "probability": 0.4,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Action step 1"]
}

Be honest, objective, and strategic. Focus on actionable insights and realistic assessments."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Conduct a comprehensive SWOT analysis and strategic planning for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please analyze:
1. SWOT Analysis: Strengths, Weaknesses, Opportunities, Threats
2. Skill Inventory: Technical, business, soft skills
3. Resource Evaluation: Financial, human, technology, network, time
4. Risk Tolerance: Financial, market, operational, innovation, timeline risks
5. Strategic Recommendations: Short/medium/long-term actions with priorities

Focus on honest self-assessment and actionable strategic guidance."#,
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

        let title = parsed["title"]
            .as_str()
            .unwrap_or("SWOT Analysis & Business Strategy")
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
impl BusinessAgent for SelfAnalysisAgent {
    fn agent_type(&self) -> &str {
        "self-analysis"
    }

    fn description(&self) -> &str {
        "Conducts SWOT analysis and strategic planning"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "SelfAnalysisAgent: Conducting SWOT analysis for {} in {}",
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
            "Generated SWOT analysis with {} strategies, {} KPIs, {} risks",
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

        // Validate SWOT components (recommendations should cover all 4 quadrants)
        if plan.recommendations.is_empty() {
            errors.push("No SWOT analysis strategies defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 4 {
            warnings.push(
                "Incomplete SWOT (expected at least 4 strategies covering S/W/O/T)".to_string(),
            );
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add strategies for each SWOT quadrant".to_string());
        }

        // Validate strategic KPIs
        if plan.kpis.is_empty() {
            warnings.push("No strategic metrics defined".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add KPIs to measure strategic progress".to_string());
        }

        // Validate timeline (strategic planning should have milestones)
        if plan.timeline.milestones.is_empty() {
            warnings.push("No strategic milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add milestones for short/medium/long-term goals".to_string());
        }

        // Validate risks (critical for strategic planning)
        if plan.risks.is_empty() {
            errors.push("No strategic risks identified".to_string());
            quality_score = quality_score.saturating_sub(20);
        } else if plan.risks.len() < 3 {
            warnings.push("Few risks identified (expected 5-10 across all categories)".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps (actionable guidance required)
        if plan.next_steps.is_empty() {
            errors.push("No strategic action steps provided".to_string());
            quality_score = quality_score.saturating_sub(15);
        } else if plan.next_steps.len() < 3 {
            warnings.push("Few action steps (expected 5-10 prioritized actions)".to_string());
            quality_score = quality_score.saturating_sub(5);
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
        35 // 35 seconds for comprehensive SWOT analysis
    }
}

impl StrategyAgent for SelfAnalysisAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_self_analysis_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SelfAnalysisAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "self-analysis");
        assert_eq!(agent.estimated_duration(), 35);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SelfAnalysisAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("SWOT"));
        assert!(prompt.contains("Strengths"));
        assert!(prompt.contains("Weaknesses"));
        assert!(prompt.contains("Opportunities"));
        assert!(prompt.contains("Threats"));
        assert!(prompt.contains("Risk Tolerance"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = SelfAnalysisAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Strength: Technical Expertise".to_string(),
                description: "Leverage strong development skills".to_string(),
                priority: 1,
                estimated_cost: Some(2000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Weakness: Limited Marketing".to_string(),
                description: "Address marketing skill gap".to_string(),
                priority: 2,
                estimated_cost: Some(3000),
                expected_roi: Some(3.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Opportunity: AI Automation".to_string(),
                description: "Capitalize on AI trends".to_string(),
                priority: 1,
                estimated_cost: Some(5000),
                expected_roi: Some(4.5),
                dependencies: vec![],
            },
            Recommendation {
                title: "Threat: Market Competition".to_string(),
                description: "Differentiate from competitors".to_string(),
                priority: 1,
                estimated_cost: Some(4000),
                expected_roi: Some(3.5),
                dependencies: vec![],
            },
        ];

        plan.risks = vec![Risk {
            description: "Financial constraints".to_string(),
            severity: 3,
            probability: 0.5,
            mitigation: vec!["Bootstrap approach".to_string()],
        }];

        plan.next_steps = vec![
            "Conduct skill gap analysis".to_string(),
            "Build marketing capabilities".to_string(),
            "Research AI tools".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 70);
    }
}
