/**
 * Pagination Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  current: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({
  current,
  total,
  onPageChange,
  className = '',
  showQuickJumper = false,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  pageSize = 20,
  onPageSizeChange
}: PaginationProps) {
  // Calculate visible page numbers
  const getVisiblePages = (current: number, total: number): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 2; // Number of pages to show on each side of current page

    // Always show first page
    pages.push(1);

    // Calculate start and end of the middle section
    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push('...');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (end < total - 1) {
      pages.push('...');
    }

    // Always show last page (if different from first)
    if (total > 1) {
      pages.push(total);
    }

    return pages;
  };

  const visiblePages = getVisiblePages(current, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= total && page !== current) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (current > 1) {
      onPageChange(current - 1);
    }
  };

  const handleNext = () => {
    if (current < total) {
      onPageChange(current + 1);
    }
  };

  if (total <= 1) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Page size selector */}
      {showSizeChanger && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      )}

      {/* Main pagination */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={current === 1}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-colors duration-200
            ${current === 1
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="flex items-center justify-center w-10 h-10 text-gray-500">
                <MoreHorizontal size={18} />
              </span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg
                  font-medium transition-colors duration-200
                  ${page === current
                    ? 'bg-miyabi-blue text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }
                `}
                aria-label={`Page ${page}`}
                aria-current={page === current ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={current === total}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg
            transition-colors duration-200
            ${current === total
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }
          `}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick jumper */}
      {showQuickJumper && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Go to</span>
          <input
            type="number"
            min={1}
            max={total}
            className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-center focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value);
                if (value >= 1 && value <= total) {
                  handlePageChange(value);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            placeholder={current.toString()}
          />
        </div>
      )}
    </div>
  );
}

// Simple pagination for smaller use cases
export function SimplePagination({
  current,
  total,
  onPageChange,
  className = ''
}: Pick<PaginationProps, 'current' | 'total' | 'onPageChange' | 'className'>) {
  if (total <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          transition-colors duration-200
          ${current === 1
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }
        `}
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </button>

      <span className="text-gray-400 text-sm px-4">
        Page {current} of {total}
      </span>

      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          transition-colors duration-200
          ${current === total
            ? 'text-gray-500 cursor-not-allowed'
            : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }
        `}
      >
        <span>Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default Pagination;