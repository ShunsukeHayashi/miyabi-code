# Miyabi A2A Dashboard - UIUX改善プラン

**作成日**: 2025-10-22
**対象**: Miyabi A2A リアルタイムダッシュボード
**目的**: ユーザー体験の向上、視認性の改善、インタラクションの強化

---

## 📊 現状分析

### 既存コンポーネント一覧

| カテゴリ | コンポーネント | 状態 | 使用技術 |
|---------|---------------|------|---------|
| **メインUI** | dashboard.tsx | ✅ 実装済 | React + HeroUI |
| | live-dashboard.tsx | ✅ 実装済 | React + HeroUI |
| | header.tsx | ✅ 実装済 | React + HeroUI |
| **Agent表示** | agent-card.tsx | ✅ 実装済 | Framer Motion |
| | agent-detail-modal.tsx | ✅ 実装済 | HeroUI Modal |
| | agent-filters.tsx | ✅ 実装済 | HeroUI |
| | agent-collaboration.tsx | ✅ 実装済 | フロー図 |
| **データ可視化** | metrics-chart.tsx | ✅ 実装済 | Recharts |
| | performance-analytics.tsx | ✅ 実装済 | Recharts |
| **イベント** | event-timeline.tsx | ✅ 実装済 | React + HeroUI |
| | notification-history.tsx | ✅ 実装済 | React + HeroUI |
| **運用** | error-dashboard.tsx | ✅ 実装済 | React + HeroUI |
| | logs-viewer.tsx | ✅ 実装済 | React + HeroUI |
| | control-panel.tsx | ✅ 実装済 | React + HeroUI |

### 強み
- ✅ リアルタイムWebSocket接続
- ✅ Framer Motionによるアニメーション
- ✅ Rechartsによるデータビジュアライゼーション
- ✅ 21個のAgent管理機能
- ✅ イベントタイムライン
- ✅ パフォーマンス分析

### 改善の余地
- ⚠️ メトリクスチャートがモックデータ
- ⚠️ Agent間の依存関係が可視化されていない
- ⚠️ リアルタイム性が一部コンポーネントのみ
- ⚠️ モバイル対応が不完全
- ⚠️ アクセシビリティ対応が不足

---

## 🎨 カテゴリ1: 視覚的改善（Visual Improvements）

### 1.1 Agent ステータス可視化の強化 ⭐⭐⭐

**優先度**: 高
**実装難易度**: 中
**インパクト**: 高

#### 現状
- Agentカードに基本的なステータス表示（active, working, idle, error）
- 単色のステータスバッジ

#### 改善案
1. **グラデーションステータスバー**
   ```tsx
   <motion.div
     className="h-1 bg-gradient-to-r from-green-400 to-green-600"
     initial={{ width: 0 }}
     animate={{ width: `${agent.progress}%` }}
     transition={{ duration: 0.5 }}
   />
   ```

2. **パルスアニメーション強化**
   - Working状態: 緑のパルス（現在実装済）
   - Error状態: 赤の点滅
   - Idle状態: 青の静的表示

3. **タスク進捗リング**
   ```tsx
   <svg className="transform -rotate-90">
     <circle
       cx="50" cy="50" r="45"
       stroke="currentColor"
       strokeWidth="8"
       fill="none"
       strokeDasharray={circumference}
       strokeDashoffset={circumference - (progress / 100) * circumference}
     />
   </svg>
   ```

**実装ファイル**: `src/components/agent-card.tsx`

---

### 1.2 ダークモード最適化 ⭐⭐

**優先度**: 中
**実装難易度**: 低
**インパクト**: 中

#### 現状
- ThemeContextで基本的なダークモード実装済

#### 改善案
1. **コントラスト比の最適化**
   - WCAG 2.1 AA基準（4.5:1）達成
   - ダークモードでのチャートカラーパレット最適化

2. **スムーズなテーマ切り替え**
   ```tsx
   <motion.div
     initial={false}
     animate={{
       backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
     }}
     transition={{ duration: 0.3 }}
   />
   ```

**実装ファイル**: `src/contexts/theme-context.tsx`, `tailwind.config.js`

