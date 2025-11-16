//! Automatic Execution Mode
//!
//! Fully automated code generation using LLM providers.
//! This is the default mode for CodeGenAgent.

use miyabi_types::Task;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

use super::ModeExecutor;

/// Auto mode executor (LLM-driven)
pub struct AutoMode {
    /// LLM provider to use (e.g., "gpt-oss:20b", "claude-sonnet-4")
    llm_provider: String,
}

impl AutoMode {
    /// Create a new auto mode executor
    pub fn new(llm_provider: impl Into<String>) -> Self {
        Self {
            llm_provider: llm_provider.into(),
        }
    }

    /// Execute code generation using LLM
    async fn generate_with_llm(&self, task: &Task) -> Result<String> {
        // This will delegate to the existing CodeGenAgent LLM logic
        // For now, return a placeholder indicating LLM execution

        // Extract issue number from metadata
        let issue_number = task
            .metadata
            .as_ref()
            .and_then(|m| m.get("issue_number"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        println!("\n🤖 Auto Mode: Generating code with LLM provider: {}", self.llm_provider);
        println!("📋 Issue: #{}", issue_number);
        println!("⏳ This may take a few minutes...\n");

        // TODO: Integrate with existing miyabi-llm provider
        // For now, return error to indicate LLM integration needed
        Err(format!(
            "LLM provider '{}' integration pending. Use --mode manual to implement manually.",
            self.llm_provider
        )
        .into())
    }
}

impl ModeExecutor for AutoMode {
    async fn execute(&self, task: &Task) -> Result<String> {
        self.generate_with_llm(task)
            .await
            .map_err(|e| format!("Auto mode: LLM code generation failed: {}", e).into())
    }

    fn mode_name(&self) -> &'static str {
        "auto"
    }

    fn requires_human(&self) -> bool {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_auto_mode_llm_provider() {
        let auto_mode = AutoMode::new("gpt-oss:20b");
        assert_eq!(auto_mode.llm_provider, "gpt-oss:20b");
        assert_eq!(auto_mode.mode_name(), "auto");
        assert!(!auto_mode.requires_human());
    }

    #[tokio::test]
    async fn test_auto_mode_execution_pending() {
        let auto_mode = AutoMode::new("test-provider");

        let task = Task {
            id: "test-task".to_string(),
            title: "Auto Mode Test".to_string(),
            description: "Test auto mode execution".to_string(),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: Vec::new(),
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        // Currently returns error until LLM integration is complete
        let result = auto_mode.execute(&task).await;
        assert!(result.is_err());
    }
}
