export type LogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';

export interface Log {
  id: string;
  timestamp: string;
  level: LogLevel;
  agent_type?: string;
  message: string;
  context?: string;
  issue_number?: number;
  session_id: string;
  file?: string;
  line?: number;
}

export interface LogsListResponse {
  logs: Log[];
  total: number;
}

export interface LogFilter {
  level?: LogLevel;
  agent_type?: string;
  issue_number?: number;
  search?: string;
  start_time?: string;
  end_time?: string;
}
