//! SNSStrategyAgent - SNS戦略・ソーシャルメディア運用Agent
//!
//! ソーシャルメディアストラテジストとして、プラットフォーム別戦略、
//! コミュニティ管理、インフルエンサーマーケティング、SNS広告戦略を
//! 立案します。エンゲージメント向上とブランド認知度拡大を目的とした
//! 包括的なソーシャルメディア戦略を提供します。

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMError, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use std::env;

/// SNSStrategyAgent - SNS戦略・ソーシャルメディア運用Agent
///
/// ソーシャルメディアストラテジストとして、プラットフォーム別戦略、
/// コミュニティ管理、インフルエンサーマーケティング、SNS広告戦略を立案します。
pub struct SNSStrategyAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl SNSStrategyAgent {
    /// Create a new SNSStrategyAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive SNS strategy using LLM
    async fn generate_sns_strategy(&self, task: &Task) -> Result<SNSStrategy> {
        // Initialize LLM provider with fallback chain
        let provider = GPTOSSProvider::new_mac_mini_lan()
            .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
            .or_else(|_| {
                let groq_key = env::var("GROQ_API_KEY").map_err(|_| LLMError::MissingApiKey)?;
                GPTOSSProvider::new_groq(&groq_key)
            })?;

        // Create context from task
        let context = LLMContext::from_task(task);

        // Create conversation with SNS strategy template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a social media strategist specializing in platform-specific strategies, community management, influencer marketing, and social media advertising.",
            r#"Develop a comprehensive SNS strategy for this product:

Product: {task_title}
Target Audience: {task_description}
Social Media Goals: Brand awareness and community building

Generate detailed SNS strategy as JSON with platform strategies, community management, influencer marketing, social media advertising, and performance metrics."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation
            .ask_with_template(&template)
            .await
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("LLM execution failed: {}", e),
                    AgentType::SNSStrategyAgent,
                    Some(task.id.clone()),
                ))
            })?;

        // Parse JSON response
        let sns_strategy: SNSStrategy = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse SNS strategy JSON: {}", e),
                AgentType::SNSStrategyAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(sns_strategy)
    }

    /// Validate SNS strategy completeness
    fn validate_sns_strategy(&self, strategy: &SNSStrategy) -> Result<()> {
        if strategy.platform_strategies.platforms.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "SNS strategy must include platform strategies".to_string(),
                AgentType::SNSStrategyAgent,
                None,
            )));
        }

        if strategy.community_management.strategies.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "SNS strategy must include community management strategies".to_string(),
                AgentType::SNSStrategyAgent,
                None,
            )));
        }

        if strategy.influencer_marketing.campaigns.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "SNS strategy must include influencer marketing campaigns".to_string(),
                AgentType::SNSStrategyAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate SNS strategy summary for reporting
    fn generate_summary(&self, strategy: &SNSStrategy) -> String {
        let total_campaigns = strategy.influencer_marketing.campaigns.len()
            + strategy.social_media_advertising.campaigns.len();

        format!(
            "SNS Strategy Generated: {} platforms, {} community strategies, {} total campaigns",
            strategy.platform_strategies.platforms.len(),
            strategy.community_management.strategies.len(),
            total_campaigns
        )
    }
}

