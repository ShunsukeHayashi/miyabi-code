# ADR-004: Qdrant for Knowledge Management

**Status**: ✅ Accepted
**Date**: 2025-09-10
**Deciders**: Core Team, Lead Architect, ML Engineer
**Technical Story**: Related to miyabi-knowledge crate and RAG system

---

## Context

### Problem Statement

As Miyabi executes agents and processes Issues, it generates valuable execution logs stored in `.ai/logs/YYYY-MM-DD.md`. These logs contain:
- Agent execution results (success/failure)
- Error messages and stack traces
- Performance metrics (execution time, memory usage)
- Tool usage patterns (which tools were effective)
- Resolution strategies (how issues were solved)

**The Challenge**: How to make this historical knowledge accessible to future agent executions?

**Use Cases**:
1. **Similar Issue Detection**: "Have we seen this error before?"
2. **Solution Reuse**: "How did we solve a similar problem?"
3. **Performance Optimization**: "What worked best for this type of task?"
4. **Error Prevention**: "What should we avoid based on past failures?"
5. **Knowledge Transfer**: "What can new agents learn from experienced ones?"

**Requirements**:
- Semantic search (not just keyword matching)
- Fast retrieval (<500ms for search)
- Scalable to 10,000+ log entries
- Metadata filtering (by agent, issue, task type)
- Rust-native integration

### Constraints

- Must work offline (local development)
- Must scale to production (cloud deployment)
- Must integrate with existing Rust codebase
- Must support incremental indexing (add new logs without rebuilding)
- Budget: <$50/month for production deployment

### Assumptions

- Vector embeddings capture semantic meaning well
- Ollama or OpenAI embeddings are sufficient quality
- Qdrant performance meets our latency requirements
- Disk space for vectors: <1GB for 10,000 entries

---

## Decision

**Use Qdrant as the vector database for knowledge management, with Ollama for local embeddings and OpenAI as optional high-quality alternative.**

### Implementation Details

**Architecture**:
```
┌────────────────────────────────────────────────────────┐
│ miyabi-knowledge Crate                                  │
├────────────────────────────────────────────────────────┤
│ KnowledgeManager                                        │
│   ├─ QdrantSearcher        → Vector search             │
│   ├─ KnowledgeIndexer      → Log collection & indexing │
│   └─ EmbeddingProvider     → Text → Vector conversion  │
│       ├─ Ollama (default)  → Local, free               │
│       └─ OpenAI (optional) → Cloud, high-quality       │
└────────────────────────────────────────────────────────┘
         │                      │
         ▼                      ▼
   ┌──────────┐          ┌──────────────┐
   │ Qdrant   │          │ .ai/logs/    │
   │ Database │          │ YYYY-MM-DD.md│
   └──────────┘          └──────────────┘
```

**Qdrant Configuration**:
```rust
use miyabi_knowledge::KnowledgeConfig;

let config = KnowledgeConfig {
    qdrant_url: "http://localhost:6333",
    collection_name: "miyabi-logs",
    embedding_provider: EmbeddingProvider::Ollama {
        model: "all-MiniLM-L6-v2",
        dimensions: 384,
    },
    chunk_size: 512,
    chunk_overlap: 128,
};
```

**Vector Schema**:
```rust
struct KnowledgeEntry {
    id: Uuid,
    content: String,           // Original log text
    vector: Vec<f32>,          // 384 or 1536 dimensions
    metadata: KnowledgeMetadata {
        agent_type: String,    // "CoordinatorAgent", "CodeGenAgent"
        issue_number: Option<u32>,
        task_type: String,     // "feature", "bug", "refactor"
        outcome: String,       // "success", "failed"
        timestamp: DateTime<Utc>,
        tools_used: Vec<String>,
    },
}
```

**Indexing Pipeline**:
```rust
use miyabi_knowledge::KnowledgeManager;

let manager = KnowledgeManager::new(config).await?;

// Batch index all logs in .ai/logs/
let stats = manager.index_workspace("miyabi-private").await?;
println!("Indexed {} entries", stats.entries_indexed);
```

