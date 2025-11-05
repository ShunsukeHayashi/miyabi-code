/**
 * Test Data Generators for Mission Control Dashboard
 *
 * Provides utilities to generate mock data for testing and Storybook stories.
 * All generators use configurable parameters and realistic data patterns.
 */

import { Agent, TmuxSession, TimelineEvent, Reference } from './mockData';

// ============================================================================
// Agent Generators
// ============================================================================

export interface AgentGeneratorOptions {
  count?: number;
  type?: 'coding' | 'business' | 'mixed';
  status?: Agent['status'] | 'mixed';
  withTasks?: boolean;
}

/**
 * Generate an array of Agent objects
 * @param options - Configuration options for agent generation
 * @returns Array of Agent objects
 */
export function generateAgents(options: AgentGeneratorOptions = {}): Agent[] {
  const {
    count = 6,
    type = 'mixed',
    status = 'mixed',
    withTasks = true,
  } = options;

  const codingAgentNames = [
    'CoordinatorAgent',
    'CodeGenAgent',
    'ReviewAgent',
    'DeploymentAgent',
    'IssueAgent',
    'PRAgent',
    'RefresherAgent',
  ];

  const businessAgentNames = [
    'MarketingAgent',
    'SalesAgent',
    'AnalyticsAgent',
    'ContentAgent',
    'ProductAgent',
    'StrategyAgent',
  ];

  const tasks = [
    'Processing Issue #758',
    'Code generation in progress',
    'Running tests',
    'Deploying to staging',
    'Market research analysis',
    'Content creation',
    'Performance optimization',
    'Security audit',
  ];

  const agents: Agent[] = [];

  for (let i = 0; i < count; i++) {
    const agentType =
      type === 'mixed'
        ? i % 2 === 0
          ? 'coding'
          : 'business'
        : type;

    const agentNames = agentType === 'coding' ? codingAgentNames : businessAgentNames;
    const agentName = agentNames[i % agentNames.length];

    const agentStatus =
      status === 'mixed'
        ? (['active', 'idle', 'offline'] as const)[i % 3]
        : status;

    const hasCurrentTask = withTasks && agentStatus === 'active' && Math.random() > 0.3;

    agents.push({
      id: `agent-${i}`,
      name: agentName,
      type: agentType,
      status: agentStatus,
      currentTask: hasCurrentTask ? tasks[i % tasks.length] : undefined,
      tasksCompleted: Math.floor(Math.random() * 200),
    });
  }

  return agents;
}

/**
 * Generate a single Agent object
 * @param overrides - Partial agent object to override defaults
 * @returns Single Agent object
 */
export function generateAgent(overrides: Partial<Agent> = {}): Agent {
  const defaultAgent = generateAgents({ count: 1 })[0];
  return { ...defaultAgent, ...overrides };
}

// ============================================================================
// Tmux Session Generators
// ============================================================================

export interface TmuxSessionGeneratorOptions {
  count?: number;
  attached?: boolean | 'mixed';
  minPanes?: number;
  maxPanes?: number;
  minWindows?: number;
  maxWindows?: number;
}

/**
 * Generate an array of TmuxSession objects
 * @param options - Configuration options for session generation
 * @returns Array of TmuxSession objects
 */
export function generateTmuxSessions(
  options: TmuxSessionGeneratorOptions = {}
): TmuxSession[] {
  const {
    count = 3,
    attached = 'mixed',
    minPanes = 1,
    maxPanes = 20,
    minWindows = 1,
    maxWindows = 5,
  } = options;

  const sessionNames = [
    'miyabi-refactor',
    'miyabi-demo',
    'coding-ensemble',
    'hybrid-ensemble',
    'miyabi-dev',
    'miyabi-test',
    'miyabi-prod',
    'orchestra-7pane',
  ];

  const sessions: TmuxSession[] = [];

  for (let i = 0; i < count; i++) {
    const isAttached =
      attached === 'mixed' ? i % 3 === 0 : attached;

    const paneCount = Math.floor(Math.random() * (maxPanes - minPanes + 1)) + minPanes;
    const windowCount = Math.floor(Math.random() * (maxWindows - minWindows + 1)) + minWindows;

    // Generate creation date (within last 7 days)
    const createdDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

    sessions.push({
      id: `session-${i}`,
      name: sessionNames[i % sessionNames.length],
      windows: windowCount,
      panes: paneCount,
      attached: isAttached,
      created: createdDate.toISOString(),
    });
  }

  return sessions;
}

/**
 * Generate a single TmuxSession object
 * @param overrides - Partial session object to override defaults
 * @returns Single TmuxSession object
 */
export function generateTmuxSession(overrides: Partial<TmuxSession> = {}): TmuxSession {
  const defaultSession = generateTmuxSessions({ count: 1 })[0];
  return { ...defaultSession, ...overrides };
}

// ============================================================================
// Timeline Event Generators
// ============================================================================

export interface TimelineEventGeneratorOptions {
  count?: number;
  type?: TimelineEvent['type'] | 'mixed';
  withAgent?: boolean;
  timeRange?: number; // milliseconds
}

