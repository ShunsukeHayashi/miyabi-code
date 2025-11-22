//! Agent Initialization - Register all A2AEnabled agents with the bridge
//!
//! This module provides initialization functions to register all 21 Miyabi
//! agents that implement A2AEnabled with the A2ABridge.

use crate::a2a_bridge::A2ABridge;
use miyabi_types::AgentConfig;
use tracing::{info, warn};

/// Create default AgentConfig from environment variables
fn create_default_config() -> AgentConfig {
    AgentConfig {
        device_identifier: std::env::var("MIYABI_DEVICE_ID")
            .unwrap_or_else(|_| "mcp-server".to_string()),
        github_token: std::env::var("GITHUB_TOKEN")
            .or_else(|_| std::env::var("GH_TOKEN"))
            .unwrap_or_else(|_| "test-token".to_string()),
        repo_owner: std::env::var("GITHUB_REPO_OWNER").ok(),
        repo_name: std::env::var("GITHUB_REPO_NAME").ok(),
        use_task_tool: std::env::var("MIYABI_USE_TASK_TOOL")
            .map(|v| v == "true" || v == "1")
            .unwrap_or(false),
        use_worktree: std::env::var("MIYABI_USE_WORKTREE")
            .map(|v| v == "true" || v == "1")
            .unwrap_or(false),
        worktree_base_path: std::env::var("MIYABI_WORKTREE_BASE")
            .ok()
            .map(std::path::PathBuf::from),
        log_directory: std::env::var("MIYABI_LOG_DIR")
            .unwrap_or_else(|_| ".ai/logs".to_string()),
        report_directory: std::env::var("MIYABI_REPORT_DIR")
            .unwrap_or_else(|_| ".ai/reports".to_string()),
        tech_lead_github_username: std::env::var("MIYABI_TECH_LEAD").ok(),
        ciso_github_username: std::env::var("MIYABI_CISO").ok(),
        po_github_username: std::env::var("MIYABI_PO").ok(),
        firebase_production_project: std::env::var("FIREBASE_PRODUCTION_PROJECT").ok(),
        firebase_staging_project: std::env::var("FIREBASE_STAGING_PROJECT").ok(),
        production_url: std::env::var("PRODUCTION_URL").ok(),
        staging_url: std::env::var("STAGING_URL").ok(),
    }
}

/// Initialize A2ABridge with all available agents
///
/// Registers all 21 A2AEnabled agents:
/// - 7 Core Agents (Coordinator, CodeGen, Review, Issue, PR, Deployment, Refresher)
/// - 14 Business Agents
pub async fn initialize_all_agents(
    bridge: &A2ABridge,
) -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
    let mut registered = 0;

    // Register Core Agents
    registered += register_core_agents(bridge).await?;

    // Register Business Agents
    registered += register_business_agents(bridge).await?;

    info!("Initialized {} A2A agents with bridge", registered);
    Ok(registered)
}

/// Register core workflow agents
async fn register_core_agents(
    bridge: &A2ABridge,
) -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
    use miyabi_agents::{
        CodeGenAgent, CoordinatorAgent, DeploymentAgent, PRAgent, RefresherAgent, ReviewAgent,
    };

    let config = create_default_config();
    let mut count = 0;

    // CoordinatorAgent
    let agent = CoordinatorAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered CoordinatorAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register CoordinatorAgent: {}", e),
    }

    // CodeGenAgent
    let agent = CodeGenAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered CodeGenAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register CodeGenAgent: {}", e),
    }

    // ReviewAgent
    let agent = ReviewAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered ReviewAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register ReviewAgent: {}", e),
    }

    // IssueAgent - TODO: Implement A2AEnabled trait
    // let agent = IssueAgent::new(config.clone());
    // match bridge.register_handler(agent).await {
    //     Ok(_) => {
    //         info!("Registered IssueAgent");
    //         count += 1;
    //     }
    //     Err(e) => warn!("Failed to register IssueAgent: {}", e),
    // }

    // PRAgent
    let agent = PRAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered PRAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register PRAgent: {}", e),
    }

    // DeploymentAgent
    let agent = DeploymentAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered DeploymentAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register DeploymentAgent: {}", e),
    }

    // RefresherAgent
    let agent = RefresherAgent::new(config.clone());
    match bridge.register_handler(agent).await {
        Ok(_) => {
            info!("Registered RefresherAgent");
            count += 1;
        }
        Err(e) => warn!("Failed to register RefresherAgent: {}", e),
    }

    info!("Registered {} core agents", count);
    Ok(count)
}

