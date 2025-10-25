# Miyabi Historical AI

RAG (Retrieval-Augmented Generation) pipeline for historical figures knowledge management.

## Overview

This crate provides a complete RAG system for managing and searching historical figure knowledge:

- **Data Collection**: Fetch historical data from Wikipedia API
- **Text Embedding**: Convert text to vector embeddings (mock implementation)
- **Vector Storage**: Store and manage embeddings with Qdrant integration
- **Semantic Search**: Search for relevant knowledge using cosine similarity

## Features

- Wikipedia API integration for data collection
- Automatic text chunking with configurable overlap
- Mock embedding system (ready for real model integration)
- Qdrant vector database support
- Metadata filtering (by figure, source, etc.)
- Cosine similarity search
- Comprehensive test suite

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-historical-ai = { path = "../miyabi-historical-ai" }
```

## Quick Start

### 1. Fetch and Ingest Historical Data

```rust
use miyabi_historical_ai::{
    WikipediaCollector, TextEmbedder, VectorStore,
    retrieval::ingest_figure_data,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize vector store
    let embedder = TextEmbedder::default();
    let vector_store = VectorStore::new(
        "historical_figures".to_string(),
        embedder.embedding_dim()
    ).await?;

    // Initialize collection
    vector_store.initialize_collection().await?;

    // Ingest data for a historical figure
    let doc_count = ingest_figure_data("織田信長", &vector_store).await?;
    println!("Ingested {} documents", doc_count);

    Ok(())
}
```

### 2. Search for Knowledge

```rust
use miyabi_historical_ai::search_knowledge;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Search for relevant knowledge
    let results = search_knowledge(
        "織田信長の戦略について",  // query
        "織田信長",                // figure to filter
        5                          // top k results
    ).await?;

    // Display results
    for doc in results {
        println!("Score: {:.3}", doc.score);
        println!("Text: {}", doc.text);
        println!("---");
    }

    Ok(())
}
```

### 3. Manual Data Pipeline

```rust
use miyabi_historical_ai::{
    WikipediaCollector, TextEmbedder, VectorStore, Document,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Step 1: Fetch data from Wikipedia
    let collector = WikipediaCollector::new();
    let chunks = collector.fetch_and_chunk("織田信長", 512, 50).await?;

    // Step 2: Generate embeddings
    let embedder = TextEmbedder::default();
    let embeddings = embedder.embed_batch(&chunks).await?;

    // Step 3: Store in vector database
    let vector_store = VectorStore::new(
        "historical_figures".to_string(),
        embedder.embedding_dim()
    ).await?;

    let documents: Vec<Document> = chunks
        .into_iter()
        .zip(embeddings)
        .enumerate()
        .map(|(i, (text, embedding))| {
            Document::new(
                format!("nobunaga-chunk-{}", i),
                text,
                embedding,
            )
            .with_metadata("figure".to_string(), "織田信長".to_string())
            .with_metadata("source".to_string(), "wikipedia".to_string())
        })
        .collect();

    vector_store.insert_batch(documents).await?;

    Ok(())
}
```

## Architecture

### Module Structure

```
crates/miyabi-historical-ai/src/
├── lib.rs              # Public API exports
├── data_collection.rs  # Wikipedia API integration
├── embedding.rs        # Text to vector conversion
├── vector_store.rs     # Qdrant integration
└── retrieval.rs        # High-level search API
```

### Data Flow

```
Wikipedia → Text Chunks → Embeddings → Vector Store → Search Results
    ↓           ↓            ↓             ↓              ↓
  API Call   Chunking   Mock/Real     Qdrant       Cosine Sim
```

## Configuration

### Chunk Configuration

```rust
use miyabi_historical_ai::{ChunkConfig, TextEmbedder};

let config = ChunkConfig {
    chunk_size: 512,  // tokens per chunk
    overlap: 50,      // overlap between chunks
};

let embedder = TextEmbedder::new(config, 384);
```

### Embedding Dimension

Default: 384 (compatible with sentence-transformers)

```rust
// Use default (384)
let embedder = TextEmbedder::default();

// Custom dimension
let embedder = TextEmbedder::new(config, 768);
```

## Mock vs Production

### Current Implementation (Mock)

- **Embedding**: Deterministic hash-based vectors
- **Vector Store**: In-memory storage
- **Purpose**: Development and testing

### Production Setup (TODO)

Replace mock implementations with:

1. **Real Embedding Model**:
   ```rust
   // Example: OpenAI Embeddings
   let client = OpenAIClient::new(api_key);
   let embedding = client.create_embedding(text).await?;
   ```

2. **Actual Qdrant Client**:
   ```rust
   let client = QdrantClient::new("http://localhost:6333")?;
   client.create_collection(...).await?;
   ```

## Testing

Run all tests:

```bash
# Run all tests
cargo test -p miyabi-historical-ai

# Skip integration tests (requires network)
SKIP_INTEGRATION_TESTS=1 cargo test -p miyabi-historical-ai

