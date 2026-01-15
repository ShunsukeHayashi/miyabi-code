'use client';

import { useMemo, useState } from 'react';

import type { Agent, AgentStatus } from '@/components/dashboardData';

interface AgentBoardProps {
  agents: Agent[]
  onStatusChange?: (agentId: string, status: AgentStatus) => void
  onAgentFocus?: (agent: Agent) => void
}

type StatusFilter = 'all' | AgentStatus

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'すべて' },
  { value: 'working', label: 'Working' },
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
];

const STATUS_STYLES: Record<AgentStatus, { badge: string; indicator: string; label: string }> = {
  working: {
    badge: 'bg-miyabi-purple/20 text-miyabi-purple border-miyabi-purple/40',
    indicator: 'bg-miyabi-purple',
    label: 'Working',
  },
  active: {
    badge: 'bg-miyabi-blue/20 text-miyabi-blue border-miyabi-blue/40',
    indicator: 'bg-miyabi-blue',
    label: 'Active',
  },
  idle: {
    badge: 'bg-gray-800 text-gray-300 border-gray-700',
    indicator: 'bg-gray-500',
    label: 'Idle',
  },
};

const nextStatus = (status: AgentStatus): AgentStatus => {
  switch (status) {
    case 'idle':
      return 'active';
    case 'active':
      return 'working';
    default:
      return 'idle';
  }
};

export default function AgentBoard({ agents, onStatusChange, onAgentFocus }: AgentBoardProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesFilter = filter === 'all' || agent.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        agent.displayName.toLowerCase().includes(normalizedSearch) ||
        agent.codename.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [agents, filter, search]);

  const handleStatusChange = (agentId: string, status: AgentStatus) => {
    onStatusChange?.(agentId, status);
  };

  const renderAgentCard = (agent: Agent) => {
    const statusStyle = STATUS_STYLES[agent.status];
    const utilizationPercent = Math.round(agent.utilization * 100);

    return (
      <div
        key={agent.id}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-4 transition-all hover:border-gray-700 hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 font-mono">{agent.codename}</p>
            <h3 className="text-xl font-semibold text-white">{agent.displayName}</h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.badge}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-400">
            <span>Utilization</span>
            <span className="text-white">{utilizationPercent}%</span>
          </div>
          <div className="w-full bg-gray-800/70 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${statusStyle.indicator}`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        {agent.currentTask ? (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Current Task</p>
            <p className="text-sm text-white font-medium mb-2">{agent.currentTask.title}</p>
            <p className="text-xs text-gray-400 mb-4">{agent.currentTask.summary}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span className="text-white">{agent.currentTask.progress}%</span>
            </div>
            <div className="w-full bg-gray-900 rounded-full h-1 mt-2">
              <div
                className={`h-1 rounded-full transition-all ${statusStyle.indicator}`}
                style={{ width: `${agent.currentTask.progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Currently waiting for assignment.</div>
        )}

        {agent.capabilities?.length ? (
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((capability) => (
              <span
                key={capability}
                className="px-2 py-1 bg-gray-800/60 border border-gray-700 text-xs text-gray-300 rounded-full"
              >
                {capability}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleStatusChange(agent.id, nextStatus(agent.status))}
            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-miyabi-blue/80 hover:bg-miyabi-blue rounded-lg transition-colors"
          >
            Cycle Status
          </button>
          <button
            type="button"
            onClick={() => agent.currentTask && onAgentFocus?.(agent)}
            className="px-3 py-2 text-xs font-semibold text-gray-200 bg-gray-800/90 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Focus Pane
          </button>
        </div>

        <div className="text-xs text-gray-500 text-right">
          Updated {new Date(agent.lastUpdated).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Agent Board</h2>
          <p className="text-sm text-gray-400">Monitor agents across the Miyabi Coding Ensemble.</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 flex items-center gap-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  filter === option.value
                    ? 'bg-miyabi-blue text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg flex items-center gap-2">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 6.65a7.5 7.5 0 010 10.6z" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-transparent text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none"
                placeholder="Search agents"
                type="search"
              />
            </label>

            <div className="bg-gray-900 border border-gray-800 rounded-lg flex">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs font-semibold rounded-l-lg ${
                  viewMode === 'grid'
                    ? 'bg-miyabi-blue text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-xs font-semibold rounded-r-lg ${
                  viewMode === 'list'
                    ? 'bg-miyabi-blue text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </header>

      {filteredAgents.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          条件に一致するエージェントが見つかりません。
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => renderAgentCard(agent))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-6 hover:border-gray-700"
            >
              <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[agent.status].indicator}`} />
              <div className="flex-1">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{agent.codename}</p>
                    <p className="text-lg text-white font-semibold">{agent.displayName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${STATUS_STYLES[agent.status].badge}`}>
                      {STATUS_STYLES[agent.status].label}
                    </span>
                    <span className="text-xs text-gray-400">{Math.round(agent.utilization * 100)}% utilized</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {agent.currentTask?.summary ?? 'Waiting on next assignment.'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(agent.id, nextStatus(agent.status))}
                  className="px-3 py-2 text-xs font-semibold text-white bg-miyabi-purple/80 hover:bg-miyabi-purple rounded-lg"
                >
                  Cycle
                </button>
                <button
                  type="button"
                  onClick={() => onAgentFocus?.(agent)}
                  className="px-3 py-2 text-xs font-semibold text-gray-200 bg-gray-800/80 hover:bg-gray-700 rounded-lg"
                >
                  Focus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
