# miyabi-historical

[![Crates.io](https://img.shields.io/crates/v/miyabi-historical.svg)](https://crates.io/crates/miyabi-historical)
[![Documentation](https://docs.rs/miyabi-historical/badge.svg)](https://docs.rs/miyabi-historical)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Status**: Stable | **Category**: Integration

Historical AI personality system with RAG (Retrieval-Augmented Generation) - Chat with Oda Nobunaga (織田信長), Sakamoto Ryoma (坂本龍馬), and Tokugawa Ieyasu (徳川家康) for strategic advice and historical wisdom.

## 📋 Overview

`miyabi-historical` provides a comprehensive AI-powered system for interacting with historical Japanese figures. It combines:

- 🎭 **Character System**: YAML-defined personalities with historical authenticity
- 🔍 **RAG Pipeline**: Wikipedia-based knowledge retrieval with vector search
- 🧠 **LLM Integration**: Claude AI for natural conversation generation
- 🌐 **REST API**: Axum web server for chatbot interactions
- 📚 **Vector Storage**: Qdrant integration for semantic search

**Use Cases**:
- Strategic business advice from historical leaders
- Educational conversations about Japanese history
- Character-based AI assistants with historical context
- RAG demonstrations and experimentation

## 🚀 Features

### Historical Characters (3 Figures)

| Character | Era | Specialties |
|-----------|-----|-------------|
| **織田信長 (Oda Nobunaga)** | Sengoku Period (1534-1582) | Military strategy, innovation, leadership |
| **坂本龍馬 (Sakamoto Ryoma)** | Bakumatsu Period (1836-1867) | Diplomacy, modernization, political reform |
| **徳川家康 (Tokugawa Ieyasu)** | Edo Period (1543-1616) | Long-term planning, patience, governance |

### RAG Pipeline Components

1. **Data Collection** (`data_collection.rs`)
   - Wikipedia API integration
   - Article extraction and preprocessing
   - Multi-language support (Japanese/English)

2. **Text Embedding** (`embedding.rs`)
   - Chunk-based text segmentation
   - Configurable chunk size and overlap
   - Vector generation for semantic search

3. **Vector Storage** (`vector_store.rs`)
   - Qdrant client integration
   - Document indexing and retrieval
   - Collection management

4. **Knowledge Retrieval** (`retrieval.rs`)
   - Semantic search with similarity scoring
   - Top-K result retrieval
   - Context-aware document ranking

### API Server (Axum)

- **Endpoint**: `POST /api/chat`
- **CORS**: Enabled for all origins
- **Tracing**: Request/response logging
- **Error Handling**: Structured JSON error responses

## 📦 Installation

### As a Library

Add to your `Cargo.toml`:

```toml
[dependencies]
miyabi-historical = "0.1.0"
```

### As a Binary (API Server)

```bash
# Install from source
cd crates/miyabi-historical
cargo build --release --bin miyabi-historical-api

# Or via cargo install
cargo install --path crates/miyabi-historical --bin miyabi-historical-api
```

## 🔧 Usage

### Running the API Server

```bash
# Set required environment variable
export ANTHROPIC_API_KEY=sk-ant-xxx

# Optional: Configure Qdrant (defaults to localhost:6334)
export QDRANT_URL=http://localhost:6334

# Optional: Set server port (defaults to 3000)
export PORT=3000

# Start server
cargo run --bin miyabi-historical-api
```

**Server Output**:
```
🚀 Starting Miyabi Historical API Server
✅ Application state initialized
🎯 Server listening on http://0.0.0.0:3000
📡 API endpoint: POST http://0.0.0.0:3000/api/chat

Available historical figures:
  - oda_nobunaga (織田信長)
  - sakamoto_ryoma (坂本龍馬)
  - tokugawa_ieyasu (徳川家康)
```

### API Request Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "oda_nobunaga",
    "message": "経営戦略について教えて",
    "user_id": "user_123"
  }'
```

**Response**:
```json
{
  "response": "うむ、経営戦略について聞きたいか。天下を取るには...",
  "figure": "oda_nobunaga",
  "timestamp": "2025-11-06T10:30:00Z"
}
```

### Using as a Library

#### 1. Load a Historical Character

```rust
use miyabi_historical::HistoricalCharacter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load character from YAML file
    let nobunaga = HistoricalCharacter::load("oda_nobunaga")?;

    println!("Name: {}", nobunaga.name);
    println!("Era: {}", nobunaga.era);
    println!("Title: {}", nobunaga.title);

    Ok(())
}
```

#### 2. Build AI Prompts

```rust
use miyabi_historical::{HistoricalCharacter, PromptBuilder};

let nobunaga = HistoricalCharacter::load("oda_nobunaga")?;
let builder = PromptBuilder::new(nobunaga);

let system_prompt = builder.build_system_prompt();
let user_prompt = builder.build_user_prompt(
    "How should I approach corporate strategy?",
    None  // Optional: RAG context
);

println!("System Prompt:\n{}", system_prompt);
println!("User Prompt:\n{}", user_prompt);
```

#### 3. RAG Pipeline - Data Collection

```rust
use miyabi_historical::ai::{WikipediaCollector, VectorStore};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize Wikipedia collector
    let collector = WikipediaCollector::new("ja");

    // Collect article content
    let article = collector.fetch_article("織田信長").await?;
    println!("Collected {} paragraphs", article.paragraphs.len());

    // Store in vector database (Qdrant)
    let vector_store = VectorStore::new("http://localhost:6334", "historical").await?;
    vector_store.index_article(&article).await?;

    Ok(())
}
```

#### 4. RAG Pipeline - Knowledge Retrieval

```rust
use miyabi_historical::ai::search_knowledge;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Search for relevant knowledge
    let results = search_knowledge(
        "http://localhost:6334",
        "historical",
        "織田信長の戦略",
        5  // top 5 results
    ).await?;

    for (i, doc) in results.iter().enumerate() {
        println!("Result {}: {} (score: {:.3})",
            i + 1,
            doc.text.chars().take(100).collect::<String>(),
            doc.score
        );
    }

    Ok(())
}
```

#### 5. Complete Chat Flow

```rust
use miyabi_historical::{HistoricalCharacter, PromptBuilder};
use miyabi_historical::ai::search_knowledge;
use miyabi_llm::LlmClient;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 1. Load character
    let nobunaga = HistoricalCharacter::load("oda_nobunaga")?;

    // 2. Retrieve relevant knowledge
    let query = "経営戦略について教えて";
    let context_docs = search_knowledge(
        "http://localhost:6334",
        "historical",
        query,
        3
    ).await?;

    let context = context_docs.iter()
        .map(|d| d.text.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");

    // 3. Build prompts
    let builder = PromptBuilder::new(nobunaga);
    let system_prompt = builder.build_system_prompt();
    let user_prompt = builder.build_user_prompt(query, Some(&context));

    // 4. Call LLM
    let llm_client = LlmClient::from_env()?;
    let response = llm_client.chat(
        &system_prompt,
        &user_prompt
    ).await?;

    println!("Response: {}", response);

    Ok(())
}
```

## 🏗️ Architecture

```
miyabi-historical
├── ai/                          # RAG Pipeline
│   ├── character.rs             # Character definitions (YAML)
│   ├── prompt_builder.rs        # System/user prompt generation
│   ├── data_collection.rs       # Wikipedia API integration
│   ├── embedding.rs             # Text chunking & vectorization
│   ├── vector_store.rs          # Qdrant client wrapper
│   ├── retrieval.rs             # Semantic search
│   └── error.rs                 # Error types
│
├── api/                         # REST API (Axum)
│   ├── models.rs                # Request/response types
│   ├── routes/                  # HTTP handlers
│   │   ├── chat.rs              # POST /api/chat
│   │   └── mod.rs
│   └── state.rs                 # AppState (shared state)
│
├── bin/
│   └── miyabi-historical-api.rs # Binary entry point
│
└── lib.rs                       # Public API

