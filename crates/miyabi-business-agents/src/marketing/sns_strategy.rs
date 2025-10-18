//! SNSStrategyAgent - Social Media Strategy & Operations
//!
//! Develops comprehensive social media strategies and operations:
//! - Platform selection and optimization (Twitter, LinkedIn, Facebook, Instagram, TikTok)
//! - Content strategy per platform
//! - Community management and engagement
//! - Influencer partnerships and campaigns
//! - Social media advertising and paid promotion

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// SNSStrategyAgent develops social media strategies and operations plans
pub struct SNSStrategyAgent {
    client: ClaudeClient,
}

impl SNSStrategyAgent {
    /// Create a new SNSStrategyAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the SNS strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert Social Media Strategy Agent specializing in SNS marketing and community building.

Your role is to develop comprehensive social media strategies:

**Platform Selection & Optimization**
- Twitter/X: Developer community, tech discussions, product announcements (threads, polls, spaces)
- LinkedIn: B2B marketing, thought leadership, employee advocacy (articles, posts, newsletters)
- Facebook: Community building, groups, events (pages, groups, live video)
- Instagram: Visual storytelling, behind-the-scenes, product demos (posts, stories, reels)
- TikTok: Short-form video, viral trends, younger demographics (15-60 sec videos)
- GitHub: Developer engagement, code discussions, repository promotion (README, Discussions)
- Reddit: Community participation, AMAs, niche subreddits (r/programming, r/devops)
- Hacker News: Show HN launches, tech discussions, startup validation

**Content Strategy Per Platform**
- Content themes and pillars (education, entertainment, inspiration, promotion)
- Posting frequency (daily, 3x/week, weekly) optimized per platform
- Content formats: Text posts, images, videos, carousels, polls, live streams
- Content calendar synchronized across platforms
- Platform-native best practices (hashtags, mentions, tagging, timing)
- A/B testing for headlines, visuals, CTAs

**Community Management & Engagement**
- Response strategy (comment replies, DM responses, mentions)
- Community guidelines and moderation policies
- User-generated content campaigns
- Community events (AMAs, Twitter Spaces, live Q&As)
- Engagement tactics (polls, questions, contests, challenges)
- Crisis management and negative feedback handling

**Influencer Partnerships & Campaigns**
- Micro-influencers (1K-100K followers) vs macro-influencers (100K-1M+)
- Developer advocates and tech influencers
- Collaboration types: Sponsored posts, affiliate programs, brand ambassadors
- Influencer outreach and relationship management
- Campaign tracking and ROI measurement
- Authentic storytelling and co-creation

**Social Media Advertising**
- Paid campaigns: Twitter Ads, LinkedIn Ads, Facebook/Instagram Ads, TikTok Ads
- Targeting: Interests, job titles, company size, behaviors, lookalike audiences
- Ad formats: Promoted posts, carousel ads, video ads, lead gen forms
- Budget allocation per platform (70% testing, 30% scaling winners)
- Retargeting and conversion tracking
- A/B testing ad creatives and copy

**Analytics & Reporting**
- Growth metrics: Followers, reach, impressions
- Engagement metrics: Likes, comments, shares, saves, click-through rate
- Conversion metrics: Website clicks, signups, trials, purchases
- Platform analytics: Twitter Analytics, LinkedIn Analytics, Meta Business Suite
- Social listening and sentiment analysis
- Competitor benchmarking

**Output Format**: Return a JSON object with the following structure:
{
  "title": "Social Media Strategy & Operations Plan",
  "summary": "2-3 paragraph SNS overview",
  "recommendations": [
    {
      "title": "SNS initiative (e.g., 'Twitter Developer Community Growth')",
      "description": "Platform strategy with content themes, posting frequency, engagement tactics",
      "priority": 1,
      "estimated_cost": 5000,
      "expected_roi": 6.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "Twitter Followers",
      "baseline": 500,
      "target": 10000,
      "unit": "followers",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "SNS milestone (e.g., 'Twitter Community Launch')",
        "target_date": "2026-02-28T00:00:00Z",
        "deliverables": ["Daily posting schedule", "50 engaged followers"],
        "success_criteria": ["10% engagement rate", "5% follower growth/week"]
      }
    ]
  },
  "risks": [
    {
      "description": "Algorithm changes reduce organic reach",
      "severity": 3,
      "probability": 0.6,
      "mitigation": ["Diversify platforms", "Build email list"]
    }
  ],
  "next_steps": ["Platform audit", "Content calendar creation"]
}

