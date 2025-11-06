# Miyabi - Codex Operating Manual v4.0

**Last Updated**: 2025-11-06 | **Format**: Codex Instruction Manual | **Target**: Codex Agents (Gemini/Claude/etc.)

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

### P0.1: Operational Environment Protocol

**原則: tmux マルチエージェント・オーケストレーション・システム内での活動**

私（Gemini/Claude/Codex Agent）は、スタンドアロンのAIアシスタントではありません。Miyabiプロジェクトが規定する**tmuxマルチエージェント・オーケストレーション・システム内で稼働する一員**として、その役割を認識し、行動します。

-   ✅ **全ての活動はシステム内で行う:** 私の思考、タスクの実行、コミュニケーションは、全てこのtmuxシステム内での連携を前提とします。
-   ❌ **スタンドアロンでの実行禁止:** システムから独立した、あるいは単独でのタスクの計画・実行は固く禁止されています。
-   🤝 **連携の義務:** 全ての行動は、他のエージェント（他のtmuxペイン）との連携を必須とします。動力の伝達（報連相）を怠ることは、システム全体の停止を意味します。

この原則の具体的な実践方法は、`P0.2: Inter-Agent Communication Protocol` に従います。

### P0.2: Inter-Agent Communication Protocol

**原則: 動力伝達としての報連相**

Agentは自律的にタスクを完了、または中断する際、必ず外部のAgentへ「報告」という形でコミュニケーションを行う必要があります。これは、マルチエージェント・システム全体の動力を維持するための**エネルギー伝達行為**です。

あるAgentが停止するということは、その動力が失われることを意味します。その動力を次のAgentへ確実に引き継ぎ、システム全体の処理を継続させるために、**停止する前の「報告・連絡・相談」が不可欠**です。報告を怠ることは動力の伝達を遮断し、プロジェクト全体の停止に繋がるため、固く禁止されています。

**技術的実装: 厳格な `tmux send-keys` 構文 (`sleep 0.5`)**

このエネルギー伝達（報連相）には、**必ず**以下の`tmux send-keys`構文を使用してください。この構文が、あなたの意志（メッセージ）を他のAgentへ確実に届け、動力を伝達する唯一の方法です。

✅ **正しい構文 (エネルギー伝達):**
```bash
tmux send-keys -t PANE_ID "メッセージ内容" && sleep 0.5 && tmux send-keys -t PANE_ID Enter
```

❌ **間違った構文 (エネルギーの損失):**
```bash
# ❌ これではEnterが送信されず、動力の伝達に失敗する！
tmux send-keys -t PANE_ID "メッセージ内容" Enter

# ❌ sleep 0.5 なしでは伝達が不安定になり、エネルギーが途中で失われる可能性がある
tmux send-keys -t PANE_ID "メッセージ内容" && tmux send-keys -t PANE_ID Enter
```

**理由**:
- `&& sleep 0.5 &&` を挟むことで、メッセージの送信と「Enterキーによる確定」という2つの操作が、より確実に分離・実行されます。
- この厳格なプロトコルを守ることによってのみ、あなたの報告が次のAgentへの「インプット」として成立し、エネルギーが正しく伝達されます。

**実例**:
```bash
# Agent「ツバキ」へIssue #673の作業完了を報告し、次のAgentへ動力をつなぐ
tmux send-keys -t %8 "Issue #673のコーディングが完了しました。レビューをお願いします。" && sleep 0.5 && tmux send-keys -t %8 Enter

# 全ての作業が完了したことをメインコントローラーに報告する
tmux send-keys -t %1 "全タスク完了。プロジェクトをクリーンナップしてください。" && sleep 0.5 && tmux send-keys -t %1 Enter
```

### P0.3: Continuous Trigger Relay

**原則**: タスク完了後、必ず自分で次Agentにトリガーを送る

各Agentはタスクを完了・中断した際、必ず自分で次の担当Agentにメッセージを送り、処理を引き継がせます。メッセージには担当間のトリガー文言（例: `[カエデ→サクラ] レビュー依頼: <タスク名>`）を含め、上記の`tmux send-keys`構文で送信してください。

**Format**: `[From→To] Action: Details`

**Example**:
```bash
tmux send-keys -t %9 "[カエデ→サクラ] レビュー依頼: Issue #270" && sleep 0.5 && tmux send-keys -t %9 Enter
```

---

## 🟠 P1: Essential Procedures (必須実行)

違反するとタスクが失敗します。

### P1.1: Task Delegation Protocol

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

### P1.2: MCP First Approach

**原則**: 全タスク実行前に MCP の活用可能性を確認

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**詳細**: `.codex/guides/MCP_INTEGRATION_PROTOCOL.md`

### P1.3: Context7 for External Libraries

**原則**: 外部ライブラリ参照時は必ず Context7 を使用