---

### 1.3 Agent間依存関係の可視化 ⭐⭐⭐

**優先度**: 高
**実装難易度**: 高
**インパクト**: 非常に高

#### 現状
- agent-collaboration.tsxに静的なフロー図

#### 改善案
1. **インタラクティブDAGビューア**
   - React FlowまたはD3.jsを使用
   - Rust APIから取得した実データでDAG表示

2. **実装例**
   ```tsx
   import ReactFlow, { Background, Controls } from 'reactflow';

   const DagVisualizer = ({ nodes, edges }) => {
     return (
       <ReactFlow
         nodes={nodes.map(node => ({
           id: node.id,
           data: {
             label: node.label,
             agent: node.agent,
             status: node.status
           },
           position: calculatePosition(node),
         }))}
         edges={edges.map(edge => ({
           id: `${edge.from}-${edge.to}`,
           source: edge.from,
           target: edge.to,
           animated: edge.type === 'depends_on',
         }))}
       >
         <Background />
         <Controls />
       </ReactFlow>
     );
   };
   ```

3. **ステータス連動**
   - ノードの色がAgentステータスに連動
   - エッジのアニメーションで依存関係を表現
   - ホバーで詳細情報表示

**新規ファイル**: `src/components/dag-visualizer.tsx`
**API連携**: `GET /api/workflow/dag` (routes.rs:156)

---

### 1.4 メトリクスチャートのリアルタイムデータ化 ⭐⭐⭐

**優先度**: 高
**実装難易度**: 中
**インパクト**: 高

#### 現状
- metrics-chart.tsxがモックデータ使用

#### 改善案
1. **WebSocket連携**
   ```tsx
   const MetricsChart = () => {
     const [metricsHistory, setMetricsHistory] = React.useState([]);
     const { systemStatus } = useMiyabiData();

     React.useEffect(() => {
       if (systemStatus) {
         setMetricsHistory(prev => [
           ...prev.slice(-50), // 直近50データポイント保持
           {
             time: new Date().toLocaleTimeString(),
             tasks: systemStatus.active_tasks,
             agents: systemStatus.active_agents,
             throughput: systemStatus.task_throughput,
           }
         ]);
       }
     }, [systemStatus]);

     return <AreaChart data={metricsHistory} />;
   };
   ```

2. **時系列データ保存**
   - LocalStorageまたはIndexedDBで履歴保存
   - ページリロード後も継続表示

**実装ファイル**: `src/components/metrics-chart.tsx`

---

## 🔧 カテゴリ2: 機能的改善（Functional Improvements）

### 2.1 Agent操作機能の追加 ⭐⭐

**優先度**: 中
**実装難易度**: 中
**インパクト**: 中

#### 改善案
1. **Agent一時停止/再開ボタン**
   - Agentカードにアクションボタン追加
   - Rust API連携（新規エンドポイント必要）

2. **Agent優先度調整**
   - ドラッグ&ドロップで優先度変更
   - 優先度に応じてタスク割り当て

3. **実装例**
   ```tsx
   const AgentControls = ({ agent }) => {
     const handlePause = async () => {
       await fetch(`/api/agents/${agent.id}/pause`, { method: 'POST' });
     };

     return (
       <div className="flex gap-2">
         <Button
           size="sm"
           variant="flat"
           onClick={handlePause}
           disabled={agent.status === 'idle'}
         >
           {agent.status === 'working' ? '⏸️ Pause' : '▶️ Resume'}
         </Button>
       </div>
     );
   };
   ```

**新規API**:
- `POST /api/agents/:id/pause`
- `POST /api/agents/:id/resume`
- `POST /api/agents/:id/priority`

---

### 2.2 通知システムの強化 ⭐⭐

**優先度**: 中
**実装難易度**: 低
**インパクト**: 中

#### 現状
- notification-context.tsxで基本的な通知実装

#### 改善案
1. **通知の優先度別表示**
   - Critical: 赤、画面中央モーダル
   - Warning: 黄、右上トースト
   - Info: 青、右下トースト

