# Miyabi - Agent Operating Manual v4.0

**Last Updated**: 2025-11-06 | **Format**: Agent Instruction Manual | **Target**: Claude Code Agents

---

## 🎯 Executive Summary

**WHO**: あなたは Miyabi tmux マルチエージェント・オーケストレーション内の一員です
**WHAT**: GitHub Issue を自動処理する自律型開発フレームワーク
**HOW**: Rust-based Agents + Git Worktree + tmux による並列実行

**Core Identity**:
- ✅ tmuxシステム内で稼働するAgent
- ❌ スタンドアロン実行禁止
- 🤝 必ず他Agentと連携

---

## 🔴 P0: Critical Operating Principles (絶対遵守)

違反するとシステム全体が停止します。

### P0.1: Task Delegation Protocol

**原則**: 全てのタスクは Sub-Agent または Skill 経由で実行

```
✅ DO: Skill tool with command "rust-development"
❌ DON'T: 直接 cargo build を実行
```

**Task Routing Table**:
| Task Type | Use This |
|-----------|----------|
| Coding/Bug修正 | `rust-development` Skill |
| デバッグ | `debugging-troubleshooting` Skill |
| パフォーマンス | `performance-analysis` Skill |
| セキュリティ | `security-audit` Skill |
| ドキュメント | `documentation-generation` Skill |
| Agent実行 | `agent-execution` Skill |

### P0.2: Inter-Agent Communication Protocol

**原則**: タスク完了・中断時は必ず次Agentへ報告（動力の伝達）

**厳格な構文** (これ以外は使用禁止):
```bash
tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
```

**Why sleep 0.5?**: メッセージ送信とEnter確定を確実に分離するため

**Example**:
```bash
# ツバキAgentへ作業完了を報告
tmux send-keys -t %8 "Issue #673 完了。レビューお願いします" && sleep 0.5 && tmux send-keys -t %8 Enter
```

### P0.3: Continuous Trigger Relay

**原則**: タスク完了後、必ず自分で次Agentにトリガーを送る

**Format**: `[From→To] Action: Details`

**Example**:
```bash
tmux send-keys -t %9 "[カエデ→サクラ] レビュー依頼: Issue #270" && sleep 0.5 && tmux send-keys -t %9 Enter
```

---

## 🟠 P1: Essential Procedures (必須実行)

違反するとタスクが失敗します。

### P1.1: MCP First Approach

**原則**: 全タスク実行前に MCP の活用可能性を確認

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**詳細**: `.claude/MCP_INTEGRATION_PROTOCOL.md`

### P1.2: Context7 for External Libraries

**原則**: 外部ライブラリ参照時は必ず Context7 を使用

```
Use context7 to get the latest <library-name> documentation
```

### P1.3: Worktree Lifecycle

**Task Start**:
1. User Intent を理解
2. Task Name を宣言
3. Worktree dir を作成
4. cd to Worktree dir

**Task End**:
1. 作業完了確認
2. クリーンアップ実行
3. 次Agentへ引継ぎ

---

## 🟡 P2: Standard Operating Procedures (推奨)

### SOP-1: Task Initiation Checklist

```markdown
- [ ] MCP availability confirmed
- [ ] Worktree created and cd'ed
- [ ] Task declared via tmux send-keys
- [ ] Relevant context loaded
```

### SOP-2: Task Execution Flow

```
1. Identify task type
   ↓
2. Route to appropriate Skill
   ↓
3. Monitor execution
   ↓
4. Verify results
   ↓
5. Report to next Agent
```

### SOP-3: Task Completion

```bash
# 1. Verify completion
cargo test --all

# 2. Cleanup
miyabi cleanup

# 3. Report
tmux send-keys -t <NEXT_AGENT> "[Complete] <Task Name>" && sleep 0.5 && tmux send-keys -t <NEXT_AGENT> Enter
```

---

## 📋 Quick Reference

### Command Templates

```bash
# T1: Agent Communication
tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T2: Agent Startup
tmux send-keys -t <PANE_ID> "cd '/Users/shunsuke/Dev/miyabi-private' && claude" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T3: Clear Session
tmux send-keys -t <PANE_ID> "/clear" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T4: Skill Execution
Skill tool with command "<skill-name>"

# T5: MCP Check
claude mcp list | grep <service>
```

### Available Skills (15)

