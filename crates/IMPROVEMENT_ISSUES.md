# Miyabi Crates - 改善プラン Issue起票

**生成日時**: 2025-10-22
**関連ドキュメント**:
- [INTEGRATION_VISUALIZATION.md](./INTEGRATION_VISUALIZATION.md)
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)

---

## Issue #1: Legacy Code削除 - miyabi-agents段階的廃止

### Title
🔧 refactor: Migrate remaining code from miyabi-agents to specialized crates

### Description

#### 📊 背景
統合状態の可視化により、`miyabi-agents` クレートが旧実装を含んでおり、各Agent専用クレートへの移行が必要であることが判明しました。

**現状**:
- `miyabi-agents`: 5,477行、110テスト（Legacy実装含む）
- 各Agent専用クレート: 既に存在するが完全移行していない

**問題点**:
- ❌ 複雑な依存関係
- ❌ テストの重複
- ❌ 保守性の低下
- ❌ 型定義の不一致

#### 🎯 目標
`miyabi-agents`を完全に廃止し、以下の専用クレートに移行：
- `miyabi-agent-coordinator`
- `miyabi-agent-codegen`
- `miyabi-agent-review`
- `miyabi-agent-workflow`
- `miyabi-agent-business`

#### ✅ 実施内容

##### Phase 1: 移行マッピング（1週間）
- [ ] 各Agentの実装コードを専用クレートにマッピング
- [ ] テストケースの重複確認
- [ ] 型定義の統一（`miyabi-types`への移行）
- [ ] 依存関係の整理

##### Phase 2: コード移行（2週間）
- [ ] CoordinatorAgent完全移行
- [ ] CodeGenAgent完全移行
- [ ] ReviewAgent完全移行
- [ ] WorkflowAgent完全移行
- [ ] テストの統合・重複削除

##### Phase 3: 検証・廃止（1週間）
- [ ] すべてのテストがパス（347テスト維持）
- [ ] ビルド時間の改善確認
- [ ] `miyabi-agents`の削除
- [ ] Cargo.tomlの依存関係更新

#### 📈 成功基準
- ✅ `miyabi-agents`クレートの完全削除
- ✅ すべてのテストがパス（347テスト以上）
- ✅ ビルド時間が8分以下（目標: 6分）
- ✅ コンパイル警告0件
- ✅ 循環依存なし

#### 🏷️ Labels
- `✨ type:refactoring`
- `🏗️ phase:implementation`
- `🔥 priority:P1-High`
- `🤖 agent:coordinator`

#### 📅 Timeline
- **開始**: 2025-10-23
- **完了予定**: 2025-11-13（3週間）

