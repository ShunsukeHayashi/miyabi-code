/**
 * Execution Status Page
 *
 * Displays real-time agent execution status and logs
 *
 * TODO: Implement the following features:
 * 1. Fetch execution details from /api/v1/agents/executions/:id
 * 2. Display execution status (pending, running, completed, failed)
 * 3. Show progress bar / loading indicator
 * 4. Display elapsed time counter
 * 5. WebSocket connection to /ws?execution_id=:id
 * 6. Real-time log display with auto-scroll
 * 7. Log level filtering (INFO, WARN, ERROR, DEBUG)
 * 8. Display execution result summary on completion
 * 9. Link to created PR (if applicable)
 *
 * WebSocket Message Format:
 * {
 *   "id": "uuid",
 *   "execution_id": "uuid",
 *   "log_level": "INFO",
 *   "message": "Log message",
 *   "timestamp": "2025-10-24T00:00:00Z",
 *   "metadata": {}
 * }
 *
 * Completion Message:
 * {
 *   "type": "execution_complete",
 *   "status": "completed" | "failed"
 * }
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface ExecutionLog {
  id: string;
  execution_id: string;
  log_level: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface Execution {
  id: string;
  repository_id: string;
  issue_number: number;
  agent_type: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  result_summary?: Record<string, any>;
  quality_score?: number;
  pr_number?: number;
  created_at: string;
  updated_at: string;
}

export default function ExecutionStatusPage() {
  const params = useParams();
  const executionId = params.id as string;

  const [execution, setExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');

  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // TODO: Fetch execution details
    console.log('TODO: Fetch execution', executionId);

    // TODO: Establish WebSocket connection
    // const ws = new WebSocket(`ws://localhost:8080/api/v1/ws?execution_id=${executionId}`);
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   if (data.type === 'execution_complete') {
    //     // Handle completion
    //   } else {
    //     setLogs(prev => [...prev, data]);
    //   }
    // };
    // wsRef.current = ws;

    // return () => ws?.close();
  }, [executionId]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(
    (log) => logFilter === 'all' || log.log_level === logFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600';
      case 'WARN':
        return 'text-yellow-600';
      case 'INFO':
        return 'text-blue-600';
      case 'DEBUG':
        return 'text-gray-600';
      default:
        return 'text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading execution...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-xl">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Agent Execution</h1>
        <p className="text-gray-600">Execution ID: {executionId}</p>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <p className={`font-semibold ${getStatusColor(execution?.status || 'pending')}`}>
              {execution?.status || 'pending'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Agent Type</p>
            <p className="font-semibold">{execution?.agent_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Issue</p>
            <p className="font-semibold">#{execution?.issue_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Elapsed Time</p>
            <p className="font-semibold">TODO</p>
          </div>
        </div>
      </div>

      {/* Log Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Execution Logs</h2>
          <div className="flex space-x-2">
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md"
            >
              <option value="all">All Logs</option>
              <option value="ERROR">Errors</option>
              <option value="WARN">Warnings</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-900 text-gray-100 rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <p className="text-gray-500">No logs available yet...</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="mb-1">
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>{' '}
                <span className={getLogLevelColor(log.log_level)}>
                  [{log.log_level}]
                </span>{' '}
                <span>{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Result Summary (shown on completion) */}
      {execution?.status === 'completed' && execution.result_summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-green-800 mb-4">
            Execution Completed Successfully
          </h2>
          <div className="space-y-2">
            {execution.pr_number && (
              <p className="text-green-700">
                Pull Request: #{execution.pr_number}
              </p>
            )}
            {execution.quality_score && (
              <p className="text-green-700">
                Quality Score: {execution.quality_score}/100
              </p>
            )}
          </div>
        </div>
      )}

      {execution?.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-red-800 mb-4">
            Execution Failed
          </h2>
          <p className="text-red-700">
            TODO: Display error details
          </p>
        </div>
      )}
    </div>
  );
}
