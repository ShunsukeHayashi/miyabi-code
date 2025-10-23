# Phase 0: デザインガイド

**作成日**: 2025-10-24
**バージョン**: v1.0
**ステータス**: ✅ 設計完了
**関連Issue**: #425

---

## 📋 目次

1. [概要](#概要)
2. [デザインシステム](#デザインシステム)
3. [20画面一覧](#20画面一覧)
4. [画面詳細設計](#画面詳細設計)
5. [コンポーネントライブラリ](#コンポーネントライブラリ)

---

## 概要

Miyabi No-Code Web UI のデザイン仕様書。shadcn/ui + Tailwind CSSをベースに、モダンで直感的なUIを設計。

### デザイン原則

1. **シンプル**: 最小限のUIで最大限の機能
2. **直感的**: 説明不要のユーザー体験
3. **一貫性**: 全画面で統一されたデザイン言語
4. **レスポンシブ**: モバイルファースト
5. **アクセシビリティ**: WCAG 2.1 AA準拠

---

## デザインシステム

### カラーパレット

#### Primary Colors（メインカラー）

```css
--primary: 221 83% 53%;        /* #2563eb - Blue 600 */
--primary-foreground: 0 0% 100%; /* #ffffff - White */
```

#### Secondary Colors（サブカラー）

```css
--secondary: 220 14% 96%;      /* #f1f5f9 - Slate 100 */
--secondary-foreground: 222 47% 11%; /* #0f172a - Slate 900 */
```

#### Accent Colors（アクセントカラー）

```css
--accent: 142 76% 36%;         /* #16a34a - Green 600 - Success */
--destructive: 0 84% 60%;      /* #ef4444 - Red 500 - Error */
--warning: 38 92% 50%;         /* #f59e0b - Amber 500 - Warning */
--info: 199 89% 48%;           /* #0ea5e9 - Sky 500 - Info */
```

#### Background Colors（背景色）

```css
--background: 0 0% 100%;       /* #ffffff - White */
--foreground: 222 47% 11%;     /* #0f172a - Slate 900 */
--muted: 220 14% 96%;          /* #f1f5f9 - Slate 100 */
--muted-foreground: 215 16% 47%; /* #64748b - Slate 500 */
```

#### Border & Input

```css
--border: 220 13% 91%;         /* #e2e8f0 - Slate 200 */
--input: 220 13% 91%;          /* #e2e8f0 - Slate 200 */
--ring: 221 83% 53%;           /* #2563eb - Blue 600 */
```

### タイポグラフィ

#### Font Family

```css
font-family: 'Inter', 'Noto Sans JP', sans-serif;
```

#### Font Sizes

| サイズ | Tailwind Class | ピクセル | 用途 |
|--------|---------------|---------|------|
| **xs** | `text-xs` | 12px | キャプション、補助テキスト |
| **sm** | `text-sm` | 14px | ボディ小、ラベル |
| **base** | `text-base` | 16px | ボディ標準 |
| **lg** | `text-lg` | 18px | リード文、小見出し |
| **xl** | `text-xl` | 20px | 見出し3 |
| **2xl** | `text-2xl` | 24px | 見出し2 |
| **3xl** | `text-3xl` | 30px | 見出し1 |
| **4xl** | `text-4xl` | 36px | ヒーロータイトル |

#### Font Weights

| ウェイト | Tailwind Class | 用途 |
|---------|---------------|------|
| **Regular** | `font-normal` (400) | ボディテキスト |
| **Medium** | `font-medium` (500) | ボタン、ラベル |
| **Semibold** | `font-semibold` (600) | 小見出し |
| **Bold** | `font-bold` (700) | 見出し |

### スペーシング

#### Spacing Scale（Tailwind基準）

| スケール | ピクセル | 用途 |
|---------|---------|------|
| **0** | 0px | なし |
| **1** | 4px | 超小 |
| **2** | 8px | 小 |
| **3** | 12px | 中 |
| **4** | 16px | 標準 |
| **6** | 24px | 大 |
| **8** | 32px | 超大 |
| **12** | 48px | セクション間 |

### アイコン

**アイコンライブラリ**: lucide-react

**サイズ**:
- Small: 16px
- Medium: 20px
- Large: 24px
- XLarge: 32px

### ボタンバリエーション

#### Primary Button

```tsx
<Button variant="default">Primary Action</Button>
```

**スタイル**: 青背景、白テキスト、ホバーで明度変化

#### Secondary Button

```tsx
<Button variant="secondary">Secondary Action</Button>
```

**スタイル**: グレー背景、黒テキスト

#### Outline Button

```tsx
<Button variant="outline">Outline Action</Button>
```

**スタイル**: 透明背景、青ボーダー、青テキスト

#### Destructive Button

```tsx
<Button variant="destructive">Delete</Button>
```

**スタイル**: 赤背景、白テキスト

---

## 20画面一覧

### Phase 1: 認証・基本機能（5画面）

| 画面ID | 画面名 | 説明 | ルート |
|--------|-------|------|-------|
| **S01** | ランディングページ | サービス紹介、ログインCTA | `/` |
| **S02** | ログインページ | GitHub OAuth認証 | `/login` |
| **S03** | OAuth Callback | GitHub認証後のリダイレクト処理 | `/auth/callback` |
| **S04** | ダッシュボード | 統計情報、最近の実行履歴 | `/dashboard` |
| **S05** | ユーザー設定 | プロフィール、設定変更 | `/settings` |

### Phase 2: リポジトリ管理（3画面）

| 画面ID | 画面名 | 説明 | ルート |
|--------|-------|------|-------|
| **S06** | リポジトリ一覧 | 接続済みリポジトリリスト | `/repositories` |
| **S07** | リポジトリ詳細 | リポジトリ情報、設定 | `/repositories/:id` |
| **S08** | リポジトリ接続 | 新規リポジトリ接続ウィザード | `/repositories/connect` |

### Phase 3: Agent実行（5画面）

| 画面ID | 画面名 | 説明 | ルート |
|--------|-------|------|-------|
| **S09** | Agent一覧 | 21個のAgent紹介・選択 | `/agents` |
| **S10** | Agent詳細 | Agent仕様、実行フォーム | `/agents/:type` |
| **S11** | Agent実行履歴 | 過去の実行一覧 | `/executions` |
| **S12** | Agent実行詳細 | 実行ログ、進捗、結果 | `/executions/:id` |
| **S13** | リアルタイムモニター | WebSocketで進捗表示 | `/executions/:id/live` |

### Phase 4: ワークフロー（4画面）

| 画面ID | 画面名 | 説明 | ルート |
|--------|-------|------|-------|
| **S14** | ワークフロー一覧 | 作成済みワークフローリスト | `/workflows` |
| **S15** | ワークフローエディタ | React Flowビジュアルエディタ | `/workflows/new` |
| **S16** | ワークフロー詳細 | ワークフロー情報、実行履歴 | `/workflows/:id` |
| **S17** | ワークフロー実行 | ワークフロー実行画面 | `/workflows/:id/run` |

### Phase 5: その他（3画面）

| 画面ID | 画面名 | 説明 | ルート |
|--------|-------|------|-------|
| **S18** | 通知センター | 実行完了通知、エラー通知 | `/notifications` |
| **S19** | ヘルプ・ドキュメント | 使い方ガイド、FAQ | `/help` |
| **S20** | エラーページ | 404, 500エラー表示 | `/error` |

---

## 画面詳細設計

### S01: ランディングページ

**目的**: サービス紹介、ユーザー獲得

**レイアウト**:
```
+----------------------------------+
| Header                           |
|  Logo | Features | Pricing | Login|
+----------------------------------+
| Hero Section                     |
|  Headline: "完全自律型AI開発"    |
|  Subheading: "1つのコマンドで..." |
|  CTA: "GitHub でログイン"        |
|  Hero Image (デモGIF)            |
+----------------------------------+
| Features Section (3カラム)        |
|  [Icon] Agent実行                |
|  [Icon] ワークフロー              |
|  [Icon] リアルタイム監視          |
+----------------------------------+
| How It Works (4ステップ)          |
|  1. GitHubログイン               |
|  2. リポジトリ接続               |
|  3. Agent実行                    |
|  4. 自動PR作成                   |
+----------------------------------+
| Pricing Section                  |
|  Free | Pro | Enterprise          |
+----------------------------------+
| Footer                           |
+----------------------------------+
```

**主要コンポーネント**:
- `HeroSection` - ヒーローエリア
- `FeatureCard` - 機能紹介カード
- `PricingCard` - 料金プランカード

---

### S04: ダッシュボード

**目的**: 統計情報、最近のアクティビティ表示

**レイアウト**:
```
+----------------------------------+
| Sidebar | Main Content           |
|         |                        |
| [Home]  | Stats Cards (4枚)      |
| [Repos] |  Total Executions      |
| [Agents]|  Success Rate          |
| [Flows] |  Active Workflows      |
|         |  Connected Repos       |
|         +------------------------+
|         | Recent Executions      |
|         | Table (10行)           |
|         |  Agent | Status | Time |
|         +------------------------+
|         | Execution Chart        |
|         | (過去7日間のグラフ)     |
+----------------------------------+
```

**主要コンポーネント**:
- `StatsCard` - 統計カード（4種）
- `RecentExecutionTable` - 実行履歴テーブル
- `ExecutionChart` - 実行数グラフ（recharts）

**API呼び出し**:
- `GET /api/v1/agent-executions?page=1&per_page=10`
- `GET /api/v1/repositories?page=1&per_page=5`

---

### S09: Agent一覧

**目的**: 21個のAgent紹介、選択

**レイアウト**:
```
+----------------------------------+
| Agent一覧                        |
|  検索バー [🔍 Agent検索...]     |
|  フィルタ: [All] [Coding] [Business]
+----------------------------------+
| Agent Grid (3カラム)             |
|  +------------+ +------------+  |
|  | CoordinatorAgent          |  |
|  | タスク統括・DAG分解       |  |
|  | [実行]                     |  |
|  +------------+ +------------+  |
|  ... (21個)                     |
+----------------------------------+
```

**主要コンポーネント**:
- `AgentCard` - Agent紹介カード
  - Agentアイコン
  - Agent名
  - 説明（2-3行）
  - [実行] ボタン
- `AgentSearchBar` - 検索バー
- `AgentFilter` - カテゴリフィルタ

**Agent分類**:
- **Coding Agents (7個)**: Coordinator, CodeGen, Review, Issue, PR, Deployment, Hooks
- **Business Agents (14個)**: AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis, MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube, Sales, CRM, Analytics

---

### S12: Agent実行詳細

**目的**: 実行ログ、進捗、結果表示

**レイアウト**:
```
+----------------------------------+
| Agent実行詳細                    |
|  Breadcrumb: Home > Executions > #123
+----------------------------------+
| Status Badge: [✅ Completed]     |
|  CoordinatorAgent                |
|  Issue #270: Implement feature X |
+----------------------------------+
| Progress Bar: ████████████ 100% |
+----------------------------------+
| Tabs: [Overview] [Logs] [Result] |
+----------------------------------+
| [Overview Tab]                   |
|  開始時刻: 2025-10-24 08:00     |
|  完了時刻: 2025-10-24 08:15     |
|  実行時間: 15分                  |
|  Worktree: .worktrees/issue-270 |
|  Commit SHA: abc1234            |
|  PR: #123                        |
+----------------------------------+
| [Logs Tab]                       |
|  ```                             |
|  Starting CoordinatorAgent...    |
|  Analyzing Issue #270...         |
|  Creating 5 subtasks...          |
|  Execution completed.            |
|  ```                             |
+----------------------------------+
| [Result Tab]                     |
|  Output Result (JSON)            |
|  {                               |
|    "tasks_created": 5,           |
|    "commits": ["abc1234"],       |
|    "pr_url": "..."               |
|  }                               |
+----------------------------------+
```

**主要コンポーネント**:
- `StatusBadge` - ステータスバッジ (pending/running/completed/failed)
- `ProgressBar` - 進捗バー (0-100%)
- `TabNavigation` - タブナビゲーション
- `LogViewer` - ログビューア（コードブロック）
- `JsonViewer` - JSON結果ビューア

**WebSocket統合**:
- `ws://localhost:8080/ws/:execution_id` - リアルタイム進捗受信

---

### S15: ワークフローエディタ

**目的**: React Flowでビジュアルワークフロー作成

**レイアウト**:
```
+----------------------------------+
| Toolbar                          |
|  [保存] [実行] [エクスポート]    |
+----------------------------------+
| Sidebar | Canvas                 |
|         |                        |
| Agents  |  +--------+            |
|  Coord  |  | Node 1 |            |
|  CodeGen|  | Review |            |
|  Review |  +----+---+            |
|  Deploy |       |                |
|         |       v                |
|         |  +----+---+            |
|         |  | Node 2 |            |
|         |  | Deploy |            |
|         |  +--------+            |
+----------------------------------+
| Properties Panel                 |
|  Node: ReviewAgent               |
|  Config:                         |
|   quality_threshold: 80          |
|   auto_merge: false              |
+----------------------------------+
```

**主要コンポーネント**:
- `ReactFlow` - フローエディタ（react-flow-renderer）
- `NodePalette` - ノードパレット（左サイドバー）
- `CustomNode` - カスタムノード（Agent表示）
- `PropertiesPanel` - プロパティパネル（右サイドバー）

**React Flow設定**:
```tsx
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';

const nodeTypes = {
  agent: AgentNode,
  condition: ConditionNode,
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

---

## コンポーネントライブラリ

### shadcn/ui コンポーネント

| コンポーネント | 用途 | インストールコマンド |
|--------------|------|-------------------|
| **Button** | ボタン全般 | `npx shadcn-ui@latest add button` |
| **Card** | カード表示 | `npx shadcn-ui@latest add card` |
| **Dialog** | モーダルダイアログ | `npx shadcn-ui@latest add dialog` |
| **Dropdown Menu** | ドロップダウンメニュー | `npx shadcn-ui@latest add dropdown-menu` |
| **Table** | テーブル表示 | `npx shadcn-ui@latest add table` |
| **Badge** | ステータスバッジ | `npx shadcn-ui@latest add badge` |
| **Progress** | 進捗バー | `npx shadcn-ui@latest add progress` |
| **Tabs** | タブナビゲーション | `npx shadcn-ui@latest add tabs` |
| **Input** | テキスト入力 | `npx shadcn-ui@latest add input` |
| **Textarea** | 複数行入力 | `npx shadcn-ui@latest add textarea` |
| **Select** | セレクトボックス | `npx shadcn-ui@latest add select` |
| **Toast** | トースト通知 | `npx shadcn-ui@latest add toast` |
| **Avatar** | アバター画像 | `npx shadcn-ui@latest add avatar` |
| **Skeleton** | スケルトンローダー | `npx shadcn-ui@latest add skeleton` |

### カスタムコンポーネント

#### AgentCard

**ファイル**: `components/agents/AgentCard.tsx`

```tsx
interface AgentCardProps {
  agentType: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  onExecute: () => void;
}

export function AgentCard({
  agentType,
  name,
  description,
  icon,
  onExecute,
}: AgentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onExecute} className="w-full">
          実行
        </Button>
      </CardFooter>
    </Card>
  );
}
```

#### ExecutionStatusBadge

**ファイル**: `components/executions/ExecutionStatusBadge.tsx`

```tsx
interface ExecutionStatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export function ExecutionStatusBadge({ status }: ExecutionStatusBadgeProps) {
  const variants = {
    pending: 'secondary',
    running: 'default',
    completed: 'success',
    failed: 'destructive',
  };

  const labels = {
    pending: '待機中',
    running: '実行中',
    completed: '完了',
    failed: '失敗',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
}
```

---

## レスポンシブデザイン

### ブレークポイント（Tailwind CSS）

| ブレークポイント | 最小幅 | デバイス |
|---------------|-------|---------|
| **sm** | 640px | モバイル（横向き）、小型タブレット |
| **md** | 768px | タブレット |
| **lg** | 1024px | ラップトップ |
| **xl** | 1280px | デスクトップ |
| **2xl** | 1536px | 大型デスクトップ |

### レスポンシブ戦略

#### モバイル（< 768px）
- サイドバー → ハンバーガーメニュー
- 3カラムグリッド → 1カラムスタック
- テーブル → カードリスト

#### タブレット（768px - 1024px）
- サイドバー表示（折りたたみ可能）
- 2カラムグリッド
- テーブル表示（横スクロール）

#### デスクトップ（> 1024px）
- 固定サイドバー
- 3カラムグリッド
- フルテーブル表示

---

## アクセシビリティ

### WCAG 2.1 AA準拠

#### 色のコントラスト比
- **テキスト**: 4.5:1以上
- **大きなテキスト**: 3:1以上
- **UIコンポーネント**: 3:1以上

#### キーボード操作
- 全インタラクティブ要素にフォーカス可能
- `Tab`キーでナビゲーション
- `Enter`/`Space`で操作
- `Esc`でモーダルクローズ

#### スクリーンリーダー対応
- `aria-label` 属性
- `role` 属性
- `aria-live` 領域（トースト通知）

---

## 次のステップ

- [x] Task 0.1: 技術スタック最終決定 ✅
- [x] Task 0.2: プロジェクト初期化 ✅
- [x] Task 0.3: 設計ドキュメント作成 ✅
- [x] Task 0.4: デザインガイド作成 ✅

**次のPhase**: Phase 1 - GitHub OAuth + Dashboard実装（Issue #426）

---

**作成者**: Claude Code
**承認者**: （署名欄）
**承認日**: 2025-10-24

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
