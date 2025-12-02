//! Issue analysis logic

use miyabi_types::{DevIssue, Issue, ToolResponse};
use serde::{Deserialize, Serialize};

/// Complexity level of an Issue
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ComplexityLevel {
    /// Low complexity (< 5.0): Can be auto-approved
    Low,
    /// Medium complexity (5.0-7.0): Notify and proceed with monitoring
    Medium,
    /// High complexity (>= 7.0): Escalate to human
    High,
}

impl ComplexityLevel {
    /// Convert to numeric score (0.0-10.0)
    pub fn to_score(&self) -> f64 {
        match self {
            ComplexityLevel::Low => 3.0,
            ComplexityLevel::Medium => 6.0,
            ComplexityLevel::High => 8.0,
        }
    }

    /// Create from numeric score
    pub fn from_score(score: f64) -> Self {
        if score < 5.0 {
            ComplexityLevel::Low
        } else if score < 7.0 {
            ComplexityLevel::Medium
        } else {
            ComplexityLevel::High
        }
    }
}

/// Result of Issue analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueAnalysis {
    /// Issue number
    pub issue_number: u64,

    /// Estimated complexity score (0.0-10.0)
    pub complexity: f64,

    /// Complexity level category
    pub complexity_level: ComplexityLevel,

    /// Suggested labels
    pub labels: Vec<String>,

    /// Estimated duration in hours
    pub estimated_duration_hours: u32,

    /// Reasoning for the complexity estimate
    pub reasoning: String,
}

impl IssueAnalysis {
    /// Analyze an Issue and estimate complexity
    pub fn analyze(issue: &Issue) -> Self {
        let complexity = Self::estimate_complexity(issue);
        let complexity_level = ComplexityLevel::from_score(complexity);
        let labels = Self::suggest_labels(issue);
        let estimated_duration_hours = (complexity * 2.0) as u32;
        let reasoning = Self::generate_reasoning(issue, complexity);

        Self {
            issue_number: issue.number,
            complexity,
            complexity_level,
            labels,
            estimated_duration_hours,
            reasoning,
        }
    }

    /// Estimate complexity (0-10)
    fn estimate_complexity(issue: &Issue) -> f64 {
        let mut complexity: f64 = 3.0; // Base complexity

        // Increase for longer descriptions
        if issue.body.len() > 500 {
            complexity += 1.0;
        }
        if issue.body.len() > 1000 {
            complexity += 1.0;
        }

        // Combine title and body for keyword analysis
        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        // High complexity indicators
        if combined_text.contains("database") || combined_text.contains("migration") {
            complexity += 2.0;
        }
        if combined_text.contains("security") || combined_text.contains("auth") {
            complexity += 1.5;
        }
        if combined_text.contains("refactor") || combined_text.contains("架構") {
            complexity += 1.0;
        }
        if combined_text.contains("breaking change") || combined_text.contains("api change") {
            complexity += 2.0;
        }

        // Medium complexity indicators
        if combined_text.contains("integration") || combined_text.contains("統合") {
            complexity += 1.0;
        }
        if combined_text.contains("performance") || combined_text.contains("optimization") {
            complexity += 1.5;
        }

        // Multiple file changes
        if combined_text.contains("multiple files") || combined_text.contains("複数") {
            complexity += 1.0;
        }

        // Testing requirements
        if combined_text.contains("test") || combined_text.contains("テスト") {
            complexity += 0.5;
        }

        // Cap at 10.0
        complexity.min(10.0)
    }

    /// Suggest labels based on issue content
    fn suggest_labels(issue: &Issue) -> Vec<String> {
        let mut labels = Vec::new();

        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        // Type detection
        if combined_text.contains("bug") || combined_text.contains("fix") || combined_text.contains("バグ") {
            labels.push("type:bug".to_string());
        } else if combined_text.contains("feature") || combined_text.contains("add") || combined_text.contains("機能")
        {
            labels.push("type:feature".to_string());
        } else if combined_text.contains("refactor") || combined_text.contains("リファクタ") {
            labels.push("type:refactor".to_string());
        } else if combined_text.contains("docs") || combined_text.contains("documentation") {
            labels.push("type:docs".to_string());
        } else if combined_text.contains("test") || combined_text.contains("テスト") {
            labels.push("type:test".to_string());
        } else {
            // Default to feature if unclear
            labels.push("type:feature".to_string());
        }

        // Priority detection
        if combined_text.contains("urgent") || combined_text.contains("critical") || combined_text.contains("緊急") {
            labels.push("priority:P0-Critical".to_string());
        } else if combined_text.contains("important")
            || combined_text.contains("high")
            || combined_text.contains("重要")
        {
            labels.push("priority:P1-High".to_string());
        } else if combined_text.contains("low") || combined_text.contains("nice to have") {
            labels.push("priority:P3-Low".to_string());
        } else {
            labels.push("priority:P2-Medium".to_string());
        }

        // Component detection
        if combined_text.contains("agent") || combined_text.contains("エージェント") {
            labels.push("component:agent".to_string());
        }
        if combined_text.contains("webhook") {
            labels.push("component:webhook".to_string());
        }
        if combined_text.contains("orchestrator") || combined_text.contains("オーケストレーター") {
            labels.push("component:orchestrator".to_string());
        }

        // State label
        labels.push("state:pending".to_string());

        labels
    }

