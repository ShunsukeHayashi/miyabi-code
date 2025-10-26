# Miyabi WebUIダッシュボード - 技術設計書

**作成日**: 2025-10-19
**バージョン**: v1.0.0
**ステータス**: 設計フェーズ

---

## 📋 概要

Miyabiの全Agent実行状況を可視化し、リアルタイムで監視・制御できるWebダッシュボード。
日本市場の要件（完璧主義・リスク回避・日本語最優先）に完全対応した設計。

### ビジョン

> "見えないスタッフ（Agent）の働きを、オフィスのガラス越しに見るような体験"

- 👀 **透明性**: Agent実行履歴を完全に可視化
- 🎯 **信頼性**: 品質スコアとエラーログの詳細表示
- 🇯🇵 **日本語対応**: 完全日本語UIと日本語ログ
- 📊 **データ駆動**: GitHub Projects V2 APIをデータソースとして活用

---

## 🎯 日本市場要件への対応

### 1. 完璧主義 (Perfectionism)

**課題**: "AIが間違えたら責任を取れない"

**対応策**:
- ✅ 品質スコア表示（0-100点）+ 合格/不合格判定
- ✅ 実行前プレビュー機能（"このAgentは何をするか"を事前表示）
- ✅ 手動承認ゲート（重要な操作は人間の承認必須）
- ✅ 完全なログ記録（監査証跡）

### 2. リスク回避 (Risk Aversion)

**課題**: "まず小さく試す"

**対応策**:
- ✅ サンドボックスモード（安全な実験環境）
- ✅ ロールバック機能（1クリックで前の状態に戻す）
- ✅ 段階的機能開放（最初は読み取り専用→徐々に書き込み権限）
- ✅ デモモード（実データを触らずに体験）

### 3. 日本語最優先 (Japanese-First)

**課題**: "英語ドキュメントは読まない"

**対応策**:
- ✅ 完全日本語UI（設定・ログ・エラーメッセージすべて）
- ✅ 日本語音声ガイド（SuperWhisper統合）
- ✅ 日本語ドキュメント埋め込み（コンテキストヘルプ）
- ✅ 日本語エラーメッセージ + 解決策提案

---

## 🏗️ アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14 + TypeScript + Tailwind CSS)           │
│ - Server Components for SSR                                 │
│ - Client Components for interactivity                       │
│ - Vercel Edge Functions for API routes                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ WebSocket + REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Rust + Axum + Tokio)                               │
│ - WebSocket server (リアルタイム更新)                         │
│ - REST API endpoints (CRUD操作)                             │
│ - Agent execution orchestration                             │
│ - Cloud Run (Serverless Container)                          │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ GitHub       │  │ Discord      │  │ Lark/Feishu  │
│ Projects V2  │  │ Webhook      │  │ OpenAPI      │
│ API          │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 技術スタック

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **State Management**: Zustand + React Query
- **WebSocket**: Socket.io-client
- **Charts**: Recharts + Tremor
- **i18n**: next-intl (日本語・英語対応)
- **Deployment**: Vercel

#### Backend
- **Language**: Rust 2021 Edition
- **Framework**: Axum 0.7 + Tokio 1.35
- **WebSocket**: tokio-tungstenite
- **Database**: GitHub Projects V2 API (GraphQL)
- **Authentication**: GitHub OAuth + JWT
- **Deployment**: Google Cloud Run

#### Infrastructure
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry (Frontend/Backend)
- **Analytics**: Vercel Analytics + Google Analytics 4
- **CI/CD**: GitHub Actions
- **Secrets**: GitHub Secrets + Google Secret Manager

---

## 📱 画面設計

### 1. ダッシュボード（ホーム画面）

**目的**: Agent実行状況の全体像を一目で把握

