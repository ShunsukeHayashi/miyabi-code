//! Tool System for Autonomous Execution
//!
//! Defines the tools that Miyabi can use autonomously to execute tasks.
//! Each tool is a function that LLM can call, with permission checking based on ExecutionMode.

use crate::{ApprovalDecision, ApprovalSystem, CommandApproval, ExecutionMode, FileChangeApproval};
use miyabi_types::error::Result;
use miyabi_types::MiyabiError;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::process::Command as ProcessCommand;
use tokio::fs;

/// Tool registry managing available tools
pub struct ToolRegistry {
    mode: ExecutionMode,
    working_dir: PathBuf,
    approval_system: ApprovalSystem,
}

impl ToolRegistry {
    /// Create a new tool registry with execution mode
    pub fn new(mode: ExecutionMode) -> Self {
        let interactive = matches!(mode, ExecutionMode::Interactive);
        Self {
            mode,
            working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            approval_system: ApprovalSystem::new(interactive),
        }
    }

    /// Set working directory
    pub fn with_working_dir(mut self, dir: PathBuf) -> Self {
        self.working_dir = dir;
        self
    }

    /// Get all available tool definitions based on execution mode
    pub fn get_tool_definitions(&self) -> Vec<miyabi_llm::ToolDefinition> {
        let mut tools = vec![
            self.define_read_file(),
            self.define_list_files(),
            self.define_search_code(),
        ];

        // Add file editing tools if allowed
        if self.mode.allows_file_edits() {
            tools.push(self.define_write_file());
            tools.push(self.define_edit_file());
        }

        // Add command execution if allowed
        if self.mode.allows_commands() {
            tools.push(self.define_run_command());
        }

        // Add full access tools
        if self.mode.allows_full_access() {
            tools.push(self.define_create_issue());
            tools.push(self.define_create_pr());
        }

        tools
    }

    /// Execute a tool call
    pub async fn execute(&self, call: &miyabi_llm::ToolCall) -> Result<ToolResult> {
        match call.name.as_str() {
            "read_file" => self.execute_read_file(&call.arguments).await,
            "write_file" => self.execute_write_file(&call.arguments).await,
            "edit_file" => self.execute_edit_file(&call.arguments).await,
            "list_files" => self.execute_list_files(&call.arguments).await,
            "search_code" => self.execute_search_code(&call.arguments).await,
            "run_command" => self.execute_run_command(&call.arguments).await,
            "create_issue" => self.execute_create_issue(&call.arguments).await,
            "create_pr" => self.execute_create_pr(&call.arguments).await,
            _ => Err(MiyabiError::ToolError(format!("Unknown tool: {}", call.name))),
        }
    }

    // ========================================
    // Tool Definitions
    // ========================================

