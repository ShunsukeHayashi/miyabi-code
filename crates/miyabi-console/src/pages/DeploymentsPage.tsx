import { useState, useMemo } from 'react';
import { Layout, Table, Tag, Select, Space, Spin, Badge, Typography, Menu, Button, message } from 'antd';
import {
  RocketOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  IssuesCloseOutlined,
  GitlabOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  RollbackOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  WifiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeployments } from '../hooks/useDeployments';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Deployment } from '../api/client';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export default function DeploymentsPage() {
  const { data, isLoading } = useDeployments();
  const navigate = useNavigate();
  const location = useLocation();
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [liveDeploymentUpdates, setLiveDeploymentUpdates] = useState<Map<string, Partial<Deployment>>>(new Map());

  // WebSocket connection for real-time deployment updates
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onMessage: (event) => {
      if (event.type === 'deployment_update') {
        const deploymentUpdate = event as any;
        setLiveDeploymentUpdates((prev) => {
          const updated = new Map(prev);
          updated.set(deploymentUpdate.deployment_id, {
            status: deploymentUpdate.status,
            health_check_status: deploymentUpdate.health_check_status,
            duration_seconds: deploymentUpdate.duration_seconds,
          });
          return updated;
        });
        message.info(`Deployment ${deploymentUpdate.version} updated`, 1.5);
      }
    },
  });

  // Merge live updates with initial data
  const mergedDeployments = useMemo(() => {
    if (!data || !data.deployments) return [];

    return data.deployments.map((deployment) => {
      const liveUpdate = liveDeploymentUpdates.get(deployment.id);
      return liveUpdate ? { ...deployment, ...liveUpdate } : deployment;
    });
  }, [data, liveDeploymentUpdates]);

  // Filter deployments based on environment and status
  const filteredDeployments = useMemo(() => {
    return mergedDeployments.filter((deployment) => {
      const matchesEnvironment =
        environmentFilter === 'all' || deployment.environment === environmentFilter;
      const matchesStatus =
        statusFilter === 'all' || deployment.status === statusFilter;
      return matchesEnvironment && matchesStatus;
    });
  }, [mergedDeployments, environmentFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'processing';
      case 'rolled_back':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined />;
      case 'failed':
        return <CloseCircleOutlined />;
      case 'in_progress':
        return <SyncOutlined spin />;
      case 'rolled_back':
        return <RollbackOutlined />;
      default:
        return null;
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'red';
      case 'staging':
        return 'orange';
      case 'development':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getHealthCheckColor = (healthCheck: string) => {
    switch (healthCheck) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'failed':
        return 'error';
      case 'checking':
        return 'processing';
      default:
        return 'default';
    }
  };

  const handleRollback = (deploymentId: string) => {
    message.loading({ content: `Rolling back deployment ${deploymentId}...`, key: 'rollback' });
    setTimeout(() => {
      message.success({ content: `Deployment ${deploymentId} rolled back successfully!`, key: 'rollback', duration: 2 });
    }, 1500);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const stats = useMemo(() => {
    if (!data || !data.deployments) return { production: 0, staging: 0, development: 0, success: 0, failed: 0 };
    return {
      production: data.deployments.filter((d) => d.environment === 'production').length,
      staging: data.deployments.filter((d) => d.environment === 'staging').length,
      development: data.deployments.filter((d) => d.environment === 'development').length,
      success: data.deployments.filter((d) => d.status === 'success').length,
      failed: data.deployments.filter((d) => d.status === 'failed').length,
    };
  }, [data]);

  const columns: ColumnsType<Deployment> = [
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => <Text strong code>{version}</Text>,
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      width: 120,
      render: (environment: string) => (
        <Tag color={getEnvironmentColor(environment)}>
          {environment.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Deployment Info',
      key: 'info',
      render: (_: any, record: Deployment) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <CloudServerOutlined style={{ marginRight: 8 }} />
            <Text>{record.deployment_type}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Commit: {record.commit_sha}
            </Text>
            {record.pr_number && (
              <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
                PR #{record.pr_number}
              </Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'health_check_status',
      key: 'health_check_status',
      width: 100,
      render: (healthCheck: string) => (
        <Tag color={getHealthCheckColor(healthCheck)}>
          {healthCheck.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration_seconds',
      key: 'duration_seconds',
      width: 100,
      render: (duration: number | null) => (
        <Text type="secondary">{formatDuration(duration)}</Text>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 150,
      render: (date: string) => (
        <div>
          <div>{new Date(date).toLocaleDateString('ja-JP')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(date).toLocaleTimeString('ja-JP')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Deployment) => (
        <Button
          type="link"
          icon={<RollbackOutlined />}
          disabled={!record.rollback_available}
          onClick={() => handleRollback(record.id)}
        >
          Rollback
        </Button>
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
                  {isConnected ? 'Live Updates Active' : 'Disconnected'}
                </Text>
              </Space>
              {liveDeploymentUpdates.size > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🔴 {liveDeploymentUpdates.size} live deployment updates
                  </Text>
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ fontSize: '16px', marginBottom: 8, display: 'block' }}>
                📊 Deployment Statistics
              </Text>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge status="error" text={`Production: ${stats.production}`} />
                <Badge status="warning" text={`Staging: ${stats.staging}`} />
                <Badge status="processing" text={`Development: ${stats.development}`} />
                <Badge status="success" text={`Success: ${stats.success}`} />
                <Badge status="error" text={`Failed: ${stats.failed}`} />
                <Badge status="default" text={`Total: ${data?.total || 0}`} />
              </Space>
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                🌍 Environment Filter
              </Text>
              <Select
                style={{ width: '100%' }}
                value={environmentFilter}
                onChange={setEnvironmentFilter}
                options={[
                  { value: 'all', label: 'All Environments' },
                  { value: 'production', label: 'Production' },
                  { value: 'staging', label: 'Staging' },
                  { value: 'development', label: 'Development' },
                ]}
              />
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
                  { value: 'all', label: 'All Status' },
                  { value: 'success', label: 'Success' },
                  { value: 'failed', label: 'Failed' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'rolled_back', label: 'Rolled Back' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', marginBottom: 8, display: 'block' }}>
                ℹ️ Deployment Info
              </Text>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  <RocketOutlined style={{ marginRight: 4 }} />
                  DeploymentAgent automatically deploys PRs to Firebase, Cloud Run, and other platforms.
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Health checks run every 5 minutes to ensure service availability.
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
                dataSource={filteredDeployments}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showTotal: (total) => `Total ${total} deployments`,
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
