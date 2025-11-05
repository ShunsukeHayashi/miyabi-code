import type { Meta, StoryObj } from '@storybook/react';
import Timeline from './Timeline';
import { mockTimelineEvents, TimelineEvent } from '@/lib/mockData';

const meta = {
  title: 'Mission Control/Timeline',
  component: Timeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    events: {
      description: 'Array of timeline event objects to display',
    },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all mock events
export const Default: Story = {
  args: {
    events: mockTimelineEvents,
  },
};

// Only success events
export const SuccessOnly: Story = {
  args: {
    events: mockTimelineEvents.filter((event) => event.type === 'success'),
  },
};

// Only errors
export const ErrorsOnly: Story = {
  args: {
    events: mockTimelineEvents.filter((event) => event.type === 'error'),
  },
};

// Only warnings
export const WarningsOnly: Story = {
  args: {
    events: mockTimelineEvents.filter((event) => event.type === 'warning'),
  },
};

// Only info
export const InfoOnly: Story = {
  args: {
    events: mockTimelineEvents.filter((event) => event.type === 'info'),
  },
};

// Empty state
export const Empty: Story = {
  args: {
    events: [],
  },
};

// Single event
export const SingleEvent: Story = {
  args: {
    events: [mockTimelineEvents[0]],
  },
};

// Many events (stress test - scrollable)
const manyEvents: TimelineEvent[] = Array.from({ length: 50 }, (_, i) => ({
  id: `event-${i}`,
  timestamp: new Date(Date.now() - i * 120000).toISOString(), // 2 min intervals
  type: ['success', 'info', 'warning', 'error'][i % 4] as TimelineEvent['type'],
  agent: i % 2 === 0 ? ['CoordinatorAgent', 'CodeGenAgent', 'ReviewAgent'][i % 3] : undefined,
  message: `Event ${i + 1}: ${
    i % 4 === 0
      ? 'Task completed successfully'
      : i % 4 === 1
        ? 'Processing ongoing'
        : i % 4 === 2
          ? 'Warning: Resource constraint detected'
          : 'Error: Failed to execute command'
  }`,
}));

export const ManyEvents: Story = {
  args: {
    events: manyEvents,
  },
};

// Critical alerts (errors and warnings only)
export const CriticalAlerts: Story = {
  args: {
    events: mockTimelineEvents.filter(
      (event) => event.type === 'error' || event.type === 'warning'
    ),
  },
};

// Events from specific agent
export const CoordinatorAgentOnly: Story = {
  args: {
    events: mockTimelineEvents.filter((event) => event.agent === 'CoordinatorAgent'),
  },
};

// Recent events (last 5 minutes)
const recentEvents: TimelineEvent[] = Array.from({ length: 10 }, (_, i) => ({
  id: `recent-${i}`,
  timestamp: new Date(Date.now() - i * 30000).toISOString(), // 30 sec intervals
  type: ['success', 'info'][i % 2] as TimelineEvent['type'],
  agent: ['CoordinatorAgent', 'CodeGenAgent'][i % 2],
  message: `Recent activity ${i + 1}`,
}));

export const RecentActivity: Story = {
  args: {
    events: recentEvents,
  },
};

// Mixed severity events
const mixedEvents: TimelineEvent[] = [
  {
    id: 'mix-1',
    timestamp: new Date(Date.now() - 1000).toISOString(),
    type: 'error',
    agent: 'DeploymentAgent',
    message: 'Deployment failed: Connection timeout',
  },
  {
    id: 'mix-2',
    timestamp: new Date(Date.now() - 2000).toISOString(),
    type: 'warning',
    agent: 'ReviewAgent',
    message: 'Code quality threshold not met',
  },
  {
    id: 'mix-3',
    timestamp: new Date(Date.now() - 3000).toISOString(),
    type: 'success',
    agent: 'CodeGenAgent',
    message: 'Code generation completed',
  },
  {
    id: 'mix-4',
    timestamp: new Date(Date.now() - 4000).toISOString(),
    type: 'info',
    agent: 'IssueAgent',
    message: 'Issue analysis in progress',
  },
];

export const MixedSeverity: Story = {
  args: {
    events: mixedEvents,
  },
};
