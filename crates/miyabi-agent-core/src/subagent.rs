//! Subagent runtime for parallel agent execution
//!
//! Provides infrastructure for spawning and managing multiple agents
//! in parallel, similar to Claude Code's subagent feature.

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc, RwLock};
use uuid::Uuid;

/// Subagent identifier
pub type SubagentId = Uuid;

/// Message channel capacity
const CHANNEL_CAPACITY: usize = 1024;

/// Subagent status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SubagentStatus {
    /// Agent is initializing
    Initializing,
    /// Agent is idle, waiting for tasks
    Idle,
    /// Agent is running a task
    Running,
    /// Agent is paused
    Paused,
    /// Agent completed successfully
    Completed,
    /// Agent failed with error
    Failed,
    /// Agent was terminated
    Terminated,
}

/// Subagent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentConfig {
    /// Agent name
    pub name: String,
    /// Agent type/role
    pub agent_type: AgentType,
    /// Maximum execution time (seconds)
    pub timeout_seconds: u64,
    /// Maximum retries on failure
    pub max_retries: u32,
    /// Resource limits
    pub resources: ResourceAllocation,
    /// Environment variables
    pub environment: HashMap<String, String>,
    /// Working directory
    pub working_directory: Option<String>,
    /// Dependencies on other agents
    pub depends_on: Vec<SubagentId>,
}

/// Agent type/role
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AgentType {
    /// Code generation agent
    CodeGen,
    /// Code review agent
    Reviewer,
    /// Testing agent
    Tester,
    /// Deployment agent
    Deployer,
    /// Coordinator agent
    Coordinator,
    /// Research agent
    Researcher,
    /// Documentation agent
    Documenter,
    /// Custom agent type
    Custom(String),
}

impl std::fmt::Display for AgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentType::CodeGen => write!(f, "codegen"),
            AgentType::Reviewer => write!(f, "reviewer"),
            AgentType::Tester => write!(f, "tester"),
            AgentType::Deployer => write!(f, "deployer"),
            AgentType::Coordinator => write!(f, "coordinator"),
            AgentType::Researcher => write!(f, "researcher"),
            AgentType::Documenter => write!(f, "documenter"),
            AgentType::Custom(name) => write!(f, "custom:{}", name),
        }
    }
}

/// Resource allocation for subagent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceAllocation {
    /// Max CPU cores (fractional allowed)
    pub cpu_cores: f32,
    /// Max memory in MB
    pub memory_mb: u64,
    /// Max disk space in MB
    pub disk_mb: u64,
    /// Network access allowed
    pub network_access: bool,
}

impl Default for ResourceAllocation {
    fn default() -> Self {
        Self {
            cpu_cores: 1.0,
            memory_mb: 512,
            disk_mb: 1024,
            network_access: true,
        }
    }
}

/// Task to be executed by subagent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentTask {
    /// Task ID
    pub id: Uuid,
    /// Task description
    pub description: String,
    /// Task instructions
    pub instructions: String,
    /// Input data
    pub input: serde_json::Value,
    /// Priority (higher = more important)
    pub priority: u32,
    /// Creation time
    pub created_at: DateTime<Utc>,
}

/// Result from subagent execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubagentResult {
    /// Task ID
    pub task_id: Uuid,
    /// Agent ID
    pub agent_id: SubagentId,
    /// Success status
    pub success: bool,
    /// Output data
    pub output: serde_json::Value,
    /// Error message if failed
    pub error: Option<String>,
    /// Execution duration (milliseconds)
    pub duration_ms: u64,
    /// Artifacts produced
    pub artifacts: Vec<Artifact>,
    /// Completion time
    pub completed_at: DateTime<Utc>,
}

/// Artifact produced by subagent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    /// Artifact name
    pub name: String,
    /// Artifact type
    pub artifact_type: ArtifactType,
    /// File path or content
    pub content: String,
    /// Size in bytes
    pub size: u64,
}

/// Artifact type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ArtifactType {
    /// Source code file
    SourceCode,
    /// Test file
    TestFile,
    /// Documentation
    Documentation,
    /// Configuration
    Config,
    /// Build output
    BuildOutput,
    /// Log file
    Log,
    /// Other
    Other(String),
}

/// Message between agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    /// Message ID
    pub id: Uuid,
    /// Sender agent ID
    pub from: SubagentId,
    /// Recipient agent ID (None for broadcast)
    pub to: Option<SubagentId>,
    /// Message type
    pub message_type: MessageType,
    /// Payload
    pub payload: serde_json::Value,
    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Message type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    /// Task assignment
    TaskAssign,
    /// Task result
    TaskResult,
    /// Status update
    StatusUpdate,
    /// Request for help
    HelpRequest,
    /// Information sharing
    Info,
    /// Error notification
    Error,
    /// Shutdown signal
    Shutdown,
}

