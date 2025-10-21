import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, Tabs, Tab, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

interface PerformanceAnalyticsProps {
  // We'll use mock data for now, but this can be replaced with real API data
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = () => {
  const [selectedTab, setSelectedTab] = React.useState("throughput");
  const [timeRange, setTimeRange] = React.useState<"1h" | "6h" | "24h" | "7d">("6h");

  // Mock data - タスクスループット (時系列)
  const throughputData = [
    { time: "00:00", tasks: 12, completed: 10, failed: 2 },
    { time: "01:00", tasks: 15, completed: 14, failed: 1 },
    { time: "02:00", tasks: 18, completed: 16, failed: 2 },
    { time: "03:00", tasks: 14, completed: 12, failed: 2 },
    { time: "04:00", tasks: 20, completed: 18, failed: 2 },
    { time: "05:00", tasks: 22, completed: 20, failed: 2 },
    { time: "06:00", tasks: 25, completed: 23, failed: 2 },
    { time: "07:00", tasks: 28, completed: 26, failed: 2 },
    { time: "08:00", tasks: 30, completed: 28, failed: 2 },
    { time: "09:00", tasks: 26, completed: 24, failed: 2 },
    { time: "10:00", tasks: 24, completed: 22, failed: 2 },
    { time: "11:00", tasks: 20, completed: 19, failed: 1 },
  ];

  // Mock data - Agent稼働率
  const agentUtilizationData = [
    { name: "しきるん", value: 85, color: "#f43f5e" },
    { name: "つくるん", value: 92, color: "#10b981" },
    { name: "めだまん", value: 78, color: "#10b981" },
    { name: "みつけるん", value: 65, color: "#3b82f6" },
    { name: "はこぶん", value: 45, color: "#f59e0b" },
    { name: "まとめるん", value: 70, color: "#f59e0b" },
    { name: "たすけるん", value: 30, color: "#6b7280" },
  ];

  // Mock data - エラー率推移
  const errorRateData = [
    { time: "00:00", rate: 5.2 },
    { time: "01:00", rate: 3.8 },
    { time: "02:00", rate: 4.5 },
    { time: "03:00", rate: 6.1 },
    { time: "04:00", rate: 4.2 },
    { time: "05:00", rate: 3.5 },
    { time: "06:00", rate: 2.8 },
    { time: "07:00", rate: 3.2 },
    { time: "08:00", rate: 4.0 },
    { time: "09:00", rate: 5.5 },
    { time: "10:00", rate: 4.8 },
    { time: "11:00", rate: 3.9 },
  ];

  // Mock data - Agent別タスク処理数
  const agentTasksData = [
    { name: "しきるん", tasks: 45, avgTime: 5.2 },
    { name: "つくるん", tasks: 62, avgTime: 8.5 },
    { name: "めだまん", tasks: 38, avgTime: 6.3 },
    { name: "みつけるん", tasks: 28, avgTime: 12.1 },
    { name: "はこぶん", tasks: 15, avgTime: 3.5 },
    { name: "まとめるん", tasks: 32, avgTime: 7.8 },
    { name: "たすけるん", tasks: 12, avgTime: 4.2 },
  ];

  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-content1 border border-divider rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes("率") || entry.name === "rate" ? "%" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Icon icon="lucide:bar-chart-3" className="h-6 w-6 text-primary" />
            Performance Analytics
          </h2>
          <p className="text-sm text-foreground-500 mt-1">
            リアルタイムパフォーマンス分析とシステムメトリクス
          </p>
        </div>

        <div className="flex gap-2">
          {(["1h", "6h", "24h", "7d"] as const).map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "solid" : "flat"}
              color={timeRange === range ? "primary" : "default"}
              onPress={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs for Different Chart Views */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        color="primary"
        variant="underlined"
      >
        {/* Task Throughput Tab */}
        <Tab
          key="throughput"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:activity" className="h-4 w-4" />
              <span>タスクスループット</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Area Chart - Task Throughput */}
            <Card>
              <CardBody>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="lucide:trending-up" className="h-5 w-5 text-success" />
                    タスク処理推移
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1">
                    時間別のタスク処理数と完了率
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={throughputData}>
                    <defs>
                      <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      stroke="#888"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#888" style={{ fontSize: "12px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="tasks"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorTasks)"
                      name="総タスク"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="完了"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Line Chart - Error Rate */}
            <Card>
              <CardBody>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="lucide:alert-triangle" className="h-5 w-5 text-warning" />
                    エラー率推移
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1">
                    時間別のタスク失敗率
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={errorRateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                    <XAxis
                      dataKey="time"
                      stroke="#888"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#888"
                      style={{ fontSize: "12px" }}
                      label={{ value: "エラー率 (%)", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ fill: "#f59e0b", r: 4 }}
                      name="エラー率"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Agent Utilization Tab */}
        <Tab
          key="agents"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:users" className="h-4 w-4" />
              <span>Agent稼働率</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Pie Chart - Agent Utilization */}
            <Card>
              <CardBody>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="lucide:pie-chart" className="h-5 w-5 text-primary" />
                    Agent別稼働率
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1">
                    各Agentの稼働時間割合
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={agentUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {agentUtilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Bar Chart - Agent Tasks */}
            <Card>
              <CardBody>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="lucide:bar-chart-2" className="h-5 w-5 text-info" />
                    Agent別タスク処理数
                  </h3>
                  <p className="text-xs text-foreground-500 mt-1">
                    各Agentが処理したタスク数
                  </p>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentTasksData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      stroke="#888"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis stroke="#888" style={{ fontSize: "12px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="tasks" fill="#3b82f6" name="処理タスク数" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Summary Tab */}
        <Tab
          key="summary"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:layout-dashboard" className="h-4 w-4" />
              <span>サマリー</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* KPI Cards */}
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-6">
                <Icon icon="lucide:zap" className="h-10 w-10 text-primary mb-2" />
                <p className="text-3xl font-bold">245</p>
                <p className="text-sm text-foreground-500">総タスク数</p>
                <Chip size="sm" color="success" variant="flat" className="mt-2">
                  +12% vs 前日
                </Chip>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center justify-center py-6">
                <Icon icon="lucide:check-circle" className="h-10 w-10 text-success mb-2" />
                <p className="text-3xl font-bold">92.4%</p>
                <p className="text-sm text-foreground-500">完了率</p>
                <Chip size="sm" color="success" variant="flat" className="mt-2">
                  +3.2% vs 前日
                </Chip>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center justify-center py-6">
                <Icon icon="lucide:clock" className="h-10 w-10 text-info mb-2" />
                <p className="text-3xl font-bold">5.8min</p>
                <p className="text-sm text-foreground-500">平均処理時間</p>
                <Chip size="sm" color="danger" variant="flat" className="mt-2">
                  -0.5min vs 前日
                </Chip>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-col items-center justify-center py-6">
                <Icon icon="lucide:alert-circle" className="h-10 w-10 text-danger mb-2" />
                <p className="text-3xl font-bold">4.2%</p>
                <p className="text-sm text-foreground-500">エラー率</p>
                <Chip size="sm" color="success" variant="flat" className="mt-2">
                  -1.1% vs 前日
                </Chip>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};
