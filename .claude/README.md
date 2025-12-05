# Miyabi Claude Code Integration

Claude Code 2.0.59+ の `--agent` フラグとスキル発動システムを活用したMiyabiエージェント統合。

## 🚀 Quick Start

```bash
# 単一エージェント実行
claude --agent codegen "Issue #42を実装して"
claude --agent review "PR #15をレビューして"
claude --agent coordinator "今日のタスクを整理して"

# E2Eテスト実行
./scripts/agent-e2e-test.sh
```

## 🎭 Agent Directory

### リーダーエージェント 🔴

| Agent | キャラクター | Description | Command |
|-------|-------------|-------------|---------|
| `coordinator` | しきるん | タスク分解・マルチエージェント統括 | `claude --agent coordinator` |
| `ai_entrepreneur` | あきんどさん | ビジネス戦略・エージェント社会統括 | `claude --agent ai_entrepreneur` |

### 実行エージェント 🟢🟡

| Agent | キャラクター | Description | Command |
|-------|-------------|-------------|---------|
| `codegen` | つくるん | コード生成・実装 | `claude --agent codegen` |
| `review` | めだまん | コードレビュー・品質保証 | `claude --agent review` |
| `issue` | みつけるん | Issue分析・トリアージ | `claude --agent issue` |
| `pr` | まとめるん | PR作成・マージ管理 | `claude --agent pr` |
| `deploy` | はこぶん | デプロイ・リリース管理 | `claude --agent deploy` |

## 🔧 Tool Activation Matrix

各エージェントは特定のトリガーワードで自動的にツールを発動します：

### CodeGen (つくるん)
| Trigger | Tool | Priority |
|---------|------|----------|
| `issue #N` / `実装` | `Miyabi:get_issue` | 🔴 Critical |
| `search` / `探す` | `Miyabi:search_code` | 🔴 Critical |
| `build` / `compile` | `Miyabi:cargo_build` | 🟢 Medium |
| `test` / `テスト` | `Miyabi:cargo_test` | 🟢 Medium |

### Review (めだまん)
| Trigger | Tool | Priority |
|---------|------|----------|
| `pr #N` / `review` | `Miyabi:get_pr` | 🔴 Critical |
| `diff` / `changes` | `Miyabi:git_diff` | 🔴 Critical |
| `lint` / `quality` | `Miyabi:cargo_clippy` | 🟢 Medium |

### Coordinator (しきるん)
| Trigger | Tool | Priority |
|---------|------|----------|
| `parallel` / `並列` | `Miyabi:execute_agents_parallel` | 🔴 Critical |
| `status` / `状態` | `Miyabi:get_agent_status` | 🔴 Critical |
| `send` / `通信` | `Miyabi:tmux_send_keys` | 🟢 Medium |

## 📂 Directory Structure

```
.claude/
├── README.md                 # このファイル
├── settings.json             # Claude Code統合設定
├── settings/
│   └── agents.json          # エージェント定義詳細
├── agents/
│   ├── codegen.md           # CodeGenエージェント (つくるん)
│   ├── review.md            # Reviewエージェント (めだまん)
│   ├── coordinator.md       # Coordinatorエージェント (しきるん)
│   ├── issue.md             # Issueエージェント (みつけるん)
│   ├── pr.md                # PRエージェント (まとめるん)
│   ├── deploy.md            # Deployエージェント (はこぶん)
│   └── ai_entrepreneur.md   # AIアントレプレナー (あきんどさん)
└── ...
```

## 🔀 Skill Activation System

スキルは特定のキーワードパターンで自動発動します：

```yaml
rust_development:
  triggers: ["cargo", "rust", ".rs", "crate"]
  tools: [cargo_build, cargo_test, cargo_clippy]

git_operations:
  triggers: ["commit", "push", "branch", "merge"]
  tools: [git_status, git_commit, git_push]

github_management:
  triggers: ["issue", "pr", "pull request"]
  tools: [get_issue, list_issues, create_pr]

multi_agent:
  triggers: ["parallel", "orchestrate", "agents"]
  tools: [execute_agents_parallel, get_agent_status]
```

## 🧪 Testing

```bash
# 全エージェントテスト
./scripts/agent-e2e-test.sh

# 個別テスト
claude --agent codegen -p "crates数を確認" --print
claude --agent review -p "最新コミットをレビュー" --print
```

## 🔄 tmux Integration

```bash
# マルチエージェント並列実行
./scripts/multi-agent.sh codegen review deploy

# Issue自動処理ワークフロー
./scripts/issue-workflow.sh 42
```

## 📊 Tool Permission Levels

### Always Allow (自動承認)
- `read_file`, `list_files`, `search_code`
- `git_status`, `git_log`, `git_diff`
- `get_issue`, `list_issues`, `get_pr`, `list_prs`
- `get_agent_status`, `system_resources`

### Require Approval (確認必要)
- `write_file`, `git_commit`, `git_push`
- `create_pr`, `merge_pr`, `update_issue`
- `execute_agent`, `execute_agents_parallel`

## 🎯 Best Practices

1. **Issue実装時**: 必ず `Miyabi:get_issue` で要件を確認してから実装
2. **コードレビュー時**: `Miyabi:cargo_clippy` を先に実行して自動検出
3. **デプロイ時**: 必ず `Miyabi:cargo_test` が全てパスしていることを確認
4. **マルチエージェント**: `coordinator` を使って並列実行を最適化