# Run specific test
cargo test -p miyabi-historical-ai test_embed_text
```

### Test Coverage

- Wikipedia data collection: 4 tests
- Text embedding: 5 tests
- Vector store: 5 tests
- Retrieval: 3 tests

Total: 17 tests

## Examples

### Example 1: Ingest Multiple Figures

```rust
let figures = vec!["織田信長", "豊臣秀吉", "徳川家康"];

for figure in figures {
    let count = ingest_figure_data(figure, &vector_store).await?;
    println!("Ingested {} documents for {}", count, figure);
}
```

### Example 2: Search with Metadata Filter

```rust
let embedder = TextEmbedder::default();
let vector_store = VectorStore::new("test".to_string(), 384).await?;

let query_embedding = embedder.embed_text("戦略").await?;

let mut filter = HashMap::new();
filter.insert("figure".to_string(), "織田信長".to_string());
filter.insert("source".to_string(), "wikipedia".to_string());

let results = vector_store
    .search(&query_embedding, 10, Some(filter))
    .await?;
```

### Example 3: Batch Processing

```rust
let figures = vec!["織田信長", "豊臣秀吉", "徳川家康"];
let queries = vec!["戦略", "政治", "外交"];

for figure in &figures {
    for query in &queries {
        let results = search_knowledge(query, figure, 3).await?;
        println!("{} - {}: {} results", figure, query, results.len());
    }
}
```

## Roadmap

### Phase 1: Core Infrastructure (✅ Complete)
- [x] Wikipedia API integration
- [x] Mock embedding system
- [x] In-memory vector store
- [x] Basic search functionality
- [x] Comprehensive tests

### Phase 2: Production Integration (TODO)
- [ ] Real embedding model integration (OpenAI/sentence-transformers)
- [ ] Actual Qdrant client connection
- [ ] Persistent storage configuration
- [ ] Performance optimization

### Phase 3: Advanced Features (TODO)
- [ ] Multi-language support
- [ ] Advanced chunking strategies
- [ ] Hybrid search (vector + keyword)
- [ ] Result re-ranking
- [ ] Caching layer

## Dependencies

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
qdrant-client = "1.7"
tracing = "0.1"
```

## License

Apache-2.0

## Contributing

This crate is part of the Miyabi project. See the main repository for contribution guidelines.

## Related Crates

- `miyabi-types`: Core type definitions
- `miyabi-llm`: LLM abstraction layer
- `miyabi-knowledge`: Knowledge management system

---

## Character-Based AI Prompts (NEW)

In addition to the RAG system, this crate now provides a character-based AI prompt generation system for historical figures.

### Supported Characters

- **Oda Nobunaga** (1534-1582): Revolutionary innovator, decisive leader
- **Sakamoto Ryoma** (1836-1867): Diplomatic mediator, visionary
- **Tokugawa Ieyasu** (1543-1616): Patient strategist, institution builder

### Character Prompt Usage

```rust
use miyabi_historical_ai::{PromptBuilder, HistoricalCharacter};

// Load a character and build prompts
let builder = PromptBuilder::new("oda_nobunaga")?;

let query = "How should I handle organizational resistance to change?";
let (system_prompt, user_prompt) = builder.build_prompt_pair(
    query,
    None,  // Optional RAG context
    &[],   // Optional context documents
)?;

// Use with LLM
// let response = llm_client.chat(system_prompt, user_prompt).await?;
```

### Character Definition Format

Each character is defined in `prompts/*.yaml`:

```yaml
name: Oda Nobunaga
english_name: Oda Nobunaga
era: Sengoku period (1534-1582)
title: Revolutionary Innovator

personality:
  core:
    - Revolutionary thinking
    - Rationalist
  traits:
    - Breaks conventional wisdom

tone:
  speaking_style:
    - "~であろう"
    - "~せよ"
  examples:
    - "その策は愚かであろう"

specialties:
  - Strategic management
  - Innovation

historical_episodes:
  - title: Battle of Okehazama (1560)
    lesson: Surprise tactics
    context: Defeated 25,000 with 2,000
    application: Avoid head-on competition

advice_style:
  approach:
    - Analyze thoroughly
    - Question assumptions
```

### Test Dialogues

See `prompts/test_dialogues.md` for 10 example conversations covering:
- Organizational change management
- Negotiation and mediation
- Long-term strategy planning
- Innovation adoption
- Career transitions
- Crisis management

### Character Tests

Run character-specific tests:

```bash
# All character tests
cargo test -p miyabi-historical-ai character::

# Specific character
cargo test -p miyabi-historical-ai test_load_oda_nobunaga

# Prompt builder tests
cargo test -p miyabi-historical-ai prompt_builder::
```

---

**Note**: This crate combines both RAG infrastructure (in progress with mock implementations) and character-based prompt generation (production-ready). For RAG features, integrate with real embedding models and Qdrant server.
