# Miyabi Documentation Structure

**Version**: 1.0.0
**Date**: 2025-10-23
**Status**: ✅ Production Ready

## 概要

Miyabiプロジェクトの包括的なドキュメント構造定義。351個のドキュメントを5階層構造で整理し、ユーザーと開発者の両方にとってナビゲーション可能な体系を提供します。

---

## 📚 5階層ドキュメント構造

### 1️⃣ Getting Started（入門ガイド）

**対象**: 初めてMiyabiを使うユーザー
**ディレクトリ**: `docs/01_getting_started/`

**既存ドキュメント**:
- `GETTING_STARTED.md` - クイックスタートガイド
- `MIYABI_FOR_BEGINNERS.md` - 初心者向けガイド
- `ONBOARDING.md` - オンボーディングプロセス
- `CLI_USAGE_EXAMPLES.md` - CLIコマンド例
- `tutorials/` - 4つのチュートリアル

**今後追加**:
- Installation guide (OS別)
- First agent execution
- Troubleshooting basics

---

### 2️⃣ Architecture（アーキテクチャ）

**対象**: システム設計を理解したい開発者
**ディレクトリ**: `docs/02_architecture/`

**既存ドキュメント**:
- `ENTITY_RELATION_MODEL.md` - 12 Entity + 27 Relation定義 ⭐⭐⭐
- `ARCHITECTURE_DESIGN.md` - システム全体アーキテクチャ
- `MIYABI_ARCHITECTURE_V2.md` - V2アーキテクチャ仕様
- `architecture/` サブディレクトリ:
  - `AGENTIC_OS.md` - エージェントOS設計
  - `GITHUB_OS_INTEGRATION_PLAN.md` - GitHub OS統合
  - `OSS_DEVELOPMENT_SYSTEM.md` - OSS開発システム
- `PARALLEL_WORK_ARCHITECTURE.md` - 並列実行アーキテクチャ
- `WORKTREE_PROTOCOL.md` - Worktreeライフサイクルプロトコル ⭐⭐⭐

**カテゴリ**:
- System Design: 全体アーキテクチャ
- Agent System: 21 Agents設計
- Parallel Execution: Worktree並列実行
- GitHub OS: GitHub統合アーキテクチャ

---

### 3️⃣ API Reference（API リファレンス）

**対象**: API利用者・統合開発者
**ディレクトリ**: `docs/03_api_reference/`

**既存ドキュメント**:
- `API_DOCUMENTATION.md` - API全体ドキュメント
- `api/` サブディレクトリ:
  - `REST_API_SPECIFICATION.md` - REST API仕様
  - `WEBSOCKET_API_SPECIFICATION.md` - WebSocket API仕様
  - `ARCHITECTURE.md` - API アーキテクチャ
- `MARKETPLACE_API_REFERENCE.md` - Marketplace API
- `AGENT_SDK_LABEL_INTEGRATION.md` - Agent SDK × Label統合 ⭐⭐⭐

**今後追加**:
- Rust API docs (rustdoc生成)
- MCP Server API reference
- CLI command reference

---

### 4️⃣ Development Guide（開発ガイド）

**対象**: Miyabi contributorと拡張開発者
**ディレクトリ**: `docs/04_development_guide/`

**既存ドキュメント**:

#### コア開発:
- `RUST_MIGRATION_REQUIREMENTS.md` - Rust移行要件 ⭐⭐⭐
- `RUST_MIGRATION_GUIDE.md` - Rust移行ガイド
- `RUST_MIGRATION_SPRINT_PLAN.md` - スプリント計画
- `CORE_UTILITIES_GUIDE.md` - コアユーティリティ
- `CONTAINER_GUIDE.md` - コンテナ開発

