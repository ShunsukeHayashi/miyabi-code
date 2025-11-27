import React from 'react';
import { createRoot } from 'react-dom/client';
import { Package, GitBranch, Server, Activity, Cpu, HardDrive } from 'lucide-react';

interface ProjectStatus {
  branch: string;
  crates_count: number;
  mcp_servers: number;
  agents_total: number;
  agents_running: number;
  last_commit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  system?: {
    cpu_usage?: number;
    memory_usage?: number;
    disk_usage?: number;
  };
}

const ProjectStatusWidget: React.FC<{ data: ProjectStatus }> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Miyabi Project Status</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Branch</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{data.branch}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Crates</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{data.crates_count}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">MCP Servers</span>
          </div>
          <p className="text-lg font-bold text-gray-800">{data.mcp_servers}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Agents</span>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {data.agents_running}/{data.agents_total}
          </p>
        </div>
      </div>

      {data.system && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {data.system.cpu_usage !== undefined && (
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">CPU</span>
              </div>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-gray-800">
                  {data.system.cpu_usage.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500 mb-1">%</span>
              </div>
            </div>
          )}

          {data.system.memory_usage !== undefined && (
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600">Memory</span>
              </div>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-gray-800">
                  {data.system.memory_usage.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500 mb-1">%</span>
              </div>
            </div>
          )}

          {data.system.disk_usage !== undefined && (
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-600">Disk</span>
              </div>
              <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-gray-800">
                  {data.system.disk_usage.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500 mb-1">%</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Latest Commit</h3>
        <div className="font-mono">
          <p className="text-xs text-gray-500 mb-1">{data.last_commit.hash.substring(0, 7)}</p>
          <p className="text-sm text-gray-800 mb-2">{data.last_commit.message}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{data.last_commit.author}</span>
            <span>{new Date(data.last_commit.date).toLocaleDateString()}</span>
          </div>
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
      root.render(<ProjectStatusWidget data={data} />);
    }
  });
}

export default ProjectStatusWidget;
