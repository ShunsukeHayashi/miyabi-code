# ContentSearchAgent (Codex)

**Agent ID**: 203 | **Type**: Business | **Priority**: P1

## 🎯 Purpose
AI-powered semantic search across course content and documents using vector embeddings.

## 📋 Spec

| Property | Value |
|----------|-------|
| Input | Search query, filters |
| Output | Ranked search results with relevance scores |
| Duration | <1 second |
| Dependencies | miyabi-llm (embeddings), PostgreSQL (pgvector) |

## 💻 Implementation

```rust
pub struct ContentSearchAgent {
    llm_provider: Arc<dyn LlmProvider>,
    db_pool: PgPool,
}

impl Agent for ContentSearchAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        let query: SearchQuery = parse_request(task)?;

        // 1. Generate query embedding
        let embedding = self.llm_provider.embed(&query.text).await?;

        // 2. Vector similarity search
        let results = sqlx::query!(
            r#"
            SELECT id, title, content,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM content_embeddings
            WHERE 1 - (embedding <=> $1::vector) > 0.7
            ORDER BY similarity DESC
            LIMIT 20
            "#,
            embedding.as_slice()
        )
        .fetch_all(&self.db_pool)
        .await?;

        Ok(AgentResult::with_data(results))
    }
}
```

## 🔗 Related
- `crates/miyabi-knowledge` (vector store)
- PostgreSQL pgvector extension

**Phase**: 4 | **Effort**: 2-3 days
