# 🚀 Quick Wins - すぐに実装できるUIUX改善

**作成日**: 2025-10-22
**目的**: 短時間で大きなインパクトを出せる改善項目

---

## ⚡ Top 5 Quick Wins

### 1. メトリクスチャートのリアルタイムデータ化 ⭐⭐⭐⭐⭐

**実装時間**: 4-6時間
**インパクト**: 非常に高い
**難易度**: 低-中

#### 現状
`src/components/metrics-chart.tsx`が静的なモックデータ使用

#### 実装内容
```tsx
// src/components/metrics-chart.tsx

import React from "react";
import { useMiyabiData } from "../hooks/use-miyabi-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MetricDataPoint {
  time: string;
  tasks: number;
  agents: number;
  throughput: number;
}

export const MetricsChart: React.FC = () => {
  const { systemStatus, agents } = useMiyabiData();
  const [metricsHistory, setMetricsHistory] = React.useState<MetricDataPoint[]>(() => {
    // LocalStorageから履歴読み込み
    const saved = localStorage.getItem('metrics-history');
    return saved ? JSON.parse(saved) : [];
  });

  // WebSocketデータを履歴に追加
  React.useEffect(() => {
    if (systemStatus && agents) {
      const newDataPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        tasks: systemStatus.active_tasks,
        agents: agents.filter(a => a.status === 'working' || a.status === 'active').length,
        throughput: systemStatus.task_throughput,
      };

      setMetricsHistory(prev => {
        const updated = [...prev, newDataPoint].slice(-50); // 最新50件保持
        localStorage.setItem('metrics-history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [systemStatus, agents]);

  // 1分ごとにデータポイント追加
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (systemStatus && agents) {
        const newDataPoint: MetricDataPoint = {
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          tasks: systemStatus.active_tasks,
          agents: agents.filter(a => a.status === 'working' || a.status === 'active').length,
          throughput: systemStatus.task_throughput,
        };

        setMetricsHistory(prev => {
          const updated = [...prev, newDataPoint].slice(-50);
          localStorage.setItem('metrics-history', JSON.stringify(updated));
          return updated;
        });
      }
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [systemStatus, agents]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={metricsHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="time" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#6366f1"
            fill="url(#colorTasks)"
            name="Active Tasks"
          />
          <Area
            type="monotone"
            dataKey="agents"
            stroke="#3b82f6"
            fill="url(#colorAgents)"
            name="Active Agents"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### チェックリスト
- [ ] LocalStorageから履歴読み込み
- [ ] WebSocketデータを1分ごとに追記
- [ ] 最新50件のみ保持
- [ ] リアルタイム更新アニメーション

---

### 2. Agentステータス可視化の強化 ⭐⭐⭐⭐

**実装時間**: 3-4時間
**インパクト**: 高い
**難易度**: 低

#### 実装内容
```tsx
// src/components/agent-card.tsx の一部更新