#### Agent開発:
- `AGENT_OPERATIONS_MANUAL.md` - Agent運用マニュアル ⭐⭐
- `AGENTS.md` - Agent概要
- `operations/AGENTS.md` - Agent運用詳細
- `BUSINESS_AGENTS_USER_GUIDE.md` - Business Agents ガイド
- `CHARACTER_NAMING_SYSTEM.md` - キャラクター命名システム

#### Testing:
- `benchmarks/` - ベンチマーク評価環境
- Performance testing guides
- Integration testing guides

#### Codex Integration:
- `CODEX_MIYABI_INTEGRATION.md` - Codex × Miyabi統合 ⭐⭐⭐
- `CODEX_INTEGRATION_PLAN_RUST.md` - Rust版Codex統合
- `CODEX_GPT_OSS_INTEGRATION.md` - GPT-OSS統合
- `codex/` サブディレクトリ

#### Claude Code Integration:
- `CLAUDE_CODE_HOOKS_REFERENCE.md` - Hooks リファレンス
- `CLAUDE_CODE_PLUGINS_REFERENCE.md` - Plugins リファレンス
- `CLAUDE_CODE_TASK_TOOL.md` - Task Tool統合
- `CLAUDE_SESSION_ORCHESTRATION_PLAN.md` - セッション管理

#### Label System:
- `LABEL_SYSTEM_GUIDE.md` - 53ラベル体系完全ガイド ⭐⭐⭐

---

### 5️⃣ Operations（運用ガイド）

**対象**: Miyabiを本番環境で運用する組織
**ディレクトリ**: `docs/05_operations/`

**既存ドキュメント**:

#### Deployment:
- `DEPLOYMENT_GUIDE.md` - デプロイガイド
- `DEPLOYMENT_READY_REPORT.md` - デプロイ準備レポート
- `DEPLOYMENT_COMPLETION_REPORT_v1.0.0.md` - v1.0.0デプロイ完了
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - 本番チェックリスト
- `operations/` サブディレクトリ:
  - `DEPLOYMENT.md` - デプロイ詳細
  - `QUICKSTART.md` - クイックスタート
  - `E2E_DEMO_GUIDE.md` - E2Eデモ

#### Infrastructure:
- `infrastructure/` サブディレクトリ:
  - `GITHUB_ACTIONS_OPTIMIZATION_SUMMARY.md` - Actions最適化
  - `SELF_HOSTED_RUNNERS_STRATEGY.md` - Self-hosted Runners
  - `WORKFLOW_COST_ANALYSIS.md` - コスト分析
- `MAC_MINI_LLM_SERVER_SETUP.md` - Mac mini LLMサーバー
- `MAC_MINI_SSH_SETUP.md` - SSH設定

#### Security & Compliance:
- `SECURITY_AUDIT_REPORT.md` - セキュリティ監査
- `COMPLIANCE_LEGAL_REVIEW.md` - コンプライアンスレビュー
- `PRIVACY.md` - プライバシーポリシー
- `EULA.md` - 使用許諾契約
- `TERMS_OF_SERVICE.md` - 利用規約

#### GitHub Integration:
- `GITHUB_OS_INTEGRATION.md` - GitHub OS統合 ⭐⭐⭐
- `GITHUB_PROJECT_V2_SETUP.md` - Projects V2セットアップ
- `GITHUB_SECRETS_SETUP.md` - Secretsセットアップ
- `GITHUB_TOKEN_SETUP.md` - Tokenセットアップ
- `WEBHOOK_INTEGRATION_GUIDE.md` - Webhook統合
- `DISCUSSIONS_INTEGRATION.md` - Discussions統合

#### Performance:
- `PERFORMANCE_OPTIMIZATION.md` - パフォーマンス最適化
- `PERFORMANCE_REPORT.md` - パフォーマンスレポート
- `PERFORMANCE_EVIDENCE_BASED_ANALYSIS.md` - エビデンスベース分析

#### Monitoring:
- `ISSUE_TRACE_LOG_GUIDE.md` - Issueトレースログ
- `TRACKING_SETUP.md` - トラッキングセットアップ

