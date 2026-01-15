'use client';

import { useMemo, useState } from 'react';

// Re-export types for external use
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

export interface IssueSummary {
  number: number
  title: string
  state: 'open' | 'closed'
  labels: string[]
  url: string
}

// Default mock data
const defaultAgents: Agent[] = [
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
    queue: [],
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
    queue: [],
    capabilities: ['React components', 'TypeScript', 'Tailwind UI'],
    lastUpdated: '2025-11-05T08:18:11Z',
  },
  {
    id: 'agent-2',
    codename: 'ReviewAgent',
    displayName: 'Kaede (Review)',
    status: 'active',
    utilization: 0.54,
    queue: [],
    capabilities: ['Code review automation', 'UI regression checks'],
    lastUpdated: '2025-11-05T08:00:00Z',
  },
];

const defaultIssues: IssueSummary[] = [
  {
    number: 758,
    title: 'Mission Control UI shell',
    state: 'open',
    labels: ['type:feature', 'agent:CodeGen'],
    url: 'https://github.com/ShunsukeHayashi/Miyabi/issues/758',
  },
  {
    number: 741,
    title: 'Tmux monitoring pipeline',
    state: 'open',
    labels: ['phase:integration'],
    url: 'https://github.com/ShunsukeHayashi/Miyabi/issues/741',
  },
];

interface DashboardStats {
  totalAgents: number
  workingAgents: number
  activeAgents: number
  idleAgents: number
  avgUtilization: number
}

const computeStats = (agents: Agent[]): DashboardStats => {
  const totalAgents = agents.length;
  const workingAgents = agents.filter((agent) => agent.status === 'working').length;
  const activeAgents = agents.filter((agent) => agent.status === 'active').length;
  const idleAgents = agents.filter((agent) => agent.status === 'idle').length;
  const avgUtilization = totalAgents
    ? Math.round((agents.reduce((sum, agent) => sum + agent.utilization, 0) / totalAgents) * 100)
    : 0;

  return { totalAgents, workingAgents, activeAgents, idleAgents, avgUtilization };
};

interface StatCardProps {
  label: string
  value: string | number
  accent: string
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-3 ${accent}`}>{value}</p>
    </div>
  );
}

function IssueCard({ issue }: { issue: IssueSummary }) {
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-mono text-sm">#{issue.number}</span>
            <span className="px-2 py-1 rounded text-xs font-medium bg-miyabi-green/20 text-miyabi-green">
              {issue.state}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
          <div className="flex flex-wrap gap-2">
            {issue.labels.map((label) => (
              <span key={label} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                {label}
              </span>
            ))}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}

export interface DashboardProps {
  initialAgents?: Agent[]
  initialIssues?: IssueSummary[]
  onAgentStatusChange?: (agentId: string, status: AgentStatus) => void
}

/**
 * Dashboard Component
 *
 * A reusable dashboard component for displaying agent status and issues
 * in the Miyabi autonomous agent orchestration platform.
 */
export default function Dashboard({
  initialAgents = defaultAgents,
  initialIssues = defaultIssues,
  onAgentStatusChange,
}: DashboardProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [issues] = useState<IssueSummary[]>(initialIssues);

  const stats = useMemo(() => computeStats(agents), [agents]);

  const handleAgentStatusChange = (agentId: string, status: AgentStatus) => {
    const timestamp = new Date().toISOString();

    setAgents((previous) =>
      previous.map((agent) =>
        agent.id === agentId
          ? {
            ...agent,
            status,
            lastUpdated: timestamp,
          }
          : agent,
      ),
    );

    onAgentStatusChange?.(agentId, status);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-3">
          <p className="text-sm text-gray-500 font-mono">Miyabi Dashboard Component</p>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-miyabi-blue to-miyabi-purple bg-clip-text text-transparent">
            Miyabi Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Dashboard component for the Miyabi autonomous agent orchestration platform.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <StatCard label="Total Agents" value={stats.totalAgents} accent="text-white" />
          <StatCard label="Working" value={stats.workingAgents} accent="text-miyabi-purple" />
          <StatCard label="Active" value={stats.activeAgents} accent="text-miyabi-blue" />
          <StatCard label="Idle" value={stats.idleAgents} accent="text-gray-400" />
          <StatCard label="Average Utilization" value={`${stats.avgUtilization}%`} accent="text-miyabi-green" />
        </section>

        <section className="space-y-4">
          <header>
            <h2 className="text-3xl font-bold text-white">Agents Overview</h2>
            <p className="text-sm text-gray-400">Status of all registered agents.</p>
          </header>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{agent.codename}</p>
                    <p className="text-lg font-semibold text-white">{agent.displayName}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.status === 'working'
                        ? 'bg-miyabi-purple/20 text-miyabi-purple'
                        : agent.status === 'active'
                          ? 'bg-miyabi-blue/20 text-miyabi-blue'
                          : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Utilization</span>
                    <span className="text-white">{Math.round(agent.utilization * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-miyabi-blue"
                      style={{ width: `${agent.utilization * 100}%` }}
                    />
                  </div>
                </div>
                {agent.currentTask && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-400 mb-1">Current Task</p>
                    <p className="text-sm text-white truncate">{agent.currentTask.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <header>
            <h2 className="text-3xl font-bold text-white">Active Issues</h2>
            <p className="text-sm text-gray-400">Key threads monitored alongside Mission Control.</p>
          </header>
          <div className="space-y-3">
            {issues.map((issue) => (
              <IssueCard key={issue.number} issue={issue} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export { Dashboard };