/**
 * Generate an array of TimelineEvent objects
 * @param options - Configuration options for event generation
 * @returns Array of TimelineEvent objects
 */
export function generateTimelineEvents(
  options: TimelineEventGeneratorOptions = {}
): TimelineEvent[] {
  const {
    count = 10,
    type = 'mixed',
    withAgent = true,
    timeRange = 3600000, // 1 hour default
  } = options;

  const eventTypes: TimelineEvent['type'][] = ['success', 'info', 'warning', 'error'];

  const agentNames = [
    'CoordinatorAgent',
    'CodeGenAgent',
    'ReviewAgent',
    'DeploymentAgent',
    'IssueAgent',
    'System',
  ];

  const messageTemplates = {
    success: [
      'Task completed successfully',
      'Deployment finished',
      'Tests passed',
      'Code review approved',
      'Issue resolved',
    ],
    info: [
      'Processing in progress',
      'Task started',
      'Analyzing code',
      'Fetching data',
      'Initializing',
    ],
    warning: [
      'Resource constraint detected',
      'Timeout threshold approaching',
      'Code quality threshold not met',
      'API rate limit warning',
      'Memory usage high',
    ],
    error: [
      'Deployment failed',
      'Test suite failed',
      'Connection timeout',
      'Invalid configuration',
      'Authentication failed',
    ],
  };

  const events: TimelineEvent[] = [];

  for (let i = 0; i < count; i++) {
    const eventType =
      type === 'mixed'
        ? eventTypes[i % eventTypes.length]
        : type;

    // Generate timestamp (distributed across time range)
    const timestamp = new Date(Date.now() - (i / count) * timeRange);

    const messages = messageTemplates[eventType];
    const message = messages[Math.floor(Math.random() * messages.length)];

    events.push({
      id: `event-${i}`,
      timestamp: timestamp.toISOString(),
      type: eventType,
      agent: withAgent && Math.random() > 0.2
        ? agentNames[Math.floor(Math.random() * agentNames.length)]
        : undefined,
      message: `${message} ${i > 0 ? `(${i + 1})` : ''}`,
    });
  }

  // Sort by timestamp (most recent first)
  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Generate a single TimelineEvent object
 * @param overrides - Partial event object to override defaults
 * @returns Single TimelineEvent object
 */
export function generateTimelineEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  const defaultEvent = generateTimelineEvents({ count: 1 })[0];
  return { ...defaultEvent, ...overrides };
}

// ============================================================================
// Reference Generators
// ============================================================================

export interface ReferenceGeneratorOptions {
  count?: number;
  category?: Reference['category'] | 'mixed';
  external?: boolean;
}

/**
 * Generate an array of Reference objects
 * @param options - Configuration options for reference generation
 * @returns Array of Reference objects
 */
export function generateReferences(
  options: ReferenceGeneratorOptions = {}
): Reference[] {
  const {
    count = 6,
    category = 'mixed',
    external = false,
  } = options;

  const categories: Reference['category'][] = ['docs', 'guide', 'api'];

  const titlesByCategory = {
    docs: [
      'Architecture Overview',
      'Database Schema',
      'Entity-Relation Model',
      'Label System Guide',
      'API Documentation',
    ],
    guide: [
      'Quick Start Guide',
      'Integration Guide',
      'Deployment Guide',
      'Best Practices',
      'Troubleshooting',
    ],
    api: [
      'REST API Reference',
      'GraphQL API',
      'CLI Reference',
      'SDK Documentation',
      'GitHub API',
    ],
  };

  const references: Reference[] = [];

  for (let i = 0; i < count; i++) {
    const refCategory =
      category === 'mixed'
        ? categories[i % categories.length]
        : category;

    const titles = titlesByCategory[refCategory];
    const title = titles[i % titles.length];

    const url = external
      ? `https://docs.example.com/${refCategory}/${i}`
      : `/docs/${title.replace(/\s+/g, '_').toUpperCase()}.md`;

    references.push({
      id: `ref-${i}`,
      title,
      category: refCategory,
      url,
    });
  }

  return references;
}

/**
 * Generate a single Reference object
 * @param overrides - Partial reference object to override defaults
 * @returns Single Reference object
 */
export function generateReference(overrides: Partial<Reference> = {}): Reference {
  const defaultReference = generateReferences({ count: 1 })[0];
  return { ...defaultReference, ...overrides };
}

// ============================================================================
// Bulk Data Generator
// ============================================================================

export interface BulkDataOptions {
  agents?: AgentGeneratorOptions;
  sessions?: TmuxSessionGeneratorOptions;
  events?: TimelineEventGeneratorOptions;
  references?: ReferenceGeneratorOptions;
}

/**
 * Generate all mock data types at once
 * @param options - Configuration options for all data types
 * @returns Object containing all generated mock data
 */
export function generateAllMockData(options: BulkDataOptions = {}) {
  return {
    agents: generateAgents(options.agents),
    sessions: generateTmuxSessions(options.sessions),
    events: generateTimelineEvents(options.events),
    references: generateReferences(options.references),
  };
}