---

## 📂 特殊ディレクトリ

### Community（コミュニティ）

**ディレクトリ**: `docs/community/`

**内容**:
- `COMMUNITY_GUIDELINES.md` - コミュニティガイドライン
- `DISCORD_COMMUNITY_PLAN.md` - Discordコミュニティ計画
- `DISCORD_MCP_SETUP.md` - Discord MCP設定
- `MARKETPLACE.md` - マーケットプレイス
- Discord運用ドキュメント群（10+ファイル）

---

### Business（ビジネス戦略）

**ディレクトリ**: `docs/business/`（新規作成提案）

**現在の場所**: `docs/` 直下に分散

**統合対象**:
- `SAAS_BUSINESS_MODEL.md` - SaaSビジネスモデル（16,000行）
- `MARKET_ANALYSIS_2025.md` - 市場調査2025（8,000行）
- `MIYABI_BUSINESS_PLAN_2025.md` - ビジネスプラン2025
- `MIYABI_SALES_STRATEGY.md` - セールス戦略
- `MIYABI_LICENSE_STRATEGY.md` - ライセンス戦略
- `PRODUCT_HUNT_LAUNCH_PLAN.md` - Product Hunt ローンチ
- `EARLY_ADOPTER_FUNDING_PLAN.md` - アーリーアダプター資金計画

**サブカテゴリ**:
- Business Model: ビジネスモデル・収益モデル
- Market Research: 市場調査・競合分析
- Sales & Marketing: セールス戦略・マーケティング
- Licensing: ライセンス戦略・料金体系

---

### Research（調査研究）

**ディレクトリ**: `docs/research/`

**既存**:
- `SIMILAR_PROJECTS_ANALYSIS.md` - 類似プロジェクト分析
- `SWE_BENCH_COMPARISON.md` - SWE-bench比較

**追加提案**:
- Competitive analysis reports
- Technology evaluation
- Performance benchmarks

---

### Planning（プロジェクト計画）

**ディレクトリ**: `docs/planning/`

**既存**:
- `Plans.md` - 統合計画
- `NEXT_STEPS_JP.md` - 次のステップ

**統合対象** (現在 `docs/` 直下):
- `ROADMAP_v1.1.0.md` - v1.1.0ロードマップ
- `FUTURE_ROADMAP_v1.2.0+.md` - v1.2.0以降ロードマップ
- `NEXT_SPRINT_PLAN.md` - 次のスプリント計画
- `PHASE*_*.md` - Phase完了レポート群

---

### Daily Updates（日次更新）

**ディレクトリ**: `docs/daily-updates/`

**既存**: 日次レポート + スクリーンショット

**統合**: `docs/daily/` との統合検討

---

### Templates（テンプレート）

**ディレクトリ**: `docs/templates/`（新規作成提案）

**統合対象**:
- `TEMPLATE_MASTER_INDEX.md` - 88ファイル統合インデックス ⭐⭐⭐
- `TEMPLATE_INSTRUCTIONS.md` - テンプレート使用法
- `TEMPLATE_COMPLETE.md` - テンプレート完成版

---

## 🔗 ナビゲーション戦略

### 1. README.md更新

**トップレベルREADME**に5階層構造へのリンクを追加：

```markdown
## 📚 Documentation

- **[Getting Started](docs/01_getting_started/)** - 初めての方はこちら
- **[Architecture](docs/02_architecture/)** - システム設計・Entity-Relationモデル
- **[API Reference](docs/03_api_reference/)** - API仕様・SDK統合
- **[Development Guide](docs/04_development_guide/)** - コントリビューター向け
- **[Operations](docs/05_operations/)** - 本番運用ガイド

**特殊ドキュメント**:
- **[Business Strategy](docs/business/)** - ビジネスモデル・市場調査
- **[Community](docs/community/)** - コミュニティガイドライン
- **[Templates](docs/templates/)** - ドキュメントテンプレート
```

