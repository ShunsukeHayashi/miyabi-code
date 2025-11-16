//! ProductConceptAgent - プロダクトコンセプト定義Agent
//!
//! MVP設計、プロダクト・マーケット・フィット、リーンスタートアップ手法に特化した
//! プロダクト戦略立案を支援します。ビジネスモデルキャンバスからMVP機能定義まで
//! 一貫したプロダクトコンセプトを構築します。

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMContext, LLMConversation, LLMError, LLMPromptTemplate};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde::{Deserialize, Serialize};
use std::env;

/// ProductConceptAgent - MVP設計・プロダクト戦略立案Agent
///
/// プロダクト戦略家として、MVP設計、プロダクト・マーケット・フィット、
/// リーンスタートアップ手法に基づいたプロダクトコンセプトを生成します。
pub struct ProductConceptAgent {
    #[allow(dead_code)]
    config: AgentConfig,
}

impl ProductConceptAgent {
    /// Create a new ProductConceptAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate comprehensive product concept using LLM
    async fn generate_product_concept(&self, task: &Task) -> Result<ProductConcept> {
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

        // Create conversation with product concept template
        let mut conversation = LLMConversation::new(Box::new(provider), context);
        let template = LLMPromptTemplate::new(
            "You are a product strategist specializing in MVP design, product-market fit, and lean startup methodology.",
            r#"Define the product concept for this business idea:

Business Idea: {task_title}
Target Market: {task_description}
Problem Statement: Identify the core problem this product solves

Create a comprehensive product concept as JSON with value proposition, target customers, problem-solution fit, business model canvas, MVP features, success metrics, and go-to-market strategy."#,
            miyabi_llm::prompt::ResponseFormat::Json { schema: None },
        );

        // Execute LLM conversation
        let response = conversation.ask_with_template(&template).await.map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("LLM execution failed: {}", e),
                AgentType::ProductConceptAgent,
                Some(task.id.clone()),
            ))
        })?;

        // Parse JSON response
        let product_concept: ProductConcept = serde_json::from_str(&response).map_err(|e| {
            MiyabiError::Agent(AgentError::new(
                format!("Failed to parse product concept JSON: {}", e),
                AgentType::ProductConceptAgent,
                Some(task.id.clone()),
            ))
        })?;

        Ok(product_concept)
    }

    /// Validate product concept completeness
    fn validate_product_concept(&self, concept: &ProductConcept) -> Result<()> {
        if concept.value_proposition.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Product concept must include value proposition".to_string(),
                AgentType::ProductConceptAgent,
                None,
            )));
        }

        if concept.mvp_features.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Product concept must include MVP features".to_string(),
                AgentType::ProductConceptAgent,
                None,
            )));
        }

        if concept.success_metrics.is_empty() {
            return Err(MiyabiError::Agent(AgentError::new(
                "Product concept must include success metrics".to_string(),
                AgentType::ProductConceptAgent,
                None,
            )));
        }

        Ok(())
    }

    /// Generate product concept summary for reporting
    fn generate_summary(&self, concept: &ProductConcept) -> String {
        format!(
            "Product Concept Generated: {} MVP features, {} success metrics, {} target segments",
            concept.mvp_features.len(),
            concept.success_metrics.len(),
            if concept.target_customers.secondary.is_some() {
                2
            } else {
                1
            }
        )
    }
}

