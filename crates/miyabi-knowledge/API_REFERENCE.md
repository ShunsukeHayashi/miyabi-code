# Miyabi Knowledge Management System - API リファレンス

バージョン: 0.1.1
最終更新: 2025-10-22

---

## 📚 目次

1. [概要](#概要)
2. [Rust API](#rust-api)
3. [CLI API](#cli-api)
4. [MCP Server API](#mcp-server-api)
5. [型定義](#型定義)
6. [エラーハンドリング](#エラーハンドリング)

---

## 概要

Miyabi Knowledge Management Systemは、3つのAPIレイヤーを提供します:

- **Rust API**: プログラムから直接使用（`miyabi-knowledge` crate）
- **CLI API**: コマンドライン経由（`miyabi knowledge` コマンド）
- **MCP Server API**: JSON-RPC 2.0経由（`knowledge.search` メソッド）

---

## Rust API

### 🔧 KnowledgeManager

ナレッジ管理の統合インターフェース

#### 初期化

```rust
use miyabi_knowledge::{KnowledgeManager, KnowledgeConfig};

let config = KnowledgeConfig::default();
let manager = KnowledgeManager::new(config).await?;
```

#### メソッド

##### `new(config: KnowledgeConfig) -> Result<Self>`

新しいKnowledgeManagerを作成

**引数**:
- `config`: ナレッジシステムの設定

**戻り値**:
- `Result<KnowledgeManager>`: 初期化されたマネージャー

**エラー**:
- `KnowledgeError::Qdrant`: Qdrant接続失敗
- `KnowledgeError::Embedding`: Embedding Generator初期化失敗

##### `index_workspace(&self, workspace: &str) -> Result<IndexStats>`

ワークスペース全体をインデックス化

**引数**:
- `workspace`: ワークスペース名

**戻り値**:
- `IndexStats`: インデックス化統計

**例**:

```rust
let stats = manager.index_workspace("miyabi-private").await?;
println!("Total: {}, Success: {}, Failed: {}",
         stats.total, stats.success, stats.failed);
```

---

### 🔍 KnowledgeSearcher

ナレッジ検索トレイト

#### 実装: QdrantSearcher

```rust
use miyabi_knowledge::searcher::{QdrantSearcher, KnowledgeSearcher};

let config = KnowledgeConfig::default();
let searcher = QdrantSearcher::new(config).await?;
```

#### メソッド

##### `search(&self, query: &str) -> Result<Vec<KnowledgeResult>>`

クエリで検索

**引数**:
- `query`: 検索クエリ（自然言語）

**戻り値**:
- `Vec<KnowledgeResult>`: 検索結果リスト（スコア順）

**例**:

```rust
let results = searcher.search("error handling").await?;
for result in results {
    println!("Score: {:.2} - {}", result.score, result.content);
}
```

##### `search_filtered(&self, query: &str, filter: SearchFilter) -> Result<Vec<KnowledgeResult>>`

フィルタ付き検索

**引数**:
- `query`: 検索クエリ
- `filter`: メタデータフィルタ

**戻り値**:
- `Vec<KnowledgeResult>`: フィルタされた検索結果

**例**:

```rust
let filter = SearchFilter::new()
    .with_workspace("miyabi-private")
    .with_agent("CodeGenAgent")
    .with_outcome("success");

let results = searcher.search_filtered("deployment", filter).await?;
```

##### `find_similar(&self, entry_id: &KnowledgeId, limit: usize) -> Result<Vec<KnowledgeResult>>`

類似エントリ検索

**引数**:
- `entry_id`: 基準となるエントリID
- `limit`: 最大結果数

**戻り値**:
- `Vec<KnowledgeResult>`: 類似エントリリスト

---

### 📥 KnowledgeCollector

ログ収集トレイト

#### 実装: LogCollector

```rust
use miyabi_knowledge::collector::{LogCollector, CollectorConfig};

let config = CollectorConfig::default();
let collector = LogCollector::new(config)?;
```

#### メソッド

##### `collect(&self) -> Result<Vec<KnowledgeEntry>>`

ログファイルから収集

**戻り値**:
- `Vec<KnowledgeEntry>`: 収集されたエントリリスト

**例**:

```rust
let entries = collector.collect().await?;
println!("Collected {} entries", entries.len());
```

##### `collect_workspace(&self, workspace: &str) -> Result<Vec<KnowledgeEntry>>`

ワークスペース指定で収集

**引数**:
- `workspace`: ワークスペース名

**戻り値**:
- `Vec<KnowledgeEntry>`: ワークスペースのエントリリスト

---

### 🏗️ KnowledgeIndexer

インデックス化トレイト

#### 実装: QdrantIndexer

```rust
use miyabi_knowledge::indexer::{QdrantIndexer, KnowledgeIndexer};

let config = KnowledgeConfig::default();
let indexer = QdrantIndexer::new(config).await?;
```

#### メソッド

##### `index(&self, entry: &KnowledgeEntry) -> Result<KnowledgeId>`

単一エントリをインデックス化

**引数**:
- `entry`: インデックス化するエントリ

**戻り値**:
- `KnowledgeId`: 生成されたID

##### `index_batch(&self, entries: &[KnowledgeEntry]) -> Result<IndexStats>`

バッチインデックス化

**引数**:
- `entries`: エントリのスライス

**戻り値**:
- `IndexStats`: インデックス化統計

**例**:

```rust
let entries = vec![
    KnowledgeEntry::new(content1, metadata1),
    KnowledgeEntry::new(content2, metadata2),
];

let stats = indexer.index_batch(&entries).await?;
println!("Success: {}, Failed: {}", stats.success, stats.failed);
```

---

### 🔢 EmbeddingGenerator

埋め込み生成トレイト

#### 実装: OllamaEmbedding / OpenAIEmbedding

```rust
use miyabi_knowledge::embeddings::{OllamaEmbedding, create_embedding_generator};

// Ollama使用
let config = KnowledgeConfig::default();
let generator = OllamaEmbedding::new(config)?;

// または統一インターフェース
let generator = create_embedding_generator(config)?;
```

#### メソッド

##### `generate(&self, text: &str) -> Result<Vec<f32>>`

テキストから埋め込み生成

**引数**:
- `text`: テキスト

**戻り値**:
- `Vec<f32>`: 埋め込みベクトル（384次元 or 1536次元）

##### `generate_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>>`

バッチ生成

**引数**:
- `texts`: テキストのスライス

**戻り値**:
- `Vec<Vec<f32>>`: 埋め込みベクトルのリスト

##### `dimension(&self) -> usize`

埋め込み次元数取得

**戻り値**:
- `usize`: 次元数（通常384 or 1536）

---

## CLI API

### コマンド一覧

```
miyabi knowledge <SUBCOMMAND>
```

#### サブコマンド

- `search` - ナレッジベース検索
- `stats` - 統計情報表示
- `index` - ワークスペースのインデックス化

---

### `miyabi knowledge search`

ナレッジベース検索

#### 構文

```bash
miyabi knowledge search <QUERY> [OPTIONS]
```

#### 引数

- `<QUERY>`: 検索クエリ（必須）

#### オプション

| オプション | 型 | デフォルト | 説明 |
|----------|-------|---------|------|
| `--workspace <WORKSPACE>` | String | - | ワークスペースで絞り込み |
| `--agent <AGENT>` | String | - | Agentで絞り込み |
| `--issue <NUMBER>` | u32 | - | Issue番号で絞り込み |
| `--task-type <TYPE>` | String | - | タスク種別で絞り込み |
| `--outcome <OUTCOME>` | String | - | 結果で絞り込み（success/failed） |
| `--limit <LIMIT>` | usize | 10 | 最大結果数 |
| `--json` | bool | false | JSON形式で出力 |

#### 出力形式（人間可読）

```
🔍 Searching knowledge base...

✅ 3 results found:
────────────────────────────────────────────────────────────────────────────────

📄 Result 1 (score: 0.92)
  ID: 550e8400-e29b-41d4-a716-446655440000
  Workspace: miyabi-private
  Agent: CodeGenAgent
  Issue: #270
  Task Type: feature
  Outcome: success
  Timestamp: 2025-10-22 10:30:00

  Content:
  Error handling in Rust uses Result<T, E> type...

────────────────────────────────────────────────────────────────────────────────
```

#### 出力形式（JSON）

```json
{
  "query": "error handling",
  "results_count": 3,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "score": 0.92,
      "content": "Error handling in Rust uses Result<T, E> type...",
      "metadata": {
        "workspace": "miyabi-private",
        "agent": "CodeGenAgent",
        "issue_number": 270,
        "task_type": "feature",
        "outcome": "success"
      },
      "timestamp": "2025-10-22T10:30:00Z"
    }
  ]
}
```

#### 使用例

```bash
# 基本検索
miyabi knowledge search "deployment error"

# Agentで絞り込み
miyabi knowledge search "error" --agent ReviewAgent

# Issue番号で絞り込み
miyabi knowledge search "task" --issue 270

# 複数フィルタ
miyabi knowledge search "bug fix" \
  --agent CodeGenAgent \
  --task-type bug \
  --outcome success \
  --limit 5

# JSON出力
miyabi knowledge search "testing" --json
```

---

### `miyabi knowledge stats`

統計情報表示

#### 構文

```bash
miyabi knowledge stats [OPTIONS]
```

#### オプション

| オプション | 型 | デフォルト | 説明 |
|----------|-------|---------|------|
| `--workspace <WORKSPACE>` | String | - | ワークスペースで絞り込み |
| `--json` | bool | false | JSON形式で出力 |

#### 出力形式（人間可読）

```
📊 Knowledge Base Statistics
────────────────────────────────────────────────────────────────────────────────
Collection: miyabi-knowledge
Total Entries: 1,234
Total Vectors: 1,234
────────────────────────────────────────────────────────────────────────────────
```

#### 出力形式（JSON）

```json
{
  "collection_name": "miyabi-knowledge",
  "points_count": 1234,
  "vectors_count": 1234
}
```

---

### `miyabi knowledge index`

ワークスペースのインデックス化

#### 構文

```bash
miyabi knowledge index <WORKSPACE> [OPTIONS]
```

#### 引数

- `<WORKSPACE>`: ワークスペース名（必須）

#### オプション

| オプション | 型 | デフォルト | 説明 |
|----------|-------|---------|------|
| `--reindex` | bool | false | 既存エントリを再インデックス化 |
| `--json` | bool | false | JSON形式で出力 |

#### 出力形式（人間可読）

```
⚙️ Indexing workspace: miyabi-private

✅ Indexing complete!
  Total: 100
  Success: 98
  Failed: 2
  Duration: 12.34s
```

#### 出力形式（JSON）

```json
{
  "workspace": "miyabi-private",
  "stats": {
    "total": 100,
    "success": 98,
    "failed": 2,
    "duration_secs": 12.34
  }
}
```

---

## MCP Server API

### プロトコル

**JSON-RPC 2.0** over stdio or HTTP

### メソッド

#### `knowledge.search`

ナレッジベース検索

##### リクエスト

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "knowledge.search",
  "params": {
    "query": "error handling in Rust",
    "workspace": "miyabi-private",
    "agent": "CodeGenAgent",
    "issue_number": 270,
    "task_type": "feature",
    "outcome": "success",
    "limit": 10
  }
}
```

##### パラメータ

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|------|------|----------|------|
| `query` | String | ✅ | - | 検索クエリ |
| `workspace` | String | ❌ | - | ワークスペースフィルタ |
| `agent` | String | ❌ | - | Agentフィルタ |
| `issue_number` | u32 | ❌ | - | Issue番号フィルタ |
| `task_type` | String | ❌ | - | タスク種別フィルタ |
| `outcome` | String | ❌ | - | 結果フィルタ |
| `limit` | usize | ❌ | 10 | 最大結果数 |

##### レスポンス（成功）

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "score": 0.92,
      "content": "Error handling in Rust uses Result<T, E> type...",
      "metadata": {
        "workspace": "miyabi-private",
        "worktree": "issue-270",
        "agent": "CodeGenAgent",
        "issue_number": 270,
        "task_type": "feature",
        "outcome": "success"
      },
      "timestamp": "2025-10-22T10:30:00Z"
    }
  ]
}
```

##### レスポンス（エラー）

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Knowledge error: Failed to connect to Qdrant",
    "data": null
  }
}
```

##### エラーコード

| コード | 説明 |
|-------|------|
| `-32700` | Parse error (無効なJSON) |
| `-32600` | Invalid request (JSON-RPC 2.0違反) |
| `-32601` | Method not found (knowledge.search以外) |
| `-32602` | Invalid params (パラメータエラー) |
| `-32603` | Internal error (サーバー内部エラー) |

---

## 型定義

### KnowledgeEntry

ナレッジエントリ

```rust
pub struct KnowledgeEntry {
    pub id: KnowledgeId,
    pub content: String,
    pub metadata: KnowledgeMetadata,
    pub timestamp: DateTime<Utc>,
    pub embedding: Option<Vec<f32>>,
}
```

### KnowledgeMetadata

メタデータ

```rust
pub struct KnowledgeMetadata {
    pub workspace: String,
    pub worktree: Option<String>,
    pub agent: Option<String>,
    pub issue_number: Option<u32>,
    pub task_type: Option<String>,
    pub tools_used: Option<Vec<String>>,
    pub outcome: Option<String>,
    pub files_changed: Option<Vec<String>>,
    pub extra: serde_json::Map<String, serde_json::Value>,
}
```

### KnowledgeResult

検索結果

```rust
pub struct KnowledgeResult {
    pub id: KnowledgeId,
    pub score: f32,
    pub content: String,
    pub metadata: KnowledgeMetadata,
    pub timestamp: DateTime<Utc>,
}
```

### SearchFilter

検索フィルタ

```rust
pub struct SearchFilter {
    pub workspace: Option<String>,
    pub worktree: Option<String>,
    pub agent: Option<String>,
    pub issue_number: Option<u32>,
    pub task_type: Option<String>,
    pub outcome: Option<String>,
}

impl SearchFilter {
    pub fn new() -> Self;
    pub fn with_workspace(self, workspace: impl Into<String>) -> Self;
    pub fn with_agent(self, agent: impl Into<String>) -> Self;
    pub fn with_issue_number(self, issue_number: u32) -> Self;
    pub fn with_task_type(self, task_type: impl Into<String>) -> Self;
    pub fn with_outcome(self, outcome: impl Into<String>) -> Self;
}
```

### IndexStats

インデックス化統計

```rust
pub struct IndexStats {
    pub total: usize,
    pub success: usize,
    pub failed: usize,
    pub duration_secs: f64,
}
```

### KnowledgeConfig

設定

```rust
pub struct KnowledgeConfig {
    pub vector_db: VectorDbConfig,
    pub embeddings: EmbeddingsConfig,
    pub workspace: WorkspaceConfig,
    pub collection: CollectionConfig,
    pub search: SearchConfig,
    pub auto_index: AutoIndexConfig,  // v0.1.1+
}

impl KnowledgeConfig {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self>;
    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<()>;
}
```

### AutoIndexConfig (**v0.1.1+**)

自動インデックス化設定

```rust
pub struct AutoIndexConfig {
    /// 自動インデックス化の有効/無効（デフォルト: true）
    pub enabled: bool,

    /// Agent実行完了後の遅延秒数（デフォルト: 2秒）
    pub delay_seconds: u64,

    /// インデックス化失敗時のリトライ回数（デフォルト: 3回）
    pub retry_count: u32,
}

impl Default for AutoIndexConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            delay_seconds: 2,
            retry_count: 3,
        }
    }
}
```

**使用例**:

```rust
use miyabi_knowledge::{KnowledgeConfig, AutoIndexConfig};

