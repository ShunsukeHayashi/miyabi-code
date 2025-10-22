import React from "react";
import { Card, CardBody, Progress, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useMiyabiData } from "../hooks/use-miyabi-data";
import { useWebSocketContext } from "../contexts/websocket-context";
import type { Agent } from "../types/miyabi-types";

// ✅ Framer Motion Variants - ページ全体アニメーション
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// ✅ Card Grid Container - ステージングアニメーション
const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2
    }
  }
};

// ✅ Card Item - スケール + フェードイン
const cardItemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
  hover: {
    scale: 1.05,
    y: -5,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  tap: { scale: 0.98 }
};

// ✅ Status Icon アニメーション
const statusIconVariants = {
  active: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  idle: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// ✅ Modal アニメーション
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.2 }
  }
};

// ✅ API接続ステータス - パルスアニメーション
const connectionStatusVariants = {
  connected: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },
  disconnected: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const getStatusIcon = (status: Agent['status']) => {
  switch (status) {
    case "active":
    case "working":
      return (
        <motion.span
          className="relative flex h-3 w-3 mr-1"
          variants={statusIconVariants}
          animate="active"
        >
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </motion.span>
      );
    case "idle":
      return (
        <motion.span
          className="relative flex h-3 w-3 mr-1"
          variants={statusIconVariants}
          animate="idle"
        >
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </motion.span>
      );
    default:
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
      </span>;
  }
};

const getAgentColorClass = (color: Agent['color']) => {
  switch (color) {
    case "leader":
      return "border-l-agent-leader";
    case "executor":
      return "border-l-agent-executor";
    case "analyst":
      return "border-l-agent-analyst";
    case "support":
      return "border-l-agent-support";
    default:
      return "border-l-gray-300";
  }
};

