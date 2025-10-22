import React, { useState, useEffect } from "react";

// Agent型定義
interface Agent {
  id: string;
  name: string; // キャラクター名（例: しきるん、つくるん）
  technicalName: string; // 技術名（例: CoordinatorAgent）
  role: "leader" | "executor" | "analyzer" | "supporter"; // 役割
  status: "working" | "idle" | "failed" | "stopped" | "starting";
  currentTask: string | null; // 現在処理中のTask ID
  queueLength: number; // キューの長さ
  cpuUsage: number; // CPU使用率（%）
  successRate: number; // 成功率（%）
  tasksPerHour: number; // 処理速度（Tasks/Hour）
}

// ステータス別の色
const STATUS_COLORS = {
  working: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    border: "border-green-500/50",
    icon: "🟢",
  },
  idle: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/50",
    icon: "🟡",
  },
  failed: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/50",
    icon: "🔴",
  },
  stopped: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/50",
    icon: "⚪",
  },
  starting: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
    border: "border-blue-500/50",
    icon: "🔵",
  },
};

// 役割別の色
const ROLE_COLORS = {
  leader: "bg-red-500/10 text-red-300",
  executor: "bg-green-500/10 text-green-300",
  analyzer: "bg-blue-500/10 text-blue-300",
  supporter: "bg-yellow-500/10 text-yellow-300",
};

// 役割別のアイコン
const ROLE_ICONS = {
  leader: "👔",
  executor: "✍️",
  analyzer: "🔍",
  supporter: "🤝",
};

// モックデータ
const MOCK_AGENTS: Agent[] = [
  {
    id: "coordinator",
    name: "Coordinator",
    technicalName: "CoordinatorAgent",
    role: "leader",
    status: "working",
    currentTask: "#270",
    queueLength: 3,
    cpuUsage: 42,
    successRate: 96.5,
    tasksPerHour: 5.2,
  },
  {
    id: "codegen",
    name: "CodeGen",
    technicalName: "CodeGenAgent",
    role: "executor",
    status: "working",
    currentTask: "#271",
    queueLength: 5,
    cpuUsage: 78,
    successRate: 94.3,
    tasksPerHour: 4.2,
  },
  {
    id: "review",
    name: "Review",
    technicalName: "ReviewAgent",
    role: "analyzer",
    status: "idle",
    currentTask: null,
    queueLength: 0,
    cpuUsage: 5,
    successRate: 98.7,
    tasksPerHour: 6.8,
  },
  {
    id: "deployment",
    name: "Deploy",
    technicalName: "DeploymentAgent",
    role: "executor",
    status: "failed",
    currentTask: "#268",
    queueLength: 1,
    cpuUsage: 0,
    successRate: 87.2,
    tasksPerHour: 3.1,
  },
  {
    id: "pr",
    name: "PullRequest",
    technicalName: "PRAgent",
    role: "supporter",
    status: "working",
    currentTask: "#272",
    queueLength: 2,
    cpuUsage: 35,
    successRate: 99.1,
    tasksPerHour: 7.5,
  },
  {
    id: "issue",
    name: "IssueAnalyzer",
    technicalName: "IssueAgent",
    role: "analyzer",
    status: "idle",
    currentTask: null,
    queueLength: 0,
    cpuUsage: 8,
    successRate: 97.3,
    tasksPerHour: 12.4,
  },
  {
    id: "ai-entrepreneur",
    name: "Business",
    technicalName: "AIEntrepreneurAgent",
    role: "leader",
    status: "starting",
    currentTask: null,
    queueLength: 1,
    cpuUsage: 15,
    successRate: 92.0,
    tasksPerHour: 2.3,
  },
];

