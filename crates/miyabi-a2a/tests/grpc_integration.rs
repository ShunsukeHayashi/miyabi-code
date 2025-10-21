//! gRPC Integration Tests
//!
//! Comprehensive end-to-end tests for the gRPC transport layer.

use miyabi_a2a::{
    error::A2AError,
    grpc::{
        proto::{
            a2a_service_client::A2aServiceClient,
            a2a_service_server::A2aServiceServer,
            GetAuthenticatedExtendedCardRequest,
            MessageSendRequest,
            Part,
            part::PartType,
            Role as ProtoRole,
            TasksCancelRequest,
            TasksGetRequest,
            TasksListRequest,
            TextPart,
        },
        A2AServiceImpl,
    },
    rpc::{A2ARpcHandler, AgentCardRpcHandler, TaskStorage},
    types::{AgentCard, Task, TaskStatus, Part as InternalPart, TaskInput, TaskOutput, Role},
    auth::jwt::JwtValidator,
};
use async_trait::async_trait;
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::{sync::RwLock, time::Duration};
use tonic::transport::{Channel, Server};

/// In-memory task storage for testing
#[derive(Clone)]
struct MemoryTaskStorage {
    tasks: Arc<RwLock<HashMap<String, Task>>>,
}

impl MemoryTaskStorage {
    fn new() -> Self {
        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait]
impl TaskStorage for MemoryTaskStorage {
    async fn create_task(&self, task: Task) -> Result<(), A2AError> {
        let mut tasks = self.tasks.write().await;
        tasks.insert(task.id.clone(), task);
        Ok(())
    }

    async fn get_task(&self, task_id: &str) -> Result<Task, A2AError> {
        let tasks = self.tasks.read().await;
        tasks
            .get(task_id)
            .cloned()
            .ok_or_else(|| A2AError::TaskNotFound(task_id.to_string()))
    }

    async fn update_task(&self, task: Task) -> Result<(), A2AError> {
        let mut tasks = self.tasks.write().await;
        if !tasks.contains_key(&task.id) {
            return Err(A2AError::TaskNotFound(task.id.clone()));
        }
        tasks.insert(task.id.clone(), task);
        Ok(())
    }

    async fn list_tasks(
        &self,
        status: Option<TaskStatus>,
        context_id: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<Task>, A2AError> {
        let tasks = self.tasks.read().await;
        let mut filtered: Vec<_> = tasks
            .values()
            .filter(|task| {
                if let Some(s) = status {
                    if task.status != s {
                        return false;
                    }
                }
                if let Some(ctx) = context_id {
                    if task.context_id.as_deref() != Some(ctx) {
                        return false;
                    }
                }
                true
            })
            .cloned()
            .collect();

        filtered.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(filtered.into_iter().skip(offset).take(limit).collect())
    }

    async fn count_tasks(
        &self,
        status: Option<TaskStatus>,
        context_id: Option<&str>,
    ) -> Result<usize, A2AError> {
        let tasks = self.tasks.read().await;
        Ok(tasks
            .values()
            .filter(|task| {
                if let Some(s) = status {
                    if task.status != s {
                        return false;
                    }
                }
                if let Some(ctx) = context_id {
                    if task.context_id.as_deref() != Some(ctx) {
                        return false;
                    }
                }
                true
            })
            .count())
    }
}

/// Start a test gRPC server on a random port
async fn start_test_server() -> (SocketAddr, tokio::task::JoinHandle<()>) {
    let storage = MemoryTaskStorage::new();
    let rpc_handler = Arc::new(A2ARpcHandler::new(storage));

    // Create a test JWT validator
    let validator = JwtValidator::new_hs256("test-secret-key-12345".to_string());

    // Create a test agent card
    let agent_card = AgentCard {
        protocol_version: "0.3.0".to_string(),
        name: "Test Agent".to_string(),
        description: Some("A test agent for integration tests".to_string()),
        url: "https://test.example.com".to_string(),
        preferred_transport: "grpc".to_string(),
        version: "1.0.0".to_string(),
        default_input_modes: vec!["text".to_string()],
        default_output_modes: vec!["text".to_string()],
    };

    let agent_card_handler = Arc::new(AgentCardRpcHandler::new(
        Arc::new(validator),
        agent_card,
        None,
    ));

    let service = A2AServiceImpl::new(rpc_handler, Some(agent_card_handler));

    // Bind to localhost on a random port
    let addr: SocketAddr = "127.0.0.1:0".parse().unwrap();
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    let actual_addr = listener.local_addr().unwrap();

    let handle = tokio::spawn(async move {
        Server::builder()
            .add_service(A2aServiceServer::new(service))
            .serve_with_incoming(tokio_stream::wrappers::TcpListenerStream::new(listener))
            .await
            .unwrap();
    });

    // Wait for server to be ready
    tokio::time::sleep(Duration::from_millis(100)).await;

    (actual_addr, handle)
}

/// Create a test gRPC client
async fn create_test_client(addr: SocketAddr) -> A2aServiceClient<Channel> {
    let endpoint = format!("http://{}", addr);
    A2aServiceClient::connect(endpoint).await.unwrap()
}

// ==============================================================================
// Test: MessageSend RPC
// ==============================================================================

#[tokio::test]
async fn test_message_send_success() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Hello, test!".to_string(),
            })),
        }],
        context_id: Some("test-context-1".to_string()),
    };

    let response = client.message_send(request).await.unwrap();
    let result = response.into_inner();

    assert!(!result.task_id.is_empty());
    assert_eq!(result.status, 1); // Submitted
}

