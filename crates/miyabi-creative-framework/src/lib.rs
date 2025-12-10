//! Miyabi Creative Framework - Infinite Creative Possibilities
//!
//! A comprehensive framework enabling limitless creativity through:
//! - Plugin ecosystem for extensibility
//! - AI model marketplace for intelligent model selection
//! - Workflow automation for complex creative pipelines
//! - A/B testing and optimization for continuous improvement
//! - Real-time collaboration for team creativity
//!
//! # Architecture
//!
//! ```text
//! +------------------+     +-------------------+     +------------------+
//! |  Plugin System   |<--->|   AI Marketplace  |<--->| Workflow Engine  |
//! +------------------+     +-------------------+     +------------------+
//!          |                        |                        |
//!          v                        v                        v
//! +------------------+     +-------------------+     +------------------+
//! | Secure Sandbox   |     |  Model Discovery  |     | DAG Execution    |
//! +------------------+     +-------------------+     +------------------+
//!          |                        |                        |
//!          +------------------------+------------------------+
//!                                   |
//!                                   v
//!                       +-------------------+
//!                       | Optimization      |
//!                       | & Collaboration   |
//!                       +-------------------+
//! ```
//!
//! # Example
//!
//! ```no_run
//! use miyabi_creative_framework::{
//!     CreativeFramework, PluginManifest, WorkflowDefinition,
//! };
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Initialize the framework
//!     let framework = CreativeFramework::new().await?;
//!
//!     // Discover and select optimal AI models
//!     let models = framework.marketplace().discover_models().await?;
//!
//!     // Create a creative workflow
//!     let workflow = framework.workflow()
//!         .input("prompt", "Create a landing page")
//!         .ai_process("generate", "claude-3-5-sonnet")
//!         .transform("optimize", |result| result)
//!         .output("html");
//!
//!     // Execute with optimization
//!     let result = framework.execute_optimized(workflow).await?;
//!
//!     Ok(())
//! }
//! ```

pub mod collaboration;
pub mod error;
pub mod marketplace;
pub mod optimization;
pub mod plugin;
pub mod workflow;

pub use collaboration::{
    CollaborativeSession, CollaboratorInfo, Participant, RealTimeSync,
};
pub use error::{CreativeError, Result};
pub use marketplace::{
    AIModelListing, AIModelMarketplace, ModelCapability, ModelPerformance,
    ModelPricing, ProviderConnector,
};
pub use optimization::{
    CreativeOptimizationFramework, ExperimentVariant, OptimizationExperiment,
    OptimizationMetric,
};
pub use plugin::{
    CreativePluginFramework, LoadedPlugin, PluginExecutionContext,
    PluginManifest, PluginPermission, PluginSandbox,
};
pub use workflow::{
    WorkflowAutomationEngine, WorkflowDefinition, WorkflowEdge, WorkflowNode,
    WorkflowPort, WorkflowResult,
};

use std::sync::Arc;

/// Main entry point for the Creative Framework
pub struct CreativeFramework {
    plugin_framework: Arc<CreativePluginFramework>,
    marketplace: Arc<AIModelMarketplace>,
    workflow_engine: Arc<WorkflowAutomationEngine>,
    optimization: Arc<CreativeOptimizationFramework>,
}

impl CreativeFramework {
    /// Create a new Creative Framework instance
    pub async fn new() -> Result<Self> {
        let plugin_framework = Arc::new(CreativePluginFramework::new().await?);
        let marketplace = Arc::new(AIModelMarketplace::new().await?);
        let workflow_engine = Arc::new(WorkflowAutomationEngine::new().await?);
        let optimization = Arc::new(CreativeOptimizationFramework::new().await?);

        Ok(Self {
            plugin_framework,
            marketplace,
            workflow_engine,
            optimization,
        })
    }

    /// Access the plugin framework
    pub fn plugins(&self) -> &Arc<CreativePluginFramework> {
        &self.plugin_framework
    }

    /// Access the AI model marketplace
    pub fn marketplace(&self) -> &Arc<AIModelMarketplace> {
        &self.marketplace
    }

    /// Access the workflow automation engine
    pub fn workflow(&self) -> &Arc<WorkflowAutomationEngine> {
        &self.workflow_engine
    }

    /// Access the optimization framework
    pub fn optimization(&self) -> &Arc<CreativeOptimizationFramework> {
        &self.optimization
    }

    /// Execute a workflow with automatic optimization
    pub async fn execute_optimized(
        &self,
        workflow: WorkflowDefinition,
    ) -> Result<WorkflowResult> {
        self.workflow_engine.execute(workflow, None).await
    }
}

/// Framework version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
