//! gRPC server implementation for A2A Protocol.
//!
//! This module implements the A2AService gRPC server using `tonic`,
//! bridging Protocol Buffers messages to internal A2A types.

use crate::grpc::proto::{
    a2a_service_server::{A2aService, A2aServiceServer},
    GetAuthenticatedExtendedCardRequest, GetAuthenticatedExtendedCardResponse, MessageSendRequest, MessageSendResponse,
    TasksCancelRequest, TasksCancelResponse, TasksGetRequest, TasksGetResponse, TasksListRequest, TasksListResponse,
};
use crate::rpc::{A2ARpcHandler, AgentCardRpcHandler, TaskStorage};
use std::sync::Arc;
use tonic::{transport::Server, Request, Response, Status};

/// gRPC server implementation for A2A Protocol
///
/// This struct wraps the RPC handlers and implements the generated A2aService trait.
pub struct A2AServiceImpl<S: TaskStorage> {
    /// Main RPC handler for task operations
    rpc_handler: Arc<A2ARpcHandler<S>>,
    /// Agent card RPC handler (optional)
    agent_card_handler: Option<Arc<AgentCardRpcHandler>>,
}

impl<S: TaskStorage> A2AServiceImpl<S> {
    /// Create a new gRPC service implementation
    ///
    /// # Arguments
    ///
    /// * `rpc_handler` - RPC handler for task operations
    /// * `agent_card_handler` - Optional agent card handler
    pub fn new(rpc_handler: Arc<A2ARpcHandler<S>>, agent_card_handler: Option<Arc<AgentCardRpcHandler>>) -> Self {
        Self { rpc_handler, agent_card_handler }
    }
}

#[tonic::async_trait]
impl<S: TaskStorage + 'static> A2aService for A2AServiceImpl<S> {
    /// Stream type for TasksStream
    type TasksStreamStream =
        std::pin::Pin<Box<dyn futures::Stream<Item = Result<crate::grpc::proto::TaskStreamEvent, Status>> + Send>>;

    /// Stream type for MessageStream
    type MessageStreamStream =
        std::pin::Pin<Box<dyn futures::Stream<Item = Result<crate::grpc::proto::MessageStreamEvent, Status>> + Send>>;

    /// Handle message/send RPC method
    async fn message_send(
        &self,
        request: Request<MessageSendRequest>,
    ) -> Result<Response<MessageSendResponse>, Status> {
        let req = request.into_inner();

        // Convert proto request to internal types
        let role = proto_role_to_role(req.role)?;
        let parts = req
            .parts
            .into_iter()
            .map(proto_part_to_part)
            .collect::<Result<Vec<_>, _>>()?;

        let params = crate::rpc::MessageSendParams { role, parts, context_id: req.context_id };

        // Execute RPC method
        let result = self
            .rpc_handler
            .message_send(params)
            .await
            .map_err(a2a_error_to_status)?;

        // Convert result to proto response
        let response =
            MessageSendResponse { task_id: result.task_id, status: task_status_to_proto(result.status) as i32 };

        Ok(Response::new(response))
    }

    /// Handle tasks/get RPC method
    async fn tasks_get(&self, request: Request<TasksGetRequest>) -> Result<Response<TasksGetResponse>, Status> {
        let req = request.into_inner();

        let params = crate::rpc::TasksGetParams { task_id: req.task_id };

        let result = self.rpc_handler.tasks_get(params).await.map_err(a2a_error_to_status)?;

        let response = TasksGetResponse { task: Some(task_to_proto(result.task)?) };

        Ok(Response::new(response))
    }

    /// Handle tasks/cancel RPC method
    async fn tasks_cancel(
        &self,
        request: Request<TasksCancelRequest>,
    ) -> Result<Response<TasksCancelResponse>, Status> {
        let req = request.into_inner();

        let params = crate::rpc::TasksCancelParams { task_id: req.task_id };

        let result = self
            .rpc_handler
            .tasks_cancel(params)
            .await
            .map_err(a2a_error_to_status)?;

        let response = TasksCancelResponse {
            status: task_status_to_proto(result.status) as i32,
            message: format!("Task {} cancelled", result.task_id), // Generate message from task_id
        };

        Ok(Response::new(response))
    }

    /// Handle tasks/list RPC method
    async fn tasks_list(&self, request: Request<TasksListRequest>) -> Result<Response<TasksListResponse>, Status> {
        let req = request.into_inner();

        let status = if let Some(status_val) = req.status {
            if status_val != 0 {
                Some(proto_task_status_to_task_status(status_val)?)
            } else {
                None
            }
        } else {
            None
        };

        let params = crate::rpc::TasksListParams { status, limit: req.limit as usize, context_id: req.context_id };

        let result = self.rpc_handler.tasks_list(params).await.map_err(a2a_error_to_status)?;

        let tasks = result
            .tasks
            .into_iter()
            .map(task_to_proto)
            .collect::<Result<Vec<_>, _>>()?;

        let response = TasksListResponse { tasks, total: result.total_count as u32 };

        Ok(Response::new(response))
    }

    /// Handle agent/getAuthenticatedExtendedCard RPC method
    async fn agent_get_authenticated_extended_card(
        &self,
        request: Request<GetAuthenticatedExtendedCardRequest>,
    ) -> Result<Response<GetAuthenticatedExtendedCardResponse>, Status> {
        let req = request.into_inner();

        let handler = self
            .agent_card_handler
            .as_ref()
            .ok_or_else(|| Status::unimplemented("Agent card endpoint not configured"))?;

        let params = crate::rpc::GetAuthenticatedExtendedCardParams { token: req.token };

        let result = handler
            .get_authenticated_extended_card(params)
            .await
            .map_err(a2a_error_to_status)?;

        // Internal response only has card field, no extended_metadata
        let response = GetAuthenticatedExtendedCardResponse {
            card: Some(agent_card_to_proto(result.card)?),
            extended_metadata: None, // Not supported yet
        };

        Ok(Response::new(response))
    }

    /// Handle tasks/stream RPC method (streaming)
    async fn tasks_stream(
        &self,
        _request: Request<crate::grpc::proto::TasksStreamRequest>,
    ) -> Result<Response<Self::TasksStreamStream>, Status> {
        // TODO: Implement streaming support
        Err(Status::unimplemented("Streaming not yet implemented"))
    }

    /// Handle message/stream RPC method (streaming)
    async fn message_stream(
        &self,
        _request: Request<MessageSendRequest>,
    ) -> Result<Response<Self::MessageStreamStream>, Status> {
        // TODO: Implement streaming support
        Err(Status::unimplemented("Streaming not yet implemented"))
    }
}

