'use client';

import React, { useState } from 'react';
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
import { useAgentRealtime } from '@/lib/hooks/useAgentRealtime';

export default function MissionControlPage() {
  // Toggle between mock data and real-time WebSocket data
  const [useMockData, setUseMockData] = useState(true);

  // Use real-time agent updates with fallback to mock data
  const { agents, isConnected, lastUpdate, error, reconnect } = useAgentRealtime({
    initialAgents: mockAgents,
    enableMockData: useMockData,
  });

  // Use mock agents when mock mode is enabled, otherwise use real-time agents
  const displayAgents = useMockData ? mockAgents : agents;

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
              {/* WebSocket Connection Status */}
              {!useMockData && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">WebSocket Status</p>
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-white font-medium">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    {!isConnected && (
                      <button
                        onClick={reconnect}
                        className="ml-2 text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Reconnect
                      </button>
                    )}
                  </div>
                  {error && (
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                  )}
                </div>
              )}

              {/* System Status */}
              <div className="text-right">
                <p className="text-sm text-gray-400">System Status</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  <span className="text-white font-medium">Operational</span>
                </div>
              </div>

              {/* Mock Data Toggle */}
              <div className="flex items-center space-x-2">
                <label htmlFor="mock-toggle" className="text-sm text-gray-400">
                  Mock Data
                </label>
                <button
                  id="mock-toggle"
                  onClick={() => setUseMockData(!useMockData)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useMockData ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useMockData ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
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
            <AgentBoard
              agents={displayAgents}
              isConnected={useMockData ? undefined : isConnected}
              lastUpdate={useMockData ? undefined : lastUpdate}
            />
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
            Mission Control Dashboard v1.0.0 |{' '}
            {useMockData ? 'Using mock data' : 'Real-time WebSocket integration'}
          </p>
          <p className="mt-1">
            {useMockData
              ? 'Toggle "Mock Data" switch to enable WebSocket connection'
              : 'Connected to ws://localhost:9001'}
          </p>
        </div>
      </main>
    </div>
  );
}
