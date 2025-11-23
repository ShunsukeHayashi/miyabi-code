# Miyabi Context Index

**Last Updated**: 2025-11-15
**Version**: 3.4.0

## 📚 Context Module Directory

このディレクトリには、Miyabiプロジェクトの19個のContext Moduleが格納されています。
Claude Codeは必要に応じて、これらのモジュールを動的にロードします。

## 🗂️ Category List

| Module | File | Size | Priority | Description |
|--------|------|------|----------|-------------|
| **Miyabi Society** | `miyabi-society.md` | ~1,200 tokens | ⭐⭐⭐⭐⭐ | 🌍 **NEW** - Society Formula統合（Agent定義、15原理、Pantheon階層、6フェーズ変換） |
| **SWML Framework** | `swml-framework.md` | ~1,000 tokens | ⭐⭐⭐⭐⭐ | 🧬 理論基盤 - Ω Function定義、数学的収束保証、6フェーズ分解 |
| **Omega Phases** | `omega-phases.md` | ~1,500 tokens | ⭐⭐⭐⭐⭐ | 🔬 実装ガイド - θ₁-θ₆各フェーズの詳細実装指針 |
| **Miyabi Definition** | `miyabi-definition.md` | ~800 tokens | ⭐⭐⭐⭐⭐ | ✨ miyabi_def統合（14 Entities, 39 Relations, 57 Labels, 5 Workflows） |
| **Core Rules** | `core-rules.md` | ~400 tokens | ⭐⭐⭐⭐⭐ | MCP First, Benchmark Protocol, Context7 |
| **Pantheon Society** | `pantheon-society.md` | ~600 tokens | ⭐⭐⭐⭐ | 🌍 歴史的人物×神話的存在によるAI社会基盤（AWS統合、Council governance） |
| **AIfactory Integration** | `aifactory-integration.md` | ~600 tokens | ⭐⭐⭐⭐ | 🆕 AIfactory統合（Composite State, 5 Business Agents） |
| **Agents** | `agents.md` | ~300 tokens | ⭐⭐⭐⭐ | 21 Agents概要（7 Coding + 14 Business） |
| **Architecture** | `architecture.md` | ~400 tokens | ⭐⭐⭐⭐ | Cargo Workspace, Git Worktree, GitHub OS |
| **Infrastructure** | `infrastructure.md` | ~700 tokens | ⭐⭐⭐ | 🔥 MUGEN環境 - EC2開発サーバー接続、スペック、運用 |
| **Development** | `development.md` | ~300 tokens | ⭐⭐⭐ | Rust/TypeScript規約、テスト、CI/CD |
| **Lint Integration** | `lint-integration.md` | ~700 tokens | ⭐⭐⭐ | 🔍 Lint警告統合 - AI Agent向けVSCode診断情報 |
| **Entity-Relation** | `archive/entity-relation.md` | ~300 tokens | 🗄️ | ✅ Archived - Superseded by miyabi-definition.md |
| **Labels** | `archive/labels.md` | ~200 tokens | 🗄️ | ✅ Archived - Superseded by miyabi-definition.md |
| **Worktree** | `worktree.md` | ~300 tokens | ⭐⭐⭐ | Worktreeライフサイクル、並列実行 |
| **Rust** | `rust.md` | ~300 tokens | ⭐⭐⭐ | Rust 2021 Edition開発ガイド |
| **Rust Tool Use** | `rust-tool-use-rules.md` | ~1,500 tokens | ⭐⭐⭐⭐ | 🦀 MCP Tool最適化ルール（並列/シーケンシャルパターン、統合ワークフロー） |
| **TypeScript** | `typescript.md` | ~200 tokens | ⭐ | レガシーTypeScript参考 |
| **Protocols** | `protocols.md` | ~300 tokens | ⭐⭐ | タスク管理、報告プロトコル |
| **External Deps** | `external-deps.md` | ~200 tokens | ⭐⭐ | Context7、MCP Servers |
| **A2A Protocol** | `a2a-protocol.md` | ~2,500 tokens | ⭐⭐⭐⭐ | 🆕 Agent-to-Agent通信プロトコル（Google A2A、Agent Card、Task管理） |
| **A2A Unified Comm** | `a2a-unified-communication.md` | ~3,500 tokens | ⭐⭐⭐⭐⭐ | 🆕 統一A2A通信アーキテクチャ（Gateway、Router、Queue、全Agent連携） |

**Total Estimated Size**: ~16,300 tokens (個別読み込み時)

