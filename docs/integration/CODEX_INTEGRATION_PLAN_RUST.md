# Codex × Miyabi (Rust Edition) 統合計画書

**Project**: Codex-Miyabi Rust Integration
**Date**: 2025-10-16
**Status**: 🚧 Phase 1 in progress
**Related Issue**: [#179](https://github.com/ShunsukeHayashi/miyabi-private/issues/179)
**Estimated Duration**: 21 person-days

---

## 🎯 プロジェクト概要

Miyabi (Rust Edition v1.0.0) をCodex CLI環境で動作させるための統合実装。
TypeScript版からの完全移行により、50%以上の実行時間削減、30%以上のメモリ削減を実現します。

### 目的

- **高速化**: Rustの高速実行による開発サイクル短縮
- **安全性**: コンパイル時型安全性によるランタイムエラー削減
- **単一バイナリ**: Node.js依存排除による配布簡素化
- **統合**: Codex CLI環境でMiyabi全機能を利用可能に

### 背景

- **Miyabi**: 完全自律型AI開発オペレーションプラットフォーム（Rust実装、375+ tests）
- **Codex**: OpenAI/Anthropicベースのローカルコーディングエージェント（Rust CLI + TUI）
- **既存統合**: TypeScript版統合が完了（Phase 0-8、5,300行）
- **移行理由**: パフォーマンス向上、メンテナンス性改善、エコシステム統一

---

## 📊 現状分析

### ✅ 完了済み

1. **Git Submodule**
   - Miyabiは既にCodexのsubmoduleとして追加済み
   - Location: `/Users/shunsuke/Dev/codex/../miyabi`
   - Version: `v1.0.0-1-gda9d732`

2. **Cargo Workspace統合**
   - Codexの`Cargo.toml`にMiyabi cratesが登録済み
   ```toml
   # Miyabi Rust crates (git submodule: ../miyabi)
   "../miyabi/crates/miyabi-types",
   "../miyabi/crates/miyabi-core",
   "../miyabi/crates/miyabi-agents",
   "../miyabi/crates/miyabi-github",
   "../miyabi/crates/miyabi-cli",
   "../miyabi/crates/miyabi-worktree",
   # Miyabi integration layer
   "miyabi-integration",
   ```

3. **TypeScript版統合**
   - 完全実装済み（Phase 0-8完了）
   - 6個のAgent（TypeScript）
   - MCP Server（TypeScript）
   - E2Eテストフレームワーク
   - 合計~5,300行のTypeScriptコード
   - Location: `/Users/shunsuke/Dev/codex/codex-miyabi/`

### ❌ 未完了

1. **`miyabi-integration` crate**
   - Cargo.tomlに登録されているが、実際のディレクトリが存在しない
   - 作成場所: `/Users/shunsuke/Dev/codex/codex-rs/miyabi-integration/`

2. **統合計画書**
   - このドキュメントが作成されていなかった

3. **CLI統合**
   - `codex miyabi` サブコマンドの実装が必要

4. **MCP Server（Rust版）**
   - TypeScript版は存在するが、Rust版の実装が必要

5. **TUI統合**
   - Codex TUIへのMiyabi機能統合が必要

---

## 🏗️ アーキテクチャ設計

### ハイブリッドアプローチ

**Phase 1-2**: Cargo Workspace統合（高速・ネイティブ）
- Miyabi cratesをCodex workspaceから直接参照
- `miyabi-integration` crateで統合レイヤーを提供
- Rust native APIでパフォーマンス最大化

**Phase 3**: MCP Server（拡張性・柔軟性）
- Miyabi Agent実行をMCPプロトコル経由で提供
- TypeScript版からRust版への段階的移行
- Claude Code等の外部ツールからも利用可能

### システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     Codex CLI (Rust)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CLI Command Layer                        │   │
│  │  • codex miyabi agent run <type> --issue <N>        │   │
│  │  • codex miyabi status                               │   │
│  │  • codex miyabi worktree list                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↕                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          miyabi-integration Crate                    │   │
│  │  • MiyabiClient - Unified API                        │   │
│  │  • AgentExecutor - Agent実行エンジン                  │   │
│  │  • WorktreeManager - Git Worktree管理                │   │
│  └──────────────────────────────────────────────────────┘   │
│                              ↕                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Miyabi Core Crates (Submodule)              │   │
│  │  • miyabi-types  • miyabi-core   • miyabi-agents    │   │
│  │  • miyabi-github • miyabi-cli    • miyabi-worktree  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              MCP Server (Phase 3) - Optional                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Rust MCP Server Implementation              │   │
│  │  • JSON-RPC 2.0 Protocol                            │   │
│  │  • Agent execution endpoints                         │   │
│  │  • Stdio/HTTP transport                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### データフロー

```
GitHub Issue (#270)
    ↓
codex miyabi agent run coordinator --issue 270
    ↓
MiyabiClient::execute_agent()
    ↓
CoordinatorAgent (miyabi-agents)
    ↓
Task Decomposition + DAG Generation
    ↓
WorktreeManager::create_worktrees()
    ↓
Parallel Execution (CodeGenAgent, ReviewAgent, etc.)
    ↓
Results Aggregation
    ↓
PRAgent::create_pull_request()
    ↓
GitHub PR (Ready for merge)
```

---

## 📝 実装フェーズ（21 person-days）

### Phase 0: 現状分析と計画 ✅ (1 day)

**目標**: 現状把握と統合計画書作成

**タスク**:
- [x] Codex/Miyabi両リポジトリの構造確認
- [x] 既存TypeScript統合の分析
- [x] Cargo Workspace状態の確認
- [x] 統合計画書作成（このドキュメント）
- [x] Issue #179への現状報告

**成果物**:
- `docs/CODEX_INTEGRATION_PLAN_RUST.md`
- Issue #179コメント（現状分析）

---

### Phase 1: Cargo Workspace統合 🚧 (5-7 days)

**目標**: `miyabi-integration` crate作成とビルド成功

#### Phase 1-1: Crate構造作成 (1 day)

**タスク**:
- [ ] `codex/codex-rs/miyabi-integration/` ディレクトリ作成
- [ ] `Cargo.toml` 作成（依存関係設定）
- [ ] `src/lib.rs` 作成（モジュール構造）
- [ ] `src/client.rs` 作成（MiyabiClient構造体）
- [ ] `README.md` 作成

**Cargo.toml**:
```toml
[package]
name = "miyabi-integration"
version = "0.1.0"
edition = "2024"

[dependencies]
# Miyabi core crates
miyabi-types = { path = "../../miyabi/crates/miyabi-types" }
miyabi-core = { path = "../../miyabi/crates/miyabi-core" }
miyabi-agents = { path = "../../miyabi/crates/miyabi-agents" }
miyabi-github = { path = "../../miyabi/crates/miyabi-github" }
miyabi-worktree = { path = "../../miyabi/crates/miyabi-worktree" }

# Async
tokio = { workspace = true }
async-trait = "0.1"

# Error handling
anyhow = { workspace = true }
thiserror = { workspace = true }

# Logging
tracing = { workspace = true }

# Serialization
serde = { workspace = true }
serde_json = { workspace = true }

[dev-dependencies]
tokio = { workspace = true, features = ["test-util"] }
```

#### Phase 1-2: MiyabiClient実装 (2 days)

**タスク**:
- [ ] `MiyabiClient` struct実装
- [ ] `AgentExecutor` trait実装
- [ ] Agent実行メソッド（coordinator, codegen, review, etc.）
- [ ] エラーハンドリング
- [ ] ログ統合（tracing）

**API設計**:
```rust
use miyabi_types::{Issue, Task, AgentType, AgentResult};
use anyhow::Result;

pub struct MiyabiClient {
    github_token: String,
    anthropic_key: String,
    config: MiyabiConfig,
}

impl MiyabiClient {
    pub fn new(github_token: String, anthropic_key: String) -> Self;

    pub async fn execute_agent(
        &self,
        agent_type: AgentType,
        issue_number: u64,
    ) -> Result<AgentResult>;

    pub async fn execute_coordinator(
        &self,
        issues: Vec<u64>,
        concurrency: usize,
    ) -> Result<Vec<AgentResult>>;

    pub async fn get_status(&self) -> Result<MiyabiStatus>;
}

#[async_trait]
pub trait AgentExecutor {
    async fn execute(&self, task: Task) -> Result<AgentResult>;
}
```

#### Phase 1-3: WorktreeManager統合 (1 day)

**タスク**:
- [ ] `miyabi-worktree` crateとの統合
- [ ] Worktree作成・削除APIラップ
- [ ] 並列実行サポート

#### Phase 1-4: テスト・ドキュメント (1-2 days)

**タスク**:
- [ ] 単体テスト作成（`tests/`）
- [ ] 統合テスト作成
- [ ] API ドキュメント（rustdoc）
- [ ] ビルド検証（`cargo build --all`）
- [ ] テスト実行（`cargo test --all`）

**成果物**:
- `codex-rs/miyabi-integration/` crate（完全実装）
- テストスイート（80%+ カバレッジ）
- API ドキュメント

---

### Phase 2: CLI拡張 (3-4 days)

**目標**: `codex miyabi` サブコマンド実装

#### Phase 2-1: CLI構造設計 (0.5 day)

**タスク**:
- [ ] `codex-rs/cli/src/miyabi.rs` 作成
- [ ] Clap subcommand定義
- [ ] コマンド構造設計

**CLI構造**:
```bash
codex miyabi                          # Miyabi統合メインコマンド
├── agent                             # Agent実行
│   ├── run <type> --issue <N>       # 単一Agent実行
│   ├── run coordinator --issues <N1,N2> --concurrency <C>  # 並列実行
│   └── list                          # 利用可能なAgent一覧
├── status                            # 実行状態確認
│   ├── --watch                       # リアルタイム監視
│   └── --json                        # JSON出力
├── worktree                          # Worktree管理
│   ├── list                          # Worktree一覧
│   ├── clean                         # 不要なWorktree削除
│   └── prune                         # stale Worktreeクリーンアップ
└── config                            # 設定管理
    ├── show                          # 現在の設定表示
    └── set <key> <value>            # 設定変更
```

#### Phase 2-2: Agent実行コマンド (1 day)

**タスク**:
- [ ] `agent run` サブコマンド実装
- [ ] Agent type解析（coordinator, codegen, review, etc.）
- [ ] Issue番号バリデーション
- [ ] 進捗表示（indicatif）

#### Phase 2-3: Status/Worktreeコマンド (1 day)

**タスク**:
- [ ] `status` サブコマンド実装
- [ ] `worktree` サブコマンド実装
- [ ] リアルタイム監視（--watch）

#### Phase 2-4: エラーハンドリング・ログ (0.5 day)

**タスク**:
- [ ] エラーメッセージ整備
- [ ] ログレベル設定（RUST_LOG）
- [ ] ヘルプメッセージ改善

**成果物**:
- `codex miyabi` コマンド群（完全実装）
- ヘルプドキュメント
- E2Eテスト

---

### Phase 3: MCP Server実装 (4-5 days)

**目標**: Rust版MCP Server実装（TypeScript版からの移行）

#### Phase 3-1: Crate構造作成 (0.5 day)

**タスク**:
- [ ] `codex-rs/miyabi-mcp-server/` crate作成
- [ ] `Cargo.toml` 設定
- [ ] MCPプロトコル依存関係追加

**Cargo.toml**:
```toml
[package]
name = "miyabi-mcp-server"
version = "0.1.0"
edition = "2024"

[dependencies]
miyabi-integration = { path = "../miyabi-integration" }

# MCP Protocol
mcp-types = { workspace = true }
# JSON-RPC
jsonrpc-core = "18"
jsonrpc-derive = "18"

# Async
tokio = { workspace = true }

# Serialization
serde = { workspace = true }
serde_json = { workspace = true }

# Logging
tracing = { workspace = true }
```

#### Phase 3-2: JSON-RPC Server (1 day)

**タスク**:
- [ ] JSON-RPC 2.0サーバー実装
- [ ] Stdio transport実装
- [ ] HTTP transport実装（optional）

#### Phase 3-3: MCP Tools実装 (2 days)

**タスク**:
- [ ] `agent_execute` tool（Agent実行）
- [ ] `issue_analyze` tool（Issue分析）
- [ ] `worktree_create` tool（Worktree作成）
- [ ] `status_get` tool（ステータス取得）

**Tools API**:
```rust
// agent_execute
{
  "name": "agent_execute",
  "description": "Execute Miyabi agent on GitHub issue",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agentType": { "type": "string", "enum": ["coordinator", "codegen", "review", ...] },
      "issueNumber": { "type": "number" },
      "config": { "type": "object" }
    },
    "required": ["agentType", "issueNumber"]
  }
}
```

#### Phase 3-4: テスト・ドキュメント (1 day)

**タスク**:
- [ ] MCP Protocol準拠テスト
- [ ] E2Eテスト（stdio transport）
- [ ] API ドキュメント
- [ ] Claude Code統合ガイド

**成果物**:
- `miyabi-mcp-server` crate（完全実装）
- MCP Protocol準拠
- Claude Code統合可能

---

### Phase 4: TUI統合 (3-4 days)

**目標**: Codex TUIへのMiyabi機能統合

#### Phase 4-1: TUIレイアウト設計 (1 day)

**タスク**:
- [ ] Miyabiパネル設計（ratatui）
- [ ] Agent実行状態表示
- [ ] リアルタイムログ表示
- [ ] キーバインド設計

**TUIレイアウト**:
```
┌─────────────────────────────────────────────────────────────┐
│ Codex TUI - Miyabi Integration                              │
├─────────────────────────────────────────────────────────────┤
│ [Agent Status]                                              │
│ • CoordinatorAgent: ✅ Running (Issue #270)                 │
│ • CodeGenAgent:     🔄 In Progress (Task 3/5)              │
│ • ReviewAgent:      ⏸️  Waiting                            │
│                                                             │
│ [Worktrees]                                                 │
│ • .worktrees/issue-270  (active)                           │
│ • .worktrees/issue-271  (idle)                             │
│                                                             │
│ [Logs]                                                      │
│ 16:45:32 INFO  CoordinatorAgent started                    │
│ 16:45:35 DEBUG Task decomposition complete (5 tasks)       │
│ 16:45:40 INFO  CodeGenAgent generating code...             │
└─────────────────────────────────────────────────────────────┘
```

#### Phase 4-2: Agent実行UI (1 day)

**タスク**:
- [ ] Agent実行トリガーUI
- [ ] 進捗バー統合（indicatif）
- [ ] キャンセル機能

#### Phase 4-3: ログ表示 (1 day)

**タスク**:
- [ ] リアルタイムログストリーム
- [ ] ログフィルタリング（レベル、Agent種別）
- [ ] ログエクスポート機能

**成果物**:
- Codex TUI統合（完全実装）
- インタラクティブUI
- ユーザーガイド

---

### Phase 5: テスト・ドキュメント (3-4 days)

**目標**: 統合テストとドキュメント完備

#### Phase 5-1: 統合テストスイート (1.5 days)

**タスク**:
- [ ] Cargo workspace統合テスト
- [ ] CLI E2Eテスト
- [ ] MCP Server統合テスト
- [ ] パフォーマンステスト

**テスト構造**:
```
tests/
├── integration/
│   ├── cli_test.rs          # CLI E2E
│   ├── agent_execution_test.rs  # Agent実行
│   └── worktree_test.rs     # Worktree管理
├── e2e/
│   ├── full_workflow_test.rs    # Issue → PR完全フロー
│   └── parallel_execution_test.rs  # 並列実行
└── performance/
    ├── benchmark_test.rs    # パフォーマンスベンチマーク
    └── memory_test.rs       # メモリ使用量
```

#### Phase 5-2: ドキュメント作成 (1 day)

**タスク**:
- [ ] ユーザーガイド作成
- [ ] API リファレンス（rustdoc）
- [ ] 統合ガイド（Codex × Miyabi）
- [ ] トラブルシューティング

**ドキュメント構造**:
```
docs/
├── CODEX_INTEGRATION_PLAN_RUST.md  # このドキュメント
├── USER_GUIDE_CODEX_MIYABI.md      # ユーザーガイド
├── API_REFERENCE.md                # API リファレンス
├── TROUBLESHOOTING.md              # トラブルシューティング
└── ARCHITECTURE.md                 # アーキテクチャ詳細
```

#### Phase 5-3: パフォーマンス検証 (0.5 day)

**タスク**:
- [ ] TypeScript版との比較ベンチマーク
- [ ] メモリ使用量測定
- [ ] 実行時間測定

**成果物**:
- 統合テストスイート（完全）
- ドキュメント完備
- パフォーマンスレポート

---

## 🔧 技術スタック

### Miyabi Core
- **Rust**: 2021 Edition (Stable 1.75+)
- **Async Runtime**: tokio 1.40
- **GitHub API**: octocrab 0.47
- **CLI**: clap 4.5
- **Logging**: tracing + tracing-subscriber

### Codex Integration
- **TUI**: ratatui 0.29
- **MCP Protocol**: mcp-types, JSON-RPC 2.0
- **Git Operations**: git2 0.19
- **Testing**: insta 1.40, serial_test 3.2

### 依存関係マトリクス

| Component | Miyabi Crates | Codex Crates | External |
|-----------|---------------|--------------|----------|
| miyabi-integration | miyabi-types, miyabi-core, miyabi-agents, miyabi-github, miyabi-worktree | - | tokio, anyhow, thiserror, tracing |
| Codex CLI | miyabi-integration | codex-cli, codex-common | clap, indicatif |
| miyabi-mcp-server | miyabi-integration | mcp-types | jsonrpc-core, tokio |
| Codex TUI | miyabi-integration | codex-tui | ratatui |

---

## ✅ 成功基準

### Phase 1完了条件
- [x] Git submodule追加（既に完了）
- [x] Cargo Workspace統合（既に完了）
- [ ] `miyabi-integration` crate作成
- [ ] `cargo build --all` 成功
- [ ] `cargo test --all` 成功（80%+ カバレッジ）

### Phase 2完了条件
- [ ] `codex miyabi agent run coordinator --issue 270` が動作
- [ ] `codex miyabi status` が動作
- [ ] `codex miyabi worktree list` が動作
- [ ] CLI E2Eテストパス

### Phase 3完了条件
- [ ] MCP Server起動成功
- [ ] `agent_execute` tool動作
- [ ] Claude Codeから呼び出し可能
- [ ] MCP Protocol準拠

### Phase 4完了条件
- [ ] Codex TUIにMiyabiパネル追加
- [ ] Agent実行状態のリアルタイム表示
- [ ] インタラクティブ操作可能

### Phase 5完了条件
- [ ] 全テストパス（Miyabi 375+ tests + Codex tests + 統合tests）
- [ ] ドキュメント完備（ユーザーガイド + API docs）
- [ ] パフォーマンス検証完了（TypeScript版との比較）
- [ ] Issue #179クローズ条件達成

---

## 📈 KPI・メトリクス

### パフォーマンス目標

| メトリクス | TypeScript版 | Rust版目標 | 改善率 |
|-----------|-------------|-----------|-------|
| Agent実行時間（Medium Issue） | 15分 | <7.5分 | 50%+ |
| メモリ使用量 | 200MB | <140MB | 30%+ |
| 起動時間 | 3秒 | <1秒 | 66%+ |
| バイナリサイズ | 100MB (Node.js + deps) | <20MB | 80%+ |

### 品質目標

| メトリクス | 目標値 |
|-----------|-------|
| テストカバレッジ | 80%+ |
| Clippy警告 | 0 |
| Rustfmt適用 | 100% |
| ドキュメンテーション | 全public API |

---

## 📅 タイムライン

### 3週間計画

**Week 1**: Phase 1 (Cargo Workspace統合)
- Day 1: Phase 0完了 + Phase 1-1（Crate構造）
- Day 2-3: Phase 1-2（MiyabiClient実装）
- Day 4: Phase 1-3（WorktreeManager統合）
- Day 5: Phase 1-4（テスト・ドキュメント）

**Week 2**: Phase 2-3 (CLI拡張 + MCP Server)
- Day 1-2: Phase 2（CLI拡張）
- Day 3-5: Phase 3（MCP Server実装）

**Week 3**: Phase 4-5 (TUI統合 + 最終テスト)
- Day 1-3: Phase 4（TUI統合）
- Day 4-5: Phase 5（テスト・ドキュメント）

### マイルストーン

| Date | Milestone | Deliverable |
|------|-----------|-------------|
| 2025-10-16 | Phase 0完了 | 統合計画書 |
| 2025-10-20 | Phase 1完了 | miyabi-integration crate |
| 2025-10-24 | Phase 2完了 | codex miyabi CLI |
| 2025-10-27 | Phase 3完了 | miyabi-mcp-server |
| 2025-11-01 | Phase 4完了 | Codex TUI統合 |
| 2025-11-03 | Phase 5完了 | 統合テスト・ドキュメント |

---

## 🔗 関連ドキュメント

### Miyabi
- [CLAUDE.md](../CLAUDE.md) - Miyabiプロジェクト概要
- [ENTITY_RELATION_MODEL.md](ENTITY_RELATION_MODEL.md) - Entity-Relationモデル
- [RUST_MIGRATION_REQUIREMENTS.md](RUST_MIGRATION_REQUIREMENTS.md) - Rust移行要件
- [Cargo Workspace](../Cargo.toml) - Miyabi Workspace設定

### Codex
- [Codex Repository](https://github.com/ShunsukeHayashi/codex) - Codex CLI本体
- [Codex Cargo.toml](https://github.com/ShunsukeHayashi/codex/blob/main/codex-rs/Cargo.toml) - Codex Workspace

### TypeScript版統合（参考）
- [MIYABI_INTEGRATION_SUMMARY.md](https://github.com/ShunsukeHayashi/codex/blob/main/codex-miyabi/MIYABI_INTEGRATION_SUMMARY.md) - TypeScript版統合サマリー
- [INTEGRATION_PLAN_MIYABI.md](https://github.com/ShunsukeHayashi/codex/blob/main/INTEGRATION_PLAN_MIYABI.md) - TypeScript版統合計画

---

## 📝 進捗トラッキング

### Phase 1進捗

| Task | Status | Assignee | Est. | Actual |
|------|--------|----------|------|--------|
| Phase 0完了 | ✅ | Claude Code | 1 day | 0.5 day |
| Crate構造作成 | 🚧 | - | 1 day | - |
| MiyabiClient実装 | ⏸️ | - | 2 days | - |
| WorktreeManager統合 | ⏸️ | - | 1 day | - |
| テスト・ドキュメント | ⏸️ | - | 1-2 days | - |

### Next Actions

1. **Immediate (今日中)**:
   - [x] 統合計画書作成（このドキュメント）
   - [ ] Issue #179に現状報告コメント
   - [ ] Phase 1-1開始（`miyabi-integration` crate作成）

2. **Short-term (今週中)**:
   - [ ] Phase 1完了（MiyabiClient実装）
   - [ ] ビルド・テスト検証
   - [ ] Phase 2開始（CLI拡張）

3. **Mid-term (来週)**:
   - [ ] Phase 2-3完了（CLI + MCP Server）
   - [ ] Phase 4開始（TUI統合）

---

## 🤝 Contributors

- **Lead**: Claude Code + Human Developer
- **Repository**: https://github.com/ShunsukeHayashi/miyabi-private
- **Issue**: [#179](https://github.com/ShunsukeHayashi/miyabi-private/issues/179)

---

**Last Updated**: 2025-10-16
**Status**: 🚧 Phase 0完了、Phase 1進行中
