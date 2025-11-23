import { Layout, Card, Statistic, Row, Col } from 'antd';
import { IssuesCloseOutlined, RobotOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

export default function Dashboard() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🌸 Miyabi WebUI</h1>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Open Issues"
                value={42}
                prefix={<IssuesCloseOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Running Agents"
                value={5}
                prefix={<RobotOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Merged PRs"
                value={38}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