2. **音声通知**
   ```tsx
   const playNotificationSound = (type: 'success' | 'error' | 'warning') => {
     const audio = new Audio(`/sounds/${type}.mp3`);
     audio.play();
   };
   ```

3. **通知履歴のフィルタリング**
   - 日付範囲でフィルタ
   - Agent別フィルタ
   - 重要度別フィルタ

**実装ファイル**: `src/contexts/notification-context.tsx`, `src/components/notification-history.tsx`

---

### 2.3 キーボードショートカット ⭐

**優先度**: 低
**実装難易度**: 低
**インパクト**: 中

#### 改善案
1. **グローバルショートカット**
   - `Ctrl/Cmd + K`: コマンドパレット
   - `Ctrl/Cmd + D`: ダークモード切り替え
   - `Ctrl/Cmd + R`: データ再読み込み
   - `Ctrl/Cmd + F`: Agent検索

2. **実装例**
   ```tsx
   useEffect(() => {
     const handleKeyPress = (e: KeyboardEvent) => {
       if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
         e.preventDefault();
         openCommandPalette();
       }
     };

     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, []);
   ```

**新規ファイル**: `src/hooks/use-keyboard-shortcuts.ts`

---

### 2.4 カスタムダッシュボードレイアウト ⭐⭐

**優先度**: 中
**実装難易度**: 高
**インパクト**: 高

#### 改善案
1. **ドラッグ&ドロップレイアウト**
   - React Grid Layoutを使用
   - ウィジェット配置のカスタマイズ

2. **実装例**
   ```tsx
   import GridLayout from 'react-grid-layout';

   const DashboardLayout = () => {
     const [layout, setLayout] = React.useState(loadLayout());

     return (
       <GridLayout
         className="layout"
         layout={layout}
         cols={12}
         rowHeight={30}
         width={1200}
         onLayoutChange={saveLayout}
         draggableHandle=".drag-handle"
       >
         <div key="agents">
           <AgentGrid />
         </div>
         <div key="metrics">
           <MetricsChart />
         </div>
         <div key="timeline">
           <EventTimeline />
         </div>
       </GridLayout>
     );
   };
   ```

**新規ファイル**: `src/components/custom-dashboard.tsx`

---

## 🎯 カテゴリ3: UX改善（User Experience）

### 3.1 オンボーディングツアー ⭐⭐

**優先度**: 中
**実装難易度**: 中
**インパクト**: 高

#### 改善案
1. **インタラクティブガイド**
   - React Joyrideを使用
   - 初回訪問時に自動表示

2. **実装例**
   ```tsx
   import Joyride from 'react-joyride';

   const steps = [
     {
       target: '.agent-card',
       content: 'これはAgentカードです。各Agentの状態とタスク数が表示されます。',
     },
     {
       target: '.metrics-chart',
       content: 'メトリクスチャートでシステムのパフォーマンスを監視できます。',
     },
   ];

   const OnboardingTour = () => {
     const [run, setRun] = React.useState(!localStorage.getItem('tour-completed'));

     return (
       <Joyride
         steps={steps}
         run={run}
         continuous
         showSkipButton
         callback={(data) => {
           if (data.status === 'finished') {
             localStorage.setItem('tour-completed', 'true');
           }
         }}
       />
     );
   };
   ```

**新規ファイル**: `src/components/onboarding-tour.tsx`

---

### 3.2 エラーリカバリーUI ⭐⭐⭐

**優先度**: 高
**実装難易度**: 中
**インパクト**: 高

#### 現状
- error-dashboard.tsxで基本的なエラー表示

#### 改善案
1. **詳細なエラー情報**
   - スタックトレース表示
   - エラー発生時刻・頻度
   - 影響範囲（どのAgentが停止したか）

2. **ワンクリックリトライ**
   ```tsx
   const ErrorRecovery = ({ error }) => {
     const [retrying, setRetrying] = React.useState(false);

     const handleRetry = async () => {
       setRetrying(true);
       try {
         await fetch(`/api/tasks/${error.taskId}/retry`, { method: 'POST' });
         addNotification({ type: 'success', message: 'タスクを再試行しました' });
       } catch (e) {
         addNotification({ type: 'error', message: '再試行に失敗しました' });
       } finally {
         setRetrying(false);
       }
     };

     return (
       <Button
         color="primary"
         onClick={handleRetry}
         isLoading={retrying}
       >
         🔄 Retry
       </Button>
     );
   };
   ```

