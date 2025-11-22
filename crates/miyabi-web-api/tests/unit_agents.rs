//! Agent Management Unit Tests
//!
//! Tests for agent listing, status queries, execution, and metadata management.
//! Target: 80% coverage of routes/agents.rs

mod helpers;

use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use miyabi_web_api::routes::agents::{self, AgentMetadata, AgentType, AgentsListResponse};
use serde_json::Value;
use tower::ServiceExt;

/// Create test router with agent routes
fn create_agent_router() -> Router {
    agents::routes()
}

/// Helper to make GET requests
async fn get_request(router: Router, uri: &str) -> (StatusCode, String) {
    let request = Request::builder()
        .uri(uri)
        .method("GET")
        .body(Body::empty())
        .unwrap();

    let response = router.oneshot(request).await.unwrap();
    let status = response.status();

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body_string = String::from_utf8(body_bytes.to_vec()).unwrap();

    (status, body_string)
}

/// Helper to make POST requests
async fn post_request(router: Router, uri: &str, body: &str) -> (StatusCode, String) {
    let request = Request::builder()
        .uri(uri)
        .method("POST")
        .header("content-type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();

    let response = router.oneshot(request).await.unwrap();
    let status = response.status();

    let body_bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let body_string = String::from_utf8(body_bytes.to_vec()).unwrap();

    (status, body_string)
}

// ========================================
// Module 1: Agent List and Query Tests (6 tests)
// ========================================

#[tokio::test]
async fn test_list_all_agents() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body)
        .expect("Should parse as AgentsListResponse");

    // Verify total count (7 Coding + 14 Business = 21)
    assert_eq!(response.agents.len(), 21, "Expected 21 agents");
}

#[tokio::test]
async fn test_list_agents_response_structure() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).expect("Should be valid JSON");

    // Verify root structure
    assert!(json.get("agents").is_some(), "Response should have 'agents' field");
    assert!(json["agents"].is_array(), "agents should be an array");

    // Verify first agent structure
    let first_agent = &json["agents"][0];
    assert!(first_agent.get("name").is_some(), "Agent should have 'name'");
    assert!(first_agent.get("type").is_some(), "Agent should have 'type'");
    assert!(first_agent.get("status").is_some(), "Agent should have 'status'");
    assert!(first_agent.get("capabilities").is_some(), "Agent should have 'capabilities'");
}

#[tokio::test]
async fn test_agent_count_by_type() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    let coding_count = response.agents.iter()
        .filter(|a| a.agent_type == AgentType::Coding)
        .count();
    let business_count = response.agents.iter()
        .filter(|a| a.agent_type == AgentType::Business)
        .count();

    assert_eq!(coding_count, 7, "Expected 7 Coding agents");
    assert_eq!(business_count, 14, "Expected 14 Business agents");
}

#[tokio::test]
async fn test_agent_metadata_completeness() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    for agent in &response.agents {
        assert!(!agent.name.is_empty(), "Agent name should not be empty");
        assert!(!agent.status.is_empty(), "Agent status should not be empty");
        assert!(!agent.capabilities.is_empty(), "Agent should have at least one capability");
    }
}

#[tokio::test]
async fn test_filter_agents_by_type_coding() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    let coding_agents: Vec<&AgentMetadata> = response.agents.iter()
        .filter(|a| a.agent_type == AgentType::Coding)
        .collect();

    let expected_coding_agents = vec![
        "CoordinatorAgent",
        "CodeGenAgent",
        "ReviewAgent",
        "IssueAgent",
        "PRAgent",
        "DeploymentAgent",
        "RefresherAgent",
    ];

    assert_eq!(coding_agents.len(), expected_coding_agents.len());

    for expected_name in &expected_coding_agents {
        assert!(
            coding_agents.iter().any(|a| a.name == *expected_name),
            "Missing coding agent: {}",
            expected_name
        );
    }
}

#[tokio::test]
async fn test_filter_agents_by_type_business() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    let business_agents: Vec<&AgentMetadata> = response.agents.iter()
        .filter(|a| a.agent_type == AgentType::Business)
        .collect();

    let expected_business_agents = vec![
        "AIEntrepreneurAgent",
        "SelfAnalysisAgent",
        "MarketResearchAgent",
        "PersonaAgent",
        "ProductConceptAgent",
        "ProductDesignAgent",
        "ContentCreationAgent",
        "FunnelDesignAgent",
        "SNSStrategyAgent",
        "MarketingAgent",
        "SalesAgent",
        "CRMAgent",
        "AnalyticsAgent",
        "YouTubeAgent",
    ];

    assert_eq!(business_agents.len(), expected_business_agents.len());

    for expected_name in &expected_business_agents {
        assert!(
            business_agents.iter().any(|a| a.name == *expected_name),
            "Missing business agent: {}",
            expected_name
        );
    }
}

