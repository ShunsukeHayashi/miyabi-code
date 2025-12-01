//! Integration tests for ToolRegistry
//!
//! Tests the complete tool execution flow including:
//! - File operations (read, write, list, edit)
//! - Permission checking based on ExecutionMode
//! - Tool definition generation

use miyabi_core::tools::ToolRegistry;
use miyabi_core::ExecutionMode;
use miyabi_llm::ToolCall;
use serde_json::json;
use tempfile::TempDir;

/// Helper to create a ToolCall
fn make_call(name: &str, args: serde_json::Value) -> ToolCall {
    ToolCall { id: uuid::Uuid::new_v4().to_string(), name: name.to_string(), arguments: args }
}

#[tokio::test]
async fn test_read_file() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    std::fs::write(&file_path, "Hello, World!").unwrap();

    let registry = ToolRegistry::new(ExecutionMode::ReadOnly).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "read_file",
        json!({
            "path": "test.txt"
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);
    assert_eq!(result.data["content"], "Hello, World!");
}

#[tokio::test]
async fn test_list_files() {
    let temp_dir = TempDir::new().unwrap();
    std::fs::write(temp_dir.path().join("file1.txt"), "").unwrap();
    std::fs::write(temp_dir.path().join("file2.txt"), "").unwrap();
    std::fs::create_dir(temp_dir.path().join("subdir")).unwrap();

    let registry = ToolRegistry::new(ExecutionMode::ReadOnly).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "list_files",
        json!({
            "path": "."
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);
    assert_eq!(result.data["count"], 3);

    let files = result.data["files"].as_array().unwrap();
    let names: Vec<&str> = files.iter().map(|f| f["name"].as_str().unwrap()).collect();

    assert!(names.contains(&"file1.txt"));
    assert!(names.contains(&"file2.txt"));
    assert!(names.contains(&"subdir"));
}

#[tokio::test]
async fn test_write_file_requires_permission() {
    let temp_dir = TempDir::new().unwrap();

    // ReadOnly mode should reject writes
    let registry = ToolRegistry::new(ExecutionMode::ReadOnly).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "write_file",
        json!({
            "path": "new_file.txt",
            "content": "test content"
        }),
    );

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("FileEdits"));
}

#[tokio::test]
async fn test_write_file_with_permission() {
    let temp_dir = TempDir::new().unwrap();

    // FileEdits mode should allow writes
    let registry = ToolRegistry::new(ExecutionMode::FileEdits).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "write_file",
        json!({
            "path": "new_file.txt",
            "content": "test content"
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);

    // Verify file was created
    let content = std::fs::read_to_string(temp_dir.path().join("new_file.txt")).unwrap();
    assert_eq!(content, "test content");
}

#[tokio::test]
async fn test_edit_file() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    std::fs::write(&file_path, "Hello, World!").unwrap();

    let registry = ToolRegistry::new(ExecutionMode::FileEdits).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "edit_file",
        json!({
            "path": "test.txt",
            "old_text": "World",
            "new_text": "Rust"
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);

    // Verify file was edited
    let content = std::fs::read_to_string(&file_path).unwrap();
    assert_eq!(content, "Hello, Rust!");
}

#[tokio::test]
async fn test_edit_file_not_found() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.txt");
    std::fs::write(&file_path, "Hello, World!").unwrap();

    let registry = ToolRegistry::new(ExecutionMode::FileEdits).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "edit_file",
        json!({
            "path": "test.txt",
            "old_text": "NotFound",
            "new_text": "Replacement"
        }),
    );

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("not found"));
}

#[tokio::test]
async fn test_run_command_requires_full_access() {
    let registry = ToolRegistry::new(ExecutionMode::FileEdits);

    let call = make_call(
        "run_command",
        json!({
            "command": "echo",
            "args": ["test"]
        }),
    );

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("FullAccess"));
}

#[tokio::test]
async fn test_run_command_with_full_access() {
    let registry = ToolRegistry::new(ExecutionMode::FullAccess);

    let call = make_call(
        "run_command",
        json!({
            "command": "echo",
            "args": ["hello"]
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);
    assert!(result.data["stdout"].as_str().unwrap().contains("hello"));
}

#[tokio::test]
async fn test_tool_definitions_readonly() {
    let registry = ToolRegistry::new(ExecutionMode::ReadOnly);
    let tools = registry.get_tool_definitions();

    let names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();

    // Should have read tools
    assert!(names.contains(&"read_file"));
    assert!(names.contains(&"list_files"));
    assert!(names.contains(&"search_code"));

    // Should NOT have write tools
    assert!(!names.contains(&"write_file"));
    assert!(!names.contains(&"run_command"));
    assert!(!names.contains(&"create_issue"));
}

#[tokio::test]
async fn test_tool_definitions_full_access() {
    let registry = ToolRegistry::new(ExecutionMode::FullAccess);
    let tools = registry.get_tool_definitions();

    let names: Vec<&str> = tools.iter().map(|t| t.name.as_str()).collect();

    // Should have all tools
    assert!(names.contains(&"read_file"));
    assert!(names.contains(&"write_file"));
    assert!(names.contains(&"edit_file"));
    assert!(names.contains(&"list_files"));
    assert!(names.contains(&"search_code"));
    assert!(names.contains(&"run_command"));
    assert!(names.contains(&"create_issue"));
    assert!(names.contains(&"create_pr"));
}

#[tokio::test]
async fn test_path_traversal_protection() {
    let temp_dir = TempDir::new().unwrap();

    let registry = ToolRegistry::new(ExecutionMode::ReadOnly).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "read_file",
        json!({
            "path": "../../../etc/passwd"
        }),
    );

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("directory traversal"));
}

#[tokio::test]
async fn test_unknown_tool() {
    let registry = ToolRegistry::new(ExecutionMode::FullAccess);

    let call = make_call("unknown_tool", json!({}));

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("Unknown tool"));
}

#[tokio::test]
async fn test_github_tools_require_client() {
    let registry = ToolRegistry::new(ExecutionMode::FullAccess);

    let call = make_call(
        "create_issue",
        json!({
            "title": "Test Issue",
            "body": "Test body"
        }),
    );

    let result = registry.execute(&call).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("GitHub client not configured"));
}

#[tokio::test]
async fn test_search_code() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.rs");
    std::fs::write(&file_path, "fn main() {\n    println!(\"Hello\");\n}").unwrap();

    let registry = ToolRegistry::new(ExecutionMode::ReadOnly).with_working_dir(temp_dir.path().to_path_buf());

    let call = make_call(
        "search_code",
        json!({
            "pattern": "println",
            "path": "."
        }),
    );

    let result = registry.execute(&call).await.unwrap();
    assert!(result.success);
    // Note: May return 0 matches if rg/grep not available in test env
}
