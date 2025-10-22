'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { fetchUserRepositories } from '@/lib/github';
import type { Repository, GitHubRepository } from '@/types/repository';

export default function RepositoriesPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load connected repositories from backend
      const reposResponse = await api.get<Repository[]>('/repositories');
      setRepositories(reposResponse.data);

      // Load available GitHub repositories
      if (accessToken) {
        const githubReposData = await fetchUserRepositories(accessToken);
        setGithubRepos(githubReposData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'リポジトリの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectRepository = async (githubRepo: GitHubRepository) => {
    try {
      await api.post('/repositories', {
        full_name: githubRepo.full_name,
      });
      await loadData();
      setActiveTab('connected');
    } catch (err: any) {
      alert(err.response?.data?.message || 'リポジトリの接続に失敗しました');
    }
  };

  const handleViewIssues = (repo: Repository) => {
    router.push(`/dashboard/repositories/${repo.id}/issues`);
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">リポジトリ管理</h2>
        <p className="mt-2 text-gray-600">
          GitHubリポジトリを接続してAgent自動化を開始
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connected')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connected'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            接続済み ({repositories.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'available'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            利用可能 ({githubRepos.length})
          </button>
        </nav>
      </div>

      {/* Connected Repositories */}
      {activeTab === 'connected' && (
        <div className="space-y-4">
          {repositories.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">接続されているリポジトリはありません</p>
              <p className="mt-2 text-sm text-gray-400">
                「利用可能」タブから接続してください
              </p>
            </div>
          ) : (
            repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {repo.full_name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      最終更新: {new Date(repo.updated_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewIssues(repo)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Issue一覧
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      設定
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Available GitHub Repositories */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {githubRepos.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500">利用可能なリポジトリがありません</p>
            </div>
          ) : (
            githubRepos.map((repo) => {
              const isConnected = repositories.some(
                (r) => r.github_repo_id === repo.id
              );

              return (
                <div
                  key={repo.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <img
                          src={repo.owner.avatar_url}
                          alt={repo.owner.login}
                          className="w-10 h-10 rounded"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {repo.full_name}
                          </h3>
                          {repo.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            {repo.language}
                          </span>
                        )}
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>
                          {repo.private ? '🔒 Private' : '🌍 Public'}
                        </span>
                      </div>
                    </div>
                    <div>
                      {isConnected ? (
                        <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                          ✓ 接続済み
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnectRepository(repo)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          接続
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
