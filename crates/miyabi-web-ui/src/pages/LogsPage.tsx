import { useState, useMemo, useEffect } from 'react';
import { Layout, Table, Tag, Select, Space, Spin, Badge, Typography, Menu, Input, message } from 'antd';
import {
  FileTextOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  IssuesCloseOutlined,
  GitlabOutlined,
  BranchesOutlined,
  RocketOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BugOutlined,
  SearchOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogs } from '../hooks/useLogs';
import { useWebSocket, type WsLogEntry } from '../hooks/useWebSocket';
import type { LDDLog } from '../api/client';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { Search } = Input;

export default function LogsPage() {
  const { data, isLoading } = useLogs();
  const navigate = useNavigate();
  const location = useLocation();
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [liveLogs, setLiveLogs] = useState<LDDLog[]>([]);

  // WebSocket connection for real-time logs
  const { isConnected, lastEvent } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'log_entry') {
        const logEvent = event as WsLogEntry;
        const newLog: LDDLog = {
          id: logEvent.id,
          timestamp: logEvent.timestamp,
          level: logEvent.level,
          agent_type: logEvent.agent_type || null,
          message: logEvent.message,
          context: logEvent.context || null,
          issue_number: logEvent.issue_number || null,
          session_id: logEvent.session_id,
          file: logEvent.file || null,
          line: logEvent.line || null,
        };
        setLiveLogs((prev) => [newLog, ...prev].slice(0, 100)); // Keep last 100 live logs
      }
    },
    onOpen: () => {
      message.success('Connected to live log stream', 2);
    },
    onClose: () => {
      message.warning('Disconnected from live log stream', 2);
    },
  });

  // Merge live logs with initial data
  const allLogs = useMemo(() => {
    const initialLogs = data?.logs || [];
    // Combine live logs with initial logs, avoiding duplicates
    const liveLogIds = new Set(liveLogs.map(l => l.id));
    const uniqueInitialLogs = initialLogs.filter(l => !liveLogIds.has(l.id));
    return [...liveLogs, ...uniqueInitialLogs];
  }, [data, liveLogs]);

  // Filter logs based on level, agent, and search
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchesLevel =
        levelFilter === 'all' || log.level === levelFilter;
      const matchesAgent =
        agentFilter === 'all' || log.agent_type === agentFilter;
      const matchesSearch =
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        (log.context && log.context.toLowerCase().includes(searchText.toLowerCase()));
      return matchesLevel && matchesAgent && matchesSearch;
    });
  }, [allLogs, levelFilter, agentFilter, searchText]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'blue';
      case 'DEBUG':
        return 'cyan';
      case 'WARN':
        return 'orange';
      case 'ERROR':
        return 'red';
      default:
        return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO':
        return <InfoCircleOutlined />;
      case 'DEBUG':
        return <BugOutlined />;
      case 'WARN':
        return <WarningOutlined />;
      case 'ERROR':
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };

  const stats = useMemo(() => {
    return {
      info: allLogs.filter((l) => l.level === 'INFO').length,
      debug: allLogs.filter((l) => l.level === 'DEBUG').length,
      warn: allLogs.filter((l) => l.level === 'WARN').length,
      error: allLogs.filter((l) => l.level === 'ERROR').length,
      live: liveLogs.length,
      total: allLogs.length,
    };
  }, [allLogs, liveLogs]);

  const columns: ColumnsType<LDDLog> = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => {
        const date = new Date(timestamp);
        return (
          <div>
            <div>{date.toLocaleDateString('ja-JP')}</div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {date.toLocaleTimeString('ja-JP')}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => (
        <Tag icon={getLevelIcon(level)} color={getLevelColor(level)}>
          {level}
        </Tag>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agent_type',
      key: 'agent_type',
      width: 150,
      render: (agent_type: string | null) =>
        agent_type ? (
          <Tag icon={<AppstoreOutlined />} color="purple">
            {agent_type}
          </Tag>
        ) : (
          <Text type="secondary">System</Text>
        ),
    },
    {
      title: 'Message',
      key: 'message',
      render: (_: any, record: LDDLog) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text strong>{record.message}</Text>
          </div>
          {record.context && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.context}
            </Text>
          )}
          {record.file && (
            <div style={{ marginTop: 4 }}>
              <Text code style={{ fontSize: '11px' }}>
                {record.file}:{record.line}
              </Text>
            </div>
          )}
        </div>
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
      title: 'Session',
      dataIndex: 'session_id',
      key: 'session_id',
      width: 200,
      render: (session_id: string) => (
        <Text code style={{ fontSize: '11px' }}>
          {session_id}
        </Text>
      ),
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
                  {isConnected ? 'Live Stream Active' : 'Disconnected'}
                </Text>
              </Space>
              {stats.live > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🔴 {stats.live} live logs received
                  </Text>
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', marginBottom: 8, display: 'block' }}>
                📊 Log Statistics
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge status="processing" text={`INFO: ${stats.info}`} />
                <Badge status="default" text={`DEBUG: ${stats.debug}`} />
                <Badge status="warning" text={`WARN: ${stats.warn}`} />
                <Badge status="error" text={`ERROR: ${stats.error}`} />
                <Badge status="default" text={`Total: ${stats.total}`} />
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🏷️ Level Filter
              </Text>
              <Select
                style={{ width: '100%' }}
                value={levelFilter}
                onChange={setLevelFilter}
                options={[
                  { value: 'all', label: 'All Levels' },
                  { value: 'INFO', label: 'INFO' },
                  { value: 'DEBUG', label: 'DEBUG' },
                  { value: 'WARN', label: 'WARN' },
                  { value: 'ERROR', label: 'ERROR' },
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
                  { value: 'IssueAgent', label: 'Issue' },
                  { value: 'PRAgent', label: 'PR' },
                  { value: 'DeploymentAgent', label: 'Deployment' },
                  { value: 'RefresherAgent', label: 'Refresher' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                ℹ️ LDD Info
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  Log-Driven Development: All agent activities are logged for debugging and monitoring.
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Logs are automatically rotated every 24 hours and archived for 30 days.
                </Text>
              </Space>
            </div>
          </Space>
        </Sider>

        <Content style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Search
              placeholder="Search logs by message or context"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
              allowClear
            />

            {isLoading ? (
              <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredLogs}
                rowKey="id"
                pagination={{
                  pageSize: 20,
                  showTotal: (total) => `Total ${total} logs`,
                  showSizeChanger: true,
                }}
                size="small"
              />
            )}
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
}
