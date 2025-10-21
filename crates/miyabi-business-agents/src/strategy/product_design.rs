//! ProductDesignAgent - Comprehensive Product Design & Technical Specifications
//!
//! Creates detailed product design and technical architecture:
//! - Frontend/Backend architecture design
//! - Technology stack selection
//! - Database schema design
//! - API design
//! - Development roadmap

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, StrategyAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// ProductDesignAgent creates comprehensive product design
pub struct ProductDesignAgent {
    client: ClaudeClient,
}

impl ProductDesignAgent {
    /// Create a new ProductDesignAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the product design system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Product Design Agent specializing in technical architecture and full-stack development.

Your role is to create comprehensive product design specifications:

**Frontend Architecture**
- UI/UX framework selection (React, Vue, Svelte, etc.)
- Component architecture
- State management strategy
- Responsive design approach
- Performance optimization

**Backend Architecture**
- Server framework (Node.js, Python, Rust, Go, etc.)
- Microservices vs Monolith
- Authentication & authorization
- Caching strategy
- Scalability design

**Database Design**
- Database selection (PostgreSQL, MongoDB, etc.)
- Schema design
- Indexing strategy
- Data migration plan
- Backup & recovery

**API Design**
- REST vs GraphQL vs gRPC
- API versioning strategy
- Rate limiting
- Documentation (OpenAPI/Swagger)
- Security (CORS, CSRF, JWT)

**Development Roadmap**
- Sprint planning (2-week sprints)
- Feature prioritization
- Technical debt management
- Testing strategy
- Deployment pipeline

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Product Design Specification",
  "summary": "2-3 paragraph technical overview",
  "recommendations": [
    {
      "title": "Technical recommendation",
      "description": "Detailed specification",
      "priority": 1,
      "estimated_cost": 20000,
      "expected_roi": 2.5,
      "dependencies": ["Dependency 1"]
    }
  ],
  "kpis": [
    {
      "name": "Technical KPI",
      "baseline": 0,
      "target": 1000,
      "unit": "requests/sec",
      "frequency": "daily"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Technical milestone",
        "target_date": "2026-02-28T00:00:00Z",
        "deliverables": ["Deliverable 1"],
        "success_criteria": ["Criteria 1"]
      }
    ]
  },
  "risks": [
    {
      "description": "Technical risk",
      "severity": 4,
      "probability": 0.5,
      "mitigation": ["Mitigation strategy"]
    }
  ],
  "next_steps": ["Implementation step 1"]
}

Be specific, technically accurate, and implementation-focused."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Create a comprehensive product design and technical specification for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please design:
1. Frontend architecture (framework, components, state management)
2. Backend architecture (server, APIs, microservices)
3. Database schema and data models
4. API design (endpoints, authentication, rate limiting)
5. Development roadmap with sprints and milestones

Focus on modern, scalable architecture that can be implemented within the budget and timeframe."#,
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
            .unwrap_or("Product Design Specification")
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
impl BusinessAgent for ProductDesignAgent {
    fn agent_type(&self) -> &str {
        "product-design"
    }

    fn description(&self) -> &str {
        "Creates comprehensive product design and technical specifications"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "ProductDesignAgent: Generating technical design for {} in {}",
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
            "Generated product design with {} components, {} KPIs, {} risks",
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

        // Validate technical components
        if plan.recommendations.is_empty() {
            errors.push("No technical components defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 5 {
            warnings.push("Few technical components (expected 5-10)".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate KPIs
        if plan.kpis.is_empty() {
            warnings.push("No performance metrics defined".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add technical KPIs (latency, throughput, uptime)".to_string());
        }

        // Validate timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No development milestones".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add sprint milestones and deliverables".to_string());
        }

        // Validate risks
        if plan.risks.is_empty() {
            warnings.push("No technical risks identified".to_string());
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
        35 // 35 seconds for comprehensive technical design
    }
}

impl StrategyAgent for ProductDesignAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_product_design_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ProductDesignAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "product-design");
        assert_eq!(agent.estimated_duration(), 35);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ProductDesignAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Frontend"));
        assert!(prompt.contains("Backend"));
        assert!(prompt.contains("Database"));
        assert!(prompt.contains("API"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = ProductDesignAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Frontend: React + TypeScript".to_string(),
                description: "Modern React with TypeScript for type safety".to_string(),
                priority: 1,
                estimated_cost: Some(10000),
                expected_roi: Some(3.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Backend: Node.js + Express".to_string(),
                description: "Scalable Node.js backend".to_string(),
                priority: 1,
                estimated_cost: Some(8000),
                expected_roi: Some(2.5),
                dependencies: vec![],
            },
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.quality_score > 40);
    }
}