/// Register business strategy agents
async fn register_business_agents(
    bridge: &A2ABridge,
) -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
    use miyabi_agents::{
        AIEntrepreneurAgent, AnalyticsAgent, CRMAgent, ContentCreationAgent, FunnelDesignAgent,
        MarketResearchAgent, MarketingAgent, PersonaAgent, ProductConceptAgent, ProductDesignAgent,
        SNSStrategyAgent, SalesAgent, SelfAnalysisAgent, YouTubeAgent,
    };

    let mut count = 0;
    let config = create_default_config();

    // SelfAnalysisAgent
    let agent = SelfAnalysisAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // MarketResearchAgent
    let agent = MarketResearchAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // PersonaAgent
    let agent = PersonaAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // ProductConceptAgent
    let agent = ProductConceptAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // ProductDesignAgent
    let agent = ProductDesignAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // ContentCreationAgent
    let agent = ContentCreationAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // FunnelDesignAgent
    let agent = FunnelDesignAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // SNSStrategyAgent
    let agent = SNSStrategyAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // MarketingAgent
    let agent = MarketingAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // SalesAgent
    let agent = SalesAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // CRMAgent
    let agent = CRMAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // AnalyticsAgent
    let agent = AnalyticsAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // YouTubeAgent
    let agent = YouTubeAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    // AIEntrepreneurAgent
    let agent = AIEntrepreneurAgent::new(config.clone());
    if bridge.register_handler(agent).await.is_ok() {
        count += 1;
    }

    info!("Registered {} business agents", count);
    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_bridge_creation_for_init() {
        // Just verify we can create a bridge
        let bridge = A2ABridge::new().await;
        assert!(bridge.is_ok());
    }

    #[test]
    fn test_default_config_creation() {
        let config = create_default_config();
        assert_eq!(config.device_identifier, "mcp-server");
        assert_eq!(config.log_directory, ".ai/logs");
        assert_eq!(config.report_directory, ".ai/reports");
    }

    #[tokio::test]
    async fn test_initialize_all_21_agents() {
        // Create bridge and initialize all agents
        let bridge = A2ABridge::new().await.expect("Failed to create A2ABridge");

        // Initialize all agents
        let count = initialize_all_agents(&bridge)
            .await
            .expect("Failed to initialize agents");

        // Verify all 21 agents were registered
        assert_eq!(count, 21, "Expected 21 agents, got {}", count);

        // Verify agents are listed
        let agents = bridge.list_agents().await;
        assert_eq!(agents.len(), 21, "Expected 21 agents listed, got {}", agents.len());

        // Verify tools are available
        let tools = bridge.get_tool_definitions().await;
        assert!(!tools.is_empty(), "Expected tools to be defined");

        // Verify tool naming convention
        for tool in &tools {
            assert!(
                tool.name.starts_with("a2a."),
                "Tool name should start with 'a2a.': {}",
                tool.name
            );
        }
    }

    #[tokio::test]
    async fn test_core_agents_registration() {
        let bridge = A2ABridge::new().await.expect("Failed to create A2ABridge");
        let count = register_core_agents(&bridge)
            .await
            .expect("Failed to register core agents");

        // Should register 7 core agents
        assert_eq!(count, 7, "Expected 7 core agents, got {}", count);
    }

    #[tokio::test]
    async fn test_business_agents_registration() {
        let bridge = A2ABridge::new().await.expect("Failed to create A2ABridge");
        let count = register_business_agents(&bridge)
            .await
            .expect("Failed to register business agents");

        // Should register 14 business agents
        assert_eq!(count, 14, "Expected 14 business agents, got {}", count);
    }
}
