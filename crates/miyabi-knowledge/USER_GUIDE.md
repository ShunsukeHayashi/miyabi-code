# Miyabi Knowledge Management System - ユーザーガイド

バージョン: 0.1.1
最終更新: 2025-10-22

---

## 📚 目次

1. [概要](#概要)
2. [クイックスタート](#クイックスタート)
3. [セットアップ](#セットアップ)
4. [基本的な使用方法](#基本的な使用方法)
5. [高度な使用方法](#高度な使用方法)
6. [トラブルシューティング](#トラブルシューティング)
7. [FAQ](#faq)

---

## 概要

Miyabi Knowledge Management Systemは、Agent実行ログ、成果物、実行履歴をベクトル化し、検索可能なナレッジベースとして保存するシステムです。

### 主な機能

- **ベクトル類似性検索**: 自然言語クエリで過去のログを検索
- **メタデータフィルタリング**: Workspace、Agent、Issue番号などで絞り込み
- **自動インデックス化**: Markdownログファイルから自動的にメタデータ抽出
- **3つのアクセス方法**:
  - Rust API: プログラムから直接アクセス
  - CLI: `miyabi knowledge` コマンド
  - MCP Server: Claude Code自動参照

### アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│ Application Layer                                    │
│ - Rust API (miyabi-knowledge)                        │
│ - CLI (miyabi knowledge)                             │
│ - MCP Server (knowledge.search)                      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Knowledge Management Layer                           │
│ - Collector: ログ収集・パース                          │
│ - Indexer: ベクトル化・バッチ処理                      │
│ - Searcher: ベクトル検索・フィルタリング                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Storage Layer                                        │
│ - Vector DB: Qdrant (384次元ベクトル)                │
│ - Embeddings: Ollama (all-MiniLM-L6-v2)              │
└─────────────────────────────────────────────────────┘
```

---

## クイックスタート

### 1. 前提条件

- **Rust**: 1.70以上
- **Qdrant**: Docker経由で起動
- **Ollama**: ローカルまたはMac mini経由

### 2. Qdrant起動

```bash
# Dockerで起動
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

### 3. Ollama起動

```bash
# ローカルで起動
ollama serve

# モデルダウンロード
ollama pull all-MiniLM-L6-v2
```

### 4. 最初の検索

```bash
# ワークスペースをインデックス化
miyabi knowledge index miyabi-private

# 検索実行
miyabi knowledge search "error handling in Rust"
```

---

## セットアップ

### 設定ファイル

設定は `~/.config/miyabi/knowledge.json` に保存されます。

**デフォルト設定**:

```json
{
  "vector_db": {
    "type": "qdrant",
    "host": "localhost",
    "port": 6333,
    "collection": "miyabi-knowledge"
  },
  "embeddings": {
    "provider": "ollama",
    "model": "all-MiniLM-L6-v2",
    "dimension": 384,
    "endpoint": "http://localhost:11434"
  },
  "workspace": {
    "name": "default",
    "hierarchy": "project > worktree > agent"
  },
  "collection": {
    "log_dir": ".ai/logs",
    "worktree_dir": ".worktrees",
    "auto_index": true,
    "batch_size": 100
  },
  "search": {
    "default_limit": 10,
    "min_score": 0.7
  }
}
```

### カスタム設定

```bash
# 設定ファイルを編集
vim ~/.config/miyabi/knowledge.json

# OpenAI Embeddings使用例
{
  "embeddings": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "dimension": 1536,
    "api_key": "sk-..."
  }
}
```

### Mac mini Ollama接続

```json
{
  "embeddings": {
    "provider": "ollama",
    "model": "all-MiniLM-L6-v2",
    "dimension": 384,
    "endpoint": "http://192.168.3.27:11434"
  }
}
```

---

## 基本的な使用方法

### ログのインデックス化

```bash
# ワークスペース全体をインデックス化
miyabi knowledge index miyabi-private

# 再インデックス化（既存エントリを更新）
miyabi knowledge index miyabi-private --reindex
```

### 基本検索

```bash
# キーワード検索
miyabi knowledge search "deployment error"

# 結果数を指定
miyabi knowledge search "PR creation" --limit 5

# JSON出力（AI Agent用）
miyabi knowledge search "testing" --json
```

### フィルタ検索

```bash
# Agentで絞り込み
miyabi knowledge search "error" --agent ReviewAgent

# Issue番号で絞り込み
miyabi knowledge search "task" --issue 270

# 結果（success/failed）で絞り込み
miyabi knowledge search "deployment" --outcome failed

# 複数フィルタ組み合わせ
miyabi knowledge search "bug fix" \
  --agent CodeGenAgent \
  --task-type bug \
  --outcome success
```

### 統計情報表示

```bash
# 統計表示
miyabi knowledge stats

# JSON形式で出力
miyabi knowledge stats --json
```

---

## 高度な使用方法

### 🔄 Agent Lifecycle Hook統合による自動インデックス化

**バージョン 0.1.1+** で追加された機能。Agent実行完了後、自動的にログをベクトルデータベースにインデックス化します。

#### 機能概要

- **自動トリガー**: Agent実行完了後、設定された遅延（デフォルト: 2秒）後に自動実行
- **バックグラウンド処理**: Agent実行をブロックしない非同期処理
- **リトライ機能**: 失敗時に設定回数（デフォルト: 3回）リトライ
- **エラー耐性**: インデックス化失敗時もAgent実行は正常完了

#### セットアップ

**1. 設定ファイル作成**

`~/.config/miyabi/knowledge.json`:
```json
{
  "auto_index": {
    "enabled": true,
    "delay_seconds": 2,
    "retry_count": 3
  },
  "vector_db": {
    "type": "qdrant",
    "host": "localhost",
    "port": 6333,
    "collection": "miyabi-knowledge"
  },
  "embeddings": {
    "provider": "ollama",
    "model": "all-MiniLM-L6-v2",
    "dimension": 384
  },
  "workspace": {
    "name": "default",
    "hierarchy": "project > worktree > agent"
  },
  "collection": {
    "log_dir": ".ai/logs",
    "worktree_dir": ".worktrees",
    "auto_index": true,
    "batch_size": 100
  },
  "search": {
    "default_limit": 10,
    "min_score": 0.7
  }
}
```

または、CLIで設定：
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

**2. Agent統合**

```rust
use miyabi_agents::{HookedAgent, AuditLogHook, MetricsHook};
use miyabi_agent_coordinator::CoordinatorAgent;
use miyabi_knowledge::KnowledgeConfig;
use miyabi_types::AgentConfig;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Agent作成
    let config = AgentConfig::default();
    let agent = CoordinatorAgent::new(config);

    // Hook統合
    let mut hooked_agent = HookedAgent::new(agent);

    // メトリクスフック追加
    hooked_agent.register_hook(MetricsHook::new());

    // 自動インデックス化フック追加
    let knowledge_config = KnowledgeConfig::from_file(
        "~/.config/miyabi/knowledge.json"
    )?;

    hooked_agent.register_hook(
        AuditLogHook::new(".ai/logs")
            .with_auto_index(knowledge_config)
    );

    // Agent実行（完了後に自動インデックス化）
    let task = create_sample_task();
    let result = hooked_agent.execute(&task).await?;

    println!("Task completed: {:?}", result.status);

    // 自動インデックス化完了を待つ（任意）
    tokio::time::sleep(std::time::Duration::from_secs(3)).await;

    Ok(())
}
```

#### 実行フロー

```
Agent Task Execution
        ↓
1. Pre-Execute Hook (Metrics)
        ↓
2. Agent Execution (BaseAgent::execute)
        ↓
3. Post-Execute Hook (AuditLogHook)
        ↓
4. ログファイル書き込み (.ai/logs/{date}.md)
        ↓
5. バックグラウンド自動インデックス化トリガー
        ↓
6. 設定された遅延待機 (default: 2s)
        ↓
7. Vector DBへインデックス化 (リトライ付き)
        ↓
8. Agent実行完了
```

#### 設定オプション

| 設定項目 | 型 | デフォルト | 説明 |
|---------|-----|-----------|------|
| `enabled` | `bool` | `true` | 自動インデックス化の有効/無効 |
| `delay_seconds` | `u64` | `2` | Agent実行完了後の遅延秒数 |
| `retry_count` | `u32` | `3` | 失敗時のリトライ回数 |

#### チューニング推奨値

**高速インデックス化（低レイテンシ）**:
```json
{
  "auto_index": {
    "enabled": true,
    "delay_seconds": 1,
    "retry_count": 2
  }
}
```

**高信頼性インデックス化**:
```json
{
  "auto_index": {
    "enabled": true,
    "delay_seconds": 5,
    "retry_count": 5
  }
}
```

**手動のみ（自動無効）**:
```json
{
  "auto_index": {
    "enabled": false,
    "delay_seconds": 0,
    "retry_count": 0
  }
}
```

#### 動作確認

```bash
# 1. Agentを自動インデックス化有効で実行
cargo run --bin miyabi -- agent run coordinator --issue 270

# 2. 数秒待機（バックグラウンドインデックス化完了待ち）
sleep 5

# 3. 検索で確認
miyabi knowledge search "Issue #270"

# 4. 最近の実行ログが検索結果に表示されればOK
```

#### トラブルシューティング

**Q: 自動インデックス化が動作しない**

1. 設定確認:
   ```bash
   miyabi knowledge config --show
   ```

2. Qdrant起動確認:
   ```bash
   curl http://localhost:6333/collections
   ```

3. ログ確認:
   ```bash
   grep "Auto-indexing" .ai/logs/$(date +%Y-%m-%d).md
   ```

4. デバッグログ有効化:
   ```bash
   RUST_LOG=miyabi_agents=debug,miyabi_knowledge=debug \
     cargo run --bin miyabi -- agent run coordinator --issue 270
   ```

**Q: パフォーマンスへの影響が大きい**

1. 遅延を増やす:
   ```bash
   miyabi knowledge config --delay-seconds 10
   ```

2. リトライ回数を減らす:
   ```bash
   miyabi knowledge config --retry-count 1
   ```

3. 一時的に無効化:
   ```bash
   miyabi knowledge config --auto-index false
   ```

#### 詳細ドキュメント

- [Hook Integration Guide](../miyabi-agents/HOOK_INTEGRATION_GUIDE.md) - 完全な統合ガイド
- [API Reference](./API_REFERENCE.md) - API仕様

---

### Rust APIから使用

```rust
use miyabi_knowledge::{
    KnowledgeManager, KnowledgeConfig,
    searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter},
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 設定ロード
    let config = KnowledgeConfig::default();

    // Knowledge Manager初期化
    let manager = KnowledgeManager::new(config.clone()).await?;

    // ワークスペースをインデックス化
    let stats = manager.index_workspace("miyabi-private").await?;
    println!("Indexed: {} entries", stats.success);

    // 検索
    let searcher = QdrantSearcher::new(config).await?;
    let filter = SearchFilter::new()
        .with_agent("CodeGenAgent")
        .with_outcome("success");

    let results = searcher
        .search_filtered("error handling", filter)
        .await?;

    for result in results {
        println!("Score: {:.2} - {}", result.score, result.content);
    }

    Ok(())
}
```

### MCP Server経由で使用

**JSON-RPC 2.0リクエスト**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "knowledge.search",
  "params": {
    "query": "How to handle errors in Rust agents?",
    "agent": "CodeGenAgent",
    "limit": 5
  }
}
```

**レスポンス**:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "score": 0.92,
      "content": "Error handling in Rust agents uses Result<T, E>...",
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

### カスタムコレクター実装

```rust
use miyabi_knowledge::collector::{KnowledgeCollector, CollectorConfig};
use miyabi_knowledge::types::{KnowledgeEntry, KnowledgeMetadata};
use async_trait::async_trait;

pub struct CustomCollector {
    config: CollectorConfig,
}

#[async_trait]
impl KnowledgeCollector for CustomCollector {
    async fn collect(&self) -> Result<Vec<KnowledgeEntry>> {
        // カスタム収集ロジック
        let mut entries = Vec::new();

        // ... データソースから収集 ...

        Ok(entries)
    }
}
```

### バッチ処理最適化

```rust
use miyabi_knowledge::indexer::{KnowledgeIndexer, QdrantIndexer};

// バッチサイズ調整
let mut config = KnowledgeConfig::default();
config.collection.batch_size = 500; // デフォルト: 100

let indexer = QdrantIndexer::new(config).await?;

// 大量エントリのバッチインデックス化
let entries = vec![/* ... */];
let stats = indexer.index_batch(&entries).await?;

println!("Processed {} entries in {:.2}s",
         stats.total, stats.duration_secs);
```

---

## トラブルシューティング

### Qdrantに接続できない

**症状**: `Failed to connect to Qdrant`

**解決策**:

```bash
# Qdrantが起動しているか確認
docker ps | grep qdrant

# ポート6333が開いているか確認
nc -zv localhost 6333

# Qdrantログ確認
docker logs <container-id>
```

### Ollama Embeddingエラー

**症状**: `Ollama API error (500): model not found`

**解決策**:

```bash
# モデルがインストールされているか確認
ollama list

# モデルインストール
ollama pull all-MiniLM-L6-v2

# Ollamaが起動しているか確認
curl http://localhost:11434/api/tags
```

### 検索結果が0件

**症状**: `No results found.`

**解決策**:

1. **インデックスが作成されているか確認**:
   ```bash
   miyabi knowledge stats
   # Total Entries: 0 の場合はインデックス化が必要
   ```

2. **ログファイルが存在するか確認**:
   ```bash
   ls -la .ai/logs/
   # Markdownファイルが存在するか確認
   ```

3. **クエリを変更してみる**:
   ```bash
   # より一般的なキーワードで検索
   miyabi knowledge search "agent" --limit 20
   ```

### メモリ不足エラー

**症状**: `Out of memory` または `Killed`

**解決策**:

```rust
// バッチサイズを小さくする
config.collection.batch_size = 50; // デフォルト: 100

// 並列度を下げる（将来実装）
config.collection.concurrency = 2;
```

### ベクトル次元エラー

**症状**: `Unexpected embedding dimension: expected 384, got 1536`

**解決策**:

```json
// 設定ファイルのdimensionを正しく設定
{
  "embeddings": {
    "model": "text-embedding-3-small",
    "dimension": 1536  // モデルに合わせる
  }
}
```

---

## FAQ

### Q1: どのログファイルがインデックス化されますか？

**A**: `.ai/logs/` ディレクトリ内のMarkdownファイル（`*.md`）が自動的にインデックス化されます。

### Q2: インデックス化にどれくらい時間がかかりますか？

**A**: 100エントリあたり約10-30秒です（Ollama使用時）。バッチサイズとネットワーク速度に依存します。

### Q3: 既存のエントリを更新するには？

**A**: `--reindex` フラグを使用してください:

```bash
miyabi knowledge index miyabi-private --reindex
```

### Q4: Claude Codeはいつナレッジベースを検索しますか？

**A**: Claude Codeが関連情報を必要とするとき、自動的にMCP経由で検索します。手動検索も可能です。

### Q5: 複数のワークスペースを管理できますか？

**A**: はい、ワークスペースごとにインデックス化し、検索時に `--workspace` フィルタで絞り込めます。

### Q6: OpenAI Embeddingsの方が良いですか？

**A**: OpenAIの方が高品質ですが、コストがかかります。Ollamaは無料でローカルで動作します。

### Q7: ベクトル検索とキーワード検索の違いは？

**A**: ベクトル検索は意味的な類似性を検索します。"error" と "failure" が近い結果として返ります。

### Q8: 検索結果のスコアの意味は？

**A**: 0.0-1.0の範囲で、1.0が完全一致です。通常0.7以上が関連性の高い結果です。

### Q9: 大量のログがある場合のパフォーマンスは？

**A**: Qdrantは10万エントリ以上でも高速に検索できます。インデックス化は一度だけ必要です。

### Q10: 削除したログはどうなりますか？

**A**: 現在、自動削除はサポートされていません。手動でQdrantから削除する必要があります（将来実装予定）。

---

## サポート

- **Issue報告**: [GitHub Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)
- **ドキュメント**: `crates/miyabi-knowledge/README.md`
- **API仕様書**: `crates/miyabi-knowledge/API_REFERENCE.md`

---

**ユーザーガイド 終わり**
