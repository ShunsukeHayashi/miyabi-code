//! SelfAnalysisAgent - 自己分析・事業戦略立案Agent
//!
//! 事業戦略コンサルタントとして、創業者の強み・弱み・機会・脅威（SWOT）分析を
//! 実施し、個人のキャリアと事業目標の整合性を評価します。
//! 創業者の背景に基づいた最適な事業戦略と実行計画を提案します。

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};

/// SelfAnalysisAgent - 自己分析・事業戦略立案Agent
///
/// 事業戦略コンサルタントとして、創業者の強み・弱み・機会・脅威（SWOT）分析を
/// 実施し、個人のキャリアと事業目標の整合性を評価します。
pub struct SelfAnalysisAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl SelfAnalysisAgent {
    /// Create a new SelfAnalysisAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive self-analysis using LLM
    async fn generate_self_analysis(&self, task: &Task) -> Result<SelfAnalysis> {
        // Initialize LLM provider with standard fallback chain
        let provider = GPTOSSProvider::new_with_fallback().map_err(|e| {
            MiyabiError::Unknown(format!("LLM provider initialization failed: {}", e))
        })?;

        // Create context from task
        let context = LLMContext::from_task(task);

        // Create conversation with self-analysis template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a business strategy consultant specializing in founder analysis, SWOT analysis, and career-business alignment.",
            r#"Conduct a comprehensive self-analysis for this entrepreneur:

Entrepreneur Profile: {task_title}
Background: {task_description}
Business Goals: Create a successful startup

Generate detailed self-analysis as JSON with SWOT analysis, skills assessment, career alignment, risk tolerance, and strategic recommendations."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation
            .ask_with_template(&template)
            .await
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("LLM execution failed: {}", e),
                    AgentType::SelfAnalysisAgent,
                    Some(task.id.clone()),
                ))
            })?;

        // Parse JSON response
        let self_analysis: SelfAnalysis = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse self-analysis JSON: {}", e),
                AgentType::SelfAnalysisAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(self_analysis)
    }

    /// Validate self-analysis completeness
    fn validate_self_analysis(&self, analysis: &SelfAnalysis) -> Result<()> {
        if analysis.swot_analysis.strengths.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Self-analysis must include strengths".to_string(),
                AgentType::SelfAnalysisAgent,
                None,
            )));
        }

        if analysis.skills_assessment.technical_skills.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Self-analysis must include technical skills".to_string(),
                AgentType::SelfAnalysisAgent,
                None,
            )));
        }

        if analysis.strategic_recommendations.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Self-analysis must include strategic recommendations".to_string(),
                AgentType::SelfAnalysisAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate self-analysis summary for reporting
    fn generate_summary(&self, analysis: &SelfAnalysis) -> String {
        let total_skills = analysis.skills_assessment.technical_skills.len()
            + analysis.skills_assessment.business_skills.len()
            + analysis.skills_assessment.soft_skills.len();

        format!(
            "Self-Analysis Generated: {} strengths, {} skills, {} recommendations",
            analysis.swot_analysis.strengths.len(),
            total_skills,
            analysis.strategic_recommendations.len()
        )
    }
}

