'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface Repository {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  agents: Array<{ id: string; name: string; status: string }>;
  lastActivity: Date;
}

const mockRepositories: Repository[] = [
  {
    id: '1',
    fullName: 'miyabi/core',
    name: 'core',
    owner: 'miyabi',
    description: 'Core library for the Miyabi AI Agent Framework',
    private: false,
    defaultBranch: 'main',
    language: 'TypeScript',
    stargazersCount: 1234,
    forksCount: 89,
    openIssuesCount: 23,
    agents: [
      { id: 'agent-1', name: 'Code Reviewer Pro', status: 'active' },
      { id: 'agent-2', name: 'Issue Analyzer', status: 'active' },
      { id: 'agent-3', name: 'Security Auditor', status: 'idle' },
    ],
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    fullName: 'miyabi/dashboard',
    name: 'dashboard',
    owner: 'miyabi',
    description: 'Web dashboard for managing AI agents',
    private: true,
    defaultBranch: 'main',
    language: 'TypeScript',
    stargazersCount: 0,
    forksCount: 0,
    openIssuesCount: 8,
    agents: [
      { id: 'agent-1', name: 'Code Reviewer Pro', status: 'active' },
    ],
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    fullName: 'miyabi/sdk',
    name: 'sdk',
    owner: 'miyabi',
    description: 'SDK for integrating Miyabi agents into your applications',
    private: false,
    defaultBranch: 'develop',
    language: 'TypeScript',
    stargazersCount: 567,
    forksCount: 34,
    openIssuesCount: 12,
    agents: [
      { id: 'agent-1', name: 'Code Reviewer Pro', status: 'active' },
    ],
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '4',
    fullName: 'miyabi/docs',
    name: 'docs',
    owner: 'miyabi',
    description: 'Documentation for the Miyabi AI Agent Framework',
    private: false,
    defaultBranch: 'main',
    language: 'MDX',
    stargazersCount: 45,
    forksCount: 12,
    openIssuesCount: 5,
    agents: [
      { id: 'agent-2', name: 'Issue Analyzer', status: 'active' },
      { id: 'agent-4', name: 'Documentation Bot', status: 'paused' },
    ],
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    fullName: 'miyabi/cli',
    name: 'cli',
    owner: 'miyabi',
    description: 'Command-line interface for Miyabi',
    private: true,
    defaultBranch: 'main',
    language: 'Rust',
    stargazersCount: 0,
    forksCount: 0,
    openIssuesCount: 3,
    agents: [],
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Rust: 'bg-orange-500',
  Python: 'bg-green-500',
  Go: 'bg-cyan-500',
  MDX: 'bg-purple-500',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function RepositoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories] = useState<Repository[]>(mockRepositories);

  const filteredRepositories = repositories.filter((repo) =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedCount = repositories.filter((r) => r.agents.length > 0).length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Repositories</h1>
            <p className="text-gray-400 mt-1">Manage your connected GitHub repositories</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open('https://github.com/apps/miyabi-ai/installations/new', '_blank')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add Repository
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search repositories..."
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
          <div className="flex items-center gap-3">
            <Badge variant="success">
              {connectedCount} with agents
            </Badge>
            <Badge variant="default">
              {repositories.length - connectedCount} no agents
            </Badge>
          </div>
        </div>

        {filteredRepositories.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No repositories found</h3>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try adjusting your search query.'
                  : 'Connect your GitHub repositories to get started with AI agents.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRepositories.map((repo) => (
              <Card key={repo.id} variant="glass" hover>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gray-800 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-white hover:text-miyabi-blue transition-colors"
                        >
                          {repo.fullName}
                        </a>
                        {repo.private && (
                          <Badge variant="outline" size="sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Private
                          </Badge>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-1">{repo.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${languageColors[repo.language] || 'bg-gray-500'}`} />
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {repo.stargazersCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="18" r="3" />
                            <circle cx="6" cy="6" r="3" />
                            <circle cx="18" cy="6" r="3" />
                            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
                            <path d="M12 12v3" />
                          </svg>
                          {repo.forksCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          {repo.openIssuesCount} issues
                        </span>
                        <span>Updated {formatTimeAgo(repo.lastActivity)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {repo.agents.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {repo.agents.slice(0, 3).map((agent) => (
                              <div
                                key={agent.id}
                                className={`w-7 h-7 rounded-full border-2 border-gray-900 flex items-center justify-center ${
                                  agent.status === 'active'
                                    ? 'bg-miyabi-green/20 text-miyabi-green'
                                    : 'bg-gray-700 text-gray-400'
                                }`}
                                title={`${agent.name} (${agent.status})`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 8V4H8" />
                                  <rect width="16" height="12" x="4" y="8" rx="2" />
                                </svg>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {repo.agents.length} agent{repo.agents.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">No agents</Badge>
                      )}
                      <Link href={`/dashboard/agents/new?repository=${repo.fullName}`}>
                        <Button variant="ghost" size="sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                          </svg>
                          Add Agent
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
