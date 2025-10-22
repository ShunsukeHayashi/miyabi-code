# Miyabi Crates Integration Visualization

**生成日時**: 2025-10-22
**Workspace Version**: 0.1.1
**Rust Edition**: 2021

---

## 🏗️ アーキテクチャ概要

Miyabiプロジェクトは、23個のクレートで構成される高度にモジュール化されたRust Workspaceです。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Miyabi Workspace                          │
│                     (23 Crates / Rust 2021)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 階層アーキテクチャ（5層構造）

### Layer 1: Foundation（基盤層）- 2個
最下層の型定義とコアユーティリティ

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1: Foundation（基盤層）                                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────┐          ┌────────────────┐              │
│  │ miyabi-types   │          │ miyabi-core    │              │
│  ├────────────────┤          ├────────────────┤              │
│  │ • Agent        │          │ • Config       │              │
│  │ • Task         │          │ • Logger       │              │
│  │ • Issue        │          │ • Retry        │              │
│  │ • Workflow     │          │ • Validator    │              │
│  │ • Error        │          │ • Git Utils    │              │
│  └────────────────┘          └────────────────┘              │
│       (0 deps)                   (types)                      │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- `miyabi-types`: 依存なし（Pure data types）
- `miyabi-core`: `miyabi-types`のみ

---

### Layer 2: Integration（統合層）- 4個
外部サービス統合とWorktree管理

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 2: Integration（統合層）                                 │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ miyabi-github│  │ miyabi-worktree│ │ miyabi-llm  │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ • octocrab   │  │ • git2       │  │ • GPT-OSS   │       │
│  │ • Issues API │  │ • Worktree   │  │ • Groq      │       │
│  │ • PRs API    │  │ • Branch Mgmt│  │ • vLLM      │       │
│  │ • Labels API │  │ • Merge      │  │ • Ollama    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│    (types)           (types, core)     (types, core)         │
│                                                                │
│  ┌──────────────┐                                             │
│  │ miyabi-potpie│                                             │
│  ├──────────────┤                                             │
│  │ • Neo4j      │                                             │
│  │ • RAG Engine │                                             │
│  │ • Code Graph │                                             │
│  └──────────────┘                                             │
│    (types)                                                    │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- `miyabi-github`: `miyabi-types` + `octocrab`
- `miyabi-worktree`: `miyabi-types` + `miyabi-core` + `git2`
- `miyabi-llm`: `miyabi-types` + `miyabi-core` + `reqwest`
- `miyabi-potpie`: `miyabi-types` (Neo4j統合)

---

### Layer 3: Agent Core（Agent基盤層）- 2個
Agent実装のための共通インターフェース

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 3: Agent Core（Agent基盤層）                             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────┐  ┌─────────────────────────┐     │
│  │ miyabi-agent-core      │  │ miyabi-agent-integrations│     │
│  ├────────────────────────┤  ├─────────────────────────┤     │
│  │ • BaseAgent trait      │  │ • Firebase              │     │
│  │ • AgentContext         │  │ • Vercel                │     │
│  │ • AgentResult          │  │ • AWS                   │     │
│  │ • Error handling       │  │ • Deployment APIs       │     │
│  └────────────────────────┘  └─────────────────────────┘     │
│      (types)                      (types)                     │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- `miyabi-agent-core`: `miyabi-types` + `async-trait`
- `miyabi-agent-integrations`: `miyabi-types` (デプロイAPI統合)

---

