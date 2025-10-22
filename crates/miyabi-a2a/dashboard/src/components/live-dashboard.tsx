import React, { Suspense } from "react";
import { Card, CardBody, Progress, Divider, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AgentCard } from "./agent-card";
import { MetricsChart } from "./metrics-chart";
import { AgentFilters, FilterOptions } from "./agent-filters";
import { VirtualizedAgentGrid, useResponsiveColumns } from "./virtualized-agent-grid";
import { MinimalLoadingFallback } from "./loading-fallback";
import { useMiyabiData } from "../hooks/use-miyabi-data";
import { useNotifications } from "../contexts/notification-context";
import { Agent } from "../types/miyabi-types"; // ✅ Rust型に準拠

// Code-split AgentDetailModal (heavy modal with lots of UI)
const AgentDetailModal = React.lazy(() => import("./agent-detail-modal").then(module => ({ default: module.AgentDetailModal })));

export const LiveDashboard: React.FC = () => {
  const { systemStatus, agents, metrics } = useMiyabiData();
  const [selectedAgent, setSelectedAgent] = React.useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const { addNotification } = useNotifications();
  const [hasConnected, setHasConnected] = React.useState(false);
  const columnCount = useResponsiveColumns();

  // Filter state
  const [filters, setFilters] = React.useState<FilterOptions>({
    searchQuery: "",
    statusFilter: [],
    typeFilter: [],
    sortBy: "name",
    sortOrder: "asc",
  });

  // Stable callbacks for SSE
  const handleSseMessage = React.useCallback((event: any) => {
      console.log("[Live Dashboard] SSE event:", event);

      // Show notification based on event type
      const eventData = event.data ? JSON.parse(event.data) : {};
      const eventType = event.event || "message";

      switch (eventType) {
        case "agent_started":
          addNotification({
            type: "info",
            title: "Agent Started",
            message: `Agent ${eventData.agent_name || "Unknown"} has started`,
            duration: 3000,
          });
          break;

        case "agent_completed":
          addNotification({
            type: "success",
            title: "Agent Completed",
            message: `Agent ${eventData.agent_name || "Unknown"} completed successfully`,
            duration: 4000,
          });
          break;

        case "agent_failed":
          addNotification({
            type: "error",
            title: "Agent Failed",
            message: `Agent ${eventData.agent_name || "Unknown"} failed: ${eventData.error || "Unknown error"}`,
            duration: 6000,
          });
          break;

        case "task_created":
          addNotification({
            type: "info",
            title: "Task Created",
            message: `New task: ${eventData.task_title || "Untitled"}`,
            duration: 3000,
          });
          break;

        case "task_completed":
          addNotification({
            type: "success",
            title: "Task Completed",
            message: `Task completed: ${eventData.task_title || "Untitled"}`,
            duration: 3000,
          });
          break;

        case "system_warning":
          addNotification({
            type: "warning",
            title: "System Warning",
            message: eventData.message || "System warning detected",
            duration: 5000,
          });
          break;

        case "system_error":
          addNotification({
            type: "error",
            title: "System Error",
            message: eventData.message || "System error occurred",
            duration: 6000,
          });
          break;

        default:
          console.log(`[Live Dashboard] Unhandled event type: ${eventType}`);
      }
  }, [addNotification]);

  const handleSseOpen = React.useCallback(() => {
    console.log("[Live Dashboard] SSE connected");
    // Only show connection notification once
    if (!hasConnected) {
      setHasConnected(true);
      addNotification({
        type: "success",
        title: "Live Updates Connected",
        message: "Real-time event stream is now active",
        duration: 3000,
      });
    }
  }, [hasConnected, addNotification]);

  const handleSseError = React.useCallback((err: Event) => {
    console.error("[Live Dashboard] SSE error:", err);
    addNotification({
      type: "error",
      title: "Connection Error",
      message: "Failed to connect to live event stream",
      duration: 5000,
    });
  }, [addNotification]);

  // SSE connection disabled - using WebSocket via useMiyabiData instead
  // const { isConnected, error } = useSse("/v1/events/stream", {
  //   onMessage: handleSseMessage,
  //   onOpen: handleSseOpen,
  //   onError: handleSseError,
  // });

  // Mock SSE status for UI (WebSocket is handling real-time updates)
  const isConnected = true;
  const error = null;

  // Filter and sort agents
  const filteredAndSortedAgents = React.useMemo(() => {
    if (!agents) return [];

    let filtered = agents.filter((agent: Agent) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !agent.name.toLowerCase().includes(query) &&
          !agent.role.toLowerCase().includes(query) // ✅ agent.role (not agent.type)
        ) {
          return false;
        }
      }

      // Status filter
      if (
        filters.statusFilter.length > 0 &&
        !filters.statusFilter.includes(agent.status)
      ) {
        return false;
      }

      // Type filter (now using role)
      if (
        filters.typeFilter.length > 0 &&
        !filters.typeFilter.includes(agent.role.toLowerCase()) // ✅ agent.role (not agent.type)
      ) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a: Agent, b: Agent) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "tasks":
          comparison = (a.tasks || 0) - (b.tasks || 0); // ✅ agent.tasks (not agent.taskCount)
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [agents, filters]);

  if (!systemStatus || !agents || !metrics) {
    return <div>Loading dashboard data...</div>;
  }

  const activeAgents = agents.filter(agent => agent.status === "active" || agent.status === "working");
  const totalAgents = agents.length;
  const activePercentage = Math.round((activeAgents.length / totalAgents) * 100);

  return (
    <div className="space-y-6">
      {/* SSE Connection Status */}
      {isConnected && (
        <Chip color="success" variant="flat" size="sm">
          <Icon icon="lucide:activity" className="mr-1" />
          Live Updates Active
        </Chip>
      )}
      {error && (
        <Chip color="danger" variant="flat" size="sm">
          <Icon icon="lucide:wifi-off" className="mr-1" />
          {error}
        </Chip>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* System Health Card */}
        <Card>
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">System Health</h3>
              <Icon
                icon={systemStatus.status === "healthy" ? "lucide:check-circle" : "lucide:alert-circle"}
                className={`h-6 w-6 ${systemStatus.status === "healthy" ? "text-miyabi-success" : "text-miyabi-error"}`}
              />
            </div>
            <p className="text-xl font-semibold">
              {systemStatus.status === "healthy" ? "Healthy" : "Issues Detected"}
            </p>
            <p className="text-sm text-foreground-500">
              Last checked: {new Date().toLocaleTimeString()}
            </p>
          </CardBody>
        </Card>

        {/* Active Tasks Card */}
        <Card>
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Active Tasks</h3>
              <Icon icon="lucide:list-checks" className="h-6 w-6 text-miyabi-primary" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-xl font-semibold">{systemStatus.active_tasks}</p>
              <p className="text-sm text-foreground-500">
                ({systemStatus.queued_tasks} queued)
              </p>
            </div>
            <Progress
              value={systemStatus.active_tasks}
              maxValue={systemStatus.active_tasks + systemStatus.queued_tasks}
              color="primary"
              className="mt-1"
            />
          </CardBody>
        </Card>

        {/* Active Agents Card */}
        <Card>
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Active Agents</h3>
              <Icon icon="lucide:users" className="h-6 w-6 text-miyabi-info" />
            </div>
            <p className="text-xl font-semibold">
              {activeAgents.length}/{totalAgents}
            </p>
            <Progress 
              value={activePercentage} 
              color="primary"
              className="mt-1"
            />
          </CardBody>
        </Card>

        {/* Task Throughput Card */}
        <Card>
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Task Throughput</h3>
              <Icon icon="lucide:activity" className="h-6 w-6 text-miyabi-success" />
            </div>
            <p className="text-xl font-semibold">
              {metrics.tasksPerHour} tasks/hour
            </p>
            <p className="text-sm text-foreground-500">
              Avg completion: {metrics.avgCompletionTime} min
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Agent Status Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Agent Status</h2>

        {/* Filters */}
        <AgentFilters
          filters={filters}
          onFiltersChange={setFilters}
          agentCount={agents.length}
          filteredCount={filteredAndSortedAgents.length}
        />

        {/* Agent Cards */}
        {filteredAndSortedAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon
              icon="lucide:search-x"
              className="h-16 w-16 text-foreground-300 mb-4"
            />
            <h3 className="text-lg font-semibold text-foreground-600 mb-2">
              該当するAgentが見つかりません
            </h3>
            <p className="text-sm text-foreground-400">
              フィルター条件を変更してください
            </p>
          </div>
        ) : (
          <VirtualizedAgentGrid
            agents={filteredAndSortedAgents}
            onAgentClick={(agent) => {
              setSelectedAgent(agent);
              setIsDetailModalOpen(true);
            }}
            columnCount={columnCount}
          />
        )}
      </div>

      {/* Metrics Chart */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Performance Metrics</h2>
        <Card>
          <CardBody>
            <MetricsChart />
          </CardBody>
        </Card>
      </div>

      {/* Agent Detail Modal */}
      <Suspense fallback={<MinimalLoadingFallback />}>
        <AgentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
        />
      </Suspense>
    </div>
  );
};