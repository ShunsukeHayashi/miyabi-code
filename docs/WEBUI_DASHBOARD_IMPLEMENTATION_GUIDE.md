# Miyabi WebUIダッシュボード - 実装ガイド

**作成日**: 2025-10-19
**前提**: [WEBUI_DASHBOARD_DESIGN.md](./WEBUI_DASHBOARD_DESIGN.md) を先に確認

---

## 📋 概要

このガイドでは、Miyabi WebUIダッシュボードのPhase 1（MVP）を実装します。

**Phase 1目標**:
- ✅ ダッシュボード画面（静的データ）
- ✅ Agent実行履歴画面
- ✅ Agent詳細画面
- ✅ GitHub OAuth認証
- ✅ GitHub Projects V2 API統合

**実装期間**: 2週間

---

## 🚀 セットアップ手順

### 1. Next.jsプロジェクト作成

```bash
# プロジェクトディレクトリに移動
cd /Users/a003/dev/miyabi-private

# Next.js 14プロジェクトを作成
npx create-next-app@latest miyabi-dashboard

# プロンプトで以下を選択:
# ✓ TypeScript: Yes
# ✓ ESLint: Yes
# ✓ Tailwind CSS: Yes
# ✓ `src/` directory: Yes
# ✓ App Router: Yes
# ✓ Turbopack: Yes (推奨)
# ✓ Import alias: @/*

cd miyabi-dashboard
```

### 2. shadcn/ui導入

```bash
# shadcn/ui初期化
npx shadcn@latest init

# プロンプトで以下を選択:
# ✓ Style: New York
# ✓ Base color: Slate
# ✓ CSS variables: Yes

# 必要なコンポーネントをインストール
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add tabs
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add toast
```

### 3. 追加パッケージのインストール

```bash
# State management & data fetching
npm install zustand @tanstack/react-query

# GitHub API
npm install @octokit/rest @octokit/auth-oauth-app

# Charts & visualization
npm install recharts tremor

# WebSocket
npm install socket.io-client

# i18n (日本語対応)
npm install next-intl

# Utilities
npm install clsx tailwind-merge date-fns

# Dev dependencies
npm install -D @types/node
```

### 4. 環境変数設定

`.env.local`を作成:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXT_PUBLIC_GITHUB_OWNER=ShunsukeHayashi
NEXT_PUBLIC_GITHUB_REPO=miyabi-private

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Discord (オプション)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

---

## 📁 ディレクトリ構造

```
miyabi-dashboard/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx                 # ダッシュボード
│   │   │   ├── history/
│   │   │   │   └── page.tsx             # 実行履歴
│   │   │   ├── execution/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # 実行詳細
│   │   │   ├── settings/
│   │   │   │   └── page.tsx             # 設定
│   │   │   └── layout.tsx               # Dashboard layout
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Landing page
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardSummary.tsx
│   │   │   ├── AgentStatusList.tsx
│   │   │   ├── QualityTrendChart.tsx
│   │   │   └── NotificationFeed.tsx
│   │   ├── history/
│   │   │   ├── ExecutionTable.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── execution/
│   │   │   ├── ExecutionDetail.tsx
│   │   │   ├── QualityReport.tsx
│   │   │   └── ExecutionLog.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/                          # shadcn components
│   ├── lib/
│   │   ├── api/
│   │   │   ├── github.ts                # GitHub API client
│   │   │   ├── agents.ts                # Agent API
│   │   │   └── auth.ts                  # Authentication
│   │   ├── hooks/
│   │   │   ├── useAgentExecutions.ts
│   │   │   ├── useAgentDetail.ts
│   │   │   └── useDashboardSummary.ts
│   │   ├── store/
│   │   │   ├── authStore.ts             # Zustand: Auth state
│   │   │   └── agentStore.ts            # Zustand: Agent state
│   │   ├── types/
│   │   │   ├── agent.ts
│   │   │   ├── execution.ts
│   │   │   └── github.ts
│   │   └── utils.ts
│   └── middleware.ts                     # Auth middleware
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 💻 実装ステップ

### Step 1: 型定義の作成

`src/lib/types/agent.ts`:

```typescript
export type AgentType =
  | 'coordinator'
  | 'codegen'
  | 'review'
  | 'deployment'
  | 'pr'
  | 'issue';

