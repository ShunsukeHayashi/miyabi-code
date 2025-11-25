/**
 * Miyabi Integration Dashboard
 * Issue: #1017 - Real-time Agent Activity Dashboard
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { TimeRange } from '../../types/miyabi';
import {
  mockSystemStatus,
  mockConsultations,
  mockAdvisorMetrics,
  mockDivisionMetrics,
  mockActivityStream,
} from '../../data/miyabi-mock';
import SystemStatusCards from './components/SystemStatusCards';
import RecentConsultationsFeed from './components/RecentConsultationsFeed';
import AdvisorPerformanceChart from './components/AdvisorPerformanceChart';
import DivisionMetricsPanel from './components/DivisionMetricsPanel';
import ActivityStream from './components/ActivityStream';

// Time Range Filter Component
function TimeRangeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}) {
  const options: { value: TimeRange; label: string }[] = [
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
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
            value === option.value
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Division Filter Component
function DivisionFilter({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const divisions = [
    { id: undefined, label: 'All Divisions', icon: '🏛️' },
    { id: 'divine-council', label: 'Divine Council', icon: '⚡' },
    { id: 'innovation-technology', label: 'Innovation', icon: '💡' },
    { id: 'leadership-management', label: 'Leadership', icon: '👑' },
    { id: 'strategy-philosophy', label: 'Strategy', icon: '🎯' },
    { id: 'art-communication', label: 'Art', icon: '🎨' },
  ];

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
    >
      {divisions.map((div) => (
        <option key={div.id || 'all'} value={div.id || ''}>
          {div.icon} {div.label}
        </option>
      ))}
    </select>
  );
}

export default function MiyabiIntegrationPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [divisionFilter, setDivisionFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh indicator
  const [lastRefresh, setLastRefresh] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter consultations by division
  const filteredConsultations = useMemo(() => {
    if (!divisionFilter) return mockConsultations;
    return mockConsultations.filter((c) =>
      c.advisorDivision.toLowerCase().includes(divisionFilter.replace('-', ' '))
    );
  }, [divisionFilter]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Miyabi Integration Dashboard
              </h1>
              <p className="text-gray-300">
                Real-time connection between Pantheon advisors and Miyabi Agent system
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-sm text-green-400">System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
            <DivisionFilter value={divisionFilter} onChange={setDivisionFilter} />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>

        {/* System Status Cards */}
        <div className="mb-8">
          <SystemStatusCards status={mockSystemStatus} isLoading={isLoading} />
        </div>

        {/* Division Metrics */}
        <div className="mb-8">
          <DivisionMetricsPanel metrics={mockDivisionMetrics} isLoading={isLoading} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Consultations */}
          <div className="lg:col-span-2">
            <RecentConsultationsFeed
              consultations={filteredConsultations}
              isLoading={isLoading}
            />
          </div>

          {/* Right Column - Activity & Performance */}
          <div className="space-y-8">
            <ActivityStream activities={mockActivityStream} isLoading={isLoading} />
          </div>
        </div>

        {/* Advisor Performance Section */}
        <div className="mt-8">
          <AdvisorPerformanceChart metrics={mockAdvisorMetrics} isLoading={isLoading} />
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Want to learn more about our advisors?</h2>
          <p className="text-amber-100 mb-6">
            Explore all 19 legendary advisors and their wisdom across 5 specialized divisions.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/advisors"
              className="px-6 py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Advisors
            </Link>
            <Link
              href="/divisions"
              className="px-6 py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors"
            >
              Explore Divisions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