/// Subagent handle for control
pub struct SubagentHandle {
    /// Agent ID
    pub id: SubagentId,
    /// Agent config
    pub config: SubagentConfig,
    /// Current status
    status: Arc<RwLock<SubagentStatus>>,
    /// Task sender
    task_tx: mpsc::Sender<SubagentTask>,
    /// Result receiver
    result_rx: Arc<RwLock<mpsc::Receiver<SubagentResult>>>,
    /// Message broadcast sender
    message_tx: broadcast::Sender<AgentMessage>,
    /// Shutdown signal
    shutdown_tx: mpsc::Sender<()>,
}

impl SubagentHandle {
    /// Get current status
    pub async fn status(&self) -> SubagentStatus {
        *self.status.read().await
    }

    /// Send task to agent
    pub async fn send_task(&self, task: SubagentTask) -> Result<(), SubagentError> {
        self.task_tx.send(task).await
            .map_err(|_| SubagentError::ChannelClosed)
    }

    /// Receive result from agent
    pub async fn recv_result(&self) -> Option<SubagentResult> {
        self.result_rx.write().await.recv().await
    }

    /// Send message to agent
    pub async fn send_message(&self, message: AgentMessage) -> Result<(), SubagentError> {
        self.message_tx.send(message)
            .map(|_| ())
            .map_err(|_| SubagentError::ChannelClosed)
    }

    /// Shutdown agent
    pub async fn shutdown(&self) -> Result<(), SubagentError> {
        self.shutdown_tx.send(()).await
            .map_err(|_| SubagentError::ChannelClosed)
    }
}

/// Subagent runtime for managing multiple agents
pub struct SubagentRuntime {
    /// Running agents
    agents: RwLock<HashMap<SubagentId, SubagentHandle>>,
    /// Message broadcast channel
    broadcast_tx: broadcast::Sender<AgentMessage>,
    /// Runtime configuration
    config: RuntimeConfig,
}

/// Runtime configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeConfig {
    /// Maximum concurrent agents
    pub max_agents: usize,
    /// Default timeout (seconds)
    pub default_timeout: u64,
    /// Enable agent-to-agent communication
    pub enable_messaging: bool,
    /// Log level
    pub log_level: String,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self {
            max_agents: 10,
            default_timeout: 300,
            enable_messaging: true,
            log_level: "info".to_string(),
        }
    }
}

/// Subagent error types
#[derive(Debug, thiserror::Error)]
pub enum SubagentError {
    #[error("Agent not found: {0}")]
    NotFound(SubagentId),
    #[error("Max agents limit reached")]
    LimitReached,
    #[error("Agent already exists: {0}")]
    AlreadyExists(SubagentId),
    #[error("Channel closed")]
    ChannelClosed,
    #[error("Timeout")]
    Timeout,
    #[error("Dependency not met: {0}")]
    DependencyNotMet(SubagentId),
    #[error("Execution error: {0}")]
    Execution(String),
}

/// Subagent executor trait
#[async_trait]
pub trait SubagentExecutor: Send + Sync {
    /// Execute a task
    async fn execute(&self, task: SubagentTask) -> Result<SubagentResult, SubagentError>;
    
    /// Get agent type
    fn agent_type(&self) -> AgentType;
    
    /// Handle incoming message
    async fn handle_message(&self, message: AgentMessage) -> Option<AgentMessage>;
}

impl SubagentRuntime {
    /// Create new runtime
    pub fn new(config: RuntimeConfig) -> Self {
        let (broadcast_tx, _) = broadcast::channel(CHANNEL_CAPACITY);
        Self {
            agents: RwLock::new(HashMap::new()),
            broadcast_tx,
            config,
        }
    }

    /// Spawn a new subagent
    pub async fn spawn(
        &self,
        config: SubagentConfig,
        executor: Arc<dyn SubagentExecutor>,
    ) -> Result<SubagentId, SubagentError> {
        let agents = self.agents.read().await;
        if agents.len() >= self.config.max_agents {
            return Err(SubagentError::LimitReached);
        }
        drop(agents);

        let id = Uuid::new_v4();
        let status = Arc::new(RwLock::new(SubagentStatus::Initializing));
        
        let (task_tx, mut task_rx) = mpsc::channel::<SubagentTask>(CHANNEL_CAPACITY);
        let (result_tx, result_rx) = mpsc::channel::<SubagentResult>(CHANNEL_CAPACITY);
        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);
        
        let message_tx = self.broadcast_tx.clone();
        let mut message_rx = self.broadcast_tx.subscribe();

        let handle = SubagentHandle {
            id,
            config: config.clone(),
            status: status.clone(),
            task_tx,
            result_rx: Arc::new(RwLock::new(result_rx)),
            message_tx: message_tx.clone(),
            shutdown_tx,
        };