**実装ファイル**: `src/components/error-dashboard.tsx`
**新規API**: `POST /api/tasks/:id/retry`

---

### 3.3 レスポンシブデザイン最適化 ⭐⭐

**優先度**: 中
**実装難易度**: 中
**インパクト**: 中

#### 改善案
1. **モバイル専用レイアウト**
   - タブレット: 2カラムレイアウト
   - スマートフォン: 1カラムレイアウト

2. **実装例**
   ```tsx
   const ResponsiveDashboard = () => {
     const isMobile = useMediaQuery('(max-width: 768px)');
     const isTablet = useMediaQuery('(max-width: 1024px)');

     if (isMobile) {
       return <MobileDashboard />;
     }

     if (isTablet) {
       return <TabletDashboard />;
     }

     return <DesktopDashboard />;
   };
   ```

**新規ファイル**: `src/hooks/use-media-query.ts`

---

### 3.4 パフォーマンス最適化 ⭐⭐⭐

**優先度**: 高
**実装難易度**: 中
**インパクト**: 高

#### 改善案
1. **仮想化リスト**
   - react-windowを使用
   - 大量のAgent/Event表示時の最適化

2. **実装例**
   ```tsx
   import { FixedSizeList } from 'react-window';

   const VirtualizedAgentList = ({ agents }) => {
     const Row = ({ index, style }) => (
       <div style={style}>
         <AgentCard agent={agents[index]} />
       </div>
     );

     return (
       <FixedSizeList
         height={600}
         itemCount={agents.length}
         itemSize={120}
         width="100%"
       >
         {Row}
       </FixedSizeList>
     );
   };
   ```

3. **メモ化の徹底**
   ```tsx
   const MemoizedAgentCard = React.memo(AgentCard, (prev, next) => {
     return prev.agent.status === next.agent.status &&
            prev.agent.tasks === next.agent.tasks;
   });
   ```

**実装ファイル**: `src/components/agent-grid.tsx`（新規）

---

## 📈 優先順位マトリクス

### 実装優先度（Impact × Ease）

| 改善項目 | Impact | Ease | Priority | 実装時間 |
|---------|--------|------|---------|---------|
| **Agent間依存関係可視化** | ⭐⭐⭐⭐⭐ | ⭐⭐ | 🔥 P0 | 8-12h |
| **メトリクスリアルタイム化** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🔥 P0 | 4-6h |
| **エラーリカバリーUI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🔥 P0 | 6-8h |
| **パフォーマンス最適化** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 🔥 P0 | 6-8h |
| **Agentステータス強化** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 🔥 P1 | 3-4h |
| **オンボーディングツアー** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 🔥 P1 | 4-6h |
| **カスタムレイアウト** | ⭐⭐⭐⭐ | ⭐⭐ | 📌 P2 | 10-14h |
| **Agent操作機能** | ⭐⭐⭐ | ⭐⭐⭐ | 📌 P2 | 6-8h |
| **通知システム強化** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 📌 P2 | 3-4h |
| **レスポンシブ最適化** | ⭐⭐⭐ | ⭐⭐⭐ | 📌 P2 | 6-8h |
| **ダークモード最適化** | ⭐⭐ | ⭐⭐⭐⭐⭐ | 📝 P3 | 2-3h |
| **キーボードショートカット** | ⭐⭐ | ⭐⭐⭐⭐ | 📝 P3 | 3-4h |

---

## 🚀 実装ロードマップ

### Phase 1: 基礎強化（Week 1-2）

**目標**: リアルタイム性とパフォーマンスの向上

1. ✅ メトリクスチャートリアルタイム化（4-6h）
2. ✅ パフォーマンス最適化（6-8h）
3. ✅ Agentステータス可視化強化（3-4h）

