/**
 * Error recovery types for Miyabi A2A Dashboard
 *
 * These types match the Rust API types defined in:
 * - crates/miyabi-a2a/src/http/routes.rs
 * - crates/miyabi-a2a/src/http/websocket.rs
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Error information from WebSocket events
 */
export interface ErrorInfo {
  /** Unique error ID */
  id: string;
  /** Associated task ID (if any) */
  task_id?: string;
  /** Associated agent ID (if any) */
  agent_id?: string;
  /** Associated agent name (if any) */
  agent_name?: string;
  /** Error message */
  message: string;
  /** Stack trace (if available) */
  stack_trace?: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Whether this error can be retried */
  is_retryable: boolean;
}

/**
 * Task retry request payload
 */
export interface TaskRetryRequest {
  /** Optional reason for retry */
  reason?: string;
}

/**
 * Task retry response
 */
export interface TaskRetryResponse {
  /** Task ID that was retried */
  task_id: string;
  /** Current task status after retry */
  status: string;
  /** Response message */
  message: string;
  /** Number of retry attempts */
  retry_count: number;
}

/**
 * Task cancel response
 */
export interface TaskCancelResponse {
  /** Task ID that was cancelled */
  task_id: string;
  /** Current task status after cancellation */
  status: string;
  /** Response message */
  message: string;
}

/**
 * Task retry event (WebSocket broadcast)
 *
 * Matches Rust type: TaskRetryEvent in crates/miyabi-a2a/src/http/websocket.rs
 */
export interface TaskRetryEvent {
  /** Task ID being retried */
  task_id: string;
  /** Current retry attempt number (after increment) */
  retry_count: number;
  /** Reason for retry (if provided) */
  reason?: string;
  /** Next retry timestamp (exponential backoff) */
  next_retry_at?: string;
  /** Timestamp when retry was triggered */
  timestamp: string;
}

/**
 * Task cancel event (WebSocket broadcast)
 *
 * Matches Rust type: TaskCancelEvent in crates/miyabi-a2a/src/http/websocket.rs
 */
export interface TaskCancelEvent {
  /** Task ID being cancelled */
  task_id: string;
  /** Reason for cancellation */
  reason: string;
  /** Timestamp when cancellation was triggered */
  timestamp: string;
}

/**
 * Dashboard WebSocket update types
 */
export type DashboardUpdateType = 'agents' | 'systemstatus' | 'error' | 'taskretry' | 'taskcancel' | 'ping';

/**
 * WebSocket error update message
 */
export interface ErrorUpdate {
  type: 'error';
  error: ErrorInfo;
}

/**
 * Helper function to get severity color
 */
export function getSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Helper function to get severity icon
 */
export function getSeverityIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'critical':
      return 'lucide:x-circle';
    case 'high':
      return 'lucide:alert-circle';
    case 'medium':
      return 'lucide:alert-triangle';
    case 'low':
      return 'lucide:info';
    default:
      return 'lucide:alert-circle';
  }
}

/**
 * Helper function to format error timestamp
 */
export function formatErrorTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec}秒前`;
  } else if (diffMin < 60) {
    return `${diffMin}分前`;
  } else if (diffHour < 24) {
    return `${diffHour}時間前`;
  } else if (diffDay < 7) {
    return `${diffDay}日前`;
  } else {
    return date.toLocaleDateString('ja-JP');
  }
}