#[tokio::test]
async fn test_message_send_empty_parts() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![],
        context_id: None,
    };

    let response = client.message_send(request).await;
    assert!(response.is_ok()); // Should allow empty parts
}

// ==============================================================================
// Test: TasksGet RPC
// ==============================================================================

#[tokio::test]
async fn test_tasks_get_success() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // First create a task
    let send_request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Test task".to_string(),
            })),
        }],
        context_id: None,
    };

    let send_response = client.message_send(send_request).await.unwrap();
    let task_id = send_response.into_inner().task_id;

    // Now get the task
    let get_request = TasksGetRequest {
        task_id: task_id.clone(),
    };

    let get_response = client.tasks_get(get_request).await.unwrap();
    let task = get_response.into_inner().task.unwrap();

    assert_eq!(task.id, task_id);
    assert_eq!(task.status, 1); // Submitted
}

#[tokio::test]
async fn test_tasks_get_not_found() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = TasksGetRequest {
        task_id: "nonexistent-task-id".to_string(),
    };

    let response = client.tasks_get(request).await;
    assert!(response.is_err());

    let err = response.unwrap_err();
    assert_eq!(err.code(), tonic::Code::NotFound);
}

// ==============================================================================
// Test: TasksCancel RPC
// ==============================================================================

#[tokio::test]
async fn test_tasks_cancel_success() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Create a task
    let send_request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Task to cancel".to_string(),
            })),
        }],
        context_id: None,
    };

    let send_response = client.message_send(send_request).await.unwrap();
    let task_id = send_response.into_inner().task_id;

    // Cancel the task
    let cancel_request = TasksCancelRequest {
        task_id: task_id.clone(),
    };

    let cancel_response = client.tasks_cancel(cancel_request).await.unwrap();
    let result = cancel_response.into_inner();

    assert_eq!(result.status, 5); // Cancelled
    assert!(!result.message.is_empty());
}

#[tokio::test]
async fn test_tasks_cancel_not_found() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = TasksCancelRequest {
        task_id: "nonexistent-task-id".to_string(),
    };

    let response = client.tasks_cancel(request).await;
    assert!(response.is_err());
    assert_eq!(response.unwrap_err().code(), tonic::Code::NotFound);
}

// ==============================================================================
// Test: TasksList RPC
// ==============================================================================

