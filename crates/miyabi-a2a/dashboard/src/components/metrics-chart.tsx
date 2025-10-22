import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  TooltipProps,
} from "recharts";
import { Card, CardBody, Button, Chip, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMetricsHistory } from "../hooks/use-metrics-history";
import { useWebSocketContext } from "../contexts/websocket-context";
import { useTheme } from "../contexts/theme-context";
import {
  MetricDataPoint,
  MetricsChartConfig,
  DEFAULT_METRICS_CONFIG,
  AVAILABLE_METRICS,
  METRICS_STORAGE_KEYS,
} from "../types/metrics-types";

interface MetricsChartProps {
  /** Custom height (default: 300px) */
  height?: number;
  /** Show/hide controls */
  showControls?: boolean;
  /** Custom className */
  className?: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  height = 300,
  showControls = true,
  className = "",
}) => {
  const { theme } = useTheme();
  const { lastMessage, isConnected } = useWebSocketContext();
  const {
    history,
    addDataPoint,
    clearHistory,
    exportHistory,
    importHistory,
    historyLength,
  } = useMetricsHistory();

  // Chart configuration state
  const [config, setConfig] = React.useState<MetricsChartConfig>(() => {
    try {
      const stored = localStorage.getItem(METRICS_STORAGE_KEYS.CONFIG);
      if (stored) {
        return { ...DEFAULT_METRICS_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load metrics config:", error);
    }
    return DEFAULT_METRICS_CONFIG;
  });

  // Pause/resume state
  const [isPaused, setIsPaused] = React.useState(false);

  // Save config to LocalStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(METRICS_STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error("Failed to save metrics config:", error);
    }
  }, [config]);

  // Listen to WebSocket messages and update metrics
  React.useEffect(() => {
    if (!lastMessage || isPaused) return;

    try {
      const data = JSON.parse(lastMessage.data);

      // Handle system_status updates
      if (data.type === "system_status" || data.status) {
        const statusData = data.status || data;

        const dataPoint: MetricDataPoint = {
          timestamp: Date.now(),
          active_tasks: statusData.active_tasks || 0,
          queued_tasks: statusData.queued_tasks || 0,
          task_throughput: statusData.task_throughput || 0,
          avg_completion_time: statusData.avg_completion_time || 0,
          active_agents: statusData.active_agents || 0,
        };

        addDataPoint(dataPoint);
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }, [lastMessage, isPaused, addDataPoint]);

  // Periodic polling fallback (every 1 minute) if WebSocket disconnected
  React.useEffect(() => {
    if (isConnected || isPaused) return;

    const intervalId = setInterval(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${API_URL}/api/system/status`);
        const statusData = await response.json();

        const dataPoint: MetricDataPoint = {
          timestamp: Date.now(),
          active_tasks: statusData.active_tasks || 0,
          queued_tasks: statusData.queued_tasks || 0,
          task_throughput: statusData.task_throughput || 0,
          avg_completion_time: statusData.avg_completion_time || 0,
          active_agents: statusData.active_agents || 0,
        };

        addDataPoint(dataPoint);
      } catch (error) {
        console.error("Failed to fetch system status:", error);
      }
    }, config.updateInterval);

    return () => clearInterval(intervalId);
  }, [isConnected, isPaused, config.updateInterval, addDataPoint]);

  // Toggle metric visibility
  const toggleMetricVisibility = (metricKey: keyof MetricDataPoint) => {
    setConfig(prev => ({
      ...prev,
      visible: {
        ...prev.visible,
        [metricKey]: !prev.visible[metricKey],
      },
    }));
  };

  // Format chart data for Recharts
  const chartData = React.useMemo(() => {
    return history.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      timestamp: point.timestamp,
      ...point,
    }));
  }, [history]);

  // Custom tooltip
  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
    active,
    payload,
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <Card className="shadow-lg">
        <CardBody className="p-3 space-y-2">
          <p className="text-sm font-semibold">
            {new Date(payload[0].payload.timestamp).toLocaleString()}
          </p>
          {AVAILABLE_METRICS.filter(metric => config.visible[metric.key]).map(
            metric => {
              const value = payload.find(p => p.dataKey === metric.key)?.value;
              if (value === undefined) return null;

              return (
                <div key={metric.key} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="text-xs">{metric.label}</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {typeof value === "number" ? value.toFixed(1) : value} {metric.unit}
                  </span>
                </div>
              );
            }
          )}
        </CardBody>
      </Card>
    );
  };

  // Theme-aware colors
  const gridColor = theme === "dark" ? "#374151" : "#e5e7eb";
  const textColor = theme === "dark" ? "#9ca3af" : "#6b7280";

  // Handle export
  const handleExport = () => {
    const jsonData = exportHistory();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `metrics-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonData = event.target?.result as string;
        const success = importHistory(jsonData);
        if (success) {
          alert("Metrics history imported successfully!");
        } else {
          alert("Failed to import metrics history. Invalid data.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardBody className="p-4">
        {showControls && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:activity"
                className="h-5 w-5 text-primary"
              />
              <h3 className="text-lg font-semibold">Real-time Metrics</h3>
              <Chip
                size="sm"
                variant="flat"
                color={isConnected ? "success" : "warning"}
                startContent={
                  <Icon
                    icon={isConnected ? "lucide:wifi" : "lucide:wifi-off"}
                    className="h-3 w-3"
                  />
                }
              >
                {isConnected ? "Live" : "Polling"}
              </Chip>
              <Chip size="sm" variant="flat" color="default">
                {historyLength} points
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="flat"
                color={isPaused ? "warning" : "default"}
                startContent={
                  <Icon
                    icon={isPaused ? "lucide:play" : "lucide:pause"}
                    className="h-4 w-4"
                  />
                }
                onPress={() => setIsPaused(!isPaused)}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>

              <Button
                size="sm"
                variant="flat"
                color="default"
                startContent={<Icon icon="lucide:download" className="h-4 w-4" />}
                onPress={handleExport}
                isDisabled={historyLength === 0}
              >
                Export
              </Button>

              <Button
                size="sm"
                variant="flat"
                color="default"
                startContent={<Icon icon="lucide:upload" className="h-4 w-4" />}
                onPress={handleImport}
              >
                Import
              </Button>

              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<Icon icon="lucide:trash-2" className="h-4 w-4" />}
                onPress={clearHistory}
                isDisabled={historyLength === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Metric toggles */}
        {showControls && (
          <div className="flex flex-wrap gap-2 mb-4">
            {AVAILABLE_METRICS.map(metric => (
              <Switch
                key={metric.key}
                size="sm"
                isSelected={config.visible[metric.key]}
                onValueChange={() => toggleMetricVisibility(metric.key)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span className="text-xs">{metric.label}</span>
                </div>
              </Switch>
            ))}
          </div>
        )}

        {/* Chart */}
        <div style={{ height: `${height}px` }}>
          {historyLength === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-foreground-500">
                <Icon icon="lucide:activity" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No metrics data yet</p>
                <p className="text-xs">Data will appear as the system runs</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <defs>
                  {AVAILABLE_METRICS.map(metric => (
                    <linearGradient
                      key={`gradient-${metric.key}`}
                      id={`color-${metric.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={metric.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={metric.color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

                <XAxis
                  dataKey="time"
                  stroke={textColor}
                  tick={{ fill: textColor, fontSize: 11 }}
                />

                <YAxis
                  yAxisId="left"
                  stroke={textColor}
                  tick={{ fill: textColor, fontSize: 11 }}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={textColor}
                  tick={{ fill: textColor, fontSize: 11 }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  iconType="circle"
                />

                {AVAILABLE_METRICS.filter(metric => config.visible[metric.key]).map(
                  metric => (
                    <Area
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      stroke={metric.color}
                      fillOpacity={1}
                      fill={`url(#color-${metric.key})`}
                      name={metric.label}
                      yAxisId={metric.yAxisId || "left"}
                      isAnimationActive={config.animationEnabled}
                      animationDuration={500}
                    />
                  )
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardBody>
    </Card>
  );
};