### 2. docs/README.md作成

**ドキュメントハブ**として、全体マップを提供：

```markdown
# Miyabi Documentation

## 🗺️ Documentation Map

### Core Documentation (必読)

1. **Getting Started** - 5分でMiyabiを理解
2. **Entity-Relation Model** - 12 Entity + 27 Relation ⭐⭐⭐
3. **Label System Guide** - 53ラベル体系 ⭐⭐⭐
4. **Agent Operations Manual** - 21 Agents運用 ⭐⭐
5. **Worktree Protocol** - 並列実行プロトコル ⭐⭐⭐

### By Role

**For Users**:
- Getting Started → Tutorials → CLI Usage Examples

**For Developers**:
- Architecture → Development Guide → API Reference

**For Operators**:
- Operations → Deployment Guide → Security Audit
```

### 3. 各階層のREADME.md

各ディレクトリに`README.md`を配置し、サブドキュメントへのナビゲーションを提供。

---

## 📊 移行計画

### Phase 1: ディレクトリ作成（1h）

```bash
mkdir -p docs/01_getting_started
mkdir -p docs/02_architecture
mkdir -p docs/03_api_reference
mkdir -p docs/04_development_guide
mkdir -p docs/05_operations
mkdir -p docs/business
mkdir -p docs/templates
```

### Phase 2: ドキュメント移動（2h）

**手動移動** (重要度の高い順):
1. Core documents (ENTITY_RELATION_MODEL, LABEL_SYSTEM_GUIDE等)
2. Architecture documents
3. API documents
4. Development guides
5. Operations guides

**自動移動** (スクリプト):
```bash
# Getting Started
mv docs/GETTING_STARTED.md docs/01_getting_started/
mv docs/MIYABI_FOR_BEGINNERS.md docs/01_getting_started/
mv docs/ONBOARDING.md docs/01_getting_started/

# Architecture
mv docs/ENTITY_RELATION_MODEL.md docs/02_architecture/
mv docs/WORKTREE_PROTOCOL.md docs/02_architecture/

# API Reference
mv docs/API_DOCUMENTATION.md docs/03_api_reference/

# ... (続く)
```

### Phase 3: リンク更新（1h）

- 内部リンクの一括置換
- GitHub Issuesのリンク更新
- CLAUDE.mdのリンク更新

### Phase 4: README作成（30min）

- トップレベルREADME更新
- docs/README.md作成
- 各階層のREADME.md作成

---

## ✅ 完了条件

- [ ] 5階層ディレクトリ作成完了
- [ ] コアドキュメント（⭐⭐⭐マーク）移動完了
- [ ] 各階層のREADME.md作成完了
- [ ] トップレベルREADME更新完了
- [ ] 内部リンク切れ0件
- [ ] レビュー完了

---

## 📝 メンテナンス方針

### 新規ドキュメント作成時

1. **対象ユーザーを明確化**（User / Developer / Operator）
2. **適切な階層に配置**（5階層のいずれか）
3. **README.mdに追加**（該当階層）

### ドキュメント更新時

1. **Last Updated日付を更新**
2. **バージョン番号を更新**（major changes）
3. **CHANGELOGに記録**

### 廃止ドキュメント

1. **`docs/archive/`に移動**
2. **廃止理由を記載**（READMEに）
3. **リンク元から削除**

---

## 📚 参考

- **Entity-Relation Model**: `docs/ENTITY_RELATION_MODEL.md` ⭐⭐⭐
- **Template Master Index**: `docs/TEMPLATE_MASTER_INDEX.md` ⭐⭐⭐
- **Label System Guide**: `docs/LABEL_SYSTEM_GUIDE.md` ⭐⭐⭐

---

**作成日**: 2025-10-23
**作成者**: Claude Code
**Issue**: #470 (ドキュメント構造設計)
