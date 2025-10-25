# miyabi-knowledge

**Knowledge management system for Miyabi** - Vector database, embeddings, and search

## 📋 概要

Miyabiの実行履歴（ログファイル、成果物、Agent実行情報、ツール使用状況）をベクトルデータベース化し、ナレッジ検索可能な状態にします。

## 🚀 Features

- ✅ **ログ収集**: `.ai/logs/`, Worktree実行ログ、LDDLogを自動収集
- ✅ **ベクトル化**: テキストを384次元ベクトルに変換（Ollama統合）
- ✅ **検索**: 類似性検索 + メタデータフィルタリング
- ✅ **階層管理**: プロジェクト > Worktree > Agent
- ✅ **CLI統合**: `miyabi knowledge` コマンド（計画中）
- ✅ **MCP統合**: Claude Code自動参照（計画中）

## 📦 Installation

```toml
[dependencies]
miyabi-knowledge = { version = "1.0.0", path = "../miyabi-knowledge" }
```

## 🔧 Quick Start

```rust
use miyabi_knowledge::{KnowledgeManager, KnowledgeConfig};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // 設定ロード
    let config = KnowledgeConfig::default();

    // マネージャー初期化
    let manager = KnowledgeManager::new(config).await?;

    // ログ収集
    let entries = manager.collect(".ai/logs").await?;
    println!("Collected {} entries", entries.len());

    // インデックス化
    let stats = manager.index_batch(&entries).await?;
    println!("Indexed {} entries", stats.total);

    // 検索
    let results = manager.search("cargo build エラー").await?;
    for result in results {
        println!("Score: {:.2}, Content: {}", result.score, result.content);
    }

    Ok(())
}
```

## 📚 Architecture

### システム構成

```
miyabi-agents (実行)
  ↓ ログ出力
.ai/logs/ (ログファイル)
  ↓ 収集
KnowledgeCollector (構造化)
  ↓ ベクトル化
KnowledgeIndexer (Qdrant挿入)
  ↓ 検索
KnowledgeSearcher (類似性検索)
  ↓ 結果
ユーザー
```

### コンポーネント

- **KnowledgeCollector**: ログ収集・構造化
- **KnowledgeIndexer**: ベクトル化・DB挿入
- **KnowledgeSearcher**: 類似性検索
- **KnowledgeManager**: ファサードクラス（統合管理）

## 🔍 Usage Examples

### ログ収集

```rust
use miyabi_knowledge::{LogCollector, KnowledgeConfig};

let config = KnowledgeConfig::default();
let collector = LogCollector::new(config)?;

// ディレクトリから収集
let entries = collector.collect(".ai/logs").await?;

// Worktreeから収集
let entries = collector.collect_worktree("issue-270").await?;

// Agentから収集
let entries = collector.collect_agent("CodeGenAgent").await?;
```

### インデックス化

```rust
use miyabi_knowledge::{QdrantIndexer, KnowledgeConfig};

let config = KnowledgeConfig::default();
let indexer = QdrantIndexer::new(config).await?;

// 単一エントリをインデックス化
let id = indexer.index(&entry).await?;

// バッチインデックス化
let stats = indexer.index_batch(&entries).await?;
println!("Success: {}, Failed: {}", stats.success, stats.failed);

// ワークスペース全体をインデックス化
let stats = indexer.index_workspace("miyabi-private").await?;
```

### 検索

```rust
use miyabi_knowledge::{QdrantSearcher, SearchFilter, KnowledgeConfig};

let config = KnowledgeConfig::default();
let searcher = QdrantSearcher::new(config).await?;

// 基本検索
let results = searcher.search("Rust lifetime エラー").await?;

// フィルタ付き検索
let filter = SearchFilter::new()
    .with_agent("CodeGenAgent")
    .with_task_type("feature");
let results = searcher.search_filtered("認証機能の実装", filter).await?;

// 類似エントリ検索
let results = searcher.find_similar(&entry_id, 5).await?;
```

## ⚙️ Configuration

**.miyabi.yml**:

```yaml
knowledge:
  vector_db:
    type: "qdrant"
    host: "localhost"
    port: 6333
    collection: "miyabi-knowledge"

  embeddings:
    provider: "ollama"
    model: "all-MiniLM-L6-v2"
    dimension: 384

  workspace:
    name: "miyabi-private"
    hierarchy: "project > worktree > agent"

  collection:
    log_dir: ".ai/logs"
    worktree_dir: ".worktrees"
    auto_index: true
    batch_size: 100

  search:
    default_limit: 10
    min_score: 0.7
```

