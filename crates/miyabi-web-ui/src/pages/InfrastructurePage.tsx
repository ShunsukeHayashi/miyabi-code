import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Button, Spin, Alert, Typography, Descriptions } from 'antd';
import { ReloadOutlined, DatabaseOutlined, CloudServerOutlined, RocketOutlined, ContainerOutlined } from '@ant-design/icons';
import { infrastructureApi } from '../api/client';
import type { InfrastructureStatus, DatabaseStatus, DeploymentStatus } from '../api/client';

const { Title } = Typography;

export default function InfrastructurePage() {
  const [infraStatus, setInfraStatus] = useState<InfrastructureStatus | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [deployStatus, setDeployStatus] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [infra, db, deploy] = await Promise.all([
        infrastructureApi.getStatus(),
        infrastructureApi.getDatabaseStatus(),
        infrastructureApi.getDeploymentStatus(),
      ]);
      setInfraStatus(infra.data);
      setDbStatus(db.data);
      setDeployStatus(deploy.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch infrastructure data');
      console.error('Error fetching infrastructure data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: string) => {
    if (health === 'healthy') return 'green';
    if (health === 'unhealthy') return 'red';
    return 'default';
  };

  const getStageColor = (status: string) => {
    if (status === 'completed') return 'green';
    if (status === 'in_progress') return 'blue';
    if (status === 'failed') return 'red';
    return 'default';
  };

  if (loading && !infraStatus) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading infrastructure status..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Infrastructure Data"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchData} type="primary">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Infrastructure Status</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Docker Containers"
              value={infraStatus?.docker_containers.length || 0}
              prefix={<ContainerOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="ECR Repositories"
              value={infraStatus?.ecr_repositories.length || 0}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Database Tables"
              value={dbStatus?.total_tables || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Services"
              value={infraStatus?.services.filter(s => s.status === 'running').length || 0}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Docker Containers */}
      <Card
        title={`Docker Containers (${infraStatus?.docker_containers.length || 0})`}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {infraStatus?.docker_containers.map((container) => (
            <Col key={container.name} xs={24} sm={12} lg={8}>
              <Card size="small" type="inner">
                <div style={{ marginBottom: '8px' }}>
                  <strong>{container.name}</strong>
                  <Tag color={getHealthColor(container.health)} style={{ float: 'right' }}>
                    {container.health}
                  </Tag>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>{container.status}</div>
                {container.ports.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {container.ports.map((port, idx) => (
                      <Tag key={idx} style={{ fontSize: '11px' }}>{port}</Tag>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Database Status */}
      <Card
        title={`Database: ${dbStatus?.database_name || 'N/A'}`}
        extra={
          <Tag color={dbStatus?.connected ? 'green' : 'red'}>
            {dbStatus?.connected ? 'Connected' : 'Disconnected'}
          </Tag>
        }
        style={{ marginBottom: '24px' }}
      >
        <Descriptions bordered column={3} size="small">
          <Descriptions.Item label="Active Connections">
            {dbStatus?.connection_pool.active_connections || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Idle Connections">
            {dbStatus?.connection_pool.idle_connections || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Max Connections">
            {dbStatus?.connection_pool.max_connections || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Total Tables" span={3}>
            {dbStatus?.total_tables || 0} tables
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Deployment Pipeline */}
      <Card
        title={`Deployment Pipeline: ${deployStatus?.pipeline_name || 'N/A'}`}
        extra={
          <Tag color="blue">{deployStatus?.current_stage || 'N/A'}</Tag>
        }
        style={{ marginBottom: '24px' }}
      >
        {deployStatus?.stages.map((stage, idx) => (
          <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Tag color={getStageColor(stage.status)}>{stage.status}</Tag>
                <strong>{stage.name}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {stage.duration_seconds ? `${stage.duration_seconds}s` : ''}
              </div>
            </div>
          </div>
        ))}

        {deployStatus?.last_deployment && (
          <Card size="small" type="inner" title="Last Deployment" style={{ marginTop: '16px' }}>
            <Descriptions size="small" column={2}>
              <Descriptions.Item label="Version">
                {deployStatus.last_deployment.version}
              </Descriptions.Item>
              <Descriptions.Item label="Deployed By">
                {deployStatus.last_deployment.deployed_by}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">{deployStatus.last_deployment.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Deployed At">
                {new Date(deployStatus.last_deployment.deployed_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Card>

      {/* ECR Repositories */}
      {infraStatus?.ecr_repositories && infraStatus.ecr_repositories.length > 0 && (
        <Card title="ECR Repositories">
          {infraStatus.ecr_repositories.map((repo) => (
            <Card key={repo.name} size="small" type="inner" style={{ marginBottom: '12px' }}>
              <Title level={5}>{repo.name}</Title>
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="Images">{repo.image_count}</Descriptions.Item>
                <Descriptions.Item label="Size">{repo.size_mb.toFixed(1)} MB</Descriptions.Item>
                <Descriptions.Item label="Latest Tag">{repo.latest_tag || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Last Push">
                  {repo.pushed_at ? new Date(repo.pushed_at).toLocaleString() : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ))}
        </Card>
      )}
    </div>
  );
}