/// Product Concept structure matching LLM template output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProductConcept {
    pub value_proposition: String,
    pub target_customers: TargetCustomers,
    pub problem_solution_fit: String,
    pub business_model_canvas: BusinessModelCanvas,
    pub mvp_features: Vec<MVPFeature>,
    pub success_metrics: Vec<SuccessMetric>,
    pub go_to_market_strategy: GoToMarketStrategy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetCustomers {
    pub primary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secondary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessModelCanvas {
    pub key_partners: Vec<String>,
    pub key_activities: Vec<String>,
    pub key_resources: Vec<String>,
    pub value_propositions: Vec<String>,
    pub customer_relationships: Vec<String>,
    pub channels: Vec<String>,
    pub customer_segments: Vec<String>,
    pub cost_structure: Vec<String>,
    pub revenue_streams: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MVPFeature {
    pub feature: String,
    pub priority: String,
    pub effort: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuccessMetric {
    pub metric: String,
    pub target: String,
    pub timeline: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoToMarketStrategy {
    pub channels: Vec<String>,
    pub pricing_strategy: String,
    pub launch_plan: String,
}

#[async_trait]
impl BaseAgent for ProductConceptAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::ProductConceptAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        tracing::info!(
            "ProductConceptAgent starting product concept generation for task: {}",
            task.id
        );

        // Generate product concept using LLM
        let product_concept = self.generate_product_concept(task).await?;

        // Validate product concept completeness
        self.validate_product_concept(&product_concept)?;

        // Generate summary
        let summary = self.generate_summary(&product_concept);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = miyabi_types::agent::AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::ProductConceptAgent,
            duration_ms,
            quality_score: Some(90), // High quality for comprehensive product concept
            lines_changed: None,     // Not applicable for product concept
            tests_added: None,       // Not applicable for product concept
            coverage_percent: None,  // Not applicable for product concept
            errors_found: None,
            timestamp: end_time,
        };

        // Create result data
        let result_data = serde_json::json!({
            "product_concept": product_concept,
            "summary": summary,
            "mvp_features_count": product_concept.mvp_features.len(),
            "success_metrics_count": product_concept.success_metrics.len(),
            "target_segments_count": if product_concept.target_customers.secondary.is_some() { 2 } else { 1 }
        });

        tracing::info!("ProductConceptAgent completed product concept generation: {}", summary);

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
            id: "test-task-2".to_string(),
            title: "AI-Powered Task Management Platform".to_string(),
            description: "A comprehensive task management solution with AI-driven prioritization and automation".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(90), // 1.5 hours
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
    fn test_product_concept_agent_creation() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::ProductConceptAgent);
    }

    #[test]
    fn test_product_concept_validation_success() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);

        let valid_concept = ProductConcept {
            value_proposition: "Clear value proposition".to_string(),
            target_customers: TargetCustomers {
                primary: "Primary segment".to_string(),
                secondary: Some("Secondary segment".to_string()),
            },
            problem_solution_fit: "Solves the problem".to_string(),
            business_model_canvas: BusinessModelCanvas {
                key_partners: vec!["Partner 1".to_string()],
                key_activities: vec!["Activity 1".to_string()],
                key_resources: vec!["Resource 1".to_string()],
                value_propositions: vec!["Value 1".to_string()],
                customer_relationships: vec!["Relationship 1".to_string()],
                channels: vec!["Channel 1".to_string()],
                customer_segments: vec!["Segment 1".to_string()],
                cost_structure: vec!["Cost 1".to_string()],
                revenue_streams: vec!["Revenue 1".to_string()],
            },
            mvp_features: vec![MVPFeature {
                feature: "Feature 1".to_string(),
                priority: "high".to_string(),
                effort: "medium".to_string(),
                value: "high".to_string(),
            }],
            success_metrics: vec![SuccessMetric {
                metric: "User acquisition".to_string(),
                target: "1000 users".to_string(),
                timeline: "3 months".to_string(),
            }],
            go_to_market_strategy: GoToMarketStrategy {
                channels: vec!["Channel 1".to_string()],
                pricing_strategy: "Freemium".to_string(),
                launch_plan: "Beta launch".to_string(),
            },
        };

        assert!(agent.validate_product_concept(&valid_concept).is_ok());
    }

    #[test]
    fn test_product_concept_validation_empty_value_proposition() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);

        let invalid_concept = ProductConcept {
            value_proposition: "".to_string(), // Empty value proposition should fail validation
            target_customers: TargetCustomers {
                primary: "Primary segment".to_string(),
                secondary: None,
            },
            problem_solution_fit: "Solves the problem".to_string(),
            business_model_canvas: BusinessModelCanvas {
                key_partners: vec!["Partner 1".to_string()],
                key_activities: vec!["Activity 1".to_string()],
                key_resources: vec!["Resource 1".to_string()],
                value_propositions: vec!["Value 1".to_string()],
                customer_relationships: vec!["Relationship 1".to_string()],
                channels: vec!["Channel 1".to_string()],
                customer_segments: vec!["Segment 1".to_string()],
                cost_structure: vec!["Cost 1".to_string()],
                revenue_streams: vec!["Revenue 1".to_string()],
            },
            mvp_features: vec![MVPFeature {
                feature: "Feature 1".to_string(),
                priority: "high".to_string(),
                effort: "medium".to_string(),
                value: "high".to_string(),
            }],
            success_metrics: vec![SuccessMetric {
                metric: "User acquisition".to_string(),
                target: "1000 users".to_string(),
                timeline: "3 months".to_string(),
            }],
            go_to_market_strategy: GoToMarketStrategy {
                channels: vec!["Channel 1".to_string()],
                pricing_strategy: "Freemium".to_string(),
                launch_plan: "Beta launch".to_string(),
            },
        };

        assert!(agent.validate_product_concept(&invalid_concept).is_err());
    }

    #[test]
    fn test_product_concept_validation_empty_mvp_features() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);

        let invalid_concept = ProductConcept {
            value_proposition: "Clear value proposition".to_string(),
            target_customers: TargetCustomers {
                primary: "Primary segment".to_string(),
                secondary: None,
            },
            problem_solution_fit: "Solves the problem".to_string(),
            business_model_canvas: BusinessModelCanvas {
                key_partners: vec!["Partner 1".to_string()],
                key_activities: vec!["Activity 1".to_string()],
                key_resources: vec!["Resource 1".to_string()],
                value_propositions: vec!["Value 1".to_string()],
                customer_relationships: vec!["Relationship 1".to_string()],
                channels: vec!["Channel 1".to_string()],
                customer_segments: vec!["Segment 1".to_string()],
                cost_structure: vec!["Cost 1".to_string()],
                revenue_streams: vec!["Revenue 1".to_string()],
            },
            mvp_features: vec![], // Empty MVP features should fail validation
            success_metrics: vec![SuccessMetric {
                metric: "User acquisition".to_string(),
                target: "1000 users".to_string(),
                timeline: "3 months".to_string(),
            }],
            go_to_market_strategy: GoToMarketStrategy {
                channels: vec!["Channel 1".to_string()],
                pricing_strategy: "Freemium".to_string(),
                launch_plan: "Beta launch".to_string(),
            },
        };

        assert!(agent.validate_product_concept(&invalid_concept).is_err());
    }

    #[test]
    fn test_product_concept_validation_empty_success_metrics() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);

        let invalid_concept = ProductConcept {
            value_proposition: "Clear value proposition".to_string(),
            target_customers: TargetCustomers {
                primary: "Primary segment".to_string(),
                secondary: None,
            },
            problem_solution_fit: "Solves the problem".to_string(),
            business_model_canvas: BusinessModelCanvas {
                key_partners: vec!["Partner 1".to_string()],
                key_activities: vec!["Activity 1".to_string()],
                key_resources: vec!["Resource 1".to_string()],
                value_propositions: vec!["Value 1".to_string()],
                customer_relationships: vec!["Relationship 1".to_string()],
                channels: vec!["Channel 1".to_string()],
                customer_segments: vec!["Segment 1".to_string()],
                cost_structure: vec!["Cost 1".to_string()],
                revenue_streams: vec!["Revenue 1".to_string()],
            },
            mvp_features: vec![MVPFeature {
                feature: "Feature 1".to_string(),
                priority: "high".to_string(),
                effort: "medium".to_string(),
                value: "high".to_string(),
            }],
            success_metrics: vec![], // Empty success metrics should fail validation
            go_to_market_strategy: GoToMarketStrategy {
                channels: vec!["Channel 1".to_string()],
                pricing_strategy: "Freemium".to_string(),
                launch_plan: "Beta launch".to_string(),
            },
        };

        assert!(agent.validate_product_concept(&invalid_concept).is_err());
    }

    #[test]
    fn test_generate_summary() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);

        let concept = ProductConcept {
            value_proposition: "Clear value proposition".to_string(),
            target_customers: TargetCustomers {
                primary: "Primary segment".to_string(),
                secondary: Some("Secondary segment".to_string()),
            },
            problem_solution_fit: "Solves the problem".to_string(),
            business_model_canvas: BusinessModelCanvas {
                key_partners: vec!["Partner 1".to_string()],
                key_activities: vec!["Activity 1".to_string()],
                key_resources: vec!["Resource 1".to_string()],
                value_propositions: vec!["Value 1".to_string()],
                customer_relationships: vec!["Relationship 1".to_string()],
                channels: vec!["Channel 1".to_string()],
                customer_segments: vec!["Segment 1".to_string()],
                cost_structure: vec!["Cost 1".to_string()],
                revenue_streams: vec!["Revenue 1".to_string()],
            },
            mvp_features: vec![
                MVPFeature {
                    feature: "Feature 1".to_string(),
                    priority: "high".to_string(),
                    effort: "medium".to_string(),
                    value: "high".to_string(),
                },
                MVPFeature {
                    feature: "Feature 2".to_string(),
                    priority: "medium".to_string(),
                    effort: "low".to_string(),
                    value: "medium".to_string(),
                },
            ],
            success_metrics: vec![
                SuccessMetric {
                    metric: "User acquisition".to_string(),
                    target: "1000 users".to_string(),
                    timeline: "3 months".to_string(),
                },
                SuccessMetric {
                    metric: "Revenue".to_string(),
                    target: "$10000".to_string(),
                    timeline: "6 months".to_string(),
                },
            ],
            go_to_market_strategy: GoToMarketStrategy {
                channels: vec!["Channel 1".to_string()],
                pricing_strategy: "Freemium".to_string(),
                launch_plan: "Beta launch".to_string(),
            },
        };

        let summary = agent.generate_summary(&concept);
        assert!(summary.contains("2 MVP features"));
        assert!(summary.contains("2 success metrics"));
        assert!(summary.contains("2 target segments"));
    }

    #[tokio::test]
    async fn test_agent_execute_structure() {
        let config = create_test_config();
        let agent = ProductConceptAgent::new(config);
        let task = create_test_task();

        // Note: This test doesn't actually call the LLM, just tests the structure
        // In a real test environment, you would mock the LLM provider
        assert_eq!(agent.agent_type(), AgentType::ProductConceptAgent);
        assert_eq!(task.id, "test-task-2");
        assert_eq!(task.title, "AI-Powered Task Management Platform");
    }
}
