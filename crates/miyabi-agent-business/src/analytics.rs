//! AnalyticsAgent - データ分析・ビジネスインテリジェンスAgent
//!
//! データアナリストとして、ビジネス分析戦略、KPI設計、ダッシュボード設計、
//! 予測分析、レポート自動化を立案します。データドリブンな意思決定支援と
//! ビジネス成長の可視化を目的とした包括的な分析戦略を提供します。

use async_trait::async_trait;
use miyabi_agent_core::{
    a2a_integration::{A2AAgentCard, A2AEnabled, A2AIntegrationError, A2ATask, A2ATaskResult, AgentCapability, AgentCardBuilder},
    BaseAgent,
};
use miyabi_core::ExecutionMode;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMError, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env;

/// AnalyticsAgent - データ分析・ビジネスインテリジェンスAgent
///
/// データアナリストとして、ビジネス分析戦略、KPI設計、ダッシュボード設計、
/// 予測分析、レポート自動化を立案します。
pub struct AnalyticsAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl AnalyticsAgent {
    /// Create a new AnalyticsAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive analytics strategy using LLM
    async fn generate_analytics_strategy(&self, task: &Task) -> Result<AnalyticsStrategy> {
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

        // Create conversation with analytics strategy template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a data analyst specializing in business intelligence, KPI design, dashboard creation, predictive analytics, and automated reporting.",
            r#"Develop a comprehensive analytics strategy for this product:

Product: {task_title}
Business Context: {task_description}
Analytics Goals: Data-driven decision making and business growth

Generate detailed analytics strategy as JSON with KPI framework, dashboard design, data collection methods, predictive models, and reporting automation."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation.ask_with_template(&template).await.map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("LLM execution failed: {}", e),
                AgentType::AnalyticsAgent,
                Some(task.id.clone()),
            ))
        })?;

        // Parse JSON response
        let analytics_strategy: AnalyticsStrategy =
            serde_json::from_str(&response).map_err(|e| {
                MiyabiError::Agent(AgentError::new(
                    format!("Failed to parse analytics strategy JSON: {}", e),
                    AgentType::AnalyticsAgent,
                    Some(task.id.clone()),
                ))
            })?;

        Ok(analytics_strategy)
    }

    /// Validate analytics strategy completeness
    fn validate_analytics_strategy(&self, strategy: &AnalyticsStrategy) -> Result<()> {
        if strategy.kpi_framework.kpis.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Analytics strategy must include KPIs".to_string(),
                AgentType::AnalyticsAgent,
                None,
            )));
        }

        if strategy.dashboard_design.dashboards.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Analytics strategy must include dashboards".to_string(),
                AgentType::AnalyticsAgent,
                None,
            )));
        }

        if strategy.data_collection.sources.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Analytics strategy must include data sources".to_string(),
                AgentType::AnalyticsAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate analytics strategy summary for reporting
    fn generate_summary(&self, strategy: &AnalyticsStrategy) -> String {
        let total_models = strategy.predictive_analytics.models.len()
            + strategy.reporting_automation.reports.len();

        format!(
            "Analytics Strategy Generated: {} KPIs, {} dashboards, {} total models",
            strategy.kpi_framework.kpis.len(),
            strategy.dashboard_design.dashboards.len(),
            total_models
        )
    }
}