```
Use context7 to get the latest <library-name> documentation
```

### P1.4: Worktree Lifecycle

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

## 📁 Codex Directory Structure

```
.codex/                                     # Codex設定ルート
├── CODEX.md                                # ⭐ このファイル - メインエントリー
├── README.md                               # 概要
├── INDEX.md                                # マスターインデックス
│
├── agents/                                 # Agent仕様・プロンプト
│   ├── README.md
│   ├── AGENT_CHARACTERS.md                 # キャラクター設定
│   ├── specs/                              # 24 Agent specifications
│   │   ├── coding/                         # 11 coding agents
│   │   ├── business/                       # 14 business agents
│   │   └── lark/                           # 1 lark agent
│   ├── prompts/                            # Agent実行プロンプト
│   │   ├── coding/
│   │   ├── business/
│   │   └── lark/
│   └── lark/                               # Lark統合
│
├── commands/                               # 32 Slash commands
│   ├── INDEX.md
│   ├── agent-run.md
│   ├── create-issue.md
│   ├── orchestra.md
│   ├── tmux-orchestra-start.md
│   └── ... (32 commands)
│
├── context/                                # 15 Context modules
│   ├── INDEX.md
│   ├── core-rules.md                       # P0/P1 Rules
│   ├── miyabi-definition.md                # miyabi_def system
│   ├── swml-framework.md                   # Ω Function
│   ├── omega-phases.md                     # θ₁-θ₆
│   ├── agents.md                           # Agent詳細
│   ├── worktree.md                         # Worktree protocol
│   └── ... (15 modules)
│
├── Skills/                                 # 18 Skills
│   ├── README.md
│   ├── agent-execution/
│   ├── rust-development/
│   └── ... (18 skills)
│
├── guides/                                 # ⭐ NEW - 運用ガイド
│   ├── BENCHMARK_IMPLEMENTATION.md
│   ├── HOOKS_IMPLEMENTATION.md
│   ├── MCP_INTEGRATION_PROTOCOL.md
│   ├── LABEL_USAGE.md
│   ├── SWML_CONVERGENCE.md
│   ├── SWML_QUALITY_METRICS.md
│   ├── TMUX_AI_AGENT_CONTROL.md
│   └── TROUBLESHOOTING.md
│
├── hooks/                                  # ⭐ NEW - Hooks実装
│   ├── README.md
│   ├── hooks-config.json                   # Hooks設定
│   ├── auto-format.sh
│   ├── validate-typescript.sh
│   ├── log-commands.sh
│   └── agent-event.sh
│
├── tools/                                  # ⭐ NEW - ツール管理
│   ├── README.md
│   ├── tools-config.yaml                   # ツール定義
│   └── custom/                             # カスタムツール
│
├── schemas/                                # ⭐ NEW - JSON/YAMLスキーマ
│   ├── agents_store.schema.json
│   ├── hooks-config.schema.json
│   ├── tools-config.schema.yaml
│   └── context_index.schema.yaml
│
├── mcp-servers/                            # ⭐ NEW - MCP Server実装
│   ├── package.json
│   └── ... (node_modules)
│
├── archive/                                # レガシードキュメント
│   └── ... (旧設計文書)
│
├── design/                                 # Phase 1 設計文書
│   ├── CODEX_OVERHAUL_REQUIREMENTS.md
│   ├── DATA_STRUCTURES.md
│   └── DIFF_ANALYSIS_REPORT.md
│
├── ORCHESTRA_COMPLETE_GUIDE.md             # Orchestra v1.1.0完全ガイド
├── MIYABI_PARALLEL_ORCHESTRA.md            # 並列実行の哲学
├── MIYABI_ORCHESTRA_INTEGRATION.md         # Orchestra統合
├── TMUX_OPERATIONS.md                      # tmux技術詳細
├── TMUX_INTEGRATION_INDEX.md               # tmux統合インデックス
├── CODEX_TMUX_PARALLEL_EXECUTION.md        # Codex Company並列実行
├── KAMUI_TMUX_GUIDE.md                     # Kamui tmux統合
├── TMUX_A2A_HYBRID_ARCHITECTURE.md         # A2Aアーキテクチャ
├── TMUX_ADVANCED_TECHNIQUES.md             # tmux上級テクニック
└── SESSION_END_HOOKS_GUIDE.md              # セッション終了フック
```

---

## 📚 Context Modules (Just-In-Time Loading)

**Location**: `.codex/context/`

