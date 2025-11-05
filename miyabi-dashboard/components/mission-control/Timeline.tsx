'use client';

import React from 'react';
import { TimelineEvent } from '@/lib/mockData';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'info':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Timeline & Alerts</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className={`border-l-4 rounded-lg p-3 ${getEventColor(event.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {event.agent && (
                  <span className="text-xs font-semibold uppercase mb-1 block">
                    {event.agent}
                  </span>
                )}
                <p className="text-sm">{event.message}</p>
              </div>
              <span className="text-xs opacity-75 ml-2">{formatTime(event.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
      {events.length === 0 && (
        <p className="text-center text-gray-500 py-8">No events</p>
      )}
    </div>
  );
};

export default Timeline;
