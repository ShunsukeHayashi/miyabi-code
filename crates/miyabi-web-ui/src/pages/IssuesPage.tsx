import { useState, useMemo } from 'react';
import { Layout, Table, Tag, Input, Select, Space, Menu, Spin, Badge, Typography, message } from 'antd';
import {
  IssuesCloseOutlined,
  SearchOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GitlabOutlined,
  BranchesOutlined,
  RocketOutlined,
  FileTextOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIssues } from '../hooks/useIssues';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Issue } from '../api/client';
import { LABELS, LABEL_CATEGORIES, getLabelsByCategory } from '../constants/labels';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content, Sider } = Layout;
const { Search } = Input;
const { Text } = Typography;

export default function IssuesPage() {
  const { data, isLoading } = useIssues();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchText, setSearchText] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [liveIssueUpdates, setLiveIssueUpdates] = useState<Map<number, Partial<Issue>>>(new Map());

  // WebSocket connection for real-time issue updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'issue_update') {
        const issueUpdate = event as any;
        setLiveIssueUpdates((prev) => {
          const updated = new Map(prev);
          updated.set(issueUpdate.issue_number, {
            state: issueUpdate.state,
            labels: issueUpdate.labels,
            assignees: issueUpdate.assignees,
            updated_at: issueUpdate.timestamp,
          });
          return updated;
        });
        message.info(`Issue #${issueUpdate.issue_number} updated`, 1.5);
      }
    },
  });

  // Merge live updates with initial data
  const mergedIssues = useMemo(() => {
    if (!data || !data.issues) return [];

    return data.issues.map((issue) => {
      const liveUpdate = liveIssueUpdates.get(issue.number);
      return liveUpdate ? { ...issue, ...liveUpdate } : issue;
    });
  }, [data, liveIssueUpdates]);

  // Filter issues based on search, labels, and state
  const filteredIssues = useMemo(() => {
    return mergedIssues.filter((issue) => {
      // Search filter
      const matchesSearch =
        issue.title.toLowerCase().includes(searchText.toLowerCase()) ||
        issue.number.toString().includes(searchText);

      // Label filter
      const matchesLabels =
        selectedLabels.length === 0 ||
        selectedLabels.some((label) => issue.labels.some((l) => l.name === label));

      // State filter
      const matchesState =
        stateFilter === 'all' ||
        issue.state === stateFilter;

      return matchesSearch && matchesLabels && matchesState;
    });
  }, [mergedIssues, searchText, selectedLabels, stateFilter]);

  const columns: ColumnsType<Issue> = [
    {
      title: 'Number',
      dataIndex: 'number',
      key: 'number',
      width: 100,
      render: (number: number) => (
        <Text strong>#{number}</Text>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Issue) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            {record.state === 'open' ? (
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            ) : (
              <ClockCircleOutlined style={{ color: '#8c8c8c', marginRight: 8 }} />
            )}
            <Text strong>{title}</Text>
          </div>
          <Space size={4} wrap>
            {record.labels.map((label) => (
              <Tag key={label.name} color={`#${label.color}`} style={{ fontSize: '11px' }}>
                {label.name}
              </Tag>
            ))}
          </Space>
        </div>
      ),
    },
    {
      title: 'Assignees',
      dataIndex: 'assignees',
      key: 'assignees',
      width: 200,
      render: (assignees: string[]) => (
        <Space direction="vertical" size={2}>
          {assignees.length > 0 ? (
            assignees.map((assignee) => (
              <Tag key={assignee} icon={<AppstoreOutlined />} color="blue">
                {assignee}
              </Tag>
            ))
          ) : (
            <Text type="secondary">No assignee</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString('ja-JP'),
    },
  ];

  const stats = useMemo(() => {
    if (!data || !data.issues) return { open: 0, closed: 0 };
    return {
      open: data.issues.filter((i) => i.state === 'open').length,
      closed: data.issues.filter((i) => i.state === 'closed').length,
    };
  }, [data]);

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
              {liveIssueUpdates.size > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🔴 {liveIssueUpdates.size} live issue updates
                  </Text>
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', marginBottom: 8, display: 'block' }}>
                📊 Issue Statistics
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge status="success" text={`Open: ${stats.open}`} />
                <Badge status="default" text={`Closed: ${stats.closed}`} />
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
                  { value: 'all', label: 'All Issues' },
                  { value: 'open', label: 'Open' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🏷️ Label Filter
              </Text>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Filter by labels"
                value={selectedLabels}
                onChange={setSelectedLabels}
                maxTagCount={2}
                options={Object.values(LABEL_CATEGORIES).map((category) => ({
                  label: category,
                  options: getLabelsByCategory(category).map((label) => ({
                    value: label.name,
                    label: (
                      <Space>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: 2,
                            background: `#${label.color}`,
                          }}
                        />
                        {label.name}
                      </Space>
                    ),
                  })),
                }))}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🔍 Quick Filters
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Tag
                  color="red"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setSelectedLabels(['priority:critical'])}
                >
                  Critical Priority
                </Tag>
                <Tag
                  color="green"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setSelectedLabels(['good-first-issue'])}
                >
                  Good First Issue
                </Tag>
                <Tag
                  color="blue"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setSelectedLabels(['type:bug'])}
                >
                  Bugs
                </Tag>
                <Tag
                  color="purple"
                  style={{ cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  onClick={() => setSelectedLabels(['type:feature'])}
                >
                  Features
                </Tag>
              </Space>
            </div>
          </Space>
        </Sider>

        <Content style={{ padding: '24px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Search
              placeholder="Search issues by title or number"
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
                dataSource={filteredIssues}
                rowKey="number"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} issues`,
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
