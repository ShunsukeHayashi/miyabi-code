import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, XCircle, Clock, Terminal, FileText } from 'lucide-react';

interface AgentResult {
  agent: string;
  status: 'success' | 'error' | 'running';
  output?: string;
  files_changed?: string[];
  commits?: string[];
  duration_ms?: number;
  error?: string;
}

const AgentResultWidget: React.FC<{ data: AgentResult }> = ({ data }) => {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'running':
        return <Clock className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'success':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'running':
        return 'border-blue-500 bg-blue-50';
    }
  };

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-md ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">
            {data.agent}
          </h3>
          <p className="text-sm text-gray-600 capitalize">
            Status: {data.status}
          </p>

          {data.duration_ms && (
            <p className="text-xs text-gray-500 mt-1">
              Duration: {(data.duration_ms / 1000).toFixed(2)}s
            </p>
          )}

          {data.output && (
            <div className="mt-3 bg-gray-900 text-green-400 p-3 rounded-md font-mono text-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4" />
                <span className="text-xs text-gray-400">Output</span>
              </div>
              <pre className="whitespace-pre-wrap">{data.output}</pre>
            </div>
          )}

          {data.error && (
            <div className="mt-3 bg-red-100 border border-red-300 text-red-800 p-3 rounded-md text-sm">
              <strong>Error:</strong> {data.error}
            </div>
          )}

          {data.files_changed && data.files_changed.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Files Changed ({data.files_changed.length})
                </span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                {data.files_changed.map((file, idx) => (
                  <li key={idx} className="font-mono text-xs">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.commits && data.commits.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-semibold text-gray-700">
                Commits ({data.commits.length})
              </span>
              <ul className="text-sm text-gray-600 space-y-1 mt-1">
                {data.commits.map((commit, idx) => (
                  <li key={idx} className="font-mono text-xs">
                    {commit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Auto-mount when loaded by MCP
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    if (container) {
      const dataElement = document.getElementById('widget-data');
      const data = dataElement ? JSON.parse(dataElement.textContent || '{}') : {};
      const root = createRoot(container);
      root.render(<AgentResultWidget data={data} />);
    }
  });
}

export default AgentResultWidget;
