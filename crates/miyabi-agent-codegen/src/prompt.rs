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
