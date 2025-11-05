'use client';

import React from 'react';
import { TmuxSession } from '@/lib/mockData';

interface TmaxlViewProps {
  sessions: TmuxSession[];
}

const TmaxlView: React.FC<TmaxlViewProps> = ({ sessions }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">TMAXL Sessions</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h3 className="font-semibold text-gray-800">{session.name}</h3>
                {session.attached && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Attached
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{formatDate(session.created)}</span>
            </div>
            <div className="flex space-x-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">{session.windows}</span> window
                {session.windows !== 1 && 's'}
              </div>
              <div>
                <span className="font-medium">{session.panes}</span> pane
                {session.panes !== 1 && 's'}
              </div>
            </div>
          </div>
        ))}
      </div>
      {sessions.length === 0 && (
        <p className="text-center text-gray-500 py-8">No active tmux sessions</p>
      )}
    </div>
  );
};

export default TmaxlView;
