//! Error types for the Creative Framework

use thiserror::Error;

/// Result type alias for Creative Framework operations
pub type Result<T> = std::result::Result<T, CreativeError>;

/// Creative Framework error types
#[derive(Error, Debug)]
pub enum CreativeError {
    #[error("Plugin error: {0}")]
    Plugin(#[from] PluginError),

    #[error("Marketplace error: {0}")]
    Marketplace(#[from] MarketplaceError),

    #[error("Workflow error: {0}")]
    Workflow(#[from] WorkflowError),

    #[error("Optimization error: {0}")]
    Optimization(#[from] OptimizationError),

    #[error("Collaboration error: {0}")]
    Collaboration(#[from] CollaborationError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Plugin-specific errors
#[derive(Error, Debug)]
pub enum PluginError {
    #[error("Plugin not found: {0}")]
    NotFound(String),

    #[error("Plugin already installed: {0}")]
    AlreadyInstalled(String),

    #[error("Invalid manifest: {0}")]
    InvalidManifest(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Sandbox violation: {0}")]
    SandboxViolation(String),

    #[error("Execution timeout for plugin: {0}")]
    Timeout(String),

    #[error("Dependency not satisfied: {0}")]
    DependencyError(String),

    #[error("Plugin execution failed: {0}")]
    ExecutionFailed(String),
}

/// Marketplace-specific errors
#[derive(Error, Debug)]
pub enum MarketplaceError {
    #[error("Model not found: {0}")]
    ModelNotFound(String),

    #[error("Provider not available: {0}")]
    ProviderNotAvailable(String),

    #[error("API key missing for provider: {0}")]
    ApiKeyMissing(String),

    #[error("Rate limit exceeded for provider: {0}")]
    RateLimitExceeded(String),

    #[error("Model incompatible with requirements: {0}")]
    IncompatibleModel(String),

    #[error("Discovery failed: {0}")]
    DiscoveryFailed(String),
}

/// Workflow-specific errors
#[derive(Error, Debug)]
pub enum WorkflowError {
    #[error("Workflow not found: {0}")]
    NotFound(String),

    #[error("Invalid workflow definition: {0}")]
    InvalidDefinition(String),

    #[error("Circular dependency detected in workflow")]
    CircularDependency,

    #[error("Node execution failed: {node_id} - {reason}")]
    NodeExecutionFailed { node_id: String, reason: String },

    #[error("Workflow execution timeout")]
    Timeout,

    #[error("Invalid edge connection: {from} -> {to}")]
    InvalidEdge { from: String, to: String },

    #[error("Missing input: {0}")]
    MissingInput(String),
}

/// Optimization-specific errors
#[derive(Error, Debug)]
pub enum OptimizationError {
    #[error("Experiment not found: {0}")]
    ExperimentNotFound(String),

    #[error("Invalid variant configuration: {0}")]
    InvalidVariant(String),

    #[error("Insufficient data for analysis")]
    InsufficientData,

    #[error("Metrics collection failed: {0}")]
    MetricsError(String),

    #[error("Experiment already running: {0}")]
    AlreadyRunning(String),
}

/// Collaboration-specific errors
#[derive(Error, Debug)]
pub enum CollaborationError {
    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("User not authorized: {0}")]
    Unauthorized(String),

    #[error("Sync conflict: {0}")]
    SyncConflict(String),

    #[error("Connection lost: {0}")]
    ConnectionLost(String),

    #[error("Maximum participants reached")]
    MaxParticipantsReached,
}

impl From<anyhow::Error> for CreativeError {
    fn from(err: anyhow::Error) -> Self {
        CreativeError::Internal(err.to_string())
    }
}
