//! Integration tests for Potpie API client

use miyabi_potpie::{PotpieClient, PotpieConfig};
use mockito::Server;
use serde_json::json;

/// Helper to create test client
async fn create_test_client(server_url: &str) -> PotpieClient {
    let config = PotpieConfig {
        api_url: server_url.to_string(),
        auth_token: Some("test-token".to_string()),
        timeout_seconds: 5,
        cache_ttl_seconds: 60,
        fallback_to_git: true,
    };

    PotpieClient::new(config).expect("Failed to create test client")
}

#[tokio::test]
async fn test_health_check_success() {
    let mut server = Server::new_async().await;
    let mock = server
        .mock("GET", "/health")
        .with_status(200)
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.health_check().await;

    mock.assert_async().await;
    assert!(result.is_ok());
    assert!(result.unwrap());
}

#[tokio::test]
async fn test_health_check_failure() {
    let mut server = Server::new_async().await;
    let mock = server
        .mock("GET", "/health")
        .with_status(503)
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.health_check().await;

    mock.assert_async().await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_search_nodes() {
    let mut server = Server::new_async().await;

    let response_body = json!([
        {
            "id": "node1",
            "node_type": "function",
            "name": "authenticate_user",
            "file_path": "src/auth.rs",
            "line_range": [10, 25],
            "metadata": {}
        }
    ]);

    let mock = server
        .mock("POST", "/api/v1/search_nodes")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.search_nodes("authenticate", None).await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let nodes = result.unwrap();
    assert_eq!(nodes.len(), 1);
    assert_eq!(nodes[0].name, "authenticate_user");
}

#[tokio::test]
async fn test_get_code_graph() {
    let mut server = Server::new_async().await;

    let response_body = json!({
        "nodes": [
            {
                "id": "node1",
                "node_type": "function",
                "name": "main",
                "file_path": "src/main.rs",
                "line_range": [1, 10],
                "metadata": {}
            }
        ],
        "edges": [
            {
                "from_id": "node1",
                "to_id": "node2",
                "edge_type": "calls",
                "metadata": {}
            }
        ],
        "metadata": {}
    });

    let mock = server
        .mock("POST", "/api/v1/get_code_graph")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.get_code_graph("src/main.rs", Some(2)).await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let graph = result.unwrap();
    assert_eq!(graph.nodes.len(), 1);
    assert_eq!(graph.edges.len(), 1);
}

#[tokio::test]
async fn test_detect_changes() {
    let mut server = Server::new_async().await;

    let response_body = json!({
        "changed_files": ["src/auth.rs", "tests/auth_test.rs"],
        "affected_nodes": ["node1", "node2"],
        "impact_analysis": {
            "direct_impact": ["authenticate_user"],
            "indirect_impact": ["check_permissions"],
            "affected_tests": ["test_authentication"],
            "risk_level": 5
        }
    });

    let mock = server
        .mock("POST", "/api/v1/detect_changes")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.detect_changes("abc123", "def456").await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let changes = result.unwrap();
    assert_eq!(changes.changed_files.len(), 2);
    assert_eq!(changes.impact_analysis.risk_level, 5);
}

#[tokio::test]
async fn test_get_file_structure() {
    let mut server = Server::new_async().await;

    let response_body = json!({
        "path": "src/auth.rs",
        "file_type": "rust",
        "modules": [],
        "functions": [
            {
                "name": "authenticate",
                "line_range": [10, 20],
                "is_public": true,
                "is_async": true,
                "parameters": ["username", "password"],
                "return_type": "Result<User>"
            }
        ],
        "classes": [],
        "dependencies": ["tokio", "serde"]
    });

    let mock = server
        .mock("POST", "/api/v1/get_file_structure")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.get_file_structure("src/auth.rs").await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let structure = result.unwrap();
    assert_eq!(structure.file_type, "rust");
    assert_eq!(structure.functions.len(), 1);
    assert_eq!(structure.functions[0].name, "authenticate");
}

#[tokio::test]
async fn test_parse_ast() {
    let mut server = Server::new_async().await;

    let response_body = json!([
        {
            "node_type": "function_declaration",
            "name": "main",
            "line_range": [1, 10],
            "children": [],
            "properties": {}
        }
    ]);

    let mock = server
        .mock("POST", "/api/v1/parse_ast")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.parse_ast("src/main.rs").await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let ast_nodes = result.unwrap();
    assert_eq!(ast_nodes.len(), 1);
    assert_eq!(ast_nodes[0].node_type, "function_declaration");
}

#[tokio::test]
async fn test_track_dependencies() {
    let mut server = Server::new_async().await;

    let response_body = json!([
        {
            "name": "tokio",
            "dependency_type": "direct",
            "version": "1.40",
            "used_in": ["src/main.rs", "src/server.rs"]
        }
    ]);

    let mock = server
        .mock("POST", "/api/v1/track_dependencies")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.track_dependencies("miyabi-core").await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let deps = result.unwrap();
    assert_eq!(deps.len(), 1);
    assert_eq!(deps[0].name, "tokio");
}

#[tokio::test]
async fn test_analyze_git_diff() {
    let mut server = Server::new_async().await;

    let response_body = json!({
        "added_lines": 50,
        "removed_lines": 20,
        "modified_files": ["src/auth.rs"],
        "affected_symbols": ["authenticate_user", "check_token"],
        "complexity_delta": 15
    });

    let mock = server
        .mock("POST", "/api/v1/analyze_git_diff")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let diff = "diff --git a/src/auth.rs b/src/auth.rs\n+fn new_function() {}";
    let result = client.analyze_git_diff(diff).await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let analysis = result.unwrap();
    assert_eq!(analysis.added_lines, 50);
    assert_eq!(analysis.removed_lines, 20);
}

#[tokio::test]
async fn test_semantic_search() {
    let mut server = Server::new_async().await;

    let response_body = json!([
        {
            "node_id": "node1",
            "node_name": "authenticate_user",
            "file_path": "src/auth.rs",
            "score": 0.95,
            "snippet": "pub async fn authenticate_user(...) -> Result<User>",
            "explanation": "Handles user authentication with JWT tokens"
        }
    ]);

    let mock = server
        .mock("POST", "/api/v1/semantic_search")
        .with_status(200)
        .with_header("content-type", "application/json")
        .with_body(response_body.to_string())
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client
        .semantic_search("authentication logic", Some(5))
        .await;

    mock.assert_async().await;
    assert!(result.is_ok());
    let results = result.unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].node_name, "authenticate_user");
    assert!(results[0].score > 0.9);
}

#[tokio::test]
async fn test_api_error_handling() {
    let mut server = Server::new_async().await;

    let mock = server
        .mock("POST", "/api/v1/search_nodes")
        .with_status(500)
        .with_body("Internal server error")
        .create_async()
        .await;

    let client = create_test_client(&server.url()).await;
    let result = client.search_nodes("test", None).await;

    mock.assert_async().await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_timeout_handling() {
    let config = PotpieConfig {
        api_url: "http://10.255.255.1:8000".to_string(), // Non-routable IP
        timeout_seconds: 1,                              // Very short timeout
        ..Default::default()
    };

    let client = PotpieClient::new(config).expect("Failed to create client");
    let result = client.search_nodes("test", None).await;

    assert!(result.is_err());
    if let Err(e) = result {
        assert!(e.is_retryable());
    }
}
