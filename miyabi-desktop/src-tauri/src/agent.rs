// Agent execution module for Miyabi Desktop
//
// Provides Tauri commands for executing Miyabi agents

use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

/// Agent type definition (mirrors miyabi-types AgentType)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    // Coding Agents
    CoordinatorAgent,
    CodeGenAgent,
    ReviewAgent,
    IssueAgent,
    PRAgent,
    DeploymentAgent,
    RefresherAgent,

    // Business Agents - Strategy & Planning
    AIEntrepreneurAgent,
    ProductConceptAgent,
    ProductDesignAgent,
    FunnelDesignAgent,
    PersonaAgent,
    SelfAnalysisAgent,

    // Business Agents - Marketing & Content
    MarketResearchAgent,
    MarketingAgent,
    ContentCreationAgent,
    SNSStrategyAgent,
    YouTubeAgent,

    // Business Agents - Sales & Analytics
    SalesAgent,
    CRMAgent,
    AnalyticsAgent,
}

impl AgentType {
    pub fn as_str(&self) -> &'static str {
        match self {
            AgentType::CoordinatorAgent => "coordinator",
            AgentType::CodeGenAgent => "codegen",
            AgentType::ReviewAgent => "review",
            AgentType::IssueAgent => "issue",
            AgentType::PRAgent => "pr",
            AgentType::DeploymentAgent => "deployment",
            AgentType::RefresherAgent => "refresher",
            AgentType::AIEntrepreneurAgent => "ai-entrepreneur",
            AgentType::ProductConceptAgent => "product-concept",
            AgentType::ProductDesignAgent => "product-design",
            AgentType::FunnelDesignAgent => "funnel-design",
            AgentType::PersonaAgent => "persona",
            AgentType::SelfAnalysisAgent => "self-analysis",
            AgentType::MarketResearchAgent => "market-research",
            AgentType::MarketingAgent => "marketing",
            AgentType::ContentCreationAgent => "content-creation",
            AgentType::SNSStrategyAgent => "sns-strategy",
            AgentType::YouTubeAgent => "youtube",
            AgentType::SalesAgent => "sales",
            AgentType::CRMAgent => "crm",
            AgentType::AnalyticsAgent => "analytics",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            AgentType::CoordinatorAgent => "しきるん (CoordinatorAgent)",
            AgentType::CodeGenAgent => "つくるん (CodeGenAgent)",
            AgentType::ReviewAgent => "めだまん (ReviewAgent)",
            AgentType::IssueAgent => "みつけるん (IssueAgent)",
            AgentType::PRAgent => "まとめるん (PRAgent)",
            AgentType::DeploymentAgent => "はこぶん (DeploymentAgent)",
            AgentType::RefresherAgent => "つなぐん (RefresherAgent)",
            AgentType::AIEntrepreneurAgent => "AI起業家Agent",
            AgentType::ProductConceptAgent => "プロダクトコンセプトAgent",
            AgentType::ProductDesignAgent => "プロダクトデザインAgent",
            AgentType::FunnelDesignAgent => "ファネルデザインAgent",
            AgentType::PersonaAgent => "ペルソナAgent",
            AgentType::SelfAnalysisAgent => "自己分析Agent",
            AgentType::MarketResearchAgent => "市場調査Agent",
            AgentType::MarketingAgent => "マーケティングAgent",
            AgentType::ContentCreationAgent => "コンテンツ制作Agent",
            AgentType::SNSStrategyAgent => "SNS戦略Agent",
            AgentType::YouTubeAgent => "YouTube運用Agent",
            AgentType::SalesAgent => "セールスAgent",
            AgentType::CRMAgent => "CRM管理Agent",
            AgentType::AnalyticsAgent => "データ分析Agent",
        }
    }
}

/// Agent execution request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionRequest {
    pub agent_type: AgentType,
    pub issue_number: Option<u64>,
    pub args: Vec<String>,
}

/// Agent execution status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentExecutionStatus {
    Starting,
    Running,
    Success,
    Failed,
    Stopped,
}

