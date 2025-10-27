# Miyabi Session Manager

Claude Code セッション管理システム - Agent間の引き継ぎを実現

## 概要

**Session Manager**は、複数のClaude Code Agent間でセッションを引き継ぐための管理システムです。

これにより、以下のようなワークフローが実現できます：

```
CodeGenAgent (コード生成)
    ↓ handoff
ReviewAgent (レビュー)
    ↓ handoff
TestAgent (テスト実行)
    ↓ handoff
DeployAgent (デプロイ)
```

## 主な機能

### 1. セッション管理
- **Claude Code --headless** セッションのライフサイクル管理
- UUID based session tracking
- 永続化（JSON形式）

### 2. Agent間引き継ぎ (Handoff)
- セッションを別のAgentに引き継ぐ
- コンテキスト情報の引き継ぎ
- 親子関係のトラッキング

### 3. セッション系譜 (Lineage)
- 親→子のセッション系譜を取得
- 引き継ぎ履歴の可視化

### 4. 並列実行対応
- `DashMap`による並行アクセス対応
- 複数Agentの同時実行

## 使用例

### 基本的な使い方

```rust
use miyabi_session_manager::{SessionManager, SessionContext, Phase};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Session Managerを初期化
    let manager = SessionManager::new(".ai/sessions").await?;

    // コンテキストを準備
    let context = SessionContext {
        issue_number: Some(270),
        current_phase: Phase::CodeGeneration,
        worktree_path: Some(".worktrees/issue-270".into()),
        previous_results: vec![],
    };

    // CodeGenAgentセッションを起動
    let session_id = manager
        .spawn_agent_session("CodeGenAgent", "Code generation for #270", context)
        .await?;

    println!("✅ CodeGenAgent started: {}", session_id);

    // ... Agentの実行完了を待つ ...

    // ReviewAgentに引き継ぎ
    let review_context = SessionContext {
        issue_number: Some(270),
        current_phase: Phase::Review,
        worktree_path: Some(".worktrees/issue-270".into()),
        previous_results: vec![],
    };

    let review_session_id = manager
        .handoff(session_id, "ReviewAgent", review_context)
        .await?;

    println!("🔄 Handed off to ReviewAgent: {}", review_session_id);

    Ok(())
}
```

### セッション系譜の取得

```rust
// セッション系譜を取得（親→子の順）
let lineage = manager.get_session_lineage(current_session_id);

for (i, session) in lineage.iter().enumerate() {
    println!("{}: {} ({})", i + 1, session.agent_name, session.status);
}

// 出力例:
// 1: CodeGenAgent (HandedOff)
// 2: ReviewAgent (HandedOff)
// 3: TestAgent (Active)
```

### セッション統計

```rust
let stats = manager.get_stats();

println!("Total sessions: {}", stats.total);
println!("Active: {}", stats.active);
println!("Completed: {}", stats.completed);
println!("Failed: {}", stats.failed);
```

## ディレクトリ構造

Session Managerは以下のディレクトリ構造を使用します：

```
.ai/sessions/
├── sessions.json          # セッション情報DB
└── logs/
    ├── {uuid-1}.log      # Agent実行ログ
    ├── {uuid-2}.log
    └── ...
```

### sessions.json 形式

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_name": "CodeGenAgent",
      "purpose": "Code generation for #270",
      "context": {
        "issue_number": 270,
        "current_phase": "CodeGeneration",
        "worktree_path": ".worktrees/issue-270"
      },
      "created_at": "2025-10-27T04:30:00Z",
      "status": "HandedOff",
      "parent_session": null,
      "child_sessions": ["660e8400-e29b-41d4-a716-446655440000"],
      "handoff_to": "ReviewAgent"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "agent_name": "ReviewAgent",
      "purpose": "Handoff from session 550e8400-...",
      "context": {
        "issue_number": 270,
        "current_phase": "Review",
        "worktree_path": ".worktrees/issue-270"
      },
      "created_at": "2025-10-27T04:35:00Z",
      "status": "Active",
      "parent_session": "550e8400-e29b-41d4-a716-446655440000",
      "child_sessions": []
    }
  ],
  "version": 1
}
```

## HeadlessOrchestratorとの統合

Session ManagerはHeadlessOrchestratorと統合可能です：

```rust
use miyabi_orchestrator::HeadlessOrchestrator;
use miyabi_session_manager::SessionManager;

let mut orchestrator = HeadlessOrchestrator::new(config);
let session_manager = SessionManager::new(".ai/sessions").await?;

// Orchestrator内でSession Managerを使用
// Phase 4完了後にPhase 5へ引き継ぎ
let session_id = session_manager
    .spawn_agent_session("CodeGenAgent", "Phase 4", context)
    .await?;

// ... Phase 4実行 ...

let review_session_id = session_manager
    .handoff(session_id, "ReviewAgent", updated_context)
    .await?;
```

## API Reference

### SessionManager

#### `new(storage_dir: P) -> Result<Self>`
Session Managerを初期化

#### `spawn_agent_session(agent_name: &str, purpose: &str, context: SessionContext) -> Result<Uuid>`
新しいセッションを作成してAgentを起動

#### `handoff(from_session_id: Uuid, to_agent: &str, updated_context: SessionContext) -> Result<Uuid>`
セッションを別のAgentに引き継ぐ

#### `get_session(session_id: Uuid) -> Result<ManagedSession>`
セッションを取得

#### `get_session_lineage(session_id: Uuid) -> Vec<ManagedSession>`
セッション系譜を取得（親→子の順）

#### `list_active_sessions() -> Vec<ManagedSession>`
全てのアクティブなセッションを取得

#### `complete_session(session_id: Uuid) -> Result<()>`
セッションを完了としてマーク

#### `fail_session(session_id: Uuid, error: String) -> Result<()>`
セッションを失敗としてマーク

#### `get_stats() -> SessionStats`
セッション数の統計を取得

### SessionContext

```rust
pub struct SessionContext {
    pub issue_number: Option<u64>,
    pub current_phase: Phase,
    pub worktree_path: Option<PathBuf>,
    pub previous_results: Vec<AgentResult>,
}
```

### SessionStatus

```rust
pub enum SessionStatus {
    Active,      // アクティブ（実行中）
    HandedOff,   // 引き継ぎ済み
    Completed,   // 完了
    Failed,      // 失敗
}
```

### Phase

```rust
pub enum Phase {
    IssueAnalysis,
    TaskDecomposition,
    WorktreeCreation,
    CodeGeneration,
    Review,
    Test,
    PullRequest,
    CICD,
    Merge,
}
```

## テスト

```bash
# ユニットテスト + 統合テスト
cargo test --package miyabi-session-manager

# ドキュメントテスト
cargo test --package miyabi-session-manager --doc
```

## ライセンス

MIT

## 関連ドキュメント

- [HeadlessOrchestrator](../miyabi-orchestrator/README.md)
- [Phase 4 Implementation](../../docs/PHASE4_IMPLEMENTATION.md)
- [5-Worlds Quality Assurance](../../docs/FIVE_WORLDS_QA.md)
