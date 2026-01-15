/**
 * Course Grid Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import { Grid, List, Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import CourseCard from './CourseCard';
import CourseFilter from './CourseFilter';
import CourseSearch from './CourseSearch';
import Pagination from './Pagination';
import { LoadingGrid } from '../shared/LoadingSpinner';
import { useCourses, useLocalStorage } from '../shared/hooks';
import type {
  CourseQuery,
  CourseCardMode} from '../shared/types';
import {
  CourseWithRelations,
  CourseLevel,
  CourseStatus,
  PaginationMeta,
} from '../shared/types';

interface CourseGridProps {
  initialFilters?: Partial<CourseQuery>;
  showFilters?: boolean;
  showSearch?: boolean;
  showSorting?: boolean;
  showViewToggle?: boolean;
  maxResults?: number;
  className?: string;
  onEnroll?: (courseId: string) => void;
}

export function CourseGrid({
  initialFilters = {},
  showFilters = true,
  showSearch = true,
  showSorting = true,
  showViewToggle = true,
  maxResults,
  className = '',
  onEnroll,
}: CourseGridProps) {
  // State management
  const [viewMode, setViewMode] = useLocalStorage<CourseCardMode>('courseViewMode', 'grid');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [query, setQuery] = useState<CourseQuery>({
    page: 1,
    limit: maxResults || 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: 'PUBLISHED',
    ...initialFilters,
  });

  // Fetch courses
  const {
    data: coursesResponse,
    isLoading,
    error,
    refetch,
  } = useCourses(query);

  const courses = coursesResponse?.data || [];
  const pagination = coursesResponse?.pagination;

  // Update query parameters
  const updateQuery = (updates: Partial<CourseQuery>) => {
    setQuery(prev => ({
      ...prev,
      ...updates,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    updateQuery({ q: searchTerm });
  };

  // Handle filter changes
  const handleFilterChange = (filters: Partial<CourseQuery>) => {
    updateQuery(filters);
  };

  // Handle sorting
  const handleSort = (sortBy: string) => {
    const sortOrder = query.sortBy === sortBy && query.sortOrder === 'desc' ? 'asc' : 'desc';
    updateQuery({ sortBy, sortOrder });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }));
  };

  // Sort options
  const sortOptions = [
    { label: 'Most Recent', value: 'createdAt' },
    { label: 'Most Popular', value: 'enrollmentsCount' },
    { label: 'Highest Rated', value: 'averageRating' },
    { label: 'Price: Low to High', value: 'price' },
    { label: 'Alphabetical', value: 'title' },
  ];

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <h3 className="text-red-400 font-semibold mb-2">Error Loading Courses</h3>
        <p className="text-gray-400 mb-4">Failed to load courses. Please try again.</p>
        <button
          onClick={() => refetch()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with search and controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 max-w-md">
            <CourseSearch
              onSearch={handleSearch}
              placeholder="Search courses..."
              initialValue={query.q || ''}
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Sort dropdown */}
          {showSorting && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select
                value={query.sortBy || 'createdAt'}
                onChange={(e) => handleSort(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort order toggle */}
              <button
                onClick={() => updateQuery({
                  sortOrder: query.sortOrder === 'asc' ? 'desc' : 'asc',
                })}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={`Sort ${query.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {query.sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
              </button>
            </div>
          )}

          {/* Filter toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${showFilterPanel
              ? 'bg-miyabi-blue text-white border-miyabi-blue'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-miyabi-blue'
            }
              `}
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          )}

          {/* View mode toggle */}
          {showViewToggle && (
            <div className="flex items-center bg-gray-800 rounded-lg border border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-miyabi-blue text-white' : 'text-gray-400'} transition-colors rounded-l-lg`}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-miyabi-blue text-white' : 'text-gray-400'} transition-colors rounded-r-lg`}
                title="List view"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && showFilterPanel && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <CourseFilter
            onFilterChange={handleFilterChange}
            currentFilters={query}
            onClose={() => setShowFilterPanel(false)}
          />
        </div>
      )}

      {/* Results header */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {pagination ? (
            `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} courses`
          ) : (
            `${courses.length} courses found`
          )}
        </span>

        {/* Active filters */}
        {(query.q || query.level || query.category) && (
          <div className="flex items-center gap-2">
            <span>Filters:</span>
            {query.q && (
              <span className="bg-miyabi-blue/20 text-miyabi-blue px-2 py-1 rounded-lg text-xs">
                "{query.q}"
              </span>
            )}
            {query.level && (
              <span className="bg-miyabi-purple/20 text-miyabi-purple px-2 py-1 rounded-lg text-xs">
                {query.level}
              </span>
            )}
            {query.category && (
              <span className="bg-miyabi-green/20 text-miyabi-green px-2 py-1 rounded-lg text-xs">
                {query.category}
              </span>
            )}
            <button
              onClick={() => setQuery({
                page: 1,
                limit: query.limit,
                sortBy: 'createdAt',
                sortOrder: 'desc',
                status: 'PUBLISHED',
              })}
              className="text-xs text-gray-500 hover:text-white underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <LoadingGrid count={query.limit || 12} />
      )}

      {/* Course grid/list */}
      {!isLoading && courses.length > 0 && (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              mode={viewMode}
              onEnroll={onEnroll}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && courses.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <Search size={48} className="mx-auto text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-6">
            {query.q
              ? `No courses match your search "${query.q}"`
              : 'No courses match your current filters'
            }
          </p>
          <button
            onClick={() => setQuery({
              page: 1,
              limit: query.limit,
              sortBy: 'createdAt',
              sortOrder: 'desc',
              status: 'PUBLISHED',
            })}
            className="bg-miyabi-blue text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Clear filters and show all courses
          </button>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            current={pagination.page}
            total={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export default CourseGrid;
