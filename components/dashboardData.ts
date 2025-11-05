export type AgentStatus = 'idle' | 'active' | 'working'

export interface AgentTask {
  id: string
  title: string
  progress: number
  summary: string
  startedAt: string
  etaMinutes?: number
}

export interface Agent {
  id: string
  codename: string
  displayName: string
  status: AgentStatus
  utilization: number
  currentTask?: AgentTask
  queue: AgentTask[]
  capabilities: string[]
  lastUpdated: string
}

export type PaneState = 'focused' | 'active' | 'idle'

export interface TmuxLogEntry {
  id: string
  message: string
  timestamp: string
  type: 'info' | 'warning' | 'error'
}

export interface TmuxPane {
  id: string
  index: number
  title: string
  agentId: string
  state: PaneState
  lastCommand?: string
  recentLogs: TmuxLogEntry[]
}

export interface TmuxWindow {
  id: string
  name: string
  layout: 'tiled' | 'even-horizontal' | 'even-vertical' | 'main-vertical'
  panes: TmuxPane[]
}

export interface TmuxSession {
  id: string
  name: string
  startedAt: string
  windows: TmuxWindow[]
}

export const mockAgents: Agent[] = [
  {
    id: 'agent-0',
    codename: 'CoordinatorAgent',
    displayName: 'Coordinator Agent',
    status: 'working',
    utilization: 0.92,
    currentTask: {
      id: 'task-0',
      title: 'Issue #758: Mission Control orchestration',
      progress: 68,
      summary: 'Assigning CodeGen and Review lanes for Mission Control dashboard',
      startedAt: '2025-11-05T07:45:00Z',
      etaMinutes: 24,
    },
    queue: [
      {
        id: 'task-1',
        title: 'Prepare review package',
        progress: 15,
        summary: 'Collate diffs for ReviewAgent once components land',
        startedAt: '2025-11-05T07:55:00Z',
      },
    ],
    capabilities: ['Task orchestration', 'Worktree sync', 'Timeline tracking'],
    lastUpdated: '2025-11-05T08:05:32Z',
  },
  {
    id: 'agent-1',
    codename: 'CodeGenAgent',
    displayName: 'Sakura (CodeGen)',
    status: 'working',
    utilization: 0.87,
    currentTask: {
      id: 'task-2',
      title: 'Implement AgentBoard + TMAXLView',
      progress: 42,
      summary: 'Building interactive Mission Control components',
      startedAt: '2025-11-05T08:10:00Z',
      etaMinutes: 32,
    },
    queue: [
      {
        id: 'task-3',
        title: 'Wire mock data to state management',
        progress: 0,
        summary: 'Connect dashboard data to tmux visualization',
        startedAt: '2025-11-05T08:40:00Z',
      },
    ],
    capabilities: ['React components', 'TypeScript', 'Tailwind UI'],
    lastUpdated: '2025-11-05T08:18:11Z',
  },
  {
    id: 'agent-2',
    codename: 'ReviewAgent',
    displayName: 'Kaede (Review)',
    status: 'active',
    utilization: 0.54,
    queue: [
      {
        id: 'task-4',
        title: 'QA Mission Control UI',
        progress: 0,
        summary: 'Validate new components against design tokens',
        startedAt: '2025-11-05T08:55:00Z',
      },
    ],
    capabilities: ['Code review automation', 'UI regression checks'],
    lastUpdated: '2025-11-05T08:00:00Z',
  },
  {
    id: 'agent-3',
    codename: 'DeploymentAgent',
    displayName: 'Botan (Deployment)',
    status: 'idle',
    utilization: 0.12,
    queue: [],
    capabilities: ['CI pipeline', 'Release orchestration'],
    lastUpdated: '2025-11-05T07:45:00Z',
  },
  {
    id: 'agent-4',
    codename: 'PRAgent',
    displayName: 'Tsubaki (PR)',
    status: 'active',
    utilization: 0.36,
    queue: [
      {
        id: 'task-5',
        title: 'Draft PR summary',
        progress: 0,
        summary: 'Prepare summary for Issue #758 once diff ready',
        startedAt: '2025-11-05T09:10:00Z',
      },
    ],
    capabilities: ['Pull request automation', 'Merge conflict detection'],
    lastUpdated: '2025-11-05T08:12:47Z',
  },
  {
    id: 'agent-5',
    codename: 'RefresherAgent',
    displayName: 'Hibari (Refresher)',
    status: 'idle',
    utilization: 0.08,
    queue: [
      {
        id: 'task-6',
        title: 'Refresh documentation cache',
        progress: 0,
        summary: 'Sync new component docs into knowledge base',
        startedAt: '2025-11-05T10:00:00Z',
      },
    ],
    capabilities: ['Knowledge sync', 'Documentation refresh'],
    lastUpdated: '2025-11-05T07:58:00Z',
  },
]

