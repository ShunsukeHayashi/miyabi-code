//! JonathanIveDesignAgent - UI/UXデザインレビュー・提案Agent
//!
//! ジョナサン・アイブのデザイン哲学を体現したUI/UX専門Agent。
//! 極限のミニマリズム、余白の贅沢な使用、繊細な色使い、タイポグラフィ重視の原則に基づき、
//! 製品のデザインを評価・改善します。

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMError, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use std::env;

/// JonathanIveDesignAgent - UI/UXデザインレビュー・提案Agent
///
/// ジョナサン・アイブのデザイン哲学を体現したUI/UX専門Agent。
/// 5つのデザイン原則（極限のミニマリズム、余白が主役、繊細な色使い、
/// タイポグラフィ重視、控えめなアニメーション）に基づいてデザインを評価します。
pub struct JonathanIveDesignAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl JonathanIveDesignAgent {
    /// Create a new JonathanIveDesignAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive design review using LLM
    async fn generate_design_review(&self, task: &Task) -> Result<DesignReview> {
        // Initialize LLM provider with fallback chain
        let provider = GPTOSSProvider::new_mac_mini_lan()
            .or_else(|_| GPTOSSProvider::new_mac_mini_tailscale())
            .or_else(|_| {
                let groq_key = env::var("GROQ_API_KEY")
                    .map_err(|_| LLMError::MissingApiKey("GROQ_API_KEY".to_string()))?;
                GPTOSSProvider::new_groq(&groq_key)
            })
            .map_err(crate::llm_error_to_miyabi)?;

        // Create context from task
        let context = LLMContext::from_task(task);

        // Create conversation with Jony Ive design philosophy template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            r#"You are Jonathan Ive, the legendary design leader of Apple.
You embody five core design principles:
1. 極限のミニマリズム - Remove everything unnecessary, keep only the essence
2. 余白が主役 - Whitespace is a luxury, not wasted space
3. 繊細な色使い - White, gray scales, and one accent color maximum
4. タイポグラフィ重視 - Clean, bold typography with size contrast
5. 控えめなアニメーション - Natural, subtle animations only

Evaluate designs with ruthless simplicity and elegance."#,
            r#"Review the following UI/UX design:

Design Element: {task_title}
Context: {task_description}

Provide a comprehensive design review as JSON including:
- Overall assessment (score 0-100)
- Strengths aligned with Jony Ive principles
- Areas for improvement
- Specific recommendations
- Color palette suggestions
- Typography recommendations
- Animation guidelines"#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation
            .ask_with_template(&template)
            .await
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("LLM execution failed: {}", e),
                    AgentType::JonathanIveDesignAgent,
                    Some(task.id.clone()),
                ))
            })?;

        // Parse JSON response
        let design_review: DesignReview = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse design review JSON: {}", e),
                AgentType::JonathanIveDesignAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(design_review)
    }

    /// Validate design review completeness
    fn validate_design_review(&self, review: &DesignReview) -> Result<()> {
        if review.overall_score > 100 {
            return Err(MiyabiError::Agent(AgentError::new(
                "Design score must be between 0 and 100".to_string(),
                AgentType::JonathanIveDesignAgent,
                None,
            )));
        }

        if review.strengths.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Design review must include at least one strength".to_string(),
                AgentType::JonathanIveDesignAgent,
                None,
            )));
        }

        if review.recommendations.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Design review must include at least one recommendation".to_string(),
                AgentType::JonathanIveDesignAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate design review summary for reporting
    fn generate_summary(&self, review: &DesignReview) -> String {
        format!(
            "Design Review: Score {}/100 | {} strengths | {} improvements | {} recommendations",
            review.overall_score,
            review.strengths.len(),
            review.improvements.len(),
            review.recommendations.len()
        )
    }
}