// デフォルト設定
let mut config = KnowledgeConfig::default();

// 自動インデックス化を無効化
config.auto_index.enabled = false;

// 遅延を5秒に設定
config.auto_index.delay_seconds = 5;

// リトライ回数を10回に設定
config.auto_index.retry_count = 10;

// 設定保存
config.save("~/.config/miyabi/knowledge.json")?;
```

**Agent Lifecycle Hook統合**:

```rust
use miyabi_agents::{HookedAgent, AuditLogHook};
use miyabi_knowledge::KnowledgeConfig;

// 設定ロード
let config = KnowledgeConfig::from_file("~/.config/miyabi/knowledge.json")?;

// Hookに統合
let hook = AuditLogHook::new(".ai/logs").with_auto_index(config);
```

**CLI設定**:

```bash
# 自動インデックス化を有効化
miyabi knowledge config --auto-index true

# 遅延を5秒に設定
miyabi knowledge config --delay-seconds 5

# リトライ回数を5回に設定
miyabi knowledge config --retry-count 5

# 現在の設定を確認
miyabi knowledge config --show
```

---

## エラーハンドリング

### KnowledgeError

エラー型

```rust
pub enum KnowledgeError {
    Qdrant(String),
    Embedding(String),
    Collection(String),
    Config(String),
    Io(std::io::Error),
    Serialization(serde_json::Error),
}
```

### エラーハンドリング例

```rust
use miyabi_knowledge::error::{KnowledgeError, Result};