export function AgentStatusOverview() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"name" | "status" | "cpu" | "queue">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // トレンドグラフ用のhistory（過去10秒間の統計）
  const [statsHistory, setStatsHistory] = useState<Array<{
    timestamp: number;
    total: number;
    working: number;
    idle: number;
    failed: number;
  }>>([]);

  // リアルタイム更新シミュレーション（1秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) => {
        const updated = prev.map((agent) => ({
          ...agent,
          cpuUsage: Math.max(
            0,
            Math.min(100, agent.cpuUsage + (Math.random() - 0.5) * 10)
          ),
          queueLength: Math.max(
            0,
            agent.queueLength + Math.floor((Math.random() - 0.5) * 2)
          ),
        }));

        // 統計ヒストリーを更新（トレンドグラフ用）
        const newStats = {
          timestamp: Date.now(),
          total: updated.length,
          working: updated.filter((a) => a.status === "working").length,
          idle: updated.filter((a) => a.status === "idle").length,
          failed: updated.filter((a) => a.status === "failed").length,
        };

        setStatsHistory((prevHistory) => {
          const newHistory = [...prevHistory, newStats];
          // 過去10個まで保持（10秒間）
          return newHistory.slice(-10);
        });

        return updated;
      });
      setLastUpdateTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 現在時刻を更新（100ms間隔で更新カウンターをスムーズに）
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // フィルタリング（検索機能追加）
  const filteredAgents = agents.filter((agent) => {
    if (filterStatus !== "all" && agent.status !== filterStatus) return false;
    if (filterRole !== "all" && agent.role !== filterRole) return false;
    if (
      searchQuery &&
      !agent.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !agent.technicalName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  // ソート機能（新機能！）
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "status":
        const statusOrder = { working: 0, idle: 1, failed: 2, stopped: 3, starting: 4 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case "cpu":
        comparison = a.cpuUsage - b.cpuUsage;
        break;
      case "queue":
        comparison = a.queueLength - b.queueLength;
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // 統計情報
  const stats = {
    total: agents.length,
    working: agents.filter((a) => a.status === "working").length,
    idle: agents.filter((a) => a.status === "idle").length,
    failed: agents.filter((a) => a.status === "failed").length,
  };

  // トレンドグラフ生成ヘルパー（SVGパス）
  const generateTrendPath = (data: number[], width: number, height: number): string => {
    if (data.length < 2) return "";

    const max = Math.max(...data, 1);
    const step = width / (data.length - 1);

    return data
      .map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * height;
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  };

  return (
    <div className="w-full h-full p-6 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="mb-6 animate-in slide-in-from-top duration-700">
        <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          🤖 Agent Status Overview
        </h2>
        <p className="text-gray-400">全Agentの状態をリアルタイム監視</p>
      </div>

      {/* 統計カード（アニメーション強化・ホバーエフェクト追加） */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-white/20">
          <div className="text-gray-400 text-sm">Total Agents</div>
          <div className="text-2xl font-bold text-white transition-all duration-500">
            {stats.total}
          </div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30 hover:bg-green-500/20 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-green-400 text-sm">🟢 Working</div>
          </div>
          <div className="text-2xl font-bold text-green-300 transition-all duration-500 mb-2">
            {stats.working}
          </div>
          {/* ミニトレンドグラフ（新機能！） */}
          {statsHistory.length >= 2 && (
            <svg width="100%" height="24" className="opacity-60">
              <path
                d={generateTrendPath(
                  statsHistory.map((s) => s.working),
                  100,
                  24
                )}
                fill="none"
                stroke="rgb(134 239 172)"
                strokeWidth="2"
                className="drop-shadow-lg"
              />
            </svg>
          )}
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30 hover:bg-yellow-500/20 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-yellow-500/30">
          <div className="text-yellow-400 text-sm">🟡 Idle</div>
          <div className="text-2xl font-bold text-yellow-300 transition-all duration-500">
            {stats.idle}
          </div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 hover:bg-red-500/20 hover:scale-105 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-red-500/30">
          <div className="text-red-400 text-sm">🔴 Failed</div>
          <div className="text-2xl font-bold text-red-300 transition-all duration-500">
            {stats.failed}
          </div>
        </div>
      </div>

      {/* フィルタ結果表示（新機能！） */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg px-4 py-2">
            <span className="text-blue-300 text-sm font-bold">
              📊 表示中: {sortedAgents.length} / {agents.length} Agents
            </span>
          </div>
          {searchQuery && (
            <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-2">
              <span className="text-purple-300 text-sm">
                🔍 検索結果: "{searchQuery}"
              </span>
            </div>
          )}
        </div>

        {/* ソートコントロール（新機能！） */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">並び替え:</span>
          <select
            className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/15 transition-all cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name">Agent名</option>
            <option value="status">ステータス</option>
            <option value="cpu">CPU使用率</option>
            <option value="queue">キュー長</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1 text-white text-sm transition-all"
          >
            {sortOrder === "asc" ? "↑ 昇順" : "↓ 降順"}
          </button>
        </div>
      </div>

      {/* フィルタ + 検索機能 */}
      <div className="flex gap-4 mb-6">
        {/* 検索入力（新機能！） */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Search Agent name..."
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition-all placeholder-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <select
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/15 transition-all"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="working">🟢 Working</option>
          <option value="idle">🟡 Idle</option>
          <option value="failed">🔴 Failed</option>
          <option value="stopped">⚪ Stopped</option>
          <option value="starting">🔵 Starting</option>
        </select>

        <select
          className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white/15 transition-all"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="leader">👔 Leader</option>
          <option value="executor">✍️ Executor</option>
          <option value="analyzer">🔍 Analyzer</option>
          <option value="supporter">🤝 Supporter</option>
        </select>
      </div>

      {/* Agent一覧テーブル */}
      <div className="overflow-x-auto">
        {sortedAgents.length === 0 ? (
          /* Emptyステート（新機能！） */
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-lg border border-white/10">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <div className="text-white text-xl font-bold mb-2">
              Agentが見つかりません
            </div>
            <div className="text-gray-400 text-sm mb-1">
              フィルタ条件や検索キーワードを変更してみてください
            </div>
            <div className="text-gray-500 text-xs mb-6">
              現在のフィルタ: ステータス={filterStatus}, 役割={filterRole}
              {searchQuery && `, 検索="${searchQuery}"`}
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterRole("all");
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 font-bold"
            >
              🔄 フィルタをリセット
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {/* Agent名ヘッダー（ソート可能） */}
              <th
                className="px-4 py-3 text-gray-400 text-sm font-semibold cursor-pointer hover:text-white hover:bg-white/10 transition-all select-none"
                onClick={() => {
                  if (sortBy === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("name");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>Agent</span>
                  {sortBy === "name" && (
                    <span className="text-blue-400 text-lg animate-pulse">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Role */}
              <th className="px-4 py-3 text-gray-400 text-sm font-semibold">
                Role
              </th>

              {/* Statusヘッダー（ソート可能） */}
              <th
                className="px-4 py-3 text-gray-400 text-sm font-semibold cursor-pointer hover:text-white hover:bg-white/10 transition-all select-none"
                onClick={() => {
                  if (sortBy === "status") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("status");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {sortBy === "status" && (
                    <span className="text-blue-400 text-lg animate-pulse">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Current Task */}
              <th className="px-4 py-3 text-gray-400 text-sm font-semibold">
                Current Task
              </th>

              {/* Queueヘッダー（ソート可能） */}
              <th
                className="px-4 py-3 text-gray-400 text-sm font-semibold cursor-pointer hover:text-white hover:bg-white/10 transition-all select-none"
                onClick={() => {
                  if (sortBy === "queue") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("queue");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>Queue</span>
                  {sortBy === "queue" && (
                    <span className="text-blue-400 text-lg animate-pulse">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* CPUヘッダー（ソート可能） */}
              <th
                className="px-4 py-3 text-gray-400 text-sm font-semibold cursor-pointer hover:text-white hover:bg-white/10 transition-all select-none"
                onClick={() => {
                  if (sortBy === "cpu") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("cpu");
                    setSortOrder("asc");
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span>CPU</span>
                  {sortBy === "cpu" && (
                    <span className="text-blue-400 text-lg animate-pulse">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>

              {/* Success Rate */}
              <th className="px-4 py-3 text-gray-400 text-sm font-semibold">
                Success Rate
              </th>

              {/* Speed */}
              <th className="px-4 py-3 text-gray-400 text-sm font-semibold">
                Speed
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAgents.map((agent) => {
              const statusStyle = STATUS_COLORS[agent.status];
              return (
                <tr
                  key={agent.id}
                  className="border-b border-white/5 hover:bg-gradient-to-r hover:from-white/10 hover:to-transparent hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                >
                  {/* Agent名 */}
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-white font-semibold">
                        {agent.name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {agent.technicalName}
                      </div>
                    </div>
                  </td>

                  {/* 役割 */}
                  <td className="px-4 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ROLE_COLORS[agent.role]
                      }`}
                    >
                      {ROLE_ICONS[agent.role]} {agent.role}
                    </span>
                  </td>

                  {/* ステータス */}
                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.icon} {agent.status}
                    </span>
                  </td>

                  {/* 現在Task */}
                  <td className="px-4 py-4">
                    {agent.currentTask ? (
                      <span className="text-blue-400 font-mono">
                        {agent.currentTask}
                      </span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>

                  {/* キュー */}
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono ${
                        agent.queueLength > 5
                          ? "text-red-400"
                          : agent.queueLength > 0
                          ? "text-yellow-400"
                          : "text-gray-600"
                      }`}
                    >
                      {agent.queueLength}
                    </span>
                  </td>

                  {/* CPU使用率（グラデーション強化 + アクセシビリティ対応） */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-24 h-3 bg-white/10 rounded-full overflow-hidden shadow-inner group-hover:shadow-lg transition-all"
                        role="progressbar"
                        aria-label={`${agent.name} CPU usage`}
                        aria-valuenow={agent.cpuUsage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={`h-full transition-all duration-500 ease-out ${
                            agent.cpuUsage > 80
                              ? "bg-gradient-to-r from-red-600 to-red-400 shadow-lg shadow-red-500/50"
                              : agent.cpuUsage > 50
                              ? "bg-gradient-to-r from-yellow-600 to-yellow-400 shadow-lg shadow-yellow-500/50"
                              : "bg-gradient-to-r from-green-600 to-green-400 shadow-lg shadow-green-500/50"
                          } animate-pulse`}
                          style={{ width: `${agent.cpuUsage}%` }}
                        />
                      </div>
                      <span className="text-white text-sm font-mono font-bold group-hover:text-blue-400 transition-colors">
                        {agent.cpuUsage.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* 成功率 */}
                  <td className="px-4 py-4">
                    <span className="text-green-400 font-mono">
                      {agent.successRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* 処理速度 */}
                  <td className="px-4 py-4">
                    <span className="text-blue-400 font-mono">
                      {agent.tasksPerHour.toFixed(1)} t/h
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      {/* 超強化ローディングインジケーター（グラデーション・カウンター・アニメーション） */}
      <div className="mt-6 relative">
        {/* グラデーション回転背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse"></div>

        {/* メインコンテンツ */}
        <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/20 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between gap-6">
            {/* 左側：リアルタイム更新インジケーター */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-green-500/50">
                  <span className="text-2xl">⚡</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>

              <div>
                <div className="text-white font-bold text-lg">リアルタイム更新中</div>
                <div className="text-gray-400 text-xs">Live monitoring active</div>
              </div>
            </div>

            {/* 中央：更新カウンター */}
            <div className="flex items-center gap-4">
              <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="text-gray-400 text-xs">Last Update</div>
                <div className="text-green-400 font-mono text-sm font-bold">
                  {lastUpdateTime > 0 ? `${((currentTime - lastUpdateTime) / 1000).toFixed(1)}s ago` : "Initializing..."}
                </div>
              </div>

              <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="text-gray-400 text-xs">Update Interval</div>
                <div className="text-blue-400 font-mono text-sm font-bold">1.0s</div>
              </div>

              <div className="bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                <div className="text-gray-400 text-xs">Active Agents</div>
                <div className="text-purple-400 font-mono text-sm font-bold">{agents.length}</div>
              </div>
            </div>

            {/* 右側：回転インジケーター */}
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" style={{ animationDuration: "3s" }}></div>
                <div className="absolute inset-1 bg-black rounded-full flex items-center justify-center">
                  <span className="text-xl">🔄</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                <div>Monitoring</div>
                <div className="text-green-400 font-bold">Active</div>
              </div>
            </div>
          </div>

          {/* プログレスバー（インフィニティ風） */}
          <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" style={{ width: "100%", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
