import React from "react";
import { Card, CardBody, CardHeader, Progress, Chip } from "@heroui/react";
import { useWebSocketContext } from "../contexts/websocket-context";

// データ型定義
interface WorktreeStatus {
  id: string;
  branch: string;
  issueNumber: number;
  agent: string;
  status: "active" | "idle" | "completed" | "failed";
  elapsedMinutes: number;
  startedAt: string;
}

interface AgentStatus {
  id: string;
  name: string;
  displayName: string;
  status: "working" | "idle" | "completed" | "failed";
  lastUpdated: string;
  elapsedMinutes: number;
  currentTask: string | null;
}

interface DependencyStatus {
  totalTasks: number;
  dependenciesRespected: number;
  priorityRespected: boolean;
  criticalPath: string[];
  violations: {
    taskId: string;
    message: string;
  }[];
}

interface TaskDecomposition {
  sizeDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  agentLoad: {
    agentName: string;
    taskCount: number;
    status: "overloaded" | "balanced" | "available";
  }[];
}

export function AdminOverviewEnhanced() {
  const { agents: wsAgents, systemStatus: wsSystemStatus, isConnected } = useWebSocketContext();

  // モックデータ
  const worktrees: WorktreeStatus[] = [
    {
      id: "wt-1",
      branch: "issue-270",
      issueNumber: 270,
      agent: "つくるん",
      status: "active",
      elapsedMinutes: 5,
      startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "wt-2",
      branch: "issue-271",
      issueNumber: 271,
      agent: "めだまん",
      status: "active",
      elapsedMinutes: 3,
      startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: "wt-3",
      branch: "issue-272",
      issueNumber: 272,
      agent: "はこぶん",
      status: "active",
      elapsedMinutes: 8,
      startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  ];

  const agentStatuses: AgentStatus[] = [
    {
      id: "coordinator",
      name: "CoordinatorAgent",
      displayName: "しきるん",
      status: "working",
      lastUpdated: new Date(Date.now() - 30 * 1000).toISOString(),
      elapsedMinutes: 0.5,
      currentTask: "Issue #270の分解中",
    },
    {
      id: "codegen",
      name: "CodeGenAgent",
      displayName: "つくるん",
      status: "working",
      lastUpdated: new Date(Date.now() - 60 * 1000).toISOString(),
      elapsedMinutes: 15,
      currentTask: "Issue #270実装中",
    },
    {
      id: "review",
      name: "ReviewAgent",
      displayName: "めだまん",
      status: "working",
      lastUpdated: new Date(Date.now() - 60 * 1000).toISOString(),
      elapsedMinutes: 1,
      currentTask: "Issue #271レビュー中",
    },
    {
      id: "deployment",
      name: "DeploymentAgent",
      displayName: "はこぶん",
      status: "failed",
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      elapsedMinutes: 8,
      currentTask: "Issue #272デプロイ失敗",
    },
  ];

  const dependencyStatus: DependencyStatus = {
    totalTasks: 15,
    dependenciesRespected: 15,
    priorityRespected: true,
    criticalPath: ["Task1", "Task3", "Task5"],
    violations: [
      {
        taskId: "task-7",
        message: "Task7がTask6完了前に開始（依存関係違反疑い）",
      },
    ],
  };

  const taskDecomposition: TaskDecomposition = {
    sizeDistribution: {
      small: 8,
      medium: 6,
      large: 2,
    },
    agentLoad: [
      { agentName: "つくるん", taskCount: 12, status: "overloaded" },
      { agentName: "めだまん", taskCount: 8, status: "balanced" },
      { agentName: "はこぶん", taskCount: 4, status: "available" },
    ],
  };

  const maxConcurrency = 5;
  const activeWorktrees = worktrees.filter((w) => w.status === "active").length;
  const workingAgents = agentStatuses.filter((a) => a.status === "working").length;
  const totalAgents = agentStatuses.length;

  const getAgentStatusColor = (agent: AgentStatus): "success" | "warning" | "danger" | "default" => {
    const minutesSinceUpdate = (Date.now() - new Date(agent.lastUpdated).getTime()) / 1000 / 60;
    if (agent.status === "failed") return "danger";
    if (minutesSinceUpdate > 5) return "danger";
    if (agent.elapsedMinutes > 15) return "warning";
    if (agent.status === "working") return "success";
    return "default";
  };

  const getAgentStatusLabel = (agent: AgentStatus): string => {
    const minutesSinceUpdate = (Date.now() - new Date(agent.lastUpdated).getTime()) / 1000 / 60;
    if (agent.status === "failed") return "❌ ERROR";
    if (minutesSinceUpdate > 5) return "❌ FROZEN";
    if (agent.elapsedMinutes > 15) return "⚠️ LONG RUN";
    if (agent.status === "working") return "✅ ACTIVE";
    return "⏸️ IDLE";
  };

  const getLoadStatusColor = (status: string): "success" | "warning" | "danger" => {
    if (status === "overloaded") return "danger";
    if (status === "available") return "success";
    return "warning";
  };

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-6 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 min-h-screen">
      {/* スタイル追加: ゲーム風アニメーション */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
                        0 0 40px rgba(59, 130, 246, 0.3),
                        inset 0 0 20px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8),
                        0 0 60px rgba(59, 130, 246, 0.5),
                        inset 0 0 30px rgba(59, 130, 246, 0.2);
          }
        }

        @keyframes scan-line {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes neon-border {
          0%, 100% {
            border-color: rgba(59, 130, 246, 0.5);
          }
          50% {
            border-color: rgba(139, 92, 246, 0.8);
          }
        }

        .cyber-card {
          background: linear-gradient(135deg,
            rgba(15, 23, 42, 0.9) 0%,
            rgba(30, 41, 59, 0.9) 50%,
            rgba(15, 23, 42, 0.9) 100%
          );
          border: 2px solid rgba(59, 130, 246, 0.3);
          animation: neon-border 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .cyber-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent,
            rgba(59, 130, 246, 0.5),
            transparent
          );
          animation: scan-line 3s linear infinite;
        }

        .worktree-active {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .stat-number {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 900;
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }

        .glass-effect {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* ヘッダー: サイバーパンク風 */}
      <div className="flex items-center justify-between cyber-card p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="text-6xl animate-pulse">🎮</div>
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              MIYABI COMMAND CENTER
            </h1>
            <p className="text-sm text-cyan-400 mt-1 font-mono">
              /// REAL-TIME AGENT ORCHESTRATION SYSTEM v2.0
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Chip
            color={isConnected ? "success" : "danger"}
            variant="shadow"
            className="animate-pulse"
            size="lg"
          >
            <span className="font-bold text-lg">
              {isConnected ? "🟢 ONLINE" : "🔴 OFFLINE"}
            </span>
          </Chip>
          <span className="text-xs font-mono text-gray-400">
            {new Date().toLocaleTimeString('ja-JP')}
          </span>
        </div>
      </div>

      {/* Section 1: Worktree並列実行 - ゲーム風 */}
      <div className="cyber-card p-6 rounded-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-2 font-mono">
            ⚡ PARALLEL EXECUTION MATRIX
          </h2>
          <div className="flex items-center gap-6">
            <span className="text-5xl font-black stat-number">
              {activeWorktrees} / {maxConcurrency}
            </span>
            <div className="flex-1">
              <div className="relative">
                <Progress
                  value={(activeWorktrees / maxConcurrency) * 100}
                  color={activeWorktrees >= maxConcurrency ? "danger" : "primary"}
                  size="lg"
                  className="h-8"
                  classNames={{
                    track: "bg-slate-800/50",
                    indicator: "bg-gradient-to-r from-cyan-500 to-blue-600"
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-sm drop-shadow-lg">
                    {Math.round((activeWorktrees / maxConcurrency) * 100)}% CAPACITY
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {worktrees.map((wt) => (
            <div
              key={wt.id}
              className="worktree-active glass-effect rounded-lg p-4 border-2 border-cyan-500"
            >
              <div className="text-center space-y-2">
                <div className="text-3xl font-black text-cyan-400">{wt.agent}</div>
                <div className="text-lg font-bold text-white">
                  Issue #{wt.issueNumber}
                </div>
                <div className="text-sm font-mono text-cyan-300">
                  ⏱️ {wt.elapsedMinutes}min
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xs">
                  ACTIVE
                </div>
              </div>
            </div>
          ))}
          {Array.from({ length: maxConcurrency - worktrees.length }).map((_, i) => (
            <div
              key={`idle-${i}`}
              className="glass-effect rounded-lg p-4 border-2 border-dashed border-gray-600 opacity-50"
            >
              <div className="flex items-center justify-center h-32">
                <span className="text-gray-500 font-mono text-sm">[ STANDBY ]</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Agent稼働状況 - ゲーム風 */}
      <div className="cyber-card p-6 rounded-xl">
        <h2 className="text-2xl font-black text-purple-400 mb-4 font-mono">
          🤖 AGENT STATUS MONITOR
        </h2>
        <div className="text-3xl font-bold text-purple-300 mb-6">
          {workingAgents} / {totalAgents} AGENTS DEPLOYED
        </div>

        <div className="space-y-3">
          {agentStatuses.map((agent) => {
            const minutesSinceUpdate = Math.floor(
              (Date.now() - new Date(agent.lastUpdated).getTime()) / 1000 / 60
            );
            const secondsSinceUpdate = Math.floor(
              ((Date.now() - new Date(agent.lastUpdated).getTime()) / 1000) % 60
            );

            return (
              <div
                key={agent.id}
                className="glass-effect rounded-lg p-4 border-l-4 border-purple-500 hover:scale-105 transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl font-black text-purple-300 min-w-[140px] font-mono">
                      {agent.displayName}
                    </span>
                    <Chip
                      color={getAgentStatusColor(agent)}
                      variant="shadow"
                      size="md"
                      className="font-bold font-mono"
                    >
                      {getAgentStatusLabel(agent)}
                    </Chip>
                    <span className="text-sm text-gray-300 font-mono">
                      {agent.currentTask || "[ IDLE ]"}
                    </span>
                  </div>
                  <div className="text-right text-sm font-mono text-gray-400">
                    <div>
                      LAST UPDATE: {minutesSinceUpdate > 0 ? `${minutesSinceUpdate}m` : `${secondsSinceUpdate}s`}
                    </div>
                    {agent.status === "working" && (
                      <div className="text-cyan-400">
                        RUNTIME: {agent.elapsedMinutes}min
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: 依存関係 - ゲーム風 */}
      <div className="cyber-card p-6 rounded-xl">
        <h2 className="text-2xl font-black text-yellow-400 mb-4 font-mono">
          📊 DEPENDENCY MATRIX & PRIORITY ENFORCEMENT
        </h2>

        <div className="glass-effect p-6 rounded-lg border-2 border-yellow-500 mb-6 animate-pulse">
          <div className="text-xl font-bold mb-3 text-yellow-300 font-mono">
            🎯 CRITICAL PATH DETECTED
          </div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            {dependencyStatus.criticalPath.join(" → ")}
          </div>
          <div className="text-sm text-yellow-300 mt-2 font-mono">
            ESTIMATED COMPLETION: 30 MINUTES
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-effect p-6 rounded-lg border-2 border-green-500">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">✅</span>
              <span className="font-bold text-green-300 font-mono">DEPENDENCY CHECK</span>
            </div>
            <div className="text-5xl font-black stat-number">
              {dependencyStatus.dependenciesRespected}/{dependencyStatus.totalTasks}
            </div>
            <div className="text-sm text-green-300 font-mono mt-2">TASKS VALIDATED</div>
          </div>

          <div className="glass-effect p-6 rounded-lg border-2 border-blue-500">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">✅</span>
              <span className="font-bold text-blue-300 font-mono">PRIORITY ORDER</span>
            </div>
            <div className="text-2xl font-bold text-blue-300 mt-2">
              P0 → P1 → P2
            </div>
            <div className="text-sm text-blue-300 font-mono mt-2">SEQUENCE ENFORCED</div>
          </div>
        </div>

        {dependencyStatus.violations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-bold text-red-400 font-mono text-lg">⚠️ VIOLATIONS DETECTED</h3>
            {dependencyStatus.violations.map((violation, i) => (
              <div key={i} className="glass-effect rounded-lg p-4 border-l-4 border-red-500 animate-pulse">
                <div className="text-sm font-mono text-red-300">[{violation.taskId}]</div>
                <div className="text-sm text-red-200">{violation.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: タスク分解 - ゲーム風 */}
      <div className="cyber-card p-6 rounded-xl">
        <h2 className="text-2xl font-black text-pink-400 mb-6 font-mono">
          📦 TASK DECOMPOSITION ANALYSIS
        </h2>

        {/* タスクサイズ分布 */}
        <div className="mb-8">
          <h3 className="font-bold mb-4 text-pink-300 font-mono text-lg">TASK SIZE DISTRIBUTION</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-green-400">SMALL (≤5min)</span>
                <span className="text-lg font-bold text-green-400">{taskDecomposition.sizeDistribution.small} TASKS</span>
              </div>
              <div className="relative">
                <Progress
                  value={(taskDecomposition.sizeDistribution.small / 16) * 100}
                  color="success"
                  size="lg"
                  className="h-6"
                  classNames={{
                    indicator: "bg-gradient-to-r from-green-500 to-emerald-600"
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-blue-400">MEDIUM (5-15min)</span>
                <span className="text-lg font-bold text-blue-400">{taskDecomposition.sizeDistribution.medium} TASKS</span>
              </div>
              <div className="relative">
                <Progress
                  value={(taskDecomposition.sizeDistribution.medium / 16) * 100}
                  color="primary"
                  size="lg"
                  className="h-6"
                  classNames={{
                    indicator: "bg-gradient-to-r from-blue-500 to-cyan-600"
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-orange-400">LARGE (≥15min)</span>
                <span className="text-lg font-bold text-orange-400 animate-pulse">
                  {taskDecomposition.sizeDistribution.large} TASKS ⚠️ NEEDS SPLITTING
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={(taskDecomposition.sizeDistribution.large / 16) * 100}
                  color="warning"
                  size="lg"
                  className="h-6"
                  classNames={{
                    indicator: "bg-gradient-to-r from-orange-500 to-red-600"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Agent負荷分散 */}
        <div>
          <h3 className="font-bold mb-4 text-pink-300 font-mono text-lg">AGENT LOAD BALANCING</h3>
          <div className="space-y-3">
            {taskDecomposition.agentLoad.map((agent) => (
              <div key={agent.agentName}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-pink-300 font-mono">{agent.agentName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{agent.taskCount} TASKS</span>
                    <Chip
                      size="sm"
                      color={getLoadStatusColor(agent.status)}
                      variant="shadow"
                      className="font-bold font-mono"
                    >
                      {agent.status === "overloaded"
                        ? "⚠️ OVERLOAD"
                        : agent.status === "available"
                        ? "✅ READY"
                        : "⚡ OPTIMAL"}
                    </Chip>
                  </div>
                </div>
                <Progress
                  value={(agent.taskCount / 12) * 100}
                  color={getLoadStatusColor(agent.status)}
                  size="lg"
                  className="h-6"
                  classNames={{
                    indicator: agent.status === "overloaded"
                      ? "bg-gradient-to-r from-red-500 to-orange-600"
                      : agent.status === "available"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Universe プレビューセクション（次のフェーズで実装） */}
      <div className="cyber-card p-8 rounded-xl text-center">
        <div className="text-6xl mb-4 animate-bounce">🌌</div>
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4">
          TASK UNIVERSE - 3D VISUALIZATION
        </h2>
        <p className="text-xl text-gray-400 mb-6 font-mono">
          [ LOADING HYPER-DIMENSIONAL TASK SPACE... ]
        </p>
        <div className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg animate-pulse cursor-pointer hover:scale-110 transition-transform">
          🚀 ACTIVATE 3D VIEW (COMING SOON)
        </div>
      </div>
    </div>
  );
}
