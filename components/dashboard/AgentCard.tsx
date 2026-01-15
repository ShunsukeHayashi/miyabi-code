'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Agent, AgentStatus, AgentRole } from '@/lib/github-app/agent-types';

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

interface AgentCardProps {
  agent: Agent;
  onStatusChange?: (agentId: string, status: AgentStatus) => void;
  compact?: boolean;
}

const statusConfig: Record<AgentStatus, { label: string; variant: 'success' | 'primary' | 'warning' | 'destructive'; dot: string }> = {
  active: { label: 'Active', variant: 'success', dot: 'bg-miyabi-green' },
  idle: { label: 'Idle', variant: 'default' as 'primary', dot: 'bg-gray-400' },
  paused: { label: 'Paused', variant: 'warning', dot: 'bg-yellow-400' },
  error: { label: 'Error', variant: 'destructive', dot: 'bg-miyabi-red' },
};

const roleIcons: Record<AgentRole, React.ReactNode> = {
  'code-reviewer': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  'issue-analyzer': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  'pr-assistant': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" x2="6" y1="9" y2="21" />
    </svg>
  ),
  'documentation': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  ),
  'testing': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  'security-auditor': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  'performance-optimizer': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  'dependency-updater': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  ),
  'custom': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
};

export function AgentCard({ agent, onStatusChange, compact = false }: AgentCardProps) {
  const status = statusConfig[agent.status];

  if (compact) {
    return (
      <Link href={`/dashboard/agents/${agent.id}`}>
        <Card variant="glass" hover className="cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 text-miyabi-blue">
                {roleIcons[agent.role]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">{agent.name}</h4>
                <p className="text-xs text-gray-400 capitalize">{agent.role.replace('-', ' ')}</p>
              </div>
              <Badge variant={status.variant} dot dotColor={status.dot}>
                {status.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card variant="glass" hover>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 text-miyabi-blue">
              {roleIcons[agent.role]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-gray-400 capitalize">{agent.role.replace('-', ' ')}</p>
            </div>
          </div>
          <Badge variant={status.variant} dot dotColor={status.dot}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400 line-clamp-2">{agent.description}</p>

        <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-800">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{agent.stats.tasksCompleted}</p>
            <p className="text-xs text-gray-500">Tasks Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{agent.stats.successRate}%</p>
            <p className="text-xs text-gray-500">Success</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">{agent.stats.avgResponseTime}s</p>
            <p className="text-xs text-gray-500">Avg Time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {agent.repositories.slice(0, 3).map((repo, i) => (
              <div
                key={repo}
                className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center"
                title={repo}
              >
                <span className="text-[10px] text-gray-400">{repo.charAt(0).toUpperCase()}</span>
              </div>
            ))}
            {agent.repositories.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center">
                <span className="text-[10px] text-gray-300">+{agent.repositories.length - 3}</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500">{agent.repositories.length} repositories</span>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link href={`/dashboard/agents/${agent.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </Link>
          {agent.status === 'active' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange?.(agent.id, 'paused')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange?.(agent.id, 'active')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