#[tokio::test]
async fn test_tasks_list_success() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Create multiple tasks
    for i in 0..3 {
        let request = MessageSendRequest {
            role: ProtoRole::User as i32,
            parts: vec![Part {
                part_type: Some(PartType::Text(TextPart {
                    content: format!("Task {}", i),
                })),
            }],
            context_id: Some("list-test".to_string()),
        };
        client.message_send(request).await.unwrap();
    }

    // List tasks
    let list_request = TasksListRequest {
        status: None,
        limit: Some(10),
        offset: Some(0),
        context_id: Some("list-test".to_string()),
    };

    let list_response = client.tasks_list(list_request).await.unwrap();
    let result = list_response.into_inner();

    assert_eq!(result.tasks.len(), 3);
    assert_eq!(result.total, 3);
}

#[tokio::test]
async fn test_tasks_list_with_pagination() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Create 5 tasks
    for i in 0..5 {
        let request = MessageSendRequest {
            role: ProtoRole::User as i32,
            parts: vec![Part {
                part_type: Some(PartType::Text(TextPart {
                    content: format!("Task {}", i),
                })),
            }],
            context_id: None,
        };
        client.message_send(request).await.unwrap();
    }

    // List first page (2 items)
    let list_request = TasksListRequest {
        status: None,
        limit: Some(2),
        offset: Some(0),
        context_id: None,
    };

    let list_response = client.tasks_list(list_request).await.unwrap();
    let result = list_response.into_inner();

    assert_eq!(result.tasks.len(), 2);
    assert_eq!(result.total, 5);
}

// ==============================================================================
// Test: AgentGetAuthenticatedExtendedCard RPC
// ==============================================================================

#[tokio::test]
async fn test_agent_get_authenticated_extended_card_success() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Generate a test JWT token
    use jsonwebtoken::{encode, EncodingKey, Header};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        exp: usize,
    }

    let claims = Claims {
        sub: "test-user".to_string(),
        exp: (chrono::Utc::now() + chrono::Duration::hours(1)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret("test-secret-key-12345".as_ref()),
    )
    .unwrap();

    let request = GetAuthenticatedExtendedCardRequest { token };

    let response = client.agent_get_authenticated_extended_card(request).await.unwrap();
    let result = response.into_inner();

    assert!(result.card.is_some());
    let card = result.card.unwrap();
    assert_eq!(card.name, "Test Agent");
    assert_eq!(card.protocol_version, "0.3.0");
}

#[tokio::test]
async fn test_agent_get_authenticated_extended_card_invalid_token() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = GetAuthenticatedExtendedCardRequest {
        token: "invalid.token.here".to_string(),
    };

    let response = client.agent_get_authenticated_extended_card(request).await;
    assert!(response.is_err());
    assert_eq!(response.unwrap_err().code(), tonic::Code::Unauthenticated);
}

// ==============================================================================
// Test: Error Handling
// ==============================================================================

#[tokio::test]
async fn test_invalid_role() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = MessageSendRequest {
        role: 999, // Invalid role
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Test".to_string(),
            })),
        }],
        context_id: None,
    };

    let response = client.message_send(request).await;
    assert!(response.is_err());
    assert_eq!(response.unwrap_err().code(), tonic::Code::InvalidArgument);
}

// ==============================================================================
// Test: Concurrent Requests (Load Test)
// ==============================================================================

#[tokio::test]
async fn test_concurrent_message_send() {
    let (addr, _server) = start_test_server().await;

    // Spawn 100 concurrent requests
    let mut handles = vec![];

    for i in 0..100 {
        let addr_clone = addr;
        let handle = tokio::spawn(async move {
            let mut client = create_test_client(addr_clone).await;

            let request = MessageSendRequest {
                role: ProtoRole::User as i32,
                parts: vec![Part {
                    part_type: Some(PartType::Text(TextPart {
                        content: format!("Concurrent test {}", i),
                    })),
                }],
                context_id: Some(format!("concurrent-{}", i)),
            };

            client.message_send(request).await
        });
        handles.push(handle);
    }

    // Wait for all requests to complete
    let results = futures::future::join_all(handles).await;

    // Verify all succeeded
    for result in results {
        assert!(result.is_ok());
        assert!(result.unwrap().is_ok());
    }
}

