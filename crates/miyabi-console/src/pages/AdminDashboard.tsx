import { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Tabs,
  List,
  Badge,
  Typography,
  Space,
  Button,
  Alert,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  RobotOutlined,
  DollarOutlined,
  DashboardOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useWebSocket, type WsAgentStatus } from '../hooks/useWebSocket';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Issue #1180: Admin Dashboard Types
interface SystemMetrics {
  apiLatencyMs: number;
  errorRate: number;
  activeConnections: number;
  queuedTasks: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface AgentStats {
  agentType: string;
  executionsToday: number;
  successRate: number;
  avgDurationMs: number;
  status: 'healthy' | 'degraded' | 'down';
}

interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  suspendedUsers: number;
}

interface OrganizationSummary {
  totalOrgs: number;
  activeOrgs: number;
  totalSeats: number;
  usedSeats: number;
}

export default function AdminDashboard() {
  // System metrics state
  const [metrics, setMetrics] = useState<SystemMetrics>({
    apiLatencyMs: 45,
    errorRate: 0.2,
    activeConnections: 128,
    queuedTasks: 12,
    cpuUsage: 34,
    memoryUsage: 62,
  });

  // Agent stats
  const [agentStats, setAgentStats] = useState<AgentStats[]>([
    { agentType: 'CoordinatorAgent', executionsToday: 45, successRate: 98, avgDurationMs: 12000, status: 'healthy' },
    { agentType: 'CodeGenAgent', executionsToday: 128, successRate: 94, avgDurationMs: 45000, status: 'healthy' },
    { agentType: 'ReviewAgent', executionsToday: 89, successRate: 97, avgDurationMs: 8000, status: 'healthy' },
    { agentType: 'PRAgent', executionsToday: 67, successRate: 99, avgDurationMs: 5000, status: 'healthy' },
    { agentType: 'DeploymentAgent', executionsToday: 23, successRate: 100, avgDurationMs: 120000, status: 'healthy' },
    { agentType: 'IssueAgent', executionsToday: 156, successRate: 96, avgDurationMs: 3000, status: 'healthy' },
  ]);

  // User summary
  const [userSummary, setUserSummary] = useState<UserSummary>({
    totalUsers: 1247,
    activeUsers: 892,
    newUsersToday: 12,
    suspendedUsers: 3,
  });

  // Organization summary
  const [orgSummary, setOrgSummary] = useState<OrganizationSummary>({
    totalOrgs: 84,
    activeOrgs: 76,
    totalSeats: 500,
    usedSeats: 423,
  });

  // Live agent status from WebSocket
  const [liveAgentStatuses, setLiveAgentStatuses] = useState<Map<string, string>>(new Map());

  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'agent_status') {
        const agentEvent = event as WsAgentStatus;
        setLiveAgentStatuses((prev) => new Map(prev).set(agentEvent.agent_type, agentEvent.status));
      }
    },
  });

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        apiLatencyMs: Math.max(20, prev.apiLatencyMs + (Math.random() - 0.5) * 10),
        activeConnections: Math.max(50, prev.activeConnections + Math.floor((Math.random() - 0.5) * 10)),
        queuedTasks: Math.max(0, prev.queuedTasks + Math.floor((Math.random() - 0.5) * 3)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Agent stats table columns
  const agentColumns = [
    {
      title: 'Agent',
      dataIndex: 'agentType',
      key: 'agentType',
      render: (text: string) => (
        <Space>
          <RobotOutlined />
          <Text strong>{text}</Text>
          {liveAgentStatuses.get(text) === 'Running' && (
            <Badge status="processing" />
          )}
        </Space>
      ),
    },
    {
      title: 'Executions Today',
      dataIndex: 'executionsToday',
      key: 'executionsToday',
      sorter: (a: AgentStats, b: AgentStats) => a.executionsToday - b.executionsToday,
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 95 ? 'success' : rate >= 80 ? 'normal' : 'exception'}
        />
      ),
      sorter: (a: AgentStats, b: AgentStats) => a.successRate - b.successRate,
    },
    {
      title: 'Avg Duration',
      dataIndex: 'avgDurationMs',
      key: 'avgDurationMs',
      render: (ms: number) => `${(ms / 1000).toFixed(1)}s`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = { healthy: 'green', degraded: 'orange', down: 'red' };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  // Recent activity data
  const recentActivity = [
    { id: '1', message: 'CodeGenAgent completed Issue #1175', time: '2 min ago', type: 'success' },
    { id: '2', message: 'New user registered: user@example.com', time: '5 min ago', type: 'info' },
    { id: '3', message: 'DeploymentAgent deployed to production', time: '12 min ago', type: 'success' },
    { id: '4', message: 'API rate limit warning for org-123', time: '15 min ago', type: 'warning' },
    { id: '5', message: 'ReviewAgent PR #1196 review completed', time: '20 min ago', type: 'success' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SettingOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '12px' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>Miyabi Admin Dashboard</Title>
        </div>
        <Space>
          {isConnected ? (
            <Badge status="success" text={<Text style={{ color: '#fff' }}>Live</Text>} />
          ) : (
            <Badge status="error" text={<Text style={{ color: '#fff' }}>Disconnected</Text>} />
          )}
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {/* System Health Alert */}
        {metrics.errorRate > 1 && (
          <Alert
            message="System Health Warning"
            description={`Error rate is elevated at ${metrics.errorRate.toFixed(1)}%`}
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Key Metrics Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="API Latency"
                value={metrics.apiLatencyMs.toFixed(0)}
                suffix="ms"
                prefix={<ApiOutlined />}
                valueStyle={{ color: metrics.apiLatencyMs < 100 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Error Rate"
                value={metrics.errorRate.toFixed(2)}
                suffix="%"
                prefix={<WarningOutlined />}
                valueStyle={{ color: metrics.errorRate < 1 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Connections"
                value={metrics.activeConnections}
                prefix={<CloudServerOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Queued Tasks"
                value={metrics.queuedTasks}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: metrics.queuedTasks > 50 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
        </Row>

        {/* User & Org Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={12}>
            <Card title={<><UserOutlined /> User Statistics</>}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Total Users" value={userSummary.totalUsers} />
                </Col>
                <Col span={12}>
                  <Statistic title="Active Users" value={userSummary.activeUsers} valueStyle={{ color: '#3f8600' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="New Today" value={userSummary.newUsersToday} prefix="+" />
                </Col>
                <Col span={12}>
                  <Statistic title="Suspended" value={userSummary.suspendedUsers} valueStyle={{ color: '#cf1322' }} />
                </Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<><TeamOutlined /> Organization Statistics</>}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Total Organizations" value={orgSummary.totalOrgs} />
                </Col>
                <Col span={12}>
                  <Statistic title="Active Organizations" value={orgSummary.activeOrgs} valueStyle={{ color: '#3f8600' }} />
                </Col>
                <Col span={24} style={{ marginTop: '16px' }}>
                  <Text>Seat Usage</Text>
                  <Progress
                    percent={Math.round((orgSummary.usedSeats / orgSummary.totalSeats) * 100)}
                    format={() => `${orgSummary.usedSeats} / ${orgSummary.totalSeats}`}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* System Resources */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} md={12}>
            <Card title={<><DatabaseOutlined /> System Resources</>}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>CPU Usage</Text>
                  <Progress
                    percent={metrics.cpuUsage}
                    status={metrics.cpuUsage > 80 ? 'exception' : 'normal'}
                  />
                </div>
                <div>
                  <Text>Memory Usage</Text>
                  <Progress
                    percent={metrics.memoryUsage}
                    status={metrics.memoryUsage > 80 ? 'exception' : 'normal'}
                  />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<><ThunderboltOutlined /> Recent Activity</>}>
              <List
                size="small"
                dataSource={recentActivity}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        item.type === 'success' ? (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        ) : item.type === 'warning' ? (
                          <WarningOutlined style={{ color: '#faad14' }} />
                        ) : (
                          <UserOutlined style={{ color: '#1890ff' }} />
                        )
                      }
                      title={item.message}
                      description={item.time}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* Agent Statistics Table */}
        <Card title={<><RobotOutlined /> Agent Execution Statistics</>}>
          <Table
            columns={agentColumns}
            dataSource={agentStats}
            rowKey="agentType"
            pagination={false}
          />
        </Card>
      </Content>
    </Layout>
  );
}