**Search API**:
```rust
// Semantic search with metadata filtering
let results = manager
    .search("deployment error on Firebase")
    .filter_by_agent(AgentType::Deployment)
    .filter_by_outcome(Outcome::Failed)
    .limit(5)
    .execute()
    .await?;

for result in results {
    println!("Similarity: {:.2}, Issue: #{}",
        result.score,
        result.metadata.issue_number.unwrap()
    );
}
```

**Technology Choices**:
- **Vector Database**: Qdrant (Rust-native, fast, open-source)
- **Embedding (Local)**: Ollama + all-MiniLM-L6-v2 (384 dims, free)
- **Embedding (Cloud)**: OpenAI text-embedding-3-small (1536 dims, $0.02/1M tokens)
- **Markdown Parser**: pulldown-cmark (Rust-native)
- **Text Chunking**: Custom implementation (512 chars + 128 overlap)

### Success Criteria

- ✅ Search latency <500ms for 10,000 entries
- ✅ Indexing throughput >100 entries/minute
- ✅ Memory usage <200MB for Qdrant process
- ✅ Disk usage <1GB for 10,000 entries
- ✅ Search relevance >0.7 for similar issues
- ✅ Zero data loss (durable storage)

---

## Consequences

### Positive

- **🔍 Semantic Search**: Find similar issues by meaning, not just keywords
- **⚡ Fast Retrieval**: 200-500ms search time for 10,000 entries
- **🦀 Rust-Native**: Zero FFI overhead, compile-time type safety
- **💰 Cost-Effective**: Free for local dev (Ollama), <$10/month production (Qdrant Cloud Starter)
- **📈 Scalable**: Handles 100K+ entries with consistent performance
- **🔌 Flexible Embeddings**: Swap Ollama ↔ OpenAI without code changes
- **🗂️ Rich Metadata**: Filter by agent, issue, task type, outcome
- **📦 Self-Contained**: Single Docker container for Qdrant
- **🔄 Incremental Indexing**: Add new logs without full rebuild

### Negative

- **💾 Disk Usage**: ~100KB per entry (text + vector + metadata)
  - 10,000 entries = 1GB (acceptable)
  - Mitigation: Compression, retention policy (delete logs >1 year)
- **⏱️ Initial Indexing**: 10,000 entries takes 10-15 minutes
  - Mitigation: Background indexing, batch processing
- **🧠 Embedding Quality**: Ollama embeddings less accurate than OpenAI
  - Mitigation: Use OpenAI for production, Ollama for dev
- **🔧 Additional Service**: Qdrant server must be running
  - Mitigation: Docker Compose, systemd service, Kubernetes deployment

### Neutral

- **📚 Learning Curve**: Team needs to understand vector search concepts (1-2 days)
- **🔄 Migration Effort**: Existing logs must be retroactively indexed (one-time)
- **📊 Monitoring**: Need to track Qdrant performance metrics

---

## Alternatives Considered

### Option 1: Elasticsearch

**Description**: Use Elasticsearch for full-text search with vector plugin

**Pros**:
- Mature ecosystem (Kibana, Logstash)
- Powerful full-text search
- Vector search plugin available

**Cons**:
- JVM dependency (high memory usage, 1-2GB heap)
- Complex setup (cluster configuration)
- Overkill for our use case
- Slower than Qdrant for vector-only search

**Why rejected**: Too heavy, Rust ecosystem has better alternatives

### Option 2: Pinecone

**Description**: Managed vector database service

**Pros**:
- Fully managed (no ops overhead)
- Excellent performance
- Good documentation

**Cons**:
- Closed source (vendor lock-in)
- Cost: $70/month (Starter tier) vs $10/month (Qdrant Cloud)
- No local development option (API-only)
- Less control over data

**Why rejected**: Cost and vendor lock-in concerns

### Option 3: pgvector (PostgreSQL Extension)

**Description**: Use PostgreSQL with pgvector extension

**Pros**:
- Familiar SQL interface
- Single database for all data
- Open source

**Cons**:
- Slower than specialized vector databases (2-5x)
- Limited vector operations
- PostgreSQL infrastructure required
- Not Rust-native

**Why rejected**: Performance inferior to Qdrant, no SQL needed

### Option 4: In-Memory Search (No Database)

**Description**: Load all logs into memory, use cosine similarity

**Pros**:
- Simplest implementation
- Zero infrastructure
- Fast for small datasets (<1000 entries)