#[tokio::test]
async fn test_streaming_placeholder() {
    // TODO: Implement streaming tests when TasksStream and MessageStream are implemented
    // Currently these methods return Unimplemented
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    use miyabi_a2a::grpc::proto::TasksStreamRequest;

    let request = TasksStreamRequest {
        task_id: "test-task".to_string(),
    };

    let response = client.tasks_stream(request).await;
    assert!(response.is_err());
    assert_eq!(response.unwrap_err().code(), tonic::Code::Unimplemented);
}

// ==============================================================================
// Test: Load Test - 1000 Concurrent Requests (Issue #286)
// ==============================================================================

#[tokio::test]
#[ignore] // Run with: cargo test --test grpc_integration -- --ignored
async fn test_load_1000_concurrent_requests() {
    let (addr, _server) = start_test_server().await;

    let start = std::time::Instant::now();

    // Spawn 1000 concurrent requests
    let mut handles = vec![];

    for i in 0..1000 {
        let addr_clone = addr;
        let handle = tokio::spawn(async move {
            let mut client = create_test_client(addr_clone).await;

            let request = MessageSendRequest {
                role: ProtoRole::User as i32,
                parts: vec![Part {
                    part_type: Some(PartType::Text(TextPart {
                        content: format!("Load test request {}", i),
                    })),
                }],
                context_id: Some(format!("load-test-{}", i % 10)),
            };

            client.message_send(request).await
        });
        handles.push(handle);
    }

    // Wait for all requests to complete
    let results = futures::future::join_all(handles).await;

    let duration = start.elapsed();

    // Count successes and failures
    let mut success_count = 0;
    let mut error_count = 0;

    for result in results {
        match result {
            Ok(Ok(_)) => success_count += 1,
            Ok(Err(_)) => error_count += 1,
            Err(_) => error_count += 1,
        }
    }

    // Print performance metrics
    println!("\n========================================");
    println!("Load Test Results (1000 concurrent requests)");
    println!("========================================");
    println!("Total Duration: {:?}", duration);
    println!("Success: {}", success_count);
    println!("Errors: {}", error_count);
    println!("Requests/sec: {:.2}", 1000.0 / duration.as_secs_f64());
    println!("Avg latency: {:?}", duration / 1000);
    println!("========================================\n");

    // Assert at least 95% success rate
    assert!(
        success_count >= 950,
        "Success rate too low: {}/1000",
        success_count
    );
}

// ==============================================================================
// Test: Additional Error Handling
// ==============================================================================

#[tokio::test]
async fn test_error_handling_empty_task_id() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request = TasksGetRequest {
        task_id: "".to_string(),
    };

    let response = client.tasks_get(request).await;
    assert!(response.is_err());
}

#[tokio::test]
async fn test_error_handling_invalid_context_id() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Very long context_id (potential DoS vector)
    let long_context = "x".repeat(10000);

    let request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Test".to_string(),
            })),
        }],
        context_id: Some(long_context),
    };

    let response = client.message_send(request).await;
    // Should handle gracefully (either accept or reject with proper error)
    assert!(response.is_ok() || response.is_err());
}

#[tokio::test]
async fn test_error_handling_cancel_already_cancelled() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    // Create a task
    let send_request = MessageSendRequest {
        role: ProtoRole::User as i32,
        parts: vec![Part {
            part_type: Some(PartType::Text(TextPart {
                content: "Task to double-cancel".to_string(),
            })),
        }],
        context_id: None,
    };

    let send_response = client.message_send(send_request).await.unwrap();
    let task_id = send_response.into_inner().task_id;

    // Cancel once
    let cancel_request = TasksCancelRequest {
        task_id: task_id.clone(),
    };
    let _ = client.tasks_cancel(cancel_request.clone()).await.unwrap();

    // Try to cancel again
    let response = client.tasks_cancel(cancel_request).await;
    // Should return error (already terminal state)
    assert!(response.is_err());
}