Dependencies:
├── miyabi-llm                   # LLM abstraction layer
├── miyabi-types                 # Shared types
├── qdrant-client                # Vector database client
├── axum                         # Web framework
├── serde/serde_yaml             # YAML character files
└── reqwest                      # HTTP client (Wikipedia API)
```

## 🎭 Character Definition Format

Characters are defined in YAML files:

```yaml
# prompts/oda_nobunaga.yaml
name: 織田信長
english_name: Oda Nobunaga
era: 戦国時代
title: 戦国大名

personality:
  core:
    - 革新的思考
    - 果断な決断力
  traits:
    - 伝統にとらわれない
    - リスクを恐れない

tone:
  speaking_style:
    - "うむ"で始める
    - 断定的な口調
  examples:
    - "うむ、それは興味深い"
    - "天下布武のためには..."

specialties:
  - 軍事戦略
  - 経済改革
  - 技術革新

historical_episodes:
  - title: 桶狭間の戦い
    lesson: 少数で大軍を破る奇襲戦略
    context: 今川義元の大軍に対して...
    application: ビジネスでの競合対策に応用可能

advice_style:
  approach:
    - 歴史的事例から学ぶ
    - 具体的な行動を提案
  structure:
    - 問題分析
    - 歴史的類似例
    - 現代への応用
    - 具体的アクション

constraints:
  - 歴史的事実を尊重
  - キャラクターを維持