#### 📚 関連ドキュメント
- [INTEGRATION_VISUALIZATION.md](./INTEGRATION_VISUALIZATION.md#layer-4-agent-implementations)
- [RUST_MIGRATION_REQUIREMENTS.md](../docs/RUST_MIGRATION_REQUIREMENTS.md)

---

## Issue #2: Business Agents実装 - 残り13個の実装

### Title
✨ feat: Implement 13 remaining Business Agents

### Description

#### 📊 背景
Business Agentsは14個計画されており、現在`AIEntrepreneurAgent`のみ実装済みです。残り13個を実装する必要があります。

**実装済み（1個）**:
- ✅ AIEntrepreneurAgent（8-Phase business planning）

**未実装（13個）**:
1. ProductConceptAgent
2. ProductDesignAgent
3. PersonaAgent
4. SelfAnalysisAgent
5. MarketResearchAgent
6. MarketingAgent
7. ContentCreationAgent
8. SNSStrategyAgent
9. YouTubeAgent
10. SalesAgent
11. CRMAgent
12. AnalyticsAgent
13. FunnelDesignAgent

#### 🎯 目標
全14個のBusiness Agentsを実装し、ビジネス戦略の自動化を完成させる。

#### ✅ 実施内容

##### Phase 1: 基盤強化（1週間）
- [ ] `BusinessAgent` trait の拡張
- [ ] 共通バリデーションフレームワーク
- [ ] 品質スコアリングシステム（100点満点）
- [ ] テンプレートエンジンの統合

##### Phase 2: 戦略・企画系Agent実装（3週間）
- [ ] ProductConceptAgent（USP、収益モデル）
- [ ] ProductDesignAgent（技術スタック、MVP定義）
- [ ] PersonaAgent（3-5人の詳細ペルソナ）
- [ ] SelfAnalysisAgent（キャリア・スキル分析）
- [ ] FunnelDesignAgent（顧客導線最適化）

##### Phase 3: マーケティング系Agent実装（3週間）
- [ ] MarketResearchAgent（競合20社以上分析）
- [ ] MarketingAgent（広告・SEO・SNS戦略）
- [ ] ContentCreationAgent（動画・記事・教材制作）
- [ ] SNSStrategyAgent（Twitter/Instagram/LinkedIn）
- [ ] YouTubeAgent（チャンネル最適化13ワークフロー）

##### Phase 4: 営業・顧客管理系Agent実装（2週間）
- [ ] SalesAgent（リード→顧客転換率最大化）
- [ ] CRMAgent（顧客満足度向上・LTV最大化）
- [ ] AnalyticsAgent（データ分析・PDCA実行）

##### Phase 5: 統合テスト（1週間）
- [ ] 全14 Agentの統合テスト
- [ ] E2Eシナリオテスト（起業→成長→収益化）
- [ ] パフォーマンステスト

#### 📈 成功基準
- ✅ 14個すべてのBusiness Agents実装
- ✅ 各Agentのテストカバレッジ80%以上
- ✅ E2Eシナリオテスト10個以上
- ✅ ドキュメント完備（Rustdoc + README）
- ✅ 品質スコア90点以上

#### 🏷️ Labels
- `✨ type:feature`
- `🏗️ phase:implementation`
- `🔥 priority:P2-Medium`
- `🤖 agent:business`

#### 📅 Timeline
- **開始**: 2025-10-23
- **完了予定**: 2025-12-18（8週間）

#### 📚 関連ドキュメント
- `.claude/agents/specs/business/*.md`（14ファイル）
- [BUSINESS_AGENTS_USER_GUIDE.md](../docs/BUSINESS_AGENTS_USER_GUIDE.md)
- [INTEGRATION_VISUALIZATION.md](./INTEGRATION_VISUALIZATION.md#layer-4-agent-implementations)

---

## Issue #3: 統合テスト拡充 - カバレッジ30% → 60%以上

### Title
🧪 test: Expand integration test coverage from 30% to 60%+

### Description

#### 📊 背景
単体テストは80%以上のカバレッジを達成していますが、統合テストは30%にとどまっています。

**現状**:
- ✅ 単体テスト: 80%以上（327テスト）
- ⚠️ 統合テスト: 30%（20テスト）
- **Total**: 347テスト

**問題点**:
- ❌ クレート間の統合動作が未検証
- ❌ Worktree並列実行のテストが不足
- ❌ E2Eシナリオテストが不足
- ❌ エラーハンドリングのテストが不足

#### 🎯 目標
統合テストカバレッジを30% → 60%以上に引き上げ、システム全体の品質を保証する。

#### ✅ 実施内容

##### Phase 1: テストインフラ整備（1週間）
- [ ] 統合テスト用のテストフィクスチャ作成
- [ ] モックGitHub APIサーバー構築
- [ ] テストデータベース（SQLite）セットアップ
- [ ] CI/CD統合テストパイプライン構築

##### Phase 2: クレート間統合テスト（2週間）
- [ ] types ↔ core 統合テスト（10テスト）
- [ ] core ↔ github 統合テスト（15テスト）
- [ ] core ↔ worktree 統合テスト（10テスト）
- [ ] agent-core ↔ agents 統合テスト（20テスト）
- [ ] cli ↔ agents 統合テスト（15テスト）

##### Phase 3: E2Eシナリオテスト（2週間）
- [ ] Issue作成 → Task分解 → Agent実行 → PR作成（5シナリオ）
- [ ] Worktree並列実行（3 Issues同時処理）（3シナリオ）
- [ ] LLMプロバイダー切り替え（Groq/vLLM/Ollama）（3シナリオ）
- [ ] デプロイパイプライン（Firebase/Vercel/AWS）（3シナリオ）
- [ ] エラーリカバリー（失敗→再試行→成功）（5シナリオ）

##### Phase 4: パフォーマンステスト（1週間）
- [ ] ビルド時間測定（目標: 8分以下）
- [ ] Agent実行時間測定（Issue処理: 5分以内）
- [ ] メモリ使用量測定（100MB以下/Agent）
- [ ] 並列実行スケーラビリティ（concurrency=10まで）

#### 📈 成功基準
- ✅ 統合テストカバレッジ60%以上
- ✅ E2Eシナリオテスト20個以上
- ✅ パフォーマンステスト10個以上
- ✅ すべてのテストがパス（500テスト以上）
- ✅ CI/CDで自動実行

#### 🏷️ Labels
- `🧪 type:test`
- `🏗️ phase:testing`
- `🔥 priority:P1-High`
- `⭐ quality:excellent`

#### 📅 Timeline
- **開始**: 2025-10-23
- **完了予定**: 2025-11-20（4週間）

#### 📚 関連ドキュメント
- [INTEGRATION_VISUALIZATION.md](./INTEGRATION_VISUALIZATION.md#-integration-test-scenarios)
- [WORKTREE_PROTOCOL.md](../docs/WORKTREE_PROTOCOL.md)

---

## Issue #4: ドキュメント整備 - 各クレートREADME.md作成

### Title
📚 docs: Create README.md for 7 missing crates

### Description

#### 📊 背景
一部のクレートでREADME.mdが不足しており、開発者がクレートの役割や使い方を理解しづらい状況です。

**ドキュメント完備（16個）**:
- ✅ miyabi-types
- ✅ miyabi-core
- ✅ miyabi-worktree
- ✅ miyabi-github
- ✅ miyabi-agents
- ✅ miyabi-cli
- ✅ miyabi-agent-coordinator
- ✅ miyabi-agent-codegen
- ... その他

**ドキュメント不足（7個）**:
- ❌ miyabi-agent-review
- ❌ miyabi-agent-workflow
- ❌ miyabi-agent-business
- ❌ miyabi-potpie
- ❌ miyabi-benchmark
- ❌ miyabi-mcp-server
- ❌ miyabi-discord-mcp-server

#### 🎯 目標
全23クレートのREADME.mdを整備し、開発者体験を向上させる。

#### ✅ 実施内容

##### Phase 1: テンプレート作成（1週間）
- [ ] README.mdテンプレート作成
  - Overview
  - Features
  - Installation
  - Usage Examples
  - API Reference
  - Testing
  - Contributing
- [ ] コード例の準備

##### Phase 2: Agent系クレート（2週間）
- [ ] miyabi-agent-review README.md
  - 品質スコアリングの仕組み
  - Clippy連携の使い方
  - カスタムルールの追加方法
- [ ] miyabi-agent-workflow README.md
  - State管理の仕組み
  - Label操作のAPI
  - Hook実行フロー
- [ ] miyabi-agent-business README.md
  - BusinessAgent traitの使い方
  - 8-Phase planningの詳細
  - バリデーション例

##### Phase 3: Integration系クレート（1週間）
- [ ] miyabi-potpie README.md
  - Neo4j統合の設定
  - RAG Engineの使い方
  - Code Graphの構築例
- [ ] miyabi-benchmark README.md
  - SWE-bench Pro統合
  - Dockerハーネスの使い方
  - 評価メトリクスの解説

##### Phase 4: Application系クレート（1週間）
- [ ] miyabi-mcp-server README.md
  - JSON-RPC 2.0 仕様
  - stdio/HTTP transports
  - Codex統合例
- [ ] miyabi-discord-mcp-server README.md
  - Discord Bot設定
  - コマンド一覧
  - MCP統合

##### Phase 5: Rustdoc拡充（1週間）
- [ ] すべてのpublic APIにドキュメント追加
- [ ] コード例の追加（doctest）
- [ ] `cargo doc --open`で完全なAPIリファレンス生成

#### 📈 成功基準
- ✅ 全23クレートでREADME.md完備
- ✅ Rustdoc カバレッジ100%（public API）
- ✅ コード例50個以上
- ✅ doctestすべてパス
- ✅ cargo-readmeでの自動生成対応

#### 🏷️ Labels
- `📚 type:docs`
- `🏗️ phase:documentation`
- `🔥 priority:P2-Medium`
- `⭐ quality:excellent`

#### 📅 Timeline
- **開始**: 2025-10-23
- **完了予定**: 2025-11-20（4週間）

#### 📚 関連ドキュメント
- [TEMPLATE_MASTER_INDEX.md](../docs/TEMPLATE_MASTER_INDEX.md)
- [INTEGRATION_VISUALIZATION.md](./INTEGRATION_VISUALIZATION.md)

---

## 📊 Issue起票サマリー

| Issue | Title | Priority | Timeline | Complexity |
|-------|-------|----------|----------|------------|
| #1 | Legacy Code削除 | P1-High | 3週間 | Medium |
| #2 | Business Agents実装 | P2-Medium | 8週間 | High |
| #3 | 統合テスト拡充 | P1-High | 4週間 | Medium |
| #4 | ドキュメント整備 | P2-Medium | 4週間 | Low |

**Total Timeline**: 19週間（並行実行可能）

---

## 🎯 実行計画

### Sprint 1（Week 1-4）
- Issue #1: Legacy Code削除（Phase 1-2）
- Issue #3: 統合テスト拡充（Phase 1-2）
- Issue #4: ドキュメント整備（Phase 1）

### Sprint 2（Week 5-8）
- Issue #1: Legacy Code削除（Phase 3完了）
- Issue #3: 統合テスト拡充（Phase 3-4完了）
- Issue #2: Business Agents実装（Phase 1-2）
- Issue #4: ドキュメント整備（Phase 2-3）

### Sprint 3（Week 9-12）
- Issue #2: Business Agents実装（Phase 3-4）
- Issue #4: ドキュメント整備（Phase 4-5完了）

### Sprint 4（Week 13-16）
- Issue #2: Business Agents実装（Phase 5完了）
- 全体の統合テスト・品質チェック

---

**生成者**: Claude Code
**生成日時**: 2025-10-22
