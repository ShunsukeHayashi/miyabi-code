# Architecture - Miyabi System Design

**Priority**: ⭐⭐⭐⭐

## 🦀 Rust Edition - 高速・安全・並列実行

**Language**: Rust 2021 Edition (Stable)

### パフォーマンス改善
- **50%以上の実行時間削減** - Rustの高速実行
- **30%以上のメモリ削減** - ゼロコスト抽象化
- **単一バイナリ配布** - Node.js依存の排除
- **コンパイル時型安全性** - ランタイムエラーの削減

## 📦 Cargo Workspace Structure

```
crates/
├── miyabi-types/          # コア型定義（Agent, Task, Issue等）
├── miyabi-core/           # 共通ユーティリティ（config, logger）
├── miyabi-cli/            # CLIツール (bin)
├── miyabi-agents/         # Agent実装（21個）
├── miyabi-github/         # GitHub API統合
├── miyabi-worktree/       # Git Worktree管理
├── miyabi-llm/            # LLM抽象化層
├── miyabi-potpie/         # Potpie AI統合
├── miyabi-knowledge/      # ナレッジ管理システム（NEW v0.1.1）
└── miyabi-mcp-server/     # MCP Server
```

**Note**: `miyabi-business-agents` は **DEPRECATED** (v0.1.1)
- すべてのBusiness Agentsは `miyabi-agents/business` に統合済み
- 詳細: `crates/miyabi-business-agents/DEPRECATED.md`

## 🏗️ GitHub as OS Integration

GitHubをオペレーティングシステムとして活用:

| Component | GitHub Feature | Role |
|-----------|---------------|------|
| **データ永続化層** | Projects V2 | データストレージ |
| **イベントバス** | Webhooks | イベント駆動 |
| **実行エンジン** | Actions | CI/CD実行 |
| **メッセージキュー** | Discussions | 通知・キュー |
| **静的ホスティング** | Pages | ウェブサイト |
| **パッケージ配布** | Packages | Artifact管理 |

**詳細**: `docs/GITHUB_OS_INTEGRATION.md`

## 🪟 Windows Platform Support

**サポート状況**: ✅ 部分的サポート（CI/CD完備、Path処理改善中）

### 実装済み
- ✅ **CI/CD**: GitHub Actions `windows-latest`でビルド・テスト
- ✅ **リリースバイナリ**: `miyabi.exe`の自動生成
- ✅ **クロスプラットフォームテスト**: Ubuntu, macOS, Windows

### 実装中（Issue #360）
- 🔄 **Path Handling**: `std::path::PathBuf`への完全移行
- 🔄 **Git Worktree**: Windows固有のパス制限（260文字）対策
- 🔄 **Environment Variables**: `dirs` crate統合

### 既知の制約
1. **パス区切り文字**: 一部のコードで`/`ハードコード（改善中）
2. **UNC Path**: `\\?\C:\...`形式の長いパス未対応
3. **CRLF/LF**: Git設定に依存（core.autocrlf推奨）

**関連Issue**: Issue #360 (プライベート), Public Issue #164

## 🔗 Git Worktree並列実行

**アーキテクチャ**: Worktree単位でAgent並列実行

```
CoordinatorAgent (Main Process)
    │
    ├─ Worktree #1 (Issue #270) → CodeGenAgent
    ├─ Worktree #2 (Issue #271) → ReviewAgent
    └─ Worktree #3 (Issue #272) → DeploymentAgent
    │
    └─ Merge Back to Main
```

### Worktreeディレクトリ構造
```
.worktrees/
├── issue-270/           # Issue #270専用Worktree
│   ├── .agent-context.json
│   └── EXECUTION_CONTEXT.md
├── issue-271/
└── issue-272/
```

**詳細**: [worktree.md](./worktree.md)

## 🧠 LLM Integration

### miyabi-llm (v1.0.0)
**Provider抽象化**: 統一的なLLMインターフェース

**サポートBackend**:
- **GPT-OSS-20B**: OpenAIのオープンソースモデル
- **Groq**: 高速API推論
- **vLLM**: セルフホスト推論サーバー
- **Ollama**: ローカル実行（Mac mini対応）

**Mac mini支援**:
- LAN/Tailscale経由のOllama接続
- ローカル → Mac mini → Groq のフォールバック

**Reasoning Effort**: Low/Medium/High

**詳細**: `crates/miyabi-llm/README.md`

## 🧩 Knowledge Management System (NEW v0.1.1)

### miyabi-knowledge
**ナレッジ管理システム**: QdrantベクトルDB + Ollama/OpenAI埋め込み

**機能**:
- **Vector Database**: Qdrant統合（384/1536次元）
- **Embeddings**: Ollama (all-MiniLM-L6-v2) / OpenAI (text-embedding-3-small)
- **Log Collection**: `.ai/logs/` Markdown自動収集
- **Metadata Extraction**: Agent種別、Issue番号、Task種別、実行結果
- **Search**: ベクトル類似性検索 + メタデータフィルタリング

**3つのアクセス方法**:
1. **Rust API**: `KnowledgeManager`, `QdrantSearcher`
2. **CLI**: `miyabi knowledge search/stats/index`
3. **MCP Server**: `knowledge.search` JSON-RPC 2.0メソッド

**詳細**: `crates/miyabi-knowledge/README.md`

## 🔌 MCP Server

### miyabi-mcp-server
**JSON-RPC 2.0 Server**: Agent実行エンドポイント

**Transport Modes**:
- **stdio**: CLI統合（Codex CLI経由）
- **HTTP**: リモートアクセス

**メソッド**: `agents/{agent_type}/execute`

**詳細**: `crates/miyabi-mcp-server/src/lib.rs`

## 📁 Core Types

### miyabi-types
**統一エラー型**: `MiyabiError`

**12種類のエラーvariant**:
- `Agent`, `Escalation`, `CircularDependency`
- `Io`, `Json`, `Http`, `GitHub`, `Git`
- `Auth`, `Config`, `Validation`, `Timeout`

**詳細**: `crates/miyabi-types/src/error.rs`

## 🔗 Related Modules

- **Agents**: [agents.md](./agents.md) - 21 Agents概要
- **Worktree**: [worktree.md](./worktree.md) - 並列実行プロトコル
- **Rust**: [rust.md](./rust.md) - Rust開発ガイド

## 📖 Detailed Documentation

- **Rust Migration**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **GitHub OS**: `docs/GITHUB_OS_INTEGRATION.md`
- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md`