        // Spawn agent task
        let agent_status = status.clone();
        let agent_id = id;
        tokio::spawn(async move {
            *agent_status.write().await = SubagentStatus::Idle;

            loop {
                tokio::select! {
                    // Handle shutdown
                    _ = shutdown_rx.recv() => {
                        *agent_status.write().await = SubagentStatus::Terminated;
                        break;
                    }
                    
                    // Handle incoming task
                    Some(task) = task_rx.recv() => {
                        *agent_status.write().await = SubagentStatus::Running;
                        
                        let start = std::time::Instant::now();
                        let result = executor.execute(task.clone()).await;
                        let duration = start.elapsed().as_millis() as u64;
                        
                        let subagent_result = match result {
                            Ok(mut r) => {
                                r.duration_ms = duration;
                                r
                            }
                            Err(e) => SubagentResult {
                                task_id: task.id,
                                agent_id,
                                success: false,
                                output: serde_json::Value::Null,
                                error: Some(e.to_string()),
                                duration_ms: duration,
                                artifacts: vec![],
                                completed_at: Utc::now(),
                            }
                        };
                        
                        let _ = result_tx.send(subagent_result).await;
                        *agent_status.write().await = SubagentStatus::Idle;
                    }
                    
                    // Handle messages
                    Ok(message) = message_rx.recv() => {
                        // Only process messages intended for this agent
                        if message.to.is_none() || message.to == Some(agent_id) {
                            if let Some(response) = executor.handle_message(message).await {
                                let _ = message_tx.send(response);
                            }
                        }
                    }
                }
            }
        });

        let mut agents = self.agents.write().await;
        agents.insert(id, handle);

        Ok(id)
    }

    /// Get agent handle
    pub async fn get(&self, _id: SubagentId) -> Option<&SubagentHandle> {
        // Note: This is a simplified version. In production, you'd use
        // a different pattern to avoid lifetime issues
        None // Placeholder - see get_status for actual usage
    }

    /// Get agent status
    pub async fn get_status(&self, id: SubagentId) -> Result<SubagentStatus, SubagentError> {
        let agents = self.agents.read().await;
        let handle = agents.get(&id).ok_or(SubagentError::NotFound(id))?;
        Ok(handle.status().await)
    }

    /// Send task to agent
    pub async fn send_task(&self, id: SubagentId, task: SubagentTask) -> Result<(), SubagentError> {
        let agents = self.agents.read().await;
        let handle = agents.get(&id).ok_or(SubagentError::NotFound(id))?;
        handle.send_task(task).await
    }

    /// Broadcast message to all agents
    pub async fn broadcast(&self, message: AgentMessage) -> Result<(), SubagentError> {
        self.broadcast_tx.send(message)
            .map(|_| ())
            .map_err(|_| SubagentError::ChannelClosed)
    }

    /// Shutdown agent
    pub async fn shutdown_agent(&self, id: SubagentId) -> Result<(), SubagentError> {
        let agents = self.agents.read().await;
        let handle = agents.get(&id).ok_or(SubagentError::NotFound(id))?;
        handle.shutdown().await
    }

    /// Shutdown all agents
    pub async fn shutdown_all(&self) {
        let agents = self.agents.read().await;
        for (_, handle) in agents.iter() {
            let _ = handle.shutdown().await;
        }
    }

    /// List all agents
    pub async fn list(&self) -> Vec<(SubagentId, SubagentConfig, SubagentStatus)> {
        let agents = self.agents.read().await;
        let mut result = Vec::new();
        
        for (id, handle) in agents.iter() {
            let status = handle.status().await;
            result.push((*id, handle.config.clone(), status));
        }
        
        result
    }

    /// Get agent count
    pub async fn count(&self) -> usize {
        self.agents.read().await.len()
    }
}

/// Orchestrator for coordinating multiple subagents
pub struct Orchestrator {
    /// Subagent runtime
    #[allow(dead_code)]
    runtime: Arc<SubagentRuntime>,
    /// Execution plans
    plans: RwLock<HashMap<Uuid, ExecutionPlan>>,
}

/// Execution plan for coordinated agent work
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionPlan {
    /// Plan ID
    pub id: Uuid,
    /// Plan name
    pub name: String,
    /// Stages to execute
    pub stages: Vec<ExecutionStage>,
    /// Current stage index
    pub current_stage: usize,
    /// Plan status
    pub status: PlanStatus,
    /// Created at
    pub created_at: DateTime<Utc>,
}

/// Execution stage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStage {
    /// Stage name
    pub name: String,
    /// Tasks in this stage (can run in parallel)
    pub tasks: Vec<StagedTask>,
    /// Continue on failure
    pub continue_on_failure: bool,
}