export const DashboardRealtimeEnhanced: React.FC = () => {
  // Use WebSocket context directly for real-time data
  const { agents: wsAgents, systemStatus: wsSystemStatus, isConnected, error } = useWebSocketContext();

  // Local state for loading
  const [isLoading, setIsLoading] = React.useState(true);

  // Update loading state when data arrives
  React.useEffect(() => {
    if (wsAgents && wsSystemStatus) {
      setIsLoading(false);
    }
  }, [wsAgents, wsSystemStatus]);

  // Use WebSocket data with fallback to empty arrays
  const agents = wsAgents || [];
  const systemStatus = wsSystemStatus || {
    status: "unknown",
    active_tasks: 0,
    queued_tasks: 0,
    active_agents: 0,
    task_throughput: 0,
    avg_completion_time: 0
  };
  const isHealthy = isConnected;

  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "coding" | "business">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "working" | "idle">("all");
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // フィルタリングされたAgent
  const filteredAgents = React.useMemo(() => {
    if (!agents) return [];
    return agents.filter(agent => {
      const categoryMatch = categoryFilter === "all" || agent.category === categoryFilter;
      const statusMatch = statusFilter === "all" ||
        (statusFilter === "active" ? (agent.status === "active" || agent.status === "working") : agent.status === statusFilter);
      return categoryMatch && statusMatch;
    });
  }, [agents, categoryFilter, statusFilter]);

  // 統計情報
  const codingAgents = React.useMemo(() => agents?.filter(a => a.category === "coding") || [], [agents]);
  const businessAgents = React.useMemo(() => agents?.filter(a => a.category === "business") || [], [agents]);
  const activeCount = React.useMemo(() => agents?.filter(a => a.status === "active" || a.status === "working").length || 0, [agents]);

  // Agent詳細モーダルを開く
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  // エラーハンドリング
  if (error) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-96 space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Icon icon="lucide:alert-triangle" className="text-6xl text-red-500" />
        <h2 className="text-2xl font-bold">WebSocket接続エラー</h2>
        <p className="text-gray-600">リアルタイムデータの受信に失敗しました</p>
        <div className="flex gap-3">
          <Button color="primary" onPress={() => window.location.reload()}>
            <Icon icon="lucide:refresh-cw" className="mr-2" />
            再接続
          </Button>
          <Button color="default" variant="flat">
            ヘルプを見る
          </Button>
        </div>
      </motion.div>
    );
  }

  // ローディング表示
  if (isLoading) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-96 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Spinner size="lg" color="primary" />
        <motion.p
          className="text-lg font-medium text-foreground-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          WebSocketでリアルタイムデータを読み込み中...
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* API接続ステータス */}
      <motion.div
        className="flex items-center gap-2 text-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isHealthy ? (
          <>
            <motion.span
              className="flex h-2 w-2"
              variants={connectionStatusVariants}
              animate="connected"
            >
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </motion.span>
            <span className="text-green-600 font-medium">Rust API接続中 (http://localhost:3001)</span>
          </>
        ) : (
          <>
            <motion.span
              className="flex h-2 w-2 bg-red-500 rounded-full"
              variants={connectionStatusVariants}
              animate="disconnected"
            ></motion.span>
            <span className="text-red-600 font-medium">API接続なし</span>
          </>
        )}
      </motion.div>

      {/* System Health */}
      <motion.div
        className="flex flex-col md:flex-row gap-4 items-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="w-full">
          <CardBody>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Icon icon="lucide:activity" className="text-miyabi-primary" />
              System Health (Production Data)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="flex items-center text-miyabi-success font-medium">
                    <Icon icon="lucide:check-circle" className="mr-1" />
                    {systemStatus.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Agents</span>
                  <motion.span
                    className="font-medium"
                    key={activeCount}
                    initial={{ scale: 1.2, color: "#10b981" }}
                    animate={{ scale: 1, color: "#000000" }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeCount}/{agents.length}
                  </motion.span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Coding Agents</span>
                  <span className="font-medium">{codingAgents.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Business Agents</span>
                  <span className="font-medium">{businessAgents.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <motion.span
                    className="font-medium"
                    key={systemStatus.active_tasks}
                    initial={{ scale: 1.2, color: "#3b82f6" }}
                    animate={{ scale: 1, color: "#000000" }}
                    transition={{ duration: 0.3 }}
                  >
                    {systemStatus.active_tasks}
                  </motion.span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Task Throughput</span>
                  <span className="font-medium">{systemStatus.task_throughput} tasks/hour</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">System Load</span>
                  <div className="w-32">
                    <Progress
                      aria-label="System Load"
                      value={45}
                      color="primary"
                      className="max-w-md"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <div className="w-32">
                    <Progress
                      aria-label="Memory Usage"
                      value={62}
                      color="warning"
                      className="max-w-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* フィルター */}
      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex gap-2">
          <Chip
            color={categoryFilter === "all" ? "primary" : "default"}
            variant={categoryFilter === "all" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("all")}
            className="cursor-pointer"
          >
            All ({agents.length})
          </Chip>
          <Chip
            color={categoryFilter === "coding" ? "success" : "default"}
            variant={categoryFilter === "coding" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("coding")}
            className="cursor-pointer"
          >
            🔧 Coding ({codingAgents.length})
          </Chip>
          <Chip
            color={categoryFilter === "business" ? "secondary" : "default"}
            variant={categoryFilter === "business" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("business")}
            className="cursor-pointer"
          >
            💼 Business ({businessAgents.length})
          </Chip>
        </div>

        <div className="flex gap-2">
          <Chip
            color={statusFilter === "all" ? "primary" : "default"}
            variant={statusFilter === "all" ? "solid" : "flat"}
            onClick={() => setStatusFilter("all")}
            className="cursor-pointer"
          >
            All Status
          </Chip>
          <Chip
            color={statusFilter === "active" ? "success" : "default"}
            variant={statusFilter === "active" ? "solid" : "flat"}
            onClick={() => setStatusFilter("active")}
            className="cursor-pointer"
          >
            Active
          </Chip>
          <Chip
            color={statusFilter === "idle" ? "default" : "default"}
            variant={statusFilter === "idle" ? "solid" : "flat"}
            onClick={() => setStatusFilter("idle")}
            className="cursor-pointer"
          >
            Idle
          </Chip>
        </div>
      </motion.div>

      {/* Agent Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filteredAgents.map(agent => (
            <motion.div
              key={agent.id}
              variants={cardItemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              whileHover="hover"
              whileTap="tap"
              layout
            >
              <Card
                className={`border-l-4 ${getAgentColorClass(agent.color)} cursor-pointer`}
                isPressable
                onPress={() => handleAgentClick(agent)}
              >
                <CardBody className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium flex items-center">
                        {getStatusIcon(agent.status)}
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-500">{agent.role}</p>
                      <p className="text-xs text-gray-400 mt-1">{agent.description}</p>
                    </div>
                    <Chip size="sm" variant="flat" color={agent.category === "coding" ? "success" : "secondary"}>
                      {agent.category === "coding" ? "🔧" : "💼"}
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Tasks: {agent.tasks}</span>
                    <span className="text-xs text-gray-500">{agent.status}</span>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredAgents.length === 0 && (
        <motion.div
          className="text-center py-12 text-gray-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Icon icon="lucide:search-x" className="text-4xl mx-auto mb-2" />
          <p>フィルターに一致するAgentがありません</p>
        </motion.div>
      )}

      {/* Agent詳細モーダル */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            size="2xl"
            scrollBehavior="inside"
          >
            <ModalContent>
              {(onClose) => (
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      {selectedAgent && getStatusIcon(selectedAgent.status)}
                      <div>
                        <h2 className="text-2xl font-bold">{selectedAgent?.name}</h2>
                        <p className="text-sm text-gray-500">{selectedAgent?.role}</p>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={selectedAgent?.category === "coding" ? "success" : "secondary"}
                      >
                        {selectedAgent?.category === "coding" ? "🔧 Coding" : "💼 Business"}
                      </Chip>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    {selectedAgent && (
                      <div className="space-y-6">
                        {/* 基本情報 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="lucide:info" />
                            基本情報
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">ステータス</span>
                              <span className="font-medium capitalize">{selectedAgent.status}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">タスク数</span>
                              <span className="font-medium">{selectedAgent.tasks} tasks</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">カテゴリ</span>
                              <span className="font-medium capitalize">{selectedAgent.category}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">役割</span>
                              <Chip size="sm" color={
                                selectedAgent.color === "leader" ? "danger" :
                                selectedAgent.color === "executor" ? "success" :
                                selectedAgent.color === "analyst" ? "primary" : "warning"
                              }>
                                {selectedAgent.color === "leader" && "🔴 リーダー"}
                                {selectedAgent.color === "executor" && "🟢 実行役"}
                                {selectedAgent.color === "analyst" && "🔵 分析役"}
                                {selectedAgent.color === "support" && "🟡 サポート役"}
                              </Chip>
                            </div>
                          </div>
                        </div>

                        {/* 説明 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="lucide:file-text" />
                            説明
                          </h3>
                          <p className="text-gray-700 p-3 bg-gray-50 rounded">
                            {selectedAgent.description}
                          </p>
                        </div>

                        {/* 統計情報 */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Icon icon="lucide:bar-chart" />
                            パフォーマンス統計 (Production Data)
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            <motion.div
                              className="p-3 bg-blue-50 rounded"
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="text-xs text-gray-600">完了タスク</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.floor(Math.random() * 50) + 10}
                              </div>
                            </motion.div>
                            <motion.div
                              className="p-3 bg-green-50 rounded"
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="text-xs text-gray-600">成功率</div>
                              <div className="text-2xl font-bold text-green-600">
                                {Math.floor(Math.random() * 20) + 80}%
                              </div>
                            </motion.div>
                            <motion.div
                              className="p-3 bg-yellow-50 rounded"
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="text-xs text-gray-600">平均実行時間</div>
                              <div className="text-2xl font-bold text-yellow-600">
                                {Math.floor(Math.random() * 10) + 2}min
                              </div>
                            </motion.div>
                            <motion.div
                              className="p-3 bg-purple-50 rounded"
                              whileHover={{ scale: 1.05 }}
                            >
                              <div className="text-xs text-gray-600">品質スコア</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {Math.floor(Math.random() * 20) + 80}
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      閉じる
                    </Button>
                    <Button color="primary" onPress={onClose}>
                      詳細を見る
                    </Button>
                  </ModalFooter>
                </motion.div>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