export const mockTmuxSession: TmuxSession = {
  id: 'session-0',
  name: 'miyabi-orchestra',
  startedAt: '2025-11-05T07:20:00Z',
  windows: [
    {
      id: 'window-0',
      name: 'Coding Ensemble',
      layout: 'tiled',
      panes: [
        {
          id: 'pane-0',
          index: 0,
          title: 'Conductor',
          agentId: 'agent-0',
          state: 'focused',
          lastCommand: 'miyabi status --watch',
          recentLogs: [
            {
              id: 'log-0',
              message: 'Heartbeat OK · Coordinating 5 active tasks',
              timestamp: '2025-11-05T08:18:11Z',
              type: 'info',
            },
          ],
        },
        {
          id: 'pane-1',
          index: 1,
          title: 'Kaede',
          agentId: 'agent-2',
          state: 'active',
          lastCommand: 'next lint --max-warnings=0',
          recentLogs: [
            {
              id: 'log-1',
              message: 'Next.js baseline lint clean · ready for component wiring',
              timestamp: '2025-11-05T08:05:00Z',
              type: 'info',
            },
          ],
        },
        {
          id: 'pane-2',
          index: 2,
          title: 'Sakura',
          agentId: 'agent-1',
          state: 'active',
          lastCommand: 'npm run dev -- turbo',
          recentLogs: [
            {
              id: 'log-2',
              message: 'Dev server stable · awaiting AgentBoard mount',
              timestamp: '2025-11-05T08:14:22Z',
              type: 'info',
            },
          ],
        },
        {
          id: 'pane-3',
          index: 3,
          title: 'Botan',
          agentId: 'agent-3',
          state: 'idle',
          recentLogs: [
            {
              id: 'log-3',
              message: 'Deployment pipeline on standby',
              timestamp: '2025-11-05T07:50:00Z',
              type: 'info',
            },
          ],
        },
      ],
    },
    {
      id: 'window-1',
      name: 'Observability',
      layout: 'even-horizontal',
      panes: [
        {
          id: 'pane-4',
          index: 0,
          title: 'Metrics',
          agentId: 'agent-4',
          state: 'idle',
          recentLogs: [
            {
              id: 'log-4',
              message: 'Waiting for deployment to publish metrics',
              timestamp: '2025-11-05T07:40:00Z',
              type: 'info',
            },
          ],
        },
        {
          id: 'pane-5',
          index: 1,
          title: 'Knowledge Sync',
          agentId: 'agent-5',
          state: 'idle',
          lastCommand: 'miyabi knowledge search "Mission Control"',
          recentLogs: [
            {
              id: 'log-5',
              message: 'Knowledge cache warm · 118 entries ready',
              timestamp: '2025-11-05T07:35:15Z',
              type: 'info',
            },
          ],
        },
      ],
    },
  ],
}

export interface IssueSummary {
  number: number
  title: string
  state: 'open' | 'closed'
  labels: string[]
  url: string
}

export const mockIssues: IssueSummary[] = [
  {
    number: 758,
    title: 'Mission Control UI shell',
    state: 'open',
    labels: ['✨ type:feature', '⚙️ agent:CodeGen'],
    url: 'https://github.com/ShunsukeHayashi/Miyabi/issues/758',
  },
  {
    number: 741,
    title: 'Tmux monitoring pipeline',
    state: 'open',
    labels: ['🧪 phase:integration'],
    url: 'https://github.com/ShunsukeHayashi/Miyabi/issues/741',
  },
]