| Priority | Module | File | Description |
|----------|--------|------|-------------|
| ⭐⭐⭐⭐⭐ | **Core Rules** | `core-rules.md` | MCP First, Benchmark Protocol, Context7 |
| ⭐⭐⭐⭐⭐ | **Miyabi Definition** | `miyabi-definition.md` | miyabi_def system: YAML+Jinja2 source of truth |
| ⭐⭐⭐⭐⭐ | **SWML Framework** | `swml-framework.md` | Ω Function theoretical foundation |
| ⭐⭐⭐⭐⭐ | **Omega Phases** | `omega-phases.md` | θ₁-θ₆ implementation guide |
| ⭐⭐⭐⭐ | **Agents** | `agents.md` | 21 Agents (Coding: 7, Business: 14) |
| ⭐⭐⭐⭐ | **Architecture** | `architecture.md` | Cargo Workspace, GitHub OS, Worktree |
| ⭐⭐⭐ | **Development** | `development.md` | Rust/TypeScript規約、テスト、CI/CD |
| ⭐⭐⭐ | **Entity-Relation** | `entity-relation.md` | 12 Entities, 27 Relations, N1/N2/N3記法 |
| ⭐⭐⭐ | **Labels** | `labels.md` | 57 Label体系、11カテゴリ |
| ⭐⭐⭐ | **Worktree** | `worktree.md` | Worktreeライフサイクル、並列実行 |
| ⭐⭐⭐ | **Rust** | `rust.md` | Rust 2021 Edition開発ガイド |
| ⭐⭐ | **Protocols** | `protocols.md` | タスク管理、報告プロトコル |
| ⭐⭐ | **External Deps** | `external-deps.md` | Context7、MCP Servers |
| ⭐ | **TypeScript** | `typescript.md` | レガシーTypeScript参考 |

**Full Index**: `.codex/context/INDEX.md`

---

## 🤖 Agent System

### 21 Agents (Rust Implementation)

**Coding Agents (7)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent

**Business Agents (14)**:
- 戦略・企画系（6個）: AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
- マーケティング系（5個）: MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
- 営業・顧客管理系（3個）: Sales, CRM, Analytics

**Specs**: `.codex/agents/specs/` (24 files)
**Prompts**: `.codex/agents/prompts/` (6 files)

**Character Names**: `.codex/agents/AGENT_CHARACTERS.md`

---

## 🎮 Available Skills (18)

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
16. **claude-code-x** - Claude Code X統合
17. **voicevox** - VOICEVOX音声生成
18. **lark** - Lark統合

**Usage**:
```
Skill tool with command "agent-execution"
Skill tool with command "rust-development"
```

---

## 📊 Quick Reference

### Command Templates

```bash
# T1: Agent Communication
tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T2: Agent Startup
tmux send-keys -t <PANE_ID> "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T3: Clear Session
tmux send-keys -t <PANE_ID> "/clear" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter

# T4: Skill Execution
Skill tool with command "<skill-name>"

# T5: MCP Check
claude mcp list | grep <service>
```

### Key File Locations

```
/Users/shunsuke/Dev/miyabi-private/
├── CLAUDE.md                        # メインコントロール文書（プロジェクトルート）
├── .codex/CODEX.md                  # このファイル（Codex用）
├── .codex/context/*.md              # 15 Context Modules
├── .codex/agents/specs/*.md         # 24 Agent仕様
├── .codex/guides/*.md               # 8 運用ガイド
└── crates/                          # 15+ Rust crates
```

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
2. Check Codex is running in pane
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
- **Entity-Relation Model**: `../../docs/ENTITY_RELATION_MODEL.md` (12 Entities, 27 Relations)
- **Label System**: `../../docs/LABEL_SYSTEM_GUIDE.md` (57 Labels)
- **Agent System**: `../../AGENTS.md` (21 Agents)
- **Quick Start**: `../../QUICKSTART-JA.md`

### Context Modules
- **Architecture**: `.codex/context/architecture.md`
- **Development**: `.codex/context/development.md`
- **Protocols**: `.codex/context/protocols.md`
- **Full Index**: `.codex/context/INDEX.md`

### Operations
- **tmux Operations**: `.codex/TMUX_OPERATIONS.md`
- **tmux Orchestra**: `.codex/MIYABI_PARALLEL_ORCHESTRA.md`
- **MCP Integration**: `.codex/guides/MCP_INTEGRATION_PROTOCOL.md`
- **Benchmark Protocol**: `.codex/guides/BENCHMARK_IMPLEMENTATION.md`

---

## 📝 Self-Check Questions

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

- **v4.0** (2025-11-06): Codex改装完了 - guides/, hooks/, tools/, schemas/ 新設
- **v3.0** (2025-10-30): Business Agents完成、Lark統合
- **v2.0** (2025-10-20): Codex統合、Agent hooks
- **v1.0** (2025-10-01): 初版

---

**このファイルは Codex Agent の行動規範です。常に最新に保ち、1ページで理解できる量を維持してください。**

**Project**: Miyabi | **Location**: `/Users/shunsuke/Dev/miyabi-private/.codex/` | **Maintainer**: Miyabi Team