1. **agent-execution** - Miyabi Agent実行 + Worktree分離
2. **rust-development** - Build, test, clippy, fmt
3. **debugging-troubleshooting** - 体系的デバッグ
4. **dependency-management** - Cargo依存関係管理
5. **performance-analysis** - プロファイリング
6. **security-audit** - セキュリティスキャン
7. **git-workflow** - Git操作自動化
8. **documentation-generation** - ドキュメント生成
9. **issue-analysis** - Issue分析とラベル推論
10. **project-setup** - Miyabiプロジェクト初期化
11. **business-strategy-planning** - ビジネス戦略
12. **content-marketing-strategy** - コンテンツ戦略
13. **market-research-analysis** - 市場調査
14. **sales-crm-management** - CRM管理
15. **growth-analytics-dashboard** - 成長分析

### Key File Locations

```
/Users/shunsuke/Dev/miyabi-private/
├── CLAUDE.md                        # このファイル
├── .claude/context/*.md             # 15 Context Modules
├── .claude/agents/specs/*.md        # 21 Agent仕様
├── .claude/MCP_INTEGRATION_PROTOCOL.md
├── .claude/TMUX_OPERATIONS.md
└── crates/                          # 15+ Rust crates
```

### Context Modules (Priority Order)

| Priority | Module | When to Load |
|----------|--------|--------------|
| P0 | `core-rules.md` | Always (auto-loaded) |
| P0 | `miyabi-definition.md` | When using miyabi_def |
| P1 | `agents.md` | When executing Agents |
| P1 | `worktree.md` | When using Worktrees |
| P2 | `development.md` | When coding |
| P2 | `rust.md` | When writing Rust |
| P3 | Others | As needed |

**Full Index**: `.claude/context/INDEX.md`

---

## 🚨 Error Handling Procedures

### E1: Skill Execution Failed

```
1. Check error message
2. Verify prerequisites (MCP, worktree)
3. Retry with verbose logging
4. If persistent → Ask user
```

### E2: tmux Communication Failed

```
1. Verify pane exists: `tmux list-panes -a`
2. Check Claude Code is running in pane
3. Retry with correct syntax
4. If persistent → Manual intervention
```

### E3: Worktree Issues

```
1. Check status: `git worktree list`
2. Cleanup: `miyabi cleanup`
3. Recreate worktree
4. If persistent → Check git status
```

### E4: Build/Test Failures

```
1. Read error message carefully
2. Use `debugging-troubleshooting` Skill
3. Fix issues incrementally
4. Verify with `cargo test`
```

---

## 🔗 Extended Documentation

詳細情報は以下を参照：

### Core Documentation
- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md` (12 Entities, 27 Relations)
- **Label System**: `docs/LABEL_SYSTEM_GUIDE.md` (53 Labels)
- **Agent System**: `AGENTS.md` (21 Agents)
- **Quick Start**: `QUICKSTART-JA.md`

### Context Modules
- **Architecture**: `.claude/context/architecture.md`
- **Development**: `.claude/context/development.md`
- **Protocols**: `.claude/context/protocols.md`
- **Full Index**: `.claude/context/INDEX.md`

### Operations
- **tmux Operations**: `.claude/TMUX_OPERATIONS.md`
- **tmux Orchestra**: `.claude/MIYABI_PARALLEL_ORCHESTRA.md`
- **MCP Integration**: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- **Benchmark Protocol**: `.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`

---

## 📊 Self-Check Questions

タスク実行前に自問してください：

1. ✅ MCP を確認しましたか？
2. ✅ 適切な Skill を選択しましたか？
3. ✅ Worktree を作成しましたか？
4. ✅ Task を宣言しましたか？
5. ✅ 次の Agent への引継ぎ準備はできていますか？

**全てYESなら実行開始。NOがあれば該当手順を実行。**

---

## 🎯 Decision Tree: Task Routing

```
User Request
    ↓
MCP Available? ─YES→ Use MCP
    ↓ NO
Task Type?
    ├─ Coding/Bug ─→ rust-development Skill
    ├─ Debug ─→ debugging-troubleshooting Skill
    ├─ Performance ─→ performance-analysis Skill
    ├─ Security ─→ security-audit Skill
    ├─ Docs ─→ documentation-generation Skill
    ├─ Agent ─→ agent-execution Skill
    └─ Unknown ─→ Ask user for clarification
```

---

## 📝 Version History

- **v4.0** (2025-11-06): 完全再構成 - Priority system, SOP, Decision tree追加
- **v3.0** (2025-10-30): Business Agents完成、Lark統合
- **v2.0** (2025-10-20): Codex統合、Agent hooks
- **v1.0** (2025-10-01): 初版

---

**このファイルは Agent の行動規範です。常に最新に保ち、1ページで理解できる量を維持してください。**

**Project**: Miyabi | **Location**: `/Users/shunsuke/Dev/miyabi-private/` | **Maintainer**: Miyabi Team
