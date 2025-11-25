# Miyabi DevOPS 優先順位 → Agent/Skill マッピング

**判断の余地なし。このマッピングに従って実行。**

---

## 完全自動化ワークフロー

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. miyabi-priority-check 実行                                   │
│    ↓                                                            │
│ 2. 返されたSTEP番号を確認                                        │
│    ↓                                                            │
│ 3. 下記マッピング表から対応するRust CLI/Agent/Skillを選択        │
│    ↓                                                            │
│ 4. 指定されたコマンドを実行                                      │
│    ↓                                                            │
│ 5. 完了したら 1. に戻る                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rust CLI ツール一覧

| バイナリ | 用途 | 主要コマンド |
|----------|------|-------------|
| `miyabi` | メインCLI | `agent`, `work-on`, `worktree`, `infinity` |
| `miyabi-mcp-server` | MCP統合 | A2A Bridge経由でAgent実行 |
| `miyabi-tui` | TUI監視 | リアルタイムモニタリング |
| `miyabi-web-api` | Web API | REST/WebSocket |

### miyabi CLI 主要サブコマンド

```bash
# Agent実行 (高速Rustコンパイル済み)
miyabi agent run <agent_name> --issue <number>

# Issue作業開始 (Coordinator経由)
miyabi work-on <issue_number>

# Worktree管理
miyabi worktree list
miyabi worktree prune

# 無限ループモード (全Issue自動処理)
miyabi infinity --priority critical

# 並列実行
miyabi parallel --agents CodeGenAgent,ReviewAgent --issues 123,124,125
```

---

## STEP別 Agent/Skill マッピング

### STEP 1: 承認済みPRマージ

| 項目 | 内容 |
|------|------|
| **Exit Code** | `1` |
| **使用Agent** | `PRAgent` |
| **使用Skill** | `git-workflow` |
| **Slash Command** | なし（直接実行） |

#### 実行手順

```bash
# 方法1: 直接コマンド
gh pr list --state open --search "review:approved" --json number --jq '.[].number' | while read pr; do
    gh pr merge $pr --merge
done
git checkout main && git pull origin main

# 方法2: Skill使用
/skill git-workflow
# → "Merge approved PRs" を選択
```

#### Claude Code Sub-agent呼び出し

```
Task tool:
  subagent_type: "PRAgent"
  prompt: "承認済みのPRをすべてマージしてください"
```

---

### STEP 2: CIエラー修正

| 項目 | 内容 |
|------|------|
| **Exit Code** | `2` |
| **使用Agent** | `ReviewAgent` + `CodeGenAgent` |
| **使用Skill** | `debugging-troubleshooting` |
| **Slash Command** | `/verify` |

#### 実行手順

```bash
# 1. エラー確認
gh run list --status failure
gh run view <run_id> --log

# 2. Skill使用
/skill debugging-troubleshooting

# 3. または Slash Command
/verify
```

#### Claude Code Sub-agent呼び出し

```
Task tool:
  subagent_type: "ReviewAgent"
  prompt: "CI失敗の原因を特定し、修正案を提示してください"

# 修正実装
Task tool:
  subagent_type: "CodeGenAgent"
  prompt: "CIエラーを修正するコードを生成してください"
```

---

### STEP 3: P0 (Critical) Issue対応

| 項目 | 内容 |
|------|------|
| **Exit Code** | `3` |
| **使用Agent** | `IssueAgent` → `CodeGenAgent` → `PRAgent` |
| **使用Skill** | `issue-analysis` → `rust-development` |
| **Slash Command** | `/agent-run` |

#### 実行手順

```bash
# 1. Issue確認
issue=$(gh issue list --state open --label "priority/critical" --json number --jq '.[0].number')
gh issue view $issue

# 2. Worktree作成
git worktree add .worktrees/issue-$issue -b worktree/issue-$issue
cd .worktrees/issue-$issue

# 3. Agent実行
/agent-run $issue

# または Skill使用
/skill issue-analysis
/skill rust-development
```