    fn define_read_file(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "read_file",
            "Read the contents of a file. Returns the file contents as text.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to read (relative to working directory)"
                }
            },
            "required": ["path"]
        }))
    }

    fn define_write_file(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "write_file",
            "Write or overwrite a file with new contents. Requires FileEdits or FullAccess mode.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to write"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write to the file"
                }
            },
            "required": ["path", "content"]
        }))
    }

    fn define_edit_file(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "edit_file",
            "Apply a patch to a file by replacing old_text with new_text. Requires FileEdits or FullAccess mode.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to edit"
                },
                "old_text": {
                    "type": "string",
                    "description": "Text to find and replace"
                },
                "new_text": {
                    "type": "string",
                    "description": "Text to replace with"
                }
            },
            "required": ["path", "old_text", "new_text"]
        }))
    }

    fn define_list_files(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "list_files",
            "List files in a directory. Returns file names and basic info.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Directory path to list (defaults to current directory)"
                },
                "pattern": {
                    "type": "string",
                    "description": "Optional glob pattern to filter files (e.g., '*.rs')"
                }
            }
        }))
    }

    fn define_search_code(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "search_code",
            "Search for code using grep. Returns matching lines with context.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Search pattern (regex supported)"
                },
                "path": {
                    "type": "string",
                    "description": "Path to search in (defaults to current directory)"
                },
                "file_pattern": {
                    "type": "string",
                    "description": "File pattern to filter (e.g., '*.rs')"
                }
            },
            "required": ["pattern"]
        }))
    }

    fn define_run_command(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "run_command",
            "Execute a shell command. Requires FullAccess mode. Returns stdout, stderr, and exit code.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Command to execute"
                },
                "args": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Command arguments"
                }
            },
            "required": ["command"]
        }))
    }

    fn define_create_issue(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "create_issue",
            "Create a GitHub issue. Requires FullAccess mode.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Issue title"
                },
                "body": {
                    "type": "string",
                    "description": "Issue description"
                },
                "labels": {
                    "type": "array",
                    "items": { "type": "string" },
                    "description": "Labels to apply"
                }
            },
            "required": ["title", "body"]
        }))
    }

    fn define_create_pr(&self) -> miyabi_llm::ToolDefinition {
        miyabi_llm::ToolDefinition::new(
            "create_pr",
            "Create a GitHub Pull Request. Requires FullAccess mode.",
        )
        .with_parameters(json!({
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "PR title"
                },
                "body": {
                    "type": "string",
                    "description": "PR description"
                },
                "branch": {
                    "type": "string",
                    "description": "Source branch name"
                }
            },
            "required": ["title", "body", "branch"]
        }))
    }

    // ========================================
    // Tool Implementations
    // ========================================

    async fn execute_read_file(&self, args: &Value) -> Result<ToolResult> {
        let path = args["path"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'path' parameter".to_string()))?;

        let full_path = self.resolve_path(path)?;
        let content = fs::read_to_string(&full_path)
            .await
            .map_err(|e| MiyabiError::ToolError(format!("Failed to read file {}: {}", path, e)))?;

        Ok(ToolResult::success(json!({
            "path": path,
            "content": content,
            "size": content.len(),
        })))
    }

    async fn execute_write_file(&self, args: &Value) -> Result<ToolResult> {
        if !self.mode.allows_file_edits() {
            return Err(MiyabiError::PermissionDenied(
                "File writes require FileEdits or FullAccess mode".to_string(),
            ));
        }

        let path = args["path"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'path' parameter".to_string()))?;
        let content = args["content"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'content' parameter".to_string()))?;

        let full_path = self.resolve_path(path)?;

        // Check if file exists to determine operation type
        let old_content = if full_path.exists() {
            fs::read_to_string(&full_path).await.unwrap_or_default()
        } else {
            String::new()
        };

        // Request approval if in Interactive mode
        if matches!(self.mode, ExecutionMode::Interactive) {
            let approval = if old_content.is_empty() {
                FileChangeApproval::create(path.to_string(), content.to_string())
            } else {
                FileChangeApproval::modify(path.to_string(), old_content, content.to_string())
            };

            match self.approval_system.request_file_change(&approval)? {
                ApprovalDecision::Approve => {
                    // Continue with execution
                },
                ApprovalDecision::Reject => {
                    return Err(MiyabiError::Unknown("User rejected file change".to_string()));
                },
                ApprovalDecision::Details => {
                    // Show details and prompt again
                    return Err(MiyabiError::Unknown(
                        "Details view not yet implemented".to_string(),
                    ));
                },
                ApprovalDecision::Edit => {
                    return Err(MiyabiError::Unknown("Edit mode not yet implemented".to_string()));
                },
            }
        }

        // Create parent directory if needed
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                MiyabiError::ToolError(format!("Failed to create directory: {}", e))
            })?;
        }

        fs::write(&full_path, content)
            .await
            .map_err(|e| MiyabiError::ToolError(format!("Failed to write file {}: {}", path, e)))?;

        Ok(ToolResult::success(json!({
            "path": path,
            "size": content.len(),
        })))
    }

    async fn execute_edit_file(&self, args: &Value) -> Result<ToolResult> {
        if !self.mode.allows_file_edits() {
            return Err(MiyabiError::PermissionDenied(
                "File edits require FileEdits or FullAccess mode".to_string(),
            ));
        }

        let path = args["path"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'path' parameter".to_string()))?;
        let old_text = args["old_text"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'old_text' parameter".to_string()))?;
        let new_text = args["new_text"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'new_text' parameter".to_string()))?;

        let full_path = self.resolve_path(path)?;
        let content = fs::read_to_string(&full_path)
            .await
            .map_err(|e| MiyabiError::ToolError(format!("Failed to read file {}: {}", path, e)))?;

        if !content.contains(old_text) {
            return Err(MiyabiError::ToolError(format!("old_text not found in file: {}", path)));
        }

        let new_content = content.replace(old_text, new_text);

        // Request approval if in Interactive mode
        if matches!(self.mode, ExecutionMode::Interactive) {
            let approval =
                FileChangeApproval::modify(path.to_string(), content.clone(), new_content.clone());

            match self.approval_system.request_file_change(&approval)? {
                ApprovalDecision::Approve => {
                    // Continue with execution
                },
                ApprovalDecision::Reject => {
                    return Err(MiyabiError::Unknown("User rejected file change".to_string()));
                },
                ApprovalDecision::Details => {
                    return Err(MiyabiError::Unknown(
                        "Details view not yet implemented".to_string(),
                    ));
                },
                ApprovalDecision::Edit => {
                    return Err(MiyabiError::Unknown("Edit mode not yet implemented".to_string()));
                },
            }
        }

        fs::write(&full_path, &new_content)
            .await
            .map_err(|e| MiyabiError::ToolError(format!("Failed to write file {}: {}", path, e)))?;

        Ok(ToolResult::success(json!({
            "path": path,
            "old_size": content.len(),
            "new_size": new_content.len(),
        })))
    }

    async fn execute_list_files(&self, args: &Value) -> Result<ToolResult> {
        let path = args["path"].as_str().unwrap_or(".");
        let full_path = self.resolve_path(path)?;

        let mut entries = fs::read_dir(&full_path).await.map_err(|e| {
            MiyabiError::ToolError(format!("Failed to read directory {}: {}", path, e))
        })?;

        let mut files = Vec::new();
        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|e| MiyabiError::ToolError(format!("Failed to read directory entry: {}", e)))?
        {
            let metadata = entry
                .metadata()
                .await
                .map_err(|e| MiyabiError::ToolError(format!("Failed to read metadata: {}", e)))?;

            files.push(json!({
                "name": entry.file_name().to_string_lossy(),
                "is_dir": metadata.is_dir(),
                "size": metadata.len(),
            }));
        }

        Ok(ToolResult::success(json!({
            "path": path,
            "files": files,
            "count": files.len(),
        })))
    }

    async fn execute_search_code(&self, args: &Value) -> Result<ToolResult> {
        let pattern = args["pattern"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'pattern' parameter".to_string()))?;
        let path = args["path"].as_str().unwrap_or(".");

        // Use ripgrep if available, otherwise fallback to grep
        let output = ProcessCommand::new("rg")
            .arg("-n") // line numbers
            .arg("--no-heading")
            .arg(pattern)
            .arg(path)
            .output();

        let result =
            match output {
                Ok(output) => output,
                Err(_) => {
                    // Fallback to grep
                    ProcessCommand::new("grep").arg("-rn").arg(pattern).arg(path).output().map_err(
                        |e| MiyabiError::ToolError(format!("Search command failed: {}", e)),
                    )?
                },
            };

        let stdout = String::from_utf8_lossy(&result.stdout);
        let matches: Vec<&str> = stdout.lines().take(50).collect(); // Limit to 50 matches

        Ok(ToolResult::success(json!({
            "pattern": pattern,
            "matches": matches,
            "count": matches.len(),
        })))
    }

    async fn execute_run_command(&self, args: &Value) -> Result<ToolResult> {
        if !self.mode.allows_commands() {
            return Err(MiyabiError::PermissionDenied(
                "Command execution requires FullAccess mode".to_string(),
            ));
        }

        let command = args["command"]
            .as_str()
            .ok_or_else(|| MiyabiError::ToolError("Missing 'command' parameter".to_string()))?;

        let args_array = args["args"].as_array();
        let args_vec: Vec<String> = args_array
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
            .unwrap_or_default();

        // Request approval if in Interactive mode
        if matches!(self.mode, ExecutionMode::Interactive) {
            let approval = CommandApproval {
                command: command.to_string(),
                args: args_vec.clone(),
                reason: format!("Executing shell command: {}", command),
            };

            match self.approval_system.request_command_execution(&approval)? {
                ApprovalDecision::Approve => {
                    // Continue with execution
                },
                ApprovalDecision::Reject => {
                    return Err(MiyabiError::Unknown(
                        "User rejected command execution".to_string(),
                    ));
                },
                ApprovalDecision::Details => {
                    return Err(MiyabiError::Unknown(
                        "Details view not yet implemented".to_string(),
                    ));
                },
                ApprovalDecision::Edit => {
                    return Err(MiyabiError::Unknown("Edit mode not yet implemented".to_string()));
                },
            }
        }

        let mut cmd = ProcessCommand::new(command);
        for arg in &args_vec {
            cmd.arg(arg);
        }

        let output = cmd
            .output()
            .map_err(|e| MiyabiError::ToolError(format!("Command execution failed: {}", e)))?;

        Ok(ToolResult::success(json!({
            "command": command,
            "exit_code": output.status.code(),
            "stdout": String::from_utf8_lossy(&output.stdout),
            "stderr": String::from_utf8_lossy(&output.stderr),
        })))
    }

    async fn execute_create_issue(&self, args: &Value) -> Result<ToolResult> {
        if !self.mode.allows_full_access() {
            return Err(MiyabiError::PermissionDenied(
                "Creating issues requires FullAccess mode".to_string(),
            ));
        }

        // Placeholder - will integrate with miyabi-github
        Ok(ToolResult::success(json!({
            "message": "create_issue not yet implemented - requires miyabi-github integration",
            "title": args["title"],
        })))
    }

    async fn execute_create_pr(&self, args: &Value) -> Result<ToolResult> {
        if !self.mode.allows_full_access() {
            return Err(MiyabiError::PermissionDenied(
                "Creating PRs requires FullAccess mode".to_string(),
            ));
        }

        // Placeholder - will integrate with miyabi-github
        Ok(ToolResult::success(json!({
            "message": "create_pr not yet implemented - requires miyabi-github integration",
            "title": args["title"],
        })))
    }

    // ========================================
    // Helper Methods
    // ========================================

    fn resolve_path(&self, path: &str) -> Result<PathBuf> {
        let path = Path::new(path);

        // Prevent directory traversal attacks
        if path.to_string_lossy().contains("..") {
            return Err(MiyabiError::ToolError(
                "Path contains '..' (directory traversal not allowed)".to_string(),
            ));
        }

        let full_path = if path.is_absolute() {
            path.to_path_buf()
        } else {
            self.working_dir.join(path)
        };

        Ok(full_path)
    }
}

/// Result from tool execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub data: Value,
    pub error: Option<String>,
}

impl ToolResult {
    pub fn success(data: Value) -> Self {
        Self {
            success: true,
            data,
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: json!({}),
            error: Some(message),
        }
    }
}

impl ExecutionMode {
    fn allows_file_edits(&self) -> bool {
        matches!(self, ExecutionMode::FileEdits | ExecutionMode::FullAccess)
    }

    fn allows_commands(&self) -> bool {
        matches!(self, ExecutionMode::FullAccess)
    }

    fn allows_full_access(&self) -> bool {
        matches!(self, ExecutionMode::FullAccess)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_registry_readonly_mode() {
        let registry = ToolRegistry::new(ExecutionMode::ReadOnly);
        let tools = registry.get_tool_definitions();

        // ReadOnly should have read_file, list_files, search_code
        assert!(tools.iter().any(|t| t.name == "read_file"));
        assert!(tools.iter().any(|t| t.name == "list_files"));
        assert!(tools.iter().any(|t| t.name == "search_code"));

        // Should NOT have write tools
        assert!(!tools.iter().any(|t| t.name == "write_file"));
        assert!(!tools.iter().any(|t| t.name == "run_command"));
    }

    #[test]
    fn test_tool_registry_file_edits_mode() {
        let registry = ToolRegistry::new(ExecutionMode::FileEdits);
        let tools = registry.get_tool_definitions();

        // Should have write tools
        assert!(tools.iter().any(|t| t.name == "write_file"));
        assert!(tools.iter().any(|t| t.name == "edit_file"));

        // Should NOT have command execution
        assert!(!tools.iter().any(|t| t.name == "run_command"));
    }

    #[test]
    fn test_tool_registry_full_access_mode() {
        let registry = ToolRegistry::new(ExecutionMode::FullAccess);
        let tools = registry.get_tool_definitions();

        // Should have all tools
        assert!(tools.iter().any(|t| t.name == "read_file"));
        assert!(tools.iter().any(|t| t.name == "write_file"));
        assert!(tools.iter().any(|t| t.name == "run_command"));
        assert!(tools.iter().any(|t| t.name == "create_issue"));
        assert!(tools.iter().any(|t| t.name == "create_pr"));
    }

    #[tokio::test]
    async fn test_path_traversal_protection() {
        let registry = ToolRegistry::new(ExecutionMode::ReadOnly);

        let result = registry
            .execute_read_file(&json!({
                "path": "../../../etc/passwd"
            }))
            .await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("directory traversal"));
    }
}
