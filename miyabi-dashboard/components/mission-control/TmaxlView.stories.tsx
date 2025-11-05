import type { Meta, StoryObj } from '@storybook/react';
import TmaxlView from './TmaxlView';
import { mockTmuxSessions, TmuxSession } from '@/lib/mockData';

const meta = {
  title: 'Mission Control/TmaxlView',
  component: TmaxlView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    sessions: {
      description: 'Array of tmux session objects to display',
    },
  },
} satisfies Meta<typeof TmaxlView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all mock sessions
export const Default: Story = {
  args: {
    sessions: mockTmuxSessions,
  },
};

// Only attached sessions
export const AttachedOnly: Story = {
  args: {
    sessions: mockTmuxSessions.filter((session) => session.attached),
  },
};

// Only detached sessions
export const DetachedOnly: Story = {
  args: {
    sessions: mockTmuxSessions.filter((session) => !session.attached),
  },
};

// Empty state
export const Empty: Story = {
  args: {
    sessions: [],
  },
};

// Single session
export const SingleSession: Story = {
  args: {
    sessions: [mockTmuxSessions[0]],
  },
};

// Many sessions (stress test)
const manySessions: TmuxSession[] = Array.from({ length: 15 }, (_, i) => ({
  id: `session-${i}`,
  name: `miyabi-${i % 3 === 0 ? 'refactor' : i % 3 === 1 ? 'demo' : 'dev'}-${i}`,
  windows: Math.floor(Math.random() * 5) + 1,
  panes: Math.floor(Math.random() * 20) + 1,
  attached: i % 4 === 0,
  created: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
}));

export const ManySessions: Story = {
  args: {
    sessions: manySessions,
  },
};

// Large session (many panes and windows)
export const LargeSession: Story = {
  args: {
    sessions: [
      {
        id: 'large-1',
        name: 'miyabi-orchestra-7pane',
        windows: 3,
        panes: 42,
        attached: true,
        created: new Date().toISOString(),
      },
    ],
  },
};

// Multiple attached sessions
export const MultipleAttached: Story = {
  args: {
    sessions: mockTmuxSessions.map((session) => ({
      ...session,
      attached: true,
    })),
  },
};

// Recent sessions (created within last hour)
const recentSessions: TmuxSession[] = Array.from({ length: 5 }, (_, i) => ({
  id: `recent-${i}`,
  name: `miyabi-task-${i}`,
  windows: 1,
  panes: 5,
  attached: i === 0,
  created: new Date(Date.now() - i * 600000).toISOString(), // 10 min intervals
}));

export const RecentSessions: Story = {
  args: {
    sessions: recentSessions,
  },
};
