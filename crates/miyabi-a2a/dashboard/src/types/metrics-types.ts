// Metrics data types for real-time chart visualization

/**
 * Single data point in the metrics timeline
 */
export interface MetricDataPoint {
  /** Timestamp in milliseconds since epoch */
  timestamp: number;

  /** Number of active tasks at this point in time */
  active_tasks: number;

  /** Number of queued tasks at this point in time */
  queued_tasks: number;

  /** Task throughput (tasks/hour) */
  task_throughput: number;

  /** Average completion time in seconds */
  avg_completion_time: number;

  /** Number of active agents */
  active_agents: number;
}

/**
 * Stored metrics history with metadata
 */
export interface MetricsHistory {
  /** Version for data migration */
  version: number;

  /** Array of metric data points (max 50) */
  data: MetricDataPoint[];

  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Chart configuration options
 */
export interface MetricsChartConfig {
  /** Show/hide individual metrics */
  visible: {
    active_tasks: boolean;
    queued_tasks: boolean;
    task_throughput: boolean;
    avg_completion_time: boolean;
    active_agents: boolean;
  };

  /** Chart height in pixels */
  height: number;

  /** Update interval in milliseconds */
  updateInterval: number;

  /** Maximum number of data points to display */
  maxDataPoints: number;

  /** Enable/disable animations */
  animationEnabled: boolean;
}

/**
 * Default chart configuration
 */
export const DEFAULT_METRICS_CONFIG: MetricsChartConfig = {
  visible: {
    active_tasks: true,
    queued_tasks: true,
    task_throughput: true,
    avg_completion_time: false, // Hidden by default to reduce clutter
    active_agents: false, // Hidden by default
  },
  height: 300,
  updateInterval: 60000, // 1 minute
  maxDataPoints: 50,
  animationEnabled: true,
};

/**
 * Metric display configuration
 */
export interface MetricDisplayConfig {
  key: keyof MetricDataPoint;
  label: string;
  color: string;
  unit: string;
  yAxisId?: 'left' | 'right';
}

/**
 * Available metrics for display
 */
export const AVAILABLE_METRICS: MetricDisplayConfig[] = [
  {
    key: 'active_tasks',
    label: 'Active Tasks',
    color: '#9353d3', // Primary purple
    unit: 'tasks',
    yAxisId: 'left',
  },
  {
    key: 'queued_tasks',
    label: 'Queued Tasks',
    color: '#f5a524', // Warning yellow
    unit: 'tasks',
    yAxisId: 'left',
  },
  {
    key: 'task_throughput',
    label: 'Throughput',
    color: '#10b981', // Success green
    unit: 'tasks/h',
    yAxisId: 'right',
  },
  {
    key: 'avg_completion_time',
    label: 'Avg Time',
    color: '#3b82f6', // Blue
    unit: 'sec',
    yAxisId: 'right',
  },
  {
    key: 'active_agents',
    label: 'Active Agents',
    color: '#ef4444', // Red
    unit: 'agents',
    yAxisId: 'left',
  },
];

/**
 * LocalStorage keys
 */
export const METRICS_STORAGE_KEYS = {
  HISTORY: 'miyabi-metrics-history',
  CONFIG: 'miyabi-metrics-config',
} as const;

/**
 * Metrics history version for data migration
 */
export const METRICS_HISTORY_VERSION = 1;

/**
 * Maximum number of data points to store
 */
export const MAX_DATA_POINTS = 50;
