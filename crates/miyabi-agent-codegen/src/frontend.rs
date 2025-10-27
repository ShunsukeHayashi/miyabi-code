//! Frontend task detection for Claudable integration

use miyabi_types::Task;

/// Keywords that indicate a frontend generation task
const FRONTEND_KEYWORDS: &[&str] = &[
    // UI/Frontend
    "ui",
    "dashboard",
    "frontend",
    "web app",
    "webapp",
    // Frameworks
    "next.js",
    "nextjs",
    "react",
    "vue",
    "svelte",
    // Pages
    "landing page",
    "lp",
    "homepage",
    "page",
    // Components
    "form",
    "chart",
    "graph",
    "table",
    "component",
    "button",
    "modal",
    "dialog",
    // Styling
    "tailwind",
    "css",
    "style",
    "design",
    "layout",
    // UI Libraries
    "shadcn",
    "mui",
    "chakra",
    "ant design",
];

/// Detect if a task requires frontend generation
///
/// # Arguments
///
/// * `task` - Task to analyze
///
/// # Returns
///
/// `true` if the task contains frontend-related keywords
///
/// # Example
///
/// ```
/// use miyabi_types::{Task, TaskType, AgentType};
/// use miyabi_agent_codegen::frontend::is_frontend_task;
///
/// let task = Task {
///     id: "1".to_string(),
///     title: "Create dashboard UI".to_string(),
///     description: "Build a dashboard with charts".to_string(),
///     task_type: TaskType::Feature,
///     priority: 1,
///     severity: None,
///     impact: None,
///     assigned_agent: Some(AgentType::CodeGenAgent),
///     dependencies: vec![],
///     estimated_duration: None,
///     status: None,
///     start_time: None,
///     end_time: None,
///     metadata: None,
/// };
///
/// assert!(is_frontend_task(&task));
/// ```
pub fn is_frontend_task(task: &Task) -> bool {
    let title_lower = task.title.to_lowercase();
    let desc_lower = task.description.to_lowercase();

    FRONTEND_KEYWORDS
        .iter()
        .any(|keyword| title_lower.contains(keyword) || desc_lower.contains(keyword))
}

/// Extract frontend description from task
///
/// Combines task title and description to create a comprehensive
/// description for Claudable API.
///
/// # Arguments
///
/// * `task` - Task to extract description from
///
/// # Returns
///
/// Combined description string
pub fn extract_frontend_description(task: &Task) -> String {
    format!("{}\n\n{}", task.title, task.description)
}

/// Calculate confidence score for frontend task detection
///
/// # Arguments
///
/// * `task` - Task to analyze
///
/// # Returns
///
/// Confidence score from 0.0 to 1.0
pub fn frontend_confidence_score(task: &Task) -> f64 {
    let title_lower = task.title.to_lowercase();
    let desc_lower = task.description.to_lowercase();

    let mut matches = 0;
    let total_keywords = FRONTEND_KEYWORDS.len();

    for keyword in FRONTEND_KEYWORDS {
        if title_lower.contains(keyword) || desc_lower.contains(keyword) {
            matches += 1;
        }
    }

    // Calculate score: number of matches / total keywords
    // Clamp to 1.0 if multiple keywords match
    let score = (matches as f64) / (total_keywords as f64) * 10.0;
    score.min(1.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;
    use miyabi_types::{AgentType, Task};

    fn create_test_task(title: &str, description: &str) -> Task {
        Task {
            id: "test-1".to_string(),
            title: title.to_string(),
            description: description.to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    #[test]
    fn test_is_frontend_task_ui_keyword() {
        let task = create_test_task("Create dashboard UI", "");
        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_frontend_task_nextjs_keyword() {
        let task = create_test_task("Implement feature", "Use Next.js for this");
        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_frontend_task_chart_keyword() {
        let task = create_test_task("Add sales chart", "Display revenue chart");
        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_frontend_task_landing_page() {
        let task = create_test_task("Build landing page", "Create marketing LP");
        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_not_frontend_task() {
        let task = create_test_task("Fix backend API bug", "Database query optimization");
        assert!(!is_frontend_task(&task));
    }

    #[test]
    fn test_is_not_frontend_task_backend() {
        let task = create_test_task("Implement authentication", "Add JWT token validation");
        assert!(!is_frontend_task(&task));
    }

    #[test]
    fn test_extract_frontend_description() {
        let task = create_test_task("Create dashboard", "With charts and tables");
        let description = extract_frontend_description(&task);
        assert!(description.contains("Create dashboard"));
        assert!(description.contains("With charts and tables"));
    }

    #[test]
    fn test_frontend_confidence_score_high() {
        let task = create_test_task(
            "Create Next.js dashboard UI",
            "Build a landing page with charts and forms using Tailwind CSS",
        );
        let score = frontend_confidence_score(&task);
        assert!(score > 0.1, "Score should be > 0.1, got {}", score);
    }

    #[test]
    fn test_frontend_confidence_score_zero() {
        let task = create_test_task("Fix database bug", "Optimize SQL queries");
        let score = frontend_confidence_score(&task);
        assert_eq!(score, 0.0);
    }

    #[test]
    fn test_frontend_keywords_coverage() {
        // Verify all keyword categories are covered
        assert!(FRONTEND_KEYWORDS.contains(&"ui"));
        assert!(FRONTEND_KEYWORDS.contains(&"nextjs"));
        assert!(FRONTEND_KEYWORDS.contains(&"chart"));
        assert!(FRONTEND_KEYWORDS.contains(&"tailwind"));
        assert!(FRONTEND_KEYWORDS.contains(&"landing page"));
    }
}
