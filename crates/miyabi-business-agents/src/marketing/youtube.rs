//! YouTubeAgent - YouTube Strategy & Video Content Planning
//!
//! Develops comprehensive YouTube strategies and video production plans:
//! - Channel optimization and branding
//! - Video content strategy and series planning
//! - SEO and keyword optimization for YouTube
//! - Video production workflow and equipment
//! - Monetization and growth strategies

use crate::client::ClaudeClient;
use crate::traits::{BusinessAgent, MarketingAgent};
use crate::types::*;
use async_trait::async_trait;
use miyabi_types::MiyabiError;
use serde_json;
use tracing::{debug, info};

/// YouTubeAgent develops YouTube strategies and video content plans
pub struct YouTubeAgent {
    client: ClaudeClient,
}

impl YouTubeAgent {
    /// Create a new YouTubeAgent
    pub fn new() -> Result<Self, MiyabiError> {
        let client = ClaudeClient::new()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claude client: {}", e)))?;

        Ok(Self { client })
    }

    /// Generate the YouTube strategy system prompt
    fn create_system_prompt(&self) -> String {
        r#"You are an expert YouTube Strategy Agent specializing in video marketing and channel growth.

Your role is to develop comprehensive YouTube strategies:

**Channel Optimization & Branding**
- Channel name, description, keywords (SEO-optimized for discovery)
- Channel art: Banner (2560x1440), profile picture, watermark, end screens
- Playlists organization: Tutorial series, product demos, case studies, Q&As
- Channel trailer (30-60 sec) for new visitors
- About section with links to website, social media, newsletter
- Verification and monetization setup (1,000 subs, 4,000 watch hours)

**Video Content Strategy**
- Educational Content: Tutorials, how-tos, best practices (8-15 min)
- Thought Leadership: Industry trends, predictions, expert interviews (10-20 min)
- Product Demos: Feature walkthroughs, use cases, comparisons (5-12 min)
- Case Studies: Customer success stories, before/after results (6-10 min)
- Behind-the-Scenes: Company culture, team intros, development process (4-8 min)
- Live Streams: Q&As, webinars, product launches, office hours (30-90 min)
- Shorts: Quick tips, highlights, teasers (15-60 sec) for viral discovery

**Video Series Planning**
- Series 1: "DevOps Automation 101" (10 episodes, weekly release)
- Series 2: "GitHub Power User Tips" (20 episodes, bi-weekly)
- Series 3: "Customer Success Stories" (monthly interviews)
- Series 4: "Tech Deep Dives" (monthly 20-min in-depth tutorials)
- Consistency in branding, intros, outros, thumbnails per series

**SEO & Keyword Optimization**
- Primary keywords per video (e.g., "GitHub automation", "DevOps tools")
- Secondary and long-tail keywords (e.g., "how to automate GitHub workflows")
- Titles: Front-load keywords, 60-70 characters, compelling hooks
- Descriptions: 200-300 words, keywords in first 2 lines, timestamps, links
- Tags: 10-15 relevant tags, mix of broad and specific
- Closed captions (auto-generated + manual review for accuracy)
- Chapters/timestamps for better user experience and SEO

**Video Production Workflow**
- Pre-production: Scripting, storyboarding, shot list, equipment checklist
- Production: Camera (smartphone/DSLR), microphone (lav/shotgun), lighting (ring/softbox)
- Post-production: Editing software (DaVinci Resolve/Premiere Pro), thumbnails (Canva/Photoshop)
- Publishing: Upload schedule, premiere vs instant publish, community posts
- Quality standards: 1080p minimum, 60fps for screencasts, stereo audio
- Equipment budget: $500 (budget), $2K (mid-range), $10K+ (professional)

**Monetization & Growth Strategies**
- AdSense revenue (CPM varies $2-$10 based on niche)
- Sponsorships: Brand deals, affiliate links, product placements
- Memberships: Channel memberships ($4.99/mo), Super Chat, Super Thanks
- Merchandise: Teespring integration, branded swag
- Lead generation: Video CTAs to website, free trial, newsletter signup
- Cross-promotion: Link to blog, social media, email list
- Collaborations: Guest appearances, co-created content, influencer partnerships
- Growth tactics: Consistent upload schedule (weekly minimum), engagement (reply to comments), community tab posts

**YouTube Analytics & Metrics**
- Views: Total views, unique viewers, avg view duration
- Engagement: Likes, comments, shares, saves to playlist, click-through rate (CTR)
- Audience: Demographics, geography, traffic sources (YouTube search, suggested, external)
- Retention: Audience retention graph, avg percentage viewed, watch time
- Subscribers: New subscribers per video, subscriber growth rate
- Revenue: AdSense earnings, sponsorships, affiliate commissions
- Conversion: Website clicks, trial signups, purchase attribution

**Output Format**: Return a JSON object with the following structure:
{
  "title": "YouTube Strategy & Video Content Plan",
  "summary": "2-3 paragraph YouTube overview",
  "recommendations": [
    {
      "title": "YouTube initiative (e.g., 'DevOps Tutorial Series Launch')",
      "description": "Video series strategy with topics, format, production workflow",
      "priority": 1,
      "estimated_cost": 3000,
      "expected_roi": 8.0,
      "dependencies": []
    }
  ],
  "kpis": [
    {
      "name": "YouTube Subscribers",
      "baseline": 0,
      "target": 5000,
      "unit": "subscribers",
      "frequency": "monthly"
    }
  ],
  "timeline": {
    "milestones": [
      {
        "name": "YouTube milestone (e.g., 'First 10 Videos Published')",
        "target_date": "2026-04-30T00:00:00Z",
        "deliverables": ["10 tutorial videos", "Channel optimization"],
        "success_criteria": ["1,000 subscribers", "10K total views"]
      }
    ]
  },
  "risks": [
    {
      "description": "Low video production quality hurts retention",
      "severity": 3,
      "probability": 0.5,
      "mitigation": ["Invest in good microphone", "Hire video editor"]
    }
  ],
  "next_steps": ["Channel setup", "Script first 5 videos"]
}

Be creative, video-savvy, and growth-focused. Emphasize consistency and value-driven content over viral chasing."#.to_string()
    }

