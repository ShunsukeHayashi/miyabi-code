# Miyabi Context Index

**Last Updated**: 2025-11-12
**Version**: 3.1.0

## 📚 Context Module Directory

このディレクトリには、Miyabiプロジェクトの11個のContext Moduleが格納されています。
Claude Codeは必要に応じて、これらのモジュールを動的にロードします。

## 🗂️ Category List

| Module | File | Size | Priority | Description |
|--------|------|------|----------|-------------|
| **Miyabi Definition** | `miyabi-definition.md` | ~800 tokens | ⭐⭐⭐⭐⭐ | ✨ **NEW** - miyabi_def統合（14 Entities, 39 Relations, 57 Labels, 5 Workflows） |
| **Core Rules** | `core-rules.md` | ~400 tokens | ⭐⭐⭐⭐⭐ | MCP First, Benchmark Protocol, Context7 |
| **Pantheon Society** | `pantheon-society.md` | ~600 tokens | ⭐⭐⭐⭐ | 🌍 **NEW** - 歴史的人物×神話的存在によるAI社会基盤（AWS統合、Council governance） |
| **AIfactory Integration** | `aifactory-integration.md` | ~600 tokens | ⭐⭐⭐⭐ | 🆕 **NEW** - AIfactory統合（Composite State, 5 Business Agents） |
| **Agents** | `agents.md` | ~300 tokens | ⭐⭐⭐⭐ | 21 Agents概要（7 Coding + 14 Business） |
| **Architecture** | `architecture.md` | ~400 tokens | ⭐⭐⭐⭐ | Cargo Workspace, Git Worktree, GitHub OS |
| **Development** | `development.md` | ~300 tokens | ⭐⭐⭐ | Rust/TypeScript規約、テスト、CI/CD |
| **Entity-Relation** | `entity-relation.md` | ~300 tokens | ⭐⭐ | 🔄 Legacy - Superseded by miyabi-definition.md |
| **Labels** | `labels.md` | ~200 tokens | ⭐⭐ | 🔄 Legacy - Superseded by miyabi-definition.md |
| **Worktree** | `worktree.md` | ~300 tokens | ⭐⭐⭐ | Worktreeライフサイクル、並列実行 |
| **Rust** | `rust.md` | ~300 tokens | ⭐⭐⭐ | Rust 2021 Edition開発ガイド |
| **TypeScript** | `typescript.md` | ~200 tokens | ⭐ | レガシーTypeScript参考 |
| **Protocols** | `protocols.md` | ~300 tokens | ⭐⭐ | タスク管理、報告プロトコル |
| **External Deps** | `external-deps.md` | ~200 tokens | ⭐⭐ | Context7、MCP Servers |

**Total Estimated Size**: ~5,000 tokens (個別読み込み時)

**Note**: ✨ `miyabi-definition.md` is the **new primary source** for Entity-Relation Model and Label System. Legacy files remain for backward compatibility.

## 🎯 Usage Pattern

### Pattern 0: 🆕 Miyabi Definition Lookup（最優先）
```
任意のタスクでまず確認すべきモジュール:
- miyabi-definition.md (Entity, Relation, Label, Workflow定義の完全版)

具体例:
- Entity属性確認: miyabi_def/variables/entities.yaml参照
- Relation実装確認: miyabi_def/variables/relations.yaml参照
- Label割り当て: miyabi_def/variables/labels.yaml参照
- Workflow stage確認: miyabi_def/variables/workflows.yaml参照
```

### Pattern 1: Agent開発タスク
```
必要なモジュール:
- miyabi-definition.md ✨ NEW (Agent定義、Entity仕様)
- core-rules.md (MCP確認)
- agents.md (Agent概要)
- rust.md (Rust規約)
- development.md (テスト規約)
```

### Pattern 2: Issue処理タスク
```
必要なモジュール:
- miyabi-definition.md ✨ NEW (Label体系、Workflow定義)
- core-rules.md (MCP確認)
- worktree.md (並列実行)
- protocols.md (報告プロトコル)
```

### Pattern 3: ベンチマーク実装タスク
```
必要なモジュール:
- core-rules.md (Benchmark Protocol)
- external-deps.md (Context7)
- development.md (CI/CD)
```

### Pattern 4: 🆕 定義ファイル生成タスク
```
必要なモジュール:
- miyabi-definition.md (miyabi_defシステム全体)

実行手順:
1. cd /Users/shunsuke/Dev/miyabi-private/miyabi_def
2. source .venv/bin/activate
3. python generate.py
4. ls -lh generated/
```

### Pattern 5: 🆕 AIfactory統合タスク
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

### Pattern 6: 🌍 Pantheon Society構築タスク
```
必要なモジュール:
- pantheon-society.md 🌍 NEW (歴史的人物Agent、神話的Guardian、Council)
- core-rules.md (MCP確認)
- agents.md (Agent system)
- architecture.md (AWS統合)

具体例:
- Historical Agent実装: Bill Gates, Napoleon, Hannibalエージェント
- Mythological Guardian: Cerberus (セキュリティ)、Michael (倫理)
- Pantheon Council: ガバナンス、意思決定プロトコル
- AWS Pantheon Architecture: Multi-account strategy
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