// ========================================
// Module 2: Agent Status Tests (4 tests)
// ========================================

#[tokio::test]
async fn test_get_agent_status_success() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/CoordinatorAgent").await;

    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    assert!(agent.is_some(), "CoordinatorAgent should exist");

    let agent = agent.unwrap();
    assert_eq!(agent.name, "CoordinatorAgent");
    assert_eq!(agent.agent_type, AgentType::Coding);
}

#[tokio::test]
async fn test_get_agent_status_not_found() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/NonExistentAgent").await;

    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    assert!(agent.is_none(), "NonExistentAgent should return None");
}

#[tokio::test]
async fn test_get_agent_status_case_sensitive() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/coordinatoragent").await;

    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    assert!(agent.is_none(), "Lowercase name should not match");
}

#[tokio::test]
async fn test_get_all_agent_statuses() {
    let router = create_agent_router();

    let all_agents = vec![
        "CoordinatorAgent", "CodeGenAgent", "ReviewAgent", "IssueAgent",
        "PRAgent", "DeploymentAgent", "RefresherAgent",
        "AIEntrepreneurAgent", "SelfAnalysisAgent", "MarketResearchAgent",
        "PersonaAgent", "ProductConceptAgent", "ProductDesignAgent",
        "ContentCreationAgent", "FunnelDesignAgent", "SNSStrategyAgent",
        "MarketingAgent", "SalesAgent", "CRMAgent", "AnalyticsAgent",
        "YouTubeAgent",
    ];

    for agent_name in &all_agents {
        let (status, body) = get_request(router.clone(), &format!("/{}", agent_name)).await;
        assert_eq!(status, StatusCode::OK, "Failed to get status for {}", agent_name);

        let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
        assert!(agent.is_some(), "Agent {} should exist", agent_name);
        assert_eq!(agent.unwrap().name, *agent_name);
    }
}

// ========================================
// Module 3: Agent Execution Tests (5 tests)
// ========================================

#[tokio::test]
async fn test_execute_agent_with_issue() {
    let router = create_agent_router();
    let (status, body) = post_request(
        router,
        "/CoordinatorAgent/execute",
        r#"{"issue_number": 123}"#
    ).await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).unwrap();
    assert!(json.get("success").is_some());
    assert!(json.get("message").is_some());
}

#[tokio::test]
async fn test_execute_agent_with_task_id() {
    let router = create_agent_router();
    let (status, body) = post_request(
        router,
        "/CodeGenAgent/execute",
        r#"{"task_id": "task-123"}"#
    ).await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).unwrap();
    assert!(json.get("success").is_some());
}

#[tokio::test]
async fn test_execute_agent_empty_payload() {
    let router = create_agent_router();
    let (status, body) = post_request(
        router,
        "/ReviewAgent/execute",
        r#"{}"#
    ).await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).unwrap();
    assert!(json.get("success").is_some());
}

#[tokio::test]
async fn test_execute_coordinator_agent() {
    let router = create_agent_router();
    let (status, body) = post_request(
        router,
        "/CoordinatorAgent/execute",
        r#"{"issue_number": 999}"#
    ).await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).unwrap();
    let message = json.get("message").and_then(|m| m.as_str()).unwrap_or("");
    assert!(message.contains("CoordinatorAgent"), "Message should mention agent name");
}

#[tokio::test]
async fn test_execute_business_agent() {
    let router = create_agent_router();
    let (status, body) = post_request(
        router,
        "/MarketingAgent/execute",
        r#"{"task_id": "marketing-task-1"}"#
    ).await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).unwrap();
    assert!(json.get("success").is_some());
}

// ========================================
// Module 4: Agent Capabilities Tests (3 tests)
// ========================================