export type ExecutionStatus =
  | 'pending'
  | 'executing'
  | 'succeeded'
  | 'failed';

export interface AgentExecution {
  id: string;
  agentType: AgentType;
  issueNumber: number;
  status: ExecutionStatus;
  qualityScore?: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

export interface AgentExecutionDetail extends AgentExecution {
  logs: ExecutionLog[];
  generatedFiles: GeneratedFile[];
  qualityReport?: QualityReport;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface GeneratedFile {
  path: string;
  additions: number;
  deletions: number;
}

export interface QualityReport {
  codeQuality: number;
  testCoverage: number;
  documentation: number;
  overallScore: number;
}

export interface DashboardSummary {
  today: {
    executing: number;
    succeeded: number;
    failed: number;
    pending: number;
  };
  qualityTrend: QualityDataPoint[];
  activeAgents: AgentStatus[];
}

export interface QualityDataPoint {
  date: string;
  score: number;
}

export interface AgentStatus {
  agentType: AgentType;
  status: ExecutionStatus;
  currentTask?: string;
  progress?: number;
}
```

### Step 2: GitHub API Client

`src/lib/api/github.ts`:

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER!;
const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!;

export async function getIssue(issueNumber: number) {
  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  });
  return data;
}

export async function listIssues(params?: {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
}) {
  const { data } = await octokit.issues.listForRepo({
    owner,
    repo,
    ...params
  });
  return data;
}

export async function getProjectItems() {
  // GitHub Projects V2 GraphQL API
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        projectsV2(first: 1) {
          nodes {
            items(first: 100) {
              nodes {
                content {
                  ... on Issue {
                    number
                    title
                    state
                    labels(first: 10) {
                      nodes {
                        name
                      }
                    }
                  }
                }
                fieldValues(first: 10) {
                  nodes {
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        ... on ProjectV2SingleSelectField {
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await octokit.graphql(query, { owner, repo });
  return response;
}
```

### Step 3: Agent API（モックデータ）

`src/lib/api/agents.ts`:

```typescript
import { AgentExecution, AgentExecutionDetail, DashboardSummary } from '../types/agent';

// モックデータ（Phase 1）
// Phase 2でRust backendと統合
export async function getAgentExecutions(): Promise<AgentExecution[]> {
  return [
    {
      id: 'exec-001',
      agentType: 'codegen',
      issueNumber: 270,
      status: 'succeeded',
      qualityScore: 95,
      startedAt: new Date('2025-10-19T14:30:00'),
      completedAt: new Date('2025-10-19T14:33:42'),
      duration: 222
    },
    {
      id: 'exec-002',
      agentType: 'coordinator',
      issueNumber: 270,
      status: 'succeeded',
      startedAt: new Date('2025-10-19T14:25:00'),
      completedAt: new Date('2025-10-19T14:29:00'),
      duration: 240
    },
    {
      id: 'exec-003',
      agentType: 'review',
      issueNumber: 269,
      status: 'failed',
      qualityScore: 65,
      startedAt: new Date('2025-10-19T13:50:00'),
      completedAt: new Date('2025-10-19T13:55:00'),
      duration: 300
    }
  ];
}

export async function getAgentExecutionDetail(id: string): Promise<AgentExecutionDetail> {
  const executions = await getAgentExecutions();
  const execution = executions.find(e => e.id === id);

  if (!execution) {
    throw new Error('Execution not found');
  }

  return {
    ...execution,
    logs: [
      { timestamp: new Date(), level: 'info', message: 'Agent実行開始' },
      { timestamp: new Date(), level: 'info', message: 'Issue #270を読み込み' },
      { timestamp: new Date(), level: 'info', message: 'コード生成完了' }
    ],
    generatedFiles: [
      { path: 'src/discord/notification.rs', additions: 120, deletions: 0 },
      { path: 'tests/discord_test.rs', additions: 95, deletions: 0 }
    ],
    qualityReport: {
      codeQuality: 98,
      testCoverage: 92,
      documentation: 85,
      overallScore: 95
    }
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return {
    today: {
      executing: 3,
      succeeded: 42,
      failed: 1,
      pending: 5
    },
    qualityTrend: [
      { date: '2025-10-13', score: 85 },
      { date: '2025-10-14', score: 88 },
      { date: '2025-10-15', score: 90 },
      { date: '2025-10-16', score: 92 },
      { date: '2025-10-17', score: 95 },
      { date: '2025-10-18', score: 97 },
      { date: '2025-10-19', score: 95 }
    ],
    activeAgents: [
      {
        agentType: 'coordinator',
        status: 'executing',
        currentTask: 'Issue #270のタスク分解中',
        progress: 0.8
      },
      {
        agentType: 'codegen',
        status: 'succeeded',
        currentTask: 'Issue #269の実装完了'
      },
      {
        agentType: 'review',
        status: 'pending',
        currentTask: 'Issue #270のレビュー待ち'
      }
    ]
  };
}
```

### Step 4: ダッシュボードコンポーネント

`src/components/dashboard/DashboardSummary.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardSummaryProps {
  summary: {
    executing: number;
    succeeded: number;
    failed: number;
    pending: number;
  };
}

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">実行中</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.executing}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">成功</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{summary.succeeded}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">失敗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">待機中</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 5: ダッシュボードページ

`src/app/dashboard/page.tsx`:

```typescript
import { getDashboardSummary } from '@/lib/api/agents';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { AgentStatusList } from '@/components/dashboard/AgentStatusList';
import { QualityTrendChart } from '@/components/dashboard/QualityTrendChart';

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">今日の実行サマリー</h2>
        <DashboardSummary summary={summary.today} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Agent稼働状況</h2>
        <AgentStatusList agents={summary.activeAgents} />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">品質トレンド（過去7日間）</h2>
        <QualityTrendChart data={summary.qualityTrend} />
      </section>
    </div>
  );
}
```

---

## 🧪 開発サーバー起動

```bash
cd miyabi-dashboard
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 📋 Phase 1 チェックリスト

