# 🏗️ Miyabi Console - Information Architecture Analysis

**Date**: 2025-11-19
**Type**: IA (Information Architecture) Review
**Purpose**: Improve user comprehension and navigation

---

## 🔍 Current State Analysis

### Current Page Structure

```
Miyabi Console (Current)
├── Dashboard (全体概要)
├── Agents (14エージェント一覧)
├── Deployment (デプロイパイプライン)
├── Infrastructure (インフラ状態)
└── Database (DBスキーマ)
```

---

## ❌ Identified Problems

### 1. **情報の階層構造が不明確**

**問題**:
- 各ページが「横並び」で、親子関係や優先順位が分からない
- ユーザーが「どこから見るべきか」が不明
- ページ間の関連性が見えない

**例**:
```
現在: Dashboard / Agents / Deployment / Infrastructure / Database
     ↑ 全て同じレベル → 何から見ればいい？
```

---

### 2. **コンテキストの欠如**

**問題**:
- Deployment ページを見ても「何をデプロイしているのか」が不明
- Infrastructure ページが「どのAgentが使っているのか」が分からない
- Database スキーマが「どのAgentのデータか」が不明

**例**:
```
Deployment ページ:
  "VPC Networking" を構築中
  ↑ でも「これは何のため？」が分からない
```

---

### 3. **ナビゲーションのグルーピング不足**

**問題**:
- 5つのページが全て「フラット」に並んでいる
- 論理的なカテゴリ分けがない
- ユーザーが目的に応じてページを探せない

**現在のナビゲーション**:
```
[Dashboard] [Agents] [Deployment] [Infrastructure] [Database]
```

**ユーザーの疑問**:
- 「システムの健全性を見たい」 → どこ？
- 「Agent を管理したい」 → Agents? Dashboard?
- 「デプロイ状況を見たい」 → Deployment? Infrastructure?

---

### 4. **情報の重複と分散**

**問題**:
- Dashboard に全体統計
- Infrastructure にもシステム統計
- → 「どちらが正確？」「どちらを見るべき？」

**例**:
```
Dashboard:
  - Active Agents: 0/14
  - Running Tasks: 0

Infrastructure:
  - Docker Containers: X
  - Active Services: Y

↑ 両方に「システム状態」があるが関連性不明
```

---

### 5. **ユーザーゴールとページのミスマッチ**

**ユーザーの典型的なゴール**:
1. 「システムは正常に動いているか？」
2. 「Agent が正しく動作しているか？」
3. 「デプロイは成功したか？」
4. 「データは正しく保存されているか？」
5. 「問題が起きている場所は？」

**現在のページ構成**:
- これらのゴールに対する「最適なページ」が不明確
- ユーザーが複数ページを行き来する必要がある

---

## 💡 改善案: 3層IA構造

### 提案1: タスクベース階層構造

```
Miyabi Console (Improved)

📊 Overview (概要) ← Primary
  ├── Dashboard (システム全体の健全性)
  │   ├── System Health (CPU/Memory/Status)
  │   ├── Active Agents (14 Agents概要)
  │   └── Recent Activity (最近のタスク)
  └── Quick Actions (よく使う操作)

🤖 Agents (エージェント管理) ← Core
  ├── Agents Overview (全Agent一覧)
  ├── Layer View (Layer別表示)
  ├── Agent Details (個別Agent詳細)
  └── Agent Logs (ログ・履歴)

🚀 Operations (運用) ← Secondary
  ├── Deployment Pipeline (デプロイ)
  │   ├── Current Deployment
  │   ├── Deployment History
  │   └── Rollback Options
  ├── Infrastructure (インフラ)
  │   ├── Services Status
  │   ├── Docker Containers
  │   └── Resource Usage
  └── Database (データベース)
      ├── Schema & ERD
      ├── Table Statistics
      └── Query Performance

📈 Monitoring (監視) ← Tertiary
  ├── System Metrics
  ├── Agent Performance
  └── Error Logs
```

---

### 提案2: ユーザーロール別IA

```
Miyabi Console (Role-Based)

👨‍💼 For Managers (マネージャー向け)
  ├── Executive Dashboard
  │   └── High-level KPIs
  ├── Agent Performance
  │   └── Task completion rates
  └── System Health
      └── Uptime / Issues

👨‍💻 For Developers (開発者向け)
  ├── Agent Development
  │   ├── Agent Logs
  │   └── Debug Tools
  ├── Deployment
  │   └── Pipeline Status
  └── Database
      └── Schema / Queries

⚙️ For Operators (運用者向け)
  ├── Infrastructure
  │   ├── Services
  │   └── Resources
  ├── Monitoring
  │   └── Alerts / Logs
  └── Maintenance
      └── Scheduled Tasks
```

