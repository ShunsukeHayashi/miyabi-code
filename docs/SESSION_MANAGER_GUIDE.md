# Miyabi Session Manager - Complete Guide

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: ✅ Production Ready

## 概要

**Session Manager**は、複数のClaude Code Agent間でセッションを引き継ぐための管理システムです。これにより、完全自律的なAgent Pipelineの実行が可能になります。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────────────┐
│          HeadlessOrchestrator                   │
│  ┌───────────────────────────────────────────┐  │
│  │         SessionManager                    │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  Active Sessions (DashMap)          │  │  │
│  │  │  - session_id → ManagedSession      │  │  │
│  │  │  - Thread-safe concurrent access    │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  SessionStorage (.ai/sessions/)     │  │  │
│  │  │  - sessions.json (persistent DB)    │  │  │
│  │  │  - logs/{uuid}.log (Agent outputs)  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Agent Pipeline

```
Issue #270: "Add OAuth2 authentication"
│
├─ Phase 1: Issue Analysis
│   ↓ SessionManager.spawn_agent_session("IssueAgent", ...)
│   └─ Result: Complexity=7.0, Estimated=180min
│
├─ Phase 2: Task Decomposition
│   ↓ SessionManager.handoff(session_id, "CoordinatorAgent", ...)
│   └─ Result: 5 tasks generated
│
├─ Phase 3: Worktree Creation
│   └─ Create: .worktrees/issue-270
│
├─ Phase 4: Code Generation
│   ↓ SessionManager.handoff(session_id, "CodeGenAgent", ...)
│   └─ Result: 5-Worlds 80% confidence
│
├─ Phase 5: Code Review
│   ↓ SessionManager.handoff(session_id, "ReviewAgent", ...)
│   └─ Result: Quality=85%, No blockers
│
├─ Phase 6: Test Execution
│   ↓ SessionManager.handoff(session_id, "TestAgent", ...)
│   └─ Result: 42/42 tests passed
│
├─ Phase 7: PR Creation
│   ↓ SessionManager.handoff(session_id, "PRAgent", ...)
│   └─ Result: PR #123 created
│
├─ Phase 8: CI/CD
│   └─ GitHub Actions triggered
│
└─ Phase 9: Auto-Merge
    ↓ SessionManager.complete_session(session_id)
    └─ Result: PR merged, Issue closed
```

## コア機能

### 1. Session Lifecycle Management

#### セッション作成

```rust
use miyabi_session_manager::{SessionManager, SessionContext, Phase};

// Session Managerを初期化
let manager = SessionManager::new(".ai/sessions").await?;

// コンテキストを準備
let context = SessionContext {
    issue_number: Some(270),
    current_phase: Phase::CodeGeneration,
    worktree_path: Some(".worktrees/issue-270".into()),
    previous_results: vec![],
};

// Agentセッションを起動
let session_id = manager
    .spawn_agent_session(
        "CodeGenAgent",
        "Code generation for Issue #270",
        context,
    )
    .await?;

println!("✅ Session created: {}", session_id);
```

#### セッション完了/失敗

```rust
// 成功時
manager.complete_session(session_id).await?;

// 失敗時
manager.fail_session(session_id, "Compilation error".to_string()).await?;
```

### 2. Agent Handoff

```rust
// Phase 4 (CodeGen) → Phase 5 (Review) への引き継ぎ

// CodeGenの結果を含めてコンテキスト更新
let updated_context = SessionContext {
    issue_number: Some(270),
    current_phase: Phase::Review,
    worktree_path: Some(".worktrees/issue-270".into()),
    previous_results: vec![
        AgentResult::CodeGeneration {
            confidence: 0.85,
            successful_worlds: 4,
        }
    ],
};

// ReviewAgentに引き継ぎ
let review_session_id = manager
    .handoff(session_id, "ReviewAgent", updated_context)
    .await?;

println!("🔄 Handed off to ReviewAgent: {}", review_session_id);
```

### 3. Session Lineage Tracking

```rust
// セッション系譜を取得（親→子の順）
let lineage = manager.get_session_lineage(current_session_id);

for (i, session) in lineage.iter().enumerate() {
    println!(
        "  {}. {} ({}) - Status: {:?}",
        i + 1,
        session.agent_name,
        session.purpose,
        session.status
    );
}
```

**出力例:**

```
1. IssueAgent (Issue analysis for #270) - Status: HandedOff
2. CoordinatorAgent (Task decomposition for #270) - Status: HandedOff
3. CodeGenAgent (Code generation for #270) - Status: HandedOff
4. ReviewAgent (Code review for #270) - Status: Active
```

### 4. Session Statistics

```rust
let stats = manager.get_stats();

println!("Session Statistics:");
println!("  Total: {}", stats.total);
println!("  Active: {}", stats.active);
println!("  Handed Off: {}", stats.handed_off);
println!("  Completed: {}", stats.completed);
println!("  Failed: {}", stats.failed);
```

## HeadlessOrchestrator統合

