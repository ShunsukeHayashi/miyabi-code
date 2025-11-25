/**
 * System Status Cards Component
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

import type { SystemStatus } from '../../../types/miyabi';

interface Props {
  status: SystemStatus | null;
  isLoading: boolean;
}

export default function SystemStatusCards({ status, isLoading }: Props) {
  if (isLoading || !status) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
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

  const statusBg = {
    healthy: 'bg-green-100 dark:bg-green-900/30',
    degraded: 'bg-yellow-100 dark:bg-yellow-900/30',
    down: 'bg-red-100 dark:bg-red-900/30',
  };

  const cards = [
    {
      label: 'Agents Online',
      value: `${status.agentsOnline}/${status.agentsTotal}`,
      icon: '>',
      color: status.agentsOnline === status.agentsTotal ? 'text-green-500' : 'text-yellow-500',
      subtext: status.agentsOnline === status.agentsTotal ? 'All agents active' : 'Some agents offline',
    },
    {
      label: 'API Status',
      value: status.apiStatus.charAt(0).toUpperCase() + status.apiStatus.slice(1),
      icon: '=',
      color: statusColor[status.apiStatus],
      bg: statusBg[status.apiStatus],
      subtext: status.apiStatus === 'healthy' ? 'All systems operational' : 'Issues detected',
    },
    {
      label: 'Consultations Today',
      value: status.consultationsToday.toString(),
      icon: '=Ê',
      color: 'text-blue-500',
      subtext: 'Wisdom delivered',
    },
    {
      label: 'Avg Response Time',
      value: `${status.avgResponseTime}s`,
      icon: '¡',
      color: status.avgResponseTime < 2 ? 'text-green-500' : 'text-yellow-500',
      subtext: status.avgResponseTime < 2 ? 'Excellent performance' : 'Moderate latency',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${card.bg || ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {card.label}
            </span>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.subtext}</div>
        </div>
      ))}
    </div>
  );
}
