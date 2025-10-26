# Miyabi Knowledge Management System

**バージョン**: v1.0.0
**ステータス**: 設計中
**作成日**: 2025-10-22

---

## 📋 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [推奨構成](#推奨構成)
4. [データフロー](#データフロー)
5. [実装計画](#実装計画)
6. [API仕様](#api仕様)
7. [使用例](#使用例)

---

## 概要

### 目的

Miyabiの実行履歴（ログファイル、成果物、Agent実行情報、ツール使用状況）を**ベクトルデータベース化**し、**ナレッジ検索可能**な状態にすることで、以下を実現：

- ✅ **過去の実行パターンの検索** - 「エラー処理の実装例」「デプロイ手順」などをクエリで検索
- ✅ **Agent実行の学習** - 過去の成功パターンを学習し、同様のタスクで再利用
- ✅ **ワークスペース単位の知識管理** - プロジェクト/Worktree/Agent単位でナレッジを分離
- ✅ **Claude Code統合** - MCP経由で自動的にナレッジを参照

### ユースケース

**ケース1: 類似タスクの検索**
```bash
miyabi knowledge search "Rust cargo build エラーの解決方法"
# → 過去のIssue #270での解決手順を検索
```

**ケース2: Agent実行パターンの学習**
```bash
miyabi knowledge similar --agent=CodeGenAgent --task="認証機能の実装"
# → 過去の認証機能実装時のコード生成パターンを検索
```

**ケース3: ワークスペース知識の可視化**
```bash
miyabi knowledge stats --workspace=miyabi-private
# → プロジェクト全体のナレッジ統計を表示
```

---

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│ Miyabi Core (Rust)                                           │
│                                                               │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │ miyabi-agents   │      │ miyabi-worktree │              │
│  │ (Agent実行)     │      │ (並列実行)      │              │
│  └────────┬────────┘      └────────┬────────┘              │
│           │                        │                         │
│           │ ログ出力               │ 実行情報               │
│           ▼                        ▼                         │
│  ┌──────────────────────────────────────────┐               │
│  │ miyabi-knowledge (NEW)                   │               │
│  │ ナレッジ管理システム                     │               │
│  └──────────────┬───────────────────────────┘               │
│                 │                                            │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  │ 構造化 + ベクトル化
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Storage Layer                                                │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │ Qdrant       │      │ miyabi-llm   │     │ .ai/logs/  │ │
│  │ (Vector DB)  │      │ (Embeddings) │     │ (Raw Logs) │ │
│  └──────────────┘      └──────────────┘     └────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                  │
                  │ 検索クエリ
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Interface Layer                                              │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ CLI      │  │ MCP      │  │ REST API │  │ Web UI   │   │
│  │ (miyabi) │  │ (Claude) │  │ (HTTP)   │  │ (a2a)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### コンポーネント

#### 1. **miyabi-knowledge** (新規クレート)

**責務**: ナレッジ管理のコア実装

- **ログ収集**: `.ai/logs/`、Worktree実行ログ、LDDLogの構造化
- **ベクトル化**: テキスト埋め込み生成（miyabi-llm統合）
- **検索**: ベクトル類似性検索 + メタデータフィルタリング
- **ワークスペース管理**: プロジェクト/Worktree/Agent単位の名前空間

**Cargo.toml**:
```toml
[package]
name = "miyabi-knowledge"
version = "1.0.0"
edition = "2021"

[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
miyabi-core = { version = "0.1.0", path = "../miyabi-core" }
miyabi-llm = { version = "1.0.0", path = "../miyabi-llm" }

# Vector DB
qdrant-client = "1.9"

# Embeddings
rust-bert = "0.22"  # Local embeddings (all-MiniLM-L6-v2)
tokenizers = "0.19"

# 非同期
tokio = { workspace = true }
async-trait = { workspace = true }

# シリアライゼーション
serde = { workspace = true }
serde_json = { workspace = true }

# エラーハンドリング
thiserror = { workspace = true }
anyhow = { workspace = true }

# ロギング
tracing = { workspace = true }

# 日時
chrono = { workspace = true }

# UUID
uuid = { version = "1.0", features = ["v4", "serde"] }
```

#### 2. **Qdrant** (ベクトルデータベース)

**選定理由**:
- ✅ Rust製（Miyabiとネイティブ統合）
- ✅ 高速（100万ベクトルで<1秒）
- ✅ Docker対応（ローカル開発が容易）
- ✅ クラウド版あり（スケーラブル）
- ✅ メタデータフィルタリング（Workspace, Agent, Date等）

**代替案**:
- Chroma（Python製、Rust FFI必要）
- Weaviate（Go製、セットアップ複雑）
- Milvus（C++製、高負荷向け）

**インストール**:
```bash
# Docker Compose経由
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/.qdrant/storage:/qdrant/storage \
  qdrant/qdrant
```

#### 3. **miyabi-llm** (埋め込み生成)

**既存クレートを活用** - Ollama統合でローカル埋め込み生成

**推奨モデル**:
- **all-MiniLM-L6-v2** (384次元) - 高速、軽量、英語特化
- **multilingual-e5-large** (1024次元) - 日本語対応、高精度
- **OpenAI text-embedding-3-small** (1536次元) - API利用、最高精度（コスト発生）

**実装例**:
```rust
use miyabi_llm::{LLMProvider, EmbeddingRequest};

// Ollama経由でローカル埋め込み生成
let provider = GPTOSSProvider::new_ollama()?;
let request = EmbeddingRequest::new("Rust cargo build failed")
    .with_model("all-MiniLM-L6-v2");

let embeddings = provider.embed(&request).await?;
// → Vec<f32> (384次元ベクトル)
```

#### 4. **ワークスペース階層**

**3階層構造** - プロジェクト > Worktree > Agent

```
miyabi-private (プロジェクト)
├── .worktrees/issue-270/ (Worktree)
│   ├── CodeGenAgent (Agent)
│   │   ├── ログ
│   │   ├── 成果物
│   │   └── ツール使用履歴
│   └── ReviewAgent (Agent)
│       └── ...
└── .worktrees/issue-271/ (Worktree)
    └── ...
```

**Qdrant Collection構造**:
```json
{
  "collection": "miyabi-knowledge",
  "payload": {
    "workspace": "miyabi-private",
    "worktree": "issue-270",
    "agent": "CodeGenAgent",
    "timestamp": "2025-10-22T10:30:00Z",
    "issue_number": 270,
    "task_type": "feature",
    "content": "Rust cargo build エラーを解決した...",
    "tools_used": ["cargo", "rustfmt", "clippy"],
    "outcome": "success"
  }
}
```

---

## 推奨構成

### ハードウェア要件

**最小構成** (開発環境):
- CPU: 4コア以上
- メモリ: 8GB以上
- ストレージ: 10GB以上（ベクトルDB用）
- GPU: 不要（CPU埋め込みで十分）

**推奨構成** (本番環境):
- CPU: 8コア以上
- メモリ: 16GB以上
- ストレージ: 50GB以上（SSD推奨）
- GPU: オプション（埋め込み生成高速化）

### ソフトウェア要件

- **Rust**: 1.70+
- **Docker**: 20.10+（Qdrant用）
- **Ollama**: 0.1.0+（ローカル埋め込み用）

---

## データフロー

### 1. ログ収集フロー

```
Agent実行
  ↓
.ai/logs/YYYY-MM-DD.md 生成
  ↓
KnowledgeCollector::collect()
  ↓
構造化（JSON変換）
  ↓
メタデータ抽出（Workspace, Agent, Task等）
  ↓
一時ストレージ（.ai/knowledge/pending/）
```

### 2. ベクトル化フロー

```
一時ストレージ（pending/）
  ↓
KnowledgeIndexer::index()
  ↓
テキストチャンク分割（512トークン単位）
  ↓
miyabi-llm 埋め込み生成（384次元）
  ↓
Qdrant挿入（Collection: miyabi-knowledge）
  ↓
完了ストレージ（.ai/knowledge/indexed/）
```

### 3. 検索フロー

```
ユーザークエリ（"cargo build エラー"）
  ↓
KnowledgeSearcher::search()
  ↓
クエリ埋め込み生成（384次元）
  ↓
Qdrant類似性検索（Top-K=10）
  ↓
メタデータフィルタリング（Workspace/Agent指定時）
  ↓
結果ランキング（スコア順）
  ↓
ユーザーに返却
```

---

## 実装計画

### Phase 3: ログ収集機能実装

**タスク**:
1. `KnowledgeCollector` trait実装
2. `.ai/logs/` パース機能実装
3. Worktree実行ログパース機能実装
4. LDDLogパース機能実装
5. 構造化JSON生成機能実装

**成果物**:
- `crates/miyabi-knowledge/src/collector.rs`
- `crates/miyabi-knowledge/src/parser.rs`

**推定時間**: 2-3日

### Phase 4: ベクトル化機能実装

**タスク**:
1. `KnowledgeIndexer` trait実装
2. Qdrant Client統合
3. miyabi-llm埋め込み統合
4. テキストチャンク分割ロジック実装
5. バッチ挿入最適化

**成果物**:
- `crates/miyabi-knowledge/src/indexer.rs`
- `crates/miyabi-knowledge/src/embeddings.rs`

**推定時間**: 3-4日

### Phase 5: 検索機能実装

**タスク**:
1. `KnowledgeSearcher` trait実装
2. Qdrant検索API統合
3. メタデータフィルタリング実装
4. CLI統合（`miyabi knowledge search`）
5. MCP統合（Claude Code統合）

**成果物**:
- `crates/miyabi-knowledge/src/searcher.rs`
- `crates/miyabi-cli/src/commands/knowledge.rs`
- `crates/miyabi-mcp-server/src/knowledge.rs`

**推定時間**: 3-4日

### Phase 6: ドキュメント作成

**タスク**:
1. ユーザーガイド作成
2. API仕様書作成
3. 設定ファイルテンプレート作成
4. トラブルシューティングガイド作成

**成果物**:
- `docs/KNOWLEDGE_USER_GUIDE.md`
- `docs/KNOWLEDGE_API_REFERENCE.md`

**推定時間**: 1-2日

**合計推定時間**: 9-13日（2週間スプリント）

---

## API仕様

### Rust API

#### KnowledgeCollector

```rust
#[async_trait]
pub trait KnowledgeCollector: Send + Sync {
    /// 指定ディレクトリからログを収集
    async fn collect(&self, path: &Path) -> Result<Vec<KnowledgeEntry>>;

    /// 特定のWorktreeからログを収集
    async fn collect_worktree(&self, worktree: &str) -> Result<Vec<KnowledgeEntry>>;

    /// 特定のAgentからログを収集
    async fn collect_agent(&self, agent: &str) -> Result<Vec<KnowledgeEntry>>;
}
```

#### KnowledgeIndexer

```rust
#[async_trait]
pub trait KnowledgeIndexer: Send + Sync {
    /// ナレッジエントリをベクトル化してQdrantに挿入
    async fn index(&self, entry: &KnowledgeEntry) -> Result<KnowledgeId>;

    /// バッチ挿入（高速化）
    async fn index_batch(&self, entries: &[KnowledgeEntry]) -> Result<Vec<KnowledgeId>>;

    /// ワークスペース全体をインデックス化
    async fn index_workspace(&self, workspace: &str) -> Result<IndexStats>;
}
```

#### KnowledgeSearcher

```rust
#[async_trait]
pub trait KnowledgeSearcher: Send + Sync {
    /// クエリで検索
    async fn search(&self, query: &str) -> Result<Vec<KnowledgeResult>>;

    /// フィルタ付き検索
    async fn search_filtered(&self, query: &str, filter: SearchFilter) -> Result<Vec<KnowledgeResult>>;

    /// 類似エントリ検索
    async fn find_similar(&self, entry_id: &KnowledgeId, limit: usize) -> Result<Vec<KnowledgeResult>>;
}
```

### CLI API

```bash
# ナレッジ検索
miyabi knowledge search "cargo build エラー" [OPTIONS]

# オプション:
#   --workspace=<name>      ワークスペース指定
#   --worktree=<name>       Worktree指定
#   --agent=<type>          Agent指定
#   --limit=<n>             結果数制限（デフォルト: 10）
#   --format=<json|text>    出力形式

# 例:
miyabi knowledge search "認証機能の実装" --agent=CodeGenAgent --limit=5

# ワークスペース統計
miyabi knowledge stats [OPTIONS]

# オプション:
#   --workspace=<name>      ワークスペース指定
#   --format=<json|text>    出力形式

# 例:
miyabi knowledge stats --workspace=miyabi-private

# 類似検索
miyabi knowledge similar <entry-id> [OPTIONS]

# オプション:
#   --limit=<n>             結果数制限（デフォルト: 10）

# インデックス化
miyabi knowledge index [OPTIONS]

# オプション:
#   --workspace=<name>      ワークスペース指定
#   --force                 再インデックス化

# 例:
miyabi knowledge index --workspace=miyabi-private
```

### MCP API (Claude Code統合)

```json
{
  "method": "knowledge/search",
  "params": {
    "query": "cargo build エラーの解決方法",
    "workspace": "miyabi-private",
    "limit": 5
  }
}
```

**レスポンス**:
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "score": 0.92,
      "content": "Issue #270でcargo buildエラーを解決した。原因はdependency cycle...",
      "metadata": {
        "workspace": "miyabi-private",
        "worktree": "issue-270",
        "agent": "CodeGenAgent",
        "timestamp": "2025-10-22T10:30:00Z",
        "issue_number": 270,
        "task_type": "feature"
      }
    }
  ]
}
```

---

## 使用例

### ケース1: 過去のエラー解決方法を検索

```bash
# CLI経由
miyabi knowledge search "Rust lifetime エラー"

# 出力:
# [1] Issue #270 - CodeGenAgent (Score: 0.95)
#     lifetime 'static エラーを&'a参照に変更して解決
#     File: crates/miyabi-types/src/task.rs:45
#
# [2] Issue #180 - ReviewAgent (Score: 0.87)
#     lifetime conflictをPhantomData<&'a ()>で解決
#     File: crates/miyabi-agents/src/base.rs:102
```

### ケース2: Agent実行パターンの学習

```rust
use miyabi_knowledge::{KnowledgeSearcher, SearchFilter};

let searcher = KnowledgeSearcher::new(config)?;
let filter = SearchFilter::new()
    .with_agent("CodeGenAgent")
    .with_task_type("authentication");

let results = searcher.search_filtered("認証機能の実装", filter).await?;

for result in results {
    println!("Past Implementation: {}", result.content);
    println!("Files changed: {:?}", result.metadata.files_changed);
}
```

### ケース3: MCP経由でClaude Codeが自動参照

**.claude/commands/agent-run.md**:
```markdown
# Agent実行コマンド

このコマンドは、指定されたAgentを実行します。

## 実行前のナレッジ検索（自動）

以下のMCP呼び出しで過去の類似タスクを検索：

```json
{
  "method": "knowledge/search",
  "params": {
    "query": "{{ task.description }}",
    "agent": "{{ agent.type }}",
    "limit": 3
  }
}
```

検索結果を参考に、最適な実装パターンを選択します。
```

---

## 設定ファイル

**.miyabi.yml**:
```yaml
knowledge:
  # ベクトルDB設定
  vector_db:
    type: "qdrant"
    host: "localhost"
    port: 6333
    collection: "miyabi-knowledge"

  # 埋め込みモデル設定
  embeddings:
    provider: "ollama"  # "openai" | "ollama" | "local"
    model: "all-MiniLM-L6-v2"  # Ollamaモデル名
    dimension: 384

  # ワークスペース設定
  workspace:
    name: "miyabi-private"
    hierarchy: "project > worktree > agent"

  # 収集設定
  collection:
    log_dir: ".ai/logs"
    worktree_dir: ".worktrees"
    auto_index: true  # 自動インデックス化
    batch_size: 100

  # 検索設定
  search:
    default_limit: 10
    min_score: 0.7  # 最小類似度スコア
```

---

## 次のステップ

1. **Phase 3実装**: ログ収集機能の実装開始
2. **Qdrantセットアップ**: Docker Composeでローカル環境構築
3. **Ollama埋め込みテスト**: all-MiniLM-L6-v2モデルのテスト
4. **CLI統合**: `miyabi knowledge` コマンド実装

---

**関連ドキュメント**:
- [miyabi-llm README](../crates/miyabi-llm/README.md) - LLM統合層
- [miyabi-potpie Cargo.toml](../crates/miyabi-potpie/Cargo.toml) - Neo4j統合（将来的に連携）
- [WORKTREE_PROTOCOL.md](WORKTREE_PROTOCOL.md) - Worktree管理プロトコル

---

**ステータス**: 設計完了 ✅ → Phase 3実装開始 🚀
