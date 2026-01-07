'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AgentCard } from '@/components/dashboard/AgentCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import type { Agent, DashboardStats, AgentStatus } from '@/lib/github-app/agent-types';

const mockStats: DashboardStats = {
  totalAgents: 5,
  activeAgents: 3,
  tasksToday: 47,
  tasksThisWeek: 312,
  successRate: 94.2,
  avgResponseTime: 2.8,
  topAgent: {
    id: 'agent-1',
    name: 'Code Reviewer',
    tasksCompleted: 156,
  },
};

const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Code Reviewer Pro',
    description: 'Automatically reviews pull requests for code quality, security issues, and best practices.',
    role: 'code-reviewer',
    status: 'active',
    installationId: 12345,
    repositories: ['miyabi/core', 'miyabi/dashboard', 'miyabi/sdk'],
    triggers: ['pr_opened', 'pr_review_requested'],
    config: {
      autoApprove: false,
      maxConcurrentTasks: 5,
      responseTimeout: 60000,
      retryAttempts: 3,
    },
    stats: {
      tasksCompleted: 156,
      tasksInProgress: 2,
      tasksFailed: 4,
      avgResponseTime: 2.5,
      successRate: 97.5,
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  },
  {
    id: 'agent-2',
    name: 'Issue Analyzer',
    description: 'Analyzes new issues, categorizes them, and suggests solutions or relevant documentation.',
    role: 'issue-analyzer',
    status: 'active',
    installationId: 12345,
    repositories: ['miyabi/core', 'miyabi/docs'],
    triggers: ['issue_opened'],
    config: {
      autoApprove: true,
      maxConcurrentTasks: 10,
      responseTimeout: 30000,
      retryAttempts: 2,
    },
    stats: {
      tasksCompleted: 89,
      tasksInProgress: 1,
      tasksFailed: 2,
      avgResponseTime: 1.8,
      successRate: 97.8,
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
  },
  {
    id: 'agent-3',
    name: 'Security Auditor',
    description: 'Scans code for security vulnerabilities and suggests fixes.',
    role: 'security-auditor',
    status: 'idle',
    installationId: 12345,
    repositories: ['miyabi/core'],
    triggers: ['pr_opened', 'push'],
    config: {
      autoApprove: false,
      maxConcurrentTasks: 3,
      responseTimeout: 120000,
      retryAttempts: 3,
    },
    stats: {
      tasksCompleted: 67,
      tasksInProgress: 0,
      tasksFailed: 1,
      avgResponseTime: 5.2,
      successRate: 98.5,
    },
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  },
];

const mockActivities = [
  {
    id: '1',
    type: 'pr_reviewed' as const,
    agent: { id: 'agent-1', name: 'Code Reviewer Pro' },
    repository: 'miyabi/core',
    title: 'Reviewed PR: Add authentication module',
    description: 'Approved with 3 suggestions for improvement',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    metadata: { prNumber: 234 },
  },
  {
    id: '2',
    type: 'issue_analyzed' as const,
    agent: { id: 'agent-2', name: 'Issue Analyzer' },
    repository: 'miyabi/core',
    title: 'Analyzed issue: Performance degradation',
    description: 'Categorized as bug, assigned priority high',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    metadata: { issueNumber: 156 },
  },
  {
    id: '3',
    type: 'task_completed' as const,
    agent: { id: 'agent-3', name: 'Security Auditor' },
    repository: 'miyabi/core',
    title: 'Security scan completed',
    description: 'No vulnerabilities found in latest push',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '4',
    type: 'comment_posted' as const,
    agent: { id: 'agent-1', name: 'Code Reviewer Pro' },
    repository: 'miyabi/dashboard',
    title: 'Posted review comment',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    metadata: { prNumber: 89 },
  },
  {
    id: '5',
    type: 'issue_analyzed' as const,
    agent: { id: 'agent-2', name: 'Issue Analyzer' },
    repository: 'miyabi/docs',
    title: 'Analyzed feature request',
    description: 'Linked to existing roadmap item',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    metadata: { issueNumber: 42 },
  },
];

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [stats] = useState<DashboardStats>(mockStats);

  const handleStatusChange = (agentId: string, status: AgentStatus) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status, updatedAt: new Date() } : agent
      )
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor your AI agents and their activity</p>
          </div>
          <Link href="/dashboard/agents/new">
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create Agent
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Agents"
            value={stats.totalAgents}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            }
            iconColor="blue"
            description={`${stats.activeAgents} currently active`}
          />
          <StatsCard
            title="Tasks Today"
            value={stats.tasksToday}
            change={{ value: 12, type: 'increase' }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
            iconColor="green"
            description={`${stats.tasksThisWeek} this week`}
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            change={{ value: 2.1, type: 'increase' }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            }
            iconColor="purple"
            description="Last 30 days"
          />
          <StatsCard
            title="Avg Response"
            value={`${stats.avgResponseTime}s`}
            change={{ value: 0.3, type: 'decrease' }}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            }
            iconColor="yellow"
            description="Per task completion"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Agents</h2>
              <Link href="/dashboard/agents" className="text-sm text-miyabi-blue hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.slice(0, 4).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <ActivityFeed activities={mockActivities} maxItems={5} />

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-base">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">API Calls</span>
                    <span className="text-white">2,847 / 10,000</span>
                  </div>
                  <Progress value={28.47} variant="default" animated={false} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Token Usage</span>
                    <span className="text-white">156K / 500K</span>
                  </div>
                  <Progress value={31.2} variant="default" animated={false} />
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Current Plan</span>
                    <Badge variant="primary">Free</Badge>
                  </div>
                </div>
                <Link href="/dashboard/settings/billing">
                  <Button variant="outline" size="sm" className="w-full">
                    Upgrade Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/agents/new">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-miyabi-blue/50 hover:bg-gray-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-miyabi-blue/20 text-miyabi-blue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">Create Agent</h3>
                  <p className="text-xs text-gray-500 mt-1">Set up a new AI agent</p>
                </div>
              </Link>
              <Link href="/dashboard/repositories">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-miyabi-purple/50 hover:bg-gray-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-miyabi-purple/20 text-miyabi-purple flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">Manage Repos</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure repositories</p>
                </div>
              </Link>
              <Link href="/dashboard/analytics">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-miyabi-green/50 hover:bg-gray-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-miyabi-green/20 text-miyabi-green flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">View Analytics</h3>
                  <p className="text-xs text-gray-500 mt-1">Performance insights</p>
                </div>
              </Link>
              <Link href="/dashboard/settings">
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-yellow-500/50 hover:bg-gray-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white">Settings</h3>
                  <p className="text-xs text-gray-500 mt-1">Configure preferences</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
