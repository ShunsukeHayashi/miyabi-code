import type { Meta, StoryObj } from '@storybook/react';
import LogViewer from './LogViewer';

const meta = {
  title: 'Mission Control/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock log data
const mockLogs = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    level: 'INFO' as const,
    agent_type: 'CoordinatorAgent',
    message: 'Starting agent execution for Issue #270',
    session_id: 'exec-001',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() + 1000).toISOString(),
    level: 'DEBUG' as const,
    agent_type: 'CodeGenAgent',
    message: 'Analyzing issue requirements...',
    context: 'Execution: exec-001',
    session_id: 'exec-001',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() + 2000).toISOString(),
    level: 'INFO' as const,
    agent_type: 'CodeGenAgent',
    message: 'Generated 3 files: agent.rs, handler.rs, tests.rs',
    session_id: 'exec-001',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() + 3000).toISOString(),
    level: 'WARN' as const,
    agent_type: 'ReviewAgent',
    message: 'Found 2 clippy warnings in agent.rs',
    file: 'crates/miyabi-agents/src/agent.rs',
    line: 42,
    session_id: 'exec-001',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() + 4000).toISOString(),
    level: 'ERROR' as const,
    agent_type: 'ReviewAgent',
    message: 'Compilation failed: missing trait implementation',
    file: 'crates/miyabi-agents/src/agent.rs',
    line: 67,
    session_id: 'exec-001',
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() + 5000).toISOString(),
    level: 'INFO' as const,
    agent_type: 'PRAgent',
    message: 'Created Pull Request #271',
    context: 'PR URL: https://github.com/owner/repo/pull/271',
    issue_number: 270,
    session_id: 'exec-001',
  },
];

// Generate more logs for scrolling test
const generateManyLogs = (count: number) => {
  const agents = ['CoordinatorAgent', 'CodeGenAgent', 'ReviewAgent', 'PRAgent', 'DeploymentAgent'];
  const levels: Array<'DEBUG' | 'INFO' | 'WARN' | 'ERROR'> = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const messages = [
    'Processing task',
    'Analyzing code',
    'Running tests',
    'Building project',
    'Deploying changes',
    'Checking status',
    'Updating database',
    'Sending notification',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() + i * 100).toISOString(),
    level: levels[i % levels.length],
    agent_type: agents[i % agents.length],
    message: `${messages[i % messages.length]} #${i}`,
    session_id: 'exec-001',
  }));
};

export const Default: Story = {
  args: {
    initialLogs: mockLogs,
    height: 600,
    maxLogs: 1000,
  },
};

export const Empty: Story = {
  args: {
    initialLogs: [],
    height: 400,
  },
};

export const ManyLogs: Story = {
  args: {
    initialLogs: generateManyLogs(500),
    height: 600,
    maxLogs: 1000,
  },
};

export const ErrorsOnly: Story = {
  args: {
    initialLogs: mockLogs.filter((log) => log.level === 'ERROR'),
    height: 400,
  },
};

export const SingleAgent: Story = {
  args: {
    initialLogs: mockLogs.filter((log) => log.agent_type === 'CodeGenAgent'),
    height: 400,
  },
};

export const CustomHeight: Story = {
  args: {
    initialLogs: mockLogs,
    height: 800,
  },
};

export const LimitedLogs: Story = {
  args: {
    initialLogs: generateManyLogs(50),
    height: 600,
    maxLogs: 20,
  },
};
