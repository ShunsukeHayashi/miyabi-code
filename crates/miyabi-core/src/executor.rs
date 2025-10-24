//! Autonomous Task Executor
//!
//! This module implements the autonomous execution loop that allows Miyabi to:
//! 1. Communicate with LLM (Claude)
//! 2. Execute tools based on LLM decisions
//! 3. Track progress in a session
//! 4. Complete tasks autonomously

use crate::{JsonlWriter, Session, ToolRegistry};
use miyabi_llm::{AnthropicClient, OpenAIClient, LlmClient, Message, ToolCallResponse};
use miyabi_types::error::Result;
use miyabi_types::MiyabiError;
use std::path::PathBuf;
use std::time::Instant;
use tracing::{debug, info, warn};

/// Maximum number of turns before forcing conclusion
const MAX_TURNS: usize = 50;

/// Maximum consecutive tool failures before aborting
const MAX_CONSECUTIVE_FAILURES: usize = 3;

/// Autonomous task executor
pub struct TaskExecutor {
    session: Session,
    llm_client: Box<dyn LlmClient>,
    tool_registry: ToolRegistry,
    max_turns: usize,
    working_dir: PathBuf,
    jsonl_writer: JsonlWriter,
    start_time: Option<Instant>,
}

impl TaskExecutor {
    /// Create a new task executor
    pub fn new(session: Session) -> Result<Self> {
        // Select LLM provider based on environment variable
        let provider = std::env::var("LLM_PROVIDER")
            .unwrap_or_else(|_| "anthropic".to_string())
            .to_lowercase();

        let llm_client: Box<dyn LlmClient> = match provider.as_str() {
            "openai" => {
                let client = OpenAIClient::from_env()
                    .map_err(|e| MiyabiError::Config(format!("Failed to create OpenAI client: {}", e)))?;
                Box::new(client)
            }
            "anthropic" | _ => {
                let client = AnthropicClient::from_env()
                    .map_err(|e| MiyabiError::Config(format!("Failed to create Anthropic client: {}", e)))?;
                Box::new(client)
            }
        };

        let tool_registry = ToolRegistry::new(session.mode.clone())
            .with_working_dir(session.context.cwd.clone());

        Ok(Self {
            session,
            llm_client,
            tool_registry,
            max_turns: MAX_TURNS,
            working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            jsonl_writer: JsonlWriter::stdout(false), // Disabled by default
            start_time: None,
        })
    }

    /// Enable JSONL output
    pub fn with_jsonl_output(mut self, enabled: bool) -> Self {
        self.jsonl_writer = JsonlWriter::stdout(enabled);
        self
    }

    /// Set custom LLM client (for testing or alternative providers)
    #[allow(dead_code)]
    pub fn with_llm_client(mut self, client: Box<dyn LlmClient>) -> Self {
        self.llm_client = client;
        self
    }

    /// Set maximum number of turns
    #[allow(dead_code)]
    pub fn with_max_turns(mut self, max_turns: usize) -> Self {
        self.max_turns = max_turns;
        self
    }

    /// Set working directory
    #[allow(dead_code)]
    pub fn with_working_dir(mut self, dir: PathBuf) -> Self {
        self.working_dir = dir;
        self
    }

    /// Build system prompt for autonomous execution
    fn build_system_prompt(&self) -> String {
        format!(
            r#"You are Miyabi, an autonomous code agent executing tasks.

**Current Task**: {}

**Execution Mode**: {:?}
- ReadOnly: You can read files, search code, and list directories
- FileEdits: You can also write and edit files
- FullAccess: You can also run commands, create issues, and create PRs

**Working Directory**: {}

**Your Goal**: Complete the task autonomously using the available tools. Think step-by-step:
1. Analyze the task
2. Plan your approach
3. Use tools to gather information or make changes
4. Verify your work
5. Provide a clear conclusion when done

**Important Rules**:
- Always explain your reasoning before calling tools
- Check results carefully before proceeding
- If you encounter errors, try alternative approaches
- When the task is complete, provide a clear summary
- Stay focused on the current task

**Available Tools**: You have access to tools for reading files, searching code, and (depending on execution mode) editing files and running commands.
"#,
            self.session.task,
            self.session.mode,
            self.working_dir.display()
        )
    }

