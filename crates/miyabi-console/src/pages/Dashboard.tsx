import { useState } from 'react';
import { Layout, Card, Statistic, Row, Col, Spin, Menu, List, Badge, Typography, Tag, Progress } from 'antd';
import {
  IssuesCloseOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  GitlabOutlined,
  BranchesOutlined,
  RocketOutlined,
  FileTextOutlined,
  BellOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAgents } from '../hooks/useAgents';
import { useWebSocket, type WsAgentStatus, type WsAgentStarted, type WsAgentProgress, type WsAgentCompleted, type WsNotification } from '../hooks/useWebSocket';

const { Header, Content } = Layout;
const { Text } = Typography;

interface Activity {
  id: string;
  type: 'agent' | 'notification' | 'progress';
  timestamp: string;
  message: string;
  level?: string;
  agent_type?: string;
  status?: string;
  progress?: number;
  execution_id?: string;
}

// Issue #1175: Agent execution progress tracking
interface AgentExecution {
  execution_id: string;
  agent_type: string;
  issue_number: number;
  progress: number;
  message: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
}

export default function Dashboard() {
  const { data, isLoading } = useAgents();
  const navigate = useNavigate();
  const location = useLocation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [liveAgentStatuses, setLiveAgentStatuses] = useState<Map<string, string>>(new Map());
  // Issue #1175: Track running agent executions
  const [runningExecutions, setRunningExecutions] = useState<Map<string, AgentExecution>>(new Map());

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'agent_status') {
        const agentEvent = event as WsAgentStatus;
        setLiveAgentStatuses((prev) => new Map(prev).set(agentEvent.agent_type, agentEvent.status));

        // Add to activity feed
        const activity: Activity = {
          id: `agent-${Date.now()}`,
          type: 'agent',
          timestamp: agentEvent.timestamp,
          message: `${agentEvent.agent_type} is now ${agentEvent.status}`,
          agent_type: agentEvent.agent_type,
          status: agentEvent.status,
        };
        setActivities((prev) => [activity, ...prev].slice(0, 20)); // Keep last 20
      } else if (event.type === 'agent_started') {
        // Issue #1175: Handle agent started
        const startEvent = event as WsAgentStarted;
        const execution: AgentExecution = {
          execution_id: startEvent.execution_id,
          agent_type: startEvent.agent_type,
          issue_number: startEvent.issue_number,
          progress: 0,
          message: 'Starting...',
          status: 'running',
          started_at: startEvent.timestamp,
        };
        setRunningExecutions((prev) => new Map(prev).set(startEvent.execution_id, execution));

        const activity: Activity = {
          id: `started-${Date.now()}`,
          type: 'progress',
          timestamp: startEvent.timestamp,
          message: `${startEvent.agent_type} started on Issue #${startEvent.issue_number}`,
          agent_type: startEvent.agent_type,
          execution_id: startEvent.execution_id,
          progress: 0,
        };
        setActivities((prev) => [activity, ...prev].slice(0, 20));
      } else if (event.type === 'agent_progress') {
        // Issue #1175: Handle agent progress
        const progressEvent = event as WsAgentProgress;
        setRunningExecutions((prev) => {
          const existing = prev.get(progressEvent.execution_id);
          if (existing) {
            const updated = new Map(prev);
            updated.set(progressEvent.execution_id, {
              ...existing,
              progress: progressEvent.progress,
              message: progressEvent.message,
            });
            return updated;
          }
          return prev;
        });
      } else if (event.type === 'agent_completed') {
        // Issue #1175: Handle agent completed
        const completedEvent = event as WsAgentCompleted;
        setRunningExecutions((prev) => {
          const updated = new Map(prev);
          updated.delete(completedEvent.execution_id);
          return updated;
        });

        const activity: Activity = {
          id: `completed-${Date.now()}`,
          type: 'progress',
          timestamp: completedEvent.timestamp,
          message: completedEvent.result.success
            ? `${completedEvent.agent_type} completed successfully${completedEvent.result.pr_number ? ` (PR #${completedEvent.result.pr_number})` : ''}`
            : `${completedEvent.agent_type} failed: ${completedEvent.result.error}`,
          agent_type: completedEvent.agent_type,
          execution_id: completedEvent.execution_id,
          progress: 100,
          status: completedEvent.result.success ? 'completed' : 'failed',
        };
        setActivities((prev) => [activity, ...prev].slice(0, 20));
      } else if (event.type === 'notification') {
        const notifEvent = event as WsNotification;
        const activity: Activity = {
          id: `notif-${Date.now()}`,
          type: 'notification',
          timestamp: notifEvent.timestamp,
          message: notifEvent.message,
          level: notifEvent.level,
        };
        setActivities((prev) => [activity, ...prev].slice(0, 20));
      }
    },
  });

  // Calculate running agents (combining initial data with live updates)
  const runningAgents = (() => {
    if (!data?.agents) return 0;
    let count = 0;
    data.agents.forEach((agent) => {
      const liveStatus = liveAgentStatuses.get(agent.agent_type);
      const status = liveStatus || agent.status;
      if (status === 'Running') count++;
    });
    return count;
  })();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
        <div style={{ padding: '0 24px', fontSize: '24px', fontWeight: 'bold', marginRight: '32px' }}>🌸 Miyabi WebUI</div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, border: 'none' }}
          items={[
            { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: '/agents', icon: <AppstoreOutlined />, label: 'Agents' },
            { key: '/issues', icon: <IssuesCloseOutlined />, label: 'Issues' },
            { key: '/prs', icon: <GitlabOutlined />, label: 'PRs' },
            { key: '/worktrees', icon: <BranchesOutlined />, label: 'Worktrees' },
            { key: '/deployments', icon: <RocketOutlined />, label: 'Deployments' },
            { key: '/logs', icon: <FileTextOutlined />, label: 'Logs' },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px' }}>
        {isLoading ? (
          <Spin size="large" />
        ) : (
          <>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Open Issues"
                    value={42}
                    prefix={<IssuesCloseOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Running Agents"
                    value={runningAgents}
                    prefix={<RobotOutlined />}
                    valueStyle={{ color: runningAgents > 0 ? '#3f8600' : undefined }}
                    suffix={isConnected && <Badge status="processing" />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Merged PRs"
                    value={38}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Live Activities"
                    value={activities.length}
                    prefix={<ThunderboltOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Issue #1175: Running Agent Executions with Progress Bars */}
            {runningExecutions.size > 0 && (
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Card
                    title={
                      <span>
                        <LoadingOutlined style={{ marginRight: '8px' }} spin />
                        Running Agent Executions ({runningExecutions.size})
                      </span>
                    }
                  >
                    {Array.from(runningExecutions.values()).map((execution) => (
                      <div key={execution.execution_id} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>
                            <Tag color="blue">{execution.agent_type}</Tag>
                            Issue #{execution.issue_number}
                          </span>
                          <Text type="secondary">{execution.message}</Text>
                        </div>
                        <Progress
                          percent={execution.progress}
                          status="active"
                          strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                          }}
                        />
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>
            )}

            <Row gutter={16}>
              <Col span={24}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>
                        <BellOutlined style={{ marginRight: '8px' }} />
                        Live Activity Feed
                      </span>
                      {isConnected ? (
                        <Badge status="processing" text="Connected" />
                      ) : (
                        <Badge status="error" text="Disconnected" />
                      )}
                    </div>
                  }
                >
                  {activities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <ClockCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <div>Waiting for live activities...</div>
                    </div>
                  ) : (
                    <List
                      itemLayout="horizontal"
                      dataSource={activities}
                      renderItem={(activity) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              activity.type === 'agent' ? (
                                <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                              ) : (
                                <BellOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                              )
                            }
                            title={
                              <div>
                                {activity.message}
                                {activity.status && (
                                  <Tag
                                    color={activity.status === 'Running' ? 'green' : 'default'}
                                    style={{ marginLeft: '8px' }}
                                  >
                                    {activity.status}
                                  </Tag>
                                )}
                              </div>
                            }
                            description={
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(activity.timestamp).toLocaleString('ja-JP')}
                              </Text>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
}
