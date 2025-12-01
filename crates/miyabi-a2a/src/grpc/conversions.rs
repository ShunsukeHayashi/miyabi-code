//! Type conversion functions between internal A2A types and Protocol Buffer types.
//!
//! This module provides bidirectional conversion between Rust types in `crates/miyabi-a2a/src/types/`
//! and generated Protocol Buffer types from `proto/a2a.proto`.

#![allow(clippy::result_large_err)]

use crate::error::A2AError;
use crate::grpc::proto;
use crate::types;
use tonic::Status;

// ==============================================================================
// Part Conversions
// ==============================================================================

/// Convert internal Part to proto Part
pub fn part_to_proto(part: types::Part) -> Result<proto::Part, Status> {
    let part_type = match part {
        types::Part::Text { content } => Some(proto::part::PartType::Text(proto::TextPart { content })),
        types::Part::Image { url } => {
            // Internal Part::Image only has URL, map to proto Image
            Some(proto::part::PartType::Image(proto::ImagePart {
                url, // Required field
                mime_type: None,
                data: None,
            }))
        }
        types::Part::Data { content, mime_type } => {
            // Internal Part::Data is binary data, map to proto File
            Some(proto::part::PartType::File(proto::FilePart {
                name: "data".to_string(),     // Required field, use generic name
                mime_type: mime_type.clone(), // Required field
                url: None,
                data: Some(content),
            }))
        }
    };

    Ok(proto::Part { part_type })
}

/// Convert proto Part to internal Part
pub fn proto_to_part(part: proto::Part) -> Result<types::Part, Status> {
    let part_type = part
        .part_type
        .ok_or_else(|| Status::invalid_argument("Part type is required"))?;

    match part_type {
        proto::part::PartType::Text(text) => Ok(types::Part::Text { content: text.content }),
        proto::part::PartType::Image(image) => {
            // Proto Image has url (required), internal Part::Image only has url
            Ok(types::Part::Image { url: image.url })
        }
        proto::part::PartType::Audio(audio) => {
            // Map Audio to Data (binary)
            let data = audio
                .data
                .ok_or_else(|| Status::invalid_argument("Audio part requires data"))?;
            let mime_type = audio.mime_type.unwrap_or_else(|| "audio/mpeg".to_string());
            Ok(types::Part::Data { content: data, mime_type })
        }
        proto::part::PartType::Video(video) => {
            // Map Video URL to Image (closest match)
            Ok(types::Part::Image { url: video.url })
        }
        proto::part::PartType::File(file) => {
            // Map File to Data (binary)
            let data = file
                .data
                .ok_or_else(|| Status::invalid_argument("File part requires data"))?;
            Ok(types::Part::Data { content: data, mime_type: file.mime_type })
        }
    }
}

// ==============================================================================
// Task Conversions
// ==============================================================================

/// Convert internal Task to proto Task
pub fn task_to_proto(task: types::Task) -> Result<proto::Task, Status> {
    let (output, error) = match task.output {
        Some(task_output) => (Some(task_output_to_proto(task_output.result)?), task_output.error),
        None => (None, None),
    };

    Ok(proto::Task {
        id: task.id,
        status: task_status_to_proto(task.status) as i32,
        input: Some(task_input_to_proto(task.input)?),
        output,
        context_id: task.context_id,
        created_at: task.created_at.to_rfc3339(),
        updated_at: task.updated_at.to_rfc3339(),
        error,
    })
}

/// Convert proto Task to internal Task
pub fn proto_to_task(task: proto::Task) -> Result<types::Task, Status> {
    let output = match (task.output, task.error) {
        (Some(proto_output), error) => {
            let result = proto_to_task_output_result(proto_output)?;
            Some(types::TaskOutput { result, error })
        }
        (None, Some(error)) => {
            // Error without output
            Some(types::TaskOutput { result: serde_json::Value::Null, error: Some(error) })
        }
        (None, None) => None,
    };

    Ok(types::Task {
        id: task.id,
        status: proto_to_task_status(task.status)?,
        input: proto_to_task_input(
            task.input
                .ok_or_else(|| Status::invalid_argument("Task input is required"))?,
        )?,
        output,
        context_id: task.context_id,
        created_at: chrono::DateTime::parse_from_rfc3339(&task.created_at)
            .map_err(|_| Status::invalid_argument("Invalid created_at timestamp"))?
            .with_timezone(&chrono::Utc),
        updated_at: chrono::DateTime::parse_from_rfc3339(&task.updated_at)
            .map_err(|_| Status::invalid_argument("Invalid updated_at timestamp"))?
            .with_timezone(&chrono::Utc),
    })
}

