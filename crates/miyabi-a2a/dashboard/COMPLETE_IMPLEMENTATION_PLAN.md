# Miyabi A2A Dashboard - 完全実装プラン

**バージョン**: 1.0.0
**作成日**: 2025-10-22
**対象期間**: 8週間（56日間）
**想定工数**: 200時間（1人フルタイム換算）

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [Phase別詳細実装計画](#phase別詳細実装計画)
5. [テスト戦略](#テスト戦略)
6. [CI/CD統合](#cicd統合)
7. [リスク管理](#リスク管理)
8. [成功指標](#成功指標)
9. [セキュリティ考慮事項](#セキュリティ考慮事項)
10. [ドキュメント計画](#ドキュメント計画)

---

## 🎯 プロジェクト概要

### 目的
Miyabi A2Aダッシュボードを世界クラスのリアルタイム監視システムに進化させる

### ゴール
- リアルタイムデータ表示（遅延 < 1秒）
- エラー復旧時間を30秒→5秒に短縮
- Lighthouse Performance Score > 90
- WCAG 2.1 AA準拠
- ユーザー満足度 > 4.5/5

### スコープ
- **含む**: UIUXの全面刷新、パフォーマンス最適化、リアルタイム機能強化
- **含まない**: Rust APIの大幅な変更、認証システムの変更、モバイルアプリ開発

---

## 💻 技術スタック

### フロントエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **UI Framework** | React | 18.2+ | コンポーネント開発 |
| **Component Library** | HeroUI | Latest | UIコンポーネント |
| **Animation** | Framer Motion | 10.16+ | アニメーション |
| **State Management** | React Context | - | グローバル状態 |
| **Real-time** | WebSocket | - | リアルタイム通信 |
| **Charts** | Recharts | 2.5+ | データ可視化 |
| **DAG Visualization** | ReactFlow | 11.10+ | ワークフロー表示 |
| **Layout** | React Grid Layout | 1.4+ | カスタムレイアウト |
| **Virtualization** | React Window | 1.8+ | パフォーマンス最適化 |
| **Onboarding** | React Joyride | 2.7+ | ユーザーガイド |
| **Styling** | Tailwind CSS | 3.3+ | スタイリング |
| **TypeScript** | TypeScript | 5.0+ | 型安全性 |

### バックエンド

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **Framework** | Axum | 0.6+ | HTTP/WebSocket |
| **Language** | Rust | 1.75+ | サーバーロジック |
| **API Client** | Octocrab | Latest | GitHub統合 |
| **Serialization** | Serde | 1.0+ | JSON処理 |

### 開発ツール

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| **Build Tool** | Vite | 高速ビルド |
| **Package Manager** | npm/pnpm | 依存管理 |
| **Linter** | ESLint | コード品質 |
| **Formatter** | Prettier | コードフォーマット |
| **Testing** | Vitest + React Testing Library | ユニット・統合テスト |
| **E2E Testing** | Playwright | E2Eテスト |
| **CI/CD** | GitHub Actions | 自動化 |

---

## 🏗️ アーキテクチャ設計

### コンポーネント構成図

```
┌─────────────────────────────────────────────────────────────┐
│                      App Component                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Context Providers                         │   │
│  │  - ThemeContext                                       │   │
│  │  - NotificationContext                                │   │
│  │  - WebSocketContext (Real-time data)                 │   │
│  │  - RefreshContext                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Header Component                      │   │
│  │  - System Status Badge                                │   │
│  │  - Theme Toggle                                       │   │
│  │  - Notification Bell                                  │   │
│  │  - Control Panel                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Live Dashboard (Main View)               │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │      System Metrics Cards (4 columns)          │  │   │
│  │  │  - System Health                                │  │   │
│  │  │  - Active Tasks                                 │  │   │
│  │  │  - Active Agents                                │  │   │
│  │  │  - Task Throughput                              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │          Agent Filters & Search                │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │        Agent Grid (Virtualized)                │  │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │  │   │
│  │  │  │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │ │  │   │
│  │  │  │ Card   │ │ Card   │ │ Card   │ │ Card   │ │  │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘ │  │   │
│  │  │  ... (up to 21 agents)                        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │      Real-time Metrics Chart (Area Chart)      │  │   │
│  │  │  - Tasks over time                              │  │   │
│  │  │  - Active agents over time                      │  │   │
│  │  │  - Throughput trend                             │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Sidebar Panels                        │   │
│  │  - Event Timeline (collapsible)                      │   │
│  │  - Error Dashboard (collapsible)                     │   │
│  │  - DAG Visualizer (modal)                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Floating Components                      │   │
│  │  - Notification Toasts                                │   │
│  │  - Agent Detail Modal                                 │   │
│  │  - Onboarding Tour                                    │   │
│  │  - Command Palette (Cmd+K)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### データフロー図

```
┌──────────────┐
│ Rust Backend │
│ (Axum Server)│
└───────┬──────┘
        │
        │ WebSocket Connection
        │ (ws://localhost:3001/ws)
        ↓
┌───────────────────────┐
│ WebSocketContext      │
│ - agents: Agent[]     │
│ - systemStatus        │
│ - isConnected         │
│ - error               │
└───────┬───────────────┘
        │
        │ Context Provider
        │
        ↓
┌───────────────────────┐
│ useMiyabiData() Hook  │
│ - Parse WebSocket     │
│ - Update state        │
│ - Notify subscribers  │
└───────┬───────────────┘
        │
        ├─────────┬─────────┬─────────┬─────────┐
        ↓         ↓         ↓         ↓         ↓
   ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │Dashboard│ │Agent │ │Metrics│ │Event │ │Error │
   │        │ │Card  │ │Chart  │ │Timeline│ │Panel │
   └────────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

### WebSocketメッセージフォーマット

```typescript
// Server → Client
type DashboardUpdate =
  | { type: "agents"; agents: Agent[] }
  | { type: "systemstatus"; status: SystemStatus }
  | { type: "ping" }
  | { type: "event"; event: TimelineEvent }
  | { type: "error"; error: ErrorInfo };

// Client → Server
type ClientMessage =
  | { type: "subscribe"; channels: string[] }
  | { type: "unsubscribe"; channels: string[] }
  | { type: "pong" };
```

---

## 📅 Phase別詳細実装計画

---

## 🚀 Phase 1: 基礎強化（Week 1-2）

**目標**: リアルタイム性とパフォーマンスの向上
**工数**: 40時間
**担当**: フロントエンド開発者1名

### Sprint 1.1: メトリクスチャートリアルタイム化（Day 1-2）

#### 📝 タスク詳細

**Task 1.1.1: データ構造設計**（2h）
- [ ] `MetricDataPoint`型定義
- [ ] LocalStorage保存形式設計
- [ ] データ保持期間決定（50ポイント = 約50分）

```typescript
// src/types/metrics.ts
export interface MetricDataPoint {
  time: string;           // "HH:MM" format
  timestamp: number;      // Unix timestamp
  tasks: number;          // active_tasks
  agents: number;         // active agents count
  throughput: number;     // task_throughput
  queuedTasks: number;    // queued_tasks
}

export interface MetricsHistory {
  data: MetricDataPoint[];
  lastUpdated: number;
  version: string;        // "1.0.0"
}
```

**Task 1.1.2: LocalStorage管理**（3h）
- [ ] `useMetricsHistory` カスタムフック作成
- [ ] データ保存・読み込み・クリーンアップ
- [ ] バージョン管理（スキーマ変更対応）

```typescript
// src/hooks/use-metrics-history.ts
import { useEffect, useState } from 'react';
import { MetricDataPoint, MetricsHistory } from '../types/metrics';

const STORAGE_KEY = 'miyabi-metrics-history';
const VERSION = '1.0.0';
const MAX_DATA_POINTS = 50;

export const useMetricsHistory = () => {
  const [history, setHistory] = useState<MetricDataPoint[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed: MetricsHistory = JSON.parse(stored);
      if (parsed.version !== VERSION) {
        // Version mismatch, clear old data
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to load metrics history:', error);
      return [];
    }
  });

  const addDataPoint = (dataPoint: MetricDataPoint) => {
    setHistory(prev => {
      const updated = [...prev, dataPoint].slice(-MAX_DATA_POINTS);

      const historyData: MetricsHistory = {
        data: updated,
        lastUpdated: Date.now(),
        version: VERSION,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historyData));
      } catch (error) {
        console.error('Failed to save metrics history:', error);
        // Storage quota exceeded - clear old data
        localStorage.removeItem(STORAGE_KEY);
      }

      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addDataPoint, clearHistory };
};
```

**Task 1.1.3: MetricsChart コンポーネント実装**（4h）
- [ ] WebSocket連携
- [ ] リアルタイム更新ロジック
- [ ] チャート描画

```typescript
// src/components/metrics-chart.tsx
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMiyabiData } from '../hooks/use-miyabi-data';
import { useMetricsHistory } from '../hooks/use-metrics-history';
import { useTheme } from '../contexts/theme-context';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const MetricsChart: React.FC = () => {
  const { systemStatus, agents } = useMiyabiData();
  const { history, addDataPoint, clearHistory } = useMetricsHistory();
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = React.useState(false);

  // Add data point every minute
  React.useEffect(() => {
    if (isPaused || !systemStatus || !agents) return;

    const interval = setInterval(() => {
      const dataPoint = {
        time: new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        tasks: systemStatus.active_tasks,
        agents: agents.filter(a => a.status === 'working' || a.status === 'active').length,
        throughput: systemStatus.task_throughput,
        queuedTasks: systemStatus.queued_tasks,
      };

      addDataPoint(dataPoint);
    }, 60000); // Every 1 minute

    return () => clearInterval(interval);
  }, [systemStatus, agents, isPaused, addDataPoint]);

  // Initial data point on mount
  React.useEffect(() => {
    if (systemStatus && agents && history.length === 0) {
      const dataPoint = {
        time: new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        tasks: systemStatus.active_tasks,
        agents: agents.filter(a => a.status === 'working' || a.status === 'active').length,
        throughput: systemStatus.task_throughput,
        queuedTasks: systemStatus.queued_tasks,
      };

      addDataPoint(dataPoint);
    }
  }, [systemStatus, agents, history.length, addDataPoint]);

  const chartColors = theme === 'dark'
    ? {
        grid: '#475569',
        text: '#cbd5e1',
        tasks: '#6366f1',
        agents: '#3b82f6',
        throughput: '#10b981',
      }
    : {
        grid: '#e5e7eb',
        text: '#6b7280',
        tasks: '#6366f1',
        agents: '#3b82f6',
        throughput: '#10b981',
      };

  if (history.length === 0) {
    return (
      <div className="h-80 w-full flex items-center justify-center">
        <div className="text-center">
          <Icon icon="lucide:line-chart" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">データを収集中...</p>
          <p className="text-sm text-gray-400">1分ごとにデータが更新されます</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
          <Chip size="sm" variant="flat" color="primary">
            {history.length} data points
          </Chip>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            startContent={<Icon icon={isPaused ? 'lucide:play' : 'lucide:pause'} />}
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Icon icon="lucide:trash-2" />}
            onClick={clearHistory}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.tasks} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColors.tasks} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.agents} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColors.agents} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.throughput} stopOpacity={0.8} />
                <stop offset="95%" stopColor={chartColors.throughput} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="time" stroke={chartColors.text} />
            <YAxis stroke={chartColors.text} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${chartColors.grid}`,
                borderRadius: '8px',
                color: chartColors.text,
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="tasks"
              stroke={chartColors.tasks}
              fill="url(#colorTasks)"
              name="Active Tasks"
            />
            <Area
              type="monotone"
              dataKey="agents"
              stroke={chartColors.agents}
              fill="url(#colorAgents)"
              name="Active Agents"
            />
            <Area
              type="monotone"
              dataKey="throughput"
              stroke={chartColors.throughput}
              fill="url(#colorThroughput)"
              name="Throughput"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

**Task 1.1.4: テスト作成**（2h）
- [ ] ユニットテスト（Vitest）
- [ ] データ保存・読み込みテスト
- [ ] エラーハンドリングテスト

```typescript
// src/hooks/__tests__/use-metrics-history.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMetricsHistory } from '../use-metrics-history';

describe('useMetricsHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useMetricsHistory());
    expect(result.current.history).toEqual([]);
  });

  it('should add data point', () => {
    const { result } = renderHook(() => useMetricsHistory());

    act(() => {
      result.current.addDataPoint({
        time: '10:00',
        timestamp: Date.now(),
        tasks: 5,
        agents: 3,
        throughput: 12,
        queuedTasks: 2,
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].tasks).toBe(5);
  });

  it('should limit data points to 50', () => {
    const { result } = renderHook(() => useMetricsHistory());

    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addDataPoint({
          time: `10:${i}`,
          timestamp: Date.now() + i * 1000,
          tasks: i,
          agents: 3,
          throughput: 12,
          queuedTasks: 2,
        });
      }
    });

    expect(result.current.history).toHaveLength(50);
  });

  it('should persist to localStorage', () => {
    const { result } = renderHook(() => useMetricsHistory());

    act(() => {
      result.current.addDataPoint({
        time: '10:00',
        timestamp: Date.now(),
        tasks: 5,
        agents: 3,
        throughput: 12,
        queuedTasks: 2,
      });
    });

    const stored = localStorage.getItem('miyabi-metrics-history');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.data).toHaveLength(1);
  });

  it('should clear history', () => {
    const { result } = renderHook(() => useMetricsHistory());

    act(() => {
      result.current.addDataPoint({
        time: '10:00',
        timestamp: Date.now(),
        tasks: 5,
        agents: 3,
        throughput: 12,
        queuedTasks: 2,
      });
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(localStorage.getItem('miyabi-metrics-history')).toBeNull();
  });
});
```

**成功基準**:
- ✅ WebSocketデータから1分ごとに自動更新
- ✅ LocalStorageに履歴保存（最新50件）
- ✅ チャートがスムーズに更新
- ✅ ページリロード後も履歴表示
- ✅ テストカバレッジ > 80%

---

### Sprint 1.2: パフォーマンス最適化（Day 3-4）

#### 📝 タスク詳細

**Task 1.2.1: 仮想化リスト実装**（4h）
- [ ] react-window導入
- [ ] AgentGridコンポーネント作成
- [ ] 動的な高さ計算

```typescript
// src/components/agent-grid-virtualized.tsx
import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Agent } from '../types/miyabi-types';
import { AgentCard } from './agent-card';

interface AgentGridProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}

export const AgentGridVirtualized: React.FC<AgentGridProps> = ({ agents, onAgentClick }) => {
  const CARD_WIDTH = 320;
  const CARD_HEIGHT = 180;
  const GAP = 16;

  const getColumnCount = (width: number) => {
    return Math.max(1, Math.floor((width + GAP) / (CARD_WIDTH + GAP)));
  };

  const getRowCount = (columnCount: number) => {
    return Math.ceil(agents.length / columnCount);
  };

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const columnCount = getColumnCount(style.width || 1200);
    const index = rowIndex * columnCount + columnIndex;

    if (index >= agents.length) {
      return null;
    }

    const agent = agents[index];

    return (
      <div
        style={{
          ...style,
          left: (style.left as number) + GAP / 2,
          top: (style.top as number) + GAP / 2,
          width: (style.width as number) - GAP,
          height: (style.height as number) - GAP,
        }}
      >
        <AgentCard agent={agent} onClick={() => onAgentClick(agent)} />
      </div>
    );
  };

  return (
    <AutoSizer>
      {({ height, width }) => {
        const columnCount = getColumnCount(width);
        const rowCount = getRowCount(columnCount);

        return (
          <Grid
            columnCount={columnCount}
            columnWidth={CARD_WIDTH + GAP}
            height={height}
            rowCount={rowCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={width}
          >
            {Cell}
          </Grid>
        );
      }}
    </AutoSizer>
  );
};
```

**Task 1.2.2: メモ化の徹底**（3h）
- [ ] AgentCardのReact.memo化
- [ ] useMemoの適切な使用
- [ ] useCallbackの適切な使用

```typescript
// src/components/agent-card.tsx (最適化版)
import React from 'react';
import { Agent } from '../types/miyabi-types';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

// Memoization with custom comparison
export const AgentCard = React.memo<AgentCardProps>(
  ({ agent, onClick }) => {
    // Component implementation
    return (
      <Card onClick={onClick}>
        {/* ... */}
      </Card>
    );
  },
  (prev, next) => {
    // Custom comparison function
    return (
      prev.agent.id === next.agent.id &&
      prev.agent.status === next.agent.status &&
      prev.agent.tasks === next.agent.tasks
    );
  }
);

AgentCard.displayName = 'AgentCard';
```

**Task 1.2.3: コード分割**（2h）
- [ ] React.lazy + Suspense導入
- [ ] ルート単位のコード分割
- [ ] コンポーネント単位のコード分割

```typescript
// src/App.tsx
import React, { Suspense } from 'react';
import { LoadingSpinner } from './components/loading-spinner';

// Lazy load heavy components
const LiveDashboard = React.lazy(() => import('./components/live-dashboard'));
const ErrorDashboard = React.lazy(() => import('./components/error-dashboard'));
const PerformanceAnalytics = React.lazy(() => import('./components/performance-analytics'));

export const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<LiveDashboard />} />
        <Route path="/errors" element={<ErrorDashboard />} />
        <Route path="/analytics" element={<PerformanceAnalytics />} />
      </Routes>
    </Suspense>
  );
};
```

**Task 1.2.4: Lighthouse監査**（2h）
- [ ] パフォーマンス測定
- [ ] ボトルネック特定
- [ ] 改善実施

**成功基準**:
- ✅ 21個のAgent表示でスクロールが60FPS維持
- ✅ 初回レンダリング時間 < 1秒
- ✅ Lighthouse Performance Score > 90
- ✅ バンドルサイズ < 500KB (gzip)

---

### Sprint 1.3: Agentステータス可視化強化（Day 5）

#### 📝 タスク詳細

**Task 1.3.1: 進捗バーコンポーネント**（2h）
```typescript
// src/components/agent-progress-bar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AgentStatus } from '../types/miyabi-types';

interface AgentProgressBarProps {
  tasks: number;
  maxTasks: number;
  status: AgentStatus;
}

export const AgentProgressBar: React.FC<AgentProgressBarProps> = ({
  tasks,
  maxTasks,
  status,
}) => {
  const progress = Math.min((tasks / maxTasks) * 100, 100);

  const getGradient = () => {
    switch (status) {
      case 'working':
        return 'from-green-400 to-green-600';
      case 'error':
        return 'from-red-400 to-red-600';
      case 'active':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getGradient()} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
};
```

**Task 1.3.2: エラー状態アニメーション**（2h）
```typescript
// src/components/agent-error-indicator.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export const AgentErrorIndicator: React.FC = () => {
  return (
    <motion.div
      className="absolute top-2 right-2 z-10"
      animate={{
        opacity: [1, 0.3, 1],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="relative">
        <Icon icon="lucide:alert-circle" className="h-5 w-5 text-red-500" />
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500"
          animate={{
            scale: [1, 2, 2],
            opacity: [0.5, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </div>
    </motion.div>
  );
};
```

**Task 1.3.3: agent-card.tsx統合**（2h）
- [ ] 新コンポーネント統合
- [ ] アニメーション調整
- [ ] レスポンシブ対応

**Task 1.3.4: ビジュアルテスト**（1h）
- [ ] Storybook追加
- [ ] 各ステータスのスナップショット

**成功基準**:
- ✅ 進捗バーが滑らかにアニメーション
- ✅ エラー状態が視認しやすい
- ✅ パフォーマンス劣化なし（60FPS維持）

---

## 📋 Phase 2: UX改善（Week 3-4）

**目標**: ユーザビリティとエラーハンドリングの強化
**工数**: 48時間

### Sprint 2.1: エラーリカバリーUI（Day 6-8）

#### Rust API実装（6h）

**Task 2.1.1: リトライエンドポイント追加**

```rust
// crates/miyabi-a2a/src/http/routes.rs

use axum::{extract::Path, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskRetryRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskRetryResponse {
    pub task_id: String,
    pub status: String,
    pub message: String,
    pub retry_count: u32,
}

/// Retry a failed task
pub async fn retry_task(
    Path(task_id): Path<String>,
    Json(payload): Json<TaskRetryRequest>,
) -> Result<Json<TaskRetryResponse>, StatusCode> {
    tracing::info!("Retrying task: {}", task_id);

    // TODO: Implement actual task retry logic
    // For now, return success response

    Ok(Json(TaskRetryResponse {
        task_id: task_id.clone(),
        status: "retrying".to_string(),
        message: format!("Task {} has been queued for retry", task_id),
        retry_count: 1,
    }))
}

/// Cancel a running task
pub async fn cancel_task(
    Path(task_id): Path<String>,
) -> Result<Json<TaskCancelResponse>, StatusCode> {
    tracing::info!("Cancelling task: {}", task_id);

    Ok(Json(TaskCancelResponse {
        task_id: task_id.clone(),
        status: "cancelled".to_string(),
        message: format!("Task {} has been cancelled", task_id),
    }))
}

// Add routes
pub fn task_routes() -> Router {
    Router::new()
        .route("/api/tasks/:id/retry", post(retry_task))
        .route("/api/tasks/:id/cancel", post(cancel_task))
}
```

**Task 2.1.2: エラー情報WebSocket配信**

```rust
// crates/miyabi-a2a/src/http/websocket.rs

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DashboardUpdate {
    Agents { agents: Vec<Agent> },
    SystemStatus { status: SystemStatus },
    Error { error: ErrorInfo },  // 新規追加
    Ping,
}

#[derive(Debug, Clone, Serialize)]
pub struct ErrorInfo {
    pub id: String,
    pub task_id: Option<String>,
    pub agent_id: Option<String>,
    pub agent_name: Option<String>,
    pub message: String,
    pub stack_trace: Option<String>,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub severity: ErrorSeverity,
    pub is_retryable: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorSeverity {
    Critical,
    High,
    Medium,
    Low,
}
```

#### フロントエンド実装（12h）

既にQUICK_WINS.mdで詳細実装済み。

**成功基準**:
- ✅ エラーが発生したら5秒以内に通知
- ✅ ワンクリックでリトライ可能
- ✅ スタックトレース展開表示
- ✅ Rust APIとの連携動作

---

### Sprint 2.2: 通知システム（Day 11-13、24h）

**目標**: リアルタイム通知と通知履歴の実装

#### Task 2.2.1: 通知コンポーネント設計（6h）

**TypeScript型定義**:

```typescript
// src/types/notification-types.ts

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  type: 'task_completed' | 'task_failed' | 'agent_started' | 'agent_stopped' | 'system_alert';
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: Date;
  task_id?: string;
  agent_id?: string;
  agent_name?: string;
  is_read: boolean;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound_enabled: boolean;
  desktop_enabled: boolean;
  severity_filter: NotificationSeverity[];
  auto_dismiss_duration?: number; // milliseconds
}
```

**NotificationContext実装**:

```typescript
// src/contexts/notification-context.tsx

import React from 'react';
import { Notification, NotificationPreferences } from '../types/notification-types';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'is_read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

const NotificationContext = React.createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'miyabi-notifications';
const PREFS_STORAGE_KEY = 'miyabi-notification-prefs';
const MAX_NOTIFICATIONS = 100;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage
  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
      }));
    } catch {
      return [];
    }
  });

  const [preferences, setPreferences] = React.useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (!stored) {
        return {
          enabled: true,
          sound_enabled: true,
          desktop_enabled: false,
          severity_filter: ['info', 'success', 'warning', 'error', 'critical'],
        };
      }
      return JSON.parse(stored);
    } catch {
      return {
        enabled: true,
        sound_enabled: true,
        desktop_enabled: false,
        severity_filter: ['info', 'success', 'warning', 'error', 'critical'],
      };
    }
  });

  // Save to localStorage
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const addNotification = React.useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'is_read'>) => {
    if (!preferences.enabled) return;
    if (!preferences.severity_filter.includes(notif.severity)) return;

    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      is_read: false,
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));

    // Play sound
    if (preferences.sound_enabled) {
      playNotificationSound(notif.severity);
    }

    // Desktop notification
    if (preferences.desktop_enabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotif.title, {
        body: newNotif.message,
        icon: '/miyabi-icon.png',
        tag: newNotif.id,
      });
    }

    // Auto-dismiss
    if (preferences.auto_dismiss_duration && notif.severity === 'info') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
      }, preferences.auto_dismiss_duration);
    }
  }, [preferences]);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const clearNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const updatePreferences = React.useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Sound utility
const playNotificationSound = (severity: NotificationSeverity) => {
  const audio = new Audio();
  switch (severity) {
    case 'critical':
    case 'error':
      audio.src = '/sounds/error.mp3';
      break;
    case 'warning':
      audio.src = '/sounds/warning.mp3';
      break;
    case 'success':
      audio.src = '/sounds/success.mp3';
      break;
    default:
      audio.src = '/sounds/info.mp3';
  }
  audio.play().catch(() => {
    // Ignore autoplay policy errors
  });
};
```

**Task 2.2.2: 通知UI実装（10h）**

```typescript
// src/components/notification-toast.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { Notification } from '../types/notification-types';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAction?: () => void;
}

const severityConfig = {
  info: { icon: 'lucide:info', color: 'primary', bgColor: 'bg-primary/10' },
  success: { icon: 'lucide:check-circle', color: 'success', bgColor: 'bg-success/10' },
  warning: { icon: 'lucide:alert-triangle', color: 'warning', bgColor: 'bg-warning/10' },
  error: { icon: 'lucide:x-circle', color: 'danger', bgColor: 'bg-danger/10' },
  critical: { icon: 'lucide:alert-octagon', color: 'danger', bgColor: 'bg-danger/20' },
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onAction,
}) => {
  const config = severityConfig[notification.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Card className={`w-80 ${config.bgColor} border-l-4 border-${config.color}`}>
        <CardBody className="p-3">
          <div className="flex items-start gap-3">
            <Icon icon={config.icon} className={`h-5 w-5 text-${config.color} flex-shrink-0 mt-1`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold">{notification.title}</h4>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => onDismiss(notification.id)}
                  className="min-w-unit-6 w-6 h-6"
                >
                  <Icon icon="lucide:x" className="h-3 w-3" />
                </Button>
              </div>

              <p className="text-xs text-foreground-500 mb-2">{notification.message}</p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-400">
                  {notification.timestamp.toLocaleTimeString()}
                </span>

                {notification.agent_name && (
                  <Chip size="sm" variant="flat" color={config.color}>
                    {notification.agent_name}
                  </Chip>
                )}

                {notification.action && (
                  <Button
                    size="sm"
                    color={config.color}
                    variant="flat"
                    onPress={onAction}
                    startContent={<Icon icon={notification.action.icon || 'lucide:arrow-right'} />}
                  >
                    {notification.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
};

// Toast container component
export const NotificationToastContainer: React.FC = () => {
  const { notifications, clearNotification } = useNotifications();
  const activeNotifications = notifications.filter(n => !n.is_read).slice(0, 3);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {activeNotifications.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={clearNotification}
            onAction={notification.action?.handler}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
```

**Task 2.2.3: WebSocket統合（8h）**

```typescript
// src/hooks/use-notification-websocket.ts

import React from 'react';
import { useWebSocketContext } from '../contexts/websocket-context';
import { useNotifications } from '../contexts/notification-context';

export const useNotificationWebSocket = () => {
  const { lastMessage } = useWebSocketContext();
  const { addNotification } = useNotifications();

  React.useEffect(() => {
    if (!lastMessage) return;

    try {
      const data = JSON.parse(lastMessage.data);

      // Task completed notification
      if (data.type === 'task_completed') {
        addNotification({
          type: 'task_completed',
          severity: 'success',
          title: 'Task Completed',
          message: `Task #${data.task_id?.substring(0, 8)} has been completed successfully`,
          task_id: data.task_id,
          agent_name: data.agent_name,
        });
      }

      // Task failed notification
      if (data.type === 'task_failed') {
        addNotification({
          type: 'task_failed',
          severity: 'error',
          title: 'Task Failed',
          message: `Task #${data.task_id?.substring(0, 8)} failed: ${data.error}`,
          task_id: data.task_id,
          agent_name: data.agent_name,
          action: {
            label: 'Retry',
            handler: () => {
              // Retry logic
              fetch(`/api/tasks/${data.task_id}/retry`, { method: 'POST' });
            },
            icon: 'lucide:refresh-cw',
          },
        });
      }

      // Agent status change
      if (data.type === 'agent_status_changed') {
        if (data.status === 'error') {
          addNotification({
            type: 'agent_stopped',
            severity: 'warning',
            title: 'Agent Stopped',
            message: `${data.agent_name} has stopped due to an error`,
            agent_id: data.agent_id,
            agent_name: data.agent_name,
          });
        }
      }

      // System alerts
      if (data.type === 'system_alert') {
        addNotification({
          type: 'system_alert',
          severity: data.severity || 'warning',
          title: data.title || 'System Alert',
          message: data.message,
        });
      }
    } catch (error) {
      console.error('Failed to parse notification:', error);
    }
  }, [lastMessage, addNotification]);
};
```

**テスト例**:

```typescript
// src/components/notification-toast.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationToast } from './notification-toast';

describe('NotificationToast', () => {
  it('renders notification with correct severity styling', () => {
    const notification = {
      id: 'test-1',
      type: 'task_failed' as const,
      severity: 'error' as const,
      title: 'Test Error',
      message: 'Something went wrong',
      timestamp: new Date(),
      is_read: false,
    };

    render(
      <NotificationToast
        notification={notification}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText('Test Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const handleDismiss = vi.fn();
    const notification = {
      id: 'test-1',
      type: 'task_completed' as const,
      severity: 'success' as const,
      title: 'Success',
      message: 'Task completed',
      timestamp: new Date(),
      is_read: false,
    };

    render(
      <NotificationToast
        notification={notification}
        onDismiss={handleDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(handleDismiss).toHaveBeenCalledWith('test-1');
  });

  it('renders action button when action is provided', () => {
    const handleAction = vi.fn();
    const notification = {
      id: 'test-1',
      type: 'task_failed' as const,
      severity: 'error' as const,
      title: 'Task Failed',
      message: 'Error occurred',
      timestamp: new Date(),
      is_read: false,
      action: {
        label: 'Retry',
        handler: handleAction,
        icon: 'lucide:refresh-cw',
      },
    };

    render(
      <NotificationToast
        notification={notification}
        onDismiss={vi.fn()}
        onAction={handleAction}
      />
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(handleAction).toHaveBeenCalled();
  });
});
```

**成功基準**:
- ✅ WebSocketメッセージから自動的に通知生成
- ✅ 重要度別の色分け表示
- ✅ 音声通知（オプション）
- ✅ デスクトップ通知（オプション）
- ✅ 100件まで履歴保存
- ✅ 未読カウント表示
- ✅ ワンクリックでアクション実行

---

### Sprint 2.3: オンボーディングツアー（Day 14-15、16h）

**目標**: 初回ユーザー向けのガイドツアー実装

#### Task 2.3.1: React Joyride統合（8h）

```typescript
// src/components/onboarding-tour.tsx

import React from 'react';
import Joyride, { CallBackProps, Step, STATUS } from 'react-joyride';
import { useTheme } from '../contexts/theme-context';

const TOUR_STORAGE_KEY = 'miyabi-tour-completed';

export const OnboardingTour: React.FC = () => {
  const { theme } = useTheme();
  const [run, setRun] = React.useState(false);

  React.useEffect(() => {
    // Check if tour has been completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      // Start tour after 1 second delay
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">Welcome to Miyabi A2A Dashboard! 🎉</h2>
          <p>Let's take a quick tour to show you around.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '.system-status-card',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <p>Monitor your system's health and active tasks in real-time.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.agent-grid',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Agent Cards</h3>
          <p>View all 21 agents and their current status. Click on a card to see details.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.metrics-chart',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Real-time Metrics</h3>
          <p>Track task throughput and completion times with live updating charts.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.event-timeline',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Event Timeline</h3>
          <p>See a live stream of all system events, task updates, and agent activities.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.notification-bell',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Notifications</h3>
          <p>Get instant alerts for task completions, failures, and system events.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.theme-toggle',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Theme Toggle</h3>
          <p>Switch between light and dark mode to suit your preference.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.settings-button',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Settings</h3>
          <p>Customize your dashboard, configure notifications, and more.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-xl font-bold mb-2">You're all set! 🚀</h2>
          <p>Start monitoring your AI agents now. You can restart this tour from Settings anytime.</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: theme === 'dark' ? '#9353d3' : '#7828c8',
          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          textColor: theme === 'dark' ? '#f9fafb' : '#111827',
          arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          marginRight: 10,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
    />
  );
};
```

**Task 2.3.2: ツアー設定UI（8h）**

```typescript
// src/components/tour-settings.tsx

import React from 'react';
import { Button, Switch } from '@heroui/react';
import { Icon } from '@iconify/react';

const TOUR_STORAGE_KEY = 'miyabi-tour-completed';

export const TourSettings: React.FC = () => {
  const [tourCompleted, setTourCompleted] = React.useState(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  });

  const handleResetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourCompleted(false);
    window.location.reload(); // Reload to trigger tour
  };

  const handleToggleAutoTour = (enabled: boolean) => {
    if (enabled) {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } else {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    }
    setTourCompleted(!enabled);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Show tour on startup</h4>
          <p className="text-xs text-foreground-500">
            Display the onboarding tour when you first visit the dashboard
          </p>
        </div>
        <Switch
          isSelected={!tourCompleted}
          onValueChange={handleToggleAutoTour}
        />
      </div>

      <Button
        color="primary"
        variant="flat"
        startContent={<Icon icon="lucide:play-circle" />}
        onPress={handleResetTour}
      >
        Restart Tour
      </Button>
    </div>
  );
};
```

**成功基準**:
- ✅ 初回訪問時に自動的にツアー開始
- ✅ 8ステップのガイド（全主要機能カバー）
- ✅ スキップ可能
- ✅ 進捗表示
- ✅ 設定からツアー再起動可能
- ✅ ライト/ダークモード対応

---

## Phase 3: 高度な機能（Week 5-6、80h）

### Sprint 3.1: DAG可視化（Day 16-20、40h）

**目標**: タスク依存関係グラフの可視化

#### Task 3.1.1: ReactFlow統合（16h）

**必要なパッケージ**:
```bash
npm install reactflow @xyflow/react
```

**DAGコンポーネント実装**:

```typescript
// src/components/task-dag-visualizer.tsx

import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import dagre from 'dagre';

interface TaskNode {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agent_type?: string;
  estimated_time?: number;
  dependencies: string[];
}

interface TaskDAGVisualizerProps {
  tasks: TaskNode[];
}

// Custom node component
const TaskNodeComponent: React.FC<{ data: any }> = ({ data }) => {
  const statusConfig = {
    pending: { color: 'default', icon: 'lucide:clock' },
    running: { color: 'primary', icon: 'lucide:loader-2' },
    completed: { color: 'success', icon: 'lucide:check-circle' },
    failed: { color: 'danger', icon: 'lucide:x-circle' },
  };

  const config = statusConfig[data.status];

  return (
    <Card className="p-3 min-w-[200px] border-2 border-divider">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold">{data.title}</h4>
          <Icon
            icon={config.icon}
            className={`h-4 w-4 text-${config.color} ${data.status === 'running' ? 'animate-spin' : ''}`}
          />
        </div>

        {data.agent_type && (
          <Chip size="sm" variant="flat" color="primary">
            {data.agent_type}
          </Chip>
        )}

        {data.estimated_time && (
          <div className="flex items-center gap-1 text-xs text-foreground-500">
            <Icon icon="lucide:timer" className="h-3 w-3" />
            <span>{data.estimated_time}min</span>
          </div>
        )}

        <Chip size="sm" variant="flat" color={config.color}>
          {data.status}
        </Chip>
      </div>
    </Card>
  );
};

const nodeTypes = {
  taskNode: TaskNodeComponent,
};

// Layout algorithm using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const TaskDAGVisualizer: React.FC<TaskDAGVisualizerProps> = ({ tasks }) => {
  const initialNodes: Node[] = tasks.map(task => ({
    id: task.id,
    type: 'taskNode',
    position: { x: 0, y: 0 },
    data: {
      title: task.title,
      status: task.status,
      agent_type: task.agent_type,
      estimated_time: task.estimated_time,
    },
  }));

  const initialEdges: Edge[] = tasks.flatMap(task =>
    task.dependencies.map(depId => ({
      id: `${depId}-${task.id}`,
      source: depId,
      target: task.id,
      type: 'smoothstep',
      animated: task.status === 'running',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: {
        strokeWidth: 2,
        stroke: task.status === 'running' ? '#9353d3' : '#6b7280',
      },
    }))
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update layout when tasks change
  React.useEffect(() => {
    const newNodes = tasks.map(task => ({
      id: task.id,
      type: 'taskNode',
      position: { x: 0, y: 0 },
      data: {
        title: task.title,
        status: task.status,
        agent_type: task.agent_type,
        estimated_time: task.estimated_time,
      },
    }));

    const newEdges = tasks.flatMap(task =>
      task.dependencies.map(depId => ({
        id: `${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: 'smoothstep',
        animated: task.status === 'running',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 2,
          stroke: task.status === 'running' ? '#9353d3' : '#6b7280',
        },
      }))
    );

    const { nodes: updatedNodes, edges: updatedEdges } = getLayoutedElements(
      newNodes,
      newEdges
    );

    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [tasks, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] bg-content1 rounded-lg border border-divider">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Strict}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const status = node.data.status;
            switch (status) {
              case 'completed': return '#10b981';
              case 'running': return '#9353d3';
              case 'failed': return '#ef4444';
              default: return '#6b7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
```

**Task 3.1.2: Rust API - DAGデータ取得（12h）**

```rust
// crates/miyabi-a2a/src/http/dag.rs

use axum::{extract::Path, Json};
use http::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskNode {
    pub id: String,
    pub title: String,
    pub status: TaskStatus,
    pub agent_type: Option<String>,
    pub estimated_time: Option<u32>, // minutes
    pub dependencies: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
}

#[derive(Debug, Serialize)]
pub struct DAGResponse {
    pub issue_id: u32,
    pub issue_title: String,
    pub tasks: Vec<TaskNode>,
    pub total_tasks: usize,
    pub completed_tasks: usize,
    pub estimated_total_time: u32,
}

/// Get task DAG for an issue
pub async fn get_issue_dag(
    Path(issue_id): Path<u32>,
) -> Result<Json<DAGResponse>, StatusCode> {
    tracing::info!("Fetching DAG for issue: {}", issue_id);

    // TODO: Fetch from GitHub Issue body or separate DAG storage
    // For now, return mock data

    let tasks = vec![
        TaskNode {
            id: "task-1".to_string(),
            title: "Analyze requirements".to_string(),
            status: TaskStatus::Completed,
            agent_type: Some("IssueAgent".to_string()),
            estimated_time: Some(5),
            dependencies: vec![],
        },
        TaskNode {
            id: "task-2".to_string(),
            title: "Generate code structure".to_string(),
            status: TaskStatus::Completed,
            agent_type: Some("CodeGenAgent".to_string()),
            estimated_time: Some(15),
            dependencies: vec!["task-1".to_string()],
        },
        TaskNode {
            id: "task-3".to_string(),
            title: "Implement feature A".to_string(),
            status: TaskStatus::Running,
            agent_type: Some("CodeGenAgent".to_string()),
            estimated_time: Some(20),
            dependencies: vec!["task-2".to_string()],
        },
        TaskNode {
            id: "task-4".to_string(),
            title: "Implement feature B".to_string(),
            status: TaskStatus::Pending,
            agent_type: Some("CodeGenAgent".to_string()),
            estimated_time: Some(20),
            dependencies: vec!["task-2".to_string()],
        },
        TaskNode {
            id: "task-5".to_string(),
            title: "Code review".to_string(),
            status: TaskStatus::Pending,
            agent_type: Some("ReviewAgent".to_string()),
            estimated_time: Some(10),
            dependencies: vec!["task-3".to_string(), "task-4".to_string()],
        },
        TaskNode {
            id: "task-6".to_string(),
            title: "Create PR".to_string(),
            status: TaskStatus::Pending,
            agent_type: Some("PRAgent".to_string()),
            estimated_time: Some(5),
            dependencies: vec!["task-5".to_string()],
        },
    ];

    let completed = tasks.iter().filter(|t| matches!(t.status, TaskStatus::Completed)).count();
    let total_time: u32 = tasks.iter().filter_map(|t| t.estimated_time).sum();

    Ok(Json(DAGResponse {
        issue_id,
        issue_title: format!("Issue #{} - Example Task", issue_id),
        tasks,
        total_tasks: 6,
        completed_tasks: completed,
        estimated_total_time: total_time,
    }))
}

// Add route
pub fn dag_routes() -> Router {
    Router::new()
        .route("/api/issues/:id/dag", get(get_issue_dag))
}
```

**Task 3.1.3: DAGモーダルUI（12h）**

```typescript
// src/components/dag-modal.tsx

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { TaskDAGVisualizer } from './task-dag-visualizer';

interface DAGModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId: number;
}

export const DAGModal: React.FC<DAGModalProps> = ({ isOpen, onClose, issueId }) => {
  const [dagData, setDagData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && issueId) {
      fetchDAG();
    }
  }, [isOpen, issueId]);

  const fetchDAG = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueId}/dag`);
      const data = await response.json();
      setDagData(data);
    } catch (error) {
      console.error('Failed to fetch DAG:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Task Dependency Graph</h3>
          {dagData && (
            <p className="text-sm text-foreground-500">
              {dagData.issue_title} - {dagData.completed_tasks}/{dagData.total_tasks} tasks completed
            </p>
          )}
        </ModalHeader>

        <ModalBody>
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Icon icon="lucide:loader-2" className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : dagData ? (
            <>
              <div className="flex items-center justify-between mb-4 p-3 bg-content2 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:clock" className="h-4 w-4 text-foreground-500" />
                    <span className="text-sm">
                      Estimated: {dagData.estimated_total_time} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:activity" className="h-4 w-4 text-foreground-500" />
                    <span className="text-sm">
                      {dagData.total_tasks} tasks
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  startContent={<Icon icon="lucide:refresh-cw" />}
                  onPress={fetchDAG}
                >
                  Refresh
                </Button>
              </div>

              <TaskDAGVisualizer tasks={dagData.tasks} />
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-foreground-500">
              No DAG data available
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
```

**成功基準**:
- ✅ タスク依存関係を階層的に可視化
- ✅ 実行中タスクはアニメーション表示
- ✅ ミニマップで全体像を把握
- ✅ ズーム・パン操作可能
- ✅ タスクステータスを色分け
- ✅ 推定時間と完了率を表示

---

### Sprint 3.2: カスタムレイアウト（Day 21-25、40h）

**目標**: ユーザーがダッシュボードレイアウトをカスタマイズ可能に

#### Task 3.2.1: React Grid Layout統合（20h）

**必要なパッケージ**:
```bash
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout
```

**カスタムレイアウトコンポーネント**:

```typescript
// src/components/custom-dashboard-layout.tsx

import React from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button, Card, CardBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { MetricsChart } from './metrics-chart';
import { EventTimeline } from './event-timeline';
import { AgentGrid } from './agent-grid';
import { PerformanceAnalytics } from './performance-analytics';

const LAYOUT_STORAGE_KEY = 'miyabi-dashboard-layout';

interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

const widgets: DashboardWidget[] = [
  {
    id: 'metrics',
    title: 'Metrics Chart',
    component: MetricsChart,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
  },
  {
    id: 'timeline',
    title: 'Event Timeline',
    component: EventTimeline,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 3 },
  },
  {
    id: 'agents',
    title: 'Agent Grid',
    component: AgentGrid,
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
  },
  {
    id: 'analytics',
    title: 'Performance Analytics',
    component: PerformanceAnalytics,
    defaultSize: { w: 12, h: 5 },
    minSize: { w: 6, h: 4 },
  },
];

const defaultLayout: Layout[] = widgets.map((widget, index) => ({
  i: widget.id,
  x: (index * 6) % 12,
  y: Math.floor(index / 2) * 4,
  w: widget.defaultSize.w,
  h: widget.defaultSize.h,
  minW: widget.minSize.w,
  minH: widget.minSize.h,
}));

export const CustomDashboardLayout: React.FC = () => {
  const [layout, setLayout] = React.useState<Layout[]>(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultLayout;
    } catch {
      return defaultLayout;
    }
  });

  const [isEditMode, setIsEditMode] = React.useState(false);
  const [visibleWidgets, setVisibleWidgets] = React.useState<Set<string>>(
    () => new Set(widgets.map(w => w.id))
  );

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    if (isEditMode) {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(newLayout));
    }
  };

  const handleResetLayout = () => {
    setLayout(defaultLayout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(defaultLayout));
    setVisibleWidgets(new Set(widgets.map(w => w.id)));
  };

  const toggleWidget = (widgetId: string) => {
    setVisibleWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="lucide:layout-dashboard"
              className="h-5 w-5 text-primary"
            />
            <h3 className="text-lg font-semibold">Dashboard Layout</h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              color={isEditMode ? 'success' : 'default'}
              startContent={<Icon icon={isEditMode ? 'lucide:check' : 'lucide:edit'} />}
              onPress={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Done Editing' : 'Edit Layout'}
            </Button>

            <Button
              size="sm"
              variant="flat"
              color="warning"
              startContent={<Icon icon="lucide:rotate-ccw" />}
              onPress={handleResetLayout}
            >
              Reset
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Widget Toggles (only in edit mode) */}
      {isEditMode && (
        <Card>
          <CardBody>
            <h4 className="text-sm font-semibold mb-2">Visible Widgets</h4>
            <div className="flex flex-wrap gap-2">
              {widgets.map(widget => (
                <Button
                  key={widget.id}
                  size="sm"
                  variant={visibleWidgets.has(widget.id) ? 'flat' : 'light'}
                  color={visibleWidgets.has(widget.id) ? 'primary' : 'default'}
                  startContent={
                    <Icon
                      icon={visibleWidgets.has(widget.id) ? 'lucide:eye' : 'lucide:eye-off'}
                    />
                  }
                  onPress={() => toggleWidget(widget.id)}
                >
                  {widget.title}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Grid Layout */}
      <GridLayout
        className="layout"
        layout={layout}
        onLayoutChange={handleLayoutChange}
        cols={12}
        rowHeight={80}
        width={1200}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
      >
        {widgets.map(widget => {
          if (!visibleWidgets.has(widget.id)) return null;

          const Component = widget.component;

          return (
            <div key={widget.id}>
              <Card className="h-full">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">{widget.title}</h4>
                    {isEditMode && (
                      <Icon
                        icon="lucide:grip-vertical"
                        className="h-4 w-4 text-foreground-400 cursor-move"
                      />
                    )}
                  </div>
                  <div className="h-[calc(100%-2rem)]">
                    <Component />
                  </div>
                </CardBody>
              </Card>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};
```

**Task 3.2.2: レイアウトプリセット（12h）**

```typescript
// src/components/layout-presets.tsx

import React from 'react';
import { Button, Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Layout } from 'react-grid-layout';

interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  layout: Layout[];
}

const presets: LayoutPreset[] = [
  {
    id: 'default',
    name: 'Default Layout',
    description: 'Balanced view with all widgets',
    icon: 'lucide:layout-dashboard',
    layout: [
      { i: 'metrics', x: 0, y: 0, w: 6, h: 4 },
      { i: 'timeline', x: 6, y: 0, w: 6, h: 4 },
      { i: 'agents', x: 0, y: 4, w: 12, h: 6 },
      { i: 'analytics', x: 0, y: 10, w: 12, h: 5 },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring Focus',
    description: 'Large metrics and timeline, compact agent view',
    icon: 'lucide:activity',
    layout: [
      { i: 'metrics', x: 0, y: 0, w: 8, h: 5 },
      { i: 'timeline', x: 8, y: 0, w: 4, h: 5 },
      { i: 'agents', x: 0, y: 5, w: 12, h: 4 },
      { i: 'analytics', x: 0, y: 9, w: 12, h: 5 },
    ],
  },
  {
    id: 'agent-focus',
    name: 'Agent Focus',
    description: 'Large agent grid with small metrics',
    icon: 'lucide:users',
    layout: [
      { i: 'agents', x: 0, y: 0, w: 12, h: 8 },
      { i: 'metrics', x: 0, y: 8, w: 6, h: 3 },
      { i: 'timeline', x: 6, y: 8, w: 6, h: 3 },
      { i: 'analytics', x: 0, y: 11, w: 12, h: 4 },
    ],
  },
  {
    id: 'compact',
    name: 'Compact View',
    description: 'Minimal space usage',
    icon: 'lucide:minimize-2',
    layout: [
      { i: 'metrics', x: 0, y: 0, w: 4, h: 3 },
      { i: 'timeline', x: 4, y: 0, w: 4, h: 3 },
      { i: 'analytics', x: 8, y: 0, w: 4, h: 3 },
      { i: 'agents', x: 0, y: 3, w: 12, h: 5 },
    ],
  },
];

interface LayoutPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (layout: Layout[]) => void;
}

export const LayoutPresetsModal: React.FC<LayoutPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const handleSelect = (preset: LayoutPreset) => {
    onSelectPreset(preset.layout);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">Layout Presets</h3>
        </ModalHeader>

        <ModalBody className="pb-6">
          <div className="grid grid-cols-2 gap-4">
            {presets.map(preset => (
              <Card
                key={preset.id}
                isPressable
                onPress={() => handleSelect(preset)}
                className="hover:scale-105 transition-transform"
              >
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon
                        icon={preset.icon}
                        className="h-6 w-6 text-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-1">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-foreground-500">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
```

**Task 3.2.3: レイアウト共有機能（8h）**

```typescript
// src/components/layout-share.tsx

import React from 'react';
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { Icon } from '@iconify/react';
import { Layout } from 'react-grid-layout';

interface LayoutShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: Layout[];
}

export const LayoutShareModal: React.FC<LayoutShareModalProps> = ({
  isOpen,
  onClose,
  layout,
}) => {
  const [importValue, setImportValue] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const exportCode = React.useMemo(() => {
    return btoa(JSON.stringify(layout));
  }, [layout]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const decoded = JSON.parse(atob(importValue));
      localStorage.setItem('miyabi-dashboard-layout', JSON.stringify(decoded));
      window.location.reload();
    } catch (error) {
      alert('Invalid layout code');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">Share Layout</h3>
        </ModalHeader>

        <ModalBody className="space-y-6">
          {/* Export */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Export Current Layout</h4>
            <div className="flex gap-2">
              <Input
                value={exportCode}
                readOnly
                classNames={{
                  input: 'font-mono text-xs',
                }}
              />
              <Button
                color={copied ? 'success' : 'primary'}
                variant="flat"
                startContent={<Icon icon={copied ? 'lucide:check' : 'lucide:copy'} />}
                onPress={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-foreground-500 mt-2">
              Share this code with others to replicate your layout
            </p>
          </div>

          {/* Import */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Import Layout</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Paste layout code here..."
                value={importValue}
                onValueChange={setImportValue}
                classNames={{
                  input: 'font-mono text-xs',
                }}
              />
              <Button
                color="primary"
                variant="flat"
                startContent={<Icon icon="lucide:download" />}
                onPress={handleImport}
                isDisabled={!importValue}
              >
                Import
              </Button>
            </div>
            <p className="text-xs text-warning-500 mt-2">
              ⚠️ Importing will replace your current layout
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
```

**成功基準**:
- ✅ ドラッグ&ドロップでウィジェット移動
- ✅ リサイズ可能なウィジェット
- ✅ 4種類のプリセットレイアウト
- ✅ レイアウトのインポート/エクスポート
- ✅ LocalStorageに自動保存
- ✅ リセット機能
- ✅ ウィジェットの表示/非表示切り替え

---

## Phase 4: 仕上げ・最適化（Week 7-8、80h）

### Sprint 4.1: レスポンシブデザイン（Day 26-30、40h）

**目標**: モバイル・タブレット対応

#### Task 4.1.1: ブレークポイント設定（12h）**

```typescript
// src/hooks/use-responsive.ts

import React from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>('xl');
  const [windowSize, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowSize({ width, height: window.innerHeight });

      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else if (width >= breakpoints.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    windowSize,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
};
```

**Task 4.1.2: レスポンシブコンポーネント改修（28h）**

```typescript
// src/components/responsive-agent-grid.tsx

import React from 'react';
import { useResponsive } from '../hooks/use-responsive';
import { AgentCard } from './agent-card';
import { Agent } from '../types/miyabi-types';

interface ResponsiveAgentGridProps {
  agents: Agent[];
}

export const ResponsiveAgentGrid: React.FC<ResponsiveAgentGridProps> = ({ agents }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getGridColumns = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  };

  const getCardSize = () => {
    if (isMobile) return 'compact';
    return 'normal';
  };

  return (
    <div className={`grid ${getGridColumns()} gap-4`}>
      {agents.map(agent => (
        <AgentCard key={agent.id} agent={agent} size={getCardSize()} />
      ))}
    </div>
  );
};
```

**成功基準**:
- ✅ 320px～3840pxまで対応
- ✅ モバイルでは1カラム表示
- ✅ タブレットでは2カラム表示
- ✅ デスクトップでは3～5カラム表示
- ✅ タッチ操作最適化

---

### Sprint 4.2: アクセシビリティ（Day 31-35、40h）

**目標**: WCAG 2.1 AA準拠

#### Task 4.2.1: キーボードナビゲーション（16h）**

```typescript
// src/hooks/use-keyboard-navigation.ts

import React from 'react';

export const useKeyboardNavigation = (itemCount: number) => {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => (prev + 1) % itemCount);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => (prev - 1 + itemCount) % itemCount);
          break;

        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;

        case 'End':
          e.preventDefault();
          setFocusedIndex(itemCount - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemCount]);

  return { focusedIndex, setFocusedIndex };
};
```

**Task 4.2.2: ARIAラベル追加（12h）**

```typescript
// Example: Accessible Agent Card

<Card
  role="article"
  aria-label={`${agent.name} agent, status: ${agent.status}, ${agent.tasks} tasks`}
  tabIndex={0}
>
  <CardBody>
    <h3 id={`agent-${agent.id}-title`}>{agent.name}</h3>
    <div aria-labelledby={`agent-${agent.id}-title`}>
      <span role="status" aria-live="polite">
        {agent.status}
      </span>
      <Progress
        value={agent.tasks}
        aria-label={`${agent.tasks} tasks in progress`}
      />
    </div>
  </CardBody>
</Card>
```

**Task 4.2.3: スクリーンリーダー対応（12h）**

```typescript
// src/components/accessible-notification.tsx

import React from 'react';

export const AccessibleNotification: React.FC<{ message: string }> = ({ message }) => {
  return (
    <>
      {/* Visual notification */}
      <div className="notification-toast">
        {message}
      </div>

      {/* Screen reader announcement */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    </>
  );
};
```

**成功基準**:
- ✅ 全要素にARIAラベル
- ✅ キーボードのみで操作可能
- ✅ Tab順序が論理的
- ✅ スクリーンリーダー対応
- ✅ フォーカス表示明確
- ✅ 色覚異常対応（色だけに依存しない）
- ✅ コントラスト比 4.5:1以上

---

## 🧪 テスト戦略

### ユニットテスト

**ツール**: Vitest + React Testing Library

**カバレッジ目標**: 80%以上

**主要テストケース**:

```typescript
// src/components/__tests__/agent-card.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentCard } from '../agent-card';

describe('AgentCard', () => {
  const mockAgent = {
    id: 1,
    name: 'しきるん',
    role: 'coordinator',
    category: 'coding' as const,
    status: 'active' as const,
    tasks: 3,
    color: 'danger' as const,
    description: 'Coordinator agent',
  };

  it('renders agent name and status', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('しきるん')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('displays task count correctly', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies correct color based on agent type', () => {
    const { container } = render(<AgentCard agent={mockAgent} />);
    expect(container.querySelector('.text-danger')).toBeInTheDocument();
  });
});
```

### 統合テスト

**テストシナリオ**:

1. **WebSocket接続とデータ更新**
2. **通知システムの動作**
3. **エラーリトライフロー**
4. **レイアウトカスタマイズ**

```typescript
// src/__tests__/integration/websocket-flow.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { WebSocketProvider } from '../../contexts/websocket-context';
import { LiveDashboard } from '../../components/live-dashboard';

describe('WebSocket Integration', () => {
  it('updates dashboard when WebSocket message received', async () => {
    const mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'message') {
          // Simulate incoming message
          setTimeout(() => {
            handler({
              data: JSON.stringify({
                type: 'agents',
                agents: [/* mock agent data */],
              }),
            });
          }, 100);
        }
      }),
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;

    render(
      <WebSocketProvider>
        <LiveDashboard />
      </WebSocketProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('しきるん')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
```

### E2Eテスト

**ツール**: Playwright

**主要シナリオ**:

```typescript
// e2e/dashboard.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Miyabi A2A Dashboard', () => {
  test('displays dashboard with all widgets', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check header
    await expect(page.locator('h1')).toHaveText('Miyabi A2A');

    // Check system status
    await expect(page.locator('.system-status-card')).toBeVisible();

    // Check agent grid
    const agents = page.locator('.agent-card');
    await expect(agents).toHaveCount(21);
  });

  test('opens notification history', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click notification bell
    await page.locator('.notification-bell').click();

    // Check modal opened
    await expect(page.locator('text=Notification History')).toBeVisible();
  });

  test('completes onboarding tour', async ({ page }) => {
    // Clear localStorage to trigger tour
    await page.goto('http://localhost:5173');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Tour should start
    await expect(page.locator('text=Welcome to Miyabi A2A Dashboard!')).toBeVisible();

    // Click through tour steps
    for (let i = 0; i < 8; i++) {
      await page.locator('button:has-text("Next")').click();
    }

    await page.locator('button:has-text("Finish")').click();

    // Tour should not appear again
    await page.reload();
    await expect(page.locator('text=Welcome to Miyabi A2A Dashboard!')).not.toBeVisible();
  });
});
```

**Playwright設定**:

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🚀 CI/CD統合

### GitHub Actionsワークフロー

```yaml
# .github/workflows/dashboard-ci.yml

name: Dashboard CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'crates/miyabi-a2a/dashboard/**'
      - '.github/workflows/dashboard-ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'crates/miyabi-a2a/dashboard/**'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: crates/miyabi-a2a/dashboard/package-lock.json

      - name: Install dependencies
        working-directory: crates/miyabi-a2a/dashboard
        run: npm ci

      - name: Run ESLint
        working-directory: crates/miyabi-a2a/dashboard
        run: npm run lint

      - name: Run TypeScript check
        working-directory: crates/miyabi-a2a/dashboard
        run: npx tsc --noEmit

      - name: Run unit tests
        working-directory: crates/miyabi-a2a/dashboard
        run: npm run test:unit -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./crates/miyabi-a2a/dashboard/coverage/coverage-final.json

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: crates/miyabi-a2a/dashboard/package-lock.json

      - name: Install dependencies
        working-directory: crates/miyabi-a2a/dashboard
        run: npm ci

      - name: Install Playwright
        working-directory: crates/miyabi-a2a/dashboard
        run: npx playwright install --with-deps

      - name: Run E2E tests
        working-directory: crates/miyabi-a2a/dashboard
        run: npm run test:e2e

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: crates/miyabi-a2a/dashboard/playwright-report/

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: crates/miyabi-a2a/dashboard
        run: npm ci

      - name: Build
        working-directory: crates/miyabi-a2a/dashboard
        run: npm run build

      - name: Run Lighthouse CI
        working-directory: crates/miyabi-a2a/dashboard
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=lighthouserc.json

  deploy:
    needs: [lint-and-test, e2e-test, lighthouse]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: crates/miyabi-a2a/dashboard
        run: npm ci

      - name: Build
        working-directory: crates/miyabi-a2a/dashboard
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: crates/miyabi-a2a/dashboard/dist
```

**Lighthouse設定**:

```json
// lighthouserc.json

{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## ⚠️ リスク管理

### 高リスク項目

| リスク | 影響度 | 発生確率 | 軽減策 |
|--------|--------|----------|--------|
| **WebSocket接続不安定** | 高 | 中 | 自動再接続、フォールバックポーリング実装 |
| **パフォーマンス劣化** | 高 | 中 | 仮想化、React.memo、Lighthouse監視 |
| **Rust APIの変更** | 中 | 低 | TypeScript型定義の厳密な管理 |
| **ブラウザ互換性** | 中 | 中 | Playwright複数ブラウザテスト |
| **アクセシビリティ不備** | 中 | 中 | axe DevTools定期監査 |

### 軽減戦略

1. **WebSocket接続不安定**
   ```typescript
   const MAX_RECONNECT_ATTEMPTS = 5;
   const RECONNECT_DELAY = 3000;

   useEffect(() => {
     let reconnectAttempts = 0;

     const connect = () => {
       const ws = new WebSocket(WS_URL);

       ws.onclose = () => {
         if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
           reconnectAttempts++;
           setTimeout(connect, RECONNECT_DELAY * reconnectAttempts);
         } else {
           // Fallback to polling
           startPolling();
         }
       };
     };

     connect();
   }, []);
   ```

2. **パフォーマンス監視**
   ```typescript
   // Performance monitoring hook
   export const usePerformanceMonitoring = () => {
     useEffect(() => {
       const observer = new PerformanceObserver((list) => {
         list.getEntries().forEach((entry) => {
           if (entry.duration > 100) {
             console.warn('Slow component:', entry.name, entry.duration);
             // Send to analytics
           }
         });
       });

       observer.observe({ entryTypes: ['measure'] });

       return () => observer.disconnect();
     }, []);
   };
   ```

---

## 🔒 セキュリティ考慮事項

### 1. XSS対策

```typescript
// src/utils/sanitize.ts

import DOMPurify from 'dompurify';

export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
    ALLOWED_ATTR: [],
  });
};

// Usage in component
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
```

### 2. CSRF対策

```typescript
// Rust API側でCSRFトークン検証
// フロントエンドではCookieベースのトークン送信

const fetchWithCSRF = async (url: string, options: RequestInit = {}) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken || '',
    },
  });
};
```

### 3. 機密情報の管理

```typescript
// 環境変数を使用（.env.local）
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws

// GitHubトークンなどは絶対にフロントエンドに露出しない
// すべてRust API経由でアクセス
```

### 4. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' ws://localhost:3001 wss://localhost:3001;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
">
```

---

## 📚 ドキュメント計画

### ユーザードキュメント

1. **クイックスタートガイド** (`docs/quickstart.md`)
   - ダッシュボードの起動方法
   - 基本的な操作方法
   - よくある質問

2. **機能ガイド** (`docs/features/`)
   - `metrics-chart.md` - メトリクスチャートの使い方
   - `notification-system.md` - 通知システムの設定
   - `custom-layout.md` - レイアウトカスタマイズ
   - `dag-visualization.md` - DAG可視化機能

3. **トラブルシューティング** (`docs/troubleshooting.md`)
   - WebSocket接続エラー
   - パフォーマンス問題
   - ブラウザ互換性

### 開発者ドキュメント

1. **アーキテクチャ図** (`docs/architecture/`)
   - コンポーネント構成図
   - データフロー図
   - WebSocket通信プロトコル

2. **API仕様** (`docs/api/`)
   - Rust API エンドポイント一覧
   - WebSocketメッセージフォーマット
   - TypeScript型定義

3. **コントリビューションガイド** (`CONTRIBUTING.md`)
   - 開発環境セットアップ
   - コーディング規約
   - PR作成手順

---

## 📊 成功指標（KPI）

### パフォーマンス指標

| 指標 | 現在値 | 目標値 | 測定方法 |
|------|--------|--------|----------|
| **Lighthouse Performance** | - | > 90 | Lighthouse CI |
| **First Contentful Paint (FCP)** | - | < 1.5s | Lighthouse |
| **Largest Contentful Paint (LCP)** | - | < 2.5s | Lighthouse |
| **Time to Interactive (TTI)** | - | < 3.0s | Lighthouse |
| **WebSocket接続時間** | - | < 500ms | カスタムメトリクス |
| **データ更新遅延** | - | < 1s | カスタムメトリクス |

### ユーザー体験指標

| 指標 | 現在値 | 目標値 | 測定方法 |
|------|--------|--------|----------|
| **ユーザー満足度** | - | > 4.5/5 | ユーザーフィードバック |
| **タスク完了率** | - | > 95% | アナリティクス |
| **エラー率** | - | < 1% | エラー追跡 |
| **DAU (Daily Active Users)** | - | 監視 | アナリティクス |
| **平均セッション時間** | - | 監視 | アナリティクス |

### 品質指標

| 指標 | 現在値 | 目標値 | 測定方法 |
|------|--------|--------|----------|
| **テストカバレッジ** | - | > 80% | Vitest |
| **TypeScriptエラー** | - | 0 | tsc --noEmit |
| **ESLintエラー** | - | 0 | ESLint |
| **アクセシビリティスコア** | - | 100 | axe DevTools |
| **セキュリティ脆弱性** | - | 0 | npm audit |

---

## 🎯 まとめ

この実装プランは、Miyabi A2Aダッシュボードを8週間で世界クラスのリアルタイム監視システムに進化させるための包括的なロードマップです。

### 主要なマイルストーン

- **Week 2終了時**: リアルタイムメトリクスとパフォーマンス最適化完了
- **Week 4終了時**: エラーハンドリングと通知システム完了
- **Week 6終了時**: DAG可視化とカスタムレイアウト完了
- **Week 8終了時**: レスポンシブ・アクセシビリティ対応完了、本番デプロイ

### 次のステップ

1. **Phase 1 Sprint 1.1から開始** - メトリクスチャートのリアルタイム実装
2. **各Taskを1つずつ完了** - テストとコードレビューを経て次へ
3. **毎週末にレビュー** - 進捗確認と調整
4. **ステークホルダーへのデモ** - 各Phase完了時

**すべての実装は、テスト・ドキュメント・レビューを含めた完全な形で提供されます。**

---

**このプランに従って実装を進めることで、高品質でメンテナンス性の高いダッシュボードが完成します。**

**実装開始日**: 2025-10-22
**完了予定日**: 2025-12-17 (8週間後)