    /// Generate reasoning for complexity estimate
    fn generate_reasoning(issue: &Issue, complexity: f64) -> String {
        let combined_text = format!("{} {}", issue.title, issue.body).to_lowercase();

        let mut reasons = Vec::new();

        if complexity < 5.0 {
            reasons.push("Relatively straightforward implementation");
        }

        if combined_text.contains("database") {
            reasons.push("Database changes require careful migration planning");
        }
        if combined_text.contains("security") {
            reasons.push("Security implications require thorough review");
        }
        if combined_text.contains("refactor") {
            reasons.push("Refactoring may affect multiple components");
        }
        if combined_text.contains("breaking change") {
            reasons.push("Breaking changes require version bump and documentation");
        }
        if issue.body.len() > 1000 {
            reasons.push("Detailed description suggests substantial scope");
        }

        if reasons.is_empty() {
            format!("Complexity score: {:.1}/10.0 based on keyword analysis", complexity)
        } else {
            format!("Complexity score: {:.1}/10.0. {}", complexity, reasons.join(". "))
        }
    }
}

/// Detect if a ToolResponse indicates an error and create a DevIssue if necessary
///
/// This function analyzes a tool response and automatically generates a DevIssue
/// when it detects error conditions based on:
/// - The `is_error` flag being true
/// - Presence of error keywords in the response text
///
/// # Error Keywords Detected
/// - "error", "exception"
/// - "oauth", "redirect_uri", "token" (authentication issues)
/// - "invalid", "unauthorized", "forbidden"
/// - "failed", "failure"
///
/// # Arguments
/// * `response` - The tool response to analyze
///
/// # Returns
/// * `Some(DevIssue)` - If an error is detected
/// * `None` - If no error is detected
///
/// # Examples
/// ```
/// use miyabi_agent_issue::analysis::detect_issue_from_tool_response;
/// use miyabi_types::ToolResponse;
///
/// let response = ToolResponse::error("lark_send_message", "OAuth error: invalid redirect_uri");
/// let issue = detect_issue_from_tool_response(&response);
/// assert!(issue.is_some());
/// ```
pub fn detect_issue_from_tool_response(response: &ToolResponse) -> Option<DevIssue> {
    // Check if is_error flag is set
    let has_error_flag = response.is_error;

    // Check for error keywords in text
    let text_lower = response.text.to_lowercase();
    let error_keywords = [
        // Generic errors
        "error",
        "exception",
        "failed",
        "failure",
        // Authentication/Authorization
        "oauth",
        "redirect_uri",
        "token",
        "unauthorized",
        "forbidden",
        "authentication",
        "invalid_grant",
        "access_denied",
        // Validation
        "invalid",
        "validation error",
        "bad request",
        // Network/API
        "timeout",
        "connection refused",
        "not found",
        "internal server error",
    ];

    let has_error_keyword = error_keywords.iter().any(|keyword| text_lower.contains(keyword));

    // If either condition is true, create a DevIssue
    if has_error_flag || has_error_keyword {
        let title = format!("Tool Error: {} - {}", response.tool_name, extract_error_summary(&response.text));

        let mut body_parts = vec![
            "## Error Detection".to_string(),
            format!("**Tool**: `{}`", response.tool_name),
            format!("**Error Flag**: {}", has_error_flag),
        ];

        if let Some(error_code) = &response.error_code {
            body_parts.push(format!("**Error Code**: `{}`", error_code));
        }

        body_parts.push(String::new()); // Empty line
        body_parts.push("## Error Details".to_string());
        body_parts.push(format!("```\n{}\n```", response.text));

        if let Some(metadata) = &response.metadata {
            body_parts.push(String::new());
            body_parts.push("## Metadata".to_string());
            for (key, value) in metadata {
                body_parts.push(format!("- **{}**: {}", key, value));
            }
        }

        body_parts.push(String::new());
        body_parts.push("## Suggested Actions".to_string());
        body_parts.push(suggest_actions(&response.text));

        let body = body_parts.join("\n");

        let labels = infer_error_labels(&response.text, &response.tool_name);

        Some(DevIssue::with_labels(title, body, labels))
    } else {
        None
    }
}

