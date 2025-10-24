import { useState, useMemo } from 'react';
import { Layout, Table, Tag, Select, Space, Spin, Badge, Typography, Menu, message } from 'antd';
import {
  BranchesOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  IssuesCloseOutlined,
  GitlabOutlined,
  FolderOutlined,
  RocketOutlined,
  FileTextOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorktrees } from '../hooks/useWorktrees';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Worktree } from '../api/client';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export default function WorktreesPage() {
  const { data, isLoading } = useWorktrees();
  const navigate = useNavigate();
  const location = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [liveWorktreeUpdates, setLiveWorktreeUpdates] = useState<Map<string, Partial<Worktree>>>(new Map());

  // WebSocket connection for real-time worktree updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'worktree_update') {
        const worktreeUpdate = event as any;
        setLiveWorktreeUpdates((prev) => {
          const updated = new Map(prev);
          updated.set(worktreeUpdate.worktree_id, {
            status: worktreeUpdate.status,
            agent_type: worktreeUpdate.agent_type,
            updated_at: worktreeUpdate.timestamp,
          });
          return updated;
        });
        message.info(`Worktree ${worktreeUpdate.worktree_id} updated`, 1.5);
      }
    },
  });

  // Merge live updates with initial data
  const mergedWorktrees = useMemo(() => {
    if (!data || !data.worktrees) return [];

    return data.worktrees.map((worktree) => {
      const liveUpdate = liveWorktreeUpdates.get(worktree.id);
      return liveUpdate ? { ...worktree, ...liveUpdate } : worktree;
    });
  }, [data, liveWorktreeUpdates]);

  // Filter worktrees based on status and agent
  const filteredWorktrees = useMemo(() => {
    return mergedWorktrees.filter((worktree) => {
      const matchesStatus =
        statusFilter === 'all' || worktree.status === statusFilter;
      const matchesAgent =
        agentFilter === 'all' || worktree.agent_type === agentFilter;
      return matchesStatus && matchesAgent;
    });
  }, [mergedWorktrees, statusFilter, agentFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'processing';
      case 'Completed':
        return 'success';
      case 'Idle':
        return 'default';
      case 'Error':
        return 'error';
      default:
        return 'default';
    }
  };

  const stats = useMemo(() => {
    if (!data || !data.worktrees) return { active: 0, idle: 0, completed: 0, error: 0 };
    return {
      active: data.worktrees.filter((w) => w.status === 'Active').length,
      idle: data.worktrees.filter((w) => w.status === 'Idle').length,
      completed: data.worktrees.filter((w) => w.status === 'Completed').length,
      error: data.worktrees.filter((w) => w.status === 'Error').length,
    };
  }, [data]);

  const columns: ColumnsType<Worktree> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch: string, record: Worktree) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <BranchesOutlined style={{ marginRight: 8 }} />
            <Text strong>{branch}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.path}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Issue',
      dataIndex: 'issue_number',
      key: 'issue_number',
      width: 100,
      render: (issue_number: number | null) =>
        issue_number ? (
          <Tag icon={<IssuesCloseOutlined />} color="blue">
            #{issue_number}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Agent',
      dataIndex: 'agent_type',
      key: 'agent_type',
      width: 180,
      render: (agent_type: string | null) =>
        agent_type ? (
          <Tag icon={<AppstoreOutlined />} color="purple">
            {agent_type}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ja-JP'),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ja-JP'),
    },
  ];

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
        <Sider width={280} style={{ background: '#fff', padding: '16px', borderRight: '1px solid #f0f0f0' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{
              padding: '12px',
              background: isConnected ? '#f6ffed' : '#fff1f0',
              borderRadius: '4px',
              border: `1px solid ${isConnected ? '#b7eb8f' : '#ffccc7'}`
            }}>
              <Space>
                {isConnected ? (
                  <WifiOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                ) : (
                  <DisconnectOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
                )}
                <Text strong style={{ color: isConnected ? '#52c41a' : '#ff4d4f' }}>
                  {isConnected ? 'Live Updates Active' : 'Disconnected'}
                </Text>
              </Space>
              {liveWorktreeUpdates.size > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🔴 {liveWorktreeUpdates.size} live worktree updates
                  </Text>
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', marginBottom: 8, display: 'block' }}>
                📊 Worktree Statistics
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge status="processing" text={`Active: ${stats.active}`} />
                <Badge status="default" text={`Idle: ${stats.idle}`} />
                <Badge status="success" text={`Completed: ${stats.completed}`} />
                <Badge status="error" text={`Error: ${stats.error}`} />
                <Badge status="default" text={`Total: ${data?.total || 0}`} />
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🏷️ Status Filter
              </Text>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Worktrees' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Idle', label: 'Idle' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Error', label: 'Error' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🤖 Agent Filter
              </Text>
              <Select
                style={{ width: '100%' }}
                value={agentFilter}
                onChange={setAgentFilter}
                options={[
                  { value: 'all', label: 'All Agents' },
                  { value: 'CoordinatorAgent', label: 'Coordinator' },
                  { value: 'CodeGenAgent', label: 'CodeGen' },
                  { value: 'ReviewAgent', label: 'Review' },
                  { value: 'PRAgent', label: 'PR' },
                  { value: 'DeploymentAgent', label: 'Deployment' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                ℹ️ Worktree Info
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <FolderOutlined style={{ marginRight: 4 }} />
                  Worktrees enable parallel task execution by isolating each Issue in its own Git worktree.
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Each worktree has its own branch and can be managed independently.
                </Text>
              </Space>
            </div>
          </Space>
        </Sider>

        <Content style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {isLoading ? (
              <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredWorktrees}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} worktrees`,
                  showSizeChanger: true,
                }}
              />
            )}
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