---

### 提案3: フロー重視IA

```
Miyabi Console (Flow-Based)

1️⃣ Start Here (最初に見るべき)
  └── Dashboard
      ├── System Status (正常/異常を一目で)
      ├── Critical Alerts (緊急事項)
      └── Next Actions (やるべきこと)

2️⃣ Daily Operations (日常業務)
  ├── Agents (Agent管理)
  │   ├── Check Status
  │   └── Review Tasks
  └── Monitoring (監視)
      └── Check Metrics

3️⃣ When Deploying (デプロイ時)
  └── Deployment
      ├── Pre-deploy Check
      ├── Deploy Execution
      └── Post-deploy Verify

4️⃣ When Issues Occur (問題発生時)
  ├── Diagnostics (診断)
  │   ├── Error Logs
  │   └── System Health
  └── Recovery (復旧)
      ├── Rollback
      └── Restart Services

5️⃣ Deep Dive (詳細調査)
  ├── Infrastructure (インフラ詳細)
  └── Database (DB詳細)
```

---

## 🎯 推奨改善アクション

### Phase 1: ナビゲーション改善 (即座)

**現在**:
```tsx
<nav>
  <Link to="/">Dashboard</Link>
  <Link to="/agents">Agents</Link>
  <Link to="/deployment">Deployment</Link>
  <Link to="/infrastructure">Infrastructure</Link>
  <Link to="/database">Database</Link>
</nav>
```

**改善後**:
```tsx
<nav>
  {/* Primary */}
  <Link to="/">Overview</Link>

  {/* Core */}
  <Link to="/agents">Agents</Link>

  {/* Secondary - Grouped */}
  <div className="nav-group">
    <span>Operations</span>
    <Link to="/deployment">Deployment</Link>
    <Link to="/infrastructure">Infrastructure</Link>
    <Link to="/database">Database</Link>
  </div>
</nav>
```

---

### Phase 2: Dashboard 再設計 (優先度高)

**目的**: Dashboard を「システムの入り口」にする

**現在の問題**:
```
Dashboard:
  - 統計数値が並んでいるだけ
  - 「次に何をすべきか」が不明
  - 他のページへの導線がない
```

**改善案**:
```tsx
<DashboardPageImproved>
  {/* Hero: System Status (一目で状態確認) */}
  <section>
    <h1>System Status</h1>
    <StatusIndicator status="healthy" /> {/* 正常/警告/エラー */}
    <p>All 14 agents running normally</p>
  </section>

  {/* Critical Alerts (緊急事項) */}
  {hasAlerts && (
    <section>
      <h2>Critical Alerts</h2>
      <AlertList alerts={criticalAlerts} />
    </section>
  )}

  {/* Quick Stats (主要指標) */}
  <section>
    <StatCard>
      <Link to="/agents">
        <h3>Agents</h3>
        <p>14 Active</p>
        <span>View All →</span>
      </Link>
    </StatCard>

    <StatCard>
      <Link to="/deployment">
        <h3>Deployment</h3>
        <p>Stage 3/7</p>
        <span>View Pipeline →</span>
      </Link>
    </StatCard>
  </section>

  {/* Recent Activity (最近の活動) */}
  <section>
    <h2>Recent Activity</h2>
    <ActivityFeed limit={5} />
    <Link to="/activity">View All Activity →</Link>
  </section>

  {/* Quick Actions (よく使う操作) */}
  <section>
    <h2>Quick Actions</h2>
    <Button to="/deployment">Deploy Now</Button>
    <Button to="/agents">Manage Agents</Button>
  </section>
</DashboardPageImproved>
```

---

### Phase 3: ページ間コンテキスト追加 (優先度中)

**例: Deployment ページ**

**現在**:
```
Deployment Pipeline
- VPC Networking (実行中)
```

**改善後**:
```
Deployment Pipeline

Context:
  Purpose: M1 Infrastructure Blitz - 7-Day Deployment
  Target: Production Environment
  Affects: 14 Agents, Database, Infrastructure

Current Stage: VPC Networking (3/7)
  ↑ これが完了すると → ECS Cluster Setup

Related:
  - Infrastructure Status → View current resources
  - Agents → Will be deployed after Stage 7
```