#### Claude Code Sub-agent呼び出し（完全自動）

```
# Issue分析
Task tool:
  subagent_type: "IssueAgent"
  prompt: "Issue #<number>を分析し、実装計画を作成してください"

# コード生成
Task tool:
  subagent_type: "CodeGenAgent"
  prompt: "Issue #<number>の修正コードを生成してください"

# PR作成
Task tool:
  subagent_type: "PRAgent"
  prompt: "Issue #<number>の修正PRを作成してください"
```

---

### STEP 4: レビュー待ちPRのレビュー

| 項目 | 内容 |
|------|------|
| **Exit Code** | `4` |
| **使用Agent** | `ReviewAgent` |
| **使用Skill** | `security-audit` (セキュリティ観点) |
| **Slash Command** | なし |

#### 実行手順

```bash
# 1. PR一覧確認
gh pr list --state open --search "review:required"

# 2. PRレビュー実行
gh pr view <pr_number>
gh pr diff <pr_number>

# 3. レビューコメントまたは承認
gh pr review <pr_number> --approve
# または
gh pr review <pr_number> --comment --body "..."
```

#### Claude Code Sub-agent呼び出し

```
Task tool:
  subagent_type: "ReviewAgent"
  prompt: "PR #<number>をレビューし、問題点や改善提案を報告してください"
```

---

### STEP 5: P1 (High) Issue対応

| 項目 | 内容 |
|------|------|
| **Exit Code** | `5` |
| **使用Agent** | `IssueAgent` → `CodeGenAgent` → `PRAgent` |
| **使用Skill** | `issue-analysis` → `rust-development` |
| **Slash Command** | `/agent-run` または `/create-issue` |

#### 実行手順

STEP 3と同じフローを適用。

```bash
issue=$(gh issue list --state open --label "priority/high" --json number --jq '.[0].number')
/agent-run $issue
```

---

### STEP 6: P2 (Medium) Issue対応

| 項目 | 内容 |
|------|------|
| **Exit Code** | `6` |
| **使用Agent** | `IssueAgent` → `CodeGenAgent` → `PRAgent` |
| **使用Skill** | `issue-analysis` → 該当スキル |
| **Slash Command** | `/agent-run` |

#### 実行手順

```bash
issue=$(gh issue list --state open --label "priority/medium" --json number --jq '.[0].number')
/agent-run $issue
```

---

### STEP 7: P3 (Low) Issue対応

| 項目 | 内容 |
|------|------|
| **Exit Code** | `7` |
| **使用Agent** | `IssueAgent` → `CodeGenAgent` → `PRAgent` |
| **使用Skill** | 該当スキル |
| **Slash Command** | `/agent-run` |

#### 実行手順

```bash
issue=$(gh issue list --state open --label "priority/low" --json number --jq '.[0].number')
/agent-run $issue
```

---

### STEP 8: 技術的負債解消

| 項目 | 内容 |
|------|------|
| **Exit Code** | `0` |
| **使用Agent** | 任意 |
| **使用Skill** | `performance-analysis`, `security-audit`, `documentation-generation` |
| **Slash Command** | `/miyabi-todos`, `/security-scan` |

#### 推奨タスク

1. **パフォーマンス最適化**: `/skill performance-analysis`
2. **セキュリティスキャン**: `/security-scan`
3. **ドキュメント生成**: `/generate-docs`
4. **TODO整理**: `/miyabi-todos`
5. **依存関係更新**: `/skill dependency-management`

---

## Issue種別 → Agent/Skill マッピング

### バグ修正 (bug)

```
IssueAgent (分析) → ReviewAgent (原因特定) → CodeGenAgent (修正) → PRAgent (PR作成)
Skill: debugging-troubleshooting → rust-development
```

### 新機能 (feature)

```
IssueAgent (要件分析) → CodeGenAgent (実装) → ReviewAgent (レビュー) → PRAgent (PR作成)
Skill: issue-analysis → rust-development
```

