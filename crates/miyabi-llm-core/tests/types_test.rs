//! Tests for core types

use miyabi_llm_core::{Message, Role, ToolCall, ToolCallResponse, ToolDefinition};

#[test]
fn test_message_creation() {
    let msg = Message::system("System message");
    assert_eq!(msg.role, Role::System);
    assert_eq!(msg.content, "System message");

    let msg = Message::user("User message");
    assert_eq!(msg.role, Role::User);
    assert_eq!(msg.content, "User message");

    let msg = Message::assistant("Assistant message");
    assert_eq!(msg.role, Role::Assistant);
    assert_eq!(msg.content, "Assistant message");
}

#[test]
fn test_message_serialization() {
    let msg = Message::user("Hello");
    let json = serde_json::to_string(&msg).unwrap();
    let deserialized: Message = serde_json::from_str(&json).unwrap();

    assert_eq!(msg, deserialized);
}

#[test]
fn test_tool_definition() {
    let tool = ToolDefinition::new("test_tool", "A test tool");

    assert_eq!(tool.name, "test_tool");
    assert_eq!(tool.description, "A test tool");
}

#[test]
fn test_tool_definition_with_parameters() {
    let tool = ToolDefinition::new("get_weather", "Get weather")
        .with_parameter("location", "string", "City name", true)
        .with_parameter("units", "string", "Temperature units", false);

    assert_eq!(tool.name, "get_weather");

    // Check that location is in required array
    let required = tool.parameters["required"].as_array().unwrap();
    assert!(required.iter().any(|v| v == "location"));

    // Check that units is NOT in required array
    assert!(!required.iter().any(|v| v == "units"));
}

#[test]
fn test_tool_call() {
    let call = ToolCall::new("call-123", "test_tool", serde_json::json!({"arg1": "value1"}));

    assert_eq!(call.id, "call-123");
    assert_eq!(call.name, "test_tool");
}

#[test]
fn test_tool_call_response() {
    let response = ToolCallResponse::Conclusion { text: "Done".to_string() };
    assert!(response.is_conclusion());
    assert!(!response.is_tool_calls());
    assert!(!response.needs_approval());

    let calls = vec![ToolCall::new("1", "tool1", serde_json::json!({}))];
    let response = ToolCallResponse::ToolCalls(calls);
    assert!(!response.is_conclusion());
    assert!(response.is_tool_calls());
    assert!(!response.needs_approval());

    let response = ToolCallResponse::NeedApproval { action: "deploy".to_string(), reason: "production".to_string() };
    assert!(!response.is_conclusion());
    assert!(!response.is_tool_calls());
    assert!(response.needs_approval());
}

#[test]
fn test_tool_call_response_serialization() {
    let response = ToolCallResponse::Conclusion { text: "Done".to_string() };
    let json = serde_json::to_string(&response).unwrap();
    let deserialized: ToolCallResponse = serde_json::from_str(&json).unwrap();

    assert_eq!(response, deserialized);
}

#[test]
fn test_role_display() {
    assert_eq!(Role::System.to_string(), "system");
    assert_eq!(Role::User.to_string(), "user");
    assert_eq!(Role::Assistant.to_string(), "assistant");
}