/// Extract a short error summary from error text (max 60 chars)
fn extract_error_summary(text: &str) -> String {
    let first_line = text.lines().next().unwrap_or("Unknown error");
    if first_line.len() > 60 {
        format!("{}...", &first_line[..57])
    } else {
        first_line.to_string()
    }
}

/// Suggest actions based on error content
fn suggest_actions(text: &str) -> String {
    let text_lower = text.to_lowercase();

    let mut actions = Vec::new();

    if text_lower.contains("oauth") || text_lower.contains("redirect_uri") || text_lower.contains("token") {
        actions.push("- Check OAuth configuration (App ID, Secret, Redirect URI)");
        actions.push("- Verify token validity and expiration");
        actions.push("- Review authentication flow");
    }

    if text_lower.contains("invalid") || text_lower.contains("validation") {
        actions.push("- Validate input parameters");
        actions.push("- Check API documentation for required fields");
    }

    if text_lower.contains("timeout") || text_lower.contains("connection") {
        actions.push("- Check network connectivity");
        actions.push("- Verify service endpoint availability");
        actions.push("- Consider retry logic with backoff");
    }

    if text_lower.contains("unauthorized") || text_lower.contains("forbidden") {
        actions.push("- Verify user permissions");
        actions.push("- Check API scopes and access rights");
    }

    if actions.is_empty() {
        actions.push("- Review error logs for more details");
        actions.push("- Check tool configuration");
        actions.push("- Consult tool documentation");
    }

    actions.join("\n")
}

