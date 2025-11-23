import { useState, useCallback } from 'react';
import { Layout, Card, Button, Select, Space, Tag, Spin, message, Menu, Badge } from 'antd';
import {
  PlayCircleOutlined,
  RobotOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  IssuesCloseOutlined,
  GitlabOutlined,
  BranchesOutlined,
  RocketOutlined,
  FileTextOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAgents } from '../hooks/useAgents';
import { useWebSocket, type WsAgentStatus } from '../hooks/useWebSocket';

const { Header, Content, Sider } = Layout;

// Mock DAG data - In real implementation, this comes from CoordinatorAgent
const initialNodes = [
  {
    id: 'I270',
    type: 'input',
    data: { label: '🎯 Issue #270\nImplement Feature X' },
    position: { x: 250, y: 0 },
    style: { background: '#e6f7ff', border: '2px solid #1890ff', borderRadius: 8 },
  },
  {
    id: 'T1',
    data: { label: '📝 Task T1\nCodeGen: Add API' },
    position: { x: 100, y: 120 },
    style: { background: '#f6ffed', border: '2px solid #52c41a', borderRadius: 8 },
  },
  {
    id: 'T2',
    data: { label: '📝 Task T2\nCodeGen: Add Tests' },
    position: { x: 400, y: 120 },
    style: { background: '#f6ffed', border: '2px solid #52c41a', borderRadius: 8 },
  },
  {
    id: 'T3',
    data: { label: '🔍 Task T3\nReview: Quality Check' },
    position: { x: 250, y: 240 },
    style: { background: '#fff7e6', border: '2px solid #faad14', borderRadius: 8 },
  },
  {
    id: 'T4',
    type: 'output',
    data: { label: '✅ Task T4\nPR: Create PR' },
    position: { x: 250, y: 360 },
    style: { background: '#f9f0ff', border: '2px solid #722ed1', borderRadius: 8 },
  },
];

const initialEdges = [
  { id: 'e-I270-T1', source: 'I270', target: 'T1', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-I270-T2', source: 'I270', target: 'T2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-T1-T3', source: 'T1', target: 'T3', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-T2-T3', source: 'T2', target: 'T3', markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e-T3-T4', source: 'T3', target: 'T4', markerEnd: { type: MarkerType.ArrowClosed } },
];

export default function AgentsPage() {
  const { data: agentsData, isLoading } = useAgents();
  const navigate = useNavigate();
  const location = useLocation();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [liveAgentStatuses, setLiveAgentStatuses] = useState<Map<string, string>>(new Map());

  // WebSocket connection for real-time agent status updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'agent_status') {
        const agentEvent = event as WsAgentStatus;
        // Note: WebSocket events still use agent_type, but we map to agent name for display
        setLiveAgentStatuses((prev) => new Map(prev).set(agentEvent.agent_type, agentEvent.status));
      }
    },
  });

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleExecuteAgent = async () => {
    if (!selectedAgent) {
      message.warning('Please select an agent to execute');
      return;
    }

    message.loading({ content: `Executing ${selectedAgent}...`, key: 'agent-exec' });

    // Simulate API call
    setTimeout(() => {
      message.success({ content: `${selectedAgent} started successfully!`, key: 'agent-exec', duration: 2 });
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'success';
      case 'Idle':
        return 'default';
      case 'Error':
        return 'error';
      default:
        return 'processing';
    }
  };

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
      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '16px', borderRight: '1px solid #f0f0f0' }}>
          <Card title="🎯 Agent Controls" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                placeholder="Select Agent"
                style={{ width: '100%' }}
                onChange={setSelectedAgent}
                options={[
                  { value: 'CoordinatorAgent', label: '🧠 Coordinator (しきるん)' },
                  { value: 'CodeGenAgent', label: '⚙️ CodeGen (つくるん)' },
                  { value: 'ReviewAgent', label: '👁️ Review (めだまん)' },
                  { value: 'PRAgent', label: '📤 PR (まとめるん)' },
                  { value: 'DeploymentAgent', label: '🚀 Deploy (はこぶん)' },
                ]}
              />
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleExecuteAgent}
                block
                disabled={!selectedAgent}
              >
                Execute Agent
              </Button>
            </Space>
          </Card>

          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🤖 Active Agents</span>
                {isConnected ? (
                  <Badge status="processing" />
                ) : (
                  <Badge status="error" />
                )}
              </div>
            }
            size="small"
          >
            {isLoading ? (
              <Spin />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }}>
                {agentsData?.agents.map((agent) => {
                  const liveStatus = liveAgentStatuses.get(agent.name);
                  const displayStatus = liveStatus || agent.status;
                  const isUpdated = liveStatus !== undefined;

                  return (
                    <div
                      key={agent.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: isUpdated ? '#f0f5ff' : 'transparent',
                        borderRadius: '4px',
                        transition: 'background 0.3s',
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>
                        {agent.name}
                        {isUpdated && displayStatus === 'Running' && (
                          <SyncOutlined spin style={{ marginLeft: '8px', color: '#1890ff' }} />
                        )}
                      </span>
                      <Tag color={getStatusColor(displayStatus)}>{displayStatus}</Tag>
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>

          <Card title="📊 Task Graph Info" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="small">
              <div>
                <strong>Nodes:</strong> {nodes.length}
              </div>
              <div>
                <strong>Edges:</strong> {edges.length}
              </div>
              <div>
                <strong>Issue:</strong> #270
              </div>
              <div>
                <strong>Status:</strong> <Tag color="processing">In Progress</Tag>
              </div>
            </Space>
          </Card>
        </Sider>

        <Content style={{ padding: 0 }}>
          <div style={{ height: 'calc(100vh - 64px)', background: '#fafafa' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
