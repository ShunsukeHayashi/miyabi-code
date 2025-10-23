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
import { useToast } from '@/hooks/use-toast';
import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  const { toast } = useToast();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [executingIssueId, setExecutingIssueId] = useState<number | null>(null);

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
      setExecutingIssueId(issue.id);
      await api.post('/agents/execute', {
        repository_id: params.id,
        issue_number: issue.number,
        agent_type: 'coordinator',
      });
      toast({
        title: 'Agent実行開始',
        description: `Issue #${issue.number} のAgent実行を開始しました`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Agent実行失敗',
        description: err.response?.data?.message || 'Agent実行に失敗しました',
      });
    } finally {
      setExecutingIssueId(null);
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
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <button
            onClick={() => router.push('/dashboard/repositories')}
            className="hover:text-gray-900 transition-colors"
            {...toDataAttributes(
              CommonMetadata.breadcrumbLink('リポジトリ', '/dashboard/repositories')
            )}
          >
            リポジトリ
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{repository?.full_name}</span>
        </div>
        <h2 className="text-5xl font-semibold tracking-tight text-gray-900 mb-3">Issue一覧</h2>
        <p className="text-lg text-gray-600">
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
              {...toDataAttributes(
                CommonMetadata.searchInput('issues-list', 'Issueを検索...')
              )}
            />
            <div className="flex gap-2" role="group" aria-label="Filter issues by state">
              <Button
                variant={stateFilter === 'open' ? 'default' : 'outline'}
                onClick={() => setStateFilter('open')}
                aria-pressed={stateFilter === 'open'}
                aria-label="Show open issues"
                {...toDataAttributes(CommonMetadata.issueFilterButton('open'))}
              >
                Open
              </Button>
              <Button
                variant={stateFilter === 'closed' ? 'default' : 'outline'}
                onClick={() => setStateFilter('closed')}
                aria-pressed={stateFilter === 'closed'}
                aria-label="Show closed issues"
                {...toDataAttributes(CommonMetadata.issueFilterButton('closed'))}
              >
                Closed
              </Button>
              <Button
                variant={stateFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStateFilter('all')}
                aria-pressed={stateFilter === 'all'}
                aria-label="Show all issues"
                {...toDataAttributes(CommonMetadata.issueFilterButton('all'))}
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
            <Card key={issue.id} className="border border-gray-200 hover:bg-gray-50 transition-colors">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant={issue.state === 'open' ? 'default' : 'secondary'}
                        className={
                          issue.state === 'open'
                            ? 'bg-gray-50 text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                        }
                      >
                        {issue.state === 'open' ? 'Open' : 'Closed'}
                      </Badge>
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/repositories/${params.id}/issues/${issue.number}`
                          )
                        }
                        className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                        {...toDataAttributes(
                          CommonMetadata.issueTitleLink(
                            issue.number,
                            params.id as string
                          )
                        )}
                      >
                        #{issue.number} {issue.title}
                      </button>
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={executingIssueId === issue.id}
                            aria-label={`Execute agent for issue #${issue.number}`}
                            className="w-full sm:w-auto"
                            {...toDataAttributes(
                              CommonMetadata.agentExecuteButton(issue.number)
                            )}
                          >
                            {executingIssueId === issue.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                                実行中...
                              </>
                            ) : (
                              <>
                                <Bot className="h-4 w-4 mr-2" aria-hidden="true" />
                                Agent実行
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Agent実行の確認</AlertDialogTitle>
                            <AlertDialogDescription>
                              Issue #{issue.number} に対してCoordinatorAgentを実行します。
                              <br />
                              <br />
                              <strong>{issue.title}</strong>
                              <br />
                              <br />
                              この操作により、Agentが自動的にタスクを分析・実行します。
                              よろしいですか？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleExecuteAgent(issue)}
                              {...toDataAttributes(
                                CommonMetadata.agentExecuteConfirmButton(issue.number)
                              )}
                            >
                              実行
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