// ==============================================================================
// Type Conversion Functions
// ==============================================================================

use crate::grpc::conversions::{
    a2a_error_to_status, agent_card_to_proto, proto_to_part, proto_to_role, proto_to_task_status, task_status_to_proto,
    task_to_proto,
};

/// Convert proto role to internal role (wrapper)
fn proto_role_to_role(role: i32) -> Result<crate::types::Role, Status> {
    proto_to_role(role)
}

/// Convert proto part to internal part (wrapper)
fn proto_part_to_part(part: crate::grpc::proto::Part) -> Result<crate::types::Part, Status> {
    proto_to_part(part)
}

/// Convert proto task status to internal task status (wrapper)
fn proto_task_status_to_task_status(status: i32) -> Result<crate::types::TaskStatus, Status> {
    proto_to_task_status(status)
}

/// Start the gRPC server
///
/// # Arguments
///
/// * `addr` - Address to bind to (e.g., "127.0.0.1:50051")
/// * `service` - A2AService implementation
///
/// # Returns
///
/// A future that runs the server until shutdown
pub async fn start_server<S: TaskStorage + 'static>(
    addr: impl Into<std::net::SocketAddr>,
    service: A2AServiceImpl<S>,
) -> Result<(), Box<dyn std::error::Error>> {
    let addr = addr.into();

    tracing::info!("Starting gRPC server on {}", addr);

    Server::builder()
        .add_service(A2aServiceServer::new(service))
        .serve(addr)
        .await?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::error::A2AError;
    use crate::rpc::TaskStorage;
    use crate::types::{Task, TaskStatus};
    use async_trait::async_trait;
    use std::collections::HashMap;
    use tokio::sync::RwLock;

    /// In-memory task storage for testing
    struct MemoryTaskStorage {
        tasks: Arc<RwLock<HashMap<String, Task>>>,
    }

    impl MemoryTaskStorage {
        fn new() -> Self {
            Self { tasks: Arc::new(RwLock::new(HashMap::new())) }
        }
    }

    #[async_trait]
    impl TaskStorage for MemoryTaskStorage {
        async fn create_task(&self, task: Task) -> Result<(), A2AError> {
            let mut tasks = self.tasks.write().await;
            tasks.insert(task.id.clone(), task);
            Ok(())
        }

        async fn get_task(&self, task_id: &str) -> Result<Option<Task>, A2AError> {
            let tasks = self.tasks.read().await;
            Ok(tasks.get(task_id).cloned())
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
            context_id: Option<&str>,
            status: Option<TaskStatus>,
            limit: usize,
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
            Ok(filtered.into_iter().take(limit).collect())
        }

        async fn cancel_task(&self, task_id: &str) -> Result<(), A2AError> {
            let mut tasks = self.tasks.write().await;
            if let Some(task) = tasks.get_mut(task_id) {
                task.status = TaskStatus::Cancelled;
                Ok(())
            } else {
                Err(A2AError::TaskNotFound(task_id.to_string()))
            }
        }
    }

    #[test]
    fn test_grpc_service_creation() {
        let storage = MemoryTaskStorage::new();
        let rpc_handler = Arc::new(A2ARpcHandler::new(storage));
        let _service = A2AServiceImpl::new(rpc_handler, None);
        // Service created successfully
    }

    #[test]
    fn test_status_conversion() {
        use crate::grpc::conversions::task_status_to_proto;
        use crate::grpc::proto::TaskStatus as ProtoTaskStatus;
        use crate::types::TaskStatus;

        assert_eq!(task_status_to_proto(TaskStatus::Submitted) as i32, ProtoTaskStatus::Submitted as i32);
        assert_eq!(task_status_to_proto(TaskStatus::Completed) as i32, ProtoTaskStatus::Completed as i32);
    }
}
