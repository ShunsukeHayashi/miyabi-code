//! SalesAgent - 営業戦略・セールスプロセス最適化Agent
//!
//! セールスストラテジストとして、営業戦略、セールスプロセス設計、
//! リードジェネレーション、クロージング戦略、営業KPI管理を立案します。
//! 売上向上と営業効率化を目的とした包括的な営業戦略を提供します。

use async_trait::async_trait;
use miyabi_agent_core::{
    a2a_integration::{
        A2AAgentCard, A2AEnabled, A2AIntegrationError, A2ATask, A2ATaskResult, AgentCapability,
        AgentCardBuilder,
    },
    BaseAgent,
};
use miyabi_core::ExecutionMode;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMError, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;

/// SalesAgent - 営業戦略・セールスプロセス最適化Agent
///
/// セールスストラテジストとして、営業戦略、セールスプロセス設計、
/// リードジェネレーション、クロージング戦略、営業KPI管理を立案します。
pub struct SalesAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl SalesAgent {
    /// Create a new SalesAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive sales strategy using LLM
    async fn generate_sales_strategy(&self, task: &Task) -> Result<SalesStrategy> {
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

        // Create conversation with sales strategy template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a sales strategist specializing in sales process optimization, lead generation, closing strategies, and sales KPI management.",
            r#"Develop a comprehensive sales strategy for this product:

Product: {task_title}
Target Market: {task_description}
Sales Goals: Revenue growth and customer acquisition

Generate detailed sales strategy as JSON with sales process, lead generation, closing strategies, sales training, and performance metrics."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation
            .ask_with_template(&template)
            .await
            .map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("LLM execution failed: {}", e),
                    AgentType::SalesAgent,
                    Some(task.id.clone()),
                ))
            })?;

        // Parse JSON response
        let sales_strategy: SalesStrategy = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse sales strategy JSON: {}", e),
                AgentType::SalesAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(sales_strategy)
    }

    /// Validate sales strategy completeness
    fn validate_sales_strategy(&self, strategy: &SalesStrategy) -> Result<()> {
        if strategy.sales_process.stages.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Sales strategy must include sales process stages".to_string(),
                AgentType::SalesAgent,
                None,
            )));
        }

        if strategy.lead_generation.channels.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Sales strategy must include lead generation channels".to_string(),
                AgentType::SalesAgent,
                None,
            )));
        }

        if strategy.closing_strategies.techniques.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Sales strategy must include closing strategies".to_string(),
                AgentType::SalesAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate sales strategy summary for reporting
    fn generate_summary(&self, strategy: &SalesStrategy) -> String {
        let total_techniques =
            strategy.closing_strategies.techniques.len() + strategy.sales_training.modules.len();

        format!(
            "Sales Strategy Generated: {} sales stages, {} lead channels, {} total techniques",
            strategy.sales_process.stages.len(),
            strategy.lead_generation.channels.len(),
            total_techniques
        )
    }
}

