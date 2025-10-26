//! Rich result display formatting for agent execution results
//!
//! Provides:
//! - Table-based display using comfy-table
//! - JSON output for AI integration
//! - Colorized terminal output
//! - Detailed error reporting

use colored::Colorize;
use comfy_table::{presets::UTF8_FULL, Cell, CellAlignment, Color, ContentArrangement, Table};
use miyabi_types::{
    agent::{AgentResult, ResultStatus},
    AgentType,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;

/// Output format for agent results
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[allow(dead_code)]
pub enum OutputFormat {
    /// Rich table display (default)
    Table,
    /// JSON output for AI/automation
    Json,
}

/// Result formatter for agent execution results
#[derive(Debug)]
pub struct ResultFormatter {
    format: OutputFormat,
    verbose: bool,
}

/// Formatted result output
#[derive(Debug, Serialize, Deserialize)]
pub struct FormattedResult {
    pub agent_type: String,
    pub task_id: String,
    pub status: String,
    pub duration_ms: u64,
    pub metrics: Option<ResultMetrics>,
    pub escalation: Option<String>,
    pub raw_data: Option<Value>,
}

/// Result metrics for display
#[derive(Debug, Serialize, Deserialize)]
pub struct ResultMetrics {
    pub quality_score: Option<u8>,
    pub lines_changed: Option<u32>,
    pub tests_added: Option<u32>,
    pub errors_found: Option<u32>,
    pub custom: Option<Value>,
}

impl Default for ResultFormatter {
    fn default() -> Self {
        Self::new()
    }
}

impl ResultFormatter {
    /// Create a new formatter with default settings (table format, non-verbose)
    pub fn new() -> Self {
        Self {
            format: OutputFormat::Table,
            verbose: false,
        }
    }

    /// Set output format
    #[allow(dead_code)]
    pub fn with_format(mut self, format: OutputFormat) -> Self {
        self.format = format;
        self
    }

    /// Enable verbose output
    pub fn with_verbose(mut self, verbose: bool) -> Self {
        self.verbose = verbose;
        self
    }

    /// Format agent result for display
    pub fn format_result(
        &self,
        agent_type: AgentType,
        task_id: &str,
        result: &AgentResult,
    ) -> String {
        match self.format {
            OutputFormat::Table => self.format_as_table(agent_type, task_id, result),
            OutputFormat::Json => self.format_as_json(agent_type, task_id, result),
        }
    }

    /// Format result as a rich table
    pub fn format_as_table(
        &self,
        agent_type: AgentType,
        task_id: &str,
        result: &AgentResult,
    ) -> String {
        let mut table = Table::new();
        table
            .load_preset(UTF8_FULL)
            .set_content_arrangement(ContentArrangement::Dynamic)
            .set_width(80);

        // Header
        let status_icon = match result.status {
            ResultStatus::Success => "✅",
            ResultStatus::Failed => "❌",
            ResultStatus::Escalated => "🔼",
        };

        let status_color = match result.status {
            ResultStatus::Success => Color::Green,
            ResultStatus::Failed => Color::Red,
            ResultStatus::Escalated => Color::Cyan,
        };

        table.add_row(vec![
            Cell::new("Agent Type").set_alignment(CellAlignment::Right),
            Cell::new(format!("{:?}", agent_type)),
        ]);

        table.add_row(vec![
            Cell::new("Task ID").set_alignment(CellAlignment::Right),
            Cell::new(task_id),
        ]);

        table.add_row(vec![
            Cell::new("Status").set_alignment(CellAlignment::Right),
            Cell::new(format!("{:?} {}", result.status, status_icon)).fg(status_color),
        ]);

        // Metrics
        if let Some(ref metrics) = result.metrics {
            table.add_row(vec![
                Cell::new("Duration").set_alignment(CellAlignment::Right),
                Cell::new(format!("{}ms", metrics.duration_ms)),
            ]);

            if let Some(quality) = metrics.quality_score {
                let quality_icon = if quality >= 90 {
                    "✅"
                } else if quality >= 70 {
                    "⚠️"
                } else {
                    "❌"
                };
                table.add_row(vec![
                    Cell::new("Quality Score").set_alignment(CellAlignment::Right),
                    Cell::new(format!("{}/100 {}", quality, quality_icon)),
                ]);
            }

            if let Some(lines) = metrics.lines_changed {
                table.add_row(vec![
                    Cell::new("Lines Changed").set_alignment(CellAlignment::Right),
                    Cell::new(lines.to_string()),
                ]);
            }

            if let Some(tests) = metrics.tests_added {
                table.add_row(vec![
                    Cell::new("Tests Added").set_alignment(CellAlignment::Right),
                    Cell::new(tests.to_string()),
                ]);
            }

            if let Some(errors) = metrics.errors_found {
                let error_color = if errors == 0 {
                    Color::Green
                } else {
                    Color::Yellow
                };
                table.add_row(vec![
                    Cell::new("Errors Found").set_alignment(CellAlignment::Right),
                    Cell::new(errors.to_string()).fg(error_color),
                ]);
            }
        }

        // Escalation
        if let Some(ref escalation) = result.escalation {
            table.add_row(vec![
                Cell::new("Escalation").set_alignment(CellAlignment::Right),
                Cell::new(format!("{:?}: {}", escalation.target, escalation.reason))
                    .fg(Color::Yellow),
            ]);
        }

        // Error
        if let Some(ref error) = result.error {
            table.add_row(vec![
                Cell::new("Error").set_alignment(CellAlignment::Right),
                Cell::new(error).fg(Color::Red),
            ]);
        }

        // Data (only in verbose mode)
        if self.verbose {
            if let Some(ref data) = result.data {
                table.add_row(vec![
                    Cell::new("Data").set_alignment(CellAlignment::Right),
                    Cell::new(serde_json::to_string_pretty(data).unwrap_or_default()),
                ]);
            }
        }

        table.to_string()
    }

    /// Format result as JSON
    pub fn format_as_json(
        &self,
        agent_type: AgentType,
        task_id: &str,
        result: &AgentResult,
    ) -> String {
        let metrics = result.metrics.as_ref().map(|m| ResultMetrics {
            quality_score: m.quality_score,
            lines_changed: m.lines_changed,
            tests_added: m.tests_added,
            errors_found: m.errors_found,
            custom: None,
        });

        let formatted = FormattedResult {
            agent_type: format!("{:?}", agent_type),
            task_id: task_id.to_string(),
            status: format!("{:?}", result.status),
            duration_ms: result.metrics.as_ref().map(|m| m.duration_ms).unwrap_or(0),
            metrics,
            escalation: result
                .escalation
                .as_ref()
                .map(|e| format!("{:?}: {}", e.target, e.reason)),
            raw_data: if self.verbose {
                result.data.clone()
            } else {
                None
            },
        };

        serde_json::to_string_pretty(&formatted)
            .unwrap_or_else(|e| format!("{{\"error\": \"Failed to serialize result: {}\"}}", e))
    }

    /// Format duration in human-readable form
    #[allow(dead_code)]
    pub fn format_duration(duration: Duration) -> String {
        let total_secs = duration.as_secs();
        let millis = duration.subsec_millis();

        if total_secs >= 3600 {
            format!("{}h {}m", total_secs / 3600, (total_secs % 3600) / 60)
        } else if total_secs >= 60 {
            format!("{}m {}s", total_secs / 60, total_secs % 60)
        } else if total_secs > 0 {
            format!("{}.{:03}s", total_secs, millis)
        } else {
            format!("{}ms", millis)
        }
    }

    /// Format error details
    #[allow(dead_code)]
    pub fn format_error(error_msg: &str, details: Option<&str>) -> String {
        let mut output = format!("{} {}", "❌ Error:".red().bold(), error_msg.red());

        if let Some(d) = details {
            output.push_str(&format!("\n\n{}\n{}", "Details:".yellow().bold(), d));
        }

        output
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::agent::{AgentMetrics, EscalationInfo, EscalationTarget, Severity};
    use std::collections::HashMap;

    fn create_test_result(status: ResultStatus) -> AgentResult {
        AgentResult {
            status,
            data: Some(serde_json::json!({"key": "value"})),
            error: None,
            metrics: Some(AgentMetrics {
                task_id: "test-task".to_string(),
                agent_type: AgentType::CodeGenAgent,
                duration_ms: 1234,
                quality_score: Some(92),
                lines_changed: Some(100),
                tests_added: Some(10),
                coverage_percent: Some(85.5),
                errors_found: Some(0),
                timestamp: chrono::Utc::now(),
            }),
            escalation: None,
        }
    }

    #[test]
    fn test_format_agent_result_success() {
        let formatter = ResultFormatter::new();
        let result = create_test_result(ResultStatus::Success);

        let output = formatter.format_result(AgentType::CodeGenAgent, "test-task-1", &result);

        assert!(output.contains("CodeGenAgent"));
        assert!(output.contains("test-task-1"));
        assert!(output.contains("Success"));
        assert!(output.contains("1234ms"));
        assert!(output.contains("92/100"));
    }

    #[test]
    fn test_format_agent_result_failure() {
        let mut result = create_test_result(ResultStatus::Failed);
        result.escalation = Some(EscalationInfo {
            reason: "Human intervention required".to_string(),
            target: EscalationTarget::TechLead,
            severity: Severity::Medium,
            context: HashMap::new(),
            timestamp: chrono::Utc::now(),
        });

        let formatter = ResultFormatter::new();
        let output = formatter.format_result(AgentType::ReviewAgent, "test-task-2", &result);

        assert!(output.contains("ReviewAgent"));
        assert!(output.contains("Failed"));
        assert!(output.contains("Human intervention required"));
    }

    #[test]
    fn test_format_json_output() {
        let formatter = ResultFormatter::new().with_format(OutputFormat::Json);
        let result = create_test_result(ResultStatus::Success);

        let output = formatter.format_result(AgentType::DeploymentAgent, "test-task-3", &result);

        let parsed: serde_json::Value = serde_json::from_str(&output).unwrap();
        assert_eq!(parsed["agent_type"], "DeploymentAgent");
        assert_eq!(parsed["task_id"], "test-task-3");
        assert_eq!(parsed["status"], "Success");
        assert_eq!(parsed["duration_ms"], 1234);
    }

    #[test]
    fn test_format_table_output() {
        let formatter = ResultFormatter::new().with_format(OutputFormat::Table);
        let result = create_test_result(ResultStatus::Success);

        let output = formatter.format_result(AgentType::IssueAgent, "test-task-4", &result);

        assert!(output.contains("IssueAgent"));
        assert!(output.contains("test-task-4"));
        assert!(output.contains("Success"));
        // Should contain table structure
        assert!(output.contains("─"));
        assert!(output.contains("│"));
    }

    #[test]
    fn test_format_duration() {
        assert_eq!(
            ResultFormatter::format_duration(Duration::from_millis(500)),
            "500ms"
        );
        assert_eq!(
            ResultFormatter::format_duration(Duration::from_secs(5)),
            "5.000s"
        );
        assert_eq!(
            ResultFormatter::format_duration(Duration::from_secs(90)),
            "1m 30s"
        );
        assert_eq!(
            ResultFormatter::format_duration(Duration::from_secs(3700)),
            "1h 1m"
        );
    }

    #[test]
    fn test_format_error() {
        let output = ResultFormatter::format_error("Connection failed", Some("Timeout after 30s"));
        assert!(output.contains("Error:"));
        assert!(output.contains("Connection failed"));
        assert!(output.contains("Details:"));
        assert!(output.contains("Timeout after 30s"));
    }

    #[test]
    fn test_verbose_mode() {
        let formatter = ResultFormatter::new().with_verbose(true);
        let result = create_test_result(ResultStatus::Success);

        let output = formatter.format_result(AgentType::CodeGenAgent, "test-task-5", &result);

        // Verbose mode should include data
        assert!(output.contains("Data"));
    }

    #[test]
    fn test_json_verbose_includes_data() {
        let formatter = ResultFormatter::new()
            .with_format(OutputFormat::Json)
            .with_verbose(true);
        let result = create_test_result(ResultStatus::Success);

        let output = formatter.format_result(AgentType::CodeGenAgent, "test-task-6", &result);
        let parsed: serde_json::Value = serde_json::from_str(&output).unwrap();

        assert!(parsed["raw_data"].is_object());
        assert_eq!(parsed["raw_data"]["key"], "value");
    }
}