## 🧪 Testing

```bash
# テスト実行
cargo test --package miyabi-knowledge

# 詳細出力
cargo test --package miyabi-knowledge -- --nocapture

# 特定のテスト実行
cargo test --package miyabi-knowledge test_collect_empty_directory
```

## 🌐 Web UI Dashboard

**miyabi-knowledge** includes a built-in web dashboard for knowledge base visualization, search, and statistics.

### Running the Server

```bash
# Start Qdrant (required)
docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant

# Run the server
cargo run --package miyabi-knowledge --features server --bin miyabi-knowledge-server

# Or with custom port
PORT=3000 cargo run --package miyabi-knowledge --features server --bin miyabi-knowledge-server
```

### Accessing the Dashboard

Open your browser to: **http://localhost:8080**

### API Endpoints

- **GET /api/search?q=query** - Search knowledge base
  - Query params: `q`, `agent`, `workspace`, `issue`, `task_type`, `outcome`, `limit`
- **GET /api/stats** - Get dashboard statistics
- **GET /api/agents** - List all agents
- **GET /api/timeline?days=30** - Get timeline data
- **WS /ws** - WebSocket for real-time updates
- **GET /health** - Health check

### Example API Usage

```bash
# Search
curl "http://localhost:8080/api/search?q=cargo+build&limit=10"

# Get stats
curl http://localhost:8080/api/stats

# List agents
curl http://localhost:8080/api/agents

# Timeline
curl "http://localhost:8080/api/timeline?days=7"
```

## 🚧 Development Status

### ✅ Completed

- [x] Core trait definitions
- [x] Type definitions (KnowledgeEntry, KnowledgeMetadata, etc.)
- [x] Error types
- [x] Configuration management
- [x] Log collector implementation (Markdown parsing)
- [x] Indexer skeleton (placeholder)
- [x] Searcher skeleton (placeholder)
- [x] **Web UI Dashboard** (Issue #423) ✨
  - [x] Axum HTTP Server
  - [x] API endpoints (search, stats, agents, timeline)
  - [x] WebSocket real-time updates
  - [x] HTML/CSS/JS dashboard UI

### 🔄 In Progress

- [ ] Qdrant client integration
- [ ] miyabi-llm embeddings integration
- [ ] Full indexer implementation
- [ ] Full searcher implementation

### 📅 Planned

- [ ] CLI integration (`miyabi knowledge` command)
- [ ] MCP integration (Claude Code)
- [ ] Performance optimization
- [ ] Comprehensive documentation

## 📖 Documentation

- **Design Document**: [docs/KNOWLEDGE_MANAGEMENT_SYSTEM.md](../../docs/KNOWLEDGE_MANAGEMENT_SYSTEM.md)
- **API Reference**: (TBD)
- **User Guide**: (TBD)

## 🤝 Dependencies

- **miyabi-types**: Core type definitions
- **miyabi-core**: Common utilities
- **miyabi-llm**: LLM integration for embeddings
- **qdrant-client**: Vector database client
- **tokio**: Async runtime
- **serde**: Serialization
- **pulldown-cmark**: Markdown parsing
- **regex**: Pattern matching
- **walkdir**: Directory traversal

## 🔗 Related Crates

- **miyabi-agents**: Agent implementations
- **miyabi-llm**: LLM integration
- **miyabi-knowledge/potpie**: Potpie AI integration (Neo4j knowledge graph) - **Integrated in v0.1.1**
- **miyabi-cli**: CLI tool

## 📦 Potpie Integration (v0.1.1+)

The Potpie AI integration is now part of this crate as a submodule:

```rust
use miyabi_knowledge::potpie::{PotpieClient, PotpieConfig};

let config = PotpieConfig::default();
let client = PotpieClient::new(config)?;

// Use 8 Potpie tools: search_nodes, get_code_graph, detect_changes, etc.
let nodes = client.search_nodes("function", None).await?;
```

See [potpie module documentation](src/potpie/mod.rs) for details.

## 📄 License

Apache-2.0

## 🙏 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

**Status**: Phase 3 Implementation Complete ✅ → Phase 4 (Vectorization) Next 🚀
