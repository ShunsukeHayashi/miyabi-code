'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { fetchRepositoryIssues } from '@/lib/github';
import type { Repository, Issue } from '@/types/repository';

export default function IssuesPage() {
  const params = useParams();
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/dashboard/repositories" className="hover:text-gray-700">
            リポジトリ
          </a>
          <span>/</span>
          <span className="text-gray-900">{repository?.full_name}</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Issue一覧</h2>
        <p className="mt-2 text-gray-600">
          {repository?.full_name} のIssueを管理
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Issueを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStateFilter('open')}
              className={`px-4 py-2 rounded-lg ${
                stateFilter === 'open'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStateFilter('closed')}
              className={`px-4 py-2 rounded-lg ${
                stateFilter === 'closed'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setStateFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                stateFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? '検索条件に一致するIssueがありません'
                : 'Issueがありません'}
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        issue.state === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {issue.state === 'open' ? 'Open' : 'Closed'}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{issue.number} {issue.title}
                    </h3>
                  </div>

                  {/* Labels */}
                  {issue.labels.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {issue.labels.map((label) => (
                        <span
                          key={label.name}
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            backgroundColor: `#${label.color}20`,
                            color: `#${label.color}`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
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
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      GitHub で開く →
                    </a>
                  </div>
                </div>

                <div className="ml-4">
                  {issue.state === 'open' && (
                    <button
                      onClick={() => handleExecuteAgent(issue)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      🤖 Agent実行
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-500">
        {filteredIssues.length} 件のIssue
      </div>
    </div>
  );
}