### ドキュメント (docs)

```
IssueAgent (範囲確認) → CodeGenAgent (執筆)
Skill: documentation-generation
```

### リファクタリング (refactor)

```
ReviewAgent (現状分析) → CodeGenAgent (リファクタ) → ReviewAgent (確認)
Skill: performance-analysis → rust-development
```

### CI/CD (ci)

```
ReviewAgent (パイプライン分析) → DeploymentAgent (修正)
Skill: agent-execution
```

---

## ラベル → Priority マッピング

| ラベル | Priority | STEP |
|--------|----------|------|
| `priority/critical` | P0 | 3 |
| `priority/high` | P1 | 5 |
| `priority/medium` | P2 | 6 |
| `priority/low` | P3 | 7 |

---

## 完全自動実行スクリプト

以下のスクリプトで、優先順位チェックから適切なAgentの起動まで完全自動化：

```bash
#!/bin/bash
# miyabi-auto-execute.sh
# 優先タスクを自動実行

set -e

# 優先順位チェック
result=$(/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/scripts/miyabi-priority-check.sh --json)
step=$(echo "$result" | jq -r '.current_step')
action=$(echo "$result" | jq -r '.action_required')

case $step in
    1)
        echo "🔄 承認済みPRをマージ中..."
        gh pr list --state open --search "review:approved" --json number --jq '.[].number' | while read pr; do
            gh pr merge $pr --merge
        done
        git checkout main && git pull
        ;;
    2)
        echo "🔧 CIエラー修正が必要です"
        echo "→ /skill debugging-troubleshooting を実行してください"
        ;;
    3|5|6|7)
        echo "📋 Issue対応が必要です"
        label=$([ $step -eq 3 ] && echo "priority/critical" || ([ $step -eq 5 ] && echo "priority/high" || ([ $step -eq 6 ] && echo "priority/medium" || echo "priority/low")))
        issue=$(gh issue list --state open --label "$label" --json number --jq '.[0].number')
        echo "→ /agent-run $issue を実行してください"
        ;;
    4)
        echo "👀 PRレビューが必要です"
        gh pr list --state open --search "review:required"
        ;;
    8)
        echo "✅ 全優先タスク完了！"
        echo "→ 技術的負債解消または新機能開発に取り組めます"
        ;;
esac
```

---

## Claude Code での使用例

### 例1: セッション開始時

```
User: 開発を始めたい
Claude: [hooks.jsonにより自動でmiyabi-priority-check実行]

出力例:
🔴 STEP 1: 承認済みPRマージ (2件)
→ PRAgentを使用してマージします

Task tool:
  subagent_type: "PRAgent"
  prompt: "承認済みPR #123, #124 をマージしてください"
```

### 例2: Issue対応

```
User: 次のタスクをやりたい
Claude: [miyabi-priority-check実行]

出力例:
🔴 STEP 3: P0 Critical Issue (1件)
- Issue #456: 認証エラー

→ IssueAgent → CodeGenAgent → PRAgent の順で対応します

Task tool:
  subagent_type: "IssueAgent"
  prompt: "Issue #456を分析し、実装計画を作成してください"
```

---

## 禁止事項

1. **優先順位のスキップ禁止**
   - STEP 1が残っているのにSTEP 3に進むことは禁止
   - hooks.jsonで自動ブロック

2. **手動判断禁止**
   - 「これは後でいい」という判断は禁止
   - miyabi-priority-checkの結果に従う

3. **Agent/Skill選択の恣意性禁止**
   - このマッピング表に従ったAgent/Skillを使用
   - 別のAgentを使用したい場合は、まず優先タスクを完了

---

## まとめ

```
1. miyabi-priority-check を実行
2. 出力されたSTEP番号を確認
3. この表から対応するAgent/Skillを選択
4. 指定されたコマンドを実行
5. 完了したら 1. に戻る

これを繰り返すだけ。判断は不要。
```

**これがMiyabi DevOPSの完全自動化ワークフローである。**
