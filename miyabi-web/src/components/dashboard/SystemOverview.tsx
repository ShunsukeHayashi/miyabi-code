/**
 * SystemOverview Component
 *
 * Displays agent system status with worker/coordinator counts
 * Issue: #970 Phase 3.2 - Dashboard Components
 */

'use client';

import { useSystemOverview, useAgentStatusCounts } from '@/hooks/useAgents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, subtitle, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="text-center p-4 rounded-lg bg-muted/50">
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

export function SystemOverview() {
  const { data: overview, isLoading, error } = useSystemOverview();
  const { data: statusCounts } = useAgentStatusCounts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load system overview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Overview</span>
          <span className="text-sm font-normal text-muted-foreground">
            {overview?.total_agents ?? 0} Total Agents
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Status */}
        <div>
          <h4 className="text-sm font-medium mb-3">Agent Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Running"
              value={statusCounts?.running ?? 0}
              variant="success"
            />
            <StatCard
              title="Idle"
              value={statusCounts?.idle ?? 0}
              variant="default"
            />
            <StatCard
              title="Busy"
              value={statusCounts?.busy ?? 0}
              variant="warning"
            />
            <StatCard
              title="Error"
              value={statusCounts?.error ?? 0}
              variant="danger"
            />
          </div>
        </div>

        {/* Layer Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Layer Distribution</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Coordinators (L3)</span>
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {overview?.coordinators.active ?? 0} active
                </span>
              </div>
              <p className="text-2xl font-bold">{overview?.coordinators.total ?? 0}</p>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Workers (L4)</span>
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  {overview?.workers.active ?? 0} active
                </span>
              </div>
              <p className="text-2xl font-bold">{overview?.workers.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {overview?.workers.idle ?? 0} idle
              </p>
            </div>
          </div>
        </div>

        {/* Agent Categories */}
        <div>
          <h4 className="text-sm font-medium mb-3">Agent Categories</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Coding Agents</span>
                <span className="text-xs text-muted-foreground">
                  {overview?.coding_agents.active ?? 0}/{overview?.coding_agents.total ?? 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {overview?.coding_agents.names.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="text-xs bg-muted px-2 py-0.5 rounded"
                  >
                    {name.replace('Agent', '')}
                  </span>
                ))}
                {(overview?.coding_agents.names.length ?? 0) > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{(overview?.coding_agents.names.length ?? 0) - 4} more
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Business Agents</span>
                <span className="text-xs text-muted-foreground">
                  {overview?.business_agents.active ?? 0}/{overview?.business_agents.total ?? 0}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {overview?.business_agents.names.slice(0, 4).map((name) => (
                  <span
                    key={name}
                    className="text-xs bg-muted px-2 py-0.5 rounded"
                  >
                    {name.replace('Agent', '')}
                  </span>
                ))}
                {(overview?.business_agents.names.length ?? 0) > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{(overview?.business_agents.names.length ?? 0) - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
