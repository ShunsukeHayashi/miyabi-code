# Worktree Protocol - Git Worktree並列実行

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐

## 🔗 概要

**Git Worktree並列実行**: Worktree単位でAgent並列実行を実現

```
CoordinatorAgent (Main Process)
    │
    ├─ Worktree #1 (Issue #270) → CodeGenAgent
    ├─ Worktree #2 (Issue #271) → ReviewAgent
    └─ Worktree #3 (Issue #272) → DeploymentAgent
    │
    └─ Merge Back to Main
```

## 📁 Worktreeディレクトリ構造

```
.worktrees/
├── issue-270/                  # Issue #270専用Worktree
│   ├── .agent-context.json     # 機械可読コンテキスト
│   ├── EXECUTION_CONTEXT.md    # 人間可読コンテキスト
│   └── [project files]
├── issue-271/
└── issue-272/
```

### .agent-context.json
```json
{
  "agentType": "CodeGenAgent",
  "agentStatus": "executing",
  "task": { /* Task詳細 */ },
  "issue": { /* Issue詳細 */ },
  "config": { /* Agent設定 */ },
  "promptPath": ".claude/agents/prompts/coding/codegen-agent-prompt.md",
  "worktreeInfo": { /* Worktree情報 */ }
}
```

### EXECUTION_CONTEXT.md
- Issue情報（タイトル、URL、ラベル）
- Task情報（依存関係、推定時間）
- Agent情報（種別、ステータス、プロンプトパス）
- Worktree情報（パス、ブランチ、セッションID）

## 🔄 Worktreeライフサイクルプロトコル

**完全なシーケンスプロトコル**: `docs/WORKTREE_PROTOCOL.md`

### Phase 1: Worktree Creation
```bash
# CoordinatorAgentが実行
git worktree add .worktrees/issue-270 -b worktree/issue-270
```

### Phase 2: Agent Assignment
- Task typeベースの自動Agent割り当て
- `.agent-context.json` + `EXECUTION_CONTEXT.md` 生成

### Phase 3: Execution
```bash
cd .worktrees/issue-270
# Claude Code実行（Agent固有プロンプト使用）
# git commit（Conventional Commits準拠）
```

### Phase 4: Cleanup
```bash
# Mainブランチにマージ
git merge worktree/issue-270

# Worktree削除
git worktree remove .worktrees/issue-270
```

## 🚀 実行方法

### CLI実行
```bash
# 単一Issue
miyabi agent run coordinator --issue 270

# 並列実行（Worktreeベース）
miyabi agent run coordinator --issues 270,271,272 --concurrency 3
```

### Rust API
```rust
use miyabi_worktree::WorktreeManager;

let manager = WorktreeManager::new(config);
let worktree = manager.create_worktree(issue_number).await?;
// Agent実行
manager.merge_worktree(worktree).await?;
manager.remove_worktree(worktree).await?;
```

## 📋 Agent状態管理

**Agent状態遷移**:
```
idle → executing → completed / failed
```

**統計情報**:
- Worktree統計: active, idle, completed, failed
- Agent統計: byAgent, byStatus

## ⚠️ トラブルシューティング

### Worktreeが残った場合
```bash
# すべてのWorktreeを確認
git worktree list

# 不要なWorktreeを削除
git worktree remove .worktrees/issue-270

# すべてのstaleなWorktreeをクリーンアップ
git worktree prune
```

### 並列実行数の調整
```bash
# 低スペックマシン: concurrency=1
miyabi agent run coordinator --issues 270 --concurrency 1

# 高スペックマシン: concurrency=5
miyabi agent run coordinator --issues 270,271,272,273,274 --concurrency 5
```

## 🎯 メリット

1. **並列実行の真の実現** - 各IssueがWorktreeで独立
2. **コンフリクトの最小化** - 独立したディレクトリ
3. **簡単なロールバック** - Worktree単位で破棄可能
4. **デバッグが容易** - 各Worktreeで独立したログ
5. **スケーラビリティ** - Worktree数に制限なし

## 🔗 Related Modules

- **Agents**: [agents.md](./agents.md) - Agent並列実行ルール
- **Architecture**: [architecture.md](./architecture.md) - Worktree並列実行アーキテクチャ

## 📖 Detailed Documentation

- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md` (完全仕様)
- **Rust Implementation**: `crates/miyabi-worktree/src/lib.rs`
- **WorktreeManager**: `packages/coding-agents/worktree/worktree-manager.ts` (TypeScript - レガシー)
