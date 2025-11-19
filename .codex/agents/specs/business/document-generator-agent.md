# DocumentGeneratorAgent (Codex)

**Agent ID**: 202 | **Type**: Business | **Priority**: P0

## 🎯 Purpose
Generate AI-powered business documents (proposals, reports, presentations) using LLM.

## 📋 Spec

| Property | Value |
|----------|-------|
| Input | Document type, template, data points |
| Output | Formatted document (Markdown/DOCX/PDF) |
| Duration | 2-5 minutes |
| Dependencies | miyabi-llm, PostgreSQL |

## 💻 Implementation

```rust
pub struct DocumentGeneratorAgent {
    llm_provider: Arc<dyn LlmProvider>,
    state_manager: Arc<StateManager>,
}

impl Agent for DocumentGeneratorAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        let request: DocumentGenerationRequest = parse_request(task)?;

        // 1. Generate content
        let content = self.generate_document_content(&request).await?;

        // 2. Format (Markdown → DOCX/PDF)
        let formatted = self.format_document(&content, request.format).await?;

        // 3. Store
        self.store_document(&formatted).await?;

        // 4. Update state
        update_ai_job_state(&self.state_manager, task.id, &formatted).await?;

        Ok(AgentResult::success())
    }
}
```

## 🔗 Related
- `CourseGeneratorAgent`
- `crates/miyabi-agent-business/src/document_generator.rs`

**Phase**: 4 | **Effort**: 2 days