### Layer 4: Agent Implementations（Agent実装層）- 7個
具体的なAgent実装（Coding + Business）

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 4: Agent Implementations（Agent実装層）                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  【Coding Agents（5個）】                                      │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ miyabi-agent-   │  │ miyabi-agent-   │                   │
│  │  coordinator    │  │   codegen       │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ • Task分解      │  │ • Code生成      │                   │
│  │ • DAG構築       │  │ • LLM統合       │                   │
│  │ • Worktree管理  │  │ • Potpie RAG    │                   │
│  └─────────────────┘  └─────────────────┘                   │
│    (agent-core, llm,    (agent-core, llm,                   │
│     github, worktree)    potpie, integrations)              │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ miyabi-agent-   │  │ miyabi-agent-   │                   │
│  │   review        │  │   workflow      │                   │
│  ├─────────────────┤  ├─────────────────┤                   │
│  │ • 品質スコア     │  │ • State管理     │                   │
│  │ • Clippy連携    │  │ • Label操作     │                   │
│  │ • テストカバレッジ│  │ • Hook実行      │                   │
│  └─────────────────┘  └─────────────────┘                   │
│    (agent-core, core)  (agent-core, github)                 │
│                                                                │
│  ┌─────────────────┐                                         │
│  │ miyabi-agents   │   ← 統合パッケージ（旧実装）            │
│  ├─────────────────┤                                         │
│  │ • Legacy agents │                                         │
│  │ • Migration中   │                                         │
│  └─────────────────┘                                         │
│    (多数の依存)                                              │
│                                                                │
│  【Business Agents（2個）】                                    │
│  ┌─────────────────────────────────────┐                     │
│  │ miyabi-agent-business               │                     │
│  ├─────────────────────────────────────┤                     │
│  │ • BusinessAgent trait               │                     │
│  │ • 8-Phase Planning                  │                     │
│  │ • Validation framework              │                     │
│  └─────────────────────────────────────┘                     │
│    (agent-core, llm)                                         │
│                                                                │
│  ┌─────────────────────────────────────┐                     │
│  │ miyabi-business-agents              │                     │
│  ├─────────────────────────────────────┤                     │
│  │ • AIEntrepreneur（実装済）           │                     │
│  │ • 13個のAgent（計画中）              │                     │
│  └─────────────────────────────────────┘                     │
│    (agent-business, llm)                                     │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- **Coordinator**: `agent-core` + `llm` + `github` + `worktree`
- **CodeGen**: `agent-core` + `llm` + `potpie` + `integrations`
- **Review**: `agent-core` + `core`
- **Workflow**: `agent-core` + `github`
- **Business**: `agent-core` + `llm`
- **Business-Agents**: `agent-business` + `llm`

---

### Layer 5: Application（アプリケーション層）- 5個
ユーザー向けインターフェース

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 5: Application（アプリケーション層）                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ miyabi-cli   │  │ miyabi-mcp-  │  │ miyabi-discord│       │
│  │              │  │   server     │  │  -mcp-server │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ • init       │  │ • JSON-RPC   │  │ • Discord    │       │
│  │ • status     │  │ • stdio      │  │ • Bot        │       │
│  │ • agent run  │  │ • Agent exec │  │ • Commands   │       │
│  │ • clap       │  │ • Codex統合  │  │ • MCP統合    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│    (agents, github,  (agents, types)   (mcp-server)          │
│     worktree)                                                 │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ miyabi-a2a   │  │ miyabi-webhook│                         │
│  ├──────────────┤  ├──────────────┤                         │
│  │ • Dashboard  │  │ • GitHub     │                         │
│  │ • React UI   │  │   Webhooks   │                         │
│  │ • WebSocket  │  │ • Event Bus  │                         │
│  │ • Axum API   │  │ • Automation │                         │
│  └──────────────┘  └──────────────┘                         │
│    (github, types)   (types, github)                         │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- **CLI**: `agents` + `github` + `worktree` + `clap`
- **MCP Server**: `agents` + `types` (JSON-RPC 2.0)
- **Discord MCP**: `mcp-server` (Discord Bot統合)
- **A2A Dashboard**: `github` + `types` + `axum` + React
- **Webhook**: `types` + `github` (イベント処理)

---