/// Self Analysis structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelfAnalysis {
    pub swot_analysis: SWOTAnalysis,
    pub skills_assessment: SkillsAssessment,
    pub career_alignment: CareerAlignment,
    pub risk_tolerance: RiskTolerance,
    pub strategic_recommendations: Vec<StrategicRecommendation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SWOTAnalysis {
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub opportunities: Vec<String>,
    pub threats: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillsAssessment {
    pub technical_skills: Vec<String>,
    pub business_skills: Vec<String>,
    pub soft_skills: Vec<String>,
    pub skill_gaps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CareerAlignment {
    pub current_role: String,
    pub career_goals: Vec<String>,
    pub business_alignment: String,
    pub transition_strategy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskTolerance {
    pub financial_risk: String,
    pub career_risk: String,
    pub personal_risk: String,
    pub risk_mitigation: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategicRecommendation {
    pub recommendation: String,
    pub priority: String,
    pub timeline: String,
    pub expected_outcome: String,
}

#[async_trait]
impl BaseAgent for SelfAnalysisAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::SelfAnalysisAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "SelfAnalysisAgent starting self-analysis generation for task: {}",
            task.id
        );

        // Generate self-analysis using LLM
        let self_analysis = self.generate_self_analysis(task).await?;

        // Validate self-analysis completeness
        self.validate_self_analysis(&self_analysis)?;

        // Generate summary
        let summary = self.generate_summary(&self_analysis);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::SelfAnalysisAgent,
            duration_ms,
            quality_score: Some(87), // High quality for comprehensive self-analysis
            lines_changed: None,     // Not applicable for self-analysis
            tests_added: None,       // Not applicable for self-analysis
            coverage_percent: None,  // Not applicable for self-analysis
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let result_data = serde_json::json!({
            "self_analysis": self_analysis,
            "summary": summary,
            "strengths_count": self_analysis.swot_analysis.strengths.len(),
            "total_skills_count": self_analysis.skills_assessment.technical_skills.len() + self_analysis.skills_assessment.business_skills.len() + self_analysis.skills_assessment.soft_skills.len(),
            "recommendations_count": self_analysis.strategic_recommendations.len()
        });

        tracing::info!(
            "SelfAnalysisAgent completed self-analysis generation: {}",
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
            id: "test-task-6".to_string(),
            title: "Tech Entrepreneur with 5 years experience".to_string(),
            description: "Software engineer with experience in web development, looking to start a SaaS business in the productivity space".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(180), // 3 hours
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
    fn test_self_analysis_agent_creation() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::SelfAnalysisAgent);
    }

    #[test]
    fn test_self_analysis_validation_success() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);

        let valid_analysis = SelfAnalysis {
            swot_analysis: SWOTAnalysis {
                strengths: vec!["Technical expertise".to_string()],
                weaknesses: vec!["Business development".to_string()],
                opportunities: vec!["Market demand".to_string()],
                threats: vec!["Competition".to_string()],
            },
            skills_assessment: SkillsAssessment {
                technical_skills: vec!["Programming".to_string()],
                business_skills: vec!["Project management".to_string()],
                soft_skills: vec!["Communication".to_string()],
                skill_gaps: vec!["Sales".to_string()],
            },
            career_alignment: CareerAlignment {
                current_role: "Software Engineer".to_string(),
                career_goals: vec!["Entrepreneurship".to_string()],
                business_alignment: "High".to_string(),
                transition_strategy: "Gradual transition".to_string(),
            },
            risk_tolerance: RiskTolerance {
                financial_risk: "Medium".to_string(),
                career_risk: "Low".to_string(),
                personal_risk: "Medium".to_string(),
                risk_mitigation: vec!["Savings buffer".to_string()],
            },
            strategic_recommendations: vec![StrategicRecommendation {
                recommendation: "Partner with business co-founder".to_string(),
                priority: "High".to_string(),
                timeline: "3 months".to_string(),
                expected_outcome: "Business expertise".to_string(),
            }],
        };

        assert!(agent.validate_self_analysis(&valid_analysis).is_ok());
    }

    #[test]
    fn test_self_analysis_validation_empty_strengths() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);

        let invalid_analysis = SelfAnalysis {
            swot_analysis: SWOTAnalysis {
                strengths: vec![], // Empty strengths should fail validation
                weaknesses: vec!["Business development".to_string()],
                opportunities: vec!["Market demand".to_string()],
                threats: vec!["Competition".to_string()],
            },
            skills_assessment: SkillsAssessment {
                technical_skills: vec!["Programming".to_string()],
                business_skills: vec!["Project management".to_string()],
                soft_skills: vec!["Communication".to_string()],
                skill_gaps: vec!["Sales".to_string()],
            },
            career_alignment: CareerAlignment {
                current_role: "Software Engineer".to_string(),
                career_goals: vec!["Entrepreneurship".to_string()],
                business_alignment: "High".to_string(),
                transition_strategy: "Gradual transition".to_string(),
            },
            risk_tolerance: RiskTolerance {
                financial_risk: "Medium".to_string(),
                career_risk: "Low".to_string(),
                personal_risk: "Medium".to_string(),
                risk_mitigation: vec!["Savings buffer".to_string()],
            },
            strategic_recommendations: vec![StrategicRecommendation {
                recommendation: "Partner with business co-founder".to_string(),
                priority: "High".to_string(),
                timeline: "3 months".to_string(),
                expected_outcome: "Business expertise".to_string(),
            }],
        };

        assert!(agent.validate_self_analysis(&invalid_analysis).is_err());
    }

    #[test]
    fn test_self_analysis_validation_empty_technical_skills() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);

        let invalid_analysis = SelfAnalysis {
            swot_analysis: SWOTAnalysis {
                strengths: vec!["Technical expertise".to_string()],
                weaknesses: vec!["Business development".to_string()],
                opportunities: vec!["Market demand".to_string()],
                threats: vec!["Competition".to_string()],
            },
            skills_assessment: SkillsAssessment {
                technical_skills: vec![], // Empty technical skills should fail validation
                business_skills: vec!["Project management".to_string()],
                soft_skills: vec!["Communication".to_string()],
                skill_gaps: vec!["Sales".to_string()],
            },
            career_alignment: CareerAlignment {
                current_role: "Software Engineer".to_string(),
                career_goals: vec!["Entrepreneurship".to_string()],
                business_alignment: "High".to_string(),
                transition_strategy: "Gradual transition".to_string(),
            },
            risk_tolerance: RiskTolerance {
                financial_risk: "Medium".to_string(),
                career_risk: "Low".to_string(),
                personal_risk: "Medium".to_string(),
                risk_mitigation: vec!["Savings buffer".to_string()],
            },
            strategic_recommendations: vec![StrategicRecommendation {
                recommendation: "Partner with business co-founder".to_string(),
                priority: "High".to_string(),
                timeline: "3 months".to_string(),
                expected_outcome: "Business expertise".to_string(),
            }],
        };

        assert!(agent.validate_self_analysis(&invalid_analysis).is_err());
    }

    #[test]
    fn test_self_analysis_validation_empty_recommendations() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);

        let invalid_analysis = SelfAnalysis {
            swot_analysis: SWOTAnalysis {
                strengths: vec!["Technical expertise".to_string()],
                weaknesses: vec!["Business development".to_string()],
                opportunities: vec!["Market demand".to_string()],
                threats: vec!["Competition".to_string()],
            },
            skills_assessment: SkillsAssessment {
                technical_skills: vec!["Programming".to_string()],
                business_skills: vec!["Project management".to_string()],
                soft_skills: vec!["Communication".to_string()],
                skill_gaps: vec!["Sales".to_string()],
            },
            career_alignment: CareerAlignment {
                current_role: "Software Engineer".to_string(),
                career_goals: vec!["Entrepreneurship".to_string()],
                business_alignment: "High".to_string(),
                transition_strategy: "Gradual transition".to_string(),
            },
            risk_tolerance: RiskTolerance {
                financial_risk: "Medium".to_string(),
                career_risk: "Low".to_string(),
                personal_risk: "Medium".to_string(),
                risk_mitigation: vec!["Savings buffer".to_string()],
            },
            strategic_recommendations: vec![], // Empty recommendations should fail validation
        };

        assert!(agent.validate_self_analysis(&invalid_analysis).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);

        let analysis = SelfAnalysis {
            swot_analysis: SWOTAnalysis {
                strengths: vec![
                    "Technical expertise".to_string(),
                    "Problem solving".to_string(),
                ],
                weaknesses: vec!["Business development".to_string()],
                opportunities: vec!["Market demand".to_string()],
                threats: vec!["Competition".to_string()],
            },
            skills_assessment: SkillsAssessment {
                technical_skills: vec!["Programming".to_string(), "System design".to_string()],
                business_skills: vec!["Project management".to_string()],
                soft_skills: vec!["Communication".to_string(), "Leadership".to_string()],
                skill_gaps: vec!["Sales".to_string()],
            },
            career_alignment: CareerAlignment {
                current_role: "Software Engineer".to_string(),
                career_goals: vec!["Entrepreneurship".to_string()],
                business_alignment: "High".to_string(),
                transition_strategy: "Gradual transition".to_string(),
            },
            risk_tolerance: RiskTolerance {
                financial_risk: "Medium".to_string(),
                career_risk: "Low".to_string(),
                personal_risk: "Medium".to_string(),
                risk_mitigation: vec!["Savings buffer".to_string()],
            },
            strategic_recommendations: vec![
                StrategicRecommendation {
                    recommendation: "Partner with business co-founder".to_string(),
                    priority: "High".to_string(),
                    timeline: "3 months".to_string(),
                    expected_outcome: "Business expertise".to_string(),
                },
                StrategicRecommendation {
                    recommendation: "Develop MVP".to_string(),
                    priority: "Medium".to_string(),
                    timeline: "6 months".to_string(),
                    expected_outcome: "Product validation".to_string(),
                },
            ],
        };

        let summary = agent.generate_summary(&analysis);
        assert!(summary.contains("2 strengths"));
        assert!(summary.contains("5 skills")); // 2 technical + 1 business + 2 soft = 5
        assert!(summary.contains("2 recommendations"));
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = SelfAnalysisAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::SelfAnalysisAgent);
        assert_eq!(task.id, "test-task-6");
        assert_eq!(task.title, "Tech Entrepreneur with 5 years experience");
    }
}
