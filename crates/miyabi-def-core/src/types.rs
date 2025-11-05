//! Type definitions for Miyabi definitions
//!
//! This module contains the Rust type definitions for all Miyabi definition types:
//! - Entities (E1-E14)
//! - Relations (R1-R39)
//! - Labels (57 labels across 11 categories)
//! - Workflows (W1-W5)
//! - Agents (21 agents)

use serde::{Deserialize, Serialize};

/// Entity definition (E1-E14)
///
/// Represents a core entity in the Miyabi system, such as Issue, Task, Agent, etc.
///
/// # Examples
///
/// - E1: Issue
/// - E2: Task
/// - E3: Agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityDef {
    /// Entity ID (e.g., "E1", "E2")
    pub id: String,

    /// Entity name (e.g., "Issue", "Task")
    pub name: String,

    /// Entity type (e.g., "GitHub Issue", "Decomposed Task")
    #[serde(rename = "type")]
    pub entity_type: String,

    /// Description
    pub description: String,

    /// Attributes (flexible structure to handle varying YAML formats)
    #[serde(default)]
    pub attributes: serde_yaml::Value,

    /// Relations to other entities
    #[serde(default)]
    pub relations: Vec<String>,

    /// Implementation location
    #[serde(default)]
    pub implementation: Option<String>,
}

/// Relation definition (R1-R39)
///
/// Represents a relation between two entities with cardinality notation.
///
/// # Examples
///
/// - R1: Issue --analyzed-by→ Agent (N1:1)
/// - R2: Issue --decomposed-into→ Task[] (N1:N2)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelationDef {
    /// Relation ID (e.g., "R1", "R2")
    pub id: String,

    /// Relation name (e.g., "analyzed-by", "decomposed-into")
    pub name: String,

    /// Source entity (e.g., "Issue")
    pub from: String,

    /// Target entity (e.g., "Agent", "Task[]")
    pub to: String,

    /// Cardinality (e.g., "N1:1", "N1:N2", "N1:N3")
    #[serde(default)]
    pub cardinality: Option<String>,

    /// Description
    pub description: String,

    /// Implementation example
    #[serde(default)]
    pub implementation: Option<String>,
}

/// Label definition
///
/// Represents a GitHub label with category, color, and automation rules.
///
/// # Examples
///
/// - state:pending (STATE category)
/// - P0-Critical (PRIORITY category)
/// - agent:coordinator (AGENT category)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelDef {
    /// Label name (e.g., "state:pending", "P0-Critical")
    pub name: String,

    /// Category (e.g., "STATE", "PRIORITY", "AGENT")
    #[serde(default)]
    pub category: Option<String>,

    /// Emoji representation (e.g., "📥", "🔥")
    #[serde(default)]
    pub emoji: Option<String>,

    /// Color (hex format, e.g., "#E4E4E4")
    #[serde(default)]
    pub color: Option<String>,

    /// Color name (e.g., "グレー", "レッド")
    #[serde(default)]
    pub color_name: Option<String>,

    /// Description
    pub description: String,

    /// Assigned by (e.g., "自動", "CoordinatorAgent")
    #[serde(default)]
    pub assigned_by: Option<String>,

    /// Next state transition
    #[serde(default)]
    pub next_state: Option<String>,

    /// Action to take
    #[serde(default)]
    pub action: Option<String>,
}

/// Workflow definition (W1-W5)
///
/// Represents a workflow with stages, decision points, and handlers.
///
/// # Examples
///
/// - W1: Issue Creation & Triage
/// - W2: Task Decomposition & Planning
/// - W3: Code Implementation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowDef {
    /// Workflow ID (e.g., "W1", "W2")
    pub id: String,

    /// Workflow name (e.g., "Issue Creation & Triage")
    pub name: String,

    /// Description
    pub description: String,

    /// Duration estimate (e.g., "~5 min", "~10-30 min")
    #[serde(default)]
    pub duration: Option<String>,

    /// Stages (flexible structure to handle varying formats)
    #[serde(default)]
    pub stages: serde_yaml::Value,

    /// Success criteria
    #[serde(default)]
    pub success_criteria: Option<Vec<String>>,

    /// Error handlers
    #[serde(default)]
    pub error_handlers: Option<serde_yaml::Value>,
}

/// Agent definition
///
/// Represents an agent with its capabilities, responsibilities, and authority.
///
/// # Examples
///
/// - CoordinatorAgent (Coding agent)
/// - AIEntrepreneurAgent (Business agent)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDef {
    /// Agent name (e.g., "CoordinatorAgent")
    pub name: String,

    /// Agent type (e.g., "Coding", "Business")
    #[serde(default)]
    pub agent_type: Option<String>,

    /// Category (e.g., "Coding", "Strategy", "Marketing")
    #[serde(default)]
    pub category: Option<String>,

    /// Description
    pub description: String,

    /// Character name (e.g., "カミュイ", "サクラ")
    #[serde(default)]
    pub character: Option<String>,

    /// Responsibilities
    #[serde(default)]
    pub responsibilities: Vec<String>,

    /// Authority level (e.g., "Level 3: Direct Execution")
    #[serde(default)]
    pub authority: Option<String>,

    /// Tools available to the agent
    #[serde(default)]
    pub tools: Vec<String>,

    /// Escalation target (e.g., "TechLead", "CISO")
    #[serde(default)]
    pub escalation_target: Option<String>,

    /// Implementation location
    #[serde(default)]
    pub implementation: Option<String>,
}

// Helper functions for common patterns

impl EntityDef {
    /// Get the entity's short ID (e.g., "E1" from "E1_Issue")
    pub fn short_id(&self) -> &str {
        self.id.split('_').next().unwrap_or(&self.id)
    }
}

impl RelationDef {
    /// Check if this is a one-to-one relation
    pub fn is_one_to_one(&self) -> bool {
        self.cardinality
            .as_ref()
            .map(|c| c.contains("1:1"))
            .unwrap_or(false)
    }

    /// Check if this is a one-to-many relation
    pub fn is_one_to_many(&self) -> bool {
        self.cardinality
            .as_ref()
            .map(|c| c.contains("1:N"))
            .unwrap_or(false)
    }
}

impl LabelDef {
    /// Check if this is a state label
    pub fn is_state_label(&self) -> bool {
        self.category.as_deref() == Some("STATE") || self.name.starts_with("state:")
    }

    /// Check if this is a priority label
    pub fn is_priority_label(&self) -> bool {
        self.category.as_deref() == Some("PRIORITY") || self.name.starts_with("P")
    }

    /// Check if this is an agent label
    pub fn is_agent_label(&self) -> bool {
        self.category.as_deref() == Some("AGENT") || self.name.starts_with("agent:")
    }
}

impl AgentDef {
    /// Check if this is a coding agent
    pub fn is_coding_agent(&self) -> bool {
        self.agent_type.as_deref() == Some("Coding") || self.category.as_deref() == Some("Coding")
    }

    /// Check if this is a business agent
    pub fn is_business_agent(&self) -> bool {
        self.agent_type.as_deref() == Some("Business") || self.category.as_deref() != Some("Coding")
    }
}
