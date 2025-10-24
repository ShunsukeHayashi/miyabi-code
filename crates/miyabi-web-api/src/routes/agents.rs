//! Agent execution route handlers

use crate::{
    error::{AppError, Result},
    middleware::AuthenticatedUser,
    models::{AgentExecution, ExecuteAgentRequest, ExecutionLog},
    services::AgentExecutor,
    AppState,
};
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Agent metadata for workflow editor
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
pub struct AgentMetadata {
    pub id: String,
    pub name: String,
    pub category: AgentCategory,
    pub description: String,
    pub icon: String,
    pub capabilities: Vec<String>,
}

/// Agent category
#[derive(Debug, Clone, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum AgentCategory {
    Coding,
    Business,
}

/// Execute agent
///
/// Starts an agent execution for a GitHub issue
#[utoipa::path(
    post,
    path = "/api/v1/agents/execute",
    tag = "agents",
    request_body = ExecuteAgentRequest,
    responses(
        (status = 201, description = "Agent execution started", body = AgentExecution),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn execute_agent(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Json(request): Json<ExecuteAgentRequest>,
) -> Result<(StatusCode, Json<AgentExecution>)> {
    // Verify user has access to repository
    let _repository = sqlx::query(
        r#"
        SELECT id FROM repositories
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(request.repository_id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Repository not found".to_string()))?;

    // Create execution record with options
    let agent_type_str = request.agent_type.to_string();
    let options_json = request.options.as_ref().map(|opts| {
        serde_json::to_value(opts).unwrap_or(serde_json::json!({}))
    });

    let execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        INSERT INTO agent_executions (user_id, repository_id, issue_number, agent_type, status, options)
        VALUES ($1, $2, $3, $4, 'pending', $5)
        RETURNING id, repository_id, issue_number, agent_type, status, started_at, completed_at,
                  result_summary, quality_score, pr_number, created_at, updated_at
        "#,
    )
    .bind(auth_user.user_id)
    .bind(request.repository_id)
    .bind(request.issue_number)
    .bind(&agent_type_str)
    .bind(options_json)
    .fetch_one(&state.db)
    .await?;

    // Trigger agent execution in background with event broadcasting
    let executor = AgentExecutor::with_events(state.db.clone(), state.event_broadcaster.clone());
    executor
        .execute_agent(
            execution.id,
            request.repository_id,
            request.issue_number,
            agent_type_str.clone(),
            request.options,
        )
        .await?;

    tracing::info!(
        "Agent execution started: id={}, repository={}, issue={}, agent={}",
        execution.id,
        request.repository_id,
        request.issue_number,
        request.agent_type
    );

    Ok((StatusCode::CREATED, Json(execution)))
}

/// List agent executions
///
/// Returns execution history for user's repositories
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions",
    tag = "agents",
    responses(
        (status = 200, description = "List of executions", body = Vec<AgentExecution>),
        (status = 401, description = "Unauthorized"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_executions(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
) -> Result<Json<Vec<AgentExecution>>> {
    // Query executions for user's repositories
    let executions = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE r.user_id = $1
        ORDER BY ae.created_at DESC
        LIMIT 100
        "#,
    )
    .bind(auth_user.user_id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(executions))
}

/// Get agent execution by ID
///
/// Returns execution details and results
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions/{id}",
    tag = "agents",
    params(
        ("id" = Uuid, Path, description = "Execution ID")
    ),
    responses(
        (status = 200, description = "Execution details", body = AgentExecution),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Execution not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_execution(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<AgentExecution>> {
    // Query execution with user verification
    let execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE ae.id = $1 AND r.user_id = $2
        "#,
    )
    .bind(id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Execution not found".to_string()))?;

    Ok(Json(execution))
}

/// Get execution logs
///
/// Returns logs for a specific agent execution
#[utoipa::path(
    get,
    path = "/api/v1/agents/executions/{id}/logs",
    tag = "agents",
    params(
        ("id" = Uuid, Path, description = "Execution ID")
    ),
    responses(
        (status = 200, description = "Execution logs", body = Vec<ExecutionLog>),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Execution not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_execution_logs(
    Extension(auth_user): Extension<AuthenticatedUser>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<ExecutionLog>>> {
    // Verify user has access to execution
    let _execution = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT ae.id, ae.repository_id, ae.issue_number, ae.agent_type, ae.status,
               ae.started_at, ae.completed_at, ae.result_summary, ae.quality_score,
               ae.pr_number, ae.created_at, ae.updated_at
        FROM agent_executions ae
        INNER JOIN repositories r ON ae.repository_id = r.id
        WHERE ae.id = $1 AND r.user_id = $2
        "#,
    )
    .bind(id)
    .bind(auth_user.user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Execution not found".to_string()))?;

    // Get logs
    let executor = AgentExecutor::new(state.db.clone());
    let logs = executor.get_logs(id, Some(10000)).await?;

    Ok(Json(logs))
}

/// List available agents
///
/// Returns metadata for all 21 agents (7 Coding + 14 Business)
#[utoipa::path(
    get,
    path = "/api/v1/agents",
    tag = "agents",
    responses(
        (status = 200, description = "List of available agents", body = Vec<AgentMetadata>),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn list_agents() -> Result<Json<Vec<AgentMetadata>>> {
    // Coding agents (7)
    let coding_agents = vec![
        AgentMetadata {
            id: "coordinator".to_string(),
            name: "Coordinator Agent".to_string(),
            category: AgentCategory::Coding,
            description: "Orchestrates tasks and manages DAG-based workflows".to_string(),
            icon: "🎯".to_string(),
            capabilities: vec!["Task decomposition".to_string(), "DAG planning".to_string(), "Parallel execution".to_string()],
        },
        AgentMetadata {
            id: "codegen".to_string(),
            name: "CodeGen Agent".to_string(),
            category: AgentCategory::Coding,
            description: "AI-driven code generation with Claude Sonnet 4".to_string(),
            icon: "💻".to_string(),
            capabilities: vec!["Code generation".to_string(), "Bug fixing".to_string(), "Refactoring".to_string()],
        },
        AgentMetadata {
            id: "review".to_string(),
            name: "Review Agent".to_string(),
            category: AgentCategory::Coding,
            description: "Code quality review with 100-point scoring".to_string(),
            icon: "👀".to_string(),
            capabilities: vec!["Static analysis".to_string(), "Security scan".to_string(), "Quality scoring".to_string()],
        },
        AgentMetadata {
            id: "issue".to_string(),
            name: "Issue Agent".to_string(),
            category: AgentCategory::Coding,
            description: "Issue analysis and automatic labeling".to_string(),
            icon: "🔍".to_string(),
            capabilities: vec!["Label inference".to_string(), "Issue triage".to_string(), "Priority assessment".to_string()],
        },
        AgentMetadata {
            id: "pr".to_string(),
            name: "PR Agent".to_string(),
            category: AgentCategory::Coding,
            description: "Automated Pull Request creation with Conventional Commits".to_string(),
            icon: "🔀".to_string(),
            capabilities: vec!["PR generation".to_string(), "Commit formatting".to_string(), "Branch management".to_string()],
        },
        AgentMetadata {
            id: "deployment".to_string(),
            name: "Deployment Agent".to_string(),
            category: AgentCategory::Coding,
            description: "CI/CD deployment automation with health checks".to_string(),
            icon: "🚀".to_string(),
            capabilities: vec!["Firebase deploy".to_string(), "Health monitoring".to_string(), "Auto rollback".to_string()],
        },
        AgentMetadata {
            id: "refresher".to_string(),
            name: "Refresher Agent".to_string(),
            category: AgentCategory::Coding,
            description: "Issue state monitoring and automatic updates".to_string(),
            icon: "🔄".to_string(),
            capabilities: vec!["State tracking".to_string(), "Auto-update".to_string(), "Status sync".to_string()],
        },
    ];

    // Business agents (14)
    let business_agents = vec![
        AgentMetadata {
            id: "ai-entrepreneur".to_string(),
            name: "AI Entrepreneur Agent".to_string(),
            category: AgentCategory::Business,
            description: "Comprehensive business plan creation and startup strategy".to_string(),
            icon: "🚀".to_string(),
            capabilities: vec!["Business planning".to_string(), "Market validation".to_string(), "Revenue modeling".to_string()],
        },
        AgentMetadata {
            id: "product-concept".to_string(),
            name: "Product Concept Agent".to_string(),
            category: AgentCategory::Business,
            description: "USP design and business model canvas".to_string(),
            icon: "💡".to_string(),
            capabilities: vec!["USP design".to_string(), "Business canvas".to_string(), "Revenue model".to_string()],
        },
        AgentMetadata {
            id: "product-design".to_string(),
            name: "Product Design Agent".to_string(),
            category: AgentCategory::Business,
            description: "6-month content and technical stack planning".to_string(),
            icon: "🎨".to_string(),
            capabilities: vec!["Service design".to_string(), "Tech stack".to_string(), "MVP definition".to_string()],
        },
        AgentMetadata {
            id: "funnel-design".to_string(),
            name: "Funnel Design Agent".to_string(),
            category: AgentCategory::Business,
            description: "Customer funnel optimization from awareness to LTV".to_string(),
            icon: "📊".to_string(),
            capabilities: vec!["Funnel design".to_string(), "LTV optimization".to_string(), "Conversion tracking".to_string()],
        },
        AgentMetadata {
            id: "persona".to_string(),
            name: "Persona Agent".to_string(),
            category: AgentCategory::Business,
            description: "Detailed persona (3-5 profiles) and customer journey design".to_string(),
            icon: "👥".to_string(),
            capabilities: vec!["Persona creation".to_string(), "Journey mapping".to_string(), "Segmentation".to_string()],
        },
        AgentMetadata {
            id: "self-analysis".to_string(),
            name: "Self Analysis Agent".to_string(),
            category: AgentCategory::Business,
            description: "Career, skills, and achievement analysis".to_string(),
            icon: "🔬".to_string(),
            capabilities: vec!["Career analysis".to_string(), "Skill mapping".to_string(), "Achievement tracking".to_string()],
        },
        AgentMetadata {
            id: "market-research".to_string(),
            name: "Market Research Agent".to_string(),
            category: AgentCategory::Business,
            description: "Competitor analysis (20+ companies) and market trends".to_string(),
            icon: "📈".to_string(),
            capabilities: vec!["Competitor research".to_string(), "Market trends".to_string(), "TAM/SAM/SOM".to_string()],
        },
        AgentMetadata {
            id: "marketing".to_string(),
            name: "Marketing Agent".to_string(),
            category: AgentCategory::Business,
            description: "Advertising, SEO, and SNS-driven customer acquisition".to_string(),
            icon: "📣".to_string(),
            capabilities: vec!["Ad campaigns".to_string(), "SEO strategy".to_string(), "SNS marketing".to_string()],
        },
        AgentMetadata {
            id: "content-creation".to_string(),
            name: "Content Creation Agent".to_string(),
            category: AgentCategory::Business,
            description: "Video, articles, and educational content production".to_string(),
            icon: "📝".to_string(),
            capabilities: vec!["Video production".to_string(), "Article writing".to_string(), "Tutorial creation".to_string()],
        },
        AgentMetadata {
            id: "sns-strategy".to_string(),
            name: "SNS Strategy Agent".to_string(),
            category: AgentCategory::Business,
            description: "Twitter/Instagram/LinkedIn strategy and posting calendar".to_string(),
            icon: "📱".to_string(),
            capabilities: vec!["Platform strategy".to_string(), "Content calendar".to_string(), "Engagement growth".to_string()],
        },
        AgentMetadata {
            id: "youtube".to_string(),
            name: "YouTube Agent".to_string(),
            category: AgentCategory::Business,
            description: "Channel optimization and 13-workflow video strategy".to_string(),
            icon: "🎥".to_string(),
            capabilities: vec!["Channel design".to_string(), "Video planning".to_string(), "SEO optimization".to_string()],
        },
        AgentMetadata {
            id: "sales".to_string(),
            name: "Sales Agent".to_string(),
            category: AgentCategory::Business,
            description: "Lead-to-customer conversion and sales process optimization".to_string(),
            icon: "💼".to_string(),
            capabilities: vec!["Lead conversion".to_string(), "Sales funnel".to_string(), "Process optimization".to_string()],
        },
        AgentMetadata {
            id: "crm".to_string(),
            name: "CRM Agent".to_string(),
            category: AgentCategory::Business,
            description: "Customer satisfaction and LTV maximization".to_string(),
            icon: "🤝".to_string(),
            capabilities: vec!["Customer success".to_string(), "LTV tracking".to_string(), "Churn reduction".to_string()],
        },
        AgentMetadata {
            id: "analytics".to_string(),
            name: "Analytics Agent".to_string(),
            category: AgentCategory::Business,
            description: "Data analysis, PDCA cycles, and continuous improvement".to_string(),
            icon: "📊".to_string(),
            capabilities: vec!["KPI tracking".to_string(), "PDCA execution".to_string(), "Growth analysis".to_string()],
        },
    ];

    let mut all_agents = coding_agents;
    all_agents.extend(business_agents);

    Ok(Json(all_agents))
}
