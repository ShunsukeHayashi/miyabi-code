'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  agent_type?: string;
  message: string;
  context?: string;
  issue_number?: number;
  session_id: string;
  file?: string;
  line?: number;
}

interface LogViewerProps {
  /** WebSocket URL for log streaming */
  wsUrl?: string;
  /** Initial logs to display */
  initialLogs?: LogEntry[];
  /** Maximum number of logs to keep in buffer */
  maxLogs?: number;
  /** Height of the log viewer */
  height?: number;
}

const LogViewer: React.FC<LogViewerProps> = ({
  wsUrl = 'ws://localhost:3000/api/v1/ws',
  initialLogs = [],
  maxLogs = 1000,
  height = 600,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(initialLogs);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const listRef = useRef<List>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const autoScrollRef = useRef<boolean>(autoScroll);

  // Update autoScrollRef when autoScroll changes
  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  // Extract unique agent names from logs
  const agentNames = Array.from(
    new Set(logs.map((log) => log.agent_type).filter(Boolean))
  ).sort();

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    // Filter by agent
    if (agentFilter !== 'all') {
      filtered = filtered.filter((log) => log.agent_type === agentFilter);
    }

    // Filter by level
    if (levelFilter !== 'all') {
      filtered = filtered.filter((log) => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  }, [logs, agentFilter, levelFilter]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScrollRef.current && listRef.current && filteredLogs.length > 0) {
      listRef.current.scrollToItem(filteredLogs.length - 1, 'end');
    }
  }, [filteredLogs]);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Handle log_entry messages
        if (message.type === 'log_entry') {
          const logEntry: LogEntry = {
            id: message.id,
            timestamp: message.timestamp,
            level: message.level as LogEntry['level'],
            agent_type: message.agent_type,
            message: message.message,
            context: message.context,
            issue_number: message.issue_number,
            session_id: message.session_id,
            file: message.file,
            line: message.line,
          };

          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, logEntry];
            // Keep only last maxLogs entries
            if (newLogs.length > maxLogs) {
              return newLogs.slice(-maxLogs);
            }
            return newLogs;
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl, maxLogs]);

  // Get log level color
  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      case 'WARN':
        return 'text-yellow-600 bg-yellow-50';
      case 'DEBUG':
        return 'text-gray-600 bg-gray-50';
      case 'INFO':
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  // Get log level badge color
  const getLevelBadgeColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-600 text-white';
      case 'WARN':
        return 'bg-yellow-600 text-white';
      case 'DEBUG':
        return 'bg-gray-600 text-white';
      case 'INFO':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      });
    } catch {
      return timestamp;
    }
  };

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Row renderer for virtualized list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];

    return (
      <div
        style={style}
        className={`px-4 py-2 border-b border-gray-200 font-mono text-xs ${getLevelColor(
          log.level
        )}`}
      >
        <div className="flex items-start gap-2">
          <span className="text-gray-500 flex-shrink-0">
            {formatTimestamp(log.timestamp)}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${getLevelBadgeColor(
              log.level
            )}`}
          >
            {log.level}
          </span>
          {log.agent_type && (
            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium flex-shrink-0">
              {log.agent_type}
            </span>
          )}
          <span className="flex-1 break-all">{log.message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Agent Logs</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Agent filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Agent:</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Agents</option>
              {agentNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Level filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Auto-scroll</span>
          </label>

          {/* Clear button */}
          <button
            onClick={clearLogs}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear Logs
          </button>
        </div>

        {/* Log count */}
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} logs
          {logs.length >= maxLogs && (
            <span className="ml-2 text-yellow-600">
              (Max {maxLogs} logs, older logs are removed)
            </span>
          )}
        </div>
      </div>

      {/* Log list */}
      <div className="bg-gray-50">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No logs to display
          </div>
        ) : (
          <List
            ref={listRef}
            height={height}
            itemCount={filteredLogs.length}
            itemSize={60}
            width="100%"
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