/// Convert internal TaskStatus to proto TaskStatus
pub fn task_status_to_proto(status: types::TaskStatus) -> proto::TaskStatus {
    match status {
        types::TaskStatus::Submitted => proto::TaskStatus::Submitted,
        types::TaskStatus::Working => proto::TaskStatus::Working,
        types::TaskStatus::Completed => proto::TaskStatus::Completed,
        types::TaskStatus::Failed => proto::TaskStatus::Failed,
        types::TaskStatus::Cancelled => proto::TaskStatus::Cancelled,
    }
}

/// Convert proto TaskStatus to internal TaskStatus
pub fn proto_to_task_status(status: i32) -> Result<types::TaskStatus, Status> {
    match proto::TaskStatus::try_from(status) {
        Ok(proto::TaskStatus::Submitted) => Ok(types::TaskStatus::Submitted),
        Ok(proto::TaskStatus::Working) => Ok(types::TaskStatus::Working),
        Ok(proto::TaskStatus::InputRequired) => Ok(types::TaskStatus::Working), // Map to Working
        Ok(proto::TaskStatus::Completed) => Ok(types::TaskStatus::Completed),
        Ok(proto::TaskStatus::Failed) => Ok(types::TaskStatus::Failed),
        Ok(proto::TaskStatus::Cancelled) => Ok(types::TaskStatus::Cancelled),
        _ => Err(Status::invalid_argument("Invalid task status")),
    }
}

/// Convert internal TaskInput to proto TaskInput
fn task_input_to_proto(input: types::TaskInput) -> Result<proto::TaskInput, Status> {
    // Internal TaskInput has prompt and params (JSON)
    // Proto TaskInput has prompt, parts, and artifacts
    // Try to extract parts and artifacts from params JSON
    let parts = if let Some(parts_array) = input.params.get("parts").and_then(|p| p.as_array()) {
        parts_array
            .iter()
            .filter_map(|p| serde_json::from_value::<types::Part>(p.clone()).ok())
            .map(part_to_proto)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        vec![]
    };

    let artifacts = if let Some(artifacts_array) = input.params.get("artifacts").and_then(|a| a.as_array()) {
        artifacts_array
            .iter()
            .filter_map(|a| serde_json::from_value::<types::Artifact>(a.clone()).ok())
            .map(artifact_to_proto)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        vec![]
    };

    Ok(proto::TaskInput { prompt: input.prompt, parts, artifacts })
}

/// Convert proto TaskInput to internal TaskInput
fn proto_to_task_input(input: proto::TaskInput) -> Result<types::TaskInput, Status> {
    // Proto TaskInput has prompt, parts, and artifacts
    // Internal TaskInput has prompt and params (JSON)
    // Store parts and artifacts in params JSON
    let parts: Vec<types::Part> = input
        .parts
        .into_iter()
        .map(proto_to_part)
        .collect::<Result<Vec<_>, _>>()?;

    let artifacts: Vec<types::Artifact> = input
        .artifacts
        .into_iter()
        .map(proto_to_artifact)
        .collect::<Result<Vec<_>, _>>()?;

    let mut params = serde_json::Map::new();
    if !parts.is_empty() {
        params.insert("parts".to_string(), serde_json::to_value(parts).map_err(|e| Status::internal(e.to_string()))?);
    }
    if !artifacts.is_empty() {
        params.insert(
            "artifacts".to_string(),
            serde_json::to_value(artifacts).map_err(|e| Status::internal(e.to_string()))?,
        );
    }

    Ok(types::TaskInput { prompt: input.prompt, params: serde_json::Value::Object(params) })
}

/// Convert internal TaskOutput result (JSON) to proto TaskOutput
fn task_output_to_proto(result: serde_json::Value) -> Result<proto::TaskOutput, Status> {
    // Internal TaskOutput has result (JSON) and error
    // Proto TaskOutput has messages and artifacts
    // Try to extract messages and artifacts from result JSON
    let messages = if let Some(messages_array) = result.get("messages").and_then(|m| m.as_array()) {
        messages_array
            .iter()
            .filter_map(|m| serde_json::from_value::<types::Message>(m.clone()).ok())
            .map(message_to_proto)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        vec![]
    };

    let artifacts = if let Some(artifacts_array) = result.get("artifacts").and_then(|a| a.as_array()) {
        artifacts_array
            .iter()
            .filter_map(|a| serde_json::from_value::<types::Artifact>(a.clone()).ok())
            .map(artifact_to_proto)
            .collect::<Result<Vec<_>, _>>()?
    } else {
        vec![]
    };

    Ok(proto::TaskOutput { messages, artifacts })
}