```

## 🧪 Testing

### Run Tests

```bash
# All tests
cargo test -p miyabi-historical

# Unit tests only
cargo test -p miyabi-historical --lib

# Integration tests (requires Qdrant + API key)
cargo test -p miyabi-historical --test '*' -- --ignored

# With output
cargo test -p miyabi-historical -- --nocapture
```

### Environment Setup for Tests

```bash
# Required for LLM tests
export ANTHROPIC_API_KEY=sk-ant-xxx

# Required for vector store tests
docker run -d -p 6334:6334 qdrant/qdrant

# Optional: Verbose logging
export RUST_LOG=miyabi_historical=debug
```

### Example Test

```rust
#[tokio::test]
async fn test_character_loading() {
    let nobunaga = HistoricalCharacter::load("oda_nobunaga").unwrap();

    assert_eq!(nobunaga.name, "織田信長");
    assert_eq!(nobunaga.era, "戦国時代");
    assert!(!nobunaga.specialties.is_empty());
}

#[tokio::test]
async fn test_prompt_building() {
    let nobunaga = HistoricalCharacter::load("oda_nobunaga").unwrap();
    let builder = PromptBuilder::new(nobunaga);

    let system_prompt = builder.build_system_prompt();
    assert!(system_prompt.contains("織田信長"));

    let user_prompt = builder.build_user_prompt("テスト質問", None);
    assert!(user_prompt.contains("テスト質問"));
}
```

## 🔗 Dependencies

### Core Dependencies

- **miyabi-llm** - LLM abstraction layer (Anthropic Claude)
- **miyabi-types** - Shared type definitions
- **qdrant-client** (v1.7) - Vector database client
- **axum** (v0.7) - Web framework for REST API
- **tower-http** (v0.5) - Middleware (CORS, tracing)
- **serde/serde_yaml** - YAML character file parsing
- **reqwest** - HTTP client for Wikipedia API
- **tokio** (v1.42) - Async runtime
- **tracing** - Structured logging

## 📚 Related Crates

### Infrastructure

- **miyabi-llm** - LLM client abstraction (used for AI responses)
- **miyabi-types** - Common types
- **miyabi-knowledge** - General knowledge management (similar RAG system)

### Potential Integration

- **miyabi-agent-business** - Business agents could consult historical figures
- **miyabi-cli** - CLI interface for historical chat
- **miyabi-web-api** - Integration with main Miyabi web API

## 📖 Documentation

- **RAG Architecture**: See `src/ai/lib.rs` for pipeline overview
- **API Specification**: See `src/api/models.rs` for request/response schemas
- **Character Guide**: See `prompts/` directory for character YAML examples
- **Qdrant Docs**: [qdrant.tech/documentation](https://qdrant.tech/documentation/)

## 🌐 Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

  historical-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - QDRANT_URL=http://qdrant:6334
    depends_on:
      - qdrant

volumes:
  qdrant_data:
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | - | Claude AI API key |
| `QDRANT_URL` | ❌ No | `http://localhost:6334` | Qdrant server URL |
| `PORT` | ❌ No | `3000` | API server port |
| `RUST_LOG` | ❌ No | `info` | Logging level |

## 🎯 Roadmap

### Completed (v0.1.0)

- ✅ Character system with YAML definitions
- ✅ RAG pipeline (Wikipedia → Qdrant → LLM)
- ✅ REST API with Axum
- ✅ 3 historical figures (Nobunaga, Ryoma, Ieyasu)

### Planned (v0.2.0)

- ⏳ More historical figures (10+ total)
- ⏳ Multi-turn conversation support
- ⏳ Conversation history storage
- ⏳ User preference learning
- ⏳ Web UI (React/Next.js)

### Future (v1.0.0)

- 🔮 Multi-language support (English, Chinese)
- 🔮 Voice interaction (TTS/STT)
- 🔮 Historical event timeline integration
- 🔮 Collaborative advice (multiple figures in one chat)

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

### Adding New Characters

1. Create YAML file in `prompts/` directory
2. Define personality, tone, specialties, episodes
3. Add character to `character.rs` load logic
4. Update API server startup message
5. Add tests for new character
6. Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🔖 Version History

- **v0.1.0** (2025-11-06) - Initial release
  - Character system with YAML definitions
  - RAG pipeline (Wikipedia + Qdrant + Claude)
  - REST API server (Axum)
  - 3 historical figures (Oda Nobunaga, Sakamoto Ryoma, Tokugawa Ieyasu)

---

**Part of the [Miyabi Framework](../../README.md)** - Autonomous AI Development Platform

**Historical Figures**: 織田信長 (Oda Nobunaga) | 坂本龍馬 (Sakamoto Ryoma) | 徳川家康 (Tokugawa Ieyasu)