**レイアウト**:
```
┌────────────────────────────────────────────────────────┐
│ 🏠 Miyabi Dashboard                    👤 User  ⚙️     │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 今日の実行サマリー                                    │
│  ┌──────┬──────┬──────┬──────┐                        │
│  │ 実行中 │ 成功  │ 失敗  │ 待機中 │                        │
│  │  3   │  42  │  1   │  5   │                        │
│  └──────┴──────┴──────┴──────┘                        │
│                                                        │
│  🤖 Agent稼働状況                                       │
│  ┌────────────────────────────────────────────┐       │
│  │ しきるん (CoordinatorAgent)    ⚙️ 実行中      │       │
│  │ Issue #270のタスク分解中...                   │       │
│  │ 進捗: ████████░░ 80% (推定残り: 2分)          │       │
│  │                                            │       │
│  │ つくるん (CodeGenAgent)        ✅ 完了       │       │
│  │ Issue #269の実装完了 (品質スコア: 95/100)      │       │
│  │                                            │       │
│  │ めだまん (ReviewAgent)         ⏳ 待機中      │       │
│  │ Issue #270のレビュー待ち                      │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  📈 品質トレンド (過去7日間)                              │
│  ┌────────────────────────────────────────────┐       │
│  │      100 ┤     ●─●─●                        │       │
│  │       90 ┤   ●─┘   └─●                      │       │
│  │       80 ┤ ●─┘         └─●                  │       │
│  │       70 ┤                 └─●              │       │
│  │        0 └─┬──┬──┬──┬──┬──┬──┬─            │       │
│  │          月 火 水 木 金 土 日                 │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  🔔 最新通知                                           │
│  ┌────────────────────────────────────────────┐       │
│  │ ✅ Issue #269 実装完了 - Discord通知送信済み    │       │
│  │ ⚠️ Issue #268 レビュー失敗 - 品質スコア: 65/100│       │
│  │ 📋 Issue #270 作成 - しきるんに割り当て済み      │       │
│  └────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

**コンポーネント**:
- `DashboardSummary`: 実行サマリーカード（4つの数値指標）
- `AgentStatusList`: Agent稼働状況リスト（リアルタイム更新）
- `QualityTrendChart`: 品質トレンドグラフ（7日間）
- `NotificationFeed`: 最新通知フィード（WebSocket経由）

---

### 2. Agent実行履歴画面

**目的**: 過去のAgent実行を詳細に分析

**レイアウト**:
```
┌────────────────────────────────────────────────────────┐
│ 📜 Agent実行履歴                       🔍 検索・フィルター │
├────────────────────────────────────────────────────────┤
│                                                        │
│ フィルター:                                              │
│ [Agent: 全て ▼] [ステータス: 全て ▼] [期間: 過去7日 ▼]     │
│                                                        │
│ ┌────┬──────┬────────┬──────┬──────┬─────┐           │
│ │時刻│Agent │Issue   │ステータス│品質  │詳細 │           │
│ ├────┼──────┼────────┼──────┼──────┼─────┤           │
│ │14:30│つくるん│#270   │✅ 完了 │95/100│[詳細]│           │
│ │14:15│しきるん│#270   │✅ 完了 │  -   │[詳細]│           │
│ │13:50│めだまん│#269   │❌ 失敗 │65/100│[詳細]│           │
│ │13:20│つくるん│#269   │✅ 完了 │88/100│[詳細]│           │
│ │12:45│しきるん│#269   │✅ 完了 │  -   │[詳細]│           │
│ └────┴──────┴────────┴──────┴──────┴─────┘           │
│                                                        │
│ ページ: [1] 2 3 ... 10  (合計: 247件)                    │
└────────────────────────────────────────────────────────┘
```

**機能**:
- 📅 期間フィルター: 今日/過去7日/過去30日/カスタム
- 🤖 Agentフィルター: 全Agent/しきるん/つくるん/めだまん等
- ✅ ステータスフィルター: 全て/成功/失敗/実行中/待機中
- 🔍 テキスト検索: Issue番号、コミットメッセージで検索
- 📊 CSV/JSONエクスポート: 監査・分析用

---

### 3. Agent詳細画面

**目的**: 個別のAgent実行の詳細情報を表示

**レイアウト**:
```
┌────────────────────────────────────────────────────────┐
│ 🤖 つくるん (CodeGenAgent) 実行詳細                      │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📋 基本情報                                             │
│ ┌────────────────────────────────────────────┐       │
│ │ Issue: #270                                │       │
│ │ タイトル: Discord通知機能の実装               │       │
│ │ 実行時刻: 2025-10-19 14:30:25              │       │
│ │ 実行時間: 3分42秒                            │       │
│ │ ステータス: ✅ 成功                          │       │
│ │ 品質スコア: 95/100 ⭐⭐⭐⭐⭐                  │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 📊 品質レポート                                         │
│ ┌────────────────────────────────────────────┐       │
│ │ ✅ コード品質: 98/100                         │       │
│ │   - Clippy警告: 0件                         │       │
│ │   - Rustfmtチェック: 合格                    │       │
│ │   - 複雑度: 平均3.2 (良好)                   │       │
│ │                                            │       │
│ │ ✅ テストカバレッジ: 92%                      │       │
│ │   - 単体テスト: 45/48 合格                   │       │
│ │   - 統合テスト: 12/12 合格                   │       │
│ │                                            │       │
│ │ ⚠️ ドキュメント: 85/100                       │       │
│ │   - Rustdocカバレッジ: 85%                   │       │
│ │   - 推奨: pub fn 3個にコメント追加            │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 📝 実行ログ                                             │
│ ┌────────────────────────────────────────────┐       │
│ │ [14:30:25] Agent実行開始                    │       │
│ │ [14:30:26] Issue #270を読み込み             │       │
│ │ [14:30:28] タスク分解完了 (3 subtasks)       │       │
│ │ [14:31:15] コード生成開始                    │       │
│ │ [14:32:48] テスト作成完了                    │       │
│ │ [14:33:52] 品質チェック実行                  │       │
│ │ [14:34:07] 全チェック合格 ✅                 │       │
│ │ [14:34:07] Agent実行完了                    │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 📦 生成ファイル (5ファイル)                              │
│ ┌────────────────────────────────────────────┐       │
│ │ src/discord/notification.rs        (+120行) │       │
│ │ src/discord/webhook.rs             (+85行)  │       │
│ │ tests/discord_test.rs              (+95行)  │       │
│ │ Cargo.toml                         (+3行)   │       │
│ │ docs/DISCORD_SETUP.md              (+150行) │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ [🔄 再実行] [📋 ログをコピー] [❌ ロールバック]            │
└────────────────────────────────────────────────────────┘
```

**機能**:
- 🔄 再実行ボタン: 同じ条件でAgentを再実行
- 📋 ログコピー: 全ログをクリップボードにコピー
- ❌ ロールバック: この実行前の状態に戻す（Git reset）
- 📥 レポートダウンロード: PDF/Markdown形式でダウンロード

---

### 4. リアルタイム監視画面

**目的**: Agent実行中のリアルタイム進捗を表示

**レイアウト**:
```
┌────────────────────────────────────────────────────────┐
│ 🎬 リアルタイム監視 - しきるん (CoordinatorAgent)          │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ⚙️ 実行中: Issue #270のタスク分解                        │
│                                                        │
│ 進捗: ████████████████░░░░ 80%                         │
│ 経過時間: 2分15秒 / 推定残り: 35秒                         │
│                                                        │
│ 📊 現在のステップ:                                       │
│ ┌────────────────────────────────────────────┐       │
│ │ Step 1: Issue読み込み          ✅ 完了 (5秒) │       │
│ │ Step 2: 依存関係分析           ✅ 完了 (15秒)│       │
│ │ Step 3: DAG構築               ⚙️ 実行中 (1m) │       │
│ │ Step 4: Task割り当て          ⏳ 待機中      │       │
│ │ Step 5: Label更新             ⏳ 待機中      │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 💬 リアルタイムログ (WebSocket接続)                       │
│ ┌────────────────────────────────────────────┐       │
│ │ [14:32:15] DAG構築: Node 1/5 処理中          │       │
│ │ [14:32:18] DAG構築: Node 2/5 処理中          │       │
│ │ [14:32:21] DAG構築: Node 3/5 処理中          │       │
│ │ [14:32:25] DAG構築: Node 4/5 処理中  ◄ 最新  │       │
│ │                                            │       │
│ │ (自動スクロール)                              │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ [⏸️ 一時停止] [⏹️ 停止] [📋 ログをコピー]                │
└────────────────────────────────────────────────────────┘
```

**機能**:
- 🔴 WebSocket接続: リアルタイムログストリーミング
- ⏸️ 一時停止: Agent実行を一時停止（Checkpoint）
- ⏹️ 停止: Agent実行を安全に停止（Graceful Shutdown）
- 📊 進捗バー: 現在のステップと残り時間を表示

---

### 5. 設定画面

**目的**: ダッシュボードとAgent実行の設定管理

**レイアウト**:
```
┌────────────────────────────────────────────────────────┐
│ ⚙️ 設定                                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 🔐 認証設定                                             │
│ ┌────────────────────────────────────────────┐       │
│ │ GitHub Token: ghp_xxxx...xxxx (設定済み)    │       │
│ │ [🔄 トークンを再生成]                         │       │
│ │                                            │       │
│ │ Discord Webhook: 設定済み ✅                │       │
│ │ [📝 Webhook URLを編集]                      │       │
│ │                                            │       │
│ │ Lark Integration: 未設定 ⚠️                 │       │
│ │ [➕ Larkを接続]                             │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 🤖 Agent設定                                           │
│ ┌────────────────────────────────────────────┐       │
│ │ 自動実行: [✓] 有効                           │       │
│ │ 並列実行数: [2 ▼] (最大5)                    │       │
│ │ タイムアウト: [10分 ▼]                        │       │
│ │ 品質しきい値: [80点 ▼] (合格ライン)            │       │
│ │                                            │       │
│ │ 手動承認が必要な操作:                          │       │
│ │ [✓] mainブランチへのpush                    │       │
│ │ [✓] Productionデプロイ                      │       │
│ │ [ ] Stagingデプロイ                         │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 🔔 通知設定                                             │
│ ┌────────────────────────────────────────────┐       │
│ │ Discord通知: [✓] 有効                        │       │
│ │   [✓] Agent成功時                           │       │
│ │   [✓] Agent失敗時                           │       │
│ │   [ ] Agent開始時                           │       │
│ │                                            │       │
│ │ メール通知: [ ] 有効                          │       │
│ │ Slack通知: [ ] 有効                          │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ 🌐 言語設定                                             │
│ ┌────────────────────────────────────────────┐       │
│ │ UI言語: [日本語 ▼]                           │       │
│ │ ログ言語: [日本語 ▼]                          │       │
│ │ タイムゾーン: [Asia/Tokyo ▼]                 │       │
│ └────────────────────────────────────────────┘       │
│                                                        │
│ [💾 保存] [↩️ 初期値に戻す]                              │
└────────────────────────────────────────────────────────┘
```

---

## 🔌 API設計

### REST API Endpoints

#### Agent実行系

```rust
// Agent実行一覧取得
GET /api/v1/agents/executions
Query Parameters:
  - agent_type: Option<AgentType>
  - status: Option<ExecutionStatus>
  - start_date: Option<DateTime<Utc>>
  - end_date: Option<DateTime<Utc>>
  - page: Option<u32>
  - per_page: Option<u32>
