//! Workflow command - Execute workflows defined in YAML/JSON
//!
//! Enables execution of pre-defined workflows using WorkflowBuilder and CoordinatorAgent.

use crate::config::ConfigLoader;
use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_types::{agent::AgentType, AgentConfig};
use miyabi_workflow::{Condition, WorkflowBuilder};
use std::path::PathBuf;

/// Workflow CLI command
#[derive(Debug, Clone)]
pub struct WorkflowCommand {
    /// Path to workflow definition file (YAML or JSON)
    pub file: PathBuf,

    /// State persistence directory
    pub state_dir: PathBuf,
}

impl WorkflowCommand {
    /// Create a new WorkflowCommand
    pub fn new(file: PathBuf, state_dir: Option<PathBuf>) -> Self {
        Self {
            file,
            state_dir: state_dir.unwrap_or_else(|| PathBuf::from(".miyabi/workflows")),
        }
    }

    /// Execute the workflow
    pub async fn execute(&self) -> Result<()> {
        println!(
            "{}",
            format!("🔄 Executing workflow from {:?}...", self.file)
                .cyan()
                .bold()
        );

        // Ensure workflow file exists
        if !self.file.exists() {
            return Err(CliError::Config(format!(
                "Workflow file not found: {:?}",
                self.file
            )));
        }

        // Load workflow definition
        let workflow_content = std::fs::read_to_string(&self.file)
            .map_err(|e| CliError::Config(format!("Failed to read workflow file: {}", e)))?;

        // Parse workflow based on file extension
        let workflow_def: WorkflowDefinition = if self.file.extension().and_then(|s| s.to_str())
            == Some("yaml")
            || self.file.extension().and_then(|s| s.to_str()) == Some("yml")
        {
            serde_yaml::from_str(&workflow_content)
                .map_err(|e| CliError::Config(format!("Failed to parse YAML workflow: {}", e)))?
        } else {
            serde_json::from_str(&workflow_content)
                .map_err(|e| CliError::Config(format!("Failed to parse JSON workflow: {}", e)))?
        };

        println!(
            "{}",
            format!(
                "📋 Workflow: {} (v{})",
                workflow_def.name, workflow_def.version
            )
            .green()
        );

        // Build workflow from definition
        let workflow = self.build_workflow_from_definition(&workflow_def)?;

        // Load configuration
        let config = ConfigLoader::load_from_env()
            .map_err(|e| CliError::Config(format!("Failed to load configuration: {}", e)))?;

        let agent_config = AgentConfig {
            github_token: config.github_token.clone(),
            openai_api_key: config.openai_api_key.clone(),
            anthropic_api_key: config.anthropic_api_key,
            device_identifier: config.device_identifier.clone(),
            session_id: uuid::Uuid::new_v4().to_string(),
            github_repository: config.github_repository.clone(),
            llm_provider: config.llm_provider.clone(),
            llm_model: config.llm_model.clone(),
        };

        // Create CoordinatorAgent
        let coordinator = CoordinatorAgent::new(agent_config);

        // Ensure state directory exists
        if !self.state_dir.exists() {
            std::fs::create_dir_all(&self.state_dir).map_err(|e| {
                CliError::Config(format!("Failed to create state directory: {}", e))
            })?;
        }

        println!(
            "{}",
            format!("📦 State directory: {:?}", self.state_dir).dimmed()
        );

        // Execute workflow
        let report = coordinator
            .execute_workflow(workflow, &self.state_dir)
            .await
            .map_err(|e| CliError::Execution(format!("Workflow execution failed: {}", e)))?;

        // Display results
        println!("\n{}", "✅ Workflow Execution Results".green().bold());
        println!("  Total tasks: {}", report.summary.total);
        println!(
            "  ✅ Completed: {}",
            report.summary.completed.to_string().green()
        );
        println!("  ❌ Failed: {}", report.summary.failed.to_string().red());
        println!(
            "  📊 Success rate: {:.1}%",
            report.summary.success_rate * 100.0
        );
        println!(
            "  ⏱️  Duration: {} ms",
            report.total_duration_ms.to_string().cyan()
        );

        if report.summary.failed > 0 {
            return Err(CliError::Execution(format!(
                "Workflow completed with {} failed tasks",
                report.summary.failed
            )));
        }

        println!("\n{}", "🎉 Workflow completed successfully!".green().bold());
        Ok(())
    }

