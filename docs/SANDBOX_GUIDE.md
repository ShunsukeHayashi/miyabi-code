# 🏖️ Miyabi Sandbox & Worktree ガイド

## 概要

エージェント（Codex/Claude Code）の作業環境を分離し、ファイル競合を防止するためのサンドボックスシステム。

## 🎯 設計思想

```
┌─────────────────────────────────────────────────────────┐
│                    Main Repository                       │
│                 /home/ubuntu/miyabi-private              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Worktree 1  │   │   Worktree 2  │   │   Worktree 3  │
│  codex-001    │   │  kaede-agent  │   │  sakura-agent │
│  Issue #123   │   │  Issue #456   │   │  Issue #789   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        ↓                   ↓                   ↓
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Sandbox 1    │   │  Sandbox 2    │   │  Sandbox 3    │
│  Metadata     │   │  Metadata     │   │  Metadata     │
│  Temp Files   │   │  Temp Files   │   │  Temp Files   │
└───────────────┘   └───────────────┘   └───────────────┘
```

## 📁 ディレクトリ構造

```
/home/ubuntu/
├── miyabi-private/          # メインリポジトリ
├── sandboxes/               # サンドボックスメタデータ
│   ├── codex-001/
│   │   └── metadata.json
│   ├── kaede-agent/
│   │   └── metadata.json
│   └── ...
└── worktrees/               # Git Worktrees
    ├── codex-001/
    │   └── sandbox-codex-001-123/
    ├── kaede-agent/
    │   └── sandbox-kaede-agent-456/
    └── ...
```

## 🚀 使い方

### サンドボックス作成

```bash
# 基本的な作成
./scripts/agent-sandbox.sh create <agent-name> [issue-number]

# 例: codex-worker-1 用のサンドボックス（Issue #123）
./scripts/agent-sandbox.sh create codex-worker-1 123

# 例: カエデエージェント用
./scripts/agent-sandbox.sh create kaede-agent 456
```

### サンドボックス一覧

```bash
./scripts/agent-sandbox.sh list
```

出力例:
```
📦 Active Sandboxes:

  🤖 codex-worker-1
     Branch: sandbox/codex-worker-1-123
     Created: 2025-11-29T12:00:00+00:00
     Status: ✅ Active

  🤖 kaede-agent
     Branch: sandbox/kaede-agent-456
     Created: 2025-11-29T11:30:00+00:00
     Status: ✅ Active

📂 Git Worktrees:
/home/ubuntu/worktrees/codex-worker-1/sandbox-codex-worker-1-123
/home/ubuntu/worktrees/kaede-agent/sandbox-kaede-agent-456
```

### サンドボックス削除

```bash
# 特定のサンドボックスを削除
./scripts/agent-sandbox.sh destroy <agent-name>

# 例
./scripts/agent-sandbox.sh destroy codex-worker-1
```

### 古いサンドボックスのクリーンアップ

```bash
# 24時間以上前のサンドボックスを削除（デフォルト）
./scripts/agent-sandbox.sh cleanup

# 12時間以上前のサンドボックスを削除
./scripts/agent-sandbox.sh cleanup 12
```

## 🤖 エージェント統合

### Codex/Claude Code起動時

エージェント起動スクリプトに組み込み:

```bash
#!/bin/bash
# start-agent.sh

AGENT_NAME="$1"
ISSUE_NUM="$2"

# 1. サンドボックス作成
./scripts/agent-sandbox.sh create "${AGENT_NAME}" "${ISSUE_NUM}"

# 2. Worktreeパスを取得
WORKTREE_PATH=$(jq -r '.worktree_path' "/home/ubuntu/sandboxes/${AGENT_NAME}/metadata.json")

# 3. Worktree内でClaude Code起動
cd "${WORKTREE_PATH}"
claude
```

### 自動クリーンアップ (cron)

```bash
# /etc/cron.d/miyabi-sandbox-cleanup
0 */6 * * * ubuntu /home/ubuntu/miyabi-private/scripts/agent-sandbox.sh cleanup 24
```

## 📋 メタデータ形式

`/home/ubuntu/sandboxes/<agent-name>/metadata.json`:

```json
{
    "agent_name": "codex-worker-1",
    "issue_number": "123",
    "branch_name": "sandbox/codex-worker-1-123",
    "worktree_path": "/home/ubuntu/worktrees/codex-worker-1/sandbox-codex-worker-1-123",
    "sandbox_path": "/home/ubuntu/sandboxes/codex-worker-1",
    "created_at": "2025-11-29T12:00:00+00:00",
    "status": "active"
}
```

## ⚠️ 注意事項

1. **ファイル競合防止**: 各エージェントは独立したWorktreeで作業するため、同じファイルを同時に編集しても競合しません

2. **ブランチ命名規則**: `sandbox/<agent-name>-<issue-number>` の形式

3. **クリーンアップ**: 24時間以上放置されたサンドボックスは自動削除の対象です

4. **マージ**: 作業完了後は通常のPRフローでmainにマージしてください

## 🔧 トラブルシューティング

### Worktreeが作成できない

```bash
# 既存のWorktreeを確認
git worktree list

# 壊れたWorktreeを強制削除
git worktree remove --force /path/to/worktree
git worktree prune
```

### サンドボックスが残っている

```bash
# 強制クリーンアップ
./scripts/agent-sandbox.sh cleanup 0
```

## 📊 miyabi-auth との統合

`crates/miyabi-auth/src/sandbox.rs` で提供されるRust API:

```rust
use miyabi_auth::sandbox;

// サンドボックス作成
let sandbox = sandbox::create_sandbox(user_id, project_id).await?;

// Worktree作成
let worktree_path = sandbox::create_worktree(
    repo_path,
    branch_name,
    &mut sandbox
).await?;

// 作業ディレクトリ取得
let work_dir = sandbox.working_dir();

// クリーンアップ
sandbox::cleanup_old_sandboxes(base_path, 24).await?;
```
