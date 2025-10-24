'use client';

import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toDataAttributes, CommonMetadata } from '@/lib/ai-metadata';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Rocket,
  Workflow,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface DashboardSummary {
  total_executions: number;
  running_executions: number;
  completed_executions: number;
  failed_executions: number;
  pending_executions: number;
  total_repositories: number;
  total_prs_created: number;
}

interface RecentExecution {
  execution: {
    id: string;
    repository_id: string;
    issue_number: number;
    agent_type: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    result_summary?: any;
    quality_score?: number;
    pr_number?: number;
    created_at: string;
    updated_at: string;
  };
  repository_owner: string;
  repository_name: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Fetch dashboard summary
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch recent executions
  const { data: recentExecutions, isLoading: executionsLoading } = useQuery<
    RecentExecution[]
  >({
    queryKey: ['dashboard', 'recent'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return (
    <div
      className="space-y-16"
      {...toDataAttributes({
        role: 'container',
        target: 'dashboard-main-container',
        description: 'Main dashboard container with agent execution statistics and quick actions',
        context: 'dashboard-page',
      })}
    >
      <div
        {...toDataAttributes({
          role: 'header',
          target: 'dashboard-welcome-header',
          description: 'Welcome header displaying user name and dashboard purpose',
          context: 'dashboard-page',
        })}
      >
        <h2 className="text-6xl font-semibold tracking-tight text-gray-900 mb-4">
          Welcome back, {user?.name || 'there'}!
        </h2>
        <p className="text-lg text-gray-600">
          Here's what's happening with your autonomous agents
        </p>
      </div>

      {/* Summary Cards - Ive Style: グレースケールのみ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card
          className="border border-gray-200 transition-colors hover:bg-gray-50"
          {...toDataAttributes(
            CommonMetadata.summaryCard('Active Executions', 'dashboard-statistics')
          )}
        >
          <CardContent className="p-8">
            {summaryLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Active Executions
                    </p>
                    <p className="text-5xl font-extralight text-gray-900">
                      {summary?.running_executions ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Activity className="h-7 w-7 text-gray-900" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  {summary?.running_executions === 0
                    ? 'No active agent executions'
                    : `${summary?.pending_executions ?? 0} pending`}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-colors hover:bg-gray-50"
          {...toDataAttributes(
            CommonMetadata.summaryCard('Completed', 'dashboard-statistics')
          )}
        >
          <CardContent className="p-8">
            {summaryLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">
                      Completed
                    </p>
                    <p className="text-5xl font-extralight text-gray-900">
                      {summary?.completed_executions ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-gray-900" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  {summary?.total_prs_created ?? 0} PRs created
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 transition-colors hover:bg-gray-50"
          {...toDataAttributes(
            CommonMetadata.summaryCard('Failed', 'dashboard-statistics')
          )}
        >
          <CardContent className="p-8">
            {summaryLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-3">Failed</p>
                    <p className="text-5xl font-extralight text-gray-900">
                      {summary?.failed_executions ?? 0}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-gray-900" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500">
                  {summary?.failed_executions === 0
                    ? 'No failures detected'
                    : `${summary?.total_executions ?? 0} total executions`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
            Recent Agent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executionsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
            </div>
          ) : !recentExecutions || recentExecutions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-gray-600 font-light">No agent executions yet</p>
              <p className="mt-3 text-base text-gray-500">
                Connect a repository to start automating your workflow
              </p>
              <Button
                className="mt-8 bg-gray-900 hover:bg-gray-800 text-white transition-colors"
                onClick={() => router.push('/dashboard/repositories')}
                {...toDataAttributes(CommonMetadata.connectRepositoryButton())}
              >
                Connect Repository
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentExecutions.map((item) => (
                <div
                  key={item.execution.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/executions/${item.execution.id}`)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {item.repository_owner}/{item.repository_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        #{item.execution.issue_number}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.execution.status === 'completed'
                            ? 'bg-green-50 text-green-700'
                            : item.execution.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : item.execution.status === 'running'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {item.execution.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Agent: {item.execution.agent_type}
                      {item.execution.quality_score && (
                        <span className="ml-3">
                          Quality: {item.execution.quality_score}/100
                        </span>
                      )}
                      {item.execution.pr_number && (
                        <span className="ml-3">PR #{item.execution.pr_number}</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {format(new Date(item.execution.created_at), 'MMM d, HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Ive Style: グレースケールのみ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="group" aria-label="Quick actions">
        <Card
          className="border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Execute agent for specific issue"
          onClick={() => router.push('/dashboard/repositories')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push('/dashboard/repositories');
            }
          }}
          {...toDataAttributes({
            role: 'card',
            action: 'click',
            target: 'quick-action-execute-agent',
            description: 'Quick action: Navigate to issues page to execute agent on specific issue',
            context: 'dashboard-quick-actions',
            expectedResult: 'navigate-to-page',
            navigationTarget: '/dashboard/repositories',
            instructions: 'STEP 1: Click this card to navigate to repositories page. STEP 2: Select a repository. STEP 3: View issues list. STEP 4: Click Execute Agent button for desired issue.',
            nextActions: 'After navigation, user should see repositories list. Select repository to view issues and execute agents.',
          })}
        >
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center" aria-hidden="true">
                <Rocket className="h-6 w-6 text-gray-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Execute Agent
              </h4>
            </div>
            <p className="text-base text-gray-600 font-light">
              Manually trigger an agent execution for a specific issue
            </p>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="View and manage workflows"
          onClick={() => router.push('/dashboard/workflows')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push('/dashboard/workflows');
            }
          }}
          {...toDataAttributes({
            role: 'card',
            action: 'click',
            target: 'quick-action-view-workflows',
            description: 'Quick action: Navigate to workflows page to create and manage autonomous agent workflows',
            context: 'dashboard-quick-actions',
            expectedResult: 'navigate-to-page',
            navigationTarget: '/dashboard/workflows',
            instructions: 'STEP 1: Click this card to navigate to workflows page. STEP 2: View list of existing workflows. STEP 3: Create new workflows or edit existing ones.',
            nextActions: 'After navigation, user can view, create, edit, or delete workflows. Workflows define multi-step automation processes for agents.',
          })}
        >
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center" aria-hidden="true">
                <Workflow className="h-6 w-6 text-gray-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                View Workflows
              </h4>
            </div>
            <p className="text-base text-gray-600 font-light">
              Create and manage your autonomous agent workflows
            </p>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="View analytics and performance metrics"
          onClick={() => router.push('/dashboard/analytics')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push('/dashboard/analytics');
            }
          }}
          {...toDataAttributes({
            role: 'card',
            action: 'click',
            target: 'quick-action-analytics',
            description: 'Quick action: Navigate to analytics page to view detailed performance metrics and statistics',
            context: 'dashboard-quick-actions',
            expectedResult: 'navigate-to-page',
            navigationTarget: '/dashboard/analytics',
            instructions: 'STEP 1: Click this card to navigate to analytics page. STEP 2: View comprehensive analytics dashboard with agent performance, success rates, execution times, and trends.',
            nextActions: 'After navigation, user can view charts, graphs, and detailed metrics about agent executions, quality scores, deployment success rates, and system health.',
          })}
        >
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center" aria-hidden="true">
                <TrendingUp className="h-6 w-6 text-gray-900" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900">
                Analytics
              </h4>
            </div>
            <p className="text-base text-gray-600 font-light">
              View detailed analytics and performance metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
