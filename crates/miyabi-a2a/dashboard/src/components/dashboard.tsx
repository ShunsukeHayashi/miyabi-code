import React from "react";
import { Card, CardBody, Progress, Tooltip, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Agent } from "../types/miyabi-types"; // ✅ Rust型に準拠
import { useMiyabiData } from "../hooks/use-miyabi-data"; // ✅ 実データフック

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
    case "working":
      return <span className="animate-pulse relative flex h-3 w-3 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-900"></span>
      </span>;
    case "idle":
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
      </span>;
    default:
      return <span className="relative flex h-3 w-3 mr-1">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
      </span>;
  }
};

const getAgentColorClass = (color: string) => {
  // Phase 1: Remove all agent-specific colors, use grayscale only
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
      {/* System Health - Phase 1 Design Updates */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Card className="w-full">
          <CardBody>
            {/* Task 1: Remove icon from heading */}
            {/* Task 3: Increase font size text-xl (20px) → text-4xl (40px) */}
            {/* Task 4: Add font-extralight */}
            <h2 className="text-4xl font-extralight tracking-tight mb-8">
              System Health
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  {/* Task 1: Remove check-circle icon */}
                  {/* Task 2: Replace miyabi-success (green) with gray-900 */}
                  <span className="flex items-center text-gray-900 font-normal">
                    Healthy
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Agents</span>
                  <span className="font-normal">{activeCount}/{agents.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Coding Agents</span>
                  <span className="font-normal">{codingAgents.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Business Agents</span>
                  <span className="font-normal">{businessAgents.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Active Tasks</span>
                  <span className="font-normal">{systemStatus.active_tasks}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Task Throughput</span>
                  <span className="font-normal">{systemStatus.task_throughput.toFixed(1)} tasks/hour</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">System Load</span>
                  <div className="w-32">
                    {/* Task 2: Remove color="primary", use grayscale */}
                    <Progress
                      aria-label="System Load"
                      value={45}
                      className="max-w-md bg-gray-200"
                      classNames={{
                        indicator: "bg-gray-900"
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Memory Usage</span>
                  <div className="w-32">
                    {/* Task 2: Remove color="warning", use grayscale */}
                    <Progress
                      aria-label="Memory Usage"
                      value={62}
                      className="max-w-md bg-gray-200"
                      classNames={{
                        indicator: "bg-gray-900"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* フィルター - Phase 1 Design Updates */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {/* Task 1: Remove emojis from filter chips */}
          {/* Task 2: Convert colors to grayscale + blue-600 */}
          <Chip
            variant={categoryFilter === "all" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("all")}
            className={`cursor-pointer ${categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            All ({agents.length})
          </Chip>
          <Chip
            variant={categoryFilter === "coding" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("coding")}
            className={`cursor-pointer ${categoryFilter === "coding" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            Coding ({codingAgents.length})
          </Chip>
          <Chip
            variant={categoryFilter === "business" ? "solid" : "flat"}
            onClick={() => setCategoryFilter("business")}
            className={`cursor-pointer ${categoryFilter === "business" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            Business ({businessAgents.length})
          </Chip>
        </div>

        <div className="flex gap-2">
          <Chip
            variant={statusFilter === "all" ? "solid" : "flat"}
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer ${statusFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            All Status
          </Chip>
          <Chip
            variant={statusFilter === "active" ? "solid" : "flat"}
            onClick={() => setStatusFilter("active")}
            className={`cursor-pointer ${statusFilter === "active" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            Active
          </Chip>
          <Chip
            variant={statusFilter === "idle" ? "solid" : "flat"}
            onClick={() => setStatusFilter("idle")}
            className={`cursor-pointer ${statusFilter === "idle" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}
          >
            Idle
          </Chip>
        </div>
      </div>

      {/* Agent Grid - Phase 1 Design Updates */}
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
                  {/* Task 4: font-medium → font-normal for body text */}
                  <h3 className="text-lg font-normal flex items-center">
                    {getStatusIcon(agent.status)}
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-500">{agent.role}</p>
                  <p className="text-xs text-gray-400 mt-1">{agent.description}</p>
                </div>
                {/* Task 1: Remove emojis, Task 2: Use grayscale */}
                <Chip
                  size="sm"
                  variant="flat"
                  className={agent.category === "coding" ? "bg-gray-200 text-gray-900" : "bg-gray-200 text-gray-900"}
                >
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
          {/* Keep this icon as it's functional, not decorative */}
          <Icon icon="lucide:search-x" className="text-4xl mx-auto mb-2" />
          <p>フィルターに一致するAgentがありません</p>
        </div>
      )}

      {/* Agent詳細モーダル - Phase 1 Design Updates */}
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
                    {/* Task 3 & 4: Larger heading with font-extralight */}
                    <h2 className="text-2xl font-extralight tracking-tight">{selectedAgent?.name}</h2>
                    <p className="text-sm text-gray-500">{selectedAgent?.role}</p>
                  </div>
                  {/* Task 2: Grayscale chip */}
                  <Chip
                    size="sm"
                    variant="flat"
                    className="bg-gray-200 text-gray-900"
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
                      {/* Task 1: Remove icon, Task 3 & 4: Larger heading with font-extralight */}
                      <h3 className="text-xl font-extralight tracking-tight mb-3">
                        基本情報
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">ステータス</span>
                          <span className="font-normal capitalize">{selectedAgent.status}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">タスク数</span>
                          <span className="font-normal">{selectedAgent.tasks} tasks</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">カテゴリ</span>
                          <span className="font-normal capitalize">{selectedAgent.category}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">役割</span>
                          {/* Task 1: Remove emojis, Task 2: Use grayscale */}
                          <Chip size="sm" className="bg-gray-200 text-gray-900">
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
                      {/* Task 1: Remove icon */}
                      <h3 className="text-xl font-extralight tracking-tight mb-3">
                        説明
                      </h3>
                      <p className="text-gray-700 p-3 bg-gray-50 rounded">
                        {selectedAgent.description}
                      </p>
                    </div>

                    {/* 統計情報 */}
                    <div>
                      {/* Task 1: Remove icon */}
                      <h3 className="text-xl font-extralight tracking-tight mb-3">
                        パフォーマンス統計
                      </h3>
                      {/* Task 2: Convert all colored backgrounds to grayscale */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">完了タスク</div>
                          <div className="text-2xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 50) + 10}
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">成功率</div>
                          <div className="text-2xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 20) + 80}%
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">平均実行時間</div>
                          <div className="text-2xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 10) + 2}min
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                          <div className="text-xs text-gray-600">品質スコア</div>
                          <div className="text-2xl font-extralight text-gray-900">
                            {Math.floor(Math.random() * 20) + 80}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 最近のタスク */}
                    <div>
                      {/* Task 1: Remove icon */}
                      <h3 className="text-xl font-extralight tracking-tight mb-3">
                        最近のタスク履歴
                      </h3>
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            {/* Keep check-circle icon as it's functional status indicator */}
                            <Icon icon="lucide:check-circle" className="text-gray-900" />
                            <div className="flex-1">
                              <p className="text-sm font-normal">Task #{100 + i}</p>
                              <p className="text-xs text-gray-500">{i}時間前</p>
                            </div>
                            {/* Task 2: Grayscale chip */}
                            <Chip size="sm" className="bg-gray-200 text-gray-900" variant="flat">完了</Chip>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                {/* Task 2: Keep danger color for critical actions, use grayscale for primary */}
                <Button color="danger" variant="light" onPress={onClose}>
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