Response: {
  executions: Vec<AgentExecution>,
  total: u32,
  page: u32,
  per_page: u32
}

// Agent実行詳細取得
GET /api/v1/agents/executions/{execution_id}
Response: AgentExecutionDetail

// Agent手動実行
POST /api/v1/agents/execute
Body: {
  agent_type: AgentType,
  issue_number: u32,
  config: Option<AgentConfig>
}
Response: {
  execution_id: String,
  status: ExecutionStatus
}

// Agent実行停止
POST /api/v1/agents/executions/{execution_id}/stop
Response: { success: bool }
```

#### 統計系

```rust
// ダッシュボードサマリー取得
GET /api/v1/dashboard/summary
Response: {
  today: {
    executing: u32,
    succeeded: u32,
    failed: u32,
    pending: u32
  },
  quality_trend: Vec<QualityDataPoint>,
  active_agents: Vec<AgentStatus>
}

// 品質トレンド取得
GET /api/v1/analytics/quality-trend
Query Parameters:
  - days: u32 (default: 7)
Response: {
  data_points: Vec<QualityDataPoint>
}
```

### WebSocket API

#### 接続

```
ws://backend.miyabi.dev/ws
Authentication: Bearer {jwt_token}
```

#### メッセージフォーマット

```rust
// サーバー → クライアント
enum ServerMessage {
  AgentStarted {
    execution_id: String,
    agent_type: AgentType,
    issue_number: u32,
    timestamp: DateTime<Utc>
  },
  AgentProgress {
    execution_id: String,
    step: String,
    progress: f32, // 0.0 - 1.0
    estimated_remaining: Duration
  },
  AgentLog {
    execution_id: String,
    level: LogLevel,
    message: String,
    timestamp: DateTime<Utc>
  },
  AgentCompleted {
    execution_id: String,
    status: ExecutionStatus,
    quality_score: Option<u32>,
    duration: Duration
  }
}