match searcher.search("query").await {
    Ok(results) => {
        for result in results {
            println!("{}", result.content);
        }
    }
    Err(KnowledgeError::Qdrant(e)) => {
        eprintln!("Qdrant error: {}", e);
    }
    Err(KnowledgeError::Embedding(e)) => {
        eprintln!("Embedding error: {}", e);
    }
    Err(e) => {
        eprintln!("Unknown error: {}", e);
    }
}
```

---

## パフォーマンス考慮事項

### ベクトル化

- **Ollama**: 1エントリあたり約50-100ms
- **OpenAI**: 1エントリあたり約200-500ms（API制限あり）

### バッチ処理

- **推奨バッチサイズ**: 100-500エントリ
- **メモリ使用量**: バッチサイズ × 384次元 × 4バイト ≈ 150KB/100エントリ

### 検索パフォーマンス

- **Qdrant**: 10万エントリで約10-50ms
- **フィルタあり**: 約20-100ms（フィルタ数に依存）

---

## バージョン管理

### セマンティックバージョニング

- **MAJOR**: 互換性のないAPI変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### 現在のバージョン: 0.1.1

---

## サポート

- **GitHub**: https://github.com/ShunsukeHayashi/Miyabi
- **Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
- **ユーザーガイド**: `crates/miyabi-knowledge/USER_GUIDE.md`

---

**API リファレンス 終わり**