### 基本的な使い方

```rust
use miyabi_orchestrator::{HeadlessOrchestrator, HeadlessOrchestratorConfig};

// Orchestratorを作成
let config = HeadlessOrchestratorConfig {
    autonomous_mode: true,
    auto_approve_complexity: 5.0,
    auto_merge_quality: 80.0,
    dry_run: false,
};

let orchestrator = HeadlessOrchestrator::new(config)
    .with_session_manager() // SessionManager有効化
    .await?;

// Issue処理（自動的にAgent間でセッション引き継ぎ）
let result = orchestrator.handle_issue_created(&issue).await?;

println!("Final phase: {:?}", result.final_phase);
println!("Success: {}", result.success);
```

### Phase 4→5の自動引き継ぎ例

```rust
// Phase 4完了後の自動引き継ぎ（Orchestrator内部実装例）
async fn run_phase_4_codegen_execution(
    &mut self,
    issue: &Issue,
    worktrees: &[WorktreeInfo],
    state_machine: &mut StateMachine,
) -> Result<ExecutionResult> {
    // SessionManagerが有効な場合のみ実行
    if let Some(session_manager) = &self.session_manager {
        // Phase 4セッションを作成
        let context = SessionContext {
            issue_number: Some(issue.number),
            current_phase: Phase::CodeGeneration,
            worktree_path: Some(worktrees[0].path.clone()),
            previous_results: vec![],
        };

        let session_id = session_manager
            .spawn_agent_session("CodeGenAgent", "Phase 4 execution", context)
            .await?;

        // 5-Worlds並列実行
        let execution_result = self.claude_code_executor
            .as_mut()
            .unwrap()
            .execute_agent_run(issue.number as u32, worktrees[0].path.clone())
            .await?;

        if execution_result.success {
            // Phase 5 (Review) に引き継ぎ
            let review_context = SessionContext {
                issue_number: Some(issue.number),
                current_phase: Phase::Review,
                worktree_path: Some(worktrees[0].path.clone()),
                previous_results: vec![
                    AgentResult::CodeGeneration {
                        confidence: execution_result.confidence,
                        successful_worlds: execution_result.successful_worlds,
                    }
                ],
            };

            let review_session_id = session_manager
                .handoff(session_id, "ReviewAgent", review_context)
                .await?;

            info!("✅ Handed off to ReviewAgent: {}", review_session_id);
        } else {
            // 失敗 → エスカレーション
            session_manager
                .fail_session(session_id, "Code generation failed".to_string())
                .await?;
        }

        Ok(execution_result)
    } else {
        // SessionManager未使用時は従来のフロー
        // ...
    }
}
```

## データ構造

### SessionContext

```rust
pub struct SessionContext {
    /// 作業中のIssue番号
    pub issue_number: Option<u64>,

    /// 現在のフェーズ
    pub current_phase: Phase,

    /// Worktreeパス
    pub worktree_path: Option<PathBuf>,

    /// 前回のAgent実行結果
    pub previous_results: Vec<AgentResult>,
}
```

### ManagedSession

```rust
pub struct ManagedSession {
    /// セッションID (UUID)
    pub id: Uuid,

    /// Agent名 (例: "CodeGenAgent")
    pub agent_name: String,

    /// セッションの目的
    pub purpose: String,

    /// セッションコンテキスト
    pub context: SessionContext,

    /// 作成日時
    pub created_at: DateTime<Utc>,

    /// セッション状態
    pub status: SessionStatus,

    /// 親セッションID (引き継ぎ元)
    pub parent_session: Option<Uuid>,

    /// 子セッションIDリスト (引き継ぎ先)
    pub child_sessions: Vec<Uuid>,

    /// 引き継ぎ先Agent名
    pub handoff_to: Option<String>,

    /// エラーメッセージ (失敗時)
    pub error_message: Option<String>,

    /// プロセスID (Child process handle)
    #[serde(skip)]
    pub child: Option<Child>,
}
```

### SessionStatus

```rust
pub enum SessionStatus {
    /// アクティブ (実行中)
    Active,

    /// 引き継ぎ済み
    HandedOff,

    /// 完了
    Completed,

    /// 失敗
    Failed,
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

### AgentResult

```rust
pub enum AgentResult {
    IssueAnalysis {
        complexity: f64,
        estimated_duration: u64,
    },
    TaskDecomposition {
        tasks: Vec<String>,
    },
    CodeGeneration {
        confidence: f64,
        successful_worlds: usize,
    },
    Review {
        quality_score: f64,
        issues_found: usize,
    },
}
```

## ファイルシステムレイアウト

```
.ai/sessions/
├── sessions.json              # セッション情報DB
└── logs/
    ├── 550e8400-....log      # CodeGenAgent実行ログ
    ├── 660e8400-....log      # ReviewAgent実行ログ
    └── ...