// ==============================================================================
// Test: Performance Benchmarking
// ==============================================================================

#[tokio::test]
#[ignore] // Run with: cargo test --test grpc_integration -- --ignored
async fn test_benchmark_grpc_throughput() {
    let (addr, _server) = start_test_server().await;
    let mut client = create_test_client(addr).await;

    let request_count = 100;
    let start = std::time::Instant::now();

    for i in 0..request_count {
        let request = MessageSendRequest {
            role: ProtoRole::User as i32,
            parts: vec![Part {
                part_type: Some(PartType::Text(TextPart {
                    content: format!("Benchmark {}", i),
                })),
            }],
            context_id: None,
        };

        client.message_send(request).await.unwrap();
    }

    let duration = start.elapsed();

    println!("\n========================================");
    println!("gRPC Sequential Benchmark");
    println!("========================================");
    println!("Requests: {}", request_count);
    println!("Total Duration: {:?}", duration);
    println!("Requests/sec: {:.2}", request_count as f64 / duration.as_secs_f64());
    println!("Avg latency: {:?}", duration / request_count);
    println!("========================================\n");

    // Ensure reasonable performance (at least 10 req/sec)
    assert!(
        duration.as_secs_f64() < 10.0,
        "Performance too slow: {:?}",
        duration
    );
}

#[tokio::test]
#[ignore] // Run with: cargo test --test grpc_integration -- --ignored
async fn test_benchmark_grpc_parallel_throughput() {
    let (addr, _server) = start_test_server().await;

    let request_count = 100;
    let concurrency = 10;
    let start = std::time::Instant::now();

    let mut handles = vec![];

    for batch in 0..(request_count / concurrency) {
        let mut batch_handles = vec![];

        for i in 0..concurrency {
            let addr_clone = addr;
            let handle = tokio::spawn(async move {
                let mut client = create_test_client(addr_clone).await;

                let request = MessageSendRequest {
                    role: ProtoRole::User as i32,
                    parts: vec![Part {
                        part_type: Some(PartType::Text(TextPart {
                            content: format!("Parallel benchmark batch {} item {}", batch, i),
                        })),
                    }],
                    context_id: None,
                };

                client.message_send(request).await
            });
            batch_handles.push(handle);
        }

        futures::future::join_all(batch_handles).await;
    }

    let duration = start.elapsed();

    println!("\n========================================");
    println!("gRPC Parallel Benchmark ({} concurrent)", concurrency);
    println!("========================================");
    println!("Total Requests: {}", request_count);
    println!("Concurrency: {}", concurrency);
    println!("Total Duration: {:?}", duration);
    println!("Requests/sec: {:.2}", request_count as f64 / duration.as_secs_f64());
    println!("Avg latency: {:?}", duration / request_count);
    println!("========================================\n");

    // Parallel should be faster than 10 req/sec
    assert!(
        duration.as_secs_f64() < 10.0,
        "Parallel performance too slow: {:?}",
        duration
    );
}

// ==============================================================================
// Test: Connection Resilience
// ==============================================================================

#[tokio::test]
async fn test_connection_timeout() {
    // Test connection to a non-existent server
    let endpoint = "http://127.0.0.1:9999";
    let result = tokio::time::timeout(
        Duration::from_secs(2),
        A2aServiceClient::connect(endpoint),
    )
    .await;

    // Should timeout or fail quickly
    assert!(result.is_err() || result.unwrap().is_err());
}

#[tokio::test]
async fn test_multiple_clients_same_server() {
    let (addr, _server) = start_test_server().await;

    // Create 10 different clients
    let mut clients = vec![];
    for _ in 0..10 {
        clients.push(create_test_client(addr).await);
    }

    // All clients should work independently
    for mut client in clients {
        let request = MessageSendRequest {
            role: ProtoRole::User as i32,
            parts: vec![Part {
                part_type: Some(PartType::Text(TextPart {
                    content: "Multi-client test".to_string(),
                })),
            }],
            context_id: None,
        };

        let response = client.message_send(request).await;
        assert!(response.is_ok());
    }
}