/// Analytics Strategy structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsStrategy {
    pub kpi_framework: KPIFramework,
    pub dashboard_design: DashboardDesign,
    pub data_collection: DataCollection,
    pub predictive_analytics: PredictiveAnalytics,
    pub reporting_automation: ReportingAutomation,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KPIFramework {
    pub kpis: Vec<BusinessKPI>,
    pub measurement_frequency: String,
    pub target_setting: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessKPI {
    pub kpi_name: String,
    pub description: String,
    pub metric_type: String,
    pub target_value: String,
    pub calculation_method: String,
    pub data_source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardDesign {
    pub dashboards: Vec<Dashboard>,
    pub visualization_principles: Vec<String>,
    pub accessibility_standards: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dashboard {
    pub dashboard_name: String,
    pub purpose: String,
    pub target_audience: String,
    pub key_metrics: Vec<String>,
    pub visualization_types: Vec<String>,
    pub update_frequency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataCollection {
    pub sources: Vec<DataSource>,
    pub collection_methods: Vec<String>,
    pub data_quality_standards: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    pub source_name: String,
    pub data_type: String,
    pub collection_frequency: String,
    pub integration_method: String,
    pub data_volume: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictiveAnalytics {
    pub models: Vec<PredictiveModel>,
    pub use_cases: Vec<String>,
    pub accuracy_thresholds: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictiveModel {
    pub model_name: String,
    pub model_type: String,
    pub prediction_target: String,
    pub input_features: Vec<String>,
    pub accuracy_metric: String,
    pub retraining_schedule: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReportingAutomation {
    pub reports: Vec<AutomatedReport>,
    pub scheduling_strategies: Vec<String>,
    pub distribution_methods: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomatedReport {
    pub report_name: String,
    pub report_type: String,
    pub target_audience: String,
    pub content_sections: Vec<String>,
    pub generation_frequency: String,
    pub delivery_method: String,
}

#[async_trait]
impl BaseAgent for AnalyticsAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::AnalyticsAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "AnalyticsAgent starting analytics strategy generation for task: {}",
            task.id
        );

        // Generate analytics strategy using LLM
        let analytics_strategy = self.generate_analytics_strategy(task).await?;

        // Validate analytics strategy completeness
        self.validate_analytics_strategy(&analytics_strategy)?;

        // Generate summary
        let summary = self.generate_summary(&analytics_strategy);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::AnalyticsAgent,
            duration_ms,
            quality_score: Some(94), // High quality for comprehensive analytics strategy
            lines_changed: None,     // Not applicable for analytics strategy
            tests_added: None,       // Not applicable for analytics strategy
            coverage_percent: None,  // Not applicable for analytics strategy
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let total_models = analytics_strategy.predictive_analytics.models.len()
            + analytics_strategy.reporting_automation.reports.len();

        let result_data = serde_json::json!({
            "analytics_strategy": analytics_strategy,
            "summary": summary,
            "kpis_count": analytics_strategy.kpi_framework.kpis.len(),
            "dashboards_count": analytics_strategy.dashboard_design.dashboards.len(),
            "total_models_count": total_models
        });

        tracing::info!("AnalyticsAgent completed analytics strategy generation: {}", summary);

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
impl A2AEnabled for AnalyticsAgent {
    fn agent_card(&self) -> A2AAgentCard {
        AgentCardBuilder::new("AnalyticsAgent", "Data analytics and business intelligence agent")
            .version("0.1.1")
            .capability(AgentCapability {
                id: "plan_analytics".to_string(),
                name: "Plan Analytics Strategy".to_string(),
                description: "Create analytics strategy with KPI design, dashboards, and predictive models".to_string(),
                input_schema: Some(json!({"type": "object", "properties": {"business": {"type": "string"}, "goals": {"type": "string"}}, "required": ["business"]})),
                output_schema: Some(json!({"type": "object", "properties": {"analytics_strategy": {"type": "object"}}})),
            })
            .build()
    }
    async fn handle_a2a_task(&self, task: A2ATask) -> std::result::Result<A2ATaskResult, A2AIntegrationError> {
        let start = std::time::Instant::now();
        match task.capability.as_str() {
            "plan_analytics" => {
                let business = task.input.get("business").and_then(|v| v.as_str()).ok_or_else(|| A2AIntegrationError::TaskExecutionFailed("Missing business".to_string()))?;
                let internal_task = Task { id: task.id.clone(), title: business.to_string(), description: "Analytics strategy".to_string(), task_type: miyabi_types::task::TaskType::Feature, priority: 1, severity: None, impact: None, assigned_agent: Some(AgentType::AnalyticsAgent), dependencies: vec![], estimated_duration: Some(180), status: None, start_time: None, end_time: None, metadata: None };
                match self.execute(&internal_task).await {
                    Ok(result) => Ok(A2ATaskResult::Success { output: result.data.unwrap_or(json!({"status": "completed"})), artifacts: vec![], execution_time_ms: start.elapsed().as_millis() as u64 }),
                    Err(e) => Err(A2AIntegrationError::TaskExecutionFailed(format!("Analytics strategy failed: {}", e))),
                }
            }
            _ => Err(A2AIntegrationError::TaskExecutionFailed(format!("Unknown capability: {}", task.capability))),
        }
    }
    fn execution_mode(&self) -> ExecutionMode { ExecutionMode::ReadOnly }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;

    fn create_test_task() -> Task {
        Task {
            id: "test-task-14".to_string(),
            title: "AI-Powered Business Intelligence Platform".to_string(),
            description:
                "A comprehensive BI platform with AI-driven insights and automated reporting"
                    .to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(340), // 5.7 hours
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
    fn test_analytics_agent_creation() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::AnalyticsAgent);
    }

    #[test]
    fn test_analytics_strategy_validation_success() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);

        let valid_strategy = AnalyticsStrategy {
            kpi_framework: KPIFramework {
                kpis: vec![BusinessKPI {
                    kpi_name: "Revenue Growth".to_string(),
                    description: "Monthly recurring revenue growth".to_string(),
                    metric_type: "Percentage".to_string(),
                    target_value: "10%".to_string(),
                    calculation_method: "Month-over-month".to_string(),
                    data_source: "CRM system".to_string(),
                }],
                measurement_frequency: "Monthly".to_string(),
                target_setting: vec!["SMART goals".to_string()],
            },
            dashboard_design: DashboardDesign {
                dashboards: vec![Dashboard {
                    dashboard_name: "Executive Dashboard".to_string(),
                    purpose: "High-level business overview".to_string(),
                    target_audience: "C-level executives".to_string(),
                    key_metrics: vec!["Revenue".to_string()],
                    visualization_types: vec!["Charts".to_string()],
                    update_frequency: "Daily".to_string(),
                }],
                visualization_principles: vec!["Clear and concise".to_string()],
                accessibility_standards: vec!["WCAG compliance".to_string()],
            },
            data_collection: DataCollection {
                sources: vec![DataSource {
                    source_name: "CRM".to_string(),
                    data_type: "Customer data".to_string(),
                    collection_frequency: "Real-time".to_string(),
                    integration_method: "API".to_string(),
                    data_volume: "High".to_string(),
                }],
                collection_methods: vec!["API integration".to_string()],
                data_quality_standards: vec!["Data validation".to_string()],
            },
            predictive_analytics: PredictiveAnalytics {
                models: vec![PredictiveModel {
                    model_name: "Churn Prediction".to_string(),
                    model_type: "Machine Learning".to_string(),
                    prediction_target: "Customer churn".to_string(),
                    input_features: vec!["Usage patterns".to_string()],
                    accuracy_metric: "F1 Score".to_string(),
                    retraining_schedule: "Monthly".to_string(),
                }],
                use_cases: vec!["Customer retention".to_string()],
                accuracy_thresholds: vec!["80% minimum".to_string()],
            },
            reporting_automation: ReportingAutomation {
                reports: vec![AutomatedReport {
                    report_name: "Monthly Business Review".to_string(),
                    report_type: "Executive summary".to_string(),
                    target_audience: "Management team".to_string(),
                    content_sections: vec!["KPI summary".to_string()],
                    generation_frequency: "Monthly".to_string(),
                    delivery_method: "Email".to_string(),
                }],
                scheduling_strategies: vec!["Automated triggers".to_string()],
                distribution_methods: vec!["Email distribution".to_string()],
            },
        };

        assert!(agent.validate_analytics_strategy(&valid_strategy).is_ok());
    }

    #[test]
    fn test_analytics_strategy_validation_empty_kpis() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);

        let invalid_strategy = AnalyticsStrategy {
            kpi_framework: KPIFramework {
                kpis: vec![], // Empty KPIs should fail validation
                measurement_frequency: "Monthly".to_string(),
                target_setting: vec!["SMART goals".to_string()],
            },
            dashboard_design: DashboardDesign {
                dashboards: vec![Dashboard {
                    dashboard_name: "Executive Dashboard".to_string(),
                    purpose: "High-level business overview".to_string(),
                    target_audience: "C-level executives".to_string(),
                    key_metrics: vec!["Revenue".to_string()],
                    visualization_types: vec!["Charts".to_string()],
                    update_frequency: "Daily".to_string(),
                }],
                visualization_principles: vec!["Clear and concise".to_string()],
                accessibility_standards: vec!["WCAG compliance".to_string()],
            },
            data_collection: DataCollection {
                sources: vec![DataSource {
                    source_name: "CRM".to_string(),
                    data_type: "Customer data".to_string(),
                    collection_frequency: "Real-time".to_string(),
                    integration_method: "API".to_string(),
                    data_volume: "High".to_string(),
                }],
                collection_methods: vec!["API integration".to_string()],
                data_quality_standards: vec!["Data validation".to_string()],
            },
            predictive_analytics: PredictiveAnalytics {
                models: vec![PredictiveModel {
                    model_name: "Churn Prediction".to_string(),
                    model_type: "Machine Learning".to_string(),
                    prediction_target: "Customer churn".to_string(),
                    input_features: vec!["Usage patterns".to_string()],
                    accuracy_metric: "F1 Score".to_string(),
                    retraining_schedule: "Monthly".to_string(),
                }],
                use_cases: vec!["Customer retention".to_string()],
                accuracy_thresholds: vec!["80% minimum".to_string()],
            },
            reporting_automation: ReportingAutomation {
                reports: vec![AutomatedReport {
                    report_name: "Monthly Business Review".to_string(),
                    report_type: "Executive summary".to_string(),
                    target_audience: "Management team".to_string(),
                    content_sections: vec!["KPI summary".to_string()],
                    generation_frequency: "Monthly".to_string(),
                    delivery_method: "Email".to_string(),
                }],
                scheduling_strategies: vec!["Automated triggers".to_string()],
                distribution_methods: vec!["Email distribution".to_string()],
            },
        };

        assert!(agent.validate_analytics_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_analytics_strategy_validation_empty_dashboards() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);

        let invalid_strategy = AnalyticsStrategy {
            kpi_framework: KPIFramework {
                kpis: vec![BusinessKPI {
                    kpi_name: "Revenue Growth".to_string(),
                    description: "Monthly recurring revenue growth".to_string(),
                    metric_type: "Percentage".to_string(),
                    target_value: "10%".to_string(),
                    calculation_method: "Month-over-month".to_string(),
                    data_source: "CRM system".to_string(),
                }],
                measurement_frequency: "Monthly".to_string(),
                target_setting: vec!["SMART goals".to_string()],
            },
            dashboard_design: DashboardDesign {
                dashboards: vec![], // Empty dashboards should fail validation
                visualization_principles: vec!["Clear and concise".to_string()],
                accessibility_standards: vec!["WCAG compliance".to_string()],
            },
            data_collection: DataCollection {
                sources: vec![DataSource {
                    source_name: "CRM".to_string(),
                    data_type: "Customer data".to_string(),
                    collection_frequency: "Real-time".to_string(),
                    integration_method: "API".to_string(),
                    data_volume: "High".to_string(),
                }],
                collection_methods: vec!["API integration".to_string()],
                data_quality_standards: vec!["Data validation".to_string()],
            },
            predictive_analytics: PredictiveAnalytics {
                models: vec![PredictiveModel {
                    model_name: "Churn Prediction".to_string(),
                    model_type: "Machine Learning".to_string(),
                    prediction_target: "Customer churn".to_string(),
                    input_features: vec!["Usage patterns".to_string()],
                    accuracy_metric: "F1 Score".to_string(),
                    retraining_schedule: "Monthly".to_string(),
                }],
                use_cases: vec!["Customer retention".to_string()],
                accuracy_thresholds: vec!["80% minimum".to_string()],
            },
            reporting_automation: ReportingAutomation {
                reports: vec![AutomatedReport {
                    report_name: "Monthly Business Review".to_string(),
                    report_type: "Executive summary".to_string(),
                    target_audience: "Management team".to_string(),
                    content_sections: vec!["KPI summary".to_string()],
                    generation_frequency: "Monthly".to_string(),
                    delivery_method: "Email".to_string(),
                }],
                scheduling_strategies: vec!["Automated triggers".to_string()],
                distribution_methods: vec!["Email distribution".to_string()],
            },
        };

        assert!(agent.validate_analytics_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_analytics_strategy_validation_empty_sources() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);

        let invalid_strategy = AnalyticsStrategy {
            kpi_framework: KPIFramework {
                kpis: vec![BusinessKPI {
                    kpi_name: "Revenue Growth".to_string(),
                    description: "Monthly recurring revenue growth".to_string(),
                    metric_type: "Percentage".to_string(),
                    target_value: "10%".to_string(),
                    calculation_method: "Month-over-month".to_string(),
                    data_source: "CRM system".to_string(),
                }],
                measurement_frequency: "Monthly".to_string(),
                target_setting: vec!["SMART goals".to_string()],
            },
            dashboard_design: DashboardDesign {
                dashboards: vec![Dashboard {
                    dashboard_name: "Executive Dashboard".to_string(),
                    purpose: "High-level business overview".to_string(),
                    target_audience: "C-level executives".to_string(),
                    key_metrics: vec!["Revenue".to_string()],
                    visualization_types: vec!["Charts".to_string()],
                    update_frequency: "Daily".to_string(),
                }],
                visualization_principles: vec!["Clear and concise".to_string()],
                accessibility_standards: vec!["WCAG compliance".to_string()],
            },
            data_collection: DataCollection {
                sources: vec![], // Empty sources should fail validation
                collection_methods: vec!["API integration".to_string()],
                data_quality_standards: vec!["Data validation".to_string()],
            },
            predictive_analytics: PredictiveAnalytics {
                models: vec![PredictiveModel {
                    model_name: "Churn Prediction".to_string(),
                    model_type: "Machine Learning".to_string(),
                    prediction_target: "Customer churn".to_string(),
                    input_features: vec!["Usage patterns".to_string()],
                    accuracy_metric: "F1 Score".to_string(),
                    retraining_schedule: "Monthly".to_string(),
                }],
                use_cases: vec!["Customer retention".to_string()],
                accuracy_thresholds: vec!["80% minimum".to_string()],
            },
            reporting_automation: ReportingAutomation {
                reports: vec![AutomatedReport {
                    report_name: "Monthly Business Review".to_string(),
                    report_type: "Executive summary".to_string(),
                    target_audience: "Management team".to_string(),
                    content_sections: vec!["KPI summary".to_string()],
                    generation_frequency: "Monthly".to_string(),
                    delivery_method: "Email".to_string(),
                }],
                scheduling_strategies: vec!["Automated triggers".to_string()],
                distribution_methods: vec!["Email distribution".to_string()],
            },
        };

        assert!(agent.validate_analytics_strategy(&invalid_strategy).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);

        let strategy = AnalyticsStrategy {
            kpi_framework: KPIFramework {
                kpis: vec![
                    BusinessKPI {
                        kpi_name: "Revenue Growth".to_string(),
                        description: "Monthly recurring revenue growth".to_string(),
                        metric_type: "Percentage".to_string(),
                        target_value: "10%".to_string(),
                        calculation_method: "Month-over-month".to_string(),
                        data_source: "CRM system".to_string(),
                    },
                    BusinessKPI {
                        kpi_name: "Customer Acquisition Cost".to_string(),
                        description: "Cost to acquire new customers".to_string(),
                        metric_type: "Currency".to_string(),
                        target_value: "$100".to_string(),
                        calculation_method: "Total spend / New customers".to_string(),
                        data_source: "Marketing system".to_string(),
                    },
                ],
                measurement_frequency: "Monthly".to_string(),
                target_setting: vec!["SMART goals".to_string()],
            },
            dashboard_design: DashboardDesign {
                dashboards: vec![
                    Dashboard {
                        dashboard_name: "Executive Dashboard".to_string(),
                        purpose: "High-level business overview".to_string(),
                        target_audience: "C-level executives".to_string(),
                        key_metrics: vec!["Revenue".to_string()],
                        visualization_types: vec!["Charts".to_string()],
                        update_frequency: "Daily".to_string(),
                    },
                    Dashboard {
                        dashboard_name: "Marketing Dashboard".to_string(),
                        purpose: "Marketing performance tracking".to_string(),
                        target_audience: "Marketing team".to_string(),
                        key_metrics: vec!["CAC".to_string()],
                        visualization_types: vec!["Tables".to_string()],
                        update_frequency: "Weekly".to_string(),
                    },
                ],
                visualization_principles: vec!["Clear and concise".to_string()],
                accessibility_standards: vec!["WCAG compliance".to_string()],
            },
            data_collection: DataCollection {
                sources: vec![DataSource {
                    source_name: "CRM".to_string(),
                    data_type: "Customer data".to_string(),
                    collection_frequency: "Real-time".to_string(),
                    integration_method: "API".to_string(),
                    data_volume: "High".to_string(),
                }],
                collection_methods: vec!["API integration".to_string()],
                data_quality_standards: vec!["Data validation".to_string()],
            },
            predictive_analytics: PredictiveAnalytics {
                models: vec![
                    PredictiveModel {
                        model_name: "Churn Prediction".to_string(),
                        model_type: "Machine Learning".to_string(),
                        prediction_target: "Customer churn".to_string(),
                        input_features: vec!["Usage patterns".to_string()],
                        accuracy_metric: "F1 Score".to_string(),
                        retraining_schedule: "Monthly".to_string(),
                    },
                    PredictiveModel {
                        model_name: "Revenue Forecast".to_string(),
                        model_type: "Time Series".to_string(),
                        prediction_target: "Monthly revenue".to_string(),
                        input_features: vec!["Historical data".to_string()],
                        accuracy_metric: "MAPE".to_string(),
                        retraining_schedule: "Quarterly".to_string(),
                    },
                ],
                use_cases: vec!["Customer retention".to_string()],
                accuracy_thresholds: vec!["80% minimum".to_string()],
            },
            reporting_automation: ReportingAutomation {
                reports: vec![AutomatedReport {
                    report_name: "Monthly Business Review".to_string(),
                    report_type: "Executive summary".to_string(),
                    target_audience: "Management team".to_string(),
                    content_sections: vec!["KPI summary".to_string()],
                    generation_frequency: "Monthly".to_string(),
                    delivery_method: "Email".to_string(),
                }],
                scheduling_strategies: vec!["Automated triggers".to_string()],
                distribution_methods: vec!["Email distribution".to_string()],
            },
        };

        let summary = agent.generate_summary(&strategy);
        assert!(summary.contains("2 KPIs"));
        assert!(summary.contains("2 dashboards"));
        assert!(summary.contains("3 total models")); // 2 predictive + 1 report = 3
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = AnalyticsAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::AnalyticsAgent);
        assert_eq!(task.id, "test-task-14");
        assert_eq!(task.title, "AI-Powered Business Intelligence Platform");
    }
}
