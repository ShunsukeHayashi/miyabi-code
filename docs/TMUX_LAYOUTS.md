# Miyabi tmux Layouts - Visual Guide

**実際のtmuxレイアウトとMiyabiエージェント配置例**

---

## 📖 目次

1. [Layout Gallery](#layout-gallery)
   - [Layout 1: 5-Pane Coding Pipeline](#layout-1-5-pane-coding-pipeline-推奨---issue処理)
   - [Layout 2: 7-Pane Hybrid](#layout-2-7-pane-hybrid-推奨---coding--business)
   - [Layout 3: 9-Pane Massive Parallel](#layout-3-9-pane-massive-parallel-上級者向け)
2. [タスク種類別おすすめLayout](#タスク種類別おすすめlayout)
3. [Layout Customization](#layout-customization)
4. [Performance Comparison](#performance-comparison)
5. [Layout Best Practices](#layout-best-practices)
6. [関連リンク](#関連リンク)

---

## 📋 前提条件

⚠️ **このドキュメントは、tmux操作の基本を理解している方向けです。**

**初めての方へ**:
1. [QUICK_START_3STEPS.md](./QUICK_START_3STEPS.md) - 3分でセットアップ
2. [TMUX_QUICKSTART.md](./TMUX_QUICKSTART.md) - 5分で基本操作
3. このドキュメント - レイアウト詳細

---

## 📖 Miyabi Entity-Relation Model

このドキュメントで扱うEntity:
- **E3 (Agent)**: 自律実行Agent（Coding: CodeGen/Review/PR/Deployment、Business: MarketResearch/Content/Analytics）
- **E2 (Task)**: Issueから分解されたタスク
- **E11 (DAG)**: タスク依存グラフ（並列実行の計画）
- **E12 (Worktree)**: Git Worktree（並列実行環境）

主要Relationship:
- **R9**: Agent executes Task（AgentがTaskを実行）
- **R8**: Task runs-in Worktree（タスクがWorktree内で実行）
- **R2**: Issue decomposed-into Task（IssueがTaskに分解される）

詳細: [ENTITY_RELATION_MODEL.md](../docs/architecture/ENTITY_RELATION_MODEL.md)

### 💡 用語の使い分け

- **Agent**: Miyabiの自律実行エージェント（E3）
  - **Coding Agents**: CodeGen, Review, PR, Deployment
  - **Business Agents**: MarketResearch, Content, Analytics, SNS Strategy
- **Worker**: tmux pane内で動作するClaude Codeインスタンス
- **関係**: 1つのWorkerが1つのAgentを実行します

**このドキュメントでは**、レイアウト図で「Worker1」等と表記していますが、これはClaude Codeインスタンスを指し、その内部で動作するAgent（CodeGenAgentなど）と区別しています。

---

## 🎨 Layout Gallery

### Layout 1: 5-Pane Coding Pipeline (推奨 - Issue処理)

**構成**: Main + 4 Coding Agents

**用途**: Issue #270の完全パイプライン（分析→実装→レビュー→PR→デプロイ）

```
┌──────────────────────────────────────────────────────────────────┐
│ Pane 0: Main (Coordinator) - %22                                │
│ $ tmux list-panes -F "#{pane_index}: #{pane_id}"                │
│                                                                  │
│ [Worker1] Issue #270 コード実装完了。46行追加、3テスト追加。        │
│ [Worker2] レビュー完了。品質スコア: 85/100。修正提案2件。           │
│ [Worker3] PR作成完了。PR #674 "feat: Add feature X"               │
├─────────────────────────────┬────────────────────────────────────┤
│ Pane 1: CodeGenAgent - %27  │ Pane 2: ReviewAgent - %28          │
│                             │                                    │
│ > agent-execution           │ > agent-execution                  │
│ Running Issue #270...       │ Waiting for Worker1...             │
│ Writing code...             │                                    │
│ [█████████░░] 90%           │ Ready to review                    │
├─────────────────────────────┼────────────────────────────────────┤
│ Pane 3: PRAgent - %25       │ Pane 4: DeploymentAgent - %29      │
│                             │                                    │
│ > agent-execution           │ > agent-execution                  │
│ Waiting for Worker2...      │ Waiting for PR merge...            │
│                             │                                    │
│ Ready to create PR          │ Deploy pending                     │
└─────────────────────────────┴────────────────────────────────────┘
```

**実行コマンド**:
```bash
./scripts/tmux-demo.sh 5pane

# Task assignment
tmux send-keys -t %27 "Issue #270のコード実装。agent-executionスキル使用。完了後は[Worker1]で報告。" Enter
tmux send-keys -t %28 "Worker1完了後にコードレビュー実施。完了後は[Worker2]で報告。" Enter
tmux send-keys -t %25 "Worker2完了後にPR作成。完了後は[Worker3]で報告。" Enter
tmux send-keys -t %29 "PR承認後にデプロイ実行。完了後は[Worker4]で報告。" Enter
```

---

### Layout 2: 7-Pane Hybrid (推奨 - Coding + Business)

**構成**: Main + 3 Coding + 3 Business Agents

**用途**: 技術実装とビジネス戦略を同時進行

```
┌──────────────────────────────────────────────────────────────────┐
│ Pane 0: Main (Coordinator) - %22                                │
│                                                                  │
│ [CodeGen] Issue #270実装完了                                      │
│ [Review] レビュー完了。品質スコア: 88/100                            │
│ [MarketResearch] 競合分析完了。20社分析済み。                        │
│ [Content] ブログ記事3本作成完了。SEO最適化済み。                      │
├──────────────┬───────────────┬──────────────┬───────────────────┤
│ Pane 1:      │ Pane 2:       │ Pane 3:      │ Pane 4:           │
│ CodeGen      │ Review        │ PR           │ MarketResearch    │
│ %27          │ %28           │ %25          │ %29               │
│              │               │              │                   │
│ > Coding...  │ > Reviewing.. │ > Creating PR│ > Analyzing...    │
│ [████░░] 80% │ [██████░] 90% │ [█░░░░░] 20% │ [████████] 100%   │
├──────────────┴───────────────┴──────────────┼───────────────────┤
│ Pane 5: ContentCreation - %30                │ Pane 6: Analytics │
│                                              │ %31               │
│ > content-marketing-strategy                 │                   │
│ Creating blog articles...                    │ > Analyzing...    │
│ - Article 1: "How to use Miyabi" ✅           │ KPI tracking...   │
│ - Article 2: "Agent Architecture" 🚧          │ [██████░] 90%     │
│ - Article 3: "Best Practices" 📝              │                   │
└──────────────────────────────────────────────┴───────────────────┘
```

**実行コマンド**:
```bash
./scripts/tmux-demo.sh 7pane

# Coding Agents (pane 1-3)
tmux send-keys -t %27 "CodeGenAgent: Issue #270実装。完了後は[CodeGen]で報告。" Enter
tmux send-keys -t %28 "ReviewAgent: Worker1完了後レビュー。完了後は[Review]で報告。" Enter
tmux send-keys -t %25 "PRAgent: Worker2完了後PR作成。完了後は[PR]で報告。" Enter

# Business Agents (pane 4-6)
tmux send-keys -t %29 "MarketResearchAgent: 競合20社分析。business-strategy-planningスキル。完了後は[MarketResearch]で報告。" Enter
tmux send-keys -t %30 "ContentCreationAgent: ブログ記事3本作成。content-marketing-strategyスキル。完了後は[Content]で報告。" Enter
tmux send-keys -t %31 "AnalyticsAgent: KPI分析。growth-analytics-dashboardスキル。完了後は[Analytics]で報告。" Enter
```

---

### Layout 3: 9-Pane Massive Parallel (上級者向け)

**構成**: Main + 4 Coding + 4 Business Agents

**用途**: 大規模プロジェクト立ち上げ（技術実装+フルビジネス戦略）

```
┌──────────────────────────────────────────────────────────────────┐
│ Pane 0: Main - %22                                              │
│ Massive Parallel Execution - 8 Agents Running                   │
└──────────────────────────────────────────────────────────────────┘
┌────────────────┬────────────────┬────────────────┬──────────────┤
│ Pane 1:        │ Pane 2:        │ Pane 3:        │ Pane 4:      │
│ Coordinator    │ CodeGen        │ Review         │ PR           │
│ %27            │ %28            │ %25            │ %29          │
│ 📋 Planning... │ 💻 Coding...   │ 🔍 Reviewing...│ 📤 PR...     │
├────────────────┼────────────────┼────────────────┼──────────────┤
│ Pane 5:        │ Pane 6:        │ Pane 7:        │ Pane 8:      │
│ MarketResearch │ Persona        │ Content        │ SNS Strategy │
│ %30            │ %31            │ %32            │ %33          │
│ 📊 Research... │ 👤 Personas... │ ✍️  Writing...  │ 📱 SNS...    │
└────────────────┴────────────────┴────────────────┴──────────────┘
```

⚠️ **警告**: 9-pane構成はトークン消費が激しいです。MAX($100)プランでも注意。

**適用場面**:
- 新規プロダクト立ち上げ
- 大規模リファクタリング + マーケティング同時展開
- スプリント最終日の総仕上げ

---

## 🎯 タスク種類別おすすめLayout

### 📝 シナリオ1: Issue大量処理

**目的**: Issue #270-275の6件を並列処理

**推奨Layout**: 7-Pane (Main + 6 Workers)

**実行例**:
```bash
./scripts/tmux-demo.sh 7pane

# 各Workerに1 Issueずつ割り当て
tmux send-keys -t %27 "Issue #270処理。agent-executionスキル。完了後は[W1]で報告。" Enter
tmux send-keys -t %28 "Issue #271処理。agent-executionスキル。完了後は[W2]で報告。" Enter
tmux send-keys -t %25 "Issue #272処理。agent-executionスキル。完了後は[W3]で報告。" Enter
tmux send-keys -t %29 "Issue #273処理。agent-executionスキル。完了後は[W4]で報告。" Enter
tmux send-keys -t %30 "Issue #274処理。agent-executionスキル。完了後は[W5]で報告。" Enter
tmux send-keys -t %31 "Issue #275処理。agent-executionスキル。完了後は[W6]で報告。" Enter
```

**代替案**: Miyabi CLI（よりシンプル）
```bash
miyabi parallel --issues 270,271,272,273,274,275 --concurrency 6
```

---

### 📝 シナリオ2: 新機能フルパイプライン

**目的**: Issue #270の完全実装（分析→実装→レビュー→テスト→PR→デプロイ）

**推奨Layout**: 5-Pane Coding Pipeline

**実行例**:
```bash
./scripts/tmux-demo.sh 5pane

# Sequential pipeline
tmux send-keys -t %27 "Worker1 CodeGenAgent: Issue #270実装。完了後は[W1]で報告。" Enter
tmux send-keys -t %28 "Worker2 ReviewAgent: W1完了後にレビュー。完了後は[W2]で報告。" Enter
tmux send-keys -t %25 "Worker3 PRAgent: W2完了後にPR作成。完了後は[W3]で報告。" Enter
tmux send-keys -t %29 "Worker4 DeploymentAgent: PR承認後にデプロイ。完了後は[W4]で報告。" Enter
```

---

### 📝 シナリオ3: プロダクト立ち上げ

**目的**: 技術実装 + ビジネス戦略 + マーケティング同時進行

**推奨Layout**: 9-Pane Massive Parallel

**実行例**:
```bash
# Custom 9-pane layout
tmux split-window -h && \
tmux split-window -h && \
tmux split-window -h && \
tmux select-pane -t 0 && \
tmux split-window -v && \
tmux select-pane -t 2 && \
tmux split-window -v && \
tmux select-pane -t 4 && \
tmux split-window -v && \
tmux select-pane -t 6 && \
tmux split-window -v

# Start Claude Code in all panes
# (Same as tmux-demo.sh)

# Assign tasks
# Coding Track (pane 1-4)
tmux send-keys -t %27 "CoordinatorAgent: プロジェクト全体調整。" Enter
tmux send-keys -t %28 "CodeGenAgent: MVP実装。" Enter
tmux send-keys -t %25 "ReviewAgent: コードレビュー。" Enter
tmux send-keys -t %29 "DeploymentAgent: デプロイ。" Enter

# Business Track (pane 5-8)
tmux send-keys -t %30 "MarketResearchAgent: 市場調査20社分析。business-strategy-planningスキル。" Enter
tmux send-keys -t %31 "PersonaAgent: ターゲット顧客5ペルソナ作成。business-strategy-planningスキル。" Enter
tmux send-keys -t %32 "ContentCreationAgent: ランディングページ+ブログ3本。content-marketing-strategyスキル。" Enter
tmux send-keys -t %33 "SNSStrategyAgent: Twitter/Instagram戦略。content-marketing-strategyスキル。" Enter
```

---

## 🔧 Layout Customization

### カスタムレイアウト作成

```bash
# 3x3 Grid (9 panes)
tmux split-window -h && \
tmux split-window -h && \
tmux select-pane -t 0 && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 3 && \
tmux split-window -v && \
tmux split-window -v && \
tmux select-pane -t 6 && \
tmux split-window -v && \
tmux split-window -v

# Apply tiled layout
tmux select-layout tiled
```

### レイアウト保存

```bash
# Current layout情報を取得
tmux list-windows -F "#{window_layout}"

# 出力例:
# 1a2b,159x48,0,0{79x48,0,0,1,79x48,80,0[79x23,80,0,2,79x24,80,24,3]}

# .tmux.conf に保存して再利用
# bind-key M-1 select-layout "1a2b,159x48,0,0{...}"
```

---

## 📊 Performance Comparison

### 実測データ（Issue #270-275の6件処理）

| Method | Setup Time | Execution Time | Total Time | Flexibility | Learning Curve |
|--------|------------|----------------|------------|-------------|----------------|
| **Sequential** | 0s | 60min | 60min | ⭐ | ⭐⭐⭐⭐⭐ |
| **Miyabi CLI** | 10s | 15min | 15min 10s | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **tmux 3-pane** | 2min | 20min | 22min | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **tmux 6-pane** | 3min | 12min | 15min | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**結論**:
- **定型処理**: Miyabi CLI最速（セットアップ+実行が最短）
- **柔軟性**: tmux 6-paneが最強（異種Agent並列実行可能）

---

## 🎨 Layout Best Practices

### ✅ DO

1. **目的に合ったLayout選択**
   - Issue処理: 5-pane Coding Pipeline
   - ビジネス+技術: 7-pane Hybrid
   - 大規模: 9-pane Massive

2. **pane数は必要最小限に**
   - トークン消費を抑える
   - 管理コスト削減

3. **明確な役割分担**
   - 各paneに具体的なAgent役割を割り当て
   - 重複タスクを避ける

### ❌ DON'T

1. **過度な並列化**
   - 10+ panesは管理が困難
   - トークン消費が激しい

2. **役割の曖昧さ**
   - "何かやっといて"は避ける
   - 具体的な完了条件を設定

3. **報連相の省略**
   - 必ず報告プロトコルを設定
   - メインからの可視性確保

---

## 🔗 関連リンク

- **詳細ガイド**: [.claude/TMUX_OPERATIONS.md](../.claude/TMUX_OPERATIONS.md)
- **クイックスタート**: [TMUX_QUICKSTART.md](./TMUX_QUICKSTART.md)
- **Agent仕様**: [.claude/context/agents.md](../.claude/context/agents.md)

---

**Happy Layout Designing! 🎨**
