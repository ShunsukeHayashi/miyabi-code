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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.name || 'there'}!
        </h2>
        <p className="mt-2 text-slate-600">
          Here's what's happening with your autonomous agents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Active Executions
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No active agent executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Completed Today
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">100% success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Failed</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">No failures detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500">No agent executions yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Connect a repository to start automating your workflow
            </p>
            <Button className="mt-6">Connect Repository</Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Rocket className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                Execute Agent
              </h4>
            </div>
            <p className="text-sm text-slate-600">
              Manually trigger an agent execution for a specific issue
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Workflow className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                View Workflows
              </h4>
            </div>
            <p className="text-sm text-slate-600">
              Create and manage your autonomous agent workflows
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900">
                Analytics
              </h4>
            </div>
            <p className="text-sm text-slate-600">
              View detailed analytics and performance metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