// 進捗バーの追加
<motion.div
  className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.div
    className={`h-full ${
      agent.status === 'working' ? 'bg-gradient-to-r from-green-400 to-green-600' :
      agent.status === 'error' ? 'bg-gradient-to-r from-red-400 to-red-600' :
      'bg-gradient-to-r from-blue-400 to-blue-600'
    }`}
    initial={{ width: 0 }}
    animate={{
      width: agent.tasks > 0 ? `${Math.min((agent.tasks / 5) * 100, 100)}%` : '0%'
    }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  />
</motion.div>

// エラー状態の点滅アニメーション
{agent.status === 'error' && (
  <motion.div
    className="absolute top-2 right-2"
    animate={{
      opacity: [1, 0.3, 1],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  >
    <Icon icon="lucide:alert-circle" className="h-5 w-5 text-red-500" />
  </motion.div>
)}

// Working状態のパルス強化（既存を改良）
{isWorking && (
  <motion.div
    className="absolute -inset-0.5 rounded-lg"
    animate={{
      boxShadow: [
        '0 0 0 0 rgba(16, 185, 129, 0.4)',
        '0 0 0 8px rgba(16, 185, 129, 0)',
      ],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
)}
```

#### チェックリスト
- [ ] タスク進捗バー追加
- [ ] エラー状態の点滅アニメーション
- [ ] Working状態のパルス強化
- [ ] グラデーション背景

---

### 3. 通知システムの優先度別表示 ⭐⭐⭐

**実装時間**: 3-4時間
**インパクト**: 中-高
**難易度**: 低

#### 実装内容
```tsx
// src/contexts/notification-context.tsx の更新

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  priority?: number; // 1-5, 5が最高
  action?: {
    label: string;
    onClick: () => void;
  };
}

// 優先度別の表示位置とスタイル
const getNotificationStyle = (type: NotificationType) => {
  switch (type) {
    case 'critical':
      return {
        position: 'center', // 画面中央モーダル
        bgColor: 'bg-red-600',
        icon: 'lucide:alert-triangle',
        sound: 'critical',
      };
    case 'error':
      return {
        position: 'top-right',
        bgColor: 'bg-red-500',
        icon: 'lucide:x-circle',
        sound: 'error',
      };
    case 'warning':
      return {
        position: 'top-right',
        bgColor: 'bg-yellow-500',
        icon: 'lucide:alert-circle',
        sound: 'warning',
      };
    case 'success':
      return {
        position: 'bottom-right',
        bgColor: 'bg-green-500',
        icon: 'lucide:check-circle',
        sound: 'success',
      };
    default:
      return {
        position: 'bottom-right',
        bgColor: 'bg-blue-500',
        icon: 'lucide:info',
        sound: null,
      };
  }
};

// 音声通知
const playSound = (soundType: string | null) => {
  if (!soundType) return;
  const audio = new Audio(`/sounds/${soundType}.mp3`);
  audio.volume = 0.3;
  audio.play().catch(console.error);
};

export const addNotification = (notification: Omit<Notification, 'id'>) => {
  const style = getNotificationStyle(notification.type);

  // 音声再生
  playSound(style.sound);

  // Critical通知は5秒後に自動クローズしない
  const duration = notification.type === 'critical'
    ? undefined
    : notification.duration || 5000;

  // 通知追加処理
  // ...
};
```

#### 必要なアセット
```bash
# public/sounds/ ディレクトリに音声ファイルを追加
public/
  sounds/
    critical.mp3  # 高音の警告音
    error.mp3     # 中音のエラー音
    warning.mp3   # 低音の注意音
    success.mp3   # 爽やかな完了音
```

#### チェックリスト
- [ ] 5段階の優先度定義
- [ ] 優先度別の表示位置
- [ ] 音声通知
- [ ] アクションボタン

---

### 4. エラーリカバリーUI ⭐⭐⭐⭐⭐

**実装時間**: 6-8時間
**インパクト**: 非常に高い
**難易度**: 中

#### 実装内容
```tsx
// src/components/error-recovery-panel.tsx (新規)

import React from "react";
import { Card, CardBody, Button, Chip, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface ErrorInfo {
  id: string;
  taskId?: string;
  agentId?: string;
  agentName?: string;
  message: string;
  stackTrace?: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isRetryable: boolean;
}

export const ErrorRecoveryPanel: React.FC<{ errors: ErrorInfo[] }> = ({ errors }) => {
  const [retrying, setRetrying] = React.useState<Record<string, boolean>>({});
  const [resolved, setResolved] = React.useState<Record<string, boolean>>({});

  const handleRetry = async (error: ErrorInfo) => {
    setRetrying(prev => ({ ...prev, [error.id]: true }));

    try {
      const response = await fetch(`/api/tasks/${error.taskId}/retry`, {
        method: 'POST',
      });

      if (response.ok) {
        setResolved(prev => ({ ...prev, [error.id]: true }));
        addNotification({
          type: 'success',
          title: 'Retry Success',
          message: `Task ${error.taskId} has been retried successfully`,
        });
      } else {
        throw new Error('Retry failed');
      }
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Retry Failed',
        message: `Failed to retry task ${error.taskId}`,
      });
    } finally {
      setRetrying(prev => ({ ...prev, [error.id]: false }));
    }
  };

  const handleDismiss = (errorId: string) => {
    setResolved(prev => ({ ...prev, [errorId]: true }));
  };

  const activeErrors = errors.filter(e => !resolved[e.id]);

  if (activeErrors.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <Icon icon="lucide:check-circle" className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No Active Errors</p>
          <p className="text-sm text-gray-500">All systems operating normally</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeErrors.map((error) => (
        <motion.div
          key={error.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          <Card className={`border-l-4 ${
            error.severity === 'critical' ? 'border-l-red-600' :
            error.severity === 'high' ? 'border-l-orange-500' :
            error.severity === 'medium' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Chip
                      size="sm"
                      color={
                        error.severity === 'critical' ? 'danger' :
                        error.severity === 'high' ? 'warning' :
                        'default'
                      }
                    >
                      {error.severity.toUpperCase()}
                    </Chip>
                    {error.agentName && (
                      <Chip size="sm" variant="flat">
                        {error.agentName}
                      </Chip>
                    )}
                    <span className="text-xs text-gray-500">
                      {error.timestamp.toLocaleString()}
                    </span>
                  </div>

                  <p className="font-medium text-lg mb-2">{error.message}</p>

                  {error.stackTrace && (
                    <Accordion variant="bordered">
                      <AccordionItem title="Stack Trace">
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                          {error.stackTrace}
                        </pre>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {error.isRetryable && (
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Icon icon="lucide:refresh-cw" />}
                      onClick={() => handleRetry(error)}
                      isLoading={retrying[error.id]}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    color="default"
                    size="sm"
                    variant="flat"
                    startContent={<Icon icon="lucide:x" />}
                    onClick={() => handleDismiss(error.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
```

#### Rust API追加
```rust
// crates/miyabi-a2a/src/http/routes.rs

/// Retry a failed task
pub async fn retry_task(
    Path(task_id): Path<String>,
) -> Result<Json<TaskRetryResponse>, StatusCode> {
    // Task retry logic
    Ok(Json(TaskRetryResponse {
        task_id,
        status: "retrying".to_string(),
        message: "Task has been queued for retry".to_string(),
    }))
}

// Add to router
Router::new()
    .route("/api/tasks/:id/retry", post(retry_task))
```

#### チェックリスト
- [ ] エラー詳細表示
- [ ] ワンクリックリトライ
- [ ] スタックトレース展開
- [ ] Rust APIエンドポイント追加

---

### 5. ダークモードのコントラスト最適化 ⭐⭐

**実装時間**: 2-3時間
**インパクト**: 中
**難易度**: 非常に低

#### 実装内容
```tsx
// tailwind.config.js の更新

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ダークモード最適化カラー
        'dark': {
          bg: {
            primary: '#0f172a',    // slate-900
            secondary: '#1e293b',  // slate-800
            tertiary: '#334155',   // slate-700
          },
          text: {
            primary: '#f1f5f9',    // slate-100
            secondary: '#cbd5e1',  // slate-300
            tertiary: '#94a3b8',   // slate-400
          },
          border: '#475569',       // slate-600
        },
      },
    },
  },
};
```

```tsx
// src/components/metrics-chart.tsx の更新

import { useTheme } from '../contexts/theme-context';

export const MetricsChart = () => {
  const { theme } = useTheme();

  const chartColors = theme === 'dark'
    ? {
        grid: '#475569',
        text: '#cbd5e1',
        area1: '#6366f1',
        area2: '#3b82f6',
      }
    : {
        grid: '#e5e7eb',
        text: '#6b7280',
        area1: '#6366f1',
        area2: '#3b82f6',
      };

  return (
    <AreaChart>
      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
      <XAxis stroke={chartColors.text} />
      <YAxis stroke={chartColors.text} />
      {/* ... */}
    </AreaChart>
  );
};
```

#### チェックリスト
- [ ] Tailwindカラーパレット更新
- [ ] チャートカラー動的切り替え
- [ ] WCAG 2.1 AA基準達成（4.5:1）
- [ ] スムーズなテーマ切り替えアニメーション

---

## 📦 必要なNPMパッケージ（Quick Wins用）

```bash
# すべて既存依存関係内で実装可能！
# 追加パッケージ不要
```

---

## ⏱️ 実装スケジュール

### Day 1（8h）
- [ ] メトリクスチャートリアルタイム化（4-6h）
- [ ] Agentステータス強化（2-3h）

### Day 2（8h）
- [ ] 通知システム優先度別表示（3-4h）
- [ ] ダークモード最適化（2-3h）
- [ ] テスト・デバッグ（2h）

### Day 3（8h）
- [ ] エラーリカバリーUI（6-8h）

**合計**: 3日間（24時間）で5つの改善完了

---

## 🎯 期待される成果

### ユーザー体験
- リアルタイムデータで状況把握が容易に
- エラーからの復旧が30秒→5秒に短縮
- 視覚的なフィードバックで直感的な理解

### 技術指標
- WebSocketデータ活用率: 100%
- LocalStorage活用でページリロード後も継続
- アクセシビリティスコア向上

---

## 🚧 注意事項

### Rust API側の対応が必要
- `POST /api/tasks/:id/retry` エンドポイント追加
- エラー情報のWebSocket配信

### LocalStorage容量
- メトリクス履歴は最新50件のみ保持（約5KB）
- 定期的にクリーンアップ

### 音声ファイル
- public/sounds/に4つの音声ファイル配置
- 合計サイズ: ~100KB以下推奨

---

**これらのQuick Winsを実装すれば、ユーザー体験が劇的に向上します！**
