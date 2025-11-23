import { useState, useMemo } from 'react';
import { Layout, Table, Tag, Input, Select, Space, Menu, Spin, Badge, Typography, Progress, message } from 'antd';
import {
  GitlabOutlined,
  SearchOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  IssuesCloseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MergeOutlined,
  BranchesOutlined,
  RocketOutlined,
  FileTextOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePRs } from '../hooks/usePRs';
import { useWebSocket } from '../hooks/useWebSocket';
import type { PullRequest } from '../api/client';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content, Sider } = Layout;
const { Search } = Input;
const { Text } = Typography;

export default function PRsPage() {
  const { data, isLoading } = usePRs();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [livePRUpdates, setLivePRUpdates] = useState<Map<number, Partial<PullRequest>>>(new Map());

  // WebSocket connection for real-time PR updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'pr_update') {
        const prUpdate = event as any;
        setLivePRUpdates((prev) => {
          const updated = new Map(prev);
          updated.set(prUpdate.pr_number, {
            state: prUpdate.state,
            draft: prUpdate.draft,
            updated_at: prUpdate.timestamp,
          });
          return updated;
        });
        message.info(`PR #${prUpdate.pr_number} updated`, 1.5);
      }
    },
  });

  // Merge live updates with initial data
  const mergedPRs = useMemo(() => {
    if (!data || !data.prs) return [];

    return data.prs.map((pr) => {
      const liveUpdate = livePRUpdates.get(pr.number);
      return liveUpdate ? { ...pr, ...liveUpdate } : pr;
    });
  }, [data, livePRUpdates]);

  // Filter PRs based on search and state
  const filteredPRs = useMemo(() => {
    return mergedPRs.filter((pr) => {
      // Search filter
      const matchesSearch =
        pr.title.toLowerCase().includes(searchText.toLowerCase()) ||
        pr.number.toString().includes(searchText) ||
        pr.author.toLowerCase().includes(searchText.toLowerCase());

      // State filter
      const matchesState =
        stateFilter === 'all' ||
        pr.state === stateFilter;

      return matchesSearch && matchesState;
    });
  }, [mergedPRs, searchText, stateFilter]);

  const stats = useMemo(() => {
    if (!data || !data.prs) return { open: 0, merged: 0, draft: 0 };
    return {
      open: data.prs.filter((pr) => pr.state === 'open' && !pr.draft).length,
      merged: data.prs.filter((pr) => pr.state === 'merged').length,
      draft: data.prs.filter((pr) => pr.draft).length,
    };
  }, [data]);

  const columns: ColumnsType<PullRequest> = [
    {
      title: 'PR',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      render: (number: number) => (
        <Text strong>#{number}</Text>
      ),
    },
    {
      title: 'Title & Status',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: PullRequest) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            {record.state === 'merged' ? (
              <MergeOutlined style={{ color: '#722ed1', marginRight: 8 }} />
            ) : record.draft ? (
              <ClockCircleOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />
            ) : (
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            )}
            <Text strong>{title}</Text>
          </div>
          <Space size={4}>
            {record.state === 'merged' && (
              <Tag color="purple">Merged</Tag>
            )}
            {record.draft && (
              <Tag color="default">Draft</Tag>
            )}
            {record.state === 'open' && !record.draft && (
              <Tag color="green">Open</Tag>
            )}
            <Tag icon={<BranchesOutlined />} color="blue">
              {record.head_branch}
            </Tag>
          </Space>
        </div>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: string) => (
        <Tag icon={<AppstoreOutlined />} color="cyan">
          {author}
        </Tag>
      ),
    },
    {
      title: 'Changes',
      key: 'changes',
      width: 200,
      render: (_: any, record: PullRequest) => (
        <div>
          <div style={{ marginBottom: 4, fontSize: '11px' }}>
            <Text type="secondary">
              {record.commits} commits · {record.changed_files} files
            </Text>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Text type="success" style={{ fontSize: '11px' }}>+{record.additions}</Text>
            <Progress
              percent={100}
              size="small"
              strokeColor="#52c41a"
              showInfo={false}
              style={{ width: 40 }}
            />
            <Text type="danger" style={{ fontSize: '11px' }}>-{record.deletions}</Text>
            <Progress
              percent={100}
              size="small"
              strokeColor="#ff4d4f"
              showInfo={false}
              style={{ width: 40 }}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 120,
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
              {livePRUpdates.size > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🔴 {livePRUpdates.size} live PR updates
                  </Text>
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', marginBottom: 8, display: 'block' }}>
                📊 PR Statistics
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge status="success" text={`Open: ${stats.open}`} />
                <Badge status="processing" text={`Merged: ${stats.merged}`} />
                <Badge status="default" text={`Draft: ${stats.draft}`} />
                <Badge status="processing" text={`Total: ${data?.total || 0}`} />
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🏷️ State Filter
              </Text>
              <Select
                style={{ width: '100%' }}
                value={stateFilter}
                onChange={setStateFilter}
                options={[
                  { value: 'all', label: 'All PRs' },
                  { value: 'open', label: 'Open' },
                  { value: 'merged', label: 'Merged' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🔍 Quick Filters
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Tag
                  color="green"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setStateFilter('open')}
                >
                  Open PRs
                </Tag>
                <Tag
                  color="purple"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setStateFilter('merged')}
                >
                  Merged PRs
                </Tag>
                <Tag
                  color="default"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setSearchText('')}
                >
                  Clear Filters
                </Tag>
              </Space>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 <strong>Tips</strong><br />
                • Green = Open PR<br />
                • Purple = Merged PR<br />
                • Gray = Draft PR<br />
                • Click PR to view details
              </Text>
            </div>
          </Space>
        </Sider>

        <Content style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Search
              placeholder="Search PRs by title, number, or author"
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
                dataSource={filteredPRs}
                rowKey="number"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} PRs`,
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
