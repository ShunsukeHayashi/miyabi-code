//! GitHub Projects V2 API integration
//!
//! Provides GraphQL-based access to GitHub Projects V2 (Project Boards)
//! for use as Miyabi's data persistence layer.
//!
//! # Features
//!
//! - Query project items (issues/PRs) with custom fields
//! - Update custom field values (Status, Agent, Priority, etc.)
//! - Calculate KPIs from project data
//! - Support for 8 custom fields defined in Phase A

use miyabi_types::error::{MiyabiError, Result};
use serde::{Deserialize, Serialize};

use crate::GitHubClient;

/// GitHub Projects V2 client
impl GitHubClient {
    /// Get all items from a GitHub Project V2
    ///
    /// # Arguments
    /// * `project_number` - Project number (e.g., 1 for /projects/1)
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_github::GitHubClient;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = GitHubClient::new("ghp_xxx", "owner", "repo")?;
    /// let items = client.get_project_items(1).await?;
    /// println!("Found {} items", items.len());
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_project_items(&self, project_number: u32) -> Result<Vec<ProjectItem>> {
        let query = r#"
            query($owner: String!, $number: Int!) {
                user(login: $owner) {
                    projectV2(number: $number) {
                        id
                        items(first: 100) {
                            nodes {
                                id
                                content {
                                    ... on Issue {
                                        number
                                        title
                                        state
                                        labels(first: 10) {
                                            nodes {
                                                name
                                            }
                                        }
                                    }
                                    ... on PullRequest {
                                        number
                                        title
                                        state
                                    }
                                }
                                fieldValues(first: 20) {
                                    nodes {
                                        ... on ProjectV2ItemFieldSingleSelectValue {
                                            name
                                            field {
                                                ... on ProjectV2SingleSelectField {
                                                    name
                                                }
                                            }
                                        }
                                        ... on ProjectV2ItemFieldNumberValue {
                                            number
                                            field {
                                                ... on ProjectV2Field {
                                                    name
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        "#;

        let variables = serde_json::json!({
            "owner": self.owner(),
            "number": project_number as i64,
        });

        let response: ProjectResponse = self
            .client
            .graphql(&serde_json::json!({
                "query": query,
                "variables": variables
            }))
            .await
            .map_err(|e| MiyabiError::GitHub(format!("Failed to query project items: {}", e)))?;

        Ok(response
            .data
            .user
            .project_v2
            .items
            .nodes
            .into_iter()
            .map(|node| ProjectItem::from_node(node))
            .collect())
    }

    /// Update a custom field value for a project item
    ///
    /// # Arguments
    /// * `project_id` - Project node ID (e.g., "PVT_kwDOAB...")
    /// * `item_id` - Project item node ID
    /// * `field_name` - Custom field name (e.g., "Status", "Agent")
    /// * `value` - New value
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_github::GitHubClient;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let client = GitHubClient::new("ghp_xxx", "owner", "repo")?;
    /// client.update_project_field(
    ///     "PVT_kwDOAB...",
    ///     "PVTI_lADO...",
    ///     "Status",
    ///     "Done"
    /// ).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn update_project_field(
        &self,
        project_id: &str,
        item_id: &str,
        field_name: &str,
        value: &str,
    ) -> Result<()> {
        // First, get field ID and option ID
        let field_query = r#"
            query($projectId: ID!, $fieldName: String!) {
                node(id: $projectId) {
                    ... on ProjectV2 {
                        field(name: $fieldName) {
                            ... on ProjectV2SingleSelectField {
                                id
                                options {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        "#;

        let field_vars = serde_json::json!({
            "projectId": project_id,
            "fieldName": field_name,
        });

        let field_response: FieldQueryResponse = self
            .client
            .graphql(&serde_json::json!({
                "query": field_query,
                "variables": field_vars
            }))
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!("Failed to query field {}: {}", field_name, e))
            })?;

        let field = field_response
            .data
            .node
            .field
            .ok_or_else(|| MiyabiError::GitHub(format!("Field '{}' not found", field_name)))?;

        let option = field
            .options
            .iter()
            .find(|opt| opt.name == value)
            .ok_or_else(|| {
                MiyabiError::GitHub(format!(
                    "Option '{}' not found in field '{}'",
                    value, field_name
                ))
            })?;

        // Update the field value
        let update_mutation = r#"
            mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
                updateProjectV2ItemFieldValue(input: {
                    projectId: $projectId
                    itemId: $itemId
                    fieldId: $fieldId
                    value: { singleSelectOptionId: $optionId }
                }) {
                    projectV2Item {
                        id
                    }
                }
            }
        "#;

        let update_vars = serde_json::json!({
            "projectId": project_id,
            "itemId": item_id,
            "fieldId": field.id,
            "optionId": option.id,
        });

        self.client
            .graphql::<serde_json::Value>(&serde_json::json!({
                "query": update_mutation,
                "variables": update_vars
            }))
            .await
            .map_err(|e| {
                MiyabiError::GitHub(format!("Failed to update field {}: {}", field_name, e))
            })?;

        Ok(())
    }

    /// Calculate KPIs from project data
    ///
    /// # Arguments
    /// * `project_number` - Project number
    ///
    /// # Returns
    /// KPIReport with aggregated metrics
    pub async fn calculate_project_kpis(&self, project_number: u32) -> Result<KPIReport> {
        let items = self.get_project_items(project_number).await?;

        let total_tasks = items.len();
        let completed_tasks = items.iter().filter(|i| i.status == "Done").count();
        let completion_rate = if total_tasks > 0 {
            (completed_tasks as f64 / total_tasks as f64) * 100.0
        } else {
            0.0
        };

        let total_hours: f64 = items.iter().filter_map(|i| i.actual_hours).sum();
        let total_cost: f64 = items.iter().filter_map(|i| i.cost_usd).sum();

        let quality_scores: Vec<f64> = items.iter().filter_map(|i| i.quality_score).collect();
        let avg_quality_score = if !quality_scores.is_empty() {
            quality_scores.iter().sum::<f64>() / quality_scores.len() as f64
        } else {
            0.0
        };

        // Group by agent
        let mut by_agent = std::collections::HashMap::new();
        for item in &items {
            if let Some(ref agent) = item.agent {
                *by_agent.entry(agent.clone()).or_insert(0) += 1;
            }
        }

        // Group by phase
        let mut by_phase = std::collections::HashMap::new();
        for item in &items {
            if let Some(ref phase) = item.phase {
                *by_phase.entry(phase.clone()).or_insert(0) += 1;
            }
        }

        Ok(KPIReport {
            total_tasks,
            completed_tasks,
            completion_rate,
            total_hours,
            total_cost,
            avg_quality_score,
            by_agent,
            by_phase,
        })
    }
}

/// Project item (Issue or PR) with custom fields
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectItem {
    pub id: String,
    pub content_type: ContentType,
    pub number: u64,
    pub title: String,
    pub state: String,
    // Custom fields (Phase A)
    pub agent: Option<String>,
    pub status: String,
    pub priority: Option<String>,
    pub phase: Option<String>,
    pub estimated_hours: Option<f64>,
    pub actual_hours: Option<f64>,
    pub quality_score: Option<f64>,
    pub cost_usd: Option<f64>,
}

impl ProjectItem {
    fn from_node(node: ProjectItemNode) -> Self {
        let (content_type, number, title, state) = match node.content {
            Content::Issue(issue) => (
                ContentType::Issue,
                issue.number,
                issue.title,
                issue.state,
            ),
            Content::PullRequest(pr) => (ContentType::PullRequest, pr.number, pr.title, pr.state),
        };

        // Extract custom fields
        let mut agent = None;
        let mut status = String::from("Pending");
        let mut priority = None;
        let mut phase = None;
        let mut estimated_hours = None;
        let mut actual_hours = None;
        let mut quality_score = None;
        let mut cost_usd = None;

        for field_value in node.field_values.nodes {
            match field_value {
                FieldValue::SingleSelect { name, field } => match field.name.as_str() {
                    "Agent" => agent = Some(name),
                    "Status" => status = name,
                    "Priority" => priority = Some(name),
                    "Phase" => phase = Some(name),
                    _ => {}
                },
                FieldValue::Number { number, field } => match field.name.as_str() {
                    "Estimated Hours" => estimated_hours = Some(number),
                    "Actual Hours" => actual_hours = Some(number),
                    "Quality Score" => quality_score = Some(number),
                    "Cost (USD)" => cost_usd = Some(number),
                    _ => {}
                },
            }
        }

        Self {
            id: node.id,
            content_type,
            number,
            title,
            state,
            agent,
            status,
            priority,
            phase,
            estimated_hours,
            actual_hours,
            quality_score,
            cost_usd,
        }
    }
}

/// Content type (Issue or PR)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ContentType {
    Issue,
    PullRequest,
}

/// KPI report from project data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KPIReport {
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub completion_rate: f64,
    pub total_hours: f64,
    pub total_cost: f64,
    pub avg_quality_score: f64,
    pub by_agent: std::collections::HashMap<String, usize>,
    pub by_phase: std::collections::HashMap<String, usize>,
}

// GraphQL response types (internal)

#[derive(Debug, Deserialize)]
struct ProjectResponse {
    data: ProjectData,
}

#[derive(Debug, Deserialize)]
struct ProjectData {
    user: User,
}

#[derive(Debug, Deserialize)]
struct User {
    #[serde(rename = "projectV2")]
    project_v2: ProjectV2,
}

#[derive(Debug, Deserialize)]
struct ProjectV2 {
    id: String,
    items: Items,
}

#[derive(Debug, Deserialize)]
struct Items {
    nodes: Vec<ProjectItemNode>,
}

#[derive(Debug, Deserialize)]
struct ProjectItemNode {
    id: String,
    content: Content,
    #[serde(rename = "fieldValues")]
    field_values: FieldValues,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum Content {
    Issue(IssueContent),
    PullRequest(PRContent),
}

#[derive(Debug, Deserialize)]
struct IssueContent {
    number: u64,
    title: String,
    state: String,
    labels: Labels,
}

#[derive(Debug, Deserialize)]
struct PRContent {
    number: u64,
    title: String,
    state: String,
}

#[derive(Debug, Deserialize)]
struct Labels {
    nodes: Vec<LabelNode>,
}

#[derive(Debug, Deserialize)]
struct LabelNode {
    name: String,
}

#[derive(Debug, Deserialize)]
struct FieldValues {
    nodes: Vec<FieldValue>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum FieldValue {
    SingleSelect {
        name: String,
        field: FieldName,
    },
    Number {
        number: f64,
        field: FieldName,
    },
}

#[derive(Debug, Deserialize)]
struct FieldName {
    name: String,
}

// Field query response types

#[derive(Debug, Deserialize)]
struct FieldQueryResponse {
    data: FieldQueryData,
}

#[derive(Debug, Deserialize)]
struct FieldQueryData {
    node: FieldQueryNode,
}

#[derive(Debug, Deserialize)]
struct FieldQueryNode {
    field: Option<FieldInfo>,
}

#[derive(Debug, Deserialize)]
struct FieldInfo {
    id: String,
    options: Vec<FieldOption>,
}

#[derive(Debug, Deserialize)]
struct FieldOption {
    id: String,
    name: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_item_creation() {
        // Test ProjectItem structure
        let item = ProjectItem {
            id: "PVTI_lADO...".to_string(),
            content_type: ContentType::Issue,
            number: 270,
            title: "Test Issue".to_string(),
            state: "OPEN".to_string(),
            agent: Some("CoordinatorAgent".to_string()),
            status: "In Progress".to_string(),
            priority: Some("P1-High".to_string()),
            phase: Some("Phase 5".to_string()),
            estimated_hours: Some(8.0),
            actual_hours: Some(6.5),
            quality_score: Some(85.0),
            cost_usd: Some(1.25),
        };

        assert_eq!(item.content_type, ContentType::Issue);
        assert_eq!(item.number, 270);
        assert_eq!(item.status, "In Progress");
    }

    #[test]
    fn test_kpi_report_creation() {
        let report = KPIReport {
            total_tasks: 100,
            completed_tasks: 45,
            completion_rate: 45.0,
            total_hours: 450.0,
            total_cost: 12.50,
            avg_quality_score: 87.5,
            by_agent: std::collections::HashMap::new(),
            by_phase: std::collections::HashMap::new(),
        };

        assert_eq!(report.completion_rate, 45.0);
        assert_eq!(report.total_tasks, 100);
    }
}