/// Agent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionResult {
    pub execution_id: String,
    pub agent_type: AgentType,
    pub status: AgentExecutionStatus,
    pub exit_code: Option<i32>,
    pub duration_ms: Option<u64>,
    pub output: Vec<String>,
}

/// Execute an agent
pub async fn execute_agent(
    request: AgentExecutionRequest,
    app_handle: AppHandle,
) -> Result<AgentExecutionResult, String> {
    let execution_id = uuid::Uuid::new_v4().to_string();
    let start_time = std::time::Instant::now();

    // Emit starting event
    let _ = app_handle.emit(
        "agent-execution-status",
        AgentExecutionResult {
            execution_id: execution_id.clone(),
            agent_type: request.agent_type.clone(),
            status: AgentExecutionStatus::Starting,
            exit_code: None,
            duration_ms: None,
            output: vec![],
        },
    );

    // Give frontend 100ms to register output listener
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Build miyabi CLI command
    // Find project root (parent of miyabi-desktop)
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;

    let project_root = current_dir
        .parent()
        .ok_or("Failed to find project root")?;

    // Use the release binary directly for better performance
    let miyabi_binary = project_root.join("target/release/miyabi");

    // Fallback to cargo run if release binary doesn't exist
    let mut cmd = if miyabi_binary.exists() {
        let mut c = Command::new(&miyabi_binary);
        c.arg("agent")
            .arg("run")
            .arg(request.agent_type.as_str());
        c
    } else {
        let mut c = Command::new("cargo");
        c.arg("run")
            .arg("--release")
            .arg("--bin")
            .arg("miyabi")
            .arg("--")
            .arg("agent")
            .arg("run")
            .arg(request.agent_type.as_str());
        c
    };

    if let Some(issue) = request.issue_number {
        cmd.arg("--issue").arg(issue.to_string());
    }

    for arg in &request.args {
        cmd.arg(arg);
    }

    cmd.current_dir(project_root);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    // Spawn process
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn agent: {}", e))?;

    // Emit running event
    let _ = app_handle.emit(
        "agent-execution-status",
        AgentExecutionResult {
            execution_id: execution_id.clone(),
            agent_type: request.agent_type.clone(),
            status: AgentExecutionStatus::Running,
            exit_code: None,
            duration_ms: Some(start_time.elapsed().as_millis() as u64),
            output: vec![],
        },
    );

    // Read stdout in background task
    let stdout_handle = if let Some(stdout) = child.stdout.take() {
        let execution_id_clone = execution_id.clone();
        let app_handle_clone = app_handle.clone();

        Some(tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                eprintln!("[DEBUG] Emitting stdout: {}", line);
                let _ = app_handle_clone.emit(&format!("agent-output-{}", execution_id_clone), &line);
            }
        }))
    } else {
        None
    };

    // Read stderr in background task
    let stderr_handle = if let Some(stderr) = child.stderr.take() {
        let execution_id_clone = execution_id.clone();
        let app_handle_clone = app_handle.clone();

        Some(tokio::spawn(async move {
            let reader = BufReader::new(stderr);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                eprintln!("[DEBUG] Emitting stderr: {}", line);
                let _ = app_handle_clone.emit(&format!("agent-output-{}", execution_id_clone), &line);
            }
        }))
    } else {
        None
    };

    // Wait for completion
    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait for agent: {}", e))?;

    // Wait for output handlers to complete
    if let Some(handle) = stdout_handle {
        let _ = handle.await;
        eprintln!("[DEBUG] stdout handler completed");
    }
    if let Some(handle) = stderr_handle {
        let _ = handle.await;
        eprintln!("[DEBUG] stderr handler completed");
    }

    let exit_code = status.code();
    let duration_ms = start_time.elapsed().as_millis() as u64;
    let execution_status = if status.success() {
        AgentExecutionStatus::Success
    } else {
        AgentExecutionStatus::Failed
    };

    // Emit completion event
    let result = AgentExecutionResult {
        execution_id: execution_id.clone(),
        agent_type: request.agent_type,
        status: execution_status,
        exit_code,
        duration_ms: Some(duration_ms),
        output: vec![], // Output is streamed via events, not collected here
    };

    let _ = app_handle.emit("agent-execution-status", &result);

    Ok(result)
}
