# Miyabi Documentation Index

**Last Updated**: 2025-11-20
**Total Documents**: 約450本（主要ドキュメントは本ファイルから辿れます）
**Version**: 4.0.1

> ℹ️ リポジトリ再編成（2025-11〜2026-02）を進行中です。最新の構成・移行計画は `docs/architecture/RESTRUCTURING_PLAN.md` を参照してください。

---

## 🎯 Guardian-Operator Command Center ⭐ NEW

**統合コマンドセンター - マルチセッション統合管理**

| Document | Description | Priority |
|----------|-------------|----------|
| [command-center/README.md](./command-center/README.md) ⭐ NEW | 統合コマンドセンター概要 | ⭐⭐⭐⭐⭐ |
| [command-center/INDEX.md](./command-center/INDEX.md) ⭐ NEW | ドキュメントインデックス | ⭐⭐⭐⭐⭐ |
| [command-center/GUARDIAN_OPERATOR_INTEGRATION.md](./command-center/GUARDIAN_OPERATOR_INTEGRATION.md) ⭐ NEW | 統合プロトコル詳細 | ⭐⭐⭐⭐⭐ |
| [command-center/PROJECT_CUSTOM_INSTRUCTIONS.md](./command-center/PROJECT_CUSTOM_INSTRUCTIONS.md) ⭐ NEW | Operator動作指針 | ⭐⭐⭐⭐⭐ |
| [command-center/SESSION_MANAGEMENT_QUICK_REFERENCE.md](./command-center/SESSION_MANAGEMENT_QUICK_REFERENCE.md) ⭐ NEW | コマンドリファレンス | ⭐⭐⭐⭐ |
| [command-center/SOCAI_SESSION_DEFINITION.md](./command-center/SOCAI_SESSION_DEFINITION.md) ⭐ NEW | SOCAIセッション定義 | ⭐⭐⭐ |

**Guardian（人間）とOperator（Claude）が協力して複数のtmuxセッションを統合管理するシステム**

---

## 🚀 Quick Start Guides

**Essential reading for getting started with Miyabi Orchestra**

| Document | Description | Priority |
|----------|-------------|----------|
| [QUICK_START_3STEPS.md](./QUICK_START_3STEPS.md) ⭐ NEW | 3分でMiyabi Orchestra始動（3ステップ） | ⭐⭐⭐⭐⭐ |
| [YOUR_CURRENT_SETUP.md](./YOUR_CURRENT_SETUP.md) ⭐ UPDATED | Claude Code interactive mode完全ガイド | ⭐⭐⭐⭐⭐ |
| [TMUX_QUICKSTART.md](./TMUX_QUICKSTART.md) ⭐ NEW | tmux 5分クイックスタート | ⭐⭐⭐⭐ |
| [TMUX_LAYOUTS.md](./TMUX_LAYOUTS.md) ⭐ NEW | tmuxレイアウト集（ASCII art視覚化） | ⭐⭐⭐⭐ |
| [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) ⭐ UPDATED | UI/UX改善ガイド | ⭐⭐⭐ |
| [CLAUDE_CODE_COMMANDS.md](./CLAUDE_CODE_COMMANDS.md) | Claude Codeコマンド集 | ⭐⭐⭐ |
| [ORCHESTRA_ADVANCED_GUIDE.md](./ORCHESTRA_ADVANCED_GUIDE.md) ⭐ NEW | Orchestra上級者向けガイド | ⭐⭐⭐ |

---

## 📚 Core Documentation

### Architecture & System Design

| Document | Description |
|----------|-------------|
| [architecture/ENTITY_RELATION_MODEL.md](./architecture/ENTITY_RELATION_MODEL.md) | 14 Entities, 39 Relations - システム基盤 |
| [architecture/MIYABI_ARCHITECTURE_V2.md](./architecture/MIYABI_ARCHITECTURE_V2.md) | Miyabi v2.0 アーキテクチャ詳細 |
| [architecture/DIRECTORY_STRUCTURE.md](./architecture/DIRECTORY_STRUCTURE.md) | ディレクトリ構造ガイド |
| [architecture/AGENTS.md](./architecture/AGENTS.md) | 21 Agents システム設計 |
| [architecture/NAVIGATION_GUIDE.md](./architecture/NAVIGATION_GUIDE.md) | ドキュメントナビゲーションガイド |

