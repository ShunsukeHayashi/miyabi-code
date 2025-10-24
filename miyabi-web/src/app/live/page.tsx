'use client';

import { useEffect, useState } from 'react';
import { useWebSocket, type AgentEvent } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Wifi, WifiOff, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExecutionState {
  execution_id: string;
  repository_id: string;
  issue_number: number;
  agent_type: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  last_message: string;
  started_at: string;
  completed_at?: string;
  quality_score?: number;
  pr_number?: number;
  error?: string;
}

export default function LiveDashboardPage() {
  const { status, lastEvent } = useWebSocket({ autoReconnect: true });
  const [executions, setExecutions] = useState<Map<string, ExecutionState>>(new Map());

  // Update executions based on events
  useEffect(() => {
    if (!lastEvent) return;

    setExecutions((prev) => {
      const updated = new Map(prev);

      switch (lastEvent.type) {
        case 'execution_started':
          updated.set(lastEvent.execution_id, {
            execution_id: lastEvent.execution_id,
            repository_id: lastEvent.repository_id,
            issue_number: lastEvent.issue_number,
            agent_type: lastEvent.agent_type,
            status: 'running',
            progress: 0,
            last_message: 'Starting execution...',
            started_at: lastEvent.timestamp,
          });
          break;

        case 'execution_progress':
          const progressExec = updated.get(lastEvent.execution_id);
          if (progressExec) {
            updated.set(lastEvent.execution_id, {
              ...progressExec,
              progress: lastEvent.progress,
              last_message: lastEvent.message,
            });
          }
          break;

        case 'execution_completed':
          const completedExec = updated.get(lastEvent.execution_id);
          if (completedExec) {
            updated.set(lastEvent.execution_id, {
              ...completedExec,
              status: 'completed',
              progress: 100,
              completed_at: lastEvent.timestamp,
              quality_score: lastEvent.quality_score,
              pr_number: lastEvent.pr_number,
              last_message: 'Execution completed successfully',
            });
          }
          break;

        case 'execution_failed':
          const failedExec = updated.get(lastEvent.execution_id);
          if (failedExec) {
            updated.set(lastEvent.execution_id, {
              ...failedExec,
              status: 'failed',
              completed_at: lastEvent.timestamp,
              error: lastEvent.error,
              last_message: `Failed: ${lastEvent.error}`,
            });
          }
          break;

        case 'execution_log':
          const logExec = updated.get(lastEvent.execution_id);
          if (logExec && logExec.status === 'running') {
            updated.set(lastEvent.execution_id, {
              ...logExec,
              last_message: lastEvent.message,
            });
          }
          break;
      }

      return updated;
    });
  }, [lastEvent]);

  const executionsList = Array.from(executions.values()).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  const runningCount = executionsList.filter((e) => e.status === 'running').length;
  const completedCount = executionsList.filter((e) => e.status === 'completed').length;
  const failedCount = executionsList.filter((e) => e.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            Live Agent Monitoring
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time updates for all agent executions
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {status === 'connected' ? (
            <>
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Connected</span>
            </>
          ) : status === 'connecting' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{runningCount}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{completedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{failedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executions List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
            Active Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executionsList.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-600">No active executions</p>
              <p className="text-xs text-gray-500 mt-1">
                Waiting for agent executions to start...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {executionsList.map((execution) => (
                <div
                  key={execution.execution_id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          #{execution.issue_number}
                        </span>
                        <span className="text-sm text-gray-600">
                          {execution.agent_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            execution.status === 'running'
                              ? 'bg-blue-50 text-blue-700'
                              : execution.status === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {execution.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(execution.started_at), 'MMM d, HH:mm:ss')}
                      </p>
                    </div>

                    {execution.quality_score && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Quality</p>
                        <p className="text-sm font-medium text-gray-900">
                          {execution.quality_score}/100
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {execution.status === 'running' && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-gray-900">
                          {execution.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${execution.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Last Message */}
                  <p className="text-sm text-gray-600 truncate">
                    {execution.last_message}
                  </p>

                  {/* Additional Info */}
                  {execution.pr_number && (
                    <p className="text-xs text-gray-500 mt-1">
                      PR #{execution.pr_number} created
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
