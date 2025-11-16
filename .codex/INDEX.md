# 📚 .codex Directory - Master Index

**Version**: 4.1.0 (AIfactory Integration Added)
**Date**: 2025-11-12
**Purpose**: Central navigation hub for all Codex resources

---

## 🚀 Quick Start

- **Main Entry Point** → [CODEX.md](CODEX.md) ⭐
- **README** → [README.md](README.md)
- **Core Rules** → [context/core-rules.md](context/core-rules.md)
- **Agent System** → [agents/README.md](agents/README.md)

---

## 📁 Directory Structure

```
.codex/
├── CODEX.md                        # ⭐ メインエントリーポイント
├── README.md                       # 概要
├── INDEX.md                        # このファイル
│
├── agents/                         # 24 Agent仕様・プロンプト
├── commands/                       # 32 Slash commands
├── context/                        # 15 Context modules
├── Skills/                         # 18 Skills
├── guides/                         # ⭐ NEW - 8 運用ガイド
├── hooks/                          # ⭐ NEW - Hooks実装
├── tools/                          # ⭐ NEW - ツール管理
├── schemas/                        # ⭐ NEW - JSON/YAMLスキーマ
├── mcp-servers/                    # ⭐ NEW - MCP Server実装
├── archive/                        # レガシードキュメント
└── design/                         # Phase 1設計文書
```

---

## 📖 Documentation by Topic

### 🎯 P0: Core (必読)

| Document | Purpose | Priority |
|----------|---------|----------|
| [CODEX.md](CODEX.md) | メインコントロール文書 | ⭐⭐⭐⭐⭐ |
| [context/core-rules.md](context/core-rules.md) | MCP First, Benchmark Protocol | ⭐⭐⭐⭐⭐ |
| [context/miyabi-definition.md](context/miyabi-definition.md) | miyabi_def system | ⭐⭐⭐⭐⭐ |
| [context/pantheon-society.md](context/pantheon-society.md) | 🌍 **NEW** - Pantheon Society基盤 | ⭐⭐⭐⭐ |
| [context/aifactory-integration.md](context/aifactory-integration.md) | 🆕 AIfactory統合 | ⭐⭐⭐⭐ |
| [context/agents.md](context/agents.md) | 21 Agents詳細 | ⭐⭐⭐⭐ |

### 🤖 Agent System

| Document | Purpose | Priority |
|----------|---------|----------|
| [agents/README.md](agents/README.md) | Agent system overview | ⭐⭐⭐⭐ |
| [agents/AGENT_CHARACTERS.md](agents/AGENT_CHARACTERS.md) | キャラクター設定 | ⭐⭐⭐ |
| [agents/specs/coding/](agents/specs/coding/) | 11 Coding Agent仕様 | ⭐⭐⭐ |
| [agents/specs/business/](agents/specs/business/) | 19 Business Agent仕様 🆕 | ⭐⭐⭐ |

**New Business Agents** (AIfactory Integration):
- `course-generator-agent.md` - AI course generation
- `document-generator-agent.md` - Business document generation
- `content-search-agent.md` - Semantic search
- `payment-processor-agent.md` - Payment processing
- `approval-workflow-agent.md` - Approval workflows

### ⚡ Commands (32 Slash Commands)

**Full List**: [commands/INDEX.md](commands/INDEX.md)

**Top Commands**:
- `/orchestra` - Orchestra v1.1.0起動
- `/agent-run` - Agent実行
- `/create-issue` - Issue作成
- `/verify` - システム検証
- `/session-end` - セッション終了

### 🔧 Guides (8 運用ガイド) ⭐ NEW

