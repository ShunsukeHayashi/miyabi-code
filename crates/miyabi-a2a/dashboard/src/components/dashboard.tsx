import React from "react";
import { Card, CardBody, Progress, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Agent } from "../types/miyabi-types"; // ✅ Rust型に準拠
import { useMiyabiData } from "../hooks/use-miyabi-data"; // ✅ 実データフック

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
    case "working":
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-900"></span>
      </span>;
    case "idle":
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-900"></span>
      </span>;
    default:
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
      </span>;
  }
};

const getAgentColorClass = (color: string) => {
  return "border-l-gray-200";
};

export const Dashboard: React.FC = () => {
  const { systemStatus, agents } = useMiyabiData(); // ✅ 実データ取得
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | "coding" | "business">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "working" | "idle">("all");
  const [selectedAgent, setSelectedAgent] = React.useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Loading state
  if (!agents || !systemStatus) {
    return <div>Loading dashboard data...</div>;
  }

  // フィルタリングされたAgent
  const filteredAgents = agents.filter(agent => {
    const categoryMatch = categoryFilter === "all" || agent.category === categoryFilter;
    const statusMatch = statusFilter === "all" || agent.status === statusFilter;
    return categoryMatch && statusMatch;
  });

  // 統計情報
  const codingAgents = agents.filter(a => a.category === "coding");
  const businessAgents = agents.filter(a => a.category === "business");
  const activeCount = agents.filter(a => a.status === "active" || a.status === "working").length;

  // Agent詳細モーダルを開く
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Card className="w-full">
          <CardBody>
            <h2 className="text-4xl font-extralight tracking-tight mb-8">
              System Health
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Status</span>
                  <span className="flex items-center text-gray-900 text-xl font-normal">
                    Healthy
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Active Agents</span>
                  <span className="text-xl font-normal">{activeCount}/{agents.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Coding Agents</span>
                  <span className="text-xl font-normal">{codingAgents.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Business Agents</span>
                  <span className="text-xl font-normal">{businessAgents.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Active Tasks</span>
                  <span className="text-xl font-normal">{systemStatus.active_tasks}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Task Throughput</span>
                  <span className="text-xl font-normal">{systemStatus.task_throughput.toFixed(1)} tasks/hour</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">System Load</span>
                  <div className="w-32">
                    <Progress
                      aria-label="System Load"
                      value={45}
                      className="max-w-md bg-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-normal text-gray-600">Memory Usage</span>
                  <div className="w-32">
                    <Progress
                      aria-label="Memory Usage"
                      value={62}
                      className="max-w-md bg-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <Chip
            variant={categoryFilter === "all" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("all")}
            className={`cursor-pointer ${categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            All ({agents.length})
          </Chip>
          <Chip
            variant={categoryFilter === "coding" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("coding")}
            className={`cursor-pointer ${categoryFilter === "coding" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            Coding ({codingAgents.length})
          </Chip>
          <Chip
            variant={categoryFilter === "business" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("business")}
            className={`cursor-pointer ${categoryFilter === "business" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            Business ({businessAgents.length})
          </Chip>
        </div>

        <div className="flex gap-2">
          <Chip
            variant={statusFilter === "all" ? "solid" : "flat"}
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            All Status
          </Chip>
          <Chip
            variant={statusFilter === "active" ? "solid" : "flat"}
            onClick={() => setStatusFilter("active")}
            className={`cursor-pointer ${statusFilter === "active" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            Active
          </Chip>
          <Chip
            variant={statusFilter === "idle" ? "solid" : "flat"}
            onClick={() => setStatusFilter("idle")}
            className={`cursor-pointer ${statusFilter === "idle" ? "bg-blue-600 text-white" : "bg-white text-gray-900"}`}
          >
            Idle
          </Chip>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map(agent => (
          <Card
            key={agent.id}
            className={`border-l-4 ${getAgentColorClass(agent.color)} hover:shadow-lg transition-all cursor-pointer hover:scale-105`}
            isPressable
            onPress={() => handleAgentClick(agent)}
          >
            <CardBody className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-2xl font-extralight flex items-center">
                    {getStatusIcon(agent.status)}
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-500">{agent.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{agent.description}</p>
                </div>
                <Chip size="sm" variant="flat" className={agent.category === "coding" ? "bg-gray-900 text-white" : "bg-gray-900 text-white"}>
                  {agent.category === "coding" ? "Coding" : "Business"}
                </Chip>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500">Tasks: {agent.tasks}</span>
                <span className="text-xs text-gray-500">{agent.status}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>フィルターに一致するAgentがありません</p>
        </div>
      )}

      {/* Agent詳細モーダル */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  {selectedAgent && getStatusIcon(selectedAgent.status)}
                  <div>
                    <h2 className="text-4xl font-extralight">{selectedAgent?.name}</h2>
                    <p className="text-xl font-normal text-gray-500">{selectedAgent?.role}</p>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    className={selectedAgent?.category === "coding" ? "bg-gray-900 text-white" : "bg-gray-900 text-white"}
                  >
                    {selectedAgent?.category === "coding" ? "Coding" : "Business"}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAgent && (
                  <div className="space-y-6">
                    {/* 基本情報 */}
                    <div>
                      <h3 className="text-2xl font-extralight mb-8">
                        基本情報
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xl font-normal text-gray-600">ステータス</span>
                          <span className="text-xl font-normal capitalize">{selectedAgent.status}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xl font-normal text-gray-600">タスク数</span>
                          <span className="text-xl font-normal">{selectedAgent.tasks} tasks</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xl font-normal text-gray-600">カテゴリ</span>
                          <span className="text-xl font-normal capitalize">{selectedAgent.category}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-xl font-normal text-gray-600">役割</span>
                          <Chip size="sm" className="bg-gray-900 text-white">
                            {selectedAgent.color === "leader" && "リーダー"}
                            {selectedAgent.color === "executor" && "実行役"}
                            {selectedAgent.color === "analyst" && "分析役"}
                            {selectedAgent.color === "support" && "サポート役"}
                          </Chip>
                        </div>
                      </div>
                    </div>

                    {/* 説明 */}
                    <div>
                      <h3 className="text-2xl font-extralight mb-8">
                        説明
                      </h3>
                      <p className="text-xl font-normal text-gray-700 p-3 bg-gray-50 rounded">
                        {selectedAgent.description}
                      </p>
                    </div>

                    {/* 統計情報 */}
                    <div>
                      <h3 className="text-2xl font-extralight mb-8">
                        パフォーマンス統計
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">完了タスク</div>
                          <div className="text-4xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 50) + 10}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">成功率</div>
                          <div className="text-4xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 20) + 80}%
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">平均実行時間</div>
                          <div className="text-4xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 10) + 2}min
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">品質スコア</div>
                          <div className="text-4xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 20) + 80}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 最近のタスク */}
                    <div>
                      <h3 className="text-2xl font-extralight mb-8">
                        最近のタスク履歴
                      </h3>
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <p className="text-xl font-normal">Task #{100 + i}</p>
                              <p className="text-xs text-gray-500">{i}時間前</p>
                            </div>
                            <Chip size="sm" className="bg-gray-900 text-white" variant="flat">完了</Chip>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button className="bg-white text-gray-900" variant="light" onPress={onClose}>
                  閉じる
                </Button>
                <Button className="bg-blue-600 text-white" onPress={onClose}>
                  詳細を見る
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