### 基本セットアップ
- [ ] Next.js 14プロジェクト作成
- [ ] shadcn/ui導入
- [ ] 必要なパッケージインストール
- [ ] 環境変数設定

### 画面実装
- [ ] ダッシュボード画面（静的データ）
- [ ] Agent実行履歴画面
- [ ] Agent詳細画面
- [ ] レイアウト（Header/Sidebar）

### API統合
- [ ] GitHub API client実装
- [ ] Agent API（モックデータ）実装
- [ ] React Query統合

### スタイリング
- [ ] Tailwind CSS設定
- [ ] ダークモード対応
- [ ] レスポンシブデザイン

---

## 🚀 Phase 2 へ

Phase 1完了後、以下を実装:

1. **Rust Backend作成**
   ```bash
   cargo new --bin miyabi-dashboard-backend
   cd miyabi-dashboard-backend
   cargo add axum tokio tower serde tokio-tungstenite
   ```

2. **WebSocket統合**
   - リアルタイムログストリーミング
   - Agent進捗更新

3. **認証実装**
   - GitHub OAuth
   - JWT トークン

詳細は [WEBUI_DASHBOARD_DESIGN.md](./WEBUI_DASHBOARD_DESIGN.md) Phase 2セクション参照。

---

## 📚 関連ドキュメント

- [WEBUI_DASHBOARD_DESIGN.md](./WEBUI_DASHBOARD_DESIGN.md) - 技術設計書
- [NEXT_SESSION_GUIDE.md](./NEXT_SESSION_GUIDE.md) - 次回セッションガイド
- [JAPAN_MARKET_RESEARCH_2025.md](./JAPAN_MARKET_RESEARCH_2025.md) - 日本市場要件

---

**作成者**: Claude Code
**最終更新**: 2025-10-19