| Guide | Purpose |
|-------|---------|
| [guides/MCP_INTEGRATION_PROTOCOL.md](guides/MCP_INTEGRATION_PROTOCOL.md) | MCP統合プロトコル |
| [guides/HOOKS_IMPLEMENTATION.md](guides/HOOKS_IMPLEMENTATION.md) | Hooks実装ガイド |
| [guides/BENCHMARK_IMPLEMENTATION.md](guides/BENCHMARK_IMPLEMENTATION.md) | Benchmark実装 |
| [guides/LABEL_USAGE.md](guides/LABEL_USAGE.md) | Label使用ガイド |
| [guides/SWML_CONVERGENCE.md](guides/SWML_CONVERGENCE.md) | SWML収束理論 |
| [guides/SWML_QUALITY_METRICS.md](guides/SWML_QUALITY_METRICS.md) | SWML品質メトリクス |
| [guides/TMUX_AI_AGENT_CONTROL.md](guides/TMUX_AI_AGENT_CONTROL.md) | tmux Agent制御 |
| [guides/TROUBLESHOOTING.md](guides/TROUBLESHOOTING.md) | トラブルシューティング |

### 🔗 Hooks & Tools ⭐ NEW

**Hooks**:
- Configuration: [hooks/hooks-config.json](hooks/hooks-config.json)
- Schema: [schemas/hooks-config.schema.json](schemas/hooks-config.schema.json)
- README: [hooks/README.md](hooks/README.md)

**Tools**:
- Configuration: [tools/tools-config.yaml](tools/tools-config.yaml)
- Schema: [schemas/tools-config.schema.yaml](schemas/tools-config.schema.yaml)
- README: [tools/README.md](tools/README.md)

### 📊 Schemas ⭐ NEW

| Schema | Purpose |
|--------|---------|
| [schemas/agents_store.schema.json](schemas/agents_store.schema.json) | Agent実行履歴・ステータス |
| [schemas/hooks-config.schema.json](schemas/hooks-config.schema.json) | Hooks設定 |
| [schemas/tools-config.schema.yaml](schemas/tools-config.schema.yaml) | ツール定義 |
| [schemas/context_index.schema.yaml](schemas/context_index.schema.yaml) | コンテキストモジュール索引 |

### 🛠️ Development

| Document | Purpose | Priority |
|----------|---------|----------|
| [context/rust.md](context/rust.md) | Rust 2021開発ガイド | ⭐⭐⭐⭐ |
| [context/development.md](context/development.md) | テスト・CI/CD・規約 | ⭐⭐⭐ |
| [context/worktree.md](context/worktree.md) | Git worktree protocol | ⭐⭐⭐ |
| [context/architecture.md](context/architecture.md) | システムアーキテクチャ | ⭐⭐⭐⭐ |

### 🎭 tmux Operations

| Document | Purpose |
|----------|---------|
| [ORCHESTRA_COMPLETE_GUIDE.md](ORCHESTRA_COMPLETE_GUIDE.md) | Orchestra v1.1.0完全ガイド |
| [MIYABI_PARALLEL_ORCHESTRA.md](MIYABI_PARALLEL_ORCHESTRA.md) | 並列実行の哲学 |
| [MIYABI_ORCHESTRA_INTEGRATION.md](MIYABI_ORCHESTRA_INTEGRATION.md) | Orchestra統合ガイド |
| [TMUX_OPERATIONS.md](TMUX_OPERATIONS.md) | tmux技術詳細 |
| [TMUX_INTEGRATION_INDEX.md](TMUX_INTEGRATION_INDEX.md) | tmux統合インデックス |
| [CODEX_TMUX_PARALLEL_EXECUTION.md](CODEX_TMUX_PARALLEL_EXECUTION.md) | Codex Company並列実行 |
| [KAMUI_TMUX_GUIDE.md](KAMUI_TMUX_GUIDE.md) | Kamui tmux統合 |
| [TMUX_A2A_HYBRID_ARCHITECTURE.md](TMUX_A2A_HYBRID_ARCHITECTURE.md) | A2Aアーキテクチャ |
| [TMUX_ADVANCED_TECHNIQUES.md](TMUX_ADVANCED_TECHNIQUES.md) | tmux上級テクニック |
| [SESSION_END_HOOKS_GUIDE.md](SESSION_END_HOOKS_GUIDE.md) | セッション終了フック |

