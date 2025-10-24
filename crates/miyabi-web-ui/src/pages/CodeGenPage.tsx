/**
 * CodeGenPage - Miyabi Code Generation Interface
 *
 * Web UI for generating code using Claudable (frontend) or GPT-OSS-20B (backend).
 * Provides direct control over Miyabi CodeGen Agent without Claude Code CLI.
 */

import { useState } from 'react';
import {
  Layout,
  Card,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  List,
  Spin,
  Badge,
  Divider,
  Select,
  Menu,
} from 'antd';
import {
  SendOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  DashboardOutlined,
  IssuesCloseOutlined,
  GitlabOutlined,
  BranchesOutlined,
  RocketOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  useGenerateCode,
  useCodeGenHistory,
  isFrontendTask,
  getSuggestedEngine,
  getProviderInfo,
  type GenerateCodeRequest,
  type LlmProvider,
} from '../hooks/useCodeGen';

const { Header, Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CodeGenPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [taskDescription, setTaskDescription] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('gpt-oss');

  // Mutations and queries
  const generateMutation = useGenerateCode();
  const { data: history, isLoading: historyLoading } = useCodeGenHistory();

  // Detect engine
  const isFrontend = isFrontendTask(taskDescription);
  const suggestedEngine = getSuggestedEngine(taskDescription);

  // Handle generate
  const handleGenerate = () => {
    if (!taskDescription.trim()) {
      return;
    }

    const request: GenerateCodeRequest = {
      taskDescription: taskDescription.trim(),
      outputDir: outputDir.trim() || undefined,
      priority: 1,
      llmProvider: llmProvider,
    };

    generateMutation.mutate(request, {
      onSuccess: (response) => {
        console.log('🎨 Code generation started:', response);
        // Optionally clear form
        setTaskDescription('');
        setOutputDir('');
      },
    });
  };

  // Get engine status
  const getEngineStatus = () => {
    if (isFrontend) {
      return (
        <Space>
          <span style={{ fontSize: 20 }}>🎨</span>
          <Text strong style={{ color: '#52c41a' }}>
            Claudable
          </Text>
          <Text type="secondary">(Next.js + shadcn/ui + Tailwind CSS)</Text>
        </Space>
      );
    } else {
      const providerInfo = getProviderInfo(llmProvider);
      return (
        <Space>
          <span style={{ fontSize: 20 }}>{providerInfo.icon}</span>
          <Text strong style={{ color: providerInfo.color }}>
            {providerInfo.name}
          </Text>
          <Text type="secondary">{providerInfo.description}</Text>
        </Space>
      );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Unified Header with Navigation */}
      <Header
        style={{
          background: '#fff',
          padding: '0',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ padding: '0 24px', fontSize: '24px', fontWeight: 'bold', marginRight: '32px' }}>
          🌸 Miyabi WebUI
        </div>
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
            { key: '/codegen', icon: <CodeOutlined />, label: 'CodeGen' },
          ]}
        />
      </Header>

      <Layout>
        {/* Main Content */}
        <Content style={{ padding: '48px', background: '#fafafa' }}>
          <Card
            title={
              <div style={{ fontSize: '28px', fontWeight: 300, color: '#111827', letterSpacing: '-0.02em' }}>
                Code Generation
              </div>
            }
            variant="outlined"
            style={{ marginBottom: 48, border: '1px solid #e5e7eb', boxShadow: 'none' }}
            styles={{ body: { padding: '32px' } }}
          >
            {/* Success Message */}
            {generateMutation.isSuccess && (
              <Alert
                message="Code Generation Started!"
                description={`Task ID: ${generateMutation.data?.id} | Engine: ${generateMutation.data?.engine}`}
                type="success"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Error Message */}
            {generateMutation.isError && (
              <Alert
                message="Generation Failed"
                description={generateMutation.error?.message}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Task Description Input */}
            <Space direction="vertical" style={{ width: '100%' }} size={32}>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}>
                  Task Description
                </div>
                <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: '15px', color: '#6b7280' }}>
                  Describe what you want to build. Frontend tasks will use Claudable,
                  backend tasks will use selected LLM provider.
                </Paragraph>
                <TextArea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="例: 売上ダッシュボードUIを作成（グラフと表を表示）"
                  rows={5}
                  style={{
                    fontSize: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

              {/* Output Directory */}
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}>
                  Output Directory
                  <Text type="secondary" style={{ fontSize: '14px', fontWeight: 400, marginLeft: '8px' }}>
                    (optional)
                  </Text>
                </div>
                <Input
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder="./generated"
                  style={{
                    fontSize: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    height: '42px',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

              {/* LLM Provider Selection */}
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '8px',
                  letterSpacing: '-0.01em'
                }}>
                  LLM Provider
                </div>
                <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: '15px', color: '#6b7280' }}>
                  {isFrontend
                    ? 'Frontend tasks always use Claudable (Next.js generator)'
                    : 'Select the AI model to use for backend code generation'}
                </Paragraph>
                <Select
                  value={llmProvider}
                  onChange={setLlmProvider}
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={isFrontend}
                  size="large"
                  options={[
                    {
                      value: 'gpt-oss',
                      label: (
                        <Space>
                          <span style={{ fontSize: 16 }}>
                            {getProviderInfo('gpt-oss').icon}
                          </span>
                          <span>{getProviderInfo('gpt-oss').name}</span>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            (Default)
                          </Text>
                        </Space>
                      ),
                    },
                    {
                      value: 'claude',
                      label: (
                        <Space>
                          <span style={{ fontSize: 16 }}>
                            {getProviderInfo('claude').icon}
                          </span>
                          <span>{getProviderInfo('claude').name}</span>
                        </Space>
                      ),
                    },
                    {
                      value: 'gpt-4',
                      label: (
                        <Space>
                          <span style={{ fontSize: 16 }}>
                            {getProviderInfo('gpt-4').icon}
                          </span>
                          <span>{getProviderInfo('gpt-4').name}</span>
                        </Space>
                      ),
                    },
                    {
                      value: 'groq',
                      label: (
                        <Space>
                          <span style={{ fontSize: 16 }}>
                            {getProviderInfo('groq').icon}
                          </span>
                          <span>{getProviderInfo('groq').name}</span>
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>

              {/* Engine Detection */}
              {taskDescription && (
                <div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '12px',
                    letterSpacing: '-0.01em'
                  }}>
                    Detected Engine
                  </div>
                  <div style={{
                    padding: '16px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}>
                    {getEngineStatus()}
                  </div>
                </div>
              )}

              <div style={{ height: '1px', background: '#e5e7eb', margin: '24px 0' }} />

              {/* Generate Button */}
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleGenerate}
                loading={generateMutation.isPending}
                disabled={!taskDescription.trim()}
                block
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: '#2563eb',
                  border: 'none',
                  transition: 'all 0.2s',
                }}
              >
                Generate Code
              </Button>
            </Space>
          </Card>

          {/* Examples */}
          <Card
            title={
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>
                Examples
              </div>
            }
            variant="outlined"
            style={{ marginBottom: 48, border: '1px solid #e5e7eb', boxShadow: 'none' }}
            styles={{ body: { padding: '24px' } }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  letterSpacing: '-0.01em'
                }}>
                  Frontend (Claudable)
                </div>
                <ul style={{ margin: 0, paddingLeft: 24, color: '#6b7280', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>売上ダッシュボードUIを作成（グラフと表を表示）</li>
                  <li>Create a landing page with hero section and pricing table</li>
                  <li>Build a Next.js admin panel with shadcn/ui components</li>
                </ul>
              </div>

              <div style={{ height: '1px', background: '#e5e7eb' }} />

              <div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: '12px',
                  letterSpacing: '-0.01em'
                }}>
                  Backend (GPT-OSS-20B)
                </div>
                <ul style={{ margin: 0, paddingLeft: 24, color: '#6b7280', fontSize: '14px', lineHeight: '1.8' }}>
                  <li>ユーザー認証APIを実装（JWT トークン検証）</li>
                  <li>Implement RESTful API for user management in Rust/Axum</li>
                  <li>Add database migration for PostgreSQL with sqlx</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Content>

        {/* History Sidebar */}
        <Sider
          width={380}
          style={{
            background: '#fff',
            padding: '24px',
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          <div style={{
            marginBottom: 16,
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <HistoryOutlined style={{ fontSize: '18px' }} />
            Generation History
          </div>

          <div style={{ height: '1px', background: '#e5e7eb', margin: '16px 0' }} />

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                Loading history...
              </div>
            </div>
          ) : history && history.length > 0 ? (
            <List
              size="small"
              dataSource={history}
              renderItem={(item) => (
                <List.Item style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                }}>
                  <List.Item.Meta
                    title={
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#111827',
                        marginBottom: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.taskDescription}
                      </div>
                    }
                    description={
                      <Space size={6}>
                        <Tag
                          color={item.isFrontend ? 'green' : 'blue'}
                          style={{ fontSize: '11px', margin: 0 }}
                        >
                          {item.engine}
                        </Tag>
                        <Tag color="default" style={{ fontSize: '11px', margin: 0 }}>
                          {item.status}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#9ca3af',
              fontSize: '14px'
            }}>
              <HistoryOutlined style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
              No history yet
            </div>
          )}
        </Sider>
      </Layout>
    </Layout>
  );
}
