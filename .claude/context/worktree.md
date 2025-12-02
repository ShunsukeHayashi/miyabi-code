# AntiGravity Git Worktree Guide

## 🌳 Worktree Overview

Git Worktreeは、単一リポジトリから複数の作業ディレクトリを作成する機能です。
並列開発やエージェント分離に最適です。

---

## 📂 Worktree Structure

```
AntiGravity/                    # メインワークツリー (main/develop)
├── .worktrees/
│   ├── feature-dashboard/      # ダッシュボード開発
│   ├── feature-mcp/            # MCP統合開発
│   ├── hotfix-urgent/          # 緊急修正用
│   └── agent-codegen/          # CodeGenエージェント専用
```

---

## 🛠️ Worktree Commands

### 作成
```bash
# 新規ブランチ + ワークツリー作成
git worktree add .worktrees/feature-XXX -b feature/issue-XXX

# 既存ブランチからワークツリー作成
git worktree add .worktrees/hotfix-YYY hotfix/issue-YYY
```

### 一覧
```bash
# ワークツリー一覧
git worktree list

# MCP経由
miyabi-git-inspector:git_worktree_list()
```

### 削除
```bash
# ワークツリー削除
git worktree remove .worktrees/feature-XXX

# 強制削除
git worktree remove --force .worktrees/feature-XXX

# 削除後のクリーンアップ
git worktree prune
```

---

## 🤖 Agent-Worktree Mapping

各エージェントに専用のワークツリーを割り当てることで、並列作業が可能になります。

| Agent | Worktree | Branch Pattern |
|-------|----------|----------------|
| CodeGen | .worktrees/codegen | feature/* |
| Review | (main worktree) | - |
| Hotfix | .worktrees/hotfix | hotfix/* |
| Refactor | .worktrees/refactor | refactor/* |

---

## ⚠️ Best Practices

### DO ✅
- 長期作業には専用ワークツリー作成
- 完了後は速やかに削除
- ブランチ名を明確に

### DON'T ❌
- 同じブランチを複数ワークツリーで使用
- 未マージのまま長期放置
- mainブランチでのワークツリー作成

---

## 🔄 Workflow Example

```bash
# 1. Issue開始
git worktree add .worktrees/feature-123 -b feature/issue-123

# 2. 作業ディレクトリへ移動
cd .worktrees/feature-123

# 3. 開発作業
# ... coding ...

# 4. コミット & プッシュ
git add .
git commit -m "feat(dashboard): implement agent panel"
git push -u origin feature/issue-123

# 5. PR作成 (MCP経由)
# miyabi-github:github_create_pr(...)

# 6. マージ後、ワークツリー削除
cd ../..
git worktree remove .worktrees/feature-123
git branch -d feature/issue-123
```

---

## 🔧 Troubleshooting

### ロックされたワークツリー
```bash
# ロックファイル削除
rm -rf .git/worktrees/feature-XXX/locked
git worktree prune
```

### 不整合な状態
```bash
# 強制リフレッシュ
git worktree repair
git worktree prune
```
