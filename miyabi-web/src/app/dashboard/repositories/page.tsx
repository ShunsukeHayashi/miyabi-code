'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { fetchUserRepositories } from '@/lib/github';
import type { Repository, GitHubRepository } from '@/types/repository';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Star,
  Lock,
  Globe,
  Check,
  Settings,
  FileText,
} from 'lucide-react';

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
          <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto" />
          <p className="mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">リポジトリ管理</h2>
        <p className="mt-2 text-slate-600">
          GitHubリポジトリを接続してAgent自動化を開始
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'connected' | 'available')}>
        <TabsList>
          <TabsTrigger value="connected">
            接続済み ({repositories.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            利用可能 ({githubRepos.length})
          </TabsTrigger>
        </TabsList>

        {/* Connected Repositories */}
        <TabsContent value="connected" className="mt-6">
          <div className="space-y-4">
            {repositories.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-slate-500">接続されているリポジトリはありません</p>
                  <p className="mt-2 text-sm text-slate-400">
                    「利用可能」タブから接続してください
                  </p>
                </CardContent>
              </Card>
            ) : (
              repositories.map((repo) => (
                <Card key={repo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {repo.full_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          最終更新: {new Date(repo.updated_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => handleViewIssues(repo)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Issue一覧
                        </Button>
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          設定
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Available GitHub Repositories */}
        <TabsContent value="available" className="mt-6">
          <div className="space-y-4">
            {githubRepos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-slate-500">利用可能なリポジトリがありません</p>
                </CardContent>
              </Card>
            ) : (
              githubRepos.map((repo) => {
                const isConnected = repositories.some(
                  (r) => r.github_repo_id === repo.id
                );

                return (
                  <Card key={repo.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <img
                              src={repo.owner.avatar_url}
                              alt={repo.owner.login}
                              className="w-10 h-10 rounded"
                            />
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {repo.full_name}
                              </h3>
                              {repo.description && (
                                <p className="mt-1 text-sm text-slate-600">
                                  {repo.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
                            {repo.language && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {repo.language}
                              </Badge>
                            )}
                            <span className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-1">
                              {repo.private ? (
                                <>
                                  <Lock className="h-4 w-4" />
                                  Private
                                </>
                              ) : (
                                <>
                                  <Globe className="h-4 w-4" />
                                  Public
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                        <div>
                          {isConnected ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                              <Check className="h-4 w-4 mr-1" />
                              接続済み
                            </Badge>
                          ) : (
                            <Button onClick={() => handleConnectRepository(repo)}>
                              接続
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
