use std::collections::HashMap;

use miyabi_types::task::TaskType;
use miyabi_types::{AgentType, Task};
use serde_json::json;

/// Lightweight template describing how to build issue-scoped tasks for agents.
#[derive(Clone, Copy)]
pub struct IssueTaskTemplate {
    pub id_prefix: &'static str,
    pub title_template: &'static str,
    pub description_template: &'static str,
    pub task_type: TaskType,
    pub priority: u8,
    pub estimated_duration: Option<u32>,
}

impl IssueTaskTemplate {
    pub const fn new(
        id_prefix: &'static str,
        title_template: &'static str,
        description_template: &'static str,
        task_type: TaskType,
        priority: u8,
        estimated_duration: Option<u32>,
    ) -> Self {
        Self { id_prefix, title_template, description_template, task_type, priority, estimated_duration }
    }
}

pub struct TaskFactory;

impl TaskFactory {
    /// Build an issue-scoped task by applying the template to the provided issue number.
    pub fn build_issue_task(
        issue_number: u64,
        agent_type: AgentType,
        template: &IssueTaskTemplate,
        metadata: Option<HashMap<String, serde_json::Value>>,
        include_default_issue_metadata: bool,
    ) -> Task {
        let title = template.title_template.replace("{issue}", &issue_number.to_string());
        let description = template
            .description_template
            .replace("{issue}", &issue_number.to_string());

        let mut metadata = metadata.unwrap_or_default();
        if include_default_issue_metadata {
            metadata
                .entry("issue_number".to_string())
                .or_insert(json!(issue_number));
        }

        Task {
            id: format!("{}{}", template.id_prefix, issue_number),
            title,
            description,
            task_type: template.task_type,
            priority: template.priority,
            severity: None,
            impact: None,
            assigned_agent: Some(agent_type),
            dependencies: Vec::new(),
            estimated_duration: template.estimated_duration,
            status: None,
            start_time: None,
            end_time: None,
            metadata: if metadata.is_empty() { None } else { Some(metadata) },
        }
    }
}
