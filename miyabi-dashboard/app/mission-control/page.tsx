'use client';

import React from 'react';
import AgentBoard from '@/components/mission-control/AgentBoard';
import TmaxlView from '@/components/mission-control/TmaxlView';
import Timeline from '@/components/mission-control/Timeline';
import ReferenceHub from '@/components/mission-control/ReferenceHub';
import {
  mockAgents,
  mockTmuxSessions,
  mockTimelineEvents,
  mockReferences
} from '@/lib/mockData';

export default function MissionControlPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Mission Control</h1>
              <p className="text-gray-400 text-sm mt-1">
                Miyabi AI Development Operations Platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">System Status</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-white font-medium">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Left: Agent Board */}
          <div>
            <AgentBoard agents={mockAgents} />
          </div>

          {/* Top Right: TMAXL Sessions */}
          <div>
            <TmaxlView sessions={mockTmuxSessions} />
          </div>

          {/* Bottom Left: Timeline & Alerts */}
          <div>
            <Timeline events={mockTimelineEvents} />
          </div>

          {/* Bottom Right: Reference Hub */}
          <div>
            <ReferenceHub references={mockReferences} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Mission Control Dashboard v1.0.0 | Prototype using mock data
          </p>
          <p className="mt-1">
            Ready for GraphQL/REST API integration
          </p>
        </div>
      </main>
    </div>
  );
}