    /// Generate user prompt from business input
    fn create_user_prompt(&self, input: &BusinessInput) -> String {
        format!(
            r#"Develop a comprehensive YouTube strategy and video content plan for:

**Industry**: {}
**Target Market**: {}
**Initial Budget**: ${}
**Geography**: {}
**Timeframe**: {} months
**Additional Context**: {}

Please create:
1. Channel Optimization: Branding, SEO setup, playlists, verification strategy
2. Content Strategy: Video types, series planning, topics, posting frequency
3. SEO Strategy: Keyword research, titles, descriptions, tags, closed captions
4. Production Workflow: Pre/production/post-production process, equipment recommendations
5. Monetization: AdSense, sponsorships, memberships, lead generation tactics
6. Analytics: Views, engagement, retention, subscriber growth metrics

Focus on building a sustainable YouTube presence that drives brand awareness and lead generation."#,
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

        let title = parsed["title"].as_str().unwrap_or("YouTube Strategy & Video Content Plan").to_string();
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
impl BusinessAgent for YouTubeAgent {
    fn agent_type(&self) -> &str {
        "youtube-strategy"
    }

    fn description(&self) -> &str {
        "Develops YouTube strategies and video content plans"
    }

    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
        info!("YouTubeAgent: Developing YouTube strategy for {} in {}",
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

        info!("Generated YouTube strategy with {} video initiatives, {} KPIs, {} risks",
              plan.recommendations.len(), plan.kpis.len(), plan.risks.len());

        Ok(plan)
    }

    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
        let mut warnings = Vec::new();
        let mut errors = Vec::new();
        let mut suggestions = Vec::new();
        let mut quality_score = 100u8;

        // Validate YouTube initiatives (recommendations)
        if plan.recommendations.is_empty() {
            errors.push("No YouTube initiatives defined".to_string());
            quality_score = quality_score.saturating_sub(30);
        } else if plan.recommendations.len() < 2 {
            warnings.push("Few YouTube initiatives (expected 3-5 covering various video types)".to_string());
            quality_score = quality_score.saturating_sub(15);
            suggestions.push("Add diverse video types: tutorials, product demos, case studies, live streams".to_string());
        }

        // Validate YouTube KPIs
        if plan.kpis.is_empty() {
            errors.push("No YouTube metrics defined".to_string());
            quality_score = quality_score.saturating_sub(25);
        } else if plan.kpis.len() < 3 {
            warnings.push("Few YouTube KPIs (expected 5-7 covering subscribers, views, watch time, engagement)".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add metrics for subscribers, views, watch time, CTR, retention rate".to_string());
        }

        // Validate YouTube timeline
        if plan.timeline.milestones.is_empty() {
            warnings.push("No YouTube milestones defined".to_string());
            quality_score = quality_score.saturating_sub(10);
            suggestions.push("Add video production and subscriber growth milestones".to_string());
        }

        // Validate YouTube risks
        if plan.risks.is_empty() {
            warnings.push("No YouTube risks identified".to_string());
            quality_score = quality_score.saturating_sub(10);
        }

        // Validate next steps
        if plan.next_steps.is_empty() {
            errors.push("No YouTube action steps provided".to_string());
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
        30 // 30 seconds for comprehensive YouTube strategy
    }
}

impl MarketingAgent for YouTubeAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_youtube_agent_creation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = YouTubeAgent::new().unwrap();
        assert_eq!(agent.agent_type(), "youtube-strategy");
        assert_eq!(agent.estimated_duration(), 30);
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let agent = YouTubeAgent::new().unwrap();
        let prompt = agent.create_system_prompt();

        assert!(prompt.contains("YouTube"));
        assert!(prompt.contains("Channel"));
        assert!(prompt.contains("Video"));
        assert!(prompt.contains("SEO"));
        assert!(prompt.contains("Monetization"));
    }

    #[tokio::test]
    async fn test_validation() {
        let agent = YouTubeAgent::new();
        if agent.is_err() {
            return;
        }
        let agent = agent.unwrap();

        let mut plan = BusinessPlan::default();
        plan.recommendations = vec![
            Recommendation {
                title: "DevOps Tutorial Series (10 episodes)".to_string(),
                description: "Weekly 8-12 min tutorials on GitHub automation and DevOps best practices".to_string(),
                priority: 1,
                estimated_cost: Some(2000),
                expected_roi: Some(9.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Product Demo Videos".to_string(),
                description: "Feature walkthroughs and use case demonstrations".to_string(),
                priority: 1,
                estimated_cost: Some(1500),
                expected_roi: Some(7.0),
                dependencies: vec![],
            },
            Recommendation {
                title: "Customer Success Stories".to_string(),
                description: "Monthly interviews with successful users".to_string(),
                priority: 2,
                estimated_cost: Some(1000),
                expected_roi: Some(6.0),
                dependencies: vec![],
            },
        ];

        plan.kpis = vec![
            KPI {
                name: "YouTube Subscribers".to_string(),
                baseline: 0.0,
                target: 5000.0,
                unit: "subscribers".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Total Views".to_string(),
                baseline: 0.0,
                target: 50000.0,
                unit: "views".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
            KPI {
                name: "Watch Time (hours)".to_string(),
                baseline: 0.0,
                target: 4000.0,
                unit: "hours".to_string(),
                frequency: MeasurementFrequency::Monthly,
            },
        ];

        plan.next_steps = vec![
            "Set up YouTube channel and branding".to_string(),
            "Script first 5 tutorial videos".to_string(),
        ];

        let result = agent.validate_output(&plan).await.unwrap();
        assert!(result.is_valid);
        assert!(result.quality_score > 50);
    }
}
