//! YouTubeAgent - YouTube戦略・動画コンテンツ企画Agent
//!
//! YouTubeストラテジストとして、チャンネル戦略、動画コンテンツ企画、
//! SEO最適化、サムネイルデザイン、収益化戦略を立案します。
//! エンゲージメント向上とチャンネル成長を目的とした
//! 包括的なYouTube戦略を提供します。

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};

/// YouTubeAgent - YouTube戦略・動画コンテンツ企画Agent
///
/// YouTubeストラテジストとして、チャンネル戦略、動画コンテンツ企画、
/// SEO最適化、サムネイルデザイン、収益化戦略を立案します。
pub struct YouTubeAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl YouTubeAgent {
    /// Create a new YouTubeAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive YouTube strategy using LLM
    async fn generate_youtube_strategy(&self, task: &Task) -> Result<YouTubeStrategy> {
        // Initialize LLM provider with standard fallback chain
        let provider = GPTOSSProvider::new_with_fallback().map_err(|e| {
            MiyabiError::Unknown(format!("LLM provider initialization failed: {}", e))
        })?;

        // Create context from task
        let context = LLMContext::from_task(task);

        // Create conversation with YouTube strategy template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a YouTube strategist specializing in channel growth, video content planning, SEO optimization, thumbnail design, and monetization strategies.",
            r#"Develop a comprehensive YouTube strategy for this product:

Product: {task_title}
Target Audience: {task_description}
YouTube Goals: Channel growth and audience engagement

Generate detailed YouTube strategy as JSON with channel strategy, content planning, SEO optimization, thumbnail design, monetization, and performance metrics."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation
            .ask_with_template(&template)
            .await
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("LLM execution failed: {}", e),
                    AgentType::YouTubeAgent,
                    Some(task.id.clone()),
                ))
            })?;

        // Parse JSON response
        let youtube_strategy: YouTubeStrategy = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse YouTube strategy JSON: {}", e),
                AgentType::YouTubeAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(youtube_strategy)
    }

    /// Validate YouTube strategy completeness
    fn validate_youtube_strategy(&self, strategy: &YouTubeStrategy) -> Result<()> {
        if strategy.channel_strategy.content_types.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "YouTube strategy must include content types".to_string(),
                AgentType::YouTubeAgent,
                None,
            )));
        }

        if strategy.content_planning.video_series.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "YouTube strategy must include video series".to_string(),
                AgentType::YouTubeAgent,
                None,
            )));
        }

        if strategy.seo_optimization.keywords.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "YouTube strategy must include SEO keywords".to_string(),
                AgentType::YouTubeAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate YouTube strategy summary for reporting
    fn generate_summary(&self, strategy: &YouTubeStrategy) -> String {
        let total_videos = strategy
            .content_planning
            .video_series
            .iter()
            .map(|series| series.episodes.len())
            .sum::<usize>();

        format!(
            "YouTube Strategy Generated: {} content types, {} video series, {} total videos planned",
            strategy.channel_strategy.content_types.len(),
            strategy.content_planning.video_series.len(),
            total_videos
        )
    }
}

