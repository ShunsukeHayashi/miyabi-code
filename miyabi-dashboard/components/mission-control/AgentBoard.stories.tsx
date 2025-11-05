import type { Meta, StoryObj } from '@storybook/react';
import AgentBoard from './AgentBoard';
import { mockAgents, Agent } from '@/lib/mockData';

const meta = {
  title: 'Mission Control/AgentBoard',
  component: AgentBoard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    agents: {
      description: 'Array of agent objects to display',
    },
  },
} satisfies Meta<typeof AgentBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all mock agents
export const Default: Story = {
  args: {
    agents: mockAgents,
  },
};

// Only active agents
export const ActiveOnly: Story = {
  args: {
    agents: mockAgents.filter((agent) => agent.status === 'active'),
  },
};

// Only coding agents
export const CodingAgentsOnly: Story = {
  args: {
    agents: mockAgents.filter((agent) => agent.type === 'coding'),
  },
};

// Only business agents
export const BusinessAgentsOnly: Story = {
  args: {
    agents: mockAgents.filter((agent) => agent.type === 'business'),
  },
};

// Empty state
export const Empty: Story = {
  args: {
    agents: [],
  },
};

// Single agent
export const SingleAgent: Story = {
  args: {
    agents: [mockAgents[0]],
  },
};

// Many agents (stress test)
const manyAgents: Agent[] = Array.from({ length: 20 }, (_, i) => ({
  id: `agent-${i}`,
  name: `Agent ${i + 1}`,
  type: i % 2 === 0 ? 'coding' : 'business',
  status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'idle' : 'offline',
  currentTask: i % 2 === 0 ? `Task ${i + 1}` : undefined,
  tasksCompleted: Math.floor(Math.random() * 200),
}));

export const ManyAgents: Story = {
  args: {
    agents: manyAgents,
  },
};

// All idle agents
export const AllIdle: Story = {
  args: {
    agents: mockAgents.map((agent) => ({ ...agent, status: 'idle' as const })),
  },
};

// All offline agents
export const AllOffline: Story = {
  args: {
    agents: mockAgents.map((agent) => ({ ...agent, status: 'offline' as const })),
  },
};
