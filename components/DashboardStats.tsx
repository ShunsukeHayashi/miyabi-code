'use client';

import { useMemo, type ReactElement } from 'react';
import { StatCard } from './StatCard';
import type { Agent } from './dashboardData';

interface DashboardStats {
  totalAgents: number;
  workingAgents: number;
  activeAgents: number;
  idleAgents: number;
  avgUtilization: number;
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

interface DashboardStatsSectionProps {
  agents: Agent[];
}

export function DashboardStatsSection({ agents }: DashboardStatsSectionProps): ReactElement {
  const stats = useMemo(() => computeStats(agents), [agents]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <StatCard label="Total Agents" value={stats.totalAgents} accent="text-white" />
      <StatCard label="Working" value={stats.workingAgents} accent="text-miyabi-purple" />
      <StatCard label="Active" value={stats.activeAgents} accent="text-miyabi-blue" />
      <StatCard label="Idle" value={stats.idleAgents} accent="text-gray-400" />
      <StatCard label="Average Utilization" value={`${stats.avgUtilization}%`} accent="text-miyabi-green" />
    </section>
  );
}