// クライアント → サーバー
enum ClientMessage {
  Subscribe {
    execution_id: String
  },
  Unsubscribe {
    execution_id: String
  },
  SubscribeAll,
  UnsubscribeAll
}
```

---

## 🔒 セキュリティ設計

### 認証・認可

#### 認証フロー
1. GitHubOAuth認証
2. JWTトークン発行（有効期限: 24時間）
3. Refresh tokenで自動更新

#### 認可レベル
- **Viewer**: 閲覧のみ
- **Operator**: Agent実行可能
- **Admin**: 設定変更可能
- **Owner**: すべての権限

### セキュリティ対策

✅ **XSS対策**: DOMPurifyでサニタイズ
✅ **CSRF対策**: CSRFトークン + SameSite Cookie
✅ **SQL Injection**: 該当なし（GitHub API利用）
✅ **Rate Limiting**: 100req/min per user
✅ **HTTPS強制**: Vercel/Cloud Runで自動対応
✅ **Secret管理**: GitHub Secrets + Google Secret Manager

---

## 📊 パフォーマンス要件

### フロントエンド

- **初回表示**: < 1.5秒 (LCP)
- **インタラクション**: < 100ms (FID)
- **視覚安定性**: < 0.1 (CLS)
- **バンドルサイズ**: < 200KB (gzip)

### バックエンド

- **API レスポンス**: < 200ms (p95)
- **WebSocket レイテンシ**: < 50ms
- **並列Agent実行**: 最大5並列
- **スループット**: 1,000 req/min

---

## 🚀 実装フェーズ

### Phase 1: MVP（2週間）

**目標**: 基本的な閲覧機能

- [ ] ダッシュボード画面（静的データ）
- [ ] Agent実行履歴画面
- [ ] Agent詳細画面
- [ ] GitHub OAuth認証
- [ ] GitHub Projects V2 API統合

### Phase 2: リアルタイム機能（2週間）

**目標**: WebSocket統合

- [ ] リアルタイム監視画面
- [ ] WebSocket サーバー実装 (Rust)
- [ ] Agent実行ログのストリーミング
- [ ] 進捗バー表示

### Phase 3: 制御機能（2週間）

**目的**: Agent制御

- [ ] Agent手動実行
- [ ] Agent停止・一時停止
- [ ] ロールバック機能
- [ ] 手動承認ゲート

### Phase 4: 分析機能（2週間）

**目標**: データ分析・可視化

- [ ] 品質トレンドグラフ
- [ ] Agent別統計
- [ ] CSV/JSONエクスポート
- [ ] カスタムレポート

### Phase 5: 日本市場対応（1週間）

**目標**: 完全日本語対応

- [ ] 完全日本語UI
- [ ] 日本語ログ表示
- [ ] 日本語エラーメッセージ
- [ ] コンテキストヘルプ（日本語）

---

## 📝 次のステップ

### 即座に実行可能

1. **Next.jsプロジェクト作成**
   ```bash
   npx create-next-app@latest miyabi-dashboard \
     --typescript \
     --tailwind \
     --app \
     --src-dir \
     --import-alias "@/*"
   ```

2. **shadcn/ui導入**
   ```bash
   cd miyabi-dashboard
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card chart table
   ```

3. **Rust backend初期化**
   ```bash
   cargo new --bin miyabi-dashboard-backend
   cd miyabi-dashboard-backend
   cargo add axum tokio tower serde
   ```

### 要調査・設計

- GitHub Projects V2 API GraphQLスキーマ調査
- WebSocket接続の認証フロー詳細設計
- Cloud Run冷起動対策（Min instances設定）

---

## 📚 関連ドキュメント

- [NEXT_SESSION_GUIDE.md](./NEXT_SESSION_GUIDE.md) - 次回セッションガイド
- [JAPAN_MARKET_RESEARCH_2025.md](./JAPAN_MARKET_RESEARCH_2025.md) - 日本市場要件
- [DISCORD_CI_CD_SETUP.md](./DISCORD_CI_CD_SETUP.md) - 通知統合参考

---

**作成者**: Claude Code
**最終更新**: 2025-10-19