### Guides & Tutorials

| Document | Description |
|----------|-------------|
| [guides/LABEL_SYSTEM_GUIDE.md](./guides/LABEL_SYSTEM_GUIDE.md) | 57 Label体系完全ガイド |
| [guides/QUICKSTART-JA.md](./guides/QUICKSTART-JA.md) | クイックスタート（日本語） |
| [guides/WORKTREE_PROTOCOL.md](./guides/WORKTREE_PROTOCOL.md) | Git Worktreeプロトコル |
| [guides/PARALLEL_EXECUTION_STRATEGY.md](./guides/PARALLEL_EXECUTION_STRATEGY.md) | 並列実行戦略 |
| [tutorials/GETTING_STARTED.md](./tutorials/GETTING_STARTED.md) | 初心者向けチュートリアル |
| [tutorials/MIYABI_FOR_BEGINNERS.md](./tutorials/MIYABI_FOR_BEGINNERS.md) | Miyabi入門ガイド |

---

## 🏗️ Integration & Setup

### Integration Guides

| Document | Description |
|----------|-------------|
| [integration/CLAUDE_CODE_INTEGRATION_STRATEGY.md](./integration/CLAUDE_CODE_INTEGRATION_STRATEGY.md) | Claude Code統合戦略 |
| [integration/CODEX_INTEGRATION_PLAN_RUST.md](./integration/CODEX_INTEGRATION_PLAN_RUST.md) | Codex統合プラン（Rust） |
| [integration/VOICEVOX_HOOKS_QUICKSTART.md](./integration/VOICEVOX_HOOKS_QUICKSTART.md) | VOICEVOX統合クイックスタート |
| [integration/HOOKS_INTEGRATION_COMPLETE.md](./integration/HOOKS_INTEGRATION_COMPLETE.md) | Hooks統合完了レポート |

### Setup Guides

| Document | Description |
|----------|-------------|
| [setup/SELF_HOSTED_RUNNER_SETUP.md](./setup/SELF_HOSTED_RUNNER_SETUP.md) | セルフホストランナー設定 |
| [setup/MAC_MINI_LLM_SERVER_SETUP.md](./setup/MAC_MINI_LLM_SERVER_SETUP.md) | Mac Mini LLMサーバー設定 |
| [setup/TRACKING_SETUP.md](./setup/TRACKING_SETUP.md) | トラッキング設定ガイド |

---

## 🧪 Testing & Quality

| Document | Description |
|----------|-------------|
| [testing/TESTING_GUIDE.md](./testing/TESTING_GUIDE.md) | テスト実行ガイド |
| [testing/COVERAGE_GUIDE.md](./testing/COVERAGE_GUIDE.md) | カバレッジ測定ガイド |
| [testing/AGENT_TEST_SPECIFICATION.md](./testing/AGENT_TEST_SPECIFICATION.md) | Agent テスト仕様 |
| [testing/MCP_TEST_READY_REPORT.md](./testing/MCP_TEST_READY_REPORT.md) | MCPテスト準備レポート |

---

## 🚀 Deployment & Operations

