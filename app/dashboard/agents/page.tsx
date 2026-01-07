'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentCard } from '@/components/dashboard/AgentCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { Agent, AgentStatus, AgentRole } from '@/lib/github-app/agent-types';

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
  {
    id: 'agent-4',
    name: 'Documentation Bot',
    description: 'Automatically generates and updates documentation based on code changes.',
    role: 'documentation',
    status: 'paused',
    installationId: 12345,
    repositories: ['miyabi/core', 'miyabi/docs'],
    triggers: ['push'],
    config: {
      autoApprove: true,
      maxConcurrentTasks: 2,
      responseTimeout: 60000,
      retryAttempts: 2,
    },
    stats: {
      tasksCompleted: 34,
      tasksInProgress: 0,
      tasksFailed: 0,
      avgResponseTime: 8.1,
      successRate: 100,
    },
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
  {
    id: 'agent-5',
    name: 'Test Generator',
    description: 'Generates test cases for new code and suggests improvements for existing tests.',
    role: 'testing',
    status: 'error',
    installationId: 12345,
    repositories: ['miyabi/core'],
    triggers: ['pr_opened'],
    config: {
      autoApprove: false,
      maxConcurrentTasks: 2,
      responseTimeout: 180000,
      retryAttempts: 3,
    },
    stats: {
      tasksCompleted: 12,
      tasksInProgress: 0,
      tasksFailed: 3,
      avgResponseTime: 15.2,
      successRate: 80,
    },
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date(),
  },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'idle', label: 'Idle' },
  { value: 'paused', label: 'Paused' },
  { value: 'error', label: 'Error' },
];

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'code-reviewer', label: 'Code Reviewer' },
  { value: 'issue-analyzer', label: 'Issue Analyzer' },
  { value: 'pr-assistant', label: 'PR Assistant' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'testing', label: 'Testing' },
  { value: 'security-auditor', label: 'Security Auditor' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleStatusChange = (agentId: string, status: AgentStatus) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status, updatedAt: new Date() } : agent
      )
    );
  };

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const errorCount = agents.filter((a) => a.status === 'error').length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Agents</h1>
            <p className="text-gray-400 mt-1">Manage and monitor your autonomous AI agents</p>
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

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              }
            />
          </div>
          <div className="flex gap-3">
            <div className="w-40">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Status"
              />
            </div>
            <div className="w-40">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={setRoleFilter}
                placeholder="Role"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="success" dot dotColor="bg-miyabi-green">
              {activeCount} Active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" dot dotColor="bg-gray-400">
              {agents.filter((a) => a.status === 'idle').length} Idle
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="warning" dot dotColor="bg-yellow-400">
              {agents.filter((a) => a.status === 'paused').length} Paused
            </Badge>
          </div>
          {errorCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" dot dotColor="bg-miyabi-red">
                {errorCount} Error
              </Badge>
            </div>
          )}
        </div>

        {filteredAgents.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No agents found</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? 'Try adjusting your filters to find what you are looking for.'
                  : 'Create your first AI agent to automate your GitHub workflow.'}
              </p>
              {!searchQuery && statusFilter === 'all' && roleFilter === 'all' && (
                <Link href="/dashboard/agents/new">
                  <Button>Create Your First Agent</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
