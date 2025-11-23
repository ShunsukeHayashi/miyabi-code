import { Layout } from 'antd';

const { Header, Content } = Layout;

export default function AgentsPage() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <h1>🤖 Agents</h1>
      </Header>
      <Content style={{ padding: '24px' }}>
        <p>Agent orchestration page (coming soon)</p>
      </Content>
    </Layout>
  );
}
