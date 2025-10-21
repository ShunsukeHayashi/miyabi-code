import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Card,
  CardBody,
  Progress,
  Divider,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface Task {
  id: string;
  title: string;
  status: "submitted" | "working" | "completed" | "failed" | "cancelled";
  created_at: string;
  completed_at?: string;
}

interface AgentMetrics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  avg_completion_time: number;
  success_rate: number;
  uptime_hours: number;
}

interface AgentDetailProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    id: string;
    name: string;
    emoji: string;
    type: string;
    status: "running" | "idle" | "paused" | "error";
    current_task?: string;
    tasks_count: number;
    capacity: number;
  } | null;
}

export const AgentDetailModal: React.FC<AgentDetailProps> = ({
  isOpen,
  onClose,
  agent,
}) => {
  const [selectedTab, setSelectedTab] = React.useState("overview");

  if (!agent) return null;

  // Mock data - will be replaced with real API calls
  const mockTasks: Task[] = [
    {
      id: "task-1",
      title: "コード生成 - API実装",
      status: "working",
      created_at: "2025-10-21T03:00:00Z",
    },
    {
      id: "task-2",
      title: "レビュー - PRチェック",
      status: "completed",
      created_at: "2025-10-21T02:30:00Z",
      completed_at: "2025-10-21T02:45:00Z",
    },
    {
      id: "task-3",
      title: "ドキュメント生成",
      status: "completed",
      created_at: "2025-10-21T02:00:00Z",
      completed_at: "2025-10-21T02:20:00Z",
    },
  ];

  const mockMetrics: AgentMetrics = {
    total_tasks: 47,
    completed_tasks: 42,
    failed_tasks: 3,
    avg_completion_time: 8.5,
    success_rate: 89.4,
    uptime_hours: 47.2,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "success";
      case "idle":
        return "default";
      case "paused":
        return "warning";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "working":
        return "primary";
      case "failed":
        return "danger";
      case "cancelled":
        return "warning";
      default:
        return "default";
    }
  };

  const handleRestart = () => {
    console.log(`[Agent Detail] Restarting agent: ${agent.id}`);
    // TODO: API call to restart agent
  };

  const handlePause = () => {
    console.log(`[Agent Detail] Pausing agent: ${agent.id}`);
    // TODO: API call to pause agent
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="4xl"
      scrollBehavior="inside"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-3">
              <span className="text-3xl">{agent.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{agent.name}</h2>
                  <Chip
                    color={getStatusColor(agent.status)}
                    variant="flat"
                    size="sm"
                  >
                    {agent.status === "running" ? "稼働中" :
                     agent.status === "idle" ? "待機中" :
                     agent.status === "paused" ? "一時停止" : "エラー"}
                  </Chip>
                </div>
                <p className="text-sm text-foreground-500 font-normal">
                  Type: {agent.type}
                </p>
              </div>
            </ModalHeader>

            <ModalBody>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                color="primary"
                variant="underlined"
              >
                {/* Overview Tab */}
                <Tab key="overview" title="概要">
                  <div className="space-y-4 py-4">
                    {/* Current Status */}
                    <Card>
                      <CardBody className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Icon
                              icon="lucide:activity"
                              className="h-5 w-5 text-miyabi-primary"
                            />
                            現在の状態
                          </h3>
                          <div className="flex gap-2">
                            {agent.status !== "paused" && (
                              <Button
                                size="sm"
                                variant="flat"
                                color="warning"
                                startContent={
                                  <Icon icon="lucide:pause" className="h-4 w-4" />
                                }
                                onPress={handlePause}
                              >
                                一時停止
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              startContent={
                                <Icon icon="lucide:refresh-ccw" className="h-4 w-4" />
                              }
                              onPress={handleRestart}
                            >
                              再起動
                            </Button>
                          </div>
                        </div>

                        <Divider />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-foreground-500">処理中タスク</p>
                            <p className="text-2xl font-semibold">
                              {agent.tasks_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">容量</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(agent.tasks_count / agent.capacity) * 100}
                                color="primary"
                                size="sm"
                                className="flex-1"
                              />
                              <span className="text-sm">
                                {agent.tasks_count}/{agent.capacity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {agent.current_task && (
                          <>
                            <Divider />
                            <div>
                              <p className="text-sm text-foreground-500 mb-1">
                                現在の作業
                              </p>
                              <p className="text-sm font-medium">
                                {agent.current_task}
                              </p>
                            </div>
                          </>
                        )}
                      </CardBody>
                    </Card>

                    {/* Performance Metrics */}
                    <Card>
                      <CardBody className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Icon
                            icon="lucide:bar-chart-3"
                            className="h-5 w-5 text-miyabi-info"
                          />
                          パフォーマンス
                        </h3>

                        <Divider />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-foreground-500">総タスク数</p>
                            <p className="text-2xl font-semibold">
                              {mockMetrics.total_tasks}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">完了タスク</p>
                            <p className="text-2xl font-semibold text-success">
                              {mockMetrics.completed_tasks}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">失敗タスク</p>
                            <p className="text-2xl font-semibold text-danger">
                              {mockMetrics.failed_tasks}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">成功率</p>
                            <p className="text-2xl font-semibold">
                              {mockMetrics.success_rate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">平均完了時間</p>
                            <p className="text-xl font-semibold">
                              {mockMetrics.avg_completion_time} 分
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-500">稼働時間</p>
                            <p className="text-xl font-semibold">
                              {mockMetrics.uptime_hours} 時間
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </Tab>

                {/* Tasks Tab */}
                <Tab key="tasks" title="タスク履歴">
                  <div className="space-y-3 py-4">
                    {mockTasks.map((task) => (
                      <Card key={task.id}>
                        <CardBody>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{task.title}</h4>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getTaskStatusColor(task.status)}
                                >
                                  {task.status === "working" ? "作業中" :
                                   task.status === "completed" ? "完了" :
                                   task.status === "failed" ? "失敗" : task.status}
                                </Chip>
                              </div>
                              <div className="text-sm text-foreground-500 space-y-1">
                                <p>
                                  作成: {new Date(task.created_at).toLocaleString("ja-JP")}
                                </p>
                                {task.completed_at && (
                                  <p>
                                    完了: {new Date(task.completed_at).toLocaleString("ja-JP")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              startContent={
                                <Icon icon="lucide:external-link" className="h-4 w-4" />
                              }
                            />
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </Tab>

                {/* Configuration Tab */}
                <Tab key="config" title="設定">
                  <div className="space-y-4 py-4">
                    <Card>
                      <CardBody className="space-y-3">
                        <h3 className="text-lg font-semibold">Agent設定</h3>
                        <Divider />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-foreground-500">Agent ID</span>
                            <span className="text-sm font-medium">{agent.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-foreground-500">Type</span>
                            <span className="text-sm font-medium">{agent.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-foreground-500">最大容量</span>
                            <span className="text-sm font-medium">{agent.capacity}</span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                閉じる
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