### Layer 6: Benchmarking（評価層）- 1個
ベンチマーク・評価システム

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 6: Benchmarking（評価層）                                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────┐                    │
│  │ miyabi-benchmark                     │                    │
│  ├──────────────────────────────────────┤                    │
│  │ • SWE-bench Pro統合                  │                    │
│  │ • Docker Harness                     │                    │
│  │ • Claude API統合                     │                    │
│  │ • 評価パイプライン                   │                    │
│  └──────────────────────────────────────┘                    │
│    (types, core, agents)                                     │
└──────────────────────────────────────────────────────────────┘
```

**依存関係**:
- **Benchmark**: `types` + `core` + `agents` + Docker

---

## 🔗 依存関係マトリックス

### 主要な依存パターン

| クレート | 依存先 | 役割 |
|---------|--------|------|
| **miyabi-types** | なし | 型定義の基盤 |
| **miyabi-core** | types | 共通ユーティリティ |
| **miyabi-github** | types | GitHub API統合 |
| **miyabi-worktree** | types, core | Worktree管理 |
| **miyabi-llm** | types, core | LLM抽象化層 |
| **miyabi-agent-core** | types | Agent基盤trait |
| **miyabi-agent-coordinator** | agent-core, llm, github, worktree | タスク分解・DAG構築 |
| **miyabi-agent-codegen** | agent-core, llm, potpie | コード生成 |
| **miyabi-agent-review** | agent-core, core | 品質レビュー |
| **miyabi-agent-workflow** | agent-core, github | ワークフロー管理 |
| **miyabi-agent-business** | agent-core, llm | ビジネスAgent基盤 |
| **miyabi-cli** | agents, github, worktree | CLIツール |
| **miyabi-mcp-server** | agents, types | MCP Server |
| **miyabi-a2a** | github, types | A2Aダッシュボード |
| **miyabi-webhook** | types, github | Webhook処理 |
| **miyabi-benchmark** | types, core, agents | ベンチマーク |

---

## 📈 依存関係グラフ（視覚化）

### 下層から上層への依存フロー

```
                    ┌───────────────────────────────┐
                    │   Layer 5: Application        │
                    │   (CLI, MCP, A2A, Webhook)    │
                    └───────────────┬───────────────┘
                                    │ 依存
                    ┌───────────────▼───────────────┐
                    │   Layer 4: Agent Impls        │
                    │   (Coordinator, CodeGen, etc) │
                    └───────────────┬───────────────┘
                                    │ 依存
                    ┌───────────────▼───────────────┐
                    │   Layer 3: Agent Core         │
                    │   (agent-core, integrations)  │
                    └───────────────┬───────────────┘
                                    │ 依存
                    ┌───────────────▼───────────────┐
                    │   Layer 2: Integration        │
                    │   (github, worktree, llm)     │
                    └───────────────┬───────────────┘
                                    │ 依存
                    ┌───────────────▼───────────────┐
                    │   Layer 1: Foundation         │
                    │   (types, core)               │
                    └───────────────────────────────┘
```

---

## 🎯 統合ポイント

### 1. 型システムによる統合 (miyabi-types)
すべてのクレートが`miyabi-types`を共通基盤として使用

```rust
// miyabi-types で定義された型をすべてのクレートで使用
use miyabi_types::{Agent, Task, Issue, Workflow};
```

### 2. Agent統合 (miyabi-agent-core)
統一されたAgent interfaceで全Agent実装を管理

```rust
#[async_trait]
pub trait BaseAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult>;
}
```

### 3. LLM統合 (miyabi-llm)
複数のLLMプロバイダーを統一インターフェースで管理

```rust
pub enum LlmProvider {
    Groq,      // API経由
    VLlm,      // Self-hosted
    Ollama,    // Local/LAN
}
```

### 4. GitHub統合 (miyabi-github)
すべてのGitHub操作を一元管理

```rust
pub struct GitHubClient {
    octocrab: Octocrab,
    owner: String,
    repo: String,
}
```

### 5. Worktree統合 (miyabi-worktree)
並列実行のためのWorktree管理を一元化

```rust
pub struct WorktreeManager {
    repo_path: PathBuf,
    base_dir: PathBuf,
}
```

---

## 🚀 実行フロー例

### Agent実行フロー（CLI経由）

```
1. User Input
   └─> miyabi-cli (main.rs)
       │
       ▼