/// Convert proto TaskOutput to internal TaskOutput result (JSON Value)
fn proto_to_task_output_result(output: proto::TaskOutput) -> Result<serde_json::Value, Status> {
    // Proto TaskOutput has messages and artifacts
    // Internal TaskOutput has result (JSON) and error
    // Store messages and artifacts in result JSON
    let messages: Vec<types::Message> = output
        .messages
        .into_iter()
        .map(proto_to_message)
        .collect::<Result<Vec<_>, _>>()?;

    let artifacts: Vec<types::Artifact> = output
        .artifacts
        .into_iter()
        .map(proto_to_artifact)
        .collect::<Result<Vec<_>, _>>()?;

    let mut result = serde_json::Map::new();
    if !messages.is_empty() {
        result.insert(
            "messages".to_string(),
            serde_json::to_value(messages).map_err(|e| Status::internal(e.to_string()))?,
        );
    }
    if !artifacts.is_empty() {
        result.insert(
            "artifacts".to_string(),
            serde_json::to_value(artifacts).map_err(|e| Status::internal(e.to_string()))?,
        );
    }

    Ok(serde_json::Value::Object(result))
}

// ==============================================================================
// Message Conversions
// ==============================================================================

/// Convert internal Message to proto Message
pub fn message_to_proto(message: types::Message) -> Result<proto::Message, Status> {
    let parts = message
        .parts
        .into_iter()
        .map(part_to_proto)
        .collect::<Result<Vec<_>, _>>()?;

    Ok(proto::Message {
        id: uuid::Uuid::new_v4().to_string(), // Generate new ID for proto message
        role: role_to_proto(message.role) as i32,
        parts,
        timestamp: None, // Internal Message doesn't have timestamp
    })
}

/// Convert proto Message to internal Message
pub fn proto_to_message(message: proto::Message) -> Result<types::Message, Status> {
    let parts = message
        .parts
        .into_iter()
        .map(proto_to_part)
        .collect::<Result<Vec<_>, _>>()?;

    // Internal Message only has role and parts (no ID or metadata)
    Ok(types::Message { role: proto_to_role(message.role)?, parts })
}

/// Convert internal Role to proto Role
pub fn role_to_proto(role: types::Role) -> proto::Role {
    match role {
        types::Role::User => proto::Role::User,
        types::Role::Agent => proto::Role::Agent,
        types::Role::System => proto::Role::System,
    }
}

/// Convert proto Role to internal Role
pub fn proto_to_role(role: i32) -> Result<types::Role, Status> {
    match proto::Role::try_from(role) {
        Ok(proto::Role::User) => Ok(types::Role::User),
        Ok(proto::Role::Agent) => Ok(types::Role::Agent),
        Ok(proto::Role::System) => Ok(types::Role::System),
        _ => Err(Status::invalid_argument("Invalid role")),
    }
}

// ==============================================================================
// Artifact Conversions
// ==============================================================================

/// Convert internal Artifact to proto Artifact
pub fn artifact_to_proto(artifact: types::Artifact) -> Result<proto::Artifact, Status> {
    // Internal Artifact has id, artifact_type, content, metadata
    // Proto Artifact has id, name, type, mime_type, url, data, size, created_at
    // Extract additional fields from metadata if available
    let name = artifact
        .metadata
        .as_ref()
        .and_then(|m| m.get("name"))
        .and_then(|n| n.as_str())
        .map(String::from)
        .unwrap_or_else(|| artifact.id.clone());

    let mime_type = artifact
        .metadata
        .as_ref()
        .and_then(|m| m.get("mime_type"))
        .and_then(|t| t.as_str())
        .map(String::from);

    let url = artifact
        .metadata
        .as_ref()
        .and_then(|m| m.get("url"))
        .and_then(|u| u.as_str())
        .map(String::from);

    let data = Some(artifact.content.into_bytes());
    let size = data.as_ref().map(|d| d.len() as u64);

    Ok(proto::Artifact {
        id: artifact.id,
        name,
        r#type: artifact_type_to_proto(artifact.artifact_type) as i32,
        mime_type,
        url,
        data,
        size,
        created_at: None,
    })
}