---

## 🔌 Skills (18 Skills)

**Location**: `Skills/` directory

**Categories**:
- **Development** (7): agent-execution, rust-development, debugging-troubleshooting, dependency-management, performance-analysis, security-audit, git-workflow
- **Documentation** (2): documentation-generation, issue-analysis
- **Setup** (1): project-setup
- **Business** (5): business-strategy-planning, content-marketing-strategy, market-research-analysis, sales-crm-management, growth-analytics-dashboard
- **Integration** (3): claude-code-x, voicevox, lark (special integrations)

**README**: [Skills/README.md](Skills/README.md)

---

## 📚 Context Modules (16 Modules)

**Location**: `context/` directory

| Priority | Module | File |
|----------|--------|------|
| P0 | Core Rules | core-rules.md |
| P0 | Miyabi Definition | miyabi-definition.md |
| P0 | SWML Framework | swml-framework.md |
| P0 | Omega Phases | omega-phases.md |
| P1 | Pantheon Society 🌍 NEW | pantheon-society.md |
| P1 | AIfactory Integration 🆕 NEW | aifactory-integration.md |
| P1 | Agents | agents.md |
| P1 | Architecture | architecture.md |
| P2 | Development | development.md |
| P2 | Entity-Relation | entity-relation.md |
| P2 | Labels | labels.md |
| P2 | Worktree | worktree.md |
| P2 | Rust | rust.md |
| P3 | Protocols | protocols.md |
| P3 | External Deps | external-deps.md |
| P4 | TypeScript | typescript.md |

**Full Index**: [context/INDEX.md](context/INDEX.md)

---

## 🗂️ Archive

レガシードキュメント: `archive/` directory

- CODEX_DESIGN_PATTERNS.md
- CODEX_PATTERN_APPLICATION_PLAN.md
- CODEX_SESSION_README.md
- NEXT_PHASE_PLANNING.md
- OPTIMIZATION_PLAN.md
- PATTERN3_CHECKLIST.md
- RUST_MIGRATION_CHECKLIST.md
- RUST_MIGRATION_SUMMARY.md
- TEST_INSTRUCTIONS_FOR_CODEX.md
- TEST_INSTRUCTIONS_FOR_GEMINI.md

---

## 📊 Phase 1 Design Documents

**Location**: `design/` directory

| Document | Purpose |
|----------|---------|
| [design/CODEX_OVERHAUL_REQUIREMENTS.md](design/CODEX_OVERHAUL_REQUIREMENTS.md) | 要件定義書 (375行) |
| [design/DATA_STRUCTURES.md](design/DATA_STRUCTURES.md) | データ構造設計 (500行) |
| [design/DIFF_ANALYSIS_REPORT.md](design/DIFF_ANALYSIS_REPORT.md) | 差分洗い出しレポート (600行) |

---

## 🔗 Related Documentation

### Project Root
- [../../CLAUDE.md](../../CLAUDE.md) - Project root control document
- [../../README.md](../../README.md) - Project overview
- [../../AGENTS.md](../../AGENTS.md) - Agent system

### External
- [../../docs/ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md) - 12 Entities, 27 Relations
- [../../docs/LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md) - 57 Labels

---

## 📝 Version History

- **v4.1.0** (2025-11-12): Pantheon Society追加 - 歴史的人物×神話的存在によるAI社会基盤
- **v4.0.0** (2025-11-06): Codex Overhaul Phase 2完了 - guides/, hooks/, tools/, schemas/ 新設
- **v3.0.0** (2025-10-30): Business Agents完成、Lark統合
- **v2.0.0** (2025-10-27): Context modules整理
- **v1.0.0** (2025-10-01): 初版

---

**このINDEXは.codexディレクトリの全リソースへのナビゲーションハブです。**

**Maintained by**: Miyabi Team | **Location**: `.codex/INDEX.md`