---

### Phase 4: ブレッドクラム追加 (優先度中)

**現在**: ページ間の関係が不明

**改善後**:
```
Overview > Operations > Deployment > Stage 3: VPC Networking

↑ ユーザーの現在位置と階層構造が分かる
```

---

### Phase 5: コンテキスト型ナビゲーション (優先度低)

**例: Agent詳細ページ**

**現在**: 静的ナビゲーション

**改善後**: 文脈依存型ナビゲーション
```
Agent: CodeGenAgent 詳細表示中

Related Pages:
  - View Logs for this Agent
  - Check Database tables used by this Agent
  - See Infrastructure resources allocated
  - View recent Deployments affecting this Agent
```

---

## 📊 改善効果の測定

### Before (現在)

| 指標 | 値 |
|------|-----|
| ページの論理的階層 | ❌ なし（全てフラット） |
| ページ間の関連性表示 | ❌ なし |
| ユーザーゴールへの最短パス | ❌ 不明確 |
| コンテキスト情報 | ❌ 最小限 |
| ナビゲーションのグルーピング | ❌ なし |

### After (改善後)

| 指標 | 値 |
|------|-----|
| ページの論理的階層 | ✅ 3層構造 |
| ページ間の関連性表示 | ✅ "Related" セクション |
| ユーザーゴールへの最短パス | ✅ Dashboard から 1-2 クリック |
| コンテキスト情報 | ✅ 各ページに Purpose/Context |
| ナビゲーションのグルーピング | ✅ Primary/Core/Secondary |

---

## 🚀 実装優先順位

### 🔴 P0: Immediate (今すぐ)

1. **ナビゲーションのグルーピング**
   - Layout.tsx を更新
   - Primary/Core/Secondary に分類
   - 工数: 30分

---

### 🟡 P1: High (今週)

2. **Dashboard 再設計**
   - System Status indicator 追加
   - Quick Actions セクション追加
   - Related Pages リンク追加
   - 工数: 2-3時間

3. **ブレッドクラム追加**
   - 全ページに階層構造表示
   - 工数: 1時間

---

### 🟢 P2: Medium (今月)

4. **ページ間コンテキスト追加**
   - "Purpose" セクション (各ページの目的)
   - "Related" セクション (関連ページへのリンク)
   - 工数: 3-4時間

5. **Activity Feed 統合**
   - 全ページの Recent Activity 統合
   - 工数: 2-3時間

---

### 🔵 P3: Low (将来)

6. **コンテキスト型ナビゲーション**
   - ページ内容に応じた動的ナビゲーション
   - 工数: 5-6時間

7. **ユーザーロール対応**
   - Manager/Developer/Operator 別表示
   - 工数: 10+時間

---

## 💬 ユーザーへの質問

### 1. どの改善案が最も分かりやすいですか？

**A. タスクベース階層構造** (提案1)
```
Overview / Agents / Operations / Monitoring
```

**B. ユーザーロール別** (提案2)
```
For Managers / For Developers / For Operators
```

**C. フロー重視** (提案3)
```
Start Here / Daily Operations / When Deploying / When Issues / Deep Dive
```

---

### 2. 現在のページで「最も分かりにくい」のはどれですか？

- [ ] Dashboard (何を見るべきか不明)
- [ ] Agents (情報が多すぎる)
- [ ] Deployment (コンテキスト不足)
- [ ] Infrastructure (他との関連不明)
- [ ] Database (専門的すぎる)

---

### 3. 優先的に改善すべき機能は？

- [ ] ナビゲーションのグルーピング (P0)
- [ ] Dashboard 再設計 (P1)
- [ ] ページ間コンテキスト追加 (P2)
- [ ] その他（具体的に教えてください）

---

## 📝 次のステップ

ユーザーの回答に基づいて、以下を実施します：

1. ✅ **選択された改善案の詳細設計**
2. ✅ **Ive デザイン原則に従った実装**
3. ✅ **段階的ロールアウト**
4. ✅ **ユーザーフィードバック収集**

---

**Status**: ⏳ ユーザーからのフィードバック待ち
**Created**: 2025-11-19
**Next**: ユーザーの選択に基づいた実装開始

---

**"Good design is obvious. Great design is transparent."** - Joe Sparano

**Miyabi Console を Great Design にしましょう。**