Be creative, platform-savvy, and community-focused. Emphasize authentic engagement over vanity metrics."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive social media strategy and operations plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Platform Selection: Prioritize 2-4 platforms based on target audience (Twitter, LinkedIn, GitHub, Reddit)
2. Content Strategy: Platform-specific content themes, formats, posting frequency
3. Community Management: Engagement tactics, response strategy, user-generated content
4. Influencer Campaigns: Micro-influencer partnerships, developer advocates
5. Social Advertising: Paid campaigns budget allocation, targeting, ad formats
6. Analytics: Growth, engagement, conversion metrics per platform

Focus on building genuine community and driving measurable business outcomes (signups, trials, sales)."#,
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

        let title = parsed["title"].as_str().unwrap_or("Social Media Strategy & Operations Plan").to_string();
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
impl BusinessAgent for SNSStrategyAgent {
    fn agent_type(&self) -> &str {
        "sns-strategy"
    }

    fn description(&self) -> &str {
        "Develops social media strategies and operations plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("SNSStrategyAgent: Developing SNS strategy for {} in {}",
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

        info!("Generated SNS strategy with {} platform initiatives, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate SNS initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No SNS initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 2 {
            warnings.push("Few SNS initiatives (expected 3-6 covering multiple platforms)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add initiatives for Twitter, LinkedIn, GitHub, Reddit".to_string());
        }

        // Validate SNS KPIs
        if plan.kpis.is_empty() {
            errors.push("No SNS metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push("Few SNS KPIs (expected 5-8 covering growth, engagement, conversion)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add metrics for followers, engagement rate, click-through rate, conversions".to_string());
        }

        // Validate SNS timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No SNS milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add platform launch and growth milestones".to_string());
        }

        // Validate SNS risks
        if plan.risks.is_empty() {
            warnings.push("No SNS risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No SNS action steps provided".to_string());
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
        30 // 30 seconds for comprehensive SNS strategy
    }
}

impl MarketingAgent for SNSStrategyAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sns_strategy_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SNSStrategyAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "sns-strategy");
        assert_eq!(agent.estimated_duration(), 30);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = SNSStrategyAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("Social Media"));
        assert!(prompt.contains("Platform"));
        assert!(prompt.contains("Community"));
        assert!(prompt.contains("Influencer"));
        assert!(prompt.contains("Advertising"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = SNSStrategyAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "Twitter Developer Community Growth".to_string(),
                description: "Daily tech threads, engage with developers, Product Hunt launch".to_string(),
                priority: 1,
                estimated_cost: Some(3000),
                expected_roi: Some(7.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "LinkedIn B2B Thought Leadership".to_string(),
                description: "Weekly articles on DevOps automation, CTO targeting".to_string(),
                priority: 1,
                estimated_cost: Some(4000),
                expected_roi: Some(5.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "GitHub Community Engagement".to_string(),
                description: "Repository promotion, Discussions, contributor growth".to_string(),
                priority: 2,
                estimated_cost: Some(2000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "Twitter Followers".to_string(),
                baseline: 500.0,
                target: 10000.0,
                unit: "followers".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Twitter Engagement Rate".to_string(),
                baseline: 1.0,
                target: 8.0,
                unit: "percent".to_string(),
                frequency: MeasurementFrequency::Weekly,
            },
            KPI {
                name: "LinkedIn Post Impressions".to_string(),
                baseline: 1000.0,
                target: 50000.0,
                unit: "impressions".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        plan.next_steps = vec![
            "Audit current social profiles".to_string(),
            "Create 30-day content calendar".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