**Note**:
- 🔗 **A2A Unified**: `a2a-unified-communication.md` is the **core communication architecture** - ALL agent communication uses A2A
- 🧬 **SWML**: `swml-framework.md` is the **mathematical foundation** providing formal convergence guarantees
- 🔬 **Omega**: `omega-phases.md` provides **detailed implementation guide** for θ₁-θ₆ phases
- 🌍 **Society**: `miyabi-society.md` is the **theoretical framework** connecting all agents and components
- ✨ **Definition**: `miyabi-definition.md` is the **primary source** for Entity-Relation Model and Label System
- 🗄️ **Archive**: Legacy files remain in `archive/` for backward compatibility

## 🎯 Usage Pattern

### Pattern 0: 🌍 Miyabi Society Foundation（最優先）
```
Agentとしての理解が必要な場合、まず確認すべきモジュール:
- miyabi-society.md (Agent定義、Society Formula、15原理、Pantheon階層)

具体例:
- Agent自身の定義を理解: Agent_i = (𝒯, 𝒰, 𝒮, 𝒟, Ω, 𝒫)
- 15 Leadership Principles参照: P₁-P₁₅の適用方法
- Pantheon階層での位置確認: Layer 0-4のどこに属するか
- Society方程式理解: Θ₁-Θ₆の6フェーズ変換
- Ω function定義: 自分固有の変換関数は何か
```

### Pattern 0.5: 🧬 SWML/Omega実装タスク
```
Ω functionの実装や6フェーズの詳細理解が必要な場合:
- swml-framework.md (数学的基盤、収束保証、Ω関数定義)
- omega-phases.md (θ₁-θ₆各フェーズの実装ガイド)

具体例:
- Ω function数式理解: Ω = θ₆ ∘ θ₅ ∘ θ₄ ∘ θ₃ ∘ θ₂ ∘ θ₁
- θ₁ Understanding実装: Step-back prompting (26 steps)
- θ₂ Generation実装: SELF-DISCOVER + Code generation
- θ₃ Allocation実装: DAG task decomposition
- θ₄ Execution実装: Parallel worktree execution
- θ₅ Integration実装: PR creation and merging
- θ₆ Learning実装: World state update + feedback loop
- 収束証明理解: W₀ → W₁ → ... → W_∞
```

### Pattern 1: 🆕 Miyabi Definition Lookup
```
任意のタスクでまず確認すべきモジュール:
- miyabi-definition.md (Entity, Relation, Label, Workflow定義の完全版)

具体例:
- Entity属性確認: miyabi_def/variables/entities.yaml参照
- Relation実装確認: miyabi_def/variables/relations.yaml参照
- Label割り当て: miyabi_def/variables/labels.yaml参照
- Workflow stage確認: miyabi_def/variables/workflows.yaml参照
```

### Pattern 2: Agent開発タスク
```
必要なモジュール:
- miyabi-society.md 🌍 NEW (Agent定義、Society Formula)
- miyabi-definition.md (Agent仕様、Entity定義)
- core-rules.md (MCP確認)
- agents.md (Agent概要)
- rust.md (Rust規約)
- development.md (テスト規約)
```

### Pattern 3: Issue処理タスク
```
必要なモジュール:
- miyabi-society.md 🌍 NEW (6-Phase Transformation理解)
- miyabi-definition.md (Label体系、Workflow定義)
- core-rules.md (MCP確認)
- worktree.md (並列実行)
- protocols.md (報告プロトコル)
```

### Pattern 4: ベンチマーク実装タスク
```
必要なモジュール:
- core-rules.md (Benchmark Protocol)
- external-deps.md (Context7)
- development.md (CI/CD)
```

### Pattern 5: 🆕 定義ファイル生成タスク
```
必要なモジュール:
- miyabi-definition.md (miyabi_defシステム全体)

実行手順:
1. cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi_def
2. source .venv/bin/activate
3. python generate.py
4. ls -lh generated/
```

### Pattern 6: 🆕 AIfactory統合タスク
```
必要なモジュール:
- aifactory-integration.md ✨ NEW (統合アーキテクチャ、Business Agents)
- core-rules.md (MCP確認)
- agents.md (Agent system)
- development.md (Rust開発)

具体例:
- Composite State実装: CompositeServiceState型定義
- Business Agent実装: CourseGeneratorAgent等5エージェント
- API Migration: NestJS → Rust + Axum
- Frontend Integration: React → Miyabi API
```

### Pattern 7: 🌍 Pantheon Society構築タスク
```
必要なモジュール:
- miyabi-society.md 🌍 NEW (Society Formula、15原理、Pantheon階層)
- pantheon-society.md (歴史的人物Agent、神話的Guardian、Council)
- core-rules.md (MCP確認)
- agents.md (Agent system)
- architecture.md (AWS統合)

具体例:
- Historical Agent実装: Bill Gates, Napoleon, Hannibalエージェント
- Mythological Guardian: Cerberus (セキュリティ)、Michael (倫理)
- Pantheon Council: ガバナンス、意思決定プロトコル
- AWS Pantheon Architecture: Multi-account strategy
```