/// Design Review structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignReview {
    pub overall_score: u8,
    pub strengths: Vec<String>,
    pub improvements: Vec<String>,
    pub recommendations: Vec<DesignRecommendation>,
    pub color_palette: ColorPalette,
    pub typography: Typography,
    pub animation_guidelines: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignRecommendation {
    pub category: String,
    pub recommendation: String,
    pub rationale: String,
    pub priority: String, // "high", "medium", "low"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorPalette {
    pub primary: String,
    pub accent: Option<String>,
    pub grayscale: Vec<String>,
    pub rationale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Typography {
    pub primary_font: String,
    pub secondary_font: Option<String>,
    pub size_hierarchy: Vec<String>,
    pub rationale: String,
}

#[async_trait]
impl BaseAgent for JonathanIveDesignAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::JonathanIveDesignAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "JonathanIveDesignAgent starting design review for task: {}",
            task.id
        );

        // Generate design review using LLM
        let design_review = self.generate_design_review(task).await?;

        // Validate design review completeness
        self.validate_design_review(&design_review)?;

        // Generate summary
        let summary = self.generate_summary(&design_review);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::JonathanIveDesignAgent,
            duration_ms,
            quality_score: Some(design_review.overall_score),
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: Some(design_review.improvements.len() as u32),
            timestamp: end_time,
        };

        // Create result data
        let result_data = serde_json::json!({
            "design_review": design_review,
            "summary": summary,
            "overall_score": design_review.overall_score,
            "strengths_count": design_review.strengths.len(),
            "improvements_count": design_review.improvements.len(),
            "recommendations_count": design_review.recommendations.len()
        });

        tracing::info!(
            "JonathanIveDesignAgent completed design review: {}",
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
            id: "test-task-design-1".to_string(),
            title: "Dashboard UI Design".to_string(),
            description: "A modern analytics dashboard with clean design and intuitive navigation"
                .to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(120), // 2 hours
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
    fn test_jonathan_ive_design_agent_creation() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::JonathanIveDesignAgent);
    }

    #[test]
    fn test_design_review_validation_success() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);

        let valid_review = DesignReview {
            overall_score: 85,
            strengths: vec!["Clean layout".to_string(), "Good whitespace".to_string()],
            improvements: vec!["Reduce color usage".to_string()],
            recommendations: vec![DesignRecommendation {
                category: "Color".to_string(),
                recommendation: "Use single accent color".to_string(),
                rationale: "Maintains visual simplicity".to_string(),
                priority: "high".to_string(),
            }],
            color_palette: ColorPalette {
                primary: "white".to_string(),
                accent: Some("blue-600".to_string()),
                grayscale: vec!["gray-50".to_string(), "gray-900".to_string()],
                rationale: "Minimalist palette with single accent".to_string(),
            },
            typography: Typography {
                primary_font: "SF Pro Display".to_string(),
                secondary_font: None,
                size_hierarchy: vec!["text-sm".to_string(), "text-base".to_string()],
                rationale: "Clean sans-serif with clear hierarchy".to_string(),
            },
            animation_guidelines: vec!["Use subtle transitions only".to_string()],
        };

        assert!(agent.validate_design_review(&valid_review).is_ok());
    }

    #[test]
    fn test_design_review_validation_invalid_score() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);

        let invalid_review = DesignReview {
            overall_score: 150, // Invalid score > 100
            strengths: vec!["Clean layout".to_string()],
            improvements: vec!["Reduce color usage".to_string()],
            recommendations: vec![DesignRecommendation {
                category: "Color".to_string(),
                recommendation: "Use single accent color".to_string(),
                rationale: "Maintains visual simplicity".to_string(),
                priority: "high".to_string(),
            }],
            color_palette: ColorPalette {
                primary: "white".to_string(),
                accent: Some("blue-600".to_string()),
                grayscale: vec!["gray-50".to_string()],
                rationale: "Minimalist palette".to_string(),
            },
            typography: Typography {
                primary_font: "SF Pro Display".to_string(),
                secondary_font: None,
                size_hierarchy: vec!["text-sm".to_string()],
                rationale: "Clean sans-serif".to_string(),
            },
            animation_guidelines: vec!["Use subtle transitions".to_string()],
        };

        assert!(agent.validate_design_review(&invalid_review).is_err());
    }

    #[test]
    fn test_design_review_validation_empty_strengths() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);

        let invalid_review = DesignReview {
            overall_score: 85,
            strengths: vec![], // Empty strengths
            improvements: vec!["Reduce color usage".to_string()],
            recommendations: vec![DesignRecommendation {
                category: "Color".to_string(),
                recommendation: "Use single accent color".to_string(),
                rationale: "Maintains visual simplicity".to_string(),
                priority: "high".to_string(),
            }],
            color_palette: ColorPalette {
                primary: "white".to_string(),
                accent: Some("blue-600".to_string()),
                grayscale: vec!["gray-50".to_string()],
                rationale: "Minimalist palette".to_string(),
            },
            typography: Typography {
                primary_font: "SF Pro Display".to_string(),
                secondary_font: None,
                size_hierarchy: vec!["text-sm".to_string()],
                rationale: "Clean sans-serif".to_string(),
            },
            animation_guidelines: vec!["Use subtle transitions".to_string()],
        };

        assert!(agent.validate_design_review(&invalid_review).is_err());
    }

    #[test]
    fn test_design_review_validation_empty_recommendations() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);

        let invalid_review = DesignReview {
            overall_score: 85,
            strengths: vec!["Clean layout".to_string()],
            improvements: vec!["Reduce color usage".to_string()],
            recommendations: vec![], // Empty recommendations
            color_palette: ColorPalette {
                primary: "white".to_string(),
                accent: Some("blue-600".to_string()),
                grayscale: vec!["gray-50".to_string()],
                rationale: "Minimalist palette".to_string(),
            },
            typography: Typography {
                primary_font: "SF Pro Display".to_string(),
                secondary_font: None,
                size_hierarchy: vec!["text-sm".to_string()],
                rationale: "Clean sans-serif".to_string(),
            },
            animation_guidelines: vec!["Use subtle transitions".to_string()],
        };

        assert!(agent.validate_design_review(&invalid_review).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);

        let review = DesignReview {
            overall_score: 85,
            strengths: vec!["Clean layout".to_string(), "Good whitespace".to_string()],
            improvements: vec![
                "Reduce color usage".to_string(),
                "Simplify navigation".to_string(),
            ],
            recommendations: vec![
                DesignRecommendation {
                    category: "Color".to_string(),
                    recommendation: "Use single accent color".to_string(),
                    rationale: "Maintains visual simplicity".to_string(),
                    priority: "high".to_string(),
                },
                DesignRecommendation {
                    category: "Typography".to_string(),
                    recommendation: "Increase size contrast".to_string(),
                    rationale: "Improves readability".to_string(),
                    priority: "medium".to_string(),
                },
                DesignRecommendation {
                    category: "Animation".to_string(),
                    recommendation: "Reduce animation complexity".to_string(),
                    rationale: "Maintains elegance".to_string(),
                    priority: "low".to_string(),
                },
            ],
            color_palette: ColorPalette {
                primary: "white".to_string(),
                accent: Some("blue-600".to_string()),
                grayscale: vec!["gray-50".to_string(), "gray-900".to_string()],
                rationale: "Minimalist palette with single accent".to_string(),
            },
            typography: Typography {
                primary_font: "SF Pro Display".to_string(),
                secondary_font: None,
                size_hierarchy: vec!["text-sm".to_string(), "text-base".to_string()],
                rationale: "Clean sans-serif with clear hierarchy".to_string(),
            },
            animation_guidelines: vec!["Use subtle transitions only".to_string()],
        };

        let summary = agent.generate_summary(&review);
        assert!(summary.contains("85/100"));
        assert!(summary.contains("2 strengths"));
        assert!(summary.contains("2 improvements"));
        assert!(summary.contains("3 recommendations"));
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = JonathanIveDesignAgent::new(config);
        let task = create_test_task();

        assert_eq!(agent.agent_type(), AgentType::JonathanIveDesignAgent);
        assert_eq!(task.id, "test-task-design-1");
        assert_eq!(task.title, "Dashboard UI Design");
    }
}
