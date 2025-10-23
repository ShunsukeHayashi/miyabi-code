'use client';

import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Rocket,
  Workflow,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-16">
      <div>
        <h2 className="text-6xl font-semibold tracking-tight text-gray-900 mb-4">
          Welcome back, {user?.name || 'there'}!
        </h2>
        <p className="text-lg text-gray-600">
          Here's what's happening with your autonomous agents
        </p>
      </div>

      {/* Summary Cards - Ive Style: グレースケールのみ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="border border-gray-200 transition-colors hover:bg-gray-50">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">
                  Active Executions
                </p>
                <p className="text-5xl font-extralight text-gray-900">0</p>
              </div>
              <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                <Activity className="h-7 w-7 text-gray-900" />
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No active agent executions
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 transition-colors hover:bg-gray-50">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">
                  Completed Today
                </p>
                <p className="text-5xl font-extralight text-gray-900">0</p>
              </div>
              <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-gray-900" />
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500">100% success rate</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 transition-colors hover:bg-gray-50">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Failed</p>
                <p className="text-5xl font-extralight text-gray-900">0</p>
              </div>
              <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-7 w-7 text-gray-900" />
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500">No failures detected</p>
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
          <div className="text-center py-20">
            <p className="text-lg text-gray-600 font-light">No agent executions yet</p>
            <p className="mt-3 text-base text-gray-500">
              Connect a repository to start automating your workflow
            </p>
            <Button className="mt-8 bg-gray-900 hover:bg-gray-800 text-white transition-colors">
              Connect Repository
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Ive Style: グレースケールのみ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="group" aria-label="Quick actions">
        <Card
          className="border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Execute agent for specific issue"
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