### Pattern 8: 🆕 A2A Protocol統合タスク
```
必要なモジュール:
- a2a-protocol.md 🆕 NEW (Agent Card、Task管理、通信フロー)
- core-rules.md (MCP確認)
- agents.md (Agent system)
- rust.md (Rust実装)

具体例:
- Agent Card実装: /.well-known/agent.json エンドポイント
- Task管理: InMemoryTaskStore、TaskStatus
- A2Aサーバー: axum + JSON-RPC
- A2Aクライアント: reqwest + serde_json
- 外部エージェント連携: CrewAI、LangGraph、AutoGen
```

### Pattern 9: 🦀 MCP Tool最適化タスク
```
必要なモジュール:
- rust-tool-use-rules.md 🦀 NEW (MCP Tool最適化ルール)
- rust.md (Rust開発ガイド)
- core-rules.md (MCP First原則)
- protocols.md (通信プロトコル)

具体例:
- 並列Tool実行: resource_overview + git_status + tmux_list_sessions
- シーケンシャルTool: github_get_issue → tmux_send_message → tmux_pane_tail
- エラーハンドリング: log_get_errors + process_search
- Rust開発統合: cargo commands + MCP monitoring
- パフォーマンス最適化: 最小呼び出し原則、キャッシュ活用
```

## 📖 Related Documentation

**Detailed Docs** (既存ドキュメント):
- Entity-Relation: `docs/ENTITY_RELATION_MODEL.md`
- Templates: `docs/TEMPLATE_MASTER_INDEX.md`
- Labels: `docs/LABEL_SYSTEM_GUIDE.md`
- MCP Protocol: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- Benchmark Checklist: `.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`

**Integration Plans** 🆕:
- **AIfactory Integration**: `docs/planning/AIFACTORY_MIYABI_INTEGRATION_PLAN.md` - 完全統合プラン (6週間, 5 phases)

**tmux Parallel Execution** (Miyabi Orchestra v2.0):
- **Integration Guide**: `.claude/MIYABI_ORCHESTRA_INTEGRATION.md` ⭐ NEW - 完全統合ガイド (3.0.0)
- **Configuration**: `.claude/orchestra-config.yaml` ⭐ NEW - Master configuration (490 lines)
- **Schema**: `.claude/schemas/orchestra-config.schema.yaml` ⭐ NEW - YAML Schema (12KB, JSON Schema Draft 07)
- **Philosophy**: `.claude/MIYABI_PARALLEL_ORCHESTRA.md` - 雅なる並列実行の哲学
- **Quick Start**: `docs/QUICK_START_3STEPS.md` ⭐ NEW - 3分でセットアップ
- **Your Setup**: `docs/YOUR_CURRENT_SETUP.md` ⭐ UPDATED - Claude Code interactive mode guide
- **tmux Guide**: `docs/TMUX_QUICKSTART.md` ⭐ NEW - 5分で基本操作
- **Layouts**: `docs/TMUX_LAYOUTS.md` ⭐ NEW - レイアウト集 (ASCII art)
- **Visual Guide**: `docs/VISUAL_GUIDE.md` ⭐ UPDATED - UI/UX改善ガイド
- **Advanced Guide**: `docs/ORCHESTRA_ADVANCED_GUIDE.md` ⭐ NEW - 上級者向けガイド
- **Commands**: `docs/CLAUDE_CODE_COMMANDS.md` - ワンライナーコマンド集
- **Operations**: `.claude/TMUX_OPERATIONS.md` - tmux技術詳細
- **Codex Integration**: `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md` - Claude Code Company統合

**Agent Specs**: `.claude/agents/specs/coding/*.md` | `.claude/agents/specs/business/*.md`
**Agent Prompts**: `.claude/agents/prompts/coding/*.md`

**New Business Agents** 🆕 (AIfactory Integration):
- `CourseGeneratorAgent.md` - AI course generation
- `DocumentGeneratorAgent.md` - Business document generation
- `ContentSearchAgent.md` - Semantic search
- `PaymentProcessorAgent.md` - Payment processing
- `ApprovalWorkflowAgent.md` - Approval workflows

## 🔄 Update Policy

Context Moduleは以下の場合に更新:
- 新機能追加時（Agent追加、新プロトコル等）
- 重大なアーキテクチャ変更時
- ベストプラクティス更新時

## 🚀 Quick Commands

```bash
# すべてのContext Module確認
ls -lh .claude/context/

# 特定モジュール表示
cat .claude/context/core-rules.md

# トークン数推定
wc -w .claude/context/*.md
```

---

**Note**: このIndexファイル自体も約200トークンです。