/// Convert proto Artifact to internal Artifact
pub fn proto_to_artifact(artifact: proto::Artifact) -> Result<types::Artifact, Status> {
    // Proto Artifact has id, name, type, mime_type, url, data, size, created_at
    // Internal Artifact has id, artifact_type, content, metadata
    // Store extra fields in metadata
    let content = if let Some(data) = artifact.data {
        String::from_utf8(data).unwrap_or_else(|e| {
            // If not valid UTF-8, use base64 encoding
            base64::Engine::encode(&base64::engine::general_purpose::STANDARD, e.as_bytes())
        })
    } else if let Some(url) = &artifact.url {
        url.clone()
    } else {
        String::new()
    };

    let mut metadata = serde_json::Map::new();
    metadata.insert("name".to_string(), serde_json::Value::String(artifact.name));
    if let Some(mime_type) = artifact.mime_type {
        metadata.insert("mime_type".to_string(), serde_json::Value::String(mime_type));
    }
    if let Some(url) = artifact.url {
        metadata.insert("url".to_string(), serde_json::Value::String(url));
    }
    if let Some(size) = artifact.size {
        metadata.insert("size".to_string(), serde_json::Value::Number(size.into()));
    }
    if let Some(created_at) = artifact.created_at {
        metadata.insert("created_at".to_string(), serde_json::Value::String(created_at));
    }

    Ok(types::Artifact {
        id: artifact.id,
        artifact_type: proto_to_artifact_type(artifact.r#type)?,
        content,
        metadata: if metadata.is_empty() {
            None
        } else {
            Some(serde_json::Value::Object(metadata))
        },
    })
}

/// Convert internal ArtifactType to proto ArtifactType
pub fn artifact_type_to_proto(artifact_type: types::ArtifactType) -> proto::ArtifactType {
    match artifact_type {
        types::ArtifactType::Code => proto::ArtifactType::Code,
        types::ArtifactType::Document => proto::ArtifactType::Document,
        types::ArtifactType::Image => proto::ArtifactType::Image,
        types::ArtifactType::Data => proto::ArtifactType::Other,
    }
}

/// Convert proto ArtifactType to internal ArtifactType
pub fn proto_to_artifact_type(artifact_type: i32) -> Result<types::ArtifactType, Status> {
    match proto::ArtifactType::try_from(artifact_type) {
        Ok(proto::ArtifactType::Code) => Ok(types::ArtifactType::Code),
        Ok(proto::ArtifactType::Document) => Ok(types::ArtifactType::Document),
        Ok(proto::ArtifactType::Image) => Ok(types::ArtifactType::Image),
        Ok(proto::ArtifactType::Audio) => Ok(types::ArtifactType::Data),
        Ok(proto::ArtifactType::Video) => Ok(types::ArtifactType::Data),
        Ok(proto::ArtifactType::Archive) => Ok(types::ArtifactType::Data),
        Ok(proto::ArtifactType::Other) => Ok(types::ArtifactType::Data),
        _ => Err(Status::invalid_argument("Invalid artifact type")),
    }
}

// ==============================================================================
// AgentCard Conversions
// ==============================================================================

/// Convert internal AgentCard to proto AgentCard
pub fn agent_card_to_proto(card: types::AgentCard) -> Result<proto::AgentCard, Status> {
    // Internal AgentCard has: name, description, version, capabilities, auth_methods, url
    // Proto requires additional fields that we provide defaults for
    Ok(proto::AgentCard {
        protocol_version: "0.3.0".to_string(), // Default A2A protocol version
        name: card.name,
        description: card.description.unwrap_or_default(),
        url: card.url,
        preferred_transport: "http".to_string(), // Default transport
        additional_interfaces: vec![],
        version: card.version,
        capabilities: None, // TODO: Convert capabilities
        security_schemes: Default::default(),
        security: vec![],
        default_input_modes: vec!["text".to_string()], // Default input mode
        default_output_modes: vec!["text".to_string()], // Default output mode
        skills: vec![],
    })
}

/// Convert A2AError to tonic Status
pub fn a2a_error_to_status(error: A2AError) -> Status {
    match error {
        A2AError::TaskNotFound(id) => Status::not_found(format!("Task not found: {}", id)),
        A2AError::Unauthorized => Status::unauthenticated("Unauthorized"),
        A2AError::InvalidRequest(msg) => Status::invalid_argument(msg),
        A2AError::TaskAlreadyTerminal => Status::failed_precondition("Task already terminal"),
        _ => Status::internal(error.to_string()),
    }
}