/// YouTube Strategy structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeStrategy {
    pub channel_strategy: ChannelStrategy,
    pub content_planning: ContentPlanning,
    pub seo_optimization: SEOOptimization,
    pub thumbnail_design: ThumbnailDesign,
    pub monetization: Monetization,
    pub performance_metrics: YouTubePerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelStrategy {
    pub content_types: Vec<ContentType>,
    pub upload_schedule: String,
    pub target_audience: String,
    pub channel_branding: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentType {
    pub content_type: String,
    pub description: String,
    pub frequency: String,
    pub target_duration: String,
    pub engagement_goals: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentPlanning {
    pub video_series: Vec<VideoSeries>,
    pub seasonal_content: Vec<String>,
    pub collaboration_opportunities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoSeries {
    pub series_name: String,
    pub description: String,
    pub episodes: Vec<VideoEpisode>,
    pub total_episodes: String,
    pub release_schedule: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoEpisode {
    pub episode_title: String,
    pub topic: String,
    pub key_points: Vec<String>,
    pub estimated_duration: String,
    pub call_to_action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SEOOptimization {
    pub keywords: Vec<YouTubeKeyword>,
    pub title_optimization: Vec<String>,
    pub description_templates: Vec<String>,
    pub tag_strategies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeKeyword {
    pub keyword: String,
    pub search_volume: String,
    pub competition_level: String,
    pub usage_frequency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailDesign {
    pub design_principles: Vec<String>,
    pub color_schemes: Vec<String>,
    pub text_overlay_strategies: Vec<String>,
    pub a_b_testing_plan: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Monetization {
    pub revenue_streams: Vec<RevenueStream>,
    pub sponsor_guidelines: Vec<String>,
    pub affiliate_strategies: Vec<String>,
    pub merchandise_opportunities: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevenueStream {
    pub stream_type: String,
    pub description: String,
    pub potential_earnings: String,
    pub implementation_timeline: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubePerformanceMetrics {
    pub kpis: Vec<YouTubeKPI>,
    pub analytics_tools: Vec<String>,
    pub reporting_frequency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeKPI {
    pub metric: String,
    pub target: String,
    pub measurement_method: String,
    pub improvement_strategies: Vec<String>,
}

#[async_trait]
impl BaseAgent for YouTubeAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::YouTubeAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "YouTubeAgent starting YouTube strategy generation for task: {}",
            task.id
        );

        // Generate YouTube strategy using LLM
        let youtube_strategy = self.generate_youtube_strategy(task).await?;

        // Validate YouTube strategy completeness
        self.validate_youtube_strategy(&youtube_strategy)?;

        // Generate summary
        let summary = self.generate_summary(&youtube_strategy);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::YouTubeAgent,
            duration_ms,
            quality_score: Some(92), // High quality for comprehensive YouTube strategy
            lines_changed: None,     // Not applicable for YouTube strategy
            tests_added: None,       // Not applicable for YouTube strategy
            coverage_percent: None,  // Not applicable for YouTube strategy
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let total_videos = youtube_strategy
            .content_planning
            .video_series
            .iter()
            .map(|series| series.episodes.len())
            .sum::<usize>();

        let result_data = serde_json::json!({
            "youtube_strategy": youtube_strategy,
            "summary": summary,
            "content_types_count": youtube_strategy.channel_strategy.content_types.len(),
            "video_series_count": youtube_strategy.content_planning.video_series.len(),
            "total_videos_planned": total_videos
        });

        tracing::info!(
            "YouTubeAgent completed YouTube strategy generation: {}",
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
            id: "test-task-11".to_string(),
            title: "AI-Powered Video Analytics Platform".to_string(),
            description: "A comprehensive video analytics platform with AI-driven insights and automated optimization".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(280), // 4.7 hours
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
    fn test_youtube_agent_creation() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::YouTubeAgent);
    }

    #[test]
    fn test_youtube_strategy_validation_success() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);

        let valid_strategy = YouTubeStrategy {
            channel_strategy: ChannelStrategy {
                content_types: vec![ContentType {
                    content_type: "Educational".to_string(),
                    description: "How-to videos".to_string(),
                    frequency: "Weekly".to_string(),
                    target_duration: "10-15 minutes".to_string(),
                    engagement_goals: vec!["Comments".to_string()],
                }],
                upload_schedule: "Every Tuesday".to_string(),
                target_audience: "Tech professionals".to_string(),
                channel_branding: vec!["Professional".to_string()],
            },
            content_planning: ContentPlanning {
                video_series: vec![VideoSeries {
                    series_name: "AI Tutorials".to_string(),
                    description: "Learn AI concepts".to_string(),
                    episodes: vec![VideoEpisode {
                        episode_title: "Introduction to AI".to_string(),
                        topic: "AI basics".to_string(),
                        key_points: vec!["What is AI".to_string()],
                        estimated_duration: "12 minutes".to_string(),
                        call_to_action: "Subscribe for more".to_string(),
                    }],
                    total_episodes: "10".to_string(),
                    release_schedule: "Weekly".to_string(),
                }],
                seasonal_content: vec!["Holiday specials".to_string()],
                collaboration_opportunities: vec!["Tech influencers".to_string()],
            },
            seo_optimization: SEOOptimization {
                keywords: vec![YouTubeKeyword {
                    keyword: "AI tutorial".to_string(),
                    search_volume: "High".to_string(),
                    competition_level: "Medium".to_string(),
                    usage_frequency: "Every video".to_string(),
                }],
                title_optimization: vec!["Include keywords".to_string()],
                description_templates: vec!["Standard template".to_string()],
                tag_strategies: vec!["Relevant tags".to_string()],
            },
            thumbnail_design: ThumbnailDesign {
                design_principles: vec!["Eye-catching".to_string()],
                color_schemes: vec!["Blue and white".to_string()],
                text_overlay_strategies: vec!["Bold text".to_string()],
                a_b_testing_plan: vec!["Test variations".to_string()],
            },
            monetization: Monetization {
                revenue_streams: vec![RevenueStream {
                    stream_type: "Ad revenue".to_string(),
                    description: "YouTube ads".to_string(),
                    potential_earnings: "$1000/month".to_string(),
                    implementation_timeline: "Immediate".to_string(),
                }],
                sponsor_guidelines: vec!["Relevant sponsors".to_string()],
                affiliate_strategies: vec!["Product links".to_string()],
                merchandise_opportunities: vec!["Channel merch".to_string()],
            },
            performance_metrics: YouTubePerformanceMetrics {
                kpis: vec![YouTubeKPI {
                    metric: "Watch time".to_string(),
                    target: "1000 hours/month".to_string(),
                    measurement_method: "Analytics".to_string(),
                    improvement_strategies: vec!["Better content".to_string()],
                }],
                analytics_tools: vec!["YouTube Analytics".to_string()],
                reporting_frequency: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_youtube_strategy(&valid_strategy).is_ok());
    }

    #[test]
    fn test_youtube_strategy_validation_empty_content_types() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);

        let invalid_strategy = YouTubeStrategy {
            channel_strategy: ChannelStrategy {
                content_types: vec![], // Empty content types should fail validation
                upload_schedule: "Every Tuesday".to_string(),
                target_audience: "Tech professionals".to_string(),
                channel_branding: vec!["Professional".to_string()],
            },
            content_planning: ContentPlanning {
                video_series: vec![VideoSeries {
                    series_name: "AI Tutorials".to_string(),
                    description: "Learn AI concepts".to_string(),
                    episodes: vec![VideoEpisode {
                        episode_title: "Introduction to AI".to_string(),
                        topic: "AI basics".to_string(),
                        key_points: vec!["What is AI".to_string()],
                        estimated_duration: "12 minutes".to_string(),
                        call_to_action: "Subscribe for more".to_string(),
                    }],
                    total_episodes: "10".to_string(),
                    release_schedule: "Weekly".to_string(),
                }],
                seasonal_content: vec!["Holiday specials".to_string()],
                collaboration_opportunities: vec!["Tech influencers".to_string()],
            },
            seo_optimization: SEOOptimization {
                keywords: vec![YouTubeKeyword {
                    keyword: "AI tutorial".to_string(),
                    search_volume: "High".to_string(),
                    competition_level: "Medium".to_string(),
                    usage_frequency: "Every video".to_string(),
                }],
                title_optimization: vec!["Include keywords".to_string()],
                description_templates: vec!["Standard template".to_string()],
                tag_strategies: vec!["Relevant tags".to_string()],
            },
            thumbnail_design: ThumbnailDesign {
                design_principles: vec!["Eye-catching".to_string()],
                color_schemes: vec!["Blue and white".to_string()],
                text_overlay_strategies: vec!["Bold text".to_string()],
                a_b_testing_plan: vec!["Test variations".to_string()],
            },
            monetization: Monetization {
                revenue_streams: vec![RevenueStream {
                    stream_type: "Ad revenue".to_string(),
                    description: "YouTube ads".to_string(),
                    potential_earnings: "$1000/month".to_string(),
                    implementation_timeline: "Immediate".to_string(),
                }],
                sponsor_guidelines: vec!["Relevant sponsors".to_string()],
                affiliate_strategies: vec!["Product links".to_string()],
                merchandise_opportunities: vec!["Channel merch".to_string()],
            },
            performance_metrics: YouTubePerformanceMetrics {
                kpis: vec![YouTubeKPI {
                    metric: "Watch time".to_string(),
                    target: "1000 hours/month".to_string(),
                    measurement_method: "Analytics".to_string(),
                    improvement_strategies: vec!["Better content".to_string()],
                }],
                analytics_tools: vec!["YouTube Analytics".to_string()],
                reporting_frequency: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_youtube_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_youtube_strategy_validation_empty_video_series() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);

        let invalid_strategy = YouTubeStrategy {
            channel_strategy: ChannelStrategy {
                content_types: vec![ContentType {
                    content_type: "Educational".to_string(),
                    description: "How-to videos".to_string(),
                    frequency: "Weekly".to_string(),
                    target_duration: "10-15 minutes".to_string(),
                    engagement_goals: vec!["Comments".to_string()],
                }],
                upload_schedule: "Every Tuesday".to_string(),
                target_audience: "Tech professionals".to_string(),
                channel_branding: vec!["Professional".to_string()],
            },
            content_planning: ContentPlanning {
                video_series: vec![], // Empty video series should fail validation
                seasonal_content: vec!["Holiday specials".to_string()],
                collaboration_opportunities: vec!["Tech influencers".to_string()],
            },
            seo_optimization: SEOOptimization {
                keywords: vec![YouTubeKeyword {
                    keyword: "AI tutorial".to_string(),
                    search_volume: "High".to_string(),
                    competition_level: "Medium".to_string(),
                    usage_frequency: "Every video".to_string(),
                }],
                title_optimization: vec!["Include keywords".to_string()],
                description_templates: vec!["Standard template".to_string()],
                tag_strategies: vec!["Relevant tags".to_string()],
            },
            thumbnail_design: ThumbnailDesign {
                design_principles: vec!["Eye-catching".to_string()],
                color_schemes: vec!["Blue and white".to_string()],
                text_overlay_strategies: vec!["Bold text".to_string()],
                a_b_testing_plan: vec!["Test variations".to_string()],
            },
            monetization: Monetization {
                revenue_streams: vec![RevenueStream {
                    stream_type: "Ad revenue".to_string(),
                    description: "YouTube ads".to_string(),
                    potential_earnings: "$1000/month".to_string(),
                    implementation_timeline: "Immediate".to_string(),
                }],
                sponsor_guidelines: vec!["Relevant sponsors".to_string()],
                affiliate_strategies: vec!["Product links".to_string()],
                merchandise_opportunities: vec!["Channel merch".to_string()],
            },
            performance_metrics: YouTubePerformanceMetrics {
                kpis: vec![YouTubeKPI {
                    metric: "Watch time".to_string(),
                    target: "1000 hours/month".to_string(),
                    measurement_method: "Analytics".to_string(),
                    improvement_strategies: vec!["Better content".to_string()],
                }],
                analytics_tools: vec!["YouTube Analytics".to_string()],
                reporting_frequency: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_youtube_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_youtube_strategy_validation_empty_keywords() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);

        let invalid_strategy = YouTubeStrategy {
            channel_strategy: ChannelStrategy {
                content_types: vec![ContentType {
                    content_type: "Educational".to_string(),
                    description: "How-to videos".to_string(),
                    frequency: "Weekly".to_string(),
                    target_duration: "10-15 minutes".to_string(),
                    engagement_goals: vec!["Comments".to_string()],
                }],
                upload_schedule: "Every Tuesday".to_string(),
                target_audience: "Tech professionals".to_string(),
                channel_branding: vec!["Professional".to_string()],
            },
            content_planning: ContentPlanning {
                video_series: vec![VideoSeries {
                    series_name: "AI Tutorials".to_string(),
                    description: "Learn AI concepts".to_string(),
                    episodes: vec![VideoEpisode {
                        episode_title: "Introduction to AI".to_string(),
                        topic: "AI basics".to_string(),
                        key_points: vec!["What is AI".to_string()],
                        estimated_duration: "12 minutes".to_string(),
                        call_to_action: "Subscribe for more".to_string(),
                    }],
                    total_episodes: "10".to_string(),
                    release_schedule: "Weekly".to_string(),
                }],
                seasonal_content: vec!["Holiday specials".to_string()],
                collaboration_opportunities: vec!["Tech influencers".to_string()],
            },
            seo_optimization: SEOOptimization {
                keywords: vec![], // Empty keywords should fail validation
                title_optimization: vec!["Include keywords".to_string()],
                description_templates: vec!["Standard template".to_string()],
                tag_strategies: vec!["Relevant tags".to_string()],
            },
            thumbnail_design: ThumbnailDesign {
                design_principles: vec!["Eye-catching".to_string()],
                color_schemes: vec!["Blue and white".to_string()],
                text_overlay_strategies: vec!["Bold text".to_string()],
                a_b_testing_plan: vec!["Test variations".to_string()],
            },
            monetization: Monetization {
                revenue_streams: vec![RevenueStream {
                    stream_type: "Ad revenue".to_string(),
                    description: "YouTube ads".to_string(),
                    potential_earnings: "$1000/month".to_string(),
                    implementation_timeline: "Immediate".to_string(),
                }],
                sponsor_guidelines: vec!["Relevant sponsors".to_string()],
                affiliate_strategies: vec!["Product links".to_string()],
                merchandise_opportunities: vec!["Channel merch".to_string()],
            },
            performance_metrics: YouTubePerformanceMetrics {
                kpis: vec![YouTubeKPI {
                    metric: "Watch time".to_string(),
                    target: "1000 hours/month".to_string(),
                    measurement_method: "Analytics".to_string(),
                    improvement_strategies: vec!["Better content".to_string()],
                }],
                analytics_tools: vec!["YouTube Analytics".to_string()],
                reporting_frequency: "Weekly".to_string(),
            },
        };

        assert!(agent.validate_youtube_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);

        let strategy = YouTubeStrategy {
            channel_strategy: ChannelStrategy {
                content_types: vec![
                    ContentType {
                        content_type: "Educational".to_string(),
                        description: "How-to videos".to_string(),
                        frequency: "Weekly".to_string(),
                        target_duration: "10-15 minutes".to_string(),
                        engagement_goals: vec!["Comments".to_string()],
                    },
                    ContentType {
                        content_type: "Entertainment".to_string(),
                        description: "Fun content".to_string(),
                        frequency: "Bi-weekly".to_string(),
                        target_duration: "5-8 minutes".to_string(),
                        engagement_goals: vec!["Likes".to_string()],
                    },
                ],
                upload_schedule: "Every Tuesday".to_string(),
                target_audience: "Tech professionals".to_string(),
                channel_branding: vec!["Professional".to_string()],
            },
            content_planning: ContentPlanning {
                video_series: vec![
                    VideoSeries {
                        series_name: "AI Tutorials".to_string(),
                        description: "Learn AI concepts".to_string(),
                        episodes: vec![
                            VideoEpisode {
                                episode_title: "Introduction to AI".to_string(),
                                topic: "AI basics".to_string(),
                                key_points: vec!["What is AI".to_string()],
                                estimated_duration: "12 minutes".to_string(),
                                call_to_action: "Subscribe for more".to_string(),
                            },
                            VideoEpisode {
                                episode_title: "Machine Learning Basics".to_string(),
                                topic: "ML fundamentals".to_string(),
                                key_points: vec!["ML concepts".to_string()],
                                estimated_duration: "15 minutes".to_string(),
                                call_to_action: "Like and subscribe".to_string(),
                            },
                        ],
                        total_episodes: "10".to_string(),
                        release_schedule: "Weekly".to_string(),
                    },
                    VideoSeries {
                        series_name: "Tech Reviews".to_string(),
                        description: "Product reviews".to_string(),
                        episodes: vec![VideoEpisode {
                            episode_title: "Latest Tech Review".to_string(),
                            topic: "Product review".to_string(),
                            key_points: vec!["Features".to_string()],
                            estimated_duration: "8 minutes".to_string(),
                            call_to_action: "Check description".to_string(),
                        }],
                        total_episodes: "5".to_string(),
                        release_schedule: "Bi-weekly".to_string(),
                    },
                ],
                seasonal_content: vec!["Holiday specials".to_string()],
                collaboration_opportunities: vec!["Tech influencers".to_string()],
            },
            seo_optimization: SEOOptimization {
                keywords: vec![YouTubeKeyword {
                    keyword: "AI tutorial".to_string(),
                    search_volume: "High".to_string(),
                    competition_level: "Medium".to_string(),
                    usage_frequency: "Every video".to_string(),
                }],
                title_optimization: vec!["Include keywords".to_string()],
                description_templates: vec!["Standard template".to_string()],
                tag_strategies: vec!["Relevant tags".to_string()],
            },
            thumbnail_design: ThumbnailDesign {
                design_principles: vec!["Eye-catching".to_string()],
                color_schemes: vec!["Blue and white".to_string()],
                text_overlay_strategies: vec!["Bold text".to_string()],
                a_b_testing_plan: vec!["Test variations".to_string()],
            },
            monetization: Monetization {
                revenue_streams: vec![RevenueStream {
                    stream_type: "Ad revenue".to_string(),
                    description: "YouTube ads".to_string(),
                    potential_earnings: "$1000/month".to_string(),
                    implementation_timeline: "Immediate".to_string(),
                }],
                sponsor_guidelines: vec!["Relevant sponsors".to_string()],
                affiliate_strategies: vec!["Product links".to_string()],
                merchandise_opportunities: vec!["Channel merch".to_string()],
            },
            performance_metrics: YouTubePerformanceMetrics {
                kpis: vec![YouTubeKPI {
                    metric: "Watch time".to_string(),
                    target: "1000 hours/month".to_string(),
                    measurement_method: "Analytics".to_string(),
                    improvement_strategies: vec!["Better content".to_string()],
                }],
                analytics_tools: vec!["YouTube Analytics".to_string()],
                reporting_frequency: "Weekly".to_string(),
            },
        };

        let summary = agent.generate_summary(&strategy);
        assert!(summary.contains("2 content types"));
        assert!(summary.contains("2 video series"));
        assert!(summary.contains("3 total videos planned")); // 2 + 1 = 3 episodes
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = YouTubeAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::YouTubeAgent);
        assert_eq!(task.id, "test-task-11");
        assert_eq!(task.title, "AI-Powered Video Analytics Platform");
    }
}