**成果物**:
- リアルタイムメトリクス表示
- 仮想化リスト実装
- 滑らかなアニメーション

---

### Phase 2: UX改善（Week 3-4）

**目標**: ユーザビリティの向上

1. ✅ エラーリカバリーUI（6-8h）
2. ✅ オンボーディングツアー（4-6h）
3. ✅ 通知システム強化（3-4h）

**成果物**:
- ワンクリックエラー復旧
- 初回訪問者ガイド
- 優先度別通知

---

### Phase 3: 高度な機能（Week 5-6）

**目標**: 可視化とカスタマイゼーション

1. ✅ Agent間依存関係可視化（8-12h）
2. ✅ カスタムダッシュボードレイアウト（10-14h）
3. ✅ Agent操作機能（6-8h）

**成果物**:
- インタラクティブDAGビューア
- ドラッグ&ドロップレイアウト
- Agent制御パネル

---

### Phase 4: 仕上げ（Week 7-8）

**目標**: 細部の洗練

1. ✅ レスポンシブデザイン最適化（6-8h）
2. ✅ ダークモード最適化（2-3h）
3. ✅ キーボードショートカット（3-4h）
4. ✅ アクセシビリティ対応（4-6h）

**成果物**:
- 全デバイス対応
- キーボードナビゲーション
- WCAG 2.1 AA準拠

---

## 📦 必要な追加ライブラリ

### NPM パッケージ

```json
{
  "dependencies": {
    "reactflow": "^11.10.0",           // DAG可視化
    "react-grid-layout": "^1.4.0",     // カスタムレイアウト
    "react-window": "^1.8.10",         // 仮想化リスト
    "react-joyride": "^2.7.0",         // オンボーディング
    "d3": "^7.8.0",                    // 高度なビジュアライゼーション
    "framer-motion": "^10.16.0"        // ✅ 既存
  }
}
```

### Rust API 追加エンドポイント

```rust
// Agent制御
POST   /api/agents/:id/pause
POST   /api/agents/:id/resume
PUT    /api/agents/:id/priority

// タスク操作
POST   /api/tasks/:id/retry
DELETE /api/tasks/:id/cancel

// ダッシュボード設定
GET    /api/dashboard/layout
PUT    /api/dashboard/layout
```

---

## 🎯 成功指標（KPI）

### ユーザー体験

- ページロード時間: < 2秒
- インタラクション応答時間: < 100ms
- エラーからの復旧時間: < 30秒

### 技術指標

- Lighthouse Performance Score: > 90
- First Contentful Paint: < 1.5秒
- Time to Interactive: < 3.5秒
- WebSocket接続維持率: > 99%

### ビジネス指標

- ダッシュボード滞在時間: > 5分
- オンボーディング完了率: > 80%
- エラー解決成功率: > 90%

---

## 📚 参考資料

### デザインシステム
- [HeroUI Documentation](https://heroui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

### ビジュアライゼーション
- [Recharts](https://recharts.org/)
- [React Flow](https://reactflow.dev/)
- [D3.js](https://d3js.org/)

### ベストプラクティス
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔍 次のアクション

### 今すぐ実装可能（Quick Wins）

1. **メトリクスチャートリアルタイム化**（4-6h）
   - 既存のWebSocket接続を活用
   - LocalStorage履歴保存

2. **Agentステータス強化**（3-4h）
   - 既存のagent-card.tsxに追加
   - Framer Motion活用

3. **通知システム強化**（3-4h）
   - 既存のnotification-contextを拡張

### 中期的取り組み（Medium-term）

1. **Agent間依存関係可視化**（8-12h）
   - React Flow導入
   - Rust APIからDAGデータ取得

2. **エラーリカバリーUI**（6-8h）
   - 既存のerror-dashboardを強化
   - Rust APIにリトライエンドポイント追加

### 長期的ビジョン（Long-term）

1. **AIアシスタント統合**
   - チャットボットでダッシュボード操作
   - 自然言語クエリ

2. **予測分析**
   - 機械学習でタスク完了時刻予測
   - ボトルネック検出

---

**このプランは段階的に実装可能です。Phase 1から順次進めることを推奨します。**