/// Infer appropriate labels based on error type
fn infer_error_labels(text: &str, tool_name: &str) -> Vec<String> {
    let mut labels = vec![
        "type:bug".to_string(),
        "state:pending".to_string(),
    ];

    let text_lower = text.to_lowercase();

    // Priority detection
    if text_lower.contains("critical") || text_lower.contains("production") {
        labels.push("priority:P0-Critical".to_string());
    } else if text_lower.contains("oauth")
        || text_lower.contains("authentication")
        || text_lower.contains("unauthorized")
    {
        labels.push("priority:P1-High".to_string());
    } else if text_lower.contains("timeout") || text_lower.contains("connection") {
        labels.push("priority:P1-High".to_string());
    } else {
        labels.push("priority:P2-Medium".to_string());
    }

    // Component detection based on tool name
    if tool_name.contains("lark") {
        labels.push("component:lark".to_string());
    } else if tool_name.contains("github") {
        labels.push("component:github".to_string());
    } else if tool_name.contains("agent") {
        labels.push("component:agent".to_string());
    }

    // Category detection
    if text_lower.contains("oauth") || text_lower.contains("auth") || text_lower.contains("token") {
        labels.push("category:security".to_string());
    } else if text_lower.contains("network") || text_lower.contains("timeout") || text_lower.contains("connection") {
        labels.push("category:infrastructure".to_string());
    }

    labels
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::issue::IssueStateGithub;

    fn create_test_issue(number: u64, title: &str, body: &str) -> Issue {
        Issue {
            number,
            title: title.to_string(),
            body: body.to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/test/repo/issues/{}", number),
        }
    }

    #[test]
    fn test_low_complexity() {
        let issue = create_test_issue(123, "Add button", "Simple UI change");
        let analysis = IssueAnalysis::analyze(&issue);

        assert_eq!(analysis.complexity_level, ComplexityLevel::Low);
        assert!(analysis.complexity < 5.0);
    }

    #[test]
    fn test_high_complexity_database() {
        let issue =
            create_test_issue(123, "Database migration", "Add new database table for users with migration scripts");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.complexity >= 5.0);
        assert!(analysis.labels.contains(&"type:feature".to_string()));
    }

    #[test]
    fn test_bug_label_detection() {
        let issue = create_test_issue(123, "Fix login bug", "Users cannot login");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.labels.contains(&"type:bug".to_string()));
    }

    #[test]
    fn test_priority_detection() {
        let issue = create_test_issue(123, "Urgent fix needed", "Critical production issue");
        let analysis = IssueAnalysis::analyze(&issue);

        assert!(analysis.labels.contains(&"priority:P0-Critical".to_string()));
    }

    #[test]
    fn test_complexity_level_from_score() {
        assert_eq!(ComplexityLevel::from_score(3.0), ComplexityLevel::Low);
        assert_eq!(ComplexityLevel::from_score(6.0), ComplexityLevel::Medium);
        assert_eq!(ComplexityLevel::from_score(8.0), ComplexityLevel::High);
    }

    // ========================================================================
    // detect_issue_from_tool_response Tests
    // ========================================================================

    #[test]
    fn test_detect_issue_from_error_flag() {
        let response = ToolResponse::error("lark_send_message", "Failed to send message");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.title.contains("lark_send_message"));
        assert!(issue.title.contains("Failed to send message"));
        assert!(issue.labels.is_some());
        let labels = issue.labels.unwrap();
        assert!(labels.contains(&"type:bug".to_string()));
    }

    #[test]
    fn test_detect_issue_from_oauth_keyword() {
        let response = ToolResponse::success(
            "lark_auth",
            "OAuth error: invalid redirect_uri parameter",
        );
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.body.contains("OAuth"));
        assert!(issue.body.contains("redirect_uri"));
        assert!(issue.labels.is_some());
        let labels = issue.labels.unwrap();
        assert!(labels.contains(&"priority:P1-High".to_string()));
        assert!(labels.contains(&"category:security".to_string()));
        assert!(labels.contains(&"component:lark".to_string()));
    }

    #[test]
    fn test_detect_issue_from_token_keyword() {
        let response = ToolResponse::success("api_call", "Invalid token provided");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.body.contains("Invalid token"));
        let labels = issue.labels.as_ref().unwrap();
        assert!(labels.contains(&"category:security".to_string()));
    }

    #[test]
    fn test_detect_issue_from_exception_keyword() {
        let response = ToolResponse::success(
            "process_data",
            "Exception occurred: NullPointerException at line 123",
        );
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.title.contains("Exception"));
    }

    #[test]
    fn test_detect_issue_from_unauthorized() {
        let response = ToolResponse::success("github_api", "401 Unauthorized: Access denied");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        let labels = issue.labels.as_ref().unwrap();
        assert!(labels.contains(&"priority:P1-High".to_string()));
        assert!(labels.contains(&"component:github".to_string()));
    }

    #[test]
    fn test_detect_issue_from_timeout() {
        let response = ToolResponse::success("network_request", "Request timeout after 30 seconds");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        let labels = issue.labels.as_ref().unwrap();
        assert!(labels.contains(&"priority:P1-High".to_string()));
        assert!(labels.contains(&"category:infrastructure".to_string()));
    }

    #[test]
    fn test_no_issue_for_success() {
        let response = ToolResponse::success("operation", "Operation completed successfully");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_none());
    }

    #[test]
    fn test_extract_error_summary_short() {
        let summary = extract_error_summary("Short error");
        assert_eq!(summary, "Short error");
    }

    #[test]
    fn test_extract_error_summary_long() {
        let long_text = "This is a very long error message that exceeds sixty characters in total length";
        let summary = extract_error_summary(long_text);
        assert_eq!(summary.len(), 60); // 57 + "..."
        assert!(summary.ends_with("..."));
    }

    #[test]
    fn test_suggest_actions_oauth() {
        let actions = suggest_actions("OAuth authentication failed: invalid client_id");
        assert!(actions.contains("OAuth configuration"));
        assert!(actions.contains("token validity"));
    }

    #[test]
    fn test_suggest_actions_validation() {
        let actions = suggest_actions("Validation error: field 'email' is required");
        assert!(actions.contains("Validate input parameters"));
        assert!(actions.contains("API documentation"));
    }

    #[test]
    fn test_suggest_actions_network() {
        let actions = suggest_actions("Connection timeout occurred");
        assert!(actions.contains("network connectivity"));
        assert!(actions.contains("retry logic"));
    }

    #[test]
    fn test_infer_error_labels_critical() {
        let labels = infer_error_labels("Critical production error", "app");
        assert!(labels.contains(&"priority:P0-Critical".to_string()));
    }

    #[test]
    fn test_infer_error_labels_auth_high_priority() {
        let labels = infer_error_labels("OAuth authentication failed", "lark_auth");
        assert!(labels.contains(&"priority:P1-High".to_string()));
        assert!(labels.contains(&"category:security".to_string()));
        assert!(labels.contains(&"component:lark".to_string()));
    }

    #[test]
    fn test_infer_error_labels_network_infrastructure() {
        let labels = infer_error_labels("Network timeout error", "api");
        assert!(labels.contains(&"category:infrastructure".to_string()));
        assert!(labels.contains(&"priority:P1-High".to_string()));
    }

    #[test]
    fn test_detect_issue_with_error_code() {
        let response = ToolResponse::error("api_call", "Service unavailable")
            .with_error_code("503");
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.body.contains("**Error Code**: `503`"));
    }

    #[test]
    fn test_detect_issue_with_metadata() {
        let mut metadata = std::collections::HashMap::new();
        metadata.insert("user_id".to_string(), "12345".to_string());
        metadata.insert("timestamp".to_string(), "2025-12-02T10:00:00Z".to_string());

        let response = ToolResponse::error("user_operation", "Operation failed").with_metadata(metadata);
        let issue = detect_issue_from_tool_response(&response);

        assert!(issue.is_some());
        let issue = issue.unwrap();
        assert!(issue.body.contains("## Metadata"));
        assert!(issue.body.contains("user_id"));
        assert!(issue.body.contains("12345"));
    }
}