/// Task within a stage
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StagedTask {
    /// Target agent type
    pub agent_type: AgentType,
    /// Task to execute
    pub task: SubagentTask,
    /// Required for stage completion
    pub required: bool,
}

/// Plan execution status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PlanStatus {
    /// Plan is pending
    Pending,
    /// Plan is running
    Running,
    /// Plan completed successfully
    Completed,
    /// Plan failed
    Failed,
    /// Plan was cancelled
    Cancelled,
}

impl Orchestrator {
    /// Create new orchestrator
    pub fn new(runtime: Arc<SubagentRuntime>) -> Self {
        Self {
            runtime,
            plans: RwLock::new(HashMap::new()),
        }
    }

    /// Create execution plan
    pub async fn create_plan(&self, name: &str, stages: Vec<ExecutionStage>) -> ExecutionPlan {
        let plan = ExecutionPlan {
            id: Uuid::new_v4(),
            name: name.to_string(),
            stages,
            current_stage: 0,
            status: PlanStatus::Pending,
            created_at: Utc::now(),
        };

        let mut plans = self.plans.write().await;
        plans.insert(plan.id, plan.clone());

        plan
    }

    /// Get plan status
    pub async fn get_plan(&self, id: Uuid) -> Option<ExecutionPlan> {
        self.plans.read().await.get(&id).cloned()
    }

    /// List all plans
    pub async fn list_plans(&self) -> Vec<ExecutionPlan> {
        self.plans.read().await.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockExecutor {
        agent_type: AgentType,
    }

    #[async_trait]
    impl SubagentExecutor for MockExecutor {
        async fn execute(&self, task: SubagentTask) -> Result<SubagentResult, SubagentError> {
            Ok(SubagentResult {
                task_id: task.id,
                agent_id: Uuid::new_v4(),
                success: true,
                output: serde_json::json!({"result": "success"}),
                error: None,
                duration_ms: 100,
                artifacts: vec![],
                completed_at: Utc::now(),
            })
        }

        fn agent_type(&self) -> AgentType {
            self.agent_type.clone()
        }

        async fn handle_message(&self, _message: AgentMessage) -> Option<AgentMessage> {
            None
        }
    }

    #[tokio::test]
    async fn test_spawn_agent() {
        let runtime = SubagentRuntime::new(RuntimeConfig::default());
        let executor = Arc::new(MockExecutor {
            agent_type: AgentType::CodeGen,
        });

        let config = SubagentConfig {
            name: "test-codegen".to_string(),
            agent_type: AgentType::CodeGen,
            timeout_seconds: 60,
            max_retries: 3,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![],
        };

        let id = runtime.spawn(config, executor).await.unwrap();
        
        // Wait for agent to initialize
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        
        let status = runtime.get_status(id).await.unwrap();
        assert_eq!(status, SubagentStatus::Idle);
    }

    #[tokio::test]
    async fn test_agent_limit() {
        let config = RuntimeConfig {
            max_agents: 2,
            ..Default::default()
        };
        let runtime = SubagentRuntime::new(config);

        for i in 0..2 {
            let executor = Arc::new(MockExecutor {
                agent_type: AgentType::CodeGen,
            });
            let config = SubagentConfig {
                name: format!("agent-{}", i),
                agent_type: AgentType::CodeGen,
                timeout_seconds: 60,
                max_retries: 3,
                resources: ResourceAllocation::default(),
                environment: HashMap::new(),
                working_directory: None,
                depends_on: vec![],
            };
            runtime.spawn(config, executor).await.unwrap();
        }

        // Third agent should fail
        let executor = Arc::new(MockExecutor {
            agent_type: AgentType::CodeGen,
        });
        let config = SubagentConfig {
            name: "agent-overflow".to_string(),
            agent_type: AgentType::CodeGen,
            timeout_seconds: 60,
            max_retries: 3,
            resources: ResourceAllocation::default(),
            environment: HashMap::new(),
            working_directory: None,
            depends_on: vec![],
        };
        
        let result = runtime.spawn(config, executor).await;
        assert!(matches!(result, Err(SubagentError::LimitReached)));
    }

    #[tokio::test]
    async fn test_list_agents() {
        let runtime = SubagentRuntime::new(RuntimeConfig::default());

        for i in 0..3 {
            let executor = Arc::new(MockExecutor {
                agent_type: AgentType::CodeGen,
            });
            let config = SubagentConfig {
                name: format!("agent-{}", i),
                agent_type: AgentType::CodeGen,
                timeout_seconds: 60,
                max_retries: 3,
                resources: ResourceAllocation::default(),
                environment: HashMap::new(),
                working_directory: None,
                depends_on: vec![],
            };
            runtime.spawn(config, executor).await.unwrap();
        }

        assert_eq!(runtime.count().await, 3);
        assert_eq!(runtime.list().await.len(), 3);
    }
}