    /// Build WorkflowBuilder from WorkflowDefinition
    fn build_workflow_from_definition(&self, def: &WorkflowDefinition) -> Result<WorkflowBuilder> {
        use miyabi_types::agent::AgentType;

        let mut builder = WorkflowBuilder::new(&def.name);

        for step_def in &def.steps {
            let agent_type = self.parse_agent_type(&step_def.agent)?;

            match step_def.step_type.as_str() {
                "step" => {
                    builder = builder.step(&step_def.name, agent_type);
                }
                "then" => {
                    builder = builder.then(&step_def.name, agent_type);
                }
                "parallel" => {
                    // For parallel, we'd need to handle multiple agents
                    // For now, treat as sequential step
                    builder = builder.then(&step_def.name, agent_type);
                }
                "branch" => {
                    let branches = step_def.branches.as_ref().ok_or_else(|| {
                        CliError::Config(format!(
                            "Branch step '{}' must include branch definitions",
                            step_def.name
                        ))
                    })?;

                    let parsed = self.parse_branch_definitions(&step_def.name, branches)?;
                    let branch_args: Vec<(&str, Condition, &str)> = parsed
                        .iter()
                        .map(|(name, condition, next)| {
                            (name.as_str(), condition.clone(), next.as_str())
                        })
                        .collect();

                    builder = builder.branch_on(&step_def.name, branch_args);
                }
                unknown => return Err(CliError::Config(format!("Unknown step type: {}", unknown))),
            }
        }

        Ok(builder)
    }

    /// Parse agent type from string
    fn parse_agent_type(&self, agent_str: &str) -> Result<AgentType> {
        match agent_str.to_lowercase().as_str() {
            "coordinator" | "coordinatoragent" => Ok(AgentType::CoordinatorAgent),
            "codegen" | "codegenagent" => Ok(AgentType::CodeGenAgent),
            "review" | "reviewagent" => Ok(AgentType::ReviewAgent),
            "issue" | "issueagent" => Ok(AgentType::IssueAgent),
            "pr" | "pragent" => Ok(AgentType::PRAgent),
            "deployment" | "deploymentagent" => Ok(AgentType::DeploymentAgent),
            "refresher" | "refresheragent" => Ok(AgentType::RefresherAgent),
            unknown => Err(CliError::Config(format!("Unknown agent type: {}", unknown))),
        }
    }

    fn parse_branch_definitions(
        &self,
        step_name: &str,
        branches: &[BranchDefinition],
    ) -> Result<Vec<(String, Condition, String)>> {
        if branches.is_empty() {
            return Err(CliError::Config(format!(
                "Branch step '{}' must define at least one branch",
                step_name
            )));
        }

        let mut parsed = Vec::with_capacity(branches.len());
        for (idx, branch) in branches.iter().enumerate() {
            let condition =
                self.parse_branch_condition(step_name, idx, branch.condition.as_ref())?;
            let branch_name = branch
                .name
                .clone()
                .unwrap_or_else(|| format!("{}-branch-{}", step_name, idx));
            parsed.push((branch_name, condition, branch.next_step.clone()));
        }

        Ok(parsed)
    }

    fn parse_branch_condition(
        &self,
        step_name: &str,
        index: usize,
        condition: Option<&ConditionDefinition>,
    ) -> Result<Condition> {
        match condition {
            None => Ok(Condition::Always),
            Some(definition) => {
                if let Some(field) = &definition.field {
                    if let Some(equals) = &definition.equals {
                        Ok(Condition::FieldEquals {
                            field: field.clone(),
                            value: equals.clone(),
                        })
                    } else {
                        Ok(Condition::FieldExists {
                            field: field.clone(),
                        })
                    }
                } else {
                    Err(CliError::Config(format!(
                        "Branch {} in step '{}' must specify a 'field' when providing a condition",
                        index, step_name
                    )))
                }
            }
        }
    }
}

/// Workflow definition structure (YAML/JSON)
#[derive(Debug, Clone, serde::Deserialize)]
struct WorkflowDefinition {
    name: String,
    version: String,
    steps: Vec<StepDefinition>,
}

/// Step definition in workflow
#[derive(Debug, Clone, serde::Deserialize)]
struct StepDefinition {
    name: String,
    #[serde(rename = "type")]
    step_type: String,
    agent: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    branches: Option<Vec<BranchDefinition>>,
}

/// Branch definition for conditional steps
#[derive(Debug, Clone, serde::Deserialize)]
struct BranchDefinition {
    #[serde(skip_serializing_if = "Option::is_none")]
    name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    condition: Option<ConditionDefinition>,
    next_step: String,
}

/// Condition definition
#[derive(Debug, Clone, serde::Deserialize)]
struct ConditionDefinition {
    field: Option<String>,
    equals: Option<serde_json::Value>,
}
