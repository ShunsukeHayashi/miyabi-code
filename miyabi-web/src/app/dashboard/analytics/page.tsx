'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toDataAttributes } from '@/lib/ai-metadata';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Target,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description: string;
}

interface AgentStat {
  name: string;
  executions: number;
  successRate: number;
  avgTime: string;
  status: 'excellent' | 'good' | 'warning';
}

export default function AnalyticsPage() {
  const metrics: MetricCard[] = [
    {
      id: 'total-executions',
      title: 'Total Executions',
      value: 1247,
      change: 12.5,
      trend: 'up',
      icon: Activity,
      description: '過去30日間のAgent実行総数',
    },
    {
      id: 'success-rate',
      title: 'Success Rate',
      value: '94.8%',
      change: 2.3,
      trend: 'up',
      icon: CheckCircle2,
      description: '全Agent実行の成功率',
    },
    {
      id: 'avg-execution-time',
      title: 'Avg Execution Time',
      value: '3.2s',
      change: -8.1,
      trend: 'up',
      icon: Clock,
      description: '平均実行時間（短いほど良い）',
    },
    {
      id: 'quality-score',
      title: 'Quality Score',
      value: 87,
      change: 5.2,
      trend: 'up',
      icon: Award,
      description: '平均コード品質スコア（100点満点）',
    },
    {
      id: 'deployment-success',
      title: 'Deployment Success',
      value: '98.5%',
      change: 1.2,
      trend: 'up',
      icon: Zap,
      description: 'デプロイ成功率',
    },
    {
      id: 'active-issues',
      title: 'Active Issues',
      value: 23,
      change: -15.3,
      trend: 'up',
      icon: Target,
      description: '現在処理中のIssue数',
    },
  ];

  const agentStats: AgentStat[] = [
    {
      name: 'CoordinatorAgent',
      executions: 342,
      successRate: 96.5,
      avgTime: '2.1s',
      status: 'excellent',
    },
    {
      name: 'CodeGenAgent',
      executions: 418,
      successRate: 92.3,
      avgTime: '5.8s',
      status: 'good',
    },
    {
      name: 'ReviewAgent',
      executions: 287,
      successRate: 97.2,
      avgTime: '3.4s',
      status: 'excellent',
    },
    {
      name: 'DeploymentAgent',
      executions: 156,
      successRate: 98.7,
      avgTime: '12.3s',
      status: 'excellent',
    },
    {
      name: 'PRAgent',
      executions: 89,
      successRate: 88.8,
      avgTime: '4.2s',
      status: 'warning',
    },
    {
      name: 'IssueAgent',
      executions: 201,
      successRate: 94.1,
      avgTime: '1.9s',
      status: 'good',
    },
  ];

  const getStatusBadgeColor = (status: AgentStat['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
    }
  };

  const getStatusLabel = (status: AgentStat['status']) => {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'warning':
        return 'Needs Attention';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div
        {...toDataAttributes({
          role: 'header',
          target: 'analytics-page-header',
          description: 'Analytics page header with title and description',
          context: 'analytics-page',
        })}
      >
        <h2 className="text-5xl font-semibold tracking-tight text-gray-900 mb-3">
          Analytics
        </h2>
        <p className="text-lg text-gray-600">
          Agent実行パフォーマンス・品質メトリクス・システム健全性の可視化
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const trendUp = metric.trend === 'up';
          const TrendIcon = trendUp ? TrendingUp : TrendingDown;

          return (
            <Card
              key={metric.id}
              className="border border-gray-200 transition-colors hover:bg-gray-50"
              {...toDataAttributes({
                role: 'card',
                target: `metric-card-${metric.id}`,
                description: `${metric.title}: ${metric.value}, ${metric.change > 0 ? '+' : ''}${metric.change}% change`,
                context: 'analytics-metrics',
              })}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-gray-900" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      trendUp ? 'text-green-600' : 'text-red-600'
                    }`}
                    {...toDataAttributes({
                      role: 'badge',
                      target: `metric-trend-${metric.id}`,
                      description: `Trend indicator: ${metric.change > 0 ? '+' : ''}${metric.change}%`,
                      context: 'metric-card',
                      state: metric.trend,
                    })}
                  >
                    <TrendIcon className="h-4 w-4" />
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  {metric.title}
                </h3>
                <p className="text-4xl font-extralight text-gray-900 mb-2">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-500">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agent Statistics */}
      <Card
        className="border border-gray-200"
        {...toDataAttributes({
          role: 'card',
          target: 'agent-statistics-card',
          description: `Agent performance statistics for ${agentStats.length} agents`,
          context: 'analytics-page',
        })}
      >
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
            Agent Performance
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            各Agent種別のパフォーマンス指標
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentStats.map((agent) => (
              <div
                key={agent.name}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                {...toDataAttributes({
                  role: 'list-item',
                  target: `agent-stat-${agent.name.toLowerCase()}`,
                  description: `${agent.name}: ${agent.executions} executions, ${agent.successRate}% success rate, ${agent.avgTime} avg time`,
                  context: 'agent-statistics',
                  state: agent.status,
                })}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {agent.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeColor(agent.status)}
                      {...toDataAttributes({
                        role: 'badge',
                        target: `agent-status-${agent.name.toLowerCase()}`,
                        description: `Status: ${getStatusLabel(agent.status)}`,
                        context: 'agent-statistics',
                        state: agent.status,
                      })}
                    >
                      {getStatusLabel(agent.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">実行回数</p>
                      <p className="text-lg font-medium text-gray-900">
                        {agent.executions}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">成功率</p>
                      <p className="text-lg font-medium text-gray-900">
                        {agent.successRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">平均時間</p>
                      <p className="text-lg font-medium text-gray-900">
                        {agent.avgTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="border border-gray-200"
          {...toDataAttributes({
            role: 'card',
            target: 'system-health-card',
            description: 'System health indicators and status',
            context: 'analytics-page',
          })}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    API Status
                  </span>
                </div>
                <Badge
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  {...toDataAttributes({
                    role: 'badge',
                    target: 'api-status-badge',
                    description: 'API status: Healthy',
                    context: 'system-health',
                    state: 'healthy',
                  })}
                >
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Database
                  </span>
                </div>
                <Badge
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  {...toDataAttributes({
                    role: 'badge',
                    target: 'database-status-badge',
                    description: 'Database status: Connected',
                    context: 'system-health',
                    state: 'connected',
                  })}
                >
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-900">
                    GitHub API Rate Limit
                  </span>
                </div>
                <span className="text-sm text-gray-600">4,832 / 5,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="border border-gray-200"
          {...toDataAttributes({
            role: 'card',
            target: 'recent-errors-card',
            description: 'Recent errors and warnings',
            context: 'analytics-page',
          })}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-base text-gray-600 font-light">
                No errors in the last 24 hours
              </p>
              <p className="mt-2 text-sm text-gray-500">
                System is running smoothly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div
        className="text-center text-sm text-gray-500"
        {...toDataAttributes({
          role: 'section',
          target: 'analytics-summary',
          description: 'Analytics page summary and last updated timestamp',
          context: 'analytics-page',
        })}
      >
        データは30日間の実行結果に基づいています • 最終更新: {new Date().toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