2. Command Parsing
   └─> clap (agent run coordinator --issue 270)
       │
       ▼
3. Configuration Loading
   └─> miyabi-core (config.rs)
       │
       ▼
4. Agent Selection
   └─> miyabi-agents (CoordinatorAgent)
       │
       ▼
5. Issue Fetching
   └─> miyabi-github (GitHubClient)
       │
       ▼
6. Task Decomposition
   └─> miyabi-agent-coordinator (execute)
       │
       ├─> miyabi-llm (LLM call)
       │
       └─> miyabi-types (Task, DAG)
       │
       ▼
7. Worktree Creation
   └─> miyabi-worktree (WorktreeManager)
       │
       ▼
8. Agent Execution (Parallel)
   ├─> CodeGenAgent (worktree #1)
   ├─> ReviewAgent (worktree #2)
   └─> DeploymentAgent (worktree #3)
       │
       ▼
9. Result Aggregation
   └─> miyabi-agent-coordinator (merge)
       │
       ▼
10. GitHub Update
    └─> miyabi-github (update_issue, create_pr)
```

---

## 📦 ビルド・デプロイフロー

### ビルドターゲット

```
cargo build --release
│
├─> miyabi-cli (bin: miyabi)
├─> miyabi-mcp-server (lib)
├─> miyabi-discord-mcp-server (bin)
├─> miyabi-a2a (lib + React UI)
└─> miyabi-webhook (bin)
```

### リリースアーティファクト

1. **CLI Binary**: `target/release/miyabi` (単一バイナリ配布)
2. **MCP Server**: `miyabi-mcp-server.so` (JSON-RPC 2.0)
3. **A2A Dashboard**: `dist/` (React + Vite)
4. **Webhook Server**: `target/release/miyabi-webhook`

---

## 🔍 統合状態の評価

### ✅ 強み

1. **明確な階層構造**: 5層アーキテクチャで責任分離が明確
2. **型安全性**: `miyabi-types`による統一的な型システム
3. **モジュール性**: 各クレートが独立してテスト可能
4. **拡張性**: 新規Agent追加が容易（BaseAgent trait）
5. **並列実行**: Worktree統合により真の並列実行を実現

### ⚠️ 改善点

1. **Legacy Code**: `miyabi-agents`が旧実装を含む（移行中）
2. **依存関係の複雑性**: 一部のクレート（CLI, A2A）が多数のクレートに依存
3. **Business Agents**: 14個中13個が未実装（AIEntrepreneurのみ実装済）
4. **ドキュメント**: 各クレートのREADME.mdが不足
5. **テストカバレッジ**: 統合テストの拡充が必要

---

## 🎯 今後の方向性

### Phase 1: Agent実装の完全移行
- `miyabi-agents` の段階的廃止
- 各Agent専用クレートへの完全移行

### Phase 2: Business Agents実装
- 残り13個のBusiness Agent実装
- `.claude/agents/specs/business/` の仕様に基づく実装

### Phase 3: 統合テスト強化
- クレート間の統合テスト拡充
- E2Eテストシナリオの追加

### Phase 4: ドキュメント整備
- 各クレートのREADME.md作成
- API Docの拡充（rustdoc）

### Phase 5: パフォーマンス最適化
- 並列実行性能の測定・改善
- LLM呼び出しのキャッシュ最適化

---

## 📚 関連ドキュメント

- **Entity-Relationモデル**: `docs/ENTITY_RELATION_MODEL.md`
- **Agent仕様**: `.claude/agents/specs/coding/*.md`
- **Worktreeプロトコル**: `docs/WORKTREE_PROTOCOL.md`
- **Label体系**: `docs/LABEL_SYSTEM_GUIDE.md`

---

**生成者**: Claude Code
**最終更新**: 2025-10-22