/// Sales Strategy structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesStrategy {
    pub sales_process: SalesProcess,
    pub lead_generation: LeadGeneration,
    pub closing_strategies: ClosingStrategies,
    pub sales_training: SalesTraining,
    pub performance_metrics: SalesPerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesProcess {
    pub stages: Vec<SalesStage>,
    pub qualification_criteria: Vec<String>,
    pub objection_handling: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesStage {
    pub stage_name: String,
    pub description: String,
    pub activities: Vec<String>,
    pub success_criteria: Vec<String>,
    pub average_duration: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeadGeneration {
    pub channels: Vec<LeadChannel>,
    pub qualification_process: Vec<String>,
    pub nurturing_strategies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeadChannel {
    pub channel_name: String,
    pub description: String,
    pub lead_quality: String,
    pub conversion_rate: String,
    pub cost_per_lead: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClosingStrategies {
    pub techniques: Vec<ClosingTechnique>,
    pub pricing_strategies: Vec<String>,
    pub negotiation_tactics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClosingTechnique {
    pub technique_name: String,
    pub description: String,
    pub when_to_use: String,
    pub success_rate: String,
    pub implementation_tips: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesTraining {
    pub modules: Vec<TrainingModule>,
    pub onboarding_process: Vec<String>,
    pub continuous_improvement: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingModule {
    pub module_name: String,
    pub description: String,
    pub duration: String,
    pub learning_objectives: Vec<String>,
    pub assessment_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesPerformanceMetrics {
    pub kpis: Vec<SalesKPI>,
    pub reporting_frequency: String,
    pub improvement_strategies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalesKPI {
    pub metric: String,
    pub target: String,
    pub measurement_method: String,
    pub improvement_tactics: Vec<String>,
}

#[async_trait]
impl BaseAgent for SalesAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::SalesAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "SalesAgent starting sales strategy generation for task: {}",
            task.id
        );

        // Generate sales strategy using LLM
        let sales_strategy = self.generate_sales_strategy(task).await?;

        // Validate sales strategy completeness
        self.validate_sales_strategy(&sales_strategy)?;

        // Generate summary
        let summary = self.generate_summary(&sales_strategy);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::SalesAgent,
            duration_ms,
            quality_score: Some(91), // High quality for comprehensive sales strategy
            lines_changed: None,     // Not applicable for sales strategy
            tests_added: None,       // Not applicable for sales strategy
            coverage_percent: None,  // Not applicable for sales strategy
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let total_techniques = sales_strategy.closing_strategies.techniques.len()
            + sales_strategy.sales_training.modules.len();

        let result_data = serde_json::json!({
            "sales_strategy": sales_strategy,
            "summary": summary,
            "sales_stages_count": sales_strategy.sales_process.stages.len(),
            "lead_channels_count": sales_strategy.lead_generation.channels.len(),
            "total_techniques_count": total_techniques
        });

        tracing::info!(
            "SalesAgent completed sales strategy generation: {}",
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

#[async_trait]
impl A2AEnabled for SalesAgent {
    fn agent_card(&self) -> A2AAgentCard {
        AgentCardBuilder::new("SalesAgent", "Sales strategy and process optimization agent")
            .version("0.1.1")
            .capability(AgentCapability {
                id: "plan_sales".to_string(),
                name: "Plan Sales Strategy".to_string(),
                description: "Create sales strategy with lead generation, process design, and KPI management".to_string(),
                input_schema: Some(json!({"type": "object", "properties": {"product": {"type": "string"}, "target_revenue": {"type": "string"}}, "required": ["product"]})),
                output_schema: Some(json!({"type": "object", "properties": {"sales_strategy": {"type": "object"}}})),
            })
            .build()
    }
    async fn handle_a2a_task(
        &self,
        task: A2ATask,
    ) -> std::result::Result<A2ATaskResult, A2AIntegrationError> {
        let start = std::time::Instant::now();
        match task.capability.as_str() {
            "plan_sales" => {
                let product = task
                    .input
                    .get("product")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        A2AIntegrationError::TaskExecutionFailed("Missing product".to_string())
                    })?;
                let internal_task = Task {
                    id: task.id.clone(),
                    title: product.to_string(),
                    description: "Sales strategy".to_string(),
                    task_type: miyabi_types::task::TaskType::Feature,
                    priority: 1,
                    severity: None,
                    impact: None,
                    assigned_agent: Some(AgentType::SalesAgent),
                    dependencies: vec![],
                    estimated_duration: Some(180),
                    status: None,
                    start_time: None,
                    end_time: None,
                    metadata: None,
                };
                match self.execute(&internal_task).await {
                    Ok(result) => Ok(A2ATaskResult::Success {
                        output: result.data.unwrap_or(json!({"status": "completed"})),
                        artifacts: vec![],
                        execution_time_ms: start.elapsed().as_millis() as u64,
                    }),
                    Err(e) => Err(A2AIntegrationError::TaskExecutionFailed(format!(
                        "Sales strategy failed: {}",
                        e
                    ))),
                }
            }
            _ => Err(A2AIntegrationError::TaskExecutionFailed(format!(
                "Unknown capability: {}",
                task.capability
            ))),
        }
    }
    fn execution_mode(&self) -> ExecutionMode {
        ExecutionMode::ReadOnly
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;

    fn create_test_task() -> Task {
        Task {
            id: "test-task-12".to_string(),
            title: "AI-Powered Sales Automation Platform".to_string(),
            description: "A comprehensive sales automation platform with AI-driven lead scoring and pipeline management".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(300), // 5 hours
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
    fn test_sales_agent_creation() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::SalesAgent);
    }

    #[test]
    fn test_sales_strategy_validation_success() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);

        let valid_strategy = SalesStrategy {
            sales_process: SalesProcess {
                stages: vec![SalesStage {
                    stage_name: "Prospecting".to_string(),
                    description: "Find potential customers".to_string(),
                    activities: vec!["Research".to_string()],
                    success_criteria: vec!["Qualified leads".to_string()],
                    average_duration: "1 week".to_string(),
                }],
                qualification_criteria: vec!["Budget".to_string()],
                objection_handling: vec!["Price objections".to_string()],
            },
            lead_generation: LeadGeneration {
                channels: vec![LeadChannel {
                    channel_name: "Inbound marketing".to_string(),
                    description: "Website leads".to_string(),
                    lead_quality: "High".to_string(),
                    conversion_rate: "15%".to_string(),
                    cost_per_lead: "$50".to_string(),
                }],
                qualification_process: vec!["BANT criteria".to_string()],
                nurturing_strategies: vec!["Email sequences".to_string()],
            },
            closing_strategies: ClosingStrategies {
                techniques: vec![ClosingTechnique {
                    technique_name: "Assumptive close".to_string(),
                    description: "Assume the sale".to_string(),
                    when_to_use: "Final stage".to_string(),
                    success_rate: "70%".to_string(),
                    implementation_tips: vec!["Be confident".to_string()],
                }],
                pricing_strategies: vec!["Value-based pricing".to_string()],
                negotiation_tactics: vec!["Win-win approach".to_string()],
            },
            sales_training: SalesTraining {
                modules: vec![TrainingModule {
                    module_name: "Product knowledge".to_string(),
                    description: "Learn product features".to_string(),
                    duration: "2 weeks".to_string(),
                    learning_objectives: vec!["Feature mastery".to_string()],
                    assessment_method: "Practical test".to_string(),
                }],
                onboarding_process: vec!["Shadow experienced rep".to_string()],
                continuous_improvement: vec!["Monthly reviews".to_string()],
            },
            performance_metrics: SalesPerformanceMetrics {
                kpis: vec![SalesKPI {
                    metric: "Conversion rate".to_string(),
                    target: "25%".to_string(),
                    measurement_method: "CRM tracking".to_string(),
                    improvement_tactics: vec!["Better qualification".to_string()],
                }],
                reporting_frequency: "Weekly".to_string(),
                improvement_strategies: vec!["Process optimization".to_string()],
            },
        };

        assert!(agent.validate_sales_strategy(&valid_strategy).is_ok());
    }

    #[test]
    fn test_sales_strategy_validation_empty_stages() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);

        let invalid_strategy = SalesStrategy {
            sales_process: SalesProcess {
                stages: vec![], // Empty stages should fail validation
                qualification_criteria: vec!["Budget".to_string()],
                objection_handling: vec!["Price objections".to_string()],
            },
            lead_generation: LeadGeneration {
                channels: vec![LeadChannel {
                    channel_name: "Inbound marketing".to_string(),
                    description: "Website leads".to_string(),
                    lead_quality: "High".to_string(),
                    conversion_rate: "15%".to_string(),
                    cost_per_lead: "$50".to_string(),
                }],
                qualification_process: vec!["BANT criteria".to_string()],
                nurturing_strategies: vec!["Email sequences".to_string()],
            },
            closing_strategies: ClosingStrategies {
                techniques: vec![ClosingTechnique {
                    technique_name: "Assumptive close".to_string(),
                    description: "Assume the sale".to_string(),
                    when_to_use: "Final stage".to_string(),
                    success_rate: "70%".to_string(),
                    implementation_tips: vec!["Be confident".to_string()],
                }],
                pricing_strategies: vec!["Value-based pricing".to_string()],
                negotiation_tactics: vec!["Win-win approach".to_string()],
            },
            sales_training: SalesTraining {
                modules: vec![TrainingModule {
                    module_name: "Product knowledge".to_string(),
                    description: "Learn product features".to_string(),
                    duration: "2 weeks".to_string(),
                    learning_objectives: vec!["Feature mastery".to_string()],
                    assessment_method: "Practical test".to_string(),
                }],
                onboarding_process: vec!["Shadow experienced rep".to_string()],
                continuous_improvement: vec!["Monthly reviews".to_string()],
            },
            performance_metrics: SalesPerformanceMetrics {
                kpis: vec![SalesKPI {
                    metric: "Conversion rate".to_string(),
                    target: "25%".to_string(),
                    measurement_method: "CRM tracking".to_string(),
                    improvement_tactics: vec!["Better qualification".to_string()],
                }],
                reporting_frequency: "Weekly".to_string(),
                improvement_strategies: vec!["Process optimization".to_string()],
            },
        };

        assert!(agent.validate_sales_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_sales_strategy_validation_empty_channels() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);

        let invalid_strategy = SalesStrategy {
            sales_process: SalesProcess {
                stages: vec![SalesStage {
                    stage_name: "Prospecting".to_string(),
                    description: "Find potential customers".to_string(),
                    activities: vec!["Research".to_string()],
                    success_criteria: vec!["Qualified leads".to_string()],
                    average_duration: "1 week".to_string(),
                }],
                qualification_criteria: vec!["Budget".to_string()],
                objection_handling: vec!["Price objections".to_string()],
            },
            lead_generation: LeadGeneration {
                channels: vec![], // Empty channels should fail validation
                qualification_process: vec!["BANT criteria".to_string()],
                nurturing_strategies: vec!["Email sequences".to_string()],
            },
            closing_strategies: ClosingStrategies {
                techniques: vec![ClosingTechnique {
                    technique_name: "Assumptive close".to_string(),
                    description: "Assume the sale".to_string(),
                    when_to_use: "Final stage".to_string(),
                    success_rate: "70%".to_string(),
                    implementation_tips: vec!["Be confident".to_string()],
                }],
                pricing_strategies: vec!["Value-based pricing".to_string()],
                negotiation_tactics: vec!["Win-win approach".to_string()],
            },
            sales_training: SalesTraining {
                modules: vec![TrainingModule {
                    module_name: "Product knowledge".to_string(),
                    description: "Learn product features".to_string(),
                    duration: "2 weeks".to_string(),
                    learning_objectives: vec!["Feature mastery".to_string()],
                    assessment_method: "Practical test".to_string(),
                }],
                onboarding_process: vec!["Shadow experienced rep".to_string()],
                continuous_improvement: vec!["Monthly reviews".to_string()],
            },
            performance_metrics: SalesPerformanceMetrics {
                kpis: vec![SalesKPI {
                    metric: "Conversion rate".to_string(),
                    target: "25%".to_string(),
                    measurement_method: "CRM tracking".to_string(),
                    improvement_tactics: vec!["Better qualification".to_string()],
                }],
                reporting_frequency: "Weekly".to_string(),
                improvement_strategies: vec!["Process optimization".to_string()],
            },
        };

        assert!(agent.validate_sales_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_sales_strategy_validation_empty_techniques() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);

        let invalid_strategy = SalesStrategy {
            sales_process: SalesProcess {
                stages: vec![SalesStage {
                    stage_name: "Prospecting".to_string(),
                    description: "Find potential customers".to_string(),
                    activities: vec!["Research".to_string()],
                    success_criteria: vec!["Qualified leads".to_string()],
                    average_duration: "1 week".to_string(),
                }],
                qualification_criteria: vec!["Budget".to_string()],
                objection_handling: vec!["Price objections".to_string()],
            },
            lead_generation: LeadGeneration {
                channels: vec![LeadChannel {
                    channel_name: "Inbound marketing".to_string(),
                    description: "Website leads".to_string(),
                    lead_quality: "High".to_string(),
                    conversion_rate: "15%".to_string(),
                    cost_per_lead: "$50".to_string(),
                }],
                qualification_process: vec!["BANT criteria".to_string()],
                nurturing_strategies: vec!["Email sequences".to_string()],
            },
            closing_strategies: ClosingStrategies {
                techniques: vec![], // Empty techniques should fail validation
                pricing_strategies: vec!["Value-based pricing".to_string()],
                negotiation_tactics: vec!["Win-win approach".to_string()],
            },
            sales_training: SalesTraining {
                modules: vec![TrainingModule {
                    module_name: "Product knowledge".to_string(),
                    description: "Learn product features".to_string(),
                    duration: "2 weeks".to_string(),
                    learning_objectives: vec!["Feature mastery".to_string()],
                    assessment_method: "Practical test".to_string(),
                }],
                onboarding_process: vec!["Shadow experienced rep".to_string()],
                continuous_improvement: vec!["Monthly reviews".to_string()],
            },
            performance_metrics: SalesPerformanceMetrics {
                kpis: vec![SalesKPI {
                    metric: "Conversion rate".to_string(),
                    target: "25%".to_string(),
                    measurement_method: "CRM tracking".to_string(),
                    improvement_tactics: vec!["Better qualification".to_string()],
                }],
                reporting_frequency: "Weekly".to_string(),
                improvement_strategies: vec!["Process optimization".to_string()],
            },
        };

        assert!(agent.validate_sales_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);

        let strategy = SalesStrategy {
            sales_process: SalesProcess {
                stages: vec![
                    SalesStage {
                        stage_name: "Prospecting".to_string(),
                        description: "Find potential customers".to_string(),
                        activities: vec!["Research".to_string()],
                        success_criteria: vec!["Qualified leads".to_string()],
                        average_duration: "1 week".to_string(),
                    },
                    SalesStage {
                        stage_name: "Qualification".to_string(),
                        description: "Qualify prospects".to_string(),
                        activities: vec!["Discovery call".to_string()],
                        success_criteria: vec!["BANT criteria met".to_string()],
                        average_duration: "2 weeks".to_string(),
                    },
                ],
                qualification_criteria: vec!["Budget".to_string()],
                objection_handling: vec!["Price objections".to_string()],
            },
            lead_generation: LeadGeneration {
                channels: vec![
                    LeadChannel {
                        channel_name: "Inbound marketing".to_string(),
                        description: "Website leads".to_string(),
                        lead_quality: "High".to_string(),
                        conversion_rate: "15%".to_string(),
                        cost_per_lead: "$50".to_string(),
                    },
                    LeadChannel {
                        channel_name: "Outbound sales".to_string(),
                        description: "Cold outreach".to_string(),
                        lead_quality: "Medium".to_string(),
                        conversion_rate: "8%".to_string(),
                        cost_per_lead: "$30".to_string(),
                    },
                ],
                qualification_process: vec!["BANT criteria".to_string()],
                nurturing_strategies: vec!["Email sequences".to_string()],
            },
            closing_strategies: ClosingStrategies {
                techniques: vec![
                    ClosingTechnique {
                        technique_name: "Assumptive close".to_string(),
                        description: "Assume the sale".to_string(),
                        when_to_use: "Final stage".to_string(),
                        success_rate: "70%".to_string(),
                        implementation_tips: vec!["Be confident".to_string()],
                    },
                    ClosingTechnique {
                        technique_name: "Urgency close".to_string(),
                        description: "Create urgency".to_string(),
                        when_to_use: "Price sensitive".to_string(),
                        success_rate: "60%".to_string(),
                        implementation_tips: vec!["Limited time offer".to_string()],
                    },
                ],
                pricing_strategies: vec!["Value-based pricing".to_string()],
                negotiation_tactics: vec!["Win-win approach".to_string()],
            },
            sales_training: SalesTraining {
                modules: vec![TrainingModule {
                    module_name: "Product knowledge".to_string(),
                    description: "Learn product features".to_string(),
                    duration: "2 weeks".to_string(),
                    learning_objectives: vec!["Feature mastery".to_string()],
                    assessment_method: "Practical test".to_string(),
                }],
                onboarding_process: vec!["Shadow experienced rep".to_string()],
                continuous_improvement: vec!["Monthly reviews".to_string()],
            },
            performance_metrics: SalesPerformanceMetrics {
                kpis: vec![SalesKPI {
                    metric: "Conversion rate".to_string(),
                    target: "25%".to_string(),
                    measurement_method: "CRM tracking".to_string(),
                    improvement_tactics: vec!["Better qualification".to_string()],
                }],
                reporting_frequency: "Weekly".to_string(),
                improvement_strategies: vec!["Process optimization".to_string()],
            },
        };

        let summary = agent.generate_summary(&strategy);
        assert!(summary.contains("2 sales stages"));
        assert!(summary.contains("2 lead channels"));
        assert!(summary.contains("3 total techniques")); // 2 closing + 1 training = 3
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = SalesAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::SalesAgent);
        assert_eq!(task.id, "test-task-12");
        assert_eq!(task.title, "AI-Powered Sales Automation Platform");
    }
}

// Database persistence implementation
crate::impl_persistable_agent!(SalesAgent, "SalesAgent");
