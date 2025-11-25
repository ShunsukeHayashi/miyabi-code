/**
 * Miyabi Integration Dashboard
 * Issue: #1017 - Real-time Agent Activity Dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { mockData } from '@/lib/api';
import type {
  SystemStatus,
  MiyabiConsultation,
  AdvisorMetrics,
  Activity,
} from '@/types/miyabi';

// ============================================================================
// System Status Cards
// ============================================================================

function SystemStatusCards({ status }: { status: SystemStatus | null }) {
  if (!status) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  const statusColor = {
    healthy: 'text-green-500',
    degraded: 'text-yellow-500',
    down: 'text-red-500',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-gray-400">Agents Online</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.agents_online}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-gray-400">API Status</p>
        <p className={`text-2xl font-bold capitalize ${statusColor[status.api_status]}`}>
          {status.api_status}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-gray-400">Consultations Today</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.consultations_today}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <p className="text-sm text-gray-500 dark:text-gray-400">Avg Response Time</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.avg_response_time}s</p>
      </div>
    </div>
  );
}

// ============================================================================
// Consultation Card
// ============================================================================

function ConsultationCard({ consultation }: { consultation: MiyabiConsultation }) {
  const resultColors = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const resultIcons = {
    success: '✅',
    in_progress: '🔄',
    failed: '❌',
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border-l-4 border-blue-500">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded ${resultColors[consultation.result]}`}>
              {resultIcons[consultation.result]} {consultation.result.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(consultation.created_at)}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 dark:text-white">{consultation.task_title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            <span className="font-medium">Advisor:</span> {consultation.advisor_name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
            &ldquo;{consultation.wisdom}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Recent Consultations Feed
// ============================================================================

function RecentConsultationsFeed({ consultations }: { consultations: MiyabiConsultation[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Consultations</h3>
      </div>
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {consultations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No consultations yet</p>
        ) : (
          consultations.map((c) => <ConsultationCard key={c.id} consultation={c} />)
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Advisor Performance
// ============================================================================

function AdvisorPerformance({ advisors }: { advisors: AdvisorMetrics[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advisor Performance</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {advisors.map((advisor) => (
            <div key={advisor.advisor_id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{advisor.advisor_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {advisor.consultation_count} consultations
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {advisor.success_rate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">success rate</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Activity Stream
// ============================================================================

function ActivityStream({ activities }: { activities: Activity[] }) {
  const typeIcons = {
    consultation_started: '🔄',
    consultation_completed: '✅',
    advisor_assigned: '👤',
    task_created: '📝',
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Stream</h3>
      </div>
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <span className="text-lg">{typeIcons[activity.type]}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">{activity.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(activity.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Time Range Filter
// ============================================================================

function TimeRangeFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: '1h' | '24h' | '7d' | '30d') => void;
}) {
  const options = [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value as '1h' | '24h' | '7d' | '30d')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Dashboard Page
// ============================================================================

export default function MiyabiIntegrationPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [consultations, setConsultations] = useState<MiyabiConsultation[]>([]);
  const [advisorMetrics, setAdvisorMetrics] = useState<AdvisorMetrics[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data (in production, use actual API calls)
    const loadData = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSystemStatus(mockData.systemStatus);
      setConsultations(mockData.consultations);
      setAdvisorMetrics(mockData.advisorMetrics);
      setActivities(mockData.activities);
      setIsLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Miyabi Integration Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time agent activity and consultation tracking
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* System Status */}
      <SystemStatusCards status={systemStatus} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <RecentConsultationsFeed consultations={consultations} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AdvisorPerformance advisors={advisorMetrics} />
          <ActivityStream activities={activities} />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Loading...
        </div>
      )}
    </div>
  );
}
