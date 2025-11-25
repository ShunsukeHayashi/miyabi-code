/**
 * Advisors Page - Searchable Directory
 * Issue: #1014 - Pantheon Webapp Advisors Page
 */

'use client';

import type { Metadata } from 'next';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { advisors } from '../../data/advisors';
import { DIVISIONS, type Division, type Advisor } from '../../types/advisor';

type SortField = 'name' | 'era' | 'division' | 'influence';
type ViewMode = 'grid' | 'list';

export default function AdvisorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivisions, setSelectedDivisions] = useState<Division[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('influence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  const filteredAdvisors = useMemo(() => {
    let result = [...advisors];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.nameJa.includes(searchQuery) ||
          a.specialties.some((s) => s.toLowerCase().includes(query))
      );
    }

    // Division filter
    if (selectedDivisions.length > 0) {
      result = result.filter((a) => selectedDivisions.includes(a.division));
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'era':
          comparison = a.eraYears.localeCompare(b.eraYears);
          break;
        case 'division':
          comparison = a.division.localeCompare(b.division);
          break;
        case 'influence':
          comparison = a.influenceScore - b.influenceScore;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, selectedDivisions, sortBy, sortOrder]);

  const toggleDivision = (division: Division) => {
    setSelectedDivisions((prev) =>
      prev.includes(division) ? prev.filter((d) => d !== division) : [...prev, division]
    );
  };

  const toggleComparison = (id: string) => {
    setComparisonIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const comparedAdvisors = advisors.filter((a) => comparisonIds.includes(a.id));

  const getDivisionColor = (division: Division): string => {
    const info = DIVISIONS.find((d) => d.name === division);
    return info?.color || 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏛️ Advisor Directory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore 19 legendary historical figures across 5 divisions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, Japanese name, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="influence">Influence Score</option>
                <option value="name">Name</option>
                <option value="era">Era</option>
                <option value="division">Division</option>
              </select>
              <button
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                ☰
              </button>
            </div>
          </div>

          {/* Division Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {DIVISIONS.map((division) => (
              <button
                key={division.name}
                onClick={() => toggleDivision(division.name)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedDivisions.includes(division.name)
                    ? `bg-${division.color}-500 text-white`
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={
                  selectedDivisions.includes(division.name)
                    ? { backgroundColor: getColorHex(division.color) }
                    : {}
                }
              >
                {division.icon} {division.name}
              </button>
            ))}
            {selectedDivisions.length > 0 && (
              <button
                onClick={() => setSelectedDivisions([])}
                className="px-3 py-1 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredAdvisors.length} of {advisors.length} advisors
          {comparisonIds.length > 0 && (
            <span className="ml-4 text-amber-600">
              {comparisonIds.length}/3 selected for comparison
            </span>
          )}
        </div>

        {/* Comparison Panel */}
        {comparisonIds.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Comparing {comparisonIds.length} Advisors
              </h3>
              <button
                onClick={() => setComparisonIds([])}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Clear
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedAdvisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white">{advisor.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{advisor.nameJa}</p>
                  <p className="text-sm mt-2">{advisor.division}</p>
                  <p className="text-sm">{advisor.eraYears}</p>
                  <p className="text-sm font-medium text-amber-600 mt-2">
                    Influence: {advisor.influenceScore}/100
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advisors Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAdvisors.map((advisor) => (
              <AdvisorCard
                key={advisor.id}
                advisor={advisor}
                isSelected={comparisonIds.includes(advisor.id)}
                onToggleComparison={() => toggleComparison(advisor.id)}
                canAddToComparison={comparisonIds.length < 3}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAdvisors.map((advisor) => (
              <AdvisorListItem
                key={advisor.id}
                advisor={advisor}
                isSelected={comparisonIds.includes(advisor.id)}
                onToggleComparison={() => toggleComparison(advisor.id)}
                canAddToComparison={comparisonIds.length < 3}
              />
            ))}
          </div>
        )}

        {filteredAdvisors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No advisors found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDivisions([]);
              }}
              className="mt-4 text-amber-600 hover:text-amber-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdvisorCard({
  advisor,
  isSelected,
  onToggleComparison,
  canAddToComparison,
}: {
  advisor: Advisor;
  isSelected: boolean;
  onToggleComparison: () => void;
  canAddToComparison: boolean;
}) {
  const divisionInfo = DIVISIONS.find((d) => d.name === advisor.division);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 ${
        isSelected ? 'ring-2 ring-amber-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{advisor.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">{advisor.nameJa}</p>
        </div>
        <span className="text-2xl">{advisor.countryFlag}</span>
      </div>

      <div className="mb-4">
        <span
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: getColorHex(divisionInfo?.color || 'gray') + '20', color: getColorHex(divisionInfo?.color || 'gray') }}
        >
          {divisionInfo?.icon} {advisor.division}
        </span>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
        <p>
          <strong>Era:</strong> {advisor.eraYears}
        </p>
        <p>
          <strong>Country:</strong> {advisor.country}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties:</p>
        <div className="flex flex-wrap gap-1">
          {advisor.specialties.map((specialty) => (
            <span
              key={specialty}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
            >
              {specialty}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Influence Score</span>
          <span className="font-bold text-amber-600">{advisor.influenceScore}/100</span>
        </div>
        <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full"
            style={{ width: `${advisor.influenceScore}%` }}
          />
        </div>
      </div>

      <p className="text-sm italic text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
        &ldquo;{advisor.quote}&rdquo;
      </p>

      <div className="flex gap-2">
        <Link
          href={`/advisors/${advisor.id}`}
          className="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
        >
          View Profile
        </Link>
        <button
          onClick={onToggleComparison}
          disabled={!isSelected && !canAddToComparison}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isSelected
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : canAddToComparison
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSelected ? '−' : '+'}
        </button>
      </div>
    </div>
  );
}

function AdvisorListItem({
  advisor,
  isSelected,
  onToggleComparison,
  canAddToComparison,
}: {
  advisor: Advisor;
  isSelected: boolean;
  onToggleComparison: () => void;
  canAddToComparison: boolean;
}) {
  const divisionInfo = DIVISIONS.find((d) => d.name === advisor.division);

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4 ${
        isSelected ? 'ring-2 ring-amber-500' : ''
      }`}
    >
      <div className="text-3xl">{advisor.countryFlag}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white">{advisor.name}</h3>
          <span className="text-gray-500 dark:text-gray-400">({advisor.nameJa})</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: getColorHex(divisionInfo?.color || 'gray') + '20', color: getColorHex(divisionInfo?.color || 'gray') }}
          >
            {divisionInfo?.icon} {advisor.division}
          </span>
          <span>{advisor.eraYears}</span>
          <span>{advisor.country}</span>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-amber-600">{advisor.influenceScore}</div>
        <div className="text-xs text-gray-500">Influence</div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/advisors/${advisor.id}`}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
        >
          View
        </Link>
        <button
          onClick={onToggleComparison}
          disabled={!isSelected && !canAddToComparison}
          className={`px-3 py-2 rounded-lg text-sm font-medium ${
            isSelected
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : canAddToComparison
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSelected ? '−' : '+'}
        </button>
      </div>
    </div>
  );
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    amber: '#F59E0B',
    red: '#EF4444',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    green: '#10B981',
    gray: '#6B7280',
  };
  return colors[color] || colors.gray;
}
