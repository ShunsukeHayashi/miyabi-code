import React from 'react';
import { createRoot } from 'react-dom/client';
import { Circle, CheckCircle, GitBranch, Tag, User } from 'lucide-react';

interface Issue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  assignee?: string;
  url: string;
  created_at: string;
}

interface IssueListData {
  issues: Issue[];
  repository: string;
}

const IssueListWidget: React.FC<{ data: IssueListData }> = ({ data }) => {
  const getStateIcon = (state: string) => {
    return state === 'open' ? (
      <Circle className="w-4 h-4 text-green-500" />
    ) : (
      <CheckCircle className="w-4 h-4 text-purple-500" />
    );
  };

  const getLabelColor = (label: string): string => {
    // Simple hash-based color generation
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 85%)`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <GitBranch className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-bold text-gray-800">
          {data.repository}
        </h3>
        <span className="ml-auto text-sm text-gray-500">
          {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {data.issues.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No issues found</p>
        ) : (
          data.issues.map((issue) => (
            <div
              key={issue.number}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {getStateIcon(issue.state)}
                <div className="flex-1 min-w-0">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {issue.title}
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    #{issue.number} opened{' '}
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>

                  {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {issue.labels.map((label, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: getLabelColor(label) }}
                        >
                          <Tag className="w-3 h-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  {issue.assignee && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                      <User className="w-3 h-3" />
                      <span>{issue.assignee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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
      const data = dataElement ? JSON.parse(dataElement.textContent || '{}') : { issues: [] };
      const root = createRoot(container);
      root.render(<IssueListWidget data={data} />);
    }
  });
}

export default IssueListWidget;
