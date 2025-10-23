'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { fetchRepositoryIssues } from '@/lib/github';
import type { Repository, Issue } from '@/types/repository';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Bot,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function IssuesPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [params.id, stateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load repository info
      const repoResponse = await api.get<Repository>(`/repositories/${params.id}`);
      setRepository(repoResponse.data);

      // Load issues from GitHub
      if (accessToken && repoResponse.data) {
        const issuesData = await fetchRepositoryIssues(
          accessToken,
          repoResponse.data.owner,
          repoResponse.data.name,
          stateFilter
        );
        setIssues(issuesData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Issueの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAgent = async (issue: Issue) => {
    try {
      await api.post('/agents/execute', {
        repository_id: params.id,
        issue_number: issue.number,
        agent_type: 'coordinator',
      });
      alert(`Issue #${issue.number} のAgent実行を開始しました`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Agent実行に失敗しました');
    }
  };

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto" />
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <button
            onClick={() => router.push('/dashboard/repositories')}
            className="hover:text-slate-700"
          >
            リポジトリ
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900">{repository?.full_name}</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Issue一覧</h2>
        <p className="mt-2 text-slate-600">
          {repository?.full_name} のIssueを管理
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Input
              type="text"
              placeholder="Issueを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              aria-label="Search issues"
            />
            <div className="flex gap-2" role="group" aria-label="Filter issues by state">
              <Button
                variant={stateFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setStateFilter('open')}
                aria-pressed={stateFilter === 'open'}
                aria-label="Show open issues"
              >
                Open
              </Button>
              <Button
                variant={stateFilter === 'closed' ? 'default' : 'outline'}
                onClick={() => setStateFilter('closed')}
                aria-pressed={stateFilter === 'closed'}
                aria-label="Show closed issues"
              >
                Closed
              </Button>
              <Button
                variant={stateFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStateFilter('all')}
                aria-pressed={stateFilter === 'all'}
                aria-label="Show all issues"
              >
                All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-slate-500">
                {searchQuery
                  ? '検索条件に一致するIssueがありません'
                  : 'Issueがありません'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant={issue.state === 'open' ? 'default' : 'secondary'}
                        className={
                          issue.state === 'open'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                        }
                      >
                        {issue.state === 'open' ? 'Open' : 'Closed'}
                      </Badge>
                      <h3 className="text-lg font-semibold text-slate-900">
                        #{issue.number} {issue.title}
                      </h3>
                    </div>

                    {/* Labels */}
                    {issue.labels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {issue.labels.map((label) => (
                          <Badge
                            key={label.name}
                            variant="outline"
                            style={{
                              backgroundColor: `#${label.color}20`,
                              borderColor: `#${label.color}`,
                              color: `#${label.color}`,
                            }}
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <img
                          src={issue.user.avatar_url}
                          alt={issue.user.login}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{issue.user.login}</span>
                      </div>
                      <span>
                        作成: {new Date(issue.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-blue-600"
                        asChild
                      >
                        <a
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          GitHub で開く
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto sm:ml-4">
                    {issue.state === 'open' && (
                      <Button
                        onClick={() => handleExecuteAgent(issue)}
                        aria-label={`Execute agent for issue #${issue.number}`}
                        className="w-full sm:w-auto"
                      >
                        <Bot className="h-4 w-4 mr-2" aria-hidden="true" />
                        Agent実行
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-slate-500">
        {filteredIssues.length} 件のIssue
      </div>
    </div>
  );
}
