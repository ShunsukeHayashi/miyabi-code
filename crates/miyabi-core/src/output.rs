//! JSONL Output Streaming for CI/CD Integration
//!
//! Provides machine-readable JSON Lines output format for monitoring autonomous task execution.
//! Each line is a complete JSON object representing an event in the execution lifecycle.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, Write};

/// Event types in the execution stream
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ExecutionEvent {
    /// Session started
    SessionStart {
        session_id: String,
        task: String,
        mode: String,
        timestamp: DateTime<Utc>,
    },

    /// New turn started
    TurnStart {
        turn_id: usize,
        timestamp: DateTime<Utc>,
    },

    /// Tool call requested by LLM
    ToolCall {
        tool_name: String,
        tool_id: String,
        arguments: Value,
        timestamp: DateTime<Utc>,
    },

    /// Tool execution result
    ToolResult {
        tool_name: String,
        tool_id: String,
        success: bool,
        result: Option<Value>,
        error: Option<String>,
        duration_ms: u64,
        timestamp: DateTime<Utc>,
    },

    /// LLM response received
    LlmResponse {
        content: String,
        timestamp: DateTime<Utc>,
    },

    /// Task completed successfully
    Conclusion {
        summary: String,
        total_turns: usize,
        duration_ms: u64,
        timestamp: DateTime<Utc>,
    },

    /// Task failed
    Failure {
        error: String,
        resumable: bool,
        total_turns: usize,
        timestamp: DateTime<Utc>,
    },

    /// Progress update
    Progress {
        message: String,
        percent: Option<u8>,
        timestamp: DateTime<Utc>,
    },

    /// Warning message
    Warning {
        message: String,
        timestamp: DateTime<Utc>,
    },
}

/// JSONL event writer
pub struct JsonlWriter {
    writer: Box<dyn Write + Send>,
    enabled: bool,
}

impl JsonlWriter {
    /// Create a new JSONL writer that writes to stdout
    pub fn stdout(enabled: bool) -> Self {
        Self {
            writer: Box::new(io::stdout()),
            enabled,
        }
    }

    /// Create a new JSONL writer with custom writer
    pub fn new(writer: Box<dyn Write + Send>, enabled: bool) -> Self {
        Self { writer, enabled }
    }

    /// Write an event as a JSON line
    pub fn write_event(&mut self, event: &ExecutionEvent) -> io::Result<()> {
        if !self.enabled {
            return Ok(());
        }

        let json = serde_json::to_string(event)?;
        writeln!(self.writer, "{}", json)?;
        self.writer.flush()?;
        Ok(())
    }

    /// Write session start event
    pub fn session_start(&mut self, session_id: String, task: String, mode: String) -> io::Result<()> {
        self.write_event(&ExecutionEvent::SessionStart {
            session_id,
            task,
            mode,
            timestamp: Utc::now(),
        })
    }

    /// Write turn start event
    pub fn turn_start(&mut self, turn_id: usize) -> io::Result<()> {
        self.write_event(&ExecutionEvent::TurnStart {
            turn_id,
            timestamp: Utc::now(),
        })
    }

    /// Write tool call event
    pub fn tool_call(&mut self, tool_name: String, tool_id: String, arguments: Value) -> io::Result<()> {
        self.write_event(&ExecutionEvent::ToolCall {
            tool_name,
            tool_id,
            arguments,
            timestamp: Utc::now(),
        })
    }

    /// Write tool result event
    pub fn tool_result(
        &mut self,
        tool_name: String,
        tool_id: String,
        success: bool,
        result: Option<Value>,
        error: Option<String>,
        duration_ms: u64,
    ) -> io::Result<()> {
        self.write_event(&ExecutionEvent::ToolResult {
            tool_name,
            tool_id,
            success,
            result,
            error,
            duration_ms,
            timestamp: Utc::now(),
        })
    }

    /// Write LLM response event
    pub fn llm_response(&mut self, content: String) -> io::Result<()> {
        self.write_event(&ExecutionEvent::LlmResponse {
            content,
            timestamp: Utc::now(),
        })
    }

    /// Write conclusion event
    pub fn conclusion(&mut self, summary: String, total_turns: usize, duration_ms: u64) -> io::Result<()> {
        self.write_event(&ExecutionEvent::Conclusion {
            summary,
            total_turns,
            duration_ms,
            timestamp: Utc::now(),
        })
    }

    /// Write failure event
    pub fn failure(&mut self, error: String, resumable: bool, total_turns: usize) -> io::Result<()> {
        self.write_event(&ExecutionEvent::Failure {
            error,
            resumable,
            total_turns,
            timestamp: Utc::now(),
        })
    }

    /// Write progress event
    pub fn progress(&mut self, message: String, percent: Option<u8>) -> io::Result<()> {
        self.write_event(&ExecutionEvent::Progress {
            message,
            percent,
            timestamp: Utc::now(),
        })
    }

    /// Write warning event
    pub fn warning(&mut self, message: String) -> io::Result<()> {
        self.write_event(&ExecutionEvent::Warning {
            message,
            timestamp: Utc::now(),
        })
    }
}

impl Default for JsonlWriter {
    fn default() -> Self {
        Self::stdout(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_serialization_tool_call() {
        let event = ExecutionEvent::ToolCall {
            tool_name: "read_file".to_string(),
            tool_id: "call_1".to_string(),
            arguments: serde_json::json!({"path": "test.txt"}),
            timestamp: Utc::now(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("tool_call"));
        assert!(json.contains("read_file"));
        assert!(json.contains("test.txt"));
    }

    #[test]
    fn test_event_serialization_session_start() {
        let event = ExecutionEvent::SessionStart {
            session_id: "ses_123".to_string(),
            task: "test task".to_string(),
            mode: "ReadOnly".to_string(),
            timestamp: Utc::now(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("session_start"));
        assert!(json.contains("ses_123"));
        assert!(json.contains("test task"));
    }

    #[test]
    fn test_event_serialization_conclusion() {
        let event = ExecutionEvent::Conclusion {
            summary: "Task completed".to_string(),
            total_turns: 5,
            duration_ms: 1234,
            timestamp: Utc::now(),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("conclusion"));
        assert!(json.contains("Task completed"));
        assert!(json.contains("\"total_turns\":5"));
    }

    #[test]
    fn test_jsonl_writer_disabled() {
        let mut writer = JsonlWriter::stdout(false);

        // Should not panic or error when disabled
        let result = writer.session_start(
            "ses_123".to_string(),
            "test task".to_string(),
            "ReadOnly".to_string(),
        );

        assert!(result.is_ok());
    }
}
