import React from "react";
import { Card, CardBody, CardHeader, Progress, Chip } from "@heroui/react";
import { useWebSocketContext } from "../contexts/websocket-context";
import { VectorSpaceUniverse } from "./vector-space-universe";

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
  displayName: string; // しきるん, つくるん等
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
    small: number; // 5分以下
    medium: number; // 5-15分
    large: number; // 15分以上
  };
  agentLoad: {
    agentName: string;
    taskCount: number;
    status: "overloaded" | "balanced" | "available";
  }[];
}

export function AdminOverview() {
  const { agents: wsAgents, systemStatus: wsSystemStatus, isConnected } = useWebSocketContext();

  // モックデータ（実装時にWebSocketデータに置き換え）
  const worktrees: WorktreeStatus[] = [
    {
      id: "wt-1",
      branch: "issue-270",
      issueNumber: 270,
      agent: "CodeGen",
      status: "active",
      elapsedMinutes: 5,
      startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "wt-2",
      branch: "issue-271",
      issueNumber: 271,
      agent: "Review",
      status: "active",
      elapsedMinutes: 3,
      startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: "wt-3",
      branch: "issue-272",
      issueNumber: 272,
      agent: "Deploy",
      status: "active",
      elapsedMinutes: 8,
      startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
  ];

  const agentStatuses: AgentStatus[] = [
    {
      id: "coordinator",
      name: "CoordinatorAgent",
      displayName: "Coordinator",
      status: "working",
      lastUpdated: new Date(Date.now() - 30 * 1000).toISOString(),
      elapsedMinutes: 0.5,
      currentTask: "Issue #270 Decomposition",
    },
    {
      id: "codegen",
      name: "CodeGenAgent",
      displayName: "CodeGen",
      status: "working",
      lastUpdated: new Date(Date.now() - 60 * 1000).toISOString(),
      elapsedMinutes: 15,
      currentTask: "Issue #270 Implementation",
    },
    {
      id: "review",
      name: "ReviewAgent",
      displayName: "Review",
      status: "working",
      lastUpdated: new Date(Date.now() - 60 * 1000).toISOString(),
      elapsedMinutes: 1,
      currentTask: "Issue #271 Code Review",
    },
    {
      id: "deployment",
      name: "DeploymentAgent",
      displayName: "Deploy",
      status: "failed",
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      elapsedMinutes: 8,
      currentTask: "Issue #272 Deployment Failed",
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
      { agentName: "CodeGen", taskCount: 12, status: "overloaded" },
      { agentName: "Review", taskCount: 8, status: "balanced" },
      { agentName: "Deploy", taskCount: 4, status: "available" },
    ],
  };

  const maxConcurrency = 5;
  const activeWorktrees = worktrees.filter((w) => w.status === "active").length;
  const workingAgents = agentStatuses.filter((a) => a.status === "working").length;
  const totalAgents = agentStatuses.length;

  // ステータス色判定
  const getAgentStatusColor = (agent: AgentStatus): "success" | "warning" | "danger" | "default" => {
    const minutesSinceUpdate = (Date.now() - new Date(agent.lastUpdated).getTime()) / 1000 / 60;

    if (agent.status === "failed") return "danger";
    if (minutesSinceUpdate > 5) return "danger"; // 5分以上更新なし = 停止疑い
    if (agent.elapsedMinutes > 15) return "warning"; // 15分以上実行 = 長時間実行
    if (agent.status === "working") return "success";
    return "default";
  };

  const getAgentStatusLabel = (agent: AgentStatus): string => {
    const minutesSinceUpdate = (Date.now() - new Date(agent.lastUpdated).getTime()) / 1000 / 60;

    if (agent.status === "failed") return "❌ エラー";
    if (minutesSinceUpdate > 5) return "❌ 停止疑い";
    if (agent.elapsedMinutes > 15) return "⚠️ 長時間実行中";
    if (agent.status === "working") return "✅ 稼働中";
    return "⏸️ アイドル";
  };

  const getLoadStatusColor = (status: string): "success" | "warning" | "danger" => {
    if (status === "overloaded") return "danger";
    if (status === "available") return "success";
    return "warning";
  };

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-6 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="flex items-center justify-between animate-in slide-in-from-top duration-700">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            📊 Miyabi Admin Dashboard
          </h1>
          <p className="text-sm text-default-500 mt-1">統合管理ビュー - 1画面で全体を把握</p>
        </div>
        <Chip
          color={isConnected ? "success" : "danger"}
          variant="flat"
          className="animate-pulse"
        >
          {isConnected ? "🟢 接続中" : "🔴 切断"}
        </Chip>
      </div>

      {/* Section 1: Worktree並列実行状況 */}
      <Card className="animate-in slide-in-from-left duration-700">
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">🔄 Worktree並列実行状況</h2>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-primary">
              {activeWorktrees}本 / 最大{maxConcurrency}本
            </span>
            <Progress
              value={(activeWorktrees / maxConcurrency) * 100}
              color={activeWorktrees >= maxConcurrency ? "danger" : "primary"}
              className="w-64"
              role="progressbar"
              aria-label="Worktree capacity"
              aria-valuenow={(activeWorktrees / maxConcurrency) * 100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {worktrees.map((wt) => (
              <Card key={wt.id} className="border-2 border-primary">
                <CardBody className="space-y-2">
                  <div className="text-center font-bold text-lg">{wt.agent}</div>
                  <div className="text-sm text-center text-default-500">
                    Issue #{wt.issueNumber}
                  </div>
                  <div className="text-xs text-center">
                    ⏱️ {wt.elapsedMinutes}分経過
                  </div>
                  <Chip
                    color={
                      wt.status === "active"
                        ? "success"
                        : wt.status === "failed"
                        ? "danger"
                        : "default"
                    }
                    size="sm"
                    className="w-full"
                  >
                    {wt.status}
                  </Chip>
                </CardBody>
              </Card>
            ))}
            {Array.from({ length: maxConcurrency - worktrees.length }).map((_, i) => (
              <Card key={`idle-${i}`} className="border-2 border-dashed border-default-300">
                <CardBody className="flex items-center justify-center h-32">
                  <span className="text-default-400">idle</span>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Section 2: Agent稼働状況 */}
      <Card className="animate-in slide-in-from-left duration-700" style={{ animationDelay: '100ms' }}>
        <CardHeader className="flex flex-col items-start gap-2">
          <h2 className="text-xl font-semibold">🤖 Agent稼働状況</h2>
          <span className="text-lg">
            {workingAgents}個稼働中 / 全{totalAgents}個
          </span>
        </CardHeader>
        <CardBody>
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
                  className="flex items-center justify-between p-4 bg-default-100 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-xl font-bold min-w-[120px]">
                      {agent.displayName}
                    </span>
                    <Chip color={getAgentStatusColor(agent)} variant="flat" size="sm">
                      {getAgentStatusLabel(agent)}
                    </Chip>
                    <span className="text-sm text-default-600">
                      {agent.currentTask || "待機中"}
                    </span>
                  </div>
                  <div className="text-right text-sm text-default-500">
                    <div>
                      最終更新: {minutesSinceUpdate > 0 ? `${minutesSinceUpdate}分` : `${secondsSinceUpdate}秒`}前
                    </div>
                    {agent.status === "working" && (
                      <div>実行時間: {agent.elapsedMinutes}分</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Section 3: タスク依存関係 & 優先度遵守状況 */}
      <Card className="animate-in slide-in-from-left duration-700" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <h2 className="text-xl font-semibold">📊 タスク依存関係 & 優先度遵守状況</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="p-4 bg-warning-50 rounded-lg border-2 border-warning">
            <div className="text-lg font-bold mb-2">
              🎯 Critical Path: {dependencyStatus.criticalPath.join(" → ")}
            </div>
            <div className="text-sm text-default-600">
              推定: 30分（最も時間がかかる経路）
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-success-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold">依存関係遵守</span>
              </div>
              <div className="text-3xl font-bold">
                {dependencyStatus.dependenciesRespected}/{dependencyStatus.totalTasks}
              </div>
              <div className="text-sm text-default-600">タスク</div>
            </div>

            <div className="p-4 bg-success-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✅</span>
                <span className="font-semibold">優先度遵守</span>
              </div>
              <div className="text-lg">
                P0 → P1 → P2順に実行中
              </div>
            </div>
          </div>

          {dependencyStatus.violations.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-danger">⚠️ 警告</h3>
              {dependencyStatus.violations.map((violation, i) => (
                <div key={i} className="p-3 bg-danger-50 rounded-lg border border-danger">
                  <div className="text-sm font-mono">{violation.taskId}</div>
                  <div className="text-sm">{violation.message}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Section 4: タスク分解の適切性 */}
      <Card className="animate-in slide-in-from-left duration-700" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <h2 className="text-xl font-semibold">📦 タスク分解の適切性</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* タスクサイズ分布 */}
          <div>
            <h3 className="font-semibold mb-3">タスクサイズ分布</h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">小 (5分以下)</span>
                  <span className="text-sm font-bold">{taskDecomposition.sizeDistribution.small}個</span>
                </div>
                <Progress
                  value={(taskDecomposition.sizeDistribution.small / 16) * 100}
                  color="success"
                  role="progressbar"
                  aria-label="Small tasks (under 5 minutes)"
                  aria-valuenow={(taskDecomposition.sizeDistribution.small / 16) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">中 (5-15分)</span>
                  <span className="text-sm font-bold">{taskDecomposition.sizeDistribution.medium}個</span>
                </div>
                <Progress
                  value={(taskDecomposition.sizeDistribution.medium / 16) * 100}
                  color="primary"
                  role="progressbar"
                  aria-label="Medium tasks (5-15 minutes)"
                  aria-valuenow={(taskDecomposition.sizeDistribution.medium / 16) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">大 (15分以上)</span>
                  <span className="text-sm font-bold text-warning">
                    {taskDecomposition.sizeDistribution.large}個 ⚠️ 要分解検討
                  </span>
                </div>
                <Progress
                  value={(taskDecomposition.sizeDistribution.large / 16) * 100}
                  color="warning"
                  role="progressbar"
                  aria-label="Large tasks (over 15 minutes)"
                  aria-valuenow={(taskDecomposition.sizeDistribution.large / 16) * 100}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          </div>

          {/* Agent負荷分散 */}
          <div>
            <h3 className="font-semibold mb-3">Agent負荷分散</h3>
            <div className="space-y-2">
              {taskDecomposition.agentLoad.map((agent) => (
                <div key={agent.agentName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">{agent.agentName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{agent.taskCount}タスク</span>
                      <Chip size="sm" color={getLoadStatusColor(agent.status)} variant="flat">
                        {agent.status === "overloaded"
                          ? "過負荷"
                          : agent.status === "available"
                          ? "余裕"
                          : "適正"}
                      </Chip>
                    </div>
                  </div>
                  <Progress
                    value={(agent.taskCount / 12) * 100}
                    color={getLoadStatusColor(agent.status)}
                    role="progressbar"
                    aria-label={`${agent.agentName} task load`}
                    aria-valuenow={(agent.taskCount / 12) * 100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Section 5: ベクトル空間的タスク宇宙 */}
      <Card className="animate-in scale-in duration-700" style={{ animationDelay: '400ms' }}>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🌌 Vector Space Universe - タスクの意味的配置
            </h2>
            <p className="text-sm text-default-500">
              LLMのベクトル空間メタファー - タスク間の意味的類似度と依存関係を3D空間で可視化
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <VectorSpaceUniverse />
        </CardBody>
      </Card>

      {/* 詳細を見るボタン */}
      <div className="flex justify-center">
        <button
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg hover:scale-105 hover:shadow-xl transition-all duration-300 font-semibold"
          onClick={() => window.open('/dashboard', '_blank')}
        >
          📊 詳細ダッシュボードを開く（別タブ）
        </button>
      </div>
    </div>
  );
}