```

### sessions.json 形式

```json
{
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_name": "CodeGenAgent",
      "purpose": "Code generation for Issue #270",
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

## エラーハンドリング

### エラー型

```rust
pub enum SessionError {
    NotFound(Uuid),              // セッションが見つからない
    AlreadyExists(Uuid),         // セッションが既に存在
    SpawnFailed(std::io::Error), // プロセス起動失敗
    StorageError(String),        // 永続化エラー
    InvalidState(String),        // 不正な状態遷移
    Other(anyhow::Error),        // その他のエラー
}
```

### エラーハンドリング例

```rust
match manager.spawn_agent_session("TestAgent", "test", context).await {
    Ok(session_id) => {
        println!("✅ Session created: {}", session_id);
    }
    Err(SessionError::SpawnFailed(e)) => {
        eprintln!("❌ Failed to spawn claude code process: {}", e);
        eprintln!("   Make sure 'claude' CLI is installed and in PATH");
    }
    Err(SessionError::StorageError(e)) => {
        eprintln!("❌ Failed to save session: {}", e);
        eprintln!("   Check .ai/sessions/ directory permissions");
    }
    Err(e) => {
        eprintln!("❌ Unexpected error: {}", e);
    }
}
```

## ベストプラクティス

### 1. セッションの命名規則

```rust
// ❌ Bad: 汎用的すぎる
let session_id = manager.spawn_agent_session("Agent", "task", context).await?;

// ✅ Good: 具体的で識別しやすい
let session_id = manager
    .spawn_agent_session(
        "CodeGenAgent",
        "OAuth2 authentication implementation for Issue #270",
        context,
    )
    .await?;
```

### 2. コンテキストの引き継ぎ

```rust
// ❌ Bad: 前の結果を破棄
let new_context = SessionContext {
    issue_number: Some(270),
    current_phase: Phase::Review,
    worktree_path: Some(path.clone()),
    previous_results: vec![], // 空にしてしまう
};

// ✅ Good: 前の結果を保持して引き継ぐ
let mut previous_results = old_context.previous_results.clone();
previous_results.push(AgentResult::CodeGeneration {
    confidence: 0.85,
    successful_worlds: 4,
});

let new_context = SessionContext {
    issue_number: Some(270),
    current_phase: Phase::Review,
    worktree_path: Some(path.clone()),
    previous_results,
};
```

### 3. エラー時のクリーンアップ

```rust
// セッション作成後は必ず完了/失敗をマーク
let session_id = manager.spawn_agent_session(...).await?;

match execute_task().await {
    Ok(_) => {
        manager.complete_session(session_id).await?;
    }
    Err(e) => {
        manager.fail_session(session_id, e.to_string()).await?;
        return Err(e);
    }
}
```

## パフォーマンス特性

### 並行アクセス

- **DashMap使用**: Read-Write Lockを最小化
- **O(1) lookup**: Hash-based session retrieval
- **Thread-safe**: 複数Agentの同時実行対応

### メモリ使用量

- **セッション1個あたり**: ~500 bytes
- **100セッション**: ~50 KB
- **1000セッション**: ~500 KB

### ディスク I/O

- **Session作成**: ~1 write (sessions.json更新)
- **Session更新**: ~1 write
- **Session削除**: ~1 write

## トラブルシューティング

### Q1: セッションが見つからない

```rust
// Error: Session not found: 550e8400-...

// 原因1: セッションIDが間違っている
// → list_active_sessions() で確認

// 原因2: セッションが既に削除されている
// → sessions.json を確認

// 原因3: 別のSessionManagerインスタンスで作成された
// → SessionManagerを共有する
```

### Q2: プロセス起動に失敗する

```bash
# Error: Failed to spawn claude code process

# 解決策1: claude CLIをインストール
npm install -g @anthropics/claude-code

# 解決策2: PATHを確認
which claude

# 解決策3: 権限を確認
chmod +x $(which claude)
```

### Q3: セッションログが見つからない

```bash
# ログディレクトリを確認
ls -la .ai/sessions/logs/

# セッションIDを確認
cat .ai/sessions/sessions.json | jq '.sessions[] | .id'

# ログファイルを確認
tail -f .ai/sessions/logs/550e8400-*.log
```

## 関連ドキュメント

- [Session Manager API Reference](../crates/miyabi-session-manager/README.md)
- [HeadlessOrchestrator Guide](./HEADLESS_ORCHESTRATOR.md)
- [Phase 4 Implementation](./PHASE4_IMPLEMENTATION.md)
- [5-Worlds Quality Assurance](./FIVE_WORLDS_QA.md)

## バージョン履歴

### v1.0.0 (2025-10-27)

- ✅ Initial release
- ✅ Basic session lifecycle management
- ✅ Agent handoff functionality
- ✅ Session lineage tracking
- ✅ JSON persistence
- ✅ HeadlessOrchestrator integration
- ✅ DashMap-based concurrent access
- ✅ 5 integration tests
- ✅ Complete API documentation

---

**License**: MIT
**Author**: Miyabi Team
**Contact**: https://github.com/ShunsukeHayashi/Miyabi/issues