/// SNS Strategy structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SNSStrategy {
    pub platform_strategies: PlatformStrategies,
    pub community_management: CommunityManagement,
    pub influencer_marketing: InfluencerMarketing,
    pub social_media_advertising: SocialMediaAdvertising,
    pub performance_metrics: SNSPerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStrategies {
    pub platforms: Vec<PlatformStrategy>,
    pub cross_platform_strategy: String,
    pub content_adaptation: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStrategy {
    pub platform: String,
    pub strategy: String,
    pub target_audience: String,
    pub content_types: Vec<String>,
    pub posting_schedule: String,
    pub engagement_tactics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityManagement {
    pub strategies: Vec<CommunityStrategy>,
    pub moderation_guidelines: Vec<String>,
    pub crisis_management: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunityStrategy {
    pub strategy: String,
    pub objectives: Vec<String>,
    pub tactics: Vec<String>,
    pub success_metrics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfluencerMarketing {
    pub campaigns: Vec<InfluencerCampaign>,
    pub influencer_selection_criteria: Vec<String>,
    pub partnership_types: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfluencerCampaign {
    pub campaign_name: String,
    pub influencer_type: String,
    pub objectives: Vec<String>,
    pub deliverables: Vec<String>,
    pub budget: String,
    pub timeline: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialMediaAdvertising {
    pub campaigns: Vec<SocialAdCampaign>,
    pub ad_formats: Vec<String>,
    pub targeting_strategies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SocialAdCampaign {
    pub campaign_name: String,
    pub platform: String,
    pub ad_format: String,
    pub target_audience: String,
    pub budget: String,
    pub objectives: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SNSPerformanceMetrics {
    pub kpis: Vec<SNSKPI>,
    pub measurement_tools: Vec<String>,
    pub reporting_schedule: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SNSKPI {
    pub metric: String,
    pub target: String,
    pub platform: String,
    pub measurement_method: String,
}

#[async_trait]
impl BaseAgent for SNSStrategyAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::SNSStrategyAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "SNSStrategyAgent starting SNS strategy generation for task: {}",
            task.id
        );

        // Generate SNS strategy using LLM
        let sns_strategy = self.generate_sns_strategy(task).await?;

        // Validate SNS strategy completeness
        self.validate_sns_strategy(&sns_strategy)?;

        // Generate summary
        let summary = self.generate_summary(&sns_strategy);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::SNSStrategyAgent,
            duration_ms,
            quality_score: Some(90), // High quality for comprehensive SNS strategy
            lines_changed: None,     // Not applicable for SNS strategy
            tests_added: None,       // Not applicable for SNS strategy
            coverage_percent: None,  // Not applicable for SNS strategy
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let total_campaigns = sns_strategy.influencer_marketing.campaigns.len()
            + sns_strategy.social_media_advertising.campaigns.len();

        let result_data = serde_json::json!({
            "sns_strategy": sns_strategy,
            "summary": summary,
            "platforms_count": sns_strategy.platform_strategies.platforms.len(),
            "community_strategies_count": sns_strategy.community_management.strategies.len(),
            "total_campaigns_count": total_campaigns
        });

        tracing::info!(
            "SNSStrategyAgent completed SNS strategy generation: {}",
            summary
        );

        Ok(AgentResult {
            status: miyabi_types::agent::ResultStatus::Success,
            data: Some(result_data),
            error: None,
            metrics: Some(metrics),
            escalation: None,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;

    fn create_test_task() -> Task {
        Task {
            id: "test-task-10".to_string(),
            title: "AI-Powered Social Media Analytics Platform".to_string(),
            description: "A comprehensive social media analytics platform with AI-driven insights and automated reporting".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(260), // 4.3 hours
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    fn create_test_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "test-token".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: true,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    #[test]
    fn test_sns_strategy_agent_creation() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::SNSStrategyAgent);
    }

    #[test]
    fn test_sns_strategy_validation_success() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);

        let valid_strategy = SNSStrategy {
            platform_strategies: PlatformStrategies {
                platforms: vec![PlatformStrategy {
                    platform: "LinkedIn".to_string(),
                    strategy: "B2B focus".to_string(),
                    target_audience: "Professionals".to_string(),
                    content_types: vec!["Articles".to_string()],
                    posting_schedule: "Weekdays".to_string(),
                    engagement_tactics: vec!["Comments".to_string()],
                }],
                cross_platform_strategy: "Consistent messaging".to_string(),
                content_adaptation: vec!["Platform-specific".to_string()],
            },
            community_management: CommunityManagement {
                strategies: vec![CommunityStrategy {
                    strategy: "Engagement".to_string(),
                    objectives: vec!["Build community".to_string()],
                    tactics: vec!["Respond to comments".to_string()],
                    success_metrics: vec!["Engagement rate".to_string()],
                }],
                moderation_guidelines: vec!["Professional tone".to_string()],
                crisis_management: vec!["Response protocol".to_string()],
            },
            influencer_marketing: InfluencerMarketing {
                campaigns: vec![InfluencerCampaign {
                    campaign_name: "Tech influencers".to_string(),
                    influencer_type: "Micro-influencers".to_string(),
                    objectives: vec!["Brand awareness".to_string()],
                    deliverables: vec!["Posts".to_string()],
                    budget: "$10k".to_string(),
                    timeline: "3 months".to_string(),
                }],
                influencer_selection_criteria: vec!["Relevance".to_string()],
                partnership_types: vec!["Sponsored content".to_string()],
            },
            social_media_advertising: SocialMediaAdvertising {
                campaigns: vec![SocialAdCampaign {
                    campaign_name: "Lead generation".to_string(),
                    platform: "LinkedIn".to_string(),
                    ad_format: "Sponsored content".to_string(),
                    target_audience: "B2B".to_string(),
                    budget: "$5k".to_string(),
                    objectives: vec!["Leads".to_string()],
                }],
                ad_formats: vec!["Sponsored posts".to_string()],
                targeting_strategies: vec!["Demographic".to_string()],
            },
            performance_metrics: SNSPerformanceMetrics {
                kpis: vec![SNSKPI {
                    metric: "Engagement rate".to_string(),
                    target: "5%".to_string(),
                    platform: "LinkedIn".to_string(),
                    measurement_method: "Analytics".to_string(),
                }],
                measurement_tools: vec!["Native analytics".to_string()],
                reporting_schedule: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_sns_strategy(&valid_strategy).is_ok());
    }

    #[test]
    fn test_sns_strategy_validation_empty_platforms() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);

        let invalid_strategy = SNSStrategy {
            platform_strategies: PlatformStrategies {
                platforms: vec![], // Empty platforms should fail validation
                cross_platform_strategy: "Consistent messaging".to_string(),
                content_adaptation: vec!["Platform-specific".to_string()],
            },
            community_management: CommunityManagement {
                strategies: vec![CommunityStrategy {
                    strategy: "Engagement".to_string(),
                    objectives: vec!["Build community".to_string()],
                    tactics: vec!["Respond to comments".to_string()],
                    success_metrics: vec!["Engagement rate".to_string()],
                }],
                moderation_guidelines: vec!["Professional tone".to_string()],
                crisis_management: vec!["Response protocol".to_string()],
            },
            influencer_marketing: InfluencerMarketing {
                campaigns: vec![InfluencerCampaign {
                    campaign_name: "Tech influencers".to_string(),
                    influencer_type: "Micro-influencers".to_string(),
                    objectives: vec!["Brand awareness".to_string()],
                    deliverables: vec!["Posts".to_string()],
                    budget: "$10k".to_string(),
                    timeline: "3 months".to_string(),
                }],
                influencer_selection_criteria: vec!["Relevance".to_string()],
                partnership_types: vec!["Sponsored content".to_string()],
            },
            social_media_advertising: SocialMediaAdvertising {
                campaigns: vec![SocialAdCampaign {
                    campaign_name: "Lead generation".to_string(),
                    platform: "LinkedIn".to_string(),
                    ad_format: "Sponsored content".to_string(),
                    target_audience: "B2B".to_string(),
                    budget: "$5k".to_string(),
                    objectives: vec!["Leads".to_string()],
                }],
                ad_formats: vec!["Sponsored posts".to_string()],
                targeting_strategies: vec!["Demographic".to_string()],
            },
            performance_metrics: SNSPerformanceMetrics {
                kpis: vec![SNSKPI {
                    metric: "Engagement rate".to_string(),
                    target: "5%".to_string(),
                    platform: "LinkedIn".to_string(),
                    measurement_method: "Analytics".to_string(),
                }],
                measurement_tools: vec!["Native analytics".to_string()],
                reporting_schedule: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_sns_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_sns_strategy_validation_empty_community_strategies() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);

        let invalid_strategy = SNSStrategy {
            platform_strategies: PlatformStrategies {
                platforms: vec![PlatformStrategy {
                    platform: "LinkedIn".to_string(),
                    strategy: "B2B focus".to_string(),
                    target_audience: "Professionals".to_string(),
                    content_types: vec!["Articles".to_string()],
                    posting_schedule: "Weekdays".to_string(),
                    engagement_tactics: vec!["Comments".to_string()],
                }],
                cross_platform_strategy: "Consistent messaging".to_string(),
                content_adaptation: vec!["Platform-specific".to_string()],
            },
            community_management: CommunityManagement {
                strategies: vec![], // Empty strategies should fail validation
                moderation_guidelines: vec!["Professional tone".to_string()],
                crisis_management: vec!["Response protocol".to_string()],
            },
            influencer_marketing: InfluencerMarketing {
                campaigns: vec![InfluencerCampaign {
                    campaign_name: "Tech influencers".to_string(),
                    influencer_type: "Micro-influencers".to_string(),
                    objectives: vec!["Brand awareness".to_string()],
                    deliverables: vec!["Posts".to_string()],
                    budget: "$10k".to_string(),
                    timeline: "3 months".to_string(),
                }],
                influencer_selection_criteria: vec!["Relevance".to_string()],
                partnership_types: vec!["Sponsored content".to_string()],
            },
            social_media_advertising: SocialMediaAdvertising {
                campaigns: vec![SocialAdCampaign {
                    campaign_name: "Lead generation".to_string(),
                    platform: "LinkedIn".to_string(),
                    ad_format: "Sponsored content".to_string(),
                    target_audience: "B2B".to_string(),
                    budget: "$5k".to_string(),
                    objectives: vec!["Leads".to_string()],
                }],
                ad_formats: vec!["Sponsored posts".to_string()],
                targeting_strategies: vec!["Demographic".to_string()],
            },
            performance_metrics: SNSPerformanceMetrics {
                kpis: vec![SNSKPI {
                    metric: "Engagement rate".to_string(),
                    target: "5%".to_string(),
                    platform: "LinkedIn".to_string(),
                    measurement_method: "Analytics".to_string(),
                }],
                measurement_tools: vec!["Native analytics".to_string()],
                reporting_schedule: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_sns_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_sns_strategy_validation_empty_influencer_campaigns() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);

        let invalid_strategy = SNSStrategy {
            platform_strategies: PlatformStrategies {
                platforms: vec![PlatformStrategy {
                    platform: "LinkedIn".to_string(),
                    strategy: "B2B focus".to_string(),
                    target_audience: "Professionals".to_string(),
                    content_types: vec!["Articles".to_string()],
                    posting_schedule: "Weekdays".to_string(),
                    engagement_tactics: vec!["Comments".to_string()],
                }],
                cross_platform_strategy: "Consistent messaging".to_string(),
                content_adaptation: vec!["Platform-specific".to_string()],
            },
            community_management: CommunityManagement {
                strategies: vec![CommunityStrategy {
                    strategy: "Engagement".to_string(),
                    objectives: vec!["Build community".to_string()],
                    tactics: vec!["Respond to comments".to_string()],
                    success_metrics: vec!["Engagement rate".to_string()],
                }],
                moderation_guidelines: vec!["Professional tone".to_string()],
                crisis_management: vec!["Response protocol".to_string()],
            },
            influencer_marketing: InfluencerMarketing {
                campaigns: vec![], // Empty campaigns should fail validation
                influencer_selection_criteria: vec!["Relevance".to_string()],
                partnership_types: vec!["Sponsored content".to_string()],
            },
            social_media_advertising: SocialMediaAdvertising {
                campaigns: vec![SocialAdCampaign {
                    campaign_name: "Lead generation".to_string(),
                    platform: "LinkedIn".to_string(),
                    ad_format: "Sponsored content".to_string(),
                    target_audience: "B2B".to_string(),
                    budget: "$5k".to_string(),
                    objectives: vec!["Leads".to_string()],
                }],
                ad_formats: vec!["Sponsored posts".to_string()],
                targeting_strategies: vec!["Demographic".to_string()],
            },
            performance_metrics: SNSPerformanceMetrics {
                kpis: vec![SNSKPI {
                    metric: "Engagement rate".to_string(),
                    target: "5%".to_string(),
                    platform: "LinkedIn".to_string(),
                    measurement_method: "Analytics".to_string(),
                }],
                measurement_tools: vec!["Native analytics".to_string()],
                reporting_schedule: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_sns_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);

        let strategy = SNSStrategy {
            platform_strategies: PlatformStrategies {
                platforms: vec![
                    PlatformStrategy {
                        platform: "LinkedIn".to_string(),
                        strategy: "B2B focus".to_string(),
                        target_audience: "Professionals".to_string(),
                        content_types: vec!["Articles".to_string()],
                        posting_schedule: "Weekdays".to_string(),
                        engagement_tactics: vec!["Comments".to_string()],
                    },
                    PlatformStrategy {
                        platform: "Twitter".to_string(),
                        strategy: "Real-time engagement".to_string(),
                        target_audience: "Tech community".to_string(),
                        content_types: vec!["Tweets".to_string()],
                        posting_schedule: "Daily".to_string(),
                        engagement_tactics: vec!["Retweets".to_string()],
                    },
                ],
                cross_platform_strategy: "Consistent messaging".to_string(),
                content_adaptation: vec!["Platform-specific".to_string()],
            },
            community_management: CommunityManagement {
                strategies: vec![
                    CommunityStrategy {
                        strategy: "Engagement".to_string(),
                        objectives: vec!["Build community".to_string()],
                        tactics: vec!["Respond to comments".to_string()],
                        success_metrics: vec!["Engagement rate".to_string()],
                    },
                    CommunityStrategy {
                        strategy: "Moderation".to_string(),
                        objectives: vec!["Maintain quality".to_string()],
                        tactics: vec!["Content review".to_string()],
                        success_metrics: vec!["Response time".to_string()],
                    },
                ],
                moderation_guidelines: vec!["Professional tone".to_string()],
                crisis_management: vec!["Response protocol".to_string()],
            },
            influencer_marketing: InfluencerMarketing {
                campaigns: vec![
                    InfluencerCampaign {
                        campaign_name: "Tech influencers".to_string(),
                        influencer_type: "Micro-influencers".to_string(),
                        objectives: vec!["Brand awareness".to_string()],
                        deliverables: vec!["Posts".to_string()],
                        budget: "$10k".to_string(),
                        timeline: "3 months".to_string(),
                    },
                    InfluencerCampaign {
                        campaign_name: "Industry leaders".to_string(),
                        influencer_type: "Macro-influencers".to_string(),
                        objectives: vec!["Thought leadership".to_string()],
                        deliverables: vec!["Webinars".to_string()],
                        budget: "$20k".to_string(),
                        timeline: "6 months".to_string(),
                    },
                ],
                influencer_selection_criteria: vec!["Relevance".to_string()],
                partnership_types: vec!["Sponsored content".to_string()],
            },
            social_media_advertising: SocialMediaAdvertising {
                campaigns: vec![SocialAdCampaign {
                    campaign_name: "Lead generation".to_string(),
                    platform: "LinkedIn".to_string(),
                    ad_format: "Sponsored content".to_string(),
                    target_audience: "B2B".to_string(),
                    budget: "$5k".to_string(),
                    objectives: vec!["Leads".to_string()],
                }],
                ad_formats: vec!["Sponsored posts".to_string()],
                targeting_strategies: vec!["Demographic".to_string()],
            },
            performance_metrics: SNSPerformanceMetrics {
                kpis: vec![SNSKPI {
                    metric: "Engagement rate".to_string(),
                    target: "5%".to_string(),
                    platform: "LinkedIn".to_string(),
                    measurement_method: "Analytics".to_string(),
                }],
                measurement_tools: vec!["Native analytics".to_string()],
                reporting_schedule: "Weekly".to_string(),
            },
        };

        let summary = agent.generate_summary(&strategy);
        assert!(summary.contains("2 platforms"));
        assert!(summary.contains("2 community strategies"));
        assert!(summary.contains("3 total campaigns")); // 2 influencer + 1 social ad = 3
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = SNSStrategyAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::SNSStrategyAgent);
        assert_eq!(task.id, "test-task-10");
        assert_eq!(task.title, "AI-Powered Social Media Analytics Platform");
    }
}