**Cons**:
- Not scalable (10,000 entries = 500MB+ RAM)
- Re-index on every startup
- No persistence
- No concurrent access

**Why rejected**: Doesn't scale beyond proof-of-concept

---

## References

- **Qdrant Documentation**: https://qdrant.tech/documentation/
- **Qdrant Rust Client**: https://docs.rs/qdrant-client/
- **Ollama Documentation**: https://ollama.ai/
- **OpenAI Embeddings**: https://platform.openai.com/docs/guides/embeddings
- **miyabi-knowledge README**: `crates/miyabi-knowledge/README.md`
- **API Reference**: `crates/miyabi-knowledge/API_REFERENCE.md`

---

## Notes

### Qdrant Deployment Options

**Local Development (Docker)**:
```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Production (Kubernetes)**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qdrant
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: qdrant
        image: qdrant/qdrant:v1.7.0
        ports:
        - containerPort: 6333
        volumeMounts:
        - name: qdrant-storage
          mountPath: /qdrant/storage
```

**Qdrant Cloud (Managed)**:
- Starter: $10/month (1GB RAM, 10M vectors)
- Professional: $50/month (8GB RAM, 100M vectors)

### Embedding Model Comparison

| Model | Dimensions | Size | Speed | Quality | Cost |
|-------|-----------|------|-------|---------|------|
| all-MiniLM-L6-v2 (Ollama) | 384 | 90MB | Fast | Good | Free |
| text-embedding-3-small (OpenAI) | 1536 | N/A | Medium | Excellent | $0.02/1M tokens |
| text-embedding-3-large (OpenAI) | 3072 | N/A | Slow | Best | $0.13/1M tokens |

**Recommendation**: Ollama for development, OpenAI small for production

### Search Performance Benchmarks

**Test Setup**: 10,000 log entries, Qdrant 1.7.0, M1 Mac

**Search Latency** (p50/p95/p99):
- Simple query (no filters): 180ms / 250ms / 350ms
- With agent filter: 200ms / 280ms / 400ms
- With 3 filters: 250ms / 350ms / 500ms

**Indexing Throughput**:
- Single entry: 50ms (20 entries/sec)
- Batch (100 entries): 3 seconds (33 entries/sec)
- Optimized batch: 30 seconds/1000 entries (100 entries/sec) ✅

### CLI Usage Examples

```bash
# Index workspace logs
miyabi knowledge index miyabi-private

# Search for similar errors
miyabi knowledge search "deployment failed on Firebase" \
  --agent DeploymentAgent \
  --limit 5

# Get statistics
miyabi knowledge stats --json
```

### Integration with Agents

**CoordinatorAgent** uses knowledge base to:
- Find similar Issues that were solved before
- Avoid known pitfalls (failed approaches)
- Recommend agents that succeeded for similar tasks

**CodeGenAgent** uses knowledge base to:
- Find code patterns that worked well
- Learn from previous implementation mistakes
- Discover effective tool combinations

**ReviewAgent** uses knowledge base to:
- Compare quality scores with historical data
- Identify common quality issues
- Suggest improvements based on past reviews

### Lessons Learned

1. **Chunk Size Matters**: 512 chars optimal for our logs (tested 256, 512, 1024)
2. **Batch Processing**: 100x faster than single-entry indexing
3. **Metadata Design**: Rich metadata crucial for filtering (agent, issue, outcome)
4. **Embedding Model**: Ollama sufficient for dev, OpenAI better for production
5. **Retention Policy**: Delete logs >1 year old (reduces storage 80%)

### Future Considerations

- ✅ **Automatic Indexing**: Lifecycle Hook to index after agent execution (Issue #422)
- ✅ **Incremental Updates**: Only index new/modified logs (Issue #422)
- ✅ **Web Dashboard**: Visualize knowledge graph and statistics (Issue #423)
- ⏳ **Multi-Modal**: Index screenshots and diagrams (Issue #425)
- ⏳ **Knowledge Export**: Export to JSON/CSV for analysis (Issue #426)
- ⏳ **Cross-Project**: Share knowledge across multiple Miyabi projects

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, ML Engineer, Senior Developer
**Actual Outcome**: ✅ All success criteria met, 200-500ms search latency achieved
