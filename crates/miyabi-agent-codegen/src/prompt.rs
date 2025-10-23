//! プロンプト生成ユーティリティ
//!
//! CodeGenAgent が LLM に渡す指示文を組み立てる。

use miyabi_types::Task;

/// タスク内容からコード生成用プロンプトを構築する
pub fn build_code_generation_prompt(task: &Task) -> String {
    let mut prompt = String::new();

    prompt.push_str("# Code Generation Task\n\n");
    prompt.push_str(&format!("**Task ID**: {}\n", task.id));
    prompt.push_str(&format!("**Title**: {}\n", task.title));
    prompt.push_str(&format!("**Type**: {:?}\n", task.task_type));
    prompt.push_str(&format!("**Priority**: {}\n\n", task.priority));

    if let Some(ref severity) = task.severity {
        prompt.push_str(&format!("**Severity**: {:?}\n", severity));
    }

    if let Some(ref impact) = task.impact {
        prompt.push_str(&format!("**Impact**: {:?}\n", impact));
    }

    prompt.push_str("\n## Description\n");
    prompt.push_str(&task.description);
    prompt.push_str("\n\n");

    if !task.dependencies.is_empty() {
        prompt.push_str("## Dependencies\n");
        for dep in &task.dependencies {
            prompt.push_str(&format!("- {}\n", dep));
        }
        prompt.push('\n');
    }

    prompt.push_str("## Instructions\n");
    prompt.push_str("Please generate the necessary Rust code to implement this task.\n\n");
    prompt.push_str("Requirements:\n");
    prompt.push_str("1. Generate clean, idiomatic Rust code\n");
    prompt.push_str("2. Include proper error handling\n");
    prompt.push_str("3. Add comprehensive tests\n");
    prompt.push_str("4. Include Rustdoc documentation\n");
    prompt.push_str("5. Follow Rust best practices\n\n");

    prompt.push_str("Please provide:\n");
    prompt.push_str("- Complete Rust implementation\n");
    prompt.push_str("- Unit tests with #[cfg(test)]\n");
    prompt.push_str("- Rustdoc comments (///)\n");
    prompt.push_str("- Error handling with Result<T, E>\n");

    prompt
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::task::TaskType;
    use miyabi_types::Task;

    fn sample_task() -> Task {
        let mut task = Task::new(
            "task-1".to_string(),
            "Implement new feature".to_string(),
            "Feature description".to_string(),
            TaskType::Feature,
            1,
        )
        .expect("valid task");
        task.dependencies = vec!["task-0".to_string()];
        task.severity = Some(miyabi_types::agent::Severity::High);
        task.impact = Some(miyabi_types::agent::ImpactLevel::High);
        task.estimated_duration = Some(30);
        task
    }

    #[test]
    fn prompt_contains_required_sections() {
        let prompt = build_code_generation_prompt(&sample_task());

        assert!(prompt.contains("# Code Generation Task"));
        assert!(prompt.contains("**Task ID**: task-1"));
        assert!(prompt.contains("**Title**: Implement new feature"));
        assert!(prompt.contains("**Type**: Feature"));
        assert!(prompt.contains("**Priority**: 1"));
        assert!(prompt.contains("**Severity**: High"));
        assert!(prompt.contains("**Impact**: High"));
        assert!(prompt.contains("## Description"));
        assert!(prompt.contains("Feature description"));
        assert!(prompt.contains("## Dependencies"));
        assert!(prompt.contains("- task-0"));
        assert!(prompt.contains("## Instructions"));
        assert!(prompt.contains("Generate clean, idiomatic Rust code"));
    }

    #[test]
    fn prompt_handles_minimal_task() {
        let task = Task::new(
            "task-min".to_string(),
            "Minimal task".to_string(),
            "Just do it".to_string(),
            TaskType::Refactor,
            2,
        )
        .expect("valid task");

        let prompt = build_code_generation_prompt(&task);

        assert!(prompt.contains("**Task ID**: task-min"));
        assert!(prompt.contains("**Title**: Minimal task"));
        assert!(prompt.contains("**Type**: Refactor"));
        assert!(prompt.contains("**Priority**: 2"));
        assert!(!prompt.contains("**Severity**:"));
        assert!(!prompt.contains("**Impact**:"));
        assert!(!prompt.contains("## Dependencies"));
    }
}
