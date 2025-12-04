# TODO Issues - Implementation Required

このファイルは、コードベース内の未実装TODOを追跡するためのものです。
各TODOはGitHub Issueとして作成する必要があります。

## Critical TODOs (要即時対応)

### TODO-001: JSON-RPC Communication Implementation
- **File**: `crates/miyabi-mcp-server/src/registry.rs:365`
- **Code**: `// TODO: Implement actual JSON-RPC communication`
- **Priority**: P0 - Critical
- **Description**: エージェント間のJSON-RPC通信が未実装。現在はモック状態。
- **Impact**: A2Aブリッジが正常に動作しない
- **Assignee**: TBD
- **Labels**: `bug`, `priority:critical`, `area:mcp`

### TODO-002: Production JSON-RPC Call
- **File**: `crates/miyabi-mcp-server/src/service.rs:449`
- **Code**: `// TODO: In production, this would make an actual JSON-RPC call`
- **Priority**: P0 - Critical
- **Description**: 本番環境でのJSON-RPC呼び出しが未実装
- **Impact**: 本番デプロイ時にエージェント間通信が失敗
- **Assignee**: TBD
- **Labels**: `bug`, `priority:critical`, `area:mcp`

### TODO-003: IssueAgent A2AEnabled Trait
- **File**: `crates/miyabi-mcp-server/src/agent_init.rs:93`
- **Code**: `// IssueAgent - TODO: Implement A2AEnabled trait`
- **Priority**: P1 - High
- **Description**: IssueAgentがA2AEnabledトレイトを実装していない
- **Impact**: IssueAgentがA2Aネットワークに参加できない
- **Assignee**: TBD
- **Labels**: `enhancement`, `priority:high`, `area:agents`

---

## Issue作成テンプレート

### Title Format
```
[TODO] {Brief description}
```

### Body Template
```markdown
## 概要
{Description from above}

## 現在の状態
- ファイル: `{file_path}`
- 行番号: {line_number}
- コード: 
```rust
{surrounding_code}
```

## 期待される動作
{What should happen after implementation}

## 技術的アプローチ
{Suggested implementation approach}

## 影響範囲
- {Impact 1}
- {Impact 2}

## 関連Issue
- #{related_issue_number}
```

---

## 自動Issue作成コマンド

```bash
# GitHub CLIがインストールされている場合
gh issue create \
  --title "[TODO] Implement JSON-RPC communication in registry" \
  --body "$(cat .claude/TODO_ISSUES.md)" \
  --label "bug,priority:critical,area:mcp"
```

---

## 進捗トラッキング

| TODO ID | Issue # | Status | Assigned | Due Date |
|---------|---------|--------|----------|----------|
| TODO-001 | TBD | 🔴 Open | - | - |
| TODO-002 | TBD | 🔴 Open | - | - |
| TODO-003 | TBD | 🔴 Open | - | - |

---

Last Updated: 2025-12-03
