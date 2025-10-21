//! ContentCreationAgent - Content Strategy & Production Planning
//!
//! Develops comprehensive content strategies and production plans:
//! - Content types (blog, whitepaper, case study, video, infographic)
//! - Content calendar and publishing schedule
//! - SEO optimization and keyword strategy
//! - Content distribution and amplification
//! - Content performance metrics and analytics

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// ContentCreationAgent develops content strategies and production plans
pub struct ContentCreationAgent {
    client: ClaudeClient,
}

impl ContentCreationAgent {
    /// Create a new ContentCreationAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the content creation system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Content Creation Agent specializing in content strategy and production planning.

Your role is to develop comprehensive content marketing strategies:

**Content Types & Formats**
- Blog Articles: Educational posts, thought leadership, SEO-optimized content (800-2000 words)
- Whitepapers: In-depth research, industry reports, technical guides (3000-5000 words)
- Case Studies: Customer success stories, ROI demonstrations (1000-1500 words)
- eBooks & Guides: Comprehensive resources, lead magnets (5000-10000 words)
- Infographics: Visual data stories, process diagrams, statistics visualization
- Video Content: Product demos, tutorials, webinars, customer testimonials (3-15 min)
- Social Media: Posts, threads, stories optimized per platform (Twitter, LinkedIn, Facebook)
- Email Newsletters: Weekly/monthly updates, curated content, nurturing sequences

**Content Calendar & Publishing**
- Editorial calendar (weekly/monthly planning)
- Content themes and topic clusters
- Publishing frequency (daily, weekly, monthly)
- Seasonal and event-based content
- Content repurposing strategy (blog → video → social posts)
- Multi-channel distribution schedule

**SEO & Keyword Strategy**
- Primary and secondary keywords per article
- Long-tail keyword opportunities
- Search intent mapping (informational, navigational, transactional)
- On-page SEO optimization (title, meta description, headers, internal linking)
- Competitive content gap analysis
- Topic authority building strategy

**Content Distribution & Amplification**
- Owned channels: Blog, newsletter, social media
- Earned channels: PR, guest posts, backlinks, mentions
- Paid channels: Sponsored content, native ads, influencer partnerships
- Community channels: Reddit, Hacker News, Product Hunt, forums
- Cross-promotion and content syndication

**Content Performance Metrics**
- Traffic: Page views, unique visitors, time on page
- Engagement: Comments, shares, downloads, video completion rate
- SEO: Keyword rankings, backlinks, domain authority
- Lead Generation: Form fills, email signups, content downloads
- Revenue Attribution: Content-assisted conversions, pipeline influence

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Content Strategy & Production Plan",
  "summary": "2-3 paragraph content overview",
  "recommendations": [
    {
      "title": "Content initiative (e.g., 'Thought Leadership Blog Series')",
      "description": "Detailed content plan with topics, formats, distribution",
      "priority": 1,
      "estimated_cost": 8000,
      "expected_roi": 4.5,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Monthly Blog Traffic",
      "baseline": 1000,
      "target": 10000,
      "unit": "visitors",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "Content production milestone",
        "target_date": "2026-03-31T00:00:00Z",
        "deliverables": ["10 blog articles", "2 whitepapers"],
        "success_criteria": ["5K monthly traffic", "200 leads"]
      }
    ]
  },
  "risks": [
    {
      "description": "Content production bottleneck",
      "severity": 3,
      "probability": 0.5,
      "mitigation": ["Hire freelance writers", "Content templates"]
    }
  ],
  "next_steps": ["Content audit", "Keyword research"]
}

Be creative, strategic, and content-focused. Emphasize quality over quantity and measurable content ROI."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive content strategy and production plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Content Types & Formats: Blog, whitepaper, case study, video, infographic mix
2. Content Calendar: Editorial planning, publishing frequency, themes
3. SEO Strategy: Keyword research, on-page optimization, topic clusters
4. Distribution Plan: Owned/earned/paid channels, amplification tactics
5. Performance Metrics: Traffic, engagement, leads, revenue attribution

Focus on content that drives organic traffic, generates leads, and establishes thought leadership."#,
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
            .unwrap_or("Content Strategy & Production Plan")
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
impl BusinessAgent for ContentCreationAgent {
    fn agent_type(&self) -> &str {
        "content-creation"
    }

    fn description(&self) -> &str {
        "Develops content strategies and production plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!(
            "ContentCreationAgent: Developing content strategy for {} in {}",
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
            "Generated content strategy with {} initiatives, {} KPIs, {} risks",
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

        // Validate content initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No content initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 3 {
            warnings.push(
                "Few content initiatives (expected 5-8 covering various formats)".to_string(),
            );
            quality_score = quality_score.saturating_sub(15);
            suggestions.push(
                "Add diverse content types: blog, whitepaper, case study, video, infographic"
                    .to_string(),
            );
        }

        // Validate content KPIs
        if plan.kpis.is_empty() {
            errors.push("No content metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push(
                "Few content KPIs (expected 5-8 covering traffic, engagement, leads)".to_string(),
            );
            quality_score = quality_score.saturating_sub(10);
            suggestions
                .push("Add metrics for traffic, engagement, SEO, lead generation".to_string());
        }

        // Validate content calendar (timeline)
        if plan.timeline.milestones.is_empty() {
            warnings.push("No content production milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions
                .push("Add content production sprints and publishing milestones".to_string());
        }

        // Validate content risks
        if plan.risks.is_empty() {
            warnings.push("No content production risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No content action steps provided".to_string());
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
        30 // 30 seconds for comprehensive content strategy
    }
}

impl MarketingAgent for ContentCreationAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_content_creation_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ContentCreationAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "content-creation");
        assert_eq!(agent.estimated_duration(), 30);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = ContentCreationAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Content"));
        assert!(prompt.contains("Blog"));
        assert!(prompt.contains("SEO"));
        assert!(prompt.contains("Distribution"));
        assert!(prompt.contains("Performance"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = ContentCreationAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Thought Leadership Blog Series".to_string(),
                description: "Weekly technical blog posts on DevOps automation".to_string(),
                priority: 1,
                estimated_cost: Some(6000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Technical Whitepaper: GitHub Automation".to_string(),
                description: "In-depth guide on GitHub-native workflows".to_string(),
                priority: 1,
                estimated_cost: Some(4000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Customer Case Studies".to_string(),
                description: "Success stories from beta users".to_string(),
                priority: 2,
                estimated_cost: Some(3000),
                expected_roi: Some(4.5),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Monthly Blog Traffic".to_string(),
                baseline: 1000.0,
                target: 10000.0,
                unit: "visitors".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Content Downloads".to_string(),
                baseline: 0.0,
                target: 500.0,
                unit: "downloads".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        plan.next_steps = vec![
            "Conduct content audit".to_string(),
            "Keyword research for 10 topics".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