| Document | Description |
|----------|-------------|
| [deployment/DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md) | デプロイメントガイド |
| [deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](./deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | 本番環境デプロイチェックリスト |
| [deployment/RELEASE_STRATEGY.md](./deployment/RELEASE_STRATEGY.md) | リリース戦略 |
| [operations/GETTING_STARTED.md](./operations/GETTING_STARTED.md) | 運用開始ガイド |
| [operations/E2E_DEMO_GUIDE.md](./operations/E2E_DEMO_GUIDE.md) | E2Eデモガイド |

---

## 💼 Business & Planning

### Business Documents

| Document | Description |
|----------|-------------|
| [business/MIYABI_BUSINESS_MODEL_V2.md](./business/MIYABI_BUSINESS_MODEL_V2.md) | ビジネスモデル v2.0 |
| [business/MIYABI_SALES_STRATEGY.md](./business/MIYABI_SALES_STRATEGY.md) | セールス戦略 |
| [business/COMPETITIVE_ANALYSIS_2025.md](./business/COMPETITIVE_ANALYSIS_2025.md) | 競合分析 2025 |
| [business/JAPAN_MARKET_RESEARCH_2025.md](./business/JAPAN_MARKET_RESEARCH_2025.md) | 日本市場調査 2025 |

### Planning & Roadmap

| Document | Description |
|----------|-------------|
| [planning/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md](./planning/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md) | 自律運用マスタープラン |
| [planning/ROADMAP_v1.1.0.md](./planning/ROADMAP_v1.1.0.md) | ロードマップ v1.1.0 |
| [planning/FUTURE_ROADMAP_v1.2.0+.md](./planning/FUTURE_ROADMAP_v1.2.0+.md) | 将来ロードマップ v1.2.0+ |

---

## 📊 Reports & Analysis

### Implementation Reports

| Document | Description |
|----------|-------------|
| [reports/PHASE1_IMPLEMENTATION_REPORT.md](./reports/PHASE1_IMPLEMENTATION_REPORT.md) | Phase 1 実装レポート |
| [reports/MILESTONE_34_COMPLETION_REPORT.md](./reports/MILESTONE_34_COMPLETION_REPORT.md) | Milestone 34 完了レポート |
| [reports/IMPLEMENTATION_STATUS.md](./reports/IMPLEMENTATION_STATUS.md) | 実装ステータス |

### Session Reports

| Document | Description |
|----------|-------------|
| [sessions/SESSION_REPORT_2025-10-18.md](./sessions/SESSION_REPORT_2025-10-18.md) | セッションレポート 2025-10-18 |
| [sessions/SESSION_SUMMARY_2025_10_26.md](./sessions/SESSION_SUMMARY_2025_10_26.md) | セッションサマリー 2025-10-26 |
| [sessions/SESSION_FINAL_2025_10_26.md](./sessions/SESSION_FINAL_2025_10_26.md) | セッション最終 2025-10-26 |

---

## 🎨 Product & Design

| Document | Description |
|----------|-------------|
| [product/DEMO_VIDEO_PRODUCTION_GUIDE.md](./product/DEMO_VIDEO_PRODUCTION_GUIDE.md) | デモ動画制作ガイド |
| [product/WEBUI_DASHBOARD_DESIGN.md](./product/WEBUI_DASHBOARD_DESIGN.md) | WebUIダッシュボード設計 |
| [design/DESIGN_SYSTEM_SPECIFICATION.md](./design/DESIGN_SYSTEM_SPECIFICATION.md) | デザインシステム仕様 |
| [design/UI_COMPONENT_SPECIFICATION.md](./design/UI_COMPONENT_SPECIFICATION.md) | UIコンポーネント仕様 |

---

## 🤝 Community & Discord

| Document | Description |
|----------|-------------|
| [community/DISCORD_COMMUNITY_PLAN.md](./community/DISCORD_COMMUNITY_PLAN.md) | Discordコミュニティプラン |
| [discord/DISCORD_SERVER_STRUCTURE.md](./discord/DISCORD_SERVER_STRUCTURE.md) | Discordサーバー構造 |
| [discord/DISCORD_GROWTH_STRATEGY.md](./discord/DISCORD_GROWTH_STRATEGY.md) | Discord成長戦略 |
| [community/COMMUNITY_GUIDELINES.md](./community/COMMUNITY_GUIDELINES.md) | コミュニティガイドライン |

---

## 🔗 API & Integration

| Document | Description |
|----------|-------------|
| [api/REST_API_SPECIFICATION.md](./api/REST_API_SPECIFICATION.md) | REST API仕様 |
| [api/WEBSOCKET_API_SPECIFICATION.md](./api/WEBSOCKET_API_SPECIFICATION.md) | WebSocket API仕様 |
| [api/ARCHITECTURE.md](./api/ARCHITECTURE.md) | APIアーキテクチャ |

---

## 📖 Reference Documentation

| Document | Description |
|----------|-------------|
| [reference/TEMPLATE_MASTER_INDEX.md](./reference/TEMPLATE_MASTER_INDEX.md) | 88 Templates マスターインデックス |
| [reference/CHANGELOG.md](./reference/CHANGELOG.md) | 変更履歴 |
| [reference/VERSIONING_STRATEGY.md](./reference/VERSIONING_STRATEGY.md) | バージョニング戦略 |
| [reference/PROJECT_SUMMARY.md](./reference/PROJECT_SUMMARY.md) | プロジェクトサマリー |

---

## 🎯 Special Topics

### Performance & Optimization

| Document | Description |
|----------|-------------|
| [performance/PERFORMANCE_OPTIMIZATION.md](./performance/PERFORMANCE_OPTIMIZATION.md) | パフォーマンス最適化 |
| [performance/PERFORMANCE_REPORT.md](./performance/PERFORMANCE_REPORT.md) | パフォーマンスレポート |
| [benchmarks/SWE_BENCH_COMPARISON.md](./benchmarks/SWE_BENCH_COMPARISON.md) | SWE-bench比較 |

### Conferences & Presentations

| Document | Description |
|----------|-------------|
| [conferences/AIDD_2025_PROPOSAL.md](./conferences/AIDD_2025_PROPOSAL.md) | AIDD 2025 提案 |
| [conferences/AIDD_2025_SLIDES_STRUCTURE.md](./conferences/AIDD_2025_SLIDES_STRUCTURE.md) | AIDD 2025 スライド構成 |
| [slides/byteplus-bootcamp-2025-complete.md](./slides/byteplus-bootcamp-2025-complete.md) | BytePlus Bootcamp 2025 完全版 |

### Migration & Refactoring

| Document | Description |
|----------|-------------|
| [migration/RUST_MIGRATION_GUIDE.md](./migration/RUST_MIGRATION_GUIDE.md) | Rustマイグレーションガイド |
| [migration/MIGRATION_GUIDE.md](./migration/MIGRATION_GUIDE.md) | マイグレーションガイド |
| [refactoring/EXECUTIVE_SUMMARY.md](./refactoring/EXECUTIVE_SUMMARY.md) | リファクタリング概要 |

### Visualization

| Document | Description |
|----------|-------------|
| [visualization/USER_GUIDE.md](./visualization/USER_GUIDE.md) | 3D可視化ユーザーガイド |
| [visualization/HIERARCHICAL_DESIGN.md](./visualization/HIERARCHICAL_DESIGN.md) | 階層型設計 |
| [architecture/MIYABI_MOLECULAR_VISUALIZATION_SPEC.md](./architecture/MIYABI_MOLECULAR_VISUALIZATION_SPEC.md) | 分子可視化仕様 |

---

## 📂 Document Categories

### By Directory

```
docs/
├── 📁 api/                    # API仕様 (3 files)
├── 📁 architecture/           # システムアーキテクチャ (47 files)
├── 📁 articles/               # 技術記事 (3 files)
├── 📁 autopilot/              # Autopilot設定 (2 files)
├── 📁 benchmarks/             # ベンチマーク (2 files)
├── 📁 blog/                   # ブログ記事 (2 files)
├── 📁 business/               # ビジネスドキュメント (9 files)
├── 📁 checklists/             # チェックリスト (3 files)
├── 📁 codex/                  # Codex統合 (2 files)
├── 📁 community/              # コミュニティ (5 files)
├── 📁 conferences/            # カンファレンス (8 files)
├── 📁 daily-updates/          # 日次更新 (7 files)
├── 📁 demo/                   # デモガイド (6 files)
├── 📁 demo-video/             # デモ動画 (7 files)
├── 📁 deployment/             # デプロイメント (7 files)
├── 📁 design/                 # デザイン (9 files)
├── 📁 diagrams/               # 図表 (1 file)
├── 📁 discord/                # Discord統合 (18 files)
├── 📁 electron-app/           # Electronアプリ (7 files)
├── 📁 features/               # 機能ガイド (1 file)
├── 📁 github/                 # GitHub統合 (7 files)
├── 📁 guides/                 # ガイド (15 files)
├── 📁 implementation-plans/   # 実装計画 (1 file)
├── 📁 infrastructure/         # インフラストラクチャ (3 files)
├── 📁 integration/            # 統合ガイド (13 files)
├── 📁 integrations/           # 外部統合 (5 files)
├── 📁 landing-pages/          # ランディングページ (15 files)
├── 📁 ldd/                    # LDD (1 file)
├── 📁 legal/                  # 法的文書 (3 files)
├── 📁 market-research/        # 市場調査 (2 files)
├── 📁 migration/              # マイグレーション (7 files)
├── 📁 operations/             # 運用 (5 files)
├── 📁 performance/            # パフォーマンス (3 files)
├── 📁 persona/                # ペルソナ (3 files)
├── 📁 phase-0/                # Phase 0 (5 files)
├── 📁 phase-6/                # Phase 6 (2 files)
├── 📁 phases/                 # Phase履歴 (14 files)
├── 📁 pitch-deck/             # ピッチデック (18 files)
├── 📁 planning/               # プランニング (11 files)
├── 📁 plans/                  # 計画 (3 files)
├── 📁 product/                # プロダクト (9 files)
├── 📁 refactoring/            # リファクタリング (2 files)
├── 📁 reference/              # リファレンス (20 files)
├── 📁 reports/                # レポート (27 files)
├── 📁 research/               # 調査 (4 files)
├── 📁 schemas/                # スキーマ (1 file)
├── 📁 session-reports/        # セッションレポート (1 file)
├── 📁 sessions/               # セッション (8 files)
├── 📁 setup/                  # セットアップ (10 files)
├── 📁 slides/                 # スライド (7 files)
├── 📁 testing/                # テスト (9 files)
├── 📁 tutorials/              # チュートリアル (16 files)
├── 📁 visualization/          # 可視化 (6 files)
└── 📄 Root files              # ルートファイル (58 files)

Total: 458 files across 46 directories
```

---

## 🔍 Finding Documents

### By Priority

- **⭐⭐⭐⭐⭐ Essential** (Must Read):
  - QUICK_START_3STEPS.md
  - YOUR_CURRENT_SETUP.md
  - architecture/ENTITY_RELATION_MODEL.md
  - guides/LABEL_SYSTEM_GUIDE.md

- **⭐⭐⭐⭐ Important** (Highly Recommended):
  - TMUX_QUICKSTART.md
  - TMUX_LAYOUTS.md
  - architecture/MIYABI_ARCHITECTURE_V2.md
  - guides/WORKTREE_PROTOCOL.md

- **⭐⭐⭐ Recommended** (Read as Needed):
  - VISUAL_GUIDE.md
  - CLAUDE_CODE_COMMANDS.md
  - ORCHESTRA_ADVANCED_GUIDE.md
  - guides/PARALLEL_EXECUTION_STRATEGY.md

### By Use Case

**Starting Miyabi Orchestra**:
1. QUICK_START_3STEPS.md
2. YOUR_CURRENT_SETUP.md
3. TMUX_QUICKSTART.md

**Understanding Architecture**:
1. architecture/ENTITY_RELATION_MODEL.md
2. architecture/MIYABI_ARCHITECTURE_V2.md
3. architecture/AGENTS.md

**Development**:
1. guides/WORKTREE_PROTOCOL.md
2. guides/LABEL_SYSTEM_GUIDE.md
3. testing/TESTING_GUIDE.md

**Business & Planning**:
1. business/MIYABI_BUSINESS_MODEL_V2.md
2. planning/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md
3. planning/ROADMAP_v1.1.0.md

---

## 🔗 Related Configuration

- **Claude Code Config**: `.claude/MIYABI_ORCHESTRA_INTEGRATION.md`
- **YAML Schema**: `.claude/schemas/orchestra-config.schema.yaml`
- **Master Config**: `.claude/orchestra-config.yaml`
- **Context Modules**: `.claude/context/INDEX.md`

---

## 📝 Contributing

ドキュメントの追加・更新時は、このREADME.mdも更新してください。

**Update Process**:
1. 新規ドキュメント作成
2. 適切なカテゴリに追加
3. docs/README.md（このファイル）を更新
4. .claude/context/INDEX.mdを更新（必要な場合）

---

## 📊 Statistics

- **Total Documents**: 458 files
- **Total Directories**: 46 directories
- **Documentation Coverage**: Comprehensive
- **Last Major Update**: 2025-11-03 (Orchestra v2.0)

---

**🎭 Miyabi Documentation Index v3.0.0**
**Maintained by**: Miyabi Team
**License**: MIT