    /// Run the autonomous execution loop
    pub async fn run(&mut self) -> Result<()> {
        info!("Starting autonomous execution for task: {}", self.session.task);

        // Record start time
        self.start_time = Some(Instant::now());

        // Emit session start event
        let _ = self.jsonl_writer.session_start(
            self.session.id.clone(),
            self.session.task.clone(),
            format!("{:?}", self.session.mode),
        );

        let mut messages = vec![
            Message::system(self.build_system_prompt()),
            Message::user(self.session.task.clone()),
        ];

        let mut consecutive_failures = 0;
        let mut turn_count = 0;

        loop {
            // Check turn limit
            if turn_count >= self.max_turns {
                warn!("Reached maximum turn limit ({}), forcing conclusion", self.max_turns);
                let error_msg = format!("Reached maximum turn limit of {}", self.max_turns);

                // Emit failure event
                let _ = self.jsonl_writer.failure(
                    error_msg.clone(),
                    false,
                    turn_count,
                );

                self.session.fail("Reached maximum turn limit without completing task".to_string(), false);
                self.session.save().map_err(|e| MiyabiError::Unknown(e.to_string()))?;
                return Err(MiyabiError::Unknown(error_msg));
            }

            turn_count += 1;
            debug!("Turn {}/{}", turn_count, self.max_turns);

            // Emit turn start event
            let _ = self.jsonl_writer.turn_start(turn_count);

            // Get tool definitions
            let tools = self.tool_registry.get_tool_definitions();

            // Call LLM with tools
            let response = self
                .llm_client
                .chat_with_tools(messages.clone(), tools)
                .await
                .map_err(|e| {
                    MiyabiError::Unknown(format!("LLM request failed: {}", e))
                })?;

            match response {
                ToolCallResponse::ToolCalls(calls) => {
                    debug!("LLM requested {} tool calls", calls.len());

                    // Execute each tool call
                    for call in &calls {
                        info!("Executing tool: {} (id: {})", call.name, call.id);

                        // Emit tool call event
                        let _ = self.jsonl_writer.tool_call(
                            call.name.clone(),
                            call.id.clone(),
                            call.arguments.clone(),
                        );

                        let tool_start = Instant::now();
                        let result = self.tool_registry.execute(call).await;

                        let tool_duration = tool_start.elapsed().as_millis() as u64;

                        match result {
                            Ok(tool_result) => {
                                info!("Tool {} succeeded", call.name);

                                // Emit tool result event (success)
                                let _ = self.jsonl_writer.tool_result(
                                    call.name.clone(),
                                    call.id.clone(),
                                    true,
                                    Some(tool_result.data.clone()),
                                    None,
                                    tool_duration,
                                );

                                // Add tool result to conversation
                                messages.push(Message::assistant(format!(
                                    "Tool {} executed successfully. Result: {}",
                                    call.name,
                                    serde_json::to_string(&tool_result.data).unwrap_or_default()
                                )));

                                consecutive_failures = 0;
                            }
                            Err(e) => {
                                warn!("Tool execution failed: {}", e);
                                consecutive_failures += 1;

                                // Emit tool result event (failure)
                                let _ = self.jsonl_writer.tool_result(
                                    call.name.clone(),
                                    call.id.clone(),
                                    false,
                                    None,
                                    Some(e.to_string()),
                                    tool_duration,
                                );

                                // Add error to conversation
                                messages.push(Message::user(format!(
                                    "Tool {} failed with error: {}. Please try a different approach.",
                                    call.name, e
                                )));

                                // Check consecutive failure limit
                                if consecutive_failures >= MAX_CONSECUTIVE_FAILURES {
                                    let error_msg = format!("Too many consecutive tool failures: {}", e);

                                    // Emit failure event
                                    let _ = self.jsonl_writer.failure(
                                        error_msg.clone(),
                                        false,
                                        turn_count,
                                    );

                                    self.session
                                        .fail(error_msg.clone(), false);
                                    self.session.save().map_err(|e| MiyabiError::Unknown(e.to_string()))?;
                                    return Err(MiyabiError::Unknown(format!(
                                        "Execution aborted after {} consecutive tool failures",
                                        MAX_CONSECUTIVE_FAILURES
                                    )));
                                }
                            }
                        }
                    }

                    // Save session after each iteration
                    self.session.save().map_err(|e| MiyabiError::Unknown(e.to_string()))?;

                    // Continue loop - LLM will decide next action
                }

                ToolCallResponse::Conclusion(summary) => {
                    info!("Task completed with conclusion: {}", summary);

                    // Calculate total duration
                    let total_duration = self.start_time
                        .map(|start| start.elapsed().as_millis() as u64)
                        .unwrap_or(0);

                    // Emit conclusion event
                    let _ = self.jsonl_writer.conclusion(
                        summary.clone(),
                        turn_count,
                        total_duration,
                    );

                    // Add final turn with conclusion
                    self.session.add_turn(summary);
                    self.session.complete();
                    self.session.save().map_err(|e| MiyabiError::Unknown(e.to_string()))?;

                    return Ok(());
                }

                ToolCallResponse::NeedApproval { action, reason } => {
                    // For now, treat this as an error - interactive mode not implemented yet
                    warn!("LLM requested approval for: {} (reason: {})", action, reason);
                    self.session.fail(format!(
                        "Interactive approval requested but not supported: {}",
                        action
                    ), false);
                    self.session.save().map_err(|e| MiyabiError::Unknown(e.to_string()))?;

                    return Err(MiyabiError::Unknown(
                        "Interactive mode not yet implemented".to_string(),
                    ));
                }
            }
        }
    }

    /// Get the session (useful for inspecting results)
    pub fn session(&self) -> &Session {
        &self.session
    }

    /// Get mutable session
    pub fn session_mut(&mut self) -> &mut Session {
        &mut self.session
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ExecutionMode;

    #[test]
    fn test_executor_creation() {
        // Skip if ANTHROPIC_API_KEY not set
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let session = Session::new("test task".to_string(), ExecutionMode::ReadOnly);
        let executor = TaskExecutor::new(session);

        assert!(executor.is_ok());
    }

    #[test]
    fn test_system_prompt_generation() {
        if std::env::var("ANTHROPIC_API_KEY").is_err() {
            return;
        }

        let session = Session::new("count lines of Rust code".to_string(), ExecutionMode::ReadOnly);
        let executor = TaskExecutor::new(session).unwrap();

        let prompt = executor.build_system_prompt();

        assert!(prompt.contains("count lines of Rust code"));
        assert!(prompt.contains("ReadOnly"));
        assert!(prompt.contains("Miyabi"));
    }
}
