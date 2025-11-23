'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { fetchIssue, fetchIssueComments } from '@/lib/github';
import type { Repository, Issue, IssueComment } from '@/types/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';
import {
  Loader2,
  ChevronRight,
  ExternalLink,
  Calendar,
  User,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [params.id, params.issueNumber]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load repository info
      const repoResponse = await api.get<Repository>(`/repositories/${params.id}`);
      setRepository(repoResponse.data);

      // Load issue from GitHub
      if (accessToken && repoResponse.data) {
        const issueData = await fetchIssue(
          accessToken,
          repoResponse.data.owner,
          repoResponse.data.name,
          Number(params.issueNumber)
        );
        setIssue(issueData);

        // Load comments
        const commentsData = await fetchIssueComments(
          accessToken,
          repoResponse.data.owner,
          repoResponse.data.name,
          Number(params.issueNumber)
        );
        setComments(commentsData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Issueの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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

  if (!issue || !repository) {
    return (
      <Alert>
        <AlertDescription>Issueが見つかりませんでした</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
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
        <button
          onClick={() => router.push(`/dashboard/repositories/${params.id}/issues`)}
          className="hover:text-gray-900 transition-colors"
          {...toDataAttributes(
            CommonMetadata.breadcrumbLink(repository.full_name, `/dashboard/repositories/${params.id}/issues`)
          )}
        >
          {repository.full_name}
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Issue #{issue.number}</span>
      </div>

      {/* Issue Header */}
      <div
        {...toDataAttributes({
          role: 'header',
          target: `issue-detail-header-${issue.number}`,
          description: `Issue #${issue.number} header with state, title, author, and creation date`,
          context: 'issue-detail-page',
        })}
      >
        <div className="flex items-center gap-4 mb-4">
          <Badge
            variant={issue.state === 'open' ? 'default' : 'secondary'}
            className={
              issue.state === 'open'
                ? 'bg-gray-50 text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
            }
            {...toDataAttributes({
              role: 'badge',
              target: `issue-state-badge-${issue.number}`,
              description: `Issue state: ${issue.state}`,
              context: 'issue-detail-header',
              state: issue.state,
            })}
          >
            {issue.state === 'open' ? 'Open' : 'Closed'}
          </Badge>
          <h1
            className="text-4xl font-semibold tracking-tight text-gray-900"
            {...toDataAttributes({
              role: 'header',
              target: `issue-title-${issue.number}`,
              description: `Issue title: ${issue.title}`,
              context: 'issue-detail-header',
            })}
          >
            {issue.title}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {issue.user.login}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            作成:{' '}
            {formatDistanceToNow(new Date(issue.created_at), {
              addSuffix: true,
              locale: ja,
            })}
          </span>
          <Button variant="link" className="h-auto p-0 text-blue-600" asChild>
            <a
              href={issue.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
              {...toDataAttributes({
                role: 'link',
                action: 'navigate',
                target: `issue-github-link-${issue.number}`,
                description: `Open Issue #${issue.number} on GitHub in new tab`,
                context: 'issue-detail-header',
                expectedResult: 'open-external',
                navigationTarget: issue.html_url,
              })}
            >
              GitHub で開く
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          {...toDataAttributes({
            role: 'container',
            target: `issue-labels-${issue.number}`,
            description: `Issue labels (${issue.labels.length} labels)`,
            context: 'issue-detail-page',
          })}
        >
          {issue.labels.map((label) => (
            <Badge
              key={label.name}
              variant="outline"
              style={{
                backgroundColor: `#${label.color}20`,
                borderColor: `#${label.color}`,
                color: `#${label.color}`,
              }}
              {...toDataAttributes({
                role: 'badge',
                target: `issue-label-${label.name.toLowerCase().replace(/\s+/g, '-')}`,
                description: `Label: ${label.name}`,
                context: 'issue-labels',
              })}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Issue Body */}
      {issue.body && (
        <Card
          {...toDataAttributes({
            role: 'card',
            target: `issue-body-${issue.number}`,
            description: `Issue description/body content for Issue #${issue.number}`,
            context: 'issue-detail-page',
          })}
        >
          <CardHeader>
            <CardTitle className="text-lg">説明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-700">
                {issue.body}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <Card
          {...toDataAttributes({
            role: 'card',
            target: `issue-comments-${issue.number}`,
            description: `Issue comments section (${comments.length} comments)`,
            context: 'issue-detail-page',
          })}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              コメント ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  {...toDataAttributes({
                    role: 'list-item',
                    target: `issue-comment-${comment.id}`,
                    description: `Comment by ${comment.user.login}`,
                    context: 'issue-comments',
                  })}
                >
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex gap-4">
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.login}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900">
                          {comment.user.login}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ja,
                          })}
                        </span>
                      </div>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-md">
                          {comment.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {comments.length === 0 && (
        <Card
          {...toDataAttributes({
            role: 'card',
            target: `issue-no-comments-${issue.number}`,
            description: 'No comments placeholder card',
            context: 'issue-detail-page',
          })}
        >
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">コメントはありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
