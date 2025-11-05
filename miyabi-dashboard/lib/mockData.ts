// Mock data for Mission Control Dashboard

export interface Agent {
  id: string;
  name: string;
  type: 'coding' | 'business';
  status: 'active' | 'idle' | 'offline';
  currentTask?: string;
  tasksCompleted: number;
}

export interface TmuxSession {
  id: string;
  name: string;
  windows: number;
  panes: number;
  attached: boolean;
  created: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  agent?: string;
  message: string;
}

export interface Reference {
  id: string;
  title: string;
  category: 'docs' | 'guide' | 'api';
  url: string;
}

export const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'CoordinatorAgent',
    type: 'coding',
    status: 'active',
    currentTask: 'Issue #758 - Task Decomposition',
    tasksCompleted: 142
  },
  {
    id: '2',
    name: 'CodeGenAgent',
    type: 'coding',
    status: 'active',
    currentTask: 'Issue #758 - Implementation',
    tasksCompleted: 89
  },
  {
    id: '3',
    name: 'ReviewAgent',
    type: 'coding',
    status: 'idle',
    tasksCompleted: 67
  },
  {
    id: '4',
    name: 'DeploymentAgent',
    type: 'coding',
    status: 'idle',
    tasksCompleted: 34
  },
  {
    id: '5',
    name: 'MarketingAgent',
    type: 'business',
    status: 'active',
    currentTask: 'Social Media Campaign',
    tasksCompleted: 23
  },
  {
    id: '6',
    name: 'SalesAgent',
    type: 'business',
    status: 'offline',
    tasksCompleted: 15
  }
];

export const mockTmuxSessions: TmuxSession[] = [
  {
    id: '1',
    name: 'miyabi-refactor',
    windows: 2,
    panes: 12,
    attached: true,
    created: '2025-11-05T03:56:00Z'
  },
  {
    id: '2',
    name: 'miyabi-demo',
    windows: 1,
    panes: 5,
    attached: false,
    created: '2025-11-05T11:48:49Z'
  },
  {
    id: '3',
    name: 'coding-ensemble',
    windows: 1,
    panes: 5,
    attached: false,
    created: '2025-11-04T21:19:00Z'
  }
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    timestamp: '2025-11-05T04:02:49Z',
    type: 'success',
    agent: 'IssueAgent',
    message: 'Issue #758 analysis completed'
  },
  {
    id: '2',
    timestamp: '2025-11-05T04:02:39Z',
    type: 'info',
    agent: 'CoordinatorAgent',
    message: 'Task decomposition completed for Issue #758'
  },
  {
    id: '3',
    timestamp: '2025-11-05T04:00:00Z',
    type: 'warning',
    agent: 'CodeGenAgent',
    message: 'LLM generation timeout - falling back to manual mode'
  },
  {
    id: '4',
    timestamp: '2025-11-05T03:58:03Z',
    type: 'success',
    agent: 'CoordinatorAgent',
    message: 'Plans.md generated successfully'
  },
  {
    id: '5',
    timestamp: '2025-11-05T03:56:00Z',
    type: 'error',
    agent: 'System',
    message: 'ANTHROPIC_API_KEY not set - using GPT-OSS fallback'
  }
];

export const mockReferences: Reference[] = [
  {
    id: '1',
    title: 'Entity-Relation Model',
    category: 'docs',
    url: '/docs/ENTITY_RELATION_MODEL.md'
  },
  {
    id: '2',
    title: 'Label System Guide',
    category: 'docs',
    url: '/docs/LABEL_SYSTEM_GUIDE.md'
  },
  {
    id: '3',
    title: 'Agent Specifications',
    category: 'guide',
    url: '/.claude/agents/specs/'
  },
  {
    id: '4',
    title: 'MCP Integration Protocol',
    category: 'guide',
    url: '/.claude/MCP_INTEGRATION_PROTOCOL.md'
  },
  {
    id: '5',
    title: 'GitHub API',
    category: 'api',
    url: 'https://docs.github.com/rest'
  },
  {
    id: '6',
    title: 'Miyabi CLI Reference',
    category: 'api',
    url: '/docs/CLI_REFERENCE.md'
  }
];
