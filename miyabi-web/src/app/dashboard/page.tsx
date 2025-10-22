'use client';

import { useAuthStore } from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || 'there'}! 👋
        </h2>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your autonomous agents
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Executions</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No active agent executions
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            100% success rate
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No failures detected
          </p>
        </div>
      </div>

      {/* Recent Executions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Agent Executions
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center py-12">
            <p className="text-gray-500">No agent executions yet</p>
            <p className="mt-2 text-sm text-gray-400">
              Connect a repository to start automating your workflow
            </p>
            <button className="mt-6 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Connect Repository
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🚀</span>
            <h4 className="text-lg font-semibold text-gray-900">
              Execute Agent
            </h4>
          </div>
          <p className="text-sm text-gray-600">
            Manually trigger an agent execution for a specific issue
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📊</span>
            <h4 className="text-lg font-semibold text-gray-900">
              View Workflows
            </h4>
          </div>
          <p className="text-sm text-gray-600">
            Create and manage your autonomous agent workflows
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">📈</span>
            <h4 className="text-lg font-semibold text-gray-900">
              Analytics
            </h4>
          </div>
          <p className="text-sm text-gray-600">
            View detailed analytics and performance metrics
          </p>
        </div>
      </div>
    </div>
  );
}