#[tokio::test]
async fn test_coordinator_capabilities() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/CoordinatorAgent").await;

    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    let agent = agent.expect("CoordinatorAgent should exist");

    let expected_capabilities = vec![
        "task_planning",
        "dag_scheduling",
        "parallel_execution",
        "worktree_management",
    ];

    assert_eq!(agent.capabilities.len(), expected_capabilities.len());

    for cap in &expected_capabilities {
        assert!(
            agent.capabilities.iter().any(|c| c == cap),
            "Missing capability: {}",
            cap
        );
    }
}

#[tokio::test]
async fn test_codegen_capabilities() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/CodeGenAgent").await;

    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    let agent = agent.expect("CodeGenAgent should exist");

    let expected_capabilities = vec![
        "code_generation",
        "implementation",
        "testing",
    ];

    assert_eq!(agent.capabilities.len(), expected_capabilities.len());
}

#[tokio::test]
async fn test_all_agents_have_capabilities() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    for agent in &response.agents {
        assert!(
            !agent.capabilities.is_empty(),
            "Agent {} has no capabilities",
            agent.name
        );
    }
}

// ========================================
// Module 5: Agent Type Classification Tests (2 tests)
// ========================================

#[tokio::test]
async fn test_agent_type_enum_serialization() {
    // Test AgentType serialization
    let coding = AgentType::Coding;
    let business = AgentType::Business;

    let coding_json = serde_json::to_string(&coding).unwrap();
    let business_json = serde_json::to_string(&business).unwrap();

    assert_eq!(coding_json, "\"Coding\"", "Coding should serialize to PascalCase");
    assert_eq!(business_json, "\"Business\"", "Business should serialize to PascalCase");
}

#[tokio::test]
async fn test_agent_type_consistency() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();

    // Verify coding agent names end with "Agent" and are in coding list
    let coding_names = vec![
        "CoordinatorAgent", "CodeGenAgent", "ReviewAgent", "IssueAgent",
        "PRAgent", "DeploymentAgent", "RefresherAgent",
    ];

    for agent in &response.agents {
        if coding_names.contains(&agent.name.as_str()) {
            assert_eq!(
                agent.agent_type, AgentType::Coding,
                "{} should be Coding type",
                agent.name
            );
        } else {
            assert_eq!(
                agent.agent_type, AgentType::Business,
                "{} should be Business type",
                agent.name
            );
        }
    }
}

// ========================================
// Integration Tests
// ========================================

#[tokio::test]
async fn test_agent_workflow_end_to_end() {
    let router = create_agent_router();

    // Step 1: List all agents
    let (status, body) = get_request(router.clone(), "/").await;
    assert_eq!(status, StatusCode::OK);

    let response: AgentsListResponse = serde_json::from_str(&body).unwrap();
    assert!(!response.agents.is_empty());

    // Step 2: Get specific agent status
    let (status, body) = get_request(router.clone(), "/CoordinatorAgent").await;
    assert_eq!(status, StatusCode::OK);

    let agent: Option<AgentMetadata> = serde_json::from_str(&body).unwrap();
    assert!(agent.is_some());

    // Step 3: Execute agent
    let (status, body) = post_request(
        router,
        "/CoordinatorAgent/execute",
        r#"{"issue_number": 123}"#
    ).await;
    assert_eq!(status, StatusCode::OK);

    // Step 4: Verify execution response
    let json: Value = serde_json::from_str(&body).unwrap();
    assert!(json.get("success").is_some());
}

#[tokio::test]
async fn test_agent_response_json_schema() {
    let router = create_agent_router();
    let (status, body) = get_request(router, "/").await;

    assert_eq!(status, StatusCode::OK);

    let json: Value = serde_json::from_str(&body).expect("Response should be valid JSON");

    // Validate schema
    let agents = json["agents"].as_array().expect("agents should be array");

    for agent in agents {
        // Required fields
        assert!(agent.get("name").is_some(), "Missing 'name'");
        assert!(agent.get("type").is_some(), "Missing 'type'");
        assert!(agent.get("status").is_some(), "Missing 'status'");
        assert!(agent.get("capabilities").is_some(), "Missing 'capabilities'");

        // Type validation
        assert!(agent["name"].is_string(), "name should be string");
        assert!(agent["status"].is_string(), "status should be string");
        assert!(agent["capabilities"].is_array(), "capabilities should be array");

        // Enum validation
        let agent_type = agent["type"].as_str().unwrap();
        assert!(
            agent_type == "Coding" || agent_type == "Business",
            "type should be Coding or Business, got: {}",
            agent_type
        );
    }
}
